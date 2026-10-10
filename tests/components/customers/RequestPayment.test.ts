import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: HTTP (useApi + service), user store, Nuxt globals ──
const api = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('~/composables/useApi', () => ({
  useApi: () => api,
  ApiError: class ApiError extends Error {
    status?: number
    data?: Record<string, unknown>
  },
}))

const service = vi.hoisted(() => ({ getCustomerSettings: vi.fn() }))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({
  createOrderRequestsService: () => service,
}))

const store = vi.hoisted(() => ({ state: null as any }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store.state }))

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

import OrderRequests from '~/components/customers/orderRequests.vue'

let wrapper: ReturnType<typeof mount> | undefined

const LIST = [{ id: 7, request_number: 'R-107', status: 'payment_pending', first_item_name: 'Amoxicillin', item_count: 1, estimated_total: 55, created_at: '2020-01-01T10:00:00Z' }]
const OPTIONS = {
  fee_applicable: true,
  request_fee: 5,
  pickup: { available: true, total: 50, total_fee_applied: 45, pharmacy: { distance_km: 2 } },
  delivery: { fee: 5, total: 55, total_fee_applied: 50 },
}

interface Setup { detail?: Record<string, unknown>, options?: Record<string, unknown>, balance?: number, pay?: () => Promise<unknown> }
const open = async (s: Setup = {}) => {
  store.state.getProfile.mockResolvedValue({})
  service.getCustomerSettings.mockResolvedValue({ data: {} })
  api.request.mockImplementation(async (url: string, opts?: { method?: string }) => {
    if (url === '/api/wallet') return { data: { balance: s.balance ?? 100 } }
    if (url === '/api/order-requests/customer') return { data: LIST }
    if (url === '/api/order-requests/customer/7/payment-options') return { data: { ...OPTIONS, ...(s.options ?? {}) } }
    if (url === '/api/order-requests/customer/7/pay' && opts?.method === 'POST') return s.pay ? s.pay() : { message: 'Paid' }
    if (url === '/api/order-requests/customer/7') {
      return {
        data: {
          id: 7, request_number: 'R-107', status: 'payment_pending', fulfillment_type: null,
          items_total: 50, estimated_total: 55, delivery_fee: 5,
          items: [{ id: 1, product_name: 'Amoxicillin', quantity: 1, marked_up_price: 50 }],
          ...(s.detail ?? {}),
        },
      }
    }
    return { data: {} }
  })
  wrapper = mount(OrderRequests, { props: { defaultSubTab: 'list' }, attachTo: document.body })
  await flushPromises()
  await wrapper.findAll('button').find(b => b.text().includes('Amoxicillin'))!.trigger('click')
  await flushPromises()
}
const dialog = () => document.body.querySelector('[role="dialog"][aria-labelledby="request-detail-title"]') as HTMLElement | null
const payment = () => dialog()!.querySelector('[data-testid="request-payment"]') as HTMLElement
const find = (root: ParentNode, sel: string, text: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(sel)).find(e => (e.getAttribute('aria-label') ?? e.textContent ?? '').includes(text)) ?? null
const radio = (text: string) => find(payment(), '[role="radio"]', text)
const btn = (text: string) => find(payment(), 'button', text) as HTMLButtonElement | null
const click = async (e: HTMLElement | null) => { if (!e) throw new Error('missing element'); e.click(); await flushPromises() }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  store.state = {
    currentUser: { phone: '0244123456', email: '' },
    masterCustomer: { id: 1 },
    customerAuthToken: 'tok',
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    clearAuthState: vi.fn(),
  }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('Request payment: choosing how to receive the order', () => {
  it('offers pickup and delivery as a labelled choice, and explains why there is no total yet', async () => {
    await open()
    const group = payment().querySelector('[role="radiogroup"][aria-labelledby="request-method-title"]')!

    expect(payment().querySelector('#request-method-title')!.textContent).toContain('How would you like to receive your order?')
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(2)
    expect(radio('Pickup')!.getAttribute('aria-checked')).toBe('false')
    expect(payment().textContent).toContain('Choose pickup or delivery to see your total.')
    expect(btn('Pay with wallet')!.disabled).toBe(true)
  })

  it('says why pickup is not available, and does not let it be chosen', async () => {
    await open({ options: { pickup: { available: false, unavailable_reason: 'closed' } } })
    const pickup = radio('Pickup') as HTMLButtonElement

    expect(pickup.disabled).toBe(true)
    expect(pickup.textContent).toContain('The pharmacy is currently closed')
  })

  it('shows the total once a method is chosen, with the search fee kept for later by default', async () => {
    await open()
    await click(radio('Delivery'))

    expect(radio('Delivery')!.getAttribute('aria-checked')).toBe('true')
    expect(radio('Return to wallet')!.getAttribute('aria-checked')).toBe('true')
    expect(payment().querySelector('[data-testid="payment-total"]')!.textContent).toContain('GHS 55.00')
  })

  it('lets the customer take the search fee off this order', async () => {
    await open()
    await click(radio('Delivery'))
    await click(radio('Apply to order'))

    expect(radio('Apply to order')!.getAttribute('aria-checked')).toBe('true')
    expect(payment().querySelector('[data-testid="payment-total"]')!.textContent).toContain('GHS 50.00')
  })
})

