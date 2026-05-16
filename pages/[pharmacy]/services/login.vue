<template>
  <div class="fixed inset-0 flex items-center justify-center overflow-y-auto py-8 px-4" :style="{ backgroundColor: bgColor }">

    <!-- Decorative sparkles -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      <svg class="absolute -top-6 -right-6 w-48 h-48 opacity-[0.06]" viewBox="0 0 100 100" fill="white">
        <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
      </svg>
      <svg class="absolute bottom-10 -left-8 w-36 h-36 opacity-[0.05]" viewBox="0 0 100 100" fill="white">
        <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
      </svg>
      <svg class="absolute top-1/2 right-8 w-20 h-20 opacity-[0.04]" viewBox="0 0 100 100" fill="white">
        <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
      </svg>
      <svg class="absolute bottom-1/3 left-1/4 w-10 h-10 opacity-[0.05]" viewBox="0 0 100 100" fill="white">
        <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
      </svg>
    </div>

    <!-- Card -->
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

      <!-- Brand header -->
      <div class="flex flex-col items-center pt-8 pb-6 px-6">
        <img src="/brand/rig-mark.svg" alt="Rigel" class="w-14 h-14 mb-4" />
        <p class="text-[10px] font-black uppercase tracking-[0.18em] mb-2" :style="{ color: accentColor }">
          {{ companyName }} Services
        </p>
        <h2 class="text-xl font-black text-zinc-900 tracking-tight text-center leading-tight">
          {{ step === 'phone' ? 'Welcome back' :
             step === 'password' ? 'Enter your password' :
             step === 'setup' ? 'Set up your password' :
             'Reset your password' }}
        </h2>
        <p class="text-xs text-zinc-500 mt-1.5 text-center font-medium">
          {{ step === 'phone' ? 'Enter your phone number to continue' :
             step === 'password' ? 'Enter your password to log in' :
             step === 'setup' ? 'Create a secure password for your account' :
             'Reset your password with a verification code' }}
        </p>
      </div>

      <!-- Progress indicator -->
      <div class="flex items-center px-8 mb-6">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
          :class="step === 'phone' ? 'text-white' : 'text-white'"
          :style="{ backgroundColor: accentColor }">
          <svg v-if="step !== 'phone'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>1</span>
        </div>
        <div class="flex-1 h-0.5 mx-2 rounded-full transition-all"
          :class="step !== 'phone' ? '' : 'bg-zinc-200'"
          :style="step !== 'phone' ? { backgroundColor: accentColor } : {}"></div>
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
          :class="step !== 'phone' ? 'text-white' : 'bg-zinc-100 text-zinc-400'"
          :style="step !== 'phone' ? { backgroundColor: accentColor } : {}">
          <span>2</span>
        </div>
      </div>

      <!-- Form body -->
      <div class="px-6 pb-2">

        <!-- Error -->
        <div v-if="error" class="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 mb-4">
          <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm text-red-700 font-medium">{{ error }}</p>
        </div>

        <!-- Success -->
        <div v-if="successMessage" class="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 mb-4">
          <svg class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm text-emerald-700 font-medium">{{ successMessage }}</p>
        </div>

        <!-- Step 1: Phone -->
        <div v-if="step === 'phone'">
          <form @submit.prevent="checkPhone">
            <div class="mb-4">
              <label for="phoneNumber" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Phone Number</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 text-sm font-semibold text-zinc-600 bg-zinc-100 border border-r-0 border-zinc-200 rounded-l-xl">
                  +233
                </span>
                <input v-model="phone" type="tel" id="phoneNumber"
                  class="block w-full rounded-none rounded-r-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  placeholder="24 123 4567" required @input="validatePhoneNumber" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
              </div>
              <p v-if="phoneNumberError" class="mt-1.5 text-xs text-red-600 font-medium">{{ phoneNumberError }}</p>
              <p v-else class="mt-1.5 text-xs text-zinc-400 font-medium">Enter your registered phone number</p>
            </div>
            <div class="mt-5 pb-2">
              <button type="submit" :disabled="loading || phoneNumberError !== ''"
                class="w-full py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                :style="{ backgroundColor: accentColor }">
                <svg v-if="loading" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ loading ? 'Checking…' : 'Continue' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Step 2a: Password login -->
        <div v-else-if="step === 'password'">
          <form @submit.prevent="handleLogin">
            <div class="mb-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-600 border border-zinc-100 bg-zinc-50">
              Logging in as <strong class="text-zinc-900">{{ formatPhoneDisplay(phone) }}</strong>
            </div>
            <div class="mb-4">
              <label for="password" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Password</label>
              <input v-model="password" type="password" id="password"
                class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                placeholder="Enter your password" required minlength="6" :disabled="loading"
                @focus="handleFocusBorder"
                @blur="handleBlurBorder" />
            </div>
            <div class="mb-5 flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input id="remember-me" v-model="rememberMe" type="checkbox"
                  class="h-4 w-4 rounded border-zinc-300"
                  :style="{ accentColor: accentColor }" />
                <span class="text-xs font-semibold text-zinc-600">Keep me logged in</span>
              </label>
              <button type="button" @click="forgotPassword"
                class="text-xs font-bold transition-opacity hover:opacity-70"
                :style="{ color: accentColor }">
                Forgot password?
              </button>
            </div>
            <div class="flex justify-end gap-2 pb-2">
              <button type="button" @click="goBack" :disabled="loading"
                class="px-4 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl disabled:opacity-50 transition-colors">
                Back
              </button>
              <button type="submit" :disabled="loading"
                class="px-5 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 flex items-center gap-2 transition-opacity"
                :style="{ backgroundColor: accentColor }">
                <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ loading ? 'Logging in…' : 'Login' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Step 2b: Setup password -->
        <div v-else-if="step === 'setup'">
          <form @submit.prevent="handleSetupPassword">
            <div class="mb-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-600 border border-zinc-100 bg-zinc-50">
              Setting up for <strong class="text-zinc-900">{{ formatPhoneDisplay(phone) }}</strong>
              <span class="block text-zinc-400 mt-0.5">We'll send you a verification code via SMS</span>
            </div>
            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="sendOTP" :disabled="loading"
                class="w-full py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                :style="{ backgroundColor: accentColor }">
                <span>{{ loading ? 'Sending code…' : 'Send Verification Code' }}</span>
              </button>
            </div>
            <div v-if="otpSent" class="space-y-4">
              <div>
                <label for="otp" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Verification Code</label>
                <input v-model="otp" type="text" id="otp"
                  class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none tracking-[0.2em] transition-colors"
                  placeholder="6-digit code" required maxlength="6" pattern="[0-9]{6}" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
              </div>
              <div>
                <label for="newPassword" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">New Password</label>
                <input v-model="newPassword" type="password" id="newPassword"
                  class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  placeholder="Min. 6 characters" required minlength="6" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
              </div>
              <div>
                <label for="confirmPassword" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
                <input v-model="confirmPassword" type="password" id="confirmPassword"
                  class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  placeholder="Re-enter your password" required minlength="6" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
                <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="mt-1.5 text-xs text-red-600 font-medium">
                  Passwords do not match
                </p>
              </div>
              <div class="flex justify-end gap-2 pb-2">
                <button type="button" @click="goBack" :disabled="loading"
                  class="px-4 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl disabled:opacity-50 transition-colors">
                  Back
                </button>
                <button type="submit" :disabled="loading || !otp || newPassword !== confirmPassword"
                  class="px-5 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition-opacity"
                  :style="{ backgroundColor: accentColor }">
                  {{ loading ? 'Setting up…' : 'Set Password' }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Step 2c: Reset password -->
        <div v-else-if="step === 'reset'">
          <form @submit.prevent="resetPassword">
            <div class="mb-4 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-600 border border-zinc-100 bg-zinc-50">
              Resetting for <strong class="text-zinc-900">{{ formatPhoneDisplay(phone) }}</strong>
              <span class="block text-zinc-400 mt-0.5">We'll send you a verification code via SMS</span>
            </div>
            <div class="mb-4" v-if="!otpSent">
              <button type="button" @click="requestPasswordReset" :disabled="loading"
                class="w-full py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                :style="{ backgroundColor: accentColor }">
                <span>{{ loading ? 'Sending code…' : 'Send Reset Code' }}</span>
              </button>
            </div>
            <div v-if="otpSent" class="space-y-4">
              <div>
                <label for="resetOtp" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Verification Code</label>
                <input v-model="otp" type="text" id="resetOtp"
                  class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none tracking-[0.2em] transition-colors"
                  placeholder="6-digit code" required maxlength="6" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
              </div>
              <div>
                <label for="resetPassword" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">New Password</label>
                <input v-model="newPassword" type="password" id="resetPassword"
                  class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  placeholder="Enter new password" required minlength="6" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
              </div>
              <div>
                <label for="resetConfirm" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Confirm New Password</label>
                <input v-model="confirmPassword" type="password" id="resetConfirm"
                  class="block w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  placeholder="Confirm new password" required minlength="6" :disabled="loading"
                  @focus="handleFocusBorder"
                  @blur="handleBlurBorder" />
                <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="mt-1.5 text-xs text-red-600 font-medium">
                  Passwords do not match
                </p>
              </div>
              <div class="flex justify-end gap-2 pb-2">
                <button type="button" @click="goBack" :disabled="loading"
                  class="px-4 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl disabled:opacity-50 transition-colors">
                  Back
                </button>
                <button type="submit" :disabled="loading || !otp || newPassword !== confirmPassword"
                  class="px-5 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition-opacity"
                  :style="{ backgroundColor: accentColor }">
                  {{ loading ? 'Resetting…' : 'Reset Password' }}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 mt-2 border-t border-zinc-100 flex items-center justify-center gap-2">
        <svg class="w-3 h-3 opacity-30" viewBox="0 0 100 100" :fill="accentColor">
          <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
        </svg>
        <p class="text-xs text-zinc-400 font-medium">Need help? Contact your administrator</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import { createPharmacyService } from '~/services/pharmacy/pharmacyService'

definePageMeta({
  layout: false,
})

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

const THEME_PRESETS = {
  indigo:  { bg: '#1e1b4b', accent: '#6366f1' },
  teal:    { bg: '#042f2e', accent: '#0d9488' },
  rose:    { bg: '#4c0519', accent: '#e11d48' },
  emerald: { bg: '#022c22', accent: '#059669' },
  orange:  { bg: '#431407', accent: '#ea580c' },
  slate:   { bg: '#0f172a', accent: '#475569' },
}

const accentColor = ref('#6366f1')
const bgColor = ref('#1e1b4b')

const applyTheme = (company) => {
  if (!company) return
  const preset = THEME_PRESETS[company.theme_preset] || THEME_PRESETS.indigo
  if (company.theme_preset === 'custom' && company.theme_color) {
    accentColor.value = company.theme_color
    bgColor.value = '#0f172a'
  } else {
    accentColor.value = preset.accent
    bgColor.value = preset.bg
  }
}

onMounted(async () => {
  await companyStore.checkAuthState()
  // If already logged in, fetch full theme from store settings
  if (companyStore.currentCompany) {
    await companyStore.fetchTheme()
    applyTheme(companyStore.currentCompany)
    return
  }
  // Not logged in — fetch company info by domain to get theme preset
  try {
    const domain = route.path.match(/\/([^/]+)\/services/)?.[1]
    if (!domain) return
    const pharmacyService = createPharmacyService(useApi())
    const data = await pharmacyService.getByDomainSlug(domain)
    applyTheme(data.data || data)
  } catch {
    // keep defaults
  }
})

const handleFocusBorder = (e) => {
  e.target.style.borderColor = accentColor.value + '80'
}
const handleBlurBorder = (e) => {
  e.target.style.borderColor = ''
}

// Get company domain from route
const companyDomain = computed(() => {
  const pathMatch = route.path.match(/\/([^\/]+)\/services/)
  return pathMatch ? pathMatch[1] : 'company'
})

const companyName = computed(() => {
  return companyDomain.value.charAt(0).toUpperCase() + companyDomain.value.slice(1)
})

const getPostLoginTarget = () => {
  const redirect = typeof route.query?.redirect === 'string' ? route.query.redirect : ''
  if (redirect) {
    return decodeURIComponent(redirect)
  }
  // Route recruiters to rigel-boards, others to sms-campaigns
  const defaultDashboard = companyStore.userRole === 'third_party_poster'
    ? `/${companyDomain.value}/services/rigel-boards`
    : `/${companyDomain.value}/services/sms-campaigns`
  return defaultDashboard
}

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
      router.push(getPostLoginTarget())
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
      router.push(getPostLoginTarget())
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

