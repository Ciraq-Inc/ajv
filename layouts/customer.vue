<template>
  <div class="app-shell">
    <!-- Sidebar (desktop) -->
    <aside class="sidebar">
      <div class="sidebar-brand-wrap">
        <div class="sidebar-brand">
          <div class="brand-icon">
            <img :src="brandLogo" alt="MedsGH" class="brand-logo-image" />
          </div>
          <div class="brand-copy">
            <span class="brand-name">MedsGH</span>
            <span class="brand-tag">Customer portal</span>
          </div>
        </div>
        <div class="sidebar-highlight">
          <span class="highlight-label">Current View</span>
          <strong>{{ pageTitle }}</strong>
        </div>
      </div>
      <nav class="sidebar-nav">
        <p class="side-section-label">Workspace</p>
        <button @click="goTo('new')" class="side-btn accent" title="New Request">
          <PlusCircleIconSolid class="side-icon" />
          <span>New Request</span>
          <small>Create and send a new order request</small>
        </button>
        <div class="side-group">
          <button @click="goTo('home')" class="side-btn" :class="{ active: activeNav === 'home' }" title="Home">
            <component :is="activeNav === 'home' ? HomeIconSolid : HomeIcon" class="side-icon" />
            <span>Home</span>
          </button>
          <button @click="goTo('requests')" class="side-btn" :class="{ active: activeNav === 'requests' }" title="My Requests">
            <component :is="activeNav === 'requests' ? ClipDocListSolid : ClipDocList" class="side-icon" />
            <span>My Requests</span>
          </button>
          <button @click="goTo('wallet')" class="side-btn" :class="{ active: activeNav === 'wallet' }" title="Wallet">
            <component :is="activeNav === 'wallet' ? CreditCardSolid : CreditCardIcon" class="side-icon" />
            <span>Wallet</span>
          </button>
          <button @click="goTo('orders')" class="side-btn" :class="{ active: activeNav === 'orders' }" title="Orders">
            <component :is="activeNav === 'orders' ? ShoppingBagSolid : ShoppingBagIcon" class="side-icon" />
            <span>Orders</span>
          </button>
        </div>
        <div class="side-divider"></div>
        <p class="side-section-label">Account</p>
        <div class="side-group">
          <button @click="goTo('companies')" class="side-btn" :class="{ active: activeNav === 'companies' }" title="Pharmacies">
            <component :is="activeNav === 'companies' ? BuildingSolid : BuildingStorefrontIcon" class="side-icon" />
            <span>Pharmacies</span>
          </button>
          <button @click="goTo('profile')" class="side-btn" :class="{ active: activeNav === 'profile' }" title="Profile">
            <component :is="activeNav === 'profile' ? UserIconSolid : UserIcon" class="side-icon" />
            <span>Profile</span>
          </button>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar-sm">{{ displayUserInitials }}</div>
          <div class="user-meta">
            <span class="user-name-sm">{{ displayUserName }}</span>
            <span class="user-role-sm">Signed in customer</span>
            <span class="user-phone-sm">{{ displayUserPhone }}</span>
          </div>
        </div>
        <button @click="handleLogout" class="side-btn logout-btn" title="Log Out">
          <ArrowLeftOnRectangleIcon class="side-icon" /><span>Log Out</span>
        </button>
      </div>
    </aside>

    <div class="main-area">
      <header class="app-header">
        <div class="header-left">
          <button v-if="canGoBack" @click="goTo('home')" class="back-btn">
            <ChevronLeftIcon class="back-icon" />
          </button>
          <div v-if="showHeaderBrand" class="header-brand">
            <img :src="brandLogo" alt="MedsGH" class="header-brand-logo" />
            <span class="header-brand-name">MedsGH</span>
          </div>
          <h1 v-if="showPageTitle" class="header-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <button class="header-wallet-chip" @click="goTo('wallet')">
            <CreditCardSolid class="header-wallet-icon" />
            <span>GHS {{ walletBalance.toFixed(2) }}</span>
          </button>
          <button @click="toggleMenu" class="avatar-btn">
            <span class="avatar">{{ displayUserInitials }}</span>
          </button>
        </div>
      </header>

      <Transition name="slide-up">
        <div v-if="showMenu" class="sheet-overlay" @click="showMenu = false">
          <div class="sheet" @click.stop>
            <div class="sheet-handle"></div>
            <div class="sheet-profile">
              <div class="sheet-avatar">{{ displayUserInitials }}</div>
              <div>
                <p class="sheet-name">{{ displayUserName }}</p>
                <p class="sheet-phone">{{ displayUserPhone }}</p>
              </div>
            </div>
            <div class="sheet-actions">
              <button @click="showMenu = false; goTo('home')" class="sheet-item">
                <HomeIcon class="sheet-icon" /> Home
              </button>
              <button @click="showMenu = false; goTo('profile')" class="sheet-item">
                <Cog6ToothIcon class="sheet-icon" /> Edit Profile
              </button>
              <button @click="showMenu = false; goTo('companies')" class="sheet-item">
                <BuildingStorefrontIcon class="sheet-icon" /> Linked Pharmacies
              </button>
              <hr class="sheet-divider">
              <button @click="handleLogout" class="sheet-item danger">
                <ArrowLeftOnRectangleIcon class="sheet-icon" /> Log Out
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <main class="app-content">
        <slot />
      </main>

      <nav class="bottom-nav">
        <button @click="goTo('home')" class="nav-btn" :class="{ active: activeNav === 'home' }">
          <component :is="activeNav === 'home' ? HomeIconSolid : HomeIcon" class="nav-icon" /><span>Home</span>
        </button>
        <button @click="goTo('requests')" class="nav-btn" :class="{ active: activeNav === 'requests' }">
          <component :is="activeNav === 'requests' ? ClipDocListSolid : ClipDocList" class="nav-icon" />
          <span>Requests</span>
        </button>
        <button @click="goTo('new')" class="nav-fab">
          <PlusIcon class="fab-icon" />
        </button>
        <button @click="goTo('wallet')" class="nav-btn" :class="{ active: activeNav === 'wallet' }">
          <component :is="activeNav === 'wallet' ? CreditCardSolid : CreditCardIcon" class="nav-icon" />
          <span>Wallet</span>
        </button>
        <button @click="goTo('orders')" class="nav-btn" :class="{ active: activeNav === 'orders' }">
          <component :is="activeNav === 'orders' ? ShoppingBagSolid : ShoppingBagIcon" class="nav-icon" />
          <span>Orders</span>
        </button>
      </nav>
    </div>

    <ConfirmDialog
      :is-open="showLogoutConfirm"
      title="Log out?"
      message="You will be returned to the home page and will need to sign in again to continue."
      confirm-text="Log Out"
      cancel-text="Stay Here"
      variant="danger"
      @close="showLogoutConfirm = false"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import brandLogo from '~/assets/images/rigellogo.png'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'

