// composables/useAttentionQueue.ts
// Shared admin "Needs Attention" feed. Polls /api/order-requests/admin on a
// background interval and exposes a derived attention queue plus a chime
// helper, so the admin sidebar can surface urgent items from anywhere in the
// portal — not just the order-requests page.

import { ref, computed, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'
import type { OrderRequest } from '~/services/types'

const ATTENTION_AWAITING_MS = 2 * 60 * 60 * 1000
const ATTENTION_PAYMENT_MS = 4 * 60 * 60 * 1000
const POLL_INTERVAL_MS = 30 * 1000

interface AttentionItem extends OrderRequest {
  _reason: string
  _urgency: 'warning' | 'critical'
}

// Module-level singleton state — every caller of the composable shares the
// same poll loop and queue, so we never run duplicate fetches across the
// layout and any page that wants to read this data.
const requests = ref<OrderRequest[]>([])
const lastFetchedAt = ref(0)
const soundMuted = ref(false)
const lastSeenCount = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null
let activeRefs = 0
let chimeWatcherStopped = false
let stopChimeWatcher: (() => void) | null = null

const normalizeRequestStatus = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase()

const formatElapsedShort = (ms: number): string => {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const attentionQueue = computed((): AttentionItem[] => {
  const now = Date.now()
  const results: AttentionItem[] = []
  for (const r of requests.value) {
    const status = normalizeRequestStatus(r.status)
    const elapsedMs = now - new Date((r as OrderRequest & { updated_at?: string }).updated_at ?? r.created_at ?? 0).getTime()
    if (status === 'pending') {
      results.push({ ...r, _reason: 'New order · needs composing', _urgency: 'warning' })
    } else if (['awaiting_input', 'awaiting_customer'].includes(status) && elapsedMs > ATTENTION_AWAITING_MS) {
      results.push({
        ...r,
        _reason: `Awaiting customer · ${formatElapsedShort(elapsedMs)}`,
        _urgency: elapsedMs > 4 * 60 * 60 * 1000 ? 'critical' : 'warning',
      })
    } else if (['logistics_pending', 'driver_unavailable'].includes(status)) {
      results.push({ ...r, _reason: 'Paid · no rider assigned', _urgency: 'critical' })
    } else if (
      ['payment_pending', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'].includes(status) &&
      elapsedMs > ATTENTION_PAYMENT_MS
    ) {
      results.push({
        ...r,
        _reason: `Payment pending · ${formatElapsedShort(elapsedMs)}`,
        _urgency: elapsedMs > 8 * 60 * 60 * 1000 ? 'critical' : 'warning',
      })
    }
  }
  return results.sort((a, b) =>
    a._urgency === 'critical' && b._urgency !== 'critical'
      ? -1
      : b._urgency === 'critical' && a._urgency !== 'critical'
        ? 1
        : 0
  )
})

const playAttentionChime = (): void => {
  if (soundMuted.value) return
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    ;[880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.start(t)
      osc.stop(t + 0.35)
    })
  } catch {
    // audio not available
  }
}

export const useAttentionQueue = () => {
  const adminStore = useAdminStore()
  const orderRequestsService = createOrderRequestsService(useApi())

  const fetchOnce = async (): Promise<void> => {
    if (!adminStore.token) return
    try {
      const json = await orderRequestsService.listForAdmin()
      requests.value = Array.isArray(json?.data) ? json.data : []
      lastFetchedAt.value = Date.now()
    } catch {
      /* swallow — keep last good state, retry on next tick */
    }
  }

  const start = (): void => {
    activeRefs += 1
    if (process.client && !chimeWatcherStopped) {
      stopChimeWatcher = watch(
        () => attentionQueue.value.length,
        (newCount) => {
          if (newCount > lastSeenCount.value && lastSeenCount.value > 0) {
            playAttentionChime()
          }
          lastSeenCount.value = newCount
        }
      )
      chimeWatcherStopped = true
    }
    if (pollTimer) return
    void fetchOnce()
    if (process.client) {
      pollTimer = setInterval(() => void fetchOnce(), POLL_INTERVAL_MS)
    }
  }

  const stop = (): void => {
    activeRefs = Math.max(0, activeRefs - 1)
    if (activeRefs === 0 && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (activeRefs === 0 && typeof stopChimeWatcher === 'function') {
      stopChimeWatcher()
      stopChimeWatcher = null
      chimeWatcherStopped = false
    }
  }

  const acknowledge = (): void => {
    lastSeenCount.value = attentionQueue.value.length
  }

  return {
    attentionQueue,
    soundMuted,
    lastFetchedAt,
    fetchOnce,
    start,
    stop,
    acknowledge,
  }
}
