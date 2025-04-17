<!-- pages/[pharmacy]/index.vue -->
<template>
  <div class="container mx-auto px-6 py-8 max-w-7xl">
    <!-- Loading Indicator -->
    <div v-if="pharmacyStore.isLoading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      <p class="mt-4 text-indigo-600 font-medium">Loading pharmacy data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="pharmacyStore.error"
      class="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-md mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium">{{ pharmacyStore.error }}</p>
      </div>
      <button @click="refreshData"
        class="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>

    <!-- Not Found State -->
    <div v-else-if="pharmacyStore.notFound"
      class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-5 rounded-lg shadow-md mb-6">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-medium">The pharmacy you requested was not found.</p>
      </div>
      <button @click="goToPharmacySelection"
        class="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Select a Different Pharmacy
      </button>
    </div>

    <div v-else class="space-y-2 md:space-y-6">
      <!-- Pharmacy Header -->
      <div class="sticky top-0 z-40">
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-500 to-indigo-700 h-16 md:h-24 flex items-end p-4 md:p-6">
            <div class="bg-white rounded-full p-2 md:p-3 shadow-lg -mb-8 md:-mb-12">
              <div v-if="pharmacyStore.pharmacyData?.logoUrl">
                <img :src="pharmacyStore.pharmacyData.logoUrl" :alt="pharmacyStore.pharmacyData?.name + ' logo'"
                  class="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover" />
              </div>
              <div v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 md:h-12 md:w-12 text-indigo-600" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="p-3 pt-4 md:p-6 md:pt-14">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 class="text-xl md:text-2xl font-bold text-gray-800">{{ pharmacyStore.pharmacyData?.name || 'Welcome'
                  }}</h1>
                <div class="flex items-center mt-1 md:mt-2 text-sm md:text-base text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 text-indigo-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p class="truncate">{{ pharmacyStore.pharmacyData?.location }}</p>
                </div>
                <p class="hidden md:block mt-3 text-gray-700">{{ pharmacyStore.pharmacyData?.description || 'Browse our available products' }}</p>
              </div>

              <div class="flex items-center justify-between md:space-x-3 space-x-0 w-full md:w-auto mt-4 md:mt-0">
                <button @click="toggleCart" class="flex relative">
                  <i class="ri-shopping-cart-line text-xl md:text-2xl text-green-800"></i>
                  <span v-if="cartStore.cartItemCount > 0"
                    class="absolute -top-2 -left-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {{ cartStore.cartItemCount }}
                  </span>
                  <span class="text-green-800 ml-1">GHS{{ formatCartTotal }}</span>
                </button>

                <!-- Contact buttons -->
                <div class="flex space-x-2 md:space-x-3">
                  <a v-if="pharmacyStore.pharmacyData?.tel" :href="`tel:${pharmacyStore.pharmacyData.tel}`"
                    class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg flex items-center transition-colors duration-200 text-sm md:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </a>
                  <a v-if="pharmacyStore.pharmacyData?.tel" :href="whatsappLink" target="_blank"
                    class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg flex items-center transition-colors duration-200 text-sm md:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Main Content Section -->
        <!-- Search Bar -->
        <div class="bg-opacity-80 backdrop-blur-md py-2.5 lg:py-2">
          <div class="bg-white rounded-xl shadow-md p-2 lg:p-4">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input v-model="searchQuery" ref="searchInput" type="text" placeholder="Search for products..."
                class="w-full pl-10 px-4 py-2 md:py-3 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 shadow-sm"
                autofocus />
              <span v-if="searchQuery" @click="searchQuery = ''"
                class="absolute right-3 top-2 md:top-3 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>

        <!-- View Toggle and Title -->
        <div class="mb-2 lg:mb-6 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-800">Products</h2>
          <div class="lg:flex bg-gray-100 p-1 rounded-lg hidden">
            <button @click="viewMode = 'grid'" :class="['p-2 rounded-md transition-colors duration-200',
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200']">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button @click="viewMode = 'table'" :class="['p-2 rounded-md transition-colors duration-200',
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-200']">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Products -->
        <div v-if="!pharmacyStore.hasProducts" class="bg-white rounded-xl shadow-md p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-gray-900">No products available</h3>
          <p class="mt-2 text-gray-500">
            This pharmacy has no products listed yet
          </p>
        </div>

        <template v-else>
          <ProductsTable v-if="viewMode === 'table'" :products="pharmacyStore.inStockProducts" :search-query="searchQuery" class="hidden lg:flex"
            @item-added-to-cart="clearSearchAfterAddToCart" />

          <ProductsGrid v-else :products="pharmacyStore.inStockProducts" :search-query="searchQuery" @item-added-to-cart="clearSearchAfterAddToCart" />
        </template>
      </div>
    </div>

    <!-- Cart Sidebar -->
    <CartSidebar ref="cartSidebar" />

    <!-- Cart Float Button -->
    <button v-if="showButton" @click="openCart"
      class="flex fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span
        class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {{ cartStore.cartItemCount }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';

const router = useRouter();
const route = useRoute();
const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();

definePageMeta({
  layout: 'pharm',
  title: 'Pharmacy Store',
  middleware: ['pharmacy']
});

// State
const searchQuery = ref('');
const viewMode = ref('table');
const cartSidebar = ref(null);
const searchInput = ref(null);

const showButton = computed(() => cartStore.hasItems && cartStore.cartItemCount > 0);

// Get pharmacy slug from route params
const pharmacySlug = computed(() => route.params.pharmacy);

const focusSearchInput = () => {
  if (searchInput.value) {
    searchInput.value.focus();
  }
};

// Format cart total with safety checks
const formatCartTotal = computed(() => {
  const total = cartStore.cartTotal || 0;
  return total.toFixed(2);
});

// Toggle cart
const toggleCart = () => {
  if (cartSidebar.value) {
    cartSidebar.value.toggleCart();
  } else {
    cartStore.toggleCart();
  }
};

// Refresh data
const refreshData = async () => {
  if (pharmacyStore.currentPharmacy) {
    await pharmacyStore.fetchPharmacyData();
  }
};

// Whatsapp MEssage
const whatsappLink = computed(() => {
  let formattedPhone = pharmacyStore.pharmacyData?.tel || '+233503793513';

  // Extract the first phone number if multiple are provided with a separator
  if (formattedPhone.includes('/')) {
    formattedPhone = formattedPhone.split('/')[0];
  }

  // Format the phone number properly for WhatsApp
  // Remove all non-digit characters
  formattedPhone = formattedPhone.replace(/\D/g, '');

  // Add the country code if not present (assuming Ghana +233)
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '233' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = '233' + formattedPhone;
  }

  // Remove any + sign that might be present
  formattedPhone = formattedPhone.replace('+', '');

  // Create predefined message (optional)
  const message = encodeURIComponent(`Hello, I'm contacting from your pharmacy website.`);

  return `https://wa.me/${formattedPhone}?text=${message}`;
});

