<template>
  <div class="fpm">
    <!-- Loading state -->
    <div v-if="sourcingLoading" class="fpm-state">
      <StateMessage
        state="loading"
        heading="Looking for nearby sources..."
        message="We're searching pharmacies close to the customer's location."
      />
    </div>

    <!-- Error state -->
    <div v-else-if="sourcingError" class="fpm-state">
      <StateMessage
        state="error"
        heading="Couldn't load nearby sources"
        message="Something went wrong while fetching nearby pharmacies. Check your connection and try refreshing sourcing."
        action-label="Retry"
        @action="$emit('retry')"
      />
    </div>

    <!-- Normal content -->
    <template v-else>
    <!-- Header -->
    <div class="fpm-header">
      <div class="fpm-header-left">
        <h4 class="fpm-title">Nearby Sources</h4>
        <span class="fpm-count">{{ filteredPharmacies.length }} found</span>
      </div>
      <div class="fpm-header-actions">
        <p v-if="hasHiddenPharmacies" class="fpm-summary-copy">
          Showing the top 3 by {{ rankingModeLabel.toLowerCase() }} so the workspace stays focused.
        </p>
        <label class="fpm-ranking-label" for="fpm-ranking-mode">Rank by</label>
        <select
          id="fpm-ranking-mode"
          v-model="rankingMode"
          class="fpm-ranking-select"
        >
          <option value="auto">Auto</option>
          <option value="distance">Distance</option>
          <option value="coverage">Coverage</option>
          <option value="missing">Missing items</option>
          <option value="balanced">Balanced</option>
        </select>
        <button @click="copyFullRequest" class="btn-copy-all">
          <ClipboardDocumentIcon class="fpm-icon-sm" />
          Copy Request Info
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredPharmacies.length === 0" class="fpm-empty">
      <StateMessage
        state="empty"
        heading="No pharmacies found nearby"
        message="Run sourcing to discover nearby pharmacies, or the customer's address may be missing."
      />
    </div>

    <!-- Pharmacy list -->
    <div v-else class="fpm-list">
        <article
          v-for="(pharm, index) in visiblePharmacies"
          :key="pharm.id"
          class="pharm-row"
          :class="{
            'pharm-row--full': pharm.fully_covers_request,
            'pharm-row--contacted': pharm.contacted_at
          }"
        >
          <div class="pharm-card-top">
            <div class="pharm-identity">
              <span class="pharm-rank-label">Source {{ index + 1 }}</span>
              <h3 class="pharm-name">{{ pharm.name }}</h3>
            </div>
            <div class="pharm-top-badge">
              <span v-if="getPrimaryPlan(pharm)?.priority_rank" class="pharm-badge fit">Plan {{ getPrimaryPlan(pharm).priority_rank }}</span>
              <span v-else-if="pharm.contacted_at" class="pharm-badge contacted">Contacted</span>
            </div>
          </div>

          <div class="pharm-meta-row">
            <span class="pharm-meta-chip">
              <MapPinIcon class="fpm-icon-xs" />
              {{ pharm.distance_km?.toFixed(1) }} km away
            </span>
            <span v-if="formatLastSync(pharm)" class="pharm-meta-chip subtle pharm-meta-chip-sync">
              {{ formatLastSync(pharm) }}
            </span>
          </div>

          <div class="pharm-summary-row">
            <p class="pharm-coverage-copy">
              <strong>{{ getMatchedCount(pharm) }}/{{ getRequestedCount() }}</strong>
              item<span v-if="getRequestedCount() !== 1">s</span> found
              <span v-if="getMissingCount(pharm) > 0"> • {{ getMissingCount(pharm) }} missing</span>
            </p>
          </div>

          <div v-if="props.request?.items?.length" class="pharm-item-list">
            <div
              v-for="status in getItemStatuses(pharm)"
              :key="status.name"
              class="pharm-item-row"
            >
              <div class="pharm-item-row-copy">
                <span class="pharm-item-row-name">{{ status.name }}</span>
                <span v-if="status.found" class="pharm-item-row-meta">
                  Price: {{ formatItemPrice(status.unitPrice) }} • In stock: {{ formatItemStock(status.availableQuantity) }}
                </span>
              </div>
              <span class="pharm-item-row-state" :class="status.found ? 'is-found' : 'is-missing'">
                {{ status.found ? 'Available' : 'Unavailable' }}
              </span>
            </div>
          </div>

          <div class="pharm-card-footer">
            <div class="pharm-footer-actions">
              <button
                @click="handleWhatsAppClick(pharm)"
                class="btn-footer-whatsapp"
                :class="{ disabled: !hasWhatsApp(pharm) }"
                :disabled="!hasWhatsApp(pharm)"
                :title="hasWhatsApp(pharm) ? 'Send via WhatsApp' : 'No WhatsApp available'"
              >
                <i class="ri-whatsapp-line fpm-icon-sm-ri" aria-hidden="true"></i>
                Message
              </button>
              <button
                @click="copyRequestText(pharm)"
                class="btn-footer-ghost"
                title="Copy request text"
              >
                <DocumentTextIcon class="fpm-icon-sm" />
                Copy
              </button>
              <button
                v-if="canSourceFrom(pharm)"
                @click="handleUsePlan(pharm)"
                class="btn-use-plan"
                :disabled="loading"
              >
                Source from Here
              </button>
            </div>
            <button
              type="button"
              class="btn-footer-toggle"
              @click="togglePharmacyDetails(pharm.id)"
            >
              {{ isExpanded(pharm.id) ? 'Hide' : 'Details' }}
              <ChevronUpIcon v-if="isExpanded(pharm.id)" class="fpm-icon-sm" />
              <ChevronDownIcon v-else class="fpm-icon-sm" />
            </button>
          </div>

          <div v-if="isExpanded(pharm.id)" class="pharm-row-details">
            <div v-if="getPlanSupportCopy(pharm)" class="pharm-plan-support">
              {{ getPlanSupportCopy(pharm) }}
            </div>
            <div class="pharm-detail-meta">
              <span class="pharm-meta-chip">Qty matched {{ Number(pharm.matched_quantity_total || 0) }}</span>
              <span v-if="pharm.location" class="pharm-meta-chip">{{ pharm.location }}</span>
              <span v-if="pharm.tel1" class="pharm-meta-chip">
                <PhoneIcon class="fpm-icon-xs" />
                {{ pharm.tel1 }}
              </span>
              <span v-if="pharm.contacted_at" class="pharm-contacted-row">
                <CheckIcon class="fpm-icon-xs" />
                Contacted at {{ formatDate(pharm.contacted_at) }}
              </span>
            </div>
          </div>
        </article>
      <button
        v-if="hasHiddenPharmacies"
        type="button"
        class="btn-show-more"
        @click="showAllPharmacies = !showAllPharmacies"
      >
        {{ showAllPharmacies ? `Show Top 3` : `Show ${sortedPharmacies.length - 3} More Pharmacies` }}
      </button>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="fpm-toast" :class="toast.type">{{ toast.text }}</div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  ClipboardDocumentIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  CheckIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/outline'
