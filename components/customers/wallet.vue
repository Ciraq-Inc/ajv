<template>
    <div class="space-y-6 w-full">
        <!-- Header -->
        <header class="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 mb-4">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
                    <WalletIcon class="w-[18px] h-[18px]" />
                </div>
                <div>
                    <h1 class="text-lg font-bold text-zinc-900 tracking-tight">Wallet</h1>
                    <p class="text-xs text-zinc-500 font-medium mt-0.5">Credits and transaction history</p>
                </div>
            </div>
            <button @click="fetchTransactions" :disabled="loading"
                class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-50">
                <ArrowPathIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
                Refresh
            </button>
        </header>

        <div class="space-y-6">
            <!-- Hero grid: balance card + stat cards -->
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                <!-- Bright balance card -->
                <section class="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 min-h-[160px] flex flex-col justify-between shadow-sm">
                    <div class="flex items-start justify-between gap-3 relative z-10">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Available Balance</p>
                            <div class="flex items-end gap-1.5 mt-1">
                                <span class="text-lg font-semibold text-zinc-500 leading-none mb-0.5">GHS</span>
                                <strong class="text-4xl font-black tracking-tight leading-none text-zinc-900 tabular-nums">{{ balance.toFixed(2) }}</strong>
                            </div>
                        </div>
                        <button @click="showTopUp = true" class="inline-flex items-center gap-2 bg-[#4F217A] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#3d1861] transition-colors flex-shrink-0 shadow-sm">
                            <CreditCardIcon class="w-4 h-4" />
                            Top Up
                        </button>
                    </div>

                    <!-- Decorative soft accents -->
                    <div class="absolute -top-16 -right-10 w-48 h-48 rounded-full opacity-[0.03] bg-[#4F217A]"></div>
                    <div class="absolute -bottom-16 -left-8 w-40 h-40 rounded-full opacity-[0.02] bg-[#4F217A]"></div>
                </section>

                <!-- Stat mini cards -->
                <div class="flex lg:flex-col gap-3">
                    <article class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white shadow-sm px-5 py-4 flex-1 lg:flex-auto">
                        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                            <ArrowDownIcon class="w-5 h-5" />
                        </div>
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Credited</p>
                            <h3 class="text-base font-black text-zinc-900 leading-none mt-1 tabular-nums">GHS {{ creditTotal.toFixed(2) }}</h3>
                            <p class="text-[10px] font-medium text-zinc-400 mt-1 tabular-nums">{{ creditTransactions.length }} {{ creditTransactions.length === 1 ? 'entry' : 'entries' }}</p>
                        </div>
                    </article>

                    <article class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white shadow-sm px-5 py-4 flex-1 lg:flex-auto">
                        <div class="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center flex-shrink-0">
                            <ArrowUpIcon class="w-5 h-5" />
                        </div>
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Debited</p>
                            <h3 class="text-base font-black text-zinc-900 leading-none mt-1 tabular-nums">GHS {{ debitTotal.toFixed(2) }}</h3>
                            <p class="text-[10px] font-medium text-zinc-400 mt-1 tabular-nums">{{ debitTransactions.length }} {{ debitTransactions.length === 1 ? 'entry' : 'entries' }}</p>
                        </div>
                    </article>
                </div>
            </div>

            <!-- Transactions -->
            <section class="rounded-xl border border-zinc-200 bg-white shadow-sm pt-5 overflow-hidden">
                <div class="flex items-center justify-between gap-3 mb-4 px-5">
                    <div class="flex items-center gap-3">
                        <h3 class="font-black text-zinc-900 text-base tracking-tight">Recent Transactions</h3>
                        <span class="inline-flex items-center rounded-full px-3 py-1 bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-black uppercase tracking-[0.12em]">{{ currentMonthLabel }}</span>
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-zinc-400 border-t border-zinc-200 bg-zinc-50">
                    <ArrowPathIcon class="w-7 h-7 animate-spin mb-3" />
                    <p class="text-sm font-medium text-zinc-500">Loading transactions...</p>
                </div>

                <!-- Empty -->
                <div v-else-if="transactions.length === 0" class="flex flex-col items-center justify-center py-16 border-t border-zinc-200 bg-zinc-50">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-zinc-200 shadow-sm mb-4">
                        <ClipboardDocumentListIcon class="w-6 h-6 text-zinc-300" />
                    </div>
                    <p class="text-base font-bold text-zinc-900 mb-1 leading-tight">No transactions yet</p>
                    <p class="text-sm font-medium text-zinc-500">Top up your wallet to start building transaction history.</p>
                </div>

            <!-- Transaction list -->
            <div v-else class="space-y-0 text-sm border-y border-zinc-200 bg-white">
                <article v-for="tx in transactions" :key="tx.id"
                    class="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b last:border-b-0 border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer group gap-3 sm:gap-4"
                >
                    <div class="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <div
                            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5 sm:mt-0 transition-colors shadow-sm"
                            :class="getTransactionDirection(tx) === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-100'"
                        >
                            <component :is="getTransactionDirection(tx) === 'credit' ? ArrowDownIcon : ArrowUpIcon" class="w-5 h-5" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <h4 class="text-sm font-bold text-zinc-900 leading-tight mb-1" :title="formatTransactionDescription(tx)">{{ formatTransactionDescription(tx) }}</h4>
                            <p class="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                                {{ formatDate(tx.created_at) }}
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-row-reverse sm:flex-col items-center sm:items-end justify-between sm:justify-center flex-shrink-0 pl-[52px] sm:pl-0 gap-2 sm:gap-1.5">
                        <strong
                            class="text-[15px] font-black tabular-nums tracking-tight"
                            :class="getTransactionDirection(tx) === 'credit' ? 'text-[#1d9154]' : 'text-red-600'"
                        >
                            {{ getTransactionDirection(tx) === 'credit' ? '+' : '-' }}GHS {{ parseFloat(tx.amount).toFixed(2) }}
                        </strong>
                        <span v-if="getTransactionNote(tx)" class="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-zinc-50 text-zinc-500 border-zinc-200 shadow-sm max-w-[150px] sm:max-w-xs truncate" :title="getTransactionNote(tx)">
                            {{ getTransactionNote(tx) }}
                        </span>
                    </div>
                </article>
            </div>
        </section>

        </div>

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
                            :class="topUpAmount === amt ? 'bg-[#4F217A] text-white border-[#4F217A]' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'">
                            {{ amt }}
                        </button>
                    </div>
                    <div class="flex gap-3 pt-2">
                        <button @click="showTopUp = false"
                            class="flex-1 border border-zinc-200 bg-white text-zinc-700 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors">
                            Cancel
                        </button>
                        <button @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount <= 0 || isPaying"
                            class="flex-1 inline-flex items-center justify-center gap-2 bg-[#4F217A] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#3d1861] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <ArrowPathIcon v-if="isPaying" class="w-[18px] h-[18px] animate-spin" />
                            <span>{{ isPaying ? 'Starting…' : `Pay GHS ${(topUpAmount || 0).toFixed(2)}` }}</span>
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
    ShieldCheckIcon,
    WalletIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/vue/24/outline'

