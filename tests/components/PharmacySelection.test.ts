import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

// PharmacySelection relies on Nuxt auto-imports; provide them as the runtime would.
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('useApi', () => ({}))

const router = vi.hoisted(() => ({ push: vi.fn() }))
const route = vi.hoisted(() => ({ query: {} as Record<string, unknown> }))
vi.mock('vue-router', () => ({ useRouter: () => router, useRoute: () => route }))

const pharmacyStore = vi.hoisted(() => ({
  currentPharmacy: null,
  clearPharmacyData: vi.fn(),
  setCurrentPharmacy: vi.fn(),
  setPharmacySlug: vi.fn(),
  getPharmacyPath: vi.fn((p: string) => `/rigel${p}`),
}))
const cartStore = vi.hoisted(() => ({ setActivePharmacy: vi.fn() }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => pharmacyStore }))
vi.mock('~/stores/cart', () => ({ useCartStore: () => cartStore }))

const auth = vi.hoisted(() => ({ listCompanies: vi.fn() }))
vi.mock('~/services/companyAuth/companyAuthService', () => ({ createCompanyAuthService: () => auth }))

import PharmacySelection from '~/components/PharmacySelection.vue'

const companies = [
  { id: 1, companytype: 0, name: 'Rigel Pharmacy', location: 'East Legon, Accra', tel1: '0244000001', domain_name: 'rigel' },
  { id: 2, companytype: 0, name: 'Kumasi Care', location: 'Adum, Kumasi', tel1: '', tel2: '0322000002', domain_name: '' },
  { id: 3, companytype: 1, name: 'Not A Pharmacy', location: 'Nowhere', tel1: '1', domain_name: 'nope' },
  { id: 4, companytype: 0, name: '', location: '  ', tel1: '', tel2: '' },
]

let wrapper: ReturnType<typeof mount> | undefined
const load = async () => {
  wrapper = mount(PharmacySelection, { attachTo: document.body })
  await flushPromises()
  return wrapper
}
const cards = (w: ReturnType<typeof mount>) => w.findAll('.cursor-pointer.border')
const cardNames = (w: ReturnType<typeof mount>) => cards(w).map(c => c.find('h2').text())

beforeEach(() => {
  vi.clearAllMocks()
  route.query = {}
  auth.listCompanies.mockResolvedValue({ success: true, data: companies })
  pharmacyStore.setCurrentPharmacy.mockResolvedValue(undefined)
  cartStore.setActivePharmacy.mockResolvedValue(undefined)
  pharmacyStore.getPharmacyPath.mockImplementation((p: string) => `/rigel${p}`)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
})

