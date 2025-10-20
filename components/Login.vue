<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black opacity-50" @click="closeModal"></div>

    <!-- Modal Container -->
    <div class="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-indigo-600 text-white py-4 px-6">
        <h3 class="text-lg font-medium">
          {{ currentStep === 'phone' ? 'Login to Continue' : 
             currentStep === 'password' ? 'Enter Password' :
             currentStep === 'setup' ? 'Setup Your Password' :
             'Register' }}
        </h3>
        <p class="text-indigo-100 text-sm mt-1">
          {{ currentStep === 'phone' ? 'Enter your phone number' : 
             currentStep === 'password' ? 'Enter your password to login' :
             currentStep === 'setup' ? 'Create a password for your account' :
             'Complete your registration' }}
        </p>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <!-- Progress indicator -->
        <div class="flex items-center mb-6">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full',
            currentStep === 'phone' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white']">
            <span v-if="currentStep === 'phone'">1</span>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1 h-1 mx-2" :class="[currentStep !== 'phone' ? 'bg-indigo-600' : 'bg-gray-200']"></div>
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full',
            currentStep !== 'phone' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600']">
            <span>2</span>
          </div>
        </div>

        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
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

        <!-- Step 1: Phone Number Input -->
        <div v-if="currentStep === 'phone'">
          <form @submit.prevent="checkPhone">
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
              <p v-else class="mt-1 text-xs text-gray-500">Enter your registered phone number</p>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
                Cancel
              </button>
              <button type="submit" :disabled="isLoading || phoneNumberError !== ''"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                <span v-if="isLoading" class="flex items-center">
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

        <!-- Step 2a: Password Login (Registered Customer) -->
        <div v-else-if="currentStep === 'password'">
          <form @submit.prevent="handleLogin">
            <div class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p>Logging in as: <strong>{{ formattedPhoneNumber }}</strong></p>
            </div>

            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input v-model="password" type="password" id="password"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter your password" required minlength="6">
            </div>

            <div class="mb-4">
              <div class="flex items-center">
                <input id="remember-me" v-model="rememberMe" type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                  Keep me logged in
                </label>
              </div>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="backToPhone"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
                Back
              </button>
              <button type="submit" :disabled="isLoading"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                <span v-if="isLoading" class="flex items-center">
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

        <!-- Step 2b: Setup Password (Existing Customer, No Password) -->
        <div v-else-if="currentStep === 'setup'">
          <form @submit.prevent="handleSetupPassword">
            <div class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p>Setting up password for: <strong>{{ formattedPhoneNumber }}</strong></p>
              <p class="text-xs mt-1">We'll send you a verification code</p>
            </div>

            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="sendOTP" :disabled="isLoading"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                <span v-if="isLoading">Sending OTP...</span>
                <span v-else>Send Verification Code</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="otp" class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="otp"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}">
              </div>

              <div class="mb-4">
                <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input v-model="password" type="password" id="newPassword"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Create a password (min. 6 characters)" required minlength="6">
              </div>

              <div class="mb-4">
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input v-model="confirmPassword" type="password" id="confirmPassword"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Re-enter your password" required minlength="6">
                <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="backToPhone"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
                  Back
                </button>
                <button type="submit" :disabled="isLoading || !otp || password !== confirmPassword"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                  <span v-if="isLoading">Setting up...</span>
                  <span v-else>Setup Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Step 2c: Register (New Customer) -->
        <div v-else-if="currentStep === 'register'">
          <form @submit.prevent="handleRegister">
            <div class="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p>Creating new account for: <strong>{{ formattedPhoneNumber }}</strong></p>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label for="fname" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input v-model="firstName" type="text" id="fname"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="John" required>
              </div>
              <div>
                <label for="lname" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input v-model="lastName" type="text" id="lname"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Doe" required>
              </div>
            </div>

            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input v-model="email" type="email" id="email"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="john@example.com">
            </div>

            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="sendRegistrationOTP" :disabled="isLoading"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                <span v-if="isLoading">Sending OTP...</span>
                <span v-else>Send Verification Code</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="regOtp" class="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="regOtp"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter 6-digit code" required maxlength="6">
              </div>

              <div class="mb-4">
                <label for="regPassword" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input v-model="password" type="password" id="regPassword"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Create a password (min. 6 characters)" required minlength="6">
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="backToPhone"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
                  Back
                </button>
                <button type="submit" :disabled="isLoading || !otp || !firstName || !lastName"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                  <span v-if="isLoading">Registering...</span>
                  <span v-else>Register</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';
import { usePharmacyStore } from '~/stores/pharmacy';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'login-success']);

const userStore = useUserStore();
const pharmacyStore = usePharmacyStore();

// State management
const currentStep = ref('phone'); // 'phone' | 'password' | 'setup' | 'register'
const phoneNumber = ref('');
const password = ref('');
const confirmPassword = ref('');
const otp = ref('');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const otpSent = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const phoneNumberError = ref('');
const rememberMe = ref(true);

