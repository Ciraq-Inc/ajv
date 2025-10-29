<template>
  <div class="campaign-creator-page">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <nuxt-link
            :to="`/${route.params.pharmacy}/services/sms-campaigns`"
            class="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-2"
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
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
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
          <div :class="['w-24 h-1 mx-4', currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200']"></div>

          <!-- Step 2 -->
          <div class="flex items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
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
          <div :class="['w-24 h-1 mx-4', currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200']"></div>

          <!-- Step 3 -->
          <div class="flex items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
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
                      ? 'border-blue-500 text-blue-600'
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
                      ? 'border-blue-500 text-blue-600'
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
                      ? 'border-blue-500 text-blue-600'
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
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <Icon name="Info" class="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p class="text-sm font-medium text-blue-900 mb-1">Send to All Customers</p>
                    <p class="text-sm text-blue-800">
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
                    <p class="text-2xl font-bold text-blue-600">{{ estimatedCost }} credits</p>
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
                    class="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ showCustomerList ? 'Hide' : 'Show' }} All
                  </button>
                </div>

                <!-- Loading State -->
                <div v-if="isLoadingCustomers" class="flex items-center justify-center py-8">
                  <div class="flex flex-col items-center gap-2">
                    <Icon name="Loader2" class="h-6 w-6 text-blue-600 animate-spin" />
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
                    <!-- <span class="text-xs font-medium text-gray-600">{{ customer.id }}</span> -->
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
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Filter Customers</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Customer Type -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">Customer Type</label>
                    <select
                      v-model="filters.customer_type"
                      @change="updateFilters"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                    </select>
                  </div>

                  <!-- City -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">City</label>
                    <input
                      v-model="filters.city"
                      @input="updateFilters"
                      type="text"
                      placeholder="e.g., Accra"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <!-- Min Orders -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">Minimum Orders</label>
                    <input
                      v-model.number="filters.min_orders"
                      @input="updateFilters"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <!-- Registration Date -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">Registered After</label>
                    <input
                      v-model="filters.registered_after"
                      @input="updateFilters"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div class="mt-4 flex items-center justify-between">
                  <button
                    @click="clearFilters"
                    class="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <Icon name="X" class="h-4 w-4" />
                    Clear Filters
                  </button>
                  <button
                    @click="previewFiltered"
                    class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Icon name="Eye" class="h-4 w-4" />
                    Preview Recipients
                  </button>
                </div>
              </div>

              <!-- Filtered count -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600">Filtered Recipients</p>
                    <p class="text-2xl font-bold text-gray-900">{{ filteredCount }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-600">Estimated Cost</p>
                    <p class="text-2xl font-bold text-blue-600">{{ filteredCost }} credits</p>
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
                  @click="$refs.fileInput.click()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                    <p class="text-2xl font-bold text-blue-600">{{ customCost }} credits</p>
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
                <p class="text-3xl font-bold text-blue-600">{{ totalCost }}</p>
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
          <h3 class="text-lg font-semibold mb-4">Cost Summary</h3>
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
            <Icon name="AlertCircle" class="h-5 w-5 text-red-600 flex-shrink-0" />
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
            @click="saveDraft"
            :disabled="creating"
            class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Save Draft
          </button>

          <button
            v-if="currentStep < 3"
            @click="nextStep"
            :disabled="!canProceed()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <Icon name="ArrowRight" class="h-4 w-4" />
          </button>

          <button
            v-else
            @click="sendCampaign"
            :disabled="creating || !hasSufficientBalance()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon :name="creating ? 'Loader2' : 'Send'" :class="creating ? 'animate-spin' : ''" class="h-4 w-4" />
            {{ creating ? 'Sending...' : 'Send Campaign' }}
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'
import { useSMSBilling } from '~/composables/useSMSBilling'
import { useApi } from '~/composables/useApi'
import { useCompanyStore } from '~/stores/company'
import MessageComposer from '~/components/sms/campaign/MessageComposer.vue'
import TestSmsModal from '~/components/sms/shared/TestSmsModal.vue'

const route = useRoute()

// Define page metadata
definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
  title: 'Create Campaign'
})

const router = useRouter()

const { createCampaign, loading: creating } = useSMSCampaigns()
const { balance, fetchBalance, hasSufficientBalance: checkBalance } = useSMSBilling()
const api = useApi()
const companyStore = useCompanyStore()

const currentStep = ref(1)
const showTestModal = ref(false)

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
const filters = ref({
  customer_type: '',
  city: '',
  min_orders: 0,
  registered_after: ''
})
const customIds = ref('')
const fileInput = ref(null)
const showCustomerList = ref(false)

// Data and loading states
const allCustomers = ref([])
const isLoadingCustomers = ref(false)
const customersError = ref(null)

// Recipient counts
const estimatedCount = ref(0)
const filteredCount = ref(0)
const customCount = computed(() => {
  if (!customIds.value) return 0
  return customIds.value.split(',').filter(id => id.trim()).length
})

// Cost calculations (accounting for multi-part SMS messages)
const messageParts = computed(() => messageValidation.value.messageInfo?.parts || 1)
const estimatedCost = computed(() => estimatedCount.value * messageParts.value)
const filteredCost = computed(() => filteredCount.value * messageParts.value)
const customCost = computed(() => customCount.value * messageParts.value)

