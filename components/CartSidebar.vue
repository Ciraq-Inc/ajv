<template>
  <div v-if="isOpenSidebar" class="fixed inset-0 bg-black/30 z-50 flex justify-end sm:justify-end">
    <!-- Cart container - full width on mobile, fixed width on desktop -->
    <div class="bg-white w-full sm:w-96 flex flex-col h-full shadow-lg">
      <!-- Header -->
      <div class="p-4 sm:p-6 border-b flex justify-between items-center">
        <h2 class="text-xl font-semibold">Your Cart</h2>
        <button @click="toggleCart" class="text-gray-600 hover:text-gray-900 p-2">
          <i class="ri-close-line text-2xl"></i>
        </button>
      </div>

      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div v-if="items.length === 0" class="text-center text-gray-500 py-8">
          Your cart is empty
        </div>

        <div v-else class="space-y-4">
          <!-- Pharmacy Name -->
          <div v-if="pharmacyStore.pharmacyData" class="mb-4 bg-gray-100 p-3 rounded-lg">
            <p class="text-sm text-gray-700">
              Order from: <span class="font-semibold">{{ pharmacyStore.pharmacyData.name }}</span>
            </p>
            <p class="text-xs text-gray-500">{{ pharmacyStore.pharmacyData.location }}</p>
          </div>

          <!-- Error message area (if any) -->
          <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {{ errorMessage }}
          </div>

          <!-- Cart items -->
          <div v-for="item in items" :key="item.id"
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3">
            <div class="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
              <img v-if="item.image" :src="item.image" :alt="item.name" class="w-12 h-12 mr-3 object-cover rounded" />
              <div>
                <h3 class="font-semibold text-sm">{{ item.name }}</h3>
                <p class="text-sm text-gray-500">GHS {{ formatPrice(item.price) }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between w-full sm:w-auto">
              <div class="flex items-center border rounded overflow-hidden">
                <button @click="updateQuantity(item.id, item.quantity - 1)" :disabled="item.quantity <= 1"
                  class="px-3 py-1 bg-gray-100 disabled:opacity-50">
                  -
                </button>
                <span class="px-3 py-1 border-x">{{ item.quantity }}</span>
                <button @click="updateQuantity(item.id, item.quantity + 1)" class="px-3 py-1 bg-gray-100">
                  +
                </button>
              </div>
              <button @click="removeFromCart(item.id)" class="ml-4 text-red-500 hover:text-red-700 p-1">
                <i class="ri-delete-bin-line text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky footer with total and checkout -->
      <div v-if="items.length > 0" class="border-t border-gray-200 p-4 sm:p-5 bg-white">
        <div class="flex justify-between items-center mb-4">
          <button @click="toggleCart"
            class="text-blue-600 hover:text-blue-800 transition-colors flex items-center">
            <i class="ri-arrow-left-line mr-1"></i>Continue Shopping
          </button>
          <div class="flex items-center">
            <span class="font-semibold mr-2">Total:</span>
            <span class="font-bold">GHS{{ formatPrice(cartTotal) }}</span>
          </div>
        </div>
        <div class="space-y-3">
          <button @click="sendWhatsAppMessage"
            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            :disabled="isProcessingOrder">
            <i class="ri-whatsapp-line text-xl mr-2"></i>Send Order via WhatsApp
          </button>
          <button @click="handleDirectOrder"
            class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            :disabled="isProcessingOrder">
            <span v-if="isProcessingOrder" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else class="flex items-center justify-center">
              <i class="ri-wallet-line text-xl mr-2"></i>Order Directly
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Login Modal -->
  <ClientOnly>
    <Login
      v-if="showLoginModal" 
      :is-open="showLoginModal"
      @close="closeLoginModal"
      @login-success="handleLoginSuccess"/>
  </ClientOnly>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCartStore } from "~/stores/cart";
import { usePharmacyStore } from "~/stores/pharmacy";
import { useUserStore } from "~/stores/user";

// Local state for the cart sidebar
const isOpenSidebar = ref(false);
const showLoginModal = ref(false);
const isProcessingOrder = ref(false);
const errorMessage = ref('');

