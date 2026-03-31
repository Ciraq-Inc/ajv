<template>
    <div class="wallet-page">
        <header class="wallet-intro">
            <div>
                <p class="wallet-intro-kicker">Wallet</p>
                <h2 class="wallet-intro-title">Financial Sanctuary</h2>
                <p class="wallet-intro-copy">Overview of your healthcare credits and spending.</p>
            </div>
        </header>

        <div class="wallet-hero-grid">
            <section class="wallet-balance-card">
                <div class="wallet-balance-top">
                    <div class="wallet-balance-copy">
                        <p class="wallet-card-kicker">Available Balance</p>
                        <div class="wallet-balance-line">
                            <span class="wallet-balance-currency">GHS</span>
                            <strong class="wallet-balance-amount">{{ balance.toFixed(2) }}</strong>
                        </div>
                    </div>

                    <button @click="showTopUp = true" class="wallet-topup-button">
                        <CreditCardIcon class="wallet-topup-icon" />
                        Top Up
                    </button>
                </div>

                <div class="wallet-balance-footer">
                    <div class="wallet-balance-note">
                        <h4>Top-up ready</h4>
                        <p>Keep your wallet funded so request and order payments move smoothly.</p>
                    </div>
                </div>

                <div class="wallet-balance-glow wallet-balance-glow-a"></div>
                <div class="wallet-balance-glow wallet-balance-glow-b"></div>
            </section>

            <div class="wallet-stat-column">
                <article class="wallet-mini-card">
                    <div class="wallet-mini-main">
                        <div class="wallet-mini-icon credit">
                            <ArrowDownIcon class="wallet-mini-svg" />
                        </div>
                        <div>
                            <p class="wallet-mini-kicker">Total Credits</p>
                            <h3 class="wallet-mini-value">{{ creditTransactions.length }}</h3>
                            <p class="wallet-mini-copy">Transactions</p>
                        </div>
                    </div>
                </article>

                <article class="wallet-mini-card">
                    <div class="wallet-mini-main">
                        <div class="wallet-mini-icon debit">
                            <ArrowUpIcon class="wallet-mini-svg" />
                        </div>
                        <div>
                            <p class="wallet-mini-kicker">Total Debits</p>
                            <h3 class="wallet-mini-value">{{ debitTransactions.length }}</h3>
                            <p class="wallet-mini-copy">Transactions</p>
                        </div>
                    </div>
                </article>

            </div>
        </div>

        <section class="wallet-transactions-shell">
            <div class="wallet-section-header">
                <div class="wallet-section-copy">
                    <h3>Recent Transactions</h3>
                    <span class="wallet-month-pill">{{ currentMonthLabel }}</span>
                </div>
                <button @click="fetchTransactions" :disabled="loading" class="wallet-refresh-link">
                    <ArrowPathIcon class="wallet-refresh-icon" :class="{ spin: loading }" />
                    Refresh
                </button>
            </div>

            <div v-if="loading" class="wallet-empty-state">
                <ArrowPathIcon class="wallet-empty-icon spin" />
                <p>Loading transactions...</p>
            </div>

            <div v-else-if="transactions.length === 0" class="wallet-empty-state">
                <ArrowsRightLeftIcon class="wallet-empty-icon" />
                <p class="wallet-empty-title">No transactions yet</p>
                <p class="wallet-empty-copy">Top up your wallet to start building transaction history.</p>
            </div>

            <div v-else class="wallet-transactions-list">
                <article v-for="tx in transactions" :key="tx.id" class="wallet-transaction-row">
                    <div class="wallet-transaction-left">
                        <div class="wallet-transaction-icon" :class="getTransactionDirection(tx)">
                            <component :is="getTransactionDirection(tx) === 'credit' ? ArrowDownIcon : ArrowUpIcon"
                                class="wallet-transaction-svg" />
                        </div>
                        <div class="wallet-transaction-copy">
                            <h4>{{ formatTransactionDescription(tx) }}</h4>
                            <p>{{ formatDate(tx.created_at) }}</p>
                        </div>
                    </div>

                    <div class="wallet-transaction-right">
                        <strong class="wallet-transaction-amount" :class="getTransactionDirection(tx)">
                            {{ getTransactionDirection(tx) === 'credit' ? '+' : '-' }}GHS {{
                                parseFloat(tx.amount).toFixed(2) }}
                        </strong>
                        <span class="wallet-transaction-note">{{ getTransactionNote(tx) }}</span>
                    </div>
                </article>
            </div>
        </section>

        <section class="wallet-feature-banner">
            <div class="wallet-feature-icon">
                <ShieldCheckIcon class="wallet-feature-svg" />
            </div>
            <div class="wallet-feature-copy">
                <h3>Insurance Sync Beta</h3>
                <p>Connect private healthcare cover later and manage credits from one calm wallet space.</p>
            </div>
            <button type="button" class="wallet-feature-button">Join Beta</button>
        </section>

        <div v-if="showTopUp" class="modal-overlay" @click.self="showTopUp = false">
            <div class="topup-modal">
                <div class="topup-header">
                    <h3>Top Up Wallet</h3>
                    <p>Add funds via Paystack</p>
                </div>
                <div class="topup-body">
                    <label>Amount (GHS)</label>
                    <input v-model.number="topUpAmount" type="number" min="1" step="0.01" placeholder="50.00"
                        class="amount-input" />
                    <div class="quick-amounts">
                        <button v-for="amt in [10, 20, 50, 100]" :key="amt" @click="topUpAmount = amt" class="quick-btn"
                            :class="{ active: topUpAmount === amt }">
                            {{ amt }}
                        </button>
                    </div>
                    <div class="topup-actions">
                        <button @click="showTopUp = false" class="cancel-btn">Cancel</button>
                        <button @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount <= 0" class="pay-btn">
                            Pay GHS {{ (topUpAmount || 0).toFixed(2) }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="toast" class="toast" :class="toast.type">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="toast-svg" />
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

<style scoped>
.wallet-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    max-width: 1320px;
    padding: 1rem 1.25rem 2rem;
    margin: 0 auto;
}

