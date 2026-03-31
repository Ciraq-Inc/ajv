<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-[#1e1a22]/50 backdrop-blur-md" @click="closeModal"></div>

    <div style="font-family: 'Manrope', sans-serif;" class="min-h-full flex items-center justify-center p-4 sm:p-6">
      <!-- Modal Container -->
      <div class="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] bg-[#fff7ff] border-none shadow-[0_24px_32px_rgba(30,26,34,0.06)]">
        <!-- Modal Header -->
        <div class="bg-[#faf0fd] border-b border-[#cec2d5]/15 px-6 py-5 text-[#1e1a22]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span class="inline-flex items-center rounded-full border-none bg-[#efdbff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#520094]">
                Customer Access
              </span>
              <h3 class="mt-3 text-2xl font-semibold tracking-tight">{{ stepTitle }}</h3>
              <p class="mt-1 text-sm text-[#4c4453]">{{ stepSubtitle }}</p>
            </div>
            <div class="hidden rounded-2xl border-none bg-[#ffffff] px-3 py-2 text-right text-xs text-[#7d7484] sm:block">
              <div class="font-semibold text-[#1e1a22]">Secure Flow</div>
              <div>{{ isSecondStep ? 'Step 2 of 2' : 'Step 1 of 2' }}</div>
            </div>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="bg-[#ffffff] p-6">
        <!-- Progress indicator -->
        <div class="mb-6 rounded-2xl border-none bg-[#f4ebf7] p-4">
          <div class="flex items-center gap-3">
            <div :class="['inline-flex min-w-[108px] items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]',
              isSecondStep ? 'bg-emerald-500 text-white' : 'bg-[#520094] text-white']">
              <span v-if="isSecondStep" class="mr-2">&#10003;</span>
              Phone
            </div>
            <div :class="['h-px flex-1', isSecondStep ? 'bg-[#6c24b3]' : 'bg-[#cec2d5]']"></div>
            <div :class="['inline-flex min-w-[108px] items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]',
              isSecondStep ? 'bg-[#520094] text-white' : 'bg-white text-[#7d7484] border border-[#cec2d5]']">
              {{ stepStageLabel }}
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
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
            <div :class="subtleCardClass">
              Enter your number once. We will route you to login, password setup, or registration based on your account status.
            </div>

            <div class="mb-4">
              <label for="phoneNumber" class="mb-1 block text-sm font-semibold text-[#4c4453]">Phone Number</label>
              <div class="flex">
                <span
                  class="inline-flex items-center rounded-l-xl border border-r-0 border-[#cec2d5] bg-[#f7f1ff] px-3 text-sm font-medium text-[#4c4453]">
                  +233
                </span>
                <input v-model="phoneNumber" type="tel" id="phoneNumber"
                  :class="phoneInputClass"
                  placeholder="eg. 24 123 4567" required @input="validatePhoneNumber">
              </div>
              <p v-if="phoneNumberError" class="mt-1 text-sm text-red-600">{{ phoneNumberError }}</p>
              <p v-else class="mt-1 text-xs text-[#7d7484]">Enter your registered phone number</p>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="closeModal"
                :class="secondaryButtonClass">
                Cancel
              </button>
              <button type="submit" :disabled="isLoading"
                :class="primaryButtonClass">
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
            <div :class="subtleCardClass">
              <p>Logging in as: <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong></p>
            </div>

            <div class="mb-4">
              <label for="password" class="mb-1 block text-sm font-semibold text-[#4c4453]">Password</label>
              <input v-model="password" type="password" id="password"
                :class="inputClass"
                placeholder="Enter your password" required minlength="6">
            </div>

            <div class="mb-4 flex items-center justify-between gap-3 rounded-2xl border-none bg-[#f4ebf7] px-4 py-3 text-sm">
              <div class="flex items-center">
                <input id="remember-me" v-model="rememberMe" type="checkbox"
                  class="h-4 w-4 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]">
                <label for="remember-me" class="ml-2 block text-sm text-[#4c4453]">
                  Keep me logged in
                </label>
              </div>
              <button type="button" @click="forgotPassword" class="text-sm font-medium text-[#520094] hover:text-[#6c24b3]">
                Forgot password?
              </button>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" @click="backToPhone"
                :class="secondaryButtonClass">
                Back
              </button>
              <button type="submit" :disabled="isLoading"
                :class="primaryButtonClass">
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
            <div :class="subtleCardClass">
              <p>Setting up password for: <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong></p>
              <p class="text-xs mt-1 text-[#7d7484]">Complete your profile and we'll send you a verification code</p>
            </div>

            <div class="mb-4" v-if="!otpSent">
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label for="setupFirstName" class="block text-sm font-medium text-[#4c4453] mb-1">First Name</label>
                  <input v-model="firstName" type="text" id="setupFirstName"
                    :class="inputClass"
                    placeholder="John" required>
                </div>
                <div>
                  <label for="setupLastName" class="block text-sm font-medium text-[#4c4453] mb-1">Last Name</label>
                  <input v-model="lastName" type="text" id="setupLastName"
                    :class="inputClass"
                    placeholder="Doe" required>
                </div>
              </div>

              <div class="mb-4">
                <label for="setupEmail" class="block text-sm font-medium text-[#4c4453] mb-1">Email (Optional)</label>
                <input v-model="email" type="email" id="setupEmail"
                  :class="inputClass"
                  placeholder="john@example.com">
              </div>

              <div class="mb-4">
                <label for="setupGender" class="block text-sm font-medium text-[#4c4453] mb-1">Gender</label>
                <select v-model="gender" id="setupGender"
                  :class="inputClass"
                  required>
                  <option value="">Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div class="mb-4">
                <div class="flex items-start">
                  <input id="ageVerification" v-model="isOver18" type="checkbox"
                    class="mt-1 h-4 w-4 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]" required>
                  <label for="ageVerification" class="ml-2 block text-sm text-[#4c4453]">
                    I confirm that I am 18 years or older <span class="text-red-500">*</span>
                  </label>
                </div>
              </div>

              <button type="button" @click="sendOTP" :disabled="isLoading || !firstName || !lastName || !gender || !isOver18"
                :class="fullPrimaryButtonClass">
                <span v-if="isLoading">Sending OTP...</span>
                <span v-else>Send Verification Code</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="otp" class="block text-sm font-medium text-[#4c4453] mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="otp"
                  :class="inputClass"
                  placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}">
              </div>

              <div class="mb-4">
                <label for="newPassword" class="block text-sm font-medium text-[#4c4453] mb-1">New Password</label>
                <input v-model="password" type="password" id="newPassword"
                  :class="inputClass"
                  placeholder="Create a password (min. 6 characters)" required minlength="6">
              </div>

              <div class="mb-4">
                <label for="confirmPassword" class="block text-sm font-medium text-[#4c4453] mb-1">Confirm Password</label>
                <input v-model="confirmPassword" type="password" id="confirmPassword"
                  :class="inputClass"
                  placeholder="Re-enter your password" required minlength="6">
                <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="backToPhone"
                  :class="secondaryButtonClass">
                  Back
                </button>
                <button type="submit" :disabled="isLoading || !otp || password !== confirmPassword"
                  :class="primaryButtonClass">
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
            <div :class="subtleCardClass">
              <p>Creating new account for: <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong></p>
              <p class="mt-2 text-xs text-[#7d7484]">{{ registrationHint }}</p>
              <div v-if="registrationCompany" class="mt-3 inline-flex items-center rounded-full border border-[#cec2d5] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#520094]">
                Linked at signup: {{ registrationCompany }}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label for="fname" class="block text-sm font-medium text-[#4c4453] mb-1">First Name</label>
                <input v-model="firstName" type="text" id="fname"
                  :class="inputClass"
                  placeholder="John" required>
              </div>
              <div>
                <label for="lname" class="block text-sm font-medium text-[#4c4453] mb-1">Last Name</label>
                <input v-model="lastName" type="text" id="lname"
                  :class="inputClass"
                  placeholder="Doe" required>
              </div>
            </div>

            <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-[#4c4453] mb-1">Email (Optional)</label>
                <input v-model="email" type="email" id="email"
                  :class="inputClass"
                placeholder="john@example.com">
            </div>

            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="sendRegistrationOTP" :disabled="isLoading"
                :class="fullPrimaryButtonClass">
                <span v-if="isLoading">Sending OTP...</span>
                <span v-else>Continue</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="regOtp" class="block text-sm font-medium text-[#4c4453] mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="regOtp"
                  :class="inputClass"
                  placeholder="Enter 6-digit code" required maxlength="6">
              </div>

              <div class="mb-4">
                <label for="regPassword" class="block text-sm font-medium text-[#4c4453] mb-1">Password</label>
                <input v-model="password" type="password" id="regPassword"
                  :class="inputClass"
                  placeholder="Create a password (min. 6 characters)" required minlength="6">
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="backToPhone"
                  :class="secondaryButtonClass">
                  Back
                </button>
                <button type="submit" :disabled="isLoading || !otp || !firstName || !lastName"
                  :class="primaryButtonClass">
                  <span v-if="isLoading">Registering...</span>
                  <span v-else>Create Account</span>
                </button>
              </div>
            </div>
            <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Join 5,000+ Ghanaians using MedsGH to skip the pharmacy queue.
            </div>
          </form>
        </div>

        <!-- Step 2d: Reset Password -->
        <div v-else-if="currentStep === 'reset'">
          <form @submit.prevent="handleResetPassword">
            <div :class="subtleCardClass">
              <p>Resetting password for: <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong></p>
              <p class="text-xs mt-1 text-[#7d7484]">We'll send you a verification code</p>
            </div>

            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="sendResetOTP" :disabled="isLoading"
                :class="fullPrimaryButtonClass">
                <span v-if="isLoading">Sending Reset Code...</span>
                <span v-else>Send Reset Code</span>
              </button>
            </div>

            <div v-if="otpSent">
              <div class="mb-4">
                <label for="resetOtp" class="block text-sm font-medium text-[#4c4453] mb-1">Verification Code</label>
                <input v-model="otp" type="text" id="resetOtp"
                  :class="inputClass"
                  placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}">
              </div>

              <div class="mb-4">
                <label for="resetPassword" class="block text-sm font-medium text-[#4c4453] mb-1">New Password</label>
                <input v-model="password" type="password" id="resetPassword"
                  :class="inputClass"
                  placeholder="Enter new password (min. 6 characters)" required minlength="6">
              </div>

              <div class="mb-4">
                <label for="resetConfirmPassword" class="block text-sm font-medium text-[#4c4453] mb-1">Confirm New Password</label>
                <input v-model="confirmPassword" type="password" id="resetConfirmPassword"
                  :class="inputClass"
                  placeholder="Re-enter new password" required minlength="6">
                <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-1 text-sm text-red-600">
                  Passwords do not match
                </p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" @click="backToPhone"
                  :class="secondaryButtonClass">
                  Cancel
                </button>
                <button type="submit" :disabled="isLoading || !otp || password !== confirmPassword"
                  :class="primaryButtonClass">
                  <span v-if="isLoading">Resetting...</span>
                  <span v-else>Reset Password</span>
                </button>
              </div>
            </div>
          </form>
        </div>
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

