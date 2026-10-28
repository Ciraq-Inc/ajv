import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The service worker runs outside the app, so it is exercised the way the browser drives it:
// load the script against a fake worker scope, then dispatch push and click events at it.
const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')

type Listener = (event: any) => void

const loadWorker = (openWindows: any[] = []) => {
  const listeners: Record<string, Listener> = {}
  const shown: Array<{ title: string; options: any }> = []
  const opened: string[] = []
  const self = {
    location: { origin: 'https://medsgh.com' },
    addEventListener: (type: string, fn: Listener) => { listeners[type] = fn },
    registration: {
      showNotification: vi.fn(async (title: string, options: any) => { shown.push({ title, options }) }),
    },
    clients: {
      matchAll: vi.fn(async () => openWindows),
      openWindow: vi.fn(async (url: string) => { opened.push(url) }),
      claim: vi.fn(async () => {}),
    },
    skipWaiting: vi.fn(async () => {}),
  }
  new Function('self', source)(self)

  const waitable = (extra: Record<string, unknown> = {}) => {
    const waits: Promise<unknown>[] = []
    return { event: { ...extra, waitUntil: (p: Promise<unknown>) => waits.push(p) }, settle: () => Promise.all(waits) }
  }
  const push = async (payload: unknown) => {
    const { event, settle } = waitable({ data: payload === undefined ? null : { json: () => payload, text: () => (typeof payload === 'string' ? payload : JSON.stringify(payload)) } })
    listeners.push(event)
    await settle()
  }
  const click = async (data: unknown) => {
    const close = vi.fn()
    const { event, settle } = waitable({ notification: { data, close } })
    listeners.notificationclick(event)
    await settle()
    return { close }
  }
  return { self, shown, opened, push, click, listeners }
}

describe('push service worker', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the title and body the server sent, grouped by order so updates replace each other', async () => {
    const sw = loadWorker()
    await sw.push({ title: 'Your order is on its way', body: 'Your medicines are on the way.', tag: 'order-7', url: '/customer?tab=requests&requestId=7' })

    expect(sw.shown).toHaveLength(1)
    expect(sw.shown[0].title).toBe('Your order is on its way')
    expect(sw.shown[0].options).toMatchObject({
      body: 'Your medicines are on the way.',
      tag: 'order-7',
      icon: '/icon-192.png',
      data: { url: '/customer?tab=requests&requestId=7' },
    })
  })

  it('still shows something when the push has no readable payload', async () => {
    const sw = loadWorker()
    await sw.push(undefined)

    expect(sw.shown).toHaveLength(1)
    expect(sw.shown[0].title).toBe('MedsGH')
  })

  it('opens the order when the notification is tapped and no window is open', async () => {
    const sw = loadWorker([])
    const { close } = await sw.click({ url: '/customer?tab=requests&requestId=7' })

    expect(close).toHaveBeenCalled()
    expect(sw.opened).toEqual(['/customer?tab=requests&requestId=7'])
  })

  it('reuses a window that is already open instead of opening another', async () => {
    const existing = { url: 'https://medsgh.com/some-pharmacy', focus: vi.fn(async () => {}), navigate: vi.fn(async () => {}) }
    const sw = loadWorker([existing])
    await sw.click({ url: '/customer?tab=requests&requestId=7' })

    expect(existing.navigate).toHaveBeenCalledWith('https://medsgh.com/customer?tab=requests&requestId=7')
    expect(existing.focus).toHaveBeenCalled()
    expect(sw.opened).toEqual([])
  })

  it('never navigates off the site, even if the payload carries a foreign url', async () => {
    const sw = loadWorker([])
    await sw.click({ url: 'https://evil.example/phish' })

    expect(sw.opened).toEqual(['/'])
  })

  it('takes over open pages as soon as it is installed', () => {
    const sw = loadWorker()
    const waits: Promise<unknown>[] = []
    sw.listeners.install({ waitUntil: (p: Promise<unknown>) => waits.push(p) })
    sw.listeners.activate({ waitUntil: (p: Promise<unknown>) => waits.push(p) })

    expect(sw.self.skipWaiting).toHaveBeenCalled()
    expect(sw.self.clients.claim).toHaveBeenCalled()
  })
})
