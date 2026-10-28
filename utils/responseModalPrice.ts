interface ResponseItem {
  item_id?: number | string
  available?: boolean
  unit_price?: number | string | null
}

// The server only moves an order to payment once every item has a price, and it stays
// silent when one is missing, so the response form must not accept an unpriced item.
export const availableItemsMissingPrice = <T extends ResponseItem>(items: T[]): T[] =>
  items.filter((i) => i.available && !(Number(i.unit_price) > 0))
