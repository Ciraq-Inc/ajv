<template>
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
    <!-- Main Balance Section -->
    <div class="flex items-center justify-between mb-3">
      <div>
        <p class="text-xs text-blue-100 mb-0.5">SMS Credits Balance</p>
        <div class="flex items-baseline gap-1">
          <p class="text-3xl font-bold">{{ formatNumber(availableBalance) }}</p>
          <span class="text-sm text-blue-100">credits</span>
        </div>
      </div>
      <div class="bg-white bg-opacity-20 p-2 rounded-lg">
        <ChatBubbleLeftIcon class="h-5 w-5" />
      </div>
    </div>

    <!-- Reserved Credits (if any) -->
    <div v-if="reservedCredits > 0" class="mb-3 pb-2 border-b border-blue-400">
      <div class="flex items-center justify-between text-xs">
        <span class="text-blue-100">Reserved:</span>
        <span class="font-semibold">{{ formatNumber(reservedCredits) }}</span>
      </div>
    </div>

    <!-- Stats Row -->
    <!-- <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
      <div>
        <p class="text-blue-100 mb-0.5">Loaded</p>
        <p class="font-semibold text-sm">{{ formatNumber(totalLoaded) }}</p>
      </div>
      <div>
        <p class="text-blue-100 mb-0.5">Sent</p>
        <p class="font-semibold text-sm">{{ formatNumber(totalSent) }}</p>
      </div>
    </div> -->

    <!-- Money Balance -->
    <div v-if="balanceData?.money_balance !== undefined" class="mb-3 pb-2 border-t border-blue-400 pt-2">
      <div class="flex items-center justify-between text-xs">
        <span class="text-blue-100">Money:</span>
        <span class="font-semibold">{{ formatCurrency(balanceData.money_balance) }}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActions" class="flex gap-2">
      <button
        @click="$emit('refresh')"
        class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1 font-medium"
      >
        <ArrowPathIcon class="h-3.5 w-3.5" />
        <span>Refresh</span>
      </button>
      <button
        v-if="showTopUp"
        @click="$emit('topup')"
        class="flex-1 bg-white text-blue-600 hover:bg-blue-50 py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1 font-medium"
      >
        <PlusIcon class="h-3.5 w-3.5" />
        <span>Top Up</span>
      </button>
    </div>

    <!-- Last Updated -->
    <div v-if="lastUpdated" class="mt-2 text-xs text-blue-100 text-center opacity-75">
      {{ formatRelativeTime(lastUpdated) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChatBubbleLeftIcon, ArrowPathIcon, PlusIcon } from '@heroicons/vue/20/solid'
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
