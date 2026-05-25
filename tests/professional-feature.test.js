// tests/professional-feature.test.js
//
// End-to-end tests for the Health Professional Verification feature.
//
// Prerequisites:
//   • Dev servers running: Nuxt (port 4000) and rigel-medsgh backend (port 3009).
//   • `npx playwright test tests/sales-reports-mobile.test.js` has been run at least
//     once to generate `tests/auth-state.json` (admin session for API calls).
//   • A test customer account exists. Supply credentials via env vars:
//       TEST_CUSTOMER_PHONE    (default: 0200000001)
//       TEST_CUSTOMER_PASSWORD (default: TestPass123!)
//
// Run this suite only:
//   npx playwright test tests/professional-feature.test.js --reporter=line

import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// ── Constants ─────────────────────────────────────────────────────────────────

const FRONTEND = 'http://localhost:4000';
const API      = 'http://localhost:3009';

const RAW_PHONE     = process.env.TEST_CUSTOMER_PHONE    || '0200000001';
const CUSTOMER_PASS = process.env.TEST_CUSTOMER_PASSWORD || 'TestPass123!';

// ── Shared suite state (populated in beforeAll) ───────────────────────────────

/** Customer login payload: { token, master_customer, companies, selected_company } */
let customerAuth = null;

/** Admin cookies serialised as a Cookie header value */
let adminCookieHeader = '';

/** CSRF token extracted from rgl_csrf cookie */
let csrfToken = '';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise a Ghanaian phone number to +233XXXXXXXXX */
function ghPhone(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('233')) return `+${d}`;
  if (d.startsWith('0'))   return `+233${d.slice(1)}`;
  return `+233${d}`;
}

/**
 * Inject customer auth tokens into page localStorage.
 * Must be called BEFORE page.goto() — it uses addInitScript.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} masterCustomerOverrides  Extra fields merged onto masterCustomer (e.g. professional_status).
 */
async function injectCustomerAuth(page, masterCustomerOverrides = {}) {
  await page.addInitScript((data) => {
    localStorage.setItem('customerAuthToken', data.token || '');
    localStorage.setItem('masterCustomer',    JSON.stringify(data.masterCustomer));
    localStorage.setItem('companies',         JSON.stringify(data.companies));
    localStorage.setItem('selectedCompany',   JSON.stringify(data.selectedCompany));
  }, {
    token:           customerAuth.token,
    masterCustomer:  { ...customerAuth.master_customer, ...masterCustomerOverrides },
    companies:       customerAuth.companies        || [],
    selectedCompany: customerAuth.selected_company || customerAuth.companies?.[0] || null,
  });
}

/**
 * Call the backend directly (bypassing the Nuxt proxy) using the admin session.
 * For unsafe methods the CSRF double-submit token is included automatically.
 */
