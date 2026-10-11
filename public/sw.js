// MedsGH service worker: shows order push notifications and opens the order when one is tapped.
// It deliberately does no caching, so it can never serve a stale app.

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

const readPayload = (event) => {
  if (!event.data) return {}
  try {
    return event.data.json() || {}
  } catch (_e) {
    return {}
  }
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event)
  const options = {
    body: payload.body || 'Open MedsGH to see the latest on your order.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url || '/' },
  }
  if (payload.tag) options.tag = payload.tag
  event.waitUntil(self.registration.showNotification(payload.title || 'MedsGH', options))
})

// Only paths on this site are followed; anything else falls back to the home page.
const sameSitePath = (url) => {
  try {
    const target = new URL(url || '/', self.location.origin)
    return target.origin === self.location.origin ? target.pathname + target.search + target.hash : '/'
  } catch (_e) {
    return '/'
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = sameSitePath(event.notification.data && event.notification.data.url)

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows[0]
    if (existing) {
      if (existing.navigate) await existing.navigate(new URL(path, self.location.origin).href)
      if (existing.focus) await existing.focus()
      return
    }
    await self.clients.openWindow(path)
  })())
})
