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
        <div class="greeting-orb orb-one"></div>
        <div class="greeting-orb orb-two"></div>
        <div class="greeting-content">
          <p class="greeting-label">Customer Dashboard</p>
          <p class="greeting-kicker">{{ greetingText }}</p>
          <h2 class="greeting-name">{{ userName }}</h2>
          <p class="greeting-copy">Track requests, review orders, and jump back into any linked pharmacy in one place.</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <span class="metric-label">Active Requests</span>
            <strong>{{ activeRequestCount }}</strong>
          </div>
          <div class="metric-card glass">
            <span class="metric-label">Recent Requests</span>
            <strong>{{ recentRequests.length }}</strong>
          </div>
        </div>
        <div class="wallet-pill" @click="goTab('wallet')">
          <CreditCardIconSolid class="pill-icon" />
          <span>Wallet: GHS {{ walletBalance.toFixed(2) }}</span>
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
          <small>Start a medicine request</small>
        </button>
        <button class="action-card" @click="goTab('requests')">
          <div class="action-icon blue">
            <ClipDocListSolid class="action-svg" />
          </div>
          <span>My Requests</span>
          <small>Review status updates</small>
        </button>
        <button class="action-card" @click="goTab('orders')">
          <div class="action-icon orange">
            <ShoppingBagIconSolid class="action-svg" />
          </div>
          <span>Orders</span>
          <small>See purchases and totals</small>
        </button>
        <button class="action-card" @click="goTab('wallet')">
          <div class="action-icon purple">
            <CreditCardIconSolid class="action-svg" />
          </div>
          <span>Wallet</span>
          <small>Check available balance</small>
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

      <div class="content-grid">
        <!-- Recent Activity -->
        <div class="section surface-card">
          <div class="section-header">
            <div>
              <p class="section-eyebrow">Activity</p>
              <h3>Recent Requests</h3>
            </div>
            <button @click="goTab('requests')" class="see-all">See All
              <ChevronRightIcon class="see-icon" />
            </button>
          </div>
          <div v-if="recentRequestItems.length === 0" class="empty-mini">
            <InboxIcon class="empty-svg" />
            <p>No requests yet</p>
          </div>
          <div v-else class="activity-list">
            <div v-for="request in recentRequestItems" :key="request.id" class="activity-item">
              <div class="activity-icon" :class="getStatusColor(request.status)">
                <component :is="getStatusIcon(request.status)" class="activity-svg" />
              </div>
              <div class="activity-info">
                <p class="activity-title">Request #{{ request.request_number || shortId(String(request.id || '')) }}</p>
                <p class="activity-date">{{ timeAgo(request.updated_at || request.created_at) }}</p>
              </div>
              <div class="activity-amount">
                <span class="amount">{{ getRequestActivityAmount(request) }}</span>
                <span class="status-tag" :class="getStatusColor(request.status)">{{ formatStatus(request.status) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pharmacies -->
        <div class="section surface-card" v-if="companies.length > 0">
          <div class="section-header">
            <div>
              <p class="section-eyebrow">Stores</p>
              <h3>My Pharmacies</h3>
            </div>
            <button @click="goTab('companies')" class="see-all">See All
              <ChevronRightIcon class="see-icon" />
            </button>
          </div>
          <div class="pharmacy-list">
            <div v-for="c in companies.slice(0, 5)" :key="c.company_id" class="pharmacy-chip" @click="visitStore(c)">
              <div class="pharmacy-avatar">{{ (c.company_name || '?')[0] }}</div>
              <span>{{ c.company_name }}</span>
              <ChevronRightIcon class="pharmacy-arrow" />
            </div>
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
      <OrderRequests default-sub-tab="list" :initial-request-id="requestIdFromQuery" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
const recentRequests = ref([]);
const activeRequestCount = ref(0);
const HOME_STATS_POLL_MS = 15000;
let homeStatsPollTimer = null;

const currentTab = computed(() => route.query.tab || 'home');
const requestIdFromQuery = computed(() => {
  const value = route.query.requestId;
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
});
const recentRequestItems = computed(() => recentRequests.value.slice(0, 1));
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

const formatStatus = (s) => {
  const customerStatus = (s === 'picked_up' || s === 'delivered') ? 'completed' : (s || '');
  return customerStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getStatusColor = (s) => {
  const map = {
    pending: 'yellow',
    confirming_with_pharm: 'blue',
    confirmed_in_pharm: 'green',
    paid: 'blue',
    ready_for_pickup: 'yellow',
    picked_up: 'green',
    out_for_delivery: 'blue',
    delivered: 'green',
    returned: 'red',
    processing: 'blue',
    enquiry_sent: 'blue',
    items_sourced: 'blue',
    awaiting_customer: 'yellow',
    confirmed: 'blue',
    approved: 'blue',
    completed: 'green',
    delivered: 'green',
    cancelled: 'red'
  };
  return map[s] || 'gray';
};

const getStatusIcon = (s) => {
  const map = {
    pending: ClockIcon,
    confirming_with_pharm: ArrowPathIcon,
    confirmed_in_pharm: ArrowPathIcon,
    paid: CheckIconSolid,
    ready_for_pickup: ClockIcon,
    picked_up: CheckIconSolid,
    out_for_delivery: TruckIcon,
    delivered: TruckIcon,
    returned: XCircleIcon,
    processing: ArrowPathIcon,
    enquiry_sent: ArrowPathIcon,
    items_sourced: ArrowPathIcon,
    awaiting_customer: ClockIcon,
    confirmed: CheckIconSolid,
    completed: CheckIconSolid,
    delivered: TruckIcon,
    cancelled: XCircleIcon
  };
  return map[s] || DocumentIcon;
};

const isActiveRequestStatus = (status) => !['picked_up', 'delivered', 'completed', 'cancelled', 'returned'].includes(status);

const timeAgo = (ds) => {
  if (!ds) return '';
  const d = new Date(ds);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const getRequestActivityAmount = (request) => {
  if (!request) return 'Pending quote';
  const estimated = Number(request.estimated_total);
  if (Number.isFinite(estimated) && estimated > 0) {
    return `GHS ${formatAmount(estimated)}`;
  }
  const itemsTotal = Number(request.items_total || 0);
  const deliveryFee = Number(request.delivery_fee || 0);
  const total = itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0);
  if (Number.isFinite(total) && total > 0) {
    return `GHS ${formatAmount(total)}`;
  }
  return 'Pending quote';
};

const loadWalletBalance = async () => {
  try {
    const wres = await fetch(`${config.public.apiBase}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` }
    });
    const wj = await wres.json();
    walletBalance.value = parseFloat(wj.data?.balance || 0);
  } catch (e) {
    walletBalance.value = 0;
  }
};

const loadRequestActivity = async () => {
  try {
    const rres = await fetch(`${config.public.apiBase}/api/order-requests/customer`, {
      headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` }
    });
    const rj = await rres.json();
    const reqs = rj.data || [];
    recentRequests.value = reqs.slice(0, 4);
    activeRequestCount.value = reqs.filter(r => isActiveRequestStatus(r.status)).length;
  } catch (e) {
    recentRequests.value = [];
    activeRequestCount.value = 0;
  }
};

const stopHomeStatsPolling = () => {
  if (homeStatsPollTimer) {
    clearInterval(homeStatsPollTimer);
    homeStatsPollTimer = null;
  }
};

const startHomeStatsPolling = async () => {
  stopHomeStatsPolling();
  await Promise.allSettled([loadWalletBalance(), loadRequestActivity()]);
  homeStatsPollTimer = setInterval(() => {
    loadWalletBalance();
    loadRequestActivity();
  }, HOME_STATS_POLL_MS);
};

const loadDashboard = async () => {
  try {
    await loadWalletBalance();
  } catch (e) { walletBalance.value = 0; }

  try {
    await loadRequestActivity();
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
    if (currentTab.value === 'home') {
      await startHomeStatsPolling();
    }
  } catch (e) {
    console.error('Dashboard init error:', e);
  } finally {
    isCheckingAuth.value = false;
  }
});

watch(currentTab, async (tab) => {
  if (!userStore.customerAuthToken) return;

  if (tab === 'home') {
    await startHomeStatsPolling();
    return;
  }

  stopHomeStatsPolling();
});

onUnmounted(() => {
  stopHomeStatsPolling();
});
</script>

<style scoped>
.customer-app {
  padding: 16px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
}

.home-screen {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.pharmacy-arrow {
  width: 16px;
  height: 16px;
  color: #94a3b8;
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
  border-radius: 28px;
  padding: 24px;
  color: white;
  overflow: hidden;
  display: grid;
  gap: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 50px rgba(37, 99, 235, 0.18);
}

.greeting-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 36%),
    linear-gradient(135deg, #0f766e 0%, #1d4ed8 52%, #1e3a8a 100%);
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

.greeting-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(6px);
  opacity: 0.35;
  z-index: 0;
}

.orb-one {
  width: 120px;
  height: 120px;
  right: 18%;
  top: 18%;
  background: #34d399;
}

.orb-two {
  width: 86px;
  height: 86px;
  left: 56%;
  bottom: 18%;
  background: #93c5fd;
}

.greeting-content {
  position: relative;
  z-index: 1;
}

.greeting-label {
  font-size: 0.72rem;
  opacity: 0.9;
  margin: 0 0 6px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.greeting-kicker {
  margin: 0 0 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.greeting-name {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0 0 8px;
}

.greeting-copy {
  margin: 0;
  max-width: 520px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.84);
}

.hero-metrics {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
}

.metric-card.glass {
  background: rgba(255, 255, 255, 0.08);
}

.metric-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.76);
}

.metric-card strong {
  font-size: 1.4rem;
  font-weight: 800;
}

.wallet-pill {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 100px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s, transform 0.2s;
}

.wallet-pill:hover {
  transform: translateY(-1px);
}

.wallet-pill:active {
  background: rgba(255, 255, 255, 0.28);
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 16px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
}

.action-card:active {
  transform: scale(0.95);
}

.action-card span {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.action-card small {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  line-height: 1.35;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
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
  background: #e0e7ff;
  color: #4338ca;
}

/* Active Banner */
.active-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #eef2ff, #e0e7ff);
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #c7d2fe;
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.08);
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
  margin: 0;
}

.surface-card {
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 12px;
}

.section-eyebrow {
  margin: 0 0 4px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2563eb;
}

.section-header h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
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
  font-size: 0.95rem;
  font-weight: 800;
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
  border: 1px dashed #cbd5e1;
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
.pharmacy-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pharmacy-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 12px 12px;
  background: white;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  transition: all 0.2s ease;
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
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
  flex: 1;
}

/* Page View */
.page-view {
  min-height: 60vh;
  width: 100%;
  overflow-x: clip;
}

@media (max-width: 640px) {
  .customer-app {
    padding: 12px;
  }

  .greeting-card {
    padding: 18px;
    border-radius: 22px;
    gap: 14px;
  }

  .greeting-name {
    font-size: 1.45rem;
  }

  .greeting-copy {
    font-size: 0.82rem;
    max-width: none;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .metric-card {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .metric-card strong {
    font-size: 1.15rem;
  }

  .wallet-pill {
    width: 100%;
    justify-content: space-between;
  }

  .quick-actions {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .action-card {
    padding: 14px;
    border-radius: 16px;
  }

  .action-card small {
    font-size: 0.72rem;
  }

  .surface-card {
    padding: 14px;
    border-radius: 18px;
  }

  .section-header {
    align-items: flex-start;
  }

  .activity-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .activity-amount {
    text-align: left;
  }
}

/* ============ DESKTOP RESPONSIVE ============ */
@media (min-width: 768px) {
  .customer-app {
    padding: 24px 32px;
    max-width: 960px;
  }

  .greeting-card {
    padding: 32px;
    border-radius: 32px;
    grid-template-columns: minmax(0, 1.35fr) minmax(220px, 0.8fr);
    align-items: end;
  }

  .greeting-name {
    font-size: 2.1rem;
  }

  .greeting-bg::after {
    width: 300px;
    height: 300px;
  }

  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .action-card {
    padding: 20px 16px;
    border-radius: 22px;
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  }

  .action-card:active {
    transform: scale(1);
  }

  .action-card span {
    font-size: 0.88rem;
  }

  .action-icon {
    width: 54px;
    height: 54px;
    font-size: 1.4rem;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 24px;
    align-items: start;
  }

  .active-banner {
    padding: 16px 20px;
    border-radius: 20px;
  }

  .active-banner:hover {
    background: #e0e7ff;
  }

  .section-header h3 {
    font-size: 1.125rem;
  }

  .activity-item {
    padding: 16px 20px;
  }

  .pharmacy-chip {
    padding: 14px 18px 14px 14px;
  }

  .pharmacy-chip:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
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
