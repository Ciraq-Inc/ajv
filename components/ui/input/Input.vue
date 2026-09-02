<script setup lang="ts">
import { cn } from '~/lib/utils'

const modelValue = defineModel<string | number>()

const props = withDefaults(defineProps<{
  type?: string
  class?: unknown
}>(), {
  type: 'text',
})
</script>

<template>
  <input
    v-model="modelValue"
    :type="type"
    :class="cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  >
</template>
