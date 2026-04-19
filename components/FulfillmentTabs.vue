<template>
  <div class="fulfillment-page">
    <!-- Tabs Navigation -->
    <div class="tabs-navigation">
      <NuxtLink 
        v-for="tab in tabs" 
        :key="tab.path"
        :to="tab.path" 
        class="tab-item"
        :class="{ active: isTabActive(tab.path) }"
      >
        <component :is="tab.icon" class="tab-icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </NuxtLink>
    </div>

    <!-- Content Area -->
    <div class="tab-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import {
  ClipboardDocumentListIcon,
  TruckIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()

const tabs = [
  { path: '/admin/fulfillment/requests', label: 'Order Requests', icon: ClipboardDocumentListIcon },
  { path: '/admin/fulfillment/deliveries', label: 'Deliveries', icon: TruckIcon },
  { path: '/admin/fulfillment/dispatch-companies', label: 'Dispatch Companies', icon: BuildingOffice2Icon },
  { path: '/admin/fulfillment/pharmacy-ledger', label: 'Pharmacy Ledger', icon: BanknotesIcon },
]

const isTabActive = (path) => {
  return route.path === path
}
</script>

<style scoped>
.fulfillment-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-navigation {
  display: flex;
  gap: 0.25rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.tab-item:hover {
  color: #111827;
  background: #f9fafb;
}

.tab-item.active {
  color: #4F217A;
  border-bottom-color: #4F217A;
}

.tab-icon {
  width: 1rem;
  height: 1rem;
}

.tab-label {
  display: inline-block;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>
