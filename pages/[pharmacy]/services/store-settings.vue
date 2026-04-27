<template>
    <div class="min-h-screen bg-slate-100">
        <div class="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div class="flex items-center gap-3">
                <div class="rounded-2xl bg-slate-900 p-3 text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-900">Shopfront Customization</h1>
                    <p class="text-sm text-slate-500">Control branding, colors, pricing visibility, and promotional ads.</p>
                </div>
            </div>
        </div>

        <div class="mx-auto max-w-6xl px-4 py-8">
            <div v-if="!companyStore.isLoggedIn" class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
                <p class="font-medium">You need to log in to manage your shopfront.</p>
                <button @click="goToLogin" class="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Go to Login
                </button>
            </div>

            <template v-else>
                <div v-if="loading" class="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                    <div class="h-80 animate-pulse rounded-3xl bg-white shadow-sm"></div>
                    <div class="h-80 animate-pulse rounded-3xl bg-white shadow-sm"></div>
                </div>

                <div v-else-if="fetchError" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
                    <p class="font-medium">Failed to load shopfront settings: {{ fetchError }}</p>
                    <button @click="initializePage" class="mt-4 text-sm font-medium underline underline-offset-4">Try again</button>
                </div>

                <div v-else class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                    <div class="space-y-6">
                        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div class="preview-shell" :style="previewStyles">
                                <div class="preview-overlay"></div>
                                <div class="preview-content">
                                    <div class="flex items-center gap-4">
                                        <div class="preview-logo-wrap">
                                            <img v-if="settings.logo" :src="settings.logo" :alt="`${companyName} logo`" class="h-full w-full rounded-full object-cover" />
                                            <div v-else class="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-2xl font-semibold text-white">
                                                {{ companyInitials }}
                                            </div>
                                        </div>
                                        <div>
                                            <p class="text-xs uppercase tracking-[0.3em] text-white/70">Live Preview</p>
                                            <h2 class="mt-2 text-2xl font-semibold text-white">{{ companyName }}</h2>
                                            <p class="mt-2 max-w-xl text-sm text-white/80">
                                                {{ previewTagline }}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="mt-8 grid gap-3 md:grid-cols-2">
                                        <div class="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                                            <p class="text-xs uppercase tracking-[0.2em] text-white/60">Theme</p>
                                            <p class="mt-2 text-lg font-medium text-white">{{ selectedThemeLabel }}</p>
                                        </div>
                                        <div class="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                                            <p class="text-xs uppercase tracking-[0.2em] text-white/60">Pricing</p>
                                            <p class="mt-2 text-lg font-medium text-white">
                                                {{ settings.hide_prices ? 'Hidden from customers' : 'Visible on products' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-900">Branding</h3>
                                    <p class="mt-1 text-sm text-slate-500">Upload a logo and hero banner for your public storefront.</p>
                                </div>
                                <span v-if="uploadStatus" class="text-sm font-medium text-slate-500">{{ uploadStatus }}</span>
                            </div>

                            <div class="mt-6 grid gap-5 md:grid-cols-2">
                                <div class="rounded-2xl border border-slate-200 p-4">
                                    <div class="mb-3 flex items-center justify-between">
                                        <p class="font-medium text-slate-800">Store Logo</p>
                                        <span class="text-xs text-slate-400">Square image</span>
                                    </div>
                                    <div class="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-dashed border-slate-300 bg-slate-50">
                                        <img v-if="settings.logo" :src="settings.logo" alt="Shop logo" class="h-full w-full object-cover" />
                                        <span v-else class="text-sm text-slate-400">No logo</span>
                                    </div>
                                    <label class="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                                        <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleAssetUpload($event, 'logo')" />
                                        {{ uploading.logo ? 'Uploading...' : 'Upload logo' }}
                                    </label>
                                </div>

                                <div class="rounded-2xl border border-slate-200 p-4">
                                    <div class="mb-3 flex items-center justify-between">
                                        <p class="font-medium text-slate-800">Store Banner</p>
                                        <span class="text-xs text-slate-400">Wide hero image</span>
                                    </div>
                                    <div class="mb-4 h-28 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                                        <img v-if="settings.shop_banner" :src="settings.shop_banner" alt="Shop banner" class="h-full w-full object-cover" />
                                        <div v-else class="flex h-full items-center justify-center text-sm text-slate-400">No banner</div>
                                    </div>
                                    <label class="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                                        <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleAssetUpload($event, 'banner')" />
                                        {{ uploading.banner ? 'Uploading...' : 'Upload banner' }}
                                    </label>
                                </div>
                            </div>
                        </section>

                        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 class="text-lg font-semibold text-slate-900">Theme</h3>
                                <p class="mt-1 text-sm text-slate-500">Choose a preset or switch to a custom accent color.</p>
                            </div>

                            <div class="mt-6 grid gap-4 md:grid-cols-3">
                                <button
                                    v-for="theme in themePresets"
                                    :key="theme.value"
                                    type="button"
                                    class="theme-option"
                                    :class="{ 'theme-option-active': settings.theme_preset === theme.value }"
                                    @click="settings.theme_preset = theme.value"
                                >
                                    <span class="theme-swatch" :style="{ background: theme.preview }"></span>
                                    <span>
                                        <span class="block text-sm font-semibold text-slate-800">{{ theme.label }}</span>
                                        <span class="mt-1 block text-xs text-slate-500">{{ theme.description }}</span>
                                    </span>
                                </button>
                            </div>

                            <div v-if="settings.theme_preset === 'custom'" class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <label class="block text-sm font-medium text-slate-700">Custom accent color</label>
                                <div class="mt-3 flex flex-wrap items-center gap-3">
                                    <input v-model="settings.theme_color" type="color" class="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                                    <input v-model="settings.theme_color" type="text" maxlength="7" placeholder="#0f766e" class="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900" />
                                </div>
                            </div>
                        </section>

                        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-900">Store Options</h3>
                                    <p class="mt-1 text-sm text-slate-500">Control how products appear to customers.</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    :aria-checked="settings.hide_prices"
                                    @click="settings.hide_prices = !settings.hide_prices"
                                    :class="['relative inline-flex h-7 w-12 items-center rounded-full transition', settings.hide_prices ? 'bg-slate-900' : 'bg-slate-300']"
                                >
                                    <span :class="['inline-block h-5 w-5 rounded-full bg-white transition', settings.hide_prices ? 'translate-x-6' : 'translate-x-1']"></span>
                                </button>
                            </div>
                            <p class="mt-4 text-sm text-slate-600">
                                When enabled, product listings on the public storefront will show “Price on request” instead of the actual price.
                            </p>
                        </section>
                    </div>

                    <div class="space-y-6">
                        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-900">Promotional Ads</h3>
                                    <p class="mt-1 text-sm text-slate-500">Create text or image ads that appear on your storefront.</p>
                                </div>
                                <button @click="startNewAd" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                                    New Ad
                                </button>
                            </div>

                            <div class="mt-5 space-y-3">
                                <div v-if="!ads.length" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                                    No ads yet. Add a text block or image promotion for your storefront.
                                </div>
                                <article v-for="ad in ads" :key="ad.id" class="rounded-2xl border border-slate-200 p-4">
                                    <div class="flex items-start justify-between gap-4">
                                        <div>
                                            <div class="flex items-center gap-2">
                                                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">{{ ad.type }}</span>
                                                <span v-if="!ad.is_active" class="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-rose-700">Inactive</span>
                                            </div>
                                            <h4 class="mt-3 font-semibold text-slate-900">{{ ad.headline }}</h4>
                                            <p v-if="ad.body" class="mt-2 text-sm text-slate-600">{{ ad.body }}</p>
                                            <img v-if="ad.type === 'image' && ad.image_url" :src="ad.image_url" :alt="ad.headline" class="mt-3 h-28 w-full rounded-2xl object-cover" />
                                            <p class="mt-3 text-xs text-slate-400">
                                                {{ formatAdWindow(ad.start_date, ad.end_date) }}
                                            </p>
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <button @click="editAd(ad)" class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-900 hover:text-slate-900">Edit</button>
                                            <button @click="removeAd(ad.id)" class="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50">Delete</button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>

                        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-900">{{ editingAdId ? 'Edit Ad' : 'Create Ad' }}</h3>
                                    <p class="mt-1 text-sm text-slate-500">Image ads need an uploaded image. Text ads can use headline and body only.</p>
                                </div>
                                <span v-if="adsStatus" class="text-sm font-medium text-slate-500">{{ adsStatus }}</span>
                            </div>

                            <div class="mt-5 space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700">Ad type</label>
                                    <div class="mt-2 flex gap-3">
                                        <button type="button" :class="['rounded-xl px-4 py-2 text-sm font-medium transition', adForm.type === 'text' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700']" @click="adForm.type = 'text'">Text</button>
                                        <button type="button" :class="['rounded-xl px-4 py-2 text-sm font-medium transition', adForm.type === 'image' ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700']" @click="adForm.type = 'image'">Image</button>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-slate-700">Headline</label>
                                    <input v-model="adForm.headline" type="text" maxlength="255" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-slate-700">Body</label>
                                    <textarea v-model="adForm.body" rows="4" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"></textarea>
                                </div>

                                <div v-if="adForm.type === 'image'">
                                    <label class="block text-sm font-medium text-slate-700">Ad Image</label>
                                    <div class="mt-2 flex flex-wrap items-center gap-3">
                                        <label class="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                                            <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleAdImageUpload" />
                                            {{ uploading.ad ? 'Uploading...' : 'Upload ad image' }}
                                        </label>
                                        <span v-if="adForm.image_url" class="text-xs text-slate-500">Image attached</span>
                                    </div>
                                    <img v-if="adForm.image_url" :src="adForm.image_url" alt="Ad preview" class="mt-4 h-36 w-full rounded-2xl object-cover" />
                                </div>

                                <div class="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label class="block text-sm font-medium text-slate-700">Start date</label>
                                        <input v-model="adForm.start_date" type="date" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-slate-700">End date</label>
                                        <input v-model="adForm.end_date" type="date" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900" />
                                    </div>
                                </div>

                                <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                                    <input v-model="adForm.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                                    Show this ad on the storefront
                                </label>

                                <div class="flex flex-wrap gap-3">
                                    <button @click="saveAd" :disabled="adsSaving" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                                        {{ adsSaving ? 'Saving...' : (editingAdId ? 'Update Ad' : 'Create Ad') }}
                                    </button>
                                    <button @click="resetAdForm" type="button" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-900">Publish</h3>
                                    <p class="mt-1 text-sm text-slate-500">Save branding, theme, and pricing updates to your public storefront.</p>
                                </div>
                                <button @click="saveSettings" :disabled="saving || !isDirty" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                                    {{ saving ? 'Saving...' : 'Save Shopfront' }}
                                </button>
                            </div>

                            <transition name="fade">
                                <p v-if="saveSuccess" class="mt-4 text-sm font-medium text-emerald-600">Shopfront settings saved.</p>
                                <p v-else-if="saveError" class="mt-4 text-sm font-medium text-rose-600">{{ saveError }}</p>
                                <p v-else class="mt-4 text-sm text-slate-500">Changes apply immediately on your public storefront.</p>
                            </transition>
                        </section>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompanyStore } from '~/stores/company'

definePageMeta({
    layout: 'company',
})

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

const themePresets = [
    { value: 'indigo', label: 'Indigo', description: 'Cool blue gradient', color: '#4f46e5', preview: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)' },
    { value: 'teal', label: 'Teal', description: 'Fresh clinical look', color: '#0f766e', preview: 'linear-gradient(135deg, #115e59 0%, #14b8a6 100%)' },
    { value: 'rose', label: 'Rose', description: 'Warm promotional tone', color: '#e11d48', preview: 'linear-gradient(135deg, #9f1239 0%, #fb7185 100%)' },
    { value: 'emerald', label: 'Emerald', description: 'Natural retail feel', color: '#047857', preview: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)' },
    { value: 'orange', label: 'Orange', description: 'High-energy highlight', color: '#ea580c', preview: 'linear-gradient(135deg, #9a3412 0%, #fb923c 100%)' },
    { value: 'slate', label: 'Slate', description: 'Minimal modern tone', color: '#334155', preview: 'linear-gradient(135deg, #0f172a 0%, #64748b 100%)' },
    { value: 'custom', label: 'Custom', description: 'Pick your own accent', color: '#111827', preview: 'linear-gradient(135deg, #111827 0%, #64748b 100%)' },
]

const defaultSettings = () => ({
    hide_prices: false,
    logo: null,
    shop_banner: null,
    theme_preset: 'indigo',
    theme_color: '#4f46e5',
})

const defaultAdForm = () => ({
    type: 'text',
    headline: '',
    body: '',
    image_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
})

const loading = ref(false)
const fetchError = ref('')
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const uploadStatus = ref('')
const adsStatus = ref('')
const adsSaving = ref(false)
const editingAdId = ref(null)

const uploading = ref({
    logo: false,
    banner: false,
    ad: false,
})

const settings = ref(defaultSettings())
const savedSettings = ref(defaultSettings())
const ads = ref([])
const adForm = ref(defaultAdForm())

const companyDomain = computed(() => {
    const match = route.path.match(/\/([^/]+)\/services/)
    return match ? match[1] : null
})

const companyId = computed(() => companyStore.currentCompany?.id || null)
const companyName = computed(() => companyStore.currentCompany?.name || 'Your Shop')
const companyInitials = computed(() => companyName.value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase())
const selectedTheme = computed(() => themePresets.find((theme) => theme.value === settings.value.theme_preset) || themePresets[0])
const selectedThemeLabel = computed(() => selectedTheme.value.label)
const previewTagline = computed(() => settings.value.hide_prices ? 'Pricing is hidden. Customers can request a quote directly from your catalog.' : 'Customers can browse products, see your branding, and order directly from your public page.')

const comparableSettings = (value) => JSON.stringify({
    hide_prices: !!value.hide_prices,
    logo: value.logo || null,
    shop_banner: value.shop_banner || null,
    theme_preset: value.theme_preset || 'indigo',
    theme_color: value.theme_color || null,
})

const isDirty = computed(() => comparableSettings(settings.value) !== comparableSettings(savedSettings.value))

const previewStyles = computed(() => {
    const accent = settings.value.theme_preset === 'custom'
        ? (settings.value.theme_color || '#4f46e5')
        : selectedTheme.value.color

    return {
        '--preview-accent': accent,
        backgroundImage: settings.value.shop_banner
            ? `linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.28)), url(${settings.value.shop_banner})`
            : `linear-gradient(135deg, ${accent}, #0f172a)`,
    }
})

const authHeaders = () => ({
    Authorization: `Bearer ${companyStore.companyAuthToken}`,
})

const goToLogin = () => {
    if (companyDomain.value) {
        router.push(`/${companyDomain.value}/services`)
        return
    }

    router.push('/')
}

const normalizeSettingsPayload = (payload = {}) => ({
    hide_prices: !!payload.hide_prices,
    logo: payload.logo || null,
    shop_banner: payload.shop_banner || null,
    theme_preset: payload.theme_preset || 'indigo',
    theme_color: payload.theme_color || '#4f46e5',
})

const formatDateInput = (value) => (value ? String(value).slice(0, 10) : '')

const loadSettings = async () => {
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBase}/api/companies/${companyId.value}/store-settings`, {
        headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load settings')
    }

    settings.value = normalizeSettingsPayload(data.data)
    savedSettings.value = normalizeSettingsPayload(data.data)
}

const loadAds = async () => {
    const config = useRuntimeConfig()
    const response = await fetch(`${config.public.apiBase}/api/companies/${companyId.value}/ads`, {
        headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load ads')
    }

    ads.value = data.data || []
}

const initializePage = async () => {
    if (!companyId.value) {
        return
    }

    loading.value = true
    fetchError.value = ''

    try {
        await Promise.all([loadSettings(), loadAds()])
    } catch (error) {
        console.error('Error initializing shopfront settings:', error)
        fetchError.value = error.message || 'Could not load shopfront settings'
    } finally {
        loading.value = false
    }
}

const uploadImage = async (endpoint, file) => {
    const config = useRuntimeConfig()
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${config.public.apiBase}/api/companies/${companyId.value}${endpoint}`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed')
    }

    return data.data.url
}

