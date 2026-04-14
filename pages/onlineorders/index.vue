<template>
  <SharedOrderRequestsPage />
</template>

<script setup>
import SharedOrderRequestsPage from '../admin/order-requests.vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'onlineorders'
})
</script>
