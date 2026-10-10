<!-- Shared section heading with an optional "see more" action. -->
<template>
  <div class="flex items-center justify-between border-b border-brand-100 pb-2">
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-brand-700" aria-hidden="true"></span>
      <h2 class="text-xs font-bold uppercase tracking-widest text-brand-700">{{ title }}</h2>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      :aria-label="`${actionLabel}: ${title}`"
      class="inline-flex min-h-[32px] items-center gap-0.5 rounded px-1 text-xs font-bold uppercase tracking-widest text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
      @click="emit('action')"
    >
      {{ actionLabel }}
      <ChevronRightIcon class="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title: string
  actionLabel?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>