import StateMessage from '~/components/StateMessage.vue'

const props = defineProps({
  request: { type: Object, required: true },
  pharmacies: { type: Array, default: () => [] },
  candidatePlans: { type: Array, default: () => [] },
  allocationSummary: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  sourcingError: { type: Boolean, default: false },
  sourcingLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['contact', 'use-plan', 'retry'])
const toast = ref(null)
const showAllPharmacies = ref(false)
const expandedPharmacyIds = ref([])
const rankingMode = ref('auto')

const rankingModeLabel = computed(() => ({
  auto: 'System ranking',
  distance: 'distance',
  coverage: 'coverage',
  missing: 'fewest missing items',
  balanced: 'balanced score'
}[rankingMode.value] || 'system ranking'))

const filteredPharmacies = computed(() => (
  Array.isArray(props.pharmacies)
    ? props.pharmacies.filter((pharm) => getMatchedCount(pharm) > 0)
    : []
))

const getNumericDistance = (pharm) => {
  const distance = Number(pharm?.distance_km)
  return Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY
}

const getBalancedScore = (pharm) => (
  (getCoveragePercent(pharm) * 3)
  - (getMissingCount(pharm) * 16)
  - (getNumericDistance(pharm) * 6)
)

const sortedPharmacies = computed(() => {
  const list = [...filteredPharmacies.value]
  const mode = rankingMode.value

  if (mode === 'distance') {
    return list.sort((a, b) => {
      if (getNumericDistance(a) !== getNumericDistance(b)) return getNumericDistance(a) - getNumericDistance(b)
      return getMissingCount(a) - getMissingCount(b)
    })
  }

  if (mode === 'coverage') {
    return list.sort((a, b) => {
      if (getCoveragePercent(b) !== getCoveragePercent(a)) return getCoveragePercent(b) - getCoveragePercent(a)
      if (getMatchedCount(b) !== getMatchedCount(a)) return getMatchedCount(b) - getMatchedCount(a)
      return getNumericDistance(a) - getNumericDistance(b)
    })
  }

  if (mode === 'missing') {
    return list.sort((a, b) => {
      if (getMissingCount(a) !== getMissingCount(b)) return getMissingCount(a) - getMissingCount(b)
      if (getCoveragePercent(b) !== getCoveragePercent(a)) return getCoveragePercent(b) - getCoveragePercent(a)
      return getNumericDistance(a) - getNumericDistance(b)
    })
  }

  if (mode === 'balanced') {
    return list.sort((a, b) => {
      if (getBalancedScore(b) !== getBalancedScore(a)) return getBalancedScore(b) - getBalancedScore(a)
      return getNumericDistance(a) - getNumericDistance(b)
    })
  }

  return list
})

const visiblePharmacies = computed(() => (
  showAllPharmacies.value ? sortedPharmacies.value : sortedPharmacies.value.slice(0, 3)
))

const hasHiddenPharmacies = computed(() => sortedPharmacies.value.length > 3)

const isExpanded = (pharmacyId) => expandedPharmacyIds.value.includes(Number(pharmacyId))

const togglePharmacyDetails = (pharmacyId) => {
  const normalizedId = Number(pharmacyId)
  if (expandedPharmacyIds.value.includes(normalizedId)) {
    expandedPharmacyIds.value = expandedPharmacyIds.value.filter((id) => id !== normalizedId)
    return
  }
  expandedPharmacyIds.value = [...expandedPharmacyIds.value, normalizedId]
}

const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  setTimeout(() => { toast.value = null }, 3000)
}

