import { ref } from 'vue'
import { createApplicationsService } from '~/services/jobs/applicationsService'

export const useJobApplications = () => {
  const api = useApi()
  const applicationsService = createApplicationsService(api)

  const applications = ref([])
  const loading = ref(false)
  const error = ref('')

  const fetchApplications = async (jobId) => {
    loading.value = true
    error.value = ''
    try {
      const response = await applicationsService.listByJob(jobId)
      applications.value = response.data || []
      return applications.value
    } catch (err) {
      error.value = err.message || 'Unable to fetch applications'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitApplication = async (jobId, payload) => {
    const response = await applicationsService.apply(jobId, payload)
    return response.data
  }

  const updateApplicationStatus = async (jobId, applicationId, status) => {
    const response = await applicationsService.updateStatus(jobId, applicationId, status)
    applications.value = applications.value.map((item) => (item.id === applicationId ? response.data : item))
    return response.data
  }

  const requestGuestOtp = async (phone) => {
    const response = await applicationsService.requestGuestOtp({ phone })
    return response.data
  }

  const verifyGuestOtp = async (phone, code) => {
    const response = await applicationsService.verifyGuestOtp({ phone, code })
    return response.data
  }

  return {
    applications,
    loading,
    error,
    fetchApplications,
    submitApplication,
    updateApplicationStatus,
    requestGuestOtp,
    verifyGuestOtp,
  }
}
