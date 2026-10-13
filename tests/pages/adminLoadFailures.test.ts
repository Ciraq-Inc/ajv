import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

// A page that fails to load must say so; an empty table that looks like "no data" sends an admin
// off to fix a problem that is really a dropped connection. The HTTP layer / store / composable
// is the boundary; each page is mounted and read the way an admin sees it.

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
const adminStore = vi.hoisted(() => ({
  isSuperAdmin: true,
  listWebAuthnCredentials: vi.fn(),
  deleteWebAuthnCredential: vi.fn(),
  getWebAuthnRegistrationOptions: vi.fn(),
  verifyWebAuthnRegistration: vi.fn(),
}))
const billing = vi.hoisted(() => ({
  fetchBillingHealth: vi.fn(),
  runReconciliation: vi.fn(),
  fetchBillingIssues: vi.fn(),
  resolveIssue: vi.fn(),
}))

vi.stubGlobal('definePageMeta', vi.fn())
vi.mock('~/composables/useApi', () => ({ useApi: () => http }))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => adminStore }))
vi.mock('~/composables/useSMSBilling', () => ({
  useSMSBilling: () => ({
    billingHealth: ref([{ company_id: 5, company_name: 'Kofi Pharmacy', balance_status: 'MISMATCH', sms_balance: 500 }]),
    billingIssues: ref([]),
    loading: ref(false),
    topUpMoney: vi.fn(),
    adminGetRate: vi.fn(),
    adminPurchaseCredits: vi.fn(),
    smsRate: ref(null),
    activeIssuesCount: ref(0),
    companiesWithIssues: ref(0),
    overallHealthStatus: ref('healthy'),
    ...billing,
  }),
}))

import MasterlistPage from '~/pages/admin/masterlist.vue'
import SecurityPage from '~/pages/admin/security.vue'
import SmsBillingPage from '~/pages/admin/sms-billing.vue'

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
const mountPage = async (page: object) => {
  const wrapper = mount(page, { global: { stubs } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  http.get.mockResolvedValue({ success: true, data: [] })
})

describe('admin master product list: load failures', () => {
  it('says so when the product list cannot be loaded', async () => {
    http.get.mockRejectedValue(new Error('Network down'))

    const wrapper = await mountPage(MasterlistPage)

    expect(wrapper.find('[role="alert"]').text()).toMatch(/could not load/i)
  })

  it('shows no error when everything loads', async () => {
    const wrapper = await mountPage(MasterlistPage)

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})

describe('admin security page: passkeys', () => {
  beforeEach(() => {
    adminStore.listWebAuthnCredentials.mockResolvedValue({
      credentials: [{ id: 1, friendlyName: 'Work laptop' }],
    })
  })

  it('says so when the passkey list cannot be loaded', async () => {
    adminStore.listWebAuthnCredentials.mockRejectedValue(new Error('Network down'))

    const wrapper = await mountPage(SecurityPage)

    expect(wrapper.find('[role="alert"]').text()).toMatch(/could not load your passkeys/i)
  })

  it('keeps the passkey and says why when removing it fails', async () => {
    adminStore.deleteWebAuthnCredential.mockRejectedValue(new Error('Network down'))
    const wrapper = await mountPage(SecurityPage)

    await wrapper.findAll('button').find((b) => /remove/i.test(b.text()))!.trigger('click')
    await wrapper.find('[role="alertdialog"]').findAll('button').find((b) => /yes, remove/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Work laptop')
    expect(wrapper.find('[role="alert"]').text()).toMatch(/not removed/i)
  })
})

describe('admin SMS billing: actions', () => {
  it('lets the money top-up take pesewas, since the backend accepts two decimals', async () => {
    const wrapper = await mountPage(SmsBillingPage)

    await wrapper.findAll('button').find((b) => /top.?up/i.test(b.text()))!.trigger('click')
    await flushPromises()

    const amount = wrapper.find('input[placeholder="e.g., 1000"]')
    expect(amount.exists()).toBe(true)
    expect(amount.attributes('step')).toBe('0.01')
  })

  it('says so when a reconciliation fails', async () => {
    billing.runReconciliation.mockRejectedValue(new Error('Network down'))
    const wrapper = await mountPage(SmsBillingPage)

    await wrapper.findAll('button').find((b) => /reconcile/i.test(b.text()))!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toMatch(/reconciliation failed/i)
  })
})