describe('Request payment: contact number for delivery', () => {
  const emailOnly = () => { store.state.currentUser = { phone: '', email: 'a@b.co' } }
  const putBody = () => {
    const call = api.request.mock.calls.find(([url, o]) => url === '/api/order-requests/customer/7/fulfillment' && o?.method === 'PUT')
    return call ? JSON.parse(call[1].body) : null
  }
  const phoneBox = () => payment().querySelector('#request-contact-phone') as HTMLInputElement | null
  const type = async (el: HTMLInputElement, v: string) => { el.value = v; el.dispatchEvent(new Event('input')); await flushPromises() }

  it('asks an email-only account for a number once it picks delivery, and not for pickup', async () => {
    emailOnly()
    await open()
    expect(phoneBox()).toBeNull()

    await click(radio('Pickup'))
    expect(phoneBox()).toBeNull()

    await click(radio('Delivery'))
    expect(phoneBox()).not.toBeNull()
  })

  it('keeps Pay off until a valid number is typed, then sends it with the delivery choice', async () => {
    emailOnly()
    await open()
    await click(radio('Delivery'))
    expect(btn('Pay with wallet')!.disabled).toBe(true)

    await type(phoneBox()!, '0244123456')
    expect(btn('Pay with wallet')!.disabled).toBe(false)

    await click(btn('Pay with wallet'))
    expect(putBody()).toMatchObject({ fulfillment_type: 'delivery', contact_phone: '+233244123456' })
  })

  it('asks for a number that can be reached by call or WhatsApp', async () => {
    emailOnly()
    await open()
    await click(radio('Delivery'))

    const block = payment().querySelector('[data-testid="delivery-contact"]')!
    expect(block.textContent).toMatch(/call or WhatsApp/i)
    expect(block.textContent).not.toMatch(/rider uses this/i)
  })

  it('does not ask when the account already has a number', async () => {
    await open()
    await click(radio('Delivery'))

    expect(phoneBox()).toBeNull()
  })

  it('does not ask when the order goes to a receiver', async () => {
    emailOnly()
    await open({ detail: { recipient_phone: '+233200000001' } })
    await click(radio('Delivery'))

    expect(phoneBox()).toBeNull()
  })

  it('says the choice is locked when the server refuses it', async () => {
    await open()
    const original = api.request.getMockImplementation()!
    api.request.mockImplementation(async (url: string, opts?: { method?: string }) => {
      if (url.endsWith('/fulfillment') && opts?.method === 'PUT') throw Object.assign(new Error('You can no longer change how this order is received.'), { status: 409, data: { code: 'FULFILLMENT_LOCKED' } })
      return original(url, opts)
    })
    await click(radio('Delivery'))
    await click(btn('Pay with wallet'))

    expect(payment().textContent).toContain('no longer change how this order is received')
  })
})

