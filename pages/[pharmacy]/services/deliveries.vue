<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p class="text-sm text-gray-500 mt-1">Pending deliveries waiting on your action</p>
      </div>
      <button @click="fetchDeliveries" class="text-sm text-blue-600 hover:underline">Refresh</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-400">Loading deliveries...</div>

    <!-- Empty -->
    <div v-else-if="deliveries.length === 0" class="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
      No pending deliveries.
    </div>

    <!-- List -->
    <div v-else class="space-y-4">
      <div
        v-for="d in deliveries" :key="d.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4 mb-3">
          <div>
            <div class="font-medium text-gray-900">Delivery #{{ d.id }}</div>
            <div class="text-sm text-gray-500 mt-0.5">To: {{ d.delivery_address }}</div>
            <div v-if="d.request_number" class="text-xs text-gray-400 mt-0.5">Ref: {{ d.request_number }}</div>
          </div>
          <span class="text-xs font-medium px-2 py-1 rounded-full shrink-0" :class="statusClass(d.delivery_status)">
            {{ d.delivery_status?.replace(/_/g, ' ') }}
          </span>
        </div>

        <!-- Rider proposed -->
        <div v-if="d.delivery_status === 'rider_proposed' && d.driver_id" class="mb-3 p-3 bg-blue-50 rounded-lg">
          <div class="text-sm font-medium text-blue-800 mb-1">Rider Proposed</div>
          <div class="text-sm text-blue-700">{{ d.driver_name }} — {{ d.driver_phone }}</div>
          <div v-if="d.driver_vehicle" class="text-xs text-blue-600 mt-0.5">{{ d.driver_vehicle }}</div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2">
          <!-- Pharmacy claim window: self-deliver or release -->
          <template v-if="d.delivery_status === 'open'">
            <button
              @click="selfDeliver(d.id)"
              :disabled="acting === d.id"
              class="flex-1 py-2 px-4 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-md transition disabled:opacity-50"
            >
              {{ acting === d.id ? '...' : 'Deliver Ourselves' }}
            </button>
            <button
              @click="release(d.id)"
              :disabled="acting === d.id"
              class="flex-1 py-2 px-4 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-md transition disabled:opacity-50"
            >
              Release to Dispatch
            </button>
          </template>

          <!-- Rider proposed: confirm or reject -->
          <template v-else-if="d.delivery_status === 'rider_proposed'">
            <button
              @click="confirmRider(d.id)"
              :disabled="acting === d.id"
              class="flex-1 py-2 px-4 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition disabled:opacity-50"
            >
              {{ acting === d.id ? '...' : 'Confirm Rider' }}
            </button>
            <button
              @click="rejectRider(d.id)"
              :disabled="acting === d.id"
              class="flex-1 py-2 px-4 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md transition disabled:opacity-50"
            >
              Reject Rider
            </button>
          </template>

          <!-- In progress: read-only status -->
          <template v-else>
            <div class="text-sm text-gray-400">Delivery is in progress</div>
          </template>
        </div>

        <div v-if="errors[d.id]" class="mt-2 text-xs text-red-600">{{ errors[d.id] }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company'
})

const companyStore = useCompanyStore()

const loading = ref(true)
const deliveries = ref([])
const acting = ref(null)
const errors = ref({})

const statusClass = (status) => {
  const map = {
    open: 'bg-orange-100 text-orange-700',
    rider_proposed: 'bg-blue-100 text-blue-700',
    assigned: 'bg-purple-100 text-purple-700',
    picking_up: 'bg-yellow-100 text-yellow-700',
    picked_up: 'bg-indigo-100 text-indigo-700',
    in_transit: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const fetchDeliveries = async () => {
  loading.value = true
  try {
    const res = await companyStore.makeAuthRequest('/api/pharmacy/deliveries/pending')
    if (res.success) deliveries.value = res.deliveries || []
  } catch (e) {
    console.error('Failed to fetch deliveries', e)
  } finally {
    loading.value = false
  }
}

const doAction = async (id, path) => {
  acting.value = id
  errors.value[id] = null
  try {
    const res = await companyStore.makeAuthRequest(`/api/pharmacy/deliveries/${id}/${path}`, { method: 'POST' })
    if (res.success) {
      await fetchDeliveries()
    } else {
      errors.value[id] = res.message || 'Action failed'
    }
  } catch (e) {
    errors.value[id] = e.message || 'Error'
  } finally {
    acting.value = null
  }
}

const selfDeliver = (id) => doAction(id, 'self-deliver')
const release = (id) => doAction(id, 'release')
const confirmRider = (id) => doAction(id, 'confirm-rider')
const rejectRider = (id) => doAction(id, 'reject-rider')

onMounted(fetchDeliveries)
</script>
