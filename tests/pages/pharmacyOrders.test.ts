import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The one boundary is the HTTP call. The company store is stubbed so that however the page reaches
// the server (through the store today, through the portal service later) the call lands here.
const http = vi.hoisted(() => ({ request: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => ({ request: http.request }))
vi.mock('~/stores/company', () => ({
  useCompanyStore: () => ({
    makeAuthRequest: (url: string, options?: unknown) => http.request(url, options),
    getApiHeaders: () => ({ 'x-company-domain': 'kofi' }),
    currentCompany: { name: 'Kofi Pharmacy', tel1: '0244000111', tel2: null, whatsapp_number: null },
  }),
}))

import OrdersPage from '~/pages/[pharmacy]/services/orders.vue'

const order = (over: Record<string, unknown>) => ({
  id: 1, request_number: 'REQ-0001', customer_name: 'Ama Mensah', customer_address: 'East Legon',
  created_at: '2026-10-01T10:00:00Z', status: 'preparing', pharmacy_total: '120.50', item_count: 2,
  fulfillment_type: 'delivery', delivery_fee: 10, ...over,
})
const items = [
  { id: 11, resolved_name: 'Paracetamol 500mg', quantity: 2, unit_price: '5.00', line_total: '10.00', sourcing_status: 'allocated' },
  { id: 12, resolved_name: 'Vitamin C', quantity: 1, unit_price: '12.50', line_total: '12.50', sourcing_status: 'allocated' },
]

const servedUrls = () => http.request.mock.calls.map((c) => c[0])

const mountPage = async () => {
  const wrapper = mount(OrdersPage, { global: { stubs: { Teleport: true } } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  http.request.mockImplementation(async (url: string) => {
    if (url === '/api/pharmacy-portal/orders') {
      return { success: true, orders: [order({}), order({ id: 2, request_number: 'REQ-0002', customer_name: 'Kojo', status: 'delivered' })] }
    }
    if (url === '/api/pharmacy-portal/orders/1') return { success: true, order: order({}), items }
    return { success: true }
  })
})

describe('the pharmacy’s order list', () => {
  it('loads the pharmacy’s orders when the page opens and shows each one', async () => {
    const wrapper = await mountPage()

    expect(servedUrls()).toEqual(['/api/pharmacy-portal/orders'])
    expect(wrapper.text()).toContain('REQ-0001')
    expect(wrapper.text()).toContain('REQ-0002')
    expect(wrapper.text()).toContain('GH₵120.50')
  })

  it('says so when there are no orders', async () => {
    http.request.mockResolvedValue({ success: true, orders: [] })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('No orders in this category.')
  })

  it('shows an empty list rather than breaking when the request fails', async () => {
    http.request.mockRejectedValue(new Error('offline'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('No orders in this category.')
    expect(wrapper.text()).not.toContain('Loading orders...')
  })

  it('narrows the list by the status tab', async () => {
    const wrapper = await mountPage()
    const completed = wrapper.findAll('button').find((b) => b.text() === 'Completed')!
    await completed.trigger('click')
    expect(wrapper.text()).toContain('REQ-0002')
    expect(wrapper.text()).not.toContain('REQ-0001')
  })

  it('narrows the list by what is typed in the search box', async () => {
    const wrapper = await mountPage()
    await wrapper.find('input[type="text"]').setValue('kojo')
    expect(wrapper.text()).toContain('REQ-0002')
    expect(wrapper.text()).not.toContain('REQ-0001')
  })

  it('Refresh asks the server again', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('button').find((b) => b.text() === 'Refresh')!.trigger('click')
    await flushPromises()
    expect(servedUrls()).toEqual(['/api/pharmacy-portal/orders', '/api/pharmacy-portal/orders'])
  })
})

describe('opening one order', () => {
  it('fetches that order’s detail and shows its items', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('div.cursor-pointer')[0]!.trigger('click')
    await flushPromises()

    expect(servedUrls()).toContain('/api/pharmacy-portal/orders/1')
    expect(wrapper.text()).toContain('Paracetamol 500mg')
    expect(wrapper.text()).toContain('Vitamin C')
  })

  it('still shows the order from the list when the detail request fails', async () => {
    const wrapper = await mountPage()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    http.request.mockRejectedValueOnce(new Error('offline'))
    await wrapper.findAll('div.cursor-pointer')[0]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('REQ-0001')
  })
})
