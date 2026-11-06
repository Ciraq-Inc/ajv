import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  store: { isLoggedIn: true, userRole: 'pharmacy_staff', checkAuthState: vi.fn() },
}))
const navigateTo = vi.hoisted(() => vi.fn((path: string) => `redirect:${path}`))

vi.hoisted(() => {
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
  vi.stubGlobal('useCompanyStore', () => state.store)
  vi.stubGlobal('navigateTo', navigateTo)
})

// @ts-expect-error plain JS middleware
import companyAuth from '~/middleware/companyAuth.js'

const run = (to: { path: string; fullPath: string; query?: Record<string, unknown> }) =>
  (companyAuth as (to: unknown, from: unknown) => Promise<unknown>)(to, {})

beforeEach(() => {
  vi.clearAllMocks()
  state.store.isLoggedIn = true
  state.store.userRole = 'pharmacy_staff'
  state.store.checkAuthState.mockResolvedValue(undefined)
  vi.stubGlobal('process', { ...process, server: false })
})

describe('company auth redirect handling', () => {
  it('accepts an already-decoded local redirect without decoding it again', async () => {
    expect(await run({
      path: '/eden/services/login',
      fullPath: '/eden/services/login?redirect=%2Feden%2Fservices%2Forders',
      query: { redirect: '/eden/services/orders' },
    })).toBe('redirect:/eden/services/orders')
  })

  it('rejects a double-encoded protocol-relative redirect and uses the role landing page', async () => {
    expect(await run({
      path: '/eden/services/login',
      fullPath: '/eden/services/login?redirect=%252F%252Fevil.example',
      query: { redirect: '%2F%2Fevil.example' },
    })).toBe('redirect:/eden/services/orders')
  })
})
