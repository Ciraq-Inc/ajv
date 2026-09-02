import { describe, expect, it } from 'vitest'
import type { PayablePaymentEntry, PayableSummary } from '../services/types'
// Static import doubles as an SFC compile check for the reports panel.
import PayablesReportsPanel from '../components/payables/ReportsPanel.vue'
import {
  buildAgingBuckets,
  buildChequeCalendar,
  buildMethodTable,
  buildOutflowSeries,
  buildSupplierAgingMatrix,
  buildTopCreditors,
  sumScheduledWithinDays,
} from '../composables/usePayablesReports'

describe('payables reports panel', () => {
  it('compiles', () => {
    expect(PayablesReportsPanel).toBeTruthy()
  })
})

const TODAY = '2026-09-01'

const payable = (overrides: Partial<PayableSummary> = {}): PayableSummary => ({
  id: 'p1',
  source: 'store',
  invoiceId: 'inv-1',
  orderId: 'ord-1',
  supplierId: 'sup-1',
  supplierName: 'Supplier One',
  supplierInvoiceNo: 'SINV-1',
  invoiceAmountPesewas: 100_000,
  amountPaidPesewas: 0,
  balancePesewas: 100_000,
  lastConfirmedPaidPesewas: 0,
  paymentMethod: '',
  paymentStatus: '',
  syncStatus: 'current',
  paymentConfirmationStatus: 'unconfirmed',
  lifecycle: 'to_pay',
  ...overrides,
} as PayableSummary)

const payment = (overrides: Partial<PayablePaymentEntry> = {}): PayablePaymentEntry => ({
  id: 'pay-1',
  payableId: 'p1',
  supplierName: 'Supplier One',
  supplierInvoiceNo: 'SINV-1',
  dueDate: null,
  paymentMethod: 'cheque',
  paymentMethodName: 'Cheque',
  amount: 250,
  amountPesewas: 25_000,
  postedAt: '2026-08-20T10:00:00Z',
  enteredBy: null,
  reference: null,
  fields: [],
  details: {},
  ...overrides,
})

describe('buildAgingBuckets', () => {
  it('buckets by overdue days and skips settled payables', () => {
    const buckets = buildAgingBuckets(
      [
        payable({ id: 'a', dueDate: '2026-09-10', balancePesewas: 50_000 }), // current
        payable({ id: 'b', dueDate: '2026-08-10', balancePesewas: 20_000 }), // 22 days overdue
        payable({ id: 'c', dueDate: '2026-06-01', balancePesewas: 10_000 }), // 92 days
        payable({ id: 'd', balancePesewas: 0 }), // settled → ignored
        payable({ id: 'e', balancePesewas: 5_000 }), // no due date
      ],
      TODAY,
    )
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]))
    expect(byKey.current).toMatchObject({ count: 1, totalPesewas: 50_000 })
    expect(byKey.d1_30).toMatchObject({ count: 1, totalPesewas: 20_000 })
    expect(byKey.d90_plus).toMatchObject({ count: 1, totalPesewas: 10_000 })
    expect(byKey.no_due).toMatchObject({ count: 1, totalPesewas: 5_000 })
    expect(byKey.d31_60).toMatchObject({ count: 0, totalPesewas: 0 })
  })
})

describe('buildSupplierAgingMatrix', () => {
  it('builds supplier rows per bucket with column totals', () => {
    const matrix = buildSupplierAgingMatrix(
      [
        payable({ id: 'a', supplierName: 'Alpha', dueDate: '2026-09-10', balancePesewas: 50_000 }),
        payable({ id: 'b', supplierName: 'Alpha', dueDate: '2026-08-01', balancePesewas: 30_000 }),
        payable({ id: 'c', supplierName: 'Beta', dueDate: '2026-04-01', balancePesewas: 70_000 }),
      ],
      TODAY,
    )
    expect(matrix.rows[0]).toMatchObject({
      supplierName: 'Alpha',
      count: 2,
      currentPesewas: 50_000,
      d31_60Pesewas: 30_000,
      totalPesewas: 80_000,
    })
    expect(matrix.columnTotals).toMatchObject({ currentPesewas: 50_000, d31_60Pesewas: 30_000, d90PlusPesewas: 70_000, totalPesewas: 150_000 })
  })

  it('ages payables without a due date into the oldest bucket and aggregates beyond topN', () => {
    const matrix = buildSupplierAgingMatrix(
      [
        payable({ id: 'a', supplierName: 'A', balancePesewas: 10_000 }),
        payable({ id: 'b', supplierName: 'B', balancePesewas: 20_000 }),
        payable({ id: 'c', supplierName: 'C', balancePesewas: 30_000 }),
      ],
      TODAY,
      2,
    )
    expect(matrix.rows[0]).toMatchObject({ supplierName: 'C', totalPesewas: 30_000 })
    expect(matrix.rows[2]).toMatchObject({ supplierName: 'All other suppliers', d90PlusPesewas: 10_000, count: 1 })
    expect(matrix.columnTotals.totalPesewas).toBe(60_000)
  })
})

