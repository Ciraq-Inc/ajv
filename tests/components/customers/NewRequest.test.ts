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

const open = async (opts: { profile?: Record<string, unknown>, balance?: number, settings?: Record<string, unknown> } = {}) => {
  store.state.getProfile.mockResolvedValue(opts.profile ?? HOME)
  service.getCustomerSettings.mockResolvedValue({
    data: { request_submission_fee: 5, first_request_free: false, is_professional: false, ...(opts.settings ?? {}) },
  })
  api.request.mockImplementation(async (url: string) => {
    if (url === '/api/wallet') return { data: { balance: opts.balance ?? 20 } }
    return { data: { request_number: 'R-1' } }
  })
  wrapper = mount(OrderRequests, { props: { defaultSubTab: 'new' }, attachTo: document.body })
  await flushPromises()
  return wrapper
}
const button = (w: W, name: string) => {
  const b = w.findAll('button').find(x => (x.attributes('aria-label') ?? x.text()).includes(name))
  if (!b) throw new Error(`no button "${name}"`)
  return b
}
const sendButton = (w: W) => button(w, 'Send Request')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  store.state = {
    currentUser: { phone: '0244123456', email: '' },
    masterCustomer: { id: 1 },
    customerAuthToken: 'tok',
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    clearAuthState: vi.fn(),
  }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('New request: the form', () => {
  it('asks what the customer needs, as the page heading', async () => {
    const w = await open()

    expect(w.find('h1').text()).toBe('What do you need?')
  })

  it('names the medicine field and lets the customer add another with a visible button', async () => {
    const w = await open()

    expect(w.findAll('input[id^="request-medicine-"]')).toHaveLength(1)
    const add = button(w, 'Add another medication')
    expect(add.text()).toContain('Add another medication')
    await add.trigger('click')

    expect(w.findAll('input[id^="request-medicine-"]')).toHaveLength(2)
  })

  it('every medicine field has a label for screen readers', async () => {
    const w = await open()
    await button(w, 'Add another medication').trigger('click')

    for (const input of w.findAll('input[id^="request-medicine-"]')) {
      expect(w.find(`label[for="${input.attributes('id')}"]`).exists()).toBe(true)
    }
  })

  it('offers unit and quantity once a medicine is named, with labelled steppers', async () => {
    const w = await open()
    expect(w.find('select').exists()).toBe(false)

    await w.find('#request-medicine-0').setValue('Paracetamol')

    expect(w.find('select').exists()).toBe(true)
    const up = button(w, 'Increase quantity of Paracetamol')
    const down = button(w, 'Decrease quantity of Paracetamol')
    expect(down.attributes('disabled')).toBeDefined()
    await up.trigger('click')
    await up.trigger('click')
    expect((w.find('input[type="number"]').element as HTMLInputElement).value).toBe('3')
    await down.trigger('click')
    expect((w.find('input[type="number"]').element as HTMLInputElement).value).toBe('2')
  })

  it('removes a medication by its number', async () => {
    const w = await open()
    await w.find('#request-medicine-0').setValue('Paracetamol')
    await button(w, 'Add another medication').trigger('click')
    await w.find('#request-medicine-1').setValue('Amoxicillin')

    await button(w, 'Remove medication 1').trigger('click')

    const left = w.findAll('input[id^="request-medicine-"]').map(i => (i.element as HTMLInputElement).value)
    expect(left).toEqual(['Amoxicillin'])
  })

  it('shows the saved delivery address, or asks for one', async () => {
    const withAddress = await open()
    expect(withAddress.text()).toContain('12 Oak St, Accra')
    withAddress.unmount()

    const without = await open({ profile: {} })
    expect(without.text()).toContain('Set delivery address')
    expect(without.text()).toContain('Required to continue')
  })
})

