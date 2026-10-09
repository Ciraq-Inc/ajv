// utils/receiverInput.ts
//
// "Delivering to someone else": the orderer keeps every notification; the receiver only gets
// the delivery-phase ones (the code on the way, delivered, delivery failed). This mirrors the
// server's rule (rigel-medsgh src/utils/orderRecipient.js) so the form says what is wrong
// before a round trip, and sends E.164. The receiver's phone and email are never verified.

import phoneUtils from '~/utils/phone'

export type ReceiverField = 'name' | 'phone' | 'email'

export interface ReceiverPayload {
  recipient_name: string
  recipient_phone: string
  recipient_email: string | null
}

export type ReceiverResult =
  | { ok: true; receiver: ReceiverPayload | null; foreignNumber: boolean }
  | { ok: false; field: ReceiverField; message: string }

export const RECEIVER_NAME_REQUIRED_MESSAGE = 'Enter the name of the person receiving the delivery.'
export const RECEIVER_PHONE_REQUIRED_MESSAGE = 'Enter a phone number for the person receiving the delivery.'
export const RECEIVER_PHONE_INVALID_MESSAGE =
  'Enter a valid phone number. Include the country code (like +44) if it is not a Ghana number.'
export const RECEIVER_EMAIL_INVALID_MESSAGE = 'Enter a valid email address, or leave it empty.'
export const RECEIVER_OWN_DETAILS_MESSAGE =
  'That is your own number or email. Turn off "Delivering to someone else" to receive it yourself.'
export const RECEIVER_FOREIGN_HINT =
  'We can only text Ghana numbers. Add their email so they get the delivery code, or share the code with them yourself when it appears here.'

const tidyName = (value: string): string => value.trim().split(' ').filter(Boolean).join(' ')

// Deliberately loose: the server does the strict check. This only catches typos.
const looksLikeEmail = (value: string): boolean => {
  if (value.includes(' ')) return false
  const parts = value.split('@')
  if (parts.length !== 2 || !parts[0]) return false
  const domain = parts[1] ?? ''
  const dot = domain.lastIndexOf('.')
  return dot > 0 && dot < domain.length - 1
}

export function resolveReceiverInput(input: {
  enabled: boolean
  accountPhone: string | null | undefined
  accountEmail: string | null | undefined
  name: string
  phone: string
  email: string
}): ReceiverResult {
  if (!input.enabled) return { ok: true, receiver: null, foreignNumber: false }

  const name = tidyName(String(input.name ?? ''))
  if (!name) return { ok: false, field: 'name', message: RECEIVER_NAME_REQUIRED_MESSAGE }

  const typedPhone = String(input.phone ?? '').trim()
  if (!typedPhone) return { ok: false, field: 'phone', message: RECEIVER_PHONE_REQUIRED_MESSAGE }
  // A number starting with "+" names its own country; anything else is read as Ghanaian.
  const phone = phoneUtils.formatToE164(typedPhone, 'GH')
  if (!phone) return { ok: false, field: 'phone', message: RECEIVER_PHONE_INVALID_MESSAGE }

  const typedEmail = String(input.email ?? '').trim().toLowerCase()
  if (typedEmail && !looksLikeEmail(typedEmail)) {
    return { ok: false, field: 'email', message: RECEIVER_EMAIL_INVALID_MESSAGE }
  }

  const ownPhone = input.accountPhone ? phoneUtils.formatToE164(input.accountPhone, 'GH') : null
  if (ownPhone && ownPhone === phone) return { ok: false, field: 'phone', message: RECEIVER_OWN_DETAILS_MESSAGE }
  const ownEmail = String(input.accountEmail ?? '').trim().toLowerCase()
  if (ownEmail && typedEmail && ownEmail === typedEmail) {
    return { ok: false, field: 'email', message: RECEIVER_OWN_DETAILS_MESSAGE }
  }

  return {
    ok: true,
    receiver: { recipient_name: name, recipient_phone: phone, recipient_email: typedEmail || null },
    foreignNumber: !phone.startsWith('+233'),
  }
}

/** True for a valid number outside Ghana: it cannot be texted. Independent of the other fields. */
export function isForeignReceiverPhone(typed: string): boolean {
  const phone = phoneUtils.formatToE164(String(typed ?? '').trim(), 'GH')
  return Boolean(phone) && !String(phone).startsWith('+233')
}
