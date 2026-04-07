<template>
    <div class="space-y-6">
        <!-- Header -->
        <div>
            <h2 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A]">Wallet</h2>
            <p class="text-sm font-medium text-zinc-600 mt-1">Credits and transaction history.</p>
        </div>

        <!-- Hero grid: balance card + stat cards -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
            <!-- Purple balance card -->
            <section class="relative overflow-hidden rounded-xl p-6 text-white min-h-[160px] flex flex-col justify-between" style="background: linear-gradient(135deg, #5a169a 0%, #6922b1 52%, #4e1684 100%); box-shadow: 0 18px 42px rgba(88,29,137,0.18);">
                <div class="flex items-start justify-between gap-3 relative z-10">
                    <div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">Available Balance</p>
                        <div class="flex items-end gap-1.5 mt-1">
                            <span class="text-lg font-semibold text-white/80 leading-none mb-0.5">GHS</span>
                            <strong class="text-4xl font-black tracking-tight leading-none">{{ balance.toFixed(2) }}</strong>
                        </div>
                    </div>
                    <button @click="showTopUp = true" class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors flex-shrink-0">
                        <CreditCardIcon class="w-4 h-4" />
                        Top Up
                    </button>
                </div>

                <!-- Decorative glow -->
                <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style="background: radial-gradient(circle, #c084fc, transparent)"></div>
                <div class="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-15" style="background: radial-gradient(circle, #a855f7, transparent)"></div>
            </section>

            <!-- Stat mini cards -->
            <div class="flex lg:flex-col gap-3">
                <article class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white shadow-sm px-5 py-4 flex-1 lg:flex-auto">
                    <div class="w-11 h-11 rounded-full bg-[#edf9ef] text-[#1d9154] flex items-center justify-center flex-shrink-0">
                        <ArrowDownIcon class="w-5 h-5" />
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Total Credits</p>
                        <h3 class="text-2xl font-black text-zinc-900 leading-none mt-0.5">{{ creditTransactions.length }}</h3>
                        <p class="text-xs text-zinc-400 mt-0.5">Transactions</p>
                    </div>
                </article>

                <article class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white shadow-sm px-5 py-4 flex-1 lg:flex-auto">
                    <div class="w-11 h-11 rounded-full bg-[#fff0f1] text-[#d14b5c] flex items-center justify-center flex-shrink-0">
                        <ArrowUpIcon class="w-5 h-5" />
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Total Debits</p>
                        <h3 class="text-2xl font-black text-zinc-900 leading-none mt-0.5">{{ debitTransactions.length }}</h3>
                        <p class="text-xs text-zinc-400 mt-0.5">Transactions</p>
                    </div>
                </article>
            </div>
        </div>

        <!-- Transactions -->
        <section class="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
            <div class="flex items-center justify-between gap-3 mb-4">
                <div class="flex items-center gap-3">
                    <h3 class="font-black text-zinc-900 text-base tracking-tight">Recent Transactions</h3>
                    <span class="inline-flex items-center rounded-full px-3 py-1 bg-[#f4e8fb] text-[#5e3a86] text-[10px] font-black uppercase tracking-[0.12em]">{{ currentMonthLabel }}</span>
                </div>
                <button @click="fetchTransactions" :disabled="loading"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5e3a86] hover:text-[#4F217A] transition-colors disabled:opacity-50">
                    <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
                    Refresh
                </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center gap-3 py-8 justify-center text-zinc-400">
                <ArrowPathIcon class="w-5 h-5 animate-spin" />
                <p class="text-sm font-medium">Loading transactions...</p>
            </div>

            <!-- Empty -->
            <div v-else-if="transactions.length === 0" class="flex flex-col items-center gap-3 py-10 rounded-xl border border-dashed border-zinc-200 bg-zinc-50">
                <div class="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                    <ArrowsRightLeftIcon class="w-5 h-5 text-zinc-400" />
                </div>
                <p class="font-black text-zinc-800">No transactions yet</p>
                <p class="text-sm font-medium text-zinc-500">Top up your wallet to start building transaction history.</p>
            </div>

            <!-- Transaction list -->
            <div v-else class="space-y-2">
                <article v-for="tx in transactions" :key="tx.id"
                    class="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3.5 hover:border-zinc-200 hover:-translate-y-px transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                        <div
                            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            :class="getTransactionDirection(tx) === 'credit' ? 'bg-[#edf9ef] text-[#1d9154]' : 'bg-[#fff0f1] text-[#d14b5c]'"
                        >
                            <component :is="getTransactionDirection(tx) === 'credit' ? ArrowDownIcon : ArrowUpIcon" class="w-4 h-4" />
                        </div>
                        <div class="min-w-0">
                            <h4 class="text-sm font-semibold text-zinc-900 truncate">{{ formatTransactionDescription(tx) }}</h4>
                            <p class="text-xs text-zinc-400 mt-0.5">{{ formatDate(tx.created_at) }}</p>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <strong
                            class="text-sm font-black"
                            :class="getTransactionDirection(tx) === 'credit' ? 'text-[#1d9154]' : 'text-[#d14b5c]'"
                        >
                            {{ getTransactionDirection(tx) === 'credit' ? '+' : '-' }}GHS {{ parseFloat(tx.amount).toFixed(2) }}
                        </strong>
                        <p class="text-[10px] text-zinc-400 mt-0.5">{{ getTransactionNote(tx) }}</p>
                    </div>
                </article>
            </div>
        </section>

        <!-- Insurance feature banner -->
        <section class="flex items-center gap-5 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
            <div class="w-11 h-11 bg-[#f4ecfb] text-[#5e3a86] rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheckIcon class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-black text-zinc-900 text-sm">Insurance Sync Beta</p>
                <p class="text-xs text-zinc-500 mt-0.5">Connect private healthcare cover later and manage credits from one calm wallet space.</p>
            </div>
            <button type="button" class="inline-flex items-center border border-zinc-200 bg-white px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors flex-shrink-0">
                Join Beta
            </button>
        </section>

        <!-- Top Up Modal -->
        <div v-if="showTopUp" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4" @click.self="showTopUp = false">
            <div class="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div class="px-6 pt-6 pb-2">
                    <h3 class="font-black text-zinc-900 tracking-tight text-lg">Top Up Wallet</h3>
                    <p class="text-sm text-zinc-500 mt-0.5">Add funds via Paystack</p>
                </div>
                <div class="px-6 pb-6 space-y-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-semibold text-zinc-700">Amount (GHS)</label>
                        <input v-model.number="topUpAmount" type="number" min="1" step="0.01" placeholder="50.00"
                            class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 text-zinc-900 font-semibold" />
                    </div>
                    <div class="flex gap-2">
                        <button v-for="amt in [10, 20, 50, 100]" :key="amt" @click="topUpAmount = amt"
                            class="flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors"
                            :class="topUpAmount === amt ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'">
                            {{ amt }}
                        </button>
                    </div>
                    <div class="flex gap-3 pt-2">
                        <button @click="showTopUp = false"
                            class="flex-1 border border-zinc-200 bg-white text-zinc-700 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors">
                            Cancel
                        </button>
                        <button @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount <= 0"
                            class="flex-1 bg-zinc-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Pay GHS {{ (topUpAmount || 0).toFixed(2) }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast -->
        <div v-if="toast"
            class="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold"
            :class="toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="w-4 h-4 flex-shrink-0" />
            {{ toast.text }}
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useRoute, useRouter } from 'vue-router'
import {
    CreditCardIcon,
    ArrowPathIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    ArrowsRightLeftIcon,
    ExclamationTriangleIcon as ExcTriIcon,
    CheckCircleIcon,
    ShieldCheckIcon
} from '@heroicons/vue/24/outline'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const balance = ref(0)
const transactions = ref([])
const loading = ref(false)
const showTopUp = ref(false)
const topUpAmount = ref(50)
const toast = ref(null)
let topUpRefreshTimer = null
let topUpRefreshTicks = 0

