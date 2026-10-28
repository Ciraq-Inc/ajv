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

describe('customer auth service: push subscriptions', () => {
  it('reads the server public key from the customer endpoint', async () => {
    const { api, service } = make()
    api.get.mockResolvedValue({ success: true, data: { public_key: 'BKey' } })
    const result = await service.getPushPublicKey()
    expect(api.get).toHaveBeenCalledWith('/api/auth/customer/push/public-key')
    expect(result.data.public_key).toBe('BKey')
  })

  it('sends the browser subscription as the API expects it', async () => {
    const { api, service } = make()
    api.post.mockResolvedValue({ success: true })
    await service.subscribePush({ endpoint: 'https://push.example/1', keys: { p256dh: 'k', auth: 'a' } })
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/push/subscriptions', {
      endpoint: 'https://push.example/1',
      keys: { p256dh: 'k', auth: 'a' },
    })
  })

  it('removes a subscription by endpoint', async () => {
    const { api, service } = make()
    api.delete.mockResolvedValue({ success: true })
    await service.unsubscribePush('https://push.example/1')
    expect(api.delete).toHaveBeenCalledWith('/api/auth/customer/push/subscriptions', {
      body: JSON.stringify({ endpoint: 'https://push.example/1' }),
    })
  })
})
