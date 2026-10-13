import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The pharmacy coverage matrix while composing. HTTP is the boundary.
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
let coverage: unknown

const pharmacies = () => [
  {
    pharmacy_id: 1, company_id: 11, pharmacy_name: 'Alpha Pharmacy', location: 'Osu', distance_km: 1.234,
    coverage_score: 1, total_items: 2,
    covered: [{
      item_id: 9, product_name: 'Panadol Extra',
      top_matches: [
        { matched_product_id: 101, matched_product_name: 'Panadol Extra 500mg', price: 12, stock: 9 },
        { matched_product_id: 102, matched_product_name: 'Panadol Advance', price: 14, stock: 2 },
        { matched_product_id: 103, matched_product_name: 'Panadol Blue', price: 15, stock: 2 },
        { matched_product_id: 104, matched_product_name: 'Panadol Cold', price: 16, stock: 2 },
      ],
    }],
    uncovered: [{ item_id: 10, product_name: 'Amoxicillin 500mg Capsules' }],
  },
  { pharmacy_id: 2, company_id: 22, pharmacy_name: 'Beta Chemist', location: 'Madina', distance_km: 4, coverage_score: 0, total_items: 2, covered: [], uncovered: [] },
]
const searchHits = [{ id: 77, product_description: 'Amoxil Caps', price: 20, available_quantity: 5, distance_km: null }]
let searchResult: unknown[] = searchHits

const open = async (over: Record<string, unknown> = {}) => {
  detail = {
    id: 5, status: 'composing', admin_notes: '', decisions: [],
    items: [
      { id: 9, product_name: 'Panadol Extra', quantity: 2, requested_quantity: 2, unit_price: 5, resolution_status: 'resolved' },
      { id: 10, product_name: 'Amoxicillin 500mg Capsules', quantity: 1, requested_quantity: 1, resolution_status: 'resolved' },
    ],
    ...over,
  }
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail }
    if (/pharmacy-coverage/.test(url)) return coverage
    if (/pharmacy-products\/search/.test(url)) return { success: true, data: { products: searchResult } }
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
const names = () => wrapper.findAll('.coverage-pharmacy-card strong').map((n) => n.text())

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  searchResult = searchHits
  coverage = { success: true, data: { pharmacies: pharmacies() } }
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('coverage matrix: listing', () => {
  it('lists the nearby pharmacies with distance and count', async () => {
    await open()

    expect(names()).toEqual(['Alpha Pharmacy', 'Beta Chemist'])
    expect(wrapper.text()).toContain('2 nearby')
    expect(wrapper.text()).toContain('~1.2 km')
    expect(wrapper.text()).toContain('1/2')
  })

  it('asks for availability order first, and distance order when switched', async () => {
    await open()
    expect(calls(/pharmacy-coverage/).map((c) => c[0])).toEqual(['/api/order-requests/admin/5/pharmacy-coverage?sort=availability'])

    await button(/^distance$/i).trigger('click')
    await flushPromises()

    expect(calls(/pharmacy-coverage/).at(-1)![0]).toContain('sort=distance')
  })

  it('refreshes on demand', async () => {
    await open()
    const before = calls(/pharmacy-coverage/).length

    await button(/^refresh$/i).trigger('click')
    await flushPromises()

    expect(calls(/pharmacy-coverage/).length).toBe(before + 1)
  })

  it('filters by name or location, and says when nothing matches', async () => {
    await open()
    const search = wrapper.find('input[placeholder="Search pharmacies by name or location..."]')

    await search.setValue('madina')
    expect(names()).toEqual(['Beta Chemist'])

    await search.setValue('zzz')
    expect(wrapper.text()).toContain('No pharmacies match "zzz".')
  })

  it('says so when no pharmacy has the products', async () => {
    coverage = { success: true, data: { pharmacies: [] } }
    await open()

    expect(wrapper.text()).toContain('No nearby pharmacies have matching products.')
  })

  it('shows no list when the coverage cannot be loaded', async () => {
    await open()
    failOn = 'pharmacy-coverage'

    await button(/^refresh$/i).trigger('click')
    await flushPromises()

    expect(wrapper.find('.coverage-pharmacy-list').exists()).toBe(false)
  })

  it('asks to identify every item first, counting how many are done', async () => {
    await open({ items: [
      { id: 9, product_name: 'Panadol Extra', quantity: 2, resolution_status: 'resolved' },
      { id: 10, product_name: 'Mystery', quantity: 1, resolution_status: 'unresolved' },
    ] })

    expect(wrapper.text()).toContain('Identify all items before starting sourcing.')
    expect(wrapper.find('.coverage-resolve-prompt').text()).toContain('1/2')
  })
})

