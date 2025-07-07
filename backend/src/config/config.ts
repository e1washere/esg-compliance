import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Define validation schema for environment variables
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),
  
  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  
  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM_EMAIL: Joi.string().email().required(),
  SMTP_FROM_NAME: Joi.string().default('ESG Compliance Platform'),
  
  // AWS
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_REGION: Joi.string().default('eu-central-1'),
  AWS_S3_BUCKET: Joi.string().required(),
  
  // Sentry
  SENTRY_DSN: Joi.string().allow(''),
  
  // Frontend URL
  FRONTEND_URL: Joi.string().required(),
  
  // API Keys
  OPENAI_API_KEY: Joi.string().allow(''),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Polish Utility Providers (example)
  TAURON_API_URL: Joi.string().allow(''),
  TAURON_API_KEY: Joi.string().allow(''),
  PGE_API_URL: Joi.string().allow(''),
  PGE_API_KEY: Joi.string().allow(''),
  ENEA_API_URL: Joi.string().allow(''),
  ENEA_API_KEY: Joi.string().allow(''),
  
  // Session
  SESSION_SECRET: Joi.string().required(),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
}).unknown();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  environment: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    pool: {
      min: 2,
      max: 10,
    },
  },
  
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    },
    from: {
      email: env.SMTP_FROM_EMAIL,
      name: env.SMTP_FROM_NAME,
    },
  },
  
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3: {
      bucket: env.AWS_S3_BUCKET,
    },
  },
  
  sentry: {
    dsn: env.SENTRY_DSN,
  },
  
  cors: {
    origins: env.FRONTEND_URL.split(',').map((url: string) => url.trim()),
  },
  
  api: {
    openai: {
      key: env.OPENAI_API_KEY,
    },
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  utilityProviders: {
    tauron: {
      apiUrl: env.TAURON_API_URL,
      apiKey: env.TAURON_API_KEY,
    },
    pge: {
      apiUrl: env.PGE_API_URL,
      apiKey: env.PGE_API_KEY,
    },
    enea: {
      apiUrl: env.ENEA_API_URL,
      apiKey: env.ENEA_API_KEY,
    },
  },
  
  session: {
    secret: env.SESSION_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
  
  // Polish-specific configurations
  poland: {
    timezone: 'Europe/Warsaw',
    locale: 'pl-PL',
    currency: 'PLN',
    dateFormat: 'DD.MM.YYYY',
    vatRate: 0.23, // 23% VAT
  },
  
  // Business rules
  business: {
    trialDurationDays: 14,
    subscriptionPlans: {
      basic: {
        maxOrganizations: 1,
        maxUsers: 5,
        maxReportsPerMonth: 10,
        price: 299, // PLN per month
      },
      professional: {
        maxOrganizations: 1,
        maxUsers: 20,
        maxReportsPerMonth: 50,
        price: 799, // PLN per month
      },
      enterprise: {
        maxOrganizations: -1, // unlimited
        maxUsers: -1, // unlimited
        maxReportsPerMonth: -1, // unlimited
        price: 2499, // PLN per month
      },
    },
  },
};

// Export type for config
export type Config = typeof config;