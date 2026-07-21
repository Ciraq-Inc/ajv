<template>
  <div class="admin-clearance-sale">
    <div class="page-header">
      <div>
        <h1 class="page-title">Clearance Products</h1>
        <p class="page-subtitle">Every product currently marked down for clearance, across all pharmacies</p>
      </div>
      <div v-if="totalLive !== null" class="live-count-chip">
        {{ formatNumber(totalLive) }} live
      </div>
    </div>

    <ProductsTable
      clearance-only
      :show-title="false"
      :show-company-filter="true"
      :show-pharmacy-search="true"
      :autoload="true"
      :page-size="50"
      @loaded="onLoaded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProductsTable from '~/components/analytics/ProductsTable.vue'

definePageMeta({ layout: 'admin-layout', middleware: ['admin-auth'] })

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

const totalLive = ref<number | null>(null)

const onLoaded = ({ pagination }: { products: unknown[]; pagination: Pagination }): void => {
  totalLive.value = pagination.total
}

const formatNumber = (num: number): string => num.toLocaleString('en-US')
</script>

<style scoped>
.admin-clearance-sale {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.live-count-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(34, 197, 94, 0.1);
  color: #059669;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .admin-clearance-sale {
    padding: 16px;
  }
}
</style>
