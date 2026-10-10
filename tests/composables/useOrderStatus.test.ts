import { describe, expect, it } from 'vitest'
import { useOrderStatus } from '~/composables/useOrderStatus'

const BAD = /zinc-|emerald-|rose-|slate-|gray-|blue-\d|\[#[0-9a-fA-F]{3,6}\]/
const STATUSES = ['draft', 'pending', 'searching', 'awaiting_input', 'quote_available', 'payment_pending', 'paid', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected', 'returned', 'processing', 'shipped', 'unknown_status']

describe('useOrderStatus badges', () => {
  it('use only design-system tokens, for store and request statuses alike', () => {
    const { storeStatusBadgeClass, requestStatusBadgeClass } = useOrderStatus()
    for (const s of STATUSES) {
      expect(storeStatusBadgeClass(s)).not.toMatch(BAD)
      expect(requestStatusBadgeClass(s)).not.toMatch(BAD)
    }
  })

  it('keep a readable foreground on every badge', () => {
    const { requestStatusBadgeClass } = useOrderStatus()
    for (const s of STATUSES) expect(requestStatusBadgeClass(s)).toMatch(/text-((brand|ink|red|amber)-\d+|white)/)
  })
})

describe('useOrderStatus: a delivery that could not be completed', () => {
  it('reads as a failed delivery, in the warning colour, and still needs the team', () => {
    const { formatRequestStatus, requestStatusBadgeClass, getRequestStage, getRequestSubtext, isActiveRequestStatus } = useOrderStatus()
    expect(formatRequestStatus('delivery_failed')).toBe('Delivery failed')
    expect(requestStatusBadgeClass('delivery_failed')).toMatch(/red-/)
    expect(getRequestStage('delivery_failed')).toBe('awaiting_fulfilment')
    expect(getRequestSubtext('delivery_failed')).toMatch(/team/i)
    // not closed: an admin still has to redeliver or refund it
    expect(isActiveRequestStatus('delivery_failed')).toBe(true)
  })
})
