import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const orders = vi.hoisted(() => ({ cancel: vi.fn() }))
vi.mock('~/services/orders/ordersService', () => ({ createOrdersService: () => orders }))
vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => ({}) }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => ({ currentPharmacy: 12 }) }))
vi.stubGlobal('useApi', () => ({}))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.mock('~/composables/usePushNotifications', () => ({ releaseThisPhone: vi.fn(), realPushBrowser: () => ({}) }))

;(process as unknown as { client: boolean }).client = true

import { useUserStore } from '../stores/user'

const signedIn = () => {
  const store = useUserStore()
  store.customerAuthToken = 'tok'
  store.masterCustomer = { id: 1 } as never
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  orders.cancel.mockResolvedValue({ success: true })
})

describe('cancelling an order from the store', () => {
  it('sends the reason as a reason and keeps the company as the active pharmacy', async () => {
    await signedIn().cancelOrder('ORD-1', null, 'Taking too long')

    expect(orders.cancel).toHaveBeenCalledWith('ORD-1', { companyId: 12, reason: 'Taking too long' })
  })

  it('still uses the company it is given, and sends no reason when none was chosen', async () => {
    await signedIn().cancelOrder('ORD-1', 99)

    expect(orders.cancel).toHaveBeenCalledWith('ORD-1', { companyId: 99 })
  })
})

describe('the orders service cancel call', () => {
  it('puts the company and the reason in the body', async () => {
    const put = vi.fn().mockResolvedValue({ success: true })
    const real = await vi.importActual<typeof import('../services/orders/ordersService')>('../services/orders/ordersService')
    await real.createOrdersService({ put } as never).cancel('ORD-1', { companyId: 12, reason: 'Moving abroad' })

    expect(put).toHaveBeenCalledWith('/api/orders/ORD-1/cancel', { company_id: 12, reason: 'Moving abroad' })
  })
})
