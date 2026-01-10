<template>
  <div class="orders-component">
    <div class="section-header">
      <h2>All Orders</h2>
      <p class="section-description">View and manage your orders across all linked companies</p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="selectedStatus" @change="loadOrders" class="filter-select">
        <option value="">All Orders</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
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

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <h3>No orders found</h3>
      <p>You haven't placed any orders across your linked companies yet</p>
      <button @click="navigateTo('/')" class="btn btn-primary">
        Start Shopping
      </button>
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();

// State
const isLoading = ref(false);
const orders = ref([]);
const selectedOrder = ref(null);
const selectedStatus = ref('');

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
    'delivered': 'Delivered',
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
    'delivered': 'status-delivered',
    'cancelled': 'status-cancelled'
  };
  return statusClasses[status] || 'status-default';
};

// Format amount
const formatAmount = (amount) => {
  return parseFloat(amount || 0).toFixed(2);
};

// Load orders
const loadOrders = async () => {
  try {
    isLoading.value = true;
    const filters = {};
    if (selectedStatus.value) {
      filters.status = selectedStatus.value;
    }
    orders.value = await userStore.getAllOrders(filters);
  } catch (error) {
    console.error('Error loading orders:', error);
  } finally {
    isLoading.value = false;
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
});
</script>

<style scoped>
.orders-component {
  max-width: 1000px;
  padding: 10px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.section-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.filters {
  margin-bottom: 20px;
}

.filter-select {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
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

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

.total-label {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 4px 0;
}

.total-amount {
  font-size: 18px;
  font-weight: 700;
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
  background: white;
  border: 1px solid #d1d5db;
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
  background: #ef4444;
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
  .order-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
