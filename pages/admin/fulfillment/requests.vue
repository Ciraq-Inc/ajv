<template>
  <div>
    <SharedOrderRequestsPage />
  </div>
</template>

<script setup lang="ts">
import SharedOrderRequestsPage from './order-requests.vue'

definePageMeta({
  requiredRole: 'order_processor',
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
