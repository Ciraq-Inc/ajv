import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  allocationStatusClass, formatAllocationStatusLabel, formatAllocationTypeLabel, formatDistance, formatExcludedReason,
  formatQueueState, formatRatingStars, formatRelativeTime, formatStatus, getItemLineTotal, getItemQuantity,
  getItemSubstituteDetails, getItemUnitPrice, getLatestSubstituteAllocation, isItemUnavailable, normalizeItemStatus,
  queueStateClass,
} from '~/composables/useOrderRequestFormatters'

describe('status wording', () => {
  it('turns a status code into words', () => {
    expect(formatStatus('payment_pending')).toBe('Payment Pending')
    expect(formatStatus('out_for_delivery')).toBe('Out For Delivery')
  })

  it('shows awaiting_method_selection as Payment Pending, as the admin thinks of it', () => {
    expect(formatStatus('awaiting_method_selection')).toBe('Payment Pending')
  })

  it('copes with no status', () => {
    expect(formatStatus(null)).toBe('Unknown')
    expect(formatStatus(undefined)).toBe('Unknown')
    expect(formatQueueState(null)).toBe('Unknown')
    expect(formatQueueState('awaiting_response')).toBe('Awaiting Response')
  })

  it('words excluded reasons, with a default', () => {
    expect(formatExcludedReason('removed_by_customer')).toBe('Removed by customer')
    expect(formatExcludedReason('UNAVAILABLE')).toBe('Unavailable')
    expect(formatExcludedReason('anything else')).toBe('Not included')
    expect(formatExcludedReason(null)).toBe('Not included')
  })

  it('words allocation types and statuses, treating proposed as confirmed', () => {
    expect(formatAllocationTypeLabel('substitute')).toBe('Alternative')
    expect(formatAllocationTypeLabel('exact')).toBe('Exact')
    expect(formatAllocationTypeLabel('odd')).toBe('Exact')
    expect(formatAllocationStatusLabel('proposed')).toBe('Confirmed')
    expect(formatAllocationStatusLabel('declined')).toBe('Declined')
    expect(formatAllocationStatusLabel('expired')).toBe('Expired')
    expect(formatAllocationStatusLabel(undefined)).toBe('Confirmed')
    expect(allocationStatusClass('proposed')).toEqual({ confirmed: true, declined: false, expired: false })
    expect(allocationStatusClass('declined')).toEqual({ confirmed: false, declined: true, expired: false })
  })

  it('classes each pharmacy queue state', () => {
    expect(queueStateClass('full')).toMatchObject({ success: true, current: false, muted: false, danger: false })
    expect(queueStateClass('partial')).toMatchObject({ current: true })
    expect(queueStateClass('awaiting_response')).toMatchObject({ current: true })
    expect(queueStateClass('not_contacted')).toMatchObject({ muted: true })
    expect(queueStateClass('timeout')).toMatchObject({ danger: true })
    expect(queueStateClass('declined')).toMatchObject({ danger: true })
  })
})

describe('small formats', () => {
  it('shows distance to one decimal, zero when unknown', () => {
    expect(formatDistance(1.26)).toBe('1.3 km')
    expect(formatDistance('4')).toBe('4.0 km')
    expect(formatDistance(null)).toBe('0.0 km')
  })

  it('shows stars out of five, clamped', () => {
    expect(formatRatingStars(3)).toBe('★★★☆☆')
    expect(formatRatingStars(9)).toBe('★★★★★')
    expect(formatRatingStars(-2)).toBe('☆☆☆☆☆')
    expect(formatRatingStars(null)).toBe('☆☆☆☆☆')
  })

  describe('relative time', () => {
    afterEach(() => vi.useRealTimers())
    const ago = (ms: number) => {
      vi.useFakeTimers({ now: new Date('2026-10-13T12:00:00Z') })
      return new Date(Date.now() - ms).toISOString()
    }

    it('says just now under two minutes, then minutes, hours, days, months', () => {
      expect(formatRelativeTime(ago(30_000))).toBe('just now')
      expect(formatRelativeTime(ago(5 * 60_000))).toBe('5m ago')
      expect(formatRelativeTime(ago(3 * 3_600_000))).toBe('3h ago')
      expect(formatRelativeTime(ago(2 * 86_400_000))).toBe('2d ago')
      expect(formatRelativeTime(ago(65 * 86_400_000))).toBe('2mo ago')
    })

    it('gives nothing without a date', () => {
      expect(formatRelativeTime(null)).toBeNull()
    })
  })
})

