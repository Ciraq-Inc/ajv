// services/analytics/reportsExportService.js
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

const stripEmpty = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
};

export const createReportsExportService = (api) => ({
  /**
   * Export all customers across pharmacies as CSV.
   * GET /api/customers/cross-tenant/export?format=csv
   */
  exportCustomersCsv() {
    return api.getBlob('/api/customers/cross-tenant/export', {
      params: { format: 'csv' },
    });
  },

  /**
   * Export all insurance payers across pharmacies as CSV.
   * GET /api/insurance-payers/cross-tenant/export?format=csv
   */
  exportInsurancePayersCsv() {
    return api.getBlob('/api/insurance-payers/cross-tenant/export', {
      params: { format: 'csv' },
    });
  },

  /**
   * Export all users across pharmacies as CSV.
   * GET /api/users/cross-tenant/export?format=csv
   */
  exportUsersCsv() {
    return api.getBlob('/api/users/cross-tenant/export', {
      params: { format: 'csv' },
    });
  },

  /**
   * Export stock-value inventory report as CSV. The server already streams
   * CSV at this endpoint (no `format` query needed).
   * GET /api/inventory-analytics/export/stock-value
   */
  exportInventoryStockValueCsv() {
    return api.getBlob('/api/inventory-analytics/export/stock-value');
  },

  // -------------------------------------------------------------------
  // Purchase reports
  // -------------------------------------------------------------------

  /**
   * Export the aggregated purchase-items summary CSV.
   * GET /api/reports/cross-tenant/purchase-items/export?format=csv&start_date=&end_date=
   */
  exportPurchaseItemsSummaryCsv({ startDate, endDate } = {}) {
    return api.getBlob('/api/reports/cross-tenant/purchase-items/export', {
      params: stripEmpty({ format: 'csv', start_date: startDate, end_date: endDate }),
    });
  },

  /**
   * Export raw purchase-items transactions CSV.
   * GET /api/reports/cross-tenant/raw-purchase-items/export?format=csv&start_date=&end_date=
   */
  exportPurchaseItemsRawCsv({ startDate, endDate } = {}) {
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
  exportSalesItemsSummaryCsv({ startDate, endDate, dateField } = {}) {
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
  exportSalesItemsRawCsv({ startDate, endDate, dateField, columns } = {}) {
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
  getSalesItemsForCompany({ companyId, limit = 100, startDate, endDate, dateField } = {}) {
    return api.get('/api/reports/cross-tenant/raw-sales-items/export', {
      params: stripEmpty({
        company_ids: companyId,
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
  exportSalesItemsForCompanyCsv({ companyId, startDate, endDate, dateField } = {}) {
    return api.getBlob('/api/reports/cross-tenant/raw-sales-items/export', {
      params: stripEmpty({
        format: 'csv',
        company_ids: companyId,
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
  getPharmacyTransactionSummary({ startDate, endDate, companyIds, dateField } = {}) {
    return api.get('/api/reports/cross-tenant/pharmacy-transaction-summary', {
      params: stripEmpty({
        format: 'json',
        start_date: startDate,
        end_date: endDate,
        company_ids: companyIds,
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
  getQuarterlySummary({ year, dateField, companyIds, forceRefresh = false } = {}) {
    const params = stripEmpty({
      year,
      date_field: dateField,
      company_ids: companyIds,
    });
    if (forceRefresh === true) params.refresh = 'true';
    return api.get('/api/reports/cross-tenant/quarterly-summary', { params });
  },
});
