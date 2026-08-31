<template>
  <div class="w-full pb-12">
    <!-- Header -->
    <header class="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-4 mb-4">
      <div class="w-8 h-8 rounded-lg bg-[#4F217A]/10 text-[#4F217A] flex items-center justify-center flex-shrink-0">
        <BeakerIcon class="w-[18px] h-[18px]" />
      </div>
      <div>
        <h1 class="text-lg font-bold text-zinc-900 tracking-tight">Browse Pharmacy Stock</h1>
        <p class="text-xs text-zinc-500 font-medium mt-0.5">Search a product and add it straight to a request</p>
      </div>
    </header>

    <div class="max-w-2xl px-4">
      <!-- Location nudge -->
      <div v-if="!hasLocation" class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <MapPinIcon class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-amber-800">Location required</p>
          <p class="text-xs text-amber-700 mt-0.5">Set your home address in your Profile to see nearby pharmacy stock.</p>
        </div>
      </div>

      <!-- Search input -->
      <div class="relative mb-5">
        <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          v-model="query"
          type="text"
          placeholder="Search for a medication or product…"
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40"
          :disabled="!hasLocation"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <ArrowPathIcon class="w-6 h-6 text-zinc-400 animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-semibold">
        {{ error }}
      </div>

      <!-- Empty state (after a search with no results) -->
      <div v-else-if="searched && candidates.length === 0" class="text-center py-12">
        <p class="text-sm font-semibold text-zinc-500">No matching products found nearby.</p>
        <p class="text-xs text-zinc-400 mt-1">Try a different name or check back later.</p>
      </div>

      <!-- Results -->
      <div v-else-if="candidates.length > 0" class="space-y-3">
        <div
          v-for="candidate in candidates"
          :key="`${candidate.pharmacy_id}-${candidate.product_name}`"
          class="bg-white rounded-xl border border-zinc-200 shadow-sm px-5 py-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-zinc-900 truncate">{{ candidate.product_name }}</p>
              <p class="text-xs text-zinc-500 mt-0.5 truncate">
                {{ formatLastSync(candidate) }}
                <span v-if="candidate.distance_km != null"> · {{ Number(candidate.distance_km).toFixed(1) }} km</span>
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-black text-zinc-900">GHS {{ Number(candidate.unit_price ?? 0).toFixed(2) }}</p>
              <p class="text-[10px] font-semibold mt-0.5"
                :class="Number(candidate.available_quantity) > 0 ? 'text-emerald-600' : 'text-red-500'">
                {{ Number(candidate.available_quantity) > 0 ? `${candidate.available_quantity} in stock` : 'Out of stock' }}
              </p>
            </div>
          </div>
          <div class="mt-3 flex justify-end">
            <button
              type="button"
              :disabled="Number(candidate.available_quantity) <= 0 || isSelected(candidate)"
              @click="addToRequest(candidate)"
              class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="isSelected(candidate)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-[#4F217A] border-[#4F217A] text-white hover:bg-[#3d1a61]'"
            >
              {{ isSelected(candidate) ? 'Added' : 'Add to request' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Prompt to search -->
      <div v-else-if="hasLocation && !loading && !searched" class="text-center py-12">
        <BeakerIcon class="w-10 h-10 text-zinc-200 mx-auto mb-3" />
        <p class="text-sm font-semibold text-zinc-400">Type a medication name to search nearby pharmacies.</p>
      </div>
    </div>

    <!-- Selected items bar -->
    <div v-if="selectedItems.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-5 py-3 flex items-center justify-between gap-4 z-20">
      <p class="text-sm font-semibold text-zinc-700">
        {{ selectedItems.length }} item{{ selectedItems.length === 1 ? '' : 's' }} selected
      </p>
      <button
        type="button"
        @click="continueToRequest"
        class="text-sm font-bold px-4 py-2 rounded-xl bg-[#4F217A] text-white hover:bg-[#3d1a61] transition-colors"
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