// Store references
const cartStore = useCartStore();
const pharmacyStore = usePharmacyStore();
const userStore = useUserStore();

// Get reactive store state
const { items, cartTotal } = storeToRefs(cartStore);
const { removeFromCart, updateQuantity } = cartStore;

// Emits
const emit = defineEmits(['close', 'order-success']);

// Methods
const toggleCart = () => {
  isOpenSidebar.value = !isOpenSidebar.value;
  if (!isOpenSidebar.value) {
    emit('close');
  }
};

const sendWhatsAppMessage = () => {
  let phoneNumber = pharmacyStore.pharmacyData?.phone || '+233503793513';

  // Extract the first phone number if multiple are provided with a separator
  if (phoneNumber.includes('/')) {
    phoneNumber = phoneNumber.split('/')[0];
  }

  // Format the phone number properly for WhatsApp
  // Remove all non-digit characters
  phoneNumber = phoneNumber.replace(/\D/g, '');

  // Remove leading zero if present
  if (phoneNumber.startsWith('0')) {
    phoneNumber = phoneNumber.substring(1);
  }

  // Add country code if missing (233 for Ghana)
  if (!phoneNumber.startsWith('233')) {
    phoneNumber = '233' + phoneNumber;
  }

  const messageText = generateWhatsAppMessage();
  const encodedMessage = encodeURIComponent(messageText);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');

  cartStore.clearCart();
  toggleCart();
};

const generateWhatsAppMessage = () => {
  // Format each item with proper spacing and alignment
  const itemDetails = items.value.map((item, index) =>
    `${index + 1}. ${item.name} - *${item.quantity}*`
  ).join('\n');

  // Get pharmacy name and location
  const pharmacyName = pharmacyStore.pharmacyData?.name || 'your pharmacy';
  const pharmacyLocation = pharmacyStore.pharmacyData?.location ? ` (${pharmacyStore.pharmacyData.location})` : '';

  // Current date and time
  const now = new Date();
  const dateString = now.toLocaleDateString('en-GB');
  const timeString = now.toLocaleTimeString('en-GB');

  // Generate a more structured message
  return `*ORDER REQUEST*
Date: ${dateString} | Time: ${timeString}

Hello, I would like to order the following items from *${pharmacyName}*${pharmacyLocation}:

${itemDetails}

*Total Amount: GHS${formatPrice(cartTotal.value)}*

Please confirm if these items are available for delivery or pickup.
Thank you!`;
};

// Handle direct order
const handleDirectOrder = () => {
  errorMessage.value = ''; // Clear any previous errors
  
  // Check if user is logged in
  if (!userStore.isLoggedIn) {
    // Show login modal if not logged in
    showLoginModal.value = true;
  } else {
    // User is already logged in, proceed with direct order
    processDirectOrder();
  }
};

// Process the direct order after successful login
const processDirectOrder = async () => {
  if (!pharmacyStore.currentPharmacy) {
    errorMessage.value = 'Pharmacy information is missing. Please try again.';
    return;
  }
  
  try {
    // Show loading state
    isProcessingOrder.value = true;
    errorMessage.value = '';
    
    // Process the order through the user store
    const orderResult = await userStore.processDirectOrder(
      items.value,
      pharmacyStore.currentPharmacy
    );
    
    // After successful order, clear cart and close sidebar
    cartStore.clearCart();
    toggleCart();
    
    // Emit order success event with full order data
    emit('order-success', orderResult.orderData);
  } catch (error) {
    console.error('Failed to process order:', error);
    errorMessage.value = error.message || 'Failed to process your order. Please try again.';
  } finally {
    isProcessingOrder.value = false;
  }
};

// Close login modal
const closeLoginModal = () => {
  showLoginModal.value = false;
};

// Handle successful login
const handleLoginSuccess = () => {
  console.log('User successfully logged in');
  // Process the order after successful login
  processDirectOrder();
};

const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

// Expose methods for parent components
defineExpose({
  toggleCart: () => {
    isOpenSidebar.value = !isOpenSidebar.value;
  },
  isOpen: computed(() => isOpenSidebar.value)
});

onMounted(() => {
  // Initialize cart with safer server-client hydration
  // cartStore.init();
});
</script>
