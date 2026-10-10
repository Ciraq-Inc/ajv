import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfileEmail } from '../../composables/useProfileEmail'

const apiError = (status: number, message: string, body: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { status, body: { success: false, message, ...body } })

const sendVerification = vi.fn()
const make = (saved = 'ama@example.com', verified = true) => {
  const form = useProfileEmail({ sendVerification })
  form.load({ email: saved, email_verified: verified })
  return form
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('status', () => {
  it('is none, unverified or verified depending on the saved address', () => {
    const form = useProfileEmail({ sendVerification })
    form.load({ email: '', email_verified: false })
    expect(form.status.value).toBe('none')
    form.load({ email: 'ama@example.com', email_verified: false })
    expect(form.status.value).toBe('unverified')
    form.load({ email: 'ama@example.com', email_verified: true })
    expect(form.status.value).toBe('verified')
  })

  it('treats a missing email_verified flag as unverified, never as verified', () => {
    const form = useProfileEmail({ sendVerification })
    form.load({ email: 'ama@example.com' })
    expect(form.status.value).toBe('unverified')
  })

  it('copes with a null email from the API', () => {
    const form = useProfileEmail({ sendVerification })
    form.load({ email: null, email_verified: false })
    expect(form.status.value).toBe('none')
  })
})

describe('isChanged', () => {
  it('ignores case and surrounding spaces, like the server does', () => {
    const form = make('Ama@Example.com')
    expect(form.isChanged('  ama@example.COM ')).toBe(false)
    expect(form.isChanged('ama@example.org')).toBe(true)
    expect(form.isChanged('')).toBe(true)
  })

  it('adding a first email is a change; leaving it empty is not', () => {
    const form = make('', false)
    expect(form.isChanged('ama@example.com')).toBe(true)
    expect(form.isChanged('')).toBe(false)
  })
})

describe('prepare', () => {
  it('sends the email alone when it has not changed, even if a password was typed', () => {
    const form = make()
    form.currentPassword.value = 'pw-123456'
    expect(form.prepare('ama@example.com')).toStrictEqual({ email: 'ama@example.com' })
  })

  it('blocks a change that has no current password, and says which field needs it', () => {
    const form = make()
    expect(form.prepare('new@example.com')).toBeNull()
    expect(form.passwordError.value).toMatch(/current password/i)
  })

  it('includes the current password for a real change', () => {
    const form = make()
    form.currentPassword.value = 'pw-123456'
    expect(form.prepare(' new@example.com ')).toStrictEqual({ email: 'new@example.com', current_password: 'pw-123456' })
    expect(form.passwordError.value).toBe('')
  })

  it('needs the password to remove an email too', () => {
    const form = make()
    expect(form.prepare('')).toBeNull()
  })

  it('clears stale field errors on the next attempt', () => {
    const form = make()
    form.prepare('new@example.com')
    expect(form.passwordError.value).not.toBe('')
    form.currentPassword.value = 'pw-123456'
    form.prepare('new@example.com')
    expect(form.passwordError.value).toBe('')
  })
})

describe('applySaved', () => {
  it('after a change: new address, unverified, password forgotten, and the customer is told to check their inbox', () => {
    const form = make()
    form.currentPassword.value = 'pw-123456'
    form.applySaved({ email: 'new@example.com', email_verified: false }, true)

    expect(form.status.value).toBe('unverified')
    expect(form.currentPassword.value).toBe('')
    expect(form.notice.value).toContain('new@example.com')
    expect(form.notice.value).toMatch(/verif/i)
  })

  it('after a change the resend countdown restarts for the NEW address (the server just sent to it)', async () => {
    sendVerification.mockResolvedValue({ status: 'sent' })
    const form = make('ama@example.com', false)
    await form.resend()
    vi.advanceTimersByTime(47_000)
    expect(form.resendCooldown.value).toBe(13)

    form.applySaved({ email: 'new@example.com', email_verified: false }, true)
    expect(form.resendCooldown.value).toBe(60)
  })

  it('an ordinary save leaves a running countdown alone', async () => {
    sendVerification.mockResolvedValue({ status: 'sent' })
    const form = make('ama@example.com', false)
    await form.resend()
    vi.advanceTimersByTime(47_000)
    form.applySaved({ email: 'ama@example.com', email_verified: false }, false)
    expect(form.resendCooldown.value).toBe(13)
  })

  it('after an ordinary save: no notice, and the verified state is kept', () => {
    const form = make()
    form.applySaved({ email: 'ama@example.com', email_verified: true }, false)
    expect(form.status.value).toBe('verified')
    expect(form.notice.value).toBe('')
  })

  it('removing the email leaves no address and no notice', () => {
    const form = make()
    form.applySaved({ email: '', email_verified: false }, true)
    expect(form.status.value).toBe('none')
    expect(form.notice.value).toBe('')
  })
})

describe('explainFailure', () => {
  it('a wrong current password is shown at that field, cleared so it is retyped, and not in the banner', () => {
    const form = make()
    form.currentPassword.value = 'nope'
    const banner = form.explainFailure(apiError(403, 'Your current password is incorrect.', { field: 'current_password' }))
    expect(banner).toBe('')
    expect(form.passwordError.value).toBe('Your current password is incorrect.')
    expect(form.currentPassword.value).toBe('')
  })

  it('an invalid email is shown at the email field', () => {
    const form = make()
    const banner = form.explainFailure(apiError(400, 'Enter a valid email address.', { field: 'email' }))
    expect(banner).toBe('')
    expect(form.emailError.value).toBe('Enter a valid email address.')
  })

  it('a lockout goes to the banner with the wait', () => {
    const form = make()
    const banner = form.explainFailure(apiError(429, 'Too many', { retry_after_seconds: 900 }))
    expect(banner).toMatch(/15 minutes/)
  })

  it('anything else goes to the banner', () => {
    const form = make()
    expect(form.explainFailure(new TypeError('Failed to fetch'))).toMatch(/could not reach/i)
  })
})

describe('resend', () => {
  it('sends the verification email, tells the customer, and starts a cooldown', async () => {
    sendVerification.mockResolvedValue({ status: 'sent' })
    const form = make('ama@example.com', false)
    await form.resend()

    expect(sendVerification).toHaveBeenCalledTimes(1)
    expect(form.notice.value).toContain('ama@example.com')
    expect(form.resendCooldown.value).toBe(60)
  })

  it('cannot be repeated during the cooldown', async () => {
    sendVerification.mockResolvedValue({ status: 'sent' })
    const form = make('ama@example.com', false)
    await form.resend()
    await form.resend()
    expect(sendVerification).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60_000)
    expect(form.resendCooldown.value).toBe(0)
    await form.resend()
    expect(sendVerification).toHaveBeenCalledTimes(2)
  })

  it('learns the address is already verified and updates the badge', async () => {
    sendVerification.mockResolvedValue({ status: 'already_verified' })
    const form = make('ama@example.com', false)
    await form.resend()
    expect(form.status.value).toBe('verified')
  })

  it('uses the server wait time when refused', async () => {
    sendVerification.mockRejectedValue(apiError(429, 'wait', { retry_after_seconds: 33 }))
    const form = make('ama@example.com', false)
    await form.resend()
    expect(form.resendCooldown.value).toBe(33)
    expect(form.resendMessage.value).toContain('33 seconds')
  })

  it('reports an outage and allows another try straight away', async () => {
    sendVerification.mockRejectedValue(apiError(503, 'x'))
    const form = make('ama@example.com', false)
    await form.resend()
    expect(form.resendMessage.value).toMatch(/temporarily unavailable/i)
    expect(form.resendCooldown.value).toBe(0)
  })

  it('does nothing when there is no address or it is already verified', async () => {
    const none = make('', false)
    await none.resend()
    const verified = make('ama@example.com', true)
    await verified.resend()
    expect(sendVerification).not.toHaveBeenCalled()
  })

  it('stops its timer when disposed', async () => {
    sendVerification.mockResolvedValue({ status: 'sent' })
    const form = make('ama@example.com', false)
    await form.resend()
    form.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
