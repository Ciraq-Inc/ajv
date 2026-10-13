import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Identifying a request item: a free-typed search term or a masterlist product. HTTP is the boundary.
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
let detail: Record<string, unknown>
let masterHits: unknown[]

const open = async (over: Record<string, unknown> = {}) => {
  detail = {
    id: 5, status: 'composing', admin_notes: '', decisions: [],
    items: [{ id: 9, product_name: 'Mystery syrup', quantity: 1, requested_quantity: 1, resolution_status: 'unresolved' }],
    ...over,
  }
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail }
    if (/master-products\/search/.test(url)) return { success: true, data: { products: masterHits } }
    if (/pharmacy-coverage/.test(url)) return { success: true, data: { pharmacies: [] } }
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
const termBox = () => wrapper.find('input[placeholder="Type search term..."], input[placeholder="Search master catalog..."]')

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  masterHits = [{ id: 501, product_description: 'Amoxicillin 500mg Capsule', strength: '500mg', unit: 'cap' }]
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => {
  vi.useRealTimers()
  wrapper?.unmount()
})

describe('identifying an item: opening and closing the box', () => {
  it('starts with the item name as the search term', async () => {
    await open()

    await button(/^refine$/i).trigger('click')

    expect((termBox().element as HTMLInputElement).value).toBe('Mystery syrup')
  })

  it('starts with the existing override when there is one', async () => {
    await open({ items: [{ id: 9, product_name: 'Mystery syrup', quantity: 1, resolution_status: 'unresolved', search_term_override: 'cough syrup' }] })

    await button(/^refined$/i).trigger('click')

    expect((termBox().element as HTMLInputElement).value).toBe('cough syrup')
  })

  it('cannot start before the request has been claimed', async () => {
    await open({ status: 'pending' })

    expect(button(/^refine$/i).attributes('disabled')).toBeDefined()
    await button(/^refine$/i).trigger('click')
    expect(termBox().exists()).toBe(false)
  })

  it('cancel closes the box and sends nothing', async () => {
    await open()
    await button(/^refine$/i).trigger('click')

    await button(/^cancel$/i).trigger('click')

    expect(termBox().exists()).toBe(false)
    expect(calls(/admin\/items\/9/, 'PUT')).toHaveLength(0)
  })
})

describe('identifying an item: free-typed search term', () => {
  it('saves the typed term and refreshes the coverage', async () => {
    await open()
    await button(/^refine$/i).trigger('click')
    const before = calls(/pharmacy-coverage/).length

    await termBox().setValue('  cough syrup ')
    await button(/^apply$/i).trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{ search_term_override: 'cough syrup' }])
    expect(calls(/pharmacy-coverage/).length).toBe(before + 1)
    expect(termBox().exists()).toBe(false)
  })

  it('removes an existing term with Clear', async () => {
    await open({ items: [{ id: 9, product_name: 'Mystery syrup', quantity: 1, resolution_status: 'unresolved', search_term_override: 'cough syrup' }] })
    await button(/^refined$/i).trigger('click')

    await button(/^clear$/i).trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{ search_term_override: null }])
  })

  it('says so when it cannot be saved, and keeps the box open', async () => {
    await open()
    await button(/^refine$/i).trigger('click')
    failOn = 'admin/items/9'

    await button(/^apply$/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
    expect(termBox().exists()).toBe(true)
  })
})

describe('identifying an item: masterlist search', () => {
  const masterTab = async () => {
    await button(/^refine$/i).trigger('click')
    await button(/^masterlist$/i).trigger('click')
  }
  const type = async (text: string) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await termBox().setValue(text)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
  }

  it('searches at once for the term already in the box when switching tabs', async () => {
    await open()
    await masterTab()
    await flushPromises()

    expect(calls(/master-products[/]search/).map((c) => c[0])).toEqual(['/api/order-requests/admin/master-products/search?q=Mystery%20syrup&limit=10'])
  })

  it('searches the masterlist once typing pauses', async () => {
    await open()
    await masterTab()
    await flushPromises()
    const before = calls(/master-products[/]search/).length

    await type('amox')

    expect(calls(/master-products[/]search/).slice(before).map((c) => c[0])).toEqual(['/api/order-requests/admin/master-products/search?q=amox&limit=10'])
    expect(wrapper.text()).toContain('Amoxicillin 500mg Capsule')
  })

  it('does not search for a single letter', async () => {
    await open()
    await masterTab()
    await flushPromises()
    const before = calls(/master-products[/]search/).length

    await type('a')

    expect(calls(/master-products[/]search/)).toHaveLength(before)
  })

  it('says when the masterlist has nothing', async () => {
    masterHits = []
    await open()
    await masterTab()

    await type('zzzz')

    expect(wrapper.text()).toContain('No master products found')
  })

  it('links the item to the chosen product and refreshes the coverage', async () => {
    await open()
    await masterTab()
    await type('amox')
    const before = calls(/pharmacy-coverage/).length

    await wrapper.find('.max-h-\\[200px\\] button').trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([
      { master_product_id: 501, product_name: 'Amoxicillin 500mg Capsule', resolution_status: 'resolved' },
    ])
    expect(calls(/pharmacy-coverage/).length).toBe(before + 1)
    expect(button(/^resolved$/i)).toBeDefined()
    expect(wrapper.text()).toContain('1/1 refined')
  })

  it('says so when the item cannot be linked', async () => {
    await open()
    await masterTab()
    await type('amox')
    failOn = 'admin/items/9'

    await wrapper.find('.max-h-\\[200px\\] button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to resolve item')
  })

  it('shows nothing found when the search itself fails', async () => {
    await open()
    await masterTab()
    failOn = 'master-products'

    await type('amox')

    expect(wrapper.text()).toContain('No master products found')
  })
})
