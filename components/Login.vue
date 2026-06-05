<template>
  <div v-if="inline || isOpen" :class="!inline ? 'fixed inset-0 z-50 overflow-y-auto' : ''" :role="!inline ? 'dialog' : undefined" :aria-modal="!inline ? 'true' : undefined" :aria-labelledby="!inline ? 'login-dialog-title' : undefined" ref="dialogRef" :tabindex="!inline ? -1 : undefined">
    <!-- Backdrop (modal only) -->
    <div v-if="!inline" class="fixed inset-0 bg-[#1e1a22]/50 backdrop-blur-md" @click="closeModal"></div>

    <div style="font-family: 'Manrope', sans-serif;" :class="!inline ? 'min-h-full flex items-center justify-center p-4 sm:p-6' : ''">
      <!-- Card -->
      <div :class="!inline ? 'relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] bg-[#fff7ff] border-none shadow-[0_24px_32px_rgba(30,26,34,0.06)]' : 'w-full overflow-hidden rounded-[2rem] bg-[#fff7ff] border-none shadow-[0_24px_32px_rgba(30,26,34,0.06)]'">
        <!-- Header -->
        <div :class="inline ? 'relative px-6 pt-5 pb-4 border-b border-[#f0e6fa]' : 'relative px-6 pt-6 pb-5 border-b border-[#f0e6fa]'">
          <button
            v-if="!inline"
            type="button"
            @click="closeModal"
            class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f4ebf7] text-[#7d7484] transition hover:bg-[#ead6fd] hover:text-[#520094]"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div :class="!inline ? 'pr-10' : ''">
            <p v-if="!inline" class="text-xs font-bold uppercase tracking-[0.18em] text-[#520094] mb-2">MedsGh</p>
            <h3 :id="!inline ? 'login-dialog-title' : undefined" class="text-2xl font-semibold tracking-tight text-[#1e1a22]">{{ stepTitle }}</h3>
            <p v-if="!inline" class="mt-1 text-sm text-[#4c4453]">{{ stepSubtitle }}</p>
          </div>
        </div>

        <!-- Body -->
        <div :class="inline ? 'bg-[#ffffff] px-6 py-5' : 'bg-[#ffffff] p-6'">

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

          <!-- ── Sign in (unified single screen) ── -->
          <div v-if="view === 'login' && currentStep === 'signin'">
            <form @submit.prevent="onSignInSubmit">
              <!-- Always visible: phone -->
              <div class="mb-4">
                <label for="phoneNumber" class="mb-1 block text-sm font-semibold text-[#4c4453]">Phone Number</label>
                <div class="flex">
                  <select
                    v-model="selectedCountry"
                    class="inline-flex items-center rounded-l-xl border border-r-0 border-[#cec2d5] bg-[#f7f1ff] px-3 text-sm font-medium text-[#4c4453] focus:outline-none focus:ring-2 focus:ring-[#520094]/20"
                    @change="onPhoneInput"
                  >
                    <option value="GH">🇬🇭 +233</option>
                    <option value="US">🇺🇸 +1</option>
                    <option value="GB">🇬🇧 +44</option>
                  </select>
                  <input v-model="phoneNumber" type="tel" id="phoneNumber"
                    :class="phoneInputClass"
                    placeholder="eg. 24 123 4567" required @input="onPhoneInput">
                </div>
                <p v-if="phoneNumberError" class="mt-1 text-sm text-red-600">{{ phoneNumberError }}</p>
              </div>

              <!-- Always visible: password -->
              <div class="mb-3">
                <label for="password" class="mb-1 block text-sm font-semibold text-[#4c4453]">Password</label>
                <div class="relative">
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" id="password"
                    :class="passwordInputClass"
                    placeholder="Enter your password" required minlength="6">
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d7484] hover:text-[#520094] transition-colors"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'">
                    <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                    <EyeIcon v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Remember + forgot -->
              <div class="mb-4 flex items-center justify-between gap-3 text-sm">
                <div class="flex items-center gap-2">
                  <input id="remember-me" v-model="rememberMe" type="checkbox"
                    class="h-4 w-4 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]">
                  <label for="remember-me" class="text-sm text-[#4c4453]">Keep me logged in</label>
                </div>
                <button type="button" @click="forgotPassword" class="text-sm font-medium text-[#520094] hover:text-[#6c24b3]">
                  Forgot password?
                </button>
              </div>

              <!-- Reveal: verify (existing customer, no password) -->
              <Transition
                enter-from-class="opacity-0 -translate-y-2"
                enter-active-class="transition duration-200 ease-out"
                leave-to-class="opacity-0 -translate-y-2"
                leave-active-class="transition duration-150 ease-in"
              >
                <div v-if="mode === 'verify'" class="mb-4 rounded-2xl bg-[#f7efff] border border-[#e9d6fb] p-4">
                  <p class="text-sm font-semibold text-[#1e1a22]">Quick verification</p>
                  <p class="mt-1 text-xs text-[#4c4453]">
                    We sent a 6-digit code to <strong>{{ formattedPhoneNumber }}</strong> to confirm it's you.
                  </p>
                  <div class="mt-3">
                    <label for="verifyOtp" class="sr-only">Verification code</label>
                    <input v-model="otp" type="text" id="verifyOtp"
                      :class="inputClass"
                      placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}" inputmode="numeric">
                  </div>
                  <button type="button" @click="resendVerifyOTP" :disabled="isLoading"
                    class="mt-2 text-xs font-medium text-[#520094] hover:text-[#6c24b3] disabled:opacity-50">
                    Resend code
                  </button>
                </div>
              </Transition>

              <!-- Reveal: register (new customer — auto-detected path) -->
              <Transition
                enter-from-class="opacity-0 -translate-y-2"
                enter-active-class="transition duration-200 ease-out"
                leave-to-class="opacity-0 -translate-y-2"
                leave-active-class="transition duration-150 ease-in"
              >
                <div v-if="mode === 'register'" class="mb-4 rounded-2xl bg-[#f7efff] border border-[#e9d6fb] p-4 space-y-3">
                  <div>
                    <p class="text-sm font-semibold text-[#1e1a22]">Almost there</p>
                    <p class="mt-1 text-xs text-[#4c4453]">
                      A couple more details and we'll create your account for <strong>{{ formattedPhoneNumber }}</strong>.
                    </p>
                    <div v-if="registrationCompany" class="mt-2 inline-flex items-center rounded-full border border-[#cec2d5] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#520094]">
                      Linked at signup: {{ registrationCompany }}
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="fname" class="block text-sm font-medium text-[#4c4453] mb-1">First name</label>
                      <input v-model="firstName" type="text" id="fname"
                        :class="inputClass" placeholder="John" required>
                    </div>
                    <div>
                      <label for="lname" class="block text-sm font-medium text-[#4c4453] mb-1">Last name</label>
                      <input v-model="lastName" type="text" id="lname"
                        :class="inputClass" placeholder="Doe" required>
                    </div>
                  </div>
                  <div>
                    <label for="email" class="block text-sm font-medium text-[#4c4453] mb-1">Email (optional)</label>
                    <input v-model="email" type="email" id="email"
                      :class="inputClass" placeholder="john@example.com">
                  </div>
                  <div>
                    <label for="regOtp" class="block text-sm font-medium text-[#4c4453] mb-1">Verification code</label>
                    <input v-model="otp" type="text" id="regOtp"
                      :class="inputClass"
                      placeholder="Enter 6-digit code" required maxlength="6" pattern="[0-9]{6}" inputmode="numeric">
                    <button type="button" @click="resendRegisterOTP" :disabled="isLoading"
                      class="mt-1 text-xs font-medium text-[#520094] hover:text-[#6c24b3] disabled:opacity-50">
                      Resend code
                    </button>
                  </div>
                  <div class="flex items-start">
                    <input id="ageVerification" v-model="isOver18" type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]" required>
                    <label for="ageVerification" class="ml-2 block text-xs text-[#4c4453]">
                      I confirm I am 18 years or older <span class="text-red-500">*</span>
                    </label>
                  </div>
                </div>
              </Transition>

              <!-- Single primary button - label changes by mode -->
              <button type="submit" :disabled="isLoading || !canSubmit" :class="fullPrimaryButtonClass">
                <span v-if="isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  {{ submittingLabel }}
                </span>
                <span v-else>{{ submitLabel }}</span>
              </button>

              <!-- Sign up link -->
              <p class="mt-4 text-center text-sm text-[#7d7484]">
                New here?
                <button type="button" @click="goToSignup" class="font-semibold text-[#520094] hover:text-[#6029b4]">
                  Create an account
                </button>
              </p>
            </form>
          </div>

          <!-- ── Reset Password (separate flow) ── -->
          <div v-else-if="view === 'login' && currentStep === 'reset'">
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
                  <div class="relative">
                    <input v-model="password" :type="showPassword ? 'text' : 'password'" id="resetPassword"
                      :class="passwordInputClass"
                      placeholder="Enter new password (min. 6 characters)" required minlength="6">
                    <button type="button" @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d7484] hover:text-[#520094] transition-colors"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'">
                      <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                      <EyeIcon v-else class="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div class="mb-4">
                  <label for="resetConfirmPassword" class="block text-sm font-medium text-[#4c4453] mb-1">Confirm New Password</label>
                  <div class="relative">
                    <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" id="resetConfirmPassword"
                      :class="passwordInputClass"
                      placeholder="Re-enter new password" required minlength="6">
                    <button type="button" @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d7484] hover:text-[#520094] transition-colors"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'">
                      <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                      <EyeIcon v-else class="w-5 h-5" />
                    </button>
                  </div>
                  <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-1 text-sm text-red-600">
                    Passwords do not match
                  </p>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                  <button type="button" @click="backToSignIn"
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

          <!-- ── Sign up (explicit new-user path) ── -->
          <div v-else-if="view === 'signup'">
            <!-- Step 1: Phone + send OTP -->
            <div v-if="!signupOtpSent">
              <div class="mb-4">
                <label for="signupPhone" class="mb-1 block text-sm font-semibold text-[#4c4453]">Phone Number</label>
                <div class="flex">
                  <select
                    v-model="selectedCountry"
                    class="inline-flex items-center rounded-l-xl border border-r-0 border-[#cec2d5] bg-[#f7f1ff] px-3 text-sm font-medium text-[#4c4453] focus:outline-none focus:ring-2 focus:ring-[#520094]/20"
                  >
                    <option value="GH">🇬🇭 +233</option>
                    <option value="US">🇺🇸 +1</option>
                    <option value="GB">🇬🇧 +44</option>
                  </select>
                  <input v-model="phoneNumber" type="tel" id="signupPhone"
                    :class="phoneInputClass"
                    placeholder="eg. 24 123 4567" @input="validatePhoneNumber">
                </div>
                <p v-if="phoneNumberError" class="mt-1 text-sm text-red-600">{{ phoneNumberError }}</p>
              </div>

              <button
                type="button"
                :disabled="isLoading || !phoneNumber || !!phoneNumberError"
                @click="sendSignupOTP"
                :class="fullPrimaryButtonClass"
              >
                <span v-if="isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending code…
                </span>
                <span v-else>Send verification code</span>
              </button>
            </div>

            <!-- Step 2: Details + submit -->
            <form v-else @submit.prevent="submitSignup" class="space-y-3">
              <div class="rounded-2xl bg-[#f7efff] border border-[#e9d6fb] px-4 py-3 text-xs text-[#4c4453]">
                Verification code sent to <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong>.
                <button type="button" @click="signupOtpSent = false; otp = ''" class="ml-1 font-medium text-[#520094] hover:text-[#6029b4]">Change number</button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="su-fname" class="block text-sm font-medium text-[#4c4453] mb-1">First name <span class="text-red-500">*</span></label>
                  <input v-model="firstName" type="text" id="su-fname" :class="inputClass" placeholder="John" required>
                </div>
                <div>
                  <label for="su-lname" class="block text-sm font-medium text-[#4c4453] mb-1">Last name <span class="text-red-500">*</span></label>
                  <input v-model="lastName" type="text" id="su-lname" :class="inputClass" placeholder="Doe" required>
                </div>
              </div>

              <div>
                <label for="su-email" class="block text-sm font-medium text-[#4c4453] mb-1">Email <span class="text-[#7d7484] font-normal">(optional)</span></label>
                <input v-model="email" type="email" id="su-email" :class="inputClass" placeholder="john@example.com">
              </div>

              <div>
                <label for="su-otp" class="block text-sm font-medium text-[#4c4453] mb-1">Verification code <span class="text-red-500">*</span></label>
                <input v-model="otp" type="text" id="su-otp" :class="inputClass"
                  placeholder="6-digit code" required maxlength="6" pattern="[0-9]{6}" inputmode="numeric">
                <button type="button" @click="sendSignupOTP" :disabled="isLoading"
                  class="mt-1 text-xs font-medium text-[#520094] hover:text-[#6029b4] disabled:opacity-50">
                  Resend code
                </button>
              </div>

              <div>
                <label for="su-password" class="block text-sm font-medium text-[#4c4453] mb-1">Create a password <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" id="su-password" :class="passwordInputClass"
                    placeholder="Min. 6 characters" required minlength="6">
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d7484] hover:text-[#520094] transition-colors"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'">
                    <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                    <EyeIcon v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label for="su-confirm" class="block text-sm font-medium text-[#4c4453] mb-1">Confirm password <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" id="su-confirm" :class="passwordInputClass"
                    placeholder="Re-enter password" required minlength="6">
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d7484] hover:text-[#520094] transition-colors"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'">
                    <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                    <EyeIcon v-else class="w-5 h-5" />
                  </button>
                </div>
                <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-1 text-xs text-red-600">
                  Passwords do not match
                </p>
              </div>

              <div class="flex items-start">
                <input id="su-age" v-model="isOver18" type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]" required>
                <label for="su-age" class="ml-2 block text-xs text-[#4c4453]">
                  I confirm I am 18 years or older <span class="text-red-500">*</span>
                </label>
              </div>

              <button type="submit" :disabled="isLoading || !canSignupSubmit" :class="fullPrimaryButtonClass">
                <span v-if="isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account…
                </span>
                <span v-else>Create account</span>
              </button>
            </form>

            <!-- Back to login link -->
            <p class="mt-4 text-center text-sm text-[#7d7484]">
              Already have an account?
              <button type="button" @click="goToLogin" class="font-semibold text-[#520094] hover:text-[#6029b4]">
                Sign in
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '~/stores/user';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useModalA11y } from '~/composables/useModalA11y';
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService';
import phoneUtils from '~/utils/phone';

