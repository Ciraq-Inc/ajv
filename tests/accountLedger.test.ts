import { describe, expect, it } from 'vitest'
import type { LedgerEntry } from '../services/types'
import {
  canShowLedgerPaymentMethod, filterLedger, groupLedgerByDate, ledgerAdditionalDetails, ledgerDateGroupLabel,
  ledgerDescription, ledgerEntrySummary, ledgerMethodValues, ledgerPaymentMethodDisplay, ledgerPaymentMethodOptions,
  ledgerReferenceDisplay, ledgerSourceDetail, ledgerSourceLabel, shortenLedgerText,
} from '../utils/accountLedger'

const labels = { sales: 'Sales', credit_payment: 'Credit payment', cheque: 'Cheque', manual: 'Manual entry', expense: 'Expense', reversal: 'Reversal' }

const entry = (over: Partial<LedgerEntry> = {}): LedgerEntry => ({
  id: 'e1', accountId: '1', date: '2026-10-10T08:00:00.000Z', reference: 'REF-1', recipient: 'Ama', description: 'Ama',
  source: 'manual', direction: 'in', method: 'bank', moneyIn: 100, moneyOut: 0, runningBalance: 100, enteredBy: 'Kofi',
  status: 'posted', ...over,
} as LedgerEntry)

describe('payment method of a ledger row', () => {
  it('only money coming in from sales, credit payments, cheques and manual credits has a method', () => {
    expect(canShowLedgerPaymentMethod(entry({ source: 'sales' }))).toBe(true)
    expect(canShowLedgerPaymentMethod(entry({ source: 'expense', moneyIn: 0, moneyOut: 50 }))).toBe(false)
    expect(canShowLedgerPaymentMethod(entry({ source: 'sales', moneyIn: 0 }))).toBe(false)
  })

  it('reads methods from allocations and metadata, never from the legacy account-type `method`', () => {
    const row = entry({
      source: 'sales', method: 'bank',
      paymentAllocations: [{ methodId: '1', methodKey: 'Mobile-Money', methodName: 'Mobile Money' }],
      metadata: { paymentMethod: 'cash' },
    })
    expect(ledgerMethodValues(row)).toEqual(['mobile_money', 'cash'])
    expect(ledgerMethodValues(entry({ source: 'sales', method: 'bank' }))).toEqual([])
  })

  it('lists each method once, sorted, across the ledger', () => {
    const rows = [
      entry({ source: 'sales', metadata: { paymentMethod: 'cash' } }),
      entry({ source: 'sales', metadata: { paymentMethod: 'Cash' } }),
      entry({ source: 'cheque', metadata: { paymentMethod: 'cheque' } }),
    ]
    expect(ledgerPaymentMethodOptions(rows)).toEqual(['cash', 'cheque'])
  })

  it('shows the payment context first, then allocations, then the single method', () => {
    expect(ledgerPaymentMethodDisplay(entry({ paymentContext: { methodName: 'Bank', subtypeName: 'GCB' } as never }))).toBe('Bank · GCB')
    expect(ledgerPaymentMethodDisplay(entry({ source: 'sales', paymentAllocations: [
      { methodId: '1', methodKey: 'cash', methodName: 'Cash' }, { methodId: '2', methodKey: 'momo', methodName: 'MoMo' },
    ] }))).toBe('Cash · MoMo')
    expect(ledgerPaymentMethodDisplay(entry({ source: 'sales', metadata: { paymentMethod: 'mobile_money' } }))).toBe('Mobile Money')
    expect(ledgerPaymentMethodDisplay(entry({ source: 'expense', moneyIn: 0, moneyOut: 5 }))).toBe('')
  })

  it('gives amounts per allocation when they are split, and skips a detail that repeats the source label', () => {
    const split = entry({ source: 'sales', paymentAllocations: [
      { methodId: '1', methodKey: 'cash', methodName: 'Cash', amount: 60 }, { methodId: '2', methodKey: 'momo', methodName: 'MoMo', amount: 40.5 },
    ] })
    expect(ledgerSourceDetail(split, labels)).toBe('Cash 60.00 · MoMo 40.50')
    expect(ledgerSourceDetail(entry({ source: 'cheque', metadata: { paymentMethod: 'cheque' } }), labels)).toBe('')
    expect(ledgerSourceDetail(entry({ source: 'sales', metadata: { paymentMethod: 'cash' } }), labels)).toBe('Cash')
  })

  it('labels the source by allocations, then a credit label, then the source name', () => {
    expect(ledgerSourceLabel(entry({ source: 'sales' }), labels)).toBe('Sales')
    expect(ledgerSourceLabel(entry({ source: 'loan_received' }), labels)).toBe('loan received')
    expect(ledgerSourceLabel(entry({ metadata: { creditSourceLabel: 'Daily takings' } }), labels)).toBe('Daily takings')
  })
})

