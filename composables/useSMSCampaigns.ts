import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { createCampaignService } from '~/services/sms/campaignService'
import type { CampaignFilters, CampaignRecipientFilters, CampaignLogFilters, TestSmsData, ReuseCampaignData, ResendCampaignData } from '~/services/sms/campaignService'
import type { SmsCampaign, SmsCampaignStats, SmsCampaignRecipient, SmsCampaignLog } from '~/services/types'

export const useSMSCampaigns = () => {
  const service = createCampaignService(useApi())

  const campaigns = ref<SmsCampaign[]>([])
  const currentCampaign = ref<SmsCampaign | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const retryAttempts = ref<Record<string, number>>({})

  const fetchCampaigns = async (filters: CampaignFilters = {}): Promise<{ data: SmsCampaign[] }> => {
    loading.value = true
    error.value = null

    try {
      const route = useRoute()
      const isAdminPage = route.path.startsWith('/admin')

      const response = isAdminPage
        ? await service.getAllCampaignsAdmin(filters)
        : await service.getCampaigns(filters)

      campaigns.value = response.data || []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching campaigns:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getCampaignById(campaignId)
      currentCampaign.value = response.data ?? null
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCampaign = async (campaignData: Partial<SmsCampaign> & Record<string, unknown>): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.createCampaign(campaignData)
      if (response.data) campaigns.value.unshift(response.data)
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error creating campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCampaign = async (campaignId: number | string, campaignData: Partial<SmsCampaign> & Record<string, unknown>): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.updateCampaign(campaignId, campaignData)
      if (response.data) updateCampaignInList(campaignId, response.data)
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error updating campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const reuseCampaign = async (campaignId: number | string, reuseName: string | null = null): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const data: ReuseCampaignData = reuseName ? { name: reuseName } : {}
      const response = await service.reuseCampaign(campaignId, data)
      if (response.data) campaigns.value.unshift(response.data)
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error reusing campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const resendCampaign = async (campaignId: number | string, options: ResendCampaignData = {}): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.resendCampaign(campaignId, options)
      updateCampaignInList(campaignId, { status: 'sending' })
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error resending campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const startCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.startCampaign(campaignId)
      updateCampaignInList(campaignId, { status: 'sending' })
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error starting campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const pauseCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.pauseCampaign(campaignId)
      updateCampaignInList(campaignId, { status: 'paused' })
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error pausing campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const resumeCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.resumeCampaign(campaignId)
      updateCampaignInList(campaignId, { status: 'sending' })
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error resuming campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.cancelCampaign(campaignId)
      updateCampaignInList(campaignId, { status: 'cancelled' })
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error cancelling campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const archiveCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.archiveCampaign(campaignId)
      updateCampaignInList(campaignId, { status: 'archived' })
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error archiving campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const restoreCampaign = async (campaignId: number | string): Promise<SmsCampaign> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.restoreCampaign(campaignId)
      const newStatus = (response.data as unknown as { new_status?: string } | undefined)?.new_status ?? 'draft'
      updateCampaignInList(campaignId, { status: newStatus, archived_at: null } as Partial<SmsCampaign>)
      return response.data as SmsCampaign
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error restoring campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCampaign = async (campaignId: number | string): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.deleteCampaign(campaignId)
      campaigns.value = campaigns.value.filter((c) => c.id !== campaignId)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error deleting campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCampaignStats = async (campaignId: number | string): Promise<SmsCampaignStats> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getCampaignStats(campaignId)
      return response.data as SmsCampaignStats
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching campaign stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCampaignRecipients = async (campaignId: number | string, filters: CampaignRecipientFilters = {}): Promise<{ data: SmsCampaignRecipient[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getCampaignRecipients(campaignId, filters)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching campaign recipients:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCampaignLogs = async (campaignId: number | string, filters: CampaignLogFilters = {}): Promise<{ data: SmsCampaignLog[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getCampaignLogs(campaignId, filters)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching campaign logs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const sendTestSms = async (testData: TestSmsData): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.sendTestSms(testData)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error sending test SMS:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Helper: Update campaign in list
  const updateCampaignInList = (campaignId: number | string, updates: Partial<SmsCampaign>): void => {
    const index = campaigns.value.findIndex((c) => c.id === campaignId)
    if (index !== -1) {
      campaigns.value[index] = {
        ...campaigns.value[index]!,
        ...updates,
      }
    }

    if (currentCampaign.value && currentCampaign.value.id === campaignId) {
      currentCampaign.value = {
        ...currentCampaign.value,
        ...updates,
      }
    }
  }

  // Helper: Exponential backoff for retries
  const exponentialBackoff = (attemptNumber: number): number => {
    return Math.min(1000 * Math.pow(2, attemptNumber), 30000)
  }

  // Helper: Retry action with exponential backoff
  const retryAction = async (actionFn: () => Promise<unknown>, campaignId: number | string, maxRetries = 3): Promise<unknown> => {
    const retryKey = `${campaignId}_${actionFn.name || 'action'}`

    if (retryAttempts.value[retryKey] === undefined) {
      retryAttempts.value[retryKey] = 0
    }

    try {
      const result = await actionFn()
      retryAttempts.value[retryKey] = 0
      return result
    } catch (err) {
      const currentAttempts = retryAttempts.value[retryKey] ?? 0
      if (currentAttempts < maxRetries) {
        retryAttempts.value[retryKey] = currentAttempts + 1
        const backoffMs = exponentialBackoff(currentAttempts)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        return retryAction(actionFn, campaignId, maxRetries)
      }
      throw err
    }
  }

  const getRetryAttempts = (campaignId: number | string, actionName: string): number => {
    return retryAttempts.value[`${campaignId}_${actionName}`] ?? 0
  }

  // Computed: Active campaigns
  const activeCampaigns = computed((): SmsCampaign[] => {
    return campaigns.value.filter((c) => c.status === 'sending' || c.status === 'paused')
  })

  // Computed: Completed campaigns
  const completedCampaigns = computed((): SmsCampaign[] => {
    return campaigns.value.filter((c) => c.status === 'completed')
  })

  // Computed: Draft campaigns
  const draftCampaigns = computed((): SmsCampaign[] => {
    return campaigns.value.filter((c) => c.status === 'draft')
  })

  return {
    // State
    campaigns,
    currentCampaign,
    loading,
    error,
    retryAttempts,

    // Actions
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    updateCampaign,
    reuseCampaign,
    resendCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    archiveCampaign,
    restoreCampaign,
    deleteCampaign,
    fetchCampaignStats,
    fetchCampaignRecipients,
    fetchCampaignLogs,
    sendTestSms,

    // Helpers
    retryAction,
    getRetryAttempts,

    // Computed
    activeCampaigns,
    completedCampaigns,
    draftCampaigns,
  }
}