const handleAssetUpload = async (event, assetType) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !companyId.value) {
        return
    }

    const key = assetType === 'logo' ? 'logo' : 'banner'
    const endpoint = assetType === 'logo' ? '/shop-assets/logo' : '/shop-assets/banner'

    uploading.value[key] = true
    uploadStatus.value = `Uploading ${assetType}...`

    try {
        const imageUrl = await uploadImage(endpoint, file)
        if (assetType === 'logo') {
            settings.value.logo = imageUrl
        } else {
            settings.value.shop_banner = imageUrl
        }
        uploadStatus.value = `${assetType === 'logo' ? 'Logo' : 'Banner'} uploaded`
    } catch (error) {
        console.error(`Error uploading ${assetType}:`, error)
        uploadStatus.value = error.message || `Could not upload ${assetType}`
    } finally {
        uploading.value[key] = false
        setTimeout(() => {
            uploadStatus.value = ''
        }, 3000)
    }
}

const handleAdImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !companyId.value) {
        return
    }

    uploading.value.ad = true
    adsStatus.value = 'Uploading ad image...'

    try {
        adForm.value.image_url = await uploadImage('/shop-assets/ad-image', file)
        adsStatus.value = 'Ad image uploaded'
    } catch (error) {
        console.error('Error uploading ad image:', error)
        adsStatus.value = error.message || 'Could not upload ad image'
    } finally {
        uploading.value.ad = false
        setTimeout(() => {
            adsStatus.value = ''
        }, 3000)
    }
}

