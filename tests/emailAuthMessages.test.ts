import { describe, expect, it } from 'vitest'
import { describeEmailAuthError, formatWait } from '../utils/emailAuthMessages'

const apiError = (status: number, message: string, body: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { status, body: { success: false, message, ...body } })

describe('formatWait', () => {
  it('speaks in seconds under a minute and minutes above', () => {
    expect(formatWait(1)).toBe('1 second')
    expect(formatWait(42)).toBe('42 seconds')
    expect(formatWait(60)).toBe('1 minute')
    expect(formatWait(61)).toBe('2 minutes')
    expect(formatWait(900)).toBe('15 minutes')
  })

  it('falls back to a generic phrase for a missing or nonsense wait', () => {
    expect(formatWait(undefined)).toBe('a moment')
    expect(formatWait(0)).toBe('a moment')
    expect(formatWait(-5)).toBe('a moment')
    expect(formatWait(Number.NaN)).toBe('a moment')
  })
})

describe('describeEmailAuthError: any context', () => {
  it('reports a rate limit with how long to wait', () => {
    const r = describeEmailAuthError(apiError(429, 'slow down', { retry_after_seconds: 42 }), 'requestReset')
    expect(r.kind).toBe('rate_limited')
    expect(r.retryAfterSeconds).toBe(42)
    expect(r.message).toContain('42 seconds')
  })

  it('still reports a rate limit when the server gave no wait time', () => {
    const r = describeEmailAuthError(apiError(429, 'slow down'), 'sendVerification')
    expect(r.kind).toBe('rate_limited')
    expect(r.retryAfterSeconds).toBeUndefined()
    expect(r.message).toMatch(/moment/)
  })

  it('reports an outage (503) and a failed send (502) as try-again-later', () => {
    expect(describeEmailAuthError(apiError(503, 'x'), 'verify').kind).toBe('unavailable')
    expect(describeEmailAuthError(apiError(502, 'x'), 'sendVerification').kind).toBe('unavailable')
  })

  it('does not call an ordinary error a network failure; it keeps its own message', () => {
    const r = describeEmailAuthError(new Error('Failed to update profile'), 'profile')
    expect(r.kind).toBe('unknown')
    expect(r.message).toBe('Failed to update profile')
  })

  it('handles a network failure (no status) and non-Error values', () => {
    expect(describeEmailAuthError(new TypeError('Failed to fetch'), 'verify').kind).toBe('network')
    expect(describeEmailAuthError('boom', 'verify').kind).toBe('unknown')
    expect(describeEmailAuthError(undefined, 'verify').message.length).toBeGreaterThan(0)
  })
})

describe('describeEmailAuthError: verify and reset links', () => {
  it('an invalid or expired verification link says so and says what to do', () => {
    const r = describeEmailAuthError(apiError(400, 'x', { code: 'INVALID_TOKEN' }), 'verify')
    expect(r.kind).toBe('invalid_link')
    expect(r.message).toMatch(/invalid or has expired/i)
    expect(r.message).toMatch(/new/i)
  })

  it('an email already verified on another account is its own outcome', () => {
    expect(describeEmailAuthError(apiError(409, 'x', { code: 'EMAIL_TAKEN' }), 'verify').kind).toBe('email_taken')
  })

  it('a reset link refused as invalid is an invalid link, not a password problem', () => {
    expect(describeEmailAuthError(apiError(400, 'x', { code: 'INVALID_TOKEN' }), 'reset').kind).toBe('invalid_link')
  })

  it('a rejected new password (policy) shows the server wording so it matches the rule', () => {
    const r = describeEmailAuthError(apiError(400, 'Password must be at least 6 characters.'), 'reset')
    expect(r.kind).toBe('rejected')
    expect(r.message).toBe('Password must be at least 6 characters.')
  })
})

describe('describeEmailAuthError: signing in by email', () => {
  it('one message for every refusal, so it cannot reveal whether an email has an account or is verified', () => {
    const r = describeEmailAuthError(apiError(401, 'Invalid credentials'), 'emailLogin')
    expect(r.kind).toBe('bad_credentials')
    expect(r.message).toMatch(/incorrect email or password/i)
    expect(r.message).not.toMatch(/not verified|unverified|no account|not registered/i)
  })

  it('a lockout is reported as such', () => {
    expect(describeEmailAuthError(apiError(429, 'Too many failed attempts. Try again later.'), 'emailLogin').kind).toBe('rate_limited')
  })
})

