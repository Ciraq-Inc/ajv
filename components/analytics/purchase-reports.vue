<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Purchase Items</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comprehensive purchase transaction insights across all companies</p>
    </div>

    <!-- Filters and Controls -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div class="flex flex-wrap items-end gap-3">
        <!-- Filter inputs -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            v-model="filters.start_date"
            type="date"
            @change="fetchData"
            class="h-9 px-3 text-sm appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            v-model="filters.end_date"
            type="date"
            @change="fetchData"
            class="h-9 px-3 text-sm appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 ml-auto">
          <button
            @click="exportToCSV"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            :disabled="loading || exportingSummary || exportingRaw"
          >
            <svg v-if="exportingSummary" class="animate-spin w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <ArrowDownTrayIcon v-else class="w-4 h-4" />
            {{ exportingSummary ? 'Exporting…' : 'Summary' }}
          </button>
          <button
            @click="exportRawDataCSV"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            :disabled="loading || exportingSummary || exportingRaw"
            title="Export raw transaction data"
          >
            <svg v-if="exportingRaw" class="animate-spin w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <ArrowDownTrayIcon v-else class="w-4 h-4" />
            {{ exportingRaw ? 'Exporting…' : 'Raw Data' }}
          </button>
          <button
            @click="refreshData"
            class="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
            :disabled="loading"
            aria-label="Refresh"
          >
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" v-if="summary">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500">Total Companies</p>
            <p class="text-2xl font-semibold text-gray-900 mt-1">
              {{ summary.total_companies?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <BuildingOfficeIcon class="w-5 h-5 text-indigo-600" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500">Unique Products</p>
            <p class="text-2xl font-semibold text-gray-900 mt-1">
              {{ summary.unique_products?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingBagIcon class="w-5 h-5 text-emerald-600" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500">Total Transactions</p>
            <p class="text-2xl font-semibold text-gray-900 mt-1">
              {{ summary.total_transactions?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChartBarIcon class="w-5 h-5 text-violet-600" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase Items List -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden" v-if="purchaseItems && purchaseItems.length > 0">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-sm font-semibold text-gray-900">Sample Purchase Items</h3>
        <span class="text-xs text-gray-500">Up to 100 records</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Products</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Suppliers</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Trans. Count</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Quantity</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in purchaseItems" :key="(item.id as PropertyKey | undefined) ?? ''" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.company_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ item.unique_products || 0 }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ item.unique_suppliers || 0 }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ item.transaction_count || 0 }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ item.total_quantity || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
      <div class="flex gap-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-medium text-red-800">Something went wrong</h3>
          <div class="mt-1 text-sm text-red-700">{{ error }}</div>
          <button @click="fetchData" class="mt-2 text-sm text-red-600 hover:text-red-800 underline">Try again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { createReportsExportService } from '~/services/analytics/reportsExportService'
import { ArrowDownTrayIcon, ArrowPathIcon, BuildingOfficeIcon, ShoppingBagIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface PurchaseItem {
  [key: string]: unknown;
}

interface SummaryResponse {
  success?: boolean;
  data?: unknown;
  message?: string;
  [key: string]: unknown;
}

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  makeAuthRequest: (url: string) => Promise<SummaryResponse>;
}

const adminStore = useAdminStore() as unknown as AdminStoreShape
const reportsService = createReportsExportService(useApi())

// Reactive data
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const exportingSummary = ref<boolean>(false)
const exportingRaw = ref<boolean>(false)

// Analytics data
const summary = ref<SummaryResponse | null>(null)
const purchaseItems = ref<PurchaseItem[]>([])

// Filters
const filters = ref<{ start_date: string; end_date: string }>({
  start_date: '',
  end_date: ''
})

// Fetch summary data from the cross-tenant summary API
const fetchSummary = async (): Promise<void> => {
  try {
    const params = new URLSearchParams()
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)

    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/purchase-items?${params}`)
    if (response.success) {
      summary.value = response
    } else {
      summary.value = null
    }
  } catch (err) {
    console.error('Error fetching summary:', err)
    summary.value = null
  }
}

// Fetch sample purchase items
const fetchPurchaseItems = async (): Promise<void> => {
  try {
    const response = await adminStore.makeAuthRequest('/api/reports/cross-tenant/purchase-items/dataview')
    if (response.success) {
      purchaseItems.value = (response.data ?? []) as PurchaseItem[]
    } else {
      purchaseItems.value = []
    }
  } catch (err) {
    console.error('Error fetching purchase items:', err)
    throw err
  }
}

// Fetch all data
const fetchData = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    await Promise.all([
      fetchSummary(),
      fetchPurchaseItems()
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch purchase items data'
    console.error('Error fetching purchase items data:', err)
  } finally {
    loading.value = false
  }
}

// Refresh data
const refreshData = (): void => {
  void fetchData()
}

// Helper functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Export functions
const exportToJSON = async (): Promise<void> => {
  try {
    const params = new URLSearchParams()
    params.append('format', 'json')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)

    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/purchase-items/export?${params}`)
    if (response.success && response.data) {
      const jsonString = JSON.stringify(response.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-purchase-summary_${new Date().toISOString().split('T')[0] ?? ''}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed. Please try again.')
  }
}

const exportToCSV = async (): Promise<void> => {
  exportingSummary.value = true
  try {
    const blob = await reportsService.exportPurchaseItemsSummaryCsv({
      startDate: filters.value.start_date,
      endDate: filters.value.end_date,
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cross-tenant-purchase-items_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed. Please try again.')
  } finally {
    exportingSummary.value = false
  }
}

const exportRawDataCSV = async (): Promise<void> => {
  exportingRaw.value = true
  try {
    const blob = await reportsService.exportPurchaseItemsRawCsv({
      startDate: filters.value.start_date,
      endDate: filters.value.end_date,
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `raw-purchase-items_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Raw data export error:', err)
    alert('Raw data export failed. Please try again.')
  } finally {
    exportingRaw.value = false
  }
}

// Initialize
onMounted(() => {
  void fetchData()
})
</script>

