<template>
  <div class="min-h-screen overflow-x-hidden bg-white font-body text-ink-900 antialiased">
    <!-- WCAG 2.4.1 Bypass Blocks: keyboard skip-link, visible on focus -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Side navigation (large screens) -->
    <aside class="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col gap-2 border-r border-ink-200 bg-white p-5 lg:flex">
      <button type="button" class="mb-8 flex min-h-[44px] items-center gap-3 px-2 text-left" aria-label="MedsGH home" @click="goTo('new')">
        <img src="~/assets/images/rigellogo.png" class="h-10 w-auto object-contain" alt="" />
        <span class="font-display text-2xl font-bold tracking-tight text-ink-900">MedsGh</span>
      </button>

      <nav class="flex-1 space-y-1" aria-label="Main">
        <button
          v-for="item in sideItems"
          :key="item.tab"
          type="button"
          :aria-current="activeNav === item.tab ? 'page' : undefined"
          class="flex min-h-[44px] w-full items-center gap-3 rounded-full px-4 py-3 text-left text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          :class="activeNav === item.tab ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'"
          @click="goTo(item.tab)"
        >
          <component :is="activeNav === item.tab ? item.solid : item.outline" class="h-6 w-6" aria-hidden="true" />
          {{ item.label }}
          <span v-if="item.tab === 'requests' && pendingRequestsCount > 0" class="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-bold leading-none text-white">
            {{ pendingRequestsCount > 9 ? '9+' : pendingRequestsCount }}
          </span>
        </button>
      </nav>

      <div class="mt-auto border-t border-ink-200 pt-6">
        <button type="button" class="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-700 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2" @click="goTo('new')">
          <PlusIcon class="h-5 w-5" aria-hidden="true" />
          New Request
        </button>
        <button type="button" class="mt-3 flex min-h-[44px] w-full items-center gap-3 rounded-full px-4 py-3 text-base font-semibold text-ink-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700" @click="handleLogout">
          <ArrowRightOnRectangleIcon class="h-6 w-6" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>

    <main id="main-content" tabindex="-1" class="min-h-screen bg-white pb-28 lg:ml-64 lg:pb-0">
      <div :class="(activeNav === 'requests' || activeNav === 'wallet') ? '' : (activeNav === 'clearance' ? 'p-4 lg:px-8 lg:pb-8 lg:pt-0' : 'p-4 lg:p-8')">
        <slot />
      </div>

      <!-- Mobile bottom bar -->
      <nav aria-label="Main" class="pb-safe fixed inset-x-2 bottom-3 z-50 mx-auto flex max-w-md items-center justify-around rounded-3xl bg-white px-1 py-1.5 shadow-lift ring-1 ring-ink-200 lg:hidden">
        <button
          v-for="item in barItems"
          :key="item.tab"
          type="button"
          :aria-label="item.ariaLabel"
          :aria-current="activeNav === item.tab ? 'page' : undefined"
          class="relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          :class="activeNav === item.tab ? 'text-brand-700' : 'text-ink-600'"
          @click="goTo(item.tab)"
        >
          <span class="relative flex h-8 w-12 items-center justify-center rounded-full" :class="activeNav === item.tab ? 'bg-brand-50' : ''">
            <component :is="activeNav === item.tab ? item.solid : item.outline" class="h-6 w-6" aria-hidden="true" />
            <span v-if="item.tab === 'requests' && pendingRequestsCount > 0" class="pointer-events-none absolute -right-0.5 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-700 px-1 text-xs font-bold leading-none text-white ring-2 ring-white">
              {{ pendingRequestsCount > 9 ? '9+' : pendingRequestsCount }}
            </span>
          </span>
          <span class="text-xs font-semibold leading-none">{{ item.short }}</span>
        </button>
        <button
          type="button"
          aria-label="More options"
          :aria-expanded="showMenu"
          class="relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          :class="isMoreActive ? 'text-brand-700' : 'text-ink-600'"
          @click="toggleMenu()"
        >
          <span class="flex h-8 w-12 items-center justify-center rounded-full" :class="isMoreActive ? 'bg-brand-50' : ''">
            <component :is="isMoreActive ? MoreSolid : MoreOutline" class="h-6 w-6" aria-hidden="true" />
          </span>
          <span class="text-xs font-semibold leading-none">More</span>
        </button>
      </nav>
    </main>

    <!-- Account menu sheet -->
    <Transition name="slide-up">
      <div v-if="showMenu" class="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/40 lg:items-center" @click="showMenu = false">
        <div ref="menuRef" role="dialog" aria-modal="true" aria-labelledby="account-menu-title" class="pb-safe relative w-full rounded-t-3xl bg-white p-6 shadow-lift lg:w-96 lg:rounded-3xl" @click.stop>
          <div class="mx-auto mb-6 h-1.5 w-12 rounded-full bg-ink-200 lg:hidden" aria-hidden="true"></div>
          <div class="mb-6 flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 font-display text-xl font-bold text-white" aria-hidden="true">{{ displayUserInitials }}</div>
            <div class="min-w-0">
              <p id="account-menu-title" class="truncate font-display text-lg font-bold leading-tight text-ink-900">{{ displayUserName }}</p>
              <p class="truncate text-base text-ink-600">{{ displayUserPhone }}</p>
            </div>
          </div>
          <div class="space-y-1">
            <button type="button" class="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-semibold text-ink-900 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700" @click="showMenu = false; goTo('profile')">
              <UserOutline class="h-6 w-6 text-ink-600" aria-hidden="true" /> View Profile
            </button>
            <button type="button" class="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-semibold text-ink-900 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700" @click="showMenu = false; goTo('companies')">
              <PharmacyOutline class="h-6 w-6 text-ink-600" aria-hidden="true" /> Linked Pharmacies
            </button>
            <button type="button" class="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-semibold text-ink-900 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700" @click="showMenu = false; goTo('orders')">
              <ReceiptOutline class="h-6 w-6 text-ink-600" aria-hidden="true" /> History
            </button>
            <button v-if="isProfessionalApproved" type="button" class="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-semibold text-ink-900 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700" @click="showMenu = false; goTo('stock')">
              <BeakerOutline class="h-6 w-6 text-ink-600" aria-hidden="true" /> Browse Stock
            </button>
            <div class="my-2 h-px w-full bg-ink-200" role="presentation"></div>
            <button type="button" class="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700" @click="handleLogout">
              <ArrowRightOnRectangleIcon class="h-6 w-6" aria-hidden="true" /> Log Out
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
    <div
      v-if="toast"
      :role="toast.type === 'error' ? 'alert' : 'status'"
      class="fixed bottom-24 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3 text-base font-semibold text-white shadow-lift lg:bottom-6"
      :class="toast.type === 'error' ? 'bg-red-700' : 'bg-ink-900'"
    >
      <component :is="toast.type === 'error' ? ErrorIcon : CheckIcon" class="h-5 w-5" aria-hidden="true" />
      {{ toast.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useModalA11y } from '~/composables/useModalA11y'
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
const menuRef = ref(null)
useModalA11y(menuRef, () => showMenu.value, () => { showMenu.value = false })
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
const displayUserPhone = computed(() => hasMounted.value ? (userStore.currentUser?.phone || userStore.currentUser?.email || '') : '')
const activeNav = computed(() => route.query.tab || 'new')
const isMoreActive = computed(() => showMenu.value || ['orders', 'companies', 'stock', 'profile'].includes(activeNav.value))
const isProfessionalApproved = computed(() => userStore.masterCustomer?.professional_status === 'approved')
const sideItems = computed(() => [
  { tab: 'new', label: 'Home', outline: HomeOutline, solid: HomeSolid },
  { tab: 'requests', label: 'My Requests', outline: DocumentOutline, solid: DocumentSolid },
  { tab: 'wallet', label: 'Wallet', outline: WalletOutline, solid: WalletSolid },
  { tab: 'orders', label: 'History', outline: ReceiptOutline, solid: ReceiptSolid },
  { tab: 'companies', label: 'Pharmacies', outline: PharmacyOutline, solid: PharmacySolid },
  { tab: 'profile', label: 'Profile', outline: UserOutline, solid: UserSolid },
  ...(isProfessionalApproved.value ? [{ tab: 'stock', label: 'Browse Stock', outline: BeakerOutline, solid: BeakerSolid }] : []),
  { tab: 'clearance', label: 'Clearance Deals', outline: TagOutline, solid: TagSolid },
])
const barItems = [
  { tab: 'new', ariaLabel: 'Home', short: 'Home', outline: HomeOutline, solid: HomeSolid },
  { tab: 'requests', ariaLabel: 'My requests', short: 'Requests', outline: DocumentOutline, solid: DocumentSolid },
  { tab: 'wallet', ariaLabel: 'Wallet', short: 'Wallet', outline: WalletOutline, solid: WalletSolid },
  { tab: 'clearance', ariaLabel: 'Clearance deals', short: 'Deals', outline: TagOutline, solid: TagSolid },
]
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
