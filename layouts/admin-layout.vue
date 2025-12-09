<template>
  <div v-if="isReady" class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- Logo/Brand -->
      <div class="sidebar-header">
        <div class="logo">
          <BuildingOfficeIcon class="logo-icon" />
          <span v-if="!isSidebarCollapsed" class="logo-text">Rigel Portal</span>
        </div>
        <button 
          @click="toggleSidebar" 
          class="collapse-btn"
          :title="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <ChevronRightIcon v-if="isSidebarCollapsed" class="collapse-icon" />
          <ChevronLeftIcon v-else class="collapse-icon" />
        </button>
      </div>

      <!-- Admin Info -->
      <div class="admin-info" v-if="!isSidebarCollapsed">
        <div class="admin-avatar">
          {{ adminInitials }}
        </div>
        <div class="admin-details">
          <div class="admin-name">{{ adminName }}</div>
          <div class="admin-role">{{ adminRole }}</div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Main</div>
          
          <NuxtLink 
            to="/admin/data" 
            class="nav-item"
            active-class="active"
          >
            <ChartBarIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Data</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/signups" 
            class="nav-item"
            active-class="active"
          >
            <UserGroupIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Waitlist Signups</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/access" 
            class="nav-item"
            active-class="active"
          >
            <KeyIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Company Management</span>
          </NuxtLink>

          
          <NuxtLink 
            to="/admin/useraccess" 
            class="nav-item"
            active-class="active"
          >
            <UserGroupIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">User Access Management</span>
          </NuxtLink>
        </div>

        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">SMS Management</div>
          
          <NuxtLink 
            to="/admin/sms-campaigns" 
            class="nav-item"
            active-class="active"
          >
            <DevicePhoneMobileIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">SMS Campaigns</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/sms-billing" 
            class="nav-item"
            active-class="active"
          >
            <CreditCardIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">SMS Billing</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/sms-settings" 
            class="nav-item"
            active-class="active"
          >
            <Cog6ToothIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">SMS Settings</span>
          </NuxtLink>
        </div> 

        <!-- <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Operations</div>
          
          <NuxtLink 
            to="/admin/orders" 
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">📦</span>
            <span v-if="!isSidebarCollapsed" class="nav-text">Orders</span>
            <span v-if="!isSidebarCollapsed && pendingOrders > 0" class="badge">{{ pendingOrders }}</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/companies" 
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">🏢</span>
            <span v-if="!isSidebarCollapsed" class="nav-text">Companies</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/products" 
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">💊</span>
            <span v-if="!isSidebarCollapsed" class="nav-text">Products</span>
          </NuxtLink>
        </div>  -->

        <!-- <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">System</div>
          
          <NuxtLink 
            to="/admin/settings" 
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">⚙️</span>
            <span v-if="!isSidebarCollapsed" class="nav-text">Settings</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/logs" 
            class="nav-item"
            active-class="active"
          >
            <span class="nav-icon">📋</span>
            <span v-if="!isSidebarCollapsed" class="nav-text">Activity Logs</span>
          </NuxtLink>
        </div>  -->
      </nav>

      <!-- Logout Button -->
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <ArrowLeftOnRectangleIcon class="nav-icon" />
          <span v-if="!isSidebarCollapsed" class="nav-text">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <button 
            @click="toggleSidebar" 
            class="mobile-menu-btn"
          >
            ☰
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        
        <div class="topbar-right">
         

          <!-- Admin Profile -->
          <div class="admin-profile" @click="toggleProfileMenu">
            <div class="profile-avatar">{{ adminInitials }}</div>
            <span class="profile-name">{{ adminName }}</span>
            <span class="dropdown-icon">▼</span>
          </div>
        </div>

        <!-- Profile Dropdown -->
        <div v-if="showProfileMenu" class="profile-dropdown">
          <!-- <NuxtLink to="/admin/profile" class="dropdown-item">
            <UserIcon class="dropdown-icon-small" /> My Profile
          </NuxtLink> -->
          <NuxtLink to="/admin/settings" class="dropdown-item">
            <Cog6ToothIcon class="dropdown-icon-small" /> Settings
          </NuxtLink>
          <hr class="dropdown-divider">
          <button @click="handleLogout" class="dropdown-item logout">
            <ArrowLeftOnRectangleIcon class="dropdown-icon-small" /> Logout
          </button>
        </div>

        <!-- Notifications Panel -->
        <div v-if="showNotifications" class="notifications-panel">
          <div class="notifications-header">
            <h3>Notifications</h3>
            <button @click="markAllAsRead" class="mark-read-btn">Mark all as read</button>
          </div>
          <div class="notifications-list">
            <div v-if="notifications.length === 0" class="no-notifications">
              No new notifications
            </div>
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
            >
              <span class="notification-icon">{{ notification.icon }}</span>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="content">
        <slot />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="!isSidebarCollapsed && isMobile" 
      class="mobile-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  KeyIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'
