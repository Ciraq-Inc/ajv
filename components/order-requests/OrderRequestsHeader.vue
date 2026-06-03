<template>
  <div style="display: flex; align-items: center; gap: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem; flex-wrap: wrap;">
    <h1 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; white-space: nowrap;">Order Requests</h1>

    <!-- Inline stat pills -->
    <div v-if="stats" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #92400e;">
        <span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> {{ stats.pending || 0 }} Pending
      </span>
      <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #1d4ed8;">
        <span style="width:7px;height:7px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> {{ stats.processing || 0 }} In Progress
      </span>
      <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #15803d;">
        <span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;"></span> {{ stats.completed || 0 }} Fulfilled
      </span>
      <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #6d28d9;">
        <span style="width:7px;height:7px;border-radius:50%;background:#9333ea;display:inline-block;"></span> {{ stats.total || 0 }} Total
      </span>
    </div>

    <!-- Search — pushed to right, before action buttons -->
    <div style="display: flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-left: auto; transition: border-color 0.2s, box-shadow 0.2s;" onmouseover="this.style.borderColor='#d1d5db'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'">
      <div style="padding-left: 0.75rem; color: #9ca3af; display: flex; align-items: center; flex-shrink: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
      <input
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Search by ID, name or phone…"
        @keyup.enter="$emit('fetch-requests')"
        style="border: none; padding: 0.45rem 0.6rem; font-size: 0.82rem; width: 220px; outline: none; box-shadow: none; background: transparent; color: #374151;"
      />
      <button
        v-if="searchQuery"
        @click="$emit('clear-search')"
        style="background: none; border: none; padding: 0.4rem 0.5rem; color: #9ca3af; cursor: pointer; display: flex; align-items: center; outline: none;"
        onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#9ca3af'"
        title="Clear search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <button
        @click="$emit('fetch-requests')"
        style="padding: 0.45rem 1rem; font-size: 0.82rem; font-weight: 600; background: #f3f4f6; border: none; border-left: 1px solid #e5e7eb; color: #4b5563; cursor: pointer; transition: background 0.2s, color 0.2s; white-space: nowrap;"
        onmouseover="this.style.background='#e5e7eb'; this.style.color='#111827'" onmouseout="this.style.background='#f3f4f6'; this.style.color='#4b5563'"
      >
        Search
      </button>
    </div>

    <!-- Actions -->
    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
      <button @click="$emit('fetch-stats')" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: #374151; cursor:pointer;">
        <ChartBarIcon style="width: 0.9rem; height: 0.9rem;" />
        <span>Stats</span>
      </button>
      <button @click="$emit('fetch-requests')" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: #374151; cursor:pointer;">
        <ArrowPathIcon :class="{ 'animate-spin': loading }" style="width: 0.9rem; height: 0.9rem;" />
        <span>Refresh</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

interface OrderStats {
  pending: number
  processing: number
  completed: number
  total: number
  [key: string]: unknown
}

defineProps<{
  stats: OrderStats | null
  loading: boolean
  searchQuery: string
}>()

defineEmits<{
  'fetch-stats': []
  'fetch-requests': []
  'update:searchQuery': [value: string]
  'clear-search': []
}>()
</script>
