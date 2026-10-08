import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: orders service, user store, useApi, navigateTo ──
const svc = vi.hoisted(() => ({ searchProducts: vi.fn() }))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({ createOrderRequestsService: () => svc }))
const store = vi.hoisted(() => ({ masterCustomer: { latitude: 5.6, longitude: -0.2 } as Record<string, unknown> | undefined }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store }))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))
const nav = vi.fn()
vi.stubGlobal('navigateTo', nav)
vi.stubGlobal('process', { ...process, client: true })

import ProfessionalStock from '~/components/customers/professionalStock.vue'

let wrapper: ReturnType<typeof mount> | undefined
const BAD = /zinc-|emerald-|rose-|slate-|gray-|blue-\d|\[#[0-9a-fA-F]{3,6}\]|#[0-9a-fA-F]{6}|text-\[(9|10|11|13)px\]|text-xs/
const C1 = { pharmacy_id: 4, product_id: null, product_name: 'Amoxil 500', unit: 'Pack', unit_price: 12.5, available_quantity: 8, distance_km: 2.34, days_since_last_sync: 0 }
const C2 = { pharmacy_id: 5, product_id: 9, product_name: 'Amoxil 250', unit: 'Pack', unit_price: 6, available_quantity: 0, days_since_last_sync: 3 }

const search = async (candidates: unknown[] = [C1, C2], text = 'amox') => {
  vi.useFakeTimers()
  svc.searchProducts.mockResolvedValue({ data: { candidates } })
  wrapper = mount(ProfessionalStock, { attachTo: document.body })
  const input = document.body.querySelector('input[type="search"]') as HTMLInputElement
  input.value = text
  input.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(400)
  await flushPromises()
  vi.useRealTimers()
}
const rows = () => Array.from(document.body.querySelectorAll('ul[aria-label="Matching products"] > li'))

beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); store.masterCustomer = { latitude: 5.6, longitude: -0.2 } })
afterEach(() => { vi.useRealTimers(); wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('ProfessionalStock', () => {
  it('has a labelled 44px search box', () => {
    wrapper = mount(ProfessionalStock, { attachTo: document.body })
    const input = document.body.querySelector('input[type="search"]') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe('Search pharmacy stock')
    expect(input.className).toContain('min-h-[44px]')
  })

  it('asks for a location, in words, when none is set, and disables search', () => {
    store.masterCustomer = undefined
    wrapper = mount(ProfessionalStock, { attachTo: document.body })
    expect(document.body.querySelector('[role="status"]')!.textContent).toContain('Location required')
    expect((document.body.querySelector('input[type="search"]') as HTMLInputElement).disabled).toBe(true)
  })

  it('lists results with price, stock and distance in words', async () => {
    await search()
    expect(rows()).toHaveLength(2)
    expect(rows()[0].textContent).toContain('Amoxil 500')
    expect(rows()[0].textContent).toContain('GHS 12.50')
    expect(rows()[0].textContent).toContain('8 in stock')
    expect(rows()[0].textContent).toContain('2.3 km')
    expect(rows()[1].textContent).toContain('Out of stock')
  })

  it('shows an empty state after a search with no matches', async () => {
    await search([])
    expect(document.body.textContent).toContain('No matching products found nearby')
  })

  it('announces a failed search as an alert', async () => {
    vi.useFakeTimers()
    svc.searchProducts.mockRejectedValue(new Error('We could not reach MedsGH.'))
    wrapper = mount(ProfessionalStock, { attachTo: document.body })
    const input = document.body.querySelector('input[type="search"]') as HTMLInputElement
    input.value = 'amox'
    input.dispatchEvent(new Event('input'))
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    vi.useRealTimers()
    expect(document.body.querySelector('[role="alert"]')!.textContent).toContain('We could not reach MedsGH.')
  })

  it('Add buttons name the product, are 44px, and out-of-stock cannot be added', async () => {
    await search()
    const add = document.body.querySelector('button[aria-label="Add Amoxil 500 to request"]') as HTMLButtonElement
    const out = document.body.querySelector('button[aria-label="Add Amoxil 250 to request"]') as HTMLButtonElement
    expect(add.className).toContain('min-h-[44px]')
    expect(out.disabled).toBe(true)

    add.click()
    await flushPromises()

    expect(add.textContent).toContain('Added')
    expect(add.getAttribute('aria-pressed')).toBe('true')
    expect(document.body.textContent).toContain('1 item selected')
  })

  it('saves a draft and continues to the new-request tab', async () => {
    await search()
    ;(document.body.querySelector('button[aria-label="Add Amoxil 500 to request"]') as HTMLElement).click()
    await flushPromises()
    ;(Array.from(document.body.querySelectorAll('button')).find(b => b.textContent!.includes('Continue to request')) as HTMLElement).click()

    const draft = JSON.parse(sessionStorage.getItem('medsgh_homepage_request_draft')!)
    expect(draft.items[0]).toMatchObject({ product_name: 'Amoxil 500', quantity: 1, source_pharmacy_id: 4 })
    expect(nav).toHaveBeenCalledWith('/customer?tab=new')
  })

  it('uses brand tokens and readable text sizes throughout', async () => {
    await search()
    ;(document.body.querySelector('button[aria-label="Add Amoxil 500 to request"]') as HTMLElement).click()
    await flushPromises()
    expect(document.body.innerHTML).not.toMatch(BAD)
  })
})
