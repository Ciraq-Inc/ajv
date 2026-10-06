// utils/signupContact.ts
//
// Sign-up takes a phone number OR an email address. Codes are sent by SMS only to
// Ghana numbers, so anyone without one must use their email instead. This decides,
// from what the person has typed or picked, when to steer them to the email form so
// they never have to work that out themselves.

/** The country-picker value for "my number is not a Ghana number". */
export const COUNTRY_OTHER = 'OTHER'

export interface EmailSuggestion {
  to: 'email'
  /** Text to put in the email box ('' when what was typed is not an email). */
  carry: string
  /** Why we switched, shown to the person. '' when it is obvious (they typed an email). */
  note: string
}

const NO_GH_NUMBER_NOTE = "SMS codes only work for Ghana numbers, so we'll use your email instead."

/**
 * Should the sign-up form move from phone to email?
 *
 * - An "@" in the phone box: they are typing an email. Switch and keep their text.
 * - "Other country" picked, or a "+" number that can no longer become +233: switch, say why.
 * - Anything else (including a half-typed "+2" / "+23", which may still become +233): leave alone.
 */
export function suggestEmailInstead(input: { typed: string; country: string }): EmailSuggestion | null {
  const typed = String(input.typed ?? '').trim()

  if (typed.includes('@')) return { to: 'email', carry: typed, note: '' }

  if (input.country === COUNTRY_OTHER) return { to: 'email', carry: '', note: NO_GH_NUMBER_NOTE }

  if (typed.startsWith('+')) {
    const digits = typed.slice(1).replace(/\D/g, '')
    // Ghana's code is 233. Switch only once what has been typed cannot be the start of it.
    if (digits.length > 0 && !'233'.startsWith(digits.slice(0, 3))) {
      return { to: 'email', carry: '', note: NO_GH_NUMBER_NOTE }
    }
  }

  return null
}
