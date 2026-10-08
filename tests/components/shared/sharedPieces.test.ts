import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import EmptyState from '~/components/shared/EmptyState.vue'
import SectionHeader from '~/components/shared/SectionHeader.vue'

const Icon = { render: () => h('svg', { 'data-icon': 'x' }) }

describe('EmptyState', () => {
  it('says what is empty and what will appear here', () => {
    const w = mount(EmptyState, { props: { title: 'No requests yet', description: 'Your latest request activity will appear here.', icon: Icon } })

    expect(w.text()).toContain('No requests yet')
    expect(w.text()).toContain('Your latest request activity will appear here.')
  })

  it('hides its decorative icon from screen readers', () => {
    const w = mount(EmptyState, { props: { title: 'Nothing', icon: Icon } })
    expect(w.find('[data-icon]').element.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('works without an icon or description', () => {
    const w = mount(EmptyState, { props: { title: 'Nothing here' } })
    expect(w.text()).toBe('Nothing here')
  })

  it('shows an action when one is given, so the customer is never at a dead end', () => {
    const w = mount(EmptyState, { props: { title: 'No orders' }, slots: { action: '<button>Start a request</button>' } })
    expect(w.find('button').text()).toBe('Start a request')
  })
})

describe('SectionHeader', () => {
  it('shows the title as a heading', () => {
    const w = mount(SectionHeader, { props: { title: 'Activity Stream' } })
    expect(w.find('h2').text()).toBe('Activity Stream')
  })

  it('offers an action link and tells the parent when it is used', async () => {
    const w = mount(SectionHeader, { props: { title: 'Ongoing Orders', actionLabel: 'View All' } })

    await w.find('button').trigger('click')
    expect(w.find('button').text()).toBe('View All')
    expect(w.emitted('action')).toHaveLength(1)
  })

  it('has no button when there is no action', () => {
    const w = mount(SectionHeader, { props: { title: 'Verified Partners' } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('makes the action say which section it belongs to, for screen readers', () => {
    const w = mount(SectionHeader, { props: { title: 'Ongoing Orders', actionLabel: 'View All' } })
    expect(w.find('button').attributes('aria-label')).toBe('View All: Ongoing Orders')
  })
})
