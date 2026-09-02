<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: unknown
}>()
</script>

<template>
  <div :class="cn('space-y-1.5 text-left', props.class)">
    <slot />
  </div>
</template>
