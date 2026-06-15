<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Products</h1>
        <p class="text-sm text-gray-500 mt-0.5">Inventory stock values and alerts across all companies</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="exportToCSV" class="h-9 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors" :disabled="loading">
          <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
          <span v-if="!exporting">Export CSV</span>
          <span v-else>Exporting...</span>
        </button>
        <button @click="refreshData" class="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors" :disabled="loading">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" aria-hidden="true" />
          <span v-if="!loading">Load</span>
          <span v-else>Loading...</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stockValue" class="flex flex-col items-center justify-center py-24 gap-3">
      <div class="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-sm text-gray-500">Loading inventory data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4">
      <div class="flex gap-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p class="text-sm font-medium text-red-800">Something went wrong</p>
          <p class="text-sm text-red-700 mt-0.5">{{ error }}</p>
          <button @click="refreshData" class="mt-2 text-sm text-red-600 hover:text-red-800 underline">Try again</button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === tab.id
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Companies Tab -->
      <div v-if="activeTab === 'companies'">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
          <div class="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              v-model="companySearch"
              type="text"
              placeholder="Search companies..."
              class="h-9 pl-9 pr-3 text-sm w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-10">#</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Products</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Units</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cost Value</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Selling Value</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Profit</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Alerts</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(company, index) in filteredCompanies" :key="String(company.company_id ?? index)" class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-xs text-gray-400 tabular-nums">{{ index + 1 }}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ company.company_name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(company.inventory?.total_products) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(company.inventory?.total_units) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">GHâ‚µ {{ formatNumber(company.valuation?.cost_value) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">GHâ‚µ {{ formatNumber(company.valuation?.selling_value) }}</td>
                  <td class="px-4 py-3 text-sm font-semibold text-emerald-600">GHâ‚µ {{ formatNumber(company.valuation?.potential_profit) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span v-if="(company.stock_health?.out_of_stock ?? 0) > 0" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {{ company.stock_health?.out_of_stock }} Out
                      </span>
                      <span v-if="(company.stock_health?.low_stock ?? 0) > 0" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {{ company.stock_health?.low_stock }} Low
                      </span>
                      <span v-if="(company.stock_health?.expiring_soon ?? 0) > 0" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {{ company.stock_health?.expiring_soon }} Exp
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Top Products Tab -->
      <div v-if="activeTab === 'top-products'">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
          <select v-model="topProductsMetric" @change="loadTopProducts" class="h-9 px-3 text-sm appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="revenue">By Revenue</option>
            <option value="quantity">By Quantity</option>
            <option value="profit">By Profit</option>
          </select>
          <input
            v-model="topProductsLimit"
            type="number"
            min="5"
            max="50"
            @change="loadTopProducts"
            class="h-9 px-3 text-sm w-24 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div v-if="loadingTopProducts" class="flex justify-center py-12">
          <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>

        <div v-else class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Rank</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Qty Sold</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Profit</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Margin %</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Companies</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="product in topProducts" :key="String(product.product_id ?? product.rank ?? 0)" class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                      :class="getRankClass(product.rank) === 'top' ? 'bg-amber-100 text-amber-700' : getRankClass(product.rank) === 'good' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'">
                      #{{ product.rank }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ product.product_name }}</div>
                    <div v-if="product.strength" class="text-xs text-gray-500">{{ product.strength }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(product.performance?.total_quantity) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900 font-medium">GHâ‚µ {{ formatNumber(product.performance?.total_revenue) }}</td>
                  <td class="px-4 py-3 text-sm text-emerald-600 font-medium">GHâ‚µ {{ formatNumber(product.performance?.total_profit) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ product.performance?.profit_margin }}%</td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ product.distribution?.company_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Alerts Tab -->
      <div v-if="activeTab === 'alerts'">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <select v-model="alertFilter" @change="loadAlerts" class="h-9 px-3 text-sm appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">All Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="expired">Expired</option>
            <option value="expiring_soon">Expiring Soon</option>
          </select>
        </div>

        <div v-if="loadingAlerts" class="flex justify-center py-12">
          <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>

        <div v-else class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Severity</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Current Stock</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Reorder Level</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry Date</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Days Left</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Alert Type</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="alert in alertsList" :key="`${alert.product_id ?? ''}-${alert.company?.id ?? ''}`" class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="alert.alert?.severity === 'critical' ? 'bg-red-100 text-red-700' : alert.alert?.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'">
                      {{ alert.alert?.severity }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ alert.product?.name }}</div>
                    <div v-if="alert.product?.strength" class="text-xs text-gray-500">{{ alert.product?.strength }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ alert.company?.name }}</td>
                  <td class="px-4 py-3 text-sm" :class="alert.stock?.current === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'">{{ alert.stock?.current }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ alert.stock?.reorder_level }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ formatDate(alert.expiry?.date) }}</td>
                  <td class="px-4 py-3 text-sm"
                    :class="getExpiryClass(alert.expiry?.days_remaining) === 'expired' ? 'text-red-600 font-semibold' : getExpiryClass(alert.expiry?.days_remaining) === 'critical' ? 'text-orange-600' : getExpiryClass(alert.expiry?.days_remaining) === 'warning' ? 'text-amber-600' : 'text-gray-700'">
                    {{ alert.expiry?.days_remaining || 'N/A' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="(alert.alert?.type ?? '').toLowerCase() === 'out_of_stock' ? 'bg-red-100 text-red-700' : (alert.alert?.type ?? '').toLowerCase() === 'low_stock' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'">
                      {{ formatAlertType(alert.alert?.type) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Multi-Tenant Products Tab -->
      <div v-if="activeTab === 'multi-tenant-products'">
        <ProductsTable
          title="All Products Across Companies"
          :showTitle="true"
          :showCompanyFilter="true"
          :showPharmacySearch="true"
          :autoload="false"
          :pageSize="50"
        />
      </div>

      <!-- Products Search Tab -->
      <div v-if="activeTab === 'products'">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[200px] max-w-xs">
            <MagnifyingGlassIcon class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              v-model="productSearch"
              @input="searchProducts"
              type="text"
              placeholder="Search products..."
              class="h-9 pl-9 pr-3 text-sm w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" v-model="showOnlyLowStock" @change="searchProducts" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Low Stock Only
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" v-model="showOnlyExpiring" @change="searchProducts" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Expiring Soon Only
          </label>
        </div>

        <div v-if="loadingProducts" class="flex justify-center py-12">
          <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>

        <div v-else class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Selling</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Location</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="product in productsList" :key="`${product.product_id ?? ''}-${product.company?.id ?? ''}`" class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">{{ product.product?.brand_name }}</div>
                    <div class="flex gap-1 mt-0.5">
                      <span v-if="product.product?.strength" class="text-xs text-gray-500">{{ product.product?.strength }}</span>
                      <span class="text-xs text-gray-400">{{ product.product?.unit }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">{{ product.company?.name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ product.stock?.quantity }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="(product.stock?.status ?? '').toLowerCase() === 'out_of_stock' ? 'bg-red-100 text-red-700' : (product.stock?.status ?? '').toLowerCase() === 'low_stock' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">
                      {{ formatStatus(product.stock?.status ?? '') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700">GHâ‚µ {{ (product.pricing?.cost_price ?? 0).toFixed(2) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">GHâ‚µ {{ (product.pricing?.selling_price ?? 0).toFixed(2) }}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">GHâ‚µ {{ formatNumber(product.pricing?.total_value) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ product.stock?.shelf_location || 'N/A' }}</td>
                  <td class="px-4 py-3">
                    <div class="text-sm text-gray-700">{{ formatDate(product.expiry?.expiry_date) }}</div>
                    <div class="text-xs mt-0.5"
                      :class="getExpiryClass(product.expiry?.days_to_expiry) === 'expired' ? 'text-red-600 font-medium' : getExpiryClass(product.expiry?.days_to_expiry) === 'critical' ? 'text-orange-600' : getExpiryClass(product.expiry?.days_to_expiry) === 'warning' ? 'text-amber-600' : 'text-gray-400'">
                      {{ product.expiry?.days_to_expiry }} days
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="productsPagination.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              @click="previousPage"
              :disabled="productsPagination.offset === 0"
              class="h-8 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
            >
              â† Previous
            </button>
            <span class="text-xs text-gray-500">
              Showing {{ productsPagination.offset + 1 }}â€“{{ Math.min(productsPagination.offset + productsPagination.limit, productsPagination.total) }}
              of {{ productsPagination.total }}
            </span>
            <button
              @click="nextPage"
              :disabled="!productsPagination.has_more"
              class="h-8 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
            >
              Next â†’
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { createReportsExportService } from '~/services/analytics/reportsExportService'
import ProductsTable from './ProductsTable.vue'
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

interface StockHealth {
  out_of_stock?: number;
  low_stock?: number;
  expiring_soon?: number;
  [key: string]: unknown;
}

interface StockInventory {
  total_products?: number;
  total_units?: number;
  [key: string]: unknown;
}

interface StockValuation {
  cost_value?: number;
  selling_value?: number;
  potential_profit?: number;
  [key: string]: unknown;
}

interface StockCompany {
  company_id?: number | string;
  company_name?: string;
  total_value?: number;
  inventory?: StockInventory;
  valuation?: StockValuation;
  stock_health?: StockHealth;
  [key: string]: unknown;
}

interface StockValueData {
  companies?: StockCompany[];
  [key: string]: unknown;
}

interface AlertProduct {
  name?: string;
  strength?: string;
  [key: string]: unknown;
}

interface AlertCompany {
  id?: number | string;
  name?: string;
  [key: string]: unknown;
}

interface AlertStock {
  current?: number;
  reorder_level?: number;
  [key: string]: unknown;
}

interface AlertExpiry {
  date?: string;
  days_remaining?: number;
  [key: string]: unknown;
}

interface AlertInfo {
  severity?: string;
  type?: string;
  [key: string]: unknown;
}

interface AlertItem {
  product_id?: number | string;
  product?: AlertProduct;
  company?: AlertCompany;
  stock?: AlertStock;
  expiry?: AlertExpiry;
  alert?: AlertInfo;
  [key: string]: unknown;
}

interface AlertsData {
  alerts?: AlertItem[];
  [key: string]: unknown;
}

interface TopProductPerformance {
  total_quantity?: number;
  total_revenue?: number;
  total_profit?: number;
  profit_margin?: number | string;
  [key: string]: unknown;
}

interface TopProductDistribution {
  company_count?: number;
  [key: string]: unknown;
}

interface TopProduct {
  rank?: number;
  product_id?: number | string;
  product_name?: string;
  strength?: string;
  revenue?: number;
  quantity?: number;
  margin?: number | string;
  performance?: TopProductPerformance;
  distribution?: TopProductDistribution;
  [key: string]: unknown;
}

interface ProductItemProduct {
  brand_name?: string;
  strength?: string;
  unit?: string;
  [key: string]: unknown;
}

interface ProductItemCompany {
  id?: number | string;
  name?: string;
  [key: string]: unknown;
}

interface ProductItemStock {
  quantity?: number;
  status?: string;
  shelf_location?: string;
  [key: string]: unknown;
}

interface ProductItemPricing {
  cost_price?: number;
  selling_price?: number;
  total_value?: number;
  [key: string]: unknown;
}

interface ProductItemExpiry {
  expiry_date?: string;
  days_to_expiry?: number;
  [key: string]: unknown;
}

interface ProductItem {
  id?: number | string;
  product_id?: number | string;
  product_name?: string;
  stock_level?: number;
  reorder_level?: number;
  expiry_date?: string;
  days_to_expiry?: number;
  status?: string;
  product?: ProductItemProduct;
  company?: ProductItemCompany;
  stock?: ProductItemStock;
  pricing?: ProductItemPricing;
  expiry?: ProductItemExpiry;
  [key: string]: unknown;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  makeAuthRequest: (url: string) => Promise<{ success?: boolean; data?: unknown; message?: string }>;
}

interface ReportsServiceShape {
  exportInventoryStockValueCsv: () => Promise<Blob>;
}

// Use admin store
const adminStore = useAdminStore() as unknown as AdminStoreShape
const reportsService = createReportsExportService(useApi()) as unknown as ReportsServiceShape

// API Configuration
const API_BASE = '/api/inventory-analytics'

// State
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const exporting = ref<boolean>(false)

// Data
const stockValue = ref<StockValueData | null>(null)
const alerts = ref<AlertsData | null>(null)
const topProducts = ref<TopProduct[]>([])
const alertsList = ref<AlertItem[]>([])
const productsList = ref<ProductItem[]>([])
const productsPagination = ref<Pagination>({ total: 0, limit: 100, offset: 0, has_more: false })

// UI State
const activeTab = ref<string>('companies')
const companySearch = ref<string>('')
const productSearch = ref<string>('')
const showOnlyLowStock = ref<boolean>(false)
const showOnlyExpiring = ref<boolean>(false)
const topProductsMetric = ref<string>('revenue')
const topProductsLimit = ref<number>(20)
const alertFilter = ref<string>('')
const loadingTopProducts = ref<boolean>(false)
const loadingAlerts = ref<boolean>(false)
const loadingProducts = ref<boolean>(false)

// Tabs
const tabs: Array<{ id: string; label: string; icon: string }> = [
  { id: 'companies', label: 'Companies', icon: 'Building2' },
  { id: 'multi-tenant-products', label: 'All Products', icon: 'Package' },
  // { id: 'top-products', label: 'Top Products', icon: 'Trophy' },
  // { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle' },
  // { id: 'products', label: 'Products', icon: 'Package' }
]

// Computed
const filteredCompanies = computed<StockCompany[]>(() => {
  if (!stockValue.value?.companies) return []
  if (!companySearch.value) return stockValue.value.companies

  const search = companySearch.value.toLowerCase()
  return stockValue.value.companies.filter(c =>
    (c.company_name ?? '').toLowerCase().includes(search)
  )
})

// Helper Functions
const apiCall = async (endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<unknown> => {
  const queryString = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString()
  const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`

  const data = await adminStore.makeAuthRequest(url)

  if (!data.success) {
    throw new Error(data.message ?? 'API request failed')
  }

  return data.data
}

// Data Loading Functions
const loadStockValue = async (): Promise<void> => {
  stockValue.value = await apiCall('/composite-stock-value') as StockValueData
}

const loadAlerts = async (): Promise<void> => {
  loadingAlerts.value = true
  try {
    const params: Record<string, string> = alertFilter.value ? { alertType: alertFilter.value } : {}
    const data = await apiCall('/alerts', params) as AlertsData
    alerts.value = data
    alertsList.value = data.alerts ?? []
  } finally {
    loadingAlerts.value = false
  }
}

const loadTopProducts = async (): Promise<void> => {
  loadingTopProducts.value = true
  try {
    const result = await apiCall('/top-products', {
      metric: topProductsMetric.value,
      limit: topProductsLimit.value
    }) as { products?: TopProduct[] }
    topProducts.value = result.products ?? []
  } finally {
    loadingTopProducts.value = false
  }
}

const searchProducts = async (): Promise<void> => {
  loadingProducts.value = true
  try {
    const params: Record<string, string | number | boolean> = {
      limit: productsPagination.value.limit,
      offset: productsPagination.value.offset
    }

    if (productSearch.value) params['productName'] = productSearch.value
    if (showOnlyLowStock.value) params['belowReorder'] = true
    if (showOnlyExpiring.value) params['expiringSoon'] = true

    const data = await apiCall('/product-stock-details', params) as { products?: ProductItem[]; pagination?: Pagination }
    productsList.value = data.products ?? []
    productsPagination.value = data.pagination ?? { total: 0, limit: 100, offset: 0, has_more: false }
  } finally {
    loadingProducts.value = false
  }
}

const refreshData = async (): Promise<void> => {
  loading.value = true
  error.value = null

  try {
    await Promise.all([
      loadStockValue(),
      loadAlerts()
    ])

    // Load data for active tab
    if (activeTab.value === 'top-products') await loadTopProducts()
    if (activeTab.value === 'products') await searchProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data'
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
}

const exportToCSV = async (): Promise<void> => {
  exporting.value = true
  try {
    const blob = await reportsService.exportInventoryStockValueCsv()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock_report_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export failed:', err)
    alert('Failed to export CSV')
  } finally {
    exporting.value = false
  }
}

// Pagination
const nextPage = (): void => {
  productsPagination.value.offset += productsPagination.value.limit
  void searchProducts()
}

const previousPage = (): void => {
  productsPagination.value.offset = Math.max(0, productsPagination.value.offset - productsPagination.value.limit)
  void searchProducts()
}

// Filter Functions
const filterAlerts = (type: string): void => {
  alertFilter.value = type
  activeTab.value = 'alerts'
  void loadAlerts()
}

// Formatting Functions
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatAlertType = (type: string | undefined): string => {
  return (type ?? '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ')
}

// Class Helpers
const getMarginClass = (margin: number | string | undefined): string => {
  const m = parseFloat(String(margin ?? 0))
  if (m >= 30) return 'high'
  if (m >= 20) return 'medium'
  return 'low'
}

const getRankClass = (rank: number | undefined): string => {
  if (!rank || rank <= 3) return 'top'
  if (rank <= 10) return 'good'
  return 'normal'
}

const getExpiryClass = (days: number | undefined): string => {
  if (!days || days < 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'normal'
}

// Lifecycle
onMounted(() => {
  // Data loading is triggered manually or by tab selection
})
</script>
