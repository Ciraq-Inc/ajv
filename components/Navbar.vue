<template>
  <header class="bg-white shadow-sm py-2.5 border-b border-gray-100">
    <div class="container mx-auto px-6 lg:relative flex flex-col lg:flex-row lg:justify-between lg:items-center gap-y-6 lg:gap-y-0 max-w-7xl">
      <!-- Logo and Brand -->
      <div class="flex justify-center lg:justify-start">
        <nuxt-link to="/" class="flex items-center cursor-pointer">
          <img src="../assets/images/rigellogo.png" alt="Rigelis" width="60" height="60" class="mr-1" />
          <h1 class="text-2xl font-bold text-black">MedsGh</h1>
        </nuxt-link>
      </div>

      <div class="flex flex-col gap-y-5 lg:flex-row lg:gap-x-8 lg:gap-y-0 lg:items-center">
        <!-- Location -->
        <div class="flex justify-center items-center gap-x-3 lg:justify-normal">
          <div class="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <!-- <div class="text-gray-700 font-medium">
            1 La Bawaleshie Rd, Accra, Ghana
          </div> -->
        </div>
        
        <!-- Phone -->
        <div class="flex justify-center items-center gap-x-3 lg:justify-normal">
          <div class="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div class="text-gray-700 font-medium">(+233) 30 255-4857</div>
        </div>
        
        <!-- Contact Button -->
        <a 
          target="_blank" 
          href="https://wa.me/+233537291557"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-x-2 w-[240px] mx-auto lg:w-auto lg:mx-0"
        >
        <i class="ri-whatsapp-line mr-1 text-2xl"></i>
          Contact Us
        </a>

        <!-- customer Login -->
        <button 
          @click="showLoginModal = true"
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-x-2 w-[240px] mx-auto lg:w-auto lg:mx-0"
        >
          <i class="ri-user-line mr-1 text-2xl"></i>
          Login
        </button>

        <!-- Login Modal -->
        <Login 
          :is-open="showLoginModal" 
          @close="showLoginModal = false"
          @login-success="handleLoginSuccess"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import Login from '~/components/Login.vue'

const showLoginModal = ref(false)

const handleLoginSuccess = () => {
  // Redirect to customer account page after successful login
  navigateTo('/customer')
}
</script>
