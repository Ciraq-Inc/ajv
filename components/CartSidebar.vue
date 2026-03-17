<template>
  <div v-if="isOpenSidebar" class="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]">
    <div class="flex h-full w-full flex-col bg-white shadow-2xl sm:w-[430px]">
      <div class="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">Cart</p>
            <h2 class="mt-1 text-xl font-semibold text-slate-900">Review your order</h2>
            <p class="mt-1 text-sm text-slate-500">{{ cartSummaryText }}</p>
          </div>
          <button @click="toggleCart" class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <i class="ri-close-line text-2xl"></i>
        </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto bg-slate-50/80 px-4 py-4 sm:px-6 sm:py-5">
        <div v-if="items.length === 0"
          class="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <i class="ri-shopping-basket-line text-3xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-slate-900">Your cart is empty</h3>
          <p class="mt-2 max-w-xs text-sm leading-6 text-slate-500">
            Add products from this pharmacy and they will appear here for checkout or WhatsApp ordering.
          </p>
          <button @click="toggleCart"
            class="mt-5 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Continue shopping
          </button>
        </div>

        <div v-else class="space-y-4">
          <div v-if="pharmacyStore.pharmacyData" class="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ordering from</p>
            <p class="mt-2 text-sm font-semibold text-slate-900">
              {{ pharmacyStore.pharmacyData.name }}
            </p>
            <p class="mt-1 text-xs leading-5 text-slate-500">{{ pharmacyStore.pharmacyData.location }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {{ totalItemCount }} item{{ totalItemCount === 1 ? "" : "s" }}
              </span>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                GHS {{ formatPrice(cartTotal) }}
              </span>
            </div>
          </div>

          <div v-if="errorMessage" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {{ errorMessage }}
          </div>

          <div class="space-y-3">
            <div v-for="item in items" :key="item.id"
              class="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <img v-if="item.image" :src="item.image" :alt="item.name"
                  class="h-14 w-14 rounded-2xl border border-slate-100 object-cover" />
                <div v-else
                  class="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
                  <i class="ri-capsule-line text-2xl"></i>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-semibold text-slate-900">{{ item.name }}</h3>
                      <p class="mt-1 text-xs text-slate-500">
                        GHS {{ formatPrice(item.price) }} each
                      </p>
                    </div>

                    <button @click="removeFromCart(item.id)"
                      class="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                      <i class="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>

                  <div class="mt-4 flex items-center justify-between gap-3">
                    <div class="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button @click="updateQuantity(item.id, item.quantity - 1)" :disabled="item.quantity <= 1"
                        class="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                        -
                      </button>
                      <span class="min-w-[2.25rem] px-2 py-1 text-center text-sm font-semibold text-slate-700">{{ item.quantity }}</span>
                      <button @click="updateQuantity(item.id, item.quantity + 1)"
                        class="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-white">
                        +
                      </button>
                    </div>

                    <div class="text-right">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Line total</p>
                      <p class="mt-1 text-sm font-semibold text-slate-900">GHS {{ formatPrice(item.price * item.quantity) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="items.length > 0" class="border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.45)] sm:px-6 sm:py-5">
        <div class="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Order total</p>
              <p class="mt-1 text-xl font-bold text-slate-900">GHS{{ formatPrice(cartTotal) }}</p>
              <p class="text-xs text-slate-500">{{ totalItemCount }} item{{ totalItemCount === 1 ? "" : "s" }} in cart</p>
            </div>

            <button @click="toggleCart"
              class="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50">
              <i class="ri-arrow-left-line mr-1"></i>Continue shopping
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <button @click="sendWhatsAppMessage"
              class="flex w-full items-center justify-center rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isProcessingOrder">
              <i class="ri-whatsapp-line text-xl mr-2"></i>Send Order via WhatsApp
            </button>
            <button @click="handleDirectOrder"
              class="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isProcessingOrder">
              <span v-if="isProcessingOrder" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
              <span v-else class="flex items-center justify-center">
                <span>
                  <i class="ri-wallet-line text-xl mr-2"></i>Order Directly&nbsp;(Free Trial)
                </span>
              </span>
            </button>
          </div>

          <p class="mt-3 text-center text-xs leading-5 text-slate-500">
            Use WhatsApp to enquire first, or place the order directly from your customer account.
          </p>
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
const totalItemCount = computed(() =>
  items.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
);
const cartSummaryText = computed(() => {
  if (!items.value.length) {
    return "Add products and review them here before checkout.";
  }

  const label = totalItemCount.value === 1 ? "item" : "items";
  return `${totalItemCount.value} ${label} ready for checkout`;
});

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
  let phoneNumber =
    pharmacyStore.pharmacyData?.whatsapp_number ||
    pharmacyStore.pharmacyData?.phone ||
    '';

  if (!phoneNumber) {
    errorMessage.value = 'This pharmacy does not have a WhatsApp number available yet.';
    return;
  }

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
    
    // Calculate order summary from cart items before clearing
    const orderSummary = {
      totalItems: items.value.length,
      totalQuantity: items.value.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    // Process the order through the user store
    const orderResult = await userStore.processDirectOrder(
      items.value,
      pharmacyStore.currentPharmacy
    );
    
    // After successful order, clear cart and close sidebar
    cartStore.clearCart();
    toggleCart();
    
    // Emit order success event with order data and summary
    emit('order-success', {
      ...orderResult.orderData,
      orderId: orderResult.orderId,
      ...orderSummary
    });
  } catch (error) {
    console.error('Failed to process order:', error);
    if (error.errorCode === 'CUSTOMER_NOT_REGISTERED_WITH_COMPANY') {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = error.message || 'Failed to process your order. Please try again.';
    }
  } finally {
    isProcessingOrder.value = false;
  }
};

// Close login modal
const closeLoginModal = () => {
  showLoginModal.value = false;
};

// Handle successful login
const handleLoginSuccess = (payload = {}) => {
  console.log('User successfully logged in');
  if (payload.destination === 'new') {
    showLoginModal.value = false;
    navigateTo('/customer?tab=new');
    return;
  }
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
