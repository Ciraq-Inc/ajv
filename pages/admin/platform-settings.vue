<template>
  <div class="platform-settings-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Settings</h1>
        <p class="page-subtitle">Configure order processing, wallet, delivery, and API settings</p>
      </div>
      <div class="header-actions">
        <button @click="fetchSettings" class="btn-secondary" :disabled="loading">
          <span>🔄</span> Refresh
        </button>
        <button @click="saveAll" class="btn-primary" :disabled="loading || !hasChanges">
          <span>💾</span> {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Settings Groups -->
    <div class="settings-sections">
      <!-- Order Processing -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-icon">📋</div>
          <div>
            <h3>Order Processing</h3>
            <p>Configure request fees, markup rates, and pharmacy search</p>
          </div>
        </div>
        <div class="settings-grid">
          <div v-for="key in orderKeys" :key="key" class="setting-item">
            <label>{{ formatLabel(key) }}</label>
            <input v-model="editedSettings[key]" :type="getInputType(key)" class="form-control" :step="isDecimal(key) ? '0.01' : '1'" />
            <span class="setting-original" v-if="editedSettings[key] !== originalSettings[key]">
              Was: {{ originalSettings[key] }}
            </span>
          </div>
        </div>
      </div>

      <!-- Wallet & Payments -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-icon">💳</div>
          <div>
            <h3>Wallet & Payments</h3>
            <p>Paystack API keys for customer wallet top-up</p>
          </div>
        </div>
        <div class="settings-grid">
          <div v-for="key in paymentKeys" :key="key" class="setting-item">
            <label>{{ formatLabel(key) }}</label>
            <input v-model="editedSettings[key]" :type="key.includes('secret') ? 'password' : 'text'" class="form-control" />
          </div>
        </div>
      </div>

      <!-- Delivery -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-icon">🚚</div>
          <div>
            <h3>Delivery</h3>
            <p>Delivery fee calculation and routing</p>
          </div>
        </div>
        <div class="settings-grid">
          <div v-for="key in deliveryKeys" :key="key" class="setting-item">
            <label>{{ formatLabel(key) }}</label>
            <input v-model="editedSettings[key]" :type="getInputType(key)" class="form-control" :step="isDecimal(key) ? '0.01' : '1'" />
          </div>
        </div>
      </div>

      <!-- System -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-icon">⚙️</div>
          <div>
            <h3>System</h3>
            <p>Login requirements and platform behavior</p>
          </div>
        </div>
        <div class="settings-grid">
          <div v-for="key in systemKeys" :key="key" class="setting-item">
            <label>{{ formatLabel(key) }}</label>
            <select v-if="isBooleanSetting(key)" v-model="editedSettings[key]" class="form-control">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <input v-else v-model="editedSettings[key]" class="form-control" />
          </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase

const loading = ref(false)
const message = ref(null)
const originalSettings = reactive({})
const editedSettings = reactive({})

const orderKeys = ['request_submission_fee', 'order_markup_rate', 'max_pharmacy_retries', 'max_pharmacy_search_radius_km']
const paymentKeys = ['paystack_public_key', 'paystack_secret_key']
const deliveryKeys = ['delivery_fee_per_km', 'openrouteservice_api_key']
const systemKeys = ['require_login_to_browse']

const hasChanges = computed(() => {
  return Object.keys(editedSettings).some(k => editedSettings[k] !== originalSettings[k])
})

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

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await apiCall('GET', '/api/platform-settings')
    const data = res.data || []
    // Clear and populate
    const allKeys = [...orderKeys, ...paymentKeys, ...deliveryKeys, ...systemKeys]
    for (const key of allKeys) {
      const found = data.find(s => s.setting_key === key)
      originalSettings[key] = found?.setting_value || ''
      editedSettings[key] = found?.setting_value || ''
    }
    showMessage('Settings loaded', 'success')
  } catch (e) {
    showMessage('Failed to load settings', 'error')
  } finally {
    loading.value = false
  }
}

const saveAll = async () => {
  loading.value = true
  try {
    const changedSettings = Object.keys(editedSettings)
      .filter(k => editedSettings[k] !== originalSettings[k])
      .map(k => ({ key: k, value: editedSettings[k] }))

    if (changedSettings.length === 0) return

    await apiCall('PUT', '/api/platform-settings/bulk', { settings: changedSettings })

    // Update originals
    for (const { key, value } of changedSettings) {
      originalSettings[key] = value
    }
    showMessage(`${changedSettings.length} setting(s) saved`, 'success')
  } catch (e) {
    showMessage('Failed to save settings', 'error')
  } finally {
    loading.value = false
  }
}

const formatLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const getInputType = (key) => {
  if (key.includes('fee') || key.includes('rate') || key.includes('radius') || key.includes('retries') || key.includes('per_km')) return 'number'
  return 'text'
}
const isDecimal = (key) => key.includes('fee') || key.includes('rate') || key.includes('per_km')
const isBooleanSetting = (key) => key.includes('require_')
const showMessage = (text, type = 'success') => { message.value = { text, type }; setTimeout(() => { message.value = null }, 4000) }

onMounted(() => { fetchSettings() })

definePageMeta({ middleware: ['admin-auth'], layout: 'admin-layout' })
</script>

<style scoped>
.platform-settings-page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
.page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem 0; }
.page-subtitle { color: #6b7280; margin: 0; font-size: 0.925rem; }
.header-actions { display: flex; gap: 0.5rem; }

.setting-section { background: white; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 1.5rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.section-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.section-icon { font-size: 1.75rem; width: 44px; height: 44px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; }
.section-header h3 { font-size: 1.1rem; font-weight: 600; color: #111827; margin: 0 0 0.125rem 0; }
.section-header p { font-size: 0.85rem; color: #6b7280; margin: 0; }

.settings-grid { padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
.setting-item { display: flex; flex-direction: column; gap: 0.375rem; }
.setting-item label { font-size: 0.8rem; font-weight: 600; color: #374151; text-transform: capitalize; }
.setting-original { font-size: 0.7rem; color: #f59e0b; font-style: italic; }

.form-control { padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; width: 100%; transition: all 0.2s; }
.form-control:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }

.btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.875rem; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; background: white; color: #6b7280; border: 1px solid #d1d5db; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.875rem; }
.btn-secondary:hover { background: #f9fafb; }

.message-toast { position: fixed; bottom: 2rem; right: 2rem; background: #10b981; color: white; padding: 0.875rem 1.5rem; border-radius: 10px; font-weight: 600; z-index: 2000; animation: slideUp 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.message-toast.message-error { background: #ef4444; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
