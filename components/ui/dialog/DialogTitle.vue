<script setup lang="ts">
import { DialogTitle } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: unknown
}>()
</script>

<template>
  <DialogTitle :class="cn('text-lg font-semibold leading-none tracking-tight text-slate-950', props.class)">
    <slot />
  </DialogTitle>
</template>
