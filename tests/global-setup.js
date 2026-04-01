import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:4000';

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/admin/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[placeholder="Enter your username"]', 'kissinger');
  await page.fill('input[placeholder="Enter your password"]', 'kissinger');
  await page.click('button:has-text("Sign In")');
  await page.waitForFunction(
    () => !window.location.pathname.includes('/admin/login'),
    { timeout: 30000 }
  );
  await page.waitForLoadState('domcontentloaded');

  await page.context().storageState({ path: 'tests/auth-state.json' });
  await browser.close();
}
