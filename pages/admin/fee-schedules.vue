<template>
  <div class="fee-schedules-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Fee Schedules</h1>
        <p class="page-subtitle">Tiered delivery pricing. Drafts are mutable; published schedules are immutable and supersede each other on publish.</p>
      </div>
      <div class="header-actions">
        <button @click="fetchAll" class="btn-secondary" :disabled="loading">Refresh</button>
        <button @click="openCreateModal" class="btn-primary" :disabled="loading">+ New Draft</button>
      </div>
    </div>

    <div class="layout">
      <!-- LIST -->
      <aside class="schedule-list">
        <div class="list-header">All schedules</div>
        <div v-if="schedules.length === 0" class="list-empty">No schedules yet.</div>
        <button
          v-for="s in schedules"
          :key="s.id"
          @click="selectSchedule(s.id)"
          class="schedule-row"
          :class="{ selected: selected && selected.id === s.id }"
        >
          <div class="schedule-row-top">
            <span class="schedule-name">{{ s.name }}</span>
            <span class="status-badge" :class="statusClass(s)">{{ statusLabel(s) }}</span>
          </div>
          <div class="schedule-row-meta">
            <span v-if="s.valid_from">From {{ formatDate(s.valid_from) }}</span>
            <span v-else>Draft (unpublished)</span>
          </div>
        </button>
      </aside>

      <!-- DETAIL -->
      <section class="schedule-detail">
        <div v-if="!selected" class="detail-empty">Select a schedule to view or edit it.</div>

        <template v-else>
          <div class="detail-header">
            <div>
              <h2 class="detail-title">{{ selected.name }}</h2>
              <div class="detail-meta">
                <span class="status-badge" :class="statusClass(selected)">{{ statusLabel(selected) }}</span>
                <span v-if="selected.valid_from" class="meta-item">Activated {{ formatDate(selected.valid_from) }}</span>
                <span v-if="selected.valid_until" class="meta-item">Superseded {{ formatDate(selected.valid_until) }}</span>
                <span class="meta-item">Currency: {{ selected.currency }}</span>
              </div>
            </div>
            <div class="detail-actions">
              <button
                v-if="selected.is_draft"
                @click="publishDraft"
                class="btn-primary"
                :disabled="loading"
              >Publish</button>
            </div>
          </div>

          <!-- HEADER FIELDS -->
          <div class="setting-section">
            <div class="section-header">
              <div class="section-badge">HDR</div>
              <div>
                <h3>Schedule header</h3>
                <p>{{ selected.is_draft ? 'Editable while in draft.' : 'Read-only — published schedules cannot be edited. Create a new draft to change pricing.' }}</p>
              </div>
            </div>
            <div class="settings-grid">
              <div class="setting-item">
                <label>Name</label>
                <input v-model="header.name" :disabled="!selected.is_draft" class="form-control" />
              </div>
              <div class="setting-item">
                <label>Top-tier per-km topup (GHS/km)</label>
                <input v-model.number="header.top_tier_per_km" :disabled="!selected.is_draft" type="number" step="0.01" class="form-control" placeholder="leave blank for flat top tier" />
                <span class="setting-help">When set, distance beyond the last breakpoint adds (overrun × this rate) to the last tier's fee.</span>
              </div>
              <div class="setting-item">
                <label>Max billable km</label>
                <input v-model.number="header.max_billable_km" :disabled="!selected.is_draft" type="number" step="0.01" class="form-control" placeholder="no cap" />
                <span class="setting-help">Distances beyond this are refused at quote time.</span>
              </div>
              <div class="setting-item">
                <label>Notes</label>
                <input v-model="header.notes" :disabled="!selected.is_draft" class="form-control" />
              </div>
            </div>
            <div v-if="selected.is_draft && headerDirty" class="section-footer">
              <button @click="saveHeader" class="btn-secondary" :disabled="loading">Save header</button>
            </div>
          </div>

          <!-- TIERS -->
          <div class="setting-section">
            <div class="section-header">
              <div class="section-badge">TIER</div>
              <div>
                <h3>Tiers</h3>
                <p>Breakpoints (inclusive). Distance falls into the largest <code>from_km</code> ≤ distance. First tier must start at 0.</p>
              </div>
            </div>

            <table class="tiers-table">
              <thead>
                <tr>
                  <th>From km</th>
                  <th>Fee (GHS)</th>
                  <th>Label</th>
                  <th class="row-actions"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in selected.tiers" :key="t.id">
                  <td>
                    <input v-if="selected.is_draft" v-model.number="tierEdits[t.id].from_km" type="number" step="0.01" class="form-control compact" />
                    <span v-else>{{ Number(t.from_km).toFixed(2) }}</span>
                  </td>
                  <td>
                    <input v-if="selected.is_draft" v-model.number="tierEdits[t.id].fee_ghs" type="number" step="0.01" class="form-control compact" />
                    <span v-else>{{ Number(t.fee_ghs).toFixed(2) }}</span>
                  </td>
                  <td>
                    <input v-if="selected.is_draft" v-model="tierEdits[t.id].label" class="form-control compact" placeholder="optional" />
                    <span v-else>{{ t.label || '—' }}</span>
                  </td>
                  <td class="row-actions">
                    <template v-if="selected.is_draft">
                      <button v-if="tierDirty(t)" @click="saveTier(t.id)" class="link-btn" :disabled="loading">Save</button>
                      <button @click="deleteTier(t.id)" class="link-btn danger" :disabled="loading">Delete</button>
                    </template>
                  </td>
                </tr>
                <tr v-if="selected.tiers.length === 0">
                  <td colspan="4" class="empty-row">No tiers yet. Add the first one (must be at from_km = 0).</td>
                </tr>
              </tbody>
              <tfoot v-if="selected.is_draft">
                <tr class="add-row">
                  <td><input v-model.number="newTier.from_km" type="number" step="0.01" class="form-control compact" placeholder="from_km" /></td>
                  <td><input v-model.number="newTier.fee_ghs" type="number" step="0.01" class="form-control compact" placeholder="fee" /></td>
                  <td><input v-model="newTier.label" class="form-control compact" placeholder="label (optional)" /></td>
                  <td class="row-actions">
                    <button @click="addTier" class="link-btn" :disabled="loading || !canAddTier">+ Add</button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </template>
      </section>
    </div>

    <!-- CREATE DRAFT MODAL -->
    <div v-if="showCreate" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal">
        <h3>New draft schedule</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Name</label>
            <input v-model="createForm.name" class="form-control" placeholder="e.g. Tiered v1 - 2026 Q2" />
          </div>
          <div class="setting-item">
            <label>Top-tier per-km topup (GHS/km)</label>
            <input v-model.number="createForm.top_tier_per_km" type="number" step="0.01" class="form-control" placeholder="optional" />
          </div>
          <div class="setting-item">
            <label>Max billable km</label>
            <input v-model.number="createForm.max_billable_km" type="number" step="0.01" class="form-control" placeholder="optional" />
          </div>
          <div class="setting-item">
            <label>Clone tiers from</label>
            <select v-model="createForm.clone_from_id" class="form-control">
              <option :value="null">— blank —</option>
              <option v-for="s in schedules" :key="s.id" :value="s.id">{{ s.name }} ({{ statusLabel(s) }})</option>
            </select>
            <span class="setting-help">Optional. Copies tier rows from an existing schedule into the new draft.</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeCreateModal" class="btn-secondary" :disabled="loading">Cancel</button>
          <button @click="createDraft" class="btn-primary" :disabled="loading || !createForm.name">Create draft</button>
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
import { createFeeSchedulesService } from '~/services/feeSchedules/feeSchedulesService'

