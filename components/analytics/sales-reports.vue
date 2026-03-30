<template>
  <div class="sales-items-analytics p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        Sales Analytics & Reports
      </h1>
      <p class="text-gray-600">
        Comprehensive sales data and pharmacy transaction summaries
      </p>
    </div>

    <!-- View Tabs -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex">
          <template v-if="!isDataConsumer">
            <button
              @click="activeView = 'sales'"
              :class="[
                'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeView === 'sales'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Sales Items Analysis
            </button>
            <button
              @click="activeView = 'pharmacy'"
              :class="[
                'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeView === 'pharmacy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Pharmacy Transaction Summary
            </button>
          </template>
          <button
            @click="activeView = 'quarterly'"
            :class="[
              'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
              activeView === 'quarterly'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Quarterly Reports
          </button>
        </nav>
      </div>
    </div>

    <!-- Sales Items View -->
    <div v-show="activeView === 'sales'">
    <!-- Filters and Controls -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <!-- Date Range Error Message -->
      <div v-if="dateRangeError" class="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex items-center">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-400 mr-2" />
          <span class="text-sm text-red-700">{{ dateRangeError }}</span>
        </div>
      </div>
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Field</label>
            <select
              v-model="filters.date_field"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="actual_date">Actual Date</option>
              <option value="ddate">Transaction Date (ddate)</option>
            </select>
          </div>
           <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Company</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by company name..."
              @input="debouncedSearch"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              v-model="filters.start_date"
              type="date"
              @change="validateDateRange"
              :class="[
                'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2',
                dateRangeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              ]"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              v-model="filters.end_date"
              type="date"
              @change="validateDateRange"
              :class="[
                'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2',
                dateRangeError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              ]"
            />
          </div>
         
          <div class="flex items-end gap-2">
            <button
              @click="fetchData"
              class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 whitespace-nowrap"
              :disabled="loading || !!dateRangeError"
            >
              <span class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <span>Search</span>
              </span>
            </button>

               <!-- Action Buttons -->
          <!-- <button
            @click="exportToJSON"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>JSON</span>
            </span>
          </button> -->
           <button
            @click="exportToCSV"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowDownTrayIcon class="export-icon" />
              <span>Summary</span>
            </span>
          </button>
          <button
            @click="showColumnSelector = true"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            :disabled="loading || exportingRaw"
            :title="filters.start_date || filters.end_date ? 
              `Export raw data from ${filters.start_date || 'start'} to ${filters.end_date || 'end'}` : 
              'Export ALL raw transaction data'"
          >
            <span class="flex items-center gap-2">
              <ArrowPathIcon v-if="exportingRaw" class="export-icon animate-spin" />
              <ArrowDownTrayIcon v-else class="export-icon" />
              <span>{{ exportingRaw ? 'Exporting...' : 'Raw Data' }}</span>
            </span>
          </button> 
          <button
            @click="refreshData"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowPathIcon class="refresh-icon" :class="{ 'animate-spin': loading }" />
              <span>Refresh</span>
            </span>
          </button>
          </div>
          
        </div>

     
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6" v-if="summary">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Companies</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ summary?.total_companies || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BuildingOfficeIcon class="stat-icon text-blue-600" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Companies Without Data</p>
            <p class="text-2xl font-bold text-gray-900">
              {{(summaryByCompany.length - summary?.total_companies) || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BuildingOfficeIcon class="stat-icon text-blue-600" />
          </div>
        </div>
      </div>
      <!-- <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Unique Products</p>
            <p class="text-2xl font-bold text-green-600">
              {{ summary?.unique_products || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <ShoppingBagIcon class="stat-icon text-green-600" />
          </div>
        </div>
      </div> -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Transactions</p>
            <p class="text-2xl font-bold text-purple-600">
              {{ summary?.total_transactions?.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <ChartBarIcon class="stat-icon text-purple-600" />
          </div>
        </div>
      </div>
   
    </div>

    <!-- Company Breakdown Table -->
    <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6" v-if="summaryByCompany && summaryByCompany.length > 0">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Company Breakdown</h3>
          <span class="text-sm text-gray-600">Total: <span class="font-bold">{{ summaryByCompany.length }}</span> companies</span>
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
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alternate ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Products
              </th>
              <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Customers
              </th> -->
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transactions
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Quantity
              </th>
              <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th> -->
              <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th> -->
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(company, index) in summaryByCompany" :key="company.company_id" class="hover:bg-gray-50 cursor-pointer" @click="viewCompanyDetails(company)">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <!-- <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-700">
                        {{ getCompanyInitials(company.company_name) }}
                      </span>
                    </div>
                  </div> -->
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ company.company_name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.company_id || "" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ company.alternate_company_id || "N/A" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.unique_products || 0 }}
              </td>
              <!-- <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.unique_customers || 0 }}
              </td> -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.transaction_count || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {{ company.total_quantity || 0 }}
              </td>
              <!-- <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click.stop="exportCompanyData(company)"
                  class="text-blue-600 hover:text-blue-800 font-semibold"
                  title="Export company data"
                >
                  Export
                </button>
              </td> -->
              <!-- <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                ${{ parseFloat(company.total_value || 0).toFixed(2) }}
              </td>
               -->
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sample Sales Items Modal -->
    <div v-if="showSalesItemsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="showSalesItemsModal = false">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Sample Sales Items Records</h3>
          <button @click="showSalesItemsModal = false" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="mb-4">
          <p class="text-sm text-gray-600">{{ salesItems.length }} of {{ salesItems.length }} total items (showing up to 100 records)</p>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && salesItems.length === 0" class="text-center py-12">
          <span class="text-4xl">📋</span>
          <p class="mt-2 text-gray-600">No sales items found</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Sales Items Table in Modal -->
        <div v-if="!loading && salesItems.length > 0" class="overflow-x-auto max-h-96">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Products
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Customers
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Price
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in salesItems" :key="item.company_id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ item.company_name }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ item.unique_products || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {{ item.unique_customers || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {{ item.transaction_count || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {{ item.total_quantity || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-semibold">
                  ${{ parseFloat(item.total_value || 0).toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ item.avg_selling_price ? parseFloat(item.avg_selling_price).toFixed(2) : '0.00' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button @click="showSalesItemsModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Column Selector Modal -->
    <div v-if="showColumnSelector" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="showColumnSelector = false">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Select Columns to Export</h3>
          <button @click="showColumnSelector = false" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <div class="mb-4">
          <div class="flex gap-2 mb-3">
            <button
              @click="availableColumns.forEach(col => col.selected = true)"
              class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              @click="availableColumns.forEach(col => col.selected = false)"
              class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Deselect All
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
            <label
              v-for="column in availableColumns"
              :key="column.key"
              class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="column.selected"
                class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{{ column.label }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            @click="showColumnSelector = false"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            @click="exportRawDataCSV"
            :disabled="!availableColumns.some(col => col.selected)"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Selected Columns
          </button>
        </div>
      </div>
    </div>

    <!-- Company Details Modal -->
    <div v-if="showCompanyModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="showCompanyModal = false">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">Company Sales Details</h3>
            <p class="text-sm text-gray-600 mt-1">{{ selectedCompanyDetails?.company_name }}</p>
          </div>
          <button @click="showCompanyModal = false" class="text-gray-400 hover:text-gray-600">
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <div v-if="selectedCompanyDetails" class="space-y-4">
          <!-- Summary Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Unique Products</p>
              <p class="text-2xl font-bold text-blue-600">{{ selectedCompanyDetails.unique_products || 0 }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Unique Customers</p>
              <p class="text-2xl font-bold text-green-600">{{ selectedCompanyDetails.unique_customers || 0 }}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Total Transactions</p>
              <p class="text-2xl font-bold text-purple-600">{{ selectedCompanyDetails.transaction_count || 0 }}</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-4">
              <p class="text-xs text-gray-600 mb-1">Total Quantity</p>
              <p class="text-2xl font-bold text-orange-600">{{ selectedCompanyDetails.total_quantity || 0 }}</p>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loadingCompanyDetails" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>

          <!-- Detailed Sales Items -->
          <div v-if="!loadingCompanyDetails && companyDetailedData.length > 0" class="mt-6">
            <h4 class="text-md font-semibold text-gray-800 mb-3">Recent Sales Transactions</h4>
            <div class="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(item, idx) in companyDetailedData" :key="idx" class="hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ formatDate(item.actual_date) }}</td>
                    <td class="px-3 py-2 text-xs text-gray-900">
                      <div class="font-medium">{{ item.product_description }}</div>
                      <div class="text-gray-500">{{ item.strength }} {{ item.unit }}</div>
                    </td>
                    <td class="px-3 py-2 text-xs text-gray-700">{{ item.customer_name || 'N/A' }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ item.product_qty }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{{ parseFloat(item.selling_price || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-green-600 font-semibold">{{ parseFloat(item.line_total || 0).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-gray-500 mt-2">Showing {{ companyDetailedData.length }} recent transactions</p>
          </div>

          <div v-if="!loadingCompanyDetails && companyDetailedData.length === 0" class="text-center py-8 text-gray-500">
            No detailed transaction data available
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button @click="showCompanyModal = false" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Close
          </button>
          <button @click="exportCompanyData(selectedCompanyDetails)" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Export Data
          </button>
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
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="pharmacyLoading">Loading...</span>
            <span v-else>Load Data</span>
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

        <div v-if="pharmacyLoading" class="text-center py-8">
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

    <!-- Quarterly Reports View -->
    <div v-show="activeView === 'quarterly'">
      <!-- Quarterly Filters - Single Line -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center gap-2">
        <select
          v-model="quarterlyFilters.year"
          @change="fetchQuarterlyData"
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
          @change="fetchQuarterlyData"
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
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <span v-if="quarterlyLoading">Loading...</span>
          <span v-else>Refresh</span>
        </button>
        <button
          @click="sendViaWhatsApp"
          :disabled="!canSendWhatsApp"
          class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          title="Send quarterly report request via WhatsApp"
        >
          <ChatBubbleLeftIcon class="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
        <button
          @click="exportQuarterlyToCSV"
          :disabled="!quarterlyData || quarterlyLoading"
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

      <!-- Quarterly Summary Cards with Selection -->
      <div v-if="quarterlyData && !quarterlyLoading" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <label
          v-for="(quarter, index) in [1, 2, 3, 4]"
          :key="index"
          class="bg-white rounded-lg shadow-md p-4 border-l-4 min-w-0 cursor-pointer hover:shadow-lg transition-shadow"
          :class="getQuarterColor(index)"
        >
          <div class="flex items-start gap-2">
            <input
              type="checkbox"
              :v-model="selectedQuarters[`q${index}`]"
              @change="selectedQuarters[`q${index}`] = !selectedQuarters[`q${index}`]"
              class="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-600 truncate">{{ getQuarterName(index) }}</p>
              <p class="text-xs text-gray-500">{{ getQuarterDates(index) }}</p>
              <div class="space-y-1 mt-2">
                <div>
                  <p class="text-xs text-gray-500">Transactions</p>
                  <p class="text-lg font-bold text-gray-900">{{ quarterlyData[`q${index}`]?.transactions?.toLocaleString() || 0 }}</p>
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>

      <!-- Loading State -->
      <div v-if="quarterlyLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">Loading quarterly data...</p>
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
                    :checked="quarterlyPharmacies.every(p => selectedPharmacies[p.company_id])"
                    @change="quarterlyPharmacies.forEach(p => selectedPharmacies[p.company_id] = !quarterlyPharmacies.every(p2 => selectedPharmacies[p2.company_id]))"
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
              <tr v-for="(pharmacy, index) in quarterlyPharmacies" :key="pharmacy.company_id" class="hover:bg-gray-50" :class="{'bg-blue-50': selectedPharmacies[pharmacy.company_id]}">
                <td class="px-4 py-3 whitespace-nowrap text-xs">
                  <input
                    type="checkbox"
                    :checked="selectedPharmacies[pharmacy.company_id]"
                    @change="selectedPharmacies[pharmacy.company_id] = !selectedPharmacies[pharmacy.company_id]"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-500">{{ index + 1 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 max-w-xs truncate" :title="pharmacy.company_name">{{ pharmacy.company_name }}</td>
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
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
          <button @click="fetchData" class="mt-2 text-sm text-red-600 hover:text-red-800">
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Only show Quarterly Reports for data_consumer
const isDataConsumer = computed(() => adminStore.getRole === 'data_consumer')
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { ArrowDownTrayIcon, ArrowPathIcon, BuildingOfficeIcon, ShoppingBagIcon, ChartBarIcon, ExclamationTriangleIcon, DocumentArrowDownIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/outline'

const adminStore = useAdminStore()

// Active view
const activeView = ref('sales')

// Reactive data
const loading = ref(false)
const error = ref(null)
const showSalesItemsModal = ref(false)
const searchQuery = ref('')
const showCompanyModal = ref(false)
const selectedCompanyDetails = ref(null)
const companyDetailedData = ref([])
const loadingCompanyDetails = ref(false)
const exportingRaw = ref(false)
const dateRangeError = ref(null)
const showColumnSelector = ref(false)
const availableColumns = ref([
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
  { key: 'updated_at', label: 'Updated At', selected: false }
])

// Pharmacy-related state
const pharmacyLoading = ref(false)
const pharmacyError = ref('')
const pharmacySummary = ref([])
const pharmacyFilters = ref({
  company_input: '',
  start_date: '2025-07-01',
  end_date: '2025-10-01',
  date_field: 'ddate'
})

// Analytics data
const summary = ref(null)
const summaryByCompany = ref([])
const salesItems = ref([])

// Filters
const filters = ref({
  start_date: '',
  end_date: '',
  date_field: 'ddate'
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchCompanyBreakdown()
  }, 500)
}

// Validate date range
const validateDateRange = () => {
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
const fetchSummary = async (forceRefresh = false) => {
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
        total_companies: response.total_companies || 0,
        unique_products: response.unique_products || 0,
        unique_customers: response.unique_customers || 0,
        total_transactions: response.total_transactions || 0,
        total_quantity: parseFloat(response.total_quantity) || 0,
        total_value: parseFloat(response.total_value) || 0,
        total_profit: parseFloat(response.total_profit) || 0,
        avg_selling_price: parseFloat(response.avg_selling_price) || 0
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
const fetchCompanyBreakdown = async (forceRefresh = false) => {
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
      summaryByCompany.value = response.data.map(item => ({
        company_id: item.company_id || 0,
        company_name: item.company_name || 'Unknown',
        alternate_company_id: item.alternate_company_id || '',
        unique_products: item.unique_products || 0,
        unique_customers: item.unique_customers || 0,
        transaction_count: item.transaction_count || 0,
        total_quantity: parseFloat(item.total_quantity) || 0,
        total_value: parseFloat(item.total_value) || 0,
        total_profit: parseFloat(item.total_profit) || 0,
        avg_selling_price: parseFloat(item.avg_selling_price) || 0
      }))
    } else {
      summaryByCompany.value = []
    }
  } catch (err) {
    console.error('Error fetching company breakdown:', err)
    summaryByCompany.value = []
  }
}

// Fetch sample sales items
const fetchSalesItems = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/reports/cross-tenant/sales-items/dataview')
    if (response.success) {
      salesItems.value = response.data || []
    } else {
      salesItems.value = []
    }
  } catch (err) {
    console.error('Error fetching sales items:', err)
    throw err
  }
}

// Fetch all data
const fetchData = async (forceRefresh = false) => {
  // Validate date range first
  if (!validateDateRange()) {
    return
  }
  
  loading.value = true
  error.value = null

  try {
    await Promise.all([
      fetchSummary(forceRefresh),
      fetchCompanyBreakdown(forceRefresh)
    ])
  } catch (err) {
    error.value = err.message || 'Failed to fetch sales items data'
    console.error('Error fetching sales items data:', err)
  } finally {
    loading.value = false
  }
}

// Refresh data (bypass cache)
const refreshData = () => {
  fetchData(true)
}

// View company details
const viewCompanyDetails = async (company) => {
  selectedCompanyDetails.value = company
  showCompanyModal.value = true
  loadingCompanyDetails.value = true
  companyDetailedData.value = []

  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase
    
    const params = new URLSearchParams()
    params.append('company_ids', company.company_id)
    params.append('limit', '100') // Get recent 100 transactions
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.date_field) params.append('date_field', filters.value.date_field)
    
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-sales-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
        'Content-Type': 'application/json'
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        companyDetailedData.value = data.data
      }
    }
  } catch (err) {
    console.error('Error fetching company details:', err)
  } finally {
    loadingCompanyDetails.value = false
  }
}

// Export specific company data
const exportCompanyData = async (company) => {
  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase
    
    const params = new URLSearchParams()
    params.append('format', 'csv')
    params.append('company_ids', company.company_id)
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.date_field) params.append('date_field', filters.value.date_field)
    
    loading.value = true
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-sales-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
      },
    })

    if (response.ok) {
      const csvContent = await response.text()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const companyName = company.company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      link.download = `sales-${companyName}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Company export error:', error)
    alert('Export failed. Please try again.')
  } finally {
    loading.value = false
  }
}

// Helper functions
const getCompanyInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Export functions
const exportToJSON = async () => {
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
      link.download = `cross-tenant-sales-summary_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Export failed. Please try again.')
  }
}

const exportToCSV = async () => {
  try {
    // Validate date range first
    if (!validateDateRange()) {
      alert('Please fix the date range before exporting.')
      return
    }
    
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase 
    
    const params = new URLSearchParams()
    params.append('format', 'csv')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.date_field) params.append('date_field', filters.value.date_field)
    
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/sales-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
      },
    })

    if (response.ok) {
      const csvContent = await response.text()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cross-tenant-sales-items_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Export failed. Please try again.')
  }
}

const exportRawDataCSV = async () => {
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
    
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase 
    
    const params = new URLSearchParams()
    params.append('format', 'csv')
    if (filters.value.start_date) params.append('start_date', filters.value.start_date)
    if (filters.value.end_date) params.append('end_date', filters.value.end_date)
    if (filters.value.date_field) params.append('date_field', filters.value.date_field)
    
    // Add selected columns to params
    const selectedColumnKeys = selectedColumns.map(col => col.key).join(',')
    params.append('columns', selectedColumnKeys)
    
    showColumnSelector.value = false
    exportingRaw.value = true
    const response = await fetch(`${baseURL}/api/reports/cross-tenant/raw-sales-items/export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminStore.token}`,
      },
    })

    if (response.ok) {
      const csvContent = await response.text()
      
      // Check if we got actual data
      const lines = csvContent.trim().split('\n')
      if (lines.length <= 1) {
        alert('No data available for the selected date range')
        return
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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
      filename += `_${new Date().toISOString().split('T')[0]}.csv`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Show success message
      const recordCount = lines.length - 1 // Subtract header row
      alert(`Successfully exported ${recordCount.toLocaleString()} records`)
    } else {
      const errorData = await response.text()
      console.error('Export error:', errorData)
      alert('No data available for export')
    }
  } catch (error) {
    console.error('Raw data export error:', error)
    alert('Raw data export failed. Please try again.')
  } finally {
    exportingRaw.value = false
  }
}

