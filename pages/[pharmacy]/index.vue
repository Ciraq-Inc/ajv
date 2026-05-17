<!-- pages/[pharmacy]/index.vue -->
<template>
  <div class="storefront-shell container mx-auto w-full max-w-7xl px-4 py-6" :style="themeCssVars">
    <!-- Sticky mini header (outside v-if chain so it doesn't break v-else) -->
    <Transition name="sticky-header">
      <div
        v-if="showStickyHeader && pharmacyStore.pharmacyData"
        class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 px-4 py-2 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <img
            v-if="pharmacyStore.pharmacyData.logo"
            :src="pharmacyStore.pharmacyData.logo"
            class="h-7 w-7 rounded-full object-cover flex-shrink-0 border border-gray-100"
            :alt="pharmacyStore.pharmacyData.name ?? ''"
          />
          <div v-else class="h-7 w-7 rounded-full shopfront-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {{ (pharmacyStore.pharmacyData.name || '')[0]?.toUpperCase() }}
          </div>
          <span class="font-semibold text-gray-900 text-sm truncate">{{ pharmacyStore.pharmacyData.name }}</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <a
            v-if="pharmacyStore.pharmacyData.phone"
            :href="`tel:${pharmacyStore.pharmacyData.phone}`"
            class="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            aria-label="Call pharmacy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
          <a
            v-if="pharmacyStore.pharmacyData.phone"
            :href="whatsappLink"
            target="_blank"
            class="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
            aria-label="WhatsApp pharmacy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </a>
        </div>
      </div>
    </Transition>

    <!-- Loading Indicator with improved animation -->
    <div v-if="pharmacyStore.isLoading" class="flex flex-col items-center justify-center py-24">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 shopfront-spinner mb-4"></div>
      <div class="animate-pulse">
        <p class="shopfront-text font-medium text-lg">
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
      <div ref="pharmacyHeaderRef" class="">
        <div
          class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div class="shopfront-hero h-20 md:h-28 flex items-end p-4 md:p-6 relative" :style="heroStyle">
            <!-- Pharmacy logo with enhanced styling -->
            <div class="bg-white rounded-full p-2 md:p-3 shadow-lg -mb-8 md:-mb-12 border-4 border-white">
              <div v-if="pharmacyStore.pharmacyData?.logo">
                <img :src="pharmacyStore.pharmacyData.logo" :alt="pharmacyStore.pharmacyData?.name + ' logo'"
                  class="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover" />
              </div>
              <div v-else class="rounded-full p-2 shopfront-accent-soft">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 md:h-12 md:w-12 shopfront-text" fill="none"
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
                </h1>

                <div class="flex items-center mt-2 text-sm md:text-base text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5 mr-2 shopfront-text" fill="none"
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

                <p class="mt-3 text-gray-700 max-w-2xl line-clamp-2 md:line-clamp-none">
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
                    <span v-if="!pharmacyStore.pharmacyData?.hide_prices" class="font-medium">GHS{{ formatCartTotal
                      }}</span>

                    <span v-if="cartStore.cartItemCount > 0"
                      class="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {{ cartStore.cartItemCount }}
                    </span>
                  </div>
                </button>

                <!-- Contact buttons with improved styling -->
                <div class="flex gap-3">
                  <a v-if="pharmacyStore.pharmacyData?.phone" :href="`tel:${pharmacyStore.pharmacyData.phone}`"
                    class="shopfront-primary text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm md:text-base shadow-md">
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
                  <button @click="openLoginModal" v-if="!userStore.isLoggedIn"
                    class="shopfront-primary text-white px-3 py-3 rounded-lg transition-colors duration-200 inline-flex items-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section v-if="activeAds.length" class="grid gap-5 lg:grid-cols-2">
        <article v-for="ad in activeAds" :key="ad.id" class="shopfront-ad-card group">
          <div class="shopfront-ad-top">
            <div class="flex items-center gap-2">
              <span class="shopfront-ad-chip">{{ ad.type === "image" ? "Visual Ad" : "Promo" }}</span>
              <span class="shopfront-ad-chip bg-white/70 text-gray-700">Featured</span>
            </div>
            <h3 class="mt-4 text-3xl font-black tracking-tight text-gray-950 leading-tight">{{ ad.headline }}</h3>
            <p v-if="ad.body" class="shopfront-ad-body mt-3 text-sm font-medium leading-5 text-gray-700">{{ ad.body }}</p>
            <p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">{{ formatAdWindow(ad.start_date, ad.end_date) }}</p>
          </div>

          <div class="shopfront-ad-media">
            <img v-if="ad.type === 'image' && ad.image_url" :src="ad.image_url" :alt="(ad.headline as string | undefined) ?? ''" class="h-full w-full object-cover" />
            <div v-else class="shopfront-ad-fallback">
              <p class="text-base font-semibold text-white/95">Pharmacy Promotion</p>
              <p class="mt-2 text-sm text-white/80">Explore this offer in store.</p>
            </div>

            <button type="button" class="shopfront-ad-cta">
              Read More
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </article>
      </section>

      <!-- Search Bar -->
      <div class="bg-opacity-80 backdrop-blur-md py-3 mt-3 sticky top-0 z-40">
        <div
          class="bg-white rounded-xl shadow-lg p-3 border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shopfront-text" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input v-model="searchQuery" ref="searchInput" type="text"
              placeholder="Search products..."
              class="w-full pl-12 px-4 py-3 md:py-4 border border-gray-200 rounded-lg shopfront-input bg-gray-50 text-gray-700 shadow-sm transition-all duration-200 text-lg" />
            <button v-if="searchQuery" type="button" @click="clearSearch"
              class="absolute right-4 top-3 md:top-4 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="mt-2 flex justify-end">
            <button type="button" @click="submitRequestSearch"
              class="text-sm shopfront-text font-medium hover:underline inline-flex items-center gap-1">
              Can't find what you need? Request it
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- User Info Section with improved styling -->
      <div v-if="userStore.isLoggedIn && userStore.currentUser"
        class="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100 transition-all duration-300 hover:shadow-xl animate-fadeIn">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center">
            <div class="shopfront-avatar-bg rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 shopfront-text" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p class="text-sm shopfront-text font-medium">Welcome back</p>
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
              class="flex-1 sm:flex-none px-4 py-2 text-sm shopfront-btn-soft rounded-lg transition-colors duration-200 font-medium shadow-sm">
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
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 shopfront-text" fill="none" viewBox="0 0 24 24"
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
                ? 'shopfront-primary text-white shadow-md'
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
                ? 'shopfront-primary text-white shadow-md'
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
        <div v-if="!pharmacyStore.hasProducts"
          class="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 transition-all duration-300 hover:shadow-xl">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-full shopfront-accent-soft shopfront-text mb-6">
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

        <!-- Products display -->
        <template v-else>
          <ProductsTable v-if="viewMode === 'table'" :products="displayProducts" :search-query="searchQuery"
            :hide-prices="pharmacyStore.pharmacyData?.hide_prices ?? false" class="hidden lg:flex"
            @item-added-to-cart="onItemAddedToCart" />

          <ProductsGrid v-else :products="displayProducts" :search-query="searchQuery"
            :hide-prices="pharmacyStore.pharmacyData?.hide_prices ?? false"
            @item-added-to-cart="onItemAddedToCart"
            @request-product="onRequestProduct" />

          <!-- Offset-based pagination (legacy backend shape) -->
          <div v-if="pharmacyStore.productPagination.totalPages > 1"
            class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
            <p class="text-sm text-gray-500">
              Showing
              <span class="font-medium text-gray-700">{{ paginationFrom }}</span>
              –
              <span class="font-medium text-gray-700">{{ paginationTo }}</span>
              of
              <span class="font-medium text-gray-700">{{ pharmacyStore.productPagination.total }}</span>
              products
            </p>
            <nav class="flex items-center gap-1">
              <button @click="changePage(pharmacyStore.productPagination.currentPage - 1)"
                :disabled="pharmacyStore.productPagination.currentPage === 1"
                class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Previous
              </button>
              <button v-for="p in paginationPages" :key="p" @click="changePage(p)" :class="[
                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                p === pharmacyStore.productPagination.currentPage
                  ? 'shopfront-primary text-white border-transparent'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              ]">{{ p }}</button>
              <button @click="changePage(pharmacyStore.productPagination.currentPage + 1)"
                :disabled="pharmacyStore.productPagination.currentPage === pharmacyStore.productPagination.totalPages"
                class="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </nav>
          </div>

          <!-- Cursor-based "Load more" (new backend shape) -->
          <div v-if="pharmacyStore.nextCursor" class="mt-6 flex justify-center">
            <button
              :disabled="isLoadingMoreProducts"
              @click="loadMoreProducts"
              class="px-5 py-2.5 shopfront-primary text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-md text-sm font-medium transition-all"
            >
              <svg v-if="isLoadingMoreProducts" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ isLoadingMoreProducts ? 'Loading...' : 'Load more' }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Cart Sidebar -->
    <CartSidebar ref="cartSidebar" @order-success="handleOrderSuccess" />

    <!-- Order Success Modal with improved styling -->
    <OrderSuccessModal :is-open="showOrderSuccessModal" :order-id="successOrderId" :order-summary="successOrderSummary"
      @close="showOrderSuccessModal = false" />

    <!-- Cart toast (shows above FAB on add-to-cart) -->
    <Transition name="cart-toast">
      <div
        v-if="cartToast.show"
        class="fixed bottom-24 right-6 z-50 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 max-w-[210px]"
      >
        <div class="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="truncate">{{ cartToast.name }} added</span>
      </div>
    </Transition>

    <!-- Cart Float Button -->
    <button v-if="showButton" @click="openCart"
      class="flex items-center gap-2 fixed bottom-6 right-6 shopfront-primary text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-200 animate-fadeIn hover:brightness-95 active:brightness-90">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span class="text-sm font-bold">GHS {{ formatCartTotal }}</span>
      <span class="bg-white/25 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
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

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from "vue-router";
import { usePharmacyStore } from "~/stores/pharmacy";
import { useCartStore } from "~/stores/cart";
import { useUserStore } from "~/stores/user";
import { createAdsService } from "~/services/ads/adsService";