const subtleCardClass = 'mb-4 rounded-2xl border-none bg-[#f4ebf7] p-4 text-sm text-[#4c4453]';
const inputClass = 'w-full rounded-full border-none shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] bg-[#ffffff] px-4 py-3 text-sm text-[#1e1a22] placeholder-[#7d7484] focus:outline-none focus:ring-2 focus:ring-[#520094]/20 transition-colors';
const phoneInputClass = 'w-full rounded-r-full border-none shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] bg-[#ffffff] px-4 py-3 text-sm text-[#1e1a22] placeholder-[#7d7484] focus:outline-none focus:ring-2 focus:ring-[#520094]/20 transition-colors';
const secondaryButtonClass = 'rounded-full border-none bg-[#e9dfec] px-6 py-3 text-sm font-bold text-[#4c4453] hover:bg-[#e0d7e3] transition-all active:scale-95';
const primaryButtonClass = 'rounded-xl bg-[#520094] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_34px_-18px_rgba(111,53,203,0.85)] transition hover:bg-[#6029b4] disabled:opacity-50';
const fullPrimaryButtonClass = 'w-full rounded-xl bg-[#520094] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_34px_-18px_rgba(111,53,203,0.85)] transition hover:bg-[#6029b4] disabled:opacity-50';

// State management
const currentStep = ref('phone'); // 'phone' | 'password' | 'setup' | 'register' | 'reset'
const phoneNumber = ref('');
const password = ref('');
const confirmPassword = ref('');
const otp = ref('');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const gender = ref('');
const isOver18 = ref(false);
const otpSent = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const phoneNumberError = ref('');
const rememberMe = ref(true);

