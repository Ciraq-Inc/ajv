import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: the three stores (their own logic is tested elsewhere) ──────
const cart = vi.hoisted(() => ({
  items: [] as Array<Record<string, unknown>>,
  cartTotal: 0,
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
}))
const pharmacy = vi.hoisted(() => ({
  pharmacyData: null as null | Record<string, unknown>,
  currentPharmacy: null as unknown,
}))
const user = vi.hoisted(() => ({ isLoggedIn: false, processDirectOrder: vi.fn() }))
vi.mock('~/stores/cart', () => ({ useCartStore: () => cart }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => pharmacy }))
vi.mock('~/stores/user', () => ({ useUserStore: () => user }))

// The real Login card has its own tests; this probe exposes how the sidebar drives it.
const LoginProbe = {
  props: ['isOpen'],
  emits: ['close', 'login-success'],
  template: `<div data-testid="login-modal"><button data-testid="login-ok" @click="$emit('login-success', {})">ok</button><button data-testid="login-close" @click="$emit('close')">close</button></div>`,
}

import CartSidebar from '~/components/CartSidebar.vue'

const PHARMACY = { name: 'Rigel Pharmacy', location: 'East Legon', whatsapp_number: '0244123456', hide_prices: false }
const ITEMS = [
  { id: 1, name: 'Paracetamol 500mg', price: 5, quantity: 2, image: '/p.png' },
  { id: 2, name: 'Vitamin C', price: 12.5, quantity: 1 },
]

let wrapper: ReturnType<typeof mount> | undefined
const mountOpen = async () => {
  wrapper = mount(CartSidebar, { attachTo: document.body, global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, Login: LoginProbe } } })
  ;(wrapper.vm as unknown as { toggleCart: () => void }).toggleCart()
  await flushPromises()
  return wrapper
}
const button = (w: ReturnType<typeof mount>, text: string) => {
  const b = w.findAll('button').find(x => x.text().includes(text))
  if (!b) throw new Error(`no button "${text}"`)
  return b
}

