import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiInstance } from '../services/types'
import { createAdminAccessService } from '../services/admin/accessService'
import { createCompanyUsersService } from '../services/companyUsers/companyUsersService'

const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), request: vi.fn() }
const asApi = api as unknown as ApiInstance

beforeEach(() => {
  vi.clearAllMocks()
  for (const call of Object.values(api)) call.mockResolvedValue({ success: true })
})

describe('admin access service', () => {
  const access = () => createAdminAccessService(asApi)

  it('hands back exactly what the server sent', async () => {
    api.get.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    await expect(access().listCompanies()).resolves.toEqual({ success: true, data: [{ id: 1 }] })
  })

  it('lists the companies', async () => {
    await access().listCompanies()
    expect(api.get).toHaveBeenCalledWith('/api/companies')
  })

  it('lists a company’s API keys and their stats', async () => {
    await access().listApiKeys(5)
    expect(api.get).toHaveBeenLastCalledWith('/api/companies/5/api-keys')
    await access().getApiKeyStats(5)
    expect(api.get).toHaveBeenLastCalledWith('/api/companies/5/api-keys/stats')
  })

  it('creates a key with a name and an expiry in snake_case', async () => {
    await access().createApiKey(5, { keyName: 'CI', expiresAt: '2027-01-01' })
    expect(api.post).toHaveBeenCalledWith('/api/companies/5/api-keys', { key_name: 'CI', expires_at: '2027-01-01' })
  })

  it('leaves the expiry out when there is none', async () => {
    await access().createApiKey(5, { keyName: 'CI', expiresAt: '' })
    expect(api.post).toHaveBeenCalledWith('/api/companies/5/api-keys', { key_name: 'CI' })
  })

  it('deactivates a key', async () => {
    await access().deactivateApiKey(5, 8)
    expect(api.delete).toHaveBeenCalledWith('/api/companies/5/api-keys/8')
  })

  it('reveals a key', async () => {
    await access().revealApiKey(5, 8)
    expect(api.get).toHaveBeenCalledWith('/api/companies/5/api-keys/8/reveal')
  })

  it('lists the users of every company', async () => {
    await access().listTenantUsers()
    expect(api.get).toHaveBeenCalledWith('/api/admin/users/access')
  })

  it('sets one user’s online access for the company they belong to', async () => {
    await access().setUserAccess('u1', { companyId: 5, allowed: true })
    expect(api.put).toHaveBeenCalledWith('/api/admin/users/u1/access', { company_id: 5, allowed_online_access: true })
  })

  it('sets online access for several users at once', async () => {
    await access().setBulkAccess(['u1', 'u2'], false)
    expect(api.put).toHaveBeenCalledWith('/api/admin/users/bulk-access', { user_ids: ['u1', 'u2'], allowed_online_access: false })
  })

  it('updates a user’s details, naming their company', async () => {
    await access().updateTenantUser('u1', 5, { lname: 'Mensah', tel: '0244111222' })
    expect(api.put).toHaveBeenCalledWith('/api/admin/users/u1', { company_id: 5, lname: 'Mensah', tel: '0244111222' })
  })
})

describe('company users service', () => {
  const users = () => createCompanyUsersService(asApi, () => ({ 'x-company-domain': 'kofi' }))
  const headers = { 'x-company-domain': 'kofi' }

  it('lists the staff, sent with the company headers', async () => {
    await users().listUsers()
    expect(api.request).toHaveBeenCalledWith('/api/company/users/access', { headers })
  })

  it('hands back exactly what the server sent', async () => {
    api.request.mockResolvedValue({ success: true, data: { users: [{ id: 3 }] } })
    await expect(users().listUsers()).resolves.toEqual({ success: true, data: { users: [{ id: 3 }] } })
  })

  it('sets a member of staff’s role', async () => {
    await users().setRole(3, 'pharmacist')
    expect(api.request).toHaveBeenCalledWith('/api/company/users/3/role', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userrole: 'pharmacist' }),
    })
  })

  it('sets a member of staff’s online access', async () => {
    await users().setAccess(3, true)
    expect(api.request).toHaveBeenCalledWith('/api/company/users/3/access', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowed_online_access: true }),
    })
  })
})
