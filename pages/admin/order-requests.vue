<template>
  <div class="order-requests-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Order Requests</h1>
        <p class="page-subtitle">Manage customer order requests, process items, and coordinate fulfillment</p>
      </div>
      <div class="header-actions">
        <button @click="fetchStats" class="btn-secondary" :disabled="loading">
          <ChartBarIcon class="icon-sm" />
          <span>Stats</span>
        </button>
        <button @click="fetchRequests" class="btn-secondary" :disabled="loading">
          <ArrowPathIcon class="icon-sm" :class="{ 'animate-spin': loading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <ClipboardDocumentListIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending || 0 }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon processing">
          <Cog6ToothIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.processing || 0 }}</div>
          <div class="stat-label">Processing</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <CheckCircleIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed || 0 }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <CubeIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-group">
        <input v-model="searchQuery" type="text" class="form-control search-input"
          placeholder="Search by request #, customer name..." @keyup.enter="fetchRequests" />
        <button @click="fetchRequests" class="btn-primary btn-sm">Search</button>
      </div>
      <select v-model="statusFilter" @change="fetchRequests" class="form-control filter-select">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="items_sourced">Items Sourced</option>
        <option value="awaiting_customer">Awaiting Customer</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Requests Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Request #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Status</th>
            <th>Fee</th>
            <th>Fulfillment</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="loading-cell">Loading requests...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
            <td colspan="8" class="empty-cell">No requests found</td>
          </tr>
          <tr v-for="req in requests" :key="req.id" class="table-row">
            <td class="request-number">{{ req.request_number }}</td>
            <td>
              <div class="customer-info">
                <span class="customer-name">{{ req.customer_name || 'N/A' }}</span>
                <span class="customer-phone">{{ req.customer_phone || '' }}</span>
              </div>
            </td>
            <td>
              <span class="item-count">{{ req.item_count || '—' }}</span>
            </td>
            <td>
              <span class="status-badge" :class="req.status">{{ formatStatus(req.status) }}</span>
            </td>
            <td>GHS {{ parseFloat(req.request_fee || 0).toFixed(2) }}</td>
            <td>
              <span v-if="req.fulfillment_type" class="fulfillment-badge" :class="req.fulfillment_type">
                {{ req.fulfillment_type }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="date-cell">{{ formatDate(req.created_at) }}</td>
            <td>
              <div class="action-btns">
                <button @click="viewRequest(req)" class="btn-icon-text" title="View Details">
                  <EyeIcon class="icon-sm" /> <span>View</span>
                </button>
                <button @click="processRequest(req)" class="btn-icon-text"
                  :title="req.status === 'pending' ? 'Process' : 'Fulfillment'">
                  <ArrowPathIcon v-if="req.status !== 'pending'" class="icon-sm" />
                  <Cog6ToothIcon v-else class="icon-sm" />
                  <span>{{ req.status === 'pending' ? 'Process' : 'Fulfillment' }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Request Detail Modal -->
    <div v-if="selectedRequest" class="modal-overlay" @click.self="selectedRequest = null">
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>Request #{{ selectedRequest.request_number }}</h3>
          <button @click="selectedRequest = null" class="modal-close">
            <XMarkIcon class="icon-sm" />
          </button>
        </div>
        <div class="modal-body">
          <!-- New Fulfillment Manager component -->
          <FulfillmentPharmacyManager :request="selectedRequest" :pharmacies="nearbyPharmacies"
            @contact="contactPharmacy" @confirm="confirmPharmacy" @out-of-stock="markOutOfStock" />

          <!-- Request Info -->
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="status-badge" :class="selectedRequest.status">{{ formatStatus(selectedRequest.status)
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Customer</span>
              <span>{{ selectedRequest.customer_name || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone</span>
              <span>{{ selectedRequest.customer_phone || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Request Fee</span>
              <span>GHS {{ parseFloat(selectedRequest.request_fee || 0).toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Fulfillment</span>
              <span>{{ selectedRequest.fulfillment_type || 'Not chosen' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Delivery Address</span>
              <span>{{ selectedRequest.delivery_address || 'N/A' }}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="items-section">
            <h4>Request Items</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Marked Up</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedRequest.items" :key="item.id">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>
                    <input v-if="item.editing" v-model.number="item.edit_price" type="number" step="0.01"
                      class="form-control form-control-sm" style="width: 100px" />
                    <span v-else>{{ item.unit_price ? `GHS ${parseFloat(item.unit_price).toFixed(2)}` : '—' }}</span>
                  </td>
                  <td>{{ item.marked_up_price ? `GHS ${parseFloat(item.marked_up_price).toFixed(2)}` : '—' }}</td>
                  <td>
                    <span class="status-badge sm" :class="item.item_status || 'pending'">{{ item.item_status ||
                      'pending' }}</span>
                  </td>
                  <td>
                    <button v-if="!item.editing" @click="startEditItem(item)" class="btn-icon-text sm"
                      title="Set Price">
                      <PencilSquareIcon class="icon-xs" /> <span>Edit</span>
                    </button>
                    <button v-else @click="saveItemPrice(item)" class="btn-icon-text sm" title="Save">
                      <CheckIcon class="icon-xs" /> <span>Save</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Admin Notes -->
          <div class="notes-section mt-4 border-t pt-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-semibold text-gray-700 m-0">Admin Notes</h4>
              <button @click="saveNotes" class="btn-secondary btn-sm" :disabled="loading">
                Save Notes
              </button>
            </div>
            <textarea v-model="adminNotes" class="form-control w-full" rows="3"
              placeholder="Internal notes for this request..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <select v-model="selectedStatus" class="form-control" style="width: auto">
            <option value="">Change Status...</option>
            <option value="processing">Processing</option>
            <option value="items_sourced">Items Sourced</option>
            <option value="awaiting_customer">Awaiting Customer</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button @click="updateStatus" class="btn-primary" :disabled="!selectedStatus || loading">
            Update Status
          </button>
          <button @click="calculateTotals" class="btn-secondary" :disabled="loading">
            Calculate Totals
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="message" class="message-toast" :class="{ 'message-error': message.type === 'error' }">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import FulfillmentPharmacyManager from '~/components/admin/FulfillmentPharmacyManager.vue'
import {
  ChartBarIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  CubeIcon,
  XMarkIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

const adminStore = useAdminStore()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase

// State
const loading = ref(false)
const requests = ref([])
const stats = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const selectedRequest = ref(null)
const selectedStatus = ref('')
const adminNotes = ref('')
const nearbyPharmacies = ref([])
const message = ref(null)

// API helper
const apiCall = async (method, url, data = null) => {
  const fullUrl = `${apiBaseUrl}${url}`
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminStore.token}`
    }
  }
  if (data) opts.body = JSON.stringify(data)
  const response = await fetch(fullUrl, opts)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

// Fetch
const fetchRequests = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    const qs = params.toString()
    const res = await apiCall('GET', `/api/order-requests/admin${qs ? `?${qs}` : ''}`)
    requests.value = res.data || []
  } catch (e) {
    showMessage('Failed to load requests', 'error')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await apiCall('GET', '/api/order-requests/admin/stats')
    stats.value = res.data
  } catch (e) {
    showMessage('Failed to load stats', 'error')
  }
}

const viewRequest = async (req) => {
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${req.id}`)
    selectedRequest.value = res.data
    selectedStatus.value = res.data.status || ''
    adminNotes.value = res.data.admin_notes || ''

    // If it's already in processing or similar, fetch fulfillment details
    const fulfillmentStatuses = ['processing', 'items_sourced', 'awaiting_customer', 'confirmed', 'completed']
    if (fulfillmentStatuses.includes(res.data.status)) {
      try {
        const procRes = await apiCall('POST', `/api/order-requests/admin/${req.id}/process`)
        nearbyPharmacies.value = procRes.data.nearby_pharmacies || []
      } catch (e) {
        nearbyPharmacies.value = res.data.nearby_pharmacies || []
      }
    } else {
      nearbyPharmacies.value = res.data.nearby_pharmacies || []
    }
  } catch (e) {
    showMessage('Failed to load request details', 'error')
  }
}

const processRequest = async (req) => {
  // We still want to call the process endpoint even if it's not pending 
  // to get/refresh the nearby pharmacies list
  loading.value = true
  try {
    const res = await apiCall('POST', `/api/order-requests/admin/${req.id}/process`)

    // Set selected request so modal opens - use the full returned request object if available
    const fullRequest = res.data.request || req;
    selectedRequest.value = { ...fullRequest, status: res.data.status || fullRequest.status }
    selectedStatus.value = res.data.status || fullRequest.status || ''
    adminNotes.value = fullRequest.admin_notes || ''

    // Set nearby pharmacies for the manager component
    nearbyPharmacies.value = res.data.nearby_pharmacies || []

    if (req.status === 'pending') {
      await fetchRequests()
    }
    showMessage('Fulfillment details loaded', 'success')
  } catch (e) {
    // If process fails, fall back to simple view
    await viewRequest(req)
    showMessage('Loaded request details', 'info')
  } finally {
    loading.value = false
  }
}

const contactPharmacy = async (pharm) => {
  if (!selectedRequest.value) return

  // Open WhatsApp immediately
  window.open(pharm.whatsapp_url, '_blank')

  // Log contact in background
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`)
    pharm.contacted_at = new Date().toISOString()
  } catch (e) {
    console.error('Failed to log contact', e)
  }
}

const confirmPharmacy = async (pharm) => {
  if (!selectedRequest.value) return
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`, {
      status: 'confirmed',
      is_confirmed: true
    })
    nearbyPharmacies.value.forEach(p => {
      p.is_confirmed = false
      if (p.pharmacy_status === 'confirmed') p.pharmacy_status = 'contacted'
    })
    pharm.is_confirmed = true
    pharm.pharmacy_status = 'confirmed'
    showMessage(`Confirmed ${pharm.name} will fulfill this order`, 'success')
  } catch (e) {
    showMessage('Failed to confirm pharmacy', 'error')
  }
}

const markOutOfStock = async (pharm) => {
  if (!selectedRequest.value) return
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`, {
      status: 'out_of_stock',
      is_confirmed: false
    })
    pharm.pharmacy_status = 'out_of_stock'
    pharm.is_confirmed = false
    showMessage(`${pharm.name} marked as out of stock`, 'success')
  } catch (e) {
    showMessage('Failed to update pharmacy status', 'error')
  }
}

const updateStatus = async () => {
  if (!selectedRequest.value || !selectedStatus.value) return
  loading.value = true
  try {
    await apiCall('PUT', `/api/order-requests/admin/${selectedRequest.value.id}/status`, {
      status: selectedStatus.value,
      admin_notes: adminNotes.value
    })
    selectedRequest.value.status = selectedStatus.value
    selectedStatus.value = ''

    // Refresh pharmacies if needed
    const fulfillmentStatuses = ['processing', 'items_sourced', 'awaiting_customer', 'confirmed', 'completed']
    if (fulfillmentStatuses.includes(selectedRequest.value.status)) {
      const procRes = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
      nearbyPharmacies.value = procRes.data.nearby_pharmacies || []
    }

    await fetchRequests()
    showMessage('Status updated and fulfillment data refreshed', 'success')
  } catch (e) {
    showMessage('Failed to update status', 'error')
  } finally {
    loading.value = false
  }
}

const saveNotes = async () => {
  if (!selectedRequest.value) return
  loading.value = true
  try {
    await apiCall('PUT', `/api/order-requests/admin/${selectedRequest.value.id}/notes`, {
      admin_notes: adminNotes.value
    })
    selectedRequest.value.admin_notes = adminNotes.value
    showMessage('Admin notes saved successfully', 'success')
  } catch (e) {
    showMessage('Failed to save notes', 'error')
  } finally {
    loading.value = false
  }
}

const calculateTotals = async () => {
  if (!selectedRequest.value) return
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}/totals`)
    showMessage(`Subtotal: GHS ${res.data.subtotal} | ${res.data.available_items.length} available, ${res.data.unavailable_items.length} unavailable`, 'success')
  } catch (e) {
    showMessage('Failed to calculate totals', 'error')
  }
}

const startEditItem = (item) => {
  item.editing = true
  item.edit_price = item.unit_price || 0
}

const saveItemPrice = async (item) => {
  try {
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      unit_price: item.edit_price,
      item_status: 'available'
    })
    item.unit_price = item.edit_price
    item.item_status = 'available'
    item.editing = false
    showMessage('Item price updated', 'success')
  } catch (e) {
    showMessage('Failed to update item price', 'error')
  }
}

// Helpers
const formatStatus = (status) => (status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 4000)
}

onMounted(() => {
  fetchRequests()
  fetchStats()
})

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})
</script>

<style scoped>
.order-requests-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.925rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.pending {
  background: #fef3c7;
}

.stat-icon.processing {
  background: #dbeafe;
}

.stat-icon.completed {
  background: #dcfce7;
}

.stat-icon.total {
  background: #f3e8ff;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  min-width: 250px;
}

.search-input {
  flex: 1;
}

.filter-select {
  width: 200px;
}

.form-control {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-icon-text {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-text:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.btn-icon-text.sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.icon-md {
  width: 24px;
  height: 24px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 0.875rem 1rem;
  background: #f9fafb;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #374151;
}

.table-row:hover {
  background: #f9fafb;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 2rem !important;
  color: #9ca3af;
}

.request-number {
  font-weight: 600;
  color: #667eea;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 500;
}

.customer-phone {
  font-size: 0.75rem;
  color: #9ca3af;
}

.date-cell {
  font-size: 0.8rem;
  color: #6b7280;
}

.text-muted {
  color: #9ca3af;
}

.action-btns {
  display: flex;
  gap: 0.25rem;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge.sm {
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.items_sourced {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.awaiting_customer {
  background: #fce7f3;
  color: #9d174d;
}

.status-badge.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.available {
  background: #dcfce7;
  color: #166534;
}

.status-badge.unavailable {
  background: #fee2e2;
  color: #991b1b;
}

.fulfillment-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.fulfillment-badge.delivery {
  background: #dbeafe;
  color: #1e40af;
}

.fulfillment-badge.pickup {
  background: #fef3c7;
  color: #92400e;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-lg {
  max-width: 900px;
}

.modal-header {
  padding: 1.25rem 1.5rem;
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
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 6px;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
}

/* Items Table */
.items-section {
  margin-bottom: 1.5rem;
}

.items-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #111827;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.items-table th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  background: #f9fafb;
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.items-table td {
  padding: 0.625rem 0.75rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.85rem;
}

/* Pharmacies */
.pharmacies-section {
  margin-bottom: 1.5rem;
}

.pharmacies-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #111827;
}

.pharmacy-cards {
  display: grid;
  gap: 0.75rem;
}

.pharmacy-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.pharmacy-info {
  display: flex;
  flex-direction: column;
}

.pharmacy-distance {
  font-size: 0.8rem;
  color: #6b7280;
}

.btn-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #25D366;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-whatsapp:hover {
  background: #1da855;
  transform: translateY(-1px);
}

/* Notes */
.notes-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

/* Toast */
.message-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  z-index: 2000;
  animation: slideUp 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-toast.message-error {
  background: #ef4444;
}

@keyframes slideUp {
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