// Extended Ad shape — the API returns additional fields beyond what types.ts declares
interface ExtendedAd {
  id: number | string
  type?: string | null
  headline?: string | null
  body?: string | null
  image_url?: string | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean | null
  [key: string]: unknown
}

interface ThemePreset {
  accent: string
  gradient: string
}

interface PharmacyData {
  logo?: string | null
  name?: string | null
  location?: string | null
  description?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  hide_prices?: boolean | null
  shop_banner?: string | null
  theme_preset?: string | null
  theme_color?: string | null
  [key: string]: unknown
}

interface ProductPagination {
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
}

interface Product {
  [key: string]: unknown
}

interface OrderSuccessSummary {
  totalItems?: number
  totalQuantity?: number
  totalAmount?: number
}

interface OrderSuccessData {
  orderId?: string | null
  order_id?: string | null
  totalItems?: number
  totalQuantity?: number
  totalAmount?: number
}

// TODO: remove once stores/ are .ts
const pharmacyStore = usePharmacyStore() as unknown as {
  pharmacyData: PharmacyData | null
  isLoading: boolean
  error: string | null
  notFound: boolean
  hasProducts: boolean
  products: Product[]
  productPagination: ProductPagination
  nextCursor: string | null
  currentPharmacy: string | number | null
  pharmacySlug: string | null
  fetchPharmacyData: () => Promise<void>
  fetchProducts: (params: { page?: number; limit?: number; search?: string; cursor?: string }) => Promise<void>
  getPharmacyIdFromSlug: (slug: string) => Promise<string | number | null>
  setCurrentPharmacy: (id: string | number) => Promise<void>
}

