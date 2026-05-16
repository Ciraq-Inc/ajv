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
});
