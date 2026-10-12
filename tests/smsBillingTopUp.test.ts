import { describe, expect, it, vi } from 'vitest'
import { createBillingService } from '../services/sms/billingService'

const apiWith = () => ({ get: vi.fn(), post: vi.fn().mockResolvedValue({ success: true }), put: vi.fn(), delete: vi.fn() })

describe('admin top-up requests', () => {
  it('sends the idempotency key as a header with a money top-up', async () => {
    const api = apiWith()
    await createBillingService(api as never).topUpMoney({ company_id: 4, amount: 10 }, { idempotencyKey: 'key-0123456789' })
    expect(api.post).toHaveBeenCalledWith(
      '/api/sms-credits/admin/topup-money',
      { company_id: 4, amount: 10 },
      { headers: { 'Idempotency-Key': 'key-0123456789' } },
    )
  })

  it('sends no extra headers when no key is given', async () => {
    const api = apiWith()
    await createBillingService(api as never).topUpMoney({ company_id: 4, amount: 10 })
    expect(api.post).toHaveBeenCalledWith('/api/sms-credits/admin/topup-money', { company_id: 4, amount: 10 }, undefined)
  })

  it('tops up SMS credits on the route the backend serves', async () => {
    const api = apiWith()
    await createBillingService(api as never).topUpCredits({ company_id: 4, sms_count: 50 }, { idempotencyKey: 'key-0123456789' })
    expect(api.post).toHaveBeenCalledWith(
      '/api/sms-credits/admin/topup-sms',
      { company_id: 4, sms_count: 50 },
      { headers: { 'Idempotency-Key': 'key-0123456789' } },
    )
  })
})
