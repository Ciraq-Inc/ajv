// utils/contactIdentifier.ts
//
// Sign-up, sign-in and password reset all start from ONE box that takes a phone number or an
// email address. This reads what has been typed and says which it is, so the form can adapt
// without a switch or a country picker.
//
// Text codes only reach Ghana numbers, so a number from anywhere else is told to use email for
// sign-up and reset. Sign-in still accepts it: accounts made with such a number sign in with
// their password and need no text.

export type IdentifierKind = 'empty' | 'email' | 'ghana_phone' | 'foreign_phone' | 'unknown'
export type IdentifierPurpose = 'signup' | 'signin' | 'reset'

export interface ClassifiedIdentifier {
  kind: IdentifierKind
  /** What was typed, trimmed. */
  value: string
}

// Characters a phone number is written with.
const PHONE_CHARS = /^[0-9+\s\-().]+$/

export function classifyIdentifier(typed: string): ClassifiedIdentifier {
  const value = String(typed ?? '').trim()
  if (!value) return { kind: 'empty', value }

  // An "@" is enough: they are typing an email.
  if (value.includes('@')) return { kind: 'email', value }

  if (!PHONE_CHARS.test(value)) return { kind: 'unknown', value }

  if (value.startsWith('+')) {
    const digits = value.slice(1).replace(/\D/g, '')
    // Ghana's code is 233. Anything that can still become +233 is left alone, so a half-typed
    // "+2" or "+23" does not flip the form.
    if (digits.length > 0 && !'233'.startsWith(digits.slice(0, 3))) return { kind: 'foreign_phone', value }
    if (digits.length >= 3 && !digits.startsWith('233')) return { kind: 'foreign_phone', value }
  }

  return { kind: 'ghana_phone', value }
}

export interface IdentifierHint {
  /** `info` for what will happen, `note` for something they need to act on. */
  tone: 'info' | 'note'
  text: string
}

const NO_TEXT_NOTE = "Text codes only reach Ghana numbers, so we'll use email. Type your email address instead."
const NEUTRAL = 'Ghana numbers get a text. Anything else gets an email.'

/** The line under the box. Null when there is nothing worth saying. */
export function describeIdentifier(
  kind: IdentifierKind,
  purpose: IdentifierPurpose,
  value: string,
): IdentifierHint | null {
  if (purpose === 'signin') return null

  if (kind === 'foreign_phone') return { tone: 'note', text: NO_TEXT_NOTE }

  if (purpose === 'signup') {
    if (kind === 'email') return { tone: 'info', text: `We'll email a 6-digit code to ${value}.` }
    if (kind === 'ghana_phone') return { tone: 'info', text: `We'll text a 6-digit code to ${value}.` }
    return { tone: 'info', text: NEUTRAL }
  }

  // reset
  if (kind === 'email') return { tone: 'info', text: `We'll email a reset link to ${value} if it has an account.` }
  if (kind === 'ghana_phone') return { tone: 'info', text: `We'll text a reset code to ${value} if it has an account.` }
  return { tone: 'info', text: NEUTRAL }
}
