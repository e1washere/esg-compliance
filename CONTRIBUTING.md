# Contributing to ESG Compliance Platform

Dziękujemy za zainteresowanie rozwojem platformy ESG Compliance! / Thank you for your interest in contributing to the ESG Compliance Platform!

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/esg-compliance-platform.git
   cd esg-compliance-platform
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start infrastructure with Docker**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Install dependencies**
   ```bash
   npm run install:all
   ```

5. **Set up database**
   ```bash
   npm run db:setup
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   The backend will be available at http://localhost:3000 and frontend at http://localhost:5173

## 🏗️ Project Structure

```
esg-compliance-platform/
├── backend/               # Node.js/Express backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── tests/            # Backend tests
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── locales/      # Translation files
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── tests/            # Frontend tests
├── database/             # Database schemas and migrations
└── docs/                 # Documentation
```

## 📝 Code Style Guidelines

### General

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write meaningful commit messages in English
- Comment code in English (Polish comments are acceptable for business logic)

### Backend

- Follow RESTful API conventions
- Use async/await instead of callbacks
- Implement proper error handling
- Write unit tests for services
- Document API endpoints with comments

### Frontend

- Use functional components and hooks
- Follow React best practices
- Implement proper loading and error states
- Ensure responsive design
- Support Polish language as primary

### Git Workflow

1. Create a feature branch from `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

- Write unit tests for all business logic
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for >80% code coverage

## 🌐 Internationalization

- Primary language: Polish (pl)
- Secondary language: English (en)
- All UI text must be translatable
- Use i18next for translations
- Translation files are in `frontend/src/locales/`

## 📦 Dependencies

When adding new dependencies:

1. Justify why the dependency is needed
2. Check license compatibility (must be MIT, Apache 2.0, or similar)
3. Consider bundle size impact for frontend
4. Update both package.json and package-lock.json

## 🐛 Reporting Issues

1. Check existing issues first
2. Use issue templates
3. Provide clear reproduction steps
4. Include environment details
5. Add screenshots if applicable

## 🔒 Security

- Never commit sensitive data
- Use environment variables for secrets
- Follow OWASP security guidelines
- Report security issues privately to security@esg-compliance.pl

## 📄 Documentation

- Update README.md for significant changes
- Document new API endpoints
- Update TypeScript types
- Add JSDoc comments for complex functions
- Keep Polish business terminology documented

## 🎯 Pull Request Process

1. Update documentation
2. Add/update tests
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

## 📞 Getting Help

- Join our Discord: [invite link]
- Email: dev@esg-compliance.pl
- Check documentation: docs.esg-compliance.pl

## 🇵🇱 Polish Specific Guidelines

- Use Polish number formatting (space as thousand separator)
- Use Polish date format (DD.MM.YYYY)
- Support Polish characters (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- Follow Polish business terminology
- Consider Polish timezone (Europe/Warsaw)

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Dziękujemy za wkład w rozwój platformy! / Thank you for contributing!