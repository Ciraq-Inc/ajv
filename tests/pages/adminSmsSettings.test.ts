import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP layer is the boundary; the page is driven through its inputs and buttons.
const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)

import SmsSettingsPage from '~/pages/admin/sms-settings.vue'

const mountPage = async () => {
  const wrapper = mount(SmsSettingsPage, { global: { stubs: { Teleport: true, Icon: true } } })
  await flushPromises()
  return wrapper
}
const toast = (wrapper: ReturnType<typeof mount>) => wrapper.find('.message-toast').text()
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))!

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  http.get.mockResolvedValue({
    success: true,
    data: { id: 1, active_provider: 'nalo', sms_rate_per_unit: '0.05', updated_at: null },
  })
  http.put.mockResolvedValue({ success: true })
})

describe('admin SMS settings', () => {
  it('shows the stored provider and rate without announcing a refresh nobody asked for', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('nalo')
    expect(wrapper.text()).toContain('0.05')
    expect(wrapper.find('.message-toast').exists()).toBe(false)
  })

  it('says the settings are not configured rather than "refreshed successfully"', async () => {
    http.get.mockResolvedValue({ success: false, message: 'SMS settings not configured' })

    const wrapper = await mountPage()

    expect(toast(wrapper)).toMatch(/not configured/i)
    expect(toast(wrapper)).not.toMatch(/refreshed successfully/i)
  })

  it('treats a 404 from the server as "not configured yet", not a generic failure', async () => {
    http.get.mockRejectedValue(Object.assign(new Error('SMS settings not configured'), { status: 404 }))

    const wrapper = await mountPage()

    expect(toast(wrapper)).toMatch(/not configured yet/i)
  })

  it('confirms an explicit refresh', async () => {
    const wrapper = await mountPage()

    await button(wrapper, 'Refresh').trigger('click')
    await flushPromises()

    expect(toast(wrapper)).toMatch(/refreshed successfully/i)
  })

  it('shows the server reason when a rate is refused', async () => {
    http.put.mockRejectedValue(new Error('Invalid rate. Must be a positive number'))
    const wrapper = await mountPage()

    await wrapper.find('input[type="number"]').setValue(-1)
    await button(wrapper, 'Update Rate').trigger('click')
    await flushPromises()

    expect(toast(wrapper)).toContain('Invalid rate')
  })

  it('sends the rate as typed and confirms the save', async () => {
    const wrapper = await mountPage()

    await wrapper.find('input[type="number"]').setValue(0.08)
    await button(wrapper, 'Update Rate').trigger('click')
    await flushPromises()

    expect(http.put).toHaveBeenCalledWith('/api/sms-settings/rate', { rate: 0.08 })
    expect(toast(wrapper)).toMatch(/updated successfully/i)
  })
})
