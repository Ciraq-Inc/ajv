<template>
  <div class="dataconsumer-dashboard">
    <div class="page-header">
      <h1>Welcome, {{ adminName }}</h1>
      <p class="subtitle">Data Consumer Portal - Access your analytics reports</p>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <NuxtLink to="/dataconsumer/sales-reports" class="stat-card">
        <ChartBarIcon class="stat-icon blue" />
        <div class="stat-details">
          <div class="stat-label">Sales Reports</div>
          <p class="stat-description">View quarterly sales analytics</p>
        </div>
        <div class="stat-link">
          <ArrowRightIcon class="arrow-icon" />
        </div>
      </NuxtLink>

      <NuxtLink to="/dataconsumer/purchase-reports" class="stat-card">
        <DocumentChartBarIcon class="stat-icon green" />
        <div class="stat-details">
          <div class="stat-label">Purchase Reports</div>
          <p class="stat-description">View quarterly purchase analytics</p>
        </div>
        <div class="stat-link">
          <ArrowRightIcon class="arrow-icon" />
        </div>
      </NuxtLink>

    </div>

    <!-- Info Box -->
    <div class="info-box">
      <InfoIcon class="info-icon" />
      <div>
        <h3>About Your Portal</h3>
        <p>
          As a Data Consumer, you have read-only access to pharmaceutical sales and purchase analytics. 
          You can filter by time period, export data to CSV, and share reports via WhatsApp.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  UserIcon,
  ArrowRightIcon,
  InformationCircleIcon as InfoIcon,
} from '@heroicons/vue/24/outline';
import { useAdminStore } from '~/stores/admin';

definePageMeta({
  layout: 'dataconsumer',
  middleware: 'data-consumer-auth',
});

const adminStore = useAdminStore();

const adminName = computed(() => {
  const admin = adminStore.getAdmin;
  if (admin) {
    return admin.fname;
  }
  return 'User';
});
</script>

<style scoped>
.dataconsumer-dashboard {
  animation: fadeIn 0.3s ease-in;
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

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.stat-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  padding: 8px;
  flex-shrink: 0;
}

.stat-icon.blue {
  background: #dbeafe;
  color: #0284c7;
}

.stat-icon.green {
  background: #d1fae5;
  color: #059669;
}

.stat-icon.purple {
  background: #e9d5ff;
  color: #9333ea;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px;
}

.stat-description {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.stat-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #6366f1;
  transition: all 0.2s;
  flex-shrink: 0;
  pointer-events: none;
}

.stat-link:hover {
  background: #6366f1;
  color: white;
  transform: translateX(4px);
}

.arrow-icon {
  width: 20px;
  height: 20px;
}

/* Info Box */
.info-box {
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.info-icon {
  width: 24px;
  height: 24px;
  color: #0284c7;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-box h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
}

.info-box p {
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stat-card {
    gap: 12px;
    padding: 20px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
