<template>
  <div
    v-if="isOpen"
    class="fixed top-0 right-0 w-96 h-96 bg-white shadow-lg z-50 transform transition-transform duration-300 overflow-y-auto"
  >
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font semibold">Your Cart</h2>
        <button @click="toggleCart" class="text-gray-600 hover:text-gray-900">
          <i class="ri-close-line text-2xl"></i>
        </button>
      </div>

      <div v-if="items.length === 0" class="text-center text-gray-500">
        Your cart is empty
      </div>

      <div v-else class="space-y-4 max-h[70vh] overflow-y-auto">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between border-b pb-2"
        >
          <div class="flex items-center">
            <img :src="item.image" :alt="item.name" class="w-12 h-12 mr-4" />
            <div>
              <h3 class="font-semibold">{{ item.name }}</h3>
              <p class="text-sm text-gray-500">GHS {{ item.price }}</p>
            </div>
          </div>
          <div class="flex items-center">
            <button
              @click="updateQuantity(item.id, item.quantity - 1)"
              :disabled="item.quantity <= 1"
              class="bg-gray-200 px-2 rounded disabled:opacity-50"
            >
              -
            </button>
            <span class="mx-2">{{ item.quantity }}</span>
            <button
              @click="updateQuantity(item.id, item.quantity + 1)"
              class="bg-gray-200 px-2 rounded"
            >
              +
            </button>
            <button
              @click="removeFromCart(item.id)"
              class="ml-4 text-red-500 hover:text-red-700"
            >
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="items.length > 0" class="mt-6">
        <div class="flex justify-between mb-4">
          <span class="font-semibold">Total</span>
          <span>GHS{{ cartTotal.toFixed(2) }}</span>
        </div>
        <button
				@click="sendWhatsAppMessage"
          class="w-full bg-green-600 text-white py-2 rounded hover:bg-blue-500"
        >
        <i class="ri-shopping-cart-line text-2xl mr-1"></i>Send Order
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useCartStore } from "/stores/cart.js";

const cartStore = useCartStore();
const { items, isOpen, cartTotal } = storeToRefs(cartStore);
const { toggleCart, removeFromCart, updateQuantity } = cartStore;

const sendWhatsAppMessage = () => {
  const phoneNumber = '+233257173767';
  const messageText = generateWhatsAppMessage();
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`;
  window.open(whatsappUrl, '_blank');

  clearCart();
};

const generateWhatsAppMessage = () => {
  const itemDetails = items.value.map(item => 
    `${item.name} (${item.quantity} x GHS${item.price.toFixed(2)})`
  ).join('\n');

  return `Hello, I saw these drugs and would like to make an order:

${itemDetails}

Total Price: GHS${cartTotal.value.toFixed(2)}`;
};

const clearCart = () => {
  // Reset the cart to an empty state
  cartStore.$patch({
    items: [],
    cartTotal: 0
  });
};

defineExpose({
  toggleCart,
});
</script>
