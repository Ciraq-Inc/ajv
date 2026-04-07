<template>
  <div class="customer-app">
    <div v-if="isCheckingAuth" class="auth-loading">
      <div class="pulse-ring"></div>
      <p>Loading...</p>
    </div>

    <template v-else>
      <div v-if="currentTab === 'home'" class="home-view">
        <!-- Alert Banner -->
        <AlertBanner :event="criticalEvent" @dismiss="dismissAlert" @action="handleAlertAction" />

        <!-- Quick Actions Bar -->
        <div class="quick-actions-bar">
          <button class="location-chip" @click="showLocationModal = true">
            <span class="material-symbols-outlined">location_on</span>
            <span class="location-text">{{ dashboardLocation }}</span>
            <span class="material-symbols-outlined edit-icon">edit</span>
          </button>
          <button class="new-request-btn" @click="goTab('new')">
            <span class="material-symbols-outlined">add</span>
            New Request
          </button>
        </div>

        <!-- Unified Activity Stream -->
        <UnifiedActivity
          :requests="recentRequests"
          :orders="ongoingOrders"
          :limit="4"
          @view-all="goTab('requests')"
          @item-click="handleActivityClick"
        />

        <!-- Wallet Info Card -->
        <div class="wallet-info-card">
          <div class="wallet-left">
            <p class="wallet-label">Available Balance</p>
            <h3 class="wallet-amount">GHS {{ walletBalance.toFixed(2) }}</h3>
          </div>
          <button class="wallet-link-btn" @click="goTab('wallet')">
            Wallet Details
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <!-- Verified Partners (Collapsible) -->
        <div v-if="verifiedPartners.length > 0" class="partners-section">
          <button class="partners-header" @click="showPartnersCollapsed = !showPartnersCollapsed">
            <div>
              <h3 class="partners-title">Verified Pharmacies</h3>
              <p class="partners-subtitle">Direct shop from trusted partners</p>
            </div>
            <span class="material-symbols-outlined" :class="{ rotated: !showPartnersCollapsed }">expand_more</span>
          </button>

          <Transition name="collapse">
            <div v-show="!showPartnersCollapsed" class="partners-list">
              <button
                v-for="company in verifiedPartners"
                :key="company.id"
                class="partner-card"
                @click="goTab('companies')"
              >
                <div class="partner-avatar">
                  <span class="material-symbols-outlined">local_pharmacy</span>
                </div>
                <div class="partner-info">
                  <h4 class="partner-name">{{ company.company_name || company.name }}</h4>
                  <p class="partner-meta">{{ getCompanyMeta(company) }}</p>
                </div>
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Order Detail Modal -->
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
                <div><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Date</p><p class="font-semibold text-zinc-900 mt-0.5">{{ modalFormatDate(selectedOrder.created_at) }}</p></div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Status</p>
                  <span class="inline-flex rounded-full mt-1 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]" :class="orderStatusClass(selectedOrder.status)">{{ modalFormatStatus(selectedOrder.status) }}</span>
                </div>
              </div>

              <div class="border-t border-zinc-100 pt-4">
                <h4 class="text-sm font-black text-zinc-800 mb-3">Order Items</h4>
                <div v-for="(item, index) in selectedOrder.items" :key="index" class="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                  <div>
                    <p class="text-sm font-semibold text-zinc-900">{{ item.brand_name || item.product_name }}</p>
                    <p class="text-xs text-zinc-500">Qty: {{ item.qty }} · GHS {{ item.selling_price }}</p>
                  </div>
                  <p class="text-sm font-black text-zinc-900">GHS {{ modalFormatAmount(item.line_total) }}</p>
                </div>
              </div>

              <div class="bg-zinc-50 rounded-xl p-4 space-y-2">
                <div class="flex justify-between text-sm text-zinc-600"><span>Subtotal</span><span>GHS {{ modalFormatAmount(selectedOrder.subtotal || selectedOrder.total_amount) }}</span></div>
                <div class="flex justify-between text-sm text-zinc-600"><span>Tax</span><span>GHS {{ modalFormatAmount(selectedOrder.tax_amount || 0) }}</span></div>
                <div class="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200"><span>Total</span><span>GHS {{ modalFormatAmount(selectedOrder.total_amount) }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Request Order Detail Modal -->
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
                <div><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Date</p><p class="font-semibold text-zinc-900 mt-0.5">{{ modalFormatDate(selectedRequestOrder.updated_at || selectedRequestOrder.created_at) }}</p></div>
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Status</p>
                  <span class="inline-flex rounded-full mt-1 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]" :class="requestOrderStatusClass(selectedRequestOrder.status)">{{ modalFormatRequestStatus(selectedRequestOrder.status) }}</span>
                </div>
                <div v-if="selectedRequestOrder.fulfillment_type"><p class="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Fulfillment</p><p class="font-semibold text-zinc-900 mt-0.5 capitalize">{{ selectedRequestOrder.fulfillment_type }}</p></div>
              </div>

              <div class="border-t border-zinc-100 pt-4">
                <h4 class="text-sm font-black text-zinc-800 mb-3">Request Items</h4>
                <div v-for="(item, index) in selectedRequestOrder.items || []" :key="index" class="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                  <div>
                    <p class="text-sm font-semibold text-zinc-900">{{ item.product_name }}</p>
                    <p class="text-xs text-zinc-500">Qty: {{ item.quantity }} · GHS {{ modalFormatAmount(item.marked_up_price || item.unit_price || 0) }}</p>
                  </div>
                  <p class="text-sm font-black text-zinc-900">GHS {{ modalFormatAmount(item.line_total || ((item.marked_up_price || item.unit_price || 0) * (item.quantity || 0))) }}</p>
                </div>
              </div>

              <div class="bg-zinc-50 rounded-xl p-4 space-y-2">
                <div class="flex justify-between text-sm text-zinc-600"><span>Items total</span><span>GHS {{ modalFormatAmount(selectedRequestOrder.items_total || 0) }}</span></div>
                <div v-if="selectedRequestOrder.delivery_fee" class="flex justify-between text-sm text-zinc-600"><span>Delivery fee</span><span>GHS {{ modalFormatAmount(selectedRequestOrder.delivery_fee || 0) }}</span></div>
                <div class="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200"><span>Total</span><span>GHS {{ modalFormatAmount(getRequestTotalAmount(selectedRequestOrder)) }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'new'" class="page-view">
        <OrderRequests default-sub-tab="new" />
      </div>

      <div v-if="currentTab === 'requests'" class="page-view">
        <OrderRequests default-sub-tab="list" :initial-request-id="requestIdFromQuery" />
      </div>

      <div v-if="currentTab === 'wallet'" class="page-view">
        <Wallet />
      </div>

      <div v-if="currentTab === 'orders'" class="page-view">
        <Orders :initial-order-id="orderIdFromQuery" />
      </div>

      <div v-if="currentTab === 'profile'" class="page-view">
        <Profile />
      </div>

      <div v-if="currentTab === 'companies'" class="page-view">
        <LinkedCompanies />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AlertBanner from '~/components/customers/AlertBanner.vue'
import UnifiedActivity from '~/components/customers/UnifiedActivity.vue'
import LinkedCompanies from '~/components/customers/linkedCompanies.vue'
import Orders from '~/components/customers/orders.vue'
import OrderRequests from '~/components/customers/orderRequests.vue'
import Profile from '~/components/customers/profile.vue'
import Wallet from '~/components/customers/wallet.vue'
import { useUserStore } from '~/stores/user'
import { getCompactAddressLines } from '~/utils/addressFormat'

definePageMeta({ layout: 'customer' })

const userStore = useUserStore()
const route = useRoute()
const config = useRuntimeConfig()

const isCheckingAuth = ref(true)
const walletBalance = useState('walletBalance', () => 0)
const recentRequests = ref([])
const ongoingOrders = ref([])
const activeRequestCount = ref(0)
const isUpdatingLocation = ref(false)
const locationUpdateMessage = ref('')
const locationUpdateState = ref('idle')
const showLocationModal = ref(false)
const showPartnersCollapsed = ref(true)
const criticalEvent = ref(null)
const HOME_STATS_POLL_MS = 15000
let homeStatsPollTimer = null

const currentTab = computed(() => route.query.tab || 'home')
const requestIdFromQuery = computed(() => {
  const value = route.query.requestId
  if (Array.isArray(value)) return value[0] || null
  return value || null
})

const orderIdFromQuery = computed(() => {
  const value = route.query.orderId
  if (Array.isArray(value)) return value[0] || null
  return value || null
})

const companies = computed(() => userStore.companies || [])
const verifiedPartners = computed(() => companies.value.slice(0, 3))
const dashboardLocationParts = computed(() => getCompactAddressLines(userStore.currentUser?.address || '', { primaryCount: 2 }))
const dashboardLocation = computed(() => dashboardLocationParts.value.primary || 'Set your delivery location')

const goTab = (tab) => navigateTo({ path: '/customer', query: { tab } })

const isActiveRequestStatus = (status) => !['driver_unavailable', 'picked_up', 'delivered', 'completed', 'cancelled', 'returned'].includes(status)
const isOngoingOrderStatus = (status) => !['completed', 'delivered', 'cancelled', 'picked_up'].includes(status)

const formatDate = (value) => (
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : ''
)

const formatMoney = (value) => Number(value || 0).toFixed(2)
const shortId = (id) => (id || '').substring(0, 8).toUpperCase()

// Smart prefix detection helpers for alert IDs
const formatRequestId = (requestNumber, fallbackId) => {
  const value = requestNumber || shortId(String(fallbackId))
  // If already starts with REQ-, don't prepend again
  if (String(value).startsWith('REQ-')) return value
  return `REQ-${value}`
}

const formatOrderId = (orderId) => {
  const value = String(orderId || '').substring(0, 8).toUpperCase()
  // If already starts with Order #, don't prepend again
  if (value.startsWith('Order #')) return value
  return `Order #${value}`
}

const getCompanyMeta = (company) => {
  const address = company.address || company.location || company.physical_address || ''
  const compact = getCompactAddressLines(address, { primaryCount: 2 }).primary
  return compact || 'Linked pharmacy'
}

// Track analytics event
const trackEvent = (eventName, eventData = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventData)
  }
}

