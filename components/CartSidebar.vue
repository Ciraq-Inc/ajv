<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/30 z-50 flex justify-end sm:justify-end">
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
            class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
            <i class="ri-whatsapp-line text-xl mr-2"></i>Send Order via WhatsApp
          </button>
          <!-- <button
            class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
            <i class="ri-wallet-line text-xl mr-2"></i>Order Directly
          </button> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useCartStore } from "/stores/cart.js";
import { usePharmacyStore } from "/stores/pharmacy.js";

const cartStore = useCartStore();
const pharmacyStore = usePharmacyStore();
const { items, isOpen, cartTotal } = storeToRefs(cartStore);
const { toggleCart, removeFromCart, updateQuantity } = cartStore;

const sendWhatsAppMessage = () => {
  let phoneNumber = pharmacyStore.pharmacyData?.tel || '+233503793513';

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

const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

defineExpose({
  toggleCart,
});
</script>