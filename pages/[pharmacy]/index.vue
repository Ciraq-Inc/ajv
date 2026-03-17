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
      <div class="storefront-shell overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-xl">
        <div class="grid gap-4 p-4 md:gap-6 md:p-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <section class="storefront-hero-panel relative overflow-hidden rounded-[24px] p-5 text-white md:p-8">
            <div class="absolute inset-0 storefront-hero-pattern"></div>
            <div class="relative">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="space-y-4">
                  <div class="flex flex-wrap items-center gap-3">
                    <div
                      class="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur-sm md:h-20 md:w-20">
                      <div v-if="pharmacyStore.pharmacyData?.logoUrl">
                        <img :src="pharmacyStore.pharmacyData.logoUrl" :alt="pharmacyStore.pharmacyData?.name + ' logo'"
                          class="h-12 w-12 rounded-2xl object-cover md:h-14 md:w-14" />
                      </div>
                      <div v-else class="rounded-2xl bg-white/10 p-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white md:h-10 md:w-10" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-50 backdrop-blur-sm">
                          Pharmacy storefront
                        </span>
                        <span
                          class="inline-flex items-center rounded-full border border-emerald-200/50 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-50 backdrop-blur-sm">
                          Open
                        </span>
                      </div>

                      <h1 class="max-w-3xl text-2xl font-bold leading-tight md:text-4xl">
                        {{ pharmacyStore.pharmacyData?.name || "Welcome" }}
                      </h1>
                    </div>
                  </div>

                  <div class="flex max-w-2xl items-start text-sm text-indigo-50/90 md:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 mr-3 h-5 w-5 shrink-0 text-indigo-100"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p class="line-clamp-2">
                      {{ pharmacyStore.pharmacyData?.location }}
                    </p>
                  </div>

                  <p class="max-w-2xl text-sm leading-7 text-indigo-50/85 md:text-base">
                    {{
                      pharmacyStore.pharmacyData?.description ||
                      "Browse our available products and place your order online. Fast delivery within the area."
                    }}
                  </p>
                </div>

                <button @click="focusSearchInput"
                  class="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search products
                </button>
              </div>

              <div class="mt-6 grid gap-3 sm:grid-cols-3">
                <div class="storefront-stat-card">
                  <p class="storefront-stat-label">Available products</p>
                  <p class="storefront-stat-value">{{ availableProductCount }}</p>
                </div>
                <div class="storefront-stat-card">
                  <p class="storefront-stat-label">Cart items</p>
                  <p class="storefront-stat-value">{{ cartStore.cartItemCount }}</p>
                </div>
                <div class="storefront-stat-card">
                  <p class="storefront-stat-label">Ordering</p>
                  <p class="storefront-stat-value text-base md:text-lg">Pickup or delivery</p>
                </div>
              </div>
            </div>
          </section>

          <aside class="storefront-side-panel rounded-[24px] border border-indigo-100 bg-white/90 p-4 shadow-lg">
            <div class="space-y-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Quick actions</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-900">Contact or continue your order</h2>
                <p class="mt-1 text-sm leading-6 text-slate-600">
                  Review your cart, contact the pharmacy, or sign in to continue from your customer account.
                </p>
              </div>

              <button @click="toggleCart"
                class="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-emerald-50 px-4 py-4 text-left text-emerald-900 ring-1 ring-emerald-100 transition hover:bg-emerald-100">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Cart total</p>
                    <p class="text-lg font-semibold">GHS{{ formatCartTotal }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span v-if="cartStore.cartItemCount > 0"
                    class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold text-white">
                    {{ cartStore.cartItemCount }}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-emerald-700 transition group-hover:translate-x-0.5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <a v-if="pharmacyStore.pharmacyData?.phone" :href="`tel:${pharmacyStore.pharmacyData.phone}`"
                  class="storefront-action-button bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call pharmacy
                </a>

                <a v-if="pharmacyStore.pharmacyData?.whatsapp_number || pharmacyStore.pharmacyData?.phone" :href="whatsappLink"
                  target="_blank"
                  class="storefront-action-button bg-green-600 text-white hover:bg-green-700 active:bg-green-800">
                  <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  WhatsApp
                </a>
              </div>

              <button v-if="userStore.isLoggedIn" @click="navigateToCustomerAccount"
                class="storefront-secondary-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Go to my account
              </button>

              <a v-else @click="openLoginModal" class="storefront-secondary-button cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Login to continue
              </a>
            </div>
          </aside>
        </div>
      </div>

      <div class="sticky top-0 z-40">
        <div class="storefront-search-shell rounded-[22px] border border-indigo-100 bg-white/90 p-3 shadow-lg backdrop-blur-xl md:p-4">
          <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Search inventory</p>
              <p class="mt-1 text-sm text-slate-600">
                {{ searchStatusText }}
              </p>
            </div>

            <button v-if="searchQuery" @click="clearSearch"
              class="inline-flex items-center self-start rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100">
              Clear search
            </button>
          </div>

          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg v-if="isSearching" class="h-5 w-5 animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input v-model="searchQuery" ref="searchInput" type="text"
              placeholder="Search for medications, health products..."
              class="w-full rounded-2xl border border-indigo-100 bg-slate-50 py-3.5 pl-12 pr-12 text-base text-slate-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 md:text-lg" />
            <span v-if="searchQuery" @click="clearSearch"
              class="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
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
      <div class="storefront-products-panel animate-fadeIn rounded-[26px] border border-indigo-100 bg-white p-4 shadow-xl md:p-6">
        <div class="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 class="text-xl font-bold text-slate-900">Products</h2>
              <span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {{ displayProducts.length }} {{ displayProducts.length === 1 ? "item" : "items" }}
              </span>
            </div>
            <p class="mt-2 text-sm text-slate-600">
              {{ productsSectionText }}
            </p>
          </div>

          <div class="hidden rounded-xl bg-slate-100 p-1 shadow-inner lg:flex">
            <button @click="viewMode = 'grid'" :class="[
              'rounded-lg px-3 py-2 transition-colors duration-200',
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-white',
            ]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button @click="viewMode = 'table'" :class="[
              'rounded-lg px-3 py-2 transition-colors duration-200',
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-white',
            ]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="pt-5">
        <div v-if="searchQuery && !isSearching"
          class="mb-5 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <div>
              <p class="font-semibold">Showing results for "{{ searchQuery }}"</p>
              <p class="text-xs text-indigo-700/80">{{ displayProducts.length }} matches in this storefront</p>
            </div>
          </div>

          <button @click="clearSearch"
            class="inline-flex items-center self-start rounded-full bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 sm:self-auto">
            Clear search
          </button>
        </div>

        <div v-if="!pharmacyStore.hasProducts && !searchQuery"
          class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
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
          class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
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
          <ProductsTable v-if="viewMode === 'table'" :products="displayProducts" :search-query="''" class="hidden lg:flex"
            @item-added-to-cart="clearSearchAfterAddToCart" />

          <ProductsGrid v-else :products="displayProducts" :search-query="''"
            @item-added-to-cart="clearSearchAfterAddToCart" />
        </template>
        </div>
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
    <ConfirmDialog
      :is-open="showLogoutConfirm"
      title="Log out?"
      message="You will return to the home page and will need to sign in again to continue."
      confirm-text="Log Out"
      cancel-text="Stay Here"
      variant="danger"
      @close="showLogoutConfirm = false"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import ConfirmDialog from "~/components/ConfirmDialog.vue";
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
const showLogoutConfirm = ref(false);

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
const availableProductCount = computed(
  () => pharmacyStore.inStockProducts?.length || 0
);
const formatCartTotal = computed(() => {
  const total = cartStore.cartTotal || 0;
  return total.toFixed(2);
});
const searchStatusText = computed(() => {
  if (isSearching.value) {
    return "Searching inventory...";
  }

  if (searchQuery.value && searchQuery.value.trim().length > 0) {
    const resultLabel = displayProducts.value.length === 1 ? "result" : "results";
    return `${displayProducts.value.length} ${resultLabel} for "${searchQuery.value.trim()}"`;
  }

  const productLabel = availableProductCount.value === 1 ? "product" : "products";
  return `${availableProductCount.value} ${productLabel} ready to browse`;
});
const productsSectionText = computed(() => {
  if (searchQuery.value && searchQuery.value.trim().length > 0) {
    return "Search results update as you type across the pharmacy inventory.";
  }

  return "Browse the pharmacy catalog and add items to cart from this page.";
});

