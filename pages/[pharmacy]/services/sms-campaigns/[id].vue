<template>
  <div class="campaign-details-page">
    <!-- Header with back button -->
    <div class="mb-6">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <Icon name="ArrowLeft" class="h-5 w-5" />
        Back to Campaigns
      </button>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ campaign?.name || 'Loading...' }}</h1>
          <p class="text-gray-600 mt-1">Campaign Details & Statistics</p>
        </div>
        <div v-if="campaign" class="flex items-center gap-3">
          <!-- Status Badge -->
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              getStatusClass(campaign.status)
            ]"
          >
            {{ campaign.status }}
          </span>

          <!-- Action Buttons -->
          <button
            v-if="campaign.status === 'draft'"
            @click="startCampaign"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="Play" class="h-4 w-4" />
            Start Campaign
          </button>

          <button
            v-if="campaign.status === 'sending'"
            @click="pauseCampaign"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <Icon name="Pause" class="h-4 w-4" />
            Pause
          </button>

          <button
            v-if="campaign.status === 'paused'"
            @click="resumeCampaign"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Icon name="Play" class="h-4 w-4" />
            Resume
          </button>

          <button
            v-if="['draft', 'sending', 'paused'].includes(campaign.status)"
            @click="cancelCampaign"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Icon name="X" class="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <Icon name="Loader2" class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p class="text-gray-600">Loading campaign details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <Icon name="AlertCircle" class="h-12 w-12 mx-auto mb-4 text-red-600" />
      <h3 class="text-xl font-semibold text-red-900 mb-2">Failed to load campaign</h3>
      <p class="text-red-600 mb-4">{{ error }}</p>
      <button
        @click="loadCampaign"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Campaign Content -->
    <div v-else-if="campaign" class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-lg border border-gray-200">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-3 rounded-lg">
              <Icon name="Users" class="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Total Recipients</p>
              <p class="text-2xl font-bold text-gray-900">{{ campaign.total_recipients || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg border border-gray-200">
          <div class="flex items-center gap-3">
            <div class="bg-green-100 p-3 rounded-lg">
              <Icon name="CheckCircle" class="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Sent</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats?.sent || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg border border-gray-200">
          <div class="flex items-center gap-3">
            <div class="bg-yellow-100 p-3 rounded-lg">
              <Icon name="Clock" class="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Pending</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats?.pending || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg border border-gray-200">
          <div class="flex items-center gap-3">
            <div class="bg-red-100 p-3 rounded-lg">
              <Icon name="XCircle" class="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p class="text-sm text-gray-600">Failed</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats?.failed || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Campaign Info -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Campaign Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="text-sm text-gray-600">Message</label>
            <p class="text-gray-900 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
              {{ campaign.message }}
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm text-gray-600">SMS Provider</label>
              <p class="text-gray-900 mt-1">{{ campaign.sms_provider }}</p>
            </div>

            <div>
              <label class="text-sm text-gray-600">Sender ID</label>
              <p class="text-gray-900 mt-1">{{ campaign.sender_id || 'Default' }}</p>
            </div>

            <div>
              <label class="text-sm text-gray-600">Created</label>
              <p class="text-gray-900 mt-1">{{ formatDate(campaign.created_at) }}</p>
            </div>

            <div v-if="campaign.started_at">
              <label class="text-sm text-gray-600">Started</label>
              <p class="text-gray-900 mt-1">{{ formatDate(campaign.started_at) }}</p>
            </div>

            <div v-if="campaign.completed_at">
              <label class="text-sm text-gray-600">Completed</label>
              <p class="text-gray-900 mt-1">{{ formatDate(campaign.completed_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Logs -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Message Logs</h2>
          <button
            @click="refreshLogs"
            :disabled="loadingLogs"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Icon :name="loadingLogs ? 'Loader2' : 'RefreshCw'" :class="loadingLogs ? 'animate-spin' : ''" class="h-4 w-4" />
            Refresh
          </button>
        </div>

        <!-- Logs Loading -->
        <div v-if="loadingLogs" class="text-center py-8">
          <Icon name="Loader2" class="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p class="text-gray-600">Loading logs...</p>
        </div>

        <!-- Logs Table -->
        <div v-else-if="logs.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone Number</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Sent At</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Billing Status</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">{{ log.phone_number }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      log.status === 'sent' ? 'bg-green-100 text-green-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ log.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ log.sent_at ? formatDate(log.sent_at) : '-' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    v-if="log.billing_status"
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      log.billing_status === 'billed' ? 'bg-blue-100 text-blue-800' :
                      log.billing_status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ log.billing_status }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-3 text-sm text-red-600">
                  {{ log.error_message || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- No Logs -->
        <div v-else class="text-center py-8">
          <Icon name="FileText" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p class="text-gray-600">No message logs yet</p>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      :error="confirmDialog.error"
      @confirm="handleConfirm"
      @close="closeConfirmDialog"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import ConfirmDialog from '~/components/sms/shared/ConfirmDialog.vue'

// Define page metadata
definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'Campaign Details'
})

const route = useRoute()
const router = useRouter()

const {
  campaigns,
  loading,
  error,
  fetchCampaigns,
  getCampaignStats,
  getCampaignLogs,
  startCampaign: startCampaignAction,
  pauseCampaign: pauseCampaignAction,
  resumeCampaign: resumeCampaignAction,
  cancelCampaign: cancelCampaignAction
} = useSMSCampaigns()

const campaign = ref(null)
const stats = ref(null)
const logs = ref([])
const loadingLogs = ref(false)

const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'warning',
  loading: false,
  action: null,
  error: null
})

// Load campaign data
const loadCampaign = async () => {
  try {
    await fetchCampaigns()
    campaign.value = campaigns.value.find(c => c.id === parseInt(route.params.id))
    
    if (!campaign.value) {
      error.value = 'Campaign not found'
      return
    }

    // Load stats and logs
    await Promise.all([
      loadStats(),
      loadLogs()
    ])
  } catch (err) {
    console.error('Failed to load campaign:', err)
  }
}

// Load campaign stats
const loadStats = async () => {
  try {
    stats.value = await getCampaignStats(route.params.id)
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

// Load campaign logs
const loadLogs = async () => {
  loadingLogs.value = true
  try {
    logs.value = await getCampaignLogs(route.params.id)
  } catch (err) {
    console.error('Failed to load logs:', err)
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

// Go back to campaigns list
const goBack = () => {
  router.push(`/${route.params.pharmacy}/services/sms-campaigns`)
}

// Start campaign
const startCampaign = () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Start Campaign?',
    message: `Are you sure you want to start "${campaign.value.name}"? SMS messages will be sent to ${campaign.value.total_recipients || 0} recipients.`,
    type: 'info',
    loading: false,
    action: 'start'
  }
}

// Pause campaign
const pauseCampaign = () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Pause Campaign?',
    message: `Are you sure you want to pause "${campaign.value.name}"?`,
    type: 'warning',
    loading: false,
    action: 'pause'
  }
}

// Resume campaign
const resumeCampaign = () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Resume Campaign?',
    message: `Resume sending SMS for "${campaign.value.name}"?`,
    type: 'info',
    loading: false,
    action: 'resume'
  }
}

// Cancel campaign
const cancelCampaign = () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Cancel Campaign?',
    message: `Are you sure you want to cancel "${campaign.value.name}"? This action cannot be undone.`,
    type: 'error',
    loading: false,
    action: 'cancel'
  }
}

// Handle confirmation
const handleConfirm = async () => {
  confirmDialog.value.loading = true
  confirmDialog.value.error = null

  try {
    const { action } = confirmDialog.value
    const campaignId = campaign.value.id

    if (action === 'start') {
      await startCampaignAction(campaignId)
    } else if (action === 'pause') {
      await pauseCampaignAction(campaignId)
    } else if (action === 'resume') {
      await resumeCampaignAction(campaignId)
    } else if (action === 'cancel') {
      await cancelCampaignAction(campaignId)
    }

    closeConfirmDialog()
    await loadCampaign()
  } catch (err) {
    console.error('Action failed:', err)
    confirmDialog.value.error = err.message
    confirmDialog.value.loading = false
  }
}

// Close confirm dialog
const closeConfirmDialog = () => {
  confirmDialog.value = {
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    loading: false,
    action: null,
    error: null
  }
}

// Load data on mount
onMounted(async () => {
  await loadCampaign()
})
</script>

<style scoped>
.campaign-details-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
