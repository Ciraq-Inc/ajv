<template>
  <div class="campaign-creator-page">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <nuxt-link
            :to="`/${route.params['pharmacy']}/services/sms-campaigns`"
            class="cs-text flex items-center gap-2 mb-2"
          >
            <Icon name="ArrowLeft" class="h-4 w-4" />
            Back to Campaigns
          </nuxt-link>
          <h1 class="text-3xl font-bold text-gray-900">Create SMS Campaign</h1>
          <p class="text-gray-600 mt-1">Compose and send SMS messages to your customers</p>
        </div>
      </div>
    </div>

    <!-- Progress Steps -->
    <div class="mb-8">
      <div class="flex items-center justify-center">
        <div class="flex items-center">
          <!-- Step 1 -->
          <div class="flex items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                currentStep >= 1 ? 'cs-btn text-white' : 'bg-gray-200 text-gray-600'
              ]"
            >
              1
            </div>
            <div class="ml-3 text-left">
              <p :class="['text-sm font-medium', currentStep >= 1 ? 'text-gray-900' : 'text-gray-500']">
                Campaign Details
              </p>
            </div>
          </div>

          <!-- Connector -->
          <div :class="['w-24 h-1 mx-4', currentStep >= 2 ? 'cs-btn' : 'bg-gray-200']"></div>

          <!-- Step 2 -->
          <div class="flex items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                currentStep >= 2 ? 'cs-btn text-white' : 'bg-gray-200 text-gray-600'
              ]"
            >
              2
            </div>
            <div class="ml-3 text-left">
              <p :class="['text-sm font-medium', currentStep >= 2 ? 'text-gray-900' : 'text-gray-500']">
                Select Recipients
              </p>
            </div>
          </div>

          <!-- Connector -->
          <div :class="['w-24 h-1 mx-4', currentStep >= 3 ? 'cs-btn' : 'bg-gray-200']"></div>

          <!-- Step 3 -->
          <div class="flex items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                currentStep >= 3 ? 'cs-btn text-white' : 'bg-gray-200 text-gray-600'
              ]"
            >
              3
            </div>
            <div class="ml-3 text-left">
              <p :class="['text-sm font-medium', currentStep >= 3 ? 'text-gray-900' : 'text-gray-500']">
                Review & Send
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <!-- Step 1: Campaign Details -->
      <div v-if="currentStep === 1" class="space-y-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Campaign Details</h2>

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
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Select Recipients</h2>

        <!-- Recipient Selector Inline -->
        <div class="recipient-selector">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Select Recipients *
            </label>

            <!-- Recipient Type Tabs -->
            <div class="border-b border-gray-200 mb-4">
              <nav class="flex -mb-px">
                <button
                  @click="selectType('all')"
                  :class="[
                    'px-4 py-2 border-b-2 font-medium text-sm',
                    selectedType === 'all'
                      ? 'cs-selected'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  <Icon name="Users" class="h-4 w-4 inline mr-1" />
                  All Customers
                </button>
                <button
                  @click="selectType('filtered')"
                  :class="[
                    'px-4 py-2 border-b-2 font-medium text-sm',
                    selectedType === 'filtered'
                      ? 'cs-selected'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  <Icon name="Filter" class="h-4 w-4 inline mr-1" />
                  Filtered
                </button>
                <button
                  @click="selectType('custom')"
                  :class="[
                    'px-4 py-2 border-b-2 font-medium text-sm',
                    selectedType === 'custom'
                      ? 'cs-selected'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  <Icon name="Upload" class="h-4 w-4 inline mr-1" />
                  Custom List
                </button>
              </nav>
            </div>

            <!-- All Customers -->
            <div v-if="selectedType === 'all'" class="space-y-4">
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <Icon name="Info" class="h-5 w-5 cs-text flex-shrink-0" />
                  <div>
                    <p class="text-sm font-medium cs-text mb-1">Send to All Customers</p>
                    <p class="text-sm cs-text">
                      Your message will be sent to all customers in your database.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Estimated count -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600">Estimated Recipients</p>
                    <p class="text-2xl font-bold text-gray-900">{{ estimatedCount }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-600">Estimated Cost</p>
                    <p class="text-2xl font-bold cs-text">{{ estimatedCost }} credits</p>
                  </div>
                </div>
              </div>

              <!-- All Customers List -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-semibold text-gray-900">Customer List</h4>
                  <button
                    @click="toggleCustomerList"
                    :disabled="isLoadingCustomers"
                    class="text-xs cs-text font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ showCustomerList ? 'Hide' : 'Show' }} All
                  </button>
                </div>

                <!-- Loading State -->
                <div v-if="isLoadingCustomers" class="flex items-center justify-center py-8">
                  <div class="flex flex-col items-center gap-2">
                    <Icon name="Loader2" class="h-6 w-6 cs-text animate-spin" />
                    <p class="text-sm text-gray-600">Loading customers...</p>
                  </div>
                </div>

                <!-- Error State -->
                <div v-else-if="customersError" class="bg-red-50 border border-red-200 rounded p-3 mb-2">
                  <p class="text-sm text-red-800">{{ customersError }}</p>
                  <button
                    @click="fetchCustomersFromAPI"
                    class="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
                  >
                    Try Again
                  </button>
                </div>

                <!-- Customer List -->
                <div v-else-if="showCustomerList" class="space-y-2 max-h-96 overflow-y-auto">
                  <div
                    v-if="allCustomers.length === 0"
                    class="text-center py-4 text-gray-500"
                  >
                    <p class="text-sm">No customers found</p>
                  </div>
                  <div
                    v-for="(customer, index) in allCustomers"
                    :key="index"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
                  >
                    <div class="flex items-center gap-2">
                      <Icon name="User" class="h-4 w-4 text-gray-400" />
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ customer.name || customer.fname + ' ' + customer.lname }}</p>
                        <p class="text-xs text-gray-500">{{ customer.phone || customer.mobile }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Hidden State Display -->
                <p v-else class="text-xs text-gray-500 text-center py-2">
                  {{ estimatedCount }} customers available
                </p>
              </div>
            </div>

            <!-- Filtered Recipients -->
            <div v-else-if="selectedType === 'filtered'" class="space-y-4">
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <Icon name="Info" class="h-5 w-5 cs-text flex-shrink-0" />
                  <div>
                    <p class="text-sm font-medium cs-text mb-1">Select Specific Customers</p>
                    <p class="text-sm cs-text">
                      Choose individual customers to receive this campaign message.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Search Bar -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-4">
                  <div class="flex-1 relative">
                    <Icon name="Search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      v-model="customerSearchQuery"
                      type="text"
                      placeholder="Search customers by name or phone..."
                      class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg cs-input text-sm"
                    />
                  </div>
                  <button
                    @click="toggleSelectAllFiltered"
                    class="px-4 py-2 text-sm font-medium cs-text cs-border rounded-lg hover:bg-gray-50"
                  >
                    {{ selectedCustomers.length === filteredCustomersList.length ? 'Deselect All' : 'Select All' }}
                  </button>
                </div>

                <!-- Loading State -->
                <div v-if="isLoadingCustomers" class="flex items-center justify-center py-8">
                  <div class="flex flex-col items-center gap-2">
                    <Icon name="Loader2" class="h-6 w-6 cs-text animate-spin" />
                    <p class="text-sm text-gray-600">Loading customers...</p>
                  </div>
                </div>

                <!-- Error State -->
                <div v-else-if="customersError" class="bg-red-50 border border-red-200 rounded p-3">
                  <p class="text-sm text-red-800">{{ customersError }}</p>
                  <button
                    @click="fetchCustomersFromAPI"
                    class="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
                  >
                    Try Again
                  </button>
                </div>

                <!-- Customer Selection List -->
                <div v-else class="space-y-2 max-h-96 overflow-y-auto">
                  <div
                    v-if="filteredCustomersList.length === 0"
                    class="text-center py-4 text-gray-500"
                  >
                    <p class="text-sm">No customers found</p>
                  </div>
                  <div
                    v-for="customer in filteredCustomersList"
                    :key="customer.id"
                    @click="toggleCustomerSelection(customer)"
                    class="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      :checked="isCustomerSelected(customer)"
                      @click.stop="toggleCustomerSelection(customer)"
                      class="h-4 w-4 cs-text border-gray-300 rounded cs-input"
                    />
                    <div class="flex items-center gap-2 flex-1">
                      <Icon name="User" class="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">
                          {{ customer.name || customer.fname + ' ' + customer.lname }}
                        </p>
                        <p class="text-xs text-gray-500">{{ customer.phone || customer.mobile }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selected count -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600">Selected Recipients</p>
                    <p class="text-2xl font-bold text-gray-900">{{ selectedCustomers.length }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-600">Estimated Cost</p>
                    <p class="text-2xl font-bold cs-text">{{ filteredCost }} credits</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Custom List -->
            <div v-else-if="selectedType === 'custom'" class="space-y-4">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Icon name="Upload" class="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h4 class="text-sm font-semibold text-gray-900 mb-2">Upload Customer List</h4>
                <p class="text-sm text-gray-600 mb-4">
                  Upload a CSV file with customer phone numbers
                </p>

                <!-- File Input -->
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv,.txt"
                  @change="handleFileUpload"
                  class="hidden"
                />
                <button
                  @click="fileInput?.click()"
                  class="px-4 py-2 cs-btn text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Choose File
                </button>

                <p class="text-xs text-gray-500 mt-3">
                  Or enter customer IDs separated by commas
                </p>
              </div>

              <!-- Manual Input -->
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-2">Customer IDs (comma-separated)</label>
                <textarea
                  v-model="customIds"
                  @input="updateCustomIds"
                  rows="3"
                  placeholder="e.g., 1, 2, 3, 4, 5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm"
                ></textarea>
              </div>

              <!-- Custom count -->
              <div v-if="customCount > 0" class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600">Custom Recipients</p>
                    <p class="text-2xl font-bold text-gray-900">{{ customCount }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-600">Estimated Cost</p>
                    <p class="text-2xl font-bold cs-text">{{ customCost }} credits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-700">Total Recipients</p>
                <p class="text-3xl font-bold text-gray-900">{{ totalRecipients }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-700">Total Cost</p>
                <p class="text-3xl font-bold cs-text">{{ totalCost }}</p>
                <p class="text-xs text-gray-500">SMS credits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Review & Send -->
      <div v-if="currentStep === 3" class="space-y-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Review Campaign</h2>

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
              {{ messageValidation.messageInfo?.length ?? 0 }} characters,
              {{ messageValidation.messageInfo?.parts ?? 1 }} SMS
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-600">Recipient Type</p>
            <p class="text-lg font-semibold text-gray-900">{{ getRecipientTypeLabel() }}</p>
          </div>
        </div>

        <!-- Cost Summary -->
        <div class="cs-gradient text-white rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Cost Summary</h3>
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
              <span class="text-lg font-semibold">{{ balance?.sms_balance ?? 0 }} credits</span>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-sm">Balance After Campaign:</span>
              <span class="text-lg font-semibold">
                {{ (balance?.sms_balance ?? 0) - getTotalCost() }} credits
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
            <Icon name="AlertCircle" class="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p class="text-sm font-medium text-red-900">Insufficient Balance</p>
              <p class="text-sm text-red-800 mt-1">
                You need {{ getTotalCost() - (balance?.sms_balance ?? 0) }} more credits to send this campaign.
                Please contact admin to top up your balance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          v-if="currentStep > 1"
          @click="previousStep"
          class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
        >
          <Icon name="ArrowLeft" class="h-4 w-4" />
          Previous
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <button
            @click="void saveDraft()"
            :disabled="creating"
            class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Save Draft
          </button>

          <button
            v-if="currentStep < 3"
            @click="nextStep"
            :disabled="!canProceed()"
            class="px-6 py-3 cs-btn text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <Icon name="ArrowRight" class="h-4 w-4" />
          </button>

          <button
            v-else
            @click="void sendCampaign()"
            :disabled="creating || !hasSufficientBalance()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon :name="creating ? 'Loader2' : 'Send'" :class="creating ? 'animate-spin' : ''" class="h-4 w-4" />
            {{ creating ? 'Saving...' : 'Save Campaign' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Test SMS Button (Fixed) -->
    <button
      @click="showTestModal = true"
      class="fixed bottom-6 right-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
    >
      <Icon name="MessageCircle" class="h-5 w-5" />
      Send Test SMS
    </button>

    <!-- Test SMS Modal -->
    <TestSmsModal :is-open="showTestModal" @close="showTestModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import MessageComposer from '~/components/sms/campaign/MessageComposer.vue'
import TestSmsModal from '~/components/sms/shared/TestSmsModal.vue'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'Create Campaign',
})

interface Customer {
  id: number | string
  name?: string | null
  fname?: string | null
  lname?: string | null
  phone?: string | null
  mobile?: string | null
}

interface MessageInfo {
  length?: number
  parts?: number
}

interface MessageValidation {
  isValid: boolean
  messageInfo: MessageInfo | null
  invalidVariables: string[]
}

interface RecipientsState {
  type: string
  filters: Record<string, unknown>
  customer_ids: string
  totalRecipients: number
  totalCost: number
}

interface BalanceData {
  sms_balance?: number | null
  [key: string]: unknown
}

interface ApiResponse {
  success?: boolean
  data?: Customer[] | null
  count?: number | null
  [key: string]: unknown
}

// TODO: remove once composables/ are .ts
const { createCampaign, loading: creating } = useSMSCampaigns() as unknown as {
  createCampaign: (data: Record<string, unknown>) => Promise<unknown>
  loading: import('vue').Ref<boolean>
}

// TODO: remove once composables/ are .ts
const { balance, fetchBalance, hasSufficientBalance: checkBalance } = useSMSBilling() as unknown as {
  balance: import('vue').Ref<BalanceData | null>
  fetchBalance: () => Promise<void>
  hasSufficientBalance: (cost: number) => boolean
}

// TODO: remove once composables/ are .ts
const api = useApi() as unknown as {
  get: (url: string) => Promise<ApiResponse>
}

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  currentCompany?: { id?: number | string | null } | null
  selectedCompany?: { id?: number | string | null } | null
}

const route = useRoute()
const router = useRouter()

const currentStep = ref<number>(1)
const showTestModal = ref<boolean>(false)

const campaign = ref<{ name: string; message: string }>({
  name: '',
  message: '',
})

const recipients = ref<RecipientsState>({
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

const selectedType = ref<string>('all')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const filters = ref<{
  customer_type: string
  city: string
  min_orders: number
  registered_after: string
}>({
  customer_type: '',
  city: '',
  min_orders: 0,
  registered_after: '',
})
const customIds = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)
const showCustomerList = ref<boolean>(false)

const allCustomers = ref<Customer[]>([])
const isLoadingCustomers = ref<boolean>(false)
const customersError = ref<string | null>(null)

const selectedCustomers = ref<Customer[]>([])
const customerSearchQuery = ref<string>('')

const estimatedCount = ref<number>(0)
const filteredCount = computed<number>(() => selectedCustomers.value.length)
const customCount = computed<number>(() => {
  if (!customIds.value) return 0
  const ids = customIds.value.split(',').map((id) => id.trim()).filter((id) => id.length > 0)
  return [...new Set(ids)].length
})

const messageParts = computed<number>(() => messageValidation.value.messageInfo?.parts ?? 1)
const estimatedCost = computed<number>(() => estimatedCount.value * messageParts.value)
const filteredCost = computed<number>(() => filteredCount.value * messageParts.value)
const customCost = computed<number>(() => customCount.value * messageParts.value)

const filteredCustomersList = computed<Customer[]>(() => {
  if (!customerSearchQuery.value) {
    return allCustomers.value
  }
  const query = customerSearchQuery.value.toLowerCase()
  return allCustomers.value.filter((customer) => {
    const name = (customer.name ?? ((customer.fname ?? '') + ' ' + (customer.lname ?? '')) ?? '').toLowerCase()
    const phone = (customer.phone ?? customer.mobile ?? '').toLowerCase()
    return name.includes(query) || phone.includes(query)
  })
})

const totalRecipients = computed<number>(() => {
  if (selectedType.value === 'all') return estimatedCount.value
  if (selectedType.value === 'filtered') return filteredCount.value
  if (selectedType.value === 'custom') return customCount.value
  return 0
})

const totalCost = computed<number>(() => {
  if (selectedType.value === 'all') return estimatedCost.value
  if (selectedType.value === 'filtered') return filteredCost.value
  if (selectedType.value === 'custom') return customCost.value
  return 0
})

onMounted(() => {
  void fetchBalance()
  void fetchCustomersFromAPI()
})

const fetchCustomersFromAPI = async (): Promise<void> => {
  try {
    isLoadingCustomers.value = true
    customersError.value = null

    const companyId = companyStore.currentCompany?.id ?? companyStore.selectedCompany?.id

    if (!companyId) {
      console.warn('No company ID available')
      allCustomers.value = []
      estimatedCount.value = 0
      return
    }

    const response = await api.get(`/api/companies/${String(companyId)}/customers`)

    if (response.success && response.data) {
      allCustomers.value = response.data
      estimatedCount.value = response.data.length
    } else {
      allCustomers.value = []
      estimatedCount.value = 0
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
    customersError.value = error instanceof Error ? error.message : 'Failed to load customers'
    allCustomers.value = []
    estimatedCount.value = 0
  } finally {
    isLoadingCustomers.value = false
  }
}

const selectType = (type: string): void => {
  selectedType.value = type
  if (type === 'filtered') {
    selectedCustomers.value = []
  }
  updateRecipients()
}

const toggleCustomerList = (): void => {
  showCustomerList.value = !showCustomerList.value
}

const toggleCustomerSelection = (customer: Customer): void => {
  const index = selectedCustomers.value.findIndex((c) => c.id === customer.id)
  if (index > -1) {
    selectedCustomers.value.splice(index, 1)
  } else {
    selectedCustomers.value.push(customer)
  }
  updateRecipients()
}

const isCustomerSelected = (customer: Customer): boolean => {
  return selectedCustomers.value.some((c) => c.id === customer.id)
}

const toggleSelectAllFiltered = (): void => {
  if (selectedCustomers.value.length === filteredCustomersList.value.length) {
    selectedCustomers.value = []
  } else {
    selectedCustomers.value = [...filteredCustomersList.value]
  }
  updateRecipients()
}

const updateCustomIds = (): void => {
  updateRecipients()
}

const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    try {
      const content = e.target?.result as string | null
      if (!content) return
      const lines = content.trim().split('\n')

      let extractedIds: string[] = []

      if (file.name.endsWith('.csv')) {
        if (lines.length > 1) {
          const dataLines = lines.slice(1)
          extractedIds = dataLines
            .map((line) => (line.split(',')[0] ?? '').trim())
            .filter((id) => id.length > 0)
        }
      } else {
        extractedIds = lines.filter((line) => line.trim().length > 0)
      }

      if (extractedIds.length === 0) {
        alert(`No valid IDs found in ${file.name}`)
        return
      }

      const uniqueIds = [...new Set(extractedIds)]
      customIds.value = uniqueIds.join(', ')

      alert(`Successfully imported ${uniqueIds.length} customer${uniqueIds.length !== 1 ? 's' : ''} from ${file.name}`)
    } catch (error) {
      alert(`Error parsing file: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      target.value = ''
    }
  }
  reader.onerror = (): void => {
    alert('Error reading file')
    target.value = ''
  }
  reader.readAsText(file)
}

const updateRecipients = (): void => {
  const recipientData: RecipientsState = {
    type: selectedType.value,
    filters: {},
    customer_ids: '',
    totalRecipients: totalRecipients.value,
    totalCost: totalCost.value,
  }

  if (selectedType.value === 'filtered') {
    recipientData.customer_ids = selectedCustomers.value.map((c) => String(c.id)).join(',')
    recipientData.filters = { type: 'filtered' }
  } else if (selectedType.value === 'custom') {
    recipientData.customer_ids = customIds.value
    recipientData.filters = { type: 'custom' }
  } else if (selectedType.value === 'all') {
    recipientData.filters = { type: 'all' }
  }

  recipients.value = recipientData
}

const handleMessageValidation = (validation: MessageValidation): void => {
  messageValidation.value = validation
}

const canProceed = (): boolean => {
  if (currentStep.value === 1) {
    return Boolean(campaign.value.name && campaign.value.message && messageValidation.value.isValid)
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
  if (canProceed() && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = (): void => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const getRecipientTypeLabel = (): string => {
  const labels: Record<string, string> = {
    all: 'All Customers',
    filtered: 'Filtered Customers',
    custom: 'Custom List',
  }
  return (labels[recipients.value.type] !== undefined ? labels[recipients.value.type] : undefined) ?? 'All Customers'
}

const getTotalRecipients = (): number => totalRecipients.value

const getTotalCost = (): number => totalCost.value

const hasSufficientBalance = (): boolean => {
  return (balance.value?.sms_balance ?? 0) >= getTotalCost()
}

const saveDraft = async (): Promise<void> => {
  try {
    if (!campaign.value.name.trim()) {
      alert('Please enter a campaign name')
      return
    }
    if (!campaign.value.message.trim()) {
      alert('Please enter a campaign message')
      return
    }
    if (getTotalRecipients() === 0) {
      alert('Please select at least one recipient')
      return
    }

    updateRecipients()

    const campaignData: Record<string, unknown> = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
      status: 'draft',
    }

    await createCampaign(campaignData)
    alert('Campaign saved as draft!')
    void router.push(`/${String(route.params['pharmacy'])}/services/sms-campaigns`)
  } catch (error) {
    alert('Failed to save draft: ' + (error instanceof Error ? error.message : String(error)))
  }
}

const sendCampaign = async (): Promise<void> => {
  if (!campaign.value.name.trim()) {
    alert('Please enter a campaign name')
    return
  }
  if (!campaign.value.message.trim()) {
    alert('Please enter a campaign message')
    return
  }
  if (getTotalRecipients() === 0) {
    alert('Please select at least one recipient')
    return
  }
  if (!hasSufficientBalance()) {
    alert(`Insufficient balance. You need ${getTotalCost() - (balance.value?.sms_balance ?? 0)} more credits to send this campaign.`)
    return
  }

  try {
    updateRecipients()

    const campaignData: Record<string, unknown> = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.filters,
      customer_ids: recipients.value.customer_ids,
    }

    console.log('Sending Campaign Data:', {
      type: recipients.value.type,
      customer_ids: recipients.value.customer_ids,
      recipient_count: getTotalRecipients(),
      filters: recipients.value.filters,
    })

    await createCampaign(campaignData)
    alert('Campaign created successfully! SMS messages are being sent.')
    void router.push(`/${String(route.params['pharmacy'])}/services/sms-campaigns`)
  } catch (error) {
    console.error('Campaign creation error:', error)
    alert('Failed to create campaign: ' + (error instanceof Error ? error.message : String(error)))
  }
}
</script>

<style scoped>
.campaign-creator-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
