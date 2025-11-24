<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto bg-gray-200 p-4">
    <!-- Modal Container -->
    <div class="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-purple-600 text-white py-4 px-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-white/20 p-2 rounded-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-medium">{{ companyName }} Services</h3>
          </div>
        </div>
        <h2 class="text-xl font-semibold">
          {{ step === 'phone' ? 'Login to Continue' : 
             step === 'password' ? 'Enter Password' :
             step === 'setup' ? 'Setup Your Password' :
             'Reset Password' }}
        </h2>
        <p class="text-indigo-100 text-sm mt-1">
          {{ step === 'phone' ? 'Enter your phone number' : 
             step === 'password' ? 'Enter your password to login' :
             step === 'setup' ? 'Create a password for your account' :
             'Reset your password with OTP' }}
        </p>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <!-- Progress indicator -->
        <div class="flex items-center mb-6">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full transition-all',
            step === 'phone' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white']">
            <span v-if="step === 'phone'">1</span>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1 h-1 mx-2 transition-all" :class="[step !== 'phone' ? 'bg-indigo-600' : 'bg-gray-200']"></div>
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full transition-all',
            step !== 'phone' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600']">
            <span>2</span>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Step 1: Phone Number Input -->
        <div v-if="step === 'phone'">
          <form @submit.prevent="checkPhone">
            <div class="mb-4">
              <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div class="flex">
                <span
                  class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                  +233
                </span>
                <input v-model="phone" type="tel" id="phoneNumber"
                  class="block w-full rounded-none rounded-r-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="eg. 24 123 4567" required @input="validatePhoneNumber" :disabled="loading">
              </div>
              <p v-if="phoneNumberError" class="mt-1 text-sm text-red-600">{{ phoneNumberError }}</p>
              <p v-else class="mt-1 text-xs text-gray-500">Enter your registered phone number</p>
            </div>

            <div class="mt-6">
              <button type="submit" :disabled="loading || phoneNumberError !== ''"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 flex items-center justify-center gap-2">
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  Checking...
                </span>
                <span v-else>Continue</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Step 2a: Password Login (Registered) -->
        <div v-else-if="step === 'password'">
          <form @submit.prevent="handleLogin">
            <div class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p>Logging in as: <strong>{{ formatPhoneDisplay(phone) }}</strong></p>
            </div>

            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input v-model="password" type="password" id="password"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter your password" required minlength="6" :disabled="loading">
            </div>

            <!-- <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center">
                <input id="remember-me" v-model="rememberMe" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                  Keep me logged in
                </label>
              </div>
              <button type="button" @click="forgotPassword" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Forgot password?
              </button>
            </div> -->

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="goBack"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" :disabled="loading">
                Back
              </button>
              <button type="submit" :disabled="loading"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 flex items-center gap-2">
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  Logging in...
                </span>
                <span v-else>Login</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Step 2b: Setup Password (First Time) -->
        <div v-else-if="step === 'setup'">
          <form @submit.prevent="handleSetupPassword">
            <div class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p>Setting up password for: <strong>{{ formatPhoneDisplay(phone) }}</strong></p>
              <p class="text-xs mt-1">We'll send you a verification code</p>
            </div>

            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="sendOTP" :disabled="loading"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 flex items-center justify-center gap-2">
                <span v-if="loading">Sending OTP...</span>
                <span v-else>Send Verification Code</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="otp" class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="otp"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}" :disabled="loading">
              </div>

              <div class="mb-4">
                <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input v-model="newPassword" type="password" id="newPassword"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Create a password (min. 6 characters)" required minlength="6" :disabled="loading">
              </div>

              <div class="mb-4">
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input v-model="confirmPassword" type="password" id="confirmPassword"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Re-enter your password" required minlength="6" :disabled="loading">
                <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="goBack"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" :disabled="loading">
                  Back
                </button>
                <button type="submit" :disabled="loading || !otp || newPassword !== confirmPassword"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                  <span v-if="loading">Setting up...</span>
                  <span v-else>Setup Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Step 2c: Password Reset -->
        <div v-else-if="step === 'reset'">
          <form @submit.prevent="resetPassword">
            <div class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p>Resetting password for: <strong>{{ formatPhoneDisplay(phone) }}</strong></p>
              <p class="text-xs mt-1">We'll send you a verification code</p>
            </div>

            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="requestPasswordReset" :disabled="loading"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                <span v-if="loading">Sending Reset Code...</span>
                <span v-else>Send Reset Code</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="resetOtp" class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="resetOtp"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter 6-digit code" required maxlength="6" :disabled="loading">
              </div>

              <div class="mb-4">
                <label for="resetPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input v-model="newPassword" type="password" id="resetPassword"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter new password" required minlength="6" :disabled="loading">
              </div>

              <div class="mb-4">
                <label for="resetConfirm" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input v-model="confirmPassword" type="password" id="resetConfirm"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Confirm new password" required minlength="6" :disabled="loading">
                <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="goBack"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md" :disabled="loading">
                  Back to Login
                </button>
                <button type="submit" :disabled="loading || !otp || newPassword !== confirmPassword"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                  <span v-if="loading">Resetting...</span>
                  <span v-else>Reset Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <p class="text-center text-sm text-gray-600">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  layout: false,
})

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

