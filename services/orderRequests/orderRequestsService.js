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

  // -------------------------------------------------------------------------
  // Admin endpoints
  // -------------------------------------------------------------------------

  /**
   * List order requests for the admin dashboard with optional search.
   * GET /api/order-requests/admin?search=
   * Returns: { data: OrderRequest[] }
   */
  listAdmin({ search } = {}) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    const qs = params.toString()
    return api.get(`/api/order-requests/admin${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch aggregate stats for the admin order-requests dashboard.
   * GET /api/order-requests/admin/stats
   * Returns: { data: { pending, processing, completed, total, ... } }
   */
  getAdminStats() {
    return api.get('/api/order-requests/admin/stats')
  },

  /**
   * Fetch the pharmacy ledger for admin fulfillment.
   * GET /api/order-requests/admin/pharmacy-ledger?pharmacyId=&startDate=&endDate=&limit=
   * Returns: { data: { summary, pharmacies, selected_pharmacy, transactions } }
   */
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
