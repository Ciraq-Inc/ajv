export const PAYABLE_REQUEST_STATUSES = new Set([
  'payment_pending',
  'awaiting_method_selection',
  // Legacy values kept for backward compatibility
  'confirmed_in_pharm',
  'items_sourced',
  'confirmed'
])

export const getRequestTotalAmount = (request) => {
  if (!request) return 0

  const estimated = Number(request.estimated_total)
  if (Number.isFinite(estimated) && estimated > 0) return estimated

  const itemsTotal = Number(request.items_total || 0)
  // Review P1: stored provider quote wins over own-rider fee — mirrors
  // backend getEffectiveDeliveryFee so lists match what pay charges.
  const quote = Number(request.delivery_quote_amount || 0)
  const quoted = request.delivery_provider_code && Number.isFinite(quote) && quote > 0
  const deliveryFee = request.fulfillment_type === 'delivery'
    ? (quoted ? quote : Number(request.delivery_fee || 0))
    : 0
  const amount = itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export const isPayableRequest = (request) => {
  if (!request) return false
  const rawStatus = String(request.status || '').trim().toLowerCase()
  return PAYABLE_REQUEST_STATUSES.has(rawStatus) && getRequestTotalAmount(request) > 0
}

export const isPaymentPendingRequest = (request) => {
  if (!request) return false
  const rawStatus = String(request.status || '').trim().toLowerCase()
  return PAYABLE_REQUEST_STATUSES.has(rawStatus) && getRequestTotalAmount(request) <= 0
}
