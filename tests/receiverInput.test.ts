import { describe, expect, it } from 'vitest'
import {
  resolveReceiverInput,
  RECEIVER_FOREIGN_HINT,
  RECEIVER_OWN_DETAILS_MESSAGE,
  isForeignReceiverPhone,
} from '../utils/receiverInput'

const base = { accountPhone: '+233241234567', accountEmail: null as string | null, name: '', phone: '', email: '' }

describe('resolveReceiverInput', () => {
  it('sends no receiver while the toggle is off, whatever is left in the boxes', () => {
    expect(resolveReceiverInput({ ...base, enabled: false, name: 'Ama', phone: '024 400 0111' }))
      .toEqual({ ok: true, receiver: null, foreignNumber: false })
  })

  it('needs a name and a phone once the toggle is on', () => {
    expect(resolveReceiverInput({ ...base, enabled: true }))
      .toMatchObject({ ok: false, field: 'name', message: expect.stringMatching(/name/i) })
    expect(resolveReceiverInput({ ...base, enabled: true, name: 'Ama' }))
      .toMatchObject({ ok: false, field: 'phone', message: expect.stringMatching(/phone/i) })
    expect(resolveReceiverInput({ ...base, enabled: true, phone: '0244000111' }))
      .toMatchObject({ ok: false, field: 'name' })
  })

  it('sends a Ghana number as E.164, with the name tidied and no email', () => {
    expect(resolveReceiverInput({ ...base, enabled: true, name: '  Ama   Mensah ', phone: '024 400 0111' }))
      .toEqual({
        ok: true,
        receiver: { recipient_name: 'Ama Mensah', recipient_phone: '+233244000111', recipient_email: null },
        foreignNumber: false,
      })
  })

  it('rejects a phone number that is not a phone number', () => {
    expect(resolveReceiverInput({ ...base, enabled: true, name: 'Ama', phone: '12' }))
      .toMatchObject({ ok: false, field: 'phone' })
  })

  it('takes an optional email, lower-cased, and rejects a malformed one', () => {
    expect(resolveReceiverInput({ ...base, enabled: true, name: 'Ama', phone: '0244000111', email: ' Ama@Example.COM ' }))
      .toMatchObject({ ok: true, receiver: { recipient_email: 'ama@example.com' } })
    expect(resolveReceiverInput({ ...base, enabled: true, name: 'Ama', phone: '0244000111', email: 'not-an-email' }))
      .toMatchObject({ ok: false, field: 'email' })
  })

  it('flags a foreign number, which cannot be texted, so the form can suggest an email', () => {
    const out = resolveReceiverInput({ ...base, enabled: true, name: 'Tom', phone: '+44 7911 123456' })
    expect(out).toMatchObject({ ok: true, foreignNumber: true, receiver: { recipient_phone: '+447911123456' } })
    expect(RECEIVER_FOREIGN_HINT).toMatch(/code/i)
    expect(RECEIVER_FOREIGN_HINT).toMatch(/email/i)
  })

  it('tells the orderer when the receiver is themselves, instead of sending nothing silently', () => {
    expect(resolveReceiverInput({ ...base, enabled: true, name: 'Kofi', phone: '024 123 4567' }))
      .toMatchObject({ ok: false, field: 'phone', message: RECEIVER_OWN_DETAILS_MESSAGE })
    expect(resolveReceiverInput({ ...base, accountEmail: 'kofi@example.com', enabled: true, name: 'Kofi', phone: '0244000111', email: 'KOFI@example.com' }))
      .toMatchObject({ ok: false, field: 'email', message: RECEIVER_OWN_DETAILS_MESSAGE })
  })

  it('an email-only account (no phone of its own) can still name a receiver', () => {
    expect(resolveReceiverInput({ ...base, accountPhone: null, accountEmail: 'kofi@example.com', enabled: true, name: 'Ama', phone: '0244000111' }))
      .toMatchObject({ ok: true, receiver: { recipient_phone: '+233244000111' } })
  })
})

describe('isForeignReceiverPhone', () => {
  it('is true only for a valid number outside Ghana, whatever else is filled in', () => {
    expect(isForeignReceiverPhone('+44 7911 123456')).toBe(true)
    expect(isForeignReceiverPhone('024 400 0111')).toBe(false)
    expect(isForeignReceiverPhone('+233 24 400 0111')).toBe(false)
    expect(isForeignReceiverPhone('')).toBe(false)
    expect(isForeignReceiverPhone('12')).toBe(false)
  })
})
