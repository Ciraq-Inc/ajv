<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto bg-gradient-to-br from-white via-purple-50 to-purple-100">
    <!-- Background sparkle decorations -->
    <svg class="absolute top-10 left-12 w-6 h-6 text-purple-400 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute top-1/4 right-16 w-10 h-10 text-purple-300 opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute bottom-20 left-1/4 w-8 h-8 text-fuchsia-300 opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute bottom-12 right-20 w-5 h-5 text-purple-200 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute top-1/3 left-1/3 w-4 h-4 text-purple-300 opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>

    <!-- Modal Container -->
    <div class="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md mx-4 overflow-hidden">

      <!-- Modal Header -->
      <div class="bg-gradient-to-br from-[#2A1130] to-[#5A2468] text-white py-8 px-6 text-center relative overflow-hidden">
        <!-- Header background sparkle -->
        <svg class="absolute -top-4 -right-4 w-24 h-24 text-white opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
        </svg>
        <svg class="absolute -bottom-6 -left-6 w-28 h-28 text-fuchsia-300 opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
        </svg>

        <!-- Rig Mark logo -->
        <img src="/brand/rig-mark.svg" alt="Rigelis" class="w-16 h-16 mx-auto mb-4" />

        <h3 class="text-lg font-semibold tracking-wide">
          {{ currentView === 'login' ? 'Rigelis Admin Portal' : 'Reset Password' }}
        </h3>
        <p class="text-purple-200 text-sm mt-1">
          {{ currentView === 'login' ? 'Sign in to access the admin dashboard' : 'Reset your admin password' }}
        </p>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <!-- Error Message -->
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

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <form v-if="currentView === 'login'" @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input v-model="username" type="text" id="username"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="Enter your username" required :disabled="isLoading" />
          </div>

          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input v-model="password" type="password" id="password"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="Enter your password" required :disabled="isLoading" />
          </div>

          <div class="mt-6">
            <button type="submit" :disabled="isLoading"
              class="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors">
              <span v-if="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                Signing in...
              </span>
              <span v-else class="flex items-center gap-2">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
                </svg>
                Sign In
              </span>
            </button>
          </div>
        </form>

        <!-- Password Reset Form -->
        <form v-else-if="currentView === 'reset'" @submit.prevent="handlePasswordReset">
          <div class="mb-4 text-sm text-gray-600 bg-purple-50 border border-purple-100 p-3 rounded-lg">
            <p>Enter your admin username or email to receive reset instructions</p>
          </div>

          <div class="mb-4">
            <label for="resetIdentifier" class="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
            <input v-model="resetIdentifier" type="text" id="resetIdentifier"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="Enter your username or email" required :disabled="isLoading" />
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="showLoginForm" :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Back to Login
            </button>
            <button type="submit" :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center transition-colors">
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
              <span v-else>Send Reset Instructions</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '~/stores/admin';

// Define layout
definePageMeta({
  layout: false, // No layout for login page
});

const adminStore = useAdminStore();
const router = useRouter();

// Form state
const currentView = ref('login'); // 'login' or 'reset'
const username = ref('');
const password = ref('');
const resetIdentifier = ref('');
const rememberMe = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Check if already logged in
onMounted(() => {
  if (adminStore.isAuthenticated) {
    navigateTo('/admin/data');
  }
});

// Show reset password form
const showResetForm = () => {
  currentView.value = 'reset';
  errorMessage.value = '';
  successMessage.value = '';
  resetIdentifier.value = '';
};

// Show login form
const showLoginForm = () => {
  currentView.value = 'login';
  errorMessage.value = '';
  successMessage.value = '';
  username.value = '';
  password.value = '';
};

// Handle login
const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    const result = await adminStore.login(username.value, password.value);

    if (result.success) {
      // Determine dashboard based on role
      const dashboardRoute = adminStore.getDashboardRoute;
      let message = 'Login successful! Redirecting...';
      
      if (adminStore.getRole === 'data_consumer') {
        message = 'Logging into Data Consumer Portal...';
      } else {
        message = 'Logging into Admin Portal...';
      }
      
      successMessage.value = message;

      // Wait a moment to show success message
      setTimeout(() => {
        // Check for intended route
        const intendedRoute = localStorage.getItem('adminIntendedRoute');
        if (intendedRoute) {
          localStorage.removeItem('adminIntendedRoute');
          navigateTo(intendedRoute);
        } else {
          navigateTo(dashboardRoute);
        }
      }, 1000);
    } else {
      errorMessage.value = result.message || 'Invalid credentials';
    }
  } catch (error) {
    errorMessage.value = 'An error occurred. Please try again.';
    console.error('Login error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Handle password reset
const handlePasswordReset = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    const result = await adminStore.requestPasswordReset(resetIdentifier.value);

    if (result.success) {
      successMessage.value = result.message || 'Reset instructions sent! Please check your email.';

      // Wait and return to login
      setTimeout(() => {
        showLoginForm();
      }, 3000);
    } else {
      errorMessage.value = result.message || 'Failed to send reset instructions';
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred. Please try again.';
    console.error('Password reset error:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
