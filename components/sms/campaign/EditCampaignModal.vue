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
                class="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="px-6 py-12 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3">
              <ArrowPathIcon class="h-8 w-8 cs-text animate-spin" />
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
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg cs-input"
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
          <div v-if="(formError || formSuccess) && !loading && !loadError" class="px-6 pt-4">
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
                  class="px-4 py-2 cs-btn text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  XMarkIcon,
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
const props = defineProps<{
  isOpen: boolean
  campaignId?: number | string | null
}>()

const emit = defineEmits<{ close: []; updated: [] }>()

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

interface CampaignRecord {
  name?: string
  message?: string
  recipient_type?: string
  customer_ids?: string
  status?: string
  [key: string]: unknown
}

interface Customer { id: number | string; [key: string]: unknown }

const { fetchCampaign, updateCampaign, startCampaign } = useSMSCampaigns()
const { balance, fetchBalance } = useSMSBilling()

const loading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)
const campaignData = ref<CampaignRecord | null>(null)

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

const totalRecipients = computed<number>(() => {
  if (selectedType.value === 'all') return estimatedCount.value
  if (selectedType.value === 'filtered') return selectedCustomers.value.length
  if (selectedType.value === 'custom') {
    if (!customIds.value) return 0
    return customIds.value.split('\n').filter((line) => line.trim().length > 0).length
  }
  return 0
})

const totalCost = computed<number>(() => totalRecipients.value * messageParts.value)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.campaignId) {
      formError.value = null
      formSuccess.value = null
      loadCampaign()
      fetchBalance()
    }
  },
)

const loadCampaign = async (): Promise<void> => {
  try {
    loading.value = true
    loadError.value = null

    campaignData.value = await fetchCampaign(props.campaignId ?? '') as CampaignRecord

    if (campaignData.value) {
      campaign.value.name = String(campaignData.value.name ?? '')
      campaign.value.message = String(campaignData.value.message ?? '')
      selectedType.value = String(campaignData.value.recipient_type ?? 'all')

      if (campaignData.value.customer_ids) {
        customIds.value = String(campaignData.value.customer_ids)
      }
    }
  } catch (error: unknown) {
    console.error('Error loading campaign:', error)
    loadError.value = error instanceof Error ? error.message : 'Failed to load campaign'
  } finally {
    loading.value = false
  }
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
  } else {
    recipientData.filters = { type: 'all' }
  }

  recipients.value = recipientData
}

const canSave = (): boolean =>
  !!(campaign.value.name && campaign.value.message && messageValidation.value.isValid && totalRecipients.value > 0)

const getTotalRecipients = (): number => totalRecipients.value
const getTotalCost = (): number => totalCost.value

const getSmsBalance = (): number =>
  (balance.value as { sms_balance?: number } | null)?.sms_balance ?? 0

const hasSufficientBalance = (): boolean => getSmsBalance() >= getTotalCost()

const saveChanges = async (): Promise<void> => {
  formError.value = null
  formSuccess.value = null
  if (!canSave()) { formError.value = 'Please fill in all required fields'; return }
  saving.value = true
  try {
    updateRecipients()
    await updateCampaign(props.campaignId ?? '', {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
    })
    emit('updated')
    close()
  } catch (error: unknown) {
    console.error('Error updating campaign:', error)
    formError.value = 'Failed to update campaign: ' + (error instanceof Error ? error.message : String(error))
  } finally {
    saving.value = false
  }
}

const saveAndSend = async (): Promise<void> => {
  formError.value = null
  formSuccess.value = null
  if (!canSave()) { formError.value = 'Please fill in all required fields'; return }
  if (!hasSufficientBalance()) {
    formError.value = `Insufficient balance. You need ${getTotalCost() - getSmsBalance()} more credits.`
    return
  }
  saving.value = true
  try {
    updateRecipients()
    await updateCampaign(props.campaignId ?? '', {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
    })
    await startCampaign(props.campaignId ?? '')
    formSuccess.value = 'Campaign updated and started! SMS messages are being sent.'
    emit('updated')
    setTimeout(close, 1500)
  } catch (error: unknown) {
    console.error('Error updating and sending campaign:', error)
    formError.value = 'Failed to update and send campaign: ' + (error instanceof Error ? error.message : String(error))
  } finally {
    saving.value = false
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
