<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Create Customer</h1>
      <p class="text-sm text-gray-500 mt-1">Register a new customer account and optionally place their first order</p>
    </div>

    <!-- Section 1: Create customer -->
    <div class="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Customer details</h2>

      <form @submit.prevent="submitCreateCustomer" class="space-y-4 max-w-lg">
        <!-- Full name -->
        <div>
          <label for="c-name" class="block text-sm font-medium text-gray-700 mb-1">Full name <span class="text-red-500">*</span></label>
          <input
            id="c-name"
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. Jane Doe"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <!-- Phone -->
        <div>
          <label for="c-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone number <span class="text-red-500">*</span></label>
          <input
            id="c-phone"
            v-model="form.phone"
            type="tel"
            required
            placeholder="+233..."
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <p class="mt-1 text-xs text-gray-500">E.164 format recommended, e.g. +233201234567</p>
        </div>

        <!-- Address -->
        <div>
          <label for="c-address" class="block text-sm font-medium text-gray-700 mb-1">Delivery address <span class="text-gray-400 font-normal">(optional)</span></label>
          <input
            id="c-address"
            v-model="form.address"
            type="text"
            placeholder="e.g. 14 Ring Road, Accra"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <!-- Feedback -->
        <div v-if="createError" class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {{ createError }}
        </div>

        <button
          type="submit"
          :disabled="createLoading || customerCreated"
          class="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg v-if="createLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ createLoading ? 'Creating…' : 'Create customer' }}
        </button>
      </form>

      <!-- Success banner (shown once customer is created or 409 resolved) -->
      <div v-if="createSuccessMsg" class="mt-4 max-w-lg rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
        {{ createSuccessMsg }}
      </div>
    </div>

    <!-- Section 2: Place order (revealed after customer created or 409) -->
    <div v-if="pendingCustomer" class="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 class="text-base font-semibold text-gray-800 mb-1">Place first order</h2>

      <!-- Customer summary -->
      <div class="mb-4 flex items-center gap-3 text-sm text-gray-600">
        <span class="font-medium text-gray-900">{{ pendingCustomer.name }}</span>
        <span>&middot;</span>
        <a :href="`tel:${pendingCustomer.phone}`" class="hover:underline">{{ pendingCustomer.phone }}</a>
      </div>

      <form @submit.prevent="submitPlaceOrder" class="space-y-5 max-w-2xl">
        <!-- Items list -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Items <span class="text-red-500">*</span></label>
            <button
              type="button"
              @click="addItem"
              class="text-sm text-purple-700 hover:underline font-medium"
            >+ Add item</button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(item, idx) in orderItems"
              :key="idx"
              class="flex items-center gap-2"
            >
              <input
                v-model="item.name"
                type="text"
                required
                placeholder="Product name"
                class="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                required
                placeholder="Qty"
                class="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                v-model="item.unit"
                type="text"
                placeholder="Unit (opt.)"
                class="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                v-if="orderItems.length > 1"
                type="button"
                @click="removeItem(idx)"
                class="shrink-0 text-gray-400 hover:text-red-500 transition"
                title="Remove item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Delivery address (pre-filled) -->
        <div>
          <label for="o-address" class="block text-sm font-medium text-gray-700 mb-1">Delivery address</label>
          <input
            id="o-address"
            v-model="orderAddress"
            type="text"
            placeholder="Delivery address"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <!-- Notes -->
        <div>
          <label for="o-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            id="o-notes"
            v-model="orderNotes"
            rows="3"
            placeholder="Any special instructions"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>

        <!-- Order feedback -->
        <div v-if="orderError" class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {{ orderError }}
        </div>
        <div v-if="orderSuccessMsg" class="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {{ orderSuccessMsg }}
          <NuxtLink v-if="placedRequestNumber" to="/admin/orders-new" class="ml-2 font-semibold underline">View orders</NuxtLink>
        </div>

        <button
          v-if="!placedRequestNumber"
          type="submit"
          :disabled="orderLoading"
          class="inline-flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <svg v-if="orderLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ orderLoading ? 'Placing order…' : 'Place order' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createAdminService } from '~/services/admin/adminService'
import { ApiError } from '~/composables/useApi'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

const adminService = createAdminService(useApi())

// ── Section 1 state ──────────────────────────────────────────────────────────

const form = reactive({ name: '', phone: '', address: '' })
const createLoading = ref(false)
const createError = ref<string | null>(null)
const createSuccessMsg = ref<string | null>(null)
const customerCreated = ref(false)

// Populated once customer is confirmed (fresh create or 409 recovery)
const pendingCustomer = ref<{ id: number; name: string; phone: string } | null>(null)

// ── Section 2 state ──────────────────────────────────────────────────────────

interface OrderItem { name: string; quantity: number; unit: string }
const orderItems = ref<OrderItem[]>([{ name: '', quantity: 1, unit: '' }])
const orderAddress = ref('')
const orderNotes = ref('')
const orderLoading = ref(false)
const orderError = ref<string | null>(null)
const orderSuccessMsg = ref<string | null>(null)
const placedRequestNumber = ref<string | null>(null)

// ── Helpers ──────────────────────────────────────────────────────────────────

const addItem = () => orderItems.value.push({ name: '', quantity: 1, unit: '' })
const removeItem = (idx: number) => orderItems.value.splice(idx, 1)

// ── Submit: create customer ──────────────────────────────────────────────────

const submitCreateCustomer = async () => {
  createError.value = null
  createLoading.value = true
  try {
    const res = await adminService.createCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || undefined,
    })

    if (res.success) {
      const customer = res.data
      pendingCustomer.value = { id: customer.id, name: customer.name, phone: customer.phone }
      createSuccessMsg.value = `Customer created. Confirmation SMS sent to ${customer.phone}.`
      customerCreated.value = true
      orderAddress.value = form.address.trim()
    } else {
      createError.value = res.message ?? 'Failed to create customer.'
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      // Server returns customer_id in the body alongside the error
      const body = err as unknown as { customer_id?: number }
      const conflictId = body.customer_id ?? null
      const idStr = conflictId ? ` (ID: ${conflictId})` : ''
      createError.value = `A customer with this phone already exists${idStr}. You can still place an order for them.`

      if (conflictId) {
        pendingCustomer.value = { id: conflictId, name: form.name.trim(), phone: form.phone.trim() }
        orderAddress.value = form.address.trim()
        customerCreated.value = true
      }
    } else {
      createError.value = err instanceof Error ? err.message : 'An unexpected error occurred.'
    }
  } finally {
    createLoading.value = false
  }
}

// ── Submit: place order ──────────────────────────────────────────────────────

const submitPlaceOrder = async () => {
  if (!pendingCustomer.value) return
  orderError.value = null
  orderLoading.value = true
  try {
    const res = await adminService.placeOrderOnBehalf({
      customer_id: pendingCustomer.value.id,
      items: orderItems.value.map(i => ({
        name: i.name.trim(),
        quantity: i.quantity,
        unit: i.unit.trim() || undefined,
      })),
      address: orderAddress.value.trim() || undefined,
      notes: orderNotes.value.trim() || undefined,
    })

    if (res.success) {
      const reqNum = res.data?.request_number ?? ''
      placedRequestNumber.value = reqNum
      orderSuccessMsg.value = `Order ${reqNum} placed. The customer will receive a confirmation SMS.`
    } else {
      orderError.value = res.message ?? 'Failed to place order.'
    }
  } catch (err) {
    orderError.value = err instanceof Error ? err.message : 'An unexpected error occurred.'
  } finally {
    orderLoading.value = false
  }
}
</script>
