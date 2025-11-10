<!-- pages/[pharmacy]/index.vue -->
<template>
  <div class="container mx-auto w-full px-4 py-6 max-w-7xl">
    <!-- Loading Indicator with improved animation -->
    <div v-if="pharmacyStore.isLoading" class="flex flex-col items-center justify-center py-24">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
      <div class="animate-pulse">
        <p class="text-indigo-600 font-medium text-lg">
          Loading pharmacy data...
        </p>
      </div>
    </div>

    <!-- Error State with improved styling -->
    <div v-else-if="pharmacyStore.error"
      class="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-xl shadow-lg mb-8 animate-fadeIn">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-4 text-red-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium text-lg">{{ pharmacyStore.error }}</p>
      </div>
      <button @click="refreshData"
        class="mt-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 py-2 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>

    <!-- Not Found State with improved styling -->
    <div v-else-if="pharmacyStore.notFound"
      class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-xl shadow-lg mb-8 animate-fadeIn">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-4 text-yellow-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="font-medium text-lg">
          The pharmacy you requested was not found.
        </p>
      </div>
      <button @click="goToPharmacySelection"
        class="mt-4 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white px-5 py-2 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Select a Different Pharmacy
      </button>
    </div>

    <div v-else class="space-y-6">
      <!-- Pharmacy Header with enhanced design -->
      <div class="">
        <div
          class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <!-- Gradient header banner with improved color -->
          <div
            class="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-700 h-20 md:h-28 flex items-end p-4 md:p-6 relative">
            <!-- Pharmacy logo with enhanced styling -->
            <div class="bg-white rounded-full p-2 md:p-3 shadow-lg -mb-8 md:-mb-12 border-4 border-white">
              <div v-if="pharmacyStore.pharmacyData?.logoUrl">
                <img :src="pharmacyStore.pharmacyData.logoUrl" :alt="pharmacyStore.pharmacyData?.name + ' logo'"
                  class="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover" />
              </div>
              <div v-else class="bg-indigo-50 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 md:h-12 md:w-12 text-indigo-600" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            <!-- Decorative shape -->
            <div class="absolute right-0 bottom-0">
              <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg"
                class="opacity-20">
                <path d="M120 0v60H0C0 26.9 26.9 0 60 0s60 0 60 0z" fill="white" />
              </svg>
            </div>
          </div>

          <!-- Pharmacy info section with improved spacing and layout -->
          <div class="p-4 pt-10 md:p-6 md:pt-16">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                  {{ pharmacyStore.pharmacyData?.name || "Welcome" }}
                  <span class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Open</span>
                </h1>

                <div class="flex items-center mt-2 text-sm md:text-base text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-2 text-indigo-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p class="truncate">
                    {{ pharmacyStore.pharmacyData?.location }}
                  </p>
                </div>

                <p class="hidden md:block mt-3 text-gray-700 max-w-2xl">
                  {{
                    pharmacyStore.pharmacyData?.description ||
                    "Browse our available products and place your order online. Fast delivery within the area."
                  }}
                </p>
              </div>

              <!-- Cart and contact buttons with improved styling -->
              <div
                class="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-4 md:mt-0">
                <!-- Cart button with animation -->
                <button @click="toggleCart" class="flex items-center relative group">
                  <div
                    class="bg-green-50 text-green-800 p-2 rounded-lg flex items-center transition-all duration-200 group-hover:bg-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span class="font-medium">GHS{{ formatCartTotal }}</span>

                    <span v-if="cartStore.cartItemCount > 0"
                      class="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {{ cartStore.cartItemCount }}
                    </span>
                  </div>
                </button>

                <!-- Contact buttons with improved styling -->
                <div class="flex gap-3">
                  <a v-if="pharmacyStore.pharmacyData?.phone" :href="`tel:${pharmacyStore.pharmacyData.phone}`"
                    class="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm md:text-base shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </a>
                  <a v-if="pharmacyStore.pharmacyData?.phone" :href="whatsappLink" target="_blank"
                    class="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm md:text-base shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    WhatsApp
                  </a>
                  <a @click="openLoginModal" v-if="!userStore.isLoggedIn"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-3 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Bar with improved styling -->
      <div class="bg-opacity-80 backdrop-blur-md py-3 mt-3 sticky top-0 z-40">
        <div
          class="bg-white rounded-xl shadow-lg p-3 border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <!-- Show spinner when searching -->
              <svg v-if="isSearching" class="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <!-- Show search icon when not searching -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input v-model="searchQuery" ref="searchInput" type="text"
              placeholder="Search for medications, health products..."
              class="w-full pl-12 px-4 py-3 md:py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 shadow-sm transition-all duration-200 text-lg" />
            <span v-if="searchQuery" @click="clearSearch"
              class="absolute right-4 top-3 md:top-4 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- User Info Section with improved styling -->
      <div v-if="userStore.isLoggedIn && userStore.currentUser"
        class="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100 transition-all duration-300 hover:shadow-xl animate-fadeIn">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center">
            <div class="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-indigo-600 font-medium">Welcome back</p>
              <h3 class="text-xl font-semibold text-gray-900">
                {{ userStore.currentUser.lname || "Customer" }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                <span class="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{
                    userStore.currentUser.phone || "Phone number not available"
                  }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex gap-3 sm:flex-shrink-0">
            <!-- Order History Nav -->
            <button @click="navigateToCustomerAccount"
              class="flex-1 sm:flex-none px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 active:bg-indigo-300 transition-colors duration-200 font-medium shadow-sm">
              <span class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                My Account
              </span>
            </button>

            <!-- Logout Button -->
            <button @click="handleLogout"
              class="flex-1 sm:flex-none px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 active:bg-red-300 transition-colors duration-200 font-medium shadow-sm">
              <span class="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>


      <!-- Products Section -->
      <div class="animate-fadeIn">
        <!-- View Toggle and Title with improved styling -->
        <div class="mb-4 lg:mb-6 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Products
          </h2>
          <div class="lg:flex bg-gray-100 p-1 rounded-lg hidden shadow-inner">
            <button @click="viewMode = 'grid'" :class="[
              'p-2 rounded-md transition-colors duration-200',
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200',
            ]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button @click="viewMode = 'table'" :class="[
              'p-2 rounded-md transition-colors duration-200',
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200',
            ]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- No products state with improved styling -->
        <div v-if="!pharmacyStore.hasProducts && !searchQuery"
          class="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 class="text-2xl font-medium text-gray-900 mb-3">
            No products available
          </h3>
          <p class="mt-2 text-gray-600 max-w-md mx-auto">
            This pharmacy has no products listed yet. Please check back later or
            contact the pharmacy directly.
          </p>
        </div>

        <!-- No search results state -->
        <div v-else-if="
          searchQuery && displayProducts.length === 0 && !isSearching
        "
          class="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 text-yellow-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-medium text-gray-900 mb-3">
            No products found
          </h3>
          <p class="mt-2 text-gray-600 max-w-md mx-auto">
            We couldn't find any products matching "{{ searchQuery }}". Try
            searching with different keywords.
          </p>
          <button @click="searchQuery = ''"
            class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Search
          </button>
        </div>

        <!-- Products display -->
        <template v-else>
          <ProductsTable v-if="viewMode === 'table'" :products="displayProducts" :search-query="''"
            class="hidden lg:flex" @item-added-to-cart="clearSearchAfterAddToCart" />

          <ProductsGrid v-else :products="displayProducts" :search-query="''"
            @item-added-to-cart="clearSearchAfterAddToCart" />
        </template>
      </div>
    </div>

    <!-- Cart Sidebar -->
    <CartSidebar ref="cartSidebar" @order-success="handleOrderSuccess" />

    <!-- Order Success Modal with improved styling -->
    <OrderSuccessModal :is-open="showOrderSuccessModal" :order-id="successOrderId" :order-summary="successOrderSummary"
      @close="showOrderSuccessModal = false" />

    <!-- Cart Float Button with improved styling -->
    <button v-if="showButton" @click="openCart"
      class="flex fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-200 animate-fadeIn">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span
        class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
        {{ cartStore.cartItemCount }}
      </span>
    </button>

    <!-- Order Success Notification with improved animation -->
    <div v-if="showOrderSuccess"
      class="fixed top-6 right-6 bg-green-100 border-l-4 border-green-600 text-green-800 p-4 rounded-lg shadow-lg z-50 max-w-md animate-slideIn">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ orderSuccessMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button @click="showOrderSuccess = false"
              class="inline-flex rounded-md p-1.5 text-green-600 hover:bg-green-200 focus:outline-none transition-colors duration-200">
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <Login :is-open="showLoginModal" @close="closeLoginModal" @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { usePharmacyStore } from "~/stores/pharmacy";
import { useCartStore } from "~/stores/cart";
import { useUserStore } from "~/stores/user";