const formatDate = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const getRequestedCount = () => {
  const total = Array.isArray(props.request?.items) ? props.request.items.length : 0
  return total > 0 ? total : 1
}

const getMatchedCount = (pharm) => {
  const matched = Number(pharm?.matched_item_count || 0)
  if (!Number.isFinite(matched) || matched < 0) return 0
  return matched
}

const getCoveragePercent = (pharm) => {
  const requested = getRequestedCount()
  const matched = getMatchedCount(pharm)
  const pct = Math.round((matched / requested) * 100)
  return Math.max(0, Math.min(100, pct))
}

const getMissingCount = (pharm) => {
  const missing = Number(pharm?.missing_item_count)
  if (Number.isFinite(missing) && missing >= 0) return missing
  return Math.max(0, getRequestedCount() - getMatchedCount(pharm))
}

const getCoverageSummary = (pharm) => {
  const matched = getMatchedCount(pharm)
  const requested = getRequestedCount()
  const missing = getMissingCount(pharm)

  if (pharm?.fully_covers_request) {
    return `Can cover all ${requested} requested item${requested !== 1 ? 's' : ''}.`
  }

  if (matched === 0) {
    return 'No confirmed product match yet from this source.'
  }

  const parts = [`Can cover ${matched} of ${requested} item${requested !== 1 ? 's' : ''}`]
  if (missing > 0) parts.push(`${missing} still missing`)
  return `${parts.join(' • ')}.`
}

