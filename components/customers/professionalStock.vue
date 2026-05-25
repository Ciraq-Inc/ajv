<template>
  <div class="w-full pb-12">
    <!-- Header -->
    <header class="flex items-center gap-3 border-b border-zinc-200 bg-white px-5 py-4 mb-4">
      <div class="w-8 h-8 rounded-lg bg-[#4F217A]/10 text-[#4F217A] flex items-center justify-center flex-shrink-0">
        <BeakerIcon class="w-[18px] h-[18px]" />
      </div>
      <div>
        <h1 class="text-lg font-bold text-zinc-900 tracking-tight">Browse Pharmacy Stock</h1>
        <p class="text-xs text-zinc-500 font-medium mt-0.5">Search available products near you — no request needed</p>
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
      <div v-else-if="searched && results.length === 0" class="text-center py-12">
        <p class="text-sm font-semibold text-zinc-500">No matching products found nearby.</p>
        <p class="text-xs text-zinc-400 mt-1">Try a different name or check back later.</p>
      </div>

      <!-- Results -->
      <div v-else-if="results.length > 0" class="space-y-3">
        <div
          v-for="(item, i) in results"
          :key="i"
          class="bg-white rounded-xl border border-zinc-200 shadow-sm px-5 py-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-zinc-900 truncate">{{ item.product_name ?? item.name }}</p>
              <p class="text-xs text-zinc-500 mt-0.5 truncate">{{ item.company_name ?? item.pharmacy_name }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-black text-zinc-900">
                GHS {{ Number(item.selling_price ?? item.price ?? 0).toFixed(2) }}
              </p>
              <p v-if="item.available_quantity != null" class="text-[10px] font-semibold mt-0.5"
                :class="Number(item.available_quantity) > 0 ? 'text-emerald-600' : 'text-red-500'">
                {{ Number(item.available_quantity) > 0 ? `${item.available_quantity} in stock` : 'Out of stock' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Prompt to search -->
      <div v-else-if="hasLocation && !loading && !searched" class="text-center py-12">
        <BeakerIcon class="w-10 h-10 text-zinc-200 mx-auto mb-3" />
        <p class="text-sm font-semibold text-zinc-400">Type a medication name to search nearby pharmacies.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserStore } from '~/stores/user';
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService';
import { useApi } from '~/composables/useApi';
import {
  BeakerIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline';

const userStore = useUserStore();
const stockService = createOrderRequestsService(useApi());

const query = ref('');
const results = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searched = ref(false);

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

const searchProducts = async (q: string) => {
  if (!q.trim() || !hasLocation.value) {
    results.value = [];
    searched.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await stockService.searchProducts({ q: q.trim(), lat: lat.value, lng: lng.value }) as { data?: unknown[] };
    results.value = (res.data ?? []) as Record<string, unknown>[];
    searched.value = true;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Search failed. Please try again.';
    results.value = [];
  } finally {
    loading.value = false;
  }
};

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!val.trim()) {
    results.value = [];
    searched.value = false;
    return;
  }
  debounceTimer = setTimeout(() => {
    void searchProducts(val);
  }, 300);
});
</script>
