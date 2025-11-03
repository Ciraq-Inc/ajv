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
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ formatCurrency(monthlyStats.topupAmount) }}</p>
        <p class="text-sm text-gray-600">Money Topped Up</p>
        <div class="mt-3 flex items-center text-sm">
          <span class="text-green-600 font-medium">{{ monthlyStats.topups }} top-ups</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600">Today</h3>
          <Icon name="Activity" class="h-5 w-5 text-gray-400" />
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ formatCurrency(todayStats.topupAmount) }}</p>
        <p class="text-sm text-gray-600">Money Topped Up</p>
        <div class="mt-3 flex items-center text-sm">
          <span class="text-blue-600 font-medium">{{ todayStats.topups }} top-ups</span>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-600">Average Top-up</h3>
          <Icon name="DollarSign" class="h-5 w-5 text-gray-400" />
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ formatCurrency(averageTopup) }}</p>
        <p class="text-sm text-gray-600">Per Transaction</p>
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
            <option value="">All Money Transactions</option>
            <option value="money_topup">Money Top-ups</option>
            <option value="money_deduction">Money Deductions</option>
            <option value="money_refund">Money Refunds</option>
            <option value="topup">Legacy Top-ups</option>
            <option value="deduction">Legacy Deductions</option>
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
  topupAmount: 0,
  deductionAmount: 0,
  topups: 0
})

const todayStats = ref({
  topupAmount: 0,
  deductionAmount: 0,
  topups: 0
})

const averageTopup = computed(() => {
  const total = monthlyStats.value.topups
  if (total === 0) return 0
  return monthlyStats.value.topupAmount / total
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchBalance(),
    fetchTransactions({ money_only: true }) // Only money transactions
  ])
  
  console.log('=== INITIAL DATA LOADED ===')
  console.log('Total transactions loaded:', transactions.value.length)
  console.log('First 3 transactions:', transactions.value.slice(0, 3))
  
  // Calculate stats from transactions
  calculateStats()
})

// Refresh transactions
const refreshTransactions = async () => {
  const filters = {
    // Only show money-related transactions (money_topup, money_deduction, money_refund, topup, deduction)
    money_only: true
  }
  
  if (transactionFilters.value.type) {
    filters.transaction_type = transactionFilters.value.type
  }
  
  if (transactionFilters.value.period !== 'all') {
    const days = parseInt(transactionFilters.value.period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    filters.start_date = startDate.toISOString().split('T')[0] // Fix: use start_date and format as YYYY-MM-DD
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
  
  let monthTopupAmount = 0
  let monthDeductionAmount = 0
  let monthTopups = 0
  let todayTopupAmount = 0
  let todayDeductionAmount = 0
  let todayTopups = 0
  
  console.log('=== CALCULATING MONEY STATS ===')
  console.log('Calculating stats from', transactions.value.length, 'transactions')
  console.log('Start of month:', startOfMonth.toISOString())
  console.log('Start of day:', startOfDay.toISOString())
  console.log('Current time:', now.toISOString())
  
  if (transactions.value.length === 0) {
    console.warn('⚠️ NO TRANSACTIONS FOUND! Stats will be zero.')
  }
  
  const transactionTypes = {}
  
  transactions.value.forEach(t => {
    const transDate = new Date(t.created_at)
    
    // Count transaction types
    transactionTypes[t.transaction_type] = (transactionTypes[t.transaction_type] || 0) + 1
    
    console.log('Transaction:', {
      id: t.id,
      type: t.transaction_type,
      date: transDate.toISOString(),
      amount: t.amount,
      isThisMonth: transDate >= startOfMonth,
      isToday: transDate >= startOfDay
    })
    
    // Money top-up transactions
    if (t.transaction_type === 'money_topup' || t.transaction_type === 'topup') {
      const amount = parseFloat(t.amount || 0)
      
      console.log('  ✓ Money top-up transaction! Amount:', amount)
      
      if (transDate >= startOfMonth) {
        monthTopupAmount += amount
        monthTopups++
        console.log('    → Added to MONTH stats')
      }
      
      if (transDate >= startOfDay) {
        todayTopupAmount += amount
        todayTopups++
        console.log('    → Added to TODAY stats')
      }
    }
    
    // Money deduction transactions
    if (t.transaction_type === 'money_deduction' || t.transaction_type === 'deduction') {
      const amount = parseFloat(t.amount || 0)
      
      if (transDate >= startOfMonth) {
        monthDeductionAmount += amount
      }
      
      if (transDate >= startOfDay) {
        todayDeductionAmount += amount
      }
    }
  })
  
  console.log('=== TRANSACTION TYPE SUMMARY ===')
  console.log('Transaction types found:', transactionTypes)
  console.log('=== FINAL MONEY STATS ===')
  console.log('Month:', { topupAmount: monthTopupAmount, deductionAmount: monthDeductionAmount, topups: monthTopups })
  console.log('Today:', { topupAmount: todayTopupAmount, deductionAmount: todayDeductionAmount, topups: todayTopups })
  
  if (monthTopupAmount === 0 && monthTopups === 0) {
    console.warn('⚠️ No money activity found this month!')
  }
  
  monthlyStats.value = { topupAmount: monthTopupAmount, deductionAmount: monthDeductionAmount, topups: monthTopups }
  todayStats.value = { topupAmount: todayTopupAmount, deductionAmount: todayDeductionAmount, topups: todayTopups }
}

// Get transaction type label
const getTransactionTypeLabel = (type) => {
  const labels = {
    sms_deduction: 'SMS Sent',
    sms_topup: 'SMS Top-up',
    sms_refund: 'SMS Refund',
    money_deduction: 'Money Deduction',
    money_topup: 'Money Top-up',
    money_refund: 'Money Refund',
    topup: 'Top-up',
    deduction: 'Deduction',
    refund: 'Refund'
  }
  return labels[type] || type
}

// Get transaction type class
const getTransactionTypeClass = (type) => {
  const classes = {
    sms_deduction: 'bg-red-100 text-red-800',
    sms_topup: 'bg-green-100 text-green-800',
    sms_refund: 'bg-yellow-100 text-yellow-800',
    money_deduction: 'bg-orange-100 text-orange-800',
    money_topup: 'bg-emerald-100 text-emerald-800',
    money_refund: 'bg-amber-100 text-amber-800',
    topup: 'bg-green-100 text-green-800',
    deduction: 'bg-orange-100 text-orange-800',
    refund: 'bg-yellow-100 text-yellow-800'
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
