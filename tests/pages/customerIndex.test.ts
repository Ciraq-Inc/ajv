import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { timeAgo } from '~/composables/useTimeAgo'

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

const PAGE_POLL_MS = 15000

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
    expect(probeNames(w)).toEqual([])

    wrapper!.unmount()
    store.state.masterCustomer = { professional_status: 'pending' }
    w = await open({ tab: 'stock' })
    expect(probeNames(w)).toEqual([])

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

// ───────────────────────────────────────────────────────────────────────────
describe('customer page: home dashboard', () => {
  it('counts only requests that are still active', async () => {
    const w = await open({ tab: 'home' })
    // processing, paid and pending are active; delivered and cancelled are finished
    expect(w.find('[data-testid="active-request-count"]').text()).toBe('3')
  })

  it('loads the dashboard once, not twice, when the page opens on the home tab', async () => {
    await open({ tab: 'home' })

    expect(wallet.getBalance).toHaveBeenCalledTimes(1)
    expect(requestsApi.listForCustomer).toHaveBeenCalledTimes(1)
    expect(store.state.getAllOrders).toHaveBeenCalledTimes(1)
  })

  it('still loads the dashboard once on other tabs, so the wallet balance is ready', async () => {
    await open({ tab: 'orders' })

    expect(wallet.getBalance).toHaveBeenCalledTimes(1)
  })

  it('shows the wallet balance to two decimals', async () => {
    const w = await open({ tab: 'home' })
    expect(w.text()).toContain('GHS 12.50')
  })

  it('shows GHS 0.00 when the wallet has no balance field', async () => {
    wallet.getBalance.mockResolvedValue({ data: {} })
    const w = await open({ tab: 'home' })
    expect(w.text()).toContain('GHS 0.00')
  })

  it('tells screen readers the dashboard is loading, in words', async () => {
    requestsApi.listForCustomer.mockReturnValue(new Promise(() => {}))
    const w = await open({ tab: 'home' })

    const status = w.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.text()).toMatch(/loading/i)
  })

  it('shows skeletons while the first load is running', async () => {
    let finish!: (v: unknown) => void
    requestsApi.listForCustomer.mockReturnValue(new Promise((res) => { finish = res }))
    const w = await open({ tab: 'home' })

    expect(w.findAll('[aria-busy="true"]').length).toBeGreaterThan(0)
    expect(w.text()).not.toContain('No requests yet')

    finish({ data: [] })
    await flushPromises()
    expect(w.findAll('[aria-busy="true"]')).toHaveLength(0)
  })

  describe('error banner', () => {
    it('does not appear when everything loads', async () => {
      const w = await open({ tab: 'home' })
      expect(w.find('[role="alert"]').exists()).toBe(false)
    })

    it.each([
      ['the wallet', () => wallet.getBalance.mockRejectedValue(new Error('x'))],
      ['the requests', () => requestsApi.listForCustomer.mockRejectedValue(new Error('x'))],
    ])('appears when %s cannot be loaded, and the page still renders', async (_what, fail) => {
      fail()
      const w = await open({ tab: 'home' })

      expect(w.find('[role="alert"]').text()).toContain("We couldn't load some of your data")
      expect(w.text()).toContain('Active Requests')
    })

    it('does not appear when only the (non-critical) orders fail', async () => {
      store.state.getAllOrders.mockRejectedValue(new Error('x'))
      const w = await open({ tab: 'home' })

      expect(w.find('[role="alert"]').exists()).toBe(false)
      expect(w.text()).toContain('No active orders')
    })

    it('goes away after Try again succeeds', async () => {
      wallet.getBalance.mockRejectedValueOnce(new Error('x'))
      const w = await open({ tab: 'home' })
      expect(w.find('[role="alert"]').exists()).toBe(true)

      await button(w, 'Try again').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').exists()).toBe(false)
      expect(w.text()).toContain('GHS 12.50')
    })
  })

  describe('activity stream', () => {
    it('shows the latest two requests only', async () => {
      const w = await open({ tab: 'home' })
      const rows = w.findAll('[data-testid="request-row"]').filter(b => b.text().includes('GHS') && b.find('h3').exists())
      const requestRows = rows.filter(r => /Paracetamol|Amoxil/.test(r.text()))

      expect(requestRows).toHaveLength(2)
    })

    it('headlines with the first item and how many more', async () => {
      const w = await open({ tab: 'home' })
      expect(w.text()).toContain('Paracetamol +2 more')
      expect(w.text()).toContain('Amoxil')
    })

    it('falls back from item names to counts to the request type', async () => {
      requestsApi.listForCustomer.mockResolvedValue({
        data: [
          { id: 1, status: 'pending', item_count: 1 },
          { id: 2, status: 'pending', request_type: 'Prescription' },
        ],
      })
      let w = await open({ tab: 'home' })
      expect(w.text()).toContain('1 item')
      expect(w.text()).toContain('Prescription request')

      wrapper!.unmount()
      requestsApi.listForCustomer.mockResolvedValue({
        data: [
          { id: 1, status: 'pending', fulfillment_type: 'otc' },
          { id: 2, status: 'pending' },
        ],
      })
      w = await open({ tab: 'home' })
      expect(w.text()).toContain('OTC request')
      expect(w.text()).toContain('Medication request')
    })

    it('shows the status label, request number and when it last changed', async () => {
      const w = await open({ tab: 'home' })
      const text = w.text()

      expect(text).toContain('Processing')
      expect(text).toContain('#R-100')
      expect(text).toContain(timeAgo('2020-01-05T10:00:00Z'))
    })

    it('describes the contents and fulfilment: "2 items • delivery"', async () => {
      requestsApi.listForCustomer.mockResolvedValue({
        data: [{ id: 1, status: 'paid', item_count: 2, fulfillment_type: 'home_delivery' }],
      })
      const w = await open({ tab: 'home' })

      expect(w.text()).toContain('2 items • home delivery')
    })

    it('prefers the total cost, then the estimate, then items plus delivery', async () => {
      requestsApi.listForCustomer.mockResolvedValue({
        data: [
          { id: 1, status: 'paid', total_cost: 40, estimated_total: 99 },
          { id: 2, status: 'paid', total_cost: 0, estimated_total: 25 },
        ],
      })
      let w = await open({ tab: 'home' })
      expect(w.text()).toContain('GHS 40.00')
      expect(w.text()).toContain('GHS 25.00')

      wrapper!.unmount()
      requestsApi.listForCustomer.mockResolvedValue({
        data: [
          { id: 1, status: 'paid', items_total: 20, delivery_fee: 5, fulfillment_type: 'delivery' },
          { id: 2, status: 'paid', items_total: 20, delivery_fee: 5, fulfillment_type: 'pickup' },
        ],
      })
      w = await open({ tab: 'home' })
      expect(w.text()).toContain('GHS 25.00') // delivery adds the fee
      expect(w.text()).toContain('GHS 20.00') // pickup does not
    })

    it('opens the clicked request in the requests tab', async () => {
      const w = await open({ tab: 'home' })
      await w.findAll('button').find(b => b.text().includes('Paracetamol'))!.trigger('click')

      expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'requests', requestId: 1 } })
    })

    it('invites the customer to start when there are no requests', async () => {
      requestsApi.listForCustomer.mockResolvedValue({ data: [] })
      const w = await open({ tab: 'home' })

      expect(w.text()).toContain('No requests yet')
      expect(w.find('[data-testid="active-request-count"]').text()).toBe('0')
    })

    it('the empty state offers a way forward: Start a request opens the new-request tab', async () => {
      requestsApi.listForCustomer.mockResolvedValue({ data: [] })
      const w = await open({ tab: 'home' })

      await button(w, 'Start a request').trigger('click')
      expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'new' } })
    })
  })

  describe('ongoing orders', () => {
    it('lists the two newest orders still in progress, skipping finished ones', async () => {
      const w = await open({ tab: 'home' })
      const aside = w.find('aside').text()

      expect(aside).toContain('#ORD-0001')
      expect(aside).toContain('#ORD-0002')
      expect(aside).not.toContain('ABCDEFGH')
      expect(aside).not.toContain('#ORD-0003')
    })

    it('falls back to the latest orders when none is in progress', async () => {
      store.state.getAllOrders.mockResolvedValue([
        { order_id: 'ORD-9', status: 'delivered', total_amount: 5 },
        { order_id: 'ORD-8', status: 'cancelled', total_amount: 6 },
      ])
      const w = await open({ tab: 'home' })

      expect(w.find('aside').text()).toContain('#ORD-9')
    })

    it('shortens ids to eight characters and drops a leading #', async () => {
      store.state.getAllOrders.mockResolvedValue([{ order_id: '#ABCDEFGH12', status: 'processing', total_amount: 1 }])
      const w = await open({ tab: 'home' })

      expect(w.find('aside h3').text()).toBe('#ABCDEFGH')
    })

    it('shows amount, status label and a summary of what is in it', async () => {
      const w = await open({ tab: 'home' })
      const aside = w.find('aside').text()

      expect(aside).toContain('GHS 30.00')
      expect(aside).toContain('Preparing')
      expect(aside).toContain('Rigel Pharmacy') // no items, falls back to the pharmacy
      expect(aside).toContain('In transit')
      expect(aside).toContain('1 item') // no items, no pharmacy
    })

    it('says there are no active orders when there are none', async () => {
      store.state.getAllOrders.mockResolvedValue([])
      const w = await open({ tab: 'home' })
      expect(w.find('aside').text()).toContain('No active orders')
    })

    it('treats a non-list response as no orders', async () => {
      store.state.getAllOrders.mockResolvedValue(null)
      const w = await open({ tab: 'home' })
      expect(w.find('aside').text()).toContain('No active orders')
    })

    it('opens the Orders tab when an order is clicked', async () => {
      const w = await open({ tab: 'home' })
      await w.find('[data-testid="order-row"]').trigger('click')
      expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'orders' } })
    })
  })

  describe('verified partners', () => {
    it('shows the first three linked pharmacies with name and address', async () => {
      const w = await open({ tab: 'home' })
      const section = w.find('[data-testid="partners-section"]').text()

      expect(section).toContain('Rigel Pharmacy')
      expect(section).toContain('Kumasi Care') // name fallback
      expect(section).toContain('Third')
      expect(section).not.toContain('Fourth')
      expect(section).toContain('Linked pharmacy') // no address
    })

    it('goes straight to a pharmacy that has a storefront address', async () => {
      const w = await open({ tab: 'home' })
      await w.findAll('[data-testid="partner-row"]').find(b => b.text().includes('Rigel Pharmacy'))!.trigger('click')

      expect(navigateTo).toHaveBeenCalledWith('/rigel')
    })

    it('opens the pharmacy directory for one without a storefront', async () => {
      const w = await open({ tab: 'home' })
      await w.findAll('[data-testid="partner-row"]').find(b => b.text().includes('Kumasi Care'))!.trigger('click')

      expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'companies' } })
    })

    it('says so when no pharmacy is linked yet, and asks the store for them', async () => {
      store.state.companies = []
      const w = await open({ tab: 'home' })

      expect(w.text()).toContain('No pharmacies linked yet')
      expect(store.state.getMyCompanies).toHaveBeenCalled()
    })

    it('does not refetch pharmacies it already has', async () => {
      await open({ tab: 'home' })
      expect(store.state.getMyCompanies).not.toHaveBeenCalled()
    })

    it('survives a failed pharmacy refresh', async () => {
      store.state.companies = []
      store.state.getMyCompanies.mockRejectedValue(new Error('x'))
      const w = await open({ tab: 'home' })

      expect(w.text()).toContain('No pharmacies linked yet')
      expect(w.find('[role="alert"]').exists()).toBe(false)
    })
  })

  describe('shortcuts', () => {
    it.each([
      ['Top Up', 'wallet'],
      ['Full History', 'requests'],
      ['View All', 'orders'],
      ['Directory', 'companies'],
      ['Browse Clearance Deals', 'clearance'],
    ])('"%s" opens the %s tab', async (label, tab) => {
      const w = await open({ tab: 'home' })
      await button(w, label).trigger('click')

      expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab } })
    })

    it('the balance itself also opens the wallet', async () => {
      const w = await open({ tab: 'home' })
      await w.find('button[data-testid="wallet-balance"]').trigger('click')

      expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'wallet' } })
    })
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('customer page: live refresh of the home dashboard', () => {
  const fakeIntervals = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })

  it('refreshes every 15 seconds without showing skeletons again', async () => {
    fakeIntervals()
    const w = await open({ tab: 'home' })
    const before = wallet.getBalance.mock.calls.length

    wallet.getBalance.mockResolvedValue({ data: { balance: '99' } })
    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS)
    await flushPromises()

    expect(wallet.getBalance.mock.calls.length).toBe(before + 1)
    expect(w.text()).toContain('GHS 99.00')
    expect(w.findAll('[aria-busy="true"]')).toHaveLength(0)
  })

  it('keeps showing the last good data, with a warning, when a refresh fails', async () => {
    fakeIntervals()
    const w = await open({ tab: 'home' })
    requestsApi.listForCustomer.mockRejectedValue(new Error('down'))

    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS)
    await flushPromises()

    expect(w.find('[role="alert"]').text()).toContain("We couldn't load some of your data")
    expect(w.text()).toContain('Paracetamol')
    expect(w.text()).toContain('GHS 12.50')
  })

  it('pauses while the browser tab is hidden', async () => {
    fakeIntervals()
    await open({ tab: 'home' })
    const before = wallet.getBalance.mock.calls.length

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    try {
      await vi.advanceTimersByTimeAsync(PAGE_POLL_MS * 2)
      expect(wallet.getBalance.mock.calls.length).toBe(before)
    } finally {
      delete (document as unknown as { hidden?: boolean }).hidden
    }
  })

  it('gives up after three failed refreshes in a row', async () => {
    fakeIntervals()
    await open({ tab: 'home' })
    wallet.getBalance.mockRejectedValue(new Error('down'))
    const before = wallet.getBalance.mock.calls.length

    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS * 6)
    await flushPromises()

    // Three failures are allowed to run; after that the timer stops itself.
    expect(wallet.getBalance.mock.calls.length - before).toBe(3)
  })

  it('stops refreshing when the customer leaves the home tab', async () => {
    fakeIntervals()
    await open({ tab: 'home' })
    const before = wallet.getBalance.mock.calls.length

    wrapper!.unmount()
    wrapper = undefined
    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS * 3)

    expect(wallet.getBalance.mock.calls.length).toBe(before)
  })

  it('starts refreshing when the customer arrives on the home tab, and stops when they leave', async () => {
    fakeIntervals()
    await open({ tab: 'orders' })

    route.query = { tab: 'home' }
    await flushPromises()
    const afterArrive = wallet.getBalance.mock.calls.length
    expect(afterArrive).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS)
    await flushPromises()
    expect(wallet.getBalance.mock.calls.length).toBe(afterArrive + 1)

    route.query = { tab: 'wallet' }
    await flushPromises()
    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS * 3)
    expect(wallet.getBalance.mock.calls.length).toBe(afterArrive + 1)
  })

  it('does not poll at all on other tabs', async () => {
    fakeIntervals()
    await open({ tab: 'orders' })
    const before = wallet.getBalance.mock.calls.length

    await vi.advanceTimersByTimeAsync(PAGE_POLL_MS * 3)

    expect(wallet.getBalance.mock.calls.length).toBe(before)
  })
})
