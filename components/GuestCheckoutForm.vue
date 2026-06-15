<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="guest-form-title"
    ref="dialogRef"
    tabindex="-1"
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-[#1e1a22]/60 backdrop-blur-sm" @click="emit('close')"></div>

    <div style="font-family: 'Manrope', sans-serif;" class="min-h-full flex items-center justify-center p-4 sm:p-6">
      <div class="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-[#fff7ff] shadow-[0_32px_64px_-8px_rgba(30,26,34,0.22),0_0_0_1px_rgba(82,0,148,0.06)]">

        <!-- Header -->
        <div class="relative px-7 pt-6 pb-5 border-b border-[#ede4f6]">
          <button
            type="button"
            @click="emit('close')"
            class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2eaf9] text-[#7d7484] transition hover:bg-[#e5d2f6] hover:text-[#520094] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/50"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="pr-10">
            <h3 id="guest-form-title" class="text-[1.375rem] font-bold tracking-tight text-[#1e1a22] leading-tight">
              {{ succeeded ? 'Request placed!' : 'Continue as guest' }}
            </h3>
            <p class="mt-1 text-sm text-[#4c4453] leading-snug">
              {{ succeeded ? 'Check your phone for a tracking link.' : 'Enter your phone number — no account needed.' }}
            </p>
          </div>
        </div>

        <!-- Success state -->
        <div v-if="succeeded" class="px-7 py-8 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg class="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-base font-semibold text-[#1e1a22]">Your request is on its way!</p>
          <p class="mt-2 text-sm text-[#4c4453]">
            We've sent an SMS to <strong>{{ phone }}</strong>
            {{ isNewCustomer ? 'with a link to track your order and set up your account.' : 'with your order confirmation.' }}
          </p>
          <button
            type="button"
            @click="emit('close')"
            class="mt-6 w-full rounded-2xl bg-[#520094] py-3 text-sm font-semibold text-white transition hover:bg-[#6b00c0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/50"
          >
            Done
          </button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="submit" class="px-7 py-6 space-y-5">
          <!-- Error -->
          <div v-if="errorMessage" class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {{ errorMessage }}
          </div>

          <!-- Phone -->
          <div>
            <label for="guest-phone" class="block text-sm font-semibold text-[#1e1a22] mb-1.5">
              Phone number <span class="text-red-500">*</span>
            </label>
            <input
              id="guest-phone"
              v-model="phone"
              type="tel"
              placeholder="e.g. 0244 123 456"
              autocomplete="tel"
              required
              :disabled="isLoading"
              class="w-full rounded-2xl border border-[#ddd4e8] bg-white px-4 py-3 text-sm text-[#1e1a22] placeholder-[#b0a8bc] transition focus:border-[#520094] focus:outline-none focus:ring-2 focus:ring-[#520094]/20 disabled:opacity-50"
            />
          </div>

          <!-- Address (optional) -->
          <div>
            <label for="guest-address" class="block text-sm font-semibold text-[#1e1a22] mb-1.5">
              Delivery address <span class="text-[#9c94a8] font-normal">(optional)</span>
            </label>
            <input
              id="guest-address"
              v-model="address"
              type="text"
              placeholder="e.g. 12 Main St, East Legon, Accra"
              autocomplete="street-address"
              :disabled="isLoading"
              class="w-full rounded-2xl border border-[#ddd4e8] bg-white px-4 py-3 text-sm text-[#1e1a22] placeholder-[#b0a8bc] transition focus:border-[#520094] focus:outline-none focus:ring-2 focus:ring-[#520094]/20 disabled:opacity-50"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading || !phone.trim()"
            class="w-full rounded-2xl bg-[#520094] py-3 text-sm font-semibold text-white transition hover:bg-[#6b00c0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Placing request…' : 'Place request' }}
          </button>

          <!-- Sign in link -->
          <p class="text-center text-sm text-[#4c4453]">
            Already have an account?
            <button type="button" @click="emit('show-login')" class="font-semibold text-[#520094] hover:underline focus:outline-none">
              Sign in
            </button>
          </p>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCartStore } from '~/stores/cart';
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService';
import { useApi } from '~/composables/useApi';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{
  close: [];
  'show-login': [];
  'guest-order-success': [payload: { requestNumber: string }];
}>();

const phone = ref('');
const address = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const succeeded = ref(false);
const isNewCustomer = ref(true);

// Reset form state whenever the modal opens
watch(() => props.isOpen, (open) => {
  if (open) {
    phone.value = '';
    address.value = '';
    errorMessage.value = '';
    succeeded.value = false;
    isNewCustomer.value = true;
    isLoading.value = false;
  }
});

const cartStore = useCartStore() as unknown as { items: Array<{ id: number | string; name: string; price: number; quantity: number }> };

const submit = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const api = useApi();
    const service = createOrderRequestsService(api);

    const items = cartStore.items.map((item) => ({
      product_id: item.id,
      product_name: String(item.name),
      quantity: item.quantity,
    }));

    const result = await service.submitAsGuest({
      phone: phone.value.trim(),
      items,
      customer_address: address.value.trim() || undefined,
    });

    if (!result.success) {
      errorMessage.value = result.message ?? 'Failed to place request. Please try again.';
      return;
    }

    isNewCustomer.value = result.data?.is_new_customer !== false;
    succeeded.value = true;
    emit('guest-order-success', { requestNumber: result.data.request_number });
  } catch (err: unknown) {
    const e = err as { message?: string };
    errorMessage.value = e?.message ?? 'Something went wrong. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>
