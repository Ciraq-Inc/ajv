import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The order bill and payment reminder while a request waits for payment. HTTP is the boundary.
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

const open = async (over: Record<string, unknown> = {}) => {
  detail = {
    id: 5, request_number: 'RQ-5', status: 'payment_pending', fulfillment_type: 'pickup', delivery_fee: 15,
    customer_name: 'Ama', customer_phone: '0244123456', admin_notes: '', decisions: [],
    items: [
      { id: 9, product_name: 'Panadol Extra', quantity: 2, requested_quantity: 2, unit_price: 5, source_pharmacy_id: 1, pharmacy_name: 'Alpha Pharmacy' },
      { id: 10, product_name: 'Amoxil', quantity: 1, requested_quantity: 1, unit_price: 20, source_pharmacy_id: 1 },
    ],
    ...over,
  }
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail }
    return { success: true, data: [] }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const bill = () => wrapper.findAll('.section-card').find((s) => /Order Bill/.test(s.text()))!
const billLines = () => bill().findAll('.paid-breakdown-item').map((l) => l.text().replace(/\s+/g, ' '))
const totals = () => Object.fromEntries(bill().findAll('.payment-cost-row').map((r) => {
  const [k, v] = r.findAll('span, strong').map((n) => n.text())
  return [k, v]
}))
const customerLink = () => wrapper.find('a[title="Send WhatsApp payment reminder to customer"]')

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('order bill while awaiting payment', () => {
  it('lists each priced item with quantity, price and pharmacy', async () => {
    await open()

    expect(billLines()).toHaveLength(2)
    expect(billLines()[0]).toContain('Panadol Extra')
    expect(billLines()[0]).toContain('2 × GHS 5.00')
    expect(billLines()[0]).toContain('GHS 10.00')
    expect(billLines()[0]).toContain('Alpha Pharmacy')
  })

  it('totals the items for a pickup order, with no delivery fee', async () => {
    await open()

    expect(totals()).toEqual({ 'Items Subtotal': 'GHS 30.00', Total: 'GHS 30.00' })
  })

  it('adds the delivery fee to the total for a delivery order', async () => {
    await open({ fulfillment_type: 'delivery' })

    expect(totals()).toEqual({ 'Items Subtotal': 'GHS 30.00', 'Delivery Fee': 'GHS 15.00', Total: 'GHS 45.00' })
  })

  it('leaves out items that have no price', async () => {
    await open({ items: [
      { id: 9, product_name: 'Panadol Extra', quantity: 2, unit_price: 5 },
      { id: 10, product_name: 'Unpriced thing', quantity: 1 },
    ] })

    expect(billLines()).toHaveLength(1)
    expect(bill().text()).not.toContain('Unpriced thing')
    expect(totals().Total).toBe('GHS 10.00')
  })

  it('says so when nothing is priced yet, and shows no totals', async () => {
    await open({ items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2 }] })

    expect(bill().text()).toContain('No priced items found.')
    expect(bill().find('.payment-cost-totals').exists()).toBe(false)
  })

  it('bills from the snapshot the customer approved when there is one, with what was left out', async () => {
    await open({
      customer_decisions: [{
        status: 'approved',
        payload: { payment_snapshot: {
          selected_items: [{ item_id: 9, product_name: 'Panadol Extra', quantity: 1, unit_price: 7, line_total: 7, pharmacy_name: 'Beta Chemist' }],
          excluded_items: [{ item_id: 10, product_name: 'Amoxil', reason: 'removed_by_customer' }],
        } },
      }],
    })

    expect(billLines()).toHaveLength(1)
    expect(billLines()[0]).toContain('1 × GHS 7.00')
    expect(billLines()[0]).toContain('Beta Chemist')
    expect(totals().Total).toBe('GHS 7.00')
    expect(bill().find('.paid-breakdown-excluded').text()).toContain('Amoxil (Removed by customer)')
  })

  it('ignores a snapshot on a decision that was not approved', async () => {
    await open({
      customer_decisions: [{
        status: 'pending',
        payload: { payment_snapshot: { selected_items: [{ item_id: 9, product_name: 'Stale', quantity: 1, unit_price: 1, line_total: 1 }] } },
      }],
    })

    expect(bill().text()).not.toContain('Stale')
    expect(totals().Total).toBe('GHS 30.00')
  })
})

describe('payment reminder over WhatsApp', () => {
  const text = () => decodeURIComponent(customerLink().attributes('href')!.split('?text=')[1]!)

  it('greets the customer by name with the order number and the total', async () => {
    await open({ fulfillment_type: 'delivery' })

    expect(customerLink().attributes('href')).toMatch(/^https:[/][/]wa[.]me[/]233244123456[?]text=/)
    expect(text()).toContain('Hi Ama, your MedsGH order RQ-5 is confirmed and awaiting payment.')
    expect(text()).toContain('Total: GHS 45.00.')
    expect(text()).toContain('requestId=5')
  })

  it('leaves the total out when nothing is priced', async () => {
    await open({ items: [] })

    expect(text()).not.toContain('Total:')
  })

  it('is not offered when the customer has no phone number', async () => {
    await open({ customer_phone: '' })

    expect(customerLink().exists()).toBe(false)
  })
})
