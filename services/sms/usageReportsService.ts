// services/sms/usageReportsService.ts
//
// SMS usage overview domain service — cross-company, date-range breakdown of
// billed SMS (sms_deduction transactions), plus the per-company drill-down
// and the company selector list. Response shape note: the summary/export
// endpoints return `{ success, summary, data, filters }` (summary + filters
// spread alongside `data`, not nested under it), which `ApiEnvelope<T>`
// doesn't model exactly — see the `as unknown as` casts below, same
// pragmatic approach billingService.ts uses for its own envelope mismatches.

import type { ApiInstance, ApiEnvelope, SmsUsageSummary, SmsTransaction, Company } from '../types';

export interface UsageSummaryFilters {
  company_ids?: string | number[];
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: 'message_count' | 'total_cost' | 'company_name' | 'avg_cost_per_message';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CompanyTransactionFilters {
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface DrillDownPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/** Strip undefined/null/empty-string values so useApi's params serialiser
 *  doesn't emit bare `key=` tokens in the query string. */
const stripEmpty = (obj: Record<string, string | number | string[] | number[] | undefined | null>): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') {
      out[k] = Array.isArray(v) ? v.join(',') : v;
    }
  }
  return out;
};

export const createUsageReportsService = (api: ApiInstance) => ({
  /** Cross-company SMS usage breakdown for a date range.
   *  GET /api/sms-credits/admin/usage-summary */
  getUsageSummary({ company_ids, start_date, end_date, search, sort_by, order, limit, offset }: UsageSummaryFilters = {}): Promise<SmsUsageSummary & { success: boolean }> {
    return api.get('/api/sms-credits/admin/usage-summary', {
      params: stripEmpty({ company_ids, start_date, end_date, search, sort_by, order, limit, offset }),
    }) as unknown as Promise<SmsUsageSummary & { success: boolean }>;
  },

  /** Export the same breakdown as CSV.
   *  GET /api/sms-credits/admin/usage-summary/export?format=csv */
  exportUsageSummaryCsv({ company_ids, start_date, end_date, search, sort_by, order }: UsageSummaryFilters = {}): Promise<Blob> {
    return api.getBlob('/api/sms-credits/admin/usage-summary/export', {
      params: stripEmpty({ company_ids, start_date, end_date, search, sort_by, order, format: 'csv' }),
    });
  },

  /** Per-company transaction drill-down (existing endpoint, reused as-is).
   *  GET /api/sms-credits/admin/transactions/:companyId */
  getCompanyTransactions(
    companyId: number | string,
    { transaction_type, start_date, end_date, limit, offset }: CompanyTransactionFilters = {}
  ): Promise<ApiEnvelope<SmsTransaction[]> & { pagination?: DrillDownPagination }> {
    return api.get(`/api/sms-credits/admin/transactions/${companyId}`, {
      params: stripEmpty({ transaction_type, start_date, end_date, limit, offset }),
    }) as unknown as Promise<ApiEnvelope<SmsTransaction[]> & { pagination?: DrillDownPagination }>;
  },

  /** Company selector list. GET /api/admin/companies */
  listCompanies(): Promise<ApiEnvelope<Company[]>> {
    return api.get<Company[]>('/api/admin/companies');
  },
});
