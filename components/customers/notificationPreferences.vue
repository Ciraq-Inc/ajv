<template>
  <section id="profile-notifications" aria-labelledby="sec-notifications" class="scroll-mt-6 border-t border-ink-100 pt-10">
    <div>
      <h2 id="sec-notifications" class="font-display text-2xl font-bold text-ink-900">Notifications</h2>
      <p class="mt-1 text-sm text-ink-500">Choose how we reach you about each kind of message.</p>
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
        <li v-for="row in rows" :key="row.key" class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
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

const service = createCustomerAuthService(useApi())

const { rows, dirty, loading, saving, saved, loadError, saveError, load, toggle, save } = useNotificationPreferences({
  fetch: () => service.getNotificationPreferences(),
  save: (changes) => service.updateNotificationPreferences(changes),
})

const channels = [
  { key: 'sms', label: 'Text', ariaName: 'text message' },
  { key: 'email', label: 'Email', ariaName: 'email' },
] as const

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

onMounted(load)
</script>
