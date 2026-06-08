// File: pages/[pharmacy]/orders.vue
<template>
  <div class="container mx-auto px-4 py-6 max-w-5xl">
    <!-- Header with back button and gradient background -->
    <div class="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-4 text-white">
      <div class="flex items-center">
        <button @click="goBack" class="mr-4 p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold">My Orders</h1>
      </div>
    </div>

    <!-- Expiry warning banner -->
    <AlertBanner
      v-if="expiringOrder && !dismissedExpiryBanner"
      :event="{
        type: 'warning',
        title: 'Request closing soon',
        description: `Your request ${expiringOrder.request_number || ''} hasn't been matched and closes in ${minutesRemaining(expiringOrder.expires_at ?? '')} min. We're still searching.`,
        actionLabel: 'View',
        id: expiringOrder.id
      }"
      @dismiss="dismissedExpiryBanner = true"
      @action="scrollToOrder(expiringOrder.id)"
    />

    <!-- Filter card with improved layout -->
    <div class="mb-8 bg-white rounded-xl shadow-lg p-5 border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 class="text-lg font-medium text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Orders
        </h2>

        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div class="flex flex-col">
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" id="startDate" v-model="dateFilter.startDate"
              class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm w-full" />
          </div>

          <div class="flex flex-col">
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" id="endDate" v-model="dateFilter.endDate"
              class="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm w-full" />
          </div>

          <div class="flex items-end">
            <button @click="clearDateFilter"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 text-sm font-medium shadow-sm w-full sm:w-auto">
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Filter status indicator with animation -->
      <div v-if="isFilterActive" class="mt-3 text-sm text-gray-600 flex items-center animate-fadeIn">
        <span class="inline-block h-2 w-2 rounded-full bg-indigo-500 mr-2"></span>
        Showing {{ filteredOrders.length }} of {{ orders.length }} orders
      </div>
    </div>

    <!-- Loading state with improved animation -->
    <div v-if="isLoading" class="py-16 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-indigo-600 mb-2"></div>
      <div class="animate-pulse">
        <p class="mt-4 text-indigo-600 font-medium text-center">Loading your orders...</p>
      </div>
    </div>

    <!-- Error state with improved styling -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-lg mb-8 animate-fadeIn">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium">{{ error }}</p>
      </div>
      <button @click="fetchOrders"
        class="mt-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>

    <!-- Not logged in state with improved styling -->
    <div v-else-if="!userStore.isLoggedIn"
      class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-5 rounded-lg shadow-lg mb-8 animate-fadeIn">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-medium">Please log in to view your order history</p>
      </div>
      <button @click="showLoginModal = true"
        class="mt-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-2 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Login Now
      </button>
    </div>

    <!-- No orders state with improved styling -->
    <div v-else-if="orders.length === 0" class="py-16 bg-white rounded-xl shadow-lg text-center animate-fadeIn">
      <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h2 class="text-2xl font-medium text-gray-900 mb-2">No orders yet</h2>
      <p class="text-gray-600 mb-8 max-w-md mx-auto">You haven't placed any orders with us yet. Start shopping to discover our products!</p>
      <button @click="goShopping"
        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Start Shopping
      </button>
    </div>

    <!-- Orders list with improved styling -->
    <div v-else class="space-y-8">
      <!-- No matching orders message when filter is active -->
      <div v-if="isFilterActive && filteredOrders.length === 0"
        class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-5 rounded-lg shadow-lg mb-8 animate-fadeIn">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="font-medium">No orders found for the selected date range.</p>
        </div>
        <button @click="clearDateFilter"
          class="mt-4 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear Filter
        </button>
      </div>

      <!-- Order cards with improved styling -->
      <div v-for="order in filteredOrders" :key="order.id" :id="`order-${order.id}`"
           class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl">
        <!-- Order header with gradient background based on status -->
        <div :class="[
          'p-5 border-b flex flex-col sm:flex-row justify-between',
          getHeaderBackgroundClass(order.status)
        ]">
          <div>
            <div class="flex items-center mb-2">
              <span class="text-sm opacity-80 mr-2">Order ID:</span>
              <span class="font-mono font-medium">{{ formatOrderId(order.orderId) }}</span>
            </div>
            <div class="text-sm opacity-80" :title="order.createdAt">
              {{ formatOrderDate(order.createdAt) }}
            </div>
          </div>
          <div class="mt-3 sm:mt-0 flex items-center">
            <span :class="[
              'px-3 py-1 rounded-full text-xs font-semibold shadow-sm',
              getStatusClass(order.status)
            ]">
              {{ capitalizeFirstLetter(order.status) }}
            </span>
          </div>
        </div>

        <!-- Order details with improved layout -->
        <div class="p-5">
          <!-- Order items with improved spacing -->
          <div class="space-y-4">
            <div v-for="(item, index) in order.items" :key="index" 
                 class="p-3 flex justify-between bg-gray-50 rounded-lg">
              <div class="flex-1">
                <p class="font-medium text-gray-800">{{ item.brandName }}</p>
                <p class="text-sm text-gray-500 mt-1">
                  {{ item.quantity }} × GHS{{ formatPrice(item.price) }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-800">GHS{{ formatPrice(item.subtotal) }}</p>
              </div>
            </div>
          </div>

          <!-- Order totals with improved styling -->
          <div class="mt-6 pt-4 border-t border-dashed">
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Total Items:</span>
              <span class="font-medium">{{ order.totalQuantity }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span class="text-indigo-700">GHS{{ formatPrice(order.totalAmount) }}</span>
            </div>
          </div>

          <!-- Action buttons with improved styling -->
          <div class="mt-6 pt-4 border-t flex flex-wrap gap-3 sm:justify-end">
            <button v-if="order.status === 'pending' || order.status === 'processing'"
              @click="cancelOrder(order.orderId)"
              class="w-full sm:w-auto px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors duration-200 font-medium">
              <span class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Order
              </span>
            </button>
            <button @click="reorderItems(order.items)"
              class="w-full sm:w-auto px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-200 font-medium shadow-md">
              <span class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reorder
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="userStore.nextCursor" class="mt-8 flex justify-center">
        <button
          :disabled="isLoadingMore"
          @click="loadMore"
          class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 inline-flex items-center gap-2 shadow-md font-medium"
        >
          <svg v-if="isLoadingMore" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ isLoadingMore ? 'Loading...' : 'Load more' }}
        </button>
      </div>
    </div>

    <!-- Reorder Cart Replace Confirmation -->
    <div v-if="reorderConfirmItems" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/50" @click="reorderConfirmItems = null"></div>
      <div class="relative z-10 bg-white rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full">
        <h3 class="text-base font-bold text-gray-900 mb-2">Replace current cart?</h3>
        <p class="text-sm text-gray-600 mb-5">This will replace your current cart with the items from this order. Continue?</p>
        <div class="flex gap-3 justify-end">
          <button @click="reorderConfirmItems = null"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button @click="doReorder(reorderConfirmItems)"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            Continue
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Order Modal -->
    <CancelOrderModal v-if="showCancelModal" :is-open="showCancelModal" :order-id="orderToCancel"
      @close="showCancelModal = false" @cancellation-success="handleCancellationSuccess" />

    <!-- Login Modal -->
    <ClientOnly>
      <Login v-if="showLoginModal" :is-open="showLoginModal" @close="showLoginModal = false"
        @login-success="handleLoginSuccess" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { timeAgo } from '~/composables/useTimeAgo'
