<template>
  <div class="multi-tenant-user-access">
    <div class="section-header">
      <h2>Multi-Tenant User Access Management</h2>
      <button @click="exportUsers" class="btn-secondary" v-if="filteredUsers.length > 0">
        <ArrowDownTrayIcon class="btn-icon-sm" />
        Export Users
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <UserGroupIcon class="stat-icon blue" />
        <div class="stat-details">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <CheckCircleIcon class="stat-icon green" />
        <div class="stat-details">
          <div class="stat-value">{{ stats.with_access || 0 }}</div>
          <div class="stat-label">Online Access Enabled</div>
        </div>
      </div>
      <div class="stat-card">
        <PauseCircleIcon class="stat-icon orange" />
        <div class="stat-details">
          <div class="stat-value">{{ stats.without_access || 0 }}</div>
          <div class="stat-label">Access Disabled</div>
        </div>
      </div>
      <div class="stat-card">
        <BuildingOfficeIcon class="stat-icon purple" />
        <div class="stat-details">
          <div class="stat-value">{{ stats.companies || 0 }}</div>
          <div class="stat-label">Companies</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <MagnifyingGlassIcon class="search-icon" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by name, phone, email, or username..."
          class="search-input"
        >
      </div>
      
      <select v-model="filterCompany" class="filter-select">
        <option value="">All Companies</option>
        <option v-for="company in companies" :key="company.id" :value="company.id">
          {{ company.name }}
        </option>
      </select>

      <select v-model="filterAccess" class="filter-select">
        <option value="">All Access Status</option>
        <option value="enabled">Access Enabled</option>
        <option value="disabled">Access Disabled</option>
      </select>

      <select v-model="filterActive" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <ExclamationTriangleIcon class="error-icon" />
      <p>{{ error }}</p>
      <button @click="loadUsers" class="btn-retry">Retry</button>
    </div>

    <!-- Users Table -->
    <div v-else class="table-container">
      <div class="table-header">
        <div class="showing-count">
          Showing {{ filteredUsers.length }} of {{ users.length }} users
        </div>
        <div v-if="selectedUsers.length > 0" class="bulk-actions">
          <span>{{ selectedUsers.length }} selected</span>
          <button @click="bulkEnableAccess" class="btn-sm btn-primary">
            <CheckIcon class="btn-icon-xs" />
            Enable Access
          </button>
          <button @click="bulkDisableAccess" class="btn-sm btn-secondary">
            <XMarkIcon class="btn-icon-xs" />
            Disable Access
          </button>
        </div>
      </div>

      <table class="users-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                @change="toggleSelectAll"
                :checked="allSelected"
              >
            </th>
            <th>User</th>
            <th>Company</th>
            <th>Contact</th>
            <th>Role</th>
            <th>Status</th>
            <th>Online Access</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="`${user.company_id}-${user.id}`">
            <td>
              <input 
                type="checkbox" 
                :value="user.id"
                v-model="selectedUsers"
              >
            </td>
            <td>
              <div class="user-cell">
                <div class="user-avatar">
                  {{ getUserInitials(user) }}
                </div>
                <div>
                  <div class="user-name">{{ getUserFullName(user) }}</div>
                  <div class="user-username">{{ user.username || user.userid }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="company-badge">{{ user.company_name }}</span>
            </td>
            <td>
              <div class="contact-cell">
                <div v-if="user.tel" class="contact-item">
                  <PhoneIcon />
                  {{ user.tel }}
                </div>
                <div v-if="user.email" class="contact-item">
                  <EnvelopeIcon />
                  {{ user.email }}
                </div>
              </div>
            </td>
            <td>
              <span v-if="user.userrole" class="role-badge">{{ user.userrole }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span class="status-badge" :class="user.isactive ? 'active' : 'inactive'">
                {{ user.isactive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="access-toggle">
                <label class="switch">
                  <input 
                    type="checkbox"
                    :checked="user.allowed_online_access"
                    @change="toggleUserAccess(user)"
                    :disabled="updating === user.id"
                  >
                  <span class="slider"></span>
                </label>
                <span class="access-label" :class="user.allowed_online_access ? 'enabled' : 'disabled'">
                  {{ user.allowed_online_access ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </td>
            <td>
              <div class="date-cell">
                {{ formatDate(user.last_login) }}
              </div>
            </td>
            <td>
              <button 
                @click="viewUserDetails(user)" 
                class="btn-icon"
                title="View Details"
              >
                <EyeIcon />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredUsers.length === 0" class="no-results">
        <p>No users found matching your criteria</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="btn-pagination"
        >
          <ChevronLeftIcon class="pagination-icon" />
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="btn-pagination"
        >
          Next
          <ChevronRightIcon class="pagination-icon" />
        </button>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="viewingUser" class="modal-overlay" @click.self="viewingUser = null">
      <div class="modal">
        <div class="modal-header">
          <h2>User Details</h2>
          <button @click="viewingUser = null" class="close-btn">
            <XMarkIcon />
          </button>
        </div>
        <div class="modal-body">
          <div class="user-details">
            <div class="detail-section">
              <h3>Personal Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Full Name:</label>
                  <span>{{ getUserFullName(viewingUser) }}</span>
                </div>
                <div class="detail-item">
                  <label>Username:</label>
                  <span>{{ viewingUser.username || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>User ID:</label>
                  <span>{{ viewingUser.userid }}</span>
                </div>
                <div class="detail-item">
                  <label>Email:</label>
                  <span>{{ viewingUser.email || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>Phone:</label>
                  <span>{{ viewingUser.tel || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>Role:</label>
                  <span>{{ viewingUser.userrole || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Company Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Company:</label>
                  <span>{{ viewingUser.company_name }}</span>
                </div>
                <div class="detail-item">
                  <label>Centre:</label>
                  <span>{{ viewingUser.centre || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Access Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Status:</label>
                  <span class="status-badge" :class="viewingUser.isactive ? 'active' : 'inactive'">
                    {{ viewingUser.isactive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Online Access:</label>
                  <span class="status-badge" :class="viewingUser.allowed_online_access ? 'active' : 'inactive'">
                    {{ viewingUser.allowed_online_access ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Phone Verified:</label>
                  <span>{{ viewingUser.phone_verified ? 'Yes' : 'No' }}</span>
                </div>
                <div class="detail-item">
                  <label>Has Password:</label>
                  <span>{{ viewingUser.password_hash ? 'Yes' : 'No' }}</span>
                </div>
                <div class="detail-item">
                  <label>Last Login:</label>
                  <span>{{ formatDate(viewingUser.last_login) }}</span>
                </div>
                <div class="detail-item">
                  <label>Created:</label>
                  <span>{{ formatDate(viewingUser.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="viewingUser = null" class="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  UserGroupIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'

const adminStore = useAdminStore()

// State
const users = ref([])
const companies = ref([])
const stats = ref({})
const loading = ref(true)
const error = ref(null)
const updating = ref(null)
const searchQuery = ref('')
const filterCompany = ref('')
const filterAccess = ref('')
const filterActive = ref('')
const selectedUsers = ref([])
const viewingUser = ref(null)
const currentPage = ref(1)
const perPage = 50

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.lname?.toLowerCase().includes(query) ||
      user.sname?.toLowerCase().includes(query) ||
      user.mname?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.tel?.toLowerCase().includes(query) ||
      user.userid?.toLowerCase().includes(query) ||
      user.company_name?.toLowerCase().includes(query)
    )
  }

  if (filterCompany.value) {
    filtered = filtered.filter(user => user.company_id == filterCompany.value)
  }

  if (filterAccess.value) {
    const hasAccess = filterAccess.value === 'enabled'
    filtered = filtered.filter(user => user.allowed_online_access === hasAccess)
  }

  if (filterActive.value) {
    const isActive = filterActive.value === 'active'
    filtered = filtered.filter(user => user.isactive === isActive)
  }

  return filtered
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / perPage)
})

const allSelected = computed(() => {
  return paginatedUsers.value.length > 0 && 
         paginatedUsers.value.every(user => selectedUsers.value.includes(user.id))
})

// Methods
const loadUsers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await adminStore.makeAuthRequest('/api/admin/users/access')
    
    if (response.success) {
      users.value = response.data.users || []
      stats.value = response.data.stats || {}
    } else {
      error.value = response.message || 'Failed to load users'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load users'
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

const loadCompanies = async () => {
  try {
    const response = await adminStore.makeAuthRequest('/api/companies')
    if (response.success) {
      companies.value = response.data || []
    }
  } catch (err) {
    console.error('Error loading companies:', err)
  }
}

const toggleUserAccess = async (user) => {
  const newValue = !user.allowed_online_access
  updating.value = user.id

  try {
    const response = await adminStore.makeAuthRequest(
      `/api/admin/users/${user.id}/access`,
      {
        method: 'PUT',
        body: JSON.stringify({
          company_id: user.company_id,
          allowed_online_access: newValue
        })
      }
    )

    if (response.success) {
      user.allowed_online_access = newValue
      
      // Update stats
      if (newValue) {
        stats.value.with_access++
        stats.value.without_access--
      } else {
        stats.value.with_access--
        stats.value.without_access++
      }
    } else {
      alert(response.message || 'Failed to update access')
    }
  } catch (err) {
    alert(err.message || 'Failed to update access')
    console.error('Error updating access:', err)
  } finally {
    updating.value = null
  }
}

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedUsers.value = paginatedUsers.value.map(u => u.id)
  } else {
    selectedUsers.value = []
  }
}

const bulkEnableAccess = async () => {
  if (!confirm(`Enable online access for ${selectedUsers.value.length} users?`)) return

  try {
    const response = await adminStore.makeAuthRequest('/api/admin/users/bulk-access', {
      method: 'PUT',
      body: JSON.stringify({
        user_ids: selectedUsers.value,
        allowed_online_access: true
      })
    })

    if (response.success) {
      alert(`Successfully enabled access for ${response.data.updated} users`)
      selectedUsers.value = []
      loadUsers()
    } else {
      alert(response.message || 'Failed to update users')
    }
  } catch (err) {
    alert(err.message || 'Failed to update users')
    console.error('Error in bulk update:', err)
  }
}

const bulkDisableAccess = async () => {
  if (!confirm(`Disable online access for ${selectedUsers.value.length} users?`)) return

  try {
    const response = await adminStore.makeAuthRequest('/api/admin/users/bulk-access', {
      method: 'PUT',
      body: JSON.stringify({
        user_ids: selectedUsers.value,
        allowed_online_access: false
      })
    })

    if (response.success) {
      alert(`Successfully disabled access for ${response.data.updated} users`)
      selectedUsers.value = []
      loadUsers()
    } else {
      alert(response.message || 'Failed to update users')
    }
  } catch (err) {
    alert(err.message || 'Failed to update users')
    console.error('Error in bulk update:', err)
  }
}

const viewUserDetails = (user) => {
  viewingUser.value = user
}

const exportUsers = () => {
  const csv = convertToCSV(filteredUsers.value)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users-access-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const convertToCSV = (data) => {
  const headers = ['Company', 'Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Online Access', 'Last Login']
  const rows = data.map(user => [
    user.company_name,
    getUserFullName(user),
    user.username || user.userid,
    user.email || '',
    user.tel || '',
    user.userrole || '',
    user.isactive ? 'Active' : 'Inactive',
    user.allowed_online_access ? 'Enabled' : 'Disabled',
    formatDate(user.last_login)
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Helpers
const getUserFullName = (user) => {
  return `${user.lname || ''} ${user.mname || ''} ${user.sname || ''}`.trim() || user.username || user.userid
}

const getUserInitials = (user) => {
  const fname = user.lname || user.username || user.userid || ''
  const lname = user.sname || ''
  return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase() || '?'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadUsers()
  loadCompanies()
})
</script>

<style scoped>
/* Base styles from companyAccessMgt.vue */
.multi-tenant-user-access {
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
  flex-shrink: 0;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #d1fae5; }
.stat-icon.orange { background: #fed7aa; }
.stat-icon.purple { background: #e9d5ff; }

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
  width: 18px;
  height: 18px;
  color: #9ca3af;
  flex-shrink: 0;
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
  min-width: 180px;
  background: white;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.showing-count {
  font-size: 14px;
  color: #64748b;
}

.bulk-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.bulk-actions span {
  font-size: 14px;
  color: #475569;
  font-weight: 600;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.users-table th {
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #1e293b;
}

.users-table tbody tr:hover {
  background: #f8fafc;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
}

.user-username {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.company-badge {
  background: #ede9fe;
  color: #6b21a8;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.contact-cell {
  font-size: 13px;
}

.contact-item {
  color: #64748b;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-item svg {
  width: 14px;
  height: 14px;
}

.role-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
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

.access-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.access-label {
  font-size: 13px;
  font-weight: 600;
}

.access-label.enabled {
  color: #10b981;
}

.access-label.disabled {
  color: #64748b;
}

.date-cell {
  font-size: 13px;
  color: #64748b;
}

.text-muted {
  color: #94a3b8;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-sm,
.btn-icon,
.btn-retry {
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  padding: 12px 24px;
  background: #6366f1;
  color: white;
  font-size: 14px;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-secondary {
  padding: 12px 24px;
  background: #f1f5f9;
  color: #1e293b;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-icon-sm {
  width: 18px;
  height: 18px;
}

.btn-icon-xs {
  width: 14px;
  height: 14px;
}

.btn-icon {
  background: transparent;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.btn-icon:hover {
  background: #f1f5f9;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

.btn-icon:hover {
  background: #f1f5f9;
}

.btn-retry {
  padding: 12px 24px;
  background: #6366f1;
  color: white;
  font-size: 14px;
  margin-top: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-pagination {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-pagination:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 16px;
  height: 16px;
}

.page-info {
  font-size: 14px;
  color: #64748b;
}

/* Loading/Error */
.loading-container,
.error-container {
  background: white;
  border-radius: 12px;
  padding: 60px;
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #ef4444;
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
  max-width: 800px;
  width: calc(100% - 32px);
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
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

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
}

/* User Details */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  font-size: 14px;
  color: #1e293b;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
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

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .bulk-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