const isSecondStep = computed(() => currentStep.value !== 'phone');
const registrationCompany = computed(() => pharmacyStore.pharmacyData?.name || null);

const registrationHint = computed(() => (
  registrationCompany.value
    ? `You are registering with ${registrationCompany.value}. Store orders will be available there immediately after signup.`
    : 'This creates your main customer account for requests and wallet access. Right after signup, we move you straight into your first request.'
));

const stepTitle = computed(() => {
  if (currentStep.value === 'phone') return 'Start with your phone';
  if (currentStep.value === 'password') return 'Enter Password';
  if (currentStep.value === 'setup') return 'Setup Your Password';
  if (currentStep.value === 'reset') return 'Reset Password';
  return "Let's find your medicine.";
});

const stepSubtitle = computed(() => {
  if (currentStep.value === 'phone') return 'Enter your phone number and we will move you to the right next step.';
  if (currentStep.value === 'password') return 'Use your password to access your account.';
  if (currentStep.value === 'setup') return 'Create a password to activate your account, then continue into your first request.';
  if (currentStep.value === 'reset') return 'Verify your number and set a new password.';
  return registrationCompany.value
    ? 'Create your account now and we will take you straight into the request flow.'
    : 'Create your account in one short step, then continue into your first medicine request.';
});

const stepStageLabel = computed(() => {
  if (currentStep.value === 'phone') return 'Access';
  if (currentStep.value === 'password') return 'Login';
  if (currentStep.value === 'setup') return 'Setup';
  if (currentStep.value === 'reset') return 'Reset';
  return 'Register';
});

