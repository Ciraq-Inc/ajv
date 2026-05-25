// services/sms/creditsService.ts
//
// SMS credits domain service. Migrated from the legacy `default export
// (apiBase) => ({...})` pattern (which used raw `fetch()` and per-function
// token params) to the standard `createCreditsService(api)` factory pattern.
//
// The token-injection and base-URL concerns now live in `useApi()`, so
// callers no longer pass a token per function.

import type { ApiInstance, ApiEnvelope, SmsBalance, SmsOverview, SmsTransaction, SmsStatistics, SmsCompanyOverview } from '../types';

export interface TransactionFilters {
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number | string;
  offset?: number | string;
}

export interface StatisticsFilters {
  start_date?: string;
  end_date?: string;
}

export interface CompanyOverviewFilters {
  low_balance?: boolean | string;
  search?: string;
  limit?: number | string;
  offset?: number | string;
}

export const createCreditsService = (api: ApiInstance) => ({
  /** Get company credit balance. GET /api/sms-credits/balance */
  getBalance(): Promise<ApiEnvelope<SmsBalance>> {
    return api.get<SmsBalance>('/api/sms-credits/balance');
  },

  /** Get billing overview. GET /api/sms-credits/overview */
  getOverview(): Promise<ApiEnvelope<SmsOverview>> {
    return api.get<SmsOverview>('/api/sms-credits/overview');
  },

  /** Get transaction history with filters. GET /api/sms-credits/transactions */
  getTransactions(filters: TransactionFilters = {}): Promise<ApiEnvelope<SmsTransaction[]>> {
    const params = new URLSearchParams();
    if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsTransaction[]>(`/api/sms-credits/transactions${qs ? `?${qs}` : ''}`);
  },

  /** Get transaction statistics. GET /api/sms-credits/stats */
  getStatistics(filters: StatisticsFilters = {}): Promise<ApiEnvelope<SmsStatistics>> {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const qs = params.toString();
    return api.get<SmsStatistics>(`/api/sms-credits/stats${qs ? `?${qs}` : ''}`);
  },

  /** Purchase SMS credits. POST /api/sms-credits/purchase */
  purchaseCredits(smsCount: number): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/sms-credits/purchase', { sms_count: smsCount });
  },

  /** Estimate campaign cost. POST /api/sms-credits/estimate */
  estimateCost(recipientCount: number): Promise<ApiEnvelope<{ cost: number; per_sms: number }>> {
    return api.post<{ cost: number; per_sms: number }>('/api/sms-credits/estimate', { recipient_count: recipientCount });
  },

  /** Get current SMS rate. GET /api/sms-credits/rate */
  getSmsRate(): Promise<ApiEnvelope<{ rate: number }>> {
    return api.get<{ rate: number }>('/api/sms-credits/rate');
  },

  /** Get company sender ID. GET /api/sms-credits/sender-id */
  getSenderId(): Promise<ApiEnvelope<{ sender_id: string }>> {
    return api.get<{ sender_id: string }>('/api/sms-credits/sender-id');
  },

  /** Admin: Get all companies credit overview. GET /api/sms-credits/admin/overview */
  getAllCompaniesOverview(filters: CompanyOverviewFilters = {}): Promise<ApiEnvelope<SmsCompanyOverview[]>> {
    const params = new URLSearchParams();
    if (filters.low_balance) params.append('low_balance', String(filters.low_balance));
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsCompanyOverview[]>(`/api/sms-credits/admin/overview${qs ? `?${qs}` : ''}`);
  },

  /** Admin: Get low balance companies. GET /api/sms-credits/admin/low-balance */
  getLowBalanceCompanies(threshold: number = 100): Promise<ApiEnvelope<SmsCompanyOverview[]>> {
    return api.get<SmsCompanyOverview[]>(`/api/sms-credits/admin/low-balance?threshold=${threshold}`);
  },

  /** Admin: Top up company money balance. POST /api/sms-credits/admin/topup-money */
  topUpMoney(companyId: number | string, amount: number, description: string = ''): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/sms-credits/admin/topup-money', {
      company_id: companyId,
      amount,
      description,
    });
  },

  /** Admin: Top up company SMS credits. POST /api/sms-credits/admin/topup-sms */
  topUpSms(companyId: number | string, smsCount: number, description: string = ''): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/sms-credits/admin/topup-sms', {
      company_id: companyId,
      sms_count: smsCount,
      description,
    });
  },

  /** Admin: Get company transaction history. GET /api/sms-credits/admin/transactions/:id */
  getCompanyTransactions(companyId: number | string, filters: TransactionFilters = {}): Promise<ApiEnvelope<SmsTransaction[]>> {
    const params = new URLSearchParams();
    if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsTransaction[]>(`/api/sms-credits/admin/transactions/${companyId}${qs ? `?${qs}` : ''}`);
  },
});
