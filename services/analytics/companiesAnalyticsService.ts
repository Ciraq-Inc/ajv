// services/analytics/companiesAnalyticsService.ts
//
// Companies (admin) domain service. All HTTP for the admin Companies
// management UI (components/analytics/companies.vue) lives here. Public API:
// a single factory that takes an `api` (the useApi wrapper) and returns a
// plain object of async functions. Components import the factory, hand it
// `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-component fetch calls exactly:
// same paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller, not here.
//
// Note on scope: this is the admin-side companies CRUD/lookup service for
// the analytics dashboard. The public pharmacy lookups by id / domain slug
// continue to live in services/pharmacy/pharmacyService.ts — keeping these
// separate prevents accidental cross-wiring of the two flows.

import type { ApiInstance, ApiEnvelope, Company } from '../types';

export interface CompanyListParams {
  search?: string;
}

export interface CompanyUpdateData {
  domain_name?: string;
  whatsapp_number?: string;
  sender_id?: string;
  logo?: string;
  shop_banner?: string;
  [key: string]: unknown;
}

export const createCompaniesAnalyticsService = (api: ApiInstance) => ({
  /**
   * List all companies, optionally filtered by a search query string.
   * GET /api/companies                       (no query)
   * GET /api/companies/search?q=<term>       (with query)
   * The split-endpoint shape matches the legacy in-component behavior; the
   * server has a dedicated /search route that the bare /api/companies path
   * does not handle.
   */
  list({ search }: CompanyListParams = {}): Promise<ApiEnvelope<Company[]>> {
    if (search) {
      return api.get('/api/companies/search', { params: { q: search } });
    }
    return api.get('/api/companies');
  },

  /**
   * Create a new company. Body is the raw form object — keys are already in
   * snake_case at the field level (uiid, tel1, etc.) to match the server's
   * column names, so no conversion happens here.
   * POST /api/companies
   */
  create(companyData: Partial<Company> & Record<string, unknown>): Promise<ApiEnvelope<Company>> {
    return api.post('/api/companies', companyData);
  },

  /**
   * Update an existing company. The component sends a curated subset of
   * editable fields (domain_name, whatsapp_number, sender_id, logo,
   * shop_banner, and "more fields") so the body is passed through as-is.
   * PUT /api/companies/:id
   */
  update(companyId: number | string, updateData: CompanyUpdateData): Promise<ApiEnvelope<Company>> {
    return api.put(`/api/companies/${companyId}`, updateData);
  },

  /**
   * List subsidiary companies for a given main company.
   * GET /api/companies/:id/subsidiaries
   */
  listSubsidiaries(companyId: number | string): Promise<ApiEnvelope<Company[]>> {
    return api.get(`/api/companies/${companyId}/subsidiaries`);
  },

  /**
   * Delete a company by id. Kept for completeness — the legacy component
   * defines deleteCompany() but it isn't currently wired to a UI control.
   * DELETE /api/companies/:id
   */
  remove(companyId: number | string): Promise<ApiEnvelope<null>> {
    return api.delete(`/api/companies/${companyId}`);
  },
});