// Handle activity item click
const handleActivityClick = (item) => {
  trackEvent('activity_item_clicked', {
    item_type: item.type,
    item_id: item.id,
    status: item.statusClass
  })
  
  // Extract raw ID (remove 'req-' or 'ord-' prefix)
  const rawId = item.id.replace(/^(req|ord)-/, '')
  
  // If it's an order, open the order modal
  if (item.type === 'order') {
    // Try to find in memory first
    const order = ongoingOrders.value.find(o => o.order_id === rawId)
    if (order) {
      viewOrder(order)
      return
    }
    // If not in memory, create a minimal order object and fetch details
    viewOrder({ order_id: rawId, company_id: null })
    return
  }

  // If it's a request, open the request modal
  if (item.type === 'request') {
    // Try to find in memory first
    const request = recentRequests.value.find(r => String(r.id) === String(rawId))
    if (request) {
      viewRequestOrder(request)
      return
    }
    // If not in memory, create a minimal request object and fetch details
    viewRequestOrder({ id: rawId })
    return
  }
}

// Get critical event from request/order status (priority-ordered)
const evaluateCriticalEvent = () => {
  // 1. Payment required — quote is ready, customer must pay
  const paymentPendingRequest = recentRequests.value.find(r => r.status === 'quote_available')
  if (paymentPendingRequest) {
    criticalEvent.value = {
      id: 'payment-pending',
      type: 'warning',
      title: 'Payment Required',
      description: `${formatRequestId(paymentPendingRequest.request_number, paymentPendingRequest.id)} awaiting payment`,
      actionLabel: 'Pay Now',
      actionTab: 'requests',
      actionId: paymentPendingRequest.id
    }
    trackEvent('critical_event_shown', { event_type: 'payment_pending' })
    return
  }

  // 2. Delivery failed
  const failedDelivery = ongoingOrders.value.find(o => o.status === 'delivery_failed')
  if (failedDelivery) {
    criticalEvent.value = {
      id: 'delivery-failed',
      type: 'error',
      title: 'Delivery Failed',
      description: `${formatOrderId(failedDelivery.order_id)} could not be delivered`,
      actionLabel: 'View Details',
      actionTab: 'orders',
      actionId: failedDelivery.order_id
    }
    trackEvent('critical_event_shown', { event_type: 'delivery_failed' })
    return
  }

  // 3. No driver available
  const noDriverOrder = ongoingOrders.value.find(o => o.status === 'driver_unavailable')
  if (noDriverOrder) {
    criticalEvent.value = {
      id: 'driver-unavailable',
      type: 'error',
      title: 'No Driver Available',
      description: `${formatOrderId(noDriverOrder.order_id)} is waiting for a driver`,
      actionLabel: 'View Order',
      actionTab: 'orders',
      actionId: noDriverOrder.order_id
    }
    trackEvent('critical_event_shown', { event_type: 'driver_unavailable' })
    return
  }

  // 4. Order ready for pickup
  const readyOrder = ongoingOrders.value.find(o => o.status === 'ready_for_pickup')
  if (readyOrder) {
    criticalEvent.value = {
      id: 'ready-pickup',
      type: 'success',
      title: 'Order Ready',
      description: `${formatOrderId(readyOrder.order_id)} is ready for pickup`,
      actionLabel: 'View Order',
      actionTab: 'orders',
      actionId: readyOrder.order_id
    }
    trackEvent('critical_event_shown', { event_type: 'order_ready' })
    return
  }

  // 5. Order out for delivery / shipped
  const outForDelivery = ongoingOrders.value.find(o => o.status === 'out_for_delivery' || o.status === 'shipped')
  if (outForDelivery) {
    criticalEvent.value = {
      id: 'out-for-delivery',
      type: 'info',
      title: 'Order On the Way',
      description: `${formatOrderId(outForDelivery.order_id)} is on its way to you`,
      actionLabel: 'Track Order',
      actionTab: 'orders',
      actionId: outForDelivery.order_id
    }
    trackEvent('critical_event_shown', { event_type: 'out_for_delivery' })
    return
  }

  // 6. Request cancelled or rejected
  const cancelledRequest = recentRequests.value.find(r => r.status === 'cancelled' || r.status === 'rejected')
  if (cancelledRequest) {
    criticalEvent.value = {
      id: 'request-cancelled',
      type: 'error',
      title: 'Request Cancelled',
      description: `${formatRequestId(cancelledRequest.request_number, cancelledRequest.id)} was cancelled`,
      actionLabel: 'View Request',
      actionTab: 'requests',
      actionId: cancelledRequest.id
    }
    trackEvent('critical_event_shown', { event_type: 'request_cancelled' })
    return
  }

  criticalEvent.value = null
}

