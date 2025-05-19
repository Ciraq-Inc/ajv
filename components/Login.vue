<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black opacity-50" @click="closeModal"></div>

    <!-- Modal Container -->
    <div class="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-indigo-600 text-white py-4 px-6">
        <h3 class="text-lg font-medium">{{ isVerifyStep ? 'Verify Phone Number' : 'Login to Continue' }}</h3>
        <p class="text-indigo-100 text-sm mt-1">
          {{ isVerifyStep ? 'Enter the code we sent to your phone' : 'Enter your phone number to login' }}
        </p>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <!-- Progress indicator -->
        <div class="flex items-center mb-6">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full',
            !isVerifyStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600']">
            <span>1</span>
          </div>
          <div class="flex-1 h-1 mx-2" :class="[isVerifyStep ? 'bg-indigo-600' : 'bg-gray-200']"></div>
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full',
            isVerifyStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600']">
            <span>2</span>
          </div>
        </div>

        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Phone Number Input Step -->
        <div v-if="!isVerifyStep">
          <form @submit.prevent="sendVerificationCode">
            <div class="mb-4">
              <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div class="flex">
                <span
                  class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                  +233
                </span>
                <input v-model="phoneNumber" type="tel" id="phoneNumber"
                  class="block w-full rounded-none rounded-r-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="eg. 24 123 4567" required @input="validatePhoneNumber">
              </div>
              <p v-if="phoneNumberError" class="mt-1 text-sm text-red-600">{{ phoneNumberError }}</p>
              <p v-else class="mt-1 text-xs text-gray-500">We'll send you a verification code via SMS</p>
            </div>

            <div class="mb-2 space-y-2">
              <div class="flex items-center">
                <input id="remember-me" v-model="rememberMe" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                  Keep me logged in
                </label>
              </div>

              <!-- New option to force SMS in development mode - client-side only rendered -->
              <ClientOnly>
                <div v-if="isDevelopmentMode" class="flex items-center pt-1">
                  <input id="force-sms" v-model="forceSms" type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                  <label for="force-sms" class="ml-2 block text-sm text-gray-700">
                    Send real SMS verification (even in development)
                  </label>
                </div>
              </ClientOnly>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Cancel
              </button>
              <button type="submit" :disabled="isLoading || phoneNumberError !== ''"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  Sending...
                </span>
                <span v-else>Send Code</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Verification Code Input Step -->
        <div v-else>
          <form @submit.prevent="verifyCode">
            <div class="mb-4">
              <label for="verificationCode" class="block text-sm font-medium text-gray-700 mb-1">Verification
                Code</label>
              <input v-model="verificationCode" type="text" id="verificationCode"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}">
              <p class="mt-1 text-xs text-gray-500">Enter the 6-digit code sent to {{ formattedPhoneNumber }}</p>
            </div>

            <!-- Countdown timer -->
            <div class="mb-4 text-sm">
              <div class="flex justify-between">
                <span>Code expires in: {{ formattedCountdown }}</span>
                <button type="button" v-if="countdown <= 0" @click="resendCode"
                  class="text-indigo-600 hover:text-indigo-800">
                  Resend code
                </button>
              </div>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="backToPhoneInput"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Back
              </button>
              <button type="submit" :disabled="isLoading || !verificationCode || verificationCode.length !== 6"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  Verifying...
                </span>
                <span v-else>Verify</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';
import { usePharmacyStore } from '~/stores/pharmacy';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'login-success']);

const userStore = useUserStore();
const pharmacyStore = usePharmacyStore();

// State management
const phoneNumber = ref('');
const verificationCode = ref('');
const isVerifyStep = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const phoneNumberError = ref('');
const rememberMe = ref(true);
const forceSms = ref(false);

// Detect development mode in a client-safe way
const isDevelopmentMode = ref(false);

