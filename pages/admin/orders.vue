<!-- File: pages/admin/orders.vue -->
<template>
  <div class="container mx-auto p-4">
    <!-- Admin Header -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl font-bold text-gray-800">Pharmacy Orders</h1>
          <p class="text-gray-600 mt-1">Manage all customer orders for your pharmacy</p>
        </div>
        
        <div class="flex items-center space-x-3">
          <button @click="refreshOrders" class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <button @click="goToPharmacyHome" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Pharmacy Home
          </button>
        </div>
      </div>
    </div>

    <!-- Filter and Search Section -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search Orders</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              id="search" 
              v-model="searchQuery"
              placeholder="Search by order ID, customer name, or phone" 
              class="pl-10 px-4 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div class="w-full sm:w-48">
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            id="status-filter" 
            v-model="statusFilter"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div class="w-full sm:w-48">
          <label for="date-filter" class="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
          <select 
            id="date-filter" 
            v-model="dateFilter"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Orders Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center">
          <div class="bg-indigo-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Orders</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.total || 0 }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center">
          <div class="bg-yellow-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Pending Orders</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.pending || 0 }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center">
          <div class="bg-blue-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Processing</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.processing || 0 }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center">
          <div class="bg-green-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Completed</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.completed || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      <p class="mt-4 text-indigo-600 font-medium">Loading orders...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-md mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium">{{ error }}</p>
      </div>
      <button @click="refreshOrders" class="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>

    <!-- No Orders State -->
    <div v-else-if="filteredOrders.length === 0" class="py-16 bg-white rounded-xl shadow-md text-center">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-500 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h2 class="text-xl font-medium text-gray-900 mb-2">No orders found</h2>
      <p class="text-gray-600 mb-6">
        <span v-if="statusFilter !== 'all' || dateFilter !== 'all' || searchQuery">Try changing your filters or search criteria</span>
        <span v-else>Your pharmacy hasn't received any orders yet</span>
      </p>
      <button @click="resetFilters" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset Filters
      </button>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="order in filteredOrders" :key="order.orderId" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ formatOrderId(order.orderId) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.customerInfo?.name || 'Customer' }}</div>
                <div class="text-sm text-gray-500">{{ order.customerInfo?.phone || 'No phone' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatOrderDate(order.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.totalQuantity || order.items?.length || 0 }} items
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                GHS{{ formatPrice(order.totalAmount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                  getStatusClass(order.status)
                ]">
                  {{ capitalizeFirstLetter(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button @click="viewOrderDetails(order)" class="text-indigo-600 hover:text-indigo-900">
                    View
                  </button>
                  <button @click="updateOrderStatus(order, getNextStatus(order.status))" :disabled="order.status === 'completed' || order.status === 'cancelled'" class="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ getStatusActionText(order.status) }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="selectedOrder" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div class="bg-indigo-700 px-4 py-3 sm:px-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-white">
                Order Details
              </h3>
              <button @click="selectedOrder = null" class="text-white hover:text-gray-200 focus:outline-none">
                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="w-full">
                <!-- Order ID and Date -->
                <div class="flex justify-between mb-4">
                  <div>
                    <p class="text-sm text-gray-500">Order ID</p>
                    <p class="text-lg font-mono font-medium">{{ selectedOrder.orderId }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-500">Date Placed</p>
                    <p class="text-lg font-medium">{{ formatOrderDate(selectedOrder.createdAt) }}</p>
                  </div>
                </div>

                <!-- Customer Info -->
                <div class="border rounded-lg p-4 mb-4 bg-gray-50">
                  <h4 class="font-medium text-gray-800 mb-2">Customer Information</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p class="text-sm text-gray-500">Name</p>
                      <p class="font-medium">{{ selectedOrder.customerInfo?.name || 'Not provided' }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-500">Phone</p>
                      <p class="font-medium">{{ selectedOrder.customerInfo?.phone || 'Not provided' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Order Status -->
                <div class="mb-4">
                  <h4 class="font-medium text-gray-800 mb-2">Order Status</h4>
                  <div class="flex items-center gap-3">
                    <span :class="[
                      'px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full',
                      getStatusClass(selectedOrder.status)
                    ]">
                      {{ capitalizeFirstLetter(selectedOrder.status) }}
                    </span>
                    
                    <div class="flex-1"></div>
                    
                    <select 
                      v-model="selectedStatus" 
                      class="rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <button 
                      @click="updateOrderStatus(selectedOrder, selectedStatus)"
                      class="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Update Status
                    </button>
                  </div>
                </div>

                <!-- Order Items -->
                <h4 class="font-medium text-gray-800 mb-2">Order Items</h4>
                <div class="border rounded-lg overflow-hidden mb-4">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="(item, index) in selectedOrder.items" :key="index">
                        <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {{ item.brandName }}
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                          {{ item.quantity }}
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          GHS{{ formatPrice(item.price) }}
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          GHS{{ formatPrice(item.subtotal) }}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-gray-50">
                      <tr>
                        <td colspan="3" class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          Total:
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                          GHS{{ formatPrice(selectedOrder.totalAmount) }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <!-- Order Notes -->
                <h4 class="font-medium text-gray-800 mb-2">Order Notes</h4>
                <textarea 
                  v-model="orderNotes" 
                  rows="3"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add notes about this order (delivery instructions, etc.)"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              @click="saveOrderNotes"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save Notes
            </button>
            <button 
              @click="selectedOrder = null"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePharmacyStore } from '~/stores/pharmacy';
import { getDatabase, ref as dbRef, get, update, onValue, off } from 'firebase/database';

const router = useRouter();
const pharmacyStore = usePharmacyStore();

// Define page metadata
definePageMeta({
  layout: 'pharm',
  middleware: ['admin'] // You would need to create this middleware
});

// State
const orders = ref([]);
const isLoading = ref(true);
const error = ref('');
const searchQuery = ref('');
const statusFilter = ref('all');
const dateFilter = ref('all');
const selectedOrder = ref(null);
const selectedStatus = ref('pending');
const orderNotes = ref('');
const orderStats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  delivered: 0,
  cancelled: 0
});

// Initialize selected status when opening the modal
watch(selectedOrder, (newOrder) => {
  if (newOrder) {
    selectedStatus.value = newOrder.status || 'pending';
    orderNotes.value = newOrder.notes || '';
  }
});

// Computed properties
const filteredOrders = computed(() => {
  let result = [...orders.value];
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(order => order.status === statusFilter.value);
  }
  
  // Apply date filter
  if (dateFilter.value !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    result = result.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      switch (dateFilter.value) {
        case 'today':
          return orderDate >= today;
        case 'yesterday':
          return orderDate >= yesterday && orderDate < today;
        case 'week':
          return orderDate >= startOfWeek;
        case 'month':
          return orderDate >= startOfMonth;
        default:
          return true;
      }
    });
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(order => 
      (order.orderId && order.orderId.toLowerCase().includes(query)) ||
      (order.customerInfo?.name && order.customerInfo.name.toLowerCase().includes(query)) ||
      (order.customerInfo?.phone && order.customerInfo.phone.toLowerCase().includes(query))
    );
  }
  
  return result;
});

// Fetch orders for the pharmacy
const fetchOrders = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    // Check if pharmacy ID is available
    if (!pharmacyStore.currentPharmacy) {
      await pharmacyStore.restoreFromStorage();
      
      if (!pharmacyStore.currentPharmacy) {
        throw new Error('Pharmacy information is missing. Please try again.');
      }
    }
    
    const db = getDatabase();
    const ordersRef = dbRef(db, `pharmacies/${pharmacyStore.currentPharmacy}/orders`);
    
    // Use onValue for real-time updates
    onValue(ordersRef, async (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const ordersArray = [];
        
        // Process each order
        for (const [orderId, orderSummary] of Object.entries(ordersData)) {
          try {
            // Fetch the full order details
            const fullOrderRef = dbRef(db, `orders/${orderSummary.userId}/${orderId}`);
            const fullOrderSnapshot = await get(fullOrderRef);
            
            if (fullOrderSnapshot.exists()) {
              const fullOrderData = fullOrderSnapshot.val();
              ordersArray.push({
                ...fullOrderData,
                id: orderId
              });
            } else {
              // Fallback to summary if full details aren't available
              ordersArray.push({
                ...orderSummary,
                id: orderId,
                orderId: orderId
              });
            }
          } catch (err) {
            console.error(`Error fetching details for order ${orderId}:`, err);
            // Still add the summary to avoid missing orders
            ordersArray.push({
              ...orderSummary,
              id: orderId,
              orderId: orderId
            });
          }
        }
        
        // Sort by date, newest first
        ordersArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Update orders state
        orders.value = ordersArray;
        
        // Update order stats
        updateOrderStats();
      } else {
        orders.value = [];
        updateOrderStats();
      }
      
      isLoading.value = false;
    }, (err) => {
      console.error('Error fetching orders:', err);
      error.value = err.message || 'Failed to load orders. Please try again.';
      isLoading.value = false;
    });
    
  } catch (err) {
    console.error('Error setting up orders listener:', err);
    error.value = err.message || 'Failed to load orders. Please try again.';
    isLoading.value = false;
  }
};

// Calculate order statistics
const updateOrderStats = () => {
  const stats = {
    total: orders.value.length,
    pending: 0,
    processing: 0,
    completed: 0,
    delivered: 0,
    cancelled: 0
  };
  
  orders.value.forEach(order => {
    if (order.status && stats[order.status] !== undefined) {
      stats[order.status]++;
    } else if (order.status === 'delivered') {
      stats.completed++;
    }
  });
  
  orderStats.value = stats;
};

// Reset filters
const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  dateFilter.value = 'all';
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

// Get appropriate action text based on current status
const getStatusActionText = (status) => {
  switch (status) {
    case 'pending':
      return 'Process';
    case 'processing':
      return 'Complete';
    case 'delivered':
      return 'Mark Complete';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Update';
  }
};

// Get next logical status for a given status
const getNextStatus = (status) => {
  switch (status) {
    case 'pending':
      return 'processing';
    case 'processing':
      return 'completed';
    case 'delivered':
      return 'completed';
    default:
      return status;
  }
};

// View order details
const viewOrderDetails = (order) => {
  selectedOrder.value = { ...order };
  selectedStatus.value = order.status || 'pending';
  orderNotes.value = order.notes || '';
};

// Update order status
const updateOrderStatus = async (order, newStatus) => {
  try {
    const db = getDatabase();
    
    // Update in main orders list
    if (order.userId) {
      const orderRef = dbRef(db, `orders/${order.userId}/${order.orderId}`);
      await update(orderRef, { status: newStatus });
    }
    
    // Update in pharmacy orders list
    const pharmacyOrderRef = dbRef(db, `pharmacies/${pharmacyStore.currentPharmacy}/orders/${order.orderId}`);
    await update(pharmacyOrderRef, { status: newStatus });
    
    // Update in the local state
    if (selectedOrder.value && selectedOrder.value.orderId === order.orderId) {
      selectedOrder.value.status = newStatus;
    }
    
    // Find and update the order in the orders array
    const orderIndex = orders.value.findIndex(o => o.orderId === order.orderId);
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = newStatus;
      updateOrderStats();
    }
    
  } catch (err) {
    console.error('Error updating order status:', err);
    alert('Failed to update order status: ' + (err.message || 'Unknown error'));
  }
};

