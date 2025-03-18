<!-- Navbar -->
<template>
    <header class="py-6 bg-white">
      <div class="container mx-auto lg:relative flex flex-col lg:flex-row lg:justify-between gap-y-4 lg:gap-y-0">
        <!-- Logo Section -->
        <div class="flex justify-between items-center lg:justify-start">
          <nuxt-link to="/" class="flex items-center cursor-pointer">
            <!-- Fallback Logo -->
            <img src="~/assets/images/ajv.png" alt="Meds GH" width="150" height="80" />
          </nuxt-link>
  
          <!-- Mobile Hamburger Button -->
          <div class="flex items-center">
            <button @click="toggleCart" class="mr-4 relative lg:hidden">
              <i class="ri-shopping-cart-line text-2xl text-green-800"></i>
              <span v-if="cartItemCount > 0"
                class="absolute -top-2 -left-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ cartItemCount }}
              </span>
              <span class="text-green-800 ml-1">GHS{{ cartTotal.toFixed(2) }}</span>
            </button>
  
            <button class="lg:hidden z-50 relative">
              <i :class="[
                'ri-menu-line text-3xl',
                mobileNavOpen ? 'text-white' : 'text-black',
              ]"></i>
            </button>
          </div>
        </div>
  
        <!-- Navigation Container -->
        <div class="flex flex-col gap-y-4 lg:flex-row lg:gap-x-10 lg:gap-y-0 lg:items-center">
          <!-- Contact Info (Visible on Desktop) -->
          <div class="hidden lg:flex items-center space-x-6">
            <div class="flex items-center gap-x-2">
              <i class="ri-map-pin-2-fill text-2xl text-green-800"></i>
              <div class="text-secondary text-sm">Accra</div>
            </div>
            <div class="flex items-center gap-x-2">
              <i class="ri-phone-fill text-2xl text-green-800"></i>
              <div class="text-secondary text-sm">(+233) 503793513</div>
            </div>
          </div>
  
          <!--Cart & Contact Button -->
          <div class="flex items-center">
            <button @click="toggleCart" class="hidden lg:flex mr-4 relative">
              <i class="ri-shopping-cart-line text-2xl text-green-800"></i>
              <span v-if="cartItemCount > 0"
                class="absolute -top-2 -left-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ cartItemCount }}
              </span>
              <span class="text-green-800 ml-1">GHS{{ cartTotal.toFixed(2) }}</span>
            </button>
  
            <a href="https://wa.me/+233503793513" target="_blank"
              class="btn btn-sm btn-outline w-[240px] lg:w-auto mx-auto lg:mx-0">
              Contact Us
            </a>
          </div>
        </div>
  
      </div>
    </header>
  
    <CartSidebar ref="cartComponent" />
  </template>
  
  <script setup>
  import { storeToRefs } from "pinia";
  import { usePharmacyStore } from "../stores/pharmacy.js";
  import { useCartStore } from "../stores/cart.js";
  
  const pharmacyStore = usePharmacyStore();
  
  const cartStore = useCartStore();
  const { cartItemCount, cartTotal } = storeToRefs(cartStore);
  const cartComponent = ref(null);
  
  const toggleCart = () => {
    cartComponent.value.toggleCart();
  };
  
  const mobileNavOpen = ref(false);
  const mobileResourceDropdownOpen = ref(false);
  
  const toggleMobileNav = () => {
    mobileNavOpen.value = !mobileNavOpen.value;
  };
  
  const closeMobileNav = () => {
    mobileNavOpen.value = false;
    mobileResourceDropdownOpen.value = false;
  };
  
  const toggleMobileResourceDropdown = () => {
    mobileResourceDropdownOpen.value = !mobileResourceDropdownOpen.value;
  };
  </script>
  
  <style scoped>
  /* Add any additional scoped styles if needed */
  </style>
  