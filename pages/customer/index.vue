<template>
  <div class="customer-app">
    <div v-if="isCheckingAuth" class="auth-loading">
      <div class="pulse-ring"></div>
      <p>Loading...</p>
    </div>

    <template v-else>
      <div v-if="currentTab === 'home'" class="space-y-8">
        <section class="dashboard-top">
          <article class="col-span-12 lg:col-span-6 rounded-2xl p-6 text-zinc-900 sm:p-8 bg-white border border-zinc-200 shadow-sm h-full lg:px-10 flex flex-col justify-center relative overflow-hidden">
            <p class="text-[11px] font-bold uppercase tracking-[0.24em] text-[#5d4679]">Operations Center</p>

            <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center">
              <div class="flex items-center gap-5">
                <h3 class="text-5xl font-bold leading-none tracking-tight text-[#4F217A] sm:text-6xl">{{ activeRequestCount }}</h3>
                <div class="border-l border-zinc-200 pl-5">
                  <p class="text-lg font-medium leading-tight text-zinc-600">Active</p>
                  <p class="text-[1.4rem] font-semibold leading-tight text-zinc-800">Requests</p>
                </div>
              </div>
            </div>
            <p class="mt-5 max-w-xl text-sm font-medium leading-6 text-zinc-600">Track request progress, review updates, and move into payment or fulfillment from one workspace.</p>
          </article>

          <article
            class="col-span-12 sm:col-span-6 lg:col-span-3 flex h-full cursor-pointer flex-col justify-between rounded-xl border border-zinc-200 bg-white/95 p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            @click="goTab('wallet')"
          >
            <div class="space-y-4">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5d4679]">Available Credits</p>
                <h3 class="mt-2 text-[2rem] font-semibold tracking-tight text-zinc-900">GHS {{ walletBalance.toFixed(2) }}</h3>
              </div>
              <p class="text-sm font-medium leading-6 text-zinc-600">Top up, review wallet movement, and keep request payments ready.</p>
            </div>

            <div class="mt-6 flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ecfb] text-[#5e3a86]">
                <span class="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <button class="inline-flex items-center gap-1 rounded-full border border-[#dfd3ea] bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors">
                Top up
                <span class="material-symbols-outlined text-base">add</span>
              </button>
            </div>
          </article>

          <article class="col-span-12 sm:col-span-6 lg:col-span-3 flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white/95 p-6 shadow-sm">
            <div class="space-y-3">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5d4679]">Delivery Location</p>
              <div class="flex items-start gap-3">
                <div class="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ecfb] text-[#5e3a86]">
                  <span class="material-symbols-outlined">location_on</span>
                </div>
                <div class="min-w-0">
                  <h3 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ dashboardLocation }}</h3>
                  <p class="mt-1 text-sm font-medium leading-6 text-zinc-600">{{ dashboardLocationHint }}</p>
                </div>
              </div>
            </div>

            <div class="mt-6 space-y-2">
              <button
                @click="refreshDashboardLocation"
                :disabled="isUpdatingLocation"
                class="inline-flex items-center gap-2 rounded-full border border-[#dfd3ea] bg-white px-4 py-2 text-xs font-bold text-zinc-700 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span class="material-symbols-outlined text-base" :class="{ 'spin-icon': isUpdatingLocation }">refresh</span>
                Update location
              </button>
              <p v-if="locationUpdateMessage" class="text-xs font-medium" :class="locationUpdateState === 'error' ? 'text-[#c03a3a]' : 'text-zinc-600'">
                {{ locationUpdateMessage }}
              </p>
            </div>
          </article>
        </section>

        <div class="dashboard-middle">
          <div class="space-y-5">
            <div class="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A]">Activity Stream</h3>
                <p class="text-sm font-medium text-zinc-600">Tracking your latest clinical procurement</p>
              </div>
              <button class="inline-flex items-center gap-1 text-xs font-black text-zinc-600 hover:text-zinc-900 transition-colors" @click="goTab('requests')">
                Full History
                <span class="material-symbols-outlined text-base">arrow_outward</span>
              </button>
            </div>

            <div v-if="recentRequestItems.length === 0" class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors">
                <span class="material-symbols-outlined">description</span>
              </div>
              <div>
                <p class="font-black text-zinc-800">No requests yet</p>
                <p class="text-sm font-medium text-zinc-600">Your latest request activity will appear here.</p>
              </div>
            </div>

            <div v-else class="space-y-4">
              <button
                v-for="request in recentRequestItems"
                :key="request.id"
                class="flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-5 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-18px_rgba(86,42,134,0.18)] sm:px-6"
                @click="goTab('requests')"
              >
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  :class="request.status === 'paid' || request.status === 'verified' ? 'bg-[#e7f7ea] text-[#228847]' : request.status === 'processing' || request.status === 'confirming_with_pharm' ? 'bg-[#f4e8fb] text-zinc-600 hover:text-zinc-900 transition-colors' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors'"
                >
                  <span class="material-symbols-outlined">{{ requestIcon(request) }}</span>
                </div>

                <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="min-w-0">
                    <h4 class="truncate text-xl font-black tracking-[-0.05em] text-zinc-800">REQ-{{ request.request_number || shortId(String(request.id || '')) }}</h4>
                    <p class="truncate text-sm font-medium text-zinc-500">{{ formatDate(request.updated_at || request.created_at) }} • {{ requestMeta(request) }}</p>
                  </div>

                  <div class="flex flex-col items-start gap-2 sm:items-end">
                    <strong class="text-2xl font-black tracking-[-0.05em] text-zinc-800">GHS {{ formatMoney(getRequestAmount(request)) }}</strong>
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                      :class="getRequestStatusClass(request.status)"
                    >
                      {{ getRequestStatusLabel(request.status) }}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <aside class="space-y-5">
            <div class="px-1">
              <h3 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A]">Ongoing Orders</h3>
              <p class="text-sm font-medium text-zinc-600">Currently in delivery pipeline</p>
            </div>

            <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div v-if="ongoingOrderItems.length === 0" class="flex items-center gap-4 px-6 py-5">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors">
                  <span class="material-symbols-outlined">package_2</span>
                </div>
                <div>
                  <p class="font-black text-zinc-800">No active orders</p>
              <p class="text-sm font-medium text-zinc-600">Orders in progress will show here.</p>
                </div>
              </div>

              <div v-else>
                <button
                  v-for="order in ongoingOrderItems"
                  :key="order.order_id"
                  class="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-[#fcf8fe] sm:px-6"
                  :class="{ 'border-t border-[#f1ebf4]': ongoingOrderItems.indexOf(order) > 0 }"
                  @click="goTab('orders')"
                >
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors">
                    <span class="material-symbols-outlined">package_2</span>
                  </div>

                  <div class="min-w-0 flex-1 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div class="min-w-0">
                      <h4 class="truncate text-base font-black tracking-[-0.04em] text-zinc-800">#{{ shortOrderId(order.order_id) }}</h4>
                      <p class="mt-1 truncate text-xs font-medium text-zinc-600">{{ getOrderSummary(order) }}</p>
                    </div>
                    <div class="flex flex-col items-start gap-2 sm:items-end">
                      <strong class="text-sm font-black text-zinc-800">GHS {{ formatMoney(order.total_amount) }}</strong>
                      <span
                        class="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                        :class="getOrderStatusClass(order.status)"
                      >
                        {{ getOrderStatusLabel(order.status) }}
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              <div class="border-t border-[#f1ebf4] px-5 py-4 text-center sm:px-6">
                <button class="text-xs font-black text-zinc-600 hover:text-zinc-900 transition-colors" @click="goTab('orders')">View All Orders</button>
              </div>
            </div>
          </aside>
          </div>

        <section class="section-wrap space-y-5">
          <div class="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A]">Verified Partners</h3>
              <p class="text-sm font-medium text-zinc-600">Top rated pharmacies in your network</p>
            </div>
            <button class="inline-flex items-center gap-1 text-xs font-black text-zinc-600 hover:text-zinc-900 transition-colors" @click="goTab('companies')">
              Directory
              <span class="material-symbols-outlined text-base">arrow_outward</span>
            </button>
          </div>

          <div v-if="verifiedPartners.length === 0" class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors">
              <span class="material-symbols-outlined">local_pharmacy</span>
            </div>
            <div>
              <p class="font-black text-zinc-800">No pharmacies linked yet</p>
              <p class="text-sm font-medium text-zinc-600">Your verified pharmacy network will appear here.</p>
            </div>
          </div>

          <div v-else class="partners-grid">
            <button
              v-for="company in verifiedPartners"
              :key="company.id"
              class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-5 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-18px_rgba(86,42,134,0.18)] sm:px-6"
              @click="goTab('companies')"
            >
              <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors">
                <span class="material-symbols-outlined text-[28px]">local_pharmacy</span>
              </div>

              <div class="min-w-0 flex-1">
                <h4 class="truncate text-2xl font-black tracking-[-0.05em] text-zinc-800">{{ company.company_name || company.name }}</h4>
                <div class="mt-1 flex items-center gap-1 text-xs font-bold text-zinc-500">
                  <span class="material-symbols-outlined text-sm ![font-variation-settings:'FILL'_1] text-[#f5b622]">star</span>
                  <span class="truncate">{{ getCompanyMeta(company) }}</span>
                </div>
              </div>

              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 group-hover:text-zinc-600">
                <span class="material-symbols-outlined text-base">arrow_outward</span>
              </div>
            </button>
          </div>
        </section>
      </div>

      <div v-if="currentTab === 'new'" class="page-view">
        <OrderRequests default-sub-tab="new" />
      </div>

      <div v-if="currentTab === 'requests'" class="page-view">
        <OrderRequests default-sub-tab="list" :initial-request-id="requestIdFromQuery" />
      </div>

      <div v-if="currentTab === 'wallet'" class="page-view">
        <Wallet />
      </div>

      <div v-if="currentTab === 'orders'" class="page-view">
        <Orders />
      </div>

      <div v-if="currentTab === 'profile'" class="page-view">
        <Profile />
      </div>

      <div v-if="currentTab === 'companies'" class="page-view">
        <LinkedCompanies />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LinkedCompanies from '~/components/customers/linkedCompanies.vue'
