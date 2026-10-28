import { describe, it, expect } from 'vitest'
import { pendingComposedPharmacies } from '../outreachPending'

const queue = [
  { pharmacy_id: 64, pharmacy_name: 'PILLCHECK', queue_state: 'full' },
  { pharmacy_id: 99, pharmacy_name: 'EDMIDA', queue_state: 'not_contacted' },
]

describe('pendingComposedPharmacies', () => {
  it('lists a composed pharmacy that has not confirmed, with its items', () => {
    const items = [
      { id: 160, product_name: 'Paracetamol', source_pharmacy_id: 64 },
      { id: 161, product_name: 'Entramol', source_pharmacy_id: 99 },
    ]
    expect(pendingComposedPharmacies(items, queue)).toEqual([
      { pharmacy_id: 99, pharmacy_name: 'EDMIDA', state: 'not_contacted', item_names: ['Entramol'] },
    ])
  })

  it('is empty when every composed pharmacy has confirmed', () => {
    const items = [{ id: 160, product_name: 'Paracetamol', source_pharmacy_id: 64 }]
    expect(pendingComposedPharmacies(items, queue)).toEqual([])
  })

  it('ignores items with no source pharmacy', () => {
    expect(pendingComposedPharmacies([{ id: 1, product_name: 'X', source_pharmacy_id: null }], queue)).toEqual([])
  })

  it('groups several items under one pharmacy', () => {
    const items = [
      { id: 1, product_name: 'A', source_pharmacy_id: 99 },
      { id: 2, product_name: 'B', source_pharmacy_id: 99 },
    ]
    expect(pendingComposedPharmacies(items, queue)[0].item_names).toEqual(['A', 'B'])
  })
})
