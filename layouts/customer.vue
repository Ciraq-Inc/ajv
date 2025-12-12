<template>
  <div class="customer-layout">
    <!-- Main Content -->
    <div class="main-content">
      <!-- Top Bar / Navbar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>

        <div class="top-bar-right">
          <div class="user-profile" @click="toggleProfileMenu">
            <div class="profile-avatar">{{ userInitials }}</div>
            <span class="profile-name">{{ userName }}</span>
            <span class="dropdown-icon">▼</span>
          </div>
        </div>

        <div v-if="showProfileMenu" class="profile-dropdown">
          <NuxtLink to="/customer" class="dropdown-item">
            <UserIcon class="dropdown-icon-sm" /> My Profile
          </NuxtLink>
          <hr class="dropdown-divider">
          <button @click="handleLogout" class="dropdown-item logout">
            <ArrowLeftOnRectangleIcon class="dropdown-icon-sm" /> Logout
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  UserIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const route = useRoute()

// State
const showProfileMenu = ref(false)
const isLoggingOut = ref(false)

// Computed
const userName = computed(() => {
  const user = userStore.currentUser
  if (user) {
    return `${user.fname || ''} ${user.lname || ''}`.trim() || 'Customer'
  }
  return 'Customer'
})

const userInitials = computed(() => {
  const user = userStore.currentUser
  if (user) {
    const fname = user.fname || ''
    const lname = user.lname || ''
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase() || 'C'
  }
  return 'C'
})

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('/customer/orders')) return 'My Orders'
  if (path.includes('/customer/profile')) return 'My Profile'
  if (path.includes('/customer/companies')) return 'Linked Companies'
  return 'Dashboard'
})

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    isLoggingOut.value = true
    try {
      await userStore.logout()
      navigateTo('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      isLoggingOut.value = false
    }
  }
}

const handleClickOutside = (e) => {
  if (!e.target.closest('.user-profile') && !e.target.closest('.profile-dropdown')) {
    showProfileMenu.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.customer-layout {
  min-height: 100vh;
  background: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Top Bar / Navbar */
.top-bar {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
  background: white;
}

.user-profile:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.dropdown-icon {
  font-size: 12px;
  color: #9ca3af;
}

/* Profile Dropdown */
.profile-dropdown {
  position: absolute;
  top: 60px;
  right: 2rem;
  background: white;
  border-radius: 12px;
  min-width: 200px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #374151;
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0.25rem;
  cursor: pointer;
  border: none;
  background: transparent;
  width: calc(100% - 0.5rem);
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
}

.dropdown-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.dropdown-item.logout {
  color: #dc2626;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.dropdown-icon-sm {
  width: 16px;
  height: 16px;
}

.dropdown-divider {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.25rem;
  }

  .profile-name {
    display: none;
  }

  .top-bar {
    padding: 1rem;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>