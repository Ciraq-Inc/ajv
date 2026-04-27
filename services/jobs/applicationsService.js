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
})
