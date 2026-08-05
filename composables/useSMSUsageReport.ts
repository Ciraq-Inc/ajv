import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { createUsageReportsService } from '~/services/sms/usageReportsService'
import type { UsageSummaryFilters, CompanyTransactionFilters } from '~/services/sms/usageReportsService'
import type { SmsUsageSummaryRow, SmsTransaction, Company } from '~/services/types'

export const useSMSUsageReport = () => {
  const service = createUsageReportsService(useApi())

  const summary = ref<{ companies_with_activity: number; total_messages: number; total_cost: number } | null>(null)
  const breakdown = ref<SmsUsageSummaryRow[]>([])
  const companies = ref<Company[]>([])
  const drillDownTransactions = ref<SmsTransaction[]>([])
  const drillDownPagination = ref<{ total: number; limit: number; offset: number; has_more: boolean } | null>(null)
  const loading = ref(false)
  const drillDownLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsageSummary = async (filters: UsageSummaryFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await service.getUsageSummary(filters)
      summary.value = response.summary ?? null
      breakdown.value = response.data ?? []
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching SMS usage summary:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const exportUsageCsv = async (filters: UsageSummaryFilters = {}): Promise<Blob> => {
    try {
      return await service.exportUsageSummaryCsv(filters)
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error exporting SMS usage summary:', err)
      throw err
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await service.listCompanies()
      companies.value = response.data ?? []
      return response
    } catch (err) {
      console.error('Error fetching companies:', err)
      throw err
    }
  }

  const fetchCompanyTransactions = async (companyId: number | string, filters: CompanyTransactionFilters = {}) => {
    drillDownLoading.value = true
    error.value = null

    try {
      const response = await service.getCompanyTransactions(companyId, filters)
      drillDownTransactions.value = response.data ?? []
      drillDownPagination.value = response.pagination ?? null
      return response
    } catch (err) {
      const e = err as Error
      error.value = e.message
      console.error('Error fetching company transactions:', err)
      throw err
    } finally {
      drillDownLoading.value = false
    }
  }

  return {
    // State
    summary,
    breakdown,
    companies,
    drillDownTransactions,
    drillDownPagination,
    loading,
    drillDownLoading,
    error,

    // Actions
    fetchUsageSummary,
    exportUsageCsv,
    fetchCompanies,
    fetchCompanyTransactions,
  }
}