const totalRecipients = computed(() => {
  if (selectedType.value === 'all') return estimatedCount.value
  if (selectedType.value === 'filtered') return filteredCount.value
  if (selectedType.value === 'custom') return customCount.value
  return 0
})

const totalCost = computed(() => {
  if (selectedType.value === 'all') return estimatedCost.value
  if (selectedType.value === 'filtered') return filteredCost.value
  if (selectedType.value === 'custom') return customCost.value
  return 0
})

// Load balance on mount
onMounted(() => {
  fetchBalance()
  fetchCustomersFromAPI()
})

// Recipient selector functions
// Fetch customers from API
const fetchCustomersFromAPI = async () => {
  try {
    isLoadingCustomers.value = true
    customersError.value = null
    
    // Get company ID from store or use from props
    const companyId = companyStore.currentCompany?.id || companyStore.selectedCompany?.id
    
    if (!companyId) {
      console.warn('No company ID available')
      allCustomers.value = []
      estimatedCount.value = 0
      return
    }

    // Fetch customers from API
    const response = await api.get(`/api/companies/${companyId}/customers`)
    
    if (response.success && response.data) {
      allCustomers.value = response.data
      estimatedCount.value = response.data.length || response.count || 0
    } else {
      allCustomers.value = []
      estimatedCount.value = 0
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
    customersError.value = error.message || 'Failed to load customers'
    allCustomers.value = []
    estimatedCount.value = 0
  } finally {
    isLoadingCustomers.value = false
  }
}

// Select recipient type
const selectType = (type) => {
  selectedType.value = type
  updateRecipients()
}

// Toggle customer list visibility
const toggleCustomerList = () => {
  showCustomerList.value = !showCustomerList.value
}

// Update filters
const updateFilters = async () => {
  try {
    // Get company ID from store
    const companyId = companyStore.currentCompany?.id || companyStore.selectedCompany?.id

    if (!companyId) {
      filteredCount.value = 0
      updateRecipients()
      return
    }

    // Call API to get filtered customer count
    const response = await api.get(`/api/companies/${companyId}/customers`, {
      params: {
        filters: JSON.stringify(filters.value)
      }
    })

    if (response.success && response.data) {
      filteredCount.value = response.data.length || response.count || 0
    } else {
      filteredCount.value = 0
    }
  } catch (error) {
    console.error('Error fetching filtered customers:', error)
    filteredCount.value = 0
  }
  updateRecipients()
}

// Clear filters
const clearFilters = () => {
  filters.value = {
    customer_type: '',
    city: '',
    min_orders: 0,
    registered_after: ''
  }
  updateFilters()
}

// Preview filtered recipients
const previewFiltered = () => {
  // In production, show modal with recipient list
  alert('Preview functionality will show a list of filtered recipients')
}

// Update custom IDs
const updateCustomIds = () => {
  updateRecipients()
}

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    // Parse CSV and extract IDs/phone numbers
    // For now, just show alert
    alert(`File uploaded: ${file.name}\nCSV parsing will be implemented`)
    customIds.value = '1, 2, 3, 4, 5' // Mock data
  }
  reader.readAsText(file)
}

// Update recipients object
const updateRecipients = () => {
  recipients.value = {
    type: selectedType.value,
    filters: selectedType.value === 'filtered' ? filters.value : {},
    customer_ids: selectedType.value === 'custom' ? customIds.value : '',
    totalRecipients: totalRecipients.value,
    totalCost: totalCost.value
  }
}

// Handle message validation
const handleMessageValidation = (validation) => {
  messageValidation.value = validation
}

// Check if can proceed to next step
const canProceed = () => {
  if (currentStep.value === 1) {
    return campaign.value.name && campaign.value.message && messageValidation.value.isValid
  }
  if (currentStep.value === 2) {
    return true // Recipients always valid
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

// Get total recipients (from inline recipient selector)
const getTotalRecipients = () => {
  return totalRecipients.value
}

// Get total cost (from inline recipient selector)
const getTotalCost = () => {
  return totalCost.value
}

// Check sufficient balance
const hasSufficientBalance = () => {
  return (balance.value?.sms_balance || 0) >= getTotalCost()
}

// Save draft
const saveDraft = async () => {
  try {
    const campaignData = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.type === 'filtered' ? recipients.value.filters : null,
      customer_ids: recipients.value.type === 'custom' ? recipients.value.customer_ids : null,
      status: 'draft'
    }

    await createCampaign(campaignData)
    alert('Campaign saved as draft!')
    router.push(`/${route.params.pharmacy}/services/sms-campaigns`)
  } catch (error) {
    alert('Failed to save draft: ' + error.message)
  }
}

// Send campaign
const sendCampaign = async () => {
  if (!hasSufficientBalance()) {
    alert('Insufficient balance to send this campaign')
    return
  }

  try {
    const campaignData = {
      name: campaign.value.name,
      message: campaign.value.message,
      recipient_type: recipients.value.type,
      filters: recipients.value.type === 'filtered' ? recipients.value.filters : null,
      customer_ids: recipients.value.type === 'custom' ? recipients.value.customer_ids : null
    }

    const response = await createCampaign(campaignData)
    alert('Campaign created successfully! SMS messages are being sent.')
    router.push(`/${route.params.pharmacy}/services/sms-campaigns`)
  } catch (error) {
    alert('Failed to create campaign: ' + error.message)
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
