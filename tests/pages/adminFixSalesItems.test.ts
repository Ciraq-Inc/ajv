import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The HTTP layer is the boundary; the page is driven through its buttons.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)

import FixSalesItemsPage from '~/pages/admin/fix-sales-items.vue'

const mountPage = async () => {
  const wrapper = mount(FixSalesItemsPage, { global: { stubs: { Teleport: true } } })
  await flushPromises()
  return wrapper
}
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))!

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  http.post.mockResolvedValue({
    success: true,
    stats: { total: 4, updated: 3, matched: 3, notMatched: 1, errors: 0 },
  })
})

describe('admin fix sales items', () => {
  it('asks for confirmation before it rewrites any sales items', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(http.post).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="fix-confirm"]').exists()).toBe(true)
  })

  it('runs the fix once the admin confirms', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit')
    await button(wrapper, 'Yes, fix items').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post.mock.calls[0]![0]).toBe('/api/sync/admin/fix-sales-items')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.find('[data-test="fix-confirm"]').exists()).toBe(false)
  })

  it('does nothing when the admin backs out', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit')
    await button(wrapper, 'Cancel').trigger('click')
    await flushPromises()

    expect(http.post).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="fix-confirm"]').exists()).toBe(false)
  })

  it('shows a failed clipboard copy on the page instead of a browser alert', async () => {
    const alertSpy = vi.fn()
    vi.stubGlobal('alert', alertSpy)
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    http.post.mockResolvedValue({ success: true, sql: 'UPDATE x', stats: { updates: 1, refGroups: 1 } })
    const wrapper = await mountPage()

    await button(wrapper, 'Generate SQL').trigger('click')
    await flushPromises()
    await button(wrapper, 'Copy to Clipboard').trigger('click')
    await flushPromises()

    expect(alertSpy).not.toHaveBeenCalled()
    expect(wrapper.text()).toMatch(/could not copy/i)
  })
})
