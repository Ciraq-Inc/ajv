<template>
  <div class="min-h-screen bg-[#f3edf9] px-4 py-6 text-[#241432] print:bg-white print:p-0">
    <div v-if="loading" class="mx-auto max-w-[1120px] rounded-[2rem] border border-[#e6ddf1] bg-white px-8 py-16 text-center shadow-sm">
      <p class="text-lg font-semibold">Preparing monthly report...</p>
      <p class="mt-2 text-sm text-[#6d607c]">We're loading the latest synced summary for export.</p>
    </div>

    <div v-else-if="loadError" class="mx-auto max-w-[1120px] rounded-[2rem] border border-rose-200 bg-white px-8 py-16 text-center shadow-sm">
      <p class="text-lg font-semibold text-rose-700">Unable to load the monthly report.</p>
      <p class="mt-2 text-sm text-[#6d607c]">{{ loadError }}</p>
    </div>

    <div v-else-if="reportData" class="mx-auto max-w-[1120px] space-y-6 print:max-w-none print:space-y-0">
      <section class="print-page overflow-hidden rounded-[2rem] border border-[#e4d8f2] bg-white shadow-sm print:rounded-none print:border-none print:shadow-none">
        <div class="bg-[linear-gradient(135deg,#4b1d79_0%,#6727d9_52%,#8f63ff_100%)] px-8 py-8 text-white print:rounded-none">
          <div class="flex items-start justify-between gap-6">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">MedsGH Monthly Report</p>
              <h1 class="mt-3 text-3xl font-semibold tracking-tight">{{ reportData.meta.companyName }}</h1>
              <p class="mt-2 text-base text-white/80">{{ reportData.meta.reportMonthLabel }} performance summary</p>
            </div>

            <div class="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 text-right backdrop-blur-sm">
              <p class="text-xs uppercase tracking-[0.24em] text-white/60">Generated</p>
              <p class="mt-2 text-sm font-medium text-white">{{ formatDateTime(reportData.meta.generatedAt) }}</p>
              <p class="mt-3 text-xs uppercase tracking-[0.24em] text-white/60">Last sync</p>
              <p class="mt-2 text-sm font-medium text-white">{{ formatDateTime(reportData.meta.lastSuccessfulSyncAt) }}</p>
            </div>
          </div>
        </div>

        <div class="grid gap-5 px-8 py-8 md:grid-cols-4">
          <article class="rounded-[1.6rem] bg-[#faf7fd] p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d7c]">Revenue</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight">{{ formatCurrency(reportData.summary.revenue) }}</p>
            <p class="mt-2 text-sm text-[#6d607c]">{{ reportData.summary.transactions }} synced transactions</p>
          </article>
          <article class="rounded-[1.6rem] bg-[#faf7fd] p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d7c]">ATV</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight">{{ formatCurrency(reportData.summary.averageTransactionValue) }}</p>
            <p class="mt-2 text-sm text-[#6d607c]">Average transaction value this month</p>
          </article>
          <article class="rounded-[1.6rem] bg-[#faf7fd] p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d7c]">Inventory Cost</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight">{{ formatCurrency(reportData.summary.inventoryCost) }}</p>
            <p class="mt-2 text-sm text-[#6d607c]">Capital currently tied up in stock</p>
          </article>
          <article class="rounded-[1.6rem] bg-[#faf7fd] p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5d7c]">Verdict</p>
            <p class="mt-3 text-3xl font-semibold tracking-tight">{{ reportData.summary.verdict.status }}</p>
            <p class="mt-2 text-sm text-[#6d607c]">Sustainability score {{ reportData.summary.verdict.score }}/100</p>
          </article>
        </div>

        <div class="grid gap-6 px-8 pb-8 lg:grid-cols-[1.1fr,0.9fr]">
          <LineTrendChart
            title="3-Month Revenue Trend"
            subtitle="Revenue movement in context"
            :points="revenueTrendPoints"
            :formatter="formatCurrency"
          />

          <article class="rounded-[2rem] border border-[#e9e1f0] bg-white p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b5d7c]">Executive summary</p>
            <div class="mt-5 space-y-3">
              <div
                v-for="highlight in verdictHighlights"
                :key="highlight"
                class="rounded-[1.25rem] bg-[#faf7fd] px-4 py-3 text-sm text-[#4b3b5d]"
              >
                {{ highlight }}
              </div>
            </div>

            <div class="mt-5 rounded-[1.4rem] bg-[#f5effc] px-4 py-4">
              <p class="text-sm font-semibold text-[#331c48]">Potential profit in current stock</p>
              <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(reportData.summary.potentialProfit) }}</p>
              <p class="mt-2 text-sm text-[#6d607c]">This is the upside available if current stock sells through at current pricing.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="print-page overflow-hidden rounded-[2rem] border border-[#e4d8f2] bg-white shadow-sm print:rounded-none print:border-none print:shadow-none">
        <div class="flex items-center justify-between border-b border-[#efe6f8] px-8 py-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.26em] text-[#6b5d7c]">Page 2</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight">Customers, team, and demand</h2>
          </div>
          <p class="text-sm text-[#6d607c]">Built from synced sales, customer, and user activity.</p>
        </div>

        <div class="grid gap-6 px-8 py-8 lg:grid-cols-2">
          <HorizontalBarsChart
            title="Top Customers by Value"
            subtitle="Highest-spending customers this month"
            :items="topCustomerValueItems"
            :formatter="formatCurrency"
          />

          <HorizontalBarsChart
            title="Top Customers by Visits"
            subtitle="Most frequent buyers in the current month"
            :items="topCustomerVisitItems"
            :formatter="formatCount"
          />

          <HorizontalBarsChart
            title="Staff Sales Contribution"
            subtitle="Sales grouped by synced staff identity"
            :items="staffPerformanceItems"
            :formatter="formatCurrency"
          />

          <HorizontalBarsChart
            title="Peak Demand by Weekday"
            subtitle="Which days carried the most transaction activity"
            :items="weekdayDemandItems"
            :formatter="formatCount"
          />
        </div>
      </section>

      <section class="print-page overflow-hidden rounded-[2rem] border border-[#e4d8f2] bg-white shadow-sm print:rounded-none print:border-none print:shadow-none">
        <div class="flex items-center justify-between border-b border-[#efe6f8] px-8 py-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.26em] text-[#6b5d7c]">Page 3</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight">Inventory and financial pressure</h2>
          </div>
          <p class="text-sm text-[#6d607c]">Stock value, expiry exposure, and open obligations.</p>
        </div>

        <div class="grid gap-6 px-8 py-8 lg:grid-cols-[1fr,1fr]">
          <article class="rounded-[2rem] border border-[#ece7f4] bg-white p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b5d7c]">Inventory flow</p>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="rounded-[1.3rem] bg-[#faf7fd] px-4 py-4">
                <p class="text-sm font-semibold text-[#2f1d42]">Purchases cost</p>
                <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(reportData.inventory.monthlyStockFlow.purchasesCost) }}</p>
              </div>
              <div class="rounded-[1.3rem] bg-[#faf7fd] px-4 py-4">
                <p class="text-sm font-semibold text-[#2f1d42]">COGS</p>
                <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(reportData.inventory.monthlyStockFlow.cogs) }}</p>
              </div>
              <div class="rounded-[1.3rem] bg-[#faf7fd] px-4 py-4">
                <p class="text-sm font-semibold text-[#2f1d42]">Days on hand</p>
                <p class="mt-2 text-2xl font-semibold">{{ reportData.inventory.monthlyStockFlow.inventoryDaysOnHand ?? 'N/A' }}</p>
              </div>
              <div class="rounded-[1.3rem] bg-[#faf7fd] px-4 py-4">
                <p class="text-sm font-semibold text-[#2f1d42]">Projected expiry loss</p>
                <p class="mt-2 text-2xl font-semibold text-rose-600">{{ formatCurrency(reportData.inventory.expiry.projectedLossTotal) }}</p>
              </div>
            </div>

            <div class="mt-5 rounded-[1.4rem] bg-[#f7f3fc] px-4 py-4">
              <p class="text-sm font-semibold text-[#2f1d42]">Expiry value bands</p>
              <div class="mt-3 grid gap-3 sm:grid-cols-3">
                <div class="rounded-[1rem] bg-white px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-[#78698a]">Within 30 days</p>
                  <p class="mt-2 text-lg font-semibold">{{ formatCurrency(reportData.inventory.expiry.bands.within30Days.value) }}</p>
                </div>
                <div class="rounded-[1rem] bg-white px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-[#78698a]">Within 60 days</p>
                  <p class="mt-2 text-lg font-semibold">{{ formatCurrency(reportData.inventory.expiry.bands.within60Days.value) }}</p>
                </div>
                <div class="rounded-[1rem] bg-white px-3 py-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-[#78698a]">Within 90 days</p>
                  <p class="mt-2 text-lg font-semibold">{{ formatCurrency(reportData.inventory.expiry.bands.within90Days.value) }}</p>
                </div>
              </div>
            </div>
          </article>

          <div class="space-y-6">
            <DonutSummaryChart
              title="Liquidity Pressure"
              subtitle="What still needs to come in versus what still needs to go out"
              center-label="Open items"
              :center-value="formatCurrency((reportData.finance.receivables?.total ?? 0) + (reportData.finance.payables?.total ?? 0))"
              :segments="financeSegments"
              :formatter="formatCurrency"
            />

            <HorizontalBarsChart
              title="Products at Expiry Risk"
              subtitle="Highest projected loss from slow-moving stock"
              :items="expiryRiskItems"
              :formatter="formatCurrency"
            />
          </div>
        </div>

        <div class="border-t border-[#efe6f8] px-8 py-5 text-xs text-[#7b6d8b]">
          <p v-for="note in reportData.meta.notes" :key="note" class="mt-1 first:mt-0">{{ note }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import LineTrendChart from '~/components/reports/LineTrendChart.vue'
import HorizontalBarsChart from '~/components/reports/HorizontalBarsChart.vue'
import DonutSummaryChart from '~/components/reports/DonutSummaryChart.vue'
import { createPharmacyReportsService } from '~/services/pharmacyReports/pharmacyReportsService'

definePageMeta({
  layout: false,
})

// ---------------------------------------------------------------------------
// Local report shape — broader than PharmacyReportData.data (Record<string,unknown>)
// ---------------------------------------------------------------------------

interface TrendPoint {
  label?: string | null
  revenue?: number | null
}

interface CustomerByValue {
  customerName?: string | null
  totalValue?: number | null
}

interface CustomerByFrequency {
  customerName?: string | null
  visits?: number | null
}

interface StaffPerformance {
  staffName?: string | null
  totalSales?: number | null
}

interface WeekdayDemand {
  label?: string | null
  transactions?: number | null
}

interface ExpiryAtRisk {
  productName?: string | null
  projectedLoss?: number | null
}

interface ExpiryBand {
  value?: number | null
}

interface FinanceSide {
  total?: number | null
}

interface FullReportData {
  meta: {
    companyName?: string | null
    reportMonthLabel?: string | null
    generatedAt?: string | null
    lastSuccessfulSyncAt?: string | null
    notes?: string[]
  }
  summary: {
    revenue?: number | null
    transactions?: number | null
    averageTransactionValue?: number | null
    inventoryCost?: number | null
    potentialProfit?: number | null
    verdict: {
      status?: string | null
      score?: number | null
      highlights?: string[]
    }
  }
  revenue?: {
    trend?: TrendPoint[]
  }
  customers?: {
    byValue?: CustomerByValue[]
    byFrequency?: CustomerByFrequency[]
  }
  team?: {
    staffPerformance?: StaffPerformance[]
  }
  demand?: {
    weekdays?: WeekdayDemand[]
  }
  inventory: {
    monthlyStockFlow: {
      purchasesCost?: number | null
      cogs?: number | null
      inventoryDaysOnHand?: number | null
    }
    expiry: {
      projectedLossTotal?: number | null
      bands: {
        within30Days: ExpiryBand
        within60Days: ExpiryBand
        within90Days: ExpiryBand
      }
      atRisk?: ExpiryAtRisk[]
    }
  }
  finance: {
    receivables?: FinanceSide | null
    payables?: FinanceSide | null
    insurance?: { totalUnsettled?: number | null } | null
  }
}

interface ChartItem {
  label: string
  value: number
  // Index signature required to satisfy the chart components' Point / ChartItem types
  [key: string]: unknown
}

interface DonutSegment {
  label: string
  value: number
  color: string
}

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  checkAuthState: () => Promise<void>
  isLoggedIn: boolean
}

