<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <div class="flex justify-center">
          <div class="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center">
            <span class="text-5xl text-white">🚫</span>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Access Denied
        </h2>
        <p class="mt-2 text-center text-base text-gray-600">
          You don't have permission to access this page.
        </p>
        <p class="mt-1 text-center text-sm text-gray-500">
          Please contact your administrator if you believe this is an error.
        </p>
      </div>

      <!-- Admin Info if available -->
      <div v-if="adminStore.admin" class="bg-white rounded-lg shadow-md p-6 text-left">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Your Details:</h3>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Name:</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ adminStore.admin.fname }} {{ adminStore.admin.lname }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Username:</dt>
            <dd class="text-sm font-medium text-gray-900">{{ adminStore.admin.username }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-sm text-gray-600">Role:</dt>
            <dd class="text-sm font-medium text-red-600">{{ adminStore.admin.role }}</dd>
          </div>
        </dl>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col space-y-3">
        <button
          @click="goBack"
          class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go Back
        </button>
        <button
          @click="goToDashboard"
          class="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go to Dashboard
        </button>
        <button
          @click="logout"
          class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>

      <!-- Role Hierarchy Info -->
      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
        <p class="text-xs text-blue-800 font-semibold mb-2">Admin Role Hierarchy:</p>
        <div class="text-xs text-blue-700 space-y-1">
          <p>• Level 1: business_analyst</p>
          <p>• Level 2: support_agent</p>
          <p>• Level 3: auditor</p>
          <p>• Level 4: super_admin</p>
        </div>
        <p class="text-xs text-blue-600 mt-2 italic">
          Higher roles inherit permissions from lower roles.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdminStore } from '~/stores/admin';

// Define layout
definePageMeta({
  layout: false,
});

const adminStore = useAdminStore();
const router = useRouter();

const goBack = () => {
  router.back();
};

const goToDashboard = () => {
  navigateTo('/admin/data');
};

const logout = () => {
  adminStore.logout();
  navigateTo('/admin/login');
};
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
