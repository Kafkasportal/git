# Codacy Setup Guide

## Overview
This project is configured for automated code quality analysis and coverage reporting using Codacy.

## GitHub Actions Workflow

The CI/CD pipeline in `.github/workflows/codacy-analysis.yml` performs the following:

### 1. **Codacy Analysis Job**
- Checks out the code
- Installs dependencies
- Runs ESLint (linting)
- Runs TypeScript type checking
- Generates test coverage
- Runs Codacy static analysis
- Uploads coverage to Codacy

### 2. **Security Scan Job**
- Runs Trivy security scanner
- Uploads security findings to Codacy

## Required Secrets

To make the workflow functional, add the following secrets to your GitHub repository:

### `CODACY_PROJECT_TOKEN`
1. Go to your Codacy dashboard: https://app.codacy.com
2. Navigate to your project settings
3. Copy the **Project API token**
4. Go to GitHub repository Settings → Secrets and variables → Actions
5. Add new secret: `CODACY_PROJECT_TOKEN` with the copied token

## Codacy Configuration

The `.codacy.yaml` file defines:
- **Languages analyzed**: TypeScript, JavaScript, JSON
- **Excluded paths**: `node_modules`, `.next`, `coverage`, `dist`
- **Test files excluded**: `*.test.ts`, `*.spec.ts`, `__tests__` directories
- **Tools enabled**: ESLint
- **Coverage target**: 70% (lines, functions, branches, statements)

## Common Issues & Solutions

### "Commit not analyzed"
**Causes & Fixes**:
- ✅ **Codacy still analyzing**: Wait a few minutes for analysis to complete
- ✅ **Private repo, committer not in org**: Add all committers to Codacy organization
- ✅ **Newer commits exist**: Ensure coverage is uploaded for the latest commit
- ✅ **Build server analysis**: Verify client tools upload results successfully
- ✅ **Analysis error**: Check workflow logs and contact support if needed

### "Final report not sent"
**Cause**: Partial coverage uploaded without final notification
**Fix**: Ensure the workflow completes and sends final coverage report

## Workflow Triggers

The workflow runs on:
- **Push** to `main` or `develop` branches
- **Pull requests** targeting `main` or `develop`

## Test Coverage

Coverage is generated using Vitest and reported in LCOV format:
```bash
npm run test:coverage
```

Coverage reports are uploaded to Codacy automatically via the workflow.

## Manual Coverage Upload

If needed, you can manually upload coverage:
```bash
npm run test:coverage

# Using Codacy CLI (if installed)
codacy-coverage-reporter report \
  --project-token $CODACY_PROJECT_TOKEN \
  --coverage-reports coverage/lcov.info \
  --force-coverage-parser lcov
```

## Monitoring Code Quality

Visit your Codacy dashboard at:
```
https://app.codacy.com/gh/Kafkasportal/git
```

Track:
- Code quality grade
- Number of issues
- Code duplication
- Cyclomatic complexity
- Test coverage percentage

## Next Steps

1. ✅ Add `CODACY_PROJECT_TOKEN` to GitHub Secrets
2. ✅ Push changes to trigger the workflow
3. ✅ Monitor the workflow run in GitHub Actions
4. ✅ Check Codacy dashboard for analysis results