// Go to pharmacy selection
const goToPharmacySelection = () => {
  router.push('/');
};

// Open the cart sidebar
const openCart = () => {
  if (cartSidebar.value) {
    cartSidebar.value.toggleCart();
  }
};

// Function to handle screen size
const updateViewMode = () => {
  viewMode.value = window.innerWidth < 768 ? 'grid' : 'table';
};

const clearSearchAfterAddToCart = (product) => {
  setTimeout(() => {
    searchQuery.value = '';
    console.log(`Search cleared after adding ${product.brandName} to cart`);
    focusSearchInput();
  }, 100);
};

const refocusAfterAction = () => {
  setTimeout(focusSearchInput, 100);
};

onMounted(async () => {
  // Just in case, check if pharmacy data needs to be loaded
  if (pharmacyStore.currentPharmacy && !pharmacyStore.pharmacyData) {
    await pharmacyStore.fetchPharmacyData();
  };

  updateViewMode();
  window.addEventListener('resize', updateViewMode);

  document.addEventListener('click', (event) => {
    // Don't refocus if clicking on the search input itself
    if (event.target !== searchInput.value) {
      // Small delay to ensure the click completes first
      setTimeout(focusSearchInput, 10);
    };

    focusSearchInput();
  });
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewMode);

  document.removeEventListener('click', focusSearchInput);
});

// Watch for route changes (in case pharmacy param changes)
watch(() => route.params.pharmacy, async (newPharmacy, oldPharmacy) => {
  if (newPharmacy !== oldPharmacy) {
    // Middleware should handle this, but just in case
    if (pharmacyStore.pharmacySlug !== newPharmacy) {
      const pharmacyId = await pharmacyStore.getPharmacyIdFromSlug(newPharmacy);

      if (pharmacyId) {
        await pharmacyStore.setCurrentPharmacy(pharmacyId);

        // Update cart pharmacy context as well
        cartStore.setActivePharmacy(pharmacyId, newPharmacy);
      }
    }
  }
});
</script>