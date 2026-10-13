import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The request list: loading, searching, filtering, sorting, stats and background refresh. HTTP is the boundary.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), request: vi.fn() }))
const route = vi.hoisted(() => ({ query: {} as Record<string, unknown>, path: '/admin/fulfillment/order-requests' }))
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
import OrderRequestsHeader from '~/components/order-requests/OrderRequestsHeader.vue'
import OrderRequestsFilters from '~/components/order-requests/OrderRequestsFilters.vue'
import OrderRequestsTable from '~/components/order-requests/OrderRequestsTable.vue'

for (const [name, fn] of Object.entries(formatters)) vi.stubGlobal(name, fn)

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
let wrapper: ReturnType<typeof mount>
let failOn: string | undefined
let listFails: boolean
let rows: Record<string, unknown>[]
let statsData: Record<string, unknown>

const row = (id: number, status: string, over: Record<string, unknown> = {}) => ({
  id, request_number: `RQ-${id}`, customer_name: `Customer ${id}`, status,
  created_at: '2026-10-01T10:00:00Z', updated_at: `2026-10-0${id}T10:00:00Z`, item_count: 1, ...over,
})
const listCalls = () => http.get.mock.calls.filter(([u]) => /order-requests[/]admin(\?|$)/.test(u))
const statsCalls = () => http.get.mock.calls.filter(([u]) => /admin[/]stats/.test(u))
const numbers = () => wrapper.findAll('tbody .request-number').map((n) => n.text())
const tab = (label: RegExp) => wrapper.findAll('.status-tab-pill').find((b) => label.test(b.text()))!
const searchBox = () => wrapper.find('input[placeholder="Search by ID, name or phone…"]')

const open = async () => {
  http.get.mockImplementation(async (url: string) => {
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (/admin[/]stats/.test(url)) return { success: true, data: statsData }
    if (listFails) throw new Error('server said no')
    return { success: true, data: rows }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs, components: { OrderRequestsHeader, OrderRequestsFilters, OrderRequestsTable } } })
  await flushPromises()
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  listFails = false
  rows = [row(1, 'pending'), row(2, 'composing'), row(3, 'paid'), row(4, 'awaiting_method_selection'), row(5, 'out_for_delivery')]
  statsData = { pending: 3, processing: 4, completed: 5, total: 12 }
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.request.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => {
  vi.useRealTimers()
  wrapper?.unmount()
})

describe('request list: loading', () => {
  it('lists every request, newest update first', async () => {
    await open()

    expect(numbers()).toEqual(['RQ-5', 'RQ-4', 'RQ-3', 'RQ-2', 'RQ-1'])
  })

  it('says so when there are none', async () => {
    rows = []
    await open()

    expect(wrapper.text()).toContain('No requests found')
  })

  it('says so when the list cannot be loaded', async () => {
    listFails = true
    await open()

    expect(wrapper.text()).toContain('Failed to load requests')
  })

  it('shows the stats, reading either field name the server uses', async () => {
    statsData = { pending_count: '2', processing_count: 1, completed_count: 7, total_requests: 10 }
    await open()

    const text = wrapper.text()
    expect(text).toContain('2 Pending')
    expect(text).toContain('1 In Progress')
    expect(text).toContain('7 Fulfilled')
    expect(text).toContain('10 Total')
  })

  it('says so when the stats cannot be loaded, and still lists requests', async () => {
    failOn = 'admin/stats'
    await open()

    expect(wrapper.text()).toContain('Failed to load stats')
    expect(numbers()).toHaveLength(5)
  })
})

