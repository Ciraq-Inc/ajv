<template>
  <div class="sms-campaigns-page">
    <!-- Header -->
    <div class="mb-4 md:mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">SMS Campaigns</h1>
          <p class="text-sm md:text-base text-gray-600 mt-1">Create and manage your SMS marketing campaigns</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="px-4 md:px-6 py-2.5 md:py-3 cs-btn text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm md:text-base whitespace-nowrap"
        >
          <PlusIcon class="h-5 w-5" />
          <span class="hidden xs:inline">Create Campaign</span>
          <span class="xs:hidden">Create</span>
        </button>
      </div>

      <!-- Balance Card -->
      <BalanceCard
        v-bind="balance ? { balanceData: balance } : {}"
        :show-actions="true"
        :show-top-up="false"
        @refresh="fetchBalance"
      />
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      <div class="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-2 md:gap-3">
          <div class="bg-purple-100 p-2 md:p-3 rounded-lg">
            <InboxIcon class="h-5 w-5 md:h-6 md:w-6 cs-text" />
          </div>
          <div>
            <p class="text-xs md:text-sm text-gray-600">Total Campaigns</p>
            <p class="text-xl md:text-2xl font-bold text-gray-900">{{ campaigns.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-2 md:gap-3">
          <div class="bg-green-100 p-2 md:p-3 rounded-lg">
            <CheckCircleIcon class="h-5 w-5 md:h-6 md:w-6 text-green-600" />
          </div>
          <div>
            <p class="text-xs md:text-sm text-gray-600">Completed</p>
            <p class="text-xl md:text-2xl font-bold text-gray-900">{{ completedCampaigns.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-2 md:gap-3">
          <div class="bg-yellow-100 p-2 md:p-3 rounded-lg">
            <SparklesIcon class="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-xs md:text-sm text-gray-600">Active</p>
            <p class="text-xl md:text-2xl font-bold text-gray-900">{{ activeCampaigns.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
        <div class="flex items-center gap-2 md:gap-3">
          <div class="bg-gray-100 p-2 md:p-3 rounded-lg">
            <DocumentTextIcon class="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
          </div>
          <div>
            <p class="text-xs md:text-sm text-gray-600">Drafts</p>
            <p class="text-xl md:text-2xl font-bold text-gray-900">{{ draftCampaigns.length }}</p>
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
    <div class="bg-white p-3 md:p-4 rounded-lg border border-gray-200 mb-4 md:mb-6">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
        <div class="flex-1 sm:flex-none">
          <label class="text-xs md:text-sm text-gray-600 mb-1 block">Status</label>
          <select
            v-model="filters.status"
            @change="applyFilters"
            class="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg cs-input text-sm md:text-base"
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
            class="px-4 py-2 border border-gray-300 rounded-lg cs-input"
          >
            <option value="">All Providers</option>
            <option value="nalo">Nalo Solutions</option>
            <option value="mnotify">MNotify</option>
          </select>
        </div> -->

        <div class="hidden sm:block sm:flex-1"></div>

        <!-- Show Archived Toggle -->
        <button
          @click="toggleShowArchived"
          class="px-3 md:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm md:text-base"
          :class="showArchived 
            ? 'cs-badge border cs-border hover:opacity-90'
            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'"
        >
          <ArchiveBoxIcon class="h-4 w-4" />
          <span class="hidden sm:inline">{{ showArchived ? 'Hide' : 'Show' }} Archived ({{ archivedCampaigns.length }})</span>
          <span class="sm:hidden">Archived ({{ archivedCampaigns.length }})</span>
        </button>

        <button
          @click="refreshCampaigns"
          :disabled="loading"
          class="px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <ArrowPathIcon :class="loading ? 'animate-spin' : ''" class="h-4 w-4" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && campaigns.length === 0" class="text-center py-12">
      <ArrowPathIcon class="h-12 w-12 animate-spin mx-auto mb-4 cs-text" />
      <p class="text-gray-600">Loading campaigns...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && filteredCampaigns.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <InboxIcon class="h-16 w-16 mx-auto mb-4 text-gray-400" />
      <h3 class="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
      <p class="text-gray-600 mb-6">
        {{ campaigns.length === 0 ? 'Get started by creating your first SMS campaign' : 'No campaigns match your filters' }}
      </p>
      <button
        v-if="campaigns.length === 0"
        @click="showCreateModal = true"
        class="inline-flex items-center gap-2 px-6 py-3 cs-btn text-white rounded-lg transition-colors font-medium"
      >
        <PlusIcon class="h-5 w-5" />
        Create Your First Campaign
      </button>
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
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
        @update="openEditModal"
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
      @edit="openEditModal"
    />

    <!-- Edit Campaign Modal -->
    <EditCampaignModal
      :is-open="showEditModal"
      :campaign-id="editingCampaignId"
      @close="showEditModal = false"
      @updated="handleCampaignUpdated"
    />

    <!-- Create Campaign Modal -->
    <CreateCampaignModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCampaignCreated"
    />

    <!-- Test SMS Modal -->
    <TestSmsModal
      :is-open="showTestModal"
      @close="showTestModal = false"
    />

    <!-- Reuse Campaign Modal -->
    <div v-if="showReuseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-4 md:p-6">
          <h2 class="text-lg md:text-xl font-bold text-gray-900 mb-4">Reuse Campaign</h2>
          
          <div class="space-y-3 md:space-y-4">
            <div>
              <label class="block text-xs md:text-sm font-medium text-gray-700 mb-2">Original Campaign</label>
              <p class="text-sm md:text-base text-gray-600">{{ reuseFormData.campaignName }}</p>
            </div>
            
            <div>
              <label for="newCampaignName" class="block text-xs md:text-sm font-medium text-gray-700 mb-2">New Campaign Name</label>
              <input
                id="newCampaignName"
                v-model="reuseFormData.newName"
                type="text"
                placeholder="Enter campaign name"
                class="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg cs-input text-sm md:text-base"
              />
            </div>

            <p class="text-xs md:text-sm text-gray-600 bg-purple-50 p-3 rounded">
              ℹ️ A copy of this campaign will be created as a draft. You can edit it before sending.
            </p>
          </div>
        </div>
        
        <div class="px-4 md:px-6 py-3 md:py-4 bg-gray-50 rounded-b-lg flex gap-2 md:gap-3 justify-end">
          <button
            @click="showReuseModal = false"
            class="px-3 md:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            @click="handleReuseSubmit"
            class="px-3 md:px-4 py-2 cs-btn text-white rounded-lg font-medium text-sm md:text-base"
          >
            Reuse Campaign
          </button>
        </div>
      </div>
    </div>

    <!-- Resend Campaign Modal -->
    <div v-if="showResendModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-4 md:p-6">
          <h2 class="text-lg md:text-xl font-bold text-gray-900 mb-4">Resend Campaign</h2>
          
          <div class="space-y-3 md:space-y-4">
            <!-- Campaign Info -->
            <div class="bg-purple-50 p-3 md:p-4 rounded border border-purple-200">
              <p class="text-xs md:text-sm cs-text font-medium mb-2">
                {{ campaigns.find(c => c.id === resendFormData.campaignId)?.name }}
              </p>
              <div class="grid grid-cols-2 gap-2 text-xs cs-text">
                <div>
                  <span class="font-medium">Total Recipients:</span>
                  <span class="ml-1">{{ campaigns.find(c => c.id === resendFormData.campaignId)?.total_recipients || 0 }}</span>
                </div>
                <div>
                  <span class="font-medium">Sent:</span>
                  <span class="ml-1">{{ campaigns.find(c => c.id === resendFormData.campaignId)?.messages_sent || 0 }}</span>
                </div>
                <div v-if="(campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed ?? 0) > 0" class="col-span-2">
                  <span class="font-medium text-red-700">Failed Messages:</span>
                  <span class="ml-1 text-red-700">{{ campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-3 md:p-4 rounded border border-yellow-200">
              <p class="text-xs md:text-sm text-yellow-800">
                ⚠️ This will reset selected recipients to "pending" status and resend SMS messages.
              </p>
            </div>

            <div class="space-y-3">
              <label class="flex items-start gap-3 cursor-pointer p-3 rounded border-2 transition-all hover:bg-gray-50"
                     :class="!resendFormData.toFailedOnly ? 'cs-selected' : 'border-gray-200'">
                <input
                  v-model="resendFormData.toFailedOnly"
                  :value="false"
                  type="radio"
                  class="w-4 h-4 cs-text mt-0.5"
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
                    <span v-if="!((campaigns.find(c => c.id === resendFormData.campaignId)?.messages_failed ?? 0) > 0)" class="text-yellow-700 font-medium">
                      (No failed messages)
                    </span>
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="px-4 md:px-6 py-3 md:py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row gap-2 md:gap-3 sm:justify-end">
          <button
            @click="showResendModal = false"
            class="px-3 md:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            @click="handleResendSubmit"
            class="px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2 text-sm md:text-base order-1 sm:order-2"
          >
            <PaperAirplaneIcon class="h-4 w-4" />
            Confirm Resend
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  PaperAirplaneIcon,
} from '@heroicons/vue/20/solid'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import { useSMSBilling } from '~/composables/useSMSBilling'
import type { SmsCampaign } from '~/services/types'
import CampaignCard from '~/components/sms/campaign/CampaignCard.vue'
import CampaignDetailsModal from '~/components/sms/campaign/CampaignDetailsModal.vue'
import CreateCampaignModal from '~/components/sms/campaign/CreateCampaignModal.vue'
import EditCampaignModal from '~/components/sms/campaign/EditCampaignModal.vue'
import BalanceCard from '~/components/sms/billing/BalanceCard.vue'
import ConfirmDialog from '~/components/sms/shared/ConfirmDialog.vue'
import TestSmsModal from '~/components/sms/shared/TestSmsModal.vue'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'SMS Campaigns',
})

interface CampaignRecord {
  id: number | string
  name?: string | null
  status: string
  created_at: string
  message?: string | null
  total_recipients?: number | null
  messages_sent?: number | null
  messages_failed?: number | null
  sms_provider?: string | null
  [key: string]: unknown
}

type DialogType = 'warning' | 'danger' | 'info' | 'success' | 'error'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  type: DialogType
  loading: boolean
  action: string | null
  campaignId: number | string | null
  error: string | null
  canRetry: boolean
  isRetrying: boolean
}

const route = useRoute()

const {
  campaigns,
  loading,
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
  reuseCampaign: reuseCampaignAction,
  resendCampaign: resendCampaignAction,
} = useSMSCampaigns()

const { balance, fetchBalance } = useSMSBilling()

const filters = ref({ status: '', provider: '' })

const showArchived = ref<boolean>(false)
const showTestModal = ref<boolean>(false)
const showDetailsModal = ref<boolean>(false)
const showCreateModal = ref<boolean>(false)
const showEditModal = ref<boolean>(false)
const selectedCampaignId = ref<number | null>(null)
const editingCampaignId = ref<number | string | null>(null)

const confirmDialog = ref<ConfirmDialogState>({
  isOpen: false,
  title: '',
  message: '',
  type: 'warning',
  loading: false,
  action: null,
  campaignId: null,
  error: null,
  canRetry: false,
  isRetrying: false,
})

const showReuseModal = ref<boolean>(false)
const showResendModal = ref<boolean>(false)
const reuseFormData = ref<{ campaignId: number | string | null; campaignName: string; newName: string }>({
  campaignId: null,
  campaignName: '',
  newName: '',
})
const resendFormData = ref<{ campaignId: number | string | null; toFailedOnly: boolean }>({
  campaignId: null,
  toFailedOnly: false,
})

const filteredCampaigns = computed<SmsCampaign[]>(() => {
  let filtered = [...campaigns.value]
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

const archivedCampaigns = computed<SmsCampaign[]>(() =>
  campaigns.value.filter(c => c.status === 'archived')
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const failedCampaigns = computed<SmsCampaign[]>(() =>
  campaigns.value.filter(c =>
    c.status === 'failed' || ((c.messages_failed ?? 0) > 0 && c.status !== 'archived')
  )
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const companyDomain = computed<string>(() => {
  const pathMatch = route.path.match(/\/([^/]+)\/services/)
  return pathMatch?.[1] ?? 'company'
})

let pollingInterval: ReturnType<typeof setInterval> | null = null

const refreshCampaigns = async (): Promise<void> => {
  await fetchCampaigns(filters.value.status ? { status: filters.value.status } : {})
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const applyFilters = (): void => {
  // Filters are applied through computed property
}

const clearFilters = (): void => {
  filters.value = { status: '', provider: '' }
}

const toggleShowArchived = (): void => {
  showArchived.value = !showArchived.value
  if (showArchived.value && !filters.value.status) {
    filters.value.status = 'archived'
  } else if (!showArchived.value && filters.value.status === 'archived') {
    filters.value.status = ''
  }
}

const viewCampaign = (campaignId: number | string): void => {
  selectedCampaignId.value = Number(campaignId)
  showDetailsModal.value = true
}

const closeDetailsModal = (): void => {
  showDetailsModal.value = false
  selectedCampaignId.value = null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateCampaign = (campaignId: number | string): void => {
  void navigateTo(`/${String(route.params['pharmacy'])}/services/sms-campaigns/${String(campaignId)}/edit`)
}

const makeConfirmDialog = (overrides: Partial<ConfirmDialogState>): void => {
  confirmDialog.value = {
    isOpen: true,
    title: '',
    message: '',
    type: 'warning',
    loading: false,
    action: null,
    campaignId: null,
    error: null,
    canRetry: false,
    isRetrying: false,
    ...overrides,
  }
}

const startCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  makeConfirmDialog({
    title: 'Start Campaign?',
    message: `Are you sure you want to start "${campaign?.name ?? ''}"? SMS messages will be sent to ${campaign?.total_recipients ?? 0} recipients.`,
    type: 'info',
    action: 'start',
    campaignId,
  })
}

const pauseCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  makeConfirmDialog({
    title: 'Pause Campaign?',
    message: `Are you sure you want to pause "${campaign?.name ?? ''}"? You can resume it later.`,
    type: 'warning',
    action: 'pause',
    campaignId,
  })
}

const resumeCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  makeConfirmDialog({
    title: 'Resume Campaign?',
    message: `Resume sending SMS for "${campaign?.name ?? ''}"?`,
    type: 'info',
    action: 'resume',
    campaignId,
  })
}

const cancelCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  makeConfirmDialog({
    title: 'Cancel Campaign?',
    message: `Are you sure you want to cancel "${campaign?.name ?? ''}"? This action cannot be undone.`,
    type: 'error',
    action: 'cancel',
    campaignId,
  })
}

const archiveCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  makeConfirmDialog({
    title: 'Archive Campaign?',
    message: `Archive "${campaign?.name ?? ''}"? The campaign data will be preserved but hidden from the main list. You can restore it later.`,
    type: 'warning',
    action: 'archive',
    campaignId,
  })
}

const restoreCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  makeConfirmDialog({
    title: 'Restore Campaign?',
    message: `Restore "${campaign?.name ?? ''}" from archive? The campaign will be visible in your campaigns list again.`,
    type: 'info',
    action: 'restore',
    campaignId,
  })
}

const deleteCampaign = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  const isDraft = campaign?.status === 'draft'
  const message = isDraft
    ? `Permanently delete draft campaign "${campaign?.name ?? ''}"? This action cannot be undone.`
    : `Archive "${campaign?.name ?? ''}"? The campaign will be moved to archives to preserve your analytics data.`
  makeConfirmDialog({
    title: isDraft ? 'Delete Draft Campaign?' : 'Archive Campaign?',
    message,
    type: isDraft ? 'error' : 'warning',
    action: 'delete',
    campaignId,
  })
}

const openReuseCampaignModal = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  reuseFormData.value = {
    campaignId,
    campaignName: campaign?.name ?? '',
    newName: `${campaign?.name ?? ''} (Copy)`,
  }
  showReuseModal.value = true
}

const openResendCampaignModal = (campaignId: number | string): void => {
  closeDetailsModal()
  const campaign = campaigns.value.find(c => c.id === campaignId)
  const hasFailedMessages = (campaign?.messages_failed ?? 0) > 0
  resendFormData.value = { campaignId, toFailedOnly: hasFailedMessages }
  showResendModal.value = true
}

const handleReuseSubmit = (): void => {
  makeConfirmDialog({
    title: 'Reuse Campaign?',
    message: `Create a new campaign copy of "${reuseFormData.value.campaignName}"? The new campaign will be created as a draft.`,
    type: 'info',
    action: 'reuse',
    campaignId: reuseFormData.value.campaignId,
  })
  showReuseModal.value = false
}

const handleResendSubmit = (): void => {
  const campaign = campaigns.value.find(c => c.id === resendFormData.value.campaignId)
  const filterText = resendFormData.value.toFailedOnly ? 'to failed recipients only' : 'to all recipients'
  makeConfirmDialog({
    title: 'Resend Campaign?',
    message: `Resend SMS for "${campaign?.name ?? ''}" ${filterText}?`,
    type: 'info',
    action: 'resend',
    campaignId: resendFormData.value.campaignId,
  })
  showResendModal.value = false
}

const runDialogAction = async (): Promise<void> => {
  const { action, campaignId } = confirmDialog.value
  if (!campaignId) return
  if (action === 'start') await retryAction(() => startCampaignAction(campaignId), campaignId)
  else if (action === 'pause') await pauseCampaignAction(campaignId)
  else if (action === 'resume') await resumeCampaignAction(campaignId)
  else if (action === 'cancel') await cancelCampaignAction(campaignId)
  else if (action === 'archive') await archiveCampaignAction(campaignId)
  else if (action === 'restore') await restoreCampaignAction(campaignId)
  else if (action === 'delete') await deleteCampaignAction(campaignId)
  else if (action === 'reuse') await reuseCampaignAction(campaignId, reuseFormData.value.newName)
  else if (action === 'resend') await resendCampaignAction(campaignId, { to_failed_only: resendFormData.value.toFailedOnly })
}

const closeConfirmDialog = (): void => {
  confirmDialog.value = {
    isOpen: false, title: '', message: '', type: 'warning',
    loading: false, action: null, campaignId: null,
    error: null, canRetry: false, isRetrying: false,
  }
}

const handleConfirm = async (): Promise<void> => {
  confirmDialog.value.loading = true
  confirmDialog.value.error = null
  const action = confirmDialog.value.action
  try {
    await runDialogAction()
    closeConfirmDialog()
    if (action === 'restore') {
      showArchived.value = false
      filters.value.status = ''
    }
    await refreshCampaigns()
  } catch (err) {
    console.error('Action failed:', err)
    confirmDialog.value.error = err instanceof Error ? err.message : 'Action failed'
    confirmDialog.value.canRetry = true
    confirmDialog.value.type = 'error'
    confirmDialog.value.loading = false
  }
}

const retryFailedAction = async (): Promise<void> => {
  confirmDialog.value.isRetrying = true
  confirmDialog.value.error = null
  confirmDialog.value.canRetry = false
  try {
    await runDialogAction()
    closeConfirmDialog()
    await refreshCampaigns()
  } catch (err) {
    console.error('Retry failed:', err)
    confirmDialog.value.error = err instanceof Error ? err.message : 'Retry failed'
    confirmDialog.value.canRetry = true
    confirmDialog.value.isRetrying = false
  }
}

const handleCampaignCompleted = async (campaign: CampaignRecord): Promise<void> => {
  if (process.client) alert(`Campaign "${campaign.name ?? ''}" completed successfully!`)
  await fetchBalance()
  await refreshCampaigns()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleCampaignStatusChanged = (_event: unknown): void => {
  // Polling continues regardless
}

const startCampaignPolling = (): void => {
  pollingInterval = setInterval(async () => {
    const hasActive = campaigns.value.some(c => c.status === 'sending' || c.status === 'paused')
    if (hasActive && !loading.value) {
      try {
        await fetchCampaigns(filters.value.status ? { status: filters.value.status } : {})
      } catch (err) {
        console.error('Polling error:', err)
      }
    }
  }, 10000)
}

const stopCampaignPolling = (): void => {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

const handleCampaignCreated = async (): Promise<void> => {
  await refreshCampaigns()
  await fetchBalance()
}

const openEditModal = (campaignId: number | string): void => {
  closeDetailsModal()
  editingCampaignId.value = campaignId
  showEditModal.value = true
}

const handleCampaignUpdated = async (): Promise<void> => {
  await refreshCampaigns()
  await fetchBalance()
}

onMounted(async () => {
  await Promise.all([fetchCampaigns(), fetchBalance()])
  startCampaignPolling()
})

onUnmounted(() => {
  stopCampaignPolling()
})
</script>

<style scoped>
.sms-campaigns-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}
</style>
