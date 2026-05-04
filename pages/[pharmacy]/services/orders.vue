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
    <div v-if="loading" class="py-12 text-center text-gray-400">Loading orders...</div>

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
            <div class="text-xs text-gray-400 mt-1">{{ formatDate(order.created_at) }}</div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-semibold text-green-600">GH₵{{ fmt(order.pharmacy_total) }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ order.item_count }} item(s)</div>
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
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">Order Request</p>
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
              <span class="text-gray-500">Date</span>
              <span class="text-gray-800">{{ formatDate(detailOrder?.created_at) }}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="flex-1 overflow-y-auto p-5">
            <div v-if="detailLoading" class="py-12 text-center text-gray-400 text-sm">Loading items...</div>

            <div v-else-if="detailItems.length === 0" class="py-8 text-center text-gray-400 text-sm">
              No items found for this order.
            </div>

            <div v-else class="space-y-3">
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Items ({{ detailItems.length }})</p>
              <div
                v-for="item in detailItems" :key="item.id"
                class="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ item.resolved_name || item.product_name }}</p>
                    <p v-if="item.requested_unit" class="text-xs text-gray-400 mt-0.5">{{ item.requested_unit }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" :class="sourcingClass(item.sourcing_status)">
                    {{ item.sourcing_status?.replace(/_/g, ' ') || 'pending' }}
                  </span>
                </div>

                <div class="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <p class="text-gray-400">Qty</p>
                    <p class="font-medium">{{ item.quantity }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400">Unit price</p>
                    <p class="font-medium">{{ item.unit_price != null ? 'GH₵' + fmt(item.unit_price) : '—' }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400">Total</p>
                    <p class="font-medium text-green-700">{{ item.line_total != null ? 'GH₵' + fmt(item.line_total) : '—' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer total -->
          <div v-if="!detailLoading && detailItems.length > 0" class="border-t border-gray-200 px-5 py-4 flex items-center justify-between">
            <span class="text-sm text-gray-500">Your total</span>
            <span class="text-base font-bold text-green-700">GH₵{{ fmt(detailItems.reduce((s, i) => s + parseFloat(i.line_total || 0), 0)) }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company'
})

const companyStore = useCompanyStore()

const loading = ref(true)
const orders = ref([])
const activeTab = ref('all')

const detailOpen = ref(false)
const detailOrder = ref(null)
const detailItems = ref([])
const detailLoading = ref(false)

const STATUS_GROUPS = {
  processing: new Set([
    'composing', 'sourcing', 'enquiry_sent', 'partially_available',
    'confirming_with_pharm', 'confirmed_in_pharm', 'awaiting_input', 'awaiting_customer'
  ]),
  awaiting_payment: new Set(['payment_pending']),
  fulfillment: new Set([
    'paid', 'preparing', 'out_for_delivery', 'in_transit',
    'ready_for_pickup', 'picking_up', 'picked_up'
  ]),
  completed: new Set(['delivered', 'completed', 'returned']),
}

const tabs = [
  { label: 'All Active', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Awaiting Payment', value: 'awaiting_payment' },
  { label: 'Fulfillment', value: 'fulfillment' },
  { label: 'Completed', value: 'completed' },
]

const filtered = computed(() => {
  if (activeTab.value === 'all') return orders.value
  const group = STATUS_GROUPS[activeTab.value]
  return group ? orders.value.filter(o => group.has(o.status)) : orders.value
})

const statusClass = (status) => {
  const map = {
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
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const sourcingClass = (status) => {
  const map = {
    allocated: 'bg-green-100 text-green-700',
    partially_allocated: 'bg-yellow-100 text-yellow-700',
    unavailable: 'bg-red-100 text-red-600',
    substitute_proposed: 'bg-purple-100 text-purple-700',
    pending: 'bg-gray-100 text-gray-500',
  }
  return map[status] || 'bg-gray-100 text-gray-500'
}

const fmt = (val) => parseFloat(val || 0).toFixed(2)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

const openDetail = async (order) => {
  detailOrder.value = order
  detailItems.value = []
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await companyStore.makeAuthRequest(`/api/pharmacy-portal/orders/${order.id}`)
    if (res.success) {
      detailOrder.value = res.order || order
      detailItems.value = res.items || []
    }
  } catch (e) {
    console.error('Failed to fetch order detail', e)
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => {
  detailOpen.value = false
  detailOrder.value = null
  detailItems.value = []
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await companyStore.makeAuthRequest('/api/pharmacy-portal/orders')
    if (res.success) orders.value = res.orders || []
  } catch (e) {
    console.error('Failed to fetch orders', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)
</script>
