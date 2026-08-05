<template>
  <div class="admin-sms-usage-page">
    <!-- Header -->
    <div class="mb-4">
      <p class="text-gray-600">Billed SMS volume and cost by company, for a chosen date range.</p>
    </div>

    <!-- Caveat banner -->
    <div class="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <InformationCircleIcon class="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>
        Reflects billed SMS only (marketing campaigns + sale-receipt sends). OTP/verification codes and partner API sends aren't included yet.
      </span>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            v-model="filters.start_date"
            type="date"
            @change="onFilterChange"
            class="h-9 px-3 text-sm appearance-none bg-white border rounded-lg focus:outline-none focus:ring-2"
            :class="dateRangeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            v-model="filters.end_date"
            type="date"
            @change="onFilterChange"
            class="h-9 px-3 text-sm appearance-none bg-white border rounded-lg focus:outline-none focus:ring-2"
            :class="dateRangeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-medium text-gray-600 mb-1">Search company</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by company name..."
            @input="debouncedSearch"
            class="h-9 w-full px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex items-center gap-2 ml-auto">
          <button
            @click="loadSummary()"
            :disabled="loading"
            class="h-9 px-4 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            Refresh
          </button>
          <button
            @click="exportCsv"
            :disabled="exporting || loading"
            class="h-9 px-4 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            <ArrowPathIcon v-if="exporting" class="h-4 w-4 animate-spin" />
            <ArrowDownTrayIcon v-else class="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
      <p v-if="dateRangeError" class="text-xs text-red-600 mt-2">{{ dateRangeError }}</p>
    </div>

    <!-- Stat tiles -->
    <div v-if="!loading && summary" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <DevicePhoneMobileIcon class="h-6 w-6 text-purple-600 mb-2" />
        <p class="text-sm text-gray-600 mb-1">Total Messages</p>
        <p class="text-2xl font-bold text-gray-900">{{ formatNumber(summary.total_messages) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <CurrencyDollarIcon class="h-6 w-6 text-green-600 mb-2" />
        <p class="text-sm text-gray-600 mb-1">Total Cost</p>
        <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(Number(summary.total_cost)) }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <BuildingOfficeIcon class="h-6 w-6 text-blue-600 mb-2" />
        <p class="text-sm text-gray-600 mb-1">Companies With Activity</p>
        <p class="text-2xl font-bold text-gray-900">{{ formatNumber(summary.companies_with_activity) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <ArrowPathIcon class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p class="text-gray-600">Loading usage summary...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="breakdown.length === 0" class="text-center py-12 bg-white rounded-lg border border-gray-200">
      <InboxIcon class="h-16 w-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-600">No billed SMS found for this date range.</p>
    </div>

    <!-- Breakdown table -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase cursor-pointer select-none"
              @click="toggleSort('company_name')"
            >
              Company <SortIndicator field="company_name" :sort-by="sortBy" :sort-order="sortOrder" />
            </th>
            <th
              class="text-right py-3 px-3 text-xs font-medium text-gray-600 uppercase cursor-pointer select-none"
              @click="toggleSort('message_count')"
            >
              Messages <SortIndicator field="message_count" :sort-by="sortBy" :sort-order="sortOrder" />
            </th>
            <th
              class="text-right py-3 px-3 text-xs font-medium text-gray-600 uppercase cursor-pointer select-none"
              @click="toggleSort('total_cost')"
            >
              Total Cost <SortIndicator field="total_cost" :sort-by="sortBy" :sort-order="sortOrder" />
            </th>
            <th
              class="text-right py-3 px-3 text-xs font-medium text-gray-600 uppercase cursor-pointer select-none"
              @click="toggleSort('avg_cost_per_message')"
            >
              Avg Cost/Msg <SortIndicator field="avg_cost_per_message" :sort-by="sortBy" :sort-order="sortOrder" />
            </th>
            <th class="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Last Activity</th>
            <th class="text-center py-3 px-3 text-xs font-medium text-gray-600 uppercase">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="row in breakdown" :key="row.company_id" class="hover:bg-gray-50">
            <td class="py-3 px-3 font-medium text-gray-900">{{ row.company_name }}</td>
            <td class="py-3 px-3 text-right text-gray-900">{{ formatNumber(row.message_count) }}</td>
            <td class="py-3 px-3 text-right text-gray-900 font-medium">{{ formatCurrency(Number(row.total_cost)) }}</td>
            <td class="py-3 px-3 text-right text-gray-600">{{ formatCurrency(Number(row.avg_cost_per_message)) }}</td>
            <td class="py-3 px-3 text-gray-600 whitespace-nowrap">{{ row.last_activity_at ? formatDate(row.last_activity_at, 'short') : 'N/A' }}</td>
            <td class="py-3 px-3 text-center">
              <button
                @click="openDrillDown(row)"
                class="text-xs font-semibold px-2.5 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
              >
                View messages
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Drill-down modal -->
    <teleport to="body">
      <div v-if="selectedCompany" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="closeDrillDown">
        <div class="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedCompany.company_name }}</h3>
              <p class="text-xs text-gray-500">
                {{ filters.start_date || 'all time' }} &ndash; {{ filters.end_date || 'now' }}
              </p>
            </div>
            <button @click="closeDrillDown" class="text-gray-500 hover:text-gray-700">
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <div class="overflow-y-auto flex-1">
            <div v-if="drillDownLoading" class="text-center py-10">
              <ArrowPathIcon class="h-8 w-8 animate-spin mx-auto text-blue-600" />
            </div>
            <table v-else class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th class="text-left py-2 px-3 text-xs font-medium text-gray-600 uppercase">Description</th>
                  <th class="text-right py-2 px-3 text-xs font-medium text-gray-600 uppercase">Count</th>
                  <th class="text-right py-2 px-3 text-xs font-medium text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="tx in drillDownTransactions" :key="tx.id">
                  <td class="py-2 px-3 text-gray-600 whitespace-nowrap">{{ formatDate(tx.created_at, 'short') }}</td>
                  <td class="py-2 px-3 text-gray-900">{{ tx.description || '—' }}</td>
                  <td class="py-2 px-3 text-right text-gray-600">{{ tx.sms_count ?? '—' }}</td>
                  <td class="py-2 px-3 text-right text-gray-900 font-medium">{{ formatCurrency(Number(tx.amount)) }}</td>
                </tr>
                <tr v-if="drillDownTransactions.length === 0">
                  <td colspan="4" class="py-8 text-center text-gray-500">No messages in this range.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <span class="text-xs text-gray-500">
              {{ drillDownPagination ? `${drillDownPagination.offset + 1}-${Math.min(drillDownPagination.offset + drillDownPagination.limit, drillDownPagination.total)} of ${drillDownPagination.total}` : '' }}
            </span>
            <div class="flex gap-2">
              <button
                @click="drillDownPrevPage"
                :disabled="drillDownOffset === 0 || drillDownLoading"
                class="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                @click="drillDownNextPage"
                :disabled="!drillDownPagination?.has_more || drillDownLoading"
                class="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, h } from 'vue'
import {
  InformationCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  InboxIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useSMSUsageReport } from '~/composables/useSMSUsageReport'
import { formatCurrency, formatDate, formatNumber } from '~/utils/constants/sms'
import type { SmsUsageSummaryRow } from '~/services/types'
import type { UsageSummaryFilters } from '~/services/sms/usageReportsService'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

type SortField = 'message_count' | 'total_cost' | 'company_name' | 'avg_cost_per_message'

const {
  summary,
  breakdown,
  loading,
  drillDownTransactions,
  drillDownPagination,
  drillDownLoading,
  fetchUsageSummary,
  exportUsageCsv,
  fetchCompanyTransactions,
} = useSMSUsageReport()

const defaultEndDate = new Date().toISOString().split('T')[0] ?? ''
const defaultStartDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0] ?? ''
})()

