<template>
  <div class="clearance-deals">
    <div class="mb-5">
      <h2 class="text-lg font-black text-zinc-900 tracking-tight">Clearance Deals</h2>
      <p class="text-sm text-zinc-500 mt-0.5">Near-expiry stock marked down by pharmacies across the platform. Add what you need straight to a new request.</p>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <MagnifyingGlassIcon class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        v-model="searchQuery"
        type="text"
        autocomplete="off"
        placeholder="Search clearance deals…"
        class="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#4F217A]/40 focus:ring-2 focus:ring-[#4F217A]/10 transition-colors"
      />
      <button
        v-if="searchQuery"
        type="button"
        @click="searchQuery = ''"
        aria-label="Clear search"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading && !products.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" aria-busy="true">
      <div v-for="n in 8" :key="`sk-${n}`" class="bg-white rounded-3xl overflow-hidden shadow-md">
        <div class="bg-zinc-100 h-36 sm:h-44 w-full animate-pulse"></div>
        <div class="p-3 space-y-2.5">
          <div class="bg-zinc-100 rounded-lg h-4 w-3/4 animate-pulse"></div>
          <div class="bg-zinc-100 rounded-lg h-3 w-1/2 animate-pulse"></div>
          <div class="mt-3 bg-zinc-100 rounded-full h-9 w-full animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError && !products.length" class="flex flex-col items-center gap-3 border border-amber-200 bg-amber-50 rounded-2xl px-6 py-12 text-center">
      <p class="text-sm font-bold text-amber-800">Couldn't load clearance deals</p>
      <button type="button" @click="loadProducts(1)" class="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!products.length" class="flex flex-col items-center gap-3 border border-[#ede5ff] bg-[#faf6ff] rounded-2xl px-6 py-12 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#ede5ff] text-[#4F217A]">
        <TagIcon class="w-6 h-6" />
      </div>
      <template v-if="searchQuery">
        <p class="text-sm font-bold text-zinc-900">No clearance deals match "{{ searchQuery }}"</p>
        <p class="text-xs text-[#7a5fa0]">Try a different search term.</p>
      </template>
      <template v-else>
        <p class="text-sm font-bold text-zinc-900">No clearance deals right now</p>
        <p class="text-xs text-[#7a5fa0]">Check back soon &mdash; pharmacies add new markdowns regularly.</p>
      </template>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-24">
      <div
        v-for="product in products"
        :key="cardKey(product)"
        class="group bg-white rounded-3xl shadow-md overflow-hidden flex flex-col border-2 transition-colors"
        :class="isSelected(product) ? 'border-[#4F217A]' : 'border-transparent'"
      >
        <div class="relative overflow-hidden bg-[#faf6ff] flex-shrink-0 h-36 sm:h-44 p-3 flex items-center justify-center">
          <img
            v-if="product.image_url && !imageFailed[cardKey(product)]"
            :src="product.image_url"
            :alt="product.brand_name || ''"
            loading="lazy"
            @error="imageFailed[cardKey(product)] = true"
            class="w-full h-full object-contain drop-shadow-sm"
          />
          <TagIcon v-else class="w-10 h-10 text-[#c9a8f0]" />

          <span class="absolute top-2 left-2 inline-flex items-center rounded-full bg-[#4F217A] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
            -{{ product.discount_percent }}%
          </span>
          <span
            v-if="product.available_quantity > 0 && product.available_quantity <= 5"
            class="absolute top-2 right-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-sm"
          >
            {{ product.available_quantity }} left
          </span>
        </div>

        <div class="p-3 flex flex-col flex-1 gap-1.5">
          <h3 class="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {{ product.brand_name || product.product_description || 'Clearance item' }}
          </h3>
          <p v-if="product.company_name" class="text-[11px] font-medium text-zinc-400 truncate">{{ product.company_name }}</p>
          <p v-if="product.expiry_date" class="text-[11px] font-semibold" :class="expiryClass(product.expiry_date)">
            Expires {{ formatExpiry(product.expiry_date) }}
          </p>

          <div class="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
            <span class="text-xs font-medium text-zinc-400 line-through">GHS {{ product.original_price.toFixed(2) }}</span>
            <span class="text-base font-extrabold text-[#4F217A]">GHS {{ product.clearance_price.toFixed(2) }}</span>
          </div>

          <div class="flex-1"></div>

          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1 flex-shrink-0">
              <button
                type="button"
                @click="decreaseQty(product)"
                :disabled="qtyFor(product) <= 1"
                aria-label="Decrease quantity"
                class="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-sm disabled:opacity-30 transition-colors"
              >
                <MinusIcon class="w-3.5 h-3.5" />
              </button>
              <span class="w-6 text-center text-sm font-semibold text-gray-700">{{ qtyFor(product) }}</span>
              <button
                type="button"
                @click="increaseQty(product)"
                :disabled="qtyFor(product) >= product.available_quantity"
                aria-label="Increase quantity"
                class="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-sm disabled:opacity-30 transition-colors"
              >
                <PlusIcon class="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              @click="toggleSelected(product)"
              class="flex-1 min-w-0 h-9 flex items-center justify-center gap-1.5 px-2 text-sm font-semibold rounded-full transition-all duration-200"
              :class="isSelected(product) ? 'bg-[#4F217A] text-white shadow-sm' : 'bg-[#ede5ff] text-[#4F217A] hover:bg-[#e0d0fb]'"
            >
              <CheckIcon v-if="isSelected(product)" class="w-4 h-4 shrink-0" />
              <PlusIcon v-else class="w-4 h-4 shrink-0" />
              <span class="hidden sm:inline truncate">{{ isSelected(product) ? 'Added' : 'Add' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="!isLoading && products.length && hasMore" class="flex justify-center pb-24">
      <button
        type="button"
        @click="loadMore"
        :disabled="isLoadingMore"
        class="px-5 py-2.5 rounded-xl border border-[#e5d5f5] bg-white text-sm font-bold text-[#4F217A] hover:bg-[#faf4ff] transition-colors disabled:opacity-50"
      >
        {{ isLoadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>

    <!-- Sticky add-to-request bar -->
    <Transition name="slide-up-bar">
      <div v-if="selectedCount > 0" class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
        <button
          type="button"
          @click="addSelectedToRequest"
          class="w-full flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-[#7b3faa] via-[#5c2490] to-[#381659] px-5 py-4 text-white shadow-xl"
        >
          <span class="text-sm font-bold">Add {{ selectedCount }} item{{ selectedCount === 1 ? '' : 's' }} to request</span>
          <ChevronRightIcon class="w-5 h-5" />
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
  if (days <= 30) return 'text-red-600'
  if (days <= 90) return 'text-amber-600'
  return 'text-zinc-400'
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
  transform: translate(-50%, 12px);
}
</style>