describe('New request: sending', () => {
  it('says why it cannot send yet, and stays disabled', async () => {
    const w = await open({ profile: {} })
    const why = () => w.find('#send-why').text()

    expect(sendButton(w).attributes('disabled')).toBeDefined()
    expect(sendButton(w).attributes('aria-describedby')).toBe('send-why')
    expect(why()).toBe('Add a medication or a prescription photo.')

    await w.find('#request-medicine-0').setValue('Paracetamol')
    expect(why()).toBe('Set your delivery address.')
  })

  it('explains a low wallet instead of leaving a dead button', async () => {
    const w = await open({ balance: 1 })
    await w.find('#request-medicine-0').setValue('Paracetamol')

    expect(sendButton(w).attributes('disabled')).toBeDefined()
    expect(w.find('#send-why').text()).toBe('Top up your wallet to send this request.')
  })

  it('sends the request when everything is in place', async () => {
    const w = await open()
    await w.find('#request-medicine-0').setValue('Paracetamol')

    expect(sendButton(w).attributes('disabled')).toBeUndefined()
    expect(w.find('#send-why').exists()).toBe(false)
    await sendButton(w).trigger('click')
    await flushPromises()

    const post = api.request.mock.calls.find(([url, opts]) => url === '/api/order-requests/customer' && opts?.method === 'POST')
    expect(post).toBeTruthy()
    const body = JSON.parse(post![1].body)
    expect(body.items[0].product_name).toBe('Paracetamol')
    expect(body.delivery_address).toBe('12 Oak St, Accra')
  })
})

