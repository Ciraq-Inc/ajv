// Smoke tests for the email-auth pages. The backend is fully mocked, so these check what
// the browser does with the links and forms, not the server (that has its own suite).
import { test, expect } from '@playwright/test';

// Same shape the backend issues: 43 base64url characters.
const tokenFor = (tag) => `${tag}_`.padEnd(43, 'x');

const VERIFY = tokenFor('verify');
const RESET = tokenFor('reset');
const STALE = tokenFor('stale');

const json = (route, status, body) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

// Only real API calls (path starting /api/) are mocked; the dev server's own module URLs
// must pass through untouched.
const api = (path) => (url) => url.pathname === `/api/${path}`;
const anyApi = (url) => url.pathname.startsWith('/api/');

// Anything the app asks for on start-up that a test did not mock answers 401, like a
// signed-out visitor. Tests then add their own routes on top.
test.beforeEach(async ({ page }) => {
  await page.route(anyApi, (route) => json(route, 401, { success: false, message: 'Unauthorized' }));
});

test.describe('verify email link', () => {
  test('redeems the token, shows success, and removes it from the address bar', async ({ page }) => {
    let sentToken = null;
    await page.route(api('auth/customer/email/verify'), (route) => {
      sentToken = route.request().postDataJSON().token;
      return json(route, 200, { success: true, data: { email: 'ama@example.com', email_verified: true } });
    });

    await page.goto(`/customer/verify-email#token=${VERIFY}`);

    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
    expect(sentToken).toBe(VERIFY);
    expect(page.url()).not.toContain(VERIFY);
  });

  test('an expired or used link says so and offers a way back', async ({ page }) => {
    await page.route(api('auth/customer/email/verify'), (route) =>
      json(route, 400, { success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token' }));

    await page.goto(`/customer/verify-email#token=${STALE}`);

    await expect(page.getByRole('heading', { name: /couldn't verify/i })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/invalid or has expired/i);
    expect(page.url()).not.toContain(STALE);
  });

  test('a link with no token never calls the server', async ({ page }) => {
    let called = false;
    await page.route(api('auth/customer/email/verify'), (route) => {
      called = true;
      return json(route, 200, { success: true });
    });

    await page.goto('/customer/verify-email');

    await expect(page.getByRole('heading', { name: /couldn't verify/i })).toBeVisible();
    expect(called).toBe(false);
  });
});

test.describe('customer password reset link', () => {
  test('sets a new password with the emailed token', async ({ page }) => {
    let body = null;
    await page.route(api('auth/customer/email/reset-password'), (route) => {
      body = route.request().postDataJSON();
      return json(route, 200, { success: true, message: 'Password updated' });
    });

    await page.goto(`/customer/reset-password#token=${RESET}`);
    await page.getByLabel('New password', { exact: true }).fill('a-long-new-password');
    await page.getByLabel('Confirm new password').fill('a-long-new-password');
    await page.getByRole('button', { name: 'Save new password' }).click();

    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
    expect(body).toEqual({ token: RESET, new_password: 'a-long-new-password' });
    expect(page.url()).not.toContain(RESET);
  });

  test('mismatched passwords are caught before anything is sent', async ({ page }) => {
    let called = false;
    await page.route(api('auth/customer/email/reset-password'), (route) => {
      called = true;
      return json(route, 200, { success: true });
    });

    await page.goto(`/customer/reset-password#token=${RESET}`);
    await page.getByLabel('New password', { exact: true }).fill('a-long-new-password');
    await page.getByLabel('Confirm new password').fill('something-else-entirely');
    await page.getByRole('button', { name: 'Save new password' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    expect(called).toBe(false);
  });

  test('an expired link offers a new one', async ({ page }) => {
    await page.route(api('auth/customer/email/reset-password'), (route) =>
      json(route, 400, { success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token' }));

    await page.goto(`/customer/reset-password#token=${STALE}`);
    await page.getByLabel('New password', { exact: true }).fill('a-long-new-password');
    await page.getByLabel('Confirm new password').fill('a-long-new-password');
    await page.getByRole('button', { name: 'Save new password' }).click();

    await expect(page.getByRole('heading', { name: /can't be used/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /request a new reset link/i })).toBeVisible();
  });
});

test.describe('admin sign-in', () => {
  test('"Forgot password?" opens the reset form and asks for a link without revealing anything', async ({ page }) => {
    let identifier = null;
    await page.route(api('admin/forgot-password'), (route) => {
      identifier = route.request().postDataJSON();
      return json(route, 200, { success: true, message: 'If an account exists, a reset link has been sent.' });
    });

    await page.goto('/admin/login');
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await page.locator('#resetIdentifier').fill('someone');
    await page.getByRole('button', { name: 'Send Reset Instructions' }).click();

    await expect(page.getByText(/sent|if an account exists/i).first()).toBeVisible();
    expect(JSON.stringify(identifier)).toContain('someone');
  });
});
