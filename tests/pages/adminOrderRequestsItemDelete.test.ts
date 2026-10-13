import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Removing an item from a request being composed. HTTP is the boundary; the buttons are the interface.
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
let items: unknown[]

const open = async (status = 'composing') => {
  items = [{ id: 9, product_name: 'Panadol Extra', quantity: 2, requested_quantity: 2, unit_price: 5, resolution_status: 'resolved' }]
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: { id: 5, status, admin_notes: '', decisions: [], items } }
    if (url === '/api/order-requests/admin/items/9' && method === 'DELETE') { items = []; return { success: true } }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const calls = (re: RegExp, method?: string) =>
  http.request.mock.calls.filter(([url, o]) => re.test(url) && (!method || (o?.method ?? 'GET') === method))
const button = (label: RegExp) => wrapper.findAll('button').find((b) => label.test(b.text()))!
const trash = () => wrapper.find('button[aria-label="Delete request item"]')

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('compose: deleting an item', () => {
  it('asks first, then deletes and says so', async () => {
    await open()

    await trash().trigger('click')
    expect(calls(/admin\/items\/9/, 'DELETE')).toHaveLength(0)
    await button(/yes, delete/i).trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'DELETE')).toHaveLength(1)
    expect(wrapper.text()).toContain('Request item deleted')
    expect(trash().exists()).toBe(false)
  })

  it('deletes nothing when the admin cancels', async () => {
    await open()

    await trash().trigger('click')
    await button(/^cancel$/i).trigger('click')

    expect(calls(/admin\/items\/9/, 'DELETE')).toHaveLength(0)
  })

  it('says why when the server refuses, and keeps the item', async () => {
    await open()
    failOn = 'admin/items/9'

    await trash().trigger('click')
    await button(/yes, delete/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
    expect(trash().exists()).toBe(true)
  })

  it('is disabled once the request is no longer being composed', async () => {
    await open('pending')

    expect(trash().attributes('disabled')).toBeDefined()
  })
})