// Format phone number for display
const formattedPhoneNumber = computed(() => {
  if (!phoneNumber.value) return '';
  let formatted = phoneNumber.value;
  if (formatted.startsWith('0')) {
    formatted = '+233 ' + formatted.substring(1);
  } else if (!formatted.startsWith('+')) {
    formatted = '+233 ' + formatted;
  }
  return formatted;
});

// Validate phone number input
const validatePhoneNumber = () => {
  const digitsOnly = phoneNumber.value.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) {
    phoneNumberError.value = '';
    return false;
  }
  
  const validPrefixes = ['20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '59'];
  
  // 10 digits with leading 0
  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    const prefix = digitsOnly.substring(1, 3);
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.';
      return false;
    }
    phoneNumberError.value = '';
    return true;
  }
  
  // 9 digits without leading 0
  if (digitsOnly.length === 9) {
    const prefix = digitsOnly.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.';
      return false;
    }
    phoneNumberError.value = '';
    return true;
  }
  
  // Full number with country code
  if (digitsOnly.length === 12 && digitsOnly.startsWith('233')) {
    const prefix = digitsOnly.substring(3, 5);
    if (!validPrefixes.includes(prefix)) {
      phoneNumberError.value = 'Please enter a valid Ghanaian number.';
      return false;
    }
    phoneNumberError.value = '';
    return true;
  }
  
  if (digitsOnly.length < 9) {
    phoneNumberError.value = 'Phone number is too short.';
    return false;
  } else if (digitsOnly.length > 12) {
    phoneNumberError.value = 'Phone number is too long.';
    return false;
  }
  
  phoneNumberError.value = 'Please enter a valid phone number.';
  return false;
};

// Check phone status and route to appropriate flow
const checkPhone = async () => {
  if (!validatePhoneNumber()) {
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const result = await userStore.checkPhoneStatus(phoneNumber.value);
    
    // Route based on status
    switch (result.status) {
      case 'registered':
        currentStep.value = 'password';
        break;
      case 'existing_customer_no_password':
        currentStep.value = 'setup';
        break;
      case 'new_customer':
        currentStep.value = 'register';
        break;
      default:
        throw new Error('Unknown customer status');
    }
  } catch (error) {
    console.error('Error checking phone:', error);
    errorMessage.value = error.message || 'Failed to verify phone number. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Handle login with password
const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    await userStore.login(phoneNumber.value, password.value);
    emit('login-success');
    closeModal();
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = error.message || 'Invalid credentials. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Send OTP for password setup
const sendOTP = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    await userStore.sendSetupOTP(phoneNumber.value);
    otpSent.value = true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    errorMessage.value = error.message || 'Failed to send OTP. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Handle password setup for existing customers
const handleSetupPassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    await userStore.setupPassword(phoneNumber.value, otp.value, password.value);
    emit('login-success');
    closeModal();
  } catch (error) {
    console.error('Setup password error:', error);
    errorMessage.value = error.message || 'Failed to setup password. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Send OTP for registration
const sendRegistrationOTP = async () => {
  if (!firstName.value || !lastName.value) {
    errorMessage.value = 'Please enter your name';
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    // Use the backend send-otp endpoint for registration
    const config = useRuntimeConfig();
    const response = await fetch(`${config.public.apiBase}/api/auth/customer/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: userStore.formatPhoneNumber(phoneNumber.value) })
    });
    
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to send OTP');
    
    otpSent.value = true;
  } catch (error) {
    console.error('Error sending registration OTP:', error);
    errorMessage.value = error.message || 'Failed to send OTP. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Handle new customer registration
const handleRegister = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    await userStore.register({
      company_id: pharmacyStore.currentPharmacy,
      fname: firstName.value,
      lname: lastName.value,
      phone: phoneNumber.value,
      password: password.value,
      email: email.value,
      otp: otp.value
    });
    
    emit('login-success');
    closeModal();
  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.value = error.message || 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Back to phone input
const backToPhone = () => {
  currentStep.value = 'phone';
  password.value = '';
  confirmPassword.value = '';
  otp.value = '';
  otpSent.value = false;
  errorMessage.value = '';
};

// Close the modal and reset state
const closeModal = () => {
  emit('close');
  setTimeout(() => {
    currentStep.value = 'phone';
    phoneNumber.value = '';
    password.value = '';
    confirmPassword.value = '';
    otp.value = '';
    firstName.value = '';
    lastName.value = '';
    email.value = '';
    otpSent.value = false;
    errorMessage.value = '';
    phoneNumberError.value = '';
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

// Initialize on component mount
onMounted(() => {
  if (props.isOpen) {
    tryToRestorePhone();
  }
});

// Reload when modal is opened
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    tryToRestorePhone();
  }
});
</script>