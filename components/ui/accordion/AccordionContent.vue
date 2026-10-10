<script setup lang="ts">
import { AccordionContent } from 'radix-vue'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <AccordionContent
    class="overflow-hidden text-[0.95rem] leading-relaxed text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
  >
    <div :class="cn('pb-5 pr-8', props.class)">
      <slot />
    </div>
  </AccordionContent>
</template>
