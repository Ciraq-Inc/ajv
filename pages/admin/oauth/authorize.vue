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

      <!-- Validating params + finalizing the already-authenticated admin session.
           No consent screen: this is a first-party internal tool, not a third
           party asking permission — see rigel-medsgh's ssoService.js. -->
      <div v-else class="flex flex-col items-center gap-3 py-16">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-200" style="border-top-color: var(--accent-primary);" />
        <p class="text-sm text-slate-500">Signing you in{{ clientName ? ` to ${clientName}` : '' }}…</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { createSsoConsentService, type SsoAuthorizeParams } from '~/services/ssoConsent/ssoConsentService'

// adminAuth middleware handles the "not logged in yet" case entirely: it
// saves this full path+query as adminIntendedRoute and redirects to
// /admin/login, which bounces back here (with the same query params)
// after a successful login. By the time this component mounts, the admin
// session is guaranteed valid — so this page only has one job: validate
// params, finalize, redirect.
definePageMeta({ layout: false, middleware: 'adminAuth' })

const route = useRoute()
const ssoConsentService = createSsoConsentService(useApi())

const fatalError = ref<string | null>(null)
const clientName = ref<string>('')

const readParams = (): SsoAuthorizeParams | null => {
  const q = route.query
  const clientId = typeof q.client_id === 'string' ? q.client_id : ''
  const redirectUri = typeof q.redirect_uri === 'string' ? q.redirect_uri : ''
  const codeChallenge = typeof q.code_challenge === 'string' ? q.code_challenge : ''
  const codeChallengeMethod = typeof q.code_challenge_method === 'string' ? q.code_challenge_method : ''
  const state = typeof q.state === 'string' ? q.state : undefined
  if (!clientId || !redirectUri || !codeChallenge || !codeChallengeMethod) return null
  return { clientId, redirectUri, codeChallenge, codeChallengeMethod, state }
}

onMounted(async () => {
  const params = readParams()
  if (!params) {
    fatalError.value = 'This sign-in link is missing required parameters.'
    return
  }

  try {
    const checkRes = await ssoConsentService.check(params)
    if (!checkRes.success || !checkRes.data) {
      fatalError.value = checkRes.message || 'Unknown or inactive client.'
      return
    }
    clientName.value = checkRes.data.client_name

    const consentRes = await ssoConsentService.consent(params)
    if (!consentRes.success || !consentRes.data) {
      fatalError.value = consentRes.message || 'Could not complete sign-in.'
      return
    }

    // Top-level navigation back to the relying tool's callback — not a
    // client-side route, this leaves the ajv origin entirely.
    window.location.href = consentRes.data.redirect_uri
  } catch (e: any) {
    fatalError.value = e?.message || 'Something went wrong. Please try again.'
  }
})
</script>
