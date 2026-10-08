<template>
  <div class="theme-medsgh min-h-screen bg-white text-ink-900">

    <!-- Toast notification -->
    <Transition
      enter-from-class="opacity-0 -translate-y-2"
      enter-active-class="transition duration-200 ease-out"
      leave-to-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
    >
      <div
        v-if="toast"
        role="alert"
        aria-live="polite"
        class="fixed right-4 top-24 z-50 flex max-w-sm items-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold text-white shadow-lift"
        :class="toast.type === 'success' ? 'bg-brand-800' : 'bg-red-700'"
      >
        <ShieldCheckIcon v-if="toast.type === 'success'" class="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
        <XMarkIcon v-else class="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
        {{ toast.text }}
      </div>
    </Transition>

    <main class="pb-6">

      <!-- ── Hero ── -->
      <section class="relative isolate overflow-hidden bg-white pb-16 pt-28 sm:pt-32 lg:pb-20 lg:pt-36">
        <img
          src="/hero_image.jpg"
          alt=""
          role="presentation"
          class="lg:hidden absolute left-0 top-20 -z-10 h-[calc(100%-5rem)] w-[143%] max-w-none -scale-x-100 object-cover object-top opacity-20"
        />
        <img
          src="/hero_desktop.jpg"
          alt=""
          role="presentation"
          class="absolute left-0 top-20 -z-10 hidden h-[calc(100%-5rem)] w-full -scale-x-100 object-cover object-top opacity-20 lg:block"
        />
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,26rem)] lg:gap-12">

          <div class="text-center lg:text-left">
            <span class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-2 text-sm font-bold text-brand-700">
              <span class="h-2 w-2 rounded-full bg-brand-700" aria-hidden="true"></span>
              Verified pharmacies across Ghana
            </span>

            <h1 class="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[1.04] text-ink-900">
              Order <span class="text-brand-700">any medication</span> online.
            </h1>

            <p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600 sm:text-xl lg:mx-0">
              From 210+ verified pharmacies across Ghana, delivered in about 45 minutes.
            </p>

            <ul class="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-base font-semibold text-ink-900 lg:justify-start">
              <li class="flex items-center gap-2"><ShieldCheckIcon class="h-6 w-6 text-brand-700" aria-hidden="true" /> Licensed pharmacies only</li>
              <li class="flex items-center gap-2"><BoltIcon class="h-6 w-6 text-brand-700" aria-hidden="true" /> About 45 min delivery</li>
              <li class="flex items-center gap-2"><LockClosedIcon class="h-6 w-6 text-brand-700" aria-hidden="true" /> Secure payment</li>
            </ul>
          </div>

          <div class="mx-auto w-full max-w-md lg:max-w-none">

            <!-- Loading state: skeleton while checkAuthState() resolves -->
            <div
              v-if="authChecking"
              aria-label="Loading sign-in form"
              class="overflow-hidden rounded-3xl bg-white p-6 shadow-lift ring-1 ring-ink-200"
            >
              <Skeleton class="mb-5 h-12 w-full rounded-full" />
              <Skeleton class="mb-2 h-4 w-28" />
              <Skeleton class="mb-5 h-12 w-full" />
              <Skeleton class="mb-2 h-4 w-24" />
              <Skeleton class="mb-6 h-12 w-full" />
              <Skeleton class="h-12 w-full bg-brand-200" />
            </div>

            <div v-else>
              <!-- Tab switcher: Create account (default) <-> Quick request -->
              <Tabs v-model="heroTab" class="mb-3">
                <TabsList class="flex w-full bg-ink-50" aria-label="How would you like to get started?">
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                  <TabsTrigger value="guest">Quick request</TabsTrigger>
                </TabsList>

                <!-- Create account / sign in card (Login handles both views internally) -->
                <TabsContent value="signup" class="mt-3">
                  <Login :key="heroLoginInitialView" :initial-view="heroLoginInitialView" inline @login-success="handleLoginSuccess" />
                </TabsContent>

                <!-- Guest quick-request card. Kept mounted so typed text survives a tab switch. -->
                <TabsContent value="guest" force-mount class="mt-3">
                  <HomeQuickRequest v-model:draft-items="heroDraftItems" @switch-view="openAuth" />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <HomeStats />
      <HomeHowItWorks />
      <HomeFaq />
      <HomeTrust />
    </main>

    <HomeFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Login from '~/components/Login.vue'
