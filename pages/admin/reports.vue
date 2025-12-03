<template>
  <div class="reports-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Pharmacy Transaction Summary</h1>
      <p class="text-gray-600 mt-1">View transaction activity across all pharmacies</p>
    </div>

    <!-- Filters Section -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Pharmacy IDs (optional)
          </label>
          <input
            v-model="companyInput"
            type="text"
            placeholder="e.g., 99, 100, 101 (leave empty for all)"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            v-model="startDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            End Date (Exclusive)
          </label>
          <input
            v-model="endDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button
          @click="fetchReports"
          :disabled="isLoading"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Load Data</span>
        </button>
        <button
          @click="exportToCSV"
          :disabled="!pharmacySummary || pharmacySummary.length === 0"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <DocumentArrowDownIcon class="w-5 h-5" />
          Export CSV
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
      {{ errorMessage }}
    </div>

    <!-- Summary Stats -->
    <div v-if="pharmacySummary && pharmacySummary.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <div class="text-sm text-gray-600">Total Pharmacies</div>
        <div class="text-2xl font-bold text-gray-900">{{ pharmacySummary.length }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <div class="text-sm text-gray-600">Total Transactions</div>
        <div class="text-2xl font-bold text-blue-600">{{ totalTransactions.toLocaleString() }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <div class="text-sm text-gray-600">Avg Transactions/Pharmacy</div>
        <div class="text-2xl font-bold text-green-600">{{ avgTransactions }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <div class="text-sm text-gray-600">Date Range</div>
        <div class="text-sm font-semibold text-gray-900">{{ formatDate(startDate) }} - {{ formatDate(endDate) }}</div>
      </div>
    </div>

    <!-- Pharmacy Transaction Summary Table -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900">Pharmacy Activity Report</h2>
      </div>

      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">Loading data...</p>
      </div>

      <div v-else-if="pharmacySummary && pharmacySummary.length > 0" class="overflow-x-auto">
        <div class="mb-4 text-sm text-gray-600">
          Showing {{ pharmacySummary.length }} pharmacies
        </div>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alternate ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy Name</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Transactions</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Transaction Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Transaction Date</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Days Active</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="pharmacy in pharmacySummary" :key="pharmacy.pharmacy_id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ pharmacy.pharmacy_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ pharmacy.alternate_pharmacy_id || 'N/A' }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ pharmacy.pharmacy_name || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                {{ pharmacy.number_of_transactions.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDateShort(pharmacy.first_transaction_date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDateShort(pharmacy.last_transaction_date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ pharmacy.days_between_inclusive }} days
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        No data available. Select date range and click "Load Data" to fetch pharmacy transaction summary.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '~/stores/admin';
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';

// Define page metadata
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
});

// Store
const adminStore = useAdminStore();
const config = useRuntimeConfig();
const baseURL = config.public.apiBase;

// State
const companyInput = ref('');
const startDate = ref('2025-07-01');
const endDate = ref('2025-10-01');
const isLoading = ref(false);
const errorMessage = ref('');
const pharmacySummary = ref([]);

// Computed properties
const totalTransactions = computed(() => {
  return pharmacySummary.value.reduce((sum, pharmacy) => sum + pharmacy.number_of_transactions, 0);
});

const avgTransactions = computed(() => {
  if (pharmacySummary.value.length === 0) return 0;
  return Math.round(totalTransactions.value / pharmacySummary.value.length);
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Format date short
const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Fetch reports
const fetchReports = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  pharmacySummary.value = [];

  try {
    const token = process.client ? localStorage.getItem('adminToken') : null;
    
    if (!token) {
      throw new Error('Admin token not found');
    }

    // Build query parameters
    const params = new URLSearchParams({
      format: 'json',
    });

    if (startDate.value) {
      params.append('start_date', startDate.value);
    }
    if (endDate.value) {
      params.append('end_date', endDate.value);
    }
    if (companyInput.value) {
      params.append('company_ids', companyInput.value);
    }

    const response = await fetch(
      `${baseURL}/api/reports/cross-tenant/pharmacy-transaction-summary?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      pharmacySummary.value = data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch pharmacy transaction summary');
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    errorMessage.value = error.message || 'Failed to fetch reports. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Export to CSV helper
const convertToCSV = (data, headers) => {
  const headerRow = headers.join(',');
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value !== null && value !== undefined ? value : '';
    }).join(',')
  );
  return [headerRow, ...rows].join('\n');
};

// Export to CSV
const exportToCSV = () => {
  if (!pharmacySummary.value || pharmacySummary.value.length === 0) return;

  const headers = [
    'pharmacy_id',
    'alternate_pharmacy_id',
    'pharmacy_name',
    'number_of_transactions',
    'first_transaction_date',
    'last_transaction_date',
    'days_between_inclusive'
  ];
  
  const csv = convertToCSV(pharmacySummary.value, headers);
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const companyLabel = companyInput.value ? companyInput.value.replace(/,/g, '-') : 'all-pharmacies';
  a.download = `pharmacy-transaction-summary-${companyLabel}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Load reports on mount
onMounted(() => {
  // Optionally auto-load data
  // fetchReports();
});
</script>

<style scoped>
.reports-page {
  max-width: 100%;
  margin: 0 auto;
}

.page-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

/* Table styles */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th {
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  z-index: 10;
}

/* Scrollbar styling */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
