<template>
  <div class="bg-grey h-full">
    <Navbar />
    
    <!-- Loading State -->
    <div v-if="pharmacyStore.isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="pharmacyStore.error" class="max-w-4xl mx-auto px-4 py-8 text-center">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Something went wrong while loading pharmacy data. Please try again later.</p>
      </div>
    </div>
    
    <!-- Pharmacy Not Found -->
    <PharmacyNotFound v-else-if="pharmacyStore.isNotFound" />
    
    <!-- Pharmacy Data Loaded Successfully -->
    <div v-else>
      <div class="px-4 py-2">
        <!-- Pharmacy Info Header -->
        <div class="text-center my-8" v-if="pharmacyStore.pharmacyData">
          <h2 class="h2 mb-2">{{ pharmacyStore.pharmacyData.name }}</h2>
          <p class="text-gray-600">{{ pharmacyStore.pharmacyData.location }}</p>
          <p class="text-gray-600 mt-1">
            <span class="font-medium">Tel:</span> {{ pharmacyStore.pharmacyData.tel }}
          </p>
        </div>
        
        <!-- Search Bar and Tabs -->
        <div class="max-w-2xl mx-auto mb-12 flex items-center space-x-4">
          <div class="relative flex-grow">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </span>
            <input
              type="search"
              v-model="searchQuery"
              class="w-full pl-12 h-14 text-lg rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Search medications..."
            />
          </div>
          
          <!-- Tabs -->
          <div class="md:flex space-x-4 hidden">
            <button 
              @click="activeTab = 'table'"
              :class="[
                'px-4 py-2 rounded-lg transition-all',
                activeTab === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-400 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Table View
            </button>
            <button 
              @click="activeTab = 'grid'"
              :class="[
                'px-4 py-2 rounded-lg transition-all',
                activeTab === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-400 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Grid View
            </button>
          </div>
        </div>
        
        <!-- No Products Message -->
        <div v-if="!pharmacyStore.hasProducts" class="text-center py-16">
          <h3 class="text-2xl font-semibold text-gray-700">No Products Available</h3>
          <p class="text-gray-600 mt-2">This pharmacy currently has no products in stock.</p>
        </div>
        
        <!-- Products Display -->
        <div v-else>
          <!-- Dynamic Content -->
          <div class="hidden md:block">
            <DrugTable v-if="activeTab === 'table'" :searchQuery="searchQuery" />
            <DrugCard v-else :searchQuery="searchQuery" />
          </div>
          
          <div class="md:hidden flex">
            <DrugCard :searchQuery="searchQuery" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePharmacyStore } from '../stores/pharmacy.js';

const searchQuery = ref('');
const activeTab = ref('table'); // Default to table view
const pharmacyStore = usePharmacyStore();
</script>