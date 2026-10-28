interface OutreachItem {
  id?: number | string
  product_name?: string | null
  source_pharmacy_id?: number | string | null
}

interface OutreachPharmacy {
  pharmacy_id?: number | string | null
  pharmacy_name?: string | null
  queue_state?: string | null
}

export interface PendingPharmacy {
  pharmacy_id: number
  pharmacy_name: string
  state: string
  item_names: string[]
}

// An order split across pharmacies at composing only advances once each of them has confirmed,
// so list the ones still outstanding (with their items) for the outreach board to call out.
export const pendingComposedPharmacies = (
  items: OutreachItem[],
  queue: OutreachPharmacy[]
): PendingPharmacy[] => {
  const byPharmacy = new Map<number, string[]>()
  for (const item of items) {
    const id = Number(item.source_pharmacy_id || 0)
    if (id <= 0) continue
    byPharmacy.set(id, [...(byPharmacy.get(id) || []), item.product_name || `Item ${item.id}`])
  }
  const pending: PendingPharmacy[] = []
  for (const [id, itemNames] of byPharmacy) {
    const entry = queue.find((p) => Number(p.pharmacy_id) === id)
    const state = entry?.queue_state || 'not_contacted'
    if (state === 'full') continue
    pending.push({ pharmacy_id: id, pharmacy_name: entry?.pharmacy_name || `Pharmacy ${id}`, state, item_names: itemNames })
  }
  return pending
}
