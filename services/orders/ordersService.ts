// services/orders/ordersService.ts
//
// Orders domain service. All HTTP for customer orders lives here.
//
// Public behavior MUST mirror the legacy in-store fetch calls exactly:
// same paths, same method, same body shape.

import type { ApiInstance, ApiEnvelope, Order, OrderItem, OrderStatus } from '../types';

export interface CreateOrderParams {
  companyId: number | string;
  items: OrderItem[];
  notes?: string;
}

export interface ListForPharmacyParams {
  companyId?: number | string;
  status?: OrderStatus | string;
  limit?: number;
  offset?: number;
  /** Opaque cursor token for cursor-based pagination. Mutually exclusive with offset. */
  cursor?: string;
}

export interface ListAllParams {
  status?: OrderStatus | string;
  limit?: number;
  offset?: number;
  /** Opaque cursor token for cursor-based pagination. Mutually exclusive with offset. */
  cursor?: string;
}

export interface GetByIdParams {
  companyId?: number | string;
}

export interface CancelParams {
  companyId?: number | string;
}

export const createOrdersService = (api: ApiInstance) => ({
  /**
   * Create a customer order from cart items for a given pharmacy.
   * POST /api/orders
   */
  create({ companyId, items, notes }: CreateOrderParams): Promise<ApiEnvelope<Order>> {
    return api.post('/api/orders', {
      company_id: companyId,
      items,
      notes,
    });
  },

  /**
   * Order history scoped to a pharmacy (company_id) + optional filters.
   * GET /api/orders?company_id=&status=&limit=&offset=
   */
  listForPharmacy({ companyId, status, limit, offset, cursor }: ListForPharmacyParams = {}): Promise<ApiEnvelope<Order[]>> {
    const params: Record<string, string | number> = {};
    if (companyId) params['company_id'] = companyId;
    if (status) params['status'] = status;
    if (limit !== undefined && limit !== null) params['limit'] = limit;
    if (offset !== undefined && offset !== null) params['offset'] = offset;
    if (cursor !== undefined && cursor !== null) params['cursor'] = cursor;
    return api.get('/api/orders', { params });
  },

  /**
   * All orders across pharmacies for the master customer.
   * GET /api/auth/customer/all-orders?status=&limit=&offset=
   */
  listAll({ status, limit, offset, cursor }: ListAllParams = {}): Promise<ApiEnvelope<Order[]>> {
    const params: Record<string, string | number> = {};
    if (status) params['status'] = status;
    if (limit !== undefined && limit !== null) params['limit'] = limit;
    if (offset !== undefined && offset !== null) params['offset'] = offset;
    if (cursor !== undefined && cursor !== null) params['cursor'] = cursor;
    return api.get('/api/auth/customer/all-orders', { params });
  },

  /**
   * Single order detail. company_id required by the API.
   * GET /api/orders/:orderId?company_id=
   */
  getById(orderId: number | string, { companyId }: GetByIdParams = {}): Promise<ApiEnvelope<Order>> {
    const params: Record<string, string | number> = {};
    if (companyId) params['company_id'] = companyId;
    return api.get(`/api/orders/${orderId}`, { params });
  },

  /**
   * Cancel a customer order. Body carries company_id.
   * PUT /api/orders/:orderId/cancel
   */
  cancel(orderId: number | string, { companyId }: CancelParams = {}): Promise<ApiEnvelope<Order>> {
    return api.put(`/api/orders/${orderId}/cancel`, { company_id: companyId });
  },
});
