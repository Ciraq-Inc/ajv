<template>
  <div class="admin-sms-campaigns">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">SMS Campaign Management</h1>
        <p class="page-subtitle">Monitor and manage all SMS campaigns across companies</p>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="btn-secondary" :disabled="loading">
          <Icon name="RefreshCw" size="18" :class="{ 'animate-spin': loading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div v-if="!loading" class="stats-grid">
      <div class="stat-card gradient-blue">
        <ChartBarIcon class="stat-icon" />
        <div class="stat-content">
          <div class="stat-label">Total Campaigns</div>
          <div class="stat-value">{{ stats.totalCampaigns }}</div>
          <div class="stat-trend">All time</div>
        </div>
      </div>
<!-- 
      <div class="stat-card gradient-green">
        <CheckCircleIcon class="stat-icon" />
        <div class="stat-content">
          <div class="stat-label">Active Campaigns</div>
          <div class="stat-value">{{ stats.activeCampaigns }}</div>
          <div class="stat-trend">Currently running</div>
        </div>
      </div> -->

      <div class="stat-card gradient-purple">
        <DevicePhoneMobileIcon class="stat-icon" />
        <div class="stat-content">
          <div class="stat-label">Messages Sent Today</div>
          <div class="stat-value">{{ formatNumber(stats.messagesSentToday) }}</div>
          <div class="stat-trend">Last 24 hours</div>
        </div>
      </div>

      <!-- <div class="stat-card gradient-orange">
        <CurrencyDollarIcon class="stat-icon" />
        <div class="stat-content">
          <div class="stat-label">Credits Used Today</div>
          <div class="stat-value">{{ stats.creditsUsedToday }}</div>
          <div class="stat-trend">Total spent</div>
        </div>
      </div> -->

      <!-- amount spent today -->
      <div class="stat-card gradient-red">
        <CurrencyDollarIcon class="stat-icon" />
        <div class="stat-content">
          <div class="stat-label">Amount Spent Today (GHS)</div>
          <div class="stat-value">{{ formatCurrency(stats.amountSpentToday) }}</div>
          <div class="stat-trend">Total spent</div>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-box">
        <Icon name="Search" size="18" class="search-icon" />
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search campaigns by name or company..."
          class="search-input"
        />
      </div>

      <div class="filter-controls">
        <select v-model="filters.status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="processing">Processing</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>


        <select v-model="filters.company" class="filter-select">
          <option value="">All Companies</option>
          <option v-for="company in companies" :key="company.id" :value="company.id">
            {{ company.name }}
          </option>
        </select>

        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="btn-clear-filters"
        >
          <Icon name="X" size="16" />
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading campaigns...</p>
    </div>

    <!-- Campaigns Table -->
    <div v-else-if="filteredCampaigns.length > 0" class="campaigns-table-container">
      <table class="campaigns-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Company</th>
            <th>Status</th>
            <th>Recipients</th>
            <th>Progress</th>
            <th>Cost</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="campaign in paginatedCampaigns" :key="campaign.id" class="campaign-row">
            <td>
              <div class="campaign-info">
                <div class="campaign-name">{{ campaign.name }}</div>
                <div class="campaign-message">{{ truncateMessage(campaign.message) }}</div>
              </div>
            </td>
            <td>
              <div class="company-cell">
                <Icon name="Building2" size="16" class="company-icon" />
                <span>{{ campaign.company_name || 'N/A' }}</span>
              </div>
            </td>
            <td>
              <StatusBadge :status="campaign.status" />
            </td>
            <td class="text-center">
              <div class="recipients-count">{{ formatNumber(campaign.total_recipients || 0) }}</div>
            </td>
            <td>
              <div class="progress-cell">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: calculateProgress(campaign) + '%' }"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ campaign.messages_sent || 0 }} / {{ campaign.total_recipients || 0 }}
                </div>
              </div>
            </td>
            <td>
              <div class="cost-cell">GHS {{ formatCurrency(campaign.actual_cost || campaign.sms_cost || 0) }}</div>
            </td>
            <td>
              <div class="date-cell">{{ formatDate(campaign.created_at) }}</div>
            </td>
            <td>
              <div class="actions-cell">
                <button
                  @click="viewCampaign(campaign)"
                  class="action-btn view"
                  title="View Details"
                >
                  <Icon name="Eye" size="16" />
                </button>
                
                <button
                  v-if="campaign.status === 'paused'"
                  @click="resumeCampaign(campaign)"
                  class="action-btn resume"
                  title="Resume Campaign"
                >
                  <Icon name="Play" size="16" />
                </button>
                
                <button
                  v-if="campaign.status === 'active' || campaign.status === 'processing'"
                  @click="pauseCampaign(campaign)"
                  class="action-btn pause"
                  title="Pause Campaign"
                >
                  <Icon name="Pause" size="16" />
                </button>
                
                <button
                  v-if="campaign.status === 'draft' || campaign.status === 'scheduled'"
                  @click="cancelCampaign(campaign)"
                  class="action-btn cancel"
                  title="Cancel Campaign"
                >
                  <Icon name="X" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <InboxIcon class="empty-icon" />
      <h3>No campaigns found</h3>
      <p v-if="hasActiveFilters">
        Try adjusting your filters or search criteria
      </p>
      <p v-else>
        No SMS campaigns have been created yet
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="filteredCampaigns.length > itemsPerPage" class="pagination">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        <Icon name="ChevronLeft" size="18" />
      </button>
      
      <div class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </div>
      
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        <Icon name="ChevronRight" size="18" />
      </button>
    </div>

    <!-- Campaign Details Modal -->
    <div v-if="selectedCampaign" class="modal-overlay" @click.self="closeCampaignModal">
      <div class="modal campaign-details-modal">
        <div class="modal-header">
          <h2>Campaign Details</h2>
          <button @click="closeCampaignModal" class="modal-close">
            <Icon name="X" size="20" />
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Campaign Info -->
          <div class="detail-section">
            <h3>Campaign Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedCampaign.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Company:</span>
                <span class="detail-value">{{ selectedCampaign.company_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <StatusBadge :status="selectedCampaign.status" />
              </div>
              <div class="detail-item">
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(selectedCampaign.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div class="detail-section">
            <h3>Message</h3>
            <div class="message-preview">{{ selectedCampaign.message }}</div>
          </div>

          <!-- Statistics -->
          <div class="detail-section">
            <h3>Statistics</h3>
            <div class="stats-row">
              <div class="stat-box">
                <div class="stat-box-label">Total Recipients</div>
                <div class="stat-box-value">{{ formatNumber(selectedCampaign.total_recipients || 0) }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Sent</div>
                <div class="stat-box-value text-green">{{ formatNumber(selectedCampaign.messages_sent || 0) }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Delivered</div>
                <div class="stat-box-value text-green">{{ formatNumber(selectedCampaign.messages_delivered || 0) }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Failed</div>
                <div class="stat-box-value text-red">{{ formatNumber(selectedCampaign.messages_failed || 0) }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Credits Charged</div>
                <div class="stat-box-value">{{ formatNumber(selectedCampaign.sms_charged || selectedCampaign.actual_credits_used || 0) }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Actual Cost</div>
                <div class="stat-box-value">GHS {{ formatCurrency(selectedCampaign.actual_cost || selectedCampaign.sms_cost || 0) }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-label">Payment Status</div>
                <div class="stat-box-value">
                  <span :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    selectedCampaign.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    selectedCampaign.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  ]">
                    {{ selectedCampaign.payment_status || 'pending' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recipients Info -->
          <div class="detail-section" v-if="selectedCampaign.recipient_config">
            <h3>Recipients Configuration</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Type:</span>
                <span class="detail-value">{{ selectedCampaign.recipient_config.type || 'N/A' }}</span>
              </div>
              <div class="detail-item" v-if="selectedCampaign.recipient_config.filters">
                <span class="detail-label">Filters:</span>
                <span class="detail-value">{{ Object.keys(selectedCampaign.recipient_config.filters).length }} applied</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCampaignModal" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="showConfirmDialog"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :confirmText="confirmDialog.confirmText"
      @confirm="confirmDialog.onConfirm"
      @cancel="closeConfirmDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ChartBarIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  InboxIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import StatusBadge from '~/components/sms/shared/StatusBadge.vue'
import ConfirmDialog from '~/components/sms/shared/ConfirmDialog.vue'
import { formatCurrency, formatDate } from '~/utils/constants/sms'

// Define page metadata
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

// Composables
const { campaigns, loading, error, fetchCampaigns, pauseCampaign: pauseCampaignAction, resumeCampaign: resumeCampaignAction } = useSMSCampaigns()

// State
const filters = ref({
  search: '',
  status: '',
  company: '',
})

const selectedCampaign = ref(null)
const showConfirmDialog = ref(false)
const confirmDialog = ref({
  title: '',
  message: '',
  type: 'warning',
  confirmText: 'Confirm',
  onConfirm: () => {},
})

const currentPage = ref(1)
const itemsPerPage = ref(10)
const companies = ref([]) // Would be fetched from API

// Computed
const stats = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return {
    totalCampaigns: campaigns.value.length,
    activeCampaigns: campaigns.value.filter(c => c.status === 'active' || c.status === 'processing' || c.status === 'sending').length,
    messagesSentToday: campaigns.value
      .filter(c => new Date(c.created_at) >= todayStart)
      .reduce((sum, c) => sum + (c.messages_sent || 0), 0),
    creditsUsedToday: campaigns.value
      .filter(c => new Date(c.created_at) >= todayStart)
      .reduce((sum, c) => sum + (c.sms_charged || 0), 0),
    amountSpentToday: campaigns.value
      .filter(c => new Date(c.created_at) >= todayStart)
      .reduce((sum, c) => sum + (c.actual_cost || c.sms_cost || 0), 0),
  }
})

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status || filters.value.company
})

const filteredCampaigns = computed(() => {
  let result = [...campaigns.value]

  // Search filter
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(c =>
      c.name?.toLowerCase().includes(search) ||
      c.company_name?.toLowerCase().includes(search) ||
      c.message?.toLowerCase().includes(search)
    )
  }

  // Status filter
  if (filters.value.status) {
    result = result.filter(c => c.status === filters.value.status)
  }

  // Company filter
  if (filters.value.company) {
    result = result.filter(c => c.company_id === filters.value.company)
  }

  // Sort by created date (newest first)
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredCampaigns.value.length / itemsPerPage.value)
})

const paginatedCampaigns = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCampaigns.value.slice(start, end)
})

// Methods
const refreshData = async () => {
  await fetchCampaigns()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    company: '',
  }
  currentPage.value = 1
}

const viewCampaign = (campaign) => {
  selectedCampaign.value = campaign
}

const closeCampaignModal = () => {
  selectedCampaign.value = null
}

const pauseCampaign = (campaign) => {
  confirmDialog.value = {
    title: 'Pause Campaign',
    message: `Are you sure you want to pause the campaign "${campaign.name}"? You can resume it later.`,
    type: 'warning',
    confirmText: 'Pause Campaign',
    onConfirm: async () => {
      await pauseCampaignAction(campaign.id)
      closeConfirmDialog()
      await refreshData()
    },
  }
  showConfirmDialog.value = true
}

const resumeCampaign = (campaign) => {
  confirmDialog.value = {
    title: 'Resume Campaign',
    message: `Are you sure you want to resume the campaign "${campaign.name}"?`,
    type: 'info',
    confirmText: 'Resume Campaign',
    onConfirm: async () => {
      await resumeCampaignAction(campaign.id)
      closeConfirmDialog()
      await refreshData()
    },
  }
  showConfirmDialog.value = true
}

const cancelCampaign = (campaign) => {
  confirmDialog.value = {
    title: 'Cancel Campaign',
    message: `Are you sure you want to cancel the campaign "${campaign.name}"? This action cannot be undone.`,
    type: 'danger',
    confirmText: 'Cancel Campaign',
    onConfirm: async () => {
      // Would call cancel API
      closeConfirmDialog()
      await refreshData()
    },
  }
  showConfirmDialog.value = true
}

const closeConfirmDialog = () => {
  showConfirmDialog.value = false
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
}

// const formatCurrency = (value) => {
//   const num = parseFloat(value) || 0
//   return num.toFixed(2)
// }

const truncateMessage = (message) => {
  if (!message) return 'No message'
  return message.length > 60 ? message.substring(0, 60) + '...' : message
}

const calculateProgress = (campaign) => {
  if (!campaign.total_recipients || campaign.total_recipients === 0) return 0
  return Math.round(((campaign.messages_sent || 0) / campaign.total_recipients) * 100)
}

// Lifecycle
onMounted(async () => {
  await fetchCampaigns()
  // Fetch companies list for filter
  // await fetchCompanies()
})
</script>

<style scoped>
.admin-sms-campaigns {
  padding: 0;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gradient-blue { border-left: 4px solid #3B82F6; }
.gradient-green { border-left: 4px solid #10B981; }
.gradient-purple { border-left: 4px solid #8B5CF6; }
.gradient-orange { border-left: 4px solid #F59E0B; }

.stat-icon {
  font-size: 36px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  color: #9CA3AF;
}

/* Filters */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
}

.filter-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.btn-clear-filters {
  padding: 8px 16px;
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FCA5A5;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Campaigns Table */
.campaigns-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.campaigns-table {
  width: 100%;
  border-collapse: collapse;
}

.campaigns-table thead {
  background: #F9FAFB;
}

.campaigns-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #E5E7EB;
}

.campaigns-table td {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
}

.campaign-row:hover {
  background: #F9FAFB;
}

.campaign-info {
  min-width: 200px;
}

.campaign-name {
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.campaign-message {
  font-size: 13px;
  color: #6B7280;
}

.company-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4B5563;
}

.company-icon {
  color: #9CA3AF;
}

.recipients-count {
  font-weight: 600;
  color: #1F2937;
}

.progress-cell {
  min-width: 150px;
}

.progress-bar {
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6, #1D4ED8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6B7280;
}

.cost-cell {
  font-weight: 600;
  color: #059669;
}

.date-cell {
  font-size: 13px;
  color: #6B7280;
}

.actions-cell {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.view {
  background: #DBEAFE;
  color: #1E40AF;
}

.action-btn.view:hover {
  background: #BFDBFE;
}

.action-btn.resume {
  background: #D1FAE5;
  color: #065F46;
}

.action-btn.resume:hover {
  background: #A7F3D0;
}

.action-btn.pause {
  background: #FEF3C7;
  color: #92400E;
}

.action-btn.pause:hover {
  background: #FDE68A;
}

.action-btn.cancel {
  background: #FEE2E2;
  color: #991B1B;
}

.action-btn.cancel:hover {
  background: #FECACA;
}

/* Loading & Empty States */
.loading-state {
  background: white;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #D1D5DB;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6B7280;
  margin: 0;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #6B7280;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.campaign-details-modal .modal-body {
  overflow-y: auto;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
}

.modal-close {
  padding: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #F3F4F6;
}

.modal-body {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 16px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.message-preview {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  color: #1F2937;
  line-height: 1.6;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-box {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-box-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 8px;
}

.stat-box-value {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
}

.stat-box-value.text-green {
  color: #059669;
}

.stat-box-value.text-red {
  color: #DC2626;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Buttons */
.btn-secondary {
  padding: 10px 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .campaigns-table-container {
    overflow-x: auto;
  }

  .campaigns-table {
    min-width: 1000px;
  }
}

.text-center {
  text-align: center;
}
</style>
