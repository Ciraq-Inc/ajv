import { describe, expect, it } from 'vitest'
import type { PayableSummary } from '../services/types'
import { payablesForView } from '../utils/payables'

const payable = (overrides: Partial<PayableSummary>): PayableSummary => ({
  id: 'payable-1',
  source: 'store',
  invoiceId: 'invoice-1',
  orderId: 'order-1',
  supplierId: 'supplier-1',
  supplierName: 'Supplier',
  supplierInvoiceNo: 'INV-001',
  invoiceAmountPesewas: 10000,
  amountPaidPesewas: 0,
  balancePesewas: 10000,
  lastConfirmedPaidPesewas: 0,
  paymentMethod: '',
  paymentStatus: '',
  syncStatus: 'current',
  paymentConfirmationStatus: 'unconfirmed',
  paymentActionStatus: '',
  lifecycle: 'to_pay',
  reconciliationReason: '',
  recordedBy: '',
  ...overrides,
})

describe('payablesForView', () => {
  it('shows attention records regardless of the selected lifecycle tab', () => {
    const attention = payable({ id: 'attention', lifecycle: 'attention', paymentActionStatus: 'failed' })
    const readyToPay = payable({ id: 'ready' })

    expect(payablesForView([attention, readyToPay], 'settled', true)).toEqual([attention])
  })

  it('keeps normal lifecycle tabs separate when attention is off', () => {
    const awaiting = payable({ id: 'awaiting', lifecycle: 'awaiting', paymentActionStatus: 'pending' })
    const settled = payable({ id: 'settled', lifecycle: 'settled', balancePesewas: 0, paymentConfirmationStatus: 'corroborated' })

    expect(payablesForView([awaiting, settled], 'awaiting', false)).toEqual([awaiting])
    expect(payablesForView([awaiting, settled], 'settled', false)).toEqual([settled])
  })

  it('treats a zero-balance invoice as settled even when confirmation metadata is unconfirmed', () => {
    const settledByBalance = payable({ id: 'settled-by-balance', lifecycle: 'settled', balancePesewas: 0 })

    expect(payablesForView([settledByBalance], 'settled', false)).toEqual([settledByBalance])
    expect(payablesForView([settledByBalance], 'awaiting', false)).toEqual([])
  })
})
