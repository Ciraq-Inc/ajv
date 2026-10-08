<template>
  <main class="flex min-h-screen items-center justify-center bg-ink-50 p-6">
    <div class="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_48px_-8px_rgba(30,26,34,0.18),0_0_0_1px_rgba(82,0,148,0.08)]">
      <img src="/brand/rig-mark.svg" alt="MedsGH" class="mx-auto mb-6 h-10" />

      <div v-if="state === 'working'" role="status" aria-live="polite">
        <h1 class="text-xl font-bold text-ink-900">Verifying your email…</h1>
        <p class="mt-2 text-sm text-ink-600">One moment.</p>
      </div>

      <div v-else-if="state === 'verified'" aria-live="polite">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50">
          <svg class="h-7 w-7 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-ink-900">Email verified</h1>
        <p class="mt-2 text-sm text-ink-600">
          Thanks. We'll send your order updates to this address, and you can use it to sign in.
        </p>
        <NuxtLink to="/customer" class="mt-6 block w-full rounded-2xl bg-brand-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800">
          Continue to my account
        </NuxtLink>
      </div>

      <div v-else>
        <h1 class="text-xl font-bold text-ink-900">We couldn't verify your email</h1>
        <p role="alert" class="mt-2 text-sm text-red-700">{{ failureMessage }}</p>
        <button
          v-if="canRetry"
          type="button"
          class="mt-6 w-full rounded-2xl bg-brand-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800"
          @click="redeem"
        >
          Try again
        </button>
        <NuxtLink
          to="/customer"
          class="mt-4 block text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Go to my account
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { readTokenFromHash, scrubTokenFromUrl } from '~/utils/emailLinkToken'
import { describeEmailAuthError } from '~/utils/emailAuthMessages'
import type { EmailAuthErrorKind } from '~/utils/emailAuthMessages'

definePageMeta({ layout: false })
useHead({
  title: 'Verify your email',
  meta: [
    { name: 'robots', content: 'noindex' },
    { name: 'referrer', content: 'no-referrer' },
  ],
})

type State = 'working' | 'verified' | 'failed'

const userStore = useUserStore()

const state = ref<State>('working')
const failureMessage = ref('')
const failureKind = ref<EmailAuthErrorKind | 'missing'>('unknown')
// Kept in memory only: the address bar is scrubbed so the token does not linger in
// history, but "Try again" after a dropped connection still needs it.
let token: string | null = null

// Retrying only helps when the link itself is still good.
const canRetry = computed(
  () => token !== null && ['network', 'unavailable', 'rate_limited', 'unknown'].includes(failureKind.value),
)

const redeem = async (): Promise<void> => {
  if (!token) return
  state.value = 'working'
  try {
    await userStore.verifyEmail(token)
    state.value = 'verified'
    token = null // spent
  } catch (error: unknown) {
    const described = describeEmailAuthError(error, 'verify')
    failureKind.value = described.kind
    failureMessage.value = described.message
    if (described.kind === 'invalid_link' || described.kind === 'email_taken') token = null
    state.value = 'failed'
  }
}

onMounted(async () => {
  token = readTokenFromHash(window.location.hash)
  scrubTokenFromUrl(window)

  if (!token) {
    failureKind.value = 'missing'
    failureMessage.value = 'This link is incomplete or invalid. Open the link from your email again, or request a new verification email from your account.'
    state.value = 'failed'
    return
  }
  await redeem()
})
</script>
