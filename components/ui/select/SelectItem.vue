<script setup lang="ts">
import { SelectItem, SelectItemIndicator, SelectItemText } from 'radix-vue'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { cn } from '~/lib/utils'

const props = defineProps<{
  value: string
  class?: unknown
}>()
</script>

<template>
  <SelectItem
    :value="props.value"
    :class="cn('relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none focus:bg-slate-100 focus:text-slate-950 data-[disabled]:pointer-events-none data-[disabled]:opacity-50', props.class)"
  >
    <span class="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <CheckIcon class="h-4 w-4 text-slate-700" aria-hidden="true" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
