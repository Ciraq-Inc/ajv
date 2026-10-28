<script setup lang="ts">
import { ref } from 'vue'
import { CheckIcon, MapPinIcon, TagIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'
import { useApi } from '~/composables/useApi'
import type { HeroDraftItem } from '~/components/home/content'

// Guest "quick request" card: a visitor lists medicines + a phone number and we
// SMS them. Items may be pre-filled from the Clearance Marketplace (draftItems).
const props = defineProps<{ draftItems: HeroDraftItem[] }>()
const emit = defineEmits<{
  'update:draftItems': [items: HeroDraftItem[]]
  'switch-view': [view: 'login' | 'signup']
}>()

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft'

const heroMedication = ref<string>('')
const heroPhone = ref<string>('')
const heroGuestLoading = ref<boolean>(false)
const heroGuestError = ref<string>('')
const heroGuestSuccess = ref<boolean>(false)

const setDraftItems = (items: HeroDraftItem[]): void => emit('update:draftItems', items)

const removeHeroDraftItem = (index: number): void => {
  setDraftItems(props.draftItems.filter((_, i) => i !== index))
}

const increaseHeroDraftItemQty = (index: number): void => {
  setDraftItems(props.draftItems.map((entry, i) => (
    i === index ? { ...entry, quantity: entry.quantity + 1 } : entry
  )))
}

const decreaseHeroDraftItemQty = (index: number): void => {
  setDraftItems(props.draftItems.map((entry, i) => (
    i === index ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry
  )))
}

// Location picker state
interface SelectedLocation { label: string; lat: number; lng: number }
const heroSelectedLocation = ref<SelectedLocation | null>(null)
const heroAddressQuery = ref<string>('')
const heroAddressSuggestions = ref<Array<{ display_name: string; lat: number; lng: number }>>([])
const heroAddressLoading = ref<boolean>(false)
const heroAddressDropdownOpen = ref<boolean>(false)
const heroGpsLoading = ref<boolean>(false)
const heroGpsError = ref<string>('')
const heroAddressActiveIndex = ref<number>(-1)
let heroAddressTimer: ReturnType<typeof setTimeout> | null = null

const clearHeroLocation = (): void => {
  heroSelectedLocation.value = null
  heroAddressQuery.value = ''
  heroAddressSuggestions.value = []
  heroAddressDropdownOpen.value = false
  heroAddressActiveIndex.value = -1
  heroGpsError.value = ''
}

const detectHeroLocation = (): void => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    heroGpsError.value = 'Location access is not available in this browser.'
    return
  }
  heroGpsLoading.value = true
  heroGpsError.value = ''
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      try {
        const svc = createOrderRequestsService(useApi())
        const res = await svc.reverseGeocode(lat, lng)
        const label = (res.data as { display_name?: string } | null)?.display_name ?? 'Detected location'
        heroSelectedLocation.value = { label, lat, lng }
      } catch {
        heroSelectedLocation.value = { label: 'Detected location', lat, lng }
      }
      heroGpsLoading.value = false
    },
    (err) => {
      heroGpsLoading.value = false
      heroGpsError.value = err.code === 1
        ? 'Location permission denied. Please type your address below.'
        : 'Could not get your location. Please type your address below.'
    },
    { timeout: 10000, enableHighAccuracy: true }
  )
}

const onHeroAddressInput = (): void => {
  if (heroAddressTimer) clearTimeout(heroAddressTimer)
  const q = heroAddressQuery.value.trim()
  if (q.length < 3) {
    heroAddressSuggestions.value = []
    heroAddressDropdownOpen.value = false
    heroAddressActiveIndex.value = -1
    return
  }
  heroAddressLoading.value = true
  heroAddressTimer = setTimeout(async () => {
    try {
      const svc = createOrderRequestsService(useApi())
      const res = await svc.geocodeAddress(q)
      heroAddressSuggestions.value = Array.isArray(res.data) ? res.data : []
      heroAddressDropdownOpen.value = heroAddressSuggestions.value.length > 0
      heroAddressActiveIndex.value = -1
    } catch {
      heroAddressSuggestions.value = []
    } finally {
      heroAddressLoading.value = false
    }
  }, 400)
}

const selectHeroLocation = (s: { display_name: string; lat: number; lng: number }): void => {
  heroSelectedLocation.value = { label: s.display_name, lat: s.lat, lng: s.lng }
  heroAddressQuery.value = ''
  heroAddressSuggestions.value = []
  heroAddressDropdownOpen.value = false
  heroAddressActiveIndex.value = -1
}

const onHeroAddressKeydown = (event: KeyboardEvent): void => {
  const count = heroAddressSuggestions.value.length
  if (!heroAddressDropdownOpen.value || !count) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    heroAddressActiveIndex.value = (heroAddressActiveIndex.value + 1) % count
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    heroAddressActiveIndex.value = heroAddressActiveIndex.value <= 0 ? count - 1 : heroAddressActiveIndex.value - 1
  } else if (event.key === 'Enter' && heroAddressActiveIndex.value >= 0) {
    event.preventDefault()
    selectHeroLocation(heroAddressSuggestions.value[heroAddressActiveIndex.value]!)
  } else if (event.key === 'Escape') {
    heroAddressDropdownOpen.value = false
    heroAddressActiveIndex.value = -1
  }
}