describe('Request payment: delivering to someone else', () => {
  const putBody = () => {
    const call = api.request.mock.calls.find(([url, o]) => url === '/api/order-requests/customer/7/fulfillment' && o?.method === 'PUT')
    return call ? JSON.parse(call[1].body) : null
  }
  const el = (sel: string) => payment().querySelector(sel) as HTMLInputElement | null
  const type = async (sel: string, v: string) => { const e = el(sel)!; e.value = v; e.dispatchEvent(new Event('input')); await flushPromises() }
  const setToggle = async (on: boolean) => { const t = el('#payment-someone-else')!; t.checked = on; t.dispatchEvent(new Event('change')); await flushPromises() }
  const fill = async (name: string, phone: string, email = '') => {
    await setToggle(true)
    await type('#payment-receiver-name', name)
    await type('#payment-receiver-phone', phone)
    if (email) await type('#payment-receiver-email', email)
  }

  it('is offered only once delivery is chosen', async () => {
    await open()
    expect(el('#payment-someone-else')).toBeNull()

    await click(radio('Pickup'))
    expect(el('#payment-someone-else')).toBeNull()

    await click(radio('Delivery'))
    expect(el('#payment-someone-else')).not.toBeNull()
    expect(payment().textContent).toContain('Delivering to someone else?')
    expect(el('#payment-someone-else')!.checked).toBe(false)
    expect(el('#payment-receiver-name')).toBeNull()
  })

  it('asks for their name, number and email, and keeps Pay off until name and number are valid', async () => {
    await open()
    await click(radio('Delivery'))
    await setToggle(true)

    expect(el('#payment-receiver-name')).not.toBeNull()
    expect(el('#payment-receiver-phone')).not.toBeNull()
    expect(el('#payment-receiver-email')).not.toBeNull()
    expect(btn('Pay with wallet')!.disabled).toBe(true)

    await type('#payment-receiver-name', 'Ama Mensah')
    expect(btn('Pay with wallet')!.disabled).toBe(true)
    await type('#payment-receiver-phone', '024 400 0111')
    expect(btn('Pay with wallet')!.disabled).toBe(false)
  })

  it('sends the receiver with the delivery choice', async () => {
    await open()
    await click(radio('Delivery'))
    await fill('Ama Mensah', '024 400 0111', 'Ama@Example.com')
    await click(btn('Pay with wallet'))

    expect(putBody()).toMatchObject({
      fulfillment_type: 'delivery',
      recipient_name: 'Ama Mensah',
      recipient_phone: '+233244000111',
      recipient_email: 'ama@example.com',
    })
  })

  it('sends no receiver when it is switched off, even after it was filled in', async () => {
    await open()
    await click(radio('Delivery'))
    await fill('Ama', '0244000111')
    await setToggle(false)
    await click(btn('Pay with wallet'))

    const body = putBody()
    expect(body).toMatchObject({ fulfillment_type: 'delivery' })
    expect(body).not.toHaveProperty('recipient_name')
    expect(body).not.toHaveProperty('recipient_phone')
  })

  it('drops the receiver again if the customer goes back to pickup', async () => {
    await open()
    await click(radio('Delivery'))
    await fill('Ama', '0244000111')
    await click(radio('Pickup'))
    await click(btn('Pay with wallet'))

    const body = putBody()
    expect(body).toMatchObject({ fulfillment_type: 'pickup' })
    expect(body).not.toHaveProperty('recipient_phone')
  })

  it('does not also ask an email-only account for its own number when a receiver is named', async () => {
    store.state.currentUser = { phone: '', email: 'a@b.co' }
    await open()
    await click(radio('Delivery'))
    expect(el('#request-contact-phone')).not.toBeNull()

    await fill('Ama', '0244000111')

    expect(el('#request-contact-phone')).toBeNull()
    expect(btn('Pay with wallet')!.disabled).toBe(false)
    await click(btn('Pay with wallet'))
    expect(putBody()).not.toHaveProperty('contact_phone')
  })

  it('tells the customer a foreign number cannot be texted and suggests an email', async () => {
    await open()
    await click(radio('Delivery'))
    await setToggle(true)
    expect(payment().textContent).not.toContain('We can only text Ghana numbers')

    await type('#payment-receiver-phone', '+44 7911 123456')

    expect(el('#payment-receiver-foreign-hint')!.textContent).toMatch(/only text Ghana numbers/i)
  })

  it("refuses the customer's own number as the receiver", async () => {
    await open()
    await click(radio('Delivery'))
    await fill('Kofi', '0244123456')

    expect(btn('Pay with wallet')!.disabled).toBe(true)
    expect(el('#payment-receiver-phone-error')!.textContent).toMatch(/your own number/i)
  })

  it('is not offered when the way of receiving was already settled', async () => {
    await open({ detail: { fulfillment_type: 'delivery' } })

    expect(el('#payment-someone-else')).toBeNull()
  })
})

