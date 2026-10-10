import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const service = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}))

vi.mock('~/services/admin/adminService', () => ({ createAdminService: () => service }))
vi.mock('~/services/admin/webAuthnService', () => ({ createWebAuthnService: () => ({}) }))
vi.mock('~/services/admin/webAuthnRegistrationService', () => ({ createWebAuthnRegistrationService: () => ({}) }))
vi.stubGlobal('useApi', () => ({}))

import { useAdminStore } from '../stores/admin'

const apiError = (status: number, message: string, body: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { status, body: { success: false, message, ...body } })

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('admin store: requestPasswordReset', () => {
  it('succeeds with the server message', async () => {
    service.requestPasswordReset.mockResolvedValue({ success: true, message: 'If an account exists...' })
    const result = await useAdminStore().requestPasswordReset('kissinger')
    expect(service.requestPasswordReset).toHaveBeenCalledWith({ identifier: 'kissinger' })
    expect(result).toMatchObject({ success: true, message: 'If an account exists...' })
  })

  it('tells the admin how long to wait when rate limited', async () => {
    service.requestPasswordReset.mockRejectedValue(apiError(429, 'slow', { retry_after_seconds: 45 }))
    const result = await useAdminStore().requestPasswordReset('kissinger')
    expect(result.success).toBe(false)
    expect(result).toMatchObject({ kind: 'rate_limited' })
    expect((result as { message: string }).message).toContain('45 seconds')
  })

  it('reports an outage as such', async () => {
    service.requestPasswordReset.mockRejectedValue(apiError(503, 'x'))
    expect(await useAdminStore().requestPasswordReset('kissinger')).toMatchObject({ success: false, kind: 'unavailable' })
  })
})

describe('admin store: resetPassword', () => {
  it('succeeds', async () => {
    service.resetPassword.mockResolvedValue({ success: true, message: 'Password reset successful' })
    const result = await useAdminStore().resetPassword('tok_abcdefghijklmnopqrstuvwxyz', 'New-Passw0rd-1')
    expect(service.resetPassword).toHaveBeenCalledWith({ token: 'tok_abcdefghijklmnopqrstuvwxyz', newPassword: 'New-Passw0rd-1' })
    expect(result).toMatchObject({ success: true })
  })

  it('distinguishes an invalid link from a rejected password', async () => {
    service.resetPassword.mockRejectedValueOnce(apiError(400, 'bad', { code: 'INVALID_TOKEN' }))
    expect(await useAdminStore().resetPassword('tok_abcdefghijklmnopqrstuvwxyz', 'New-Passw0rd-1')).toMatchObject({ success: false, kind: 'invalid_link' })

    service.resetPassword.mockRejectedValueOnce(apiError(400, 'Password must be at least 6 characters.'))
    const weak = await useAdminStore().resetPassword('tok_abcdefghijklmnopqrstuvwxyz', 'abc')
    expect(weak).toMatchObject({ success: false, kind: 'rejected', message: 'Password must be at least 6 characters.' })
  })

  it('never throws and never leaks the password into its result', async () => {
    service.resetPassword.mockRejectedValue(new TypeError('Failed to fetch'))
    const result = await useAdminStore().resetPassword('tok_abcdefghijklmnopqrstuvwxyz', 'Super-Secret-Pw-1')
    expect(result).toMatchObject({ success: false, kind: 'network' })
    expect(JSON.stringify(result)).not.toContain('Super-Secret-Pw-1')
  })
})
