// services/customerWallet/customerWalletService.js
//
// Customer wallet domain service. All HTTP for the customer-facing
// wallet endpoints (`/api/wallet/*`) lives here. Public API: a single
// factory that takes an `api` (the useApi wrapper) and returns a plain
// object of async functions. Callers (components, stores) import the
// factory, hand it `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and pulls the customer token from
// `localStorage.customerAuthToken`) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// IMPORTANT: This service is pure HTTP. It does NOT persist state,
// poll for payment status, or perform redirects. Envelope handling
// (`{ success, data, message }`) and the `authorization_url` redirect
// contract live in the caller — the wallet component preserves the
// exact `!res.ok || !json.success` semantic by relying on useApi's
// own non-2xx throw, then asserting `data.success` itself.

export const createCustomerWalletService = (api) => ({
  /**
   * Fetch the authenticated customer's wallet balance envelope.
   * GET /api/wallet
   */
  getBalance() {
    return api.get('/api/wallet');
  },

  /**
   * Fetch the authenticated customer's wallet transactions envelope.
   * GET /api/wallet/transactions
   */
  getTransactions() {
    return api.get('/api/wallet/transactions');
  },

  /**
   * Initiate a Paystack top-up. The success envelope carries
   * `data.authorization_url` which the caller must redirect to.
   * POST /api/wallet/topup
   */
  initiateTopUp({ amount }) {
    return api.post('/api/wallet/topup', { amount });
  },

  /**
   * Verify a Paystack top-up by transaction reference. The success
   * envelope carries `data.balance` / `data.balance_after`.
   * GET /api/wallet/topup/verify/:trxRef
   */
  verifyTopUp(trxRef) {
    return api.get(`/api/wallet/topup/verify/${trxRef}`);
  },
});
