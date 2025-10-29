import { ref, computed } from 'vue'
import creditsService from '~/services/sms/creditsService'

export const useSMSCredits = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  const service = creditsService(apiBase)

  // State
  const balance = ref(null)
  const overview = ref(null)
  const transactions = ref([])
  const statistics = ref(null)
  const allCompaniesOverview = ref([])
  const lowBalanceCompanies = ref([])
  const smsRate = ref(null)
  const senderId = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Get auth token
  const getToken = () => {
    if (process.server) return null

    // Try to get company token first
    const companyStore = useCompanyStore()
    if (companyStore.companyAuthToken) {
      return companyStore.companyAuthToken
    }

    // Try to get admin token
    const adminStore = useAdminStore()
    if (adminStore.token) {
      return adminStore.token
    }

    // Fallback to localStorage
    const route = useRoute()
    const companyDomain = route.path.match(/\/([^\/]+)\/services/)?.[1]
    const storageKey = companyDomain ? `company_${companyDomain}` : 'company'

    return (
      localStorage.getItem('adminToken') ||
      localStorage.getItem(`${storageKey}_token`) ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token')
    )
  }

  // ========== Company Functions ==========

  /**
   * Fetch company credit balance
   */
  const fetchBalance = async () => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

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

  /**
   * Fetch billing overview
   */
  const fetchOverview = async () => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getOverview(token)
      overview.value = response.data || response

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch transaction history with filters
   */
  const fetchTransactions = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

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

  /**
   * Fetch transaction statistics
   */
  const fetchStatistics = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getStatistics(filters, token)
      statistics.value = response.data || response

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching statistics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Purchase SMS credits
   */
  const purchaseCredits = async (smsCount) => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.purchaseCredits(smsCount, token)

      // Update balance after purchase
      if (response.data) {
        balance.value = {
          sms_balance: response.data.sms_balance,
          money_balance: response.data.money_balance,
        }
      }

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error purchasing credits:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Estimate campaign cost
   */
  const estimateCost = async (recipientCount) => {
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.estimateCost(recipientCount, token)

      return response.data || response
    } catch (err) {
      error.value = err.message
      console.error('Error estimating cost:', err)
      throw err
    }
  }

  /**
   * Fetch current SMS rate
   */
  const fetchSmsRate = async () => {
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getSmsRate(token)
      smsRate.value = response.data || response

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching SMS rate:', err)
      throw err
    }
  }

  /**
   * Fetch company sender ID
   */
  const fetchSenderId = async () => {
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getSenderId(token)
      senderId.value = response.data || response

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching sender ID:', err)
      throw err
    }
  }

  // ========== Admin Functions ==========

  /**
   * Admin: Fetch all companies credit overview
   */
  const fetchAllCompaniesOverview = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getAllCompaniesOverview(filters, token)
      allCompaniesOverview.value = response.data || response.companies || []

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching companies overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Admin: Fetch low balance companies
   */
  const fetchLowBalanceCompanies = async (threshold = 100) => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getLowBalanceCompanies(threshold, token)
      lowBalanceCompanies.value = response.data || response.companies || []

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching low balance companies:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Admin: Top up company money balance
   */
  const topUpMoney = async (companyId, amount, description = '') => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.topUpMoney(companyId, amount, description, token)

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error topping up money:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Admin: Top up company SMS credits
   */
  const topUpSms = async (companyId, smsCount, description = '') => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.topUpSms(companyId, smsCount, description, token)

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error topping up SMS:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Admin: Fetch company transaction history
   */
  const fetchCompanyTransactions = async (companyId, filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token available')

      const response = await service.getCompanyTransactions(companyId, filters, token)
      transactions.value = response.data || response.transactions || []

      return response
    } catch (err) {
      error.value = err.message
      console.error('Error fetching company transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========== Computed Properties ==========

  const smsBalance = computed(() => {
    return balance.value?.sms_balance || 0
  })

  const moneyBalance = computed(() => {
    return balance.value?.money_balance || 0
  })

  const smsRate_value = computed(() => {
    return smsRate.value?.sms_rate_per_unit || 0.05
  })

  const canAffordCredits = computed(() => {
    return (creditCount) => {
      const cost = creditCount * smsRate_value.value
      return moneyBalance.value >= cost
    }
  })

  const totalCompaniesWithLowBalance = computed(() => {
    return lowBalanceCompanies.value.length
  })

  const totalSmsBalance = computed(() => {
    return allCompaniesOverview.value.reduce((sum, company) => {
      return sum + (company.sms_balance || 0)
    }, 0)
  })

  return {
    // State
    balance,
    overview,
    transactions,
    statistics,
    allCompaniesOverview,
    lowBalanceCompanies,
    smsRate,
    senderId,
    loading,
    error,

    // Company Actions
    fetchBalance,
    fetchOverview,
    fetchTransactions,
    fetchStatistics,
    purchaseCredits,
    estimateCost,
    fetchSmsRate,
    fetchSenderId,

    // Admin Actions
    fetchAllCompaniesOverview,
    fetchLowBalanceCompanies,
    topUpMoney,
    topUpSms,
    fetchCompanyTransactions,

    // Computed
    smsBalance,
    moneyBalance,
    smsRate_value,
    canAffordCredits,
    totalCompaniesWithLowBalance,
    totalSmsBalance,
  }
}
