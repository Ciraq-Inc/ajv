<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center gap-3">
            <div class="bg-indigo-100 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <div>
                <h1 class="text-xl font-bold text-gray-800">Store Settings</h1>
                <p class="text-sm text-gray-500">Customize how your store appears to customers</p>
            </div>
        </div>

        <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">

            <!-- Auth Guard: redirect to login if not authenticated -->
            <div v-if="!companyStore.isLoggedIn" class="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-lg">
                <p class="text-yellow-800 font-medium">You need to log in to access store settings.</p>
                <button @click="goToLogin"
                    class="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Go to Login
                </button>
            </div>

            <template v-else>
                <!-- Loading skeleton -->
                <div v-if="loading" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                    <div class="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div class="h-12 bg-gray-100 rounded"></div>
                </div>

                <!-- Error state -->
                <div v-else-if="fetchError" class="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
                    <p class="text-red-700 font-medium">Failed to load settings: {{ fetchError }}</p>
                    <button @click="loadSettings" class="mt-3 text-sm text-red-600 underline hover:no-underline">Try
                        again</button>
                </div>

                <!-- Settings card -->
                <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <!-- Card header -->
                    <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h2 class="text-base font-semibold text-gray-800">Storefront Display</h2>
                        <p class="text-sm text-gray-500 mt-0.5">Control what customers see on your public store page</p>
                    </div>

                    <!-- Settings list -->
                    <div class="divide-y divide-gray-50">
                        <!-- Hide Prices toggle -->
                        <div class="flex items-center justify-between px-6 py-5">
                            <div class="flex-1 pr-8">
                                <div class="flex items-center gap-2 mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    <p class="text-sm font-medium text-gray-800">Hide Prices</p>
                                </div>
                                <p class="text-xs text-gray-500 leading-relaxed">
                                    When enabled, product prices will be hidden from customers on your store page.
                                    Products will show "Price on request" instead.
                                </p>
                            </div>

                            <!-- Toggle switch -->
                            <button type="button" role="switch" :aria-checked="settings.hide_prices"
                                @click="toggleHidePrices" :class="[
                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                                    settings.hide_prices ? 'bg-indigo-600' : 'bg-gray-200'
                                ]">
                                <span :class="[
                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                    settings.hide_prices ? 'translate-x-5' : 'translate-x-0'
                                ]" />
                            </button>
                        </div>
                    </div>

                    <!-- Card footer: save button -->
                    <div
                        class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4">
                        <!-- Status message -->
                        <transition name="fade">
                            <div v-if="saveSuccess" class="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clip-rule="evenodd" />
                                </svg>
                                Settings saved!
                            </div>
                            <div v-else-if="saveError" class="text-red-600 text-sm font-medium">
                                {{ saveError }}
                            </div>
                            <div v-else class="text-xs text-gray-400">
                                Changes take effect immediately on your store
                            </div>
                        </transition>

                        <button @click="saveSettings" :disabled="saving || !isDirty" :class="[
                            'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                            (saving || !isDirty)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm hover:shadow-md'
                        ]">
                            <svg v-if="saving" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                                fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                            {{ saving ? 'Saving…' : 'Save Settings' }}
                        </button>
                    </div>
                </div>

                <!-- Info notice -->
                <div class="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p class="text-sm text-blue-800 font-medium">More settings coming soon</p>
                        <p class="text-xs text-blue-600 mt-0.5">We're working on more store customization options
                            including custom banners, featured products, and more.</p>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'

definePageMeta({
    layout: 'company',
})

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

// Derive company domain and ID from route/store
const companyDomain = computed(() => {
    const pathMatch = route.path.match(/\/([^/]+)\/services/)
    return pathMatch ? pathMatch[1] : null
})

const companyId = computed(() => companyStore.currentCompany?.id || null)

// State
const loading = ref(false)
const fetchError = ref('')
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

// Settings model
const settings = ref({ hide_prices: false })
const savedSettings = ref({ hide_prices: false })

// Whether settings have been changed from what was last saved
const isDirty = computed(() =>
    settings.value.hide_prices !== savedSettings.value.hide_prices
)

const goToLogin = () => {
    if (companyDomain.value) {
        router.push(`/${companyDomain.value}/services`)
    } else {
        router.push('/')
    }
}

const loadSettings = async () => {
    if (!companyId.value) return

    loading.value = true
    fetchError.value = ''

    try {
        const config = useRuntimeConfig()
        const response = await fetch(
            `${config.public.apiBase}/api/companies/${companyId.value}/store-settings`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${companyStore.companyAuthToken}`,
                },
            }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load settings')
        }

        settings.value = { hide_prices: !!data.data.hide_prices }
        savedSettings.value = { ...settings.value }
    } catch (err) {
        console.error('Error loading store settings:', err)
        fetchError.value = err.message || 'Could not load settings'
    } finally {
        loading.value = false
    }
}

const toggleHidePrices = () => {
    settings.value.hide_prices = !settings.value.hide_prices
}

const saveSettings = async () => {
    if (!companyId.value || saving.value || !isDirty.value) return

    saving.value = true
    saveError.value = ''
    saveSuccess.value = false

    try {
        const config = useRuntimeConfig()
        const response = await fetch(
            `${config.public.apiBase}/api/companies/${companyId.value}/store-settings`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${companyStore.companyAuthToken}`,
                },
                body: JSON.stringify({ hide_prices: settings.value.hide_prices }),
            }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save settings')
        }

        // Persist the new saved state
        savedSettings.value = { ...settings.value }
        saveSuccess.value = true

        // Auto-dismiss success message
        setTimeout(() => {
            saveSuccess.value = false
        }, 3000)
    } catch (err) {
        console.error('Error saving store settings:', err)
        saveError.value = err.message || 'Could not save settings'

        // Auto-dismiss error message
        setTimeout(() => {
            saveError.value = ''
        }, 5000)
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    // Ensure auth is initialized
    if (!companyStore.authInitialized) {
        await companyStore.checkAuthState()
    }

    if (companyStore.isLoggedIn) {
        await loadSettings()
    }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
