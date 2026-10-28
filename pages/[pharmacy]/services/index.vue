<template>
  <div />
</template>

<script setup>
// /<pharmacy>/services has no screen of its own. Signed-in staff go to their landing page and
// everyone else goes through the company-auth middleware to the login page.
import { defaultServicePage } from '~/utils/companyAccess'

definePageMeta({
  layout: false,
  middleware: ['company-auth'],
})

const route = useRoute()
const companyStore = useCompanyStore()
const pharmacy = String(route.params.pharmacy || '')
await navigateTo(`/${pharmacy}/services/${defaultServicePage(companyStore.userRole)}`, { replace: true })
</script>
