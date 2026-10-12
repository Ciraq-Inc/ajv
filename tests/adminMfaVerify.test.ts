import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const service = vi.hoisted(() => ({
  verifyMfaTotp: vi.fn(),
  verifyMfaSms: vi.fn(),
}))

vi.mock('~/services/admin/adminService', () => ({ createAdminService: () => service }))
vi.mock('~/services/admin/webAuthnService', () => ({ createWebAuthnService: () => ({}) }))
vi.mock('~/services/admin/webAuthnRegistrationService', () => ({ createWebAuthnRegistrationService: () => ({}) }))
vi.stubGlobal('useApi', () => ({}))
;(process as any).client = true

import { useAdminStore } from '../stores/admin'

// The backend answers a passed MFA challenge with a flat body: { success, token, refresh_token, user }.
const passed = {
  success: true,
  token: 'access.jwt.value',
  refresh_token: 'refresh-value',
  user: { id: 7, username: 'boss', role: 'super_admin' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})

describe.each([
  ['TOTP', 'verifyMfaTotp', { challengeId: 'c1', code: '123456' }],
  ['SMS', 'verifyMfaSms', { challengeId: 'c1', code: '123456' }],
] as const)('admin store: %s MFA verify', (_label, action, args) => {
  it('signs the admin in from the flat response', async () => {
    ;(service as any)[action].mockResolvedValue(passed)
    const store = useAdminStore()
    const result = await (store as any)[action](args)

    expect(result).toMatchObject({ success: true })
    expect(store.isAuthenticated).toBe(true)
    expect(store.token).toBe('access.jwt.value')
    expect(store.admin).toMatchObject({ id: 7, role: 'super_admin' })
    expect(localStorage.getItem('adminToken')).toBe('access.jwt.value')
    expect(localStorage.getItem('adminRefreshToken')).toBe('refresh-value')
  })

  it('reports a wrong code without signing in', async () => {
    ;(service as any)[action].mockRejectedValue(Object.assign(new Error('Invalid code'), { status: 401 }))
    const store = useAdminStore()
    const result = await (store as any)[action](args)

    expect(result).toMatchObject({ success: false, message: 'Invalid code' })
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('adminToken')).toBeNull()
  })
})
