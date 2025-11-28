# Contributing to Kafkasder Panel

Thank you for your interest in contributing to Kafkasder Panel! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Report any issues or concerns

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm >= 9.0.0
- Git
- Appwrite hesabi (Cloud veya self-hosted)

### Setup

1. **Fork the repository**

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Kafkasder-panel.git
   cd Kafkasder-panel
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Example: `feat/add-user-profile-page`

### Making Changes

1. Create a new branch from `main`

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes

3. Run tests and linting

   ```bash
   npm run test:run
   npm run lint
   npm run typecheck
   ```

4. Commit your changes (see [Commit Guidelines](#commit-guidelines))

5. Push to your fork

   ```bash
   git push origin feat/your-feature-name
   ```

6. Create a Pull Request

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types or `unknown`
- Use type inference where possible
- Document complex types with JSDoc comments

### Code Style

- Follow ESLint rules (run `npm run lint`)
- Use Prettier for formatting (run `npm run format`)
- Maximum line length: 100 characters
- Use meaningful variable and function names

### File Organization

```
src/
├── components/     # React components
├── lib/           # Utility functions
├── hooks/          # Custom React hooks
├── stores/         # State management (Zustand)
├── types/          # TypeScript type definitions
└── app/            # Next.js app router pages
```

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for props

Example:

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // Component implementation
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
feat(auth): add 2FA authentication
fix(api): resolve rate limiting issue
docs(readme): update installation instructions
refactor(components): extract common button logic
test(hooks): add tests for useDebounce hook
```

### Commit Message Best Practices

- Use imperative mood ("add" not "added")
- Keep subject line under 50 characters
- Capitalize first letter
- No period at the end
- Reference issues/PRs in footer: `Closes #123`

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`npm run test:run`)
2. ✅ No linting errors (`npm run lint`)
3. ✅ TypeScript compiles (`npm run typecheck`)
4. ✅ Code is formatted (`npm run format`)
5. ✅ Documentation updated (if needed)
6. ✅ No console.log statements (use logger)

### PR Title Format

Follow the same format as commit messages:

```
feat(auth): add 2FA authentication
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests (if applicable)

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass
```

### Review Process

1. PR will be reviewed by maintainers
2. Address any feedback or requested changes
3. Once approved, PR will be merged
4. Auto-merge is enabled for approved PRs with passing checks

## Testing

### Running Tests

```bash
# Watch mode (development)
npm run test

# Run once (CI mode)
npm run test:run

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Writing Tests

- Write tests for new features
- Aim for >30% code coverage
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Test edge cases and error scenarios

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/format';

describe('formatCurrency', () => {
  it('should format positive numbers', () => {
    expect(formatCurrency(1000)).toBe('1.000,00 ₺');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('0,00 ₺');
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Document complex algorithms
- Explain "why" not just "what"

Example:

```typescript
/**
 * Formats a date according to Turkish locale
 * @param date - Date to format
 * @param format - Format string (default: 'dd/MM/yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date, format = 'dd/MM/yyyy'): string {
  // Implementation
}
```

### README Updates

- Update README.md for user-facing changes
- Update CLAUDE.md for developer-facing changes
- Keep examples up to date

## Getting Help

- Check existing issues and PRs
- Ask questions in discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Kafkasder Panel! 🎉
