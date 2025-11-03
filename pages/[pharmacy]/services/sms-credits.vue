<template>
  <div class="sms-credits-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">SMS Credits</h1>
        <p class="page-subtitle">Manage your SMS credits and purchase new ones</p>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="btn-secondary" :disabled="loading">
          <Icon name="RefreshCw" size="18" :class="{ 'animate-spin': loading }" />
          <span>Refresh</span>
        </button>
        <button @click="showPurchaseModal = true" class="btn-primary" :disabled="loading || !canPurchase">
          <Icon name="Plus" size="18" />
          <span>Purchase Credits</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-grid">
      <!-- Balance Cards -->
      <div class="balance-section">
        <div class="balance-card primary">
          <div class="card-header">
            <span class="card-label">SMS Credits</span>
            <Icon name="MessageSquare" size="24" />
          </div>
          <div class="card-value">{{ smsBalance }}</div>
          <div class="card-subtitle">Available credits</div>
        </div>

        <div class="balance-card secondary">
          <div class="card-header">
            <span class="card-label">Money Balance</span>
            <Icon name="DollarSign" size="24" />
          </div>
          <div class="card-value">₵{{ formatCurrency(moneyBalance) }}</div>
          <div class="card-subtitle">Available for purchase</div>
        </div>

        <div class="balance-card info">
          <div class="card-header">
            <span class="card-label">SMS Rate</span>
            <Icon name="TrendingUp" size="24" />
          </div>
          <div class="card-value">₵{{ formatCurrency(smsRate_value) }}</div>
          <div class="card-subtitle">Per SMS</div>
        </div>

        <div class="balance-card warning" v-if="smsBalance < 100">
          <div class="card-header">
            <span class="card-label">Low Balance</span>
            <Icon name="AlertTriangle" size="24" />
          </div>
          <div class="card-subtitle">Consider purchasing more credits</div>
        </div>
      </div>
    </div>


      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Transactions Tab -->
        <div  class="tab-pane">
          <div class="section-header">
            <h3>Transaction History</h3>
            <p>View all your SMS credit transactions</p>
          </div>

          <!-- Filters -->
          <div class="filter-section">
            <div class="form-group">
              <label>Transaction Type</label>
              <select v-model="transactionFilters.type" class="form-control">
                <option value="">All SMS Transactions</option>
                <option value="sms_deduction">SMS Sent (New)</option>
                <option value="sent">SMS Sent (Legacy)</option>
                <option value="sms_topup">SMS Top-up (New)</option>
                <option value="topup">SMS Top-up (Legacy)</option>
                <option value="sms_refund">SMS Refund (New)</option>
                <option value="refund">SMS Refund (Legacy)</option>
                <option value="deduction">SMS Deduction (Legacy)</option>
              </select>
            </div>

            <div class="form-group">
              <label>From Date</label>
              <input v-model="transactionFilters.startDate" type="date" class="form-control" />
            </div>

            <div class="form-group">
              <label>To Date</label>
              <input v-model="transactionFilters.endDate" type="date" class="form-control" />
            </div>

            <button @click="applyFilters" class="btn-primary">Apply Filters</button>
          </div>

          <!-- Transactions Table -->
          <div class="table-container">
            <table class="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>SMS Count</th>
                  <th>Balance</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in transactions" :key="transaction.id">
                  <td>{{ formatDate(transaction.created_at) }}</td>
                  <td>
                    <span :class="`badge badge-${transaction.transaction_type}`">
                      {{ formatTransactionType(transaction.transaction_type) }}
                    </span>
                  </td>
                  <td>{{ transaction.description }}</td>
                  <td>{{ transaction.sms_count }}</td>
                  <td>{{ transaction.balance_after }}</td>
                  <td>₵{{ formatCurrency(transaction.amount) }}</td>
                </tr>
              </tbody>
            </table>

            <div v-if="transactions.length === 0" class="empty-state">
              <Icon name="MessageSquare" size="48" />
              <p>No transactions found</p>
            </div>
          </div>
        </div>

    
      </div>

    <!-- Purchase Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click="showPurchaseModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Purchase SMS Credits</h3>
          <button @click="showPurchaseModal = false" class="modal-close">
            <Icon name="X" size="24" />
          </button>
        </div>

        <div class="modal-body">
          <div class="purchase-info">
            <p><strong>Current Balance:</strong> {{ smsBalance }} SMS</p>
            <p><strong>Money Available:</strong> ₵{{ formatCurrency(moneyBalance) }}</p>
            <p><strong>SMS Rate:</strong> ₵{{ formatCurrency(smsRate_value) }} per SMS</p>
          </div>

          <div class="form-group">
            <label>Number of SMS Credits to Purchase</label>
            <input
              v-model.number="purchaseForm.smsCount"
              type="number"
              class="form-control"
              min="1"
              step="100"
              placeholder="Enter number of SMS"
              @input="calculatePurchaseCost"
            />
          </div>

          <div v-if="purchaseForm.smsCount" class="purchase-summary">
            <div class="summary-row">
              <span>SMS Count:</span>
              <span>{{ purchaseForm.smsCount }}</span>
            </div>
            <div class="summary-row">
              <span>Rate per SMS:</span>
              <span>₵{{ formatCurrency(smsRate_value) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total Cost:</span>
              <span>₵{{ formatCurrency(purchaseForm.totalCost) }}</span>
            </div>

            <div v-if="purchaseForm.totalCost > moneyBalance" class="error-message">
              <Icon name="AlertCircle" size="16" />
              Insufficient balance for this purchase
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showPurchaseModal = false" class="btn-secondary">Cancel</button>
          <button
            @click="performPurchase"
            class="btn-primary"
            :disabled="loading || !purchaseForm.smsCount || purchaseForm.totalCost > moneyBalance"
          >
            {{ loading ? 'Processing...' : 'Confirm Purchase' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Estimate Modal -->
    <div v-if="showEstimateModal" class="modal-overlay" @click="showEstimateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Estimate Campaign Cost</h3>
          <button @click="showEstimateModal = false" class="modal-close">
            <Icon name="X" size="24" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Number of Recipients</label>
            <input
              v-model.number="estimateForm.recipientCount"
              type="number"
              class="form-control"
              min="1"
              placeholder="Enter number of recipients"
            />
          </div>

          <button @click="performEstimate" class="btn-primary" :disabled="!estimateForm.recipientCount">
            Calculate Cost
          </button>

          <div v-if="estimateForm.result" class="estimate-result">
            <h4>Cost Estimate</h4>
            <div class="estimate-item">
              <span>Recipients:</span>
              <span>{{ estimateForm.result.recipient_count }}</span>
            </div>
            <div class="estimate-item">
              <span>Rate per SMS:</span>
              <span>₵{{ formatCurrency(estimateForm.result.sms_rate_per_unit) }}</span>
            </div>
            <div class="estimate-item">
              <span>SMS Credits Needed:</span>
              <span>{{ estimateForm.result.estimated_sms_credits }}</span>
            </div>
            <div class="estimate-item total">
              <span>Total Cost:</span>
              <span>₵{{ formatCurrency(estimateForm.result.estimated_total_cost) }}</span>
            </div>

            <div v-if="estimateForm.result.estimated_sms_credits > smsBalance" class="warning-message">
              <Icon name="AlertTriangle" size="16" />
              You don't have enough SMS credits for this campaign. You need to purchase more.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showEstimateModal = false" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="message" class="message-toast" :class="{ 'message-error': message.type === 'error' }">
      <Icon :name="message.type === 'success' ? 'CheckCircle' : 'AlertCircle'" size="20" />
      <span>{{ message.text }}</span>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <Icon name="Loader2" size="24" class="animate-spin" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSMSCredits } from '~/composables/useSMSCredits'

const {
  balance,
  overview,
  transactions,
  statistics,
  smsBalance,
  moneyBalance,
  smsRate_value,
  loading,
  error,
  fetchBalance,
  fetchOverview,
  fetchTransactions,
  fetchStatistics,
  fetchSmsRate,
  purchaseCredits,
  estimateCost,
} = useSMSCredits()

// Local state
const activeTab = ref('transactions')
const showPurchaseModal = ref(false)
const showEstimateModal = ref(false)
const message = ref(null)

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'BarChart3' },
  { id: 'transactions', label: 'Transactions', icon: 'List' },
]

const transactionFilters = ref({
  type: '',
  startDate: '',
  endDate: '',
})

const purchaseForm = ref({
  smsCount: null,
  totalCost: 0,
})

const estimateForm = ref({
  recipientCount: null,
  result: null,
})

// Computed
const canPurchase = computed(() => {
  return moneyBalance.value > 0
})

// Methods
const formatCurrency = (value) => {
  if (!value) return '0.00'
  return parseFloat(value).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTransactionType = (type) => {
  const map = {
    sms_deduction: 'SMS Sent',
    sms_topup: 'SMS Top-up',
    sms_refund: 'SMS Refund',
    purchase: 'Purchase',
    sent: 'SMS Sent',
    topup: 'Top Up',
    deduction: 'Deduction',
    refund: 'Refund',
  }
  return map[type] || type
}

const calculatePurchaseCost = () => {
  purchaseForm.value.totalCost = (purchaseForm.value.smsCount || 0) * smsRate_value.value
}

const performPurchase = async () => {
  try {
    const response = await purchaseCredits(purchaseForm.value.smsCount)

    if (response.success) {
      showMessage('SMS credits purchased successfully!', 'success')
      showPurchaseModal.value = false
      purchaseForm.value = { smsCount: null, totalCost: 0 }
      await refreshData()
    }
  } catch (err) {
    showMessage(err.message || 'Failed to purchase credits', 'error')
  }
}

const performEstimate = async () => {
  try {
    const result = await estimateCost(estimateForm.value.recipientCount)
    estimateForm.value.result = result
  } catch (err) {
    showMessage(err.message || 'Failed to estimate cost', 'error')
  }
}

const applyFilters = async () => {
  try {
    const filters = {
      // Only show SMS-related transactions (sms_deduction, sms_topup, sms_refund)
      sms_only: true
    }
    
    if (transactionFilters.value.type) {
      filters.transaction_type = transactionFilters.value.type
    }
    if (transactionFilters.value.startDate) {
      filters.start_date = transactionFilters.value.startDate
    }
    if (transactionFilters.value.endDate) {
      filters.end_date = transactionFilters.value.endDate
    }

    await fetchTransactions(filters)
  } catch (err) {
    showMessage(err.message || 'Failed to load transactions', 'error')
  }
}

const loadStatistics = async () => {
  try {
    await fetchStatistics()
  } catch (err) {
    showMessage(err.message || 'Failed to load statistics', 'error')
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      fetchBalance(), 
      fetchOverview(), 
      fetchTransactions({ sms_only: true }), // Only SMS credit transactions
      fetchSmsRate()
    ])
  } catch (err) {
    showMessage(err.message || 'Failed to refresh data', 'error')
  }
}

