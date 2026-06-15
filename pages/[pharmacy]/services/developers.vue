<template>
  <div class="developers-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Developer API</h1>
        <p class="page-subtitle">Generate API keys to connect your Hospital Management System and read integration docs</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id" :class="['tab-btn', { active: activeTab === t.id }]">
        {{ t.label }}
      </button>
    </div>

    <!-- API Keys Tab -->
    <div v-if="activeTab === 'keys'" class="tab-panel">
      <div class="panel-header">
        <div>
          <h2>API Keys</h2>
          <p>Keys give your HMS access to submit orders directly into your pharmacy queue.</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">+ New Key</button>
      </div>

      <div v-if="loading" class="loading-state">Loading…</div>

      <div v-else-if="keys.length === 0" class="empty-state">
        <p>No API keys yet. Create one to get started.</p>
        <button @click="openCreateModal" class="btn-primary mt-3">Create first key</button>
      </div>

      <div v-else class="table-container">
        <table class="keys-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Last Used</th>
              <th>Expires</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in keys" :key="key.id">
              <td class="key-name">{{ key.key_name }}</td>
              <td class="muted">{{ key.last_used_at ? timeAgo(key.last_used_at) : 'Never' }}</td>
              <td class="muted">{{ key.expires_at ? formatDate(key.expires_at) : 'Never' }}</td>
              <td>
                <span :class="key.is_active ? 'status-active' : 'status-inactive'">
                  {{ key.is_active ? 'Active' : 'Revoked' }}
                </span>
              </td>
              <td>
                <button v-if="key.is_active" @click="confirmRevoke(key)" class="btn-icon danger" title="Revoke">
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Documentation Tab -->
    <div v-if="activeTab === 'docs'" class="tab-panel docs-panel">
      <h2>Integration Guide</h2>
      <p class="docs-intro">
        Your HMS authenticates with an <strong>X-Api-Key</strong> header. All requests go to
        <code>{{ apiBase }}</code>.
      </p>

      <h3>1. Get the product catalog</h3>
      <p>Fetch available products to get the correct <code>productId</code> values. Add <code>?q=</code> to search by brand or generic name — useful for large catalogs.</p>
      <div class="code-tabs">
        <button v-for="lang in codeLangs" :key="lang" @click="docsLang = lang" :class="['code-lang-btn', { active: docsLang === lang }]">{{ lang }}</button>
      </div>
      <pre class="code-block">{{ productSnippet }}</pre>

      <h3>2. Look up a patient (optional but recommended)</h3>
      <p>Before submitting an order, search for the patient in the pharmacy's customer records by phone, email, or name. Supply <strong>one</strong> query parameter — <code>phone</code> is the most reliable.</p>
      <pre class="code-block">{{ customersSnippet }}</pre>
      <p class="docs-step-note">The response returns an array. Take <code>data[0].id</code> — that is the <code>customerId</code> you pass in the next step.</p>
      <pre class="code-block">{{ customersResponseSnippet }}</pre>

      <h3>3. Submit an order</h3>
      <p>POST the order body below. Set <code>customerId</code> to the <code>id</code> returned in step 2 to attach the pharmacy customer record to this order. If the patient has no pharmacy record, omit <code>customerId</code> — the order still goes through using <code>patient.name</code> and <code>patient.phone</code> instead.</p>
      <pre class="code-block">{{ orderSnippet }}</pre>

      <h3>Order body fields</h3>
      <table class="docs-table">
        <thead><tr><th>Field</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>customerId</code></td><td>No</td><td>Pharmacy customer ID from <code>GET /customers</code>. Links this order to the customer's profile and pre-fills their details at the POS.</td></tr>
          <tr><td><code>patient.name</code></td><td>Yes</td><td>Patient's full name. Always shown in the pharmacist's queue regardless of <code>customerId</code>.</td></tr>
          <tr><td><code>patient.phone</code></td><td>No</td><td>Patient's phone number (E.164 format preferred).</td></tr>
          <tr><td><code>patient.hmsId</code></td><td>No</td><td>Your internal HMS patient identifier — stored for cross-reference.</td></tr>
          <tr><td><code>prescriber.name</code></td><td>No</td><td>Prescribing doctor's name — displayed in the prescription panel.</td></tr>
          <tr><td><code>diagnosisCode</code></td><td>No</td><td>ICD-10 or local diagnosis code.</td></tr>
          <tr><td><code>rxNotes</code></td><td>No</td><td>Free-text prescription notes visible to the pharmacist.</td></tr>
          <tr><td><code>items[].productId</code></td><td>Yes</td><td>Product ID from <code>GET /products</code>.</td></tr>
          <tr><td><code>items[].qty</code></td><td>Yes</td><td>Quantity to dispense (minimum 1).</td></tr>
        </tbody>
      </table>

      <h3>Response</h3>
      <pre class="code-block">{{ responseSnippet }}</pre>

      <h3>Order status values</h3>
      <table class="docs-table">
        <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>pending</code></td><td>Awaiting pharmacist review</td></tr>
          <tr><td><code>processing</code></td><td>Pharmacist has loaded it to the POS cart</td></tr>
          <tr><td><code>completed</code></td><td>Dispensed and invoiced</td></tr>
          <tr><td><code>cancelled</code></td><td>Rejected or cancelled</td></tr>
        </tbody>
      </table>

      <p class="docs-support">
        Questions? Contact <a href="mailto:support@medsgh.com">support@medsgh.com</a>
      </p>
    </div>

    <!-- Create Key Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ createdKey ? 'API Key Created' : 'New API Key' }}</h3>
          <button @click="closeCreateModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <template v-if="!createdKey">
            <div class="form-group">
              <label>Key Name</label>
              <input v-model="newKeyName" class="form-control" placeholder="e.g. HMS Production" />
            </div>
            <div class="form-group">
              <label>Expires (optional)</label>
              <input v-model="newKeyExpiry" type="date" class="form-control" />
            </div>
            <p v-if="createError" class="error-msg">{{ createError }}</p>
          </template>

          <template v-else>
            <div class="key-reveal">
              <p class="key-warning">Copy this key now — it will <strong>not</strong> be shown again.</p>
              <div class="key-value-row">
                <code class="key-value">{{ createdKey }}</code>
                <button @click="copyKey" class="btn-secondary btn-sm">{{ copied ? 'Copied!' : 'Copy' }}</button>
              </div>
            </div>
          </template>
        </div>

        <div class="modal-footer">
          <button v-if="!createdKey" @click="closeCreateModal" class="btn-secondary">Cancel</button>
          <button v-if="!createdKey" @click="submitCreateKey" class="btn-primary" :disabled="createLoading || !newKeyName">
            {{ createLoading ? 'Creating…' : 'Create' }}
          </button>
          <button v-else @click="closeCreateModal" class="btn-primary">Done</button>
        </div>
      </div>
    </div>

    <!-- Revoke Confirm Modal -->
    <div v-if="revokeTarget" class="modal-overlay" @click.self="revokeTarget = null">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Revoke Key</h3>
          <button @click="revokeTarget = null" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p>Revoke <strong>{{ revokeTarget.key_name }}</strong>? Any system using this key will lose access immediately.</p>
        </div>
        <div class="modal-footer">
          <button @click="revokeTarget = null" class="btn-secondary">Cancel</button>
          <button @click="executeRevoke" class="btn-danger" :disabled="revokeLoading">
            {{ revokeLoading ? 'Revoking…' : 'Revoke' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" :class="['message-toast', { 'message-error': toast.type === 'error' }]">
      {{ toast.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useRuntimeConfig } from '#app'
import { createHmsIntegrationService } from '~/services/hmsIntegration/hmsIntegrationService'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
})

const api = useApi()
const svc = createHmsIntegrationService(api)
const config = useRuntimeConfig()
const apiBase = computed(() => config.public?.apiBase || 'https://api.medsgh.com')

const tabs = [
  { id: 'keys', label: 'API Keys' },
  { id: 'docs', label: 'Documentation' },
]
const activeTab = ref('keys')

// ── Keys tab ──────────────────────────────────────────────────────────────────
const keys = ref([])
const loading = ref(false)
const toast = ref(null)

const loadKeys = async () => {
  loading.value = true
  try {
    const res = await svc.listKeys()
    keys.value = res.data || []
  } catch {
    showToast('Failed to load API keys', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadKeys)

// Create modal
const showCreateModal = ref(false)
const newKeyName = ref('')
const newKeyExpiry = ref('')
const createLoading = ref(false)
const createError = ref('')
const createdKey = ref('')
const copied = ref(false)

const openCreateModal = () => {
  newKeyName.value = ''
  newKeyExpiry.value = ''
  createError.value = ''
  createdKey.value = ''
  copied.value = false
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  if (createdKey.value) loadKeys()
  createdKey.value = ''
}

const submitCreateKey = async () => {
  if (!newKeyName.value) return
  createLoading.value = true
  createError.value = ''
  try {
    const res = await svc.createKey(newKeyName.value, newKeyExpiry.value || null)
    createdKey.value = res.data?.api_key || ''
  } catch (err) {
    createError.value = err?.message || 'Failed to create key'
  } finally {
    createLoading.value = false
  }
}

const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback: select the text
  }
}

// Revoke modal
const revokeTarget = ref(null)
const revokeLoading = ref(false)

const confirmRevoke = (key) => {
  revokeTarget.value = key
}

const executeRevoke = async () => {
  if (!revokeTarget.value) return
  revokeLoading.value = true
  try {
    await svc.revokeKey(revokeTarget.value.id)
    showToast('API key revoked', 'success')
    revokeTarget.value = null
    await loadKeys()
  } catch {
    showToast('Failed to revoke key', 'error')
  } finally {
    revokeLoading.value = false
  }
}

// ── Docs tab ──────────────────────────────────────────────────────────────────
const codeLangs = ['cURL', 'JavaScript']
const docsLang = ref('cURL')

const productSnippet = computed(() => {
  const base = apiBase.value
  if (docsLang.value === 'cURL') {
    return `# All products
curl -X GET "${base}/api/external/{your-pharmacy-slug}/products" \\
  -H "X-Api-Key: YOUR_API_KEY"

# Search by name (brand or generic)
curl -X GET "${base}/api/external/{your-pharmacy-slug}/products?q=amoxicillin" \\
  -H "X-Api-Key: YOUR_API_KEY"`
  }
  return `// All products
const res = await fetch('${base}/api/external/{your-pharmacy-slug}/products', {
  headers: { 'X-Api-Key': 'YOUR_API_KEY' }
})

// Search by name (brand or generic)
const res = await fetch('${base}/api/external/{your-pharmacy-slug}/products?q=amoxicillin', {
  headers: { 'X-Api-Key': 'YOUR_API_KEY' }
})

const { data } = await res.json()
// data → [{ id, name, generic_name, unit, price, stock_qty }, ...]`
})

const customersSnippet = computed(() => {
  const base = apiBase.value
  if (docsLang.value === 'cURL') {
    return `curl -X GET "${base}/api/external/{your-pharmacy-slug}/customers?phone=%2B233240000000" \\
  -H "X-Api-Key: YOUR_API_KEY"
# Also supports: ?email=patient@example.com  or  ?name=Kofi`
  }
  return `const res = await fetch(
  '${base}/api/external/{your-pharmacy-slug}/customers?phone=%2B233240000000',
  { headers: { 'X-Api-Key': 'YOUR_API_KEY' } }
)
const { data } = await res.json()
// data → [{ id: "abc123", fname: "Kofi", lname: "Mensah", phone: "+233240000000", ... }]`
})

const customersResponseSnippet = `{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "abc123",          ← pass this as customerId in your order
      "fname": "Kofi",
      "lname": "Mensah",
      "phone": "+233240000000",
      "email": "kofi@example.com",
      "customer_type": "retail",
      "is_active": true
    }
  ]
}`

const orderSnippet = computed(() => {
  const base = apiBase.value
  const body = JSON.stringify({
    customerId: 'abc123',
    patient: { name: 'Kofi Mensah', phone: '+233240000000', hmsId: 'HMS-1234' },
    prescriber: { name: 'Dr. Ama Owusu' },
    diagnosisCode: 'J06.9',
    rxNotes: 'Take with food',
    items: [{ productId: '42', qty: 2 }],
  }, null, 2)
  if (docsLang.value === 'cURL') {
    return `curl -X POST "${base}/api/external/{your-pharmacy-slug}/orders" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`
  }
  return `const res = await fetch('${base}/api/external/{your-pharmacy-slug}/orders', {
  method: 'POST',
  headers: { 'X-Api-Key': 'YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify(${body}),
})
const { data } = await res.json()  // { order_id: "..." }`
})

const responseSnippet = `{
  "success": true,
  "data": {
    "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}`

// ── Helpers ───────────────────────────────────────────────────────────────────
let toastTimer = null
const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3500)
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>

