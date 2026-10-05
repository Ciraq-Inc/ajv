<script setup lang="ts">
import { computed, ref } from 'vue'

const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })

defineProps<{ placeholder?: string }>()

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d }

const presets: Array<{ key: string, label: string, range: () => [string, string] }> = [
  { key: 'today', label: 'Today', range: () => [iso(new Date()), iso(new Date())] },
  { key: 'last7', label: 'Last 7 days', range: () => [iso(daysAgo(6)), iso(new Date())] },
  { key: 'last30', label: 'Last 30 days', range: () => [iso(daysAgo(29)), iso(new Date())] },
  { key: 'month', label: 'This month', range: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(new Date(n.getFullYear(), n.getMonth() + 1, 0))] } },
  { key: 'lastMonth', label: 'Last month', range: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))] } },
]

const customOpen = ref(false)
const matched = computed(() => presets.find((preset) => {
  const [start, end] = preset.range()
  return start === from.value && end === to.value
})?.key)
const selected = computed(() => {
  if (customOpen.value || ((from.value || to.value) && !matched.value)) return 'custom'
  return matched.value || 'any'
})

const onSelect = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'any') { customOpen.value = false; from.value = ''; to.value = ''; return }
  if (value === 'custom') { customOpen.value = true; return }
  customOpen.value = false
  const preset = presets.find((item) => item.key === value)
  if (preset) [from.value, to.value] = preset.range()
}
</script>

<template>
  <div class="drp">
    <select class="drp-select" :class="{ 'is-set': selected !== 'any' }" aria-label="Date" :value="selected" @change="onSelect">
      <option value="any">{{ placeholder || 'Any date' }}</option>
      <option v-for="preset in presets" :key="preset.key" :value="preset.key">{{ preset.label }}</option>
      <option value="custom">Custom range…</option>
    </select>
    <div v-if="selected === 'custom'" class="drp-custom">
      <input v-model="from" type="date" class="drp-date" aria-label="From date" :max="to || undefined">
      <span class="drp-to">to</span>
      <input v-model="to" type="date" class="drp-date" aria-label="To date" :min="from || undefined">
    </div>
  </div>
</template>

<style>
.drp { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.drp-select, .drp-date { height: 36px; border: 1px solid var(--line-2, #d3d6dd); border-radius: 8px; background: #fff; padding: 0 12px; font-size: 13px; color: var(--ink, #14161c); }
.drp-select { cursor: pointer; min-width: 140px; }
.drp-select.is-set { background: var(--wash, #f6f7f9); border-color: #b9bdc7; font-weight: 500; }
.drp-select:focus-visible, .drp-date:focus-visible { outline: none; border-color: var(--ink, #14161c); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.1); }
.drp-custom { display: inline-flex; align-items: center; gap: 6px; }
.drp-to { font-size: 12.5px; color: var(--mute, #6a6f7d); }
@media (max-width: 640px) {
  .drp { width: 100%; }
  .drp-select { flex: 1; }
  .drp-custom { width: 100%; }
  .drp-date { flex: 1; min-width: 0; }
}
</style>
