<script setup lang="ts">
import { SelectContent, SelectPortal, SelectViewport } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: unknown
  bodyLock?: boolean
}>()
</script>

<template>
  <SelectPortal>
    <SelectContent
      position="popper"
      :body-lock="props.bodyLock"
      :side-offset="4"
      :class="cn('relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-lg shadow-slate-900/5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', props.class)"
    >
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>