const CREDIT_TYPES = new Set(['topup', 'refund', 'fee_credit'])
const DEBIT_TYPES = new Set(['request_fee', 'order_payment'])

const getTransactionDirection = (tx) => {
    const type = String(tx?.transaction_type || '').toLowerCase()
    if (CREDIT_TYPES.has(type)) return 'credit'
    if (DEBIT_TYPES.has(type)) return 'debit'

    const description = String(tx?.description || '').toLowerCase()
    if (description.includes('returned') || description.includes('refund') || description.includes('top-up') || description.includes('top up')) {
        return 'credit'
    }
    return 'debit'
}

const formatTransactionDescription = (tx) => {
    const type = String(tx?.transaction_type || '').toLowerCase()
    const description = String(tx?.description || '').trim()

    if (description) {
        return description
            .replace(/^Request submission fee/i, 'Priority Search hold')
            .replace(/^Request fee credited back/i, 'Priority Search hold returned')
    }

    const labels = {
        topup: 'Wallet top-up',
        request_fee: 'Priority Search hold placed',
        fee_credit: 'Priority Search hold returned',
        refund: 'Priority Search hold refunded',
        order_payment: 'Order payment'
    }

    return labels[type] || 'Wallet activity'
}

const extractRequestNumber = (tx) => {
    const description = String(tx?.description || '')
    const match = description.match(/REQ-\d{8}-\d{4}/i)
    return match ? match[0].toUpperCase() : ''
}

const sortWalletTransactions = (entries = []) => {
    return [...entries].sort((left, right) => {
        const leftRef = String(left?.paystack_reference || '').trim()
        const rightRef = String(right?.paystack_reference || '').trim()
        const leftType = String(left?.transaction_type || '').toLowerCase()
        const rightType = String(right?.transaction_type || '').toLowerCase()
        const leftRequestNumber = extractRequestNumber(left)
        const rightRequestNumber = extractRequestNumber(right)
        const leftAmount = Number(left?.amount || 0)
        const rightAmount = Number(right?.amount || 0)

        const isSamePaystackPair = leftRef && rightRef && leftRef === rightRef
        const isSameLegacyRequestPair = !isSamePaystackPair
            && leftRequestNumber
            && rightRequestNumber
            && leftRequestNumber === rightRequestNumber
            && Math.abs(leftAmount - rightAmount) < 0.01

        if (isSamePaystackPair || isSameLegacyRequestPair) {
            const pairOrder = { topup: 0, order_payment: 1 }
            const leftRank = pairOrder[leftType]
            const rightRank = pairOrder[rightType]
            if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
                return leftRank - rightRank
            }
        }

        const rightTime = new Date(right?.created_at || 0).getTime()
        const leftTime = new Date(left?.created_at || 0).getTime()
        if (rightTime !== leftTime) return rightTime - leftTime

        return Number(right?.id || 0) - Number(left?.id || 0)
    })
}