const feeSchedulesService = createFeeSchedulesService(useApi())

const loading = ref(false)
const message = ref(null)

const schedules = ref([])
const selected = ref(null)
const header = reactive({ name: '', top_tier_per_km: null, max_billable_km: null, notes: '' })
const headerOriginal = reactive({})
const tierEdits = reactive({})
const tierOriginals = reactive({})
const newTier = reactive({ from_km: null, fee_ghs: null, label: '' })

const showCreate = ref(false)
const createForm = reactive({ name: '', top_tier_per_km: null, max_billable_km: null, clone_from_id: null })

const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 4500)
}

const statusLabel = (s) => {
  if (s.is_active) return 'ACTIVE'
  if (s.is_draft) return 'DRAFT'
  return 'SUPERSEDED'
}
const statusClass = (s) => {
  if (s.is_active) return 'status-active'
  if (s.is_draft) return 'status-draft'
  return 'status-superseded'
}

const formatDate = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString() } catch (e) { return iso }
}

const fetchAll = async () => {
  loading.value = true
  try {
    const res = await feeSchedulesService.list()
    schedules.value = Array.isArray(res.data) ? res.data : []
    if (selected.value) await selectSchedule(selected.value.id)
  } catch (error) {
    showMessage(error.message || 'Failed to load schedules', 'error')
  } finally {
    loading.value = false
  }
}

