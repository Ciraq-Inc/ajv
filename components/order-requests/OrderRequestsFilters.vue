<template>
  <div class="filters-bar" style="margin-bottom: 1rem;">
    <div class="status-tabs-bar" role="tablist" aria-label="Order request status filters" style="display: flex; flex-wrap: nowrap; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.02); overflow-x: auto; width: 100%;">

      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        type="button"
        class="status-tab-pill"
        :class="{ active: statusFilter === tab.value }"
        @click="$emit('set-status-filter', tab.value)"
        :style="statusFilter === tab.value ? 'background: linear-gradient(135deg, #4F217A, #381659); box-shadow: 0 2px 6px rgba(79, 33, 122, 0.25); color: #fff; font-weight: 600; border: 1px solid transparent; flex-shrink: 0;' : 'color: #4b5563; font-weight: 500; background: #f9fafb; border: 1px solid #f3f4f6; flex-shrink: 0;'"
        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1.1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;"
        onmouseover="if(this.className.indexOf('active') === -1) { this.style.background = '#f3f4f6'; this.style.color = '#111827'; this.style.borderColor = '#e5e7eb'; }"
        onmouseout="if(this.className.indexOf('active') === -1) { this.style.background = '#f9fafb'; this.style.color = '#4b5563'; this.style.borderColor = '#f3f4f6'; }"
      >
        <span>{{ tab.label }}</span>
        <span class="status-tab-count" style="display: inline-flex; align-items: center; justify-content: center; padding: 0 0.5rem; font-size: 0.65rem; font-weight: 700; border-radius: 999px; height: 1.25rem;" :style="statusFilter === tab.value ? 'background: rgba(255,255,255,0.2); color: #fff;' : 'background: #e5e7eb; color: #374151;'">{{ tab.count }}</span>
        <span v-if="tab.value === 'pending' && expiringSoonCount > 0" style="display: inline-flex; align-items: center; justify-content: center; padding: 0 0.4rem; font-size: 0.6rem; font-weight: 700; border-radius: 999px; height: 1.1rem; background: #ef4444; color: #fff;" title="Requests closing soon">{{ expiringSoonCount }}</span>
      </button>

      <div style="margin-left: auto; flex-shrink: 0; display: flex; align-items: center;">
        <div style="width: 1px; height: 1.5rem; background: #e5e7eb; margin-right: 0.6rem;"></div>
        <div style="position: relative; display: flex; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding-left: 0.75rem; overflow: hidden; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#d1d5db'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'">
          <div style="color: #6b7280; display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; white-space: nowrap;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
            Change Status:
          </div>
          <select :value="statusFilter" @change="$emit('set-status-filter', ($event.target as HTMLSelectElement).value)" class="form-control" style="padding: 0.55rem 0.75rem; font-size: 0.85rem; font-weight: 600; border: none; background: transparent; color: #4F217A; cursor: pointer; outline: none; transition: all 0.2s ease; min-width: 160px; -webkit-appearance: none; appearance: none;">
            <option value="">-- Select Status --</option>
            <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
              {{ tab.label }}
            </option>
            <optgroup label="Other statuses">
              <option v-for="option in statusSelectorOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </optgroup>
          </select>
          <div style="position: absolute; right: 0.75rem; pointer-events: none; color: #4F217A; display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatusTab {
  value: string
  label: string
  count: number
  statuses: string[]
}

interface StatusSelectorOption {
  value: string
  label: string
  count?: number
}

defineProps<{
  statusFilter: string
  statusTabs: StatusTab[]
  statusSelectorOptions: StatusSelectorOption[]
  expiringSoonCount: number
}>()

defineEmits<{
  'set-status-filter': [value: string]
}>()
</script>
