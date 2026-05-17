// services/adminOrders/adminOrdersService.ts
//
// Admin orders domain service. All HTTP for the admin/pharmacy orders
// dashboard (pages/admin/orders-new.vue) lives here. Public API: a
// single factory that takes an `api` (the useApi wrapper) and returns a
// plain object of async functions. Pages / stores import the factory,
// hand it `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-page fetch calls exactly:
// same paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller (the page).
//
// Note on scope: this service is admin-side; the customer-facing equivalent
// lives in services/orders/ordersService.ts. Endpoints overlap by URL
// (/api/orders, /api/orders/:id) but the customer flow always carries a
// company_id query param/body, whereas the admin dashboard does not — the
// server distinguishes by the bearer token's role. Keeping these as two
// separate services makes the caller's intent explicit and prevents
// accidental cross-wiring.

import type { ApiInstance, ApiEnvelope, Order, OrderStatus } from '../types';

export interface AdminOrderListParams {
  status?: OrderStatus | string;
  limit?: number | string;
}

export interface AdminOrderStatusUpdate {
  status: OrderStatus | string;
}

export const createAdminOrdersService = (api: ApiInstance) => ({
  /**
   * List orders for the admin dashboard with optional status + limit
   * filters. The legacy call built a URLSearchParams manually; useApi's
   * `params` option does the same with undefined-stripping for free.
   * GET /api/orders?status=&limit=
   */
  list({ status, limit }: AdminOrderListParams = {}): Promise<ApiEnvelope<Order[]>> {
    const params: Record<string, string | number> = {};
    if (status) params['status'] = status;
    if (limit !== undefined && limit !== null && limit !== '') {
      params['limit'] = limit;
    }
    return api.get('/api/orders', { params });
  },

  /**
   * Fetch a single order's details for the admin detail modal.
   * GET /api/orders/:orderId
   */
  getById(orderId: number | string): Promise<ApiEnvelope<Order>> {
    return api.get(`/api/orders/${orderId}`);
  },

  /**
   * Update an order's status (pending/confirmed/shipped/delivered/cancelled).
   * PUT /api/orders/:orderId/status
   */
  updateStatus(orderId: number | string, { status }: AdminOrderStatusUpdate): Promise<ApiEnvelope<Order>> {
    return api.put(`/api/orders/${orderId}/status`, { status });
  },
});