const formatLastSync = (pharm) => {
  const days = Number(pharm?.days_since_last_sync)
  if (!Number.isFinite(days) || days < 0) return ''
  if (days === 0) return 'Synced today'
  if (days === 1) return 'Synced 1 day ago'
  return `Synced ${days} days ago`
}

const getPrimaryPlan = (pharm) => {
  const pharmacyId = Number(pharm?.id || pharm?.pharmacy_id || 0)
  if (!pharmacyId || !Array.isArray(props.candidatePlans)) return null

  return props.candidatePlans
    .filter((plan) =>
      Array.isArray(plan?.pharmacies)
      && plan.pharmacies.some((entry) => Number(entry?.pharmacy_id || 0) === pharmacyId)
    )
    .sort((a, b) => {
      if (Number(a.priority_rank || 999) !== Number(b.priority_rank || 999)) {
        return Number(a.priority_rank || 999) - Number(b.priority_rank || 999)
      }
      return Number(a.stop_count || 0) - Number(b.stop_count || 0)
    })[0] || null
}

const canSourceFrom = (pharm) => {
  if (getPrimaryPlan(pharm)) return true
  return getMatchedCount(pharm) > 0
}

const handleUsePlan = (pharm) => {
  const plan = getPrimaryPlan(pharm)
  if (plan) {
    emit('use-plan', { plan, pharmacy: pharm })
    return
  }
  emit('use-plan', { pharmacy: pharm, fallback: true })
}

const getFoundItems = (pharm) => {
  const pharmacyId = Number(pharm?.id || pharm?.pharmacy_id || 0)
  const plan = getPrimaryPlan(pharm)
  if (Array.isArray(plan?.items) && plan.items.length) {
    return plan.items.filter((item) => {
      if (Array.isArray(item?.allocations) && item.allocations.length) {
        return item.allocations.some((allocation) => Number(allocation?.pharmacy_id || 0) === pharmacyId && Number(allocation?.matched_quantity || 0) > 0)
      }
      return Number(item?.source_pharmacy_id || 0) === pharmacyId && Number(item?.matched_quantity || 0) > 0
    })
  }

  if (Array.isArray(pharm?.coverage_items) && pharm.coverage_items.length) {
    return pharm.coverage_items.filter((item) => Number(item?.matched_quantity || 0) > 0)
  }

  return []
}

const getPlanSupportCopy = (pharm) => {
  const plan = getPrimaryPlan(pharm)
  if (!plan) return ''

  if (Number(plan.stop_count || 0) <= 1) {
    return `${plan.label}. This source alone likely covers ${plan.likely_covered_item_count || 0} of ${getRequestedCount()} requested items.`
  }

  const extraSources = Math.max(Number(plan.stop_count || 0) - 1, 0)
  return `${plan.label}. This sourcing option adds ${extraSources} more source${extraSources !== 1 ? 's' : ''} to cover ${plan.likely_covered_item_count || 0} of ${getRequestedCount()} requested items.`
}

