import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signInReady, useEmailReset, useEmailSignIn } from '../../composables/useEmailSignIn'

const apiError = (status: number, message: string, body: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { status, body: { success: false, message, ...body } })

describe('useEmailSignIn', () => {
  const login = vi.fn()
  beforeEach(() => { vi.clearAllMocks() })

  it('rejects an address that cannot be an email, without calling the server', async () => {
    const form = useEmailSignIn({ login })
    for (const bad of ['', 'ama', 'ama@', '@example.com', 'ama@example', 'a ma@example.com']) {
      form.email.value = bad
      expect(await form.submit('pw-123456')).toBe(false)
      expect(form.emailError.value).not.toBe('')
    }
    expect(login).not.toHaveBeenCalled()
  })

  it('needs a password', async () => {
    const form = useEmailSignIn({ login })
    form.email.value = 'ama@example.com'
    expect(await form.submit('')).toBe(false)
    expect(form.errorMessage.value).toMatch(/password/i)
    expect(login).not.toHaveBeenCalled()
  })

  it('signs in with the trimmed address and the password', async () => {
    login.mockResolvedValue({})
    const form = useEmailSignIn({ login })
    form.email.value = '  ama@example.com '
    expect(await form.submit('pw-123456')).toBe(true)
    expect(login).toHaveBeenCalledWith('ama@example.com', 'pw-123456')
    expect(form.errorMessage.value).toBe('')
    expect(form.emailError.value).toBe('')
    expect(form.busy.value).toBe(false)
  })

  it('answers every refusal with the same message (cannot be used to find which emails have accounts)', async () => {
    const form = useEmailSignIn({ login })
    form.email.value = 'ama@example.com'
    login.mockRejectedValue(apiError(401, 'Invalid credentials'))
    expect(await form.submit('wrong')).toBe(false)
    const first = form.errorMessage.value
    expect(first).toMatch(/incorrect email or password/i)

    form.email.value = 'nobody@example.com'
    expect(await form.submit('wrong')).toBe(false)
    expect(form.errorMessage.value).toBe(first)
  })

  it('reports a lockout with the wait', async () => {
    login.mockRejectedValue(apiError(429, 'Too many failed attempts.', { retry_after_seconds: 600 }))
    const form = useEmailSignIn({ login })
    form.email.value = 'ama@example.com'
    expect(await form.submit('pw-123456')).toBe(false)
    expect(form.errorMessage.value).toMatch(/10 minutes/)
  })

  it('reports a dropped connection', async () => {
    login.mockRejectedValue(new TypeError('Failed to fetch'))
    const form = useEmailSignIn({ login })
    form.email.value = 'ama@example.com'
    expect(await form.submit('pw-123456')).toBe(false)
    expect(form.errorMessage.value).toMatch(/could not reach/i)
  })

  it('clears an old error when the next attempt succeeds', async () => {
    const form = useEmailSignIn({ login })
    form.email.value = 'ama@example.com'
    login.mockRejectedValueOnce(apiError(401, 'x'))
    await form.submit('wrong')
    expect(form.errorMessage.value).not.toBe('')
    login.mockResolvedValueOnce({})
    await form.submit('right-pw')
    expect(form.errorMessage.value).toBe('')
  })

  it('ignores a second submit while one is in flight', async () => {
    let finish: (v?: unknown) => void = () => {}
    login.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const form = useEmailSignIn({ login })
    form.email.value = 'ama@example.com'
    const first = form.submit('pw-123456')
    expect(form.busy.value).toBe(true)
    expect(await form.submit('pw-123456')).toBe(false)
    expect(login).toHaveBeenCalledTimes(1)
    finish()
    expect(await first).toBe(true)
    expect(form.busy.value).toBe(false)
  })
})

