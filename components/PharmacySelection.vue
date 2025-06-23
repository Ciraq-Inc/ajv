<!-- components/PharmacySelection.vue -->
<template>
  <div class="pharmacy-selection p-6 rounded-xl">
    <!-- Pharmacy Selection UI -->
    <div v-if="!selectingPharmacy">
      <h1 class="text-3xl font-bold mb-2 text-center text-indigo-800">Select Your Pharmacy</h1>
      <p class="text-center text-gray-600 mb-8">Choose a pharmacy to proceed with your order</p>
      
      <div v-if="loading" class="flex flex-col items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        <p class="mt-4 text-indigo-600 font-medium">Loading pharmacies...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg shadow-md mb-6">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="font-medium">{{ error }}</p>
        </div>
        <button @click="fetchPharmacies" class="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
    
    <!-- Pharmacy Loading Transition Screen -->
    <div v-if="selectingPharmacy" class="fixed inset-0 bg-indigo-900 bg-opacity-90 z-50 flex flex-col items-center justify-center text-white">
      <div class="flex flex-col items-center justify-center p-8 rounded-xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-white mb-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-6"></div>
        <h2 class="text-2xl font-bold mb-2">Connecting to Pharmacy</h2>
        <p class="text-center text-indigo-200 mb-4">Please wait while we set up your pharmacy connection...</p>
      </div>
    </div>
    
    <div v-else>
      <!-- Search box -->
      <div class="mb-8 max-w-2xl mx-auto">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by pharmacy name or location..." 
            class="w-full pl-10 pr-10 py-4 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-md text-gray-700"
          />
          <span v-if="searchQuery" @click="searchQuery = ''" 
            class="absolute right-3 top-3 text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        </div>
      </div>
      
      <!-- Pharmacy list -->
      <div v-if="filteredPharmacies.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="pharmacy in filteredPharmacies" 
          :key="pharmacy.id"
          class="bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
          @click="selectPharmacy(pharmacy)"
        >
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-800">{{ pharmacy.name }}</h2>
          </div>
          
          <div class="flex items-center gap-x-2 mb-3 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>{{ pharmacy.location }}</p>
          </div>

          <div class="flex items-center gap-x-2 mb-4 text-gray-600" v-if="pharmacy.tel">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p>{{ pharmacy.tel }}</p>
          </div>
          
          <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Select Pharmacy
          </button>
        </div>
      </div>
      
      <!-- No results -->
      <div v-else-if="searchQuery" class="text-center py-12 bg-white rounded-xl shadow-md max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">No pharmacies found</h3>
        <p class="text-gray-500 mb-5">
          We couldn't find any pharmacies matching<br>"<span class="font-medium">{{ searchQuery }}</span>"
        </p>
        <button @click="searchQuery = ''" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors duration-200">
          Clear Search
        </button>
      </div>
      
      <!-- No pharmacies -->
      <div v-else class="text-center py-12 bg-white rounded-xl shadow-md max-w-md mx-auto">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">No pharmacies available</h3>
        <p class="text-gray-500">
          There are currently no pharmacies in our directory
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';

const router = useRouter();
const route = useRoute();
const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();

const pharmacies = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const selectingPharmacy = ref(false);

// Get any redirectParam from the URL
const redirectTo = computed(() => route.query.redirect || '/');

const filteredPharmacies = computed(() => {
  if (!searchQuery.value) return pharmacies.value;
  
  const query = searchQuery.value.toLowerCase();
  return pharmacies.value.filter(pharmacy => 
    pharmacy.name.toLowerCase().includes(query) ||
    pharmacy.location.toLowerCase().includes(query)
  );
});

const fetchPharmacies = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const db = getDatabase();
    const pharmaciesRef = dbRef(db, 'pharmacies');
    const snapshot = await get(pharmaciesRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const pharmacyList = [];
      
      // Process pharmacy data
      for (const [id, pharmacy] of Object.entries(data)) {
        if (pharmacy.info) {
          pharmacyList.push({
            id,
            name: pharmacy.info.name || 'Unknown Pharmacy',
            location: pharmacy.info.location || 'Location not provided',
            tel: pharmacy.info.phone || 'No contact information',
            subdomain: pharmacy.info.subdomain || id 
          });
        }
      }
      
      pharmacies.value = pharmacyList;
    } else {
      pharmacies.value = [];
    }
  } catch (err) {
    console.error('Error fetching pharmacies:', err);
    error.value = 'Failed to load pharmacies. Please try again.';
  } finally {
    loading.value = false;
  }
};

const selectPharmacy = async (pharmacy) => {
  try {
    // Show selecting pharmacy state
    selectingPharmacy.value = true;
    
    // Clear any existing pharmacy context first
    pharmacyStore.clearPharmacyData();
    
    // Set in pharmacy store
    await pharmacyStore.setCurrentPharmacy(pharmacy.id);
    
    // Set pharmacy slug for URL routing
    const slug = pharmacy.subdomain || pharmacy.id;
    pharmacyStore.setPharmacySlug(slug);
    
    // Set in cart store
    const cartResult = await cartStore.setActivePharmacy(pharmacy.id, slug);
    
    // Only redirect if cart was successfully set (user didn't cancel pharmacy switch)
    if (cartResult !== false) {
      // Redirect to the target page with pharmacy in URL
      const targetPath = redirectTo.value;
      
      // Use the pharmacy path helper for correct routing
      router.push(pharmacyStore.getPharmacyPath(targetPath === '/' ? '' : targetPath));
    } else {
      // If user cancelled, hide the selecting state
      selectingPharmacy.value = false;
    }
  } catch (err) {
    console.error('Error selecting pharmacy:', err);
    error.value = 'Failed to select pharmacy. Please try again.';
    selectingPharmacy.value = false;
  }
};

onMounted(() => {
  fetchPharmacies();
});
</script>

<style scoped>
.pharmacy-selection {
  min-height: 70vh;
}
</style>
