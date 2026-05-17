// services/analytics/reportsExportService.ts
//
// Cross-tenant report export service. Houses the CSV/blob download endpoints
// used by the analytics dashboard components: customers, insurance-payers,
// inventory, purchase-reports, sales-reports, users. Public API: a single
// factory that takes an `api` (the useApi wrapper) and returns a plain
// object of async functions. Components import the factory, hand it
// `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// CSV download semantics: the server returns raw `text/csv` (NOT the
// `{success,data}` envelope), so we use `api.getBlob()` which skips the
// JSON parse step and returns a Blob. The component is responsible for
// triggering the browser download (creating the anchor, setting filename,
// revoking the object URL) — keeping the DOM side-effects in the component
// matches the rest of the codebase and keeps services side-effect-free.
//
// Public behavior MUST mirror the legacy in-component fetch calls exactly:
// same paths, same method, same query params. The legacy callers built a
// URLSearchParams manually; `api.getBlob()`'s `params` option does the same
// with undefined-stripping for free.

import type { ApiInstance, ApiEnvelope, PharmacyTransactionSummary, QuarterlySummary } from '../types';

/** Strip undefined/null/empty-string values so useApi's params serialiser
 *  doesn't emit bare `key=` tokens in the query string. */
const stripEmpty = (obj: Record<string, string | number | undefined | null>): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') {
      out[k] = v;
    }
  }
  return out;
};

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SalesItemsParams extends DateRangeParams {
  dateField?: string;
}

export interface SalesItemsRawParams extends SalesItemsParams {
  columns?: string;
}

export interface CompanySalesItemsParams extends SalesItemsParams {
  companyId?: number | string;
}

export interface PharmacyTransactionSummaryParams extends DateRangeParams {
  companyIds?: string | number;
  dateField?: string;
}

export interface QuarterlySummaryParams {
  year?: number | string;
  dateField?: string;
  companyIds?: string | number;
  forceRefresh?: boolean;
}

export interface CompanySalesItemsForCompanyParams extends SalesItemsParams {
  companyId?: number | string;
  limit?: number;
}

