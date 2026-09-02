import { describe, expect, it } from 'vitest'
import { isSessionError, sessionExpiredMessage } from '../utils/accountsSession'

describe('Accounts session errors', () => {
  it('recognises an expired API session by status', () => {
    expect(isSessionError({ status: 401 })).toBe(true)
    expect(isSessionError({ status: 403 })).toBe(true)
  })

  it('recognises an expired API session by message', () => {
    expect(isSessionError(new Error('Session expired. Please log in again.'))).toBe(true)
    expect(isSessionError(new Error('Could not load accounts'))).toBe(false)
  })

  it('uses a clear account-workspace message', () => {
    expect(sessionExpiredMessage).toBe('Your session has expired. Sign in again to continue.')
  })
})
