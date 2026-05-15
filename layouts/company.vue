<template>
  <div class="company-layout" :style="themeVars">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- Mobile Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-open': mobileMenuOpen }">
      <!-- Logo/Header -->
      <div class="sidebar-header">
        <div class="flex items-center gap-3" :class="{ 'justify-center': sidebarCollapsed }">
          <div class="company-logo">
            <img src="/brand/rig-mark.svg" alt="Rigel" class="w-8 h-8" />
          </div>
          <div v-if="!sidebarCollapsed" class="company-info">
            <p class="text-xs font-bold tracking-widest uppercase" style="color: rgba(255,255,255,0.55);">Services Portal</p>
          </div>
        </div>
      </div>

      <!-- Toggle Button (Always Visible) -->
      <div class="toggle-btn-container">
        <button @click="toggleSidebar" class="toggle-btn"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <ChevronRightIcon v-if="sidebarCollapsed" class="h-5 w-5" />
          <ChevronLeftIcon v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" aria-label="Company navigation">
        <div v-for="section in navigationSections" :key="section.title" class="nav-section">
          <p v-if="!sidebarCollapsed" class="nav-section-title">{{ section.title }}</p>

          <NuxtLink
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :title="sidebarCollapsed ? item.label : ''"
          >
            <component :is="item.icon" class="nav-icon" />
            <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="!sidebarCollapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Sidebar Footer (User Info) -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <UserIcon class="h-5 w-5" style="color: rgba(255,255,255,0.8);" />
          </div>
          <div v-if="!sidebarCollapsed" class="user-details">
            <p class="user-name">{{ userName }}</p>
            <p class="user-role">{{ userRole }}</p>
          </div>
        </div>
        <button v-if="!sidebarCollapsed" @click="handleLogout" class="logout-btn" :disabled="isLoggingOut">
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
          <!-- Mobile Menu Toggle -->
          <button @click="toggleMobileMenu" class="mobile-menu-btn">
            <Bars3Icon class="h-6 w-6" />
          </button>
          <!-- <h1 class="page-title">{{ pageTitle }}</h1> -->
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
              <div class="user-menu-avatar">{{ userName.charAt(0).toUpperCase() }}</div>
              <span class="user-menu-text">{{ userName }}</span>
              <ChevronDownIcon class="h-4 w-4 user-menu-chevron" />
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
              <hr class="my-2 border-[#ede0f7]" />
              <button @click="handleLogout" class="menu-item text-red-600">
                <ArrowLeftOnRectangleIcon class="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Hours-not-confirmed nudge -->
      <div v-if="showHoursNudge" class="hours-nudge">
        <ClockIcon class="hours-nudge-icon" />
        <div class="hours-nudge-text">
          <p class="hours-nudge-title">Set your store hours</p>
          <p class="hours-nudge-body">Customers can't request pickup until your weekly hours are confirmed.</p>
        </div>
        <NuxtLink :to="servicePath('store-hours')" class="hours-nudge-cta">
          Set hours
        </NuxtLink>
      </div>

      <!-- Page Content -->
      <main id="main-content" tabindex="-1" class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import { useApi } from '~/composables/useApi'
