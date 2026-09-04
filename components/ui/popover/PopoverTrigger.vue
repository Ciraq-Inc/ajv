<script setup lang="ts">
import { PopoverTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: unknown
  asChild?: boolean
}>()
</script>

<template>
  <PopoverTrigger :as-child="props.asChild" :class="cn('', props.class)">
    <slot />
  </PopoverTrigger>
</template>
