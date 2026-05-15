// services/admin/adminService.js
//
// Admin domain service. All HTTP for admin auth, profile, password reset,
// and admin-user CRUD lives here. Public API: a single factory that takes
// an `api` (the useApi wrapper) and returns a plain object of async
// functions. Stores import the factory, hand it `useApi()`, and call the
// functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-store fetch calls exactly:
// same paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller (the store).
//
// Note on the generic `request(endpoint, options)` export: it exists to
// support the legacy `adminStore.makeAuthRequest(...)` helper, which is
// still consumed by ~9 components/pages outside this PR's scope. Once
// those callers migrate to dedicated services, this generic export and
// `makeAuthRequest` itself can be deleted. Tracked as a follow-up.

export const createAdminService = (api) => ({
  /**
   * Admin login with username + password.
   * POST /api/admin/login (public, no auth header)
   */
  login({ username, password }) {
    return api.post('/api/admin/login', { username, password });
  },

  /**
   * Fetch the current admin profile. Used by the store's token-verify
   * path on session restore.
   * GET /api/admin/profile (auth required)
   */
  getProfile() {
    return api.get('/api/admin/profile');
  },

  /**
   * Request a password-reset email/SMS for the given identifier
   * (username, email, or phone — server decides).
   * POST /api/admin/forgot-password (public)
   */
  requestPasswordReset({ identifier }) {
    return api.post('/api/admin/forgot-password', { identifier });
  },

  /**
   * Submit a new password using a previously-issued reset token.
   * POST /api/admin/reset-password (public)
   */
  resetPassword({ token, newPassword }) {
    return api.post('/api/admin/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  /**
   * List all admin accounts (super_admin only).
   * GET /api/admin/admins
   */
  listAdmins() {
    return api.get('/api/admin/admins');
  },

  /**
   * Create a new admin account (super_admin only).
   * POST /api/admin/admins
   */
  createAdmin(adminData) {
    return api.post('/api/admin/admins', adminData);
  },

  /**
   * Update an existing admin (super_admin only).
   * PUT /api/admin/admins/:id
   */
  updateAdmin(adminId, adminData) {
    return api.put(`/api/admin/admins/${adminId}`, adminData);
  },

  /**
   * Delete an admin (super_admin only).
   * DELETE /api/admin/admins/:id
   */
  deleteAdmin(adminId) {
    return api.delete(`/api/admin/admins/${adminId}`);
  },

  /**
   * Generic authenticated request used by the legacy
   * `adminStore.makeAuthRequest(endpoint, options)` helper. Thin
   * passthrough to `useApi`; the store wraps this to translate 401 into
   * `logout()` + a friendlier error. Other non-2xx responses now throw
   * (via `useApi`) instead of returning the envelope — a small behavior
   * change vs the legacy raw-fetch helper. Existing component callers
   * (~9 outside this PR's scope) already wrap their call sites in
   * try/catch, so the failure path lands in their catch instead of
   * `if (response.success === false)`. Tracked as a follow-up to migrate
   * those callers onto per-domain services so this generic helper can
   * be deleted entirely.
   */
  request(endpoint, options = {}) {
    return api.request(endpoint, options);
  },
});
