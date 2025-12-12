<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="close"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div class="transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <!-- Success Icon & Header -->
          <div class="bg-green-50 px-4 py-8 sm:px-6 text-center">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-2xl font-semibold leading-6 text-green-700">
                Order Successful!
              </h3>
              <div class="mt-2">
                <p class="text-gray-600">
                  Your order has been successfully placed with {{ pharmacyName }}
                </p>
              </div>
            </div>
          </div>

          <!-- Order Details -->
          <div class="bg-white px-4 py-5 sm:p-6">
            <div class="space-y-4">
              <!-- Order ID -->
              <div class="flex justify-between items-center pb-3 border-b border-gray-200">
                <span class="text-gray-600">Order ID:</span>
                <span class="font-medium font-mono text-gray-900">{{ formatOrderId(orderId) }}</span>
              </div>

              <!-- Order Summary -->
              <div>
                <h4 class="text-sm uppercase font-medium text-gray-500 mb-3">Order Summary</h4>
                <div class="bg-gray-50 rounded-lg p-3 mb-3">
                  <div class="flex justify-between text-sm mb-1">
                    <span>Total Items:</span>
                    <span>{{ orderSummary.totalItems || 0 }}</span>
                  </div>
                  <div class="flex justify-between text-sm mb-1">
                    <span>Total Quantity:</span>
                    <span>{{ orderSummary.totalQuantity || 0 }}</span>
                  </div>
                  <div class="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>GHS{{ formatPrice(orderSummary.totalAmount) }}</span>
                  </div>
                </div>
              </div>

              <!-- Status Info -->
              <div class="bg-blue-50 border-l-4 border-blue-400 p-4 text-sm text-blue-700">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p>Your order has been received and is being processed. You can track its status in your order history.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button @click="viewOrderHistory" type="button" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto">
              View Order History
            </button>
            <button @click="continueShopping" type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePharmacyStore } from '~/stores/pharmacy';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: String,
    default: ''
  },
  orderSummary: {
    type: Object,
    default: () => ({
      totalItems: 0,
      totalQuantity: 0,
      totalAmount: 0
    })
  }
});

const emit = defineEmits(['close']);

const router = useRouter();
const pharmacyStore = usePharmacyStore();

// Format pharmacy name
const pharmacyName = computed(() => {
  return pharmacyStore.pharmacyData?.name || 'the pharmacy';
});

// Format order ID to be more readable
const formatOrderId = (orderId) => {
  if (!orderId) return 'N/A';
  
  // Return the last 8 characters if it's too long
  return orderId.length > 8 ? `...${orderId.slice(-8)}` : orderId;
};

// Format price with 2 decimal places
const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

// Close the modal
const close = () => {
  emit('close');
};

// Go to order history
const viewOrderHistory = () => {
  close();
  router.push('/customer');
};

// Continue shopping
const continueShopping = () => {
  close();
  // Go back to pharmacy page
  if (pharmacyStore.pharmacySlug) {
    router.push(`/${pharmacyStore.pharmacySlug}`);
  }
};
</script>