// TODO: remove once stores/ are .ts
const cartStore = useCartStore() as unknown as {
  cartTotal: number
  cartItemCount: number
  hasItems: boolean
  toggleCart: () => void
  setActivePharmacy: (id: string | number, slug: string) => void
}

// TODO: remove once stores/ are .ts
const userStore = useUserStore() as unknown as {
  isLoggedIn: boolean
  currentUser: { lname?: string | null; phone?: string | null } | null
  logout: () => Promise<void>
  loadUserStats: () => Promise<void>
}

const themePresets: Record<string, ThemePreset> = {
  indigo: { accent: "#4f46e5", gradient: "linear-gradient(135deg, #4338ca 0%, #6366f1 48%, #312e81 100%)" },
  teal: { accent: "#0f766e", gradient: "linear-gradient(135deg, #115e59 0%, #14b8a6 50%, #0f172a 100%)" },
  rose: { accent: "#e11d48", gradient: "linear-gradient(135deg, #9f1239 0%, #fb7185 50%, #4c0519 100%)" },
  emerald: { accent: "#047857", gradient: "linear-gradient(135deg, #065f46 0%, #34d399 50%, #022c22 100%)" },
  orange: { accent: "#ea580c", gradient: "linear-gradient(135deg, #9a3412 0%, #fb923c 55%, #431407 100%)" },
  slate: { accent: "#334155", gradient: "linear-gradient(135deg, #0f172a 0%, #475569 50%, #1e293b 100%)" },
  custom: { accent: "#4f46e5", gradient: "linear-gradient(135deg, #1e293b 0%, #4f46e5 100%)" },
};