const filters = ref<{ start_date: string; end_date: string; search: string }>({
  start_date: defaultStartDate,
  end_date: defaultEndDate,
  search: '',
})

const sortBy = ref<SortField>('total_cost')
const sortOrder = ref<'asc' | 'desc'>('desc')
const dateRangeError = ref<string | null>(null)
const exporting = ref(false)

const selectedCompany = ref<SmsUsageSummaryRow | null>(null)
const drillDownOffset = ref(0)
const DRILL_DOWN_LIMIT = 25

const validateDateRange = (): boolean => {
  if (filters.value.start_date && filters.value.end_date) {
    if (new Date(filters.value.start_date) > new Date(filters.value.end_date)) {
      dateRangeError.value = 'Start date cannot be after end date. Please swap the dates.'
      return false
    }
  }
  dateRangeError.value = null
  return true
}

const buildFilters = (): UsageSummaryFilters => ({
  start_date: filters.value.start_date || undefined,
  end_date: filters.value.end_date || undefined,
  search: filters.value.search || undefined,
  sort_by: sortBy.value,
  order: sortOrder.value,
})

const loadSummary = async (): Promise<void> => {
  if (!validateDateRange()) return
  await fetchUsageSummary(buildFilters())
}

const onFilterChange = () => {
  void loadSummary()
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined
const debouncedSearch = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    void loadSummary()
  }, 400)
}

const toggleSort = (field: SortField) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
  void loadSummary()
}

const exportCsv = async (): Promise<void> => {
  if (!validateDateRange()) return
  exporting.value = true
  try {
    const blob = await exportUsageCsv(buildFilters())
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sms-usage-summary_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed. Please try again.')
  } finally {
    exporting.value = false
  }
}

const loadDrillDown = async (): Promise<void> => {
  if (!selectedCompany.value) return
  await fetchCompanyTransactions(selectedCompany.value.company_id, {
    transaction_type: 'sms_deduction',
    start_date: filters.value.start_date || undefined,
    end_date: filters.value.end_date || undefined,
    limit: DRILL_DOWN_LIMIT,
    offset: drillDownOffset.value,
  })
}

const openDrillDown = (row: SmsUsageSummaryRow) => {
  selectedCompany.value = row
  drillDownOffset.value = 0
  void loadDrillDown()
}

const closeDrillDown = () => {
  selectedCompany.value = null
}

const drillDownNextPage = () => {
  if (!drillDownPagination.value?.has_more) return
  drillDownOffset.value += DRILL_DOWN_LIMIT
  void loadDrillDown()
}

const drillDownPrevPage = () => {
  drillDownOffset.value = Math.max(0, drillDownOffset.value - DRILL_DOWN_LIMIT)
  void loadDrillDown()
}

// Small inline sort-direction caret, avoids a separate SFC for one glyph.
const SortIndicator = defineComponent({
  props: { field: { type: String, required: true }, sortBy: { type: String, required: true }, sortOrder: { type: String, required: true } },
  setup(props) {
    return () => {
      if (props.field !== props.sortBy) return h('span', { class: 'text-gray-300 ml-0.5' }, '↕')
      return h('span', { class: 'text-indigo-600 ml-0.5' }, props.sortOrder === 'asc' ? '↑' : '↓')
    }
  },
})

onMounted(() => {
  void loadSummary()
})
</script>
