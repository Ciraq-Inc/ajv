import { describe, expect, it, vi } from 'vitest'
import { createCustomerAuthService } from '../services/customerAuth/customerAuthService'

const make = () => {
  const api = {
    get: vi.fn().mockResolvedValue({ success: true }),
    post: vi.fn(),
    put: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn(),
  }
  return { api, service: createCustomerAuthService(api as never) }
}

describe('customer auth service: notification preferences', () => {
  it('reads the preferences from the customer endpoint', async () => {
    const { api, service } = make()
    await service.getNotificationPreferences()
    expect(api.get).toHaveBeenCalledWith('/api/auth/customer/notification-preferences')
  })

  it('saves only the categories it is given, under the API field name', async () => {
    const { api, service } = make()
    await service.updateNotificationPreferences({ order_progress: { sms: false } })
    expect(api.put).toHaveBeenCalledWith('/api/auth/customer/notification-preferences', {
      categories: { order_progress: { sms: false } },
    })
  })
})
