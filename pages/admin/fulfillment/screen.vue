<template>
  <div class="screen-root">

    <!-- Header -->
    <header class="screen-header">
      <div class="screen-brand">
        <span class="screen-brand-dot"></span>
        MedsGH · Fulfillment
      </div>

      <div class="screen-stats">
        <div class="stat-block stat-amber">
          <span class="stat-num">{{ stageCount('pending') }}</span>
          <span class="stat-label">New Orders</span>
        </div>
        <div class="stat-block stat-purple">
          <span class="stat-num">{{ stageCount('composing') }}</span>
          <span class="stat-label">Composing</span>
        </div>
        <div class="stat-block stat-blue">
          <span class="stat-num">{{ stageCount('sourcing') }}</span>
          <span class="stat-label">Sourcing</span>
        </div>
        <div class="stat-block stat-orange">
          <span class="stat-num">{{ stageCount('awaiting') }}</span>
          <span class="stat-label">Awaiting Customer</span>
        </div>
        <div class="stat-block stat-cyan">
          <span class="stat-num">{{ stageCount('payment') }}</span>
          <span class="stat-label">Payment Pending</span>
        </div>
        <div class="stat-block" :class="stageCount('paid') > 0 ? 'stat-red stat-blink' : 'stat-green'">
          <span class="stat-num">{{ stageCount('paid') }}</span>
          <span class="stat-label">Paid / Logistics</span>
        </div>
      </div>

      <div class="screen-clock">
        <div class="clock-time">{{ currentTime }}</div>
        <div class="clock-status">
          <span :class="fetchOk ? 'dot-green' : 'dot-red'">●</span>
          {{ fetchOk ? `Updated ${lastRefreshedLabel}` : 'Connection issue' }}
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="screen-body">

      <!-- Pipeline columns -->
      <div class="pipeline">
        <div v-for="stage in displayStages" :key="stage.key" class="pipeline-col">
          <div class="col-header" :style="`border-bottom-color: ${stage.color};`">
            <span class="col-label" :style="`color: ${stage.color};`">{{ stage.label }}</span>
            <span class="col-count" :style="`color: ${stage.color};`">{{ stageOrders(stage).length }}</span>
          </div>
          <div class="col-body">
            <div v-if="stageOrders(stage).length === 0" class="col-empty">—</div>
            <div
              v-for="req in stageOrders(stage)"
              :key="req.id"
              class="order-card"
              :style="`border-left-color: ${stage.color};`"
            >
              <div class="card-top">
                <span class="card-num">{{ req.request_number }}</span>
                <span class="card-elapsed" :class="isOverdue(req, stage) ? 'elapsed-warn' : ''">{{ elapsedShort(req) }}</span>
              </div>
              <div class="card-customer">{{ req.customer_name || '—' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attention panel -->
      <aside class="attention-panel">
        <div class="attention-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#ef4444"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          <span>Needs Attention</span>
          <span class="attention-count">{{ attentionItems.length }}</span>
        </div>
        <div class="attention-body">
          <div v-if="attentionItems.length === 0" class="attention-empty">
            <span>✓</span> All clear
          </div>
          <div
            v-for="item in attentionItems"
            :key="item.id"
            class="attention-card"
            :class="item._urgency === 'critical' ? 'attention-critical' : 'attention-warning'"
          >
            <div class="ac-top">
              <span class="ac-num">{{ item.request_number }}</span>
              <span class="ac-badge" :class="item._urgency === 'critical' ? 'badge-critical' : 'badge-warning'">
                {{ item._urgency === 'critical' ? 'CRITICAL' : 'WARNING' }}
              </span>
            </div>
            <div class="ac-customer">{{ item.customer_name || '—' }}</div>
            <div class="ac-reason" :class="item._urgency === 'critical' ? 'reason-critical' : 'reason-warning'">{{ item._reason }}</div>
          </div>
        </div>
      </aside>

    </div>

    <!-- Bottom ticker (critical only) -->
    <footer v-if="criticalItems.length > 0" class="screen-ticker">
      <span class="ticker-label">CRITICAL</span>
      <div class="ticker-track-wrap">
        <div class="ticker-track" :style="`animation-duration: ${tickerDuration}s;`">
          <span v-for="(item, i) in [...criticalItems, ...criticalItems]" :key="`t-${item.id}-${i}`" class="ticker-item">
            {{ item.request_number }} · {{ item.customer_name }} · {{ item._reason }}
          </span>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'

definePageMeta({ middleware: ['admin-auth'], layout: false })

const orderRequestsService = createOrderRequestsService(useApi())

const requests = ref([])
const fetchOk = ref(false)
const lastRefreshed = ref(null)
const currentTime = ref('')

const POLL_MS = 30_000

const displayStages = [
  { key: 'pending',   label: 'New Orders',        statuses: ['pending'],                                                                        color: '#f59e0b', overdueMs: null },
  { key: 'composing', label: 'Composing',          statuses: ['composing', 'composed'],                                                          color: '#a78bfa', overdueMs: 60 * 60 * 1000 },
  { key: 'sourcing',  label: 'Sourcing',           statuses: ['sourcing', 'confirming_with_pharm', 'enquiry_sent', 'processing'],                 color: '#60a5fa', overdueMs: 2 * 60 * 60 * 1000 },
  { key: 'awaiting',  label: 'Awaiting Customer',  statuses: ['awaiting_input', 'awaiting_customer'],                                            color: '#fb923c', overdueMs: 2 * 60 * 60 * 1000 },
  { key: 'payment',   label: 'Payment',            statuses: ['payment_pending', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'],  color: '#22d3ee', overdueMs: 4 * 60 * 60 * 1000 },
  { key: 'paid',      label: 'Paid / Logistics',   statuses: ['paid', 'preparing', 'logistics_pending', 'driver_unavailable'],                   color: '#f87171', overdueMs: 30 * 60 * 1000 },
]

const normalizeStatus = (v) => String(v || '').trim().toLowerCase()

const stageOrders = (stage) =>
  requests.value.filter(r => stage.statuses.includes(normalizeStatus(r.status)))

const stageCount = (key) => {
  const stage = displayStages.find(s => s.key === key)
  return stage ? stageOrders(stage).length : 0
}

const elapsedShort = (req) => {
  const ms = Date.now() - new Date(req.updated_at || req.created_at || 0).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const isOverdue = (req, stage) => {
  if (!stage.overdueMs) return false
  const ms = Date.now() - new Date(req.updated_at || req.created_at || 0).getTime()
  return ms > stage.overdueMs
}

const attentionItems = computed(() => {
  const now = Date.now()
  const results = []
  for (const r of requests.value) {
    const status = normalizeStatus(r.status)
    const elapsed = now - new Date(r.updated_at || r.created_at || 0).getTime()
    if (status === 'pending') {
      results.push({ ...r, _reason: 'New order · needs composing', _urgency: 'warning' })
    } else if (['awaiting_input', 'awaiting_customer'].includes(status) && elapsed > 2 * 3600000) {
      results.push({ ...r, _reason: `Awaiting customer · ${elapsedShort(r)}`, _urgency: elapsed > 4 * 3600000 ? 'critical' : 'warning' })
    } else if (['logistics_pending', 'driver_unavailable'].includes(status)) {
      results.push({ ...r, _reason: 'Paid · no rider assigned', _urgency: 'critical' })
    } else if (['payment_pending', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'].includes(status) && elapsed > 4 * 3600000) {
      results.push({ ...r, _reason: `Payment pending · ${elapsedShort(r)}`, _urgency: elapsed > 8 * 3600000 ? 'critical' : 'warning' })
    }
  }
  return results.sort((a, b) =>
    a._urgency === 'critical' && b._urgency !== 'critical' ? -1 :
    b._urgency === 'critical' && a._urgency !== 'critical' ? 1 : 0
  )
})

const criticalItems = computed(() => attentionItems.value.filter(i => i._urgency === 'critical'))

const tickerDuration = computed(() => Math.max(20, criticalItems.value.length * 8))

const lastRefreshedLabel = computed(() => {
  if (!lastRefreshed.value) return ''
  const m = Math.floor((Date.now() - lastRefreshed.value.getTime()) / 60000)
  return m === 0 ? 'just now' : `${m}m ago`
})

const fetchData = async () => {
  try {
    const res = await orderRequestsService.listAdmin()
    requests.value = res.data || []
    lastRefreshed.value = new Date()
    fetchOk.value = true
  } catch {
    fetchOk.value = false
  }
}

let pollTimer = null
let clockTimer = null

const updateClock = () => {
  currentTime.value = new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

onMounted(() => {
  fetchData()
  updateClock()
  pollTimer = setInterval(fetchData, POLL_MS)
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(clockTimer)
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.screen-root {
  min-height: 100vh;
  background: #0f172a;
  color: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ─── Header ─── */
.screen-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
  background: #0a0f1e;
}

.screen-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}
.screen-brand-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4F217A;
  flex-shrink: 0;
}

/* ─── Stat blocks ─── */
.screen-stats {
  display: flex;
  gap: 0.6rem;
  flex: 1;
}
.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  border: 1px solid transparent;
  min-width: 0;
  flex: 1;
}
.stat-num {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 0.58rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.2rem;
  white-space: nowrap;
  opacity: 0.8;
}
.stat-amber  { background: #1c1400; border-color: #78350f; color: #fbbf24; }
.stat-purple { background: #130d2a; border-color: #4c1d95; color: #a78bfa; }
.stat-blue   { background: #0c1a33; border-color: #1e3a8a; color: #60a5fa; }
.stat-orange { background: #1c0e00; border-color: #7c2d12; color: #fb923c; }
.stat-cyan   { background: #001a1f; border-color: #164e63; color: #22d3ee; }
.stat-green  { background: #001a0e; border-color: #14532d; color: #4ade80; }
.stat-red    { background: #1a0000; border-color: #7f1d1d; color: #f87171; }
.stat-blink  { animation: statBlink 1.5s ease-in-out infinite; }
@keyframes statBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ─── Clock ─── */
.screen-clock {
  text-align: right;
  flex-shrink: 0;
}
.clock-time {
  font-size: 1.6rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #f1f5f9;
  line-height: 1;
}
.clock-status {
  font-size: 0.6rem;
  color: #475569;
  margin-top: 0.3rem;
}
.dot-green { color: #4ade80; }
.dot-red   { color: #f87171; }

/* ─── Body ─── */
.screen-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 1px;
  background: #1e293b;
}

/* ─── Pipeline ─── */
.pipeline {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 1px;
  background: #1e293b;
}
.pipeline-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0f172a;
  min-width: 0;
}
.col-header {
  padding: 0.65rem 0.85rem;
  border-bottom: 2px solid;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #0a0f1e;
}
.col-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.col-count {
  font-size: 1.2rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.col-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem;
}
.col-body::-webkit-scrollbar { width: 3px; }
.col-body::-webkit-scrollbar-track { background: transparent; }
.col-body::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 99px; }

.col-empty {
  padding: 1.5rem;
  text-align: center;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 700;
}

.order-card {
  margin-bottom: 0.35rem;
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  background: #1e293b;
  border-left: 3px solid;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}
.card-num {
  font-size: 0.72rem;
  font-weight: 700;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-elapsed {
  font-size: 0.6rem;
  color: #475569;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.elapsed-warn { color: #f87171; font-weight: 700; }
.card-customer {
  font-size: 0.65rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Attention panel ─── */
.attention-panel {
  width: 300px;
  flex-shrink: 0;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.attention-header {
  padding: 0.65rem 1rem;
  border-bottom: 2px solid #ef4444;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  background: #0a0f1e;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #ef4444;
}
.attention-count {
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  margin-left: auto;
}
.attention-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}
.attention-body::-webkit-scrollbar { width: 3px; }
.attention-body::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 99px; }

.attention-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #334155;
  font-size: 0.85rem;
}

.attention-card {
  margin-bottom: 0.5rem;
  padding: 0.7rem 0.8rem;
  border-radius: 8px;
  background: #1e293b;
  border-left: 4px solid;
}
.attention-critical { border-left-color: #ef4444; }
.attention-warning  { border-left-color: #f59e0b; }

.ac-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}
.ac-num {
  font-size: 0.8rem;
  font-weight: 700;
  color: #f1f5f9;
  font-variant-numeric: tabular-nums;
}
.ac-badge {
  font-size: 0.58rem;
  font-weight: 700;
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
}
.badge-critical { background: #450a0a; color: #fca5a5; }
.badge-warning  { background: #451a03; color: #fcd34d; }

.ac-customer {
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-reason {
  font-size: 0.68rem;
  font-weight: 600;
}
.reason-critical { color: #fca5a5; }
.reason-warning  { color: #fcd34d; }

/* ─── Ticker ─── */
.screen-ticker {
  background: #450a0a;
  border-top: 1px solid #7f1d1d;
  padding: 0.45rem 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
}
.ticker-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: #fca5a5;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid #7f1d1d;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.ticker-track-wrap {
  overflow: hidden;
  flex: 1;
}
.ticker-track {
  display: flex;
  animation: tickerScroll linear infinite;
  width: max-content;
}
.ticker-item {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fca5a5;
  white-space: nowrap;
  margin-right: 4rem;
}
@keyframes tickerScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
</style>