const handleAlertAction = (event) => {
  if (!event) return
  
  trackEvent('alert_action_clicked', { 
    event_type: event.id, 
    action_tab: event.actionTab,
    action_id: event.actionId 
  })

  // For orders: find in list and open modal
  if (event.actionTab === 'orders' && event.actionId) {
    const order = ongoingOrders.value.find(o => o.order_id === event.actionId)
    if (order) {
      viewOrder(order)
      return
    }
  }

  // For requests: find in list and open modal
  if (event.actionTab === 'requests' && event.actionId) {
    const request = recentRequests.value.find(r => r.id === event.actionId)
    if (request) {
      viewRequestOrder(request)
      return
    }
  }

  // Fallback: navigate to tab if item not found
  const query = { tab: event.actionTab }
  if (event.actionId) {
    if (event.actionTab === 'orders') query.orderId = event.actionId
    else query.requestId = event.actionId
  }
  navigateTo({ path: '/customer', query })
}

const dismissAlert = (eventId) => {
  trackEvent('alert_dismissed', { event_id: eventId })
  criticalEvent.value = null
}

// Modal state for order/request details
const selectedOrder = ref(null)
const selectedRequestOrder = ref(null)

// Helper function for API calls
const dashboardApiCall = async (method, url) => {
  const response = await fetch(`${config.public.apiBase}${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${userStore.customerAuthToken}`,
      'Content-Type': 'application/json'
    }
  })
  const json = await response.json()
  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed (${response.status})`)
  }
  return json
}

// Format date with time for modals
const modalFormatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format status
const modalFormatStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'completed': 'Completed',
    'delivered': 'Completed',
    'picked_up': 'Completed',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || status
}

// Tailwind class helpers for order status badges
const orderStatusClass = (status) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-[#f4e8fb] text-[#5e3a86]',
    shipped: 'bg-[#e8f0fe] text-[#2856c3]',
    completed: 'bg-[#e7f7ea] text-[#228847]',
    delivered: 'bg-[#e7f7ea] text-[#228847]',
    picked_up: 'bg-[#e7f7ea] text-[#228847]',
    cancelled: 'bg-red-50 text-red-600'
  }
  return map[status] || 'bg-zinc-100 text-zinc-600'
}

// Tailwind class helpers for request status badges
const requestOrderStatusClass = (status) => {
  const normalized = ['picked_up', 'delivered'].includes(status) ? 'completed' : status
  const map = {
    paid: 'bg-[#f4e8fb] text-[#5e3a86]',
    logistics_pending: 'bg-[#f4e8fb] text-[#5e3a86]',
    driver_unavailable: 'bg-red-50 text-red-600',
    ready_for_pickup: 'bg-[#e8f0fe] text-[#2856c3]',
    out_for_delivery: 'bg-[#e8f0fe] text-[#2856c3]',
    completed: 'bg-[#e7f7ea] text-[#228847]',
    returned: 'bg-red-50 text-red-600',
    cancelled: 'bg-red-50 text-red-600'
  }
  return map[normalized] || 'bg-zinc-100 text-zinc-600'
}

// Format amount for modals
const modalFormatAmount = (amount) => {
  return parseFloat(amount || 0).toFixed(2)
}

// Format request status
const modalFormatRequestStatus = (status) => {
  const normalized = ['picked_up', 'delivered'].includes(status) ? 'completed' : status
  const statusMap = {
    paid: 'Paid',
    logistics_pending: 'Logistics Pending',
    driver_unavailable: 'Driver Unavailable',
    ready_for_pickup: 'Ready For Pickup',
    out_for_delivery: 'Out For Delivery',
    completed: 'Completed',
    returned: 'Returned',
    cancelled: 'Cancelled'
  }
  return statusMap[normalized] || (normalized || '').replace(/_/g, ' ')
}

// Get total amount for request
const getRequestTotalAmount = (request) => {
  if (!request) return 0
  const estimated = Number(request.estimated_total)
  if (Number.isFinite(estimated) && estimated > 0) return estimated
  const itemsTotal = Number(request.items_total || 0)
  const deliveryFee = Number(request.delivery_fee || 0)
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
}

// View order details
const viewOrder = async (order) => {
  try {
    const details = await userStore.getOrderDetails(order.order_id, order.company_id)
    selectedOrder.value = details
    trackEvent('modal_opened', { modal_type: 'order_details', order_id: order.order_id })
  } catch (error) {
    console.error('Error loading order details:', error)
    const errorMsg = error.message || 'Failed to load order details'
    // Show toast would go here
  }
}

// View request order details
const viewRequestOrder = async (request) => {
  try {
    const res = await dashboardApiCall('GET', `/api/order-requests/customer/${request.id}`)
    selectedRequestOrder.value = res.data
    trackEvent('modal_opened', { modal_type: 'request_details', request_id: request.id })
  } catch (error) {
    console.error('Error loading request details:', error)
    const errorMsg = error.message || 'Failed to load request details'
    // Show toast would go here
  }
}

const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(`${config.public.apiBase}/api/auth/customer/reverse-geocode?lat=${latitude}&lng=${longitude}`, {
    headers: {
      Authorization: `Bearer ${userStore.customerAuthToken}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.message || 'Failed to look up your address')
  }
  return data.data
}

