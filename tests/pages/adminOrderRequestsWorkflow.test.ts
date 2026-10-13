import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Moving a request along its early stages with the next-step button, and the decisions that wait on
// the customer. HTTP is the boundary; the buttons are the public interface.
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

const item = (over: Record<string, unknown> = {}) => ({
  id: 9, product_name: 'Panadol Extra', quantity: 2, unit_price: 5, resolution_status: 'resolved', ...over,
})
let detail: Record<string, unknown>
let failOn: string | undefined
const open = async (over: Record<string, unknown> = {}) => {
  detail = { id: 5, status: 'composing', admin_notes: '', items: [item()], decisions: [], ...over }
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    const method = opts?.method ?? 'GET'
    if (failOn && url.includes(failOn)) throw new Error('server said no')
    if (url === '/api/order-requests/admin/5' && method === 'GET') return { success: true, data: detail }
    if (url === '/api/order-requests/admin/5/status') return { success: true, message: 'Status changed' }
    if (url === '/api/order-requests/admin/5/process') return { success: true, data: { request: detail, status: detail.status, pharmacy_queue: [] } }
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

beforeEach(() => {
  vi.clearAllMocks()
  failOn = undefined
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('next step: starting work on a request', () => {
  it('claims a pending request by moving it to composing', async () => {
    await open({ status: 'pending' })

    await button(/start composing/i).trigger('click')
    await flushPromises()

    expect(calls(/\/5\/status/, 'PUT').map(body)).toEqual([{ status: 'composing', admin_notes: '' }])
    expect(wrapper.text()).toContain('Status changed')
  })

  it('says so when the status cannot be changed', async () => {
    await open({ status: 'pending' })
    failOn = '/status'

    await button(/start composing/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })
})

describe('next step: composing to sourcing', () => {
  it('moves on once every item is identified', async () => {
    await open({ status: 'composing', items: [item()] })

    const next = wrapper.find('button.next-step-btn, button.status-nudge-btn, .status-nudge-banner button')
    expect(next.exists()).toBe(true)
    expect(wrapper.text()).toContain('All items identified')
    await button(/start sourcing/i).trigger('click')
    await flushPromises()

    expect(calls(/\/5\/status/, 'PUT').map(body)).toEqual([{ status: 'sourcing', admin_notes: '' }])
  })

  it('holds back while an item is still unidentified', async () => {
    await open({ status: 'composing', items: [item({ resolution_status: 'unresolved' })] })

    expect(wrapper.text()).not.toContain('All items identified')
    const next = button(/start sourcing/i)
    expect(next.attributes('disabled')).toBeDefined()
    await next.trigger('click')
    expect(calls(/\/5\/status/, 'PUT')).toHaveLength(0)
  })
})

describe('decisions waiting on the customer', () => {
  const pending = () => ({
    id: 77,
    status: 'pending',
    decision_type: 'action_needed',
    payload: {
      summary: { requested_items: 2 },
      decision_items: [
        { item_id: 9, product_name: 'Panadol Extra', status: 'available', unit_price: 5, quantity: 2 },
        { item_id: 10, product_name: 'Rare Drug', status: 'not_available' },
      ],
    },
  })

  it('says what declining would cost, and what the order is worth', async () => {
    await open({ status: 'awaiting_input', customer_decisions: [pending()] })

    const text = wrapper.text()
    expect(text).toContain('If declined: 1 item return to sourcing, 1 item cannot be sourced.')
    expect(wrapper.find('.decision-stat--value').text()).toContain('10')
  })

  it('re-sends the SMS and refreshes the request', async () => {
    await open({ status: 'awaiting_input', customer_decisions: [pending()] })

    await button(/re-send sms/i).trigger('click')
    await flushPromises()

    expect(calls(/decisions\/77\/notify/, 'POST')).toHaveLength(1)
    expect(wrapper.text()).toContain('Customer notified via SMS')
  })

  it('says so when the SMS cannot be sent', async () => {
    await open({ status: 'awaiting_input', customer_decisions: [pending()] })
    failOn = '/notify'

    await button(/re-send sms/i).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('server said no')
  })

  it('offers no admin override once the customer has answered', async () => {
    await open({ status: 'awaiting_input', customer_decisions: [{ ...pending(), status: 'approved' }] })

    expect(wrapper.findAll('button').some((b) => /re-send sms/i.test(b.text()))).toBe(false)
  })
})
