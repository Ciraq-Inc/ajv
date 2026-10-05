<template>
  <div class="fixed inset-0 flex items-center justify-center overflow-y-auto py-8 px-4" :style="{ backgroundColor: bgColor }">
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

      <div class="flex flex-col items-center pt-8 pb-5 px-6">
        <img src="/brand/rig-mark.svg" alt="Rigel" class="w-14 h-14 mb-4" />
        <p class="text-[10px] font-black uppercase tracking-[0.18em] mb-2" :style="{ color: accentColor }">
          {{ companyName }} Services
        </p>
        <h2 class="text-xl font-black text-zinc-900 tracking-tight text-center leading-tight">
          {{ submitted ? 'Request sent' : 'Contact support' }}
        </h2>
        <p class="text-xs text-zinc-500 mt-1.5 text-center font-medium">
          {{ submitted
            ? 'Our support team will get back to you by SMS.'
            : 'Can\'t sign in? Tell us what\'s wrong and we\'ll help.' }}
        </p>
      </div>

      <div class="px-6 pb-2">

        <div v-if="error" role="alert" class="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 mb-4">
          <p class="text-sm text-red-700 font-medium">{{ error }}</p>
        </div>

        <!-- Sent -->
        <div v-if="submitted" class="pb-4">
          <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 mb-5">
            <p class="text-sm text-emerald-700 font-medium">
              Ticket #{{ ticketId }} was created. We'll text updates to
              <strong>{{ formatPhoneDisplay(phone) }}</strong>.
            </p>
          </div>
          <button type="button" @click="backToLogin"
            class="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90"
            :style="{ backgroundColor: accentColor }">
            Back to sign in
          </button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="submit">
          <div class="mb-4">
            <label for="supportPhone" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Your phone number</label>
            <div class="flex">
              <span class="inline-flex items-center px-3 text-sm font-semibold text-zinc-600 bg-zinc-100 border border-r-0 border-zinc-200 rounded-l-xl">+233</span>
              <input v-model="phone" id="supportPhone" type="tel" required :disabled="loading"
                placeholder="24 123 4567"
                class="block w-full rounded-none rounded-r-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
            <p class="mt-1.5 text-xs text-zinc-400 font-medium">Must be the number your pharmacy has on file for you</p>
          </div>

          <div class="mb-4">
            <label for="supportCategory" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">What do you need help with?</label>
            <select v-model="category" id="supportCategory" :disabled="loading"
              class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none bg-white">
              <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="mb-4">
            <label for="supportSubject" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Subject</label>
            <input v-model="subject" id="supportSubject" type="text" required maxlength="255" :disabled="loading"
              class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none" />
          </div>

          <div class="mb-5">
            <label for="supportMessage" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Message</label>
            <textarea v-model="description" id="supportMessage" rows="4" required maxlength="10000" :disabled="loading"
              class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none"></textarea>
          </div>

          <div class="flex justify-end gap-2 pb-2">
            <button type="button" @click="backToLogin" :disabled="loading"
              class="px-4 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl disabled:opacity-50 transition-colors">
              Back
            </button>
            <button type="submit" :disabled="loading || !canSubmit"
              class="px-5 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition-opacity"
              :style="{ backgroundColor: accentColor }">
              {{ loading ? 'Sending…' : 'Send request' }}
            </button>
          </div>
        </form>
      </div>

      <div class="px-6 py-4 mt-2 border-t border-zinc-100 flex items-center justify-center">
        <p class="text-xs text-zinc-400 font-medium">Your pharmacy administrator can also enable your access</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import { createPharmacyService } from '~/services/pharmacy/pharmacyService'
import { createSupportService, type TicketCategory } from '~/services/support/supportService'

// Public on purpose: the people who need this are the ones who can't sign in,
// so no `company-auth` middleware here.
definePageMeta({ layout: false })

interface ThemeSource { theme_preset?: string | null; theme_color?: string | null }

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  checkAuthState: () => Promise<void>
  currentCompany: ThemeSource | null
  userName: string | null
  userPhone: string | null
  phoneVerifying: string | null
}

const router = useRouter()
const route = useRoute()

const THEME_PRESETS: Record<string, { bg: string; accent: string }> = {
  indigo:  { bg: '#1e1b4b', accent: '#6366f1' },
  teal:    { bg: '#042f2e', accent: '#0d9488' },
  rose:    { bg: '#4c0519', accent: '#e11d48' },
  emerald: { bg: '#022c22', accent: '#059669' },
  orange:  { bg: '#431407', accent: '#ea580c' },
  slate:   { bg: '#0f172a', accent: '#475569' },
}

const accentColor = ref<string>('#6366f1')
const bgColor = ref<string>('#1e1b4b')

const applyTheme = (company: ThemeSource | null | undefined): void => {
  if (!company) return
  if (company.theme_preset === 'custom' && company.theme_color) {
    accentColor.value = company.theme_color
    bgColor.value = '#0f172a'
    return
  }
  const preset = (company.theme_preset ? THEME_PRESETS[company.theme_preset] : undefined) ?? THEME_PRESETS['indigo']!
  accentColor.value = preset.accent
  bgColor.value = preset.bg
}

const companyDomain = computed<string>(() => route.path.match(/\/([^/]+)\/services/)?.[1] ?? '')
const companyName = computed<string>(() =>
  companyDomain.value.charAt(0).toUpperCase() + companyDomain.value.slice(1))

const categoryOptions: { value: TicketCategory; label: string }[] = [
  { value: 'account', label: 'Sign-in or account access' },
  { value: 'technical', label: 'Something isn\'t working' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Something else' },
]

const phone = ref<string>('')
const category = ref<TicketCategory>('account')
const subject = ref<string>('')
const description = ref<string>('')
const loading = ref<boolean>(false)
const error = ref<string>('')
const submitted = ref<boolean>(false)
const ticketId = ref<number | null>(null)

const canSubmit = computed<boolean>(() =>
  phone.value.replace(/\D/g, '').length >= 9
  && subject.value.trim().length > 0
  && description.value.trim().length > 0)

const formatPhoneDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('233')) return '+233 ' + digits.slice(3)
  if (digits.startsWith('0')) return '+233 ' + digits.slice(1)
  return '+233 ' + digits
}

onMounted(async () => {
  // Read the number typed on the sign-in screen *before* checkAuthState():
  // with no active session it clears phoneVerifying. Kept in the store, never
  // in the URL.
  const typedAtLogin = companyStore.phoneVerifying
  await companyStore.checkAuthState()
  const known = companyStore.userPhone ?? typedAtLogin
  if (known) phone.value = known.replace(/^\+?233/, '0')
  if (companyStore.currentCompany) {
    applyTheme(companyStore.currentCompany)
    return
  }
  try {
    if (!companyDomain.value) return
    const data = await createPharmacyService(useApi()).getByDomainSlug(companyDomain.value) as { data?: ThemeSource } | ThemeSource
    applyTheme(('data' in data ? data.data : data) as ThemeSource)
  } catch {
    // keep default theme
  }
})

const submit = async (): Promise<void> => {
  if (!canSubmit.value) return
  error.value = ''
  loading.value = true
  try {
    const result = await createSupportService(useApi()).submitStaffTicket({
      companyDomain: companyDomain.value,
      phone: phone.value,
      subject: subject.value.trim(),
      description: description.value.trim(),
      category: category.value,
    })
    ticketId.value = result.data.id
    submitted.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not send your request. Please try again.'
  } finally {
    loading.value = false
  }
}

const backToLogin = (): void => {
  void router.push(`/${companyDomain.value}/services/login`)
}
</script>
