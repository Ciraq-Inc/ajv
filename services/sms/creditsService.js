/**
 * SMS Credits Service
 * Handles all SMS credit-related API calls
 */

export default (apiBase) => ({
  /**
   * Get company credit balance
   */
  getBalance: async (token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get balance: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get billing overview
   */
  getOverview: async (token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get overview: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get transaction history with filters
   */
  getTransactions: async (filters = {}, token) => {
    const params = new URLSearchParams()

    if (filters.transaction_type) {
      params.append('transaction_type', filters.transaction_type)
    }
    if (filters.start_date) {
      params.append('start_date', filters.start_date)
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    }
    if (filters.offset) {
      params.append('offset', filters.offset)
    }

    const url = `${apiBase}/api/sms-credits/transactions${params.toString() ? '?' + params.toString() : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get transactions: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get transaction statistics
   */
  getStatistics: async (filters = {}, token) => {
    const params = new URLSearchParams()

    if (filters.start_date) {
      params.append('start_date', filters.start_date)
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date)
    }

    const url = `${apiBase}/api/sms-credits/stats${params.toString() ? '?' + params.toString() : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get statistics: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Purchase SMS credits
   */
  purchaseCredits: async (smsCount, token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        sms_count: smsCount,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to purchase credits: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Estimate campaign cost
   */
  estimateCost: async (recipientCount, token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient_count: recipientCount,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to estimate cost: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get current SMS rate
   */
  getSmsRate: async (token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/rate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get SMS rate: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Get company sender ID
   */
  getSenderId: async (token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/sender-id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get sender ID: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Admin: Get all companies credit overview
   */
  getAllCompaniesOverview: async (filters = {}, token) => {
    const params = new URLSearchParams()

    if (filters.low_balance) {
      params.append('low_balance', filters.low_balance)
    }
    if (filters.search) {
      params.append('search', filters.search)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    }
    if (filters.offset) {
      params.append('offset', filters.offset)
    }

    const url = `${apiBase}/api/sms-credits/admin/overview${params.toString() ? '?' + params.toString() : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get companies overview: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Admin: Get low balance companies
   */
  getLowBalanceCompanies: async (threshold = 100, token) => {
    const url = `${apiBase}/api/sms-credits/admin/low-balance?threshold=${threshold}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get low balance companies: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Admin: Top up company money balance
   */
  topUpMoney: async (companyId, amount, description = '', token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/admin/topup-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        company_id: companyId,
        amount: amount,
        description: description,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to top up money: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Admin: Top up company SMS credits
   */
  topUpSms: async (companyId, smsCount, description = '', token) => {
    const response = await fetch(`${apiBase}/api/sms-credits/admin/topup-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        company_id: companyId,
        sms_count: smsCount,
        description: description,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to top up SMS: ${response.status}`)
    }

    return response.json()
  },

  /**
   * Admin: Get company transaction history
   */
  getCompanyTransactions: async (companyId, filters = {}, token) => {
    const params = new URLSearchParams()

    if (filters.transaction_type) {
      params.append('transaction_type', filters.transaction_type)
    }
    if (filters.start_date) {
      params.append('start_date', filters.start_date)
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    }
    if (filters.offset) {
      params.append('offset', filters.offset)
    }

    const url = `${apiBase}/api/sms-credits/admin/transactions/${companyId}${params.toString() ? '?' + params.toString() : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to get company transactions: ${response.status}`)
    }

    return response.json()
  },
})
