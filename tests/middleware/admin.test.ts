import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { isLoggedIn: true, checkAuthState: vi.fn(), checkAdminRights: vi.fn() },
  pharmacy: { currentPharmacy: null as number | null, pharmacySlug: null as string | null, restoreFromStorage: vi.fn() },
}))
const navigateTo = vi.hoisted(() => vi.fn((path: string) => `redirect:${path}`))

vi.hoisted(() => {
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
  vi.stubGlobal('useUserStore', () => state.user)
  vi.stubGlobal('usePharmacyStore', () => state.pharmacy)
  vi.stubGlobal('navigateTo', navigateTo)
})

// @ts-expect-error plain JS middleware
import adminMiddleware from '~/middleware/admin.js'

const run = () => (adminMiddleware as (to: unknown, from: unknown) => Promise<unknown>)({ path: '/admin' }, {})

beforeEach(() => {
  vi.clearAllMocks()
  state.user.isLoggedIn = true
  state.user.checkAuthState.mockResolvedValue(undefined)
  state.user.checkAdminRights.mockResolvedValue(true)
  state.pharmacy.currentPharmacy = null
  state.pharmacy.pharmacySlug = null
  vi.stubGlobal('process', { ...process, server: false })
})

describe('pharmacy admin middleware', () => {
  it('sends a signed-out user to login', async () => {
    state.user.isLoggedIn = false
    expect(await run()).toBe('redirect:/login')
    expect(state.user.checkAdminRights).not.toHaveBeenCalled()
  })

  it('allows an authenticated pharmacy admin through', async () => {
    expect(await run()).toBeUndefined()
    expect(state.user.checkAdminRights).toHaveBeenCalledOnce()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('restores pharmacy context before redirecting a non-admin', async () => {
    state.user.checkAdminRights.mockResolvedValue(false)
    state.pharmacy.restoreFromStorage.mockImplementation(async () => {
      state.pharmacy.pharmacySlug = 'eden'
    })

    expect(await run()).toBe('redirect:/eden')
    expect(state.pharmacy.restoreFromStorage).toHaveBeenCalledOnce()
  })
})
