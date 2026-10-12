// services/companyUsers/companyUsersService.ts
//
// A pharmacy's own staff list: who they are, what role each has, and who may sign in online. Every
// call goes out with the company headers (`x-company-domain`, the staff token) from `getHeaders`,
// which `useApi` does not own.
//
// Pure HTTP: responses are handed back as the server sent them (`{ success, data, message }`).

import type { ApiInstance } from '../types';

export type HeadersProvider = () => Record<string, string>;

export interface CompanyUsersResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
}

type Options = { method?: string; headers?: Record<string, string>; body?: string };

export const createCompanyUsersService = (api: ApiInstance, getHeaders: HeadersProvider = () => ({})) => {
  const send = <T>(endpoint: string, options: Options = {}): Promise<CompanyUsersResponse<T>> =>
    (api.request as unknown as (e: string, o: Options) => Promise<CompanyUsersResponse<T>>)(endpoint, {
      ...options,
      headers: { ...getHeaders(), ...(options.headers ?? {}) },
    });

  const json = { 'Content-Type': 'application/json' };

  return {
    /** GET /api/company/users/access */
    listUsers: <T = unknown>() => send<T>('/api/company/users/access'),

    /** PUT /api/company/users/:id/role */
    setRole: (userId: number | string, role: string) =>
      send<unknown>(`/api/company/users/${String(userId)}/role`, { method: 'PUT', headers: json, body: JSON.stringify({ userrole: role }) }),

    /** PUT /api/company/users/:id/access */
    setAccess: (userId: number | string, allowed: boolean) =>
      send<unknown>(`/api/company/users/${String(userId)}/access`, {
        method: 'PUT',
        headers: json,
        body: JSON.stringify({ allowed_online_access: allowed }),
      }),
  };
};

export type CompanyUsersService = ReturnType<typeof createCompanyUsersService>;
