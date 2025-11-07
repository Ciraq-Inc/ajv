<template>
  <div class="user-access-page">
    <CompanyUserAccess />
  </div>
</template>

<script setup>
import CompanyUserAccess from '~/components/access/companyUserAccess.vue'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company'
})
</script>

<style scoped>
.user-access-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}
</style>
