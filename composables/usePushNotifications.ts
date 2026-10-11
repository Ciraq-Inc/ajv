// composables/usePushNotifications.ts
//
// Whether THIS phone/browser gets order notifications, and the taps that change it. What the
// customer wants to hear about is separate (useNotificationPreferences); this is the device.
//
// The browser and the HTTP service are injected so it carries no Pinia, fetch or window of its
// own. Checking (refresh) never shows a permission prompt: browsers, and iOS in particular,
// only allow one from a tap, so only enable() asks.

import { computed, ref } from 'vue'

export type PushStatus =
  | 'checking'
  | 'unsupported'
  /** iPhone/iPad Safari only pushes to a site that was added to the Home Screen. */
  | 'needs-install'
  /** The customer refused notifications in the browser; only the browser settings can undo it. */
  | 'blocked'
  | 'off'
  | 'on'

interface PushSubscriptionLike {
  endpoint: string
  toJSON: () => { endpoint: string; keys: { p256dh: string; auth: string } } | object
  unsubscribe: () => Promise<boolean>
}

interface RegistrationLike {
  pushManager: {
    getSubscription: () => Promise<PushSubscriptionLike | null>
    subscribe: (options: { userVisibleOnly: boolean; applicationServerKey: Uint8Array }) => Promise<PushSubscriptionLike>
  }
}

export interface PushBrowser {
  supported: () => boolean
  isIos: () => boolean
  isStandalone: () => boolean
  permission: () => NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  register: () => Promise<RegistrationLike>
}

export interface PushDeps {
  browser: PushBrowser
  getPublicKey: () => Promise<{ data: { public_key: string } }>
  subscribe: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => Promise<unknown>
  unsubscribe: (endpoint: string) => Promise<unknown>
}

/** The server sends its VAPID key URL-safe base64; the Push API wants bytes. */
export const urlBase64ToUint8Array = (value: string): Uint8Array => {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

const MESSAGES = {
  disabled: "Phone notifications aren't available right now. Please try again later.",
  failed: "We couldn't turn on notifications. Please try again.",
  failedOff: "We couldn't turn off notifications. Please try again.",
}

export function usePushNotifications(deps: PushDeps) {
  const { browser } = deps
  const status = ref<PushStatus>('checking')
  const error = ref('')
  const busy = ref(false)
  const subscribed = computed(() => status.value === 'on')

  const refresh = async (): Promise<void> => {
    error.value = ''
    if (!browser.supported()) {
      status.value = browser.isIos() && !browser.isStandalone() ? 'needs-install' : 'unsupported'
      return
    }
    if (browser.permission() === 'denied') {
      status.value = 'blocked'
      return
    }
    if (browser.permission() === 'default') {
      status.value = 'off'
      return
    }
    try {
      const existing = await (await browser.register()).pushManager.getSubscription()
      if (!existing) {
        status.value = 'off'
        return
      }
      // The browser may have been subscribed under another account on this phone: claim it.
      await deps.subscribe(existing.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } })
      status.value = 'on'
    } catch {
      status.value = 'off'
    }
  }

  const enable = async (): Promise<void> => {
    if (busy.value || (status.value !== 'off' && status.value !== 'checking')) return
    busy.value = true
    error.value = ''
    try {
      const permission = await browser.requestPermission()
      if (permission !== 'granted') {
        status.value = permission === 'denied' ? 'blocked' : 'off'
        return
      }

      let key: string
      try {
        key = (await deps.getPublicKey()).data.public_key
      } catch (failure) {
        const code = (failure as { body?: { code?: string } } | null)?.body?.code
        error.value = code === 'PUSH_DISABLED' ? MESSAGES.disabled : MESSAGES.failed
        return
      }

      const registration = await browser.register()
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      await deps.subscribe(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } })
      status.value = 'on'
    } catch {
      error.value = MESSAGES.failed
    } finally {
      if (status.value === 'checking') status.value = 'off'
      busy.value = false
    }
  }

  const disable = async (): Promise<void> => {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      const subscription = await (await browser.register()).pushManager.getSubscription()
      if (subscription) {
        // The browser is switched off even if the server can't be told: a dead endpoint is
        // pruned by the server on its next send.
        await deps.unsubscribe(subscription.endpoint).catch(() => undefined)
        await subscription.unsubscribe()
      }
      status.value = 'off'
    } catch {
      error.value = MESSAGES.failedOff
    } finally {
      busy.value = false
    }
  }

  return { status, error, busy, subscribed, refresh, enable, disable }
}

/**
 * Called when the customer signs out: this phone stops getting their notifications. Best effort and
 * silent, so signing out always completes. Does nothing for a phone that never allowed notifications.
 */
export const releaseThisPhone = async (deps: Pick<PushDeps, 'browser' | 'unsubscribe'>): Promise<void> => {
  try {
    if (!deps.browser.supported() || deps.browser.permission() !== 'granted') return
    const subscription = await (await deps.browser.register()).pushManager.getSubscription()
    if (!subscription) return
    await deps.unsubscribe(subscription.endpoint).catch(() => undefined)
    await subscription.unsubscribe()
  } catch {
    // Nothing to do: a dead endpoint is pruned by the server on its next send.
  }
}

/** The real browser, for the components. Everything above takes it as a dependency. */
export const realPushBrowser = (): PushBrowser => ({
  supported: () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
  isIos: () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  isStandalone: () =>
    window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
  permission: () => Notification.permission,
  requestPermission: () => Notification.requestPermission(),
  register: async () => {
    await navigator.serviceWorker.register('/sw.js')
    return (await navigator.serviceWorker.ready) as unknown as RegistrationLike
  },
})
