import { computed, ref } from 'vue'
import { createAccountsService } from '~/services/accounts/accountsService'
import type {
  AccountSummary,
  PayablePaymentEntry,
  PayableSummary,
} from '~/services/types'
import { isSessionError, sessionExpiredMessage } from '~/utils/accountsSession'

/* ------------------------------------------------------------------ */
/* Pure aggregation helpers — no Vue reactivity, unit-testable.        */
/* All money values are integer pesewas unless noted.                  */
/* ------------------------------------------------------------------ */

export interface AgingBucket {
  key: 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90_plus' | 'no_due'
  label: string
  count: number
  totalPesewas: number
}

export interface CreditorGroup {
  supplierName: string
  count: number
  outstandingPesewas: number
}

export interface SeriesPoint {
  label: string
  value: number
}

export interface ChequeCalendarEntry {
  payment: PayablePaymentEntry
  chequeNumber: string
  date: string
  estimated: boolean
}

export interface ChequeCalendarDay {
  date: string
  estimated: boolean
  entries: ChequeCalendarEntry[]
  totalPesewas: number
}

export interface ChequeCalendar {
  days: ChequeCalendarDay[]
  unscheduled: ChequeCalendarEntry[]
  scheduledTotalPesewas: number
}

const dayMs = 86_400_000

const toIsoDate = (value: string | null | undefined): string | null => {
  if (!value) return null
  const text = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

const daysBetween = (fromIso: string, toIso: string): number =>
  Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / dayMs)

const isoDaysAgo = (todayIso: string, days: number): string =>
  new Date(Date.parse(todayIso) - days * dayMs).toISOString().slice(0, 10)

/** Outstanding payables grouped by how overdue the invoice due date is. */
export const buildAgingBuckets = (payables: PayableSummary[], todayIso: string): AgingBucket[] => {
  const buckets: AgingBucket[] = [
    { key: 'current', label: 'Current', count: 0, totalPesewas: 0 },
    { key: 'd1_30', label: '1–30 days overdue', count: 0, totalPesewas: 0 },
    { key: 'd31_60', label: '31–60 days overdue', count: 0, totalPesewas: 0 },
    { key: 'd61_90', label: '61–90 days overdue', count: 0, totalPesewas: 0 },
    { key: 'd90_plus', label: '90+ days overdue', count: 0, totalPesewas: 0 },
    { key: 'no_due', label: 'No due date', count: 0, totalPesewas: 0 },
  ]
  const byKey = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket])) as Record<AgingBucket['key'], AgingBucket>
  for (const payable of payables) {
    const outstanding = Number(payable.balancePesewas) || 0
    if (outstanding <= 0) continue
    const dueIso = toIsoDate(payable.dueDate ?? null)
    const bucket = !dueIso
      ? byKey.no_due
      : (() => {
        const overdueDays = daysBetween(dueIso, todayIso)
        if (overdueDays <= 0) return byKey.current
        if (overdueDays <= 30) return byKey.d1_30
        if (overdueDays <= 60) return byKey.d31_60
        if (overdueDays <= 90) return byKey.d61_90
        return byKey.d90_plus
      })()
    bucket.count += 1
    bucket.totalPesewas += outstanding
  }
  return buckets
}

/** Suppliers ranked by outstanding balance, largest first. */
export const buildTopCreditors = (payables: PayableSummary[], topN = 6): CreditorGroup[] => {
  const groups = new Map<string, CreditorGroup>()
  for (const payable of payables) {
    const outstanding = Number(payable.balancePesewas) || 0
    if (outstanding <= 0) continue
    const name = payable.supplierName?.trim() || 'Unnamed supplier'
    const group = groups.get(name) ?? { supplierName: name, count: 0, outstandingPesewas: 0 }
    group.count += 1
    group.outstandingPesewas += outstanding
    groups.set(name, group)
  }
  return [...groups.values()].sort((a, b) => b.outstandingPesewas - a.outstandingPesewas).slice(0, topN)
}

export interface AgingMatrixRow {
  supplierName: string
  count: number
  currentPesewas: number
  d1_30Pesewas: number
  d31_60Pesewas: number
  d61_90Pesewas: number
  d90PlusPesewas: number
  totalPesewas: number
}

export interface AgingMatrix {
  rows: AgingMatrixRow[]
  columnTotals: Omit<AgingMatrixRow, 'supplierName' | 'count'>
}

const bucketForDue = (dueIso: string | null, todayIso: string): keyof Pick<AgingMatrixRow, 'currentPesewas' | 'd1_30Pesewas' | 'd31_60Pesewas' | 'd61_90Pesewas' | 'd90PlusPesewas'> => {
  if (!dueIso) return 'd90PlusPesewas'
  const overdueDays = daysBetween(dueIso, todayIso)
  if (overdueDays <= 0) return 'currentPesewas'
  if (overdueDays <= 30) return 'd1_30Pesewas'
  if (overdueDays <= 60) return 'd31_60Pesewas'
  if (overdueDays <= 90) return 'd61_90Pesewas'
  return 'd90PlusPesewas'
}

