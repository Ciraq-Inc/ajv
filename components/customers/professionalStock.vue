<template>
  <div class="w-full pb-24 font-body">
    <header class="mb-4 flex items-center gap-3 px-4 pt-2">
      <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <BeakerIcon class="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <h1 class="font-display text-2xl font-bold text-ink-900">Browse pharmacy stock</h1>
        <p class="mt-0.5 text-base text-ink-600">Search a product and add it straight to a request.</p>
      </div>
    </header>

    <div class="max-w-2xl px-4">
      <!-- Location nudge -->
      <div v-if="!hasLocation" role="status" class="mb-4 flex items-start gap-3 rounded-3xl bg-amber-50 p-4">
        <MapPinIcon class="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-800" aria-hidden="true" />
        <div>
          <p class="text-base font-semibold text-amber-800">Location required</p>
          <p class="mt-0.5 text-sm text-amber-800">Set your home address in your Profile to see nearby pharmacy stock.</p>
        </div>
      </div>

      <!-- Search input -->
      <div class="relative mb-5">
        <MagnifyingGlassIcon class="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-ink-500" aria-hidden="true" />
        <input
          v-model="query"
          type="search"
          autocomplete="off"
          aria-label="Search pharmacy stock"
          placeholder="Search for a medication or product…"
          class="min-h-[44px] w-full rounded-full border-0 bg-ink-50 py-3 pl-12 pr-4 text-base text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-700 disabled:opacity-60"
          :disabled="!hasLocation"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" role="status" class="flex items-center justify-center gap-2 py-12 text-base text-ink-600">
        <ArrowPathIcon class="h-6 w-6 animate-spin text-brand-700" aria-hidden="true" />
        <span>Searching nearby pharmacies…</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" role="alert" class="rounded-3xl bg-red-50 px-5 py-4 text-base font-semibold text-red-700">
        {{ error }}
      </div>

      <!-- Empty state (after a search with no results) -->
      <div v-else-if="searched && candidates.length === 0" class="rounded-3xl bg-brand-50 px-6 py-12 text-center">
        <p class="font-display text-lg font-bold text-ink-900">No matching products found nearby</p>
        <p class="mt-1 text-base text-ink-600">Try a different name or check back later.</p>
      </div>

      <!-- Results -->
      <ul v-else-if="candidates.length > 0" aria-label="Matching products" class="space-y-3">
        <li
          v-for="candidate in candidates"
          :key="`${candidate.pharmacy_id}-${candidate.product_name}`"
          class="rounded-3xl bg-white px-5 py-4 shadow-lift"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-semibold text-ink-900">{{ candidate.product_name }}</p>
              <p class="mt-0.5 truncate text-sm text-ink-600">
                {{ formatLastSync(candidate) }}
                <span v-if="candidate.distance_km != null"> · {{ Number(candidate.distance_km).toFixed(1) }} km</span>
              </p>
            </div>
            <div class="flex-shrink-0 text-right">
              <p class="text-base font-bold tabular-nums text-ink-900">GHS {{ Number(candidate.unit_price ?? 0).toFixed(2) }}</p>
              <p class="mt-0.5 text-sm font-semibold"
                :class="Number(candidate.available_quantity) > 0 ? 'text-brand-700' : 'text-red-700'">
                {{ Number(candidate.available_quantity) > 0 ? `${candidate.available_quantity} in stock` : 'Out of stock' }}
              </p>
            </div>
          </div>
          <div class="mt-3 flex justify-end">
            <button
              type="button"
              :disabled="Number(candidate.available_quantity) <= 0 || isSelected(candidate)"
              :aria-pressed="isSelected(candidate) ? 'true' : 'false'"
              :aria-label="`Add ${candidate.product_name} to request`"
              @click="addToRequest(candidate)"
              class="flex min-h-[44px] items-center gap-1.5 rounded-full px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :class="isSelected(candidate) ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'"
            >
              <CheckIcon v-if="isSelected(candidate)" class="h-5 w-5" aria-hidden="true" />
              <span>{{ isSelected(candidate) ? 'Added' : 'Add to request' }}</span>
            </button>
          </div>
        </li>
      </ul>

      <!-- Prompt to search -->
      <div v-else-if="hasLocation && !loading && !searched" class="py-12 text-center">
        <BeakerIcon class="mx-auto mb-3 h-10 w-10 text-brand-200" aria-hidden="true" />
        <p class="text-base text-ink-600">Type a medication name to search nearby pharmacies.</p>
      </div>
    </div>

    <!-- Selected items bar -->
    <div v-if="selectedItems.length > 0"
      class="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 bg-white px-5 py-3 shadow-lift">
      <p class="text-base font-semibold text-ink-900" role="status">
        {{ selectedItems.length }} item{{ selectedItems.length === 1 ? '' : 's' }} selected
      </p>
      <button
        type="button"
        @click="continueToRequest"
        class="min-h-[44px] rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
      >
        Continue to request
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserStore } from '~/stores/user';
import { createOrderRequestsService, type ProductCandidate } from '~/services/orderRequests/orderRequestsService';
import { useApi } from '~/composables/useApi';
import {
  BeakerIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  MapPinIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline';

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft';

const userStore = useUserStore();
const stockService = createOrderRequestsService(useApi());

const query = ref('');
const candidates = ref<ProductCandidate[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searched = ref(false);

interface SelectedRequestItem {
  product_id: number | null;
  product_name: string;
  requested_unit: string;
  quantity: number;
  source_pharmacy_id: number;
  unit_price: number;
}

// `product_id` is frequently null (fuzzy stock-sync matches aren't always
// resolved to a catalog row) so it can't be used for identity — two
// different unmatched products from the same pharmacy would both have
// product_id === null and look identical. Key on pharmacy + name instead.
const candidateKey = (pharmacyId: number, productName: string): string =>
  `${pharmacyId}::${productName}`;

const selectedItems = ref<SelectedRequestItem[]>([]);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const hasLocation = computed(() => {
  const mc = userStore.masterCustomer as Record<string, unknown> | undefined;
  return !!(mc?.latitude && mc?.longitude);
});

const lat = computed(() => {
  const mc = userStore.masterCustomer as Record<string, unknown> | undefined;
  return mc?.latitude as number | null | undefined;
});

const lng = computed(() => {
  const mc = userStore.masterCustomer as Record<string, unknown> | undefined;
  return mc?.longitude as number | null | undefined;
});

const formatLastSync = (candidate: ProductCandidate): string => {
  const days = candidate.days_since_last_sync;
  if (days != null) {
    if (days <= 0) return 'Synced today';
    if (days === 1) return 'Synced 1 day ago';
    return `Synced ${days} days ago`;
  }
  if (candidate.last_product_sync_at) {
    const date = new Date(candidate.last_product_sync_at);
    if (!Number.isNaN(date.getTime())) {
      return `Synced ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
  }
  return 'Sync date unknown';
};

const isSelected = (candidate: ProductCandidate): boolean =>
  selectedItems.value.some(
    (i) => candidateKey(i.source_pharmacy_id, i.product_name) === candidateKey(candidate.pharmacy_id, candidate.product_name)
  );

const addToRequest = (candidate: ProductCandidate): void => {
  if (isSelected(candidate)) return;
  selectedItems.value.push({
    product_id: candidate.product_id,
    product_name: candidate.product_name,
    requested_unit: String(candidate.unit ?? '').trim().toLowerCase(),
    quantity: 1,
    source_pharmacy_id: candidate.pharmacy_id,
    unit_price: Number(candidate.unit_price ?? 0),
  });
};

const continueToRequest = (): void => {
  if (!selectedItems.value.length || !process.client) return;
  sessionStorage.setItem(HOMEPAGE_REQUEST_DRAFT_KEY, JSON.stringify({ items: selectedItems.value }));
  void navigateTo('/customer?tab=new');
};

const searchProducts = async (q: string) => {
  if (!q.trim() || !hasLocation.value) {
    candidates.value = [];
    searched.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await stockService.searchProducts({ q: q.trim(), lat: lat.value, lng: lng.value });
    candidates.value = res.data?.candidates ?? [];
    searched.value = true;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Search failed. Please try again.';
    candidates.value = [];
  } finally {
    loading.value = false;
  }
};

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!val.trim()) {
    candidates.value = [];
    searched.value = false;
    return;
  }
  debounceTimer = setTimeout(() => {
    void searchProducts(val);
  }, 300);
});
</script>
