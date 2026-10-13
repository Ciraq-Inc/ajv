import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Routing a request's items to a pharmacy that said it has them. The admin is asked first; nothing is
// sent until they agree, and agreeing twice (or double-clicking) must route once. HTTP is the boundary.
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
const pharmacy = () => ({
  pharmacy_id: 21,
  pharmacy_name: 'Healthway Pharmacy',
  phone: '0241234567',
  queue_state: 'full',
  fully_covers_request: true,
  distance_km: 1.5,
  covered: [{ item_id: 9, matched_product_id: 77 }],
})

let routeCall: (() => Promise<unknown>) | undefined
const open = async (queue: unknown[] = [pharmacy()]) => {
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: request() }
    if (url === '/api/order-requests/admin/5/process') return { success: true, data: { request: request(), status: 'sourcing', pharmacy_queue: queue } }
    if (url === '/api/order-requests/admin/5/route-pharmacy') return routeCall ? routeCall() : { success: true, data: {} }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const dialog = () => wrapper.find('[role="alertdialog"]')
const routes = () => http.request.mock.calls.filter(([url]) => url === '/api/order-requests/admin/5/route-pharmacy')
const routeButton = () => wrapper.findAll('button').find((b) => /route here/i.test(b.text()))!
const answer = async () => {
  await dialog().findAll('button').find((b) => /yes, route/i.test(b.text()))!.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  routeCall = undefined
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('order requests: routing items to a pharmacy', () => {
  it('asks first, then sends the covered items with their match and distance', async () => {
    await open()

    await routeButton().trigger('click')
    await flushPromises()

    expect(dialog().text()).toContain('Route 1 item(s) to Healthway Pharmacy?')
    expect(routes()).toHaveLength(0)

    await answer()

    expect(routes().map(([, o]) => [o.method, JSON.parse(o.body)])).toEqual([
      ['POST', { pharmacy_id: 21, items: [{ item_id: 9, matched_product_id: 77, distance_km: 1.5 }] }],
    ])
    expect(wrapper.text()).toContain('Routed 1 item(s) to Healthway Pharmacy')
  })

  it('sends nothing when the admin backs out', async () => {
    await open()

    await routeButton().trigger('click')
    await flushPromises()
    await dialog().findAll('button').find((b) => /cancel/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(dialog().exists()).toBe(false)
    expect(routes()).toHaveLength(0)
  })

  it('does not even ask when the pharmacy covers no items', async () => {
    await open([{ ...pharmacy(), covered: [] }])

    await routeButton().trigger('click')
    await flushPromises()

    expect(dialog().exists()).toBe(false)
    expect(routes()).toHaveLength(0)
  })

  it('says so when routing fails', async () => {
    await open()
    routeCall = async () => { throw new Error('boom') }

    await routeButton().trigger('click')
    await flushPromises()
    await answer()

    expect(wrapper.text()).toContain('Failed to route items')
  })

  it('routes once when the admin confirms twice before the first call returns', async () => {
    await open()
    let release: (v: unknown) => void = () => {}
    routeCall = () => new Promise((resolve) => { release = resolve })

    await routeButton().trigger('click')
    await flushPromises()
    await answer()
    await routeButton().trigger('click')
    await flushPromises()
    if (dialog().exists()) await answer()
    release({ success: true, data: {} })
    await flushPromises()

    expect(routes()).toHaveLength(1)
  })
})

describe('order requests: routing items to a pharmacy, the details', () => {
  it('sends every covered item the pharmacy can supply', async () => {
    await open([{ ...pharmacy(), distance_km: 2.5, covered: [{ item_id: 9, matched_product_id: 77 }, { item_id: 10, matched_product_id: 78 }] }])

    await routeButton().trigger('click')
    await flushPromises()
    expect(dialog().text()).toContain('Route 2 item(s) to Healthway Pharmacy?')
    await answer()

    expect(JSON.parse(routes()[0]![1].body).items).toEqual([
      { item_id: 9, matched_product_id: 77, distance_km: 2.5 },
      { item_id: 10, matched_product_id: 78, distance_km: 2.5 },
    ])
  })

  it('looks at the coverage again after routing', async () => {
    await open()
    const coverage = () => http.request.mock.calls.filter(([url]) => /pharmacy-coverage/.test(url)).length
    const before = coverage()

    await routeButton().trigger('click')
    await flushPromises()
    await answer()

    expect(coverage()).toBe(before + 1)
  })

  it('lets the admin try again after a failure', async () => {
    await open()
    routeCall = async () => { throw new Error('boom') }
    await routeButton().trigger('click')
    await flushPromises()
    await answer()
    expect(wrapper.text()).toContain('Failed to route items')

    routeCall = undefined
    await routeButton().trigger('click')
    await flushPromises()
    await answer()

    expect(routes()).toHaveLength(2)
    expect(wrapper.text()).toContain('Routed 1 item(s) to Healthway Pharmacy')
  })

  it('says the routing worked but the page needs a refresh, when only the refresh fails', async () => {
    await open()
    routeCall = async () => {
      http.request.mockImplementation(async (url: string) => {
        if (url === '/api/order-requests/admin/5') throw new Error('refresh failed')
        return { success: true, data: [] }
      })
      return { success: true, data: {} }
    }

    await routeButton().trigger('click')
    await flushPromises()
    await answer()

    expect(wrapper.text()).toContain('Routed 1 item(s) to Healthway Pharmacy, but the page could not refresh. Press Refresh.')
    expect(wrapper.text()).not.toContain('Failed to route items')
  })
})
