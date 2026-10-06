import { describe, expect, it } from 'vitest'
import { COUNTRY_OTHER, suggestEmailInstead } from '../utils/signupContact'

describe('suggestEmailInstead', () => {
  describe('someone who clearly means email', () => {
    it('switches as soon as an @ is typed in the phone box, carrying what they typed', () => {
      expect(suggestEmailInstead({ typed: 'ama@', country: 'GH' }))
        .toEqual({ to: 'email', carry: 'ama@', note: '' })
      expect(suggestEmailInstead({ typed: 'ama@example.com', country: 'GH' }))
        .toEqual({ to: 'email', carry: 'ama@example.com', note: '' })
    })

    it('trims the carried text', () => {
      expect(suggestEmailInstead({ typed: '  ama@example.com ', country: 'GH' })?.carry).toBe('ama@example.com')
    })
  })

  describe('someone without a Ghana number', () => {
    const NOTE = /SMS codes only work for Ghana numbers/i

    it('picking "other country" switches to email, with a reason, and carries nothing', () => {
      const out = suggestEmailInstead({ typed: '', country: COUNTRY_OTHER })
      expect(out).toMatchObject({ to: 'email', carry: '' })
      expect(out?.note).toMatch(NOTE)
    })

    it.each(['+4', '+44', '+44 7700 900123', '+1 415 555 0100', '+234 801 234 5678'])(
      'a "+" number that is not +233 (%s) switches to email, and does not carry the number into the email box',
      (typed) => {
        const out = suggestEmailInstead({ typed, country: 'GH' })
        expect(out).toMatchObject({ to: 'email', carry: '' })
        expect(out?.note).toMatch(NOTE)
      },
    )
  })

  describe('someone who is still typing a Ghana number (no interruptions)', () => {
    it.each(['', '0', '024', '024 123 4567', '24 123 4567', '+', '+2', '+23', '+233', '+233 24 123 4567', '233241234567'])(
      '%p is left alone',
      (typed) => {
        expect(suggestEmailInstead({ typed, country: 'GH' })).toBeNull()
      },
    )

    it('is left alone when the typed text is not meaningful', () => {
      expect(suggestEmailInstead({ typed: '   ', country: 'GH' })).toBeNull()
    })
  })
})
