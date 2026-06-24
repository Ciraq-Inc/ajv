import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { createApplicationsService } from '~/services/jobs/applicationsService'
import type { JobApplication } from '~/services/types'

export const useJobApplications = () => {
  const api = useApi()
  const applicationsService = createApplicationsService(api)

  const applications = ref<JobApplication[]>([])
  const loading = ref(false)
  const error = ref('')

  const fetchApplications = async (jobId: number | string): Promise<JobApplication[]> => {
    loading.value = true
    error.value = ''
    try {
      const response = await applicationsService.listByJob(jobId)
      applications.value = response.data || []
      return applications.value
    } catch (err) {
      const e = err as Error
      error.value = e.message || 'Unable to fetch applications'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitApplication = async (jobId: number | string, payload: Record<string, unknown>): Promise<JobApplication> => {
    const response = await applicationsService.apply(jobId, payload)
    return response.data
  }

  const updateApplicationStatus = async (jobId: number | string, applicationId: number | string, status: string): Promise<JobApplication> => {
    const response = await applicationsService.updateStatus(jobId, applicationId, status)
    applications.value = applications.value.map((item) =>
      item.id === applicationId ? response.data : item
    )
    return response.data
  }

  const requestGuestOtp = async (phone: string): Promise<null> => {
    const response = await applicationsService.requestGuestOtp({ phone })
    return response.data
  }

  const verifyGuestOtp = async (phone: string, code: string): Promise<{ token: string }> => {
    const response = await applicationsService.verifyGuestOtp({ phone, otp: code })
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
