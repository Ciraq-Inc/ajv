import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  pharmacy: {
    currentPharmacy: null as number | null,
    pharmacySlug: null as string | null,
    pharmacyData: null as object | null,
    restoreFromStorage: vi.fn(),
    getPharmacyIdFromSlug: vi.fn(),
    setCurrentPharmacy: vi.fn(),
    setPharmacySlug: vi.fn(),
    fetchPharmacyData: vi.fn(),
    getPharmacyPath: vi.fn((path: string) => `/eden${path}`),
  },
  cart: {
    activePharmacy: null as number | null,
    activePharmacySlug: null as string | null,
    restoreFromStorage: vi.fn(),
    validatePharmacyContext: vi.fn(),
    setActivePharmacy: vi.fn(),
  },
}))
const navigateTo = vi.hoisted(() => vi.fn((target: unknown) => `redirect:${JSON.stringify(target)}`))

vi.hoisted(() => {
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
  vi.stubGlobal('navigateTo', navigateTo)
})
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => state.pharmacy }))
vi.mock('~/stores/cart', () => ({ useCartStore: () => state.cart }))

// @ts-expect-error plain JS middleware
import pharmacyMiddleware from '~/middleware/pharmacy.js'

const run = (path: string, pharmacy: string | undefined, from = '/') =>
  (pharmacyMiddleware as (to: unknown, from: unknown) => Promise<unknown>)(
    { path, fullPath: path, params: pharmacy ? { pharmacy } : {} },
    { fullPath: from },
  )

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(state.pharmacy, {
    currentPharmacy: null,
    pharmacySlug: null,
    pharmacyData: null,
  })
  Object.assign(state.cart, { activePharmacy: null, activePharmacySlug: null })
  state.pharmacy.getPharmacyIdFromSlug.mockResolvedValue(17)
  state.pharmacy.setCurrentPharmacy.mockResolvedValue(undefined)
  state.pharmacy.fetchPharmacyData.mockResolvedValue(undefined)
  state.cart.setActivePharmacy.mockReturnValue(true)
  vi.stubGlobal('console', Object.fromEntries(['log', 'error', 'warn'].map((key) => [key, vi.fn()])))
})

describe('pharmacy route middleware', () => {
  it('skips system routes without restoring pharmacy state', async () => {
    expect(await run('/login', undefined)).toBeUndefined()
    expect(state.pharmacy.restoreFromStorage).not.toHaveBeenCalled()
  })

  it('sets pharmacy and cart context from a valid pharmacy slug', async () => {
    expect(await run('/eden/products', 'eden')).toBeUndefined()
    expect(state.pharmacy.getPharmacyIdFromSlug).toHaveBeenCalledWith('eden')
    expect(state.pharmacy.setCurrentPharmacy).toHaveBeenCalledWith(17)
    expect(state.pharmacy.setPharmacySlug).toHaveBeenCalledWith('eden')
    expect(state.cart.setActivePharmacy).toHaveBeenCalledWith(17, 'eden')
  })

  it('returns to the homepage when a pharmacy slug does not exist', async () => {
    state.pharmacy.getPharmacyIdFromSlug.mockResolvedValue(null)

    expect(await run('/missing/products', 'missing')).toBe('redirect:{"path":"/","query":{"error":"pharmacy-not-found"}}')
    expect(state.pharmacy.setCurrentPharmacy).not.toHaveBeenCalled()
  })

  it('preserves the requested destination when no pharmacy is selected', async () => {
    expect(await run('/products?search=soap', undefined)).toBe(
      'redirect:{"path":"/","query":{"redirect":"/products?search=soap"}}',
    )
  })
})
