import { readBody, createError } from 'h3'

// Paystack transaction verification — runs server-side so the secret key
// never reaches the browser. The client posts a reference; we call Paystack
// with the env-only secret and pass back the verification result.

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secretKey = (config as any).paystackSecretKey

  if (!secretKey) {
    throw createError({ statusCode: 500, statusMessage: 'Paystack secret key not configured' })
  }

  const body = await readBody<{ reference?: string }>(event)
  const reference = body?.reference?.toString().trim()

  if (!reference) {
    throw createError({ statusCode: 400, statusMessage: 'Missing payment reference' })
  }
  // Defensive: Paystack references are alphanumeric + hyphens. Reject anything else
  // so we never proxy a tampered URL fragment.
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(reference)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payment reference' })
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Paystack verify upstream error: ${response.status}`,
    })
  }

  const data = await response.json() as { status?: boolean; data?: unknown; message?: string }

  if (!data.status) {
    return { status: 'failed', message: data.message || 'Payment verification failed' }
  }

  return { status: 'success', data: data.data }
})
