// services/orders/ordersService.js
//
// Orders domain service. All HTTP for customer orders lives here.
// Public API: each export is a small named factory that returns a plain
// object of async functions. Stores/composables import the factory, hand
// it an `api` (the useApi wrapper), and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-store fetch calls exactly:
// same paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller, not here.

export const createOrdersService = (api) => ({
  /**
   * Create a customer order from cart items for a given pharmacy.
   * POST /api/orders
   */
  create({ companyId, items, notes }) {
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
  listForPharmacy({ companyId, status, limit, offset } = {}) {
    const params = {};
    if (companyId) params.company_id = companyId;
    if (status) params.status = status;
    if (limit !== undefined && limit !== null) params.limit = limit;
    if (offset !== undefined && offset !== null) params.offset = offset;
    return api.get('/api/orders', { params });
  },

  /**
   * All orders across pharmacies for the master customer.
   * GET /api/auth/customer/all-orders?status=&limit=&offset=
   */
  listAll({ status, limit, offset } = {}) {
    const params = {};
    if (status) params.status = status;
    if (limit !== undefined && limit !== null) params.limit = limit;
    if (offset !== undefined && offset !== null) params.offset = offset;
    return api.get('/api/auth/customer/all-orders', { params });
  },

  /**
   * Single order detail. company_id required by the API.
   * GET /api/orders/:orderId?company_id=
   */
  getById(orderId, { companyId } = {}) {
    const params = {};
    if (companyId) params.company_id = companyId;
    return api.get(`/api/orders/${orderId}`, { params });
  },

  /**
   * Cancel a customer order. Body carries company_id.
   * PUT /api/orders/:orderId/cancel
   */
  cancel(orderId, { companyId } = {}) {
    return api.put(`/api/orders/${orderId}/cancel`, { company_id: companyId });
  },
});
