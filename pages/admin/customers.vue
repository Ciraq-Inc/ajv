<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Customers</h1>
        <p class="text-sm text-gray-500 mt-1">Find an existing customer or place an order on their behalf</p>
      </div>
      <button
        type="button"
        @click="openCreateModal"
        class="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create customer
      </button>
    </div>

    <!-- Section 0: Search existing customers -->
    <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Find existing customer</h2>

      <div ref="searchContainer" class="relative max-w-lg">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or phone…"
          autocomplete="off"
          class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          @input="onSearchInput"
        />

        <!-- Search results dropdown -->
        <ul
          v-if="searchResults.length && showSearchResults"
          class="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg text-sm max-h-60 overflow-y-auto"
        >
          <li
            v-for="c in searchResults"
            :key="c.id"
            @click="selectExistingCustomer(c)"
            class="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-purple-50"
          >
            <span class="font-medium text-gray-900">{{ c.name || '(no name)' }}</span>
            <span class="text-gray-500 text-xs ml-2">{{ c.phone }}</span>
          </li>
        </ul>

        <p v-if="searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading" class="mt-1 text-xs text-gray-400">No customers found.</p>
        <p v-if="searchLoading" class="mt-1 text-xs text-gray-400">Searching…</p>
      </div>

      <div v-if="pendingCustomer && selectedViaSearch" class="mt-3 inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-sm text-purple-800">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ pendingCustomer.name || pendingCustomer.phone }} selected
        <button type="button" @click="clearSelectedCustomer" class="ml-1 text-purple-400 hover:text-purple-700">&#215;</button>
      </div>
    </div>

    <!-- Section 2: Place order (revealed after customer selected or created) -->
    <div v-if="pendingCustomer" class="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 class="text-base font-semibold text-gray-800 mb-1">Place first order</h2>

      <!-- Customer summary -->
      <div class="mb-4 flex items-center gap-3 text-sm text-gray-600">
        <span class="font-medium text-gray-900">{{ pendingCustomer.name }}</span>
        <span>&middot;</span>
        <a :href="`tel:${pendingCustomer.phone}`" class="hover:underline">{{ pendingCustomer.phone }}</a>
      </div>

      <form @submit.prevent="submitPlaceOrder" class="space-y-5 max-w-2xl">
        <!-- Items list -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Items <span class="text-red-500">*</span></label>
            <button
              type="button"
              @click="addItem"
              class="text-sm text-purple-700 hover:underline font-medium"
            >+ Add item</button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(item, idx) in orderItems"
              :key="idx"
              class="flex items-center gap-2"
            >
              <input
                v-model="item.name"
                type="text"
                required
                placeholder="Product name"
                class="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                required
                placeholder="Qty"
                class="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                v-model="item.unit"
                type="text"
                placeholder="Unit (opt.)"
                class="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                v-if="orderItems.length > 1"
                type="button"
                @click="removeItem(idx)"
                class="shrink-0 text-gray-400 hover:text-red-500 transition"
                title="Remove item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Delivery location (autocomplete) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Delivery location
            <span class="text-gray-400 font-normal">(search or use GPS)</span>
          </label>

          <div ref="locationContainer" class="relative">
            <div class="flex gap-2">
              <input
                v-model="locationQuery"
                type="text"
                placeholder="Search address…"
                autocomplete="off"
                class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                @input="onLocationInput"
              />
              <button
                type="button"
                :disabled="gpsLoading"
                @click="useMyLocation"
                class="shrink-0 flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                title="Use my GPS location"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ gpsLoading ? 'Locating…' : 'GPS' }}
              </button>
            </div>

            <!-- Suggestions dropdown -->
            <ul
              v-if="locationSuggestions.length && showSuggestions"
              class="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg text-sm max-h-52 overflow-y-auto"
            >
              <li
                v-for="(s, i) in locationSuggestions"
                :key="i"
                @click="selectSuggestion(s)"
                class="px-3 py-2 cursor-pointer hover:bg-purple-50 text-gray-800 leading-snug"
              >
                {{ s.display_name }}
              </li>
            </ul>
          </div>

          <!-- Selected location chip -->
          <div v-if="typeof orderLat === 'number'" class="mt-1 flex items-center gap-1 text-xs text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Location set ({{ orderLat.toFixed(4) }}, {{ orderLng!.toFixed(4) }})
            <button type="button" @click="clearLocation" class="ml-1 text-gray-400 hover:text-red-500">&#215;</button>
          </div>
          <p v-else class="mt-1 text-xs text-gray-400">No location selected — order will be placed without GPS coordinates.</p>
        </div>

        <!-- Notes -->
        <div>
          <label for="o-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            id="o-notes"
            v-model="orderNotes"
            rows="3"
            placeholder="Any special instructions"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>

        <!-- Order feedback -->
        <div v-if="orderError" class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {{ orderError }}
        </div>
        <div v-if="orderSuccessMsg" class="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {{ orderSuccessMsg }}
          <NuxtLink v-if="placedRequestNumber" to="/admin/orders-new" class="ml-2 font-semibold underline">View orders</NuxtLink>
        </div>

        <button
          v-if="!placedRequestNumber"
          type="submit"
          :disabled="orderLoading"
          class="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg v-if="orderLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ orderLoading ? 'Placing order…' : 'Place order' }}
        </button>
      </form>
    </div>

    <!-- Create Customer Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeCreateModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" aria-hidden="true"></div>

        <!-- Dialog -->
        <div
          class="relative w-full max-w-md rounded-xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-customer-title"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="create-customer-title" class="text-base font-semibold text-gray-900">Create customer</h2>
            <button
              type="button"
              @click="closeCreateModal"
              class="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <form @submit.prevent="submitCreateCustomer" class="px-6 py-5 space-y-4">
            <!-- Full name -->
            <div>
              <label for="c-name" class="block text-sm font-medium text-gray-700 mb-1">Full name <span class="text-red-500">*</span></label>
              <input
                id="c-name"
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Jane Doe"
                class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <!-- Phone -->
            <div>
              <label for="c-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone number <span class="text-red-500">*</span></label>
              <input
                id="c-phone"
                v-model="form.phone"
                type="tel"
                required
                placeholder="+233..."
                class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p class="mt-1 text-xs text-gray-500">E.164 format recommended, e.g. +233201234567</p>
            </div>

            <!-- Feedback -->
            <div v-if="createError" class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              {{ createError }}
            </div>
            <div v-if="createSuccessMsg" class="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              {{ createSuccessMsg }}
            </div>

            <!-- Footer actions -->
            <div class="flex justify-end gap-3 pt-1">
              <button
                type="button"
                @click="closeCreateModal"
                class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="createLoading || customerCreated"
                class="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg v-if="createLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ createLoading ? 'Creating…' : 'Create customer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { createAdminService } from '~/services/admin/adminService'
