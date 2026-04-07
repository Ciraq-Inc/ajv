<template>
  <div class="text-[#1d1a20] antialiased overflow-x-hidden min-h-screen bg-[#f4f4f5]">
    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 h-full hidden lg:flex flex-col p-5 gap-2 bg-white border-r border-zinc-200 w-64 z-50 ">
      <div class="flex items-center gap-3 mb-10 px-2 cursor-pointer" @click="goTo('home')">
        <img src="~/assets/images/rigellogo.png" class="h-10 w-auto object-contain" alt="MedsGH Logo" />
        <div>
          <h1 class="text-[1.7rem] font-semibold text-zinc-900 leading-none tracking-tight">MedsGh</h1>
          <p class="text-[10px] uppercase tracking-[0.18em] text-[#71717a] font-medium opacity-60">Clinical Sanctuary</p>
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

    <main class="lg:ml-64 min-h-screen bg-[#f4f4f5] pb-28 lg:pb-0">
      <!-- TopAppBar: hidden on concierge new-request and list views -->
      <header
        v-if="activeNav !== 'new' && activeNav !== 'requests'"
        class="sticky top-0 z-40 bg-[#f4f4f5]/92 backdrop-blur-md px-4 lg:px-8 flex justify-between items-center border-b border-zinc-200"
        :class="activeNav === 'home' ? 'py-5 lg:py-6' : 'py-3.5 lg:py-4'"
      >
        <div v-if="activeNav === 'home' || canGoBack" class="flex items-center gap-3">
          <div v-if="activeNav === 'home' && !canGoBack" class="lg:hidden w-10 h-10 primary-gradient rounded-xl flex items-center justify-center text-white">
            <span class="material-symbols-outlined">medical_services</span>
          </div>
          <button v-else-if="canGoBack" @click="goTo('home')" class="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-[#4F217A]">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div v-if="activeNav === 'home'">
            <h2 class="text-xl lg:text-[2rem] font-bold text-zinc-900 tracking-tight leading-tight">
              {{ `Good morning, ${displayUserName}` }}
            </h2>
            <div class="mt-1 flex items-center gap-1.5 text-[#7a7280]">
              <span class="material-symbols-outlined text-[15px]">location_on</span>
              <span class="text-[11px] font-semibold uppercase tracking-[0.12em]">{{ headerLocation }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:gap-5" :class="activeNav === 'home' ? '' : 'ml-auto'">
          <button class="w-10 h-10 hidden lg:flex items-center justify-center rounded-xl text-[#71717a] hover:bg-[#e8e0e8] transition-colors">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <div class="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#efdbff] bg-[#f08a5d] text-[#4F217A] flex items-center justify-center font-semibold cursor-pointer" @click="toggleMenu">
            {{ displayUserInitials }}
          </div>
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
import { ref, computed, onMounted } from 'vue'
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

const userName = computed(() => {
  const u = userStore.currentUser
  return u ? `${u.fname || ''} ${u.lname || ''}`.trim() || 'Customer' : 'Customer'
})
const userInitials = computed(() => {
  const u = userStore.currentUser
  return u ? `${(u.fname || '')[0] || ''}${(u.lname || '')[0] || ''}`.toUpperCase() || 'C' : 'C'
})
const displayUserName = computed(() => hasMounted.value ? userName.value : 'Customer')
const displayUserInitials = computed(() => hasMounted.value ? userInitials.value : 'C')
const displayUserPhone = computed(() => hasMounted.value ? (userStore.currentUser?.phone || '') : '')
const activeNav = computed(() => route.query.tab || 'home')
const canGoBack = computed(() => route.query.tab && route.query.tab !== 'home' && route.query.tab !== 'new' && route.query.tab !== 'requests')
const headerLocation = computed(() => {
  const address = userStore.currentUser?.address || ''
  const compact = getCompactAddressLines(address, { primaryCount: 2 }).primary
  return compact || 'Set your delivery location'
})
const goTo = (tab) => navigateTo({ path: '/customer', query: { tab } })
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

onMounted(() => {
  hasMounted.value = true
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
