<template>
    <div class="wallet-panel">
        <!-- Balance Card -->
        <div class="balance-card">
            <div class="balance-icon">
                <CreditCardIcon class="bal-svg" />
            </div>
            <div class="balance-info">
                <span class="balance-label">Available Balance</span>
                <span class="balance-amount">GHS {{ balance.toFixed(2) }}</span>
            </div>
            <button @click="showTopUp = true" class="topup-btn">
                <PlusIcon class="btn-svg" /> Top Up
            </button>
        </div>

        <!-- Transactions -->
        <div class="section-header">
            <h3>Recent Transactions</h3>
            <button @click="fetchTransactions" :disabled="loading" class="refresh-link">
                <ArrowPathIcon class="btn-svg" :class="{ spin: loading }" /> Refresh
            </button>
        </div>

        <div v-if="loading" class="loading-state">
            <ArrowPathIcon class="spin-svg spin" /> Loading...
        </div>

        <div v-else-if="transactions.length === 0" class="empty-state">
            <ArrowsRightLeftIcon class="empty-icon-svg" />
            <p class="empty-title">No transactions yet</p>
            <p class="empty-desc">Top up your wallet to get started</p>
        </div>

        <div v-else class="transactions-list">
            <div v-for="tx in transactions" :key="tx.id" class="tx-row">
                <div class="tx-icon-wrap" :class="tx.transaction_type">
                    <component :is="tx.transaction_type === 'credit' ? ArrowDownIcon : ArrowUpIcon" class="tx-svg" />
                </div>
                <div class="tx-info">
                    <span class="tx-desc">{{ tx.description || (tx.transaction_type === 'credit' ? 'Wallet Top Up' :
                        'Request Fee') }}</span>
                    <span class="tx-date">{{ formatDate(tx.created_at) }}</span>
                </div>
                <span class="tx-amount" :class="tx.transaction_type">
                    {{ tx.transaction_type === 'credit' ? '+' : '-' }}GHS {{ parseFloat(tx.amount).toFixed(2) }}
                </span>
            </div>
        </div>

        <!-- Top Up Modal -->
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

        <!-- Toast -->
        <div v-if="toast" class="toast" :class="toast.type">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="toast-svg" />
            {{ toast.text }}
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useRoute, useRouter } from 'vue-router'
import { CreditCardIcon, PlusIcon, ArrowPathIcon, ArrowDownIcon, ArrowUpIcon, ArrowsRightLeftIcon, ExclamationTriangleIcon as ExcTriIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

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
        transactions.value = res.data || []
    } catch (e) { showToast('Failed to load transactions', 'error') }
    finally { loading.value = false }
}

const initiateTopUp = async () => {
    if (!topUpAmount.value || topUpAmount.value <= 0) return
    try {
        const res = await apiCall('POST', '/api/wallet/topup', { amount: topUpAmount.value })
        if (res.data?.authorization_url) {
            window.open(res.data.authorization_url, '_blank')
        }
        showTopUp.value = false
        showToast('Redirecting to payment...')
        setTimeout(() => { fetchBalance(); fetchTransactions() }, 10000)
    } catch (e) { showToast(e.message || 'Failed to initiate payment', 'error') }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const showToast = (text, type = 'success') => { toast.value = { text, type }; setTimeout(() => { toast.value = null }, 4000) }

const verifyPayment = async () => {
    const trxRef = route.query.trxref || route.query.reference
    if (!trxRef) return

    loading.value = true
    try {
        const res = await apiCall('GET', `/api/wallet/topup/verify/${trxRef}`)
        if (res.success) {
            showToast('Wallet topped up successfully!')
            balance.value = parseFloat(res.data?.balance || balance.value)
            fetchTransactions() // refresh list
            // Clear query params
            router.replace({ query: { tab: 'wallet' } })
        }
    } catch (e) {
        showToast(e.message || 'Payment verification failed', 'error')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchBalance()
    fetchTransactions()
    if (route.query.trxref) verifyPayment()
})

defineExpose({ fetchBalance, fetchTransactions })
</script>

<style scoped>
.wallet-panel {
    padding: 1.5rem;
}

/* Balance card */
.balance-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 16px;
    margin-bottom: 1.5rem;
}

.balance-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.bal-svg {
    width: 24px;
    height: 24px;
    color: white;
}

.btn-svg {
    width: 16px;
    height: 16px;
}

.spin-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
}

.tx-svg {
    width: 16px;
    height: 16px;
}

.toast-svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.empty-icon-svg {
    width: 2rem;
    height: 2rem;
    color: #d1d5db;
    margin: 0 auto;
}

.balance-info {
    flex: 1;
}

.balance-label {
    display: block;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
}

.balance-amount {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: white;
}

.topup-btn {
    padding: 0.625rem 1.25rem;
    background: white;
    color: #667eea;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: all 0.2s;
}

.topup-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Section header */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.section-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
}

.refresh-link {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.refresh-link:disabled {
    opacity: 0.5;
}

/* Transactions */
.transactions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tx-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem;
    background: #f9fafb;
    border-radius: 10px;
    border: 1px solid #f3f4f6;
}

.tx-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.tx-icon-wrap.credit {
    background: #dcfce7;
    color: #16a34a;
}

.tx-icon-wrap.debit {
    background: #fee2e2;
    color: #dc2626;
}

.tx-info {
    flex: 1;
}

.tx-desc {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
}

.tx-date {
    font-size: 0.7rem;
    color: #9ca3af;
}

.tx-amount {
    font-weight: 700;
    font-size: 0.875rem;
    white-space: nowrap;
}

.tx-amount.credit {
    color: #16a34a;
}

.tx-amount.debit {
    color: #dc2626;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.topup-modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 380px;
    overflow: hidden;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.topup-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    padding: 1.25rem 1.5rem;
}

.topup-header h3 {
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
}

.topup-header p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
}

.topup-body {
    padding: 1.5rem;
}

.topup-body label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.375rem;
}

.amount-input {
    width: 100%;
    padding: 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.75rem;
}

.amount-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.quick-amounts {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
}

.quick-btn {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    font-weight: 600;
    font-size: 0.875rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
}

.quick-btn.active {
    border-color: #667eea;
    background: #eef2ff;
    color: #4f46e5;
}

.quick-btn:hover {
    border-color: #a5b4fc;
}

.topup-actions {
    display: flex;
    gap: 0.75rem;
}

.cancel-btn {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    background: white;
    color: #6b7280;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
}

.cancel-btn:hover {
    background: #f9fafb;
}

.pay-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 10px;
    background: #667eea;
    color: white;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.pay-btn:hover:not(:disabled) {
    background: #5a6fd6;
}

.pay-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* States */
.loading-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.empty-state {
    text-align: center;
    padding: 2rem;
}

.empty-icon {
    font-size: 2rem;
    color: #d1d5db;
}

.empty-title {
    font-weight: 600;
    color: #374151;
    margin: 0.375rem 0 0.125rem;
}

.empty-desc {
    font-size: 0.8rem;
    color: #9ca3af;
}

/* Toast */
.toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    z-index: 2000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideUp 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
    background: #10b981;
}

.toast.error {
    background: #ef4444;
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

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
