<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click="handleBackdropClick"
    >
      <div
        class="bg-white rounded-lg max-w-md w-full shadow-xl max-h-[95vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 md:mb-6 p-4 md:p-6 pb-0">
          <h3 class="text-lg md:text-xl font-bold text-gray-900">Top Up Money Balance</h3>
          <button
            @click="close"
            class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            :disabled="processing"
          >
            <Icon name="X" class="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        <!-- Current Balance Display -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6 mx-4 md:mx-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs md:text-sm text-blue-600 font-medium mb-1">Current Money Balance</p>
              <p class="text-xl md:text-2xl font-bold text-blue-900">GH₵ {{ formatMoney(currentBalance) }}</p>
            </div>
            <Icon name="Wallet" class="h-8 w-8 md:h-10 md:w-10 text-blue-400" />
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4 md:space-y-5 px-4 md:px-6">
          <!-- Amount Input -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              Amount to Add (GH₵) *
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-sm md:text-base text-gray-500 font-medium">GH₵</span>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                required
                placeholder="0.00"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                :disabled="processing"
                @input="calculateTotal"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Maximum GH₵10,000 per transaction
            </p>
          </div>

          <!-- Email Input -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
              Email Address *
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="your@email.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              :disabled="processing"
            />
            <p class="text-xs text-gray-500 mt-1">
              Payment receipt will be sent to this email
            </p>
          </div>

          <!-- Auto-Purchase SMS Credits Toggle -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
            <div class="flex items-start gap-2 md:gap-3">
              <input
                id="autoPurchaseSMS"
                v-model="form.autoPurchaseSMS"
                type="checkbox"
                class="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                :disabled="processing"
              />
              <div class="flex-1">
                <label for="autoPurchaseSMS" class="block text-xs md:text-sm font-medium text-blue-900 cursor-pointer">
                  Automatically convert to SMS credits
                </label>
                <p class="text-xs text-blue-700 mt-1">
                  After payment, your money balance will be automatically converted to SMS credits at the current rate (GH₵{{ smsRate }} per SMS)
                </p>
                <p v-if="form.amount && form.autoPurchaseSMS" class="text-xs font-medium text-blue-800 mt-2">
                  → You'll receive approximately {{ estimatedSMSCredits }} SMS credits
                </p>
              </div>
            </div>
          </div>

          <!-- Fee Breakdown -->
          <div v-if="form.amount && form.amount > 0" class="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 space-y-1.5 md:space-y-2">
            <div class="flex justify-between text-xs md:text-sm">
              <span class="text-gray-600">Amount to Credit:</span>
              <span class="font-medium text-gray-900">GH₵ {{ formatMoney(form.amount) }}</span>
            </div>
            <div class="flex justify-between text-xs md:text-sm">
              <span class="text-gray-600">Paystack Fee (1.95% + GH₵0.50):</span>
              <span class="font-medium text-gray-900">GH₵ {{ formatMoney(paystackFee) }}</span>
            </div>
            <div class="border-t border-gray-300 pt-1.5 md:pt-2 mt-1.5 md:mt-2">
              <div class="flex justify-between">
                <span class="font-semibold text-gray-900 text-xs md:text-sm">Total to Pay:</span>
                <span class="font-bold text-blue-600 text-base md:text-lg">GH₵ {{ formatMoney(totalAmount) }}</span>
              </div>
            </div>
          </div>

          <!-- Preview After Top-up -->
          <!-- <div v-if="form.amount && form.amount > 0" class="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs md:text-sm text-green-600 font-medium mb-1">Balance After Top-up</p>
                <p class="text-xl md:text-2xl font-bold text-green-900">GH₵ {{ formatMoney(balanceAfterTopup) }}</p>
              </div>
              <Icon name="TrendingUp" class="h-6 w-6 md:h-8 md:w-8 text-green-400" />
            </div>
          </div> -->

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-2.5 md:p-3">
            <div class="flex items-start gap-2">
              <Icon name="AlertCircle" class="h-4 w-4 md:h-5 md:w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p class="text-xs md:text-sm text-red-800">{{ error }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base"
              :disabled="processing"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!canSubmit || processing"
              class="px-4 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md text-sm md:text-base"
            >
              <Icon v-if="processing" name="Loader2" class="animate-spin h-4 w-4 md:h-5 md:w-5" />
              <Icon v-else name="CreditCard" class="h-4 w-4 md:h-5 md:w-5" />
              {{ processing ? 'Processing...' : 'Pay with Paystack' }}
            </button>
          </div>
        </form>
        <div class="h-4 md:h-6"></div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePaystack } from '~/composables/usePaystack'
