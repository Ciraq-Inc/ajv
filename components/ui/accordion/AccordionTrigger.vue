<script setup lang="ts">
import { AccordionHeader, AccordionTrigger } from 'radix-vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: unknown }>()
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      :class="cn('group flex flex-1 items-center justify-between gap-4 py-5 text-left font-semibold transition-colors hover:text-primaryShadcn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:text-primaryShadcn', props.class)"
    >
      <slot />
      <ChevronDownIcon class="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primaryShadcn motion-reduce:transition-none" aria-hidden="true" />
    </AccordionTrigger>
  </AccordionHeader>
</template>
