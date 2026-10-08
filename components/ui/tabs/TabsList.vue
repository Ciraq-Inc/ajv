<script setup lang="ts">
import { TabsList } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <TabsList :class="cn('inline-flex items-center rounded-full bg-muted p-1 text-muted-foreground', props.class)">
    <slot />
  </TabsList>
</template>
