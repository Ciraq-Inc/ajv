import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The one boundary is the HTTP call. Each request is recorded here as { method, url, body, domain }.
type Sent = { method: string; url: string; body?: unknown; domain?: string }
const net = vi.hoisted(() => {
  const seen: Sent[] = []
  let respond: (sent: Sent) => unknown = () => ({ success: true, data: [] })
  const record = async (url: string, method: string, body: unknown, headers?: Record<string, string>) => {
    const sent: Sent = { method, url }
    if (body !== undefined && body !== null) sent.body = typeof body === 'string' ? JSON.parse(body) : body
    if (headers?.['x-company-domain']) sent.domain = headers['x-company-domain']
    seen.push(sent)
    const out = respond(sent)
    if (out instanceof Error) throw out
    return out
  }
  const request = (url: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
    record(url, options.method ?? 'GET', options.body, options.headers)
  return {
    seen,
    request,
    api: {
      request,
      get: (url: string, options?: { headers?: Record<string, string> }) => record(url, 'GET', undefined, options?.headers),
      post: (url: string, data?: unknown, options?: { headers?: Record<string, string> }) => record(url, 'POST', data, options?.headers),
      put: (url: string, data?: unknown, options?: { headers?: Record<string, string> }) => record(url, 'PUT', data, options?.headers),
      delete: (url: string, options?: { headers?: Record<string, string> }) => record(url, 'DELETE', undefined, options?.headers),
    },
    serve: (fn: (sent: Sent) => unknown) => { respond = fn },
  }
})

const session = vi.hoisted(() => ({ token: 'admin-token' as string | null, logout: vi.fn(), userRole: 'manager' }))
vi.stubGlobal('useApi', () => net.api)
vi.mock('~/stores/admin', () => ({
  useAdminStore: () => ({
    get token() { return session.token },
    logout: session.logout,
  }),
}))
vi.mock('~/stores/company', () => ({
  useCompanyStore: () => ({
    get userRole() { return session.userRole },
    getApiHeaders: () => ({ 'x-company-domain': 'kofi' }),
  }),
}))

import CompanyAccess from '~/components/access/companyAccessMgt.vue'
import TenantUsers from '~/components/access/multiTenantUserAccess.vue'
import CompanyUsers from '~/components/access/companyUserAccess.vue'

const open = async (component: object) => {
  const wrapper = mount(component, { global: { stubs: { NuxtLink: { template: '<a><slot /></a>' }, Teleport: true } } })
  await flushPromises()
  return wrapper
}
const button = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find((b) => b.text().includes(text))!
const sent = () => net.seen.map((s) => `${s.method} ${s.url}`)

beforeEach(() => {
  vi.clearAllMocks()
  net.seen.length = 0
  session.token = 'admin-token'
  session.userRole = 'manager'
  net.serve(() => ({ success: true, data: [] }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('alert', vi.fn())
  vi.stubGlobal('confirm', vi.fn(() => true))
})

describe('platform admin: API keys', () => {
  const key = { id: 8, key_name: 'Nightly sync', api_key: 'masked', is_active: true, created_at: '2026-09-01T10:00:00Z' }
  beforeEach(() => {
    net.serve(({ method, url }) => {
      if (url === '/api/companies') return { success: true, data: [{ id: 5, name: 'Kofi Pharmacy', location: 'Osu' }] }
      if (url.endsWith('/api-keys/stats')) return { success: true, data: { total: 1, active: 1 } }
      if (url.endsWith('/reveal')) return { success: true, data: { api_key: 'rgl_live_secret' } }
      if (url.endsWith('/api-keys') && method === 'POST') return { success: true, data: { api_key: 'rgl_live_new', key_name: 'CI', created_at: '2026-10-12' } }
      if (url.includes('/api-keys')) return { success: true, data: [key] }
      return { success: true }
    })
  })

  const pickCompany = async (wrapper: ReturnType<typeof mount>) => {
    await wrapper.find('.search-input-wrapper').trigger('click')
    await wrapper.find('.dropdown-item').trigger('click')
    await flushPromises()
  }

  it('lists the companies when it opens', async () => {
    const wrapper = await open(CompanyAccess)
    expect(sent()).toEqual(['GET /api/companies'])
    await wrapper.find('.search-input-wrapper').trigger('click')
    expect(wrapper.text()).toContain('Kofi Pharmacy')
  })

  it('loads the keys and their stats for the company that is picked', async () => {
    const wrapper = await open(CompanyAccess)
    net.seen.length = 0
    await pickCompany(wrapper)
    expect(sent()).toEqual(['GET /api/companies/5/api-keys', 'GET /api/companies/5/api-keys/stats'])
    expect(wrapper.text()).toContain('Nightly sync')
  })

  it('shows why the keys could not be loaded', async () => {
    net.serve(({ url }) => (url.includes('/api-keys') ? new Error('Keys unavailable') : { success: true, data: [{ id: 5, name: 'Kofi Pharmacy' }] }))
    const wrapper = await open(CompanyAccess)
    await pickCompany(wrapper)
    expect(wrapper.text()).toContain('Keys unavailable')
  })

  it('creates a key with the name and expiry typed in, and shows the new key once', async () => {
    const wrapper = await open(CompanyAccess)
    await pickCompany(wrapper)
    await button(wrapper, 'Generate').trigger('click')
    const inputs = wrapper.find('form').findAll('input')
    await inputs[0]!.setValue('CI')
    await inputs[1]!.setValue('2027-01-01')
    net.seen.length = 0
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(net.seen).toEqual([{ method: 'POST', url: '/api/companies/5/api-keys', body: { key_name: 'CI', expires_at: '2027-01-01' } }])
    expect(wrapper.text()).toContain('rgl_live_new')
  })

  it('leaves the expiry out when none is chosen', async () => {
    const wrapper = await open(CompanyAccess)
    await pickCompany(wrapper)
    await button(wrapper, 'Generate').trigger('click')
    await wrapper.find('form').findAll('input')[0]!.setValue('CI')
    net.seen.length = 0
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(net.seen[0]!.body).toEqual({ key_name: 'CI' })
  })

  it('tells the admin when the server refuses a new key', async () => {
    net.serve(({ method, url }) => {
      if (url === '/api/companies') return { success: true, data: [{ id: 5, name: 'Kofi Pharmacy' }] }
      if (method === 'POST') return { success: false, message: 'Key limit reached' }
      return { success: true, data: [] }
    })
    const wrapper = await open(CompanyAccess)
    await pickCompany(wrapper)
    await button(wrapper, 'Generate').trigger('click')
    await wrapper.find('form').findAll('input')[0]!.setValue('CI')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(alert).toHaveBeenCalledWith('Key limit reached')
  })

  it('deactivates a key only after a confirmation, then reloads the keys', async () => {
    const wrapper = await open(CompanyAccess)
    await pickCompany(wrapper)
    net.seen.length = 0
    await wrapper.find('button[title="Deactivate"]').trigger('click')
    expect(net.seen).toEqual([])
    await button(wrapper, 'Deactivate').trigger('click')
    await flushPromises()
    expect(sent()[0]).toBe('DELETE /api/companies/5/api-keys/8')
    expect(sent()).toContain('GET /api/companies/5/api-keys')
    expect(alert).toHaveBeenCalledWith('API key deactivated successfully!')
  })

  it('reveals a key once, copies it, and does not ask the server again', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const wrapper = await open(CompanyAccess)
    await pickCompany(wrapper)
    net.seen.length = 0
    await wrapper.find('.copy-btn').trigger('click')
    await flushPromises()
    expect(sent()).toEqual(['GET /api/companies/5/api-keys/8/reveal'])
    expect(writeText).toHaveBeenCalledWith('rgl_live_secret')
    await wrapper.find('.copy-btn').trigger('click')
    await flushPromises()
    expect(sent()).toHaveLength(1)
  })

  it('sends nothing when the admin is signed out, and says so', async () => {
    session.token = null
    const wrapper = await open(CompanyAccess)
    expect(net.seen).toEqual([])
    expect(console.error).toHaveBeenCalled()
    expect(wrapper.exists()).toBe(true)
  })

  it('signs the admin out when the server says the session has expired', async () => {
    net.serve(() => Object.assign(new Error('Unauthorized'), { status: 401 }))
    await open(CompanyAccess)
    expect(session.logout).toHaveBeenCalled()
  })
})

describe('platform admin: online access across pharmacies', () => {
  const newAma = () => ({ id: 'u1', company_id: 5, company_name: 'Kofi Pharmacy', lname: 'Mensah', sname: 'Ama', userrole: 'manager', isactive: true, allowed_online_access: false })
  beforeEach(() => {
    net.serve(({ method, url }) => {
      if (url === '/api/admin/users/access') return { success: true, data: { users: [newAma()], stats: { total: 1, with_access: 0, without_access: 1, companies: 1 } } }
      if (url === '/api/companies') return { success: true, data: [{ id: 5, name: 'Kofi Pharmacy' }] }
      if (url === '/api/admin/users/bulk-access') return { success: true, data: { updated: 1 } }
      if (method === 'PUT') return { success: true }
      return { success: true, data: [] }
    })
  })

  it('loads the users and the companies when it opens, and lists the users', async () => {
    const wrapper = await open(TenantUsers)
    expect([...sent()].sort()).toEqual(['GET /api/admin/users/access', 'GET /api/companies'])
    expect(wrapper.text()).toContain('Mensah')
  })

  it('shows why the users could not be loaded', async () => {
    net.serve(({ url }) => (url === '/api/admin/users/access' ? { success: false, message: 'Not allowed' } : { success: true, data: [] }))
    const wrapper = await open(TenantUsers)
    expect(wrapper.text()).toContain('Not allowed')
  })

  it('turns online access on for one user, naming the pharmacy they belong to', async () => {
    const wrapper = await open(TenantUsers)
    net.seen.length = 0
    await wrapper.find('.access-toggle input').trigger('change')
    await flushPromises()
    expect(net.seen).toEqual([{ method: 'PUT', url: '/api/admin/users/u1/access', body: { company_id: 5, allowed_online_access: true } }])
  })

  it('tells the admin when the server refuses the change', async () => {
    net.serve(({ method, url }) => {
      if (url === '/api/admin/users/access') return { success: true, data: { users: [newAma()], stats: {} } }
      if (method === 'PUT') return { success: false, message: 'Owner cannot be changed' }
      return { success: true, data: [] }
    })
    const wrapper = await open(TenantUsers)
    await wrapper.find('.access-toggle input').trigger('change')
    await flushPromises()
    expect(alert).toHaveBeenCalledWith('Owner cannot be changed')
  })

  it('enables access for the selected users in one request, then reloads', async () => {
    const wrapper = await open(TenantUsers)
    await wrapper.find('tbody input[type="checkbox"]').setValue(true)
    net.seen.length = 0
    await button(wrapper, 'Enable Access').trigger('click')
    await flushPromises()
    expect(net.seen[0]).toEqual({ method: 'PUT', url: '/api/admin/users/bulk-access', body: { user_ids: ['u1'], allowed_online_access: true } })
    expect(sent()).toContain('GET /api/admin/users/access')
    expect(alert).toHaveBeenCalledWith('Successfully enabled access for 1 users')
  })

  it('disables access for the selected users, and sends nothing when the admin backs out', async () => {
    const wrapper = await open(TenantUsers)
    await wrapper.find('tbody input[type="checkbox"]').setValue(true)
    net.seen.length = 0
    vi.stubGlobal('confirm', vi.fn(() => false))
    await button(wrapper, 'Disable Access').trigger('click')
    await flushPromises()
    expect(net.seen).toEqual([])
    vi.stubGlobal('confirm', vi.fn(() => true))
    await button(wrapper, 'Disable Access').trigger('click')
    await flushPromises()
    expect(net.seen[0]).toEqual({ method: 'PUT', url: '/api/admin/users/bulk-access', body: { user_ids: ['u1'], allowed_online_access: false } })
  })

  it('saves an edited user with their company id and the form', async () => {
    const wrapper = await open(TenantUsers)
    await wrapper.find('button[title="Edit User"]').trigger('click')
    await wrapper.find('form input[placeholder="e.g. 0244123456"]').setValue('0244111222')
    net.seen.length = 0
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(net.seen).toEqual([{
      method: 'PUT',
      url: '/api/admin/users/u1',
      body: { company_id: 5, lname: 'Mensah', sname: 'Ama', mname: '', email: '', tel: '0244111222', userrole: 'manager', isactive: true },
    }])
  })

  it('shows the server’s message when an edit is refused', async () => {
    net.serve(({ method, url }) => {
      if (url === '/api/admin/users/access') return { success: true, data: { users: [newAma()], stats: {} } }
      if (method === 'PUT') return { success: false, message: 'Phone already in use' }
      return { success: true, data: [] }
    })
    const wrapper = await open(TenantUsers)
    await wrapper.find('button[title="Edit User"]').trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Phone already in use')
  })

  it('sends nothing when the admin is signed out', async () => {
    session.token = null
    const wrapper = await open(TenantUsers)
    expect(net.seen).toEqual([])
    expect(wrapper.text()).toContain('No authentication token available')
  })

  it('signs the admin out when the server says the session has expired', async () => {
    net.serve(() => Object.assign(new Error('Unauthorized'), { status: 401 }))
    const wrapper = await open(TenantUsers)
    expect(session.logout).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Session expired. Please login again.')
  })
})

describe('pharmacy portal: staff access', () => {
  const newKojo = () => ({ id: 3, lname: 'Asare', sname: 'Kojo', userrole: 'cashier', isactive: true, allowed_online_access: false, password_hash: 'x' })
  beforeEach(() => {
    net.serve(({ method }) => (method === 'GET' ? { success: true, data: { users: [newKojo()] } } : { success: true }))
  })

  it('lists the pharmacy’s staff, sent with the company headers', async () => {
    const wrapper = await open(CompanyUsers)
    expect(net.seen).toEqual([{ method: 'GET', url: '/api/company/users/access', domain: 'kofi' }])
    expect(wrapper.text()).toContain('Asare')
  })

  it('asks for nothing when the signed-in user is below manager', async () => {
    session.userRole = 'cashier'
    const wrapper = await open(CompanyUsers)
    expect(net.seen).toEqual([])
    expect(wrapper.find('.table-container').exists()).toBe(false)
  })

  it('shows why the staff could not be loaded', async () => {
    net.serve(() => ({ success: false, message: 'Staff list unavailable' }))
    const wrapper = await open(CompanyUsers)
    expect(wrapper.text()).toContain('Staff list unavailable')
  })

  it('saves a new role for a member of staff', async () => {
    const wrapper = await open(CompanyUsers)
    const select = wrapper.find('select.role-select')
    ;(select.findAll('option').find((o) => o.element.value === 'pharmacist')!.element as HTMLOptionElement).selected = true
    await select.trigger('change')
    net.seen.length = 0
    await wrapper.find('.btn-role-save').trigger('click')
    await flushPromises()
    expect(net.seen).toEqual([{ method: 'PUT', url: '/api/company/users/3/role', body: { userrole: 'pharmacist' }, domain: 'kofi' }])
  })

  it('puts the role back and says why when the server refuses it', async () => {
    net.serve(({ method }) => (method === 'GET' ? { success: true, data: { users: [newKojo()] } } : { success: false, message: 'Cannot change this role' }))
    const wrapper = await open(CompanyUsers)
    const select = wrapper.find('select.role-select')
    ;(select.findAll('option').find((o) => o.element.value === 'pharmacist')!.element as HTMLOptionElement).selected = true
    await select.trigger('change')
    await wrapper.find('.btn-role-save').trigger('click')
    await flushPromises()
    expect(alert).toHaveBeenCalledWith('Cannot change this role')
    expect((wrapper.find('select.role-select').element as HTMLSelectElement).value).toBe('cashier')
  })

  it('turns online access on for a member of staff', async () => {
    const wrapper = await open(CompanyUsers)
    net.seen.length = 0
    await wrapper.find('.access-toggle input').trigger('change')
    await flushPromises()
    expect(net.seen).toEqual([{ method: 'PUT', url: '/api/company/users/3/access', body: { allowed_online_access: true }, domain: 'kofi' }])
  })
})
