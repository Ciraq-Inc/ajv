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

test.describe('customer sign-up by email', () => {
  const session = () => ({
    success: true,
    data: {
      token: tokenFor('access'),
      master_customer: { id: 9, fname: 'Ama', lname: 'Mensah', phone: null, email: 'ama@example.com', email_verified: true },
      companies: [],
    },
  });

  const startEmailSignup = async (page, email = 'ama@example.com') => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Email', exact: true }).click();
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel(/I agree to receive order updates/).check();
    await page.getByRole('button', { name: 'Send verification code' }).click();
  };

  const fillDetails = async (page, code = '123456') => {
    await page.getByLabel('First name').fill('Ama');
    await page.getByLabel('Last name').fill('Mensah');
    await page.getByLabel('Digit 1').click();
    await page.keyboard.type(code);
    await page.getByLabel('Create a password').fill('a-long-new-password');
    await page.getByLabel('Confirm password').fill('a-long-new-password');
    await page.getByLabel(/18 years or older/).check();
  };

  test('emails a code, then creates the account with no phone number', async ({ page }) => {
    let codeRequest = null;
    let registerBody = null;
    await page.route(api('auth/customer/email/send-signup-code'), (route) => {
      codeRequest = route.request().postDataJSON();
      return json(route, 200, { success: true, message: 'If that address can be used, a code is on its way' });
    });
    await page.route(api('auth/customer/register'), (route) => {
      registerBody = route.request().postDataJSON();
      return json(route, 201, session());
    });

    await startEmailSignup(page);

    await expect(page.getByText('Code sent to')).toContainText('ama@example.com');
    expect(codeRequest).toEqual({ email: 'ama@example.com' });
    // The address is the account here, so there is no optional-email box to fill in.
    await expect(page.getByLabel(/^Email \(optional\)/)).toHaveCount(0);

    await fillDetails(page);
    await page.locator('form').getByRole('button', { name: 'Create account' }).click();

    await expect.poll(() => registerBody).not.toBeNull();
    expect(registerBody).toMatchObject({
      fname: 'Ama', lname: 'Mensah', email: 'ama@example.com', otp: '123456', password: 'a-long-new-password',
    });
    expect(registerBody).not.toHaveProperty('phone');
  });

  test('a Ghana number still gets its code by SMS, and the optional email box is still there', async ({ page }) => {
    let smsBody = null;
    await page.route(api('auth/customer/send-otp'), (route) => {
      smsBody = route.request().postDataJSON();
      return json(route, 200, { success: true });
    });
    let emailCodeRequested = false;
    await page.route(api('auth/customer/email/send-signup-code'), (route) => {
      emailCodeRequested = true;
      return json(route, 200, { success: true });
    });

    await page.goto('/');
    await page.getByLabel('Phone number').fill('24 123 4567');
    await page.getByLabel(/I agree to receive order updates and SMS/).check();
    await page.getByRole('button', { name: 'Send verification code' }).click();

    await expect(page.getByText('Code sent to')).toBeVisible();
    expect(smsBody).toEqual({ phone: '+233241234567' });
    expect(emailCodeRequested).toBe(false);
    await expect(page.getByLabel('Email (optional)')).toBeVisible();
  });

  test('typing a number that is not +233 moves to email and explains why, without texting anyone', async ({ page }) => {
    let smsRequested = false;
    await page.route(api('auth/customer/send-otp'), (route) => {
      smsRequested = true;
      return json(route, 200, { success: true });
    });

    await page.goto('/');
    await page.getByLabel('Phone number').fill('+44 7700 900123');

    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/SMS codes only work for Ghana numbers/i);
    await expect(page.getByLabel('Email address')).toHaveValue('');
    expect(smsRequested).toBe(false);
  });

  test('choosing "Other country" moves to email', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Country code').selectOption({ label: '🌍 Other country' });

    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('status')).toContainText(/Ghana numbers/i);
  });

  test('typing an @ into the phone box carries the text over to the email box', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Phone number').fill('ama@example.com');

    await expect(page.getByLabel('Email address')).toHaveValue('ama@example.com');
  });

  test('an address that cannot be an email is refused before any request is made', async ({ page }) => {
    let called = false;
    await page.route(api('auth/customer/email/send-signup-code'), (route) => {
      called = true;
      return json(route, 200, { success: true });
    });

    await startEmailSignup(page, 'not-an-email');

    await expect(page.getByText(/valid email address/i).first()).toBeVisible();
    expect(called).toBe(false);
  });

  test('a wrong code is explained and the form stays; too many guesses clear the boxes', async ({ page }) => {
    await page.route(api('auth/customer/email/send-signup-code'), (route) => json(route, 200, { success: true }));
    let attempts = 0;
    await page.route(api('auth/customer/register'), (route) => {
      attempts += 1;
      return attempts === 1
        ? json(route, 400, { success: false, message: 'Invalid or expired code' })
        : json(route, 429, { success: false, code: 'OTP_LOCKED', message: 'Too many attempts' });
    });

    await startEmailSignup(page);
    await fillDetails(page, '000000');
    await page.locator('form').getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid or expired code');

    await page.locator('form').getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toContainText(/Request a new code/i);
    await expect(page.getByLabel('Digit 1')).toHaveValue('');
  });

  test('resending is blocked during the cooldown and shows the wait', async ({ page }) => {
    await page.route(api('auth/customer/email/send-signup-code'), (route) => json(route, 200, { success: true }));

    await startEmailSignup(page);

    const resend = page.getByRole('button', { name: /Resend code in \d+s/ });
    await expect(resend).toBeVisible();
    await expect(resend).toBeDisabled();
  });

  test('"Sign in" from the sign-up card brings the typed email to the sign-in form', async ({ page }) => {
    await page.route(api('auth/customer/email/send-signup-code'), (route) => json(route, 200, { success: true }));

    await startEmailSignup(page);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.getByLabel('Email address')).toHaveValue('ama@example.com');
  });
});
