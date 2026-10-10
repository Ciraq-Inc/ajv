<script setup lang="ts">
import { AccordionItem } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <AccordionItem :class="cn('border-b border-border', props.class)">
    <slot />
  </AccordionItem>
</template>
