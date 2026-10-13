import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The order-requests workspace asks on the page (not with the browser's confirm()/prompt()) before
// anything destructive or money-moving, and does nothing until the admin agrees. HTTP is the boundary.
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

// Nuxt auto-imports the composables folder into pages; vitest has no such step, so hand them over.
for (const [name, fn] of Object.entries(formatters)) vi.stubGlobal(name, fn)

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
const nativeConfirm = vi.fn(() => true)
const nativePrompt = vi.fn(() => 'RCPT-1')
let wrapper: ReturnType<typeof mount>

const detail = (over: Record<string, unknown> = {}) => ({
  id: 5,
  status: 'composing',
  items: [{ id: 9, product_name: 'Panadol Extra', quantity: 2, unit_price: 5 }],
  decisions: [],
  ...over,
})

const open = async (requestDetail: Record<string, unknown>) => {
  http.request.mockImplementation(async (url: string, opts: { method?: string }) => {
    if (url === '/api/order-requests/admin/5' && (opts.method ?? 'GET') === 'GET') return { success: true, data: requestDetail }
    return { success: true, data: [], message: 'done' }
  })
  wrapper = mount(OrderRequestsPage, { global: { stubs } })
  await flushPromises()
  await flushPromises()
}
const dialog = () => wrapper.find('[role="alertdialog"]')
const writes = (method: string) => http.request.mock.calls.filter(([, o]) => o?.method === method)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubGlobal('confirm', nativeConfirm)
  vi.stubGlobal('prompt', nativePrompt)
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

describe('order requests: deleting an item', () => {
  it('asks on the page, and only deletes once the admin agrees', async () => {
    await open(detail())

    await wrapper.find('button[aria-label="Delete request item"]').trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(dialog().exists()).toBe(true)
    expect(dialog().text()).toContain('Panadol Extra')
    expect(writes('DELETE')).toHaveLength(0)

    await dialog().findAll('button').find((b) => /yes, delete/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(writes('DELETE').map(([url]) => url)).toEqual(['/api/order-requests/admin/items/9'])
  })

  it('does nothing when the admin backs out', async () => {
    await open(detail())

    await wrapper.find('button[aria-label="Delete request item"]').trigger('click')
    await flushPromises()
    await dialog().findAll('button').find((b) => /cancel/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(dialog().exists()).toBe(false)
    expect(writes('DELETE')).toHaveLength(0)
  })
})

const answer = async (label: RegExp) => {
  await dialog().findAll('button').find((b) => label.test(b.text()))!.trigger('click')
  await flushPromises()
}

describe('order requests: refunding a failed delivery', () => {
  it('asks first, then refunds with the goods-returned choice', async () => {
    await open(detail({ status: 'delivery_failed' }))

    await wrapper.find('[data-testid="refund-failed-delivery"]').trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(writes('POST')).toHaveLength(0)

    await answer(/yes, refund/i)

    expect(writes('POST').map(([url, o]) => [url, JSON.parse(o.body)])).toEqual([
      ['/api/order-requests/admin/5/refund-failed-delivery', { goods_returned: false }],
    ])
  })
})

describe('order requests: sending a request back to Compose', () => {
  it('asks first, and only then changes the status', async () => {
    await open(detail({ status: 'sourcing' }))

    await wrapper.findAll('button').find((b) => /back to compose/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(writes('PUT')).toHaveLength(0)

    await answer(/yes, send back/i)

    expect(writes('PUT').map(([url, o]) => [url, JSON.parse(o.body).status])).toEqual([
      ['/api/order-requests/admin/5/status', 'composing'],
    ])
  })
})

describe('order requests: resolving a decision for the customer', () => {
  it('asks first, then records the admin’s answer', async () => {
    await open(detail({ status: 'awaiting_input', customer_decisions: [{ id: 3, status: 'pending', payload: {} }] }))

    await wrapper.findAll('button').find((b) => /approve for customer/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(writes('POST')).toHaveLength(0)

    await answer(/yes, approve/i)

    expect(writes('POST').map(([url, o]) => [url, JSON.parse(o.body)])).toEqual([
      ['/api/order-requests/admin/5/decisions/3/resolve', { response: 'approved' }],
    ])
  })
})

describe('order requests: confirming payment was received', () => {
  const startPaymentConfirmation = async () => {
    await open(detail({ status: 'payment_pending' }))
    await wrapper.findAll('button').find((b) => /override status/i.test(b.text()))!.trigger('click')
    await wrapper.find('select.header-status-override-select').setValue('paid')
    await wrapper.find('button.header-status-override-apply').trigger('click')
    await flushPromises()
  }
  const paymentDialog = () => wrapper.find('[data-test="prompt-dialog"]')

  it('asks for the receipt number on the page and sends it with the confirmation', async () => {
    await startPaymentConfirmation()

    expect(nativePrompt).not.toHaveBeenCalled()
    expect(paymentDialog().exists()).toBe(true)
    expect(writes('POST')).toHaveLength(0)

    await paymentDialog().find('input').setValue('  RCPT-77 ')
    await paymentDialog().trigger('submit')
    await flushPromises()

    expect(writes('POST').map(([url, o]) => [url, JSON.parse(o.body)])).toEqual([
      ['/api/order-requests/admin/5/confirm-manual-payment', { method: 'manual', reference: 'RCPT-77' }],
    ])
    expect(paymentDialog().exists()).toBe(false)
  })

  it('will not confirm without a receipt number', async () => {
    await startPaymentConfirmation()

    await paymentDialog().trigger('submit')
    await flushPromises()

    expect(writes('POST')).toHaveLength(0)
    expect(paymentDialog().text()).toMatch(/receipt or transfer number/i)
  })

  it('does nothing when the admin backs out', async () => {
    await startPaymentConfirmation()

    await paymentDialog().findAll('button').find((b) => /cancel/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(paymentDialog().exists()).toBe(false)
    expect(writes('POST')).toHaveLength(0)
  })
})
