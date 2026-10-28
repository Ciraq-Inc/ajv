import type { LedgerEntry } from '~/services/types'
import { formatAmount } from '~/utils/money'

// How a money-account ledger row is read, filtered and worded. Pure on purpose: the account page
// keeps only the refs and wiring, so these rules can be checked without mounting a 2,000-line page.

export type SourceLabels = Record<string, string>

export interface LedgerFilters {
  query: string
  direction: 'all' | 'in' | 'out'
  fromDate: string
  toDate: string
  method: string
  status: string
}

const SPACES = /\s+/g

export const normaliseText = (value: unknown): string => String(value ?? '').replace(SPACES, ' ').trim()

export const paymentMethodLabel = (method: string): string =>
  method.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())

export const statusLabel = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())

export const formatLedgerAmount = (value: number | null | undefined): string => formatAmount(value)

export const sourceLabel = (source: string, labels: SourceLabels): string =>
  labels[source] || source.replace(/_/g, ' ')

export const ledgerPaymentAllocations = (entry: LedgerEntry) => entry.paymentAllocations || []

export const canShowLedgerPaymentMethod = (entry: LedgerEntry): boolean =>
  Boolean(entry.moneyIn) && ['sales', 'credit_payment', 'cheque', 'manual'].includes(entry.source)

const methodKeyOf = (value: unknown): string => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

export const ledgerMethodValues = (entry: LedgerEntry): string[] => {
  if (!canShowLedgerPaymentMethod(entry)) return []
  const allocationMethods = (entry.paymentAllocations || [])
    .map((allocation) => methodKeyOf(allocation.methodKey || allocation.methodName))
    .filter(Boolean)
  // `method` was historically populated with the account type (for example `bank`) rather than
  // the way the movement was paid. Payment methods now come from allocations or movement
  // metadata, so never expose the legacy account identity as a payment-method filter.
  const metadataMethod = methodKeyOf(entry.metadata?.paymentMethod)
  return [...new Set([...allocationMethods, metadataMethod].filter(Boolean))]
}

export const ledgerPaymentMethodOptions = (entries: LedgerEntry[]): string[] => {
  const methods = new Set<string>()
  entries.forEach((entry) => ledgerMethodValues(entry).forEach((method) => methods.add(method)))
  return [...methods].sort()
}

export const ledgerSourceLabel = (entry: LedgerEntry, labels: SourceLabels): string => {
  const allocations = ledgerPaymentAllocations(entry)
  if (allocations.length) return allocations.map((allocation) => allocation.methodName).join(' · ')
  return entry.metadata?.creditSourceLabel || sourceLabel(entry.source, labels)
}

export const ledgerDescription = (entry: LedgerEntry): string => normaliseText(entry.description || entry.recipient || '')

export const ledgerRecipient = (entry: LedgerEntry): string => normaliseText(entry.recipient || entry.description || '')

export const ledgerPaymentMethodDisplay = (entry: LedgerEntry): string => {
  if (entry.paymentContext?.methodName) {
    return [entry.paymentContext.methodName, entry.paymentContext.subtypeName].filter(Boolean).join(' · ')
  }
  if (!canShowLedgerPaymentMethod(entry)) return ''
  const allocations = ledgerPaymentAllocations(entry)
  if (allocations.length) return allocations.map((allocation) => allocation.methodName).join(' · ')
  const method = ledgerMethodValues(entry)[0] || ''
  return method ? paymentMethodLabel(method) : ''
}

export const ledgerSourceDetail = (entry: LedgerEntry, labels: SourceLabels): string => {
  const allocations = ledgerPaymentAllocations(entry)
  if (!canShowLedgerPaymentMethod(entry)) return ''
  if (allocations.some((allocation) => Number(allocation.amount) > 0)) {
    return allocations.map((allocation) => `${allocation.methodName} ${formatLedgerAmount(allocation.amount)}`).join(' · ')
  }
  if (allocations.length) return ''
  if (entry.metadata?.paymentMethodSummary) return entry.metadata.paymentMethodSummary
  const method = ledgerMethodValues(entry)[0] || ''
  if (!method) return ''
  const detail = paymentMethodLabel(method)
  return detail.toLowerCase() === ledgerSourceLabel(entry, labels).trim().toLowerCase() ? '' : detail
}

const METADATA_LABELS: Record<string, string> = {
  cashierName: 'Cashier',
  shiftName: 'Shift',
  branchName: 'Branch',
  customerName: 'Customer',
  supplierName: 'Supplier',
  lenderName: 'Lender',
  bankName: 'Bank',
  drawerName: 'Drawer',
  chequeNumber: 'Cheque number',
  receivedDate: 'Received date',
  expectedClearanceDate: 'Expected clearance',
  invoiceId: 'Invoice',
  supplierInvoiceNo: 'Supplier invoice',
  orderId: 'Order',
  settlementId: 'Settlement',
  tel: 'Phone',
  paymentReferences: 'Payment references',
  paymentMethodSummary: 'Payment breakdown',
  saleCount: 'Sales included',
  allocationCount: 'Payment allocations',
}

