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

          <!-- Not-registered error: empathetic, action-oriented -->
          <div
            v-if="cartError?.type === 'not_registered'"
            class="rounded-2xl bg-purple-50 border border-purple-100 p-4"
            role="alert"
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-[#520094]" aria-hidden="true">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold text-[#520094] leading-snug">
                  You're not registered at {{ cartError.pharmacyName }} yet
                </p>
                <p class="mt-1 text-sm text-[#4c4453] leading-relaxed">
                  Direct ordering is only available to customers already in {{ cartError.pharmacyName }}'s records. Send your order via WhatsApp for now — the pharmacy can add you using your phone number.
                </p>
              </div>
            </div>
          </div>

          <!-- Generic order error -->
          <div
            v-else-if="cartError?.type === 'generic'"
            class="rounded-2xl bg-red-50 border border-red-100 p-4"
            role="alert"
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-red-500" aria-hidden="true">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <p class="text-sm text-red-700 leading-relaxed">{{ cartError.message }}</p>
            </div>
          </div>

          <!-- Cart items -->
          <div v-for="item in items" :key="item.id"
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3">
            <div class="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
              <img v-if="item.image" :src="String(item.image)" :alt="String(item.name ?? '')" class="w-12 h-12 mr-3 object-cover rounded" />
              <div>
                <h3 class="font-semibold text-sm">{{ item.name }}</h3>
                <p v-if="!pharmacyStore.pharmacyData?.hide_prices" class="text-sm text-gray-500">GHS {{
                  formatPrice(item.price) }}</p>
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
          <button
            @click="toggleCart"
            class="text-[#520094] hover:text-[#3d006e] transition-colors flex items-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40 rounded"
          >
            <i class="ri-arrow-left-line mr-1"></i>Continue Shopping
          </button>
          <div v-if="!pharmacyStore.pharmacyData?.hide_prices" class="flex items-center">
            <span class="text-sm font-semibold text-gray-500 mr-1.5">Total:</span>
            <span class="text-base font-bold text-gray-900">GHS {{ formatPrice(cartTotal) }}</span>
          </div>
        </div>

        <div class="space-y-3">
          <!-- WhatsApp — always available, always first -->
          <button
            @click="sendWhatsAppMessage"
            class="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/50"
            :disabled="isProcessingOrder"
          >
            <i class="ri-whatsapp-line text-lg" aria-hidden="true"></i>
            Send Order via WhatsApp
          </button>

          <!-- Order Directly — three context-aware states -->

          <!-- State 1: Not logged in — sign-in nudge -->
          <template v-if="!userStore.isLoggedIn">
            <div class="rounded-xl border border-[#e8def8] bg-[#faf6ff] p-4">
              <p class="text-sm font-semibold text-[#1e1a22] mb-0.5">Want faster checkout?</p>
              <p class="text-sm text-[#4c4453] leading-relaxed mb-3">
                Sign in to place your order directly — no need to wait for a WhatsApp reply.
              </p>
              <button
                @click="handleDirectOrder"
                class="w-full border border-[#520094] text-[#520094] bg-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#f2eaf9] active:bg-[#e8d8f7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
              >
                Sign in to Order Directly
              </button>
            </div>
          </template>

          <!-- State 2: Logged in but not registered at this pharmacy -->
          <template v-else-if="cartError?.type === 'not_registered'">
            <div class="rounded-xl border border-[#e8def8] bg-[#faf6ff] p-4">
              <p class="text-sm font-semibold text-[#1e1a22] mb-0.5">Your WhatsApp order works fine</p>
              <p class="text-sm text-[#4c4453] leading-relaxed">
                To unlock direct ordering, ask {{ cartError.pharmacyName }} to add your phone number to their records — it links automatically.
              </p>
            </div>
          </template>

          <!-- State 3: Logged in and eligible — standard button -->
          <template v-else>
            <button
              @click="handleDirectOrder"
              class="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50"
              :disabled="isProcessingOrder"
            >
              <span v-if="isProcessingOrder" class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Placing your order...
              </span>
              <span v-else class="flex items-center gap-2">
                <i class="ri-wallet-line text-lg" aria-hidden="true"></i>
                Order Directly (Free Trial)
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- Login Modal -->
  <ClientOnly>
    <Login v-if="showLoginModal" :is-open="showLoginModal" @close="closeLoginModal"
      @login-success="handleLoginSuccess" />
  </ClientOnly>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from "~/stores/cart";
import { usePharmacyStore } from "~/stores/pharmacy";
import { useUserStore } from "~/stores/user";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  [key: string]: unknown;
}

interface PharmacyData {
  name?: string;
  location?: string;
  whatsapp_number?: string;
  hide_prices?: boolean;
  [key: string]: unknown;
}

interface OrderResult {
  orderId?: string;
  orderData?: Record<string, unknown>;
}

// TODO: remove once stores/ are .ts
interface CartStoreShape {
  items: CartItem[];
  cartTotal: number;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, qty: number) => void;
  clearCart: () => void;
}

// TODO: remove once stores/ are .ts
interface PharmacyStoreShape {
  pharmacyData: PharmacyData | null;
  currentPharmacy: unknown;
}

// TODO: remove once stores/ are .ts
interface UserStoreShape {
  isLoggedIn: boolean;
  processDirectOrder: (items: CartItem[], pharmacy: unknown) => Promise<OrderResult>;
}

