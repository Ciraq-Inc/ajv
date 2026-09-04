import type { PaymentMethodSubtype, PaymentMethodSummary } from '~/services/types'

export interface PaymentDetailDefinition {
  key: string
  label: string
  type: 'text' | 'date'
  required: boolean
  placeholder: string
}

const standardFields: Record<string, PaymentDetailDefinition[]> = {
  cash: [
    { key: 'voucher_number', label: 'Voucher number', type: 'text', required: false, placeholder: 'Optional voucher number' },
  ],
  mobile_money: [
    { key: 'transaction_id', label: 'Transaction ID', type: 'text', required: true, placeholder: 'Enter the transaction ID' },
    { key: 'network', label: 'Network', type: 'text', required: false, placeholder: 'e.g. MTN, Vodafone' },
    { key: 'recipient_wallet', label: 'Recipient wallet', type: 'text', required: false, placeholder: 'Optional wallet number' },
  ],
  pos: [
    { key: 'approval_code', label: 'Approval code', type: 'text', required: true, placeholder: 'Enter the approval code' },
    { key: 'terminal_reference', label: 'Terminal reference', type: 'text', required: false, placeholder: 'Optional terminal reference' },
  ],
  card: [
    { key: 'authorization_code', label: 'Authorization code', type: 'text', required: false, placeholder: 'Optional authorization code' },
    { key: 'terminal_reference', label: 'Terminal reference', type: 'text', required: false, placeholder: 'Optional terminal reference' },
  ],
  bank_transfer: [
    { key: 'transfer_reference', label: 'Transfer reference', type: 'text', required: false, placeholder: 'Optional transfer reference' },
    { key: 'bank_name', label: 'Bank', type: 'text', required: false, placeholder: 'Optional bank name' },
    { key: 'account_name', label: 'Recipient account', type: 'text', required: false, placeholder: 'Optional account name' },
  ],
  credit_payment: [
    { key: 'credit_reference', label: 'Credit reference', type: 'text', required: false, placeholder: 'Optional credit reference' },
  ],
  cheque: [
    { key: 'cheque_number', label: 'Cheque number', type: 'text', required: true, placeholder: 'Enter the cheque number' },
    { key: 'bank_name', label: 'Bank', type: 'text', required: false, placeholder: 'Optional bank name' },
    { key: 'cheque_date', label: 'Cheque date', type: 'date', required: false, placeholder: '' },
    { key: 'expected_clearance_date', label: 'Expected clearance date', type: 'date', required: false, placeholder: '' },
  ],
  other: [
    { key: 'payment_details', label: 'Payment details', type: 'text', required: false, placeholder: 'Describe how the supplier was paid' },
  ],
}

const subtypeFields = (subtype?: PaymentMethodSubtype | null): PaymentDetailDefinition[] => {
  if (!subtype) return []
  return [
    ['field1', subtype.field1, subtype.allowField1],
    ['field2', subtype.field2, subtype.allowField2],
    ['field3', subtype.field3, subtype.allowField3],
  ]
    .filter(([, label, allowed]) => Boolean(allowed && String(label || '').trim()))
    .map(([key, label]) => ({
      key,
      label: String(label).trim(),
      type: 'text' as const,
      required: false,
      placeholder: `Enter ${String(label).trim().toLowerCase()}`,
    }))
}

export const paymentDetailFields = (
  method?: PaymentMethodSummary | null,
  subtype?: PaymentMethodSubtype | null,
): PaymentDetailDefinition[] => {
  const configured = subtypeFields(subtype)
  if (configured.length) return configured
  return standardFields[method?.methodKey || ''] || []
}

export const paymentMethodHasSubtypes = (method?: PaymentMethodSummary | null) => (
  Boolean(method?.subtypes?.some((subtype) => subtype.isActive))
)
