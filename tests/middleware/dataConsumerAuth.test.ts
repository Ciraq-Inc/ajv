import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  store: {
    isAuthenticated: true,
    getRole: 'data_consumer',
    restoreSession: vi.fn(),
    verifyToken: vi.fn(),
    logout: vi.fn(),
  },
}))
const navigateTo = vi.hoisted(() => vi.fn((path: string) => `redirect:${path}`))

vi.hoisted(() => {
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)
  vi.stubGlobal('useAdminStore', () => state.store)
  vi.stubGlobal('navigateTo', navigateTo)
})

// @ts-expect-error plain JS middleware
import dataConsumerAuth from '~/middleware/dataConsumerAuth.js'

const run = () => (dataConsumerAuth as (to: unknown, from: unknown) => Promise<unknown>)(
  { path: '/dataconsumer/dashboard', fullPath: '/dataconsumer/dashboard?tab=overview' },
  {},
)

beforeEach(() => {
  vi.clearAllMocks()
  state.store.isAuthenticated = true
  state.store.getRole = 'data_consumer'
  state.store.restoreSession.mockResolvedValue(true)
  state.store.verifyToken.mockResolvedValue(true)
  vi.stubGlobal('process', { ...process, server: false, client: true })
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('data consumer middleware', () => {
  it('saves the intended route and redirects when no session exists', async () => {
    state.store.restoreSession.mockResolvedValue(false)
    state.store.isAuthenticated = false

    expect(await run()).toBe('redirect:/admin/login')
    expect(localStorage.getItem('adminIntendedRoute')).toBe('/dataconsumer/dashboard?tab=overview')
  })

  it('logs out an invalid token and saves the intended route', async () => {
    state.store.verifyToken.mockResolvedValue(false)

    expect(await run()).toBe('redirect:/admin/login')
    expect(state.store.logout).toHaveBeenCalledOnce()
    expect(localStorage.getItem('adminIntendedRoute')).toBe('/dataconsumer/dashboard?tab=overview')
  })

  it('allows a valid data consumer through', async () => {
    expect(await run()).toBeUndefined()
  })

  it('denies other authenticated roles', async () => {
    state.store.getRole = 'admin'

    expect(await run()).toBe('redirect:/admin/login?error=access-denied')
  })
})
