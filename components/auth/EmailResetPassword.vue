<template>
  <main class="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6">
    <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_48px_-8px_rgba(30,26,34,0.18),0_0_0_1px_rgba(82,0,148,0.08)]">
      <img src="/brand/rig-mark.svg" alt="MedsGH" class="mx-auto mb-6 h-10" />

      <!-- Password updated -->
      <div v-if="state === 'done'" class="text-center" aria-live="polite">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50">
          <svg class="h-7 w-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-[#1e1a22]">Password updated</h1>
        <p class="mt-2 text-sm text-[#4c4453]">You can now sign in with your new password. Any other devices have been signed out.</p>
        <NuxtLink :to="signInHref" class="mt-6 block w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#6c24b3]">
          Go to sign in
        </NuxtLink>
      </div>

      <!-- Link unusable -->
      <div v-else-if="state === 'invalid'" class="text-center">
        <h1 class="text-xl font-bold text-[#1e1a22]">This link can't be used</h1>
        <p role="alert" class="mt-2 text-sm text-red-700">{{ errorMessage }}</p>
        <NuxtLink :to="requestNewHref" class="mt-6 block w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#6c24b3]">
          Request a new reset link
        </NuxtLink>
      </div>

      <!-- Form -->
      <form v-else novalidate @submit.prevent="onSubmit">
        <h1 class="text-center text-xl font-bold text-[#1e1a22]">Choose a new password</h1>

        <div class="mt-6">
          <label for="new-password" class="mb-1.5 block text-sm font-semibold text-[#1e1a22]">New password</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            :disabled="busy"
            class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm text-[#1e1a22] focus:border-[#520094]/50 focus:outline-none focus:ring-2 focus:ring-[#520094]/15"
          >
        </div>

        <div class="mt-4">
          <label for="confirm-password" class="mb-1.5 block text-sm font-semibold text-[#1e1a22]">Confirm new password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            :disabled="busy"
            class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm text-[#1e1a22] focus:border-[#520094]/50 focus:outline-none focus:ring-2 focus:ring-[#520094]/15"
          >
        </div>

        <p v-if="errorMessage" role="alert" class="mt-3 text-sm text-red-700">{{ errorMessage }}</p>

        <button
          type="submit"
          :disabled="busy"
          class="mt-6 w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#6c24b3] disabled:opacity-60"
        >
          {{ busy ? 'Saving…' : 'Save new password' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { readTokenFromHash, scrubTokenFromUrl } from '~/utils/emailLinkToken'
import { describeEmailAuthError } from '~/utils/emailAuthMessages'
import type { EmailAuthError } from '~/utils/emailAuthMessages'

const props = defineProps<{
  /** Redeems the emailed token. Resolves on success; rejects with an API error or an already-described error. */
  submit: (token: string, newPassword: string) => Promise<unknown>
  signInHref: string
  requestNewHref: string
}>()

type State = 'form' | 'done' | 'invalid'

const state = ref<State>('form')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const busy = ref(false)
// In memory only: the address bar is scrubbed, but a rejected password must be
// retryable with the same (still unspent) link.
let token: string | null = null

const isDescribed = (e: unknown): e is EmailAuthError =>
  !!e && typeof e === 'object' && typeof (e as EmailAuthError).kind === 'string' && typeof (e as EmailAuthError).message === 'string'

const onSubmit = async (): Promise<void> => {
  if (busy.value || !token) return
  errorMessage.value = ''

  if (!newPassword.value) {
    errorMessage.value = 'Enter a new password.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'The two passwords do not match.'
    return
  }

  busy.value = true
  try {
    await props.submit(token, newPassword.value)
    token = null // spent
    newPassword.value = ''
    confirmPassword.value = ''
    state.value = 'done'
  } catch (error: unknown) {
    const described = isDescribed(error) ? error : describeEmailAuthError(error, 'reset')
    errorMessage.value = described.message
    if (described.kind === 'invalid_link') {
      token = null
      newPassword.value = ''
      confirmPassword.value = ''
      state.value = 'invalid'
    }
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  token = readTokenFromHash(window.location.hash)
  scrubTokenFromUrl(window)

  if (!token) {
    errorMessage.value = 'This link is incomplete or invalid. Open the link from your email again, or request a new one.'
    state.value = 'invalid'
  }
})
</script>
