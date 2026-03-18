import { ref, computed } from 'vue'
import { createJobsService } from '~/services/jobs/jobsService'

export const useJobs = () => {
  const api = useApi()
  const jobsService = createJobsService(api)

  const jobs = ref([])
  const selectedJob = ref(null)
  const loading = ref(false)
  const error = ref('')

  const openJobs = computed(() => jobs.value.filter((job) => job.status === 'open'))

  const fetchJobs = async (params = {}) => {
    loading.value = true
    error.value = ''
    try {
      const response = await jobsService.list(params)
      jobs.value = response.data || []
      return jobs.value
    } catch (err) {
      error.value = err.message || 'Unable to fetch jobs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCompanyJobs = async (params = {}) => {
    loading.value = true
    error.value = ''
    try {
      const response = await jobsService.listCompanyJobs(params)
      jobs.value = response.data || []
      return jobs.value
    } catch (err) {
      error.value = err.message || 'Unable to fetch company jobs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchJobById = async (jobId) => {
    loading.value = true
    error.value = ''
    try {
      const response = await jobsService.getById(jobId)
      selectedJob.value = response.data
      return selectedJob.value
    } catch (err) {
      error.value = err.message || 'Unable to fetch job details'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createJob = async (payload) => {
    const response = await jobsService.create(payload)
    if (response.data) {
      jobs.value = [response.data, ...jobs.value]
    }
    return response.data
  }

  const updateJob = async (jobId, payload) => {
    const response = await jobsService.update(jobId, payload)
    if (response.data) {
      jobs.value = jobs.value.map((job) => (job.id === jobId ? response.data : job))
      if (selectedJob.value?.id === jobId) {
        selectedJob.value = response.data
      }
    }
    return response.data
  }

  return {
    jobs,
    selectedJob,
    loading,
    error,
    openJobs,
    fetchJobs,
    fetchCompanyJobs,
    fetchJobById,
    createJob,
    updateJob,
  }
}
