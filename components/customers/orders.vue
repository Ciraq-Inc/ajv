<template>
  <div class="w-full">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 mb-4">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">history</span>
            </div>
            <div>
                <h1 class="text-lg font-bold text-zinc-900 tracking-tight">Order History</h1>
                <p class="text-xs text-zinc-500 font-medium mt-0.5">Your complete order and request fulfillment history</p>
            </div>
        </div>
        <div class="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 shadow-sm hidden sm:flex">
            <span class="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">Total</span>
            <strong class="text-sm font-black text-zinc-900 tabular-nums">{{ mergedItems.length }}</strong>
        </div>
    </header>

    <!-- Status filter -->
    <div class="px-5 mb-5 overflow-x-auto no-scrollbar">
        <div class="inline-flex gap-2 p-1 bg-zinc-100 border border-zinc-200 rounded-lg">
            <button
                @click="selectedStatus = ''"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                :class="selectedStatus === '' ? 'bg-white text-[#4F217A] font-bold shadow-sm ring-1 ring-zinc-200/50' : 'text-zinc-500 font-semibold hover:text-zinc-700'"
            >
                All
            </button>
            <button
                @click="selectedStatus = 'active'"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                :class="selectedStatus === 'active' ? 'bg-white text-[#4F217A] font-bold shadow-sm ring-1 ring-zinc-200/50' : 'text-zinc-500 font-semibold hover:text-zinc-700'"
            >
                Active
            </button>
            <button
                @click="selectedStatus = 'in_transit'"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                :class="selectedStatus === 'in_transit' ? 'bg-white text-[#4F217A] font-bold shadow-sm ring-1 ring-zinc-200/50' : 'text-zinc-500 font-semibold hover:text-zinc-700'"
            >
                In Transit
            </button>
            <button
                @click="selectedStatus = 'completed'"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                :class="selectedStatus === 'completed' ? 'bg-white text-[#4F217A] font-bold shadow-sm ring-1 ring-zinc-200/50' : 'text-zinc-500 font-semibold hover:text-zinc-700'"
            >
                Completed
            </button>
            <button
                @click="selectedStatus = 'cancelled'"
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                :class="selectedStatus === 'cancelled' ? 'bg-white text-[#4F217A] font-bold shadow-sm ring-1 ring-zinc-200/50' : 'text-zinc-500 font-semibold hover:text-zinc-700'"
            >
                Cancelled
            </button>
        </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 mx-5 border border-zinc-200 bg-zinc-50 rounded-xl">
        <span class="material-symbols-outlined text-3xl text-zinc-400 animate-spin mb-3">sync</span>
        <p class="text-sm font-medium text-zinc-500">Loading your history...</p>
    </div>

    <!-- Error with retry -->
    <div v-else-if="hasLoadError" class="flex flex-col items-center justify-center py-16 mx-5 border border-red-200 bg-red-50 rounded-xl">
        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 ring-1 ring-red-100">
          <span class="material-symbols-outlined text-2xl text-red-500">cloud_off</span>
        </div>
        <p class="text-base font-bold text-zinc-900 mb-1 text-center">Couldn't load your history</p>
        <p class="text-sm font-medium text-zinc-600 text-center mb-4 max-w-xs">Check your connection and try again.</p>
        <button @click="loadOrders()" class="inline-flex items-center gap-2 bg-[#4F217A] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#3d1861] transition-colors">
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Retry
        </button>
    </div>

    <!-- ─── Merged Timeline ─── -->
    <div v-else>
      <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-16 mx-5 border border-zinc-200 bg-white rounded-xl shadow-sm">
        <div class="max-w-[48px] max-h-[48px] w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-zinc-100 mx-auto">
          <span class="material-symbols-outlined text-2xl text-zinc-300">receipt_long</span>
        </div>
        <p class="text-base font-bold text-zinc-900 mb-1 text-center">No history yet</p>
        <p class="text-sm font-medium text-zinc-500 text-center">Your orders and requests will appear here</p>
      </div>

      <div v-else class="space-y-0 text-sm border-y border-zinc-200 bg-white">
        <article v-for="item in filteredItems" :key="item._key"
          class="flex items-center justify-between px-5 py-4 border-b last:border-b-0 border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer group"
          @click="item._type === 'store' ? viewOrder(item) : viewRequestOrder(item)"
        >
          <div class="flex items-center gap-4 min-w-0">
            <!-- Colored Icon Box based on status -->
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
              :class="item.status === 'completed' || item.status === 'delivered' || item.status === 'picked_up' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (item.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : (item.status === 'processing' || item.status === 'shipped' || item.status === 'out_for_delivery' || item.status === 'ready_for_pickup' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'))">
              <span class="material-symbols-outlined text-[20px]">{{ item._type === 'store' ? 'shopping_bag' : 'package_2' }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <h4 class="text-sm font-bold text-zinc-900 uppercase tracking-tight truncate">{{ item._displayId }}</h4>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.08em] flex-shrink-0"
                  :class="item._type === 'store' ? 'bg-zinc-100 text-zinc-500' : 'bg-[#f4e8fb] text-[#5e3a86]'">
                  {{ item._type === 'store' ? 'Store' : 'Request' }}
                </span>
                <span v-if="item._meta" class="hidden sm:inline-flex items-center text-xs text-zinc-400 font-medium truncate w-32 sm:w-auto">
                    &middot; {{ item._meta }}
                </span>
              </div>
              <p class="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                {{ item._date }}
              </p>
            </div>
          </div>
          <div class="text-right flex-shrink-0 flex items-center gap-4">
            <div class="flex flex-col items-end gap-1.5">
              <strong class="text-sm font-black text-zinc-900 tabular-nums">GHS {{ item._amount }}</strong>
              <div class="flex justify-end">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.1em]"
                  :class="item._type === 'store' ? orderStatusClass(item.status) : requestOrderStatusClass(item.status)">
                  {{ item._type === 'store' ? formatStatus(item.status) : formatRequestStatus(item.status) }}
                </span>
              </div>
            </div>
            
            <button v-if="item._type === 'store' && item.status === 'pending'" @click.stop="confirmCancelOrder(item)"
              class="w-10 h-10 hidden sm:flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
              :aria-label="`Cancel order ${item._displayId}`"
              title="Cancel order">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
            
            <!-- Hover Chevron -->
            <div class="ml-2 hidden sm:flex w-6 h-6 items-center justify-center text-zinc-300 group-hover:text-[#4F217A] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
            </div>
          </div>
        </article>
      </div>
    </div>

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

    <!-- Cancel confirmation -->
    <ConfirmDialog
      :is-open="!!pendingCancelOrder"
      title="Cancel this order?"
      :message="pendingCancelOrder ? `Order #${String(pendingCancelOrder.order_id).substring(0, 8)} will be cancelled. This can't be undone.` : ''"
      confirm-text="Yes, cancel"
      cancel-text="Keep order"
      variant="danger"
      @close="pendingCancelOrder = null"
      @confirm="performCancel"
    />

    <!-- Toast -->
    <div v-if="toast"
      class="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold"
      :class="toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'">
      <span class="material-symbols-outlined text-[18px]">{{ toast.type === 'error' ? 'error' : 'check_circle' }}</span>
      {{ toast.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';
import { useOrderStatus } from '~/composables/useOrderStatus';

const props = defineProps({
  initialOrderId: { type: String, default: null }
});

const userStore = useUserStore();
const config = useRuntimeConfig();
const {
  formatStoreStatus: formatStatus,
  formatRequestStatus,
  storeStatusBadgeClass: orderStatusClass,
  requestStatusBadgeClass: requestOrderStatusClass
} = useOrderStatus();

// State
const isLoading = ref(false);
const hasLoadError = ref(false);
const orders = ref([]);
const paidRequests = ref([]);
const selectedOrder = ref(null);
const selectedRequestOrder = ref(null);
const selectedStatus = ref('');
const pendingCancelOrder = ref(null);
const isCancelling = ref(false);
const toast = ref(null);
const POLL_INTERVAL_MS = 15000;
let pollTimer = null;
let toastTimer = null;

const showToast = (text, type = 'success') => {
  toast.value = { text, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 4000);
};
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
    showToast('Failed to load request details', 'error');
  }
};