beforeEach(() => {
  vi.clearAllMocks()
  cart.items = ITEMS.map(i => ({ ...i }))
  cart.cartTotal = 22.5
  pharmacy.pharmacyData = { ...PHARMACY }
  pharmacy.currentPharmacy = { id: 7 }
  user.isLoggedIn = true
  user.processDirectOrder.mockResolvedValue({ orderId: 'ORD-9', orderData: { status: 'new' } })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(window, 'open').mockImplementation(() => null)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('CartSidebar: opening and closing', () => {
  it('is hidden until opened from outside', () => {
    wrapper = mount(CartSidebar, { global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, Login: LoginProbe } } })
    expect(wrapper.text()).not.toContain('Your Cart')

    ;(wrapper.vm as unknown as { toggleCart: () => void }).toggleCart()
    return flushPromises().then(() => expect(wrapper!.text()).toContain('Your Cart'))
  })

  it('tells the parent when it is closed with the X', async () => {
    const w = await mountOpen()
    await w.find('button[aria-label="Close cart"]').trigger('click')
    await flushPromises()

    expect(w.emitted('close')).toHaveLength(1)
    expect(w.text()).not.toContain('Your Cart')
  })

  it('is a modal dialog named by its heading', async () => {
    const w = await mountOpen()
    const dialog = w.find('[role="dialog"]')

    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    const title = w.find('#' + dialog.attributes('aria-labelledby'))
    expect(title.text()).toBe('Your Cart')
  })

  it('closes with Escape', async () => {
    const w = await mountOpen()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(w.emitted('close')).toHaveLength(1)
    expect(w.text()).not.toContain('Your Cart')
  })

  it('closes when the dimmed backdrop is clicked', async () => {
    const w = await mountOpen()
    await w.find('[data-testid="cart-backdrop"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('"Continue Shopping" closes it too', async () => {
    const w = await mountOpen()
    await button(w, 'Continue Shopping').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})

describe('CartSidebar: contents', () => {
  it('shows an empty cart without a checkout footer', async () => {
    cart.items = []
    const w = await mountOpen()

    expect(w.text()).toContain('Your cart is empty')
    expect(w.text()).not.toContain('Send Order via WhatsApp')
  })

  it('an empty cart says what to do next, and the button takes them back to shopping', async () => {
    cart.items = []
    const w = await mountOpen()

    expect(w.text()).toMatch(/add (a )?(medicine|product)/i)
    await button(w, 'Browse products').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('lists each item with its unit price and quantity, and the total', async () => {
    const w = await mountOpen()
    const text = w.text()

    expect(text).toContain('Paracetamol 500mg')
    expect(text).toContain('GHS 5.00')
    expect(text).toContain('Vitamin C')
    expect(text).toContain('GHS 12.50')
    expect(text).toContain('Total:')
    expect(text).toContain('GHS 22.50')
  })

  it('shows the pharmacy the order is for', async () => {
    const text = (await mountOpen()).text()
    expect(text).toContain('Order from: Rigel Pharmacy')
    expect(text).toContain('East Legon')
  })

  it('shows a product photo only for items that have one', async () => {
    const w = await mountOpen()
    const imgs = w.findAll('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].attributes('alt')).toBe('Paracetamol 500mg')
  })

  it('hides every price, and the total, when the pharmacy hides prices', async () => {
    pharmacy.pharmacyData = { ...PHARMACY, hide_prices: true }
    const text = (await mountOpen()).text()

    expect(text).not.toContain('GHS')
    expect(text).not.toContain('Total:')
  })
})

describe('CartSidebar: changing the cart', () => {
  it('increases and decreases the quantity of the right item', async () => {
    const w = await mountOpen()

    await w.find('button[aria-label="Increase quantity of Paracetamol 500mg"]').trigger('click')
    expect(cart.updateQuantity).toHaveBeenLastCalledWith(1, 3)

    await w.find('button[aria-label="Decrease quantity of Paracetamol 500mg"]').trigger('click')
    expect(cart.updateQuantity).toHaveBeenLastCalledWith(1, 1)
  })

  it('cannot decrease below one', async () => {
    const w = await mountOpen()
    const minus = w.find('button[aria-label="Decrease quantity of Vitamin C"]')
    expect(minus.attributes('disabled')).toBeDefined()
    expect(minus.attributes('title')).toMatch(/remove/i) // says what to do instead
  })

  it('removes an item', async () => {
    const w = await mountOpen()
    await w.find('button[aria-label="Remove Vitamin C from cart"]').trigger('click')
    expect(cart.removeFromCart).toHaveBeenCalledWith(2)
  })
})

describe('CartSidebar: ordering by WhatsApp', () => {
  const sentUrl = () => new URL(String((window.open as ReturnType<typeof vi.fn>).mock.calls[0][0]))

  it.each([
    ['0244123456', '233244123456'],
    ['+233 24 412 3456', '233244123456'],
    ['244123456', '233244123456'],
    ['233244123456', '233244123456'],
    ['0244123456 / 0200000000', '233244123456'],
    ['(024) 412-3456', '233244123456'],
  ])('sends %s to wa.me/%s', async (given, expected) => {
    pharmacy.pharmacyData = { ...PHARMACY, whatsapp_number: given }
    const w = await mountOpen()
    await button(w, 'Send Order via WhatsApp').trigger('click')

    expect(sentUrl().pathname).toBe(`/${expected}`)
    expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank')
  })

  it('writes the order into the message, with line totals and the grand total', async () => {
    const w = await mountOpen()
    await button(w, 'Send Order via WhatsApp').trigger('click')
    const message = sentUrl().searchParams.get('text')!

    expect(message).toContain('*ORDER REQUEST*')
    expect(message).toContain('from *Rigel Pharmacy* (East Legon)')
    expect(message).toContain('1. Paracetamol 500mg - *2* (GHS 10.00)')
    expect(message).toContain('2. Vitamin C - *1* (GHS 12.50)')
    expect(message).toContain('*Total Amount: GHS22.50*')
  })

  it('leaves prices out of the message when the pharmacy hides them', async () => {
    pharmacy.pharmacyData = { ...PHARMACY, hide_prices: true }
    const w = await mountOpen()
    await button(w, 'Send Order via WhatsApp').trigger('click')
    const message = sentUrl().searchParams.get('text')!

    expect(message).toContain('1. Paracetamol 500mg - *2*')
    expect(message).not.toContain('GHS')
    expect(message).not.toContain('Total Amount')
  })

  it('addresses "your pharmacy" when the pharmacy name is unknown', async () => {
    pharmacy.pharmacyData = { whatsapp_number: '0244123456' }
    const w = await mountOpen()
    await button(w, 'Send Order via WhatsApp').trigger('click')

    expect(sentUrl().searchParams.get('text')).toContain('from *your pharmacy*')
  })

  it('empties the cart and closes the sidebar after sending', async () => {
    const w = await mountOpen()
    await button(w, 'Send Order via WhatsApp').trigger('click')

    expect(cart.clearCart).toHaveBeenCalledTimes(1)
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.text()).not.toContain('Your Cart')
  })
})

describe('CartSidebar: ordering directly', () => {
  it('Escape in the sign-in dialog leaves the cart open underneath', async () => {
    user.isLoggedIn = false
    const w = await mountOpen()
    await button(w, 'Sign in to Order Directly').trigger('click')
    expect(w.find('[data-testid="login-modal"]').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(w.emitted('close')).toBeUndefined()
    expect(w.text()).toContain('Your Cart')
  })

  it('invites a signed-out customer to sign in, and opens the sign-in modal', async () => {
    user.isLoggedIn = false
    const w = await mountOpen()
    expect(w.text()).toContain('Want faster checkout?')
    expect(w.find('[data-testid="login-modal"]').exists()).toBe(false)

    await button(w, 'Sign in to Order Directly').trigger('click')
    expect(w.find('[data-testid="login-modal"]').exists()).toBe(true)
    expect(user.processDirectOrder).not.toHaveBeenCalled()
  })

  it('places the order straight after the customer signs in', async () => {
    user.isLoggedIn = false
    const w = await mountOpen()
    await button(w, 'Sign in to Order Directly').trigger('click')
    await w.find('[data-testid="login-ok"]').trigger('click')
    await flushPromises()

    expect(user.processDirectOrder).toHaveBeenCalledTimes(1)
  })

  it('closes the sign-in modal without ordering', async () => {
    user.isLoggedIn = false
    const w = await mountOpen()
    await button(w, 'Sign in to Order Directly').trigger('click')
    await w.find('[data-testid="login-close"]').trigger('click')

    expect(w.find('[data-testid="login-modal"]').exists()).toBe(false)
    expect(user.processDirectOrder).not.toHaveBeenCalled()
  })

  describe('as a signed-in customer', () => {
    it('sends the cart and the pharmacy to the store', async () => {
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(user.processDirectOrder).toHaveBeenCalledWith(ITEMS.map(i => ({ ...i })), { id: 7 })
    })

    it('then clears the cart, closes, and reports the order with a summary of what was in it', async () => {
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(cart.clearCart).toHaveBeenCalledTimes(1)
      expect(w.emitted('close')).toHaveLength(1)
      expect(w.emitted('order-success')![0][0]).toEqual({
        status: 'new',
        orderId: 'ORD-9',
        totalItems: 2,
        totalQuantity: 3,
        totalAmount: 22.5,
      })
    })

    it('shows progress, and blocks double ordering, while the order is placed', async () => {
      let finish!: (v: unknown) => void
      user.processDirectOrder.mockReturnValue(new Promise((res) => { finish = res }))
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')

      const placing = button(w, 'Placing your order...')
      expect(placing.attributes('disabled')).toBeDefined()
      expect(button(w, 'Send Order via WhatsApp').attributes('disabled')).toBeDefined()

      finish({ orderId: 'x' })
      await flushPromises()
    })

    it('refuses, without calling the store, when no pharmacy is selected', async () => {
      pharmacy.currentPharmacy = null
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain('Pharmacy information is missing. Please try again.')
      expect(user.processDirectOrder).not.toHaveBeenCalled()
      expect(cart.clearCart).not.toHaveBeenCalled()
    })

    it('keeps the cart and shows the reason when the order fails', async () => {
      user.processDirectOrder.mockRejectedValue(new Error('Out of stock: Vitamin C'))
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain('Out of stock: Vitamin C')
      expect(cart.clearCart).not.toHaveBeenCalled()
      expect(w.emitted('order-success')).toBeUndefined()
      expect(w.text()).toContain('Paracetamol 500mg')
    })

    it('uses a friendly message when the failure carries none', async () => {
      user.processDirectOrder.mockRejectedValue(new Error(''))
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain("We couldn't place your order. Please try again.")
    })

    it.each([
      ['an API error body', Object.assign(new Error('Forbidden'), { body: { error_code: 'CUSTOMER_NOT_REGISTERED_WITH_COMPANY' } })],
      ['a store error code', Object.assign(new Error('Forbidden'), { errorCode: 'CUSTOMER_NOT_REGISTERED_WITH_COMPANY' })],
    ])('explains that the customer is not registered at the pharmacy (from %s)', async (_label, error) => {
      user.processDirectOrder.mockRejectedValue(error)
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain("You're not registered at Rigel Pharmacy yet")
      // …and the footer switches to the WhatsApp-first guidance instead of offering the same failing button.
      expect(w.text()).toContain('Your WhatsApp order works fine')
      expect(w.text()).not.toContain('Order Directly (Free Trial)')
    })

    it('names "this pharmacy" when the pharmacy name is unknown', async () => {
      pharmacy.pharmacyData = { whatsapp_number: '0244123456' }
      user.processDirectOrder.mockRejectedValue(Object.assign(new Error('x'), { errorCode: 'CUSTOMER_NOT_REGISTERED_WITH_COMPANY' }))
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain("registered at this pharmacy yet")
    })

    it('forgets an old error when the customer closes the cart', async () => {
      user.processDirectOrder.mockRejectedValue(new Error('Nope'))
      const w = await mountOpen()
      await button(w, 'Order Directly').trigger('click')
      await flushPromises()
      expect(w.find('[role="alert"]').exists()).toBe(true)

      await w.find('button[aria-label="Close cart"]').trigger('click')
      ;(w.vm as unknown as { toggleCart: () => void }).toggleCart()
      await flushPromises()

      expect(w.find('[role="alert"]').exists()).toBe(false)
    })
  })
})