// Get company domain from route
const companyDomain = computed(() => {
  const pathMatch = route.path.match(/\/([^\/]+)\/services/)
  return pathMatch ? pathMatch[1] : 'company'
})

const companyName = computed(() => {
  return companyDomain.value.charAt(0).toUpperCase() + companyDomain.value.slice(1)
})

// Form state
const step = ref('phone') // 'phone', 'password', 'setup', 'reset'
const phone = ref('')
const password = ref('')
const otp = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const otpSent = ref(false)
const rememberMe = ref(true)
const phoneNumberError = ref('')

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Format phone for display
const formatPhoneDisplay = (phoneNum) => {
  if (!phoneNum) return ''
  let formatted = phoneNum
  if (formatted.startsWith('0')) {
    formatted = '+233 ' + formatted.substring(1)
  } else if (formatted.startsWith('233')) {
    formatted = '+233 ' + formatted.substring(3)
  } else if (!formatted.startsWith('+')) {
    formatted = '+233 ' + formatted
  }
  return formatted
}

// Validate phone number input
const validatePhoneNumber = () => {
  const digitsOnly = phone.value.replace(/\D/g, '')
  
  if (digitsOnly.length === 0) {
    phoneNumberError.value = ''
    return false
  }
  
  const validPrefixes = ['20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '59', '57', '56', ]
  
  // 10 digits with leading 0
  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    const prefix = digitsOnly.substring(1, 3)
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.'
      return false
    }
    phoneNumberError.value = ''
    return true
  }
  
  // 9 digits without leading 0
  if (digitsOnly.length === 9) {
    const prefix = digitsOnly.substring(0, 2)
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.'
      return false
    }
    phoneNumberError.value = ''
    return true
  }
  
  // Full number with country code
  if (digitsOnly.length === 12 && digitsOnly.startsWith('233')) {
    const prefix = digitsOnly.substring(3, 5)
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.'
      return false
    }
    phoneNumberError.value = ''
    return true
  }
  
  if (digitsOnly.length < 9) {
    phoneNumberError.value = 'Phone number is too short.'
    return false
  } else if (digitsOnly.length > 12) {
    phoneNumberError.value = 'Phone number is too long.'
    return false
  }
  
  phoneNumberError.value = 'Please enter a valid phone number.'
  return false
}

// Check phone number
const checkPhone = async () => {
  if (!validatePhoneNumber()) {
    return
  }
  
  error.value = ''
  loading.value = true

  try {
    const result = await companyStore.checkPhoneStatus(phone.value)
    
    if (result.status === 'setup_required') {
      step.value = 'setup'
    } else if (result.status === 'registered') {
      step.value = 'password'
    } else if (result.status === 'not_found') {
      error.value = 'Phone number not found. Please contact your administrator.'
    } else if (result.status === 'access_denied') {
      error.value = 'You do not have permission to access online services.'
    }
  } catch (err) {
    error.value = err.message || 'Failed to verify phone number'
  } finally {
    loading.value = false
  }
}

// Handle login
const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    await companyStore.login(phone.value, password.value)
    successMessage.value = 'Login successful!'
    
    setTimeout(() => {
      router.push(`/${companyDomain.value}/services/sms-campaigns`)
    }, 500)
  } catch (err) {
    error.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

// Send OTP
const sendOTP = async () => {
  error.value = ''
  loading.value = true

  try {
    await companyStore.sendOTP(phone.value)
    otpSent.value = true
    successMessage.value = 'Verification code sent to your phone'
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to send verification code'
  } finally {
    loading.value = false
  }
}

// Handle password setup for existing customers
const handleSetupPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  error.value = ''
  loading.value = true
  
  try {
    await companyStore.setupPassword(phone.value, otp.value, newPassword.value)
    successMessage.value = 'Password setup successful! Redirecting...'
    
    setTimeout(() => {
      router.push(`/${companyDomain.value}/services/sms-campaigns`)
    }, 1000)
  } catch (err) {
    error.value = err.message || 'Failed to setup password. Please try again.'
  } finally {
    loading.value = false
  }
}

// Forgot password
const forgotPassword = () => {
  step.value = 'reset'
  otpSent.value = false
  otp.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  error.value = ''
}

// Request password reset
const requestPasswordReset = async () => {
  error.value = ''
  loading.value = true

  try {
    await companyStore.requestPasswordReset(phone.value)
    otpSent.value = true
    successMessage.value = 'Reset code sent to your phone'
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to send reset code'
  } finally {
    loading.value = false
  }
}

// Reset password
const resetPassword = async () => {
  error.value = ''
  
  if (!otp.value || !newPassword.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true

  try {
    await companyStore.resetPassword(phone.value, otp.value, newPassword.value)
    successMessage.value = 'Password reset successful!'
    
    // Go back to login
    setTimeout(() => {
      step.value = 'password'
      otpSent.value = false
      otp.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      successMessage.value = ''
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Failed to reset password'
  } finally {
    loading.value = false
  }
}

// Back to phone input
const goBack = () => {
  step.value = 'phone'
  password.value = ''
  otp.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  otpSent.value = false
  error.value = ''
  successMessage.value = ''
  phoneNumberError.value = ''
}
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .bg-white.rounded-lg {
    margin: 1rem;
  }
}
</style>