import { describe, expect, it } from 'vitest'
import { canOpenServicePage, companyRoleRank, defaultServicePage, serviceSlugOf } from '../utils/companyAccess'

// What each kind of pharmacy staff sees in the portal. Mirrors the server's role ladder
// (rigel-medsgh src/middlewares/companyRole.js): the server is the real gate, this keeps the
// menu and landing page honest so nobody is sent to a screen that will only say "denied".

describe('companyRoleRank', () => {
  it.each([
    ['cashier', 1], ['Pharmacist', 2], ['manager', 3], ['company', 4], ['Super Admin', 6], ['super-admin', 6],
  ])('%s ranks %i', (role, rank) => {
    expect(companyRoleRank(role)).toBe(rank)
  })

  it('treats a missing or unknown role as no access', () => {
    expect(companyRoleRank(undefined)).toBe(0)
    expect(companyRoleRank('intern')).toBe(0)
  })
})

describe('serviceSlugOf', () => {
  it('reads the page after /services', () => {
    expect(serviceSlugOf('/acme/services/accounts/12')).toBe('accounts')
    expect(serviceSlugOf('/acme/services/orders?x=1')).toBe('orders')
    expect(serviceSlugOf('/acme/services')).toBe('')
  })
})

describe('canOpenServicePage', () => {
  it.each(['riders', 'user-access', 'store-hours', 'developers'])('%s needs a manager', (slug) => {
    expect(canOpenServicePage('cashier', slug)).toBe(false)
    expect(canOpenServicePage('pharmacist', slug)).toBe(false)
    expect(canOpenServicePage('manager', slug)).toBe(true)
    expect(canOpenServicePage('owner', slug)).toBe(true)
  })

  it.each(['orders', 'deliveries', 'wallet', 'accounts', 'sms-campaigns', 'sms-billing', 'monthly-reports'])('%s is open to floor staff', (slug) => {
    expect(canOpenServicePage('cashier', slug)).toBe(true)
  })

  it('keeps a recruiter to the hiring board and the wallet', () => {
    expect(canOpenServicePage('third_party_poster', 'rigel-boards')).toBe(true)
    expect(canOpenServicePage('third_party_poster', 'sms-billing')).toBe(true)
    expect(canOpenServicePage('third_party_poster', 'orders')).toBe(false)
    expect(canOpenServicePage('third_party_poster', 'accounts')).toBe(false)
    expect(canOpenServicePage('third_party_poster', 'riders')).toBe(false)
  })

  it('always lets anyone reach the login and support pages', () => {
    expect(canOpenServicePage('third_party_poster', 'login')).toBe(true)
    expect(canOpenServicePage(undefined, 'support')).toBe(true)
  })
})

describe('defaultServicePage', () => {
  it('lands staff on orders and recruiters on the hiring board', () => {
    expect(defaultServicePage('cashier')).toBe('orders')
    expect(defaultServicePage('manager')).toBe('orders')
    expect(defaultServicePage('third_party_poster')).toBe('rigel-boards')
  })
})