// Router and stores
const router = useRouter();
const route = useRoute();
const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();
const userStore = useUserStore();

// Page metadata
definePageMeta({
  layout: "pharm",
  title: "Pharmacy Store",
  middleware: ["pharmacy"],
});

// State Variables
const searchQuery = ref("");
const viewMode = ref("table");
const cartSidebar = ref(null);
const searchInput = ref(null);
const isSearching = ref(false);
const searchResults = ref([]);
const searchDebounceTimer = ref(null);
const showLoginModal = ref(false);

// Order success state
const orderSuccessMessage = ref("");
const showOrderSuccess = ref(false);
const showOrderSuccessModal = ref(false);
const successOrderId = ref("");
const successOrderSummary = ref({});

// Computed properties
const showButton = computed(
  () => cartStore.hasItems && cartStore.cartItemCount > 0
);
const pharmacySlug = computed(() => route.params.pharmacy);
const formatCartTotal = computed(() => {
  const total = cartStore.cartTotal || 0;
  return total.toFixed(2);
});

const whatsappLink = computed(() => {
  let formattedPhone = pharmacyStore.pharmacyData?.phone || "+233543424014";

  // Extract the first phone number if multiple are provided with a separator
  if (formattedPhone.includes("/")) {
    formattedPhone = formattedPhone.split("/")[0];
  }

  // Format the phone number properly for WhatsApp
  formattedPhone = formattedPhone.replace(/\D/g, "");

  if (formattedPhone.startsWith("0")) {
    formattedPhone = "233" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = "233" + formattedPhone;
  }

  // Remove any + sign that might be present
  formattedPhone = formattedPhone.replace("+", "");

  // Create predefined message
  const message = encodeURIComponent(
    `Hello, I'm contacting from your pharmacy website.`
  );

  return `https://wa.me/${formattedPhone}?text=${message}`;
});