describe('item status', () => {
  it('is unavailable when the source says so, whatever the price', () => {
    expect(normalizeItemStatus({ sourcing_status: 'unavailable', unit_price: 5 })).toBe('unavailable')
    expect(normalizeItemStatus({ item_status: 'not_available', unit_price: 5 })).toBe('unavailable')
    expect(isItemUnavailable({ item_status: 'not_available' })).toBe(true)
  })

  it('is confirmed once it has a price', () => {
    expect(normalizeItemStatus({ unit_price: 5 })).toBe('confirmed')
    expect(normalizeItemStatus({ marked_up_price: '7.5' })).toBe('confirmed')
  })

  it('otherwise keeps its sourcing status, defaulting to pending', () => {
    expect(normalizeItemStatus({ sourcing_status: 'contacted' })).toBe('contacted')
    expect(normalizeItemStatus({})).toBe('pending')
    expect(normalizeItemStatus(null)).toBe('pending')
    expect(isItemUnavailable({ unit_price: 5 })).toBe(false)
  })
})

describe('line totals', () => {
  it('reads quantity, falling back to requested quantity, then one', () => {
    expect(getItemQuantity({ quantity: 3, requested_quantity: 9 })).toBe(3)
    expect(getItemQuantity({ requested_quantity: 4 })).toBe(4)
    expect(getItemQuantity({})).toBe(1)
    expect(getItemQuantity({ quantity: 'abc' })).toBe(1)
  })

  it('prefers the marked-up price over the unit price, and zero when none', () => {
    expect(getItemUnitPrice({ marked_up_price: 12, unit_price: 10 })).toBe(12)
    expect(getItemUnitPrice({ unit_price: '10' })).toBe(10)
    expect(getItemUnitPrice({})).toBe(0)
    expect(getItemUnitPrice({ unit_price: 'free' })).toBe(0)
  })

  it('recomputes from price and quantity, ignoring a stale stored total', () => {
    expect(getItemLineTotal({ quantity: 3, unit_price: 2.5, line_total: 1 })).toBe(7.5)
  })

  it('rounds to pesewas', () => {
    expect(getItemLineTotal({ quantity: 3, unit_price: 0.1 })).toBe(0.3)
    expect(getItemLineTotal({ quantity: 3, unit_price: 0.333 })).toBe(1)
  })

  it('falls back to the stored total only when there is no price', () => {
    expect(getItemLineTotal({ quantity: 3, line_total: '18' })).toBe(18)
    expect(getItemLineTotal({ quantity: 3, line_total: -5 })).toBe(0)
    expect(getItemLineTotal(null)).toBe(0)
  })
})

describe('substitutes', () => {
  const alt = (over: Record<string, unknown>) => ({ allocation_type: 'substitute', status: 'confirmed', ...over })

  it('finds the most recently updated live substitute', () => {
    const item = { allocations: [
      alt({ substitute_name: 'Old', updated_at: '2026-10-01T00:00:00Z' }),
      alt({ substitute_name: 'New', updated_at: '2026-10-05T00:00:00Z' }),
      alt({ substitute_name: 'Newest but declined', status: 'declined', updated_at: '2026-10-09T00:00:00Z' }),
      { allocation_type: 'exact', status: 'confirmed', substitute_name: 'Exact', updated_at: '2026-10-10T00:00:00Z' },
    ] }

    expect(getLatestSubstituteAllocation(item)?.substitute_name).toBe('New')
  })

  it('accepts proposed ones, and finds nothing without allocations', () => {
    expect(getLatestSubstituteAllocation({ allocations: [alt({ status: 'proposed', substitute_name: 'P' })] })?.substitute_name).toBe('P')
    expect(getLatestSubstituteAllocation({})).toBeNull()
    expect(getLatestSubstituteAllocation(null)).toBeNull()
  })

  it('describes the allocation with its note and price', () => {
    const item = { allocations: [alt({ substitute_name: ' Amoxil ', substitute_note: ' same strength ', unit_price: '12' })] }

    expect(getItemSubstituteDetails(item)).toEqual({ name: 'Amoxil', note: 'same strength', price: 12 })
  })

  it('takes the name from the item when the allocation has none, and none at all gives nothing', () => {
    expect(getItemSubstituteDetails({ substitute_name: 'Item name', allocations: [alt({})] })?.name).toBe('Item name')
    expect(getItemSubstituteDetails({ allocations: [alt({})] })).toBeNull()
  })

  it('has no price or note when they are missing', () => {
    expect(getItemSubstituteDetails({ allocations: [alt({ substitute_name: 'A', unit_price: null })] })).toEqual({ name: 'A', note: null, price: null })
  })

  it('falls back to the item\'s own substitute fields when there is no live allocation', () => {
    expect(getItemSubstituteDetails({ substitute_name: 'B', substitute_note: 'n', allocation_unit_price: '3.5' })).toEqual({ name: 'B', note: 'n', price: 3.5 })
    expect(getItemSubstituteDetails({ substitute_name: 'B', allocation_unit_price: '' })?.price).toBeNull()
    expect(getItemSubstituteDetails({})).toBeNull()
    expect(getItemSubstituteDetails(null)).toBeNull()
  })
})
