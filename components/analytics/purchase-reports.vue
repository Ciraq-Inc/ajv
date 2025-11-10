<template>
  <div class="purchase-items-analytics p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        Purchase Items 
      </h1>
      <p class="text-gray-600">
        Comprehensive purchase transaction insights across all companies
      </p>
    </div>

    <!-- Filters and Controls -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="filters.start_date"
              type="date"
              @change="fetchData"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              v-model="filters.end_date"
              type="date"
              @change="fetchData"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <!-- <button
            @click="exportToJSON"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>JSON</span>
            </span>
          </button> -->
          <button
            @click="exportToCSV"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>Summary</span>
            </span>
          </button>
          <button
            @click="exportRawDataCSV"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            :disabled="loading"
            title="Export raw transaction data"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>Raw Data</span>
            </span>
          </button>
          <button
            @click="refreshData"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowPathIcon class="refresh-icon" :class="{ 'animate-spin': loading }" />
              <span>Refresh</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" v-if="summary">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Companies</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ summary.total_companies?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BuildingOfficeIcon class="stat-icon text-blue-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Unique Products</p>
            <p class="text-2xl font-bold text-green-600">
              {{ summary.unique_products?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <ShoppingBagIcon class="stat-icon text-green-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Transactions</p>
            <p class="text-2xl font-bold text-purple-600">
              {{ summary.total_transactions?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <ChartBarIcon class="stat-icon text-purple-600" />
          </div>
        </div>
      </div>
    
    </div>

    <!-- Purchase Items List -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden" v-if="purchaseItems && purchaseItems.length > 0">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800">Sample Purchase Items (Up to 100)</h3>
      </div>

      <!-- Items Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Product
              </th>
             
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Suppliers
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trans. Count
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Quantity
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in purchaseItems" :key="item.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ item.company_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.unique_products || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {{ item.unique_suppliers || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ item.transaction_count || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ item.total_quantity || 0 }}
              </td>
             
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="w-6 h-6 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
          <button @click="fetchData" class="mt-2 text-sm text-red-600 hover:text-red-800">
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { ArrowDownTrayIcon, ArrowPathIcon, BuildingOfficeIcon, ShoppingBagIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const adminStore = useAdminStore()

// Reactive data
const loading = ref(false)
const error = ref(null)

// Analytics data
const summary = ref(null)
const purchaseItems = ref([])

// Filters
const filters = ref({
  start_date: '',
  end_date: ''
})

// Fetch summary data from the cross-tenant summary API
const fetchSummary = async () => {
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
const fetchPurchaseItems = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/reports/cross-tenant/purchase-items/dataview')
    if (response.success) {
      purchaseItems.value = response.data || []
    } else {
      purchaseItems.value = []
    }
  } catch (err) {
    console.error('Error fetching purchase items:', err)
    throw err
  }
}

// Fetch all data
const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    await Promise.all([
      fetchSummary(),
      fetchPurchaseItems()
    ])
  } catch (err) {
    error.value = err.message || 'Failed to fetch purchase items data'
    console.error('Error fetching purchase items data:', err)
  } finally {
    loading.value = false
  }
}

// Refresh data
const refreshData = () => {
  fetchData()
}

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Export functions
const exportToJSON = async () => {
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
      link.download = `cross-tenant-purchase-summary_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Export failed. Please try again.')
  }
}

const exportToCSV = async () => {
  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase 
    
    const params = new URLSearchParams()
    params.append('format', 'csv')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/purchase-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
      },
    })

    if (response.ok) {
      const csvContent = await response.text()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-purchase-items_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Export failed. Please try again.')
  }
}

const exportRawDataCSV = async () => {
  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase 
    
    const params = new URLSearchParams()
    params.append('format', 'csv')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    
    loading.value = true
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-purchase-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
      },
    })

    if (response.ok) {
      const csvContent = await response.text()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `raw-purchase-items_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Raw data export error:', error)
    alert('Raw data export failed. Please try again.')
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.purchase-items-analytics {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.export-icon {
  width: 18px;
  height: 18px;
}

.refresh-icon {
  width: 18px;
  height: 18px;
}

.stat-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
