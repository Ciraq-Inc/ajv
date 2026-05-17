<template>
  <div class="inventory-analytics">
    <!-- Header -->
    <div class="header">
      <h1>Products</h1>
      <div class="actions">
        <button @click="exportToCSV" class="btn-export" :disabled="loading">
          <Icon v-if="!exporting" name="Download" size="16" />
          <span v-if="!exporting">Export CSV</span>
          <span v-else>Exporting...</span>
        </button>
        <button @click="refreshData" class="btn-refresh" :disabled="loading">
          <Icon v-if="!loading" name="RefreshCw" size="16" />
          <span v-if="!loading">Load</span>
          <span v-else>Loading...</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stockValue" class="loading-container">
      <div class="spinner"></div>
      <p>Loading inventory data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>❌ {{ error }}</p>
      <button @click="refreshData" class="btn-retry">Try Again</button>
    </div>

    <!-- Main Content -->
    <div v-else class="content">
      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-button"
        >
          <Icon :name="tab.icon" size="16" class="tab-icon" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Companies Tab -->
        <div v-if="activeTab === 'companies'" class="companies-view">
          <div class="table-header">
            <h2>Stock Value by Company</h2>
            <input 
              v-model="companySearch" 
              type="text" 
              placeholder="Search companies..."
              class="search-input"
            >
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th>Products</th>
                  <th>Units</th>
                  <th>Cost Value</th>
                  <th>Selling Value</th>
                  <th>Profit</th>
                  <th>Alerts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(company, index) in filteredCompanies" :key="String(company.company_id ?? index)">
                  <td class="row-number">{{ index + 1 }}</td>
                  <td class="company-name">{{ company.company_name }}</td>
                  <td>{{ formatNumber(company.inventory?.total_products) }}</td>
                  <td>{{ formatNumber(company.inventory?.total_units) }}</td>
                  <td>GH₵ {{ formatNumber(company.valuation?.cost_value) }}</td>
                  <td>GH₵ {{ formatNumber(company.valuation?.selling_value) }}</td>
                  <td class="profit">GH₵ {{ formatNumber(company.valuation?.potential_profit) }}</td>

                  <td>
                    <div class="alert-badges">
                      <span v-if="(company.stock_health?.out_of_stock ?? 0) > 0" class="badge critical">
                        {{ company.stock_health?.out_of_stock }} Out
                      </span>
                      <span v-if="(company.stock_health?.low_stock ?? 0) > 0" class="badge warning">
                        {{ company.stock_health?.low_stock }} Low
                      </span>
                      <span v-if="(company.stock_health?.expiring_soon ?? 0) > 0" class="badge info">
                        {{ company.stock_health?.expiring_soon }} Exp
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Products Tab -->
        <div v-if="activeTab === 'top-products'" class="top-products-view">
          <div class="table-header">
            <h2>Top Performing Products</h2>
            <div class="filters">
              <select v-model="topProductsMetric" @change="loadTopProducts" class="metric-select">
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
                class="limit-input"
              >
            </div>
          </div>

          <div v-if="loadingTopProducts" class="loading-small">
            <div class="spinner-small"></div>
          </div>

          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Margin %</th>
                  <th>Companies</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in topProducts" :key="String(product.product_id ?? product.rank ?? 0)">
                  <td class="rank">
                    <span class="rank-badge" :class="getRankClass(product.rank)">
                      #{{ product.rank }}
                    </span>
                  </td>
                  <td class="product-name">
                    <strong>{{ product.product_name }}</strong>
                    <span v-if="product.strength" class="strength">{{ product.strength }}</span>
                  </td>
                  <td>{{ formatNumber(product.performance?.total_quantity) }}</td>
                  <td>GH₵ {{ formatNumber(product.performance?.total_revenue) }}</td>
                  <td class="profit">GH₵ {{ formatNumber(product.performance?.total_profit) }}</td>
                  <td>{{ product.performance?.profit_margin }}%</td>
                  <td>{{ product.distribution?.company_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div v-if="activeTab === 'alerts'" class="alerts-view">
          <div class="table-header">
            <h2>Inventory Alerts</h2>
            <div class="filters">
              <select v-model="alertFilter" @change="loadAlerts" class="alert-filter">
                <option value="">All Alerts</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="expired">Expired</option>
                <option value="expiring_soon">Expiring Soon</option>
              </select>
            </div>
          </div>

          <div v-if="loadingAlerts" class="loading-small">
            <div class="spinner-small"></div>
          </div>

          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Product</th>
                  <th>Company</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Expiry Date</th>
                  <th>Days to Expiry</th>
                  <th>Alert Type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alert in alertsList" :key="`${alert.product_id ?? ''}-${alert.company?.id ?? ''}`">
                  <td>
                    <span class="severity-badge" :class="alert.alert?.severity">
                      {{ alert.alert?.severity }}
                    </span>
                  </td>
                  <td class="product-name">
                    <strong>{{ alert.product?.name }}</strong>
                    <span v-if="alert.product?.strength" class="strength">{{ alert.product?.strength }}</span>
                  </td>
                  <td>{{ alert.company?.name }}</td>
                  <td :class="{ 'text-danger': alert.stock?.current === 0 }">
                    {{ alert.stock?.current }}
                  </td>
                  <td>{{ alert.stock?.reorder_level }}</td>
                  <td>{{ formatDate(alert.expiry?.date) }}</td>
                  <td :class="getExpiryClass(alert.expiry?.days_remaining)">
                    {{ alert.expiry?.days_remaining || 'N/A' }}
                  </td>
                  <td>
                    <span class="alert-type-badge" :class="(alert.alert?.type ?? '').toLowerCase()">
                      {{ formatAlertType(alert.alert?.type) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Multi-Tenant Products Tab -->
        <div v-if="activeTab === 'multi-tenant-products'" class="multi-tenant-products-view">
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
        <div v-if="activeTab === 'products'" class="products-view">
          <div class="table-header">
            <h2>Product Details</h2>
            <div class="filters">
              <input 
                v-model="productSearch" 
                @input="searchProducts"
                type="text" 
                placeholder="Search products..."
                class="search-input"
              >
              <label class="checkbox-label">
                <input type="checkbox" v-model="showOnlyLowStock" @change="searchProducts">
                Low Stock Only
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showOnlyExpiring" @change="searchProducts">
                Expiring Soon Only
              </label>
            </div>
          </div>

          <div v-if="loadingProducts" class="loading-small">
            <div class="spinner-small"></div>
          </div>

          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Company</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Total Value</th>
                  <th>Location</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in productsList" :key="`${product.product_id ?? ''}-${product.company?.id ?? ''}`">
                  <td class="product-name">
                    <strong>{{ product.product?.brand_name }}</strong>
                    <span v-if="product.product?.strength" class="strength">
                      {{ product.product?.strength }}
                    </span>
                    <span class="unit">{{ product.product?.unit }}</span>
                  </td>
                  <td>{{ product.company?.name }}</td>
                  <td>{{ product.stock?.quantity }}</td>
                  <td>
                    <span class="status-badge" :class="(product.stock?.status ?? '').toLowerCase()">
                      {{ formatStatus(product.stock?.status ?? '') }}
                    </span>
                  </td>
                  <td>GH₵ {{ (product.pricing?.cost_price ?? 0).toFixed(2) }}</td>
                  <td>GH₵ {{ (product.pricing?.selling_price ?? 0).toFixed(2) }}</td>
                  <td>GH₵ {{ formatNumber(product.pricing?.total_value) }}</td>
                  <td>{{ product.stock?.shelf_location || 'N/A' }}</td>
                  <td>
                    <div class="expiry-info">
                      <div>{{ formatDate(product.expiry?.expiry_date) }}</div>
                      <div class="days-to-expiry" :class="getExpiryClass(product.expiry?.days_to_expiry)">
                        {{ product.expiry?.days_to_expiry }} days
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="productsPagination.total > 0" class="pagination">
              <button 
                @click="previousPage" 
                :disabled="productsPagination.offset === 0"
                class="btn-page"
              >
                ← Previous
              </button>
              <span class="page-info">
                Showing {{ productsPagination.offset + 1 }} - 
                {{ Math.min(productsPagination.offset + productsPagination.limit, productsPagination.total) }}
                of {{ productsPagination.total }}
              </span>
              <button 
                @click="nextPage" 
                :disabled="!productsPagination.has_more"
                class="btn-page"
              >
                Next →
              </button>
            </div>
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

<style scoped>
.inventory-analytics {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-export,
.btn-refresh,
.btn-retry {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-export {
  background: #10b981;
  color: white;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-refresh {
  background: #3b82f6;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
}

.btn-export:disabled,
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #666;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-small {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-container {
  text-align: center;
  padding: 60px;
  color: #dc2626;
}

.btn-retry {
  margin-top: 16px;
  background: #dc2626;
  color: white;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  transition: transform 0.2s;
  border: 1px solid #e5e7eb;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.metric-card .details h3 {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.metric-card .value-large {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.metric-card .subtext {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

.metric-card.alerts.critical {
  border-left: 4px solid #dc2626;
}

/* Alert Summary */
.alert-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.alert-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-item:hover {
  transform: scale(1.05);
}

.alert-item.critical {
  background: #fee2e2;
  color: #991b1b;
}

.alert-item.warning {
  background: #fef3c7;
  color: #92400e;
}

.alert-item.danger {
  background: #fecaca;
  color: #7f1d1d;
}

.alert-item.info {
  background: #dbeafe;
  color: #1e40af;
}

.alert-item .count {
  font-size: 24px;
  font-weight: 700;
}

.alert-item .label {
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  color: #3b82f6;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Tables */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.table-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.metric-select,
.alert-filter {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.limit-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f9fafb;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.company-name,
.product-name {
  font-weight: 600;
}

.product-name {
  min-width: 200px;
}

.product-name .strength {
  display: block;
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

.product-name .unit {
  display: inline-block;
  margin-left: 6px;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
}

.profit {
  color: #059669;
  font-weight: 600;
}

.text-danger {
  color: #dc2626;
  font-weight: 600;
}

/* Badges */
.margin-badge,
.rank-badge,
.status-badge,
.severity-badge,
.alert-type-badge,
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.margin-badge.high {
  background: #d1fae5;
  color: #065f46;
}

.margin-badge.medium {
  background: #fed7aa;
  color: #92400e;
}

.margin-badge.low {
  background: #fee2e2;
  color: #991b1b;
}

.rank-badge.top {
  background: #fef3c7;
  color: #92400e;
}

.rank-badge.good {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.normal {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.low_stock {
  background: #fed7aa;
  color: #92400e;
}

.status-badge.out_of_stock {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.expiring_soon {
  background: #fef3c7;
  color: #78350f;
}

.severity-badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

.severity-badge.high {
  background: #fed7aa;
  color: #92400e;
}

.severity-badge.medium {
  background: #fef3c7;
  color: #78350f;
}

.severity-badge.low {
  background: #dbeafe;
  color: #1e40af;
}

.alert-type-badge.out_of_stock {
  background: #fee2e2;
  color: #991b1b;
}

.alert-type-badge.low_stock {
  background: #fed7aa;
  color: #92400e;
}

.alert-type-badge.expired {
  background: #fecaca;
  color: #7f1d1d;
}

.alert-type-badge.expiring_soon {
  background: #fef3c7;
  color: #78350f;
}

.badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

.badge.warning {
  background: #fed7aa;
  color: #92400e;
}

.badge.info {
  background: #dbeafe;
  color: #1e40af;
}

.alert-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* Expiry Info */
.expiry-info .days-to-expiry {
  font-size: 12px;
  margin-top: 2px;
}

.expiry-info .days-to-expiry.expired {
  color: #7f1d1d;
  font-weight: 600;
}

.expiry-info .days-to-expiry.critical {
  color: #991b1b;
  font-weight: 600;
}

.expiry-info .days-to-expiry.warning {
  color: #92400e;
  font-weight: 600;
}

.expiry-info .days-to-expiry.normal {
  color: #065f46;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.btn-page {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #2563eb;
}

.btn-page:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .inventory-analytics {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .alert-summary {
    flex-direction: column;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    width: 100%;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}

/* Multi-Tenant Products View */
.multi-tenant-products-view {
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
