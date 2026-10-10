<script setup lang="ts">
import { TabsContent } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <TabsContent :class="cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', props.class)">
    <slot />
  </TabsContent>
</template>
