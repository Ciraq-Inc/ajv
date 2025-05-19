<!-- components/CancelOrderModal.vue -->
<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black opacity-50" @click="closeModal"></div>

    <!-- Modal Container -->
    <div class="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-red-600 text-white py-4 px-6">
        <h3 class="text-lg font-medium">Cancel Order</h3>
        <p class="text-red-100 text-sm mt-1">
          Order #{{ formatOrderId }}
        </p>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <div v-if="isSuccess" class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">Your order has been successfully cancelled.</p>
            </div>
          </div>
        </div>

        <div v-if="!isSuccess">
          <p class="mb-4 text-gray-700">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>

          <div class="mb-4">
            <label for="cancellationReason" class="block text-sm font-medium text-gray-700 mb-1">
              Reason for cancellation (optional)
            </label>
            <select v-model="cancellationReason" id="cancellationReason"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500 focus:ring-red-500">
              <option value="">-- Select a reason --</option>
              <option value="Changed mind">Changed my mind</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Found better alternative">Found a better alternative</option>
              <option value="Taking too long">Taking too long to process</option>
              <option value="Other">Other reason</option>
            </select>
          </div>

          <div v-if="cancellationReason === 'Other'" class="mb-4">
            <label for="otherReason" class="block text-sm font-medium text-gray-700 mb-1">
              Specify other reason
            </label>
            <textarea v-model="otherReasonText" id="otherReason" rows="2"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500 focus:ring-red-500"
              placeholder="Please specify your reason"></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button v-if="!isSuccess" type="button" @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Keep Order
          </button>

          <button v-if="!isSuccess" type="submit" @click="confirmCancellation" :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              Processing...
            </span>
            <span v-else>Cancel Order</span>
          </button>

          <button v-if="isSuccess" type="button" @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user';

const props = defineProps({
  isOpen: Boolean,
  orderId: String
});

const emit = defineEmits(['close', 'cancellation-success']);
const userStore = useUserStore();

// State management
const isLoading = ref(false);
const errorMessage = ref('');
const cancellationReason = ref('');
const otherReasonText = ref('');
const isSuccess = ref(false);

// Format order ID to be more readable
const formatOrderId = computed(() => {
  if (!props.orderId) return 'N/A';
  
  // Return the last 8 characters if it's too long
  return props.orderId.length > 8 ? `...${props.orderId.slice(-8)}` : props.orderId;
});

// Get final reason text (either selected reason or other reason text)
const finalReason = computed(() => {
  if (cancellationReason.value === 'Other' && otherReasonText.value) {
    return otherReasonText.value;
  }
  return cancellationReason.value;
});

// Confirm cancellation
const confirmCancellation = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    await userStore.cancelOrder(props.orderId, finalReason.value);
    isSuccess.value = true;
    emit('cancellation-success', props.orderId);
  } catch (error) {
    console.error('Error cancelling order:', error);
    errorMessage.value = error.message || 'Failed to cancel order. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Close the modal and reset state
const closeModal = () => {
  if (isSuccess.value) {
    // If cancellation was successful, delay closing to show success message
    setTimeout(() => {
      emit('close');
      // Reset the state after closing animation
      setTimeout(() => {
        isSuccess.value = false;
        errorMessage.value = '';
        cancellationReason.value = '';
        otherReasonText.value = '';
      }, 300);
    }, 1000);
  } else {
    emit('close');
    // Reset state after closing animation
    setTimeout(() => {
      errorMessage.value = '';
      cancellationReason.value = '';
      otherReasonText.value = '';
    }, 300);
  }
};
</script>