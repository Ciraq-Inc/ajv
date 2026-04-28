<template>
  <div class="text-[#1d1a20] antialiased overflow-x-hidden min-h-screen bg-[#f4f4f5]">
    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 h-full hidden lg:flex flex-col p-5 gap-2 bg-white border-r border-zinc-200 w-64 z-50 ">
      <div class="flex items-center gap-3 mb-10 px-2 cursor-pointer" @click="goTo('home')">
        <img src="~/assets/images/rigellogo.png" class="h-10 w-auto object-contain" alt="MedsGH Logo" />
        <div>
          <h1 class="text-[1.7rem] font-semibold text-zinc-900 leading-none tracking-tight">MedsGh</h1>
        </div>
      </div>

      <nav class="flex-1 space-y-2">
        <button @click="goTo('home')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'home' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'" >
          <span class="material-symbols-outlined" :style="activeNav === 'home' ? 'font-variation-settings: \'FILL\' 1;' : ''">home</span>
          Home
        </button>
        <button @click="goTo('requests')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'requests' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <span class="material-symbols-outlined" :style="activeNav === 'requests' ? 'font-variation-settings: \'FILL\' 1;' : ''">description</span>
          My Requests
        </button>
        <button @click="goTo('wallet')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'wallet' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <span class="material-symbols-outlined" :style="activeNav === 'wallet' ? 'font-variation-settings: \'FILL\' 1;' : ''">account_balance_wallet</span>
          Wallet
        </button>
        <button @click="goTo('orders')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'orders' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <span class="material-symbols-outlined" :style="activeNav === 'orders' ? 'font-variation-settings: \'FILL\' 1;' : ''">receipt_long</span>
          History
        </button>
        <button @click="goTo('companies')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'companies' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <span class="material-symbols-outlined" :style="activeNav === 'companies' ? 'font-variation-settings: \'FILL\' 1;' : ''">local_pharmacy</span>
          Pharmacies
        </button>
        <button @click="goTo('profile')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'profile' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <span class="material-symbols-outlined" :style="activeNav === 'profile' ? 'font-variation-settings: \'FILL\' 1;' : ''">person</span>
          Profile
        </button>
      </nav>

      <div class="mt-auto pt-6 border-t border-[#ede3f2]">
        <button @click="goTo('new')" class="w-full bg-zinc-900 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-[0_15px_30px_-15px_rgba(53,0,98,0.5)] hover:scale-[0.98] transition-transform">
          <span class="material-symbols-outlined">add</span>
          New Request
        </button>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-4 mt-4 text-[#5d5564] hover:text-[#ba1a1a] transition-colors font-medium text-sm rounded-xl hover:bg-red-50">
          <span class="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>

    <main class="lg:ml-64 min-h-screen bg-gradient-to-br from-[#e8dff5] to-[#ddd5ef] pb-28 lg:pb-0">
      <!-- TopAppBar: hidden on concierge new-request and list views -->
      <header
        v-if="activeNav !== 'new' && activeNav !== 'requests'"
        class="sticky top-0 z-40 bg-[#f4f4f5]/92 backdrop-blur-md px-4 lg:px-8 flex justify-between items-center border-b border-zinc-200"
        :class="activeNav === 'home' ? 'py-5 lg:py-6' : 'py-3.5 lg:py-4'"
      >
        <div v-if="activeNav === 'home' || canGoBack" class="flex min-w-0 flex-1 items-center gap-2.5 lg:gap-3">
          <div v-if="activeNav === 'home' && !canGoBack" class="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e9daf7] bg-white shadow-sm">
            <img :src="brandLogo" alt="MedsGH Logo" class="h-7 w-7 object-contain" />
          </div>
          <button v-else-if="canGoBack" @click="goTo('home')" class="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-[#4F217A]">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div v-if="activeNav === 'home'" class="min-w-0 flex-1">
            <h2 class="truncate text-[1.05rem] font-bold leading-tight tracking-tight text-zinc-900 lg:text-[2rem]">
              {{ headerGreeting }}
            </h2>
            <button
              type="button"
              @click="refreshDeliveryLocation"
              :disabled="isRefreshingLocation"
              class="mt-1 flex min-w-0 w-full items-center gap-2 rounded-full border border-transparent bg-white/0 px-0 py-1 text-left text-[#7a7280] transition-all hover:bg-[#f7f1ff] hover:text-[#4F217A] focus:outline-none focus-visible:border-[#4F217A]/20 focus-visible:bg-[#f7f1ff] focus-visible:text-[#4F217A]"
              :title="headerLocation === 'Set your delivery location' ? 'Set your delivery location' : 'Update delivery location'"
            >
              <span class="material-symbols-outlined shrink-0 text-[14px]" :class="isRefreshingLocation ? 'animate-spin' : ''">
                {{ isRefreshingLocation ? 'sync' : 'location_on' }}
              </span>
              <span class="truncate text-[10px] font-semibold uppercase tracking-[0.1em] lg:text-[11px] lg:tracking-[0.12em]">{{ headerLocation }}</span>
              <span class="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full border border-[#4F217A]/15 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#4F217A] shadow-sm transition-colors">
                <template v-if="isRefreshingLocation">
                  Updating
                  <span class="material-symbols-outlined text-[11px] animate-spin">sync</span>
                </template>
                <template v-else>
                  Update
                  <span class="material-symbols-outlined text-[11px]">chevron_right</span>
                </template>
              </span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:gap-5" :class="activeNav === 'home' ? '' : 'ml-auto'">
          <button class="w-10 h-10 hidden lg:flex items-center justify-center rounded-xl text-[#71717a] hover:bg-[#e8e0e8] transition-colors">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <button class="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group" @click="toggleMenu">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F217A] to-[#381659] text-white flex items-center justify-center text-xs font-black shadow-inner">
              {{ displayUserInitials }}
            </div>
            <span class="text-xs font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors hidden sm:block">Menu</span>
            <span class="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-zinc-600 transition-colors hidden sm:block">expand_more</span>
          </button>
        </div>
      </header>

      <!-- Slot Area -->
      <div :class="activeNav === 'requests' ? '' : 'p-4 lg:p-8'">
        <slot />
      </div>

      <!-- Mobile Bottom Nav -->
      <nav class="lg:hidden fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-xl border border-[#e8dff0] bg-white/92 px-2 py-2 shadow-[0_20px_45px_-25px_rgba(53,0,98,0.4)] backdrop-blur-md pb-safe">
        <button @click="goTo('home')" class="flex flex-col items-center gap-1 p-2" :class="activeNav === 'home' ? 'text-[#4F217A]' : 'text-zinc-500'">
          <div class="w-12 h-8 rounded-xl flex items-center justify-center" :class="activeNav === 'home' ? 'bg-[#efdbff]' : ''">
            <span class="material-symbols-outlined" :style="activeNav === 'home' ? 'font-variation-settings: \'FILL\' 1;' : ''">home</span>
          </div>
          <span class="text-[10px] font-semibold">Home</span>
        </button>
        <button @click="goTo('requests')" class="flex flex-col items-center gap-1 p-2" :class="activeNav === 'requests' ? 'text-[#4F217A]' : 'text-zinc-500'">
           <div class="w-12 h-8 rounded-xl flex items-center justify-center" :class="activeNav === 'requests' ? 'bg-[#efdbff]' : ''">
             <span class="material-symbols-outlined" :style="activeNav === 'requests' ? 'font-variation-settings: \'FILL\' 1;' : ''">description</span>
           </div>
           <span class="text-[10px] font-semibold">Requests</span>
        </button>
        <div class="relative -top-5">
           <button @click="goTo('new')" class="w-14 h-14 primary-gradient text-white rounded-full flex items-center justify-center shadow-[0_18px_34px_-18px_rgba(53,0,98,0.7)] hover:scale-95 transition-transform border-[4px] border-white">
              <span class="material-symbols-outlined">add</span>
           </button>
        </div>
        <button @click="goTo('wallet')" class="flex flex-col items-center gap-1 p-2" :class="activeNav === 'wallet' ? 'text-[#4F217A]' : 'text-zinc-500'">
           <div class="w-12 h-8 rounded-xl flex items-center justify-center" :class="activeNav === 'wallet' ? 'bg-[#efdbff]' : ''">
             <span class="material-symbols-outlined" :style="activeNav === 'wallet' ? 'font-variation-settings: \'FILL\' 1;' : ''">account_balance_wallet</span>
           </div>
           <span class="text-[10px] font-semibold">Wallet</span>
        </button>
        <button @click="showMenu = true" class="flex flex-col items-center gap-1 p-2" :class="['orders','profile','companies'].includes(activeNav) ? 'text-[#4F217A]' : 'text-zinc-500'">
           <div class="w-12 h-8 rounded-xl flex items-center justify-center" :class="['orders','profile','companies'].includes(activeNav) ? 'bg-[#efdbff]' : ''">
             <span class="material-symbols-outlined" :style="['orders','profile','companies'].includes(activeNav) ? 'font-variation-settings: \'FILL\' 1;' : ''">more_horiz</span>
           </div>
           <span class="text-[10px] font-semibold">More</span>
        </button>
      </nav>
    </main>

    <!-- Mobile profile sheet -->
    <Transition name="slide-up">
      <div v-if="showMenu" class="fixed inset-0 bg-black/20 z-[60] flex items-end justify-center backdrop-blur-sm lg:items-center" @click="showMenu = false">
        <div class="bg-white w-full lg:w-96 rounded-t-3xl lg:rounded-[2rem] p-6 pb-safe shadow-2xl relative" @click.stop>
          <div class="w-12 h-1.5 bg-[#e8e0e8] rounded-xl mx-auto mb-6 lg:hidden"></div>
          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 bg-zinc-900 rounded-xl text-white font-semibold flex items-center justify-center text-xl">{{ displayUserInitials }}</div>
            <div>
              <p class="font-semibold text-[#1d1a20] text-lg leading-tight">{{ displayUserName }}</p>
              <p class="text-[#71717a] text-sm">{{ displayUserPhone }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <button @click="showMenu = false; goTo('profile')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <span class="material-symbols-outlined text-[#71717a]">person</span> View Profile
            </button>
            <button @click="showMenu = false; goTo('companies')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <span class="material-symbols-outlined text-[#71717a]">local_pharmacy</span> Linked Pharmacies
            </button>
            <button @click="showMenu = false; goTo('orders')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <span class="material-symbols-outlined text-[#71717a]">receipt_long</span> History
            </button>
            <div class="h-px w-full bg-[#f3ebf3] my-2"></div>
            <button @click="handleLogout" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors text-left font-semibold">
              <span class="material-symbols-outlined">logout</span> Log Out
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <ConfirmDialog
      :is-open="showLogoutConfirm"
      title="Log out?"
      message="You will be returned to the home page and will need to sign in again to continue."
      confirm-text="Log Out"
      cancel-text="Stay Here"
      variant="danger"
      @close="showLogoutConfirm = false"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup>
import { useHead } from '#imports'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import brandLogo from '~/assets/images/rigellogo.png'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'
import { getCompactAddressLines } from '~/utils/addressFormat'

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    }
  ]
})

const userStore = useUserStore()
const route = useRoute()
const showMenu = ref(false)
const showLogoutConfirm = ref(false)
const hasMounted = ref(false)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)

