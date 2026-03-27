<template>
  <div v-if="isReady" class="dataconsumer-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': !isSidebarExpanded }">
      <!-- Logo & Collapse Button -->
      <div class="sidebar-header">
        <div class="logo-section">
          <BuildingOfficeIcon class="logo-icon" />
          <span v-if="isSidebarExpanded" class="logo-text">Rigel</span>
        </div>
        <button @click="toggleSidebar" class="collapse-btn" :title="isSidebarExpanded ? 'Collapse' : 'Expand'">
          <ChevronLeftIcon class="collapse-icon" :class="{ 'rotate-180': !isSidebarExpanded }" />
        </button>
      </div>

      <!-- User Info Section -->
      <div class="user-section">
        <div class="user-avatar">
          <span>{{ adminInitials }}</span>
        </div>
        <div v-if="isSidebarExpanded" class="user-info">
          <p class="user-name">{{ adminName }}</p>
          <p class="user-role">Data Consumer</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <!-- Reports Section -->
        <div class="nav-section">
          <p v-if="isSidebarExpanded" class="section-title">Reports</p>
          
          <NuxtLink to="/dataconsumer/dashboard" class="nav-item" active-class="active">
            <HomeIcon class="nav-icon" />
            <span v-if="isSidebarExpanded" class="nav-label">Dashboard</span>
          </NuxtLink>

          <NuxtLink to="/dataconsumer/sales-reports" class="nav-item" active-class="active">
            <ChartBarIcon class="nav-icon" />
            <span v-if="isSidebarExpanded" class="nav-label">Sales Reports</span>
          </NuxtLink>

          <NuxtLink to="/dataconsumer/purchase-reports" class="nav-item" active-class="active">
            <DocumentChartBarIcon class="nav-icon" />
            <span v-if="isSidebarExpanded" class="nav-label">Purchase Reports</span>
          </NuxtLink>
        </div>

        <!-- Account Section -->
        <div class="nav-section account-section">
          <p v-if="isSidebarExpanded" class="section-title">Account</p>

          <NuxtLink to="/dataconsumer/profile" class="nav-item" active-class="active">
            <UserIcon class="nav-icon" />
            <span v-if="isSidebarExpanded" class="nav-label">Profile</span>
          </NuxtLink>

          <button @click="handleLogout" class="nav-item logout-btn">
            <ArrowRightOnRectangleIcon class="nav-icon" />
            <span v-if="isSidebarExpanded" class="nav-label">Logout</span>
          </button>
        </div>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <!-- Top Navbar -->
      <header class="navbar">
        <div class="navbar-content">
          <h1 class="page-title">Data Consumer Portal</h1>
          <div class="navbar-spacer"></div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="main-content">
        <div class="content-container">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  UserIcon,
  ChevronLeftIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
} from '@heroicons/vue/24/outline';
import { useAdminStore } from '~/stores/admin';

const adminStore = useAdminStore();
const router = useRouter();

// State
const isReady = ref(false);
const isSidebarExpanded = ref(true);

// Computed
const adminName = computed(() => {
  const admin = adminStore.getAdmin;
  if (admin) {
    return `${admin.fname} ${admin.lname}`;
  }
  return 'Data Consumer';
});

const adminInitials = computed(() => {
  const admin = adminStore.getAdmin;
  if (admin) {
    return `${admin.fname?.charAt(0) || ''}${admin.lname?.charAt(0) || ''}`.toUpperCase();
  }
  return 'DC';
});

// Methods
const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value;
};

const handleLogout = async () => {
  adminStore.logout();
  navigateTo('/admin/login');
};

// Lifecycle
onMounted(() => {
  isReady.value = true;
  
  // Auto-collapse sidebar on mobile
  if (window.innerWidth < 768) {
    isSidebarExpanded.value = false;
  }
});

// Handle window resize
if (process.client) {
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      isSidebarExpanded.value = false;
    }
  });
}
</script>

<style scoped>
/* Layout Structure */
.dataconsumer-layout {
  display: flex;
  height: 100vh;
  background: #f8fafc;
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 200;
}

.sidebar-collapsed {
  width: 80px;
}

/* Sidebar Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid #e2e8f0;
  gap: 8px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #6366f1;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.collapse-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.collapse-icon.rotate-180 {
  transform: rotate(180deg);
}

/* User Section */
.user-section {
  padding: 16px 12px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Sidebar Navigation */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-section.account-section {
  margin-top: auto;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0 0 8px 0;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

/* Navigation Items */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item.active {
  background: #eef2ff;
  color: #6366f1;
  font-weight: 600;
}

.nav-item.logout-btn {
  width: 100%;
  justify-content: flex-start;
}

.nav-item.logout-btn:hover {
  background: #fee2e2;
  color: #991b1b;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  text-overflow: ellipsis;
  overflow: hidden;
}

/* Main Wrapper */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  transition: margin-left 0.3s ease;
}

.sidebar-collapsed ~ .main-wrapper {
  margin-left: 80px;
}

/* Navbar */
.navbar {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.navbar-spacer {
  flex: 1;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    transform: translateX(0);
  }

  .sidebar-collapsed {
    width: 100%;
  }

  .main-wrapper {
    margin-left: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 300;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .navbar {
    padding: 12px 16px;
  }

  .navbar-content {
    padding: 12px 16px;
  }

  .page-title {
    font-size: 18px;
  }

  .main-content {
    padding: 16px;
  }

  .content-container {
    padding: 0;
  }
}

@media (max-width: 640px) {
  .navbar-content {
    gap: 12px;
  }

  .page-title {
    font-size: 16px;
  }

  .main-content {
    padding: 12px;
  }

  .sidebar-header {
    padding: 12px;
  }

  .user-section {
    padding: 12px;
  }

  .sidebar-nav {
    padding: 8px;
  }
}
</style>
