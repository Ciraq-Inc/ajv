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
                class="text-gray-500 hover:text-gray-700 transition-colors"
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
                      currentStep >= 1 ? 'cs-btn text-white' : 'bg-gray-200 text-gray-600'
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
                <div :class="['w-16 h-1 mx-3', currentStep >= 2 ? 'cs-btn' : 'bg-gray-200']"></div>

                <!-- Step 2 -->
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                      currentStep >= 2 ? 'cs-btn text-white' : 'bg-gray-200 text-gray-600'
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
                <div :class="['w-16 h-1 mx-3', currentStep >= 3 ? 'cs-btn' : 'bg-gray-200']"></div>

                <!-- Step 3 -->
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                      currentStep >= 3 ? 'cs-btn text-white' : 'bg-gray-200 text-gray-600'
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
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg cs-input"
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
              <div class="cs-gradient text-white rounded-lg p-6">
                <h4 class="text-lg font-semibold mb-4">Cost Summary</h4>
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <p class="text-sm text-purple-100">Total Recipients</p>
                    <p class="text-3xl font-bold">{{ getTotalRecipients() }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-purple-100">Total Cost</p>
                    <p class="text-3xl font-bold">{{ getTotalCost() }} credits</p>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-purple-400">
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

          <!-- Inline notifications -->
          <div v-if="formError || formSuccess" class="px-6 pt-4">
            <div v-if="formError" class="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-red-700">{{ formError }}</p>
            </div>
            <div v-if="formSuccess" class="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon class="h-5 w-5 text-green-600 flex-shrink-0" />
              <p class="text-sm text-green-700">{{ formSuccess }}</p>
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
                  class="px-4 py-2 cs-btn text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import { useSMSBilling } from '~/composables/useSMSBilling'
import MessageComposer from '~/components/sms/campaign/MessageComposer.vue'
import RecipientSelector from '~/components/sms/campaign/RecipientSelector.vue'

// TODO: remove once composables/ are .ts
const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; created: [] }>()

interface MessageValidation {
  isValid: boolean
  messageInfo: { parts: number; length: number } | null
  invalidVariables: string[]
}

interface Recipients {
  type: string
  filters: Record<string, unknown>
  customer_ids: string
  totalRecipients: number
  totalCost: number
}

interface Customer { id: number | string; [key: string]: unknown }

const { createCampaign, startCampaign, loading: creating } = useSMSCampaigns()
const { balance, fetchBalance } = useSMSBilling()

const currentStep = ref(1)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)
const campaign = ref({ name: '', message: '' })
const recipients = ref<Recipients>({
  type: 'all',
  filters: {},
  customer_ids: '',
  totalRecipients: 0,
  totalCost: 0,
})
const messageValidation = ref<MessageValidation>({
  isValid: false,
  messageInfo: null,
  invalidVariables: [],
})

const selectedType = ref('all')
const selectedCustomers = ref<Customer[]>([])
const customIds = ref('')
const estimatedCount = ref(0)

const messageParts = computed<number>(() => messageValidation.value.messageInfo?.parts ?? 1)
const filteredCount = computed<number>(() => selectedCustomers.value.length)
const customCount = computed<number>(() => {
  if (!customIds.value) return 0
  const lines = customIds.value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
  return [...new Set(lines)].length
})

const totalRecipients = computed<number>(() => {
  if (selectedType.value === 'all') return estimatedCount.value
  if (selectedType.value === 'filtered') return filteredCount.value
  if (selectedType.value === 'custom') return customCount.value
  return 0
})

const totalCost = computed<number>(() => totalRecipients.value * messageParts.value)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchBalance()
      resetForm()
    }
  },
)

const resetForm = (): void => {
  currentStep.value = 1
  formError.value = null
  formSuccess.value = null
  campaign.value = { name: '', message: '' }
  selectedType.value = 'all'
  selectedCustomers.value = []
  customIds.value = ''
  estimatedCount.value = 0
  messageValidation.value = { isValid: false, messageInfo: null, invalidVariables: [] }
}

