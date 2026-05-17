<template>
  <div class="rounded-3xl border border-[#ece7f4] bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-[#241432]">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-[#6d607c]">{{ subtitle }}</p>
      </div>
      <slot name="meta" />
    </div>

    <div v-if="normalizedPoints.length" class="space-y-3">
      <svg :viewBox="`0 0 ${width} ${height}`" class="h-44 w-full overflow-visible">
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <line
          v-for="tick in 4"
          :key="tick"
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="gridY(tick - 1)"
          :y2="gridY(tick - 1)"
          stroke="#eee8f5"
          stroke-width="1"
        />

        <path :d="areaPath" :fill="`url(#${gradientId})`" />
        <path
          :d="linePath"
          fill="none"
          stroke="#6d28d9"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
        />

        <circle
          v-for="point in normalizedPoints"
          :key="point.label"
          :cx="point.x"
          :cy="point.y"
          r="4.2"
          fill="#ffffff"
          stroke="#6d28d9"
          stroke-width="2.4"
        />
      </svg>

      <div class="grid grid-cols-3 gap-2 text-xs text-[#5f516c]">
        <div
          v-for="point in normalizedPoints"
          :key="`${point.label}-legend`"
          class="rounded-2xl bg-[#f8f4fd] px-3 py-2"
        >
          <p class="font-semibold text-[#2f1d42]">{{ point.label }}</p>
          <p class="mt-1">{{ formatter?.(point.value) ?? point.value }}</p>
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

interface Point {
  label: string
  value: number | string
  [key: string]: unknown
}

interface NormalizedPoint extends Point {
  value: number
  x: number
  y: number
}

const props = defineProps<{
  title: string
  subtitle?: string
  points?: Point[]
  formatter?: (value: number) => string
}>()

const width = 340
const height = 180
const padding = { top: 16, right: 12, bottom: 18, left: 12 }

const gradientId = `line-trend-${Math.random().toString(36).slice(2, 10)}`

const values = computed<number[]>(() => (props.points ?? []).map((p) => Number(p.value ?? 0)))
const maxValue = computed<number>(() => Math.max(...values.value, 1))

const normalizedPoints = computed<NormalizedPoint[]>(() => {
  const pts = props.points ?? []
  if (!pts.length) return []
  const stepX =
    pts.length > 1 ? (width - padding.left - padding.right) / (pts.length - 1) : 0

  return pts.map((point, index) => {
    const rawValue = Number(point.value ?? 0)
    const x = padding.left + stepX * index
    const ratio = rawValue / maxValue.value
    const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom)
    return { ...point, value: rawValue, x, y }
  })
})

const linePath = computed<string>(() =>
  normalizedPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' '),
)

const areaPath = computed<string>(() => {
  if (!normalizedPoints.value.length) return ''
  const first = normalizedPoints.value[0]
  const last = normalizedPoints.value[normalizedPoints.value.length - 1]
  if (!first || !last) return ''
  return `${linePath.value} L ${last.x} ${height - padding.bottom} L ${first.x} ${height - padding.bottom} Z`
})

const gridY = (index: number): number => {
  const ratio = index / 3
  return height - padding.bottom - ratio * (height - padding.top - padding.bottom)
}
</script>
