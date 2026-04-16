<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5d4679]">Pharmacies</p>
        <h2 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A] mt-0.5">Linked Pharmacies</h2>
        <p class="text-sm font-medium text-zinc-600 mt-1">Browse the pharmacies connected to your account and jump into any linked storefront.</p>
      </div>
      <button @click="triggerLinking" :disabled="isLinking"
        class="inline-flex items-center gap-2 bg-zinc-900 text-white py-3 px-5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0">
        <span v-if="isLinking" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
        <span v-else class="material-symbols-outlined text-[16px]">link</span>
        {{ isLinking ? 'Linking...' : 'Link Accounts' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-8 shadow-sm">
      <span class="material-symbols-outlined text-2xl text-zinc-400 animate-spin">sync</span>
      <p class="text-sm font-medium text-zinc-500">Loading your pharmacies...</p>
    </div>

    <!-- Companies Grid -->
    <div v-if="!isLoading && companies.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div
        v-for="company in companies" :key="company.company_id"
        class="flex flex-col gap-4 rounded-xl border bg-white shadow-sm p-5 transition-all hover:shadow-md"
        :class="isActiveCompany(company) ? 'border-[#c9a8f0]' : 'border-zinc-200'"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-white">local_pharmacy</span>
          </div>
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
            :class="isActiveCompany(company) ? 'bg-[#e7f7ea] text-[#228847]' : 'bg-zinc-100 text-zinc-600'"
          >
            {{ isActiveCompany(company) ? 'Active' : 'Linked' }}
          </span>
        </div>

        <div class="flex-1">
          <h3 class="font-black text-zinc-900 text-lg tracking-tight leading-tight">{{ company.company_name }}</h3>
          <p v-if="company.location" class="flex items-center gap-1.5 text-sm text-zinc-500 mt-1.5">
            <span class="material-symbols-outlined text-[14px]">location_on</span>
            {{ company.location }}
          </p>
          <p v-if="company.phone" class="flex items-center gap-1.5 text-sm text-zinc-500 mt-1">
            <span class="material-symbols-outlined text-[14px]">phone</span>
            {{ company.phone }}
          </p>
        </div>

        <button @click="goToCompanyStore(company)"
          class="w-full inline-flex items-center justify-center gap-2 border border-zinc-200 bg-white text-zinc-700 py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-colors">
          <span class="material-symbols-outlined text-[16px]">open_in_new</span>
          Visit Store
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && companies.length === 0" class="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-12 shadow-sm text-center mb-6">
      <div class="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center">
        <span class="material-symbols-outlined text-2xl text-zinc-400">local_pharmacy</span>
      </div>
      <div>
        <p class="font-black text-zinc-800 text-lg">No linked pharmacies</p>
        <p class="text-sm font-medium text-zinc-500 mt-1">You do not have any pharmacies linked to your account yet.</p>
      </div>
    </div>

    <!-- Info box -->
    <div class="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
      <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4ecfb] text-[#5e3a86] flex-shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-[18px]">info</span>
      </div>
      <div>
        <p class="font-semibold text-zinc-800 text-sm">About Linked Pharmacies</p>
        <p class="text-sm text-zinc-500 mt-0.5">Open any linked pharmacy to browse its products and place direct store orders from the same customer account.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();

// State
const isLoading = ref(false);
const isLinking = ref(false);
const linkingMessage = ref('');
const companies = computed(() => userStore.companies || []);

// Check if company is active
const isActiveCompany = (company) => {
  return userStore.currentCompany?.company_id === company.company_id;
};

// Resolve store slug using the persisted pharmacy domain when available
const generateCompanySlug = (companyName) => {
  return String(companyName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
};

const getCompanyStoreSlug = (company) => {
  const explicitSlug = String(company?.domain_name || company?.company_slug || company?.slug || '').trim().toLowerCase();
  if (explicitSlug) return explicitSlug;
  return generateCompanySlug(company?.company_name || '');
};

// Navigate to company store
const goToCompanyStore = (company) => {
  const slug = getCompanyStoreSlug(company);
  if (!slug) return;
  navigateTo(`/${slug}`);
};

// Trigger customer linking
const triggerLinking = async () => {
  try {
    isLinking.value = true;
    linkingMessage.value = '';
    const result = await userStore.triggerCustomerLinking();
    linkingMessage.value = result.message;

    // Refresh companies list
    await loadCompanies();
  } catch (error) {
    console.error('Error triggering linking:', error);
    linkingMessage.value = error.message || 'Failed to link accounts';
  } finally {
    isLinking.value = false;
    // Clear message after 5 seconds
    setTimeout(() => {
      linkingMessage.value = '';
    }, 5000);
  }
};

// Load companies
const loadCompanies = async () => {
  try {
    isLoading.value = true;
    await userStore.getMyCompanies();
  } catch (error) {
    console.error('Error loading companies:', error);
  } finally {
    isLoading.value = false;
  }
};

// Initialize
onMounted(() => {
  loadCompanies();
});
</script>

