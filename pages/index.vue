<!-- pages/index.vue -->
<template>
  <div class="h-screen max-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div class="container mx-auto px-4 h-full max-h-screen flex items-center overflow-y-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center">
        <!-- Left Side - Content -->
        <div class="space-y-6 lg:space-y-8">
          <div>
            <h1 class="text-3xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Need Meds? Get Them Delivered, <span class="text-indigo-600">Fast.</span>
            </h1>
            <p class="text-lg lg:text-xl text-gray-700 font-medium">
              Stop Driving Around. Check Inventory and Order from Pharmacies Near You.
            </p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-indigo-100">
            <p class="text-base lg:text-lg text-gray-700 leading-relaxed mb-4">
              Tired of calling every pharmacy only to find out they don't have what you need? 
              <span class="font-semibold text-indigo-600">The RigelOS Delivery Portal</span> is making life easier.
            </p>
            <div class="space-y-3">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-gray-700 text-sm lg:text-base">Check what's in stock at all partner pharmacies nearby</p>
              </div>
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-gray-700 text-sm lg:text-base">See it, buy it—right from your phone</p>
              </div>
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-gray-700 text-sm lg:text-base">Get it dropped off quickly at your home or office</p>
              </div>
            </div>
            <p class="text-base text-gray-800 font-semibold mt-4 text-center">
              It's stress-free healthcare access!
            </p>
          </div>
        </div>

        <!-- Right Side - Sign Up -->
        <div>
          <!-- Success Message -->
          <div v-if="showCongratulations" class="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                🎉 Congratulations!
              </h3>
              <p class="text-base text-gray-700 mb-4">
                Your account has been successfully created, <span class="font-semibold text-indigo-600">{{ customerName }}</span>!
              </p>
              <div class="bg-indigo-50 rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-700 mb-2">
                  We've sent you a welcome SMS to <strong>{{ customerPhone }}</strong>
                </p>
                <p class="text-xs text-gray-600">
                  You'll be the first to know when we launch in your area!
                </p>
              </div>
              <button 
                @click="resetForm"
                class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>

          <!-- Signup Form -->
          <div v-else class="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <!-- Header Section -->
            <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3 text-center text-white">
              <h2 class="text-xl lg:text-2xl font-extrabold drop-shadow-lg">
                Join the Waitlist
              </h2>
              <p class="text-xs text-white/90">
                Be first when we launch!
              </p>
            </div>

            <!-- Account Setup Form -->
            <div class="px-6 py-3">
              <div class="mb-3">
                <div class="flex items-center justify-center gap-2 mb-2">
                  <div class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" :class="!otpSent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'">
                    1
                  </div>
                  <div class="w-8 h-0.5" :class="otpSent ? 'bg-indigo-600' : 'bg-gray-200'"></div>
                  <div class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" :class="otpSent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'">
                    2
                  </div>
                </div>
                <h3 class="text-base font-bold text-gray-900 text-center">
                  {{ !otpSent ? 'Your Information' : 'Verify & Secure' }}
                </h3>
              </div>
              
              <form @submit.prevent="handleSignUp" class="space-y-2">
                <!-- Step 1: Personal Information -->
                <div v-if="!otpSent">
                  <!-- Name Fields -->
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label for="firstName" class="block text-xs font-semibold text-gray-700 mb-1">
                        First Name <span class="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="firstName" 
                        v-model="signUpForm.firstName"
                        required
                        class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label for="lastName" class="block text-xs font-semibold text-gray-700 mb-1">
                        Last Name <span class="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="lastName" 
                        v-model="signUpForm.lastName"
                        required
                        class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <!-- Phone Number -->
                  <div class="mb-2">
                    <label for="phone" class="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number <span class="text-red-500">*</span>
                    </label>
                    <div class="flex rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                      <span class="inline-flex items-center px-2 text-xs font-medium text-gray-700 bg-gray-50 border-r border-gray-300">
                        +233
                      </span>
                      <input 
                        type="tel" 
                        id="phone" 
                        v-model="signUpForm.phone"
                        required
                        class="flex-1 px-3 py-1.5 text-sm border-0 focus:ring-0 text-gray-900"
                        placeholder="24 123 4567"
                      />
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="mb-2">
                    <label for="email" class="block text-xs font-semibold text-gray-700 mb-1">
                      Email
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      v-model="signUpForm.email"
                      class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="john@example.com"
                    />
                  </div>

                  <!-- Gender & City Row -->
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label for="gender" class="block text-xs font-semibold text-gray-700 mb-1">
                        Gender <span class="text-red-500">*</span>
                      </label>
                      <select 
                        id="gender" 
                        v-model="signUpForm.gender"
                        required
                        class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <!-- <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option> -->
                      </select>
                    </div>

                    <div class="mb-2">
                      <label for="city" class="block text-xs font-semibold text-gray-700 mb-1">
                        City <span class="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        id="city" 
                        v-model="signUpForm.city"
                        required
                        class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="Accra"
                      />
                    </div>
                  </div>

                  <!-- Age Verification -->
                  <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-2 mb-2">
                    <div class="flex items-start">
                      <input 
                        id="ageVerification" 
                        v-model="signUpForm.isOver18" 
                        type="checkbox"
                        required
                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5 cursor-pointer"
                      />
                      <label for="ageVerification" class="ml-2 block text-xs text-gray-800 cursor-pointer">
                        I'm <strong>18+</strong> and agree to receive SMS updates
                      </label>
                    </div>
                  </div>

                  <button 
                    type="button"
                    @click="sendOTP"
                    :disabled="!isFormValid || isSubmitting"
                    class="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span v-if="!isSubmitting" class="flex items-center justify-center">
                      Get Verification Code
                    </span>
                    <span v-else class="flex items-center justify-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Code...
                    </span>
                  </button>
                </div>

                <!-- Step 2: OTP and Password Section -->
                <div v-else>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                    <p class="text-xs text-blue-800">
                      Code sent to <strong>+233{{ signUpForm.phone }}</strong>
                    </p>
                  </div>

                  <div class="mb-2">
                    <label for="otp" class="block text-xs font-semibold text-gray-700 mb-1">
                      Code <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="otp" 
                      v-model="signUpForm.otp"
                      required
                      maxlength="6"
                      class="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-center text-lg tracking-widest font-mono"
                      placeholder="000000"
                    />
                  </div>

                  <div class="mb-2">
                    <label for="password" class="block text-xs font-semibold text-gray-700 mb-1">
                      Password <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="password" 
                      id="password" 
                      v-model="signUpForm.password"
                      required
                      minlength="6"
                      class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="Min 6 characters"
                    />
                  </div>

                  <div class="mb-2">
                    <label for="confirmPassword" class="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm <span class="text-red-500">*</span>
                    </label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      v-model="signUpForm.confirmPassword"
                      required
                      minlength="6"
                      class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      :class="signUpForm.password && signUpForm.confirmPassword && signUpForm.password !== signUpForm.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''"
                      placeholder="Re-enter password"
                    />
                    <p v-if="signUpForm.password && signUpForm.confirmPassword && signUpForm.password !== signUpForm.confirmPassword" 
                       class="mt-1 text-xs text-red-600">
                      Passwords don't match
                    </p>
                  </div>

                  <div class="flex gap-2">
                    <button 
                      type="button"
                      @click="otpSent = false"
                      class="px-4 py-2 text-xs bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      ← Back
                    </button>
                    <button 
                      type="submit"
                      :disabled="isSubmitting || !signUpForm.otp || signUpForm.password !== signUpForm.confirmPassword"
                      class="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <span v-if="!isSubmitting" class="flex items-center justify-center">
                        🎉 Create My Account
                      </span>
                      <span v-else class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              <div v-if="errorMessage" class="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <p class="text-xs text-red-800">{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();
