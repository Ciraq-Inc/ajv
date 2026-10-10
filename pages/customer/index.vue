<template>
  <div class="customer-app">
    <!-- Auth-check skeleton: mirror of the home layout to avoid layout pop-in -->
    <div v-if="isCheckingAuth" class="space-y-6" aria-busy="true" aria-label="Loading your dashboard">
      <span class="sr-only" role="status">Loading your dashboard…</span>
      <section class="rounded-2xl bg-brand-700 p-6 shadow-lift" aria-hidden="true">
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-hidden="true">
        <div class="space-y-3 lg:col-span-2">
          <div class="h-3 w-32 rounded bg-ink-100 animate-pulse"></div>
          <div v-for="n in 2" :key="`sk-req-${n}`" class="flex gap-4 border border-ink-100 bg-white px-4 py-4 rounded-xl">
            <div class="h-10 w-10 rounded-full bg-ink-50 animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/2 rounded bg-ink-50 animate-pulse"></div>
              <div class="h-2.5 w-1/3 rounded bg-ink-50 animate-pulse"></div>
            </div>
          </div>
        </div>
        <aside class="space-y-3">
          <div class="h-3 w-28 rounded bg-ink-100 animate-pulse"></div>
          <div class="border border-ink-100 bg-white rounded-xl p-4 space-y-3">
            <div class="h-3 w-2/3 rounded bg-ink-50 animate-pulse"></div>
            <div class="h-2.5 w-1/2 rounded bg-ink-50 animate-pulse"></div>
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
          <svg class="w-4 h-4 text-amber-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          <span class="text-amber-900 font-medium flex-1">We couldn't load some of your data. Check your connection and try again.</span>
          <button
            type="button"
            @click="startHomeStatsPolling"
            class="min-h-[32px] rounded-lg px-3 text-xs font-bold text-amber-900 underline underline-offset-2 hover:bg-amber-100 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800/50"
          >Try again</button>
        </div>

        <section class="relative overflow-hidden rounded-2xl bg-brand-700 p-6 text-white shadow-lift">
          <!-- decorative blobs -->
          <div class="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true"></div>
          <div class="absolute right-16 top-4 w-20 h-20 bg-brand-300/10 rounded-full blur-xl pointer-events-none" aria-hidden="true"></div>
          <div class="absolute -left-6 -bottom-8 w-32 h-32 bg-brand-900/30 rounded-full blur-2xl pointer-events-none" aria-hidden="true"></div>
          <!-- rig sparkle -->
          <img src="/brand/rig-sparkle.svg" class="absolute right-4 top-1/2 -translate-y-1/2 w-44 h-44 opacity-[0.07] pointer-events-none select-none" aria-hidden="true" alt="" />

          <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-100 relative z-10">Active Requests</p>
          <p class="mt-2 font-display text-[2.6rem] font-black tracking-tight leading-none relative z-10" style="font-variant-numeric: tabular-nums;" data-testid="active-request-count">{{ activeRequestCount }}</p>

          <div class="mt-5 pt-4 border-t border-white/15 flex items-center justify-between gap-3 relative z-10">
            <button
              type="button"
              data-testid="wallet-balance"
              class="-m-2 rounded-xl p-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              @click="goTab('wallet')"
            >
              <span class="block text-xs font-bold uppercase tracking-[0.14em] text-brand-100">Available Balance</span>
              <span class="mt-0.5 block font-display text-xl font-black tabular-nums">GHS {{ walletBalance.toFixed(2) }}</span>
            </button>
            <button
              type="button"
              @click="goTab('wallet')"
              class="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 px-4 text-sm font-bold tracking-wide transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <WalletIcon class="w-[15px] h-[15px]" aria-hidden="true" />
              Top Up
            </button>
          </div>
        </section>

        <div class="dashboard-middle grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section class="space-y-4 lg:col-span-2">
            <SectionHeader title="Activity Stream" action-label="Full History" @action="goTab('requests')" />

            <div v-if="isDashboardLoading" class="space-y-3" aria-busy="true">
              <span class="sr-only" role="status">Loading your requests…</span>
              <div v-for="n in 2" :key="`req-sk-${n}`" aria-hidden="true" class="flex w-full items-center gap-3 sm:gap-4 border border-ink-100 bg-white px-4 py-4 rounded-xl">
                <div class="h-10 w-10 rounded-full bg-ink-50 animate-pulse"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-1/2 rounded bg-ink-50 animate-pulse"></div>
                  <div class="h-2.5 w-1/3 rounded bg-ink-50 animate-pulse"></div>
                </div>
                <div class="h-3 w-16 rounded bg-ink-50 animate-pulse"></div>
              </div>
            </div>

            <EmptyState
              v-else-if="recentRequestItems.length === 0"
              :icon="DocumentTextIcon"
              title="No requests yet"
              description="Your latest request activity will appear here."
            >
              <template #action>
                <button
                  type="button"
                  class="min-h-[44px] rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/60 focus-visible:ring-offset-2"
                  @click="goTab('new')"
                >Start a request</button>
              </template>
            </EmptyState>

            <div v-else class="space-y-3">
              <button
                v-for="request in recentRequestItems"
                :key="request.id ?? ''"
                type="button"
                data-testid="request-row"
                class="flex w-full items-start sm:items-center gap-3 sm:gap-4 border border-ink-100 bg-white px-4 py-3 sm:py-4 text-left hover:border-brand-700/30 hover:bg-brand-50 hover:shadow-soft transition-all group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
                @click="navigateTo({ path: '/customer', query: { tab: 'requests', requestId: request.id } })"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-0.5 sm:mt-0"
                  :class="request.status === 'paid' || request.status === 'verified' ? 'bg-brand-50 text-brand-700' : ['processing', 'composing', 'sourcing', 'confirming_with_pharm'].includes(request.status ?? '') ? 'bg-brand-50 text-brand-700' : 'bg-ink-50 text-ink-600'"
                  aria-hidden="true"
                >
                  <component :is="requestIcon(request)" class="w-5 h-5" />
                </div>

                <div class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 flex-1 flex flex-col justify-center">
                    <div class="flex items-center gap-2 mb-1.5 overflow-hidden pr-2">
                      <h3 class="truncate text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors" :title="getRequestHeadline(request)">
                        {{ getRequestHeadline(request) }}
                      </h3>
                      <span
                        class="inline-flex px-1.5 py-0.5 text-xs font-black uppercase tracking-[0.08em] rounded-md shrink-0 whitespace-nowrap"
                        :class="getRequestStatusClass(request.status ?? '')"
                      >
                        {{ getRequestStatusLabel(request.status ?? '') }}
                      </span>
                    </div>
                    <p class="truncate text-xs font-medium text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap leading-tight">
                      <span v-if="request.request_number" class="font-mono">#{{ request.request_number }}</span>
                      <span v-if="request.request_number" class="w-1 h-1 rounded-full bg-ink-200" aria-hidden="true"></span>
                      <span :title="request.updated_at || request.created_at">{{ formatDate(request.updated_at || request.created_at) }}</span>
                      <span class="w-1 h-1 rounded-full bg-ink-200" aria-hidden="true"></span>
                      <span class="text-ink-600 capitalize tabular-nums">{{ requestMeta(request) }}</span>
                    </p>
                  </div>

                  <div class="text-left sm:text-right shrink-0 flex flex-col justify-center sm:pl-2">
                    <span class="hidden sm:block text-xs font-bold uppercase tracking-widest text-ink-500 mb-0.5">Price</span>
                    <strong class="text-sm font-black text-ink-900 group-hover:text-brand-700 tabular-nums leading-none">
                      <span class="sm:hidden text-ink-500 font-semibold mr-1">Total:</span>GHS {{ formatMoney(getRequestAmount(request)) }}
                    </strong>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <aside class="space-y-4">
            <SectionHeader title="Ongoing Orders" action-label="View All" @action="goTab('orders')" />

            <div class="border border-brand-100 bg-brand-50 shadow-soft rounded-xl overflow-hidden mt-3">
              <div v-if="isDashboardLoading" class="px-4 py-4 space-y-3" aria-busy="true">
                <span class="sr-only" role="status">Loading your orders…</span>
                <div class="flex gap-3" aria-hidden="true">
                  <div class="h-8 w-8 rounded-full bg-brand-100 animate-pulse"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-1/3 rounded bg-brand-100 animate-pulse"></div>
                    <div class="h-2.5 w-1/2 rounded bg-brand-100 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <EmptyState
                v-else-if="ongoingOrderItems.length === 0"
                class="border-0 bg-transparent"
                :icon="ArchiveBoxIcon"
                title="No active orders"
                description="Orders in progress will show here."
              />

              <div v-else>
                <button
                  v-for="order in ongoingOrderItems"
                  :key="order.order_id ?? ''"
                  type="button"
                  data-testid="order-row"
                  class="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-brand-50 group bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700/50"
                  :class="{ 'border-t border-brand-100': ongoingOrderItems.indexOf(order) > 0 }"
                  @click="goTab('orders')"
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 border border-brand-100 mt-0.5 group-hover:bg-brand-700 group-hover:text-white transition-colors" aria-hidden="true">
                    <ArchiveBoxIcon class="w-4 h-4" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2 overflow-hidden">
                      <h3 class="truncate text-xs font-black tracking-tight text-ink-900 group-hover:text-brand-700 transition-colors" :title="'#' + shortOrderId(order.order_id)">#{{ shortOrderId(order.order_id) }}</h3>
                      <strong class="text-xs font-black text-ink-900 group-hover:text-brand-700 transition-colors shrink-0 tabular-nums">GHS {{ formatMoney(order.total_amount) }}</strong>
                    </div>
                    <p class="mt-1 truncate text-xs font-medium text-ink-500">{{ getOrderSummary(order) }}</p>
                    <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="getOrderDotClass(order.status) || 'bg-brand-700'" aria-hidden="true"></span>
                      <span class="text-xs font-black uppercase tracking-widest text-brand-700">{{ getOrderStatusLabel(order.status ?? '') }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>

        <button
          type="button"
          class="w-full flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-700 px-5 py-4 text-left hover:border-brand-300 hover:shadow-soft transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
          @click="goTab('clearance')"
        >
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 border border-brand-100 text-brand-700 group-hover:bg-brand-700 group-hover:text-white transition-colors" aria-hidden="true">
            <TagIcon class="w-5 h-5" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">Browse Clearance Deals</h3>
            <p class="text-xs font-medium text-ink-500 mt-0.5">Near-expiry stock marked down across all pharmacies</p>
          </div>
          <ChevronRightIcon class="hidden sm:block w-4 h-4 text-ink-500 group-hover:text-brand-700 transition-colors shrink-0" aria-hidden="true" />
        </button>

        <section class="space-y-4 pt-4 border-t border-brand-100" data-testid="partners-section">
          <SectionHeader title="Verified Partners" action-label="Directory" @action="goTab('companies')" />

          <EmptyState
            v-if="verifiedPartners.length === 0"
            :icon="BuildingStorefrontIcon"
            title="No pharmacies linked yet"
            description="Your verified pharmacy network will appear here."
          />

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="company in verifiedPartners"
              :key="company.id ?? ''"
              type="button"
              data-testid="partner-row"
              class="flex items-center sm:items-start gap-4 rounded-xl border border-brand-100 bg-brand-700 px-5 py-4 text-left hover:border-brand-300 hover:shadow-soft transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
              @click="goToPharmacy(company)"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 border border-brand-100 text-brand-700 group-hover:bg-brand-700 group-hover:text-white transition-colors" aria-hidden="true">
                <BuildingStorefrontIcon class="w-5 h-5" />
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">{{ company.company_name || company.name }}</h3>
                <div class="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-500 flex-wrap">
                  <CheckBadgeIconSolid class="w-3.5 h-3.5 text-brand-700 shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ getCompanyMeta(company) }}</span>
                </div>
              </div>

              <div class="hidden sm:flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-white border border-ink-100 text-ink-500 group-hover:text-brand-700 transition-colors" aria-hidden="true">
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
import EmptyState from '~/components/shared/EmptyState.vue'
import SectionHeader from '~/components/shared/SectionHeader.vue'
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
      return 'bg-amber-800'
    case 'shipped':
    case 'out_for_delivery':
    case 'driver_assigned':
    case 'ready_for_pickup':
      return 'bg-brand-700'
    case 'delivered':
    case 'completed':
    case 'picked_up':
      return 'bg-brand-700'
    case 'cancelled':
      return 'bg-red-700'
    default:
      return 'bg-brand-700'
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
    // keep the last known balance
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
    const handoffToken = route.query['handoff']
    if (typeof handoffToken === 'string' && handoffToken) {
      try {
        await userStore.redeemSessionHandoff(handoffToken)
      } catch {
        // Expired / already used / invalid — fall through to the normal
        // auth check below, which will bounce to login if still unauthed.
      }
      // Strip the spent token from the URL either way so it doesn't
      // linger in history/referrers; keep requestId if one was present.
      await navigateTo(
        { path: '/customer', query: requestIdFromQuery.value ? { requestId: requestIdFromQuery.value } : {} },
        { replace: true }
      )
    }

    if (!userStore.authInitialized) await (userStore as unknown as { checkAuthState: () => Promise<void> }).checkAuthState()
    if (!userStore.customerAuthToken) {
      await navigateTo({ path: '/', query: requestIdFromQuery.value ? { requestId: requestIdFromQuery.value } : {} })
      return
    }
    isCheckingAuth.value = false
    // Polling does its own first load, so the home tab must not load a second time.
    if (currentTab.value === 'home') await startHomeStatsPolling()
    else await loadDashboard()
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

.dashboard-middle {
  display: grid;
  gap: 2rem;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 0.95fr);
  align-items: start;
}

.page-view {
  min-height: 60vh;
  width: 100%;
  overflow-x: clip;
}

@media (max-width: 1180px) {
  .dashboard-middle {
    grid-template-columns: 1fr;
  }

  .section-wrap {
    padding: 1rem;
    border-radius: 2.2rem;
  }
}

</style>