export const createReportsExportService = (api: ApiInstance) => ({
  /**
   * Export all customers across pharmacies as CSV.
   * GET /api/customers/cross-tenant/export?format=csv
   */
  exportCustomersCsv(): Promise<Blob> {
    return api.getBlob('/api/customers/cross-tenant/export', {
      params: { format: 'csv' },
    });
  },

  /**
   * Export all insurance payers across pharmacies as CSV.
   * GET /api/insurance-payers/cross-tenant/export?format=csv
   */
  exportInsurancePayersCsv(): Promise<Blob> {
    return api.getBlob('/api/insurance-payers/cross-tenant/export', {
      params: { format: 'csv' },
    });
  },

  /**
   * Export all users across pharmacies as CSV.
   * GET /api/users/cross-tenant/export?format=csv
   */
  exportUsersCsv(): Promise<Blob> {
    return api.getBlob('/api/users/cross-tenant/export', {
      params: { format: 'csv' },
    });
  },

  /**
   * Export stock-value inventory report as CSV. The server already streams
   * CSV at this endpoint (no `format` query needed).
   * GET /api/inventory-analytics/export/stock-value
   */
  exportInventoryStockValueCsv(): Promise<Blob> {
    return api.getBlob('/api/inventory-analytics/export/stock-value');
  },

  // -------------------------------------------------------------------
  // Purchase reports
  // -------------------------------------------------------------------

  /**
   * Export the aggregated purchase-items summary CSV.
   * GET /api/reports/cross-tenant/purchase-items/export?format=csv&start_date=&end_date=
   */
  exportPurchaseItemsSummaryCsv({ startDate, endDate }: DateRangeParams = {}): Promise<Blob> {
    return api.getBlob('/api/reports/cross-tenant/purchase-items/export', {
      params: stripEmpty({ format: 'csv', start_date: startDate, end_date: endDate }),
    });
  },

  /**
   * Export raw purchase-items transactions CSV.
   * GET /api/reports/cross-tenant/raw-purchase-items/export?format=csv&start_date=&end_date=
   */
  exportPurchaseItemsRawCsv({ startDate, endDate }: DateRangeParams = {}): Promise<Blob> {
    return api.getBlob('/api/reports/cross-tenant/raw-purchase-items/export', {
      params: stripEmpty({ format: 'csv', start_date: startDate, end_date: endDate }),
    });
  },

  // -------------------------------------------------------------------
  // Sales reports
  // -------------------------------------------------------------------

  /**
   * Export aggregated sales-items summary CSV.
   * GET /api/reports/cross-tenant/sales-items/export?format=csv&start_date=&end_date=&date_field=
   */
  exportSalesItemsSummaryCsv({ startDate, endDate, dateField }: SalesItemsParams = {}): Promise<Blob> {
    return api.getBlob('/api/reports/cross-tenant/sales-items/export', {
      params: stripEmpty({
        format: 'csv',
        start_date: startDate,
        end_date: endDate,
        date_field: dateField,
      }),
    });
  },

  /**
   * Export raw sales-items CSV with optional column subset (legacy passes
   * a CSV string of column keys via the `columns` param).
   * GET /api/reports/cross-tenant/raw-sales-items/export
   */
  exportSalesItemsRawCsv({ startDate, endDate, dateField, columns }: SalesItemsRawParams = {}): Promise<Blob> {
    return api.getBlob('/api/reports/cross-tenant/raw-sales-items/export', {
      params: stripEmpty({
        format: 'csv',
        start_date: startDate,
        end_date: endDate,
        date_field: dateField,
        columns,
      }),
    });
  },

  /**
   * Fetch raw sales-items as JSON for a single company (used by the company
   * details modal in sales-reports.vue). The endpoint is the same
   * raw-sales-items/export route but with no `format=csv`, so it returns
   * `{success,data}` JSON. We use `api.get` here (not getBlob) and let the
   * caller read the envelope.
   * GET /api/reports/cross-tenant/raw-sales-items/export?company_ids=&limit=&start_date=&end_date=&date_field=
   */
  getSalesItemsForCompany({ companyId, limit = 100, startDate, endDate, dateField }: CompanySalesItemsForCompanyParams = {}): Promise<ApiEnvelope<unknown[]>> {
    return api.get('/api/reports/cross-tenant/raw-sales-items/export', {
      params: stripEmpty({
        company_ids: companyId !== undefined ? String(companyId) : undefined,
        limit,
        start_date: startDate,
        end_date: endDate,
        date_field: dateField,
      }),
    });
  },

  /**
   * Export raw sales-items CSV for a single company.
   * GET /api/reports/cross-tenant/raw-sales-items/export?format=csv&company_ids=&start_date=&end_date=&date_field=
   */
  exportSalesItemsForCompanyCsv({ companyId, startDate, endDate, dateField }: CompanySalesItemsParams = {}): Promise<Blob> {
    return api.getBlob('/api/reports/cross-tenant/raw-sales-items/export', {
      params: stripEmpty({
        format: 'csv',
        company_ids: companyId !== undefined ? String(companyId) : undefined,
        start_date: startDate,
        end_date: endDate,
        date_field: dateField,
      }),
    });
  },

  /**
   * Fetch pharmacy transaction summary (JSON). Used by the Pharmacy Reports
   * tab in sales-reports.vue.
   * GET /api/reports/cross-tenant/pharmacy-transaction-summary?format=json&...
   */
  getPharmacyTransactionSummary({ startDate, endDate, companyIds, dateField }: PharmacyTransactionSummaryParams = {}): Promise<ApiEnvelope<PharmacyTransactionSummary[]>> {
    return api.get('/api/reports/cross-tenant/pharmacy-transaction-summary', {
      params: stripEmpty({
        format: 'json',
        start_date: startDate,
        end_date: endDate,
        company_ids: companyIds !== undefined ? String(companyIds) : undefined,
        date_field: dateField,
      }),
    });
  },

  /**
   * Fetch quarterly cross-tenant summary (JSON). Used by the Quarterly tab
   * in sales-reports.vue. `forceRefresh` adds `refresh=true` to bypass the
   * server's cache, matching legacy behavior.
   * GET /api/reports/cross-tenant/quarterly-summary?year=&date_field=&company_ids=&refresh=
   */
  getQuarterlySummary({ year, dateField, companyIds, forceRefresh = false }: QuarterlySummaryParams = {}): Promise<ApiEnvelope<QuarterlySummary>> {
    const params: Record<string, string | number> = stripEmpty({
      year: year !== undefined ? String(year) : undefined,
      date_field: dateField,
      company_ids: companyIds !== undefined ? String(companyIds) : undefined,
    });
    if (forceRefresh === true) params['refresh'] = 'true';
    return api.get('/api/reports/cross-tenant/quarterly-summary', { params });
  },
});
