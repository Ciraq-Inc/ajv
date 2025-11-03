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

        <!-- Customer Not Logged In -->
        <button 
          v-if="!userStore.isLoggedIn"
          @click="showLoginModal = true"
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-x-2 w-[240px] mx-auto lg:w-auto lg:mx-0"
        >
          <i class="ri-user-line mr-1 text-2xl"></i>
          Login
        </button>

        <!-- Customer Logged In - Show Profile Menu -->
        <div v-else class="relative profile-menu-container">
          <button 
            @click.stop="showProfileMenu = !showProfileMenu"
            class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-x-2 w-[240px] mx-auto lg:w-auto lg:mx-0"
          >
            <i class="ri-user-line mr-1 text-2xl"></i>
            <span class="truncate max-w-[120px]">{{ userStore.currentUser?.fname || 'Account' }}</span>
            <i :class="['ri-arrow-down-s-line text-lg transition-transform duration-200', showProfileMenu ? 'rotate-180' : '']"></i>
          </button>

          <!-- Dropdown Menu -->
          <div 
            v-if="showProfileMenu"
            @click.stop
            class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          >
            <!-- User Info -->
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-semibold text-gray-900">
                {{ userStore.currentUser?.fname }} {{ userStore.currentUser?.lname }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ formatPhone(userStore.currentUser?.phone) }}</p>
              <p v-if="userStore.currentCompany" class="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                <i class="ri-building-line"></i>
                {{ userStore.currentCompany.company_name }}
              </p>
            </div>

            <!-- Menu Items -->
            <nuxt-link 
              to="/customer"
              @click="showProfileMenu = false"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i class="ri-user-settings-line text-lg"></i>
              My Account
            </nuxt-link>

            <nuxt-link 
              to="/customer?tab=orders"
              @click="showProfileMenu = false"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i class="ri-shopping-bag-line text-lg"></i>
              My Orders
            </nuxt-link>

            <nuxt-link 
              v-if="userStore.hasMultipleCompanies"
              to="/customer?tab=companies"
              @click="showProfileMenu = false"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i class="ri-building-line text-lg"></i>
              Linked Companies ({{ userStore.companyCount }})
            </nuxt-link>

            <div class="border-t border-gray-100 mt-2"></div>

            <button 
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <i class="ri-logout-box-line text-lg"></i>
              Logout
            </button>
          </div>
        </div>

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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '~/stores/user'
import Login from '~/components/Login.vue'

const userStore = useUserStore()
const showLoginModal = ref(false)
const showProfileMenu = ref(false)

const handleLoginSuccess = () => {
  showLoginModal.value = false
  // Redirect to customer account page after successful login
  navigateTo('/customer')
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to log out?')) {
    try {
      await userStore.logout()
      showProfileMenu.value = false
      navigateTo('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }
}

const formatPhone = (phone) => {
  if (!phone) return ''
  // Format: +233 XX XXX XXXX
  if (phone.startsWith('+233')) {
    const digits = phone.substring(4)
    return `+233 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`
  }
  return phone
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  // Check if click is inside the profile menu container
  const profileMenuContainer = document.querySelector('.profile-menu-container')
  if (profileMenuContainer && !profileMenuContainer.contains(event.target)) {
    showProfileMenu.value = false
  }
}

onMounted(() => {
  // Use capture phase and add small delay to allow navigation to work
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true)
  }, 100)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>