import {
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  SwatchIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftIcon,
  BoltIcon,
  CreditCardIcon,
  ArrowPathIcon,
  UserGroupIcon,
  BriefcaseIcon,
  Bars3Icon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

const THEME_PRESETS = {
  indigo:  { sidebar: '#1e1b4b', activeBg: 'rgba(99,102,241,0.18)',  activeBorder: '#818cf8', accent: '#6366f1', soft: '#eef2ff', softBorder: '#c7d2fe', avatarGrad: 'linear-gradient(135deg,#4338ca,#312e81)' },
  teal:    { sidebar: '#042f2e', activeBg: 'rgba(20,184,166,0.18)',   activeBorder: '#2dd4bf', accent: '#0d9488', soft: '#f0fdfa', softBorder: '#99f6e4', avatarGrad: 'linear-gradient(135deg,#0f766e,#042f2e)' },
  rose:    { sidebar: '#4c0519', activeBg: 'rgba(244,63,94,0.18)',    activeBorder: '#fb7185', accent: '#e11d48', soft: '#fff1f2', softBorder: '#fecdd3', avatarGrad: 'linear-gradient(135deg,#be123c,#4c0519)' },
  emerald: { sidebar: '#022c22', activeBg: 'rgba(52,211,153,0.18)',   activeBorder: '#34d399', accent: '#059669', soft: '#ecfdf5', softBorder: '#a7f3d0', avatarGrad: 'linear-gradient(135deg,#047857,#022c22)' },
  orange:  { sidebar: '#431407', activeBg: 'rgba(251,146,60,0.18)',   activeBorder: '#fb923c', accent: '#ea580c', soft: '#fff7ed', softBorder: '#fed7aa', avatarGrad: 'linear-gradient(135deg,#c2410c,#431407)' },
  slate:   { sidebar: '#0f172a', activeBg: 'rgba(100,116,139,0.22)',  activeBorder: '#94a3b8', accent: '#475569', soft: '#f8fafc', softBorder: '#e2e8f0', avatarGrad: 'linear-gradient(135deg,#334155,#0f172a)' },
}

const themeVars = computed(() => {
  const company = companyStore.currentCompany
  const preset = company?.theme_preset || 'indigo'
  let t = THEME_PRESETS[preset] || THEME_PRESETS.indigo

  if (preset === 'custom' && company?.theme_color) {
    const c = company.theme_color
    t = { sidebar: '#0f172a', activeBg: `${c}2e`, activeBorder: c, accent: c, soft: `${c}14`, softBorder: `${c}40`, avatarGrad: `linear-gradient(135deg,${c},#0f172a)` }
  }

  return {
    '--ls-sidebar':        t.sidebar,
    '--ls-active-bg':      t.activeBg,
    '--ls-active-border':  t.activeBorder,
    '--ls-accent':         t.accent,
    '--ls-soft':           t.soft,
    '--ls-soft-border':    t.softBorder,
    '--ls-avatar-grad':    t.avatarGrad,
  }
})

const sidebarCollapsed = ref(false)
const showUserMenu = ref(false)
const isLoggingOut = ref(false)
const mobileMenuOpen = ref(false)

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
const normalizedRole = computed(() =>
  String(companyStore.userRole || 'user')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
)
const companyName = computed(() => companyStore.currentCompany?.name || 'Company')

// Page title from route meta or default
const pageTitle = computed(() => {
  return route.meta.title || route.name || 'Dashboard'
})

// Navigation items
const servicePath = (slug = '') => {
  return slug
    ? `/${companyDomain.value}/services/${slug}`
    : `/${companyDomain.value}/services`
}

const allNavigationSections = computed(() => [
  {
    title: 'Orders & Deliveries',
    items: [
      {
        path: servicePath('orders'),
        label: 'Order Requests',
        icon: ClipboardDocumentListIcon,
      },
      {
        path: servicePath('deliveries'),
        label: 'Deliveries',
        icon: TruckIcon,
      },
      {
        path: servicePath('riders'),
        label: 'Fleet',
        icon: TruckIcon,
      },
      {
        path: servicePath('wallet'),
        label: 'Wallet',
        icon: BanknotesIcon,
      },
    ],
  },
  {
    title: 'SMS',
    items: [
      {
        path: servicePath('sms-campaigns'),
        label: 'SMS Campaigns',
        icon: ChatBubbleLeftIcon,
      },
      {
        path: servicePath('sms-credits'),
        label: 'SMS Credits',
        icon: BoltIcon,
      },
    ],
  },
  {
    title: 'Billing',
    items: [
      {
        path: servicePath('sms-billing'),
        label: 'Billing',
        icon: CreditCardIcon,
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        path: servicePath('monthly-reports'),
        label: 'Monthly Reports',
        icon: PresentationChartLineIcon,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        path: servicePath('user-access'),
        label: 'User Access',
        icon: UserGroupIcon,
      },
      {
        path: servicePath('store-settings'),
        label: 'Shopfront',
        icon: SwatchIcon,
      },
      {
        path: servicePath('store-hours'),
        label: 'Store Hours',
        icon: ClockIcon,
      },
    ],
  },
  {
    title: 'Hiring',
    items: [
      {
        path: servicePath('rigel-boards'),
        label: 'Rigel Boards',
        icon: BriefcaseIcon,
      },
    ],
  },
])

const navigationSections = computed(() => {
  if (normalizedRole.value !== 'third_party_poster') {
    return allNavigationSections.value
  }

  return allNavigationSections.value
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        return (
          item.path.endsWith('/services/rigel-boards') ||
          item.path.endsWith('/services/sms-billing')
        )
      }),
    }))
    .filter((section) => section.items.length > 0)
})

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

// Toggle mobile menu
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// Close mobile menu
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
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

// Load saved sidebar state and theme
onMounted(async () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('companySidebarCollapsed')
    if (saved) {
      sidebarCollapsed.value = saved === 'true'
    }
  }

  // Fetch store settings to apply the correct theme preset
  await companyStore.fetchTheme()

  // Close user menu when clicking outside
  if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.user-menu')) {
        showUserMenu.value = false
      }
    })
  }
})

