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
                  class="text-gray-400 hover:text-gray-600 transition-colors"
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
              <ArrowPathIcon class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p class="text-gray-600">Loading campaign details...</p>
            </div>

            <!-- Campaign Content -->
            <div v-else-if="campaign" class="space-y-6">
              <!-- Stats Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-blue-100 p-2 rounded-lg">
                      <UsersIcon class="h-5 w-5 text-blue-600" />
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
                      <p class="text-xl font-bold text-gray-900">{{ stats?.messages_sent || stats?.sent || 0 }}</p>
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
                      <p class="text-xl font-bold text-gray-900">{{ stats?.messages_delivered || 0 }}</p>
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
                      <p class="text-xl font-bold text-gray-900">{{ stats?.messages_failed || 0 }}</p>
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
                      <label class="text-sm text-gray-600 font-medium">SMS Provider</label>
                      <p class="text-gray-900 mt-1 text-sm">{{ campaign.sms_provider }}</p>
                    </div>

                    <div>
                      <label class="text-sm text-gray-600 font-medium">Sender ID</label>
                      <p class="text-gray-900 mt-1 text-sm">{{ campaign.sender_id || 'Default' }}</p>
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
                      'bg-blue-600'
                    ]"></div>
                    <div class="flex-1">
                      <p class="text-sm text-gray-900">{{ log.message }}</p>
                      <p class="text-xs text-gray-500 mt-1">{{ formatDate(log.created_at) }}</p>
                      <p v-if="log.metadata" class="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-1 rounded">
                        {{ JSON.stringify(log.metadata, null, 2) }}
                      </p>
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
                  <ArrowPathIcon class="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
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
                              'bg-blue-100 text-blue-800'
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
                          <div v-if="log.metadata" class="font-mono bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                            {{ JSON.stringify(log.metadata, null, 2) }}
                          </div>
                          <span v-else class="text-gray-400">-</span>
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
                  v-if="campaign.status === 'draft'"
                  @click="$emit('start', campaign.id)"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
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

<script setup>
import { ref, watch, computed } from 'vue'
import { XMarkIcon, ArrowPathIcon, UsersIcon, CheckCircleIcon, ClockIcon, XCircleIcon, PlayIcon, PauseIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  campaignId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'start', 'pause', 'resume', 'cancel'])

const {
  campaigns,
  fetchCampaign,
  fetchCampaignStats,
  fetchCampaignLogs
} = useSMSCampaigns()

const campaign = ref(null)
const stats = ref(null)
const logs = ref([])
const loading = ref(false)
const loadingStats = ref(false)
const loadingLogs = ref(false)

// Computed: Campaign logs (only logs without recipient_id)
const campaignLogs = computed(() => {
  return logs.value.filter(log => !log.recipient_id).sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

// Computed: Recipient logs (only logs with recipient_id)
const recipientLogs = computed(() => {
  return logs.value.filter(log => log.recipient_id).sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

// Watch for campaign ID changes
watch(() => props.campaignId, async (newId) => {
  if (newId && props.isOpen) {
    await loadCampaignDetails()
  }
}, { immediate: true })

// Watch for modal open
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.campaignId) {
    await loadCampaignDetails()
  }
})

// Load campaign details
const loadCampaignDetails = async () => {
  if (!props.campaignId) {
    return
  }
  
  loading.value = true
  
  try {
    // Try to find campaign in existing list first
    campaign.value = campaigns.value.find(c => c.id === props.campaignId)
    
    // If not found in list, fetch it directly
    if (!campaign.value) {
      try {
        const response = await fetchCampaign(props.campaignId)
        campaign.value = response?.data || response?.campaign || response
      } catch (fetchErr) {
        console.error('Error fetching campaign:', fetchErr)
        campaign.value = null
      }
    }
    
    // Load stats and logs in parallel
    await Promise.allSettled([
      loadStats(),
      loadLogs()
    ])
  } catch (err) {
    console.error('Failed to load campaign details:', err)
  } finally {
    loading.value = false
  }
}

// Load campaign stats
const loadStats = async () => {
  loadingStats.value = true
  try {
    const response = await fetchCampaignStats(props.campaignId)
    stats.value = response?.data || response || {}
  } catch (err) {
    console.error('Failed to load stats:', err)
    stats.value = {}
  } finally {
    loadingStats.value = false
  }
}

// Load campaign logs
const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const response = await fetchCampaignLogs(props.campaignId)
    logs.value = response?.data || response || []
  } catch (err) {
    console.error('Failed to load logs:', err)
    logs.value = []
  } finally {
    loadingLogs.value = false
  }
}

// Refresh logs
const refreshLogs = async () => {
  await loadLogs()
}

// Format date
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get status class
const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    sending: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Close modal
const close = () => {
  emit('close')
}
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
