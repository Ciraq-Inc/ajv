import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP layer is the boundary; the page is driven through its controls.
const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)

import StoreSettingsPage from '~/pages/admin/store-settings.vue'

let alertSpy: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  alertSpy = vi.fn()
  vi.stubGlobal('alert', alertSpy)
  http.get.mockResolvedValue({ data: [{ id: 1, name: 'Kofi Pharmacy', domain_name: 'kofi', hide_prices: 0 }] })
})

describe('admin store settings: a failed save', () => {
  it('puts the switch back and explains on the page, not in a browser alert', async () => {
    http.put.mockRejectedValue(new Error('Not allowed'))
    const wrapper = mount(StoreSettingsPage, { global: { stubs: { Teleport: true } } })
    await flushPromises()

    const toggle = wrapper.find('button[role="switch"]')
    await toggle.trigger('click')
    await flushPromises()

    expect(alertSpy).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="page-notice"]').text()).toContain('Not allowed')
    expect(wrapper.find('button[role="switch"]').attributes('aria-checked')).toBe('false')
  })
})
