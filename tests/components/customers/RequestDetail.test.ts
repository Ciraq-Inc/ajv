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

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

import OrderRequests from '~/components/customers/orderRequests.vue'

let wrapper: ReturnType<typeof mount> | undefined
type W = ReturnType<typeof mount>

const LIST = [{ id: 7, request_number: 'R-107', status: 'pending', first_item_name: 'Amoxicillin', item_count: 2, created_at: '2020-01-01T10:00:00Z' }]

const open = async (detail: Record<string, unknown> = {}) => {
  store.state.getProfile.mockResolvedValue({})
  service.getCustomerSettings.mockResolvedValue({ data: {} })
  api.request.mockImplementation(async (url: string) => {
    if (url === '/api/order-requests/customer') return { data: LIST }
    if (url === '/api/order-requests/customer/7') {
      return {
        data: {
          id: 7, request_number: 'R-107', status: 'pending', fulfillment_type: null,
          items: [
            { id: 1, product_name: 'Amoxicillin 500mg', quantity: 2, marked_up_price: 12.5, item_status: 'available' },
            { id: 2, product_name: 'Paracetamol', quantity: 1, item_status: 'pending' },
          ],
          ...detail,
        },
      }
    }
    return { data: {} }
  })
  wrapper = mount(OrderRequests, { props: { defaultSubTab: 'list' }, attachTo: document.body })
  await flushPromises()
  const row = wrapper.findAll('button').find(b => b.text().includes('Amoxicillin'))!
  await row.trigger('click')
  await flushPromises()
  return wrapper
}
const dialog = () => document.body.querySelector('[role="dialog"][aria-labelledby="request-detail-title"]') as HTMLElement | null
const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

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

describe('Request detail: the dialog', () => {
  it('opens as a labelled modal dialog titled with the request number', async () => {
    await open()
    const d = dialog()

    expect(d).not.toBeNull()
    expect(d!.getAttribute('aria-modal')).toBe('true')
    expect(d!.querySelector('#request-detail-title')!.textContent).toContain('Request #R-107')
  })

  it('closes with Escape, the labelled Close button, or the backdrop', async () => {
    await open()
    press('Escape')
    await flushPromises()
    expect(dialog()).toBeNull()

    await open()
    ;(dialog()!.querySelector('button[aria-label="Close"]') as HTMLElement).click()
    await flushPromises()
    expect(dialog()).toBeNull()

    await open()
    ;(document.body.querySelector('[data-testid="request-detail-backdrop"]') as HTMLElement).click()
    await flushPromises()
    expect(dialog()).toBeNull()
  })

  it('says where the request stands in words, with a plain sentence beneath', async () => {
    await open()
    const header = dialog()!.querySelector('[data-testid="request-detail-status"]')!

    expect(header.textContent).toContain('Pending')
    expect(header.textContent).toContain('waiting for a pharmacist')
  })
})

describe('Request detail: items', () => {
  it('lists each item with its quantity and price, or says it is waiting for a price', async () => {
    await open()
    const items = dialog()!.querySelector('section[aria-labelledby="request-items-title"]')!

    expect(items.querySelectorAll('li')).toHaveLength(2)
    expect(items.textContent).toContain('Amoxicillin 500mg')
    expect(items.textContent).toContain('Qty 2')
    expect(items.textContent).toContain('GHS 12.50')
    expect(items.textContent).toContain('Waiting for a price')
  })

  it('offers Edit items while the request can still change, and opens the editor', async () => {
    await open()
    const edit = Array.from(dialog()!.querySelectorAll('button')).find(b => b.textContent!.includes('Edit items'))!

    expect(edit).toBeTruthy()
    edit.click()
    await flushPromises()

    expect(document.body.textContent).toMatch(/Edit request|Save changes/i)
  })

  it('does not offer Edit once the request is being paid for', async () => {
    await open({ status: 'out_for_delivery', fulfillment_type: 'delivery' })

    expect(Array.from(dialog()!.querySelectorAll('button')).some(b => b.textContent!.includes('Edit items'))).toBe(false)
  })
})

