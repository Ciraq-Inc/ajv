<template>
  <div class="rounded-3xl border border-[#ece7f4] bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-[#241432]">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-[#6d607c]">{{ subtitle }}</p>
      </div>
      <slot name="meta" />
    </div>

    <div v-if="items?.length" class="space-y-3">
      <div v-for="item in normalizedItems" :key="item.label" class="space-y-1.5">
        <div class="flex items-center justify-between gap-4 text-sm">
          <p class="truncate font-medium text-[#332046]">{{ item.label }}</p>
          <p class="shrink-0 text-xs font-semibold text-[#5b4076]">{{ formatter?.(item.value) ?? item.value }}</p>
        </div>
        <div class="h-2.5 overflow-hidden rounded-full bg-[#efe9f6]">
          <div
            class="h-full rounded-full cs-gradient-light"
            :style="{ width: `${item.percent}%` }"
          />
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl bg-[#faf7fd] px-4 py-6 text-sm text-[#7c7288]">
      No report entries available yet.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ChartItem {
  label: string
  value: number | string
  [key: string]: unknown
}

interface NormalizedItem extends ChartItem {
  value: number
  percent: number
}

const props = defineProps<{
  title: string
  subtitle?: string
  items?: ChartItem[]
  formatter?: (value: number) => string
}>()

const maxValue = computed<number>(() =>
  Math.max(...(props.items ?? []).map((item) => Number(item.value ?? 0)), 1),
)

const normalizedItems = computed<NormalizedItem[]>(() =>
  (props.items ?? []).map((item) => ({
    ...item,
    value: Number(item.value ?? 0),
    percent: Math.max(6, (Number(item.value ?? 0) / maxValue.value) * 100),
  })),
)
</script>