// Router and stores
const router = useRouter();
const route = useRoute();

// Page metadata
definePageMeta({
  layout: "pharm",
  title: "Pharmacy Store",
  middleware: ["pharmacy"],
});

// State Variables
const searchQuery = ref<string>("");
const isLoadingMoreProducts = ref<boolean>(false);
const viewMode = ref<string>("table");
const cartSidebar = ref<{ toggleCart: () => void } | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const showLoginModal = ref<boolean>(false);
const pharmacyHeaderRef = ref<HTMLElement | null>(null);
const showStickyHeader = ref<boolean>(false);
const cartToast = ref<{ show: boolean; name: string }>({ show: false, name: '' });
let cartToastTimer: ReturnType<typeof setTimeout> | null = null;
let headerObserver: IntersectionObserver | null = null;
const _adsService = createAdsService(useApi());
const { data: _adsResult, refresh: refreshAds } = useAsyncData(
  `pharmacy-ads-${String(route.params['pharmacy'])}`,
  () => pharmacyStore.currentPharmacy
    ? _adsService.listPublic(String(pharmacyStore.currentPharmacy)).catch(() => null)
    : Promise.resolve(null),
  { lazy: true }
);
const activeAds = computed<ExtendedAd[]>(() => (_adsResult.value?.data ?? []) as ExtendedAd[]);

const HOMEPAGE_REQUEST_DRAFT_KEY = "medsgh_homepage_request_draft";

// Order success state
const orderSuccessMessage = ref<string>("");
const showOrderSuccess = ref<boolean>(false);
const showOrderSuccessModal = ref<boolean>(false);
const successOrderId = ref<string>("");
const successOrderSummary = ref<OrderSuccessSummary>({});

// Computed properties
const showButton = computed<boolean>(
  () => cartStore.hasItems && cartStore.cartItemCount > 0
);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pharmacySlug = computed<string>(() => String(route.params['pharmacy'] ?? ''));
const formatCartTotal = computed<string>(() => {
  const total = cartStore.cartTotal ?? 0;
  return total.toFixed(2);
});

const currentTheme = computed<ThemePreset>(() => {
  const preset = pharmacyStore.pharmacyData?.theme_preset ?? "indigo";
  const baseTheme = (preset !== undefined ? themePresets[preset] : undefined) ?? themePresets['indigo']!;

  if (preset === "custom") {
    const customColor = pharmacyStore.pharmacyData?.theme_color ?? baseTheme.accent;
    return {
      accent: customColor,
      gradient: `linear-gradient(135deg, ${customColor} 0%, #0f172a 100%)`,
    };
  }

  return baseTheme;
});

