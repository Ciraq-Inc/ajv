import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Boundary: router, company store and HTTP are stubbed; the layout is driven through its markup.
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/kofi/services/orders', query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('~/stores/company', () => ({
  useCompanyStore: () => ({
    currentCompany: { name: 'Kofi Pharmacy' },
    isLoggedIn: false,
    userRole: 'manager',
    userName: 'Kofi',
    logout: vi.fn(),
    fetchTheme: vi.fn().mockResolvedValue(undefined),
    checkAuthState: vi.fn().mockResolvedValue(undefined),
  }),
}))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({ get: vi.fn().mockResolvedValue({}) }) }))

import CompanyLayout from '~/layouts/company.vue'

const mountLayout = () =>
  mount(CompanyLayout, {
    slots: { default: '<p>Page</p>' },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        UiDialog: true,
        UiDialogContent: true,
        UiDialogHeader: true,
        UiDialogTitle: true,
        UiDialogDescription: true,
        UiDialogFooter: true,
      },
    },
  })

describe('pharmacy portal sidebar: help', () => {
  it('offers a Help link that opens the support site in a new tab', async () => {
    const wrapper = mountLayout()
    await flushPromises()

    const help = wrapper.find('a.help-link')
    expect(help.exists()).toBe(true)
    expect(help.text()).toContain('Help')
    expect(help.attributes('href')).toBe('https://support.rigelos.com/')
    expect(help.attributes('target')).toBe('_blank')
    expect(help.attributes('rel')).toContain('noopener')
  })
})
