import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guardAdminCalls } from '../../composables/useAdminGuarded'

const session = { token: 'admin-token' as string | null, logout: vi.fn() }
const service = {
  list: vi.fn(async (filter: string) => ({ success: true, filter })),
  failWith: vi.fn(async (error: unknown) => { throw error }),
}
const guarded = () => guardAdminCalls(service, session)

beforeEach(() => {
  vi.clearAllMocks()
  session.token = 'admin-token'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('an admin who is signed in', () => {
  it('gets the service’s answer, and the arguments reach the service untouched', async () => {
    await expect(guarded().list('open')).resolves.toEqual({ success: true, filter: 'open' })
    expect(service.list).toHaveBeenCalledWith('open')
  })

  it('stays signed in when a call fails for an ordinary reason, and sees the original error', async () => {
    const boom = Object.assign(new Error('Server error'), { status: 500 })
    await expect(guarded().failWith(boom)).rejects.toBe(boom)
    expect(session.logout).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith('Auth request error:', boom)
  })

  it('is signed out, with a clear message, when the server says the session has expired', async () => {
    await expect(guarded().failWith(Object.assign(new Error('Unauthorized'), { status: 401 }))).rejects.toThrow('Session expired. Please login again.')
    expect(session.logout).toHaveBeenCalledTimes(1)
  })
})

describe('with no admin signed in', () => {
  it('sends nothing to the server', async () => {
    session.token = null
    await expect(guarded().list('open')).rejects.toThrow('No authentication token available')
    expect(service.list).not.toHaveBeenCalled()
    expect(session.logout).not.toHaveBeenCalled()
  })

  it('looks at the session on every call, so a later sign-in is picked up', async () => {
    session.token = null
    const calls = guarded()
    await expect(calls.list('a')).rejects.toThrow()
    session.token = 'fresh'
    await expect(calls.list('b')).resolves.toMatchObject({ filter: 'b' })
  })
})
