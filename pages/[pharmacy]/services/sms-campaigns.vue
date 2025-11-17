<template>
  <div class="sms-campaigns-page">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">SMS Campaigns</h1>
          <p class="text-gray-600 mt-1">Create and manage your SMS marketing campaigns</p>
        </div>
        <nuxt-link
          :to="`/${companyDomain.value}/services/sms-create-campaign`"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <PlusIcon class="h-5 w-5" />
          Create Campaign
        </nuxt-link>
      </div>

      <!-- Balance Card -->
      <BalanceCard
        :balance-data="balance"
        :show-actions="true"
        :show-top-up="false"
        @refresh="fetchBalance"
      />
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="bg-blue-100 p-3 rounded-lg">
            <InboxIcon class="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Campaigns</p>
            <p class="text-2xl font-bold text-gray-900">{{ campaigns.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="bg-green-100 p-3 rounded-lg">
            <CheckCircleIcon class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Completed</p>
            <p class="text-2xl font-bold text-gray-900">{{ completedCampaigns.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="bg-yellow-100 p-3 rounded-lg">
            <SparklesIcon class="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Active</p>
            <p class="text-2xl font-bold text-gray-900">{{ activeCampaigns.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="bg-gray-100 p-3 rounded-lg">
            <DocumentTextIcon class="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Drafts</p>
            <p class="text-2xl font-bold text-gray-900">{{ draftCampaigns.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Failed Campaigns Alert (if any) -->
    <!-- <div v-if="failedCampaigns.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
      <XMarkIcon class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <h3 class="text-sm font-semibold text-red-900 mb-1">
          {{ failedCampaigns.length }} Campaign{{ failedCampaigns.length > 1 ? 's' : '' }} Failed
        </h3>
        <p class="text-sm text-red-700 mb-2">
          Some campaigns have failed messages. You can resend them from the campaign actions menu.
        </p>
        <button
          @click="filters.status = 'failed'; applyFilters()"
          class="text-sm font-medium text-red-700 hover:text-red-800 underline"
        >
          View Failed Campaigns
        </button>
      </div>
    </div> -->

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div class="flex items-center gap-4 flex-wrap">
        <div>
          <label class="text-sm text-gray-600 mb-1 block">Status</label>
          <select
            v-model="filters.status"
            @change="applyFilters"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- <div>
          <label class="text-sm text-gray-600 mb-1 block">Provider</label>
          <select
            v-model="filters.provider"
            @change="applyFilters"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Providers</option>
            <option value="nalo">Nalo Solutions</option>
            <option value="mnotify">MNotify</option>
          </select>
        </div> -->

        <div class="flex-1"></div>

        <!-- Show Archived Toggle -->
        <button
          @click="toggleShowArchived"
          class="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
          :class="showArchived 
            ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'"
        >
          <ArchiveBoxIcon class="h-4 w-4" />
          {{ showArchived ? 'Hide' : 'Show' }} Archived ({{ archivedCampaigns.length }})
        </button>

        <button
          @click="refreshCampaigns"
          :disabled="loading"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <ArrowPathIcon :class="loading ? 'animate-spin' : ''" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && campaigns.length === 0" class="text-center py-12">
      <ArrowPathIcon class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p class="text-gray-600">Loading campaigns...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && filteredCampaigns.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <InboxIcon class="h-16 w-16 mx-auto mb-4 text-gray-400" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
      <p class="text-gray-600 mb-6">
        {{ campaigns.length === 0 ? 'Get started by creating your first SMS campaign' : 'No campaigns match your filters' }}
      </p>
      <nuxt-link
        v-if="campaigns.length === 0"
        :to="`/${companyDomain.value}/services/sms-create-campaign`"
        class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <PlusIcon class="h-5 w-5" />
        Create Your First Campaign
      </nuxt-link>
      <button
        v-else
        @click="clearFilters"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        <XMarkIcon class="h-5 w-5" />
        Clear Filters
      </button>
    </div>

    <!-- Campaigns Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CampaignCard
        v-for="campaign in filteredCampaigns"
        :key="campaign.id"
        :campaign="campaign"
        @view="viewCampaign"
        @start="startCampaign"
        @pause="pauseCampaign"
        @resume="resumeCampaign"
        @cancel="cancelCampaign"
        @archive="archiveCampaign"
        @restore="restoreCampaign"
        @delete="deleteCampaign"
        @reuse="openReuseCampaignModal"
        @resend="openResendCampaignModal"
        @update="updateCampaign"
        @completed="handleCampaignCompleted"
        @status-changed="handleCampaignStatusChanged"
      />
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      :error="confirmDialog.error"
      :can-retry="confirmDialog.canRetry"
      :is-retrying="confirmDialog.isRetrying"
      @confirm="handleConfirm"
      @retry="retryFailedAction"
      @close="closeConfirmDialog"
    />

    <!-- Campaign Details Modal -->
    <CampaignDetailsModal
      :is-open="showDetailsModal"
      :campaign-id="selectedCampaignId"
      @close="closeDetailsModal"
      @start="startCampaign"
      @pause="pauseCampaign"
      @resume="resumeCampaign"
      @cancel="cancelCampaign"
      @delete="deleteCampaign"
    />

    <!-- Test SMS Modal -->
    <TestSmsModal
      :is-open="showTestModal"
      @close="showTestModal = false"
    />

    <!-- Reuse Campaign Modal -->
    <div v-if="showReuseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Reuse Campaign</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Original Campaign</label>
              <p class="text-gray-600">{{ reuseFormData.campaignName }}</p>
            </div>
            
            <div>
              <label for="newCampaignName" class="block text-sm font-medium text-gray-700 mb-2">New Campaign Name</label>
              <input
                id="newCampaignName"
                v-model="reuseFormData.newName"
                type="text"
                placeholder="Enter campaign name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <p class="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              ℹ️ A copy of this campaign will be created as a draft. You can edit it before sending.
            </p>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            @click="showReuseModal = false"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            @click="handleReuseSubmit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Reuse Campaign
          </button>
        </div>
      </div>
    </div>

    <!-- Resend Campaign Modal -->
    <div v-if="showResendModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Resend Campaign</h2>
          
          <div class="space-y-4">
            <!-- Campaign Info -->
            <div class="bg-blue-50 p-4 rounded border border-blue-200">
              <p class="text-sm text-blue-900 font-medium mb-2">
                {{ campaigns.find(c => c.id === resendFormData.campaignId)?.name }}
              </p>
              <div class="grid grid-cols-2 gap-2 text-xs text-blue-800">
                <div>
                  <span class="font-medium">Total Recipients:</span>
                  <span class="ml-1">{{ campaigns.find(c => c.id === resendFormData.campaignId)?.total_recipients || 0 }}</span>
                </div>
                <div>
                  <span class="font-medium">Sent:</span>
                  <span class="ml-1">{{ campaigns.find(c => c.id === resendFormData.campaignId)?.messages_sent || 0 }}</span>
                </div>
                <div v-if="campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed > 0" class="col-span-2">
                  <span class="font-medium text-red-700">Failed Messages:</span>
                  <span class="ml-1 text-red-700">{{ campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded border border-yellow-200">
              <p class="text-sm text-yellow-800">
                ⚠️ This will reset selected recipients to "pending" status and resend SMS messages.
              </p>
            </div>

            <div class="space-y-3">
              <label class="flex items-start gap-3 cursor-pointer p-3 rounded border-2 transition-all hover:bg-gray-50"
                     :class="!resendFormData.toFailedOnly ? 'border-blue-500 bg-blue-50' : 'border-gray-200'">
                <input
                  v-model="resendFormData.toFailedOnly"
                  :value="false"
                  type="radio"
                  class="w-4 h-4 text-blue-600 mt-0.5"
                />
                <div class="flex-1">
                  <span class="text-gray-900 font-medium">Resend to all recipients</span>
                  <p class="text-xs text-gray-600 mt-1">Send SMS to all {{ campaigns.find(c => c.id === resendFormData.campaignId)?.total_recipients || 0 }} recipients again</p>
                </div>
              </label>
              
              <label class="flex items-start gap-3 cursor-pointer p-3 rounded border-2 transition-all hover:bg-gray-50"
                     :class="resendFormData.toFailedOnly ? 'border-orange-500 bg-orange-50' : 'border-gray-200'">
                <input
                  v-model="resendFormData.toFailedOnly"
                  :value="true"
                  type="radio"
                  class="w-4 h-4 text-orange-600 mt-0.5"
                />
                <div class="flex-1">
                  <span class="text-gray-900 font-medium">Resend to failed recipients only</span>
                  <p class="text-xs text-gray-600 mt-1">
                    Only resend to {{ campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed || 0 }} failed recipient(s)
                    <span v-if="!(campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed > 0)" class="text-yellow-700 font-medium">
                      (No failed messages)
                    </span>
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            @click="showResendModal = false"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            @click="handleResendSubmit"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2"
          >
            <PaperAirplaneIcon class="h-4 w-4" />
            Confirm Resend
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  PlusIcon, 
  InboxIcon, 
  CheckCircleIcon, 
  SparklesIcon, 
  DocumentTextIcon, 
  ArrowPathIcon, 
  XMarkIcon,
  ArchiveBoxIcon,
  PaperAirplaneIcon
} from '@heroicons/vue/20/solid'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import { useSMSBilling } from '~/composables/useSMSBilling'
import CampaignCard from '~/components/sms/campaign/CampaignCard.vue'
import CampaignDetailsModal from '~/components/sms/campaign/CampaignDetailsModal.vue'
import BalanceCard from '~/components/sms/billing/BalanceCard.vue'
import ConfirmDialog from '~/components/sms/shared/ConfirmDialog.vue'
import TestSmsModal from '~/components/sms/shared/TestSmsModal.vue'

// Define page metadata
definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'SMS Campaigns'
})

// Get route
const route = useRoute()

const {
  campaigns,
  loading,
  error,
  fetchCampaigns,
  startCampaign: startCampaignAction,
  pauseCampaign: pauseCampaignAction,
  resumeCampaign: resumeCampaignAction,
  cancelCampaign: cancelCampaignAction,
  archiveCampaign: archiveCampaignAction,
  restoreCampaign: restoreCampaignAction,
  deleteCampaign: deleteCampaignAction,
  activeCampaigns,
  completedCampaigns,
  draftCampaigns,
  retryAction,
  getRetryAttempts,
  updateCampaign: updateCampaignAction,
  reuseCampaign: reuseCampaignAction,
  resendCampaign: resendCampaignAction
} = useSMSCampaigns()

const { balance, fetchBalance } = useSMSBilling()

const filters = ref({
  status: '',
  provider: ''
})

const showArchived = ref(false)
const showTestModal = ref(false)
const showDetailsModal = ref(false)
const selectedCampaignId = ref(null)

const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'warning',
  loading: false,
  action: null,
  campaignId: null,
  error: null,
  canRetry: false,
  isRetrying: false
})

// State for reuse/resend modals
const showReuseModal = ref(false)
const showResendModal = ref(false)
const reuseFormData = ref({
  campaignId: null,
  campaignName: '',
  newName: ''
})
const resendFormData = ref({
  campaignId: null,
  toFailedOnly: false
})

// Filtered campaigns based on filters
const filteredCampaigns = computed(() => {
  let filtered = [...campaigns.value]

  // Filter out archived campaigns by default unless showArchived is true or archived filter is selected
  if (!showArchived.value && filters.value.status !== 'archived') {
    filtered = filtered.filter(c => c.status !== 'archived')
  }

  if (filters.value.status) {
    filtered = filtered.filter(c => c.status === filters.value.status)
  }

  if (filters.value.provider) {
    filtered = filtered.filter(c => c.sms_provider === filters.value.provider)
  }

  return filtered
})

// Archived campaigns count
const archivedCampaigns = computed(() => {
  return campaigns.value.filter(c => c.status === 'archived')
})

// Failed campaigns count (status is 'failed' or has failed messages)
const failedCampaigns = computed(() => {
  return campaigns.value.filter(c => 
    c.status === 'failed' || (c.messages_failed > 0 && c.status !== 'archived')
  )
})

// Load data on mount
let pollingInterval = null

onMounted(async () => {
  await Promise.all([
    fetchCampaigns(),
    fetchBalance()
  ])
  
  // Start polling for active campaigns (every 10 seconds)
  startCampaignPolling()
})

onUnmounted(() => {
  // Clean up polling when component is destroyed
  stopCampaignPolling()
})

// Polling mechanism for active campaigns
const startCampaignPolling = () => {
  pollingInterval = setInterval(async () => {
    // Only poll if there are active campaigns (sending or paused)
    const hasActiveCampaigns = campaigns.value.some(c => 
      c.status === 'sending' || c.status === 'paused'
    )
    
    if (hasActiveCampaigns && !loading.value) {
      // Silent refresh - don't show loading state
      try {
        await fetchCampaigns(filters.value.status ? { status: filters.value.status } : {})
      } catch (err) {
        console.error('Polling error:', err)
      }
    }
  }, 10000) // Poll every 10 seconds
}

const stopCampaignPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// Handle campaign completion notification
const handleCampaignCompleted = async (campaign) => {
  
  // Show toast notification
  showSuccessToast(`Campaign "${campaign.name}" completed successfully!`)
  
  // Refresh balance (credits may have been used)
  await fetchBalance()
  
  // Optionally refresh campaigns to get updated stats
  await refreshCampaigns()
}

// Handle campaign status changes
const handleCampaignStatusChanged = (event) => {
  
  // If campaign is no longer active, we can reduce polling frequency
  const hasActiveCampaigns = campaigns.value.some(c => 
    c.status === 'sending' || c.status === 'paused'
  )
  
  if (!hasActiveCampaigns) {
    // Optionally reduce polling or stop it
    // For now, we'll keep polling in case new campaigns are started
  }
}

// Toast notification helper (you can implement your own toast system)
const showSuccessToast = (message) => {
  // This is a simple implementation - you can replace with your toast library
  if (process.client) {
    alert(message)
    // Or use a toast library like vue-toastification
  }
}

const companyDomain = computed(() => {
  const pathMatch = route.path.match(/\/([^\/]+)\/services/)
  return pathMatch ? pathMatch[1] : 'company'
})

// Refresh campaigns
const refreshCampaigns = async () => {
  await fetchCampaigns(filters.value.status ? { status: filters.value.status } : {})
}

// Apply filters
const applyFilters = () => {
  // Filters are applied through computed property
}

// Clear filters
const clearFilters = () => {
  filters.value = {
    status: '',
    provider: ''
  }
}

// Toggle show archived campaigns
const toggleShowArchived = () => {
  showArchived.value = !showArchived.value
  // If turning on archived view and no specific filter is set, show only archived
  if (showArchived.value && !filters.value.status) {
    filters.value.status = 'archived'
  } else if (!showArchived.value && filters.value.status === 'archived') {
    filters.value.status = ''
  }
}

// View campaign details
const viewCampaign = (campaignId) => {
  selectedCampaignId.value = campaignId
  showDetailsModal.value = true
}

// Close details modal
const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedCampaignId.value = null
}

// Edit campaign (redirect to edit page)
const updateCampaign = (campaignId) => {
  navigateTo(`/${route.params.pharmacy}/services/sms-campaigns/${campaignId}/edit`)
}

// Start campaign
const startCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Start Campaign?',
    message: `Are you sure you want to start "${campaign?.name}"? SMS messages will be sent to ${campaign?.total_recipients || 0} recipients.`,
    type: 'info',
    loading: false,
    action: 'start',
    campaignId
  }
}

// Pause campaign
const pauseCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Pause Campaign?',
    message: `Are you sure you want to pause "${campaign?.name}"? You can resume it later.`,
    type: 'warning',
    loading: false,
    action: 'pause',
    campaignId
  }
}

