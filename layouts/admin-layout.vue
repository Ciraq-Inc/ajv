<template>
  <div v-if="isReady" class="admin-layout">
    <!-- WCAG 2.4.1 Bypass Blocks -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- Logo/Brand -->
      <div class="sidebar-header">
        <div class="logo">
          <img src="/brand/rig-mark.svg" alt="Rigelis" class="logo-icon" />
          <span v-if="!isSidebarCollapsed" class="logo-text">Rigel Portal</span>
        </div>
        <button @click="toggleSidebar" class="collapse-btn"
          :title="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'">
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
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Analytics</div>

          <NuxtLink to="/admin/data" class="nav-item" active-class="active">
            <ChartBarIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Pharmacy Data</span>
          </NuxtLink>
        </div>

        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Operations</div>

          <!-- Fulfillment parent label -->
          <div class="nav-item" :class="{ active: isInFulfillment }" style="cursor:default; pointer-events:none;">
            <ClipboardDocumentListIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Fulfillment</span>
          </div>

          <!-- Fulfillment child links -->
          <template v-if="isInFulfillment || !isSidebarCollapsed">
            <NuxtLink to="/admin/fulfillment/requests" class="nav-item nav-child-item" active-class="active">
              <ClipboardDocumentListIcon class="nav-icon" style="width:16px;height:16px;min-width:16px;" />
              <span v-if="!isSidebarCollapsed" class="nav-text">Order Requests</span>
            </NuxtLink>
            <NuxtLink to="/admin/fulfillment/deliveries" class="nav-item nav-child-item" active-class="active">
              <TruckIcon class="nav-icon" style="width:16px;height:16px;min-width:16px;" />
              <span v-if="!isSidebarCollapsed" class="nav-text">Deliveries</span>
            </NuxtLink>
            <NuxtLink to="/admin/fulfillment/dispatch-companies" class="nav-item nav-child-item" active-class="active">
              <BuildingOffice2Icon class="nav-icon" style="width:16px;height:16px;min-width:16px;" />
              <span v-if="!isSidebarCollapsed" class="nav-text">Dispatch Companies</span>
            </NuxtLink>
            <NuxtLink to="/admin/fulfillment/pharmacy-ledger" class="nav-item nav-child-item" active-class="active">
              <BanknotesIcon class="nav-icon" style="width:16px;height:16px;min-width:16px;" />
              <span v-if="!isSidebarCollapsed" class="nav-text">Pharmacy Ledger</span>
            </NuxtLink>
          </template>
        </div>

        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Products</div>

          <NuxtLink to="/admin/masterlist" class="nav-item" active-class="active">
            <CubeIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Master Products</span>
          </NuxtLink>
        </div>

        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Companies & Users</div>

          <NuxtLink 
            to="/admin/access?tab=companies" 
            class="nav-item"
            exact-active-class="active"
          >
            <KeyIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Companies</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/useraccess" 
            class="nav-item"
            active-class="active"
          >
            <UserGroupIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">User Access</span>
          </NuxtLink>

          <NuxtLink to="/admin/signups" class="nav-item" active-class="active">
            <ClipboardDocumentCheckIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Waitlist Signups</span>
          </NuxtLink>
        </div>

        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">SMS</div>

          <NuxtLink to="/admin/sms-campaigns" class="nav-item" active-class="active">
            <DevicePhoneMobileIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Campaigns</span>
          </NuxtLink>

          <NuxtLink to="/admin/sms-billing" class="nav-item" active-class="active">
            <CreditCardIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Billing</span>
          </NuxtLink>

         
        </div>

        <div class="nav-section">
          <div v-if="!isSidebarCollapsed" class="nav-section-title">Settings</div>

          <NuxtLink
            to="/admin/platform-settings"
            class="nav-item"
            active-class="active"
          >
            <Cog6ToothIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Platform Settings</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/fee-schedules"
            class="nav-item"
            active-class="active"
          >
            <BanknotesIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Fee Schedules</span>
          </NuxtLink>

          <NuxtLink 
            to="/admin/store-settings" 
            class="nav-item"
            active-class="active"
          >
            <SwatchIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">Store Settings</span>
          </NuxtLink>

           <NuxtLink to="/admin/sms-settings" class="nav-item" active-class="active">
            <Cog6ToothIcon class="nav-icon" />
            <span v-if="!isSidebarCollapsed" class="nav-text">SMS Settings</span>
          </NuxtLink>
        </div>
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
          <button @click="toggleSidebar" class="mobile-menu-btn">
            ☰
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>

        <div class="topbar-right">

          <!-- Needs Attention Bell -->
          <button
            class="topbar-btn attention-bell"
            :class="{ 'has-critical': hasCriticalAttention }"
            @click.stop="toggleAttention"
            :title="attentionQueue.length ? `${attentionQueue.length} request${attentionQueue.length === 1 ? '' : 's'} need attention` : 'No items need attention'"
          >
            <BellIcon class="icon" />
            <span v-if="attentionQueue.length" class="alert-badge">{{ attentionQueue.length > 99 ? '99+' : attentionQueue.length }}</span>
            <span v-if="hasCriticalAttention" class="attention-bell-pulse" aria-hidden="true"></span>
          </button>


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

        <!-- Needs Attention Panel -->
        <div v-if="showAttention" class="notifications-panel attention-panel">
          <div class="notifications-header">
            <div class="attention-header-title">
              <span class="attention-header-dot" :class="hasCriticalAttention ? 'critical' : 'warning'"></span>
              <h3>Needs Attention</h3>
              <span v-if="attentionQueue.length" class="attention-header-count">{{ attentionQueue.length }}</span>
            </div>
            <button
              @click.stop="soundMuted = !soundMuted"
              class="mark-read-btn"
              :title="soundMuted ? 'Unmute alerts' : 'Mute alerts'"
            >
              {{ soundMuted ? '🔇 Muted' : '🔔 Sound on' }}
            </button>
          </div>
          <div class="notifications-list">
            <div v-if="attentionQueue.length === 0" class="no-notifications">
              All caught up — no items need attention.
            </div>
            <button
              v-for="req in attentionQueue"
              :key="req.id"
              type="button"
              class="attention-item"
              :class="`attention-item--${req._urgency}`"
              @click="openAttentionItem(req)"
            >
              <span class="attention-item-dot" :class="`attention-item-dot--${req._urgency}`"></span>
              <div class="attention-item-body">
                <div class="attention-item-top">
                  <span class="attention-item-num">{{ req.request_number || `#${req.id}` }}</span>
                  <span class="attention-item-name">{{ req.customer_name || '—' }}</span>
                </div>
                <div class="attention-item-reason" :class="`attention-item-reason--${req._urgency}`">
                  {{ req._reason }}
                </div>
              </div>
              <span class="attention-item-arrow">›</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main id="main-content" tabindex="-1" class="content">
        <slot />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div v-if="!isSidebarCollapsed && isMobile" class="mobile-overlay" @click="closeSidebar"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  BuildingOffice2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  KeyIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  BanknotesIcon,
  SwatchIcon,
  BellIcon,
} from '@heroicons/vue/24/outline'
import { useAdminStore } from '~/stores/admin'
import { useRoute, useRouter } from 'vue-router'
import { useAttentionQueue } from '~/composables/useAttentionQueue'