// Custom error type — useApi throws ApiError with body on HTTP errors (e.g. 403),
// while the store's !data.success path sets errorCode on a plain Error.
// Check both paths.
interface OrderError extends Error {
  errorCode?: string;
  status?: number;
  body?: { error_code?: string; [key: string]: unknown };
}

type CartError =
  | { type: 'not_registered'; pharmacyName: string }
  | { type: 'generic'; message: string }
  | null;

// Local state for the cart sidebar
const isOpenSidebar = ref<boolean>(false);
const showLoginModal = ref<boolean>(false);
const isProcessingOrder = ref<boolean>(false);
const cartError = ref<CartError>(null);

// Store references
const cartStore = useCartStore() as unknown as CartStoreShape;
const pharmacyStore = usePharmacyStore() as unknown as PharmacyStoreShape;
const userStore = useUserStore() as unknown as UserStoreShape;

// Get reactive store state
const items = computed<CartItem[]>(() => cartStore.items)
const cartTotal = computed<number>(() => cartStore.cartTotal)
const { removeFromCart, updateQuantity } = cartStore;

// Emits
const emit = defineEmits<{
  close: [];
  'order-success': [payload: Record<string, unknown>];
}>();

// Methods
const toggleCart = (): void => {
  isOpenSidebar.value = !isOpenSidebar.value;
  if (!isOpenSidebar.value) {
    cartError.value = null;
    emit('close');
  }
};

const sendWhatsAppMessage = (): void => {
  let phoneNumber: string = pharmacyStore.pharmacyData?.whatsapp_number ?? '';

  console.log("phoneNumber", phoneNumber);
  // Extract the first phone number if multiple are provided with a separator
  if (phoneNumber.includes('/')) {
    phoneNumber = phoneNumber.split('/')[0] ?? '';
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

const generateWhatsAppMessage = (): string => {
  const hidePrices = pharmacyStore.pharmacyData?.hide_prices;

  // Format each item with proper spacing and alignment
  const itemDetails = (items.value as CartItem[]).map((item, index) =>
    hidePrices
      ? `${index + 1}. ${item.name} - *${item.quantity}*`
      : `${index + 1}. ${item.name} - *${item.quantity}* (GHS ${formatPrice(item.price * item.quantity)})`
  ).join('\n');

  // Get pharmacy name and location
  const pharmacyName = pharmacyStore.pharmacyData?.name ?? 'your pharmacy';
  const pharmacyLocation = pharmacyStore.pharmacyData?.location
    ? ` (${pharmacyStore.pharmacyData.location})`
    : '';

  // Current date and time
  const now = new Date();
  const dateString = now.toLocaleDateString('en-GB');
  const timeString = now.toLocaleTimeString('en-GB');

  const totalLine = hidePrices
    ? ''
    : `\n*Total Amount: GHS${formatPrice(cartTotal.value as number)}*`;

  // Generate a more structured message
  return `*ORDER REQUEST*
Date: ${dateString} | Time: ${timeString}

Hello, I would like to order the following items from *${pharmacyName}*${pharmacyLocation}:

${itemDetails}${totalLine}

Please confirm if these items are available for delivery or pickup.
Thank you!`;
};

// Handle direct order
const handleDirectOrder = (): void => {
  cartError.value = null;

  if (!userStore.isLoggedIn) {
    showLoginModal.value = true;
  } else {
    void processDirectOrder();
  }
};

// Process the direct order after successful login
const processDirectOrder = async (): Promise<void> => {
  if (!pharmacyStore.currentPharmacy) {
    cartError.value = { type: 'generic', message: 'Pharmacy information is missing. Please try again.' };
    return;
  }

  try {
    isProcessingOrder.value = true;
    cartError.value = null;

    // Calculate order summary from cart items before clearing
    const cartItems = items.value as CartItem[];
    const orderSummary = {
      totalItems: cartItems.length,
      totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    };

    // Process the order through the user store
    const orderResult = await userStore.processDirectOrder(
      cartItems,
      pharmacyStore.currentPharmacy,
    );

    // After successful order, clear cart and close sidebar
    cartStore.clearCart();
    toggleCart();

    // Emit order success event with order data and summary
    emit('order-success', {
      ...(orderResult.orderData ?? {}),
      orderId: orderResult.orderId,
      ...orderSummary,
    });
  } catch (err) {
    console.error('Failed to process order:', err);
    const orderErr = err as OrderError;
    const errCode = orderErr.body?.error_code ?? orderErr.errorCode;
    if (errCode === 'CUSTOMER_NOT_REGISTERED_WITH_COMPANY') {
      cartError.value = {
        type: 'not_registered',
        pharmacyName: pharmacyStore.pharmacyData?.name ?? 'this pharmacy',
      };
    } else {
      cartError.value = {
        type: 'generic',
        message: orderErr.message ?? 'We couldn\'t place your order. Please try again.',
      };
    }
  } finally {
    isProcessingOrder.value = false;
  }
};

const closeLoginModal = (): void => {
  showLoginModal.value = false;
};

const handleLoginSuccess = (): void => {
  void processDirectOrder();
};

const formatPrice = (price: number | null | undefined): string => {
  return Number(price ?? 0).toFixed(2);
};

// Expose methods for parent components
defineExpose({
  toggleCart: (): void => {
    isOpenSidebar.value = !isOpenSidebar.value;
  },
  isOpen: computed<boolean>(() => isOpenSidebar.value),
});

onMounted(() => {
  // Initialize cart with safer server-client hydration
  // cartStore.init();
});
</script>
