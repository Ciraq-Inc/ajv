<template>
  <div>
    <FulfillmentTabs>
      <SharedOrderRequestsPage />
    </FulfillmentTabs>
  </div>
</template>

<script setup>
import SharedOrderRequestsPage from '../order-requests.vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
