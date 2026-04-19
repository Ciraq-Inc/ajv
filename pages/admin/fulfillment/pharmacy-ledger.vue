<template>
  <div>
    <FulfillmentTabs>
      <PharmacyLedgerPage />
    </FulfillmentTabs>
  </div>
</template>

<script setup>
import PharmacyLedgerPage from '../pharmacy-ledger.vue'

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
