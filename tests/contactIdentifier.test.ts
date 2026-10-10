import { describe, expect, it } from 'vitest'
import { classifyIdentifier, describeIdentifier } from '../utils/contactIdentifier'

describe('classifyIdentifier', () => {
  it.each(['', '   '])('%p is empty', (typed) => {
    expect(classifyIdentifier(typed).kind).toBe('empty')
  })

  it.each(['ama@example.com', '  ama@example.com  ', 'ama@', '@'])('%p is an email (an @ is enough)', (typed) => {
    expect(classifyIdentifier(typed)).toEqual({ kind: 'email', value: typed.trim() })
  })

  it.each(['0', '024', '024 123 4567', '24 123 4567', '024-123-4567', '(024) 123 4567', '233241234567'])(
    '%p is a Ghana number',
    (typed) => {
      expect(classifyIdentifier(typed).kind).toBe('ghana_phone')
    },
  )

  it.each(['+', '+2', '+23', '+233', '+233 24 123 4567'])(
    '%p is still a Ghana number (a +233 that may be half typed)',
    (typed) => {
      expect(classifyIdentifier(typed).kind).toBe('ghana_phone')
    },
  )

  it.each(['+4', '+44 7911 123456', '+1 415 555 2671', '+234 801 234 5678'])(
    '%p is a number from another country',
    (typed) => {
      expect(classifyIdentifier(typed).kind).toBe('foreign_phone')
    },
  )

  it.each(['a', 'ama', 'ama mensah', 'abc123'])('%p is not yet anything (letters but no @)', (typed) => {
    expect(classifyIdentifier(typed).kind).toBe('unknown')
  })

  it('keeps what was typed, trimmed', () => {
    expect(classifyIdentifier('  024 123 4567 ').value).toBe('024 123 4567')
  })
})

describe('describeIdentifier', () => {
  it('says nothing for sign-in (the password box is the next thing to do)', () => {
    for (const kind of ['empty', 'email', 'ghana_phone', 'foreign_phone', 'unknown'] as const) {
      expect(describeIdentifier(kind, 'signin', 'x')).toBeNull()
    }
  })

  it('tells a new customer where the code will go', () => {
    expect(describeIdentifier('ghana_phone', 'signup', '024 123 4567')).toMatchObject({ tone: 'info', text: expect.stringMatching(/text .*024 123 4567/i) })
    expect(describeIdentifier('email', 'signup', 'ama@example.com')).toMatchObject({ tone: 'info', text: expect.stringMatching(/email .*ama@example.com/i) })
  })

  it('explains why a non-Ghana number cannot get a text, and what to do', () => {
    for (const purpose of ['signup', 'reset'] as const) {
      const out = describeIdentifier('foreign_phone', purpose, '+44 7911 123456')
      expect(out).toMatchObject({ tone: 'note' })
      expect(out?.text).toMatch(/only reach Ghana numbers/i)
      expect(out?.text).toMatch(/email/i)
    }
  })

  it('gives a neutral nudge before anything is typed', () => {
    expect(describeIdentifier('empty', 'signup', '')?.text).toMatch(/Ghana numbers get a text/i)
    expect(describeIdentifier('empty', 'reset', '')?.text).toMatch(/Ghana numbers get a text/i)
  })

  it('tells someone resetting where the link or code goes', () => {
    expect(describeIdentifier('email', 'reset', 'ama@example.com')?.text).toMatch(/link/i)
    expect(describeIdentifier('ghana_phone', 'reset', '024 123 4567')?.text).toMatch(/code/i)
  })
})
