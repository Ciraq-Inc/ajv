import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

// This component relies on Nuxt auto-imports for ref/computed.
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

const store = vi.hoisted(() => ({ cancelOrder: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => store }))

import CancelOrderModal from '~/components/CancelOrderModal.vue'

let wrapper: ReturnType<typeof mount> | undefined
const open = (props: Record<string, unknown> = {}) => {
  wrapper = mount(CancelOrderModal, { props: { isOpen: true, orderId: 'ORD-123', ...props }, attachTo: document.body })
  return wrapper
}
const button = (w: ReturnType<typeof mount>, text: string) => w.findAll('button').find(b => b.text().includes(text))!

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('CancelOrderModal', () => {
  it('renders nothing while closed', () => {
    expect(open({ isOpen: false }).find('[role="dialog"]').exists()).toBe(false)
  })

  it('is a labelled modal dialog that shows the order number', () => {
    const w = open()
    expect(w.find('[role="dialog"]').attributes('aria-labelledby')).toBe('cancel-order-title')
    expect(w.find('#cancel-order-title').text()).toBe('Cancel Order')
    expect(w.text()).toContain('Order #ORD-123')
  })

  it('shortens long order ids to their last eight characters, and handles a missing id', () => {
    expect(open({ orderId: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef' }).text()).toContain('Order #...567890ef')
    wrapper!.unmount()
    expect(open({ orderId: undefined }).text()).toContain('Order #N/A')
  })

  it('warns that cancelling cannot be undone', () => {
    expect(open().text()).toContain('This action cannot be undone')
  })

  it('only asks for free text when the reason is "Other"', async () => {
    const w = open()
    expect(w.find('#otherReason').exists()).toBe(false)

    await w.find('#cancellationReason').setValue('Other')
    expect(w.find('#otherReason').exists()).toBe(true)

    await w.find('#cancellationReason').setValue('Changed mind')
    expect(w.find('#otherReason').exists()).toBe(false)
  })

  it('"Keep Order" closes the dialog without cancelling anything', async () => {
    const w = open()
    await button(w, 'Keep Order').trigger('click')

    expect(w.emitted('close')).toHaveLength(1)
    expect(store.cancelOrder).not.toHaveBeenCalled()
  })

  describe('confirming', () => {
    it('cancels the order with no reason when none is chosen (the reason is optional)', async () => {
      store.cancelOrder.mockResolvedValue(undefined)
      const w = open()

      await button(w, 'Cancel Order').trigger('click')
      await flushPromises()

      expect(store.cancelOrder).toHaveBeenCalledWith('ORD-123', '')
    })

    it('sends the chosen reason', async () => {
      store.cancelOrder.mockResolvedValue(undefined)
      const w = open()
      await w.find('#cancellationReason').setValue('Taking too long')

      await button(w, 'Cancel Order').trigger('click')
      await flushPromises()

      expect(store.cancelOrder).toHaveBeenCalledWith('ORD-123', 'Taking too long')
    })

    it('sends the typed explanation for "Other", or "Other" when left blank', async () => {
      store.cancelOrder.mockResolvedValue(undefined)
      const typed = open()
      await typed.find('#cancellationReason').setValue('Other')
      await typed.find('#otherReason').setValue('Moving abroad')
      await button(typed, 'Cancel Order').trigger('click')
      await flushPromises()
      expect(store.cancelOrder).toHaveBeenLastCalledWith('ORD-123', 'Moving abroad')
      typed.unmount()

      const blank = open()
      await blank.find('#cancellationReason').setValue('Other')
      await button(blank, 'Cancel Order').trigger('click')
      await flushPromises()
      expect(store.cancelOrder).toHaveBeenLastCalledWith('ORD-123', 'Other')
    })

    it('confirms success, announces the order id, and leaves only a Close button', async () => {
      store.cancelOrder.mockResolvedValue(undefined)
      const w = open()

      await button(w, 'Cancel Order').trigger('click')
      await flushPromises()

      expect(w.text()).toContain('Your order has been successfully cancelled.')
      expect(w.emitted('cancellation-success')![0]).toEqual(['ORD-123'])
      expect(w.findAll('button').map(b => b.text())).toEqual(['Close'])
      expect(w.find('#cancellationReason').exists()).toBe(false)
    })

    it('shows the failure as an alert, stays open, and lets the customer retry', async () => {
      store.cancelOrder.mockRejectedValueOnce(new Error('Order already dispatched'))
      const w = open()

      await button(w, 'Cancel Order').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain('Order already dispatched')
      expect(w.emitted('cancellation-success')).toBeUndefined()
      expect(button(w, 'Cancel Order').attributes('disabled')).toBeUndefined()

      store.cancelOrder.mockResolvedValueOnce(undefined)
      await button(w, 'Cancel Order').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').exists()).toBe(false)
      expect(w.emitted('cancellation-success')).toHaveLength(1)
    })

    it('falls back to a generic message when the error carries none', async () => {
      store.cancelOrder.mockRejectedValue('boom')
      const w = open()

      await button(w, 'Cancel Order').trigger('click')
      await flushPromises()

      expect(w.find('[role="alert"]').text()).toContain('Failed to cancel order. Please try again.')
    })

    it('cannot be submitted twice while the request is in flight', async () => {
      let finish!: () => void
      store.cancelOrder.mockReturnValue(new Promise<void>((res) => { finish = res }))
      const w = open()

      await button(w, 'Cancel Order').trigger('click')
      expect(button(w, 'Processing').attributes('disabled')).toBeDefined()
      await button(w, 'Processing').trigger('click')

      expect(store.cancelOrder).toHaveBeenCalledTimes(1)
      finish()
      await flushPromises()
    })
  })

  it('closes a second after a successful cancellation so the message can be read', async () => {
    vi.useFakeTimers()
    store.cancelOrder.mockResolvedValue(undefined)
    const w = open()
    await button(w, 'Cancel Order').trigger('click')
    await flushPromises()

    await button(w, 'Close').trigger('click')
    expect(w.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(1000)
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('forgets the chosen reason after being dismissed', async () => {
    vi.useFakeTimers()
    const w = open()
    await w.find('#cancellationReason').setValue('Changed mind')

    await button(w, 'Keep Order').trigger('click')
    await vi.advanceTimersByTimeAsync(300)

    expect((w.find('#cancellationReason').element as HTMLSelectElement).value).toBe('')
  })
})
