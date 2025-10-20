<template>
    <div class="bg-grey h-full min-h-screen">
      <Navbar />
      
      <div class="container mx-auto px-4 py-8">
        <!-- Header Section -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-2">Products</h1>
          <p v-if="pharmacyStore.pharmacyData" class="text-gray-600">
            {{ pharmacyStore.pharmacyData.name }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="pharmacyStore.isLoading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="pharmacyStore.error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p class="text-red-800">{{ pharmacyStore.error }}</p>
        </div>

        <!-- Products Grid -->
        <div v-else-if="pharmacyStore.hasProducts" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div 
            v-for="product in inStockProducts" 
            :key="product.id" 
            class="border rounded-lg p-4 shadow hover:shadow-md transition-shadow bg-white"
          >
            <!-- Product Image Placeholder -->
            <div class="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
              <span class="text-gray-400 text-4xl">💊</span>
            </div>

            <!-- Product Info -->
            <h3 class="text-lg font-semibold mb-2">{{ product.brandName }}</h3>
            <p v-if="product.dosage" class="text-sm text-gray-600 mb-1">{{ product.dosage }}</p>
            <p v-if="product.masterName && product.masterName !== product.brandName" 
               class="text-sm text-gray-500 mb-2">
              {{ product.masterName }}
            </p>

            <!-- Price -->
            <div class="mt-3 mb-3">
              <p class="text-2xl font-bold text-blue-600">
                GH₵{{ formatPrice(product.sellingPrice) }}
              </p>
              <p class="text-sm text-gray-500">per {{ product.sellUnit || product.unit || 'unit' }}</p>
            </div>

            <!-- Stock Info -->
            <div class="mb-4">
              <p class="text-sm" :class="stockClass(product.stockQty, product.reorder)">
                <span class="font-medium">In stock:</span> {{ product.stockQty }} {{ product.unit || 'units' }}
              </p>
            </div>

            <!-- Add to Cart Button -->
            <button 
              @click="addToCart(product)" 
              :disabled="product.stockQty <= 0"
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
            >
              <span v-if="product.stockQty > 0">Add to Cart</span>
              <span v-else>Out of Stock</span>
            </button>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">📦</div>
          <p class="text-xl text-gray-600 mb-2">No products available</p>
          <p class="text-gray-500">Check back later for new products.</p>
        </div>
      </div>

      <!-- Success Toast (optional) -->
      <div 
        v-if="showToast" 
        class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity"
      >
        ✓ Added to cart
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { usePharmacyStore } from '../../stores/pharmacy.js';
  import { useCartStore } from '../../stores/cart.js';
  
  const route = useRoute();
  const pharmacyStore = usePharmacyStore();
  const cartStore = useCartStore();
  const showToast = ref(false);

  // Computed property for in-stock products
  const inStockProducts = computed(() => {
    return pharmacyStore.products.filter(product => product.stockQty > 0 && product.isActive !== false);
  });

  // Format price to 2 decimal places
  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  // Get stock status class
  const stockClass = (stockQty, reorder) => {
    if (stockQty <= 0) return 'text-red-600';
    if (reorder && stockQty <= reorder) return 'text-orange-600';
    return 'text-green-600';
  };
  
  const addToCart = (product) => {
    // Create a cart item from the product
    const cartItem = {
      id: product.id,
      brandName: product.brandName,
      masterName: product.masterName,
      dosage: product.dosage,
      price: product.sellingPrice,
      quantity: 1,
      stockQty: product.stockQty,
      unit: product.sellUnit || product.unit,
      pharmacyId: pharmacyStore.currentPharmacy
    };
    
    cartStore.addToCart(cartItem);

    // Show success toast
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 2000);
  };

  onMounted(async () => {
    console.log('Mounted products page');
    
    // Ensure pharmacy data is loaded
    if (!pharmacyStore.pharmacyData && pharmacyStore.currentPharmacy) {
      await pharmacyStore.fetchPharmacyData();
    }

    console.log('Products loaded:', pharmacyStore.products.length);
  });
  </script>

  <style scoped>
  .bg-grey {
    background-color: #f5f5f5;
  }
  </style>