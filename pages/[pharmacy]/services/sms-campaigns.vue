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
          to="/company/sms-create-campaign"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Icon name="Plus" class="h-5 w-5" />
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
            <Icon name="Inbox" class="h-6 w-6 text-blue-600" />
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
            <Icon name="CheckCircle" class="h-6 w-6 text-green-600" />
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
            <Icon name="Activity" class="h-6 w-6 text-yellow-600" />
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
            <Icon name="FileText" class="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p class="text-sm text-gray-600">Drafts</p>
            <p class="text-2xl font-bold text-gray-900">{{ draftCampaigns.length }}</p>
          </div>
        </div>
      </div>
    </div>

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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
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
        </div>

        <div class="flex-1"></div>

        <button
          @click="refreshCampaigns"
          :disabled="loading"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Icon :name="loading ? 'Loader2' : 'RefreshCw'" :class="loading ? 'animate-spin' : ''" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && campaigns.length === 0" class="text-center py-12">
      <Icon name="Loader2" class="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p class="text-gray-600">Loading campaigns...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && filteredCampaigns.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <Icon name="Inbox" class="h-16 w-16 mx-auto mb-4 text-gray-400" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
      <p class="text-gray-600 mb-6">
        {{ campaigns.length === 0 ? 'Get started by creating your first SMS campaign' : 'No campaigns match your filters' }}
      </p>
      <nuxt-link
        v-if="campaigns.length === 0"
        to="/company/sms-create-campaign"
        class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <Icon name="Plus" class="h-5 w-5" />
        Create Your First Campaign
      </nuxt-link>
      <button
        v-else
        @click="clearFilters"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        <Icon name="X" class="h-5 w-5" />
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
      />
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirm"
      @close="closeConfirmDialog"
    />

    <!-- Test SMS Modal -->
    <TestSmsModal
      :is-open="showTestModal"
      @close="showTestModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import { useSMSBilling } from '~/composables/useSMSBilling'
import CampaignCard from '~/components/sms/campaign/CampaignCard.vue'
import BalanceCard from '~/components/sms/billing/BalanceCard.vue'
import ConfirmDialog from '~/components/sms/shared/ConfirmDialog.vue'
import TestSmsModal from '~/components/sms/shared/TestSmsModal.vue'

// Define page metadata
definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'SMS Campaigns'
})

const {
  campaigns,
  loading,
  error,
  fetchCampaigns,
  startCampaign: startCampaignAction,
  pauseCampaign: pauseCampaignAction,
  resumeCampaign: resumeCampaignAction,
  activeCampaigns,
  completedCampaigns,
  draftCampaigns
} = useSMSCampaigns()

const { balance, fetchBalance } = useSMSBilling()

const filters = ref({
  status: '',
  provider: ''
})

const showTestModal = ref(false)

const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'warning',
  loading: false,
  action: null,
  campaignId: null
})

// Filtered campaigns based on filters
const filteredCampaigns = computed(() => {
  let filtered = [...campaigns.value]

  if (filters.value.status) {
    filtered = filtered.filter(c => c.status === filters.value.status)
  }

  if (filters.value.provider) {
    filtered = filtered.filter(c => c.sms_provider === filters.value.provider)
  }

  return filtered
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchCampaigns(),
    fetchBalance()
  ])
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

// View campaign details
const viewCampaign = (campaignId) => {
  navigateTo(`/company/sms-campaigns/${campaignId}`)
}

// Start campaign
const startCampaign = (campaignId) => {
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

// Handle confirmation
const handleConfirm = async () => {
  confirmDialog.value.loading = true

  try {
    const { action, campaignId } = confirmDialog.value

    if (action === 'start') {
      await startCampaignAction(campaignId)
      // Show success notification
    } else if (action === 'pause') {
      await pauseCampaignAction(campaignId)
    } else if (action === 'resume') {
      await resumeCampaignAction(campaignId)
    }

    closeConfirmDialog()
    await refreshCampaigns()
  } catch (err) {
    console.error('Action failed:', err)
    // Show error notification
  } finally {
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
    campaignId: null
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
