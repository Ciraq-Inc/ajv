<template>
  <div class="customer-app">
    <!-- Shown while the stored session is checked -->
    <div v-if="isCheckingAuth" class="space-y-4" aria-busy="true" aria-label="Loading your dashboard">
      <span class="sr-only" role="status">Loading your dashboard…</span>
      <div class="space-y-3" aria-hidden="true">
        <div class="h-3 w-32 rounded bg-ink-100 animate-pulse"></div>
        <div v-for="n in 2" :key="`sk-${n}`" class="flex gap-4 border border-ink-100 bg-white px-4 py-4 rounded-xl">
          <div class="h-10 w-10 rounded-full bg-ink-50 animate-pulse"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/2 rounded bg-ink-50 animate-pulse"></div>
            <div class="h-2.5 w-1/3 rounded bg-ink-50 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>

      <div v-if="currentTab === 'new'" class="page-view">
        <OrderRequests default-sub-tab="new" />
      </div>

      <div v-if="currentTab === 'requests'" class="page-view">
        <OrderRequests default-sub-tab="list" :initial-request-id="requestIdFromQuery" />
      </div>

      <div v-if="currentTab === 'wallet'" class="page-view">
        <Wallet />
      </div>

      <div v-if="currentTab === 'orders'" class="page-view">
        <Orders />
      </div>

      <div v-if="currentTab === 'profile'" class="page-view">
        <Profile />
      </div>

      <div v-if="currentTab === 'companies'" class="page-view">
        <LinkedCompanies />
      </div>

      <div v-if="currentTab === 'stock' && isProfessionalApproved" class="page-view">
        <ProfessionalStock />
      </div>

      <div v-if="currentTab === 'clearance'" class="page-view">
        <ClearanceDeals />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LinkedCompanies from '~/components/customers/linkedCompanies.vue'
import Orders from '~/components/customers/orders.vue'
import OrderRequests from '~/components/customers/orderRequests.vue'
import Profile from '~/components/customers/profile.vue'
import Wallet from '~/components/customers/wallet.vue'
import ProfessionalStock from '~/components/customers/professionalStock.vue'
import ClearanceDeals from '~/components/customers/clearanceDeals.vue'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: 'customer' })

const userStore = useUserStore()
const route = useRoute()

const isCheckingAuth = ref<boolean>(!userStore.authInitialized)

const SECTIONS = ['new', 'requests', 'wallet', 'orders', 'profile', 'companies', 'stock', 'clearance']
const isProfessionalApproved = computed<boolean>(() => (userStore.masterCustomer as Record<string, unknown> | undefined)?.professional_status === 'approved')
// An old link (?tab=home) or a mistyped one lands on "new request" rather than a blank page.
const currentTab = computed<string>(() => {
  const tab = String(route.query['tab'] ?? 'new')
  if (!SECTIONS.includes(tab)) return 'new'
  if (tab === 'stock' && !isProfessionalApproved.value) return 'new'
  return tab
})
const requestIdFromQuery = computed<string | null>(() => {
  const value = route.query['requestId']
  if (Array.isArray(value)) return value[0] ?? null
  return (value as string | undefined) ?? null
})

onMounted(async () => {
  try {
    const handoffToken = route.query['handoff']
    if (typeof handoffToken === 'string' && handoffToken) {
      try {
        await userStore.redeemSessionHandoff(handoffToken)
      } catch {
        // Expired / already used / invalid — fall through to the normal
        // auth check below, which will bounce to login if still unauthed.
      }
      // Strip the spent token from the URL either way so it doesn't
      // linger in history/referrers; keep requestId if one was present.
      await navigateTo(
        { path: '/customer', query: requestIdFromQuery.value ? { requestId: requestIdFromQuery.value } : {} },
        { replace: true }
      )
    }

    if (!userStore.authInitialized) await (userStore as unknown as { checkAuthState: () => Promise<void> }).checkAuthState()
    if (!userStore.customerAuthToken) {
      await navigateTo({ path: '/', query: requestIdFromQuery.value ? { requestId: requestIdFromQuery.value } : {} })
      return
    }
  } catch (error) {
    console.error('Dashboard init error:', error)
  } finally {
    isCheckingAuth.value = false
  }
})
</script>

<style>
.customer-app {
  width: 100%;
}

.page-view {
  min-height: 60vh;
  width: 100%;
  overflow-x: clip;
}
</style>
