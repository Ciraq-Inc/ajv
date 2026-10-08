import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: wallet service (HTTP), router, Nuxt globals ──
const svc = vi.hoisted(() => ({ getBalance: vi.fn(), getTransactions: vi.fn(), initiateTopUp: vi.fn(), verifyTopUp: vi.fn() }))
vi.mock('~/services/customerWallet/customerWalletService', () => ({ createCustomerWalletService: () => svc }))
vi.mock('~/stores/user', () => ({ useUserStore: () => ({}) }))
const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ replace: vi.fn() }) }))
vi.stubGlobal('useApi', () => ({}))

import Wallet from '~/components/customers/wallet.vue'

let wrapper: ReturnType<typeof mount> | undefined
const TXS = [
  { id: 2, transaction_type: 'request_fee', description: 'Request submission fee', amount: 5, created_at: '2026-10-02T10:00:00Z' },
  { id: 1, transaction_type: 'topup', description: 'Top-up', amount: 20, created_at: '2026-10-01T10:00:00Z', paystack_reference: 'ref123' },
]
const BAD = /zinc-|emerald-|rose-|slate-|gray-|\[#[0-9a-fA-F]{3,6}\]|#[0-9a-fA-F]{6}|text-\[(9|10|11)px\]/

const open = async (txs: unknown[] = TXS) => {
  svc.getBalance.mockResolvedValue({ success: true, data: { balance: 20 } })
  svc.getTransactions.mockResolvedValue({ success: true, data: txs })
  wrapper = mount(Wallet, { attachTo: document.body })
  await flushPromises()
  return wrapper
}
const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
const topUpButton = () => Array.from(document.body.querySelectorAll('button')).find(b => b.textContent!.includes('Top up'))! as HTMLElement
const dlg = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null

beforeEach(() => { vi.clearAllMocks(); route.query = {} })
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.body.innerHTML = '' })

describe('Wallet: balance', () => {
  it('shows the balance in a labelled region with a big Top up button', async () => {
    await open()
    const region = document.body.querySelector('section[aria-labelledby="wallet-balance-title"]')!

    expect(region.textContent).toContain('Available balance')
    expect(region.textContent).toContain('20.00')
    expect(topUpButton().className).toContain('min-h-[44px]')
  })

  it('says when a top-up is being verified, politely', async () => {
    route.query = { trxref: 'abc' }
    svc.verifyTopUp.mockReturnValue(new Promise(() => {}))
    await open()

    expect(document.body.querySelector('[role="status"]')!.textContent).toContain('Verifying')
  })
})

describe('Wallet: transactions', () => {
  it('lists each one with its direction in words, not only colour', async () => {
    await open()
    const items = Array.from(document.body.querySelectorAll('section[aria-labelledby="wallet-history-title"] li'))

    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain('Debit')
    expect(items[0].textContent).toContain('-GHS 5.00')
    expect(items[1].textContent).toContain('Credit')
    expect(items[1].textContent).toContain('+GHS 20.00')
  })

  it('invites a first top-up when there is nothing yet', async () => {
    await open([])

    expect(document.body.textContent).toContain('No transactions yet')
    expect(Array.from(document.body.querySelectorAll('button')).some(b => b.textContent!.includes('Top up now'))).toBe(true)
  })
})

describe('Wallet: top up dialog', () => {
  const openDialog = async () => { topUpButton().click(); await flushPromises() }

  it('opens as a dialog titled for what the customer is doing, with a labelled amount', async () => {
    await open()
    await openDialog()
    const d = dlg()!

    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(d.querySelector('#topup-title')!.textContent).toContain('Top up wallet')
    expect(d.getAttribute('aria-labelledby')).toBe('topup-title')
    expect(d.querySelector('label[for="topup-amount"]')).not.toBeNull()
  })

  it('shows which quick amount is picked and makes every action easy to hit', async () => {
    await open()
    await openDialog()
    const chips = Array.from(dlg()!.querySelectorAll<HTMLElement>('button[aria-pressed]'))

    expect(chips.map(c => c.textContent!.trim())).toEqual(['10', '20', '50', '100'])
    expect(chips.find(c => c.getAttribute('aria-pressed') === 'true')!.textContent!.trim()).toBe('50')
    const all = Array.from(dlg()!.querySelectorAll('button'))
    expect(all.every(b => /min-h-\[44px\]|h-11/.test(b.className))).toBe(true)
  })

  it('closes with Escape or the labelled Close button', async () => {
    await open()
    await openDialog()
    press('Escape')
    await flushPromises()
    expect(dlg()).toBeNull()

    await openDialog()
    ;(dlg()!.querySelector('button[aria-label="Close"]') as HTMLElement).click()
    await flushPromises()
    expect(dlg()).toBeNull()
  })

  it('starts the payment for the chosen amount', async () => {
    svc.initiateTopUp.mockResolvedValue({ success: true, data: {} })
    await open()
    await openDialog()
    ;(Array.from(dlg()!.querySelectorAll('button')).find(b => b.textContent!.includes('Pay GHS')) as HTMLElement).click()
    await flushPromises()

    expect(svc.initiateTopUp).toHaveBeenCalledWith({ amount: 50 })
  })
})

describe('Wallet: look', () => {
  it('uses brand tokens and readable text sizes throughout', async () => {
    await open()
    topUpButton().click()
    await flushPromises()

    expect(document.body.innerHTML).not.toMatch(BAD)
  })

  it('announces an error as an alert in red, not a near-black bar', async () => {
    svc.getBalance.mockResolvedValue({ success: true, data: { balance: 1 } })
    svc.getTransactions.mockRejectedValue(new Error('x'))
    wrapper = mount(Wallet, { attachTo: document.body })
    await flushPromises()
    const t = document.body.querySelector('[data-testid="toast"]') as HTMLElement

    expect(t.getAttribute('role')).toBe('alert')
    expect(t.textContent).toContain('Failed to load transactions')
    expect(t.outerHTML).not.toMatch(BAD)
  })
})
