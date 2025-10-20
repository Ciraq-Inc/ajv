// SMS Campaign API Service
const API_BASE_URL = 'http://localhost:3000/api'

export default {
  // Create a new campaign
  async createCampaign(data, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create campaign')
    }
    
    return await response.json()
  },

  // Get all campaigns with optional filters
  async getCampaigns(filters = {}, token) {
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset) params.append('offset', filters.offset)
    
    const response = await fetch(`${API_BASE_URL}/sms-campaigns?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch campaigns')
    }
    
    return await response.json()
  },

  // Get campaign by ID
  async getCampaignById(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch campaign')
    }
    
    return await response.json()
  },

  // Start campaign
  async startCampaign(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to start campaign')
    }
    
    return await response.json()
  },

  // Pause campaign
  async pauseCampaign(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/pause`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to pause campaign')
    }
    
    return await response.json()
  },

  // Resume campaign
  async resumeCampaign(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to resume campaign')
    }
    
    return await response.json()
  },

  // Cancel campaign
  async cancelCampaign(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to cancel campaign')
    }
    
    return await response.json()
  },

  // Get campaign statistics
  async getCampaignStats(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch campaign statistics')
    }
    
    return await response.json()
  },

  // Get campaign recipients
  async getCampaignRecipients(campaignId, filters = {}, token) {
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset) params.append('offset', filters.offset)
    
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/recipients?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch recipients')
    }
    
    return await response.json()
  },

  // Get campaign logs
  async getCampaignLogs(campaignId, filters = {}, token) {
    const params = new URLSearchParams()
    
    if (filters.log_type) params.append('log_type', filters.log_type)
    if (filters.limit) params.append('limit', filters.limit)
    
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}/logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch campaign logs')
    }
    
    return await response.json()
  },

  // Send test SMS
  async sendTestSms(data, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/test/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send test SMS')
    }
    
    return await response.json()
  },

  // Delete campaign
  async deleteCampaign(campaignId, token) {
    const response = await fetch(`${API_BASE_URL}/sms-campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete campaign')
    }
    
    return await response.json()
  }
}