describe('Request payment: paying', () => {
  it('pays from the wallet with the main button when the balance covers it', async () => {
    await open({ detail: { fulfillment_type: 'delivery' }, balance: 100 })
    const wallet = btn('Pay with wallet')!

    expect(wallet.textContent).toContain('GHS 55.00')
    expect(wallet.disabled).toBe(false)
    expect(wallet.className).toContain('bg-brand-700')

    await click(wallet)
    expect(api.request).toHaveBeenCalledWith('/api/order-requests/customer/7/pay', expect.objectContaining({ method: 'POST' }))
  })

  it('turns the wallet button off with a reason and a way to top up when the balance is too low', async () => {
    await open({ detail: { fulfillment_type: 'delivery' }, balance: 10 })
    const wallet = btn('Pay with wallet')!

    expect(wallet.disabled).toBe(true)
    expect(wallet.getAttribute('aria-describedby')).toBeTruthy()
    expect(payment().querySelector(`#${wallet.getAttribute('aria-describedby')}`)!.textContent).toContain('Your wallet has GHS 10.00')
    expect(btn('Top up wallet')).not.toBeNull()
    expect(btn('Pay with card or mobile money')!.className).toContain('bg-brand-700')
  })

  it('shows the card fee in plain words', async () => {
    await open({ detail: { fulfillment_type: 'delivery' } })

    expect(payment().textContent).toMatch(/GHS \d+\.\d\d Paystack processing fee/)
  })

  it('says it is working while the payment goes through, and blocks a second tap', async () => {
    await open({ detail: { fulfillment_type: 'delivery' }, pay: () => new Promise(() => {}) })
    await click(btn('Pay with wallet'))

    expect(payment().querySelector('[role="status"]')!.textContent).toContain('Paying')
    expect(btn('Paying')!.disabled).toBe(true)
    expect(btn('Pay with card or mobile money')!.disabled).toBe(true)
  })

  it('tells the customer when pricing is still being confirmed', async () => {
    await open({ detail: { items_total: 0, estimated_total: 0, items: [] } })

    expect(dialog()!.querySelector('[role="status"]')!.textContent).toContain('We are confirming the price')
  })
})

describe('Request payment: cancelling', () => {
  it('offers Cancel request while it can still be cancelled', async () => {
    await open({ detail: { status: 'pending' } })

    expect(find(dialog()!, 'button', 'Cancel request')).not.toBeNull()
  })

  it.each(['awaiting_input', 'awaiting_customer', 'awaiting_method_selection', 'payment_pending'])(
    'lets the customer walk away while the request is waiting on them (%s)',
    async (status) => {
      await open({ detail: { status } })

      expect(find(dialog()!, 'button', 'Cancel request')).not.toBeNull()
    },
  )

  it('does not offer Cancel request once it is paid', async () => {
    await open({ detail: { status: 'paid' } })

    expect(find(dialog()!, 'button', 'Cancel request')).toBeNull()
  })
})

describe('Request payment: look', () => {
  it('uses brand tokens, not hex or zinc greys', async () => {
    await open({ detail: { fulfillment_type: 'delivery' } })
    const html = payment().outerHTML

    expect(html).not.toMatch(/\[#[0-9a-fA-F]{3,6}\]/)
    expect(html).not.toContain('zinc-')
  })
})
