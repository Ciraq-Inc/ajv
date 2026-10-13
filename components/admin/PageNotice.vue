<template>
  <div
    v-if="notice"
    data-test="page-notice"
    role="alert"
    :class="[
      'fixed left-1/2 top-4 z-[130] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg',
      notice.kind === 'success' ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800',
    ]"
  >
    <span class="flex-1">{{ notice.text }}</span>
    <button type="button" aria-label="Dismiss" class="leading-none" @click="$emit('dismiss')">×</button>
  </div>
</template>

<script setup lang="ts">
import type { PageNotice } from '~/composables/usePageNotice'

defineProps<{ notice: PageNotice | null }>()
defineEmits<{ dismiss: [] }>()
</script>
