import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePushNotifications, urlBase64ToUint8Array, releaseThisPhone } from '../../composables/usePushNotifications'

// Boundaries: the browser (service worker, Push API, Notification permission) and the HTTP service.
const subscriptionJson = { endpoint: 'https://push.example/abc', keys: { p256dh: 'pk', auth: 'ak' } }

const makeSubscription = () => ({
  endpoint: subscriptionJson.endpoint,
  toJSON: () => subscriptionJson,
  unsubscribe: vi.fn().mockResolvedValue(true),
})

interface Env {
  supported: boolean
  ios: boolean
  standalone: boolean
  permission: NotificationPermission
  asked: NotificationPermission
  existing: ReturnType<typeof makeSubscription> | null
}

const build = (over: Partial<Env> = {}) => {
  const env: Env = { supported: true, ios: false, standalone: false, permission: 'default', asked: 'granted', existing: null, ...over }
  const created = makeSubscription()
  const pushManager = {
    getSubscription: vi.fn(async () => env.existing),
    subscribe: vi.fn(async () => created),
  }
  const browser = {
    supported: () => env.supported,
    isIos: () => env.ios,
    isStandalone: () => env.standalone,
    permission: () => env.permission,
    requestPermission: vi.fn(async () => { env.permission = env.asked; return env.asked }),
    register: vi.fn(async () => ({ pushManager })),
  }
  const api = {
    getPublicKey: vi.fn().mockResolvedValue({ success: true, data: { public_key: 'BEl6' } }),
    subscribe: vi.fn().mockResolvedValue({ success: true }),
    unsubscribe: vi.fn().mockResolvedValue({ success: true }),
  }
  const push = usePushNotifications({ browser, ...api })
  return { push, browser, api, pushManager, created, env }
}

beforeEach(() => { vi.clearAllMocks() })

describe('what this phone can do (no prompt is ever shown while checking)', () => {
  it('is off when the browser can do push and nothing has been asked yet', async () => {
    const { push, browser } = build()
    await push.refresh()
    expect(push.status.value).toBe('off')
    expect(browser.requestPermission).not.toHaveBeenCalled()
  })

  it('is on when this browser already holds a subscription', async () => {
    const { push } = build({ permission: 'granted', existing: makeSubscription() })
    await push.refresh()
    expect(push.status.value).toBe('on')
  })

  it('ties an existing subscription to the signed-in account, so "on" is true for this customer', async () => {
    const { push, api } = build({ permission: 'granted', existing: makeSubscription() })
    await push.refresh()
    expect(api.subscribe).toHaveBeenCalledWith(subscriptionJson)
  })

  it('is blocked when notifications were refused in the browser settings', async () => {
    const { push } = build({ permission: 'denied' })
    await push.refresh()
    expect(push.status.value).toBe('blocked')
  })

  it('asks an iPhone user to add the site to the Home Screen, because Safari only pushes to installed apps', async () => {
    const { push } = build({ supported: false, ios: true, standalone: false })
    await push.refresh()
    expect(push.status.value).toBe('needs-install')
  })

  it('is unsupported on a browser with no push at all', async () => {
    const { push } = build({ supported: false })
    await push.refresh()
    expect(push.status.value).toBe('unsupported')
  })

  it('does not show the install hint once the site is installed (and push is simply missing)', async () => {
    const { push } = build({ supported: false, ios: true, standalone: true })
    await push.refresh()
    expect(push.status.value).toBe('unsupported')
  })
})

