import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import EmailResetPassword from '../../components/auth/EmailResetPassword.vue'

const TOKEN = 'k3J9xQ2mZ7vB1nR8tY4uW6pL0sD5fH_aC-eGiOjT2Xc'
const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const apiError = (status: number, message: string, body: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { status, body: { success: false, message, ...body } })

const submit = vi.fn()

const open = (hash: string) => {
  window.history.replaceState(null, '', `/customer/reset-password${hash}`)
  return mount(EmailResetPassword, {
    props: { submit, signInHref: '/', requestNewHref: '/' },
    global: { stubs: { NuxtLink } },
  })
}
const fill = async (wrapper: ReturnType<typeof open>, password: string, confirm = password) => {
  await wrapper.find('input#new-password').setValue(password)
  await wrapper.find('input#confirm-password').setValue(confirm)
}
const send = async (wrapper: ReturnType<typeof open>) => {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EmailResetPassword', () => {
  it('shows the form for a link with a token, hides the token, and scrubs it from the address bar', async () => {
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(true)
    expect(window.location.hash).toBe('')
    expect(wrapper.html()).not.toContain(TOKEN)
  })

  it('labels both fields and asks the browser to offer a new password, not autofill the old one', async () => {
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()
    const fields = wrapper.findAll('input[type="password"]')
    expect(fields).toHaveLength(2)
    for (const f of fields) {
      expect(f.attributes('autocomplete')).toBe('new-password')
      expect(wrapper.find(`label[for="${f.attributes('id')}"]`).exists()).toBe(true)
    }
  })

  it('treats a link with no usable token as invalid, without showing a form or calling the API', async () => {
    const wrapper = open('')
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').text()).toMatch(/incomplete|invalid/i)
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
    expect(submit).not.toHaveBeenCalled()
  })

  it('does not submit an empty password or two different passwords', async () => {
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await send(wrapper)
    expect(submit).not.toHaveBeenCalled()

    await fill(wrapper, 'New-Passw0rd-1', 'New-Passw0rd-2')
    await send(wrapper)
    expect(submit).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toMatch(/do not match|don't match/i)
  })

  it('submits the token and new password, then confirms and points to sign-in', async () => {
    submit.mockResolvedValue(undefined)
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await fill(wrapper, 'New-Passw0rd-1')
    await send(wrapper)

    expect(submit).toHaveBeenCalledWith(TOKEN, 'New-Passw0rd-1')
    expect(wrapper.text()).toMatch(/password updated/i)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
    expect(wrapper.html()).not.toContain('New-Passw0rd-1')
  })

  it('replaces the form with an explanation when the link turns out to be invalid or expired', async () => {
    submit.mockRejectedValue(apiError(400, 'x', { code: 'INVALID_TOKEN' }))
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await fill(wrapper, 'New-Passw0rd-1')
    await send(wrapper)

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').text()).toMatch(/invalid or has expired/i)
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
  })

  it('keeps the form and shows the server wording when the password is rejected', async () => {
    submit.mockRejectedValue(apiError(400, 'Password must be at least 6 characters.'))
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await fill(wrapper, 'abc')
    await send(wrapper)

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toBe('Password must be at least 6 characters.')

    // the link is still good, so a corrected password goes through with the same token
    submit.mockResolvedValue(undefined)
    await fill(wrapper, 'Better-Passw0rd-1')
    await send(wrapper)
    expect(submit).toHaveBeenLastCalledWith(TOKEN, 'Better-Passw0rd-1')
    expect(wrapper.text()).toMatch(/password updated/i)
  })

  it('keeps the form after a dropped connection so the same link can be tried again', async () => {
    submit.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(undefined)
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await fill(wrapper, 'New-Passw0rd-1')
    await send(wrapper)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').text()).toMatch(/could not reach/i)

    await send(wrapper)
    expect(submit).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toMatch(/password updated/i)
  })

  it('accepts errors that arrive already described (the admin store returns results, not exceptions)', async () => {
    submit.mockRejectedValue({ kind: 'invalid_link', message: 'This link is invalid or has expired.' })
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await fill(wrapper, 'New-Passw0rd-1')
    await send(wrapper)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').text()).toMatch(/invalid or has expired/i)
  })

  it('ignores a second submit while the first is still in flight', async () => {
    let finish: () => void = () => {}
    submit.mockReturnValue(new Promise<void>((resolve) => { finish = resolve }))
    const wrapper = open(`#token=${TOKEN}`)
    await flushPromises()

    await fill(wrapper, 'New-Passw0rd-1')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')
    expect(submit).toHaveBeenCalledTimes(1)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

    finish()
    await flushPromises()
    expect(wrapper.text()).toMatch(/password updated/i)
  })
})
