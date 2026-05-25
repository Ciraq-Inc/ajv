<template>
  <div class="dispatch-companies-page" style="padding: 1.5rem;">
    <!-- Header -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;">
      <div>
        <h1 class="page-title" style="font-size: 1.5rem; font-weight: 600; color: #111827; letter-spacing: -0.025em; margin: 0;">Dispatch Companies</h1>
        <p class="page-subtitle" style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Manage dispatch companies and their administrative users</p>
      </div>
      <div class="header-actions" style="display: flex; gap: 0.5rem;">
        <button @click="showCreateModal = true" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: none; border-radius: 6px; background: #2563eb; font-size: 0.8rem; font-weight: 500; color: #fff; cursor: pointer;">
          <span>+ Add Company</span>
        </button>
        <button @click="fetchCompanies" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.8rem; font-weight: 500; color: #374151; cursor: pointer;">
          <span v-if="loading">...</span>
          <span v-else>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Error/States -->
    <div v-if="error" class="error-banner" style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 1rem; color: #b91c1c; border-radius: 4px; margin-bottom: 1rem;">
      <p style="margin: 0; font-size: 0.875rem;">{{ error }}</p>
    </div>

    <!-- Companies List -->
    <div class="companies-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
      <div v-for="company in companies" :key="company.id" class="company-card" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; background: #fff; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <div style="flex: 1; min-width: 0;">
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #111827;">{{ company.name }}</h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #6b7280; display: flex; align-items: center; gap: 0.25rem;">
              <span>📍</span> {{ company.address || company.operating_area || 'No address' }}
            </p>
          </div>
          <span style="background: #ecfdf5; color: #047857; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 9999px; font-weight: 500; flex-shrink: 0; margin-left: 0.5rem;">
             Active
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 1rem; margin-top: 0.5rem; gap: 0.5rem;">
          <div style="font-size: 0.85rem; color: #4b5563;">
            <div>Admins: <strong>{{ company.admin_count || 0 }}</strong></div>
            <div>Riders: <strong>{{ company.rider_count || 0 }}</strong></div>
          </div>
          <div style="display: flex; gap: 0.35rem; flex-shrink: 0;">
            <button @click="manageAdmins(company)" style="background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 0.3rem 0.6rem; font-size: 0.8rem; cursor: pointer; color: #374151;">
              Admins
            </button>
            <button @click="openEditCompany(company)" style="background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 0.3rem 0.6rem; font-size: 0.8rem; cursor: pointer; color: #374151;">
              Edit
            </button>
            <button @click="deleteCompany(company)" style="background: none; border: 1px solid #fca5a5; border-radius: 4px; padding: 0.3rem 0.6rem; font-size: 0.8rem; cursor: pointer; color: #dc2626;">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="companies.length === 0 && !loading" style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px;">
        No dispatch companies found.
      </div>
    </div>

    <!-- Create Company Modal -->
    <div v-if="showCreateModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50;">
      <div class="modal-content" style="background: #fff; border-radius: 8px; width: 100%; max-width: 500px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;">
        <h2 style="margin: 0 0 1.5rem 0; font-size: 1.25rem;">Create Dispatch Company</h2>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Company Name *</label>
            <input v-model="newCompany.name" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="e.g. Swift Riders">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Phone *</label>
            <input v-model="newCompany.phone" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="e.g. 0241234567">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Location (Area)</label>
            <input v-model="newCompany.location" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="e.g. East Legon">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Address Line 1</label>
            <input v-model="newCompany.address1" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="e.g. 15 Mensah Wood St">
          </div>

          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Latitude (optional)</label>
              <input v-model="newCompany.latitude" type="number" step="0.000001" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="5.6037">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Longitude (optional)</label>
              <input v-model="newCompany.longitude" type="number" step="0.000001" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="-0.1870">
            </div>
          </div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #f3f4f6; padding-top: 1rem;">
          <button @click="showCreateModal = false" style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Cancel</button>
          <button @click="createCompany" :disabled="saving" style="padding: 0.5rem 1rem; border: none; border-radius: 4px; background: #2563eb; color: #fff; cursor: pointer; font-size: 0.9rem;">
            {{ saving ? 'Saving...' : 'Create Company' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Company Modal -->
    <div v-if="showEditModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50;">
      <div class="modal-content" style="background: #fff; border-radius: 8px; width: 100%; max-width: 500px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.25rem;">Edit Dispatch Company</h2>
          <button @click="showEditModal = false" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Company Name *</label>
            <input v-model="editCompanyForm.name" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Phone *</label>
            <input v-model="editCompanyForm.phone" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Contact Person</label>
            <input v-model="editCompanyForm.contact_person" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="e.g. Kofi Mensah">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Email</label>
            <input v-model="editCompanyForm.email" type="email" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Location (Area)</label>
            <input v-model="editCompanyForm.operating_area" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Address</label>
            <input v-model="editCompanyForm.address" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
          </div>

          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Latitude</label>
              <input v-model="editCompanyForm.latitude" type="number" step="0.000001" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Longitude</label>
              <input v-model="editCompanyForm.longitude" type="number" step="0.000001" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;">
            </div>
          </div>

          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Commission Rate</label>
              <input v-model="editCompanyForm.commission_rate" type="number" step="0.01" min="0" max="1" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;" placeholder="0.10">
            </div>
            <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem; padding-top: 1.5rem;">
              <input v-model="editCompanyForm.is_trusted" type="checkbox" id="edit-is-trusted" style="width: 16px; height: 16px; cursor: pointer;">
              <label for="edit-is-trusted" style="font-size: 0.85rem; font-weight: 500; cursor: pointer;">Trusted Company</label>
            </div>
          </div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #f3f4f6; padding-top: 1rem;">
          <button @click="showEditModal = false" style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Cancel</button>
          <button @click="saveEditCompany" :disabled="savingEdit" style="padding: 0.5rem 1rem; border: none; border-radius: 4px; background: #2563eb; color: #fff; cursor: pointer; font-size: 0.9rem;">
            {{ savingEdit ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Manage Admins Modal -->
    <div v-if="selectedCompany" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50;">
      <div class="modal-content" style="background: #fff; border-radius: 8px; width: 100%; max-width: 520px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.25rem;">Admins for {{ selectedCompany.name }}</h2>
          <button @click="closeAdminsModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
        </div>

        <div style="max-height: 280px; overflow-y: auto; margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 4px;">
          <div v-if="selectedCompanyAdmins.length === 0" style="padding: 1rem; text-align: center; color: #6b7280; font-size: 0.85rem;">
            No admins found for this company.
          </div>

          <div v-for="admin in selectedCompanyAdmins" :key="admin.id">
            <!-- Admin row (view mode) -->
            <div v-if="editingAdminId !== admin.id" style="padding: 0.65rem 0.75rem; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.9rem; font-weight: 500; color: #111827;">{{ admin.name || admin.username }}</div>
                <div style="font-size: 0.8rem; color: #6b7280;">{{ admin.phone || 'No phone' }} · {{ admin.username }}</div>
                <div v-if="!admin.is_active" style="font-size: 0.75rem; color: #dc2626; font-weight: 500;">Deactivated</div>
              </div>
              <div style="display: flex; gap: 0.35rem; flex-shrink: 0;">
                <button @click="openEditAdmin(admin)" style="background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer; color: #374151;">Edit</button>
                <button @click="removeAdmin(admin)" style="background: none; border: 1px solid #fca5a5; border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer; color: #dc2626;">Remove</button>
              </div>
            </div>

            <!-- Admin row (edit mode) -->
            <div v-else style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; background: #f0f9ff;">
              <div style="font-size: 0.8rem; font-weight: 600; color: #0369a1; margin-bottom: 0.5rem;">Editing: {{ admin.username }}</div>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <input v-model="editAdminForm.name" type="text" placeholder="Full name" style="flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #bae6fd; border-radius: 4px; font-size: 0.82rem; min-width: 0;">
                <input v-model="editAdminForm.phone" type="text" placeholder="Phone" style="flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #bae6fd; border-radius: 4px; font-size: 0.82rem; min-width: 0;">
              </div>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <input v-model="editAdminForm.email" type="email" placeholder="Email (optional)" style="flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #bae6fd; border-radius: 4px; font-size: 0.82rem; min-width: 0;">
                <input v-model="editAdminForm.password" type="password" placeholder="New password (optional)" style="flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #bae6fd; border-radius: 4px; font-size: 0.82rem; min-width: 0;">
              </div>
              <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                <button @click="editingAdminId = null" style="padding: 0.3rem 0.6rem; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; font-size: 0.8rem; cursor: pointer;">Cancel</button>
                <button @click="saveEditAdmin(admin)" :disabled="savingEditAdmin" style="padding: 0.3rem 0.6rem; border: none; border-radius: 4px; background: #0284c7; color: #fff; font-size: 0.8rem; cursor: pointer;">
                  {{ savingEditAdmin ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 1rem; border-radius: 4px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Add New Admin</h4>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input v-model="newAdmin.name" type="text" placeholder="Full name" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; min-width: 0;">
            <input v-model="newAdmin.phone" type="text" placeholder="Phone" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; min-width: 0;">
          </div>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input v-model="newAdmin.username" type="text" placeholder="Username" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; min-width: 0;">
            <input v-model="newAdmin.password" type="password" placeholder="Password" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem; min-width: 0;">
          </div>
          <button @click="createAdmin" :disabled="savingAdmin" style="width: 100%; margin-top: 0.25rem; padding: 0.4rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
            {{ savingAdmin ? 'Adding...' : 'Add Admin User' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface CompanyRow {
  id: number
  name: string
  phone: string
  email?: string | null
  contact_person?: string | null
  address?: string | null
  operating_area?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  commission_rate?: number | string | null
  is_trusted?: boolean | number | null
  admin_count?: number | null
  rider_count?: number | null
}

interface AdminRow {
  id: number
  name?: string | null
  username: string
  phone?: string | null
  email?: string | null
  is_active?: boolean | number | null
}

interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
}

interface CompanyDetailData {
  admins?: AdminRow[]
}

interface NewCompanyForm {
  name: string
  phone: string
  address1: string
  location: string
  latitude: string
  longitude: string
}

interface EditCompanyForm {
  name: string
  phone: string
  email: string
  contact_person: string
  address: string
  operating_area: string
  latitude: string
  longitude: string
  commission_rate: string
  is_trusted: boolean
}

interface NewAdminForm {
  name: string
  phone: string
  username: string
  password: string
}

interface EditAdminForm {
  name: string
  phone: string
  email: string
  password: string
}

// TODO: remove once composables/ are .ts
const api = useApi() as unknown as {
  get: (url: string, opts?: Record<string, unknown>) => Promise<ApiResponse<unknown>>
  post: (url: string, body?: unknown) => Promise<ApiResponse<unknown>>
  put: (url: string, body?: unknown) => Promise<ApiResponse<unknown>>
  delete: (url: string) => Promise<ApiResponse<unknown>>
}

definePageMeta({
  layout: 'admin-layout',
  middleware: 'admin-auth',
})

const companies = ref<CompanyRow[]>([])
const loading = ref<boolean>(false)
const error = ref<string>('')

// Create Company
const showCreateModal = ref<boolean>(false)
const saving = ref<boolean>(false)
const newCompany = ref<NewCompanyForm>({ name: '', phone: '', address1: '', location: '', latitude: '', longitude: '' })

// Edit Company
const showEditModal = ref<boolean>(false)
const savingEdit = ref<boolean>(false)
const editCompanyId = ref<number | null>(null)
const editCompanyForm = ref<EditCompanyForm>({
  name: '', phone: '', email: '', contact_person: '',
  address: '', operating_area: '', latitude: '', longitude: '',
  commission_rate: '', is_trusted: false,
})

// Manage Admins
const selectedCompany = ref<CompanyRow | null>(null)
const selectedCompanyAdmins = ref<AdminRow[]>([])
const savingAdmin = ref<boolean>(false)
const newAdmin = ref<NewAdminForm>({ name: '', phone: '', username: '', password: '' })

// Edit Admin
const editingAdminId = ref<number | null>(null)
const savingEditAdmin = ref<boolean>(false)
const editAdminForm = ref<EditAdminForm>({ name: '', phone: '', email: '', password: '' })


const fetchCompanies = async (): Promise<void> => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/deliveries/dispatch-companies') as ApiResponse<CompanyRow[]>
    if (response.success) {
      companies.value = response.data ?? []
    } else {
      error.value = response.message ?? 'Failed to fetch companies'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const createCompany = async (): Promise<void> => {
  if (!newCompany.value.name || !newCompany.value.phone) {
    alert('Company name and phone are required')
    return
  }

  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      name: newCompany.value.name,
      phone: newCompany.value.phone,
      address: newCompany.value.address1,
      operating_area: newCompany.value.location,
    }
    if (newCompany.value.latitude) payload['latitude'] = parseFloat(newCompany.value.latitude)
    if (newCompany.value.longitude) payload['longitude'] = parseFloat(newCompany.value.longitude)

    const response = await api.post('/api/deliveries/dispatch-companies', payload)
    if (response.success) {
      showCreateModal.value = false
      newCompany.value = { name: '', phone: '', address1: '', location: '', latitude: '', longitude: '' }
      await fetchCompanies()
    } else {
      alert(response.message ?? 'Failed to create')
    }
  } catch (e) {
    console.error(e)
    alert(e instanceof Error ? e.message : 'Error creating company')
  } finally {
    saving.value = false
  }
}

const openEditCompany = (company: CompanyRow): void => {
  editCompanyId.value = company.id
  editCompanyForm.value = {
    name: company.name ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    contact_person: company.contact_person ?? '',
    address: company.address ?? '',
    operating_area: company.operating_area ?? '',
    latitude: company.latitude !== null && company.latitude !== undefined ? String(company.latitude) : '',
    longitude: company.longitude !== null && company.longitude !== undefined ? String(company.longitude) : '',
    commission_rate: company.commission_rate !== null && company.commission_rate !== undefined ? String(company.commission_rate) : '',
    is_trusted: !!company.is_trusted,
  }
  showEditModal.value = true
}

const saveEditCompany = async (): Promise<void> => {
  if (!editCompanyForm.value.name || !editCompanyForm.value.phone) {
    alert('Name and phone are required')
    return
  }

  savingEdit.value = true
  try {
    const payload: Record<string, unknown> = {
      name: editCompanyForm.value.name,
      phone: editCompanyForm.value.phone,
      email: editCompanyForm.value.email,
      contact_person: editCompanyForm.value.contact_person,
      address: editCompanyForm.value.address,
      operating_area: editCompanyForm.value.operating_area,
      is_trusted: editCompanyForm.value.is_trusted,
    }
    if (editCompanyForm.value.latitude !== '') payload['latitude'] = parseFloat(editCompanyForm.value.latitude)
    if (editCompanyForm.value.longitude !== '') payload['longitude'] = parseFloat(editCompanyForm.value.longitude)
    if (editCompanyForm.value.commission_rate !== '') payload['commission_rate'] = parseFloat(editCompanyForm.value.commission_rate)

    const response = await api.put(`/api/deliveries/dispatch-companies/${editCompanyId.value}`, payload)
    if (response.success) {
      showEditModal.value = false
      await fetchCompanies()
    } else {
      alert(response.message ?? 'Failed to save')
    }
  } catch (e) {
    console.error(e)
    alert(e instanceof Error ? e.message : 'Error saving company')
  } finally {
    savingEdit.value = false
  }
}

const deleteCompany = async (company: CompanyRow): Promise<void> => {
  if (!confirm(`Deactivate "${company.name}"? This will hide it from the active list.`)) return

  try {
    const response = await api.delete(`/api/deliveries/dispatch-companies/${company.id}`)
    if (response.success) {
      await fetchCompanies()
    } else {
      alert(response.message ?? 'Failed to delete')
    }
  } catch (e) {
    console.error(e)
    alert(e instanceof Error ? e.message : 'Error deleting company')
  }
}

const manageAdmins = async (company: CompanyRow): Promise<void> => {
  selectedCompany.value = company
  selectedCompanyAdmins.value = []
  editingAdminId.value = null
  newAdmin.value = { name: '', phone: '', username: '', password: '' }

  try {
    const response = await api.get(`/api/deliveries/dispatch-companies/${company.id}`) as ApiResponse<CompanyDetailData>
    if (response.success && response.data) {
      selectedCompanyAdmins.value = response.data.admins ?? []
    }
  } catch (e) {
    console.error('Error fetching admins', e)
  }
}

const closeAdminsModal = (): void => {
  selectedCompany.value = null
  editingAdminId.value = null
}

const createAdmin = async (): Promise<void> => {
  if (!newAdmin.value.name || !newAdmin.value.phone || !newAdmin.value.username || !newAdmin.value.password) {
    alert('Name, phone, username and password are required')
    return
  }

  savingAdmin.value = true
  try {
    const company = selectedCompany.value
    if (!company) return

    const response = await api.post(`/api/deliveries/dispatch-companies/${company.id}/admins`, {
      name: newAdmin.value.name,
      phone: newAdmin.value.phone,
      username: newAdmin.value.username,
      password: newAdmin.value.password,
    })

    if (response.success) {
      newAdmin.value = { name: '', phone: '', username: '', password: '' }
      await manageAdmins(company)
      void fetchCompanies()
    } else {
      alert(response.message ?? 'Failed to add admin')
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : 'An error occurred')
  } finally {
    savingAdmin.value = false
  }
}

const openEditAdmin = (admin: AdminRow): void => {
  editingAdminId.value = admin.id
  editAdminForm.value = {
    name: admin.name ?? '',
    phone: admin.phone ?? '',
    email: admin.email ?? '',
    password: '',
  }
}

const saveEditAdmin = async (admin: AdminRow): Promise<void> => {
  if (!editAdminForm.value.name || !editAdminForm.value.phone) {
    alert('Name and phone are required')
    return
  }

  savingEditAdmin.value = true
  try {
    const company = selectedCompany.value
    if (!company) return

    const payload: Record<string, unknown> = {
      name: editAdminForm.value.name,
      phone: editAdminForm.value.phone,
    }
    if (editAdminForm.value.email) payload['email'] = editAdminForm.value.email
    if (editAdminForm.value.password) payload['password'] = editAdminForm.value.password

    const response = await api.put(
      `/api/deliveries/dispatch-companies/${company.id}/admins/${admin.id}`,
      payload,
    )
    if (response.success) {
      editingAdminId.value = null
      await manageAdmins(company)
    } else {
      alert(response.message ?? 'Failed to save admin')
    }
  } catch (e) {
    console.error(e)
    alert(e instanceof Error ? e.message : 'Error updating admin')
  } finally {
    savingEditAdmin.value = false
  }
}

const removeAdmin = async (admin: AdminRow): Promise<void> => {
  if (!confirm(`Remove admin "${admin.name ?? admin.username}"? They will no longer be able to log in.`)) return

  try {
    const company = selectedCompany.value
    if (!company) return

    const response = await api.delete(
      `/api/deliveries/dispatch-companies/${company.id}/admins/${admin.id}`,
    )
    if (response.success) {
      await manageAdmins(company)
      void fetchCompanies()
    } else {
      alert(response.message ?? 'Failed to remove admin')
    }
  } catch (e) {
    console.error(e)
    alert(e instanceof Error ? e.message : 'Error removing admin')
  }
}

onMounted(() => {
  void fetchCompanies()
})
</script>

<style scoped>
/* Scoped styles */
</style>
