import { describe, expect, it } from 'vitest'
import type { PayableSummary } from '../services/types'
import {
  allocateBatchPayment, canPayPayable, chequeReleaseDate, cleanDetailValues, detailValidationMessage, hasScheduledCheque,
  ledgerSyncLabel, payableAmount, payableLifecycleLabel, payablesForView, pendingPaymentAmount, pendingPaymentStatus,
  postDatedUntil,
} from '../utils/payables'

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

describe('allocateBatchPayment', () => {
  const owing = (id: string, balancePesewas: number, dueDate?: string) => payable({ id, balancePesewas, ...(dueDate ? { dueDate } : {}) })

  it('pays the oldest due invoice first and stops when the money runs out', () => {
    const rows = allocateBatchPayment([
      owing('b', 5000, '2026-09-20'), owing('a', 4000, '2026-09-01'), owing('c', 6000, '2026-10-01'),
    ], 7000)
    expect(rows.map((r) => [r.payable.id, r.allocationPesewas, r.afterPesewas])).toEqual([
      ['a', 4000, 0], ['b', 3000, 2000], ['c', 0, 6000],
    ])
  })

  it('never allocates more than the amount, or more than an invoice owes', () => {
    const rows = allocateBatchPayment([owing('a', 1000, '2026-09-01'), owing('b', 1000, '2026-09-02')], 50000)
    expect(rows.map((r) => r.allocationPesewas)).toEqual([1000, 1000])
    expect(allocateBatchPayment([owing('a', 1000)], 0)[0]!.allocationPesewas).toBe(0)
    expect(allocateBatchPayment([owing('a', 1000)], -300)[0]!.allocationPesewas).toBe(0)
  })

  it('puts invoices with no usable date last and orders ties by id', () => {
    const rows = allocateBatchPayment([owing('10', 100), owing('9', 100), owing('1', 100, '2026-01-01'), owing('x', 100, 'not a date')], 1000)
    expect(rows.map((r) => r.payable.id)).toEqual(['1', '9', '10', 'x'])
  })
})

describe('payment details', () => {
  it('drops blank values and trims the rest', () => {
    expect(cleanDetailValues({ account: ' 123 ', note: '   ', ref: '' })).toEqual({ account: '123' })
  })

  it('names the first required detail that is missing', () => {
    const fields = [{ key: 'a', label: 'Account number', required: true }, { key: 'b', label: 'Note' }]
    expect(detailValidationMessage(fields, { a: ' ' })).toBe('Account number is required.')
    expect(detailValidationMessage(fields, { a: '1' })).toBe('')
  })
})

describe('where a payment is on its way to the POS', () => {
  it('counts the queued action, else what was recorded beyond what the POS confirmed', () => {
    expect(pendingPaymentAmount(payable({ paymentActionAmountPesewas: 2500 }))).toBe(25)
    expect(pendingPaymentAmount(payable({ amountPaidPesewas: 3000, lastConfirmedPaidPesewas: 1000 }))).toBe(20)
    expect(pendingPaymentAmount(payable({ amountPaidPesewas: 500, lastConfirmedPaidPesewas: 1000 }))).toBe(0)
  })

  it.each([
    [{ paymentActionStatus: 'pending' }, 'Needs Sync Inventory'],
    [{ paymentActionStatus: 'leased' }, 'Needs Sync Inventory'],
    [{ paymentActionStatus: 'acknowledged' }, 'Confirming'],
    [{ paymentConfirmationStatus: 'acknowledged' as const }, 'Confirming'],
    [{ paymentActionStatus: '' }, 'Awaiting confirmation'],
  ])('%j reads as %s', (over, label) => {
    expect(pendingPaymentStatus(payable(over))).toBe(label)
  })

  it('says how far the payment has got in the ledger', () => {
    expect(ledgerSyncLabel({ paymentActionStatus: 'corroborated' })).toBe('Confirmed by RigelOS')
    expect(ledgerSyncLabel({ paymentConfirmationStatus: 'acknowledged' })).toBe('Payment recorded · awaiting invoice confirmation')
    expect(ledgerSyncLabel({ paymentActionStatus: 'failed' })).toBe('Payment needs attention')
    expect(ledgerSyncLabel({})).toBe('Payment recorded')
  })

  it('only lets an invoice that is ready to pay and has a balance be paid', () => {
    expect(canPayPayable(payable({}))).toBe(true)
    expect(canPayPayable(payable({ balancePesewas: 0 }))).toBe(false)
    expect(canPayPayable(payable({ lifecycle: 'awaiting' }))).toBe(false)
    expect(payableLifecycleLabel(payable({ lifecycle: 'attention' }))).toBe('Needs attention')
  })
})

describe('post-dated cheques', () => {
  it('uses the later of the cheque date and the clearance date as the release date', () => {
    expect(chequeReleaseDate({ cheque_date: '2026-11-01', expected_clearance_date: '2026-11-03' })).toBe('2026-11-03')
    expect(chequeReleaseDate({ cheque_date: '2026-11-05' })).toBe('2026-11-05')
    expect(chequeReleaseDate({ cheque_date: 'soon' })).toBe('')
  })

  it('only holds a cheque dated after today, and only for the cheque method', () => {
    expect(postDatedUntil('cheque', { cheque_date: '2026-10-28' }, '2026-10-27')).toBe('2026-10-28')
    expect(postDatedUntil('cheque', { cheque_date: '2026-10-27' }, '2026-10-27')).toBe('')
    expect(postDatedUntil('cheque', {}, '2026-10-27')).toBe('')
    expect(postDatedUntil('cash', { cheque_date: '2026-12-01' }, '2026-10-27')).toBe('')
  })

  it('leaves out the part of an invoice already covered by a held cheque', () => {
    const held = payable({ balancePesewas: 10000, scheduledPesewas: 4000 })
    expect(hasScheduledCheque(held)).toBe(true)
    expect(payableAmount(held)).toBe(6000)
    expect(payableAmount(payable({ balancePesewas: 10000, scheduledPesewas: 10000 }))).toBe(0)
    expect(hasScheduledCheque(payable({}))).toBe(false)
  })
})
