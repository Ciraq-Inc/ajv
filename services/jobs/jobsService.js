export const createJobsService = (api) => ({
  list(params = {}) {
    return api.get('/api/jobs', { params })
  },

  listCompanyJobs(params = {}) {
    return api.get('/api/jobs/company/my-jobs', { params })
  },

  getById(jobId) {
    return api.get(`/api/jobs/${jobId}`)
  },

  create(payload) {
    return api.post('/api/jobs', payload)
  },

  update(jobId, payload) {
    return api.put(`/api/jobs/${jobId}`, payload)
  },

  listSeekers(params = {}) {
    return api.get('/api/jobs/seekers', { params })
  },

  getSeekerById(seekerId) {
    return api.get(`/api/jobs/seekers/${seekerId}`)
  },

  createSeeker(payload) {
    return api.post('/api/jobs/seekers', payload)
  },
})
