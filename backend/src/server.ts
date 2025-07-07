import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';
import path from 'path';

// Import configurations
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import complianceRoutes from './routes/compliance.routes';
import metricsRoutes from './routes/metrics.routes';
import reportsRoutes from './routes/reports.routes';
import integrationsRoutes from './routes/integrations.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import userRoutes from './routes/user.routes';

// Load environment variables
dotenv.config();

// Initialize i18next
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    fallbackLng: 'pl',
    preload: ['pl', 'en'],
    ns: ['translation', 'errors', 'validation'],
    defaultNS: 'translation',
    detection: {
      order: ['header', 'querystring', 'cookie'],
      caches: ['cookie'],
    },
  });

// Initialize Sentry
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: express() }),
    ],
    tracesSampleRate: config.isDevelopment ? 1.0 : 0.1,
    environment: config.environment,
  });
}

class Server {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Sentry request handler
    if (config.sentry.dsn) {
      this.app.use(Sentry.Handlers.requestHandler());
      this.app.use(Sentry.Handlers.tracingHandler());
    }

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Request logging
    if (config.isDevelopment) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      }));
    }

    // Custom request logger
    this.app.use(requestLogger);

    // i18n middleware
    this.app.use(i18nextMiddleware.handle(i18next));

    // Rate limiting
    this.app.use('/api/', rateLimiter);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.environment,
        version: process.env.npm_package_version || '1.0.0',
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/organizations', organizationRoutes);
    this.app.use('/api/v1/compliance', complianceRoutes);
    this.app.use('/api/v1/metrics', metricsRoutes);
    this.app.use('/api/v1/reports', reportsRoutes);
    this.app.use('/api/v1/integrations', integrationsRoutes);
    this.app.use('/api/v1/recommendations', recommendationsRoutes);
    this.app.use('/api/v1/users', userRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: req.t('errors:notFound'),
        path: req.originalUrl,
      });
    });
  }

  private initializeErrorHandling(): void {
    // Sentry error handler
    if (config.sentry.dsn) {
      this.app.use(Sentry.Handlers.errorHandler());
    }

    // Custom error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      const { initializeDatabase } = await import('./config/database');
      await initializeDatabase();

      // Initialize Redis
      const { initializeRedis } = await import('./config/redis');
      await initializeRedis();

      // Initialize job queue
      const { initializeQueue } = await import('./config/queue');
      await initializeQueue();

      // Start server
      this.app.listen(this.port, () => {
        logger.info(`
          ################################################
          🚀 ESG Compliance Platform Server
          🌍 Environment: ${config.environment}
          🏃 Running on port: ${this.port}
          📅 Started at: ${new Date().toISOString()}
          ################################################
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Graceful shutdown initiated...');

    try {
      // Close server
      const server = this.app.listen();
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections
      const { closeDatabase } = await import('./config/database');
      await closeDatabase();

      // Close Redis connections
      const { closeRedis } = await import('./config/redis');
      await closeRedis();

      // Close job queue
      const { closeQueue } = await import('./config/queue');
      await closeQueue();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();
server.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

export default server.app;