import { ApiError } from '~/composables/useApi'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

const api = useApi()
const adminService = createAdminService(api)

// ── Customer search state ────────────────────────────────────────────────────

interface CustomerResult { id: string; name: string | null; phone: string; is_active: boolean; phone_verified: boolean }

const searchContainer = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const searchResults = ref<CustomerResult[]>([])
const showSearchResults = ref(false)
const searchLoading = ref(false)
const selectedViaSearch = ref(false)

let searchDebounce: ReturnType<typeof setTimeout> | null = null

const handleSearchOutside = (e: MouseEvent) => {
  if (searchContainer.value && !searchContainer.value.contains(e.target as Node)) {
    showSearchResults.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleSearchOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleSearchOutside))

const onSearchInput = () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }
  searchLoading.value = true
  searchDebounce = setTimeout(async () => {
    try {
      const res = await adminService.searchCustomers(searchQuery.value)
      searchResults.value = (res.data ?? []) as CustomerResult[]
      showSearchResults.value = true
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 300)
}

const selectExistingCustomer = (c: CustomerResult) => {
  pendingCustomer.value = { id: c.id as unknown as number, name: c.name ?? c.phone, phone: c.phone }
  selectedViaSearch.value = true
  showSearchResults.value = false
  searchQuery.value = c.name ? `${c.name} — ${c.phone}` : c.phone
  createError.value = null
  createSuccessMsg.value = null
}

const clearSelectedCustomer = () => {
  pendingCustomer.value = null
  selectedViaSearch.value = false
  searchQuery.value = ''
  searchResults.value = []
}

// ── Create customer modal state ──────────────────────────────────────────────

const showCreateModal = ref(false)
const form = reactive({ name: '', phone: '' })
const createLoading = ref(false)
const createError = ref<string | null>(null)
const createSuccessMsg = ref<string | null>(null)
const customerCreated = ref(false)

const pendingCustomer = ref<{ id: number; name: string; phone: string } | null>(null)

const openCreateModal = () => {
  form.name = ''
  form.phone = ''
  createError.value = null
  createSuccessMsg.value = null
  customerCreated.value = false
  showCreateModal.value = true
}

const closeCreateModal = () => {
  if (createLoading.value) return
  showCreateModal.value = false
}

const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeCreateModal()
}
onMounted(() => document.addEventListener('keydown', handleEsc))
onUnmounted(() => document.removeEventListener('keydown', handleEsc))

// ── Section 2 state ──────────────────────────────────────────────────────────

interface OrderItem { name: string; quantity: number; unit: string }
const orderItems = ref<OrderItem[]>([{ name: '', quantity: 1, unit: '' }])
const orderNotes = ref('')
const orderLoading = ref(false)
const orderError = ref<string | null>(null)
const orderSuccessMsg = ref<string | null>(null)
const placedRequestNumber = ref<string | null>(null)