type LoginStep = 'signin' | 'reset';
type LoginMode = 'login' | 'verify' | 'register';
type LoginView = 'login' | 'signup';

interface LoginSuccessPayload {
  destination: string;
  action: string;
}

// TODO: remove once stores/ are .ts
interface UserStoreShape {
  formatPhoneNumber: (phone: string) => string;
  checkPhoneStatus: (phone: string) => Promise<{ status: string }>;
  login: (phone: string, password: string) => Promise<void>;
  sendSetupOTP: (phone: string) => Promise<void>;
  setupPassword: (phone: string, otp: string, password: string) => Promise<void>;
  register: (payload: {
    company_id?: unknown;
    fname: string;
    lname: string;
    phone: string;
    password: string;
    email: string;
    otp: string;
  }) => Promise<void>;
  sendResetOTP: (phone: string) => Promise<void>;
  resetPassword: (phone: string, otp: string, password: string) => Promise<void>;
}

// TODO: remove once stores/ are .ts
interface PharmacyStoreShape {
  pharmacyData: { name?: string } | null;
  currentPharmacy: unknown;
}

const props = defineProps<{ isOpen?: boolean; inline?: boolean }>();

const emit = defineEmits<{
  close: [];
  'login-success': [payload: LoginSuccessPayload];
}>();

