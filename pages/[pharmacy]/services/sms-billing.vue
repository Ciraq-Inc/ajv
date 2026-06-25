<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Wallet</h1>
      <p class="text-sm text-gray-500">Manage your wallet balance and SMS credits</p>
    </div>

    <!-- Category tabs -->
    <div class="flex gap-1 mb-6 border-b border-gray-200">
      <button
        class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px border-[var(--ls-accent)] cs-text"
      >
        SMS Credits
      </button>
      <button
        disabled
        class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px border-transparent text-gray-300 cursor-not-allowed flex items-center gap-1.5"
        title="Coming soon"
      >
        Subscriptions
        <span class="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
      </button>
    </div>

    <!-- SMS Credits category -->
    <div>
      <!-- Balance strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <!-- Wallet Balance -->
        <div class="cs-gradient rounded-xl p-5 text-white shadow">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-xs font-medium opacity-75 mb-1">Wallet Balance</p>
              <p class="text-3xl font-bold">{{ formatCurrency(moneyBalance) }}</p>
              <p class="text-xs opacity-60 mt-1">Available for purchase</p>
            </div>
            <Icon name="Wallet" class="h-8 w-8 opacity-50 flex-shrink-0 mt-0.5" />
          </div>
          <button
            @click="showTopUpModal = true"
            class="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Icon name="Plus" class="h-4 w-4" />
            Top Up
          </button>
        </div>

        <!-- SMS Credits -->
        <div class="cs-gradient rounded-xl p-5 text-white shadow">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-xs font-medium opacity-75 mb-1">SMS Credits</p>
              <p class="text-3xl font-bold">{{ formatNumber(smsBalance) }}</p>
              <p class="text-xs opacity-60 mt-1">Available credits</p>
            </div>
            <Icon name="MessageSquare" class="h-8 w-8 opacity-50 flex-shrink-0 mt-0.5" />
          </div>
          <button
            @click="showPurchaseModal = true"
            :disabled="moneyBalance <= 0"
            class="w-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Icon name="ShoppingCart" class="h-4 w-4" />
            Buy Credits
          </button>
        </div>

        <!-- SMS Rate -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 mb-1">SMS Rate</p>
              <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(smsRate_value) }}</p>
              <p class="text-xs text-gray-400 mt-1">Per SMS sent</p>
            </div>
            <Icon name="TrendingUp" class="h-8 w-8 text-gray-200 flex-shrink-0 mt-0.5" />
          </div>
        </div>
      </div>

      <!-- Low balance warning -->
      <div
        v-if="smsBalance > 0 && smsBalance < 100"
        class="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-amber-800"
      >
        <Icon name="AlertTriangle" class="h-4 w-4 flex-shrink-0 text-amber-500" />
        <span>You're running low on SMS credits. Consider purchasing more to avoid campaign interruptions.</span>
      </div>

      <!-- Transaction table -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-4 md:px-6 border-b border-gray-200 flex items-center justify-between">
          <h2 class="py-3 text-sm font-semibold text-gray-700">Money Transactions</h2>
          <button
            @click="refresh"
            :disabled="moneyLoading"
            class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 py-3 transition-colors disabled:opacity-50"
          >
            <Icon
              :name="moneyLoading ? 'Loader2' : 'RefreshCw'"
              :class="moneyLoading ? 'animate-spin' : ''"
              class="h-4 w-4"
            />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div class="p-4 md:p-6">
          <div class="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              v-model="moneyFilters.type"
              @change="loadMoneyTransactions"
              class="px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm w-full sm:w-auto"
            >
              <option value="">All Money Transactions</option>
              <option value="money_topup">Money Top-ups</option>
              <option value="money_deduction">Money Deductions</option>
              <option value="money_refund">Money Refunds</option>
              <option value="topup">Legacy Top-ups</option>
              <option value="deduction">Legacy Deductions</option>
            </select>
            <select
              v-model="moneyFilters.period"
              @change="loadMoneyTransactions"
              class="px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm w-full sm:w-auto"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div v-if="moneyLoading && moneyTxns.length === 0" class="py-12 text-center text-gray-400">
            <Icon name="Loader2" class="h-8 w-8 animate-spin mx-auto mb-2" />
            <p class="text-sm">Loading...</p>
          </div>
          <div v-else-if="moneyTxns.length === 0" class="py-12 text-center text-gray-400">
            <Icon name="Receipt" class="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p class="text-sm">No money transactions found</p>
          </div>
          <div v-else class="overflow-x-auto -mx-4 md:mx-0">
            <table class="w-full min-w-[540px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                  <th class="text-left py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th class="text-left py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
                  <th class="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                  <th class="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="tx in moneyTxns" :key="tx.id" class="hover:bg-gray-50">
                  <td class="py-3 px-4 text-gray-700 whitespace-nowrap">{{ formatDate(tx.created_at, 'long') }}</td>
                  <td class="py-3 px-4">
                    <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getMoneyTypeClass(tx.transaction_type)]">
                      {{ getMoneyTypeLabel(tx.transaction_type) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ tx.description || '—' }}</td>
                  <td class="py-3 px-4 text-right text-gray-700">{{ tx.amount ?? '—' }}</td>
                  <td class="py-3 px-4 text-right font-medium text-gray-900">{{ formatNumber(tx.money_balance_after) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Paystack Top Up Modal -->
    <PaystackTopUpModal
      :is-open="showTopUpModal"
      :current-balance="moneyBalance"
      @close="showTopUpModal = false"
      @success="handleTopUpSuccess"
    />

    <!-- Purchase SMS Credits Modal -->
    <div
      v-if="showPurchaseModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="showPurchaseModal = false"
    >
      <div class="bg-white rounded-xl w-full max-w-md shadow-2xl" @click.stop>
        <div class="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-900">Purchase SMS Credits</h3>
          <button @click="showPurchaseModal = false" class="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon name="X" class="h-5 w-5" />
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div class="bg-purple-50 border border-purple-100 rounded-lg p-3 text-sm space-y-1.5">
            <p class="flex justify-between">
              <span class="text-gray-500">Money balance</span>
              <strong class="cs-text">{{ formatCurrency(moneyBalance) }}</strong>
            </p>
            <p class="flex justify-between">
              <span class="text-gray-500">Rate per SMS</span>
              <strong class="text-gray-800">{{ formatCurrency(smsRate_value) }}</strong>
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Number of SMS Credits</label>
            <input
              v-model.number="purchaseForm.smsCount"
              type="number"
              min="1"
              step="100"
              placeholder="e.g. 500"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg cs-input text-sm"
              @input="calcPurchaseCost"
            />
          </div>
          <div v-if="purchaseForm.smsCount" class="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
            <div class="flex justify-between text-gray-600">
              <span>SMS Credits</span><span>{{ formatNumber(purchaseForm.smsCount) }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Rate</span><span>{{ formatCurrency(smsRate_value) }}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Cost</span><span>{{ formatCurrency(purchaseForm.totalCost) }}</span>
            </div>
            <p v-if="purchaseForm.totalCost > moneyBalance" class="text-red-600 text-xs flex items-center gap-1 pt-1">
              <Icon name="AlertCircle" class="h-3.5 w-3.5" /> Insufficient money balance
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button
            @click="showPurchaseModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="performPurchase"
            :disabled="smsLoading || !purchaseForm.smsCount || purchaseForm.totalCost > moneyBalance"
            class="px-4 py-2 text-sm font-medium text-white cs-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ smsLoading ? 'Processing...' : 'Confirm Purchase' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSMSBilling } from '~/composables/useSMSBilling'
import { useSMSCredits } from '~/composables/useSMSCredits'
import PaystackTopUpModal from '~/components/sms/billing/PaystackTopUpModal.vue'
import { formatDate, formatNumber, formatCurrency } from '~/utils/constants/sms'
import type { SmsTransaction } from '~/services/types'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'Wallet',
})

interface TxRow extends SmsTransaction {
  sms_count?: number | null
  balance_after?: number | null
  money_balance_after?: number | null
}

const {
  loading: moneyLoading,
  transactions: moneyRawTxns,
  fetchTransactions: fetchMoneyTransactions,
} = useSMSBilling()

const {
  loading: smsLoading,
  fetchBalance,
  fetchSmsRate,
  purchaseCredits,
  smsBalance,
  moneyBalance,
  smsRate_value,
} = useSMSCredits()

const moneyTxns = computed(() => moneyRawTxns.value as TxRow[])

// UI state
const showTopUpModal = ref(false)
const showPurchaseModal = ref(false)

// Filters
const moneyFilters = ref({ type: '', period: '30' })

// Purchase form
const purchaseForm = ref({ smsCount: null as number | null, totalCost: 0 })

// ── Data loading ──────────────────────────────────────────────────────────────

const loadMoneyTransactions = async () => {
  const filters: Record<string, unknown> = { money_only: true }
  if (moneyFilters.value.type) filters['transaction_type'] = moneyFilters.value.type
  if (moneyFilters.value.period !== 'all') {
    const d = new Date()
    d.setDate(d.getDate() - parseInt(moneyFilters.value.period))
    filters['start_date'] = d.toISOString().split('T')[0]
  }
  await fetchMoneyTransactions(filters as Parameters<typeof fetchMoneyTransactions>[0])
}

const refresh = async () => {
  await fetchBalance()
  await loadMoneyTransactions()
}

// ── Actions ───────────────────────────────────────────────────────────────────

const handleTopUpSuccess = async () => {
  showTopUpModal.value = false
  await fetchBalance()
  await loadMoneyTransactions()
}

const calcPurchaseCost = () => {
  purchaseForm.value.totalCost = (purchaseForm.value.smsCount ?? 0) * smsRate_value.value
}

const performPurchase = async () => {
  try {
    await purchaseCredits(purchaseForm.value.smsCount ?? 0)
    showPurchaseModal.value = false
    purchaseForm.value = { smsCount: null, totalCost: 0 }
    await fetchBalance()
  } catch {
    // smsLoading.error is already set on the composable
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const getMoneyTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    money_topup: 'Top-up', money_deduction: 'Deduction', money_refund: 'Refund',
    topup: 'Top-up', deduction: 'Deduction', refund: 'Refund',
  }
  return map[type] ?? type
}

const getMoneyTypeClass = (type: string) => {
  if (type === 'money_topup' || type === 'topup') return 'bg-green-100 text-green-700'
  if (type === 'money_deduction' || type === 'deduction') return 'bg-orange-100 text-orange-700'
  if (type === 'money_refund' || type === 'refund') return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([fetchBalance(), fetchSmsRate(), loadMoneyTransactions()])
})
</script>
