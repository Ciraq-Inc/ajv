interface CatalogPriceItem {
  item_id?: number | string
  unit_price?: number | string | null
  catalog_price?: number | null
  catalog_synced_at?: string | null
  is_price_from_catalog?: boolean
}

export interface FreshCatalogPrice {
  unit_price: number | null
  catalog_synced_at: string | null
}

const isBlank = (value: unknown) => value == null || String(value).trim() === ''

// The response modal opens straight from the queue already on screen, then the queue is refreshed
// in the background. Bring in the refreshed catalog prices without overwriting anything the admin
// typed, or a price saved earlier: only a price that is still the untouched prefill is replaced.
export const applyFreshCatalogPrices = <T extends CatalogPriceItem>(
  items: T[],
  fresh: Map<number, FreshCatalogPrice>
): T[] =>
  items.map((item) => {
    const entry = fresh.get(Number(item.item_id))
    if (!entry) return item
    const freshPrice = entry.unit_price != null && Number(entry.unit_price) > 0 ? Number(entry.unit_price) : null
    const untouched =
      (item.is_price_from_catalog === true && String(item.unit_price ?? '') === String(item.catalog_price ?? '')) ||
      (isBlank(item.unit_price) && item.catalog_price == null)
    return {
      ...item,
      catalog_price: freshPrice,
      catalog_synced_at: entry.catalog_synced_at,
      ...(untouched
        ? { unit_price: freshPrice != null ? String(freshPrice) : null, is_price_from_catalog: freshPrice != null }
        : {})
    }
  })
