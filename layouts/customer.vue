<template>
  <div class="app-shell">
    <!-- Sidebar (desktop) -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <PlusCircleIconSolid class="brand-svg" />
        </div>
        <span class="brand-name">MedsGH</span>
      </div>
      <nav class="sidebar-nav">
        <button @click="goTo('home')" class="side-btn" :class="{ active: activeNav === 'home' }">
          <component :is="activeNav === 'home' ? HomeIconSolid : HomeIcon" class="side-icon" />
          <span>Home</span>
        </button>
        <button @click="goTo('new')" class="side-btn accent">
          <PlusCircleIconSolid class="side-icon" />
          <span>New Request</span>
        </button>
        <button @click="goTo('requests')" class="side-btn" :class="{ active: activeNav === 'requests' }">
          <component :is="activeNav === 'requests' ? ClipDocListSolid : ClipDocList" class="side-icon" />
          <span>My Requests</span>
        </button>
        <button @click="goTo('wallet')" class="side-btn" :class="{ active: activeNav === 'wallet' }">
          <component :is="activeNav === 'wallet' ? CreditCardSolid : CreditCardIcon" class="side-icon" />
          <span>Wallet</span>
        </button>
        <button @click="goTo('orders')" class="side-btn" :class="{ active: activeNav === 'orders' }">
          <component :is="activeNav === 'orders' ? ShoppingBagSolid : ShoppingBagIcon" class="side-icon" />
          <span>Orders</span>
        </button>
        <div class="side-divider"></div>
        <button @click="goTo('companies')" class="side-btn" :class="{ active: activeNav === 'companies' }">
          <component :is="activeNav === 'companies' ? BuildingSolid : BuildingStorefrontIcon" class="side-icon" />
          <span>Pharmacies</span>
        </button>
        <button @click="goTo('profile')" class="side-btn" :class="{ active: activeNav === 'profile' }">
          <component :is="activeNav === 'profile' ? UserIconSolid : UserIcon" class="side-icon" />
          <span>Profile</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar-sm">{{ userInitials }}</div>
          <div class="user-meta">
            <span class="user-name-sm">{{ userName }}</span>
            <span class="user-phone-sm">{{ userStore.currentUser?.phone || '' }}</span>
          </div>
        </div>
        <button @click="handleLogout" class="side-btn logout-btn">
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
          <h1 class="header-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <button @click="toggleMenu" class="avatar-btn">
            <span class="avatar">{{ userInitials }}</span>
          </button>
        </div>
      </header>

      <Transition name="slide-up">
        <div v-if="showMenu" class="sheet-overlay" @click="showMenu = false">
          <div class="sheet" @click.stop>
            <div class="sheet-handle"></div>
            <div class="sheet-profile">
              <div class="sheet-avatar">{{ userInitials }}</div>
              <div>
                <p class="sheet-name">{{ userName }}</p>
                <p class="sheet-phone">{{ userStore.currentUser?.phone || '' }}</p>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const userName = computed(() => {
  const u = userStore.currentUser
  return u ? `${u.fname || ''} ${u.lname || ''}`.trim() || 'Customer' : 'Customer'
})
const userInitials = computed(() => {
  const u = userStore.currentUser
  return u ? `${(u.fname || '')[0] || ''}${(u.lname || '')[0] || ''}`.toUpperCase() || 'C' : 'C'
})
const activeNav = computed(() => route.query.tab || 'home')
const canGoBack = computed(() => route.query.tab && route.query.tab !== 'home')
const pageTitle = computed(() => {
  const map = { requests: 'My Requests', new: 'New Request', wallet: 'Wallet', orders: 'Order History', profile: 'Profile', companies: 'Pharmacies' }
  return map[route.query.tab] || 'MedsGH'
})
const goTo = (tab) => navigateTo({ path: '/customer', query: { tab } })
const toggleMenu = () => { showMenu.value = !showMenu.value }
const handleLogout = async () => {
  if (confirm('Log out?')) {
    try { await userStore.logout(); navigateTo('/') } catch (e) { console.error(e) }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  background: #f8f9fc;
  display: flex;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Sidebar */
.sidebar {
  display: none;
  width: 240px;
  background: white;
  border-right: 1px solid #eef0f4;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
  padding: 20px 12px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 20px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand-svg {
  width: 20px;
  height: 20px;
}

.brand-name {
  font-size: 1.125rem;
  font-weight: 800;
  color: #1a1a2e;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  text-align: left;
}

.side-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.side-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.side-btn.active {
  background: #eef2ff;
  color: #667eea;
  font-weight: 600;
}

.side-btn.accent {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  margin: 4px 0 8px;
}

.side-btn.accent:hover {
  opacity: 0.9;
}

.side-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 8px 14px;
}

.sidebar-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 10px;
}

.avatar-sm {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
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
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-phone-sm {
  display: block;
  font-size: 0.6875rem;
  color: #94a3b8;
}

.logout-btn {
  color: #ef4444 !important;
}

.logout-btn:hover {
  background: #fef2f2 !important;
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
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(248, 249, 252, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
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
  padding: 0 0 88px 0;
  overflow-y: auto;
}

/* Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
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
  }

  .main-area {
    margin-left: 240px;
  }

  .bottom-nav {
    display: none;
  }

  .sheet-overlay {
    display: none !important;
  }

  .app-header {
    padding: 16px 32px;
  }

  .header-right {
    display: none;
  }

  .header-title {
    font-size: 1.375rem;
  }

  .app-content {
    padding: 0;
  }
}

@media (min-width: 1200px) {
  .sidebar {
    width: 260px;
  }

  .main-area {
    margin-left: 260px;
  }

  .app-header {
    padding: 18px 40px;
  }
}
</style>