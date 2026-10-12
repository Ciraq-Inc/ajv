import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => ({ currentPharmacy: 12, pharmacySlug: 'demo' }) }))

;(process as unknown as { client: boolean }).client = true

import { useCartStore } from '../stores/cart'

const paracetamol = (quantity?: number) => ({ id: 5, price: 3, pharmacyId: 12, ...(quantity !== undefined && { quantity }) }) as never

beforeEach(() => {
  setActivePinia(createPinia())
  const store = useCartStore()
  store.activePharmacy = 12
})

describe('adding to the cart', () => {
  it('adds to the quantity already in the cart instead of replacing it', () => {
    const cart = useCartStore()
    cart.addToCart(paracetamol(3))
    cart.addToCart(paracetamol(1))

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(4)
  })

  it('counts an add with no quantity as one more', () => {
    const cart = useCartStore()
    cart.addToCart(paracetamol(2))
    cart.addToCart(paracetamol())

    expect(cart.items[0].quantity).toBe(3)
  })

  it('puts a new item in with the quantity given', () => {
    const cart = useCartStore()
    cart.addToCart(paracetamol(2))

    expect(cart.items[0].quantity).toBe(2)
  })
})
