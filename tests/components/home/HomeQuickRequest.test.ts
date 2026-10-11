import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Mock only the system boundary: the HTTP service.
const service = vi.hoisted(() => ({
  submitAsGuest: vi.fn(),
  reverseGeocode: vi.fn(),
  geocodeAddress: vi.fn(),
}))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({
  createOrderRequestsService: () => service,
}))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))

import HomeQuickRequest from '~/components/home/HomeQuickRequest.vue'

const DRAFT_KEY = 'medsgh_homepage_request_draft'

const mountCard = (props: Record<string, unknown> = {}) =>
  mount(HomeQuickRequest, { props: { draftItems: [], ...props }, attachTo: document.body })

const fill = async (wrapper: ReturnType<typeof mountCard>, meds: string, phone: string) => {
  await wrapper.find('#hero-medications').setValue(meds)
  await wrapper.find('#hero-phone').setValue(phone)
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  document.body.innerHTML = ''
})

describe('HomeQuickRequest', () => {
  it('keeps small text readable: nothing in the form is text-xs or faint ink', () => {
    const wrapper = mountCard()
    expect(wrapper.html()).not.toMatch(/(?<![\w:-])(text-xs|text-ink-300|text-ink-400)(?![\w-])/)
  })

  it('keeps the submit button disabled until there is a medication and a phone number', async () => {
    const wrapper = mountCard()
    const submit = wrapper.find('button[type="submit"]')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.find('#hero-medications').setValue('Paracetamol 500mg')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.find('#hero-phone').setValue('0244123456')
    expect(submit.attributes('disabled')).toBeUndefined()
  })

  it('splits the freeform list on new lines and sends each as quantity 1', async () => {
    service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
    const wrapper = mountCard()
    await fill(wrapper, 'Paracetamol 500mg\n\n  Vitamin C  \n', '  0244123456 ')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(service.submitAsGuest).toHaveBeenCalledTimes(1)
    expect(service.submitAsGuest).toHaveBeenCalledWith({
      phone: '0244123456',
      items: [
        { product_name: 'Paracetamol 500mg', quantity: 1 },
        { product_name: 'Vitamin C', quantity: 1 },
      ],
      customer_address: undefined,
      customer_latitude: undefined,
      customer_longitude: undefined,
    })
  })

  it('keeps a comma inside one line as one medicine', async () => {
    service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
    const wrapper = mountCard()
    await fill(wrapper, 'Amoxicillin 500mg, capsules', '0244123456')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(service.submitAsGuest.mock.calls[0][0].items).toEqual([
      { product_name: 'Amoxicillin 500mg, capsules', quantity: 1 },
    ])
  })

  it('tells the visitor to put each medicine on its own line', () => {
    const wrapper = mountCard()
    const box = wrapper.find('#hero-medications')
    const hint = wrapper.find(`#${box.attributes('aria-describedby')}`)

    expect(hint.text()).toBe('Put each medicine on its own line.')
  })

  it('confirms the request and tells a new customer to set up their account', async () => {
    service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
    const wrapper = mountCard()
    await fill(wrapper, 'Ibuprofen', '0244123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Request sent')
    expect(wrapper.text()).not.toContain('Request sent!')
    expect(wrapper.text()).not.toContain('→')
    expect(wrapper.text()).toContain('0244123456')
    expect(wrapper.text()).toContain('with a link to set up your account.')
    expect(wrapper.text()).toContain('Create your account')
    expect(wrapper.text()).not.toContain('Your account is ready')
  })

  it('tells a returning customer their order details are on the way', async () => {
    service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: false } })
    const wrapper = mountCard()
    await fill(wrapper, 'Ibuprofen', '0244123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('with your order details.')
    expect(wrapper.text()).toContain('Sign in to track your order')
  })

  it('shows the server message and stays on the form when the request is rejected', async () => {
    service.submitAsGuest.mockResolvedValue({ success: false, message: 'Phone number is invalid' })
    const wrapper = mountCard()
    await fill(wrapper, 'Ibuprofen', '12')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Phone number is invalid')
    expect(wrapper.text()).not.toContain('Request sent')
    expect(wrapper.find('#hero-phone').exists()).toBe(true)
  })

  it('shows the thrown error message when the network call fails', async () => {
    service.submitAsGuest.mockRejectedValue(new Error('Network down'))
    const wrapper = mountCard()
    await fill(wrapper, 'Ibuprofen', '0244123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Network down')
  })

  it('lets the visitor send another request after success', async () => {
    service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
    const wrapper = mountCard()
    await fill(wrapper, 'Ibuprofen', '0244123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const again = wrapper.findAll('button').find(b => b.text() === 'Send another')!
    await again.trigger('click')

    expect(wrapper.find('#hero-medications').exists()).toBe(true)
    expect((wrapper.find('#hero-medications').element as HTMLTextAreaElement).value).toBe('')
  })

  describe('with items carried over from the Clearance Marketplace', () => {
    const draft = [
      { product_name: 'Amoxicillin 500mg', requested_unit: 'capsule', quantity: 2, prefer_clearance_only: true },
    ]

    it('lists the items with clearance pricing instead of the freeform box', () => {
      const wrapper = mountCard({ draftItems: draft })

      expect(wrapper.find('#hero-medications').exists()).toBe(false)
      expect(wrapper.text()).toContain('Amoxicillin 500mg')
      expect(wrapper.text()).toContain('Clearance pricing')
    })

    it('asks the parent to change a quantity, never dropping below one', async () => {
      const wrapper = mountCard({ draftItems: draft })
      const inc = wrapper.findAll('button').find(b => b.text() === '+')!
      await inc.trigger('click')

      expect(wrapper.emitted('update:draftItems')![0][0]).toEqual([{ ...draft[0], quantity: 3 }])

      const single = mountCard({ draftItems: [{ ...draft[0], quantity: 1 }] })
      const dec = single.findAll('button').find(b => b.text() === '−')!
      expect(dec.attributes('disabled')).toBeDefined()
    })

    it('keeps every control on the item row a 44px touch target', () => {
      const wrapper = mountCard({ draftItems: draft })

      for (const label of ['Decrease quantity', 'Increase quantity', 'Remove item']) {
        const classes = wrapper.find(`button[aria-label="${label}"]`).classes()
        expect(classes, label).toContain('h-11')
        expect(classes, label).toContain('w-11')
      }
    })

    it('sends the draft items (with the clearance flag) and clears the saved draft on success', async () => {
      service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
      sessionStorage.setItem(DRAFT_KEY, '{"items":[]}')
      const wrapper = mountCard({ draftItems: draft })
      await wrapper.find('#hero-phone').setValue('0244123456')

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(service.submitAsGuest.mock.calls[0][0].items).toEqual(draft)
      expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull()
      expect(wrapper.emitted('update:draftItems')!.at(-1)![0]).toEqual([])
    })
  })

  describe('handing over to sign-in / sign-up', () => {
    it('offers sign in from the form', async () => {
      const wrapper = mountCard()
      await wrapper.findAll('button').find(b => b.text() === 'Sign in')!.trigger('click')
      expect(wrapper.emitted('switch-view')![0]).toEqual(['login'])
    })

    it('sends a new customer to sign-up from the success screen', async () => {
      service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
      const wrapper = mountCard()
      await fill(wrapper, 'Ibuprofen', '0244123456')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      await wrapper.findAll('button').find(b => b.text().startsWith('Create your account'))!.trigger('click')
      expect(wrapper.emitted('switch-view')![0]).toEqual(['signup'])
    })
  })

  describe('delivery location', () => {
    it('labels the address box so a screen reader announces it', () => {
      const wrapper = mountCard()
      const label = wrapper.findAll('label').find(l => l.text().startsWith('Delivery location'))!

      expect(label.attributes('for')).toBe('hero-address')
      expect(wrapper.find('#hero-address').attributes('role')).toBe('combobox')
    })

    it('lets the visitor pick a suggestion with the keyboard', async () => {
      vi.useFakeTimers()
      service.geocodeAddress.mockResolvedValue({ data: [
        { display_name: 'East Legon, Accra', lat: 5.63, lng: -0.15 },
        { display_name: 'East Airport, Accra', lat: 5.6, lng: -0.17 },
      ] })
      const wrapper = mountCard()
      const input = wrapper.find('#hero-address')

      await input.setValue('East')
      await vi.advanceTimersByTimeAsync(500)
      expect(input.attributes('aria-expanded')).toBe('true')

      await input.trigger('keydown', { key: 'ArrowDown' })
      await input.trigger('keydown', { key: 'ArrowDown' })
      const active = input.attributes('aria-activedescendant')!
      expect(wrapper.find(`#${active}`).text()).toBe('East Airport, Accra')

      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.text()).toContain('East Airport, Accra')
      expect(wrapper.find('#hero-address').exists()).toBe(false)
      vi.useRealTimers()
    })

    it('closes the suggestions on Escape without choosing one', async () => {
      vi.useFakeTimers()
      service.geocodeAddress.mockResolvedValue({ data: [{ display_name: 'East Legon, Accra', lat: 5.63, lng: -0.15 }] })
      const wrapper = mountCard()
      const input = wrapper.find('#hero-address')

      await input.setValue('East')
      await vi.advanceTimersByTimeAsync(500)
      await input.trigger('keydown', { key: 'Escape' })

      expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
      expect(wrapper.find('#hero-address').exists()).toBe(true)
      vi.useRealTimers()
    })

    it('searches addresses after three characters and attaches the chosen one to the request', async () => {
      vi.useFakeTimers()
      service.geocodeAddress.mockResolvedValue({ data: [{ display_name: 'East Legon, Accra', lat: 5.63, lng: -0.15 }] })
      service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true } })
      const wrapper = mountCard()
      await fill(wrapper, 'Ibuprofen', '0244123456')

      await wrapper.find('#hero-address').setValue('Ea')
      await vi.advanceTimersByTimeAsync(500)
      expect(service.geocodeAddress).not.toHaveBeenCalled()

      await wrapper.find('#hero-address').setValue('East Leg')
      await vi.advanceTimersByTimeAsync(500)
      expect(service.geocodeAddress).toHaveBeenCalledWith('East Leg')

      await wrapper.find('[role="option"]').trigger('mousedown')
      expect(wrapper.text()).toContain('East Legon, Accra')

      await wrapper.find('form').trigger('submit')
      await vi.runOnlyPendingTimersAsync()
      expect(service.submitAsGuest.mock.calls[0][0]).toMatchObject({
        customer_address: 'East Legon, Accra',
        customer_latitude: 5.63,
        customer_longitude: -0.15,
      })
      vi.useRealTimers()
    })
  })
})
