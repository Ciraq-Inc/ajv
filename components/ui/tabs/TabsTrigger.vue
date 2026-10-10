<script setup lang="ts">
import { TabsTrigger } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <TabsTrigger
    :class="cn('inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primaryShadcn data-[state=active]:text-primaryShadcn-foreground data-[state=active]:shadow-sm', props.class)"
  >
    <slot />
  </TabsTrigger>
</template>