// Pharmacy computed properties
const totalPharmacyTransactions = computed(() => {
  return pharmacySummary.value.reduce((sum, pharmacy) => sum + pharmacy.number_of_transactions, 0)
})

const avgPharmacyTransactions = computed(() => {
  if (pharmacySummary.value.length === 0) return 0
  return Math.round(totalPharmacyTransactions.value / pharmacySummary.value.length)
})

// Format date short
const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Fetch pharmacy reports
const fetchPharmacyReports = async () => {
  pharmacyLoading.value = true
  pharmacyError.value = ''
  pharmacySummary.value = []

  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase

    const params = new URLSearchParams({
      format: 'json',
    })

    if (pharmacyFilters.value.start_date) {
      params.append('start_date', pharmacyFilters.value.start_date)
    }
    if (pharmacyFilters.value.end_date) {
      params.append('end_date', pharmacyFilters.value.end_date)
    }
    if (pharmacyFilters.value.company_input) {
      params.append('company_ids', pharmacyFilters.value.company_input)
    }
    if (pharmacyFilters.value.date_field) {
      params.append('date_field', pharmacyFilters.value.date_field)
    }

    const response = await fetch(
      `${baseURL}/api/reports/cross-tenant/pharmacy-transaction-summary?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${adminStore.token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (data.success) {
      pharmacySummary.value = data.data
    } else {
      throw new Error(data.message || 'Failed to fetch pharmacy transaction summary')
    }
  } catch (err) {
    console.error('Error fetching pharmacy reports:', err)
    pharmacyError.value = err.message || 'Failed to fetch reports. Please try again.'
  } finally {
    pharmacyLoading.value = false
  }
}

// Export pharmacy to CSV helper
const convertArrayToCSV = (data, headers) => {
  const headerRow = headers.join(',')
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value !== null && value !== undefined ? value : ''
    }).join(',')
  )
  return [headerRow, ...rows].join('\n')
}

// Export pharmacy to CSV
const exportPharmacyToCSV = () => {
  if (!pharmacySummary.value || pharmacySummary.value.length === 0) return

  const headers = [
    'pharmacy_id',
    'alternate_pharmacy_id',
    'pharmacy_name',
    'number_of_transactions',
    'first_transaction_date',
    'last_transaction_date',
    'days_between_inclusive'
  ]
  
  const csv = convertArrayToCSV(pharmacySummary.value, headers)
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const companyLabel = pharmacyFilters.value.company_input ? pharmacyFilters.value.company_input.replace(/,/g, '-') : 'all-pharmacies'
  a.download = `pharmacy-transaction-summary-${companyLabel}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// ============================================
// QUARTERLY REPORTS SECTION
// ============================================

// Quarterly state
const quarterlyLoading = ref(false)
const quarterlyError = ref('')
const quarterlyData = ref(null)
const quarterlyPharmacies = ref([])
const quarterlyFilters = ref({
  year: String(new Date().getFullYear()),
  date_field: 'actual_date',
  pharmacy_search: ''
})

// Selected quarters and pharmacies for sending
const selectedQuarters = ref({q1: false, q2: true, q3: true, q4: true})
const selectedPharmacies = ref({})

// Get quarter name
const getQuarterName = (index) => {
  const names = ['Q1', 'Q2', 'Q3', 'Q4']
  return names[index - 1]
}

// Get quarter dates
const getQuarterDates = (index) => {
  const year = parseInt(quarterlyFilters.value.year)
  let start, end
  switch(index) {
    case 1: start = `${year}-01-01`; end = `${year}-03-31`; break
    case 2: start = `${year}-04-01`; end = `${year}-06-30`; break
    case 3: start = `${year}-07-01`; end = `${year}-09-30`; break
    case 4: start = `${year}-10-01`; end = `${year}-12-31`; break
  }
  return `${start} to ${end}`
}

// Get quarter color for styling
const getQuarterColor = (index) => {
  const colors = [
    'border-blue-500',
    'border-green-500',
    'border-orange-500',
    'border-purple-500'
  ]
  return colors[index - 1]
}

// Get quarter date range
const getQuarterDateRange = (index) => {
  const year = parseInt(quarterlyFilters.value.year)
  let start, end
  switch(index) {
    case 1: start = `${year}-01-01`; end = `${year}-03-31`; break
    case 2: start = `${year}-04-01`; end = `${year}-06-30`; break
    case 3: start = `${year}-07-01`; end = `${year}-09-30`; break
    case 4: start = `${year}-10-01`; end = `${year}-12-31`; break
  }
  return { start, end }
}

// Fetch quarterly data from API - single call to backend
const fetchQuarterlyData = async (forceRefresh = false) => {
  quarterlyLoading.value = true
  quarterlyError.value = ''
  quarterlyData.value = null
  quarterlyPharmacies.value = []

  try {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase

    const params = new URLSearchParams()
    params.append('year', quarterlyFilters.value.year)
    params.append('date_field', quarterlyFilters.value.date_field)

    if (quarterlyFilters.value.pharmacy_search) {
      params.append('company_ids', quarterlyFilters.value.pharmacy_search)
    }
    if (forceRefresh === true) params.append('refresh', 'true')

    const response = await fetch(
      `${baseURL}/api/reports/cross-tenant/quarterly-summary?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${adminStore.token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        quarterlyData.value = data.summary
        quarterlyPharmacies.value = data.pharmacies || []
      } else {
        throw new Error(data.message || 'Failed to fetch quarterly data')
      }
    } else {
      throw new Error(`Server returned ${response.status}`)
    }

  } catch (err) {
    console.error('Error fetching quarterly data:', err)
    quarterlyError.value = err.message || 'Failed to fetch quarterly data'
  } finally {
    quarterlyLoading.value = false
  }
}

// Get selected quarters list
const getSelectedQuartersText = () => {
  const quarters = []
  if (selectedQuarters.value.q1) quarters.push('Q1')
  if (selectedQuarters.value.q2) quarters.push('Q2')
  if (selectedQuarters.value.q3) quarters.push('Q3')
  if (selectedQuarters.value.q4) quarters.push('Q4')
  return quarters.length > 0 ? quarters.join(', ') : 'None selected'
}

// Get selected pharmacies list
const getSelectedPharmaciesText = () => {
  const pharmacies = quarterlyPharmacies.value.filter(p => selectedPharmacies.value[p.company_id])
  if (pharmacies.length === 0) return 'No pharmacies selected'
  return pharmacies.map(p => `${p.company_name} (${p.alternate_company_id || p.company_id})`).join(', ')
}

// Check if WhatsApp button should be enabled
const canSendWhatsApp = computed(() => {
  const hasSelectedQuarters = Object.values(selectedQuarters.value).some(v => v)
  const hasSelectedPharmacies = Object.values(selectedPharmacies.value).some(v => v)
  return quarterlyData.value && quarterlyPharmacies.value.length > 0 && hasSelectedQuarters && hasSelectedPharmacies
})

// Send via WhatsApp
const sendViaWhatsApp = () => {
  if (!canSendWhatsApp.value) return

  const year = quarterlyFilters.value.year
  const quarters = getSelectedQuartersText()
  const pharmacies = getSelectedPharmaciesText()
  
  const message = `${year} Quarterly Report Request\n\nQuarters: ${quarters}\n\nPharmacies:\n${pharmacies}`
  const encodedMessage = encodeURIComponent(message)
  
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
}

// Export quarterly to CSV
const exportQuarterlyToCSV = () => {
  const selectedPharmacyList = quarterlyPharmacies.value.filter(p => selectedPharmacies.value[p.company_id])
  if (selectedPharmacyList.length === 0) return

  let csv = 'Pharmacy Name,Alternate ID,Q1 Transactions,Q1 Dates,Q2 Transactions,Q2 Dates,Q3 Transactions,Q3 Dates,Q4 Transactions,Q4 Dates,Total Transactions\n'
  
  selectedPharmacyList.forEach(pharmacy => {
    let total = 0
    let row = `"${pharmacy.company_name}","${pharmacy.alternate_company_id || 'N/A'}"`
    
    if (selectedQuarters.value.q1) { 
      row += `,${pharmacy.q1_transactions || 0},"${pharmacy.q1_date_range || '-'}"`
      total += pharmacy.q1_transactions || 0
    }
    if (selectedQuarters.value.q2) { 
      row += `,${pharmacy.q2_transactions || 0},"${pharmacy.q2_date_range || '-'}"`
      total += pharmacy.q2_transactions || 0
    }
    if (selectedQuarters.value.q3) { 
      row += `,${pharmacy.q3_transactions || 0},"${pharmacy.q3_date_range || '-'}"`
      total += pharmacy.q3_transactions || 0
    }
    if (selectedQuarters.value.q4) { 
      row += `,${pharmacy.q4_transactions || 0},"${pharmacy.q4_date_range || '-'}"`
      total += pharmacy.q4_transactions || 0
    }
    row += `,${total}\n`
    csv += row
  })

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quarterly-report-${quarterlyFilters.value.year}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// Initialize on mount
onMounted(() => {
  // Set default dates for sales view
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  filters.value.end_date = today.toISOString().split('T')[0]
  filters.value.start_date = thirtyDaysAgo.toISOString().split('T')[0]
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
