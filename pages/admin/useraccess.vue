<template>
  <div class="user-access-management-page">
    <UserAccessMgt />
  </div>
</template>

<script setup>
import UserAccessMgt from '~/components/access/userAccessMgt.vue'

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout'
})
</script>

<style scoped>
.user-access-management-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
