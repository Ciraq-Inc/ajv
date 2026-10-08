import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'

// ── Boundaries: user store, router, Nuxt globals, HTTP service ──────────────
const store = vi.hoisted(() => ({ isLoggedIn: false, checkAuthState: vi.fn() }))
vi.mock('~/stores/user', async () => {
  const { reactive } = await import('vue')
  const state = reactive(store)
  return { useUserStore: () => state }
})
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({
  createOrderRequestsService: () => ({ submitAsGuest: vi.fn(), reverseGeocode: vi.fn(), geocodeAddress: vi.fn() }),
}))
// The real Login card has its own tests; here it is a probe that records how the page drives it.
vi.mock('~/components/Login.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      props: { isOpen: Boolean, inline: Boolean, initialView: String },
      emits: ['login-success', 'close'],
      setup(props, { emit }) {
        return () => (props.inline || props.isOpen)
          ? h('div', { 'data-testid': props.inline ? 'login-inline' : 'login-modal', 'data-view': props.initialView }, [
              h('button', { 'data-testid': 'login-done', onClick: () => emit('login-success', {}) }, 'done'),
              h('button', { 'data-testid': 'login-done-new', onClick: () => emit('login-success', { destination: 'new' }) }, 'done-new'),
            ])
          : null
      },
    }),
  }
})

const route = reactive<{ query: Record<string, unknown> }>({ query: {} })
const navigateTo = vi.fn()
vi.stubGlobal('useRoute', () => route)
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
;(process as unknown as { client: boolean }).client = true

import HomePage from '~/pages/index.vue'
import { useUserStore } from '~/stores/user'

const DRAFT_KEY = 'medsgh_homepage_request_draft'

// A physical click fires mousedown then click; Radix tabs activate on mousedown.
const press = async (el: { trigger: (e: string) => Promise<void> }) => {
  await el.trigger('mousedown')
  await el.trigger('click')
}

const open = async (query: Record<string, unknown> = {}, loggedIn = false) => {
  route.query = query
  ;(useUserStore() as { isLoggedIn: boolean }).isLoggedIn = loggedIn
  const wrapper = mount(HomePage, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  sessionStorage.clear()
  document.body.innerHTML = ''
  store.checkAuthState.mockResolvedValue(undefined)
})

describe('home page: sign-in area', () => {
  it('shows a loading skeleton until the stored session has been checked', async () => {
    let finish!: () => void
    store.checkAuthState.mockReturnValue(new Promise<void>((res) => { finish = res }))
    route.query = {}
    store.isLoggedIn = false
    const wrapper = mount(HomePage, { attachTo: document.body })
    await nextTick()

    expect(wrapper.find('[aria-label="Loading sign-in form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="login-inline"]').exists()).toBe(false)

    finish()
    await flushPromises()

    expect(wrapper.find('[aria-label="Loading sign-in form"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="login-inline"]').exists()).toBe(true)
  })

  it('checks the session exactly once on arrival', async () => {
    await open()
    expect(store.checkAuthState).toHaveBeenCalledTimes(1)
  })

  it('leads with the headline and the account sign-up card for a logged-out visitor', async () => {
    const wrapper = await open()

    expect(wrapper.find('h1').text()).toBe('Order any medication online.')
    expect(wrapper.find('[data-testid="login-inline"]').attributes('data-view')).toBe('signup')
    expect(wrapper.find('#hero-medications').isVisible()).toBe(false)
  })

  it('switches between "Create account" and "Quick request"', async () => {
    const wrapper = await open()
    const tab = (label: string) => wrapper.findAll('button').find(b => b.text() === label)!

    await press(tab('Quick request'))
    expect(wrapper.find('#hero-medications').isVisible()).toBe(true)
    expect(wrapper.find('[data-testid="login-inline"]').exists()).toBe(false)

    await press(tab('Create account'))
    expect(wrapper.find('[data-testid="login-inline"]').exists()).toBe(true)
    expect(wrapper.find('#hero-medications').isVisible()).toBe(false)
  })

  it('keeps what the visitor typed when they peek at the other tab and come back', async () => {
    const wrapper = await open()
    const tab = (label: string) => wrapper.findAll('button').find(b => b.text() === label)!
    await press(tab('Quick request'))
    await wrapper.find('#hero-medications').setValue('Paracetamol 500mg')
    await wrapper.find('#hero-phone').setValue('0244123456')

    await press(tab('Create account'))
    await press(tab('Quick request'))

    expect((wrapper.find('#hero-medications').element as HTMLTextAreaElement).value).toBe('Paracetamol 500mg')
    expect((wrapper.find('#hero-phone').element as HTMLInputElement).value).toBe('0244123456')
  })

  it('opens the sign-in view of the card when a quick-request visitor already has an account', async () => {
    const wrapper = await open()
    await press(wrapper.findAll('button').find(b => b.text() === 'Quick request')!)

    await wrapper.findAll('button').find(b => b.text() === 'Sign in')!.trigger('click')

    expect(wrapper.find('[data-testid="login-inline"]').attributes('data-view')).toBe('login')
  })
})

