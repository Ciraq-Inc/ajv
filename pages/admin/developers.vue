<template>
  <div class="admin-developers">
    <div class="page-header">
      <div>
        <h1 class="page-title">Developer API</h1>
        <p class="page-subtitle">Manage API keys for rigel apps, explore docs, and test endpoints</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id" :class="['tab-btn', { active: activeTab === t.id }]">
        <Icon :name="t.icon" size="15" /> {{ t.label }}
      </button>
    </div>

    <!-- ── API Keys Tab ───────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'keys'" class="tab-panel">
      <div class="panel-header">
        <div>
          <h2>API Keys</h2>
          <p>Keys are company-scoped. Select a pharmacy, then create keys for rigel apps that operate on its behalf.</p>
        </div>
      </div>

      <!-- Company selector -->
      <div class="company-selector-card">
        <label class="selector-label">Pharmacy</label>
        <div class="selector-row">
          <input v-model="companySearch" @input="searchCompanies" class="form-control" placeholder="Search by name or domain…" />
        </div>
        <div v-if="searchResults.length" class="search-results">
          <button v-for="c in searchResults" :key="c.id" @click="selectCompany(c)"
            :class="['result-item', { selected: selectedCompany?.id === c.id }]">
            <strong>{{ c.name }}</strong>
            <span class="result-domain">{{ c.domain_name }}</span>
          </button>
        </div>
        <div v-if="selectedCompany" class="selected-chip">
          <Icon name="CheckCircle" size="14" class="chip-icon" />
          {{ selectedCompany.name }}
          <span class="chip-domain">{{ selectedCompany.domain_name }}</span>
          <button @click="clearCompany" class="chip-clear"><Icon name="X" size="13" /></button>
        </div>
      </div>

      <template v-if="selectedCompany">
        <!-- Usage pills -->
        <div v-if="usage.summary.length" class="usage-pills">
          <div v-for="row in usage.summary.slice(0, 4)" :key="row.endpoint" class="usage-pill">
            <span :class="`pill-method method-${row.method.toLowerCase()}`">{{ row.method }}</span>
            <span class="pill-endpoint">{{ row.endpoint }}</span>
            <span class="pill-count">{{ row.total_requests }}</span>
          </div>
        </div>

        <div class="keys-header">
          <h3 class="keys-subtitle">Keys for {{ selectedCompany.name }}</h3>
          <button @click="openCreateKey('company')" class="btn-primary"><Icon name="Plus" size="15" /> New Key</button>
        </div>

        <div class="table-container" v-if="!keysLoading">
          <table v-if="apiKeys.length" class="keys-table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Scopes</th><th>Tier</th><th>Last Used</th><th>Expires</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="key in apiKeys" :key="key.id">
                <td class="key-name">{{ key.key_name }}<br /><span class="key-desc">{{ key.description }}</span></td>
                <td>
                  <span v-if="(key as any).is_platform_key" class="platform-badge">Platform</span>
                  <span v-else class="company-type-badge">Company</span>
                </td>
                <td>
                  <div class="scopes-wrap">
                    <span v-if="!key.scopes" class="scope-tag all">All access</span>
                    <span v-for="s in (key.scopes || [])" :key="s" class="scope-tag">{{ s }}</span>
                  </div>
                </td>
                <td><span :class="`tier-badge tier-${key.rate_limit_tier}`">{{ key.rate_limit_tier }}</span></td>
                <td class="muted">{{ key.last_used_at ? timeAgo(key.last_used_at) : 'Never' }}</td>
                <td class="muted">{{ key.expires_at ? formatDate(key.expires_at) : '—' }}</td>
                <td><span :class="key.is_active ? 'status-active' : 'status-inactive'">{{ key.is_active ? 'Active' : 'Revoked' }}</span></td>
                <td>
                  <button v-if="key.is_active" @click="revokeKey(key)" class="btn-icon danger" title="Revoke">
                    <Icon name="Trash2" size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <Icon name="Key" size="36" />
            <p>No keys for this pharmacy</p>
            <button @click="openCreateKey" class="btn-primary mt-3">Create first key</button>
          </div>
        </div>
        <div v-else class="loading-state"><Icon name="Loader2" size="26" class="animate-spin" /></div>
      </template>
      <div v-else>
        <div class="keys-header" style="margin-top:1.5rem">
          <div>
            <h3 class="keys-subtitle">Platform Keys</h3>
            <p class="keys-hint">Cross-pharmacy keys with access to all companies.</p>
          </div>
          <button @click="openCreateKey('platform')" class="btn-primary">
            <Icon name="Globe" size="15" /> New Platform Key
          </button>
        </div>
        <div class="table-container" v-if="!platformKeysLoading">
          <table v-if="platformKeys.length" class="keys-table">
            <thead>
              <tr><th>Name</th><th>Scopes</th><th>Tier</th><th>Last Used</th><th>Expires</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="key in platformKeys" :key="key.id">
                <td class="key-name">{{ key.key_name }}<br /><span class="key-desc">{{ key.description }}</span></td>
                <td>
                  <div class="scopes-wrap">
                    <span v-if="!key.scopes" class="scope-tag all">All access</span>
                    <span v-for="s in (key.scopes || [])" :key="s" class="scope-tag">{{ s }}</span>
                  </div>
                </td>
                <td><span :class="`tier-badge tier-${key.rate_limit_tier}`">{{ key.rate_limit_tier }}</span></td>
                <td class="muted">{{ key.last_used_at ? timeAgo(key.last_used_at) : 'Never' }}</td>
                <td class="muted">{{ key.expires_at ? formatDate(key.expires_at) : '—' }}</td>
                <td><span :class="key.is_active ? 'status-active' : 'status-inactive'">{{ key.is_active ? 'Active' : 'Revoked' }}</span></td>
                <td>
                  <button v-if="key.is_active" @click="revokePlatformKey(key)" class="btn-icon danger" title="Revoke">
                    <Icon name="Trash2" size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <Icon name="Globe" size="36" />
            <p>No platform keys yet. Select a pharmacy above to manage company-scoped keys.</p>
            <button @click="openCreateKey('platform')" class="btn-primary mt-3">Create first platform key</button>
          </div>
        </div>
        <div v-else class="loading-state"><Icon name="Loader2" size="26" class="animate-spin" /></div>
      </div>
    </div>

    <!-- ── Documentation Tab ─────────────────────────────────────────────── -->
    <div v-if="activeTab === 'docs'" class="tab-panel">
      <div class="panel-header">
        <div>
          <h2>API Reference</h2>
          <p>Base URL: <code>{{ apiBase }}/api/v1</code> — all requests require <code>x-api-key</code> header.</p>
        </div>
      </div>
      <div class="doc-groups">
        <div v-for="group in docGroups" :key="group.scope" class="doc-group">
          <button @click="toggleGroup(group.scope)" class="group-header">
            <div class="group-title">
              <span class="scope-tag">{{ group.scope }}</span>
              <span class="group-name">{{ group.name }}</span>
            </div>
            <Icon :name="openGroups.has(group.scope) ? 'ChevronUp' : 'ChevronDown'" size="17" />
          </button>
          <div v-if="openGroups.has(group.scope)" class="group-body">
            <p class="group-desc">{{ group.description }}</p>
            <div v-for="ep in group.endpoints" :key="ep.method + ep.path" class="endpoint">
              <div class="ep-title">
                <span :class="`method-badge method-${ep.method.toLowerCase()}`">{{ ep.method }}</span>
                <code class="ep-path">{{ ep.path }}</code>
                <span class="ep-desc">{{ ep.description }}</span>
              </div>
              <div v-if="ep.body" class="ep-section">
                <div class="ep-label">Request body</div>
                <pre class="code-block">{{ ep.body }}</pre>
              </div>
              <div v-if="ep.response" class="ep-section">
                <div class="ep-label">Response</div>
                <pre class="code-block">{{ ep.response }}</pre>
              </div>
              <div class="ep-section">
                <div class="ep-label">cURL</div>
                <div class="curl-block">
                  <pre>{{ buildCurl(ep) }}</pre>
                  <button @click="copyText(buildCurl(ep))" class="copy-btn"><Icon name="Copy" size="13" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Test Console Tab ──────────────────────────────────────────────── -->
    <div v-if="activeTab === 'test'" class="tab-panel">
      <div class="panel-header"><div><h2>Test Console</h2><p>Send live API requests using any key.</p></div></div>
      <div class="console-layout">
        <div class="console-request">
          <div class="form-group">
            <label>API Key (paste plaintext)</label>
            <input v-model="console_.apiKey" class="form-control font-mono" placeholder="Paste key value…" />
          </div>
          <div class="form-group">
            <label>Endpoint</label>
            <select v-model="console_.endpointKey" class="form-control" @change="onEndpointSelect">
              <option value="">Choose…</option>
              <optgroup v-for="g in docGroups" :key="g.scope" :label="g.name">
                <option v-for="ep in g.endpoints" :key="g.scope+ep.method+ep.path" :value="`${ep.method}::${ep.path}`">
                  {{ ep.method }} {{ ep.path }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="form-group">
            <label>Body (JSON)</label>
            <textarea v-model="console_.body" class="form-control font-mono" rows="7" placeholder='{ }' />
          </div>
          <button @click="sendRequest" class="btn-primary w-full" :disabled="console_.loading || !console_.apiKey || !console_.endpointKey">
            <Icon v-if="console_.loading" name="Loader2" size="15" class="animate-spin" />
            {{ console_.loading ? 'Sending…' : 'Send Request' }}
          </button>
        </div>
        <div class="console-response">
          <div class="response-header">
            <span>Response</span>
            <span v-if="console_.responseStatus" :class="`status-pill status-${statusClass(console_.responseStatus)}`">{{ console_.responseStatus }}</span>
            <span v-if="console_.latency" class="latency-pill">{{ console_.latency }}ms</span>
          </div>
          <div v-if="console_.response" class="response-body"><pre>{{ console_.response }}</pre></div>
          <div v-else class="response-empty">Response will appear here</div>
        </div>
      </div>
    </div>

    <!-- Create Key Modal -->
    <div v-if="showKeyModal" class="modal-overlay" @click.self="showKeyModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ keyType === 'platform' ? 'New Platform Key' : 'New Company Key' }}</h3>
          <small v-if="keyType === 'company' && selectedCompany" class="modal-company">{{ selectedCompany.name }}</small>
          <small v-if="keyType === 'platform'" class="modal-company platform-label">Cross-pharmacy access</small>
          <button @click="showKeyModal = false" class="modal-close"><Icon name="X" size="18" /></button>
        </div>
        <div class="modal-body">
          <div v-if="createdKey" class="created-key-box">
            <p class="created-key-label">Store this key securely — shown only once.</p>
            <div class="created-key-display">
              <code>{{ createdKey }}</code>
              <button @click="copyText(createdKey)" class="copy-btn-inline"><Icon name="Copy" size="15" /> Copy</button>
            </div>
            <button @click="showKeyModal = false; keyType === 'platform' ? loadPlatformKeys() : loadKeys()" class="btn-primary w-full mt-3">Done</button>
          </div>
          <template v-else>
            <div class="form-group"><label>Name <span class="req">*</span></label><input v-model="keyForm.key_name" class="form-control" placeholder="e.g. Loyalty App Production" /></div>
            <div class="form-group"><label>Description</label><input v-model="keyForm.description" class="form-control" placeholder="What is this key for?" /></div>
            <div class="form-group">
              <label>Scopes</label>
              <div class="scope-checkboxes">
                <label v-for="s in allScopes" :key="s.value" class="scope-check">
                  <input type="checkbox" :value="s.value" v-model="keyForm.scopes" />
                  <span class="scope-check-label">
                    <span class="scope-tag">{{ s.value }}</span>
                    <span class="scope-check-desc">{{ s.label }}</span>
                  </span>
                </label>
              </div>
              <p class="field-hint">Leave blank for full access</p>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Tier</label>
                <select v-model="keyForm.rate_limit_tier" class="form-control">
                  <option value="free">Free (60 req/min)</option>
                  <option value="premium">Premium (600 req/min)</option>
                  <option value="enterprise">Enterprise (6000 req/min)</option>
                </select>
              </div>
              <div class="form-group"><label>Expires</label><input v-model="keyForm.expires_at" type="date" class="form-control" /></div>
            </div>
            <p v-if="keyError" class="error-msg">{{ keyError }}</p>
          </template>
        </div>
        <div v-if="!createdKey" class="modal-footer">
          <button @click="showKeyModal = false" class="btn-secondary">Cancel</button>
          <button @click="submitKey" class="btn-primary" :disabled="keyLoading || !keyForm.key_name">
            <Icon v-if="keyLoading" name="Loader2" size="15" class="animate-spin" />
            {{ keyLoading ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" :class="`message-toast ${toast.type === 'error' ? 'message-error' : ''}`">
      <Icon :name="toast.type === 'error' ? 'AlertCircle' : 'CheckCircle'" size="15" />{{ toast.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useRuntimeConfig } from '#app'
import { createDeveloperPortalService } from '~/services/developerPortal/developerPortalService'
import type { ApiKey } from '~/services/developerPortal/developerPortalService'

definePageMeta({ layout: 'admin-layout', middleware: ['admin-auth'] })

const api = useApi()
const svc = createDeveloperPortalService(api)
const config = useRuntimeConfig()
const apiBase = computed(() => (config.public as any).apiBase || '')

const tabs = [
  { id: 'keys', label: 'API Keys', icon: 'Key' },
  { id: 'docs', label: 'Documentation', icon: 'BookOpen' },
  { id: 'test', label: 'Test Console', icon: 'Terminal' },
]
const activeTab = ref('keys')

// Company selector
const companySearch = ref('')
const searchResults = ref<any[]>([])
const selectedCompany = ref<any>(null)

const searchCompanies = async () => {
  if (companySearch.value.length < 2) { searchResults.value = []; return }
  try {
    const res = await api.get<any[]>(`/api/companies/search?q=${encodeURIComponent(companySearch.value)}`)
    searchResults.value = res.success ? (res.data as any[]).slice(0, 8) : []
  } catch { searchResults.value = [] }
}

const selectCompany = (c: any) => {
  selectedCompany.value = c
  companySearch.value = c.name
  searchResults.value = []
  loadKeys()
}

const clearCompany = () => {
  selectedCompany.value = null
  companySearch.value = ''
  apiKeys.value = []
}

// Keys
const apiKeys = ref<ApiKey[]>([])
const keysLoading = ref(false)
const usage = ref<{ summary: any[]; timeline: any[] }>({ summary: [], timeline: [] })

const loadKeys = async () => {
  if (!selectedCompany.value) return
  keysLoading.value = true
  try {
    const [keysRes, usageRes] = await Promise.all([
      svc.listKeys(selectedCompany.value.id),
      svc.getUsage(selectedCompany.value.id, { days: 7 }),
    ])
    if (keysRes.success) apiKeys.value = keysRes.data as ApiKey[]
    if (usageRes.success) usage.value = usageRes.data as any
  } finally { keysLoading.value = false }
}

const revokeKey = async (key: ApiKey) => {
  if (!selectedCompany.value) return
  if (!confirm(`Revoke "${key.key_name}"? Cannot be undone.`)) return
  try {
    await svc.revokeKey(selectedCompany.value.id, key.id)
    showToast(`${key.key_name} revoked`)
    await loadKeys()
  } catch (e: any) { showToast(e?.message || 'Failed', 'error') }
}

// Platform keys
const platformKeys = ref<ApiKey[]>([])
const platformKeysLoading = ref(false)

const loadPlatformKeys = async () => {
  platformKeysLoading.value = true
  try {
    const res = await svc.listPlatformKeys()
    if (res.success) platformKeys.value = res.data as ApiKey[]
  } finally { platformKeysLoading.value = false }
}

const revokePlatformKey = async (key: ApiKey) => {
  if (!confirm(`Revoke "${key.key_name}"? Cannot be undone.`)) return
  try {
    await svc.revokePlatformKey(key.id)
    showToast(`${key.key_name} revoked`)
    await loadPlatformKeys()
  } catch (e: any) { showToast(e?.message || 'Failed', 'error') }
}

onMounted(loadPlatformKeys)

// Create key modal
const showKeyModal = ref(false)
const keyLoading = ref(false)
const keyError = ref('')
const createdKey = ref('')
const defaultKeyForm = () => ({ key_name: '', description: '', scopes: [] as string[], rate_limit_tier: 'free', expires_at: '' })
const keyForm = ref(defaultKeyForm())

const allScopes = [
  { value: 'company_auth',  label: 'Company auth' },
  { value: 'customer_auth', label: 'Customer auth' },
  { value: 'sms',           label: 'SMS' },
  { value: 'wallets',       label: 'Wallets' },
  { value: 'discounts',     label: 'Discounts' },
  { value: 'companies',     label: 'Company / pharmacy directory' },
  { value: 'company_users', label: 'Company staff lookup (multi-tenant)' },
  { value: 'support_tickets', label: 'Support tickets' },
]

// keyType: 'company' uses selectedCompany; 'platform' creates a cross-pharmacy key
const keyType = ref<'company' | 'platform'>('company')

const openCreateKey = (type: 'company' | 'platform' = 'company') => {
  keyForm.value = defaultKeyForm(); keyError.value = ''; createdKey.value = ''
  keyType.value = type
  showKeyModal.value = true
}

const submitKey = async () => {
  keyLoading.value = true; keyError.value = ''
  try {
    let res: any
    const payload = {
      key_name:        keyForm.value.key_name,
      description:     keyForm.value.description || null,
      scopes:          keyForm.value.scopes.length ? keyForm.value.scopes : null,
      rate_limit_tier: keyForm.value.rate_limit_tier,
      expires_at:      keyForm.value.expires_at || null,
    }
    if (keyType.value === 'platform') {
      // Platform key — call admin endpoint with no company_id
      res = await api.post('/api/admin/api-keys', { ...payload, company_id: null })
    } else {
      if (!selectedCompany.value) { keyError.value = 'Select a pharmacy first'; keyLoading.value = false; return }
      res = await svc.createKey(selectedCompany.value.id, payload)
    }
    if (!res.success) { keyError.value = res.message || 'Failed'; return }
    createdKey.value = (res.data as any).api_key
  } catch (e: any) { keyError.value = e?.message || 'Failed' } finally { keyLoading.value = false }
}

// Docs
const openGroups = ref(new Set<string>(['sms']))
const toggleGroup = (s: string) => { if (openGroups.value.has(s)) openGroups.value.delete(s); else openGroups.value.add(s) }

const docGroups = computed(() => [
  { scope: 'company_auth', name: 'Company Auth', description: 'Authenticate pharmacy staff. Scoped to the API key\'s company.',
    endpoints: [
      { method: 'POST', path: '/api/v1/company-auth/login', description: 'Login, get JWT + refresh token',
        body: '{\n  "phone": "+233201234567",\n  "password": "yourpassword"\n}',
        response: '{ "success": true, "data": { "user": {...}, "company": {...}, "token": "<JWT>", "refresh_token": "..." } }' },
      { method: 'POST', path: '/api/v1/company-auth/check-phone', description: 'Check if phone is registered',
        body: '{ "phone": "+233201234567" }', response: '{ "success": true, "data": { "status": "registered|setup_required|not_found" } }' },
      { method: 'POST', path: '/api/v1/company-auth/send-otp', description: 'Send OTP',
        body: '{ "phone": "+233201234567" }', response: '{ "success": true }' },
      { method: 'POST', path: '/api/v1/company-auth/signup', description: 'Create company + first admin',
        body: '{\n  "recruiterName": "Jane Doe",\n  "companyName": "Pharmacy Ltd",\n  "phone": "+233201234567",\n  "password": "securepass123",\n  "domain": "pharmacy-ltd"\n}', response: '{ "success": true, "data": { ... } }' },
    ]},
  { scope: 'customer_auth', name: 'Customer Auth', description: 'Register and authenticate end-customers.',
    endpoints: [
      { method: 'POST', path: '/api/v1/customer-auth/check-phone', description: 'Check phone status',
        body: '{ "phone": "+233201234567" }', response: '{ "success": true, "data": { "status": "new_customer|registered|existing_customer_no_password" } }' },
      { method: 'POST', path: '/api/v1/customer-auth/register', description: 'Register customer',
        body: '{\n  "fname": "John", "lname": "Doe",\n  "phone": "+233201234567",\n  "password": "securepass123",\n  "otp": "123456"\n}',
        response: '{ "success": true, "data": { "master_customer": {...}, "token": "<JWT>", "refresh_token": "..." } }' },
      { method: 'POST', path: '/api/v1/customer-auth/login', description: 'Login customer',
        body: '{ "phone": "+233201234567", "password": "securepass123" }',
        response: '{ "success": true, "data": { "master_customer": {...}, "token": "<JWT>" } }' },
    ]},
  { scope: 'sms', name: 'SMS', description: 'Send SMS through rigel\'s multi-provider gateway (Nalo, MNotify, Twilio). Platform keys must include company_id in the request body.',
    endpoints: [
      { method: 'POST', path: '/api/v1/sms/send', description: 'Send single SMS. Platform keys require company_id.',
        body: '{\n  "to": "+233201234567",\n  "message": "Your order is ready!",\n  "company_id": 5\n}',
        response: '{ "success": true, "data": { "message_id": "...", "to": "+233201234567" } }' },
      { method: 'GET', path: '/api/v1/sms/balance?company_id=5', description: 'SMS credit balance. Platform keys pass company_id as query param.',
        response: '{ "success": true, "data": { "balance": 450, "unit": "credits" } }' },
      { method: 'GET', path: '/api/v1/sms/history?company_id=5&limit=20', description: 'Send history. Platform keys pass company_id as query param.',
        response: '{ "success": true, "count": 20, "data": [...] }' },
    ]},
  { scope: 'wallets', name: 'Wallets', description: 'Read balances and top up via Paystack.',
    endpoints: [
      { method: 'GET', path: '/api/v1/wallets/customer/:customerId', description: 'Customer balance',
        response: '{ "success": true, "data": { "balance": 25.00, "total_topped_up": 100.00 } }' },
      { method: 'POST', path: '/api/v1/wallets/customer/:customerId/topup', description: 'Initiate top-up',
        body: '{ "amount": 50, "callback_url": "https://yourapp.com/verify" }',
        response: '{ "success": true, "data": { "authorization_url": "https://checkout.paystack.com/...", "reference": "pay_xxx" } }' },
      { method: 'GET', path: '/api/v1/wallets/company', description: 'Company wallet',
        response: '{ "success": true, "data": { "balance": 120.50, "total_earned": 500.00 } }' },
    ]},
  { scope: 'discounts', name: 'Discounts', description: 'Create, validate, and redeem promotional codes. Validate is non-consuming — call it when the user enters a code. Redeem is consuming — call it once the order is confirmed. Platform keys can manage global codes (company_id = null) or target any pharmacy.',
    endpoints: [
      { method: 'POST', path: '/api/v1/discounts/validate', description: 'Check a code without consuming it. Returns code_id and calculated_discount for use in the redeem call. For platform keys, pass company_id.',
        body: '{\n  "code": "SAVE10",\n  "company_id": 5,\n  "order_amount": 50,\n  "customer_id": "uuid"\n}',
        response: '{ "success": true, "data": { "valid": true, "code_id": 12, "discount_type": "percentage", "discount_value": 10, "calculated_discount": 5.00, "free_shipping": false } }' },
      { method: 'POST', path: '/api/v1/discounts/redeem', description: 'Consume a code after the order is confirmed. Pass code (string) or code_id (numeric ID from /validate). Idempotent per order_id — safe to retry.',
        body: '{\n  "code": "WELCOME1GNU1R",\n  "order_id": "ORD-001",\n  "customer_id": "uuid",\n  "discount_amount": 5.00,\n  "company_id": 5\n}',
        response: '{ "success": true, "data": { "applied": true } }' },
      { method: 'POST', path: '/api/v1/discounts', description: 'Create a single code. Omit company_id for a global code. audience: "all"|"customer"|"pharmacy". allowed_pharmacy_ids restricts a global code to specific pharmacies.',
        body: '{\n  "code": "WELCOME20",\n  "discount_type": "percentage",\n  "discount_value": 20,\n  "max_uses": 100,\n  "audience": "customer",\n  "allowed_pharmacy_ids": [5, 12]\n}',
        response: '{ "success": true, "data": { "id": 1, "code": "WELCOME20", "audience": "customer", "status": "active" } }' },
      { method: 'GET', path: '/api/v1/discounts', description: 'List codes for a company. Platform keys see company + global codes.',
        response: '{ "success": true, "count": 3, "data": [{ "id": 1, "code": "WELCOME20", "status": "active", "times_used": 4, ... }] }' },
      { method: 'PUT', path: '/api/v1/discounts/:id', description: 'Update is_active, valid_until, max_uses, or description.',
        body: '{ "is_active": false }',
        response: '{ "success": true, "data": { "id": 1, "is_active": false, ... } }' },
      { method: 'DELETE', path: '/api/v1/discounts/:id', description: 'Deactivate a code.',
        response: '{ "success": true, "message": "Discount code deactivated" }' },
    ]},
  { scope: 'companies', name: 'Companies', description: 'Search and read the pharmacy directory. Platform keys only.',
    endpoints: [
      { method: 'GET', path: '/api/v1/companies', description: 'Paginated list of all pharmacies. Optional ?type= filter.',
        response: '{ "success": true, "count": 50, "data": [{ "id": 5, "name": "Clifton Pharmacy", "domain_name": "clifton", "region": "Greater Accra", ... }] }' },
      { method: 'GET', path: '/api/v1/companies/search?q=cliff', description: 'Search pharmacies by name, domain, or email.',
        response: '{ "success": true, "count": 2, "data": [{ "id": 5, "name": "Clifton Pharmacy", ... }] }' },
      { method: 'GET', path: '/api/v1/companies/:id', description: 'Get a single pharmacy by ID.',
        response: '{ "success": true, "data": { "id": 5, "name": "Clifton Pharmacy", "email": "...", "address1": "...", "latitude": 5.6, "longitude": -0.18, ... } }' },
    ]},
  { scope: 'company_users', name: 'Company Users', description: 'Look up pharmacy staff by phone number across every tenant. Platform keys only — the same phone can belong to staff at more than one pharmacy, so every matching company is returned, not just one.',
    endpoints: [
      { method: 'GET', path: '/api/v1/company-users?phone=0557706385', description: 'Find every company-user record matching a phone number, one entry per pharmacy. Requires a platform API key — company-scoped keys get 403. Returns 200 with an empty array when nothing matches (not 404).',
        response: '{\n  "success": true,\n  "count": 2,\n  "data": [\n    {\n      "company_id": 5,\n      "company_name": "Clifton Pharmacy",\n      "company_domain": "clifton",\n      "id": "U1023",\n      "userid": "jdoe",\n      "username": "jdoe",\n      "lname": "Doe",\n      "mname": null,\n      "sname": "John",\n      "email": "john@clifton.com",\n      "tel": "+233557706385",\n      "userrole": "staff",\n      "isactive": true,\n      "allowed_online_access": true,\n      "phone_verified": true,\n      "last_login": "2026-07-10T08:15:00.000Z",\n      "created_at": "2025-11-02T09:00:00.000Z"\n    },\n    {\n      "company_id": 12,\n      "company_name": "Rigel Pharmacy",\n      "company_domain": "rigel",\n      "id": "U0042",\n      "userid": "jd42",\n      "username": "jd42",\n      "lname": "Doe",\n      "mname": null,\n      "sname": "John",\n      "email": "j.doe@rigel.com",\n      "tel": "+233557706385",\n      "userrole": "pharmacist",\n      "isactive": true,\n      "allowed_online_access": false,\n      "phone_verified": true,\n      "last_login": null,\n      "created_at": "2026-02-14T11:30:00.000Z"\n    }\n  ]\n}' },
    ]},
  { scope: 'support_tickets', name: 'Support Tickets', description: 'Lodge and track support tickets. A ticket is visible to the key that created it, and — for company-scoped keys — to every other key issued to that same pharmacy. Platform keys may pass company_id to create a ticket for a specific pharmacy, or omit it for a platform-level ticket; company_id is required as a query/body param on every other endpoint for platform keys. requester_phone or requester_email is required so the ticket can be followed up. notify_sms (default true) controls whether agent replies/resolution trigger an outbound SMS — set it false to rely on polling GET /tickets/:id instead.',
    endpoints: [
      { method: 'POST', path: '/api/v1/tickets', description: 'Lodge a new ticket. idempotency_key makes retries safe — replaying the same key returns the original ticket instead of creating a duplicate.',
        body: '{\n  "subject": "Order not delivered",\n  "description": "Order #4821 was marked delivered but never arrived.",\n  "category": "delivery",\n  "priority": "high",\n  "requester_name": "Ama Owusu",\n  "requester_phone": "+233201234567",\n  "external_ref": "ORD-4821",\n  "notify_sms": true,\n  "idempotency_key": "order-4821-support-1",\n  "company_id": 5\n}',
        response: '{\n  "success": true,\n  "data": {\n    "id": 88,\n    "company_id": 5,\n    "external_ref": "ORD-4821",\n    "subject": "Order not delivered",\n    "description": "Order #4821 was marked delivered but never arrived.",\n    "category": "delivery",\n    "priority": "high",\n    "status": "open",\n    "requester_name": "Ama Owusu",\n    "requester_phone": "+233201234567",\n    "requester_email": null,\n    "notify_sms": true,\n    "resolved_at": null,\n    "closed_at": null,\n    "created_at": "2026-07-15T09:00:00.000Z",\n    "updated_at": "2026-07-15T09:00:00.000Z",\n    "messages": [\n      { "id": 201, "author_type": "requester", "body": "Order #4821 was marked delivered but never arrived.", "created_at": "2026-07-15T09:00:00.000Z" }\n    ]\n  }\n}' },
      { method: 'GET', path: '/api/v1/tickets?status=open&limit=20', description: 'List tickets visible to this key. Optional filters: status, category, priority, search. Platform keys must pass company_id.',
        response: '{ "success": true, "count": 1, "data": [ { "id": 88, "subject": "Order not delivered", "status": "open", "priority": "high", "category": "delivery", "created_at": "..." } ] }' },
      { method: 'GET', path: '/api/v1/tickets/:id', description: 'Fetch a ticket with its full thread. Internal agent notes are never included. Platform keys must pass company_id.',
        response: '{ "success": true, "data": { "id": 88, "subject": "Order not delivered", "status": "waiting_on_customer", "messages": [ { "id": 201, "author_type": "requester", "body": "Order #4821 was marked delivered but never arrived.", "created_at": "..." }, { "id": 205, "author_type": "agent", "body": "Checking with the rider now, will update shortly.", "created_at": "..." } ] } }' },
      { method: 'POST', path: '/api/v1/tickets/:id/messages', description: 'Add a follow-up as the requester. Reopens a resolved/waiting ticket to open. Returns 409 if the ticket is closed. Platform keys must pass company_id.',
        body: '{ "body": "Still has not arrived, it has been 3 days now." }',
        response: '{\n  "success": true,\n  "data": {\n    "id": 88,\n    "status": "open",\n    "messages": [\n      { "id": 201, "author_type": "requester", "body": "Order #4821 was marked delivered but never arrived.", "created_at": "..." },\n      { "id": 205, "author_type": "agent", "body": "Checking with the rider now, will update shortly.", "created_at": "..." },\n      { "id": 209, "author_type": "requester", "body": "Still has not arrived, it has been 3 days now.", "created_at": "..." }\n    ]\n  }\n}' },
      { method: 'PATCH', path: '/api/v1/tickets/:id', description: 'Update notify_sms or requester contact info. Cannot change status/priority/category — that\'s agent-only. Platform keys must pass company_id.',
        body: '{ "notify_sms": false }',
        response: '{\n  "success": true,\n  "data": {\n    "id": 88,\n    "status": "open",\n    "notify_sms": false,\n    "requester_phone": "+233201234567"\n  }\n}' },
      { method: 'GET', path: '/api/v1/tickets/manage?status=open&limit=20', description: 'PLATFORM KEYS ONLY (403 for company-scoped keys). Cross-tenant list for a support vendor managing tickets for every pharmacy. Filters: status, category, priority, search, company_id, assigned_admin_id, assignee_id, unassigned=true.',
        response: '{ "success": true, "count": 1, "data": [ { "id": 88, "company_id": 5, "subject": "Order not delivered", "status": "open", "priority": "high", "assignee": null, "created_at": "..." } ] }' },
      { method: 'GET', path: '/api/v1/tickets/manage/:id', description: 'PLATFORM KEYS ONLY. Fetch any ticket across any pharmacy, including internal agent notes (each message carries is_internal_note).',
        response: '{ "success": true, "data": { "id": 88, "company_id": 5, "status": "waiting_on_customer", "assignee": { "id": 3, "name": "Kojo Mensah", "email": "kojo@supportvendor.com", "phone": "+233241112222", "is_active": true }, "messages": [ { "id": 205, "author_type": "agent", "body": "Checking with the rider now.", "is_internal_note": false, "created_at": "..." }, { "id": 206, "author_type": "agent", "body": "Rider confirmed delivered to wrong address, escalating.", "is_internal_note": true, "created_at": "..." } ] } }' },
      { method: 'POST', path: '/api/v1/tickets/manage/assignees', description: 'PLATFORM KEYS ONLY. Register a support-vendor agent in the assignee roster — not a MedsGH admin account, so no login is required on their side. phone or email is required. Returns 409 if the phone number is already registered to another assignee.',
        body: '{\n  "name": "Kojo Mensah",\n  "email": "kojo@supportvendor.com",\n  "phone": "+233241112222"\n}',
        response: '{ "success": true, "data": { "id": 3, "name": "Kojo Mensah", "email": "kojo@supportvendor.com", "phone": "+233241112222", "is_active": true, "created_at": "...", "updated_at": "..." } }' },
      { method: 'GET', path: '/api/v1/tickets/manage/assignees?active_only=true', description: 'PLATFORM KEYS ONLY. List the assignee roster. Optional filters: active_only, search (matches name/email/phone).',
        response: '{ "success": true, "count": 1, "data": [ { "id": 3, "name": "Kojo Mensah", "email": "kojo@supportvendor.com", "phone": "+233241112222", "is_active": true, "created_at": "...", "updated_at": "..." } ] }' },
      { method: 'PATCH', path: '/api/v1/tickets/manage/assignees/:assigneeId', description: 'PLATFORM KEYS ONLY. Update an assignee\'s contact info, or set is_active: false to retire them (existing ticket assignments are kept, just flagged inactive — they can no longer be assigned to new tickets).',
        body: '{ "phone": "+233241119999" }',
        response: '{ "success": true, "data": { "id": 3, "name": "Kojo Mensah", "email": "kojo@supportvendor.com", "phone": "+233241119999", "is_active": true, "created_at": "...", "updated_at": "..." } }' },
      { method: 'POST', path: '/api/v1/tickets/manage/:id/assign', description: 'PLATFORM KEYS ONLY. Assign to a registered assignee by id (see POST .../assignees). SMS-notifies the assignee\'s phone that a ticket was assigned (email isn\'t wired up yet — no email infra in rigel-medsgh today). Flips status open → in_progress. 404 if the assignee doesn\'t exist or is inactive.',
        body: '{ "assignee_id": 3 }',
        response: '{ "success": true, "data": { "id": 88, "status": "in_progress", "assignee": { "id": 3, "name": "Kojo Mensah", "email": "kojo@supportvendor.com", "phone": "+233241112222", "is_active": true } } }' },
      { method: 'POST', path: '/api/v1/tickets/manage/:id/messages', description: 'PLATFORM KEYS ONLY. Reply as an agent. is_internal_note: true keeps it hidden from the requester and from every GET /api/v1/tickets/* response. Non-internal replies flip status to waiting_on_customer and SMS the requester (if notify_sms is on).',
        body: '{ "body": "Checking with the rider now, will update shortly.", "is_internal_note": false }',
        response: '{\n  "success": true,\n  "data": {\n    "id": 88,\n    "status": "waiting_on_customer",\n    "messages": [\n      { "id": 201, "author_type": "requester", "body": "Order #4821 was marked delivered but never arrived.", "is_internal_note": false, "created_at": "..." },\n      { "id": 205, "author_type": "agent", "body": "Checking with the rider now, will update shortly.", "is_internal_note": false, "created_at": "..." }\n    ]\n  }\n}' },
      { method: 'PATCH', path: '/api/v1/tickets/manage/:id', description: 'PLATFORM KEYS ONLY. Update status, priority, or category. Marking resolved SMS-notifies the requester (if notify_sms is on).',
        body: '{ "status": "resolved" }',
        response: '{ "success": true, "data": { "id": 88, "status": "resolved", "resolved_at": "2026-07-15T10:00:00.000Z" } }' },
    ]},
  { scope: 'coverage', name: 'Pharmacy Coverage', description: 'Partner/sync-facing multi-product search across pharmacies of a given company type — not under /api/v1, but uses the same company API key (x-api-key) auth as /api/sync/*. Distance defaults to the calling company\'s own location when lat/lng are omitted. Mirrors the admin pharmacy-coverage matrix\'s covered/uncovered/coverage_score shape, but the caller supplies the item list directly instead of it coming from a stored order request.',
    endpoints: [
      { method: 'POST', path: '/api/order-requests/coverage/by-type', description: 'Find companies of a type carrying matching products. company_type: 0=Pharmacy, 1=Hospital, 2=Clinic, 3=Wholesaler. lat/lng default to the caller\'s own coords; radius_km defaults to 10; sort is availability (default, most items covered first) or distance. Each item needs product_name and/or search_term_override; id/item_id is echoed back in the response to correlate — defaults to array index if omitted.',
        body: '{\n  "company_type": 0,\n  "radius_km": 15,\n  "sort": "availability",\n  "items": [\n    { "id": "p1", "product_name": "Paracetamol 500mg" },\n    { "id": "p2", "product_name": "Rose Water", "search_term_override": null }\n  ]\n}',
        response: '{\n  "success": true,\n  "data": {\n    "company_type": 0,\n    "total_items": 2,\n    "pharmacies": [\n      {\n        "pharmacy_id": 5,\n        "pharmacy_name": "Clifton Pharmacy",\n        "phone": "+233...",\n        "location": "...",\n        "latitude": 5.6,\n        "longitude": -0.18,\n        "distance_km": 1.2,\n        "covered": [\n          {\n            "item_id": "p1",\n            "product_name": "Paracetamol 500mg",\n            "search_term_override": null,\n            "top_matches": [\n              { "matched_product_id": "...", "matched_product_name": "Paracetamol 500mg", "price": 1.5, "stock": 49, "unit": "Tablet", "strength": "500mg" }\n            ]\n          }\n        ],\n        "uncovered": [\n          { "item_id": "p2", "product_name": "Rose Water", "search_term_override": null }\n        ],\n        "coverage_score": 1,\n        "total_items": 2\n      }\n    ]\n  }\n}' },
    ]},
  { scope: 'wholesaler_orders', name: 'Wholesaler Orders', description: 'Counterpart to Pharmacy Coverage — record and track an order a pharmacy places with a wholesaler after finding it via coverage/by-type. Not under /api/v1, but uses the same company API key (x-api-key) or JWT auth. Every request is scoped to the caller\'s own company: sender_pharmacy_id is always derived from the authenticated key/token, never read from the body, so a caller can only see or modify its own orders. total_items, total_amount, and each line\'s line_total are computed server-side from items[] (quantity × unit_price) and cannot be overridden by the caller.',
    endpoints: [
      { method: 'POST', path: '/api/wholesaler-orders', description: 'Create an order. order_id is a caller-supplied unique business key. status defaults to "draft" if omitted; valid values: draft, sent, confirmed, partially_received, received, cancelled.',
        body: '{\n  "order_id": "PO-1720958400000-1",\n  "status": "sent",\n  "sent_at": "2026-07-14T10:35:00Z",\n  "wholesaler": {\n    "id": 157,\n    "name": "MIKSAN Pharmacy",\n    "phone": "+233530515649",\n    "address": "Okpoi Gono"\n  },\n  "items": [\n    {\n      "request_id": "p1",\n      "requested_product_name": "Paracetamol 500mg",\n      "wholesaler_product_name": "Paracetamol Local (All Types) Blister Strip 500Mg 100",\n      "quantity": 10,\n      "unit_price": 2.5\n    },\n    {\n      "request_id": "p2",\n      "requested_product_name": "Rose Water",\n      "wholesaler_product_name": "Rose Water 120ml",\n      "quantity": 5,\n      "unit_price": 12.5\n    }\n  ]\n}',
        response: '{\n  "success": true,\n  "data": {\n    "id": 1,\n    "order_id": "PO-1720958400000-1",\n    "sender_pharmacy_id": 5,\n    "wholesaler_id": 157,\n    "wholesaler_name": "MIKSAN Pharmacy",\n    "wholesaler_phone": "+233530515649",\n    "wholesaler_address": "Okpoi Gono",\n    "status": "sent",\n    "total_items": 2,\n    "total_amount": "87.50",\n    "sent_at": "2026-07-14T10:35:00.000Z",\n    "created_at": "2026-07-14T10:35:00.000Z",\n    "updated_at": "2026-07-14T10:35:00.000Z",\n    "items": [\n      { "id": 1, "request_id": "p1", "requested_product_name": "Paracetamol 500mg", "wholesaler_product_name": "Paracetamol Local (All Types) Blister Strip 500Mg 100", "quantity": 10, "unit_price": "2.50", "line_total": "25.00" },\n      { "id": 2, "request_id": "p2", "requested_product_name": "Rose Water", "wholesaler_product_name": "Rose Water 120ml", "quantity": 5, "unit_price": "12.50", "line_total": "62.50" }\n    ]\n  }\n}' },
      { method: 'GET', path: '/api/wholesaler-orders', description: 'List orders for the caller\'s company, newest first. Optional ?status= filter.',
        response: '{\n  "success": true,\n  "data": [\n    { "id": 1, "order_id": "PO-1720958400000-1", "wholesaler_name": "MIKSAN Pharmacy", "status": "sent", "total_items": 2, "total_amount": "87.50", "created_at": "..." }\n  ]\n}' },
      { method: 'GET', path: '/api/wholesaler-orders/:orderId', description: 'Fetch a single order (by order_id) with its items. Returns 404 if it does not belong to the caller\'s company.',
        response: '{ "success": true, "data": { "id": 1, "order_id": "PO-1720958400000-1", "status": "sent", "total_items": 2, "total_amount": "87.50", "items": [ { "id": 1, "requested_product_name": "Paracetamol 500mg", "quantity": 10, "unit_price": "2.50", "line_total": "25.00" } ] } }' },
      { method: 'PUT', path: '/api/wholesaler-orders/:orderId', description: 'Update status, sent_at, or wholesaler contact info. Include items to fully replace the line items and recompute totals.',
        body: '{ "status": "received" }',
        response: '{ "success": true, "data": { "id": 1, "order_id": "PO-1720958400000-1", "status": "received", "total_items": 2, "total_amount": "87.50", "items": [...] } }' },
      { method: 'DELETE', path: '/api/wholesaler-orders/:orderId', description: 'Delete an order and its items. Returns 404 if it does not belong to the caller\'s company.',
        response: '{ "success": true }' },
    ]},
])

const buildCurl = (ep: any) => {
  const url = `${apiBase.value}${ep.path}`
  const bodyPart = ep.body ? ` \\\n  -d '${ep.body.replace(/\n/g, '\n  ')}'` : ''
  return `curl -X ${ep.method} "${url}" \\\n  -H "x-api-key: <your-api-key>" \\\n  -H "Content-Type: application/json"${bodyPart}`
}

// Console
const console_ = ref({ apiKey: '', endpointKey: '', method: 'GET', path: '', body: '', loading: false, response: '', responseStatus: 0, latency: 0 })

const onEndpointSelect = () => {
  const [method, path] = (console_.value.endpointKey || '').split('::')
  console_.value.method = method || 'GET'
  console_.value.path = path || ''
  const ep = docGroups.value.flatMap(g => g.endpoints).find(e => e.method === method && e.path === path)
  console_.value.body = ep?.body || ''
}

const sendRequest = async () => {
  console_.value.loading = true; console_.value.response = ''
  const start = Date.now()
  try {
    const url = `${apiBase.value}${console_.value.path.replace(/:(\w+)/g, '1')}`
    const opts: RequestInit = { method: console_.value.method, headers: { 'x-api-key': console_.value.apiKey, 'Content-Type': 'application/json' } }
    if (['POST', 'PUT'].includes(console_.value.method) && console_.value.body) opts.body = console_.value.body
    const resp = await fetch(url, opts)
    console_.value.responseStatus = resp.status
    const text = await resp.text()
    try { console_.value.response = JSON.stringify(JSON.parse(text), null, 2) } catch { console_.value.response = text }
  } catch (e: any) { console_.value.response = `Error: ${e.message}`; console_.value.responseStatus = 0 }
  finally { console_.value.latency = Date.now() - start; console_.value.loading = false }
}

const statusClass = (s: number) => s >= 200 && s < 300 ? 'ok' : s >= 400 ? 'err' : 'warn'

// Utils
const toast = ref<{ text: string; type: string } | null>(null)
const showToast = (text: string, type = 'success') => { toast.value = { text, type }; setTimeout(() => { toast.value = null }, 4000) }
const copyText = async (text: string) => { try { await navigator.clipboard.writeText(text); showToast('Copied!') } catch { showToast('Copy failed', 'error') } }
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const timeAgo = (d: string) => { const diff = Date.now() - new Date(d).getTime(); const mins = Math.floor(diff / 60000); if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago` }
</script>

<style scoped>
.admin-developers { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.page-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
.page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
.page-subtitle { color: #6b7280; font-size: 0.875rem; margin: 0; }

.tabs-bar { display: flex; gap: 0.25rem; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.75rem; }
.tab-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.1rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; color: #6b7280; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.15s; }
.tab-btn:hover { color: #4f46e5; }
.tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }
.tab-panel { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.panel-header h2 { font-size: 1.15rem; font-weight: 700; color: #111827; margin: 0 0 0.2rem; }
.panel-header p { color: #6b7280; font-size: 0.875rem; margin: 0; }
code { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.8rem; color: #374151; }

/* Company selector */
.company-selector-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.1rem; margin-bottom: 1.25rem; }
.selector-label { font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.5rem; }
.selector-row { display: flex; gap: 0.75rem; }
.selector-row .form-control { flex: 1; }
.search-results { margin-top: 0.5rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.result-item { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; background: white; border: none; cursor: pointer; text-align: left; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; font-size: 0.875rem; }
.result-item:last-child { border-bottom: none; }
.result-item:hover, .result-item.selected { background: #eef2ff; }
.result-domain { font-size: 0.72rem; color: #9ca3af; font-family: monospace; }
.selected-chip { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.625rem; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 0.3rem 0.7rem; font-size: 0.8rem; font-weight: 600; color: #166534; }
.chip-icon { color: #16a34a; }
.chip-domain { color: #6b7280; font-family: monospace; font-weight: 400; font-size: 0.72rem; }
.chip-clear { background: none; border: none; cursor: pointer; color: #6b7280; padding: 0; display: flex; }

/* Keys */
.keys-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.keys-subtitle { font-size: 1rem; font-weight: 600; color: #374151; margin: 0; }
.keys-hint { font-size: 0.82rem; color: #6b7280; margin: 0.2rem 0 0; }
.usage-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.usage-pill { display: inline-flex; align-items: center; gap: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.78rem; }
.pill-endpoint { color: #374151; font-family: monospace; font-size: 0.72rem; }
.pill-count { font-weight: 700; color: #4f46e5; }
.pill-method { display: inline-block; padding: 0.1rem 0.45rem; border-radius: 3px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
.method-get { background: #dbeafe; color: #1d4ed8; }
.method-post { background: #dcfce7; color: #166534; }
.method-put { background: #fef3c7; color: #92400e; }
.method-delete { background: #fee2e2; color: #991b1b; }

.table-container { background: white; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.keys-table { width: 100%; border-collapse: collapse; }
.keys-table thead { background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
.keys-table th { padding: 0.7rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
.keys-table td { padding: 0.8rem 1rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; }
.key-name { font-weight: 600; color: #111827; }
.key-desc { font-size: 0.72rem; color: #9ca3af; font-weight: 400; }
.muted { color: #6b7280; font-size: 0.8rem; }
.platform-badge { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; background: #fef3c7; color: #92400e; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
.company-type-badge { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; background: #ede9fe; color: #6d28d9; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
.platform-label { color: #92400e; }
.scopes-wrap { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.scope-tag { display: inline-block; padding: 0.175rem 0.45rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; background: #ede9fe; color: #6d28d9; }
.scope-tag.all { background: #f3f4f6; color: #374151; }
.tier-badge { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
.tier-free { background: #f3f4f6; color: #374151; }
.tier-premium { background: #ede9fe; color: #6d28d9; }
.tier-enterprise { background: #fef3c7; color: #92400e; }
.status-active { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; background: #dcfce7; color: #166534; font-size: 0.72rem; font-weight: 700; }
.status-inactive { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; background: #fee2e2; color: #991b1b; font-size: 0.72rem; font-weight: 700; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.3rem; border-radius: 5px; color: #9ca3af; }
.btn-icon.danger:hover { background: #fee2e2; color: #dc2626; }

/* Docs */
.doc-groups { display: flex; flex-direction: column; gap: 0.75rem; }
.doc-group { background: white; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.group-header { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: none; border: none; cursor: pointer; transition: background 0.1s; }
.group-header:hover { background: #eef2ff; }
.group-title { display: flex; align-items: center; gap: 0.75rem; }
.group-name { font-weight: 600; color: #111827; font-size: 0.9rem; }
.group-body { border-top: 1px solid #e5e7eb; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
.group-desc { color: #6b7280; font-size: 0.8125rem; margin: 0 0 0.5rem; }
.endpoint { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.ep-title { display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; background: #f9fafb; flex-wrap: wrap; }
.method-badge { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 4px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; flex-shrink: 0; }
.ep-path { font-size: 0.825rem; color: #111827; flex-shrink: 0; }
.ep-desc { font-size: 0.78rem; color: #6b7280; }
.ep-section { padding: 0.8rem 1rem; border-top: 1px solid #f3f4f6; }
.ep-label { font-size: 0.67rem; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
.code-block { background: #0f172a; color: #e2e8f0; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.78rem; font-family: monospace; white-space: pre; overflow-x: auto; margin: 0; }
.curl-block { position: relative; }
.curl-block pre { background: #0f172a; color: #86efac; padding: 0.75rem 2.25rem 0.75rem 1rem; border-radius: 6px; font-size: 0.78rem; font-family: monospace; white-space: pre; overflow-x: auto; margin: 0; }
.copy-btn { position: absolute; top: 0.4rem; right: 0.4rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 4px; padding: 0.2rem 0.3rem; cursor: pointer; }
.copy-btn:hover { background: rgba(255,255,255,0.2); }

/* Console */
.console-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
.console-request { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.1rem; display: flex; flex-direction: column; gap: 1rem; }
.console-response { background: #0f172a; border-radius: 10px; overflow: hidden; min-height: 380px; display: flex; flex-direction: column; }
.response-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 0.78rem; font-weight: 600; }
.status-pill { padding: 0.175rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.72rem; }
.status-pill.status-ok { background: #dcfce7; color: #166534; }
.status-pill.status-err { background: #fee2e2; color: #991b1b; }
.status-pill.status-warn { background: #fef3c7; color: #92400e; }
.latency-pill { color: #64748b; font-size: 0.72rem; }
.response-body { flex: 1; padding: 1rem; overflow-x: auto; }
.response-body pre { color: #86efac; font-family: monospace; font-size: 0.78rem; margin: 0; white-space: pre-wrap; }
.response-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #475569; font-size: 0.875rem; }
.font-mono { font-family: monospace; }
.w-full { width: 100%; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-content { background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header { padding: 1.1rem 1.4rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem; }
.modal-header h3 { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.modal-company { font-size: 0.75rem; color: #6b7280; }
.modal-close { background: none; border: none; cursor: pointer; padding: 0.3rem; border-radius: 5px; color: #6b7280; margin-left: auto; }
.modal-body { padding: 1.4rem; display: flex; flex-direction: column; gap: 1rem; }
.modal-footer { padding: 1rem 1.4rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.req { color: #ef4444; }
.form-control { padding: 0.575rem 0.8rem; border: 1px solid #d1d5db; border-radius: 7px; font-size: 0.875rem; background: white; }
.form-control:focus { outline: none; border-color: #6366f1; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field-hint { font-size: 0.72rem; color: #9ca3af; margin-top: 0.2rem; }
.error-msg { color: #dc2626; font-size: 0.875rem; padding: 0.625rem; background: #fee2e2; border-radius: 6px; }
.scope-checkboxes { display: flex; flex-direction: column; gap: 0.5rem; }
.scope-check { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.scope-check input { accent-color: #6366f1; }
.scope-check-label { display: flex; align-items: center; gap: 0.5rem; }
.scope-check-desc { font-size: 0.78rem; color: #6b7280; }
.created-key-box { display: flex; flex-direction: column; gap: 0.75rem; }
.created-key-label { font-size: 0.8rem; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 0.65rem; margin: 0; }
.created-key-display { display: flex; align-items: center; gap: 0.75rem; background: #0f172a; border-radius: 8px; padding: 0.875rem; }
.created-key-display code { flex: 1; color: #86efac; font-size: 0.78rem; word-break: break-all; background: none; padding: 0; }
.copy-btn-inline { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.45rem 0.75rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.copy-btn-inline:hover { background: rgba(255,255,255,0.2); }
.mt-3 { margin-top: 0.75rem; }

/* Empty / loading / no-company */
.empty-state, .loading-state, .no-company-state { text-align: center; padding: 2.5rem 2rem; color: #9ca3af; }
.no-company-state { background: white; border: 1px dashed #e5e7eb; border-radius: 10px; }

/* Buttons */
.btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.575rem 1.1rem; background: #4f46e5; color: white; border: none; border-radius: 7px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: #4338ca; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.575rem 1.1rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 7px; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }

/* Toast */
.message-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #10b981; color: white; border-radius: 7px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 300; animation: slideIn 0.2s ease; font-size: 0.875rem; font-weight: 500; }
.message-toast.message-error { background: #ef4444; }
@keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 900px) { .console-layout { grid-template-columns: 1fr; } .admin-developers { padding: 1rem; } .form-grid-2 { grid-template-columns: 1fr; } }
</style>