import {
  HomeIcon, ClipboardDocumentListIcon as ClipDocList, CreditCardIcon,
  ShoppingBagIcon, BuildingStorefrontIcon, UserIcon, ChevronLeftIcon,
  PlusIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon
} from '@heroicons/vue/24/outline'

import {
  HomeIcon as HomeIconSolid, ClipboardDocumentListIcon as ClipDocListSolid,
  CreditCardIcon as CreditCardSolid, ShoppingBagIcon as ShoppingBagSolid,
  BuildingStorefrontIcon as BuildingSolid, UserIcon as UserIconSolid,
  PlusCircleIcon as PlusCircleIconSolid
} from '@heroicons/vue/24/solid'

const userStore = useUserStore()
const route = useRoute()
const showMenu = ref(false)
const showLogoutConfirm = ref(false)
const hasMounted = ref(false)
const walletBalance = useState('walletBalance', () => 0)

const userName = computed(() => {
  const u = userStore.currentUser
  return u ? `${u.fname || ''} ${u.lname || ''}`.trim() || 'Customer' : 'Customer'
})
const userInitials = computed(() => {
  const u = userStore.currentUser
  return u ? `${(u.fname || '')[0] || ''}${(u.lname || '')[0] || ''}`.toUpperCase() || 'C' : 'C'
})
const displayUserName = computed(() => hasMounted.value ? userName.value : 'Customer')
const displayUserInitials = computed(() => hasMounted.value ? userInitials.value : 'C')
const displayUserPhone = computed(() => hasMounted.value ? (userStore.currentUser?.phone || '') : '')
const activeNav = computed(() => route.query.tab || 'home')
const canGoBack = computed(() => route.query.tab && route.query.tab !== 'home')
const showHeaderBrand = computed(() => activeNav.value === 'home')
const showPageTitle = computed(() => activeNav.value !== 'home')
const pageTitle = computed(() => {
  const map = { home: 'Home', requests: 'My Requests', new: 'New Request', wallet: 'Wallet', orders: 'Order History', profile: 'Profile', companies: 'Pharmacies' }
  return map[route.query.tab] || 'Home'
})
const goTo = (tab) => navigateTo({ path: '/customer', query: { tab } })
const toggleMenu = () => { showMenu.value = !showMenu.value }
const handleLogout = () => {
  showMenu.value = false
  showLogoutConfirm.value = true
}
const confirmLogout = async () => {
  try {
    await userStore.logout()
    showLogoutConfirm.value = false
    navigateTo({ path: '/', query: { logged_out: Date.now().toString() } })
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  hasMounted.value = true
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(219, 234, 254, 0.55), transparent 24%),
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Sidebar */
.sidebar {
  display: none;
  width: 240px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 30%),
    linear-gradient(180deg, #ffffff, #f8fafc);
  border-right: 1px solid #e2e8f0;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
  padding: 18px 14px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.sidebar-brand-wrap {
  padding: 6px 8px 18px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #dbe5f0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.brand-logo-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-name {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.brand-tag {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.sidebar-highlight {
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
}

.highlight-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
}

.sidebar-highlight strong {
  display: block;
  font-size: 0.92rem;
  font-weight: 800;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.side-section-label {
  margin: 0;
  padding: 0 12px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #94a3b8;
}

.side-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.side-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s ease;
  width: 100%;
  text-align: left;
}

.side-btn span {
  flex: 1;
}

.side-btn small {
  display: block;
  margin-top: 3px;
  font-size: 0.72rem;
  line-height: 1.35;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
}

.side-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.side-btn:hover {
  background: #f8fafc;
  color: #334155;
  transform: translateX(1px);
}

.side-btn.active {
  background: linear-gradient(135deg, #eff6ff, #e0e7ff);
  color: #1d4ed8;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px #c7d2fe;
}

.side-btn.accent {
  display: block;
  text-align: left;
  padding: 14px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  color: white;
  font-weight: 700;
  margin: 0;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.18);
}

.side-btn.accent:hover {
  opacity: 0.96;
  transform: translateY(-1px);
}

.side-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 2px 8px;
}

