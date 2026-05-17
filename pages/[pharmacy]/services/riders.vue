<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Fleet</h1>
        <p class="text-sm text-gray-500 mt-1">Riders who deliver on behalf of your pharmacy</p>
      </div>
      <button
        @click="showForm = !showForm"
        class="px-4 py-2 text-sm font-medium cs-btn text-white rounded-md transition"
      >
        + Add Rider
      </button>
    </div>

    <!-- Add Rider Form -->
    <div v-if="showForm" class="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
      <h2 class="text-base font-semibold text-gray-800">New Rider</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
          <input v-model="form.name" type="text" placeholder="Kofi Mensah"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cs-input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
          <input v-model="form.phone" type="tel" placeholder="0244..."
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cs-input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Username *</label>
          <input v-model="form.username" type="text" placeholder="kofi.mensah"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cs-input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Password *</label>
          <input v-model="form.password" type="password" placeholder="••••••••"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cs-input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
          <select v-model="form.vehicle_type"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cs-input"
          >
            <option value="">None / On foot</option>
            <option value="bicycle">Bicycle</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Vehicle Registration</label>
          <input v-model="form.vehicle_registration" type="text" placeholder="GR-1234-23"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cs-input" />
        </div>
      </div>
      <div v-if="formError" class="text-sm text-red-600">{{ formError }}</div>
      <div class="flex gap-3">
        <button
          @click="addRider"
          :disabled="saving"
          class="px-5 py-2 text-sm font-medium cs-btn text-white rounded-md transition disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : 'Add Rider' }}
        </button>
        <button @click="showForm = false" class="px-5 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-gray-400">Loading fleet...</div>

    <!-- Empty -->
    <div v-else-if="riders.length === 0 && !showForm" class="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
      No riders yet. Add your first rider to get started.
    </div>

    <!-- Rider List -->
    <div v-else-if="riders.length > 0" class="space-y-3">
      <div
        v-for="r in riders" :key="r.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between gap-4"
      >
        <div>
          <div class="font-medium text-gray-900">{{ r.name }}</div>
          <div class="text-sm text-gray-500 mt-0.5">{{ r.phone }}</div>
          <div class="text-xs text-gray-400 mt-0.5">
            @{{ r.username }}
            <span v-if="r.vehicle_type"> · {{ r.vehicle_type }}</span>
            <span v-if="r.vehicle_registration"> {{ r.vehicle_registration }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span
            class="text-xs font-medium px-2 py-1 rounded-full"
            :class="r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
          >
            {{ r.is_active ? 'Active' : 'Inactive' }}
          </span>
          <button
            v-if="r.is_active"
            @click="deactivateRider(r.id)"
            class="text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useCompanyStore } from '~/stores/company'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
})

interface Rider {
  id: number | string
  name: string
  phone: string
  username: string
  vehicle_type?: string | null
  vehicle_registration?: string | null
  is_active: boolean
}

interface RidersResponse {
  success?: boolean
  message?: string | null
  riders?: Rider[] | null
}

// TODO: remove once stores/ are .ts
const companyStore = useCompanyStore() as unknown as {
  makeAuthRequest: (url: string, options?: RequestInit) => Promise<RidersResponse>
}

const loading = ref<boolean>(true)
const riders = ref<Rider[]>([])
const showForm = ref<boolean>(false)
const saving = ref<boolean>(false)
const formError = ref<string>('')

const form = reactive({
  name: '',
  phone: '',
  username: '',
  password: '',
  vehicle_type: '',
  vehicle_registration: '',
})

const fetchRiders = async (): Promise<void> => {
  loading.value = true
  try {
    const res = await companyStore.makeAuthRequest('/api/pharmacy/riders')
    if (res.success) riders.value = res.riders ?? []
  } catch (e) {
    console.error('Failed to fetch riders', e)
  } finally {
    loading.value = false
  }
}

const addRider = async (): Promise<void> => {
  formError.value = ''
  if (!form.name || !form.phone || !form.username || !form.password) {
    formError.value = 'Name, phone, username, and password are required.'
    return
  }
  saving.value = true
  try {
    const res = await companyStore.makeAuthRequest('/api/pharmacy/riders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    })
    if (res.success) {
      showForm.value = false
      Object.assign(form, { name: '', phone: '', username: '', password: '', vehicle_type: '', vehicle_registration: '' })
      await fetchRiders()
    } else {
      formError.value = res.message ?? 'Failed to add rider'
    }
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Error'
  } finally {
    saving.value = false
  }
}

const deactivateRider = async (id: number | string): Promise<void> => {
  try {
    await companyStore.makeAuthRequest(`/api/pharmacy/riders/${String(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    await fetchRiders()
  } catch (e) {
    console.error('Failed to deactivate rider', e)
  }
}

onMounted(() => { void fetchRiders() })
</script>
