<script setup lang="ts">
import { PopoverRoot, PopoverTrigger } from 'radix-vue'
import { getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date'
import { computed, ref } from 'vue'
import { CalendarIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

const modelValue = defineModel<string>()

const props = defineProps<{
  placeholder?: string
  class?: unknown
}>()

const attrs = useAttrs()
const open = ref(false)

const selectedDate = computed<DateValue | undefined>(() => {
  if (!modelValue.value) return undefined
  try {
    return parseDate(modelValue.value)
  } catch {
    return undefined
  }
})

const display = computed(() => {
  if (!selectedDate.value) return props.placeholder || 'Pick a date'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    selectedDate.value.toDate(getLocalTimeZone()),
  )
})

const onSelect = (value: DateValue | undefined) => {
  modelValue.value = value ? value.toString() : undefined
  open.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      v-bind="attrs"
      type="button"
      :class="cn('flex h-10 w-full min-w-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2', props.class)"
    >
      <CalendarIcon class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate" :class="selectedDate ? 'font-medium text-slate-800' : 'text-slate-400'">{{ display }}</span>
      <ChevronDownIcon class="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
    </PopoverTrigger>
    <UiPopoverContent class="w-auto p-0" align="start">
      <UiCalendar :model-value="selectedDate" @update:model-value="onSelect" />
    </UiPopoverContent>
  </PopoverRoot>
</template>