const creditTransactions = computed(() => transactions.value.filter(tx => getTransactionDirection(tx) === 'credit'))
const debitTransactions = computed(() => transactions.value.filter(tx => getTransactionDirection(tx) === 'debit'))

const currentMonthLabel = computed(() => new Date().toLocaleDateString('en-GB', { month: 'long' }))

const getTransactionNote = (tx) => {
    const reference = String(tx?.paystack_reference || '').trim()
    const requestNumber = extractRequestNumber(tx)
    const type = String(tx?.transaction_type || '').toLowerCase()

    if (reference) return `Reference: ${reference}`
    if (requestNumber && type === 'order_payment') return `Success · ${requestNumber}`
    if (requestNumber) return requestNumber
    if (type === 'topup') return 'Wallet funding'
    if (type === 'request_fee') return 'Priority Search'
    if (type === 'fee_credit' || type === 'refund') return 'Returned to wallet'
    if (type === 'order_payment') return 'Order payment'
    return 'Wallet activity'
}

const apiCall = async (method, url, data = null) => {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userStore.customerAuthToken}` } }
    if (data) opts.body = JSON.stringify(data)
    const res = await fetch(`${apiBase}${url}`, opts)
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || `Error ${res.status}`)
    return json
}

const fetchBalance = async () => {
    try {
        const res = await apiCall('GET', '/api/wallet')
        balance.value = parseFloat(res.data?.balance || 0)
    } catch (e) { balance.value = 0 }
}

const fetchTransactions = async () => {
    loading.value = true
    try {
        const res = await apiCall('GET', '/api/wallet/transactions')
        transactions.value = sortWalletTransactions(res.data || [])
    } catch (e) { showToast('Failed to load transactions', 'error') }
    finally { loading.value = false }
}

const stopTopUpRefreshPolling = () => {
    if (topUpRefreshTimer) {
        clearInterval(topUpRefreshTimer)
        topUpRefreshTimer = null
    }
    topUpRefreshTicks = 0
}

const refreshWalletData = async () => {
    await Promise.allSettled([fetchBalance(), fetchTransactions()])
}

const startTopUpRefreshPolling = () => {
    stopTopUpRefreshPolling()
    topUpRefreshTicks = 0
    topUpRefreshTimer = setInterval(async () => {
        topUpRefreshTicks += 1
        await refreshWalletData()
        if (topUpRefreshTicks >= 6) {
            stopTopUpRefreshPolling()
        }
    }, 5000)
}

const initiateTopUp = async () => {
    if (!topUpAmount.value || topUpAmount.value <= 0) return
    try {
        const res = await apiCall('POST', '/api/wallet/topup', { amount: topUpAmount.value })
        if (res.data?.authorization_url) {
            window.location.assign(res.data.authorization_url)
        }
        showTopUp.value = false
        showToast('Redirecting to payment...')
        startTopUpRefreshPolling()
    } catch (e) { showToast(e.message || 'Failed to initiate payment', 'error') }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
}) : ''

const showToast = (text, type = 'success') => {
    toast.value = { text, type }
    setTimeout(() => { toast.value = null }, 4000)
}

const verifyPayment = async () => {
    const trxRef = route.query.trxref || route.query.reference
    if (!trxRef) return

    loading.value = true
    try {
        const res = await apiCall('GET', `/api/wallet/topup/verify/${trxRef}`)
        if (res.success) {
            stopTopUpRefreshPolling()
            showToast('Wallet topped up successfully!')
            balance.value = parseFloat(res.data?.balance ?? res.data?.balance_after ?? balance.value)
            fetchTransactions()
            router.replace({ query: { tab: 'wallet' } })
        }
    } catch (e) {
        showToast(e.message || 'Payment verification failed', 'error')
    } finally {
        loading.value = false
    }
}

const handleWindowFocus = () => {
    fetchBalance()
    fetchTransactions()
    if (route.query.trxref || route.query.reference) {
        verifyPayment()
    }
}

onMounted(() => {
    fetchBalance()
    fetchTransactions()
    if (route.query.trxref || route.query.reference) verifyPayment()
    window.addEventListener('focus', handleWindowFocus)
})

watch(
    () => [route.query.trxref, route.query.reference],
    ([trxref, reference]) => {
        if (trxref || reference) {
            verifyPayment()
        }
    }
)

onUnmounted(() => {
    stopTopUpRefreshPolling()
    window.removeEventListener('focus', handleWindowFocus)
})

defineExpose({ fetchBalance, fetchTransactions })
</script>

