<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Users</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comprehensive user insights across all companies</p>
    </div>

    <!-- Toolbar -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 text-sm text-gray-500 flex-1">
          <InformationCircleIcon class="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <span>All user data across companies — no additional filters available</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="exportToJSON"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            :disabled="loading"
          >
            <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
            JSON
          </button>
          <button
            @click="exportToCSV"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            :disabled="loading"
          >
            <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
            CSV
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
    <div class="grid grid-cols-2 gap-4 mb-6" v-if="summaryData && summaryData.length > 0">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500">Total Users</p>
            <p class="text-2xl font-semibold text-gray-900 mt-1">{{ totalUsers.toLocaleString() }}</p>
          </div>
          <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserIcon class="w-5 h-5 text-indigo-600" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500">Active Users</p>
            <p class="text-2xl font-semibold text-gray-900 mt-1">{{ totalActiveUsers.toLocaleString() }}</p>
          </div>
          <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon class="w-5 h-5 text-emerald-600" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- Company Breakdown Table -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6" v-if="summaryData && summaryData.length > 0">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-sm font-semibold text-gray-900">Company Breakdown</h3>
        <button
          @click="showUsersModal = true"
          class="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <UserIcon class="w-4 h-4" aria-hidden="true" />
          View Sample Records
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Active</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Inactive</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="company in summaryData" :key="company.company_id ?? ''" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-semibold text-indigo-700">{{ getCompanyInitials(company.company_name) }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ company.company_name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ company.total_users?.toLocaleString() || 0 }}</td>
              <td class="px-4 py-3 text-sm text-emerald-600 font-medium">{{ company.active_users?.toLocaleString() || 0 }}</td>
              <td class="px-4 py-3 text-sm text-red-500">{{ company.inactive_users?.toLocaleString() || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sample Users Records Modal -->
    <div v-if="showUsersModal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-50 flex items-start justify-center pt-16" @click="showUsersModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 p-6 mb-8" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Sample User Records</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ users.length }} of {{ totalUsers }} total (up to 100 records)</p>
          </div>
          <button @click="showUsersModal = false" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close modal">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div v-if="!loading && users.length === 0" class="text-center py-12">
          <UserIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" aria-hidden="true" />
          <p class="text-sm text-gray-500">No users found</p>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>

        <div v-if="!loading && users.length > 0" class="overflow-x-auto max-h-96 rounded-xl border border-gray-100">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Username</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="user in users" :key="user.id ?? ''" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ `${user.sname} ${user.lname}` }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ user.username || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ user.email || 'N/A' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                    {{ user.role || 'N/A' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-gray-700">{{ user.company_name || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end mt-5 pt-4 border-t border-gray-100">
          <button @click="showUsersModal = false" class="h-9 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
            Close
          </button>
        </div>
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
import { ref, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  UserIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'
import { createReportsExportService } from '~/services/analytics/reportsExportService'

interface CompanySummary {
  company_id?: number | string;
  company_name?: string;
  total_users?: number;
  active_users?: number;
  [key: string]: unknown;
}

interface User {
  id?: number | string;
  name?: string;
  email?: string;
  company_id?: number | string;
  company_name?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  last_login?: string;
  [key: string]: unknown;
}

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  makeAuthRequest: (url: string) => Promise<{ success?: boolean; data?: unknown; message?: string }>;
}

interface ReportsServiceShape {
  exportUsersCsv: () => Promise<Blob>;
}

const adminStore = useAdminStore() as unknown as AdminStoreShape
const reportsService = createReportsExportService(useApi()) as unknown as ReportsServiceShape

// Reactive data
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const showUsersModal = ref<boolean>(false)

// Analytics data
const summaryData = ref<CompanySummary[]>([])
const users = ref<User[]>([])

// Computed properties for summary totals
const totalUsers = computed<number>(() => {
  if (!summaryData.value || summaryData.value.length === 0) return 0
  return summaryData.value.reduce((sum, company) => sum + (company.total_users ?? 0), 0)
})

const totalActiveUsers = computed<number>(() => {
  if (!summaryData.value || summaryData.value.length === 0) return 0
  return summaryData.value.reduce((sum, company) => sum + (company.active_users ?? 0), 0)
})

// Fetch summary data from the cross-tenant summary API
const fetchSummary = async (): Promise<void> => {
  try {
    const response = await adminStore.makeAuthRequest('/api/users/cross-tenant/summary')
    if (response.success) {
      summaryData.value = (response.data ?? []) as CompanySummary[]
    } else {
      summaryData.value = []
    }
  } catch (err) {
    console.error('Error fetching summary:', err)
    summaryData.value = []
  }
}

// Fetch users list
const fetchUsers = async (): Promise<void> => {
  try {
    const response = await adminStore.makeAuthRequest('/api/users/cross-tenant/dataview')
    if (response.success) {
      users.value = (response.data ?? []) as User[]
    } else {
      users.value = []
    }
  } catch (err) {
    console.error('Error fetching users:', err)
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
      fetchUsers()
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch user data'
    console.error('Error fetching user data:', err)
  } finally {
    loading.value = false
  }
}

// Refresh data
const refreshData = (): void => {
  void fetchData()
}

// Helper functions
const getCompanyInitials = (name: string | undefined): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

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
    const response = await adminStore.makeAuthRequest('/api/users/cross-tenant/export?format=json')
    if (response.success && response.data) {
      const jsonString = JSON.stringify(response.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-users_${new Date().toISOString().split('T')[0] ?? ''}.json`
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
  try {
    const blob = await reportsService.exportUsersCsv()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cross-tenant-users_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed. Please try again.')
  }
}

// Initialize
onMounted(() => {
  void fetchData()
})
</script>