const selectSchedule = async (id) => {
  loading.value = true
  try {
    const res = await feeSchedulesService.getById(id)
    selected.value = res.data
    Object.assign(header, {
      name: res.data.name,
      top_tier_per_km: res.data.top_tier_per_km != null ? Number(res.data.top_tier_per_km) : null,
      max_billable_km: res.data.max_billable_km != null ? Number(res.data.max_billable_km) : null,
      notes: res.data.notes || '',
    })
    Object.assign(headerOriginal, { ...header })
    // Reset and rebuild tier edit state
    Object.keys(tierEdits).forEach(k => delete tierEdits[k])
    Object.keys(tierOriginals).forEach(k => delete tierOriginals[k])
    for (const t of res.data.tiers || []) {
      tierEdits[t.id] = { from_km: Number(t.from_km), fee_ghs: Number(t.fee_ghs), label: t.label || '' }
      tierOriginals[t.id] = { ...tierEdits[t.id] }
    }
    Object.assign(newTier, { from_km: null, fee_ghs: null, label: '' })
  } catch (error) {
    showMessage(error.message || 'Failed to load schedule', 'error')
  } finally {
    loading.value = false
  }
}

const headerDirty = computed(() => {
  if (!selected.value) return false
  return ['name', 'top_tier_per_km', 'max_billable_km', 'notes'].some(k => header[k] !== headerOriginal[k])
})

const tierDirty = (t) => {
  const orig = tierOriginals[t.id]
  const cur = tierEdits[t.id]
  if (!orig || !cur) return false
  return cur.from_km !== orig.from_km || cur.fee_ghs !== orig.fee_ghs || (cur.label || '') !== (orig.label || '')
}

const canAddTier = computed(() => {
  return newTier.from_km !== null && newTier.from_km !== '' &&
         newTier.fee_ghs !== null && newTier.fee_ghs !== ''
})

const saveHeader = async () => {
  if (!selected.value) return
  loading.value = true
  try {
    await feeSchedulesService.updateHeader(selected.value.id, {
      name: header.name,
      top_tier_per_km: header.top_tier_per_km,
      max_billable_km: header.max_billable_km,
      notes: header.notes,
    })
    showMessage('Header saved')
    await fetchAll()
  } catch (error) {
    showMessage(error.message || 'Failed to save header', 'error')
  } finally {
    loading.value = false
  }
}

const addTier = async () => {
  if (!selected.value || !canAddTier.value) return
  loading.value = true
  try {
    await feeSchedulesService.addTier(selected.value.id, {
      from_km: newTier.from_km,
      fee_ghs: newTier.fee_ghs,
      label: newTier.label || null,
    })
    showMessage('Tier added')
    await selectSchedule(selected.value.id)
  } catch (error) {
    showMessage(error.message || 'Failed to add tier', 'error')
  } finally {
    loading.value = false
  }
}

const saveTier = async (tierId) => {
  if (!selected.value) return
  loading.value = true
  try {
    await feeSchedulesService.updateTier(selected.value.id, tierId, tierEdits[tierId])
    showMessage('Tier saved')
    tierOriginals[tierId] = { ...tierEdits[tierId] }
  } catch (error) {
    showMessage(error.message || 'Failed to save tier', 'error')
  } finally {
    loading.value = false
  }
}

