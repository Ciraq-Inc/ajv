import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const service = vi.hoisted(() => ({ logout: vi.fn() }))

vi.mock('~/services/admin/adminService', () => ({ createAdminService: () => service }))
vi.mock('~/services/admin/webAuthnService', () => ({ createWebAuthnService: () => ({}) }))
vi.mock('~/services/admin/webAuthnRegistrationService', () => ({ createWebAuthnRegistrationService: () => ({}) }))
vi.stubGlobal('useApi', () => ({}))
;(process as unknown as { client: boolean }).client = true

import { useAdminStore } from '../stores/admin'

const signedIn = () => {
  localStorage.setItem('adminToken', 'access')
  localStorage.setItem('adminRefreshToken', 'refresh-1')
  localStorage.setItem('adminUser', '{"id":1}')
  const store = useAdminStore()
  store.token = 'access'
  store.admin = { id: 1, username: 'x', role: 'admin' } as never
  store.isAuthenticated = true
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})

describe('admin sign out', () => {
  it('revokes the session on the server, then clears it locally', async () => {
    service.logout.mockResolvedValue({ success: true })
    const store = signedIn()

    await store.signOut()

    expect(service.logout).toHaveBeenCalledWith({ refreshToken: 'refresh-1' })
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('adminToken')).toBeNull()
    expect(localStorage.getItem('adminRefreshToken')).toBeNull()
  })

  it('still signs out locally when the server cannot be reached', async () => {
    service.logout.mockRejectedValue(new Error('offline'))
    const store = signedIn()

    await store.signOut()

    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('adminToken')).toBeNull()
  })

  it('skips the server call when there is no refresh token', async () => {
    const store = signedIn()
    localStorage.removeItem('adminRefreshToken')

    await store.signOut()

    expect(service.logout).not.toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
  })
})