const getItemStatuses = (pharm) => {
  const requested = Array.isArray(props.request?.items) ? props.request.items : []
  if (!requested.length) return []

  const pharmacyId = Number(pharm?.id || pharm?.pharmacy_id || 0)
  const foundItems = getFoundItems(pharm)
  const foundById = new Map()
  const foundByName = new Map()

  foundItems.forEach((item) => {
    const allocation = Array.isArray(item?.allocations)
      ? item.allocations.find((entry) => Number(entry?.pharmacy_id || 0) === pharmacyId)
      : null
    const itemId = Number(item?.item_id || item?.id || 0)
    const itemName = String(item?.product_name || item?.name || '').toLowerCase().trim()
    const unitPriceRaw = allocation?.unit_price ?? item?.unit_price
    const availableQuantityRaw = allocation?.available_quantity ?? item?.available_quantity
    const matchedQuantityRaw = allocation?.matched_quantity ?? item?.matched_quantity
    const statusDetails = {
      unitPrice: unitPriceRaw == null ? null : Number(unitPriceRaw),
      availableQuantity: availableQuantityRaw == null ? null : Number(availableQuantityRaw),
      matchedQuantity: matchedQuantityRaw == null ? null : Number(matchedQuantityRaw)
    }

    if (itemId > 0) foundById.set(itemId, statusDetails)
    if (itemName) foundByName.set(itemName, statusDetails)
  })

  return requested.map((item) => {
    const itemId = Number(item.id || item.item_id || 0)
    const itemName = String(item.product_name || item.name || '').toLowerCase().trim()
    const matched = (itemId > 0 && foundById.get(itemId)) || foundByName.get(itemName) || null

    return {
      name: item.product_name || item.name || 'Item',
      found: Boolean(matched),
      unitPrice: matched?.unitPrice ?? null,
      availableQuantity: matched?.availableQuantity ?? null,
      matchedQuantity: matched?.matchedQuantity ?? null
    }
  })
}

const formatItemPrice = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) return 'n/a'
  return `GHS ${amount.toFixed(2)}`
}

const formatItemStock = (value) => {
  const stock = Number(value)
  if (!Number.isFinite(stock) || stock < 0) return 'n/a'
  return `${stock}`
}

const hasWhatsApp = (pharm) =>
  Boolean(pharm?.whatsapp_url && String(pharm.whatsapp_url).trim())

const handleWhatsAppClick = (pharm) => {
  if (!hasWhatsApp(pharm)) {
    showToast(`No WhatsApp number for ${pharm?.name || 'this pharmacy'}`, 'error')
    return
  }
  emit('contact', pharm)
}

const formatRequestDetails = () => {
  const items = props.request.items
    .map(item => `- ${item.product_name} x${item.quantity}`)
    .join('\n')
  return `*Order Request #${props.request.request_number}*\n\n*Items:*\n${items}\n\n*Delivery Address:*\n${props.request.delivery_address || 'Not set'}\n\n*Customer Notes:*\n${props.request.customer_notes || 'None'}`
}

const copyRequestText = (pharm) => {
  navigator.clipboard.writeText(formatRequestDetails())
  showToast(`Copied items for ${pharm.name}`)
}

const copyFullRequest = () => {
  navigator.clipboard.writeText(formatRequestDetails())
  showToast('Full request info copied to clipboard')
}
</script>

<style scoped>
.fpm {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fpm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.fpm-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.fpm-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.fpm-ranking-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748b;
}

.fpm-ranking-select {
  min-height: 38px;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  border: 1px solid #dbe4ee;
  background: #fff;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
}

.fpm-ranking-select:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.fpm-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.fpm-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.fpm-summary-copy {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #64748b;
}

.fpm-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1rem;
}

.fpm-icon-sm {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.fpm-icon-xs {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.btn-copy-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 38px;
  padding: 0.65rem 0.95rem;
  border-radius: 10px;
  border: 1px solid #dbe4ee;
  background: #f8fafc;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-all:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e3a8a;
}

.btn-show-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  min-height: 38px;
  padding: 0.65rem 0.95rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-show-more:hover {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.fpm-state {
  padding: 0.5rem;
}

.fpm-empty {
  padding: 0.5rem;
}

.fpm-empty-icon {
  width: 34px;
  height: 34px;
  color: #94a3b8;
}

.fpm-empty-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.fpm-empty-sub {
  margin: 0;
  font-size: 0.78rem;
  color: #64748b;
}

.pharm-row {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1rem 1.1rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s, background 0.18s;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.pharm-row:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.08);
}

.pharm-row--full {
  border-color: #c7d2fe;
  background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
}

.pharm-row--contacted:not(.pharm-row--full) {
  border-color: #ddd6fe;
}

.pharm-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pharm-identity {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  flex: 1;
}

.pharm-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid #eef2f7;
}

.pharm-footer-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

