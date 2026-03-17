<template>
  <div class="customer-app">

    <!-- Loading State -->
    <div v-if="isCheckingAuth" class="auth-loading">
      <div class="pulse-ring"></div>
      <p>Loading...</p>
    </div>

    <template v-else>

      <!-- Home Screen -->
      <div v-if="currentTab === 'home'" class="home-screen">

        <!-- ① Hero zone -->
        <div class="hero-zone">
          <div class="hero-actions-row">
            <button class="loc-btn" :disabled="savingHomeLocation" @click.stop="setHomeLocationFromDashboard">
              <div class="loc-pin-wrap">
                <ArrowPathIcon v-if="savingHomeLocation" class="loc-pin-icon spin" />
                <MapPinIcon v-else class="loc-pin-icon" />
              </div>
              <div class="loc-content">
                <span class="loc-label">Delivery Location</span>
                <div class="loc-name-row">
                  <span class="loc-name">{{ homeAddressName }}</span>
                  <span class="loc-badge" :class="{ 'unset': !homeAddress }">
                    {{ homeAddress ? 'Update' : 'Set' }}
                  </span>
                </div>
                <p class="loc-copy">{{ homeAddressCopy }}</p>
              </div>
            </button>
            <div class="hero-actions">
              <button class="action-primary" @click="goTab('new')">
                <PlusIcon class="action-icon" />
                <span>New Request</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ② Active requests alert -->
      <div v-if="activeRequestCount > 0" class="active-alert" @click="goTab('requests')">
        <div class="alert-left">
          <div class="alert-dot-ring">
            <div class="alert-dot"></div>
          </div>
          <div class="alert-text">
            <strong>{{ activeRequestCount }} active request{{ activeRequestCount > 1 ? 's' : '' }} in progress</strong>
            <span>Check quotes, payment and delivery updates</span>
          </div>
        </div>
        <ChevronRightIcon class="alert-arrow" />
      </div>

      <!-- ③ Content sections -->
      <div class="content-area">
        <div class="content-grid">

          <!-- Recent Requests -->
          <div class="section-card section-card-prominent">
            <div class="section-card-head">
              <div class="section-card-title-group">
                <p class="section-eyebrow">Activity</p>
                <h3 class="section-card-title">Recent Requests</h3>
              </div>
              <button class="see-all-btn" @click="goTab('requests')">
                See all <ChevronRightIcon class="see-all-icon" />
              </button>
            </div>

            <div v-if="recentRequestItems.length === 0" class="empty-state">
              <InboxIcon class="empty-icon" />
              <p>No requests yet</p>
              <button class="empty-cta" @click="goTab('new')">Start your first request</button>
            </div>

            <div v-else class="request-rows">
              <div
                v-for="request in recentRequestItems"
                :key="request.id"
                class="request-row"
                @click="goTab('requests')"
              >
                <div class="req-status-badge" :class="getStatusColor(request.status)">
                  <component :is="getStatusIcon(request.status)" class="req-status-icon" />
                </div>
                <div class="req-body">
                  <div class="req-title-row">
                    <p class="req-title">Request #{{ request.request_number || shortId(String(request.id || '')) }}</p>
                    <span class="req-inline-status" :class="getStatusColor(request.status)">{{ formatStatus(request.status) }}</span>
                  </div>
                  <p class="req-meta">
                    <span>{{ timeAgo(request.updated_at || request.created_at) }}</span>
                    <span v-if="request.item_count" class="req-sep">|</span>
                    <span v-if="request.item_count">{{ request.item_count }} item{{ request.item_count !== 1 ? 's' : '' }}</span>
                  </p>
                </div>
                <div class="req-right">
                  <p class="req-amount">{{ getRequestActivityAmount(request) }}</p>
                  <p class="req-open">Open request</p>
                </div>
              </div>
            </div>
          </div>

          <!-- My Pharmacies -->
          <div v-if="companies.length > 0" class="section-card">
            <div class="section-card-head">
              <div class="section-card-title-group">
                <p class="section-eyebrow">Stores</p>
                <h3 class="section-card-title">My Pharmacies</h3>
              </div>
              <button class="see-all-btn" @click="goTab('companies')">
                See all <ChevronRightIcon class="see-all-icon" />
              </button>
            </div>

            <div class="pharmacy-rows">
              <div
                v-for="(c, i) in companies.slice(0, 4)"
                :key="c.company_id"
                class="pharmacy-row"
                @click="visitStore(c)"
              >
                <div class="pharm-avatar" :class="{ featured: i === 0 }">
                  {{ (c.company_name || '?')[0] }}
                </div>
                <div class="pharm-info">
                  <p class="pharm-name">{{ c.company_name }}</p>
                  <p class="pharm-sub">{{ i === 0 ? 'Preferred pharmacy for quick access' : 'Open storefront and browse products' }}</p>
                </div>
                <ChevronRightIcon class="pharm-arrow" />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- New Request -->
      <div v-if="currentTab === 'new'" class="page-view">
        <OrderRequests default-sub-tab="new" />
      </div>

      <!-- My Requests -->
      <div v-if="currentTab === 'requests'" class="page-view">
        <OrderRequests default-sub-tab="list" :initial-request-id="requestIdFromQuery" />
      </div>

      <!-- Wallet -->
      <div v-if="currentTab === 'wallet'" class="page-view">
        <Wallet />
      </div>

      <!-- Order History -->
      <div v-if="currentTab === 'orders'" class="page-view">
        <Orders />
      </div>

      <!-- Profile -->
      <div v-if="currentTab === 'profile'" class="page-view">
        <Profile />
      </div>

      <!-- Linked Companies -->
      <div v-if="currentTab === 'companies'" class="page-view">
        <LinkedCompanies />
      </div>

    </template>

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
import { getCompactAddressLines } from '~/utils/addressFormat';
import { ChevronRightIcon, InboxIcon, ClockIcon, ArrowPathIcon, TruckIcon, XCircleIcon, DocumentIcon, MapPinIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { CheckIcon as CheckIconSolid } from '@heroicons/vue/24/solid'

definePageMeta({ layout: 'customer' });

const userStore = useUserStore();
const route = useRoute();
const config = useRuntimeConfig();

const isCheckingAuth = ref(true);
const walletBalance = useState('walletBalance', () => 0);
const recentRequests = ref([]);
const activeRequestCount = ref(0);
const savingHomeLocation = ref(false);
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
const homeAddress = computed(() => userStore.currentUser?.address || null);

const homeAddressName = computed(() => {
  if (!homeAddress.value) return 'No location set';
  return getCompactAddressLines(homeAddress.value, { primaryCount: 2 }).primary || 'Saved location';
});

const homeAddressCopy = computed(() => {
  if (!homeAddress.value) return 'Used by default for delivery requests once you save it.';
  return 'Used automatically for new delivery requests until you change it.';
});

const userInitials = computed(() => {
  const u = userStore.currentUser;
  if (!u) return '?';
  const f = (u.fname || '').trim()[0] || '';
  const l = (u.lname || '').trim()[0] || '';
  return (f + l).toUpperCase() || '?';
});

const goTab = (tab) => navigateTo({ path: '/customer', query: { tab } });

const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(`${config.public.apiBase}/api/auth/customer/reverse-geocode?lat=${latitude}&lng=${longitude}`, {
    headers: {
      'Authorization': `Bearer ${userStore.customerAuthToken}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Failed to generate address');
  return data.data;
};

const setHomeLocationFromDashboard = () => {
  if (!navigator.geolocation || savingHomeLocation.value) return;
  savingHomeLocation.value = true;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const location = await reverseGeocode(latitude, longitude);
        await userStore.updateProfile({
          home_address: location.address || null,
          home_latitude: latitude,
          home_longitude: longitude
        });
      } catch (error) {
        console.error('Failed to set home location from dashboard:', error);
      } finally {
        savingHomeLocation.value = false;
      }
    },
    (error) => {
      console.error('Geolocation failed on dashboard:', error);
      savingHomeLocation.value = false;
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

const generateCompanySlug = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const getCompanyStoreSlug = (company) => {
  const explicitSlug = String(company?.domain_name || company?.company_slug || company?.slug || '').trim().toLowerCase();
  if (explicitSlug) return explicitSlug;
  return generateCompanySlug(company?.company_name || '');
};

const visitStore = (company) => {
  const slug = getCompanyStoreSlug(company);
  if (!slug) return;
  navigateTo(`/${slug}`);
};

const shortId = (id) => (id || '').substring(0, 8).toUpperCase();
const formatAmount = (v) => parseFloat(v || 0).toFixed(2);

const formatStatus = (s) => {
  const customerStatus = (s === 'picked_up' || s === 'delivered') ? 'completed' : (s || '');
  return customerStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getStatusColor = (s) => {
  const map = {
    pending: 'yellow', confirming_with_pharm: 'blue', confirmed_in_pharm: 'green',
    paid: 'blue', logistics_pending: 'blue', driver_unavailable: 'red',
    ready_for_pickup: 'yellow', picked_up: 'green', out_for_delivery: 'blue',
    delivered: 'green', returned: 'red', processing: 'blue', enquiry_sent: 'blue',
    items_sourced: 'blue', awaiting_customer: 'yellow', confirmed: 'blue',
    approved: 'blue', completed: 'green', cancelled: 'red'
  };
  return map[s] || 'gray';
};

const getStatusIcon = (s) => {
  const map = {
    pending: ClockIcon, confirming_with_pharm: ArrowPathIcon, confirmed_in_pharm: ArrowPathIcon,
    paid: CheckIconSolid, logistics_pending: ClockIcon, driver_unavailable: XCircleIcon,
    ready_for_pickup: ClockIcon, picked_up: CheckIconSolid, out_for_delivery: TruckIcon,
    delivered: TruckIcon, returned: XCircleIcon, processing: ArrowPathIcon,
    enquiry_sent: ArrowPathIcon, items_sourced: ArrowPathIcon, awaiting_customer: ClockIcon,
    confirmed: CheckIconSolid, completed: CheckIconSolid, cancelled: XCircleIcon
  };
  return map[s] || DocumentIcon;
};

const isActiveRequestStatus = (status) => !['driver_unavailable', 'picked_up', 'delivered', 'completed', 'cancelled', 'returned'].includes(status);

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
  if (Number.isFinite(estimated) && estimated > 0) return `GHS ${formatAmount(estimated)}`;
  const itemsTotal = Number(request.items_total || 0);
  const deliveryFee = Number(request.delivery_fee || 0);
  const total = itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0);
  if (Number.isFinite(total) && total > 0) return `GHS ${formatAmount(total)}`;
  return 'Pending quote';
};

const loadWalletBalance = async () => {
  try {
    const wres = await fetch(`${config.public.apiBase}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` }
    });
    const wj = await wres.json();
    walletBalance.value = parseFloat(wj.data?.balance || 0);
  } catch (e) { walletBalance.value = 0; }
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
  if (homeStatsPollTimer) { clearInterval(homeStatsPollTimer); homeStatsPollTimer = null; }
};

const startHomeStatsPolling = async () => {
  stopHomeStatsPolling();
  await Promise.allSettled([loadWalletBalance(), loadRequestActivity()]);
  homeStatsPollTimer = setInterval(() => { loadWalletBalance(); loadRequestActivity(); }, HOME_STATS_POLL_MS);
};

const loadDashboard = async () => {
  try { await loadWalletBalance(); } catch (e) { walletBalance.value = 0; }
  try { await loadRequestActivity(); } catch (e) { activeRequestCount.value = 0; }
};

onMounted(async () => {
  try {
    if (!userStore.authInitialized) await userStore.checkAuthState();
    if (!userStore.customerAuthToken) { isCheckingAuth.value = false; return navigateTo('/'); }
    await loadDashboard();
    if (currentTab.value === 'home') await startHomeStatsPolling();
  } catch (e) {
    console.error('Dashboard init error:', e);
  } finally {
    isCheckingAuth.value = false;
  }
});

watch(currentTab, async (tab) => {
  if (!userStore.customerAuthToken) return;
  if (tab === 'home') { await startHomeStatsPolling(); return; }
  stopHomeStatsPolling();
});

onUnmounted(() => { stopHomeStatsPolling(); });
</script>

<style scoped>

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Shell                                            */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

.customer-app {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  box-sizing: border-box;
}

.home-screen {
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(219, 234, 254, 0.55), transparent 24%),
    linear-gradient(180deg, #f8fafc 0%, #eff4fb 100%);
  min-height: 100vh;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Auth loading                                     */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

.auth-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
}

.pulse-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

.auth-loading p { font-size: 0.875rem; color: #9ca3af; }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  ① Hero zone                                      */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

.hero-zone {
  margin: 20px 20px 0;
  padding: 24px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(14, 165, 233, 0.04));
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.06);
}

.hero-actions-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: stretch;
}

/* Location button -------------------------------- */

.loc-btn {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #dbe7f5;
  border-radius: 18px;
  padding: 16px 18px;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.loc-btn:hover {
  border-color: #bfdbfe;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.loc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loc-pin-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.loc-pin-icon {
  width: 18px;
  height: 18px;
  color: #2563eb;
}

.loc-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loc-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #64748b;
}

.loc-name-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.loc-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.loc-badge {
  flex-shrink: 0;
  background: #2563eb;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
}

.loc-badge.unset {
  background: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
}

.loc-copy {
  margin: 0;
  font-size: 0.79rem;
  line-height: 1.45;
  color: #64748b;
}

/* Hero action row -------------------------------- */

.hero-actions {
  display: flex;
  align-items: stretch;
}

.action-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 28px;
  border-radius: 14px;
  background: #2563eb;
  border: none;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}

.action-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.44);
}

.action-primary:active { transform: translateY(0); }

.action-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  ② Active alert                                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

.active-alert {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 16px 20px 0;
  padding: 14px 18px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.active-alert:hover { background: #dbeafe; }

.alert-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.alert-dot-ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #dbeafe;
  border: 2px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2563eb;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.alert-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.alert-text strong {
  font-size: 0.86rem;
  font-weight: 700;
  color: #1e3a8a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-text span {
  font-size: 0.74rem;
  color: #3b82f6;
}

.alert-arrow {
  width: 18px;
  height: 18px;
  color: #3b82f6;
  flex-shrink: 0;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  ③ Content area                                   */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

.content-area {
  padding: 20px 20px 40px;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Section card ────────────────────────────────── */

.section-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e8edf3;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.section-card-prominent {
  border-color: #dbe7f5;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.06);
}

.section-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.section-card-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2563eb;
  margin: 0;
}

.section-card-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.see-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: background 0.15s;
}

.see-all-btn:hover { background: #eff6ff; }

.see-all-icon {
  width: 13px;
  height: 13px;
}

/* ── Request rows ────────────────────────────────── */

.request-rows { display: flex; flex-direction: column; }

.request-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
  border-bottom: 1px solid #f8fafc;
}

.request-row:last-child { border-bottom: none; }
.request-row:hover {
  background: #fafcff;
  transform: translateY(-1px);
}

.req-status-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.req-status-badge.green  { background: #dcfce7; color: #16a34a; }
.req-status-badge.blue   { background: #dbeafe; color: #2563eb; }
.req-status-badge.yellow { background: #fef9c3; color: #ca8a04; }
.req-status-badge.red    { background: #fee2e2; color: #dc2626; }
.req-status-badge.gray   { background: #f3f4f6; color: #6b7280; }

.req-status-icon { width: 18px; height: 18px; }

.req-body { flex: 1; min-width: 0; }

.req-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.req-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.req-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 0.73rem;
  color: #94a3b8;
  margin: 0;
}

.req-status-tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.req-status-tag.green  { background: #dcfce7; color: #16a34a; }
.req-status-tag.blue   { background: #dbeafe; color: #2563eb; }
.req-status-tag.yellow { background: #fef9c3; color: #ca8a04; }
.req-status-tag.red    { background: #fee2e2; color: #dc2626; }
.req-status-tag.gray   { background: #f3f4f6; color: #6b7280; }

.req-inline-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.63rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.req-inline-status.green  { background: #dcfce7; color: #15803d; }
.req-inline-status.blue   { background: #dbeafe; color: #1d4ed8; }
.req-inline-status.yellow { background: #fef3c7; color: #b45309; }
.req-inline-status.red    { background: #fee2e2; color: #b91c1c; }
.req-inline-status.gray   { background: #f1f5f9; color: #64748b; }

.req-sep { opacity: 0.4; }

.req-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.req-amount {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.req-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #eff6ff;
  font-size: 0.68rem;
  font-weight: 700;
  color: #2563eb;
  margin: 0;
}

/* ── Empty state ─────────────────────────────────── */

.empty-state {
  padding: 36px 24px;
  text-align: center;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: #cbd5e1;
  margin: 0 auto;
}

.empty-state p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 10px 0 16px;
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  border-radius: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.empty-cta:hover { background: #dbeafe; }

/* ── Pharmacy rows ───────────────────────────────── */

.pharmacy-rows { display: flex; flex-direction: column; }

.pharmacy-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
  border-bottom: 1px solid #f8fafc;
}

.pharmacy-row:last-child { border-bottom: none; }
.pharmacy-row:hover {
  background: #fafcff;
  transform: translateY(-1px);
}

.pharm-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.pharm-avatar.featured {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28);
}

.pharm-info { flex: 1; min-width: 0; }

.pharm-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pharm-sub {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
  margin: 0;
  line-height: 1.45;
}

.pharm-arrow {
  width: 16px;
  height: 16px;
  color: #cbd5e1;
  flex-shrink: 0;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Page view (non-home tabs)                        */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

.page-view {
  min-height: 60vh;
  width: 100%;
  overflow-x: clip;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Responsive                                       */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

@media (max-width: 480px) {
  .hero-zone { margin: 16px 16px 0; padding: 16px; border-radius: 20px; }
  .hero-actions-row { grid-template-columns: 1fr; gap: 12px; }
  .loc-btn { padding: 14px 15px; gap: 10px; }
  .hero-actions { width: 100%; }
  .action-primary { width: 100%; padding: 13px 16px; font-size: 0.88rem; }
  .loc-name-row { flex-direction: column; align-items: flex-start; }
  .active-alert  { margin: 14px 18px 0; }
  .content-area  { padding: 16px 18px 36px; }
  .request-row,
  .pharmacy-row { padding: 15px 16px; }
  .section-card-head { padding: 16px 16px 12px; }
}

@media (min-width: 680px) {
  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
}

@media (min-width: 960px) {
  .hero-zone { margin: 24px 28px 0; padding: 20px; }
  .hero-actions-row { grid-template-columns: minmax(0, 1.4fr) auto; gap: 18px; }
  .action-primary { min-width: 168px; }
  .active-alert  { margin: 20px 28px 0; }
  .content-area  { padding: 24px 28px 48px; }
}

</style>

