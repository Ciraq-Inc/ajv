/**
 * Centralised status vocabulary for customer-facing order + request views.
 *
 * Why this exists: status labels and colour classes were diverging across
 * orders.vue, the home dashboard, and the (now-removed) UnifiedActivity
 * component. The same `paid` status read as "Settled" in one place and
 * "Paid" in another, etc. All customer surfaces should call into this.
 */

const STORE_ORDER_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Preparing',
  preparing: 'Preparing',
  shipped: 'In transit',
  in_transit: 'In transit',
  driver_assigned: 'Driver assigned',
  logistics_pending: 'Logistics pending',
  out_for_delivery: 'Out for delivery',
  ready_for_pickup: 'Ready for pickup',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const REQUEST_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  searching: 'Searching',
  finding_pharmacist: 'Searching',
  composing: 'Processing',
  sourcing: 'Sourcing',
  confirming_with_pharm: 'Sourcing',
  processing: 'Processing',
  awaiting_input: 'Awaiting your input',
  quote_available: 'Quoted',
  payment_pending: 'Ready to pay',
  paid: 'Paid',
  verified: 'Paid',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  logistics_pending: 'Logistics pending',
  driver_unavailable: 'Driver unavailable',
  driver_assigned: 'Driver assigned',
  out_for_delivery: 'Out for delivery',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  returned: 'Returned',
}

const STORE_ORDER_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  processing: 'bg-brand-50 text-brand-800',
  preparing: 'bg-brand-50 text-brand-800',
  shipped: 'bg-brand-100 text-brand-800',
  in_transit: 'bg-brand-100 text-brand-800',
  driver_assigned: 'bg-brand-100 text-brand-800',
  out_for_delivery: 'bg-brand-100 text-brand-800',
  ready_for_pickup: 'bg-brand-100 text-brand-800',
  logistics_pending: 'bg-brand-50 text-brand-800',
  picked_up: 'bg-brand-700 text-white',
  delivered: 'bg-brand-700 text-white',
  completed: 'bg-brand-700 text-white',
  cancelled: 'bg-red-50 text-red-700',
}

const REQUEST_BADGE: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-600',
  pending: 'bg-amber-50 text-amber-800',
  searching: 'bg-brand-50 text-brand-800',
  finding_pharmacist: 'bg-brand-50 text-brand-800',
  composing: 'bg-brand-50 text-brand-800',
  sourcing: 'bg-brand-50 text-brand-800',
  confirming_with_pharm: 'bg-brand-50 text-brand-800',
  processing: 'bg-brand-50 text-brand-800',
  awaiting_input: 'bg-amber-50 text-amber-800',
  quote_available: 'bg-brand-100 text-brand-800',
  payment_pending: 'bg-amber-50 text-amber-800',
  paid: 'bg-brand-700 text-white',
  verified: 'bg-brand-700 text-white',
  preparing: 'bg-brand-50 text-brand-800',
  ready_for_pickup: 'bg-brand-100 text-brand-800',
  logistics_pending: 'bg-brand-50 text-brand-800',
  driver_unavailable: 'bg-red-50 text-red-700',
  driver_assigned: 'bg-brand-100 text-brand-800',
  out_for_delivery: 'bg-brand-100 text-brand-800',
  picked_up: 'bg-brand-700 text-white',
  delivered: 'bg-brand-700 text-white',
  completed: 'bg-brand-700 text-white',
  cancelled: 'bg-red-50 text-red-700',
  rejected: 'bg-red-50 text-red-700',
  returned: 'bg-red-50 text-red-700',
}

const TERMINAL_STORE_STATUSES = new Set(['completed', 'delivered', 'cancelled', 'picked_up'])
const TERMINAL_REQUEST_STATUSES = new Set([
  'driver_unavailable',
  'picked_up',
  'delivered',
  'completed',
  'cancelled',
  'returned',
])

export type RequestStage = 'processing' | 'awaiting_payment' | 'awaiting_fulfilment' | 'complete'