async function adminFetch(method, path, body = null) {
  const headers = {
    'Content-Type':  'application/json',
    'Cookie':        adminCookieHeader,
    'X-CSRF-Token':  csrfToken,
  };
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

/** Find the test customer's professional application across all statuses. */
async function findApplication() {
  for (const status of ['pending', 'approved', 'rejected']) {
    const { ok, body } = await adminFetch('GET', `/api/professionals/admin?status=${status}&limit=100`);
    if (!ok) continue;
    const app = (body.data || []).find(a => a.master_customer_id === String(customerAuth.master_customer?.id));
    if (app) return app;
  }
  return null;
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe.serial('Health Professional Verification', () => {

  // Don't carry over the admin localStorage/cookies that global-setup wrote.
  test.use({ storageState: { cookies: [], origins: [] } });

  // ─────────────────────────────────────────────────────────────────────────
  test.beforeAll(async ({ request }) => {
    // 1. Log in as customer via the backend API (Bearer token, no CSRF needed).
    const loginRes = await request.post(`${API}/api/auth/customer/login`, {
      data: { phone: ghPhone(RAW_PHONE), password: CUSTOMER_PASS },
    });
    if (!loginRes.ok()) {
      throw new Error(`Customer login failed ${loginRes.status()}: ${await loginRes.text()}`);
    }
    const loginBody = await loginRes.json();
    customerAuth = loginBody.data;

    // 2. Load admin cookies + CSRF token from the pre-generated auth state.
    const authStateFile = 'tests/auth-state.json';
    if (!fs.existsSync(authStateFile)) {
      throw new Error(
        'tests/auth-state.json missing — run the sales-reports test first to generate admin auth:\n' +
        '  npx playwright test tests/sales-reports-mobile.test.js'
      );
    }
    const authState = JSON.parse(fs.readFileSync(authStateFile, 'utf-8'));
    adminCookieHeader = (authState.cookies || []).map(c => `${c.name}=${c.value}`).join('; ');
    csrfToken = authState.cookies?.find(c => c.name === 'rgl_csrf')?.value || '';

    // 3. Clean up any existing professional application so tests start fresh.
    const existing = await findApplication();
    if (existing && existing.status !== 'rejected') {
      await adminFetch('PUT', `/api/professionals/admin/${existing.id}/review`, {
        action: 'reject',
        rejection_reason: 'Test suite cleanup — resetting to initial state',
      });
    }
  });

  test.afterAll(async () => {
    // No resources to tear down; adminFetch uses plain fetch.
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK A — Application submission
  // ══════════════════════════════════════════════════════════════════════════

  test('A1: profile shows apply form when no application exists', async ({ page }) => {
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Health Professional Verification')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply for Professional Status' })).toBeVisible();
    // Both required fields are present
    await expect(page.locator('select').filter({ hasText: 'Select profession' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. MDC-2024-12345')).toBeVisible();
  });

  test('A2: customer fills and submits the application form', async ({ page }) => {
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Apply for Professional Status' })).toBeVisible({ timeout: 10000 });

    await page.locator('select').filter({ hasText: 'Select profession' }).selectOption('doctor');
    await page.getByPlaceholder('e.g. MDC-2024-12345').fill('MED-12345');
    await page.getByPlaceholder('e.g. Ghana Medical and Dental Council').fill('Ghana Medical Council');

    await page.getByRole('button', { name: 'Apply for Professional Status' }).click();

    // Inline success message then pending state appears
    await expect(page.getByText(/under review/i)).toBeVisible({ timeout: 10000 });
  });

  test('A3: profile reflects PENDING badge on fresh load after submission', async ({ page }) => {
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('.bg-amber-50').filter({ hasText: /pending/i })
    ).toBeVisible({ timeout: 10000 });

    // The apply form should be hidden while pending
    await expect(page.getByRole('button', { name: 'Apply for Professional Status' })).not.toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK B — Admin review
  // ══════════════════════════════════════════════════════════════════════════

  test('B1: admin can list pending applications', async () => {
    const { ok, body } = await adminFetch('GET', '/api/professionals/admin?status=pending&limit=100');
    expect(ok, `listing failed: ${JSON.stringify(body)}`).toBe(true);

    const app = (body.data || []).find(a => a.license_number === 'MED-12345');
    expect(app, 'expected to find MED-12345 in pending list').toBeDefined();
    expect(app.status).toBe('pending');
    expect(app.profession_type).toBe('doctor');
    expect(app.license_body).toBe('Ghana Medical Council');
  });

  test('B2: admin rejects application with a reason', async ({ page }) => {
    const { body: listBody } = await adminFetch('GET', '/api/professionals/admin?status=pending&limit=100');
    const app = (listBody.data || []).find(a => a.license_number === 'MED-12345');
    expect(app, 'pending application not found').toBeDefined();

    const { ok, body } = await adminFetch('PUT', `/api/professionals/admin/${app.id}/review`, {
      action: 'reject',
      rejection_reason: 'Use format GCMD-XXXXX for the license number.',
    });
    expect(ok, `reject failed: ${JSON.stringify(body)}`).toBe(true);

    // Customer profile should immediately show the rejected state
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('.bg-red-50').filter({ hasText: /rejected/i })
    ).toBeVisible({ timeout: 10000 });

    // Rejection reason is displayed
    await expect(page.getByText('GCMD-XXXXX')).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK C — Re-submission after rejection
  // ══════════════════════════════════════════════════════════════════════════

  test('C1: rejected state shows the resubmit form', async ({ page }) => {
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    // Rejection warning banner
    await expect(page.getByText(/previous application was rejected/i)).toBeVisible({ timeout: 10000 });
    // Re-submit button is present
    await expect(page.getByRole('button', { name: /re-submit application/i })).toBeVisible();
  });

  test('C2: customer resubmits with corrected license number', async ({ page }) => {
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /re-submit/i })).toBeVisible({ timeout: 10000 });

    const licenseInput = page.getByPlaceholder('e.g. MDC-2024-12345');
    await licenseInput.clear();
    await licenseInput.fill('GCMD-54321');

    await page.getByRole('button', { name: /re-submit/i }).click();

    // Returns to pending
    await expect(
      page.locator('.bg-amber-50').filter({ hasText: /pending/i })
    ).toBeVisible({ timeout: 10000 });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK D — Admin approval and approved state
  // ══════════════════════════════════════════════════════════════════════════

  test('D1: admin approves the resubmitted application', async () => {
    const { body: listBody } = await adminFetch('GET', '/api/professionals/admin?status=pending&limit=100');
    const app = (listBody.data || []).find(
      a => a.master_customer_id === String(customerAuth.master_customer?.id)
    );
    expect(app, 'resubmitted pending application not found').toBeDefined();

    const { ok, body } = await adminFetch('PUT', `/api/professionals/admin/${app.id}/review`, {
      action: 'approve',
    });
    expect(ok, `approve failed: ${JSON.stringify(body)}`).toBe(true);
    expect(body.success).toBe(true);
  });

  test('D2: profile shows APPROVED badge after approval', async ({ page }) => {
    await injectCustomerAuth(page);
    await page.goto(`${FRONTEND}/customer?tab=profile`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('.bg-emerald-50').filter({ hasText: /approved/i })
    ).toBeVisible({ timeout: 10000 });

    // Confirmation copy is shown
    await expect(page.getByText(/professional status is active/i)).toBeVisible();

    // No apply or resubmit buttons
    await expect(page.getByRole('button', { name: /apply for professional status/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /re-submit/i })).not.toBeVisible();
  });

  test('D3: profile API returns professional_status: approved', async () => {
    // Verify the backend reflects the approval correctly.
    const { ok, body } = await adminFetch('GET', '/api/professionals/admin?status=approved&limit=100');
    expect(ok).toBe(true);
    const app = (body.data || []).find(
      a => a.master_customer_id === String(customerAuth.master_customer?.id)
    );
    expect(app?.status).toBe('approved');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK E — Browse Stock tab gating
  // ══════════════════════════════════════════════════════════════════════════

  test('E1: Browse Stock tab is visible in nav for approved professional', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: 'approved' });
    await page.goto(`${FRONTEND}/customer`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Browse Stock' })).toBeVisible({ timeout: 10000 });
  });

  test('E2: Browse Stock tab is hidden for pending/unapproved user', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: 'pending' });
    await page.goto(`${FRONTEND}/customer`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Browse Stock' })).not.toBeVisible();
  });

  test('E3: navigating to ?tab=stock without approval renders nothing', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: null });
    await page.goto(`${FRONTEND}/customer?tab=stock`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Browse Pharmacy Stock')).not.toBeVisible();
  });

  test('E4: clicking Browse Stock navigates to the stock tab', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: 'approved' });
    await page.goto(`${FRONTEND}/customer`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Browse Stock' }).click();
    await expect(page.getByText('Browse Pharmacy Stock')).toBeVisible({ timeout: 10000 });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK F — Browse Stock component
  // ══════════════════════════════════════════════════════════════════════════

  test('F1: Browse Stock shows search input and prompt when location is saved', async ({ page }) => {
    await injectCustomerAuth(page, {
      professional_status: 'approved',
      latitude: 5.6037,
      longitude: -0.1870,
    });
    await page.goto(`${FRONTEND}/customer?tab=stock`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder(/search for a medication or product/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/search for a medication or product/i)).toBeEnabled();
    // Prompt to type is visible (no results yet)
    await expect(page.getByText(/type a medication name/i)).toBeVisible();
  });

  test('F2: Browse Stock shows location nudge when no coordinates are saved', async ({ page }) => {
    await injectCustomerAuth(page, {
      professional_status: 'approved',
      latitude: null,
      longitude: null,
    });
    await page.goto(`${FRONTEND}/customer?tab=stock`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Location required')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/search for a medication or product/i)).toBeDisabled();
  });

  test('F3: Browse Stock search triggers API call and renders results or empty state', async ({ page }) => {
    await injectCustomerAuth(page, {
      professional_status: 'approved',
      latitude: 5.6037,
      longitude: -0.1870,
    });
    await page.goto(`${FRONTEND}/customer?tab=stock`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search for a medication or product/i);
    await expect(searchInput).toBeEnabled({ timeout: 5000 });

    await searchInput.fill('paracetamol');

    // Wait for 300ms debounce + API round-trip
    await page.waitForTimeout(700);

    // Must not show an error state
    await expect(page.locator('.text-red-600.bg-red-50')).not.toBeVisible();

    // Must show either a result card or the "no results" empty state
    const resultCard  = page.locator('.space-y-3 .rounded-xl.border.border-zinc-200').first();
    const emptyState  = page.getByText(/no matching products found/i);
    const hasResult   = await resultCard.isVisible().catch(() => false);
    const hasEmpty    = await emptyState.isVisible().catch(() => false);

    expect(hasResult || hasEmpty, 'should show either results or empty state').toBe(true);
  });

  test('F4: clearing the search input resets to the prompt state', async ({ page }) => {
    await injectCustomerAuth(page, {
      professional_status: 'approved',
      latitude: 5.6037,
      longitude: -0.1870,
    });
    await page.goto(`${FRONTEND}/customer?tab=stock`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search for a medication or product/i);
    await searchInput.fill('paracetamol');
    await page.waitForTimeout(700);

    await searchInput.clear();
    await page.waitForTimeout(400);

    await expect(page.getByText(/type a medication name/i)).toBeVisible({ timeout: 5000 });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BLOCK G — Fee waiver
  // ══════════════════════════════════════════════════════════════════════════

  test('G1: order request settings API returns is_professional: true', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: 'approved' });

    let capturedSettings = null;
    await page.route('**/api/order-requests/customer/settings**', async route => {
      const res = await route.fetch();
      capturedSettings = await res.json();
      await route.fulfill({ response: res });
    });

    await page.goto(`${FRONTEND}/customer?tab=new`);
    await page.waitForLoadState('networkidle');

    expect(capturedSettings, 'settings API was never called').not.toBeNull();
    expect(capturedSettings.data?.is_professional).toBe(true);
  });

  test('G2: order request fee display shows "Free (Pro)" for approved professional', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: 'approved' });
    await page.goto(`${FRONTEND}/customer?tab=new`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Free (Pro)', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('G3: priority modal shows professional copy when opened', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: 'approved' });
    await page.goto(`${FRONTEND}/customer?tab=new`);
    await page.waitForLoadState('networkidle');

    // Open the priority/submit modal (the "Submit Request" or priority button)
    const priorityBtn = page.getByRole('button', { name: /submit|send request|priority/i }).first();
    await expect(priorityBtn).toBeVisible({ timeout: 15000 });
    await priorityBtn.click();

    await expect(
      page.getByText(/verified health professional.*no fee/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('G4: non-professional sees normal fee (not "Free (Pro)")', async ({ page }) => {
    await injectCustomerAuth(page, { professional_status: null });
    await page.goto(`${FRONTEND}/customer?tab=new`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Free (Pro)', { exact: false })).not.toBeVisible({ timeout: 10000 });
  });
});
