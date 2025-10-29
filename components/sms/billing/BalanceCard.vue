<template>
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-sm text-blue-100 mb-1">SMS Credits Balance</p>
        <div class="flex items-baseline gap-2">
          <p class="text-4xl font-bold">
            {{ formatNumber(availableBalance) }}
          </p>
          <span class="text-lg text-blue-100">credits</span>
        </div>
      </div>
      <div class="bg-white bg-opacity-20 p-3 rounded-lg">
        <Icon name="MessageSquare" class="h-6 w-6" />
      </div>
    </div>

    <div v-if="reservedCredits > 0" class="mb-4 pb-4 border-b border-blue-400">
      <div class="flex items-center justify-between text-sm">
        <span class="text-blue-100">Reserved for Active Campaigns:</span>
        <span class="font-semibold">{{ formatNumber(reservedCredits) }} credits</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-xs text-blue-100 mb-1">Total Loaded</p>
        <p class="text-xl font-semibold">{{ formatNumber(totalLoaded) }}</p>
      </div>
      <div>
        <p class="text-xs text-blue-100 mb-1">Total Sent</p>
        <p class="text-xl font-semibold">{{ formatNumber(totalSent) }}</p>
      </div>
    </div>

    <div v-if="balanceData?.money_balance !== undefined" class="pt-4 border-t border-blue-400">
      <div class="flex items-center justify-between">
        <span class="text-sm text-blue-100">Money Balance:</span>
        <span class="text-lg font-semibold">{{ formatCurrency(balanceData.money_balance) }}</span>
      </div>
    </div>

    <div v-if="showActions" class="flex gap-2 mt-4">
      <button
        @click="$emit('refresh')"
        class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="RefreshCw" class="h-4 w-4" />
        Refresh
      </button>
      <button
        v-if="showTopUp"
        @click="$emit('topup')"
        class="flex-1 bg-white text-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Icon name="Plus" class="h-4 w-4" />
        Top Up
      </button>
    </div>

    <div v-if="lastUpdated" class="mt-4 text-xs text-blue-100 text-center">
      Last updated: {{ formatRelativeTime(lastUpdated) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber, formatCurrency, formatRelativeTime } from '~/utils/constants/sms'

const props = defineProps({
  balanceData: {
    type: Object,
    default: () => ({})
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showTopUp: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'topup'])

const availableBalance = computed(() => {
  return props.balanceData?.available_balance || 
         props.balanceData?.sms_balance || 
         0
})

const reservedCredits = computed(() => {
  return props.balanceData?.reserved_credits || 0
})

const totalLoaded = computed(() => {
  return props.balanceData?.total_sms_loaded || 0
})

const totalSent = computed(() => {
  return props.balanceData?.total_sms_sent || 0
})

const lastUpdated = computed(() => {
  return props.balanceData?.updated_at || props.balanceData?.last_updated
})
</script>
