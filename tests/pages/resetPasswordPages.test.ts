import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const userStore = vi.hoisted(() => ({ resetPasswordWithEmailToken: vi.fn() }))
const adminStore = vi.hoisted(() => ({ resetPassword: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => userStore }))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => adminStore }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useHead', vi.fn())

import CustomerResetPage from '../../pages/customer/reset-password.vue'
import AdminResetPage from '../../pages/admin/reset-password.vue'

const TOKEN = 'k3J9xQ2mZ7vB1nR8tY4uW6pL0sD5fH_aC-eGiOjT2Xc'
const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const open = async (page: object, path: string) => {
  window.history.replaceState(null, '', `${path}#token=${TOKEN}`)
  const wrapper = mount(page, { global: { stubs: { NuxtLink } } })
  await flushPromises()
  return wrapper
}
const submitNewPassword = async (wrapper: Awaited<ReturnType<typeof open>>, pw: string) => {
  await wrapper.find('input#new-password').setValue(pw)
  await wrapper.find('input#confirm-password').setValue(pw)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('/customer/reset-password', () => {
  it('sets the password through the customer store and sends the customer to sign in', async () => {
    userStore.resetPasswordWithEmailToken.mockResolvedValue({ success: true })
    const wrapper = await open(CustomerResetPage, '/customer/reset-password')

    await submitNewPassword(wrapper, 'New-Passw0rd-1')

    expect(userStore.resetPasswordWithEmailToken).toHaveBeenCalledWith(TOKEN, 'New-Passw0rd-1')
    expect(wrapper.text()).toMatch(/password updated/i)
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
  })

  it('shows an expired link as expired', async () => {
    userStore.resetPasswordWithEmailToken.mockRejectedValue(
      Object.assign(new Error('x'), { status: 400, body: { code: 'INVALID_TOKEN' } }),
    )
    const wrapper = await open(CustomerResetPage, '/customer/reset-password')
    await submitNewPassword(wrapper, 'New-Passw0rd-1')
    expect(wrapper.find('[role="alert"]').text()).toMatch(/invalid or has expired/i)
  })
})

describe('/admin/reset-password', () => {
  it('sets the password through the admin store and sends the admin to the admin sign-in', async () => {
    adminStore.resetPassword.mockResolvedValue({ success: true })
    const wrapper = await open(AdminResetPage, '/admin/reset-password')

    await submitNewPassword(wrapper, 'New-Passw0rd-1')

    expect(adminStore.resetPassword).toHaveBeenCalledWith(TOKEN, 'New-Passw0rd-1')
    expect(wrapper.text()).toMatch(/password updated/i)
    expect(wrapper.find('a[href="/admin/login"]').exists()).toBe(true)
  })

  it('treats a failure result (the admin store does not throw) as a failure', async () => {
    adminStore.resetPassword.mockResolvedValue({ success: false, kind: 'invalid_link', message: 'This link is invalid or has expired.' })
    const wrapper = await open(AdminResetPage, '/admin/reset-password')

    await submitNewPassword(wrapper, 'New-Passw0rd-1')

    expect(wrapper.text()).not.toMatch(/password updated/i)
    expect(wrapper.find('[role="alert"]').text()).toMatch(/invalid or has expired/i)
    expect(wrapper.find('a[href="/admin/login"]').exists()).toBe(true)
  })

  it('keeps the form when the password is rejected, with the server wording', async () => {
    adminStore.resetPassword.mockResolvedValue({ success: false, kind: 'rejected', message: 'Password must be at least 6 characters.' })
    const wrapper = await open(AdminResetPage, '/admin/reset-password')

    await submitNewPassword(wrapper, 'abc')

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toBe('Password must be at least 6 characters.')
  })
})
