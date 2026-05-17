<template>
  <div class="rounded-3xl border border-[#ece7f4] bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-[#241432]">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-[#6d607c]">{{ subtitle }}</p>
      </div>
    </div>

    <div v-if="segments?.length" class="grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
      <div class="mx-auto h-40 w-40">
        <svg viewBox="0 0 120 120" class="h-full w-full">
          <circle cx="60" cy="60" r="38" fill="none" stroke="#efe8f7" stroke-width="16" />
          <circle
            v-for="segment in arcSegments"
            :key="segment.label"
            cx="60"
            cy="60"
            r="38"
            fill="none"
            :stroke="segment.color"
            stroke-width="16"
            stroke-linecap="round"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="56" text-anchor="middle" class="fill-[#2f1d42] text-[12px] font-semibold">
            {{ centerLabel }}
          </text>
          <text x="60" y="72" text-anchor="middle" class="fill-[#6d607c] text-[9px]">
            {{ centerValue }}
          </text>
        </svg>
      </div>

      <div class="space-y-3">
        <div v-for="segment in normalizedSegments" :key="segment.label" class="flex items-center justify-between gap-3 rounded-2xl bg-[#faf7fd] px-3 py-2">
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: segment.color }" />
            <span class="text-sm font-medium text-[#332046]">{{ segment.label }}</span>
          </div>
          <span class="text-xs font-semibold text-[#5b4076]">{{ formatter?.(segment.value) ?? segment.value }}</span>
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl bg-[#faf7fd] px-4 py-6 text-sm text-[#7c7288]">
      Not enough data to render this chart yet.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Segment {
  label: string
  value: number | string
  color?: string
}

interface NormalizedSegment {
  label: string
  value: number
  color: string
}

interface ArcSegment extends NormalizedSegment {
  dashArray: string
  dashOffset: number
}

const props = defineProps<{
  title: string
  subtitle?: string
  centerLabel?: string
  centerValue?: string
  formatter?: (value: number) => string
  segments?: Segment[]
}>()

const palette = ['#6d28d9', '#a855f7', '#ec4899', '#22c55e', '#f97316']
const circumference = 2 * Math.PI * 38

const normalizedSegments = computed<NormalizedSegment[]>(() =>
  (props.segments ?? [])
    .map((segment, index) => ({
      ...segment,
      value: Number(segment.value ?? 0),
      color: segment.color ?? palette[index % palette.length] ?? '#6d28d9',
    }))
    .filter((segment) => segment.value > 0),
)

const total = computed<number>(() =>
  normalizedSegments.value.reduce((sum, segment) => sum + segment.value, 0),
)

const arcSegments = computed<ArcSegment[]>(() => {
  let runningOffset = 0
  return normalizedSegments.value.map((segment) => {
    const ratio = total.value > 0 ? segment.value / total.value : 0
    const dashLength = ratio * circumference
    const current: ArcSegment = {
      ...segment,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -runningOffset,
    }
    runningOffset += dashLength
    return current
  })
})
</script>