describe('home page: after signing in', () => {
  it('sends the new user to their account', async () => {
    const wrapper = await open()
    await wrapper.find('[data-testid="login-done"]').trigger('click')
    await flushPromises()
    expect(navigateTo).toHaveBeenCalledWith('/customer')
  })

  it('sends them to the new-request form when the login asks for it', async () => {
    const wrapper = await open()
    await wrapper.find('[data-testid="login-done-new"]').trigger('click')
    await flushPromises()
    expect(navigateTo).toHaveBeenCalledWith('/customer?tab=new')
  })

  it('sends them to the new-request form when a request draft is waiting', async () => {
    const wrapper = await open()
    sessionStorage.setItem(DRAFT_KEY, '{"items":[]}')
    await wrapper.find('[data-testid="login-done"]').trigger('click')
    await flushPromises()
    expect(navigateTo).toHaveBeenCalledWith('/customer?tab=new')
  })

  it('keeps the requestId so the order they came for is opened', async () => {
    const wrapper = await open({ requestId: '42' })
    await wrapper.find('[data-testid="login-done"]').trigger('click')
    await flushPromises()
    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { requestId: '42' } })
  })
})

describe('home page: visitors who are already signed in', () => {
  it('skips the homepage and goes to the account (replacing history)', async () => {
    await open({}, true)
    expect(navigateTo).toHaveBeenCalledWith('/customer', { replace: true })
  })

  it('goes to the new-request form when a draft is waiting', async () => {
    sessionStorage.setItem(DRAFT_KEY, '{"items":[]}')
    await open({}, true)
    expect(navigateTo).toHaveBeenCalledWith('/customer?tab=new', { replace: true })
  })

  it('goes to the requested order when the link carries a requestId', async () => {
    await open({ requestId: '7' }, true)
    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { requestId: '7' } }, { replace: true })
  })

  it('does not redirect a logged-out visitor', async () => {
    await open()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('redirects as soon as the user logs in while the page is open', async () => {
    await open()
    ;(useUserStore() as { isLoggedIn: boolean }).isLoggedIn = true
    await flushPromises()
    expect(navigateTo).toHaveBeenCalledWith('/customer', { replace: true })
  })
})

