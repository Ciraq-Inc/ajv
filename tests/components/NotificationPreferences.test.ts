import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import contract from '../fixtures/notification-preferences.response.json'

// Boundaries: the HTTP service and the browser's push APIs. Everything between the screen and them is real.
const svc = vi.hoisted(() => ({
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  getPushPublicKey: vi.fn(),
  subscribePush: vi.fn(),
  unsubscribePush: vi.fn(),
}))
vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => svc }))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))

// A controllable stand-in for this phone's browser.
const phone = vi.hoisted(() => ({
  supported: true,
  ios: false,
  standalone: false,
  permission: 'default' as NotificationPermission,
  grantsOnAsk: true,
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
      phone.permission = phone.grantsOnAsk ? 'granted' : 'denied'
      return phone.permission
    },
    register: async () => ({
      pushManager: {
        getSubscription: async () => phone.subscription && {
          endpoint: phone.subscription.endpoint,
          toJSON: () => ({ endpoint: phone.subscription!.endpoint, keys: { p256dh: 'k', auth: 'a' } }),
          unsubscribe: async () => { phone.subscription = null; return true },
        },
        subscribe: async () => {
          phone.subscription = { endpoint: 'https://push.example.test/abc' }
          return { endpoint: phone.subscription.endpoint, toJSON: () => ({ endpoint: phone.subscription!.endpoint, keys: { p256dh: 'k', auth: 'a' } }), unsubscribe: async () => true }
        },
      },
    }),
  }),
}))

import NotificationPreferences from '~/components/customers/notificationPreferences.vue'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
let wrapper: ReturnType<typeof mount> | undefined

const open = async (body: unknown = contract) => {
  svc.getNotificationPreferences.mockResolvedValue(clone(body))
  wrapper = mount(NotificationPreferences, { attachTo: document.body })
  await flushPromises()
}
const toggle = (label: string) => document.body.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement
const saveButton = () => document.body.querySelector('[data-testid="save-notifications"]') as HTMLButtonElement

