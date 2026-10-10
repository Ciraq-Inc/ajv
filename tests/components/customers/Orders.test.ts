import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: user store (HTTP), useApi, Nuxt globals ──
const store = vi.hoisted(() => ({ nextCursor: null as string | null, getAllOrders: vi.fn(), getOrderDetails: vi.fn(), cancelOrder: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store }))
const api = vi.hoisted(() => ({ request: vi.fn() }))
vi.stubGlobal('useApi', () => api)

import Orders from '~/components/customers/orders.vue'

let wrapper: ReturnType<typeof mount> | undefined
const STORE_ORDER = { order_id: 'ord_1234567890', company_id: 1, company_name: 'Alpha Pharmacy', status: 'pending', created_at: '2026-10-02T10:00:00Z', total_amount: 30 }
const REQUEST = { id: 9, request_number: 'REQ-9', status: 'delivered', updated_at: '2026-10-03T10:00:00Z', fulfillment_type: 'delivery', items_total: 40, delivery_fee: 5 }
const BAD = /zinc-|emerald-|rose-|slate-|gray-|blue-\d|\[#[0-9a-fA-F]{3,6}\]|#[0-9a-fA-F]{6}|text-\[(9|10|11|13)px\]/

const open = async (orders: unknown[] = [STORE_ORDER], requests: unknown[] = [REQUEST]) => {
  store.getAllOrders.mockResolvedValue(orders)
  api.request.mockImplementation(async (url: string) => (url.includes('/customer?') ? { data: requests } : { data: { ...REQUEST, items: [{ product_name: 'Amoxicillin', quantity: 2, unit_price: 20 }] } }))
  wrapper = mount(Orders, { attachTo: document.body, global: { stubs: { ConfirmDialog: { props: ['isOpen', 'title'], template: '<div v-if="isOpen" data-testid="confirm">{{ title }}</div>' } } } })
  await flushPromises()
  return wrapper
}
const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
const rows = () => Array.from(document.body.querySelectorAll('ul[aria-label="Your orders"] li'))
const dlg = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null

beforeEach(() => { vi.clearAllMocks(); store.nextCursor = null })
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('Orders: list', () => {
  it('lists orders and requests newest first, each row a 44px button', async () => {
    await open()

    expect(rows()).toHaveLength(2)
    expect(rows()[0].textContent).toContain('Request #REQ-9')
    expect(rows()[1].textContent).toContain('Order #ord_1234')
    expect(rows()[0].querySelector('button')!.className).toContain('min-h-[56px]')
  })

  it('filters with pressed-state chips', async () => {
    await open()
    const chip = (label: string) => Array.from(document.body.querySelectorAll('[aria-label="Filter orders"] button')).find(b => b.textContent!.trim() === label)! as HTMLElement

    expect(chip('All').getAttribute('aria-pressed')).toBe('true')
    chip('Completed').click()
    await flushPromises()

    expect(chip('Completed').getAttribute('aria-pressed')).toBe('true')
    expect(chip('All').getAttribute('aria-pressed')).toBe('false')
    expect(rows()).toHaveLength(1)
    expect(rows()[0].textContent).toContain('Request #REQ-9')
    expect(chip('Completed').className).toContain('min-h-[44px]')
  })

  it('shows an empty state', async () => {
    await open([], [])
    expect(document.body.textContent).toContain('No orders yet')
  })

  it('offers a retry, announced as an alert, when loading fails', async () => {
    store.getAllOrders.mockRejectedValue(new Error('x'))
    api.request.mockRejectedValue(new Error('x'))
    wrapper = mount(Orders, { attachTo: document.body })
    await flushPromises()

    const alert = document.body.querySelector('[role="alert"]')!
    expect(alert.textContent).toContain('load your orders')
    expect(Array.from(alert.querySelectorAll('button')).some(b => b.textContent!.includes('Try again'))).toBe(true)
  })

  it('has a labelled 44px cancel control on pending store orders only', async () => {
    await open()
    const cancel = document.body.querySelectorAll('button[aria-label^="Cancel this order"]')

    expect(cancel).toHaveLength(1)
    expect(cancel[0].className).toContain('h-11 w-11')
  })
})

describe('Orders: detail dialogs', () => {
  it('opens the purchase dialog, labelled, and closes by Escape', async () => {
    store.getOrderDetails.mockResolvedValue({ ...STORE_ORDER, items: [{ product_name: 'Paracetamol', qty: 1, selling_price: 30, line_total: 30 }], subtotal: 30 })
    await open()
    ;(rows()[1].querySelector('button') as HTMLElement).click()
    await flushPromises()

    const d = dlg()!
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent).toContain('Your purchase')
    expect(d.textContent).toContain('Paracetamol')

    press('Escape')
    await flushPromises()
    expect(dlg()).toBeNull()
  })

  it('opens the request dialog and closes with the labelled Close button', async () => {
    await open()
    ;(rows()[0].querySelector('button') as HTMLElement).click()
    await flushPromises()

    const d = dlg()!
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)!.textContent).toContain('Medication request')
    expect(d.textContent).toContain('Amoxicillin')
    const close = d.querySelector('button[aria-label="Close"]') as HTMLElement
    expect(close.className).toContain('h-11 w-11')
    close.click()
    await flushPromises()
    expect(dlg()).toBeNull()
  })

  it('asks for confirmation before cancelling', async () => {
    await open()
    ;(document.body.querySelector('button[aria-label^="Cancel this order"]') as HTMLElement).click()
    await flushPromises()
    expect(document.body.querySelector('[data-testid="confirm"]')!.textContent).toContain('Cancel this order')
  })

  it('tells the customer, as an alert, when details fail to load', async () => {
    store.getOrderDetails.mockRejectedValue(new Error('x'))
    await open()
    ;(rows()[1].querySelector('button') as HTMLElement).click()
    await flushPromises()

    const t = document.body.querySelector('[data-testid="toast"]')!
    expect(t.getAttribute('role')).toBe('alert')
    expect(t.textContent).toContain('Failed to load order details')
  })
})

describe('Orders: look', () => {
  it('uses brand tokens and readable text sizes throughout', async () => {
    store.getOrderDetails.mockResolvedValue({ ...STORE_ORDER, items: [] })
    await open()
    expect(document.body.innerHTML).not.toMatch(BAD)
    ;(rows()[1].querySelector('button') as HTMLElement).click()
    await flushPromises()
    expect(document.body.innerHTML).not.toMatch(BAD)
  })
})
