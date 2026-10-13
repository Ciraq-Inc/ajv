import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const ROLE_RANK: Record<string, number> = {
  data_consumer: 0, business_analyst: 1, order_processor: 2, support_agent: 3,
  auditor: 4, manager: 5, admin: 6, super_admin: 7,
}

const route = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return reactive({ path: '/admin/data', query: {} as Record<string, unknown> })
})
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }))

const store = vi.hoisted(() => ({ state: null as any }))
const attention = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn() }))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => store.state }))
vi.mock('~/composables/useAttentionQueue', async () => {
  const { ref } = await import('vue')
  return {
    useAttentionQueue: () => ({
      attentionQueue: ref([]), soundMuted: ref(false), start: attention.start, stop: attention.stop, acknowledge: vi.fn(),
    }),
  }
})
vi.stubGlobal('navigateTo', vi.fn())

import AdminLayout from '~/layouts/admin-layout.vue'

const NuxtLinkStub = {
  props: ['to'],
  template: '<a :href="to" v-bind="$attrs"><slot /></a>',
}

let wrapper: ReturnType<typeof mount> | undefined
const openAs = async (role: string) => {
  store.state = {
    admin: { fname: 'Test', lname: 'Admin', role },
    getRole: role,
    hasRole: (required: string) => ROLE_RANK[role] >= ROLE_RANK[required],
  }
  wrapper = mount(AdminLayout, {
    attachTo: document.body,
    slots: { default: '<p>Page</p>' },
    global: { stubs: { NuxtLink: NuxtLinkStub } },
  })
  await flushPromises()
  return wrapper
}
const links = () => (wrapper as ReturnType<typeof mount>).findAll('a.nav-item').map((a) => a.attributes('href'))
const sectionTitles = () => (wrapper as ReturnType<typeof mount>).findAll('.nav-section-title').map((t) => t.text())

beforeEach(() => {
  attention.start.mockClear()
  route.path = '/admin/data'
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('admin sidebar follows the role floors', () => {
  it('shows a super admin every settings page', async () => {
    await openAs('super_admin')

    expect(links()).toEqual(expect.arrayContaining([
      '/admin/platform-settings', '/admin/fee-schedules', '/admin/sms-settings', '/admin/sms-billing',
      '/admin/signups', '/admin/professionals', '/admin/store-settings',
    ]))
  })

  it('links every page the sidebar offers, so no entry is lost to a missing floor', async () => {
    await openAs('super_admin')

    expect(links().filter((href) => href?.startsWith('/admin/'))).toHaveLength(23)
  })

  it('hides pages above an admin from an admin', async () => {
    await openAs('admin')
    const shown = links()

    expect(shown).toEqual(expect.arrayContaining(['/admin/professionals', '/admin/store-settings', '/admin/signups']))
    for (const hidden of ['/admin/platform-settings', '/admin/fee-schedules', '/admin/sms-settings', '/admin/sms-billing', '/admin/sms-usage', '/admin/sms-campaigns']) {
      expect(shown).not.toContain(hidden)
    }
  })

  it('shows an order processor the order desk but not management pages', async () => {
    await openAs('order_processor')
    const shown = links()

    expect(shown).toEqual(expect.arrayContaining([
      '/admin/fulfillment/requests', '/admin/fulfillment/deliveries', '/admin/fulfillment/pharmacy-ledger', '/admin/customers',
    ]))
    for (const hidden of ['/admin/signups', '/admin/professionals', '/admin/discounts', '/admin/developers', '/admin/useraccess', '/admin/store-settings']) {
      expect(shown).not.toContain(hidden)
    }
  })

  it('shows a business analyst only the pages with no floor', async () => {
    await openAs('business_analyst')
    const shown = links()

    expect(shown).toEqual(expect.arrayContaining(['/admin/data', '/admin/masterlist', '/admin/clearance-sale', '/admin/security']))
    expect(shown).not.toContain('/admin/fulfillment/requests')
    expect(shown).not.toContain('/admin/customers')
  })

  it('drops a section heading when nothing under it is allowed', async () => {
    await openAs('business_analyst')
    const titles = sectionTitles()

    expect(titles).not.toContain('Operations')
    expect(titles).not.toContain('SMS')
    expect(titles).toContain('Analytics')
  })

  it('polls the order-request feed only for roles that may read it', async () => {
    await openAs('business_analyst')
    expect(attention.start).not.toHaveBeenCalled()
    wrapper?.unmount()

    await openAs('order_processor')
    expect(attention.start).toHaveBeenCalledTimes(1)
  })
})
