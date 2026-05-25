<template>
  <div class="pharmacy-redirect"></div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

await navigateTo(
  {
    path: `/${String(route.params['pharmacy'])}`,
    query: route.query as Record<string, string>,
  },
  { replace: true, redirectCode: 301 }
)
</script>

<style scoped>
.pharmacy-redirect {
  min-height: 100vh;
}
</style>
