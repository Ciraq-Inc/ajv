<template>
  <header class="fixed left-0 right-0 top-0 z-40 px-3 py-3 sm:px-5">
    <div
      class="mx-auto max-w-7xl rounded-2xl border transition-all duration-300"
      :class="[
        isScrolled
          ? 'border-brand-100 bg-white/[0.96] shadow-lift backdrop-blur-xl'
          : 'border-white/70 bg-white/[0.94] shadow-soft backdrop-blur-xl',
      ]"
    >
      <div class="flex items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3.5">
        <nuxt-link to="/" class="flex items-center gap-2.5">
          <img src="/brand/rig-mark.svg" alt="MedsGh" width="36" height="36" />
          <div>
            <p class="text-lg font-bold leading-none text-brand-700 sm:text-xl">MedsGh</p>
          </div>
        </nuxt-link>

        <nav class="ml-8 hidden items-center gap-5 whitespace-nowrap text-sm font-semibold text-ink-600 lg:flex xl:ml-12 xl:gap-7">
          <nuxt-link to="/" class="transition hover:text-brand-700">Home</nuxt-link>
          <a href="/#how-it-works" class="transition hover:text-brand-700">How It Works</a>
          <a href="/#support" class="transition hover:text-brand-700">Support</a>
          <nuxt-link to="/jobs" class="transition hover:text-brand-700">Jobs</nuxt-link>
        </nav>

        <div class="ml-auto hidden items-center gap-2 lg:flex">
          <a
            href="tel:+233599368632"
            class="hidden items-center gap-2 whitespace-nowrap rounded-full bg-brand-50 px-3.5 py-2 text-xs font-semibold text-ink-600 transition hover:bg-brand-100 xl:inline-flex"
          >
            <i class="ri-phone-line text-sm"></i>
            (+233) 599-368-632
          </a>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://wa.me/+233599368632"
            class="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
          >
            <i class="ri-whatsapp-line text-base"></i>
            Contact Us
          </a>

          <button
            v-if="!userStore.isLoggedIn && route.path !== '/'"
            @click="showLoginModal = true"
            class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-600 transition hover:bg-brand-50"
          >
            <i class="ri-user-line text-base"></i>
            Login
          </button>

          <div v-else-if="userStore.isLoggedIn" class="relative profile-menu-container">
            <button
              @click.stop="showProfileMenu = !showProfileMenu"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-600 transition hover:bg-brand-50"
            >
              <i class="ri-user-line text-base"></i>
              <span class="max-w-[100px] truncate">{{ userStore.currentUser?.fname || 'Account' }}</span>
              <i :class="['ri-arrow-down-s-line text-base transition-transform duration-200', showProfileMenu ? 'rotate-180' : '']"></i>
            </button>

            <div
              v-if="showProfileMenu"
              @click.stop
              class="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-ink-200 bg-white py-2 shadow-xl"
            >
              <div class="border-b border-ink-100 px-4 py-3">
                <p class="text-sm font-semibold text-ink-900">{{ userStore.currentUser?.fname }} {{ userStore.currentUser?.lname }}</p>
                <p class="mt-1 text-xs text-ink-500">{{ formatPhone(userStore.currentUser?.phone) || userStore.currentUser?.email }}</p>
                <p v-if="userStore.currentCompany" class="mt-1 flex items-center gap-1 text-xs text-brand-700">
                  <i class="ri-building-line"></i>
                  {{ currentCompanyName }}
                </p>
              </div>

              <nuxt-link to="/customer" @click="showProfileMenu = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 transition hover:bg-ink-50">
                <i class="ri-user-settings-line text-lg"></i>
                My Account
              </nuxt-link>
              <nuxt-link to="/customer?tab=orders" @click="showProfileMenu = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 transition hover:bg-ink-50">
                <i class="ri-shopping-bag-line text-lg"></i>
                My Orders
              </nuxt-link>
              <nuxt-link
                v-if="userStore.hasMultipleCompanies"
                to="/customer?tab=companies"
                @click="showProfileMenu = false"
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-600 transition hover:bg-ink-50"
              >
                <i class="ri-building-line text-lg"></i>
                Linked Companies ({{ userStore.companyCount }})
              </nuxt-link>

              <div class="mt-2 border-t border-ink-100"></div>

              <button @click="handleLogout" class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-700 transition hover:bg-red-50">
                <i class="ri-logout-box-line text-lg"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2 lg:hidden">
          <button
            v-if="!userStore.isLoggedIn && route.path !== '/'"
            @click="showLoginModal = true; showMobileMenu = false"
            class="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-brand-50"
          >
            <i class="ri-login-box-line text-base"></i>
            Login
          </button>

          <nuxt-link
            v-else-if="userStore.isLoggedIn"
            to="/customer"
            class="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-brand-50"
          >
            <i class="ri-user-star-line text-base"></i>
            My Hub
          </nuxt-link>

          <button
            @click="showMobileMenu = !showMobileMenu"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-100 bg-white text-ink-600 transition hover:bg-brand-50"
          >
            <i :class="[showMobileMenu ? 'ri-close-line' : 'ri-menu-line', 'text-lg']"></i>
          </button>
        </div>
      </div>

      <div v-if="showMobileMenu" class="border-t border-brand-100 px-3 py-3 lg:hidden sm:px-5">
        <div class="space-y-2 rounded-xl bg-brand-50/70 p-3 text-sm text-ink-600">
          <nuxt-link to="/" @click="showMobileMenu = false" class="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white">
            <span>Home</span>
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
            <a href="tel:+233599368632" class="inline-flex items-center gap-2 text-xs font-semibold text-ink-600">
              <i class="ri-phone-line text-sm"></i>
              (+233) 599-368-632
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://wa.me/+233599368632"
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition"
            >
              <i class="ri-whatsapp-line text-base"></i>
              Contact Us on WhatsApp
            </a>
          </div>

          <div v-if="userStore.isLoggedIn" class="mt-3 space-y-2 border-t border-brand-100 pt-3">
            <div class="rounded-lg bg-white px-3 py-2">
              <p class="text-sm font-semibold text-ink-900">{{ userStore.currentUser?.fname }} {{ userStore.currentUser?.lname }}</p>
              <p class="mt-1 text-xs text-ink-500">{{ formatPhone(userStore.currentUser?.phone) || userStore.currentUser?.email }}</p>
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
            <button @click="handleLogout" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50">
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

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import Login from '~/components/Login.vue'

