<template>
  <div class="analytics-page">
    <!-- Grouped Tab Navigation -->
    <div class="mb-6 overflow-x-auto pb-1">
      <div class="flex items-end min-w-max bg-gray-100 p-2 rounded-xl gap-1">
        <template v-for="(group, gi) in tabGroups" :key="group.label">
          <!-- Group divider -->
          <div v-if="gi > 0" class="flex-shrink-0 w-px bg-gray-300 self-stretch mx-1 my-0.5" />

          <!-- Group block -->
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1 select-none leading-none">
              {{ group.label }}
            </span>
            <div class="flex gap-0.5">
              <button
                v-for="tab in group.tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'py-1.5 px-3 text-xs font-medium rounded-md transition-all duration-150 whitespace-nowrap flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/60',
                ]"
              >
                <component :is="tab.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                {{ tab.short }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
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
          :entity="syncTabEntity[activeTab]"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
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

const activeTab = ref("companies");

// Maps tab id → entity key for ExtendedSyncData
const syncTabEntity = {
  'cust-returns':    'customer_returns',
  'out-credits':     'outstanding_credits',
  'settled-credits': 'settled_credit_headers',
  'conf-purchases':  'confirmed_purchases',
  'ins-items':       'insurance_items',
  'ins-headers':     'insurance_headers',
  'purch-returns':   'purchase_return_headers',
  'expenses':        'expenses',
};

const tabGroups = [
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

.tab-content {
  min-height: 600px;
}

.tab-panel {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