const pushToggle = () => document.body.querySelector('[data-testid="push-toggle"]') as HTMLInputElement
const tap = async (el: HTMLElement) => { el.click(); await flushPromises() }

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(phone, { supported: true, ios: false, standalone: false, permission: 'default', grantsOnAsk: true, subscription: null })
  svc.getPushPublicKey.mockResolvedValue({ success: true, data: { public_key: 'AQAB' } })
  svc.subscribePush.mockResolvedValue({ success: true })
  svc.unsubscribePush.mockResolvedValue({ success: true })
})
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('NotificationPreferences screen', () => {
  it('shows a switch per category and channel, reflecting what the API returned', async () => {
    await open()
    expect(toggle('Order progress: text message').checked).toBe(true)
    expect(toggle('Offers and news: email').checked).toBe(false)
  })

  it('locks security messages so they cannot be switched off', async () => {
    await open()
    expect(toggle('Security: text message').disabled).toBe(true)
    expect(toggle('Security: email').disabled).toBe(true)
  })

  it('disables text messages, with a reason on screen, for a customer without a Ghana number', async () => {
    const body = clone(contract)
    body.data.channels.sms.reachable = false
    for (const c of Object.values(body.data.categories)) c.sms = false
    await open(body)
    expect(toggle('Order progress: text message').disabled).toBe(true)
    expect(document.body.textContent).toContain('Ghana phone numbers')
  })

  it('keeps Save disabled until something changes', async () => {
    await open()
    expect(saveButton().disabled).toBe(true)
    toggle('Order progress: email').click()
    await flushPromises()
    expect(saveButton().disabled).toBe(false)
  })

  it('saves only what changed and confirms it', async () => {
    await open()
    const after = clone(contract)
    after.data.categories.order_progress.email = false
    svc.updateNotificationPreferences.mockResolvedValue(after)

    toggle('Order progress: email').click()
    await flushPromises()
    saveButton().click()
    await flushPromises()

    expect(svc.updateNotificationPreferences).toHaveBeenCalledWith({ order_progress: { email: false } })
    expect(document.body.querySelector('[data-testid="notifications-saved"]')).not.toBeNull()
  })

  it("shows the server's refusal and leaves the edits in place", async () => {
    await open()
    svc.updateNotificationPreferences.mockRejectedValue(
      Object.assign(new Error('x'), { status: 400, body: { success: false, code: 'MINIMUM_ONE_CHANNEL', message: 'Keep at least one way to be reached for this kind of message.' } }),
    )
    toggle('Offers and news: email').click()
    await flushPromises()
    saveButton().click()
    await flushPromises()

    expect(document.body.querySelector('[role="alert"]')!.textContent).toContain('Keep at least one way')
    expect(toggle('Offers and news: email').checked).toBe(true)
  })

  describe('notifications on this phone', () => {
    const withPushReachable = () => {
      const body = clone(contract)
      body.data.channels.push.reachable = true
      return body
    }

    it('shows a Phone switch per category, locked until this phone is turned on, with the reason on screen', async () => {
      await open()
      expect(toggle('Order progress: phone').disabled).toBe(true)
      expect(document.body.textContent).toContain('Turn on notifications on this phone first')
    })

    it('turns notifications on from a tap, then unlocks the Phone switches', async () => {
      await open()
      svc.getNotificationPreferences.mockResolvedValue(clone(withPushReachable()))

      expect(pushToggle().checked).toBe(false)
      await tap(pushToggle())

      expect(svc.subscribePush).toHaveBeenCalledWith({ endpoint: 'https://push.example.test/abc', keys: { p256dh: 'k', auth: 'a' } })
      expect(pushToggle().checked).toBe(true)
      expect(toggle('Order progress: phone').disabled).toBe(false)
    })

    it('never asks for permission just by opening the screen', async () => {
      await open()
      expect(phone.permission).toBe('default')
      expect(svc.subscribePush).not.toHaveBeenCalled()
    })

    it('shows this phone as on when it already has a subscription, and turns it off from a tap', async () => {
      phone.permission = 'granted'
      phone.subscription = { endpoint: 'https://push.example.test/abc' }
      await open(withPushReachable())
      expect(pushToggle().checked).toBe(true)

      svc.getNotificationPreferences.mockResolvedValue(clone(contract))
      await tap(pushToggle())

      expect(svc.unsubscribePush).toHaveBeenCalledWith('https://push.example.test/abc')
      expect(pushToggle().checked).toBe(false)
    })

    it('leaves the switch off and says so when turning on fails', async () => {
      await open()
      svc.subscribePush.mockRejectedValue(new Error('network'))
      await tap(pushToggle())

      expect(pushToggle().checked).toBe(false)
      expect(document.body.querySelector('[data-testid="push-error"]')!.textContent).toMatch(/couldn't turn on/i)
    })

    it('tells an iPhone visitor to add the site to the Home Screen first', async () => {
      Object.assign(phone, { supported: false, ios: true, standalone: false })
      await open()
      expect(pushToggle()).toBeNull()
      expect(document.body.textContent).toContain('Add to Home Screen')
    })

    it('explains how to undo a refusal made in the browser', async () => {
      phone.permission = 'denied'
      await open()
      expect(pushToggle().disabled).toBe(true)
      expect(document.body.textContent).toMatch(/blocked/i)
    })

    it('says plainly when this browser cannot get notifications', async () => {
      phone.supported = false
      await open()
      expect(pushToggle()).toBeNull()
      expect(document.body.textContent).toMatch(/aren't supported/i)
    })
  })

  describe('also text me', () => {
    const replaced = (extra: Record<string, boolean> = {}) => {
      const body = clone(contract)
      body.data.channels.push.reachable = true
      body.data.routine_texts = { replaced_by_push: true, also_text: false, ...extra }
      return body
    }
    const alsoText = () => document.body.querySelector('input[data-testid="also-text-toggle"]') as HTMLInputElement | null

    it('is not shown when push is not replacing any texts', async () => {
      await open()
      expect(alsoText()).toBeNull()
    })

    it('explains that updates come to the phone and offers texts as well', async () => {
      await open(replaced())
      expect(alsoText()).not.toBeNull()
      expect(alsoText()!.checked).toBe(false)
      expect(document.body.textContent).toMatch(/come to your phone/i)
    })

    it('saves ticking it as a remembered yes', async () => {
      await open(replaced())
      svc.updateNotificationPreferences.mockResolvedValue(replaced({ replaced_by_push: false, also_text: true }))

      await tap(alsoText()!)
      saveButton().click()
      await flushPromises()

      expect(svc.updateNotificationPreferences).toHaveBeenCalledWith({ order_progress: { sms: true } })
      expect(alsoText()!.checked).toBe(true)
    })

    it('disappears when order-progress texts are switched off', async () => {
      await open(replaced())
      await tap(toggle('Order progress: text message'))
      expect(alsoText()).toBeNull()
    })
  })

  describe('customers who only get email', () => {
    const emailOnly = () => {
      const body = clone(contract)
      body.data.channels.sms.reachable = false
      for (const c of Object.values(body.data.categories)) c.sms = false
      return body
    }
    const nudge = () => document.body.querySelector('[data-testid="phone-nudge"]')

    it('are nudged to turn on notifications on this phone', async () => {
      await open(emailOnly())
      expect(nudge()).not.toBeNull()
      expect(nudge()!.textContent).toMatch(/only get email/i)
    })

    it('are not nudged once this phone is on', async () => {
      phone.permission = 'granted'
      phone.subscription = { endpoint: 'https://push.example.test/abc' }
      const body = emailOnly()
      body.data.channels.push.reachable = true
      await open(body)
      expect(nudge()).toBeNull()
    })

    it('are not nudged when this browser cannot get notifications anyway', async () => {
      phone.supported = false
      await open(emailOnly())
      expect(nudge()).toBeNull()
    })

    it('are not nudged when they can already be texted', async () => {
      await open()
      expect(nudge()).toBeNull()
    })
  })

  it('offers a retry when the settings cannot be loaded', async () => {
    svc.getNotificationPreferences.mockRejectedValue(new Error('network'))
    wrapper = mount(NotificationPreferences, { attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('[role="alert"]')!.textContent).toMatch(/couldn't load/i)
    svc.getNotificationPreferences.mockResolvedValue(clone(contract))
    ;(document.body.querySelector('[data-testid="retry-notifications"]') as HTMLButtonElement).click()
    await flushPromises()
    expect(toggle('Order progress: email')).not.toBeNull()
  })
})
