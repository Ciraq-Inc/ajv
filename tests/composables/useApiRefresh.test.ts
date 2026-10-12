import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
;(process as unknown as { client: boolean }).client = true

import { useApi } from '../../composables/useApi'

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body } as Response)

// Boundary: the backend. Routes by URL so call order doesn't matter.
const backend = (routes: Record<string, (n: number) => Promise<Response>>) => {
  const calls: Record<string, number> = {}
  return vi.fn((url: string) => {
    const path = String(url).replace('http://api.test', '')
    calls[path] = (calls[path] ?? 0) + 1
    const handler = routes[path]
    return handler ? handler(calls[path]) : json(404, { message: 'no route' })
  })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('customerAuthToken', 'expired-access')
  localStorage.setItem('customerRefreshToken', 'good-refresh')
})
afterEach(() => vi.unstubAllGlobals())

describe('customer session survives an expired access token', () => {
  it('refreshes and retries the profile call instead of failing it, keeping the refresh token', async () => {
    vi.stubGlobal('fetch', backend({
      '/api/auth/customer/profile': (n) => (n === 1 ? json(401, { message: 'expired' }) : json(200, { success: true, data: { id: 7 } })),
      '/api/auth/refresh': () => json(200, { success: true, access_token: 'new-access', refresh_token: 'new-refresh' }),
    }))
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

    const res = await useApi().get('/api/auth/customer/profile')

    expect(res).toMatchObject({ success: true, data: { id: 7 } })
    expect(localStorage.getItem('customerAuthToken')).toBe('new-access')
    expect(localStorage.getItem('customerRefreshToken')).toBe('new-refresh')
  })

  it('still treats a 401 from login as wrong credentials, with no refresh attempt', async () => {
    const fetchMock = backend({ '/api/auth/customer/login': () => json(401, { message: 'Invalid credentials' }) })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

    await expect(useApi().post('/api/auth/customer/login', {})).rejects.toMatchObject({ status: 401 })

    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/api/auth/refresh'))).toBe(false)
  })
})

// With cookie refresh switched on, the refresh token lives only in an HttpOnly
// cookie. The browser cannot read the CSRF cookie from the API host, so it asks
// the API for the token and sends it back with the refresh.
describe('customer session refreshed from the HttpOnly cookie (cookie refresh on)', () => {
  const cookieMode = () => vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test', cookieRefresh: true } }))
  const optionsOf = (fetchMock: ReturnType<typeof backend>, path: string) =>
    fetchMock.mock.calls.find(([u]) => String(u) === `http://api.test${path}`)?.[1] as RequestInit

  beforeEach(() => localStorage.removeItem('customerRefreshToken'))

  it('refreshes with the cookie and the CSRF token, never sending or keeping a refresh token in the page', async () => {
    const fetchMock = backend({
      '/api/auth/customer/profile': (n) => (n === 1 ? json(401, { message: 'expired' }) : json(200, { success: true, data: { id: 7 } })),
      '/api/auth/csrf': () => json(200, { success: true, data: { csrf_token: 'csrf-1' } }),
      '/api/auth/refresh': () => json(200, { success: true, access_token: 'new-access', refresh_token: 'rotated-in-cookie' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    cookieMode()

    const res = await useApi().get('/api/auth/customer/profile')

    expect(res).toMatchObject({ success: true, data: { id: 7 } })
    const refresh = optionsOf(fetchMock, '/api/auth/refresh')
    expect(refresh.credentials).toBe('include')
    expect((refresh.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-1')
    expect(JSON.parse(String(refresh.body))).not.toHaveProperty('refresh_token')
    expect(optionsOf(fetchMock, '/api/auth/csrf').credentials).toBe('include')
    expect(localStorage.getItem('customerAuthToken')).toBe('new-access')
    expect(localStorage.getItem('customerRefreshToken')).toBeNull()
  })

  it('drops a refresh token left in localStorage by an earlier version once the cookie refresh works', async () => {
    localStorage.setItem('customerRefreshToken', 'old-legacy')
    vi.stubGlobal('fetch', backend({
      '/api/auth/customer/profile': (n) => (n === 1 ? json(401, { message: 'expired' }) : json(200, { success: true, data: {} })),
      '/api/auth/csrf': () => json(200, { success: true, data: { csrf_token: 'csrf-1' } }),
      '/api/auth/refresh': () => json(200, { success: true, access_token: 'new-access', refresh_token: 'x' }),
    }))
    cookieMode()

    await useApi().get('/api/auth/customer/profile')

    expect(localStorage.getItem('customerRefreshToken')).toBeNull()
  })

  it('falls back to a legacy stored refresh token when there is no usable cookie, so nobody is logged out by the switch', async () => {
    localStorage.setItem('customerRefreshToken', 'old-legacy')
    const fetchMock = backend({
      '/api/auth/customer/profile': (n) => (n === 1 ? json(401, { message: 'expired' }) : json(200, { success: true, data: {} })),
      '/api/auth/csrf': () => json(200, { success: true, data: { csrf_token: 'csrf-1' } }),
      '/api/auth/refresh': (n) => (n === 1 ? json(400, { message: 'refresh_token is required' }) : json(200, { success: true, access_token: 'via-legacy', refresh_token: 'x' })),
    })
    vi.stubGlobal('fetch', fetchMock)
    cookieMode()

    await useApi().get('/api/auth/customer/profile')

    expect(JSON.parse(String(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/auth/refresh'))[1]![1]!.body))).toEqual({ refresh_token: 'old-legacy' })
    expect(localStorage.getItem('customerAuthToken')).toBe('via-legacy')
  })

  it('treats a failed cookie refresh with nothing to fall back on as an expired session', async () => {
    vi.stubGlobal('fetch', backend({
      '/api/auth/customer/profile': () => json(401, { message: 'expired' }),
      '/api/auth/csrf': () => json(200, { success: true, data: { csrf_token: 'csrf-1' } }),
      '/api/auth/refresh': () => json(401, { message: 'Invalid refresh token' }),
    }))
    cookieMode()

    await expect(useApi().get('/api/auth/customer/profile')).rejects.toMatchObject({ status: 401 })

    expect(localStorage.getItem('customerAuthToken')).toBeNull()
  })
})
