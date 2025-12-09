<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-30 transition-opacity" @click="close"></div>

      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all" @click.stop>
          <!-- Header -->
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Create SMS Campaign</h2>
                <p class="text-sm text-gray-600 mt-1">Compose and send SMS messages to your customers</p>
              </div>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Progress Steps -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-center">
              <div class="flex items-center">
                <!-- Step 1 -->
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                      currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    ]"
                  >
                    1
                  </div>
                  <div class="ml-2 text-left">
                    <p :class="['text-xs font-medium', currentStep >= 1 ? 'text-gray-900' : 'text-gray-500']">
                      Campaign Details
                    </p>
                  </div>
                </div>

                <!-- Connector -->
                <div :class="['w-16 h-1 mx-3', currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200']"></div>

                <!-- Step 2 -->
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                      currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    ]"
                  >
                    2
                  </div>
                  <div class="ml-2 text-left">
                    <p :class="['text-xs font-medium', currentStep >= 2 ? 'text-gray-900' : 'text-gray-500']">
                      Select Recipients
                    </p>
                  </div>
                </div>

                <!-- Connector -->
                <div :class="['w-16 h-1 mx-3', currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200']"></div>

                <!-- Step 3 -->
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                      currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    ]"
                  >
                    3
                  </div>
                  <div class="ml-2 text-left">
                    <p :class="['text-xs font-medium', currentStep >= 3 ? 'text-gray-900' : 'text-gray-500']">
                      Review & Send
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <!-- Step 1: Campaign Details -->
            <div v-if="currentStep === 1" class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
                
                <!-- Campaign Name -->
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    v-model="campaign.name"
                    type="text"
                    placeholder="e.g., Monthly Promotion"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- Message Composer -->
                <MessageComposer
                  v-model="campaign.message"
                  @validation="handleMessageValidation"
                />
              </div>
            </div>

            <!-- Step 2: Select Recipients -->
            <div v-if="currentStep === 2" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Recipients</h3>
              
              <RecipientSelector
                v-model:selected-type="selectedType"
                v-model:selected-customers="selectedCustomers"
                v-model:custom-ids="customIds"
                v-model:estimated-count="estimatedCount"
                :message-parts="messageParts"
                @update="updateRecipients"
              />
            </div>

            <!-- Step 3: Review & Send -->
            <div v-if="currentStep === 3" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Review Campaign</h3>

              <!-- Campaign Summary -->
              <div class="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <p class="text-sm text-gray-600">Campaign Name</p>
                  <p class="text-lg font-semibold text-gray-900">{{ campaign.name }}</p>
                </div>

                <div>
                  <p class="text-sm text-gray-600">Message</p>
                  <div class="mt-2 bg-white border border-gray-200 rounded-lg p-4">
                    <p class="text-gray-900 whitespace-pre-wrap">{{ campaign.message }}</p>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ messageValidation.messageInfo?.length || 0 }} characters, 
                    {{ messageValidation.messageInfo?.parts || 1 }} SMS
                  </p>
                </div>

                <div>
                  <p class="text-sm text-gray-600">Recipient Type</p>
                  <p class="text-lg font-semibold text-gray-900">{{ getRecipientTypeLabel() }}</p>
                </div>
              </div>

              <!-- Cost Summary -->
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                <h4 class="text-lg font-semibold mb-4">Cost Summary</h4>
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <p class="text-sm text-blue-100">Total Recipients</p>
                    <p class="text-3xl font-bold">{{ getTotalRecipients() }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-blue-100">Total Cost</p>
                    <p class="text-3xl font-bold">{{ getTotalCost() }} credits</p>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-blue-400">
                  <div class="flex items-center justify-between">
                    <span class="text-sm">Your Current Balance:</span>
                    <span class="text-lg font-semibold">{{ balance?.sms_balance || 0 }} credits</span>
                  </div>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-sm">Balance After Campaign:</span>
                    <span class="text-lg font-semibold">
                      {{ (balance?.sms_balance || 0) - getTotalCost() }} credits
                    </span>
                  </div>
                </div>
              </div>

              <!-- Insufficient Balance Warning -->
              <div
                v-if="!hasSufficientBalance()"
                class="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div class="flex items-start gap-3">
                  <ExclamationTriangleIcon class="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p class="text-sm font-medium text-red-900">Insufficient Balance</p>
                    <p class="text-sm text-red-800 mt-1">
                      You need {{ getTotalCost() - (balance?.sms_balance || 0) }} more credits to send this campaign.
                      Please contact admin to top up your balance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div class="flex items-center justify-between">
              <button
                v-if="currentStep > 1"
                @click="previousStep"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 text-sm"
              >
                <ArrowLeftIcon class="h-4 w-4" />
                Previous
              </button>
              <div v-else></div>

              <div class="flex items-center gap-3">
                <button
                  @click="saveDraft"
                  :disabled="creating"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Save Draft
                </button>

                <button
                  v-if="currentStep < 3"
                  @click="nextStep"
                  :disabled="!canProceed()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRightIcon class="h-4 w-4" />
                </button>

                <button
                  v-else
                  @click="sendCampaign"
                  :disabled="creating || !hasSufficientBalance()"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon v-if="creating" class="h-4 w-4 animate-spin" />
                  <PaperAirplaneIcon v-else class="h-4 w-4" />
                  {{ creating ? 'Sending...' : 'Send Campaign' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  XMarkIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  ArrowPathIcon, 
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import { useSMSBilling } from '~/composables/useSMSBilling'
import MessageComposer from '~/components/sms/campaign/MessageComposer.vue'
import RecipientSelector from '~/components/sms/campaign/RecipientSelector.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const route = useRoute()
const router = useRouter()

const { createCampaign, startCampaign, loading: creating } = useSMSCampaigns()
const { balance, fetchBalance } = useSMSBilling()

const currentStep = ref(1)

const campaign = ref({
  name: '',
  message: ''
})

const recipients = ref({
  type: 'all',
  filters: {},
  customer_ids: '',
  totalRecipients: 0,
  totalCost: 0
})

const messageValidation = ref({
  isValid: false,
  messageInfo: null,
  invalidVariables: []
})

// Recipient selector variables
const selectedType = ref('all')
const selectedCustomers = ref([])
const customIds = ref('')
const estimatedCount = ref(0)

// Cost calculations (accounting for multi-part SMS messages)
const messageParts = computed(() => messageValidation.value.messageInfo?.parts || 1)
const filteredCount = computed(() => selectedCustomers.value.length)
const customCount = computed(() => {
  if (!customIds.value) return 0
  const ids = customIds.value.split(',').map(id => id.trim()).filter(id => id.length > 0)
  return [...new Set(ids)].length
})

const totalRecipients = computed(() => {
  if (selectedType.value === 'all') return estimatedCount.value
  if (selectedType.value === 'filtered') return filteredCount.value
  if (selectedType.value === 'custom') return customCount.value
  return 0
})

const totalCost = computed(() => {
  return totalRecipients.value * messageParts.value
})

// Watch for modal open to fetch balance
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchBalance()
    resetForm()
  }
})

