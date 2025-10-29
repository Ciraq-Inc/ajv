<template>
  <div class="sms-billing-page">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">SMS Billing</h1>
      <p class="text-gray-600">Manage your SMS credits and view transaction history</p>
    </div>

    <!-- Balance Section -->
    <div class="mb-6">
      <BalanceCard
        :balance-data="balance"
        :show-actions="true"
        :show-top-up="false"
        @refresh="fetchBalance"
      />
    </div>

    <!-- Usage Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600">This Month</h3>
          <Icon name="Calendar" class="h-5 w-5 text-gray-400" />
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ formatNumber(monthlyStats.sent) }}</p>
        <p class="text-sm text-gray-600">SMS Sent</p>
        <div class="mt-3 flex items-center text-sm">
          <span class="text-green-600 font-medium">{{ formatCurrency(monthlyStats.cost) }}</span>
          <span class="text-gray-500 ml-1">spent</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600">Today</h3>
          <Icon name="Activity" class="h-5 w-5 text-gray-400" />
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ formatNumber(todayStats.sent) }}</p>
        <p class="text-sm text-gray-600">SMS Sent</p>
        <div class="mt-3 flex items-center text-sm">
          <span class="text-blue-600 font-medium">{{ formatCurrency(todayStats.cost) }}</span>
          <span class="text-gray-500 ml-1">spent</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600">Average Cost</h3>
          <Icon name="DollarSign" class="h-5 w-5 text-gray-400" />
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ formatCurrency(averageCost) }}</p>
        <p class="text-sm text-gray-600">Per SMS</p>
      </div>
    </div>

    <!-- Transaction History -->
    <div class="bg-white rounded-lg border border-gray-200">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Transaction History</h2>
          <button
            @click="refreshTransactions"
            :disabled="loading"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Icon :name="loading ? 'Loader2' : 'RefreshCw'" :class="loading ? 'animate-spin' : ''" class="h-4 w-4" />
            Refresh
          </button>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-4">
          <select
            v-model="transactionFilters.type"
            @change="applyTransactionFilters"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="deduction">Deductions</option>
            <option value="topup">Top-ups</option>
            <option value="refund">Refunds</option>
          </select>

          <select
            v-model="transactionFilters.period"
            @change="applyTransactionFilters"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && transactions.length === 0" class="p-12 text-center">
        <Icon name="Loader2" class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p class="text-gray-600">Loading transactions...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && transactions.length === 0" class="p-12 text-center">
        <Icon name="Receipt" class="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
        <p class="text-gray-600">Your transaction history will appear here</p>
      </div>

      <!-- Transactions Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">Date</th>
              <th class="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">Type</th>
              <th class="text-left py-3 px-6 text-xs font-medium text-gray-600 uppercase">Description</th>
              <th class="text-right py-3 px-6 text-xs font-medium text-gray-600 uppercase">Amount</th>
              <!-- <th class="text-right py-3 px-6 text-xs font-medium text-gray-600 uppercase">SMS Count</th> -->
              <th class="text-right py-3 px-6 text-xs font-medium text-gray-600 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="transaction in transactions"
              :key="transaction.id"
              class="hover:bg-gray-50"
            >
              <td class="py-4 px-6 text-sm text-gray-900">
                {{ formatDate(transaction.created_at, 'long') }}
              </td>
              <td class="py-4 px-6">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getTransactionTypeClass(transaction.transaction_type)
                  ]"
                >
                  {{ getTransactionTypeLabel(transaction.transaction_type) }}
                </span>
              </td>
              <td class="py-4 px-6 text-sm text-gray-600">
                {{ transaction.description || '-' }}
              </td>
              <td class="py-4 px-6 text-sm text-gray-600">
                {{ transaction.amount || '-' }}
              </td>
              <!-- <td class="py-4 px-6 text-sm text-right font-medium">
                <span :class="transaction.sms_count > 0 ? 'text-green-600' : 'text-red-600'">
                  {{ transaction.sms_count > 0 ? '+' : '' }}{{ formatNumber(transaction.sms_count) }}
                </span>
              </td> -->
              <td class="py-4 px-6 text-sm text-right text-gray-900 font-medium">
                {{ formatNumber(transaction.money_balance_after) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="transactions.length > 0" class="p-4 border-t border-gray-200 flex items-center justify-between">
        <p class="text-sm text-gray-600">
          Showing {{ transactions.length }} transactions
        </p>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Previous
          </button>
          <button
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSMSBilling } from '~/composables/useSMSBilling'
import BalanceCard from '~/components/sms/billing/BalanceCard.vue'
import { formatDate, formatNumber, formatCurrency, getStatusLabel } from '~/utils/constants/sms'

// Define page metadata
definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'SMS Billing'
})

const { balance, transactions, loading, fetchBalance, fetchTransactions } = useSMSBilling()

const transactionFilters = ref({
  type: '',
  period: '30'
})

const monthlyStats = ref({
  sent: 0,
  cost: 0
})

const todayStats = ref({
  sent: 0,
  cost: 0
})

const averageCost = computed(() => {
  const total = monthlyStats.value.sent
  if (total === 0) return 0
  return monthlyStats.value.cost / total
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchBalance(),
    fetchTransactions()
  ])
  
  // Calculate stats from transactions
  calculateStats()
})

// Refresh transactions
const refreshTransactions = async () => {
  const filters = {}
  
  if (transactionFilters.value.type) {
    filters.transaction_type = transactionFilters.value.type
  }
  
  if (transactionFilters.value.period !== 'all') {
    const days = parseInt(transactionFilters.value.period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    filters.startDate = startDate.toISOString()
  }
  
  await fetchTransactions(filters)
  calculateStats()
}

// Apply filters
const applyTransactionFilters = () => {
  refreshTransactions()
}

// Calculate stats
const calculateStats = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let monthSent = 0
  let monthCost = 0
  let todaySent = 0
  let todayCost = 0
  
  transactions.value.forEach(t => {
    const transDate = new Date(t.created_at)
    const amount = Math.abs(t.sms_count)
    const cost = amount * 0.05 // Assuming 0.05 per SMS
    
    if (transDate >= startOfMonth && t.transaction_type === 'deduction') {
      monthSent += amount
      monthCost += cost
    }
    
    if (transDate >= startOfDay && t.transaction_type === 'deduction') {
      todaySent += amount
      todayCost += cost
    }
  })
  
  monthlyStats.value = { sent: monthSent, cost: monthCost }
  todayStats.value = { sent: todaySent, cost: todayCost }
}

// Get transaction type label
const getTransactionTypeLabel = (type) => {
  const labels = {
    deduction: 'Deduction',
    topup: 'Top-up',
    refund: 'Refund',
    purchase: 'Purchase'
  }
  return labels[type] || type
}

// Get transaction type class
const getTransactionTypeClass = (type) => {
  const classes = {
    deduction: 'bg-red-100 text-red-800',
    topup: 'bg-green-100 text-green-800',
    refund: 'bg-yellow-100 text-yellow-800',
    purchase: 'bg-blue-100 text-blue-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
.sms-billing-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
