<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Fix Sales Items
        </h1>
        <p class="text-gray-600">
          Update sales items with missing product information and dates using fuzzy matching
        </p>
      </div>

      <!-- Configuration Form -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                id="startDate"
                v-model="formData.startDate"
                type="date"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                id="endDate"
                v-model="formData.endDate"
                type="date"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Time Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="startHour" class="block text-sm font-medium text-gray-700 mb-2">
                Start Hour (0-23)
              </label>
              <input
                id="startHour"
                v-model.number="formData.startHour"
                type="number"
                min="0"
                max="23"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">Default: 8 (8 AM)</p>
            </div>

            <div>
              <label for="endHour" class="block text-sm font-medium text-gray-700 mb-2">
                End Hour (0-23)
              </label>
              <input
                id="endHour"
                v-model.number="formData.endHour"
                type="number"
                min="0"
                max="23"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">Default: 18 (6 PM)</p>
            </div>
          </div>

          <!-- Company ID -->
          <div>
            <label for="companyId" class="block text-sm font-medium text-gray-700 mb-2">
              Company ID (Optional)
            </label>
            <input
              id="companyId"
              v-model.number="formData.companyId"
              type="number"
              min="1"
              placeholder="Leave empty to process all companies"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 mt-1">
              Leave empty to process all companies, or enter a specific company ID
            </p>
          </div>

          <!-- Exclude Days -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                Exclude Days (Optional)
              </label>
              <div class="flex space-x-2">
                <button
                  type="button"
                  @click="setWeekendExclusion"
                  class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Weekends Only
                </button>
                <button
                  type="button"
                  @click="setWeekdayExclusion"
                  class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Weekdays Only
                </button>
                <button
                  type="button"
                  @click="clearExclusion"
                  class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label 
                v-for="day in daysOfWeek" 
                :key="day.value"
                class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  :value="day.value"
                  v-model="formData.excludeDays"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700">{{ day.label }}</span>
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Select days to exclude from date generation (e.g., weekends)
            </p>
            <p v-if="formData.excludeDays.length === 7" class="text-xs text-red-600 mt-1">
              Cannot exclude all days of the week
            </p>
          </div>

       

          <!-- Submit Buttons -->
          <div class="flex items-center justify-between gap-4">
            <button
              type="button"
              @click="checkItemsCount"
              :disabled="loading || checking || generating"
              class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ checking ? 'Checking...' : 'Check Items Count' }}
            </button>

            <div class="flex gap-3">
              <button
                type="button"
                @click="generateSQL"
                :disabled="loading || checking || generating"
                class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {{ generating ? 'Generating...' : 'Generate SQL' }}
              </button>

              <button
                type="submit"
                :disabled="loading || checking || generating"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {{ loading ? 'Processing...' : 'Fix Items' }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- SQL Output -->
      <div v-if="generatedSQL" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Generated SQL</h2>
          <button
            @click="copySQL"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            {{ copied ? '✓ Copied!' : 'Copy to Clipboard' }}
          </button>
        </div>
        
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-700 mb-2">
            <span class="font-medium">Total Updates:</span> {{ generatedSQL.stats?.updates || 0 }}
          </p>
          <p class="text-sm text-gray-700 mb-2">
            <span class="font-medium">Ref Groups:</span> {{ generatedSQL.stats?.refGroups || 0 }}
          </p>
          <p class="text-sm text-gray-600 italic">
            Copy this SQL and run it in MySQL Workbench for faster execution
          </p>
        </div>

        <div class="relative">
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96"><code>{{ generatedSQL.sql }}</code></pre>
        </div>
      </div>

      <!-- Items Count -->
      <div v-if="itemsCount !== null" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              Found {{ itemsCount }} sales item{{ itemsCount !== 1 ? 's' : '' }} that need fixing
            </h3>
            <p class="text-sm text-yellow-700 mt-1">
              {{ formData.companyId ? `For company ID: ${formData.companyId}` : 'Across all companies' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-if="result" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Results</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">{{ result.stats.total }}</div>
            <div class="text-sm text-gray-600">Total Processed</div>
          </div>

          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ result.stats.updated }}</div>
            <div class="text-sm text-gray-600">Updated</div>
          </div>

          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ result.stats.matched }}</div>
            <div class="text-sm text-gray-600">Matched</div>
          </div>

          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-yellow-600">{{ result.stats.notMatched }}</div>
            <div class="text-sm text-gray-600">Not Matched</div>
          </div>

          <div class="bg-red-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-600">{{ result.stats.errors }}</div>
            <div class="text-sm text-gray-600">Errors</div>
          </div>
        </div>

        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-800 font-medium">{{ result.message }}</p>
        </div>

        <!-- Errors -->
        <div v-if="result.errors && result.errors.length > 0" class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Errors</h3>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <ul class="space-y-2">
              <li v-for="(error, index) in result.errors" :key="index" class="text-sm text-red-800">
                <span class="font-medium">Sales Item {{ error.salesItemId }}:</span> {{ error.error }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error</h3>
            <div class="mt-2 text-sm text-red-700">{{ error }}</div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="history.length > 0" class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Runs</h2>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excluded Days</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in history" :key="index">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatTime(item.timestamp) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.startDate }} to {{ item.endDate }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.companyId || 'All' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatExcludedDays(item.excludeDays) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {{ item.updated }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                  {{ item.errors }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin-layout',
  middleware: ['admin-auth']
});

const config = useRuntimeConfig();
const api = useApi();

