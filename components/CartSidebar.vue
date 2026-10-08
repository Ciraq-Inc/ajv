<template>
  <div v-if="isOpenSidebar" class="fixed inset-0 z-50 flex justify-end">
    <!-- Dimmed backdrop: clicking it closes the cart -->
    <div
      data-testid="cart-backdrop"
      class="absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]"
      aria-hidden="true"
      @click="toggleCart"
    ></div>

    <!-- Cart container - full width on mobile, fixed width on desktop -->
    <div
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-dialog-title"
      tabindex="-1"
      class="relative flex h-full w-full flex-col bg-white font-body shadow-lift focus:outline-none sm:w-[26rem]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-6">
        <div>
          <h2 id="cart-dialog-title" class="font-display text-xl font-bold tracking-tight text-ink-900">Your Cart</h2>
          <p v-if="items.length > 0" class="text-xs text-ink-500">
            {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close cart"
          class="flex h-11 w-11 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
          @click="toggleCart"
        >
          <i class="ri-close-line text-2xl" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <!-- Empty: say what happened and what to do next -->
        <div v-if="items.length === 0" class="flex flex-col items-center px-4 py-12 text-center">
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700" aria-hidden="true">
            <i class="ri-shopping-basket-2-line text-3xl"></i>
          </span>
          <p class="mt-4 font-display text-lg font-bold text-ink-900">Your cart is empty</p>
          <p class="mt-1 text-sm leading-relaxed text-ink-500">
            Add a medicine or product and it will show up here, ready to send to your pharmacy.
          </p>
          <button
            type="button"
            class="mt-6 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/60 focus-visible:ring-offset-2"
            @click="toggleCart"
          >
            Browse products
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- Pharmacy Name -->
          <div v-if="pharmacyStore.pharmacyData" class="rounded-xl border border-brand-100 bg-brand-50 p-3">
            <p class="text-sm text-ink-600">
              Order from: <span class="font-semibold text-ink-900">{{ pharmacyStore.pharmacyData.name }}</span>
            </p>
            <p class="text-xs text-ink-500">{{ pharmacyStore.pharmacyData.location }}</p>
          </div>

          <!-- Not-registered error: empathetic, action-oriented -->
          <div
            v-if="cartError?.type === 'not_registered'"
            class="rounded-2xl border border-brand-100 bg-brand-50 p-4"
            role="alert"
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-brand-700" aria-hidden="true">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold leading-snug text-brand-700">
                  You're not registered at {{ cartError.pharmacyName }} yet
                </p>
                <p class="mt-1 text-sm leading-relaxed text-ink-500">
                  Direct ordering is only available to customers already in {{ cartError.pharmacyName }}'s records. Send your order via WhatsApp for now — the pharmacy can add you using your phone number.
                </p>
              </div>
            </div>
          </div>

          <!-- Generic order error -->
          <div
            v-else-if="cartError?.type === 'generic'"
            class="rounded-2xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-red-600" aria-hidden="true">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <p class="text-sm leading-relaxed text-red-800">{{ cartError.message }}</p>
            </div>
          </div>

          <!-- Cart items -->
          <ul class="space-y-3">
            <li v-for="item in items" :key="item.id"
              class="flex flex-col items-start justify-between gap-3 border-b border-ink-100 pb-3 sm:flex-row sm:items-center">
              <div class="flex w-full items-center sm:w-auto">
                <img v-if="item.image" :src="String(item.image)" :alt="String(item.name ?? '')" class="mr-3 h-12 w-12 rounded-lg object-cover" />
                <div>
                  <h3 class="text-sm font-semibold text-ink-900">{{ item.name }}</h3>
                  <p v-if="!pharmacyStore.pharmacyData?.hide_prices" class="text-sm text-ink-500">GHS {{
                    formatPrice(item.price) }}</p>
                </div>
              </div>

              <div class="flex w-full items-center justify-between sm:w-auto">
                <div class="flex items-center overflow-hidden rounded-xl border border-ink-200">
                  <button
                    type="button"
                    :aria-label="`Decrease quantity of ${item.name}`"
                    :title="item.quantity <= 1 ? 'Minimum is 1 — use Remove to take it out of your cart' : undefined"
                    :disabled="item.quantity <= 1"
                    class="flex h-11 w-11 items-center justify-center bg-brand-50 text-lg text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700/50 disabled:cursor-not-allowed disabled:text-ink-400 disabled:hover:bg-brand-50"
                    @click="updateQuantity(item.id, item.quantity - 1)"
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <span class="min-w-[2.5rem] border-x border-ink-200 px-3 py-2 text-center text-sm font-semibold text-ink-900" aria-live="polite">{{ item.quantity }}</span>
                  <button
                    type="button"
                    :aria-label="`Increase quantity of ${item.name}`"
                    class="flex h-11 w-11 items-center justify-center bg-brand-50 text-lg text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700/50"
                    @click="updateQuantity(item.id, item.quantity + 1)"
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
                <button
                  type="button"
                  :aria-label="`Remove ${item.name} from cart`"
                  class="ml-3 flex h-11 w-11 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50"
                  @click="removeFromCart(item.id)"
                >
                  <i class="ri-delete-bin-line text-lg" aria-hidden="true"></i>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Sticky footer with total and checkout -->
      <div v-if="items.length > 0" class="border-t border-ink-100 bg-white p-4 sm:p-5">
        <div class="mb-4 flex items-center justify-between">
          <button
            type="button"
            class="flex min-h-[44px] items-center rounded text-sm font-medium text-brand-700 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40"
            @click="toggleCart"
          >
            <i class="ri-arrow-left-line mr-1" aria-hidden="true"></i>Continue Shopping
          </button>
          <div v-if="!pharmacyStore.pharmacyData?.hide_prices" class="flex items-center">
            <span class="mr-1.5 text-sm font-semibold text-ink-500">Total:</span>
            <span class="font-display text-lg font-bold text-ink-900">GHS {{ formatPrice(cartTotal) }}</span>
          </div>
        </div>

        <div class="space-y-3">
          <!-- WhatsApp — always available, always first -->
          <button
            type="button"
            class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 active:bg-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isProcessingOrder"
            @click="sendWhatsAppMessage"
          >
            <i class="ri-whatsapp-line text-lg" aria-hidden="true"></i>
            Send Order via WhatsApp
          </button>

          <!-- Order Directly — three context-aware states -->

          <!-- State 1: Not logged in — sign-in nudge -->
          <template v-if="!userStore.isLoggedIn">
            <div class="rounded-xl border border-brand-100 bg-brand-50 p-4">
              <p class="mb-0.5 text-sm font-semibold text-ink-900">Want faster checkout?</p>
              <p class="mb-3 text-sm leading-relaxed text-ink-500">
                Sign in to place your order directly — no need to wait for a WhatsApp reply.
              </p>
              <button
                type="button"
                class="min-h-[44px] w-full rounded-lg border border-brand-700 bg-white py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40"
                @click="handleDirectOrder"
              >
                Sign in to Order Directly
              </button>
            </div>
          </template>

          <!-- State 2: Logged in but not registered at this pharmacy -->
          <template v-else-if="cartError?.type === 'not_registered'">
            <div class="rounded-xl border border-brand-100 bg-brand-50 p-4">
              <p class="mb-0.5 text-sm font-semibold text-ink-900">Your WhatsApp order works fine</p>
              <p class="text-sm leading-relaxed text-ink-500">
                To unlock direct ordering, ask {{ cartError.pharmacyName }} to add your phone number to their records — it links automatically.
              </p>
            </div>
          </template>

          <!-- State 3: Logged in and eligible — standard button -->
          <template v-else>
            <button
              type="button"
              class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-coral-600 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-coral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-600/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isProcessingOrder"
              @click="handleDirectOrder"
            >
              <span v-if="isProcessingOrder" class="flex items-center gap-2">
                <svg class="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
import { useModalA11y } from '~/composables/useModalA11y';

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
const dialogRef = ref<HTMLElement | null>(null);

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

// Escape closes the cart, but not while the sign-in dialog on top of it is open.
useModalA11y(dialogRef, () => isOpenSidebar.value, () => {
  if (!showLoginModal.value) toggleCart();
});

const sendWhatsAppMessage = (): void => {
  let phoneNumber: string = pharmacyStore.pharmacyData?.whatsapp_number ?? '';

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
        message: orderErr.message || 'We couldn\'t place your order. Please try again.',
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
