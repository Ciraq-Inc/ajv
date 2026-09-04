<template>
  <div class="company-layout" :style="themeVars">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- Mobile Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed, 'sidebar-open': mobileMenuOpen }">
      <!-- Logo/Header -->
      <div class="sidebar-header">
        <div class="company-brand">
          <div class="company-logo">
            <img src="/brand/rig-mark.svg" alt="Rigel" class="logo-icon" />
          </div>
          <div v-if="!sidebarCollapsed" class="company-info">
            <span class="logo-text">Rigel Portal</span>
          </div>
        </div>

        <button @click="toggleSidebar" class="toggle-btn"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <ChevronRightIcon v-if="sidebarCollapsed" class="h-5 w-5" />
          <ChevronLeftIcon v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- Company user identity -->
      <div v-if="!sidebarCollapsed" class="admin-info">
        <div class="admin-avatar">
          {{ companyUserInitials }}
        </div>
        <div class="admin-details">
          <div class="admin-name">{{ companyUserName }}</div>
          <div class="admin-role">{{ companyUserRole }}</div>
        </div>
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
          >
            <component :is="item.icon" class="nav-icon" aria-hidden="true" />
            <span :class="sidebarCollapsed ? 'sr-only' : 'nav-label'">{{ item.label }}</span>
            <span v-if="!sidebarCollapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button @click="logoutConfirmOpen = true" class="logout-btn" :disabled="isLoggingOut">
          <ArrowPathIcon v-if="isLoggingOut" class="h-4 w-4 animate-spin" />
          <ArrowLeftOnRectangleIcon v-else class="h-4 w-4" />
          <span :class="sidebarCollapsed ? 'sr-only' : 'nav-label'">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <button
        @click="toggleMobileMenu"
        class="floating-menu-btn"
        aria-label="Open navigation menu"
      >
        <Bars3Icon class="h-5 w-5" />
      </button>

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

    <UiDialog v-model:open="logoutConfirmOpen">
      <UiDialogContent class="rounded-2xl border-slate-200 sm:max-w-[420px]">
        <UiDialogHeader>
          <UiDialogTitle class="text-base font-semibold text-slate-950">Sign out?</UiDialogTitle>
          <UiDialogDescription class="text-sm leading-6 text-slate-600">You will need to sign in again to access this pharmacy workspace.</UiDialogDescription>
        </UiDialogHeader>
        <UiDialogFooter class="gap-2 sm:justify-end">
          <button type="button" class="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700" @click="logoutConfirmOpen = false">Cancel</button>
          <button type="button" class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="isLoggingOut" @click="handleLogout">
            {{ isLoggingOut ? 'Signing out...' : 'Sign out' }}
          </button>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import { useApi } from '~/composables/useApi'
import {
  SwatchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftIcon,
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
  CodeBracketIcon,
  WalletIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()

const THEME_PRESETS = {
  indigo:  { sidebar: '#2A1130', sidebarGradient: 'linear-gradient(180deg, #2A1130 0%, #1A0B20 100%)', activeBg: '#5A2468', activeBorder: '#C073A7', accent: '#5A2468', soft: '#faf5fb', softBorder: '#e8d5eb', avatarGrad: 'linear-gradient(135deg,#C073A7,#5A2468)' },
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
    '--ls-sidebar-gradient': t.sidebarGradient || t.sidebar,
    '--ls-active-bg':      t.activeBg,
    '--ls-active-border':  t.activeBorder,
    '--ls-accent':         t.accent,
    '--ls-soft':           t.soft,
    '--ls-soft-border':    t.softBorder,
    '--ls-avatar-grad':    t.avatarGrad,
  }
})

const sidebarCollapsed = ref(false)
const isLoggingOut = ref(false)
const mobileMenuOpen = ref(false)
const logoutConfirmOpen = ref(false)

// Get company domain from route
const companyDomain = computed(() => {
  const pathMatch = route.path.match(/\/([^\/]+)\/services/)
  return pathMatch ? pathMatch[1] : 'company'
})

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
const companyUserName = computed(() => companyStore.userName || 'User')
const companyUserRole = computed(() =>
  String(companyStore.userRole || 'staff')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()),
)
const companyUserInitials = computed(() => {
  const parts = companyUserName.value.split(/\s+/).filter(Boolean)
  return (parts.length > 1
    ? `${parts[0]?.charAt(0)}${parts[parts.length - 1]?.charAt(0)}`
    : parts[0]?.slice(0, 2) || 'U').toUpperCase()
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
        label: 'Earnings',
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
        path: servicePath('sms-history'),
        label: 'History',
        icon: ClockIcon,
      },
    ],
  },
  {
    title: 'Wallet',
    items: [
      {
        path: servicePath('sms-billing'),
        label: 'Wallet',
        icon: CreditCardIcon,
      },
    ],
  },
  {
    title: 'Accounts',
    items: [
      {
        path: servicePath('accounts'),
        label: 'Accounts',
        icon: WalletIcon,
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
      {
        path: servicePath('developers'),
        label: 'Developers',
        icon: CodeBracketIcon,
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
    logoutConfirmOpen.value = false
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
  min-height: 100vh;
  background: #F9FAFB;
}

/* Sidebar */
.sidebar {
  width: 256px;
  background: var(--ls-sidebar-gradient, var(--ls-sidebar, #2A1130));
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  transition: all 0.2s ease;
  z-index: 1000;
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-collapsed .sidebar-header {
  padding: 16px;
}

.admin-info {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-avatar {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  background: var(--ls-avatar-grad, linear-gradient(135deg, #C073A7 0%, #5A2468 100%));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}

.admin-details {
  text-align: left;
}

.admin-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.admin-role {
  font-size: 12px;
  color: #9CA3AF;
  text-transform: capitalize;
}

.company-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-logo {
  flex-shrink: 0;
}

.logo-icon {
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section:last-child {
  margin-bottom: 0;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748B;
  padding: 0 16px 8px;
  letter-spacing: 0.5px;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  color: #CBD5E1;
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 8px;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 8px 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.router-link-active {
  background: var(--ls-active-bg, rgba(255, 255, 255, 0.14));
  color: white;
  border-left: 2px solid var(--ls-active-border, rgba(255, 255, 255, 0.6));
}

.nav-icon {
  font-size: 18px;
  min-width: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  margin-left: auto;
  background: #EF4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
}

/* Sidebar Footer */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 0;
  background: transparent;
  border: none;
  color: #EF4444;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
}

.logout-btn:hover {
  color: #DC2626;
  background: rgba(239, 68, 68, 0.1);
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 256px;
  transition: margin-left 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0;
  position: relative;
}

.sidebar-collapsed ~ .main-content {
  margin-left: 70px;
}

/* Page Content */
.page-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 2rem;
  background: var(--ls-soft, #f8fafc);
  min-height: 100%;
}

.floating-menu-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 120;
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  color: #3f3f46;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(10px);
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

/* Responsive */
@media (max-width: 1024px) {
  .mobile-overlay {
    display: block;
  }

  .floating-menu-btn {
    display: flex;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    width: 256px;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar.sidebar-collapsed {
    width: 256px;
    background: var(--ls-sidebar-gradient, var(--ls-sidebar, #2A1130));
  }

  .main-content {
    margin-left: 0;
    width: 100%;
  }

  .page-content {
    padding: 4.5rem 1rem 1rem;
  }

  .toggle-btn {
    display: none;
  }
}

@media (max-width: 640px) {
  .page-content {
    padding: 4.25rem 0.75rem 0.75rem;
  }

  .sidebar {
    width: 85vw;
    max-width: 320px;
  }
}

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
