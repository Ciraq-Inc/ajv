// services/companyAuth/companyAuthService.js
//
// Company auth domain service. All HTTP for the company-portal auth
// flows on `/api/company-auth/*` plus the authenticated
// company-store-settings GET (used by the company-theme bootstrap)
// lives here. Public API: a single factory that takes an `api` (the
// useApi wrapper) and a `getHeaders` provider (so callers can inject
// the `x-company-domain` header that `useApi` does not own) and
// returns a plain object of async functions. Stores import the
// factory, hand it `useApi()` + a header provider, and call the
// functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the company token) so the service stays
// framework-agnostic and trivially mockable in tests. The
// `getHeaders` callback is invoked per request so the
// `x-company-domain` header reflects the *current* URL at call time
// (the company portal switches subdomains/paths dynamically).
//
// IMPORTANT: This service is pure HTTP. It does NOT persist tokens,
// mutate Pinia state, or perform phone-number normalization. Those
// side-effects belong to the store — the service must remain a thin
// pipe so multiple callers (or tests) can attach different recovery
// behavior. Callers pass already-formatted E.164-like phone strings.
//
// Public behavior MUST mirror the legacy in-store fetch calls
// exactly: same paths, same method, same body shape. Response
// envelope handling (`{ success, data, message }`) is performed by
// the caller, not here. `useApi` throws on non-2xx responses; the
// `request(endpoint, options)` passthrough exists so the legacy
// `companyStore.makeAuthRequest(...)` helper consumed by many
// pharmacy-portal pages keeps the same call signature.

export const createCompanyAuthService = (api, getHeaders = () => ({})) => {
  // Wrap each call so the company-scoped headers (auth + x-company-domain)
  // are recomputed at request time. We merge into `options.headers` which
  // `useApi` already spreads on top of its own defaults.
  const withHeaders = (options = {}) => ({
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  return {
    /**
     * Check whether a phone number is already registered for the
     * current company.
     * POST /api/company-auth/check-phone
     */
    checkPhone({ phone }) {
      return api.post('/api/company-auth/check-phone', { phone }, withHeaders());
    },

    /**
     * Send a one-time password to a phone number for account setup.
     * POST /api/company-auth/send-otp
     */
    sendOtp({ phone }) {
      return api.post('/api/company-auth/send-otp', { phone }, withHeaders());
    },

    /**
     * Complete password setup after OTP verification.
     * POST /api/company-auth/setup-password
     */
    setupPassword({ phone, otp, password }) {
      return api.post(
        '/api/company-auth/setup-password',
        { phone, otp, password },
        withHeaders()
      );
    },

    /**
     * Log in with phone + password (company portal).
     * POST /api/company-auth/login
     */
    login({ phone, password }) {
      return api.post('/api/company-auth/login', { phone, password }, withHeaders());
    },

    /**
     * Register a recruiter + create the backing company in one shot.
     * Public endpoint — `getHeaders()` returns no Authorization token
     * pre-signup, so we still hit it with `withHeaders()` for
     * `x-company-domain` (when present).
     * POST /api/company-auth/recruiter-signup
     */
    recruiterSignup(payload) {
      return api.post('/api/company-auth/recruiter-signup', payload, withHeaders());
    },

    /**
     * Fetch the authenticated company user's profile.
     * GET /api/company-auth/profile
     */
    getProfile() {
      return api.get('/api/company-auth/profile', withHeaders());
    },

    /**
     * Change the authenticated company user's password.
     * POST /api/company-auth/change-password
     */
    changePassword({ currentPassword, newPassword }) {
      return api.post(
        '/api/company-auth/change-password',
        { current_password: currentPassword, new_password: newPassword },
        withHeaders()
      );
    },

    /**
     * Send a password-reset OTP to the given phone number.
     * POST /api/company-auth/request-password-reset
     */
    requestPasswordReset({ phone }) {
      return api.post(
        '/api/company-auth/request-password-reset',
        { phone },
        withHeaders()
      );
    },

    /**
     * Reset password using OTP delivered to phone.
     * POST /api/company-auth/reset-password
     */
    resetPassword({ phone, otp, newPassword }) {
      return api.post(
        '/api/company-auth/reset-password',
        { phone, otp, new_password: newPassword },
        withHeaders()
      );
    },

    /**
     * Fetch a company's public store-settings (theme preset / color).
     * Used by the company-portal theme bootstrap. The endpoint lives
     * under `/api/companies/:id/store-settings` rather than the
     * `/api/company-auth/*` block, but it is consumed exclusively by
     * the company-auth store on login/theme hydration — so it is
     * co-located here to keep the surface area on one PR.
     * GET /api/companies/:companyId/store-settings
     */
    getStoreSettings(companyId) {
      return api.get(`/api/companies/${companyId}/store-settings`, withHeaders());
    },

    /**
     * Generic authenticated request used by the legacy
     * `companyStore.makeAuthRequest(url, options)` helper. Thin
     * passthrough to `useApi`; the store wraps this so existing
     * pharmacy-portal pages (deliveries, riders, orders, wallet,
     * etc.) keep the same call signature. Other non-2xx responses now
     * throw (via `useApi`) instead of returning the raw envelope — a
     * small behavior change vs the legacy raw-fetch helper; the store
     * preserves the legacy return shape by surfacing the parsed
     * envelope on success. Tracked as a follow-up to migrate those
     * callers onto per-domain services so this generic helper can be
     * deleted entirely.
     */
    request(endpoint, options = {}) {
      return api.request(endpoint, withHeaders(options));
    },
  };
};
