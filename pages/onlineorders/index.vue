<template>
  <div />
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth'
})

const router = useRouter()

onMounted(() => {
  router.replace('/admin/fulfillment/requests')
})
</script>