import { useRoute } from 'vue-router'

const adminStore = useAdminStore()
const route = useRoute()

// State
const isReady = ref(false)
const isSidebarCollapsed = ref(false)
const isMobile = ref(false)
const showProfileMenu = ref(false)
const showNotifications = ref(false)
const pendingOrders = ref(0)



// Computed
const adminName = computed(() => {
  if (adminStore.admin) {
    return `${adminStore.admin.fname || ''} ${adminStore.admin.lname || ''}`.trim() || 'Admin User'
  }
  return 'Admin User'
})

const adminRole = computed(() => {
  return adminStore.admin?.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Admin'
})

const adminInitials = computed(() => {
  if (adminStore.admin) {
    const fname = adminStore.admin.fname || ''
    const lname = adminStore.admin.lname || ''
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase() || 'A'
  }
  return 'A'
})

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('/admin/data')) return 'Data Overview'
  if (path.includes('/admin/signups')) return 'Waitlist Signups'
  if (path.includes('/admin/user-access')) return 'User Access Management'
  if (path.includes('/admin/access')) return 'Company Management'
  if (path.includes('/admin/sms-campaigns')) return 'SMS Campaign Management'
  if (path.includes('/admin/sms-billing')) return 'SMS Billing Management'
  if (path.includes('/admin/sms-settings')) return 'SMS Settings'
  if (path.includes('/admin/orders')) return 'Orders Management'
  if (path.includes('/admin/companies')) return 'Companies'
  if (path.includes('/admin/products')) return 'Products'
  if (path.includes('/admin/settings')) return 'Settings'
  if (path.includes('/admin/logs')) return 'Activity Logs'
  return 'Dashboard'
})

// Methods
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  if (process.client) {
    localStorage.setItem('adminSidebarCollapsed', isSidebarCollapsed.value)
  }
}

const closeSidebar = () => {
  if (isMobile.value) {
    isSidebarCollapsed.value = true
  }
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
  showNotifications.value = false
}


const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    adminStore.logout()
    navigateTo('/admin/login')
  }
}

const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) {
      isSidebarCollapsed.value = true
    }
  }
}

const handleClickOutside = (e) => {
  if (!e.target.closest('.admin-profile') && !e.target.closest('.profile-dropdown')) {
    showProfileMenu.value = false
  }
  if (!e.target.closest('.topbar-btn') && !e.target.closest('.notifications-panel')) {
    showNotifications.value = false
  }
}

// Lifecycle
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)
  
  // Restore sidebar state
  if (process.client) {
    const savedState = localStorage.getItem('adminSidebarCollapsed')
    if (savedState !== null && !isMobile.value) {
      isSidebarCollapsed.value = savedState === 'true'
    }
  }
  
  // Wait for store to be ready
  await nextTick()
  isReady.value = true
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #F9FAFB; /* gray-50 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 256px; /* w-64 */
  background: linear-gradient(180deg, #1F2937 0%, #111827 100%); /* gray-800 to gray-900 */
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  transition: all 0.2s ease; /* fast transition */
  z-index: 1000;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 16px; /* p-4 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px; /* gap-3 */
}