describe('extra detail lines', () => {
  it('shows known, non-empty metadata and hides the breakdown once allocations say it', () => {
    const metadata = { cashierName: 'Esi', shiftName: '  ', paymentMethodSummary: 'Cash 10', secret: 'x' }
    expect(ledgerAdditionalDetails(entry({ metadata }))).toEqual([
      { key: 'cashierName', label: 'Cashier', value: 'Esi' },
      { key: 'paymentMethodSummary', label: 'Payment breakdown', value: 'Cash 10' },
    ])
    const withAllocations = entry({ metadata, paymentAllocations: [{ methodId: '1', methodKey: 'cash', methodName: 'Cash' }] })
    expect(ledgerAdditionalDetails(withAllocations).map((d) => d.key)).toEqual(['cashierName'])
  })
})

describe('wording', () => {
  it('summarises a sales collection as its method and date', () => {
    const row = entry({ source: 'sales', recipient: 'cash sales collection for 2026-10-03' })
    expect(ledgerEntrySummary(row, labels)).toBe('Cash sales · 3 Oct 2026')
    expect(ledgerEntrySummary(entry({ source: 'credit_payment', recipient: 'Credit settled 2026-10-03' }), labels)).toBe('Credit payment · 3 Oct 2026')
    expect(ledgerEntrySummary(entry({ source: 'cheque', recipient: 'Cheque 2026-10-03' }), labels)).toBe('Cheque receipt · 3 Oct 2026')
  })

  it('reads the description, falling back to the recipient, with spacing tidied', () => {
    expect(ledgerDescription(entry({ description: '  Paid   in   cash ' }))).toBe('Paid in cash')
    expect(ledgerDescription(entry({ description: '', recipient: 'Ama' }))).toBe('Ama')
  })

  it('cuts long text on a word boundary', () => {
    expect(shortenLedgerText('short')).toBe('short')
    expect(shortenLedgerText('alpha beta gamma delta', 13)).toBe('alpha beta...')
  })

  it('shortens a long reference in the middle and says when there is none', () => {
    expect(ledgerReferenceDisplay(entry({ reference: 'REF-1' }))).toBe('REF-1')
    expect(ledgerReferenceDisplay(entry({ reference: 'SETTLEMENT-2026-10-03-ABCDEFGH-0042' }))).toBe('SETTLEMENT-2026…EFGH-0042')
    expect(ledgerReferenceDisplay(entry({ reference: '   ' }))).toBe('No reference')
  })

  it('names recent days and falls back to the weekday', () => {
    const now = new Date('2026-10-12T15:00:00')
    expect(ledgerDateGroupLabel('2026-10-12', now)).toBe('Today')
    expect(ledgerDateGroupLabel('2026-10-11', now)).toBe('Yesterday')
    expect(ledgerDateGroupLabel('2026-10-09', now)).toBe('Friday')
    expect(ledgerDateGroupLabel('', now)).toBe('Undated entries')
  })
})

describe('filtering and grouping the ledger', () => {
  const all = { query: '', direction: 'all' as const, fromDate: '', toDate: '', method: 'all', status: 'all' }
  const rows = [
    entry({ id: '1', date: '2026-10-12T10:00:00Z', source: 'sales', metadata: { paymentMethod: 'cash' }, reference: 'S-1' }),
    entry({ id: '2', date: '2026-10-12T09:00:00Z', source: 'expense', moneyIn: 0, moneyOut: 20, direction: 'out', reference: 'E-1' }),
    entry({ id: '3', date: '2026-10-05T09:00:00Z', source: 'reversal', reference: 'R-1' }),
    entry({ id: '4', date: '2026-10-05T08:00:00Z', source: 'manual', status: 'reversed', reference: 'M-1' }),
  ]

  it('never shows reversal rows', () => {
    expect(filterLedger(rows, all, labels).map((r) => r.id)).toEqual(['1', '2', '4'])
  })

  it('filters by direction, date range, method and status', () => {
    expect(filterLedger(rows, { ...all, direction: 'out' }, labels).map((r) => r.id)).toEqual(['2'])
    expect(filterLedger(rows, { ...all, direction: 'in' }, labels).map((r) => r.id)).toEqual(['1', '4'])
    expect(filterLedger(rows, { ...all, fromDate: '2026-10-10' }, labels).map((r) => r.id)).toEqual(['1', '2'])
    expect(filterLedger(rows, { ...all, toDate: '2026-10-06' }, labels).map((r) => r.id)).toEqual(['4'])
    expect(filterLedger(rows, { ...all, method: 'cash' }, labels).map((r) => r.id)).toEqual(['1'])
    expect(filterLedger(rows, { ...all, status: 'reversed' }, labels).map((r) => r.id)).toEqual(['4'])
  })

  it('searches reference, who entered it, source and status', () => {
    expect(filterLedger(rows, { ...all, query: ' e-1 ' }, labels).map((r) => r.id)).toEqual(['2'])
    expect(filterLedger(rows, { ...all, query: 'reversed' }, labels).map((r) => r.id)).toEqual(['4'])
    expect(filterLedger(rows, { ...all, query: 'nothing like this' }, labels)).toEqual([])
  })

  it('groups consecutive rows of the same day', () => {
    const groups = groupLedgerByDate(filterLedger(rows, all, labels))
    expect(groups.map((g) => [g.date, g.entries.map((e) => e.id)])).toEqual([
      ['2026-10-12', ['1', '2']], ['2026-10-05', ['4']],
    ])
  })
})
