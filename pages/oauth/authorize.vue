<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background-color: var(--surface-base);">
    <div class="w-full max-w-md">

      <!-- Invalid link — client_id/redirect_uri failed validation. Never redirect from here. -->
      <div v-if="fatalError" class="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <XMarkIcon class="h-6 w-6 text-red-500" />
        </div>
        <h1 class="text-lg font-bold text-slate-900">This sign-in link isn't valid</h1>
        <p class="mt-2 text-sm text-slate-500">{{ fatalError }}</p>
      </div>

      <!-- Still validating params / checking session -->
      <div v-else-if="isLoading" class="flex flex-col items-center gap-3 py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-200" style="border-top-color: var(--accent-primary);" />
        <p class="text-sm text-slate-500">Loading…</p>
      </div>

      <!-- Not logged in yet: reuse the shared login/register component -->
      <div v-else-if="!userStore.isLoggedIn" class="rounded-2xl bg-white p-6 shadow-sm">
        <p class="mb-4 text-center text-sm text-slate-500">
          Sign in to MedsGH to continue to <span class="font-semibold text-slate-800">{{ clientName }}</span>
        </p>
        <Login inline @login-success="onLoginSuccess" />
      </div>

      <!-- Consent screen -->
      <div v-else class="rounded-2xl bg-white p-8 shadow-sm">
        <div class="mb-6 text-center">
          <h1 class="text-lg font-bold text-slate-900">
            <span class="font-semibold">{{ clientName }}</span> wants to connect to your MedsGH account
          </h1>
        </div>

        <ul class="mb-6 space-y-3">
          <li v-for="s in requestedScopes" :key="s.scope" class="flex items-start gap-3 text-sm text-slate-700">
            <CheckCircleIcon class="mt-0.5 h-4 w-4 shrink-0" style="color: var(--accent-primary);" />
            {{ s.label }}
          </li>
        </ul>

        <p v-if="submitError" class="mb-4 text-sm text-red-600">{{ submitError }}</p>

        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            :disabled="isSubmitting"
            @click="decide(false)"
          >
            Deny
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style="background-color: var(--accent-primary);"
            :disabled="isSubmitting"
            @click="decide(true)"
          >
            Allow
          </button>
        </div>

        <p class="mt-4 text-center text-xs text-slate-400">
          MedsGH will never share your password with {{ clientName }}.
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useUserStore } from '~/stores/user'
import { createOauthConsentService, type RequestedScope, type AuthorizeParams } from '~/services/oauthConsent/oauthConsentService'

definePageMeta({ layout: false })

const route = useRoute()
const userStore = useUserStore()
const oauthConsentService = createOauthConsentService(useApi())

const isLoading = ref(true)
const isSubmitting = ref(false)
const fatalError = ref<string | null>(null)
const submitError = ref<string | null>(null)
const clientName = ref('')
const requestedScopes = ref<RequestedScope[]>([])

const authParams = computed<AuthorizeParams>(() => ({
  clientId: String(route.query.client_id ?? ''),
  redirectUri: String(route.query.redirect_uri ?? ''),
  scope: route.query.scope ? String(route.query.scope) : undefined,
  state: route.query.state ? String(route.query.state) : undefined,
  codeChallenge: String(route.query.code_challenge ?? ''),
  codeChallengeMethod: String(route.query.code_challenge_method ?? 'S256'),
}))

const goTo = (url: string) => {
  window.location.href = url
}

const checkAndProceed = async () => {
  isLoading.value = true
  fatalError.value = null
  try {
    const { data } = await oauthConsentService.check(authParams.value)
    clientName.value = data.client_name
    requestedScopes.value = data.requested_scopes

    if (data.authenticated && data.skip_consent) {
      // Already granted this exact scope before — skip the screen entirely.
      await decide(true)
      return
    }
  } catch (err: any) {
    fatalError.value = err?.message || 'Unable to verify this sign-in request. Please ask the app for a new link.'
  } finally {
    isLoading.value = false
  }
}

const onLoginSuccess = () => {
  checkAndProceed()
}

const decide = async (allow: boolean) => {
  isSubmitting.value = true
  submitError.value = null
  try {
    const { data } = await oauthConsentService.decide({ ...authParams.value, allow })
    goTo(data.redirect_uri)
  } catch (err: any) {
    submitError.value = err?.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (!authParams.value.clientId || !authParams.value.redirectUri || !authParams.value.codeChallenge) {
    fatalError.value = 'This link is missing required parameters.'
    isLoading.value = false
    return
  }
  checkAndProceed()
})
</script>