const refreshDashboardLocation = () => {
  if (isUpdatingLocation.value) return
  if (!navigator.geolocation) {
    locationUpdateState.value = 'error'
    locationUpdateMessage.value = 'Location is not available in this browser.'
    return
  }

  isUpdatingLocation.value = true
  locationUpdateState.value = 'idle'
  locationUpdateMessage.value = 'Updating location...'
  trackEvent('location_update_started')

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const result = await reverseGeocode(latitude, longitude)

        await userStore.updateProfile({
          home_address: result.address || null,
          home_latitude: latitude,
          home_longitude: longitude
        })

        locationUpdateState.value = 'success'
        locationUpdateMessage.value = 'Location updated.'
        trackEvent('location_updated', { success: true })
      } catch (error) {
        locationUpdateState.value = 'error'
        locationUpdateMessage.value = error.message || 'Failed to update location.'
        trackEvent('location_updated', { success: false, error: error.message })
      } finally {
        isUpdatingLocation.value = false
      }
    },
    (geoError) => {
      isUpdatingLocation.value = false
      locationUpdateState.value = 'error'
      if (geoError?.code === geoError.PERMISSION_DENIED) {
        locationUpdateMessage.value = 'Location permission was denied.'
        trackEvent('location_updated', { success: false, error: 'permission_denied' })
        return
      }
      locationUpdateMessage.value = 'Could not get your location right now.'
      trackEvent('location_updated', { success: false, error: 'location_unavailable' })
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

const loadWalletBalance = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/api/wallet`, {
      headers: { Authorization: `Bearer ${userStore.customerAuthToken}` }
    })
    const json = await response.json()
    walletBalance.value = parseFloat(json.data?.balance || 0)
  } catch (_error) {
    walletBalance.value = 0
  }
}

const loadRequestActivity = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/api/order-requests/customer`, {
      headers: { Authorization: `Bearer ${userStore.customerAuthToken}` }
    })
    const json = await response.json()
    const requests = json.data || []
    recentRequests.value = requests.slice(0, 4)
    activeRequestCount.value = requests.filter((request) => isActiveRequestStatus(request.status)).length
  } catch (_error) {
    recentRequests.value = []
    activeRequestCount.value = 0
  }
}

