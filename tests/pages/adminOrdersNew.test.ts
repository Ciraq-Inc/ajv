import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP layer is the boundary; the page is driven through its table and dialog buttons.
const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => ({ pharmacySlug: 'kofi' }) }))

import OrdersNewPage from '~/pages/admin/orders-new.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

const makeOrder = () => ({ order_id: 'ORD-1', customer_id: 'C-1', status: 'pending', total_amount: 40, created_at: '2026-10-01T10:00:00Z' })

let wrapper: ReturnType<typeof mount>
const mountPage = async () => {
  wrapper = mount(OrdersNewPage, { global: { stubs: { Teleport: true }, components: { ConfirmDialog } } })
  await flushPromises()
  return wrapper
}
const button = (text: string) => wrapper.findAll('button').find((b) => b.text().trim() === text)!
const notice = () => wrapper.find('[data-test="page-notice"]')

let alertSpy: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  alertSpy = vi.fn()
  vi.stubGlobal('alert', alertSpy)
  vi.stubGlobal('confirm', vi.fn(() => true))
  http.get.mockResolvedValue({ success: true, data: [makeOrder()] })
  http.put.mockResolvedValue({ success: true })
})
afterEach(() => wrapper.unmount())

describe('admin orders: changing status from the table', () => {
  it('asks in the page first and changes nothing if the admin cancels', async () => {
    await mountPage()

    await button('Confirm').trigger('click')
    await flushPromises()

    expect(confirm).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('change this order to "confirmed"')

    await button('Cancel').trigger('click')
    expect(http.put).not.toHaveBeenCalled()
  })

  it('updates the status once confirmed and says so on the page, not in an alert', async () => {
    await mountPage()

    await button('Confirm').trigger('click')
    await button('Yes, change it').trigger('click')
    await flushPromises()

    expect(http.put).toHaveBeenCalledWith('/api/orders/ORD-1/status', { status: 'confirmed' })
    expect(alertSpy).not.toHaveBeenCalled()
    expect(notice().text()).toMatch(/status updated/i)
  })

  it('shows the server reason when the update is refused', async () => {
    http.put.mockRejectedValue(new Error('Order is already cancelled'))
    await mountPage()

    await button('Confirm').trigger('click')
    await button('Yes, change it').trigger('click')
    await flushPromises()

    expect(alertSpy).not.toHaveBeenCalled()
    expect(notice().text()).toContain('Order is already cancelled')
  })
})
