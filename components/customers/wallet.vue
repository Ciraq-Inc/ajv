<template>
    <div class="min-h-screen pb-32">

        <div class="px-4 space-y-4 pt-4">

            <!-- ─── Balance hero card ───────────────────────────────────── -->
            <section
                class="relative overflow-hidden rounded-3xl p-6 min-h-[172px] flex flex-col justify-between"
                style="background: linear-gradient(135deg, #4F217A 0%, #6b2fa0 55%, #3d1861 100%);"
            >
                <!-- Decorative circles -->
                <div class="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/[0.06] pointer-events-none"></div>
                <div class="absolute -bottom-14 -left-6 w-52 h-52 rounded-full bg-white/[0.04] pointer-events-none"></div>
                <div class="absolute top-1/2 right-8 -translate-y-1/2 w-24 h-24 rounded-full bg-white/[0.05] pointer-events-none"></div>

                <!-- Balance label + amount -->
                <div class="relative z-10">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <WalletIcon class="w-3.5 h-3.5 text-white" aria-hidden="true" />
                        </div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Available Balance</p>
                    </div>
                    <div class="flex items-end gap-2">
                        <span class="text-lg font-semibold text-white/60 leading-none mb-1">GHS</span>
                        <strong class="text-5xl font-black tracking-tighter leading-none text-white tabular-nums">{{ balance.toFixed(2) }}</strong>
                    </div>
                    <!-- Verification / confirmation states -->
                    <div v-if="isVerifying" class="mt-2 flex items-center gap-2 text-white/80">
                        <ArrowPathIcon class="w-3.5 h-3.5 animate-spin flex-shrink-0" aria-hidden="true" />
                        <span class="text-[11px] font-semibold">Verifying top-up...</span>
                    </div>
                    <Transition
                        enter-active-class="transition duration-300 ease-out"
                        enter-from-class="opacity-0 translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-500 ease-in"
                        leave-from-class="opacity-100"
                        leave-to-class="opacity-0"
                    >
                        <div v-if="topUpConfirmed" class="mt-2 flex items-center gap-2 text-emerald-300">
                            <CheckCircleIcon class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                            <span class="text-[11px] font-bold">Top-up confirmed</span>
                        </div>
                    </Transition>
                    <div v-if="verifyTimedOut" class="mt-2 text-[11px] font-semibold text-amber-300 leading-snug max-w-[260px]">
                        Payment verification is taking longer than usual — your balance will update shortly.
                    </div>
                </div>

                <!-- Top Up CTA -->
                <div class="relative z-10 mt-5">
                    <button
                        @click="showTopUp = true"
                        class="inline-flex items-center gap-2 bg-white text-[#4F217A] px-5 py-2.5 rounded-2xl text-sm font-black hover:bg-[#f0e8ff] active:scale-95 transition-all shadow-md"
                    >
                        <CreditCardIcon class="w-4 h-4" aria-hidden="true" />
                        Top Up Wallet
                    </button>
                </div>
            </section>

            <!-- ─── Recent Transactions ─────────────────────────────────── -->
            <section class="bg-white rounded-3xl border border-[#e4d9f5] shadow-sm overflow-hidden">

                <!-- Section header -->
                <div class="px-5 pt-5 pb-4 flex items-center justify-between border-b border-[#f0e8ff]">
                    <h2 class="text-[15px] font-black text-[#1a0a2e] tracking-tight">Recent Transactions</h2>
                    <span class="inline-flex items-center rounded-full px-3 py-1 bg-[#f0e8ff] text-[#4F217A] text-[10px] font-black uppercase tracking-[0.14em]">
                        {{ currentMonthLabel }}
                    </span>
                </div>

                <!-- Loading state -->
                <div v-if="loading" class="flex flex-col items-center justify-center py-14 px-6">
                    <div class="w-14 h-14 rounded-2xl bg-[#f0e8ff] flex items-center justify-center mb-4">
                        <ArrowPathIcon class="w-6 h-6 text-[#4F217A] animate-spin" aria-hidden="true" />
                    </div>
                    <p class="text-sm font-bold text-[#1a0a2e]">Loading transactions</p>
                    <p class="text-xs text-[#9b7ec0] mt-1">Fetching your history...</p>
                </div>

                <!-- Empty state -->
                <div v-else-if="transactions.length === 0" class="flex flex-col items-center justify-center py-14 px-6 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-[#f0e8ff] flex items-center justify-center mb-4">
                        <!-- Inline SVG wallet-with-coin illustration -->
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="9" width="26" height="18" rx="4" fill="#e4d9f5"/>
                            <rect x="2" y="9" width="26" height="6" rx="2" fill="#c4a8e8"/>
                            <circle cx="23" cy="20" r="4" fill="#4F217A"/>
                            <path d="M23 18.5v3M21.5 20h3" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
                            <rect x="6" y="5" width="14" height="4" rx="2" fill="#c4a8e8"/>
                        </svg>
                    </div>
                    <p class="text-base font-black text-[#1a0a2e] mb-1">No transactions yet</p>
                    <p class="text-sm text-[#7c5fa0] leading-relaxed max-w-[220px]">Top up your wallet to start building your transaction history.</p>
                    <button
                        @click="showTopUp = true"
                        class="mt-5 inline-flex items-center gap-2 bg-[#4F217A] text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-[#3d1861] transition-colors"
                    >
                        <CreditCardIcon class="w-4 h-4" aria-hidden="true" />
                        Top Up Now
                    </button>
                </div>

                <!-- Transaction list -->
                <ul v-else role="list" class="divide-y divide-[#f5f0fb]">
                    <li
                        v-for="tx in transactions"
                        :key="tx.id ?? ''"
                        class="flex items-start gap-3 px-5 py-4 hover:bg-[#faf8ff] active:bg-[#f5f0fb] transition-colors cursor-default"
                    >
                        <!-- Direction icon -->
                        <div
                            class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            :class="getTransactionDirection(tx) === 'credit'
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'bg-rose-50 border border-rose-100'"
                        >
                            <component
                                :is="getTransactionDirection(tx) === 'credit' ? ArrowDownIcon : ArrowUpIcon"
                                class="w-3.5 h-3.5"
                                :class="getTransactionDirection(tx) === 'credit' ? 'text-emerald-600' : 'text-rose-500'"
                                aria-hidden="true"
                            />
                        </div>

                        <!-- Description + meta -->
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-bold text-[#1a0a2e] leading-snug truncate" :title="formatTransactionDescription(tx)">
                                {{ formatTransactionDescription(tx) }}
                            </p>
                            <p class="text-[11px] text-[#9b7ec0] font-medium mt-0.5">
                                {{ formatDate(tx.created_at) }}
                            </p>
                            <!-- Reference / note chip -->
                            <span
                                v-if="getTransactionNote(tx)"
                                class="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#f5f0fb] text-[#7c5fa0] max-w-[180px] truncate"
                                :title="getTransactionNote(tx)"
                            >
                                {{ getTransactionNote(tx) }}
                            </span>
                        </div>

                        <!-- Amount + type pill -->
                        <div class="flex flex-col items-end gap-1.5 flex-shrink-0 pt-0.5">
                            <strong
                                class="text-[15px] font-black tabular-nums tracking-tight leading-none"
                                :class="getTransactionDirection(tx) === 'credit' ? 'text-emerald-600' : 'text-rose-500'"
                            >
                                {{ getTransactionDirection(tx) === 'credit' ? '+' : '-' }}GHS {{ parseFloat(String(tx.amount ?? 0)).toFixed(2) }}
                            </strong>
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide"
                                :class="getTransactionDirection(tx) === 'credit'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'"
                            >
                                {{ getTransactionDirection(tx) === 'credit' ? 'Credit' : 'Debit' }}
                            </span>
                        </div>
                    </li>
                </ul>

            </section>
        </div>

        <!-- ─── Top Up bottom-sheet modal ──────────────────────────────── -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="showTopUp"
                class="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
                @click.self="showTopUp = false"
                role="dialog"
                aria-modal="true"
                aria-label="Top up wallet"
            >
                <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="translate-y-full"
                    enter-to-class="translate-y-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="translate-y-0"
                    leave-to-class="translate-y-full"
                >
                    <div v-if="showTopUp" class="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden">

                        <!-- Handle bar -->
                        <div class="flex justify-center pt-3 pb-1">
                            <div class="w-10 h-1 rounded-full bg-zinc-200"></div>
                        </div>

                        <!-- Modal header -->
                        <div class="px-6 pt-3 pb-2 flex items-start justify-between">
                            <div>
                                <h3 class="text-lg font-black text-[#1a0a2e] tracking-tight">Top Up Wallet</h3>
                                <p class="text-xs text-[#9b7ec0] mt-0.5 font-medium">Secured via Paystack</p>
                            </div>
                            <button
                                @click="showTopUp = false"
                                aria-label="Close top up modal"
                                class="w-8 h-8 rounded-full bg-[#f5f0fb] flex items-center justify-center text-[#7c5fa0] hover:bg-[#e4d9f5] transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            </button>
                        </div>

                        <div class="px-6 pb-8 space-y-4 mt-2">

                            <!-- Amount input -->
                            <div class="flex flex-col gap-1.5">
                                <label for="topup-amount" class="text-sm font-bold text-[#1a0a2e]">Amount to credit (GHS)</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9b7ec0]">GHS</span>
                                    <input
                                        id="topup-amount"
                                        v-model.number="topUpAmount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        placeholder="0.00"
                                        autocomplete="off"
                                        class="w-full rounded-2xl border border-[#e4d9f5] bg-[#faf8ff] pl-14 pr-4 py-3.5 text-xl font-black text-[#1a0a2e] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <!-- Quick-amount chips -->
                            <div class="grid grid-cols-4 gap-2">
                                <button
                                    v-for="amt in [10, 20, 50, 100]"
                                    :key="amt"
                                    @click="topUpAmount = amt"
                                    class="py-2.5 rounded-2xl border text-sm font-bold transition-all active:scale-95"
                                    :class="topUpAmount === amt
                                        ? 'bg-[#4F217A] text-white border-[#4F217A] shadow-sm'
                                        : 'border-[#e4d9f5] bg-white text-[#4F217A] hover:bg-[#f0e8ff]'"
                                >
                                    {{ amt }}
                                </button>
                            </div>

                            <!-- Fee breakdown -->
                            <div v-if="topUpAmount > 0" class="rounded-2xl border border-[#e4d9f5] bg-[#faf8ff] px-4 py-3.5 space-y-2">
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-[#7c5fa0] font-medium">Amount to credit</span>
                                    <span class="font-bold text-[#1a0a2e] tabular-nums">GHS {{ topUpAmount.toFixed(2) }}</span>
                                </div>
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-[#9b7ec0] font-medium text-xs">Paystack fee (1.95% + GH₵0.50)</span>
                                    <span class="text-[#9b7ec0] tabular-nums text-xs">GHS {{ topUpFee.toFixed(2) }}</span>
                                </div>
                                <div class="flex justify-between items-center pt-2 border-t border-[#e4d9f5]">
                                    <span class="text-sm font-black text-[#1a0a2e]">Total to pay</span>
                                    <span class="text-base font-black text-[#4F217A] tabular-nums">GHS {{ topUpTotal.toFixed(2) }}</span>
                                </div>
                            </div>

                            <!-- Action buttons -->
                            <div class="flex gap-3 pt-1">
                                <button
                                    @click="showTopUp = false"
                                    class="flex-1 border border-[#e4d9f5] bg-white text-[#7c5fa0] py-3.5 rounded-2xl text-sm font-bold hover:bg-[#f5f0fb] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    @click="initiateTopUp"
                                    :disabled="!topUpAmount || topUpAmount <= 0 || isPaying"
                                    class="flex-1 inline-flex items-center justify-center gap-2 bg-[#4F217A] text-white py-3.5 rounded-2xl text-sm font-black hover:bg-[#3d1861] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
                                >
                                    <ArrowPathIcon v-if="isPaying" class="w-4 h-4 animate-spin" aria-hidden="true" />
                                    <span>{{ isPaying ? 'Starting…' : `Pay GHS ${topUpTotal.toFixed(2)}` }}</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ─── Toast notification ──────────────────────────────────────── -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
        >
            <div
                v-if="toast"
                class="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold whitespace-nowrap max-w-[calc(100vw-2rem)]"
                :class="toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#1a0a2e] text-white'"
                role="alert"
                aria-live="polite"
            >
                <component
                    :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon"
                    class="w-4 h-4 flex-shrink-0"
                    aria-hidden="true"
                />
                {{ toast.text }}
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
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

interface WalletTransaction {
  id?: number;
  transaction_type?: string;
  description?: string;
  amount?: number | string;
  paystack_reference?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface WalletEnvelope {
  success: boolean;
  message?: string;
  data?: {
    balance?: number;
    balance_after?: number;
    authorization_url?: string;
    [key: string]: unknown;
  } | WalletTransaction[];
}

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const walletService = createCustomerWalletService(useApi())

const PAYSTACK_FEE_RATE = 0.0195
const PAYSTACK_FEE_FLAT = 0.50

const balance = ref<number>(0)
const transactions = ref<WalletTransaction[]>([])
const loading = ref<boolean>(false)
const showTopUp = ref<boolean>(false)
const topUpAmount = ref<number>(50)
const isPaying = ref<boolean>(false)
const isVerifying = ref<boolean>(false)
const topUpConfirmed = ref<boolean>(false)
const verifyTimedOut = ref<boolean>(false)
let topUpConfirmedTimer: ReturnType<typeof setTimeout> | null = null

const topUpFee = computed<number>(() => {
    const amt = topUpAmount.value || 0
    if (amt <= 0) return 0
    return Math.round((amt * PAYSTACK_FEE_RATE + PAYSTACK_FEE_FLAT) * 100) / 100
})
const topUpTotal = computed<number>(() => (topUpAmount.value || 0) + topUpFee.value)
const toast = ref<{ text: string; type: string } | null>(null)
let topUpRefreshTimer: ReturnType<typeof setInterval> | null = null
let topUpRefreshTicks = 0

const CREDIT_TYPES = new Set(['topup', 'refund', 'fee_credit', 'payment_credit'])
const DEBIT_TYPES = new Set(['request_fee', 'order_payment'])

const getTransactionDirection = (tx: WalletTransaction): 'credit' | 'debit' => {
    const type = String(tx.transaction_type ?? '').toLowerCase()
    if (CREDIT_TYPES.has(type)) return 'credit'
    if (DEBIT_TYPES.has(type)) return 'debit'

    const description = String(tx.description ?? '').toLowerCase()
    if (description.includes('returned') || description.includes('refund') || description.includes('top-up') || description.includes('top up')) {
        return 'credit'
    }
    return 'debit'
}

const formatTransactionDescription = (tx: WalletTransaction): string => {
    const type = String(tx.transaction_type ?? '').toLowerCase()
    const description = String(tx.description ?? '').trim()

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

    const labels: Record<string, string> = {
        topup: 'Wallet top-up',
        request_fee: 'Priority Search hold placed',
        fee_credit: 'Priority Search hold returned',
        refund: 'Priority Search hold refunded',
        payment_credit: 'Request payment received',
        order_payment: 'Order payment',
    }

    return labels[type] ?? 'Wallet activity'
}

const extractRequestNumber = (tx: WalletTransaction): string => {
    const description = String(tx.description ?? '')
    const match = description.match(/REQ-\d{8}-\d{4}/i)
    return match ? match[0].toUpperCase() : ''
}

const sortWalletTransactions = (entries: WalletTransaction[] = []): WalletTransaction[] => {
    return [...entries].sort((left, right) => {
        const leftRef = String(left.paystack_reference ?? '').trim()
        const rightRef = String(right.paystack_reference ?? '').trim()
        const leftType = String(left.transaction_type ?? '').toLowerCase()
        const rightType = String(right.transaction_type ?? '').toLowerCase()
        const leftRequestNumber = extractRequestNumber(left)
        const rightRequestNumber = extractRequestNumber(right)
        const leftAmount = Number(left.amount ?? 0)
        const rightAmount = Number(right.amount ?? 0)

        const isSamePaystackPair = leftRef && rightRef && leftRef === rightRef
        const isSameLegacyRequestPair = !isSamePaystackPair
            && leftRequestNumber
            && rightRequestNumber
            && leftRequestNumber === rightRequestNumber
            && Math.abs(leftAmount - rightAmount) < 0.01

        if (isSamePaystackPair || isSameLegacyRequestPair) {
            const pairOrder: Record<string, number> = { topup: 0, refund: 0, fee_credit: 0, payment_credit: 0, request_fee: 1, order_payment: 1 }
            const leftRank = pairOrder[leftType]
            const rightRank = pairOrder[rightType]
            if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
                return leftRank - rightRank
            }
        }

        const rightTime = new Date(right.created_at ?? 0).getTime()
        const leftTime = new Date(left.created_at ?? 0).getTime()
        if (rightTime !== leftTime) return rightTime - leftTime

        return Number(right.id ?? 0) - Number(left.id ?? 0)
    })
}

const creditTransactions = computed<WalletTransaction[]>(() =>
    transactions.value.filter(tx => getTransactionDirection(tx) === 'credit'))
const debitTransactions = computed<WalletTransaction[]>(() =>
    transactions.value.filter(tx => getTransactionDirection(tx) === 'debit'))
const sumAmount = (entries: WalletTransaction[]): number =>
    entries.reduce((acc, tx) => acc + (parseFloat(String(tx.amount ?? 0)) || 0), 0)
const creditTotal = computed<number>(() => sumAmount(creditTransactions.value))
const debitTotal = computed<number>(() => sumAmount(debitTransactions.value))

const currentMonthLabel = computed<string>(() =>
    new Date().toLocaleDateString('en-GB', { month: 'long' }))

const getTransactionNote = (tx: WalletTransaction): string => {
    const reference = String(tx.paystack_reference ?? '').trim()
    const requestNumber = extractRequestNumber(tx)
    const type = String(tx.transaction_type ?? '').toLowerCase()
    const description = String(tx.description ?? '').toLowerCase()

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
const assertEnvelope = (json: unknown): WalletEnvelope => {
    const j = json as WalletEnvelope | null
    if (!j?.success) throw new Error(j?.message ?? 'Request failed')
    return j
}

const fetchBalance = async (): Promise<void> => {
    try {
        const res = assertEnvelope(await walletService.getBalance())
        const d = res.data as { balance?: number } | undefined
        balance.value = parseFloat(String(d?.balance ?? 0))
    } catch { balance.value = 0 }
}

const fetchTransactions = async (): Promise<void> => {
    loading.value = true
    try {
        const res = assertEnvelope(await walletService.getTransactions())
        transactions.value = sortWalletTransactions((res.data as WalletTransaction[]) ?? [])
    } catch { showToast('Failed to load transactions', 'error') }
    finally { loading.value = false }
}

const stopTopUpRefreshPolling = (): void => {
    if (topUpRefreshTimer) {
        clearInterval(topUpRefreshTimer)
        topUpRefreshTimer = null
    }
    topUpRefreshTicks = 0
    isVerifying.value = false
}

const refreshWalletData = async (): Promise<void> => {
    await Promise.allSettled([fetchBalance(), fetchTransactions()])
}

const startTopUpRefreshPolling = (): void => {
    stopTopUpRefreshPolling()
    topUpRefreshTicks = 0
    topUpRefreshTimer = setInterval(async () => {
        topUpRefreshTicks += 1
        await refreshWalletData()
        if (topUpRefreshTicks >= 6) {
            stopTopUpRefreshPolling()
            verifyTimedOut.value = true
        }
    }, 5000)
}

const initiateTopUp = async (): Promise<void> => {
    if (!topUpAmount.value || topUpAmount.value <= 0) return
    if (isPaying.value) return
    isPaying.value = true
    try {
        const res = assertEnvelope(await walletService.initiateTopUp({ amount: topUpAmount.value }))
        const d = res.data as { authorization_url?: string } | undefined
        if (d?.authorization_url) {
            showToast('Redirecting to payment...')
            startTopUpRefreshPolling()
            window.location.assign(d.authorization_url)
            return
        }
        showTopUp.value = false
        showToast('Could not start payment. Please try again.', 'error')
    } catch (e) {
        showToast(e instanceof Error ? e.message : 'Failed to initiate payment', 'error')
    } finally {
        isPaying.value = false
    }
}

const formatDate = (d: string | undefined): string =>
    d ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }) : ''

const showToast = (text: string, type = 'success', duration = 4000): void => {
    toast.value = { text, type }
    setTimeout(() => { toast.value = null }, duration)
}

const verifyPayment = async (): Promise<void> => {
    const trxRef = route.query['trxref'] ?? route.query['reference']
    if (!trxRef) return

    isVerifying.value = true
    verifyTimedOut.value = false
    loading.value = true
    try {
        const res = await walletService.verifyTopUp(String(trxRef)) as WalletEnvelope
        if (res.success) {
            stopTopUpRefreshPolling()
            const d = res.data as { balance?: number; balance_after?: number } | undefined
            balance.value = parseFloat(String(d?.balance ?? d?.balance_after ?? balance.value))
            void fetchTransactions()
            void router.replace({ query: { tab: 'wallet' } })
            showToast('Wallet topped up successfully!', 'success', 8000)
            topUpConfirmed.value = true
            if (topUpConfirmedTimer) clearTimeout(topUpConfirmedTimer)
            topUpConfirmedTimer = setTimeout(() => { topUpConfirmed.value = false }, 6000)
        }
    } catch (e) {
        showToast(e instanceof Error ? e.message : 'Payment verification failed', 'error')
    } finally {
        isVerifying.value = false
        loading.value = false
    }
}

const handleWindowFocus = (): void => {
    void fetchBalance()
    void fetchTransactions()
    if (route.query['trxref'] ?? route.query['reference']) {
        void verifyPayment()
    }
}

onMounted(() => {
    void fetchBalance()
    void fetchTransactions()
    if (route.query['trxref'] ?? route.query['reference']) void verifyPayment()
    window.addEventListener('focus', handleWindowFocus)
})

watch(
    () => [route.query['trxref'], route.query['reference']],
    ([trxref, reference]) => {
        if (trxref || reference) {
            void verifyPayment()
        }
    }
)

onUnmounted(() => {
    stopTopUpRefreshPolling()
    window.removeEventListener('focus', handleWindowFocus)
    if (topUpConfirmedTimer) clearTimeout(topUpConfirmedTimer)
})

defineExpose({ fetchBalance, fetchTransactions })
</script>