// Load orders + paid requests
const loadOrders = async ({ silent = false } = {}) => {
  try {
    if (!silent) {
      isLoading.value = true;
      hasLoadError.value = false;
    }

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

    const bothFailed = ordersResult.status === 'rejected' && requestsResult.status === 'rejected';
    if (!silent) {
      hasLoadError.value = bothFailed;
    } else if (bothFailed) {
      showToast('Could not refresh history', 'error');
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
    if (!silent) hasLoadError.value = true;
  } finally {
    if (!silent) isLoading.value = false;
  }
};

// View order details
const viewOrder = async (order) => {
  try {
    const details = await userStore.getOrderDetails(order.order_id, order.company_id);
    selectedOrder.value = details;
  } catch (error) {
    console.error('Error loading order details:', error);
    showToast('Failed to load order details', 'error');
  }
};

const confirmCancelOrder = (order) => {
  pendingCancelOrder.value = order;
};

const performCancel = async () => {
  if (!pendingCancelOrder.value || isCancelling.value) return;
  const { order_id, company_id } = pendingCancelOrder.value;
  isCancelling.value = true;
  try {
    await userStore.cancelOrder(order_id, company_id);
    pendingCancelOrder.value = null;
    showToast('Order cancelled');
    loadOrders({ silent: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    showToast(error?.message || 'Failed to cancel order', 'error');
  } finally {
    isCancelling.value = false;
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
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