import { usePharmacyStore } from '~/stores/pharmacy'
import { useCartStore } from '~/stores/cart'
import AlertBanner from '~/components/customers/AlertBanner.vue'

interface OrderItem {
  id: number | string
  brandName: string
  price: number | string
  quantity: number
  subtotal?: number | string
}

interface Order {
  id: number | string
  orderId: string
  status: string
  createdAt: string
  expires_at?: string | null
  items: OrderItem[]
  totalQuantity?: number
  totalAmount?: number | string
  request_number?: string | null
}

// TODO: remove once stores/ are .ts
const userStore = useUserStore() as unknown as {
  isLoggedIn: boolean
  nextCursor: string | null
  checkAuthState: () => Promise<void>
  getOrderHistory: (filters?: { status?: string; limit?: number; offset?: number; cursor?: string }) => Promise<Order[]>
}
const pharmacyStore = usePharmacyStore() as unknown as {
  pharmacySlug?: string | null
}
const cartStore = useCartStore() as unknown as {
  clearCart: () => void
  addToCart: (item: { id: number | string; name: string; price: number | string; quantity: number }) => void
  toggleCart: () => void
}

const router = useRouter()

// Page state
const orders = ref<Order[]>([])
const isLoading = ref<boolean>(false)
const isLoadingMore = ref<boolean>(false)
const error = ref<string>('')
const dismissedExpiryBanner = ref<boolean>(false)
const showLoginModal = ref<boolean>(false)
const showCancelModal = ref<boolean>(false)
const orderToCancel = ref<string>('')
const reorderConfirmItems = ref<OrderItem[] | null>(null)
const dateFilter = ref<{ startDate: string; endDate: string }>({
  startDate: '',
  endDate: '',
})

onMounted(async () => {
  await userStore.checkAuthState()
  await fetchOrders()
})

definePageMeta({
  layout: 'pharm',
  middleware: ['pharmacy'],
})

const isFilterActive = computed<boolean>(() => {
  return !!(dateFilter.value.startDate || dateFilter.value.endDate)
})

const filteredOrders = computed<Order[]>(() => {
  if (!isFilterActive.value) {
    return orders.value
  }

  return orders.value.filter(order => {
    const orderDate = new Date(order.createdAt)
    orderDate.setHours(0, 0, 0, 0)

    let isInRange = true

    if (dateFilter.value.startDate) {
      const startDate = new Date(dateFilter.value.startDate)
      startDate.setHours(0, 0, 0, 0)
      isInRange = isInRange && orderDate >= startDate
    }

    if (dateFilter.value.endDate) {
      const endDate = new Date(dateFilter.value.endDate)
      endDate.setHours(23, 59, 59, 999)
      isInRange = isInRange && orderDate <= endDate
    }

    return isInRange
  })
})

