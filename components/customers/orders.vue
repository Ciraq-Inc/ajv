<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5d4679]">History</p>
        <h2 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A] mt-0.5">Order History</h2>
        <p class="text-sm font-medium text-zinc-600 mt-1">Your complete order and request fulfillment history.</p>
      </div>
      <div class="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
        <span class="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500">Total</span>
        <strong class="text-lg font-black text-zinc-900">{{ mergedItems.length }}</strong>
      </div>
    </div>

    <!-- Status filter -->
    <div class="flex items-center gap-3 mb-5">
      <span class="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">Filter</span>
      <select v-model="selectedStatus"
        class="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 cursor-pointer">
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="in_transit">In Transit</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-8 shadow-sm">
      <span class="material-symbols-outlined text-2xl text-zinc-400 animate-spin">sync</span>
      <p class="text-sm font-medium text-zinc-500">Loading your history...</p>
    </div>

    <!-- ─── Merged Timeline ─── -->
    <section v-else class="space-y-2">
      <div v-if="filteredItems.length === 0" class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <span class="material-symbols-outlined">receipt_long</span>
        </div>
        <div>
          <p class="font-black text-zinc-800">No history yet</p>
          <p class="text-sm font-medium text-zinc-500">Your orders and fulfilled requests will appear here.</p>
        </div>
      </div>

      <template v-else>
        <article v-for="item in filteredItems" :key="item._key"
          class="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3.5 hover:border-zinc-200 hover:-translate-y-px transition-all cursor-pointer"
          @click="item._type === 'store' ? viewOrder(item) : viewRequestOrder(item)"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="item._type === 'store' ? orderIconClass(item.status) : 'bg-[#f4e8fb] text-[#5e3a86]'">
              <span class="material-symbols-outlined text-[18px]">{{ item._type === 'store' ? 'shopping_bag' : 'package_2' }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm font-semibold text-zinc-900 truncate">{{ item._displayId }}</h4>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.08em] flex-shrink-0"
                  :class="item._type === 'store' ? 'bg-zinc-100 text-zinc-500' : 'bg-[#f4e8fb] text-[#5e3a86]'">
                  {{ item._type === 'store' ? 'Store' : 'Request' }}
                </span>
              </div>
              <p class="text-xs text-zinc-400 mt-0.5">{{ item._date }}<span v-if="item._meta"> · {{ item._meta }}</span></p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="text-right">
              <strong class="text-sm font-black text-zinc-900">GHS {{ item._amount }}</strong>
              <div class="flex justify-end mt-0.5">
                <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                  :class="item._type === 'store' ? orderStatusClass(item.status) : requestOrderStatusClass(item.status)">
                  {{ item._type === 'store' ? formatStatus(item.status) : formatRequestStatus(item.status) }}
                </span>
              </div>
            </div>
            <button v-if="item._type === 'store' && item.status === 'pending'" @click.stop="confirmCancelOrder(item)"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </article>
      </template>
    </section>

    <!-- ─── Store Order Detail Modal ─── -->
    <div v-if="selectedOrder" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4" @click.self="selectedOrder = null">
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 class="font-black text-zinc-900 tracking-tight">Order Details</h3>
          <button @click="selectedOrder = null" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Order ID</p><p class="font-semibold text-zinc-900 mt-0.5 truncate">{{ selectedOrder.order_id }}</p></div>
            <div><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Date</p><p class="font-semibold text-zinc-900 mt-0.5">{{ formatDate(selectedOrder.created_at) }}</p></div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Status</p>
              <span class="inline-flex rounded-full mt-1 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]" :class="orderStatusClass(selectedOrder.status)">{{ formatStatus(selectedOrder.status) }}</span>
            </div>
          </div>

          <div class="border-t border-zinc-100 pt-4">
            <h4 class="text-sm font-black text-zinc-800 mb-3">Order Items</h4>
            <div v-for="(item, index) in selectedOrder.items" :key="index" class="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
              <div>
                <p class="text-sm font-semibold text-zinc-900">{{ item.brand_name || item.product_name }}</p>
                <p class="text-xs text-zinc-500">Qty: {{ item.qty }} · GHS {{ item.selling_price }}</p>
              </div>
              <p class="text-sm font-black text-zinc-900">GHS {{ formatAmount(item.line_total) }}</p>
            </div>
          </div>

          <div class="bg-zinc-50 rounded-xl p-4 space-y-2">
            <div class="flex justify-between text-sm text-zinc-600"><span>Subtotal</span><span>GHS {{ formatAmount(selectedOrder.subtotal || selectedOrder.total_amount) }}</span></div>
            <div class="flex justify-between text-sm text-zinc-600"><span>Tax</span><span>GHS {{ formatAmount(selectedOrder.tax_amount || 0) }}</span></div>
            <div class="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200"><span>Total</span><span>GHS {{ formatAmount(selectedOrder.total_amount) }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Request Order Detail Modal ─── -->
    <div v-if="selectedRequestOrder" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4" @click.self="selectedRequestOrder = null">
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 class="font-black text-zinc-900 tracking-tight">Request Order Details</h3>
          <button @click="selectedRequestOrder = null" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Request #</p><p class="font-semibold text-zinc-900 mt-0.5">{{ selectedRequestOrder.request_number }}</p></div>
            <div><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Date</p><p class="font-semibold text-zinc-900 mt-0.5">{{ formatDate(selectedRequestOrder.updated_at || selectedRequestOrder.created_at) }}</p></div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Status</p>
              <span class="inline-flex rounded-full mt-1 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]" :class="requestOrderStatusClass(selectedRequestOrder.status)">{{ formatRequestStatus(selectedRequestOrder.status) }}</span>
            </div>
            <div v-if="selectedRequestOrder.fulfillment_type"><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Fulfillment</p><p class="font-semibold text-zinc-900 mt-0.5 capitalize">{{ selectedRequestOrder.fulfillment_type }}</p></div>
          </div>

          <div class="border-t border-zinc-100 pt-4">
            <h4 class="text-sm font-black text-zinc-800 mb-3">Request Items</h4>
            <div v-for="(item, index) in selectedRequestOrder.items || []" :key="index" class="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
              <div>
                <p class="text-sm font-semibold text-zinc-900">{{ item.product_name }}</p>
                <p class="text-xs text-zinc-500">Qty: {{ item.quantity }} · GHS {{ formatAmount(item.marked_up_price || item.unit_price || 0) }}</p>
              </div>
              <p class="text-sm font-black text-zinc-900">GHS {{ formatAmount(item.line_total || ((item.marked_up_price || item.unit_price || 0) * (item.quantity || 0))) }}</p>
            </div>
          </div>

          <div class="bg-zinc-50 rounded-xl p-4 space-y-2">
            <div class="flex justify-between text-sm text-zinc-600"><span>Items total</span><span>GHS {{ formatAmount(selectedRequestOrder.items_total || 0) }}</span></div>
            <div v-if="selectedRequestOrder.delivery_fee" class="flex justify-between text-sm text-zinc-600"><span>Delivery fee</span><span>GHS {{ formatAmount(selectedRequestOrder.delivery_fee || 0) }}</span></div>
            <div class="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200"><span>Total</span><span>GHS {{ formatAmount(getRequestTotalAmount(selectedRequestOrder)) }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';

const props = defineProps({
  initialOrderId: { type: String, default: null }
});

const userStore = useUserStore();
const config = useRuntimeConfig();

// State
const isLoading = ref(false);
const orders = ref([]);
const paidRequests = ref([]);
const selectedOrder = ref(null);
const selectedRequestOrder = ref(null);
const selectedStatus = ref('');
const POLL_INTERVAL_MS = 15000;
let pollTimer = null;
const paidRequestStatuses = new Set([
  'paid',
  'logistics_pending',
  'driver_unavailable',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered'
]);

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format status
const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'completed': 'Completed',
    'delivered': 'Completed',
    'picked_up': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

// Tailwind class helpers for status badges
const orderStatusClass = (status) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-[#f4e8fb] text-[#5e3a86]',
    shipped: 'bg-[#e8f0fe] text-[#2856c3]',
    completed: 'bg-[#e7f7ea] text-[#228847]',
    delivered: 'bg-[#e7f7ea] text-[#228847]',
    picked_up: 'bg-[#e7f7ea] text-[#228847]',
    cancelled: 'bg-red-50 text-red-600'
  };
  return map[status] || 'bg-zinc-100 text-zinc-600';
};

const orderIconClass = (status) => {
  const map = {
    pending: 'bg-amber-50 text-amber-600',
    processing: 'bg-[#e8f0fe] text-[#2856c3]',
    shipped: 'bg-[#e8f0fe] text-[#2856c3]',
    completed: 'bg-[#edf9ef] text-[#1d9154]',
    delivered: 'bg-[#edf9ef] text-[#1d9154]',
    picked_up: 'bg-[#edf9ef] text-[#1d9154]',
    cancelled: 'bg-[#fff0f1] text-[#d14b5c]'
  };
  return map[status] || 'bg-zinc-100 text-zinc-500';
};

const requestOrderStatusClass = (status) => {
  const normalized = ['picked_up', 'delivered'].includes(status) ? 'completed' : status;
  const map = {
    paid: 'bg-[#f4e8fb] text-[#5e3a86]',
    logistics_pending: 'bg-[#f4e8fb] text-[#5e3a86]',
    driver_unavailable: 'bg-red-50 text-red-600',
    ready_for_pickup: 'bg-[#e8f0fe] text-[#2856c3]',
    out_for_delivery: 'bg-[#e8f0fe] text-[#2856c3]',
    completed: 'bg-[#e7f7ea] text-[#228847]',
    returned: 'bg-red-50 text-red-600',
    cancelled: 'bg-red-50 text-red-600'
  };
  return map[normalized] || 'bg-zinc-100 text-zinc-600';
};

// Format amount
const formatAmount = (amount) => {
  return parseFloat(amount || 0).toFixed(2);
};

const requestApiCall = async (method, url) => {
  const response = await fetch(`${config.public.apiBase}${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${userStore.customerAuthToken}`,
      'Content-Type': 'application/json'
    }
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed (${response.status})`);
  }
  return json;
};

const formatRequestStatus = (status) => {
  const normalized = ['picked_up', 'delivered'].includes(status) ? 'completed' : status;
  const statusMap = {
    paid: 'Paid',
    logistics_pending: 'Logistics Pending',
    driver_unavailable: 'Driver Unavailable',
    ready_for_pickup: 'Ready For Pickup',
    out_for_delivery: 'Out For Delivery',
    completed: 'Completed',
    returned: 'Returned',
    cancelled: 'Cancelled'
  };
  return statusMap[normalized] || (normalized || '').replace(/_/g, ' ');
};

const getRequestStatusClass = (status) => {
  const normalized = ['picked_up', 'delivered'].includes(status) ? 'completed' : status;
  const classes = {
    paid: 'status-processing',
    logistics_pending: 'status-processing',
    driver_unavailable: 'status-cancelled',
    ready_for_pickup: 'status-shipped',
    out_for_delivery: 'status-shipped',
    completed: 'status-delivered',
    returned: 'status-cancelled',
    cancelled: 'status-cancelled'
  };
  return classes[normalized] || 'status-default';
};

const getRequestTotalAmount = (request) => {
  if (!request) return 0;
  const estimated = Number(request.estimated_total);
  if (Number.isFinite(estimated) && estimated > 0) return estimated;
  const itemsTotal = Number(request.items_total || 0);
  const deliveryFee = Number(request.delivery_fee || 0);
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0);
};

const mergedItems = computed(() => {
  const storeItems = orders.value.map(o => ({
    ...o,
    _type: 'store',
    _key: `store-${o.order_id}`,
    _displayId: `Order #${String(o.order_id).substring(0, 8)}`,
    _date: formatDate(o.created_at || o.order_date),
    _sortDate: new Date(o.created_at || o.order_date).getTime() || 0,
    _meta: o.company_name || null,
    _amount: formatAmount(o.total_amount)
  }))

  const requestItems = paidRequests.value.map(r => ({
    ...r,
    _type: 'request',
    _key: `req-${r.id}`,
    _displayId: `Request #${r.request_number}`,
    _date: formatDate(r.updated_at || r.created_at),
    _sortDate: new Date(r.updated_at || r.created_at).getTime() || 0,
    _meta: r.fulfillment_type ? (r.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup') : null,
    _amount: formatAmount(getRequestTotalAmount(r))
  }))

  return [...storeItems, ...requestItems].sort((a, b) => b._sortDate - a._sortDate)
})

