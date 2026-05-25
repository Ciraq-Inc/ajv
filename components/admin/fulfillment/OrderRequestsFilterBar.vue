<!-- Extracted from pages/admin/fulfillment/order-requests.vue — filters bar section -->
<template>
  <div
    class="filters-bar"
    style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; gap: 1rem;"
  >
    <div
      class="status-tabs-bar"
      role="tablist"
      aria-label="Order request status filters"
      style="display: flex; flex-wrap: nowrap; align-items: center; gap: 0.4rem; padding: 0.35rem; padding-left: 0.8rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.02); overflow-x: auto; white-space: nowrap; max-width: 100%;"
    >
      <div style="width: 1px; height: 1.5rem; background: #e5e7eb; margin-right: 0.2rem; flex-shrink: 0;"></div>
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        type="button"
        class="status-tab-pill"
        :class="{ active: modelValue === tab.value }"
        @click="$emit('update:modelValue', tab.value)"
        :style="modelValue === tab.value ? 'background: linear-gradient(135deg, #4F217A, #381659); box-shadow: 0 2px 6px rgba(79, 33, 122, 0.25); color: #fff; font-weight: 600; border: 1px solid transparent; flex-shrink: 0;' : 'color: #4b5563; font-weight: 500; background: #f9fafb; border: 1px solid #f3f4f6; flex-shrink: 0;'"
        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1.1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;"
        onmouseover="if(this.className.indexOf('active') === -1) { this.style.background = '#f3f4f6'; this.style.color = '#111827'; this.style.borderColor = '#e5e7eb'; }"
        onmouseout="if(this.className.indexOf('active') === -1) { this.style.background = '#f9fafb'; this.style.color = '#4b5563'; this.style.borderColor = '#f3f4f6'; }"
      >
        <span>{{ tab.label }}</span>
        <span
          class="status-tab-count"
          style="display: inline-flex; align-items: center; justify-content: center; padding: 0 0.5rem; font-size: 0.65rem; font-weight: 700; border-radius: 999px; height: 1.25rem;"
          :style="modelValue === tab.value ? 'background: rgba(255,255,255,0.2); color: #fff;' : 'background: #e5e7eb; color: #374151;'"
        >{{ tab.count }}</span>
        <span
          v-if="tab.value === 'pending' && (expiringSoonCount ?? 0) > 0"
          style="display: inline-flex; align-items: center; justify-content: center; padding: 0 0.4rem; font-size: 0.6rem; font-weight: 700; border-radius: 999px; height: 1.1rem; background: #ef4444; color: #fff;"
          title="Requests closing soon"
        >{{ expiringSoonCount }}</span>
      </button>

      <!-- Status Changer on the Far Right -->
      <div
        style="position: relative; display: flex; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding-left: 0.75rem; overflow: hidden; transition: all 0.2s ease;"
        onmouseover="this.style.borderColor='#d1d5db'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.06)'"
        onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'"
      >
        <div style="color: #6b7280; display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          Change Status:
        </div>
        <select
          :value="modelValue"
          @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
          class="form-control"
          style="padding: 0.55rem 0.75rem; font-size: 0.85rem; font-weight: 600; border: none; background: transparent; color: #4F217A; cursor: pointer; outline: none; transition: all 0.2s ease; min-width: 160px; -webkit-appearance: none; appearance: none;"
        >
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

    <div style="display: flex; gap: 0.75rem; align-items: center; flex: 1 1 auto; justify-content: flex-end; min-width: 300px;">
      <!-- Search Group -->
      <div
        class="search-group"
        style="display: flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;"
        onmouseover="this.style.borderColor='#d1d5db'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.06)'"
        onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'"
      >
        <div style="padding-left: 0.75rem; color: #9ca3af; display: flex; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          class="form-control search-input"
          placeholder="Search records by ID, Name or phone..."
          @keyup.enter="$emit('search')"
          style="border: none; padding: 0.55rem 0.6rem; font-size: 0.85rem; min-width: 250px; outline: none; box-shadow: none; background: transparent; color: #374151;"
        />
        <button
          v-if="searchQuery"
          @click="$emit('clear-search')"
          style="background: none; border: none; padding: 0.5rem; color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none;"
          onmouseover="this.style.color='#ef4444'"
          onmouseout="this.style.color='#9ca3af'"
          title="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <button
          @click="$emit('search')"
          class="btn-primary btn-sm"
          style="padding: 0.55rem 1.2rem; font-size: 0.85rem; font-weight: 600; background: #f3f4f6; border: none; border-left: 1px solid #e5e7eb; color: #4b5563; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.3rem;"
          onmouseover="this.style.background='#e5e7eb'; this.style.color='#111827'"
          onmouseout="this.style.background='#f3f4f6'; this.style.color='#4b5563'"
        >
          Search
        </button>
      </div>

      <!-- Refresh Button -->
      <button
        @click="$emit('search')"
        style="display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; width: 2.6rem; height: 2.6rem; color: #6b7280; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;"
        onmouseover="this.style.background='#f9fafb'; this.style.color='#111827'; this.style.transform='rotate(15deg)'"
        onmouseout="this.style.background='#fff'; this.style.color='#6b7280'; this.style.transform='rotate(0deg)'"
        title="Refresh records"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatusTab {
  value: string;
  label: string;
  count?: number;
  [key: string]: unknown;
}

interface StatusOption {
  value: string;
  label: string;
  [key: string]: unknown;
}

defineProps<{
  modelValue?: string;
  searchQuery?: string;
  statusTabs?: StatusTab[];
  statusSelectorOptions?: StatusOption[];
  expiringSoonCount?: number;
}>()

defineEmits<{
  'update:modelValue': [value: string];
  'update:searchQuery': [value: string];
  'search': [];
  'clear-search': [];
}>()
</script>
