<template>
  <div class="dataconsumer-sales-reports">
    <!-- Page Header -->
    <div class="page-header">
      <h1>Sales Reports</h1>
      <p class="subtitle">View and export quarterly sales analytics</p>
    </div>

    <!-- Quarterly Filters -->
    <div class="filters-section bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-end gap-3">
      <!-- Year & Date Field on one row -->
      <div class="filters-inputs flex gap-3 flex-1">
        <div class="flex-1 min-w-0">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase">Year</label>
          <select
            v-model="quarterlyFilters.year"
            @change="fetchQuarterlyData"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        <div class="flex-1 min-w-0">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase">Date Field</label>
          <select
            v-model="quarterlyFilters.date_field"
            @change="fetchQuarterlyData"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="actual_date">Actual Date</option>
            <option value="ddate">Transaction Date</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button
          @click="fetchQuarterlyData(true)"
          :disabled="quarterlyLoading"
          class="action-btn bg-blue-600 hover:bg-blue-700"
        >
          <span v-if="quarterlyLoading">Loading...</span>
          <span v-else>Refresh</span>
        </button>
        <button
          @click="sendViaWhatsApp"
          :disabled="!canSendWhatsApp"
          class="action-btn bg-green-600 hover:bg-green-700 inline-flex items-center gap-2"
          title="Send quarterly report request via WhatsApp"
        >
          <ChatBubbleLeftIcon class="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
        <button
          @click="exportQuarterlyToCSV"
          :disabled="!quarterlyData || quarterlyLoading"
          class="action-btn bg-purple-600 hover:bg-purple-700 inline-flex items-center gap-2"
        >
          <DocumentArrowDownIcon class="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="quarterlyError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
      {{ quarterlyError }}
    </div>

    <!-- Loading State -->
    <div v-if="quarterlyLoading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600 font-medium">Loading quarterly data...</p>
    </div>

    <!-- Quarter Selection Cards -->
    <div v-else-if="quarterlyData && !quarterlyLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <label
        v-for="(quarter, index) in [1, 2, 3, 4]"
        :key="index"
        class="bg-white rounded-lg shadow-md p-3 border-l-4 cursor-pointer hover:shadow-lg transition-shadow"
        :class="getQuarterColor(quarter)"
      >
        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="selectedQuarters[`q${quarter}`]"
            @change="selectedQuarters[`q${quarter}`] = !selectedQuarters[`q${quarter}`]"
            class="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800">{{ getQuarterName(quarter) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ getQuarterDates(quarter) }}</p>
            <div v-if="quarterlyData[`q${quarter}`]" class="mt-2 text-xs text-gray-700">
              <p><strong>{{ quarterlyData[`q${quarter}`].transactions || 0 }}</strong> txns</p>
            </div>
          </div>
        </div>
      </label>
    </div>

    <!-- Pharmacy Breakdown Table -->
    <div v-if="quarterlyData && !quarterlyLoading && quarterlyPharmacies.length > 0" class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800">Pharmacy Sales Breakdown</h3>
        <p class="text-sm text-gray-600 mt-1">{{ quarterlyPharmacies.length }} pharmacies</p>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">
                <input
                  type="checkbox"
                  :checked="allPharmaciesSelected"
                  @change="toggleAllPharmacies"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th class="hidden md:table-cell px-6 py-3 text-left font-semibold text-gray-700">#</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">ID</th>
              <th v-if="selectedQuarters.q1" class="px-6 py-3 text-right font-semibold text-gray-700">Q1</th>
              <th v-if="selectedQuarters.q1" class="hidden lg:table-cell px-6 py-3 text-left font-semibold text-gray-700">Q1 DATES</th>
              <th v-if="selectedQuarters.q2" class="px-6 py-3 text-right font-semibold text-gray-700">Q2</th>
              <th v-if="selectedQuarters.q2" class="hidden lg:table-cell px-6 py-3 text-left font-semibold text-gray-700">Q2 DATES</th>
              <th v-if="selectedQuarters.q3" class="px-6 py-3 text-right font-semibold text-gray-700">Q3</th>
              <th v-if="selectedQuarters.q3" class="hidden lg:table-cell px-6 py-3 text-left font-semibold text-gray-700">Q3 DATES</th>
              <th v-if="selectedQuarters.q4" class="px-6 py-3 text-right font-semibold text-gray-700">Q4</th>
              <th v-if="selectedQuarters.q4" class="hidden lg:table-cell px-6 py-3 text-left font-semibold text-gray-700">Q4 DATES</th>
              <th class="px-6 py-3 text-right font-semibold text-gray-700">TOTAL</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(pharmacy, index) in quarterlyPharmacies" :key="pharmacy.company_id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  :checked="selectedPharmacies[pharmacy.company_id]"
                  @change="togglePharmacy(pharmacy.company_id)"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td class="hidden md:table-cell px-6 py-4 font-medium text-gray-600">{{ index + 1 }}</td>
              <td class="px-6 py-4 text-gray-600 text-sm">{{ pharmacy.alternate_company_id || 'N/A' }}</td>
              <td v-if="selectedQuarters.q1" class="px-6 py-4 text-right font-medium text-gray-900">{{ pharmacy.q1_transactions || 0 }}</td>
              <td v-if="selectedQuarters.q1" class="hidden lg:table-cell px-6 py-4 text-gray-600 text-xs">{{ pharmacy.q1_date_range || '-' }}</td>
              <td v-if="selectedQuarters.q2" class="px-6 py-4 text-right font-medium text-gray-900">{{ pharmacy.q2_transactions || 0 }}</td>
              <td v-if="selectedQuarters.q2" class="hidden lg:table-cell px-6 py-4 text-gray-600 text-xs">{{ pharmacy.q2_date_range || '-' }}</td>
              <td v-if="selectedQuarters.q3" class="px-6 py-4 text-right font-medium text-gray-900">{{ pharmacy.q3_transactions || 0 }}</td>
              <td v-if="selectedQuarters.q3" class="hidden lg:table-cell px-6 py-4 text-gray-600 text-xs">{{ pharmacy.q3_date_range || '-' }}</td>
              <td v-if="selectedQuarters.q4" class="px-6 py-4 text-right font-medium text-gray-900">{{ pharmacy.q4_transactions || 0 }}</td>
              <td v-if="selectedQuarters.q4" class="hidden lg:table-cell px-6 py-4 text-gray-600 text-xs">{{ pharmacy.q4_date_range || '-' }}</td>
              <td class="px-6 py-4 text-right font-bold text-gray-900 text-sm">
                {{ getPharmacyTotal(pharmacy) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!quarterlyLoading && (!quarterlyData || quarterlyPharmacies.length === 0)" class="text-center py-12 bg-white rounded-lg shadow-md">
      <ChartBarIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-600 font-medium">Click "Refresh" to load quarterly sales reports</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChatBubbleLeftIcon, DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
import { createReportsExportService } from '~/services/analytics/reportsExportService'

definePageMeta({
  layout: 'dataconsumer',
  middleware: 'data-consumer-auth',
})

interface PharmacyQuarterRow {
  company_id: number | string
  alternate_company_id?: string | null
  q1_transactions?: number | null
  q2_transactions?: number | null
  q3_transactions?: number | null
  q4_transactions?: number | null
  q1_date_range?: string | null
  q2_date_range?: string | null
  q3_date_range?: string | null
  q4_date_range?: string | null
  [key: string]: unknown
}

interface QuarterSlot {
  transactions?: number | null
  [key: string]: unknown
}

interface QuarterlySummaryRaw {
  success?: boolean
  message?: string
  summary?: {
    q1?: QuarterSlot | null
    q2?: QuarterSlot | null
    q3?: QuarterSlot | null
    q4?: QuarterSlot | null
    [key: string]: QuarterSlot | null | undefined
  } | null
  pharmacies?: PharmacyQuarterRow[] | null
}

const reportsExportService = createReportsExportService(useApi())

const quarterlyLoading = ref<boolean>(false)
const quarterlyError = ref<string>('')
const quarterlyData = ref<QuarterlySummaryRaw['summary'] | null>(null)
const quarterlyPharmacies = ref<PharmacyQuarterRow[]>([])

const quarterlyFilters = ref<{ year: string; date_field: string }>({
  year: String(new Date().getFullYear()),
  date_field: 'actual_date',
})

const selectedQuarters = ref<{ q1: boolean; q2: boolean; q3: boolean; q4: boolean }>({
  q1: true,
  q2: true,
  q3: true,
  q4: true,
})

const selectedPharmacies = ref<Record<string | number, boolean>>({})

const allPharmaciesSelected = computed<boolean>(() => {
  return quarterlyPharmacies.value.length > 0 &&
    quarterlyPharmacies.value.every((p) => selectedPharmacies.value[p.company_id] === true)
})

const canSendWhatsApp = computed<boolean>(() => {
  const hasSelectedQuarters = Object.values(selectedQuarters.value).some((v) => v)
  const hasSelectedPharmacies = Object.values(selectedPharmacies.value).some((v) => v)
  return quarterlyData.value !== null && quarterlyPharmacies.value.length > 0 && hasSelectedQuarters && hasSelectedPharmacies
})

const quarterNames: Record<number, string> = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' }
const quarterColors: Record<number, string> = {
  1: 'border-blue-500',
  2: 'border-green-500',
  3: 'border-orange-500',
  4: 'border-red-500',
}

const getQuarterName = (index: number): string => quarterNames[index] ?? `Q${index}`

const getQuarterDates = (index: number): string => {
  const ranges: Record<number, string> = {
    1: 'Jan 1 - Mar 31',
    2: 'Apr 1 - Jun 30',
    3: 'Jul 1 - Sep 30',
    4: 'Oct 1 - Dec 31',
  }
  return ranges[index] ?? ''
}

const getQuarterColor = (index: number): string => quarterColors[index] ?? 'border-slate-300'

const getPharmacyTotal = (pharmacy: PharmacyQuarterRow): number => {
  let total = 0
  if (selectedQuarters.value.q1) total += pharmacy.q1_transactions ?? 0
  if (selectedQuarters.value.q2) total += pharmacy.q2_transactions ?? 0
  if (selectedQuarters.value.q3) total += pharmacy.q3_transactions ?? 0
  if (selectedQuarters.value.q4) total += pharmacy.q4_transactions ?? 0
  return total
}

const togglePharmacy = (pharmacyId: string | number): void => {
  selectedPharmacies.value[pharmacyId] = !(selectedPharmacies.value[pharmacyId] === true)
}

const toggleAllPharmacies = (): void => {
  if (allPharmaciesSelected.value) {
    selectedPharmacies.value = {}
  } else {
    quarterlyPharmacies.value.forEach((p) => {
      selectedPharmacies.value[p.company_id] = true
    })
  }
}

const fetchQuarterlyData = async (forceRefresh: boolean | Event = false): Promise<void> => {
  quarterlyLoading.value = true
  quarterlyError.value = ''
  quarterlyData.value = null
  quarterlyPharmacies.value = []

  try {
    const raw = await reportsExportService.getQuarterlySummary({
      year: quarterlyFilters.value.year,
      dateField: quarterlyFilters.value.date_field,
      forceRefresh: forceRefresh === true,
    })
    const data = raw as unknown as QuarterlySummaryRaw

    if (data.success) {
      quarterlyData.value = data.summary ?? null
      quarterlyPharmacies.value = data.pharmacies ?? []
    } else {
      throw new Error(data.message ?? 'Failed to fetch quarterly data')
    }
  } catch (err) {
    console.error('Error fetching quarterly data:', err)
    quarterlyError.value = err instanceof Error ? err.message : 'Failed to fetch quarterly data'
  } finally {
    quarterlyLoading.value = false
  }
}

const getSelectedQuartersText = (): string => {
  const quarters: string[] = []
  if (selectedQuarters.value.q1) quarters.push('Q1')
  if (selectedQuarters.value.q2) quarters.push('Q2')
  if (selectedQuarters.value.q3) quarters.push('Q3')
  if (selectedQuarters.value.q4) quarters.push('Q4')
  return quarters.length > 0 ? quarters.join(', ') : 'None selected'
}

const getSelectedPharmaciesText = (): string => {
  const pharmacies = quarterlyPharmacies.value.filter((p) => selectedPharmacies.value[p.company_id] === true)
  if (pharmacies.length === 0) return 'No pharmacies selected'
  return pharmacies.map((p) => String(p.alternate_company_id ?? p.company_id)).join(', ')
}

const sendViaWhatsApp = (): void => {
  if (!canSendWhatsApp.value) return

  const year = quarterlyFilters.value.year
  const quarters = getSelectedQuartersText()
  const pharmacies = getSelectedPharmaciesText()

  const message = `${year} Sales Quarterly Report Request\n\nQuarters: ${quarters}\n\nPharmacies:\n${pharmacies}`
  const encodedMessage = encodeURIComponent(message)

  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
}

const exportQuarterlyToCSV = (): void => {
  const selectedPharmacyList = quarterlyPharmacies.value.filter((p) => selectedPharmacies.value[p.company_id] === true)
  if (selectedPharmacyList.length === 0) return

  let csv = 'Alternate ID'

  if (selectedQuarters.value.q1) csv += ',Q1,Q1 Dates'
  if (selectedQuarters.value.q2) csv += ',Q2,Q2 Dates'
  if (selectedQuarters.value.q3) csv += ',Q3,Q3 Dates'
  if (selectedQuarters.value.q4) csv += ',Q4,Q4 Dates'

  csv += ',Total\n'

  selectedPharmacyList.forEach((pharmacy) => {
    csv += `"${pharmacy.alternate_company_id ?? 'N/A'}"`

    if (selectedQuarters.value.q1) csv += `,${pharmacy.q1_transactions ?? 0},"${pharmacy.q1_date_range ?? '-'}"`
    if (selectedQuarters.value.q2) csv += `,${pharmacy.q2_transactions ?? 0},"${pharmacy.q2_date_range ?? '-'}"`
    if (selectedQuarters.value.q3) csv += `,${pharmacy.q3_transactions ?? 0},"${pharmacy.q3_date_range ?? '-'}"`
    if (selectedQuarters.value.q4) csv += `,${pharmacy.q4_transactions ?? 0},"${pharmacy.q4_date_range ?? '-'}"`

    csv += `,${getPharmacyTotal(pharmacy)}\n`
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-quarterly-report-${quarterlyFilters.value.year}-${new Date().toISOString().split('T')[0]!}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

onMounted(() => { void fetchQuarterlyData() })
</script>

<style scoped>
.dataconsumer-sales-reports {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.min-w-xs {
  min-width: 200px;
}

/* Filter action buttons */
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  justify-content: center;
}

.action-btn:disabled {
  background-color: #d1d5db !important;
  cursor: not-allowed;
}

/* Loading spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .filters-inputs {
    flex-basis: 100% !important;
  }

  .filter-actions {
    flex-basis: 100%;
  }

  .action-btn {
    flex: 1;
  }

  .page-header h1 {
    font-size: 22px;
  }

  /* Table: tighter cells and smaller fonts on mobile */
  :deep(table) {
    font-size: 10px;
  }

  :deep(table th) {
    padding: 6px 4px;
    font-size: 8px;
  }

  :deep(table td) {
    padding: 5px 4px;
  }

  :deep(table th.px-6),
  :deep(table td.px-6) {
    padding-left: 4px;
    padding-right: 4px;
  }

  .overflow-x-auto {
    margin: 0 -16px;
    padding: 0 16px;
  }
}
</style>