const storeStatusMap = {
  active: ['pending', 'processing'],
  in_transit: ['shipped'],
  completed: ['completed', 'delivered', 'picked_up'],
  cancelled: ['cancelled']
}

const requestStatusMap = {
  active: ['paid', 'logistics_pending'],
  in_transit: ['out_for_delivery', 'ready_for_pickup'],
  completed: ['delivered', 'picked_up', 'completed'],
  cancelled: ['cancelled', 'driver_unavailable', 'returned']
}

const filteredItems = computed(() => {
  if (!selectedStatus.value) return mergedItems.value
  return mergedItems.value.filter(item => {
    const matchSet = item._type === 'store' ? storeStatusMap[selectedStatus.value] : requestStatusMap[selectedStatus.value]
    return matchSet ? matchSet.includes(item.status) : false
  })
})

const fetchPaidRequests = async () => {
  const res = await requestApiCall('GET', '/api/order-requests/customer?limit=100');
  return (res.data || []).filter((req) => paidRequestStatuses.has(req.status));
};

const viewRequestOrder = async (request) => {
  try {
    const res = await requestApiCall('GET', `/api/order-requests/customer/${request.id}`);
    selectedRequestOrder.value = res.data;
  } catch (error) {
    console.error('Error loading request details:', error);
    alert('Failed to load request details');
  }
};