// Reset form
const resetForm = () => {
  currentStep.value = 1
  campaign.value = { name: '', message: '' }
  selectedType.value = 'all'
  selectedCustomers.value = []
  customIds.value = ''
  estimatedCount.value = 0
  messageValidation.value = { isValid: false, messageInfo: null, invalidVariables: [] }
}

// Handle message validation
const handleMessageValidation = (validation) => {
  messageValidation.value = validation
}

// Update recipients object
const updateRecipients = () => {
  let recipientData = {
    type: selectedType.value,
    filters: {},
    customer_ids: '',
    totalRecipients: totalRecipients.value,
    totalCost: totalCost.value
  }

  if (selectedType.value === 'filtered') {
    recipientData.customer_ids = selectedCustomers.value.map(c => c.id).join(',')
    recipientData.filters = { type: 'filtered' }
  } else if (selectedType.value === 'custom') {
    recipientData.customer_ids = customIds.value
    recipientData.filters = { type: 'custom' }
  } else if (selectedType.value === 'all') {
    recipientData.filters = { type: 'all' }
  }

  recipients.value = recipientData
}

// Check if can proceed to next step
const canProceed = () => {
  if (currentStep.value === 1) {
    return campaign.value.name && campaign.value.message && messageValidation.value.isValid
  }
  if (currentStep.value === 2) {
    if (selectedType.value === 'all') return estimatedCount.value > 0
    if (selectedType.value === 'filtered') return selectedCustomers.value.length > 0
    if (selectedType.value === 'custom') return customCount.value > 0
    return false
  }
  return false
}

// Navigation
const nextStep = () => {
  if (canProceed() && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Get recipient type label
const getRecipientTypeLabel = () => {
  const labels = {
    all: 'All Customers',
    filtered: 'Filtered Customers',
    custom: 'Custom List'
  }
  return labels[recipients.value.type] || 'All Customers'
}

const getTotalRecipients = () => totalRecipients.value
const getTotalCost = () => totalCost.value

// Check sufficient balance
const hasSufficientBalance = () => {
  return (balance.value?.sms_balance || 0) >= getTotalCost()
}

// Save draft
const saveDraft = async () => {
  try {
    if (!campaign.value.name || !campaign.value.name.trim()) {
      alert('Please enter a campaign name')
      return
    }
    if (!campaign.value.message || !campaign.value.message.trim()) {
      alert('Please enter a campaign message')
      return
    }
    if (getTotalRecipients() === 0) {
      alert('Please select at least one recipient')
      return
    }

    updateRecipients()

    const campaignData = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
      status: 'draft'
    }

    await createCampaign(campaignData)
    alert('Campaign saved as draft! You can find it in your campaigns list.')
    emit('created')
    close()
  } catch (error) {
    alert('Failed to save draft: ' + error.message)
  }
}

// Send campaign
const sendCampaign = async () => {
  if (!campaign.value.name || !campaign.value.name.trim()) {
    alert('Please enter a campaign name')
    return
  }
  if (!campaign.value.message || !campaign.value.message.trim()) {
    alert('Please enter a campaign message')
    return
  }
  if (getTotalRecipients() === 0) {
    alert('Please select at least one recipient')
    return
  }
  if (!hasSufficientBalance()) {
    alert(`Insufficient balance. You need ${getTotalCost() - (balance.value?.sms_balance || 0)} more credits to send this campaign.`)
    return
  }

  try {
    updateRecipients()

    const campaignData = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids
    }

    // Create campaign as draft
    const response = await createCampaign(campaignData)
    const newCampaignId = response.data?.id || response.campaign?.id
    
    if (!newCampaignId) {
      throw new Error('Campaign created but ID not returned')
    }

    // Start the campaign immediately
    await startCampaign(newCampaignId)
    
    alert('Campaign sent successfully! SMS messages are being delivered.')
    emit('created')
    close()
  } catch (error) {
    console.error('❌ Campaign send error:', error)
    alert('Failed to send campaign: ' + error.message)
  }
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
