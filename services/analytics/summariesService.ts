// services/analytics/summariesService.ts
//
// Cross-tenant inventory analytics summary service. Houses the JSON
// fetches used by components/analytics/summaries.vue (stock value, top
// products, alerts). Public API: a single factory that takes an `api` (the
// useApi wrapper) and returns a plain object of async functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-component fetch calls exactly:
// same paths, same method, same query shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller, not here.
//
// Note on scope: components/analytics/inventory.vue uses these same
// endpoints via `adminStore.makeAuthRequest(...)`, which is already an
// authenticated wrapper (not a raw fetch). Migrating inventory.vue to this
// service is a follow-up; it would only swap the helper, not change the
// HTTP contract.

import type { ApiInstance, ApiEnvelope, CompositeStockValue, TopProduct, InventoryAlert } from '../types';

export type TopProductMetric = 'revenue' | 'quantity' | 'transactions';

export interface TopProductsParams {
  metric?: TopProductMetric;
  limit?: number;
}

export const createSummariesService = (api: ApiInstance) => ({
  /**
   * Composite stock-value summary across pharmacies.
   * GET /api/inventory-analytics/composite-stock-value
   */
  getCompositeStockValue(): Promise<ApiEnvelope<CompositeStockValue>> {
    return api.get('/api/inventory-analytics/composite-stock-value');
  },

  /**
   * Top performing products with metric + limit. Defaults match the legacy
   * summaries.vue call site (metric=revenue, limit=20).
   * GET /api/inventory-analytics/top-products?metric=&limit=
   */
  getTopProducts({ metric = 'revenue', limit = 20 }: TopProductsParams = {}): Promise<ApiEnvelope<TopProduct[]>> {
    return api.get('/api/inventory-analytics/top-products', {
      params: { metric, limit },
    });
  },

  /**
   * Inventory alerts (low stock, out of stock, expiring, expired).
   * GET /api/inventory-analytics/alerts
   */
  getAlerts(): Promise<ApiEnvelope<InventoryAlert[]>> {
    return api.get('/api/inventory-analytics/alerts');
  },
});
