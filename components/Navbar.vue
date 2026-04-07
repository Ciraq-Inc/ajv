<template>
  <header class="fixed left-0 right-0 top-0 z-40 px-3 py-3 sm:px-5">
    <div
      class="mx-auto max-w-7xl rounded-2xl border transition-all duration-300"
      :class="[
        isScrolled
          ? 'border-[#e4d3f8] bg-white/96 shadow-[0_20px_48px_-32px_rgba(80,0,148,0.18)] backdrop-blur-xl'
          : 'border-white/70 bg-white/84 shadow-[0_20px_52px_-36px_rgba(80,0,148,0.16)] backdrop-blur-xl',
      ]"
    >
      <div class="flex items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3.5">
        <nuxt-link to="/" class="flex items-center gap-2.5">
          <img src="../assets/images/rigellogo.png" alt="Rigelis" width="46" height="46" class="rounded-xl" />
          <div>
            <p class="text-lg font-bold leading-none text-[#520094] sm:text-xl">MedsGh</p>
            <p class="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">Trusted Pharmacy Network</p>
          </div>
        </nuxt-link>

        <nav class="ml-6 hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
          <nuxt-link to="/" class="transition hover:text-[#520094]">Home</nuxt-link>
          <nuxt-link to="/drugs" class="transition hover:text-[#520094]">Products</nuxt-link>
          <a href="/#how-it-works" class="transition hover:text-[#520094]">How It Works</a>
          <a href="/#support" class="transition hover:text-[#520094]">Support</a>
          <nuxt-link to="/jobs" class="transition hover:text-[#520094]">Jobs</nuxt-link>
        </nav>

        <div class="ml-auto hidden items-center gap-2 lg:flex">
          <a
            href="tel:+233552587974"
            class="inline-flex items-center gap-2 rounded-full bg-[#f7efff] px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#f0e2ff]"
          >
            <i class="ri-phone-line text-sm"></i>
            (+233) 55-258-7974
          </a>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://wa.me/+233552587974"
            class="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            <i class="ri-whatsapp-line text-base"></i>
            Contact Us
          </a>

          <button
            v-if="!userStore.isLoggedIn"
            @click="showLoginModal = true"
            class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#f7efff]"
          >
            <i class="ri-user-line text-base"></i>
            Login
          </button>

          <div v-else class="relative profile-menu-container">
            <button
              @click.stop="showProfileMenu = !showProfileMenu"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#f7efff]"
            >
              <i class="ri-user-line text-base"></i>
              <span class="max-w-[100px] truncate">{{ userStore.currentUser?.fname || 'Account' }}</span>
              <i :class="['ri-arrow-down-s-line text-base transition-transform duration-200', showProfileMenu ? 'rotate-180' : '']"></i>
            </button>

            <div
              v-if="showProfileMenu"
              @click.stop
              class="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
            >
              <div class="border-b border-slate-100 px-4 py-3">
                <p class="text-sm font-semibold text-slate-900">{{ userStore.currentUser?.fname }} {{ userStore.currentUser?.lname }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ formatPhone(userStore.currentUser?.phone) }}</p>
                <p v-if="userStore.currentCompany" class="mt-1 flex items-center gap-1 text-xs text-purple-700">
                  <i class="ri-building-line"></i>
                  {{ userStore.currentCompany.company_name }}
                </p>
              </div>

              <nuxt-link to="/customer" @click="showProfileMenu = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                <i class="ri-user-settings-line text-lg"></i>
                My Account
              </nuxt-link>
              <nuxt-link to="/customer?tab=orders" @click="showProfileMenu = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                <i class="ri-shopping-bag-line text-lg"></i>
                My Orders
              </nuxt-link>
              <nuxt-link
                v-if="userStore.hasMultipleCompanies"
                to="/customer?tab=companies"
                @click="showProfileMenu = false"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <i class="ri-building-line text-lg"></i>
                Linked Companies ({{ userStore.companyCount }})
              </nuxt-link>

              <div class="mt-2 border-t border-slate-100"></div>

              <button @click="handleLogout" class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50">
                <i class="ri-logout-box-line text-lg"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2 lg:hidden">
          <button
            v-if="!userStore.isLoggedIn"
            @click="showLoginModal = true; showMobileMenu = false"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#eadbfd] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#f7efff]"
          >
            <i class="ri-login-box-line text-base"></i>
            Login
          </button>

          <nuxt-link
            v-else
            to="/customer"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#eadbfd] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#f7efff]"
          >
            <i class="ri-user-star-line text-base"></i>
            My Hub
          </nuxt-link>

          <button
            @click="showMobileMenu = !showMobileMenu"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#eadbfd] bg-white text-slate-700 transition hover:bg-[#f7efff]"
          >
            <i :class="[showMobileMenu ? 'ri-close-line' : 'ri-menu-line', 'text-lg']"></i>
          </button>
        </div>
      </div>

      <div v-if="showMobileMenu" class="border-t border-[#efe4fa] px-3 py-3 lg:hidden sm:px-5">
        <div class="space-y-2 rounded-xl bg-[#fbf6ff] p-3 text-sm text-slate-700">
          <nuxt-link to="/" @click="showMobileMenu = false" class="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white">
            <span>Home</span>
            <i class="ri-arrow-right-line"></i>
          </nuxt-link>
          <nuxt-link to="/drugs" @click="showMobileMenu = false" class="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white">
            <span>Products</span>
            <i class="ri-arrow-right-line"></i>
          </nuxt-link>
         
          <a href="/#how-it-works" @click="showMobileMenu = false" class="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white">
            <span>How It Works</span>
            <i class="ri-arrow-right-line"></i>
          </a>
          <a href="/#support" @click="showMobileMenu = false" class="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white">
            <span>Support</span>
            <i class="ri-arrow-right-line"></i>
          </a>
           <nuxt-link to="/jobs" @click="showMobileMenu = false" class="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white">
            <span>Jobs</span>
            <i class="ri-arrow-right-line"></i>
          </nuxt-link>

          <div class="mt-3 flex flex-col gap-2 rounded-lg bg-white p-3">
            <a href="tel:+233552587974" class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
              <i class="ri-phone-line text-sm"></i>
              (+233) 55-258-7974
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://wa.me/+233552587974"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
            >
              <i class="ri-whatsapp-line text-base"></i>
              Contact Us on WhatsApp
            </a>
          </div>

          <div v-if="userStore.isLoggedIn" class="mt-3 space-y-2 border-t border-[#efe4fa] pt-3">
            <div class="rounded-lg bg-white px-3 py-2">
              <p class="text-sm font-semibold text-slate-900">{{ userStore.currentUser?.fname }} {{ userStore.currentUser?.lname }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ formatPhone(userStore.currentUser?.phone) }}</p>
            </div>
            <nuxt-link to="/customer" @click="showMobileMenu = false" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white">
              <i class="ri-user-settings-line"></i>
              My Account
            </nuxt-link>
            <nuxt-link to="/customer?tab=orders" @click="showMobileMenu = false" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white">
              <i class="ri-shopping-bag-line"></i>
              My Orders
            </nuxt-link>
            <nuxt-link to="/customer?tab=companies" @click="showMobileMenu = false" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white">
              <i class="ri-store-3-line"></i>
              My Pharmacies
            </nuxt-link>
            <button @click="handleLogout" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50">
              <i class="ri-logout-box-line"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <Login :is-open="showLoginModal" @close="showLoginModal = false" @login-success="handleLoginSuccess" />

    <ConfirmDialog
      :is-open="showLogoutConfirm"
      title="Log out?"
      message="You will need to sign in again to view your requests, wallet, and account details."
      confirm-text="Log Out"
      cancel-text="Stay Here"
      variant="danger"
      @close="showLogoutConfirm = false"
      @confirm="confirmLogout"
    />
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '~/stores/user'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import Login from '~/components/Login.vue'

const userStore = useUserStore()
const showLoginModal = ref(false)
const showProfileMenu = ref(false)
const showMobileMenu = ref(false)
const showLogoutConfirm = ref(false)
const isScrolled = ref(false)

const handleLoginSuccess = (payload = {}) => {
  showLoginModal.value = false
  if (payload.destination === 'new') {
    navigateTo('/customer?tab=new')
    return
  }
  // Redirect to customer account page after successful login
  navigateTo('/customer')
}

const handleLogout = () => {
  showProfileMenu.value = false
  showMobileMenu.value = false
  showLogoutConfirm.value = true
}

const confirmLogout = async () => {
  try {
    await userStore.logout()
    showLogoutConfirm.value = false
    navigateTo({ path: '/', query: { logged_out: Date.now().toString() } })
  } catch (error) {
    console.error('Error logging out:', error)
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

const handleScroll = () => {
  isScrolled.value = window.scrollY > 12
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })

  // Use capture phase and add small delay to allow navigation to work
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true)
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside, true)
})
</script>
