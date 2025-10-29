<template>
  <div class="admin-sms-settings">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">SMS Settings Management</h1>
        <p class="page-subtitle">Manage global SMS settings, providers, and company-specific configurations</p>
      </div>
      <div class="header-actions">
        <button @click="refreshSettings" class="btn-secondary" :disabled="loading">
          <Icon name="RefreshCw" size="18" :class="{ 'animate-spin': loading }" />
          <span>Refresh</span>
        </button>
        <button @click="saveGlobalSettings" class="btn-primary" :disabled="loading || !hasGlobalChanges">
          <Icon name="Save" size="18" />
          <span>{{ loading ? 'Saving...' : 'Save Global Settings' }}</span>
        </button>
      </div>
    </div>

    <!-- Settings Tabs -->
    <div class="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        <Icon :name="tab.icon" size="18" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Global Settings -->
      <div v-if="activeTab === 'global'" class="settings-section">
        <div class="section-header">
          <h3>Global SMS Settings</h3>
          <p>View and update global SMS configuration</p>
        </div>

        <div class="settings-grid">
          <div class="setting-card">
            <div class="setting-header">
              <h4>Current Global Settings</h4>
            </div>
            <div class="setting-content">
              <div class="status-display">
                <div class="status-item">
                  <span class="status-label">Active Provider:</span>
                  <span class="status-value">{{ globalSettings.active_provider || 'Not set' }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">SMS Rate:</span>
                  <span class="status-value">{{ globalSettings.sms_rate_per_unit || '0.00' }}</span>
                </div>
                <div class="status-item">
                  <span class="status-label">Last Updated:</span>
                  <span class="status-value">{{ formatDate(globalSettings.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="setting-header">
              <h4>Update SMS Rate</h4>
            </div>
            <div class="setting-content">
              <div class="form-group">
                <label>New SMS Rate ($)</label>
                <input
                  v-model.number="updateRateForm.sms_rate"
                  type="number"
                  class="form-control"
                  step="0.01"
                  min="0"
                  placeholder="0.20"
                />
              </div>

              <div class="form-group">
                <label>Active Provider</label>
                <select v-model="updateRateForm.active_provider" class="form-control">
                  <option value="">Select Provider</option>
                  <option value="nalo">Nalo</option>
                  <option value="mnotify">MNotify</option>
         
                </select>
              </div>

              <div class="flex gap-2">
                <button @click="updateSmsRate" class="btn-primary" :disabled="loading || !updateRateForm.sms_rate">
                  <Icon name="Update" size="16" />
                  <span>Update Rate</span>
                </button>
                <button @click="updateProvider" class="btn-secondary" :disabled="loading || !updateRateForm.active_provider">
                  <Icon name="Settings" size="16" />
                  <span>Update Provider</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <Icon name="Loader2" size="24" class="animate-spin" />
        <span>{{ loadingMessage }}</span>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message-toast" :class="{ 'message-error': message.type === 'error' }">
      <Icon :name="message.type === 'success' ? 'CheckCircle' : 'AlertCircle'" size="20" />
      <span>{{ message.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'


// State
const adminStore = useAdminStore()
const loading = ref(false)
const loadingMessage = ref('')
const activeTab = ref('global')
const message = ref(null)
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase

// Data
const globalSettings = reactive({
  active_provider: '',
  sms_rate: 0,
  updated_at: null
})

// Forms
const updateRateForm = reactive({
  sms_rate: null,
  active_provider: ''
})

// Tabs configuration
const tabs = [
  { id: 'global', label: 'Global Settings', icon: 'Settings' }
]

// Computed
const hasGlobalChanges = computed(() => {
  return updateRateForm.sms_rate !== null || updateRateForm.active_provider !== ''
})

// API Methods
const apiCall = async (method, url, data = null) => {
  const fullUrl = `${apiBaseUrl}${url}`
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminStore.token}`
    }
  }

  if (data) {
    config.body = JSON.stringify(data)
  }

  const response = await fetch(fullUrl, config)
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`)
  }
  return response.json()
}

// Methods
const refreshSettings = async () => {
  loading.value = true
  loadingMessage.value = 'Loading settings...'

  try {
    // Load global settings
    const globalData = await apiCall('GET', '/api/sms-settings/active')
    if (globalData.success && globalData.data) {
      Object.assign(globalSettings, globalData.data)
    } else if (globalData.message === 'SMS settings not configured') {
      // Settings not initialized yet
      showMessage('SMS settings not configured yet', 'error')
    }

    showMessage('Settings refreshed successfully', 'success')
  } catch (error) {
    console.error('Failed to refresh settings:', error)
    if (error.message.includes('404')) {
      showMessage('SMS settings not configured yet', 'error')
    } else {
      showMessage('Failed to refresh settings', 'error')
    }
  } finally {
    loading.value = false
  }
}

const updateSmsRate = async () => {
  if (updateRateForm.sms_rate === null) return

  loading.value = true
  loadingMessage.value = 'Updating SMS rate...'

  try {
    const data = { rate: updateRateForm.sms_rate }

    await apiCall('PUT', '/api/sms-settings/rate', data)

    // Reset form
    updateRateForm.sms_rate = null

    // Refresh data
    await refreshSettings()

    showMessage('SMS rate updated successfully', 'success')
  } catch (error) {
    console.error('Failed to update SMS rate:', error)
    showMessage('Failed to update SMS rate', 'error')
  } finally {
    loading.value = false
  }
}

const saveGlobalSettings = async () => {
  loading.value = true
  loadingMessage.value = 'Saving global settings...'

  try {
    const data = {}
    if (updateRateForm.sms_rate !== null) {
      data.rate = updateRateForm.sms_rate
    }
    if (updateRateForm.active_provider) {
      data.provider = updateRateForm.active_provider
    }

    await apiCall('PUT', '/api/sms-settings', data)

    // Reset form
    updateRateForm.sms_rate = null
    updateRateForm.active_provider = ''

    // Refresh data
    await refreshSettings()

    showMessage('Global settings saved successfully', 'success')
  } catch (error) {
    console.error('Failed to save global settings:', error)
    showMessage('Failed to save global settings', 'error')
  } finally {
    loading.value = false
  }
}

const updateProvider = async () => {
  if (!updateRateForm.active_provider) return

  loading.value = true
  loadingMessage.value = 'Updating provider...'

  try {
    const data = { provider: updateRateForm.active_provider }

    await apiCall('PUT', '/api/sms-settings/provider', data)

    // Reset form
    updateRateForm.active_provider = ''

    // Refresh data
    await refreshSettings()

    showMessage('Provider updated successfully', 'success')
  } catch (error) {
    console.error('Failed to update provider:', error)
    showMessage('Failed to update provider', 'error')
  } finally {
    loading.value = false
  }
}

const closeModals = () => {
  // No modals to close
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Initialize
onMounted(async () => {
  await refreshSettings()
})

// Define page metadata
definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

</script>

<style scoped>
.admin-sms-settings {
  max-width: 1200px;
  margin: 0 auto;
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

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tabs */
.settings-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
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
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #667eea;
  background: #f8fafc;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f0f9ff;
}

/* Settings Sections */
.settings-section {
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
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

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.setting-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.setting-header {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.setting-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.setting-content {
  padding: 1.5rem;
}

/* Form Elements */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
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

/* Status Display */
.status-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.status-label {
  font-weight: 600;
  color: #374151;
}

.status-value {
  color: #6b7280;
}

/* Providers Section */
.providers-section,
.companies-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.providers-header,
.companies-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.providers-header h4,
.companies-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.providers-list,
.companies-list {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.provider-card,
.company-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.provider-card:hover,
.company-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.provider-header,
.company-header {
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.provider-header h5,
.company-header h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.provider-status,
.company-status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.provider-status.active,
.company-status.active {
  background: #dcfce7;
  color: #166534;
}

.provider-status:not(.active),
.company-status:not(.active) {
  background: #fef3c7;
  color: #92400e;
}

.provider-content,
.company-content {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.provider-details,
.company-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.provider-rate,
.company-sender {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.provider-updated,
.company-updated {
  font-size: 0.75rem;
  color: #6b7280;
}

.provider-actions,
.company-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

/* Search Group */
.search-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Checkboxes */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  accent-color: #667eea;
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
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #667eea;
}

.loading-spinner span {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Message Toast */
.message-toast {
  position: fixed;
  top: 1rem;
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

.message-error {
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

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .header-actions button {
    flex: 1;
  }

  .settings-tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .providers-header,
  .companies-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .provider-header,
  .company-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .provider-actions,
  .company-actions {
    align-self: flex-end;
  }

  .provider-content,
  .company-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>