import { createCustomerWalletService } from '~/services/customerWallet/customerWalletService'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const walletService = createCustomerWalletService(useApi())

const balance = ref(0)
const transactions = ref([])
const loading = ref(false)
const showTopUp = ref(false)
const topUpAmount = ref(50)
const isPaying = ref(false)
const toast = ref(null)
let topUpRefreshTimer = null
let topUpRefreshTicks = 0

const CREDIT_TYPES = new Set(['topup', 'refund', 'fee_credit', 'payment_credit'])
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

    if (type === 'payment_credit') {
        return description
            ? description.replace(/^Paystack funding received for/i, 'Request payment received for')
            : 'Request payment received'
    }

    if (type === 'fee_credit' && description.toLowerCase().includes('paystack funding received for')) {
        return description.replace(/^Paystack funding received for/i, 'Request payment received for')
    }

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
        payment_credit: 'Request payment received',
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
            const pairOrder = { topup: 0, refund: 0, fee_credit: 0, payment_credit: 0, request_fee: 1, order_payment: 1 }
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
const sumAmount = (entries) => entries.reduce((acc, tx) => acc + (parseFloat(tx?.amount) || 0), 0)
const creditTotal = computed(() => sumAmount(creditTransactions.value))
const debitTotal = computed(() => sumAmount(debitTransactions.value))

const currentMonthLabel = computed(() => new Date().toLocaleDateString('en-GB', { month: 'long' }))

const getTransactionNote = (tx) => {
    const reference = String(tx?.paystack_reference || '').trim()
    const requestNumber = extractRequestNumber(tx)
    const type = String(tx?.transaction_type || '').toLowerCase()
    const description = String(tx?.description || '').toLowerCase()

    if (reference) return `Reference: ${reference}`
    if (requestNumber && type === 'order_payment') return `Success · ${requestNumber}`
    if (requestNumber) return requestNumber
    if (type === 'topup') return 'Wallet funding'
    if (type === 'payment_credit' || (type === 'fee_credit' && description.includes('paystack funding received for'))) return 'Request payment'
    if (type === 'request_fee') return 'Priority Search'
    if (type === 'fee_credit' || type === 'refund') return 'Returned to wallet'
    if (type === 'order_payment') return 'Order payment'
    return 'Wallet activity'
}

// Preserves the legacy `if (!res.ok || !json.success)` envelope contract:
// useApi already throws on non-2xx (covers `!res.ok`), and we assert
// `json.success` explicitly here. Error messages mirror the legacy text
// where the server provides one.
const assertEnvelope = (json) => {
    if (!json || !json.success) throw new Error(json?.message || 'Request failed')
    return json
}

const fetchBalance = async () => {
    try {
        const res = assertEnvelope(await walletService.getBalance())
        balance.value = parseFloat(res.data?.balance || 0)
    } catch (e) { balance.value = 0 }
}

const fetchTransactions = async () => {
    loading.value = true
    try {
        const res = assertEnvelope(await walletService.getTransactions())
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
    if (isPaying.value) return
    isPaying.value = true
    try {
        const res = assertEnvelope(await walletService.initiateTopUp({ amount: topUpAmount.value }))
        if (res.data?.authorization_url) {
            showToast('Redirecting to payment...')
            startTopUpRefreshPolling()
            window.location.assign(res.data.authorization_url)
            return
        }
        showTopUp.value = false
        showToast('Could not start payment. Please try again.', 'error')
    } catch (e) {
        showToast(e.message || 'Failed to initiate payment', 'error')
    } finally {
        isPaying.value = false
    }
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
        const res = await walletService.verifyTopUp(trxRef)
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

