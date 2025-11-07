<template>
  <div class="campaign-edit-page">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <nuxt-link
            :to="`/${route.params.pharmacy}/services/sms-campaigns`"
            class="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-2"
          >
            <ArrowLeftIcon class="h-4 w-4" />
            Back to Campaigns
          </nuxt-link>
          <h1 class="text-3xl font-bold text-gray-900">Edit SMS Campaign</h1>
          <p class="text-gray-600 mt-1">Update your campaign details</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="text-gray-600 mt-4">Loading campaign...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="h-6 w-6 text-red-600 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="text-red-900 font-semibold">Error Loading Campaign</h3>
          <p class="text-red-700 mt-1">{{ error }}</p>
          <button
            @click="fetchCampaignData"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Campaign Not Editable -->
    <div v-else-if="campaign && !canEdit" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="h-6 w-6 text-yellow-600 flex-shrink-0" />
        <div>
          <h3 class="text-yellow-900 font-semibold">Campaign Cannot Be Edited</h3>
          <p class="text-yellow-700 mt-1">
            This campaign has status "{{ campaign.status }}" and cannot be edited.
            Only campaigns with status "draft" or "paused" can be edited.
          </p>
          <nuxt-link
            :to="`/${route.params.pharmacy}/services/sms-campaigns/${route.params.id}`"
            class="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            View Campaign Details
          </nuxt-link>
        </div>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="campaign" class="space-y-6">
      <!-- Campaign Status Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-900">Campaign Status: {{ campaign.status?.toUpperCase() }}</p>
            <p class="text-xs text-blue-700 mt-1">
              Created {{ new Date(campaign.created_at).toLocaleDateString() }}
              {{ campaign.total_recipients ? `• ${campaign.total_recipients} recipients` : '' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <!-- Save Error Alert -->
        <div v-if="saveError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex items-start gap-3">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-600 flex-shrink-0" />
            <div class="flex-1">
              <h4 class="text-red-900 font-semibold text-sm">Failed to Save Changes</h4>
              <p class="text-red-700 text-sm mt-1">{{ saveError }}</p>
            </div>
            <button
              @click="saveError = null"
              class="text-red-400 hover:text-red-600"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form @submit.prevent="saveCampaign" class="space-y-6">
        <!-- Campaign Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            maxlength="100"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Monthly Promotion"
          />
          <p class="mt-1 text-xs text-gray-500">
            {{ formData.name?.length || 0 }}/100 characters
          </p>
        </div>

        <!-- Message -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <div class="relative">
            <textarea
              v-model="formData.message"
              required
              rows="6"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Type your message here..."
              @input="validateMessage"
            ></textarea>
            <div class="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded">
              {{ messageLength }} characters, {{ messageParts }} SMS
            </div>
          </div>
          <div class="mt-2 flex items-start gap-2">
            <div class="flex-1">
              <p class="text-sm text-gray-600">
                {{ messageLength <= 160 ? 'Single SMS' : `${messageParts} SMS messages` }}
                ({{ messageLength }} / {{ messageParts * 160 }} characters)
              </p>
              <p v-if="messageLength > 160" class="text-xs text-amber-600 mt-1">
                ⚠️ Messages over 160 characters will be sent as {{ messageParts }} separate SMS
              </p>
            </div>
          </div>
        </div>

        <!-- SMS Provider (if applicable) -->
        <div v-if="formData.sms_provider">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            SMS Provider
          </label>
          <input
            v-model="formData.sms_provider"
            type="text"
            disabled
            class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
          <p class="mt-1 text-sm text-gray-500">
            Provider cannot be changed after campaign creation
          </p>
        </div>

        <!-- Sender ID (if applicable) -->
        <div v-if="formData.sender_id">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Sender ID
          </label>
          <input
            v-model="formData.sender_id"
            type="text"
            disabled
            class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
          <p class="mt-1 text-sm text-gray-500">
            Sender ID cannot be changed after campaign creation
          </p>
        </div>

        <!-- Recipients Info (Read-only) -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-blue-900 mb-2">Recipients</h3>
          <p class="text-sm text-blue-800">
            Total Recipients: <strong>{{ campaign.total_recipients || 0 }}</strong>
          </p>
          <p class="text-xs text-blue-700 mt-1">
            To change recipients, please create a new campaign or use the "Reuse Campaign" feature.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            :disabled="saving"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>

          <nuxt-link
            :to="`/${route.params.pharmacy}/services/sms-campaigns/${route.params.id}`"
            class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </nuxt-link>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'Edit Campaign'
})

const route = useRoute()
const router = useRouter()
const { fetchCampaign, updateCampaign: updateCampaignAction } = useSMSCampaigns()

const campaign = ref(null)
const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const saveError = ref(null)

const formData = ref({
  name: '',
  message: '',
  sms_provider: '',
  sender_id: ''
})

const messageLength = computed(() => formData.value.message?.length || 0)

const messageParts = computed(() => {
  const length = messageLength.value
  if (length === 0) return 0
  if (length <= 160) return 1
  return Math.ceil(length / 153) // Multi-part SMS uses 153 chars per part
})

const canEdit = computed(() => {
  if (!campaign.value) return false
  return ['draft', 'paused'].includes(campaign.value.status)
})

const validateMessage = () => {
  // Additional validation can be added here
  // For now, just ensure it's not empty
  if (!formData.value.message || formData.value.message.trim().length === 0) {
    return false
  }
  return true
}

const fetchCampaignData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetchCampaign(route.params.id)
    campaign.value = response.data || response.campaign
    
    // Populate form data
    formData.value = {
      name: campaign.value.name || '',
      message: campaign.value.message || '',
      sms_provider: campaign.value.sms_provider || '',
      sender_id: campaign.value.sender_id || ''
    }
  } catch (err) {
    error.value = err.message || 'Failed to load campaign'
    console.error('Error loading campaign:', err)
  } finally {
    loading.value = false
  }
}

const saveCampaign = async () => {
  if (!formData.value.name || !formData.value.message) {
    saveError.value = 'Please fill in all required fields'
    scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  saving.value = true
  saveError.value = null
  
  try {
    const updateData = {
      name: formData.value.name.trim(),
      message: formData.value.message.trim()
    }
    
    const response = await updateCampaignAction(route.params.id, updateData)
    
    if (response.success) {
      // Show success message
      alert('Campaign updated successfully!')
      
      // Navigate back to campaign details
      await router.push(`/${route.params.pharmacy}/services/sms-campaigns/${route.params.id}`)
    } else {
      throw new Error(response.message || 'Failed to update campaign')
    }
  } catch (err) {
    saveError.value = err.message || 'Failed to save campaign'
    console.error('Error saving campaign:', err)
    
    // Scroll to top to show error
    scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCampaignData()
})
</script>