const loadOrderActivity = async () => {
  try {
    const orders = await userStore.getAllOrders({ limit: 12 })
    ongoingOrders.value = Array.isArray(orders) ? orders : []
  } catch (_error) {
    ongoingOrders.value = []
  }
}

const loadCompanies = async () => {
  if (companies.value.length > 0) return
  try {
    await userStore.getMyCompanies()
  } catch (_error) {
    // Keep the page usable even if company refresh fails.
  }
}

const stopHomeStatsPolling = () => {
  if (!homeStatsPollTimer) return
  clearInterval(homeStatsPollTimer)
  homeStatsPollTimer = null
}

const loadDashboard = async () => {
  await Promise.allSettled([
    loadCompanies(),
    loadWalletBalance(),
    loadRequestActivity(),
    loadOrderActivity()
  ])
  evaluateCriticalEvent()
}

const startHomeStatsPolling = async () => {
  stopHomeStatsPolling()
  await loadDashboard()
  trackEvent('dashboard_view', {
    first_time: !userStore.currentUser?.last_login,
    request_count: activeRequestCount.value,
    order_count: ongoingOrders.value.length
  })
  homeStatsPollTimer = setInterval(() => {
    loadDashboard()
  }, HOME_STATS_POLL_MS)
}

onMounted(async () => {
  try {
    if (!userStore.authInitialized) await userStore.checkAuthState()
    if (!userStore.customerAuthToken) {
      isCheckingAuth.value = false
      await navigateTo('/')
      return
    }

    await loadDashboard()
    if (currentTab.value === 'home') await startHomeStatsPolling()
  } catch (error) {
    console.error('Dashboard init error:', error)
  } finally {
    isCheckingAuth.value = false
  }
})