.sidebar-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 14px;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
}

.avatar-sm {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-meta {
  min-width: 0;
}

.user-name-sm {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role-sm {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: #2563eb;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-phone-sm {
  display: block;
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 2px;
}

.logout-btn {
  color: #ef4444 !important;
  background: #fff !important;
  border: 1px solid #fee2e2 !important;
}

.logout-btn:hover {
  background: #fef2f2 !important;
  transform: none;
}

/* Main */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0;
}

/* Header */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 12px 12px 0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-brand-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.header-brand-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.back-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  padding: 4px;
}

.back-icon {
  width: 24px;
  height: 24px;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-wallet-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 20px;
  padding: 6px 12px 6px 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1d4ed8;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}

.header-wallet-chip:hover {
  background: rgba(37, 99, 235, 0.14);
  border-color: rgba(37, 99, 235, 0.3);
}

.header-wallet-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.avatar-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

/* Content */
.app-content {
  flex: 1;
  padding: 12px 0 94px 0;
  overflow-y: auto;
}

/* Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 22px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
  z-index: 99;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: all 0.2s;
  min-width: 56px;
}

.nav-btn span {
  font-size: 0.625rem;
  font-weight: 600;
  color: #a0a3bd;
  transition: color 0.2s;
}

.nav-icon {
  width: 22px;
  height: 22px;
  color: #a0a3bd;
  transition: color 0.2s;
}

.nav-btn.active .nav-icon {
  color: #667eea;
}

.nav-btn.active span {
  color: #667eea;
}

.nav-btn:active {
  transform: scale(0.92);
}

.nav-fab {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -16px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.2s;
}

.fab-icon {
  width: 24px;
  height: 24px;
}

.nav-fab:active {
  transform: scale(0.92) translateY(1px);
}

/* Sheet */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 12px 20px calc(20px + env(safe-area-inset-bottom, 0px));
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.sheet-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.sheet-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.sheet-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.sheet-phone {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 2px 0 0;
}

