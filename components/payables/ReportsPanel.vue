<template>
  <div>
    <div class="flex flex-col gap-1 border-b border-slate-100 px-5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:px-6">
      <h2 class="text-sm font-semibold text-slate-950">Reports</h2>
      <div class="flex items-center gap-2">
        <p class="text-xs text-slate-400">
          <span class="font-semibold tabular-nums text-slate-700">{{ formatPesewas(outstandingTotalPesewas) }}</span>
          outstanding
        </p>
        <button
          type="button"
          :disabled="isRefreshing"
          class="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          @click="refresh"
        >
          <ArrowPathIcon class="h-3.5 w-3.5" :class="isRefreshing ? 'animate-spin' : ''" aria-hidden="true" />
          {{ isRefreshing ? 'Refreshing' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-2 p-5" aria-label="Loading reports">
      <div v-for="item in 6" :key="item" class="flex items-center gap-4">
        <div class="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
        <div class="flex-1 space-y-2"><div class="h-3 w-1/4 animate-pulse rounded bg-slate-100" /><div class="h-3 w-1/3 animate-pulse rounded bg-slate-50" /></div>
        <div class="h-3 w-20 animate-pulse rounded bg-slate-100" />
      </div>
    </div>

    <div v-else-if="error" class="p-10 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><ExclamationTriangleIcon class="h-6 w-6" aria-hidden="true" /></span>
      <h2 class="mt-4 text-base font-semibold text-slate-950">We could not load the reports</h2>
      <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">{{ error }}</p>
      <button type="button" class="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="refresh">Try again</button>
    </div>

    <template v-else>
      <div class="border-b border-slate-200/80 px-5 sm:px-6" role="tablist" aria-label="Payables reports">
        <div class="-mb-px flex flex-wrap gap-x-2 gap-y-1">
          <button v-for="tab in tabs" :id="`payables-report-tab-${tab.value}`" :key="tab.value" type="button" role="tab" :aria-selected="activeTab === tab.value" :aria-controls="`payables-report-panel-${tab.value}`" class="relative inline-flex min-h-10 items-center px-2.5 text-sm font-medium transition first:pl-0 focus:outline-none focus-visible:text-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" :class="activeTab === tab.value ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'" @click="activeTab = tab.value">
            {{ tab.label }}
            <span class="absolute inset-x-0 -bottom-px h-0.5 rounded-full transition group-first:left-0" :class="activeTab === tab.value ? 'bg-slate-950' : 'bg-transparent'" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Cheque register -->
      <section v-if="activeTab === 'cheques'" id="payables-report-panel-cheques" role="tabpanel" aria-labelledby="payables-report-tab-cheques" aria-label="Cheque register">
        <div class="flex flex-wrap gap-1 px-5 py-3 sm:px-6" aria-label="Cheque register filter">
          <button v-for="filter in chequeFilters" :key="filter.value" type="button" class="min-h-8 rounded-md px-2.5 text-xs font-semibold transition focus:outline-none focus-visible:text-slate-950" :class="chequeFilter === filter.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'" @click="chequeFilter = filter.value">{{ filter.label }}</button>
        </div>
        <div v-if="visibleCheques.length" class="overflow-x-auto">
          <table class="min-w-[760px] w-full border-collapse">
            <colgroup><col class="w-[22%]" /><col class="w-[18%]" /><col class="w-[28%]" /><col class="w-[17%]" /><col class="w-[15%]" /></colgroup>
            <thead>
              <tr class="border-b border-slate-200">
                <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Expected clearance</th>
                <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Cheque no.</th>
                <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Supplier</th>
                <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Invoice</th>
                <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="entry in visibleCheques" :key="entry.payment.id" class="transition-colors hover:bg-slate-50">
                <td class="whitespace-nowrap px-5 py-3 text-sm tabular-nums" :class="entry.date ? (chequeDateTone(entry.date)) : 'text-slate-400'">
                    {{ entry.date ? formatDate(entry.date) : 'Not recorded' }}
                    <span v-if="entry.estimated" class="ml-1 text-xs font-normal text-slate-500">(estimated)</span>
                </td>
                <td class="max-w-[160px] truncate px-4 py-3 text-sm text-slate-500" :title="entry.chequeNumber || undefined">{{ entry.chequeNumber || '—' }}</td>
                <td class="max-w-[260px] truncate px-4 py-3 text-sm font-medium text-slate-900" :title="entry.payment.supplierName || undefined">{{ entry.payment.supplierName || 'Unnamed supplier' }}</td>
                <td class="max-w-[190px] truncate px-4 py-3 text-sm text-slate-500" :title="entry.payment.supplierInvoiceNo || entry.payment.payableId">{{ entry.payment.supplierInvoiceNo || entry.payment.payableId }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatPesewas(entry.payment.amountPesewas) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="min-h-[320px] px-6 py-14 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><BanknotesIcon class="h-6 w-6" aria-hidden="true" /></span>
          <h3 class="mt-4 text-base font-semibold text-slate-950">{{ chequeEmptyTitle }}</h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{{ chequeEmptyHint }}</p>
        </div>
      </section>

      <!-- Supplier balances -->
      <section v-else-if="activeTab === 'supplier_balances'" id="payables-report-panel-supplier_balances" role="tabpanel" aria-labelledby="payables-report-tab-supplier_balances" aria-label="Supplier balances report">
        <div v-if="supplierBalances.length" class="overflow-x-auto">
          <table class="min-w-[640px] w-full border-collapse">
            <colgroup><col class="w-[46%]" /><col class="w-[18%]" /><col class="w-[18%]" /><col class="w-[18%]" /></colgroup>
            <thead>
              <tr class="border-b border-slate-200">
                <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Supplier</th>
                <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Invoices</th>
                <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Overdue</th>
                <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Balance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="supplier in supplierBalances" :key="supplier.name" class="transition-colors hover:bg-slate-50">
                <th scope="row" class="max-w-[280px] truncate px-5 py-3 text-left text-sm font-medium text-slate-900" :title="supplier.name">{{ supplier.name }}</th>
                <td class="px-4 py-3 text-right text-sm tabular-nums text-slate-500">{{ supplier.invoiceCount }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-500">{{ supplier.overduePesewas ? formatPesewas(supplier.overduePesewas) : '—' }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatPesewas(supplier.balancePesewas) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="min-h-[320px] px-6 py-14 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><BuildingOffice2Icon class="h-6 w-6" aria-hidden="true" /></span>
          <h3 class="mt-4 text-base font-semibold text-slate-950">No outstanding supplier balances</h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Open supplier invoices will appear here grouped by supplier.</p>
        </div>
      </section>

      <!-- Invoice due dates -->
      <section v-else-if="activeTab === 'invoice_due_dates'" id="payables-report-panel-invoice_due_dates" role="tabpanel" aria-labelledby="payables-report-tab-invoice_due_dates" aria-label="Invoice due dates report">
        <div v-if="invoicesByDueDate.length" class="overflow-x-auto">
          <table class="min-w-[680px] w-full border-collapse">
            <colgroup><col class="w-[22%]" /><col class="w-[30%]" /><col class="w-[30%]" /><col class="w-[18%]" /></colgroup>
            <thead>
              <tr class="border-b border-slate-200">
                <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Due date</th>
                <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Supplier</th>
                <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Invoice</th>
                <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Outstanding</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="payable in invoicesByDueDate" :key="payable.id" class="transition-colors hover:bg-slate-50">
                <td class="whitespace-nowrap px-5 py-3 text-sm tabular-nums" :class="invoiceDueTone(payable.dueDate)">{{ formatDate(dueDateOf(payable)) }}</td>
                <td class="max-w-[260px] truncate px-4 py-3 text-sm font-medium text-slate-900" :title="payable.supplierName || undefined">{{ payable.supplierName || 'Unnamed supplier' }}</td>
                <td class="max-w-[220px] truncate px-4 py-3 text-sm text-slate-500" :title="payable.supplierInvoiceNo || payable.invoiceId">{{ payable.supplierInvoiceNo || payable.invoiceId }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatPesewas(payable.balancePesewas) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="min-h-[320px] px-6 py-14 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><DocumentTextIcon class="h-6 w-6" aria-hidden="true" /></span>
          <h3 class="mt-4 text-base font-semibold text-slate-950">No open invoices with a due date</h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Invoices with a due date will appear here, ordered from the most urgent.</p>
        </div>
      </section>

      <!-- Payment activity -->
      <section v-else id="payables-report-panel-payment_activity" role="tabpanel" aria-labelledby="payables-report-tab-payment_activity" aria-label="Payment activity report">
        <div v-if="paymentMethods.length" class="overflow-x-auto">
          <table class="min-w-[560px] w-full border-collapse">
            <colgroup><col class="w-[50%]" /><col class="w-[22%]" /><col class="w-[28%]" /></colgroup>
            <thead>
              <tr class="border-b border-slate-200">
                <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Payment method</th>
                <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Payments</th>
                <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Amount paid</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="method in paymentMethods" :key="method.label" class="transition-colors hover:bg-slate-50">
                <th scope="row" class="px-5 py-3 text-left text-sm font-medium text-slate-900">{{ method.label }}</th>
                <td class="px-4 py-3 text-right text-sm tabular-nums text-slate-500">{{ method.count }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatPesewas(method.totalPesewas) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="min-h-[320px] px-6 py-14 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><BanknotesIcon class="h-6 w-6" aria-hidden="true" /></span>
          <h3 class="mt-4 text-base font-semibold text-slate-950">No supplier payments yet</h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Payments posted against supplier invoices in the last 30 days will appear here.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowPathIcon, BanknotesIcon, BuildingOffice2Icon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useAccountsWorkbench } from '~/composables/useAccountsWorkbench'
import { buildChequeCalendar, buildMethodTable, usePayablesReports } from '~/composables/usePayablesReports'
import type { ChequeCalendarEntry } from '~/composables/usePayablesReports'
import type { PayableSummary } from '~/services/types'

type ReportTab = 'cheques' | 'supplier_balances' | 'invoice_due_dates' | 'payment_activity'
type ChequeFilter = 'all' | 'overdue' | 'due_soon' | 'missing_date'
type SupplierBalance = { name: string; invoiceCount: number; balancePesewas: number; overduePesewas: number }

const tabs: Array<{ value: ReportTab; label: string }> = [
  { value: 'cheques', label: 'Cheques' },
  { value: 'supplier_balances', label: 'Supplier balances' },
  { value: 'invoice_due_dates', label: 'Invoice due dates' },
  { value: 'payment_activity', label: 'Payment activity' },
]
const chequeFilters: Array<{ value: ChequeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_soon', label: 'Due in 7 days' },
  { value: 'missing_date', label: 'Missing date' },
]

const { formatMoney } = useAccountsWorkbench()
const { isLoading, error, load, payables, payments } = usePayablesReports()
const activeTab = ref<ReportTab>('cheques')
const chequeFilter = ref<ChequeFilter>('all')
const isRefreshing = ref(false)

const localIsoDate = (date = new Date()): string => {
  const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60_000))
  return offsetDate.toISOString().slice(0, 10)
}
const todayIso = localIsoDate()
const sevenDaysFromToday = localIsoDate(new Date(Date.now() + (7 * 86_400_000)))
const thirtyDaysAgo = localIsoDate(new Date(Date.now() - (29 * 86_400_000)))

const formatPesewas = (pesewas: number): string => formatMoney((Number(pesewas) || 0) / 100)
const isoDate = (value: string | null | undefined): string | null => {
  if (!value) return null
  const text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : localIsoDate(date)
}
const formatDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
const daysFromToday = (date: string): number => Math.round((Date.parse(`${date}T00:00:00`) - Date.parse(`${todayIso}T00:00:00`)) / 86_400_000)

const outstandingTotalPesewas = computed(() =>
  payables.value.reduce((total, payable) => total + (Number(payable.balancePesewas) || 0), 0),
)

const chequeCalendar = computed(() => buildChequeCalendar(payments.value))
const chequeRows = computed<ChequeCalendarEntry[]>(() => [
  ...chequeCalendar.value.days.flatMap((day) => day.entries),
  ...chequeCalendar.value.unscheduled,
])
const visibleCheques = computed(() => chequeRows.value.filter((entry) => {
  if (chequeFilter.value === 'missing_date') return !entry.date
  if (!entry.date) return chequeFilter.value === 'all'
  if (chequeFilter.value === 'overdue') return entry.date < todayIso
  if (chequeFilter.value === 'due_soon') return entry.date >= todayIso && entry.date <= sevenDaysFromToday
  return true
}))
const chequeEmptyTitle = computed(() => ({
  all: 'No cheque payments recorded',
  overdue: 'No overdue cheque clearances',
  due_soon: 'No cheques due in the next seven days',
  missing_date: 'Every cheque has a clearance date',
}[chequeFilter.value]))
const chequeEmptyHint = computed(() => chequeFilter.value === 'all'
  ? 'Cheque payments will appear here after they are recorded against a supplier invoice.'
  : 'Choose another cheque filter to review the rest of the register.')

const openPayables = computed(() => payables.value.filter((payable) => Number(payable.balancePesewas) > 0))
const isOverdue = (payable: PayableSummary): boolean => {
  const due = isoDate(payable.dueDate)
  return Boolean(due && due < todayIso)
}
const supplierBalances = computed<SupplierBalance[]>(() => {
  const groups = new Map<string, SupplierBalance>()
  for (const payable of openPayables.value) {
    const name = payable.supplierName?.trim() || 'Unnamed supplier'
    const group = groups.get(name) ?? { name, invoiceCount: 0, balancePesewas: 0, overduePesewas: 0 }
    const balance = Number(payable.balancePesewas) || 0
    group.invoiceCount += 1
    group.balancePesewas += balance
    if (isOverdue(payable)) group.overduePesewas += balance
    groups.set(name, group)
  }
  return [...groups.values()].sort((first, second) => second.balancePesewas - first.balancePesewas)
})
const dueDateOf = (payable: PayableSummary): string => isoDate(payable.dueDate) || ''
const invoicesByDueDate = computed(() => [...openPayables.value]
  .filter((payable) => Boolean(isoDate(payable.dueDate)))
  .sort((first, second) => dueDateOf(first).localeCompare(dueDateOf(second))))
const recentPayments = computed(() => payments.value.filter((payment) => {
  const postedAt = isoDate(payment.postedAt)
  return postedAt !== null && postedAt >= thirtyDaysAgo && postedAt <= todayIso
}))
const paymentMethods = computed(() => buildMethodTable(recentPayments.value))

const chequeDateTone = (date: string): string => {
  const days = daysFromToday(date)
  if (days < 0) return 'text-rose-700'
  if (days <= 7) return 'text-amber-700'
  return 'text-slate-900'
}
const invoiceDueTone = (dueDate: string | null | undefined): string => {
  const due = isoDate(dueDate)
  if (!due) return 'text-slate-400'
  const days = daysFromToday(due)
  if (days < 0) return 'text-rose-700'
  if (days <= 7) return 'text-amber-700'
  return 'text-slate-900'
}
const refresh = async (): Promise<void> => {
  isRefreshing.value = true
  try { await load({ silent: true }) } finally { isRefreshing.value = false }
}
onMounted(() => { void load() })
</script>
