<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity" @click="close"></div>

      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all" @click.stop>
          <!-- Header -->
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-900">
                  {{ campaign?.name || 'Campaign Details' }}
                </h2>
                <p class="text-sm text-gray-600 mt-1">View campaign statistics and message logs</p>
              </div>
              <div class="flex items-center gap-3">
                <!-- Status Badge -->
                <span
                  v-if="campaign"
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getStatusClass(campaign.status)
                  ]"
                >
                  {{ campaign.status }}
                </span>
                <button
                  @click="close"
                  class="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
            <!-- Loading State -->
            <div v-if="loading" class="text-center py-12">
              <ArrowPathIcon class="h-12 w-12 animate-spin mx-auto mb-4 cs-text" />
              <p class="text-gray-600">Loading campaign details...</p>
            </div>

            <!-- Campaign Content -->
            <div v-else-if="campaign" class="space-y-6">
              <!-- Stats Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-purple-100 p-2 rounded-lg">
                      <UsersIcon class="h-5 w-5 cs-text" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Total Recipients</p>
                      <p class="text-xl font-bold text-gray-900">{{ stats?.total_recipients || campaign?.total_recipients || 0 }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-green-100 p-2 rounded-lg">
                      <CheckCircleIcon class="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Sent</p>
                      <p class="text-xl font-bold text-gray-900">{{ stats?.messages_sent || campaign?.messages_sent || 0 }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-yellow-100 p-2 rounded-lg">
                      <ClockIcon class="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Delivered</p>
                      <p class="text-xl font-bold text-gray-900">{{ stats?.messages_delivered || campaign?.messages_delivered || 0 }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-red-100 p-2 rounded-lg">
                      <XCircleIcon class="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600">Failed</p>
                      <p class="text-xl font-bold text-gray-900">{{ stats?.messages_failed || campaign?.messages_failed || 0 }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Campaign Info -->
              <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Campaign Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="text-sm text-gray-600 font-medium">Message</label>
                    <p class="text-gray-900 mt-1 p-3 bg-white rounded border border-gray-200 text-sm">
                      {{ campaign.message }}
                    </p>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <label class="text-sm text-gray-600 font-medium">Cost</label>
                      <p class="text-gray-900 mt-1 text-sm font-semibold">
                        GHS {{ formatCurrency(campaign.actual_cost || campaign.sms_cost || 0) }}
                      </p>
                    </div>

                    <div>
                      <label class="text-sm text-gray-600 font-medium">SMS Charged</label>
                      <p class="text-gray-900 mt-1 text-sm">
                        {{ campaign.sms_charged || campaign.actual_credits_used || 0 }} credits
                      </p>
                    </div>

                    <div>
                      <label class="text-sm text-gray-600 font-medium">Payment Status</label>
                      <p class="text-gray-900 mt-1 text-sm">
                        <span :class="[
                          'px-2 py-1 rounded-full text-xs font-medium',
                          campaign.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          campaign.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        ]">
                          {{ campaign.payment_status || 'pending' }}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label class="text-sm text-gray-600 font-medium">Created</label>
                      <p class="text-gray-900 mt-1 text-sm">{{ formatDate(campaign.created_at) }}</p>
                    </div>

                    <div v-if="campaign.started_at">
                      <label class="text-sm text-gray-600 font-medium">Started</label>
                      <p class="text-gray-900 mt-1 text-sm">{{ formatDate(campaign.started_at) }}</p>
                    </div>

                    <div v-if="campaign.completed_at">
                      <label class="text-sm text-gray-600 font-medium">Completed</label>
                      <p class="text-gray-900 mt-1 text-sm">{{ formatDate(campaign.completed_at) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Campaign Execution Timeline (from logs) -->
              <div v-if="campaignLogs.length > 0" class="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Campaign Timeline</h3>
                <div class="space-y-3 max-h-48 overflow-y-auto">
                  <div
                    v-for="log in campaignLogs"
                    :key="log.id"
                    class="flex gap-3 p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div :class="[
                      'flex-shrink-0 w-2 h-2 rounded-full mt-1.5',
                      log.log_type === 'error' ? 'bg-red-600' :
                      log.log_type === 'warning' ? 'bg-yellow-600' :
                      log.log_type === 'success' ? 'bg-green-600' :
                      'cs-btn'
                    ]"></div>
                    <div class="flex-1">
                      <p class="text-sm text-gray-900">{{ humanizeLogMessage(log.message) }}</p>
                      <p class="text-xs text-gray-500 mt-1">{{ formatDate(log.created_at) }}</p>
                      <div v-if="formatTimelineChips(log.metadata).length > 0" class="flex flex-wrap gap-1.5 mt-2">
                        <span
                          v-for="chip in formatTimelineChips(log.metadata)"
                          :key="chip.label"
                          class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                        >
                          <span class="text-gray-400">{{ chip.label }}</span>
                          <span class="text-gray-700 font-medium">{{ chip.value }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Message Logs -->
              <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-900">Message Logs</h3>
                  <button
                    @click="refreshLogs"
                    :disabled="loadingLogs"
                    class="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                  >
                    <ArrowPathIcon :class="loadingLogs ? 'animate-spin' : ''" class="h-4 w-4" />
                    Refresh
                  </button>
                </div>

                <!-- Logs Loading -->
                <div v-if="loadingLogs" class="text-center py-8">
                  <ArrowPathIcon class="h-8 w-8 animate-spin mx-auto mb-2 cs-text" />
                  <p class="text-gray-600 text-sm">Loading logs...</p>
                </div>

                <!-- Logs Table -->
                <div v-else-if="recipientLogs.length > 0" class="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-600">Log Type</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-600">Message</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-600">Sent At</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-600">Details</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr v-for="log in recipientLogs" :key="log.id" class="hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <span
                            :class="[
                              'px-2 py-1 rounded-full text-xs font-medium',
                              log.log_type === 'error' ? 'bg-red-100 text-red-800' :
                              log.log_type === 'success' ? 'bg-green-100 text-green-800' :
                              log.log_type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'cs-badge'
                            ]"
                          >
                            {{ log.log_type }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-gray-900 text-sm">{{ log.message }}</td>
                        <td class="px-4 py-2 text-gray-900">
                          {{ log.created_at ? formatDate(log.created_at) : '-' }}
                        </td>
                        <td class="px-4 py-2 text-gray-600 text-xs">
                          <div v-if="formatMessageLogDetails(log.metadata).length > 0" class="space-y-1">
                            <div
                              v-for="item in formatMessageLogDetails(log.metadata)"
                              :key="item.label"
                              class="flex items-center gap-1"
                            >
                              <span class="text-gray-400">{{ item.label }}:</span>
                              <span class="text-gray-700 font-medium">{{ item.value }}</span>
                            </div>
                          </div>
                          <span v-else class="text-gray-500">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- No Logs -->
                <div v-else class="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <DocumentTextIcon class="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p class="text-gray-600 text-sm">No message logs yet</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div class="flex items-center justify-between">
              <div v-if="campaign" class="flex items-center gap-3">
                <button
                  v-if="['draft', 'paused'].includes(campaign.status)"
                  @click="$emit('edit', campaign.id)"
                  class="px-4 py-2 cs-btn text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <PencilIcon class="h-4 w-4" />
                  Edit Campaign
                </button>

                <button
                  v-if="campaign.status === 'draft'"
                  @click="$emit('start', campaign.id)"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <PlayIcon class="h-4 w-4" />
                  Start Campaign
                </button>

                <button
                  v-if="campaign.status === 'sending'"
                  @click="$emit('pause', campaign.id)"
                  class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <PauseIcon class="h-4 w-4" />
                  Pause
                </button>

                <button
                  v-if="campaign.status === 'paused'"
                  @click="$emit('resume', campaign.id)"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <PlayIcon class="h-4 w-4" />
                  Resume
                </button>

                <button
                  v-if="['draft', 'sending', 'paused'].includes(campaign.status)"
                  @click="$emit('cancel', campaign.id)"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <XMarkIcon class="h-4 w-4" />
                  Cancel
                </button>

                <button
                  v-if="['draft', 'cancelled', 'completed'].includes(campaign.status)"
                  @click="$emit('delete', campaign.id)"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <TrashIcon class="h-4 w-4" />
                  Delete
                </button>
              </div>
              <div class="flex-1"></div>
              <button
                @click="close"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { XMarkIcon, ArrowPathIcon, UsersIcon, CheckCircleIcon, ClockIcon, XCircleIcon, PlayIcon, PauseIcon, DocumentTextIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'

// TODO: remove once composables/ are .ts
const props = defineProps<{
  isOpen: boolean
  campaignId?: number | null
}>()

const emit = defineEmits<{
  close: []
  start: [id: number]
  pause: [id: number]
  resume: [id: number]
  cancel: [id: number]
  delete: [id: number]
  edit: [id: number]
}>()

interface CampaignLog {
  id: number
  log_type: string
  message: string
  created_at: string
  recipient_id?: number | null
  metadata?: unknown
}

interface CampaignStats {
  total_recipients?: number
  messages_sent?: number
  messages_delivered?: number
  messages_failed?: number
  [key: string]: unknown
}

interface CampaignDetail {
  id: number
  name?: string
  status: string
  message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  actual_cost?: number
  sms_cost?: number
  sms_charged?: number
  actual_credits_used?: number
  payment_status?: string
  total_recipients?: number
  messages_sent?: number
  messages_delivered?: number
  messages_failed?: number
  [key: string]: unknown
}

const {
  campaigns,
  fetchCampaign,
  fetchCampaignStats,
  fetchCampaignLogs,
} = useSMSCampaigns()

const campaign = ref<CampaignDetail | null>(null)
const stats = ref<CampaignStats | null>(null)
const logs = ref<CampaignLog[]>([])
const loading = ref(false)
const loadingStats = ref(false)
const loadingLogs = ref(false)

const campaignLogs = computed<CampaignLog[]>(() =>
  logs.value
    .filter((log) => !log.recipient_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)

const recipientLogs = computed<CampaignLog[]>(() =>
  logs.value
    .filter((log) => log.recipient_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)

watch(
  () => props.campaignId,
  async (newId) => {
    if (newId && props.isOpen) await loadCampaignDetails()
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.campaignId) await loadCampaignDetails()
  },
)

const loadCampaignDetails = async (): Promise<void> => {
  if (!props.campaignId) return
  loading.value = true
  try {
    // campaigns is untyped (composable not yet .ts)
    campaign.value = (campaigns.value as CampaignDetail[]).find((c) => c.id === props.campaignId) ?? null

    if (!campaign.value) {
      try {
        campaign.value = await fetchCampaign(props.campaignId) as CampaignDetail
      } catch (fetchErr) {
        console.error('Error fetching campaign:', fetchErr)
        campaign.value = null
      }
    }

    await Promise.allSettled([loadStats(), loadLogs()])
  } catch (err) {
    console.error('Failed to load campaign details:', err)
  } finally {
    loading.value = false
  }
}

const loadStats = async (): Promise<void> => {
  loadingStats.value = true
  try {
    const response = await fetchCampaignStats(props.campaignId ?? '') as { data?: CampaignStats }
    stats.value = response?.data ?? {}
  } catch (err) {
    console.error('Failed to load stats:', err)
    stats.value = {}
  } finally {
    loadingStats.value = false
  }
}

const loadLogs = async (): Promise<void> => {
  loadingLogs.value = true
  try {
    const response = await fetchCampaignLogs(props.campaignId ?? '') as { data?: CampaignLog[] } | CampaignLog[]
    logs.value = (Array.isArray(response) ? response : response?.data) ?? []
  } catch (err) {
    console.error('Failed to load logs:', err)
    logs.value = []
  } finally {
    loadingLogs.value = false
  }
}

const refreshLogs = async (): Promise<void> => loadLogs()

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCurrency = (value: number | null | undefined): string => {
  const num = parseFloat(String(value ?? 0)) || 0
  return num.toFixed(2)
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sending: 'cs-badge',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  }
  return classes[status] ?? 'bg-gray-100 text-gray-800'
}

// ── Human-readable rendering helpers ──────────────────────────────────────────

/** Warm up the raw log message text that arrives from the backend. */
const humanizeLogMessage = (message: string): string =>
  message
    // "1 recipients" / "N recipients" → "1 contact" / "N contacts"
    .replace(/(\d+)\s+recipients?/gi, (_, n) =>
      `${n} ${Number(n) === 1 ? 'contact' : 'contacts'}`,
    )
    // "(Est. cost: 0.05)" → "· approx. 0.05 credits"
    .replace(/\(\s*Est\.\s*cost:\s*([\d.]+)\s*\)/gi, (_, c) => `· approx. ${c} credits`)
    // bare "Est. cost: 0.05" without parens
    .replace(/Est\.\s*cost:\s*([\d.]+)/gi, (_, c) => `Approx. ${c} credits`)

type Chip = { label: string; value: string }

/** Parse campaign-level log metadata into labelled chips. Returns [] for unknown shapes. */
const formatTimelineChips = (metadata: unknown): Chip[] => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return []
  const m = metadata as Record<string, unknown>
  const chips: Chip[] = []

  const providerLabels: Record<string, string> = {
    auto: 'Automatic', nalo: 'Nalo', mnotify: 'MNotify', twilio: 'Twilio',
  }
  if (m.sms_provider != null)
    chips.push({ label: 'Provider', value: providerLabels[String(m.sms_provider)] ?? String(m.sms_provider) })

  const recipientTypeLabels: Record<string, string> = {
    custom: 'Custom list', all: 'All customers',
    registered: 'Registered customers', segment: 'Segment',
  }
  if (m.recipient_type != null)
    chips.push({ label: 'List type', value: recipientTypeLabels[String(m.recipient_type)] ?? String(m.recipient_type) })

  if (m.estimated_credits != null) {
    const n = Number(m.estimated_credits)
    chips.push({ label: 'Est. credits', value: `${n} ${n === 1 ? 'credit' : 'credits'}` })
  }

  if (m.estimated_cost != null && m.estimated_credits == null)
    chips.push({ label: 'Est. cost', value: `${Number(m.estimated_cost).toFixed(2)} credits` })

  if (m.actual_credits != null) {
    const n = Number(m.actual_credits)
    chips.push({ label: 'Credits used', value: `${n} ${n === 1 ? 'credit' : 'credits'}` })
  }

  if (m.actual_cost != null)
    chips.push({ label: 'Actual cost', value: `GHS ${Number(m.actual_cost).toFixed(2)}` })

  return chips
}

/** Parse recipient-level log metadata into key-value rows. Returns [] for unknown shapes. */
const formatMessageLogDetails = (metadata: unknown): Chip[] => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return []
  const m = metadata as Record<string, unknown>
  const items: Chip[] = []

  const providerLabels: Record<string, string> = {
    nalo: 'Nalo', mnotify: 'MNotify', twilio: 'Twilio', auto: 'Automatic',
  }
  if (m.provider != null)
    items.push({ label: 'Via', value: providerLabels[String(m.provider)] ?? String(m.provider) })

  const billingLabels: Record<string, string> = {
    charge_before_send: 'Charged upfront',
    charge_after_send: 'Charged on delivery',
    postpaid: 'Postpaid',
  }
  if (m.billing_model != null)
    items.push({ label: 'Billing', value: billingLabels[String(m.billing_model)] ?? String(m.billing_model) })

  if (m.transaction_id != null)
    items.push({ label: 'Txn', value: `#${m.transaction_id}` })

  if (m.messageId != null)
    items.push({ label: 'Msg ID', value: String(m.messageId) })

  return items
}

const close = (): void => emit('close')
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div > div,
.modal-leave-active > div > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div > div,
.modal-leave-to > div > div {
  transform: scale(0.95);
}
</style>
