// services/admin/accessService.ts
//
// What a platform admin does to open or close a pharmacy's doors: issue and revoke a company's API
// keys, and switch staff members' online access on or off, one at a time or in bulk, across every
// company. These calls used to go through the generic `adminStore.makeAuthRequest(url, options)`.
//
// Pure HTTP: responses are handed back as the server sent them (`{ success, data, message }`), and
// the caller decides what a refusal means. Session handling (no token, expired token) is not done
// here — see composables/useAdminAccess.ts.

import type { ApiInstance } from '../types';

export interface AccessResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
}

export interface NewApiKey {
  keyName: string;
  /** An empty string means the key does not expire. */
  expiresAt?: string;
}

export interface TenantUserChanges {
  lname?: string;
  sname?: string;
  mname?: string;
  email?: string;
  tel?: string;
  userrole?: string;
  isactive?: boolean;
}

export const createAdminAccessService = (api: ApiInstance) => {
  const call = <T>(request: Promise<unknown>) => request as Promise<AccessResponse<T>>;

  return {
    /** GET /api/companies — the company picker */
    listCompanies: <T = unknown>() => call<T>(api.get('/api/companies')),

    /** GET /api/companies/:id/api-keys */
    listApiKeys: <T = unknown>(companyId: number | string) => call<T>(api.get(`/api/companies/${String(companyId)}/api-keys`)),

    /** GET /api/companies/:id/api-keys/stats */
    getApiKeyStats: <T = unknown>(companyId: number | string) => call<T>(api.get(`/api/companies/${String(companyId)}/api-keys/stats`)),

    /** POST /api/companies/:id/api-keys */
    createApiKey: <T = unknown>(companyId: number | string, { keyName, expiresAt }: NewApiKey) =>
      call<T>(
        api.post(`/api/companies/${String(companyId)}/api-keys`, {
          key_name: keyName,
          ...(expiresAt ? { expires_at: expiresAt } : {}),
        }),
      ),

    /** DELETE /api/companies/:id/api-keys/:keyId */
    deactivateApiKey: (companyId: number | string, keyId: number | string) =>
      call<unknown>(api.delete(`/api/companies/${String(companyId)}/api-keys/${String(keyId)}`)),

    /** GET /api/companies/:id/api-keys/:keyId/reveal */
    revealApiKey: <T = unknown>(companyId: number | string, keyId: number | string) =>
      call<T>(api.get(`/api/companies/${String(companyId)}/api-keys/${String(keyId)}/reveal`)),

    /** GET /api/admin/users/access — every company's staff, with stats */
    listTenantUsers: <T = unknown>() => call<T>(api.get('/api/admin/users/access')),

    /** PUT /api/admin/users/:id/access */
    setUserAccess: (userId: number | string, { companyId, allowed }: { companyId: number | undefined; allowed: boolean }) =>
      call<unknown>(api.put(`/api/admin/users/${String(userId)}/access`, { company_id: companyId, allowed_online_access: allowed })),

    /** PUT /api/admin/users/bulk-access */
    setBulkAccess: <T = unknown>(userIds: Array<number | string>, allowed: boolean) =>
      call<T>(api.put('/api/admin/users/bulk-access', { user_ids: userIds, allowed_online_access: allowed })),

    /** PUT /api/admin/users/:id — details, for the company the user belongs to */
    updateTenantUser: (userId: number | string, companyId: number | undefined, changes: TenantUserChanges) =>
      call<unknown>(api.put(`/api/admin/users/${String(userId)}`, { company_id: companyId, ...changes })),
  };
};

export type AdminAccessService = ReturnType<typeof createAdminAccessService>;
