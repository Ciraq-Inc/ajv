<template>
  <div class="admin-discounts">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Discounts &amp; Promotions</h1>
        <p class="page-subtitle">Create and manage promotional codes across pharmacies</p>
      </div>
      <button v-if="selectedCompany" @click="openCreateModal" class="btn-primary">
        <Icon name="Plus" size="16" /> Create Code
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button @click="activeTab = 'company'" :class="['tab-btn', { active: activeTab === 'company' }]">
        <Icon name="Building2" size="15" /> Company Codes
      </button>
      <button @click="activeTab = 'global'" :class="['tab-btn', { active: activeTab === 'global' }]">
        <Icon name="Globe" size="15" /> Global Codes
        <span v-if="globalStats.active" class="tab-count">{{ globalStats.active }}</span>
      </button>
    </div>

    <!-- ── Company Codes Tab ───────────────────────────── -->
    <template v-if="activeTab === 'company'">

    <!-- Company selector -->
    <div class="company-selector-card">
      <label class="selector-label">Pharmacy</label>
      <div class="selector-row">
        <input
          v-model="companySearch"
          @input="searchCompanies"
          class="form-control"
          placeholder="Search by company name or domain…"
        />
        <button @click="loadForCompany" class="btn-secondary" :disabled="!companySearch.trim() || searchLoading">
          <Icon v-if="searchLoading" name="Loader2" size="15" class="animate-spin" />
          Search
        </button>
      </div>

      <!-- Search results -->
      <div v-if="searchResults.length" class="search-results">
        <button
          v-for="c in searchResults"
          :key="c.id"
          @click="selectCompany(c)"
          :class="['result-item', { selected: selectedCompany?.id === c.id }]"
        >
          <strong>{{ c.name }}</strong>
          <span class="result-domain">{{ c.domain_name }}</span>
        </button>
      </div>

      <div v-if="selectedCompany" class="selected-chip">
        <Icon name="CheckCircle" size="15" class="chip-icon" />
        {{ selectedCompany.name }}
        <span class="chip-domain">{{ selectedCompany.domain_name }}</span>
        <button @click="clearCompany" class="chip-clear"><Icon name="X" size="14" /></button>
      </div>
    </div>

    <!-- Content — only shown once a company is selected -->
    <template v-if="selectedCompany">
      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card active">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card expired">
          <div class="stat-value">{{ stats.expired }}</div>
          <div class="stat-label">Expired</div>
        </div>
        <div class="stat-card depleted">
          <div class="stat-value">{{ stats.depleted }}</div>
          <div class="stat-label">Depleted</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-group">
          <select v-model="filterStatus" class="form-control">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="depleted">Depleted</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="filter-group search-filter">
          <input v-model="searchCode" class="form-control" placeholder="Filter by code…" />
        </div>
      </div>

      <!-- Table -->
      <div class="table-container" v-if="!codesLoading">
        <table v-if="filteredCodes.length" class="codes-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Uses</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="code in filteredCodes" :key="code.id" @click="openDetail(code)" class="clickable-row">
              <td><span class="code-tag">{{ code.code }}</span></td>
              <td><span :class="`type-badge type-${code.discount_type}`">{{ typeLabel(code.discount_type) }}</span></td>
              <td>{{ formatValue(code) }}</td>
              <td>{{ code.times_used }}<span v-if="code.max_uses" class="muted"> / {{ code.max_uses }}</span></td>
              <td class="muted">{{ code.valid_until ? formatDate(code.valid_until) : '—' }}</td>
              <td><span :class="`status-badge status-${code.status}`">{{ code.status }}</span></td>
              <td @click.stop>
                <button v-if="code.is_active" @click="confirmDeactivate(code)" class="btn-icon danger" title="Deactivate">
                  <Icon name="XCircle" size="15" />
                </button>
                <button v-else @click="reactivate(code)" class="btn-icon" title="Re-activate">
                  <Icon name="CheckCircle" size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <Icon name="Tag" size="40" />
          <p>No codes for this pharmacy yet</p>
          <button @click="openCreateModal" class="btn-primary mt-3">Create first code</button>
        </div>
      </div>
      <div v-else class="loading-state"><Icon name="Loader2" size="28" class="animate-spin" /></div>
    </template>

    <div v-else class="no-company-state">
      <Icon name="BuildingStorefront" size="48" />
      <p>Search for a pharmacy above to manage its discount codes</p>
    </div>

    </template> <!-- end company tab -->

    <!-- ── Global Codes Tab ───────────────────────────── -->
    <template v-if="activeTab === 'global'">
      <div class="global-header">
        <div>
          <p class="global-desc">Global codes apply to <strong>all pharmacies</strong>. Any customer can use them regardless of which pharmacy they're ordering from.</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button @click="openGlobalCreateModal" class="btn-primary">
            <Icon name="Plus" size="15" /> Create Global Code
          </button>
          <button @click="openBatchCreateModal" class="btn-secondary">
            <Icon name="Copy" size="15" /> Batch Generate
          </button>
        </div>
      </div>

      <!-- Global stats -->
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ globalStats.total }}</div><div class="stat-label">Total</div></div>
        <div class="stat-card active"><div class="stat-value">{{ globalStats.active }}</div><div class="stat-label">Active</div></div>
        <div class="stat-card expired"><div class="stat-value">{{ globalStats.expired }}</div><div class="stat-label">Expired</div></div>
        <div class="stat-card depleted"><div class="stat-value">{{ globalStats.depleted }}</div><div class="stat-label">Depleted</div></div>
      </div>

      <div class="table-container" v-if="!globalLoading">
        <table v-if="filteredGlobalCodes.length" class="codes-table">
          <thead>
            <tr><th>Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Valid Until</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="code in filteredGlobalCodes" :key="code.id" @click="openGlobalDetail(code)" class="clickable-row">
              <td><span class="code-tag">{{ code.code }}</span></td>
              <td><span :class="`type-badge type-${code.discount_type}`">{{ typeLabel(code.discount_type) }}</span></td>
              <td>{{ formatValue(code) }}</td>
              <td>{{ code.times_used }}<span v-if="code.max_uses" class="muted"> / {{ code.max_uses }}</span></td>
              <td class="muted">{{ code.valid_until ? formatDate(code.valid_until) : '—' }}</td>
              <td><span :class="`status-badge status-${code.status}`">{{ code.status }}</span></td>
              <td @click.stop>
                <button v-if="code.is_active" @click="confirmGlobalDeactivate(code)" class="btn-icon danger" title="Deactivate"><Icon name="XCircle" size="15" /></button>
                <button v-else @click="reactivateGlobal(code)" class="btn-icon" title="Re-activate"><Icon name="CheckCircle" size="15" /></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <Icon name="Globe" size="40" />
          <p>No global codes yet</p>
          <button @click="openGlobalCreateModal" class="btn-primary mt-3">Create first global code</button>
        </div>
      </div>
      <div v-else class="loading-state"><Icon name="Loader2" size="28" class="animate-spin" /></div>
    </template>

    <!-- Global Create Modal -->
    <div v-if="showGlobalCreateModal" class="modal-overlay" @click.self="showGlobalCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Global Code</h3>
          <small class="modal-company global-label">Applies to all pharmacies</small>
          <button @click="showGlobalCreateModal = false" class="modal-close"><Icon name="X" size="18" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full"><label>Code <span class="req">*</span></label><input v-model="globalCreateForm.code" class="form-control code-input" placeholder="e.g. WELCOME10" @input="globalCreateForm.code = globalCreateForm.code.toUpperCase()" /></div>
            <div class="form-group"><label>Type <span class="req">*</span></label>
              <select v-model="globalCreateForm.discount_type" class="form-control">
                <option value="percentage">% Off</option>
                <option value="flat_amount">Fixed GHS</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div class="form-group" v-if="globalCreateForm.discount_type !== 'free_shipping'">
              <label>{{ globalCreateForm.discount_type === 'percentage' ? 'Percent (%)' : 'Amount (GHS)' }} <span class="req">*</span></label>
              <input v-model.number="globalCreateForm.discount_value" type="number" min="0" step="0.01" class="form-control" />
            </div>
            <div class="form-group" v-if="globalCreateForm.discount_type === 'percentage'"><label>Max Cap (GHS)</label><input v-model.number="globalCreateForm.max_discount_amount" type="number" min="0" step="0.01" class="form-control" placeholder="optional" /></div>
            <div class="form-group"><label>Min Order (GHS)</label><input v-model.number="globalCreateForm.min_order_amount" type="number" min="0" step="0.01" class="form-control" placeholder="optional" /></div>
            <div class="form-group"><label>Total Uses</label><input v-model.number="globalCreateForm.max_uses" type="number" min="1" class="form-control" placeholder="unlimited" /></div>
            <div class="form-group"><label>Per-Customer</label><input v-model.number="globalCreateForm.max_uses_per_customer" type="number" min="1" class="form-control" placeholder="1" /></div>
            <div class="form-group"><label>Valid From</label><input v-model="globalCreateForm.valid_from" type="datetime-local" class="form-control" /></div>
            <div class="form-group"><label>Valid Until</label><input v-model="globalCreateForm.valid_until" type="datetime-local" class="form-control" /></div>
            <div class="form-group full">
              <label>Audience</label>
              <div class="audience-options">
                <label class="radio-label"><input type="radio" v-model="globalCreateForm.audience" value="all" /> All</label>
                <label class="radio-label"><input type="radio" v-model="globalCreateForm.audience" value="customer" /> Customers only</label>
                <label class="radio-label"><input type="radio" v-model="globalCreateForm.audience" value="pharmacy" /> Pharmacy staff only</label>
              </div>
            </div>
            <div v-if="globalCreateForm.audience !== 'pharmacy'" class="form-group full">
              <label>Restrict to pharmacies (optional)</label>
              <p class="field-hint">Leave empty to apply to all pharmacies. Check specific pharmacies to limit scope.</p>
              <input type="text" placeholder="Search pharmacies..." class="form-control mb-2" @keyup="searchCompanies" v-model="companySearch" />
              <div v-if="searchResults.length" class="search-results">
                <label v-for="c in searchResults" :key="c.id" class="result-item checkbox-label">
                  <input type="checkbox" :value="c.id" v-model.number="(globalCreateForm.allowed_pharmacy_ids as any)" />
                  <span>{{ c.name }}</span>
                </label>
              </div>
              <div v-if="(globalCreateForm.allowed_pharmacy_ids as any)?.length" class="selected-pharmacies mt-2">
                <small class="muted">Selected: {{ (globalCreateForm.allowed_pharmacy_ids as any).length }} pharmacies</small>
              </div>
            </div>
            <div class="form-group full"><label>Description</label><textarea v-model="globalCreateForm.description" class="form-control" rows="2" placeholder="Internal note" /></div>
          </div>
          <p v-if="globalCreateError" class="error-msg">{{ globalCreateError }}</p>
        </div>
        <div class="modal-footer">
          <button @click="showGlobalCreateModal = false" class="btn-secondary">Cancel</button>
          <button @click="submitGlobalCreate" class="btn-primary" :disabled="globalCreateLoading || !isGlobalCreateValid">
            <Icon v-if="globalCreateLoading" name="Loader2" size="15" class="animate-spin" />
            {{ globalCreateLoading ? 'Creating…' : 'Create Global Code' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Discount Code</h3>
          <small v-if="selectedCompany" class="modal-company">{{ selectedCompany.name }}</small>
          <button @click="showCreateModal = false" class="modal-close"><Icon name="X" size="18" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full">
              <label>Code <span class="req">*</span></label>
              <input v-model="createForm.code" class="form-control code-input" placeholder="e.g. SAVE10"
                @input="createForm.code = createForm.code.toUpperCase()" />
            </div>
            <div class="form-group">
              <label>Type <span class="req">*</span></label>
              <select v-model="createForm.discount_type" class="form-control">
                <option value="percentage">% Off</option>
                <option value="flat_amount">Fixed GHS</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div class="form-group" v-if="createForm.discount_type !== 'free_shipping'">
              <label>{{ createForm.discount_type === 'percentage' ? 'Percent (%)' : 'Amount (GHS)' }} <span class="req">*</span></label>
              <input v-model.number="createForm.discount_value" type="number" min="0" step="0.01" class="form-control" />
            </div>
            <div class="form-group" v-if="createForm.discount_type === 'percentage'">
              <label>Max Cap (GHS)</label>
              <input v-model.number="createForm.max_discount_amount" type="number" min="0" step="0.01" class="form-control" placeholder="optional" />
            </div>
            <div class="form-group">
              <label>Min Order (GHS)</label>
              <input v-model.number="createForm.min_order_amount" type="number" min="0" step="0.01" class="form-control" placeholder="optional" />
            </div>
            <div class="form-group">
              <label>Total Uses</label>
              <input v-model.number="createForm.max_uses" type="number" min="1" class="form-control" placeholder="unlimited" />
            </div>
            <div class="form-group">
              <label>Per-Customer</label>
              <input v-model.number="createForm.max_uses_per_customer" type="number" min="1" class="form-control" placeholder="1" />
            </div>
            <div class="form-group">
              <label>Valid From</label>
              <input v-model="createForm.valid_from" type="datetime-local" class="form-control" />
            </div>
            <div class="form-group">
              <label>Valid Until</label>
              <input v-model="createForm.valid_until" type="datetime-local" class="form-control" />
            </div>
            <div class="form-group full">
              <label>Audience</label>
              <div class="audience-options">
                <label class="radio-label"><input type="radio" v-model="createForm.audience" value="all" /> All</label>
                <label class="radio-label"><input type="radio" v-model="createForm.audience" value="customer" /> Customers only</label>
                <label class="radio-label"><input type="radio" v-model="createForm.audience" value="pharmacy" /> Pharmacy staff only</label>
              </div>
            </div>
            <div class="form-group full">
              <label>Description</label>
              <textarea v-model="createForm.description" class="form-control" rows="2" placeholder="Internal note" />
            </div>
          </div>
          <p v-if="createError" class="error-msg">{{ createError }}</p>
        </div>
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn-secondary">Cancel</button>
          <button @click="submitCreate" class="btn-primary" :disabled="createLoading || !isCreateValid">
            <Icon v-if="createLoading" name="Loader2" size="15" class="animate-spin" />
            {{ createLoading ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Drawer -->
    <div v-if="selectedCode" class="drawer-overlay" @click.self="selectedCode = null">
      <div class="drawer">
        <div class="drawer-header">
          <span class="drawer-code">{{ selectedCode.code }}</span>
          <span :class="`status-badge status-${selectedCode.status} ml-2`">{{ selectedCode.status }}</span>
          <button @click="selectedCode = null" class="modal-close ml-auto"><Icon name="X" size="18" /></button>
        </div>
        <div class="drawer-body">
          <div class="detail-grid">
            <div class="detail-item"><span class="dl">Type</span><span class="dv">{{ typeLabel(selectedCode.discount_type) }}</span></div>
            <div class="detail-item"><span class="dl">Value</span><span class="dv">{{ formatValue(selectedCode) }}</span></div>
            <div class="detail-item"><span class="dl">Redemptions</span><span class="dv">{{ selectedCode.times_used }}{{ selectedCode.max_uses ? ` / ${selectedCode.max_uses}` : '' }}</span></div>
            <div class="detail-item"><span class="dl">Total Discounted</span><span class="dv">{{ selectedCode.total_discounted != null ? `GHS ${Number(selectedCode.total_discounted).toFixed(2)}` : '—' }}</span></div>
            <div class="detail-item"><span class="dl">Min Order</span><span class="dv">{{ selectedCode.min_order_amount ? `GHS ${selectedCode.min_order_amount}` : 'None' }}</span></div>
            <div class="detail-item"><span class="dl">Per-Customer</span><span class="dv">{{ selectedCode.max_uses_per_customer ?? 1 }}</span></div>
            <div class="detail-item"><span class="dl">Valid From</span><span class="dv">{{ selectedCode.valid_from ? formatDate(selectedCode.valid_from) : '—' }}</span></div>
            <div class="detail-item"><span class="dl">Valid Until</span><span class="dv">{{ selectedCode.valid_until ? formatDate(selectedCode.valid_until) : 'No expiry' }}</span></div>
          </div>
          <div class="drawer-actions">
            <button v-if="selectedCode.is_active" @click="confirmDeactivate(selectedCode)" class="btn-danger">Deactivate</button>
            <button v-else @click="reactivate(selectedCode)" class="btn-primary">Re-activate</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm -->
    <div v-if="confirmDialog.show" class="modal-overlay" @click.self="confirmDialog.show = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h3>{{ confirmDialog.title }}</h3></div>
        <div class="modal-body"><p>{{ confirmDialog.message }}</p></div>
        <div class="modal-footer">
          <button @click="confirmDialog.show = false" class="btn-secondary">Cancel</button>
          <button @click="runConfirm" class="btn-danger" :disabled="confirmDialog.loading">
            <Icon v-if="confirmDialog.loading" name="Loader2" size="15" class="animate-spin" />
            {{ confirmDialog.loading ? 'Processing…' : confirmDialog.confirmLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- Batch Create Modal -->
    <div v-if="showBatchCreateModal" class="modal-overlay" @click.self="showBatchCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Batch Generate Codes</h3>
          <small class="modal-company global-label">Auto-generate multiple unique codes</small>
          <button @click="showBatchCreateModal = false" class="modal-close"><Icon name="X" size="18" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full"><label>Code Prefix <span class="req">*</span></label><input v-model="batchCreateForm.prefix" class="form-control" placeholder="e.g. SUMMER" @input="batchCreateForm.prefix = batchCreateForm.prefix.toUpperCase()" /></div>
            <div class="form-group"><label>Suffix Length (4-10)</label><input v-model.number="batchCreateForm.suffix_length" type="number" min="4" max="10" class="form-control" /></div>
            <div class="form-group"><label>Count (1-500) <span class="req">*</span></label><input v-model.number="batchCreateForm.count" type="number" min="1" max="500" class="form-control" /></div>
            <div class="form-group full"><small class="muted">Preview: {{ batchCreateForm.prefix }}ABCD{{ batchCreateForm.suffix_length >= 6 ? 'EF' : '' }}</small></div>
            <div class="form-group"><label>Type <span class="req">*</span></label>
              <select v-model="batchCreateForm.discount_type" class="form-control">
                <option value="percentage">% Off</option>
                <option value="flat_amount">Fixed GHS</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div class="form-group" v-if="batchCreateForm.discount_type !== 'free_shipping'">
              <label>{{ batchCreateForm.discount_type === 'percentage' ? 'Percent (%)' : 'Amount (GHS)' }} <span class="req">*</span></label>
              <input v-model.number="batchCreateForm.discount_value" type="number" min="0" step="0.01" class="form-control" />
            </div>
            <div class="form-group" v-if="batchCreateForm.discount_type === 'percentage'"><label>Max Cap (GHS)</label><input v-model.number="batchCreateForm.max_discount_amount" type="number" min="0" step="0.01" class="form-control" placeholder="optional" /></div>
            <div class="form-group"><label>Min Order (GHS)</label><input v-model.number="batchCreateForm.min_order_amount" type="number" min="0" step="0.01" class="form-control" placeholder="optional" /></div>
            <div class="form-group"><label>Total Uses</label><input v-model.number="batchCreateForm.max_uses" type="number" min="1" class="form-control" placeholder="unlimited" /></div>
            <div class="form-group"><label>Per-Customer</label><input v-model.number="batchCreateForm.max_uses_per_customer" type="number" min="1" class="form-control" placeholder="1" /></div>
            <div class="form-group"><label>Valid From</label><input v-model="batchCreateForm.valid_from" type="datetime-local" class="form-control" /></div>
            <div class="form-group"><label>Valid Until</label><input v-model="batchCreateForm.valid_until" type="datetime-local" class="form-control" /></div>
            <div class="form-group full">
              <label>Audience</label>
              <div class="audience-options">
                <label class="radio-label"><input type="radio" v-model="batchCreateForm.audience" value="all" /> All</label>
                <label class="radio-label"><input type="radio" v-model="batchCreateForm.audience" value="customer" /> Customers only</label>
                <label class="radio-label"><input type="radio" v-model="batchCreateForm.audience" value="pharmacy" /> Pharmacy staff only</label>
              </div>
            </div>
            <div v-if="batchCreateForm.audience !== 'pharmacy'" class="form-group full">
              <label>Restrict to pharmacies (optional)</label>
              <input type="text" placeholder="Search pharmacies..." class="form-control mb-2" @keyup="searchCompanies" v-model="companySearch" />
              <div v-if="searchResults.length" class="search-results">
                <label v-for="c in searchResults" :key="c.id" class="result-item checkbox-label">
                  <input type="checkbox" :value="c.id" v-model.number="(batchCreateForm.allowed_pharmacy_ids as any)" />
                  <span>{{ c.name }}</span>
                </label>
              </div>
            </div>
            <div class="form-group full"><label>Description</label><textarea v-model="batchCreateForm.description" class="form-control" rows="2" placeholder="Internal note for this batch" /></div>
          </div>
          <p v-if="batchCreateError" class="error-msg">{{ batchCreateError }}</p>
        </div>
        <div class="modal-footer">
          <button @click="showBatchCreateModal = false" class="btn-secondary">Cancel</button>
          <button @click="submitBatchCreate" class="btn-primary" :disabled="batchCreateLoading || !isBatchCreateValid">
            <Icon v-if="batchCreateLoading" name="Loader2" size="15" class="animate-spin" />
            {{ batchCreateLoading ? 'Generating…' : `Generate ${batchCreateForm.count}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" :class="`message-toast ${toast.type === 'error' ? 'message-error' : ''}`">
      <Icon :name="toast.type === 'error' ? 'AlertCircle' : 'CheckCircle'" size="16" />
      {{ toast.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { createAdminDiscountsService } from '~/services/discounts/adminDiscountsService'
import type { DiscountCode, DiscountStats, CreateDiscountPayload } from '~/services/discounts/discountsService'

definePageMeta({ layout: 'admin-layout', middleware: ['admin-auth'] })

const api = useApi()
const svc = createAdminDiscountsService(api)

// Company selector
const companySearch = ref('')
const searchResults = ref<any[]>([])
const selectedCompany = ref<any>(null)
const searchLoading = ref(false)

const searchCompanies = async () => {
  if (companySearch.value.length < 2) { searchResults.value = []; return }
  searchLoading.value = true
  try {
    const res = await api.get<any[]>(`/api/companies/search?q=${encodeURIComponent(companySearch.value)}`)
    searchResults.value = res.success ? (res.data as any[]).slice(0, 8) : []
  } catch { searchResults.value = [] } finally { searchLoading.value = false }
}

const selectCompany = (c: any) => {
  selectedCompany.value = c
  companySearch.value = c.name
  searchResults.value = []
  loadCompanyCodes()
}

const clearCompany = () => {
  selectedCompany.value = null
  companySearch.value = ''
  codes.value = []
  stats.value = { total: 0, active: 0, expired: 0, depleted: 0, inactive: 0 }
}

const loadForCompany = () => {
  if (!selectedCompany.value) searchCompanies()
}

// Codes
const codes = ref<DiscountCode[]>([])
const stats = ref<DiscountStats>({ total: 0, active: 0, expired: 0, depleted: 0, inactive: 0 })
const codesLoading = ref(false)
const filterStatus = ref('')
const searchCode = ref('')
const selectedCode = ref<DiscountCode | null>(null)

const filteredCodes = computed(() => {
  let list = codes.value
  if (filterStatus.value) list = list.filter(c => c.status === filterStatus.value)
  if (searchCode.value) list = list.filter(c => c.code.includes(searchCode.value.toUpperCase()))
  return list
})

const loadCompanyCodes = async () => {
  if (!selectedCompany.value) return
  codesLoading.value = true
  try {
    const [codesRes, statsRes] = await Promise.all([
      svc.list(selectedCompany.value.id, { limit: 500 }),
      svc.getStats(selectedCompany.value.id),
    ])
    if (codesRes.success) codes.value = codesRes.data as DiscountCode[]
    if (statsRes.success) stats.value = statsRes.data as DiscountStats
  } catch { showToast('Failed to load codes', 'error') } finally { codesLoading.value = false }
}

// Create modal
const showCreateModal = ref(false)
const createLoading = ref(false)
const createError = ref('')
const defaultForm = (): CreateDiscountPayload & { audience?: string; allowed_pharmacy_ids?: number[] } => ({
  code: '', discount_type: 'percentage', discount_value: 0,
  description: '', min_order_amount: null, max_discount_amount: null,
  max_uses: null, max_uses_per_customer: 1, valid_from: null, valid_until: null,
  audience: 'all', allowed_pharmacy_ids: [],
})
const createForm = ref(defaultForm())

const isCreateValid = computed(() =>
  !!createForm.value.code.trim() && (createForm.value.discount_type === 'free_shipping' || !!createForm.value.discount_value)
)

const openCreateModal = () => { createForm.value = defaultForm(); createError.value = ''; showCreateModal.value = true }

const submitCreate = async () => {
  if (!selectedCompany.value) return
  createLoading.value = true; createError.value = ''
  try {
    const payload = { ...createForm.value, company_id: selectedCompany.value.id }
    if (payload.discount_type === 'free_shipping') payload.discount_value = 0
    const res = await svc.create(payload as any)
    if (!res.success) { createError.value = res.message || 'Failed'; return }
    showCreateModal.value = false
    showToast(`Code ${(res.data as DiscountCode).code} created`)
    await loadCompanyCodes()
  } catch (e: any) { createError.value = e?.message || 'Failed' } finally { createLoading.value = false }
}

const openDetail = async (code: DiscountCode) => {
  try {
    const res = await svc.getById(selectedCompany.value.id, code.id)
    selectedCode.value = res.success ? (res.data as DiscountCode) : code
  } catch { selectedCode.value = code }
}

// Tabs
const activeTab = ref<'company' | 'global'>('company')

// Global codes
const globalCodes = ref<DiscountCode[]>([])
const globalStats = ref<DiscountStats>({ total: 0, active: 0, expired: 0, depleted: 0, inactive: 0 })
const globalLoading = ref(false)
const globalFilterStatus = ref('')
const globalSearchCode = ref('')
const selectedGlobalCode = ref<DiscountCode | null>(null)

const filteredGlobalCodes = computed(() => {
  let list = globalCodes.value
  if (globalFilterStatus.value) list = list.filter(c => c.status === globalFilterStatus.value)
  if (globalSearchCode.value) list = list.filter(c => c.code.includes(globalSearchCode.value.toUpperCase()))
  return list
})

const loadGlobalCodes = async () => {
  globalLoading.value = true
  try {
    const [codesRes, statsRes] = await Promise.all([
      svc.list(null, { limit: 500 }),
      svc.getStats(null),
    ])
    if (codesRes.success) globalCodes.value = codesRes.data as DiscountCode[]
    if (statsRes.success) globalStats.value = statsRes.data as DiscountStats
  } catch { showToast('Failed to load global codes', 'error') } finally { globalLoading.value = false }
}

// Global create modal
const showGlobalCreateModal = ref(false)
const globalCreateLoading = ref(false)
const globalCreateError = ref('')
const globalCreateForm = ref(defaultForm())

const isGlobalCreateValid = computed(() =>
  !!globalCreateForm.value.code.trim() && (globalCreateForm.value.discount_type === 'free_shipping' || !!globalCreateForm.value.discount_value)
)

const openGlobalCreateModal = () => { globalCreateForm.value = defaultForm(); globalCreateError.value = ''; showGlobalCreateModal.value = true }

const submitGlobalCreate = async () => {
  globalCreateLoading.value = true; globalCreateError.value = ''
  try {
    const payload = { ...globalCreateForm.value, company_id: null }
    if (payload.discount_type === 'free_shipping') payload.discount_value = 0
    const res = await svc.create(payload as any)
    if (!res.success) { globalCreateError.value = res.message || 'Failed'; return }
    showGlobalCreateModal.value = false
    showToast(`Global code ${(res.data as DiscountCode).code} created`)
    await loadGlobalCodes()
  } catch (e: any) { globalCreateError.value = e?.message || 'Failed' } finally { globalCreateLoading.value = false }
}

// Batch generation
const showBatchCreateModal = ref(false)
const batchCreateLoading = ref(false)
const batchCreateError = ref('')
const defaultBatchForm = () => ({
  prefix: '', suffix_length: 6, count: 10,
  discount_type: 'percentage' as const, discount_value: 0,
  description: '', min_order_amount: null, max_discount_amount: null,
  max_uses: null, max_uses_per_customer: 1, valid_from: null, valid_until: null,
  audience: 'all' as const, allowed_pharmacy_ids: [] as number[],
})
const batchCreateForm = ref(defaultBatchForm())

const isBatchCreateValid = computed(() =>
  !!batchCreateForm.value.prefix.trim() && (batchCreateForm.value.discount_type === 'free_shipping' || !!batchCreateForm.value.discount_value) && batchCreateForm.value.count > 0
)

const openBatchCreateModal = () => {
  batchCreateForm.value = defaultBatchForm()
  batchCreateError.value = ''
  showBatchCreateModal.value = true
}

const submitBatchCreate = async () => {
  batchCreateLoading.value = true; batchCreateError.value = ''
  try {
    if (batchCreateForm.value.prefix.length + batchCreateForm.value.suffix_length > 50) {
      batchCreateError.value = 'Prefix + suffix length cannot exceed 50 characters'
      return
    }
    const res = await svc.batchCreate(batchCreateForm.value as any)
    if (!res.success) { batchCreateError.value = res.message || 'Failed'; return }
    showBatchCreateModal.value = false
    showToast(`Generated ${(res.data as any).count} codes`)
    await loadGlobalCodes()
  } catch (e: any) { batchCreateError.value = e?.message || 'Failed' } finally { batchCreateLoading.value = false }
}

const openGlobalDetail = async (code: DiscountCode) => {
  try {
    const res = await svc.getById(null, code.id)
    selectedGlobalCode.value = res.success ? (res.data as DiscountCode) : code
  } catch { selectedGlobalCode.value = code }
}

const confirmGlobalDeactivate = (code: DiscountCode) => {
  confirmDialog.value = {
    show: true,
    title: 'Deactivate Global Code',
    message: `Deactivate "${code.code}"? This affects all pharmacies.`,
    confirmLabel: 'Deactivate',
    loading: false,
    action: async () => await svc.deactivate(null, code.id).then(() => loadGlobalCodes()),
  }
}

const reactivateGlobal = async (code: DiscountCode) => {
  globalLoading.value = true
  try {
    const res = await svc.update(null, code.id, { is_active: true })
    if (res.success) { showToast('Code reactivated'); await loadGlobalCodes() }
    else showToast(res.message || 'Failed', 'error')
  } catch (e: any) { showToast(e?.message || 'Failed', 'error') } finally { globalLoading.value = false }
}

// Confirm dialog
const confirmDialog = ref({ show: false, title: '', message: '', confirmLabel: 'Confirm', loading: false, action: async () => {} })

const confirmDeactivate = (code: DiscountCode) => {
  confirmDialog.value = {
    show: true,
    title: 'Deactivate Code',
    message: `Deactivate "${code.code}"?`,
    confirmLabel: 'Deactivate',
    loading: false,
    action: async () => {
      await svc.deactivate(selectedCompany.value.id, code.id)
      if (selectedCode.value?.id === code.id) selectedCode.value = null
      showToast(`${code.code} deactivated`)
      await loadCompanyCodes()
    },
  }
}

const reactivate = async (code: DiscountCode) => {
  try {
    await svc.update(selectedCompany.value.id, code.id, { is_active: true })
    showToast(`${code.code} re-activated`)
    await loadCompanyCodes()
    if (selectedCode.value?.id === code.id) {
      const res = await svc.getById(selectedCompany.value.id, code.id)
      if (res.success) selectedCode.value = res.data as DiscountCode
    }
  } catch (e: any) { showToast(e?.message || 'Failed', 'error') }
}

const runConfirm = async () => {
  confirmDialog.value.loading = true
  try { await confirmDialog.value.action(); confirmDialog.value.show = false }
  catch (e: any) { showToast(e?.message || 'Failed', 'error') }
  finally { confirmDialog.value.loading = false }
}

// Utils
const toast = ref<{ text: string; type: string } | null>(null)
const showToast = (text: string, type = 'success') => { toast.value = { text, type }; setTimeout(() => { toast.value = null }, 4000) }
const typeLabel = (t: string) => ({ percentage: '% Off', flat_amount: 'Fixed', free_shipping: 'Free Ship' }[t] ?? t)
const formatValue = (c: DiscountCode) => {
  if (c.discount_type === 'percentage') return `${c.discount_value}%`
  if (c.discount_type === 'flat_amount') return `GHS ${Number(c.discount_value).toFixed(2)}`
  return 'Free shipping'
}
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// Lifecycle
onMounted(() => { loadGlobalCodes() })
</script>

<style scoped>
.admin-discounts { max-width: 1100px; margin: 0 auto; padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
.page-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
.page-subtitle { color: #6b7280; margin: 0; font-size: 0.875rem; }

/* Tabs */
.tabs-bar { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem; }
.tab-btn { padding: 0.75rem 1.5rem; border: none; background: none; color: #6b7280; font-weight: 600; font-size: 0.875rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.15s; display: flex; align-items: center; gap: 0.5rem; }
.tab-btn:hover { color: #4f46e5; }
.tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; background: #4f46e5; color: white; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }

/* Global codes header */
.global-header { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.global-desc { margin: 0; color: #6b7280; font-size: 0.875rem; }
.global-desc strong { color: #111827; font-weight: 600; }
.global-label { color: #d97706; font-weight: 600; }

/* Audience options */
.audience-options { display: flex; flex-direction: column; gap: 0.5rem; }
.radio-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; }
.radio-label input[type="radio"] { cursor: pointer; }

/* Pharmacy selector */
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; padding: 0.5rem 0; }
.checkbox-label input[type="checkbox"] { cursor: pointer; }
.selected-pharmacies { padding: 0.5rem; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #16a34a; }

/* Batch modal */
.mb-2 { margin-bottom: 0.5rem; }

/* Company selector */
.company-selector-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; }
.selector-label { font-size: 0.8125rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.5rem; }
.selector-row { display: flex; gap: 0.75rem; }
.selector-row .form-control { flex: 1; }
.search-results { margin-top: 0.5rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.result-item { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: white; border: none; cursor: pointer; text-align: left; border-bottom: 1px solid #f3f4f6; transition: background 0.1s; }
.result-item:last-child { border-bottom: none; }
.result-item:hover, .result-item.selected { background: #faf5ff; }
.result-item strong { color: #111827; font-size: 0.875rem; }
.result-domain { font-size: 0.75rem; color: #9ca3af; font-family: monospace; }
.selected-chip { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 0.375rem 0.75rem; font-size: 0.8125rem; font-weight: 600; color: #166534; }
.chip-icon { color: #16a34a; }
.chip-domain { color: #6b7280; font-family: monospace; font-weight: 400; font-size: 0.75rem; }
.chip-clear { background: none; border: none; cursor: pointer; color: #6b7280; padding: 0; display: flex; }

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
.stat-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem; text-align: center; }
.stat-card.active { border-color: #a7f3d0; background: #f0fdf4; }
.stat-card.expired { border-color: #fecaca; background: #fef2f2; }
.stat-card.depleted { border-color: #fde68a; background: #fffbeb; }
.stat-value { font-size: 1.625rem; font-weight: 800; color: #111827; }
.stat-card.active .stat-value { color: #059669; }
.stat-card.expired .stat-value { color: #dc2626; }
.stat-card.depleted .stat-value { color: #d97706; }
.stat-label { font-size: 0.7rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-top: 0.2rem; }

/* Filters */
.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
.filter-group .form-control { min-width: 160px; }
.filter-group.search-filter .form-control { min-width: 220px; }

/* Table */
.table-container { background: white; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.codes-table { width: 100%; border-collapse: collapse; }
.codes-table thead { background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
.codes-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
.codes-table td { padding: 0.8rem 1rem; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; color: #111827; }
.clickable-row { cursor: pointer; } .clickable-row:hover { background: #fafafa; }
.code-tag { font-family: monospace; font-weight: 700; background: #f3e8ff; color: #7c3aed; padding: 0.175rem 0.45rem; border-radius: 4px; letter-spacing: 0.05em; font-size: 0.8125rem; }
.muted { color: #9ca3af; font-size: 0.8125rem; }

.type-badge { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.type-percentage { background: #dbeafe; color: #1d4ed8; }
.type-flat_amount { background: #dcfce7; color: #166534; }
.type-free_shipping { background: #fef3c7; color: #92400e; }
.status-badge { display: inline-block; padding: 0.175rem 0.55rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.status-active { background: #dcfce7; color: #166534; }
.status-expired { background: #fee2e2; color: #991b1b; }
.status-depleted { background: #fef3c7; color: #92400e; }
.status-inactive { background: #f3f4f6; color: #6b7280; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.3rem; border-radius: 5px; color: #9ca3af; transition: all 0.15s; }
.btn-icon.danger:hover { background: #fee2e2; color: #dc2626; }
.btn-icon:not(.danger):hover { background: #f0fdf4; color: #16a34a; }

/* Empty / loading / no-company */
.empty-state, .loading-state, .no-company-state { text-align: center; padding: 3rem 2rem; color: #9ca3af; }
.no-company-state { background: white; border: 1px dashed #e5e7eb; border-radius: 10px; }
.mt-3 { margin-top: 0.75rem; }

/* Buttons */
.btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.575rem 1.1rem; background: #4f46e5; color: white; border: none; border-radius: 7px; font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: #4338ca; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.575rem 1.1rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 7px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
.btn-secondary:hover:not(:disabled) { background: #f9fafb; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.575rem 1.1rem; background: #ef4444; color: white; border: none; border-radius: 7px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Forms */
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.req { color: #ef4444; }
.form-control { padding: 0.575rem 0.8rem; border: 1px solid #d1d5db; border-radius: 7px; font-size: 0.875rem; }
.form-control:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
.code-input { text-transform: uppercase; font-family: monospace; font-weight: 700; letter-spacing: 0.08em; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.error-msg { color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem; padding: 0.625rem; background: #fee2e2; border-radius: 6px; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-content { background: white; border-radius: 12px; width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-content.modal-sm { max-width: 400px; }
.modal-header { padding: 1.1rem 1.4rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem; }
.modal-header h3 { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.modal-company { font-size: 0.75rem; color: #6b7280; }
.modal-close { background: none; border: none; cursor: pointer; padding: 0.3rem; border-radius: 5px; color: #6b7280; }
.modal-body { padding: 1.4rem; }
.modal-footer { padding: 1rem 1.4rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 0.75rem; }

/* Drawer */
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; }
.drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 380px; max-width: 95vw; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); display: flex; flex-direction: column; z-index: 201; }
.drawer-header { padding: 1.1rem 1.4rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; flex-shrink: 0; }
.drawer-code { font-family: monospace; font-size: 1.125rem; font-weight: 800; color: #7c3aed; letter-spacing: 0.08em; }
.ml-2 { margin-left: 0.5rem; } .ml-auto { margin-left: auto; }
.drawer-body { flex: 1; overflow-y: auto; padding: 1.4rem; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.detail-item { display: flex; flex-direction: column; gap: 0.2rem; }
.dl { font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; }
.dv { font-size: 0.9rem; color: #111827; font-weight: 500; }
.drawer-actions { border-top: 1px solid #e5e7eb; padding-top: 1.1rem; }

/* Toast */
.message-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.1rem; background: #10b981; color: white; border-radius: 7px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 300; animation: slideIn 0.2s ease; font-size: 0.875rem; font-weight: 500; }
.message-toast.message-error { background: #ef4444; }
@keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 768px) {
  .admin-discounts { padding: 1rem; }
  .page-header { flex-direction: column; gap: 0.75rem; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .filter-bar { flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .drawer { width: 100%; top: auto; height: 80vh; border-radius: 12px 12px 0 0; }
}
</style>
