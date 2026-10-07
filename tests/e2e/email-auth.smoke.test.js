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

test.describe('sign-up, sign-in and reset from one box', () => {
  const session = (phone = null) => ({
    success: true,
    data: {
      token: tokenFor('access'),
      master_customer: { id: 9, fname: 'Ama', lname: 'Mensah', phone, email: phone ? null : 'ama@example.com', email_verified: !phone },
      companies: [],
    },
  });

  const box = (page) => page.getByLabel('Phone number or email');
  const form = (page) => page.locator('form');

  const startSignup = async (page, typed) => {
    await page.goto('/');
    await box(page).fill(typed);
    await page.getByRole('button', { name: 'Send code' }).click();
  };

  const fillDetails = async (page, code = '123456') => {
    await page.getByLabel('First name').fill('Ama');
    await page.getByLabel('Last name').fill('Mensah');
    await page.getByLabel('Digit 1').click();
    await page.keyboard.type(code);
    await page.getByLabel('Create a password').fill('a-long-new-password');
  };

  test('an email gets a code by email, then the account is created with no phone', async ({ page }) => {
    let codeRequest = null;
    let registerBody = null;
    await page.route(api('auth/customer/email/send-signup-code'), (route) => {
      codeRequest = route.request().postDataJSON();
      return json(route, 200, { success: true });
    });
    await page.route(api('auth/customer/register'), (route) => {
      registerBody = route.request().postDataJSON();
      return json(route, 201, session());
    });

    await page.goto('/');
    await box(page).fill('ama@example.com');
    await expect(page.getByText("We'll email a 6-digit code to ama@example.com.")).toBeVisible();
    await page.getByRole('button', { name: 'Send code' }).click();

    await expect(page.getByText('Code sent to')).toContainText('ama@example.com');
    expect(codeRequest).toEqual({ email: 'ama@example.com' });

    await fillDetails(page);
    await form(page).getByRole('button', { name: 'Create account' }).click();

    await expect.poll(() => registerBody).not.toBeNull();
    expect(registerBody).toMatchObject({
      fname: 'Ama', lname: 'Mensah', email: 'ama@example.com', otp: '123456', password: 'a-long-new-password',
    });
    expect(registerBody).not.toHaveProperty('phone');
  });

  test('a Ghana number gets a text, and step 2 has only code, names and password', async ({ page }) => {
    let smsBody = null;
    let registerBody = null;
    await page.route(api('auth/customer/send-otp'), (route) => {
      smsBody = route.request().postDataJSON();
      return json(route, 200, { success: true });
    });
    await page.route(api('auth/customer/register'), (route) => {
      registerBody = route.request().postDataJSON();
      return json(route, 201, session('+233241234567'));
    });

    await startSignup(page, '024 123 4567');

    await expect(page.getByText('Code sent to')).toBeVisible();
    expect(smsBody).toEqual({ phone: '+233241234567' });
    // No second password box, no optional email, no checkboxes.
    await expect(form(page).getByLabel('Confirm password')).toHaveCount(0);
    await expect(form(page).getByLabel(/Email/)).toHaveCount(0);
    await expect(form(page).getByRole('checkbox')).toHaveCount(0);

    await fillDetails(page);
    await form(page).getByRole('button', { name: 'Create account' }).click();

    await expect.poll(() => registerBody).not.toBeNull();
    expect(registerBody).toMatchObject({ phone: '+233241234567', otp: '123456' });
    expect(registerBody).not.toHaveProperty('email');
  });

  test('a number from another country is told to use email and cannot be sent a text', async ({ page }) => {
    let smsRequested = false;
    await page.route(api('auth/customer/send-otp'), (route) => {
      smsRequested = true;
      return json(route, 200, { success: true });
    });

    await page.goto('/');
    await box(page).fill('+44 7911 123456');

    await expect(page.getByRole('status')).toContainText(/only reach Ghana numbers/i);
    await expect(page.getByRole('button', { name: 'Send code' })).toBeDisabled();
    expect(smsRequested).toBe(false);

    // Replacing it with an email unblocks the same button.
    await box(page).fill('ama@example.com');
    await expect(page.getByRole('button', { name: 'Send code' })).toBeEnabled();
  });

  test('nothing is sent until what is typed can be a phone or an email', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Send code' })).toBeDisabled();
    await box(page).fill('ama');
    await expect(page.getByRole('button', { name: 'Send code' })).toBeDisabled();
  });

  test('an address that cannot be an email is refused before any request is made', async ({ page }) => {
    let called = false;
    await page.route(api('auth/customer/email/send-signup-code'), (route) => {
      called = true;
      return json(route, 200, { success: true });
    });

    await startSignup(page, 'ama@');

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

    await startSignup(page, 'ama@example.com');
    await fillDetails(page, '000000');
    await form(page).getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid or expired code');

    await form(page).getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert')).toContainText(/Request a new code/i);
    await expect(page.getByLabel('Digit 1')).toHaveValue('');
  });

  test('resending an email code is blocked during the cooldown and shows the wait', async ({ page }) => {
    await page.route(api('auth/customer/email/send-signup-code'), (route) => json(route, 200, { success: true }));

    await startSignup(page, 'ama@example.com');

    const resend = page.getByRole('button', { name: /Resend code in \d+s/ });
    await expect(resend).toBeVisible();
    await expect(resend).toBeDisabled();
  });

  test('"Sign in" from sign-up carries what was typed, and an email signs in with email + password', async ({ page }) => {
    let loginBody = null;
    await page.route(api('auth/customer/login'), (route) => {
      loginBody = route.request().postDataJSON();
      return json(route, 200, session());
    });

    await page.goto('/');
    await box(page).fill('ama@example.com');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(box(page)).toHaveValue('ama@example.com');
    await page.getByLabel('Password', { exact: true }).fill('a-long-new-password');
    await form(page).getByRole('button', { name: 'Sign in' }).click();

    await expect.poll(() => loginBody).not.toBeNull();
    expect(loginBody).toEqual({ email: 'ama@example.com', password: 'a-long-new-password' });
  });

  test('forgot password uses the same box: an email gets a link', async ({ page }) => {
    let resetBody = null;
    await page.route(api('auth/customer/forgot-password'), (route) => {
      resetBody = route.request().postDataJSON();
      return json(route, 200, { success: true });
    });

    await page.goto('/');
    await box(page).fill('ama@example.com');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    await expect(box(page)).toHaveValue('ama@example.com');
    await expect(page.getByText(/email a reset link to ama@example.com/i)).toBeVisible();
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    expect(resetBody).toEqual({ email: 'ama@example.com' });
  });

  test('forgot password with a number from another country says to use email', async ({ page }) => {
    await page.goto('/');
    await box(page).fill('+44 7911 123456');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    await expect(page.getByRole('status')).toContainText(/only reach Ghana numbers/i);
    await expect(page.getByRole('button', { name: 'Send reset code' })).toBeDisabled();
  });

  test.describe('the agreement under "Send code"', () => {
    const agreement = (page) => form(page).getByText(/By continuing/);

    test('links only to pages that exist, and the Privacy Policy opens', async ({ page, request }) => {
      await page.goto('/');
      await expect(agreement(page)).toBeVisible();
      const hrefs = await agreement(page).locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));

      expect(hrefs).toEqual(['/privacy']);
      expect((await request.get('/privacy')).status()).toBe(200);
    });

    test('names the channel the order updates will come by', async ({ page }) => {
      await page.goto('/');
      await expect(agreement(page)).toContainText('order updates');

      await box(page).fill('ama@example.com');
      await expect(agreement(page)).toContainText('order updates by email');

      await box(page).fill('024 123 4567');
      await expect(agreement(page)).toContainText('order updates by text');
    });
  });
});