describe('useEmailReset', () => {
  const request = vi.fn()
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('rejects an address that cannot be an email', async () => {
    const reset = useEmailReset({ request })
    reset.email.value = 'not-an-email'
    await reset.send()
    expect(request).not.toHaveBeenCalled()
    expect(reset.emailError.value).not.toBe('')
    expect(reset.sent.value).toBe(false)
  })

  it('asks for a link and reports it without claiming the address has an account', async () => {
    request.mockResolvedValue({ success: true })
    const reset = useEmailReset({ request })
    reset.email.value = ' ama@example.com '
    await reset.send()

    expect(request).toHaveBeenCalledWith('ama@example.com')
    expect(reset.sent.value).toBe(true)
    expect(reset.sentTo.value).toBe('ama@example.com')
    expect(reset.errorMessage.value).toBe('')
  })

  it('cannot be sent again during the cooldown, and can afterwards', async () => {
    request.mockResolvedValue({ success: true })
    const reset = useEmailReset({ request, cooldownSeconds: 60 })
    reset.email.value = 'ama@example.com'
    await reset.send()
    expect(reset.cooldown.value).toBe(60)

    await reset.send()
    expect(request).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(30_000)
    expect(reset.cooldown.value).toBe(30)
    vi.advanceTimersByTime(30_000)
    expect(reset.cooldown.value).toBe(0)

    await reset.send()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('uses the server wait time when it refuses', async () => {
    request.mockRejectedValue(apiError(429, 'slow', { retry_after_seconds: 42 }))
    const reset = useEmailReset({ request })
    reset.email.value = 'ama@example.com'
    await reset.send()

    expect(reset.sent.value).toBe(false)
    expect(reset.cooldown.value).toBe(42)
    expect(reset.errorMessage.value).toContain('42 seconds')
  })

  it('reports an outage and lets the customer try again straight away', async () => {
    request.mockRejectedValueOnce(apiError(503, 'x')).mockResolvedValueOnce({ success: true })
    const reset = useEmailReset({ request })
    reset.email.value = 'ama@example.com'
    await reset.send()
    expect(reset.errorMessage.value).toMatch(/temporarily unavailable/i)
    expect(reset.cooldown.value).toBe(0)

    await reset.send()
    expect(reset.sent.value).toBe(true)
  })

  it('can be started over with a different address', async () => {
    request.mockResolvedValue({ success: true })
    const reset = useEmailReset({ request })
    reset.email.value = 'ama@example.com'
    await reset.send()
    reset.startOver()
    expect(reset.sent.value).toBe(false)
    expect(reset.errorMessage.value).toBe('')
  })

  it('stops its timer when disposed (no leaked interval after the modal closes)', async () => {
    request.mockResolvedValue({ success: true })
    const reset = useEmailReset({ request })
    reset.email.value = 'ama@example.com'
    await reset.send()
    reset.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useEmailReset used to request a sign-up code', () => {
  const request = vi.fn()
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('words a refusal for "a code was sent recently", not "that was requested recently"', async () => {
    request.mockRejectedValue(apiError(429, 'slow', { retry_after_seconds: 42 }))
    const code = useEmailReset({ request, context: 'signupCode' })
    code.email.value = 'ama@example.com'
    await code.send()

    expect(code.errorMessage.value).toBe('A code was sent recently. Please wait 42 seconds and try again.')
    expect(code.cooldown.value).toBe(42)
  })

  it('tells someone whose address already has an account to sign in', async () => {
    request.mockRejectedValue(apiError(409, 'exists', { code: 'ALREADY_REGISTERED' }))
    const code = useEmailReset({ request, context: 'signupCode' })
    code.email.value = 'ama@example.com'
    await code.send()

    expect(code.errorMessage.value).toMatch(/already has an account/i)
    expect(code.sent.value).toBe(false)
  })

  it('still words password-reset refusals the old way when no context is given', async () => {
    request.mockRejectedValue(apiError(429, 'slow', { retry_after_seconds: 42 }))
    const reset = useEmailReset({ request })
    reset.email.value = 'ama@example.com'
    await reset.send()
    expect(reset.errorMessage.value).toBe('That was requested recently. Please wait 42 seconds and try again.')
  })
})

describe('signInReady', () => {
  it('phone sign-in needs a phone number and a password of at least 6 characters (unchanged)', () => {
    expect(signInReady('phone', { phone: '241234567', email: '', password: 'abcdef' })).toBe(true)
    expect(signInReady('phone', { phone: '', email: 'ama@example.com', password: 'abcdef' })).toBe(false)
    expect(signInReady('phone', { phone: '241234567', email: '', password: 'abcde' })).toBe(false)
  })

  it('email sign-in needs an email and a password, and ignores the phone field', () => {
    expect(signInReady('email', { phone: '', email: 'ama@example.com', password: 'x' })).toBe(true)
    expect(signInReady('email', { phone: '241234567', email: '', password: 'abcdef' })).toBe(false)
    expect(signInReady('email', { phone: '', email: '   ', password: 'abcdef' })).toBe(false)
    expect(signInReady('email', { phone: '', email: 'ama@example.com', password: '' })).toBe(false)
  })
})
