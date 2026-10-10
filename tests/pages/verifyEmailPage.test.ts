import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const store = vi.hoisted(() => ({ verifyEmail: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useHead', vi.fn())

import VerifyEmailPage from '../../pages/customer/verify-email.vue'

const TOKEN = 'k3J9xQ2mZ7vB1nR8tY4uW6pL0sD5fH_aC-eGiOjT2Xc'
const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const open = (hash: string) => {
  window.history.replaceState(null, '', `/customer/verify-email${hash}`)
  return mount(VerifyEmailPage, { global: { stubs: { NuxtLink } } })
}
const apiError = (status: number, body: Record<string, unknown> = {}) =>
  Object.assign(new Error('x'), { status, body: { success: false, ...body } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('verify-email page', () => {
  it('redeems the token from the link and says the email is verified', async () => {
    store.verifyEmail.mockResolvedValue({ success: true })
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    expect(store.verifyEmail).toHaveBeenCalledTimes(1)
    expect(store.verifyEmail).toHaveBeenCalledWith(TOKEN)
    expect(wrapper.text()).toMatch(/email verified/i)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('removes the token from the address bar and never renders it', async () => {
    store.verifyEmail.mockResolvedValue({ success: true })
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    expect(window.location.hash).toBe('')
    expect(wrapper.html()).not.toContain(TOKEN)
  })

  it('does not call the API when the link has no usable token', async () => {
    const wrapper = open('')
    await flushPromises()

    expect(store.verifyEmail).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toMatch(/incomplete|invalid/i)
  })

  it('does not call the API for a malformed token', async () => {
    open('#token=short')
    await flushPromises()
    expect(store.verifyEmail).not.toHaveBeenCalled()
  })

  it('explains an invalid or expired link and offers a way forward', async () => {
    store.verifyEmail.mockRejectedValue(apiError(400, { code: 'INVALID_TOKEN' }))
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toMatch(/invalid or has expired/i)
    expect(wrapper.text()).not.toMatch(/email verified/i)
    expect(wrapper.find('a[href="/customer"]').exists()).toBe(true)
    expect(wrapper.text()).not.toMatch(/try again/i) // retrying a dead link is pointless
  })

  it('says when the address is already verified on another account', async () => {
    store.verifyEmail.mockRejectedValue(apiError(409, { code: 'EMAIL_TAKEN' }))
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toMatch(/already verified on another account/i)
  })

  it('on a network failure the token is kept in memory so "Try again" works without the URL', async () => {
    store.verifyEmail.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({ success: true })
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    expect(window.location.hash).toBe('')
    const retry = wrapper.find('button')
    expect(retry.text()).toMatch(/try again/i)
    await retry.trigger('click')
    await flushPromises()

    expect(store.verifyEmail).toHaveBeenCalledTimes(2)
    expect(store.verifyEmail).toHaveBeenLastCalledWith(TOKEN)
    expect(wrapper.text()).toMatch(/email verified/i)
  })

  it('shows progress while waiting, as a status region', async () => {
    store.verifyEmail.mockReturnValue(new Promise(() => {}))
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/verifying/i)
  })
})
