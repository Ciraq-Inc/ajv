import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP layer is the boundary. The page is driven through the pharmacy list and its Export button.
const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))

import PharmacyLedgerPage from '~/pages/admin/fulfillment/pharmacy-ledger.vue'

const pharmacies = [
  { pharmacy_id: 1, pharmacy_name: 'Kofi Pharmacy', transaction_count: 3, total_earned: 30 },
  { pharmacy_id: 2, pharmacy_name: 'Ama Pharmacy', transaction_count: 1, total_earned: 10 },
]
const tx = (id: number, extra = {}) => ({
  transaction_id: id, transaction_date: '2026-10-01T10:00:00Z', request_number: `REQ-${id}`,
  customer_name: 'Yaw', product_name: `Product ${id}`, quantity: 1, request_status: 'paid', amount: 10, ...extra,
})
const ledgerFor = (pharmacyId: number, transactions: object[]) => ({
  success: true,
  data: {
    summary: {},
    pharmacies,
    selected_pharmacy: pharmacies.find((p) => p.pharmacy_id === pharmacyId),
    transactions,
  },
})

const mountPage = async () => {
  const wrapper = mount(PharmacyLedgerPage, { global: { stubs: { Teleport: true } } })
  await flushPromises()
  return wrapper
}
const pharmacyButton = (wrapper: ReturnType<typeof mount>, name: string) =>
  wrapper.findAll('.pharmacy-list-item').find((b) => b.text().includes(name))!
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('admin pharmacy ledger: switching pharmacy', () => {
  it('shows the pharmacy that was clicked last, even when an earlier request answers later', async () => {
    http.get.mockResolvedValueOnce(ledgerFor(1, [tx(1, { product_name: 'Kofi item' })]))
    const wrapper = await mountPage()

    const slowAma = deferred<unknown>()
    const fastKofi = deferred<unknown>()
    http.get.mockReturnValueOnce(slowAma.promise).mockReturnValueOnce(fastKofi.promise)
    await pharmacyButton(wrapper, 'Ama').trigger('click')
    await pharmacyButton(wrapper, 'Kofi').trigger('click')
    fastKofi.resolve(ledgerFor(1, [tx(1, { product_name: 'Kofi item' })]))
    await flushPromises()
    slowAma.resolve(ledgerFor(2, [tx(2, { product_name: 'Ama item' })]))
    await flushPromises()

    expect(wrapper.text()).toContain('Kofi item')
    expect(wrapper.text()).not.toContain('Ama item')
  })
})

describe('admin pharmacy ledger: export', () => {
  let created: Blob[]
  beforeEach(() => {
    created = []
    URL.createObjectURL = vi.fn((blob: Blob) => { created.push(blob); return 'blob:ledger' })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  const exportButton = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('button').find((b) => b.text().includes('Export CSV'))!

  it('downloads every line for the pharmacy, not just the page on screen', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => tx(i + 1))
    const page2 = [tx(101), tx(102)]
    http.get.mockResolvedValueOnce(ledgerFor(1, page1.slice(0, 50)))
    const wrapper = await mountPage()
    http.get.mockResolvedValueOnce(ledgerFor(1, page1)).mockResolvedValueOnce(ledgerFor(1, page2))

    await exportButton(wrapper).trigger('click')
    await flushPromises()

    expect(created).toHaveLength(1)
    const text = await created[0]!.text()
    const lines = text.trim().split('\r\n')
    expect(lines[0]).toBe('Date,Request,Customer,Product,Qty,Status,Amount')
    expect(lines).toHaveLength(1 + 102)
    const urls = http.get.mock.calls.map((c) => String(c[0]))
    expect(urls.some((u) => u.includes('offset=100'))).toBe(true)
  })

  it('says so when the export fails, and downloads nothing', async () => {
    http.get.mockResolvedValueOnce(ledgerFor(1, [tx(1)]))
    const wrapper = await mountPage()
    http.get.mockRejectedValue(new Error('Network down'))

    await exportButton(wrapper).trigger('click')
    await flushPromises()

    expect(created).toHaveLength(0)
    expect(wrapper.find('.ledger-error').text()).toContain('Network down')
  })
})
