<template>
  <div class="products-table-container">
    <!-- Search and Filters -->
    <div class="table-header">
      <h2 v-if="showTitle">{{ title }}</h2>
      <div class="filters">
        <input 
          v-model="searchInput"
          @keyup.enter="handleSearch"
          type="text" 
          placeholder="Search products..."
          class="search-input"
        >
        <input
          v-if="showPharmacySearch"
          v-model="pharmacySearchInput"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="Search pharmacy..."
          class="search-input"
        >
        <button @click="handleSearch" class="btn-search" :disabled="loading || !hasSearchCriteria">
          <Icon name="Search" size="16" />
          Search
        </button>
        <select 
          v-if="showCompanyFilter && companies.length > 0" 
          v-model="selectedCompany"
          @change="onCompanyChange"
          class="company-filter"
        >
          <option value="">All Companies</option>
          <option v-for="company in companies" :key="company.id ?? ''" :value="company.id">
            {{ company.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && products.length === 0" class="loading-container">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && !hasSearched" class="empty-state">
      <Icon name="Search" size="48" class="empty-icon" />
      <p>Search to view products</p>
      <p class="empty-subtext">Enter a product name, and optionally a pharmacy name, then run the search.</p>
    </div>

    <div v-else-if="!loading && products.length === 0" class="empty-state">
      <Icon name="Package" size="48" class="empty-icon" />
      <p>No products found</p>
      <p class="empty-subtext">Try adjusting your search criteria</p>
    </div>

    <!-- Products Table -->
    <div v-else class="table-wrapper">
      <table class="products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Company</th>
            <th>Location</th>
            <th>WhatsApp</th>
            <th>Unit</th>
            <th>Price (GHS)</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="(product.id as PropertyKey | undefined) ?? ''" class="product-row">
            <td>
              <div class="product-name">{{ product.product_name }}</div>
            </td>
            <td>
              <div class="company-name">{{ product.company_name }}</div>
            </td>
            <td>
              <div class="company-location">{{ product.company_location || 'N/A' }}</div>
            </td>
            <td>
              <a v-if="product.company_phone"
                 :href="`https://wa.me/${formatWhatsApp(String(product.company_phone))}`"
                 target="_blank"
                 class="whatsapp-link">
                <Icon name="MessageCircle" size="16" />
                {{ product.company_phone }}
              </a>
              <span v-else class="text-muted">N/A</span>
            </td>
            <td>
              <span class="unit-badge">{{ product.unit || 'N/A' }}</span>
            </td>
            <td>
              <span class="price">{{ formatPrice(product.price as number | string | null | undefined) }}</span>
            </td>
            <td>
              <span class="date">{{ formatDate(product.date_updated as string | undefined) }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Loading Overlay for Pagination -->
      <div v-if="loading && products.length > 0" class="loading-overlay">
        <div class="spinner-small"></div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total > 0" class="pagination">
      <button 
        @click="previousPage" 
        :disabled="pagination.offset === 0 || loading"
        class="btn-page"
      >
        <Icon name="ChevronLeft" size="16" />
        Previous
      </button>
      <span class="page-info">
        Showing {{ pagination.offset + 1 }} - {{ Math.min(pagination.offset + pagination.limit, pagination.total) }} 
        of {{ formatNumber(pagination.total) }} products
      </span>
      <button 
        @click="nextPage" 
        :disabled="!pagination.has_more || loading"
        class="btn-page"
      >
        Next
        <Icon name="ChevronRight" size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import phoneUtils from '~/utils/phone'

interface Product {
  [key: string]: unknown;
}

interface Company {
  id?: number | string;
  name?: string;
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
  makeAuthRequest: (url: string) => Promise<{
    success?: boolean;
    data?: { products?: Product[]; pagination?: Pagination };
    companies?: Company[];
    message?: string;
  }>;
}

// Props
const props = defineProps<{
  title?: string;
  showTitle?: boolean;
  showCompanyFilter?: boolean;
  initialCompanyId?: number | string | null;
  pageSize?: number;
  autoload?: boolean;
  showPharmacySearch?: boolean;
  apiEndpoint?: string;
}>()

// Emits
const emit = defineEmits<{
  'product-selected': [product: Product];
  'loaded': [payload: { products: Product[]; pagination: Pagination }];
}>()

// Store
const adminStore = useAdminStore() as unknown as AdminStoreShape

// State
const loading = ref<boolean>(false)
const searchInput = ref<string>('')
const pharmacySearchInput = ref<string>('')
const selectedCompany = ref<number | string>(props.initialCompanyId ?? '')
const products = ref<Product[]>([])
const companies = ref<Company[]>([])
const hasSearched = ref<boolean>(false)

const emptyPagination = (): Pagination => ({
  total: 0,
  limit: props.pageSize ?? 50,
  offset: 0,
  has_more: false
})
const pagination = ref<Pagination>(emptyPagination())

const hasSearchCriteria = computed<boolean>(() => {
  return Boolean(
    String(searchInput.value ?? '').trim() ||
    String(pharmacySearchInput.value ?? '').trim() ||
    selectedCompany.value
  )
})

// Methods
const handleSearch = (): void => {
  if (!hasSearchCriteria.value) {
    hasSearched.value = false
    products.value = []
    pagination.value = emptyPagination()
    return
  }

  hasSearched.value = true
  pagination.value.offset = 0
  void loadProducts()
}

const onCompanyChange = (): void => {
  pagination.value.offset = 0
  if (props.autoload || hasSearched.value) {
    void loadProducts()
  }
}

const loadProducts = async (): Promise<void> => {
  if (!props.autoload && !hasSearched.value) {
    products.value = []
    pagination.value = emptyPagination()
    return
  }

  loading.value = true

  try {
    const params: Record<string, string> = {
      limit: String(pagination.value.limit),
      offset: String(pagination.value.offset)
    }

    if (searchInput.value) {
      params['search'] = searchInput.value
    }

    if (pharmacySearchInput.value) {
      params['pharmacySearch'] = pharmacySearchInput.value
    }

    if (selectedCompany.value) {
      params['companyId'] = String(selectedCompany.value)
    }

    const queryString = new URLSearchParams(params).toString()
    const url = `${props.apiEndpoint ?? '/api/inventory-analytics/search-products'}?${queryString}`

    const data = await adminStore.makeAuthRequest(url)

    if (data.success) {
      products.value = data.data?.products ?? []
      pagination.value = data.data?.pagination ?? emptyPagination()
      emit('loaded', { products: products.value, pagination: pagination.value })
    } else {
      throw new Error(data.message ?? 'Failed to load products')
    }
  } catch (err) {
    console.error('Error loading products:', err)
    products.value = []
    pagination.value = emptyPagination()
  } finally {
    loading.value = false
  }
}

const loadCompanies = async (): Promise<void> => {
  try {
    const data = await adminStore.makeAuthRequest('/api/companies')
    if (data.success) {
      companies.value = data.companies ?? []
    }
  } catch (err) {
    console.error('Error loading companies:', err)
  }
}

const nextPage = (): void => {
  pagination.value.offset += pagination.value.limit
  void loadProducts()
  scrollToTop()
}

const previousPage = (): void => {
  pagination.value.offset = Math.max(0, pagination.value.offset - pagination.value.limit)
  void loadProducts()
  scrollToTop()
}

const scrollToTop = (): void => {
  const container = document.querySelector('.products-table-container')
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Formatting Functions
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '0.00'
  return parseFloat(String(price)).toFixed(2)
}

const formatWhatsApp = (whatsapp: string | undefined): string => {
  return phoneUtils.formatWhatsApp(whatsapp) ?? ''
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`
    }
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString('en-US')
}

// Expose methods for parent components
defineExpose({
  refresh: (): Promise<void> => loadProducts(),
  reset: (): void => {
    searchInput.value = ''
    pharmacySearchInput.value = ''
    selectedCompany.value = props.initialCompanyId ?? ''
    pagination.value.offset = 0
    hasSearched.value = props.autoload ?? true
    if (props.autoload) {
      void loadProducts()
    } else {
      products.value = []
      pagination.value = emptyPagination()
    }
  }
})

// Lifecycle
onMounted(() => {
  hasSearched.value = props.autoload ?? true

  if (props.showCompanyFilter) {
    void loadCompanies()
  }

  if (props.autoload) {
    void loadProducts()
  }
})

// Watch for prop changes
watch(() => props.initialCompanyId, (newVal) => {
  selectedCompany.value = newVal ?? ''
  pagination.value.offset = 0
  if (props.autoload || hasSearched.value) {
    void loadProducts()
  }
})
</script>

<style scoped>
.products-table-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

/* Header */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  flex-wrap: wrap;
}

.search-input {
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  min-width: 280px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-search {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn-search:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-search:active:not(:disabled) {
  transform: translateY(0);
}

.btn-search:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.company-filter {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.company-filter:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-subtext {
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #9ca3af !important;
}

/* Table */
.table-wrapper {
  position: relative;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.products-table thead {
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.products-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.products-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}

.product-row {
  transition: background-color 0.15s;
  cursor: pointer;
}

.product-row:hover {
  background-color: #f9fafb;
}

.product-row:last-child td {
  border-bottom: none;
}

/* Cell Content */
.product-name {
  font-weight: 600;
  color: #1f2937;
}

.company-name {
  color: #6b7280;
  font-weight: 500;
}

.company-location {
  color: #6b7280;
  font-size: 13px;
}

.whatsapp-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #25d366;
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s;
}

.whatsapp-link:hover {
  color: #128c7e;
  text-decoration: underline;
}

.text-muted {
  color: #9ca3af;
  font-size: 13px;
}

.unit-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.price {
  font-weight: 600;
  color: #059669;
}

.date {
  color: #6b7280;
  font-size: 13px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-page {
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-page:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-page:active:not(:disabled) {
  transform: translateY(0);
}

.btn-page:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .products-table-container {
    padding: 16px;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    width: 100%;
    flex-direction: column;
  }

  .search-input,
  .btn-search,
  .company-filter {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .page-info {
    order: -1;
  }
}
</style>