const STAGE_MAP: Record<string, RequestStage> = {
  draft: 'processing',
  pending: 'processing',
  searching: 'processing',
  finding_pharmacist: 'processing',
  composing: 'processing',
  sourcing: 'processing',
  confirming_with_pharm: 'processing',
  processing: 'processing',
  awaiting_input: 'awaiting_payment',
  quote_available: 'awaiting_payment',
  payment_pending: 'awaiting_payment',
  awaiting_method_selection: 'awaiting_payment',
  confirmed_in_pharm: 'awaiting_payment',
  items_sourced: 'awaiting_payment',
  confirmed: 'awaiting_payment',
  paid: 'awaiting_fulfilment',
  verified: 'awaiting_fulfilment',
  preparing: 'awaiting_fulfilment',
  ready_for_pickup: 'awaiting_fulfilment',
  logistics_pending: 'awaiting_fulfilment',
  driver_unavailable: 'awaiting_fulfilment',
  driver_assigned: 'awaiting_fulfilment',
  out_for_delivery: 'awaiting_fulfilment',
  picked_up: 'complete',
  delivered: 'complete',
  completed: 'complete',
  cancelled: 'complete',
  returned: 'complete',
  rejected: 'complete',
  expired: 'complete',
}

const REQUEST_SUBTEXTS: Record<string, string> = {
  draft: 'Submitted — waiting for a pharmacist',
  pending: 'Submitted — waiting for a pharmacist',
  searching: 'Finding your medications...',
  finding_pharmacist: 'Finding your medications...',
  composing: 'Pharmacist is sourcing your meds',
  sourcing: 'Pharmacist is sourcing your meds',
  confirming_with_pharm: 'Confirming with pharmacy...',
  processing: 'Pharmacist is sourcing your meds',
  awaiting_input: 'We need a decision from you',
  quote_available: 'Ready to pay — tap to continue',
  payment_pending: 'Ready to pay — tap to continue',
  awaiting_method_selection: 'Ready to pay — tap to continue',
  confirmed_in_pharm: 'Ready to pay — tap to continue',
  items_sourced: 'Ready to pay — tap to continue',
  confirmed: 'Ready to pay — tap to continue',
  paid: 'Your order is being prepared',
  verified: 'Your order is being prepared',
  preparing: 'Your order is being prepared',
  ready_for_pickup: 'Ready for collection',
  logistics_pending: 'Assigning a rider...',
  driver_unavailable: 'No rider available — our team is on it',
  driver_assigned: 'Your rider is on the way',
  out_for_delivery: 'Your rider is on the way',
  picked_up: 'Completed',
  delivered: 'Completed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Closed',
  rejected: 'Closed',
  expired: 'Closed',
}

const humanise = (status: string | null | undefined): string =>
  String(status ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

export const useOrderStatus = () => {
  const formatStoreStatus = (status: string | null | undefined): string =>
    STORE_ORDER_LABELS[status ?? ''] ?? humanise(status ?? 'Order')

  const formatRequestStatus = (status: string | null | undefined): string =>
    REQUEST_LABELS[status ?? ''] ?? humanise(status ?? 'Request')

  const storeStatusBadgeClass = (status: string | null | undefined): string =>
    STORE_ORDER_BADGE[status ?? ''] ?? 'bg-ink-100 text-ink-600'

  const requestStatusBadgeClass = (status: string | null | undefined): string =>
    REQUEST_BADGE[status ?? ''] ?? 'bg-ink-100 text-ink-600'

  const isOngoingStoreStatus = (status: string | null | undefined): boolean =>
    !TERMINAL_STORE_STATUSES.has(status ?? '')

  const isActiveRequestStatus = (status: string | null | undefined): boolean =>
    !TERMINAL_REQUEST_STATUSES.has(status ?? '')

  const getRequestStage = (status: string | null | undefined): RequestStage =>
    STAGE_MAP[status ?? ''] ?? 'processing'

  const getRequestSubtext = (status: string | null | undefined): string =>
    REQUEST_SUBTEXTS[status ?? ''] ?? 'Processing your request'

  return {
    formatStoreStatus,
    formatRequestStatus,
    storeStatusBadgeClass,
    requestStatusBadgeClass,
    isOngoingStoreStatus,
    isActiveRequestStatus,
    getRequestStage,
    getRequestSubtext,
  }
}
