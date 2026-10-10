// utils/emailAuthMessages.ts
//
// One place that turns a failed email-auth API call into something a customer can
// act on. Shared by the verify and reset landing pages, the email sign-in form and
// the profile form, so the wording and the behaviour stay consistent.
//
// Two rules from the backend design:
//  - Sign-in refusals use ONE message for every cause (unknown email, unverified
//    email, wrong password), so this UI cannot be used to find out which addresses
//    have accounts.
//  - Password-policy wording comes from the server, so the message always matches
//    the rule actually enforced (the minimum length is a server setting).

export type EmailAuthContext =
  | 'verify'
  | 'reset'
  | 'sendVerification'
  | 'requestReset'
  | 'emailLogin'
  | 'profile'
  | 'signupCode' // asking for the emailed sign-up code
  | 'signup' // finishing sign-up with that code

export type EmailAuthErrorKind =
  | 'rate_limited'
  | 'unavailable'
  | 'network'
  | 'invalid_link'
  | 'email_taken'
  | 'rejected'
  | 'bad_credentials'
  | 'wrong_password'
  | 'password_required'
  | 'invalid_email'
  | 'code_locked'
  | 'unknown'

export interface EmailAuthError {
  kind: EmailAuthErrorKind
  message: string
  /** Form field the message belongs to, when the server named one. */
  field?: string
  retryAfterSeconds?: number
}

/** "42 seconds", "2 minutes", or "a moment" when the wait is unknown. */
export function formatWait(seconds: number | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return 'a moment'
  if (seconds < 60) return `${Math.ceil(seconds)} ${Math.ceil(seconds) === 1 ? 'second' : 'seconds'}`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}

interface ApiErrorLike {
  message?: string
  status?: number
  body?: { code?: string; field?: string; message?: string; retry_after_seconds?: number }
}

const asApiError = (err: unknown): ApiErrorLike | null =>
  err && typeof err === 'object' ? (err as ApiErrorLike) : null

export function describeEmailAuthError(err: unknown, context: EmailAuthContext): EmailAuthError {
  const e = asApiError(err)
  const status = typeof e?.status === 'number' ? e.status : undefined
  const code = e?.body?.code
  const field = e?.body?.field
  const serverMessage = e?.body?.message ?? e?.message

  if (status === undefined) {
    // No HTTP status. fetch() rejects with a TypeError when the request never completed
    // (offline, DNS, CORS); any other Error is the app's own and keeps its message.
    if (err instanceof TypeError) {
      return { kind: 'network', message: 'We could not reach the server. Check your connection and try again.' }
    }
    if (err instanceof Error && err.message) {
      return { kind: 'unknown', message: err.message }
    }
    return { kind: 'unknown', message: 'Something went wrong. Please try again.' }
  }

  // Too many wrong guesses at the sign-up code: the code is destroyed, so waiting helps
  // nobody. They need a new one.
  if (status === 429 && context === 'signup') {
    return { kind: 'code_locked', message: 'Too many incorrect attempts. Request a new code to continue.' }
  }

  if (status === 429) {
    const retryAfterSeconds = e?.body?.retry_after_seconds
    const wait = formatWait(retryAfterSeconds)
    const base = context === 'emailLogin' || context === 'profile'
      ? 'Too many attempts.'
      : context === 'signupCode'
        ? 'A code was sent recently.'
        : 'That was requested recently.'
    return {
      kind: 'rate_limited',
      message: `${base} Please wait ${wait} and try again.`,
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    }
  }

  if (status === 503 || status === 502) {
    return { kind: 'unavailable', message: 'Email is temporarily unavailable. Please try again in a few minutes.' }
  }

  if (context === 'verify') {
    if (status === 409 || code === 'EMAIL_TAKEN') {
      return { kind: 'email_taken', message: 'This email address is already verified on another account.' }
    }
    if (status === 400) {
      return { kind: 'invalid_link', message: 'This link is invalid or has expired. Request a new verification email from your account.' }
    }
  }

  if (context === 'reset') {
    if (status === 400 && code === 'INVALID_TOKEN') {
      return { kind: 'invalid_link', message: 'This link is invalid or has expired. Request a new password reset to get a fresh link.' }
    }
    if (status === 400) {
      return { kind: 'rejected', message: serverMessage ?? 'That password was not accepted. Please choose another.' }
    }
  }

  if (context === 'signupCode' || context === 'signup') {
    if (status === 409 || code === 'ALREADY_REGISTERED') {
      return { kind: 'email_taken', field: 'email', message: 'This email already has an account. Sign in instead.' }
    }
    if (status === 400 && field === 'email') {
      return { kind: 'invalid_email', field: 'email', message: serverMessage ?? 'Enter a valid email address.' }
    }
    // A wrong or expired code, or a password the policy refused: the server's own words.
    if (status === 400) {
      return { kind: 'rejected', message: serverMessage ?? 'That did not work. Please check it and try again.' }
    }
  }

  if (context === 'emailLogin' && status === 401) {
    return {
      kind: 'bad_credentials',
      message: 'Incorrect email or password. You can also sign in with your phone number or reset your password.',
    }
  }

  if (context === 'profile') {
    if (status === 403 && field === 'current_password') {
      return { kind: 'wrong_password', field: 'current_password', message: serverMessage ?? 'Your current password is incorrect.' }
    }
    if (status === 400 && field === 'current_password') {
      return { kind: 'password_required', field: 'current_password', message: serverMessage ?? 'Enter your current password to change your email.' }
    }
    if (status === 400 && field === 'email') {
      return { kind: 'invalid_email', field: 'email', message: serverMessage ?? 'Enter a valid email address.' }
    }
  }

  return { kind: 'unknown', message: serverMessage ?? 'Something went wrong. Please try again.' }
}
