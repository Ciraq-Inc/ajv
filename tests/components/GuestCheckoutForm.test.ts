import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Mock only the system boundaries: the HTTP service and the cart contents.
const service = vi.hoisted(() => ({ submitAsGuest: vi.fn() }))
const cart = vi.hoisted(() => ({
  items: [] as Array<{ id: number | string; name: string; price: number; quantity: number }>,
}))
vi.mock('~/services/orderRequests/orderRequestsService', () => ({ createOrderRequestsService: () => service }))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))
vi.mock('~/stores/cart', () => ({ useCartStore: () => cart }))

import GuestCheckoutForm from '~/components/GuestCheckoutForm.vue'

let wrapper: ReturnType<typeof mount> | undefined
const open = (isOpen = true) => {
  wrapper = mount(GuestCheckoutForm, { props: { isOpen }, attachTo: document.body })
  return wrapper
}
const submit = async (w: ReturnType<typeof mount>) => {
  await w.find('form').trigger('submit')
  await flushPromises()
}
const buttonByText = (w: ReturnType<typeof mount>, text: string) => w.findAll('button').find(b => b.text() === text)!

beforeEach(() => {
  vi.clearAllMocks()
  cart.items = [
    { id: 11, name: 'Paracetamol 500mg', price: 5, quantity: 2 },
    { id: 'x-9', name: 'Vitamin C', price: 12, quantity: 1 },
  ]
  service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: true, request_number: 'REQ-1' } })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('GuestCheckoutForm', () => {
  it('renders nothing while closed', () => {
    expect(open(false).find('[role="dialog"]').exists()).toBe(false)
  })

  it('is a labelled modal dialog that explains no account is needed', () => {
    const w = open()
    const dialog = w.find('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(w.find(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Continue as guest')
    expect(w.text()).toContain('no account needed')
  })

  it('only allows submitting once a phone number has been typed', async () => {
    const w = open()
    const place = () => w.find('button[type="submit"]')
    expect(place().attributes('disabled')).toBeDefined()

    await w.find('#guest-phone').setValue('   ')
    expect(place().attributes('disabled')).toBeDefined()

    await w.find('#guest-phone').setValue('0244123456')
    expect(place().attributes('disabled')).toBeUndefined()
  })

  describe('placing the request', () => {
    it('sends the cart as requested items with the trimmed phone', async () => {
      const w = open()
      await w.find('#guest-phone').setValue('  0244123456  ')
      await submit(w)

      expect(service.submitAsGuest).toHaveBeenCalledTimes(1)
      expect(service.submitAsGuest).toHaveBeenCalledWith({
        phone: '0244123456',
        items: [
          { product_id: 11, product_name: 'Paracetamol 500mg', quantity: 2 },
          { product_id: 'x-9', product_name: 'Vitamin C', quantity: 1 },
        ],
        customer_address: undefined,
      })
    })

    it('includes the delivery address when given and omits a blank one', async () => {
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await w.find('#guest-address').setValue('  12 Main St, East Legon  ')
      await submit(w)
      expect(service.submitAsGuest.mock.calls[0][0].customer_address).toBe('12 Main St, East Legon')

      await w.setProps({ isOpen: false })
      await w.setProps({ isOpen: true })
      await w.find('#guest-phone').setValue('0244123456')
      await w.find('#guest-address').setValue('   ')
      await submit(w)
      expect(service.submitAsGuest.mock.calls[1][0].customer_address).toBeUndefined()
    })

    it('thanks a new customer and says the SMS carries a link to set up an account', async () => {
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)

      expect(w.find('h3').text()).toBe('Request placed!')
      expect(w.text()).toContain('0244123456')
      expect(w.text()).toContain('set up your account')
      expect(w.emitted('guest-order-success')![0]).toEqual([{ requestNumber: 'REQ-1' }])
      expect(w.find('form').exists()).toBe(false)
    })

    it('tells a returning customer they will get an order confirmation instead', async () => {
      service.submitAsGuest.mockResolvedValue({ success: true, data: { is_new_customer: false, request_number: 'REQ-2' } })
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)

      expect(w.text()).toContain('with your order confirmation.')
      expect(w.text()).not.toContain('set up your account')
    })

    it('shows the server message and keeps the form so the customer can fix the number', async () => {
      service.submitAsGuest.mockResolvedValue({ success: false, message: 'Phone number is invalid' })
      const w = open()
      await w.find('#guest-phone').setValue('12')
      await submit(w)

      expect(w.text()).toContain('Phone number is invalid')
      expect(w.find('form').exists()).toBe(true)
      expect(w.emitted('guest-order-success')).toBeUndefined()
      expect((w.find('#guest-phone').element as HTMLInputElement).value).toBe('12')
    })

    it('falls back to a generic message when the server gives none', async () => {
      service.submitAsGuest.mockResolvedValue({ success: false })
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)

      expect(w.text()).toContain('Failed to place request. Please try again.')
    })

    it('shows a thrown network error', async () => {
      service.submitAsGuest.mockRejectedValue(new Error('Network down'))
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)

      expect(w.text()).toContain('Network down')
    })

    it('locks the form and shows progress while the request is in flight', async () => {
      let finish!: (v: unknown) => void
      service.submitAsGuest.mockReturnValue(new Promise((res) => { finish = res }))
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await w.find('form').trigger('submit')

      expect(w.find('button[type="submit"]').text()).toContain('Placing request…')
      expect(w.find('button[type="submit"]').attributes('disabled')).toBeDefined()
      expect(w.find('#guest-phone').attributes('disabled')).toBeDefined()

      finish({ success: true, data: { is_new_customer: true, request_number: 'R' } })
      await flushPromises()
      expect(w.find('h3').text()).toBe('Request placed!')
    })

    it('clears an old error when the customer tries again', async () => {
      service.submitAsGuest.mockResolvedValueOnce({ success: false, message: 'Try later' })
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)
      expect(w.text()).toContain('Try later')

      await submit(w)
      expect(w.text()).not.toContain('Try later')
    })
  })

  describe('closing and reopening', () => {
    it('closes from the X button, the backdrop and the Done button', async () => {
      const w = open()
      await w.find('button[aria-label="Close"]').trigger('click')
      await w.find('.backdrop-blur-sm').trigger('click')
      expect(w.emitted('close')).toHaveLength(2)

      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)
      await buttonByText(w, 'Done').trigger('click')
      expect(w.emitted('close')).toHaveLength(3)
    })

    it('starts from a clean form every time it opens', async () => {
      const w = open()
      await w.find('#guest-phone').setValue('0244123456')
      await submit(w)
      expect(w.find('h3').text()).toBe('Request placed!')

      await w.setProps({ isOpen: false })
      await w.setProps({ isOpen: true })

      expect(w.find('h3').text()).toBe('Continue as guest')
      expect((w.find('#guest-phone').element as HTMLInputElement).value).toBe('')
    })

    it('hands over to sign-in for customers who already have an account', async () => {
      const w = open()
      await buttonByText(w, 'Sign in').trigger('click')
      expect(w.emitted('show-login')).toHaveLength(1)
    })
  })
})
