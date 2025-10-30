import { ref, computed } from 'vue'
import campaignService from '~/services/sms/campaignService'

export const useSMSCampaigns = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  const service = campaignService(apiBase)
  const campaigns = ref([])
  const currentCampaign = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const retryAttempts = ref({}) // Track retry attempts per campaign action

  // Get auth token from company store or admin store
  const getToken = () => {
    if (process.server) return null
    
    const route = useRoute()
    const isAdminPage = route.path.startsWith('/admin')
    
    // For admin pages, get token from admin store
    if (isAdminPage) {
      const adminStore = useAdminStore()
      if (adminStore.token) {
        return adminStore.token
      }
    }
    
    // For company pages, get token from company store
    const companyStore = useCompanyStore()
    if (companyStore.companyAuthToken) {
      return companyStore.companyAuthToken
    }
    
    // Fallback to checking localStorage directly
    const companyDomain = route.path.match(/\/([^\/]+)\/services/)?.[1]
    const storageKey = companyDomain ? `company_${companyDomain}` : 'company'
    
    return localStorage.getItem(`${storageKey}_token`) || 
           localStorage.getItem('adminToken') ||
           localStorage.getItem('token') || 
           sessionStorage.getItem('token')
  }
  
  // Get company domain for API headers
  const getCompanyDomain = () => {
    if (process.server) return null
    
    const route = useRoute()
    const pathMatch = route.path.match(/\/([^\/]+)\/services/)
    return pathMatch ? pathMatch[1] : null
  }

  // Fetch all campaigns
  const fetchCampaigns = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const route = useRoute()
      const isAdminPage = route.path.startsWith('/admin')
      
      // Use admin endpoint for admin pages
      let response
      if (isAdminPage) {
        response = await service.getAllCampaignsAdmin(filters, token)
      } else {
        response = await service.getCampaigns(filters, token)
      }
      
      campaigns.value = response.data || response.campaigns || []
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching campaigns:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch single campaign
  const fetchCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getCampaignById(campaignId, token)
      currentCampaign.value = response.data || response.campaign
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create campaign
  const createCampaign = async (campaignData) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.createCampaign(campaignData, token)
      
      // Add to campaigns list if successful
      if (response.data || response.campaign) {
        const newCampaign = response.data || response.campaign
        campaigns.value.unshift(newCampaign)
      }
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error creating campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update campaign
  const updateCampaign = async (campaignId, campaignData) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.updateCampaign(campaignId, campaignData, token)
      
      // Update in campaigns list
      updateCampaignInList(campaignId, response.data || response.campaign || campaignData)
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error updating campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reuse/Duplicate campaign
  const reuseCampaign = async (campaignId, reuseName = null) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.reuseCampaign(campaignId, reuseName ? { name: reuseName } : {}, token)
      
      // Add new campaign to list
      if (response.data || response.campaign) {
        const newCampaign = response.data || response.campaign
        campaigns.value.unshift(newCampaign)
      }
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error reusing campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Resend campaign
  const resendCampaign = async (campaignId, options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.resendCampaign(campaignId, options, token)
      
      // Update campaign status
      updateCampaignInList(campaignId, { status: 'sending' })
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error resending campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Start campaign
  const startCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.startCampaign(campaignId, token)
      
      // Update campaign status in list
      updateCampaignInList(campaignId, { status: 'sending' })
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error starting campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Pause campaign
  const pauseCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.pauseCampaign(campaignId, token)
      
      // Update campaign status in list
      updateCampaignInList(campaignId, { status: 'paused' })
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error pausing campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Resume campaign
  const resumeCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.resumeCampaign(campaignId, token)
      
      // Update campaign status in list
      updateCampaignInList(campaignId, { status: 'sending' })
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error resuming campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cancel campaign
  const cancelCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.cancelCampaign(campaignId, token)
      
      // Update campaign status in list
      updateCampaignInList(campaignId, { status: 'cancelled' })
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error cancelling campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete campaign
  const deleteCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.deleteCampaign(campaignId, token)
      
      // Remove from campaigns list
      campaigns.value = campaigns.value.filter(c => c.id !== campaignId)
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error deleting campaign:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get campaign statistics
  const fetchCampaignStats = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getCampaignStats(campaignId, token)
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching campaign stats:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get campaign recipients
  const fetchCampaignRecipients = async (campaignId, filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getCampaignRecipients(campaignId, filters, token)
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching campaign recipients:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get campaign logs
  const fetchCampaignLogs = async (campaignId, filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getCampaignLogs(campaignId, filters, token)
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching campaign logs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Send test SMS
  const sendTestSms = async (testData) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.sendTestSms(testData, token)
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error sending test SMS:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Helper: Update campaign in list
  const updateCampaignInList = (campaignId, updates) => {
    const index = campaigns.value.findIndex(c => c.id === campaignId)
    if (index !== -1) {
      campaigns.value[index] = {
        ...campaigns.value[index],
        ...updates
      }
    }
    
    // Also update current campaign if it's the same
    if (currentCampaign.value && currentCampaign.value.id === campaignId) {
      currentCampaign.value = {
        ...currentCampaign.value,
        ...updates
      }
    }
  }

  // Helper: Exponential backoff for retries
  const exponentialBackoff = (attemptNumber) => {
    // First retry: 1 second, second retry: 2 seconds, third: 4 seconds, etc.
    return Math.min(1000 * Math.pow(2, attemptNumber), 30000) // Max 30 seconds
  }

  // Helper: Retry action with exponential backoff
  const retryAction = async (actionFn, campaignId, maxRetries = 3) => {
    const retryKey = `${campaignId}_${actionFn.name || 'action'}`
    
    if (!retryAttempts.value[retryKey]) {
      retryAttempts.value[retryKey] = 0
    }

    try {
      const result = await actionFn()
      // Reset retry counter on success
      retryAttempts.value[retryKey] = 0
      return result
    } catch (err) {
      if (retryAttempts.value[retryKey] < maxRetries) {
        retryAttempts.value[retryKey]++
        const backoffMs = exponentialBackoff(retryAttempts.value[retryKey] - 1)
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        
        // Recursive retry
        return retryAction(actionFn, campaignId, maxRetries)
      }
      
      throw err
    }
  }

  // Get retry attempts for a campaign action
  const getRetryAttempts = (campaignId, actionName) => {
    return retryAttempts.value[`${campaignId}_${actionName}`] || 0
  }

  // Computed: Active campaigns
  const activeCampaigns = computed(() => {
    return campaigns.value.filter(c => c.status === 'sending' || c.status === 'paused')
  })

  // Computed: Completed campaigns
  const completedCampaigns = computed(() => {
    return campaigns.value.filter(c => c.status === 'completed')
  })

  // Computed: Draft campaigns
  const draftCampaigns = computed(() => {
    return campaigns.value.filter(c => c.status === 'draft')
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
    draftCampaigns
  }
}
