import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotificationPreferences } from '../../composables/useNotificationPreferences'
// Same JSON the backend's integration suite asserts the real API returns
// (rigel-medsgh/tests/fixtures/notification-preferences.response.json). If the API
// shape changes, change both copies together; both suites then fail until they agree.
import contract from '../fixtures/notification-preferences.response.json'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const apiError = (message: string, code: string) =>
  Object.assign(new Error(message), { status: 400, body: { success: false, code, message } })

const fetchPreferences = vi.fn()
const savePreferences = vi.fn()

/** The API's answer with some channel/category values overridden. */
const response = (opts: { smsReachable?: boolean; emailReachable?: boolean; categories?: Record<string, { sms?: boolean; email?: boolean }> } = {}) => {
  const body = clone(contract)
  if (opts.smsReachable === false) {
    body.data.channels.sms.reachable = false
    for (const c of Object.values(body.data.categories)) c.sms = false
  }
  if (opts.emailReachable === false) {
    body.data.channels.email.reachable = false
    for (const c of Object.values(body.data.categories)) c.email = false
  }
  for (const [key, flags] of Object.entries(opts.categories ?? {})) {
    Object.assign((body.data.categories as Record<string, object>)[key], flags)
  }
  return body
}

const make = async (body = response()) => {
  fetchPreferences.mockResolvedValue(body)
  const prefs = useNotificationPreferences({ fetch: fetchPreferences, save: savePreferences })
  await prefs.load()
  return prefs
}
const row = (prefs: Awaited<ReturnType<typeof make>>, key: string) => prefs.rows.value.find((r) => r.key === key)!

beforeEach(() => { vi.clearAllMocks() })

describe('loading the API response', () => {
  it('turns the contract into one row per category, in the order the API sends them', async () => {
    const prefs = await make()
    expect(prefs.rows.value.map((r) => r.key)).toEqual(['security', 'action_required', 'outcome', 'order_progress', 'marketing'])
  })

  it('shows what the API says is on, including marketing being off by default', async () => {
    const prefs = await make()
    expect(row(prefs, 'order_progress').sms.on).toBe(true)
    expect(row(prefs, 'marketing').sms.on).toBe(false)
    expect(row(prefs, 'marketing').email.on).toBe(false)
  })

  it('is not dirty straight after loading', async () => {
    expect((await make()).dirty.value).toBe(false)
  })

  it('reports a failed load instead of throwing', async () => {
    fetchPreferences.mockRejectedValue(new Error('network'))
    const prefs = useNotificationPreferences({ fetch: fetchPreferences, save: savePreferences })
    await prefs.load()
    expect(prefs.loadError.value).not.toBe('')
    expect(prefs.rows.value).toEqual([])
  })
})

describe('which toggles can be touched', () => {
  it('locks security messages on both channels', async () => {
    const prefs = await make()
    expect(row(prefs, 'security').sms.disabled).toBe(true)
    expect(row(prefs, 'security').email.disabled).toBe(true)
    prefs.toggle('security', 'sms')
    expect(row(prefs, 'security').sms.on).toBe(true)
    expect(prefs.dirty.value).toBe(false)
  })

  it('disables a channel the customer cannot receive and says why', async () => {
    const prefs = await make(response({ smsReachable: false }))
    expect(row(prefs, 'order_progress').sms.disabled).toBe(true)
    expect(row(prefs, 'order_progress').sms.reason).toMatch(/Ghana/i)
    expect(row(prefs, 'marketing').sms.disabled).toBe(true)
  })

  it('explains an unreachable email as needing a verified address', async () => {
    const prefs = await make(response({ emailReachable: false }))
    expect(row(prefs, 'order_progress').email.disabled).toBe(true)
    expect(row(prefs, 'order_progress').email.reason).toMatch(/verif/i)
  })

  it('lets order progress be switched off on either channel', async () => {
    const prefs = await make()
    prefs.toggle('order_progress', 'sms')
    prefs.toggle('order_progress', 'email')
    expect(row(prefs, 'order_progress').sms.on).toBe(false)
    expect(row(prefs, 'order_progress').email.on).toBe(false)
  })

  it('stops the last channel of a must-reach category being switched off', async () => {
    const prefs = await make()
    prefs.toggle('action_required', 'sms') // email still on: allowed
    expect(row(prefs, 'action_required').sms.on).toBe(false)
    expect(row(prefs, 'action_required').email.disabled).toBe(true) // now the only one left
    prefs.toggle('action_required', 'email')
    expect(row(prefs, 'action_required').email.on).toBe(true)
  })

  it('does not let a must-reach category go quiet when only one channel is reachable', async () => {
    const prefs = await make(response({ smsReachable: false }))
    expect(row(prefs, 'outcome').email.disabled).toBe(true)
    expect(row(prefs, 'outcome').email.on).toBe(true)
  })

  it('lets marketing be opted into a reachable channel', async () => {
    const prefs = await make()
    prefs.toggle('marketing', 'email')
    expect(row(prefs, 'marketing').email.on).toBe(true)
  })
})

describe('saving', () => {
  it('sends only the categories that changed, and only the channels that changed', async () => {
    const prefs = await make()
    savePreferences.mockResolvedValue(response({ categories: { order_progress: { sms: false } } }))
    prefs.toggle('order_progress', 'sms')
    await prefs.save()
    expect(savePreferences).toHaveBeenCalledWith({ order_progress: { sms: false } })
  })

  it('sends nothing when nothing changed', async () => {
    const prefs = await make()
    await prefs.save()
    expect(savePreferences).not.toHaveBeenCalled()
  })

  it('treats toggling back to the original value as no change', async () => {
    const prefs = await make()
    prefs.toggle('marketing', 'sms')
    prefs.toggle('marketing', 'sms')
    expect(prefs.dirty.value).toBe(false)
  })

  it('adopts the API answer after saving and is clean again', async () => {
    const prefs = await make()
    savePreferences.mockResolvedValue(response({ categories: { order_progress: { sms: false } } }))
    prefs.toggle('order_progress', 'sms')
    await prefs.save()
    expect(row(prefs, 'order_progress').sms.on).toBe(false)
    expect(prefs.dirty.value).toBe(false)
    expect(prefs.saved.value).toBe(true)
  })

  it('shows the API refusal and keeps the customer\'s edits so they can fix them', async () => {
    const prefs = await make()
    savePreferences.mockRejectedValue(apiError('Keep at least one way to be reached for this kind of message.', 'MINIMUM_ONE_CHANNEL'))
    prefs.toggle('order_progress', 'sms')
    await prefs.save()
    expect(prefs.saveError.value).toBe('Keep at least one way to be reached for this kind of message.')
    expect(row(prefs, 'order_progress').sms.on).toBe(false)
    expect(prefs.dirty.value).toBe(true)
    expect(prefs.saved.value).toBe(false)
  })

  it('gives a generic message when the failure is not an API refusal', async () => {
    const prefs = await make()
    savePreferences.mockRejectedValue(new Error('network'))
    prefs.toggle('marketing', 'email')
    await prefs.save()
    expect(prefs.saveError.value).toMatch(/try again/i)
  })

  it('does not send a second save while one is in flight', async () => {
    const prefs = await make()
    let release!: (v: unknown) => void
    savePreferences.mockReturnValue(new Promise((resolve) => { release = resolve }))
    prefs.toggle('marketing', 'email')
    const first = prefs.save()
    await prefs.save()
    release(response({ categories: { marketing: { email: true } } }))
    await first
    expect(savePreferences).toHaveBeenCalledTimes(1)
  })
})
