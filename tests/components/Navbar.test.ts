import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: router, user store, Nuxt global ─────────────────────────────
const route = vi.hoisted(() => ({ path: '/drugs' }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

const store = vi.hoisted(() => ({
  isLoggedIn: false,
  currentUser: null as null | Record<string, string>,
  currentCompany: null as null | Record<string, string>,
  hasMultipleCompanies: false,
  companyCount: 0,
  logout: vi.fn(),
}))
vi.mock('~/stores/user', async () => {
  const { reactive } = await import('vue')
  const state = reactive(store)
  return { useUserStore: () => state }
})

// The real Login card has its own tests; here it just reports whether it is open.
vi.mock('~/components/Login.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      props: { isOpen: Boolean },
      emits: ['close', 'login-success'],
      setup(props, { emit }) {
        return () => props.isOpen
          ? h('div', { 'data-testid': 'login-modal' }, [
              h('button', { 'data-testid': 'login-ok', onClick: () => emit('login-success', {}) }, 'ok'),
              h('button', { 'data-testid': 'login-ok-new', onClick: () => emit('login-success', { destination: 'new' }) }, 'ok-new'),
              h('button', { 'data-testid': 'login-close', onClick: () => emit('close') }, 'close'),
            ])
          : null
      },
    }),
  }
})

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)

import Navbar from '~/components/Navbar.vue'
import { useUserStore } from '~/stores/user'

const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const state = () => useUserStore() as unknown as typeof store

let wrapper: ReturnType<typeof mount> | undefined
const mountNav = () => {
  wrapper = mount(Navbar, { attachTo: document.body, global: { stubs: { NuxtLink, 'nuxt-link': NuxtLink } } })
  return wrapper
}
const loginAs = (user: Record<string, string>, extra: Partial<typeof store> = {}) => Object.assign(state(), { isLoggedIn: true, currentUser: user, ...extra })
const clickText = async (w: ReturnType<typeof mount>, tag: string, text: string) => {
  const el = w.findAll(tag).find(e => e.text().includes(text))
  if (!el) throw new Error(`no <${tag}> containing "${text}"`)
  await el.trigger('click')
}

