<template>
  <div />
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
})

const router = useRouter()
onMounted(() => {
  router.replace('/admin/fulfillment/requests')
})
</script>
