<template>
  <div class="companies-management p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Store Settings</h1>
      <p class="text-gray-600">Manage storefront visibility settings for all companies</p>
    </div>

    <div class="bg-white rounded-lg p-6 mb-6 border border-gray-200">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="relative flex-1 max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search companies..."
            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <button
          @click="fetchCompanies"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm font-medium transition-colors duration-150"
          :disabled="loading"
        >
          <span class="flex items-center gap-2">
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            <span>Refresh</span>
          </span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg overflow-hidden border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">Companies</h2>
        <span class="text-sm text-gray-500">{{ filteredCompanies.length }} companies</span>
      </div>

      <div v-if="loading" class="p-6 text-center text-gray-500">Loading store settings...</div>
      <div v-else-if="error" class="p-6 text-center text-red-600">{{ error }}</div>
      <div v-else-if="!filteredCompanies.length" class="p-6 text-center text-gray-500">No companies found.</div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hide Prices</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="company in filteredCompanies" :key="company.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">{{ company.name }}</div>
              <div class="text-sm text-gray-500">ID: {{ company.id }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">{{ company.domain_name || '-' }}</td>
            <td class="px-6 py-4">
              <button
                type="button"
                role="switch"
                :aria-checked="company.hide_prices"
                @click="toggleHidePrices(company)"
                :disabled="savingMap[company.id]"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60',
                  company.hide_prices ? 'bg-indigo-600' : 'bg-gray-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    company.hide_prices ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </td>
            <td class="px-6 py-4 text-sm">
              <span v-if="savingMap[company.id]" class="text-gray-500">Saving...</span>
              <span v-else-if="company.saveError" class="text-red-600">{{ company.saveError }}</span>
              <span v-else class="text-green-600">Saved</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const companies = ref([])
const savingMap = ref({})

const filteredCompanies = computed(() => {
  if (!searchQuery.value) return companies.value

  const q = searchQuery.value.toLowerCase()
  return companies.value.filter((company) => {
    return (
      (company.name || '').toLowerCase().includes(q) ||
      (company.domain_name || '').toLowerCase().includes(q) ||
      String(company.id).includes(q)
    )
  })
})

const fetchCompanies = async () => {
  loading.value = true
  error.value = ''

  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase

    const response = await fetch(`${baseURL}/api/companies`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch companies')
    }

    companies.value = (data.data || []).map((company) => ({
      ...company,
      hide_prices: company.hide_prices === 1 || company.hide_prices === true,
      saveError: '',
    }))
  } catch (err) {
    error.value = err.message || 'Could not load companies'
  } finally {
    loading.value = false
  }
}

const toggleHidePrices = async (company) => {
  if (!adminStore.token) {
    company.saveError = 'Admin session missing. Please login again.'
    return
  }

  const previousValue = company.hide_prices
  const nextValue = !company.hide_prices

  company.hide_prices = nextValue
  company.saveError = ''
  savingMap.value = { ...savingMap.value, [company.id]: true }

  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase

    const response = await fetch(`${baseURL}/api/companies/${company.id}/store-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminStore.token}`,
      },
      body: JSON.stringify({ hide_prices: nextValue }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update store settings')
    }
  } catch (err) {
    company.hide_prices = previousValue
    company.saveError = err.message || 'Failed to save changes'
  } finally {
    savingMap.value = { ...savingMap.value, [company.id]: false }
  }
}

onMounted(() => {
  fetchCompanies()
})
</script>
