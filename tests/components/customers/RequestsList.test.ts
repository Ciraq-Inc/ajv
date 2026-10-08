import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: HTTP (useApi + service), user store, Nuxt globals ──
const api = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('~/composables/useApi', () => ({
  useApi: () => api,
  ApiError: class ApiError extends Error {
    status?: number
    data?: Record<string, unknown>
  },
}))

const service = vi.hoisted(() => ({ getCustomerSettings: vi.fn() }))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({
  createOrderRequestsService: () => service,
}))

const store = vi.hoisted(() => ({ state: null as any }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store.state }))

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

import OrderRequests from '~/components/customers/orderRequests.vue'

let wrapper: ReturnType<typeof mount> | undefined
type W = ReturnType<typeof mount>

const REQUESTS = [
  { id: 1, request_number: 'R-101', status: 'quote_available', first_item_name: 'Amoxicillin', item_count: 1, total_cost: 42.5, created_at: '2020-01-01T10:00:00Z' },
  { id: 2, request_number: 'R-102', status: 'pending', first_item_name: 'Paracetamol', item_count: 1, created_at: '2020-01-02T10:00:00Z' },
  { id: 3, request_number: 'R-103', status: 'out_for_delivery', first_item_name: 'Ibuprofen', item_count: 1, total_cost: 18, created_at: '2020-01-03T10:00:00Z' },
  { id: 4, request_number: 'R-104', status: 'delivered', first_item_name: 'Vitamin C', item_count: 1, total_cost: 9, created_at: '2020-01-04T10:00:00Z' },
]

const open = async (list: 'ok' | 'fail' | 'empty' | 'pending' | 'one' = 'ok') => {
  store.state.getProfile.mockResolvedValue({})
  service.getCustomerSettings.mockResolvedValue({ data: {} })
  api.request.mockImplementation(async (url: string) => {
    if (url === '/api/order-requests/customer') {
      if (list === 'fail') throw new Error('Network down')
      if (list === 'pending') return new Promise(() => {})
      return { data: list === 'empty' ? [] : list === 'one' ? [REQUESTS[3]] : REQUESTS }
    }
    if (url.startsWith('/api/order-requests/customer/')) return { data: { id: 1, request_number: 'R-101', status: 'quote_available', items: [] } }
    return { data: {} }
  })
  wrapper = mount(OrderRequests, { props: { defaultSubTab: 'list' }, attachTo: document.body })
  await flushPromises()
  return wrapper
}
const byName = (w: W, name: string) => {
  const b = w.findAll('button').find(x => (x.attributes('aria-label') ?? x.text()).includes(name))
  if (!b) throw new Error(`no button "${name}"`)
  return b
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  store.state = {
    currentUser: { phone: '0244123456', email: '' },
    masterCustomer: { id: 1 },
    customerAuthToken: 'tok',
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    clearAuthState: vi.fn(),
  }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('Requests list: page', () => {
  it('is headed "My requests" and leaves navigation to the bottom and side bars', async () => {
    const w = await open()

    expect(w.find('h1').text()).toBe('My requests')
    expect(w.findAll('button').some(x => x.attributes('aria-label') === 'Back')).toBe(false)
  })

  it('announces loading politely while requests arrive', async () => {
    const w = await open('pending')
    const status = w.find('[role="status"][aria-busy="true"]')

    expect(status.exists()).toBe(true)
    expect(status.text()).toContain('Loading your requests')
  })

  it('invites a first request when there are none', async () => {
    const w = await open('empty')

    expect(w.text()).toContain('No requests yet')
    await byName(w, 'New request').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'new' } })
  })

  it('says so when requests could not be loaded, instead of claiming there are none', async () => {
    const w = await open('fail')
    const alert = w.find('[role="alert"]')

    expect(alert.text()).toContain('We could not load your requests')
    expect(w.text()).not.toContain('No requests yet')
  })

  it('tries again from the load error', async () => {
    const w = await open('fail')
    api.request.mockImplementation(async (url: string) =>
      url === '/api/order-requests/customer' ? { data: REQUESTS } : { data: {} })

    await byName(w, 'Try again').trigger('click')
    await flushPromises()

    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.text()).toContain('Pay now')
  })
})

describe('Requests list: sections', () => {
  it('shows each stage as a toggle that says whether it is open, with a count', async () => {
    const w = await open()
    const pay = byName(w, 'Pay now')

    expect(pay.attributes('aria-expanded')).toBe('true')
    expect(pay.text()).toContain('1')
    const done = byName(w, 'Done')
    expect(done.attributes('aria-expanded')).toBe('false')

    await done.trigger('click')
    expect(done.attributes('aria-expanded')).toBe('true')
    expect(w.text()).toContain('Vitamin C')
  })

  it('names the open stage region after its toggle', async () => {
    const w = await open()
    const pay = byName(w, 'Pay now')
    const region = w.find(`#${pay.attributes('aria-controls')}`)

    expect(region.exists()).toBe(true)
    expect(region.text()).toContain('Amoxicillin')
  })

  it('says plainly when an open stage is empty', async () => {
    const w = await open('one')

    expect(w.find('[role="region"]').text()).toContain('Nothing is being sourced right now.')
  })
})

describe('Requests list: rows', () => {
  it('makes each request a real button, named by what it is and what it costs', async () => {
    const w = await open()
    const row = byName(w, 'Amoxicillin')

    expect(row.element.tagName).toBe('BUTTON')
    expect(row.text()).toContain('R-101')
    expect(row.text()).toContain('GHS 42.50')
  })

  it('opens the request when its row is chosen', async () => {
    const w = await open()

    await byName(w, 'Amoxicillin').trigger('click')
    await flushPromises()

    expect(api.request).toHaveBeenCalledWith('/api/order-requests/customer/1', expect.anything())
  })

  it('says "Waiting for a price" rather than a vague label when a request has no price yet', async () => {
    const w = await open()
    await byName(w, 'Processing').trigger('click')

    expect(w.text()).toContain('Waiting for a price')
  })

  it('has a clear Pay button on requests waiting for payment', async () => {
    const w = await open()
    const pay = byName(w, 'Pay GHS 42.50')

    expect(pay.classes()).toContain('bg-brand-700')
  })
})

describe('Requests list: look', () => {
  it('uses brand tokens, not hard-coded hex or zinc greys', async () => {
    const w = await open()
    const html = w.find('h1').element.closest('div[class*="pb-12"], div')!.parentElement!.innerHTML

    expect(html).not.toMatch(/\[#[0-9a-fA-F]{3,6}\]/)
    expect(html).not.toContain('zinc-')
  })
})
