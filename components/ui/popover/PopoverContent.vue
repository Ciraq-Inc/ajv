<script setup lang="ts">
import { PopoverPortal, PopoverContent } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  class?: unknown
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
}>(), {
  sideOffset: 6,
  align: 'start',
})
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      :side-offset="props.sideOffset"
      :align="props.align"
      :class="cn('relative z-50 w-72 rounded-lg border border-slate-200 bg-white text-slate-950 shadow-lg shadow-slate-900/5 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', props.class)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
