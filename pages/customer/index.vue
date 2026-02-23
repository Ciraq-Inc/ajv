<template>
  <div class="customer-app">
    <!-- Loading State -->
    <div v-if="isCheckingAuth" class="auth-loading">
      <div class="pulse-ring"></div>
      <p>Loading...</p>
    </div>

    <!-- Home Screen -->
    <div v-else-if="currentTab === 'home'" class="home-screen">
      <!-- Greeting Card -->
      <div class="greeting-card">
        <div class="greeting-bg"></div>
        <div class="greeting-content">
          <p class="greeting-label">{{ greetingText }}</p>
          <h2 class="greeting-name">{{ userName }}</h2>
        </div>
        <div class="wallet-pill" @click="goTab('wallet')">
          <CreditCardIconSolid class="pill-icon" />
          <span>GHS {{ walletBalance.toFixed(2) }}</span>
          <ChevronRightIcon class="pill-arrow" />
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-card" @click="goTab('new')">
          <div class="action-icon green">
            <PlusCircleIconSolid class="action-svg" />
          </div>
          <span>New Request</span>
        </button>
        <button class="action-card" @click="goTab('requests')">
          <div class="action-icon blue">
            <ClipDocListSolid class="action-svg" />
          </div>
          <span>My Requests</span>
        </button>
        <button class="action-card" @click="goTab('orders')">
          <div class="action-icon orange">
            <ShoppingBagIconSolid class="action-svg" />
          </div>
          <span>Orders</span>
        </button>
        <button class="action-card" @click="goTab('wallet')">
          <div class="action-icon purple">
            <CreditCardIconSolid class="action-svg" />
          </div>
          <span>Wallet</span>
        </button>
      </div>

      <!-- Active Requests Banner -->
      <div v-if="activeRequestCount > 0" class="active-banner" @click="goTab('requests')">
        <div class="banner-dot"></div>
        <div class="banner-text">
          <strong>{{ activeRequestCount }} active request{{ activeRequestCount > 1 ? 's' : '' }}</strong>
          <span>Tap to view status</span>
        </div>
        <ChevronRightIcon class="banner-arrow" />
      </div>

      <!-- Recent Activity -->
      <div class="section">
        <div class="section-header">
          <h3>Recent Orders</h3>
          <button @click="goTab('orders')" class="see-all">See All
            <ChevronRightIcon class="see-icon" />
          </button>
        </div>
        <div v-if="recentOrders.length === 0" class="empty-mini">
          <InboxIcon class="empty-svg" />
          <p>No orders yet</p>
        </div>
        <div v-else class="activity-list">
          <div v-for="order in recentOrders" :key="order.order_id" class="activity-item">
            <div class="activity-icon" :class="getStatusColor(order.status)">
              <component :is="getStatusIcon(order.status)" class="activity-svg" />
            </div>
            <div class="activity-info">
              <p class="activity-title">Order #{{ shortId(order.order_id) }}</p>
              <p class="activity-date">{{ timeAgo(order.createdAt || order.created_at) }}</p>
            </div>
            <div class="activity-amount">
              <span class="amount">GHS {{ formatAmount(order.total_amount) }}</span>
              <span class="status-tag" :class="getStatusColor(order.status)">{{ formatStatus(order.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pharmacies -->
      <div class="section" v-if="companies.length > 0">
        <div class="section-header">
          <h3>My Pharmacies</h3>
          <button @click="goTab('companies')" class="see-all">See All
            <ChevronRightIcon class="see-icon" />
          </button>
        </div>
        <div class="pharmacy-scroll">
          <div v-for="c in companies.slice(0, 5)" :key="c.company_id" class="pharmacy-chip" @click="visitStore(c)">
            <div class="pharmacy-avatar">{{ (c.company_name || '?')[0] }}</div>
            <span>{{ c.company_name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- New Request -->
    <div v-else-if="currentTab === 'new'" class="page-view">
      <OrderRequests default-sub-tab="new" />
    </div>

    <!-- My Requests -->
    <div v-else-if="currentTab === 'requests'" class="page-view">
      <OrderRequests default-sub-tab="list" />
    </div>

    <!-- Wallet -->
    <div v-else-if="currentTab === 'wallet'" class="page-view">
      <Wallet />
    </div>

    <!-- Order History -->
    <div v-else-if="currentTab === 'orders'" class="page-view">
      <Orders />
    </div>

    <!-- Profile -->
    <div v-else-if="currentTab === 'profile'" class="page-view">
      <Profile />
    </div>

    <!-- Linked Companies -->
    <div v-else-if="currentTab === 'companies'" class="page-view">
      <LinkedCompanies />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '~/stores/user';
import { useRoute } from 'vue-router';
import Profile from '~/components/customers/profile.vue';
import Orders from '~/components/customers/orders.vue';
import LinkedCompanies from '~/components/customers/linkedCompanies.vue';
import OrderRequests from '~/components/customers/orderRequests.vue';
import Wallet from '~/components/customers/wallet.vue';

import { ChevronRightIcon, InboxIcon, ClockIcon, ArrowPathIcon, TruckIcon, XCircleIcon, DocumentIcon } from '@heroicons/vue/24/outline'
import { PlusCircleIcon as PlusCircleIconSolid, ClipboardDocumentListIcon as ClipDocListSolid, ShoppingBagIcon as ShoppingBagIconSolid, CreditCardIcon as CreditCardIconSolid, CheckIcon as CheckIconSolid } from '@heroicons/vue/24/solid'

definePageMeta({ layout: 'customer' });

const userStore = useUserStore();
const route = useRoute();
const config = useRuntimeConfig();

const isCheckingAuth = ref(true);
const walletBalance = ref(0);
const recentOrders = ref([]);
const activeRequestCount = ref(0);

const currentTab = computed(() => route.query.tab || 'home');
const companies = computed(() => userStore.companies || []);

const userName = computed(() => {
  const u = userStore.currentUser;
  return u ? `${u.fname || ''} ${u.lname || ''}`.trim() || 'there' : 'there';
});

const greetingText = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

const goTab = (tab) => navigateTo({ path: '/customer', query: { tab } });

const generateCompanySlug = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const visitStore = (company) => {
  const slug = generateCompanySlug(company.company_name);
  navigateTo(`/${slug}/products`);
};

const shortId = (id) => (id || '').substring(0, 8).toUpperCase();

const formatAmount = (v) => parseFloat(v || 0).toFixed(2);

const formatStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const getStatusColor = (s) => {
  const map = { pending: 'yellow', processing: 'blue', completed: 'green', delivered: 'green', cancelled: 'red', approved: 'blue' };
  return map[s] || 'gray';
};

const getStatusIcon = (s) => {
  const map = { pending: ClockIcon, processing: ArrowPathIcon, completed: CheckIconSolid, delivered: TruckIcon, cancelled: XCircleIcon };
  return map[s] || DocumentIcon;
};

const timeAgo = (ds) => {
  if (!ds) return '';
  const d = new Date(ds);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const loadDashboard = async () => {
  try {
    // Wallet
    const wres = await fetch(`${config.public.apiBase}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` }
    });
    const wj = await wres.json();
    walletBalance.value = parseFloat(wj.data?.balance || 0);
  } catch (e) { walletBalance.value = 0; }

  try {
    // Recent orders
    const ores = await fetch(`${config.public.apiBase}/api/auth/customer/all-orders?`, {
      headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` }
    });
    const oj = await ores.json();
    const allOrders = oj.data || oj.orders || [];
    recentOrders.value = allOrders.slice(0, 4);
  } catch (e) { recentOrders.value = []; }

  try {
    // Active request count
    const rres = await fetch(`${config.public.apiBase}/api/order-requests/customer`, {
      headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` }
    });
    const rj = await rres.json();
    const reqs = rj.data || [];
    activeRequestCount.value = reqs.filter(r => ['pending', 'processing', 'priced'].includes(r.status)).length;
  } catch (e) { activeRequestCount.value = 0; }
};

onMounted(async () => {
  try {
    if (!userStore.customerAuthToken) {
      isCheckingAuth.value = false;
      return navigateTo('/');
    }
    await userStore.loadUserStats();
    await loadDashboard();
  } catch (e) {
    console.error('Dashboard init error:', e);
  } finally {
    isCheckingAuth.value = false;
  }
});
</script>

<style scoped>
.customer-app {
  padding: 16px;
}

/* Heroicon SVG sizing */
.pill-icon {
  width: 16px;
  height: 16px;
}

.pill-arrow {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.action-svg {
  width: 24px;
  height: 24px;
}

.see-icon {
  width: 16px;
  height: 16px;
  display: inline;
  vertical-align: middle;
}

.empty-svg {
  width: 2rem;
  height: 2rem;
  color: #d1d5db;
}

.activity-svg {
  width: 18px;
  height: 18px;
}

.banner-arrow {
  width: 20px;
  height: 20px;
  color: #6366f1;
  flex-shrink: 0;
}

/* Auth Loading */
.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
}

.pulse-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-loading p {
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Greeting Card */
.greeting-card {
  position: relative;
  border-radius: 20px;
  padding: 24px;
  color: white;
  overflow: hidden;
  margin-bottom: 20px;
}

.greeting-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}

.greeting-bg::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.greeting-content {
  position: relative;
  z-index: 1;
}

.greeting-label {
  font-size: 0.8rem;
  opacity: 0.85;
  margin: 0 0 4px;
  font-weight: 500;
}

.greeting-name {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.wallet-pill {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s;
}

.wallet-pill:active {
  background: rgba(255, 255, 255, 0.28);
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: white;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.action-card:active {
  transform: scale(0.95);
}

.action-card span {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #4b5563;
  text-align: center;
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.action-icon.green {
  background: #dcfce7;
  color: #16a34a;
}

.action-icon.blue {
  background: #dbeafe;
  color: #2563eb;
}

.action-icon.orange {
  background: #ffedd5;
  color: #ea580c;
}

.action-icon.purple {
  background: #ede9fe;
  color: #7c3aed;
}

/* Active Banner */
.active-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #eef2ff;
  border-radius: 14px;
  margin-bottom: 24px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #c7d2fe;
}

.active-banner:active {
  background: #e0e7ff;
}

.banner-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #667eea;
  flex-shrink: 0;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.banner-text {
  flex: 1;
}

.banner-text strong {
  display: block;
  font-size: 0.875rem;
  color: #1e1b4b;
}

.banner-text span {
  font-size: 0.75rem;
  color: #6366f1;
}

.banner-arrow {
  font-size: 1.25rem;
  color: #6366f1;
}

/* Section */
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.see-all {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Activity List */
.activity-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.activity-icon.green {
  background: #dcfce7;
  color: #16a34a;
}

.activity-icon.blue {
  background: #dbeafe;
  color: #2563eb;
}

.activity-icon.yellow {
  background: #fef9c3;
  color: #ca8a04;
}

.activity-icon.red {
  background: #fee2e2;
  color: #dc2626;
}

.activity-icon.gray {
  background: #f3f4f6;
  color: #6b7280;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 2px 0 0;
}

.activity-amount {
  text-align: right;
}

.amount {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1a1a2e;
}

.status-tag {
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.status-tag.green {
  background: #dcfce7;
  color: #16a34a;
}

.status-tag.blue {
  background: #dbeafe;
  color: #2563eb;
}

.status-tag.yellow {
  background: #fef9c3;
  color: #ca8a04;
}

.status-tag.red {
  background: #fee2e2;
  color: #dc2626;
}

.status-tag.gray {
  background: #f3f4f6;
  color: #6b7280;
}

/* Empty mini */
.empty-mini {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-mini i {
  font-size: 2rem;
  color: #d1d5db;
}

.empty-mini p {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 8px 0 0;
}

/* Pharmacy Chips */
.pharmacy-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.pharmacy-scroll::-webkit-scrollbar {
  display: none;
}

.pharmacy-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 10px 10px;
  background: white;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.pharmacy-chip:active {
  transform: scale(0.96);
}

.pharmacy-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pharmacy-chip span {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

/* Page View */
.page-view {
  min-height: 60vh;
}

/* ============ DESKTOP RESPONSIVE ============ */
@media (min-width: 768px) {
  .customer-app {
    padding: 24px 32px;
    max-width: 960px;
  }

  .greeting-card {
    padding: 32px;
    border-radius: 24px;
  }

  .greeting-name {
    font-size: 1.75rem;
  }

  .greeting-bg::after {
    width: 300px;
    height: 300px;
  }

  .quick-actions {
    gap: 16px;
  }

  .action-card {
    padding: 20px 12px;
    border-radius: 18px;
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  .action-card:active {
    transform: scale(1);
  }

  .action-card span {
    font-size: 0.75rem;
  }

  .action-icon {
    width: 52px;
    height: 52px;
    font-size: 1.4rem;
  }

  .home-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .active-banner {
    padding: 16px 20px;
    border-radius: 16px;
  }

  .active-banner:hover {
    background: #e0e7ff;
  }

  .section-header h3 {
    font-size: 1.0625rem;
  }

  .activity-item {
    padding: 16px 20px;
  }

  .pharmacy-chip {
    padding: 12px 20px 12px 12px;
  }

  .pharmacy-chip:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  }

  .page-view {
    min-height: 50vh;
  }
}

@media (min-width: 1200px) {
  .customer-app {
    padding: 28px 40px;
    max-width: 1100px;
  }

  .greeting-card {
    padding: 36px;
  }

  .greeting-name {
    font-size: 2rem;
  }
}
</style>
