// services/pharmacyReports/pharmacyReportsService.js
//
// Pharmacy monthly-reports domain service. All HTTP for the company-facing
// monthly-reports pages lives here. Public API: a single factory that takes
// an `api` (the useApi wrapper) and returns a plain object of async functions.
// Pages import the factory, hand it `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself reads
// runtimeConfig and the auth token) so the service stays framework-agnostic
// and trivially mockable in tests.
//
// Auth note: these endpoints require a company bearer token. `useApi` resolves
// it automatically (company store → localStorage fallback). The page-level
// session-expiry guard (401 → redirect to login) is UI orchestration and
// stays in the page; the service only performs the HTTP call.
//
// Public behavior MUST mirror the legacy in-page fetch calls exactly: same
// paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller (the page).
//
// PDF note: `downloadPdf` uses `api.getBlob()` which returns a Blob directly.
// The page's content-type / magic-byte validation and filename extraction from
// content-disposition headers are moved inline into the page's `downloadPdf`
// handler, which now calls this service and works with the Blob. The fallback
// filename (months-based) was already the primary filename in the legacy code.

export const createPharmacyReportsService = (api) => ({
  /**
   * Fetch status for one or more report months.
   * Repeated `reportMonths` query params are built manually because useApi's
   * params object does not support repeated keys.
   * GET /api/pharmacy-reports/current/status?reportMonths=YYYY-MM&...
   * Returns: { success, data: { canRequestReport, ... } }
   */
  getStatus(reportMonths = []) {
    const params = new URLSearchParams()
    reportMonths.forEach((m) => params.append('reportMonths', m))
    const qs = params.toString()
    return api.get(`/api/pharmacy-reports/current/status${qs ? `?${qs}` : ''}`)
  },

  /**
   * Request generation of a monthly report for the given months.
   * POST /api/pharmacy-reports/current/request
   * Body: { reportMonths: string[] }
   * Returns: { success, data: { reportMonthLabel, ... } }
   */
  requestReport(reportMonths = []) {
    return api.post('/api/pharmacy-reports/current/request', { reportMonths })
  },

  /**
   * Download the current report PDF for the given months as a Blob.
   * The page is responsible for the browser-download side-effect (anchor
   * click + URL.revokeObjectURL) and for constructing the filename.
   * GET /api/pharmacy-reports/current/pdf?reportMonths=YYYY-MM&...
   * Returns: Blob (application/pdf)
   */
  getPdfBlob(reportMonths = []) {
    const params = new URLSearchParams()
    reportMonths.forEach((m) => params.append('reportMonths', m))
    const qs = params.toString()
    return api.getBlob(`/api/pharmacy-reports/current/pdf${qs ? `?${qs}` : ''}`)
  },

  /**
   * Fetch the current report data for the print view.
   * GET /api/pharmacy-reports/current?reportMonths=YYYY-MM&...
   * Returns: { success, data: { data: { ... } } }
   */
  getCurrentReport(reportMonths = []) {
    const params = new URLSearchParams()
    reportMonths.forEach((m) => params.append('reportMonths', m))
    const qs = params.toString()
    return api.get(`/api/pharmacy-reports/current${qs ? `?${qs}` : ''}`)
  },
})
