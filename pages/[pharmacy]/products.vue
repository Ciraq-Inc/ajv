<template>
    <div class="bg-grey h-full">
      <Navbar />
      
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">Products - {{ pharmacyStore.pharmacyData?.name }}</h1>
        
        <!-- Products listing would go here -->
        <div v-if="pharmacyStore.hasProducts" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="product in pharmacyStore.products" :key="product.id" 
               class="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
            <h3 class="text-lg font-semibold">{{ product.brandName }}</h3>
            <p class="text-gray-600 mt-2">Price: GH₵{{ product.sellingPrice }}</p>
            <p class="text-sm text-gray-500 mt-1">In stock: {{ product.stockQty }}</p>
            <div class="mt-4">
              <button @click="addToCart(product)" 
                      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-12">
          <p class="text-xl text-gray-600">No products available for this pharmacy.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { usePharmacyStore } from '../../stores/pharmacy.js';
  import { useCartStore } from '../../stores/cart.js';
  
  const route = useRoute();
  const pharmacyStore = usePharmacyStore();
  const cartStore = useCartStore();
  
  const addToCart = (product) => {
    // Create a cart item from the product
    const cartItem = {
      id: product.id,
      brandName: product.brandName,
      price: product.sellingPrice,
      quantity: 1,
      stockQty: product.stockQty,
      pharmacyId: pharmacyStore.currentPharmacy
    };
    
    cartStore.addToCart(cartItem);
  };
  </script>