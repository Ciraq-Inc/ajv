<template>
  <div class="linked-companies-component">
    <div class="section-header">
      <div class="header-content">
        <p class="eyebrow">Pharmacies</p>
        <h2>Linked Pharmacies</h2>
        <p class="section-description">
          Browse the pharmacies connected to your account and jump into any linked storefront.
        </p>
      </div>
      <button @click="triggerLinking" class="btn btn-link-accounts" :disabled="isLinking">
        <svg v-if="isLinking" class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {{ isLinking ? 'Linking...' : 'Link Accounts' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <p>Loading your companies...</p>
    </div>

    <!-- Success Alert -->
    <!-- Removed - no longer needed for store navigation -->

    <!-- Companies List -->
    <div v-if="!isLoading" class="companies-grid">
      <div v-for="company in companies" :key="company.company_id" class="company-card"
        :class="{ active: isActiveCompany(company) }">
        <div class="company-topline">
          <div class="company-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span class="company-badge" :class="{ active: isActiveCompany(company) }">
            {{ isActiveCompany(company) ? 'Active' : 'Linked' }}
          </span>
        </div>

        <div class="company-info">
          <h3>{{ company.company_name }}</h3>
          <p v-if="company.location" class="company-location">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ company.location }}
          </p>
          <p v-if="company.phone" class="company-phone">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ company.phone }}
          </p>
        </div>

        <div class="company-actions">
          <button @click="goToCompanyStore(company)" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20px" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit Store
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && companies.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3>No linked pharmacies</h3>
      <p>You do not have any pharmacies linked to your account yet.</p>
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <div class="info-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="info-content">
        <h4>About Linked Pharmacies</h4>
        <p>
          Open any linked pharmacy to browse its products and place direct store orders from the same customer account.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();

// State
const isLoading = ref(false);
const isLinking = ref(false);
const linkingMessage = ref('');
const companies = computed(() => userStore.companies || []);

// Check if company is active
const isActiveCompany = (company) => {
  return userStore.currentCompany?.company_id === company.company_id;
};

// Resolve store slug using the persisted pharmacy domain when available
const generateCompanySlug = (companyName) => {
  return String(companyName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
};

const getCompanyStoreSlug = (company) => {
  const explicitSlug = String(company?.domain_name || company?.company_slug || company?.slug || '').trim().toLowerCase();
  if (explicitSlug) return explicitSlug;
  return generateCompanySlug(company?.company_name || '');
};

// Navigate to company store
const goToCompanyStore = (company) => {
  const slug = getCompanyStoreSlug(company);
  if (!slug) return;
  navigateTo(`/${slug}`);
};

// Trigger customer linking
const triggerLinking = async () => {
  try {
    isLinking.value = true;
    linkingMessage.value = '';
    const result = await userStore.triggerCustomerLinking();
    linkingMessage.value = result.message;

    // Refresh companies list
    await loadCompanies();
  } catch (error) {
    console.error('Error triggering linking:', error);
    linkingMessage.value = error.message || 'Failed to link accounts';
  } finally {
    isLinking.value = false;
    // Clear message after 5 seconds
    setTimeout(() => {
      linkingMessage.value = '';
    }, 5000);
  }
};

// Load companies
const loadCompanies = async () => {
  try {
    isLoading.value = true;
    await userStore.getMyCompanies();
  } catch (error) {
    console.error('Error loading companies:', error);
  } finally {
    isLoading.value = false;
  }
};

// Initialize
onMounted(() => {
  loadCompanies();
});
</script>

<style scoped>
.linked-companies-component {
  max-width: 1320px;
  padding: 0.5rem 0 1rem;
}

.section-header {
  margin-bottom: 26px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 6px 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7b3dbd;
}

.header-content {
  flex: 1;
}

.section-header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #231734;
  margin: 0 0 6px 0;
  letter-spacing: -0.04em;
}

.section-description {
  color: #75697f;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
  max-width: 560px;
}

.btn-link-accounts {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #5f1ba4 0%, #7b3dbd 100%);
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-link-accounts:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-link-accounts:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-link-accounts svg {
  width: 20px;
  height: 20px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  color: #3b82f6;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

.loading-state p {
  margin-top: 16px;
  color: #64748b;
}

.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert-success {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
}

.companies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
  margin-bottom: 32px;
}

.company-card {
  background: linear-gradient(180deg, #ffffff, #fcf8fd);
  border: 1px solid #eee3f3;
  border-radius: 22px;
  padding: 22px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 14px 36px rgba(53, 0, 98, 0.05);
}

.company-card:hover {
  box-shadow: 0 20px 40px rgba(53, 0, 98, 0.08);
  border-color: #dcc9ee;
}

.company-card.active {
  border-color: #cda9f1;
  background: linear-gradient(180deg, #fcf6ff, #f8f0ff);
}

.company-topline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.company-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #5f1ba4 0%, #7b3dbd 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.company-info h3 {
  font-size: 22px;
  font-weight: 700;
  color: #231734;
  margin: 0 0 8px 0;
  letter-spacing: -0.04em;
}

.company-location,
.company-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #72677d;
  margin: 4px 0;
}

.company-location svg,
.company-phone svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.company-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  background: #f3ebfb;
  color: #6a3d95;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.company-badge.active {
  background: #e8f7eb;
  color: #17754a;
}

.company-actions {
  margin-top: auto;
}

.active-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.active-badge svg {
  width: 16px;
  height: 16px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #fff;
  color: #4b4056;
  border: 1px solid #dfd3e6;
}

.btn-primary:hover:not(:disabled) {
  background: #faf7fc;
  border-color: #cdbddb;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(53, 0, 98, 0.08);
}

.btn .spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 22px;
  border: 1px solid #eee3f3;
  box-shadow: 0 14px 34px rgba(53, 0, 98, 0.05);
  margin-bottom: 32px;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: #9ca3af;
  margin: 0 auto;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 16px 0 8px 0;
}

.empty-state p {
  color: #64748b;
}

.info-box {
  background: linear-gradient(180deg, #fbf7fd, #f5edf9);
  border: 1px solid #ebdef2;
  border-radius: 22px;
  padding: 20px;
  display: flex;
  gap: 16px;
}

.info-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #6d30b2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.info-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #231734;
  margin: 0 0 8px 0;
}

.info-content p {
  font-size: 14px;
  color: #75697f;
  margin: 0;
  line-height: 1.6;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .companies-grid {
    grid-template-columns: 1fr;
  }

  .info-box {
    flex-direction: column;
    text-align: center;
  }

  .info-icon {
    margin: 0 auto;
  }
}
</style>