.logo-icon {
  font-size: 28px;
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 18px; /* lg */
  font-weight: 700; /* bold */
  white-space: nowrap;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 4px; /* rounded */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease; /* fast */
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.collapse-icon {
  width: 20px;
  height: 20px;
}

.admin-info {
  padding: 16px; /* p-4 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-avatar {
  width: 48px; /* w-12 h-12 */
  height: 48px;
  border-radius: 9999px; /* rounded-full */
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); /* blue-500 to blue-700 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700; /* bold */
  margin-bottom: 12px; /* mb-3 */
}

.admin-details {
  text-align: left;
}

.admin-name {
  font-weight: 600; /* semibold */
  font-size: 14px; /* sm */
  margin-bottom: 4px; /* mb-1 */
}

.admin-role {
  font-size: 12px; /* xs */
  color: #9CA3AF; /* gray-400 */
  text-transform: capitalize;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0; /* py-4 */
}

.nav-section {
  margin-bottom: 24px; /* mb-6 */
}

.nav-section-title {
  font-size: 11px; /* xs - 12px but smaller for uppercase */
  font-weight: 600; /* semibold */
  text-transform: uppercase;
  color: #64748B; /* gray-500 */
  padding: 0 16px 8px; /* px-4 pb-2 */
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 16px; /* py-2 px-4 */
  color: #CBD5E1; /* gray-300 */
  text-decoration: none;
  transition: all 0.15s ease; /* fast */
  position: relative;
  cursor: pointer;
  border-radius: 4px; /* rounded */
  margin: 2px 8px; /* mx-2 for hover area */
}

.nav-item:hover {
  background: #F3F4F6; /* gray-100 */
  color: #374151; /* gray-700 */
}

.nav-item.active {
  background: #3B82F6; /* blue-500 */
  color: white;
  border-left: 2px solid #3B82F6; /* emphasis border */
}

.nav-icon {
  font-size: 18px; /* w-5 h-5 default */
  min-width: 20px; /* w-5 */
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  margin-left: 12px; /* ml-3 */
  font-size: 14px; /* sm */
  font-weight: 500; /* medium */
  white-space: nowrap;
}

.badge {
  margin-left: auto;
  background: #EF4444; /* red-500 */
  color: white;
  font-size: 11px; /* xs - 12px but smaller */
  font-weight: 600; /* semibold */
  padding: 2px 8px; /* py-0.5 px-2 */
  border-radius: 9999px; /* rounded-full */
}

/* Sidebar Footer */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px; /* p-4 */
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 0; /* py-2 */
  background: transparent;
  border: none;
  color: #EF4444; /* red-500 */
  cursor: pointer;
  transition: all 0.15s ease; /* fast */
  font-size: 14px; /* sm */
  font-weight: 500; /* medium */
  border-radius: 4px; /* rounded */
}

.logout-btn:hover {
  color: #DC2626; /* red-600 */
  background: rgba(239, 68, 68, 0.1);
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 256px; /* ml-64 */
  transition: margin-left 0.2s ease; /* fast */
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar.collapsed ~ .main-content {
  margin-left: 70px;
}

/* Topbar */
.topbar {
  background: #FFFFFF; /* white */
  padding: 16px 24px; /* py-4 px-6 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #E5E7EB; /* gray-200 */
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px; /* gap-4 */
}

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #1F2937; /* gray-800 */
}

.page-title {
  font-size: 24px; /* xl */
  font-weight: 700; /* bold */
  color: #1F2937; /* gray-800 */
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px; /* gap-4 */
  position: relative;
}

.topbar-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  padding: 8px; /* p-2 */
  border-radius: 8px; /* rounded-lg */
  transition: background 0.15s ease; /* fast */
}

.topbar-btn:hover {
  background: #F3F4F6; /* gray-100 */
}

.topbar-btn .icon {
  font-size: 20px; /* w-6 h-6 */
}

.notification-badge,
.alert-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #EF4444; /* red-500 */
  color: white;
  font-size: 10px; /* xs - 12px but smaller */
  font-weight: 700; /* bold */
  padding: 2px 6px; /* py-0.5 px-1.5 */
  border-radius: 9999px; /* rounded-full */
  min-width: 18px;
  text-align: center;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 10px; /* gap-2.5 */
  padding: 8px 12px; /* py-2 px-3 */
  border-radius: 8px; /* rounded-lg */
  cursor: pointer;
  transition: background 0.15s ease; /* fast */
}

