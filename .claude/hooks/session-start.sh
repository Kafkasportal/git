#!/bin/bash
set -euo pipefail

# SessionStart hook for Claude Code on the web
# This script installs dependencies before the session starts

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Change to project directory
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Install npm dependencies
# Using npm install (not npm ci) to take advantage of container caching
if [ -f "package.json" ]; then
  echo "Installing npm dependencies..."
  npm install --prefer-offline --no-audit --no-fund
fi

# Install Playwright browsers for E2E tests (only chromium to save time)
if [ -f "package.json" ] && grep -q '"@playwright/test"' package.json; then
  echo "Installing Playwright browsers..."
  npx playwright install chromium --with-deps 2>/dev/null || true
fi

echo "Session startup complete!"
