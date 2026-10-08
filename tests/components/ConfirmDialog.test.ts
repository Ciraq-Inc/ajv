import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

const base = { isOpen: true, title: 'Log out?', message: 'You will need to sign in again.', confirmText: 'Log out', cancelText: 'Stay' }

let wrapper: ReturnType<typeof mount> | undefined
const open = (props: Record<string, unknown> = {}) => {
  wrapper = mount(ConfirmDialog, { props: { ...base, ...props }, attachTo: document.body })
  return wrapper
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.style.overflow = ''
})

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    expect(open({ isOpen: false }).find('[role="alertdialog"]').exists()).toBe(false)
  })

  it('announces itself as a modal alert dialog labelled by its title and described by its message', () => {
    const w = open()
    const dialog = w.find('[role="alertdialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(w.find(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Log out?')
    expect(w.find(`#${dialog.attributes('aria-describedby')}`).text()).toBe('You will need to sign in again.')
  })

  it('omits the description reference when there is no message', () => {
    const dialog = open({ message: '' }).find('[role="alertdialog"]')
    expect(dialog.attributes('aria-describedby') ?? '').toBe('')
  })

  it('gives each dialog its own ids so two on a page never collide', () => {
    const a = open()
    const idA = a.find('[role="alertdialog"]').attributes('aria-labelledby')
    const b = mount(ConfirmDialog, { props: base, attachTo: document.body })
    const idB = b.find('[role="alertdialog"]').attributes('aria-labelledby')
    b.unmount()

    expect(idA).not.toBe(idB)
  })

  it('emits confirm from the confirm button and close from the cancel button', async () => {
    const w = open()
    const buttons = w.findAll('button')
    const byText = (t: string) => buttons.find(b => b.text() === t)!

    await byText('Log out').trigger('click')
    await byText('Stay').trigger('click')

    expect(w.emitted('confirm')).toHaveLength(1)
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.emitted('confirm')![0]).toEqual([])
  })

  it('closes when the backdrop is clicked but not when the dialog body is', async () => {
    const w = open()

    await w.find('[role="alertdialog"]').trigger('click')
    expect(w.emitted('close')).toBeUndefined()

    await w.trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('closes on Escape without confirming', async () => {
    const w = open({ isOpen: false })
    await w.setProps({ isOpen: true })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(w.emitted('close')).toHaveLength(1)
    expect(w.emitted('confirm')).toBeUndefined()
  })

  it('styles a destructive confirmation in red and a normal one in blue', () => {
    const danger = open({ variant: 'danger' })
    expect(danger.findAll('button').at(-1)!.classes()).toContain('bg-red-600')
    danger.unmount()

    const normal = open()
    expect(normal.findAll('button').at(-1)!.classes()).toContain('bg-sky-600')
  })
})
