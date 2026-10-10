import { describe, expect, it, vi } from 'vitest'
import { createCustomerAuthService } from '../services/customerAuth/customerAuthService'

const fakeApi = () => ({
  get: vi.fn().mockResolvedValue({ success: true }),
  post: vi.fn().mockResolvedValue({ success: true }),
  put: vi.fn().mockResolvedValue({ success: true }),
  delete: vi.fn().mockResolvedValue({ success: true }),
})

// The services are typed against ApiInstance; the fake only needs the verbs these tests use.
const make = () => {
  const api = fakeApi()
  return { api, service: createCustomerAuthService(api as never) }
}

describe('customer auth service: email', () => {
  it('logs in with a phone exactly as before', async () => {
    const { api, service } = make()
    await service.login({ phone: '+233241234567', password: 'pw-123456' })
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/login', { phone: '+233241234567', password: 'pw-123456' })
  })

  it('logs in with an email and sends no phone field at all (the API rejects both)', async () => {
    const { api, service } = make()
    await service.login({ email: 'ama@example.com', password: 'pw-123456' })
    const [, body] = api.post.mock.calls[0]
    expect(body).toStrictEqual({ email: 'ama@example.com', password: 'pw-123456' })
  })

  it('redeems an email-verification token', async () => {
    const { api, service } = make()
    await service.verifyEmail({ token: 'tok_abcdefghijklmnopqrstuvwxyz' })
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/email/verify', { token: 'tok_abcdefghijklmnopqrstuvwxyz' })
  })

  it('asks for a (new) verification email for the signed-in customer', async () => {
    const { api, service } = make()
    await service.sendEmailVerification()
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/email/send-verification', {})
  })

  it('requests a password-reset link by email', async () => {
    const { api, service } = make()
    await service.requestEmailReset({ email: 'ama@example.com' })
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/forgot-password', { email: 'ama@example.com' })
  })

  it('sets a new password from an emailed token, using the API field names', async () => {
    const { api, service } = make()
    await service.resetPasswordWithEmailToken({ token: 'tok_abcdefghijklmnopqrstuvwxyz', newPassword: 'New-Passw0rd-1' })
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/email/reset-password', {
      token: 'tok_abcdefghijklmnopqrstuvwxyz',
      new_password: 'New-Passw0rd-1',
    })
  })

  it('passes current_password through on a profile update (needed to change the email)', async () => {
    const { api, service } = make()
    await service.updateProfile({ email: 'new@example.com', current_password: 'pw-123456' })
    expect(api.put).toHaveBeenCalledWith('/api/auth/customer/profile', { email: 'new@example.com', current_password: 'pw-123456' })
  })
})

describe('customer auth service: email sign-up', () => {
  it('asks for a sign-up code by email', async () => {
    const { api, service } = make()
    await service.sendSignupEmailCode({ email: 'ama@example.com' })
    expect(api.post).toHaveBeenCalledWith('/api/auth/customer/email/send-signup-code', { email: 'ama@example.com' })
  })

  it('registers with an email and code and sends no phone field at all', async () => {
    const { api, service } = make()
    await service.registerWithEmail({ fname: 'Ama', lname: 'Mensah', email: 'ama@example.com', otp: '123456', password: 'Pw-123456' })
    const [path, body] = api.post.mock.calls[0]
    expect(path).toBe('/api/auth/customer/register')
    expect(body).toStrictEqual({ fname: 'Ama', lname: 'Mensah', email: 'ama@example.com', otp: '123456', password: 'Pw-123456' })
  })

  it('links the new account to a company when one is given', async () => {
    const { api, service } = make()
    await service.registerWithEmail({ companyId: 5, fname: 'A', lname: 'B', email: 'a@b.co', otp: '123456', password: 'Pw-123456' })
    expect(api.post.mock.calls[0][1]).toMatchObject({ company_id: 5 })
  })
})