const route = useRoute()
const router = useRouter()
const pharmacyReportsService = createPharmacyReportsService(useApi())

const loading = ref<boolean>(true)
const loadError = ref<string>('')
const reportData = ref<FullReportData | null>(null)

const getRequestedReportMonths = (): string[] => {
  const queryMonths = route.query['reportMonths']
  if (Array.isArray(queryMonths) && queryMonths.length > 0) {
    return queryMonths.filter((m): m is string => typeof m === 'string')
  }
  if (typeof queryMonths === 'string' && queryMonths.trim()) {
    return queryMonths.split(',').map((value) => value.trim()).filter(Boolean)
  }
  return []
}

const revenueTrendPoints = computed<ChartItem[]>(() =>
  (reportData.value?.revenue?.trend ?? []).map((item) => ({
    label: item.label ?? '',
    value: item.revenue ?? 0,
  }))
)

const topCustomerValueItems = computed<ChartItem[]>(() =>
  (reportData.value?.customers?.byValue ?? []).slice(0, 5).map((item) => ({
    label: item.customerName ?? '',
    value: item.totalValue ?? 0,
  }))
)

const topCustomerVisitItems = computed<ChartItem[]>(() =>
  (reportData.value?.customers?.byFrequency ?? []).slice(0, 5).map((item) => ({
    label: item.customerName ?? '',
    value: item.visits ?? 0,
  }))
)

