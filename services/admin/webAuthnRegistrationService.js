// services/admin/webAuthnRegistrationService.js
//
// WebAuthn credential management service for authenticated super_admin users.
//
// Covers the full registration + management lifecycle:
//   1. getRegistrationOptions()          — GET /api/auth/webauthn/register/options
//   2. verifyRegistration(attestation)   — POST /api/auth/webauthn/register/verify
//   3. listCredentials()                 — GET /api/auth/webauthn/credentials
//   4. deleteCredential(id)              — DELETE /api/auth/webauthn/credentials/:id
//
// Factory pattern: identical to other services — inject useApi() at call-site.
//
// Security note: registration endpoints require a valid super_admin JWT and
// the CSRF double-submit cookie (enforced by the backend middleware). The
// service does not need to wire CSRF headers explicitly — useApi() reads the
// rgl_csrf cookie and injects X-CSRF-Token automatically if the caller is
// cookie-authenticated.

export const createWebAuthnRegistrationService = (api) => ({
  /**
   * Fetch registration options for the current authenticated super_admin.
   * The backend generates a WebAuthn challenge and stashes it in Redis.
   *
   * GET /api/auth/webauthn/register/options
   * Returns: { success, challenge_id, options }
   *   `options` is passed to navigator.credentials.create() by the caller.
   */
  getRegistrationOptions() {
    return api.get('/api/auth/webauthn/register/options');
  },

  /**
   * Submit the signed attestation to complete credential registration.
   *
   * POST /api/auth/webauthn/register/verify
   * Body: { challenge_id, attestation_response, friendly_name? }
   * Returns: { success, credential_id, message }
   */
  verifyRegistration(challengeId, attestationResponse, friendlyName) {
    return api.post('/api/auth/webauthn/register/verify', {
      challenge_id: challengeId,
      attestation_response: attestationResponse,
      friendly_name: friendlyName || null,
    });
  },

  /**
   * List the current user's registered WebAuthn credentials.
   * Returns credential metadata only — public keys are never sent to the client.
   *
   * GET /api/auth/webauthn/credentials
   * Returns: { success, credentials: [{ id, credential_id, friendly_name,
   *             transports, created_at, last_used_at }] }
   */
  listCredentials() {
    return api.get('/api/auth/webauthn/credentials');
  },

  /**
   * Delete a registered credential by its database row id.
   * The backend scopes the delete to the authenticated user — a super_admin
   * cannot delete another admin's credential even by guessing the id.
   *
   * DELETE /api/auth/webauthn/credentials/:id
   * Returns: { success, message }
   */
  deleteCredential(id) {
    return api.delete(`/api/auth/webauthn/credentials/${id}`);
  },
});