/**
 * Classic supplier × bucket aging matrix. Suppliers beyond `topN` are
 * aggregated into an "All other suppliers" row so the table stays readable.
 * Payables with no due date are aged into the oldest bucket — flagged as such
 * in the UI, since an unknown due date must not read as current.
 */
export const buildSupplierAgingMatrix = (payables: PayableSummary[], todayIso: string, topN = 8): AgingMatrix => {
  const rows: AgingMatrixRow[] = []
  const bySupplier = new Map<string, AgingMatrixRow>()
  const emptyRow = (supplierName: string): AgingMatrixRow => ({
    supplierName,
    count: 0,
    currentPesewas: 0,
    d1_30Pesewas: 0,
    d31_60Pesewas: 0,
    d61_90Pesewas: 0,
    d90PlusPesewas: 0,
    totalPesewas: 0,
  })
  for (const payable of payables) {
    const outstanding = Number(payable.balancePesewas) || 0
    if (outstanding <= 0) continue
    const name = payable.supplierName?.trim() || 'Unnamed supplier'
    const row = bySupplier.get(name) ?? emptyRow(name)
    const bucket = bucketForDue(toIsoDate(payable.dueDate ?? null), todayIso)
    row[bucket] += outstanding
    row.totalPesewas += outstanding
    row.count += 1
    bySupplier.set(name, row)
  }
  const sorted = [...bySupplier.values()].sort((a, b) => b.totalPesewas - a.totalPesewas)
  if (sorted.length > topN) {
    const others = sorted.slice(topN).reduce((acc, row) => {
      acc.currentPesewas += row.currentPesewas
      acc.d1_30Pesewas += row.d1_30Pesewas
      acc.d31_60Pesewas += row.d31_60Pesewas
      acc.d61_90Pesewas += row.d61_90Pesewas
      acc.d90PlusPesewas += row.d90PlusPesewas
      acc.totalPesewas += row.totalPesewas
      acc.count += row.count
      return acc
    }, emptyRow('All other suppliers'))
    rows.push(...sorted.slice(0, topN), others)
  } else {
    rows.push(...sorted)
  }
  const columnTotals = rows.reduce((acc, row) => {
    acc.currentPesewas += row.currentPesewas
    acc.d1_30Pesewas += row.d1_30Pesewas
    acc.d31_60Pesewas += row.d31_60Pesewas
    acc.d61_90Pesewas += row.d61_90Pesewas
    acc.d90PlusPesewas += row.d90PlusPesewas
    acc.totalPesewas += row.totalPesewas
    return acc
  }, { currentPesewas: 0, d1_30Pesewas: 0, d31_60Pesewas: 0, d61_90Pesewas: 0, d90PlusPesewas: 0, totalPesewas: 0 })
  return { rows, columnTotals }
}

export interface MethodTableRow {
  label: string
  count: number
  totalPesewas: number
  sharePercent: number
}

/** Payments grouped by method with counts and share of total paid. */
export const buildMethodTable = (payments: PayablePaymentEntry[]): MethodTableRow[] => {
  const groups = new Map<string, { count: number; totalPesewas: number }>()
  let grandTotal = 0
  for (const payment of payments) {
    const label = payment.paymentMethodName || payment.paymentMethod || 'Other'
    const amountPesewas = Number(payment.amountPesewas) || 0
    const group = groups.get(label) ?? { count: 0, totalPesewas: 0 }
    group.count += 1
    group.totalPesewas += amountPesewas
    grandTotal += amountPesewas
    groups.set(label, group)
  }
  return [...groups.entries()]
    .map(([label, group]) => ({
      label,
      count: group.count,
      totalPesewas: group.totalPesewas,
      sharePercent: grandTotal > 0 ? Math.round((group.totalPesewas / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.totalPesewas - a.totalPesewas)
}

const isoWeekLabel = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  // ISO week starts Monday; shift so weeks group as YYYY-MM-DD of the Monday.
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - (day - 1))
  return date.toISOString().slice(0, 10)
}

/** Payment outflow grouped per ISO week (oldest first). */
export const buildOutflowSeries = (payments: PayablePaymentEntry[]): SeriesPoint[] => {
  const groups = new Map<string, number>()
  for (const payment of payments) {
    const iso = toIsoDate(payment.postedAt)
    if (!iso) continue
    const label = isoWeekLabel(iso)
    groups.set(label, (groups.get(label) ?? 0) + (Number(payment.amountPesewas) || 0))
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, value]) => ({ label, value }))
}

