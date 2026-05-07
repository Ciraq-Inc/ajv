<template>
  <div class="purchase-reports-coming-soon">
    <h1>Purchase Reports</h1>
    <p>Coming Soon</p>
  </div>
</template>

<script setup>
import { useAdminStore } from '~/stores/admin'

definePageMeta({
  layout: 'dataconsumer',
  middleware: 'data-consumer-auth',
})

const adminStore = useAdminStore()
</script>

<style scoped>
.purchase-reports-coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.purchase-reports-coming-soon h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.purchase-reports-coming-soon p {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  text-align: center;
}
</style>