// Computed property for products to display - either search results or all products
const displayProducts = computed(() => {
  // If searching and we have a query, show search results (including out of stock)
  if (searchQuery.value && searchQuery.value.trim().length > 0) {
    return searchResults.value;
  }
  // Otherwise show all in-stock products
  return pharmacyStore.inStockProducts;
});

// UI Methods
const focusSearchInput = () => {
  if (searchInput.value) {
    searchInput.value.focus();
  }
};

const toggleCart = () => {
  if (cartSidebar.value) {
    cartSidebar.value.toggleCart();
  } else {
    cartStore.toggleCart();
  }
};

const openCart = () => {
  if (cartSidebar.value) {
    cartSidebar.value.toggleCart();
  }
};

const updateViewMode = () => {
  viewMode.value = window.innerWidth < 768 ? "grid" : "table";
};

const clearSearchAfterAddToCart = (product) => {
  setTimeout(() => {
    searchQuery.value = "";
    searchResults.value = [];
    focusSearchInput();
  }, 100);
};

// Search control methods
const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
};

// Search functionality with API integration
const searchProducts = async (query) => {
  if (!query || query.trim().length === 0) {
    searchResults.value = [];
    isSearching.value = false;
    return;
  }

  isSearching.value = true;

  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase;

    // Call the product search API
    const response = await fetch(
      `${baseURL}/api/products/search?company_id=${pharmacyStore.currentPharmacy
      }&q=${encodeURIComponent(query.trim())}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Map API response to expected format (matching the pharmacy store format)
      searchResults.value = (data.data || []).map((product) => ({
        id: product.id,
        barcode: product.barcode,
        brandName: product.brand_name,
        masterName: product.master_name,
        dosage: product.dosage,
        strength: product.strength,
        unit: product.unit,
        buyUnit: product.buy_unit,
        sellUnit: product.sell_unit,
        costPrice: product.cost_price,
        sellingPrice: product.selling_price,
        markup: product.markup,
        discount: product.discount,
        stockQty: product.stock_qty,
        reorder: product.reorder,
        shelves: product.shelves,
        productExpiry: product.product_expiry,
        hasMultiExpiryDate: product.has_multi_expiry_date,
        hasTax: product.has_tax,
        multi: product.multi,
        supplier: product.supplier,
        supplierId: product.supplier_id,
        selectedProdClass: product.selected_prod_class,
        isActive: product.is_active,
        inStock: product.stock_qty > 0,
        quantity: product.stock_qty,
      }));
    } else {
      searchResults.value = [];
    }
  } catch (error) {
    console.error("Error searching products:", error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

// Debounced search to avoid excessive API calls
const debouncedSearch = (query) => {
  // Clear existing timer
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }

  // Set new timer
  searchDebounceTimer.value = setTimeout(() => {
    searchProducts(query);
  }, 300); // 300ms delay
};

// Navigation Methods
const navigateToOrders = () => {
  if (pharmacyStore.pharmacySlug) {
    router.push(`/${pharmacyStore.pharmacySlug}/orders`);
  }
};

const navigateToCustomerAccount = () => {
  if (pharmacyStore.pharmacySlug) {
    router.push(`/customer`);
  }
};

const goToPharmacySelection = () => {
  router.push("/");
};

// Order handling
const handleOrderSuccess = (orderData) => {
  // Set the order details for the success modal
  successOrderId.value = orderData.orderId || orderData.order_id || "";
  successOrderSummary.value = {
    totalItems: orderData.totalItems || 0,
    totalQuantity: orderData.totalQuantity || 0,
    totalAmount: orderData.totalAmount || 0,
  };

  // Show the success modal
  showOrderSuccessModal.value = true;

  // Also show the notification for a few seconds
  orderSuccessMessage.value = `Order #${successOrderId.value} placed successfully!`;
  showOrderSuccess.value = true;

  setTimeout(() => {
    showOrderSuccess.value = false;
  }, 5000);
};

// Data & Authentication Methods
const refreshData = async () => {
  if (pharmacyStore.currentPharmacy) {
    await pharmacyStore.fetchPharmacyData();
  }
};

const handleLogout = async () => {
  try {
    await userStore.logout();
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

// Login methods
const openLoginModal = () => {
  showLoginModal.value = true;
};

const closeLoginModal = () => {
  showLoginModal.value = false;
};

const handleLoginSuccess = async () => {
  closeLoginModal();
  // User state will be updated automatically by the store
  // Load user stats to ensure fresh data
  if (userStore.isLoggedIn) {
    await userStore.loadUserStats();
  }
};

// Lifecycle hooks
onMounted(async () => {
  // Load pharmacy data if needed
  if (pharmacyStore.currentPharmacy && !pharmacyStore.pharmacyData) {
    await pharmacyStore.fetchPharmacyData();
  }

  updateViewMode();
  window.addEventListener("resize", updateViewMode);

  // Check auth state when app loads
  await userStore.checkAuthState();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateViewMode);

  // Clear any pending search timer
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }
});

// Watch for route changes
watch(
  () => route.params.pharmacy,
  async (newPharmacy, oldPharmacy) => {
    if (newPharmacy !== oldPharmacy) {
      // Only update if the pharmacy has changed
      if (pharmacyStore.pharmacySlug !== newPharmacy) {
        const pharmacyId = await pharmacyStore.getPharmacyIdFromSlug(
          newPharmacy
        );

        if (pharmacyId) {
          await pharmacyStore.setCurrentPharmacy(pharmacyId);
          cartStore.setActivePharmacy(pharmacyId, newPharmacy);
        }
      }
    }
  }
);

// Watch search query for real-time API search
watch(searchQuery, (newQuery) => {
  if (newQuery && newQuery.trim().length > 0) {
    debouncedSearch(newQuery);
  } else {
    searchResults.value = [];
    isSearching.value = false;
    // Clear any pending search
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value);
    }
  }
});
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}

/* Smooth transitions */
.container,
button,
.rounded-xl,
input {
  transition: all 0.2s ease-in-out;
}

/* Dropdown scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c7d2fe;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a5b4fc;
}

/* Improved touch targets for mobile */
@media (max-width: 640px) {
  button {
    min-height: 44px;
  }

  input[type="text"] {
    min-height: 44px;
  }
}
</style>
