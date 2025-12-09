<!-- File: pages/admin/signups.vue -->
<!-- Landing Page Waitlist Signups Dashboard -->
<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl font-bold text-gray-800">Waitlist Signups</h1>
          <p class="text-gray-600 mt-1">View all customers who signed up from the landing page</p>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="text-sm text-gray-600">
            <span class="font-semibold text-indigo-600">{{ totalSignups }}</span> Total Signups
          </div>
          
          <button @click="fetchSignups" :disabled="isLoading" class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 flex items-center disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5 mr-1.5', isLoading ? 'animate-spin' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <button @click="exportToCSV" :disabled="signups.length === 0" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>

    <!-- Filter and Search Section -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              id="search" 
              v-model="searchQuery"
              placeholder="Search by name, phone, email, or city" 
              class="pl-10 px-4 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div class="w-full sm:w-48">
          <label for="gender-filter" class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select 
            id="gender-filter" 
            v-model="genderFilter"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
        
        <div class="w-full sm:w-48">
          <label for="city-filter" class="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select 
            id="city-filter" 
            v-model="cityFilter"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Cities</option>
            <option v-for="city in uniqueCities" :key="city" :value="city">{{ city }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Signups</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalSignups }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Male</p>
            <p class="text-2xl font-bold text-gray-900">{{ genderStats.male }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-pink-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Female</p>
            <p class="text-2xl font-bold text-gray-900">{{ genderStats.female }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">With Email</p>
            <p class="text-2xl font-bold text-gray-900">{{ emailStats }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <p class="text-sm text-red-800">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Signups Table -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Signed Up
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="filteredSignups.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                No signups found
              </td>
            </tr>
            <tr v-for="signup in filteredSignups" :key="signup.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span class="text-indigo-600 font-semibold text-sm">
                      {{ getInitials(signup.fname, signup.lname) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ signup.fname }} {{ signup.lname }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ signup.phone }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ signup.email || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getGenderBadgeClass(signup.gender)">
                  {{ formatGender(signup.gender) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ signup.city || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(signup.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '~/stores/admin';

definePageMeta({
  layout: 'admin-layout',
  middleware: ['admin-auth']
});

const config = useRuntimeConfig();
const adminStore = useAdminStore();

// State
const signups = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');
const genderFilter = ref('');
const cityFilter = ref('');

// Fetch signups from API
const fetchSignups = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await fetch(`${config.public.apiBase}/api/admin/signups`, {
      headers: {
        'Authorization': `Bearer ${adminStore.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: Failed to fetch signups`);
    }
    
    signups.value = data.data || [];
    console.log('Loaded signups:', signups.value.length);
  } catch (error) {
    console.error('Error fetching signups:', error);
    errorMessage.value = error.message || 'Failed to load signups';
  } finally {
    isLoading.value = false;
  }
};

// Computed: Total signups
const totalSignups = computed(() => signups.value.length);

// Computed: Gender statistics
const genderStats = computed(() => {
  const stats = { male: 0, female: 0, other: 0 };
  signups.value.forEach(signup => {
    if (signup.gender === 'male') stats.male++;
    else if (signup.gender === 'female') stats.female++;
    else stats.other++;
  });
  return stats;
});

// Computed: Email statistics
const emailStats = computed(() => {
  return signups.value.filter(s => s.email && s.email.trim() !== '').length;
});

// Computed: Unique cities
const uniqueCities = computed(() => {
  const cities = [...new Set(signups.value.map(s => s.city).filter(Boolean))];
  return cities.sort();
});

// Computed: Filtered signups
const filteredSignups = computed(() => {
  let filtered = [...signups.value];
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s => 
      (s.fname && s.fname.toLowerCase().includes(query)) ||
      (s.lname && s.lname.toLowerCase().includes(query)) ||
      (s.phone && s.phone.includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.city && s.city.toLowerCase().includes(query))
    );
  }
  
  // Gender filter
  if (genderFilter.value) {
    filtered = filtered.filter(s => s.gender === genderFilter.value);
  }
  
  // City filter
  if (cityFilter.value) {
    filtered = filtered.filter(s => s.city === cityFilter.value);
  }
  
  return filtered;
});

// Helper: Get initials
const getInitials = (fname, lname) => {
  const first = fname ? fname.charAt(0).toUpperCase() : '';
  const last = lname ? lname.charAt(0).toUpperCase() : '';
  return first + last || '?';
};

// Helper: Format gender
const formatGender = (gender) => {
  const map = {
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
    'prefer_not_to_say': 'N/A'
  };
  return map[gender] || gender || 'N/A';
};

// Helper: Get gender badge class
const getGenderBadgeClass = (gender) => {
  const classes = {
    'male': 'bg-blue-100 text-blue-800',
    'female': 'bg-pink-100 text-pink-800',
    'other': 'bg-purple-100 text-purple-800',
    'prefer_not_to_say': 'bg-gray-100 text-gray-800'
  };
  return classes[gender] || 'bg-gray-100 text-gray-800';
};

// Helper: Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Export to CSV
const exportToCSV = () => {
  const headers = ['Name', 'Phone', 'Email', 'Gender', 'City', 'Signed Up'];
  const rows = filteredSignups.value.map(s => [
    `${s.fname} ${s.lname}`,
    s.phone,
    s.email || '',
    formatGender(s.gender),
    s.city || '',
    formatDate(s.created_at)
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `waitlist-signups-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Lifecycle
onMounted(() => {
  fetchSignups();
});
</script>

<style scoped>
/* Custom styles if needed */
</style>
