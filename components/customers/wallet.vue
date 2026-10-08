<template>
    <div class="min-h-screen pb-32 font-body">

        <div class="space-y-4 px-4 pt-4">

            <!-- Balance -->
            <section aria-labelledby="wallet-balance-title" class="rounded-3xl bg-brand-700 p-6 text-white">
                <div class="flex items-center gap-2">
                    <WalletIcon class="h-5 w-5 text-brand-100" aria-hidden="true" />
                    <h2 id="wallet-balance-title" class="text-base font-semibold text-brand-100">Available balance</h2>
                </div>
                <p class="mt-3 flex items-end gap-2">
                    <span class="mb-1 text-lg font-semibold text-brand-100">GHS</span>
                    <strong class="font-display text-5xl font-bold leading-none tabular-nums">{{ balance.toFixed(2) }}</strong>
                </p>

                <div v-if="isVerifying" role="status" class="mt-3 flex items-center gap-2 text-base text-brand-50">
                    <ArrowPathIcon class="h-5 w-5 flex-shrink-0 animate-spin" aria-hidden="true" />
                    <span>Verifying your top-up…</span>
                </div>
                <div v-if="topUpConfirmed" role="status" class="mt-3 flex items-center gap-2 text-base font-semibold text-white">
                    <CheckCircleIcon class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span>Top-up confirmed</span>
                </div>
                <p v-if="verifyTimedOut" role="status" class="mt-3 max-w-xs text-base text-brand-50">
                    Payment verification is taking longer than usual. Your balance will update shortly.
                </p>

                <button type="button" @click="showTopUp = true"
                    class="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700">
                    <CreditCardIcon class="h-5 w-5" aria-hidden="true" />
                    Top up wallet
                </button>
            </section>

            <!-- Recent transactions -->
            <section aria-labelledby="wallet-history-title" class="overflow-hidden rounded-3xl bg-white shadow-lift">
                <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                    <h2 id="wallet-history-title" class="font-display text-xl font-bold text-ink-900">Recent transactions</h2>
                    <span class="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{{ currentMonthLabel }}</span>
                </div>

                <div v-if="loading" role="status" class="flex flex-col items-center px-6 py-12 text-center">
                    <ArrowPathIcon class="h-8 w-8 animate-spin text-brand-700" aria-hidden="true" />
                    <p class="mt-3 text-base font-semibold text-ink-900">Loading transactions</p>
                </div>

                <div v-else-if="transactions.length === 0" class="flex flex-col items-center px-6 py-12 text-center">
                    <span class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <WalletIcon class="h-8 w-8" aria-hidden="true" />
                    </span>
                    <p class="mt-4 font-display text-lg font-bold text-ink-900">No transactions yet</p>
                    <p class="mt-1 max-w-xs text-base text-ink-600">Top up your wallet to start building your history.</p>
                    <button type="button" @click="showTopUp = true"
                        class="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                        <CreditCardIcon class="h-5 w-5" aria-hidden="true" />
                        Top up now
                    </button>
                </div>

                <ul v-else class="divide-y divide-ink-100">
                    <li v-for="tx in transactions" :key="tx.id ?? ''" class="flex items-start gap-3 px-5 py-4">
                        <span class="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                            :class="getTransactionDirection(tx) === 'credit' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600'">
                            <component :is="getTransactionDirection(tx) === 'credit' ? ArrowDownIcon : ArrowUpIcon" class="h-5 w-5" aria-hidden="true" />
                        </span>

                        <div class="min-w-0 flex-1">
                            <p class="truncate text-base font-semibold text-ink-900" :title="formatTransactionDescription(tx)">
                                {{ formatTransactionDescription(tx) }}
                            </p>
                            <p class="text-sm text-ink-600">{{ formatDate(tx.created_at) }}</p>
                            <p v-if="getTransactionNote(tx)" class="mt-0.5 truncate text-sm text-ink-600" :title="getTransactionNote(tx)">
                                {{ getTransactionNote(tx) }}
                            </p>
                        </div>

                        <div class="flex-shrink-0 text-right">
                            <strong class="block text-base font-bold tabular-nums"
                                :class="getTransactionDirection(tx) === 'credit' ? 'text-brand-700' : 'text-ink-900'">
                                {{ getTransactionDirection(tx) === 'credit' ? '+' : '-' }}GHS {{ parseFloat(String(tx.amount ?? 0)).toFixed(2) }}
                            </strong>
                            <span class="text-sm text-ink-600">{{ getTransactionDirection(tx) === 'credit' ? 'Credit' : 'Debit' }}</span>
                        </div>
                    </li>
                </ul>
            </section>
        </div>

        <!-- Top up -->
        <div v-if="showTopUp" data-testid="topup-backdrop"
            class="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
            @click.self="showTopUp = false">
            <div ref="topUpDialogRef" role="dialog" aria-modal="true" aria-labelledby="topup-title"
                class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h2 id="topup-title" class="font-display text-2xl font-bold text-ink-900">Top up wallet</h2>
                        <p class="text-base text-ink-600">Secured by Paystack</p>
                    </div>
                    <button type="button" aria-label="Close" @click="showTopUp = false"
                        class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                        <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <div class="mt-5 space-y-4">
                    <div>
                        <label for="topup-amount" class="text-base font-semibold text-ink-900">Amount to credit (GHS)</label>
                        <div class="relative mt-1">
                            <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-semibold text-ink-600" aria-hidden="true">GHS</span>
                            <input id="topup-amount" v-model.number="topUpAmount" type="number" inputmode="decimal" min="1" step="0.01" placeholder="0.00" autocomplete="off"
                                class="min-h-[44px] w-full rounded-2xl border-0 bg-ink-50 py-3 pl-16 pr-4 text-xl font-bold tabular-nums text-ink-900 ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-700" />
                        </div>
                    </div>

                    <div class="grid grid-cols-4 gap-2">
                        <button v-for="amt in [10, 20, 50, 100]" :key="amt" type="button"
                            :aria-pressed="topUpAmount === amt ? 'true' : 'false'" @click="topUpAmount = amt"
                            class="min-h-[44px] rounded-full text-base font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                            :class="topUpAmount === amt ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-brand-700 ring-brand-200 hover:bg-brand-50'">
                            {{ amt }}
                        </button>
                    </div>

                    <dl v-if="topUpAmount > 0" class="space-y-2 rounded-2xl bg-ink-50 px-4 py-4">
                        <div class="flex justify-between text-base text-ink-900">
                            <dt>Amount to credit</dt>
                            <dd class="font-semibold tabular-nums">GHS {{ topUpAmount.toFixed(2) }}</dd>
                        </div>
                        <div class="flex justify-between text-base text-ink-600">
                            <dt>Paystack fee (1.95% + GH₵0.50)</dt>
                            <dd class="tabular-nums">GHS {{ topUpFee.toFixed(2) }}</dd>
                        </div>
                        <div class="flex justify-between border-t border-ink-200 pt-2 text-lg font-bold text-ink-900">
                            <dt>Total to pay</dt>
                            <dd class="tabular-nums text-brand-700">GHS {{ topUpTotal.toFixed(2) }}</dd>
                        </div>
                    </dl>

                    <div class="flex flex-col-reverse gap-2 sm:flex-row">
                        <button type="button" @click="showTopUp = false"
                            class="min-h-[44px] flex-1 rounded-full bg-white px-5 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                            Cancel
                        </button>
                        <button type="button" @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount <= 0 || isPaying"
                            class="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-700 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:opacity-60">
                            <ArrowPathIcon v-if="isPaying" class="h-5 w-5 animate-spin" aria-hidden="true" />
                            <span>{{ isPaying ? 'Starting…' : `Pay GHS ${topUpTotal.toFixed(2)}` }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast -->
        <div v-if="toast" data-testid="toast" :role="toast.type === 'error' ? 'alert' : 'status'"
            class="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold text-white shadow-lift lg:bottom-6"
            :class="toast.type === 'error' ? 'bg-red-700' : 'bg-brand-700'">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="h-6 w-6 flex-shrink-0" aria-hidden="true" />
            {{ toast.text }}
        </div>

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
    XMarkIcon,
} from '@heroicons/vue/24/outline'

import { useModalA11y } from '~/composables/useModalA11y'
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
const topUpDialogRef = ref<HTMLElement | null>(null)
useModalA11y(topUpDialogRef, () => showTopUp.value, () => { showTopUp.value = false })
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
