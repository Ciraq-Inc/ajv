import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiInstance } from '../services/types'
import { createPharmacyPortalService } from '../services/pharmacyPortal/pharmacyPortalService'

const request = vi.fn()
const api = { request } as unknown as ApiInstance
const companyHeaders = { 'x-company-domain': 'kofi', Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' }
const portal = () => createPharmacyPortalService(api, () => companyHeaders)

beforeEach(() => { vi.clearAllMocks(); request.mockResolvedValue({ success: true }) })

describe('every portal call carries the company headers', () => {
  it('on a plain read', async () => {
    await portal().listOrders()
    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders', { headers: companyHeaders })
  })

  it('and lets a call add its own headers on top', async () => {
    await portal().addRider({ name: 'Yaw', phone: '0244000111', username: 'yaw', password: 'secret1' })
    expect(request.mock.calls[0]![1].headers).toEqual({ ...companyHeaders, 'Content-Type': 'application/json' })
  })
})

describe('orders', () => {
  it('lists the pharmacy’s orders and hands back what the server sent', async () => {
    request.mockResolvedValue({ success: true, orders: [{ id: 7 }] })
    const res = await portal().listOrders<{ id: number }>()
    expect(res.orders).toEqual([{ id: 7 }])
  })

  it('opens one order by id', async () => {
    request.mockResolvedValue({ success: true, order: { id: 7 }, items: [{ id: 1 }] })
    const res = await portal().getOrder(7)
    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders/7', { headers: companyHeaders })
    expect(res.items).toEqual([{ id: 1 }])
  })

  it('marks an order ready with a bare POST', async () => {
    await portal().markOrderReady(7)
    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders/7/ready', { method: 'POST', headers: companyHeaders })
  })

  it('hands an order over with the code as JSON', async () => {
    await portal().handOverOrder(7, '0417')
    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders/7/handover', {
      method: 'POST', headers: companyHeaders, body: JSON.stringify({ code: '0417' }),
    })
  })

  it('lets a server refusal reach the caller instead of swallowing it', async () => {
    request.mockRejectedValue(Object.assign(new Error('That code is not right'), { status: 400 }))
    await expect(portal().handOverOrder(7, '0000')).rejects.toThrow('That code is not right')
  })
})

describe('wallet', () => {
  it('reads the wallet and its transactions', async () => {
    request.mockResolvedValue({ success: true, wallet: { balance: 5 }, transactions: [] })
    const res = await portal().getWallet()
    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/wallet', { headers: companyHeaders })
    expect(res.wallet).toEqual({ balance: 5 })
  })
})

describe('deliveries and riders', () => {
  it('lists assigned deliveries and riders', async () => {
    await portal().listAssignedDeliveries()
    await portal().listRiders()
    expect(request.mock.calls.map((c) => c[0])).toEqual(['/api/pharmacy/deliveries/assigned', '/api/pharmacy/riders'])
  })

  it('acts on a delivery with no body when there is nothing to send', async () => {
    await portal().deliveryAction(9, 'cancel')
    const [url, options] = request.mock.calls[0]!
    expect(url).toBe('/api/pharmacy/deliveries/9/cancel')
    expect(options.method).toBe('POST')
    expect(options).not.toHaveProperty('body')
  })

  it('acts on a delivery with a JSON body when there is one', async () => {
    await portal().deliveryAction(9, 'assign', { rider_id: 3 })
    expect(request.mock.calls[0]![1].body).toBe(JSON.stringify({ rider_id: 3 }))
  })

  it('adds, removes and reactivates a rider on the right routes and verbs', async () => {
    await portal().addRider({ name: 'Yaw', phone: '0244000111', username: 'yaw', password: 'secret1' })
    await portal().deactivateRider(3)
    await portal().reactivateRider(3)
    expect(request.mock.calls.map((c) => [c[0], c[1].method])).toEqual([
      ['/api/pharmacy/riders', 'POST'],
      ['/api/pharmacy/riders/3', 'DELETE'],
      ['/api/pharmacy/riders/3/reactivate', 'POST'],
    ])
    expect(JSON.parse(request.mock.calls[0]![1].body)).toMatchObject({ name: 'Yaw', username: 'yaw' })
  })
})
