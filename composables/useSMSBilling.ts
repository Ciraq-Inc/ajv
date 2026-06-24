import { ref, computed } from 'vue'
import { createBillingService } from '~/services/sms/billingService'
import type { BillingTransactionFilters, BillingIssueFilters, AuditLogFilters, TopUpCreditsData, TopUpMoneyData, ResolveIssueData, AdminPurchaseCreditsData, AdminPurchaseCreditsResult } from '~/services/sms/billingService'
import type { SmsBalance, SmsTransaction, BillingHealth, BillingIssue, AuditLogEntry } from '~/services/types'

export const useSMSBilling = () => {
  const service = createBillingService(useApi())

  const smsRate = ref<number | null>(null)
  const purchasingCredits = ref(false)
  const balance = ref<SmsBalance | null>(null)
  const transactions = ref<SmsTransaction[]>([])
  const billingHealth = ref<BillingHealth[]>([])
  const billingIssues = ref<BillingIssue[]>([])
  const auditLog = ref<AuditLogEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========== Company Functions ==========

  const fetchBalance = async (): Promise<SmsBalance> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getBalance()
      balance.value = response.data ?? null
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

  const fetchTransactions = async (filters: BillingTransactionFilters & { money_only?: boolean; sms_only?: boolean } = {}): Promise<{ data: SmsTransaction[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getTransactions(filters)
      let fetchedTransactions: SmsTransaction[] = response.data || []

      if (filters.money_only) {
        fetchedTransactions = fetchedTransactions.filter((t) =>
          t.transaction_type === 'money_deduction' ||
          t.transaction_type === 'money_topup' ||
          t.transaction_type === 'money_refund' ||
          t.transaction_type === 'topup' ||
          t.transaction_type === 'deduction' ||
          t.transaction_type === 'refund'
        )
      } else if (filters.sms_only) {
        fetchedTransactions = fetchedTransactions.filter((t) =>
          t.transaction_type === 'sms_deduction' ||
          t.transaction_type === 'sms_topup' ||
          t.transaction_type === 'sms_refund'
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

  // ========== Admin Functions ==========

  const topUpCredits = async (topUpData: TopUpCreditsData): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.topUpCredits(topUpData)
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error topping up credits:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const topUpMoney = async (topUpData: TopUpMoneyData): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.topUpMoney(topUpData)
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

  const fetchBillingHealth = async (companyId: number | string | null = null): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      let response: { data: BillingHealth | BillingHealth[] }

      if (companyId !== null) {
        response = await service.getCompanyBillingHealth(companyId)
      } else {
        response = await service.getBillingHealth()
      }

      const healthData: unknown = (response.data as { companies?: unknown }).companies ?? response.data
      billingHealth.value = Array.isArray(healthData) ? (healthData as BillingHealth[]) : [healthData as BillingHealth]
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching billing health:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const runReconciliation = async (companyId: number | string | null = null): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = companyId !== null
        ? await service.runCompanyReconciliation(companyId)
        : await service.runReconciliation()
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error running reconciliation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBillingIssues = async (filters: BillingIssueFilters = {}): Promise<{ data: BillingIssue[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getBillingIssues(filters)
      billingIssues.value = response.data || []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching billing issues:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const resolveIssue = async (issueId: number | string, resolutionData: ResolveIssueData): Promise<unknown> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.resolveIssue(issueId, resolutionData)

      const index = billingIssues.value.findIndex((issue) => issue.id === issueId)
      if (index !== -1) {
        billingIssues.value[index] = {
          ...billingIssues.value[index]!,
          status: 'resolved',
          ...(resolutionData as Partial<BillingIssue>),
        }
      }

      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error resolving issue:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const adminGetRate = async (): Promise<void> => {
    try {
      const response = await service.adminGetRate()
      smsRate.value = response.data?.rate ?? null
    } catch (err) {
      console.error('Error fetching SMS rate:', err)
    }
  }

  const adminPurchaseCredits = async (data: AdminPurchaseCreditsData): Promise<AdminPurchaseCreditsResult> => {
    purchasingCredits.value = true
    error.value = null
    try {
      const response = await service.adminPurchaseCredits(data)
      return response.data as AdminPurchaseCreditsResult
    } catch (err) {
      const e = err as Error
      error.value = e.message
      throw err
    } finally {
      purchasingCredits.value = false
    }
  }

  const fetchAuditLog = async (filters: AuditLogFilters = {}): Promise<{ data: AuditLogEntry[] }> => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getAuditLog(filters)
      auditLog.value = response.data || []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching audit log:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========== Computed Properties ==========

  const availableBalance = computed((): number => {
    if (!balance.value) return 0
    const b = balance.value as SmsBalance & { available_balance?: number; sms_balance?: number }
    return b.available_balance ?? b.sms_balance ?? 0
  })

  const reservedCredits = computed((): number => {
    if (!balance.value) return 0
    return (balance.value as SmsBalance & { reserved_credits?: number }).reserved_credits ?? 0
  })

  const hasSufficientBalance = computed(() => {
    return (requiredCredits: number): boolean => {
      return availableBalance.value >= requiredCredits
    }
  })

  const activeIssuesCount = computed((): number => {
    return billingIssues.value.filter(
      (issue) => issue.status === 'detected' || issue.status === 'investigating'
    ).length
  })

  const companiesWithIssues = computed((): number => {
    const uniqueCompanies = new Set(
      billingIssues.value
        .filter((issue) => issue.status === 'detected' || issue.status === 'investigating')
        .map((issue) => issue.company_id)
    )
    return uniqueCompanies.size
  })

  const overallHealthStatus = computed((): string => {
    const healthArray = Array.isArray(billingHealth.value) ? billingHealth.value : []
    if (healthArray.length === 0) return 'unknown'

    const hasIssues = healthArray.some((health) => {
      const h = health as BillingHealth & {
        unbilled_sent_count?: number
        billed_failed_count?: number
        balance_discrepancy?: number
      }
      return (
        (h.unbilled_sent_count ?? 0) > 0 ||
        (h.billed_failed_count ?? 0) > 0 ||
        (h.balance_discrepancy ?? 0) !== 0
      )
    })

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
    smsRate,
    purchasingCredits,

    // Company Actions
    fetchBalance,
    fetchTransactions,

    // Admin Actions
    topUpCredits,
    topUpMoney,
    adminGetRate,
    adminPurchaseCredits,
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
    overallHealthStatus,
  }
}
