<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Order Requests</h1>
        <p class="text-sm text-gray-500 mt-1">Orders where your pharmacy is supplying items</p>
      </div>
      <button @click="fetchOrders" class="text-sm text-blue-600 hover:underline">Refresh</button>
    </div>

    <!-- Status filter tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-6">
        <button
          v-for="tab in tabs" :key="tab.value"
          @click="activeTab = tab.value"
          class="pb-3 text-sm font-medium border-b-2 transition whitespace-nowrap"
          :class="activeTab === tab.value
            ? 'border-blue-600 text-blue-600'
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
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
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
    processing: 'bg-blue-100 text-blue-700',
    awaiting_payment: 'bg-yellow-100 text-yellow-700',
    payment_confirmed: 'bg-purple-100 text-purple-700',
    fulfillment_in_progress: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const fmt = (val) => parseFloat(val || 0).toFixed(2)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
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
