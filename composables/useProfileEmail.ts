// composables/useProfileEmail.ts
//
// The email part of the customer profile form:
//  - whether the saved address is verified (and a way to resend the link),
//  - changing the address needs the CURRENT PASSWORD (the server enforces it; this
//    asks for it up front and sends it only when the address really changed),
//  - server refusals shown at the field they belong to.
//
// Dependencies are injected so it carries no Pinia or HTTP of its own.

import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'
import { describeEmailAuthError } from '~/utils/emailAuthMessages'

export type EmailStatus = 'none' | 'unverified' | 'verified'

// Same comparison the server uses to decide whether an address changed.
const norm = (value: string | null | undefined): string => String(value ?? '').trim().toLowerCase()

export function useProfileEmail(deps: {
  sendVerification: () => Promise<unknown>
  /** Matches the server's per-address cooldown. */
  cooldownSeconds?: number
}) {
  const defaultCooldown = deps.cooldownSeconds ?? 60

  const savedEmail = ref('')
  const verified = ref(false)
  const currentPassword = ref('')
  const passwordError = ref('')
  const emailError = ref('')
  const notice = ref('')
  const resendBusy = ref(false)
  const resendCooldown = ref(0)
  const resendMessage = ref('')

  let timer: ReturnType<typeof setInterval> | null = null
  const stopTimer = (): void => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
  const startCooldown = (seconds: number): void => {
    stopTimer()
    resendCooldown.value = Math.max(0, Math.ceil(seconds))
    if (resendCooldown.value === 0) return
    timer = setInterval(() => {
      resendCooldown.value -= 1
      if (resendCooldown.value <= 0) {
        resendCooldown.value = 0
        stopTimer()
      }
    }, 1000)
  }

  const status = computed<EmailStatus>(() => {
    if (!savedEmail.value) return 'none'
    return verified.value ? 'verified' : 'unverified'
  })

  /** Take the saved address and its verified flag from a profile response. A missing flag means NOT verified. */
  const load = (profile: { email?: string | null; email_verified?: boolean | null }): void => {
    savedEmail.value = String(profile.email ?? '').trim()
    verified.value = profile.email_verified === true
  }

  const isChanged = (draft: string): boolean => norm(draft) !== norm(savedEmail.value)

  /**
   * The email fields to send with a save. The current password is included only for a
   * real change. Returns null (and sets `passwordError`) when a change has no password.
   */
  const prepare = (draft: string): { email: string; current_password?: string } | null => {
    passwordError.value = ''
    emailError.value = ''
    const email = draft.trim()
    if (!isChanged(draft)) return { email }
    if (!currentPassword.value) {
      passwordError.value = 'Enter your current password to change your email.'
      return null
    }
    return { email, current_password: currentPassword.value }
  }

  /** Record the server's view after a successful save. */
  const applySaved = (
    result: { email?: string | null; email_verified?: boolean | null },
    wasChanged: boolean,
  ): void => {
    load(result)
    currentPassword.value = ''
    passwordError.value = ''
    emailError.value = ''
    notice.value = wasChanged && savedEmail.value
      ? `We've sent a verification link to ${savedEmail.value}. Open it to verify this address.`
      : ''
    // The server has just sent a link to the new address and now limits re-sends to it,
    // so any countdown for the OLD address is replaced by a fresh one.
    if (wasChanged) {
      if (savedEmail.value) startCooldown(defaultCooldown)
      else startCooldown(0)
    }
  }

  /**
   * Show a failed save where it belongs. Returns the text for the general error banner,
   * or '' when the message was placed at a field.
   */
  const explainFailure = (err: unknown): string => {
    const described = describeEmailAuthError(err, 'profile')
    if (described.kind === 'wrong_password' || described.kind === 'password_required') {
      passwordError.value = described.message
      currentPassword.value = '' // retype it rather than resubmit a wrong one
      return ''
    }
    if (described.kind === 'invalid_email') {
      emailError.value = described.message
      return ''
    }
    return described.message
  }

  /** Send (or re-send) the verification link for the saved address. */
  const resend = async (): Promise<void> => {
    if (resendBusy.value || resendCooldown.value > 0) return
    if (status.value !== 'unverified') return
    resendBusy.value = true
    resendMessage.value = ''
    try {
      const outcome = (await deps.sendVerification()) as { status?: string } | null
      if (outcome?.status === 'already_verified') {
        verified.value = true
        notice.value = ''
        return
      }
      notice.value = `We've sent a verification link to ${savedEmail.value}.`
      startCooldown(defaultCooldown)
    } catch (error: unknown) {
      const described = describeEmailAuthError(error, 'sendVerification')
      resendMessage.value = described.message
      if (described.kind === 'rate_limited') startCooldown(described.retryAfterSeconds ?? defaultCooldown)
    } finally {
      resendBusy.value = false
    }
  }

  const dispose = (): void => {
    stopTimer()
  }
  if (getCurrentScope()) onScopeDispose(dispose)

  return {
    savedEmail,
    verified,
    status,
    currentPassword,
    passwordError,
    emailError,
    notice,
    resendBusy,
    resendCooldown,
    resendMessage,
    load,
    isChanged,
    prepare,
    applySaved,
    explainFailure,
    resend,
    dispose,
  }
}