.sheet-actions {
  padding-top: 8px;
}

.sheet-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 8px;
  background: none;
  border: none;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s;
}

.sheet-item:active {
  background: #f3f4f6;
}

.sheet-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  flex-shrink: 0;
}

.sheet-item.danger {
  color: #ef4444;
}

.sheet-item.danger .sheet-icon {
  color: #ef4444;
}

.sheet-divider {
  border: none;
  border-top: 1px solid #f3f4f6;
  margin: 4px 0;
}

/* Transitions */
.slide-up-enter-active {
  transition: all 0.3s ease;
}

.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from .sheet {
  transform: translateY(100%);
}

.slide-up-leave-to .sheet {
  transform: translateY(100%);
}

.slide-up-enter-from {
  opacity: 0;
}

.slide-up-leave-to {
  opacity: 0;
}

@media (min-width: 768px) {
  .sidebar {
    display: flex;
    width: 92px;
    padding: 16px 10px;
  }

  .main-area {
    margin-left: 92px;
  }

  .bottom-nav {
    display: none;
  }

  .sheet-overlay {
    display: none !important;
  }

  .app-header {
    margin: 18px 24px 0;
    padding: 16px 20px;
  }

  .header-right {
    gap: 10px;
  }

  .header-title {
    font-size: 1.375rem;
  }

  .header-brand {
    display: none;
  }

  .sidebar-brand-wrap {
    padding: 4px 0 18px;
  }

  .sidebar-brand {
    justify-content: center;
    margin-bottom: 10px;
  }

  .brand-copy,
  .sidebar-highlight,
  .side-section-label,
  .side-btn span,
  .side-btn small,
  .user-meta {
    display: none;
  }

  .side-group {
    padding: 6px 4px;
  }

  .side-btn,
  .side-btn.accent,
  .logout-btn {
    justify-content: center;
    padding: 12px 10px;
  }

  .side-btn:hover {
    transform: translateY(-1px);
  }

  .sidebar-user {
    justify-content: center;
    padding: 10px;
  }

  .app-content {
    padding: 18px 0 0;
  }
}

@media (min-width: 1100px) {
  .sidebar {
    width: 260px;
    padding: 18px 14px;
  }

  .main-area {
    margin-left: 260px;
  }

  .sidebar-brand-wrap {
    padding: 6px 8px 18px;
  }

  .sidebar-brand {
    justify-content: flex-start;
    margin-bottom: 14px;
  }

  .brand-copy,
  .sidebar-highlight,
  .side-section-label,
  .side-btn span,
  .user-meta {
    display: block;
  }

  .side-btn small {
    display: block;
  }

  .side-group {
    padding: 6px;
  }

  .side-btn,
  .side-btn.accent,
  .logout-btn {
    justify-content: flex-start;
    padding: 11px 12px;
  }

  .side-btn.accent {
    padding: 14px 14px;
  }

  .sidebar-user {
    justify-content: flex-start;
    padding: 10px 12px 12px;
  }

  .app-header {
    margin: 24px 40px 0;
    padding: 18px 28px;
  }
}
</style>
