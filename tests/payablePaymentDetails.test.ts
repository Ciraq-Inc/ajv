import { describe, expect, it } from 'vitest'
import { paymentDetailFields, paymentMethodHasSubtypes } from '~/utils/payablePaymentDetails'
import type { PaymentMethodSubtype, PaymentMethodSummary } from '~/services/types'

const method = (methodKey: string, subtypes: PaymentMethodSummary['subtypes'] = []): PaymentMethodSummary => ({
  id: 1,
  methodKey,
  name: methodKey,
  subtypes,
})

describe('payables payment details', () => {
  it('marks cheque number required and keeps optional bank and dates available', () => {
    expect(paymentDetailFields(method('cheque'))).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'cheque_number', required: true, type: 'text' }),
      expect.objectContaining({ key: 'bank_name', required: false }),
      expect.objectContaining({ key: 'expected_clearance_date', required: false, type: 'date' }),
    ]))
  })

  it('uses enabled custom subtype fields and omits disallowed or blank fields', () => {
    const subtype: PaymentMethodSubtype = {
      id: 9,
      name: 'Mobile money - merchant account',
      isActive: true,
      field1: 'Till number',
      allowField1: true,
      field2: '  ',
      allowField2: true,
      field3: 'Internal note',
      allowField3: false,
    }

    expect(paymentDetailFields(method('mobile_money'), subtype)).toEqual([
      expect.objectContaining({ key: 'field1', label: 'Till number', required: false, placeholder: 'Enter till number' }),
    ])
  })

  it('reports only active subtypes and handles missing methods', () => {
    expect(paymentMethodHasSubtypes(method('cash', [{ id: 1, name: 'Inactive', isActive: false } as PaymentMethodSubtype]))).toBe(false)
    expect(paymentMethodHasSubtypes(method('cash', [{ id: 2, name: 'Active', isActive: true } as PaymentMethodSubtype]))).toBe(true)
    expect(paymentMethodHasSubtypes(null)).toBe(false)
    expect(paymentDetailFields({ methodKey: 'unknown' } as PaymentMethodSummary)).toEqual([])
  })
})
