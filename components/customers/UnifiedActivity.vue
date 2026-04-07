<template>
  <div class="activity-stream">
    <div class="stream-header">
      <div>
        <h3 class="stream-title">Activity Stream</h3>
        <p class="stream-subtitle">Track your requests and orders</p>
      </div>
      <button class="view-all-btn" @click="$emit('view-all')">
        Full History
        <span class="material-symbols-outlined">arrow_outward</span>
      </button>
    </div>

    <div v-if="mergedItems.length === 0" class="empty-state">
      <div class="empty-icon">
        <span class="material-symbols-outlined">inbox</span>
      </div>
      <p class="empty-title">No active activity</p>
      <p class="empty-text">Your requests and orders will appear here</p>
    </div>

    <div v-else class="activity-list">
      <button
        v-for="item in mergedItems"
        :key="item.id"
        class="activity-item"
        @click="$emit('item-click', item)"
      >
        <div class="item-icon" :class="item.iconClass">
          <span class="material-symbols-outlined">{{ item.icon }}</span>
        </div>

        <div class="item-content">
          <div class="item-header">
            <h4 class="item-id">{{ item.displayId }}</h4>
            <span class="item-date">{{ item.date }}</span>
          </div>
          <p class="item-meta">{{ item.meta }}</p>
        </div>

        <div class="item-amount">
          <strong>GHS {{ item.amount }}</strong>
          <span class="item-status" :class="item.statusClass">{{ item.statusLabel }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  requests: {
    type: Array,
    default: () => []
  },
  orders: {
    type: Array,
    default: () => []
  },
  limit: {
    type: Number,
    default: 4
  }
})

const emit = defineEmits(['view-all', 'item-click'])

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short' 
  })
}

const formatMoney = (value) => Number(value || 0).toFixed(2)

const shortId = (id) => (id || '').substring(0, 8).toUpperCase()

const getRequestStatusLabel = (status) => {
  const map = {
    paid: 'Settled',
    verified: 'Settled',
    pending: 'Pending',
    searching: 'Searching',
    finding_pharmacist: 'Searching',
    confirming_with_pharm: 'Processing',
    quote_available: 'Quoted',
    processing: 'Processing',
    out_for_delivery: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }
  return map[status] || String(status || 'active').replace(/_/g, ' ')
}

const getRequestStatusClass = (status) => {
  switch (status) {
    case 'paid':
    case 'verified':
      return 'status-success'
    case 'processing':
    case 'confirming_with_pharm':
      return 'status-processing'
    case 'quote_available':
      return 'status-info'
    case 'cancelled':
    case 'rejected':
      return 'status-error'
    default:
      return 'status-default'
  }
}

