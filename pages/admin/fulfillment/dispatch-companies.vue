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
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #111827;">{{ company.name }}</h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #6b7280; display: flex; align-items: center; gap: 0.25rem;">
              <span>📍</span> {{ company.address || company.operating_area || company.address1 || company.location || 'No address' }}
            </p>
          </div>
          <span style="background: #ecfdf5; color: #047857; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 9999px; font-weight: 500;">
             Active
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 1rem; margin-top: 0.5rem;">
          <div style="font-size: 0.85rem; color: #4b5563;">
            <div>Admins: <strong>{{ company.admin_count || 0 }}</strong></div>
            <div>Riders: <strong>{{ company.rider_count || 0 }}</strong></div>
          </div>
          <button @click="manageAdmins(company)" style="background: none; border: 1px solid #d1d5db; border-radius: 4px; padding: 0.3rem 0.6rem; font-size: 0.8rem; cursor: pointer; color: #374151;">
            Manage Admins
          </button>
        </div>
      </div>
      
      <div v-if="companies.length === 0 && !loading" style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px;">
        No dispatch companies found.
      </div>
    </div>

    <!-- Create Company Modal -->
    <div v-if="showCreateModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50;">
      <div class="modal-content" style="background: #fff; border-radius: 8px; width: 100%; max-width: 500px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1.5rem 0; font-size: 1.25rem;">Create Dispatch Company</h2>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Company Name *</label>
            <input v-model="newCompany.name" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;" placeholder="e.g. Swift Riders">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Phone *</label>
            <input v-model="newCompany.phone" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;" placeholder="e.g. 0241234567">
          </div>
          
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Location (Area)</label>
            <input v-model="newCompany.location" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;" placeholder="e.g. East Legon">
          </div>
          
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Address Line 1</label>
            <input v-model="newCompany.address1" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;" placeholder="e.g. 15 Mensah Wood St">
          </div>

          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Latitude (optional)</label>
              <input v-model="newCompany.latitude" type="number" step="0.000001" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;" placeholder="5.6037">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem;">Longitude (optional)</label>
              <input v-model="newCompany.longitude" type="number" step="0.000001" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;" placeholder="-0.1870">
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

    <!-- Manage Admins Modal -->
    <div v-if="selectedCompany" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 50;">
      <div class="modal-content" style="background: #fff; border-radius: 8px; width: 100%; max-width: 500px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.25rem;">Admins for {{ selectedCompany.name }}</h2>
          <button @click="selectedCompany = null" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
        </div>
        
        <div style="max-height: 250px; overflow-y: auto; margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 4px; padding: 0.5rem;">
          <div v-if="selectedCompanyAdmins.length === 0" style="padding: 1rem; text-align: center; color: #6b7280; font-size: 0.85rem;">
            No admins found for this company.
          </div>
          <div v-for="admin in selectedCompanyAdmins" :key="admin.id" style="padding: 0.5rem; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
            <div>
              <div style="font-weight: 500;">{{ admin.name || admin.username }}</div>
              <div style="font-size: 0.8rem; color: #6b7280;">{{ admin.phone || 'No phone' }} • {{ admin.username }}</div>
              <div style="font-size: 0.8rem; color: #6b7280;">Added: {{ new Date(admin.created_at).toLocaleDateString() }}</div>
            </div>
            <!-- Future: Delete button -->
          </div>
        </div>

        <div style="background: #f9fafb; padding: 1rem; border-radius: 4px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Add New Admin</h4>
          <div style="display: flex; gap: 0.5rem; mb-2">
            <input v-model="newAdmin.name" type="text" placeholder="Full name" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem;">
            <input v-model="newAdmin.phone" type="text" placeholder="Phone" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem;">
          </div>
          <div style="display: flex; gap: 0.5rem; mb-2">
            <input v-model="newAdmin.username" type="text" placeholder="Username" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem;">
            <input v-model="newAdmin.password" type="password" placeholder="Password" style="flex: 1; padding: 0.4rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.85rem;">
          </div>
          <button @click="createAdmin" :disabled="savingAdmin" style="width: 100%; margin-top: 0.5rem; padding: 0.4rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
            {{ savingAdmin ? 'Adding...' : 'Add Admin User' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '~~/composables/useApi';

definePageMeta({
    layout: 'admin-layout',
    middleware: 'admin-auth'
});

const api = useApi();
const companies = ref([]);
const loading = ref(false);
const error = ref('');

// Create Company
const showCreateModal = ref(false);
const saving = ref(false);
const newCompany = ref({
    name: '',
  phone: '',
    address1: '',
    location: '',
    latitude: '',
    longitude: ''
});

// Manage Admins
const selectedCompany = ref(null);
const selectedCompanyAdmins = ref([]);
const savingAdmin = ref(false);
const newAdmin = ref({ name: '', phone: '', username: '', password: '' });


const fetchCompanies = async () => {
    loading.value = true;
    error.value = '';
    try {
        const response = await api.get('/api/deliveries/dispatch-companies');
        if (response.success) {
            companies.value = response.data || [];
        } else {
            error.value = response.message || 'Failed to fetch companies';
        }
    } catch (e) {
        error.value = e.message || 'An error occurred';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const createCompany = async () => {
    if (!newCompany.value.name || !newCompany.value.phone) return alert('Company name and phone are required');
    
    saving.value = true;
    try {
        const payload = {
            name: newCompany.value.name,
          phone: newCompany.value.phone,
          address: newCompany.value.address1,
          operating_area: newCompany.value.location,
            latitude: newCompany.value.latitude ? parseFloat(newCompany.value.latitude) : undefined,
            longitude: newCompany.value.longitude ? parseFloat(newCompany.value.longitude) : undefined
        };
        
        const response = await api.post('/api/deliveries/dispatch-companies', payload);
        if (response.success) {
            showCreateModal.value = false;
            // Reset form
            newCompany.value = { name: '', phone: '', address1: '', location: '', latitude: '', longitude: '' };
            await fetchCompanies(); // Refresh list
        } else {
            alert(response.message || 'Failed to create');
        }
    } catch (e) {
        console.error(e);
        alert(e.message || 'Error creating company');
    } finally {
        saving.value = false;
    }
};

const manageAdmins = async (company) => {
    selectedCompany.value = company;
    selectedCompanyAdmins.value = [];
    newAdmin.value = { name: '', phone: '', username: '', password: '' };
    
    // Fetch full company details to get admins
    try {
        const response = await api.get(`/api/deliveries/dispatch-companies/${company.id}`);
        if (response.success && response.data) {
            selectedCompanyAdmins.value = response.data.admins || [];
        }
    } catch (e) {
        console.error("Error fetching admins", e);
    }
};

const createAdmin = async () => {
    if (!newAdmin.value.name || !newAdmin.value.phone || !newAdmin.value.username || !newAdmin.value.password) {
      return alert('Name, phone, username and password are required');
    }
    
    savingAdmin.value = true;
    try {
        const response = await api.post(`/api/deliveries/dispatch-companies/${selectedCompany.value.id}/admins`, {
          name: newAdmin.value.name,
          phone: newAdmin.value.phone,
            username: newAdmin.value.username,
            password: newAdmin.value.password
        });
        
        if (response.success) {
          newAdmin.value = { name: '', phone: '', username: '', password: '' }; // reset
            // Refresh admins for this company
            await manageAdmins(selectedCompany.value);
            // Refresh companies list silently in background to update count
            fetchCompanies();
        } else {
            alert(response.message || 'Failed to add admin');
        }
    } catch (e) {
        alert(e.message || 'An error occurred');
    } finally {
        savingAdmin.value = false;
    }
};

onMounted(() => {
    fetchCompanies();
});
</script>

<style scoped>
/* Scoped styles */
</style>
