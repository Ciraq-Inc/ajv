<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Sales Analytics & Reports</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comprehensive sales data and pharmacy transaction summaries</p>
    </div>

    <!-- View Tabs -->
    <div class="flex gap-1 border-b border-gray-200 mb-6">
      <template v-if="!isDataConsumer">
        <button
          @click="activeView = 'sales'"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="activeView === 'sales' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          Sales Items Analysis
        </button>
        <button
          @click="activeView = 'pharmacy'"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="activeView === 'pharmacy' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          Pharmacy Transaction Summary
        </button>
      </template>
      <button
        @click="activeView = 'quarterly'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeView === 'quarterly' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
      >
        Quarterly Reports
      </button>
    </div>

    <!-- Sales Items View -->
    <div v-show="activeView === 'sales'">
    <!-- Filters and Controls -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <!-- Date Range Error Message -->
      <div v-if="dateRangeError" class="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
        <ExclamationTriangleIcon class="w-4 h-4 text-red-400 flex-shrink-0" />
        <span class="text-sm text-red-700">{{ dateRangeError }}</span>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date Field</label>
          <select
            v-model="filters.date_field"
            class="h-9 px-3 text-sm min-w-[160px] appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="actual_date">Actual Date</option>
            <option value="ddate">Transaction Date (ddate)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Search Company</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by company name..."
            @input="debouncedSearch"
            class="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            v-model="filters.start_date"
            type="date"
            @change="validateDateRange"
            class="h-9 px-3 text-sm appearance-none bg-white border rounded-lg focus:outline-none focus:ring-2"
            :class="dateRangeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            v-model="filters.end_date"
            type="date"
            @change="validateDateRange"
            class="h-9 px-3 text-sm appearance-none bg-white border rounded-lg focus:outline-none focus:ring-2"
            :class="dateRangeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'"
          />
        </div>

        <div class="flex items-center gap-2 ml-auto">
          <!-- Search / Load button -->
          <button
            @click="() => fetchData()"
            :disabled="loading || !!dateRangeError"
            class="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4 text-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span>{{ loading ? 'Searching…' : 'Search' }}</span>
          </button>
          <button
            @click="exportToCSV"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            :disabled="loading || exportingSummary || exportingRaw"
          >
            <svg v-if="exportingSummary" class="animate-spin w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <ArrowDownTrayIcon v-else class="w-4 h-4" aria-hidden="true" />
            {{ exportingSummary ? 'Exporting…' : 'Summary' }}
          </button>
          <button
            @click="showColumnSelector = true"
            class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            :disabled="loading || exportingSummary || exportingRaw"
            :title="filters.start_date || filters.end_date ? `Export raw data from ${filters.start_date || 'start'} to ${filters.end_date || 'end'}` : 'Export ALL raw transaction data'"
          >
            <svg v-if="exportingRaw" class="animate-spin w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <ArrowDownTrayIcon v-else class="w-4 h-4" aria-hidden="true" />
            {{ exportingRaw ? 'Exporting…' : 'Raw Data' }}
          </button>
          <button
            @click="refreshData"
            class="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
            :disabled="loading"
            aria-label="Refresh"
          >
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading progress banner -->
    <div
      v-if="loading"
      class="rounded-xl mb-6 overflow-hidden border border-indigo-200 bg-indigo-50"
      role="status"
      aria-live="polite"
      aria-label="Loading sales data"
    >
      <!-- Progress bar track -->
      <div class="h-1 bg-indigo-100">
        <div class="h-full bg-indigo-500 loading-progress-bar"></div>
      </div>
      <div class="px-5 py-4 flex items-start gap-3">
        <svg
          class="animate-spin mt-0.5 w-5 h-5 text-indigo-500 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <div>
          <p class="text-sm font-medium text-indigo-800">{{ loadingStatusMessage }}</p>
          <p class="text-xs text-indigo-500 mt-0.5">
            {{ loadingElapsed }}s elapsed
            <span v-if="loadingElapsed >= 10"> — queries across 3.7M rows take time</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Summary Cards — skeleton while loading, real cards when data arrives -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Skeleton cards -->
      <template v-if="loading">
        <div
          v-for="i in 4"
          :key="'skel-card-' + i"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse"
          aria-hidden="true"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div class="h-7 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div class="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0 ml-4"></div>
          </div>
        </div>
      </template>
      <!-- Real summary cards -->
      <template v-else-if="summary">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500">Total Companies</p>
              <p class="text-2xl font-semibold text-gray-900 mt-1">
                {{ summary?.total_companies || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <BuildingOfficeIcon class="w-5 h-5 text-indigo-600" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500">Companies Without Data</p>
              <p class="text-2xl font-semibold text-gray-900 mt-1">
                {{(summaryByCompany.length - summary?.total_companies) || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <BuildingOfficeIcon class="w-5 h-5 text-amber-600" aria-hidden="true" />
            </div>
          </div>
        </div>
        <!-- <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500">Unique Products</p>
              <p class="text-2xl font-semibold text-gray-900 mt-1">
                {{ summary?.unique_products || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingBagIcon class="w-5 h-5 text-emerald-600" aria-hidden="true" />
            </div>
          </div>
        </div> -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500">Total Transactions</p>
              <p class="text-2xl font-semibold text-gray-900 mt-1">
                {{ summary?.total_transactions?.toLocaleString() || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ChartBarIcon class="w-5 h-5 text-violet-600" aria-hidden="true" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Company Breakdown Table — skeleton while loading, real table when data arrives -->

    <!-- Skeleton table -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6" aria-hidden="true">
      <div class="px-6 py-4 border-b border-gray-100 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-48 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-32"></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th v-for="col in 6" :key="'th-' + col" class="px-4 py-3">
                <div class="h-3 bg-gray-200 rounded animate-pulse"></div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in 5" :key="'skel-row-' + row" class="animate-pulse">
              <td class="px-4 py-3"><div class="h-3 bg-gray-200 rounded w-6"></div></td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-200 rounded w-36"></div></td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-200 rounded w-16"></div></td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-200 rounded w-16"></div></td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-200 rounded w-12"></div></td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-200 rounded w-12"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Real Company Breakdown Table -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6" v-else-if="summaryByCompany && summaryByCompany.length > 0">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Company Breakdown</h3>
          <span class="text-xs text-gray-500">Total: <span class="font-semibold">{{ summaryByCompany.length }}</span> companies</span>
        </div>
        <!-- <button
          @click="showSalesItemsModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span class="flex items-center gap-2">
            <span>📋</span>
            <span>View Sample Items</span>
          </span>
        </button> -->
      </div>

      <!-- Company Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Alternate ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Products</th>
              <!-- <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Customers</th> -->
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Transactions</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Quantity</th>
              <!-- <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th> -->
              <!-- <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</th> -->
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(company, index) in summaryByCompany" :key="company.company_id" class="hover:bg-gray-50 cursor-pointer transition-colors" @click="viewCompanyDetails(company)">
              <td class="px-4 py-3 text-xs text-gray-400 tabular-nums">{{ index + 1 }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ company.company_name }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ company.company_id || "" }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ company.alternate_company_id || "N/A" }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ company.unique_products || 0 }}</td>
              <!-- <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ company.unique_customers || 0 }}</td> -->
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ company.transaction_count || 0 }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ company.total_quantity || 0 }}</td>
              <!-- <td class="px-4 py-3 text-sm font-medium"><button @click.stop="exportCompanyData(company)" class="text-indigo-600 hover:text-indigo-800 font-semibold" title="Export company data">Export</button></td> -->
              <!-- <td class="px-4 py-3 text-sm text-emerald-600 font-semibold">${{ parseFloat(company.total_value || 0).toFixed(2) }}</td> -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty state — shown before first search -->
    <div
      v-else-if="!loading && !summary && summaryByCompany.length === 0"
      class="bg-white rounded-xl border border-gray-100 p-12 mb-6 text-center"
    >
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
          <ChartBarIcon class="w-8 h-8 text-indigo-400" aria-hidden="true" />
        </div>
      </div>
      <h3 class="text-base font-semibold text-gray-800 mb-1">No data loaded yet</h3>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">Set a date range above and click <strong>Search</strong> to load sales analytics. Queries across short date ranges (under 3 months) return fastest.</p>
    </div>

    <!-- Sample Sales Items Modal -->
    <div v-if="showSalesItemsModal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-50 flex items-start justify-center pt-16" @click="showSalesItemsModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 p-6 mb-8" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Sample Sales Items Records</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ salesItems.length }} items (up to 100 records)</p>
          </div>
          <button @click="showSalesItemsModal = false" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close modal">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div v-if="!loading && salesItems.length === 0" class="text-center py-12">
          <p class="text-sm text-gray-500">No sales items found</p>
        </div>
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>

        <div v-if="!loading && salesItems.length > 0" class="overflow-x-auto max-h-96 rounded-xl border border-gray-100">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Products</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Customers</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Transactions</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Quantity</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Price</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in salesItems" :key="item.company_id ?? ''" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.company_name }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ item.unique_products || 0 }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ item.unique_customers || 0 }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ item.transaction_count || 0 }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-900">{{ item.total_quantity || 0 }}</td>
                <td class="px-4 py-3 text-sm text-emerald-600 font-semibold">${{ parseFloat(String(item.total_value ?? 0)).toFixed(2) }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ item.avg_selling_price ? parseFloat(String(item.avg_selling_price)).toFixed(2) : '0.00' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end mt-5 pt-4 border-t border-gray-100">
          <button @click="showSalesItemsModal = false" class="h-9 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Close</button>
        </div>
      </div>
    </div>

    <!-- Column Selector Modal -->
    <div v-if="showColumnSelector" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-50 flex items-start justify-center pt-16" @click="showColumnSelector = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 mb-8" @click.stop>
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-base font-semibold text-gray-900">Select Columns to Export</h3>
          <button @click="showColumnSelector = false" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close modal">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="flex gap-2 mb-4">
          <button @click="availableColumns.forEach(col => col.selected = true)" class="h-8 px-3 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">Select All</button>
          <button @click="availableColumns.forEach(col => col.selected = false)" class="h-8 px-3 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Deselect All</button>
        </div>

        <div class="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto rounded-xl border border-gray-100 p-3">
          <label v-for="column in availableColumns" :key="column.key" class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" v-model="column.selected" class="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
            <span class="text-sm text-gray-700">{{ column.label }}</span>
          </label>
        </div>

        <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="showColumnSelector = false" :disabled="exportingRaw" class="h-9 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50">Cancel</button>
          <button @click="exportRawDataCSV" :disabled="!availableColumns.some(col => col.selected) || exportingRaw" class="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <svg v-if="exportingRaw" class="animate-spin w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ exportingRaw ? 'Exporting…' : 'Export Selected Columns' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Company Details Modal -->
    <div v-if="showCompanyModal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-50 flex items-start justify-center pt-16" @click="showCompanyModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4 p-6 mb-8" @click.stop>
        <div class="flex justify-between items-start mb-5">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Company Sales Details</h3>
            <p class="text-sm text-gray-500 mt-0.5">{{ selectedCompanyDetails?.company_name }}</p>
          </div>
          <button @click="showCompanyModal = false" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close modal">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div v-if="selectedCompanyDetails" class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-indigo-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 mb-1">Unique Products</p>
              <p class="text-xl font-semibold text-indigo-700">{{ selectedCompanyDetails.unique_products || 0 }}</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 mb-1">Unique Customers</p>
              <p class="text-xl font-semibold text-emerald-700">{{ selectedCompanyDetails.unique_customers || 0 }}</p>
            </div>
            <div class="bg-violet-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 mb-1">Total Transactions</p>
              <p class="text-xl font-semibold text-violet-700">{{ selectedCompanyDetails.transaction_count || 0 }}</p>
            </div>
            <div class="bg-amber-50 rounded-xl p-4">
              <p class="text-xs text-gray-500 mb-1">Total Quantity</p>
              <p class="text-xl font-semibold text-amber-700">{{ selectedCompanyDetails.total_quantity || 0 }}</p>
            </div>
          </div>

          <div v-if="loadingCompanyDetails" class="flex justify-center items-center py-12">
            <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>

          <div v-if="!loadingCompanyDetails && companyDetailedData.length > 0" class="mt-2">
            <h4 class="text-sm font-semibold text-gray-800 mb-3">Recent Sales Transactions</h4>
            <div class="overflow-x-auto max-h-80 rounded-xl border border-gray-100">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(item, idx) in companyDetailedData" :key="idx" class="hover:bg-gray-50 transition-colors">
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{{ formatDate(item.actual_date) }}</td>
                    <td class="px-3 py-2 text-xs">
                      <div class="font-medium text-gray-900">{{ item.product_description }}</div>
                      <div class="text-gray-500">{{ item.strength }} {{ item.unit }}</div>
                    </td>
                    <td class="px-3 py-2 text-xs text-gray-700">{{ item.customer_name || 'N/A' }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ item.product_qty }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ parseFloat(String(item.selling_price ?? 0)).toFixed(2) }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-emerald-600 font-semibold">{{ parseFloat(String(item.line_total ?? 0)).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-gray-400 mt-2">Showing {{ companyDetailedData.length }} recent transactions</p>
          </div>

          <div v-if="!loadingCompanyDetails && companyDetailedData.length === 0" class="text-center py-8 text-sm text-gray-500">
            No detailed transaction data available
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button @click="showCompanyModal = false" class="h-9 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Close</button>
          <button @click="selectedCompanyDetails && exportCompanyData(selectedCompanyDetails)" class="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Export Data</button>
        </div>
      </div>
    </div>
    </div>

    <!-- Pharmacy Transaction Summary View -->
    <div v-show="activeView === 'pharmacy'">
      <!-- Pharmacy Filters -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Date Field
            </label>
            <select
              v-model="pharmacyFilters.date_field"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="actual_date">Actual Date</option>
              <option value="ddate">Transaction Date (ddate)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pharmacy IDs (optional)
            </label>
            <input
              v-model="pharmacyFilters.company_input"
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
              v-model="pharmacyFilters.start_date"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              v-model="pharmacyFilters.end_date"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div class="mt-4 flex gap-3">
          <button
            @click="fetchPharmacyReports"
            :disabled="pharmacyLoading"
            :class="[
              'relative overflow-hidden px-6 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
              pharmacyLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            ]"
          >
            <span class="flex items-center gap-2">
              <svg
                v-if="pharmacyLoading"
                class="animate-spin w-4 h-4 text-white flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>{{ pharmacyLoading ? 'Loading…' : 'Load Data' }}</span>
            </span>
          </button>
          <button
            @click="exportPharmacyToCSV"
            :disabled="!pharmacySummary || pharmacySummary.length === 0"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <DocumentArrowDownIcon class="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <!-- Pharmacy Error Message -->
      <div v-if="pharmacyError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {{ pharmacyError }}
      </div>

      <!-- Pharmacy Summary Stats -->
      <div v-if="pharmacySummary && pharmacySummary.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-sm text-gray-600">Total Pharmacies</div>
          <div class="text-2xl font-bold text-gray-900">{{ pharmacySummary.length }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-sm text-gray-600">Total Transactions</div>
          <div class="text-2xl font-bold text-blue-600">{{ totalPharmacyTransactions.toLocaleString() }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-sm text-gray-600">Avg Transactions/Pharmacy</div>
          <div class="text-2xl font-bold text-green-600">{{ avgPharmacyTransactions }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-sm text-gray-600">Date Range</div>
          <div class="text-sm font-semibold text-gray-900">{{ formatDate(pharmacyFilters.start_date) }} - {{ formatDate(pharmacyFilters.end_date) }}</div>
        </div>
      </div>

      <!-- Pharmacy Transaction Table -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Pharmacy Activity Report</h2>
        </div>

        <!-- Pharmacy skeleton loader -->
        <div v-if="pharmacyLoading" aria-label="Loading pharmacy data" role="status">
          <div class="animate-pulse space-y-3">
            <div class="flex gap-4 pb-3 border-b border-gray-100">
              <div v-for="col in 7" :key="'ph-th-' + col" class="h-3 bg-gray-200 rounded flex-1"></div>
            </div>
            <div v-for="row in 6" :key="'ph-row-' + row" class="flex gap-4 py-2">
              <div v-for="col in 7" :key="'ph-td-' + col" class="h-3 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
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
              <tr v-for="pharmacy in pharmacySummary" :key="String(pharmacy.pharmacy_id ?? '')" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ pharmacy.pharmacy_id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ pharmacy.alternate_pharmacy_id || 'N/A' }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ pharmacy.pharmacy_name || 'N/A' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                  {{ (pharmacy.number_of_transactions ?? 0).toLocaleString() }}
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

    <!-- Quarterly Reports View -->
    <div v-show="activeView === 'quarterly'">
      <!-- Quarterly Filters - Single Line -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center gap-2">
        <select
          v-model="quarterlyFilters.year"
          @change="() => fetchQuarterlyData()"
          class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title="Year"
        >
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>

        <select
          v-model="quarterlyFilters.date_field"
          @change="() => fetchQuarterlyData()"
          class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          title="Date Field"
        >
          <option value="actual_date">Actual Date</option>
          <option value="ddate">Transaction Date</option>
        </select>

        <input
          v-model="quarterlyFilters.pharmacy_search"
          type="text"
          placeholder="Pharmacies (e.g., 99, 100, 101)"
          class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-60"
        />

        <button
          @click="fetchQuarterlyData(true)"
          :disabled="quarterlyLoading"
          :class="[
            'relative overflow-hidden px-4 py-2 text-sm text-white rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500',
            quarterlyLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          ]"
        >
          <span class="flex items-center gap-2">
            <svg
              v-if="quarterlyLoading"
              class="animate-spin w-4 h-4 text-white flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span>{{ quarterlyLoading ? 'Loading…' : 'Refresh' }}</span>
          </span>
        </button>
        <button
          @click="sendViaWhatsApp"
          :disabled="!canSendWhatsApp"
          :title="whatsappButtonTitle"
          class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 whitespace-nowrap"
        >
          <ChatBubbleLeftIcon class="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
        <button
          @click="exportQuarterlyToCSV"
          :disabled="quarterlyLoading || !canExportQuarterly"
          :title="exportButtonTitle"
          class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 whitespace-nowrap"
        >
          <DocumentArrowDownIcon class="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="quarterlyError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {{ quarterlyError }}
      </div>

      <!-- Selection hint -->
      <div
        v-if="quarterlyActionHint"
        class="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-4"
        role="status"
      >
        <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
        <span>{{ quarterlyActionHint }}</span>
      </div>

      <!-- Quarterly Summary Cards with Selection -->
      <div v-if="quarterlyData && !quarterlyLoading" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <label
          v-for="(quarter, index) in [1, 2, 3, 4]"
          :key="index"
          class="bg-white rounded-lg shadow-md p-4 border-l-4 min-w-0 cursor-pointer hover:shadow-lg transition-shadow"
          :class="getQuarterColor(quarter)"
        >
          <div class="flex items-start gap-2">
            <input
              type="checkbox"
              v-model="selectedQuarters[`q${quarter}`]"
              class="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-600 truncate">{{ getQuarterName(quarter) }}</p>
              <p class="text-xs text-gray-500">{{ getQuarterDates(quarter) }}</p>
              <div class="space-y-1 mt-2">
                <div>
                  <p class="text-xs text-gray-500">Transactions</p>
                  <p class="text-lg font-bold text-gray-900">{{ quarterlyData[`q${quarter}`]?.transactions?.toLocaleString() || 0 }}</p>
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>

      <!-- Quarterly skeleton loader -->
      <div v-if="quarterlyLoading" class="space-y-4" role="status" aria-label="Loading quarterly data">
        <!-- Skeleton summary cards -->
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            v-for="i in 4"
            :key="'qskel-card-' + i"
            class="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-200 animate-pulse"
            aria-hidden="true"
          >
            <div class="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div class="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <!-- Skeleton table -->
        <div class="bg-white rounded-lg shadow-md p-6 animate-pulse" aria-hidden="true">
          <div class="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-32 mb-6"></div>
          <div class="space-y-3">
            <div class="flex gap-3">
              <div v-for="col in 6" :key="'qth-' + col" class="h-3 bg-gray-200 rounded flex-1"></div>
            </div>
            <div v-for="row in 5" :key="'qrow-' + row" class="flex gap-3">
              <div v-for="col in 6" :key="'qtd-' + col" class="h-3 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pharmacy Breakdown Table -->
      <div v-if="quarterlyData && !quarterlyLoading && quarterlyPharmacies.length > 0" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Pharmacy Breakdown</h3>
          <p class="text-sm text-gray-600 mt-1">Total pharmacies: <span class="font-bold">{{ quarterlyPharmacies.length }}</span></p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    :checked="quarterlyPharmacies.every(p => selectedPharmacies[String(p.company_id ?? '')])"
                    @change="quarterlyPharmacies.forEach(p => selectedPharmacies[String(p.company_id ?? '')] = !quarterlyPharmacies.every(p2 => selectedPharmacies[String(p2.company_id ?? '')]))"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    title="Select/Deselect all"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alternate ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1 Dates</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2 Dates</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3 Dates</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4 Dates</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(pharmacy, index) in quarterlyPharmacies" :key="String(pharmacy.company_id ?? index)" class="hover:bg-gray-50" :class="{'bg-blue-50': selectedPharmacies[String(pharmacy.company_id ?? '')]}">
                <td class="px-4 py-3 whitespace-nowrap text-xs">
                  <input
                    type="checkbox"
                    :checked="selectedPharmacies[String(pharmacy.company_id ?? '')] ?? false"
                    @change="selectedPharmacies[String(pharmacy.company_id ?? '')] = !selectedPharmacies[String(pharmacy.company_id ?? '')]"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-500">{{ index + 1 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 max-w-xs truncate" :title="pharmacy.company_name ?? ''">{{ pharmacy.company_name }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{{ pharmacy.alternate_company_id || 'N/A' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold">{{ pharmacy.q1_transactions || 0 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{{ pharmacy.q1_date_range || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold">{{ pharmacy.q2_transactions || 0 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{{ pharmacy.q2_date_range || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold">{{ pharmacy.q3_transactions || 0 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{{ pharmacy.q3_date_range || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold">{{ pharmacy.q4_transactions || 0 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{{ pharmacy.q4_date_range || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs font-semibold text-blue-600">
                  {{ (pharmacy.q1_transactions || 0) + (pharmacy.q2_transactions || 0) + (pharmacy.q3_transactions || 0) + (pharmacy.q4_transactions || 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!quarterlyLoading && (!quarterlyData || quarterlyPharmacies.length === 0)" class="text-center py-12 bg-white rounded-lg">
        <div class="flex justify-center mb-4">
          <ChartBarIcon class="w-12 h-12 text-gray-400" />
        </div>
        <p class="text-gray-600">Click "Refresh" to load quarterly reports</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="w-6 h-6 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Query failed</h3>
          <div class="mt-2 text-sm text-red-700">
            <template v-if="error.toLowerCase().includes('timeout') || error.includes('30000')">
              Query timed out — try a shorter date range (under 3 months works best).
            </template>
            <template v-else>
              {{ error }}
            </template>
          </div>
          <button @click="() => { void fetchData() }" class="mt-2 text-sm text-red-600 hover:text-red-800 underline">
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { createReportsExportService } from '~/services/analytics/reportsExportService'
import { ArrowDownTrayIcon, ArrowPathIcon, BuildingOfficeIcon, ShoppingBagIcon, ChartBarIcon, ExclamationTriangleIcon, DocumentArrowDownIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/outline'

interface SalesSummary {
  total_companies: number;
  unique_products: number;
  unique_customers: number;
  total_transactions: number;
  total_quantity: number;
  total_value: number;
  total_profit: number;
  avg_selling_price: number;
}

interface CompanySalesRow {
  company_id: number | string;
  company_name: string;
  alternate_company_id: string;
  unique_products: number;
  unique_customers: number;
  transaction_count: number;
  total_quantity: number;
  total_value: number;
  total_profit: number;
  avg_selling_price: number;
  [key: string]: unknown;
}

interface SalesItemRow {
  company_id?: number | string;
  company_name?: string;
  unique_products?: number;
  unique_customers?: number;
  transaction_count?: number;
  total_quantity?: number;
  total_value?: number | string;
  avg_selling_price?: number | string;
  [key: string]: unknown;
}

interface CompanyDetailRow {
  actual_date?: string;
  product_description?: string;
  strength?: string;
  unit?: string;
  customer_name?: string;
  product_qty?: number | string;
  selling_price?: number | string;
  line_total?: number | string;
  [key: string]: unknown;
}

interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

interface PharmacyRow {
  pharmacy_id?: number | string;
  alternate_pharmacy_id?: string;
  pharmacy_name?: string;
  number_of_transactions?: number;
  first_transaction_date?: string;
  last_transaction_date?: string;
  days_between_inclusive?: number;
  [key: string]: unknown;
}

interface QuarterlyPharmacy {
  company_id?: number | string;
  company_name?: string;
  alternate_company_id?: string;
  q1_transactions?: number;
  q1_date_range?: string;
  q2_transactions?: number;
  q2_date_range?: string;
  q3_transactions?: number;
  q3_date_range?: string;
  q4_transactions?: number;
  q4_date_range?: string;
  [key: string]: unknown;
}

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  makeAuthRequest: (url: string) => Promise<{ success?: boolean; data?: unknown; message?: string; [key: string]: unknown }>;
  getRole?: string;
}

const adminStore = useAdminStore() as unknown as AdminStoreShape
const reportsService = createReportsExportService(useApi())

// Only show Quarterly Reports for data_consumer
const isDataConsumer = computed<boolean>(() => adminStore.getRole === 'data_consumer')

// Active view
const activeView = ref<string>('sales')

// Reactive data
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const showSalesItemsModal = ref<boolean>(false)
const searchQuery = ref<string>('')
const showCompanyModal = ref<boolean>(false)
const selectedCompanyDetails = ref<CompanySalesRow | null>(null)
const companyDetailedData = ref<CompanyDetailRow[]>([])
const loadingCompanyDetails = ref<boolean>(false)
const exportingRaw = ref<boolean>(false)
const exportingSummary = ref<boolean>(false)
const dateRangeError = ref<string | null>(null)
const showColumnSelector = ref<boolean>(false)
const availableColumns = ref<ColumnOption[]>([
  { key: 'id', label: 'ID', selected: true },
  { key: 'company_id', label: 'Company ID', selected: true },
  { key: 'company_name', label: 'Company Name', selected: true },
  { key: 'alternate_company_id', label: 'Alternate Company ID', selected: true },
  { key: 'sale_id', label: 'Sale ID', selected: true },
  { key: 'sale_date', label: 'Sale Date', selected: true },
  { key: 'product_id', label: 'Product ID', selected: true },
  { key: 'product_name', label: 'Product Name', selected: true },
  { key: 'strength', label: 'Strength', selected: true },
  { key: 'unit', label: 'Unit', selected: true },
  { key: 'quantity', label: 'Quantity', selected: true },
  { key: 'unit_cost', label: 'Unit Cost', selected: true },
  { key: 'unit_price', label: 'Unit Price', selected: true },
  { key: 'total_cost', label: 'Total Cost', selected: true },
  { key: 'total_price', label: 'Total Price', selected: true },
  { key: 'profit', label: 'Profit', selected: true },
  { key: 'profit_margin_percent', label: 'Profit Margin %', selected: true },
  { key: 'customer_name', label: 'Customer Name', selected: true },
  { key: 'created_at', label: 'Created At', selected: false },
  { key: 'updated_at', label: 'Updated At', selected: false },
])

// Pharmacy-related state
const pharmacyLoading = ref<boolean>(false)
const pharmacyError = ref<string>('')
const pharmacySummary = ref<PharmacyRow[]>([])
const pharmacyFilters = ref<{ company_input: string; start_date: string; end_date: string; date_field: string }>({
  company_input: '',
  start_date: '2025-07-01',
  end_date: '2025-10-01',
  date_field: 'ddate',
})

// Analytics data
const summary = ref<SalesSummary | null>(null)
const summaryByCompany = ref<CompanySalesRow[]>([])
const salesItems = ref<SalesItemRow[]>([])

// Filters
const filters = ref<{ start_date: string; end_date: string; date_field: string }>({
  start_date: '',
  end_date: '',
  date_field: 'ddate',
})

// ── Elapsed-time timer for loading banner ─────────────────────────────────────
const loadingElapsed = ref<number>(0)
let _elapsedTimer: ReturnType<typeof setInterval> | null = null

const startElapsedTimer = (): void => {
  loadingElapsed.value = 0
  if (_elapsedTimer !== null) clearInterval(_elapsedTimer)
  _elapsedTimer = setInterval(() => {
    loadingElapsed.value += 1
  }, 1000)
}

const stopElapsedTimer = (): void => {
  if (_elapsedTimer !== null) {
    clearInterval(_elapsedTimer)
    _elapsedTimer = null
  }
  loadingElapsed.value = 0
}

const loadingStatusMessage = computed<string>(() => {
  if (loadingElapsed.value >= 20) return 'Almost there — large date ranges take longer…'
  if (loadingElapsed.value >= 10) return 'Still working — this query covers a large dataset…'
  return 'Fetching sales data…'
})

onUnmounted(() => {
  stopElapsedTimer()
})
// ─────────────────────────────────────────────────────────────────────────────

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = (): void => {
  if (searchTimeout !== null) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    void fetchCompanyBreakdown()
  }, 500)
}

// Validate date range
const validateDateRange = (): boolean => {
  if (filters.value.start_date && filters.value.end_date) {
    const startDate = new Date(filters.value.start_date)
    const endDate = new Date(filters.value.end_date)
    if (startDate > endDate) {
      dateRangeError.value = 'Start date cannot be after end date. Please swap the dates.'
      return false
    }
  }
  dateRangeError.value = null
  return true
}

// Fetch summary data from the cross-tenant summary API
const fetchSummary = async (forceRefresh = false): Promise<void> => {
  try {
    const params = new URLSearchParams()
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.date_field) params.append('date_field', filters.value.date_field)
    if (forceRefresh) params.append('refresh', 'true')

    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/sales-items?${params}`)
    if (response.success) {
      // Normalize the response data
      summary.value = {
        total_companies: Number(response['total_companies'] ?? 0),
        unique_products: Number(response['unique_products'] ?? 0),
        unique_customers: Number(response['unique_customers'] ?? 0),
        total_transactions: Number(response['total_transactions'] ?? 0),
        total_quantity: parseFloat(String(response['total_quantity'] ?? 0)) || 0,
        total_value: parseFloat(String(response['total_value'] ?? 0)) || 0,
        total_profit: parseFloat(String(response['total_profit'] ?? 0)) || 0,
        avg_selling_price: parseFloat(String(response['avg_selling_price'] ?? 0)) || 0,
      }
    } else {
      summary.value = null
    }
  } catch (err) {
    console.error('Error fetching summary:', err)
    summary.value = null
  }
}

// Fetch company breakdown (using sales-items summary by company)
const fetchCompanyBreakdown = async (forceRefresh = false): Promise<void> => {
  try {
    const params = new URLSearchParams()
    params.append('limit', '5000') // Increased limit
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.date_field) params.append('date_field', filters.value.date_field)
    if (searchQuery.value && searchQuery.value.trim()) params.append('search', searchQuery.value.trim())
    if (forceRefresh) params.append('refresh', 'true')

    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/sales-items/dataview?${params}`)
    if (response.success && response.data && Array.isArray(response.data)) {
      // API already returns company-level aggregates, just normalize null values
      summaryByCompany.value = (response.data as Record<string, unknown>[]).map(item => ({
        company_id: (item['company_id'] as number | string | undefined) ?? 0,
        company_name: String(item['company_name'] ?? 'Unknown'),
        alternate_company_id: String(item['alternate_company_id'] ?? ''),
        unique_products: Number(item['unique_products'] ?? 0),
        unique_customers: Number(item['unique_customers'] ?? 0),
        transaction_count: Number(item['transaction_count'] ?? 0),
        total_quantity: parseFloat(String(item['total_quantity'] ?? 0)) || 0,
        total_value: parseFloat(String(item['total_value'] ?? 0)) || 0,
        total_profit: parseFloat(String(item['total_profit'] ?? 0)) || 0,
        avg_selling_price: parseFloat(String(item['avg_selling_price'] ?? 0)) || 0,
      } satisfies CompanySalesRow))
    } else {
      summaryByCompany.value = []
    }
  } catch (err) {
    console.error('Error fetching company breakdown:', err)
    summaryByCompany.value = []
  }
}

// Fetch sample sales items
const fetchSalesItems = async (): Promise<void> => {
  try {
    const response = await adminStore.makeAuthRequest('/api/reports/cross-tenant/sales-items/dataview')
    if (response.success) {
      salesItems.value = (response.data ?? []) as SalesItemRow[]
    } else {
      salesItems.value = []
    }
  } catch (err) {
    console.error('Error fetching sales items:', err)
    throw err
  }
}

// Fetch all data
const fetchData = async (forceRefresh = false): Promise<void> => {
  // Validate date range first
  if (!validateDateRange()) {
    return
  }

  loading.value = true
  error.value = null
  startElapsedTimer()

  try {
    await Promise.all([
      fetchSummary(forceRefresh),
      fetchCompanyBreakdown(forceRefresh),
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch sales items data'
    console.error('Error fetching sales items data:', err)
  } finally {
    loading.value = false
    stopElapsedTimer()
  }
}

// Refresh data (bypass cache)
const refreshData = (): void => {
  void fetchData(true)
}

// View company details
const viewCompanyDetails = async (company: CompanySalesRow): Promise<void> => {
  selectedCompanyDetails.value = company
  showCompanyModal.value = true
  loadingCompanyDetails.value = true
  companyDetailedData.value = []

  try {
    const data = await reportsService.getSalesItemsForCompany({
      companyId: company.company_id,
      limit: 100,
      startDate: filters.value.start_date,
      endDate: filters.value.end_date,
      dateField: filters.value.date_field,
    })
    if (data.success && data.data) {
      companyDetailedData.value = data.data as CompanyDetailRow[]
    }
  } catch (err) {
    console.error('Error fetching company details:', err)
  } finally {
    loadingCompanyDetails.value = false
  }
}

// Export specific company data
const exportCompanyData = async (company: CompanySalesRow): Promise<void> => {
  try {
    loading.value = true
    const blob = await reportsService.exportSalesItemsForCompanyCsv({
      companyId: company.company_id,
      startDate: filters.value.start_date,
      endDate: filters.value.end_date,
      dateField: filters.value.date_field,
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const companyName = company.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    link.download = `sales-${companyName}_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Company export error:', err)
    alert('Export failed. Please try again.')
  } finally {
    loading.value = false
  }
}

// Helper functions
const getCompanyInitials = (name: string | undefined): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Export functions
const exportToJSON = async (): Promise<void> => {
  try {
    const params = new URLSearchParams()
    params.append('format', 'json')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)

    const response = await adminStore.makeAuthRequest(`/api/reports/cross-tenant/sales-items/export?${params}`)
    if (response.success && response.data) {
      const jsonString = JSON.stringify(response.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-sales-summary_${new Date().toISOString().split('T')[0] ?? ''}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed. Please try again.')
  }
}

const exportToCSV = async (): Promise<void> => {
  if (!validateDateRange()) {
    alert('Please fix the date range before exporting.')
    return
  }
  exportingSummary.value = true
  try {
    const blob = await reportsService.exportSalesItemsSummaryCsv({
      startDate: filters.value.start_date,
      endDate: filters.value.end_date,
      dateField: filters.value.date_field,
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cross-tenant-sales-items_${new Date().toISOString().split('T')[0] ?? ''}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export error:', err)
    alert('Export failed. Please try again.')
  } finally {
    exportingSummary.value = false
  }
}

const exportRawDataCSV = async (): Promise<void> => {
  try {
    // Validate date range first
    if (!validateDateRange()) {
      alert('Please fix the date range before exporting.')
      return
    }

    // Check if at least one column is selected
    const selectedColumns = availableColumns.value.filter(col => col.selected)
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to export')
      return
    }

    // Add selected columns to params
    const selectedColumnKeys = selectedColumns.map(col => col.key).join(',')

    showColumnSelector.value = false
    exportingRaw.value = true
    const blob = await reportsService.exportSalesItemsRawCsv({
      startDate: filters.value.start_date,
      endDate: filters.value.end_date,
      dateField: filters.value.date_field,
      columns: selectedColumnKeys,
    })

    // Read the blob text to count records (preserves legacy "X records exported" alert)
    const csvContent = await blob.text()
    const lines = csvContent.trim().split('\n')
    if (lines.length <= 1) {
      alert('No data available for the selected date range')
      return
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Create filename with date range if applicable
    let filename = 'raw-sales-items'
    if (filters.value.start_date || filters.value.end_date) {
      const startDate = filters.value.start_date || 'start'
      const endDate = filters.value.end_date || 'end'
      filename += `_${startDate}_to_${endDate}`
    } else {
      filename += '_full'
    }
    filename += `_${new Date().toISOString().split('T')[0] ?? ''}.csv`

    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Show success message
    const recordCount = lines.length - 1 // Subtract header row
    alert(`Successfully exported ${recordCount.toLocaleString()} records`)
  } catch (err) {
    console.error('Raw data export error:', err)
    alert('Raw data export failed. Please try again.')
  } finally {
    exportingRaw.value = false
  }
}

// Pharmacy computed properties
const totalPharmacyTransactions = computed<number>(() => {
  return pharmacySummary.value.reduce((sum, pharmacy) => sum + (pharmacy.number_of_transactions ?? 0), 0)
})

const avgPharmacyTransactions = computed<number>(() => {
  if (pharmacySummary.value.length === 0) return 0
  return Math.round(totalPharmacyTransactions.value / pharmacySummary.value.length)
})

// Format date short
const formatDateShort = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Fetch pharmacy reports
const fetchPharmacyReports = async (): Promise<void> => {
  pharmacyLoading.value = true
  pharmacyError.value = ''
  pharmacySummary.value = []

  try {
    const data = await reportsService.getPharmacyTransactionSummary({
      startDate: pharmacyFilters.value.start_date,
      endDate: pharmacyFilters.value.end_date,
      companyIds: pharmacyFilters.value.company_input,
      dateField: pharmacyFilters.value.date_field,
    })

    if (data.success) {
      pharmacySummary.value = data.data as unknown as PharmacyRow[]
    } else {
      throw new Error(data.message ?? 'Failed to fetch pharmacy transaction summary')
    }
  } catch (err) {
    console.error('Error fetching pharmacy reports:', err)
    pharmacyError.value = err instanceof Error ? err.message : 'Failed to fetch reports. Please try again.'
  } finally {
    pharmacyLoading.value = false
  }
}

// Export pharmacy to CSV helper
const convertArrayToCSV = (data: Record<string, unknown>[], headers: string[]): string => {
  const headerRow = headers.join(',')
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value !== null && value !== undefined ? String(value) : ''
    }).join(',')
  )
  return [headerRow, ...rows].join('\n')
}

// Export pharmacy to CSV
const exportPharmacyToCSV = (): void => {
  if (!pharmacySummary.value || pharmacySummary.value.length === 0) return

  const headers = [
    'pharmacy_id',
    'alternate_pharmacy_id',
    'pharmacy_name',
    'number_of_transactions',
    'first_transaction_date',
    'last_transaction_date',
    'days_between_inclusive',
  ]

  const csv = convertArrayToCSV(pharmacySummary.value as Record<string, unknown>[], headers)

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const companyLabel = pharmacyFilters.value.company_input
    ? pharmacyFilters.value.company_input.replace(/,/g, '-')
    : 'all-pharmacies'
  a.download = `pharmacy-transaction-summary-${companyLabel}-${new Date().toISOString().split('T')[0] ?? ''}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// ============================================
// QUARTERLY REPORTS SECTION
// ============================================

// Quarterly state
const quarterlyLoading = ref<boolean>(false)
const quarterlyError = ref<string>('')
const quarterlyData = ref<Record<string, { transactions?: number; [key: string]: unknown } | undefined> | null>(null)
const quarterlyPharmacies = ref<QuarterlyPharmacy[]>([])
const quarterlyFilters = ref<{ year: string; date_field: string; pharmacy_search: string }>({
  year: String(new Date().getFullYear()),
  date_field: 'actual_date',
  pharmacy_search: '',
})

// Selected quarters and pharmacies for sending
const selectedQuarters = ref<{ q1: boolean; q2: boolean; q3: boolean; q4: boolean; [key: string]: boolean }>({ q1: true, q2: true, q3: true, q4: true })
const selectedPharmacies = ref<Record<string | number, boolean>>({})

// Get quarter name
const getQuarterName = (index: number): string => {
  const names = ['Q1', 'Q2', 'Q3', 'Q4']
  return names[index - 1] ?? `Q${index}`
}

// Get quarter dates
const getQuarterDates = (index: number): string => {
  const year = parseInt(quarterlyFilters.value.year)
  let start: string
  let end: string
  switch (index) {
    case 1: start = `${year}-01-01`; end = `${year}-03-31`; break
    case 2: start = `${year}-04-01`; end = `${year}-06-30`; break
    case 3: start = `${year}-07-01`; end = `${year}-09-30`; break
    default: start = `${year}-10-01`; end = `${year}-12-31`; break
  }
  return `${start} to ${end}`
}

// Get quarter color for styling
const getQuarterColor = (index: number): string => {
  const colors = [
    'border-blue-500',
    'border-green-500',
    'border-orange-500',
    'border-purple-500',
  ]
  return colors[index - 1] ?? 'border-gray-500'
}

// Get quarter date range
const getQuarterDateRange = (index: number): { start: string; end: string } => {
  const year = parseInt(quarterlyFilters.value.year)
  let start: string
  let end: string
  switch (index) {
    case 1: start = `${year}-01-01`; end = `${year}-03-31`; break
    case 2: start = `${year}-04-01`; end = `${year}-06-30`; break
    case 3: start = `${year}-07-01`; end = `${year}-09-30`; break
    default: start = `${year}-10-01`; end = `${year}-12-31`; break
  }
  return { start, end }
}

// Fetch quarterly data from API - single call to backend
const fetchQuarterlyData = async (forceRefresh = false): Promise<void> => {
  quarterlyLoading.value = true
  quarterlyError.value = ''
  quarterlyData.value = null
  quarterlyPharmacies.value = []

  try {
    const data = await reportsService.getQuarterlySummary({
      year: quarterlyFilters.value.year,
      dateField: quarterlyFilters.value.date_field,
      companyIds: quarterlyFilters.value.pharmacy_search,
      forceRefresh,
    })

    if (data.success) {
      const envelope = data as unknown as { summary: unknown; pharmacies?: QuarterlyPharmacy[]; message?: string }
      quarterlyData.value = envelope.summary as Record<string, { transactions?: number; [key: string]: unknown } | undefined> | null
      const pharmacies = envelope.pharmacies ?? []
      quarterlyPharmacies.value = pharmacies
      const allSelected: Record<string, boolean> = {}
      for (const p of pharmacies) {
        allSelected[String(p.company_id ?? '')] = true
      }
      selectedPharmacies.value = allSelected
    } else {
      throw new Error(data.message ?? 'Failed to fetch quarterly data')
    }
  } catch (err) {
    console.error('Error fetching quarterly data:', err)
    quarterlyError.value = err instanceof Error ? err.message : 'Failed to fetch quarterly data'
  } finally {
    quarterlyLoading.value = false
  }
}

// Get selected quarters list
const getSelectedQuartersText = (): string => {
  const quarters: string[] = []
  if (selectedQuarters.value.q1) quarters.push('Q1')
  if (selectedQuarters.value.q2) quarters.push('Q2')
  if (selectedQuarters.value.q3) quarters.push('Q3')
  if (selectedQuarters.value.q4) quarters.push('Q4')
  return quarters.length > 0 ? quarters.join(', ') : 'None selected'
}

// Get selected pharmacies list
const getSelectedPharmaciesText = (): string => {
  const pharmacies = quarterlyPharmacies.value.filter(p => p.company_id !== undefined && selectedPharmacies.value[p.company_id])
  if (pharmacies.length === 0) return 'No pharmacies selected'
  return pharmacies.map(p => `${p.company_name ?? ''} (${p.alternate_company_id ?? p.company_id})`).join(', ')
}

const quarterlyHasSelectedQuarters = computed<boolean>(() =>
  Object.values(selectedQuarters.value).some(v => v)
)
const quarterlyHasSelectedPharmacies = computed<boolean>(() =>
  Object.values(selectedPharmacies.value).some(v => v)
)

// Check if WhatsApp button should be enabled
const canSendWhatsApp = computed<boolean>(() =>
  !!(quarterlyData.value && quarterlyPharmacies.value.length > 0 && quarterlyHasSelectedQuarters.value && quarterlyHasSelectedPharmacies.value)
)
const canExportQuarterly = computed<boolean>(() =>
  !!(quarterlyData.value && quarterlyHasSelectedQuarters.value && quarterlyHasSelectedPharmacies.value)
)

const quarterlyActionHint = computed<string | null>(() => {
  if (!quarterlyData.value || quarterlyLoading.value) return null
  const noQ = !quarterlyHasSelectedQuarters.value
  const noPh = !quarterlyHasSelectedPharmacies.value
  if (noQ && noPh) return 'Tick at least one quarter above and select at least one pharmacy in the table below to export or share.'
  if (noQ) return 'Tick at least one quarter above to include in the export or share.'
  if (noPh) return 'Select at least one pharmacy in the table below to export or share.'
  return null
})

const exportButtonTitle = computed<string>(() => {
  if (quarterlyLoading.value) return 'Loading…'
  if (!quarterlyData.value) return 'Click Refresh to load data first'
  if (!quarterlyHasSelectedQuarters.value && !quarterlyHasSelectedPharmacies.value) return 'Select quarters and pharmacies first'
  if (!quarterlyHasSelectedQuarters.value) return 'Select at least one quarter first'
  if (!quarterlyHasSelectedPharmacies.value) return 'Select at least one pharmacy first'
  const count = Object.values(selectedPharmacies.value).filter(Boolean).length
  return `Export ${count} ${count === 1 ? 'pharmacy' : 'pharmacies'} · ${getSelectedQuartersText()}`
})

const whatsappButtonTitle = computed<string>(() => {
  if (!quarterlyData.value) return 'Click Refresh to load data first'
  if (!quarterlyHasSelectedQuarters.value && !quarterlyHasSelectedPharmacies.value) return 'Select quarters and pharmacies first'
  if (!quarterlyHasSelectedQuarters.value) return 'Select at least one quarter first'
  if (!quarterlyHasSelectedPharmacies.value) return 'Select at least one pharmacy first'
  const count = Object.values(selectedPharmacies.value).filter(Boolean).length
  return `Share ${count} ${count === 1 ? 'pharmacy' : 'pharmacies'} · ${getSelectedQuartersText()}`
})

// Send via WhatsApp
const sendViaWhatsApp = (): void => {
  if (!canSendWhatsApp.value) return

  const year = quarterlyFilters.value.year
  const quarters = getSelectedQuartersText()
  const pharmacies = getSelectedPharmaciesText()

  const message = `${year} Quarterly Report Request\n\nQuarters: ${quarters}\n\nPharmacies:\n${pharmacies}`
  const encodedMessage = encodeURIComponent(message)

  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
}

// Export quarterly to CSV
const exportQuarterlyToCSV = (): void => {
  const selectedPharmacyList = quarterlyPharmacies.value.filter(p => p.company_id !== undefined && selectedPharmacies.value[String(p.company_id ?? '')])
  if (selectedPharmacyList.length === 0) return

  const headerParts = ['Pharmacy Name', 'Alternate ID']
  if (selectedQuarters.value.q1) headerParts.push('Q1 Transactions', 'Q1 Dates')
  if (selectedQuarters.value.q2) headerParts.push('Q2 Transactions', 'Q2 Dates')
  if (selectedQuarters.value.q3) headerParts.push('Q3 Transactions', 'Q3 Dates')
  if (selectedQuarters.value.q4) headerParts.push('Q4 Transactions', 'Q4 Dates')
  headerParts.push('Total Transactions')
  let csv = headerParts.join(',') + '\n'

  selectedPharmacyList.forEach(pharmacy => {
    let total = 0
    let row = `"${pharmacy.company_name ?? ''}","${pharmacy.alternate_company_id ?? 'N/A'}"`

    if (selectedQuarters.value.q1) {
      row += `,${pharmacy.q1_transactions ?? 0},"${pharmacy.q1_date_range ?? '-'}"`
      total += pharmacy.q1_transactions ?? 0
    }
    if (selectedQuarters.value.q2) {
      row += `,${pharmacy.q2_transactions ?? 0},"${pharmacy.q2_date_range ?? '-'}"`
      total += pharmacy.q2_transactions ?? 0
    }
    if (selectedQuarters.value.q3) {
      row += `,${pharmacy.q3_transactions ?? 0},"${pharmacy.q3_date_range ?? '-'}"`
      total += pharmacy.q3_transactions ?? 0
    }
    if (selectedQuarters.value.q4) {
      row += `,${pharmacy.q4_transactions ?? 0},"${pharmacy.q4_date_range ?? '-'}"`
      total += pharmacy.q4_transactions ?? 0
    }
    row += `,${total}\n`
    csv += row
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quarterly-report-${quarterlyFilters.value.year}-${new Date().toISOString().split('T')[0] ?? ''}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// Initialize on mount
onMounted(() => {
  // Set default dates for sales view
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  filters.value.end_date = today.toISOString().split('T')[0] ?? ''
  filters.value.start_date = thirtyDaysAgo.toISOString().split('T')[0] ?? ''
})
</script>

<style scoped>
.sales-items-analytics {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.export-icon,
.refresh-icon {
  width: 18px;
  height: 18px;
}

.stat-icon {
  width: 24px;
  height: 24px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Search button: subtle pulse on the background while loading */
.search-btn-loading {
  animation: btn-pulse 2s ease-in-out infinite;
}

@keyframes btn-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.85; }
}

/* Progress fill that sweeps across the button background */
.search-progress-fill {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer-sweep 1.6s linear infinite;
}

@keyframes shimmer-sweep {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* Loading progress bar — fills over 30 s to match backend timeout */
.loading-progress-bar {
  animation: progress-fill 30s linear forwards;
  width: 0%;
}

@keyframes progress-fill {
  0%   { width: 0%; }
  80%  { width: 85%; }
  100% { width: 92%; }
}

@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  .search-btn-loading,
  .search-progress-fill,
  .loading-progress-bar {
    animation: none;
  }
  .loading-progress-bar {
    width: 50%;
  }
}
</style>
