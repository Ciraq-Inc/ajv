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

        <!-- Non-blocking data error banner -->
        <div
          v-if="hasDashboardError && !isDashboardLoading"
          class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
          role="alert"
        >
          <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          <span class="text-amber-800 font-medium flex-1">Some data could not be loaded. Pull to refresh or wait a moment.</span>
          <button
            @click="startHomeStatsPolling"
            class="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors flex-shrink-0"
          >Retry</button>
        </div>

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
                :key="request.id ?? ''"
                class="flex w-full items-start sm:items-center gap-3 sm:gap-4 border border-[#e5e7eb] bg-white px-4 py-3 sm:py-4 text-left hover:border-[#4F217A]/30 hover:bg-[#faf4ff] hover:shadow-sm transition-all group rounded-xl"
                @click="navigateTo({ path: '/customer', query: { tab: 'requests', requestId: request.id } })"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[1rem] mt-0.5 sm:mt-0"
                  :class="request.status === 'paid' || request.status === 'verified' ? 'bg-green-50 text-green-700' : ['processing', 'composing', 'sourcing', 'confirming_with_pharm'].includes(request.status ?? '') ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'"
                >
                  <component :is="requestIcon(request)" class="w-5 h-5" />
                </div>

                <div class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 flex-1 flex flex-col justify-center">
                    <div class="flex items-center gap-2 mb-1.5 overflow-hidden pr-2">
                      <h4 class="truncate text-sm font-bold text-zinc-900 group-hover:text-[#4F217A] transition-colors" :title="getRequestHeadline(request)">
                        {{ getRequestHeadline(request) }}
                      </h4>
                      <span
                        class="inline-flex px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-md shrink-0 whitespace-nowrap"
                        :class="getRequestStatusClass(request.status ?? '')"
                      >
                        {{ getRequestStatusLabel(request.status ?? '') }}
                      </span>
                    </div>
                    <p class="truncate text-[0.7rem] font-medium text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap leading-tight">
                      <span v-if="request.request_number" class="font-mono text-zinc-400">#{{ request.request_number }}</span>
                      <span v-if="request.request_number" class="w-1 h-1 rounded-full bg-zinc-300"></span>
                      <span :title="request.updated_at || request.created_at">{{ formatDate(request.updated_at || request.created_at) }}</span>
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
                  :key="order.order_id ?? ''"
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
                      <span class="text-[0.65rem] font-black uppercase tracking-widest text-[#4F217A]">{{ getOrderStatusLabel(order.status ?? '') }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>

        <button
          type="button"
          class="w-full flex items-center gap-4 rounded-2xl border border-[#ede5ff] bg-gradient-to-br from-white to-[#faf6ff] px-5 py-4 text-left hover:border-[#c9a8f0] hover:shadow-[0_4px_16px_-4px_rgba(79,33,122,0.15)] transition-all group"
          @click="goTab('clearance')"
        >
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ede5ff] border border-[#d9c7f5] text-[#4F217A] group-hover:bg-[#4F217A] group-hover:text-white transition-all shadow-sm">
            <TagIcon class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-bold text-slate-800 group-hover:text-[#4F217A] transition-colors">Browse Clearance Deals</h4>
            <p class="text-[0.7rem] font-bold text-[#7a5fa0] group-hover:text-[#4F217A] transition-colors mt-0.5">Near-expiry stock marked down across all pharmacies</p>
          </div>
          <ChevronRightIcon class="hidden sm:block w-4 h-4 text-zinc-400 group-hover:text-[#4F217A] transition-colors shrink-0" />
        </button>

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
              :key="company.id ?? ''"
              class="flex items-center sm:items-start gap-4 rounded-xl border border-[#ede5ff] bg-gradient-to-br from-white to-[#faf6ff] px-5 py-4 text-left hover:border-[#c9a8f0] hover:shadow-[0_4px_16px_-4px_rgba(79,33,122,0.15)] transition-all group"
              @click="goToPharmacy(company)"
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

      <div v-if="currentTab === 'stock' && isProfessionalApproved" class="page-view">
        <ProfessionalStock />
      </div>

      <div v-if="currentTab === 'clearance'" class="page-view">
        <ClearanceDeals />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { timeAgo } from '~/composables/useTimeAgo'
import {
  WalletIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  BeakerIcon,
  TagIcon,
} from '@heroicons/vue/24/outline'
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/vue/24/solid'
import LinkedCompanies from '~/components/customers/linkedCompanies.vue'
import Orders from '~/components/customers/orders.vue'
import OrderRequests from '~/components/customers/orderRequests.vue'
import Profile from '~/components/customers/profile.vue'
import Wallet from '~/components/customers/wallet.vue'
import ProfessionalStock from '~/components/customers/professionalStock.vue'
import ClearanceDeals from '~/components/customers/clearanceDeals.vue'
import { useUserStore } from '~/stores/user'
import { getCompactAddressLines } from '~/utils/addressFormat'
import { useOrderStatus } from '~/composables/useOrderStatus'
import { createCustomerWalletService } from '~/services/customerWallet/customerWalletService'
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'

interface RequestItem {
  id?: number | string;
  request_number?: string;
  status?: string;
  item_count?: number;
  first_item_name?: string;
  request_type?: string;
  items?: Array<{ brand_name?: string; product_name?: string }>;
  fulfillment_type?: string;
  total_cost?: number | string;
  estimated_total?: number | string;
  items_total?: number | string;
  delivery_fee?: number | string;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface OrderItem {
  order_id?: number | string;
  status?: string;
  total_amount?: number | string;
  item_count?: number;
  company_name?: string;
  items?: Array<{ brand_name?: string; product_name?: string }>;
  [key: string]: unknown;
}

interface CompanyItem {
  id?: number | string;
  company_name?: string;
  name?: string;
  address?: string;
  location?: string;
  physical_address?: string;
  [key: string]: unknown;
}

definePageMeta({ layout: 'customer' })

const userStore = useUserStore()
const route = useRoute()
const orderStatus = useOrderStatus()
const walletService = createCustomerWalletService(useApi())
const orderRequestsService = createOrderRequestsService(useApi())

const isCheckingAuth = ref<boolean>(!userStore.authInitialized)
const isDashboardLoading = ref<boolean>(true)
const hasDashboardError = ref<boolean>(false)
const walletBalance = useState<number>('walletBalance', () => 0)
const recentRequests = ref<RequestItem[]>([])
const ongoingOrders = ref<OrderItem[]>([])
const activeRequestCount = ref<number>(0)
const HOME_STATS_POLL_MS = 15000
const MAX_CONSECUTIVE_ERRORS = 3
let consecutivePollErrors = 0
let homeStatsPollTimer: ReturnType<typeof setInterval> | null = null

const currentTab = computed<string>(() => String(route.query['tab'] ?? 'new'))
const isProfessionalApproved = computed<boolean>(() => (userStore.masterCustomer as Record<string, unknown> | undefined)?.professional_status === 'approved')
const requestIdFromQuery = computed<string | null>(() => {
  const value = route.query['requestId']
  if (Array.isArray(value)) return value[0] ?? null
  return (value as string | undefined) ?? null
})

const companies = computed<CompanyItem[]>(() => (userStore.companies as CompanyItem[]) ?? [])
const verifiedPartners = computed<CompanyItem[]>(() => companies.value.slice(0, 3))
const recentRequestItems = computed<RequestItem[]>(() => recentRequests.value.slice(0, 2))
const ongoingOrderItems = computed<OrderItem[]>(() => {
  const active = ongoingOrders.value.filter((order) => isOngoingOrderStatus(order.status ?? ''))
  return (active.length ? active : ongoingOrders.value).slice(0, 2)
})

const goTab = (tab: string): void => { void navigateTo({ path: '/customer', query: { tab } }) }

const goToPharmacy = (company: CompanyItem): void => {
  const slug = (company as Record<string, unknown>)['domain_name'] as string | undefined
  if (slug) {
    void navigateTo(`/${slug}`)
  } else {
    goTab('companies')
  }
}

const isActiveRequestStatus: (status: string) => boolean = orderStatus.isActiveRequestStatus
const isOngoingOrderStatus: (status: string) => boolean = orderStatus.isOngoingStoreStatus

const formatDate = (value: string | undefined): string => timeAgo(value)

const formatMoney = (value: number | string | undefined): string => Number(value ?? 0).toFixed(2)
const shortId = (id: string | undefined): string => (id ?? '').substring(0, 8).toUpperCase()
const shortOrderId = (id: number | string | undefined): string => String(id ?? '').replace(/^#/, '').substring(0, 8)

const getRequestHeadline = (request: RequestItem): string => {
  const firstName = request.first_item_name?.trim()
    ?? request.items?.[0]?.brand_name?.trim()
    ?? request.items?.[0]?.product_name?.trim()
  const itemCount = Number(request.item_count ?? request.items?.length ?? 0)
  if (firstName) {
    const remaining = itemCount - 1
    return remaining > 0 ? `${firstName} +${remaining} more` : firstName
  }
  if (itemCount > 0) return `${itemCount} item${itemCount === 1 ? '' : 's'}`
  const type = String(request.request_type ?? request.fulfillment_type ?? '').toLowerCase()
  if (type.includes('prescription')) return 'Prescription request'
  if (type.includes('otc') || type.includes('over')) return 'OTC request'
  return 'Medication request'
}

const requestMeta = (request: RequestItem): string => {
  const itemCount = Number(request.item_count ?? request.items?.length ?? 0)
  const fulfillment = request.fulfillment_type ? String(request.fulfillment_type).replace(/_/g, ' ') : ''
  if (fulfillment) return `${itemCount || 0} item${itemCount === 1 ? '' : 's'} • ${fulfillment}`
  return `${itemCount || 0} item${itemCount === 1 ? '' : 's'}`
}

const getRequestAmount = (request: RequestItem): number => {
  const totalCost = Number(request.total_cost)
  if (Number.isFinite(totalCost) && totalCost > 0) return totalCost

  const estimated = Number(request.estimated_total)
  if (Number.isFinite(estimated) && estimated > 0) return estimated

  const itemsTotal = Number(request.items_total ?? 0)
  const deliveryFee = request.fulfillment_type === 'delivery' ? Number(request.delivery_fee ?? 0) : 0
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
}

const getRequestStatusLabel: (status: string) => string = orderStatus.formatRequestStatus
const getRequestStatusClass: (status: string) => string = orderStatus.requestStatusBadgeClass

const requestIcon = (request: RequestItem) => {
  if (request.fulfillment_type === 'delivery') return TruckIcon
  if ((request.item_count ?? request.items?.length ?? 0) > 0) return BeakerIcon
  return DocumentTextIcon
}

const getOrderStatusLabel: (status: string) => string = orderStatus.formatStoreStatus

const getOrderDotClass = (status: string | undefined): string => {
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

const getOrderSummary = (order: OrderItem): string => {
  const firstItem = order.items?.[0]?.brand_name ?? order.items?.[0]?.product_name
  if (firstItem) return firstItem
  if (order.company_name) return order.company_name
  const cnt = Number(order.item_count ?? 0)
  return `${cnt} item${cnt === 1 ? '' : 's'}`
}

const getCompanyMeta = (company: CompanyItem): string => {
  const address = String(company.address ?? company.location ?? company.physical_address ?? '')
  const compact = getCompactAddressLines(address, { primaryCount: 2 }).primary
  return compact || 'Linked pharmacy'
}

const loadWalletBalance = async (): Promise<boolean> => {
  try {
    const json = await walletService.getBalance()
    walletBalance.value = parseFloat(String((json.data as { balance?: number | string })?.balance ?? 0))
    return true
  } catch {
    walletBalance.value = walletBalance.value // keep stale
    return false
  }
}

const loadRequestActivity = async (): Promise<boolean> => {
  try {
    const json = await orderRequestsService.listForCustomer()
    const requests = (json.data ?? []) as unknown as RequestItem[]
    recentRequests.value = requests.slice(0, 4)
    activeRequestCount.value = requests.filter((request) => isActiveRequestStatus(request.status ?? '')).length
    return true
  } catch {
    // keep stale data
    return false
  }
}

const loadOrderActivity = async (): Promise<void> => {
  try {
    const orders = await (userStore as unknown as { getAllOrders: (opts: { limit: number }) => Promise<unknown> }).getAllOrders({ limit: 12 })
    ongoingOrders.value = Array.isArray(orders) ? (orders as OrderItem[]) : []
  } catch {
    ongoingOrders.value = []
  }
}

const loadCompanies = async (): Promise<void> => {
  if (companies.value.length > 0) return
  try {
    await (userStore as unknown as { getMyCompanies: () => Promise<void> }).getMyCompanies()
  } catch {
    // Keep the page usable even if company refresh fails.
  }
}

const stopHomeStatsPolling = (): void => {
  if (!homeStatsPollTimer) return
  clearInterval(homeStatsPollTimer)
  homeStatsPollTimer = null
}

const loadDashboard = async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
  if (!silent) isDashboardLoading.value = true
  try {
    const [, walletOk, requestsOk] = await Promise.all([
      loadCompanies().catch(() => {}),
      loadWalletBalance(),
      loadRequestActivity(),
      loadOrderActivity().catch(() => {}),
    ])
    // walletOk and requestsOk are booleans from the loaders
    const criticalFailed = walletOk === false || requestsOk === false
    if (criticalFailed) {
      consecutivePollErrors += 1
      hasDashboardError.value = true
    } else {
      consecutivePollErrors = 0
      hasDashboardError.value = false
    }
  } finally {
    if (!silent) isDashboardLoading.value = false
  }
}

const startHomeStatsPolling = async (): Promise<void> => {
  stopHomeStatsPolling()
  consecutivePollErrors = 0
  await loadDashboard()
  homeStatsPollTimer = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    if (consecutivePollErrors >= MAX_CONSECUTIVE_ERRORS) {
      stopHomeStatsPolling()
      return
    }
    void loadDashboard({ silent: true })
  }, HOME_STATS_POLL_MS)
}

onMounted(async () => {
  try {
    if (!userStore.authInitialized) await (userStore as unknown as { checkAuthState: () => Promise<void> }).checkAuthState()
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
