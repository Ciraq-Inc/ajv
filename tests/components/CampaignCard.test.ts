import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The signed-in staff member's role is the only thing that changes between these tests.
const store = vi.hoisted(() => ({ role: 'manager' as string | null }))
vi.mock('~/stores/company', () => ({ useCompanyStore: () => ({ get userRole() { return store.role } }) }))

import CampaignCard from '~/components/sms/campaign/CampaignCard.vue'

const campaign = (status: string, extra: Record<string, unknown> = {}) => ({
  id: 4, name: 'Flu jab reminder', status, message: 'Hello', created_at: '2026-10-01T10:00:00Z', ...extra,
})

const labels = (role: string | null, status: string, extra: Record<string, unknown> = {}) => {
  store.role = role
  const wrapper = mount(CampaignCard, { props: { campaign: campaign(status, extra) } })
  return wrapper.findAll('button').map((b) => b.text())
}

describe('what a campaign card offers each kind of staff', () => {
  it.each(['cashier', 'pharmacist', null])('%s cannot start a draft, but can still open the menu', (role) => {
    const texts = labels(role, 'draft')
    expect(texts.some((t) => /^Start$/.test(t))).toBe(false)
  })

  it('a manager can start a draft', () => {
    expect(labels('manager', 'draft').some((t) => /^Start$/.test(t))).toBe(true)
  })

  it('floor staff cannot resume a paused campaign; a manager can', () => {
    expect(labels('cashier', 'paused').some((t) => /Resume/.test(t))).toBe(false)
    expect(labels('manager', 'paused').some((t) => /Resume/.test(t))).toBe(true)
  })

  it('floor staff can still pause a sending campaign', () => {
    expect(labels('cashier', 'sending').some((t) => /Pause/.test(t))).toBe(true)
  })

  it('resend and delete are only in the menu for a manager', async () => {
    for (const [role, expected] of [['cashier', false], ['manager', true]] as const) {
      store.role = role
      const wrapper = mount(CampaignCard, { props: { campaign: campaign('completed', { messages_failed: 2 }) } })
      const menu = wrapper.findAll('button').find((b) => b.find('svg').exists() && b.text() === '')
      await menu?.trigger('click')
      const text = wrapper.text()
      expect(/Resend Campaign/.test(text)).toBe(expected)
    }
  })
})
