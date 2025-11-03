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
            <Icon :name="tab.icon" size="18" />
            <span>{{ tab.name }}</span>
          </span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'" class="tab-panel">
        <Dashboard />
      </div>

      <!-- Sales Analytics Tab -->
      <div v-if="activeTab === 'sales'" class="tab-panel">
        <div class="bg-white rounded-lg p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Sales Analytics</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg"
            >
              <h3 class="text-lg font-semibold mb-2">Monthly Sales</h3>
              <p class="text-3xl font-bold">$45,230</p>
              <p class="text-sm opacity-80 mt-2">+12.5% from last month</p>
            </div>
            <div
              class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg"
            >
              <h3 class="text-lg font-semibold mb-2">Average Order Value</h3>
              <p class="text-3xl font-bold">$89.50</p>
              <p class="text-sm opacity-80 mt-2">+5.2% from last month</p>
            </div>
            <div
              class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg"
            >
              <h3 class="text-lg font-semibold mb-2">Conversion Rate</h3>
              <p class="text-3xl font-bold">3.8%</p>
              <p class="text-sm opacity-80 mt-2">+0.3% from last month</p>
            </div>
          </div>
          <div class="mt-8">
            <h3 class="text-xl font-semibold text-gray-800 mb-4">
              Sales Trends
            </h3>
            <div
              class="h-64 bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <p class="text-gray-500">Sales chart will be implemented here</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Analytics Tab -->
      <div v-if="activeTab === 'customers'" class="tab-panel">
        <Customers />
      </div>

      <!-- Inventory Analytics Tab -->
      <div v-if="activeTab === 'inventory'" class="tab-panel">
       <Inventory />
      </div>

      <!-- Sales Reports Tab -->
      <div v-if="activeTab === 'sales-reports'" class="tab-panel">
        <SalesReports />
      </div>

      <!-- Purchase Reports Tab -->
      <div v-if="activeTab === 'purchase-reports'" class="tab-panel">
        <PurchaseReports />
      </div>

      <!-- Reports Tab -->
      <div v-if="activeTab === 'reports'" class="tab-panel">
        <div class="bg-white rounded-lg p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            Reports & Exports
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800">Quick Reports</h3>
              <button
                class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Sales Report</div>
                    <div class="text-sm text-gray-600">
                      Monthly sales summary
                    </div>
                  </div>
                  <Icon name="BarChart3" class="text-blue-600" size="20" />
                </div>
              </button>
              <button
                class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Inventory Report</div>
                    <div class="text-sm text-gray-600">
                      Current stock levels
                    </div>
                  </div>
                  <Icon name="Package" class="text-green-600" size="20" />
                </div>
              </button>
              <button
                class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Customer Report</div>
                    <div class="text-sm text-gray-600">
                      Customer behavior analysis
                    </div>
                  </div>
                  <Icon name="Users" class="text-purple-600" size="20" />
                </div>
              </button>
            </div>
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800">
                Export Options
              </h3>
              <div class="p-4 border border-gray-200 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <div class="font-medium">Export Format</div>
                  <select
                    class="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
                <div class="flex items-center justify-between mb-3">
                  <div class="font-medium">Date Range</div>
                  <select
                    class="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>Custom range</option>
                  </select>
                </div>
                <button
                  class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Companies Tab -->
      <div v-if="activeTab === 'companies'" class="tab-panel">
        <Companies />
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="tab-panel">
        <Users />
      </div>

      <!-- Sales Items Tab -->
      <div v-if="activeTab === 'sales-items'" class="tab-panel">
        <SalesReports />
      </div>

      <!-- Purchase Items Tab -->
      <div v-if="activeTab === 'purchase-items'" class="tab-panel">
        <PurchaseReports />
      </div>

      <!-- Insurance Payers Tab -->
      <div v-if="activeTab === 'insurance-payers'" class="tab-panel">
        <InsurancePayers />
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
    icon: "Building2",
  },
  {
    id: "customers",
    name: "Customers",
    icon: "Users",
  },
  {
    id: "users",
    name: "Users",
    icon: "Users",
  },
  {
    id: "sales-reports",
    name: "Sales Reports",
    icon: "TrendingUp",
  },

  {
    id: "purchase-reports",
    name: "Purchase Reports",
    icon: "ShoppingCart",
  },
  
  {
    id: "customers",
    name: "Customers",
    icon: "Users",
  },
  {
    id: "insurance-payers",
    name: "Insurance Payers",
    icon: "Heart",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: "Package",
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
