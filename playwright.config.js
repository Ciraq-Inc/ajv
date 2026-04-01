import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/sales-reports-mobile.test.js'],
  globalSetup: './tests/global-setup.js',
  timeout: 45000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4000',
    headless: true,
    screenshot: 'only-on-failure',
    storageState: 'tests/auth-state.json',
  },
});
