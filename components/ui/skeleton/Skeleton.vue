<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <div :class="cn('animate-pulse rounded-xl bg-muted motion-reduce:animate-none', props.class)" />
</template>