test.describe('request form for an email-only customer', () => {
  const emailOnly = { id: 9, fname: 'Ama', lname: 'Mensah', phone: null, email: 'ama@example.com', email_verified: true };

  // Signs the browser in the way the app persists a session, and answers the start-up calls.
  const signInAs = async (page, customer) => {
    await page.addInitScript(([c, token]) => {
      localStorage.setItem('masterCustomer', JSON.stringify(c));
      localStorage.setItem('customerAuthToken', token);
      localStorage.setItem('companies', '[]');
    }, [customer, tokenFor('access')]);
    // A signed-in customer's other start-up calls (orders, requests...) just return nothing.
    await page.route(anyApi, (route) => json(route, 200, { success: true, data: [] }));
    await page.route(api('auth/customer/profile'), (route) => json(route, 200, { success: true, data: customer }));
    await page.route(api('wallet'), (route) => json(route, 200, { success: true, data: { balance: 100 } }));
  };

  test('asks for a phone number and refuses one that is not valid', async ({ page }) => {
    await signInAs(page, emailOnly);
    await page.goto('/customer?tab=new');

    const phone = page.getByLabel(/Phone number we can reach you on/);
    await expect(phone).toBeVisible();

    await phone.fill('abc');
    await expect(page.getByText(/Include the country code/).first()).toBeVisible();

    await phone.fill('+44 7911 123456');
    await expect(page.getByText(/Enter a valid phone number/)).toHaveCount(0);
  });

  test('a customer whose account has a phone is not asked for one', async ({ page }) => {
    await signInAs(page, { ...emailOnly, phone: '+233241234567' });
    await page.goto('/customer?tab=new');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByLabel(/Phone number we can reach you on/)).toHaveCount(0);
  });
});
