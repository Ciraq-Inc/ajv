import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: HTTP (useApi + service), user store, Nuxt globals ──
const api = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('~/composables/useApi', () => ({
  useApi: () => api,
  ApiError: class ApiError extends Error {
    status?: number
    data?: Record<string, unknown>
  },
}))

const service = vi.hoisted(() => ({ getCustomerSettings: vi.fn() }))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({
  createOrderRequestsService: () => service,
}))

const store = vi.hoisted(() => ({ state: null as any }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store.state }))

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('useRoute', () => ({ query: {} }))
vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn() }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

import OrderRequests from '~/components/customers/orderRequests.vue'

let wrapper: ReturnType<typeof mount> | undefined
type W = ReturnType<typeof mount>

const HOME = { home_address: '12 Oak St, Accra', home_latitude: 5.6, home_longitude: -0.2 }
const LIST = [{ id: 7, request_number: 'R-107', status: 'pending', first_item_name: 'Amoxicillin', item_count: 1, created_at: '2020-01-01T10:00:00Z' }]
const DETAIL = { id: 7, request_number: 'R-107', status: 'pending', fulfillment_type: null, items: [{ id: 1, product_name: 'Amoxicillin 500mg', quantity: 2, requested_unit: 'Tablet', item_status: 'pending' }] }
const dlg = (label: string) => document.body.querySelector(`[role="dialog"][aria-labelledby="${label}"]`) as HTMLElement | null
const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
const BAD = /zinc-|emerald-|slate-|gray-|\[#[0-9a-fA-F]{3,6}\]/

const mountWith = async (tab: 'new' | 'list') => {
  store.state.getProfile.mockResolvedValue(HOME)
  service.getCustomerSettings.mockResolvedValue({ data: { request_submission_fee: 5, first_request_free: false } })
  api.request.mockImplementation(async (url: string, opts?: { method?: string }) => {
    if (url === '/api/wallet') return { data: { balance: 20 } }
    if (url === '/api/order-requests/customer') return opts?.method === 'POST' ? { data: { request_number: 'R-1' } } : { data: LIST }
    if (url === '/api/order-requests/customer/7') return opts?.method === 'PUT' ? { data: {} } : { data: DETAIL }
    return { data: {} }
  })
  wrapper = mount(OrderRequests, { props: { defaultSubTab: tab }, attachTo: document.body })
  await flushPromises()
  return wrapper
}
const openEditor = async () => {
  const w = await mountWith('list')
  await w.findAll('button').find(b => b.text().includes('Amoxicillin'))!.trigger('click')
  await flushPromises()
  ;(Array.from(document.body.querySelectorAll('button')).find(b => b.textContent!.includes('Edit items')) as HTMLElement).click()
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  store.state = { currentUser: { phone: '0244123456', email: '' }, masterCustomer: { id: 1 }, customerAuthToken: 'tok', getProfile: vi.fn(), updateProfile: vi.fn(), clearAuthState: vi.fn() }
})
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('Request sent', () => {
  const send = async () => {
    const w = await mountWith('new')
    await w.find('#request-medicine-0').setValue('Paracetamol')
    await w.findAll('button').find(b => b.text().includes('Send Request'))!.trigger('click')
    await flushPromises()
  }

  it('confirms in a labelled dialog with the request number and a big way onward', async () => {
    await send()
    const d = dlg('request-sent-title')!

    expect(d).not.toBeNull()
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(d.querySelector('#request-sent-title')!.textContent).toContain('Request sent')
    expect(d.textContent).toContain('R-1')
    const go = Array.from(d.querySelectorAll('button')).find(b => b.textContent!.includes('View my requests'))!
    expect(go.className).toContain('min-h-[44px]')
    go.click()
    expect(navigateTo).toHaveBeenCalled()
  })

  it('closes with Escape and uses brand tokens', async () => {
    await send()
    expect(dlg('request-sent-title')!.outerHTML).not.toMatch(BAD)
    press('Escape')
    await flushPromises()

    expect(dlg('request-sent-title')).toBeNull()
  })
})

describe('Edit request', () => {
  it('opens as a labelled dialog with named fields and steppers that are easy to hit', async () => {
    await openEditor()
    const d = dlg('edit-request-title')!

    expect(d).not.toBeNull()
    expect(d.querySelector('#edit-request-title')!.textContent).toContain('Edit request')
    expect(d.querySelector('input[aria-label="Medicine 1"]')).not.toBeNull()
    expect(d.querySelector('select[aria-label="Unit for medicine 1"]')).not.toBeNull()
    const more = d.querySelector('button[aria-label="Increase quantity of medicine 1"]')!
    expect(more.className).toContain('h-11')
    expect(d.querySelector('button[aria-label="Close"]')).not.toBeNull()
  })

  it('closes with Escape or Close, and uses brand tokens', async () => {
    await openEditor()
    expect(dlg('edit-request-title')!.outerHTML).not.toMatch(BAD)
    ;(dlg('edit-request-title')!.querySelector('button[aria-label="Close"]') as HTMLElement).click()
    await flushPromises()
    expect(dlg('edit-request-title')).toBeNull()

    await openEditor()
    press('Escape')
    await flushPromises()
    expect(dlg('edit-request-title')).toBeNull()
  })

  it('saves the changes', async () => {
    await openEditor()
    ;(Array.from(dlg('edit-request-title')!.querySelectorAll('button')).find(b => b.textContent!.includes('Save changes')) as HTMLElement).click()
    await flushPromises()

    expect(api.request.mock.calls.some(([u, o]) => u === '/api/order-requests/customer/7' && o?.method === 'PUT')).toBe(true)
  })
})

describe('Messages', () => {
  it('announces an error politely, in brand tokens, with the message', async () => {
    await openEditor()
    const name = dlg('edit-request-title')!.querySelector('input[aria-label="Medicine 1"]') as HTMLInputElement
    name.value = ''
    name.dispatchEvent(new Event('input'))
    ;(Array.from(dlg('edit-request-title')!.querySelectorAll('button')).find(b => b.textContent!.includes('Save changes')) as HTMLElement).click()
    await flushPromises()
    const t = document.body.querySelector('[data-testid="toast"]') as HTMLElement

    expect(t.getAttribute('role')).toBe('alert')
    expect(t.textContent).toContain('Add at least one item')
    expect(t.outerHTML).not.toMatch(BAD)
  })
})
