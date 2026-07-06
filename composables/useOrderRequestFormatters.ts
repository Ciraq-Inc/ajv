// Extracted from pages/admin/fulfillment/order-requests.vue — pure format helpers
// No reactive state. Import and destructure what you need.

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  awaiting_method_selection: 'Payment Pending',
}

export const formatStatus = (status: string | undefined | null): string => {
  if (status && STATUS_LABEL_OVERRIDES[status]) return STATUS_LABEL_OVERRIDES[status]!
  return (status ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export const formatDate = (d: string | Date | null | undefined): string =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-'

export const formatDateTime = (d: string | Date | null | undefined): string =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '-'

export const formatCurrency = (value: number | string | null | undefined): string =>
  `GHS ${Number(value ?? 0).toFixed(2)}`

export const formatRelativeTime = (d: string | Date | null | undefined): string | null => {
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

export const formatSignedCurrency = (value: number | string | null | undefined): string => {
  const amount = Number(value ?? 0)
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}GHS ${Math.abs(amount).toFixed(2)}`
}

export const formatRatingStars = (rating: number | string | null | undefined): string => {
  const safeRating = Math.max(0, Math.min(5, Number(rating ?? 0)))
  return `${'★'.repeat(safeRating)}${'☆'.repeat(Math.max(5 - safeRating, 0))}`
}

export const formatExcludedReason = (reason: string | null | undefined): string => {
  const key = String(reason ?? '').toLowerCase()
  if (key === 'removed_by_customer') return 'Removed by customer'
  if (key === 'unavailable') return 'Unavailable'
  return 'Not included'
}

export const formatDistance = (km: number | string | null | undefined): string =>
  `${Number(km ?? 0).toFixed(1)} km`

export const formatQueueState = (state: string | null | undefined): string =>
  (state ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

export const formatAllocationTypeLabel = (value: string | null | undefined): string =>
  ({ exact: 'Exact', substitute: 'Alternative' }[value ?? ''] ?? 'Exact')

export const formatAllocationStatusLabel = (value: string | null | undefined): string =>
  ({
    proposed: 'Confirmed',
    confirmed: 'Confirmed',
    declined: 'Declined',
    expired: 'Expired',
  }[value ?? ''] ?? 'Confirmed')

export const allocationStatusClass = (
  value: string | null | undefined
): Record<string, boolean> => ({
  confirmed: value === 'confirmed' || value === 'proposed',
  declined: value === 'declined',
  expired: value === 'expired',
})

export const createAllocationLabel = (item: { allocation_status?: string } | null | undefined): string =>
  item?.allocation_status === 'confirmed'
    ? 'Add Confirmed Allocation'
    : 'Add Confirmed Allocation'

export const queueStateClass = (state: string | null | undefined): Record<string, boolean> => ({
  success: ['full'].includes(state ?? ''),
  current: ['awaiting_response', 'partial'].includes(state ?? ''),
  muted: ['not_contacted', 'pending', 'unknown'].includes(state ?? ''),
  danger: ['declined', 'timeout'].includes(state ?? ''),
})

interface ItemRecord {
  sourcing_status?: string
  item_status?: string
  unit_price?: number | string
  marked_up_price?: number | string
  [key: string]: unknown
}

export const normalizeItemStatus = (item: ItemRecord | null | undefined): string => {
  const rawStatus = item?.sourcing_status ?? item?.item_status ?? 'pending'
  const hasQuote =
    Number(item?.unit_price ?? 0) > 0 || Number(item?.marked_up_price ?? 0) > 0
  if (rawStatus === 'unavailable' || item?.item_status === 'not_available') return 'unavailable'
  if (hasQuote) return 'confirmed'
  return rawStatus
}

export const isItemUnavailable = (item: ItemRecord | null | undefined): boolean =>
  normalizeItemStatus(item) === 'unavailable'

export const formatItemStatus = (item: ItemRecord | null | undefined): string =>
  normalizeItemStatus(item)

export const itemStatusClass = (item: ItemRecord | null | undefined): string =>
  normalizeItemStatus(item)

interface Allocation {
  allocation_type?: string
  status?: string
  updated_at?: string
  created_at?: string
  substitute_name?: string
  substitute_note?: string
  unit_price?: number | string | null
  pharmacy_id?: number | string
  allocated_quantity?: number
  [key: string]: unknown
}

interface ItemWithAllocations extends ItemRecord {
  allocations?: Allocation[]
  substitute_name?: string
  substitute_note?: string
  allocation_unit_price?: number | string | null
}

export const getLatestSubstituteAllocation = (
  item: ItemWithAllocations | null | undefined
): Allocation | null => {
  if (!Array.isArray(item?.allocations)) return null
  const substituteAllocations = item!.allocations!
    .filter((allocation) => {
      const type = String(allocation?.allocation_type ?? '').toLowerCase()
      const status = String(allocation?.status ?? '').toLowerCase()
      return type === 'substitute' && ['proposed', 'confirmed'].includes(status)
    })
    .sort((a, b) => {
      const aTime = new Date(a?.updated_at ?? a?.created_at ?? 0).getTime()
      const bTime = new Date(b?.updated_at ?? b?.created_at ?? 0).getTime()
      return bTime - aTime
    })
  return substituteAllocations[0] ?? null
}

interface SubstituteDetails {
  name: string
  note: string | null
  price: number | null
}

export const getItemSubstituteDetails = (
  item: ItemWithAllocations | null | undefined
): SubstituteDetails | null => {
  const allocation = getLatestSubstituteAllocation(item)
  if (allocation) {
    const name =
      String(allocation.substitute_name ?? '').trim() ||
      String(item?.substitute_name ?? '').trim()
    if (!name) return null
    const price =
      allocation.unit_price === null || allocation.unit_price === undefined
        ? null
        : Number(allocation.unit_price)
    return {
      name,
      note: String(allocation.substitute_note ?? '').trim() || null,
      price: Number.isFinite(price) ? price : null,
    }
  }
  const name = String(item?.substitute_name ?? '').trim()
  if (!name) return null
  const rawPrice = item?.allocation_unit_price
  const price =
    rawPrice === null || rawPrice === undefined || rawPrice === ''
      ? null
      : Number(rawPrice)
  return {
    name,
    note: String(item?.substitute_note ?? '').trim() || null,
    price: Number.isFinite(price) ? price : null,
  }
}

interface LineTotalItem {
  quantity?: number | string | null
  requested_quantity?: number | string | null
  unit_price?: number | string | null
  marked_up_price?: number | string | null
  line_total?: number | string | null
  [key: string]: unknown
}

export const getItemQuantity = (item: LineTotalItem | null | undefined): number => {
  const quantity = Number(item?.quantity ?? item?.requested_quantity ?? 1)
  return Number.isFinite(quantity) ? quantity : 1
}

export const getItemUnitPrice = (item: LineTotalItem | null | undefined): number => {
  const price = Number(item?.marked_up_price ?? item?.unit_price ?? 0)
  return Number.isFinite(price) ? price : 0
}

// The single "what does this line cost right now" rule: prefer a live
// unitPrice × quantity recompute whenever a positive price is on record (so
// a quantity edit is reflected immediately, even before line_total is
// re-persisted), and only fall back to the stored line_total when the item
// genuinely has no price yet. Replaces ~6 independent copies of this same
// decision across the admin fulfillment page, several of which had the
// preference backwards (trusting a stale stored value).
export const getItemLineTotal = (item: LineTotalItem | null | undefined): number => {
  const quantity = getItemQuantity(item)
  const unitPrice = getItemUnitPrice(item)
  if (unitPrice > 0 && quantity > 0) {
    return Number((unitPrice * quantity).toFixed(2))
  }
  const stored = Number(item?.line_total ?? 0)
  return Number.isFinite(stored) && stored > 0 ? stored : 0
}

export const formatWaitingTime = (d: string | Date | null | undefined): string | null => {
  if (!d) return null
  const ms = Date.now() - new Date(d).getTime()
  if (ms < 0) return null
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hrs < 24) return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`
  const days = Math.floor(hrs / 24)
  const remHrs = hrs % 24
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`
}

// Composable wrapper — call this in setup() if you want all helpers destructured
export const useOrderRequestFormatters = () => ({
  formatStatus,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatRelativeTime,
  formatSignedCurrency,
  formatRatingStars,
  formatExcludedReason,
  formatDistance,
  formatQueueState,
  formatAllocationTypeLabel,
  formatAllocationStatusLabel,
  allocationStatusClass,
  createAllocationLabel,
  queueStateClass,
  normalizeItemStatus,
  isItemUnavailable,
  formatItemStatus,
  itemStatusClass,
  getLatestSubstituteAllocation,
  getItemSubstituteDetails,
  formatWaitingTime,
  getItemQuantity,
  getItemUnitPrice,
  getItemLineTotal,
})
