import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: [
    '**/sales-reports-mobile.test.js',
    '**/professional-feature.test.js',
    '**/order-requests.test.js',
  ],
  globalSetup: './tests/global-setup.js',
  timeout: 45000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4000',
    headless: true,
    screenshot: 'only-on-failure',
    // Default storage state for tests that need admin auth (sales-reports etc).
    // professional-feature.test.js overrides this with an empty state via test.use().
    storageState: 'tests/auth-state.json',
  },
});