describe('buildMethodTable', () => {
  it('counts payments per method with share of total', () => {
    const table = buildMethodTable([
      payment({ id: '1', paymentMethod: 'cash', paymentMethodName: 'Cash', amountPesewas: 75_000 }),
      payment({ id: '2', paymentMethod: 'cheque', paymentMethodName: 'Cheque', amountPesewas: 20_000 }),
      payment({ id: '3', paymentMethod: 'cheque', paymentMethodName: 'Cheque', amountPesewas: 5_000 }),
    ])
    expect(table[0]).toMatchObject({ label: 'Cash', count: 1, totalPesewas: 75_000, sharePercent: 75 })
    expect(table[1]).toMatchObject({ label: 'Cheque', count: 2, totalPesewas: 25_000, sharePercent: 25 })
  })
})

describe('buildTopCreditors', () => {
  it('groups by supplier and sorts by outstanding', () => {
    const groups = buildTopCreditors([
      payable({ supplierName: 'Beta', balancePesewas: 10_000 }),
      payable({ supplierName: 'Alpha', balancePesewas: 40_000 }),
      payable({ supplierName: 'Alpha', balancePesewas: 20_000 }),
      payable({ supplierName: 'Settled', balancePesewas: 0 }),
    ])
    expect(groups[0]).toMatchObject({ supplierName: 'Alpha', count: 2, outstandingPesewas: 60_000 })
    expect(groups).toHaveLength(2)
  })
})

describe('buildOutflowSeries', () => {
  it('groups payments into ISO weeks in order', () => {
    // 2026-08-17 and 2026-08-19 are both ISO week starting Mon 2026-08-17.
    const series = buildOutflowSeries([
      payment({ id: '1', postedAt: '2026-08-19T09:00:00Z', amountPesewas: 10_000 }),
      payment({ id: '2', postedAt: '2026-08-17T09:00:00Z', amountPesewas: 5_000 }),
      payment({ id: '3', postedAt: '2026-08-24T09:00:00Z', amountPesewas: 7_000 }),
    ])
    expect(series).toEqual([
      { label: '2026-08-17', value: 15_000 },
      { label: '2026-08-24', value: 7_000 },
    ])
  })
})

describe('buildChequeCalendar', () => {
  it('does not treat non-cheque supplier payments as missing-date cheques', () => {
    const calendar = buildChequeCalendar([
      payment({ id: 'cash', paymentMethod: 'cash', paymentMethodName: 'Cash', details: {}, amountPesewas: 10_000 }),
      payment({ id: 'cheque', details: { cheque_number: 'CH-1', expected_clearance_date: '2026-09-05' }, amountPesewas: 20_000 }),
    ])
    expect(calendar.days).toHaveLength(1)
    expect(calendar.unscheduled).toHaveLength(0)
    expect(calendar.scheduledTotalPesewas).toBe(20_000)
  })

  it('schedules by clearance date, flags estimates, collects unscheduled', () => {
    const calendar = buildChequeCalendar([
      payment({
        id: '1',
        details: { cheque_number: 'CH-100', expected_clearance_date: '2026-09-05' },
        amountPesewas: 30_000,
      }),
      payment({
        id: '2',
        details: { cheque_number: 'CH-101', cheque_date: '2026-09-06' },
        amountPesewas: 12_000,
      }),
      payment({ id: '3', details: {}, amountPesewas: 99_000 }),
    ])
    expect(calendar.days).toHaveLength(2)
    expect(calendar.days[0]).toMatchObject({ date: '2026-09-05', estimated: false, totalPesewas: 30_000 })
    expect(calendar.days[1]).toMatchObject({ date: '2026-09-06', estimated: true, totalPesewas: 12_000 })
    expect(calendar.unscheduled).toHaveLength(1)
    expect(calendar.scheduledTotalPesewas).toBe(42_000)
    expect(calendar.days[0].entries[0]).toMatchObject({ chequeNumber: 'CH-100', estimated: false })
    expect(calendar.days[1].entries[0]).toMatchObject({ chequeNumber: 'CH-101', estimated: true })
  })

  it('marks a day estimated when any entry lacks a clearance date', () => {
    const calendar = buildChequeCalendar([
      payment({ id: '1', details: { expected_clearance_date: '2026-09-05' } }),
      payment({ id: '2', details: { cheque_number: 'CH-9', cheque_date: '2026-09-05' } }),
    ])
    expect(calendar.days[0].estimated).toBe(true)
  })
})

describe('sumScheduledWithinDays', () => {
  it('sums only scheduled outflow inside the window', () => {
    const calendar = buildChequeCalendar([
      payment({ id: '1', details: { expected_clearance_date: '2026-09-03' }, amountPesewas: 10_000 }),
      payment({ id: '2', details: { expected_clearance_date: '2026-09-12' }, amountPesewas: 20_000 }),
      payment({ id: '3', details: { expected_clearance_date: '2026-08-01' }, amountPesewas: 40_000 }),
    ])
    expect(sumScheduledWithinDays(calendar, TODAY, 7)).toBe(10_000)
    expect(sumScheduledWithinDays(calendar, TODAY, 30)).toBe(30_000)
  })
})
