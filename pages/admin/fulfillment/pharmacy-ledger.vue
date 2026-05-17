<template>
  <div class="pharmacy-ledger-page">
    <!-- Clean Minimal Header -->
    <div class="page-header">
      <div class="page-heading">
        <h1 class="page-title">Pharmacy Ledger</h1>
        <p class="page-subtitle">Platform revenue, payment lines, and order histories.</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary header-btn--back" @click="goBack">Back to Orders</button>
        <button class="btn-primary header-btn--refresh" :disabled="loading" @click="loadLedger">
          {{ loading ? 'Refreshing...' : 'Refresh Data' }}
        </button>
      </div>
    </div>

    <!-- Platform-wide High-level Stats (Stripe-like) -->
    <div class="kpi-banner">
      <div class="kpi-block">
        <span class="kpi-label">Total Volume</span>
        <strong class="kpi-value">{{ formatCurrency(summary.total_earned) }}</strong>
        <span class="kpi-sub">{{ summary.transaction_count }} total transactions</span>
      </div>
      <div class="kpi-block">
        <span class="kpi-label">Avg Transaction</span>
        <strong class="kpi-value">{{ formatCurrency(summary.average_transaction_value) }}</strong>
        <span class="kpi-sub">Across {{ summary.pharmacy_count }} active pharmacies</span>
      </div>
      <div class="kpi-block">
        <span class="kpi-label">Date Range</span>
        <strong class="kpi-value kpi-date">{{ prettyDate(summary.from_date) }} &rarr; {{ prettyDate(summary.to_date) }}</strong>
        <span class="kpi-sub">Currently viewing</span>
      </div>
    </div>

    <!-- Explicit Filter Bar -->
    <div class="ledger-filter-bar">
      <div class="filter-group">
        <span class="filter-label">Quick Range:</span>
        <div class="quick-ranges">
          <button
            v-for="range in ranges"
            :key="range.value"
            type="button"
            class="range-btn"
            :class="{ active: quickRange === range.value }"
            @click="() => { applyQuickRange(range.value); loadLedger(); }"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">Custom Dates:</span>
        <div class="date-pickers">
          <input v-model="fromDate" type="date" class="date-input" @change="loadLedger" />
          <span class="date-sep">to</span>
          <input v-model="toDate" type="date" class="date-input" @change="loadLedger" />
        </div>
      </div>
    </div>

    <div v-if="error" class="ledger-error">{{ error }}</div>

    <!-- Main Layout: Sidebar + Data Table -->
    <div class="ledger-layout">
      
      <!-- Left Sidebar: Pharmacies -->
      <aside class="sidebar-panel">
        <div class="sidebar-header">
          <input v-model="searchQuery" type="text" class="search-input" placeholder="Search pharmacies..." />
        </div>
        
        <div class="pharmacy-list">
          <button
            v-for="pharmacy in filteredPharmacies"
            :key="pharmacy.pharmacy_id"
            type="button"
            class="pharmacy-list-item"
            :class="{ active: selectedPharmacyId === pharmacy.pharmacy_id }"
            @click="selectPharmacy(pharmacy.pharmacy_id)"
          >
            <div class="pli-main">
              <span class="pli-name">{{ pharmacy.pharmacy_name }}</span>
              <span class="pli-loc">{{ pharmacy.pharmacy_location || 'No location' }}</span>
            </div>
            <div class="pli-stats">
              <span class="pli-earned">{{ formatCurrency(pharmacy.total_earned) }}</span>
              <span class="pli-txns">{{ pharmacy.transaction_count }} txns</span>
            </div>
          </button>
          
          <div v-if="filteredPharmacies.length === 0" class="empty-muted">
            No pharmacies matched.
          </div>
        </div>
      </aside>

      <!-- Right Main: Transaction Data Table -->
      <main class="main-panel">
        
        <!-- Spotlight State -->
        <div v-if="selectedPharmacy" class="spotlight-header">
          <div class="spotlight-title">
            <h2>{{ selectedPharmacy.pharmacy_name }}</h2>
            <p>{{ selectedPharmacy.pharmacy_location }} <span v-if="selectedPharmacy.pharmacy_phone">&bull; {{ selectedPharmacy.pharmacy_phone }}</span></p>
          </div>
          <div class="spotlight-kpis">
            <div class="s-kpi">
              <label>Net Volume</label>
              <span>{{ formatCurrency(selectedPharmacy.total_earned) }}</span>
            </div>
            <div class="s-kpi">
              <label>Lines</label>
              <span>{{ selectedPharmacy.transaction_count }}</span>
            </div>
            <button class="btn-export" @click="() => {}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
          </div>
        </div>

        <div v-else class="spotlight-header">
          <div class="spotlight-title">
            <h2>Select a Pharmacy</h2>
            <p>Choose a pharmacy from the list to view its transaction ledger.</p>
          </div>
        </div>

        <!-- The Table -->
        <div class="table-container">
          <table class="financial-table">
            <thead>
              <tr>
                <th class="col-date">Date</th>
                <th class="col-ref">Ref / Customer</th>
                <th class="col-product">Product</th>
                <th class="col-qty">Qty</th>
                <th class="col-status">Status</th>
                <th class="col-amount">Amount</th>
              </tr>
            </thead>
            
            <tbody v-if="loading">
              <tr v-for="i in 5" :key="'skel'+i" class="skeleton-row">
                <td><div class="skel-box w-20"></div></td>
                <td><div class="skel-box w-32"></div><div class="skel-box w-24 mt-1"></div></td>
                <td><div class="skel-box w-40"></div></td>
                <td><div class="skel-box w-8"></div></td>
                <td><div class="skel-box w-16"></div></td>
                <td class="text-right"><div class="skel-box w-20 ms-auto"></div></td>
              </tr>
            </tbody>

            <tbody v-else-if="!selectedPharmacy">
              <tr>
                <td colspan="6" class="empty-table-state">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  <p>No pharmacy selected</p>
                </td>
              </tr>
            </tbody>

            <tbody v-else-if="transactions.length === 0">
              <tr>
                <td colspan="6" class="empty-table-state">
                  <p>No transactions found for this date range.</p>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="tx in transactions" :key="tx.transaction_id">
                <td class="col-date cell-muted">{{ formatDateTimeCompact(tx.transaction_date) }}</td>
                <td class="col-ref">
                  <span class="ref-code">{{ tx.request_number }}</span>
                  <span class="customer-name">{{ tx.customer_name || 'Anonymous' }}</span>
                </td>
                <td class="col-product">{{ tx.product_name }}</td>
                <td class="col-qty cell-muted">{{ tx.quantity }}</td>
                <td class="col-status">
                  <span class="status-dot" :class="'status-' + sanitizeStatus(tx.request_status)"></span>
                  {{ formatStatus(tx.request_status) }}
                </td>
                <td class="col-amount fw-numeric">{{ formatCurrency(tx.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'

definePageMeta({ middleware: ['admin-auth'], layout: 'admin-layout' })

interface PharmacyRow {
  pharmacy_id?: number | null
  pharmacy_name?: string | null
  pharmacy_location?: string | null
  total_earned?: number | null
  transaction_count?: number | null
  [key: string]: unknown
}

interface TransactionRow {
  [key: string]: unknown
}

interface LedgerSummary {
  total_earned?: number | null
  average_transaction_value?: number | null
  transaction_count?: number | null
  pharmacy_count?: number | null
  from_date?: string | null
  to_date?: string | null
  [key: string]: unknown
}

interface LedgerData {
  summary?: LedgerSummary | null
  pharmacies?: PharmacyRow[] | null
  selected_pharmacy?: PharmacyRow | null
  transactions?: TransactionRow[] | null
  [key: string]: unknown
}

const orderRequestsService = createOrderRequestsService(useApi())
const route = useRoute()
const router = useRouter()

const loading = ref<boolean>(false)
const error = ref<string>('')
const ledger = ref<LedgerData>({ summary: {}, pharmacies: [], selected_pharmacy: null, transactions: [] })
const searchQuery = ref<string>('')
const fromDate = ref<string>('')
const toDate = ref<string>('')
const selectedPharmacyId = ref<number | null>(null)
const quickRange = ref<string>('30d')
const applyingRange = ref<boolean>(false)

const ranges: Array<{ value: string; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'All' },
]

const summary = computed<LedgerSummary>(() => ledger.value.summary ?? {})
const pharmacies = computed<PharmacyRow[]>(() => Array.isArray(ledger.value.pharmacies) ? ledger.value.pharmacies : [])
const selectedPharmacy = computed<PharmacyRow | null>(() => ledger.value.selected_pharmacy ?? null)
const transactions = computed<TransactionRow[]>(() => Array.isArray(ledger.value.transactions) ? ledger.value.transactions : [])

const filteredPharmacies = computed<PharmacyRow[]>(() => {
  const term = searchQuery.value.trim().toLowerCase()
  if (!term) return pharmacies.value
  return pharmacies.value.filter((pharmacy) => {
    return [pharmacy.pharmacy_name, pharmacy.pharmacy_location]
      .some((value) => String(value ?? '').toLowerCase().includes(term))
  })
})

const formatCurrency = (value: number | null | undefined): string =>
  `GHS ${Number(value ?? 0).toFixed(2)}`

const prettyDate = (value: string | null | undefined): string => {
  if (!value) return 'All time'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateTimeCompact = (value: string | null | undefined): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatStatus = (value: string | null | undefined): string =>
  String(value ?? '').replace(/_/g, ' ')

const sanitizeStatus = (value: string | null | undefined): string =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '-')

const goBack = (): void => {
  void router.push('/admin/fulfillment/requests')
}

const applyQuickRange = (range: string): void => {
  applyingRange.value = true
  quickRange.value = range
  const now = new Date()
  const toInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (range === 'all') {
    fromDate.value = ''
    toDate.value = ''
    applyingRange.value = false
    return
  }

  toDate.value = toInput(now)
  const start = new Date(now)
  if (range === 'today') start.setDate(start.getDate())
  else if (range === '7d') start.setDate(start.getDate() - 6)
  else start.setDate(start.getDate() - 29)
  fromDate.value = toInput(start)
  applyingRange.value = false
}

const loadLedger = async ({ pharmacyId = null }: { pharmacyId?: number | null } = {}): Promise<void> => {
  loading.value = true
  error.value = ''
  try {
    const res = await orderRequestsService.getPharmacyLedger({
      pharmacyId: pharmacyId ?? selectedPharmacyId.value ?? undefined,
      startDate: fromDate.value || undefined,
      endDate: toDate.value || undefined,
      limit: 50,
    })
    ledger.value = (res.data as unknown as LedgerData) ?? { summary: {}, pharmacies: [], selected_pharmacy: null, transactions: [] }

    if (!selectedPharmacyId.value) {
      selectedPharmacyId.value =
        (ledger.value.selected_pharmacy?.pharmacy_id ?? ledger.value.pharmacies?.[0]?.pharmacy_id ?? null) as number | null
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load pharmacy ledger'
  } finally {
    loading.value = false
  }
}

const selectPharmacy = async (pharmacyId: number | null): Promise<void> => {
  selectedPharmacyId.value = pharmacyId
  await loadLedger({ pharmacyId })
}

watch([fromDate, toDate], () => {
  if (applyingRange.value) return
  if (quickRange.value !== 'all') quickRange.value = 'all'
})

onMounted(async () => {
  applyQuickRange(quickRange.value)
  if (route.query['fromDate']) fromDate.value = String(route.query['fromDate'])
  if (route.query['toDate']) toDate.value = String(route.query['toDate'])
  if (route.query['pharmacyId']) selectedPharmacyId.value = Number(route.query['pharmacyId'])
  await loadLedger()
})
</script>

<style scoped>
.pharmacy-ledger-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #111827;
  background: #f9fafb;
  min-height: 100vh;
}

/* --- Header --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.025em;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.header-btn--back, .header-btn--refresh {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.header-btn--back {
  background: #ffffff;
  border-color: #d1d5db;
  color: #374151;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.header-btn--back:hover {
  background: #f3f4f6;
}

.header-btn--refresh {
  background: #4f46e5;
  color: white;
  box-shadow: 0 1px 2px rgba(79, 70, 229, 0.2);
}
.header-btn--refresh:hover {
  background: #4338ca;
}
.header-btn--refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Top KPIs --- */
.kpi-banner {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.kpi-block {
  flex: 1;
  min-width: 250px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  position: relative;
}

.kpi-label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.kpi-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}
.kpi-value.kpi-date {
  font-size: 1.2rem;
}

.kpi-sub {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* --- Filter Bar --- */
.ledger-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.quick-ranges {
  display: flex;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 6px;
  gap: 0.25rem;
}

.range-btn {
  border: none;
  background: transparent;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.range-btn.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.range-btn:hover:not(.active) {
  color: #111827;
  background: rgba(255, 255, 255, 0.5);
}

.date-pickers {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.45rem 0.75rem;
  font-size: 0.875rem;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}

.date-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.date-sep {
  font-size: 0.875rem;
  color: #9ca3af;
}

.ledger-error {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 8px;
  font-size: 0.875rem;
}

/* --- Layout: Sidebar + Main --- */
.ledger-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.sidebar-panel {
  width: 320px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 800px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fdfdfd;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #fff;
  transition: border-color 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.pharmacy-list {
  flex: 1;
  overflow-y: auto;
}

.pharmacy-list-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.pharmacy-list-item:hover {
  background: #f9fafb;
}
.pharmacy-list-item.active {
  background: #eff6ff;
  border-left: 3px solid #4f46e5;
  padding-left: calc(1rem - 3px);
}

.pli-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pli-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;
}

.pli-loc {
  font-size: 0.75rem;
  color: #6b7280;
}

.pli-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.pli-earned {
  font-weight: 700;
  font-size: 0.875rem;
  color: #059669; /* Green for money */
}

.pli-txns {
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-muted {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* --- Main Panel (Right) --- */
.main-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
}

.spotlight-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fdfdfd;
}

.spotlight-title h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.spotlight-title p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.spotlight-kpis {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.s-kpi label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.s-kpi span {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 1rem;
}
.btn-export:hover {
  background: #f3f4f6;
}
.btn-export svg {
  color: #6b7280;
}

/* --- Data Table --- */
.table-container {
  overflow-x: auto;
}

.financial-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.financial-table th {
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.financial-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.financial-table tbody tr {
  transition: background 0.15s;
}

.financial-table tbody tr:hover {
  background: #f9fafb;
}

.col-date { width: 120px; }
.col-qty { width: 60px; text-align: center; }
.col-status { width: 120px; }
.col-amount { width: 120px; text-align: right; }

.financial-table th.col-qty,
.financial-table th.col-amount {
  text-align: right;
}
.financial-table td.col-qty {
  text-align: right;
}

.ref-code {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.2rem;
}

.customer-name {
  display: block;
  font-weight: 500;
  color: #111827;
}

.cell-muted {
  color: #6b7280;
}

.fw-numeric {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #111827;
}

/* Status Dots */
.col-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  text-transform: capitalize;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db; /* default grey */
}
.status-paid { background: #10b981; } /* Emerald */
.status-pending { background: #f59e0b; } /* Amber */
.status-cancelled, .status-failed { background: #ef4444; } /* Red */
.status-processing { background: #3b82f6; } /* Blue */

/* --- Loading Skeletons --- */
.empty-table-state {
  text-align: center;
  padding: 4rem 1rem !important;
  color: #6b7280;
}
.empty-table-state svg {
  margin-bottom: 1rem;
  color: #9ca3af;
}

.skeleton-row td {
  padding: 1rem 1.5rem;
}

.skel-box {
  height: 1rem;
  background: #e5e7eb;
  border-radius: 4px;
  animation: pulse 1.5s infinite ease-in-out;
}
.w-8 { width: 2rem; }
.w-16 { width: 4rem; }
.w-20 { width: 5rem; }
.w-24 { width: 6rem; }
.w-32 { width: 8rem; }
.w-40 { width: 10rem; }
.mt-1 { margin-top: 0.25rem; }
.ms-auto { margin-left: auto; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (max-width: 1024px) {
  .ledger-layout {
    flex-direction: column;
  }
  .sidebar-panel {
    width: 100%;
    max-height: 400px;
  }
}
@media (max-width: 640px) {
  .kpi-banner {
    flex-direction: column;
  }
  .spotlight-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .spotlight-kpis {
    width: 100%;
    flex-wrap: wrap;
  }
  .btn-export {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}
</style>



