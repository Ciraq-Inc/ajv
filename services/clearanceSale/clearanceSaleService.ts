// services/clearanceSale/clearanceSaleService.ts
//
// Customer-facing clearance catalog. All HTTP for the clearance-deals page
// lives here.

import type { ApiInstance, ApiEnvelope } from '../types';

export interface ClearanceProduct {
  id: string | number;
  company_id: number;
  company_name: string | null;
  brand_name: string | null;
  product_description: string | null;
  unit: string | null;
  uniqid: string | null;
  original_price: number;
  clearance_price: number;
  discount_percent: number;
  available_quantity: number;
  expiry_date: string | null;
  image_url: string | null;
}

export interface ClearanceProductsPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ListClearanceProductsResult {
  products: ClearanceProduct[];
  pagination: ClearanceProductsPagination;
}

export interface ListClearanceProductsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const createClearanceSaleService = (api: ApiInstance) => ({
  /**
   * Platform-wide, currently-live clearance markdowns across all pharmacies.
   * GET /api/order-requests/customer/clearance-products?page=&limit=&search=
   */
  listClearanceProducts({ page = 1, limit = 24, search = '' }: ListClearanceProductsParams = {}): Promise<ApiEnvelope<ListClearanceProductsResult>> {
    const params: Record<string, string | number> = { page, limit };
    if (search) params['search'] = search;
    return api.get('/api/order-requests/customer/clearance-products', { params });
  },
});
