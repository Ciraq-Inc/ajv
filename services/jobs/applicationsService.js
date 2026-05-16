export const createApplicationsService = (api) => ({
  listByJob(jobId, params = {}) {
    return api.get(`/api/jobs/${jobId}/applications`, { params })
  },

  apply(jobId, payload) {
    return api.post(`/api/jobs/${jobId}/applications`, payload)
  },

  updateStatus(jobId, applicationId, status) {
    return api.put(`/api/jobs/${jobId}/applications/${applicationId}/status`, { status })
  },

  requestGuestOtp(payload) {
    return api.post('/api/jobs/applications/otp/request', payload)
  },

  verifyGuestOtp(payload) {
    return api.post('/api/jobs/applications/otp/verify', payload)
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
  uploadDocument(formData) {
    return api.request('/api/jobs/upload-document', {
      method: 'POST',
      body: formData,
    })
  },
})