// Save order notes
const saveOrderNotes = async () => {
  if (!selectedOrder.value) return;
  
  try {
    const db = getDatabase();
    
    // Update in main orders list
    if (selectedOrder.value.userId) {
      const orderRef = dbRef(db, `orders/${selectedOrder.value.userId}/${selectedOrder.value.orderId}`);
      await update(orderRef, { notes: orderNotes.value });
    }
    
    // Find and update the order in the orders array
    const orderIndex = orders.value.findIndex(o => o.orderId === selectedOrder.value.orderId);
    if (orderIndex !== -1) {
      orders.value[orderIndex].notes = orderNotes.value;
    }
    
    alert('Order notes saved successfully');
    
  } catch (err) {
    console.error('Error saving order notes:', err);
    alert('Failed to save order notes: ' + (err.message || 'Unknown error'));
  }
};

// Navigation
const goToPharmacyHome = () => {
  if (pharmacyStore.pharmacySlug) {
    router.push(`/${pharmacyStore.pharmacySlug}`);
  } else {
    router.push('/');
  }
};

// Refresh orders
const refreshOrders = () => {
  fetchOrders();
};

// Lifecycle hooks
onMounted(async () => {
  await fetchOrders();
});

// Clean up listeners when component is unmounted
onUnmounted(() => {
  // Remove Firebase listeners to prevent memory leaks
  const db = getDatabase();
  if (pharmacyStore.currentPharmacy) {
    const ordersRef = dbRef(db, `pharmacies/${pharmacyStore.currentPharmacy}/orders`);
    off(ordersRef);
  }
});
</script>