const handleMessageValidation = (validation: MessageValidation): void => {
  messageValidation.value = validation
}

const updateRecipients = (): void => {
  const recipientData: Recipients = {
    type: selectedType.value,
    filters: {},
    customer_ids: '',
    totalRecipients: totalRecipients.value,
    totalCost: totalCost.value,
  }

  if (selectedType.value === 'filtered') {
    recipientData.customer_ids = selectedCustomers.value.map((c) => c.id).join(',')
    recipientData.filters = { type: 'filtered' }
  } else if (selectedType.value === 'custom') {
    recipientData.customer_ids = customIds.value
    recipientData.filters = { type: 'custom' }
  } else if (selectedType.value === 'all') {
    recipientData.filters = { type: 'all' }
  }

  recipients.value = recipientData
}

const canProceed = (): boolean => {
  if (currentStep.value === 1) {
    return !!(campaign.value.name && campaign.value.message && messageValidation.value.isValid)
  }
  if (currentStep.value === 2) {
    if (selectedType.value === 'all') return estimatedCount.value > 0
    if (selectedType.value === 'filtered') return selectedCustomers.value.length > 0
    if (selectedType.value === 'custom') return customCount.value > 0
    return false
  }
  return false
}

const nextStep = (): void => {
  if (canProceed() && currentStep.value < 3) currentStep.value++
}

const previousStep = (): void => {
  if (currentStep.value > 1) currentStep.value--
}

const getRecipientTypeLabel = (): string => {
  const labels: Record<string, string> = {
    all: 'All Customers',
    filtered: 'Filtered Customers',
    custom: 'Custom List',
  }
  return labels[recipients.value.type] ?? 'All Customers'
}

const getTotalRecipients = (): number => totalRecipients.value
const getTotalCost = (): number => totalCost.value

const hasSufficientBalance = (): boolean => {
  // balance is untyped (composable not yet .ts)
  const smsBalance = (balance.value as { sms_balance?: number } | null)?.sms_balance ?? 0
  return smsBalance >= getTotalCost()
}

const saveDraft = async (): Promise<void> => {
  formError.value = null
  formSuccess.value = null
  if (!campaign.value.name?.trim()) { formError.value = 'Please enter a campaign name'; return }
  if (!campaign.value.message?.trim()) { formError.value = 'Please enter a campaign message'; return }
  if (getTotalRecipients() === 0) { formError.value = 'Please select at least one recipient'; return }

  try {
    updateRecipients()
    await createCampaign({
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
      status: 'draft',
    })
    emit('created')
    close()
  } catch (error: unknown) {
    formError.value = 'Failed to save draft: ' + (error instanceof Error ? error.message : String(error))
  }
}

const sendCampaign = async (): Promise<void> => {
  formError.value = null
  formSuccess.value = null
  if (!campaign.value.name?.trim()) { formError.value = 'Please enter a campaign name'; return }
  if (!campaign.value.message?.trim()) { formError.value = 'Please enter a campaign message'; return }
  if (getTotalRecipients() === 0) { formError.value = 'Please select at least one recipient'; return }

  const smsBalance = (balance.value as { sms_balance?: number } | null)?.sms_balance ?? 0
  if (!hasSufficientBalance()) {
    formError.value = `Insufficient balance. You need ${getTotalCost() - smsBalance} more credits to send this campaign.`
    return
  }

  try {
    updateRecipients()
    const newCampaign = await createCampaign({
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
    }) as { id: number }

    const newCampaignId = newCampaign.id
    if (!newCampaignId) throw new Error('Campaign created but ID not returned')

    await startCampaign(newCampaignId)
    formSuccess.value = 'Campaign sent! SMS messages are being delivered.'
    emit('created')
    setTimeout(close, 1500)
  } catch (error: unknown) {
    console.error('Campaign send error:', error)
    formError.value = 'Failed to send campaign: ' + (error instanceof Error ? error.message : String(error))
  }
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