// Resume campaign
const resumeCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Resume Campaign?',
    message: `Resume sending SMS for "${campaign?.name}"?`,
    type: 'info',
    loading: false,
    action: 'resume',
    campaignId
  }
}

// Cancel campaign
const cancelCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Cancel Campaign?',
    message: `Are you sure you want to cancel "${campaign?.name}"? This action cannot be undone.`,
    type: 'error',
    loading: false,
    action: 'cancel',
    campaignId
  }
}

// Archive campaign
const archiveCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Archive Campaign?',
    message: `Archive "${campaign?.name}"? The campaign data will be preserved but hidden from the main list. You can restore it later.`,
    type: 'warning',
    loading: false,
    action: 'archive',
    campaignId,
    error: null,
    canRetry: false,
    isRetrying: false
  }
}

// Restore campaign
const restoreCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Restore Campaign?',
    message: `Restore "${campaign?.name}" from archive? The campaign will be visible in your campaigns list again.`,
    type: 'info',
    loading: false,
    action: 'restore',
    campaignId,
    error: null,
    canRetry: false,
    isRetrying: false
  }
}

// Delete campaign
const deleteCampaign = (campaignId) => {
  // Close details modal first
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  
  const isDraft = campaign?.status === 'draft'
  const message = isDraft 
    ? `Permanently delete draft campaign "${campaign?.name}"? This action cannot be undone.`
    : `Archive "${campaign?.name}"? The campaign will be moved to archives to preserve your analytics data.`
  
  confirmDialog.value = {
    isOpen: true,
    title: isDraft ? 'Delete Draft Campaign?' : 'Archive Campaign?',
    message,
    type: isDraft ? 'error' : 'warning',
    loading: false,
    action: 'delete',
    campaignId,
    error: null,
    canRetry: false,
    isRetrying: false
  }
}

