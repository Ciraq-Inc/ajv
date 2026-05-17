<template>
    <div class="min-h-screen bg-slate-100">
        <div class="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-900">Store Hours</h1>
                    <p class="text-sm text-slate-500">Set when your pharmacy is open. Customers see pickup as an option only when you're open.</p>
                </div>
            </div>
        </div>

        <div class="mx-auto max-w-3xl px-4 py-8">
            <div v-if="!companyStore.isLoggedIn" class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
                <p class="font-medium">You need to log in to manage your hours.</p>
                <button @click="goToLogin" class="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Go to Login
                </button>
            </div>

            <template v-else>
                <div v-if="loading" class="space-y-3">
                    <div class="h-20 animate-pulse rounded-3xl bg-white shadow-sm"></div>
                    <div class="h-72 animate-pulse rounded-3xl bg-white shadow-sm"></div>
                </div>

                <div v-else-if="fetchError" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
                    <p class="font-medium">Failed to load hours: {{ fetchError }}</p>
                    <button @click="loadHours" class="mt-4 text-sm font-medium underline underline-offset-4">Try again</button>
                </div>

                <div v-else class="space-y-6">
                    <section v-if="!form.hours_confirmed_at" class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
                        <p class="font-medium">Please review and confirm your hours.</p>
                        <p class="mt-1">We've started you off with Mon–Sat 08:00–22:00 and Sunday closed. Adjust below and tap Save.</p>
                    </section>

                    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900">Open 24 hours</h3>
                                <p class="mt-1 text-sm text-slate-500">When on, your pharmacy is treated as always open and the day-by-day schedule is ignored.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                :aria-checked="form.is_24_hours"
                                @click="form.is_24_hours = !form.is_24_hours"
                                :class="['relative inline-flex h-7 w-12 items-center rounded-full transition', form.is_24_hours ? 'bg-slate-900' : 'bg-slate-300']"
                            >
                                <span :class="['inline-block h-5 w-5 rounded-full bg-white transition', form.is_24_hours ? 'translate-x-6' : 'translate-x-1']"></span>
                            </button>
                        </div>
                    </section>

                    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" :class="{ 'opacity-50 pointer-events-none': form.is_24_hours }">
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Weekly schedule</h3>
                            <p class="mt-1 text-sm text-slate-500">Times are in Ghana time. Pharmacies that close after midnight (e.g. 09:00–01:00) are handled automatically.</p>
                        </div>

                        <div class="mt-5 divide-y divide-slate-200">
                            <div
                                v-for="day in orderedDays"
                                :key="day.day_of_week"
                                class="grid grid-cols-1 gap-3 py-4 md:grid-cols-[110px,1fr,auto] md:items-center"
                            >
                                <div class="font-medium text-slate-900">{{ dayLabel(day.day_of_week) }}</div>

                                <div v-if="day.is_closed" class="text-sm text-slate-500 italic">Closed</div>
                                <div v-else class="flex flex-wrap items-center gap-2">
                                    <input
                                        v-model="day.opens_at"
                                        type="time"
                                        class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
                                    />
                                    <span class="text-sm text-slate-500">to</span>
                                    <input
                                        v-model="day.closes_at"
                                        type="time"
                                        class="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
                                    />
                                </div>

                                <label class="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        v-model="day.is_closed"
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    Closed
                                </label>
                            </div>
                        </div>
                    </section>

                    <div class="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="text-sm text-slate-500">
                            <span v-if="form.hours_confirmed_at">Last confirmed {{ formatConfirmed(form.hours_confirmed_at) }}</span>
                            <span v-else>Hours not confirmed yet.</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span v-if="saveStatus" class="text-sm font-medium" :class="saveStatusClass">{{ saveStatus }}</span>
                            <button
                                @click="saveHours"
                                :disabled="saving || !canSave"
                                class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {{ saving ? 'Saving...' : 'Save hours' }}
                            </button>
                        </div>
                    </div>

                    <p v-if="validationError" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        {{ validationError }}
                    </p>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompanyStore } from '~/stores/company'

interface DayHours {
  day_of_week: number
  opens_at: string
  closes_at: string
  is_closed: boolean
}

interface HoursForm {
  is_24_hours: boolean
  hours_confirmed_at: string | null
  days: DayHours[]
}

type SaveKind = 'info' | 'success' | 'error'

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  isLoggedIn: boolean
}