<style scoped>
.developers-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.tabs-bar {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  border-radius: 4px 4px 0 0;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.tab-panel {
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; } }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.panel-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
}

.panel-header p {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-primary:hover { background: #4338ca; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover { background: #e5e7eb; }

.btn-sm { padding: 4px 10px; font-size: 0.8rem; }

.btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.btn-icon.danger { color: #dc2626; }
.btn-icon.danger:hover { background: #fef2f2; }

.mt-3 { margin-top: 12px; }

/* Table */
.table-container { overflow-x: auto; }

.keys-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.keys-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.keys-table td {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
}

.key-name { font-weight: 500; }
.muted { color: #9ca3af; }

.status-active { color: #059669; font-weight: 600; }
.status-inactive { color: #9ca3af; }

/* States */
.loading-state, .empty-state {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 440px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.modal-sm { width: 360px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-header h3 { font-size: 1rem; font-weight: 600; color: #111827; margin: 0; }

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-body { padding: 20px 24px; }
.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 24px 20px;
}

/* Form */
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px; }

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  box-sizing: border-box;
}

.form-control:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.15); }

.error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 8px; }

/* Key reveal */
.key-warning {
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #713f12;
  margin-bottom: 14px;
}

.key-value-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.key-value {
  flex: 1;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  word-break: break-all;
  color: #1f2937;
  font-family: monospace;
}

/* Docs */
.docs-panel h2 { font-size: 1.1rem; font-weight: 600; color: #111827; margin-bottom: 8px; }
.docs-panel h3 { font-size: 0.95rem; font-weight: 600; color: #111827; margin: 24px 0 8px; }
.docs-intro { color: #6b7280; font-size: 0.9rem; margin-bottom: 20px; }
.docs-step-note {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  padding: 8px 14px;
  font-size: 0.85rem;
  color: #1e40af;
  border-radius: 0 6px 6px 0;
  margin: 10px 0;
}
.docs-support { margin-top: 32px; color: #6b7280; font-size: 0.85rem; }

code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: monospace;
  color: #1f2937;
}

.code-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.code-lang-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.code-lang-btn.active {
  background: #1f2937;
  border-color: #1f2937;
  color: #f9fafb;
}

.code-block {
  background: #1f2937;
  color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  margin: 0;
  line-height: 1.6;
}

.docs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin-top: 8px;
}

.docs-table th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.docs-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

/* Toast */
.message-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #059669;
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.message-error { background: #dc2626; }
</style>
