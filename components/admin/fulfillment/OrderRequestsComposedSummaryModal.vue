<!-- Extracted from pages/admin/fulfillment/order-requests.vue — composed summary modal -->
<template>
  <div class="workspace-nested-overlay" @click.self="$emit('close')">
    <div class="workspace-nested-modal composed-summary-modal">
      <div class="workspace-nested-head">
        <div>
          <span class="workspace-nested-label">Composed Summary</span>
          <h4>{{ request.request_number }} | {{ request.customer_name || 'Unknown Customer' }}</h4>
        </div>
        <button type="button" class="modal-close" @click="$emit('close')">
          <XMarkIcon class="close-svg" />
        </button>
      </div>

      <div class="workspace-nested-content composed-summary-content" style="padding: 0;">
        <div class="composed-summary-hero" style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #fdfdfd; display: flex; flex-direction: column; gap: 1rem;">
          <div class="composed-summary-stats" style="display: flex; gap: 2rem; align-items: baseline; padding-bottom: 0.5rem;">
            <span class="composed-stat-item" style="display: flex; align-items: baseline; gap: 0.5rem;">
              <span style="font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Status</span>
              <strong style="font-size: 1rem; font-weight: 600; color: #111827;">{{ formatStatus(request.status) }}</strong>
            </span>
            <div style="width: 1px; height: 1rem; background: #e5e7eb; align-self: center;"></div>
            <span class="composed-stat-item" style="display: flex; align-items: baseline; gap: 0.5rem;">
              <span style="font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Items</span>
              <strong style="font-size: 1rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">{{ Array.isArray(request.items) ? request.items.length : 0 }}</strong>
            </span>
            <div style="width: 1px; height: 1rem; background: #e5e7eb; align-self: center;"></div>
            <span class="composed-stat-item" style="display: flex; align-items: baseline; gap: 0.5rem;">
              <span style="font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Sources</span>
              <strong style="font-size: 1rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">{{ pharmacySummary?.length ?? 0 }}</strong>
            </span>
          </div>

          <div class="composed-request-status-bar" style="display: flex; gap: 1rem; align-items: center; border-radius: 6px; border: 1px solid #dbeafe; background: #eff6ff; padding: 1rem;">
            <div class="composed-request-status-copy" style="flex: 1;">
              <strong style="font-size: 0.875rem; color: #1e40af;">Master Status Update</strong>
              <p style="margin: 0; font-size: 0.75rem; color: #3b82f6;">Advance the overall request status once all lines are confirmed or fulfilled.</p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <select
                :value="summaryStatus"
                @change="$emit('update:summaryStatus', ($event.target as HTMLSelectElement).value)"
                class="form-control composed-request-status-select"
                style="min-width: 200px; background: #fff; border-color: #bfdbfe;"
              >
                <option value="">Change request status...</option>
                <option value="composed">Composed</option>
                <option value="confirming_with_pharm">Confirming With Pharm</option>
                <option value="confirmed_in_pharm">Confirmed In Pharm</option>
                <option value="paid">Paid</option>
                <option value="ready_for_pickup">Ready For Pickup</option>
                <option value="picked_up">Picked Up</option>
                <option value="out_for_delivery">Out For Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
              <button
                type="button"
                class="btn-primary"
                :disabled="loading || !summaryStatus"
                @click="$emit('update-status')"
              >
                Update Request
              </button>
            </div>
          </div>
        </div>

        <div v-if="pharmacySummary?.length" class="composed-pharmacy-summary" style="padding: 1.5rem; background: #f9fafb;">
          <div
            v-for="group in pharmacySummary"
            :key="String(group.pharmacyId ?? group.name ?? '')"
            class="composed-pharmacy-card"
            style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"
          >
            <div class="composed-pharmacy-head" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f3f4f6; background: #fcfcfc;">
              <div class="composed-pharmacy-identity">
                <span class="composed-section-kicker" style="font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase;">Assigned Pharmacy</span>
                <div class="composed-info-row" style="margin-top: 0.25rem;">
                  <strong style="font-size: 1.1rem; color: #111827;">{{ group.name || 'Unknown pharmacy' }}</strong>
                </div>
                <div class="composed-info-row" style="margin-top: 0.15rem;">
                  <span style="font-size: 0.85rem; color: #6b7280;">{{ group.phone || 'No phone on file' }}</span>
                </div>
                <div class="composed-pharmacy-meta" style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <span class="composed-meta-chip" style="font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px;">{{ (group.items?.length ?? 0) }} item{{ (group.items?.length ?? 0) !== 1 ? 's' : '' }}</span>
                  <span v-if="group.distanceKm !== null && group.distanceKm !== undefined" class="composed-meta-chip" style="font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px;">{{ formatDistance(group.distanceKm) }} away</span>
                  <span class="composed-meta-chip composed-meta-chip--value" style="font-size: 0.75rem; background: #ecfdf5; color: #047857; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 600;">GHS {{ Number(group.totalValue || 0).toFixed(2) }}</span>
                  <span
                    v-if="getGroupStatus(group)"
                    :style="getGroupStatus(group) === 'confirmed' ? 'font-size: 0.75rem; background: #dcfce7; color: #166534; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 700;' : 'font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 700;'"
                  >{{ getGroupStatus(group).replace('_', ' ') }}</span>
                </div>
              </div>
              <div class="composed-pharmacy-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;">
                <a
                  v-if="group.whatsappUrl"
                  :href="group.whatsappUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-whatsapp composed-whatsapp-btn"
                  style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border-radius: 6px; background: #10b981; color: #fff; font-size: 0.8rem; font-weight: 500; text-decoration: none;"
                >
                  <i class="ri-whatsapp-line"></i>
                  <span>Contact</span>
                </a>
                <span v-else class="composed-whatsapp-missing" style="font-size: 0.75rem; color: #6b7280; font-style: italic;">No WhatsApp</span>
                <div class="composed-status-actions" style="display: flex; gap: 0.4rem; align-items: center;">
                  <select
                    :value="(groupActions ?? {})[String(group.pharmacyId ?? group.name ?? '')]"
                    @change="$emit('update-group-action', group, ($event.target as HTMLSelectElement).value)"
                    class="form-control form-control-sm composed-status-select"
                    style="min-width: 140px;"
                  >
                    <option value="">Status...</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                    <option value="timed_out">Timed Out</option>
                  </select>
                  <button
                    type="button"
                    class="btn-secondary btn-sm"
                    :disabled="loading === true || !(groupActions ?? {})[String(group.pharmacyId ?? group.name ?? '')]"
                    @click="$emit('set-group-status', group)"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
            <div class="composed-item-list" style="padding: 0;">
              <table class="financial-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 1px solid #f3f4f6;">
                    <th style="padding: 0.75rem 1.5rem; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em;">Product</th>
                    <th style="padding: 0.75rem 1.5rem; text-align: right; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; width: 80px;">Qty</th>
                    <th style="padding: 0.75rem 1.5rem; text-align: right; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; width: 120px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="entry in group.items"
                    :key="`composed-${String(group.pharmacyId ?? group.name ?? '')}-${String(entry.id ?? '')}`"
                    style="border-bottom: 1px solid #f3f4f6;"
                  >
                    <td style="padding: 1rem 1.5rem; color: #111827; font-weight: 500;">{{ entry.productName }}</td>
                    <td style="padding: 1rem 1.5rem; text-align: right; color: #6b7280;">{{ entry.quantity }}</td>
                    <td style="padding: 1rem 1.5rem; text-align: right; color: #111827; font-weight: 600; font-variant-numeric: tabular-nums;">{{ entry.price != null ? `GHS ${Number(entry.price).toFixed(2)}` : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="selection-summary-empty">
          No composed pharmacy selections are saved on this request yet.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface PharmacyGroupItem {
  id?: number | string;
  productName?: string;
  quantity?: number;
  price?: number | null;
  [key: string]: unknown;
}

interface PharmacyGroup {
  pharmacyId?: string | number;
  name?: string;
  phone?: string;
  whatsappUrl?: string;
  distanceKm?: number | null;
  totalValue?: number;
  items?: PharmacyGroupItem[];
  [key: string]: unknown;
}

interface OrderRequest {
  status?: string;
  request_number?: string;
  customer_name?: string;
  items?: unknown[];
  [key: string]: unknown;
}

const props = defineProps<{
  request: OrderRequest;
  pharmacySummary: PharmacyGroup[];
  summaryStatus?: string;
  groupActions?: Record<string, string>;
  loading?: boolean;
}>()

defineEmits<{
  close: [];
  'update:summaryStatus': [value: string];
  'update-status': [];
  'update-group-action': [group: PharmacyGroup, action: string];
  'set-group-status': [group: PharmacyGroup];
}>()

// getGroupStatus derives the display status for a pharmacy group
// by checking groupActions first (local overrides), then the group's stored status.
const getGroupStatus = (group: PharmacyGroup): string => {
  const key = String(group?.pharmacyId ?? group?.name ?? '')
  const localAction = key ? (props.groupActions?.[key] ?? '') : ''
  if (['confirmed', 'contacted', 'declined', 'timed_out'].includes(localAction)) return localAction
  return ''
}

const STATUS_LABEL_OVERRIDES: Record<string, string> = { awaiting_method_selection: 'Payment Pending' }
const formatStatus = (status: string | undefined): string => {
  if (status && STATUS_LABEL_OVERRIDES[status]) return STATUS_LABEL_OVERRIDES[status]
  return (status ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDistance = (km: number | string | undefined): string => `${Number(km ?? 0).toFixed(1)} km`
</script>