const closeHeroAddressDropdown = (): void => {
  setTimeout(() => { heroAddressDropdownOpen.value = false }, 150)
}

const resetHeroGuestForm = (): void => {
  heroGuestSuccess.value = false
  heroMedication.value = ''
  heroPhone.value = ''
  heroGuestError.value = ''
  clearHeroLocation()
}

const submitHeroGuestRequest = async (): Promise<void> => {
  heroGuestError.value = ''
  heroGuestLoading.value = true
  try {
    const api = useApi()
    const service = createOrderRequestsService(api)
    const parsedItems = props.draftItems.length
      ? props.draftItems.map(({ product_name, requested_unit, quantity, prefer_clearance_only }) => ({ product_name, requested_unit, quantity, prefer_clearance_only }))
      : heroMedication.value
        .split(/\n+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(name => ({ product_name: name, quantity: 1 }))

    const result = await service.submitAsGuest({
      phone: heroPhone.value.trim(),
      items: parsedItems,
      customer_address: heroSelectedLocation.value?.label || undefined,
      customer_latitude: heroSelectedLocation.value?.lat ?? undefined,
      customer_longitude: heroSelectedLocation.value?.lng ?? undefined,
    })
    if (!result.success) {
      heroGuestError.value = result.message ?? 'Failed to place request. Please try again.'
      return
    }
    heroGuestSuccess.value = true
    if (props.draftItems.length) {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(HOMEPAGE_REQUEST_DRAFT_KEY)
      setDraftItems([])
    }
  } catch (err: unknown) {
    heroGuestError.value = (err as { message?: string })?.message ?? 'Something went wrong. Please try again.'
  } finally {
    heroGuestLoading.value = false
  }
}

const fieldClass = 'w-full rounded-xl border border-input bg-white px-4 py-3 text-[0.95rem] text-brand-950 placeholder:text-ink-400 transition focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/15 disabled:opacity-50'
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-600'
const spinnerPath = 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
</script>

<template>
  <div class="w-full overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-brand-700/10">

    <!-- Success state -->
    <div v-if="heroGuestSuccess" class="px-7 py-9 text-center" role="status">
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <CheckIcon class="h-7 w-7" stroke-width="2.5" aria-hidden="true" />
      </div>
      <p class="font-display text-xl font-extrabold text-brand-950">Request sent</p>
      <p class="mt-2 text-base leading-relaxed text-ink-600">
        We'll text you at <strong class="text-brand-950">{{ heroPhone }}</strong>
        with a link to track your order.
      </p>
      <button
        type="button"
        class="mt-7 w-full rounded-2xl border border-brand-200 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/50"
        @click="resetHeroGuestForm"
      >Send another</button>
      <div class="mt-4 border-t border-brand-100 pt-4">
        <p class="mb-1 text-sm text-ink-600">Don't want to wait for the text?</p>
        <button
          type="button"
          class="text-sm font-bold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          @click="emit('switch-view', 'login')"
        >Sign in</button>
        <span class="mx-1 text-ink-400" aria-hidden="true">·</span>
        <button
          type="button"
          class="text-sm font-bold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          @click="emit('switch-view', 'signup')"
        >Create your account</button>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="space-y-4 px-6 pb-6 pt-6 sm:px-7" @submit.prevent="submitHeroGuestRequest">
      <div v-if="heroGuestError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ heroGuestError }}
      </div>

      <!-- Pre-filled products (arrived from the Clearance Marketplace) -->
      <div v-if="draftItems.length">
        <div class="mb-1.5 flex items-center justify-between">
          <span :class="labelClass" class="!mb-0">What you're requesting</span>
          <span class="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-sm font-bold text-brand-700">
            <TagIcon class="h-4 w-4" aria-hidden="true" /> Clearance pricing
          </span>
        </div>
        <ul class="space-y-2">
          <li
            v-for="(item, index) in draftItems"
            :key="`${item.product_name}-${index}`"
            class="flex items-center gap-1 rounded-xl border border-brand-100 bg-white py-1 pl-3.5 pr-1"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-brand-950">{{ item.product_name }}</span>
            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                :disabled="heroGuestLoading || item.quantity <= 1"
                aria-label="Decrease quantity"
                class="flex h-11 w-11 items-center justify-center rounded-full text-lg text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-40"
                @click="decreaseHeroDraftItemQty(index)"
              >−</button>
              <span class="w-6 text-center text-base text-brand-950">{{ item.quantity }}</span>
              <button
                type="button"
                :disabled="heroGuestLoading"
                aria-label="Increase quantity"
                class="flex h-11 w-11 items-center justify-center rounded-full text-lg text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-40"
                @click="increaseHeroDraftItemQty(index)"
              >+</button>
            </div>
            <button
              type="button"
              :disabled="heroGuestLoading"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-40"
              aria-label="Remove item"
              @click="removeHeroDraftItem(index)"
            >
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Freeform request -->
      <div v-else>
        <label for="hero-medications" :class="labelClass">What do you need?</label>
        <textarea
          id="hero-medications"
          v-model="heroMedication"
          rows="3"
          placeholder="e.g. Paracetamol 500mg"
          aria-describedby="hero-medications-hint"
          required
          :disabled="heroGuestLoading"
          :class="[fieldClass, 'resize-none']"
        />
        <p id="hero-medications-hint" class="mt-1.5 text-sm text-ink-500">Put each medicine on its own line.</p>
      </div>

      <div>
        <label for="hero-phone" :class="labelClass">Your phone number</label>
        <input
          id="hero-phone"
          v-model="heroPhone"
          type="tel"
          placeholder="e.g. 0244 123 456"
          autocomplete="tel"
          required
          :disabled="heroGuestLoading"
          :class="fieldClass"
        />
      </div>

      <!-- Location picker: GPS first, search-as-you-type fallback -->
      <div>
        <label v-if="!heroSelectedLocation" for="hero-address" :class="labelClass">
          Delivery location <span class="font-normal text-ink-500">(optional)</span>
        </label>
        <p v-else :class="labelClass">
          Delivery location <span class="font-normal text-ink-500">(optional)</span>
        </p>

        <!-- Confirmed location pill -->
        <div
          v-if="heroSelectedLocation"
          class="flex items-center gap-2 rounded-xl border border-brand-700/30 bg-brand-50 py-1 pl-3.5 pr-1"
        >
          <MapPinIcon class="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
          <span class="flex-1 truncate text-sm text-brand-950">{{ heroSelectedLocation.label }}</span>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-500 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Clear location"
            @click="clearHeroLocation"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <!-- Unconfirmed: GPS button + divider + search input -->
        <template v-else>
          <button
            type="button"
            :disabled="heroGuestLoading || heroGpsLoading"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/50 disabled:opacity-50"
            @click="detectHeroLocation"
          >
            <svg v-if="heroGpsLoading" class="h-4 w-4 animate-spin text-brand-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" :d="spinnerPath"></path>
            </svg>
            <MapPinIcon v-else class="h-4 w-4" aria-hidden="true" />
            {{ heroGpsLoading ? 'Detecting location…' : 'Use my location' }}
          </button>

          <p v-if="heroGpsError" role="alert" class="mt-1.5 text-sm text-red-700">{{ heroGpsError }}</p>

          <div class="relative my-2.5 flex items-center">
            <div class="flex-1 border-t border-brand-100"></div>
            <span class="mx-3 text-sm text-ink-500">or type address</span>
            <div class="flex-1 border-t border-brand-100"></div>
          </div>

          <div class="relative">
            <input
              id="hero-address"
              v-model="heroAddressQuery"
              type="text"
              placeholder="Search: East Legon, Achimota…"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="hero-address-suggestions"
              :aria-expanded="heroAddressDropdownOpen && heroAddressSuggestions.length > 0"
              :aria-activedescendant="heroAddressActiveIndex >= 0 ? `hero-address-option-${heroAddressActiveIndex}` : undefined"
              :disabled="heroGuestLoading"
              :class="[fieldClass, 'pr-10']"
              @keydown="onHeroAddressKeydown"
              @input="onHeroAddressInput"
              @blur="closeHeroAddressDropdown"
              @focus="heroAddressDropdownOpen = heroAddressSuggestions.length > 0"
            />
            <div v-if="heroAddressLoading" class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
              <svg class="h-4 w-4 animate-spin text-brand-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" :d="spinnerPath"></path>
              </svg>
            </div>
            <ul
              v-if="heroAddressDropdownOpen && heroAddressSuggestions.length"
              id="hero-address-suggestions"
              role="listbox"
              aria-label="Address suggestions"
              class="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-brand-100 bg-white shadow-lift"
            >
              <li
                v-for="(s, index) in heroAddressSuggestions"
                :id="`hero-address-option-${index}`"
                :key="s.display_name"
                role="option"
                :aria-selected="heroAddressActiveIndex === index"
                class="flex cursor-pointer items-start gap-2.5 px-4 py-3 text-sm text-brand-950"
                :class="heroAddressActiveIndex === index ? 'bg-brand-50' : 'hover:bg-brand-50'"
                @mouseenter="heroAddressActiveIndex = index"
                @mousedown.prevent="selectHeroLocation(s)"
              >
                <MapPinIcon class="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                <span class="leading-snug">{{ s.display_name }}</span>
              </li>
            </ul>
          </div>
        </template>
      </div>

      <button
        type="submit"
        :disabled="heroGuestLoading || !heroPhone.trim() || (draftItems.length === 0 && !heroMedication.trim())"
        class="btn-cta w-full"
      >
        <svg v-if="heroGuestLoading" class="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" :d="spinnerPath"></path>
        </svg>
        {{ heroGuestLoading ? 'Sending…' : 'Send my request' }}
      </button>

      <p class="text-center text-sm text-ink-500">
        Have an account?
        <button
          type="button"
          class="font-bold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          @click="emit('switch-view', 'login')"
        >Sign in</button>
      </p>
    </form>
  </div>
</template>
