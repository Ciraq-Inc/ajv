import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// happy-dom has no layout engine; make scroll-reveal render its content immediately.
vi.stubGlobal('IntersectionObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})

import HomeFaq from '~/components/home/HomeFaq.vue'
import HomeStats from '~/components/home/HomeStats.vue'
import HomeHowItWorks from '~/components/home/HomeHowItWorks.vue'
import HomeTrust from '~/components/home/HomeTrust.vue'
import { FAQS } from '~/components/home/content'

describe('HomeFaq', () => {
  it('is the #support anchor the navbar links to', () => {
    const wrapper = mount(HomeFaq, { attachTo: document.body })
    expect(wrapper.find('section#support').exists()).toBe(true)
    wrapper.unmount()
  })

  it('lists every question as a button, with only the first answer open', async () => {
    const wrapper = mount(HomeFaq, { attachTo: document.body })
    await flushPromises()
    const triggers = wrapper.findAll('button[aria-expanded]')

    expect(triggers).toHaveLength(FAQS.length)
    expect(triggers.map(t => t.text())).toEqual(FAQS.map(f => f.question))
    expect(triggers[0].attributes('aria-expanded')).toBe('true')
    expect(triggers[1].attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).toContain(FAQS[0].answer)
    expect(wrapper.text()).not.toContain(FAQS[1].answer)
    wrapper.unmount()
  })

  it('opens a question on click and closes the previous one', async () => {
    const wrapper = mount(HomeFaq, { attachTo: document.body })
    const triggers = wrapper.findAll('button[aria-expanded]')

    await triggers[1].trigger('click')
    await flushPromises()

    expect(triggers[1].attributes('aria-expanded')).toBe('true')
    expect(triggers[0].attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).toContain(FAQS[1].answer)
    wrapper.unmount()
  })
})

describe('HomeStats', () => {
  it('shows the four headline figures as a definition list', () => {
    const wrapper = mount(HomeStats)
    const terms = wrapper.findAll('dt').map(t => t.text())
    const values = wrapper.findAll('dd').map(d => d.text())

    expect(terms).toEqual(['Verified pharmacies', 'Avg. delivery', 'Genuine medicines', 'Expert support'])
    expect(values).toEqual(['210+', '45 min', '100%', '24 / 7'])
  })
})

describe('HomeHowItWorks', () => {
  it('is the #how-it-works anchor the navbar links to', () => {
    const wrapper = mount(HomeHowItWorks)
    expect(wrapper.find('section#how-it-works').exists()).toBe(true)
  })

  it('walks through three numbered steps, each with an illustrated image', () => {
    const wrapper = mount(HomeHowItWorks)
    const steps = wrapper.findAll('article')

    expect(steps).toHaveLength(3)
    expect(steps.map(s => s.find('h3').text())).toEqual([
      'Upload or list your meds',
      'We source and verify',
      'Confirm and receive',
    ])
    expect(steps.map(s => s.find('[data-step]').text())).toEqual(['1', '2', '3'])
    for (const step of steps) {
      expect(step.find('img').attributes('alt')).toBeTruthy()
    }
  })
})

describe('HomeTrust', () => {
  it('states the Data Protection registration and pharmacy accreditation', () => {
    const text = mount(HomeTrust).text()
    expect(text).toContain('Ghana Data Protection')
    expect(text).toContain('Reg. No. 0004463')
    expect(text).toContain('Pharmacy Council accredited pharmacies')
  })
})
