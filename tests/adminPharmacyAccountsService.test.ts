import { describe, expect, it, vi } from 'vitest'
import { createAdminPharmacyAccountsService } from '../services/admin/pharmacyAccountsService'
import { canAccessAdminPage } from '../utils/adminRoleFloors'

describe('adminPharmacyAccountsService & role floor', () => {
  it('allows auditor and above on /admin/pharmacy-accounts', () => {
    expect(canAccessAdminPage((role) => role === 'auditor', '/admin/pharmacy-accounts')).toBe(true)
    expect(canAccessAdminPage(() => false, '/admin/pharmacy-accounts')).toBe(false)
  })

  it('calls overview and detail endpoints with expected query params', async () => {
    const get = vi.fn().mockResolvedValue({ success: true, data: {} })
    const service = createAdminPharmacyAccountsService({
      get,
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      del: vi.fn(),
    } as never)

    await service.getOverview({ range: '7d', accountType: 'cash', search: 'osu' })
    expect(get).toHaveBeenCalledWith('/api/admin/pharmacy-accounts/overview', {
      params: {
        range: '7d',
        search: 'osu',
        accountType: 'cash',
      },
    })

    await service.getPharmacyDetail(101, { range: 'all', accountType: 'all', limit: 25, offset: 50 })
    expect(get).toHaveBeenCalledWith('/api/admin/pharmacy-accounts/101', {
      params: {
        range: 'all',
        accountType: undefined,
        limit: 25,
        offset: 50,
      },
    })
  })
})