const userStore = useUserStore() as unknown as UserStoreShape;
const pharmacyStore = usePharmacyStore() as unknown as PharmacyStoreShape;
const customerAuthService = createCustomerAuthService(useApi());

// Focus trap, ESC-to-close, restore focus to invoker (WAI-ARIA dialog pattern).
const dialogRef = ref<HTMLElement | null>(null);
useModalA11y(dialogRef, () => props.isOpen ?? false, () => emit('close'));

const subtleCardClass = 'mb-4 rounded-2xl border-none bg-[#f4ebf7] p-4 text-sm text-[#4c4453]';
const inputClass = 'w-full rounded-full border border-[#ddd0eb] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] bg-[#ffffff] px-4 py-3 text-sm text-[#1e1a22] placeholder-[#7d7484] focus:outline-none focus:ring-2 focus:ring-[#520094]/20 focus:border-[#520094]/40 transition-colors';
const passwordInputClass = inputClass + ' pr-10';
const phoneInputClass = 'w-full rounded-r-full border border-l-0 border-[#ddd0eb] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] bg-[#ffffff] px-4 py-3 text-sm text-[#1e1a22] placeholder-[#7d7484] focus:outline-none focus:ring-2 focus:ring-[#520094]/20 focus:border-[#520094]/40 transition-colors';
const secondaryButtonClass = 'rounded-full border-none bg-[#e9dfec] px-6 py-3 text-sm font-bold text-[#4c4453] hover:bg-[#e0d7e3] transition-all active:scale-95';
const primaryButtonClass = 'rounded-xl bg-[#520094] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_34px_-18px_rgba(111,53,203,0.85)] transition hover:bg-[#6029b4] disabled:opacity-50';
const fullPrimaryButtonClass = 'w-full rounded-xl bg-[#520094] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_34px_-18px_rgba(111,53,203,0.85)] transition hover:bg-[#6029b4] disabled:opacity-50';

