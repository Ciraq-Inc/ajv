<!-- Navbar -->
<template>
  <header class="py-6">
    <div class="container mx-auto lg:relative flex flex-col lg:flex-row lg:justify-between gap-y-4 lg:gap-y-0">
      <!-- Logo Section -->
      <div class="flex justify-between items-center lg:justify-start">
        <nuxt-link to="/" class="flex items-center cursor-pointer">
          <!-- Dynamic Pharmacy Logo -->
          <img v-if="pharmacyStore.pharmacyData && pharmacyStore.pharmacyData.logoUrl"
            :src="pharmacyStore.pharmacyData.logoUrl"
            :alt="pharmacyStore.pharmacyData ? pharmacyStore.pharmacyData.name : 'Pharmacy'" width="150" height="80" />
          <!-- Fallback Logo -->
          <img v-else src="~/assets/images/ajv.png" alt="Meds GH" width="150" height="80" />
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

      <!-- Mobile Navigation Overlay -->
      <div v-if="mobileNavOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="closeMobileNav"></div>

      <!-- Mobile Navigation Menu -->
      <nav :class="[
        'fixed top-0 left-0 w-[80%] h-full bg-white z-50 transform transition-transform duration-300 ease-in-out',
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
      ]">
        <div class="p-6">
          <!-- Mobile Nav Close Button -->
          <div @click="closeMobileNav" class="absolute top-4 right-4 cursor-pointer">
            <i class="ri-close-line text-3xl"></i>
          </div>

          <!-- Mobile Logo -->
          <nuxt-link to="/" class="flex items-center mb-8">
            <img src="~/assets/images/ajv.png" alt="ajv" width="100" height="50" />
          </nuxt-link>

          <!-- Mobile Navigation Links -->
          <ul class="space-y-4">
            <li class="flex items-center space-x-2">
              <i class="ri-home-4-fill text-2xl text-green-800"></i>
              <nuxt-link to="/" class="text-secondary hover:text-text-green-800 transition-colors"
                @click="closeMobileNav">
                Home
              </nuxt-link>
            </li>
            <li class="flex items-center space-x-2">
              <i class="ri-customer-service-2-fill text-2xl text-green-800"></i>
              <a href="#services" class="text-secondary hover:text-green-800 transition-colors" @click="closeMobileNav">
                Services
              </a>
            </li>
            <li class="flex items-center space-x-2">
              <i class="ri-message-2-line text-2xl text-green-800"></i>
              <a href="#about" class="text-secondary hover:text-green-800 transition-colors" @click="closeMobileNav">
                About Us
              </a>
            </li>
            <li class="flex items-center space-x-2">
              <i class="ri-shake-hands-fill text-2xl text-green-800"></i>
              <a href="mailto:rigelis@rigelis.co" class="text-secondary hover:text-green-800 transition-colors"
                @click="closeMobileNav">
                Investor Relations
              </a>
            </li>

            <!-- Resources Dropdown (Mobile) -->
            <li>
              <div @click="toggleMobileResourceDropdown" class="flex items-center justify-between cursor-pointer">
                <div class="flex items-center space-x-2">
                  <i class="ri-folder-open-line text-2xl text-green-800"></i>
                  <span class="text-secondary">Resources</span>
                </div>
                <i :class="[
                  'ri-arrow-down-s-line text-2xl text-green-800',
                  mobileResourceDropdownOpen ? 'rotate-180' : '',
                ]"></i>
              </div>

              <div v-if="mobileResourceDropdownOpen" class="pl-6 mt-2 space-y-2">
                <nuxt-link to="/locator" class="block text-secondary hover:text-green-800" @click="closeMobileNav">
                  Locator
                </nuxt-link>
                <nuxt-link to="/referral" class="block text-secondary hover:text-green-800" @click="closeMobileNav">
                  Referral
                </nuxt-link>
                <nuxt-link to="/market" class="block text-secondary hover:text-green-800" @click="closeMobileNav">
                  Market Place
                </nuxt-link>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </header>

  <Cart ref="cartComponent" />
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