// Reuse campaign
const openReuseCampaignModal = (campaignId) => {
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  reuseFormData.value = {
    campaignId,
    campaignName: campaign?.name || '',
    newName: `${campaign?.name} (Copy)`
  }
  showReuseModal.value = true
}

// Resend campaign
const openResendCampaignModal = (campaignId) => {
  closeDetailsModal()
  
  const campaign = campaigns.value.find(c => c.id === campaignId)
  // Default to failed only if the campaign has failed messages
  const hasFailedMessages = campaign?.messages_failed > 0
  resendFormData.value = {
    campaignId,
    toFailedOnly: hasFailedMessages // Smart default
  }
  showResendModal.value = true
}

// Handle reuse submission
const handleReuseSubmit = async () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Reuse Campaign?',
    message: `Create a new campaign copy of "${reuseFormData.value.campaignName}"? The new campaign will be created as a draft.`,
    type: 'info',
    loading: false,
    action: 'reuse',
    campaignId: reuseFormData.value.campaignId,
    error: null,
    canRetry: false,
    isRetrying: false
  }
  showReuseModal.value = false
}

// Handle resend submission
const handleResendSubmit = async () => {
  const campaign = campaigns.value.find(c => c.id === resendFormData.value.campaignId)
  const filterText = resendFormData.value.toFailedOnly ? 'to failed recipients only' : 'to all recipients'
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Resend Campaign?',
    message: `Resend SMS for "${campaign?.name}" ${filterText}?`,
    type: 'info',
    loading: false,
    action: 'resend',
    campaignId: resendFormData.value.campaignId,
    error: null,
    canRetry: false,
    isRetrying: false
  }
  showResendModal.value = false
}

