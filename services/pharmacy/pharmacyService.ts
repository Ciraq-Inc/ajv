// services/pharmacy/pharmacyService.ts
//
// Pharmacy (company) domain service. All HTTP for public pharmacy lookups
// lives here.
//
// These endpoints are public (no auth required); `useApi` will simply
// omit the Authorization header when no token is present.

import type { ApiInstance, ApiEnvelope, Company, Product } from '../types';

export interface ListProductsParams {
  companyId?: number | string;
  page?: number;
  limit?: number;
  search?: string;
  /** Opaque cursor token for cursor-based pagination. Mutually exclusive with page. */
  cursor?: string;
}

export interface SaveProductPayload {
  id?: number | string;
  company_id: number | string;
  brand_name: string;
  unit?: string;
  sell_unit?: string;
  selling_price: number;
  stock_qty: number;
  is_active?: boolean;
  imageUrl?: string;
}

export const createPharmacyService = (api: ApiInstance) => ({
  /**
   * Fetch a single pharmacy (company) by numeric id.
   * GET /api/companies/:id
   */
  getById(companyId: number | string): Promise<ApiEnvelope<Company>> {
    return api.get(`/api/companies/${companyId}`);
  },

  /**
   * Fetch products for a pharmacy with paging + optional search.
   * GET /api/products?company_id=&page=&limit=&search=
   */
  listProducts({ companyId, page = 1, limit = 50, search = '', cursor }: ListProductsParams = {}): Promise<ApiEnvelope<Product[]>> {
    const params: Record<string, string | number> = { company_id: companyId ?? '', page, limit };
    if (search) params['search'] = search;
    if (cursor !== undefined && cursor !== null) params['cursor'] = cursor;
    return api.get('/api/products', { params });
  },

  /**
   * Resolve a pharmacy by domain slug.
   * GET /api/companies/domain/:slug
   */
  getByDomainSlug(slug: string): Promise<ApiEnvelope<Company>> {
    return api.get(`/api/companies/domain/${encodeURIComponent(slug)}`);
  },

  /**
   * Create or update a product for a pharmacy.
   * POST /products
   * Note: endpoint is at `/products` (not `/api/products`) — preserved
   * verbatim from the legacy page call.
   */
  saveProduct(payload: SaveProductPayload): Promise<ApiEnvelope<null>> {
    return api.post('/products', payload);
  },
});
