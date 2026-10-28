import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Destructive admin actions ask on the page (not with the browser's confirm()), do nothing until the
// admin agrees, and do nothing if the admin backs out. The HTTP layer is the boundary.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
const adminStore = vi.hoisted(() => ({
  isSuperAdmin: true,
  listWebAuthnCredentials: vi.fn(),
  deleteWebAuthnCredential: vi.fn(),
}))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.mock('~/composables/useApi', () => ({ useApi: () => http }))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => adminStore }))

import DevelopersPage from '~/pages/admin/developers.vue'
import FeeSchedulesPage from '~/pages/admin/fee-schedules.vue'
import MasterlistPage from '~/pages/admin/masterlist.vue'
import SecurityPage from '~/pages/admin/security.vue'

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
const nativeConfirm = vi.fn(() => true)
let wrapper: ReturnType<typeof mount> | undefined

const open = async (page: object) => {
  wrapper = mount(page, { global: { stubs } })
  await flushPromises()
  return wrapper
}
const dialog = () => (wrapper as ReturnType<typeof mount>).find('[role="alertdialog"]')
const answer = async (label: RegExp) => {
  const button = dialog().findAll('button').find((b) => label.test(b.text()))!
  await button.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('confirm', nativeConfirm)
  http.get.mockResolvedValue({ success: true, data: [] })
  http.delete.mockResolvedValue({ success: true })
  http.post.mockResolvedValue({ success: true })
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('developers: revoking a platform key', () => {
  const key = { id: 7, key_name: 'POS sync', description: '', is_active: true, scopes: null, rate_limit_tier: 'free' }
  const revoke = () => (wrapper as ReturnType<typeof mount>).find('button[title="Revoke"]')

  beforeEach(() => http.get.mockResolvedValue({ success: true, data: [key] }))

  it('asks first and revokes nothing until the admin agrees', async () => {
    await open(DevelopersPage)

    await revoke().trigger('click')

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(dialog().text()).toContain('POS sync')
    expect(http.delete).not.toHaveBeenCalled()
  })

  it('revokes the key once confirmed', async () => {
    await open(DevelopersPage)
    await revoke().trigger('click')

    await answer(/revoke/i)

    expect(http.delete).toHaveBeenCalledWith('/api/admin/api-keys/7')
    expect(dialog().exists()).toBe(false)
  })

  it('leaves the key alone when the admin cancels', async () => {
    await open(DevelopersPage)
    await revoke().trigger('click')

    await answer(/cancel/i)

    expect(http.delete).not.toHaveBeenCalled()
    expect(dialog().exists()).toBe(false)
  })
})

describe('security: removing a passkey', () => {
  beforeEach(() => adminStore.listWebAuthnCredentials.mockResolvedValue({ credentials: [{ id: 1, friendlyName: 'Work laptop' }] }))
  const remove = () => (wrapper as ReturnType<typeof mount>).findAll('button').find((b) => /remove/i.test(b.text()))!

  it('asks first, then removes only after the admin agrees', async () => {
    adminStore.deleteWebAuthnCredential.mockResolvedValue({ success: true })
    await open(SecurityPage)

    await remove().trigger('click')
    expect(adminStore.deleteWebAuthnCredential).not.toHaveBeenCalled()
    expect(nativeConfirm).not.toHaveBeenCalled()

    await answer(/remove/i)
    expect(adminStore.deleteWebAuthnCredential).toHaveBeenCalledWith(1)
  })

  it('keeps the passkey when the admin cancels', async () => {
    await open(SecurityPage)
    await remove().trigger('click')

    await answer(/cancel/i)

    expect(adminStore.deleteWebAuthnCredential).not.toHaveBeenCalled()
    expect((wrapper as ReturnType<typeof mount>).text()).toContain('Work laptop')
  })
})

describe('fee schedules: publishing and deleting tiers', () => {
  const draft = () => ({
    id: 3, name: 'Q4 draft', status: 'draft', is_draft: true, is_active: false, currency: 'GHS',
    tiers: [{ id: 11, from_km: 0, fee_ghs: 10, label: '' }],
  })
  beforeEach(() => {
    http.get.mockImplementation(async (url: string) =>
      url === '/api/fee-schedules' ? { success: true, data: [draft()] } : { success: true, data: draft() })
  })
  const openDraft = async () => {
    await open(FeeSchedulesPage)
    await (wrapper as ReturnType<typeof mount>).find('button.schedule-row').trigger('click')
    await flushPromises()
  }

  it('publishes only after the admin agrees', async () => {
    await openDraft()

    await (wrapper as ReturnType<typeof mount>).findAll('button').find((b) => b.text() === 'Publish')!.trigger('click')
    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(dialog().text()).toContain('Q4 draft')
    expect(http.post).not.toHaveBeenCalled()

    await answer(/publish/i)
    expect(http.post).toHaveBeenCalledWith('/api/fee-schedules/3/publish', {})
  })

  it('deletes a tier only after the admin agrees', async () => {
    await openDraft()

    await (wrapper as ReturnType<typeof mount>).findAll('button').find((b) => b.text() === 'Delete')!.trigger('click')
    expect(http.delete).not.toHaveBeenCalled()

    await answer(/delete/i)
    expect(http.delete).toHaveBeenCalledWith('/api/fee-schedules/3/tiers/11')
  })

  it('does not delete a tier when the admin cancels', async () => {
    await openDraft()
    await (wrapper as ReturnType<typeof mount>).findAll('button').find((b) => b.text() === 'Delete')!.trigger('click')

    await answer(/cancel/i)

    expect(http.delete).not.toHaveBeenCalled()
  })
})

describe('master products: removing an image', () => {
  const product = { id: 5, product_name: 'Paracetamol', product_image_url: 'https://img.test/p.png' }
  beforeEach(() => http.get.mockImplementation(async (url: string) =>
    url === '/api/master-products' ? { success: true, data: [product], total: 1 } : { success: true, data: [] }))

  it('removes the image only after the admin agrees', async () => {
    await open(MasterlistPage)
    await (wrapper as ReturnType<typeof mount>).find('button[aria-label="Remove image"]').trigger('click')
    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()

    await answer(/remove/i)
    expect(http.post).toHaveBeenCalledWith('/api/master-products/remove-image', { productId: 5, imageUrl: 'https://img.test/p.png' })
  })
})
