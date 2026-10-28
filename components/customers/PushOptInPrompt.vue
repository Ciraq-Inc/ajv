<template>
  <div v-if="visible" data-testid="push-prompt" class="rounded-lg border border-brand-200 bg-white p-4 text-left">
    <template v-if="justEnabled">
      <p data-testid="push-prompt-done" role="status" class="text-sm font-semibold text-brand-800">
        Done. We'll notify you on this phone as your order moves.
      </p>
    </template>
    <template v-else>
      <p class="text-sm font-semibold text-ink-900">Get delivery updates on this phone?</p>
      <p v-if="push.status.value === 'needs-install'" class="mt-1 text-sm text-ink-600">
        On iPhone, add MedsGH to your Home Screen to get notifications: tap the Share button, then Add to Home Screen. Open MedsGH from there and turn them on in your profile.
      </p>
      <p v-else class="mt-1 text-sm text-ink-600">
        We'll tell you when a pharmacy responds and when your order is on its way. You'll still get texts and emails.
      </p>
      <p v-if="push.error.value" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ push.error.value }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button v-if="push.status.value === 'off'" type="button" data-testid="push-prompt-enable" :disabled="push.busy.value" @click="enable"
          class="min-h-[44px] rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 disabled:opacity-60">
          {{ push.busy.value ? 'Turning on…' : 'Turn on notifications' }}
        </button>
        <button type="button" data-testid="push-prompt-dismiss" @click="dismiss"
          class="min-h-[44px] rounded-md px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50">
          {{ push.status.value === 'needs-install' ? 'Got it' : 'Not now' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// Shown once after an order is placed, for a signed-in customer whose phone could get push
// notifications but doesn't yet. Nothing here talks to the browser until the customer taps.
import { computed, onMounted, ref } from 'vue'
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService'
import { useApi } from '~/composables/useApi'
import { useUserStore } from '~/stores/user'
import { usePushNotifications, realPushBrowser } from '~/composables/usePushNotifications'

const DISMISSED_KEY = 'pushPromptDismissed'

const readDismissed = (): boolean => {
  try { return localStorage.getItem(DISMISSED_KEY) === '1' } catch { return false }
}
const writeDismissed = (): void => {
  try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* private mode: it will simply ask again */ }
}

const user = useUserStore()
const service = createCustomerAuthService(useApi())
const push = usePushNotifications({
  browser: realPushBrowser(),
  getPublicKey: () => service.getPushPublicKey(),
  subscribe: (subscription) => service.subscribePush(subscription),
  unsubscribe: (endpoint) => service.unsubscribePush(endpoint),
})

const dismissed = ref(readDismissed())
const justEnabled = ref(false)

const visible = computed(() => {
  if (!user.isLoggedIn) return false
  if (justEnabled.value) return true
  return !dismissed.value && (push.status.value === 'off' || push.status.value === 'needs-install')
})

const enable = async () => {
  await push.enable()
  if (push.status.value === 'on') justEnabled.value = true
}

const dismiss = () => {
  writeDismissed()
  dismissed.value = true
}

onMounted(() => { if (user.isLoggedIn && !dismissed.value) return push.refresh() })
</script>