// Days of week options
const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

// Form data
const formData = ref({
  startDate: '',
  endDate: '',
  startHour: 8,
  endHour: 18,
  companyId: null,
  excludeDays: []
});

// State
const loading = ref(false);
const checking = ref(false);
const generating = ref(false);
const result = ref(null);
const error = ref(null);
const itemsCount = ref(null);
const history = ref([]);
const generatedSQL = ref(null);
const copied = ref(false);

// Set default dates (last 30 days)
onMounted(() => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  formData.value.endDate = today.toISOString().split('T')[0];
  formData.value.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  // Load history from localStorage
  const savedHistory = localStorage.getItem('fixSalesItemsHistory');
  if (savedHistory) {
    history.value = JSON.parse(savedHistory);
  }
});

// Validate form
const validateForm = () => {
  if (!formData.value.startDate || !formData.value.endDate) {
    error.value = 'Please provide both start and end dates';
    return false;
  }

  const start = new Date(formData.value.startDate);
  const end = new Date(formData.value.endDate);

  if (start >= end) {
    error.value = 'Start date must be before end date';
    return false;
  }

  if (formData.value.startHour < 0 || formData.value.startHour > 23) {
    error.value = 'Start hour must be between 0 and 23';
    return false;
  }

  if (formData.value.endHour < 0 || formData.value.endHour > 23) {
    error.value = 'End hour must be between 0 and 23';
    return false;
  }

  if (formData.value.startHour >= formData.value.endHour) {
    error.value = 'Start hour must be less than end hour';
    return false;
  }

  if (formData.value.companyId !== null && formData.value.companyId <= 0) {
    error.value = 'Company ID must be a positive number';
    return false;
  }

  if (formData.value.excludeDays.length === 7) {
    error.value = 'Cannot exclude all days of the week';
    return false;
  }

  return true;
};

// Check items count
const checkItemsCount = async () => {
  if (!validateForm()) return;

  checking.value = true;
  error.value = null;
  itemsCount.value = null;

  try {
    const params = new URLSearchParams();
    if (formData.value.companyId) {
      params.append('companyId', formData.value.companyId);
    }

    const endpoint = `/api/sync/admin/sales-items/count${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(endpoint);

    if (response.success) {
      itemsCount.value = response.count;
    } else {
      error.value = response.message || 'Failed to check items count';
    }
  } catch (err) {
    console.error('Error checking items count:', err);
    error.value = err.message || 'Failed to check items count';
  } finally {
    checking.value = false;
  }
};

// Submit form
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const payload = {
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      startHour: formData.value.startHour,
      endHour: formData.value.endHour,
      companyId: formData.value.companyId || undefined,
      excludeDays: formData.value.excludeDays.length > 0 ? formData.value.excludeDays : undefined
    };

    const response = await api.post('/api/sync/admin/fix-sales-items', payload);

    if (response.success) {
      result.value = response;
      
      // Add to history
      history.value.unshift({
        timestamp: new Date().toISOString(),
        startDate: formData.value.startDate,
        endDate: formData.value.endDate,
        companyId: formData.value.companyId,
        excludeDays: formData.value.excludeDays,
        updated: response.stats.updated,
        errors: response.stats.errors
      });

      // Keep only last 10 runs
      if (history.value.length > 10) {
        history.value = history.value.slice(0, 10);
      }

      // Save to localStorage
      localStorage.setItem('fixSalesItemsHistory', JSON.stringify(history.value));
      
      // Reset items count
      itemsCount.value = null;
    } else {
      error.value = response.message || 'Failed to fix sales items';
    }
  } catch (err) {
    console.error('Error fixing sales items:', err);
    error.value = err.message || 'Failed to fix sales items';
  } finally {
    loading.value = false;
  }
};

// Format timestamp
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

// Format excluded days
const formatExcludedDays = (excludeDays) => {
  if (!excludeDays || excludeDays.length === 0) return 'None';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return excludeDays.map(day => dayNames[day]).join(', ');
};

// Preset exclusion functions
const setWeekendExclusion = () => {
  formData.value.excludeDays = [0, 6]; // Sunday and Saturday
};

const setWeekdayExclusion = () => {
  formData.value.excludeDays = [1, 2, 3, 4, 5]; // Monday to Friday
};

// Generate SQL
const generateSQL = async () => {
  if (!validateForm()) return;

  generating.value = true;
  error.value = null;
  generatedSQL.value = null;
  copied.value = false;

  try {
    const payload = {
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      startHour: formData.value.startHour,
      endHour: formData.value.endHour,
      companyId: formData.value.companyId || undefined,
      excludeDays: formData.value.excludeDays.length > 0 ? formData.value.excludeDays : undefined
    };

    const response = await api.post('/api/sync/admin/generate-sales-items-sql', payload);

    if (response.success) {
      generatedSQL.value = response;
    } else {
      error.value = response.message || 'Failed to generate SQL';
    }
  } catch (err) {
    console.error('Error generating SQL:', err);
    error.value = err.message || 'Failed to generate SQL';
  } finally {
    generating.value = false;
  }
};

// Copy SQL to clipboard
const copySQL = async () => {
  if (!generatedSQL.value?.sql) return;

  try {
    await navigator.clipboard.writeText(generatedSQL.value.sql);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    alert('Failed to copy SQL to clipboard');
  }
};

const clearExclusion = () => {
  formData.value.excludeDays = [];
};
</script>

<style scoped>
/* Add any custom styles here */
</style>
