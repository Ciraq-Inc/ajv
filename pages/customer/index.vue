<template>
  <div class="customer-app">
    <div v-if="isCheckingAuth" class="auth-loading">
      <div class="pulse-ring"></div>
      <p>Loading...</p>
    </div>

    <template v-else>
      <div v-if="currentTab === 'home'" class="space-y-6">
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article class="p-5 bg-gradient-to-br from-[#4F217A] to-[#381659] border border-[#2b1046] h-full flex flex-col justify-center relative overflow-hidden text-white shadow-md">
            <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 border border-white/5 rounded-full blur-xl"></div>
            <div class="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-500/20 border border-purple-500/10 rounded-full blur-xl"></div>
            <p class="text-[0.65rem] font-bold uppercase tracking-widest text-[#d5bdf3] relative z-10">Active Requests</p>

            <div class="mt-3 flex items-center justify-between relative z-10">
              <div class="flex items-baseline gap-3">
                <h3 class="text-4xl font-bold tracking-tight text-white drop-shadow-sm" style="font-variant-numeric: tabular-nums;">{{ activeRequestCount }}</h3>
              </div>
              <div class="hidden items-center -space-x-2 sm:flex">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4F217A] bg-[#f4e8fb] text-[9px] uppercase font-bold tracking-widest text-[#4F217A]">JD</div>
                  <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4F217A] bg-[#f4e8fb] text-[9px] uppercase font-bold tracking-widest text-[#4F217A]">MK</div>
                  <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4F217A] bg-[#ebd5fb] text-[9px] font-bold text-[#4F217A]">+8</div>
              </div>
            </div>
          </article>

          <article
            class="flex h-full cursor-pointer flex-col justify-between border border-[#e5e7eb] bg-gradient-to-br from-[#f8fafc] to-[#e0f2fe] p-5 hover:border-blue-300 hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] transition-all group"
            @click="goTab('wallet')"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">Available Credits</p>
                <h3 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors" style="font-variant-numeric: tabular-nums;">GHS {{ walletBalance.toFixed(2) }}</h3>
              </div>
              <button class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 shadow-sm border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all" title="Top up wallet">
                <span class="material-symbols-outlined text-sm">account_balance_wallet</span>
              </button>
            </div>
          </article>
        </section>

        <div class="dashboard-middle grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="space-y-4 lg:col-span-2">
            <div class="flex items-center justify-between pb-2 border-b border-[#e5d5f5]">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#4F217A]"></div>
                <h3 class="text-[0.7rem] font-bold uppercase tracking-widest text-[#4F217A]">Activity Stream</h3>
              </div>
              <button class="text-[0.65rem] font-bold uppercase tracking-widest text-[#4F217A] hover:text-[#381659] transition-colors" @click="goTab('requests')">
                Full History &rarr;
              </button>
            </div>

            <div v-if="recentRequestItems.length === 0" class="flex items-center gap-4 border border-[#e5d5f5] bg-[#faf4ff] px-5 py-4">
              <div class="flex h-10 w-10 items-center justify-center bg-[#ebd5fb] text-[#4F217A] rounded-full">
                <span class="material-symbols-outlined text-[1.2rem]">description</span>
              </div>
              <div>
                <p class="text-sm font-semibold text-zinc-900">No requests yet</p>
                <p class="text-xs text-[#a589c3]">Your latest request activity will appear here.</p>
              </div>
            </div>

            <div v-else class="space-y-3">
              <button
                v-for="request in recentRequestItems"
                :key="request.id"
                class="flex w-full items-start sm:items-center gap-3 sm:gap-4 border border-[#e5e7eb] bg-white px-4 py-3 sm:py-4 text-left hover:border-[#4F217A]/30 hover:bg-[#faf4ff] hover:shadow-sm transition-all group rounded-xl"
                @click="goTab('requests')"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[1rem] mt-0.5 sm:mt-0"
                  :class="request.status === 'paid' || request.status === 'verified' ? 'bg-green-50 text-green-700' : request.status === 'processing' || request.status === 'confirming_with_pharm' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'"
                >
                  <span class="material-symbols-outlined text-[1.2rem]">{{ requestIcon(request) }}</span>
                </div>

                <div class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 flex-1 flex flex-col justify-center">
                    <div class="flex items-center gap-2 mb-1.5 overflow-hidden pr-2">
                      <h4 class="truncate text-sm font-bold text-zinc-900 group-hover:text-[#4F217A] transition-colors" :title="request.request_number || 'REQ-' + shortId(String(request.id || ''))">
                        {{ request.request_number || 'REQ-' + shortId(String(request.id || '')) }}
                      </h4>
                      <span
                        class="inline-flex px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-md shrink-0 whitespace-nowrap"
                        :class="getRequestStatusClass(request.status)"
                      >
                        {{ getRequestStatusLabel(request.status) }}
                      </span>
                    </div>
                    <p class="truncate text-[0.7rem] font-medium text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap leading-tight">
                      <span>{{ formatDate(request.updated_at || request.created_at) }}</span>
                      <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <span class="text-zinc-600 capitalize tabular-nums">{{ requestMeta(request) }}</span>
                    </p>
                  </div>

                  <div class="text-left sm:text-right shrink-0 flex flex-col justify-center sm:pl-2">
                    <span class="hidden sm:block text-[0.6rem] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Price</span>
                    <strong class="text-sm font-black text-zinc-900 group-hover:text-[#4F217A] tabular-nums leading-none">
                      <span class="sm:hidden text-zinc-400 font-semibold mr-1">Total:</span>GHS {{ formatMoney(getRequestAmount(request)) }}
                    </strong>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <aside class="space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-blue-200">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <h3 class="text-[0.7rem] font-bold uppercase tracking-widest text-blue-700">Ongoing Orders</h3>
              </div>
              <button class="text-[0.65rem] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors" @click="goTab('orders')">
                View All &rarr;
              </button>
            </div>

            <div class="border border-blue-100 bg-[#f8fbff] shadow-sm rounded-xl overflow-hidden mt-3">
              <div v-if="ongoingOrderItems.length === 0" class="flex items-center gap-3 px-4 py-5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center bg-blue-100 text-blue-500 rounded-full border border-blue-200">
                  <span class="material-symbols-outlined text-[1.1rem]">package_2</span>
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800">No active orders</p>
                  <p class="text-xs font-medium text-blue-500 mt-0.5">Orders in progress will show here.</p>
                </div>
              </div>

              <div v-else>
                <button
                  v-for="order in ongoingOrderItems"
                  :key="order.order_id"
                  class="flex w-full items-start gap-3 px-4 py-4 text-left transition-all hover:bg-blue-50/50 group bg-white border-x-0"
                  :class="{ 'border-t border-blue-50': ongoingOrderItems.indexOf(order) > 0 }"
                  @click="goTab('orders')"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[1.1rem]">package_2</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2 overflow-hidden">
                      <h4 class="truncate text-xs font-black tracking-tight text-slate-800 group-hover:text-blue-800 transition-colors" :title="'#' + shortOrderId(order.order_id)">#{{ shortOrderId(order.order_id) }}</h4>
                      <strong class="text-xs font-black text-slate-900 group-hover:text-blue-800 transition-colors shrink-0 tabular-nums">GHS {{ formatMoney(order.total_amount) }}</strong>
                    </div>
                    <p class="mt-1 truncate text-[0.7rem] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{{ getOrderSummary(order) }}</p>
                    <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span class="h-1.5 w-1.5 shrink-0 rounded-full shadow-sm" :class="getOrderDotClass(order.status) || 'bg-blue-400'"></span>
                      <span class="text-[0.65rem] font-black uppercase tracking-widest text-blue-600">{{ getOrderStatusLabel(order.status) }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>

        <section class="section-wrap space-y-4 pt-4 border-t border-orange-100">
          <div class="flex items-center justify-between pb-2 border-b border-orange-200">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-orange-500"></div>
              <h3 class="text-[0.7rem] font-bold uppercase tracking-widest text-orange-700">Verified Partners</h3>
            </div>
            <button class="text-[0.65rem] font-bold uppercase tracking-widest text-orange-600 hover:text-orange-800 transition-colors" @click="goTab('companies')">
              Directory &rarr;
            </button>
          </div>

          <div v-if="verifiedPartners.length === 0" class="flex items-center gap-4 border border-orange-100 bg-[#fffaf5] px-5 py-4 shadow-sm">
            <div class="flex h-10 w-10 items-center justify-center bg-orange-100 border border-orange-200 text-orange-500 rounded-full">
              <span class="material-symbols-outlined text-[1.2rem]">local_pharmacy</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-orange-900">No pharmacies linked yet</p>
              <p class="text-xs text-orange-600">Your verified pharmacy network will appear here.</p>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="company in verifiedPartners"
              :key="company.id"
              class="flex items-center sm:items-start gap-4 rounded-xl border border-orange-100 bg-gradient-to-br from-white to-[#fffaf5] px-5 py-4 text-left hover:border-orange-300 hover:shadow-[0_4px_16px_-4px_rgba(249,115,22,0.15)] transition-all group"
              @click="goTab('companies')"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 border border-orange-200 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                <span class="material-symbols-outlined text-[1.3rem]">local_pharmacy</span>
              </div>

              <div class="min-w-0 flex-1">
                <h4 class="truncate text-sm font-bold text-slate-800 group-hover:text-orange-800 transition-colors">{{ company.company_name || company.name }}</h4>
                <div class="mt-1 flex items-center gap-1.5 text-[0.7rem] font-bold text-orange-600/80 group-hover:text-orange-700 transition-colors flex-wrap">
                  <span class="material-symbols-outlined text-[0.8rem] ![font-variation-settings:'FILL'_1] text-orange-400 shrink-0">star</span>
                  <span class="truncate">{{ getCompanyMeta(company) }}</span>
                </div>
              </div>

              <div class="hidden sm:flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 group-hover:text-zinc-600 group-hover:bg-zinc-50 transition-colors">
                <span class="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
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

const getOrderDotClass = (status) => {
  switch (status) {
    case 'processing':
    case 'pending':
      return 'bg-[#f59e0b]'
    case 'shipped':
    case 'out_for_delivery':
      return 'bg-[#3b82f6]'
    case 'delivered':
    case 'completed':
      return 'bg-[#22c55e]'
    default:
      return 'bg-[#8b5cf6]'
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