// State
const view = ref<LoginView>('login');
const currentStep = ref<LoginStep>('signin');
const mode = ref<LoginMode>('login');
const phoneNumber = ref<string>('');
const selectedCountry = ref<string>('GH');
const password = ref<string>('');
const confirmPassword = ref<string>('');
const otp = ref<string>('');
const firstName = ref<string>('');
const lastName = ref<string>('');
const email = ref<string>('');
const gender = ref<string>('');
const isOver18 = ref<boolean>(false);
const otpSent = ref<boolean>(false);
const signupOtpSent = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');
const phoneNumberError = ref<string>('');
const rememberMe = ref<boolean>(true);
const showPassword = ref<boolean>(false);

const registrationCompany = computed<string | null>(() => pharmacyStore.pharmacyData?.name ?? null);

const stepTitle = computed<string>(() => {
  if (view.value === 'signup') {
    return signupOtpSent.value ? 'Almost there' : 'Create your account';
  }
  if (currentStep.value === 'reset') return 'Reset your password';
  if (mode.value === 'verify') return 'Quick verification';
  if (mode.value === 'register') return 'Create your account';
  return 'Sign in to MedsGh';
});

const stepSubtitle = computed<string>(() => {
  if (view.value === 'signup') {
    if (signupOtpSent.value) {
      return registrationCompany.value
        ? `Fill in your details and join ${registrationCompany.value}.`
        : 'Fill in a few details and you\'re in.';
    }
    return 'Enter your number and we\'ll send a verification code.';
  }
  if (currentStep.value === 'reset') return 'Verify your number and set a new password.';
  if (mode.value === 'verify') return "Confirm the code we sent and we'll activate your account.";
  if (mode.value === 'register') {
    return registrationCompany.value
      ? `Registering with ${registrationCompany.value}. Orders will be available there right after signup.`
      : "A couple more details and you're in.";
  }
  return 'Welcome back. Enter your phone and password.';
});