const EXPIRY_WARN_MS = 20 * 60 * 1000

const expiringOrder = computed<Order | undefined>(() =>
  orders.value.find(o =>
    o.status === 'pending' &&
    o.expires_at &&
    new Date(o.expires_at).getTime() - Date.now() > 0 &&
    new Date(o.expires_at).getTime() - Date.now() < EXPIRY_WARN_MS
  )
)

const minutesRemaining = (expiresAt: string): number =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000))

const scrollToOrder = (id: number | string): void => {
  const el = document.getElementById(`order-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const fetchOrders = async (): Promise<void> => {
  if (!userStore.isLoggedIn) return

  isLoading.value = true
  error.value = ''

  try {
    const orderHistory = await userStore.getOrderHistory()
    orders.value = orderHistory
  } catch (err) {
    console.error('Failed to fetch orders:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load your order history. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const loadMore = async (): Promise<void> => {
  if (!userStore.isLoggedIn || !userStore.nextCursor || isLoadingMore.value) return

  isLoadingMore.value = true
  try {
    const nextPage = await userStore.getOrderHistory({ cursor: userStore.nextCursor })
    orders.value = [...orders.value, ...nextPage]
  } catch (err) {
    console.error('Failed to load more orders:', err)
  } finally {
    isLoadingMore.value = false
  }
}

const formatOrderId = (orderId: string | undefined | null): string => {
  if (!orderId) return 'N/A'
  return orderId.length > 8 ? `...${orderId.slice(-8)}` : orderId
}

const formatOrderDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Unknown date'
  return timeAgo(dateString) || dateString
}

const formatPrice = (price: number | string | undefined | null): string => {
  return Number(price ?? 0).toFixed(2)
}

const capitalizeFirstLetter = (string: string | undefined | null): string => {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const getStatusClass = (status: string | undefined): string => {
  switch (status) {
    case 'pending':    return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'delivered':  return 'bg-green-100 text-green-800'
    case 'completed':  return 'bg-green-100 text-green-800'
    case 'cancelled':  return 'bg-red-100 text-red-800'
    default:           return 'bg-gray-100 text-gray-800'
  }
}

const getHeaderBackgroundClass = (status: string | undefined): string => {
  switch (status) {
    case 'pending':    return 'bg-yellow-50 text-yellow-800'
    case 'processing': return 'bg-blue-50 text-blue-800'
    case 'delivered':  return 'bg-green-50 text-green-800'
    case 'completed':  return 'bg-green-50 text-green-800'
    case 'cancelled':  return 'bg-red-50 text-red-800'
    default:           return 'bg-gray-50 text-gray-800'
  }
}

const clearDateFilter = (): void => {
  dateFilter.value.startDate = ''
  dateFilter.value.endDate = ''
}

const goBack = (): void => {
  router.back()
}

const goShopping = (): void => {
  if (pharmacyStore.pharmacySlug) {
    void router.push(`/${pharmacyStore.pharmacySlug}`)
  } else {
    void router.push('/')
  }
}

const handleLoginSuccess = async (payload: { destination?: string } = {}): Promise<void> => {
  if (payload.destination === 'new') {
    void navigateTo('/customer?tab=new')
    return
  }
  showLoginModal.value = false
  await fetchOrders()
}

const cancelOrder = (orderId: string): void => {
  orderToCancel.value = orderId
  showCancelModal.value = true
}

const handleCancellationSuccess = async (orderId: string | undefined): Promise<void> => {
  // Optimistically update status, then re-fetch immediately.
  const orderIndex = orders.value.findIndex(order => order.orderId === orderId)
  if (orderIndex !== -1) {
    const order = orders.value[orderIndex]
    if (order) order.status = 'cancelled'
  }
  showCancelModal.value = false
  await fetchOrders()
}

const doReorder = (items: OrderItem[]): void => {
  cartStore.clearCart()
  items.forEach(item => {
    cartStore.addToCart({
      id: item.id,
      name: item.brandName,
      price: item.price,
      quantity: item.quantity,
    })
  })
  reorderConfirmItems.value = null
  if (pharmacyStore.pharmacySlug) {
    void router.push(`/${pharmacyStore.pharmacySlug}`)
  } else {
    void router.push('/')
  }
  setTimeout(() => {
    cartStore.toggleCart()
  }, 500)
}

const reorderItems = (items: OrderItem[] | undefined | null): void => {
  if (!items || !items.length) return
  if (cartStore.cartItemCount > 0) {
    // Cart has items — show inline confirmation
    reorderConfirmItems.value = items
  } else {
    doReorder(items)
  }
}
</script>

<style scoped>
/* Adding animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Add smooth transitions */
.container, .rounded-xl, button {
  transition: all 0.2s ease-in-out;
}

/* Improved touch targets for mobile */
@media (max-width: 640px) {
  button {
    min-height: 44px;
  }
  
  input[type="date"] {
    min-height: 44px;
  }
}
</style>
