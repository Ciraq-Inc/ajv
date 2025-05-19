<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div class="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4">
      <h2 class="text-lg font-medium text-white">OTP Authentication Settings</h2>
      <p class="text-indigo-100 text-sm">Configure mNotify integration for SMS verification</p>
    </div>
    
    <div class="p-4">
      <!-- Success message -->
      <div v-if="showSuccess" class="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-3">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Settings updated successfully!</span>
        </div>
      </div>
      
      <form @submit.prevent="saveSettings">
        <div class="space-y-4">
          <!-- mNotify API Key -->
          <div>
            <label for="api-key" class="block text-sm font-medium text-gray-700">mNotify API Key</label>
            <input v-model="settings.mNotifyApiKey" type="text" id="api-key"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your mNotify API key">
            <p class="mt-1 text-xs text-gray-500">
              Get your API key from <a href="https://mnotify.com" target="_blank" class="text-indigo-600 hover:text-indigo-800">mNotify.com</a>
            </p>
          </div>
          
          <!-- Sender ID -->
          <div>
            <label for="sender-id" class="block text-sm font-medium text-gray-700">Sender ID</label>
            <input v-model="settings.senderID" type="text" id="sender-id" maxlength="11"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="PHARMACY">
            <p class="mt-1 text-xs text-gray-500">Maximum 11 characters. Must be approved by mNotify.</p>
          </div>
          
          <!-- OTP Length -->
          <div>
            <label for="otp-length" class="block text-sm font-medium text-gray-700">OTP Length</label>
            <select v-model="settings.otpLength" id="otp-length"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="4">4 digits</option>
              <option value="6">6 digits</option>
              <option value="8">8 digits</option>
            </select>
          </div>
          
          <!-- OTP Expiry -->
          <div>
            <label for="otp-expiry" class="block text-sm font-medium text-gray-700">OTP Expiry Time</label>
            <select v-model="settings.otpExpiryMinutes" id="otp-expiry"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="1">1 minute</option>
              <option value="2">2 minutes</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
          
          <!-- Max Retries -->
          <div>
            <label for="max-retries" class="block text-sm font-medium text-gray-700">Maximum Verification Attempts</label>
            <select v-model="settings.maxRetries" id="max-retries"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="1">1 attempt</option>
              <option value="2">2 attempts</option>
              <option value="3">3 attempts</option>
              <option value="5">5 attempts</option>
            </select>
          </div>
          
          <!-- Test OTP -->
          <div class="pt-4 border-t">
            <h3 class="text-md font-medium text-gray-900 mb-2">Test OTP Delivery</h3>
            <div class="flex space-x-2">
              <input v-model="testPhone" type="tel"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter phone number">
              <button type="button" @click="sendTestOTP"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                :disabled="isSendingTest">
                <span v-if="isSendingTest">Testing...</span>
                <span v-else>Send Test</span>
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">This will send a test OTP to the phone number.</p>
            
            <!-- Test Result -->
            <div v-if="testResult" :class="[
              'mt-2 p-2 text-sm rounded',
              testSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            ]">
              {{ testResult }}
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button type="submit" :disabled="isSaving"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span v-if="isSaving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { usePharmacyStore } from '~/stores/pharmacy';
import { otpConfig } from '~/utils/otpConfig';
import { otpService } from '~/utils/otpService';

const pharmacyStore = usePharmacyStore();

// State
const settings = reactive({
  mNotifyApiKey: '',
  senderID: 'PHARMACY',
  otpLength: 6,
  otpExpiryMinutes: 5,
  maxRetries: 3
});

const isSaving = ref(false);
const showSuccess = ref(false);
const testPhone = ref('');
const isSendingTest = ref(false);
const testResult = ref('');
const testSuccess = ref(false);

// Computed
const pharmacyId = computed(() => pharmacyStore.currentPharmacy);

// Convert OTP expiry from minutes to milliseconds
const otpExpiryMs = computed(() => settings.otpExpiryMinutes * 60 * 1000);

// Load settings on component mount
onMounted(() => {
  // Load config from storage
  const config = otpConfig.loadConfig(pharmacyId.value);
  
  // Update reactive settings
  settings.mNotifyApiKey = config.mNotifyApiKey || '';
  settings.senderID = config.senderID || 'PHARMACY';
  settings.otpLength = config.otpLength || 6;
  settings.maxRetries = config.maxRetries || 3;
  
  // Convert milliseconds to minutes for the UI
  settings.otpExpiryMinutes = (config.otpExpiry || 300000) / (60 * 1000);
});

// Save settings
const saveSettings = async () => {
  isSaving.value = true;
  
  try {
    // Convert minutes to milliseconds for storage
    const updatedConfig = otpConfig.updateConfig(pharmacyId.value, {
      mNotifyApiKey: settings.mNotifyApiKey,
      senderID: settings.senderID,
      otpLength: parseInt(settings.otpLength),
      otpExpiry: parseInt(settings.otpExpiryMinutes) * 60 * 1000,
      maxRetries: parseInt(settings.maxRetries)
    });
    
    // Update the OTP service with new settings
    otpService.otpLength = updatedConfig.otpLength;
    otpService.otpExpiry = updatedConfig.otpExpiry;
    otpService.mNotifyApiKey = updatedConfig.mNotifyApiKey;
    
    // Show success message
    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error saving OTP settings:', error);
    alert('Failed to save settings. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Send test OTP
const sendTestOTP = async () => {
  if (!testPhone.value) {
    alert('Please enter a phone number for testing');
    return;
  }
  
  isSendingTest.value = true;
  testResult.value = '';
  testSuccess.value = false;
  
  try {
    // Format the phone number
    const formattedPhone = otpService.formatPhoneNumber(testPhone.value);
    
    // Generate a test OTP
    const otp = otpService.generateOtp();
    
    // Update service with current settings
    otpService.mNotifyApiKey = settings.mNotifyApiKey;
    
    // Send the OTP using mNotify
    const response = await otpService.sendOtpViaMNotify(formattedPhone, otp);
    
    // Show success message
    testResult.value = `Test OTP sent successfully! Code: ${otp} (Only shown for testing purposes)`;
    testSuccess.value = true;
    
  } catch (error) {
    console.error('Error sending test OTP:', error);
    testResult.value = `Error: ${error.message || 'Failed to send test OTP'}`;
    testSuccess.value = false;
  } finally {
    isSendingTest.value = false;
  }
};
</script>