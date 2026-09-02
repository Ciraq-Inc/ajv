<script setup lang="ts">
import { DialogDescription } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: unknown
}>()
</script>

<template>
  <DialogDescription :class="cn('text-sm text-slate-500', props.class)">
    <slot />
  </DialogDescription>
</template>
