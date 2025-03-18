<!-- pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="errorMessage" class="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
      <p>{{ errorMessage }}</p>
    </div>
    
    <div v-if="redirectMessage" class="mb-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
      <p>{{ redirectMessage }}</p>
    </div>
    
    <PharmacySelection />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const errorMessage = ref('');
const redirectTo = computed(() => route.query.redirect || null);

// Generate a friendly message about redirect
const redirectMessage = computed(() => {
  if (!redirectTo.value) return '';
  return 'Please select a pharmacy to continue to your destination.';
});

onMounted(() => {
  // Handle any error messages passed via query params
  if (route.query.error === 'pharmacy-not-found') {
    errorMessage.value = 'The pharmacy you requested was not found. Please select another pharmacy.';
  }
});
</script>