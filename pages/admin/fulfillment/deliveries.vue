<template>
  <div>
    <FulfillmentTabs />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})
</script>
