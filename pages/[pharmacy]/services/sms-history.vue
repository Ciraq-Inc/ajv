<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1">SMS History</h1>
      <p class="text-sm text-gray-500">Credit purchases, campaign sends, and refunds</p>
    </div>

    <!-- Credit balance strip -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="cs-gradient rounded-xl p-5 text-white shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium opacity-75 mb-1">SMS Credits</p>
            <p class="text-3xl font-bold">{{ formatNumber(smsBalance) }}</p>
            <p class="text-xs opacity-60 mt-1">Available credits</p>
          </div>
          <Icon name="MessageSquare" class="h-8 w-8 opacity-50 flex-shrink-0 mt-0.5" />
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 mb-1">SMS Rate</p>
            <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(smsRate_value) }}</p>
            <p class="text-xs text-gray-400 mt-1">Per SMS sent</p>
          </div>
          <Icon name="TrendingUp" class="h-8 w-8 text-gray-200 flex-shrink-0 mt-0.5" />
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 mb-1">This month used</p>
          <p class="text-3xl font-bold text-gray-900">{{ formatNumber(thisMonthUsed) }}</p>
          <p class="text-xs text-gray-400 mt-1">SMS credits</p>
        </div>
        <Icon name="BarChart2" class="h-8 w-8 text-gray-200 flex-shrink-0" />
      </div>
    </div>

    <!-- Low balance warning -->
    <div
      v-if="smsBalance > 0 && smsBalance < 100"
      class="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-amber-800"
    >
      <Icon name="AlertTriangle" class="h-4 w-4 flex-shrink-0 text-amber-500" />
      <span>Running low on SMS credits. Go to <NuxtLink :to="`/${$route.params.pharmacy}/services/sms-billing`" class="underline font-medium">Wallet</NuxtLink> to top up and buy more.</span>
    </div>

    <!-- Transaction table -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-gray-900">Transaction History</h2>
        <button
          @click="refresh"
          :disabled="loading"
          class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 self-end sm:self-auto"
        >
          <Icon :name="loading ? 'Loader2' : 'RefreshCw'" :class="loading ? 'animate-spin' : ''" class="h-4 w-4" />
          Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="px-4 md:px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        <select
          v-model="filters.type"
          @change="load"
          class="px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm w-full sm:w-auto"
        >
          <option value="">All SMS Transactions</option>
          <option value="sms_topup">Credits Purchased</option>
          <option value="sms_deduction">SMS Sent</option>
          <option value="sms_refund">Refunds</option>
        </select>
        <input
          v-model="filters.startDate"
          type="date"
          @change="load"
          class="px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm w-full sm:w-auto"
        />
        <input
          v-model="filters.endDate"
          type="date"
          @change="load"
          class="px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm w-full sm:w-auto"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading && txns.length === 0" class="py-16 text-center text-gray-400">
        <Icon name="Loader2" class="h-10 w-10 animate-spin mx-auto mb-3" />
        <p class="text-sm">Loading history...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="txns.length === 0" class="py-16 text-center text-gray-400">
        <Icon name="MessageSquare" class="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm font-medium text-gray-500 mb-1">No transactions found</p>
        <p class="text-xs">Try adjusting the filters or date range</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[620px] text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left py-2.5 px-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
              <th class="text-left py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th class="text-left py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
              <th class="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">SMS Count</th>
              <th class="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
              <th class="text-right py-2.5 px-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="tx in txns" :key="tx.id" class="hover:bg-gray-50">
              <td class="py-3 px-4 md:px-6 text-gray-700 whitespace-nowrap">{{ formatDate(tx.created_at, 'long') }}</td>
              <td class="py-3 px-4">
                <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', typeClass(tx.transaction_type)]">
                  {{ typeLabel(tx.transaction_type) }}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-600 max-w-[200px] truncate">{{ tx.description || '—' }}</td>
              <td class="py-3 px-4 text-right text-gray-700">{{ tx.sms_count ?? '—' }}</td>
              <td class="py-3 px-4 text-right text-gray-700">{{ tx.balance_after ?? '—' }}</td>
              <td class="py-3 px-4 md:px-6 text-right font-medium text-gray-900">{{ tx.amount ? formatCurrency(tx.amount) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSMSCredits } from '~/composables/useSMSCredits'
import { formatDate, formatNumber, formatCurrency } from '~/utils/constants/sms'
import type { SmsTransaction } from '~/services/types'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'SMS History',
})

interface TxRow extends SmsTransaction {
  sms_count?: number | null
  balance_after?: number | null
}

const {
  loading,
  transactions: rawTxns,
  fetchBalance,
  fetchTransactions,
  fetchSmsRate,
  smsBalance,
  smsRate_value,
} = useSMSCredits()

const txns = computed(() => rawTxns.value as TxRow[])

const filters = ref({ type: '', startDate: '', endDate: '' })

const thisMonthUsed = computed(() => {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return txns.value
    .filter(t => {
      const isDeduction = t.transaction_type === 'sms_deduction' || t.transaction_type === 'deduction' || t.transaction_type === 'sent'
      const inMonth = new Date(t.created_at ?? '') >= start
      return isDeduction && inMonth
    })
    .reduce((sum, t) => sum + Math.abs(Number(t.sms_count ?? 0)), 0)
})

const load = async () => {
  const f: Record<string, unknown> = { sms_only: true }
  if (filters.value.type) f['transaction_type'] = filters.value.type
  if (filters.value.startDate) f['start_date'] = filters.value.startDate
  if (filters.value.endDate) f['end_date'] = filters.value.endDate
  await fetchTransactions(f as Parameters<typeof fetchTransactions>[0])
}

const refresh = async () => {
  await fetchBalance()
  await load()
}

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    sms_topup: 'Top-up', sms_deduction: 'SMS Sent', sms_refund: 'Refund',
    topup: 'Top-up', sent: 'SMS Sent', refund: 'Refund', deduction: 'Deduction',
  }
  return map[type] ?? type
}

const typeClass = (type: string) => {
  if (type === 'sms_topup' || type === 'topup') return 'bg-green-100 text-green-700'
  if (type === 'sms_deduction' || type === 'sent' || type === 'deduction') return 'bg-purple-100 text-purple-700'
  if (type === 'sms_refund' || type === 'refund') return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

onMounted(async () => {
  await Promise.all([fetchBalance(), fetchSmsRate(), load()])
})
</script>
