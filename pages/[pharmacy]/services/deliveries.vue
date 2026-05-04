<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p class="text-sm text-gray-500 mt-1">Manage deliveries for your pharmacy</p>
      </div>
      <button @click="fetchAll" class="text-sm cs-text hover:underline">Refresh</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-400">Loading deliveries...</div>

    <template v-else>
      <!-- ── Section 1: Rider proposed (external dispatch) ── -->
      <div v-if="proposed.length > 0">
        <h2 class="text-base font-semibold text-gray-700 mb-3">Rider Proposed</h2>
        <div class="space-y-3">
          <div
            v-for="d in proposed" :key="'pr-' + d.id"
            class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <div class="font-medium text-gray-900">Delivery #{{ d.id }}</div>
                <div class="text-sm text-gray-500 mt-0.5">To: {{ d.delivery_address }}</div>
                <div v-if="d.request_number" class="text-xs text-gray-400 mt-0.5">Ref: {{ d.request_number }}</div>
              </div>
              <span class="text-xs font-medium px-2 py-1 rounded-full shrink-0 cs-badge">
                rider proposed
              </span>
            </div>
            <div v-if="d.driver_id" class="mb-3 p-3 bg-purple-50 rounded-lg">
              <div class="text-sm font-medium cs-text mb-1">Proposed Rider</div>
              <div class="text-sm cs-text">{{ d.driver_name }} — {{ d.driver_phone }}</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                @click="confirmRider(d.id)"
                :disabled="acting === d.id"
                class="flex-1 py-2 px-4 text-sm font-medium cs-btn text-white rounded-md transition disabled:opacity-50"
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
            </div>
            <div v-if="errors[d.id]" class="mt-2 text-xs text-red-600">{{ errors[d.id] }}</div>
          </div>
        </div>
      </div>

      <!-- ── Section 3: Self-claimed — needs rider ── -->
      <div v-if="claimed.length > 0">
        <h2 class="text-base font-semibold text-gray-700 mb-3">Your Deliveries — Assign Rider</h2>
        <div class="space-y-3">
          <div
            v-for="d in claimed" :key="'c-' + d.id"
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

            <!-- Rider assigned -->
            <div v-if="d.driver_id" class="mb-3 p-3 bg-green-50 rounded-lg">
              <div class="text-sm font-medium text-green-800 mb-1">Rider Assigned</div>
              <div class="text-sm text-green-700">{{ d.driver_name }} — {{ d.driver_phone }}</div>
            </div>

            <!-- No rider yet — show selector -->
            <div v-else-if="d.delivery_status === 'assigned'">
              <div v-if="riders.length === 0" class="text-sm text-gray-500 mb-2">
                No riders in your fleet.
                <NuxtLink :to="`/${pharmacy}/services/riders`" class="cs-text hover:underline">Add a rider →</NuxtLink>
              </div>
              <div v-else class="flex gap-2">
                <select
                  v-model="riderSelections[d.id]"
                  class="flex-1 border border-gray-300 rounded-md text-sm px-3 py-2 cs-input"
                >
                  <option value="">Select a rider...</option>
                  <option v-for="r in riders" :key="r.id" :value="r.id">
                    {{ r.name }} — {{ r.phone }}
                  </option>
                </select>
                <button
                  @click="assignRider(d.id)"
                  :disabled="acting === d.id || !riderSelections[d.id]"
                  class="px-4 py-2 text-sm font-medium cs-btn text-white rounded-md transition disabled:opacity-50"
                >
                  {{ acting === d.id ? '...' : 'Assign' }}
                </button>
              </div>
            </div>

            <!-- In progress -->
            <div v-else class="text-sm text-gray-400">Delivery is in progress</div>

            <div v-if="errors[d.id]" class="mt-2 text-xs text-red-600">{{ errors[d.id] }}</div>
          </div>
        </div>
      </div>

      <!-- ── Empty state ── -->
      <div
        v-if="proposed.length === 0 && claimed.length === 0"
        class="py-12 text-center text-gray-500 bg-gray-50 rounded-lg"
      >
        No pending deliveries.
      </div>
    </template>
  </div>
</template>

<script setup>
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company'
})

const route = useRoute()
const pharmacy = computed(() => route.params.pharmacy)
const companyStore = useCompanyStore()

const loading = ref(true)
const proposedDeliveries = ref([])
const claimedDeliveries = ref([])
const riders = ref([])
const acting = ref(null)
const errors = ref({})
const riderSelections = ref({})

const proposed = computed(() => proposedDeliveries.value)
const claimed = computed(() => claimedDeliveries.value)

const statusClass = (status) => {
  const map = {
    open: 'bg-orange-100 text-orange-700',
    rider_proposed: 'cs-badge',
    assigned: 'bg-purple-100 text-purple-700',
    picking_up: 'bg-yellow-100 text-yellow-700',
    picked_up: 'bg-indigo-100 text-indigo-700',
    in_transit: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const fetchAll = async () => {
  loading.value = true
  try {
    const [proposedRes, claimedRes, ridersRes] = await Promise.all([
      companyStore.makeAuthRequest('/api/pharmacy/deliveries/pending'),
      companyStore.makeAuthRequest('/api/pharmacy/deliveries/assigned'),
      companyStore.makeAuthRequest('/api/pharmacy/riders'),
    ])
    // pending endpoint returns open + rider_proposed; filter to rider_proposed only
    if (proposedRes.success) {
      proposedDeliveries.value = (proposedRes.deliveries || []).filter(d => d.delivery_status === 'rider_proposed')
    }
    if (claimedRes.success) claimedDeliveries.value = claimedRes.deliveries || []
    if (ridersRes.success) riders.value = ridersRes.riders || []
  } catch (e) {
    console.error('Failed to fetch deliveries', e)
  } finally {
    loading.value = false
  }
}

const doAction = async (id, path, body = {}) => {
  acting.value = id
  errors.value[id] = null
  try {
    const hasBody = Object.keys(body).length > 0
    const res = await companyStore.makeAuthRequest(`/api/pharmacy/deliveries/${id}/${path}`, {
      method: 'POST',
      headers: hasBody ? { 'Content-Type': 'application/json' } : {},
      body: hasBody ? JSON.stringify(body) : undefined
    })
    if (res.success) {
      await fetchAll()
    } else {
      errors.value[id] = res.message || 'Action failed'
    }
  } catch (e) {
    errors.value[id] = e.message || 'Error'
  } finally {
    acting.value = null
  }
}

const confirmRider = (id) => doAction(id, 'confirm-rider')
const rejectRider = (id) => doAction(id, 'reject-rider')
const assignRider = (id) => doAction(id, 'assign-rider', { rider_id: riderSelections.value[id] })

onMounted(fetchAll)
</script>