const submitLabel = computed<string>(() => {
  if (mode.value === 'verify') return 'Activate account';
  if (mode.value === 'register') return 'Create account';
  return 'Sign in';
});

const submittingLabel = computed<string>(() => {
  if (mode.value === 'verify') return 'Activating...';
  if (mode.value === 'register') return 'Creating...';
  return 'Signing in...';
});

const canSubmit = computed<boolean>(() => {
  if (mode.value === 'login') {
    return Boolean(phoneNumber.value) && Boolean(password.value) && password.value.length >= 6;
  }
  if (mode.value === 'verify') {
    return Boolean(otp.value) && otp.value.length === 6;
  }
  if (mode.value === 'register') {
    return Boolean(otp.value) && otp.value.length === 6
      && Boolean(firstName.value) && Boolean(lastName.value)
      && isOver18.value;
  }
  return false;
});

const canSignupSubmit = computed<boolean>(() =>
  signupOtpSent.value &&
  Boolean(firstName.value) && Boolean(lastName.value) &&
  otp.value.length === 6 &&
  password.value.length >= 6 && password.value === confirmPassword.value &&
  isOver18.value
);

const resolveCurrentPharmacyId = (): unknown => {
  if (pharmacyStore.currentPharmacy) {
    return pharmacyStore.currentPharmacy;
  }

  if (process.client) {
    try {
      const savedPharmacyId = localStorage.getItem('currentPharmacyId');
      if (savedPharmacyId) {
        (pharmacyStore as { currentPharmacy: unknown }).currentPharmacy = savedPharmacyId;
        return savedPharmacyId;
      }
    } catch (err) {
      console.error('Failed to restore pharmacy ID:', err);
    }
  }

  return null;
};

