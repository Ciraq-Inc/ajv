// services/customerAuth/customerAuthService.js
//
// Customer auth domain service. All HTTP for the master-customer auth
// flows on `/api/auth/customer/*` lives here. Public API: a single
// factory that takes an `api` (the useApi wrapper) and returns a plain
// object of async functions. Stores import the factory, hand it
// `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and pulls the customer token from
// `localStorage.customerAuthToken`) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// IMPORTANT: This service is pure HTTP. It does NOT persist tokens,
// mutate Pinia state, or call `applyCustomerAuthPayload`. Those
// side-effects belong to the store — the service must remain a thin
// pipe so multiple callers (or tests) can attach different recovery
// behavior. Phone-number formatting also lives in the store (it
// existed there before this refactor) so callers pass already-formatted
// E.164-like strings to this service.
//
// Public behavior MUST mirror the legacy in-store fetch calls exactly:
// same paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller, not here.
// `useApi` will inject the customer auth token automatically when one
// is present in localStorage; unauthenticated endpoints (login, OTP,
// password reset) work fine when no token is set.

export const createCustomerAuthService = (api) => ({
  /**
   * Check whether a phone number is already registered / verified.
   * POST /api/auth/customer/check-phone
   */
  checkPhone({ phone }) {
    return api.post('/api/auth/customer/check-phone', { phone });
  },

  /**
   * Send a one-time password to a phone number for account setup.
   * POST /api/auth/customer/send-otp
   */
  sendSetupOtp({ phone }) {
    return api.post('/api/auth/customer/send-otp', { phone });
  },

  /**
   * Complete password setup after OTP verification.
   * POST /api/auth/customer/setup-password
   */
  setupPassword({ phone, otp, password }) {
    return api.post('/api/auth/customer/setup-password', {
      phone,
      otp,
      password,
    });
  },

  /**
   * Register a new master customer (optionally linked to a company).
   * POST /api/auth/customer/register
   */
  register({ companyId, fname, lname, phone, password, email, otp }) {
    const body = {
      fname,
      lname,
      phone,
      password,
      email,
      otp,
    };
    if (companyId !== undefined && companyId !== null) {
      body.company_id = companyId;
    }
    return api.post('/api/auth/customer/register', body);
  },

  /**
   * Log in with phone + password.
   * POST /api/auth/customer/login
   */
  login({ phone, password }) {
    return api.post('/api/auth/customer/login', { phone, password });
  },

  /**
   * Fetch the linked companies for the authenticated master customer.
   * GET /api/auth/customer/my-companies
   */
  myCompanies() {
    return api.get('/api/auth/customer/my-companies');
  },

  /**
   * Trigger server-side linking sweep across companies for this
   * customer. Returns updated companies list in `data.companies`.
   * POST /api/auth/customer/trigger-linking
   */
  triggerLinking() {
    return api.post('/api/auth/customer/trigger-linking', {});
  },

  /**
   * Switch the active company context server-side. Returns a fresh
   * auth payload with a re-scoped token.
   * POST /api/auth/customer/switch-company
   */
  switchCompany({ companyId }) {
    return api.post('/api/auth/customer/switch-company', {
      company_id: companyId,
    });
  },

  /**
   * Fetch the authenticated customer's profile.
   * GET /api/auth/customer/profile
   */
  getProfile() {
    return api.get('/api/auth/customer/profile');
  },

  /**
   * Update the authenticated customer's profile. `profileData` is
   * passed through as-is — the server owns the schema.
   * PUT /api/auth/customer/profile
   */
  updateProfile(profileData) {
    return api.put('/api/auth/customer/profile', profileData);
  },

  /**
   * Change the authenticated customer's password.
   * POST /api/auth/customer/change-password
   */
  changePassword({ currentPassword, newPassword }) {
    return api.post('/api/auth/customer/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Send a password-reset OTP to the given phone number.
   * POST /api/auth/customer/forgot-password
   */
  sendResetOtp({ phone }) {
    return api.post('/api/auth/customer/forgot-password', { phone });
  },

  /**
   * Reset password using OTP delivered to phone.
   * POST /api/auth/customer/reset-password
   */
  resetPassword({ phone, otp, newPassword }) {
    return api.post('/api/auth/customer/reset-password', {
      phone,
      otp,
      new_password: newPassword,
    });
  },
});
