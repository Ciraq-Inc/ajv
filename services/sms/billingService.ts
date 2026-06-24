// services/sms/billingService.ts
//
// SMS billing domain service. Migrated from the legacy `default export
// (apiBase) => ({...})` pattern (which used raw `fetch()` and per-function
// token params) to the standard `createBillingService(api)` factory pattern
// that the rest of the codebase uses.
//
// The token-injection and base-URL concerns now live in `useApi()`, so
// callers no longer pass a token per function.  Auth headers are injected
// automatically by useApi for the relevant endpoint prefixes
// (`/api/sms-credits/*`, `/api/admin/billing/*`).
//
// Response shape: the server returns raw JSON (not the `{success,data}`
// envelope at every endpoint here) — callers receive the parsed JSON
// directly, same as before.

import type { ApiInstance, ApiEnvelope, BillingHealth, BillingIssue, AuditLogEntry, SmsTransaction, SmsBalance } from '../types';

export interface BillingTransactionFilters {
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number | string;
  offset?: number | string;
}

export interface BillingIssueFilters {
  company_id?: number | string;
  status?: string;
  issue_type?: string;
  limit?: number | string;
}

export interface AuditLogFilters {
  company_id?: number | string;
  startDate?: string;
  endDate?: string;
  limit?: number | string;
}

export interface TopUpCreditsData {
  company_id: number | string;
  sms_count: number;
  description?: string;
}

export interface TopUpMoneyData {
  company_id: number | string;
  amount: number;
  description?: string;
}

export interface AdminPurchaseCreditsData {
  company_id: number | string;
  sms_count: number;
}

export interface AdminPurchaseCreditsResult {
  sms_credits_added: number;
  money_deducted: number;
  sms_balance: number;
  money_balance: number;
}

export interface ResolveIssueData {
  resolution?: string;
  [key: string]: unknown;
}

export const createBillingService = (api: ApiInstance) => ({
  // ========== Company Endpoints ==========

  /** Get current SMS credit balance. GET /api/sms-credits/balance */
  getBalance(): Promise<ApiEnvelope<SmsBalance>> {
    return api.get<SmsBalance>('/api/sms-credits/balance');
  },

  /** Get transaction history with optional filters.
   *  GET /api/sms-credits/transactions */
  getTransactions(filters: BillingTransactionFilters = {}): Promise<ApiEnvelope<SmsTransaction[]>> {
    const params = new URLSearchParams();
    if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));
    const qs = params.toString();
    return api.get<SmsTransaction[]>(`/api/sms-credits/transactions${qs ? `?${qs}` : ''}`);
  },

  // ========== Admin Endpoints ==========

  /** Top up SMS credits for a company. POST /api/sms-credits/admin/topup */
  topUpCredits(data: TopUpCreditsData): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/sms-credits/admin/topup', data);
  },

  /** Top up money balance for a company. POST /api/sms-credits/admin/topup-money */
  topUpMoney(data: TopUpMoneyData): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/sms-credits/admin/topup-money', data);
  },

  /** Purchase SMS credits from money balance for a company. POST /api/sms-credits/admin/purchase */
  adminPurchaseCredits(data: AdminPurchaseCreditsData): Promise<ApiEnvelope<AdminPurchaseCreditsResult>> {
    return api.post<AdminPurchaseCreditsResult>('/api/sms-credits/admin/purchase', data);
  },

  /** Get current SMS rate (admin). GET /api/sms-credits/admin/rate */
  adminGetRate(): Promise<ApiEnvelope<{ rate: number }>> {
    return api.get<{ rate: number }>('/api/sms-credits/admin/rate');
  },

  /** Get billing health for all companies. GET /api/admin/billing/health */
  getBillingHealth(): Promise<ApiEnvelope<BillingHealth[]>> {
    return api.get<BillingHealth[]>('/api/admin/billing/health');
  },

  /** Get billing health for a specific company. GET /api/admin/billing/health/:id */
  getCompanyBillingHealth(companyId: number | string): Promise<ApiEnvelope<BillingHealth>> {
    return api.get<BillingHealth>(`/api/admin/billing/health/${companyId}`);
  },

  /** Run reconciliation for all companies. POST /api/admin/billing/reconcile */
  runReconciliation(): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/admin/billing/reconcile', {});
  },

  /** Run reconciliation for a specific company. POST /api/admin/billing/reconcile/:id */
  runCompanyReconciliation(companyId: number | string): Promise<ApiEnvelope<unknown>> {
    return api.post(`/api/admin/billing/reconcile/${companyId}`, {});
  },

  /** Get billing issues with optional filters. GET /api/admin/billing/issues */
  getBillingIssues(filters: BillingIssueFilters = {}): Promise<ApiEnvelope<BillingIssue[]>> {
    const params = new URLSearchParams();
    if (filters.company_id) params.append('company_id', String(filters.company_id));
    if (filters.status) params.append('status', filters.status);
    if (filters.issue_type) params.append('issue_type', filters.issue_type);
    if (filters.limit) params.append('limit', String(filters.limit));
    const qs = params.toString();
    return api.get<BillingIssue[]>(`/api/admin/billing/issues${qs ? `?${qs}` : ''}`);
  },

  /** Resolve a billing issue manually. POST /api/admin/billing/issues/:id/resolve */
  resolveIssue(issueId: number | string, data: ResolveIssueData): Promise<ApiEnvelope<unknown>> {
    return api.post(`/api/admin/billing/issues/${issueId}/resolve`, data);
  },

  /** Get audit log. GET /api/admin/billing/audit */
  getAuditLog(filters: AuditLogFilters = {}): Promise<ApiEnvelope<AuditLogEntry[]>> {
    const params = new URLSearchParams();
    if (filters.company_id) params.append('company_id', String(filters.company_id));
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    const qs = params.toString();
    return api.get<AuditLogEntry[]>(`/api/admin/billing/audit${qs ? `?${qs}` : ''}`);
  },
});
