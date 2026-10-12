/** Longest payment reference the backend accepts on confirm-manual-payment. */
export const MAX_PAYMENT_REFERENCE = 100

/**
 * The receipt / transfer number an admin typed when confirming a payment collected outside the app,
 * or null when it is missing or too long for the backend to accept.
 */
export const normalizePaymentReference = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_PAYMENT_REFERENCE) return null
  return trimmed
}