const themeCssVars = computed<Record<string, string>>(() => ({
  "--shopfront-accent": currentTheme.value.accent,
  "--shopfront-accent-soft": `${currentTheme.value.accent}1a`,
}));

const heroStyle = computed<Record<string, string>>(() => {
  const banner = pharmacyStore.pharmacyData?.shop_banner;

  return {
    backgroundImage: banner
      ? `linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.22)), url(${banner})`
      : currentTheme.value.gradient,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
});

const whatsappLink = computed<string>(() => {
  let formattedPhone: string | null | undefined = pharmacyStore.pharmacyData?.whatsapp_number;

  if (!formattedPhone) {
    return "";
  }

  // Extract the first phone number if multiple are provided with a separator
  if (formattedPhone.includes("/")) {
    formattedPhone = formattedPhone.split("/")[0] ?? '';
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

const formatAdWindow = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  if (!startDate && !endDate) {
    return "Available now";
  }

  const start = startDate ? new Date(startDate).toLocaleDateString() : "Now";
  const end = endDate ? new Date(endDate).toLocaleDateString() : "Until removed";
  return `${start} to ${end}`;
};

// TODO(ts): pharmacyStore is untyped JS; cast to match PharmacyProduct shape expected by ProductsTable/ProductsGrid
const displayProducts = computed(() => pharmacyStore.products as unknown as { id: number; brandName: string; sellingPrice: number; stockQty: number; [key: string]: unknown }[]);

const paginationFrom = computed<number>(() => {
  const { currentPage, pageSize } = pharmacyStore.productPagination;
  return (currentPage - 1) * pageSize + 1;
});

const paginationTo = computed<number>(() => {
  const { currentPage, pageSize, total } = pharmacyStore.productPagination;
  return Math.min(currentPage * pageSize, total);
});

const paginationPages = computed<number[]>(() => {
  const { currentPage, totalPages } = pharmacyStore.productPagination;
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

// UI Methods
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const focusSearchInput = (): void => {
  if (searchInput.value) {
    searchInput.value.focus();
  }
};

const toggleCart = (): void => {
  if (cartSidebar.value) {
    cartSidebar.value.toggleCart();
  } else {
    cartStore.toggleCart();
  }
};

const openCart = (): void => {
  if (cartSidebar.value) {
    cartSidebar.value.toggleCart();
  }
};

const updateViewMode = (): void => {
  viewMode.value = window.innerWidth < 768 ? "grid" : "table";
};

const clearSearch = (): void => {
  searchQuery.value = "";
};

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const changePage = (page: number): void => {
  const { totalPages } = pharmacyStore.productPagination;
  if (page < 1 || page > totalPages) return;
  void pharmacyStore.fetchProducts({ page, limit: pharmacyStore.productPagination.pageSize, search: searchQuery.value.trim() });
};

const loadMoreProducts = async (): Promise<void> => {
  if (!pharmacyStore.nextCursor || isLoadingMoreProducts.value) return;
  isLoadingMoreProducts.value = true;
  try {
    await pharmacyStore.fetchProducts({
      cursor: pharmacyStore.nextCursor,
      search: searchQuery.value.trim(),
    });
  } catch (err) {
    console.error('Failed to load more products:', err);
  } finally {
    isLoadingMoreProducts.value = false;
  }
};

interface RequestDraftItem {
  product_name: string
  quantity: number
}

const normalizeRequestDraftItem = (item: unknown): RequestDraftItem | null => {
  const rawName = typeof item === "string" ? item : (item as Record<string, unknown>)?.['product_name'];
  const productName = String(rawName ?? "").trim();
  if (!productName) return null;

  const rawQty = (item as Record<string, unknown>)?.['quantity'];
  return {
    product_name: productName,
    quantity: Math.max(1, Number(rawQty ?? 1)),
  };
};

const persistRequestDraft = (items: unknown[] = []): void => {
  if (!process.client) return;

  const normalizedItems = (Array.isArray(items) ? items : [items])
    .map(normalizeRequestDraftItem)
    .filter((i): i is RequestDraftItem => i !== null);

  if (!normalizedItems.length) {
    sessionStorage.removeItem(HOMEPAGE_REQUEST_DRAFT_KEY);
    return;
  }

  sessionStorage.setItem(
    HOMEPAGE_REQUEST_DRAFT_KEY,
    JSON.stringify({
      items: normalizedItems,
      source: "pharmacy-storefront-search",
    })
  );
};

const hasRequestDraft = (): boolean => {
  if (!process.client) return false;
  return Boolean(sessionStorage.getItem(HOMEPAGE_REQUEST_DRAFT_KEY));
};

const openRequestFlow = async (draftItems: unknown[] = []): Promise<void> => {
  persistRequestDraft(draftItems);

  if (userStore.isLoggedIn) {
    await router.push("/customer?tab=new");
    return;
  }

  showLoginModal.value = true;
};

const submitRequestSearch = (): void => {
  const query = searchQuery.value.trim();
  void openRequestFlow(query ? [{ product_name: query, quantity: 1 }] : []);
  clearSearch();
};

// Navigation Methods
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const navigateToOrders = (): void => {
  if (pharmacyStore.pharmacySlug) {
    void router.push(`/${pharmacyStore.pharmacySlug}/orders`);
  }
};

const navigateToCustomerAccount = (): void => {
  if (pharmacyStore.pharmacySlug) {
    void router.push(`/customer`);
  }
};

const goToPharmacySelection = (): void => {
  void router.push("/");
};

// Order handling
const handleOrderSuccess = (orderData: OrderSuccessData): void => {
  successOrderId.value = orderData.orderId ?? orderData.order_id ?? "";
  successOrderSummary.value = {
    totalItems: orderData.totalItems ?? 0,
    totalQuantity: orderData.totalQuantity ?? 0,
    totalAmount: orderData.totalAmount ?? 0,
  };

  showOrderSuccessModal.value = true;

  orderSuccessMessage.value = `Order #${successOrderId.value} placed successfully!`;
  showOrderSuccess.value = true;

  setTimeout(() => {
    showOrderSuccess.value = false;
  }, 5000);
};

// Data & Authentication Methods
const refreshData = async (): Promise<void> => {
  if (pharmacyStore.currentPharmacy) {
    await Promise.all([pharmacyStore.fetchPharmacyData(), refreshAds()]);
  }
};

const handleLogout = async (): Promise<void> => {
  try {
    await userStore.logout();
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

// Login methods
const openLoginModal = (): void => {
  showLoginModal.value = true;
};

const closeLoginModal = (): void => {
  showLoginModal.value = false;
};

const handleLoginSuccess = async (): Promise<void> => {
  closeLoginModal();
  if (userStore.isLoggedIn) {
    await userStore.loadUserStats();
  }

  if (hasRequestDraft()) {
    await router.push("/customer?tab=new");
  }
};

const onItemAddedToCart = (product: Record<string, unknown>): void => {
  if (cartToastTimer !== null) clearTimeout(cartToastTimer);
  cartToast.value = { show: true, name: String(product['brandName'] ?? product['name'] ?? 'Item') };
  cartToastTimer = setTimeout(() => { cartToast.value = { ...cartToast.value, show: false }; }, 2500);
};

const onRequestProduct = (name: string | null | undefined): void => {
  if (name) searchQuery.value = name;
  submitRequestSearch();
};

// Lifecycle hooks
onMounted(() => {
  updateViewMode();
  window.addEventListener("resize", updateViewMode);
});

watch(pharmacyHeaderRef, (el) => {
  headerObserver?.disconnect();
  if (!el) return;
  headerObserver = new IntersectionObserver(
    ([entry]) => { showStickyHeader.value = !(entry?.isIntersecting ?? true); },
    { threshold: 0 }
  );
  headerObserver.observe(el);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateViewMode);
  if (searchDebounceTimer !== null) clearTimeout(searchDebounceTimer);
  if (cartToastTimer !== null) clearTimeout(cartToastTimer);
  headerObserver?.disconnect();
});

// Debounced search — re-fetch from page 1 on query change
watch(searchQuery, (newQuery) => {
  if (searchDebounceTimer !== null) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    void pharmacyStore.fetchProducts({ page: 1, limit: pharmacyStore.productPagination.pageSize, search: newQuery.trim() });
  }, 400);
});

// Watch for route changes
watch(
  () => route.params['pharmacy'],
  async (newPharmacy, oldPharmacy) => {
    if (newPharmacy !== oldPharmacy) {
      const newSlug = String(newPharmacy ?? '')
      if (pharmacyStore.pharmacySlug !== newSlug) {
        const pharmacyId = await pharmacyStore.getPharmacyIdFromSlug(newSlug);

        if (pharmacyId) {
          await pharmacyStore.setCurrentPharmacy(pharmacyId);
          cartStore.setActivePharmacy(pharmacyId, newSlug);
          await refreshAds();
        }
      }
    }
  }
);
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

/* Sticky header slide down */
.sticky-header-enter-active,
.sticky-header-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.sticky-header-enter-from,
.sticky-header-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Cart toast pop up */
.cart-toast-enter-active,
.cart-toast-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.cart-toast-enter-from,
.cart-toast-leave-to {
  transform: translateY(6px);
  opacity: 0;
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}

.storefront-shell {
  --shopfront-accent: #4f46e5;
  --shopfront-accent-soft: rgba(79, 70, 229, 0.1);
}

.shopfront-hero {
  position: relative;
}

.shopfront-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.24));
}

.shopfront-hero > * {
  position: relative;
  z-index: 1;
}

.shopfront-primary {
  background: var(--shopfront-accent);
}

.shopfront-primary:hover {
  filter: brightness(0.95);
}

.shopfront-primary:active {
  filter: brightness(0.9);
}

.shopfront-accent-soft {
  background: var(--shopfront-accent-soft);
}

.shopfront-text {
  color: var(--shopfront-accent);
}

.shopfront-spinner {
  border-color: var(--shopfront-accent);
}

.shopfront-btn-soft {
  background: var(--shopfront-accent-soft);
  color: var(--shopfront-accent);
}

.shopfront-btn-soft:hover {
  filter: brightness(0.95);
}

.shopfront-btn-soft:active {
  filter: brightness(0.9);
}

.shopfront-avatar-bg {
  background: var(--shopfront-accent-soft);
}

.shopfront-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--shopfront-accent);
  border-color: var(--shopfront-accent);
}