.wallet-intro {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
}

.wallet-intro-kicker,
.wallet-card-kicker,
.wallet-mini-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #7c6f87;
}

.wallet-intro-title {
    margin: 0.18rem 0 0;
    font-size: clamp(1.9rem, 3vw, 2.45rem);
    line-height: 1.08;
    font-weight: 700;
    color: #231734;
}

.wallet-intro-copy {
    margin: 0.4rem 0 0;
    color: #756c80;
    font-size: 0.96rem;
    max-width: 620px;
}

.wallet-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.78fr) minmax(360px, 1fr);
    gap: 1.25rem;
    align-items: stretch;
}

.wallet-balance-card {
    position: relative;
    overflow: hidden;
    min-height: 156px;
    max-width: 590px;
    width: 100%;
    justify-self: start;
    border-radius: 1.55rem;
    padding: 1rem 1.05rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(135deg, #5a169a 0%, #6922b1 52%, #4e1684 100%);
    box-shadow: 0 18px 42px rgba(88, 29, 137, 0.14);
    color: #fff;
}

.wallet-balance-copy,
.wallet-balance-footer {
    position: relative;
    z-index: 1;
}

.wallet-balance-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.65rem;
}

.wallet-balance-line {
    display: flex;
    align-items: flex-end;
    gap: 0.4rem;
    margin-top: 0.35rem;
}

.wallet-balance-currency {
    font-size: 0.9rem;
    font-weight: 400;
    opacity: 0.7;
}

.wallet-balance-amount {
    font-size: clamp(1.72rem, 2.6vw, 2.25rem);
    line-height: 0.95;
    font-weight: 700;
    letter-spacing: -0.04em;
}

.wallet-balance-footer {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    gap: 0.75rem;
}

.wallet-balance-note {
    max-width: 230px;
    margin-left: auto;
    text-align: right;
}

.wallet-balance-note h4 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 650;
    color: #fff;
}

.wallet-balance-note p {
    margin: 0.28rem 0 0;
    font-size: 0.73rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.74);
}

.wallet-topup-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: none;
    border-radius: 999px;
    padding: 0.56rem 0.82rem;
    background: rgba(255, 255, 255, 0.96);
    color: #4e1788;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 10px 24px rgba(34, 12, 67, 0.14);
}

.wallet-topup-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(34, 12, 67, 0.18);
}

.wallet-topup-icon {
    width: 0.82rem;
    height: 0.82rem;
}

.wallet-balance-glow {
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
}

.wallet-balance-glow-a {
    width: 8rem;
    height: 8rem;
    right: -4rem;
    top: -3rem;
    background: rgba(255, 255, 255, 0.09);
    filter: blur(16px);
}

