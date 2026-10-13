import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  store: { isAuthenticated: true, restoreSession: vi.fn(), hasRole: vi.fn(), getRole: 'admin', getDashboardRoute: '/data' } as Record<string, any>,
}))
const navigateTo = vi.hoisted(() => vi.fn((path: string) => `redirect:${path}`))
vi.hoisted(() => {
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
})
vi.stubGlobal('useAdminStore', () => state.store)
vi.stubGlobal('navigateTo', navigateTo)

// @ts-expect-error plain JS middleware
import adminAuth from '~/middleware/adminAuth.js'

const run = (meta: Record<string, unknown> = {}) =>
  (adminAuth as (to: unknown, from: unknown) => Promise<unknown>)({ meta, fullPath: '/admin/x' }, {})

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(state.store, { isAuthenticated: true, getRole: 'admin' })
  state.store.restoreSession.mockResolvedValue(true)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('admin route guard', () => {
  it('sends a signed-out visitor to the login page', async () => {
    state.store.isAuthenticated = false
    state.store.restoreSession.mockResolvedValue(false)

    expect(await run()).toBe('redirect:/admin/login')
  })

  it('lets an admin through a page with no role floor', async () => {
    expect(await run()).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('turns away an admin whose role is below the page floor', async () => {
    state.store.hasRole.mockReturnValue(false)

    expect(await run({ requiredRole: 'super_admin' })).toBe('redirect:/admin/unauthorized')
    expect(state.store.hasRole).toHaveBeenCalledWith('super_admin')
  })

  it('lets an admin who meets the page floor through', async () => {
    state.store.hasRole.mockReturnValue(true)

    expect(await run({ requiredRole: 'manager' })).toBeUndefined()
  })

  it('keeps data consumers out of the admin portal', async () => {
    state.store.getRole = 'data_consumer'

    expect(await run()).toBe('redirect:/data')
  })
})