const saveSettings = async () => {
    if (!companyId.value || saving.value || !isDirty.value) {
        return
    }

    saving.value = true
    saveError.value = ''
    saveSuccess.value = false

    try {
        const config = useRuntimeConfig()
        const response = await fetch(`${config.public.apiBase}/api/companies/${companyId.value}/store-settings`, {
            method: 'PUT',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                hide_prices: settings.value.hide_prices,
                logo: settings.value.logo,
                shop_banner: settings.value.shop_banner,
                theme_preset: settings.value.theme_preset,
                theme_color: settings.value.theme_preset === 'custom' ? settings.value.theme_color : null,
            }),
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save settings')
        }

        settings.value = normalizeSettingsPayload(data.data)
        savedSettings.value = normalizeSettingsPayload(data.data)
        saveSuccess.value = true
        setTimeout(() => {
            saveSuccess.value = false
        }, 3000)
    } catch (error) {
        console.error('Error saving shopfront settings:', error)
        saveError.value = error.message || 'Could not save shopfront settings'
        setTimeout(() => {
            saveError.value = ''
        }, 5000)
    } finally {
        saving.value = false
    }
}

const resetAdForm = () => {
    editingAdId.value = null
    adForm.value = defaultAdForm()
}

const startNewAd = () => {
    resetAdForm()
}

