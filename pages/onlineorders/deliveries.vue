<template>
  <div />
</template>

<script setup>
definePageMeta({ middleware: ['admin-auth'] })

const router = useRouter()

onMounted(() => {
  router.replace('/admin/fulfillment/deliveries')
})
</script>

          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDriverModal = false" class="btn-secondary">Cancel</button>
          <button @click="saveDriver" class="btn-primary"
            :disabled="!driverForm.name || !driverForm.phone || !driverForm.username">
            {{ editingDriver ? 'Update' : 'Create' }} Driver
          </button>
        </div>
      </div>
    </div>

    <!-- Create Batch Modal -->
    <div v-if="showBatchModal" class="modal-overlay" @click.self="showBatchModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Delivery Batch</h3>
          <button @click="showBatchModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Batch Type</label>
            <select v-model="batchForm.batch_type" class="form-control">
              <option value="manual">Manual</option>
              <option value="time_window">Time Window</option>
              <option value="geography">Geography</option>
            </select>
          </div>
          <div class="form-group">
            <label>Assign Driver</label>
            <select v-model="batchForm.driver_id" class="form-control">
              <option value="">Unassigned</option>
              <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="batchForm.notes" class="form-control" rows="2" placeholder="Batch notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showBatchModal = false" class="btn-secondary">Cancel</button>
          <button @click="createBatch" class="btn-primary">Create Batch</button>
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

const adminStore = useAdminStore()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase

const loading = ref(false)
const activeTab = ref('drivers')
const message = ref(null)
const showDriverModal = ref(false)
const showBatchModal = ref(false)
const editingDriver = ref(null)
const deliveryStatusFilter = ref('')

const tabs = [
  { id: 'drivers', label: 'Drivers', icon: '🚗' },
  { id: 'batches', label: 'Batches', icon: '📦' },
  { id: 'deliveries', label: 'Deliveries', icon: '🚚' },
]

const drivers = ref([])
const batches = ref([])
const deliveries = ref([])

const driverForm = reactive({ name: '', phone: '', vehicle_type: '', vehicle_registration: '', username: '', password: '' })
const batchForm = reactive({ batch_type: 'manual', driver_id: '', notes: '' })

const apiCall = async (method, url, data = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminStore.token}` }
  }
  if (data) opts.body = JSON.stringify(data)
  const response = await fetch(`${apiBaseUrl}${url}`, opts)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

// Drivers
const fetchDrivers = async () => {
  try {
    const res = await apiCall('GET', '/api/deliveries/drivers')
    drivers.value = res.data || []
  } catch (e) { showMessage('Failed to load drivers', 'error') }
}

const saveDriver = async () => {
  try {
    if (editingDriver.value) {
      await apiCall('PUT', `/api/deliveries/drivers/${editingDriver.value}`, driverForm)
    } else {
      await apiCall('POST', '/api/deliveries/drivers', driverForm)
    }
    showDriverModal.value = false
    editingDriver.value = null
    Object.assign(driverForm, { name: '', phone: '', vehicle_type: '', vehicle_registration: '', username: '', password: '' })
    await fetchDrivers()
    showMessage('Driver saved', 'success')
  } catch (e) { showMessage('Failed to save driver', 'error') }
}

const editDriver = (driver) => {
  editingDriver.value = driver.id
  Object.assign(driverForm, { name: driver.name, phone: driver.phone, vehicle_type: driver.vehicle_type || '', vehicle_registration: driver.vehicle_registration || '', username: driver.username || '', password: '' })
  showDriverModal.value = true
}

const deactivateDriver = async (id) => {
  if (!confirm('Deactivate this driver?')) return
  try {
    await apiCall('DELETE', `/api/deliveries/drivers/${id}`)
    await fetchDrivers()
    showMessage('Driver deactivated', 'success')
  } catch (e) { showMessage('Failed to deactivate driver', 'error') }
}

// Batches
const fetchBatches = async () => {
  try {
    const res = await apiCall('GET', '/api/deliveries/batches')
    batches.value = res.data || []
  } catch (e) { showMessage('Failed to load batches', 'error') }
}

const createBatch = async () => {
  try {
    await apiCall('POST', '/api/deliveries/batches', batchForm)
    showBatchModal.value = false
    Object.assign(batchForm, { batch_type: 'manual', driver_id: '', notes: '' })
    await fetchBatches()
    showMessage('Batch created', 'success')
  } catch (e) { showMessage('Failed to create batch', 'error') }
}

const viewBatch = async (batch) => {
  // TODO: expand with batch detail modal
  showMessage(`Batch #${batch.id}: ${batch.delivery_count || 0} deliveries`, 'success')
}

// Deliveries
const fetchDeliveries = async () => {
  try {
    const params = deliveryStatusFilter.value ? `?status=${deliveryStatusFilter.value}` : ''
    const res = await apiCall('GET', `/api/deliveries${params}`)
    deliveries.value = res.data || []
  } catch (e) { showMessage('Failed to load deliveries', 'error') }
}

const updateDeliveryStatus = async (id, status) => {
  if (!status) return
  try {
    await apiCall('PUT', `/api/deliveries/${id}/status`, { status })
    await fetchDeliveries()
    showMessage(`Delivery status updated to ${status}`, 'success')
  } catch (e) { showMessage('Failed to update delivery', 'error') }
}

const formatStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'
const showMessage = (text, type = 'success') => { message.value = { text, type }; setTimeout(() => { message.value = null }, 4000) }

onMounted(() => {
  fetchDrivers()
  fetchBatches()
  fetchDeliveries()
})

definePageMeta({ middleware: ['admin-auth'], layout: 'admin-layout' })
</script>

<style scoped>
.delivery-page {
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

.tabs-bar {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f0f9ff;
}

.tab-content {
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

.section-actions {
  margin-bottom: 1rem;
}

.filters-bar {
  margin-bottom: 1rem;
}

.form-control {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 100%;
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

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

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  font-size: 1.1rem;
  transition: background 0.15s;
  text-decoration: none;
}

.btn-icon:hover {
  background: #f3f4f6;
}

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

.empty-cell {
  text-align: center;
  padding: 2rem !important;
  color: #9ca3af;
}

.driver-name {
  font-weight: 600;
}

.batch-number {
  font-weight: 600;
  color: #667eea;
}

.date-cell {
  font-size: 0.8rem;
  color: #6b7280;
}

.action-btns {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.assigned {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.in_progress,
.status-badge.in_transit {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.picked_up {
  background: #fce7f3;
  color: #9d174d;
}

.status-badge.completed,
.status-badge.delivered {
  background: #dcfce7;
  color: #166534;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  background: #f3e8ff;
  color: #7c3aed;
  font-weight: 500;
}

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
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
}

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