// TODO: remove once composables/ are .ts
const api = useApi() as unknown as {
  get: (url: string) => Promise<{ data?: Record<string, unknown> } | Record<string, unknown>>
  put: (url: string, body?: unknown) => Promise<{ data?: Record<string, unknown> } | Record<string, unknown>>
}

const route = useRoute()
const router = useRouter()

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const loading = ref<boolean>(true)
const saving = ref<boolean>(false)
const fetchError = ref<string | null>(null)
const validationError = ref<string | null>(null)
const saveStatus = ref<string>('')
const saveStatusKind = ref<SaveKind>('info')

const form = ref<HoursForm>({
  is_24_hours: false,
  hours_confirmed_at: null,
  days: [],
})

const orderedDays = computed<DayHours[]>(() => {
  if (!form.value.days.length) return []
  const byDow = new Map(form.value.days.map(d => [d.day_of_week, d]))
  return DISPLAY_ORDER.map(dow => byDow.get(dow)).filter((d): d is DayHours => d !== undefined)
})

const dayLabel = (dow: number): string => DAY_NAMES[dow] ?? String(dow)

const saveStatusClass = computed(() => ({
  'text-emerald-600': saveStatusKind.value === 'success',
  'text-rose-600': saveStatusKind.value === 'error',
  'text-slate-500': saveStatusKind.value === 'info',
}))

const canSave = computed<boolean>(() => {
  if (form.value.is_24_hours) return true
  if (!form.value.days.length) return false
  return form.value.days.every(d => {
    if (d.is_closed) return true
    if (!d.opens_at || !d.closes_at) return false
    return d.opens_at !== d.closes_at
  })
})

const formatConfirmed = (timestamp: string | null | undefined): string => {
  if (!timestamp) return ''
  try {
    return new Date(timestamp).toLocaleString('en-GB', {
      timeZone: 'Africa/Accra',
      dateStyle: 'medium',
      timeStyle: 'short',
    } as Intl.DateTimeFormatOptions)
  } catch {
    return timestamp
  }
}

const goToLogin = (): void => {
  const pharmacy = route.params['pharmacy']
  void router.push(`/${String(pharmacy)}/services/login`)
}

const loadHours = async (): Promise<void> => {
  loading.value = true
  fetchError.value = null
  try {
    const response = await api.get('/api/pharmacy-portal/hours') as { data?: Record<string, unknown> } | Record<string, unknown>
    const data = ('data' in response && response.data ? response.data : response) as {
      is_24_hours?: boolean | number
      hours_confirmed_at?: string | null
      days?: Array<{ day_of_week: number; opens_at?: string | null; closes_at?: string | null; is_closed?: boolean | number }>
    }
    form.value = {
      is_24_hours: Boolean(data.is_24_hours),
      hours_confirmed_at: data.hours_confirmed_at ?? null,
      days: (data.days ?? []).map(d => ({
        day_of_week: d.day_of_week,
        opens_at: d.opens_at ?? '08:00',
        closes_at: d.closes_at ?? '22:00',
        is_closed: Boolean(d.is_closed),
      })),
    }
  } catch (error) {
    fetchError.value = error instanceof Error ? error.message : 'Unable to load hours'
  } finally {
    loading.value = false
  }
}

const saveHours = async (): Promise<void> => {
  validationError.value = null
  if (!canSave.value) {
    validationError.value = 'Each open day needs different opens/closes times.'
    return
  }
  saving.value = true
  saveStatus.value = ''
  try {
    const payload = {
      is_24_hours: form.value.is_24_hours,
      days: form.value.days.map(d => ({
        day_of_week: d.day_of_week,
        opens_at: d.is_closed ? '00:00' : d.opens_at,
        closes_at: d.is_closed ? '00:00' : d.closes_at,
        is_closed: d.is_closed,
      })),
    }
    const response = await api.put('/api/pharmacy-portal/hours', payload) as { data?: { hours_confirmed_at?: string } } | { hours_confirmed_at?: string }
    const data = ('data' in response && response.data ? response.data : response) as { hours_confirmed_at?: string }
    form.value.hours_confirmed_at = data.hours_confirmed_at ?? form.value.hours_confirmed_at
    saveStatusKind.value = 'success'
    saveStatus.value = 'Saved'
    setTimeout(() => { saveStatus.value = '' }, 2500)
  } catch (error) {
    saveStatusKind.value = 'error'
    saveStatus.value = error instanceof Error ? error.message : 'Save failed'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (companyStore.isLoggedIn) {
    void loadHours()
  } else {
    loading.value = false
  }
})
</script>
