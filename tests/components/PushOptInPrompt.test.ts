import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Boundaries: the signed-in customer, the HTTP service and the browser's push APIs.
const user = vi.hoisted(() => ({ isLoggedIn: true }))
vi.mock('~/stores/user', () => ({ useUserStore: () => user }))

const svc = vi.hoisted(() => ({ getPushPublicKey: vi.fn(), subscribePush: vi.fn(), unsubscribePush: vi.fn() }))
vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => svc }))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))

const phone = vi.hoisted(() => ({
  supported: true,
  ios: false,
  standalone: false,
  permission: 'default' as NotificationPermission,
  grantsOnAsk: true,
  asked: 0,
  subscription: null as null | { endpoint: string },
}))
vi.mock('~/composables/usePushNotifications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/composables/usePushNotifications')>()),
  realPushBrowser: () => ({
    supported: () => phone.supported,
    isIos: () => phone.ios,
    isStandalone: () => phone.standalone,
    permission: () => phone.permission,
    requestPermission: async () => {
      phone.asked += 1
      phone.permission = phone.grantsOnAsk ? 'granted' : 'denied'
      return phone.permission
    },
    register: async () => ({
      pushManager: {
        getSubscription: async () => phone.subscription && {
          endpoint: phone.subscription.endpoint,
          toJSON: () => ({ endpoint: phone.subscription!.endpoint, keys: { p256dh: 'k', auth: 'a' } }),
          unsubscribe: async () => true,
        },
        subscribe: async () => {
          phone.subscription = { endpoint: 'https://push.example.test/abc' }
          return { endpoint: phone.subscription.endpoint, toJSON: () => ({ endpoint: phone.subscription!.endpoint, keys: { p256dh: 'k', auth: 'a' } }), unsubscribe: async () => true }
        },
      },
    }),
  }),
}))

import PushOptInPrompt from '~/components/customers/PushOptInPrompt.vue'

let wrapper: ReturnType<typeof mount> | undefined
const show = async () => {
  wrapper = mount(PushOptInPrompt, { attachTo: document.body })
  await flushPromises()
}
const prompt = () => document.body.querySelector('[data-testid="push-prompt"]') as HTMLElement | null
const press = async (testId: string) => {
  ;(document.body.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement).click()
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  user.isLoggedIn = true
  Object.assign(phone, { supported: true, ios: false, standalone: false, permission: 'default', grantsOnAsk: true, asked: 0, subscription: null })
  svc.getPushPublicKey.mockResolvedValue({ success: true, data: { public_key: 'AQAB' } })
  svc.subscribePush.mockResolvedValue({ success: true })
})
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('PushOptInPrompt (after an order is placed)', () => {
  it('offers delivery updates on this phone, without asking the browser for anything yet', async () => {
    await show()
    expect(prompt()!.textContent).toContain('delivery updates')
    expect(phone.asked).toBe(0)
    expect(svc.subscribePush).not.toHaveBeenCalled()
  })

  it('turns notifications on from the tap and confirms it', async () => {
    await show()
    await press('push-prompt-enable')

    expect(phone.asked).toBe(1)
    expect(svc.subscribePush).toHaveBeenCalledWith({ endpoint: 'https://push.example.test/abc', keys: { p256dh: 'k', auth: 'a' } })
    expect(document.body.querySelector('[data-testid="push-prompt-done"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="push-prompt-enable"]')).toBeNull()
  })

  it('goes away on "Not now" and stays away next time', async () => {
    await show()
    await press('push-prompt-dismiss')
    expect(prompt()).toBeNull()
    expect(phone.asked).toBe(0)

    wrapper!.unmount()
    await show()
    expect(prompt()).toBeNull()
  })

  it('stays put and says what went wrong when turning on fails', async () => {
    svc.subscribePush.mockRejectedValue(new Error('network'))
    await show()
    await press('push-prompt-enable')

    expect(prompt()).not.toBeNull()
    expect(document.body.querySelector('[role="alert"]')!.textContent).toMatch(/couldn't turn on/i)
  })

  it('is not shown when this phone already gets notifications', async () => {
    phone.permission = 'granted'
    phone.subscription = { endpoint: 'https://push.example.test/abc' }
    await show()
    expect(prompt()).toBeNull()
  })

  it('is not shown when the customer already refused notifications in the browser', async () => {
    phone.permission = 'denied'
    await show()
    expect(prompt()).toBeNull()
  })

  it('is not shown for a browser that cannot do notifications', async () => {
    phone.supported = false
    await show()
    expect(prompt()).toBeNull()
  })

  it('is not shown to a guest, who has no account to notify', async () => {
    user.isLoggedIn = false
    await show()
    expect(prompt()).toBeNull()
  })

  it('tells an iPhone visitor to add MedsGH to the Home Screen, instead of a switch that would not work', async () => {
    Object.assign(phone, { supported: false, ios: true, standalone: false })
    await show()

    expect(prompt()!.textContent).toContain('Add to Home Screen')
    expect(document.body.querySelector('[data-testid="push-prompt-enable"]')).toBeNull()

    await press('push-prompt-dismiss')
    expect(prompt()).toBeNull()
  })
})