.wallet-balance-glow-b {
    width: 5rem;
    height: 5rem;
    left: -3rem;
    bottom: -5rem;
    background: rgba(255, 255, 255, 0.08);
    filter: blur(18px);
}

.wallet-stat-column {
    display: grid;
    gap: 1rem;
    align-content: start;
}

.wallet-mini-card {
    border-radius: 1.6rem;
    padding: 0.95rem 1rem;
    background: #fcf8ff;
    border: 1px solid #eee5f7;
    box-shadow: 0 14px 34px rgba(56, 32, 89, 0.06);
}

.wallet-mini-main {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.wallet-mini-icon,
.wallet-mini-center-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.wallet-mini-icon.credit {
    background: #efe7ff;
    color: #6b35b6;
}

.wallet-mini-icon.debit {
    background: #f5ebff;
    color: #7d47c5;
}

.wallet-mini-center-icon {
    margin: 0 auto 0.8rem;
    background: #f0e5ff;
    color: #6322aa;
}

.wallet-mini-svg {
    width: 1.15rem;
    height: 1.15rem;
}

.wallet-mini-value {
    margin: 0.2rem 0 0;
    font-size: 1.45rem;
    line-height: 1;
    color: #281b3d;
    font-weight: 700;
}

.wallet-mini-copy {
    margin: 0.15rem 0 0;
    color: #7d7487;
    font-size: 0.82rem;
}

.wallet-transactions-shell,
.wallet-feature-banner {
    border-radius: 1.9rem;
    background: #fffdfd;
    border: 1px solid #f0e6f3;
    box-shadow: 0 18px 48px rgba(67, 38, 100, 0.06);
}

.wallet-transactions-shell {
    padding: 1.5rem;
}

.wallet-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.wallet-section-copy {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
}

.wallet-section-copy h3 {
    margin: 0;
    color: #25193a;
    font-size: 1.28rem;
    font-weight: 650;
}

.wallet-month-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.42rem 0.8rem;
    background: #f4ebff;
    color: #6d38b9;
    font-size: 0.76rem;
    font-weight: 700;
}

.wallet-refresh-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: none;
    background: transparent;
    color: #582693;
    font-weight: 650;
    cursor: pointer;
}

.wallet-refresh-link:disabled {
    opacity: 0.55;
    cursor: default;
}

.wallet-refresh-icon,
.wallet-empty-icon,
.toast-svg {
    width: 1rem;
    height: 1rem;
}

.wallet-empty-state {
    display: grid;
    place-items: center;
    text-align: center;
    gap: 0.35rem;
    padding: 2.3rem 1rem;
    border-radius: 1.45rem;
    border: 1px dashed #e5dced;
    background: #fbf8fd;
    color: #776f81;
}

.wallet-empty-title {
    margin: 0;
    color: #281d3c;
    font-weight: 650;
}

.wallet-empty-copy {
    margin: 0;
    font-size: 0.88rem;
}

.wallet-transactions-list {
    display: grid;
    gap: 0.85rem;
}

.wallet-transaction-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.95rem 1.05rem;
    border-radius: 1.45rem;
    background: #fff;
    border: 1px solid #f2e8f6;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.wallet-transaction-row:hover {
    transform: translateY(-1px);
    border-color: #e7d8f1;
    box-shadow: 0 12px 30px rgba(63, 36, 95, 0.06);
}

.wallet-transaction-left {
    display: flex;
    align-items: center;
    gap: 0.95rem;
    min-width: 0;
}

.wallet-transaction-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.wallet-transaction-icon.credit {
    background: #edf9ef;
    color: #1d9154;
}

.wallet-transaction-icon.debit {
    background: #fff0f1;
    color: #d14b5c;
}

.wallet-transaction-svg {
    width: 1rem;
    height: 1rem;
}

.wallet-transaction-copy {
    min-width: 0;
}

.wallet-transaction-copy h4 {
    margin: 0;
    color: #241937;
    font-size: 0.98rem;
    font-weight: 650;
    line-height: 1.35;
}

.wallet-transaction-copy p,
.wallet-transaction-note {
    margin: 0.24rem 0 0;
    font-size: 0.82rem;
    color: #7e7488;
}

.wallet-transaction-right {
    min-width: 170px;
    text-align: right;
}

.wallet-transaction-amount {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    color: #25193a;
}

.wallet-transaction-amount.credit {
    color: #17995a;
}

.wallet-transaction-amount.debit {
    color: #d14b5c;
}

.wallet-transaction-note {
    display: block;
}