// Load orders + paid requests
const loadOrders = async ({ silent = false } = {}) => {
  try {
    if (!silent) isLoading.value = true;

    const [ordersResult, requestsResult] = await Promise.allSettled([
      userStore.getAllOrders({}),
      fetchPaidRequests()
    ]);

    const nextOrders = ordersResult.status === 'fulfilled' ? (ordersResult.value || []) : [];
    const nextPaidRequests = requestsResult.status === 'fulfilled' ? (requestsResult.value || []) : paidRequests.value;

    if (ordersResult.status === 'rejected') {
      console.error('Error loading store orders:', ordersResult.reason);
    }
    if (requestsResult.status === 'rejected') {
      console.error('Error loading paid request orders:', requestsResult.reason);
    }

    orders.value = nextOrders;
    paidRequests.value = nextPaidRequests;

    // Keep open modal order status/details synced with latest list values.
    if (selectedOrder.value?.order_id) {
      const refreshed = nextOrders.find(o => o.order_id === selectedOrder.value.order_id);
      if (refreshed) {
        selectedOrder.value = { ...selectedOrder.value, ...refreshed };
      }
    }

    if (selectedRequestOrder.value?.id) {
      const refreshedRequest = nextPaidRequests.find(r => r.id === selectedRequestOrder.value.id);
      if (refreshedRequest) {
        selectedRequestOrder.value = { ...selectedRequestOrder.value, ...refreshedRequest };
      } else if (!paidRequestStatuses.has(selectedRequestOrder.value.status)) {
        selectedRequestOrder.value = null;
      }
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  } finally {
    if (!silent) isLoading.value = false;
  }
};

// View order details
const viewOrder = async (order) => {
  try {
    const userStore = useUserStore();

    // Fetch order details with company_id
    const details = await userStore.getOrderDetails(order.order_id, order.company_id);
    selectedOrder.value = details;

  } catch (error) {
    console.error('Error loading order details:', error);
    alert('Failed to load order details');
  }
};

// Confirm cancel order
const confirmCancelOrder = (order) => {
  if (confirm(`Are you sure you want to cancel order #${order.order_id.substring(0, 8)}?`)) {
    cancelOrder(order.order_id, order.company_id);
  }
};

// Cancel order
const cancelOrder = async (orderId, companyId) => {
  try {
    const userStore = useUserStore();

    // Cancel the order with the specific company_id
    await userStore.cancelOrder(orderId, companyId);
    alert('Order cancelled successfully');

    // Reload orders
    loadOrders();
  } catch (error) {
    console.error('Error cancelling order:', error);
    alert('Failed to cancel order');
  }
};

// Initialize
onMounted(async () => {
  await loadOrders();

  if (props.initialOrderId) {
    const match = orders.value.find(o => o.order_id === props.initialOrderId)
      || paidRequests.value.find(r => String(r.id) === String(props.initialOrderId));
    if (match) {
      if (match.order_id) viewOrder(match);
      else selectedRequestOrder.value = match;
    }
  }

  pollTimer = setInterval(async () => {
    await loadOrders({ silent: true });
  }, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