const adminStore = useAdminStore()
const route = useRoute()
const router = useRouter()

// State
const isReady = ref(false)
const isSidebarCollapsed = ref(false)
const isMobile = ref(false)
const showProfileMenu = ref(false)
const showAttention = ref(false)
const pendingOrders = ref(0)

// Needs-Attention feed (shared singleton; polls every 30s while mounted)
const { attentionQueue, soundMuted, start: startAttentionPolling, stop: stopAttentionPolling, acknowledge: acknowledgeAttention } = useAttentionQueue()
const hasCriticalAttention = computed(() => attentionQueue.value.some((r) => r._urgency === 'critical'))



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
  const tab = route.query.tab
  if (path.includes('/admin/data')) return 'Pharmacy Data'
  if (path.includes('/admin/signups')) return 'Waitlist Signups'
  if (path.includes('/admin/access')) return 'Companies'
  if (path.includes('/admin/useraccess')) return 'User Access'
  if (path.includes('/admin/sms-campaigns')) return 'SMS Campaigns'
  if (path.includes('/admin/sms-billing')) return 'SMS Billing'
  if (path.includes('/admin/sms-settings')) return 'SMS Settings'
  if (path.includes('/admin/masterlist')) return 'Master Products'
  if (path.includes('/admin/fulfillment/requests')) return 'Order Requests'
  if (path.includes('/admin/fulfillment/deliveries')) return 'Deliveries'
  if (path.includes('/admin/fulfillment/dispatch-companies')) return 'Dispatch Companies'
  if (path.includes('/admin/fulfillment/pharmacy-ledger')) return 'Pharmacy Ledger'
  if (path.includes('/admin/fulfillment')) return 'Fulfillment'
  if (path.includes('/admin/platform-settings')) return 'Platform Settings'
  if (path.includes('/admin/fee-schedules')) return 'Fee Schedules'
  if (path.includes('/admin/store-settings')) return 'Store Settings'
  return 'Dashboard'
})

