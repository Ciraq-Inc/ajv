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
