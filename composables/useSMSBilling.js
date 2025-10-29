import { ref, computed } from 'vue'
import billingService from '~/services/sms/billingService'

export const useSMSBilling = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  const service = billingService(apiBase)
  const balance = ref(null)
  const transactions = ref([])
  const billingHealth = ref([])
  const billingIssues = ref([])
  const auditLog = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Get auth token from company store or admin store
  const getToken = () => {
    if (process.server) return null
    
    // Try to get admin token first (for admin pages)
    const adminStore = useAdminStore()
    if (adminStore.token) {
      return adminStore.token
    }
    
    // Try to get company token
    const companyStore = useCompanyStore()
    if (companyStore.companyAuthToken) {
      return companyStore.companyAuthToken
    }
    
    // Fallback to checking localStorage directly
    const route = useRoute()
    const companyDomain = route.path.match(/\/([^\/]+)\/services/)?.[1]
    const storageKey = companyDomain ? `company_${companyDomain}` : 'company'
    
    return localStorage.getItem('adminToken') || 
           localStorage.getItem(`${storageKey}_token`) || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('token')
  }

  // ========== Company Functions ==========

  // Fetch balance
  const fetchBalance = async () => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getBalance(token)
      balance.value = response.data || response
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching balance:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch transactions
  const fetchTransactions = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getTransactions(filters, token)
      transactions.value = response.data || response.transactions || []
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========== Admin Functions ==========

  // Top up credits
  const topUpCredits = async (topUpData) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.topUpCredits(topUpData, token)
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error topping up credits:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Top up money
  const topUpMoney = async (topUpData) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.topUpMoney(topUpData, token)
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error topping up money:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch billing health
  const fetchBillingHealth = async (companyId = null) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      let response
      
      if (companyId) {
        response = await service.getCompanyBillingHealth(companyId, token)
      } else {
        response = await service.getBillingHealth(token)
      }
      
      const healthData = response.data || response.health || response
      billingHealth.value = Array.isArray(healthData) ? healthData : [healthData]
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching billing health:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Run reconciliation
  const runReconciliation = async (companyId = null) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      let response
      
      if (companyId) {
        response = await service.runCompanyReconciliation(companyId, token)
      } else {
        response = await service.runReconciliation(token)
      }
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error running reconciliation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch billing issues
  const fetchBillingIssues = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getBillingIssues(filters, token)
      billingIssues.value = response.data || response.issues || []
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching billing issues:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Resolve billing issue
  const resolveIssue = async (issueId, resolutionData) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.resolveIssue(issueId, resolutionData, token)
      
      // Update issue in list
      const index = billingIssues.value.findIndex(issue => issue.id === issueId)
      if (index !== -1) {
        billingIssues.value[index] = {
          ...billingIssues.value[index],
          status: 'resolved',
          ...resolutionData
        }
      }
      
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error resolving issue:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch audit log
  const fetchAuditLog = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const token = getToken()
      const response = await service.getAuditLog(filters, token)
      auditLog.value = response.data || response.audit_log || []
      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching audit log:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========== Computed Properties ==========

  // Available balance
  const availableBalance = computed(() => {
    if (!balance.value) return 0
    return balance.value.available_balance || balance.value.sms_balance || 0
  })

  // Reserved credits
  const reservedCredits = computed(() => {
    if (!balance.value) return 0
    return balance.value.reserved_credits || 0
  })

  // Has sufficient balance
  const hasSufficientBalance = computed(() => {
    return (requiredCredits) => {
      return availableBalance.value >= requiredCredits
    }
  })

  // Active issues count
  const activeIssuesCount = computed(() => {
    return billingIssues.value.filter(issue => 
      issue.status === 'detected' || issue.status === 'investigating'
    ).length
  })

  // Total companies with issues
  const companiesWithIssues = computed(() => {
    const uniqueCompanies = new Set(
      billingIssues.value
        .filter(issue => issue.status === 'detected' || issue.status === 'investigating')
        .map(issue => issue.company_id)
    )
    return uniqueCompanies.size
   })

  // Health status
  const overallHealthStatus = computed(() => {
    const healthArray = Array.isArray(billingHealth.value) ? billingHealth.value : []
    if (!healthArray || healthArray.length === 0) {
      return 'unknown'
    }
    
    const hasIssues = healthArray.some(health => 
      health.unbilled_sent_count > 0 || 
      health.billed_failed_count > 0 ||
      health.balance_discrepancy !== 0
    )
    
    return hasIssues ? 'warning' : 'healthy'
  })

  return {
    // State
    balance,
    transactions,
    billingHealth,
    billingIssues,
    auditLog,
    loading,
    error,
    
    // Company Actions
    fetchBalance,
    fetchTransactions,
    
    // Admin Actions
    topUpCredits,
    topUpMoney,
    fetchBillingHealth,
    runReconciliation,
    fetchBillingIssues,
    resolveIssue,
    fetchAuditLog,
    
    // Computed
    availableBalance,
    reservedCredits,
    hasSufficientBalance,
    activeIssuesCount,
    companiesWithIssues,
    overallHealthStatus
  }
}