const staffPerformanceItems = computed<ChartItem[]>(() =>
  (reportData.value?.team?.staffPerformance ?? []).slice(0, 5).map((item) => ({
    label: item.staffName ?? '',
    value: item.totalSales ?? 0,
  }))
)

const weekdayDemandItems = computed<ChartItem[]>(() =>
  (reportData.value?.demand?.weekdays ?? []).map((item) => ({
    label: item.label ?? '',
    value: item.transactions ?? 0,
  }))
)

const financeSegments = computed<DonutSegment[]>(() => {
  if (!reportData.value?.finance) return []
  return [
    { label: 'Receivables', value: reportData.value.finance.receivables?.total ?? 0, color: '#f97316' },
    { label: 'Payables', value: reportData.value.finance.payables?.total ?? 0, color: '#ef4444' },
    { label: 'Insurance unsettled', value: reportData.value.finance.insurance?.totalUnsettled ?? 0, color: '#8b5cf6' },
  ].filter((item) => Number(item.value) > 0)
})

const expiryRiskItems = computed<ChartItem[]>(() =>
  (reportData.value?.inventory?.expiry?.atRisk ?? []).slice(0, 5).map((item) => ({
    label: item.productName ?? '',
    value: item.projectedLoss ?? 0,
  }))
)

const verdictHighlights = computed<string[]>(() =>
  reportData.value?.summary?.verdict?.highlights ?? []
)