beforeEach(() => {
  vi.clearAllMocks()
  route.path = '/drugs'
  Object.assign(state(), { isLoggedIn: false, currentUser: null, currentCompany: null, hasMultipleCompanies: false, companyCount: 0 })
  store.logout.mockResolvedValue(undefined)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('Navbar: navigation', () => {
  it('links the brand to the homepage', () => {
    const brand = mountNav().find('a[href="/"]')
    expect(brand.text()).toContain('MedsGh')
  })

  it('offers every public destination, with section links pointing into the homepage', () => {
    const hrefs = mountNav().findAll('nav a').map(a => [a.text(), a.attributes('href')])
    expect(hrefs).toEqual([
      ['Home', '/'],
      ['Products', '/drugs'],
      ['How It Works', '/#how-it-works'],
      ['Support', '/#support'],
      ['For Pharmacies', '/#for-pharmacies'],
      ['Jobs', '/jobs'],
    ])
  })

  it('shows the support phone number and a WhatsApp contact button', () => {
    const w = mountNav()
    expect(w.find('a[href="tel:+233599368632"]').text()).toContain('599-368-632')
    const whatsapp = w.find('a[href^="https://wa.me/"]')
    expect(whatsapp.attributes('target')).toBe('_blank')
    expect(whatsapp.attributes('rel')).toContain('noopener')
  })

  it('uses the same support number in the mobile menu as on desktop', async () => {
    const w = mountNav()
    await w.find('button .ri-menu-line').element.parentElement!.click()
    await flushPromises()

    const numbers = new Set(w.findAll('a[href^="tel:"]').map(a => a.attributes('href')))
    const whatsapps = new Set(w.findAll('a[href^="https://wa.me/"]').map(a => a.attributes('href')))
    expect([...numbers]).toEqual(['tel:+233599368632'])
    expect([...whatsapps]).toEqual(['https://wa.me/+233599368632'])
  })
})

describe('Navbar: logged-out visitor', () => {
  it('hides the Login button on the homepage, where the sign-up card already is', () => {
    route.path = '/'
    expect(mountNav().findAll('button').some(b => b.text() === 'Login')).toBe(false)
  })

  it('shows Login on other pages and opens the sign-in modal', async () => {
    const w = mountNav()
    expect(w.find('[data-testid="login-modal"]').exists()).toBe(false)

    await clickText(w, 'button', 'Login')

    expect(w.find('[data-testid="login-modal"]').exists()).toBe(true)
  })

  it('closes the sign-in modal again', async () => {
    const w = mountNav()
    await clickText(w, 'button', 'Login')
    await w.find('[data-testid="login-close"]').trigger('click')
    expect(w.find('[data-testid="login-modal"]').exists()).toBe(false)
  })

  it('takes a customer to their account after signing in', async () => {
    const w = mountNav()
    await clickText(w, 'button', 'Login')
    await w.find('[data-testid="login-ok"]').trigger('click')

    expect(navigateTo).toHaveBeenCalledWith('/customer')
    expect(w.find('[data-testid="login-modal"]').exists()).toBe(false)
  })

  it('takes them to the new-request form when sign-in asked for it', async () => {
    const w = mountNav()
    await clickText(w, 'button', 'Login')
    await w.find('[data-testid="login-ok-new"]').trigger('click')

    expect(navigateTo).toHaveBeenCalledWith('/customer?tab=new')
  })
})

describe('Navbar: signed-in customer', () => {
  const user = { fname: 'Ama', lname: 'Mensah', phone: '+233244123456', email: 'ama@example.com' }

  it('replaces Login with an account button showing their first name', () => {
    loginAs(user)
    const w = mountNav()
    expect(w.findAll('button').some(b => b.text() === 'Login')).toBe(false)
    expect(w.find('.profile-menu-container button').text()).toContain('Ama')
  })

  it('falls back to "Account" when no name is known', () => {
    loginAs({})
    expect(mountNav().find('.profile-menu-container button').text()).toContain('Account')
  })

  it('opens a menu with full name, formatted phone, and account links', async () => {
    loginAs(user)
    const w = mountNav()
    await w.find('.profile-menu-container button').trigger('click')

    const menu = w.find('.profile-menu-container')
    expect(menu.text()).toContain('Ama Mensah')
    expect(menu.text()).toContain('+233 24 412 3456')
    expect(menu.findAll('a').map(a => a.attributes('href'))).toEqual(['/customer', '/customer?tab=orders'])
  })

  it('shows the email when there is no phone number', async () => {
    loginAs({ ...user, phone: '' })
    const w = mountNav()
    await w.find('.profile-menu-container button').trigger('click')
    expect(w.find('.profile-menu-container').text()).toContain('ama@example.com')
  })

  it('lists linked companies only for customers who have more than one', async () => {
    loginAs(user, { hasMultipleCompanies: true, companyCount: 3, currentCompany: { company_name: 'Rigel Pharmacy' } })
    const w = mountNav()
    await w.find('.profile-menu-container button').trigger('click')

    const menu = w.find('.profile-menu-container')
    expect(menu.text()).toContain('Linked Companies (3)')
    expect(menu.text()).toContain('Rigel Pharmacy')
    expect(menu.findAll('a').map(a => a.attributes('href'))).toContain('/customer?tab=companies')
  })

  it('closes the account menu when the customer clicks elsewhere', async () => {
    vi.useFakeTimers()
    loginAs(user)
    const w = mountNav()
    await vi.advanceTimersByTimeAsync(150)
    await w.find('.profile-menu-container button').trigger('click')
    expect(w.find('.profile-menu-container').text()).toContain('Ama Mensah')

    document.body.click()
    await flushPromises()

    expect(w.find('.profile-menu-container').text()).not.toContain('Ama Mensah')
  })

  describe('logging out', () => {
    const openLogoutConfirm = async () => {
      loginAs(user)
      const w = mountNav()
      await w.find('.profile-menu-container button').trigger('click')
      await clickText(w, 'button', 'Logout')
      return w
    }

    it('asks for confirmation first and does not log out yet', async () => {
      const w = await openLogoutConfirm()

      expect(w.find('[role="alertdialog"]').exists()).toBe(true)
      expect(w.text()).toContain('Log out?')
      expect(store.logout).not.toHaveBeenCalled()
    })

    it('"Stay Here" keeps them signed in', async () => {
      const w = await openLogoutConfirm()
      await clickText(w, '[role="alertdialog"] button', 'Stay Here')

      expect(w.find('[role="alertdialog"]').exists()).toBe(false)
      expect(store.logout).not.toHaveBeenCalled()
    })

    it('confirming logs out and returns to the homepage with a logged_out notice', async () => {
      const w = await openLogoutConfirm()
      await clickText(w, '[role="alertdialog"] button', 'Log Out')
      await flushPromises()

      expect(store.logout).toHaveBeenCalledTimes(1)
      expect(w.find('[role="alertdialog"]').exists()).toBe(false)
      const arg = navigateTo.mock.calls[0][0]
      expect(arg.path).toBe('/')
      expect(arg.query.logged_out).toMatch(/^\d+$/)
    })

    it('stays put, still signed in, when the logout call fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      store.logout.mockRejectedValue(new Error('network'))
      const w = await openLogoutConfirm()
      await clickText(w, '[role="alertdialog"] button', 'Log Out')
      await flushPromises()

      expect(navigateTo).not.toHaveBeenCalled()
      expect(w.find('[role="alertdialog"]').exists()).toBe(true)
    })
  })
})

describe('Navbar: mobile menu', () => {
  const toggle = (w: ReturnType<typeof mount>) => w.find('i.ri-menu-line, i.ri-close-line').element.parentElement!

  it('is closed at first and toggles open and shut', async () => {
    const w = mountNav()
    expect(w.text()).not.toContain('Contact Us on WhatsApp')

    toggle(w).click()
    await flushPromises()
    expect(w.text()).toContain('Contact Us on WhatsApp')

    toggle(w).click()
    await flushPromises()
    expect(w.text()).not.toContain('Contact Us on WhatsApp')
  })

  it('closes after a destination is chosen', async () => {
    const w = mountNav()
    toggle(w).click()
    await flushPromises()

    // the mobile menu is the second set of links in the DOM
    await w.findAll('a').filter(a => a.text() === 'Jobs').at(-1)!.trigger('click')
    await flushPromises()

    expect(w.text()).not.toContain('Contact Us on WhatsApp')
  })

  it('offers account links and logout to a signed-in customer', async () => {
    loginAs({ fname: 'Ama', lname: 'Mensah', phone: '+233244123456' })
    const w = mountNav()
    toggle(w).click()
    await flushPromises()

    expect(w.text()).toContain('My Account')
    expect(w.text()).toContain('My Orders')
    expect(w.text()).toContain('My Pharmacies')
  })
})

describe('Navbar: lifecycle', () => {
  it('stops listening to scroll once removed from the page', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const w = mountNav()
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything())

    w.unmount()
    wrapper = undefined
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
