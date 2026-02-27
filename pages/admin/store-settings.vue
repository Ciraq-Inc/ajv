<template>
    <div class="container mx-auto p-4">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="mb-4 sm:mb-0">
                    <h1 class="text-2xl font-bold text-gray-800">Store Settings</h1>
                    <p class="text-gray-600 mt-1">Manage storefront display settings for all pharmacies</p>
                </div>
                <button @click="fetchCompanies" :disabled="loading"
                    class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5 mr-1.5', loading ? 'animate-spin' : '']"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        <!-- Search -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input type="text" v-model="searchQuery" placeholder="Search pharmacies by name or domain..."
                    class="pl-10 pr-4 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Companies Table -->
        <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pharmacy</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Domain</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hide Prices</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="filteredCompanies.length === 0">
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500">No pharmacies found</td>
                        </tr>
                        <tr v-for="company in filteredCompanies" :key="company.id"
                            class="hover:bg-gray-50 transition-colors">
                            <!-- Name + location -->
                            <td class="px-6 py-4">
                                <div class="text-sm font-medium text-gray-900">{{ company.name }}</div>
                                <div class="text-xs text-gray-500">{{ company.address1 || company.location || '—' }}
                                </div>
                            </td>
                            <!-- Domain -->
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="text-sm text-indigo-600 font-mono">{{ company.domain_name || '—' }}</span>
                            </td>
                            <!-- Hide prices badge -->
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                    company.hide_prices
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-green-100 text-green-800'
                                ]">
                                    {{ company.hide_prices ? 'Hidden' : 'Visible' }}
                                </span>
                            </td>
                            <!-- Toggle action -->
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-3">
                                    <!-- Toggle switch -->
                                    <button type="button" role="switch" :aria-checked="company.hide_prices"
                                        @click="toggleHidePrices(company)" :disabled="company._saving" :class="[
                                            'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50',
                                            company.hide_prices ? 'bg-amber-500 cursor-pointer' : 'bg-gray-200 cursor-pointer'
                                        ]">
                                        <span :class="[
                                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                            company.hide_prices ? 'translate-x-5' : 'translate-x-0'
                                        ]" />
                                    </button>
                                    <span class="text-xs text-gray-500">
                                        <svg v-if="company._saving" class="animate-spin h-4 w-4 text-indigo-500 inline"
                                            fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <svg v-else-if="company._saved" class="h-4 w-4 text-green-500 inline"
                                            fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer count -->
            <div v-if="filteredCompanies.length > 0"
                class="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                Showing {{ filteredCompanies.length }} of {{ companies.length }} pharmacies
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

definePageMeta({
    layout: 'admin-layout',
    middleware: ['admin-auth']
});

const api = useApi();

const companies = ref([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');

const filteredCompanies = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return companies.value;
    return companies.value.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.domain_name && c.domain_name.toLowerCase().includes(q))
    );
});

const fetchCompanies = async () => {
    loading.value = true;
    error.value = '';
    try {
        const response = await api.get('/api/admin/companies');
        // Normalise hide_prices to boolean
        companies.value = (response.data || []).map(c => ({
            ...c,
            hide_prices: c.hide_prices === 1 || c.hide_prices === true,
            _saving: false,
            _saved: false
        }));
    } catch (err) {
        console.error('Error fetching companies:', err);
        error.value = err.message || 'Failed to load companies';
    } finally {
        loading.value = false;
    }
};

const toggleHidePrices = async (company) => {
    if (company._saving) return;

    const newValue = !company.hide_prices;
    company.hide_prices = newValue; // optimistic update
    company._saving = true;
    company._saved = false;

    try {
        await api.put(`/api/admin/companies/${company.id}/store-settings`, {
            hide_prices: newValue
        });
        company._saved = true;
        setTimeout(() => { company._saved = false; }, 2000);
    } catch (err) {
        console.error('Error saving store settings:', err);
        company.hide_prices = !newValue; // revert on error
        alert(`Failed to save: ${err.message}`);
    } finally {
        company._saving = false;
    }
};

onMounted(fetchCompanies);
</script>
