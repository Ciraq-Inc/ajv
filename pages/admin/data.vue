<template>
  <div class="analytics-page flex gap-6">
    <!-- Vertical Grouped Nav -->
    <aside class="data-sidebar bg-gray-100 rounded-xl p-3 flex flex-col gap-4">
      <div v-for="group in tabGroups" :key="group.label" class="flex flex-col gap-1">
        <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 select-none leading-none mb-1">
          {{ group.label }}
        </span>
        <button
          v-for="tab in group.tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'py-2 px-3 text-xs font-medium rounded-md transition-all duration-150 whitespace-nowrap flex items-center gap-2 text-left',
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-white/60',
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4 flex-shrink-0" />
          {{ tab.short }}
        </button>
      </div>
    </aside>

    <!-- Tab Content -->
    <div class="tab-content flex-1 min-w-0">
      <div class="tab-panel">
        <!-- Entities -->
        <Companies v-if="activeTab === 'companies'" />
        <Customers v-if="activeTab === 'customers'" />
        <Users v-if="activeTab === 'users'" />
        <InsurancePayers v-if="activeTab === 'insurance-payers'" />

        <!-- Transactions -->
        <SalesReports v-if="activeTab === 'sales-reports'" />
        <PurchaseReports v-if="activeTab === 'purchase-reports'" />

        <!-- Stock & Credits -->
        <Inventory v-if="activeTab === 'inventory'" />
        <ExtendedSyncData
          v-if="syncTabEntity[activeTab]"
          :key="activeTab"
          :entity="syncTabEntity[activeTab] ?? null"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Component } from "vue";
import Companies from "~/components/analytics/companies.vue";
import Inventory from "~/components/analytics/inventory.vue";
import SalesReports from "~/components/analytics/sales-reports.vue";
import PurchaseReports from "~/components/analytics/purchase-reports.vue";
import Customers from "~/components/analytics/customers.vue";
import Users from "~/components/analytics/users.vue";
import InsurancePayers from "~/components/analytics/insurance-payers.vue";
import ExtendedSyncData from "~/components/analytics/extended-sync-data.vue";
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  HeartIcon,
  ShoppingBagIcon,
  ArrowUturnLeftIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArchiveBoxArrowDownIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
});

const activeTab = ref<string>("companies");

// Maps tab id → entity key for ExtendedSyncData
const syncTabEntity: Record<string, string> = {
  'cust-returns':    'customer_returns',
  'out-credits':     'outstanding_credits',
  'settled-credits': 'settled_credit_headers',
  'conf-purchases':  'confirmed_purchases',
  'ins-items':       'insurance_items',
  'ins-headers':     'insurance_headers',
  'purch-returns':   'purchase_return_headers',
  'expenses':        'expenses',
};

interface TabDefinition {
  id: string;
  short: string;
  icon: Component;
}

interface TabGroup {
  label: string;
  tabs: TabDefinition[];
}

const tabGroups: TabGroup[] = [
  {
    label: 'Entities',
    tabs: [
      { id: 'companies',        short: 'Companies',       icon: BuildingOfficeIcon },
      { id: 'customers',        short: 'Customers',       icon: UserGroupIcon },
      { id: 'users',            short: 'Users',           icon: UserGroupIcon },
      { id: 'insurance-payers', short: 'Ins. Payers',     icon: HeartIcon },
    ],
  },
  {
    label: 'Transactions',
    tabs: [
      { id: 'sales-reports',    short: 'Sales',           icon: ChartBarIcon },
      { id: 'purchase-reports', short: 'Purchases',       icon: ShoppingCartIcon },
    ],
  },
  {
    label: 'Stock & Credits',
    tabs: [
      { id: 'inventory',        short: 'Inventory',       icon: ShoppingBagIcon },
      { id: 'conf-purchases',   short: 'Conf. Purchases', icon: ClipboardDocumentCheckIcon },
      { id: 'cust-returns',     short: 'Cust. Returns',   icon: ArrowUturnLeftIcon },
      { id: 'purch-returns',    short: 'Purch. Returns',  icon: ArchiveBoxArrowDownIcon },
      { id: 'out-credits',      short: 'Outstanding',     icon: CreditCardIcon },
      { id: 'settled-credits',  short: 'Settled',         icon: CheckCircleIcon },
      { id: 'ins-items',        short: 'Ins. Items',      icon: ShieldCheckIcon },
      { id: 'ins-headers',      short: 'Ins. Headers',    icon: ShieldCheckIcon },
      { id: 'expenses',         short: 'Expenses',        icon: BanknotesIcon },
    ],
  },
];
</script>

<style scoped>
.analytics-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.data-sidebar {
  width: 220px;
  flex-shrink: 0;
  align-self: flex-start;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}

.tab-content {
  min-height: 600px;
}

@media (max-width: 768px) {
  .analytics-page {
    flex-direction: column;
  }

  .data-sidebar {
    width: 100%;
    position: static;
    max-height: none;
  }
}

.tab-panel {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
