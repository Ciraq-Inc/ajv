<template>
  <div class="company-user-access">
    <div class="section-header">
      <h2>User Access Management</h2>
      <button @click="exportUsers" class="btn-secondary" v-if="users.length > 0">
        📥 Export Users
      </button>
    </div>

    <div class="info-banner">
      <span class="info-icon">ℹ️</span>
      <p>Enable online access for users to allow them to login to the SMS campaigns and services portal.</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-details">
          <div class="stat-value">{{ users.length }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div class="stat-details">
          <div class="stat-value">{{ usersWithAccess }}</div>
          <div class="stat-label">Access Enabled</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">⏸️</div>
        <div class="stat-details">
          <div class="stat-value">{{ usersWithoutAccess }}</div>
          <div class="stat-label">Access Disabled</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🔐</div>
        <div class="stat-details">
          <div class="stat-value">{{ usersWithPassword }}</div>
          <div class="stat-label">Has Password</div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by name, phone, email, or username..."
          class="search-input"
        >
      </div>
      
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
      <p>❌ {{ error }}</p>
      <button @click="loadUsers" class="btn-retry">Retry</button>
    </div>

    <!-- Users Table -->
    <div v-else class="table-container">
      <div class="table-header">
        <div class="showing-count">
          Showing {{ filteredUsers.length }} of {{ users.length }} users
        </div>
      </div>

      <table class="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Contact</th>
            <th>Role</th>
            <th>Status</th>
            <th>Online Access</th>
            <th>Password Set</th>
            <th>Last Login</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
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
              <div class="contact-cell">
                <div v-if="user.tel" class="contact-item">📱 {{ user.tel }}</div>
                <div v-if="user.email" class="contact-item">📧 {{ user.email }}</div>
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
              <span class="password-badge" :class="user.password_hash ? 'has-password' : 'no-password'">
                {{ user.password_hash ? '✓ Yes' : '✗ No' }}
              </span>
            </td>
            <td>
              <div class="date-cell">
                {{ formatDate(user.last_login) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredUsers.length === 0" class="no-results">
        <p>No users found matching your criteria</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '~/stores/company'

const companyStore = useCompanyStore()

// State
const users = ref([])
const loading = ref(true)
const error = ref(null)
const updating = ref(null)
const searchQuery = ref('')
const filterAccess = ref('')
const filterActive = ref('')

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
      user.userid?.toLowerCase().includes(query)
    )
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

const usersWithAccess = computed(() => {
  return users.value.filter(u => u.allowed_online_access).length
})

const usersWithoutAccess = computed(() => {
  return users.value.filter(u => !u.allowed_online_access).length
})

const usersWithPassword = computed(() => {
  return users.value.filter(u => u.password_hash).length
})

// Methods
const loadUsers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await companyStore.makeAuthRequest('/api/company-auth/users/access')
    
    if (response.success) {
      users.value = response.data.users || []
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

const toggleUserAccess = async (user) => {
  const newValue = !user.allowed_online_access
  updating.value = user.id

  try {
    const response = await companyStore.makeAuthRequest(
      `/api/company-auth/users/${user.id}/access`,
      {
        method: 'PUT',
        body: JSON.stringify({
          allowed_online_access: newValue
        })
      }
    )

    if (response.success) {
      user.allowed_online_access = newValue
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
  const headers = ['Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Online Access', 'Has Password', 'Last Login']
  const rows = data.map(user => [
    getUserFullName(user),
    user.username || user.userid,
    user.email || '',
    user.tel || '',
    user.userrole || '',
    user.isactive ? 'Active' : 'Inactive',
    user.allowed_online_access ? 'Enabled' : 'Disabled',
    user.password_hash ? 'Yes' : 'No',
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
})
</script>

<style scoped>
.company-user-access {
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

.info-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-icon {
  font-size: 20px;
}

.info-banner p {
  margin: 0;
  font-size: 14px;
  color: #1e40af;
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
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
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

.contact-cell {
  font-size: 13px;
}

.contact-item {
  color: #64748b;
  margin-bottom: 4px;
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

.password-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.password-badge.has-password {
  background: #d1fae5;
  color: #065f46;
}

.password-badge.no-password {
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

.btn-retry {
  background: #6366f1;
  color: white;
  margin-top: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading/Error */
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
}
</style>
