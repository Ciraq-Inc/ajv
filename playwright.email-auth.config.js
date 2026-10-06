import { defineConfig } from '@playwright/test';

// Email-auth smoke tests. Every API call is mocked inside the tests, so this needs only
// the dev server on port 4000: no backend, no global-setup login, no stored auth state.
//   npx playwright test -c playwright.email-auth.config.js
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/email-auth.smoke.test.js'],
  timeout: 45000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4000',
    headless: true,
    screenshot: 'only-on-failure',
  },
});
