<template>
  <div class="customer-app">
    <!-- Auth-check skeleton: mirror of the home layout to avoid layout pop-in -->
    <div v-if="isCheckingAuth" class="space-y-6" aria-busy="true" aria-label="Loading your dashboard">
      <section class="rounded-2xl bg-gradient-to-br from-[#7b3faa] via-[#5c2490] to-[#381659] p-6 shadow-xl">
        <div class="h-3 w-24 rounded bg-white/15 animate-pulse"></div>
        <div class="mt-3 h-10 w-20 rounded bg-white/15 animate-pulse"></div>
        <div class="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-2.5 w-28 rounded bg-white/15 animate-pulse"></div>
            <div class="h-5 w-32 rounded bg-white/15 animate-pulse"></div>
          </div>
          <div class="h-9 w-24 rounded-xl bg-white/15 animate-pulse"></div>
        </div>
      </section>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="space-y-3 lg:col-span-2">
          <div class="h-3 w-32 rounded bg-zinc-200 animate-pulse"></div>
          <div v-for="n in 2" :key="`sk-req-${n}`" class="flex gap-4 border border-zinc-100 bg-white px-4 py-4 rounded-xl">
            <div class="h-10 w-10 rounded-full bg-zinc-100 animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/2 rounded bg-zinc-100 animate-pulse"></div>
              <div class="h-2.5 w-1/3 rounded bg-zinc-100 animate-pulse"></div>
            </div>
          </div>
        </div>
        <aside class="space-y-3">
          <div class="h-3 w-28 rounded bg-zinc-200 animate-pulse"></div>
          <div class="border border-zinc-100 bg-white rounded-xl p-4 space-y-3">
            <div class="h-3 w-2/3 rounded bg-zinc-100 animate-pulse"></div>
            <div class="h-2.5 w-1/2 rounded bg-zinc-100 animate-pulse"></div>
          </div>
        </aside>
      </div>
    </div>

    <template v-else>
      <div v-if="currentTab === 'home'" class="space-y-6">
        <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7b3faa] via-[#5c2490] to-[#381659] p-6 text-white shadow-xl">
          <!-- decorative blobs -->
          <div class="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div class="absolute right-16 top-4 w-20 h-20 bg-purple-300/10 rounded-full blur-xl pointer-events-none"></div>
          <div class="absolute -left-6 -bottom-8 w-32 h-32 bg-purple-900/30 rounded-full blur-2xl pointer-events-none"></div>
          <!-- rig sparkle -->
          <img src="/brand/rig-sparkle.svg" class="absolute right-4 top-1/2 -translate-y-1/2 w-44 h-44 opacity-[0.07] pointer-events-none select-none" aria-hidden="true" />

          <p class="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-purple-200 relative z-10">Active Requests</p>
          <h3 class="mt-2 text-[2.4rem] font-black tracking-tight leading-none relative z-10" style="font-variant-numeric: tabular-nums;">{{ activeRequestCount }}</h3>

          <div class="mt-5 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <div class="cursor-pointer" @click="goTab('wallet')">
              <p class="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-purple-300">Available Balance</p>
              <p class="text-xl font-black mt-0.5 tabular-nums">GHS {{ walletBalance.toFixed(2) }}</p>
            </div>
            <button @click="goTab('wallet')" class="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2 text-xs font-bold tracking-wide border border-white/10">
              <WalletIcon class="w-[15px] h-[15px]" />
              Top Up
            </button>
          </div>
        </section>

        <div class="dashboard-middle grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="space-y-4 lg:col-span-2">
            <div class="flex items-center justify-between pb-2 border-b border-[#e5d5f5]">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#4F217A]"></div>
                <h3 class="text-[0.7rem] font-bold uppercase tracking-widest text-[#4F217A]">Activity Stream</h3>
              </div>
              <button class="inline-flex items-center gap-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-[#4F217A] hover:text-[#381659] transition-colors" @click="goTab('requests')">
                Full History
                <ChevronRightIcon class="w-3.5 h-3.5" />
              </button>
            </div>

            <div v-if="isDashboardLoading" class="space-y-3" aria-busy="true">
              <div v-for="n in 2" :key="`req-sk-${n}`" class="flex w-full items-center gap-3 sm:gap-4 border border-[#e5e7eb] bg-white px-4 py-4 rounded-xl">
                <div class="h-10 w-10 rounded-full bg-zinc-100 animate-pulse"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-1/2 rounded bg-zinc-100 animate-pulse"></div>
                  <div class="h-2.5 w-1/3 rounded bg-zinc-100 animate-pulse"></div>
                </div>
                <div class="h-3 w-16 rounded bg-zinc-100 animate-pulse"></div>
              </div>
            </div>

            <div v-else-if="recentRequestItems.length === 0" class="flex items-center gap-4 border border-[#e5d5f5] bg-[#faf4ff] px-5 py-4">
              <div class="flex h-10 w-10 items-center justify-center bg-[#ebd5fb] text-[#4F217A] rounded-full">
                <DocumentTextIcon class="w-5 h-5" />
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
                @click="navigateTo({ path: '/customer', query: { tab: 'requests', requestId: request.id } })"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[1rem] mt-0.5 sm:mt-0"
                  :class="request.status === 'paid' || request.status === 'verified' ? 'bg-green-50 text-green-700' : ['processing', 'composing', 'sourcing', 'confirming_with_pharm'].includes(request.status) ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'"
                >
                  <component :is="requestIcon(request)" class="w-5 h-5" />
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
            <div class="flex items-center justify-between pb-2 border-b border-[#e5d5f5]">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-[#4F217A]"></div>
                <h3 class="text-[0.7rem] font-bold uppercase tracking-widest text-[#4F217A]">Ongoing Orders</h3>
              </div>
              <button class="inline-flex items-center gap-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-[#4F217A] hover:text-[#381659] transition-colors" @click="goTab('orders')">
                View All
                <ChevronRightIcon class="w-3.5 h-3.5" />
              </button>
            </div>

            <div class="border border-[#ede5ff] bg-[#faf6ff] shadow-sm rounded-xl overflow-hidden mt-3">
              <div v-if="isDashboardLoading" class="px-4 py-4 space-y-3" aria-busy="true">
                <div class="flex gap-3">
                  <div class="h-8 w-8 rounded-full bg-[#ede5ff] animate-pulse"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-1/3 rounded bg-[#ede5ff] animate-pulse"></div>
                    <div class="h-2.5 w-1/2 rounded bg-[#ede5ff] animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div v-else-if="ongoingOrderItems.length === 0" class="flex items-center gap-3 px-4 py-5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ede5ff] text-[#4F217A] rounded-full border border-[#d9c7f5]">
                  <ArchiveBoxIcon class="w-5 h-5" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800">No active orders</p>
                  <p class="text-xs font-medium text-[#7a5fa0] mt-0.5">Orders in progress will show here.</p>
                </div>
              </div>

              <div v-else>
                <button
                  v-for="order in ongoingOrderItems"
                  :key="order.order_id"
                  class="flex w-full items-start gap-3 px-4 py-4 text-left transition-all hover:bg-[#f0e6ff]/50 group bg-white border-x-0"
                  :class="{ 'border-t border-[#ede5ff]': ongoingOrderItems.indexOf(order) > 0 }"
                  @click="goTab('orders')"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ede5ff] text-[#4F217A] border border-[#d9c7f5] mt-0.5 group-hover:bg-[#4F217A] group-hover:text-white transition-all shadow-sm">
                    <ArchiveBoxIcon class="w-4 h-4" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2 overflow-hidden">
                      <h4 class="truncate text-xs font-black tracking-tight text-slate-800 group-hover:text-[#4F217A] transition-colors" :title="'#' + shortOrderId(order.order_id)">#{{ shortOrderId(order.order_id) }}</h4>
                      <strong class="text-xs font-black text-slate-900 group-hover:text-[#4F217A] transition-colors shrink-0 tabular-nums">GHS {{ formatMoney(order.total_amount) }}</strong>
                    </div>
                    <p class="mt-1 truncate text-[0.7rem] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{{ getOrderSummary(order) }}</p>
                    <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span class="h-1.5 w-1.5 shrink-0 rounded-full shadow-sm" :class="getOrderDotClass(order.status) || 'bg-[#4F217A]'"></span>
                      <span class="text-[0.65rem] font-black uppercase tracking-widest text-[#4F217A]">{{ getOrderStatusLabel(order.status) }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>

        <section class="section-wrap space-y-4 pt-4 border-t border-[#ede5ff]">
          <div class="flex items-center justify-between pb-2 border-b border-[#e5d5f5]">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-[#4F217A]"></div>
              <h3 class="text-[0.7rem] font-bold uppercase tracking-widest text-[#4F217A]">Verified Partners</h3>
            </div>
            <button class="inline-flex items-center gap-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-[#4F217A] hover:text-[#381659] transition-colors" @click="goTab('companies')">
              Directory
              <ChevronRightIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <div v-if="verifiedPartners.length === 0" class="flex items-center gap-4 border border-[#ede5ff] bg-[#faf6ff] px-5 py-4 shadow-sm rounded-xl">
            <div class="flex h-10 w-10 items-center justify-center bg-[#ede5ff] border border-[#d9c7f5] text-[#4F217A] rounded-full">
              <BuildingStorefrontIcon class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-zinc-900">No pharmacies linked yet</p>
              <p class="text-xs text-[#7a5fa0]">Your verified pharmacy network will appear here.</p>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="company in verifiedPartners"
              :key="company.id"
              class="flex items-center sm:items-start gap-4 rounded-xl border border-[#ede5ff] bg-gradient-to-br from-white to-[#faf6ff] px-5 py-4 text-left hover:border-[#c9a8f0] hover:shadow-[0_4px_16px_-4px_rgba(79,33,122,0.15)] transition-all group"
              @click="goTab('companies')"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ede5ff] border border-[#d9c7f5] text-[#4F217A] group-hover:bg-[#4F217A] group-hover:text-white transition-all shadow-sm">
                <BuildingStorefrontIcon class="w-5 h-5" />
              </div>

              <div class="min-w-0 flex-1">
                <h4 class="truncate text-sm font-bold text-slate-800 group-hover:text-[#4F217A] transition-colors">{{ company.company_name || company.name }}</h4>
                <div class="mt-1 flex items-center gap-1.5 text-[0.7rem] font-bold text-[#7a5fa0] group-hover:text-[#4F217A] transition-colors flex-wrap">
                  <CheckBadgeIconSolid class="w-3.5 h-3.5 text-[#a589c3] shrink-0" />
                  <span class="truncate">{{ getCompanyMeta(company) }}</span>
                </div>
              </div>

              <div class="hidden sm:flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 group-hover:text-[#4F217A] group-hover:bg-[#faf6ff] transition-colors">
                <ChevronRightIcon class="w-4 h-4" />
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
import {
  WalletIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  BeakerIcon,
} from '@heroicons/vue/24/outline'
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/vue/24/solid'
import LinkedCompanies from '~/components/customers/linkedCompanies.vue'
import Orders from '~/components/customers/orders.vue'
import OrderRequests from '~/components/customers/orderRequests.vue'
import Profile from '~/components/customers/profile.vue'
import Wallet from '~/components/customers/wallet.vue'
import { useUserStore } from '~/stores/user'
import { getCompactAddressLines } from '~/utils/addressFormat'
import { useOrderStatus } from '~/composables/useOrderStatus'

definePageMeta({ layout: 'customer' })

const userStore = useUserStore()
const route = useRoute()
const config = useRuntimeConfig()
const orderStatus = useOrderStatus()

const isCheckingAuth = ref(!userStore.authInitialized)
const isDashboardLoading = ref(true)
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

const isActiveRequestStatus = orderStatus.isActiveRequestStatus
const isOngoingOrderStatus = orderStatus.isOngoingStoreStatus

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
  const deliveryFee = request.fulfillment_type === 'delivery' ? Number(request.delivery_fee || 0) : 0
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
}

const getRequestStatusLabel = orderStatus.formatRequestStatus
const getRequestStatusClass = orderStatus.requestStatusBadgeClass

const requestIcon = (request) => {
  if (request.fulfillment_type === 'delivery') return TruckIcon
  if ((request.item_count || request.items?.length || 0) > 0) return BeakerIcon
  return DocumentTextIcon
}

const getOrderStatusLabel = orderStatus.formatStoreStatus

const getOrderDotClass = (status) => {
  switch (status) {
    case 'processing':
    case 'pending':
      return 'bg-[#f59e0b]'
    case 'shipped':
    case 'out_for_delivery':
    case 'driver_assigned':
    case 'ready_for_pickup':
      return 'bg-[#4F217A]'
    case 'delivered':
    case 'completed':
    case 'picked_up':
      return 'bg-[#22c55e]'
    case 'cancelled':
      return 'bg-[#ef4444]'
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

const loadDashboard = async ({ silent = false } = {}) => {
  if (!silent) isDashboardLoading.value = true
  try {
    await Promise.allSettled([
      loadCompanies(),
      loadWalletBalance(),
      loadRequestActivity(),
      loadOrderActivity()
    ])
  } finally {
    if (!silent) isDashboardLoading.value = false
  }
}

const startHomeStatsPolling = async () => {
  stopHomeStatsPolling()
  await loadDashboard()
  homeStatsPollTimer = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    loadDashboard({ silent: true })
  }, HOME_STATS_POLL_MS)
}

onMounted(async () => {
  try {
    if (!userStore.authInitialized) await userStore.checkAuthState()
    if (!userStore.customerAuthToken) {
      await navigateTo('/')
      return
    }
    isCheckingAuth.value = false
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