export const ledgerAdditionalDetails = (entry: LedgerEntry) => Object.entries(entry.metadata || {})
  .filter(([key, value]) => {
    if (!METADATA_LABELS[key] || !String(value || '').trim()) return false
    // The breakdown is only worth a line when the allocations don't already say it.
    return key !== 'paymentMethodSummary' || ledgerPaymentAllocations(entry).length === 0
  })
  .map(([key, value]) => ({ key, label: METADATA_LABELS[key] || key, value: String(value).trim() }))

export const ledgerTableDate = (entry: LedgerEntry): string => entry.date?.slice(0, 10) || '—'

const dateAtMidnight = (value: string): Date => new Date(`${value}T00:00:00`)

export const ledgerDateGroupLabel = (value: string, now: Date = new Date()): string => {
  if (!value) return 'Undated entries'
  const date = dateAtMidnight(value)
  if (Number.isNaN(date.getTime())) return value
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date)
}

const longDate = (date: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)

export const ledgerDateGroupDate = (value: string): string => {
  if (!value) return ''
  const date = dateAtMidnight(value)
  return Number.isNaN(date.getTime()) ? value : longDate(date)
}

export const shortDateFromText = (value: string): string => {
  const match = value.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (!match) return ''
  const date = dateAtMidnight(match[0])
  return Number.isNaN(date.getTime()) ? match[0] : longDate(date)
}

export const shortenLedgerText = (value: string, maxLength = 58): string => {
  const normalized = normaliseText(value)
  if (normalized.length <= maxLength) return normalized
  const words = normalized.slice(0, maxLength - 1).trimEnd().split(' ')
  words.pop()
  return `${words.join(' ')}...`
}

export const ledgerEntrySummary = (entry: LedgerEntry, labels: SourceLabels): string => {
  const description = ledgerRecipient(entry) || ledgerSourceLabel(entry, labels)
  const date = shortDateFromText(description)
  if (entry.source === 'sales' && date) {
    const descriptionMethod = description.match(/^(.+?)\s+sales collection\s+for\b/i)?.[1]
    const method = descriptionMethod || entry.metadata?.paymentMethod
    return `${method ? paymentMethodLabel(method) : 'Sales'} sales · ${date}`
  }
  if (entry.source === 'credit_payment' && date) return `Credit payment · ${date}`
  if (entry.source === 'cheque' && date) return `Cheque receipt · ${date}`
  return shortenLedgerText(description)
}

export const ledgerReferenceLabel = (entry: LedgerEntry): string => normaliseText(entry.reference) || 'No reference'

export const ledgerReferenceDisplay = (entry: LedgerEntry): string => {
  const reference = ledgerReferenceLabel(entry)
  if (reference.length <= 26) return reference
  return `${reference.slice(0, 15).trimEnd()}…${reference.slice(-9).trimStart()}`
}

/** The rows the ledger table shows: reversal rows are hidden (the original row carries the status). */
export const filterLedger = (entries: LedgerEntry[], filters: LedgerFilters, labels: SourceLabels): LedgerEntry[] => {
  const query = filters.query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (entry.source === 'reversal') return false
    const entryDate = entry.date?.slice(0, 10) || ''
    const directionMatches = filters.direction === 'all' || (filters.direction === 'in' ? Boolean(entry.moneyIn) : Boolean(entry.moneyOut))
    const dateMatches = (!filters.fromDate || entryDate >= filters.fromDate) && (!filters.toDate || entryDate <= filters.toDate)
    const methodMatches = filters.method === 'all' || ledgerMethodValues(entry).includes(filters.method)
    const statusMatches = filters.status === 'all' || entry.status === filters.status
    if (!directionMatches || !dateMatches || !methodMatches || !statusMatches) return false
    if (!query) return true
    return [entry.reference, entry.enteredBy, ...ledgerMethodValues(entry), ledgerSourceLabel(entry, labels), entry.metadata?.context, statusLabel(entry.status)]
      .filter(Boolean).join(' ').toLowerCase().includes(query)
  })
}

export const groupLedgerByDate = (entries: LedgerEntry[]): Array<{ date: string, entries: LedgerEntry[] }> => {
  const groups: Array<{ date: string, entries: LedgerEntry[] }> = []
  entries.forEach((entry) => {
    const date = entry.date?.slice(0, 10) || ''
    const current = groups[groups.length - 1]
    if (current && current.date === date) current.entries.push(entry)
    else groups.push({ date, entries: [entry] })
  })
  return groups
}
