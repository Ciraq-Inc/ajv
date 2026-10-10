import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: clearance service (HTTP), useApi, Nuxt navigateTo ──
const svc = vi.hoisted(() => ({ listClearanceProducts: vi.fn() }))
vi.mock('~/services/clearanceSale/clearanceSaleService', () => ({ createClearanceSaleService: () => svc }))
vi.stubGlobal('useApi', () => ({}))
const nav = vi.fn()
vi.stubGlobal('navigateTo', nav)
vi.stubGlobal('process', { ...process, client: true })

import ClearanceDeals from '~/components/customers/clearanceDeals.vue'

let wrapper: ReturnType<typeof mount> | undefined
const BAD = /zinc-|emerald-|rose-|slate-|gray-|blue-\d|\[#[0-9a-fA-F]{3,6}\]|#[0-9a-fA-F]{6}|text-\[(9|10|11|13)px\]|gradient/
const future = new Date(Date.now() + 20 * 86400000).toISOString()
const P1 = { id: 1, company_id: 7, brand_name: 'Amoxil 500', discount_percent: 30, available_quantity: 3, expiry_date: future, original_price: 10, clearance_price: 7, unit: 'Pack' }
const P2 = { id: 2, company_id: 7, brand_name: 'Panadol', discount_percent: 20, available_quantity: 50, original_price: 5, clearance_price: 4, unit: 'Strip' }

const open = async (products: unknown[] = [P1, P2]) => {
  svc.listClearanceProducts.mockResolvedValue({ data: { products, pagination: { page: 1, total_pages: 1 } } })
  wrapper = mount(ClearanceDeals, { attachTo: document.body })
  await flushPromises()
}
const btn = (label: string) => document.body.querySelector(`button[aria-label="${label}"]`) as HTMLElement | null
const cards = () => Array.from(document.body.querySelectorAll('ul[aria-label="Clearance deals"] > li'))

beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear() })
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('ClearanceDeals: browsing', () => {
  it('lists deals with discount, expiry and prices in words', async () => {
    await open()

    expect(cards()).toHaveLength(2)
    expect(cards()[0].textContent).toContain('Amoxil 500')
    expect(cards()[0].textContent).toContain('30% off')
    expect(cards()[0].textContent).toContain('3 left')
    expect(cards()[0].textContent).toContain('Expires')
    expect(cards()[0].textContent).toContain('GHS 7.00')
  })

  it('has a labelled, 44px search box', async () => {
    await open()
    const input = document.body.querySelector('input[aria-label="Search clearance deals"]') as HTMLInputElement

    expect(input.className).toContain('min-h-[44px]')
  })

  it('announces loading politely', async () => {
    svc.listClearanceProducts.mockReturnValue(new Promise(() => {}))
    wrapper = mount(ClearanceDeals, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('[role="status"]')!.textContent).toContain('Loading')
  })

  it('announces a load failure as an alert with a 44px retry', async () => {
    svc.listClearanceProducts.mockRejectedValue(new Error('x'))
    wrapper = mount(ClearanceDeals, { attachTo: document.body })
    await flushPromises()

    const alert = document.body.querySelector('[role="alert"]')!
    expect(alert.textContent).toContain("couldn't load clearance deals")
    expect((alert.querySelector('button') as HTMLElement).className).toContain('min-h-[44px]')
  })

  it('shows an empty state', async () => {
    await open([])
    expect(document.body.textContent).toContain('No clearance deals right now')
  })
})

describe('ClearanceDeals: choosing', () => {
  it('steppers name the medicine, are 44px and respect stock', async () => {
    await open()
    const inc = btn('Increase quantity of Amoxil 500')!
    const dec = btn('Decrease quantity of Amoxil 500')!

    expect(inc.className).toContain('h-11 w-11')
    expect((dec as HTMLButtonElement).disabled).toBe(true)
    inc.click(); inc.click(); inc.click()
    await flushPromises()
    expect(cards()[0].textContent).toContain('3')
    expect((inc as HTMLButtonElement).disabled).toBe(true)
  })

  it('Add toggles a pressed state shown in words, and a bar offers to add them to a request', async () => {
    await open()
    const add = btn('Add Amoxil 500 to request')!
    expect(add.getAttribute('aria-pressed')).toBe('false')
    expect(add.className).toContain('min-h-[44px]')

    add.click()
    await flushPromises()

    expect(btn('Add Amoxil 500 to request')!.getAttribute('aria-pressed')).toBe('true')
    expect(btn('Add Amoxil 500 to request')!.textContent).toContain('Added')
    expect(document.body.textContent).toContain('Add 1 item to request')
  })

  it('saves a draft and goes to the new-request tab', async () => {
    await open()
    btn('Add Panadol to request')!.click()
    await flushPromises()
    ;(Array.from(document.body.querySelectorAll('button')).find(b => b.textContent!.includes('to request') && !b.hasAttribute('aria-pressed')) as HTMLElement).click()

    const draft = JSON.parse(sessionStorage.getItem('medsgh_homepage_request_draft')!)
    expect(draft.items[0]).toMatchObject({ product_name: 'Panadol', quantity: 1, prefer_clearance_only: true })
    expect(nav).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'new' } })
  })
})

describe('ClearanceDeals: look', () => {
  it('uses brand tokens and readable text sizes throughout', async () => {
    await open()
    btn('Add Amoxil 500 to request')!.click()
    await flushPromises()
    expect(document.body.innerHTML).not.toMatch(BAD)
  })
})
