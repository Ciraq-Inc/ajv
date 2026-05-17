<template>
  <section class="border border-gray-200 rounded-xl p-4">
    <h3 class="text-base font-semibold text-gray-900">Guest Verification</h3>
    <p class="text-sm text-gray-600 mt-1">Verify your phone with SMS OTP before applying.</p>

    <div class="mt-4 grid md:grid-cols-3 gap-3">
      <input
        v-model="phoneValue"
        type="tel"
        placeholder="Phone number"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <button
        class="px-3 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-black"
        :disabled="loading ?? false"
        @click="onRequestOtp"
      >
        Request OTP
      </button>
      <input
        v-model="codeValue"
        type="text"
        placeholder="6-digit code"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
    </div>

    <div class="mt-3 flex items-center gap-3">
      <button
        class="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
        :disabled="(loading ?? false) || !phoneValue || !codeValue"
        @click="onVerifyOtp"
      >
        Verify OTP
      </button>
      <span v-if="verified" class="text-sm text-emerald-700 font-medium">Phone verified</span>
    </div>

    <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
    <p v-if="debugCode" class="text-xs text-amber-700 mt-2">Dev code: {{ debugCode }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  loading?: boolean
  verified?: boolean
  error?: string
  debugCode?: string
  phone?: string
}>()

const emit = defineEmits<{
  'request-otp': [phone: string]
  'verify-otp': [payload: { phone: string; code: string }]
  'update:phone': [value: string]
}>()

const phoneValue = ref(props.phone ?? '')
const codeValue = ref('')

watch(
  () => props.phone,
  (value) => { phoneValue.value = value ?? '' },
)

watch(phoneValue, (value) => { emit('update:phone', value) })

const onRequestOtp = (): void => emit('request-otp', phoneValue.value)

const onVerifyOtp = (): void => {
  emit('verify-otp', { phone: phoneValue.value, code: codeValue.value })
}
</script>
