import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// The one boundary is the HTTP call. The company store is stubbed so that however a page reaches
// the server (through the store, or through the portal service) the call lands in `http.request`.
const http = vi.hoisted(() => ({ request: vi.fn() }))
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => ({ request: http.request }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { pharmacy: 'kofi' } }) }))
vi.mock('~/stores/company', () => ({
  useCompanyStore: () => ({
    getApiHeaders: () => ({ 'x-company-domain': 'kofi' }),
  }),
}))

import RidersPage from '~/pages/[pharmacy]/services/riders.vue'
import DeliveriesPage from '~/pages/[pharmacy]/services/deliveries.vue'
import WalletPage from '~/pages/[pharmacy]/services/wallet.vue'

type Options = { method?: string; body?: string } | undefined

const stubs = { NuxtLink: { template: '<a><slot /></a>' } }
const page = async (component: object) => {
  const wrapper = mount(component, { global: { stubs } })
  await flushPromises()
  return wrapper
}
const button = (wrapper: ReturnType<typeof mount>, text: string) => wrapper.findAll('button').find((b) => b.text() === text)!
const calls = () => http.request.mock.calls.map((c) => [c[0], (c[1] as Options)?.method ?? 'GET'])
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as { body: string }).body)

// Selects the first real rider in the dropdown (the option after the placeholder).
const pickFirstRider = async (wrapper: ReturnType<typeof mount>) => {
  const select = wrapper.find('select')
  ;(wrapper.findAll('option')[1]!.element as HTMLOptionElement).selected = true
  await select.trigger('change')
}

const rider = (over: Record<string, unknown>) => ({ id: 3, name: 'Yaw Boateng', phone: '0244000111', username: 'yaw', is_active: true, ...over })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('wallet page', () => {
  beforeEach(() => {
    http.request.mockResolvedValue({
      success: true,
      wallet: { balance: 250, total_earned: 900, total_withdrawn: 650 },
      transactions: [{ id: 1, transaction_type: 'withdrawal', description: 'Payout', amount: -50, balance_after: 250, created_at: '2026-10-01T10:00:00Z' }],
    })
  })

  it('loads the wallet and shows the balance and the transactions', async () => {
    const wrapper = await page(WalletPage)
    expect(calls()).toEqual([['/api/pharmacy-portal/wallet', 'GET']])
    expect(wrapper.text()).toContain('GH₵250.00')
    expect(wrapper.text()).toContain('Withdrawal')
    expect(wrapper.text()).toContain('Payout')
  })

  it('stops loading, and does not throw, when the wallet cannot be loaded', async () => {
    http.request.mockRejectedValue(new Error('offline'))
    const wrapper = await page(WalletPage)
    expect(wrapper.text()).not.toContain('Loading wallet')
  })
})

describe('riders page', () => {
  beforeEach(() => {
    http.request.mockImplementation(async (url: string, options?: { method?: string }) => {
      if (url === '/api/pharmacy/riders' && !options?.method) return { success: true, riders: [rider({}), rider({ id: 4, name: 'Kojo Asare', is_active: false })] }
      return { success: true }
    })
  })

  const fillForm = async (wrapper: ReturnType<typeof mount>, values: string[]) => {
    await button(wrapper, '+ Add Rider').trigger('click')
    const inputs = wrapper.findAll('input')
    for (const [i, v] of values.entries()) await inputs[i]!.setValue(v)
  }

  it('lists the fleet when the page opens', async () => {
    const wrapper = await page(RidersPage)
    expect(calls()).toEqual([['/api/pharmacy/riders', 'GET']])
    expect(wrapper.text()).toContain('Yaw Boateng')
    expect(wrapper.text()).toContain('Kojo Asare')
  })

  it('asks for the required details before adding a rider, and sends nothing', async () => {
    const wrapper = await page(RidersPage)
    await button(wrapper, '+ Add Rider').trigger('click')
    await button(wrapper, 'Add Rider').trigger('click')
    expect(wrapper.text()).toContain('Name, phone, username, and password are required.')
    expect(calls()).toEqual([['/api/pharmacy/riders', 'GET']])
  })

  it('adds a rider with what was typed, then reloads the fleet', async () => {
    const wrapper = await page(RidersPage)
    await fillForm(wrapper, ['Esi Quaye', '0200000000', 'esi', 'secret12'])
    await button(wrapper, 'Add Rider').trigger('click')
    await flushPromises()

    expect(calls()).toEqual([['/api/pharmacy/riders', 'GET'], ['/api/pharmacy/riders', 'POST'], ['/api/pharmacy/riders', 'GET']])
    expect(bodyOf(http.request.mock.calls[1]!)).toMatchObject({ name: 'Esi Quaye', phone: '0200000000', username: 'esi', password: 'secret12' })
  })

  it('shows the server’s message when it refuses a new rider', async () => {
    http.request.mockImplementation(async (_url: string, options?: { method?: string }) => {
      if (options?.method === 'POST') return { success: false, message: 'Username already taken' }
      return { success: true, riders: [] }
    })
    const wrapper = await page(RidersPage)
    await fillForm(wrapper, ['Esi', '0200000000', 'esi', 'secret12'])
    await button(wrapper, 'Add Rider').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Username already taken')
  })

  it('removes a rider only after a confirmation', async () => {
    const wrapper = await page(RidersPage)
    await button(wrapper, 'Remove').trigger('click')
    expect(calls()).toEqual([['/api/pharmacy/riders', 'GET']])
    await button(wrapper, 'Yes, remove').trigger('click')
    await flushPromises()
    expect(calls()).toEqual([['/api/pharmacy/riders', 'GET'], ['/api/pharmacy/riders/3', 'DELETE'], ['/api/pharmacy/riders', 'GET']])
  })

  it('shows why a rider cannot be removed instead of swallowing it', async () => {
    http.request.mockImplementation(async (_url: string, options?: { method?: string }) => {
      if (options?.method === 'DELETE') throw new Error('This rider has a delivery in progress')
      return { success: true, riders: [rider({})] }
    })
    const wrapper = await page(RidersPage)
    await button(wrapper, 'Remove').trigger('click')
    await button(wrapper, 'Yes, remove').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('This rider has a delivery in progress')
  })

  it('shows the server’s message when it answers a removal with success: false', async () => {
    http.request.mockImplementation(async (_url: string, options?: { method?: string }) => {
      if (options?.method === 'DELETE') return { success: false, message: 'Rider is mid-delivery' }
      return { success: true, riders: [rider({})] }
    })
    const wrapper = await page(RidersPage)
    await button(wrapper, 'Remove').trigger('click')
    await button(wrapper, 'Yes, remove').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Rider is mid-delivery')
  })

  it('reactivates an inactive rider', async () => {
    const wrapper = await page(RidersPage)
    await button(wrapper, 'Reactivate').trigger('click')
    await flushPromises()
    expect(calls()).toContainEqual(['/api/pharmacy/riders/4/reactivate', 'POST'])
  })
})

