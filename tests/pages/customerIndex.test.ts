import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: router, Nuxt globals, user store, HTTP services, heavy child tabs ──
const route = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return reactive({ query: {} as Record<string, unknown> })
})
vi.mock('vue-router', () => ({ useRoute: () => route }))

const store = vi.hoisted(() => ({
  state: null as any,
}))
vi.mock('~/stores/user', () => ({ useUserStore: () => store.state }))

const wallet = vi.hoisted(() => ({ getBalance: vi.fn() }))
const requestsApi = vi.hoisted(() => ({ listForCustomer: vi.fn() }))
vi.mock('~/services/customerWallet/customerWalletService', () => ({ createCustomerWalletService: () => wallet }))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({ createOrderRequestsService: () => requestsApi }))

// Each tab body has its own tests; here they are probes that show what the page hands them.
const { probe } = vi.hoisted(() => ({ probe: (name: string) => ({
  props: ['defaultSubTab', 'initialRequestId'],
  template: `<div data-probe="${name}" :data-sub-tab="defaultSubTab" :data-request-id="initialRequestId"></div>`,
}) }))
vi.mock('~/components/customers/orderRequests.vue', () => ({ default: probe('requests') }))
vi.mock('~/components/customers/wallet.vue', () => ({ default: probe('wallet') }))
vi.mock('~/components/customers/orders.vue', () => ({ default: probe('orders') }))
vi.mock('~/components/customers/profile.vue', () => ({ default: probe('profile') }))
vi.mock('~/components/customers/linkedCompanies.vue', () => ({ default: probe('companies') }))
vi.mock('~/components/customers/professionalStock.vue', () => ({ default: probe('stock') }))
vi.mock('~/components/customers/clearanceDeals.vue', () => ({ default: probe('clearance') }))

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => ({}))
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))

import CustomerIndex from '~/pages/customer/index.vue'

let wrapper: ReturnType<typeof mount> | undefined
type W = ReturnType<typeof mount>

const open = async (query: Record<string, unknown> = {}) => {
  route.query = query
  wrapper = mount(CustomerIndex, { attachTo: document.body, global: { config: { globalProperties: { navigateTo } } } })
  await flushPromises()
  return wrapper
}
const button = (w: W, text: string) => {
  const b = w.findAll('button').find(x => x.text().includes(text))
  if (!b) throw new Error(`no button containing "${text}"`)
  return b
}
const probeNames = (w: W) => w.findAll('[data-probe]').map(p => p.attributes('data-probe'))

const REQUESTS = [
  { id: 1, status: 'processing', first_item_name: 'Paracetamol', item_count: 3, total_cost: 40, created_at: '2020-01-05T10:00:00Z', request_number: 'R-100' },
  { id: 2, status: 'paid', items: [{ brand_name: 'Amoxil' }], fulfillment_type: 'delivery', items_total: 20, delivery_fee: 5 },
  { id: 3, status: 'delivered' },
  { id: 4, status: 'cancelled' },
  { id: 5, status: 'pending' },
]
const ORDERS = [
  { order_id: '#ABCDEFGH12', status: 'delivered', total_amount: '15', items: [{ brand_name: 'Old Item' }] },
  { order_id: 'ORD-0001-XYZ', status: 'processing', total_amount: 30, company_name: 'Rigel Pharmacy' },
  { order_id: 'ORD-0002', status: 'shipped', total_amount: 12.5, item_count: 1 },
  { order_id: 'ORD-0003', status: 'pending', total_amount: 9, items: [{ product_name: 'Third' }] },
]
const COMPANIES = [
  { id: 1, company_name: 'Rigel Pharmacy', domain_name: 'rigel', address: 'East Legon, Accra' },
  { id: 2, name: 'Kumasi Care' },
  { id: 3, company_name: 'Third', domain_name: '' },
  { id: 4, company_name: 'Fourth' },
]