const config = useRuntimeConfig();

const signUpForm = ref({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  gender: '',
  city: '',
  isOver18: false,
  otp: '',
  password: '',
  confirmPassword: ''
});

const isSubmitting = ref(false);
const errorMessage = ref('');
const otpSent = ref(false);
const showCongratulations = ref(false);
const customerName = ref('');
const customerPhone = ref('');

const isFormValid = computed(() => {
  return signUpForm.value.firstName && 
         signUpForm.value.lastName && 
         signUpForm.value.phone && 
         signUpForm.value.gender && 
         signUpForm.value.city && 
         signUpForm.value.isOver18;
});

const sendOTP = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;
  
  try {
    const formattedPhone = userStore.formatPhoneNumber(signUpForm.value.phone);
    const response = await fetch(`${config.public.apiBase}/api/auth/customer/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: formattedPhone,
        email: signUpForm.value.email || null
      })
    });
    
    const data = await response.json();
    
    // Handle case where phone or email already exists
    if (!data.success) {
      if (data.exists) {
        errorMessage.value = data.message;
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
      return;
    }
    
    otpSent.value = true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    errorMessage.value = error.message || 'Failed to send verification code. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleSignUp = async () => {
  if (signUpForm.value.password !== signUpForm.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  errorMessage.value = '';
  isSubmitting.value = true;
  
  try {
    const formattedPhone = userStore.formatPhoneNumber(signUpForm.value.phone);
    
    // Register the user
    const response = await fetch(`${config.public.apiBase}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: 1, // Default company for waitlist
        fname: signUpForm.value.firstName,
        lname: signUpForm.value.lastName,
        phone: formattedPhone,
        email: signUpForm.value.email || null,
        password: signUpForm.value.password,
        otp: signUpForm.value.otp,
        gender: signUpForm.value.gender,
        city: signUpForm.value.city,
        customer_type: 'retail'
      })
    });
    
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Registration failed');
    
    // Store customer info for congratulations message
    customerName.value = `${signUpForm.value.firstName} ${signUpForm.value.lastName}`;
    customerPhone.value = formattedPhone;
    
    // Send congratulations SMS
    await sendCongratulationsSMS(formattedPhone, signUpForm.value.firstName);
    
    // Show congratulations
    showCongratulations.value = true;
    
  } catch (error) {
    console.error('Sign up error:', error);
    errorMessage.value = error.message || 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const sendCongratulationsSMS = async (phone, firstName) => {
  try {
    const message = `Congratulations ${firstName}! Welcome to RigelOS Online Pharmacy Portal. You're now on our priority list and will be the first to know when we launch in your area. Get ready for stress-free medicine delivery!`;
    
    await fetch(`${config.public.apiBase}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        message: message
      })
    });
  } catch (error) {
    console.error('Error sending congratulations SMS:', error);
    // Don't throw error - SMS is not critical
  }
};

const resetForm = () => {
  showCongratulations.value = false;
  otpSent.value = false;
  signUpForm.value = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    city: '',
    isOver18: false,
    otp: '',
    password: '',
    confirmPassword: ''
  };
  errorMessage.value = '';
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #6366f1, #a855f7);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #4f46e5, #9333ea);
}
</style>