.admin-profile:hover {
  background: #F3F4F6; /* gray-100 */
}

.profile-avatar {
  width: 36px; /* w-9 h-9 */
  height: 36px;
  border-radius: 9999px; /* rounded-full */
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); /* blue-500 to blue-700 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px; /* sm */
  font-weight: 700; /* bold */
  color: white;
}

.profile-name {
  font-size: 14px; /* sm */
  font-weight: 600; /* semibold */
  color: #1F2937; /* gray-800 */
}

.dropdown-icon {
  font-size: 10px;
  color: #64748B; /* gray-500 */
}

/* Profile Dropdown */
.profile-dropdown {
  position: absolute;
  top: 60px;
  right: 24px;
  background: #FFFFFF; /* white */
  border-radius: 8px; /* rounded-lg */
  min-width: 200px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  border: 1px solid #E5E7EB; /* gray-200 */
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
  gap: 10px; /* gap-2.5 */
  padding: 12px 16px; /* py-3 px-4 */
  color: #1F2937; /* gray-800 */
  text-decoration: none;
  transition: background 0.15s ease; /* fast */
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 14px; /* sm */
  font-weight: 500; /* medium */
  border-radius: 4px; /* rounded */
}

.dropdown-item:hover {
  background: #F3F4F6; /* gray-100 */
}

.dropdown-item.logout {
  color: #EF4444; /* red-500 */
}

.dropdown-item.logout:hover {
  background: #FEF2F2; /* red-50 */
}

.dropdown-icon-small {
  width: 16px;
  height: 16px;
}

.dropdown-divider {
  margin: 8px 0; /* my-2 */
  border: none;
  border-top: 1px solid #E5E7EB; /* gray-200 */
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: 60px;
  right: 200px;
  background: #FFFFFF; /* white */
  border-radius: 8px; /* rounded-lg */
  width: 320px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  border: 1px solid #E5E7EB; /* gray-200 */
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px; /* p-4 */
  border-bottom: 1px solid #E5E7EB; /* gray-200 */
}

.notifications-header h3 {
  margin: 0;
  font-size: 16px; /* base */
  font-weight: 600; /* semibold */
  color: #1F2937; /* gray-800 */
}

.mark-read-btn {
  background: transparent;
  border: none;
  color: #3B82F6; /* blue-500 */
  font-size: 12px; /* xs */
  cursor: pointer;
  font-weight: 500; /* medium */
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  padding: 40px; /* p-10 */
  text-align: center;
  color: #9CA3AF; /* gray-400 */
  font-size: 14px; /* sm */
}

.notification-item {
  display: flex;
  gap: 12px; /* gap-3 */
  padding: 12px 16px; /* py-3 px-4 */
  border-bottom: 1px solid #F3F4F6; /* gray-100 */
  cursor: pointer;
  transition: background 0.15s ease; /* fast */
}

.notification-item:hover {
  background: #F9FAFB; /* gray-50 */
}

.notification-item.unread {
  background: #EFF6FF; /* blue-50 */
}

.notification-icon {
  font-size: 20px; /* w-6 h-6 */
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 13px;
  color: #1F2937; /* gray-800 */
  margin-bottom: 4px; /* mb-1 */
}

.notification-time {
  font-size: 11px; /* xs - 12px but smaller */
  color: #9CA3AF; /* gray-400 */
}

/* Content Area */
.content {
  flex: 1;
  padding: 24px; /* p-6 */
  /* max-width: 1280px;  */
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

  .sidebar.collapsed {
    transform: translateX(0);
    width: 256px; /* w-64 */
  }

  .main-content {
    margin-left: 0;
  }

  .sidebar.collapsed ~ .main-content {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-overlay {
    display: block;
  }

  .page-title {
    font-size: 18px; /* lg */
  }

  .profile-name {
    display: none;
  }

  .notifications-panel {
    right: 24px; /* px-6 */
    width: calc(100vw - 48px);
    max-width: 320px;
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
