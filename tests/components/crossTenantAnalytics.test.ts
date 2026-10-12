import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The one boundary is the HTTP call. Whether a component reaches the server through the admin
// store's generic helper or through a service, the request is recorded here as "path?sorted=query".
const net = vi.hoisted(() => {
  const seen: string[] = []
  let respond: (url: string) => unknown = () => ({ success: true, data: [] })
  const normalise = (target: string, params?: Record<string, unknown>) => {
    const [path, query = ''] = target.split('?')
    const q = new URLSearchParams(query)
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
    q.sort()
    const s = q.toString()
    return s ? `${path}?${s}` : String(path)
  }
  const call = async (target: string, options?: { params?: Record<string, unknown> }) => {
    const url = normalise(target, options?.params)
    seen.push(url)
    const out = respond(url)
    if (out instanceof Error) throw out
    return out
  }
  return { seen, call, serve: (fn: (url: string) => unknown) => { respond = fn } }
})

const admin = vi.hoisted(() => ({ token: 'admin-token' as string | null, logout: vi.fn() }))
vi.stubGlobal('useApi', () => ({ request: net.call, get: net.call, getBlob: vi.fn(async () => new Blob(['a,b'])) }))
vi.mock('~/stores/admin', () => ({
  useAdminStore: () => ({
    get token() { return admin.token },
    logout: admin.logout,
    makeAuthRequest: (url: string, options?: unknown) => net.call(url, options as undefined),
  }),
}))

import Customers from '~/components/analytics/customers.vue'
import Users from '~/components/analytics/users.vue'
import InsurancePayers from '~/components/analytics/insurance-payers.vue'
import ExtendedSync from '~/components/analytics/extended-sync-data.vue'
import PurchaseReports from '~/components/analytics/purchase-reports.vue'
import SalesReports from '~/components/analytics/sales-reports.vue'
import Inventory from '~/components/analytics/inventory.vue'
import ProductsTable from '~/components/analytics/ProductsTable.vue'

const stubs = { NuxtLink: { template: '<a><slot /></a>' }, Teleport: true, ProductsTable: true }
const open = async (component: object, props: Record<string, unknown> = {}) => {
  const wrapper = mount(component, { props, global: { stubs } })
  await flushPromises()
  return wrapper
}
const button = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find((b) => b.text().includes(text))!

