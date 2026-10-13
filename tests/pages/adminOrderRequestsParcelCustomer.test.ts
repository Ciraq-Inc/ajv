import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The parcel measurements captured while composing, and the create-customer modal on the list. HTTP is the boundary.
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
let failOn: string | undefined
let failMessage = 'server said no'
let detail: Record<string, unknown>

const open = async (opts: { request?: boolean; over?: Record<string, unknown> } = {}) => {
  route.query = opts.request === false ? {} : { requestId: '5' }
  detail = { id: 5, status: 'composing', admin_notes: '', decisions: [], items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2, requested_quantity: 2, unit_price: 5, resolution_status: 'resolved' }], ...opts.over }
  http.request.mockImplementation(async (url: string, opts2: { method?: string }) => {
    const method = opts2?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error(failMessage)
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const calls = (re: RegExp, method?: string) =>
  http.request.mock.calls.filter(([url, o]) => re.test(url) && (!method || (o?.method ?? 'GET') === method))
const body = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body)
const button = (label: RegExp) => wrapper.findAll('button').find((b) => label.test(b.text()))!

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  failMessage = 'server said no'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('parcel for delivery quotes', () => {
  const field = (placeholder: string) => wrapper.find(`input.parcel-input[placeholder="${placeholder}"]`)

  it('saves only the measurements entered, with the two flags', async () => {
    await open()

    await field('0.5').setValue('1.5')
    await field('Items total').setValue('80')
    await wrapper.find('.parcel-check input[type="checkbox"]').setValue(true)
    await button(/save parcel/i).trigger('click')
    await flushPromises()

    expect(calls(/\/5\/parcel/, 'PUT').map(body)).toEqual([
      { parcel_weight_kg: 1.5, parcel_value_ghs: 80, parcel_fragile: true, parcel_cold_chain: false },
    ])
    expect(wrapper.text()).toContain('Parcel saved')
  })

  it('shows what was saved before', async () => {
    await open({ over: { parcel_weight_kg: 2, parcel_value_ghs: 40 } })

    expect((field('0.5').element as HTMLInputElement).value).toBe('2')
    expect((field('Items total').element as HTMLInputElement).value).toBe('40')
  })

  it('shows the reason when the server refuses', async () => {
    await open()
    failOn = '/parcel'

    await button(/save parcel/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })
})

describe('create customer and first request', () => {
  const open2 = async () => {
    await open({ request: false })
    await wrapper.find('button.btn-create-customer').trigger('click')
  }
  const input = (placeholder: string) => wrapper.find(`.modal-body input[placeholder="${placeholder}"]`)
  const create = () => button(/^create request$/i)

  it('needs a phone number', async () => {
    await open2()

    await input('Product name').setValue('Panadol')
    await create().trigger('click')

    expect(wrapper.text()).toContain('Phone is required')
    expect(calls(/create-customer-request/, 'POST')).toHaveLength(0)
  })

  it('needs at least one named item', async () => {
    await open2()

    await input('e.g. 0241234567').setValue('0241234567')
    await create().trigger('click')

    expect(wrapper.text()).toContain('Add at least one item')
    expect(calls(/create-customer-request/, 'POST')).toHaveLength(0)
  })

  it('creates the request with trimmed details and says an SMS was sent', async () => {
    await open2()

    await input('e.g. 0241234567').setValue(' 0241234567 ')
    await input('Product name').setValue(' Panadol ')
    await wrapper.find('input.cc-item-qty').setValue('3')
    await create().trigger('click')
    await flushPromises()

    expect(calls(/create-customer-request/, 'POST').map(body)).toEqual([
      { phone: '0241234567', items: [{ product_name: 'Panadol', quantity: 3 }] },
    ])
    expect(wrapper.text()).toContain('An SMS has been sent to the customer')
    expect(wrapper.find('.modal-body').exists()).toBe(false)
  })

  it('keeps the form open and shows the reason when it fails', async () => {
    await open2()
    failOn = 'create-customer-request'
    failMessage = 'Phone already blocked'

    await input('e.g. 0241234567').setValue('0241234567')
    await input('Product name').setValue('Panadol')
    await create().trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Phone already blocked')
    expect(wrapper.find('.modal-body').exists()).toBe(true)
  })
})