watch(currentTab, async (tab) => {
  if (!userStore.customerAuthToken) return
  if (tab === 'home') {
    await startHomeStatsPolling()
    trackEvent('tab_changed', { tab: 'home' })
    return
  }
  stopHomeStatsPolling()
  trackEvent('tab_changed', { tab })
})

onUnmounted(() => {
  stopHomeStatsPolling()
})
</script>

<style scoped>
.customer-app {
  width: 100%;
}

.home-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
}

/* Alert Banner */
:deep(.alert-banner) {
  margin-bottom: 0;
}

/* Quick Actions Bar - Mobile First */
.quick-actions-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e4e4e7;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.location-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  flex: 1;
}

.location-chip:hover {
  border-color: #d4d4d8;
  background: #fafafa;
}

.location-chip .material-symbols-outlined {
  font-size: 20px;
  color: #4f217a;
  flex-shrink: 0;
}

.location-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d1a20;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-icon {
  font-size: 18px;
  color: #a1a1a6;
  flex-shrink: 0;
}

.new-request-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #4F217A 0%, #520094 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(79, 33, 122, 0.2);
}

.new-request-btn:active {
  transform: scale(0.98);
}

.new-request-btn:hover {
  box-shadow: 0 6px 16px rgba(79, 33, 122, 0.3);
}

