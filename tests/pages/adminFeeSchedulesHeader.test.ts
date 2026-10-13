import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Clearing a header field on a draft schedule has to clear it on the server too:
// "blank" means "no per-km topup" / "no cap", not "leave it as it was".
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.mock('~/composables/useApi', () => ({ useApi: () => http }))

import FeeSchedulesPage from '~/pages/admin/fee-schedules.vue'

const draft = () => ({
  id: 3, name: 'Q4 draft', status: 'draft', is_draft: true, is_active: false, currency: 'GHS',
  top_tier_per_km: 1.5, max_billable_km: 20, notes: '',
  tiers: [{ id: 11, from_km: 0, fee_ghs: 10, label: '' }],
})

const open = async () => {
  http.get.mockImplementation(async (url: string) =>
    url === '/api/fee-schedules' ? { success: true, data: [draft()] } : { success: true, data: draft() })
  http.put.mockResolvedValue({ success: true, data: draft() })
  const wrapper = mount(FeeSchedulesPage, { global: { stubs: { Teleport: true, Icon: true, NuxtLink: true } } })
  await flushPromises()
  await wrapper.find('button.schedule-row').trigger('click')
  await flushPromises()
  return wrapper
}
const inputWithPlaceholder = (wrapper: Awaited<ReturnType<typeof open>>, text: RegExp) =>
  wrapper.findAll('input').find((i) => text.test(i.attributes('placeholder') ?? ''))!
const saveHeader = async (wrapper: Awaited<ReturnType<typeof open>>) => {
  await wrapper.findAll('button').find((b) => b.text() === 'Save header')!.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('fee schedule header: clearing a field', () => {
  it('sends null for a cleared per-km topup, keeping the other values', async () => {
    const wrapper = await open()

    await inputWithPlaceholder(wrapper, /flat top tier/i).setValue('')
    await saveHeader(wrapper)

    expect(http.put).toHaveBeenCalledWith('/api/fee-schedules/3', expect.objectContaining({
      top_tier_per_km: null,
      max_billable_km: 20,
    }))
  })

  it('sends null for a cleared distance cap', async () => {
    const wrapper = await open()

    await inputWithPlaceholder(wrapper, /no cap/i).setValue('')
    await saveHeader(wrapper)

    expect(http.put).toHaveBeenCalledWith('/api/fee-schedules/3', expect.objectContaining({
      max_billable_km: null,
      top_tier_per_km: 1.5,
    }))
  })

  it('still sends a changed value as a number', async () => {
    const wrapper = await open()

    await inputWithPlaceholder(wrapper, /no cap/i).setValue('35')
    await saveHeader(wrapper)

    expect(http.put).toHaveBeenCalledWith('/api/fee-schedules/3', expect.objectContaining({ max_billable_km: 35 }))
  })
})
