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
