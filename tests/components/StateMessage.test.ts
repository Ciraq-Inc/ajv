import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import StateMessage from '~/components/StateMessage.vue'

describe('StateMessage', () => {
  it('is a polite live region so screen readers hear state changes', () => {
    const root = mount(StateMessage, { props: { state: 'error', heading: 'Oops' } }).find('.state-message')
    expect(root.attributes('role')).toBe('status')
    expect(root.attributes('aria-live')).toBe('polite')
  })

  it('shows the heading and message it is given, and nothing for the ones it is not', () => {
    const w = mount(StateMessage, { props: { state: 'empty', heading: 'No orders yet' } })
    expect(w.find('.state-message-heading').text()).toBe('No orders yet')
    expect(w.find('.state-message-copy').exists()).toBe(false)

    const both = mount(StateMessage, { props: { heading: 'Hi', message: 'Place your first order.' } })
    expect(both.find('.state-message-copy').text()).toBe('Place your first order.')
  })

  it.each(['error', 'empty', 'loading', 'success'] as const)('marks the %s state with a matching class and a decorative icon', (state) => {
    const w = mount(StateMessage, { props: { state } })
    expect(w.find('.state-message').classes()).toContain(`state-message--${state}`)
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('defaults to the empty state', () => {
    expect(mount(StateMessage).find('.state-message').classes()).toContain('state-message--empty')
  })

  it('uses a custom icon in place of the default one', () => {
    const Custom = { render: () => h('svg', { 'data-custom': 'yes' }) }
    const w = mount(StateMessage, { props: { state: 'error', icon: Custom } })
    expect(w.find('[data-custom="yes"]').exists()).toBe(true)
  })

  it('shows an action button only when it has a label, and emits action on click', async () => {
    expect(mount(StateMessage, { props: { state: 'error' } }).find('button').exists()).toBe(false)

    const w = mount(StateMessage, { props: { state: 'error', actionLabel: 'Try again' } })
    await w.find('button').trigger('click')

    expect(w.find('button').text()).toBe('Try again')
    expect(w.emitted('action')).toHaveLength(1)
  })
})
