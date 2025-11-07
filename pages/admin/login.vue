<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black opacity-10"></div>

    <!-- Modal Container -->
    <div class="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-indigo-600 text-white py-4 px-6">
        <h3 class="text-lg font-medium">
          Rigelis Admin Portal
        </h3>
        <p class="text-indigo-100 text-sm mt-1">
          Sign in to access the admin dashboard
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
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              v-model="username"
              type="text"
              id="username"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your username"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              id="password"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your password"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="mb-4">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="rememberMe"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                Keep me logged in
              </label>
            </div>
          </div>

          <div class="mt-6">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 flex items-center justify-center"
            >
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
              <span v-else>Sign In</span>
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
const username = ref('');
const password = ref('');
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

// Handle login
const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    const result = await adminStore.login(username.value, password.value);

    if (result.success) {
      successMessage.value = 'Login successful! Redirecting...';

      // Wait a moment to show success message
      setTimeout(() => {
        // Check for intended route
        const intendedRoute = localStorage.getItem('adminIntendedRoute');
        if (intendedRoute) {
          localStorage.removeItem('adminIntendedRoute');
          navigateTo(intendedRoute);
        } else {
          navigateTo('/admin/data');
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
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