import Orders from '~/components/customers/orders.vue'
import OrderRequests from '~/components/customers/orderRequests.vue'
import Profile from '~/components/customers/profile.vue'
import Wallet from '~/components/customers/wallet.vue'
import { useUserStore } from '~/stores/user'
import { getCompactAddressLines } from '~/utils/addressFormat'

definePageMeta({ layout: 'customer' })

const userStore = useUserStore()
const route = useRoute()
const config = useRuntimeConfig()

const isCheckingAuth = ref(true)
const walletBalance = useState('walletBalance', () => 0)
const recentRequests = ref([])
const ongoingOrders = ref([])
const activeRequestCount = ref(0)
const isUpdatingLocation = ref(false)
const locationUpdateMessage = ref('')
const locationUpdateState = ref('idle')
const HOME_STATS_POLL_MS = 15000
let homeStatsPollTimer = null

const currentTab = computed(() => route.query.tab || 'home')
const requestIdFromQuery = computed(() => {
  const value = route.query.requestId
  if (Array.isArray(value)) return value[0] || null
  return value || null
})

const companies = computed(() => userStore.companies || [])
const verifiedPartners = computed(() => companies.value.slice(0, 3))
const recentRequestItems = computed(() => recentRequests.value.slice(0, 2))
const ongoingOrderItems = computed(() => {
  const active = ongoingOrders.value.filter((order) => isOngoingOrderStatus(order.status))
  return (active.length ? active : ongoingOrders.value).slice(0, 2)
})
const dashboardLocationParts = computed(() => getCompactAddressLines(userStore.currentUser?.address || '', { primaryCount: 2 }))
const dashboardLocation = computed(() => dashboardLocationParts.value.primary || 'Set your delivery location')
const dashboardLocationHint = computed(() => dashboardLocationParts.value.secondary || 'Used automatically for new delivery requests until you change it.')

