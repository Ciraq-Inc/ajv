import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: router, Nuxt globals, user store ──
const route = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return reactive({ query: {} as Record<string, unknown> })
})
vi.mock('vue-router', () => ({ useRoute: () => route }))

const store = vi.hoisted(() => ({ state: null as any }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store.state }))

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))

import CustomerLayout from '~/layouts/customer.vue'

let wrapper: ReturnType<typeof mount> | undefined

const open = async (tab?: string) => {
  route.query = tab ? { tab } : {}
  wrapper = mount(CustomerLayout, {
    attachTo: document.body,
    slots: { default: '<p data-testid="page">Page body</p>' },
    global: { stubs: { ConfirmDialog: true } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  navigateTo.mockReset()
  store.state = {
    currentUser: { fname: 'Prince', lname: 'Boateng', phone: '0244123456', address: '' },
    masterCustomer: null,
    customerAuthToken: '',
    logout: vi.fn(),
    updateProfile: vi.fn(),
  }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('Customer layout: navigation', () => {
  it.each(['new', 'requests', 'wallet', 'orders', 'profile', 'companies', 'stock', 'clearance'])(
    'has no top bar on the %s tab, and still shows the page',
    async (tab) => {
      const w = await open(tab)

      expect(w.find('header').exists()).toBe(false)
      expect(w.find('[data-testid="page"]').exists()).toBe(true)
    },
  )

  it('reaches the account menu from the bottom bar', async () => {
    const w = await open('profile')
    const more = w.find('button[aria-label="More options"]')

    expect(more.attributes('aria-expanded')).toBe('false')
    await more.trigger('click')

    expect(more.attributes('aria-expanded')).toBe('true')
    expect(w.text()).toContain('View Profile')
    expect(w.text()).toContain('Prince Boateng')
    expect(w.text()).toContain('Log Out')
  })

  it('goes home from the bottom bar', async () => {
    const w = await open('profile')

    await w.find('nav button[aria-label="Home"]').trigger('click')

    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'new' } })
  })

  it('has the side menu for larger screens, with Profile and Log out', async () => {
    const w = await open('profile')
    const side = w.find('aside')

    expect(side.text()).toContain('Profile')
    expect(side.text()).toContain('Logout')
  })
})

describe('Customer layout: background', () => {
  it.each(['new', 'profile', 'wallet'])('is plain white on the %s tab', async (tab) => {
    const w = await open(tab)
    const main = w.find('main')

    expect(main.classes()).toContain('bg-white')
    expect(main.classes().some(c => c.includes('gradient') || c.startsWith('from-') || c.startsWith('to-'))).toBe(false)
    expect(w.classes()).toContain('bg-white')
  })
})

describe('Customer layout: look', () => {
  const BAD = /zinc-|emerald-|rose-|slate-|gray-|\bblue-\d|\[#[0-9a-fA-F]{3,6}\]|#[0-9a-fA-F]{6}|text-\[(9|10|11|13)px\]|gradient|red-500|red-600/

  it('uses brand tokens only, with readable text and no gradients', async () => {
    const w = await open('new')
    await w.find('button[aria-label="More options"]').trigger('click')
    expect(document.body.innerHTML).not.toMatch(BAD)
  })

  it('keeps every bottom-bar and side-menu button at least 44px tall', async () => {
    const w = await open('new')
    const buttons = [...w.findAll('nav button')]
    expect(buttons.length).toBeGreaterThan(5)
    for (const b of buttons) expect(b.classes().some(c => c.startsWith('min-h-[44px]'))).toBe(true)
  })

  it('marks the active side-menu item as the current page', async () => {
    const w = await open('wallet')
    const active = w.findAll('aside nav button').filter(b => b.attributes('aria-current') === 'page')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('Wallet')
  })

  it('opens the account menu as a labelled dialog that closes on Escape', async () => {
    const w = await open('profile')
    await w.find('button[aria-label="More options"]').trigger('click')
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement
    expect(dlg.getAttribute('aria-modal')).toBe('true')
    expect(dlg.getAttribute('aria-labelledby')).toBeTruthy()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })
})
