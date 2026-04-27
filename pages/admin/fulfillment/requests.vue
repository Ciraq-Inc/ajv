<template>
  <div>
    <SharedOrderRequestsPage />
  </div>
</template>

<script setup>
import SharedOrderRequestsPage from './order-requests.vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
