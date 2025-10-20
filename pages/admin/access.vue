<template>
  <div class="access-management">
    <div class="page-header">
      <div>
        <h1>Access Management</h1>
        <p class="page-description">Manage admin users, roles, and company API keys</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- User Access Management Tab -->
      <div v-if="activeTab === 'users'" class="tab-panel">
        <UserAccessMgt />
      </div>

      <!-- Company Access Management Tab -->
      <div v-if="activeTab === 'companies'" class="tab-panel">
        <CompanyAccessMgt />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UserAccessMgt from '~/components/access/userAccessMgt.vue'
import CompanyAccessMgt from '~/components/access/companyAccessMgt.vue'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout'
})

// State
const activeTab = ref('users')

// Tabs
const tabs = [
  { id: 'users', icon: '👥', label: 'User Access Management' },
  { id: 'companies', icon: '🔑', label: 'Company API Keys' }
]
</script>

<style scoped>
.access-management {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-description {
  color: #64748b;
  margin: 0;
  font-size: 16px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #3b82f6;
  background: #f8fafc;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #f0f9ff;
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  white-space: nowrap;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

.tab-panel {
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

/* Responsive */
@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
    border-bottom: none;
  }

  .tab-button {
    width: 100%;
    justify-content: flex-start;
    border-left: 3px solid transparent;
    border-bottom: none;
    margin-bottom: 0;
    margin-left: -2px;
  }

  .tab-button.active {
    border-left-color: #3b82f6;
    border-bottom-color: transparent;
  }
}
</style>
