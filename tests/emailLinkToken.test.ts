import { describe, expect, it, vi } from 'vitest'
import { readTokenFromHash, scrubTokenFromUrl } from '../utils/emailLinkToken'

// 32 random bytes, base64url: what the backend puts in the emailed link.
const TOKEN = 'k3J9xQ2mZ7vB1nR8tY4uW6pL0sD5fH_aC-eGiOjT2Xc'

describe('readTokenFromHash', () => {
  it('reads the token from the URL fragment', () => {
    expect(readTokenFromHash(`#token=${TOKEN}`)).toBe(TOKEN)
  })

  it('works whether or not the hash keeps its leading #', () => {
    expect(readTokenFromHash(`token=${TOKEN}`)).toBe(TOKEN)
  })

  it('returns null when there is no token', () => {
    expect(readTokenFromHash('')).toBeNull()
    expect(readTokenFromHash('#')).toBeNull()
    expect(readTokenFromHash('#other=1')).toBeNull()
    expect(readTokenFromHash('#token=')).toBeNull()
  })

  it('rejects values that cannot be a real token', () => {
    expect(readTokenFromHash('#token=short')).toBeNull()
    expect(readTokenFromHash(`#token=${'a'.repeat(129)}`)).toBeNull()
    expect(readTokenFromHash(`#token=${TOKEN}%20x`)).toBeNull()
    expect(readTokenFromHash(`#token=<script>alert(1)</script>${TOKEN}`)).toBeNull()
    expect(readTokenFromHash(`#token=${TOKEN}&token=${TOKEN}`)).toBeNull()
  })

  it('accepts other fragment parameters alongside the token', () => {
    expect(readTokenFromHash(`#utm=email&token=${TOKEN}`)).toBe(TOKEN)
  })

  it('is not fooled by a similarly named parameter', () => {
    expect(readTokenFromHash(`#mytoken=${TOKEN}`)).toBeNull()
  })
})

describe('scrubTokenFromUrl', () => {
  it('removes the fragment but keeps the path and query, without adding a history entry', () => {
    const replaceState = vi.fn()
    scrubTokenFromUrl({
      location: { pathname: '/customer/verify-email', search: '?lang=en', hash: `#token=${TOKEN}` },
      history: { state: { a: 1 }, replaceState },
    })
    expect(replaceState).toHaveBeenCalledTimes(1)
    expect(replaceState).toHaveBeenCalledWith({ a: 1 }, '', '/customer/verify-email?lang=en')
  })

  it('does nothing when there is no fragment', () => {
    const replaceState = vi.fn()
    scrubTokenFromUrl({
      location: { pathname: '/customer/verify-email', search: '', hash: '' },
      history: { state: null, replaceState },
    })
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('never throws, even if the browser refuses', () => {
    expect(() => scrubTokenFromUrl({
      location: { pathname: '/x', search: '', hash: '#token=abc' },
      history: { state: null, replaceState: () => { throw new Error('SecurityError') } },
    })).not.toThrow()
  })
})
