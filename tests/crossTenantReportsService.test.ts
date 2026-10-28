import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiInstance } from '../services/types'
import { createCrossTenantReportsService } from '../services/analytics/crossTenantReportsService'

const get = vi.fn()
const api = { get } as unknown as ApiInstance
const reports = () => createCrossTenantReportsService(api)

beforeEach(() => { vi.clearAllMocks(); get.mockResolvedValue({ success: true, data: [] }) })

describe.each(['customers', 'users', 'insurance-payers'] as const)('%s roll-up', (entity) => {
  it('reads the per-company summary', async () => {
    await reports().getEntitySummary(entity)
    expect(get).toHaveBeenCalledWith(`/api/${entity}/cross-tenant/summary`)
  })

  it('reads the list view', async () => {
    await reports().getEntityDataview(entity)
    expect(get).toHaveBeenCalledWith(`/api/${entity}/cross-tenant/dataview`)
  })

  it('asks for the JSON export', async () => {
    await reports().exportEntityJson(entity)
    expect(get).toHaveBeenCalledWith(`/api/${entity}/cross-tenant/export`, { params: { format: 'json' } })
  })
})

it('hands back exactly what the server sent', async () => {
  get.mockResolvedValue({ success: true, data: [{ company_id: 1 }], total_companies: 4 })
  const res = await reports().getSalesSummary({})
  expect(res).toEqual({ success: true, data: [{ company_id: 1 }], total_companies: 4 })
})

describe('sales reports', () => {
  it('reads the summary with the filters in snake_case, and refresh only when asked', async () => {
    await reports().getSalesSummary({ startDate: '2026-01-01', endDate: '2026-01-31', dateField: 'sale_date', refresh: true })
    expect(get).toHaveBeenCalledWith('/api/reports/cross-tenant/sales-items', {
      params: { start_date: '2026-01-01', end_date: '2026-01-31', date_field: 'sale_date', refresh: 'true' },
    })
  })

  it('leaves out filters that were not set', async () => {
    await reports().getSalesSummary({ startDate: '' })
    expect(get).toHaveBeenCalledWith('/api/reports/cross-tenant/sales-items', { params: {} })
  })

  it('reads the company breakdown with a limit and a search', async () => {
    await reports().getSalesByCompany({ limit: 5000, startDate: '2026-01-01', search: 'ama', refresh: false })
    expect(get).toHaveBeenCalledWith('/api/reports/cross-tenant/sales-items/dataview', {
      params: { limit: 5000, start_date: '2026-01-01', search: 'ama' },
    })
  })


})

describe('purchase reports', () => {
  it('reads the summary for a date range', async () => {
    await reports().getPurchaseSummary({ startDate: '2026-02-01', endDate: '2026-02-28' })
    expect(get).toHaveBeenCalledWith('/api/reports/cross-tenant/purchase-items', {
      params: { start_date: '2026-02-01', end_date: '2026-02-28' },
    })
  })

  it('reads the sample rows', async () => {
    await reports().getPurchaseSample()
    expect(get).toHaveBeenCalledWith('/api/reports/cross-tenant/purchase-items/dataview')
  })

})

describe('extended sync data', () => {
  it('reads one entity, narrowed by date and company ids', async () => {
    await reports().getExtendedSync('invoices', { startDate: '2026-03-01', endDate: '2026-03-31', companyIds: '4,7' })
    expect(get).toHaveBeenCalledWith('/api/reports/cross-tenant/extended-sync/invoices', {
      params: { start_date: '2026-03-01', end_date: '2026-03-31', company_ids: '4,7' },
    })
  })
})

describe('inventory analytics', () => {
  it('reads the composite stock value', async () => {
    await reports().getInventoryStockValue()
    expect(get).toHaveBeenCalledWith('/api/inventory-analytics/composite-stock-value')
  })

  it('reads the alerts, filtered by type when one is chosen', async () => {
    await reports().getInventoryAlerts('expired')
    expect(get).toHaveBeenCalledWith('/api/inventory-analytics/alerts', { params: { alertType: 'expired' } })
  })

  it('reads every alert when no type is chosen', async () => {
    await reports().getInventoryAlerts('')
    expect(get).toHaveBeenCalledWith('/api/inventory-analytics/alerts', { params: {} })
  })

  it('reads the top products by metric', async () => {
    await reports().getInventoryTopProducts({ metric: 'quantity', limit: 10 })
    expect(get).toHaveBeenCalledWith('/api/inventory-analytics/top-products', { params: { metric: 'quantity', limit: 10 } })
  })

  it('reads the stock details with the stock filters', async () => {
    await reports().getInventoryProductStock({ limit: 100, offset: 200, productName: 'para', belowReorder: true, expiringSoon: true })
    expect(get).toHaveBeenCalledWith('/api/inventory-analytics/product-stock-details', {
      params: { limit: 100, offset: 200, productName: 'para', belowReorder: true, expiringSoon: true },
    })
  })

  it('searches products on the default endpoint, or on the one the page names', async () => {
    await reports().searchProducts({ limit: '25', offset: '0', search: 'para' })
    expect(get).toHaveBeenLastCalledWith('/api/inventory-analytics/search-products', { params: { limit: '25', offset: '0', search: 'para' } })
    await reports().searchProducts({ limit: '25' }, '/api/clearance/search')
    expect(get).toHaveBeenLastCalledWith('/api/clearance/search', { params: { limit: '25' } })
  })
})

describe('the company picker', () => {
  it('lists the companies', async () => {
    await reports().listCompanies()
    expect(get).toHaveBeenCalledWith('/api/companies')
  })
})
