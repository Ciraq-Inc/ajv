<template>
  <div class="customer-dashboard">
    <!-- Loading State -->
    <div v-if="isCheckingAuth" class="auth-loading">
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <p>Loading...</p>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1>Welcome back, {{ userStore.currentUser?.fname }}!</h1>
          <p>Manage your profile, orders, and linked companies</p>
        </div>
        <div class="company-badge" v-if="userStore.currentCompany">
          <svg xmlns="http://www.w3.org/2000/svg" class="company-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <div class="company-info">
            <span class="company-label">Active Company</span>
            <span class="company-name">{{ userStore.currentCompany.company_name }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-header">
        <h2 class="stats-title">Quick Stats</h2>
        <button @click="refreshStats" :disabled="isLoadingStats" class="refresh-button">
          <svg v-if="!isLoadingStats" xmlns="http://www.w3.org/2000/svg" class="refresh-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="spinner refresh-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="!isLoadingStats">Refresh</span>
          <span v-else>Loading...</span>
        </button>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Orders</h3>
            <p class="stat-value">{{ userStore.totalOrders }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <h3>Total Spent</h3>
            <p class="stat-value">GHS{{ formatTotalSpent(userStore.totalSpent) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="stat-content">
            <h3>Linked Companies</h3>
            <p class="stat-value">{{ userStore.linkedCompanies }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }" class="tab-button">
          <component :is="tab.icon" class="tab-icon" />
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="tab-panel">
          <Profile />
        </div>

        <!-- Orders Tab -->
        <div v-if="activeTab === 'orders'" class="tab-panel">
          <Orders />
        </div>

        <!-- Linked Companies Tab -->
        <div v-if="activeTab === 'companies'" class="tab-panel">
          <LinkedCompanies />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import { useUserStore } from '~/stores/user';
import Profile from '~/components/customers/profile.vue';
import Orders from '~/components/customers/orders.vue';
import LinkedCompanies from '~/components/customers/linkedCompanies.vue';

// Define layout
definePageMeta({
  layout: 'customer',
});

const userStore = useUserStore();
const activeTab = ref('orders');
const isCheckingAuth = ref(true);
const isLoadingStats = ref(false);

// Icon components
const UserIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor'
}, [
  h('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  })
]);

const ShoppingBagIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor'
}, [
  h('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
  })
]);

const BuildingIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor'
}, [
  h('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  })
]);

// Tabs configuration
const tabs = [
  { id: 'orders', icon: ShoppingBagIcon, label: 'Order History' },
  { id: 'companies', icon: BuildingIcon, label: 'Linked Companies' },
  { id: 'profile', icon: UserIcon, label: 'My Profile' },
];

// Format phone number for display
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let formatted = phone;
  if (formatted.startsWith('233')) {
    formatted = '+233 ' + formatted.substring(3, 5) + ' ' + formatted.substring(5, 8) + ' ' + formatted.substring(8);
  } else if (formatted.startsWith('+233')) {
    formatted = '+233 ' + formatted.substring(4, 6) + ' ' + formatted.substring(6, 9) + ' ' + formatted.substring(9);
  }
  return formatted;
};

// Format total spent for display
const formatTotalSpent = (amount) => {
  return Number(amount || 0).toFixed(2);
};

// Refresh stats manually
const refreshStats = async () => {
  isLoadingStats.value = true;
  try {
    await userStore.loadUserStats();
  } catch (error) {
    console.error('Error refreshing stats:', error);
  } finally {
    isLoadingStats.value = false;
  }
};

// Handle logout
const handleLogout = async () => {
  if (confirm('Are you sure you want to log out?')) {
    try {
      await userStore.logout();
      navigateTo('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
};

// Check auth state on mount
onMounted(async () => {
  try {
    // Wait for auth state to be checked if not already initialized
    if (!userStore.authInitialized) {
      await userStore.checkAuthState();
    }

    // Now check if user is logged in
    if (!userStore.isLoggedIn) {
      console.log('User not logged in, redirecting to home');
      navigateTo('/');
    } else {
      isCheckingAuth.value = false;
      
      // Load user stats after confirming user is logged in
      console.log('Loading user stats on customer dashboard mount');
      await userStore.loadUserStats();
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    navigateTo('/');
  }
});
</script><style scoped>
.customer-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

/* Welcome Section */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.welcome-content h1 {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.welcome-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  margin: 0;
}

.company-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
}

.company-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.company-info {
  display: flex;
  flex-direction: column;
}

.company-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.company-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

/* Stats Grid */
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stats-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #667eea;
  color: #667eea;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon .icon {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-content h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
  white-space: nowrap;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
  min-height: 44px; /* Better touch target */
}

.tab-button:hover {
  color: #667eea;
  background: #f8fafc;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f0f9ff;
}

.tab-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.tab-label {
  white-space: nowrap;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s ease;
}

.tab-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Auth Loading State */
.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.auth-loading .spinner {
  width: 48px;
  height: 48px;
  color: #667eea;
  animation: spin 1s linear infinite;
}

.auth-loading p {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 1rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .customer-dashboard {
    padding: 0;
  }

  .welcome-section {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
  }

  .welcome-content h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .tabs {
    gap: 0.25rem;
    padding-bottom: 0;
    margin-left: -1rem;
    margin-right: -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .tab-button {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    min-height: 48px; /* Larger touch target on mobile */
  }

  .tab-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .tab-label {
    font-size: 0.875rem;
  }
}
</style>