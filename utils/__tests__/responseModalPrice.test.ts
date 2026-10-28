import { describe, it, expect } from 'vitest'
import { availableItemsMissingPrice } from '../responseModalPrice'

describe('availableItemsMissingPrice', () => {
  it('flags an available item with a blank price', () => {
    const items = [
      { item_id: 160, available: true, unit_price: '6' },
      { item_id: 161, available: true, unit_price: '' },
    ]
    expect(availableItemsMissingPrice(items).map((i) => i.item_id)).toEqual([161])
  })

  it('flags null, undefined, zero and non-numeric prices', () => {
    const items = [
      { item_id: 1, available: true, unit_price: null },
      { item_id: 2, available: true },
      { item_id: 3, available: true, unit_price: 0 },
      { item_id: 4, available: true, unit_price: 'abc' },
    ]
    expect(availableItemsMissingPrice(items).map((i) => i.item_id)).toEqual([1, 2, 3, 4])
  })

  it('ignores items the pharmacy does not have', () => {
    expect(availableItemsMissingPrice([{ item_id: 5, available: false, unit_price: '' }])).toEqual([])
  })

  it('accepts priced items', () => {
    expect(availableItemsMissingPrice([{ item_id: 6, available: true, unit_price: 12.5 }])).toEqual([])
  })
})
