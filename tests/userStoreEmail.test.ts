import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const service = vi.hoisted(() => ({
  login: vi.fn(),
  requestEmailReset: vi.fn(),
  resetPasswordWithEmailToken: vi.fn(),
  verifyEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  updateProfile: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => service }))
vi.mock('~/services/orders/ordersService', () => ({ createOrdersService: () => ({}) }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => ({}) }))
vi.stubGlobal('useApi', () => ({}))

import { useUserStore } from '../stores/user'

class FakeApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const session = {
  token: 'access-token',
  master_customer: { id: 7, fname: 'Ama', lname: 'Mensah', phone: '+233241234567', email: 'ama@example.com', email_verified: true },
  companies: [],
}

const loggedIn = () => {
  const store = useUserStore()
  store.applyCustomerAuthPayload(session as never)
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})

describe('loginWithEmail', () => {
  it('signs in with the email as typed (trimmed), never treating it as a phone number', async () => {
    service.login.mockResolvedValue({ success: true, data: session })
    const store = useUserStore()
    store.loadUserStats = vi.fn()

    await store.loginWithEmail('  Ama@Example.com ', 'pw-123456')

    expect(service.login).toHaveBeenCalledWith({ email: 'Ama@Example.com', password: 'pw-123456' })
    expect(store.isLoggedIn).toBe(true)
    expect(store.customerAuthToken).toBe('access-token')
    expect(store.masterCustomer?.email_verified).toBe(true)
    expect(store.loadUserStats).toHaveBeenCalled()
  })

  it('stays signed out and rethrows the original error (with its status) when the server refuses', async () => {
    service.login.mockRejectedValue(new FakeApiError('Invalid credentials', 401))
    const store = useUserStore()

    await expect(store.loginWithEmail('ama@example.com', 'wrong')).rejects.toMatchObject({ status: 401 })

    expect(store.isLoggedIn).toBe(false)
    expect(store.customerAuthToken).toBeNull()
    expect(store.isLoading).toBe(false)
  })

  it('treats an unsuccessful envelope as a failure', async () => {
    service.login.mockResolvedValue({ success: false, message: 'Nope' })
    const store = useUserStore()
    await expect(store.loginWithEmail('ama@example.com', 'pw-123456')).rejects.toThrow('Nope')
    expect(store.isLoggedIn).toBe(false)
  })
})

describe('requestEmailReset', () => {
  it('asks for a link for the trimmed address', async () => {
    service.requestEmailReset.mockResolvedValue({ success: true, message: 'If an account exists...' })
    const store = useUserStore()
    await store.requestEmailReset('  ama@example.com ')
    expect(service.requestEmailReset).toHaveBeenCalledWith({ email: 'ama@example.com' })
  })

  it('lets a rate-limit refusal through with its status and wait time intact', async () => {
    const err = Object.assign(new FakeApiError('A reset link was requested recently.', 429), { body: { retry_after_seconds: 42 } })
    service.requestEmailReset.mockRejectedValue(err)
    const store = useUserStore()
    await expect(store.requestEmailReset('ama@example.com')).rejects.toMatchObject({ status: 429, body: { retry_after_seconds: 42 } })
  })
})

describe('resetPasswordWithEmailToken', () => {
  it('hands the token and new password to the service and does not start a session', async () => {
    service.resetPasswordWithEmailToken.mockResolvedValue({ success: true })
    const store = useUserStore()
    await store.resetPasswordWithEmailToken('tok_abcdefghijklmnopqrstuvwxyz', 'New-Passw0rd-1')
    expect(service.resetPasswordWithEmailToken).toHaveBeenCalledWith({ token: 'tok_abcdefghijklmnopqrstuvwxyz', newPassword: 'New-Passw0rd-1' })
    expect(store.isLoggedIn).toBe(false)
  })

  it('rethrows an invalid or expired link', async () => {
    service.resetPasswordWithEmailToken.mockRejectedValue(new FakeApiError('This link is invalid or has expired.', 400))
    const store = useUserStore()
    await expect(store.resetPasswordWithEmailToken('tok_abcdefghijklmnopqrstuvwxyz', 'New-Passw0rd-1')).rejects.toMatchObject({ status: 400 })
  })
})

