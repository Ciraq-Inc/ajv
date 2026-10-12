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
