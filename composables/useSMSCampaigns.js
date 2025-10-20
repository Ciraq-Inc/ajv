import { ref, computed } from 'vue'
import campaignService from '~/services/sms/campaignService'

export const useSMSCampaigns = () => {
  const campaigns = ref([])
  const currentCampaign = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Get auth token from company store
  const getToken = () => {
    if (process.server) return null
    
    // Try to get company token first
    const companyStore = useCompanyStore()
    if (companyStore.companyAuthToken) {
      return companyStore.companyAuthToken
    }
    
    // Fallback to checking localStorage directly
    const route = useRoute()
    const companyDomain = route.path.match(/\/([^\/]+)\/services/)?.[1]
    const storageKey = companyDomain ? `company_${companyDomain}` : 'company'
    
    return localStorage.getItem(`${storageKey}_token`) || 
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
      const response = await campaignService.getCampaigns(filters, token)
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
      const response = await campaignService.getCampaignById(campaignId, token)
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
      const response = await campaignService.createCampaign(campaignData, token)
      
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

  // Start campaign
  const startCampaign = async (campaignId) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await campaignService.startCampaign(campaignId, token)
      
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
      const response = await campaignService.pauseCampaign(campaignId, token)
      
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
      const response = await campaignService.resumeCampaign(campaignId, token)
      
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
      const response = await campaignService.cancelCampaign(campaignId, token)
      
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
      const response = await campaignService.deleteCampaign(campaignId, token)
      
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
      const response = await campaignService.getCampaignStats(campaignId, token)
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
      const response = await campaignService.getCampaignRecipients(campaignId, filters, token)
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
      const response = await campaignService.getCampaignLogs(campaignId, filters, token)
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
      const response = await campaignService.sendTestSms(testData, token)
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
    
    // Actions
    fetchCampaigns,
    fetchCampaign,
    createCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    deleteCampaign,
    fetchCampaignStats,
    fetchCampaignRecipients,
    fetchCampaignLogs,
    sendTestSms,
    
    // Computed
    activeCampaigns,
    completedCampaigns,
    draftCampaigns
  }
}