// ── Location search state ────────────────────────────────────────────────────

interface LocationResult { display_name: string; lat: number; lng: number }

const locationContainer = ref<HTMLElement | null>(null)
const locationQuery = ref('')
const locationSuggestions = ref<LocationResult[]>([])
const showSuggestions = ref(false)
const orderLat = ref<number | null>(null)
const orderLng = ref<number | null>(null)
const gpsLoading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const handleDocumentMousedown = (e: MouseEvent) => {
  if (locationContainer.value && !locationContainer.value.contains(e.target as Node)) {
    showSuggestions.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleDocumentMousedown))
onUnmounted(() => document.removeEventListener('mousedown', handleDocumentMousedown))

const onLocationInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  orderLat.value = null
  orderLng.value = null
  if (locationQuery.value.length < 3) {
    locationSuggestions.value = []
    showSuggestions.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      const res = await api.get('/api/auth/customer/autocomplete-location', {
        params: { q: locationQuery.value, limit: 5 },
      })
      locationSuggestions.value = ((res as any).data ?? []) as LocationResult[]
      showSuggestions.value = locationSuggestions.value.length > 0
    } catch {
      locationSuggestions.value = []
    }
  }, 300)
}

const selectSuggestion = (s: LocationResult) => {
  locationQuery.value = s.display_name
  orderLat.value = s.lat
  orderLng.value = s.lng
  locationSuggestions.value = []
  showSuggestions.value = false
}

const clearLocation = () => {
  locationQuery.value = ''
  orderLat.value = null
  orderLng.value = null
  locationSuggestions.value = []
}

const useMyLocation = () => {
  if (!navigator.geolocation) return
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const res = await api.get('/api/auth/customer/reverse-geocode', {
          params: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        })
        const d = (res as any).data
        locationQuery.value = d?.address ?? `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
        orderLat.value = d?.lat ?? pos.coords.latitude
        orderLng.value = d?.lng ?? pos.coords.longitude
      } catch {
        locationQuery.value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
        orderLat.value = pos.coords.latitude
        orderLng.value = pos.coords.longitude
      } finally {
        gpsLoading.value = false
      }
    },
    () => { gpsLoading.value = false },
    { timeout: 10000 }
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const addItem = () => orderItems.value.push({ name: '', quantity: 1, unit: '' })
const removeItem = (idx: number) => orderItems.value.splice(idx, 1)

// ── Submit: create customer ──────────────────────────────────────────────────

const submitCreateCustomer = async () => {
  createError.value = null
  createLoading.value = true
  try {
    const res = await adminService.createCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
    })

    if (res.success) {
      const customer = res.data
      pendingCustomer.value = { id: customer.id, name: customer.name, phone: customer.phone }
      selectedViaSearch.value = false
      createSuccessMsg.value = `Customer created. An activation link has been sent to ${customer.phone}.`
      customerCreated.value = true
      setTimeout(() => { showCreateModal.value = false }, 1200)
    } else {
      createError.value = res.message ?? 'Failed to create customer.'
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const body = err.body as { customer_id?: number; data?: { id?: number } } | undefined
      const conflictId = body?.customer_id ?? body?.data?.id ?? null
      const idStr = conflictId ? ` (ID: ${conflictId})` : ''
      createError.value = `A customer with this phone already exists${idStr}. You can still place an order for them.`

      if (conflictId) {
        pendingCustomer.value = { id: conflictId, name: form.name.trim(), phone: form.phone.trim() }
        customerCreated.value = true
        setTimeout(() => { showCreateModal.value = false }, 1200)
      }
    } else {
      createError.value = err instanceof Error ? err.message : 'An unexpected error occurred.'
    }
  } finally {
    createLoading.value = false
  }
}

// ── Submit: place order ──────────────────────────────────────────────────────

const submitPlaceOrder = async () => {
  if (!pendingCustomer.value) return
  orderError.value = null
  orderLoading.value = true
  try {
    const res = await adminService.placeOrderOnBehalf({
      customer_id: pendingCustomer.value.id,
      items: orderItems.value.map(i => ({
        name: i.name.trim(),
        quantity: i.quantity,
        unit: i.unit.trim() || undefined,
      })),
      address: locationQuery.value.trim() || undefined,
      latitude:  orderLat.value  ?? undefined,
      longitude: orderLng.value  ?? undefined,
      notes: orderNotes.value.trim() || undefined,
    })

    if (res.success) {
      const reqNum = res.data?.request_number ?? ''
      placedRequestNumber.value = reqNum
      orderSuccessMsg.value = `Order ${reqNum} placed. The customer will receive a confirmation SMS.`
    } else {
      orderError.value = res.message ?? 'Failed to place order.'
    }
  } catch (err) {
    orderError.value = err instanceof Error ? err.message : 'An unexpected error occurred.'
  } finally {
    orderLoading.value = false
  }
}
</script>
