import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
;(process as unknown as { client: boolean }).client = true

import { useApi } from '../../composables/useApi'

const ok = () => Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true, data: [] }) } as Response)

const authHeaderOf = (fetchMock: ReturnType<typeof vi.fn>): string | undefined => {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
  const headers = (init?.headers ?? {}) as Record<string, string>
  return headers.Authorization ?? headers.authorization
}

// An admin who is also a customer in the same browser holds both tokens.
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('adminToken', 'ADMIN')
  localStorage.setItem('customerAuthToken', 'CUSTOMER')
})
afterEach(() => {
  vi.unstubAllGlobals()
  window.history.pushState({}, '', '/')
})

describe('admin pages send the admin token', () => {
  it.each([
    '/api/orders/123',
    '/api/sms-credits/admin/overview',
    '/api/wallet/summary',
    '/api/platform-settings',
  ])('on /admin pages, %s uses the admin token even with a customer token present', async (endpoint) => {
    window.history.pushState({}, '', '/admin/orders')
    const fetchMock = vi.fn(ok)
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

    await useApi().get(endpoint)

    expect(authHeaderOf(fetchMock)).toBe('Bearer ADMIN')
  })

  it('customer pages still use the customer token for customer endpoints', async () => {
    window.history.pushState({}, '', '/some-pharmacy/orders')
    const fetchMock = vi.fn(ok)
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

    await useApi().get('/api/orders/123')

    expect(authHeaderOf(fetchMock)).toBe('Bearer CUSTOMER')
  })
})