import { useApi } from '~/composables/useApi'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  currentBalance: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'success'])

const { initializePayment } = usePaystack()
const { post, get } = useApi()

const form = ref({
  amount: null,
  email: '',
  autoPurchaseSMS: true // Default to true
})

const processing = ref(false)
const error = ref('')
const smsRate = ref(0.05) // Default SMS rate

// Calculate Paystack fees
const paystackFee = computed(() => {
  if (!form.value.amount || form.value.amount <= 0) return 0
  return (form.value.amount * 0.0195) + 0.50
})

const totalAmount = computed(() => {
  if (!form.value.amount || form.value.amount <= 0) return 0
  return form.value.amount + paystackFee.value
})

const balanceAfterTopup = computed(() => {
  // If auto-purchase SMS is enabled, balance stays the same (money converted to SMS)
  // If disabled, balance increases by the amount
  if (form.value.autoPurchaseSMS) {
    return props.currentBalance
  }
  return props.currentBalance + (form.value.amount || 0)
})

const estimatedSMSCredits = computed(() => {
  if (!form.value.amount || form.value.amount <= 0) return 0
  return Math.floor(form.value.amount / smsRate.value)
})

const canSubmit = computed(() => {
  return form.value.amount && 
         form.value.amount > 0 && 
         form.value.amount <= 10000 &&
         form.value.email && 
         form.value.email.includes('@') &&
         !processing.value
})

// Fetch SMS rate on mount
const fetchSMSRate = async () => {
  try {
    const response = await get('/api/sms-credits/rate')
    if (response.success && response.data) {
      smsRate.value = response.data.rate || response.data.sms_rate || 0.05
    }
  } catch (err) {
    console.warn('Could not fetch SMS rate, using default:', err)
    smsRate.value = 0.05
  }
}

const calculateTotal = () => {
  // Trigger reactivity for computed properties
  form.value = { ...form.value }
}

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return parseFloat(amount).toFixed(2)
}

const close = () => {
  if (!processing.value) {
    form.value = { amount: null, email: '' }
    error.value = ''
    emit('close')
  }
}

const handleBackdropClick = () => {
  if (!processing.value) {
    close()
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  processing.value = true
  error.value = ''

  try {
    console.log('=== Starting Paystack Payment ===')
    console.log('Amount:', form.value.amount)
    console.log('Email:', form.value.email)
    console.log('Auto-purchase SMS:', form.value.autoPurchaseSMS)
    
    // Step 1: Initialize payment with backend
    console.log('Step 1: Initializing payment with backend...')
    const initResponse = await post('/api/sms-credits/paystack/initialize', {
      amount: form.value.amount,
      email: form.value.email,
      auto_purchase_sms: form.value.autoPurchaseSMS
    })
    
    console.log('Backend response:', initResponse)

    if (!initResponse.success) {
      throw new Error(initResponse.message || 'Failed to initialize payment')
    }

    const { reference, amount, email, metadata } = initResponse.data

    // Step 2: Open Paystack popup
    await initializePayment(
      { 
        amount, 
        email, 
        reference, 
        metadata 
      },
      async (response) => {
        // Payment successful callback
        console.log('Payment successful, verifying...', response)
        
        try {
          // Step 3: Verify payment with backend
          const verifyResponse = await post('/api/sms-credits/paystack/verify', {
            reference: response.reference
          })

          if (verifyResponse.success) {
            // Success! Close modal and refresh parent
            emit('success', verifyResponse.data)
            form.value = { amount: null, email: '' }
            processing.value = false
          } else {
            throw new Error(verifyResponse.message || 'Payment verification failed')
          }
        } catch (verifyError) {
          error.value = verifyError.message || 'Payment verification failed. Please contact support.'
          processing.value = false
        }
      },
      () => {
        // Payment closed callback
        processing.value = false
      }
    )

  } catch (err) {
    console.error('Payment initialization error:', err)
    error.value = err.message || 'Failed to initialize payment. Please try again.'
    processing.value = false
  }
}

// Watch for modal open to reset form and fetch SMS rate
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    fetchSMSRate()
    // Don't reset form when opening to preserve any pre-filled values
  } else {
    // Reset form when closing
    form.value = { amount: null, email: '', autoPurchaseSMS: true }
    error.value = ''
  }
})
</script>

<style scoped>
/* Custom styles if needed */
</style>
