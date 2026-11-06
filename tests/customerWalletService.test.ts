import { describe, expect, it, vi } from 'vitest'
import { createCustomerWalletService } from '~/services/customerWallet/customerWalletService'
import type { ApiInstance } from '~/services/types'

describe('customer wallet service', () => {
  it('routes wallet reads and top-up creation through the API client', async () => {
    const api = {
      get: vi.fn().mockResolvedValue({ success: true, data: {} }),
      post: vi.fn().mockResolvedValue({ success: true, data: {} }),
    } as unknown as ApiInstance
    const wallet = createCustomerWalletService(api)

    await wallet.getBalance()
    await wallet.getTransactions()
    await wallet.initiateTopUp({ amount: 25 })

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/wallet')
    expect(api.get).toHaveBeenNthCalledWith(2, '/api/wallet/transactions')
    expect(api.post).toHaveBeenCalledWith('/api/wallet/topup', { amount: 25 })
  })

  it('keeps a transaction reference in one URL path segment', async () => {
    const api = { get: vi.fn().mockResolvedValue({ success: true, data: {} }) } as unknown as ApiInstance
    const wallet = createCustomerWalletService(api)

    await wallet.verifyTopUp('ref/with ?reserved#chars')

    expect(api.get).toHaveBeenCalledWith('/api/wallet/topup/verify/ref%2Fwith%20%3Freserved%23chars')
  })
})