const editAd = (ad) => {
    editingAdId.value = ad.id
    adForm.value = {
        type: ad.type || 'text',
        headline: ad.headline || '',
        body: ad.body || '',
        image_url: ad.image_url || '',
        start_date: formatDateInput(ad.start_date),
        end_date: formatDateInput(ad.end_date),
        is_active: !!ad.is_active,
    }
}

const saveAd = async () => {
    if (!companyId.value || adsSaving.value) {
        return
    }

    adsSaving.value = true
    adsStatus.value = ''

    try {
        const config = useRuntimeConfig()
        const endpoint = editingAdId.value
            ? `/api/companies/${companyId.value}/ads/${editingAdId.value}`
            : `/api/companies/${companyId.value}/ads`
        const method = editingAdId.value ? 'PUT' : 'POST'

        const response = await fetch(`${config.public.apiBase}${endpoint}`, {
            method,
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...adForm.value,
                body: adForm.value.body || null,
                image_url: adForm.value.image_url || null,
                start_date: adForm.value.start_date || null,
                end_date: adForm.value.end_date || null,
            }),
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save ad')
        }

        await loadAds()
        resetAdForm()
        adsStatus.value = editingAdId.value ? 'Ad updated' : 'Ad created'
    } catch (error) {
        console.error('Error saving ad:', error)
        adsStatus.value = error.message || 'Could not save ad'
    } finally {
        adsSaving.value = false
        setTimeout(() => {
            adsStatus.value = ''
        }, 3000)
    }
}

