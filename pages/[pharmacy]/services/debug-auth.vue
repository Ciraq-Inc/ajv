<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Authentication Debug</h1>
    
    <div class="space-y-4">
      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold mb-2">Company Store State</h2>
        <pre class="text-xs">{{ storeState }}</pre>
      </div>

      <div class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold mb-2">LocalStorage Tokens</h2>
        <pre class="text-xs">{{ localStorageTokens }}</pre>
      </div>

      <button
        @click="testApiCall"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Test Paystack Initialize API
      </button>

      <div v-if="apiResult" class="bg-gray-100 p-4 rounded">
        <h2 class="font-semibold mb-2">API Response</h2>
        <pre class="text-xs">{{ apiResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '~/stores/company'
import { useApi } from '~/composables/useApi'

definePageMeta({
  layout: 'company',
  middleware: 'company-auth',
})

const companyStore = useCompanyStore()
const { post } = useApi()

const localStorageTokens = ref({})
const apiResult = ref(null)

const storeState = computed(() => ({
  isLoggedIn: companyStore.isLoggedIn,
  hasToken: !!companyStore.companyAuthToken,
  tokenLength: companyStore.companyAuthToken?.length || 0,
  user: companyStore.user?.name || 'N/A',
  company: companyStore.company?.name || 'N/A'
}))

onMounted(() => {
  // Get all tokens from localStorage
  const tokens = {}
  
  if (process.client) {
    const companyDomain = window.location.pathname.match(/\/([^\/]+)\/services/)?.[1]
    
    tokens.companyDomain = companyDomain
    tokens[`company_${companyDomain}_token`] = localStorage.getItem(`company_${companyDomain}_token`)?.substring(0, 20) + '...'
    tokens.adminToken = localStorage.getItem('adminToken')?.substring(0, 20) + '...' || 'Not found'
    tokens.customerAuthToken = localStorage.getItem('customerAuthToken')?.substring(0, 20) + '...' || 'Not found'
    tokens.token = localStorage.getItem('token')?.substring(0, 20) + '...' || 'Not found'
  }
  
  localStorageTokens.value = tokens
})

const testApiCall = async () => {
  try {
    apiResult.value = 'Loading...'
    
    const response = await post('/api/sms-credits/paystack/initialize', {
      amount: 10,
      email: 'test@example.com'
    })
    
    apiResult.value = response
  } catch (error) {
    apiResult.value = {
      error: error.message,
      details: error.toString()
    }
  }
}
</script>