describe('describeEmailAuthError: profile email change', () => {
  it('a wrong current password points at that field', () => {
    const r = describeEmailAuthError(apiError(403, 'Current password is incorrect', { field: 'current_password' }), 'profile')
    expect(r.kind).toBe('wrong_password')
    expect(r.field).toBe('current_password')
  })

  it('a missing current password points at that field', () => {
    const r = describeEmailAuthError(apiError(400, 'x', { field: 'current_password' }), 'profile')
    expect(r.kind).toBe('password_required')
    expect(r.field).toBe('current_password')
  })

  it('an invalid email points at the email field with the server wording', () => {
    const r = describeEmailAuthError(apiError(400, 'Enter a valid email address.', { field: 'email' }), 'profile')
    expect(r.kind).toBe('invalid_email')
    expect(r.field).toBe('email')
    expect(r.message).toBe('Enter a valid email address.')
  })

  it('the email-change lockout (429) is a lockout, not a generic failure', () => {
    const r = describeEmailAuthError(apiError(429, 'Too many incorrect passwords. Try again later.'), 'profile')
    expect(r.kind).toBe('rate_limited')
  })
})

describe('describeEmailAuthError: asking for a sign-up code', () => {
  it('says a code was sent recently, with the wait', () => {
    const r = describeEmailAuthError(apiError(429, 'x', { retry_after_seconds: 41 }), 'signupCode')
    expect(r.kind).toBe('rate_limited')
    expect(r.retryAfterSeconds).toBe(41)
    expect(r.message).toBe('A code was sent recently. Please wait 41 seconds and try again.')
  })

  it('shows the server wording for an address it will not accept', () => {
    const r = describeEmailAuthError(apiError(400, 'Please enter a valid email address.', { field: 'email' }), 'signupCode')
    expect(r).toMatchObject({ kind: 'invalid_email', field: 'email', message: 'Please enter a valid email address.' })
  })

  it('treats an email outage like any other', () => {
    expect(describeEmailAuthError(apiError(503, 'x'), 'signupCode').kind).toBe('unavailable')
  })
})

describe('describeEmailAuthError: finishing sign-up with the code', () => {
  it('an address that already has an account points to sign in', () => {
    const r = describeEmailAuthError(apiError(409, 'This email address is already registered. Please sign in instead.', { field: 'email' }), 'signup')
    expect(r.kind).toBe('email_taken')
    expect(r.message).toMatch(/already has an account/i)
    expect(r.message).toMatch(/sign in/i)
  })

  it('a locked code says to ask for a new one, not to wait', () => {
    const r = describeEmailAuthError(apiError(429, 'Too many incorrect attempts. Please request a new code.'), 'signup')
    expect(r.kind).toBe('code_locked')
    expect(r.message).toMatch(/new code/i)
    expect(r.message).not.toMatch(/wait/i)
  })

  it('a wrong or expired code shows the server wording', () => {
    expect(describeEmailAuthError(apiError(400, 'Invalid code'), 'signup'))
      .toMatchObject({ kind: 'rejected', message: 'Invalid code' })
    expect(describeEmailAuthError(apiError(400, 'Code not found or expired. Please request a new code.'), 'signup').message)
      .toBe('Code not found or expired. Please request a new code.')
  })

  it('a weak password shows the server wording', () => {
    const r = describeEmailAuthError(apiError(400, 'Password must be at least 10 characters.'), 'signup')
    expect(r.message).toBe('Password must be at least 10 characters.')
  })

  it('a bad email goes to the email field', () => {
    const r = describeEmailAuthError(apiError(400, 'Please enter a valid email address.', { field: 'email' }), 'signup')
    expect(r).toMatchObject({ kind: 'invalid_email', field: 'email' })
  })

  it('a network failure is a network failure', () => {
    expect(describeEmailAuthError(new TypeError('Failed to fetch'), 'signup').kind).toBe('network')
  })
})
