import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Editing the items of a request being composed: changing a quantity and adding an item.
// HTTP is the boundary; the inputs and buttons are the public interface.
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

let detail: Record<string, unknown>
let failOn: string | undefined
const open = async (over: Record<string, unknown> = {}) => {
  detail = {
    id: 5, status: 'composing', admin_notes: '', decisions: [],
    items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2, requested_quantity: 2, unit_price: 5, resolution_status: 'resolved' }],
    ...over,
  }
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail }
    if (url === '/api/order-requests/admin/5/items' && method === 'POST') return { success: true, data: { id: 12 } }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const calls = (re: RegExp, method?: string) =>
  http.request.mock.calls.filter(([url, o]) => re.test(url) && (!method || (o?.method ?? 'GET') === method))
const body = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body)

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('compose: changing a quantity', () => {
  const qty = () => wrapper.find('input.request-item-qty-input')
  const change = async (value: string) => {
    await qty().setValue(value)
    await qty().trigger('change')
    await flushPromises()
  }

  it('saves the new quantity as both quantity and requested quantity', async () => {
    await open()

    await change('4')

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{ quantity: 4, requested_quantity: 4 }])
  })

  it('rounds a fractional quantity down', async () => {
    await open()

    await change('3.7')

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{ quantity: 3, requested_quantity: 3 }])
  })

  it('refuses zero and says so', async () => {
    await open()

    await change('0')

    expect(calls(/admin\/items\/9/, 'PUT')).toHaveLength(0)
    expect(wrapper.text()).toContain('Quantity must be a positive number')
  })

  it('sends nothing when the quantity is unchanged', async () => {
    await open()

    await change('2')

    expect(calls(/admin\/items\/9/, 'PUT')).toHaveLength(0)
  })

  it('says so when the server refuses', async () => {
    await open()
    failOn = 'admin/items/9'

    await change('4')

    expect(wrapper.text()).toContain('server said no')
  })

  it('is read-only once the request has moved past composing', async () => {
    await open({ status: 'sourcing' })

    expect(qty().exists()).toBe(false)
  })
})

describe('compose: adding an item', () => {
  const search = () => wrapper.find('input[placeholder="Search product to add..."]')
  const add = () => wrapper.findAll('button').find((b) => b.text() === 'Add')!

  it('offers Add only once a name has been typed', async () => {
    await open()
    expect(add()).toBeUndefined()

    await search().setValue('Amoxicillin')

    expect(add().attributes('disabled')).toBeUndefined()
  })

  it('adds the typed item to the request and says so', async () => {
    await open()

    await search().setValue('Amoxicillin')
    await add().trigger('click')
    await flushPromises()

    const posted = calls(/admin\/5\/items$/, 'POST').map(body)
    expect(posted).toEqual([
      expect.objectContaining({ product_name: 'Amoxicillin', quantity: 1, requested_quantity: 1, source_type: 'admin' }),
    ])
    expect(wrapper.text()).toContain('Item added to request')
    expect((search().element as HTMLInputElement).value).toBe('')
  })

  it('says so when the item cannot be added', async () => {
    await open()
    failOn = '/items'

    await search().setValue('Amoxicillin')
    await add().trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })
})