const getOrderStatusLabel = (status) => {
  const map = {
    pending: 'Pending',
    processing: 'Preparing',
    shipped: 'In Transit',
    logistics_pending: 'Logistics Pending',
    out_for_delivery: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return map[status] || String(status || 'order').replace(/_/g, ' ')
}

const getOrderStatusClass = (status) => {
  switch (status) {
    case 'pending':
    case 'processing':
      return 'status-warning'
    case 'shipped':
    case 'out_for_delivery':
      return 'status-info'
    case 'delivered':
    case 'completed':
      return 'status-success'
    case 'cancelled':
      return 'status-error'
    default:
      return 'status-default'
  }
}

const getRequestAmount = (request) => {
  const totalCost = Number(request.total_cost)
  if (Number.isFinite(totalCost) && totalCost > 0) return totalCost

  const estimated = Number(request.estimated_total)
  if (Number.isFinite(estimated) && estimated > 0) return estimated

  const itemsTotal = Number(request.items_total || 0)
  const deliveryFee = Number(request.delivery_fee || 0)
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
}

const requestMeta = (request) => {
  const itemCount = Number(request.item_count || request.items?.length || 0)
  const fulfillment = request.fulfillment_type ? String(request.fulfillment_type).replace(/_/g, ' ') : ''
  if (fulfillment) return `${itemCount || 0} item${itemCount === 1 ? '' : 's'} • ${fulfillment}`
  return `${itemCount || 0} item${itemCount === 1 ? '' : 's'}`
}

const getOrderSummary = (order) => {
  const firstItem = order.items?.[0]?.brand_name || order.items?.[0]?.product_name
  if (firstItem) return firstItem
  if (order.company_name) return order.company_name
  return `${Number(order.item_count || 0)} item${Number(order.item_count || 0) === 1 ? '' : 's'}`
}

const formatRequestIcon = (request) => {
  if (request.fulfillment_type === 'delivery') return 'local_shipping'
  if ((request.item_count || request.items?.length || 0) > 0) return 'pill'
  return 'description'
}

const getRequestIconClass = (status) => {
  if (status === 'paid' || status === 'verified') return 'icon-success'
  if (status === 'processing' || status === 'confirming_with_pharm') return 'icon-processing'
  return 'icon-default'
}

const mergedItems = computed(() => {
  const items = []

  // Add requests
  props.requests.forEach((request) => {
    const reqNumber = request.request_number || shortId(String(request.id || ''))
    const displayReqId = String(reqNumber).startsWith('REQ-') ? reqNumber : `REQ-${reqNumber}`
    items.push({
      id: `req-${request.id}`,
      type: 'request',
      displayId: displayReqId,
      date: formatDate(request.updated_at || request.created_at),
      meta: requestMeta(request),
      amount: formatMoney(getRequestAmount(request)),
      icon: formatRequestIcon(request),
      iconClass: getRequestIconClass(request.status),
      statusLabel: getRequestStatusLabel(request.status),
      statusClass: getRequestStatusClass(request.status),
      timestamp: new Date(request.updated_at || request.created_at).getTime(),
      tabTarget: 'requests'
    })
  })

  // Add orders
  props.orders.forEach((order) => {
    items.push({
      id: `ord-${order.order_id}`,
      type: 'order',
      displayId: `#${String(order.order_id || '').replace(/^#/, '').substring(0, 8)}`,
      date: formatDate(order.created_at),
      meta: getOrderSummary(order),
      amount: formatMoney(order.total_amount),
      icon: 'shopping_bag',
      iconClass: 'icon-order',
      statusLabel: getOrderStatusLabel(order.status),
      statusClass: getOrderStatusClass(order.status),
      timestamp: new Date(order.created_at).getTime(),
      tabTarget: 'orders'
    })
  })

  // Sort by timestamp (newest first) and limit
  return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, props.limit)
})
</script>

<style scoped>
.activity-stream {
  width: 100%;
}

.stream-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.stream-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #4f217a;
  text-transform: uppercase;
}

.stream-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #71717a;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 900;
  color: #71717a;
  cursor: pointer;
  transition: color 0.2s;
}

.view-all-btn:hover {
  color: #1d1a20;
}

.view-all-btn span {
  font-size: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  border-radius: 0.75rem;
  border: 1px solid #e4e4e7;
  background: #fafafa;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  background: #f4f4f5;
  color: #a1a1a6;
  font-size: 24px;
}

.empty-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1d1a20;
}

.empty-text {
  margin: 0;
  font-size: 0.8125rem;
  color: #71717a;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.activity-item:hover {
  border-color: #d4d4d8;
  background: #f9f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  font-size: 20px;
}

.icon-success {
  background: #e7f7ea;
  color: #228847;
}

.icon-processing {
  background: #f4e8fb;
  color: #5d357a;
}

.icon-default {
  background: #f4f4f5;
  color: #71717a;
}

.icon-order {
  background: #eef4ff;
  color: #285db8;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.item-id {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #1d1a20;
}

.item-date {
  font-size: 0.75rem;
  color: #a1a1a6;
}

.item-meta {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.item-amount strong {
  font-size: 0.875rem;
  font-weight: 900;
  color: #1d1a20;
}

.item-status {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-success {
  background: #e7f7ea;
  color: #1f8a45;
}

.status-processing {
  background: #f3daff;
  color: #5d357a;
}

.status-warning {
  background: #fff1d8;
  color: #9a620d;
}

.status-info {
  background: #edf4ff;
  color: #285db8;
}

.status-error {
  background: #ffe7e7;
  color: #c03a3a;
}

.status-default {
  background: #f4eff6;
  color: #736a7a;
}

@media (max-width: 640px) {
  .activity-item {
    gap: 10px;
    padding: 10px 12px;
  }

  .item-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .stream-title {
    font-size: 1rem;
  }

  .item-id {
    font-size: 0.875rem;
  }

  .item-amount strong {
    font-size: 0.8125rem;
  }
}
</style>
