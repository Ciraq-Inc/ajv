<!-- Extracted from pages/admin/fulfillment/order-requests.vue — pharmacy response capture modal -->
<template>
  <div class="workspace-nested-overlay" @click.self="$emit('close')">
    <div class="workspace-nested-modal response-capture-modal">
      <div class="workspace-nested-head">
        <div>
          <span class="workspace-nested-label">Pharmacy Response</span>
          <h4>
            {{ modal.pharmacy?.pharmacy_name }}
            <span class="response-mode-badge" :class="'response-mode-badge--' + modal.mode">
              {{ modal.mode === 'full' ? 'Full availability' : 'Partial availability' }}
            </span>
          </h4>
          <p v-if="pharmacyEntry" class="response-modal-pharmacy-summary">
            <template v-if="(pharmacyEntry.request_count ?? 0) > 0">
              {{ pharmacyEntry.request_count }} order{{ pharmacyEntry.request_count !== 1 ? 's' : '' }} fulfilled
              <template v-if="pharmacyEntry.last_transaction_at"> · last {{ formatRelativeTime(pharmacyEntry.last_transaction_at) }}</template>
            </template>
            <template v-else>No orders fulfilled yet</template>
          </p>
        </div>
        <button type="button" class="modal-close" @click="$emit('close')">
          <XMarkIcon class="close-svg" />
        </button>
      </div>

      <div class="workspace-nested-content">
        <div class="response-modal-summary">
          <span class="response-modal-summary-count">
            {{ modal.items.filter(i => i.available).length }} of {{ modal.items.length }} items available
          </span>
          <span v-if="modal.mode === 'partial'" class="response-modal-summary-hint">
            Check each item the pharmacy has in stock
          </span>
          <span v-if="sourcingMode === 'split'" class="response-modal-split-note">
            Split mode — showing {{ modal.items.length }} unsourced item{{ modal.items.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="response-items-list">
          <div
            v-for="item in modal.items"
            :key="String(item.item_id ?? Math.random())"
            class="response-item-row"
            :class="{ 'response-item-row--available': item.available, 'response-item-row--unavailable': !item.available }"
          >
            <!-- Availability toggle -->
            <label class="response-item-checkbox">
              <input type="checkbox" v-model="item.available" />
              <span class="response-item-name">{{ item.product_name }}</span>
              <span class="response-item-req">
                ×{{ item.requested_quantity }}<template v-if="item.requested_unit"> {{ item.requested_unit }}</template>
              </span>
            </label>

            <!-- Detail fields — only shown when available -->
            <div v-if="item.available" class="response-item-fields">
              <div class="response-field-group">
                <label>Qty available</label>
                <input
                  v-model.number="item.available_quantity"
                  type="number"
                  min="1"
                  v-bind="item.requested_quantity != null ? { max: item.requested_quantity } : {}"
                  step="1"
                  disabled
                  title="Quantity is set to the requested amount and can't be edited here"
                  class="form-control response-qty-input"
                  placeholder="Qty"
                />
              </div>
              <div class="response-field-group">
                <label>Unit price (GHS)</label>
                <div class="response-price-row">
                  <input
                    v-model="item.unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control response-price-input"
                    :class="{ 'response-price-input--catalog': item.is_price_from_catalog }"
                    placeholder="e.g. 12.50"
                    @input="item.is_price_from_catalog = false"
                  />
                  <label class="response-substitute-inline">
                    <input type="checkbox" v-model="item.showSubstitute" @change="if (!item.showSubstitute) { item.allocation_type = 'exact'; item.substitute_name = ''; item.substitute_note = '' }" />
                    Substitute?
                  </label>
                </div>
                <div v-if="item.catalog_price != null" class="response-price-hint">
                  <span class="response-price-hint-label">Catalog: GHS {{ Number(item.catalog_price).toFixed(2) }}</span>
                  <span v-if="item.catalog_synced_at" class="response-price-hint-sync">· synced {{ formatRelativeTime(item.catalog_synced_at) }}</span>
                </div>
              </div>
              <template v-if="item.showSubstitute">
                <div class="response-field-group response-field-wide" style="grid-column: 1 / -1;">
                  <label>Substitute product name</label>
                  <input
                    v-model="item.substitute_name"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Panadol Extra 500mg"
                    @input="item.allocation_type = item.substitute_name ? 'substitute' : 'exact'"
                  />
                </div>
                <div class="response-field-group response-field-wide" style="grid-column: 1 / -1;">
                  <label>Substitute note</label>
                  <input
                    v-model="item.substitute_note"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Same strength, different brand"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="response-note-field">
          <label>Response note (optional)</label>
          <textarea
            :value="modal.note ?? ''"
            @input="modal.note = ($event.target as HTMLTextAreaElement).value"
            class="form-control"
            rows="2"
            placeholder="e.g. Stock arrives Thursday, only has capsules"
          />
        </div>
      </div>

      <div class="workspace-nested-actions">
        <button type="button" class="btn-secondary" @click="$emit('close')" :disabled="modal.submitting === true">
          Cancel
        </button>
        <button
          type="button"
          class="btn-primary"
          @click="$emit('submit')"
          :disabled="modal.submitting === true || modal.items.filter(i => i.available).length === 0"
        >
          {{ modal.submitting ? 'Saving…' : 'Submit Response' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface ModalItem {
  item_id?: number | string;
  product_name?: string;
  requested_quantity?: number;
  requested_unit?: string;
  available: boolean;
  available_quantity?: number;
  unit_price?: number | string | null;
  catalog_price?: number | null;
  catalog_synced_at?: string;
  is_price_from_catalog?: boolean;
  showSubstitute?: boolean;
  substitute_name?: string;
  substitute_note?: string;
  allocation_type?: string;
  [key: string]: unknown;
}

interface ModalPharmacy {
  pharmacy_id?: number | string;
  pharmacy_name?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

interface ResponseModal {
  open?: boolean;
  pharmacy?: ModalPharmacy | null;
  mode?: string;
  submitting?: boolean;
  note?: string;
  items: ModalItem[];
  [key: string]: unknown;
}

interface PharmacyLedgerEntry {
  request_count?: number;
  last_transaction_at?: string;
  [key: string]: unknown;
}

const props = defineProps<{
  modal: ResponseModal;
  pharmacyLedgerMap?: Record<string | number, PharmacyLedgerEntry>;
  sourcingMode?: string;
}>()

defineEmits<{
  close: [];
  submit: [];
}>()

// Resolve the ledger entry for the modal's pharmacy in a type-safe way
const pharmacyEntry = computed((): PharmacyLedgerEntry | undefined => {
  const pid = props.modal.pharmacy?.pharmacy_id
  if (pid == null || !props.pharmacyLedgerMap) return undefined
  return props.pharmacyLedgerMap[pid]
})

const formatRelativeTime = (d: string | undefined | null): string | null => {
  if (!d) return null
  const diffMs = Date.now() - new Date(d).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return diffMins <= 1 ? 'just now' : `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}
</script>
