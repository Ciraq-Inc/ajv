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

  return {
    formatStoreStatus,
    formatRequestStatus,
    storeStatusBadgeClass,
    requestStatusBadgeClass,
    isOngoingStoreStatus,
    isActiveRequestStatus,
  }
}
