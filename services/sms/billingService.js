// SMS Billing API Service
// const apiBase = 'http://localhost:3000/api'

export default (apiBase) => ({

  // ========== Company Endpoints ==========

  // Get current balance
  async getBalance(token) {

    const response = await fetch(`${apiBase}/api/sms-credits/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch balance')
    }

    return await response.json()
  },

  // Get transaction history
  async getTransactions(filters = {}, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const params = new URLSearchParams()

    if (filters.transaction_type) params.append('transaction_type', filters.transaction_type)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset) params.append('offset', filters.offset)

    const response = await fetch(`${apiBase}/api/sms-credits/transactions?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch transactions')
    }

    return await response.json()
  },

  // ========== Admin Endpoints ==========

  // Top up SMS credits
  async topUpCredits(data, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/sms-credits/admin/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to top up credits')
    }

    return await response.json()
  },

  // Top up money balance
  async topUpMoney(data, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/sms-credits/admin/topup-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to top up money')
    }

    return await response.json()
  },

  // Get billing health for all companies
  async getBillingHealth(token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/admin/billing/health`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch billing health')
    }

    return await response.json()
  },

  // Get billing health for specific company
  async getCompanyBillingHealth(companyId, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/admin/billing/health/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch company billing health')
    }

    return await response.json()
  },

  // Run reconciliation for all companies
  async runReconciliation(token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/admin/billing/reconcile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to run reconciliation')
    }

    return await response.json()
  },

  // Run reconciliation for specific company
  async runCompanyReconciliation(companyId, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/admin/billing/reconcile/${companyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to run company reconciliation')
    }

    return await response.json()
  },

  // Get billing issues
  async getBillingIssues(filters = {}, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const params = new URLSearchParams()

    if (filters.company_id) params.append('company_id', filters.company_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.issue_type) params.append('issue_type', filters.issue_type)
    if (filters.limit) params.append('limit', filters.limit)

    const response = await fetch(`${apiBase}/api/admin/billing/issues?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch billing issues')
    }

    return await response.json()
  },

  // Resolve billing issue manually
  async resolveIssue(issueId, data, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const response = await fetch(`${apiBase}/api/admin/billing/issues/${issueId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to resolve issue')
    }

    return await response.json()
  },

  // Get audit log
  async getAuditLog(filters = {}, token) {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const params = new URLSearchParams()

    if (filters.company_id) params.append('company_id', filters.company_id)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.limit) params.append('limit', filters.limit)

    const response = await fetch(`${apiBase}/api/admin/billing/audit?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch audit log')
    }

    return await response.json()
  }
})
