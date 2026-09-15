// services/ssoConsent/ssoConsentService.ts
//
// "Continue with MedsGH" — admin SSO for internal tools (rigelsupport etc).
// All HTTP for /api/sso/{authorize,consent} lives here, per
// docs/architecture/0001-service-layer.md. Deliberately separate from
// oauthConsentService.ts (customer-facing) — see
// rigel-medsgh/docs/architecture/0002-oauth-client-trust-boundary.md.
// No scopes, no consent decision: an authenticated admin session is the
// only input needed. pages/admin/oauth/authorize.vue owns the redirect.

import type { ApiInstance, ApiEnvelope } from '../types';

export interface SsoAuthorizeCheckResult {
  client_id: string;
  client_name: string;
  redirect_uri: string;
  state: string | null;
}

export interface SsoAuthorizeParams {
  clientId: string;
  redirectUri: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export interface SsoConsentResult {
  redirect_uri: string;
}

const toQuery = (p: SsoAuthorizeParams): Record<string, string> => {
  const q: Record<string, string> = {
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    code_challenge: p.codeChallenge,
    code_challenge_method: p.codeChallengeMethod,
  };
  if (p.state) q['state'] = p.state;
  return q;
};

export const createSsoConsentService = (api: ApiInstance) => ({
  /**
   * Validate the incoming params. GET /api/sso/authorize — public, no
   * admin session required.
   */
  check(params: SsoAuthorizeParams): Promise<ApiEnvelope<SsoAuthorizeCheckResult>> {
    return api.get('/api/sso/authorize', { params: toQuery(params) });
  },

  /**
   * Finalize authorization for the current admin session. Requires an
   * active admin session (useApi injects the Bearer token for
   * /api/sso/*). POST /api/sso/consent
   */
  consent(params: SsoAuthorizeParams): Promise<ApiEnvelope<SsoConsentResult>> {
    return api.post('/api/sso/consent', toQuery(params));
  },
});
