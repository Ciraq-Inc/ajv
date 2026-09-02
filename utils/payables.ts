import type { PayableSummary } from '../services/types'

export type PayableTab = 'to_pay' | 'awaiting' | 'settled' | 'ledger' | 'reports'
export type PayableLifecycle = 'to_pay' | 'awaiting' | 'settled' | 'attention'

export const payableAmount = (payable: PayableSummary): number => Number(payable.balancePesewas || 0)

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
