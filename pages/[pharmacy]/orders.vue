// File: pages/[pharmacy]/orders.vue
<template>
  <div class="container mx-auto p-4">
    <!-- Header with back button -->
    <div class="mb-6 flex items-center">
      <button @click="goBack" class="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-800">My Orders</h1>
    </div>

    <div class="mb-6 bg-white rounded-lg shadow-md p-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 class="text-lg font-medium text-gray-800">Filter Orders</h2>

        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div class="flex flex-col">
            <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" id="startDate" v-model="dateFilter.startDate"
              class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
          </div>

          <div class="flex flex-col">
            <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" id="endDate" v-model="dateFilter.endDate"
              class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
          </div>

          <div class="flex items-end">
            <button @click="clearDateFilter"
              class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200 text-sm">
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      <!-- Filter status indicator -->
      <div v-if="isFilterActive" class="mt-3 text-sm text-gray-600">
        Showing {{ filteredOrders.length }} of {{ orders.length }} orders
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      <p class="mt-4 text-indigo-600 font-medium">Loading your orders...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-md mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium">{{ error }}</p>
      </div>
      <button @click="fetchOrders"
        class="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>

    <!-- Not logged in state -->
    <div v-else-if="!userStore.isLoggedIn"
      class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-5 rounded-lg shadow-md mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-medium">Please log in to view your order history</p>
      </div>
      <button @click="showLoginModal = true"
        class="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Login Now
      </button>
    </div>

    <!-- No orders state -->
    <div v-else-if="orders.length === 0" class="py-16 bg-white rounded-xl shadow-md text-center">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-500 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h2 class="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
      <p class="text-gray-600 mb-6">You haven't placed any orders with us yet</p>
      <button @click="goShopping"
        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Start Shopping
      </button>
    </div>

    <!-- Orders list -->
    <div v-else class="space-y-6">
      <!-- No matching orders message when filter is active -->
      <div v-if="isFilterActive && filteredOrders.length === 0"
        class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-5 rounded-lg shadow-md mb-6">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="font-medium">No orders found for the selected date range.</p>
        </div>
        <button @click="clearDateFilter"
          class="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear Filter
        </button>
      </div>

      <!-- Order cards -->
      <div v-for="order in filteredOrders" :key="order.id" class="bg-white rounded-lg shadow-md overflow-hidden">
        <!-- Order header -->
        <div class="bg-gray-50 border-b p-4 flex flex-col sm:flex-row justify-between">
          <div>
            <div class="flex items-center mb-1">
              <span class="text-sm text-gray-500 mr-2">Order ID:</span>
              <span class="font-mono font-medium text-gray-800">{{ formatOrderId(order.orderId) }}</span>
            </div>
            <div class="text-sm text-gray-500">
              {{ formatOrderDate(order.createdAt) }}
            </div>
          </div>
          <div class="mt-2 sm:mt-0 flex items-center">
            <span :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              getStatusClass(order.status)
            ]">
              {{ capitalizeFirstLetter(order.status) }}
            </span>
          </div>
        </div>

        <!-- Order details -->
        <div class="p-4">
          <!-- Order items -->
          <div class="divide-y divide-gray-100">
            <div v-for="(item, index) in order.items" :key="index" class="py-3 flex justify-between">
              <div class="flex-1">
                <p class="font-medium text-gray-800">{{ item.brandName }}</p>
                <p class="text-sm text-gray-500">
                  {{ item.quantity }} × GHS{{ formatPrice(item.price) }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium">GHS{{ formatPrice(item.subtotal) }}</p>
              </div>
            </div>
          </div>

          <!-- Order totals -->
          <div class="mt-4 pt-4 border-t">
            <div class="flex justify-between mb-1">
              <span class="text-gray-600">Total Items:</span>
              <span class="font-medium">{{ order.totalQuantity }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>GHS{{ formatPrice(order.totalAmount) }}</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-end">
            <button v-if="order.status === 'pending' || order.status === 'processing'"
              @click="cancelOrder(order.orderId)"
              class="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200">
              Cancel Order
            </button>
            <button @click="reorderItems(order.items)"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200">
              Reorder
            </button>
          </div>
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

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '~/stores/user';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';

const router = useRouter();
const userStore = useUserStore();
const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();

// Page state
const orders = ref([]);
const isLoading = ref(false);
const error = ref('');
const showLoginModal = ref(false);
const showCancelModal = ref(false);
const orderToCancel = ref('');
const dateFilter = ref({
  startDate: '',
  endDate: ''
});


onMounted(async () => {
  // First check if user is authenticated
  await userStore.checkAuthState();
  // Then fetch orders
  await fetchOrders()
});

// Define page metadata
definePageMeta({
  layout: 'pharm',
  middleware: ['pharmacy']
});

const isFilterActive = computed(() => {
  return dateFilter.value.startDate || dateFilter.value.endDate;
});

const filteredOrders = computed(() => {
  if (!isFilterActive.value) {
    return orders.value;
  }

  return orders.value.filter(order => {
    const orderDate = new Date(order.createdAt);

    // Set time to midnight for proper comparison
    orderDate.setHours(0, 0, 0, 0);

    // Check if the order date is within the selected range
    let isInRange = true;

    if (dateFilter.value.startDate) {
      const startDate = new Date(dateFilter.value.startDate);
      startDate.setHours(0, 0, 0, 0);
      isInRange = isInRange && orderDate >= startDate;
    }

    if (dateFilter.value.endDate) {
      const endDate = new Date(dateFilter.value.endDate);
      endDate.setHours(23, 59, 59, 999); // End of the day
      isInRange = isInRange && orderDate <= endDate;
    }

    return isInRange;
  });
});

// Fetch order history from user store
const fetchOrders = async () => {
  if (!userStore.isLoggedIn) return;

  isLoading.value = true;
  error.value = '';

  try {
    const orderHistory = await userStore.getOrderHistory();
    orders.value = orderHistory;
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    error.value = err.message || 'Failed to load your order history. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Format order ID to be more readable
const formatOrderId = (orderId) => {
  if (!orderId) return 'N/A';

  // Return the last 8 characters if it's too long
  return orderId.length > 8 ? `...${orderId.slice(-8)}` : orderId;
};

// Format order date to be more readable
const formatOrderDate = (dateString) => {
  if (!dateString) return 'Unknown date';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
};

// Format price with 2 decimal places
const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

// Capitalize the first letter of a string
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Get CSS classes for different order statuses
const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const clearDateFilter = () => {
  dateFilter.value.startDate = '';
  dateFilter.value.endDate = '';
};

// Navigation functions
const goBack = () => {
  router.back();
};

const goShopping = () => {
  if (pharmacyStore.pharmacySlug) {
    router.push(`/${pharmacyStore.pharmacySlug}`);
  } else {
    router.push('/');
  }
};

// Handle login success
const handleLoginSuccess = async () => {
  showLoginModal.value = false;
  await fetchOrders();
};

// Cancel an order
const cancelOrder = async (orderId) => {
  orderToCancel.value = orderId;
  showCancelModal.value = true;
};

// Handle cancellation success
const handleCancellationSuccess = async (orderId) => {
  // Find the order in the list and update its status locally
  const orderIndex = orders.value.findIndex(order => order.orderId === orderId);
  if (orderIndex !== -1) {
    orders.value[orderIndex].status = 'cancelled';
  }

  // Fetch updated orders to ensure everything is in sync
  setTimeout(() => {
    fetchOrders();
  }, 1500); // Give the modal time to close
};

// Reorder items from a previous order
const reorderItems = (items) => {
  if (!items || !items.length) return;

  // Clear the cart first
  cartStore.clearCart();

  // Add each item to the cart
  items.forEach(item => {
    cartStore.addToCart({
      id: item.id,
      name: item.brandName,
      price: item.price,
      quantity: item.quantity,
    });
  });

  // Navigate to the pharmacy page
  if (pharmacyStore.pharmacySlug) {
    router.push(`/${pharmacyStore.pharmacySlug}`);
  } else {
    router.push('/');
  }

  // Open the cart sidebar
  setTimeout(() => {
    cartStore.toggleCart();
  }, 500);
};
</script>