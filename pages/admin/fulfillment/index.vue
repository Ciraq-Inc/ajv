<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})

const router = useRouter()
onMounted(() => {
  void router.replace('/admin/fulfillment/requests')
})
</script>