const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Initialize
onMounted(async () => {
  try {
    console.log('SMS Credits page mounted')
    console.log('Loading state:', loading.value)
    await refreshData()
    console.log('SMS Credits data loaded successfully')
  } catch (err) {
    console.error('Failed to load SMS credits page:', err)
    showMessage(err.message || 'Failed to load SMS credits. Please refresh the page.', 'error')
  }
})

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
})
</script>

<style scoped>
.sms-credits-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-outline {
  padding: 0.5rem 1rem;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: #f0f9ff;
}

/* Content Grid */
.content-grid {
  display: grid;
  gap: 2rem;
  margin-bottom: 2rem;
}

/* Balance Section */
.balance-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.balance-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.balance-card.primary {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.balance-card.secondary {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.balance-card.info {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.balance-card.warning {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.card-label {
  font-weight: 600;
  font-size: 0.75rem;
  opacity: 0.8;
  color: white;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: white;
}

.card-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
  color: white;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  border: 1px solid #e5e7eb;
  text-align: center;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.action-card svg {
  color: #667eea;
  margin-bottom: 1rem;
}

.action-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0.5rem 0;
}

.action-card p {
  color: #6b7280;
  margin: 0.5rem 0 1rem 0;
  font-size: 0.875rem;
}

/* Tabs */
.tabs-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 1.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #667eea;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-content {
  padding: 2rem 1.5rem;
}

.tab-pane {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Section Header */
.section-header {
  margin-bottom: 2rem;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.section-header p {
  color: #6b7280;
  margin: 0;
}

/* Filters */
.filter-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Tables */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.transactions-table,
.daily-stats-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table thead,
.daily-stats-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.transactions-table th,
.daily-stats-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.transactions-table td,
.daily-stats-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.transactions-table tbody tr:hover,
.daily-stats-table tbody tr:hover {
  background: #f9fafb;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-purchase {
  background: #dcfce7;
  color: #166534;
}

.badge-sent,
.badge-sms_deduction {
  background: #dbeafe;
  color: #0c4a6e;
}

.badge-topup,
.badge-sms_topup {
  background: #fef3c7;
  color: #92400e;
}

.badge-deduction {
  background: #fee2e2;
  color: #991b1b;
}

.badge-refund,
.badge-sms_refund {
  background: #e0e7ff;
  color: #3730a3;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 1rem;
}

/* Statistics */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.stat-card.full-width {
  grid-column: 1 / -1;
}

.stat-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 700;
  color: #111827;
}

.stat-detail {
  color: #9ca3af;
  font-size: 0.75rem;
}

/* Overview */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.overview-card.full-width {
  grid-column: 1 / -1;
}

.overview-card h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
}

.overview-card .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.small-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.small-table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
}

.small-table-row .value {
  font-weight: 600;
  color: #667eea;
}

/* Modals */
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Purchase Info */
.purchase-info {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #bfdbfe;
}

.purchase-info p {
  margin: 0.5rem 0;
  color: #0c4a6e;
  font-size: 0.875rem;
}

/* Purchase Summary */
.purchase-summary {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  border: 1px solid #e5e7eb;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.summary-row.total {
  border: none;
  font-weight: 700;
  font-size: 1rem;
  color: #667eea;
  padding: 1rem 0 0 0;
}

/* Estimate Result */
.estimate-result {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  border: 1px solid #e5e7eb;
}

.estimate-result h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.estimate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.estimate-item.total {
  border: none;
  font-weight: 700;
  font-size: 1rem;
  color: #667eea;
  padding: 1rem 0 0 0;
}

/* Messages */
.error-message,
.warning-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.warning-message {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.message-toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #10b981;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.message-toast.message-error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .sms-credits-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }

  .balance-section {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .filter-section {
    grid-template-columns: 1fr;
  }

  .tabs {
    overflow-x: auto;
    padding: 0 1rem;
  }

  .modal-content {
    width: 95%;
  }
}
</style>
