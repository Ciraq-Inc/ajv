<!-- Extracted from pages/admin/fulfillment/order-requests.vue — compact header bar section -->
<template>
  <div
    style="display: flex; align-items: center; gap: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem; flex-wrap: wrap;"
  >
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

    <!-- Actions pushed to the right -->
    <div style="display: flex; gap: 0.5rem; margin-left: auto;">
      <button
        @click="$emit('fetch-stats')"
        class="btn-secondary"
        :disabled="loading ?? false"
        style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: #374151; cursor:pointer;"
      >
        <ChartBarIcon style="width: 0.9rem; height: 0.9rem;" />
        <span>Stats</span>
      </button>
      <button
        @click="$emit('fetch-requests')"
        class="btn-secondary"
        :disabled="loading ?? false"
        style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: #374151; cursor:pointer;"
      >
        <ArrowPathIcon :class="{ 'animate-spin': loading }" style="width: 0.9rem; height: 0.9rem;" />
        <span>Refresh</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

interface RequestStats {
  total?: number;
  pending?: number;
  active?: number;
  completed?: number;
  [key: string]: unknown;
}

defineProps<{
  stats?: RequestStats | null;
  loading?: boolean;
}>()

defineEmits<{
  'fetch-stats': [];
  'fetch-requests': [];
}>()
</script>
