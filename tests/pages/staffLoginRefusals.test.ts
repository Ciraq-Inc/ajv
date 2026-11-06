import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

// The company store and HTTP layer are the boundary; the page is driven through its controls.
const store = vi.hoisted(() => ({
  checkAuthState: vi.fn(),
  fetchTheme: vi.fn(),
  currentCompany: null as unknown,
  checkPhoneStatus: vi.fn(),
}))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => ({ get: vi.fn().mockResolvedValue({}) }))
vi.stubGlobal('useCompanyStore', () => store)
vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))
vi.stubGlobal('useRoute', () => ({ path: '/kofi/services/login', query: {} }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/kofi/services/login', query: {} }),
}))
vi.mock('~/stores/company', () => ({ useCompanyStore: () => store }))

import LoginPage from '~/pages/[pharmacy]/services/login.vue'

const mountPage = () =>
  mount(LoginPage, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      },
    },
  })

const submitPhone = async (wrapper: ReturnType<typeof mountPage>) => {
  await wrapper.find('input[type="tel"]').setValue('0244123456')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  store.currentCompany = null
  store.checkAuthState.mockResolvedValue(undefined)
})

describe('staff login: not on the list / online access off', () => {
  it('never offers a support ticket on the login screen', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).not.toMatch(/support ticket/i)
    expect(wrapper.find('a[href*="support"]').exists()).toBe(false)
  })

  it('sends a number that is not on the staff list to the pharmacy admin', async () => {
    store.checkPhoneStatus.mockResolvedValue({ status: 'not_found' })
    const wrapper = mountPage()
    await flushPromises()
    await submitPhone(wrapper)

    expect(wrapper.text()).toContain("This number isn't registered here. Ask your pharmacy admin to add you.")
    expect(wrapper.text()).not.toMatch(/support/i)
    expect(wrapper.find('a[href*="support"]').exists()).toBe(false)
  })

  it('tells a listed number without online access to ask the pharmacy admin to enable it', async () => {
    store.checkPhoneStatus.mockResolvedValue({ status: 'access_denied' })
    const wrapper = mountPage()
    await flushPromises()
    await submitPhone(wrapper)

    expect(wrapper.text()).toContain(
      "Your number is registered, but online access isn't switched on. Ask your pharmacy admin to enable it.",
    )
    expect(wrapper.find('a[href*="support"]').exists()).toBe(false)
  })
})