const isInFulfillment = computed(() => {
  return route.path.includes('/admin/fulfillment')
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
  showAttention.value = false
}

const toggleAttention = () => {
  showAttention.value = !showAttention.value
  showProfileMenu.value = false
  if (showAttention.value) acknowledgeAttention()
}

const openAttentionItem = (req) => {
  if (!req?.id) return
  showAttention.value = false
  router.push({ path: '/admin/fulfillment/requests', query: { requestId: String(req.id) } })
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
  if (!e.target.closest('.attention-bell') && !e.target.closest('.attention-panel')) {
    showAttention.value = false
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

  // Start polling the attention queue once we're authenticated and mounted.
  startAttentionPolling()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
  stopAttentionPolling()
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #F9FAFB;
  /* gray-50 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 256px;
  /* w-64 */
  background: linear-gradient(180deg, #2A1130 0%, #1A0B20 100%);
  /* brand purple */
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  transition: all 0.2s ease;
  /* fast transition */
  z-index: 1000;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 16px;
  /* p-4 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  /* gap-3 */
}

.logo-icon {
  font-size: 28px;
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 18px;
  /* lg */
  font-weight: 700;
  /* bold */
  white-space: nowrap;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  /* rounded */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  /* fast */
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.collapse-icon {
  width: 20px;
  height: 20px;
}

.admin-info {
  padding: 16px;
  /* p-4 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-avatar {
  width: 48px;
  /* w-12 h-12 */
  height: 48px;
  border-radius: 9999px;
  /* rounded-full */
  background: linear-gradient(135deg, #C073A7 0%, #5A2468 100%);
  /* brand magenta to purple */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  /* bold */
  margin-bottom: 12px;
  /* mb-3 */
}

.admin-details {
  text-align: left;
}

.admin-name {
  font-weight: 600;
  /* semibold */
  font-size: 14px;
  /* sm */
  margin-bottom: 4px;
  /* mb-1 */
}

.admin-role {
  font-size: 12px;
  /* xs */
  color: #9CA3AF;
  /* gray-400 */
  text-transform: capitalize;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  /* py-4 */
}

.nav-section {
  margin-bottom: 24px;
  /* mb-6 */
}

.nav-section-title {
  font-size: 11px;
  /* xs - 12px but smaller for uppercase */
  font-weight: 600;
  /* semibold */
  text-transform: uppercase;
  color: #64748B;
  /* gray-500 */
  padding: 0 16px 8px;
  /* px-4 pb-2 */
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  /* py-2 px-4 */
  color: #CBD5E1;
  /* gray-300 */
  text-decoration: none;
  transition: all 0.15s ease;
  /* fast */
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  /* rounded */
  margin: 2px 8px;
  /* mx-2 for hover area */
}

.nav-item:hover {
  background: #F3F4F6;
  /* gray-100 */
  color: #374151;
  /* gray-700 */
}

.nav-item.active {
  background: #5A2468;
  /* brand purple */
  color: white;
  border-left: 2px solid #C073A7;
  /* magenta accent */
}

.nav-child-item {
  padding-left: 36px;
  font-size: 13px;
  margin-top: 1px;
}

.nav-icon {
  font-size: 18px;
  /* w-5 h-5 default */
  min-width: 20px;
  /* w-5 */
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  margin-left: 12px;
  /* ml-3 */
  font-size: 14px;
  /* sm */
  font-weight: 500;
  /* medium */
  white-space: nowrap;
}

.badge {
  margin-left: auto;
  background: #EF4444;
  /* red-500 */
  color: white;
  font-size: 11px;
  /* xs - 12px but smaller */
  font-weight: 600;
  /* semibold */
  padding: 2px 8px;
  /* py-0.5 px-2 */
  border-radius: 9999px;
  /* rounded-full */
}

/* Sidebar Footer */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  /* p-4 */
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 0;
  /* py-2 */
  background: transparent;
  border: none;
  color: #EF4444;
  /* red-500 */
  cursor: pointer;
  transition: all 0.15s ease;
  /* fast */
  font-size: 14px;
  /* sm */
  font-weight: 500;
  /* medium */
  border-radius: 4px;
  /* rounded */
}

.logout-btn:hover {
  color: #DC2626;
  /* red-600 */
  background: rgba(239, 68, 68, 0.1);
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 256px;
  /* ml-64 */
  transition: margin-left 0.2s ease;
  /* fast */
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar.collapsed~.main-content {
  margin-left: 70px;
}

/* Topbar */
.topbar {
  background: #FFFFFF;
  /* white */
  padding: 16px 24px;
  /* py-4 px-6 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #E5E7EB;
  /* gray-200 */
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  /* gap-4 */
}

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #1F2937;
  /* gray-800 */
}

.page-title {
  font-size: 24px;
  /* xl */
  font-weight: 700;
  /* bold */
  color: #1F2937;
  /* gray-800 */
  margin: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  /* gap-4 */
  position: relative;
}

.topbar-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  padding: 8px;
  /* p-2 */
  border-radius: 8px;
  /* rounded-lg */
  transition: background 0.15s ease;
  /* fast */
}

.topbar-btn:hover {
  background: #F3F4F6;
  /* gray-100 */
}

.topbar-btn .icon {
  font-size: 20px;
  /* w-6 h-6 */
}

.notification-badge,
.alert-badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 0 4px;
  border-radius: 9999px;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  /* gap-2.5 */
  padding: 8px 12px;
  /* py-2 px-3 */
  border-radius: 8px;
  /* rounded-lg */
  cursor: pointer;
  transition: background 0.15s ease;
  /* fast */
}

.admin-profile:hover {
  background: #F3F4F6;
  /* gray-100 */
}

.profile-avatar {
  width: 36px;
  /* w-9 h-9 */
  height: 36px;
  border-radius: 9999px;
  /* rounded-full */
  background: linear-gradient(135deg, #C073A7 0%, #5A2468 100%);
  /* brand magenta to purple */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  /* sm */
  font-weight: 700;
  /* bold */
  color: white;
}

.profile-name {
  font-size: 14px;
  /* sm */
  font-weight: 600;
  /* semibold */
  color: #1F2937;
  /* gray-800 */
}

.dropdown-icon {
  font-size: 10px;
  color: #64748B;
  /* gray-500 */
}

/* Profile Dropdown */
.profile-dropdown {
  position: absolute;
  top: 60px;
  right: 24px;
  background: #FFFFFF;
  /* white */
  border-radius: 8px;
  /* rounded-lg */
  min-width: 200px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  border: 1px solid #E5E7EB;
  /* gray-200 */
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
  gap: 10px;
  /* gap-2.5 */
  padding: 12px 16px;
  /* py-3 px-4 */
  color: #1F2937;
  /* gray-800 */
  text-decoration: none;
  transition: background 0.15s ease;
  /* fast */
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 14px;
  /* sm */
  font-weight: 500;
  /* medium */
  border-radius: 4px;
  /* rounded */
}

.dropdown-item:hover {
  background: #F3F4F6;
  /* gray-100 */
}

.dropdown-item.logout {
  color: #EF4444;
  /* red-500 */
}

.dropdown-item.logout:hover {
  background: #FEF2F2;
  /* red-50 */
}

.dropdown-icon-small {
  width: 16px;
  height: 16px;
}

.dropdown-divider {
  margin: 8px 0;
  /* my-2 */
  border: none;
  border-top: 1px solid #E5E7EB;
  /* gray-200 */
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: 60px;
  right: 200px;
  background: #FFFFFF;
  /* white */
  border-radius: 8px;
  /* rounded-lg */
  width: 320px;
  z-index: 1000;
  animation: slideDown 0.2s ease;
  border: 1px solid #E5E7EB;
  /* gray-200 */
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  /* p-4 */
  border-bottom: 1px solid #E5E7EB;
  /* gray-200 */
}

.notifications-header h3 {
  margin: 0;
  font-size: 16px;
  /* base */
  font-weight: 600;
  /* semibold */
  color: #1F2937;
  /* gray-800 */
}

.mark-read-btn {
  background: transparent;
  border: none;
  color: #9B4A88;
  /* brand magenta */
  font-size: 12px;
  /* xs */
  cursor: pointer;
  font-weight: 500;
  /* medium */
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  padding: 40px;
  /* p-10 */
  text-align: center;
  color: #9CA3AF;
  /* gray-400 */
  font-size: 14px;
  /* sm */
}

.notification-item {
  display: flex;
  gap: 12px;
  /* gap-3 */
  padding: 12px 16px;
  /* py-3 px-4 */
  border-bottom: 1px solid #F3F4F6;
  /* gray-100 */
  cursor: pointer;
  transition: background 0.15s ease;
  /* fast */
}

.notification-item:hover {
  background: #F9FAFB;
  /* gray-50 */
}

.notification-item.unread {
  background: #EFF6FF;
  /* blue-50 */
}

.notification-icon {
  font-size: 20px;
  /* w-6 h-6 */
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 13px;
  color: #1F2937;
  /* gray-800 */
  margin-bottom: 4px;
  /* mb-1 */
}

.notification-time {
  font-size: 11px;
  /* xs - 12px but smaller */
  color: #9CA3AF;
  /* gray-400 */
}

/* ── Needs Attention bell ── */
.attention-bell {
  position: relative;
  color: #4B5563;
}

.attention-bell:hover {
  color: #111827;
}

.attention-bell .icon {
  width: 22px;
  height: 22px;
}

.attention-bell.has-critical {
  color: #EF4444;
}

.attention-bell-pulse {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: #EF4444;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
  animation: attentionPulse 1.6s ease-out infinite;
  pointer-events: none;
}

@keyframes attentionPulse {
  0%   { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
  70%  { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

/* ── Attention dropdown panel ── */
.attention-panel {
  width: 360px;
  right: 200px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
}

.attention-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attention-header-title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.attention-header-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}

.attention-header-dot.critical {
  background: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.attention-header-dot.warning {
  background: #F59E0B;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
}

.attention-header-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #EF4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 9999px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
}

.attention-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border: none;
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
  border-left: 3px solid transparent;
}

.attention-item:last-child {
  border-bottom: none;
}

.attention-item:hover {
  background: #FAFAFA;
}

.attention-item--critical {
  border-left-color: #EF4444;
}

.attention-item--warning {
  border-left-color: #F59E0B;
}

.attention-item-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.attention-item-dot--critical {
  background: #EF4444;
}

.attention-item-dot--warning {
  background: #F59E0B;
}

.attention-item-body {
  flex: 1;
  min-width: 0;
}

.attention-item-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.attention-item-num {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.attention-item-name {
  font-size: 12px;
  color: #4B5563;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attention-item-reason {
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
}

.attention-item-reason--critical {
  background: #FFF1F2;
  color: #BE123C;
}

.attention-item-reason--warning {
  background: #FFFBEB;
  color: #92400E;
}

.attention-item-arrow {
  font-size: 18px;
  color: #9CA3AF;
  flex-shrink: 0;
  font-weight: 700;
}

/* Content Area */
.content {
  flex: 1;
  padding: 24px;
  /* p-6 */
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
    width: 256px;
    /* w-64 */
  }

  .main-content {
    margin-left: 0;
  }

  .sidebar.collapsed~.main-content {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-overlay {
    display: block;
  }

  .page-title {
    font-size: 18px;
    /* lg */
  }

  .profile-name {
    display: none;
  }

  .notifications-panel {
    right: 24px;
    /* px-6 */
    width: calc(100vw - 48px);
    max-width: 320px;
  }

  .attention-panel {
    right: 24px;
    width: calc(100vw - 48px);
    max-width: 360px;
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
