import type { PayableSummary } from '../services/types'

export type PayableTab = 'to_pay' | 'awaiting' | 'settled' | 'ledger' | 'reports'
export type PayableLifecycle = 'to_pay' | 'awaiting' | 'settled' | 'attention'

/** What can still be paid now: the balance less any post-dated cheque already held against it. */
export const payableAmount = (payable: PayableSummary): number =>
  Math.max(0, Number(payable.balancePesewas || 0) - Number(payable.scheduledPesewas || 0))

/** True when a cheque is parked against this invoice waiting for its date. */
export const hasScheduledCheque = (payable: PayableSummary): boolean => Number(payable.scheduledPesewas || 0) > 0

/** Date a cheque written for `details` stops being post-dated: the later of cheque date and clearance date. */
export const chequeReleaseDate = (details: Record<string, string>): string => {
  const dates = ['cheque_date', 'expected_clearance_date']
    .map((key) => String(details[key] || '').trim())
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()
  return dates.length ? dates[dates.length - 1] : ''
}

/** The cheque date when it is still in the future, otherwise ''. */
export const postDatedUntil = (methodKey: string | undefined, details: Record<string, string>, today = new Date().toISOString().slice(0, 10)): string => {
  if (methodKey !== 'cheque') return ''
  const release = chequeReleaseDate(details)
  return release > today ? release : ''
}

export const needsAttention = (payable: PayableSummary): boolean => payable.lifecycle === 'attention'

export const payableLifecycle = (payable: PayableSummary): PayableLifecycle => payable.lifecycle

export const payablesForView = (
  payables: PayableSummary[],
  activeTab: PayableTab,
  attentionOnly: boolean,
): PayableSummary[] => {
  if (attentionOnly) return payables.filter(needsAttention)
  return payables.filter((payable) => payableLifecycle(payable) === activeTab)
}

// ---- Paying several invoices at once -------------------------------------------------------

/** Oldest due date first; invoices with no usable date go last. */
export const batchAllocationDate = (payable: PayableSummary): number => {
  const value = payable.dueDate || payable.invoiceDate
  if (!value) return Number.POSITIVE_INFINITY
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

export interface BatchAllocationRow {
  payable: PayableSummary
  balancePesewas: number
  allocationPesewas: number
  afterPesewas: number
}

/** Spreads one payment over the chosen invoices, oldest first, never past an invoice's balance. */
export const allocateBatchPayment = (payables: PayableSummary[], amountPesewas: number): BatchAllocationRow[] => {
  let remaining = amountPesewas
  const ordered = [...payables].sort((left, right) => {
    const dateDifference = batchAllocationDate(left) - batchAllocationDate(right)
    return dateDifference || String(left.id).localeCompare(String(right.id), undefined, { numeric: true })
  })
  return ordered.map((payable) => {
    const balancePesewas = payableAmount(payable)
    const allocationPesewas = Math.min(balancePesewas, Math.max(remaining, 0))
    remaining -= allocationPesewas
    return { payable, balancePesewas, allocationPesewas, afterPesewas: balancePesewas - allocationPesewas }
  })
}

// ---- Payment details -----------------------------------------------------------------------

export const cleanDetailValues = (values: Record<string, string>): Record<string, string> =>
  Object.entries(values).reduce<Record<string, string>>((result, [key, value]) => {
    const safeValue = String(value || '').trim()
    if (safeValue) result[key] = safeValue
    return result
  }, {})

export const detailValidationMessage = (
  fields: Array<{ key: string, label: string, required?: boolean }>,
  values: Record<string, string>,
): string => {
  const missing = fields.find((field) => field.required && !String(values[field.key] || '').trim())
  return missing ? `${missing.label} is required.` : ''
}

// ---- Where a payment is on its way to the POS ----------------------------------------------

/** The amount waiting to reach the POS: the queued action, else what was recorded here beyond what the POS confirmed. */
export const pendingPaymentAmount = (payable: PayableSummary): number => {
  const actionAmount = Number(payable.paymentActionAmountPesewas || 0)
  if (actionAmount > 0) return actionAmount / 100
  const locallyRecorded = Math.max(0, Number(payable.amountPaidPesewas || 0) - Number(payable.lastConfirmedPaidPesewas || 0))
  return locallyRecorded / 100
}

export const pendingPaymentNeedsSync = (payable: PayableSummary): boolean =>
  ['pending', 'leased'].includes(payable.paymentActionStatus || '')

export const pendingPaymentStatus = (payable: PayableSummary): string => {
  if (pendingPaymentNeedsSync(payable)) return 'Needs Sync Inventory'
  if (payable.paymentActionStatus === 'acknowledged' || payable.paymentConfirmationStatus === 'acknowledged') return 'Confirming'
  return 'Awaiting confirmation'
}

export const payableLifecycleLabel = (payable: PayableSummary): string =>
  ({ attention: 'Needs attention', to_pay: 'Ready to pay', awaiting: 'Awaiting sync', settled: 'Settled' }[payableLifecycle(payable)])

export const canPayPayable = (payable: PayableSummary): boolean =>
  payableLifecycle(payable) === 'to_pay' && payableAmount(payable) > 0

type LedgerSyncFields = {
  paymentActionStatus?: string | null
  paymentConfirmationStatus?: string | null
}

export const ledgerSyncLabel = (entry: LedgerSyncFields): string => {
  if (entry.paymentActionStatus === 'corroborated' || entry.paymentConfirmationStatus === 'corroborated') return 'Confirmed by RigelOS'
  if (entry.paymentActionStatus === 'acknowledged' || entry.paymentConfirmationStatus === 'acknowledged') return 'Payment recorded · awaiting invoice confirmation'
  if (entry.paymentActionStatus === 'failed') return 'Payment needs attention'
  return 'Payment recorded'
}