// Countdown timer
const countdown = ref(60);
const formattedCountdown = computed(() => {
  const minutes = Math.floor(countdown.value / 60);
  const seconds = countdown.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

let countdownInterval = null;

function startCountdown() {
  countdown.value = 60;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
}

function resendCode() {
  sendVerificationCode();
}

// Format phone number for display
const formattedPhoneNumber = computed(() => {
  if (!phoneNumber.value) return '';

  let formatted = phoneNumber.value;
  // If it starts with 0, add Ghana code
  if (formatted.startsWith('0')) {
    formatted = '+233 ' + formatted.substring(1);
  } else if (!formatted.startsWith('+')) {
    formatted = '+233 ' + formatted;
  }

  return formatted;
});

// Validate phone number input with improved validation
const validatePhoneNumber = () => {
  // Get clean phone number (digits only)
  const digitsOnly = phoneNumber.value.replace(/\D/g, '');

  // Reset error if empty (allow form validation to handle this)
  if (digitsOnly.length === 0) {
    phoneNumberError.value = '';
    return false;
  }

  // Valid Ghanaian prefixes
  const validPrefixes = ['20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '59'];

  // Case 1: 10 digits with leading 0 (0xx-xxx-xxxx)
  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    const prefix = digitsOnly.substring(1, 3);
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.';
      return false;
    }
    phoneNumberError.value = '';
    return true;
  }

  // Case 2: 9 digits without leading 0 (xx-xxx-xxxx)
  if (digitsOnly.length === 9) {
    const prefix = digitsOnly.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.';
      return false;
    }
    phoneNumberError.value = '';
    return true;
  }

  // Case 3: Full number with country code (233xxxxxxxxx)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('233')) {
    const prefix = digitsOnly.substring(3, 5);
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.';
      return false;
    }
    phoneNumberError.value = '';
    return true;
  }

  // Invalid length
  if (digitsOnly.length < 9) {
    phoneNumberError.value = 'Phone number is too short.';
    return false;
  } else if (digitsOnly.length > 12) {
    phoneNumberError.value = 'Phone number is too long.';
    return false;
  }

  // Default error
  phoneNumberError.value = 'Please enter a valid phone number.';
  return false;
};


// Send verification code with improved error handling and SMS support
const sendVerificationCode = async () => {
  // Clean up the phone number format
  const cleanPhone = phoneNumber.value.replace(/\D/g, '');
  let formattedPhone = cleanPhone;

  // Format according to requirements (assume we need a clean number without country code)
  if (cleanPhone.startsWith('233')) {
    formattedPhone = '0' + cleanPhone.substring(3); // Convert 233xx to 0xx
  } else if (!cleanPhone.startsWith('0') && cleanPhone.length === 9) {
    formattedPhone = '0' + cleanPhone; // Add leading 0 if missing
  }

  // Set the formatted number back
  phoneNumber.value = formattedPhone;

  // Now validate
  if (!validatePhoneNumber()) {
    console.log('Phone validation failed:', phoneNumberError.value);
    return;
  }

  // Clear previous errors
  errorMessage.value = '';

  // Set loading state
  isLoading.value = true;

  try {
    console.log('Sending verification code to:', formattedPhone, 'Force SMS:', forceSms.value);

    // Add debugging for userStore
    if (!userStore || typeof userStore.sendVerificationCode !== 'function') {
      throw new Error('User store or sendVerificationCode method not available');
    }

    // Check if the pharmacy store is available
    if (!pharmacyStore.currentPharmacy) {
      throw new Error('Pharmacy information is missing. Please try again.');
    }

    // Call the user store method with the formatted phone and the forceSms flag
    await userStore.sendVerificationCode(formattedPhone, pharmacyStore.currentPharmacy, forceSms.value);

    // Success - move to next step
    isVerifyStep.value = true;
    startCountdown();

    // Save for future use
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastPhoneNumber', formattedPhone);
    }
  } catch (error) {
    console.error('Error sending verification code:', error);
    errorMessage.value = error.message || 'Failed to send verification code. Please try again.';

    // Check if this is a registration request error
    if (error.requestRegistration) {
      errorMessage.value = 'This number is not registered. Please contact your pharmacy.';
    }
  } finally {
    isLoading.value = false;
  }
};

// Verify the code entered by user
const verifyCode = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    // Using userStore to verify the OTP
    await userStore.verifyCode(phoneNumber.value, verificationCode.value, rememberMe.value);
    emit('login-success');
    closeModal();
  } catch (error) {
    errorMessage.value = error.message || 'Invalid verification code. Please try again.';
    console.error('Error verifying code:', error);
  } finally {
    isLoading.value = false;
  }
};

// Reset to phone input step
const backToPhoneInput = () => {
  isVerifyStep.value = false;
  verificationCode.value = '';
  errorMessage.value = '';
  clearInterval(countdownInterval);
};

// Close the modal and reset state
const closeModal = () => {
  emit('close');
  setTimeout(() => {
    // Reset state after closing animation
    verificationCode.value = '';
    isVerifyStep.value = false;
    errorMessage.value = '';
    phoneNumberError.value = '';
    clearInterval(countdownInterval);
  }, 300);
};

// Try to restore previously used phone number
const tryToRestorePhone = () => {
  if (typeof localStorage !== 'undefined') {
    const savedPhone = localStorage.getItem('lastPhoneNumber');
    if (savedPhone) {
      phoneNumber.value = savedPhone;
      validatePhoneNumber();
    }
  }
};

// Initialize on component mount and try to restore phone
onMounted(() => {
  // Set development mode flag on client side only
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    isDevelopmentMode.value = true;
  }

  if (props.isOpen) {
    tryToRestorePhone();
  }
})

// Reload when modal is opened
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    tryToRestorePhone();
  }
});

// Clean up intervals on unmount
onUnmounted(() => {
  clearInterval(countdownInterval);
});
</script>