/* Source from Here — primary solid */
.btn-use-plan {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 0.85rem;
  border-radius: 7px;
  background: #1d4ed8;
  border: 1px solid #1d4ed8;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.btn-use-plan:hover:not(:disabled) {
  background: #1e40af;
  border-color: #1e40af;
}
.btn-use-plan:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Copy + WhatsApp — ghost outlined */
.btn-footer-ghost,
.btn-footer-whatsapp,
.btn-footer-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  height: 32px;
  padding: 0 0.65rem;
  border-radius: 7px;
  font-size: 0.73rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
}

.btn-footer-ghost {
  background: #f8fafc;
  border: 1px solid #dbe4ee;
  color: #475569;
}
.btn-footer-ghost:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.btn-footer-whatsapp {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}
.btn-footer-whatsapp:hover:not(:disabled):not(.disabled) {
  background: #dcfce7;
  border-color: #86efac;
}
.btn-footer-whatsapp.disabled,
.btn-footer-whatsapp:disabled {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.fpm-icon-sm-ri {
  font-size: 1.15rem;
  line-height: 1;
}

/* Details toggle — muted text style */
.btn-footer-toggle {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  font-size: 0.71rem;
  padding: 0 0.4rem;
}
.btn-footer-toggle:hover {
  color: #475569;
  border-color: #e2e8f0;
  background: #f8fafc;
}

.pharm-rank-label {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  height: 22px;
  padding: 0 0.6rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.pharm-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pharm-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.58rem;
  border-radius: 999px;
  font-size: 0.67rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid transparent;
}

.pharm-badge.fit       { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
.pharm-badge.contacted { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }
.pharm-badge.pending   { background: #f1f5f9; color: #64748b; border-color: #e2e8f0; }

.pharm-meta-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.35rem;
  align-items: center;
  min-width: 0;
}

.pharm-summary-row,
.pharm-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.pharm-top-badge {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-shrink: 0;
}

.pharm-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  font-size: 0.73rem;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
}

.pharm-meta-chip.subtle {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.pharm-meta-chip-sync {
  margin-left: auto;
  white-space: nowrap;
}

.pharm-meta-chip.warn {
  background: #eef2ff;
  color: #4338ca;
}

.pharm-item-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.4rem 0.55rem;
}

.pharm-item-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.42rem 0.58rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fbfcfd;
}

.pharm-item-row-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.pharm-item-row-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.73rem;
  font-weight: 600;
  color: #334155;
}

.pharm-item-row-meta {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.66rem;
  color: #64748b;
}

.pharm-item-row-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pharm-item-row-state.is-found {
  color: #0f172a;
  border-color: #cbd5e1;
  background: #f8fafc;
}

.pharm-item-row-state.is-missing {
  color: #64748b;
  border-style: dashed;
  background: #ffffff;
}

.pharm-meta-chip.alt {
  background: #eef2ff;
  color: #4338ca;
}

.pharm-row-details {
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.pharm-coverage-copy {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #475569;
}

.pharm-plan-support {
  margin: 0 0 0.6rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid #dbe4ef;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #334155;
}

.pharm-contacted-row {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.73rem;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
}

@media (max-width: 920px) {
  .fpm-header {
    flex-direction: column;
    align-items: stretch;
  }

  .fpm-header-actions {
    justify-content: flex-start;
  }

  .fpm-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .fpm-header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-copy-all,
  .btn-show-more {
    width: 100%;
  }

  .pharm-card-top {
    align-items: flex-start;
  }

  .pharm-top-badge {
    align-self: flex-start;
  }

  .pharm-name {
    white-space: normal;
  }

  .pharm-card-footer {
    flex-wrap: wrap;
  }

  .pharm-footer-actions {
    flex: 1;
  }

  .btn-use-plan {
    flex: 1;
  }
}

/* ── Toast ─────────────────────────────────────── */
.fpm-toast {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  background: #10b981;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
  z-index: 10;
  animation: fpmSlideIn 0.22s ease-out;
}

.fpm-toast.error { background: #ef4444; }

@keyframes fpmSlideIn {
  from { transform: translateY(6px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}
</style>
