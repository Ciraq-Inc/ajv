<!-- Extracted from pages/admin/fulfillment/order-requests.vue — requests table section -->
<template>
  <div
    class="table-container"
    style="border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow-x: auto; box-shadow: 0 1px 2px rgba(0,0,0,0.02)"
  >
    <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; white-space: nowrap;">
      <thead>
        <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <th
            @click="$emit('toggle-sort', 'request_number')"
            style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; user-select: none; white-space: nowrap;"
          >
            Request # <span style="opacity: 0.5;">{{ sortKey === 'request_number' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Customer</th>
          <th
            @click="$emit('toggle-sort', 'items')"
            style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: center; cursor: pointer; user-select: none; white-space: nowrap;"
          >
            Items <span style="opacity: 0.5;">{{ sortKey === 'items' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th
            @click="$emit('toggle-sort', 'status')"
            style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; user-select: none; white-space: nowrap;"
          >
            Stage <span style="opacity: 0.5;">{{ sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; white-space: nowrap;">Next Stage</th>
          <th
            @click="$emit('toggle-sort', 'cost')"
            style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: right; cursor: pointer; user-select: none; white-space: nowrap;"
          >
            Cost <span style="opacity: 0.5;">{{ sortKey === 'cost' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Fulfillment</th>
          <th
            @click="$emit('toggle-sort', 'updated_at')"
            style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; user-select: none; white-space: nowrap;"
          >
            Updated <span style="opacity: 0.5;">{{ sortKey === 'updated_at' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
          </th>
          <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="9" class="loading-cell" style="padding: 3rem; text-align: center; color: #6b7280; font-size: 0.85rem;">Loading requests...</td>
        </tr>
        <tr v-else-if="filteredRequests.length === 0">
          <td colspan="9" class="empty-cell" style="padding: 3rem; text-align: center; color: #6b7280; font-size: 0.85rem;">No requests found</td>
        </tr>
        <tr
          v-for="req in filteredRequests"
          :key="String(req.id ?? '')"
          class="table-row table-row-openable"
          :class="{ 'table-row-opening': openingRequestId === req.id }"
          tabindex="0"
          role="button"
          @click="$emit('process-request', req)"
          @keydown.enter.prevent="$emit('process-request', req)"
          @keydown.space.prevent="$emit('process-request', req)"
          :style="`border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background-color 0.15s ease; ${rowUrgencyStyle(req)}`"
          onmouseover="this.style.backgroundColor='#f9fafb'"
          onmouseout="this.style.backgroundColor=''"
        >
          <td class="request-number" style="padding: 0.875rem 1.25rem; font-weight: 600; color: #111827; font-size: 0.85rem;">{{ req.request_number }}</td>
          <td style="padding: 0.875rem 1.25rem;">
            <div class="customer-info" style="display: flex; flex-direction: column; gap: 0.2rem;">
              <span class="customer-name" style="font-weight: 500; color: #111827; font-size: 0.85rem;">{{ req.customer_name || 'N/A' }}</span>
              <span v-if="getCustomerWhatsAppUrl(req.customer_phone)" class="customer-phone customer-phone--whatsapp">
                <a
                  :href="getCustomerWhatsAppUrl(req.customer_phone)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="customer-phone-link"
                  @click.stop
                  style="color: #10b981; font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem;"
                >
                  <i class="ri-whatsapp-line customer-whatsapp-icon" aria-hidden="true"></i>
                  <span>{{ req.customer_phone || '' }}</span>
                </a>
              </span>
              <span v-else class="customer-phone" style="color: #6b7280; font-size: 0.75rem;">{{ req.customer_phone || '' }}</span>
            </div>
          </td>
          <td style="padding: 0.875rem 1.25rem; text-align: center;">
            <span class="item-count" style="display: inline-flex; align-items: center; justify-content: center; height: 1.5rem; min-width: 1.5rem; padding: 0 0.4rem; background: #f3f4f6; color: #374151; border-radius: 999px; font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums;">{{ formatRequestItemsLabel(req) }}</span>
          </td>
          <td style="padding: 0.875rem 1.25rem;">
            <span
              class="status-badge"
              :class="req.status"
              :style="req.status === 'pending' ? 'background: #fffbeb; color: #d97706; border: 1px solid #fcd34d;' : req.status === 'processing' ? 'background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;' : req.status === 'completed' ? 'background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;' : req.status === 'composed' ? 'background: #f5f3ff; color: #9333ea; border: 1px solid #d8b4fe;' : 'background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;'"
              style="font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; white-space: nowrap; text-transform: uppercase;"
            >{{ formatStatus(req.status) }}</span>
          </td>
          <td style="padding: 0.875rem 1.25rem;">
            <span v-if="getNextStageLabel(req)" style="font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; white-space: nowrap; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;">→ {{ getNextStageLabel(req) }}</span>
            <span v-else style="color: #9ca3af; font-size: 0.8rem;">—</span>
          </td>
          <td style="padding: 0.875rem 1.25rem; text-align: right; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">
            <template v-if="formatRequestCost(req) !== null">
              {{ formatRequestCost(req) }}
            </template>
            <span v-else style="color: #9ca3af; font-weight: 400;">—</span>
          </td>
          <td style="padding: 0.875rem 1.25rem;">
            <span
              v-if="req.fulfillment_type"
              class="fulfillment-badge"
              :class="req.fulfillment_type"
              :style="req.fulfillment_type === 'delivery' ? 'background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4;' : req.fulfillment_type === 'pickup' ? 'background: #fefce8; color: #0f766e; border: 1px solid #fef08a;' : 'background: #fff; color: #6b7280; border: 1px solid #e5e7eb;'"
              style="font-size: 0.7rem; font-weight: 600; text-transform: capitalize; padding: 0.15rem 0.4rem; border-radius: 4px;"
            >
              {{ req.fulfillment_type }}
            </span>
            <span v-else class="text-muted" style="color: #9ca3af;">-</span>
          </td>
          <td class="date-cell" style="padding: 0.875rem 1.25rem; color: #6b7280; font-size: 0.8rem;">{{ formatDateTime(req.updated_at || req.created_at) }}</td>
          <td style="padding: 0.875rem 1.25rem; text-align: right;">
            <div class="action-btns" style="display: flex; justify-content: flex-end;">
              <button
                type="button"
                @click.stop="$emit('process-request', req)"
                class="btn-icon-text"
                :disabled="openingRequestId === req.id"
                :title="statusFilter === 'composed' ? 'Open composed summary' : 'Open request workspace'"
                style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; border-radius: 6px; background: #faf5ff; border: 1px solid #e9d5ff; color: #6b21a8; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.15s;"
                onmouseover="this.style.background='#f3e8ff'"
                onmouseout="this.style.background='#faf5ff'"
              >
                <template v-if="openingRequestId === req.id">
                  <span class="inline-loader-spinner" aria-hidden="true" style="border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; width: 12px; height: 12px; display: inline-block; animation: spin 1s linear infinite;"></span>
                  <span>Opening...</span>
                </template>
                <template v-else>
                  <EyeIcon class="icon-sm" style="width: 0.85rem; height: 0.85rem; color: #a855f7;" />
                  <span>Process</span>
                </template>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon } from '@heroicons/vue/24/outline'
import { phoneUtils } from '~/utils/phone'

interface RequestItem {
  source_pharmacy_id?: number | string | null;
  source_product_id?: number | string | null;
  unit_price?: number | string | null;
  marked_up_price?: number | string | null;
  line_total?: number | string | null;
  quantity?: number;
  [key: string]: unknown;
}

interface OrderRequest {
  id?: number | string;
  status: string;
  request_number?: string;
  customer_name?: string;
  customer_phone?: string;
  expires_at?: string;
  fulfillment_type?: string;
  item_count?: number;
  items?: RequestItem[];
  has_prescription?: boolean;
  computed_cost?: number | string | null;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface PipelineStage {
  label: string;
  statuses: string[];
}

const PIPELINE_STAGES: PipelineStage[] = [
  { label: 'Pending',         statuses: ['pending'] },
  { label: 'Composing',       statuses: ['composing', 'composed'] },
  { label: 'Sourcing',        statuses: ['sourcing', 'confirming_with_pharm', 'processing', 'enquiry_sent'] },
  { label: 'Awaiting Input',  statuses: ['awaiting_input', 'awaiting_customer'] },
  { label: 'Payment Pending', statuses: ['payment_pending', 'awaiting_method_selection', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'] },
  { label: 'Paid',            statuses: ['paid', 'preparing', 'logistics_pending', 'driver_unavailable'] },
  { label: 'In Transit',      statuses: ['in_transit', 'driver_assigned', 'out_for_delivery', 'ready_for_pickup', 'ready_to_order'] },
  { label: 'Done',            statuses: ['delivered', 'picked_up', 'completed'] },
]

const EXPIRY_WARN_MS = 20 * 60 * 1000
const EXPIRY_CRITICAL_MS = 10 * 60 * 1000

const props = defineProps<{
  filteredRequests: OrderRequest[];
  loading?: boolean;
  openingRequestId?: number | null;
  sortKey?: string;
  sortDir?: string;
  statusFilter?: string;
}>()

defineEmits<{
  'toggle-sort': [key: string];
  'process-request': [request: OrderRequest];
}>()

const normalizeRequestStatus = (value: unknown): string => String(value ?? '').trim().toLowerCase()

const getCustomerWhatsAppUrl = (phone: string | undefined): string => {
  const digits = phoneUtils.formatWhatsApp(phone)
  return digits ? `https://wa.me/${digits}` : ''
}

const formatRequestItemsLabel = (request: OrderRequest): number | string => {
  const itemCount = Number(request?.item_count ?? (Array.isArray(request?.items) ? request.items.length : 0) ?? 0)
  if (itemCount > 0) return itemCount
  if (request?.has_prescription) return 'Rx'
  return '-'
}

const isSavedSelectionItem = (item: RequestItem): boolean => Boolean(
  Number(item?.source_pharmacy_id ?? 0) > 0
  || Number(item?.source_product_id ?? 0) > 0
  || Number(item?.unit_price ?? 0) > 0
  || Number(item?.marked_up_price ?? 0) > 0
)

const getRequestComposedCost = (req: OrderRequest): number | null => {
  const precomputed = Number(req?.computed_cost ?? null)
  if (Number.isFinite(precomputed) && precomputed > 0) return precomputed
  const items: RequestItem[] = Array.isArray(req?.items) ? req.items : []
  const sourcedItems = items.filter((item) => isSavedSelectionItem(item))
  if (!sourcedItems.length) return null
  return sourcedItems.reduce((sum, item) => {
    const lineTotal = Number(item?.line_total ?? 0)
    if (Number.isFinite(lineTotal) && lineTotal > 0) return sum + lineTotal
    const qty = Number(item?.quantity ?? 1)
    const price = Number(item?.marked_up_price ?? item?.unit_price ?? 0)
    return sum + (qty * price)
  }, 0)
}

const getNextStageLabel = (req: OrderRequest): string | null => {
  const status = normalizeRequestStatus(req?.status)
  if (!status) return null
  const idx = PIPELINE_STAGES.findIndex(s => s.statuses.includes(status))
  if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return null
  const isPickup = String(req?.fulfillment_type ?? '').toLowerCase().includes('pickup')
  if (idx === 5) return isPickup ? 'Ready for Pickup' : 'In Transit'
  if (idx === 6) return isPickup ? 'Picked Up' : 'Delivered'
  return PIPELINE_STAGES[idx + 1]?.label ?? null
}

const rowUrgencyStyle = (req: OrderRequest): string => {
  if (req.status !== 'pending' || !req.expires_at) return ''
  const remaining = new Date(req.expires_at).getTime() - Date.now()
  if (remaining <= 0) return ''
  if (remaining < EXPIRY_CRITICAL_MS) return 'background: #fff1f2 !important; border-left: 3px solid #f87171;'
  if (remaining < EXPIRY_WARN_MS) return 'background: #fffbeb !important; border-left: 3px solid #fbbf24;'
  return ''
}

const STATUS_LABEL_OVERRIDES: Record<string, string> = { awaiting_method_selection: 'Payment Pending' }
const formatStatus = (status: string | undefined): string => {
  if (status && STATUS_LABEL_OVERRIDES[status]) return STATUS_LABEL_OVERRIDES[status]
  return (status ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDateTime = (d: string | undefined): string => d
  ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  : '-'

const formatRequestCost = (req: OrderRequest): string | null => {
  const cost = getRequestComposedCost(req)
  return cost !== null ? `GHS ${cost.toFixed(2)}` : null
}
</script>
