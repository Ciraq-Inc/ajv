import { describe, it, expect } from 'vitest'
import { applyFreshCatalogPrices } from '../responseModalCatalog'

const fresh = (price: number | null, syncedAt: string | null = '2026-10-28T09:00:00Z') =>
  new Map([[160, { unit_price: price, catalog_synced_at: syncedAt }]])

describe('applyFreshCatalogPrices', () => {
  it('replaces a price that is still the untouched catalog prefill', () => {
    const items = [{ item_id: 160, unit_price: '6', catalog_price: 6, is_price_from_catalog: true }]
    const [out] = applyFreshCatalogPrices(items, fresh(7.5))
    expect(out.unit_price).toBe('7.5')
    expect(out.catalog_price).toBe(7.5)
    expect(out.is_price_from_catalog).toBe(true)
    expect(out.catalog_synced_at).toBe('2026-10-28T09:00:00Z')
  })

  it('keeps a price the admin already typed but refreshes the catalog hint', () => {
    const items = [{ item_id: 160, unit_price: '8', catalog_price: 6, is_price_from_catalog: true }]
    const [out] = applyFreshCatalogPrices(items, fresh(7.5))
    expect(out.unit_price).toBe('8')
    expect(out.catalog_price).toBe(7.5)
  })

  it('keeps a saved or allocated price that did not come from the catalog', () => {
    const items = [{ item_id: 160, unit_price: '9', catalog_price: 6, is_price_from_catalog: false }]
    const [out] = applyFreshCatalogPrices(items, fresh(7.5))
    expect(out.unit_price).toBe('9')
    expect(out.catalog_price).toBe(7.5)
  })

  it('fills a blank price when the refreshed catalog now has one', () => {
    const items = [{ item_id: 160, unit_price: null, catalog_price: null, is_price_from_catalog: false }]
    const [out] = applyFreshCatalogPrices(items, fresh(7.5))
    expect(out.unit_price).toBe('7.5')
    expect(out.is_price_from_catalog).toBe(true)
  })

  it('clears an untouched catalog price that no longer exists', () => {
    const items = [{ item_id: 160, unit_price: '6', catalog_price: 6, is_price_from_catalog: true }]
    const [out] = applyFreshCatalogPrices(items, fresh(null))
    expect(out.unit_price).toBeNull()
    expect(out.catalog_price).toBeNull()
    expect(out.is_price_from_catalog).toBe(false)
  })

  it('leaves items with no refreshed entry exactly as they were', () => {
    const items = [{ item_id: 161, unit_price: '3', catalog_price: 3, is_price_from_catalog: true }]
    expect(applyFreshCatalogPrices(items, fresh(7.5))).toEqual(items)
  })
})