const deleteTier = async (tierId) => {
  if (!selected.value) return
  if (!confirm('Delete this tier?')) return
  loading.value = true
  try {
    await feeSchedulesService.deleteTier(selected.value.id, tierId)
    showMessage('Tier deleted')
    await selectSchedule(selected.value.id)
  } catch (error) {
    showMessage(error.message || 'Failed to delete tier', 'error')
  } finally {
    loading.value = false
  }
}

const publishDraft = async () => {
  if (!selected.value) return
  if (!confirm(`Publish "${selected.value.name}"? This will supersede the currently active schedule and apply to all new quotes.`)) return
  loading.value = true
  try {
    await feeSchedulesService.publish(selected.value.id)
    showMessage('Schedule published')
    await fetchAll()
  } catch (error) {
    showMessage(error.message || 'Failed to publish', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  Object.assign(createForm, { name: '', top_tier_per_km: null, max_billable_km: null, clone_from_id: null })
  showCreate.value = true
}
const closeCreateModal = () => { showCreate.value = false }

const createDraft = async () => {
  if (!createForm.name) return
  loading.value = true
  try {
    const res = await feeSchedulesService.createDraft({ ...createForm })
    showMessage('Draft created')
    closeCreateModal()
    await fetchAll()
    if (res.data?.id) await selectSchedule(res.data.id)
  } catch (error) {
    showMessage(error.message || 'Failed to create draft', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

definePageMeta({ middleware: ['admin-auth'], layout: 'admin-layout', requiredRole: 'super_admin' })
</script>

<style scoped>
.fee-schedules-page {
  max-width: 1280px;
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

.header-actions { display: flex; gap: 0.5rem; }

.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.schedule-list {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.list-header {
  padding: 0.75rem 1rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.list-empty { padding: 1rem; color: #6b7280; font-size: 0.85rem; }

.schedule-row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background: #fff;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}

.schedule-row:hover { background: #f8fafc; }
.schedule-row.selected { background: #eff6ff; }

.schedule-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.schedule-name { font-weight: 600; color: #111827; font-size: 0.9rem; }
.schedule-row-meta { color: #6b7280; font-size: 0.75rem; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.status-active { background: #dcfce7; color: #166534; }
.status-draft { background: #fef3c7; color: #92400e; }
.status-superseded { background: #f3f4f6; color: #6b7280; }

.schedule-detail {
  min-height: 400px;
}

.detail-empty {
  background: #fff;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 1rem;
  color: #6b7280;
  text-align: center;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.detail-title { margin: 0 0 0.5rem; font-size: 1.2rem; color: #111827; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.meta-item { color: #6b7280; font-size: 0.8rem; }
.detail-actions { display: flex; gap: 0.5rem; }

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

.section-header h3 { margin: 0; font-size: 1.05rem; color: #111827; }
.section-header p { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.85rem; }

.settings-grid {
  padding: 1rem 1.25rem 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.setting-item { display: flex; flex-direction: column; gap: 0.35rem; }
.setting-item label { font-size: 0.82rem; font-weight: 600; color: #111827; }
.setting-help { font-size: 0.75rem; color: #6b7280; line-height: 1.3; }

.section-footer {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  justify-content: flex-end;
}

.form-control {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 100%;
}
.form-control:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.form-control:disabled { background: #f9fafb; color: #6b7280; }
.form-control.compact { padding: 0.4rem 0.55rem; font-size: 0.85rem; }

.tiers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.tiers-table thead th {
  text-align: left;
  padding: 0.6rem 1rem;
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e5e7eb;
}
.tiers-table tbody td { padding: 0.6rem 1rem; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.tiers-table tfoot td { padding: 0.6rem 1rem; background: #fafafa; }
.tiers-table .row-actions { white-space: nowrap; text-align: right; }
.tiers-table .empty-row { padding: 1.5rem; text-align: center; color: #6b7280; }

.add-row td:first-child { color: #6b7280; }

.btn-primary, .btn-secondary {
  padding: 0.58rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; }
.btn-primary:disabled, .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: #fff; color: #374151; border-color: #d1d5db; }

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}
.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.link-btn.danger { color: #dc2626; }

.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(17, 24, 39, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1100;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  width: 90%;
  max-width: 640px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
.modal h3 { margin: 0 0 1rem; font-size: 1.15rem; color: #111827; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }

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
.message-toast.message-error { background: #dc2626; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