describe('Request detail: delivery progress', () => {
  it('shows the steps as a list and marks the current one', async () => {
    await open({ status: 'out_for_delivery', fulfillment_type: 'delivery' })
    const steps = dialog()!.querySelector('[data-testid="delivery-progress"] ol')!

    expect(Array.from(steps.querySelectorAll('li')).map(li => li.textContent!.trim()))
      .toEqual(['Preparing', 'Finding a rider', 'On the way'])
    expect(steps.querySelector('[aria-current="step"]')!.textContent).toContain('On the way')
  })

  it('says a rider is assigned, rather than still finding one, once one has claimed the order', async () => {
    await open({ status: 'driver_assigned', fulfillment_type: 'delivery' })
    const steps = dialog()!.querySelector('[data-testid="delivery-progress"] ol')!

    expect(Array.from(steps.querySelectorAll('li')).map(li => li.textContent!.trim()))
      .toEqual(['Preparing', 'Rider assigned', 'On the way'])
    expect(steps.querySelector('[aria-current="step"]')!.textContent).toContain('Rider assigned')
  })

  it('does not move back a step when the rider heads to the pharmacy', async () => {
    await open({ status: 'logistics_pending', fulfillment_type: 'delivery', rider_name: 'Kojo', rider_phone: '+233200000009' })
    const steps = dialog()!.querySelector('[data-testid="delivery-progress"] ol')!

    expect(steps.querySelector('[aria-current="step"]')!.textContent).toContain('Rider assigned')
  })
})

describe('Request detail: a delivery that could not be completed', () => {
  it('tells the customer it failed and what happens next, instead of showing the progress steps', async () => {
    await open({ status: 'delivery_failed', fulfillment_type: 'delivery', rider_name: 'Kojo', rider_phone: '+233200000009' })

    const notice = dialog()!.querySelector('[data-testid="delivery-failed"]')!
    expect(notice).not.toBeNull()
    expect(notice.textContent).toMatch(/couldn.t deliver/i)
    expect(notice.textContent).toMatch(/redeliver|refund/i)
    expect(dialog()!.querySelector('[data-testid="delivery-progress"]')).toBeNull()
    // the rider is no longer "on the way"
    expect(dialog()!.querySelector('[data-testid="rider-card"]')).toBeNull()
  })

  it('is not offered feedback, since nothing was delivered', async () => {
    await open({ status: 'delivery_failed', fulfillment_type: 'delivery' })
    expect(dialog()!.textContent).not.toMatch(/rate your/i)
  })
})

