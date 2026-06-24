import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { createCreditsService } from '~/services/sms/creditsService'
import type { TransactionFilters, StatisticsFilters, CompanyOverviewFilters } from '~/services/sms/creditsService'
import type { SmsBalance, SmsOverview, SmsTransaction, SmsStatistics, SmsCompanyOverview } from '~/services/types'

// Extended balance shape actually returned by the backend
interface SmsBalanceFull extends SmsBalance {
  sms_balance?: number
  money_balance?: number
  available_balance?: number
}

// Extended rate shape returned by getSmsRate
interface SmsRateFull {
  rate?: number
  sms_rate_per_unit?: number
}

// Extended sender-id shape returned by getSenderId
interface SmsSenderIdFull {
  sender_id?: string
}

export const useSMSCredits = () => {
  const service = createCreditsService(useApi())

  const balance = ref<SmsBalanceFull | null>(null)
  const overview = ref<SmsOverview | null>(null)
  const transactions = ref<SmsTransaction[]>([])
  const statistics = ref<SmsStatistics | null>(null)
  const allCompaniesOverview = ref<SmsCompanyOverview[]>([])
  const lowBalanceCompanies = ref<SmsCompanyOverview[]>([])
  const smsRate = ref<SmsRateFull | null>(null)
  const senderId = ref<SmsSenderIdFull | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========== Company Functions ==========

  const fetchBalance = async (): Promise<SmsBalance> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getBalance()
      balance.value = response.data as unknown as SmsBalanceFull
      return response.data as SmsBalance
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching balance:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOverview = async (): Promise<SmsOverview> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getOverview()
      overview.value = response.data ?? null
      return response.data as SmsOverview
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTransactions = async (filters: TransactionFilters & { sms_only?: boolean; money_only?: boolean } = {}): Promise<{ data: SmsTransaction[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getTransactions(filters)
      let fetchedTransactions: SmsTransaction[] = response.data || []

      if (filters.sms_only) {
        fetchedTransactions = fetchedTransactions.filter((t) =>
          t.transaction_type === 'sms_deduction' ||
          t.transaction_type === 'sms_topup' ||
          t.transaction_type === 'sms_refund' ||
          t.transaction_type === 'sent' ||
          ((t as SmsTransaction & { sms_count?: number }).sms_count ?? 0) > 0 && (
            t.transaction_type === 'topup' ||
            t.transaction_type === 'refund' ||
            t.transaction_type === 'deduction'
          )
        )
      } else if (filters.money_only) {
        fetchedTransactions = fetchedTransactions.filter((t) =>
          t.transaction_type === 'money_deduction' ||
          t.transaction_type === 'money_topup' ||
          t.transaction_type === 'money_refund' ||
          t.transaction_type === 'topup' ||
          t.transaction_type === 'deduction' ||
          t.transaction_type === 'refund'
        )
      }

      transactions.value = fetchedTransactions
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async (filters: StatisticsFilters = {}): Promise<SmsStatistics> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getStatistics(filters)
      statistics.value = response.data ?? null
      return response.data as SmsStatistics
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching statistics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const purchaseCredits = async (smsCount: number): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.purchaseCredits(smsCount)

      if (response.data && typeof response.data === 'object') {
        const r = response.data as { sms_balance?: number; money_balance?: number }
        if (r.sms_balance !== undefined || r.money_balance !== undefined) {
          const updated: SmsBalanceFull = {
            balance: r.sms_balance ?? balance.value?.balance ?? 0,
          }
          if (r.sms_balance !== undefined) updated.sms_balance = r.sms_balance
          if (r.money_balance !== undefined) updated.money_balance = r.money_balance
          balance.value = { ...balance.value, ...updated }
        }
      }

      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error purchasing credits:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const estimateCost = async (recipientCount: number): Promise<{ cost: number; per_sms: number }> => {
    error.value = null

    try {
      const response = await service.estimateCost(recipientCount)
      return response.data as { cost: number; per_sms: number }
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error estimating cost:', err)
      throw err
    }
  }

  const fetchSmsRate = async (): Promise<{ rate: number }> => {
    error.value = null

    try {
      const response = await service.getSmsRate()
      smsRate.value = response.data as unknown as SmsRateFull
      return response.data as { rate: number }
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching SMS rate:', err)
      throw err
    }
  }

  const fetchSenderId = async (): Promise<{ sender_id: string }> => {
    error.value = null

    try {
      const response = await service.getSenderId()
      senderId.value = response.data as unknown as SmsSenderIdFull
      return response.data as { sender_id: string }
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching sender ID:', err)
      throw err
    }
  }

  // ========== Admin Functions ==========

  const fetchAllCompaniesOverview = async (filters: CompanyOverviewFilters = {}): Promise<{ data: SmsCompanyOverview[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getAllCompaniesOverview(filters)
      allCompaniesOverview.value = response.data || []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching companies overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchLowBalanceCompanies = async (threshold = 100): Promise<{ data: SmsCompanyOverview[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getLowBalanceCompanies(threshold)
      lowBalanceCompanies.value = response.data || []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching low balance companies:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const topUpMoney = async (companyId: number | string, amount: number, description = ''): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.topUpMoney(companyId, amount, description)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error topping up money:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const topUpSms = async (companyId: number | string, smsCount: number, description = ''): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.topUpSms(companyId, smsCount, description)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error topping up SMS:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCompanyTransactions = async (companyId: number | string, filters: TransactionFilters = {}): Promise<{ data: SmsTransaction[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getCompanyTransactions(companyId, filters)
      transactions.value = response.data || []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching company transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========== Computed Properties ==========

  const smsBalance = computed((): number => {
    return balance.value?.sms_balance ?? 0
  })

  const moneyBalance = computed((): number => {
    return balance.value?.money_balance ?? 0
  })

  const smsRate_value = computed((): number => {
    return smsRate.value?.sms_rate_per_unit ?? 0.05
  })

  const canAffordCredits = computed(() => {
    return (creditCount: number): boolean => {
      const cost = creditCount * smsRate_value.value
      return moneyBalance.value >= cost
    }
  })

  const totalCompaniesWithLowBalance = computed((): number => {
    return lowBalanceCompanies.value.length
  })

  const totalSmsBalance = computed((): number => {
    return allCompaniesOverview.value.reduce((sum, company) => {
      return sum + ((company as SmsCompanyOverview & { sms_balance?: number }).sms_balance ?? 0)
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
