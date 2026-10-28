<template>
  <main class="flex min-h-screen items-center justify-center bg-ink-50 p-6">
    <div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_48px_-8px_rgba(30,26,34,0.18),0_0_0_1px_rgba(82,0,148,0.08)]">
      <img src="/brand/rig-mark.svg" alt="MedsGH" class="mx-auto mb-6 h-10" />

      <template v-if="status === 'idle' || status === 'submitting'">
        <h1 class="text-center text-xl font-bold text-ink-900">Set your password</h1>
        <p class="mt-2 mb-6 text-center text-base text-ink-600">Welcome to MedsGH. Choose a password to open your account and follow your order.</p>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div>
            <label for="password" class="mb-1.5 block text-sm font-semibold text-ink-900">New password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                :minlength="MIN_PASSWORD_LENGTH"
                autocomplete="new-password"
                :placeholder="`At least ${MIN_PASSWORD_LENGTH} characters`"
                class="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 pr-14 text-base text-ink-900 placeholder-ink-500 focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/15 disabled:opacity-60"
                :disabled="status === 'submitting'"
                @input="passwordTouched = true"
              />
              <button
                type="button"
                class="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeSlashIcon v-if="showPassword" class="h-5 w-5" aria-hidden="true" />
                <EyeIcon v-else class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ul v-if="passwordTouched" class="mt-2 space-y-1">
              <li class="flex items-center gap-1.5 text-sm" :class="password.length >= MIN_PASSWORD_LENGTH ? 'text-brand-700' : 'text-ink-500'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path v-if="password.length >= MIN_PASSWORD_LENGTH" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  <circle v-else cx="12" cy="12" r="9" stroke-width="2" />
                </svg>
                At least {{ MIN_PASSWORD_LENGTH }} characters
              </li>
            </ul>
          </div>
          <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
          <button
            type="submit"
            class="min-h-[48px] w-full rounded-2xl bg-brand-700 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="status === 'submitting'"
          >
            {{ status === 'submitting' ? 'Activating…' : 'Activate account' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="text-center">
          <h1 class="text-xl font-bold text-ink-900">This link can't be used</h1>
          <p role="alert" class="mt-2 text-base text-ink-700">This activation link is invalid or has already been used.</p>
          <NuxtLink
            to="/"
            class="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-brand-700 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-800"
          >Back to the home page</NuxtLink>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useUserStore } from '~/stores/user'

// Same floor as sign-up (backend passwordPolicy.js).
const MIN_PASSWORD_LENGTH = 6

const route = useRoute()
const router = useRouter()
const api = useApi()
const userStore = useUserStore()

const token = ref<string>('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const status = ref<'idle' | 'submitting' | 'invalid'>('idle')
const passwordTouched = ref(false)

onMounted(() => {
  const t = String(route.query.token ?? '')
  if (!t) {
    status.value = 'invalid'
    return
  }
  token.value = t
})

const submit = async () => {
  error.value = ''
  if (password.value.length < MIN_PASSWORD_LENGTH) {
    error.value = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    return
  }

  status.value = 'submitting'
  try {
    const res = await api.post('/api/order-requests/customer/activate', {
      token: token.value,
      password: password.value
    })
    if (res?.data) {
      userStore.applyCustomerAuthPayload(res.data)
    }
    await router.push('/customer')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Activation failed. The link may have expired.'
    if (error.value.toLowerCase().includes('invalid') || error.value.toLowerCase().includes('expired')) {
      status.value = 'invalid'
    } else {
      status.value = 'idle'
    }
  }
}
</script>
