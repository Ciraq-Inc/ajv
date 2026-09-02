<script setup lang="ts">
import { SelectIcon, SelectTrigger } from 'radix-vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { cn } from '~/lib/utils'

const props = defineProps<{
  id?: string
  class?: unknown
}>()
</script>

<template>
  <SelectTrigger
    :id="props.id"
    :class="cn('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground', props.class)"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDownIcon class="h-4 w-4 opacity-50" aria-hidden="true" />
    </SelectIcon>
  </SelectTrigger>
</template>