describe('request list: searching', () => {
  it('asks the server for the typed text when Search is pressed', async () => {
    await open()
    expect(listCalls()[0]![0]).toBe('/api/order-requests/admin')

    await searchBox().setValue('kofi')
    await wrapper.findAll('button').find((b) => /^search$/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(listCalls().at(-1)![0]).toBe('/api/order-requests/admin?search=kofi')
  })

  it('searches on Enter too', async () => {
    await open()

    await searchBox().setValue('024')
    await searchBox().trigger('keyup.enter')
    await flushPromises()

    expect(listCalls().at(-1)![0]).toBe('/api/order-requests/admin?search=024')
  })

  it('clearing the search lists everything again', async () => {
    await open()
    await searchBox().setValue('kofi')

    await wrapper.find('button[title="Clear search"]').trigger('click')
    await flushPromises()

    expect(listCalls().at(-1)![0]).toBe('/api/order-requests/admin')
    expect((searchBox().element as HTMLInputElement).value).toBe('')
  })

  it('the Stats button reloads the stats', async () => {
    await open()
    const before = statsCalls().length

    await wrapper.findAll('button').find((b) => /stats/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(statsCalls().length).toBe(before + 1)
  })
})

describe('request list: status tabs', () => {
  it('counts each tab, with All counting everything', async () => {
    await open()

    const counts = Object.fromEntries(wrapper.findAll('.status-tab-pill').map((b) => [b.find('span').text(), b.find('.status-tab-count').text()]))
    expect(counts).toMatchObject({ All: '5', 'New Requests': '1', Composing: '1', Paid: '1', 'Payment Pending': '1', 'In Transit': '1', Sourcing: '0' })
  })

  it('shows only the requests of the chosen tab', async () => {
    await open()

    await tab(/composing/i).trigger('click')

    expect(numbers()).toEqual(['RQ-2'])
  })

  it('groups the statuses a tab covers', async () => {
    rows.push(row(6, 'payment_pending'))
    await open()

    await tab(/payment pending/i).trigger('click')

    expect(numbers().sort()).toEqual(['RQ-4', 'RQ-6'])
  })

  it('the dropdown reaches the statuses that have no tab', async () => {
    rows.push(row(6, 'delivered'))
    await open()

    await wrapper.find('select').setValue('delivered')

    expect(numbers()).toEqual(['RQ-6'])
  })

  it('lists the most urgent new request first', async () => {
    rows = [
      row(1, 'pending', { expires_at: '2026-10-01T12:00:00Z' }),
      row(2, 'pending', { expires_at: '2026-10-01T11:00:00Z' }),
      row(3, 'pending'),
    ]
    await open()

    await tab(/new requests/i).trigger('click')

    expect(numbers()).toEqual(['RQ-2', 'RQ-1', 'RQ-3'])
  })

  it('counts new requests closing within twenty minutes', async () => {
    rows = [
      row(1, 'pending', { expires_at: new Date(Date.now() + 5 * 60000).toISOString() }),
      row(2, 'pending', { expires_at: new Date(Date.now() + 60 * 60000).toISOString() }),
      row(3, 'pending', { expires_at: new Date(Date.now() - 60000).toISOString() }),
    ]
    await open()

    expect(tab(/new requests/i).find('[title="Requests closing soon"]').text()).toBe('1')
  })
})

describe('request list: sorting', () => {
  const header = (label: RegExp) => wrapper.findAll('th').find((h) => label.test(h.text()))!

  it('sorts by request number, and reverses on a second click', async () => {
    await open()

    await header(/request #/i).trigger('click')
    expect(numbers()).toEqual(['RQ-5', 'RQ-4', 'RQ-3', 'RQ-2', 'RQ-1'])

    await header(/request #/i).trigger('click')
    expect(numbers()).toEqual(['RQ-1', 'RQ-2', 'RQ-3', 'RQ-4', 'RQ-5'])
  })

  it('sorts by number of items', async () => {
    rows = [row(1, 'paid', { items: [{ id: 1 }] }), row(2, 'paid', { items: [{ id: 1 }, { id: 2 }, { id: 3 }] }), row(3, 'paid', { items: [{ id: 1 }, { id: 2 }] })]
    await open()

    await header(/^items/i).trigger('click')

    expect(numbers()).toEqual(['RQ-2', 'RQ-3', 'RQ-1'])
  })

  it('sorts by cost, putting those without a cost last when descending', async () => {
    rows = [row(1, 'paid', { computed_cost: 50 }), row(2, 'paid'), row(3, 'paid', { computed_cost: 200 })]
    await open()

    await header(/^cost/i).trigger('click')

    expect(numbers()).toEqual(['RQ-3', 'RQ-1', 'RQ-2'])
  })

  it('shows the cost of a request from its sourced items when none was computed', async () => {
    rows = [row(1, 'paid', { updated_at: '2026-10-01T10:00:00Z', items: [{ id: 1, source_pharmacy_id: 3, unit_price: 10, quantity: 2 }] }), row(2, 'paid', { updated_at: '2026-10-02T10:00:00Z' })]
    await open()

    const cells = wrapper.findAll('tbody tr').map((r) => r.findAll('td')[5]!.text())
    expect(cells).toEqual(['—', 'GHS 20.00'])
  })
})

describe('request list: background refresh', () => {
  const poll = async () => {
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()
  }
  const mountWithTimers = async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] })
    await open()
  }

  it('reloads the list and stats every five seconds without a loading flash or error message', async () => {
    await mountWithTimers()
    const before = listCalls().length

    await poll()

    expect(listCalls().length).toBe(before + 1)
    expect(statsCalls().length).toBe(2)
    expect(wrapper.text()).not.toContain('Loading requests...')
  })

  it('picks up new requests', async () => {
    await mountWithTimers()
    rows = [...rows, row(9, 'pending')]

    await poll()

    expect(numbers()).toContain('RQ-9')
  })

  it('stays quiet when a background refresh fails', async () => {
    await mountWithTimers()
    listFails = true
    failOn = 'admin/stats'

    await poll()

    expect(wrapper.text()).not.toContain('Failed to load')
    expect(numbers()).toHaveLength(5)
  })

  it('does not refresh while a request is open', async () => {
    await mountWithTimers()
    http.request.mockImplementation(async () => ({ success: true, data: { id: 5, status: 'composing', items: [], decisions: [] } }))
    await wrapper.find('tbody tr').trigger('click')
    await flushPromises()
    const before = listCalls().length

    await poll()

    expect(listCalls().length).toBe(before)
  })

  it('does not refresh while the browser tab is hidden', async () => {
    await mountWithTimers()
    const before = listCalls().length
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    try {
      await poll()
    } finally {
      delete (document as unknown as Record<string, unknown>)['hidden']
    }

    expect(listCalls().length).toBe(before)
  })

  it('stops refreshing once the page is closed', async () => {
    await mountWithTimers()
    wrapper.unmount()
    const before = listCalls().length

    await poll()

    expect(listCalls().length).toBe(before)
  })
})
