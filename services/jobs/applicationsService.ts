// services/jobs/applicationsService.ts
//
// Job applications domain service. Factory takes `useApi()` and returns
// plain async verbs for job application CRUD.

import type { ApiInstance, ApiEnvelope, JobApplication } from '../types';

export interface ApplicationListParams {
  status?: string;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface OtpRequestPayload {
  phone: string;
  [key: string]: unknown;
}

export interface OtpVerifyPayload {
  phone: string;
  otp: string;
  [key: string]: unknown;
}

export const createApplicationsService = (api: ApiInstance) => ({
  listByJob(jobId: number | string, params: ApplicationListParams = {}): Promise<ApiEnvelope<JobApplication[]>> {
    return api.get(`/api/jobs/${jobId}/applications`, { params });
  },

  apply(jobId: number | string, payload: Record<string, unknown>): Promise<ApiEnvelope<JobApplication>> {
    return api.post(`/api/jobs/${jobId}/applications`, payload);
  },

  updateStatus(jobId: number | string, applicationId: number | string, status: string): Promise<ApiEnvelope<JobApplication>> {
    return api.put(`/api/jobs/${jobId}/applications/${applicationId}/status`, { status });
  },

  requestGuestOtp(payload: OtpRequestPayload): Promise<ApiEnvelope<null>> {
    return api.post('/api/jobs/applications/otp/request', payload);
  },

  verifyGuestOtp(payload: OtpVerifyPayload): Promise<ApiEnvelope<{ token: string }>> {
    return api.post('/api/jobs/applications/otp/verify', payload);
  },

  /**
   * Upload a supporting document (CV, cover letter, etc.) for a job application.
   * POST /api/jobs/upload-document
   * Body: FormData with field: file (File)
   * Returns: { url: string }
   *
   * FormData note: useApi detects `instanceof FormData` and omits
   * Content-Type so the browser sets the correct multipart boundary.
   * The page passes a pre-built FormData object; this service passes it
   * through unchanged.
   */
  uploadDocument(formData: FormData): Promise<ApiEnvelope<{ url: string }>> {
    return api.request('/api/jobs/upload-document', {
      method: 'POST',
      body: formData,
    });
  },
});
