<template>
  <div class="summaries-analytics">
    <div class="bg-white rounded-lg p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Analytics Summaries</h2>
          <p class="text-sm text-gray-500 mt-1">Cross-tenant summary data and analytics</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="exportToJSON"
            :disabled="loading"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>JSON</span>
            </span>
          </button>
          <button
            @click="exportToCSV"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>CSV</span>
            </span>
          </button>
          <button
            @click="refreshData"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <span class="flex items-center gap-2">
              <ArrowPathIcon class="refresh-icon" :class="{ 'animate-spin': loading }" />
              <span>{{ loading ? "Loading..." : "Refresh" }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
        {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p class="text-gray-600 mt-4">Loading summary data...</p>
      </div>

      <!-- Summary Tables -->
      <div v-else class="space-y-8">
        <!-- Stock Value Summary -->
        <div class="summary-section">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Stock Value Summary</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Company</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Products</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Units</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cost Value</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Selling Value</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Profit</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Margin %</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="!stockValue || !stockValue.companies || stockValue.companies.length === 0">
                  <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No stock value data available
                  </td>
                </tr>
                <tr v-else v-for="company in stockValue.companies" :key="company.company_id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ company.company_name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(company.inventory.total_products) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(company.inventory.total_units) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    GH₵ {{ formatNumber(company.valuation.cost_value) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    GH₵ {{ formatNumber(company.valuation.selling_value) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    GH₵ {{ formatNumber(company.valuation.potential_profit) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ company.valuation.profit_margin }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Products Summary -->
        <div class="summary-section">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Products Summary</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rank</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity Sold</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Revenue</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Profit</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Margin %</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Companies</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="!topProducts || topProducts.length === 0">
                  <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No top products data available
                  </td>
                </tr>
                <tr v-else v-for="product in topProducts" :key="product.product_id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{{ product.rank }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ product.product_name }}</div>
                    <div v-if="product.strength" class="text-xs text-gray-500">{{ product.strength }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(product.performance.total_quantity) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    GH₵ {{ formatNumber(product.performance.total_revenue) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    GH₵ {{ formatNumber(product.performance.total_profit) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ product.performance.profit_margin }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ product.distribution.company_count }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alerts Summary -->
        <div class="summary-section">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Alerts Summary</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Severity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Company</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Current Stock</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reorder Level</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Alert Type</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="!alerts || !alerts.alerts || alerts.alerts.length === 0">
                  <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No alerts data available
                  </td>
                </tr>
                <tr v-else v-for="alert in alerts.alerts" :key="`${alert.product_id}-${alert.company.id}`" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getSeverityClass(alert.alert.severity)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ alert.alert.severity }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ alert.product.name }}</div>
                    <div v-if="alert.product.strength" class="text-xs text-gray-500">{{ alert.product.strength }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ alert.company.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ alert.stock.current }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ alert.stock.reorder_level }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getAlertTypeClass(alert.alert.type)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ formatAlertType(alert.alert.type) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <strong class="flex items-center gap-2">
            <InformationCircleIcon class="w-5 h-5" />
            <span>Info:</span>
          </strong>
          <span> This summary displays aggregated analytics data from inventory, products, and alerts across all companies.</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '~/stores/admin';
import { ArrowDownTrayIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/vue/24/outline';

const adminStore = useAdminStore();
const config = useRuntimeConfig();

const loading = ref(false);
const error = ref(null);
const stockValue = ref(null);
const topProducts = ref([]);
const alerts = ref(null);

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const baseURL = config.public.apiBase;

    // Fetch stock value summary
    const stockResponse = await fetch(`${baseURL}/api/inventory-analytics/composite-stock-value`, {
      headers: {
        'Authorization': `Bearer ${adminStore.token}`
      }
    });

    if (stockResponse.ok) {
      const stockResult = await stockResponse.json();
      if (stockResult.success) {
        stockValue.value = stockResult.data;
      }
    }

    // Fetch top products summary
    const topProductsResponse = await fetch(`${baseURL}/api/inventory-analytics/top-products?metric=revenue&limit=20`, {
      headers: {
        'Authorization': `Bearer ${adminStore.token}`
      }
    });

    if (topProductsResponse.ok) {
      const topProductsResult = await topProductsResponse.json();
      if (topProductsResult.success) {
        topProducts.value = topProductsResult.data.products || [];
      }
    }

    // Fetch alerts summary
    const alertsResponse = await fetch(`${baseURL}/api/inventory-analytics/alerts`, {
      headers: {
        'Authorization': `Bearer ${adminStore.token}`
      }
    });

    if (alertsResponse.ok) {
      const alertsResult = await alertsResponse.json();
      if (alertsResult.success) {
        alerts.value = alertsResult.data;
      }
    }

  } catch (err) {
    error.value = err.message;
    console.error('Error fetching summaries:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  fetchData();
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
};

const formatAlertType = (type) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getSeverityClass = (severity) => {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };
  return classes[severity.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const getAlertTypeClass = (type) => {
  const classes = {
    out_of_stock: 'bg-red-100 text-red-800',
    low_stock: 'bg-orange-100 text-orange-800',
    expired: 'bg-red-100 text-red-800',
    expiring_soon: 'bg-yellow-100 text-yellow-800'
  };
  return classes[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const exportToJSON = () => {
  const dataToExport = {
    stockValue: stockValue.value,
    topProducts: topProducts.value,
    alerts: alerts.value,
    exportedAt: new Date().toISOString()
  };
  const jsonString = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics_summaries_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const exportToCSV = () => {
  let csvContent = '';

  // Stock Value CSV
  if (stockValue.value && stockValue.value.companies) {
    csvContent += 'Stock Value Summary\n';
    csvContent += 'Company,Products,Units,Cost Value,Selling Value,Profit,Margin %\n';
    stockValue.value.companies.forEach(company => {
      csvContent += `"${company.company_name}",${company.inventory.total_products},${company.inventory.total_units},${company.valuation.cost_value},${company.valuation.selling_value},${company.valuation.potential_profit},${company.valuation.profit_margin}\n`;
    });
    csvContent += '\n';
  }

  // Top Products CSV
  if (topProducts.value && topProducts.value.length > 0) {
    csvContent += 'Top Products Summary\n';
    csvContent += 'Rank,Product,Quantity Sold,Revenue,Profit,Margin %,Companies\n';
    topProducts.value.forEach(product => {
      csvContent += `${product.rank},"${product.product_name}",${product.performance.total_quantity},${product.performance.total_revenue},${product.performance.total_profit},${product.performance.profit_margin},${product.distribution.company_count}\n`;
    });
    csvContent += '\n';
  }

  // Alerts CSV
  if (alerts.value && alerts.value.alerts) {
    csvContent += 'Alerts Summary\n';
    csvContent += 'Severity,Product,Company,Current Stock,Reorder Level,Alert Type\n';
    alerts.value.alerts.forEach(alert => {
      csvContent += `"${alert.alert.severity}","${alert.product.name}","${alert.company.name}",${alert.stock.current},${alert.stock.reorder_level},"${formatAlertType(alert.alert.type)}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics_summaries_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.summaries-analytics {
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

.summary-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.summary-section h3 {
  color: #1f2937;
  margin-bottom: 16px;
}

.export-icon {
  width: 18px;
  height: 18px;
}

.refresh-icon {
  width: 18px;
  height: 18px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>