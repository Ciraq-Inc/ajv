<template>
  <div class="company-access-management">
    <div class="section-header">
      <h2>Company API Keys Management</h2>
      <button 
        @click="showGenerateModal = true" 
        class="btn-primary"
        v-if="selectedCompany"
      >
        ➕ Generate New API Key
      </button>
    </div>

    <!-- Company Selection -->
    <div class="company-selector">
      <label>Select Company:</label>
      <select v-model="selectedCompany" @change="loadApiKeys" class="company-select">
        <option :value="null">-- Select a Company --</option>
        <option v-for="company in companies" :key="company.id" :value="company.id">
          {{ company.name }}
        </option>
      </select>
    </div>

    <div v-if="selectedCompany">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">🔑</div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.total || 0 }}</div>
            <div class="stat-label">Total Keys</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✓</div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.active || 0 }}</div>
            <div class="stat-label">Active Keys</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">⏰</div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.expired || 0 }}</div>
            <div class="stat-label">Expired</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">📊</div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.used_recently || 0 }}</div>
            <div class="stat-label">Used Recently</div>
          </div>
        </div>
      </div>

      <!-- API Keys Table -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading API keys...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p>❌ {{ error }}</p>
        <button @click="loadApiKeys" class="btn-retry">Retry</button>
      </div>

      <div v-else class="table-container">
        <table class="keys-table">
          <thead>
            <tr>
              <th>Key Name</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Last Used</th>
              <th>Expires</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id">
              <td>
                <div class="key-name">
                  <span class="key-icon">🔐</span>
                  {{ key.key_name }}
                </div>
              </td>
              <td>
                <div class="api-key-cell">
                  <code class="api-key-display">{{ maskApiKey(key.api_key) }}</code>
                  <button @click="copyToClipboard(key.api_key)" class="copy-btn" title="Copy">
                    📋
                  </button>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(key)">
                  {{ getStatusText(key) }}
                </span>
              </td>
              <td>
                <div class="date-cell">
                  {{ formatDate(key.last_used_at) }}
                </div>
              </td>
              <td>
                <div class="date-cell" :class="{ 'expired': isExpired(key.expires_at) }">
                  {{ formatDate(key.expires_at) }}
                </div>
              </td>
              <td>
                <div class="date-cell">
                  {{ formatDate(key.created_at) }}
                </div>
              </td>
              <td>
                <div class="actions">
                  <button 
                    @click="confirmDeactivate(key)" 
                    class="btn-icon delete"
                    title="Deactivate"
                    :disabled="!key.is_active"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="apiKeys.length === 0" class="no-results">
          <p>No API keys found for this company</p>
          <button @click="showGenerateModal = true" class="btn-primary">
            Generate First API Key
          </button>
        </div>
      </div>

      <!-- API Key Usage Guide -->
      <div class="usage-guide">
        <h3>🔧 How to Use API Keys</h3>
        <div class="guide-content">
          <div class="guide-section">
            <h4>1. HTTP Header (Recommended)</h4>
            <pre><code>x-api-key: your_api_key_here</code></pre>
          </div>
          <div class="guide-section">
            <h4>2. Example Request</h4>
            <pre><code>curl -X POST {{ apiBase }}/api/sync/products \
  -H "x-api-key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"data": [...]}'</code></pre>
          </div>
          <div class="guide-section">
            <h4>3. JavaScript Example</h4>
            <pre><code>const response = await fetch('{{ apiBase }}/api/sync/products', {
  method: 'POST',
  headers: {
    'x-api-key': 'your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: products })
});</code></pre>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🏢</div>
      <h3>Select a Company</h3>
      <p>Choose a company from the dropdown above to manage their API keys</p>
    </div>

    <!-- Generate API Key Modal -->
    <div v-if="showGenerateModal" class="modal-overlay" @click.self="closeGenerateModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Generate New API Key</h2>
          <button @click="closeGenerateModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="generateApiKey">
            <div class="form-group">
              <label>Key Name *</label>
              <input 
                v-model="keyForm.key_name" 
                type="text" 
                required
                placeholder="e.g., Production Sync Service"
                class="form-input"
              >
              <small class="form-hint">Choose a descriptive name to identify this key</small>
            </div>

            <div class="form-group">
              <label>Expiration Date</label>
              <input 
                v-model="keyForm.expires_at" 
                type="date" 
                :min="minDate"
                class="form-input"
              >
              <small class="form-hint">Leave empty for no expiration</small>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeGenerateModal" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="generating">
                {{ generating ? 'Generating...' : 'Generate API Key' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Generated Key Display Modal -->
    <div v-if="newGeneratedKey" class="modal-overlay">
      <div class="modal">
        <div class="modal-header success">
          <h2>✅ API Key Generated Successfully</h2>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            <strong>⚠️ Important:</strong> This API key will only be shown once. Please copy it now and store it securely.
          </div>

          <div class="generated-key-display">
            <label>Your New API Key:</label>
            <div class="key-copy-box">
              <code>{{ newGeneratedKey.api_key }}</code>
              <button @click="copyToClipboard(newGeneratedKey.api_key)" class="copy-btn-large">
                📋 Copy
              </button>
            </div>
          </div>

          <div class="key-details">
            <div class="detail-row">
              <span class="detail-label">Key Name:</span>
              <span class="detail-value">{{ newGeneratedKey.key_name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expires:</span>
              <span class="detail-value">{{ newGeneratedKey.expires_at || 'Never' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(newGeneratedKey.created_at) }}</span>
            </div>
          </div>

          <div class="form-actions">
            <button @click="closeNewKeyModal" class="btn-primary">
              I've Copied the Key
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Deactivate Confirmation Modal -->
    <div v-if="deactivatingKey" class="modal-overlay" @click.self="deactivatingKey = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Confirm Deactivation</h2>
          <button @click="deactivatingKey = null" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to deactivate the API key <strong>{{ deactivatingKey.key_name }}</strong>?</p>
          <p class="warning-text">This will immediately prevent this key from working. This action cannot be undone.</p>
          
          <div class="form-actions">
            <button @click="deactivatingKey = null" class="btn-secondary">
              Cancel
            </button>
            <button @click="deactivateKey" class="btn-danger" :disabled="deleting">
              {{ deleting ? 'Deactivating...' : 'Deactivate' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

// State
const companies = ref([])
const selectedCompany = ref(null)
const apiKeys = ref([])
const stats = ref({})
const loading = ref(false)
const error = ref(null)
const generating = ref(false)
const deleting = ref(false)
const showGenerateModal = ref(false)
const newGeneratedKey = ref(null)
const deactivatingKey = ref(null)

const keyForm = ref({
  key_name: '',
  expires_at: ''
})

const apiBase = computed(() => {
  const config = useRuntimeConfig()
  return config.public.apiBase 
})

const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

// Methods
const loadCompanies = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/companies')
    if (response.success) {
      companies.value = response.data || []
    }
  } catch (err) {
    console.error('Error loading companies:', err)
  }
}

const loadApiKeys = async () => {
  if (!selectedCompany.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // Load API keys
    const keysResponse = await adminStore.makeAuthRequest(`/api/companies/${selectedCompany.value}/api-keys`)
    if (keysResponse.success) {
      apiKeys.value = keysResponse.data || []
    }

    // Load stats
    const statsResponse = await adminStore.makeAuthRequest(`/api/companies/${selectedCompany.value}/api-keys/stats`)
    if (statsResponse.success) {
      stats.value = statsResponse.data || {}
    }
  } catch (err) {
    error.value = err.message || 'Failed to load API keys'
    console.error('Error loading API keys:', err)
  } finally {
    loading.value = false
  }
}

const generateApiKey = async () => {
  generating.value = true
  
  try {
    const payload = {
      key_name: keyForm.value.key_name
    }
    
    if (keyForm.value.expires_at) {
      payload.expires_at = keyForm.value.expires_at
    }
    
    const response = await adminStore.makeAuthRequest(`/api/companies/${selectedCompany.value}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    if (response.success) {
      newGeneratedKey.value = response.data
      showGenerateModal.value = false
      resetForm()
    } else {
      alert(response.message || 'Failed to generate API key')
    }
  } catch (err) {
    alert(err.message || 'Failed to generate API key')
    console.error('Error generating API key:', err)
  } finally {
    generating.value = false
  }
}

const confirmDeactivate = (key) => {
  deactivatingKey.value = key
}

const deactivateKey = async () => {
  deleting.value = true
  
  try {
    const response = await adminStore.makeAuthRequest(
      `/api/companies/${selectedCompany.value}/api-keys/${deactivatingKey.value.id}`,
      { method: 'DELETE' }
    )
    
    if (response.success) {
      alert('API key deactivated successfully!')
      deactivatingKey.value = null
      loadApiKeys()
    } else {
      alert(response.message || 'Failed to deactivate API key')
    }
  } catch (err) {
    alert(err.message || 'Failed to deactivate API key')
    console.error('Error deactivating API key:', err)
  } finally {
    deleting.value = false
  }
}

const closeGenerateModal = () => {
  showGenerateModal.value = false
  resetForm()
}

const closeNewKeyModal = () => {
  newGeneratedKey.value = null
  loadApiKeys()
}

const resetForm = () => {
  keyForm.value = {
    key_name: '',
    expires_at: ''
  }
}

const maskApiKey = (key) => {
  if (!key) return ''
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('API key copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('Failed to copy to clipboard')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isExpired = (dateString) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

const getStatusClass = (key) => {
  if (!key.is_active) return 'inactive'
  if (isExpired(key.expires_at)) return 'expired'
  if (!key.last_used_at) return 'unused'
  return 'active'
}

const getStatusText = (key) => {
  if (!key.is_active) return 'Inactive'
  if (isExpired(key.expires_at)) return 'Expired'
  if (!key.last_used_at) return 'Never Used'
  return 'Active'
}

// Lifecycle
onMounted(() => {
  loadCompanies()
})
</script>

<style scoped>
.company-access-management {
  max-width: 1400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* Company Selector */
.company-selector {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.company-selector label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.company-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #d1fae5; }
.stat-icon.orange { background: #fed7aa; }
.stat-icon.purple { background: #e9d5ff; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  margin-bottom: 24px;
}

.keys-table {
  width: 100%;
  border-collapse: collapse;
}

.keys-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.keys-table th {
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.keys-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #1e293b;
}

.keys-table tbody tr:hover {
  background: #f8fafc;
}

.key-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.key-icon {
  font-size: 18px;
}

.api-key-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-key-display {
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #475569;
}

.copy-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #f1f5f9;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.expired {
  background: #fed7aa;
  color: #92400e;
}

.status-badge.unused {
  background: #dbeafe;
  color: #1e40af;
}

.date-cell {
  font-size: 13px;
  color: #64748b;
}

.date-cell.expired {
  color: #dc2626;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #fee2e2;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Usage Guide */
.usage-guide {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.usage-guide h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.guide-content {
  display: grid;
  gap: 20px;
}

.guide-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.guide-section pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
}

.guide-section code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* Empty State */
.empty-state {
  background: white;
  padding: 60px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.empty-state p {
  color: #64748b;
  margin: 0;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-danger,
.btn-retry {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-retry {
  background: #6366f1;
  color: white;
  margin-top: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading/Error States */
.loading-container,
.error-container {
  background: white;
  border-radius: 12px;
  padding: 60px;
  text-align: center;
  margin-bottom: 24px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-results {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
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
  z-index: 2000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: calc(100% - 32px);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

.modal-sm {
  max-width: 400px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header.success {
  background: #d1fae5;
  border-bottom-color: #a7f3d0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 24px;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.warning-text {
  color: #ef4444;
  font-size: 14px;
  margin: 16px 0;
}

/* Alert */
.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-warning {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
}

/* Generated Key Display */
.generated-key-display {
  margin: 20px 0;
}

.generated-key-display label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.key-copy-box {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
}

.key-copy-box code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #1e293b;
  word-break: break-all;
}

.copy-btn-large {
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.copy-btn-large:hover {
  background: #4f46e5;
}

/* Key Details */
.key-details {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
}

.detail-value {
  color: #1e293b;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .guide-content {
    grid-template-columns: 1fr;
  }
}
</style>
