<template>
  <div class="pr">
    <div class="pr-bar">
      <div class="pr-tabs" role="tablist" aria-label="Payables reports">
        <button
          v-for="tab in tabs"
          :id="`payables-report-tab-${tab.value}`"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.value"
          :aria-controls="`payables-report-panel-${tab.value}`"
          class="pr-tab"
          :class="{ 'is-on': activeTab === tab.value }"
          @click="activeTab = tab.value"
        >{{ tab.label }}</button>
      </div>
      <div class="pr-tools">
        <span class="pr-total"><b>{{ formatPesewas(outstandingTotalPesewas) }}</b> outstanding</span>
        <button type="button" class="pr-icon" :disabled="isRefreshing" aria-label="Refresh reports" title="Refresh" @click="refresh">
          <ArrowPathIcon class="pr-ico" :class="{ 'pr-spin': isRefreshing }" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="pr-skel" aria-label="Loading reports">
      <div v-for="item in 6" :key="item" class="pr-skel-row"><i /><i /><i /></div>
    </div>

    <div v-else-if="error" class="pr-state" role="alert">
      <h3>We could not load the reports</h3>
      <p>{{ error }}</p>
      <button type="button" class="pr-btn" @click="refresh">Try again</button>
    </div>

    <template v-else>
      <!-- Cheque register -->
      <section v-if="activeTab === 'cheques'" id="payables-report-panel-cheques" role="tabpanel" aria-labelledby="payables-report-tab-cheques" aria-label="Cheque register">
        <div class="pr-chips" aria-label="Cheque register filter">
          <button v-for="filter in chequeFilters" :key="filter.value" type="button" class="pr-chip" :class="{ 'is-on': chequeFilter === filter.value }" :aria-pressed="chequeFilter === filter.value" @click="chequeFilter = filter.value">{{ filter.label }}</button>
        </div>
        <table v-if="visibleCheques.length" class="pr-table">
          <thead>
            <tr>
              <th scope="col">Expected clearance</th>
              <th scope="col">Cheque no.</th>
              <th scope="col">Supplier</th>
              <th scope="col">Invoice</th>
              <th scope="col" class="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in visibleCheques" :key="entry.payment.id">
              <td class="pr-date" :class="entry.date ? dueTone(entry.date) : 'is-none'" data-label="Clears">
                <span>{{ entry.date ? formatDate(entry.date) : 'Not recorded' }}</span>
                <em v-if="entry.estimated">estimated</em>
              </td>
              <td class="pr-mute pr-cut" data-label="Cheque no." :title="entry.chequeNumber || undefined">{{ entry.chequeNumber || '—' }}</td>
              <td class="pr-strong pr-cut pr-main" :title="entry.payment.supplierName || undefined">{{ entry.payment.supplierName || 'Unnamed supplier' }}</td>
              <td class="pr-mute pr-cut" data-label="Invoice" :title="entry.payment.supplierInvoiceNo || entry.payment.payableId">{{ entry.payment.supplierInvoiceNo || entry.payment.payableId }}</td>
              <td class="r pr-amt">{{ formatPesewas(entry.payment.amountPesewas) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="pr-state">
          <h3>{{ chequeEmptyTitle }}</h3>
          <p>{{ chequeEmptyHint }}</p>
        </div>
      </section>

      <!-- Supplier balances -->
      <section v-else-if="activeTab === 'supplier_balances'" id="payables-report-panel-supplier_balances" role="tabpanel" aria-labelledby="payables-report-tab-supplier_balances" aria-label="Supplier balances report">
        <table v-if="supplierBalances.length" class="pr-table pr-table-3">
          <thead>
            <tr>
              <th scope="col">Supplier</th>
              <th scope="col" class="r">Invoices</th>
              <th scope="col" class="r">Overdue</th>
              <th scope="col" class="r">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supplier in supplierBalances" :key="supplier.name">
              <th scope="row" class="pr-strong pr-cut pr-main" :title="supplier.name">{{ supplier.name }}</th>
              <td class="r pr-mute" data-label="Invoices">{{ supplier.invoiceCount }}</td>
              <td class="r pr-mute" :class="{ 'is-late': supplier.overduePesewas }" data-label="Overdue">{{ supplier.overduePesewas ? formatPesewas(supplier.overduePesewas) : '—' }}</td>
              <td class="r pr-amt">{{ formatPesewas(supplier.balancePesewas) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="pr-state">
          <h3>No outstanding supplier balances</h3>
          <p>Open supplier invoices will appear here grouped by supplier.</p>
        </div>
      </section>

      <!-- Invoice due dates -->
      <section v-else-if="activeTab === 'invoice_due_dates'" id="payables-report-panel-invoice_due_dates" role="tabpanel" aria-labelledby="payables-report-tab-invoice_due_dates" aria-label="Invoice due dates report">
        <table v-if="invoicesByDueDate.length" class="pr-table pr-table-4">
          <thead>
            <tr>
              <th scope="col">Due date</th>
              <th scope="col">Supplier</th>
              <th scope="col">Invoice</th>
              <th scope="col" class="r">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payable in invoicesByDueDate" :key="payable.id">
              <td class="pr-date" :class="invoiceDueTone(payable.dueDate)" data-label="Due"><span>{{ formatDate(dueDateOf(payable)) }}</span></td>
              <td class="pr-strong pr-cut pr-main" :title="payable.supplierName || undefined">{{ payable.supplierName || 'Unnamed supplier' }}</td>
              <td class="pr-mute pr-cut" data-label="Invoice" :title="payable.supplierInvoiceNo || payable.invoiceId">{{ payable.supplierInvoiceNo || payable.invoiceId }}</td>
              <td class="r pr-amt">{{ formatPesewas(payable.balancePesewas) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="pr-state">
          <h3>No open invoices with a due date</h3>
          <p>Invoices with a due date will appear here, ordered from the most urgent.</p>
        </div>
      </section>

      <!-- Payment activity -->
      <section v-else id="payables-report-panel-payment_activity" role="tabpanel" aria-labelledby="payables-report-tab-payment_activity" aria-label="Payment activity report">
        <p v-if="paymentMethods.length" class="pr-note">Last 30 days</p>
        <table v-if="paymentMethods.length" class="pr-table pr-table-2">
          <thead>
            <tr>
              <th scope="col">Payment method</th>
              <th scope="col" class="r">Payments</th>
              <th scope="col" class="r">Amount paid</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="method in paymentMethods" :key="method.label">
              <th scope="row" class="pr-strong pr-main">{{ method.label }}</th>
              <td class="r pr-mute" data-label="Payments">{{ method.count }}</td>
              <td class="r pr-amt">{{ formatPesewas(method.totalPesewas) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="pr-state">
          <h3>No supplier payments yet</h3>
          <p>Payments posted against supplier invoices in the last 30 days will appear here.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
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

const dueTone = (date: string): string => {
  const days = daysFromToday(date)
  if (days < 0) return 'is-late'
  if (days <= 7) return 'is-soon'
  return ''
}
const invoiceDueTone = (dueDate: string | null | undefined): string => {
  const due = isoDate(dueDate)
  return due ? dueTone(due) : 'is-none'
}
const refresh = async (): Promise<void> => {
  isRefreshing.value = true
  try { await load({ silent: true }) } finally { isRefreshing.value = false }
}
onMounted(() => { void load() })
</script>

<style scoped>
.pr { --ink:#14161c; --ink-2:#3b3f4a; --mute:#6a6f7d; --faint:#9a9fac; --line:#e4e6eb; --line-2:#d3d6dd; --wash:#f6f7f9; color: var(--ink); font-size: 13.5px; }
.pr-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 20px; border-bottom: 1px solid var(--line); }
.pr-tabs { display: flex; gap: 22px; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.pr-tabs::-webkit-scrollbar { display: none; }
.pr-tab { flex: none; position: relative; height: 44px; padding: 0; background: none; border: 0; font: inherit; font-weight: 500; color: var(--mute); cursor: pointer; white-space: nowrap; }
.pr-tab:hover { color: var(--ink); }
.pr-tab.is-on { color: var(--ink); }
.pr-tab.is-on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ink); border-radius: 2px; }
.pr-tab:focus-visible, .pr-chip:focus-visible, .pr-icon:focus-visible, .pr-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.pr-tools { flex: none; display: flex; align-items: center; gap: 12px; }
.pr-total { font-size: 12.5px; color: var(--faint); white-space: nowrap; }
.pr-total b { font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.pr-icon { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid var(--line-2); border-radius: 8px; background: #fff; color: var(--ink-2); cursor: pointer; }
.pr-icon:hover:not(:disabled) { background: var(--wash); color: var(--ink); }
.pr-icon:disabled { cursor: wait; opacity: .6; }
.pr-ico { width: 15px; height: 15px; display: block; }
.pr-spin { animation: pr-rot .8s linear infinite; }
@keyframes pr-rot { to { transform: rotate(360deg); } }

.pr-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 14px 20px 10px; }
.pr-chip { height: 28px; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 999px; background: #fff; font: inherit; font-size: 12.5px; color: var(--ink-2); cursor: pointer; }
.pr-chip:hover { background: var(--wash); }
.pr-chip.is-on { background: var(--ink); border-color: var(--ink); color: #fff; }
.pr-note { padding: 14px 20px 4px; font-size: 12px; color: var(--faint); }

.pr-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.pr-table th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 500; color: var(--faint); border-bottom: 1px solid var(--line); }
.pr-table tbody th { font-size: 13.5px; color: var(--ink); border-bottom: 1px solid var(--line); }
.pr-table td { padding: 12px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.pr-table tbody tr:last-child > * { border-bottom: 0; }
.pr-table tbody tr:hover { background: var(--wash); }
.pr-table th:first-child, .pr-table td:first-child { padding-left: 20px; }
.pr-table th:last-child, .pr-table td:last-child { padding-right: 20px; }
.pr-table .r { text-align: right; }
.pr-table-2 th:first-child { width: 50%; }
.pr-table-3 th:first-child { width: 46%; }
.pr-table-4 th:nth-child(1) { width: 20%; }
.pr-table-4 th:nth-child(4) { width: 18%; }
.pr-strong { font-weight: 500; color: var(--ink); }
.pr-mute { color: var(--mute); }
.pr-cut { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pr-amt { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pr-table .r.pr-mute { font-variant-numeric: tabular-nums; white-space: nowrap; }
.pr-date { white-space: nowrap; font-variant-numeric: tabular-nums; }
.pr-date em { margin-left: 6px; font-style: normal; font-size: 12px; color: var(--faint); }
.pr-date.is-none { color: var(--faint); }
.pr-date.is-late { color: #b42318; }
.pr-date.is-soon span::before { content: ''; display: inline-block; width: 6px; height: 6px; margin-right: 8px; border-radius: 50%; background: #d97706; vertical-align: 1px; }
.pr-table .is-late { color: #b42318; }

.pr-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 24px; }
.pr-state h3 { font-size: 14px; font-weight: 600; color: var(--ink); }
.pr-state p { margin-top: 6px; max-width: 380px; line-height: 1.5; color: var(--mute); }
.pr-btn { margin-top: 16px; height: 34px; padding: 0 14px; border: 0; border-radius: 8px; background: var(--ink); color: #fff; font: inherit; font-weight: 500; cursor: pointer; }
.pr-btn:hover { background: #2a2d36; }

.pr-skel { padding: 8px 20px; }
.pr-skel-row { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 24px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.pr-skel-row i { height: 10px; border-radius: 4px; background: var(--wash); animation: pr-pulse 1.4s ease-in-out infinite; }
@keyframes pr-pulse { 50% { opacity: .5; } }

@media (max-width: 720px) {
  .pr-bar { padding: 0 16px; }
  .pr-total { display: none; }
  .pr-chips, .pr-note { padding-left: 16px; padding-right: 16px; }
  .pr-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .pr-table, .pr-table tbody { display: block; }
  .pr-table tbody tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
  .pr-table tbody tr:last-child { border-bottom: 0; }
  .pr-table td, .pr-table tbody th { display: block; padding: 0 !important; border: 0; min-width: 0; text-align: left; }
  .pr-table td[data-label]::before { content: attr(data-label); margin-right: 6px; font-size: 12px; color: var(--faint); }
  .pr-main { grid-column: 1; grid-row: 1; }
  .pr-table td.r.pr-amt { grid-column: 2; grid-row: 1; text-align: right; }
  .pr-table td[data-label] { grid-column: 1 / -1; font-size: 12.5px; }
  .pr-date em { margin-left: 4px; }
}
</style>
