<!-- File: pages/admin/orders-new.vue -->
<!-- 
  REST API Migrated Version of Orders Dashboard
  Replaces Firebase with Ecommerce Orders API
  Features: Auto-refresh polling, status management, real-time feel
-->
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
          <span v-if="autoRefreshEnabled" class="text-sm text-gray-500 flex items-center">
            <svg class="animate-spin h-4 w-4 mr-1 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Auto-refresh
          </span>
          
          <button @click="toggleAutoRefresh" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200">
            {{ autoRefreshEnabled ? 'Disable' : 'Enable' }} Auto-refresh
          </button>
          
          <button @click="refreshOrders" :disabled="isLoading" class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 flex items-center disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5 mr-1.5', isLoading ? 'animate-spin' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              placeholder="Search by order ID or customer name" 
              class="pl-10 px-4 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div class="w-full sm:w-48">
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            id="status-filter" 
            v-model="statusFilter"
            @change="fetchOrders"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div class="w-full sm:w-48">
          <label for="limit-filter" class="block text-sm font-medium text-gray-700 mb-1">Show</label>
          <select 
            id="limit-filter" 
            v-model="limitFilter"
            @change="fetchOrders"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option :value="25">25 orders</option>
            <option :value="50">50 orders</option>
            <option :value="100">100 orders</option>
            <option :value="200">200 orders</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Orders Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
            <p class="text-sm font-medium text-gray-500">Pending</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.pending || 0 }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center">
          <div class="bg-blue-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Confirmed</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.confirmed || 0 }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center">
          <div class="bg-purple-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Shipped</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.shipped || 0 }}</p>
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
            <p class="text-sm font-medium text-gray-500">Delivered</p>
            <p class="text-xl font-semibold text-gray-900">{{ orderStats.delivered || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && orders.length === 0" class="py-12 flex flex-col items-center justify-center bg-white rounded-lg shadow-md">
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
        <span v-if="statusFilter || searchQuery">Try changing your filters or search criteria</span>
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
            <tr v-for="order in filteredOrders" :key="order.order_id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ formatOrderId(order.order_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.customer_id || 'Customer' }}</div>
                <div class="text-sm text-gray-500">{{ order.item_count || 0 }} items</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatOrderDate(order.order_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.item_count || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                GHS {{ formatPrice(order.total_amount) }}
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
                  <button 
                    v-if="canChangeStatus(order.status)"
                    @click="updateOrderStatus(order, getNextStatus(order.status))" 
                    class="text-blue-600 hover:text-blue-900"
                  >
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
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="selectedOrder = null"></div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div class="bg-indigo-700 px-4 py-3 sm:px-6">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-white">
                Order Details - {{ selectedOrder.order_id }}
              </h3>
              <button @click="selectedOrder = null" class="text-white hover:text-gray-200 focus:outline-none">
                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div v-if="orderDetailsLoading" class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
            <div v-else-if="orderDetails" class="w-full">
              <!-- Order Summary -->
              <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                <div>
                  <p class="text-sm text-gray-500">Order ID</p>
                  <p class="text-lg font-mono font-medium">{{ orderDetails.order_id }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-500">Date Placed</p>
                  <p class="text-lg font-medium">{{ formatOrderDate(orderDetails.order_date) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Customer ID</p>
                  <p class="font-medium">{{ orderDetails.customer_id }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-500">Total Amount</p>
                  <p class="text-lg font-bold text-indigo-600">GHS {{ formatPrice(orderDetails.total_amount) }}</p>
                </div>
              </div>

              <!-- Order Status Management -->
              <div class="mb-4 pb-4 border-b">
                <h4 class="font-medium text-gray-800 mb-3">Order Status</h4>
                <div class="flex items-center gap-3">
                  <span :class="[
                    'px-4 py-2 inline-flex text-sm font-semibold rounded-full',
                    getStatusClass(orderDetails.status)
                  ]">
                    {{ capitalizeFirstLetter(orderDetails.status) }}
                  </span>
                  
                  <div class="flex-1"></div>
                  
                  <select 
                    v-model="selectedStatus" 
                    class="rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <button 
                    @click="updateOrderStatusFromModal"
                    :disabled="updatingStatus || selectedStatus === orderDetails.status"
                    class="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ updatingStatus ? 'Updating...' : 'Update Status' }}
                  </button>
                </div>
              </div>

              <!-- Order Items -->
              <h4 class="font-medium text-gray-800 mb-3">Order Items</h4>
              <div class="border rounded-lg overflow-hidden mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(item, index) in orderDetails.items" :key="index">
                      <td class="px-4 py-3 text-sm">
                        <div class="font-medium text-gray-900">{{ item.brand_name || 'Product' }}</div>
                        <div class="text-xs text-gray-500">{{ item.master_name }}</div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500 text-center">
                        {{ item.unit }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500 text-center font-medium">
                        {{ item.qty }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500 text-right">
                        GHS {{ formatPrice(item.selling_price) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500 text-right">
                        GHS {{ formatPrice(item.discount || 0) }}
                      </td>
                      <td class="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        GHS {{ formatPrice(item.line_total) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-gray-50">
                    <tr>
                      <td colspan="3" class="px-4 py-3 text-sm text-gray-500 text-right">
                        Total Items: {{ orderDetails.total_items }}
                      </td>
                      <td colspan="2" class="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        Total:
                      </td>
                      <td class="px-4 py-3 text-sm font-bold text-indigo-600 text-right">
                        GHS {{ formatPrice(orderDetails.total_amount) }}
                      </td>
                    </tr>
                    <tr v-if="orderDetails.total_discount > 0">
                      <td colspan="5" class="px-4 py-2 text-sm text-gray-500 text-right">
                        Total Discount:
                      </td>
                      <td class="px-4 py-2 text-sm text-green-600 text-right">
                        -GHS {{ formatPrice(orderDetails.total_discount) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              @click="selectedOrder = null"
              class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePharmacyStore } from '~/stores/pharmacy';

const router = useRouter();
const pharmacyStore = usePharmacyStore();
const config = useRuntimeConfig();

// Define page metadata
definePageMeta({
  layout: 'pharm',
  middleware: ['admin-auth']
});

// State
const orders = ref([]);
const orderDetails = ref(null);
const isLoading = ref(false);
const orderDetailsLoading = ref(false);
const updatingStatus = ref(false);
const error = ref('');
const searchQuery = ref('');
const statusFilter = ref('');
const limitFilter = ref(50);
const selectedOrder = ref(null);
const selectedStatus = ref('pending');
const autoRefreshEnabled = ref(true);
const refreshInterval = ref(null);

// Order statistics
const orderStats = ref({
  total: 0,
  pending: 0,
  confirmed: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0
});

// Watch for selected order changes
watch(selectedOrder, async (newOrder) => {
  if (newOrder) {
    selectedStatus.value = newOrder.status || 'pending';
    await fetchOrderDetails(newOrder.order_id);
  } else {
    orderDetails.value = null;
  }
});

// Computed filtered orders (client-side search only)
const filteredOrders = computed(() => {
  let result = [...orders.value];
  
  // Apply search filter (client-side)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(order => 
      (order.order_id && order.order_id.toLowerCase().includes(query)) ||
      (order.customer_id && order.customer_id.toLowerCase().includes(query))
    );
  }
  
  return result;
});

// Fetch orders from API
const fetchOrders = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    // Get admin token (implement your auth logic)
    const adminToken = localStorage.getItem('adminToken') || '';
    
    // Build query params
    const params = new URLSearchParams();
    if (statusFilter.value) params.append('status', statusFilter.value);
    if (limitFilter.value) params.append('limit', limitFilter.value);
    
    const url = `${config.public.apiBase}/api/orders?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }
    
    orders.value = data.data || [];
    updateOrderStats();
    
  } catch (err) {
    console.error('Error fetching orders:', err);
    error.value = err.message || 'Failed to load orders. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Fetch order details
const fetchOrderDetails = async (orderId) => {
  orderDetailsLoading.value = true;
  
  try {
    const adminToken = localStorage.getItem('adminToken') || '';
    const url = `${config.public.apiBase}/api/orders/${orderId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch order details');
    }
    
    orderDetails.value = data.data;
    
  } catch (err) {
    console.error('Error fetching order details:', err);
    alert('Failed to load order details: ' + err.message);
  } finally {
    orderDetailsLoading.value = false;
  }
};

// Update order status
const updateOrderStatus = async (order, newStatus) => {
  if (!confirm(`Are you sure you want to change this order to "${newStatus}"?`)) {
    return;
  }
  
  try {
    const adminToken = localStorage.getItem('adminToken') || '';
    const url = `${config.public.apiBase}/api/orders/${order.order_id}/status`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update order status');
    }
    
    // Update local state
    const orderIndex = orders.value.findIndex(o => o.order_id === order.order_id);
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = newStatus;
      updateOrderStats();
    }
    
    alert('Order status updated successfully!');
    
  } catch (err) {
    console.error('Error updating order status:', err);
    alert('Failed to update order status: ' + err.message);
  }
};

// Update order status from modal
const updateOrderStatusFromModal = async () => {
  if (!orderDetails.value) return;
  
  updatingStatus.value = true;
  
  try {
    const adminToken = localStorage.getItem('adminToken') || '';
    const url = `${config.public.apiBase}/api/orders/${orderDetails.value.order_id}/status`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: selectedStatus.value })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update order status');
    }
    
    // Update local state
    orderDetails.value.status = selectedStatus.value;
    const orderIndex = orders.value.findIndex(o => o.order_id === orderDetails.value.order_id);
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = selectedStatus.value;
      updateOrderStats();
    }
    
    alert('Order status updated successfully!');
    
  } catch (err) {
    console.error('Error updating order status:', err);
    alert('Failed to update order status: ' + err.message);
  } finally {
    updatingStatus.value = false;
  }
};

// Calculate order statistics
const updateOrderStats = () => {
  const stats = {
    total: orders.value.length,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  orders.value.forEach(order => {
    if (order.status && stats[order.status] !== undefined) {
      stats[order.status]++;
    }
  });
  
  orderStats.value = stats;
};

// Toggle auto-refresh
const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

// Start auto-refresh
const startAutoRefresh = () => {
  stopAutoRefresh(); // Clear any existing interval
  refreshInterval.value = setInterval(() => {
    fetchOrders();
  }, 30000); // Refresh every 30 seconds
};

// Stop auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// Utility functions
const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  fetchOrders();
};

const formatOrderId = (orderId) => {
  if (!orderId) return 'N/A';
  return orderId.length > 12 ? `...${orderId.slice(-12)}` : orderId;
};

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

const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusActionText = (status) => {
  switch (status) {
    case 'pending':
      return 'Confirm';
    case 'confirmed':
      return 'Ship';
    case 'shipped':
      return 'Mark Delivered';
    default:
      return 'Update';
  }
};

const getNextStatus = (status) => {
  switch (status) {
    case 'pending':
      return 'confirmed';
    case 'confirmed':
      return 'shipped';
    case 'shipped':
      return 'delivered';
    default:
      return status;
  }
};

const canChangeStatus = (status) => {
  return status !== 'delivered' && status !== 'cancelled';
};

const viewOrderDetails = (order) => {
  selectedOrder.value = order;
};

const refreshOrders = () => {
  fetchOrders();
};

const goToPharmacyHome = () => {
  if (pharmacyStore.pharmacySlug) {
    router.push(`/${pharmacyStore.pharmacySlug}`);
  } else {
    router.push('/');
  }
};

// Lifecycle hooks
onMounted(async () => {
  await fetchOrders();
  
  if (autoRefreshEnabled.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
/* Add any custom styles here */
</style>
