import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

// The composable is the page's boundary to the server; the page is driven through its buttons.
const campaignsApi = vi.hoisted(() => ({
  fetchCampaigns: vi.fn(),
  pauseCampaign: vi.fn(),
  resumeCampaign: vi.fn(),
  cancelCampaign: vi.fn(),
}))
vi.stubGlobal('definePageMeta', vi.fn())
vi.mock('~/composables/useSMSCampaigns', () => ({
  useSMSCampaigns: () => ({
    campaigns: ref([
      { id: 11, name: 'Flu shots', status: 'draft', company_name: 'Kofi Pharmacy', total_recipients: 10, messages_sent: 0 },
      { id: 12, name: 'Malaria reminder', status: 'paused', company_name: 'Kofi Pharmacy', total_recipients: 20, messages_sent: 5 },
      { id: 13, name: 'Back to school', status: 'active', company_name: 'Kofi Pharmacy', total_recipients: 30, messages_sent: 9 },
    ]),
    loading: ref(false),
    error: ref(null),
    ...campaignsApi,
  }),
}))

import SmsCampaignsPage from '~/pages/admin/sms-campaigns.vue'

const mountPage = async () => {
  const wrapper = mount(SmsCampaignsPage, {
    global: { stubs: { Teleport: true, Icon: true, StatusBadge: true } },
  })
  await flushPromises()
  return wrapper
}

const rowFor = (wrapper: ReturnType<typeof mount>, name: string) =>
  wrapper.findAll('tbody tr').find((r) => r.text().includes(name))!

const clickConfirm = async (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper.findAll('button').filter((b) => b.text() === text).at(-1)!
  await button.trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  campaignsApi.fetchCampaigns.mockResolvedValue({ data: [] })
  campaignsApi.pauseCampaign.mockResolvedValue({})
  campaignsApi.resumeCampaign.mockResolvedValue({})
  campaignsApi.cancelCampaign.mockResolvedValue({})
})

describe('admin SMS campaigns: pause, resume and cancel', () => {
  it('cancelling a draft campaign tells the server to cancel that campaign', async () => {
    const wrapper = await mountPage()

    await rowFor(wrapper, 'Flu shots').find('button.cancel').trigger('click')
    await clickConfirm(wrapper, 'Cancel Campaign')

    expect(campaignsApi.cancelCampaign).toHaveBeenCalledWith(11)
    expect(campaignsApi.fetchCampaigns).toHaveBeenCalled()
  })

  it('pausing and resuming call the matching actions', async () => {
    const wrapper = await mountPage()

    await rowFor(wrapper, 'Back to school').find('button.pause').trigger('click')
    await clickConfirm(wrapper, 'Pause Campaign')
    expect(campaignsApi.pauseCampaign).toHaveBeenCalledWith(13)

    await rowFor(wrapper, 'Malaria reminder').find('button.resume').trigger('click')
    await clickConfirm(wrapper, 'Resume Campaign')
    expect(campaignsApi.resumeCampaign).toHaveBeenCalledWith(12)
  })

  it.each([
    ['cancel', 'Flu shots', 'button.cancel', 'Cancel Campaign', 'cancelCampaign'],
    ['pause', 'Back to school', 'button.pause', 'Pause Campaign', 'pauseCampaign'],
    ['resume', 'Malaria reminder', 'button.resume', 'Resume Campaign', 'resumeCampaign'],
  ])('a failed %s shows the reason and keeps the dialog open', async (_label, name, selector, confirmText, action) => {
    campaignsApi[action as 'cancelCampaign'].mockRejectedValue(new Error('Campaign already started sending'))
    const wrapper = await mountPage()

    await rowFor(wrapper, name).find(selector).trigger('click')
    await clickConfirm(wrapper, confirmText)

    expect(wrapper.text()).toContain('Campaign already started sending')
    expect(wrapper.text()).toContain(confirmText)
  })

  it('locks the confirm button while the request is running', async () => {
    let finish: (v?: unknown) => void = () => {}
    campaignsApi.cancelCampaign.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const wrapper = await mountPage()

    await rowFor(wrapper, 'Flu shots').find('button.cancel').trigger('click')
    await clickConfirm(wrapper, 'Cancel Campaign')

    const busy = wrapper.findAll('button').find((b) => b.text().includes('Processing...'))!
    expect(busy.attributes('disabled')).toBeDefined()
    await busy.trigger('click')

    expect(campaignsApi.cancelCampaign).toHaveBeenCalledTimes(1)
    finish()
    await flushPromises()
  })
})