describe('turning notifications on', () => {
  it('asks permission, subscribes with the server key and saves the subscription', async () => {
    const { push, browser, api, pushManager } = build()
    await push.enable()
    expect(browser.requestPermission).toHaveBeenCalledTimes(1)
    expect(api.getPublicKey).toHaveBeenCalled()
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BEl6'),
    })
    expect(api.subscribe).toHaveBeenCalledWith(subscriptionJson)
    expect(push.status.value).toBe('on')
  })

  it('stops at blocked, without subscribing, when the customer says no', async () => {
    const { push, api, pushManager } = build({ asked: 'denied' })
    await push.enable()
    expect(push.status.value).toBe('blocked')
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(api.subscribe).not.toHaveBeenCalled()
  })

  it('stays off, with a message, when the server has push switched off', async () => {
    const { push, api, pushManager } = build()
    api.getPublicKey.mockRejectedValue(Object.assign(new Error('x'), { status: 503, body: { code: 'PUSH_DISABLED' } }))
    await push.enable()
    expect(push.status.value).toBe('off')
    expect(push.error.value).toMatch(/aren't available/i)
    expect(pushManager.subscribe).not.toHaveBeenCalled()
  })

  it('stays off, with a message, when saving the subscription fails', async () => {
    const { push, api } = build()
    api.subscribe.mockRejectedValue(new Error('network'))
    await push.enable()
    expect(push.status.value).toBe('off')
    expect(push.error.value).toMatch(/try again/i)
  })

  it('does nothing on a phone that cannot do push', async () => {
    const { push, browser } = build({ supported: false, ios: true })
    await push.refresh()
    await push.enable()
    expect(browser.requestPermission).not.toHaveBeenCalled()
    expect(push.status.value).toBe('needs-install')
  })

  it('ignores a second tap while the first is still working', async () => {
    const { push, browser } = build()
    await Promise.all([push.enable(), push.enable()])
    expect(browser.requestPermission).toHaveBeenCalledTimes(1)
  })
})

describe('turning notifications off', () => {
  it('removes the subscription on the server and in the browser', async () => {
    const existing = makeSubscription()
    const { push, api } = build({ permission: 'granted', existing })
    await push.refresh()
    await push.disable()
    expect(api.unsubscribe).toHaveBeenCalledWith(subscriptionJson.endpoint)
    expect(existing.unsubscribe).toHaveBeenCalled()
    expect(push.status.value).toBe('off')
  })

  it('still switches the browser off if the server cannot be reached', async () => {
    const existing = makeSubscription()
    const { push, api } = build({ permission: 'granted', existing })
    api.unsubscribe.mockRejectedValue(new Error('network'))
    await push.refresh()
    await push.disable()
    expect(existing.unsubscribe).toHaveBeenCalled()
    expect(push.status.value).toBe('off')
  })
})

describe('urlBase64ToUint8Array', () => {
  it('decodes the URL-safe base64 the server sends', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3])
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255])
  })
})

describe('signing out hands this phone back (a shared phone must not keep showing the last customer\'s orders)', () => {
  it('removes this phone from the account and from the browser', async () => {
    const existing = makeSubscription()
    const { browser, api } = build({ permission: 'granted', existing })
    await releaseThisPhone({ browser, unsubscribe: api.unsubscribe })

    expect(api.unsubscribe).toHaveBeenCalledWith(subscriptionJson.endpoint)
    expect(existing.unsubscribe).toHaveBeenCalled()
  })

  it('still removes the browser subscription when the server cannot be reached', async () => {
    const existing = makeSubscription()
    const { browser, api } = build({ permission: 'granted', existing })
    api.unsubscribe.mockRejectedValue(new Error('offline'))
    await releaseThisPhone({ browser, unsubscribe: api.unsubscribe })

    expect(existing.unsubscribe).toHaveBeenCalled()
  })

  it('does nothing, and registers nothing, when notifications were never allowed', async () => {
    const { browser, api } = build({ permission: 'default' })
    await releaseThisPhone({ browser, unsubscribe: api.unsubscribe })

    expect(browser.register).not.toHaveBeenCalled()
    expect(api.unsubscribe).not.toHaveBeenCalled()
  })

  it('never throws, so signing out always completes', async () => {
    const { browser, api } = build({ permission: 'granted' })
    browser.register.mockRejectedValue(new Error('no worker'))
    await expect(releaseThisPhone({ browser, unsubscribe: api.unsubscribe })).resolves.toBeUndefined()
  })
})
