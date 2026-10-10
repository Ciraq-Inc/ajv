import { ref } from 'vue'

type Request = (url: string, options?: Record<string, unknown>) => Promise<unknown>
export type PickupResult = { ok: true } | { ok: false; message: string }

const FALLBACK = 'Something went wrong. Please try again'

/**
 * The pharmacy's two actions on a pickup order: mark it ready to collect, and hand it
 * over against the customer's 4-digit code. Failures come back as a message to show.
 */
export const usePickupHandover = (request: Request) => {
  const busy = ref(false)

  const run = async (url: string, options: Record<string, unknown>): Promise<PickupResult> => {
    busy.value = true
    try {
      await request(url, options)
      return { ok: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      return { ok: false, message: message || FALLBACK }
    } finally {
      busy.value = false
    }
  }

  const markReady = (orderId: number | string): Promise<PickupResult> =>
    run(`/api/pharmacy-portal/orders/${String(orderId)}/ready`, { method: 'POST' })

  const handOver = (orderId: number | string, code: string): Promise<PickupResult> => {
    const trimmed = code.trim()
    if (!/^\d{4}$/.test(trimmed)) return Promise.resolve({ ok: false, message: 'Enter the 4-digit code' })
    return run(`/api/pharmacy-portal/orders/${String(orderId)}/handover`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: trimmed }) })
  }

  return { busy, markReady, handOver }
}
