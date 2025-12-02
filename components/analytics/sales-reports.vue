<template>
  <div class="sales-items-analytics p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        Sales Items 
      </h1>
      <p class="text-gray-600">
         Sales transaction across all companies
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
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Company</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by company name..."
              @input="debouncedSearch"
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
          <!-- <button
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
            :disabled="loading || exportingRaw"
            title="Export ALL raw transaction data (no limit)"
          >
            <span class="flex items-center gap-2">
              <ArrowPathIcon v-if="exportingRaw" class="export-icon animate-spin" />
              <ArrowDownTrayIcon v-else class="export-icon" />
              <span>{{ exportingRaw ? 'Exporting...' : 'Full Export' }}</span>
            </span>
          </button> -->
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
              {{ summary?.total_companies || 0 }}
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
            <p class="text-sm font-medium text-gray-600">Total Companies Without Data</p>
            <p class="text-2xl font-bold text-gray-900">
              {{(summaryByCompany.length - summary?.total_companies) || 0 }}
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
              {{ summary?.unique_products || 0 }}
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
              {{ summary?.total_transactions?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <ChartBarIcon class="stat-icon text-purple-600" />
          </div>
        </div>
      </div>
   
    </div>

    <!-- Company Breakdown Table -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6" v-if="summaryByCompany && summaryByCompany.length > 0">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Company Breakdown</h3>
          <span class="text-sm text-gray-600">Total: <span class="font-bold">{{ summaryByCompany.length }}</span> companies</span>
        </div>
        <!-- <button
          @click="showSalesItemsModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span class="flex items-center gap-2">
            <span>📋</span>
            <span>View Sample Items</span>
          </span>
        </button> -->
      </div>

      <!-- Company Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Products
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Customers
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transactions
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Quantity
              </th>
              <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th> -->
              <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th> -->
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(company, index) in summaryByCompany" :key="company.company_id" class="hover:bg-gray-50 cursor-pointer" @click="viewCompanyDetails(company)">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <!-- <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-700">
                        {{ getCompanyInitials(company.company_name) }}
                      </span>
                    </div>
                  </div> -->
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ company.company_name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.unique_products || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.unique_customers || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.transaction_count || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.total_quantity || 0 }}
              </td>
              <!-- <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click.stop="exportCompanyData(company)"
                  class="text-blue-600 hover:text-blue-800 font-semibold"
                  title="Export company data"
                >
                  Export
                </button>
              </td> -->
              <!-- <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                ${{ parseFloat(company.total_value || 0).toFixed(2) }}
              </td>
               -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sample Sales Items Modal -->
    <div v-if="showSalesItemsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="showSalesItemsModal = false">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Sample Sales Items Records</h3>
          <button @click="showSalesItemsModal = false" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="mb-4">
          <p class="text-sm text-gray-600">{{ salesItems.length }} of {{ salesItems.length }} total items (showing up to 100 records)</p>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && salesItems.length === 0" class="text-center py-12">
          <span class="text-4xl">📋</span>
          <p class="mt-2 text-gray-600">No sales items found</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Sales Items Table in Modal -->
        <div v-if="!loading && salesItems.length > 0" class="overflow-x-auto max-h-96">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Products
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Customers
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Price
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in salesItems" :key="item.company_id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ item.company_name }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ item.unique_products || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {{ item.unique_customers || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {{ item.transaction_count || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {{ item.total_quantity || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-semibold">
                  ${{ parseFloat(item.total_value || 0).toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ item.avg_selling_price ? parseFloat(item.avg_selling_price).toFixed(2) : '0.00' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button @click="showSalesItemsModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Company Details Modal -->
    <div v-if="showCompanyModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="showCompanyModal = false">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">Company Sales Details</h3>
            <p class="text-sm text-gray-600 mt-1">{{ selectedCompanyDetails?.company_name }}</p>
          </div>
          <button @click="showCompanyModal = false" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <div v-if="selectedCompanyDetails" class="space-y-4">
          <!-- Summary Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Unique Products</p>
              <p class="text-2xl font-bold text-blue-600">{{ selectedCompanyDetails.unique_products || 0 }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Unique Customers</p>
              <p class="text-2xl font-bold text-green-600">{{ selectedCompanyDetails.unique_customers || 0 }}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Total Transactions</p>
              <p class="text-2xl font-bold text-purple-600">{{ selectedCompanyDetails.transaction_count || 0 }}</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Total Quantity</p>
              <p class="text-2xl font-bold text-orange-600">{{ selectedCompanyDetails.total_quantity || 0 }}</p>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loadingCompanyDetails" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>

          <!-- Detailed Sales Items -->
          <div v-if="!loadingCompanyDetails && companyDetailedData.length > 0" class="mt-6">
            <h4 class="text-md font-semibold text-gray-800 mb-3">Recent Sales Transactions</h4>
            <div class="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(item, idx) in companyDetailedData" :key="idx" class="hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ formatDate(item.actual_date) }}</td>
                    <td class="px-3 py-2 text-xs text-gray-900">
                      <div class="font-medium">{{ item.product_description }}</div>
                      <div class="text-gray-500">{{ item.strength }} {{ item.unit }}</div>
                    </td>
                    <td class="px-3 py-2 text-xs text-gray-700">{{ item.customer_name || 'N/A' }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ item.product_qty }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ parseFloat(item.selling_price || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-green-600 font-semibold">{{ parseFloat(item.line_total || 0).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-gray-500 mt-2">Showing {{ companyDetailedData.length }} recent transactions</p>
          </div>

          <div v-if="!loadingCompanyDetails && companyDetailedData.length === 0" class="text-center py-8 text-gray-500">
            No detailed transaction data available
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button @click="showCompanyModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Close
          </button>
          <button @click="exportCompanyData(selectedCompanyDetails)" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Export Data
          </button>
        </div>
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
const showSalesItemsModal = ref(false)
const searchQuery = ref('')
const showCompanyModal = ref(false)
const selectedCompanyDetails = ref(null)
const companyDetailedData = ref([])
const loadingCompanyDetails = ref(false)
const exportingRaw = ref(false)

// Analytics data
const summary = ref(null)
const summaryByCompany = ref([])
const salesItems = ref([])

// Filters
const filters = ref({
  start_date: '',
  end_date: ''
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchCompanyBreakdown()
  }, 500)
}

// Fetch summary data from the cross-tenant summary API
const fetchSummary = async () => {
  try {
    const params = new URLSearchParams()
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    
    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/sales-items?${params}`)
    if (response.success) {
      // Normalize the response data
      summary.value = {
        total_companies: response.total_companies || 0,
        unique_products: response.unique_products || 0,
        unique_customers: response.unique_customers || 0,
        total_transactions: response.total_transactions || 0,
        total_quantity: parseFloat(response.total_quantity) || 0,
        total_value: parseFloat(response.total_value) || 0,
        total_profit: parseFloat(response.total_profit) || 0,
        avg_selling_price: parseFloat(response.avg_selling_price) || 0
      }
    } else {
      summary.value = null
    }
  } catch (err) {
    console.error('Error fetching summary:', err)
    summary.value = null
  }
}

// Fetch company breakdown (using sales-items summary by company)
const fetchCompanyBreakdown = async () => {
  try {
    const params = new URLSearchParams()
    params.append('limit', '5000') // Increased limit
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (searchQuery.value && searchQuery.value.trim()) params.append('search', searchQuery.value.trim())
    
    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/sales-items/dataview?${params}`)
    if (response.success && response.data && Array.isArray(response.data)) {
      // API already returns company-level aggregates, just normalize null values
      summaryByCompany.value = response.data.map(item => ({
        company_id: item.company_id || 0,
        company_name: item.company_name || 'Unknown',
        unique_products: item.unique_products || 0,
        unique_customers: item.unique_customers || 0,
        transaction_count: item.transaction_count || 0,
        total_quantity: parseFloat(item.total_quantity) || 0,
        total_value: parseFloat(item.total_value) || 0,
        total_profit: parseFloat(item.total_profit) || 0,
        avg_selling_price: parseFloat(item.avg_selling_price) || 0
      }))
    } else {
      summaryByCompany.value = []
    }
  } catch (err) {
    console.error('Error fetching company breakdown:', err)
    summaryByCompany.value = []
  }
}

// Fetch sample sales items
const fetchSalesItems = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/reports/cross-tenant/sales-items/dataview')
    if (response.success) {
      salesItems.value = response.data || []
    } else {
      salesItems.value = []
    }
  } catch (err) {
    console.error('Error fetching sales items:', err)
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
      fetchCompanyBreakdown(),
      fetchSalesItems()
    ])
  } catch (err) {
    error.value = err.message || 'Failed to fetch sales items data'
    console.error('Error fetching sales items data:', err)
  } finally {
    loading.value = false
  }
}

// Refresh data
const refreshData = () => {
  fetchData()
}

// View company details
const viewCompanyDetails = async (company) => {
  selectedCompanyDetails.value = company
  showCompanyModal.value = true
  loadingCompanyDetails.value = true
  companyDetailedData.value = []

  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase
    
    const params = new URLSearchParams()
    params.append('company_ids', company.company_id)
    params.append('limit', '100') // Get recent 100 transactions
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-sales-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
        'Content-Type': 'application/json'
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        companyDetailedData.value = data.data
      }
    }
  } catch (err) {
    console.error('Error fetching company details:', err)
  } finally {
    loadingCompanyDetails.value = false
  }
}

// Export specific company data
const exportCompanyData = async (company) => {
  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase
    
    const params = new URLSearchParams()
    params.append('format', 'csv')
    params.append('company_ids', company.company_id)
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    
    loading.value = true
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-sales-items/export?${params}`, {
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
      const companyName = company.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      link.download = `sales-${companyName}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Company export error:', error)
    alert('Export failed. Please try again.')
  } finally {
    loading.value = false
  }
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
    const params = new URLSearchParams()
    params.append('format', 'json')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    
    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/sales-items/export?${params}`)
    if (response.success && response.data) {
      const jsonString = JSON.stringify(response.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-sales-summary_${new Date().toISOString().split('T')[0]}.json`
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
    
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/sales-items/export?${params}`, {
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
      link.download = `cross-tenant-sales-items_${new Date().toISOString().split('T')[0]}.csv`
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
    // No limit parameter - will export ALL records
    
    exportingRaw.value = true
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-sales-items/export?${params}`, {
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
      link.download = `raw-sales-items-full_${new Date().toISOString().split('T')[0]}.csv`
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
    exportingRaw.value = false
  }
}

// Initialize
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.sales-items-analytics {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.export-icon,
.refresh-icon {
  width: 18px;
  height: 18px;
}

.stat-icon {
  width: 24px;
  height: 24px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