/** Payment outflow split by payment method, largest first. */
export const buildMethodMix = (payments: PayablePaymentEntry[]): SeriesPoint[] => {
  const groups = new Map<string, number>()
  for (const payment of payments) {
    const label = payment.paymentMethodName || payment.paymentMethod || 'Other'
    groups.set(label, (groups.get(label) ?? 0) + (Number(payment.amountPesewas) || 0))
  }
  return [...groups.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Cheque outflow calendar. Uses `expected_clearance_date` when recorded;
 * falls back to the cheque issue date flagged `estimated`; payments with
 * neither date land in the unscheduled bucket.
 */
export const buildChequeCalendar = (payments: PayablePaymentEntry[]): ChequeCalendar => {
  const dayMap = new Map<string, ChequeCalendarDay>()
  const unscheduled: ChequeCalendarEntry[] = []
  let scheduledTotalPesewas = 0
  for (const payment of payments) {
    const isChequePayment = [payment.paymentMethod, payment.paymentMethodName]
      .some((value) => String(value || '').toLowerCase().includes('cheque'))
    if (!isChequePayment) continue
    const amountPesewas = Number(payment.amountPesewas) || 0
    const detailValue = (key: string): string | null => {
      const fromDetails = toIsoDate(payment.details?.[key] ?? null)
      if (fromDetails) return fromDetails
      const field = payment.fields?.find((candidate) => candidate.key === key)
      return field ? toIsoDate(field.value) : null
    }
    const chequeNumber = payment.details?.cheque_number
      ?? payment.fields?.find((candidate) => candidate.key === 'cheque_number')?.value
      ?? ''
    const clearance = detailValue('expected_clearance_date')
    const issue = detailValue('cheque_date')
    const entry: ChequeCalendarEntry = {
      payment,
      chequeNumber,
      date: clearance ?? issue ?? '',
      estimated: !clearance && Boolean(issue),
    }
    if (!entry.date) {
      unscheduled.push(entry)
      continue
    }
    scheduledTotalPesewas += amountPesewas
    const day = dayMap.get(entry.date) ?? {
      date: entry.date,
      estimated: true,
      entries: [],
      totalPesewas: 0,
    }
    day.entries.push(entry)
    day.totalPesewas += amountPesewas
    // A day is "estimated" when any entry on it lacks a recorded clearance date.
    day.estimated = day.entries.some((candidate) => candidate.estimated)
    dayMap.set(entry.date, day)
  }
  const days = [...dayMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
  return { days, unscheduled, scheduledTotalPesewas }
}

/** Scheduled cheque outflow within the next `days` days, in pesewas. */
export const sumScheduledWithinDays = (calendar: ChequeCalendar, todayIso: string, days: number): number =>
  calendar.days.reduce((total, day) => {
    const date = day.date
    return date >= todayIso && date <= isoDaysAgo(todayIso, -days) ? total + day.totalPesewas : total
  }, 0)

/* ------------------------------------------------------------------ */
/* Composable — fetches data and exposes reactive aggregations.        */
/* ------------------------------------------------------------------ */

export const usePayablesReports = () => {
  const service = createAccountsService(useApi())
  const isLoading = ref(false)
  const error = ref('')
  const payables = ref<PayableSummary[]>([])
  const payments = ref<PayablePaymentEntry[]>([])
  const accounts = ref<AccountSummary[]>([])

  const totalBalance = computed(() =>
    accounts.value.reduce((total, account) => total + (Number(account.currentBalance) || 0), 0),
  )

  const load = async ({ silent = false }: { silent?: boolean } = {}): Promise<boolean> => {
    if (!silent) isLoading.value = true
    error.value = ''
    try {
      // Page through the full payables list ( unsettled only is not enough:
      // aging needs every outstanding invoice, and pagination caps at 100 ).
      const collected: PayableSummary[] = []
      const pageSize = 100
      for (let offset = 0; offset < 5_000; offset += pageSize) {
        const page = await service.listPayables({ limit: pageSize, offset })
        collected.push(...(page.data?.items ?? []))
        if (!page.data?.pagination?.hasNext) break
      }
      const paymentsPage = await service.listPayablePayments()
      const accountsEnvelope = await service.listAccounts()
      payables.value = collected
      payments.value = paymentsPage.data?.payments ?? []
      accounts.value = accountsEnvelope.data ?? []
      return true
    } catch (fetchError: unknown) {
      if (isSessionError(fetchError)) {
        error.value = sessionExpiredMessage
      } else {
        error.value = fetchError instanceof Error ? fetchError.message : 'Failed to load reports'
      }
      return false
    } finally {
      if (!silent) isLoading.value = false
    }
  }

  return {
    accounts,
    error,
    isLoading,
    load,
    payables,
    payments,
    totalBalance,
  }
}