// TODO: remove once stores/ are .ts

const userStore = useUserStore()
const route = useRoute()
const showLoginModal = ref(false)
const showProfileMenu = ref(false)
const showMobileMenu = ref(false)
const showLogoutConfirm = ref(false)
const isScrolled = ref(false)

const handleLoginSuccess = (payload: { destination?: string } = {}): void => {
  showLoginModal.value = false
  if (payload.destination === 'new') {
    navigateTo('/customer?tab=new')
    return
  }
  navigateTo('/customer')
}

const handleLogout = (): void => {
  showProfileMenu.value = false
  showMobileMenu.value = false
  showLogoutConfirm.value = true
}

const confirmLogout = async (): Promise<void> => {
  try {
    // userStore.logout is untyped (store not yet .ts)
    await (userStore as { logout: () => Promise<void> }).logout()
    showLogoutConfirm.value = false
    navigateTo({ path: '/', query: { logged_out: Date.now().toString() } })
  } catch (error: unknown) {
    console.error('Error logging out:', error)
  }
}

const currentCompanyName = computed<string>(() => {
  const c = userStore.currentCompany as { company_name?: string; name?: string } | null | undefined
  return c?.company_name ?? c?.name ?? ''
})

const formatPhone = (phone: string | undefined): string => {
  if (!phone) return ''
  if (phone.startsWith('+233')) {
    const digits = phone.substring(4)
    return `+233 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`
  }
  return phone
}

const handleClickOutside = (event: MouseEvent): void => {
  const profileMenuContainer = document.querySelector('.profile-menu-container')
  if (profileMenuContainer && !profileMenuContainer.contains(event.target as Node)) {
    showProfileMenu.value = false
  }
}

const handleScroll = (): void => {
  isScrolled.value = window.scrollY > 12
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, true)
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside, true)
})
</script>
