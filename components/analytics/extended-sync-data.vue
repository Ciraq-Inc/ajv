<template>
  <div :class="entity ? '' : 'p-6 bg-gray-50 min-h-screen'">
    <div v-if="!entity" class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Extended Sync Data</h1>
      <p class="text-sm text-gray-500 mt-0.5">Cross-pharmacy view of returns, credits, insurance, purchases, and expenses</p>
    </div>

    <!-- Entity sub-tabs (hidden when entity is controlled by parent) -->
    <div v-if="!entity" class="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
      <div class="border-b border-gray-100 overflow-x-auto">
        <nav class="flex min-w-max">
          <button
            v-for="e in ENTITIES"
            :key="e.key"
            @click="selectEntity(e.key)"
            :class="[
              'py-3 px-5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              activeEntity === e.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
            ]"
          >
            {{ e.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input v-model="startDate" type="date" class="h-9 px-3 text-sm appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input v-model="endDate" type="date" class="h-9 px-3 text-sm appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Company IDs</label>
          <input v-model="companyIds" type="text" placeholder="e.g. 1,2,3" class="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-40" />
        </div>
        <div class="flex items-center gap-2 ml-auto">
          <button
            @click="fetchData"
            :disabled="loading"
            class="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            {{ loading ? 'Loading…' : 'Load' }}
          </button>
          <button
            @click="exportCSV"
            :disabled="loading || !rows.length"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
      <span class="flex-shrink-0 w-4 h-4 text-red-400">
        <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
      </span>
      {{ error }}
    </div>

    <!-- Summary cards -->
    <div v-if="rows.length" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p class="text-xs font-medium text-gray-500">Pharmacies with data</p>
        <p class="text-2xl font-semibold text-gray-900 mt-1">{{ rows.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p class="text-xs font-medium text-gray-500">Total records</p>
        <p class="text-2xl font-semibold text-indigo-600 mt-1">{{ totalRecords.toLocaleString() }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p class="text-xs font-medium text-gray-500">Last synced</p>
        <p class="text-sm font-semibold text-gray-800 mt-1">{{ latestSync }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-sm font-semibold text-gray-900">
          {{ activeLabel }} — Company Breakdown
        </h3>
        <span class="text-sm text-gray-500">{{ rows.length }} companies</span>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="!rows.length && !error" class="text-center py-16 text-gray-500">
        <ArrowPathIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" aria-hidden="true" />
        <p class="text-sm font-medium text-gray-600 mb-1">No data loaded yet</p>
        <p class="text-xs text-gray-400">Select a date range and click Load to fetch records.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Alt ID</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Records</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Earliest</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Latest</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Last Synced</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(row, i) in rows" :key="row.company_id ?? i" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm text-gray-500">{{ i + 1 }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ row.company_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ row.company_id }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ row.alternate_company_id || '—' }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold text-indigo-700">{{ Number(row.record_count).toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ fmtDate(row.earliest_date) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ fmtDate(row.latest_date) }}</td>
              <td class="px-4 py-3 text-xs text-gray-500">{{ fmtDateTime(row.last_synced_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'

interface SyncRow {
  record_count?: number | string;
  last_synced_at?: string;
  company_name?: string;
  company_id?: number | string;
  alternate_company_id?: number | string;
  earliest_date?: string;
  latest_date?: string;
  [key: string]: unknown;
}

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  makeAuthRequest: (url: string) => Promise<{ success?: boolean; data?: unknown; message?: string }>;
}

const props = defineProps<{
  entity?: string | null;
}>()

const adminStore = useAdminStore() as unknown as AdminStoreShape

const ENTITIES: Array<{ key: string; label: string }> = [
  { key: 'customer_returns',        label: 'Customer Returns' },
  { key: 'outstanding_credits',     label: 'Outstanding Credits' },
  { key: 'settled_credit_headers',  label: 'Settled Credits' },
  { key: 'confirmed_purchases',     label: 'Confirmed Purchases' },
  { key: 'insurance_items',         label: 'Insurance Items' },
  { key: 'insurance_headers',       label: 'Insurance Headers' },
  { key: 'purchase_return_headers', label: 'Purchase Returns' },
  { key: 'expenses',                label: 'Expenses' },
]

const activeEntity = ref<string>(props.entity ?? 'customer_returns')
const activeLabel = computed<string>(() => ENTITIES.find(e => e.key === activeEntity.value)?.label ?? '')

watch(() => props.entity, (val) => {
  if (val && val !== activeEntity.value) {
    activeEntity.value = val
    rows.value = []
    error.value = ''
    void fetchData()
  }
})

const startDate = ref<string>('')
const endDate = ref<string>('')
const companyIds = ref<string>('')
const loading = ref<boolean>(false)
const error = ref<string>('')
const rows = ref<SyncRow[]>([])

const totalRecords = computed<number>(() => rows.value.reduce((s, r) => s + Number(r.record_count), 0))
const latestSync = computed<string>(() => {
  const dates = rows.value.map(r => r.last_synced_at).filter(Boolean).sort() as string[]
  const d = dates[dates.length - 1]
  return d ? fmtDateTime(d) : '—'
})

const fetchData = async (): Promise<void> => {
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
      rows.value = (res.data ?? []) as SyncRow[]
    } else {
      error.value = res.message ?? 'Failed to load data'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  } finally {
    loading.value = false
  }
}

const selectEntity = (key: string): void => {
  activeEntity.value = key
  rows.value = []
  error.value = ''
  void fetchData()
}

const fmtDate = (d: string | undefined): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}

const fmtDateTime = (d: string | undefined): string => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const exportCSV = (): void => {
  if (!rows.value.length) return
  const headers = ['#', 'Company', 'Company ID', 'Alt ID', 'Records', 'Earliest Date', 'Latest Date', 'Last Synced']
  const csvRows = rows.value.map((r, i) => [
    i + 1, r.company_name, r.company_id, r.alternate_company_id ?? '',
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
  endDate.value = today.toISOString().slice(0, 10) ?? ''
  startDate.value = ago.toISOString().slice(0, 10) ?? ''
  void fetchData()
})
</script>