const removeAd = async (adId) => {
    if (!companyId.value || !window.confirm('Delete this ad?')) {
        return
    }

    try {
        const config = useRuntimeConfig()
        const response = await fetch(`${config.public.apiBase}/api/companies/${companyId.value}/ads/${adId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to delete ad')
        }

        ads.value = ads.value.filter((ad) => ad.id !== adId)
        if (editingAdId.value === adId) {
            resetAdForm()
        }
        adsStatus.value = 'Ad deleted'
        setTimeout(() => {
            adsStatus.value = ''
        }, 3000)
    } catch (error) {
        console.error('Error deleting ad:', error)
        adsStatus.value = error.message || 'Could not delete ad'
    }
}

const formatAdWindow = (startDate, endDate) => {
    if (!startDate && !endDate) {
        return 'Runs until you disable it'
    }

    const start = startDate ? new Date(startDate).toLocaleDateString() : 'now'
    const end = endDate ? new Date(endDate).toLocaleDateString() : 'open-ended'
    return `${start} to ${end}`
}

onMounted(async () => {
    if (!companyStore.authInitialized) {
        await companyStore.checkAuthState()
    }

    if (companyStore.isLoggedIn) {
        await initializePage()
    }
})
</script>

<style scoped>
.preview-shell {
    position: relative;
    min-height: 320px;
    background-position: center;
    background-size: cover;
}

.preview-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.72));
}

.preview-content {
    position: relative;
    padding: 2rem;
}

.preview-logo-wrap {
    height: 88px;
    width: 88px;
    overflow: hidden;
    border-radius: 9999px;
    border: 3px solid rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
}

.theme-option {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    padding: 1rem;
    text-align: left;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.theme-option:hover {
    border-color: #0f172a;
    transform: translateY(-1px);
}

.theme-option-active {
    border-color: #0f172a;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
}

.theme-swatch {
    display: block;
    height: 2.5rem;
    width: 2.5rem;
    flex-shrink: 0;
    border-radius: 9999px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>