import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

// Boundaries: the route, and the pharmacy / cart stores.
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { pharmacy: 'rigel' } }) }))

const pharmacy = vi.hoisted(() => ({
  state: null as any,
}))
const cart = vi.hoisted(() => ({ addToCart: vi.fn() }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => pharmacy.state }))
vi.mock('~/stores/cart', () => ({ useCartStore: () => cart }))

import ProductsGrid from '~/components/ProductsGrid.vue'

const PRODUCTS = [
  { id: 1, brandName: 'Paracetamol 500mg', sellingPrice: 5, stockQty: 40, unit: 'strip', productImageUrl: '/para.png', dosage: 'Tablet', strength: '500mg' },
  { id: 2, brandName: 'Amoxicillin', sellingPrice: 12.5, stockQty: 0 },
  { id: 3, brandName: 'Vitamin C', sellingPrice: 8, stockQty: 3 },
  { id: 4, brandName: 'Hidden Product', sellingPrice: 1, stockQty: 9, isActive: false },
  { id: 5, brandName: 'Zero Flag', sellingPrice: 1, stockQty: 9, isActive: 0 },
  { id: 6, brandName: 'String Zero', sellingPrice: 1, stockQty: 9, isActive: '0' },
]

let wrapper: ReturnType<typeof mount> | undefined
const mountGrid = async (props: Record<string, unknown> = {}) => {
  wrapper = mount(ProductsGrid, { props, attachTo: document.body })
  await flushPromises()
  return wrapper
}
const cards = (w: ReturnType<typeof mount>) => w.findAll('.product-card')
const names = (w: ReturnType<typeof mount>) => cards(w).map(c => c.find('h3').text())
const card = (w: ReturnType<typeof mount>, name: string) => cards(w).find(c => c.find('h3').text() === name)!

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  pharmacy.state = reactive({
    isLoading: false,
    products: PRODUCTS.map(p => ({ ...p })),
    currentPharmacy: { id: 7 },
    fetchProducts: vi.fn().mockResolvedValue(undefined),
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('ProductsGrid: loading', () => {
  it('shows skeleton cards, not products, while the pharmacy store is loading', async () => {
    pharmacy.state.isLoading = true
    const w = await mountGrid()

    expect(w.findAll('.skeleton-shimmer').length).toBeGreaterThan(0)
    expect(cards(w)).toHaveLength(0)
  })

  it('shows the products once the store finishes loading', async () => {
    pharmacy.state.isLoading = true
    pharmacy.state.products = []
    const w = await mountGrid()

    pharmacy.state.products = PRODUCTS.map(p => ({ ...p }))
    pharmacy.state.isLoading = false
    await flushPromises()

    expect(w.findAll('.skeleton-shimmer')).toHaveLength(0)
    expect(cards(w)).toHaveLength(3)
  })

  it('fetches the products when the store has none for the current pharmacy', async () => {
    pharmacy.state.products = []
    pharmacy.state.fetchProducts.mockImplementation(async () => {
      pharmacy.state.products = PRODUCTS.map(p => ({ ...p }))
    })
    const w = await mountGrid()

    expect(pharmacy.state.fetchProducts).toHaveBeenCalledTimes(1)
    expect(cards(w)).toHaveLength(3)
  })

  it('does not fetch when the store already has products', async () => {
    await mountGrid()
    expect(pharmacy.state.fetchProducts).not.toHaveBeenCalled()
  })

  it('does not fetch before a pharmacy has been chosen', async () => {
    pharmacy.state.products = []
    pharmacy.state.currentPharmacy = null
    const w = await mountGrid()

    expect(pharmacy.state.fetchProducts).not.toHaveBeenCalled()
    expect(w.text()).toContain('No products available')
  })

  it('stops showing skeletons, and shows the empty state, when the fetch fails', async () => {
    pharmacy.state.products = []
    pharmacy.state.fetchProducts.mockRejectedValue(new Error('boom'))
    const w = await mountGrid()

    expect(w.findAll('.skeleton-shimmer')).toHaveLength(0)
    expect(w.text()).toContain('No products available')
  })

  it('reloads when the customer switches to another pharmacy', async () => {
    const w = await mountGrid()
    pharmacy.state.fetchProducts.mockImplementation(async () => {
      pharmacy.state.products = [{ id: 99, brandName: 'Other Shop Item', sellingPrice: 2, stockQty: 4 }]
    })

    pharmacy.state.currentPharmacy = { id: 8 }
    await flushPromises()

    expect(pharmacy.state.fetchProducts).toHaveBeenCalledTimes(1)
    expect(names(w)).toEqual(['Other Shop Item'])
  })
})

describe('ProductsGrid: which products are listed', () => {
  it('lists active products only: inactive is false, 0 or "0"', async () => {
    const w = await mountGrid()
    expect(names(w).sort()).toEqual(['Amoxicillin', 'Paracetamol 500mg', 'Vitamin C'])
  })

  it('puts in-stock products before out-of-stock ones, keeping the original order otherwise', async () => {
    const w = await mountGrid()
    expect(names(w)).toEqual(['Paracetamol 500mg', 'Vitamin C', 'Amoxicillin'])
  })

  it('prefers products passed in by the parent over the store', async () => {
    const w = await mountGrid({ products: [{ id: 50, brandName: 'From Parent', sellingPrice: 3, stockQty: 2 }] })
    expect(names(w)).toEqual(['From Parent'])
  })

  it('follows the parent when its products change', async () => {
    const w = await mountGrid({ products: [{ id: 50, brandName: 'From Parent', sellingPrice: 3, stockQty: 2 }] })
    await w.setProps({ products: [{ id: 51, brandName: 'Replacement', sellingPrice: 3, stockQty: 2 }] })
    expect(names(w)).toEqual(['Replacement'])
  })

  it('filters by the search text, ignoring case and surrounding spaces', async () => {
    const w = await mountGrid({ searchQuery: '  VITAMIN ' })
    expect(names(w)).toEqual(['Vitamin C'])
  })

  it('never finds an inactive product by searching for it', async () => {
    const w = await mountGrid({ searchQuery: 'hidden' })
    expect(cards(w)).toHaveLength(0)
  })
})

describe('ProductsGrid: empty states', () => {
  it('says the pharmacy has no products when the list is empty', async () => {
    pharmacy.state.products = []
    const w = await mountGrid()

    expect(w.text()).toContain('No products available')
    expect(w.text()).toContain('This pharmacy has no products listed yet.')
    expect(w.find('button').exists()).toBe(false)
  })

  it('names the search that found nothing and offers to request that product', async () => {
    const w = await mountGrid({ searchQuery: 'ibuprofen' })

    expect(w.text()).toContain('No results for "ibuprofen"')
    expect(w.text()).toContain('Check the spelling, or ask the pharmacy to get it in for you.')

    await w.find('button').trigger('click')
    expect(w.emitted('requestProduct')).toEqual([['ibuprofen']])
  })
})

describe('ProductsGrid: product cards', () => {
  it('shows name, price and unit', async () => {
    const w = await mountGrid()
    const text = card(w, 'Paracetamol 500mg').text()

    expect(text).toContain('GHS 5.00')
    expect(text).toContain('/ strip')
  })

  it('formats prices to two decimals and falls back to "unit"', async () => {
    const w = await mountGrid()
    const text = card(w, 'Amoxicillin').text()

    expect(text).toContain('GHS 12.50')
    expect(text).toContain('/ unit')
  })

  it('shows "To be priced" instead of a price when the pharmacy hides prices', async () => {
    const w = await mountGrid({ hidePrices: true })

    expect(w.text()).not.toContain('GHS')
    expect(card(w, 'Paracetamol 500mg').text()).toContain('To be priced')
  })

  it('shows the product photo with its name as alt text, and none for products without one', async () => {
    const w = await mountGrid()

    const img = card(w, 'Paracetamol 500mg').find('img')
    expect(img.attributes('src')).toBe('/para.png')
    expect(img.attributes('alt')).toBe('Paracetamol 500mg')
    expect(card(w, 'Vitamin C').find('img').exists()).toBe(false)
  })

  it('drops a photo that fails to load', async () => {
    const w = await mountGrid()
    await card(w, 'Paracetamol 500mg').find('img').trigger('error')

    expect(card(w, 'Paracetamol 500mg').find('img').exists()).toBe(false)
  })

  it('flags low stock (1 to 5 left) but not healthy stock or none', async () => {
    const w = await mountGrid()

    expect(card(w, 'Vitamin C').find('.stock-ribbon').text()).toBe('3 left')
    expect(card(w, 'Paracetamol 500mg').find('.stock-ribbon').exists()).toBe(false)
    expect(card(w, 'Amoxicillin').find('.stock-ribbon').exists()).toBe(false)
  })

  it('marks out-of-stock products and disables adding them', async () => {
    const w = await mountGrid()
    const oos = card(w, 'Amoxicillin')

    expect(oos.text()).toContain('Out of stock')
    expect(oos.find('button[aria-label="Add to cart"]').attributes('disabled')).toBeDefined()
    expect(card(w, 'Vitamin C').find('button[aria-label="Add to cart"]').attributes('disabled')).toBeUndefined()
  })

  it('says why Add is unavailable on the button itself, not just by greying it out', async () => {
    const w = await mountGrid()
    expect(card(w, 'Amoxicillin').find('button[aria-label="Add to cart"]').text()).toContain('Out of stock')
    expect(card(w, 'Vitamin C').find('button[aria-label="Add to cart"]').text()).not.toContain('Out of stock')
  })

  it('the photo opens the larger view from a named button, so keyboard users can reach it', async () => {
    const w = await mountGrid()
    const zoom = card(w, 'Paracetamol 500mg').find('button[aria-label="View larger photo of Paracetamol 500mg"]')
    expect(zoom.exists()).toBe(true)
    expect(card(w, 'Vitamin C').find('button[aria-label^="View larger photo"]').exists()).toBe(false)
  })
})

describe('ProductsGrid: quantity and adding to the cart', () => {
  const qty = (c: ReturnType<typeof card>) => c.find('[data-testid="qty"]').text()

  it('starts at 1, steps up and down, and cannot go below 1', async () => {
    const w = await mountGrid()
    const c = () => card(w, 'Paracetamol 500mg')
    const dec = () => c().find('button[aria-label="Decrease quantity of Paracetamol 500mg"]')

    expect(qty(c())).toBe('1')
    expect(dec().attributes('disabled')).toBeDefined()

    await c().find('button[aria-label="Increase quantity of Paracetamol 500mg"]').trigger('click')
    await c().find('button[aria-label="Increase quantity of Paracetamol 500mg"]').trigger('click')
    expect(qty(c())).toBe('3')

    await dec().trigger('click')
    expect(qty(c())).toBe('2')
  })

  it('keeps each product\'s quantity separate', async () => {
    const w = await mountGrid()
    await card(w, 'Paracetamol 500mg').find('button[aria-label="Increase quantity of Paracetamol 500mg"]').trigger('click')

    expect(qty(card(w, 'Vitamin C'))).toBe('1')
  })

  it('adds the chosen quantity to the cart for the current pharmacy', async () => {
    const w = await mountGrid()
    await card(w, 'Paracetamol 500mg').find('button[aria-label="Increase quantity of Paracetamol 500mg"]').trigger('click')
    await card(w, 'Paracetamol 500mg').find('button[aria-label="Add to cart"]').trigger('click')

    expect(cart.addToCart).toHaveBeenCalledWith({
      id: 1,
      name: 'Paracetamol 500mg',
      price: 5,
      quantity: 2,
      image: '/para.png',
      pharmacyId: { id: 7 },
      unit: 'strip',
    })
  })

  it('leaves out the image for products without one and defaults the unit', async () => {
    const w = await mountGrid()
    await card(w, 'Vitamin C').find('button[aria-label="Add to cart"]').trigger('click')

    const sent = cart.addToCart.mock.calls[0][0]
    expect(sent).not.toHaveProperty('image')
    expect(sent.unit).toBe('unit')
  })

  it('tells the parent which product was added', async () => {
    const w = await mountGrid()
    await card(w, 'Vitamin C').find('button[aria-label="Add to cart"]').trigger('click')

    expect(w.emitted('itemAddedToCart')).toHaveLength(1)
    expect((w.emitted('itemAddedToCart')![0][0] as { id: number }).id).toBe(3)
  })

  it('confirms "Added" for a second, then returns to "Add"', async () => {
    const w = await mountGrid()
    vi.useFakeTimers()
    await card(w, 'Vitamin C').find('button[aria-label="Add to cart"]').trigger('click')

    const added = card(w, 'Vitamin C').find('button[aria-label="Added to cart"]')
    expect(added.exists()).toBe(true)
    expect(added.text()).toContain('Added')

    vi.advanceTimersByTime(1000)
    await w.vm.$nextTick()
    expect(card(w, 'Vitamin C').find('button[aria-label="Add to cart"]').exists()).toBe(true)
  })

  it('does not add an out-of-stock product', async () => {
    const w = await mountGrid()
    await card(w, 'Amoxicillin').find('button[aria-label="Add to cart"]').trigger('click')

    expect(cart.addToCart).not.toHaveBeenCalled()
    expect(w.emitted('itemAddedToCart')).toBeUndefined()
  })
})

describe('ProductsGrid: photo lightbox', () => {
  const lightbox = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null
  const openFor = async (w: ReturnType<typeof mount>, name: string) => {
    await card(w, name).find('button[aria-label^="View larger photo"]').trigger('click')
    await flushPromises()
  }

  it('opens from the photo, with name, dosage and strength, price and low-stock note', async () => {
    const w = await mountGrid()
    await openFor(w, 'Paracetamol 500mg')

    const text = lightbox()!.textContent!
    expect(text).toContain('Paracetamol 500mg')
    expect(text).toContain('Tablet · 500mg')
    expect(text).toContain('GHS 5.00')
    expect(text).toContain('/ strip')
    expect(text).not.toContain('left')
  })

  it('is a modal dialog named after the product', async () => {
    const w = await mountGrid()
    await openFor(w, 'Paracetamol 500mg')

    expect(lightbox()!.getAttribute('aria-modal')).toBe('true')
    expect(lightbox()!.getAttribute('aria-label')).toBe('Paracetamol 500mg')
  })

  it('warns "Only N left" for low-stock items that have a photo', async () => {
    pharmacy.state.products = [{ id: 3, brandName: 'Vitamin C', sellingPrice: 8, stockQty: 3, productImageUrl: '/c.png' }]
    const w = await mountGrid()
    await openFor(w, 'Vitamin C')

    expect(lightbox()!.textContent).toContain('Only 3 left')
  })

  it('does not open for a product with no photo', async () => {
    const w = await mountGrid()
    await card(w, 'Vitamin C').find('.card-media-tile').trigger('click')
    await flushPromises()

    expect(lightbox()).toBeNull()
  })

  it('hides the price when prices are hidden', async () => {
    const w = await mountGrid({ hidePrices: true })
    await openFor(w, 'Paracetamol 500mg')

    expect(lightbox()!.textContent).not.toContain('GHS')
  })

  it('closes with the X, by clicking outside, and with Escape; clicking inside keeps it open', async () => {
    const w = await mountGrid()

    await openFor(w, 'Paracetamol 500mg')
    ;(lightbox()!.querySelector('button[aria-label="Close"]') as HTMLElement).click()
    await flushPromises()
    expect(lightbox()).toBeNull()

    await openFor(w, 'Paracetamol 500mg')
    ;(lightbox()!.querySelector('.max-w-xs') as HTMLElement).click()
    await flushPromises()
    expect(lightbox()).not.toBeNull()

    lightbox()!.click()
    await flushPromises()
    expect(lightbox()).toBeNull()

    await openFor(w, 'Paracetamol 500mg')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(lightbox()).toBeNull()
  })

  it('ignores other keys', async () => {
    const w = await mountGrid()
    await openFor(w, 'Paracetamol 500mg')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await flushPromises()

    expect(lightbox()).not.toBeNull()
  })

  it('stops listening for Escape once the grid is gone', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const w = await mountGrid()
    w.unmount()
    wrapper = undefined

    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
