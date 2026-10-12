import { describe, expect, it } from 'vitest'
import { MAX_PAYMENT_REFERENCE, normalizePaymentReference } from '../utils/manualPayment'

describe('normalizePaymentReference', () => {
  it('trims a receipt or transfer number', () => {
    expect(normalizePaymentReference('  RCPT-20001 ')).toBe('RCPT-20001')
  })

  it.each([null, undefined, '', '   ', 42])('treats %j as no reference', (input) => {
    expect(normalizePaymentReference(input as string | null | undefined)).toBeNull()
  })

  it('rejects a reference the server would refuse as too long', () => {
    expect(normalizePaymentReference('R'.repeat(MAX_PAYMENT_REFERENCE))).toHaveLength(MAX_PAYMENT_REFERENCE)
    expect(normalizePaymentReference('R'.repeat(MAX_PAYMENT_REFERENCE + 1))).toBeNull()
  })
})
