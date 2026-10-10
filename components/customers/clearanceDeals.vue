<template>
  <div class="clearance-deals font-body">
    <div class="mb-5">
      <h2 class="font-display text-2xl font-bold text-ink-900">Clearance deals</h2>
      <p class="mt-1 text-base text-ink-600">Near-expiry stock marked down by pharmacies across the platform. Add what you need straight to a new request.</p>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <MagnifyingGlassIcon class="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-ink-500" aria-hidden="true" />
      <input v-model="searchQuery" type="search" autocomplete="off" aria-label="Search clearance deals" placeholder="Search clearance deals…"
        class="min-h-[44px] w-full rounded-full border-0 bg-ink-50 py-3 pl-12 pr-12 text-base text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-700" />
      <button v-if="searchQuery" type="button" @click="searchQuery = ''" aria-label="Clear search"
        class="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-ink-600 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
        <XMarkIcon class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !products.length" role="status" aria-busy="true" class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      <span class="sr-only">Loading clearance deals…</span>
      <div v-for="n in 8" :key="`sk-${n}`" class="overflow-hidden rounded-3xl bg-white shadow-lift" aria-hidden="true">
        <div class="h-36 w-full animate-pulse bg-ink-100 sm:h-44"></div>
        <div class="space-y-2.5 p-3">
          <div class="h-4 w-3/4 animate-pulse rounded-lg bg-ink-100"></div>
          <div class="h-3 w-1/2 animate-pulse rounded-lg bg-ink-100"></div>
          <div class="mt-3 h-11 w-full animate-pulse rounded-full bg-ink-100"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="hasError && !products.length" role="alert" class="flex flex-col items-center gap-3 rounded-3xl bg-amber-50 px-6 py-12 text-center">
      <p class="text-base font-semibold text-amber-800">We couldn't load clearance deals</p>
      <button type="button" @click="loadProducts(1)"
        class="min-h-[44px] rounded-full bg-white px-6 text-base font-semibold text-amber-800 ring-1 ring-inset ring-amber-800 focus-visible:outline-none focus-visible:ring-2">
        Retry
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="!products.length" class="flex flex-col items-center gap-3 rounded-3xl bg-brand-50 px-6 py-12 text-center">
      <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-700">
        <TagIcon class="h-7 w-7" aria-hidden="true" />
      </span>
      <template v-if="searchQuery">
        <p class="font-display text-lg font-bold text-ink-900">No clearance deals match "{{ searchQuery }}"</p>
        <p class="text-base text-ink-600">Try a different search term.</p>
      </template>
      <template v-else>
        <p class="font-display text-lg font-bold text-ink-900">No clearance deals right now</p>
        <p class="text-base text-ink-600">Check back soon. Pharmacies add new markdowns regularly.</p>
      </template>
    </div>

    <!-- Grid -->
    <ul v-else aria-label="Clearance deals" class="grid grid-cols-2 gap-3 pb-24 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      <li v-for="product in products" :key="cardKey(product)"
        class="flex flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-2 transition-colors"
        :class="isSelected(product) ? 'ring-brand-700' : 'ring-transparent'">
        <div class="relative flex h-36 flex-shrink-0 items-center justify-center overflow-hidden bg-brand-50 p-3 sm:h-44">
          <img v-if="product.image_url && !imageFailed[cardKey(product)]" :src="product.image_url" :alt="product.brand_name || ''"
            loading="lazy" @error="imageFailed[cardKey(product)] = true" class="h-full w-full object-contain" />
          <TagIcon v-else class="h-10 w-10 text-brand-200" aria-hidden="true" />

          <span class="absolute left-2 top-2 inline-flex items-center rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-semibold text-white">
            {{ product.discount_percent }}% off
          </span>
          <span v-if="product.available_quantity > 0 && product.available_quantity <= 5"
            class="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            {{ product.available_quantity }} left
          </span>
        </div>

        <div class="flex flex-1 flex-col gap-1.5 p-3">
          <h3 class="line-clamp-2 text-base font-semibold leading-snug text-ink-900">
            {{ product.brand_name || product.product_description || 'Clearance item' }}
          </h3>
          <p v-if="product.expiry_date" class="text-sm font-semibold" :class="expiryClass(product.expiry_date)">
            Expires {{ formatExpiry(product.expiry_date) }}
          </p>

          <p class="mt-0.5 flex flex-wrap items-baseline gap-1.5">
            <span class="text-sm text-ink-600 line-through"><span class="sr-only">Was </span>GHS {{ product.original_price.toFixed(2) }}</span>
            <span class="text-lg font-bold tabular-nums text-brand-700"><span class="sr-only">Now </span>GHS {{ product.clearance_price.toFixed(2) }}</span>
          </p>

          <div class="flex-1"></div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between rounded-full bg-ink-50 p-0.5">
              <button type="button" @click="decreaseQty(product)" :disabled="qtyFor(product) <= 1"
                :aria-label="`Decrease quantity of ${product.brand_name || 'item'}`"
                class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-40">
                <MinusIcon class="h-4 w-4" aria-hidden="true" />
              </button>
              <span class="w-8 text-center text-base font-semibold tabular-nums text-ink-900" aria-live="polite">{{ qtyFor(product) }}</span>
              <button type="button" @click="increaseQty(product)" :disabled="qtyFor(product) >= product.available_quantity"
                :aria-label="`Increase quantity of ${product.brand_name || 'item'}`"
                class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-40">
                <PlusIcon class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <button type="button" @click="toggleSelected(product)"
              :aria-pressed="isSelected(product) ? 'true' : 'false'"
              :aria-label="`Add ${product.brand_name || 'item'} to request`"
              class="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full px-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
              :class="isSelected(product) ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'">
              <CheckIcon v-if="isSelected(product)" class="h-5 w-5 shrink-0" aria-hidden="true" />
              <PlusIcon v-else class="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{{ isSelected(product) ? 'Added' : 'Add' }}</span>
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Load more -->
    <div v-if="!isLoading && products.length && hasMore" class="flex justify-center pb-24">
      <button type="button" @click="loadMore" :disabled="isLoadingMore"
        class="min-h-[44px] rounded-full bg-white px-6 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-60">
        {{ isLoadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>

    <!-- Sticky add-to-request bar -->
    <Transition name="slide-up-bar">
      <div v-if="selectedCount > 0" class="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md lg:bottom-6">
        <button type="button" @click="addSelectedToRequest"
          class="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-full bg-brand-700 px-6 text-white shadow-lift transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
          <span class="text-base font-semibold">Add {{ selectedCount }} item{{ selectedCount === 1 ? '' : 's' }} to request</span>
          <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { TagIcon, PlusIcon, MinusIcon, CheckIcon, ChevronRightIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { createClearanceSaleService, type ClearanceProduct } from '~/services/clearanceSale/clearanceSaleService'

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft'
const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 350

const clearanceSaleService = createClearanceSaleService(useApi())

const products = ref<ClearanceProduct[]>([])
const isLoading = ref<boolean>(true)
const isLoadingMore = ref<boolean>(false)
const hasError = ref<boolean>(false)
const currentPage = ref<number>(1)
const totalPages = ref<number>(1)
const searchQuery = ref<string>('')

const quantities = ref<Record<string, number>>({})
// Keyed by cardKey, storing the full product so selections (and what gets
// submitted) survive the underlying `products` list changing out from under
// them — e.g. a new search replacing page 1, or "load more" appending pages.
const selectedProducts = ref<Record<string, ClearanceProduct>>({})
const imageFailed = reactive<Record<string, boolean>>({})

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const hasMore = computed<boolean>(() => currentPage.value < totalPages.value)
const selectedCount = computed<number>(() => Object.keys(selectedProducts.value).length)

const cardKey = (product: ClearanceProduct): string => `${product.company_id}:${product.id}`
const qtyFor = (product: ClearanceProduct): number => quantities.value[cardKey(product)] ?? 1
const isSelected = (product: ClearanceProduct): boolean => Boolean(selectedProducts.value[cardKey(product)])

const increaseQty = (product: ClearanceProduct): void => {
  const key = cardKey(product)
  const current = qtyFor(product)
  if (current < product.available_quantity) quantities.value[key] = current + 1
}

const decreaseQty = (product: ClearanceProduct): void => {
  const key = cardKey(product)
  const current = qtyFor(product)
  if (current > 1) quantities.value[key] = current - 1
}

const toggleSelected = (product: ClearanceProduct): void => {
  const key = cardKey(product)
  if (selectedProducts.value[key]) {
    const { [key]: _removed, ...rest } = selectedProducts.value
    selectedProducts.value = rest
  } else {
    selectedProducts.value = { ...selectedProducts.value, [key]: product }
  }
}

const expiryClass = (expiryDate: string): string => {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 30) return 'text-red-700'
  if (days <= 90) return 'text-amber-800'
  return 'text-ink-600'
}

const formatExpiry = (expiryDate: string): string => {
  try {
    return new Date(expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return expiryDate
  }
}

const loadProducts = async (page: number): Promise<void> => {
  if (page === 1) {
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }
  hasError.value = false

  try {
    const json = await clearanceSaleService.listClearanceProducts({ page, limit: PAGE_SIZE, search: searchQuery.value.trim() })
    const incoming = json.data?.products ?? []

    for (const product of incoming) {
      const key = cardKey(product)
      if (quantities.value[key] === undefined) quantities.value[key] = 1
    }

    products.value = page === 1 ? incoming : [...products.value, ...incoming]
    currentPage.value = json.data?.pagination?.page ?? page
    totalPages.value = json.data?.pagination?.total_pages ?? 1
  } catch (error) {
    console.error('Failed to load clearance products:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = (): void => {
  if (isLoadingMore.value || !hasMore.value) return
  void loadProducts(currentPage.value + 1)
}

const addSelectedToRequest = (): void => {
  const items = Object.values(selectedProducts.value).map((product) => ({
    product_name: product.brand_name || product.product_description || 'Clearance item',
    requested_unit: String(product.unit || '').toLowerCase(),
    quantity: qtyFor(product),
    prefer_clearance_only: true,
  }))

  if (!items.length) return

  if (process.client) {
    sessionStorage.setItem(HOMEPAGE_REQUEST_DRAFT_KEY, JSON.stringify({ items, source: 'clearance-deals' }))
  }

  void navigateTo({ path: '/customer', query: { tab: 'new' } })
}

watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    void loadProducts(1)
  }, SEARCH_DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})

onMounted(() => {
  void loadProducts(1)
})
</script>

<style scoped>
.slide-up-bar-enter-active,
.slide-up-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-up-bar-enter-from,
.slide-up-bar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
