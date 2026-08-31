// services/oauthConsent/oauthConsentService.ts
//
// "Sign in with MedsGH" — third-party OAuth consent domain service. All HTTP
// for /api/oauth/{authorize,consent,connected-apps} lives here. Pure HTTP,
// per docs/architecture/0001-service-layer.md — no Pinia, no navigation,
// no try/catch. The page (pages/oauth/authorize.vue) owns the redirect and
// error handling.

import type { ApiInstance, ApiEnvelope } from '../types';

export interface RequestedScope {
  scope: string;
  label: string;
}

export interface AuthorizeCheckResult {
  client_id: string;
  client_name: string;
  redirect_uri: string;
  state: string | null;
  code_challenge: string;
  code_challenge_method: string;
  requested_scopes: RequestedScope[];
  authenticated: boolean;
  skip_consent: boolean;
}

export interface AuthorizeParams {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export interface ConsentParams extends AuthorizeParams {
  allow: boolean;
}

export interface ConsentResult {
  redirect_uri: string;
}

export interface ConnectedApp {
  client_id: string;
  name: string;
  granted_scopes: string;
  granted_at: string;
}

const toQuery = (p: AuthorizeParams): Record<string, string> => {
  const q: Record<string, string> = {
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    code_challenge: p.codeChallenge,
    code_challenge_method: p.codeChallengeMethod,
  };
  if (p.scope) q['scope'] = p.scope;
  if (p.state) q['state'] = p.state;
  return q;
};

export const createOauthConsentService = (api: ApiInstance) => ({
  /**
   * Validate the incoming OAuth params and find out whether a login/consent
   * screen needs to be shown at all.
   * GET /api/oauth/authorize
   */
  check(params: AuthorizeParams): Promise<ApiEnvelope<AuthorizeCheckResult>> {
    return api.get('/api/oauth/authorize', { params: toQuery(params) });
  },

  /**
   * Submit the customer's Allow/Deny decision. Requires an active customer
   * session (useApi injects the Bearer token for /api/oauth/*).
   * POST /api/oauth/consent
   */
  decide({ allow, ...params }: ConsentParams): Promise<ApiEnvelope<ConsentResult>> {
    return api.post('/api/oauth/consent', { ...toQuery(params), allow });
  },

  /**
   * List third-party apps the customer has granted access to.
   * GET /api/oauth/connected-apps
   */
  listConnectedApps(): Promise<ApiEnvelope<ConnectedApp[]>> {
    return api.get('/api/oauth/connected-apps');
  },

  /**
   * Revoke a previously granted app.
   * DELETE /api/oauth/connected-apps/:clientId
   */
  revokeConnectedApp(clientId: string): Promise<ApiEnvelope<null>> {
    return api.delete(`/api/oauth/connected-apps/${encodeURIComponent(clientId)}`);
  },
});
