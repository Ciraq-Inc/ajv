<template>
  <div class="min-h-screen bg-slate-950 font-sans antialiased">

    <!-- skeleton -->
    <div v-if="!authResolved" class="flex min-h-screen items-center justify-center bg-slate-950">
      <div class="h-8 w-48 animate-pulse rounded-xl bg-white/10"></div>
    </div>

    <div v-else>

    <!-- Full-screen hero -->
    <div class="relative flex h-screen max-h-screen flex-col overflow-hidden text-white">

      <!-- Pharmacy shelf background -->
      <div class="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=2400&q=95"
          alt=""
          class="h-full w-full object-cover object-center"
        />
        <!-- deep uniform overlay for clean text rendering -->
        <div class="absolute inset-0 bg-slate-950/70"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-slate-950/40"></div>
      </div>

      <!-- subtle glow accent -->
      <div class="pointer-events-none absolute right-0 top-0 z-0 h-[400px] w-[400px] -translate-y-1/3 translate-x-1/3 rounded-full bg-sky-400/10 blur-3xl"></div>

      <!-- Content -->
      <div class="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center sm:px-10">

        <!-- text card -->
        <div class="w-full max-w-lg rounded-3xl bg-slate-950/50 px-7 py-8 backdrop-blur-md ring-1 ring-white/5 sm:px-10">

        <p class="text-[11px] font-semibold uppercase tracking-widest text-sky-400">215+ licensed pharmacies across Ghana</p>

        <h1 class="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          Find your medicine<br /><span class="text-sky-400">without the calls.</span>
        </h1>

        <p class="mt-3 max-w-sm text-sm leading-6 text-slate-200 sm:max-w-md sm:text-base">
          Describe what you need. Nearby pharmacies respond with stock, price, and delivery.
        </p>

        <!-- 3 steps -->
        <div class="mt-6 flex w-full max-w-sm items-center justify-center gap-1.5 sm:max-w-none sm:gap-2">
          <div class="flex flex-1 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium sm:w-36 sm:flex-none sm:px-3.5">
            <i class="ri-file-text-line text-sky-400"></i>
            <span class="hidden sm:inline">Describe it</span>
            <span class="sm:hidden">Describe</span>
          </div>
          <i class="ri-arrow-right-line shrink-0 text-xs text-slate-600"></i>
          <div class="flex flex-1 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium sm:w-36 sm:flex-none sm:px-3.5">
            <i class="ri-store-2-line text-sky-400"></i>
            <span class="hidden sm:inline">Pharmacies respond</span>
            <span class="sm:hidden">Pharmacies</span>
          </div>
          <i class="ri-arrow-right-line shrink-0 text-xs text-slate-600"></i>
          <div class="flex flex-1 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium sm:w-36 sm:flex-none sm:px-3.5">
            <i class="ri-checkbox-circle-line text-sky-400"></i>
            <span class="hidden sm:inline">Confirm &amp; receive</span>
            <span class="sm:hidden">Confirm</span>
          </div>
        </div>

        <!-- CTA -->
        <button
          @click="showLoginModal = true"
          class="mt-7 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-sky-900/50 transition hover:bg-sky-400 active:scale-95"
        >
          <i class="ri-send-plane-fill"></i>
          Send My First Request
        </button>

        </div><!-- /text card -->

        <!-- Trust strip -->
        <div class="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
          <span><i class="ri-shield-check-line mr-1 text-sky-400"></i>Verified &amp; licensed pharmacies</span>
          <span class="text-slate-600">·</span>
          <span><i class="ri-lock-line mr-1 text-sky-400"></i>Paystack secure</span>
          <span class="text-slate-600">·</span>
          <span><i class="ri-motorbike-line mr-1 text-sky-400"></i>Delivery available</span>
        </div>

      </div>

    </div>

    </div><!-- /v-else authResolved -->



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
