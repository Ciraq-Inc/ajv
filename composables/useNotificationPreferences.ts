// composables/useNotificationPreferences.ts
//
// The "Notifications" part of the customer profile: which channel (text / email) each
// kind of message may use. The server decides what is reachable and what can be turned
// off (rules live in rigel-medsgh notificationChannels.js); this mirrors them only so
// the toggles are not offered when the server would refuse. It still shows the
// server's refusal if one comes back.
//
// Dependencies are injected so it carries no Pinia or HTTP of its own.

import { computed, ref } from 'vue'
import type {
  ApiEnvelope,
  NotificationCategory,
  NotificationCategoryKey,
  NotificationChannel,
  NotificationPreferenceChanges,
  NotificationPreferences,
} from '~/services/customerAuth/customerAuthService'

const CHANNELS: NotificationChannel[] = ['sms', 'email']

const COPY: Record<NotificationCategoryKey, { label: string; description: string }> = {
  security: { label: 'Security', description: 'Sign-in codes and account changes. Always sent.' },
  action_required: { label: 'Needs your decision', description: 'When we need you to choose or pay so your order can continue.' },
  outcome: { label: 'Order results', description: 'When an order is delivered, cancelled, expired or returned.' },
  order_progress: { label: 'Order progress', description: 'Updates along the way, such as a rider being assigned.' },
  marketing: { label: 'Offers and news', description: 'Promotions from MedsGH. Off unless you switch it on.' },
}

const UNREACHABLE: Record<NotificationChannel, string> = {
  sms: 'Text messages are only available for Ghana phone numbers.',
  email: 'Add and verify an email address to get emails.',
}

export interface ChannelToggle {
  on: boolean
  disabled: boolean
  /** Why the toggle can't be changed; '' when it can. */
  reason: string
}

export interface PreferenceRow {
  key: NotificationCategoryKey
  label: string
  description: string
  mode: NotificationCategory['mode']
  sms: ChannelToggle
  email: ChannelToggle
}

type Draft = Record<NotificationCategoryKey, Record<NotificationChannel, boolean>>

const toDraft = (categories: NotificationPreferences['categories']): Draft => {
  const draft = {} as Draft
  for (const key of Object.keys(categories) as NotificationCategoryKey[]) {
    draft[key] = { sms: categories[key].sms === true, email: categories[key].email === true }
  }
  return draft
}

const GENERIC_SAVE_ERROR = "We couldn't save your notification settings. Please try again."

export function useNotificationPreferences(deps: {
  fetch: () => Promise<ApiEnvelope<NotificationPreferences>>
  save: (changes: NotificationPreferenceChanges) => Promise<ApiEnvelope<NotificationPreferences>>
}) {
  const server = ref<NotificationPreferences | null>(null)
  const draft = ref<Draft | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const saved = ref(false)
  const loadError = ref('')
  const saveError = ref('')

  const adopt = (prefs: NotificationPreferences): void => {
    server.value = prefs
    draft.value = toDraft(prefs.categories)
  }

  const load = async (): Promise<void> => {
    loading.value = true
    loadError.value = ''
    try {
      adopt((await deps.fetch()).data)
    } catch {
      server.value = null
      draft.value = null
      loadError.value = "We couldn't load your notification settings. Please try again."
    } finally {
      loading.value = false
    }
  }

  const toggleState = (key: NotificationCategoryKey, channel: NotificationChannel): ChannelToggle => {
    const prefs = server.value!
    const current = draft.value![key]
    const on = current[channel]
    if (!prefs.channels[channel].reachable) return { on, disabled: true, reason: UNREACHABLE[channel] }

    const mode = prefs.categories[key].mode
    if (mode === 'locked') return { on, disabled: true, reason: 'Always on for your security.' }
    if (mode === 'minimum_one' && on) {
      const stillOn = CHANNELS.filter((c) => prefs.channels[c].reachable && current[c]).length
      if (stillOn <= 1) return { on, disabled: true, reason: 'Keep at least one way to be reached.' }
    }
    return { on, disabled: false, reason: '' }
  }

  const rows = computed<PreferenceRow[]>(() => {
    if (!server.value || !draft.value) return []
    return (Object.keys(server.value.categories) as NotificationCategoryKey[]).map((key) => ({
      key,
      ...COPY[key],
      mode: server.value!.categories[key].mode,
      sms: toggleState(key, 'sms'),
      email: toggleState(key, 'email'),
    }))
  })

  const changes = computed<NotificationPreferenceChanges>(() => {
    const out: NotificationPreferenceChanges = {}
    if (!server.value || !draft.value) return out
    for (const key of Object.keys(server.value.categories) as NotificationCategoryKey[]) {
      for (const channel of CHANNELS) {
        if (draft.value[key][channel] !== (server.value.categories[key][channel] === true)) {
          out[key] = { ...out[key], [channel]: draft.value[key][channel] }
        }
      }
    }
    return out
  })

  const dirty = computed(() => Object.keys(changes.value).length > 0)

  const toggle = (key: NotificationCategoryKey, channel: NotificationChannel): void => {
    if (!server.value || !draft.value) return
    if (toggleState(key, channel).disabled) return
    draft.value[key][channel] = !draft.value[key][channel]
    saved.value = false
    saveError.value = ''
  }

  const save = async (): Promise<void> => {
    if (saving.value || !dirty.value) return
    saving.value = true
    saveError.value = ''
    try {
      adopt((await deps.save(changes.value)).data)
      saved.value = true
    } catch (error: unknown) {
      saved.value = false
      const body = (error as { body?: { code?: string; message?: string } } | null)?.body
      saveError.value = body?.code && body.message ? body.message : GENERIC_SAVE_ERROR
    } finally {
      saving.value = false
    }
  }

  return { rows, dirty, loading, saving, saved, loadError, saveError, load, toggle, save }
}
