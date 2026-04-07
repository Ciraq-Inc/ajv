<template>
  <div v-if="isReady" class="onlineorders-layout">

    <!-- Sidebar -->
    <aside class="ol-sidebar" :class="{ 'ol-sidebar-collapsed': collapsed }">
      <!-- Header -->
      <div class="ol-sidebar-header">
        <div class="ol-brand" v-if="!collapsed">
          <span class="ol-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M9 7h6M9 12h6M9 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="ol-brand-text">Online Orders</span>
        </div>
        <span v-else class="ol-brand-icon ol-brand-icon-solo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M9 7h6M9 12h6M9 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <button class="ol-collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Collapse'">
          <svg v-if="collapsed" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- Admin info -->
      <div class="ol-admin-info" v-if="!collapsed">
        <div class="ol-admin-avatar">{{ adminInitials }}</div>
        <div class="ol-admin-details">
          <div class="ol-admin-name">{{ adminName }}</div>
          <div class="ol-admin-role">{{ adminRole }}</div>
        </div>
      </div>

      <!-- Nav section label -->
      <div class="ol-nav-section-title" v-if="!collapsed">Orders</div>

      <!-- Nav links -->
      <nav class="ol-nav">
        <NuxtLink to="/onlineorders" class="ol-nav-item" active-class="ol-nav-active" exact :title="collapsed ? `Order Requests${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}` : undefined">
          <span class="ol-nav-icon-wrap">
            <svg class="ol-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-if="pendingCount > 0" class="ol-nav-badge" :class="{ 'ol-nav-badge-dot': collapsed }">{{ collapsed ? '' : pendingCount }}</span>
          </span>
          <span v-if="!collapsed" class="ol-nav-text">Order Requests</span>
        </NuxtLink>

        <NuxtLink to="/onlineorders/deliveries" class="ol-nav-item" active-class="ol-nav-active" :title="collapsed ? 'Deliveries' : undefined">
          <svg class="ol-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/>
            <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span v-if="!collapsed" class="ol-nav-text">Deliveries</span>
        </NuxtLink>
      </nav>

      <!-- Footer actions -->
      <div class="ol-sidebar-footer">
        <button class="ol-footer-btn" @click="goToAdmin" :title="collapsed ? 'Admin Portal' : undefined">
          <svg class="ol-nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          <span v-if="!collapsed">Admin Portal</span>
        </button>
        <button class="ol-footer-btn ol-footer-logout" @click="handleLogout" :title="collapsed ? 'Logout' : undefined">
          <svg class="ol-nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-if="!collapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div v-if="!collapsed && isMobile" class="ol-mobile-overlay" @click="collapsed = true"></div>

    <!-- Main area -->
    <div class="ol-main">
      <!-- Topbar -->
      <header class="ol-topbar">
        <button class="ol-mobile-menu-btn" @click="collapsed = !collapsed">☰</button>
        <h1 class="ol-page-title">{{ pageTitle }}</h1>
      </header>
      <main class="ol-content">
        <slot />
      </main>
    </div>

  </div>
  <div v-else class="ol-loading">
    <div class="ol-loading-spinner"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { useRoute } from 'vue-router'

const adminStore = useAdminStore()
const route = useRoute()
const isReady = ref(false)
const collapsed = ref(false)
const isMobile = ref(false)

// Shared pending count — written by the page, read here
const pendingCount = useState('ol-pending-count', () => 0)

const adminName = computed(() => {
  if (adminStore.admin) {
    return `${adminStore.admin.fname || ''} ${adminStore.admin.lname || ''}`.trim() || 'Admin'
  }
  return 'Admin'
})

const adminInitials = computed(() => {
  if (adminStore.admin) {
    return `${adminStore.admin.fname?.charAt(0) || ''}${adminStore.admin.lname?.charAt(0) || ''}`.toUpperCase() || 'A'
  }
  return 'A'
})

const adminRole = computed(() => {
  return adminStore.admin?.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Admin'
})