const resolveCurrentPharmacyId = () => {
  if (pharmacyStore.currentPharmacy) {
    return pharmacyStore.currentPharmacy;
  }

  if (process.client) {
    try {
      const savedPharmacyId = localStorage.getItem('currentPharmacyId');
      if (savedPharmacyId) {
        pharmacyStore.currentPharmacy = savedPharmacyId;
        return savedPharmacyId;
      }
    } catch (error) {
      console.error('Failed to restore pharmacy ID:', error);
    }
  }

  return null;
};

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
  
  const validPrefixes = ['20', '23', '24', '25', '26', '27', '50', '53', '54', '55', '59', '57', '56', ]
  
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
    emit('login-success', { destination: 'home', action: 'login' });
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
    console.log('Setting up password and logging in...');
    await userStore.setupPassword(phoneNumber.value, otp.value, password.value);
    
    console.log('Password setup completed, user is now logged in');
    emit('login-success', { destination: 'new', action: 'setup' });
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
    const companyId = resolveCurrentPharmacyId();

    console.log('Attempting registration...');
    await userStore.register({
      company_id: companyId || undefined,
      fname: firstName.value,
      lname: lastName.value,
      phone: phoneNumber.value,
      password: password.value,
      email: email.value,
      otp: otp.value
    });
    
    console.log('Registration completed, user is now logged in');
    emit('login-success', { destination: 'new', action: 'register' });
    closeModal();
  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.value = error.message || 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Forgot password - navigate to reset step
const forgotPassword = () => {
  currentStep.value = 'reset';
  otpSent.value = false;
  otp.value = '';
  password.value = '';
  confirmPassword.value = '';
  errorMessage.value = '';
};

// Send OTP for password reset
const sendResetOTP = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    await userStore.sendResetOTP(phoneNumber.value);
    otpSent.value = true;
  } catch (error) {
    console.error('Error sending reset OTP:', error);
    errorMessage.value = error.message || 'Failed to send reset code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Handle password reset
const handleResetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    await userStore.resetPassword(phoneNumber.value, otp.value, password.value);
    
    // Show success and redirect to password login
    errorMessage.value = '';
    currentStep.value = 'password';
    password.value = '';
    confirmPassword.value = '';
    otp.value = '';
    otpSent.value = false;
    
    // Show a temporary success message
    const tempSuccess = 'Password reset successful! Please login with your new password.';
    setTimeout(() => {
      alert(tempSuccess);
    }, 100);
  } catch (error) {
    console.error('Reset password error:', error);
    errorMessage.value = error.message || 'Failed to reset password. Please try again.';
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
  firstName.value = '';
  lastName.value = '';
  gender.value = '';
  isOver18.value = false;
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
    gender.value = '';
    isOver18.value = false;
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