describe('coverage matrix: picking a match', () => {
  const selects = () => wrapper.findAll('.coverage-item-match-row button')

  it('shows three matches, and the rest on request', async () => {
    await open()
    expect(wrapper.findAll('.coverage-item-match-row')).toHaveLength(3)

    await button(/\+1 more/).trigger('click')
    expect(wrapper.findAll('.coverage-item-match-row')).toHaveLength(4)

    await button(/show less/i).trigger('click')
    expect(wrapper.findAll('.coverage-item-match-row')).toHaveLength(3)
  })

  it('saves the chosen product against the item and refreshes the coverage', async () => {
    await open()
    const before = calls(/pharmacy-coverage/).length

    await selects()[1]!.trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{
      source_pharmacy_id: 1, source_product_id: 102, product_name: 'Panadol Advance',
      resolution_status: 'resolved', unit_price: 14, source_distance_km: 1.234,
    }])
    expect(calls(/pharmacy-coverage/).length).toBe(before + 1)
  })

  it('marks the chosen product and will not choose it twice', async () => {
    await open({ items: [
      { id: 9, product_name: 'Panadol Extra', quantity: 2, resolution_status: 'resolved', source_pharmacy_id: 1, source_product_id: 101 },
      { id: 10, product_name: 'Amoxicillin 500mg Capsules', quantity: 1, resolution_status: 'resolved' },
    ] })

    expect(selects()[0]!.text()).toContain('Selected')
    expect(selects()[0]!.attributes('disabled')).toBeDefined()
    expect(selects()[1]!.text()).toBe('Select')
  })

  it('offers no choosing until the request has been started', async () => {
    await open({ status: 'pending' })

    expect(selects()).toHaveLength(0)
    expect(calls(/admin\/items\/9/, 'PUT')).toHaveLength(0)
  })

  it('says so when the choice cannot be saved', async () => {
    await open()
    failOn = 'admin/items/9'

    await selects()[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })
})

describe('coverage matrix: refining the search for an item', () => {
  const refine = async () => {
    await button(/refine search/i).trigger('click')
    return wrapper.find('.coverage-sub-search-panel input')
  }

  it('saves the search term the admin types', async () => {
    await open()

    const input = await refine()
    await input.setValue('paracetamol')
    await button(/^apply$/i).trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{ search_term_override: 'paracetamol' }])
    expect(wrapper.find('.coverage-sub-search-panel').exists()).toBe(false)
  })

  it('clears the override with an empty term', async () => {
    const withOverride = pharmacies()
    withOverride[0]!.covered[0]!.search_term_override = 'old'
    coverage = { success: true, data: { pharmacies: withOverride } }
    await open()

    await refine()
    await button(/clear override/i).trigger('click')
    await flushPromises()

    expect(calls(/admin\/items\/9/, 'PUT').map(body)).toEqual([{ search_term_override: null }])
  })

  it('cancel closes the box without saving', async () => {
    await open()

    await refine()
    await button(/^cancel$/i).trigger('click')

    expect(wrapper.find('.coverage-sub-search-panel').exists()).toBe(false)
    expect(calls(/admin\/items\/9/, 'PUT')).toHaveLength(0)
  })

  it('says so when it cannot be saved', async () => {
    await open()
    failOn = 'admin/items/9'

    await refine()
    await button(/^apply$/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })
})

describe('coverage matrix: finding a substitute for an uncovered item', () => {
  const find = async () => {
    await button(/find substitute/i).trigger('click')
    await flushPromises()
  }

  it('searches that pharmacy with the name stripped of strengths', async () => {
    await open()

    await find()

    const [url] = calls(/pharmacy-products\/search/)[0]!
    const params = new URL('http://x' + url).searchParams
    expect(params.get('q')).toBe('Amoxicillin Capsules')
    expect(params.get('company_id')).toBe('11')
    expect(wrapper.text()).toContain('Amoxil Caps')
  })

  it('moves the item to covered, and records the choice with the server', async () => {
    await open()
    await find()

    await wrapper.find('.coverage-sub-search-result').trigger('click')
    await flushPromises()

    expect(calls(/route-pharmacy/, 'POST').map(body)).toEqual([
      { pharmacy_id: 1, items: [{ item_id: 10, matched_product_id: 77, distance_km: 1.234 }] },
    ])
    expect(wrapper.find('.coverage-sub-search-panel').exists()).toBe(false)
    expect(wrapper.text()).toContain('2/2')
  })

  it('keeps the local change but warns when the server will not save it', async () => {
    await open()
    await find()
    failOn = 'route-pharmacy'

    await wrapper.find('.coverage-sub-search-result').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Substitute selected locally but failed to save to server')
  })

  it('searches again after typing, once typing pauses', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      await open()
      await find()
      const before = calls(/pharmacy-products\/search/).length

      await wrapper.find('.coverage-sub-search-panel input').setValue('amox')
      expect(calls(/pharmacy-products\/search/)).toHaveLength(before)
      await vi.advanceTimersByTimeAsync(300)
      await flushPromises()

      expect(calls(/pharmacy-products\/search/)).toHaveLength(before + 1)
      expect(new URL('http://x' + calls(/pharmacy-products\/search/).at(-1)![0]).searchParams.get('q')).toBe('amox')
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancel closes the search', async () => {
    await open()
    await find()

    await button(/^cancel$/i).trigger('click')

    expect(wrapper.find('.coverage-sub-search-panel').exists()).toBe(false)
  })

  it('says nothing was found when the catalog has no match', async () => {
    searchResult = []
    await open()

    await find()

    expect(wrapper.text()).toContain("No products found in this pharmacy's catalog.")
  })
})

