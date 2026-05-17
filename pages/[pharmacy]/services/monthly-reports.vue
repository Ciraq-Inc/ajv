<template>
  <div class="mx-auto max-w-[1240px] space-y-4">
    <section class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-[10.5px] font-semibold uppercase tracking-wider text-gray-500">Reporting Desk</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Monthly Reports</h1>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <div class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm">
          {{ companyNameLabel }}
        </div>
        <div class="rounded-lg px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider cs-sync-badge">
          {{ syncStateLabel }}
        </div>
      </div>
    </section>

    <section
      class="rounded-xl border px-4 py-3 shadow-sm"
      :class="showSyncFirstNotice ? 'border-amber-200 bg-amber-50 text-amber-900' : 'cs-status-ok'"
    >
      <div class="flex items-start gap-3">
        <div
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          :class="showSyncFirstNotice ? 'bg-amber-100 text-amber-800' : 'cs-status-dot-ok'"
        >
          {{ showSyncFirstNotice ? '!' : 'OK' }}
        </div>
        <div class="min-w-0">
          <p class="text-[13px] font-semibold">
            {{ statusMessage || bannerMessage }}
          </p>
          <p class="mt-0.5 text-[12.5px] opacity-80">
            {{ bannerSubMessage }}
          </p>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div class="space-y-4">
        <article class="overflow-hidden rounded-xl cs-pdf-card shadow-sm">
          <div class="grid gap-3 p-4 text-white lg:grid-cols-[minmax(0,1fr)_200px]">
            <div class="space-y-3">
              <div>
                <p class="text-[9.5px] font-semibold uppercase tracking-wider text-white/70">PDF Export</p>
                <h2 class="text-xl font-semibold tracking-tight">
                  Ready for export
                </h2>
                <p class="mt-1 max-w-sm text-[12px] text-white/80">
                  Transform monthly pharmacy activity into a polished PDF summary.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[12.5px] font-semibold cs-pdf-btn-text shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="primaryActionDisabled"
                  @click="handlePrimaryAction"
                >
                  <span>{{ primaryActionLabel }}</span>
                </button>

                <div class="flex gap-1.5 text-[11px] text-white/90">
                  <span class="rounded bg-white/10 px-2 py-0.5">{{ selectedReportSummary }}</span>
                  <span class="rounded bg-white/10 px-2 py-0.5">{{ selectedMonthCount }} {{ selectedMonthCount === 1 ? 'month' : 'months' }}</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col justify-center rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[11.5px] text-white/90">Sync</span>
                  <span class="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                    {{ syncPillLabel }}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[11.5px] text-white/90">Report</span>
                  <span class="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                    {{ reportPillLabel }}
                  </span>
                </div>
              </div>

              <div class="mt-3 rounded bg-black/10 px-2 py-1.5">
                <div class="h-1 rounded-full bg-white/20">
                  <div class="h-full rounded-full bg-white transition-all duration-300" :style="{ width: heroStatusWidth }"></div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-[#eceff3] md:p-5">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 class="text-lg font-semibold tracking-tight text-gray-900">Reporting Period</h2>
              <p class="mt-1 max-w-2xl text-[12.5px] leading-5 text-gray-500">{{ reportingPeriodHint }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-if="showSuggestedReset"
                class="rounded border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-600 transition cs-subtle-btn"
                @click="resetToSuggestedMonths"
              >
                Use suggested
              </button>
              <button
                v-if="selectedReportMonths.length > 1"
                class="rounded border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-600 transition cs-subtle-btn"
                @click="keepLatestMonthOnly"
              >
                Keep latest month
              </button>
            </div>
          </div>

          <div v-if="!availableReportMonths.length" class="mt-5 rounded-lg border border-dashed border-[#ddd3eb] bg-[#fbf9fe] px-4 py-4 text-[13px] leading-6 text-[#6d607c]">
            No reportable months are available yet. Complete a successful sync and the month cards will appear here automatically.
          </div>

          <div v-else class="mt-5 space-y-4">
            <section v-for="group in reportMonthGroups" :key="group.year" class="space-y-3">
              <div class="flex items-center justify-between gap-4 border-b border-gray-100 pb-2">
                <div>
                  <p class="text-[10.5px] font-semibold uppercase tracking-wider text-gray-500">FY {{ group.year }}</p>
                  <p class="text-[11px] text-gray-400">{{ group.rangeLabel }} - {{ group.months.length }} month{{ group.months.length === 1 ? '' : 's' }}</p>
                </div>
                <button
                  class="rounded border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-600 transition cs-subtle-btn"
                  @click="selectYearMonths(group.year)"
                >
                  Select all
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                <button
                  v-for="month in group.months"
                  :key="month.value"
                  type="button"
                  class="rounded-md border px-2.5 py-2 text-left transition"
                  :class="month.selected
                    ? 'cs-month-selected'
                    : 'border-gray-200 bg-gray-50 text-gray-800 cs-month-hover'"
                  @click="toggleReportMonth(month.value)"
                >
                  <div class="text-[0.95rem] font-semibold leading-none tracking-tight">{{ month.shortLabel }}</div>
                  <div class="mt-1 text-[8.5px] font-medium uppercase tracking-[0.16em]" :class="month.selected ? 'text-white/80' : 'text-gray-500'">
                    {{ month.selected ? 'Selected' : monthStateLabel(group.year) }}
                  </div>
                </button>
              </div>
            </section>
          </div>
        </article>
      </div>

      <div class="space-y-4">
        <article class="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <h3 class="text-[1.1rem] font-semibold tracking-tight text-gray-900">System Status</h3>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between gap-4">
              <span class="text-[12.5px] font-medium text-gray-600">Sync Status</span>
              <span class="rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider cs-status-badge">
                {{ syncPillLabel }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-[12.5px] font-medium text-gray-600">Report Status</span>
              <span class="rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider cs-status-badge">
                {{ reportPillLabel }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-[12.5px] font-medium text-gray-600">Reporting window</span>
              <span class="text-right text-[12.5px] font-semibold text-gray-900">{{ availableDataWindowShort }}</span>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="text-[1.1rem] font-semibold tracking-tight text-gray-900">PDF Structure</h3>
          <div class="mt-4 space-y-3.5">
            <div class="flex gap-3">
              <span class="cs-bullet text-sm">*</span>
              <div>
                <p class="text-[13px] font-semibold text-gray-900">Executive Summary</p>
                <p class="mt-0.5 text-[12px] leading-relaxed text-gray-500">High-level KPIs, revenue movement, and operating signals.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <span class="cs-bullet text-sm">*</span>
              <div>
                <p class="text-[13px] font-semibold text-gray-900">Customer &amp; Staff Insights</p>
                <p class="mt-0.5 text-[12px] leading-relaxed text-gray-500">Selected customer activity, staff performance, and demand timing.</p>
              </div>
            </div>
            <div class="flex gap-3">
              <span class="cs-bullet text-sm">*</span>
              <div>
                <p class="text-[13px] font-semibold text-gray-900">Inventory &amp; Finance</p>
                <p class="mt-0.5 text-[12px] leading-relaxed text-gray-500">Stock value, expiry exposure, and key financial watchpoints.</p>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <h3 class="text-[1.1rem] font-semibold tracking-tight text-gray-900">Selection Summary</h3>
          <div class="mt-4 space-y-3.5">
            <div>
              <p class="text-[9.5px] font-semibold uppercase tracking-wider text-gray-500">Selected period</p>
              <p class="mt-1 text-sm font-semibold text-gray-900">{{ selectedReportSummary }}</p>
              <p class="mt-1 text-[11px] leading-relaxed text-gray-600">{{ selectedReportDetail }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              <p class="text-[9.5px] font-semibold uppercase tracking-wider text-gray-500">Loaded data window</p>
              <p class="mt-0.5 text-[12px] font-medium text-gray-900">{{ availableDataWindowLabel }}</p>
            </div>
          </div>
        </article>

        <article v-if="statusMessage" class="rounded-xl p-4 text-[12.5px] leading-relaxed shadow-sm" :class="statusMessageClass">
          {{ statusMessage }}
        </article>
      </div>
    </section>

    <section class="border-t border-gray-200 pt-5">
      <p class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">System last updated</p>
      <p class="mt-1 text-sm font-medium text-gray-700">
        {{ status.lastSuccessfulSyncAt ? formatDateTime(status.lastSuccessfulSyncAt) : 'No successful sync recorded yet' }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import { createPharmacyReportsService } from '~/services/pharmacyReports/pharmacyReportsService'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'Monthly Reports',
})

interface ReportRecord {
  status?: 'ready' | 'pending' | 'failed' | string | null
  generatedAt?: string | null
  errorMessage?: string | null
}

interface ReportStatus {
  reportMonth?: string
  reportMonthLabel?: string
  availableReportMonths?: string[]
  defaultReportMonths?: string[]
  selectedReportMonths?: string[]
  selectedReportLabel?: string
  lastSuccessfulSyncAt?: string | null
  canRequestReport?: boolean
  report?: ReportRecord | null
}

interface MonthEntry {
  value: string
  shortLabel: string
  fullLabel: string
  selected: boolean
  orderValue: string
}

interface MonthGroup {
  year: number
  months: MonthEntry[]
  rangeLabel: string
}

type StatusTone = 'neutral' | 'positive' | 'warning' | 'danger'

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  isLoggedIn: boolean
  currentCompany?: { name?: string | null } | null
  checkAuthState: () => Promise<void>
}

const route = useRoute()
const router = useRouter()
const pharmacyReportsService = createPharmacyReportsService(useApi())

const loading = ref<boolean>(false)
const isRequesting = ref<boolean>(false)
const isDownloadingPdf = ref<boolean>(false)
const status = ref<ReportStatus>({
  reportMonth: '',
  reportMonthLabel: '',
  availableReportMonths: [],
  defaultReportMonths: [],
  selectedReportMonths: [],
  selectedReportLabel: '',
  lastSuccessfulSyncAt: null,
  canRequestReport: false,
  report: null,
})
const statusMessage = ref<string>('')
const statusMessageTone = ref<StatusTone>('neutral')
const selectedReportMonths = ref<string[]>([])
const generatedSelectionKey = ref<string>('')
const generatedSelectionLabel = ref<string>('')

const availableReportMonths = computed<string[]>(() => status.value.availableReportMonths ?? [])
const selectedReportMonthsSorted = computed<string[]>(() => [...selectedReportMonths.value].sort())
const selectedSelectionKey = computed<string>(() => selectedReportMonthsSorted.value.join('|'))
const defaultSelectionKey = computed<string>(() => [...(status.value.defaultReportMonths ?? [])].sort().join('|'))
const statusSelectionKey = computed<string>(() => [...(status.value.selectedReportMonths ?? [])].sort().join('|'))
const persistedSelectionReady = computed<boolean>(() =>
  status.value.report?.status === 'ready' && selectedSelectionKey.value === statusSelectionKey.value
)
const generatedMatchesSelection = computed<boolean>(() =>
  Boolean(generatedSelectionKey.value) && generatedSelectionKey.value === selectedSelectionKey.value
)
const showSyncFirstNotice = computed<boolean>(() => !status.value.canRequestReport)
const selectedMonthCount = computed<number>(() => selectedReportMonthsSorted.value.length)
const showSuggestedReset = computed<boolean>(() =>
  selectedSelectionKey.value !== defaultSelectionKey.value && Boolean(defaultSelectionKey.value)
)
const companyNameLabel = computed<string>(() =>
  companyStore.currentCompany?.name ?? String(route.params['pharmacy'] ?? 'Pharmacy')
)
const newestReportYear = computed<number>(() => {
  const first = availableReportMonths.value[0]
  if (!first) return new Date().getFullYear()
  return new Date(`${first}T00:00:00`).getFullYear()
})

const formatMonthLabel = (value: string | null | undefined): string => {
  if (!value) return 'Unknown month'
  return new Date(`${value}T00:00:00`).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return 'Not yet available'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const selectedReportSummary = computed<string>(() => {
  if (!selectedReportMonthsSorted.value.length) return 'No months selected'
  const labels = selectedReportMonthsSorted.value.map((value) => formatMonthLabel(value))
  if (labels.length === 1) return labels[0] ?? 'No months selected'
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`
  return `${labels[0]}, ${labels[1]} +${labels.length - 2} more`
})

const availableDataWindow = computed(() => {
  if (!availableReportMonths.value.length) {
    return {
      start: null as string | null,
      end: null as string | null,
      count: 0,
      label: 'No synced reportable months yet.',
      shortLabel: '0 available',
    }
  }

  const sorted = [...availableReportMonths.value].sort()
  const start = sorted[0] ?? null
  const end = sorted[sorted.length - 1] ?? null
  const sameMonth = start === end
  const count = sorted.length

  return {
    start,
    end,
    count,
    label: sameMonth
      ? `Loaded data for ${formatMonthLabel(end)}.`
      : `Loaded data from ${formatMonthLabel(start)} to ${formatMonthLabel(end)}.`,
    shortLabel: sameMonth
      ? formatMonthLabel(end)
      : `${count} available`,
  }
})

const availableDataWindowLabel = computed<string>(() => availableDataWindow.value.label)
const availableDataWindowShort = computed<string>(() => availableDataWindow.value.shortLabel)

const reportingPeriodHint = computed<string>(() => {
  if (!availableReportMonths.value.length) {
    return 'No reportable periods have loaded yet. Complete a sync and the available months will appear here.'
  }
  return `${availableDataWindowLabel.value} Select one or more months, then run the PDF export for that exact reporting window.`
})

const selectedReportDetail = computed<string>(() => {
  if (!selectedReportMonthsSorted.value.length) return 'Choose at least one month to continue.'
  if (selectedReportMonthsSorted.value.length === 1) return 'A focused single-month report.'
  return 'A combined report across the selected months.'
})

const reportMonthGroups = computed<MonthGroup[]>(() => {
  const groups = new Map<number, MonthEntry[]>()
  for (const value of availableReportMonths.value) {
    const date = new Date(`${value}T00:00:00`)
    const year = date.getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push({
      value,
      shortLabel: date.toLocaleString('en-US', { month: 'short' }),
      fullLabel: formatMonthLabel(value),
      selected: selectedReportMonths.value.includes(value),
      orderValue: value,
    })
  }

  return Array.from(groups.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, months]) => {
      const sortedMonths = [...months].sort((a, b) => b.orderValue.localeCompare(a.orderValue))
      const first = sortedMonths[0]
      const last = sortedMonths[sortedMonths.length - 1]
      return {
        year,
        months: sortedMonths,
        rangeLabel: sortedMonths.length === 1
          ? (first?.fullLabel ?? '')
          : `${last?.shortLabel ?? ''} - ${first?.shortLabel ?? ''}`,
      }
    })
})

const syncStateLabel = computed<string>(() => {
  if (!status.value.lastSuccessfulSyncAt) return 'Waiting for sync'
  return 'Synced and reportable'
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const syncStateHint = computed<string>(() => {
  if (!status.value.lastSuccessfulSyncAt) return 'The report unlocks after the latest sync completes successfully.'
  return `Latest sync finished ${formatDateTime(status.value.lastSuccessfulSyncAt)}.`
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reportStatusLabel = computed<string>(() => {
  if (isRequesting.value) return 'Generating'
  if (isDownloadingPdf.value) return 'Exporting'
  if (generatedMatchesSelection.value || persistedSelectionReady.value) return 'Ready'
  if (generatedSelectionKey.value && !generatedMatchesSelection.value) return 'Selection changed'
  if (!selectedReportMonths.value.length) return 'Select months'
  if (status.value.report?.status === 'ready') return 'Ready'
  if (status.value.report?.status === 'pending') return 'Generating'
  if (status.value.report?.status === 'failed') return 'Failed'
  return 'Not generated'
})

const reportStatusHint = computed<string>(() => {
  if (!selectedReportMonths.value.length) return 'Choose one or more months to prepare a report.'
  if (generatedMatchesSelection.value) return `${generatedSelectionLabel.value} has been generated and is ready to export.`
  if (persistedSelectionReady.value) return `Generated ${formatDateTime(status.value.report?.generatedAt)} for ${status.value.selectedReportLabel ?? selectedReportSummary.value}.`
  if (generatedSelectionKey.value && !generatedMatchesSelection.value) return 'The month selection changed. Generate again to export the updated selection.'
  if (!status.value.report) return 'No report has been generated yet for the current selection.'
  if (status.value.report?.status === 'ready') return `Generated ${formatDateTime(status.value.report.generatedAt)}.`
  if (status.value.report?.status === 'pending') return 'The latest sync is preparing a background report snapshot.'
  if (status.value.report?.status === 'failed') return status.value.report.errorMessage ?? 'The last report attempt failed.'
  return 'Generate a report after choosing the months you want included.'
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reportBadgeClass = computed<string>(() => {
  if (generatedMatchesSelection.value || persistedSelectionReady.value) return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
  if (generatedSelectionKey.value && !generatedMatchesSelection.value) return 'border border-amber-200 bg-amber-50 text-amber-800'
  if (status.value.report?.status === 'failed') return 'border border-rose-200 bg-rose-50 text-rose-800'
  return 'border border-[#e7ddf4] bg-[#faf7fd] text-[#5d4c70]'
})

const statusMessageClass = computed<string>(() => {
  if (statusMessageTone.value === 'positive') return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
  if (statusMessageTone.value === 'warning') return 'border border-amber-200 bg-amber-50 text-amber-900'
  if (statusMessageTone.value === 'danger') return 'border border-rose-200 bg-rose-50 text-rose-800'
  return 'border border-[#e7ddf4] bg-[#faf7fd] text-[#5d4c70]'
})

const bannerMessage = computed<string>(() => {
  if (showSyncFirstNotice.value) return 'No recent sync has been detected for this pharmacy.'
  return `All systems operational. The last data fetch completed successfully on ${formatDateTime(status.value.lastSuccessfulSyncAt)}.`
})

const bannerSubMessage = computed<string>(() => {
  if (showSyncFirstNotice.value) return 'Complete a successful sync first. Once sync finishes, the PDF action will unlock here.'
  return reportStatusHint.value
})

const syncPillLabel = computed<string>(() => (status.value.lastSuccessfulSyncAt ? 'Synced and ready' : 'Waiting for sync'))
const reportPillLabel = computed<string>(() => {
  if (isRequesting.value) return 'Generating'
  if (isDownloadingPdf.value) return 'Exporting'
  if (generatedMatchesSelection.value || persistedSelectionReady.value) return 'Ready to export'
  if (showSyncFirstNotice.value) return 'Sync required'
  return 'Generate report'
})

const primaryActionDisabled = computed<boolean>(() => {
  if (!status.value.canRequestReport) return true
  if (!selectedReportMonthsSorted.value.length) return true
  return isRequesting.value || isDownloadingPdf.value
})

const primaryActionLabel = computed<string>(() => {
  if (isRequesting.value) return 'Generating PDF report...'
  if (isDownloadingPdf.value) return 'Exporting PDF...'
  if (!status.value.canRequestReport) return 'Sync data to continue'
  if (generatedMatchesSelection.value || persistedSelectionReady.value) return 'Export PDF'
  return 'Generate PDF'
})

const heroStatusWidth = computed<string>(() => {
  if (generatedMatchesSelection.value || persistedSelectionReady.value) return '100%'
  if (status.value.canRequestReport) return '72%'
  return '22%'
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const heroStatusMessage = computed<string>(() => {
  if (!status.value.canRequestReport) return 'Run a successful sync first. Once reporting data is ready, this action panel will unlock PDF export.'
  if (generatedMatchesSelection.value || persistedSelectionReady.value) return `${selectedReportSummary.value} is ready. Export the finished PDF whenever you are set.`
  return `The selected reporting window is loaded. Generate the curated PDF for ${selectedReportSummary.value} when you are ready.`
})

const setStatusMessage = (message: string, tone: StatusTone = 'neutral'): void => {
  statusMessage.value = message
  statusMessageTone.value = tone
}

const syncSelectedMonthsWithStatus = (): void => {
  const available = availableReportMonths.value
  const filtered = selectedReportMonths.value.filter((value) => available.includes(value))
  if (filtered.length) {
    selectedReportMonths.value = filtered
    return
  }

  const defaults = (status.value.defaultReportMonths ?? []).filter((value) => available.includes(value))
  if (defaults.length) {
    selectedReportMonths.value = defaults
    return
  }

  selectedReportMonths.value = available.length ? [available[0]!] : []
}

const fetchStatus = async (): Promise<void> => {
  const result = await pharmacyReportsService.getStatus(selectedReportMonthsSorted.value)
  if (!result.success) {
    throw new Error(result.message ?? 'Failed to load report status')
  }
  status.value = result.data as ReportStatus
  syncSelectedMonthsWithStatus()
}

const ensureAuth = async (): Promise<boolean> => {
  await companyStore.checkAuthState()
  if (!companyStore.isLoggedIn) {
    await router.push(`/${String(route.params['pharmacy'])}/services/login`)
    return false
  }
  return true
}

const initializePage = async (): Promise<void> => {
  loading.value = true
  try {
    const okay = await ensureAuth()
    if (!okay) return
    await fetchStatus()
  } catch (error) {
    console.error(error)
    setStatusMessage(error instanceof Error ? error.message : 'Failed to load monthly reports.', 'danger')
  } finally {
    loading.value = false
  }
}

const requestReport = async ({ suppressSuccessMessage = false } = {}): Promise<boolean> => {
  isRequesting.value = true
  setStatusMessage(`Generating the report for ${selectedReportSummary.value}. This may take a few moments.`, 'neutral')
  try {
    const result = await pharmacyReportsService.requestReport(selectedReportMonthsSorted.value)
    if (!result.success) {
      throw new Error(result.message ?? 'Failed to generate report')
    }

    await fetchStatus()
    generatedSelectionKey.value = selectedSelectionKey.value
    generatedSelectionLabel.value = result.data?.reportMonthLabel ?? selectedReportSummary.value

    if (!suppressSuccessMessage) {
      setStatusMessage(`Report generated successfully for ${generatedSelectionLabel.value}. You can now export the PDF.`, 'positive')
    }
    return true
  } catch (error) {
    console.error(error)
    setStatusMessage(error instanceof Error ? error.message : 'Failed to generate report.', 'danger')
    return false
  } finally {
    isRequesting.value = false
  }
}

const downloadPdf = async (): Promise<boolean> => {
  isDownloadingPdf.value = true
  setStatusMessage('Preparing your PDF report. This may take a short moment.', 'neutral')

  try {
    const blob = await pharmacyReportsService.getPdfBlob(selectedReportMonthsSorted.value)

    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const pdfSignature = String.fromCharCode(...Array.from(bytes.slice(0, 5)))

    if (!blob.type.toLowerCase().includes('application/pdf') || pdfSignature !== '%PDF-') {
      let diagnosticMessage = 'The exported file was not returned as a valid PDF.'
      try {
        const text = new TextDecoder().decode(bytes)
        if (text) {
          diagnosticMessage = text.slice(0, 220)
        }
      } catch {
        // keep fallback diagnostic message
      }
      throw new Error(diagnosticMessage)
    }

    const filename = `monthly-report-${selectedReportMonthsSorted.value.join('-') || 'current'}.pdf`
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 60_000)

    setStatusMessage('PDF exported successfully.', 'positive')
    return true
  } catch (error) {
    console.error(error)
    setStatusMessage(error instanceof Error ? error.message : 'Failed to export PDF.', 'danger')
    return false
  } finally {
    isDownloadingPdf.value = false
  }
}

const handlePrimaryAction = async (): Promise<void> => {
  if (!status.value.canRequestReport) {
    setStatusMessage('Complete a successful sync first. Once sync finishes, the PDF action will unlock here.', 'warning')
    return
  }

  if (generatedMatchesSelection.value || persistedSelectionReady.value) {
    await downloadPdf()
    return
  }

  const generated = await requestReport({ suppressSuccessMessage: true })
  if (!generated) return

  setStatusMessage(
    `Report generated successfully for ${generatedSelectionLabel.value}. Click Export PDF to download it.`,
    'positive',
  )
}

const toggleReportMonth = (reportMonth: string): void => {
  if (selectedReportMonths.value.includes(reportMonth)) {
    if (selectedReportMonths.value.length === 1) return
    selectedReportMonths.value = selectedReportMonths.value.filter((value) => value !== reportMonth)
    return
  }
  selectedReportMonths.value = [...selectedReportMonths.value, reportMonth].sort()
}

const keepLatestMonthOnly = (): void => {
  if (!selectedReportMonthsSorted.value.length) return
  const latest = selectedReportMonthsSorted.value[selectedReportMonthsSorted.value.length - 1]
  if (latest !== undefined) selectedReportMonths.value = [latest]
}

const resetToSuggestedMonths = (): void => {
  const defaults = (status.value.defaultReportMonths ?? []).filter((value) => availableReportMonths.value.includes(value))
  if (defaults.length) {
    selectedReportMonths.value = defaults
  }
}

const selectYearMonths = (year: number): void => {
  const yearMonths = reportMonthGroups.value.find((group) => group.year === year)?.months.map((month) => month.value) ?? []
  selectedReportMonths.value = [...new Set([...selectedReportMonths.value, ...yearMonths])].sort()
}

const monthStateLabel = (year: number): string =>
  Number(year) === Number(newestReportYear.value) ? 'Available' : 'Archive'

onMounted(() => {
  void initializePage()
})

watch(selectedSelectionKey, async (nextKey, previousKey) => {
  if (!nextKey || nextKey === previousKey) return
  if (loading.value || isRequesting.value || isDownloadingPdf.value) return

  try {
    await fetchStatus()
  } catch (error) {
    console.error(error)
    setStatusMessage(error instanceof Error ? error.message : 'Failed to refresh report status for the selected months.', 'danger')
  }
})
</script>

<style scoped>
.cs-sync-badge {
  background-color: var(--ls-soft);
  color: var(--ls-accent);
  border: 1px solid var(--ls-soft-border);
}
.cs-status-ok {
  border-color: var(--ls-soft-border);
  background-color: var(--ls-soft);
  color: var(--ls-accent);
}
.cs-status-dot-ok {
  background-color: var(--ls-active-bg);
  color: var(--ls-accent);
}
.cs-pdf-card {
  background: linear-gradient(135deg, var(--ls-accent) 0%, var(--ls-sidebar) 100%);
}
.cs-pdf-btn-text {
  color: var(--ls-accent);
}
.cs-subtle-btn:hover {
  border-color: var(--ls-accent);
  color: var(--ls-accent);
}
.cs-month-selected {
  background: linear-gradient(145deg, var(--ls-accent) 0%, var(--ls-sidebar) 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.cs-month-hover:hover {
  border-color: var(--ls-active-border);
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.cs-status-badge {
  background-color: var(--ls-soft);
  color: var(--ls-accent);
}
.cs-bullet {
  color: var(--ls-accent);
  opacity: 0.7;
}
</style>