.wallet-transaction-note:has(+ *) {
    display: inline;
}

.wallet-feature-banner {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 1.35rem 1.5rem;
    background: linear-gradient(180deg, #fbf7fd 0%, #f8f1fb 100%);
}

.wallet-feature-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 1.35rem;
    background: #f0e3ff;
    color: #6729aa;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.wallet-feature-svg {
    width: 1.45rem;
    height: 1.45rem;
}

.wallet-feature-copy h3 {
    margin: 0;
    color: #241938;
    font-size: 1.08rem;
    font-weight: 650;
}

.wallet-feature-copy p {
    margin: 0.3rem 0 0;
    max-width: 640px;
    color: #7d7387;
    line-height: 1.5;
    font-size: 0.9rem;
}

.wallet-feature-button {
    border: none;
    border-radius: 999px;
    padding: 0.85rem 1.15rem;
    background: #5f1ba4;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(25, 12, 40, 0.34);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 1100;
}

.topup-modal {
    width: min(100%, 420px);
    background: #fff;
    border-radius: 1.55rem;
    border: 1px solid #f0e6f4;
    box-shadow: 0 24px 54px rgba(41, 20, 66, 0.18);
    overflow: hidden;
}

.topup-header {
    padding: 1.35rem 1.35rem 0.85rem;
}

.topup-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #231734;
}

.topup-header p {
    margin: 0.28rem 0 0;
    color: #7a7184;
    font-size: 0.9rem;
}

.topup-body {
    padding: 0 1.35rem 1.35rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.topup-body label {
    font-size: 0.86rem;
    font-weight: 600;
    color: #51475d;
}

.amount-input {
    width: 100%;
    padding: 0.92rem 1rem;
    border-radius: 1rem;
    border: 1px solid #ddd1e8;
    background: #fbf8fe;
    font-size: 1rem;
    color: #211631;
    outline: none;
}

.amount-input:focus {
    border-color: #8b57d6;
    box-shadow: 0 0 0 3px rgba(126, 79, 212, 0.12);
}

.quick-amounts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.55rem;
}

.quick-btn,
.cancel-btn,
.pay-btn {
    border-radius: 999px;
    padding: 0.82rem 0.95rem;
    font-weight: 650;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.quick-btn {
    border: 1px solid #e5d9ef;
    background: #fff;
    color: #5b4d6b;
}

.quick-btn.active {
    background: #efe3ff;
    border-color: #bb97ee;
    color: #6224a5;
}

.topup-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.cancel-btn {
    border: 1px solid #ddd4e7;
    background: #fff;
    color: #63576f;
}

.pay-btn {
    border: none;
    background: linear-gradient(135deg, #5e16a5 0%, #6e27bd 100%);
    color: #fff;
}

.pay-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.toast {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.9rem 1.05rem;
    border-radius: 1rem;
    color: #fff;
    font-weight: 650;
    z-index: 1200;
    box-shadow: 0 20px 40px rgba(40, 18, 64, 0.2);
}

.toast.success {
    background: #169c5d;
}

.toast.error {
    background: #d34a55;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 1100px) {
    .wallet-hero-grid {
        grid-template-columns: 1fr;
    }

    .wallet-balance-card {
        max-width: none;
    }

    .wallet-stat-column {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 820px) {
    .wallet-page {
        padding: 0.8rem 0.85rem 1.6rem;
    }

    .wallet-balance-card {
        min-height: 160px;
        padding: 1rem;
        border-radius: 1.5rem;
    }

    .wallet-balance-top,
    .wallet-balance-footer,
    .wallet-feature-banner,
    .wallet-section-header,
    .wallet-transaction-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .wallet-stat-column {
        grid-template-columns: 1fr;
    }

    .wallet-feature-banner {
        grid-template-columns: 1fr;
    }

    .wallet-transaction-right {
        min-width: 0;
        text-align: left;
    }
}

@media (max-width: 520px) {
    .wallet-intro-title {
        font-size: 1.6rem;
    }

    .wallet-balance-line {
        align-items: baseline;
    }

    .wallet-balance-currency {
        font-size: 1.05rem;
    }

    .wallet-balance-amount {
        font-size: 2.15rem;
    }

    .wallet-balance-note {
        max-width: none;
        margin-left: 0;
        text-align: left;
    }

    .wallet-topup-button,
    .wallet-feature-button {
        width: 100%;
        justify-content: center;
    }

    .quick-amounts,
    .topup-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