describe('deliveries page', () => {
  const delivery = { id: 9, delivery_address: 'Osu', delivery_status: 'assigned', request_number: 'REQ-9', driver_id: null }
  const fleet = { success: true, riders: [{ id: 3, name: 'Yaw Boateng', phone: '0244000111' }] }

  beforeEach(() => {
    http.request.mockImplementation(async (url: string) => {
      if (url === '/api/pharmacy/deliveries/assigned') return { success: true, deliveries: [delivery] }
      if (url === '/api/pharmacy/riders') return fleet
      return { success: true }
    })
  })

  it('loads the deliveries and the fleet together', async () => {
    const wrapper = await page(DeliveriesPage)
    expect(calls().map((c) => c[0]).sort()).toEqual(['/api/pharmacy/deliveries/assigned', '/api/pharmacy/riders'])
    expect(wrapper.text()).toContain('Delivery #9')
    expect(wrapper.text()).toContain('Yaw Boateng')
  })

  it('will not assign until a rider is picked', async () => {
    const wrapper = await page(DeliveriesPage)
    expect(button(wrapper, 'Assign').attributes('disabled')).toBeDefined()
  })

  it('assigns the chosen rider, then reloads', async () => {
    const wrapper = await page(DeliveriesPage)
    await pickFirstRider(wrapper)
    await button(wrapper, 'Assign').trigger('click')
    await flushPromises()

    const assign = http.request.mock.calls.find((c) => String(c[0]).endsWith('/assign-rider'))!
    expect(assign[0]).toBe('/api/pharmacy/deliveries/9/assign-rider')
    expect((assign[1] as Options)?.method).toBe('POST')
    expect(bodyOf(assign)).toEqual({ rider_id: 3 })
    expect(calls().filter((c) => c[0] === '/api/pharmacy/deliveries/assigned')).toHaveLength(2)
  })

  it('shows the server’s message when the assignment is refused', async () => {
    http.request.mockImplementation(async (url: string) => {
      if (url.endsWith('/assign-rider')) return { success: false, message: 'Rider is already on a delivery' }
      if (url === '/api/pharmacy/deliveries/assigned') return { success: true, deliveries: [delivery] }
      return fleet
    })
    const wrapper = await page(DeliveriesPage)
    await pickFirstRider(wrapper)
    await button(wrapper, 'Assign').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Rider is already on a delivery')
  })

  it('points to the fleet page when there are no riders to choose from', async () => {
    http.request.mockImplementation(async (url: string) => {
      if (url === '/api/pharmacy/deliveries/assigned') return { success: true, deliveries: [delivery] }
      return { success: true, riders: [] }
    })
    const wrapper = await page(DeliveriesPage)
    expect(wrapper.text()).toContain('No riders in your fleet.')
  })

  it('says so when nothing is waiting', async () => {
    http.request.mockResolvedValue({ success: true, deliveries: [], riders: [] })
    const wrapper = await page(DeliveriesPage)
    expect(wrapper.text()).toContain('No pending deliveries.')
  })
})
