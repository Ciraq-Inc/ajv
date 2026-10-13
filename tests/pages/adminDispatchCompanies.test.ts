import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP layer is the boundary; the page is driven through its buttons and fields.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)

import DispatchCompaniesPage from '~/pages/admin/fulfillment/dispatch-companies.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

const company = { id: 5, name: 'Swift Riders', phone: '0200000000', admin_count: 1, rider_count: 2 }

const mountPage = async () => {
  const wrapper = mount(DispatchCompaniesPage, {
    global: { stubs: { Teleport: true }, components: { ConfirmDialog } },
  })
  await flushPromises()
  return wrapper
}
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().trim() === text)!
const notice = (wrapper: ReturnType<typeof mount>) => wrapper.find('[data-test="page-notice"]')

let alertSpy: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  alertSpy = vi.fn()
  vi.stubGlobal('alert', alertSpy)
  vi.stubGlobal('confirm', vi.fn(() => true))
  http.get.mockResolvedValue({ success: true, data: [company] })
  http.post.mockResolvedValue({ success: true })
  http.delete.mockResolvedValue({ success: true })
})

describe('admin dispatch companies: feedback', () => {
  it('says what is missing on the page instead of opening a browser alert', async () => {
    const wrapper = await mountPage()

    await button(wrapper, '+ Add Company').trigger('click')
    await button(wrapper, 'Create Company').trigger('click')
    await flushPromises()

    expect(alertSpy).not.toHaveBeenCalled()
    expect(notice(wrapper).text()).toMatch(/name and phone are required/i)
    expect(http.post).not.toHaveBeenCalled()
  })

  it('shows the server reason when creating a company fails', async () => {
    http.post.mockRejectedValue(new Error('Phone number already in use'))
    const wrapper = await mountPage()

    await button(wrapper, '+ Add Company').trigger('click')
    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Fast Dispatch')
    await inputs[1]!.setValue('0244000000')
    await button(wrapper, 'Create Company').trigger('click')
    await flushPromises()

    expect(alertSpy).not.toHaveBeenCalled()
    expect(notice(wrapper).text()).toContain('Phone number already in use')
  })
})

describe('admin dispatch companies: deactivating', () => {
  it('asks in the page before deactivating and does nothing if the admin cancels', async () => {
    const wrapper = await mountPage()

    await button(wrapper, 'Delete').trigger('click')
    await flushPromises()

    expect(confirm).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Deactivate "Swift Riders"?')

    await button(wrapper, 'Cancel').trigger('click')
    await flushPromises()
    expect(http.delete).not.toHaveBeenCalled()
  })

  it('deactivates the company once confirmed', async () => {
    const wrapper = await mountPage()

    await button(wrapper, 'Delete').trigger('click')
    await button(wrapper, 'Yes, deactivate').trigger('click')
    await flushPromises()

    expect(http.delete).toHaveBeenCalledWith('/api/deliveries/dispatch-companies/5')
  })
})
