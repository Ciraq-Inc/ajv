import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: user store (HTTP), Nuxt navigateTo ──
const store = vi.hoisted(() => ({ companies: [] as unknown[], currentCompany: { company_id: 1 }, getMyCompanies: vi.fn(), triggerCustomerLinking: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store }))
const nav = vi.fn()
vi.stubGlobal('navigateTo', nav)

import LinkedCompanies from '~/components/customers/linkedCompanies.vue'

let wrapper: ReturnType<typeof mount> | undefined
const BAD = /zinc-|emerald-|rose-|slate-|gray-|blue-\d|\[#[0-9a-fA-F]{3,6}\]|#[0-9a-fA-F]{6}|text-\[(9|10|11|13)px\]|gradient/
const COMPANIES = [
  { company_id: 1, company_name: 'Alpha Pharmacy', domain_name: 'alpha', location: 'Accra', phone: '0200000000' },
  { company_id: 2, company_name: 'Beta Chemist' },
]

const open = async (companies: unknown[] = COMPANIES) => {
  store.companies = companies
  store.getMyCompanies.mockResolvedValue(undefined)
  wrapper = mount(LinkedCompanies, { attachTo: document.body })
  await flushPromises()
}
const btn = (text: string) => Array.from(document.body.querySelectorAll('button')).find(b => b.textContent!.includes(text)) as HTMLElement | undefined

beforeEach(() => { vi.clearAllMocks(); store.companies = [] })
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('LinkedCompanies', () => {
  it('lists pharmacies with Active or Linked in words and a 44px visit button', async () => {
    await open()
    const items = document.body.querySelectorAll('ul[aria-label="Linked pharmacies"] li')

    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain('Alpha Pharmacy')
    expect(items[0].textContent).toContain('Active')
    expect(items[1].textContent).toContain('Linked')
    expect(items[0].querySelector('button')!.className).toContain('min-h-[44px]')
  })

  it('opens the pharmacy storefront from its slug', async () => {
    await open()
    ;(document.body.querySelector('ul[aria-label="Linked pharmacies"] li button') as HTMLElement).click()
    expect(nav).toHaveBeenCalledWith('/alpha')
  })

  it('shows an empty state', async () => {
    await open([])
    expect(document.body.textContent).toContain('No linked pharmacies')
  })

  it('says so, as an alert with retry, when loading fails, instead of faking an empty list', async () => {
    store.getMyCompanies.mockRejectedValue(new Error('x'))
    wrapper = mount(LinkedCompanies, { attachTo: document.body })
    await flushPromises()

    expect(document.body.querySelector('[role="alert"]')!.textContent).toContain("couldn't load")
    expect(document.body.textContent).not.toContain('No linked pharmacies')
    store.getMyCompanies.mockResolvedValue(undefined)
    btn('Try again')!.click()
    await flushPromises()
    expect(store.getMyCompanies).toHaveBeenCalledTimes(2)
  })

  it('announces the linking result politely, and errors as alerts', async () => {
    await open()
    store.triggerCustomerLinking.mockResolvedValue({ message: 'Linked 2 pharmacies' })
    btn('Link accounts')!.click()
    await flushPromises()
    expect(document.body.querySelector('[role="status"]')!.textContent).toContain('Linked 2 pharmacies')

    store.triggerCustomerLinking.mockRejectedValue(new Error('Nope'))
    btn('Link accounts')!.click()
    await flushPromises()
    expect(document.body.querySelector('[role="alert"]')!.textContent).toContain('Nope')
  })

  it('has a 44px Link accounts button', async () => {
    await open()
    expect(btn('Link accounts')!.className).toContain('min-h-[44px]')
  })

  it('uses brand tokens and readable text sizes throughout', async () => {
    await open()
    expect(document.body.innerHTML).not.toMatch(BAD)
  })
})
