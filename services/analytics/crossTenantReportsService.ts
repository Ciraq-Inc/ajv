// services/analytics/crossTenantReportsService.ts
//
// The admin analytics dashboards that read across every pharmacy: the customer,
// user and insurance-payer roll-ups, sales and purchase reports, extended sync
// data and inventory analytics. These calls used to go through the generic
// `adminStore.makeAuthRequest(url)`; each is now a named call here.
//
// Responses are handed back as the server sent them. The reports put their
// totals at the top level of the body (not only under `data`), so the callers
// read the envelope themselves. Session handling (no token, expired token) is
// not done here — see composables/useCrossTenantReports.ts.

import type { ApiInstance } from '../types';

export type RollupEntity = 'customers' | 'users' | 'insurance-payers';

/** What every report endpoint answers with. */
export interface ReportResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface SalesFilters extends DateRange {
  dateField?: string;
  refresh?: boolean;
}

export interface SalesByCompanyFilters extends SalesFilters {
  limit?: number;
  search?: string;
}

export interface ExtendedSyncFilters extends DateRange {
  companyIds?: string;
}

export type InventoryMetric = 'revenue' | 'quantity' | 'transactions';

export interface ProductStockFilters {
  limit: number;
  offset: number;
  productName?: string;
  belowReorder?: boolean;
  expiringSoon?: boolean;
}

type Params = Record<string, string | number | boolean | undefined>;

/** Leaves out filters that were not set, so they never reach the query string. */
const filled = (params: Params): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') out[key] = value;
  }
  return out;
};

const REPORTS = '/api/reports/cross-tenant';
const INVENTORY = '/api/inventory-analytics';

export const createCrossTenantReportsService = (api: ApiInstance) => {
  const read = (path: string, params?: Params): Promise<ReportResponse> =>
    (params === undefined ? api.get(path) : api.get(path, { params: filled(params) })) as Promise<ReportResponse>;

  const range = ({ startDate, endDate }: DateRange): Params => ({ start_date: startDate, end_date: endDate });

  return {
    /** GET /api/{customers|users|insurance-payers}/cross-tenant/summary */
    getEntitySummary: (entity: RollupEntity) => read(`/api/${entity}/cross-tenant/summary`),

    /** GET /api/{customers|users|insurance-payers}/cross-tenant/dataview */
    getEntityDataview: (entity: RollupEntity) => read(`/api/${entity}/cross-tenant/dataview`),

    /** GET /api/{customers|users|insurance-payers}/cross-tenant/export?format=json */
    exportEntityJson: (entity: RollupEntity) => read(`/api/${entity}/cross-tenant/export`, { format: 'json' }),

    /** GET /api/reports/cross-tenant/sales-items */
    getSalesSummary: ({ dateField, refresh, ...dates }: SalesFilters) =>
      read(`${REPORTS}/sales-items`, { ...range(dates), date_field: dateField, refresh: refresh ? 'true' : undefined }),

    /** GET /api/reports/cross-tenant/sales-items/dataview?limit=&… (per-company totals) */
    getSalesByCompany: ({ limit, search, dateField, refresh, ...dates }: SalesByCompanyFilters) =>
      read(`${REPORTS}/sales-items/dataview`, {
        limit,
        ...range(dates),
        date_field: dateField,
        search: search?.trim(),
        refresh: refresh ? 'true' : undefined,
      }),

    /** GET /api/reports/cross-tenant/purchase-items */
    getPurchaseSummary: (dates: DateRange) => read(`${REPORTS}/purchase-items`, range(dates)),

    /** GET /api/reports/cross-tenant/purchase-items/dataview (sample rows) */
    getPurchaseSample: () => read(`${REPORTS}/purchase-items/dataview`),

    /** GET /api/reports/cross-tenant/extended-sync/:entity */
    getExtendedSync: (entity: string, { companyIds, ...dates }: ExtendedSyncFilters) =>
      read(`${REPORTS}/extended-sync/${entity}`, { ...range(dates), company_ids: companyIds?.trim() }),

    /** GET /api/inventory-analytics/composite-stock-value */
    getInventoryStockValue: () => read(`${INVENTORY}/composite-stock-value`),

    /** GET /api/inventory-analytics/alerts, narrowed to one alert type when given */
    getInventoryAlerts: (alertType?: string) => read(`${INVENTORY}/alerts`, { alertType }),

    /** GET /api/inventory-analytics/top-products */
    getInventoryTopProducts: ({ metric, limit }: { metric: InventoryMetric | string; limit: number }) =>
      read(`${INVENTORY}/top-products`, { metric, limit }),

    /** GET /api/inventory-analytics/product-stock-details */
    getInventoryProductStock: ({ limit, offset, productName, belowReorder, expiringSoon }: ProductStockFilters) =>
      read(`${INVENTORY}/product-stock-details`, {
        limit,
        offset,
        productName,
        belowReorder: belowReorder || undefined,
        expiringSoon: expiringSoon || undefined,
      }),

    /** GET /api/inventory-analytics/search-products, or another endpoint with the same shape */
    searchProducts: (params: Record<string, string>, endpoint = `${INVENTORY}/search-products`) => read(endpoint, params),

    /** GET /api/companies — the company picker */
    listCompanies: () => read('/api/companies'),
  };
};

export type CrossTenantReportsService = ReturnType<typeof createCrossTenantReportsService>;