const formatCurrency = (value: number | null | undefined): string =>
  `GHS ${Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatCount = (value: number | null | undefined): string =>
  `${Number(value ?? 0)}`

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

const ensureAuth = async (): Promise<boolean> => {
  await companyStore.checkAuthState()
  if (!companyStore.isLoggedIn) {
    await router.replace(`/${String(route.params['pharmacy'])}/services/login`)
    return false
  }
  return true
}

const fetchCurrentReport = async (): Promise<void> => {
  const result = await pharmacyReportsService.getCurrentReport(getRequestedReportMonths())
  if (!result.success) {
    throw new Error(result.message ?? 'No current monthly report is available yet.')
  }
  // PharmacyReportData.data is Record<string, unknown>; cast to local full shape
  reportData.value = (result.data as unknown as { data: FullReportData }).data
}

const initializePage = async (): Promise<void> => {
  loading.value = true
  loadError.value = ''
  try {
    const okay = await ensureAuth()
    if (!okay) return
    await fetchCurrentReport()

    if (route.query['autoprint'] === '1') {
      setTimeout(() => {
        window.print()
      }, 350)
    }
  } catch (error) {
    console.error(error)
    loadError.value = error instanceof Error ? error.message : 'Failed to load monthly report.'
  } finally {
    loading.value = false
  }
}

onMounted(() => { void initializePage() })
</script>

<style scoped>
.print-page {
  break-after: page;
  page-break-after: always;
}

.print-page:last-child {
  break-after: auto;
  page-break-after: auto;
}

@media print {
  :global(body) {
    background: white;
  }

  .print-page {
    min-height: 100vh;
  }
}
</style>
