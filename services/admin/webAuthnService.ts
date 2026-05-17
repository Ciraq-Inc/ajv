// services/admin/webAuthnService.ts
//
// WebAuthn authentication service for the admin login flow.
//
// This service owns the two HTTP calls made during the login challenge:
//   1. getAuthenticationOptions(username)  — POST /api/auth/webauthn/authenticate/options
//      Returns { challenge_id, options } where `options` is passed directly
//      to navigator.credentials.get(). The caller is responsible for
//      calling the browser API and then passing the result to step 2.
//   2. verifyAuthentication(challengeId, assertion) — POST /api/auth/webauthn/authenticate/verify
//      Submits the signed assertion to the backend. On success the server
//      sets the HttpOnly session cookies and returns the token.
//
// Factory pattern: identical to adminService.ts — the caller injects
// useApi() so the service stays framework-agnostic and mockable.
//
// Threat note: the service never touches the WebAuthn challenge or assertion
// payload — it is a transparent courier. Validation happens on the backend.

import type { ApiInstance, ApiEnvelope } from '../types';

export interface WebAuthnAuthOptions {
  challenge_id: string;
  options: Record<string, unknown>;
}

export interface WebAuthnAuthVerifyResult {
  token: string;
  refresh_token?: string;
  audience?: string;
  user?: Record<string, unknown>;
  mfa_method?: string;
}

export const createWebAuthnService = (api: ApiInstance) => ({
  /**
   * Fetch WebAuthn authentication options for the given username.
   * The backend looks up the user's registered credentials and returns
   * allowCredentials + challenge.
   *
   * POST /api/auth/webauthn/authenticate/options
   * Body: { username }
   * Returns: { success, challenge_id, options }
   */
  getAuthenticationOptions(username: string): Promise<ApiEnvelope<WebAuthnAuthOptions>> {
    return api.post('/api/auth/webauthn/authenticate/options', { username });
  },

  /**
   * Submit the signed WebAuthn assertion to the backend.
   * On success the server issues the JWT and sets HttpOnly cookies.
   *
   * POST /api/auth/webauthn/authenticate/verify
   * Body: { challenge_id, assertion_response }
   * Returns: { success, token, refresh_token, audience, user, mfa_method }
   */
  verifyAuthentication(challengeId: string, assertionResponse: unknown): Promise<ApiEnvelope<WebAuthnAuthVerifyResult>> {
    return api.post('/api/auth/webauthn/authenticate/verify', {
      challenge_id: challengeId,
      assertion_response: assertionResponse,
    });
  },
});
