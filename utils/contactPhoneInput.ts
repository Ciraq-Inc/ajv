// utils/contactPhoneInput.ts
//
// Riders and SMS need a phone number for every delivery. An account made with a phone has one;
// an account made with an email address has none, so the request form must ask for it. This
// mirrors the server's rule (rigel-medsgh src/utils/contactPhone.js) so the form says what is
// wrong before a round trip, and sends E.164.

import phoneUtils from '~/utils/phone'

export type ContactPhoneResult =
  | { ok: true; required: boolean; phone: string | null }
  | { ok: false; required: boolean; message: string }

export const CONTACT_PHONE_REQUIRED_MESSAGE = 'Add a phone number we can reach you on for this delivery.'
export const CONTACT_PHONE_INVALID_MESSAGE =
  'Enter a valid phone number. Include the country code (like +44) if it is not a Ghana number.'

/**
 * @param accountPhone the signed-in account's own phone, if it has one
 * @param typed what is in the form's phone box
 * @returns `phone` is what to send as `contact_phone` (E.164), or null to send nothing
 */
export function resolveContactPhoneInput(input: {
  accountPhone: string | null | undefined
  typed: string
}): ContactPhoneResult {
  const required = !input.accountPhone
  const typed = String(input.typed ?? '').trim()

  if (!typed) {
    return required
      ? { ok: false, required, message: CONTACT_PHONE_REQUIRED_MESSAGE }
      : { ok: true, required, phone: null }
  }

  // A number starting with "+" names its own country; anything else is read as Ghanaian.
  const phone = phoneUtils.formatToE164(typed, 'GH')
  if (!phone) return { ok: false, required, message: CONTACT_PHONE_INVALID_MESSAGE }
  return { ok: true, required, phone }
}
