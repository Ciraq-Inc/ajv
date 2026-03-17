<template>
  <div class="platform-settings-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Settings</h1>
        <p class="page-subtitle">Configure request flow, payment keys, delivery, and system behavior</p>
      </div>
      <div class="header-actions">
        <button @click="fetchSettings" class="btn-secondary" :disabled="loading">
          Refresh
        </button>
        <button @click="saveAll" class="btn-primary" :disabled="loading || !hasChanges">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <div class="settings-sections">
      <div
        v-for="section in sections"
        :key="section.id"
        class="setting-section"
      >
        <div class="section-header">
          <div class="section-badge">{{ section.short }}</div>
          <div>
            <h3>{{ section.title }}</h3>
            <p>{{ section.description }}</p>
          </div>
        </div>
        <div class="settings-grid">
          <div
            v-for="setting in section.settings"
            :key="setting.key"
            class="setting-item"
          >
            <label>{{ setting.label }}</label>

            <select
              v-if="setting.type === 'boolean'"
              v-model="editedSettings[setting.key]"
              class="form-control"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <input
              v-else
              v-model="editedSettings[setting.key]"
              :type="setting.inputType"
              class="form-control"
              :step="setting.step || '1'"
            />

            <span class="setting-help">{{ setting.help }}</span>
            <span class="setting-original" v-if="editedSettings[setting.key] !== originalSettings[setting.key]">
              Was: {{ originalSettings[setting.key] }}
            </span>
          </div>
        </div>
      </div>
    </div>

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

const sections = [
  {
    id: 'order',
    short: 'OPS',
    title: 'Order Processing',
    description: 'Request fees, markup, sourcing retries, radius, and timing controls',
    settings: [
      {
        key: 'request_submission_fee',
        label: 'Request Submission Fee (GHS)',
        help: 'Fee charged when the customer submits a request',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '5.00'
      },
      {
        key: 'order_markup_rate',
        label: 'Order Markup Rate',
        help: 'Markup applied on sourced pharmacy prices (e.g., 0.15 = 15%)',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '0.15'
      },
      {
        key: 'min_order_amount',
        label: 'Minimum Order Amount (GHS)',
        help: 'Minimum checkout amount allowed for an order',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '5.00'
      },
      {
        key: 'max_pharmacy_retries',
        label: 'Max Pharmacy Retries',
        help: 'Maximum number of pharmacies to try before giving up',
        type: 'number',
        inputType: 'number',
        defaultValue: '3'
      },
      {
        key: 'max_pharmacy_search_radius_km',
        label: 'Max Pharmacy Search Radius (km)',
        help: 'Maximum sourcing radius in kilometers',
        type: 'number',
        inputType: 'number',
        defaultValue: '10'
      },
      {
        key: 'pharmacy_response_timeout_minutes',
        label: 'Pharmacy Response Timeout (minutes)',
        help: 'Timeout before a pending pharmacy contact is marked as timed out',
        type: 'number',
        inputType: 'number',
        defaultValue: '15'
      },
      {
        key: 'request_no_response_refund_minutes',
        label: 'No-Response Refund Delay (minutes)',
        help: 'Minutes before request fee is refunded if no pharmacy responds',
        type: 'number',
        inputType: 'number',
        defaultValue: '120'
      },
      {
        key: 'max_delivery_stops_for_single_driver',
        label: 'Max Stops For Single Driver',
        help: 'Above this pickup-stop count, delivery should be handled manually',
        type: 'number',
        inputType: 'number',
        defaultValue: '2'
      }
    ]
  },
  {
    id: 'payment',
    short: 'PAY',
    title: 'Wallet and Payments',
    description: 'Keys used for customer wallet top-up and verification',
    settings: [
      {
        key: 'paystack_public_key',
        label: 'Paystack Public Key',
        help: 'Client-side key used for Paystack initialization',
        type: 'string',
        inputType: 'text',
        defaultValue: ''
      },
      {
        key: 'paystack_secret_key',
        label: 'Paystack Secret Key',
        help: 'Server-side key used for transaction verification',
        type: 'string',
        inputType: 'password',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'delivery',
    short: 'LOG',
    title: 'Delivery and Routing',
    description: 'Distance-based pricing and route service integration',
    settings: [
      {
        key: 'delivery_fee_per_km',
        label: 'Delivery Fee Per KM (GHS)',
        help: 'Per-kilometer delivery charge',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '2.00'
      },
      {
        key: 'openrouteservice_api_key',
        label: 'OpenRouteService API Key',
        help: 'Required for distance and route calculations',
        type: 'string',
        inputType: 'text',
        defaultValue: ''
      }
    ]
  },
  // {
  //   id: 'system',
  //   short: 'SYS',
  //   title: 'System',
  //   description: 'General platform access behavior',
  //   settings: [
  //     {
  //       key: 'require_login_to_browse',
  //       label: 'Require Login To Browse',
  //       help: 'If enabled, browsing customer pages requires authentication',
  //       type: 'boolean',
  //       inputType: 'text',
  //       defaultValue: 'false'
  //     }
  //   ]
  // }
]

const allSettings = computed(() => sections.flatMap((section) => section.settings))

const hasChanges = computed(() => {
  return allSettings.value.some((setting) => editedSettings[setting.key] !== originalSettings[setting.key])
})

const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 4500)
}

const apiCall = async (method, url, data = null) => {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminStore.token}`
    }
  }
  if (data) opts.body = JSON.stringify(data)

  const response = await fetch(`${apiBaseUrl}${url}`, opts)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `API error: ${response.status}`)
  }
  return payload
}

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await apiCall('GET', '/api/platform-settings')
    const current = Array.isArray(res.data) ? res.data : []

    for (const setting of allSettings.value) {
      const found = current.find((row) => row.setting_key === setting.key)
      const value = found?.setting_value ?? setting.defaultValue
      originalSettings[setting.key] = found?.setting_value ?? ''
      editedSettings[setting.key] = value
    }

    showMessage('Settings loaded')
  } catch (error) {
    showMessage(error.message || 'Failed to load settings', 'error')
  } finally {
    loading.value = false
  }
}

const saveAll = async () => {
  loading.value = true
  try {
    const changedSettings = allSettings.value
      .filter((setting) => editedSettings[setting.key] !== originalSettings[setting.key])
      .map((setting) => ({ key: setting.key, value: editedSettings[setting.key] }))

    if (changedSettings.length === 0) {
      showMessage('No changes to save')
      return
    }

    await apiCall('PUT', '/api/platform-settings/bulk', { settings: changedSettings })

    for (const { key, value } of changedSettings) {
      originalSettings[key] = value
    }

    showMessage(`${changedSettings.length} setting(s) saved`)
  } catch (error) {
    showMessage(error.message || 'Failed to save settings', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchSettings)

definePageMeta({ middleware: ['admin-auth'], layout: 'admin-layout' })
</script>

<style scoped>
.platform-settings-page {
  max-width: 1080px;
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

.setting-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.section-badge {
  min-width: 44px;
  height: 32px;
  border-radius: 8px;
  background: #e5edff;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.section-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #111827;
}

.section-header p {
  margin: 0.2rem 0 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.settings-grid {
  padding: 1rem 1.25rem 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.setting-item label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #111827;
}

.setting-help {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.3;
}

.setting-original {
  font-size: 0.72rem;
  color: #d97706;
}

.form-control {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 100%;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.btn-primary,
.btn-secondary {
  padding: 0.58rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.message-toast {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  background: #16a34a;
  color: #fff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 1200;
}

.message-toast.message-error {
  background: #dc2626;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
  }
}
</style>
