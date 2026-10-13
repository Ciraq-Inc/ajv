import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Creating a customer and placing an order for them each send an SMS and write a record. A second
// submit while the first is still in flight (Enter pressed twice, a double click) must do nothing.
// HTTP is the boundary.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), request: vi.fn() }))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.mock('~/composables/useApi', async (importOriginal) => ({ ...(await importOriginal<object>()), useApi: () => http }))

import CustomersPage from '~/pages/admin/customers.vue'

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
let wrapper: ReturnType<typeof mount>
const posts = (url: string) => http.post.mock.calls.filter(([u]) => u === url)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})
afterEach(() => wrapper?.unmount())

const createCustomer = async () => {
  wrapper = mount(CustomersPage, { global: { stubs } })
  await flushPromises()
  await wrapper.findAll('button').find((b) => /new customer|create customer|add customer/i.test(b.text()))!.trigger('click')
  await wrapper.find('#c-name').setValue('Ama Mensah')
  await wrapper.find('#c-phone').setValue('+233241234567')
}

describe('admin customers: double submit', () => {
  it('creates the customer once when the form is submitted twice before the first answer', async () => {
    let release: (v: unknown) => void = () => {}
    http.post.mockImplementation(() => new Promise((resolve) => { release = resolve }))
    await createCustomer()

    const form = wrapper.find('form[class*="space-y-4"]')
    void form.trigger('submit')
    void form.trigger('submit')
    await flushPromises()
    release({ success: true, data: { id: 3, name: 'Ama Mensah', phone: '+233241234567' } })
    await flushPromises()

    expect(posts('/api/admin/customers')).toHaveLength(1)
  })

  it('places the order once when the form is submitted twice before the first answer', async () => {
    http.post.mockImplementation(async (url: string) =>
      url === '/api/admin/customers' ? { success: true, data: { id: 3, name: 'Ama Mensah', phone: '+233241234567' } } : new Promise(() => {}))
    await createCustomer()
    await wrapper.find('form[class*="space-y-4"]').trigger('submit')
    await flushPromises()
    await wrapper.find('input[placeholder="Product name"]').setValue('Panadol')

    const form = wrapper.find('form[class*="space-y-5"]')
    void form.trigger('submit')
    void form.trigger('submit')
    await flushPromises()

    expect(posts('/api/admin/order-requests/on-behalf')).toHaveLength(1)
  })
})