.new-request-btn .material-symbols-outlined {
  font-size: 20px;
}

/* Wallet Info Card */
.wallet-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.wallet-left {
  flex: 1;
}

.wallet-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5d4679;
}

.wallet-amount {
  margin: 4px 0 0 0;
  font-size: 1.375rem;
  font-weight: 900;
  color: #1d1a20;
}

.wallet-link-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #e4e4e7;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.75rem;
  font-weight: 600;
  color: #71717a;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.wallet-link-btn:hover {
  border-color: #d4d4d8;
  background: #fafafa;
  color: #1d1a20;
}

.wallet-link-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Partners Section */
.partners-section {
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  background: white;
  overflow: hidden;
}

.partners-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: none;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.partners-header:hover {
  background: #fafafa;
}

.partners-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1d1a20;
}

.partners-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  color: #71717a;
}

.partners-header .material-symbols-outlined {
  font-size: 24px;
  color: #71717a;
  transition: transform 0.3s;
}

.partners-header .material-symbols-outlined.rotated {
  transform: rotate(180deg);
}

.partners-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e4e4e7;
}

.partner-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #e4e4e7;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.partner-card:last-child {
  border-bottom: none;
}

.partner-card:hover {
  background: #fafafa;
}

.partner-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  background: #f4f4f5;
  color: #71717a;
  font-size: 20px;
}

.partner-info {
  flex: 1;
  min-width: 0;
}

.partner-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d1a20;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.partner-meta {
  margin: 2px 0 0 0;
  font-size: 0.75rem;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.partner-card .material-symbols-outlined {
  font-size: 20px;
  color: #a1a1a6;
  flex-shrink: 0;
}

/* Auth Loading */
.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
}

.pulse-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: #520094;
  animation: spin 0.8s linear infinite;
}

.page-view {
  min-height: 60vh;
  width: 100%;
  overflow-x: clip;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}

.collapse-enter-from {
  opacity: 0;
  max-height: 0;
}

.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Tablet and Desktop (min-width: 1024px) */
@media (min-width: 1024px) {
  .home-view {
    gap: 24px;
  }

  .quick-actions-bar {
    flex-direction: row;
    padding: 12px;
    gap: 16px;
  }

  .location-chip {
    flex: 0.7;
  }

  .new-request-btn {
    flex: 0.3;
  }

  .wallet-info-card {
    justify-content: flex-start;
    gap: 24px;
  }

  .wallet-left {
    flex: 0.5;
  }

  .wallet-link-btn {
    margin-left: auto;
  }
}

/* Small Mobile Devices */
@media (max-width: 640px) {
  .home-view {
    gap: 12px;
  }

  .quick-actions-bar {
    padding: 12px;
    gap: 8px;
  }

  .location-chip {
    padding: 10px 12px;
    font-size: 0.8125rem;
  }

  .location-text {
    font-size: 0.8125rem;
  }

  .new-request-btn {
    padding: 12px 16px;
    font-size: 0.8125rem;
  }

  .wallet-info-card {
    padding: 12px;
    gap: 12px;
  }

  .wallet-amount {
    font-size: 1.125rem;
  }

  .wallet-link-btn {
    padding: 8px 12px;
    font-size: 0.7rem;
  }

  .partners-header {
    padding: 12px;
  }

  .partner-card {
    padding: 10px 12px;
  }

  .partner-name {
    font-size: 0.8125rem;
  }

  .partner-avatar {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}
</style>
