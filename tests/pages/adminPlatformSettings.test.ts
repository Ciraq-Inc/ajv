import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP calls are the boundary. The page is driven through its inputs and its Save button.
const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => ({ get: http.get, put: http.put }))

import PlatformSettingsPage from '~/pages/admin/platform-settings.vue'
import SettingField from '~/components/SettingField.vue'

const mountPage = async () => {
  const wrapper = mount(PlatformSettingsPage, { global: { stubs: { Teleport: true }, components: { SettingField } } })
  await flushPromises()
  return wrapper
}

const saveButton = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('button').find((b) => b.text().includes('Save Changes'))!

const feeInput = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('input[type="number"]')

beforeEach(() => {
  vi.clearAllMocks()
  // Only one setting has ever been stored; every other setting is showing its default.
  http.get.mockResolvedValue({ success: true, data: [{ setting_key: 'request_submission_fee', setting_value: '8.00' }] })
  http.put.mockResolvedValue({ success: true, data: [] })
})

describe('admin platform settings: saving', () => {
  it('starts with nothing to save, even though most settings only show their defaults', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).not.toMatch(/unsaved change/)
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('saves only the setting the admin changed, not every default on the page', async () => {
    const wrapper = await mountPage()

    await feeInput(wrapper).setValue('9.50')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(http.put).toHaveBeenCalledTimes(1)
    expect(http.put).toHaveBeenCalledWith('/api/platform-settings/bulk', {
      settings: [{ key: 'request_submission_fee', value: '9.50' }],
    })
  })

  it('does not send a blank or non-numeric number setting, and says which one', async () => {
    const wrapper = await mountPage()

    await feeInput(wrapper).setValue('')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(http.put).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Request Submission Fee (GHS)')
    expect(wrapper.text()).toMatch(/must be a number/i)
  })

  it('keeps the edit and shows the server reason when the save is refused', async () => {
    http.put.mockRejectedValue(new Error('Invalid value for setting "request_submission_fee"'))
    const wrapper = await mountPage()

    await feeInput(wrapper).setValue('9.50')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid value for setting')
    expect(wrapper.text()).toMatch(/1 unsaved change/)
  })

  it('cannot be saved when the settings failed to load', async () => {
    http.get.mockRejectedValue(new Error('Network down'))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Network down')
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
