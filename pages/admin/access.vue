<template>
  <div class="access-management">
    <div class="tabs-container">
      <div class="tabs">
          <button 
          @click="activeTab = 'companies'"
          :class="['tab', { active: activeTab === 'companies' }]"
        >
          <BuildingStorefrontIcon class="tab-icon" />
          Companies Management
        </button>
        <button 
          @click="activeTab = 'api-keys'"
          :class="['tab', { active: activeTab === 'api-keys' }]"
        >
          <KeyIcon class="tab-icon" />
          API Keys
        </button>
        <button 
          @click="activeTab = 'user-access'"
          :class="['tab', { active: activeTab === 'user-access' }]"
        >
          <BuildingOfficeIcon class="tab-icon" />
          Multi-Tenant Users
        </button>
        <button
          @click="activeTab = 'store-settings'"
          :class="['tab', { active: activeTab === 'store-settings' }]"
        >
          <Cog6ToothIcon class="tab-icon" />
          Store Settings
        </button>
      
      </div>
    </div>

    <div class="tab-content">
      <CompanyAccessMgt v-if="activeTab === 'api-keys'" />
      <MultiTenantUserAccess v-else-if="activeTab === 'user-access'" />
      <CompanyStoreSettings v-else-if="activeTab === 'store-settings'" />
      <CompaniesManagement v-else-if="activeTab === 'companies'" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { KeyIcon, BuildingOfficeIcon, BuildingStorefrontIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import CompanyAccessMgt from '~/components/access/companyAccessMgt.vue'
import MultiTenantUserAccess from '~/components/access/multiTenantUserAccess.vue'
import CompanyStoreSettings from '~/components/access/CompanyStoreSettings.vue'
import CompaniesManagement from '~/components/analytics/companies.vue'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout'
})

const route = useRoute()
const validTabs = ['api-keys', 'user-access', 'companies', 'store-settings']
const activeTab = ref(validTabs.includes(route.query.tab) ? route.query.tab : 'api-keys')

watch(
  () => route.query.tab,
  (nextTab) => {
    if (validTabs.includes(nextTab)) {
      activeTab.value = nextTab
    }
  }
)
</script>

<style scoped>
.access-management {
  max-width: 1400px;
  margin: 0 auto;
}

.tabs-container {
  background: white;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 16px 16px 0;
  border-bottom: 2px solid #e2e8f0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  position: relative;
  top: 2px;
}

.tab:hover {
  color: #1e293b;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
}

.tab.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
}

.tab-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.tab-content {
  padding: 24px 0 0;
}
</style>
