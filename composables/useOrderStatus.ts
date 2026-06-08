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
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-[#f4e8fb] text-[#5e3a86]',
  preparing: 'bg-[#f4e8fb] text-[#5e3a86]',
  shipped: 'bg-[#ede5ff] text-[#4F217A]',
  in_transit: 'bg-[#ede5ff] text-[#4F217A]',
  driver_assigned: 'bg-[#ede5ff] text-[#4F217A]',
  out_for_delivery: 'bg-[#ede5ff] text-[#4F217A]',
  ready_for_pickup: 'bg-[#ede5ff] text-[#4F217A]',
  logistics_pending: 'bg-[#f4e8fb] text-[#5e3a86]',
  picked_up: 'bg-[#e7f7ea] text-[#228847]',
  delivered: 'bg-[#e7f7ea] text-[#228847]',
  completed: 'bg-[#e7f7ea] text-[#228847]',
  cancelled: 'bg-red-50 text-red-600',
}

const REQUEST_BADGE: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  pending: 'bg-amber-50 text-amber-700',
  searching: 'bg-[#f4e8fb] text-[#5e3a86]',
  finding_pharmacist: 'bg-[#f4e8fb] text-[#5e3a86]',
  composing: 'bg-[#f4e8fb] text-[#5e3a86]',
  sourcing: 'bg-[#f4e8fb] text-[#5e3a86]',
  confirming_with_pharm: 'bg-[#f4e8fb] text-[#5e3a86]',
  processing: 'bg-[#f4e8fb] text-[#5e3a86]',
  awaiting_input: 'bg-[#fff7e0] text-[#b07300]',
  quote_available: 'bg-[#ede5ff] text-[#4F217A]',
  payment_pending: 'bg-[#fff7e0] text-[#b07300]',
  paid: 'bg-[#e7f7ea] text-[#228847]',
  verified: 'bg-[#e7f7ea] text-[#228847]',
  preparing: 'bg-[#f4e8fb] text-[#5e3a86]',
  ready_for_pickup: 'bg-[#ede5ff] text-[#4F217A]',
  logistics_pending: 'bg-[#f4e8fb] text-[#5e3a86]',
  driver_unavailable: 'bg-red-50 text-red-600',
  driver_assigned: 'bg-[#ede5ff] text-[#4F217A]',
  out_for_delivery: 'bg-[#ede5ff] text-[#4F217A]',
  picked_up: 'bg-[#e7f7ea] text-[#228847]',
  delivered: 'bg-[#e7f7ea] text-[#228847]',
  completed: 'bg-[#e7f7ea] text-[#228847]',
  cancelled: 'bg-red-50 text-red-600',
  rejected: 'bg-red-50 text-red-600',
  returned: 'bg-red-50 text-red-600',
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
    STORE_ORDER_BADGE[status ?? ''] ?? 'bg-zinc-100 text-zinc-600'

  const requestStatusBadgeClass = (status: string | null | undefined): string =>
    REQUEST_BADGE[status ?? ''] ?? 'bg-zinc-100 text-zinc-600'

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
