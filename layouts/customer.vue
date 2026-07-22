<template>
  <div class="text-[#1d1a20] antialiased overflow-x-hidden min-h-screen bg-[#f4f4f5]">
    <!-- WCAG 2.4.1 Bypass Blocks: keyboard skip-link, visible on focus -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 h-full hidden lg:flex flex-col p-5 gap-2 bg-white border-r border-zinc-200 w-64 z-50 ">
      <div class="flex items-center gap-3 mb-10 px-2 cursor-pointer" @click="goTo('new')">
        <img src="~/assets/images/rigellogo.png" class="h-10 w-auto object-contain" alt="MedsGH Logo" />
        <div>
          <h1 class="text-[1.7rem] font-semibold text-zinc-900 leading-none tracking-tight">MedsGh</h1>
        </div>
      </div>

      <nav class="flex-1 space-y-2">
        <button @click="goTo('new')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'new' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'" >
          <component :is="activeNav === 'new' ? HomeSolid : HomeOutline" class="w-6 h-6" />
          Home
        </button>
        <button @click="goTo('requests')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'requests' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'requests' ? DocumentSolid : DocumentOutline" class="w-6 h-6" />
          My Requests
          <span v-if="pendingRequestsCount > 0" class="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {{ pendingRequestsCount > 9 ? '9+' : pendingRequestsCount }}
          </span>
        </button>
        <button @click="goTo('wallet')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'wallet' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'wallet' ? WalletSolid : WalletOutline" class="w-6 h-6" />
          Wallet
        </button>
        <button @click="goTo('orders')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'orders' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'orders' ? ReceiptSolid : ReceiptOutline" class="w-6 h-6" />
          History
        </button>
        <button @click="goTo('companies')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'companies' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'companies' ? PharmacySolid : PharmacyOutline" class="w-6 h-6" />
          Pharmacies
        </button>
        <button @click="goTo('profile')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'profile' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'profile' ? UserSolid : UserOutline" class="w-6 h-6" />
          Profile
        </button>
        <button v-if="isProfessionalApproved" @click="goTo('stock')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'stock' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'stock' ? BeakerSolid : BeakerOutline" class="w-6 h-6" />
          Browse Stock
        </button>
        <button @click="goTo('clearance')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium text-sm text-left" :class="activeNav === 'clearance' ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200' : 'text-[#5d5564] hover:bg-zinc-50'">
          <component :is="activeNav === 'clearance' ? TagSolid : TagOutline" class="w-6 h-6" />
          Clearance Deals
        </button>
      </nav>

      <div class="mt-auto pt-6 border-t border-[#ede3f2]">
        <button @click="goTo('new')" class="w-full primary-gradient text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-[0_15px_30px_-15px_rgba(53,0,98,0.5)] hover:scale-[0.98] transition-transform">
          <PlusIcon class="w-5 h-5" />
          New Request
        </button>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-4 mt-4 text-[#5d5564] hover:text-[#ba1a1a] transition-colors font-medium text-sm rounded-xl hover:bg-red-50">
          <ArrowRightOnRectangleIcon class="w-6 h-6" />
          Logout
        </button>
      </div>
    </aside>

    <main id="main-content" tabindex="-1" class="lg:ml-64 min-h-screen bg-gradient-to-br from-[#e8dff5] to-[#ddd5ef] pb-28 lg:pb-0">
      <!-- TopAppBar: hidden on concierge new-request and list views -->
      <header
        v-if="activeNav !== 'new' && activeNav !== 'requests' && activeNav !== 'wallet' && activeNav !== 'orders'"
        class="sticky top-0 z-40 bg-[#f4f4f5]/92 backdrop-blur-md px-4 lg:px-8 flex justify-between items-center border-b border-zinc-200"
        :class="activeNav === 'new' ? 'py-5 lg:py-6' : 'py-3.5 lg:py-4'"
      >
        <div v-if="activeNav === 'new' || canGoBack" class="flex min-w-0 flex-1 items-center gap-2.5 lg:gap-3">
          <div v-if="activeNav === 'new' && !canGoBack" class="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e9daf7] bg-white shadow-sm">
            <img :src="brandLogo" alt="MedsGH Logo" class="h-7 w-7 object-contain" />
          </div>
          <button v-else-if="canGoBack" @click="goTo('new')" aria-label="Back to home" class="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-[#4F217A]">
            <ArrowLeftIcon class="w-6 h-6" />
          </button>

          <div v-if="activeNav === 'new'" class="min-w-0 flex-1">
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
              <component :is="isRefreshingLocation ? ArrowPathIcon : MapPinIcon" class="w-3.5 h-3.5 shrink-0" :class="isRefreshingLocation ? 'animate-spin' : ''" />
              <span class="truncate text-xs font-semibold uppercase tracking-[0.08em] lg:text-[12px] lg:tracking-[0.1em]">{{ headerLocation }}</span>
              <span class="ml-auto shrink-0 hidden sm:inline-flex items-center gap-1 rounded-full border border-[#4F217A]/15 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#4F217A] shadow-sm transition-colors">
                <template v-if="isRefreshingLocation">
                  Updating
                  <ArrowPathIcon class="w-3 h-3 animate-spin" />
                </template>
                <template v-else>
                  Update
                  <ChevronRightIcon class="w-3 h-3" />
                </template>
              </span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:gap-5" :class="activeNav === 'new' ? '' : 'ml-auto'">
          <button aria-label="Notifications" class="relative w-10 h-10 hidden lg:flex items-center justify-center rounded-xl text-[#71717a] hover:bg-[#e8e0e8] transition-colors">
            <BellIcon class="w-6 h-6" />
            <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none">
              {{ notificationCount > 99 ? '99+' : notificationCount }}
            </span>
          </button>
          <button class="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group" @click="toggleMenu">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F217A] to-[#381659] text-white flex items-center justify-center text-xs font-black shadow-inner">
              {{ displayUserInitials }}
            </div>
            <span class="text-xs font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors hidden sm:block">Menu</span>
            <ChevronDownIcon class="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors hidden sm:block" />
          </button>
        </div>
      </header>

      <!-- Slot Area -->
      <div :class="(activeNav === 'requests' || activeNav === 'wallet') ? '' : 'p-4 lg:p-8'">
        <slot />
      </div>

      <!-- Mobile Bottom Nav -->
      <nav class="lg:hidden fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-2xl border border-white/50 bg-white/30 px-1 py-1.5 shadow-[0_8px_32px_-8px_rgba(53,0,98,0.22)] backdrop-blur-md pb-safe">
        <button @click="goTo('new')" :aria-label="'Home'" :aria-current="activeNav === 'new' ? 'page' : undefined" class="relative flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200" :class="activeNav === 'new' ? 'text-[#4F217A]' : 'text-zinc-400'">
          <div class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200" :class="activeNav === 'new' ? 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] scale-110 shadow-[0_2px_8px_-2px_rgba(79,33,122,0.25)]' : ''">
            <component :is="activeNav === 'new' ? HomeSolid : HomeOutline" class="w-5 h-5 transition-transform duration-200" :class="activeNav === 'new' ? 'scale-110' : ''" />
          </div>
          <span class="overflow-hidden transition-all duration-200 text-[10px] font-bold leading-none" :class="activeNav === 'new' ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'">Home</span>
        </button>
        <button @click="goTo('requests')" :aria-label="'My requests'" :aria-current="activeNav === 'requests' ? 'page' : undefined" class="relative flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200" :class="activeNav === 'requests' ? 'text-[#4F217A]' : 'text-zinc-400'">
          <div class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200" :class="activeNav === 'requests' ? 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] scale-110 shadow-[0_2px_8px_-2px_rgba(79,33,122,0.25)]' : ''">
            <component :is="activeNav === 'requests' ? DocumentSolid : DocumentOutline" class="w-5 h-5 transition-transform duration-200" :class="activeNav === 'requests' ? 'scale-110' : ''" />
            <span v-if="pendingRequestsCount > 0" class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none pointer-events-none ring-2 ring-white">
              {{ pendingRequestsCount > 9 ? '9+' : pendingRequestsCount }}
            </span>
          </div>
          <span class="overflow-hidden transition-all duration-200 text-[10px] font-bold leading-none" :class="activeNav === 'requests' ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'">Requests</span>
        </button>
        <button @click="goTo('wallet')" :aria-label="'Wallet'" :aria-current="activeNav === 'wallet' ? 'page' : undefined" class="relative flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200" :class="activeNav === 'wallet' ? 'text-[#4F217A]' : 'text-zinc-400'">
          <div class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200" :class="activeNav === 'wallet' ? 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] scale-110 shadow-[0_2px_8px_-2px_rgba(79,33,122,0.25)]' : ''">
            <component :is="activeNav === 'wallet' ? WalletSolid : WalletOutline" class="w-5 h-5 transition-transform duration-200" :class="activeNav === 'wallet' ? 'scale-110' : ''" />
          </div>
          <span class="overflow-hidden transition-all duration-200 text-[10px] font-bold leading-none" :class="activeNav === 'wallet' ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'">Wallet</span>
        </button>
        <button @click="goTo('profile')" :aria-label="'Profile'" :aria-current="activeNav === 'profile' ? 'page' : undefined" class="relative flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200" :class="activeNav === 'profile' ? 'text-[#4F217A]' : 'text-zinc-400'">
          <div class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200" :class="activeNav === 'profile' ? 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] scale-110 shadow-[0_2px_8px_-2px_rgba(79,33,122,0.25)]' : ''">
            <component :is="activeNav === 'profile' ? UserSolid : UserOutline" class="w-5 h-5 transition-transform duration-200" :class="activeNav === 'profile' ? 'scale-110' : ''" />
          </div>
          <span class="overflow-hidden transition-all duration-200 text-[10px] font-bold leading-none" :class="activeNav === 'profile' ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'">Profile</span>
        </button>
        <button @click="goTo('clearance')" :aria-label="'Clearance deals'" :aria-current="activeNav === 'clearance' ? 'page' : undefined" class="relative flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200" :class="activeNav === 'clearance' ? 'text-[#4F217A]' : 'text-zinc-400'">
          <div class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200" :class="activeNav === 'clearance' ? 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] scale-110 shadow-[0_2px_8px_-2px_rgba(79,33,122,0.25)]' : ''">
            <component :is="activeNav === 'clearance' ? TagSolid : TagOutline" class="w-5 h-5 transition-transform duration-200" :class="activeNav === 'clearance' ? 'scale-110' : ''" />
          </div>
          <span class="overflow-hidden transition-all duration-200 text-[10px] font-bold leading-none" :class="activeNav === 'clearance' ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'">Deals</span>
        </button>
        <button @click="toggleMenu()" :aria-label="'More options'" :aria-expanded="showMenu" class="relative flex flex-col items-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] rounded-xl transition-colors duration-200" :class="isMoreActive ? 'text-[#4F217A]' : 'text-zinc-400'">
          <div class="relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200" :class="isMoreActive ? 'bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] scale-110 shadow-[0_2px_8px_-2px_rgba(79,33,122,0.25)]' : ''">
            <component :is="isMoreActive ? MoreSolid : MoreOutline" class="w-5 h-5 transition-transform duration-200" :class="isMoreActive ? 'scale-110' : ''" />
          </div>
          <span class="overflow-hidden transition-all duration-200 text-[10px] font-bold leading-none" :class="isMoreActive ? 'max-h-4 opacity-100 mt-0.5' : 'max-h-0 opacity-0'">More</span>
        </button>
      </nav>
    </main>

    <!-- Mobile profile sheet -->
    <Transition name="slide-up">
      <div v-if="showMenu" class="fixed inset-0 bg-black/20 z-[60] flex items-end justify-center backdrop-blur-sm lg:items-center" @click="showMenu = false">
        <div class="bg-white w-full lg:w-96 rounded-t-3xl lg:rounded-[2rem] p-6 pb-safe shadow-2xl relative" @click.stop>
          <div class="w-12 h-1.5 bg-[#e8e0e8] rounded-xl mx-auto mb-6 lg:hidden"></div>
          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 primary-gradient rounded-xl text-white font-semibold flex items-center justify-center text-xl shadow-inner">{{ displayUserInitials }}</div>
            <div>
              <p class="font-semibold text-[#1d1a20] text-lg leading-tight">{{ displayUserName }}</p>
              <p class="text-[#71717a] text-sm">{{ displayUserPhone }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <button @click="showMenu = false; goTo('profile')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <UserOutline class="w-6 h-6 text-[#71717a]" /> View Profile
            </button>
            <button @click="showMenu = false; goTo('companies')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <PharmacyOutline class="w-6 h-6 text-[#71717a]" /> Linked Pharmacies
            </button>
            <button @click="showMenu = false; goTo('orders')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <ReceiptOutline class="w-6 h-6 text-[#71717a]" /> History
            </button>
            <button v-if="isProfessionalApproved" @click="showMenu = false; goTo('stock')" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white border-r border-zinc-200 transition-colors text-left text-[#1d1a20] font-medium">
              <BeakerOutline class="w-6 h-6 text-[#71717a]" /> Browse Stock
            </button>
            <div class="h-px w-full bg-[#f3ebf3] my-2"></div>
            <button @click="handleLogout" class="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors text-left font-semibold">
              <ArrowRightOnRectangleIcon class="w-6 h-6" /> Log Out
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

    <!-- Layout toast -->
    <div v-if="toast"
      role="status"
      aria-live="polite"
      class="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold"
      :class="toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'">
      <component :is="toast.type === 'error' ? ErrorIcon : CheckIcon" class="w-5 h-5" />
      {{ toast.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import brandLogo from '~/assets/images/rigellogo.png'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'
import { getCompactAddressLines } from '~/utils/addressFormat'
import { useOrderStatus } from '~/composables/useOrderStatus'
import {
  HomeIcon as HomeOutline,
  DocumentTextIcon as DocumentOutline,
  WalletIcon as WalletOutline,
  ClipboardDocumentListIcon as ReceiptOutline,
  BuildingStorefrontIcon as PharmacyOutline,
  UserIcon as UserOutline,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  BellIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  MapPinIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon as MoreOutline,
  ExclamationCircleIcon as ErrorIcon,
  CheckCircleIcon as CheckIcon,
  BeakerIcon as BeakerOutline,
  TagIcon as TagOutline,
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeSolid,
  DocumentTextIcon as DocumentSolid,
  WalletIcon as WalletSolid,
  ClipboardDocumentListIcon as ReceiptSolid,
  BuildingStorefrontIcon as PharmacySolid,
  UserIcon as UserSolid,
  EllipsisHorizontalIcon as MoreSolid,
  BeakerIcon as BeakerSolid,
  TagIcon as TagSolid,
} from '@heroicons/vue/24/solid'

const userStore = useUserStore()
const route = useRoute()
const { isActiveRequestStatus, getRequestStage } = useOrderStatus()
const notificationCount = ref(0)
const pendingRequestsCount = ref(0)
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
const activeNav = computed(() => route.query.tab || 'new')
const isMoreActive = computed(() => showMenu.value || ['orders', 'companies', 'stock'].includes(activeNav.value))
const canGoBack = computed(() => route.query.tab && route.query.tab !== 'new' && route.query.tab !== 'requests')
const isProfessionalApproved = computed(() => userStore.masterCustomer?.professional_status === 'approved')
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
const toast = ref(null)
let toastTimer = null
const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 4000)
}

const geolocationErrorMessage = (error) => {
  if (!error) return "Couldn't update your location. Try again."
  if (error.code === 1) return 'Allow location access to update your delivery address.'
  if (error.code === 2) return 'Location unavailable. Check your GPS or network.'
  if (error.code === 3) return 'Location lookup timed out. Try again.'
  return error.message || "Couldn't update your location. Try again."
}

const refreshDeliveryLocation = async () => {
  if (!navigator.geolocation) {
    showToast('Location is not supported on this device.', 'error')
    return
  }
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
    showToast('Delivery location updated')
  } catch (error) {
    console.error('Failed to update delivery location:', error)
    showToast(geolocationErrorMessage(error), 'error')
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

const loadNotificationCount = async () => {
  if (!userStore.customerAuthToken) return
  try {
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBase}/api/order-requests/customer`, {
      headers: { Authorization: `Bearer ${userStore.customerAuthToken}` }
    })
    const json = await response.json()
    const requests = json.data || []
    notificationCount.value = requests.filter((r) => isActiveRequestStatus(r.status)).length
    pendingRequestsCount.value = requests.filter((r) => getRequestStage(r.status) === 'awaiting_payment').length
  } catch (_) {}
}

let countInterval = null

onMounted(() => {
  hasMounted.value = true
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
  loadNotificationCount()
  countInterval = setInterval(loadNotificationCount, 60_000)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportWidth)
  if (toastTimer) clearTimeout(toastTimer)
  if (countInterval) clearInterval(countInterval)
})
</script>

<style scoped>
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