describe('verifyEmail', () => {
  it('re-reads the signed-in customer from the server once the link is redeemed (the link may belong to another account)', async () => {
    service.verifyEmail.mockResolvedValue({ success: true })
    service.getProfile.mockResolvedValue({ success: true, data: { id: 7, email: 'ama@example.com', email_verified: true } })
    const store = loggedIn()
    store.masterCustomer = { ...store.masterCustomer!, email_verified: false }

    await store.verifyEmail('tok_abcdefghijklmnopqrstuvwxyz')

    expect(service.verifyEmail).toHaveBeenCalledWith({ token: 'tok_abcdefghijklmnopqrstuvwxyz' })
    expect(service.getProfile).toHaveBeenCalled()
    expect(store.masterCustomer?.email_verified).toBe(true)
  })

  it('does NOT mark the signed-in customer verified just because some link worked', async () => {
    service.verifyEmail.mockResolvedValue({ success: true })
    service.getProfile.mockResolvedValue({ success: true, data: { id: 7, email: 'ama@example.com', email_verified: false } })
    const store = loggedIn()
    store.masterCustomer = { ...store.masterCustomer!, email_verified: false }

    await store.verifyEmail('tok_abcdefghijklmnopqrstuvwxyz')

    expect(store.masterCustomer?.email_verified).toBe(false)
  })

  it('still succeeds when the profile refresh fails (the email IS verified)', async () => {
    service.verifyEmail.mockResolvedValue({ success: true })
    service.getProfile.mockRejectedValue(new FakeApiError('offline', 500))
    const store = loggedIn()
    await expect(store.verifyEmail('tok_abcdefghijklmnopqrstuvwxyz')).resolves.toBeDefined()
  })

  it('works when nobody is signed in on this device (link opened on another phone)', async () => {
    service.verifyEmail.mockResolvedValue({ success: true })
    const store = useUserStore()
    await expect(store.verifyEmail('tok_abcdefghijklmnopqrstuvwxyz')).resolves.toBeDefined()
    expect(store.masterCustomer).toBeNull()
    expect(service.getProfile).not.toHaveBeenCalled()
  })

  it('refuses a bad link without touching the session', async () => {
    service.verifyEmail.mockRejectedValue(new FakeApiError('This link is invalid or has expired.', 400))
    const store = loggedIn()
    store.masterCustomer = { ...store.masterCustomer!, email_verified: false }

    await expect(store.verifyEmail('tok_abcdefghijklmnopqrstuvwxyz')).rejects.toMatchObject({ status: 400 })
    expect(service.getProfile).not.toHaveBeenCalled()
    expect(store.masterCustomer?.email_verified).toBe(false)
  })
})

describe('sendEmailVerification', () => {
  it('needs a signed-in customer', async () => {
    const store = useUserStore()
    await expect(store.sendEmailVerification()).rejects.toThrow(/logged in/i)
    expect(service.sendEmailVerification).not.toHaveBeenCalled()
  })

  it('returns the outcome and passes a cooldown refusal through unchanged', async () => {
    const store = loggedIn()
    service.sendEmailVerification.mockResolvedValueOnce({ success: true, status: 'sent' })
    await expect(store.sendEmailVerification()).resolves.toMatchObject({ status: 'sent' })

    service.sendEmailVerification.mockRejectedValueOnce(Object.assign(new FakeApiError('Please wait', 429), { body: { retry_after_seconds: 30 } }))
    await expect(store.sendEmailVerification()).rejects.toMatchObject({ status: 429, body: { retry_after_seconds: 30 } })
  })
})

describe('updateProfile with an email change', () => {
  it('sends the current password but never keeps it, and takes the new verified flag from the response', async () => {
    service.updateProfile.mockResolvedValue({
      success: true,
      data: { id: 7, email: 'new@example.com', email_verified: false },
    })
    const store = loggedIn()

    await store.updateProfile({ email: 'new@example.com', current_password: 'pw-123456' })

    expect(service.updateProfile).toHaveBeenCalledWith({ email: 'new@example.com', current_password: 'pw-123456' })
    expect(store.masterCustomer?.email).toBe('new@example.com')
    expect(store.masterCustomer?.email_verified).toBe(false)
    expect(JSON.stringify(store.masterCustomer)).not.toContain('pw-123456')
    expect(JSON.stringify(Object.values(localStorage))).not.toContain('pw-123456')
  })

  it('keeps the old email when the password is wrong', async () => {
    service.updateProfile.mockRejectedValue(Object.assign(new FakeApiError('Current password is incorrect', 403), { body: { field: 'current_password' } }))
    const store = loggedIn()

    await expect(store.updateProfile({ email: 'new@example.com', current_password: 'nope' })).rejects.toMatchObject({ status: 403 })
    expect(store.masterCustomer?.email).toBe('ama@example.com')
  })
})
