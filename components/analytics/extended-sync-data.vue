<template>
  <div :class="entity ? '' : 'p-6 bg-gray-50 min-h-screen'">
    <div v-if="!entity" class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-1">Extended Sync Data</h1>
      <p class="text-gray-600">Cross-pharmacy view of returns, credits, insurance, purchases, and expenses</p>
    </div>

    <!-- Entity sub-tabs (hidden when entity is controlled by parent) -->
    <div v-if="!entity" class="bg-white rounded-lg shadow-md mb-6">
      <div class="border-b border-gray-200 overflow-x-auto">
        <nav class="flex min-w-max">
          <button
            v-for="e in ENTITIES"
            :key="e.key"
            @click="selectEntity(e.key)"
            :class="[
              'py-3 px-5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              activeEntity === e.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ e.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
        <input v-model="startDate" type="date" class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
        <input v-model="endDate" type="date" class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Company IDs</label>
        <input v-model="companyIds" type="text" placeholder="e.g. 1,2,3" class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
      </div>
      <button
        @click="fetchData"
        :disabled="loading"
        class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        {{ loading ? 'Loading…' : 'Load' }}
      </button>
      <button
        @click="exportCSV"
        :disabled="loading || !rows.length"
        class="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
      >
        <ArrowDownTrayIcon class="w-4 h-4" />
        Export CSV
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
      {{ error }}
    </div>

    <!-- Summary cards -->
    <div v-if="rows.length" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-xs text-gray-500">Pharmacies with data</p>
        <p class="text-2xl font-bold text-gray-900">{{ rows.length }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-xs text-gray-500">Total records</p>
        <p class="text-2xl font-bold text-blue-600">{{ totalRecords.toLocaleString() }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-xs text-gray-500">Last synced</p>
        <p class="text-sm font-semibold text-gray-800">{{ latestSync }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-base font-semibold text-gray-800">
          {{ activeLabel }} — Company Breakdown
        </h3>
        <span class="text-sm text-gray-500">{{ rows.length }} companies</span>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="!rows.length && !error" class="text-center py-16 text-gray-400">
        <p class="text-lg mb-1">No data</p>
        <p class="text-sm">Select a date range and click Load, or no records have been synced yet.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alt ID</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Records</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earliest</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latest</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Synced</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(row, i) in rows" :key="row.company_id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-400">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-medium text-gray-900">{{ row.company_name }}</td>
              <td class="px-4 py-3 text-gray-600">{{ row.company_id }}</td>
              <td class="px-4 py-3 text-gray-500">{{ row.alternate_company_id || '—' }}</td>
              <td class="px-4 py-3 text-right font-semibold text-blue-700">{{ Number(row.record_count).toLocaleString() }}</td>
              <td class="px-4 py-3 text-gray-600">{{ fmtDate(row.earliest_date) }}</td>
              <td class="px-4 py-3 text-gray-600">{{ fmtDate(row.latest_date) }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ fmtDateTime(row.last_synced_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'

const props = defineProps({
  entity: { type: String, default: null },
})

const adminStore = useAdminStore()

const ENTITIES = [
  { key: 'customer_returns',        label: 'Customer Returns' },
  { key: 'outstanding_credits',     label: 'Outstanding Credits' },
  { key: 'settled_credit_headers',  label: 'Settled Credits' },
  { key: 'confirmed_purchases',     label: 'Confirmed Purchases' },
  { key: 'insurance_items',         label: 'Insurance Items' },
  { key: 'insurance_headers',       label: 'Insurance Headers' },
  { key: 'purchase_return_headers', label: 'Purchase Returns' },
  { key: 'expenses',                label: 'Expenses' },
]

const activeEntity = ref(props.entity ?? 'customer_returns')
const activeLabel = computed(() => ENTITIES.find(e => e.key === activeEntity.value)?.label ?? '')

watch(() => props.entity, (val) => {
  if (val && val !== activeEntity.value) {
    activeEntity.value = val
    rows.value = []
    error.value = ''
    fetchData()
  }
})

const startDate = ref('')
const endDate = ref('')
const companyIds = ref('')
const loading = ref(false)
const error = ref('')
const rows = ref([])

const totalRecords = computed(() => rows.value.reduce((s, r) => s + Number(r.record_count), 0))
const latestSync = computed(() => {
  const dates = rows.value.map(r => r.last_synced_at).filter(Boolean).sort()
  const d = dates[dates.length - 1]
  return d ? fmtDateTime(d) : '—'
})

const fetchData = async () => {
  loading.value = true
  error.value = ''
  rows.value = []
  try {
    const params = new URLSearchParams()
    if (startDate.value) params.append('start_date', startDate.value)
    if (endDate.value) params.append('end_date', endDate.value)
    if (companyIds.value.trim()) params.append('company_ids', companyIds.value.trim())

    const res = await adminStore.makeAuthRequest(
      `/api/reports/cross-tenant/extended-sync/${activeEntity.value}?${params}`
    )
    if (res.success) {
      rows.value = res.data || []
    } else {
      error.value = res.message || 'Failed to load data'
    }
  } catch (err) {
    error.value = err.message || 'Request failed'
  } finally {
    loading.value = false
  }
}

const selectEntity = (key) => {
  activeEntity.value = key
  rows.value = []
  error.value = ''
  fetchData()
}

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}

const fmtDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const exportCSV = () => {
  if (!rows.value.length) return
  const headers = ['#', 'Company', 'Company ID', 'Alt ID', 'Records', 'Earliest Date', 'Latest Date', 'Last Synced']
  const csvRows = rows.value.map((r, i) => [
    i + 1, r.company_name, r.company_id, r.alternate_company_id || '',
    r.record_count, fmtDate(r.earliest_date), fmtDate(r.latest_date), fmtDateTime(r.last_synced_at)
  ])
  const csv = [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${activeEntity.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(() => {
  const today = new Date()
  const ago = new Date(today)
  ago.setDate(ago.getDate() - 90)
  endDate.value = today.toISOString().slice(0, 10)
  startDate.value = ago.toISOString().slice(0, 10)
  fetchData()
})
</script>
