import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Bugs found in the review pass over the order-requests page, each pinned by the behaviour the admin sees.
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
let failDetailAfterOpen = false
const open = async (status = 'composing') => {
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (failDetailAfterOpen && url === '/api/order-requests/admin/5' && method === 'GET') throw new Error('refresh dropped')
    if (url === '/api/order-requests/admin/5' && method === 'GET') {
      return { success: true, data: { id: 5, status, admin_notes: '', decisions: [],
        items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2, requested_quantity: 2, unit_price: 5, resolution_status: 'resolved' }] } }
    }
    if (url === '/api/order-requests/admin/5/items' && method === 'POST') return { success: true, data: { id: 12 } }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const button = (label: RegExp) => wrapper.findAll('button').find((b) => label.test(b.text()))!

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  failDetailAfterOpen = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => {
  vi.useRealTimers()
  wrapper?.unmount()
})

describe('messages', () => {
  it('keeps a newer message on screen for its full time when an older one expires', async () => {
    await open()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    await button(/admin notes/i).trigger('click')
    await button(/^save$/i).trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Admin notes saved successfully')

    vi.advanceTimersByTime(3000)
    failOn = 'notes'
    await button(/^save$/i).trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Failed to save notes')

    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(wrapper.text()).toContain('Failed to save notes')
  })
})

describe('compose: adding an item', () => {
  const search = () => wrapper.find('input[placeholder="Search product to add..."]')

  it('says the item was added when only the refresh afterwards fails', async () => {
    await open()
    failDetailAfterOpen = true

    await search().setValue('Amoxicillin')
    await button(/^add$/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Failed to add item')
    expect(wrapper.text()).toContain('Item added')
  })
})

describe('compose: changing a quantity', () => {
  const qty = () => wrapper.find('input.request-item-qty-input')
  const change = async (value: string) => {
    await qty().setValue(value)
    await qty().trigger('change')
    await flushPromises()
  }

  it('puts the saved quantity back in the box when the server refuses', async () => {
    await open()
    failOn = 'admin/items/9'

    await change('4')

    expect((qty().element as HTMLInputElement).value).toBe('2')
  })

  it('puts the saved quantity back in the box when the value is refused', async () => {
    await open()

    await change('0')

    expect((qty().element as HTMLInputElement).value).toBe('2')
  })
})
