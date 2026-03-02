<template>
  <div class="orders-component">
    <div class="section-header">
      <div>
        <p class="eyebrow">Order History</p>
        <h2>All Orders</h2>
        <p class="section-description">View and manage your orders across all linked companies</p>
      </div>
      <div class="summary-strip">
        <div class="summary-pill">
          <span class="summary-label">Store</span>
          <strong>{{ orders.length }}</strong>
        </div>
        <div class="summary-pill request">
          <span class="summary-label">Requests</span>
          <strong>{{ paidRequests.length }}</strong>
        </div>
      </div>
    </div>

    <div class="orders-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeOrdersTab === 'store' }"
        @click="activeOrdersTab = 'store'"
      >
        <span>Store Orders</span>
        <span class="tab-count">{{ orders.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeOrdersTab === 'requests' }"
        @click="activeOrdersTab = 'requests'"
      >
        <span>Request Orders</span>
        <span class="tab-count">{{ paidRequests.length }}</span>
      </button>
    </div>

    <!-- Filters -->
    <div v-if="activeOrdersTab === 'store'" class="filters">
      <select v-model="selectedStatus" @change="loadOrders" class="filter-select">
        <option value="">All Orders</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="completed">Completed</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <p>Loading your orders...</p>
    </div>

    <div v-else class="orders-sections">
      <section v-if="activeOrdersTab === 'store'" class="orders-block">
        <div class="block-head">
          <h3 class="block-title">Store Orders</h3>
          <p class="block-description">Orders created directly from pharmacy checkout.</p>
        </div>

        <!-- Empty State -->
        <div v-if="orders.length === 0" class="empty-state compact">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3>No store orders yet</h3>
          <p>You have not placed any direct pharmacy orders yet.</p>
        </div>

        <!-- Orders List -->
        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.order_id" class="order-card">
            <div class="order-header">
              <div class="order-info">
                <h3>Order #{{ order.order_id.substring(0, 8) }}</h3>
                <p class="order-date">{{ formatDate(order.created_at || order.order_date) }}</p>
                <p class="order-company" v-if="order.company_name">From: {{ order.company_name }}</p>
              </div>
              <div class="order-status">
                <span :class="['status-badge', getStatusClass(order.status)]">
                  {{ formatStatus(order.status) }}
                </span>
              </div>
            </div>

            <div class="order-body">
              <div class="order-items">
                <p class="items-summary">
                  <strong>{{ order.item_count || 0 }}</strong> item(s)
                </p>
              </div>

              <div class="order-total">
                <p class="total-label">Total Amount</p>
                <p class="total-amount">GHS {{ formatAmount(order.total_amount) }}</p>
              </div>
            </div>

            <div class="order-footer">
              <button @click="viewOrder(order)" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>

              <button v-if="order.status === 'pending'" @click="confirmCancelOrder(order)" class="btn btn-danger">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="orders-block request-orders-block">
        <div class="block-head">
          <h3 class="block-title">Paid Request Orders</h3>
          <p class="block-description">Requests that have moved to paid and fulfillment stage.</p>
        </div>

        <div v-if="paidRequests.length === 0" class="empty-state compact">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-2.21 0-4 1.79-4 4m0 0c0 2.21 1.79 4 4 4m-4-4H4m4 0h12" />
          </svg>
          <h3>No paid request orders yet</h3>
          <p>Once a request is marked paid, it will appear here.</p>
        </div>

        <div v-else class="orders-list">
          <div v-for="request in paidRequests" :key="request.id" class="order-card request-order-card">
            <div class="order-header">
              <div class="order-info">
                <h3>Request #{{ request.request_number }}</h3>
                <p class="order-date">{{ formatDate(request.updated_at || request.created_at) }}</p>
                <p class="order-company">Request Order</p>
              </div>
              <div class="order-status">
                <span :class="['status-badge', getRequestStatusClass(request.status)]">
                  {{ formatRequestStatus(request.status) }}
                </span>
              </div>
            </div>

            <div class="order-body">
              <div class="order-items">
                <p class="items-summary">
                  <strong>{{ request.item_count || 0 }}</strong> item(s)
                </p>
                <p class="request-meta-line" v-if="request.fulfillment_type">
                  Fulfillment: {{ request.fulfillment_type }}
                </p>
              </div>

              <div class="order-total">
                <p class="total-label">Request Total</p>
                <p class="total-amount">GHS {{ formatAmount(getRequestTotalAmount(request)) }}</p>
              </div>
            </div>

            <div class="order-footer">
              <button @click="viewRequestOrder(request)" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="selectedOrder = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Order Details</h3>
          <button @click="selectedOrder = null" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Order ID:</span>
            <span class="detail-value">{{ selectedOrder.order_id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">{{ formatDate(selectedOrder.created_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span :class="['status-badge', getStatusClass(selectedOrder.status)]">
              {{ formatStatus(selectedOrder.status) }}
            </span>
          </div>

          <div class="items-section">
            <h4>Order Items</h4>
            <div v-for="(item, index) in selectedOrder.items" :key="index" class="item-row">
              <div class="item-info">
                <p class="item-name">{{ item.brand_name || item.product_name }}</p>
                <span class="items_details">
                  <p class="item-qty">Qty: {{ item.qty }}</p>
                  <p class="item-qty">Price: {{ item.selling_price }}</p>
                </span>
              </div>
              <div class="item-price">
                <p>GHS {{ formatAmount(item.line_total) }}</p>
              </div>
            </div>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>GHS {{ formatAmount(selectedOrder.subtotal || selectedOrder.total_amount) }}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>GHS {{ formatAmount(selectedOrder.tax_amount || 0) }}</span>
            </div>
            <div class="total-row final">
              <span>Total:</span>
              <span>GHS {{ formatAmount(selectedOrder.total_amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Order Details Modal -->
    <div v-if="selectedRequestOrder" class="modal-overlay" @click="selectedRequestOrder = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Request Order Details</h3>
          <button @click="selectedRequestOrder = null" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Request #:</span>
            <span class="detail-value">{{ selectedRequestOrder.request_number }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">{{ formatDate(selectedRequestOrder.updated_at || selectedRequestOrder.created_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span :class="['status-badge', getRequestStatusClass(selectedRequestOrder.status)]">
              {{ formatRequestStatus(selectedRequestOrder.status) }}
            </span>
          </div>
          <div class="detail-row" v-if="selectedRequestOrder.fulfillment_type">
            <span class="detail-label">Fulfillment:</span>
            <span class="detail-value">{{ selectedRequestOrder.fulfillment_type }}</span>
          </div>

          <div class="items-section">
            <h4>Request Items</h4>
            <div v-for="(item, index) in selectedRequestOrder.items || []" :key="index" class="item-row">
              <div class="item-info">
                <p class="item-name">{{ item.product_name }}</p>
                <span class="items_details">
                  <p class="item-qty">Qty: {{ item.quantity }}</p>
                  <p class="item-qty">Price: GHS {{ formatAmount(item.marked_up_price || item.unit_price || 0) }}</p>
                </span>
              </div>
              <div class="item-price">
                <p>GHS {{ formatAmount(item.line_total || ((item.marked_up_price || item.unit_price || 0) * (item.quantity || 0))) }}</p>
              </div>
            </div>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span>Items total:</span>
              <span>GHS {{ formatAmount(selectedRequestOrder.items_total || 0) }}</span>
            </div>
            <div class="total-row" v-if="selectedRequestOrder.delivery_fee">
              <span>Delivery fee:</span>
              <span>GHS {{ formatAmount(selectedRequestOrder.delivery_fee || 0) }}</span>
            </div>
            <div class="total-row final">
              <span>Total:</span>
              <span>GHS {{ formatAmount(getRequestTotalAmount(selectedRequestOrder)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();
const config = useRuntimeConfig();

// State
const isLoading = ref(false);
const orders = ref([]);
const paidRequests = ref([]);
const selectedOrder = ref(null);
const selectedRequestOrder = ref(null);
const selectedStatus = ref('');
const activeOrdersTab = ref('store');
const POLL_INTERVAL_MS = 15000;
let pollTimer = null;
const paidRequestStatuses = new Set([
  'paid',
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

// Get status class
const getStatusClass = (status) => {
  const statusClasses = {
    'pending': 'status-pending',
    'processing': 'status-processing',
    'shipped': 'status-shipped',
    'completed': 'status-delivered',
    'delivered': 'status-delivered',
    'picked_up': 'status-delivered',
    'cancelled': 'status-cancelled'
  };
  return statusClasses[status] || 'status-default';
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

    const filters = {};
    if (selectedStatus.value) {
      filters.status = selectedStatus.value;
    }

    const [ordersResult, requestsResult] = await Promise.allSettled([
      userStore.getAllOrders(filters),
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
onMounted(() => {
  loadOrders();

  pollTimer = setInterval(async () => {
    await loadOrders({ silent: true });
  }, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.orders-component {
  max-width: 1000px;
  padding: 10px;
}

.section-header {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
}

.section-header h2 {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.section-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  max-width: 560px;
}

.summary-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-pill {
  min-width: 88px;
  padding: 10px 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.summary-pill.request {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-color: #a7f3d0;
  color: #065f46;
}

.summary-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
  margin-bottom: 4px;
}

.summary-pill strong {
  font-size: 22px;
  line-height: 1;
}

.orders-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 6px;
  border: 1px solid #dbe4ee;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  color: #475569;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #0f172a;
}

.tab-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.tab-count {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
}

.tab-btn.active .tab-count {
  background: #dbeafe;
  color: #1d4ed8;
}

.filters {
  margin-bottom: 20px;
}

.filter-select {
  width: 100%;
  max-width: 260px;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  color: #0f172a;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  color: #3b82f6;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

.loading-state p {
  margin-top: 16px;
  color: #64748b;
}

.orders-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.orders-block {
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.request-orders-block {
  background: linear-gradient(180deg, #ffffff, #f0fdf4);
  border-color: #bbf7d0;
}

.block-head {
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.block-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.block-description {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: #9ca3af;
  margin: 0 auto;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 16px 0 8px 0;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 24px;
}

.empty-state.compact {
  padding: 28px 16px;
}

.empty-state.compact h3 {
  font-size: 16px;
  margin-top: 10px;
  margin-bottom: 6px;
}

.empty-state.compact p {
  font-size: 13px;
  margin-bottom: 0;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  transition: all 0.2s;
}

.order-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.request-order-card {
  border-color: #bbf7d0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.order-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.order-date {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 4px 0;
}

.order-company {
  font-size: 12px;
  color: #059669;
  font-weight: 500;
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-shipped {
  background: #e0e7ff;
  color: #3730a3;
}

.status-delivered {
  background: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-default {
  background: #f3f4f6;
  color: #374151;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.items-summary {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.items-summary strong {
  font-size: 18px;
  color: #0f172a;
}

.request-meta-line {
  font-size: 12px;
  color: #64748b;
  margin: 6px 0 0 0;
}

.total-label {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.total-amount {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.order-footer {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-outline {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #374151;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: linear-gradient(180deg, #ef4444, #dc2626);
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #64748b;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1e293b;
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}

.items-section {
  margin-top: 20px;
}

.items-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.item-qty {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.items_details {
  display: flex;
  gap: 10px;
}

.item-price p {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.total-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #64748b;
}

.total-row.final {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
  }

  .section-header h2 {
    font-size: 24px;
  }

  .orders-tabs {
    flex-direction: column;
  }

  .order-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .order-body {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