beforeEach(() => {
  vi.clearAllMocks()
  net.seen.length = 0
  admin.token = 'admin-token'
  net.serve(() => ({ success: true, data: [] }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('alert', vi.fn())
  window.URL.createObjectURL = vi.fn(() => 'blob:x')
  window.URL.revokeObjectURL = vi.fn()
})

describe.each([
  ['customers', Customers, 'customers', { company_name: 'Ama Pharmacy', total_customers: 12, active_customers: 9 }],
  ['users', Users, 'users', { company_name: 'Ama Pharmacy', total_users: 12, active_users: 9 }],
  ['insurance payers', InsurancePayers, 'insurance-payers', { company_name: 'Ama Pharmacy', total_payers: 12, total_clients: 9 }],
] as const)('%s roll-up', (_label, component, entity, summaryRow) => {
  it('loads the summary and the list when it opens, and shows the summary', async () => {
    net.serve((url) => (url.endsWith('/summary') ? { success: true, data: [summaryRow] } : { success: true, data: [] }))
    const wrapper = await open(component)
    expect([...net.seen].sort()).toEqual([`/api/${entity}/cross-tenant/dataview`, `/api/${entity}/cross-tenant/summary`])
    expect(wrapper.text()).toContain('Ama Pharmacy')
  })

  it('shows the failure, and does not break, when the list cannot be loaded', async () => {
    net.serve((url) => (url.endsWith('/dataview') ? new Error('Gateway timeout') : { success: true, data: [] }))
    const wrapper = await open(component)
    expect(wrapper.text()).toContain('Gateway timeout')
  })

  it('downloads the JSON export', async () => {
    net.serve(() => ({ success: true, data: [{ id: 1 }] }))
    const wrapper = await open(component)
    net.seen.length = 0
    await button(wrapper, 'JSON').trigger('click')
    await flushPromises()
    expect(net.seen).toEqual([`/api/${entity}/cross-tenant/export?format=json`])
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('says so, and downloads nothing, when the export is empty', async () => {
    const wrapper = await open(component)
    net.serve(() => ({ success: false }))
    await button(wrapper, 'JSON').trigger('click')
    await flushPromises()
    expect(window.URL.createObjectURL).not.toHaveBeenCalled()
    expect(alert).toHaveBeenCalled()
  })
})

describe('an admin session', () => {
  it('that has ended sends nothing and says so', async () => {
    admin.token = null
    const wrapper = await open(Customers)
    expect(net.seen).toEqual([])
    expect(wrapper.text()).toContain('No authentication token available')
  })

  it('that the server refuses is signed out', async () => {
    net.serve(() => Object.assign(new Error('Unauthorized'), { status: 401 }))
    const wrapper = await open(Customers)
    expect(admin.logout).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Session expired. Please login again.')
  })
})

describe('extended sync data', () => {
  it('loads the chosen entity for the dates and company ids typed in', async () => {
    net.serve(() => ({ success: true, data: [{ company_name: 'Kofi Pharmacy', record_count: 4, last_synced_at: '2026-10-01T10:00:00Z' }] }))
    const wrapper = await open(ExtendedSync, { entity: 'expenses' })
    expect(net.seen).toHaveLength(1)
    expect(net.seen[0]).toMatch(/^\/api\/reports\/cross-tenant\/extended-sync\/expenses\?end_date=\d{4}-\d{2}-\d{2}&start_date=\d{4}-\d{2}-\d{2}$/)
    expect(wrapper.text()).toContain('Kofi Pharmacy')

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('2026-01-01')
    await inputs[1]!.setValue('2026-01-31')
    await inputs[2]!.setValue(' 4,7 ')
    net.seen.length = 0
    await button(wrapper, 'Load').trigger('click')
    await flushPromises()
    expect(net.seen).toEqual(['/api/reports/cross-tenant/extended-sync/expenses?company_ids=4%2C7&end_date=2026-01-31&start_date=2026-01-01'])
  })

  it('shows the server message when it refuses', async () => {
    net.serve(() => ({ success: false, message: 'Not allowed' }))
    const wrapper = await open(ExtendedSync, { entity: 'expenses' })
    expect(wrapper.text()).toContain('Not allowed')
  })

  it('shows the failure when the request fails', async () => {
    net.serve(() => new Error('Network down'))
    const wrapper = await open(ExtendedSync, { entity: 'expenses' })
    expect(wrapper.text()).toContain('Network down')
  })
})

describe('purchase reports', () => {
  it('loads the summary and the sample rows when it opens', async () => {
    await open(PurchaseReports)
    expect(net.seen).toContain('/api/reports/cross-tenant/purchase-items')
    expect(net.seen).toContain('/api/reports/cross-tenant/purchase-items/dataview')
  })

})

describe('sales reports', () => {
  it('loads the summary and the company breakdown when searched', async () => {
    net.serve((url) => (url.includes('/dataview') ? { success: true, data: [{ company_id: 1, company_name: 'Esi Pharmacy', total_value: '120.5' }] } : { success: true, data: [], total_companies: 3 }))
    const wrapper = await open(SalesReports)
    expect(net.seen).toEqual([])
    await button(wrapper, 'Search').trigger('click')
    await flushPromises()
    expect(net.seen).toHaveLength(2)
    expect(net.seen.some((u) => /^\/api\/reports\/cross-tenant\/sales-items\?date_field=ddate&end_date=[\d-]+&start_date=[\d-]+$/.test(u))).toBe(true)
    expect(net.seen.some((u) => /^\/api\/reports\/cross-tenant\/sales-items\/dataview\?date_field=ddate&end_date=[\d-]+&limit=5000&start_date=[\d-]+$/.test(u))).toBe(true)
    expect(wrapper.text()).toContain('Esi Pharmacy')
  })

})

describe('inventory analytics', () => {
  const stock = { companies: [{ company_id: 1, company_name: 'Yaw Chemist' }] }
  beforeEach(() => {
    net.serve((url) => {
      if (url.includes('composite-stock-value')) return { success: true, data: stock }
      if (url.includes('/alerts')) return { success: true, data: { alerts: [] } }
      return { success: true, data: {} }
    })
  })

  it('loads the stock value and the alerts when asked, and lists the companies', async () => {
    const wrapper = await open(Inventory)
    expect(net.seen).toEqual([])
    await button(wrapper, 'Load').trigger('click')
    await flushPromises()
    expect([...net.seen].sort()).toEqual(['/api/inventory-analytics/alerts', '/api/inventory-analytics/composite-stock-value'])
    expect(wrapper.text()).toContain('Yaw Chemist')
  })

  it('shows the server message when it refuses', async () => {
    net.serve(() => ({ success: false, message: 'Analytics unavailable' }))
    const wrapper = await open(Inventory)
    await button(wrapper, 'Load').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Analytics unavailable')
  })
})

describe('products table', () => {
  const productsBody = { success: true, data: { products: [{ id: 1, product_name: 'Paracetamol 500mg', company_name: 'Yaw Chemist' }], pagination: { total: 1, limit: 25, offset: 0, has_more: false } } }
  beforeEach(() => {
    net.serve((url) => (url.startsWith('/api/companies') ? { success: true, companies: [{ id: 1, company_name: 'Yaw Chemist' }] } : productsBody))
  })

  it('loads the first page and the company picker, and lists the products', async () => {
    const wrapper = await open(ProductsTable, { autoload: true, showCompanyFilter: true })
    expect(net.seen).toContain('/api/companies')
    expect(net.seen.some((u) => u.startsWith('/api/inventory-analytics/search-products?') && u.includes('limit=') && u.includes('offset=0'))).toBe(true)
    expect(wrapper.text()).toContain('Paracetamol 500mg')
  })

  it('searches on the endpoint the page names, with the clearance filter', async () => {
    await open(ProductsTable, { autoload: true, apiEndpoint: '/api/clearance/search', clearanceOnly: true })
    const call = net.seen.find((u) => u.startsWith('/api/clearance/search?'))!
    expect(call).toContain('clearanceOnly=true')
  })

  it('empties the list, and does not throw, when the search fails', async () => {
    net.serve((url) => (url.startsWith('/api/companies') ? { success: true, companies: [] } : new Error('offline')))
    const wrapper = await open(ProductsTable, { autoload: true, showCompanyFilter: true })
    expect(wrapper.text()).not.toContain('Paracetamol')
  })
})