describe('coverage matrix: how the search is worded and aimed', () => {
  const searchFor = async (productName: string, over: Record<string, unknown> = {}) => {
    const list = pharmacies()
    list[0]!.uncovered = [{ item_id: 10, product_name: productName }]
    coverage = { success: true, data: { pharmacies: list } }
    await open(over)
    await button(/find substitute/i).trigger('click')
    await flushPromises()
    return new URL('http://x' + calls(/pharmacy-products\/search/)[0]![0]).searchParams
  }

  it.each([
    ['Amoxicillin 500mg Capsules', 'Amoxicillin Capsules'],
    ['Cough Syrup (Adult) 100ml', 'Cough Syrup'],
    ['Vitamin C 1000 mg tablets extra strong', 'Vitamin tablets extra'],
    ['Ibuprofen-400', 'Ibuprofen'],
    ['Co Q', 'Co Q'],
  ])('searches "%s" as "%s"', async (name, expected) => {
    const params = await searchFor(name)

    expect(params.get('q')).toBe(expected)
  })

  it('searches with the whole name when nothing is left after simplifying', async () => {
    const params = await searchFor('500mg')

    expect(params.get('q')).toBe('500mg')
  })

  it('sends the customer location so nearer stock ranks first', async () => {
    const params = await searchFor('Amoxil', { customer_latitude: 5.6, customer_longitude: -0.19 })

    expect(params.get('lat')).toBe('5.6')
    expect(params.get('lng')).toBe('-0.19')
  })

  it('accepts the other names the server uses for the location', async () => {
    const params = await searchFor('Amoxil', { delivery_lat: 5.5, delivery_lng: -0.2 })

    expect(params.get('lat')).toBe('5.5')
    expect(params.get('lng')).toBe('-0.2')
  })

  it('sends no location when the request has none, or it is zero', async () => {
    const none = await searchFor('Amoxil')
    expect(none.has('lat')).toBe(false)
    expect(none.has('lng')).toBe(false)

    wrapper.unmount()
    http.request.mockClear()
    const zero = await searchFor('Amoxil', { customer_latitude: 0, customer_longitude: 0 })
    expect(zero.has('lat')).toBe(false)
  })
})

describe('coverage matrix: coverage bar', () => {
  const bar = (i: number) => wrapper.findAll('.coverage-pharmacy-card')[i]!.find('.coverage-bar-fill')
  const withScores = (scores: Array<[number, number]>) => {
    const list = pharmacies()
    list[0]!.coverage_score = scores[0]![0]; list[0]!.total_items = scores[0]![1]
    list[1]!.coverage_score = scores[1]![0]; list[1]!.total_items = scores[1]![1]
    coverage = { success: true, data: { pharmacies: list } }
  }
  const style = (i: number) => (bar(i).element as HTMLElement).style

  it('is green when full, amber from half, red below half, and grey and empty with no items', async () => {
    withScores([[4, 4], [2, 4]])
    await open()
    expect(style(0).width).toBe('100%')
    expect(style(0).background).toMatch(/16, 185, 129|#10b981/i)
    expect(style(1).width).toBe('50%')
    expect(style(1).background).toMatch(/245, 158, 11|#f59e0b/i)
    wrapper.unmount()

    withScores([[1, 4], [0, 0]])
    await open()
    expect(style(0).width).toBe('25%')
    expect(style(0).background).toMatch(/239, 68, 68|#ef4444/i)
    expect(style(1).width).toBe('0%')
    expect(style(1).background).toMatch(/156, 163, 175|#9ca3af/i)
  })
})
