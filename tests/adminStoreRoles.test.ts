import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('~/services/admin/adminService', () => ({ createAdminService: () => ({}) }))
vi.mock('~/services/admin/webAuthnService', () => ({ createWebAuthnService: () => ({}) }))
vi.mock('~/services/admin/webAuthnRegistrationService', () => ({ createWebAuthnRegistrationService: () => ({}) }))
vi.stubGlobal('useApi', () => ({}))

import { useAdminStore } from '../stores/admin'

// The backend ranks roles data_consumer 0 ... admin 6, super_admin 7 (src/auth/adminRoles.js).
const asRole = (role: string) => {
  const store = useAdminStore()
  store.admin = { id: 1, username: 'x', role } as never
  return store
}

beforeEach(() => setActivePinia(createPinia()))

describe('admin store roles follow the backend ranking', () => {
  it('an admin does not satisfy a super_admin requirement', () => {
    expect(asRole('admin').hasRole('super_admin')).toBe(false)
    expect(asRole('super_admin').hasRole('super_admin')).toBe(true)
  })

  it('higher roles satisfy lower requirements, lower ones do not satisfy higher', () => {
    expect(asRole('super_admin').hasRole('admin')).toBe(true)
    expect(asRole('manager').hasRole('admin')).toBe(false)
    expect(asRole('auditor').hasRole('support_agent')).toBe(true)
  })

  it('an unknown required role is never satisfied (fails closed)', () => {
    expect(asRole('super_admin').hasRole('super_admn')).toBe(false)
    expect(asRole('auditor').hasRole('nonsense')).toBe(false)
  })

  it('a signed-out visitor satisfies nothing', () => {
    const store = useAdminStore()
    expect(store.hasRole('data_consumer')).toBe(false)
  })

  it('isSuperAdmin is true for super_admin only', () => {
    expect(asRole('super_admin').isSuperAdmin).toBe(true)
    expect(asRole('admin').isSuperAdmin).toBe(false)
  })

  it('isAdminOrAbove covers admin and super_admin', () => {
    expect(asRole('admin').isAdminOrAbove).toBe(true)
    expect(asRole('super_admin').isAdminOrAbove).toBe(true)
    expect(asRole('manager').isAdminOrAbove).toBe(false)
  })
})