// Watch for mobile menu changes to handle body scroll
watch(mobileMenuOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Close mobile menu on navigation
import { watchEffect } from 'vue'
watchEffect(() => {
  route.path // trigger on route change
  closeMobileMenu()
})

// Hours-not-confirmed nudge
const hoursConfirmed = ref(true) // optimistic: hide until we know otherwise
const api = useApi()

const isOnHoursPage = computed(() => route.path.endsWith('/services/store-hours'))

const showHoursNudge = computed(() => {
  if (!companyStore.isLoggedIn) return false
  if (isOnHoursPage.value) return false
  return hoursConfirmed.value === false
})

const refreshHoursStatus = async () => {
  if (!companyStore.isLoggedIn) return
  try {
    const response = await api.get('/api/pharmacy-portal/hours')
    const data = response.data || response
    hoursConfirmed.value = Boolean(data?.hours_confirmed_at)
  } catch (error) {
    // Silent: a transient error shouldn't spam a banner the user can't act on
    console.warn('Failed to fetch hours status', error)
  }
}

onMounted(refreshHoursStatus)
watch(() => route.path, refreshHoursStatus)
</script>

<style scoped>
.company-layout {
  display: flex;
  height: 100vh;
  background: var(--bg, #f4f4f5);
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: var(--ls-sidebar, #1e1b4b);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
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
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.sidebar-collapsed .toggle-btn-container {
  padding: 0.5rem;
}

.company-logo {
  min-width: 40px;
  height: 40px;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-info h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-info p {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.55);
  margin: 0;
}

.toggle-btn {
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: rgba(255,255,255,0.08);
  color: white;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 1rem;
}

.nav-section:last-child {
  margin-bottom: 0;
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  margin: 0 0 0.5rem 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  position: relative;
  border-left: 3px solid transparent;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
  border-left: none;
}

.nav-item:hover {
  background: rgba(255,255,255,0.07);
  color: white;
}

.nav-item.router-link-active {
  background: var(--ls-active-bg);
  color: white;
  font-weight: 600;
  border-left-color: var(--ls-active-border);
  padding-left: calc(1rem - 3px);
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
  border-top: 1px solid rgba(255,255,255,0.1);
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
  background: rgba(255,255,255,0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.8);
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

.user-role {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.55);
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
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent;
  color: rgba(255,255,255,0.7);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(220,38,38,0.15);
  border-color: rgba(248,113,113,0.4);
  color: #f87171;
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
  border-bottom: 1px solid var(--ls-soft-border);
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
  background: var(--ls-soft);
  color: var(--ls-accent);
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  border-radius: 8px;
  border: 1px solid var(--ls-soft-border);
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-btn:hover {
  background: var(--ls-soft);
  border-color: var(--ls-soft-border);
}

.user-menu-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ls-avatar-grad);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-menu-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  min-width: 200px;
  background: white;
  border: 1px solid var(--ls-soft-border);
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
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
  background: var(--ls-soft);
}

/* Page Content */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: var(--ls-soft, #f8fafc);
  min-height: 100%;
}

/* Hours-not-confirmed nudge */
.hours-nudge {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.5rem;
  background: #fef3c7;
  border-bottom: 1px solid #fde68a;
  color: #78350f;
}

.hours-nudge-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.hours-nudge-text {
  flex: 1;
  min-width: 0;
}

.hours-nudge-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.hours-nudge-body {
  font-size: 0.8125rem;
  margin: 0.125rem 0 0;
  color: #92400e;
}

.hours-nudge-cta {
  flex-shrink: 0;
  padding: 0.5rem 0.875rem;
  border-radius: 0.625rem;
  background: #78350f;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}

.hours-nudge-cta:hover {
  background: #451a03;
}

@media (max-width: 640px) {
  .hours-nudge {
    flex-wrap: wrap;
    padding: 0.75rem 1rem;
  }
  .hours-nudge-text {
    flex-basis: 100%;
  }
  .hours-nudge-cta {
    margin-left: auto;
  }
}

/* Mobile Overlay */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 39;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.mobile-menu-btn:hover {
  background: var(--ls-soft);
  color: var(--ls-accent);
}

/* Responsive */
@media (max-width: 1024px) {
  .mobile-overlay {
    display: block;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    width: 280px;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar.sidebar-collapsed {
    width: 280px;
    background: var(--ls-sidebar, #1e1b4b);
  }

  .main-content {
    margin-left: 0;
    width: 100%;
  }

  .top-bar {
    padding: 1rem;
  }

  .page-content {
    padding: 1rem;
  }

  .user-menu-text,
  .user-menu-chevron {
    display: none;
  }

  .user-menu-btn {
    padding: 0.5rem;
    border: none;
  }

  .page-title {
    font-size: 1.25rem;
  }

  /* Hide desktop toggle in mobile view */
  .toggle-btn-container {
    display: none;
  }
}

@media (max-width: 640px) {
  .top-bar {
    padding: 0.75rem;
  }

  .page-content {
    padding: 0.75rem;
  }

  .icon-btn span {
    display: none;
  }

  .sidebar {
    width: 85vw;
    max-width: 320px;
  }
}
</style>
