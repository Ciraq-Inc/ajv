// services/orderRequests/orderRequestsService.ts
//
// Order-requests domain service. All HTTP for customer-facing
// order-request endpoints (`/api/order-requests/*`) lives here.
//
// Public behavior MUST mirror the legacy in-component fetch calls
// exactly: same paths, same method, same body shape.

import type { ApiInstance, ApiEnvelope, OrderRequest, OrderRequestStats, PharmacyLedgerEntry } from '../types';

export interface OrderRequestListAdminParams {
  search?: string;
}

export interface PharmacyLedgerParams {
  pharmacyId?: number | string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface GuestSubmitParams {
  phone: string;
  items: Array<{ product_id?: number | string; product_name: string; quantity: number }>;
  customer_address?: string;
  customer_latitude?: number | null;
  customer_longitude?: number | null;
}

export interface GeoSuggestion {
  display_name: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface ReverseGeoResult {
  display_name: string;
  address?: Record<string, string>;
}

export interface GuestSubmitResult {
  request_id: number;
  request_number: string;
  is_new_customer: boolean;
}

export const createOrderRequestsService = (api: ApiInstance) => ({
  /**
   * Public — submit a request as a guest (phone only, no account required).
   * POST /api/order-requests/guest
   */
  submitAsGuest({ phone, items, customer_address, customer_latitude, customer_longitude }: GuestSubmitParams): Promise<ApiEnvelope<GuestSubmitResult>> {
    return api.post('/api/order-requests/guest', { phone, items, customer_address, customer_latitude, customer_longitude });
  },

  geocodeAddress(address: string): Promise<ApiEnvelope<GeoSuggestion[]>> {
    return api.get(`/api/order-requests/geocode-address?address=${encodeURIComponent(address)}`);
  },

  reverseGeocode(lat: number, lng: number): Promise<ApiEnvelope<ReverseGeoResult>> {
    return api.get(`/api/order-requests/reverse-geocode?lat=${lat}&lng=${lng}`);
  },

  /**
   * List the authenticated customer's order requests across companies.
   * GET /api/order-requests/customer
   */
  listForCustomer(): Promise<ApiEnvelope<OrderRequest[]>> {
    return api.get('/api/order-requests/customer');
  },

  getCustomerSettings(): Promise<ApiEnvelope<unknown>> {
    return api.get('/api/order-requests/customer/settings');
  },

  // Admin endpoints

  listForAdmin(): Promise<ApiEnvelope<OrderRequest[]>> {
    return api.get('/api/order-requests/admin');
  },

  listAdmin({ search }: OrderRequestListAdminParams = {}): Promise<ApiEnvelope<OrderRequest[]>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const qs = params.toString();
    return api.get(`/api/order-requests/admin${qs ? `?${qs}` : ''}`);
  },

  getAdminStats(): Promise<ApiEnvelope<OrderRequestStats>> {
    return api.get('/api/order-requests/admin/stats');
  },

  getPharmacyLedger({ pharmacyId, startDate, endDate, limit = 50 }: PharmacyLedgerParams = {}): Promise<ApiEnvelope<PharmacyLedgerEntry[]>> {
    const params = new URLSearchParams();
    if (pharmacyId) params.set('pharmacyId', String(pharmacyId));
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('limit', String(limit));
    const qs = params.toString();
    return api.get(`/api/order-requests/admin/pharmacy-ledger${qs ? `?${qs}` : ''}`);
  },

  searchProducts({ q, lat, lng }: SearchProductsParams = {}): Promise<ApiEnvelope<unknown[]>> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (lat != null) params.set('lat', String(lat));
    if (lng != null) params.set('lng', String(lng));
    const qs = params.toString();
    return api.get(`/api/order-requests/customer/search-products${qs ? `?${qs}` : ''}`);
  },
});

export interface SearchProductsParams {
  q?: string;
  lat?: number | string | null;
  lng?: number | string | null;
}