const pageTitle = computed(() => {
  const path = route.path
  if (path.includes('/onlineorders/deliveries')) return 'Delivery Management'
  if (path.includes('/onlineorders')) return 'Order Requests'
  return 'Online Orders'
})

const goToAdmin = () => navigateTo('/admin/data')

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    adminStore.logout()
    navigateTo('/admin/login')
  }
}

const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth < 768
    collapsed.value = isMobile.value
  }
}

onMounted(async () => {
  if (process.client) {
    await adminStore.restoreSession()
    if (!adminStore.isAuthenticated) {
      localStorage.setItem('adminIntendedRoute', window.location.pathname)
      await navigateTo('/admin/login')
      return
    }
    await adminStore.verifyToken()
    if (!adminStore.isAuthenticated) {
      await navigateTo('/admin/login')
      return
    }
    checkMobile()
    const saved = localStorage.getItem('olSidebarCollapsed')
    if (saved !== null) collapsed.value = saved === 'true'
    window.addEventListener('resize', checkMobile)
  }
  isReady.value = true
})

onUnmounted(() => {
  if (process.client) window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* Layout shell */
.onlineorders-layout {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

/* Loading */
.ol-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}
.ol-loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e2e8f0;
  border-top-color: #520094;
  border-radius: 50%;
  animation: ol-spin 0.7s linear infinite;
}
@keyframes ol-spin { to { transform: rotate(360deg); } }

/* Sidebar */
.ol-sidebar {
  width: 220px;
  min-width: 220px;
  background: #1e1a22;
  display: flex;
  flex-direction: column;
  transition: width 0.2s, min-width 0.2s;
  position: relative;
  z-index: 200;
}
.ol-sidebar-collapsed {
  width: 56px;
  min-width: 56px;
}

/* Sidebar header */
.ol-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  height: 56px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}
.ol-brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  overflow: hidden;
}
.ol-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #520094;
  color: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}
.ol-brand-icon-solo {
  margin: 0 auto;
}
.ol-brand-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ol-collapse-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
  border: none;
  background: rgba(255,255,255,0.07);
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.15s;
}
.ol-collapse-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }

/* Admin info */
.ol-admin-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
  overflow: hidden;
}
.ol-admin-avatar {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #520094;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}
.ol-admin-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ol-admin-role {
  font-size: 0.72rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nav section title */
.ol-nav-section-title {
  padding: 0.85rem 1rem 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
}

/* Nav */
.ol-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 0.5rem;
  overflow-y: auto;
}
.ol-nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
}
.ol-nav-item:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
.ol-nav-active { background: rgba(82,0,148,0.45) !important; color: #e9d5ff !important; }
.ol-nav-icon { flex-shrink: 0; }
.ol-nav-text { overflow: hidden; text-overflow: ellipsis; }

.ol-nav-icon-wrap {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ol-nav-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 3px;
  background: #f97316;
  color: #fff;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 0 2px #1e1a22;
}
.ol-nav-badge-dot {
  min-width: 0.55rem;
  height: 0.55rem;
  padding: 0;
  top: -3px;
  right: -3px;
}

/* Footer */
.ol-sidebar-footer {
  border-top: 1px solid rgba(255,255,255,0.07);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ol-footer-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  text-align: left;
}
.ol-footer-btn:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
.ol-footer-logout:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }

/* Mobile overlay */
.ol-mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 150;
}

/* Main */
.ol-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* Topbar */
.ol-topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.ol-mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #475569;
  padding: 0.25rem;
}
.ol-page-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e1a22;
  margin: 0;
}

/* Content */
.ol-content {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

/* Mobile */
@media (max-width: 767px) {
  .ol-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
  }
  .ol-sidebar-collapsed {
    width: 0;
    min-width: 0;
    overflow: hidden;
  }
  .ol-main { width: 100%; }
  .ol-mobile-menu-btn { display: flex; }
}
</style>