// Handle confirmation
const handleConfirm = async () => {
  confirmDialog.value.loading = true
  confirmDialog.value.error = null

  try {
    const { action, campaignId } = confirmDialog.value

    if (action === 'start') {
      await retryAction(() => startCampaignAction(campaignId), campaignId)
    } else if (action === 'pause') {
      await pauseCampaignAction(campaignId)
    } else if (action === 'resume') {
      await resumeCampaignAction(campaignId)
    } else if (action === 'cancel') {
      await cancelCampaignAction(campaignId)
    } else if (action === 'archive') {
      await archiveCampaignAction(campaignId)
    } else if (action === 'restore') {
      await restoreCampaignAction(campaignId)
    } else if (action === 'delete') {
      await deleteCampaignAction(campaignId)
    } else if (action === 'reuse') {
      await reuseCampaignAction(campaignId, reuseFormData.value.newName)
    } else if (action === 'resend') {
      await resendCampaignAction(campaignId, { to_failed_only: resendFormData.value.toFailedOnly })
    }

    closeConfirmDialog()
    await refreshCampaigns()
  } catch (err) {
    console.error('Action failed:', err)
    confirmDialog.value.error = err.message 
    confirmDialog.value.canRetry = true
    confirmDialog.value.type = 'error'
    confirmDialog.value.loading = false
  }
}

