<template>
  <div>
    <SharedOrderRequestsPage />
  </div>
</template>

<script setup lang="ts">
import SharedOrderRequestsPage from './order-requests.vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
