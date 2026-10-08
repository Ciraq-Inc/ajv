import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Boundaries: the router, the HTTP client and the user store.
const route = vi.hoisted(() => ({ query: {} as Record<string, unknown> }))
const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))

const api = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('~/composables/useApi', () => ({ useApi: () => api }))

const store = vi.hoisted(() => ({ applyCustomerAuthPayload: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store }))

import ActivatePage from '~/pages/customer/activate.vue'

const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const TOKEN = 'k3J9xQ2mZ7vB1nR8tY4uW6pL0sD5fH_aC-eGiOjT2Xc'
const GOOD = 'a-strong-password'

let wrapper: ReturnType<typeof mount> | undefined
const open = async (query: Record<string, unknown> = { token: TOKEN }) => {
  route.query = query
  wrapper = mount(ActivatePage, { attachTo: document.body, global: { stubs: { NuxtLink } } })
  await flushPromises()
  return wrapper
}
const fill = async (w: ReturnType<typeof mount>, password: string, confirm = password) => {
  await w.find('#password').setValue(password)
  await w.find('#confirm').setValue(confirm)
}
const submit = async (w: ReturnType<typeof mount>) => {
  await w.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  api.post.mockResolvedValue({ success: true, data: { token: 'jwt', customer: { id: 1 } } })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('customer activation: arriving', () => {
  it('asks the customer to set a password when the link carries a token', async () => {
    const w = await open()

    expect(w.find('h1').text()).toBe('Set your password')
    expect(w.find('#password').attributes('type')).toBe('password')
    expect(w.find('#confirm').attributes('type')).toBe('password')
  })

  it('says the link is invalid, with no form, when there is no token', async () => {
    const w = await open({})

    expect(w.text()).toContain('This activation link is invalid or has already been used.')
    expect(w.find('form').exists()).toBe(false)
  })

  it('treats a blank token the same as a missing one', async () => {
    const w = await open({ token: '' })
    expect(w.find('form').exists()).toBe(false)
  })

  it('never calls the API just from arriving', async () => {
    await open()
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('customer activation: choosing a password', () => {
  it('shows the length rule only after the customer starts typing, and ticks it at eight characters', async () => {
    const w = await open()
    expect(w.find('ul li').exists()).toBe(false)

    await w.find('#password').setValue('short')
    const rule = w.find('ul li')
    expect(rule.classes()).toContain('text-zinc-400')

    await w.find('#password').setValue('long-enough')
    expect(w.find('ul li').classes()).toContain('text-green-600')
  })

  it('rejects a short password before calling the API', async () => {
    const w = await open()
    await fill(w, 'short')
    await submit(w)

    expect(w.text()).toContain('Password must be at least 8 characters.')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('rejects a confirmation that does not match, before calling the API', async () => {
    const w = await open()
    await fill(w, GOOD, 'something-else')
    await submit(w)

    expect(w.text()).toContain('Passwords do not match.')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('does not compare passwords by trimming: spaces are part of the password', async () => {
    const w = await open()
    await fill(w, 'pass word 123', 'pass word 123 ')
    await submit(w)

    expect(w.text()).toContain('Passwords do not match.')
  })
})

describe('customer activation: submitting', () => {
  it('sends the token and the password, and nothing else', async () => {
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/api/order-requests/customer/activate', { token: TOKEN, password: GOOD })
  })

  it('signs the customer in with the returned session and opens their account', async () => {
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(store.applyCustomerAuthPayload).toHaveBeenCalledWith({ token: 'jwt', customer: { id: 1 } })
    expect(router.push).toHaveBeenCalledWith('/customer')
  })

  it('still opens the account when the response carries no session payload', async () => {
    api.post.mockResolvedValue({ success: true })
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(store.applyCustomerAuthPayload).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith('/customer')
  })

  it('locks the form and shows progress while activating', async () => {
    let finish!: (v: unknown) => void
    api.post.mockReturnValue(new Promise((res) => { finish = res }))
    const w = await open()
    await fill(w, GOOD)
    await w.find('form').trigger('submit')

    const button = w.find('button[type="submit"]')
    expect(button.text()).toBe('Activating…')
    expect(button.attributes('disabled')).toBeDefined()
    expect(w.find('#password').attributes('disabled')).toBeDefined()
    expect(w.find('#confirm').attributes('disabled')).toBeDefined()

    finish({ success: true })
    await flushPromises()
  })
})

describe('customer activation: when the server says no', () => {
  it('replaces the form with the invalid-link message for an invalid or expired link', async () => {
    api.post.mockRejectedValue(new Error('Invalid or expired activation link'))
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(w.text()).toContain('This activation link is invalid or has already been used.')
    expect(w.find('form').exists()).toBe(false)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('keeps the form, shows the reason, and lets the customer retry after any other failure', async () => {
    api.post.mockRejectedValueOnce(new Error('Failed to activate account'))
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(w.find('form').exists()).toBe(true)
    expect(w.find('.activate-error').text()).toBe('Failed to activate account')
    expect(w.find('button[type="submit"]').attributes('disabled')).toBeUndefined()

    await submit(w)
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(router.push).toHaveBeenCalledWith('/customer')
  })

  it('does not sign anyone in when activation fails', async () => {
    api.post.mockRejectedValue(new Error('Failed to activate account'))
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(store.applyCustomerAuthPayload).not.toHaveBeenCalled()
  })

  it('assumes the link has expired when the failure carries no message', async () => {
    api.post.mockRejectedValue('network')
    const w = await open()
    await fill(w, GOOD)
    await submit(w)

    expect(w.find('form').exists()).toBe(false)
    expect(w.text()).toContain('invalid or has already been used')
  })
})
