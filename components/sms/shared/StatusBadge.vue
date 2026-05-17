<template>
  <span 
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      colorClass
    ]"
  >
    <span v-if="showDot" :class="['w-1.5 h-1.5 rounded-full mr-1.5', dotColorClass]"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatusLabel, getStatusColorClass } from '~/utils/constants/sms'

const props = defineProps<{
  status: string
  showDot?: boolean
}>()

const label = computed<string>(() => getStatusLabel(props.status))
const colorClass = computed<string>(() => getStatusColorClass(props.status))

const dotColorClass = computed<string>(() => {
  const baseClass = colorClass.value
  if (baseClass.includes('gray')) return 'bg-gray-600'
  if (baseClass.includes('blue')) return 'cs-btn'
  if (baseClass.includes('green')) return 'bg-green-600'
  if (baseClass.includes('yellow')) return 'bg-yellow-600'
  if (baseClass.includes('red')) return 'bg-red-600'
  return 'bg-gray-600'
})
</script>
