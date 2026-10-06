import { describe, expect, it } from 'vitest'
import { resolveContactPhoneInput } from '../utils/contactPhoneInput'

describe('resolveContactPhoneInput', () => {
  describe('an account that already has a phone', () => {
    it('needs nothing and sends nothing when the box is empty', () => {
      expect(resolveContactPhoneInput({ accountPhone: '+233241234567', typed: '' }))
        .toEqual({ ok: true, required: false, phone: null })
      expect(resolveContactPhoneInput({ accountPhone: '+233241234567', typed: '   ' }))
        .toEqual({ ok: true, required: false, phone: null })
    })

    it('lets them give a different delivery contact', () => {
      expect(resolveContactPhoneInput({ accountPhone: '+233241234567', typed: '020 123 4567' }))
        .toEqual({ ok: true, required: false, phone: '+233201234567' })
    })
  })

  describe('an email-only account (no phone on the account)', () => {
    it.each([null, undefined, ''])('must give a number (account phone %p)', (accountPhone) => {
      const out = resolveContactPhoneInput({ accountPhone, typed: '' })
      expect(out).toMatchObject({ ok: false, required: true })
      expect(out.ok === false && out.message).toMatch(/phone number we can reach you on/i)
    })

    it('accepts a Ghana number written the local way, and sends it as E.164', () => {
      expect(resolveContactPhoneInput({ accountPhone: null, typed: '024 123 4567' }))
        .toEqual({ ok: true, required: true, phone: '+233241234567' })
    })

    it('accepts an international number with its country code', () => {
      expect(resolveContactPhoneInput({ accountPhone: null, typed: '+44 7911 123456' }))
        .toEqual({ ok: true, required: true, phone: '+447911123456' })
      expect(resolveContactPhoneInput({ accountPhone: null, typed: '+1 415 555 2671' }))
        .toEqual({ ok: true, required: true, phone: '+14155552671' })
    })

    it('refuses something that is not a phone number, and says to include the country code', () => {
      for (const typed of ['abc', '12', '+44', '0241']) {
        const out = resolveContactPhoneInput({ accountPhone: null, typed })
        expect(out).toMatchObject({ ok: false, required: true })
        expect(out.ok === false && out.message).toMatch(/country code/i)
      }
    })
  })
})