describe('New request: wallet gate', () => {
  it('covers the form when the wallet is too low, and can be set aside', async () => {
    const w = await open({ balance: 0 })

    expect(w.text()).toContain('Top up to continue')
    await button(w, 'Top Up Wallet').trigger('click')
    expect(navigateTo).toHaveBeenCalledWith({ path: '/customer', query: { tab: 'wallet' } })

    await button(w, 'Continue filling in my request').trigger('click')
    expect(w.text()).not.toContain('Top up to continue')
  })

  it('is not shown when the first request is free', async () => {
    const w = await open({ balance: 0, settings: { first_request_free: true } })

    expect(w.text()).not.toContain('Top up to continue')
    expect(w.text()).toContain('Free')
  })

  it('is not shown, and the send button says Free, while the fee is switched off', async () => {
    const w = await open({ balance: 0, settings: { request_submission_fee: 0 } })

    expect(w.text()).not.toContain('Top up to continue')
    expect(sendButton(w).text()).toContain('Free')
    expect(sendButton(w).text()).not.toContain('GHS')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('New request: address dialog', () => {
  const openDialog = async (w: W) => {
    await w.find('#request-address-title').element.closest('section')!.querySelector('button')!.click()
    await flushPromises()
    return w.find('[role="dialog"]')
  }
  const confirm = (w: W) => button(w, 'Confirm Address')

  it('opens as a labelled dialog, titled for what the customer is doing', async () => {
    const w = await open({ profile: {} })
    const dialog = await openDialog(w)

    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    const title = w.find(`#${dialog.attributes('aria-labelledby')}`)
    expect(title.text()).toBe('Delivery address')
  })

  it('is titled "Update address" when one is already set', async () => {
    const w = await open()
    const dialog = await openDialog(w)

    expect(w.find(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Update address')
  })

  it('closes with Escape, the Close button, or the backdrop', async () => {
    const w = await open()
    await openDialog(w)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(w.find('[role="dialog"]').exists()).toBe(false)

    await openDialog(w)
    await button(w, 'Close').trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(false)

    await openDialog(w)
    await w.find('[data-testid="address-backdrop"]').trigger('click')
    expect(w.find('[role="dialog"]').exists()).toBe(false)
  })

  it('names its fields and explains why Confirm is off', async () => {
    const w = await open({ profile: {} })
    await openDialog(w)

    expect(w.find('label[for="delivery-address-search"]').exists()).toBe(true)
    expect(w.find('label[for="delivery-address-text"]').exists()).toBe(true)
    expect(confirm(w).attributes('disabled')).toBeDefined()
    expect(confirm(w).attributes('aria-describedby')).toBe('address-why')
    expect(w.find('#address-why').text()).toBe('Search for your address, or use your current location.')

    await w.find('#delivery-address-text').setValue('Room 12, Legon')
    expect(w.find('#address-why').text()).toBe('Pick a suggestion or use your location so we can find pharmacies near you.')
  })

  it('fills the address from a search suggestion and lets the customer confirm', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const w = await open({ profile: {} })
      api.request.mockImplementation(async (url: string) => {
        if (url.startsWith('/api/auth/customer/autocomplete-location')) {
          return { data: [{ display_name: 'Legon Hall, University of Ghana, Accra', latitude: 5.65, longitude: -0.18 }] }
        }
        return { data: { balance: 20 } }
      })
      await openDialog(w)

      await w.find('#delivery-address-search').setValue('Legon')
      await vi.advanceTimersByTimeAsync(350)
      await flushPromises()
      const option = w.find('[role="option"]')
      expect(option.text()).toContain('Legon Hall')
      await option.trigger('click')

      expect((w.find('#delivery-address-text').element as HTMLTextAreaElement).value).toContain('Legon Hall')
      expect(confirm(w).attributes('disabled')).toBeUndefined()
      expect(w.find('#address-why').exists()).toBe(false)
      await confirm(w).trigger('click')
      expect(w.find('[role="dialog"]').exists()).toBe(false)
      expect(w.text()).toContain('Delivering to')
    } finally {
      vi.useRealTimers()
    }
  })

  it('tells the customer when their location could not be read', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) =>
          fail({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }),
      },
    })
    const w = await open({ profile: {} })
    await openDialog(w)

    await button(w, 'Use my current location').trigger('click')
    await flushPromises()

    const alert = w.find('[role="alert"]')
    expect(alert.text()).toContain('Location permission is off for this page.')
    expect(alert.text()).toContain('allow location access')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('New request: prescription first, quieter extras', () => {
  it('puts the prescription option ahead of the medication list', async () => {
    const w = await open()
    const headings = w.findAll('h2').map(h => h.text())

    expect(headings.indexOf('Have a prescription?')).toBeGreaterThanOrEqual(0)
    expect(headings.indexOf('Have a prescription?')).toBeLessThan(headings.indexOf('Medications'))
    const card = w.find('[aria-labelledby="request-rx-title"]')
    expect(card.text()).toContain('Take photo')
    expect(card.text()).toContain('Upload prescription')
  })

  it('keeps Take photo and Upload on one row, even on a phone', async () => {
    const w = await open()
    const card = w.find('[aria-labelledby="request-rx-title"]')
    const row = card.find('label').element.parentElement as HTMLElement
    const labels = Array.from(row.querySelectorAll('label')) as HTMLElement[]

    expect(labels).toHaveLength(2)
    expect(row.classList.contains('grid')).toBe(true)
    expect(row.classList.contains('grid-cols-2')).toBe(true)
    expect(row.classList.contains('flex-wrap')).toBe(false)
    for (const l of labels) expect(l.classList.contains('justify-center')).toBe(true)
  })

  it('shows Unit and Quantity labels above the controls once a medicine is named', async () => {
    const w = await open()
    await w.find('#request-medicine-0').setValue('Paracetamol')

    expect(w.find('label[for="request-unit-0"]').text()).toBe('Unit')
    expect(w.find('select#request-unit-0').exists()).toBe(true)
    expect(w.find('label[for="request-qty-0"]').text()).toBe('Quantity')
    expect(w.find('input#request-qty-0').exists()).toBe(true)
  })

  it('keeps Add another medication and Add note as quiet text buttons', async () => {
    const w = await open()

    for (const name of ['Add another medication', 'Add note']) {
      const b = button(w, name)
      expect(b.classes()).not.toContain('bg-ink-100')
      expect(b.classes()).toContain('text-brand-700')
    }
  })

  it('still lets the customer add a note', async () => {
    const w = await open()

    await button(w, 'Add note').trigger('click')

    expect(w.find('label[for="request-notes"]').exists()).toBe(true)
    expect(w.find('textarea#request-notes').exists()).toBe(true)
  })
})

describe('New request: brand purple', () => {
  it('uses brand purple, not black, for the main actions', async () => {
    const w = await open({ balance: 0 })

    expect(sendButton(w).classes()).toContain('bg-brand-700')
    expect(button(w, 'Top Up Wallet').classes()).toContain('bg-brand-700')
    await button(w, 'Continue filling in my request').trigger('click')
    await w.find('#request-address-title').element.closest('section')!.querySelector('button')!.click()
    await flushPromises()
    expect(button(w, 'Confirm Address').classes()).toContain('bg-brand-700')
  })

  it('uses it for the medication numbers and the delivery icon too', async () => {
    const w = await open()

    expect(w.find('li span.rounded-full').classes()).toContain('bg-brand-700')
    expect(w.find('#request-address-title').element.closest('section')!.querySelector('span.rounded-full')!.className).toContain('bg-brand-700')
  })
})

describe('New request: numbering sits inside the field', () => {
  it('puts the number at the start of the medicine box so the fields line up at the edge', async () => {
    const w = await open()
    await w.find('#request-medicine-0').setValue('Paracetamol')
    const input = w.find('#request-medicine-0')
    const box = input.element.parentElement!

    expect(box.className).toContain('relative')
    expect(box.querySelector('[aria-hidden="true"]')!.textContent!.trim()).toBe('1')
    expect(input.classes()).toContain('w-full')
    expect(input.classes()).toContain('pl-14')

    const row = w.find('#request-unit-0').element.closest('.flex-wrap')!
    expect(row.className).not.toContain('pl-11')
    const clearance = w.find('input[type="checkbox"]').element.closest('label')!
    expect(clearance.className).not.toContain('pl-11')
  })

  it('keeps the remove button inside the box too, so nothing narrows the field', async () => {
    const w = await open()
    await button(w, 'Add another medication').trigger('click')
    const box = w.find('#request-medicine-1').element.parentElement!

    expect(box.contains(button(w, 'Remove medication 2').element)).toBe(true)
  })
})

describe('New request: Add note beside Add another medication', () => {
  it('shares one row with Add another medication, and leaves no empty Notes section', async () => {
    const w = await open()
    const add = button(w, 'Add another medication').element
    const note = button(w, 'Add note').element

    expect(add.parentElement).toBe(note.parentElement)
    expect(w.find('#request-extras-title').exists()).toBe(false)
  })

  it('swaps the button for the note field once opened', async () => {
    const w = await open()
    await button(w, 'Add note').trigger('click')

    expect(w.find('textarea#request-notes').exists()).toBe(true)
    expect(w.findAll('button').some(b => b.text() === 'Add note')).toBe(false)
    expect(w.find('#request-extras-title').text()).toContain('Notes')
  })

  it('does not ask an email-only account for a phone number until it chooses delivery', async () => {
    store.state.currentUser = { phone: '', email: 'a@b.co' }
    const w = await open()

    expect(w.find('#request-contact-phone').exists()).toBe(false)
  })
})

describe('New request: delivering to someone else', () => {
  const postedBody = () => {
    const post = api.request.mock.calls.find(([url, opts]) => url === '/api/order-requests/customer' && opts?.method === 'POST')
    return post ? JSON.parse(post[1].body) : null
  }

  it('is not asked here: who receives the order is decided at the delivery step', async () => {
    const w = await open()

    expect(w.text()).not.toContain('Delivering to someone else?')
    expect(w.find('#request-someone-else').exists()).toBe(false)
    expect(w.find('#request-receiver-name').exists()).toBe(false)
  })

  it('sends no receiver with the request', async () => {
    const w = await open()
    await w.find('#request-medicine-0').setValue('Paracetamol')
    await sendButton(w).trigger('click')
    await flushPromises()

    const body = postedBody()
    expect(body).not.toBeNull()
    expect(body).not.toHaveProperty('recipient_name')
    expect(body).not.toHaveProperty('recipient_phone')
  })
})
