// services/pharmacyReports/pharmacyReportsService.ts
//
// Pharmacy monthly-reports domain service. All HTTP for the company-facing
// monthly-reports pages lives here.
//
// Auth note: these endpoints require a company bearer token. `useApi` resolves
// it automatically (company store → localStorage fallback).
//
// PDF note: `downloadPdf` uses `api.getBlob()` which returns a Blob directly.
// The page's content-type / magic-byte validation and filename extraction from
// content-disposition headers are moved inline into the page's `downloadPdf`
// handler.

import type { ApiInstance, ApiEnvelope, PharmacyReportStatus, PharmacyReportData } from '../types';

export const createPharmacyReportsService = (api: ApiInstance) => ({
  /**
   * Fetch status for one or more report months.
   * Repeated `reportMonths` query params are built manually because useApi's
   * params object does not support repeated keys.
   * GET /api/pharmacy-reports/current/status?reportMonths=YYYY-MM&...
   */
  getStatus(reportMonths: string[] = []): Promise<ApiEnvelope<PharmacyReportStatus>> {
    const params = new URLSearchParams();
    reportMonths.forEach((m) => params.append('reportMonths', m));
    const qs = params.toString();
    return api.get(`/api/pharmacy-reports/current/status${qs ? `?${qs}` : ''}`);
  },

  /**
   * Request generation of a monthly report for the given months.
   * POST /api/pharmacy-reports/current/request
   * Body: { reportMonths: string[] }
   */
  requestReport(reportMonths: string[] = []): Promise<ApiEnvelope<{ reportMonthLabel: string }>> {
    return api.post('/api/pharmacy-reports/current/request', { reportMonths });
  },

  /**
   * Download the current report PDF for the given months as a Blob.
   * GET /api/pharmacy-reports/current/pdf?reportMonths=YYYY-MM&...
   * Returns: Blob (application/pdf)
   */
  getPdfBlob(reportMonths: string[] = []): Promise<Blob> {
    const params = new URLSearchParams();
    reportMonths.forEach((m) => params.append('reportMonths', m));
    const qs = params.toString();
    return api.getBlob(`/api/pharmacy-reports/current/pdf${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch the current report data for the print view.
   * GET /api/pharmacy-reports/current?reportMonths=YYYY-MM&...
   */
  getCurrentReport(reportMonths: string[] = []): Promise<ApiEnvelope<PharmacyReportData>> {
    const params = new URLSearchParams();
    reportMonths.forEach((m) => params.append('reportMonths', m));
    const qs = params.toString();
    return api.get(`/api/pharmacy-reports/current${qs ? `?${qs}` : ''}`);
  },
});