const phoneE164 = computed<string>(() =>
  phoneUtils.formatToE164(phoneNumber.value, selectedCountry.value)
);

const formattedPhoneNumber = computed<string>(() =>
  phoneE164.value ? phoneUtils.formatForDisplay(phoneE164.value) : phoneNumber.value
);

const validatePhoneNumber = (): boolean => {
  if (!phoneNumber.value.replace(/\D/g, '')) {
    phoneNumberError.value = '';
    return false;
  }
  if (phoneUtils.isValidPhone(phoneNumber.value, selectedCountry.value)) {
    phoneNumberError.value = '';
    return true;
  }
  phoneNumberError.value = 'Please enter a valid phone number.';
  return false;
};

// If user edits phone after a reveal, snap back to login mode
const onPhoneInput = (): void => {
  validatePhoneNumber();
  if (mode.value !== 'login') {
    mode.value = 'login';
    otp.value = '';
    otpSent.value = false;
    firstName.value = '';
    lastName.value = '';
    email.value = '';
    isOver18.value = false;
    errorMessage.value = '';
  }
};

// ── View navigation ──────────────────────────────────────────────────────────

const resetSharedFields = (): void => {
  phoneNumber.value = '';
  selectedCountry.value = 'GH';
  password.value = '';
  confirmPassword.value = '';
  otp.value = '';
  firstName.value = '';
  lastName.value = '';
  email.value = '';
  isOver18.value = false;
  errorMessage.value = '';
  phoneNumberError.value = '';
};

const goToSignup = (): void => {
  view.value = 'signup';
  signupOtpSent.value = false;
  resetSharedFields();
};

const goToLogin = (): void => {
  showPassword.value = false;
  view.value = 'login';
  currentStep.value = 'signin';
  mode.value = 'login';
  signupOtpSent.value = false;
  otpSent.value = false;
  resetSharedFields();
};

// ── Signup flow ──────────────────────────────────────────────────────────────