const goTab = (tab) => navigateTo({ path: '/customer', query: { tab } })

const isActiveRequestStatus = (status) => !['driver_unavailable', 'picked_up', 'delivered', 'completed', 'cancelled', 'returned'].includes(status)
const isOngoingOrderStatus = (status) => !['completed', 'delivered', 'cancelled', 'picked_up'].includes(status)

const formatDate = (value) => (
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : ''
)

const formatMoney = (value) => Number(value || 0).toFixed(2)
const shortId = (id) => (id || '').substring(0, 8).toUpperCase()
const shortOrderId = (id) => String(id || '').replace(/^#/, '').substring(0, 8)

const requestMeta = (request) => {
  const itemCount = Number(request.item_count || request.items?.length || 0)
  const fulfillment = request.fulfillment_type ? String(request.fulfillment_type).replace(/_/g, ' ') : ''
  if (fulfillment) return `${itemCount || 0} item${itemCount === 1 ? '' : 's'} • ${fulfillment}`
  return `${itemCount || 0} item${itemCount === 1 ? '' : 's'}`
}

const getRequestAmount = (request) => {
  const totalCost = Number(request.total_cost)
  if (Number.isFinite(totalCost) && totalCost > 0) return totalCost

  const estimated = Number(request.estimated_total)
  if (Number.isFinite(estimated) && estimated > 0) return estimated

  const itemsTotal = Number(request.items_total || 0)
  const deliveryFee = Number(request.delivery_fee || 0)
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
}

const getRequestStatusLabel = (status) => {
  const map = {
    paid: 'Settled',
    verified: 'Settled',
    pending: 'Pending',
    searching: 'Searching',
    finding_pharmacist: 'Searching',
    confirming_with_pharm: 'Processing',
    quote_available: 'Quoted',
    processing: 'Processing',
    out_for_delivery: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }
  return map[status] || String(status || 'active').replace(/_/g, ' ')
}

const getRequestStatusClass = (status) => {
  switch (status) {
    case 'paid':
    case 'verified':
      return 'bg-[#e7f7ea] text-[#1f8a45]'
    case 'processing':
    case 'confirming_with_pharm':
      return 'bg-[#f3daff] text-[#5d357a]'
    case 'quote_available':
      return 'bg-[#edf4ff] text-[#285db8]'
    case 'cancelled':
    case 'rejected':
      return 'bg-[#ffe7e7] text-[#c03a3a]'
    default:
      return 'bg-[#f4eff6] text-[#736a7a]'
  }
}

const requestIcon = (request) => {
  if (request.fulfillment_type === 'delivery') return 'local_shipping'
  if ((request.item_count || request.items?.length || 0) > 0) return 'pill'
  return 'description'
}

const getOrderStatusLabel = (status) => {
  const map = {
    pending: 'Pending',
    processing: 'Preparing',
    shipped: 'In Transit',
    logistics_pending: 'Logistics Pending',
    out_for_delivery: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return map[status] || String(status || 'order').replace(/_/g, ' ')
}

const getOrderStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-[#fff1d8] text-[#9a620d]'
    case 'processing':
      return 'bg-[#fff1d8] text-[#9a620d]'
    case 'shipped':
    case 'out_for_delivery':
      return 'bg-[#edf4ff] text-[#285db8]'
    case 'delivered':
    case 'completed':
      return 'bg-[#e7f7ea] text-[#1f8a45]'
    case 'cancelled':
      return 'bg-[#ffe7e7] text-[#c03a3a]'
    default:
      return 'bg-[#f4eff6] text-[#736a7a]'
  }
}

const getOrderSummary = (order) => {
  const firstItem = order.items?.[0]?.brand_name || order.items?.[0]?.product_name
  if (firstItem) return firstItem
  if (order.company_name) return order.company_name
  return `${Number(order.item_count || 0)} item${Number(order.item_count || 0) === 1 ? '' : 's'}`
}

const getCompanyMeta = (company) => {
  const address = company.address || company.location || company.physical_address || ''
  const compact = getCompactAddressLines(address, { primaryCount: 2 }).primary
  return compact || 'Linked pharmacy'
}

const reverseGeocode = async (latitude, longitude) => {
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

const refreshDashboardLocation = () => {
  if (isUpdatingLocation.value) return
  if (!navigator.geolocation) {
    locationUpdateState.value = 'error'
    locationUpdateMessage.value = 'Location is not available in this browser.'
    return
  }

  isUpdatingLocation.value = true
  locationUpdateState.value = 'idle'
  locationUpdateMessage.value = 'Updating location...'

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const result = await reverseGeocode(latitude, longitude)

        await userStore.updateProfile({
          home_address: result.address || null,
          home_latitude: latitude,
          home_longitude: longitude
        })

        locationUpdateState.value = 'success'
        locationUpdateMessage.value = 'Location updated.'
      } catch (error) {
        locationUpdateState.value = 'error'
        locationUpdateMessage.value = error.message || 'Failed to update location.'
      } finally {
        isUpdatingLocation.value = false
      }
    },
    (geoError) => {
      isUpdatingLocation.value = false
      locationUpdateState.value = 'error'
      if (geoError?.code === geoError.PERMISSION_DENIED) {
        locationUpdateMessage.value = 'Location permission was denied.'
        return
      }
      locationUpdateMessage.value = 'Could not get your location right now.'
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

const loadWalletBalance = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/api/wallet`, {
      headers: { Authorization: `Bearer ${userStore.customerAuthToken}` }
    })
    const json = await response.json()
    walletBalance.value = parseFloat(json.data?.balance || 0)
  } catch (_error) {
    walletBalance.value = 0
  }
}

const loadRequestActivity = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/api/order-requests/customer`, {
      headers: { Authorization: `Bearer ${userStore.customerAuthToken}` }
    })
    const json = await response.json()
    const requests = json.data || []
    recentRequests.value = requests.slice(0, 4)
    activeRequestCount.value = requests.filter((request) => isActiveRequestStatus(request.status)).length
  } catch (_error) {
    recentRequests.value = []
    activeRequestCount.value = 0
  }
}

