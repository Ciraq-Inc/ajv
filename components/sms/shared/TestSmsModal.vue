<template>
  <teleport to="body">
    <transition name="modal">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        
        <!-- Modal -->
        <div class="flex min-h-screen items-center justify-center p-4">
          <div 
            class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-gray-900">
                Send Test SMS
              </h3>
              <button
                @click="close"
                type="button"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="X" class="h-5 w-5" />
              </button>
            </div>

            <!-- Alert -->
            <div 
              v-if="result.success || result.error"
              :class="[
                'mb-4 p-4 rounded-lg flex items-start gap-3',
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              ]"
            >
              <Icon 
                :name="result.success ? 'CheckCircle' : 'AlertCircle'" 
                class="h-5 w-5 flex-shrink-0 mt-0.5"
              />
              <div class="flex-1">
                <p class="font-medium">
                  {{ result.success ? 'Success!' : 'Error' }}
                </p>
                <p class="text-sm mt-1">
                  {{ result.message }}
                </p>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-4">
              <!-- Phone Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+233XXXXXXXXX"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :disabled="loading"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +233241234567)
                </p>
              </div>

              <!-- Message -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  v-model="form.message"
                  rows="4"
                  placeholder="Enter your test message..."
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  :disabled="loading"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  {{ messageLength }} characters
                </p>
              </div>

              <!-- SMS Provider -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  SMS Provider
                </label>
                <select
                  v-model="form.sms_provider"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :disabled="loading"
                >
                  <option value="nalo">Nalo Solutions</option>
                  <option value="mnotify">MNotify</option>
                </select>
              </div>

              <!-- Sender ID (for MNotify) -->
              <div v-if="form.sms_provider === 'mnotify'">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Sender ID (Optional)
                </label>
                <input
                  v-model="form.sender_id"
                  type="text"
                  placeholder="e.g., MyBrand"
                  maxlength="11"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :disabled="loading"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Maximum 11 characters
                </p>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  @click="close"
                  type="button"
                  class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  :disabled="loading"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="loading"
                >
                  <span v-if="loading" class="flex items-center justify-center">
                    <Icon name="Loader2" class="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </span>
                  <span v-else class="flex items-center justify-center">
                    <Icon name="Send" class="h-4 w-4 mr-2" />
                    Send Test SMS
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSMSCampaigns } from '~/composables/useSMSCampaigns'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const { sendTestSms } = useSMSCampaigns()

const loading = ref(false)
const form = ref({
  phone: '',
  message: '',
  sms_provider: 'nalo',
  sender_id: ''
})

const result = ref({
  success: false,
  error: false,
  message: ''
})

const messageLength = computed(() => form.value.message.length)

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    form.value = {
      phone: '',
      message: '',
      sms_provider: 'nalo',
      sender_id: ''
    }
    result.value = {
      success: false,
      error: false,
      message: ''
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  result.value = { success: false, error: false, message: '' }

  try {
    const testData = {
      phone: form.value.phone,
      message: form.value.message,
      sms_provider: form.value.sms_provider
    }

    // Add sender_id only if using MNotify and it's provided
    if (form.value.sms_provider === 'mnotify' && form.value.sender_id) {
      testData.sender_id = form.value.sender_id
    }

    const response = await sendTestSms(testData)
    
    result.value = {
      success: true,
      error: false,
      message: response.message || 'Test SMS sent successfully!'
    }

    // Auto-close after 2 seconds on success
    setTimeout(() => {
      if (result.value.success) {
        close()
      }
    }, 2000)
  } catch (error) {
    result.value = {
      success: false,
      error: true,
      message: error.message || 'Failed to send test SMS. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const close = () => {
  if (!loading.value) {
    emit('close')
  }
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

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
