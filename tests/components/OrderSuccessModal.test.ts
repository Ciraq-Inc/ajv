import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const router = vi.hoisted(() => ({ push: vi.fn() }))
const pharmacy = vi.hoisted(() => ({ pharmacyData: { name: 'Rigel Pharmacy' } as { name?: string } | undefined, pharmacySlug: 'rigel' as string | undefined }))
vi.mock('vue-router', () => ({ useRouter: () => router }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => pharmacy }))

import OrderSuccessModal from '~/components/OrderSuccessModal.vue'

const summary = { totalItems: 3, totalQuantity: 7, totalAmount: 125.5 }

let wrapper: ReturnType<typeof mount> | undefined
// The modal teleports to <body>, so query the document rather than the wrapper.
const open = (props: Record<string, unknown> = {}) => {
  wrapper = mount(OrderSuccessModal, { props: { isOpen: true, orderId: 'ORD-1', orderSummary: summary, ...props } })
  return wrapper
}
const dialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null
const press = (text: string) =>
  (Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.trim() === text) as HTMLButtonElement).click()

beforeEach(() => {
  vi.clearAllMocks()
  pharmacy.pharmacyData = { name: 'Rigel Pharmacy' }
  pharmacy.pharmacySlug = 'rigel'
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('OrderSuccessModal', () => {
  it('renders nothing while closed', () => {
    open({ isOpen: false })
    expect(dialog()).toBeNull()
  })

  it('is a labelled modal dialog that celebrates the order with the pharmacy name', () => {
    open()
    expect(dialog()!.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById('order-success-title')!.textContent).toContain('Order Successful!')
    expect(dialog()!.textContent).toContain('placed with Rigel Pharmacy')
  })

  it('falls back to "the pharmacy" when the pharmacy is unknown', () => {
    pharmacy.pharmacyData = undefined
    open()
    expect(dialog()!.textContent).toContain('placed with the pharmacy')
  })

  it('shows the order summary with the amount to two decimals', () => {
    open()
    const text = dialog()!.textContent!.replace(/\s+/g, ' ')
    expect(text).toContain('Total Items:3')
    expect(text).toContain('Total Quantity:7')
    expect(text).toContain('Total Amount:GHS125.50')
  })

  it('shows zeros rather than blanks when there is no summary', () => {
    open({ orderSummary: undefined })
    const text = dialog()!.textContent!.replace(/\s+/g, ' ')
    expect(text).toContain('Total Items:0')
    expect(text).toContain('Total Amount:GHS0.00')
  })

  it('shortens long order ids and shows N/A when missing', () => {
    open({ orderId: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef' })
    expect(dialog()!.textContent).toContain('...567890ef')
    wrapper!.unmount()

    open({ orderId: undefined })
    expect(dialog()!.textContent).toContain('N/A')
  })

  it('"View Order History" closes and goes to the customer account', () => {
    open()
    press('View Order History')

    expect(wrapper!.emitted('close')).toHaveLength(1)
    expect(router.push).toHaveBeenCalledWith('/customer')
  })

  it('"Continue Shopping" closes and returns to the pharmacy storefront', () => {
    open()
    press('Continue Shopping')

    expect(wrapper!.emitted('close')).toHaveLength(1)
    expect(router.push).toHaveBeenCalledWith('/rigel')
  })

  it('"Continue Shopping" just closes when no pharmacy is selected', () => {
    pharmacy.pharmacySlug = undefined
    open()
    press('Continue Shopping')

    expect(wrapper!.emitted('close')).toHaveLength(1)
    expect(router.push).not.toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked', () => {
    open()
    ;(document.body.querySelector('.bg-black') as HTMLElement).click()
    expect(wrapper!.emitted('close')).toHaveLength(1)
  })
})
