import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePickupHandover } from '../../composables/usePickupHandover'

const apiError = (status: number, code: string, message: string) =>
  Object.assign(new Error(message), { status, body: { success: false, code, message } })

const request = vi.fn()
const make = () => usePickupHandover(request)

beforeEach(() => { vi.clearAllMocks() })

describe('the pharmacy marks a pickup order ready', () => {
  it('posts to the ready endpoint for that order and reports success', async () => {
    request.mockResolvedValue({ success: true, data: { status: 'ready_for_pickup' } })
    const result = await make().markReady(42)

    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders/42/ready', { method: 'POST' })
    expect(result).toEqual({ ok: true })
  })

  it('reports why when the order is not being prepared, instead of throwing', async () => {
    request.mockRejectedValue(apiError(409, 'NOT_PREPARING', 'This order is not being prepared, so it cannot be marked ready'))
    const result = await make().markReady(42)

    expect(result).toEqual({ ok: false, message: 'This order is not being prepared, so it cannot be marked ready' })
  })

  it('is busy while the request is in flight, and not afterwards', async () => {
    let finish!: (v: unknown) => void
    request.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const pickup = make()

    const pending = pickup.markReady(42)
    expect(pickup.busy.value).toBe(true)
    finish({ success: true })
    await pending

    expect(pickup.busy.value).toBe(false)
  })
})

describe('the pharmacy hands an order over', () => {
  it('sends the 4-digit code and reports success', async () => {
    request.mockResolvedValue({ success: true, data: { status: 'completed' } })
    const result = await make().handOver(42, '0417')

    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders/42/handover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '0417' }) })
    expect(result).toEqual({ ok: true })
  })

  it.each(['', '12', '12345', 'abcd', '12 4'])('does not call the server for the invalid code %j', async (code) => {
    const result = await make().handOver(42, code)

    expect(request).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, message: 'Enter the 4-digit code' })
  })

  it('trims spaces around a pasted code', async () => {
    request.mockResolvedValue({ success: true })
    await make().handOver(42, ' 0417 ')

    expect(request).toHaveBeenCalledWith('/api/pharmacy-portal/orders/42/handover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '0417' }) })
  })

  it('reports a wrong code with the server message', async () => {
    request.mockRejectedValue(apiError(400, 'INVALID_CODE', 'That code is not right'))
    expect(await make().handOver(42, '0000')).toEqual({ ok: false, message: 'That code is not right' })
  })

  it('reports a locked order so the pharmacy knows to ask an admin', async () => {
    request.mockRejectedValue(apiError(423, 'LOCKED', 'Too many wrong codes. Ask an admin to complete this order'))
    expect(await make().handOver(42, '0000')).toEqual({ ok: false, message: 'Too many wrong codes. Ask an admin to complete this order' })
  })

  it('gives a plain message when the failure has no server message', async () => {
    request.mockRejectedValue(new Error(''))
    expect(await make().handOver(42, '0417')).toEqual({ ok: false, message: 'Something went wrong. Please try again' })
  })
})