// Retry failed action
const retryFailedAction = async () => {
  confirmDialog.value.isRetrying = true
  confirmDialog.value.error = null
  confirmDialog.value.canRetry = false
  
  try {
    const { action, campaignId } = confirmDialog.value

    if (action === 'start') {
      await retryAction(() => startCampaignAction(campaignId), campaignId)
    } else if (action === 'pause') {
      await pauseCampaignAction(campaignId)
    } else if (action === 'resume') {
      await resumeCampaignAction(campaignId)
    } else if (action === 'cancel') {
      await cancelCampaignAction(campaignId)
    } else if (action === 'archive') {
      await archiveCampaignAction(campaignId)
    } else if (action === 'restore') {
      await restoreCampaignAction(campaignId)
    } else if (action === 'delete') {
      await deleteCampaignAction(campaignId)
    } else if (action === 'reuse') {
      await reuseCampaignAction(campaignId, reuseFormData.value.newName)
    } else if (action === 'resend') {
      await resendCampaignAction(campaignId, { to_failed_only: resendFormData.value.toFailedOnly })
    }

    closeConfirmDialog()
    await refreshCampaigns()
  } catch (err) {
    console.error('Retry failed:', err)
    confirmDialog.value.error = err.message
    confirmDialog.value.canRetry = true
    confirmDialog.value.isRetrying = false
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
    campaignId: null,
    error: null,
    canRetry: false,
    isRetrying: false
  }
}
</script>

<style scoped>
.sms-campaigns-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
