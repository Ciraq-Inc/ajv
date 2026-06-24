// SMS Billing API Service

export const createBillingService = (apiBase) => {
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null

  return {

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
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
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
    async topUpCredits(data) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/sms-credits/admin/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
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
    async topUpMoney(data) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/sms-credits/admin/topup-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
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
    async getBillingHealth() {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/admin/billing/health`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch billing health')
      }

      return await response.json()
    },

    // Get billing health for specific company
    async getCompanyBillingHealth(companyId) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/admin/billing/health/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch company billing health')
      }

      return await response.json()
    },

    // Run reconciliation for all companies
    async runReconciliation() {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/admin/billing/reconcile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to run reconciliation')
      }

      return await response.json()
    },

    // Run reconciliation for specific company
    async runCompanyReconciliation(companyId) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/admin/billing/reconcile/${companyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to run company reconciliation')
      }

      return await response.json()
    },

    // Get billing issues
    async getBillingIssues(filters = {}) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const params = new URLSearchParams()

      if (filters.company_id) params.append('company_id', filters.company_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.issue_type) params.append('issue_type', filters.issue_type)
      if (filters.limit) params.append('limit', filters.limit)

      const response = await fetch(`${apiBase}/api/admin/billing/issues?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch billing issues')
      }

      return await response.json()
    },

    // Resolve billing issue manually
    async resolveIssue(issueId, data) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/admin/billing/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
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
    async getAuditLog(filters = {}) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const params = new URLSearchParams()

      if (filters.company_id) params.append('company_id', filters.company_id)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.limit) params.append('limit', filters.limit)

      const response = await fetch(`${apiBase}/api/admin/billing/audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch audit log')
      }

      return await response.json()
    },

    // Get current SMS rate (admin)
    async adminGetRate() {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/sms-credits/admin/rate`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch SMS rate')
      }
      return await response.json()
    },

    // Purchase SMS credits from money balance for a company (admin)
    async adminPurchaseCredits(data) {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const response = await fetch(`${apiBase}/api/sms-credits/admin/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to purchase SMS credits')
      }
      return await response.json()
    }
  }
}
