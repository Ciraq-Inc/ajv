<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.72),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(125,211,252,0.55),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_44%,#f8fafc_100%)]">
    <div class="container mx-auto max-w-6xl px-4 pb-12 pt-20">
      <div v-if="!authResolved" class="space-y-6">
        <section class="rounded-[32px] border border-sky-100 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,116,144,0.10)] backdrop-blur sm:p-8">
          <div class="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-stretch">
            <div class="rounded-3xl bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_54%,#0891b2_100%)] p-6 text-white sm:p-8">
              <div class="h-7 w-24 animate-pulse rounded-full bg-white/15"></div>
              <div class="mt-5 h-10 w-3/4 animate-pulse rounded-2xl bg-white/15"></div>
              <div class="mt-3 h-5 w-5/6 animate-pulse rounded-xl bg-white/10"></div>
              <div class="mt-2 h-5 w-2/3 animate-pulse rounded-xl bg-white/10"></div>
              <div class="mt-6 grid gap-3 sm:grid-cols-3">
                <div class="h-20 animate-pulse rounded-2xl bg-white/10"></div>
                <div class="h-20 animate-pulse rounded-2xl bg-white/10"></div>
                <div class="h-20 animate-pulse rounded-2xl bg-white/10"></div>
              </div>
            </div>

            <div class="grid gap-4">
              <div class="h-36 animate-pulse rounded-3xl border border-sky-100 bg-white"></div>
              <div class="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white"></div>
            </div>
          </div>
        </section>

        <section class="rounded-[30px] border border-sky-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))] p-6 shadow-[0_20px_60px_rgba(14,116,144,0.08)]">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white"></div>
            <div class="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white"></div>
            <div class="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white"></div>
          </div>
        </section>
      </div>

      <div v-else>
      <div v-if="!userStore.isLoggedIn" class="mb-4 flex justify-end sm:hidden">
        <button
          @click="showLoginModal = true"
          class="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
        >
          <i class="ri-user-line text-base"></i> Sign In
        </button>
      </div>
      <section class="mb-8 rounded-[32px] border border-sky-100 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,116,144,0.10)] backdrop-blur sm:p-8">
        <div class="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-stretch">
          <div class="rounded-3xl bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_54%,#0891b2_100%)] p-6 text-white sm:p-8">
            <div class="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
              {{ userStore.isLoggedIn ? 'MedsGH' : '215+ pharmacy partners' }}
            </div>
            <h1 class="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Search 215+ pharmacy shelves in under 60 seconds.
            </h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-sky-100 sm:text-base">
              Stop calling around. One request alerts nearby pharmacies to confirm stock, quote clearly, and get your medicines moving.
            </p>

            <div v-if="!userStore.isLoggedIn" class="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
              <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1">Licensed pharmacy network</span>
              <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1">Secure Paystack payments</span>
              <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1">Protected customer data</span>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-100">{{ userStore.isLoggedIn ? 'Requests' : 'Pharmacies' }}</p>
                <p class="mt-1 text-xl font-bold">{{ userStore.isLoggedIn ? myRequests.length : '215+' }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-100">{{ userStore.isLoggedIn ? 'Active' : 'Response time' }}</p>
                <p class="mt-1 text-xl font-bold">{{ userStore.isLoggedIn ? activeRequestCount : '< 60s' }}</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-100">{{ userStore.isLoggedIn ? 'Access' : 'Payments' }}</p>
                <p class="mt-1 text-sm font-semibold">{{ userStore.isLoggedIn ? 'Signed in' : 'Paystack secure' }}</p>
              </div>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <button @click="handlePrimaryAction" class="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50">
                <i class="ri-layout-grid-line text-lg"></i> {{ userStore.isLoggedIn ? 'Open My Requests' : 'Start Your First Request' }}
              </button>
              <button v-if="userStore.isLoggedIn" @click="fetchMyRequests" class="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                <i class="ri-refresh-line text-lg"></i> Refresh Activity
              </button>
            </div>
          </div>

          <div class="grid gap-4">
            <div v-if="userStore.isLoggedIn" class="rounded-3xl border border-sky-100 bg-slate-950 p-5 text-white shadow-sm">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">Wallet</p>
              <p class="mt-2 text-3xl font-bold">GHS {{ walletBalance.toFixed(2) }}</p>
              <p class="mt-2 text-sm text-slate-300">Top up here, then continue with your requests and payments in one place.</p>
              <div class="mt-5 flex gap-2">
                <button @click="showTopUpModal = true" class="flex-1 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400">
                  Top Up
                </button>
                <button @click="goToCustomerPortal" class="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                  Open Requests
                </button>
              </div>
            </div>

            <div v-else class="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Trusted by patients</p>
              <p class="mt-2 text-lg font-bold text-slate-900">Join 5,000+ Ghanaians using MedsGH to skip the pharmacy queue.</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">Sign in once, send one request, and keep your updates, quotes, and payments in one place.</p>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Why it works</p>
              <div class="mt-4 space-y-3 text-sm text-slate-700">
                <p>One request can reach licensed pharmacies faster than calling around yourself.</p>
                <p>You see clear responses, delivery progress, and payment history without juggling multiple chats.</p>
                <p>You sign in once, then move straight into your first medicine request.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="userStore.isLoggedIn" class="space-y-5">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Total requests</p>
            <p class="mt-2 text-2xl font-bold text-slate-900">{{ myRequests.length }}</p>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Active requests</p>
            <p class="mt-2 text-2xl font-bold text-slate-900">{{ activeRequestCount }}</p>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Completed</p>
            <p class="mt-2 text-2xl font-bold text-slate-900">{{ completedRequestCount }}</p>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recent requests</p>
              <h2 class="mt-2 text-xl font-bold text-slate-900">Latest request activity</h2>
            </div>
            <button @click="fetchMyRequests" class="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              <i class="ri-refresh-line"></i> Refresh
            </button>
          </div>

          <div v-if="loadingRequests" class="py-12 text-center text-sm text-slate-500">
            Loading your request activity...
          </div>

          <div v-else-if="myRequests.length === 0" class="py-12 text-center">
            <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <i class="ri-file-list-3-line text-3xl text-slate-400"></i>
            </div>
            <p class="font-semibold text-slate-700">No request activity yet</p>
            <p class="mt-1 text-sm text-slate-500">Open the customer portal when you are ready to create your first request.</p>
            <button @click="goToCustomerPortal" class="mt-4 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
              Open My Requests
            </button>
          </div>

          <div v-else class="mt-5 space-y-4">
            <button
              v-for="req in myRequests.slice(0, 6)"
              :key="req.id"
              class="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-left transition hover:border-sky-200 hover:bg-white hover:shadow-sm"
              @click="viewRequestDetail(req)"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-base font-bold text-slate-900">#{{ req.request_number }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ formatDate(req.created_at) }}</p>
                  <div class="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span><i class="ri-capsule-line mr-1"></i>{{ req.item_count || 0 }} items</span>
                    <span><i class="ri-money-dollar-circle-line mr-1"></i>GHS {{ parseMoney(req.request_fee) }}</span>
                  </div>
                </div>
                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide" :class="statusClass(req.status)">
                  {{ formatStatus(req.status) }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section v-else class="rounded-[30px] border border-sky-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))] p-6 shadow-[0_20px_60px_rgba(14,116,144,0.08)]">
        <div class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div class="rounded-3xl bg-slate-950 p-6 text-white">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">What happens next</p>
            <h2 class="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
              A fast path from sign-in to your first request.
            </h2>
            <p class="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              We capture your details first, then move you straight into the request flow so you can describe the medicine you need without delay.
            </p>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">1</p>
                <p class="mt-2 text-sm font-semibold">Sign in fast</p>
                <p class="mt-1 text-xs leading-5 text-slate-300">Name, phone, and password get you in quickly.</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">2</p>
                <p class="mt-2 text-sm font-semibold">Create the request</p>
                <p class="mt-1 text-xs leading-5 text-slate-300">Upload a prescription or type the medicine name you need.</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">3</p>
                <p class="mt-2 text-sm font-semibold">Get real responses</p>
                <p class="mt-1 text-xs leading-5 text-slate-300">Nearby pharmacies confirm stock and help you move forward.</p>
              </div>
            </div>

          </div>

          <div class="grid gap-4">
            <div class="rounded-3xl border border-white/80 bg-white px-5 py-5 shadow-sm">
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <i class="ri-wallet-3-line text-xl"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">Pay when you're ready</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Keep your balance ready for request holds and confirmed payments.</p>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-white/80 bg-white px-5 py-5 shadow-sm">
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <i class="ri-file-list-3-line text-xl"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">Clear updates</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">See when a pharmacy responds, confirms, or moves your request forward.</p>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-dashed border-sky-200 bg-sky-50 px-5 py-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Why customers use this</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                It is a simpler way to request medicines, compare availability, and keep everything organised from one account.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>

      <div v-if="selectedRequest" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="selectedRequest = null">
        <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Request #{{ selectedRequest.request_number }}</h3>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase" :class="statusClass(selectedRequest.status)">
                {{ formatStatus(selectedRequest.status) }}
              </span>
            </div>
            <button @click="selectedRequest = null" class="p-1 text-gray-400 transition hover:text-gray-600">
              <i class="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div class="space-y-5 px-6 py-5">
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Items</p>
              <div class="space-y-2">
                <div v-for="item in selectedRequest.items" :key="item.id" class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.product_name }}</p>
                    <p class="text-xs text-gray-400">Qty: {{ item.quantity }}</p>
                  </div>
                  <p class="text-sm font-bold text-gray-900">{{ item.marked_up_price ? `GHS ${parseMoney(item.marked_up_price)}` : 'Pending' }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedRequest.estimated_total" class="rounded-xl bg-indigo-50 p-4">
              <div class="mb-1 flex justify-between text-sm">
                <span class="text-gray-600">Items total</span>
                <span class="font-semibold">GHS {{ parseMoney(selectedRequest.items_total || 0) }}</span>
              </div>
              <div v-if="selectedRequest.delivery_fee" class="mb-1 flex justify-between text-sm">
                <span class="text-gray-600">Delivery fee</span>
                <span class="font-semibold">GHS {{ parseMoney(selectedRequest.delivery_fee) }}</span>
              </div>
              <div class="mt-2 flex justify-between border-t border-indigo-200 pt-2 text-base font-bold">
                <span>Estimated Total</span>
                <span class="text-indigo-600">GHS {{ parseMoney(selectedRequest.estimated_total) }}</span>
              </div>
            </div>

            <div v-if="selectedRequest.delivery_address" class="flex gap-2 text-sm">
              <i class="ri-map-pin-line mt-0.5 text-gray-400"></i>
              <span class="text-gray-700">{{ selectedRequest.delivery_address }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showTopUpModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showTopUpModal = false">
        <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
            <h3 class="text-lg font-bold">Top Up Wallet</h3>
            <p class="text-sm text-white/80">Add funds via Paystack</p>
          </div>
          <div class="p-6">
            <label class="mb-1.5 block text-sm font-semibold text-gray-700">Amount (GHS)</label>
            <input v-model.number="topUpAmount" type="number" min="1" step="0.01" placeholder="50.00" class="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-bold text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" />
            <div class="flex gap-3">
              <button @click="showTopUpModal = false" class="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                Cancel
              </button>
              <button @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount <= 0" class="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40">
                Pay GHS {{ (topUpAmount || 0).toFixed(2) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="toast" class="fixed bottom-6 right-6 z-50 animate-bounce-in">
        <div class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg" :class="toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'">
          <i :class="toast.type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'" class="text-lg"></i>
          {{ toast.text }}
        </div>
      </div>

      <Login :is-open="showLoginModal" @close="showLoginModal = false" @login-success="handleLoginSuccess" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Login from '~/components/Login.vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const route = useRoute()

const authResolved = ref(false)
const loadingRequests = ref(false)
const toast = ref(null)
const showTopUpModal = ref(false)
const showLoginModal = ref(false)
const topUpAmount = ref(50)
const walletBalance = ref(0)
const myRequests = ref([])
const selectedRequest = ref(null)

const terminalStatuses = ['completed', 'cancelled', 'returned', 'delivered']

const activeRequestCount = computed(() => myRequests.value.filter((req) => !terminalStatuses.includes((req.status || '').toLowerCase())).length)
const completedRequestCount = computed(() => myRequests.value.filter((req) => terminalStatuses.includes((req.status || '').toLowerCase())).length)

const customerApiCall = async (method, url, data = null) => {
  const headers = {}
  if (data) headers['Content-Type'] = 'application/json'
  if (userStore.customerAuthToken) headers.Authorization = `Bearer ${userStore.customerAuthToken}`

  const opts = { method, headers }
  if (data) opts.body = JSON.stringify(data)

  const response = await fetch(`${apiBase}${url}`, opts)
  const json = await response.json()

  if (!response.ok || !json.success) {
    if (response.status === 401 || response.status === 403) {
      userStore.clearAuthState()
      throw new Error('Session expired. Please log in again.')
    }
    throw new Error(json.message || `API error ${response.status}`)
  }

  return json
}

const fetchWalletBalance = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await customerApiCall('GET', '/api/wallet')
    walletBalance.value = parseFloat(res.data?.balance || 0)
  } catch {
    walletBalance.value = 0
  }
}

const fetchMyRequests = async () => {
  if (!userStore.isLoggedIn) return
  loadingRequests.value = true
  try {
    const res = await customerApiCall('GET', '/api/order-requests/customer')
    myRequests.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    showToast(error.message || 'Failed to load requests', 'error')
  } finally {
    loadingRequests.value = false
  }
}

const viewRequestDetail = async (req) => {
  try {
    const res = await customerApiCall('GET', `/api/order-requests/customer/${req.id}`)
    selectedRequest.value = res.data
  } catch (error) {
    showToast(error.message || 'Failed to load request', 'error')
  }
}

const initiateTopUp = async () => {
  if (!topUpAmount.value || topUpAmount.value <= 0) return
  try {
    const res = await customerApiCall('POST', '/api/wallet/topup', { amount: topUpAmount.value })
    if (res.data?.authorization_url) {
      window.location.assign(res.data.authorization_url)
      return
    }
    showTopUpModal.value = false
    showToast('Top up initiated.')
  } catch (error) {
    showToast(error.message || 'Failed to initiate payment', 'error')
  }
}

const handlePrimaryAction = () => {
  if (userStore.isLoggedIn) {
    goToCustomerPortal()
    return
  }

  showLoginModal.value = true
}

const handleLoginSuccess = async (payload = {}) => {
  showLoginModal.value = false
  const destinationTab = payload?.destination === 'new' ? 'new' : 'home'
  await navigateTo({ path: '/customer', query: { tab: destinationTab } })
}

const goToCustomerPortal = () => navigateTo('/customer')
const parseMoney = (value) => parseFloat(value || 0).toFixed(2)
const formatStatus = (status) => (status || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

const statusClass = (status) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    items_sourced: 'bg-purple-100 text-purple-700',
    awaiting_customer: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    returned: 'bg-slate-200 text-slate-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

const handleLoggedOutNotice = async (flag) => {
  if (!flag) return
  showToast('You have been logged out.', 'success')
  await navigateTo({ path: '/', query: {} }, { replace: true })
}

const redirectLoggedInUsers = async () => {
  if (!userStore.isLoggedIn) return false
  await navigateTo('/customer', { replace: true })
  return true
}

onMounted(async () => {
  await userStore.checkAuthState()
  if (await redirectLoggedInUsers()) return
  authResolved.value = true
})

watch(() => route.query.logged_out, handleLoggedOutNotice, { immediate: true })
watch(() => userStore.isLoggedIn, async (isLoggedIn) => {
  if (!isLoggedIn) return
  await redirectLoggedInUsers()
})
</script>

<style scoped>
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  50% {
    transform: translateY(-4px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}
</style>