import HomeQuickRequest from '~/components/home/HomeQuickRequest.vue'
import HomeStats from '~/components/home/HomeStats.vue'
import HomeHowItWorks from '~/components/home/HomeHowItWorks.vue'
import HomeFaq from '~/components/home/HomeFaq.vue'
import HomeTrust from '~/components/home/HomeTrust.vue'
import HomeFooter from '~/components/home/HomeFooter.vue'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import type { HeroDraftItem } from '~/components/home/content'
import { useUserStore } from '~/stores/user'
import { BoltIcon, LockClosedIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface LoginPayload {
  destination?: string;
  [key: string]: unknown;
}

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft'
const HOMEPAGE_PRESCRIPTION_DRAFT_KEY = 'medsgh_homepage_prescription_image'

const userStore = useUserStore()
const route = useRoute()
const authChecking = ref<boolean>(true)

const heroTab = ref<'signup' | 'guest'>('signup')
const heroLoginInitialView = ref<'login' | 'signup'>('signup')

// Pre-filled items when the guest arrives from the Clearance Marketplace (rOS) —
// shown as a product list instead of the freeform textarea.
const heroDraftItems = ref<HeroDraftItem[]>([])

const normalizeHeroDraftItem = (item: unknown): HeroDraftItem | null => {
  const src = item as Record<string, unknown> | string | null | undefined
  const productName = String(
    typeof src === 'string' ? src : (src as Record<string, unknown> | null)?.['product_name'] ?? ''
  ).trim()
  if (!productName) return null

  const srcObj = typeof src === 'string' ? null : src as Record<string, unknown> | null
  return {
    product_name: productName,
    requested_unit: String(srcObj?.['requested_unit'] ?? '').trim().toLowerCase(),
    quantity: Math.max(1, Number(srcObj?.['quantity'] ?? 1)),
    prefer_clearance_only: Boolean(srcObj?.['prefer_clearance_only']),
  }
}

const openAuth = (view: 'login' | 'signup'): void => {
  heroLoginInitialView.value = view
  heroTab.value = 'signup'
}

const toast = ref<{ text: string; type: string } | null>(null)

const showToast = (text: string, type = 'success'): void => {
  toast.value = { text, type }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

const hasHomepageRequestDraft = (): boolean => {
  if (typeof sessionStorage === 'undefined') return false
  return Boolean(sessionStorage.getItem(HOMEPAGE_REQUEST_DRAFT_KEY))
    || Boolean(sessionStorage.getItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY))
}

const handleLoginSuccess = async (payload: LoginPayload | { destination: string; action: string } = {}): Promise<void> => {
  const requestId = route.query['requestId']
  if (requestId) {
    await navigateTo({ path: '/customer', query: { requestId } })
    return
  }
  if (payload.destination === 'new' || hasHomepageRequestDraft()) {
    await navigateTo('/customer?tab=new')
    return
  }
  await navigateTo('/customer')
}

const handleLoggedOutNotice = async (flag: unknown): Promise<void> => {
  if (!flag) return
  showToast('You have been logged out.', 'success')
  await navigateTo({ path: '/', query: {} }, { replace: true })
}

const redirectLoggedInUsers = async (): Promise<boolean> => {
  if (!userStore.isLoggedIn) return false
  const requestId = route.query['requestId']
  if (requestId) {
    await navigateTo({ path: '/customer', query: { requestId } }, { replace: true })
    return true
  }
  if (hasHomepageRequestDraft()) {
    await navigateTo('/customer?tab=new', { replace: true })
    return true
  }
  await navigateTo('/customer', { replace: true })
  return true
}

const captureClearanceDraftParam = (): void => {
  if (typeof sessionStorage === 'undefined') return
  const draftParam = route.query['clearance_draft']
  if (!draftParam) return
  try {
    const decoded = JSON.parse(String(draftParam)) as { items?: unknown[] } | null
    const normalizedItems = Array.isArray(decoded?.items)
      ? decoded.items.map(normalizeHeroDraftItem).filter((x): x is HeroDraftItem => x !== null)
      : []
    if (normalizedItems.length) {
      sessionStorage.setItem(HOMEPAGE_REQUEST_DRAFT_KEY, JSON.stringify({
        items: decoded!.items,
        source: 'ros-clearance-marketplace',
      }))
      // Show the guest quick-request card with the selected items instead of the
      // blank "what do you need?" box — this is a logged-out user's fast path in
      // from the Clearance Marketplace, so skip straight to it.
      heroDraftItems.value = normalizedItems
      heroTab.value = 'guest'
    }
  } catch {
    // Malformed draft param — ignore, no request draft is applied.
  }
}

onMounted(async () => {
  captureClearanceDraftParam()
  await (userStore as unknown as { checkAuthState: () => Promise<void> }).checkAuthState()
  authChecking.value = false
  await redirectLoggedInUsers()
})

watch(() => route.query['logged_out'], handleLoggedOutNotice, { immediate: true })
watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (!isLoggedIn) return
    await redirectLoggedInUsers()
  }
)
</script>
