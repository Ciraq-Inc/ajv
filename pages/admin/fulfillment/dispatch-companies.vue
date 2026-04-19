<template>
  <div>
    <FulfillmentTabs>
      <DispatchCompaniesPage />
    </FulfillmentTabs>
  </div>
</template>

<script setup>
import DispatchCompaniesPage from '../dispatch-companies.vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
