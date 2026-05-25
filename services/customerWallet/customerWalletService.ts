// services/customerWallet/customerWalletService.ts
//
// Customer wallet domain service. All HTTP for the customer-facing
// wallet endpoints (`/api/wallet/*`) lives here.
//
// IMPORTANT: This service is pure HTTP. It does NOT persist state,
// poll for payment status, or perform redirects.

import type { ApiInstance, ApiEnvelope, WalletBalance, WalletTransaction, TopUpInitiate, TopUpVerify } from '../types';

export interface InitiateTopUpParams {
  amount: number;
}

export const createCustomerWalletService = (api: ApiInstance) => ({
  /**
   * Fetch the authenticated customer's wallet balance envelope.
   * GET /api/wallet
   */
  getBalance(): Promise<ApiEnvelope<WalletBalance>> {
    return api.get('/api/wallet');
  },

  /**
   * Fetch the authenticated customer's wallet transactions envelope.
   * GET /api/wallet/transactions
   */
  getTransactions(): Promise<ApiEnvelope<WalletTransaction[]>> {
    return api.get('/api/wallet/transactions');
  },

  /**
   * Initiate a Paystack top-up. The success envelope carries
   * `data.authorization_url` which the caller must redirect to.
   * POST /api/wallet/topup
   */
  initiateTopUp({ amount }: InitiateTopUpParams): Promise<ApiEnvelope<TopUpInitiate>> {
    return api.post('/api/wallet/topup', { amount });
  },

  /**
   * Verify a Paystack top-up by transaction reference. The success
   * envelope carries `data.balance` / `data.balance_after`.
   * GET /api/wallet/topup/verify/:trxRef
   */
  verifyTopUp(trxRef: string): Promise<ApiEnvelope<TopUpVerify>> {
    return api.get(`/api/wallet/topup/verify/${trxRef}`);
  },
});
