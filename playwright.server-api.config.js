import { defineConfig } from '@playwright/test';
import { execPath } from 'node:process';

const port = 4011;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/server-api.test.js',
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    storageState: { cookies: [], origins: [] },
  },
  webServer: {
    command: `"${execPath}" node_modules/nuxt/bin/nuxt.mjs dev --port ${port} --host 127.0.0.1`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
