<template>
  <div class="font-body">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink-900">Linked pharmacies</h2>
        <p class="mt-1 text-base text-ink-600">Browse the pharmacies connected to your account and jump into any storefront.</p>
      </div>
      <button type="button" @click="triggerLinking" :disabled="isLinking"
        class="inline-flex min-h-[44px] flex-shrink-0 items-center justify-center gap-2 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:opacity-60">
        <ArrowPathIcon v-if="isLinking" class="h-5 w-5 animate-spin" aria-hidden="true" />
        <LinkIcon v-else class="h-5 w-5" aria-hidden="true" />
        {{ isLinking ? 'Linking…' : 'Link accounts' }}
      </button>
    </div>

    <!-- Link feedback -->
    <div v-if="linkingMessage" :role="linkingMessageType === 'error' ? 'alert' : 'status'"
      class="mb-4 flex items-start gap-3 rounded-2xl px-4 py-3"
      :class="linkingMessageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800'">
      <component :is="linkingMessageType === 'error' ? ExclamationCircleIcon : CheckCircleIcon" class="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <p class="text-base font-semibold">{{ linkingMessage }}</p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" role="status" class="flex items-center gap-4 rounded-3xl bg-white px-6 py-8 shadow-lift">
      <ArrowPathIcon class="h-6 w-6 animate-spin text-brand-700" aria-hidden="true" />
      <p class="text-base text-ink-600">Loading your pharmacies…</p>
    </div>

    <!-- Load error -->
    <div v-else-if="loadError" role="alert" class="mb-6 flex flex-col items-center rounded-3xl bg-white px-6 py-10 text-center shadow-lift">
      <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
        <ExclamationCircleIcon class="h-7 w-7" aria-hidden="true" />
      </span>
      <p class="font-display text-lg font-bold text-ink-900">We couldn't load your pharmacies</p>
      <p class="mb-5 mt-1 text-base text-ink-600">Check your connection and try again.</p>
      <button type="button" @click="loadCompanies"
        class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
        <ArrowPathIcon class="h-5 w-5" aria-hidden="true" />
        Try again
      </button>
    </div>

    <!-- Companies -->
    <ul v-else-if="companies.length > 0" aria-label="Linked pharmacies" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="company in companies" :key="company.company_id ?? ''"
        class="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-lift"
        :class="isActiveCompany(company) ? 'ring-2 ring-brand-700' : ''">
        <div class="flex items-start justify-between gap-3">
          <span class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white">
            <BuildingStorefrontIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <span class="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
            :class="isActiveCompany(company) ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-600'">
            {{ isActiveCompany(company) ? 'Active' : 'Linked' }}
          </span>
        </div>

        <div class="flex-1">
          <h3 class="font-display text-lg font-bold leading-tight text-ink-900">{{ company.company_name }}</h3>
          <p v-if="company.location" class="mt-1.5 flex items-center gap-1.5 text-base text-ink-600">
            <MapPinIcon class="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {{ company.location }}
          </p>
          <p v-if="company.phone" class="mt-1 flex items-center gap-1.5 text-base text-ink-600">
            <PhoneIcon class="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {{ company.phone }}
          </p>
        </div>

        <button type="button" @click="goToCompanyStore(company)"
          class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
          <ArrowTopRightOnSquareIcon class="h-5 w-5" aria-hidden="true" />
          Visit store
          <span class="sr-only">— {{ company.company_name }}</span>
        </button>
      </li>
    </ul>

    <!-- Empty -->
    <div v-else class="mb-6 flex flex-col items-center gap-4 rounded-3xl bg-white px-6 py-12 text-center shadow-lift">
      <span class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <BuildingStorefrontIcon class="h-8 w-8" aria-hidden="true" />
      </span>
      <div>
        <p class="font-display text-lg font-bold text-ink-900">No linked pharmacies</p>
        <p class="mt-1 text-base text-ink-600">You do not have any pharmacies linked to your account yet.</p>
      </div>
    </div>

    <!-- Info -->
    <div class="flex items-start gap-4 rounded-2xl bg-ink-50 px-5 py-4">
      <span class="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <InformationCircleIcon class="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p class="text-base font-semibold text-ink-900">About linked pharmacies</p>
        <p class="mt-0.5 text-base text-ink-600">Open any linked pharmacy to browse its products and place direct store orders from the same customer account.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';
import {
  ArrowPathIcon,
  LinkIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

interface LinkedCompany {
  company_id?: number;
  company_name?: string;
  domain_name?: string;
  company_slug?: string;
  slug?: string;
  [key: string]: unknown;
}

// TODO: remove once stores/ are .ts
interface UserStoreShape {
  companies?: LinkedCompany[];
  currentCompany?: { company_id?: number };
  triggerCustomerLinking: () => Promise<{ message?: string }>;
  getMyCompanies: () => Promise<void>;
}

const userStore = useUserStore() as unknown as UserStoreShape;

// State
const isLoading = ref<boolean>(false);
const isLinking = ref<boolean>(false);
const loadError = ref<boolean>(false);
const linkingMessage = ref<string>('');
const linkingMessageType = ref<string>('success');
let linkingMessageTimer: ReturnType<typeof setTimeout> | null = null;
const companies = computed<LinkedCompany[]>(() => userStore.companies ?? []);

// Check if company is active
const isActiveCompany = (company: LinkedCompany): boolean => {
  return userStore.currentCompany?.company_id === company.company_id;
};

// Resolve store slug using the persisted pharmacy domain when available
const generateCompanySlug = (companyName: string): string => {
  return String(companyName ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
};

const getCompanyStoreSlug = (company: LinkedCompany): string => {
  const explicitSlug = String(company.domain_name ?? company.company_slug ?? company.slug ?? '').trim().toLowerCase();
  if (explicitSlug) return explicitSlug;
  return generateCompanySlug(company.company_name ?? '');
};

// Navigate to company store
const goToCompanyStore = (company: LinkedCompany): void => {
  const slug = getCompanyStoreSlug(company);
  if (!slug) return;
  void navigateTo(`/${slug}`);
};

const setLinkingMessage = (message: string, type = 'success'): void => {
  linkingMessage.value = message;
  linkingMessageType.value = type;
  if (linkingMessageTimer) clearTimeout(linkingMessageTimer);
  linkingMessageTimer = setTimeout(() => {
    linkingMessage.value = '';
  }, 5000);
};

// Trigger customer linking
const triggerLinking = async (): Promise<void> => {
  try {
    isLinking.value = true;
    linkingMessage.value = '';
    const result = await userStore.triggerCustomerLinking();
    setLinkingMessage(result?.message ?? 'Linked successfully', 'success');
    await loadCompanies();
  } catch (err) {
    console.error('Error triggering linking:', err);
    setLinkingMessage(err instanceof Error ? err.message : 'Failed to link accounts', 'error');
  } finally {
    isLinking.value = false;
  }
};

// Load companies
const loadCompanies = async (): Promise<void> => {
  try {
    isLoading.value = true;
    loadError.value = false;
    await userStore.getMyCompanies();
  } catch (err) {
    console.error('Error loading companies:', err);
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// Initialize
onMounted(() => {
  void loadCompanies();
});

onUnmounted(() => {
  if (linkingMessageTimer) clearTimeout(linkingMessageTimer);
});
</script>
