import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const adminStore = vi.hoisted(() => ({
  isAuthenticated: false,
  getDashboardRoute: '/admin/data',
  getRole: 'super_admin',
  login: vi.fn(),
  requestPasswordReset: vi.fn(),
}))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => adminStore }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())

import AdminLogin from '../../pages/admin/login.vue'

const open = () => mount(AdminLogin)
const forgotButton = (wrapper: ReturnType<typeof open>) =>
  wrapper.findAll('button').find((b) => /forgot password/i.test(b.text()))

beforeEach(() => {
  vi.clearAllMocks()
  adminStore.isAuthenticated = false
})

describe('admin login: forgot password', () => {
  it('offers a "Forgot password?" way into the reset form (without it the reset flow is unreachable)', async () => {
    const wrapper = open()
    const forgot = forgotButton(wrapper)
    expect(forgot).toBeDefined()
    expect(forgot!.attributes('type')).toBe('button') // must not submit the login form

    await forgot!.trigger('click')
    expect(wrapper.find('#resetIdentifier').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(false)
  })

  it('does not attempt a sign-in when the link is used', async () => {
    const wrapper = open()
    await forgotButton(wrapper)!.trigger('click')
    expect(adminStore.login).not.toHaveBeenCalled()
  })

  it('can go back to the sign-in form', async () => {
    const wrapper = open()
    await forgotButton(wrapper)!.trigger('click')
    const back = wrapper.findAll('button').find((b) => /back to login/i.test(b.text()))
    await back!.trigger('click')
    expect(wrapper.find('#username').exists()).toBe(true)
  })

  it('asks for the reset link for what was typed and shows the answer', async () => {
    adminStore.requestPasswordReset.mockResolvedValue({ success: true, message: 'If an account exists for that identifier, a reset link has been sent.' })
    const wrapper = open()
    await forgotButton(wrapper)!.trigger('click')

    await wrapper.find('#resetIdentifier').setValue('kissinger')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(adminStore.requestPasswordReset).toHaveBeenCalledWith('kissinger')
    expect(wrapper.text()).toMatch(/if an account exists/i)
  })

  it('shows a rate-limit refusal with the wait, so the admin knows to hold on', async () => {
    adminStore.requestPasswordReset.mockResolvedValue({ success: false, kind: 'rate_limited', message: 'That was requested recently. Please wait 42 seconds and try again.' })
    const wrapper = open()
    await forgotButton(wrapper)!.trigger('click')

    await wrapper.find('#resetIdentifier').setValue('kissinger')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Please wait 42 seconds')
  })
})
