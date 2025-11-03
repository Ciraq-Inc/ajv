<template>
  <div class="company-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Logo/Header -->
      <div class="sidebar-header">
        <div class="flex items-center gap-3" :class="{ 'justify-center': sidebarCollapsed }">
          <div class="company-logo">
            <BuildingOffice2Icon class="h-6 w-6 text-blue-600" />
          </div>
          <div v-if="!sidebarCollapsed" class="company-info">
            <h2 class="text-lg font-bold text-gray-900">{{ companyName }}</h2>
            <p class="text-xs text-gray-600">Services Portal</p>
          </div>
        </div>
      </div>

      <!-- Toggle Button (Always Visible) -->
      <div class="toggle-btn-container">
        <button 
          @click="toggleSidebar" 
          class="toggle-btn"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <ChevronRightIcon v-if="sidebarCollapsed" class="h-5 w-5" />
          <ChevronLeftIcon v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <NuxtLink 
          v-for="item in navigationItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
          <span v-if="!sidebarCollapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer (User Info) -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <UserIcon class="h-5 w-5 text-gray-600" />
          </div>
          <div v-if="!sidebarCollapsed" class="user-details">
            <p class="user-name">{{ userName }}</p>
            <p class="user-role">{{ userRole }}</p>
          </div>
        </div>
        <button 
          v-if="!sidebarCollapsed"
          @click="handleLogout" 
          class="logout-btn"
          :disabled="isLoggingOut"
        >
          <ArrowPathIcon v-if="isLoggingOut" class="h-4 w-4 animate-spin" />
          <ArrowLeftOnRectangleIcon v-else class="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="flex items-center gap-4">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Notifications -->
          <button class="icon-btn" title="Notifications">
            <BellIcon class="h-5 w-5" />
          </button>
          
          <!-- Settings -->
          <button class="icon-btn" title="Settings">
            <Cog6ToothIcon class="h-5 w-5" />
          </button>
          
          <!-- User Menu -->
          <div class="user-menu">
            <button @click="toggleUserMenu" class="user-menu-btn">
              <UserIcon class="h-5 w-5" />
              <span>{{ userName }}</span>
              <ChevronDownIcon class="h-4 w-4" />
            </button>
            
            <div v-if="showUserMenu" class="user-menu-dropdown">
              <NuxtLink to="/profile" class="menu-item">
                <UserIcon class="h-4 w-4" />
                Profile
              </NuxtLink>
              <NuxtLink to="/settings" class="menu-item">
                <Cog6ToothIcon class="h-4 w-4" />
                Settings
              </NuxtLink>
              <hr class="my-2 border-gray-200" />
              <button @click="handleLogout" class="menu-item text-red-600">
                <ArrowLeftOnRectangleIcon class="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import { 
  BuildingOffice2Icon, 
  UserIcon, 
  BellIcon, 
  Cog6ToothIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  BoltIcon,
  CreditCardIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

const sidebarCollapsed = ref(false)
const showUserMenu = ref(false)
const isLoggingOut = ref(false)

// Get company domain from route
const companyDomain = computed(() => {
  const pathMatch = route.path.match(/\/([^\/]+)\/services/)
  return pathMatch ? pathMatch[1] : 'company'
})

// User info
const userName = computed(() => companyStore.userName || 'User')
const userRole = computed(() => {
  const role = companyStore.userRole || 'user'
  return role.charAt(0).toUpperCase() + role.slice(1)
})
const companyName = computed(() => companyStore.currentCompany?.name || 'Company')

// Page title from route meta or default
const pageTitle = computed(() => {
  return route.meta.title || route.name || 'Dashboard'
})

// Navigation items
const navigationItems = computed(() => [
  {
    path: `/${companyDomain.value}/services/sms-campaigns`,
    label: 'SMS Campaigns',
    icon: ChatBubbleLeftIcon,
  },
  {
    path: `/${companyDomain.value}/services/sms-create-campaign`,
    label: 'Create Campaign',
    icon: PlusIcon,
  },
  {
    path: `/${companyDomain.value}/services/sms-credits`,
    label: 'SMS Credits',
    icon: BoltIcon,
  },
  {
    path: `/${companyDomain.value}/services/sms-billing`,
    label: 'Billing',
    icon: CreditCardIcon,
  },
])

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (typeof window !== 'undefined') {
    localStorage.setItem('companySidebarCollapsed', sidebarCollapsed.value.toString())
  }
}

// Toggle user menu
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// Handle logout
const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await companyStore.logout()
    router.push(`/${companyDomain.value}/services/login`)
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    isLoggingOut.value = false
  }
}

// Load saved sidebar state
onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('companySidebarCollapsed')
    if (saved) {
      sidebarCollapsed.value = saved === 'true'
    }
  }

  // Close user menu when clicking outside
  if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu')) {
        showUserMenu.value = false
      }
    })
  }
})
</script>

<style scoped>
.company-layout {
  display: flex;
  height: 100vh;
  background: #f9fafb;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sidebar-collapsed .sidebar-header {
  flex-direction: column;
  padding: 1rem;
}

.toggle-btn-container {
  display: flex;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-collapsed .toggle-btn-container {
  padding: 0.5rem;
}

.company-logo {
  min-width: 40px;
  height: 40px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-info h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-info p {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.toggle-btn {
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #f3f4f6;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  position: relative;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-item.router-link-active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  min-width: 20px;
}

.nav-label {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.sidebar-collapsed .user-info {
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Top Bar */
.top-bar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.icon-btn {
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #f3f4f6;
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.user-menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  min-width: 200px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  z-index: 50;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  color: #374151;
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: #f3f4f6;
}

/* Page Content */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 40;
    transform: translateX(-100%);
  }
  
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .top-bar {
    padding: 1rem;
  }
  
  .page-content {
    padding: 1rem;
  }
}
</style>
