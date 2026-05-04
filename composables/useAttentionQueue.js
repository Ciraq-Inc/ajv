// composables/useAttentionQueue.js
// Shared admin "Needs Attention" feed. Polls /api/order-requests/admin on a
// background interval and exposes a derived attention queue plus a chime
// helper, so the admin sidebar can surface urgent items from anywhere in the
// portal — not just the order-requests page.

import { ref, computed, watch } from 'vue'

const ATTENTION_AWAITING_MS = 2 * 60 * 60 * 1000
const ATTENTION_PAYMENT_MS = 4 * 60 * 60 * 1000
const POLL_INTERVAL_MS = 30 * 1000

// Module-level singleton state — every caller of the composable shares the
// same poll loop and queue, so we never run duplicate fetches across the
// layout and any page that wants to read this data.
const requests = ref([])
const lastFetchedAt = ref(0)
const soundMuted = ref(false)
const lastSeenCount = ref(0)
let pollTimer = null
let activeRefs = 0
let chimeWatcherStopped = false
let stopChimeWatcher = null

const normalizeRequestStatus = (value) => String(value || '').trim().toLowerCase()

const formatElapsedShort = (ms) => {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const attentionQueue = computed(() => {
  const now = Date.now()
  const results = []
  for (const r of requests.value) {
    const status = normalizeRequestStatus(r.status)
    const elapsedMs = now - new Date(r.updated_at || r.created_at || 0).getTime()
    if (status === 'pending') {
      results.push({ ...r, _reason: 'New order · needs composing', _urgency: 'warning' })
    } else if (['awaiting_input', 'awaiting_customer'].includes(status) && elapsedMs > ATTENTION_AWAITING_MS) {
      results.push({
        ...r,
        _reason: `Awaiting customer · ${formatElapsedShort(elapsedMs)}`,
        _urgency: elapsedMs > 4 * 60 * 60 * 1000 ? 'critical' : 'warning'
      })
    } else if (['logistics_pending', 'driver_unavailable'].includes(status)) {
      results.push({ ...r, _reason: 'Paid · no rider assigned', _urgency: 'critical' })
    } else if (
      ['payment_pending', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'].includes(status)
      && elapsedMs > ATTENTION_PAYMENT_MS
    ) {
      results.push({
        ...r,
        _reason: `Payment pending · ${formatElapsedShort(elapsedMs)}`,
        _urgency: elapsedMs > 8 * 60 * 60 * 1000 ? 'critical' : 'warning'
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

const playAttentionChime = () => {
  if (soundMuted.value) return
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
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
  } catch {}
}

export const useAttentionQueue = () => {
  const adminStore = useAdminStore()
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase || ''

  const fetchOnce = async () => {
    if (!adminStore.token) return
    try {
      const res = await fetch(`${apiBaseUrl}/api/order-requests/admin`, {
        headers: { 'Authorization': `Bearer ${adminStore.token}` }
      })
      if (!res.ok) return
      const json = await res.json()
      requests.value = Array.isArray(json?.data) ? json.data : []
      lastFetchedAt.value = Date.now()
    } catch {
      /* swallow — keep last good state, retry on next tick */
    }
  }

  const start = () => {
    activeRefs += 1
    if (process.client && !chimeWatcherStopped) {
      // Only chime when the queue grows after we have already seen a baseline.
      stopChimeWatcher = watch(() => attentionQueue.value.length, (newCount) => {
        if (newCount > lastSeenCount.value && lastSeenCount.value > 0) {
          playAttentionChime()
        }
        lastSeenCount.value = newCount
      })
      chimeWatcherStopped = true
    }
    if (pollTimer) return
    fetchOnce()
    if (process.client) {
      pollTimer = setInterval(fetchOnce, POLL_INTERVAL_MS)
    }
  }

  const stop = () => {
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

  const acknowledge = () => {
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
