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
                <h2 class="text-2xl font-bold text-gray-900">Edit SMS Campaign</h2>
                <p class="text-sm text-gray-600 mt-1">Update your campaign details and recipients</p>
              </div>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="px-6 py-12 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3">
              <ArrowPathIcon class="h-8 w-8 text-blue-600 animate-spin" />
              <p class="text-sm text-gray-600">Loading campaign...</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="loadError" class="px-6 py-12">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p class="text-sm font-medium text-red-900">Failed to load campaign</p>
                  <p class="text-sm text-red-800 mt-1">{{ loadError }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div v-else class="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <div class="space-y-6">
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

              <!-- Recipients Section -->
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Recipients</h3>
                
                <RecipientSelector
                  v-model:selected-type="selectedType"
                  v-model:selected-customers="selectedCustomers"
                  v-model:custom-ids="customIds"
                  v-model:estimated-count="estimatedCount"
                  :message-parts="messageParts"
                  @update="updateRecipients"
                />
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
          <div v-if="!loading && !loadError" class="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div class="flex items-center justify-between">
              <button
                @click="close"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Cancel
              </button>

              <div class="flex items-center gap-3">
                <button
                  @click="saveChanges"
                  :disabled="saving || !canSave()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon v-if="saving" class="h-4 w-4 animate-spin" />
                  <span>{{ saving ? 'Saving...' : 'Save Changes' }}</span>
                </button>

                <button
                  v-if="campaignData?.status === 'draft'"
                  @click="saveAndSend"
                  :disabled="saving || !canSave() || !hasSufficientBalance()"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon v-if="saving" class="h-4 w-4 animate-spin" />
                  <PaperAirplaneIcon v-else class="h-4 w-4" />
                  <span>{{ saving ? 'Sending...' : 'Save & Send' }}</span>
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
import { ref, computed, watch, onMounted } from 'vue'
import { 
  XMarkIcon, 
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
  },
  campaignId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close', 'updated'])

const { fetchCampaign, updateCampaign, startCampaign } = useSMSCampaigns()
const { balance, fetchBalance } = useSMSBilling()

const loading = ref(false)
const saving = ref(false)
const loadError = ref(null)
const campaignData = ref(null)

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

// Cost calculations
const messageParts = computed(() => messageValidation.value.messageInfo?.parts || 1)

const totalRecipients = computed(() => {
  if (selectedType.value === 'all') return estimatedCount.value
  if (selectedType.value === 'filtered') return selectedCustomers.value.length
  if (selectedType.value === 'custom') {
    if (!customIds.value) return 0
    const lines = customIds.value.split('\n').filter(line => line.trim().length > 0)
    return lines.length
  }
  return 0
})

const totalCost = computed(() => {
  return totalRecipients.value * messageParts.value
})

// Watch for modal open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.campaignId) {
    loadCampaign()
    fetchBalance()
  }
})

// Load campaign data
const loadCampaign = async () => {
  try {
    loading.value = true
    loadError.value = null
    
    const response = await fetchCampaign(props.campaignId)
    campaignData.value = response.data || response.campaign
    
    // Populate form
    campaign.value.name = campaignData.value.name || ''
    campaign.value.message = campaignData.value.message || ''
    
    // Set recipient type
    selectedType.value = campaignData.value.recipient_type || 'all'
    
    // Parse customer_ids if present
    if (campaignData.value.customer_ids) {
      if (selectedType.value === 'filtered') {
        // For filtered type, we need to fetch the actual customer objects
        // For now, just store the IDs as comma-separated string
        customIds.value = campaignData.value.customer_ids
      } else if (selectedType.value === 'custom') {
        customIds.value = campaignData.value.customer_ids
      }
    }
    
  } catch (error) {
    console.error('Error loading campaign:', error)
    loadError.value = error.message || 'Failed to load campaign'
  } finally {
    loading.value = false
  }
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

// Check if can save
const canSave = () => {
  return campaign.value.name && 
         campaign.value.message && 
         messageValidation.value.isValid &&
         totalRecipients.value > 0
}

// Get totals
const getTotalRecipients = () => totalRecipients.value
const getTotalCost = () => totalCost.value

// Check sufficient balance
const hasSufficientBalance = () => {
  return (balance.value?.sms_balance || 0) >= getTotalCost()
}

// Save changes
const saveChanges = async () => {
  try {
    if (!canSave()) {
      alert('Please fill in all required fields')
      return
    }

    saving.value = true
    updateRecipients()

    const updateData = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids
    }

    await updateCampaign(props.campaignId, updateData)
    alert('Campaign updated successfully!')
    emit('updated')
    close()
  } catch (error) {
    console.error('Error updating campaign:', error)
    alert('Failed to update campaign: ' + error.message)
  } finally {
    saving.value = false
  }
}

// Save and send
const saveAndSend = async () => {
  try {
    if (!canSave()) {
      alert('Please fill in all required fields')
      return
    }

    if (!hasSufficientBalance()) {
      alert(`Insufficient balance. You need ${getTotalCost() - (balance.value?.sms_balance || 0)} more credits to send this campaign.`)
      return
    }

    saving.value = true
    updateRecipients()

    // First update the campaign
    const updateData = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids
    }

    await updateCampaign(props.campaignId, updateData)
    
    // Then start it
    await startCampaign(props.campaignId)
    
    alert('Campaign updated and started! SMS messages are being sent.')
    emit('updated')
    close()
  } catch (error) {
    console.error('Error updating and sending campaign:', error)
    alert('Failed to update and send campaign: ' + error.message)
  } finally {
    saving.value = false
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
