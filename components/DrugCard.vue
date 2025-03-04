<template>
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
    <div v-for="product in filteredProducts" :key="product.id"
      class="bg-white rounded-lg shadow-md hover:shadow-lg p-4 transition-shadow duration-300 overflow-hidden">
      <div class="flex space-x-3">
        <!-- Image Section -->
        <div class="flex flex-col">
          <!-- Use product image or a placeholder -->
          <img :src="product.imageUrl || '/images/placeholder-med.jpg'" :alt="product.brandName"
            class="w-[90px] h-[80px] rounded object-cover cursor-pointer" />
          <div class="text-xs text-gray-600 mt-1 flex items-center whitespace-nowrap">
            <Icon name="ph:clock" class="w-3 h-3 mr-1" />
            {{ product.lastUpdated ? formatDate(product.lastUpdated) : 'N/A' }}
          </div>
          <div class="flex items-center whitespace-nowrap mt-1">
            <span :class="[
              'px-2 py-1 text-xs rounded-full',
              product.stockQty <= 0
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            ]">
              {{ product.stockQty <= 0 ? 'Out of Stock' : `${product.stockQty} In Stock` }} </span>
          </div>
        </div>

        <!-- Content Section -->
        <div class="space-y-2 flex-grow">
          <h3 class="text-base font-semibold text-gray-800 truncate">
            {{ product.brandName.length > 25 ? product.brandName.slice(0, 20) + '...' : product.brandName }}
          </h3>

          <div class="text-xs text-gray-800 font-semibold flex justify-between">
            <div>
              GHS {{ product.sellingPrice }}
              <span class="text-gray-500 text-xs ml-1">/ {{ product.unit || 'unit' }}</span>
            </div>
            <div class="flex items-center">
              <button @click="decreaseQuantity(product)" :disabled="product.quantity <= 1"
                class="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-l disabled:opacity-50">
                -
              </button>
              <span class="bg-gray-100 px-2 py-1 text-xs">
                {{ product.quantity || 1 }}
              </span>
              <button @click="increaseQuantity(product)"
                class="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-r disabled:opacity-50">
                +
              </button>
            </div>
          </div>

          <!-- Add to Cart Section -->
          <div class="flex justify-end">
            <button @click="handleAddToCart(product)" :disabled="product.stockQty <= 0" :class="[
              'px-4 py-2 text-sm rounded transition-all duration-300 ease-in-out',
              product.stockQty <= 0 ? 'bg-gray-400 text-white cursor-not-allowed' :
                product.justAdded ? 'bg-green-700 text-white transform scale-95 cursor-default' :
                  'bg-green-500 text-white hover:bg-blue-600'
            ]">
              <i class="ri-shopping-cart-line text-xs mr-1"></i>
              {{ product.justAdded ? 'Added!' : 'Add to cart' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { usePharmacyStore } from '../stores/pharmacy.js';
import { useCartStore } from '../stores/cart.js';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();

// Use products from pharmacy store
const filteredProducts = computed(() => {
  const query = props.searchQuery || '';

  // Map products to add quantity property for cart functionality
  return pharmacyStore.products
    .filter(product =>
      product.brandName.toLowerCase().includes(query.toLowerCase())
    )
    .map(product => ({
      ...product,
      quantity: 1,
      justAdded: false
    }));
});

const increaseQuantity = (product) => {
  product.quantity = (product.quantity || 1) + 1;
};

const decreaseQuantity = (product) => {
  if (product.quantity > 1) {
    product.quantity -= 1;
  }
};

const handleAddToCart = (product) => {
  if (product.stockQty <= 0) return;

  // Format the product data to match cart store expectations
  cartStore.addToCart({
    id: product.id,
    name: product.brandName,
    price: product.sellingPrice,
    quantity: product.quantity || 1,
    image: product.imageUrl,
    pharmacyId: pharmacyStore.currentPharmacy,
    unit: product.unit || 'unit'
  });

  // Set justAdded to true
  product.justAdded = true;

  // Reset justAdded after 2 seconds
  setTimeout(() => {
    product.justAdded = false;
  }, 2000);
};

// Helper function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
</script>