describe('Request detail: look', () => {
  it('uses brand tokens in the header, items and progress, not hex or zinc greys', async () => {
    await open({ status: 'out_for_delivery', fulfillment_type: 'delivery' })
    const parts = ['[data-testid="request-detail-header"]', 'section[aria-labelledby="request-items-title"]', '[data-testid="delivery-progress"]']
    const html = parts.map(p => dialog()!.querySelector(p)!.outerHTML).join('')

    expect(html).not.toMatch(/\[#[0-9a-fA-F]{3,6}\]/)
    expect(html).not.toContain('zinc-')
  })
})

const PAID_DELIVERY = { status: 'out_for_delivery', fulfillment_type: 'delivery', items_total: 25, delivery_fee: 5, estimated_total: 30 }
const part = (sel: string) => dialog()!.querySelector(sel) as HTMLElement | null
const link = (root: ParentNode, text: string) =>
  Array.from(root.querySelectorAll<HTMLAnchorElement>('a')).find(a => (a.getAttribute('aria-label') ?? a.textContent ?? '').includes(text)) ?? null

describe('Request detail: how it is being received', () => {
  it('says the order is for delivery or pickup in words', async () => {
    await open(PAID_DELIVERY)
    expect(part('[data-testid="fulfillment-method"]')!.textContent).toContain('Delivery')
    wrapper!.unmount(); document.body.innerHTML = ''

    await open({ ...PAID_DELIVERY, fulfillment_type: 'pickup', status: 'ready_for_pickup' })
    expect(part('[data-testid="fulfillment-method"]')!.textContent).toContain('Pickup')
  })

  it('lets the customer change the method only while they can still pay', async () => {
    await open({ ...PAID_DELIVERY, status: 'payment_pending' })
    const change = Array.from(part('[data-testid="fulfillment-method"]')!.querySelectorAll('button')).find(b => b.textContent!.includes('Change'))!

    expect(change).toBeTruthy()
    expect(change.getAttribute('aria-label')).toContain('delivery')
    wrapper!.unmount(); document.body.innerHTML = ''

    await open(PAID_DELIVERY)
    expect(part('[data-testid="fulfillment-method"]')!.querySelector('button')).toBeNull()
  })
})

describe('Request detail: who is bringing it', () => {
  it('shows the rider with a Call and a WhatsApp action that are easy to hit', async () => {
    await open({ ...PAID_DELIVERY, rider_name: 'Kofi Mensah', rider_phone: '0244000111' })
    const card = part('[data-testid="rider-card"]')!

    expect(card.textContent).toContain('Your rider is on the way')
    expect(card.textContent).toContain('Kofi Mensah')
    expect(link(card, 'Call Kofi Mensah')!.getAttribute('href')).toBe('tel:0244000111')
    expect(link(card, 'WhatsApp Kofi Mensah')!.getAttribute('href')).toBe('https://wa.me/233244000111')
    expect(link(card, 'Call Kofi Mensah')!.className).toContain('h-11')
  })

  it('shows where to collect a pickup, with Call, WhatsApp and Navigate', async () => {
    await open({
      status: 'ready_for_pickup', fulfillment_type: 'pickup',
      pharmacy: { name: 'Good Health Pharmacy', address: '12 Oxford St, Accra', phone: '0302123456' },
    })
    const card = part('[data-testid="pickup-card"]')!

    expect(card.textContent).toContain('Pickup location')
    expect(card.textContent).toContain('Good Health Pharmacy')
    expect(card.textContent).toContain('12 Oxford St, Accra')
    expect(link(card, 'Call')!.getAttribute('href')).toBe('tel:0302123456')
    expect(link(card, 'WhatsApp')!.getAttribute('href')).toContain('wa.me/233302123456')
    expect(link(card, 'Navigate')!.getAttribute('href')).toContain('google.com/maps')
    expect(link(card, 'Call')!.className).toContain('min-h-[44px]')
  })
})

describe('Request detail: totals', () => {
  it('lists items, delivery fee and the total as labelled rows', async () => {
    await open(PAID_DELIVERY)
    const totals = part('[data-testid="request-totals"]')!
    const rows = Array.from(totals.querySelectorAll('div')).map(r =>
      `${r.querySelector('dt')!.textContent!.trim()} ${r.querySelector('dd')!.textContent!.trim()}`)

    expect(totals.tagName).toBe('DL')
    expect(rows).toContain('Items total GHS 25.00')
    expect(rows).toContain('Delivery fee GHS 5.00')
    expect(rows).toContain('Estimated total GHS 30.00')
  })

  it('leaves out the delivery fee for a pickup', async () => {
    await open({ status: 'ready_for_pickup', fulfillment_type: 'pickup', items_total: 25, delivery_fee: 5, estimated_total: 25 })

    expect(part('[data-testid="request-totals"]')!.textContent).not.toContain('Delivery fee')
  })
})

describe('Request detail: the delivery code', () => {
  it('shows the code to read out to the rider, in plain large type, with what to do with it', async () => {
    await open({ ...PAID_DELIVERY, status: 'out_for_delivery', rider_name: 'Kofi', rider_phone: '0244000111', delivery_code: '4827' })
    const card = part('[data-testid="delivery-code"]')!

    expect(card.textContent).toContain('4827')
    expect(card.textContent).toMatch(/give (this|the) code to the rider/i)
    expect(card.textContent).toMatch(/only/i)
  })

  it('shows nothing when there is no code to give yet', async () => {
    await open({ ...PAID_DELIVERY, rider_name: 'Kofi', rider_phone: '0244000111', delivery_code: null })

    expect(part('[data-testid="delivery-code"]')).toBeNull()
  })
})

describe('Request detail: look, part two', () => {
  it('uses brand tokens in the method strip, rider, pickup and totals', async () => {
    await open({ ...PAID_DELIVERY, rider_name: 'Kofi', rider_phone: '0244000111' })
    const a = ['[data-testid="fulfillment-method"]', '[data-testid="rider-card"]', '[data-testid="request-totals"]'].map(s => part(s)!.outerHTML).join('')
    wrapper!.unmount(); document.body.innerHTML = ''
    await open({ status: 'ready_for_pickup', fulfillment_type: 'pickup', pharmacy: { name: 'P', address: 'A', phone: '0302123456' } })
    const html = a + part('[data-testid="pickup-card"]')!.outerHTML

    expect(html).not.toMatch(/\[#[0-9a-fA-F]{3,6}\]/)
    expect(html).not.toMatch(/zinc-|emerald-/)
  })
})

const DELIVERED = { status: 'delivered', fulfillment_type: 'delivery', items_total: 25, delivery_fee: 5, estimated_total: 30 }

describe('Request detail: feedback', () => {
  it('asks for each rating as a group of five star choices, one selectable at a time', async () => {
    await open(DELIVERED)
    const card = part('[data-testid="feedback-card"]')!
    const group = card.querySelector('[role="radiogroup"][aria-label="Product quality rating"]')!
    const stars = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))

    expect(stars).toHaveLength(5)
    expect(stars.map(s => s.getAttribute('aria-label'))).toEqual(['1 star', '2 stars', '3 stars', '4 stars', '5 stars'])
    expect(stars.every(s => s.getAttribute('aria-checked') === 'false')).toBe(true)

    stars[3].click()
    await flushPromises()

    expect(stars.map(s => s.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false', 'true', 'false'])
  })

  it('makes every star and the submit button easy to hit', async () => {
    await open(DELIVERED)
    const card = part('[data-testid="feedback-card"]')!
    const star = card.querySelector('[role="radio"]')!
    const submit = Array.from(card.querySelectorAll('button')).find(b => b.textContent!.includes('Submit Feedback'))!

    expect(star.className).toContain('h-11')
    expect(star.className).toContain('w-11')
    expect(submit.className).toContain('min-h-[44px]')
  })

  it('labels the notes box', async () => {
    await open(DELIVERED)
    const notes = part('[data-testid="feedback-card"] textarea')!

    expect(notes.getAttribute('aria-label')).toBeTruthy()
  })
})

describe('Request detail: decisions', () => {
  const decision = { id: 5, title: 'Pick an alternative', message: 'Amoxicillin is out of stock.' }

  it('puts the question first and the two answers as big buttons', async () => {
    await open({ pending_decisions: [decision] })
    const panel = part('[data-testid="decision-panel"]')!
    const buttons = Array.from(panel.querySelectorAll('button'))

    expect(panel.textContent).toContain('Pick an alternative')
    expect(panel.textContent).toContain('Amoxicillin is out of stock.')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    expect(buttons.every(b => b.className.includes('min-h-[44px]'))).toBe(true)
  })
})

describe('Request detail: look, part three', () => {
  it('uses brand tokens in feedback and decisions', async () => {
    await open({ ...DELIVERED, pending_decisions: [{ id: 5, title: 'T', message: 'M' }] })
    const html = part('[data-testid="feedback-card"]')!.outerHTML + part('[data-testid="decision-panel"]')!.outerHTML

    expect(html).not.toMatch(/\[#[0-9a-fA-F]{3,6}\]/)
    expect(html).not.toMatch(/zinc-|emerald-/)
  })
})

describe('Request detail: address', () => {
  it('says where it is going in a labelled row', async () => {
    await open({ ...PAID_DELIVERY, delivery_address: '12 Oxford St, Osu, Accra, Ghana' })
    const row = part('[data-testid="request-address"]')!

    expect(row.textContent).toContain('Delivery address')
    expect(row.textContent).toContain('Oxford St')
    expect(row.outerHTML).not.toMatch(/zinc-|emerald-|\[#[0-9a-fA-F]{3,6}\]/)
  })
})

describe('Request detail: the receiver', () => {
  const WITH_RECEIVER = { ...PAID_DELIVERY, recipient_name: 'Ama Mensah', recipient_phone: '+233244000111', recipient_email: 'ama@example.com', recipient_locked: false }
  const card = () => part('[data-testid="receiver-card"]')
  const changeButton = () => Array.from(card()!.querySelectorAll('button')).find(b => b.textContent!.trim() === 'Change')
  const type = async (sel: string, value: string) => {
    const el = card()!.querySelector(sel) as HTMLInputElement
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
  }
  const putCalls = () => api.request.mock.calls.filter(([url, o]) => String(url).endsWith('/recipient') && o?.method === 'PUT')

  it('says who the delivery is for', async () => {
    await open(WITH_RECEIVER)

    expect(card()!.textContent).toContain('Ama Mensah')
    expect(card()!.textContent).toContain('+233244000111')
    expect(card()!.textContent).toMatch(/you still get every update/i)
  })

  it('shows nothing for an order with no receiver', async () => {
    await open(PAID_DELIVERY)

    expect(card()).toBeNull()
  })

  it('lets the orderer change the receiver until a rider is assigned', async () => {
    await open(WITH_RECEIVER)
    await changeButton()!.click()
    await flushPromises()
    await type('#detail-receiver-name', 'Esi Owusu')
    await type('#detail-receiver-phone', '020 400 0222')
    ;(Array.from(card()!.querySelectorAll('button')).find(b => b.textContent!.trim() === 'Save')!).click()
    await flushPromises()

    expect(putCalls()).toHaveLength(1)
    expect(putCalls()[0]![0]).toBe('/api/order-requests/customer/7/recipient')
    expect(JSON.parse(putCalls()[0]![1].body)).toMatchObject({ recipient_name: 'Esi Owusu', recipient_phone: '+233204000222' })
    expect(card()!.textContent).toContain('Esi Owusu')
    expect(card()!.textContent).toContain('+233204000222')
  })

  it('offers no change once a rider has been assigned, and says why', async () => {
    await open({ ...WITH_RECEIVER, recipient_locked: true })

    expect(changeButton()).toBeUndefined()
    expect(card()!.textContent).toMatch(/rider|can no longer be changed/i)
  })

  it('shows the server\'s reason when the change is refused, and keeps the old receiver', async () => {
    await open(WITH_RECEIVER)
    const original = api.request.getMockImplementation()!
    api.request.mockImplementation(async (url: string, o: any) => {
      if (String(url).endsWith('/recipient')) throw Object.assign(new Error('A rider has been assigned, so the receiver can no longer be changed.'), { status: 409 })
      return original(url, o)
    })
    await changeButton()!.click()
    await flushPromises()
    await type('#detail-receiver-name', 'Esi')
    await type('#detail-receiver-phone', '0204000222')
    ;(Array.from(card()!.querySelectorAll('button')).find(b => b.textContent!.trim() === 'Save')!).click()
    await flushPromises()

    expect(card()!.textContent).toContain('A rider has been assigned')
    expect(card()!.textContent).toContain('Ama Mensah')
  })

  it('does not leave a half-edited receiver open when the request is closed and opened again', async () => {
    const w = await open(WITH_RECEIVER)
    await changeButton()!.click()
    await flushPromises()
    expect(card()!.querySelector('#detail-receiver-name')).not.toBeNull()

    press('Escape')
    await flushPromises()
    await w.findAll('button').find(b => b.text().includes('Amoxicillin'))!.trigger('click')
    await flushPromises()

    expect(card()!.querySelector('#detail-receiver-name')).toBeNull()
    expect(card()!.textContent).toContain('Ama Mensah')
  })
})