const whatsappLink = computed(() => {
  let formattedPhone =
    pharmacyStore.pharmacyData?.whatsapp_number ||
    pharmacyStore.pharmacyData?.phone ||
    "";

  if (!formattedPhone) {
    return "#";
  }

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

const handleLogout = () => {
  showLogoutConfirm.value = true;
};

const confirmLogout = async () => {
  try {
    await userStore.logout();
    showLogoutConfirm.value = false;
    navigateTo({ path: '/', query: { logged_out: Date.now().toString() } });
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

const handleLoginSuccess = async (payload = {}) => {
  closeLoginModal();

  if (payload.destination === 'new') {
    await navigateTo('/customer?tab=new');
    return;
  }

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
.storefront-shell {
  background:
    radial-gradient(circle at top right, rgba(129, 140, 248, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(255, 255, 255, 1));
}

.storefront-hero-panel {
  background: linear-gradient(135deg, #3747a5 0%, #4f46e5 46%, #5b4ae0 100%);
  box-shadow: 0 28px 70px -44px rgba(49, 46, 129, 0.9);
}

.storefront-hero-pattern {
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.24), transparent 24%),
    radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.22), transparent 28%);
}

.storefront-side-panel,
.storefront-search-shell,
.storefront-products-panel {
  box-shadow: 0 22px 55px -42px rgba(15, 23, 42, 0.55);
}

.storefront-stat-card {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 1rem 1.1rem;
  backdrop-filter: blur(10px);
}

.storefront-stat-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(224, 231, 255, 0.88);
}

.storefront-stat-value {
  margin-top: 0.5rem;
  font-size: 1.8rem;
  line-height: 1;
  font-weight: 700;
  color: #ffffff;
}

.storefront-action-button,
.storefront-secondary-button {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}

.storefront-secondary-button {
  border: 1px solid #dbe4ff;
  background: #f8faff;
  color: #334155;
}

.storefront-secondary-button:hover {
  background: #eef2ff;
  color: #312e81;
}

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

  .storefront-stat-value {
    font-size: 1.55rem;
  }

  .storefront-action-button,
  .storefront-secondary-button {
    padding: 0.8rem 0.9rem;
  }
}
</style>
