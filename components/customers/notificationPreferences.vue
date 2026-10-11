<template>
  <section id="profile-notifications" aria-labelledby="sec-notifications" class="scroll-mt-6 border-t border-ink-100 pt-10">
    <div>
      <h2 id="sec-notifications" class="font-display text-2xl font-bold text-ink-900">Notifications</h2>
      <p class="mt-1 text-sm text-ink-500">Choose how we reach you about each kind of message.</p>
    </div>

    <div class="mt-5 rounded-xl border border-ink-100 px-4 py-4">
      <label class="flex min-h-[44px] items-start gap-3"
        :class="pushToggleDisabled ? 'cursor-not-allowed' : 'cursor-pointer'">
        <input v-if="showPushToggle" type="checkbox" role="switch" data-testid="push-toggle"
          aria-label="Notify me on this phone"
          :checked="push.status.value === 'on'"
          :disabled="pushToggleDisabled"
          :aria-describedby="pushHint ? 'push-hint' : undefined"
          class="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-300 text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
          @change="onPushToggle" />
        <span class="min-w-0">
          <span class="block text-base font-semibold text-ink-900">Notify me on this phone</span>
          <span class="block text-sm text-ink-500">Get order updates as a notification, even when MedsGH is closed. Your delivery code is never shown in a notification.</span>
        </span>
      </label>
      <p v-if="pushHint" id="push-hint" data-testid="push-hint" class="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm font-medium text-ink-700">{{ pushHint }}</p>
      <p v-if="push.error.value" data-testid="push-error" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ push.error.value }}</p>
      <p v-if="showEmailOnlyNudge" data-testid="phone-nudge" class="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
        You only get email about your orders right now. Turn this on to hear about them sooner, as a notification on this phone.
      </p>
    </div>

    <p v-if="loading" role="status" class="mt-5 text-sm font-medium text-ink-500">Loading your notification settings…</p>

    <div v-else-if="loadError" class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p role="alert" class="text-sm font-medium text-red-800">{{ loadError }}</p>
      <button type="button" data-testid="retry-notifications" @click="load"
        class="mt-1 min-h-[44px] rounded text-sm font-bold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50">
        Try again
      </button>
    </div>

    <div v-else class="mt-5">
      <ul class="divide-y divide-ink-100 rounded-xl border border-ink-100">
        <template v-for="row in rows" :key="row.key">
        <li class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="text-base font-semibold text-ink-900">{{ row.label }}</p>
            <p class="text-sm text-ink-500">{{ row.description }}</p>
          </div>
          <div class="flex shrink-0 gap-6">
            <label v-for="channel in channels" :key="channel.key"
              class="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-ink-700"
              :class="row[channel.key].disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">
              <input type="checkbox" role="switch"
                :aria-label="`${row.label}: ${channel.ariaName}`"
                :checked="row[channel.key].on"
                :disabled="row[channel.key].disabled"
                :aria-describedby="row[channel.key].reason ? `${row.key}-${channel.key}-why` : undefined"
                class="h-5 w-5 rounded border-ink-300 text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
                @change="toggle(row.key, channel.key)" />
              {{ channel.label }}
              <span v-if="row[channel.key].reason" :id="`${row.key}-${channel.key}-why`" class="sr-only">{{ row[channel.key].reason }}</span>
            </label>
          </div>
        </li>
        <li v-if="row.key === 'order_progress' && alsoText.visible" class="px-4 pb-4">
          <label class="flex min-h-[44px] cursor-pointer items-start gap-3">
            <input type="checkbox" role="switch" data-testid="also-text-toggle"
              aria-label="Also text me order updates"
              :checked="alsoText.on"
              class="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-300 text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
              @change="toggleAlsoText" />
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-ink-900">Also text me these updates</span>
              <span class="block text-sm text-ink-500">Rider and delivery updates come to your phone as notifications. Tick this to get a text for them too.</span>
            </span>
          </label>
        </li>
        </template>
      </ul>

      <ul class="mt-3 space-y-1 text-xs font-medium text-ink-500">
        <li v-for="note in unavailableNotes" :key="note">{{ note }}</li>
      </ul>

      <div class="mt-5 flex flex-wrap items-center gap-4">
        <button type="button" data-testid="save-notifications" :disabled="!dirty || saving" @click="save"
          class="min-h-[48px] rounded-lg bg-brand-700 px-6 text-base font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500">
          {{ saving ? 'Saving…' : 'Save notification settings' }}
        </button>
        <p v-if="saved" role="status" data-testid="notifications-saved" class="text-sm font-medium text-brand-800">Saved.</p>
        <p v-if="saveError" role="alert" class="text-sm font-medium text-red-700">{{ saveError }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService'
import { useApi } from '~/composables/useApi'
import { useNotificationPreferences } from '~/composables/useNotificationPreferences'
import { usePushNotifications, realPushBrowser } from '~/composables/usePushNotifications'

const service = createCustomerAuthService(useApi())

const { rows, dirty, loading, saving, saved, loadError, saveError, alsoText, reachable, load, toggle, toggleAlsoText, save } = useNotificationPreferences({
  fetch: () => service.getNotificationPreferences(),
  save: (changes) => service.updateNotificationPreferences(changes),
})

const push = usePushNotifications({
  browser: realPushBrowser(),
  getPublicKey: () => service.getPushPublicKey(),
  subscribe: (subscription) => service.subscribePush(subscription),
  unsubscribe: (endpoint) => service.unsubscribePush(endpoint),
})

const channels = [
  { key: 'sms', label: 'Text', ariaName: 'text message' },
  { key: 'email', label: 'Email', ariaName: 'email' },
  { key: 'push', label: 'Phone', ariaName: 'phone' },
] as const

const HINTS: Partial<Record<typeof push.status.value, string>> = {
  'needs-install': 'On iPhone, notifications only work once MedsGH is on your Home Screen. Tap the Share button, choose Add to Home Screen, then open MedsGH from there and turn this on.',
  blocked: 'Notifications are blocked for MedsGH on this phone. Allow them in your browser or phone settings, then come back here.',
  unsupported: "Notifications aren't supported in this browser. You'll still get texts and emails.",
}
const pushHint = computed(() => HINTS[push.status.value] ?? '')
const showPushToggle = computed(() => push.status.value !== 'needs-install' && push.status.value !== 'unsupported')
// Someone who can't be texted gets updates by email only; this phone is the one faster channel on offer.
const showEmailOnlyNudge = computed(() => push.status.value === 'off' && reachable.value.email && !reachable.value.sms)
const pushToggleDisabled = computed(() => push.status.value === 'blocked' || push.status.value === 'checking' || push.busy.value)

// The server only unlocks the Phone switches once it holds a subscription, so re-read the settings
// after a change on this phone, unless that would throw away edits that haven't been saved yet
// (Save refreshes them too).
const reloadUnlessEditing = async () => { if (!dirty.value) await load() }

const onPushToggle = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (push.status.value === 'on') await push.disable()
  else await push.enable()
  // Keep the switch honest when the attempt failed or the person refused the prompt.
  input.checked = push.status.value === 'on'
  await reloadUnlessEditing()
}

// One line per unreachable channel instead of repeating the reason on every row.
const unavailableNotes = computed(() => {
  const notes = new Set<string>()
  for (const row of rows.value) {
    for (const channel of channels) {
      const toggleState = row[channel.key]
      if (toggleState.disabled && toggleState.reason && row.mode !== 'locked' && !toggleState.reason.startsWith('Keep at least')) {
        notes.add(toggleState.reason)
      }
    }
  }
  return [...notes]
})

// Checking this phone never shows a permission prompt; only the tap above does.
onMounted(() => Promise.all([load(), push.refresh()]))
</script>
