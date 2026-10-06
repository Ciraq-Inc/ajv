// composables/useEmailSignIn.ts
//
// The email halves of the customer sign-in modal: signing in with a verified email
// + password, and asking for a password-reset link. Kept out of Login.vue so the
// behaviour (validation, uniform refusal wording, cooldowns) is unit-tested; the
// component only wires these to its template.
//
// Dependencies are injected (the store actions), so nothing here touches Pinia or HTTP.

import { onScopeDispose, getCurrentScope, ref } from 'vue'
import { describeEmailAuthError } from '~/utils/emailAuthMessages'

// A convenience check, not a validator: the server decides what is acceptable.
const PLAUSIBLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isPlausibleEmail = (value: string): boolean => value.length <= 254 && PLAUSIBLE_EMAIL.test(value)

const EMAIL_HINT = 'Enter a valid email address, like name@example.com.'

/**
 * Whether the sign-in button should be enabled. Phone sign-in keeps its existing rule
 * (a phone number and a password of at least 6 characters); email sign-in needs an
 * email and a password, and never looks at the phone field.
 */
export function signInReady(
  method: 'phone' | 'email',
  fields: { phone: string; email: string; password: string },
): boolean {
  if (method === 'email') return fields.email.trim().length > 0 && fields.password.length > 0
  return fields.phone.length > 0 && fields.password.length >= 6
}

export function useEmailSignIn(deps: { login: (email: string, password: string) => Promise<unknown> }) {
  const email = ref('')
  const emailError = ref('')
  const errorMessage = ref('')
  const busy = ref(false)

  /** Resolves true when signed in. Never throws; failures set `errorMessage` / `emailError`. */
  const submit = async (password: string): Promise<boolean> => {
    if (busy.value) return false
    emailError.value = ''
    errorMessage.value = ''

    const address = email.value.trim()
    if (!isPlausibleEmail(address)) {
      emailError.value = EMAIL_HINT
      return false
    }
    if (!password) {
      errorMessage.value = 'Enter your password.'
      return false
    }

    busy.value = true
    try {
      await deps.login(address, password)
      return true
    } catch (error: unknown) {
      errorMessage.value = describeEmailAuthError(error, 'emailLogin').message
      return false
    } finally {
      busy.value = false
    }
  }

  return { email, emailError, errorMessage, busy, submit }
}

export function useEmailReset(deps: {
  request: (email: string) => Promise<unknown>
  /** Matches the server's per-address cooldown. */
  cooldownSeconds?: number
}) {
  const defaultCooldown = deps.cooldownSeconds ?? 60

  const email = ref('')
  const emailError = ref('')
  const errorMessage = ref('')
  const busy = ref(false)
  const sent = ref(false)
  const sentTo = ref('')
  const cooldown = ref(0)

  let timer: ReturnType<typeof setInterval> | null = null

  const stopTimer = (): void => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  const startCooldown = (seconds: number): void => {
    stopTimer()
    cooldown.value = Math.max(0, Math.ceil(seconds))
    if (cooldown.value === 0) return
    timer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) {
        cooldown.value = 0
        stopTimer()
      }
    }, 1000)
  }

  const send = async (): Promise<void> => {
    if (busy.value || cooldown.value > 0) return
    emailError.value = ''
    errorMessage.value = ''

    const address = email.value.trim()
    if (!isPlausibleEmail(address)) {
      emailError.value = EMAIL_HINT
      return
    }

    busy.value = true
    try {
      await deps.request(address)
      sent.value = true
      sentTo.value = address
      startCooldown(defaultCooldown)
    } catch (error: unknown) {
      const described = describeEmailAuthError(error, 'requestReset')
      errorMessage.value = described.message
      if (described.kind === 'rate_limited') startCooldown(described.retryAfterSeconds ?? defaultCooldown)
    } finally {
      busy.value = false
    }
  }

  const startOver = (): void => {
    sent.value = false
    sentTo.value = ''
    errorMessage.value = ''
    emailError.value = ''
  }

  const dispose = (): void => {
    stopTimer()
  }
  if (getCurrentScope()) onScopeDispose(dispose)

  return { email, emailError, errorMessage, busy, sent, sentTo, cooldown, send, startOver, dispose }
}
