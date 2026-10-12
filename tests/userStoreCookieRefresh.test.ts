import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const service = vi.hoisted(() => ({
  endCookieSession: vi.fn(),
  unsubscribePush: vi.fn(),
}))

vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => service }))
vi.mock('~/services/orders/ordersService', () => ({ createOrdersService: () => ({}) }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => ({}) }))
vi.stubGlobal('useApi', () => ({}))

const releaseThisPhone = vi.hoisted(() => vi.fn())
vi.mock('~/composables/usePushNotifications', () => ({ releaseThisPhone, realPushBrowser: () => ({}) }))

;(process as unknown as { client: boolean }).client = true

import { useUserStore } from '../stores/user'

const session = {
  token: 'access-token',
  refresh_token: 'refresh-from-body',
  master_customer: { id: 7, fname: 'Ama', lname: 'Mensah', phone: '+233241234567' },
  companies: [],
}

const setFlag = (on: boolean) =>
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test', cookieRefresh: on } }))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})

describe('customer sign-in with cookie refresh on', () => {
  it('keeps the refresh token out of localStorage', () => {
    setFlag(true)
    useUserStore().applyCustomerAuthPayload(session as never)
    expect(localStorage.getItem('customerRefreshToken')).toBeNull()
    expect(localStorage.getItem('customerAuthToken')).toBe('access-token')
  })

  it('still stores it when cookie refresh is off', () => {
    setFlag(false)
    useUserStore().applyCustomerAuthPayload(session as never)
    expect(localStorage.getItem('customerRefreshToken')).toBe('refresh-from-body')
  })

  it('removes a refresh token left over from before the switch', () => {
    localStorage.setItem('customerRefreshToken', 'stale')
    setFlag(true)
    useUserStore().applyCustomerAuthPayload(session as never)
    expect(localStorage.getItem('customerRefreshToken')).toBeNull()
  })
})

describe('customer sign-out with cookie refresh on', () => {
  it('ends the session on the server so the cookie cannot sign them back in', async () => {
    setFlag(true)
    service.endCookieSession.mockResolvedValue(undefined)
    const store = useUserStore()
    store.applyCustomerAuthPayload(session as never)

    await store.logout()

    expect(service.endCookieSession).toHaveBeenCalledTimes(1)
    expect(store.customerAuthToken).toBeNull()
  })

  it('still signs out locally when the server cannot be reached', async () => {
    setFlag(true)
    service.endCookieSession.mockRejectedValue(new Error('offline'))
    const store = useUserStore()
    store.applyCustomerAuthPayload(session as never)

    await store.logout()

    expect(store.customerAuthToken).toBeNull()
    expect(localStorage.getItem('customerAuthToken')).toBeNull()
  })

  it('does not call the server when cookie refresh is off', async () => {
    setFlag(false)
    const store = useUserStore()
    store.applyCustomerAuthPayload(session as never)

    await store.logout()

    expect(service.endCookieSession).not.toHaveBeenCalled()
  })
})