describe('home page: logout notice', () => {
  it('confirms the logout with an alert and cleans the address bar', async () => {
    const wrapper = await open({ logged_out: '1' })

    expect(wrapper.find('[role="alert"]').text()).toContain('You have been logged out.')
    expect(navigateTo).toHaveBeenCalledWith({ path: '/', query: {} }, { replace: true })
  })

  it('dismisses the notice after four seconds', async () => {
    vi.useFakeTimers()
    route.query = { logged_out: '1' }
    store.isLoggedIn = false
    const wrapper = mount(HomePage, { attachTo: document.body })
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(4000)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows no notice on a normal visit', async () => {
    const wrapper = await open()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})

describe('home page: arriving from the Clearance Marketplace', () => {
  const param = (items: unknown[]) => JSON.stringify({ items })

  it('opens the quick-request card pre-filled with the chosen items', async () => {
    const wrapper = await open({
      clearance_draft: param([{ product_name: 'Amoxicillin 500mg', requested_unit: 'capsule', quantity: 2, prefer_clearance_only: true }]),
    })

    expect(wrapper.find('#hero-medications').exists()).toBe(false)
    expect(wrapper.text()).toContain('Amoxicillin 500mg')
    expect(wrapper.text()).toContain('Clearance pricing')
    expect(wrapper.find('#hero-phone').exists()).toBe(true)
  })

  it('remembers the selection so it survives signing in', async () => {
    await open({ clearance_draft: param([{ product_name: 'Amoxicillin 500mg', quantity: 1 }]) })

    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY)!)
    expect(saved.source).toBe('ros-clearance-marketplace')
    expect(saved.items).toHaveLength(1)
  })

  it('ignores a malformed link and shows the normal sign-up card', async () => {
    const wrapper = await open({ clearance_draft: '{not json' })

    expect(wrapper.find('[data-testid="login-inline"]').exists()).toBe(true)
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('ignores a link whose items have no product names', async () => {
    const wrapper = await open({ clearance_draft: param([{ quantity: 3 }, '  ']) })

    expect(wrapper.find('[data-testid="login-inline"]').exists()).toBe(true)
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('never lets a quantity drop below one', async () => {
    const wrapper = await open({ clearance_draft: param([{ product_name: 'Zinc', quantity: -5 }]) })
    const qty = wrapper.find('li span.w-5')
    expect(qty.text()).toBe('1')
  })
})

describe('home page: hero picture', () => {
  it('shows the hero photo as a mirrored backdrop behind the hero', async () => {
    const wrapper = await open()
    const img = wrapper.find('img[src="/hero_image.jpg"]')

    expect(img.exists()).toBe(true)
    expect(img.classes()).toContain('-scale-x-100')
    expect(img.classes()).toContain('absolute')
    expect(img.classes()).toContain('opacity-20')
    // The JPG has a white fade baked into its left 30%; the oversized box pushes it out of view.
    expect(img.classes()).toContain('w-[143%]')
    expect(img.classes()).toContain('max-w-none')
    // Anchor to the top so the pharmacist's head is never cropped.
    expect(img.classes()).toContain('object-top')
    // Starts below the floating navbar so the head isn't hidden behind it.
    expect(img.classes()).toContain('top-20')
    expect(img.attributes('alt')).toBe('')
  })

  it('uses the full-frame desktop photo from the lg breakpoint up, hiding the older one there', async () => {
    const wrapper = await open()
    const desktop = wrapper.find('img[src="/hero_desktop.jpg"]')
    const older = wrapper.find('img[src="/hero_image.jpg"]')

    expect(desktop.exists()).toBe(true)
    expect(desktop.classes()).toEqual(expect.arrayContaining(['hidden', 'lg:block', 'absolute', '-scale-x-100', 'opacity-20', 'object-top', 'top-20']))
    // This photo has no baked-in fade, so it fills the section without oversizing.
    expect(desktop.classes()).not.toContain('w-[143%]')
    expect(desktop.attributes('alt')).toBe('')
    expect(older.classes()).toContain('lg:hidden')
  })
})

describe('home page: sign-in card', () => {
  it('has no extra panel wrapped around the tabs and form', async () => {
    const wrapper = await open()
    const tablist = wrapper.find('[role="tablist"]').element
    const wrapperPanel = tablist.closest('div.shadow-lift, div.ring-1')

    expect(wrapperPanel).toBeNull()
  })
})

describe('home page: content', () => {
  it('has the sections the navbar links to', async () => {
    const wrapper = await open()
    expect(wrapper.find('#how-it-works').exists()).toBe(true)
    expect(wrapper.find('#support').exists()).toBe(true)
  })

  it('links to the privacy policy and a contact email in the footer', async () => {
    const wrapper = await open()
    expect(wrapper.find('footer a[href="/privacy"]').exists()).toBe(true)
    expect(wrapper.find('footer a[href^="mailto:"]').exists()).toBe(true)
  })

  it('shows the current year in the copyright line', async () => {
    const wrapper = await open()
    expect(wrapper.find('footer').text()).toContain(`© ${new Date().getFullYear()} MedsGh`)
  })
})
