import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The pharmacy outreach board on a request being sourced: who has been contacted, what they answered,
// and what that records. HTTP is the boundary; each row's buttons are the public interface.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), request: vi.fn() }))
const route = vi.hoisted(() => ({ query: { requestId: '5' } as Record<string, unknown>, path: '/admin/fulfillment/order-requests' }))
const adminStore = vi.hoisted(() => ({ isSuperAdmin: true, hasRole: () => true, user: { id: 1 } }))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.mock('~/composables/useApi', () => ({ useApi: () => http }))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => adminStore }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

import * as formatters from '~/composables/useOrderRequestFormatters'
import OrderRequestsPage from '~/pages/admin/fulfillment/order-requests.vue'

for (const [name, fn] of Object.entries(formatters)) vi.stubGlobal(name, fn)

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
let wrapper: ReturnType<typeof mount>

const request = () => ({
  id: 5,
  status: 'sourcing',
  items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2, unit_price: 5 }],
  decisions: [],
})
const entry = (over: Record<string, unknown> = {}) => ({
  pharmacy_id: 21,
  pharmacy_name: 'Healthway Pharmacy',
  phone: '0241234567',
  queue_state: 'not_contacted',
  fully_covers_request: true,
  distance_km: 1.5,
  covered: [{ item_id: 9, matched_product_id: 77 }],
  ...over,
})

let failOn: string | undefined
const open = async (queue: unknown[]) => {
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: request() }
    if (url === '/api/order-requests/admin/5/process') return { success: true, data: { request: request(), status: 'sourcing', pharmacy_queue: queue } }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const calls = (re: RegExp, method?: string) =>
  http.request.mock.calls.filter(([url, o]) => re.test(url) && (!method || (o?.method ?? 'GET') === method))