const loadOrderActivity = async () => {
  try {
    const orders = await userStore.getAllOrders({ limit: 12 })
    ongoingOrders.value = Array.isArray(orders) ? orders : []
  } catch (_error) {
    ongoingOrders.value = []
  }
}

const loadCompanies = async () => {
  if (companies.value.length > 0) return
  try {
    await userStore.getMyCompanies()
  } catch (_error) {
    // Keep the page usable even if company refresh fails.
  }
}

const stopHomeStatsPolling = () => {
  if (!homeStatsPollTimer) return
  clearInterval(homeStatsPollTimer)
  homeStatsPollTimer = null
}

const loadDashboard = async () => {
  await Promise.allSettled([
    loadCompanies(),
    loadWalletBalance(),
    loadRequestActivity(),
    loadOrderActivity()
  ])
}

const startHomeStatsPolling = async () => {
  stopHomeStatsPolling()
  await loadDashboard()
  homeStatsPollTimer = setInterval(() => {
    loadDashboard()
  }, HOME_STATS_POLL_MS)
}

onMounted(async () => {
  try {
    if (!userStore.authInitialized) await userStore.checkAuthState()
    if (!userStore.customerAuthToken) {
      isCheckingAuth.value = false
      await navigateTo('/')
      return
    }

    await loadDashboard()
    if (currentTab.value === 'home') await startHomeStatsPolling()
  } catch (error) {
    console.error('Dashboard init error:', error)
  } finally {
    isCheckingAuth.value = false
  }
})

watch(currentTab, async (tab) => {
  if (!userStore.customerAuthToken) return
  if (tab === 'home') {
    await startHomeStatsPolling()
    return
  }
  stopHomeStatsPolling()
})

onUnmounted(() => {
  stopHomeStatsPolling()
})
</script>

<style>
.customer-app {
  width: 100%;
}

.dashboard-top {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 2.25fr) minmax(290px, 1fr);
}

.dashboard-middle {
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 0.95fr);
  align-items: start;
}

.section-wrap {
  /* Removed bounding box to match mockup floating headers */
}

.partners-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
}

.pulse-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: #520094;
  animation: spin 0.8s linear infinite;
}

.page-view {
  min-height: 60vh;
  width: 100%;
  overflow-x: clip;
}

.spin-icon {
  animation: spin 0.9s linear infinite;
}

@media (max-width: 1180px) {
  .dashboard-top,
  .dashboard-middle,
  .partners-grid {
    grid-template-columns: 1fr;
  }

  .section-wrap {
    padding: 1rem;
    border-radius: 2.2rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
