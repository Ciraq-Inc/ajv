import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import contract from '../fixtures/notification-preferences.response.json'

// Boundary: the HTTP service. Everything between the screen and it is real.
const svc = vi.hoisted(() => ({ getNotificationPreferences: vi.fn(), updateNotificationPreferences: vi.fn() }))
vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => svc }))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))

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

beforeEach(() => { vi.clearAllMocks() })
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
