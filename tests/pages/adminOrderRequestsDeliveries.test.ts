import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Getting a paid request out the door: creating its deliveries, handing one to the pharmacy or to a
// rider, reopening a failed one. Also the status override and the admin notes, which every stage shares.
// HTTP is the boundary.
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

const delivery = (over: Record<string, unknown> = {}) => ({
  id: 31,
  pickup_pharmacy_id: 21,
  pharmacy_name: 'Healthway Pharmacy',
  delivery_status: 'open',
  delivery_fee: 12,
  net_delivery_fee: 10,
  ...over,
})

let status: string
let deliveries: unknown[]
let failOn: string | undefined
const detail = () => ({
  id: 5,
  status,
  admin_notes: 'old note',
  items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2, unit_price: 5 }],
  decisions: [],
})
const open = async (s: string, list: unknown[] = []) => {
  status = s
  deliveries = list
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail() }
    if (url === '/api/order-requests/admin/5/deliveries') return { success: true, data: deliveries }
    if (url === '/api/order-requests/admin/5/initiate-deliveries') return { success: true, data: [delivery()], message: 'Created 1 delivery' }
    if (url === '/api/order-requests/admin/5/process') return { success: true, data: { request: detail(), status, pharmacy_queue: [] } }
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
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('deliveries: creating them', () => {
  it('says there are none yet, and creates them on request', async () => {
    await open('preparing')
    expect(wrapper.text()).toContain('No delivery records yet')

    await button(/initiate deliveries/i).trigger('click')
    await flushPromises()

    expect(calls(/initiate-deliveries/, 'POST')).toHaveLength(1)
    expect(wrapper.text()).toContain('Created 1 delivery')
    expect(wrapper.text()).toContain('Healthway Pharmacy')
  })

  it('says so when creating them fails', async () => {
    await open('preparing')
    failOn = 'initiate-deliveries'

    await button(/initiate deliveries/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })

  it('lists existing deliveries with their fees and no create button', async () => {
    await open('preparing', [delivery({ driver_name: 'Kofi' })])

    const text = wrapper.text()
    expect(text).toContain('Healthway Pharmacy')
    expect(text).toContain('Rider: Kofi')
    expect(text).toContain('GHS 12.00 gross')
    expect(text).toContain('GHS 10.00 net')
    expect(wrapper.findAll('button').some((b) => /initiate deliveries/i.test(b.text()))).toBe(false)
  })
})

describe('deliveries: handing one over', () => {
  it('assigns an open delivery to its pharmacy after the admin confirms', async () => {
    await open('preparing', [delivery()])

    await button(/assign to pharmacy/i).trigger('click')
    expect(calls(/assign-pharmacy/, 'POST')).toHaveLength(0)
    await button(/^confirm$/i).trigger('click')
    await flushPromises()

    expect(calls(/deliveries\/31\/assign-pharmacy/, 'POST').map(body)).toEqual([{ pharmacy_id: 21 }])
    expect(wrapper.text()).toContain('Delivery assigned to pharmacy')
  })

  it('sends nothing when the assignment is cancelled', async () => {
    await open('preparing', [delivery()])

    await button(/assign to pharmacy/i).trigger('click')
    await button(/^cancel$/i).trigger('click')

    expect(calls(/assign-pharmacy/, 'POST')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('The pharmacy will assign one of their own riders')
  })

  it('does not offer pharmacy assignment once the delivery is no longer open', async () => {
    await open('preparing', [delivery({ delivery_status: 'assigned' })])

    expect(wrapper.findAll('button').some((b) => /assign to pharmacy/i.test(b.text()))).toBe(false)
    expect(wrapper.findAll('button').some((b) => /force assign/i.test(b.text()))).toBe(false)
  })

  it('shows the reason when the pharmacy assignment fails', async () => {
    await open('preparing', [delivery()])
    failOn = 'assign-pharmacy'

    await button(/assign to pharmacy/i).trigger('click')
    await button(/^confirm$/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })

  it('force-assigns the rider whose number was entered', async () => {
    await open('preparing', [delivery()])

    await button(/force assign rider/i).trigger('click')
    await wrapper.find('input[placeholder="Enter driver ID"]').setValue('88')
    await button(/^assign$/i).trigger('click')
    await flushPromises()

    expect(calls(/deliveries\/31\/force-assign/, 'POST').map(body)).toEqual([{ driver_id: 88 }])
    expect(wrapper.text()).toContain('Rider force-assigned')
  })

  it('asks for a rider number rather than force-assigning nobody', async () => {
    await open('preparing', [delivery()])

    await button(/force assign rider/i).trigger('click')
    await button(/^assign$/i).trigger('click')
    await flushPromises()

    expect(calls(/force-assign/, 'POST')).toHaveLength(0)
    expect(wrapper.text()).toContain('Please enter a rider ID')
  })
})

describe('deliveries: a failed delivery', () => {
  it('reopens it for a new rider', async () => {
    await open('delivery_failed')

    await button(/^redeliver$/i).trigger('click')
    await flushPromises()

    expect(calls(/\/5\/redeliver/, 'POST')).toHaveLength(1)
    expect(wrapper.text()).toContain('Request refreshed')
  })

  it('says so when it cannot be reopened', async () => {
    await open('delivery_failed')
    failOn = '/redeliver'

    await button(/^redeliver$/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })
})

describe('status override', () => {
  const override = async (value: string) => {
    await button(/override status/i).trigger('click')
    await wrapper.find('select.header-status-override-select').setValue(value)
    await wrapper.find('button.header-status-override-apply').trigger('click')
    await flushPromises()
  }

  it('forces the chosen status, carrying the admin notes', async () => {
    await open('sourcing')

    await override('cancelled')

    expect(calls(/\/5\/status/, 'PUT').map(body)).toEqual([{ status: 'cancelled', admin_notes: 'old note', force: true }])
  })

  it('keeps Apply off while no status is chosen', async () => {
    await open('sourcing')

    await button(/override status/i).trigger('click')
    await wrapper.find('select.header-status-override-select').setValue('')

    expect(wrapper.find('button.header-status-override-apply').attributes('disabled')).toBeDefined()
  })

  it('says so when the server refuses the change', async () => {
    await open('sourcing')
    failOn = '/status'

    await override('cancelled')

    expect(wrapper.text()).toContain('server said no')
  })
})

describe('admin notes', () => {
  const openNotes = () => button(/admin notes/i).trigger('click')

  it('saves the notes as edited', async () => {
    await open('composing')
    await openNotes()

    await wrapper.find('textarea.composer-meta-textarea').setValue('Called the customer')
    await button(/^save$/i).trigger('click')
    await flushPromises()

    expect(calls(/\/5\/notes/, 'PUT').map(body)).toEqual([{ admin_notes: 'Called the customer' }])
    expect(wrapper.text()).toContain('Admin notes saved successfully')
  })

  it('says so when saving fails', async () => {
    await open('composing')
    await openNotes()
    failOn = '/notes'

    await button(/^save$/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to save notes')
  })
})
