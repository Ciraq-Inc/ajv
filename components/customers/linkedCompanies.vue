<template>
  <div class="linked-companies-component">
    <div class="section-header">
      <h2>Linked Companies</h2>
      <p class="section-description">
        Manage your company accounts. You can switch between companies to place orders.
      </p>
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
        <div class="company-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
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
      <h3>No linked companies</h3>
      <p>You don't have any companies linked to your account yet</p>
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
        <h4>About Linked Companies</h4>
        <p>
          Click on any company to visit their online store and browse their products.
          Each company has its own unique store where you can place orders.
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
const companies = computed(() => userStore.companies || []);

// Check if company is active
const isActiveCompany = (company) => {
  return userStore.currentCompany?.company_id === company.company_id;
};

// Generate slug from company name
const generateCompanySlug = (companyName) => {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Navigate to company store
const goToCompanyStore = (company) => {
  const slug = generateCompanySlug(company.domain_name);
  navigateTo(`/${slug}`);
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
  max-width: 1000px;
  padding: 10px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.section-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.company-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.company-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.company-card.active {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.company-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
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
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.company-location,
.company-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  margin: 4px 0;
}

.company-location svg,
.company-phone svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
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
  border-radius: 8px;
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
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
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
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
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
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
}

.info-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #0ea5e9;
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
  color: #1e293b;
  margin: 0 0 8px 0;
}

.info-content p {
  font-size: 14px;
  color: #64748b;
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
