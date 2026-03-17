<template>
  <div class="pharmacy-redirect"></div>
</template>

<script setup>
const route = useRoute()

await navigateTo(
  {
    path: `/${route.params.pharmacy}`,
    query: route.query
  },
  { replace: true, redirectCode: 301 }
)
</script>

<style scoped>
.pharmacy-redirect {
  min-height: 100vh;
}
</style>