.shopfront-ad-card {
  display: flex;
  flex-direction: row;
  border-radius: 28px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(15, 23, 42, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.shopfront-ad-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
}

.shopfront-ad-top {
  flex: 1 1 58%;
  padding: 1.1rem;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--shopfront-accent) 14%, #ffffff),
    color-mix(in srgb, var(--shopfront-accent) 8%, #f0f4f8)
  );
}

.shopfront-ad-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.32rem 0.68rem;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
}

.shopfront-ad-body {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.shopfront-ad-media {
  position: relative;
  flex: 1 1 42%;
  min-height: 240px;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a, #334155);
}

.shopfront-ad-fallback {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 1.5rem;
  text-align: center;
}

.shopfront-ad-cta {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #0f172a;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(6px);
}

.shopfront-ad-cta span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 999px;
  background: var(--shopfront-accent-soft);
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
  background: var(--shopfront-accent-soft);
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--shopfront-accent);
}

/* Improved touch targets for mobile */
@media (max-width: 640px) {
  button {
    min-height: 44px;
  }

  input[type="text"] {
    min-height: 44px;
  }

  .shopfront-ad-card {
    flex-direction: column;
  }

  .shopfront-ad-top {
    padding: 1rem;
  }

  .shopfront-ad-media {
    /* margin: 0 0.6rem 0.6rem; */
    min-height: 200px;
  }
}
</style>