describe('PharmacySelection: listing', () => {
  it('shows a loading message until the pharmacies arrive', async () => {
    let finish!: (v: unknown) => void
    auth.listCompanies.mockReturnValue(new Promise((res) => { finish = res }))
    wrapper = mount(PharmacySelection, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain('Loading pharmacies...')

    finish({ success: true, data: companies })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Loading pharmacies...')
  })

  it('lists only pharmacies (company type 0)', async () => {
    const w = await load()
    expect(cardNames(w)).toEqual(['Rigel Pharmacy', 'Kumasi Care', 'Unknown Pharmacy'])
  })

  it('shows name, location and phone, with sensible fallbacks for missing details', async () => {
    const w = await load()
    const [rigel, kumasi, unknown] = cards(w).map(c => c.text())

    expect(rigel).toContain('East Legon, Accra')
    expect(rigel).toContain('0244000001')
    expect(kumasi).toContain('0322000002') // second phone when the first is blank
    expect(unknown).toContain('Location not provided')
    expect(unknown).toContain('No contact information')
  })

  it('shows no cards, and no "not found" message, when the server returns nothing', async () => {
    auth.listCompanies.mockResolvedValue({ success: false })
    const w = await load()

    expect(cards(w)).toHaveLength(0)
    expect(w.text()).not.toContain('No pharmacies found')
  })

  it('explains a load failure and retries on request', async () => {
    auth.listCompanies.mockRejectedValueOnce(new Error('boom'))
    const w = await load()
    expect(w.text()).toContain('Failed to load pharmacies. Please try again.')
    expect(cards(w)).toHaveLength(0)

    await w.findAll('button').find(b => b.text().includes('Try Again'))!.trigger('click')
    await flushPromises()

    expect(auth.listCompanies).toHaveBeenCalledTimes(2)
    expect(w.text()).not.toContain('Failed to load pharmacies')
    expect(cards(w)).toHaveLength(3)
  })
})

describe('PharmacySelection: searching', () => {
  it('filters by name, ignoring case', async () => {
    const w = await load()
    await w.find('input[type="text"]').setValue('KUMASI')
    expect(cardNames(w)).toEqual(['Kumasi Care'])
  })

  it('filters by location too', async () => {
    const w = await load()
    await w.find('input[type="text"]').setValue('legon')
    expect(cardNames(w)).toEqual(['Rigel Pharmacy'])
  })

  it('says so, and offers to clear, when nothing matches', async () => {
    const w = await load()
    await w.find('input[type="text"]').setValue('zzz')

    expect(w.text()).toContain('No pharmacies found')
    expect(w.text()).toContain('"zzz"')

    await w.findAll('button').find(b => b.text() === 'Clear Search')!.trigger('click')
    expect(cards(w)).toHaveLength(3)
    expect((w.find('input[type="text"]').element as HTMLInputElement).value).toBe('')
  })

  it('clears the box from the X inside it', async () => {
    const w = await load()
    await w.find('input[type="text"]').setValue('rigel')
    await w.find('span.cursor-pointer').trigger('click')

    expect(cards(w)).toHaveLength(3)
  })
})

describe('PharmacySelection: choosing a pharmacy', () => {
  const choose = async (w: ReturnType<typeof mount>, name: string) => {
    await cards(w).find(c => c.find('h2').text() === name)!.trigger('click')
    await flushPromises()
  }

  it('resets old context, selects the pharmacy in both stores, then opens its storefront', async () => {
    const w = await load()
    await choose(w, 'Rigel Pharmacy')

    expect(pharmacyStore.clearPharmacyData).toHaveBeenCalledTimes(1)
    expect(pharmacyStore.setCurrentPharmacy).toHaveBeenCalledWith('1')
    expect(pharmacyStore.setPharmacySlug).toHaveBeenCalledWith('rigel')
    expect(cartStore.setActivePharmacy).toHaveBeenCalledWith('1', 'rigel')
    expect(pharmacyStore.getPharmacyPath).toHaveBeenCalledWith('')
    expect(router.push).toHaveBeenCalledWith('/rigel')
  })

  it('uses the pharmacy id as its slug when it has no domain name', async () => {
    const w = await load()
    await choose(w, 'Kumasi Care')

    expect(pharmacyStore.setPharmacySlug).toHaveBeenCalledWith('2')
    expect(cartStore.setActivePharmacy).toHaveBeenCalledWith('2', '2')
  })

  it('returns to the page the customer came from when a redirect was given', async () => {
    route.query = { redirect: '/orders' }
    const w = await load()
    await choose(w, 'Rigel Pharmacy')

    expect(pharmacyStore.getPharmacyPath).toHaveBeenCalledWith('/orders')
    expect(router.push).toHaveBeenCalledWith('/rigel/orders')
  })

  it('uses the first value when the redirect appears more than once', async () => {
    route.query = { redirect: ['/orders', '/products'] }
    const w = await load()
    await choose(w, 'Rigel Pharmacy')

    expect(pharmacyStore.getPharmacyPath).toHaveBeenCalledWith('/orders')
  })

  it('shows a connecting screen while the pharmacy is being set up', async () => {
    let finish!: () => void
    pharmacyStore.setCurrentPharmacy.mockReturnValue(new Promise<void>((res) => { finish = res }))
    const w = await load()
    await cards(w)[0].trigger('click')
    await flushPromises()

    expect(w.text()).toContain('Connecting to Pharmacy')

    finish()
    await flushPromises()
  })

  it('stays on the list, without navigating, when the customer cancels a pharmacy switch', async () => {
    cartStore.setActivePharmacy.mockResolvedValue(false)
    const w = await load()
    await choose(w, 'Rigel Pharmacy')

    expect(router.push).not.toHaveBeenCalled()
    expect(w.text()).not.toContain('Connecting to Pharmacy')
    expect(cards(w)).toHaveLength(3)
  })

  it('reports a failure to select and lets the customer pick again', async () => {
    pharmacyStore.setCurrentPharmacy.mockRejectedValueOnce(new Error('nope'))
    const w = await load()
    await choose(w, 'Rigel Pharmacy')

    expect(w.text()).toContain('Failed to select pharmacy. Please try again.')
    expect(w.text()).not.toContain('Connecting to Pharmacy')
    expect(router.push).not.toHaveBeenCalled()
  })
})
