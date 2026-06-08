<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Order Requests</h1>
        <p class="text-sm text-gray-500 mt-1">Orders where your pharmacy is supplying items</p>
      </div>
      <button @click="fetchOrders" class="text-sm cs-text hover:underline">Refresh</button>
    </div>

    <!-- Status filter tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-6">
        <button
          v-for="tab in tabs" :key="tab.value"
          @click="activeTab = tab.value"
          class="pb-3 text-sm font-medium border-b-2 transition whitespace-nowrap"
          :class="activeTab === tab.value
            ? 'cs-border cs-text'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-500">Loading orders...</div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
      No orders in this category.
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="order in filtered" :key="order.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
        @click="openDetail(order)"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-gray-900">{{ order.request_number }}</div>
            <div class="text-sm text-gray-500 mt-0.5">{{ order.customer_address }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ formatDate(order.created_at) }}</div>
            <div v-if="isAwaitingMethodSelection(order)" class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-semibold text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Awaiting customer payment — do not prep yet
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-semibold text-green-600">GH₵{{ fmt(order.pharmacy_total) }}</div>
            <div class="text-xs text-gray-500 mt-0.5">{{ order.item_count }} item(s)</div>
            <span class="mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full" :class="statusClass(order.status)">
              {{ order.status?.replace(/_/g, ' ') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail slide-over -->
    <Teleport to="body">
      <div
        v-if="detailOpen"
        class="fixed inset-0 z-50 flex"
        @click.self="closeDetail"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30" @click="closeDetail" />

        <!-- Panel -->
        <div class="relative ml-auto h-full w-full max-w-lg bg-white shadow-xl flex flex-col">

          <!-- Header -->
          <div class="flex items-start justify-between p-5 border-b border-gray-200">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Order Request</p>
              <h2 class="text-lg font-bold text-gray-900 mt-0.5">{{ detailOrder?.request_number }}</h2>
            </div>
            <button @click="closeDetail" class="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Meta -->
          <div class="px-5 py-4 bg-gray-50 border-b border-gray-200 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Status</span>
              <span class="font-medium px-2 py-0.5 rounded-full text-xs" :class="statusClass(detailOrder?.status)">
                {{ detailOrder?.status?.replace(/_/g, ' ') }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Delivery address</span>
              <span class="text-gray-800 text-right max-w-xs">{{ detailOrder?.customer_address || '—' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Customer</span>
              <span class="text-gray-800">{{ detailOrder?.customer_name || '—' }}</span>
            </div>
            <div v-if="detailOrder?.customer_phone" class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Customer phone</span>
              <a :href="`tel:${detailOrder.customer_phone}`" class="text-gray-800 hover:underline">{{ detailOrder.customer_phone }}</a>
            </div>
            <div v-if="detailOrder?.driver_name" class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Driver</span>
              <span class="text-gray-800">{{ detailOrder.driver_name }}</span>
            </div>
            <div v-if="detailOrder?.driver_phone" class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Driver phone</span>
              <a :href="`tel:${detailOrder.driver_phone}`" class="text-gray-800 hover:underline">{{ detailOrder.driver_phone }}</a>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Date</span>
              <span class="text-gray-800">{{ formatDate(detailOrder?.created_at) }}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="flex-1 overflow-y-auto p-5">
            <div v-if="detailLoading" class="py-12 text-center text-gray-500 text-sm">Loading items...</div>

            <div v-else-if="detailItems.length === 0" class="py-8 text-center text-gray-500 text-sm">
              No items found for this order.
            </div>

            <div v-else class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Items ({{ detailItems.length }})</p>
              <div
                v-for="item in detailItems" :key="item.id"
                class="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.resolved_name || item.product_name }}</p>
                    <p v-if="item.requested_unit" class="text-xs text-gray-500 mt-0.5">{{ item.requested_unit }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" :class="sourcingClass(item.sourcing_status)">
                    {{ item.sourcing_status?.replace(/_/g, ' ') || 'pending' }}
                  </span>
                </div>

                <div class="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <p class="text-gray-500">Qty</p>
                    <p class="font-medium">{{ item.quantity }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Unit price</p>
                    <p class="font-medium">{{ item.unit_price != null ? 'GH₵' + fmt(item.unit_price) : '—' }}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Total</p>
                    <p class="font-medium text-green-700">{{ item.line_total != null ? 'GH₵' + fmt(item.line_total) : '—' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer total + print -->
          <div v-if="!detailLoading && detailItems.length > 0" class="border-t border-gray-200 px-5 py-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Your total</span>
              <span class="text-base font-bold text-green-700">GH₵{{ fmt(detailItems.reduce((s, i) => s + parseFloat(String(i.line_total || 0)), 0)) }}</span>
            </div>
            <button
              @click="printReceipt"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Print receipt — hidden in browser, shown only on print -->
    <Teleport to="body">
      <div v-if="detailOpen && !detailLoading && detailItems.length > 0" id="order-print-receipt">
        <div class="receipt-page">
          <!-- Header -->
          <div class="receipt-header">
            <p class="receipt-pharmacy-name">{{ pharmacyName }}</p>
            <p v-for="(phone, idx) in pharmacyPhones" :key="idx" class="receipt-pharmacy-phone">
              {{ idx === 0 ? 'Tel' : idx === 1 ? 'Tel 2' : 'WhatsApp' }}: {{ phone }}
            </p>
            <p class="receipt-title">ORDER RECEIPT</p>
          </div>

          <!-- Order meta -->
          <div class="receipt-section">
            <div class="receipt-row">
              <span>Order</span>
              <span>{{ detailOrder?.request_number }}</span>
            </div>
            <div class="receipt-row">
              <span>Date</span>
              <span>{{ formatDate(detailOrder?.created_at) }}</span>
            </div>
            <div class="receipt-row">
              <span>Status</span>
              <span>{{ detailOrder?.status?.replace(/_/g, ' ')?.toUpperCase() }}</span>
            </div>
          </div>

          <!-- Customer -->
          <div class="receipt-section">
            <p class="receipt-section-label">CUSTOMER</p>
            <div class="receipt-row">
              <span>Name</span>
              <span>{{ detailOrder?.customer_name || '—' }}</span>
            </div>
            <div v-if="detailOrder?.customer_phone" class="receipt-row">
              <span>Phone</span>
              <span>{{ detailOrder.customer_phone }}</span>
            </div>
            <div v-if="detailOrder?.customer_address" class="receipt-row receipt-row-wrap">
              <span>Address</span>
              <span>{{ detailOrder.customer_address }}</span>
            </div>
          </div>

          <!-- Driver (if assigned) -->
          <div v-if="detailOrder?.driver_name" class="receipt-section">
            <p class="receipt-section-label">DRIVER</p>
            <div class="receipt-row">
              <span>Name</span>
              <span>{{ detailOrder.driver_name }}</span>
            </div>
            <div v-if="detailOrder?.driver_phone" class="receipt-row">
              <span>Phone</span>
              <span>{{ detailOrder.driver_phone }}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="receipt-section">
            <p class="receipt-section-label">ITEMS</p>
            <table class="receipt-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detailItems" :key="item.id">
                  <td>{{ item.resolved_name || item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit_price != null ? 'GH₵' + fmt(item.unit_price) : '—' }}</td>
                  <td>{{ item.line_total != null ? 'GH₵' + fmt(item.line_total) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Delivery fee (delivery orders only) -->
          <div v-if="detailOrder?.fulfillment_type === 'delivery'" class="receipt-subtotals">
            <div class="receipt-row">
              <span>Items subtotal</span>
              <span>GH₵{{ fmt(detailItems.reduce((s, i) => s + parseFloat(String(i.line_total || 0)), 0)) }}</span>
            </div>
            <div class="receipt-row">
              <span>Delivery fee</span>
              <span>GH₵{{ fmt(detailOrder?.delivery_fee ?? 0) }}</span>
            </div>
          </div>

          <!-- Total -->
          <div class="receipt-total">
            <span>TOTAL</span>
            <span v-if="detailOrder?.fulfillment_type === 'delivery'">
              GH₵{{ fmt(detailItems.reduce((s, i) => s + parseFloat(String(i.line_total || 0)), 0) + parseFloat(String(detailOrder?.delivery_fee ?? 0))) }}
            </span>
            <span v-else>GH₵{{ fmt(detailItems.reduce((s, i) => s + parseFloat(String(i.line_total || 0)), 0)) }}</span>
          </div>

          <!-- Footer -->
          <div class="receipt-footer">
            <p>Thank you for your service!</p>
            <p>Powered by MedsGH</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
})

interface OrderRow {
  id: number | string
  request_number?: string | null
  customer_address?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  driver_name?: string | null
  driver_phone?: string | null
  created_at?: string | null
  status?: string | null
  pharmacy_total?: number | string | null
  item_count?: number | null
  fulfillment_type?: 'delivery' | 'pickup' | null
  delivery_fee?: number | string | null
}

interface OrderItem {
  id: number | string
  resolved_name?: string | null
  product_name?: string | null
  requested_unit?: string | null
  sourcing_status?: string | null
  quantity?: number | null
  unit_price?: number | string | null
  line_total?: number | string | null
}

interface OrderDetailResponse {
  success?: boolean
  order?: OrderRow | null
  items?: OrderItem[] | null
}

interface OrdersResponse {
  success?: boolean
  orders?: OrderRow[] | null
}

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  makeAuthRequest: (url: string, options?: RequestInit) => Promise<OrderDetailResponse & OrdersResponse>
  currentCompany?: { name?: string | null; tel1?: string | null; tel2?: string | null; whatsapp_number?: string | null } | null
}

const pharmacyName = computed<string>(() => companyStore.currentCompany?.name ?? 'Pharmacy')
const pharmacyPhones = computed<string[]>(() => {
  const c = companyStore.currentCompany
  return [c?.tel1, c?.tel2, c?.whatsapp_number].filter((v): v is string => !!v)
})

const loading = ref<boolean>(true)
const orders = ref<OrderRow[]>([])
const activeTab = ref<string>('all')

const detailOpen = ref<boolean>(false)
const detailOrder = ref<OrderRow | null>(null)
const detailItems = ref<OrderItem[]>([])
const detailLoading = ref<boolean>(false)

const STATUS_GROUPS: Record<string, Set<string>> = {
  processing: new Set([
    'composing', 'sourcing', 'enquiry_sent', 'partially_available',
    'confirming_with_pharm', 'confirmed_in_pharm', 'awaiting_input', 'awaiting_customer',
  ]),
  awaiting_payment: new Set(['payment_pending']),
  fulfillment: new Set([
    'paid', 'preparing', 'out_for_delivery', 'in_transit',
    'ready_for_pickup', 'picking_up', 'picked_up',
  ]),
  completed: new Set(['delivered', 'completed', 'returned']),
}

const tabs: Array<{ label: string; value: string }> = [
  { label: 'All Active', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Awaiting Payment', value: 'awaiting_payment' },
  { label: 'Fulfillment', value: 'fulfillment' },
  { label: 'Completed', value: 'completed' },
]

const filtered = computed<OrderRow[]>(() => {
  if (activeTab.value === 'all') return orders.value
  const group = activeTab.value !== 'all' ? STATUS_GROUPS[activeTab.value] : undefined
  return group ? orders.value.filter(o => group.has(o.status ?? '')) : orders.value
})

const statusClass = (status: string | null | undefined): string => {
  const map: Record<string, string> = {
    processing: 'cs-badge',
    awaiting_payment: 'bg-yellow-100 text-yellow-700',
    payment_confirmed: 'bg-purple-100 text-purple-700',
    fulfillment_in_progress: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    composing: 'cs-badge',
    sourcing: 'cs-badge',
    payment_pending: 'bg-yellow-100 text-yellow-700',
    awaiting_method_selection: 'bg-amber-100 text-amber-800',
  }
  if (status === undefined || status === null) return 'bg-gray-100 text-gray-700'
  return (status !== undefined ? map[status] : undefined) ?? 'bg-gray-100 text-gray-700'
}

const isAwaitingMethodSelection = (order: OrderRow | null | undefined): boolean => {
  if (!order) return false
  return String(order.status ?? '').toLowerCase() === 'awaiting_method_selection'
}

const sourcingClass = (status: string | null | undefined): string => {
  const map: Record<string, string> = {
    allocated: 'bg-green-100 text-green-700',
    partially_allocated: 'bg-yellow-100 text-yellow-700',
    unavailable: 'bg-red-100 text-red-600',
    substitute_proposed: 'bg-purple-100 text-purple-700',
    pending: 'bg-gray-100 text-gray-500',
  }
  if (status === undefined || status === null) return 'bg-gray-100 text-gray-500'
  return (status !== undefined ? map[status] : undefined) ?? 'bg-gray-100 text-gray-500'
}

const fmt = (val: number | string | null | undefined): string =>
  parseFloat(String(val ?? 0) || '0').toFixed(2)

const formatDate = (d: string | null | undefined): string => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

const openDetail = async (order: OrderRow): Promise<void> => {
  detailOrder.value = order
  detailItems.value = []
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await companyStore.makeAuthRequest(`/api/pharmacy-portal/orders/${String(order.id)}`)
    if (res.success) {
      detailOrder.value = res.order ?? order
      detailItems.value = res.items ?? []
    }
  } catch (e) {
    console.error('Failed to fetch order detail', e)
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = (): void => {
  detailOpen.value = false
  detailOrder.value = null
  detailItems.value = []
}

const printReceipt = (): void => {
  window.print()
}

const fetchOrders = async (): Promise<void> => {
  loading.value = true
  try {
    const res = await companyStore.makeAuthRequest('/api/pharmacy-portal/orders')
    if (res.success) orders.value = res.orders ?? []
  } catch (e) {
    console.error('Failed to fetch orders', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { void fetchOrders() })
</script>

<style>
/* Hide receipt in normal browser view */
#order-print-receipt {
  display: none;
}

/* On print: hide the entire app, show only the receipt */
@media print {
  body * {
    visibility: hidden;
  }
  #order-print-receipt,
  #order-print-receipt * {
    visibility: visible;
  }
  #order-print-receipt {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}

/* Receipt layout */
.receipt-page {
  max-width: 380px;
  margin: 0 auto;
  padding: 24px 20px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: #111;
}
.receipt-header {
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px dashed #555;
  margin-bottom: 12px;
}
.receipt-pharmacy-name {
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.receipt-pharmacy-phone {
  font-size: 12px;
  margin-top: 2px;
}
.receipt-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  margin-top: 8px;
}
.receipt-section {
  padding: 10px 0;
  border-bottom: 1px dashed #bbb;
}
.receipt-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #555;
  margin-bottom: 6px;
}
.receipt-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}
.receipt-row-wrap {
  align-items: flex-start;
}
.receipt-row-wrap span:last-child {
  text-align: right;
  max-width: 220px;
}
.receipt-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.receipt-items-table th {
  text-align: left;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #555;
  padding-bottom: 4px;
  border-bottom: 1px solid #bbb;
}
.receipt-items-table th:not(:first-child),
.receipt-items-table td:not(:first-child) {
  text-align: right;
}
.receipt-items-table td {
  padding: 4px 0;
  vertical-align: top;
}
.receipt-items-table td:first-child {
  padding-right: 8px;
}
.receipt-subtotals {
  padding: 8px 0 4px;
  border-top: 1px dashed #bbb;
}
.receipt-subtotals .receipt-row {
  font-size: 12px;
  color: #444;
}
.receipt-total {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 0 8px;
  border-top: 1px dashed #bbb;
  border-bottom: 2px solid #111;
  letter-spacing: 0.05em;
}
.receipt-footer {
  text-align: center;
  font-size: 11px;
  color: #666;
  padding-top: 12px;
  line-height: 1.6;
}
</style>
