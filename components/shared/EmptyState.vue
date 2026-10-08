<!-- Shared empty state: what is empty, what will appear here, and (optionally) what to do next. -->
<template>
  <div class="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4">
    <span
      v-if="icon"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"
      aria-hidden="true"
    >
      <component :is="icon" class="h-5 w-5" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-ink-900">{{ title }}</p>
      <p v-if="description" class="mt-0.5 text-sm text-ink-500">{{ description }}</p>
      <div v-if="$slots.action" class="mt-3">
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>
