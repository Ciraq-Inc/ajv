<template>
  <div class="customer-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo-icon">
              <UserCircleIcon class="icon-lg" />
            </div>
            <div v-if="!sidebarCollapsed" class="logo-text">
              <h3 class="text-lg font-medium text-white">Customer Portal</h3>
              <p class="text-indigo-100 text-sm">Your Account</p>
            </div>
          </div>
          <button
            @click="toggleSidebar"
            class="toggle-btn"
            :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <ChevronRightIcon v-if="sidebarCollapsed" class="toggle-icon" />
            <ChevronLeftIcon v-else class="toggle-icon" />
          </button>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div v-if="!sidebarCollapsed" class="nav-section-title">Account</div>

          <NuxtLink
            to="/customer/profile"
            class="nav-item"
            active-class="active"
          >
            <UserIcon class="nav-icon" />
            <span v-if="!sidebarCollapsed" class="nav-text">Profile</span>
          </NuxtLink>

          <NuxtLink
            to="/customer/orders"
            class="nav-item"
            active-class="active"
          >
            <ShoppingCartIcon class="nav-icon" />
            <span v-if="!sidebarCollapsed" class="nav-text">Orders</span>
          </NuxtLink>

          <NuxtLink
            to="/customer/linked-companies"
            class="nav-item"
            active-class="active"
          >
            <BuildingOfficeIcon class="nav-icon" />
            <span v-if="!sidebarCollapsed" class="nav-text">Linked Companies</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <div v-if="!sidebarCollapsed" class="user-details">
            <p class="user-name">{{ userName }}</p>
            <p class="user-email">{{ userEmail }}</p>
          </div>
        </div>
        <button
          v-if="!sidebarCollapsed"
          @click="handleLogout"
          class="logout-btn"
          :disabled="isLoggingOut"
        >
          <ArrowPathIcon v-if="isLoggingOut" class="spinner-icon" />
          <ArrowLeftOnRectangleIcon v-else class="logout-icon" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <button
            @click="toggleSidebar"
            class="mobile-menu-btn"
          >
            ☰
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>

        <div class="top-bar-right">
          <!-- User Profile -->
          <div class="user-profile" @click="toggleProfileMenu">
            <div class="profile-avatar">{{ userInitials }}</div>
            <span class="profile-name">{{ userName }}</span>
            <span class="dropdown-icon">▼</span>
          </div>
        </div>

        <!-- Profile Dropdown -->
        <div v-if="showProfileMenu" class="profile-dropdown">
          <NuxtLink to="/customer/profile" class="dropdown-item">
            <UserIcon class="dropdown-icon-sm" /> My Profile
          </NuxtLink>
          <NuxtLink to="/customer/settings" class="dropdown-item">
            <Cog6ToothIcon class="dropdown-icon-sm" /> Settings
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

    <!-- Mobile Overlay -->
    <div
      v-if="!sidebarCollapsed && isMobile"
      class="mobile-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const route = useRoute()

// State
const sidebarCollapsed = ref(false)
const isMobile = ref(false)
const showProfileMenu = ref(false)
const isLoggingOut = ref(false)

// Computed
const userName = computed(() => {
  if (userStore.user) {
    return `${userStore.user.fname || ''} ${userStore.user.lname || ''}`.trim() || 'Customer'
  }
  return 'Customer'
})

const userEmail = computed(() => {
  return userStore.user?.email || ''
})

const userInitials = computed(() => {
  if (userStore.user) {
    const fname = userStore.user.fname || ''
    const lname = userStore.user.lname || ''
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase() || 'C'
  }
  return 'C'
})

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('/customer/profile')) return 'My Profile'
  if (path.includes('/customer/orders')) return 'My Orders'
  if (path.includes('/customer/linked-companies')) return 'Linked Companies'
  return 'Dashboard'
})

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (process.client) {
    localStorage.setItem('customerSidebarCollapsed', sidebarCollapsed.value)
  }
}

const closeSidebar = () => {
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    isLoggingOut.value = true
    try {
      await userStore.logout()
      navigateTo('/customer/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      isLoggingOut.value = false
    }
  }
}

const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) {
      sidebarCollapsed.value = true
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
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)

  // Restore sidebar state
  if (process.client) {
    const savedState = localStorage.getItem('customerSidebarCollapsed')
    if (savedState !== null && !isMobile.value) {
      sidebarCollapsed.value = savedState === 'true'
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.customer-layout {
  display: flex;
  min-height: 100vh;
  background: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.logo-text h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.logo-text p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  padding: 0 1.5rem 0.5rem;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0.25rem 0.75rem;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-left: 3px solid #60a5fa;
}

.nav-icon {
  font-size: 20px;
  min-width: 24px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  margin-left: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Sidebar Footer */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.user-details {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #fca5a5;
  color: #fecaca;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.logout-icon {
  width: 16px;
  height: 16px;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar-collapsed ~ .main-content {
  margin-left: 80px;
}

/* Top Bar */
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

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.page-title {
  font-size: 1.875rem;
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
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar-collapsed {
    transform: translateX(0);
    width: 280px;
  }

  .main-content {
    margin-left: 0;
  }

  .sidebar-collapsed ~ .main-content {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-overlay {
    display: block;
  }

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

/* Scrollbar Styling */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>