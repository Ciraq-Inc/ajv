<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Wallet</h1>
        <p class="text-sm text-gray-500 mt-1">Earnings from fulfilled order requests</p>
      </div>
      <button @click="fetchWallet" class="text-sm text-blue-600 hover:underline">Refresh</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-400">Loading wallet...</div>

    <template v-else>
      <!-- Balance cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div class="text-sm font-medium text-gray-500 mb-1">Current Balance</div>
          <div class="text-3xl font-bold text-green-600">GH₵{{ fmt(wallet.balance) }}</div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div class="text-sm font-medium text-gray-500 mb-1">Total Earned</div>
          <div class="text-3xl font-bold text-gray-900">GH₵{{ fmt(wallet.total_earned) }}</div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div class="text-sm font-medium text-gray-500 mb-1">Total Withdrawn</div>
          <div class="text-3xl font-bold text-gray-900">GH₵{{ fmt(wallet.total_withdrawn) }}</div>
        </div>
      </div>

      <!-- Transaction history -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200">
          <h2 class="font-semibold text-gray-900">Transaction History</h2>
        </div>

        <div v-if="transactions.length === 0" class="p-8 text-center text-gray-500">
          No transactions yet.
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="tx in transactions" :key="tx.id"
            class="p-4 flex items-center justify-between gap-4"
          >
            <div>
              <div class="text-sm font-medium text-gray-900">{{ txLabel(tx.transaction_type) }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ tx.description || '—' }}</div>
              <div class="text-xs text-gray-400 mt-0.5">{{ formatDate(tx.created_at) }}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-sm font-semibold" :class="parseFloat(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ parseFloat(tx.amount) >= 0 ? '+' : '' }}GH₵{{ fmt(Math.abs(tx.amount)) }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">Bal: GH₵{{ fmt(tx.balance_after) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company'
})

const companyStore = useCompanyStore()

const loading = ref(true)
const wallet = ref({})
const transactions = ref([])

const fmt = (val) => parseFloat(val || 0).toFixed(2)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const txLabel = (type) => {
  const map = {
    order_earning: 'Order Earning',
    commission_deduction: 'Platform Commission',
    withdrawal: 'Withdrawal',
  }
  return map[type] || type?.replace(/_/g, ' ') || 'Transaction'
}

const fetchWallet = async () => {
  loading.value = true
  try {
    const res = await companyStore.makeAuthRequest('/api/pharmacy-portal/wallet')
    if (res.success) {
      wallet.value = res.wallet || {}
      transactions.value = res.transactions || []
    }
  } catch (e) {
    console.error('Failed to fetch wallet', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchWallet)
</script>