const userName = computed(() => {
  const u = userStore.currentUser
  return u ? `${u.fname || ''} ${u.lname || ''}`.trim() || 'Customer' : 'Customer'
})
const userFirstName = computed(() => {
  const firstName = String(userStore.currentUser?.fname || '').trim()
  return firstName || 'Customer'
})
const userInitials = computed(() => {
  const u = userStore.currentUser
  return u ? `${(u.fname || '')[0] || ''}${(u.lname || '')[0] || ''}`.toUpperCase() || 'C' : 'C'
})
const displayUserName = computed(() => hasMounted.value ? userName.value : 'Customer')
const displayUserFirstName = computed(() => hasMounted.value ? userFirstName.value : 'Customer')
const displayUserInitials = computed(() => hasMounted.value ? userInitials.value : 'C')
const displayUserPhone = computed(() => hasMounted.value ? (userStore.currentUser?.phone || '') : '')
const activeNav = computed(() => route.query.tab || 'home')
const canGoBack = computed(() => route.query.tab && route.query.tab !== 'home' && route.query.tab !== 'new' && route.query.tab !== 'requests')
const greetingLabel = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})
const headerGreeting = computed(() => {
  const compactName = viewportWidth.value < 380 ? displayUserFirstName.value : displayUserName.value
  return `${greetingLabel.value}, ${compactName}`
})
const headerLocation = computed(() => {
  const address = userStore.currentUser?.address || ''
  const compact = getCompactAddressLines(address, { primaryCount: 2 }).primary
  return compact || 'Set your delivery location'
})
const goTo = (tab) => navigateTo({ path: '/customer', query: { tab } })
const isRefreshingLocation = ref(false)
const reverseGeocodeLocation = async (latitude, longitude) => {
  const config = useRuntimeConfig()
  const response = await fetch(`${config.public.apiBase}/api/auth/customer/reverse-geocode?lat=${latitude}&lng=${longitude}`, {
    headers: {
      Authorization: `Bearer ${userStore.customerAuthToken}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.message || 'Failed to look up your address')
  }
  return data.data
}
const refreshDeliveryLocation = async () => {
  if (!navigator.geolocation) return
  if (isRefreshingLocation.value) return

  isRefreshingLocation.value = true

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000
      })
    })

    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    const result = await reverseGeocodeLocation(latitude, longitude)

    await userStore.updateProfile({
      home_address: result.address || null,
      home_latitude: latitude,
      home_longitude: longitude
    })
  } catch (error) {
    console.error('Failed to update delivery location:', error)
  } finally {
    isRefreshingLocation.value = false
  }
}
const toggleMenu = () => { showMenu.value = !showMenu.value }
const handleLogout = () => {
  showMenu.value = false
  showLogoutConfirm.value = true
}
const confirmLogout = async () => {
  try {
    await userStore.logout()
    showLogoutConfirm.value = false
    navigateTo({ path: '/', query: { logged_out: Date.now().toString() } })
  } catch (e) {
    console.error(e)
  }
}

const updateViewportWidth = () => {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  hasMounted.value = true
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.primary-gradient {
  background: linear-gradient(135deg, #4F217A 0%, #520094 100%);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}
.slide-up-enter-from .bg-white,
.slide-up-leave-to .bg-white {
  transform: translateY(100%);
}

:deep(.customer-app .dashboard-top > article) {
  border-radius: 1.9rem;
}

:deep(.customer-app .dashboard-middle > div > .space-y-4 > button),
:deep(.customer-app .dashboard-middle > aside > div:last-child),
:deep(.customer-app .section-wrap > div:last-child > button),
:deep(.customer-app .section-wrap > div:last-child),
:deep(.customer-app .section-wrap > div:nth-child(2)) {
  border-radius: 1.7rem;
}

:deep(.customer-app .dashboard-top h3),
:deep(.customer-app .dashboard-middle h3),
:deep(.customer-app .section-wrap h3) {
  font-weight: 700;
  letter-spacing: -0.02em;
}

:deep(.customer-app .dashboard-top p.text-\[10px\]),
:deep(.customer-app .dashboard-middle button.text-xs),
:deep(.customer-app .section-wrap button.text-xs) {
  font-weight: 600;
  letter-spacing: 0.12em;
}

:deep(.customer-app .dashboard-middle h4),
:deep(.customer-app .section-wrap h4) {
  font-weight: 700;
  letter-spacing: -0.01em;
}

:deep(.customer-app .dashboard-middle strong),
:deep(.customer-app .section-wrap strong) {
  font-weight: 700;
}

:deep(.customer-app .dashboard-middle .inline-flex.rounded-full),
:deep(.customer-app .section-wrap .inline-flex.rounded-full) {
  font-weight: 600;
  letter-spacing: 0.08em;
}
</style>

<style>.dashboard-top { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; display: grid !important; gap: 1.5rem !important; }</style>