const contacts = () => calls(/\/admin\/5\/contact\//, 'POST').map(([url, o]) => [url, JSON.parse(o.body)])
const btn = (cls: string) => wrapper.find(`button.${cls}, a.${cls}`)

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('outreach board: the summary bar', () => {
  it('counts confirmed, awaiting and not-contacted pharmacies', async () => {
    await open([
      entry({ pharmacy_id: 1, queue_state: 'full', is_confirmed: true }),
      entry({ pharmacy_id: 2, queue_state: 'awaiting_response' }),
      entry({ pharmacy_id: 3, queue_state: 'awaiting_response' }),
      entry({ pharmacy_id: 4, queue_state: 'not_contacted' }),
    ])

    const bar = wrapper.find('.outreach-summary-bar').text().replace(/\s+/g, ' ')
    expect(bar).toContain('1 confirmed')
    expect(bar).toContain('2 awaiting')
    expect(bar).toContain('1 not contacted')
  })
})

describe('outreach board: contacting a pharmacy', () => {
  it('records the contact when the admin taps WhatsApp, and marks the row awaiting', async () => {
    await open([entry()])

    await btn('outreach-btn--wa').trigger('click')
    await flushPromises()

    expect(contacts()).toEqual([
      ['/api/order-requests/admin/5/contact/21', { status: 'contacted', response_status: 'pending', is_confirmed: false, response_note: null }],
    ])
    expect(wrapper.find('.outreach-queue-chip').text()).toContain('Awaiting response')
  })

  it('records the contact when the admin taps Call', async () => {
    await open([entry()])

    await btn('outreach-btn--call').trigger('click')
    await flushPromises()

    expect(contacts().map(([url, body]) => [url, (body as { status: string }).status])).toEqual([
      ['/api/order-requests/admin/5/contact/21', 'contacted'],
    ])
  })

  it('offers no response buttons until the pharmacy has been contacted', async () => {
    await open([entry()])

    expect(wrapper.find('.outreach-btn--decline').exists()).toBe(false)
    expect(wrapper.find('.outreach-btn--partial').exists()).toBe(false)
  })
})

describe('outreach board: a pharmacy that cannot help', () => {
  it('marks it unavailable and says so', async () => {
    await open([entry({ queue_state: 'awaiting_response' })])

    await btn('outreach-btn--decline').trigger('click')
    await flushPromises()

    expect(contacts()).toEqual([
      ['/api/order-requests/admin/5/contact/21', { status: 'declined', response_status: 'declined', is_confirmed: false, response_note: null }],
    ])
    expect(wrapper.find('.outreach-queue-chip').text()).toContain('Unavailable')
  })

  it('shows the reason and leaves the row alone when it fails', async () => {
    await open([entry({ queue_state: 'awaiting_response' })])
    failOn = '/contact/'

    await btn('outreach-btn--decline').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
    expect(wrapper.find('.outreach-queue-chip').text()).toContain('Awaiting response')
  })
})

describe('outreach board: a pharmacy that answers', () => {
  const openModal = async (cls: string) => {
    await btn(cls).trigger('click')
    await flushPromises()
  }
  const submitButton = () => wrapper.findAll('button').find((b) => /submit response/i.test(b.text()))!
  const submit = async () => {
    await submitButton().trigger('click')
    await flushPromises()
  }

  it('confirms the pharmacy and allocates every item it has, at the catalog price', async () => {
    await open([entry({ queue_state: 'awaiting_response', coverage_items: [{ item_id: 9, unit_price: 4.5 }] })])

    await openModal('outreach-btn--confirm')
    await submit()

    expect(contacts().map(([, body]) => (body as { response_status: string }).response_status)).toEqual(['full'])
    const allocations = calls(/\/items\/9\/allocations/, 'POST').map(([, o]) => JSON.parse(o.body))
    expect(allocations).toEqual([
      expect.objectContaining({ pharmacy_id: 21, allocated_quantity: 2, allocation_type: 'exact', unit_price: 4.5 }),
    ])
  })

  it('records a partial answer as partial', async () => {
    await open([entry({ queue_state: 'awaiting_response' })])

    await openModal('outreach-btn--partial')
    await wrapper.find('.response-item-checkbox input[type="checkbox"]').setValue(true)
    await submit()

    expect(contacts().map(([, body]) => (body as { response_status: string }).response_status)).toEqual(['partial'])
  })

  it('will not submit a response with no item available', async () => {
    await open([entry({ queue_state: 'awaiting_response' })])

    await openModal('outreach-btn--partial')

    expect(submitButton().attributes('disabled')).toBeDefined()
    expect(contacts()).toHaveLength(0)
  })

  it('sends the note with the contact record', async () => {
    await open([entry({ queue_state: 'awaiting_response' })])

    await openModal('outreach-btn--confirm')
    await wrapper.find('.response-note-field textarea').setValue('Stock arrives Thursday')
    await submit()

    expect((contacts()[0]![1] as { response_note: string }).response_note).toBe('Stock arrives Thursday')
  })

  it('does not allocate anything when recording the response fails', async () => {
    await open([entry({ queue_state: 'awaiting_response' })])
    failOn = '/contact/'

    await openModal('outreach-btn--confirm')
    await submit()

    expect(calls(/allocations/, 'POST')).toHaveLength(0)
  })
})

describe('outreach board: a pharmacy with no phone number', () => {
  const noPhone = () => entry({ phone: null, queue_state: 'not_contacted' })
  const saveButton = () => wrapper.findAll('button').find((b) => b.text() === 'Save')!

  it('saves the number entered, then shows the contact buttons', async () => {
    await open([noPhone()])

    await btn('outreach-btn--add-phone').trigger('click')
    await wrapper.find('input.outreach-phone-input').setValue('0207654321')
    await saveButton().trigger('click')
    await flushPromises()

    const patch = calls(/pharmacies\/21\/phone/, 'PATCH')
    expect(patch.map(([, o]) => JSON.parse(o.body))).toEqual([{ whatsapp_number: '0207654321' }])
    expect(wrapper.text()).toContain('Phone saved for Healthway Pharmacy')
    expect(wrapper.find('a.outreach-btn--call').attributes('href')).toBe('tel:0207654321')
  })

  it('cannot save an empty number', async () => {
    await open([noPhone()])

    await btn('outreach-btn--add-phone').trigger('click')

    expect(saveButton().attributes('disabled')).toBeDefined()
    expect(calls(/phone/, 'PATCH')).toHaveLength(0)
  })

  it('goes back to the add button when the edit is cancelled', async () => {
    await open([noPhone()])

    await btn('outreach-btn--add-phone').trigger('click')
    await btn('outreach-btn--cancel').trigger('click')

    expect(wrapper.find('input.outreach-phone-input').exists()).toBe(false)
    expect(btn('outreach-btn--add-phone').exists()).toBe(true)
  })

  it('keeps the entry and says why when the save fails', async () => {
    await open([noPhone()])
    failOn = '/phone'

    await btn('outreach-btn--add-phone').trigger('click')
    await wrapper.find('input.outreach-phone-input').setValue('0207654321')
    await saveButton().trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
    expect((wrapper.find('input.outreach-phone-input').element as HTMLInputElement).value).toBe('0207654321')
  })
})
