import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The one boundary is the HTTP call; every request is recorded as { method, url, body }.
type Sent = { method: string; url: string; body?: Record<string, unknown> }
const net = vi.hoisted(() => {
  const seen: Sent[] = []
  let staff: Array<Record<string, unknown>> = []
  const record = async (url: string, method: string, body?: unknown) => {
    seen.push({ method, url, ...(body ? { body: body as Record<string, unknown> } : {}) })
    if (method === 'GET' && url === '/api/admin/admins') return { success: true, data: staff }
    return { success: true, message: 'ok', data: {} }
  }
  return {
    seen,
    setStaff: (rows: Array<Record<string, unknown>>) => { staff = rows },
    api: {
      request: (url: string, o: { method?: string; body?: unknown } = {}) => record(url, o.method ?? 'GET', o.body),
      get: (url: string) => record(url, 'GET'),
      post: (url: string, data?: unknown) => record(url, 'POST', data),
      put: (url: string, data?: unknown) => record(url, 'PUT', data),
      delete: (url: string) => record(url, 'DELETE'),
    },
  }
})
vi.stubGlobal('useApi', () => net.api)

import { useAdminStore } from '~/stores/admin'
import UserAccess from '~/components/access/userAccessMgt.vue'

const ama = {
  id: 7, username: 'ama', fname: 'Ama', lname: 'Mensah', email: 'ama@medsgh.com', phone: '+233241234567',
  role: 'support_agent', is_active: true, last_login: null, created_at: '2026-10-01T10:00:00Z',
}
const kofi = { ...ama, id: 8, username: 'kofi', fname: 'Kofi', lname: 'Boateng', email: 'kofi@medsgh.com', phone: null }

const open = async () => {
  const wrapper = mount(UserAccess, { global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } } })
  await flushPromises()
  return wrapper
}
const mobileBox = (w: ReturnType<typeof mount>) => w.find('input[type="tel"]')
const writes = () => net.seen.filter((s) => s.method !== 'GET')

beforeEach(() => {
  setActivePinia(createPinia())
  const store = useAdminStore()
  store.admin = { id: 1, username: 'boss', role: 'super_admin' } as never
  net.seen.length = 0
  net.setStaff([ama, kofi])
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('alert', vi.fn())
})

describe('MedsGH staff form: mobile number', () => {
  it('shows each person\'s mobile number in the list, and a dash when there is none', async () => {
    const w = await open()
    const rows = w.findAll('tbody tr')
    expect(rows[0]!.text()).toContain('+233241234567')
    expect(rows[1]!.text()).not.toContain('+233')
    expect(w.find('thead').text()).toMatch(/mobile/i)
  })

  it('adding a person sends the mobile number typed in the form', async () => {
    const w = await open()
    await w.find('.section-header .btn-primary').trigger('click')
    const [fname, lname, username] = w.findAll('.modal input[type="text"]')
    await fname!.setValue('Esi')
    await lname!.setValue('Owusu')
    await username!.setValue('esi')
    await w.find('.modal input[type="email"]').setValue('esi@medsgh.com')
    await mobileBox(w).setValue('024 123 4567')
    await w.find('.modal select').setValue('support_agent')
    await w.find('.modal input[type="password"]').setValue('Quartz-Meadow-Lantern-7421!')
    await w.find('.modal form').trigger('submit')
    await flushPromises()

    expect(writes()).toHaveLength(1)
    expect(writes()[0]).toMatchObject({ method: 'POST', url: '/api/admin/admins', body: { username: 'esi', phone: '024 123 4567' } })
  })

  it('editing someone opens with their current number filled in', async () => {
    const w = await open()
    await w.findAll('button[title="Edit"]')[0]!.trigger('click')
    expect((mobileBox(w).element as HTMLInputElement).value).toBe('+233241234567')
  })

  it('editing someone with no number opens with an empty box, not the word "null"', async () => {
    const w = await open()
    await w.findAll('button[title="Edit"]')[1]!.trigger('click')
    expect((mobileBox(w).element as HTMLInputElement).value).toBe('')
  })

  it('changing the number saves it for that person', async () => {
    const w = await open()
    await w.findAll('button[title="Edit"]')[0]!.trigger('click')
    await mobileBox(w).setValue('055 770 6385')
    await w.find('.modal form').trigger('submit')
    await flushPromises()

    expect(writes()).toHaveLength(1)
    expect(writes()[0]).toMatchObject({ method: 'PUT', url: '/api/admin/admins/7', body: { phone: '055 770 6385' } })
  })

  it('emptying the box sends an empty number so the server clears it', async () => {
    const w = await open()
    await w.findAll('button[title="Edit"]')[0]!.trigger('click')
    await mobileBox(w).setValue('')
    await w.find('.modal form').trigger('submit')
    await flushPromises()

    expect(writes()[0]!.body).toMatchObject({ phone: '' })
  })

  it('opening Add after editing someone does not carry their number over', async () => {
    const w = await open()
    await w.findAll('button[title="Edit"]')[0]!.trigger('click')
    await w.find('.close-btn').trigger('click')
    await w.find('.section-header .btn-primary').trigger('click')
    expect((mobileBox(w).element as HTMLInputElement).value).toBe('')
  })

  it('searching by number finds the person', async () => {
    const w = await open()
    await w.find('.search-input').setValue('241234567')
    const rows = w.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text()).toContain('Ama')
  })
})
