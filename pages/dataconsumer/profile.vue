<template>
  <div class="dataconsumer-profile">
    <div class="page-header">
      <h1>My Profile</h1>
      <p class="subtitle">Your account information</p>
    </div>

    <!-- Profile Card -->
    <div class="profile-card">
      <div class="profile-avatar">
        <span>{{ adminInitials }}</span>
      </div>
      <div class="profile-info">
        <h2>{{ adminName }}</h2>
        <p class="role">Data Consumer</p>
      </div>
    </div>

    <!-- Logout Section -->
    <div class="section">
      <h3 class="section-title">Session</h3>
      <button @click="handleLogout" class="btn-danger">
        <ArrowRightOnRectangleIcon class="btn-icon" />
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'

definePageMeta({
  layout: 'dataconsumer',
  middleware: 'data-consumer-auth',
})

const adminStore = useAdminStore()
const router = useRouter()

// Computed
const admin = computed(() => adminStore.getAdmin || {})

const adminName = computed(() => {
  const adminData = admin.value
  if (adminData && adminData.fname && adminData.lname) {
    return `${adminData.fname} ${adminData.lname}`
  }
  return admin.value.username || 'User'
})

const adminInitials = computed(() => {
  const adminData = admin.value
  if (adminData && adminData.fname && adminData.lname) {
    return `${adminData.fname?.charAt(0) || ''}${adminData.lname?.charAt(0) || ''}`.toUpperCase()
  }
  return adminData.username?.substring(0, 2).toUpperCase() || 'U'
})

// Methods
const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    adminStore.logout()
    await navigateTo('/admin/login')
  }
}
</script>

<style scoped>
.dataconsumer-profile {
  max-width: 700px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Profile Card */
.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  color: white;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-info h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px;
}

.role {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* Section Styling */
.section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
}

/* Buttons */
.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .dataconsumer-profile {
    max-width: 100%;
  }

  .profile-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
