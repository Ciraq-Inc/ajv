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

<script setup>
import { computed } from 'vue'
import { getStatusLabel, getStatusColorClass } from '~/utils/constants/sms'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  showDot: {
    type: Boolean,
    default: false
  }
})

const label = computed(() => getStatusLabel(props.status))
const colorClass = computed(() => getStatusColorClass(props.status))

const dotColorClass = computed(() => {
  const baseClass = colorClass.value
  if (baseClass.includes('gray')) return 'bg-gray-600'
  if (baseClass.includes('blue')) return 'bg-blue-600'
  if (baseClass.includes('green')) return 'bg-green-600'
  if (baseClass.includes('yellow')) return 'bg-yellow-600'
  if (baseClass.includes('red')) return 'bg-red-600'
  return 'bg-gray-600'
})
</script>
