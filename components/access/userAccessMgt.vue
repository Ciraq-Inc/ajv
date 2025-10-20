<template>
  <div class="user-access-management">
    <div class="section-header">
      <h2>User Access Management</h2>
      <button 
        @click="showAddAdminModal = true" 
        class="btn-primary"
        v-if="adminStore.isSuperAdmin"
      >
        ➕ Add New Admin
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-details">
          <div class="stat-value">{{ admins.length }}</div>
          <div class="stat-label">Total Admins</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div class="stat-details">
          <div class="stat-value">{{ activeAdmins }}</div>
          <div class="stat-label">Active Admins</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🔐</div>
        <div class="stat-details">
          <div class="stat-value">{{ roleCount }}</div>
          <div class="stat-label">Roles</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">📊</div>
        <div class="stat-details">
          <div class="stat-value">{{ superAdminCount }}</div>
          <div class="stat-label">Super Admins</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search admins by name, email, or role..."
          class="search-input"
        >
      </div>
      <select v-model="filterRole" class="filter-select">
        <option value="">All Roles</option>
        <option value="super_admin">Super Admin</option>
        <option value="auditor">Auditor</option>
        <option value="support_agent">Support Agent</option>
        <option value="business_analyst">Business Analyst</option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading admins...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>❌ {{ error }}</p>
      <button @click="loadAdmins" class="btn-retry">Retry</button>
    </div>

    <!-- Admins Table -->
    <div v-else class="table-container">
      <table class="admins-table">
        <thead>
          <tr>
            <th>Admin</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Created</th>
            <th v-if="adminStore.isSuperAdmin">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in filteredAdmins" :key="admin.id">
            <td>
              <div class="admin-cell">
                <div class="admin-avatar">
                  {{ getInitials(admin.fname, admin.lname) }}
                </div>
                <div>
                  <div class="admin-name">{{ admin.fname }} {{ admin.lname }}</div>
                  <div class="admin-username">@{{ admin.username }}</div>
                </div>
              </div>
            </td>
            <td>{{ admin.email }}</td>
            <td>
              <span class="role-badge" :class="getRoleClass(admin.role)">
                {{ formatRole(admin.role) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="admin.is_active ? 'active' : 'inactive'">
                {{ admin.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="date-cell">
                {{ formatDate(admin.last_login) }}
              </div>
            </td>
            <td>
              <div class="date-cell">
                {{ formatDate(admin.created_at) }}
              </div>
            </td>
            <td v-if="adminStore.isSuperAdmin">
              <div class="actions">
                <button 
                  @click="editAdmin(admin)" 
                  class="btn-icon edit"
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  @click="confirmDelete(admin)" 
                  class="btn-icon delete"
                  title="Delete"
                  :disabled="admin.id === adminStore.admin?.id"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredAdmins.length === 0" class="no-results">
        <p>No admins found matching your criteria</p>
      </div>
    </div>

    <!-- Add/Edit Admin Modal -->
    <div v-if="showAddAdminModal || editingAdmin" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingAdmin ? 'Edit Admin' : 'Add New Admin' }}</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAdmin">
            <div class="form-grid">
              <div class="form-group">
                <label>First Name *</label>
                <input 
                  v-model="adminForm.fname" 
                  type="text" 
                  required
                  placeholder="John"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input 
                  v-model="adminForm.lname" 
                  type="text" 
                  required
                  placeholder="Doe"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-group">
              <label>Username *</label>
              <input 
                v-model="adminForm.username" 
                type="text" 
                required
                placeholder="johndoe"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label>Email *</label>
              <input 
                v-model="adminForm.email" 
                type="email" 
                required
                placeholder="john@example.com"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label>Role *</label>
              <select v-model="adminForm.role" required class="form-select">
                <option value="">Select Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="auditor">Auditor</option>
                <option value="support_agent">Support Agent</option>
                <option value="business_analyst">Business Analyst</option>
              </select>
            </div>

            <div class="form-group" v-if="!editingAdmin">
              <label>Password *</label>
              <input 
                v-model="adminForm.password" 
                type="password" 
                :required="!editingAdmin"
                placeholder="••••••••"
                class="form-input"
              >
              <small class="form-hint">Minimum 8 characters</small>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="adminForm.is_active">
                <span>Active</span>
              </label>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save Admin' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingAdmin" class="modal-overlay" @click.self="deletingAdmin = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button @click="deletingAdmin = null" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ deletingAdmin.fname }} {{ deletingAdmin.lname }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
          
          <div class="form-actions">
            <button @click="deletingAdmin = null" class="btn-secondary">
              Cancel
            </button>
            <button @click="deleteAdmin" class="btn-danger" :disabled="saving">
              {{ saving ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

// State
const admins = ref([])
const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const showAddAdminModal = ref(false)
const editingAdmin = ref(null)
const deletingAdmin = ref(null)

const adminForm = ref({
  fname: '',
  lname: '',
  username: '',
  email: '',
  role: '',
  password: '',
  is_active: true
})

// Computed
const filteredAdmins = computed(() => {
  let filtered = admins.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(admin => 
      admin.fname?.toLowerCase().includes(query) ||
      admin.lname?.toLowerCase().includes(query) ||
      admin.email?.toLowerCase().includes(query) ||
      admin.username?.toLowerCase().includes(query) ||
      admin.role?.toLowerCase().includes(query)
    )
  }

  if (filterRole.value) {
    filtered = filtered.filter(admin => admin.role === filterRole.value)
  }

  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active'
    filtered = filtered.filter(admin => admin.is_active === isActive)
  }

  return filtered
})

const activeAdmins = computed(() => {
  return admins.value.filter(a => a.is_active).length
})

const roleCount = computed(() => {
  return new Set(admins.value.map(a => a.role)).size
})

const superAdminCount = computed(() => {
  return admins.value.filter(a => a.role === 'super_admin').length
})

// Methods
const loadAdmins = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await adminStore.getAllAdmins()
    
    if (response.success) {
      admins.value = response.data || []
    } else {
      error.value = response.message || 'Failed to load admins'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load admins'
    console.error('Error loading admins:', err)
  } finally {
    loading.value = false
  }
}

const editAdmin = (admin) => {
  editingAdmin.value = admin
  adminForm.value = {
    fname: admin.fname,
    lname: admin.lname,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    password: '',
    is_active: admin.is_active
  }
}

const closeModal = () => {
  showAddAdminModal.value = false
  editingAdmin.value = null
  resetForm()
}

const resetForm = () => {
  adminForm.value = {
    fname: '',
    lname: '',
    username: '',
    email: '',
    role: '',
    password: '',
    is_active: true
  }
}

const saveAdmin = async () => {
  saving.value = true
  
  try {
    let response
    
    if (editingAdmin.value) {
      const updateData = { ...adminForm.value }
      if (!updateData.password) {
        delete updateData.password
      }
      response = await adminStore.updateAdmin(editingAdmin.value.id, updateData)
    } else {
      response = await adminStore.createAdmin(adminForm.value)
    }
    
    if (response.success) {
      alert(editingAdmin.value ? 'Admin updated successfully!' : 'Admin created successfully!')
      closeModal()
      loadAdmins()
    } else {
      alert(response.message || 'Failed to save admin')
    }
  } catch (err) {
    alert(err.message || 'Failed to save admin')
    console.error('Error saving admin:', err)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (admin) => {
  deletingAdmin.value = admin
}

const deleteAdmin = async () => {
  saving.value = true
  
  try {
    const response = await adminStore.deleteAdmin(deletingAdmin.value.id)
    
    if (response.success) {
      alert('Admin deleted successfully!')
      deletingAdmin.value = null
      loadAdmins()
    } else {
      alert(response.message || 'Failed to delete admin')
    }
  } catch (err) {
    alert(err.message || 'Failed to delete admin')
    console.error('Error deleting admin:', err)
  } finally {
    saving.value = false
  }
}

// Formatting helpers
const getInitials = (fname, lname) => {
  return `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase()
}

const formatRole = (role) => {
  return role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'
}

const getRoleClass = (role) => {
  const classes = {
    'super_admin': 'super-admin',
    'auditor': 'auditor',
    'support_agent': 'support',
    'business_analyst': 'analyst'
  }
  return classes[role] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  loadAdmins()
})
</script>

<style scoped>
.user-access-management {
  max-width: 1400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #d1fae5; }
.stat-icon.purple { background: #e9d5ff; }
.stat-icon.orange { background: #fed7aa; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 160px;
  background: white;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-danger,
.btn-retry {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-retry {
  background: #6366f1;
  color: white;
  margin-top: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.admins-table {
  width: 100%;
  border-collapse: collapse;
}

.admins-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.admins-table th {
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admins-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #1e293b;
}

.admins-table tbody tr:hover {
  background: #f8fafc;
}

.admin-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.admin-name {
  font-weight: 600;
  color: #1e293b;
}

.admin-username {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.super-admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.auditor {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.support {
  background: #d1fae5;
  color: #065f46;
}

.role-badge.analyst {
  background: #e9d5ff;
  color: #6b21a8;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.date-cell {
  font-size: 13px;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #f1f5f9;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Loading/Error States */
.loading-container,
.error-container {
  background: white;
  border-radius: 12px;
  padding: 60px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-results {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: calc(100% - 32px);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

.modal-sm {
  max-width: 400px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 24px;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.warning-text {
  color: #ef4444;
  font-size: 14px;
  margin: 16px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }
}
</style>