const sendSignupOTP = async (): Promise<void> => {
  if (!validatePhoneNumber()) return;
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const data = await customerAuthService.sendSetupOtp({
      phone: phoneE164.value,
    }) as { success: boolean; message?: string };
    if (!data.success) throw new Error(data.message ?? 'Failed to send verification code');
    signupOtpSent.value = true;
    otp.value = '';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to send code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const submitSignup = async (): Promise<void> => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await userStore.register({
      company_id: resolveCurrentPharmacyId() ?? undefined,
      fname: firstName.value,
      lname: lastName.value,
      phone: phoneE164.value,
      password: password.value,
      email: email.value,
      otp: otp.value,
    });
    emit('login-success', { destination: 'new', action: 'register' });
    closeModal();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// ── Login flow (unchanged) ───────────────────────────────────────────────────

// Send registration OTP via the service layer.
const sendNewCustomerOTP = async (): Promise<void> => {
  const data = await customerAuthService.sendSetupOtp({
    phone: phoneE164.value,
  }) as { success: boolean; message?: string };
  if (!data.success) throw new Error(data.message ?? 'Failed to send verification code');
};

// Unified submit dispatcher
const onSignInSubmit = async (): Promise<void> => {
  if (mode.value === 'login') return submitLogin();
  if (mode.value === 'verify') return submitVerify();
  if (mode.value === 'register') return submitRegister();
};

// Path A: phone + password submitted. Decide what to do.
const submitLogin = async (): Promise<void> => {
  if (!validatePhoneNumber()) return;
  if (!password.value || password.value.length < 6) {
    errorMessage.value = 'Enter your password (min. 6 characters).';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    const result = await userStore.checkPhoneStatus(phoneE164.value);

    if (result.status === 'registered') {
      try {
        await userStore.login(phoneE164.value, password.value);
        emit('login-success', { destination: 'new', action: 'login' });
        closeModal();
      } catch (loginErr) {
        console.error('Login error:', loginErr);
        errorMessage.value = `Wrong password for ${formattedPhoneNumber.value}. Try again or reset.`;
      }
      return;
    }

    if (result.status === 'existing_customer_no_password') {
      await userStore.sendSetupOTP(phoneE164.value);
      otpSent.value = true;
      mode.value = 'verify';
      return;
    }

    if (result.status === 'new_customer') {
      await sendNewCustomerOTP();
      otpSent.value = true;
      mode.value = 'register';
      return;
    }

    throw new Error('Unknown account status.');
  } catch (err) {
    console.error('Sign-in error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Path B: existing customer activates with OTP; reuse already-typed password.
const submitVerify = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await userStore.setupPassword(phoneE164.value, otp.value, password.value);
    emit('login-success', { destination: 'new', action: 'setup' });
    closeModal();
  } catch (err) {
    console.error('Activate account error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to activate account. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Path C: new customer registers via auto-detect; reuse already-typed password.
const submitRegister = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const companyId = resolveCurrentPharmacyId();

    await userStore.register({
      company_id: companyId ?? undefined,
      fname: firstName.value,
      lname: lastName.value,
      phone: phoneE164.value,
      password: password.value,
      email: email.value,
      otp: otp.value,
    });

    emit('login-success', { destination: 'new', action: 'register' });
    closeModal();
  } catch (err) {
    console.error('Registration error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const resendVerifyOTP = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await userStore.sendSetupOTP(phoneE164.value);
  } catch (err) {
    console.error('Resend verify OTP error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const resendRegisterOTP = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await sendNewCustomerOTP();
  } catch (err) {
    console.error('Resend register OTP error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const forgotPassword = (): void => {
  showPassword.value = false;
  currentStep.value = 'reset';
  mode.value = 'login';
  otpSent.value = false;
  otp.value = '';
  password.value = '';
  confirmPassword.value = '';
  errorMessage.value = '';
};

const sendResetOTP = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await userStore.sendResetOTP(phoneE164.value);
    otpSent.value = true;
  } catch (err) {
    console.error('Error sending reset OTP:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to send reset code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleResetPassword = async (): Promise<void> => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    await userStore.resetPassword(phoneE164.value, otp.value, password.value);

    errorMessage.value = '';
    currentStep.value = 'signin';
    mode.value = 'login';
    confirmPassword.value = '';
    otp.value = '';
    otpSent.value = false;

    const tempSuccess = 'Password reset successful! Please login with your new password.';
    setTimeout(() => {
      alert(tempSuccess);
    }, 100);
  } catch (err) {
    console.error('Reset password error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const backToSignIn = (): void => {
  showPassword.value = false;
  currentStep.value = 'signin';
  mode.value = 'login';
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

const closeModal = (): void => {
  emit('close');
  setTimeout(() => {
    view.value = 'login';
    currentStep.value = 'signin';
    mode.value = 'login';
    signupOtpSent.value = false;
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

const tryToRestorePhone = (): void => {
  if (typeof localStorage !== 'undefined') {
    const savedPhone = localStorage.getItem('lastPhoneNumber');
    if (savedPhone) {
      phoneNumber.value = savedPhone;
      validatePhoneNumber();
    }
  }
};

onMounted(() => {
  if (props.isOpen || props.inline) {
    tryToRestorePhone();
  }
});

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    tryToRestorePhone();
  }
});
</script>