beforeEach(() => {
  vi.clearAllMocks()
  route.query = {}
  store.state = reactive({
    authInitialized: true,
    customerAuthToken: 'jwt',
    masterCustomer: {},
    companies: COMPANIES.map(c => ({ ...c })),
    redeemSessionHandoff: vi.fn().mockResolvedValue(undefined),
    checkAuthState: vi.fn().mockResolvedValue(undefined),
    getAllOrders: vi.fn().mockResolvedValue(ORDERS.map(o => ({ ...o }))),
    getMyCompanies: vi.fn().mockResolvedValue(undefined),
  })
  wallet.getBalance.mockResolvedValue({ data: { balance: '12.5' } })
  requestsApi.listForCustomer.mockResolvedValue({ data: REQUESTS.map(r => ({ ...r })) })
  navigateTo.mockResolvedValue(undefined)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ───────────────────────────────────────────────────────────────────────────
describe('customer page: getting in', () => {
  it('shows a loading skeleton, not the tabs, while the session is being checked', async () => {
    let finish!: () => void
    store.state.authInitialized = false
    store.state.checkAuthState.mockReturnValue(new Promise<void>((res) => { finish = res }))
    const w = await open()

    expect(w.find('[aria-label="Loading your dashboard"]').exists()).toBe(true)
    expect(probeNames(w)).toEqual([])

    finish()
    await flushPromises()
    expect(w.find('[aria-label="Loading your dashboard"]').exists()).toBe(false)
    expect(probeNames(w)).toEqual(['requests'])
  })

  it('checks the stored session only when the app has not already', async () => {
    await open()
    expect(store.state.checkAuthState).not.toHaveBeenCalled()

    wrapper!.unmount()
    store.state.authInitialized = false
    await open()
    expect(store.state.checkAuthState).toHaveBeenCalledTimes(1)
  })

  it('sends a signed-out visitor to the home page and loads nothing', async () => {
    store.state.customerAuthToken = null
    const w = await open()

    expect(navigateTo).toHaveBeenCalledWith({ path: '/', query: {} })
    expect(wallet.getBalance).not.toHaveBeenCalled()
    expect(requestsApi.listForCustomer).not.toHaveBeenCalled()
    expect(w.find('[aria-label="Loading your dashboard"]').exists()).toBe(false)
  })

  it('keeps the request id in the redirect so it survives signing in', async () => {
    store.state.customerAuthToken = null
    await open({ requestId: '88' })

    expect(navigateTo).toHaveBeenCalledWith({ path: '/', query: { requestId: '88' } })
  })

  it('redeems a session handoff token, then strips it from the URL', async () => {
    await open({ handoff: 'one-time-token', tab: 'wallet' })

    expect(store.state.redeemSessionHandoff).toHaveBeenCalledWith('one-time-token')
    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: {} }, { replace: true })
  })

  it('keeps the request id when stripping the handoff token', async () => {
    await open({ handoff: 'one-time-token', requestId: '88' })

    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { requestId: '88' } }, { replace: true })
  })

  it('strips a spent or invalid handoff token and falls back to the normal sign-in check', async () => {
    store.state.redeemSessionHandoff.mockRejectedValue(new Error('expired'))
    store.state.customerAuthToken = null
    await open({ handoff: 'stale' })

    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: {} }, { replace: true })
    expect(navigateTo).toHaveBeenCalledWith({ path: '/', query: {} })
  })

  it('ignores an empty or repeated handoff parameter', async () => {
    await open({ handoff: '' })
    wrapper!.unmount()
    await open({ handoff: ['a', 'b'] })

    expect(store.state.redeemSessionHandoff).not.toHaveBeenCalled()
  })

  it('logs and drops the skeleton when the session check itself blows up', async () => {
    store.state.authInitialized = false
    store.state.checkAuthState.mockRejectedValue(new Error('boom'))
    const w = await open()

    expect(console.error).toHaveBeenCalledWith('Dashboard init error:', expect.any(Error))
    expect(w.find('[aria-label="Loading your dashboard"]').exists()).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('customer page: tabs', () => {
  it('opens on "new request" when no tab is given', async () => {
    const w = await open()
    expect(probeNames(w)).toEqual(['requests'])
    expect(w.find('[data-probe="requests"]').attributes('data-sub-tab')).toBe('new')
  })

  it.each([
    ['requests', 'requests'],
    ['wallet', 'wallet'],
    ['orders', 'orders'],
    ['profile', 'profile'],
    ['companies', 'companies'],
    ['clearance', 'clearance'],
  ])('tab=%s shows only its own section', async (tab, probeName) => {
    const w = await open({ tab })
    expect(probeNames(w)).toEqual([probeName])
  })

  it.each(['home', 'no-such-tab'])('an old or unknown tab=%s lands on "new request", not a dead end', async (tab) => {
    const w = await open({ tab })
    expect(probeNames(w)).toEqual(['requests'])
    expect(w.find('[data-probe="requests"]').attributes('data-sub-tab')).toBe('new')
  })

  it('loads no dashboard data of its own: each section fetches what it shows', async () => {
    await open({ tab: 'wallet' })
    await open()

    expect(wallet.getBalance).not.toHaveBeenCalled()
    expect(requestsApi.listForCustomer).not.toHaveBeenCalled()
    expect(store.state.getAllOrders).not.toHaveBeenCalled()
  })

  it('opens the request list on the requested request', async () => {
    const w = await open({ tab: 'requests', requestId: '88' })
    const p = w.find('[data-probe="requests"]')

    expect(p.attributes('data-sub-tab')).toBe('list')
    expect(p.attributes('data-request-id')).toBe('88')
  })

  it('uses the first request id when the parameter is repeated', async () => {
    const w = await open({ tab: 'requests', requestId: ['5', '6'] })
    expect(w.find('[data-probe="requests"]').attributes('data-request-id')).toBe('5')
  })

  it('shows the professional stock tab only to approved professionals', async () => {
    let w = await open({ tab: 'stock' })
    // Not approved: no stock section, and no blank page either.
    expect(w.find('[data-probe="requests"]').attributes('data-sub-tab')).toBe('new')
    expect(probeNames(w)).toEqual(['requests'])

    wrapper!.unmount()
    store.state.masterCustomer = { professional_status: 'pending' }
    w = await open({ tab: 'stock' })
    expect(w.find('[data-probe="requests"]').attributes('data-sub-tab')).toBe('new')
    expect(probeNames(w)).toEqual(['requests'])

    wrapper!.unmount()
    store.state.masterCustomer = { professional_status: 'approved' }
    w = await open({ tab: 'stock' })
    expect(probeNames(w)).toEqual(['stock'])
  })

  it('switches sections when the URL tab changes, without remounting', async () => {
    const w = await open({ tab: 'wallet' })
    expect(probeNames(w)).toEqual(['wallet'])

    route.query = { tab: 'orders' }
    await flushPromises()

    expect(probeNames(w)).toEqual(['orders'])
  })
})
