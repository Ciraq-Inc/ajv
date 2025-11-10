<template>
  <div class="analytics-page">
    <!-- Tab Navigation -->
    <div class="mb-6">
      <nav class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === tab.id
              ? 'bg-white text-gray-900'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
          ]"
        >
          <span class="flex items-center justify-center space-x-2">
            <component :is="tab.icon" class="w-5 h-5" />
            <span>{{ tab.name }}</span>
          </span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Companies Tab -->
      <div v-if="activeTab === 'companies'" class="tab-panel">
        <Companies />
      </div>

      <!-- Customers Tab -->
      <div v-if="activeTab === 'customers'" class="tab-panel">
        <Customers />
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-panel">
        <Users />
      </div>

      <!-- Sales Reports Tab -->
      <div v-if="activeTab === 'sales-reports'" class="tab-panel">
        <SalesReports />
      </div>

      <!-- Purchase Reports Tab -->
      <div v-if="activeTab === 'purchase-reports'" class="tab-panel">
        <PurchaseReports />
      </div>

      <!-- Insurance Payers Tab -->
      <div v-if="activeTab === 'insurance-payers'" class="tab-panel">
        <InsurancePayers />
      </div>

      <!-- Inventory Tab -->
      <div v-if="activeTab === 'inventory'" class="tab-panel">
        <Inventory />
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
import { useAdminStore } from "~/stores/admin";
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  HeartIcon,
  ShoppingBagIcon,
} from "@heroicons/vue/24/outline";

// Define page metadata with middleware
definePageMeta({
  middleware: ['admin-auth'], // Use the admin authentication middleware
  layout: 'admin-layout',
});

// Use admin store
const adminStore = useAdminStore();

// Active tab state
const activeTab = ref("companies");

// Tab configuration
const tabs = [
  {
    id: "companies",
    name: "Companies",
    icon: BuildingOfficeIcon,
  },
  {
    id: "customers",
    name: "Customers",
    icon: UserGroupIcon,
  },
  {
    id: "users",
    name: "Users",
    icon: UserGroupIcon,
  },
  {
    id: "sales-reports",
    name: "Sales Reports",
    icon: ChartBarIcon,
  },
  {
    id: "purchase-reports",
    name: "Purchase Reports",
    icon: ShoppingCartIcon,
  },
  {
    id: "insurance-payers",
    name: "Insurance Payers",
    icon: HeartIcon,
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: ShoppingBagIcon,
  },
];
</script>

<style scoped>
.analytics-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.tab-content {
  min-height: 600px;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
