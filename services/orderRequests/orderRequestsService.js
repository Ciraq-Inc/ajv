// services/orderRequests/orderRequestsService.js
//
// Order-requests domain service. All HTTP for customer-facing
// order-request endpoints (`/api/order-requests/*`) lives here. Public
// API: a factory that takes an `api` (the useApi wrapper) and returns
// a plain object of async functions. Callers (components, stores)
// import the factory, hand it `useApi()`, and call the functions.
//
// Public behavior MUST mirror the legacy in-component fetch calls
// exactly: same paths, same method, same body shape. Envelope handling
// (`{ success, data, message }`) is performed by the caller.

export const createOrderRequestsService = (api) => ({
  /**
   * List the authenticated customer's order requests across companies.
   * GET /api/order-requests/customer
   */
  listForCustomer() {
    return api.get('/api/order-requests/customer');
  },

  getCustomerSettings() {
    return api.get('/api/order-requests/customer/settings');
  },

  // Admin endpoints

  listForAdmin() {
    return api.get('/api/order-requests/admin');
  },

  listAdmin({ search } = {}) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    const qs = params.toString()
    return api.get(`/api/order-requests/admin${qs ? `?${qs}` : ''}`)
  },

  getAdminStats() {
    return api.get('/api/order-requests/admin/stats')
  },

  getPharmacyLedger({ pharmacyId, startDate, endDate, limit = 50 } = {}) {
    const params = new URLSearchParams()
    if (pharmacyId) params.set('pharmacyId', String(pharmacyId))
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    params.set('limit', String(limit))
    const qs = params.toString()
    return api.get(`/api/order-requests/admin/pharmacy-ledger${qs ? `?${qs}` : ''}`)
  },
});
