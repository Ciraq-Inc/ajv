<template>
  <div class="insurance-payers-analytics p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        Insurance Payers Analytics
      </h1>
      <p class="text-gray-600">
        Comprehensive insurance payer insights across all companies
      </p>
    </div>

    <!-- Filters and Controls -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <div class="relative flex-1">
            <button
              @click="refreshData"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left text-gray-600"
              disabled
            >
              ℹ️ All insurance payer data across companies (no filters available)
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            @click="exportToJSON"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <span>📥</span>
              <span>JSON</span>
            </span>
          </button>
          <button
            @click="exportToCSV"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <span>📥</span>
              <span>CSV</span>
            </span>
          </button>
          <button
            @click="refreshData"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <span>🔄</span>
              <span>Refresh</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" v-if="summaryData && summaryData.length > 0">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Payers</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ totalPayers.toLocaleString() }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🏥</span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Clients</p>
            <p class="text-2xl font-bold text-green-600">
              {{ totalClients.toLocaleString() }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">👥</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Company Breakdown Table -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6" v-if="summaryData && summaryData.length > 0">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800">Company Breakdown</h3>
        <button
          @click="showPayersModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span class="flex items-center gap-2">
            <span>🏥</span>
            <span>View Sample Records</span>
          </span>
        </button>
      </div>

      <!-- Company Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Payers
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Clients
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Settled
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unsettled
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="company in summaryData" :key="company.company_id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-700">
                        {{ getCompanyInitials(company.company_name) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ company.company_name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.total_payers?.toLocaleString() || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.total_clients?.toLocaleString() || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                ${{ company.total_settled?.toLocaleString() || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                ${{ company.total_unsettled?.toLocaleString() || 0 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sample Payers Records Modal -->
    <div v-if="showPayersModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="showPayersModal = false">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Sample Insurance Payer Records</h3>
          <button @click="showPayersModal = false" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="mb-4">
          <p class="text-sm text-gray-600">{{ payers.length }} of {{ totalPayers }} total payers (showing up to 100 records)</p>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && payers.length === 0" class="text-center py-12">
          <span class="text-4xl">🏥</span>
          <p class="mt-2 text-gray-600">No insurance payers found</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Payers Table in Modal -->
        <div v-if="!loading && payers.length > 0" class="overflow-x-auto max-h-96">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="payer in payers" :key="payer.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ payer.provider || 'N/A' }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ payer.masterPid || 'N/A' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                  {{ payer.company_name || 'N/A' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(payer.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button @click="showPayersModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-red-400">⚠️</span>
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
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

// Reactive data
const loading = ref(false)
const error = ref(null)
const showPayersModal = ref(false)

// Analytics data
const summaryData = ref([])
const payers = ref([])

// Computed properties for summary totals
const totalPayers = computed(() => {
  if (!summaryData.value || summaryData.value.length === 0) return 0
  return summaryData.value.reduce((sum, company) => sum + (company.total_payers || 0), 0)
})

const totalClients = computed(() => {
  if (!summaryData.value || summaryData.value.length === 0) return 0
  return summaryData.value.reduce((sum, company) => sum + (company.total_clients || 0), 0)
})

// Fetch summary data from the cross-tenant summary API
const fetchSummary = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/insurance-payers/cross-tenant/summary')
    if (response.success) {
      summaryData.value = response.data || []
    } else {
      summaryData.value = []
    }
  } catch (err) {
    console.error('Error fetching summary:', err)
    summaryData.value = []
  }
}

// Fetch payers list
const fetchPayers = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/insurance-payers/cross-tenant/dataview')
    if (response.success) {
      payers.value = response.data || []
    } else {
      payers.value = []
    }
  } catch (err) {
    console.error('Error fetching payers:', err)
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
      fetchPayers()
    ])
  } catch (err) {
    error.value = err.message || 'Failed to fetch insurance payer data'
    console.error('Error fetching insurance payer data:', err)
  } finally {
    loading.value = false
  }
}

// Refresh data
const refreshData = () => {
  fetchData()
}

// Helper functions
const getCompanyInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

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
    const response = await adminStore.makeAuthRequest('/api/insurance-payers/cross-tenant/export?format=json')
    if (response.success && response.data) {
      const jsonString = JSON.stringify(response.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-insurance-payers_${new Date().toISOString().split('T')[0]}.json`
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
    const baseURL = config.public.apiBase || 'http://localhost:3000'
    
    const response = await fetch(`${baseURL}/api/insurance-payers/cross-tenant/export?format=csv`, {
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
      link.download = `cross-tenant-insurance-payers_${new Date().toISOString().split('T')[0]}.csv`
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

// Initialize
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.insurance-payers-analytics {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
