<template>
  <EmailResetPassword :submit="submit" sign-in-href="/admin/login" request-new-href="/admin/login" />
</template>

<script setup lang="ts">
import EmailResetPassword from '~/components/auth/EmailResetPassword.vue'
import { useAdminStore } from '~/stores/admin'

// Public on purpose (the emailed link is the credential), so no admin-auth middleware.
definePageMeta({ layout: false })
useHead({
  title: 'Reset your admin password',
  meta: [
    { name: 'robots', content: 'noindex' },
    { name: 'referrer', content: 'no-referrer' },
  ],
})

const adminStore = useAdminStore()

// The admin store reports failure as a result rather than throwing; the form expects a rejection.
const submit = async (token: string, newPassword: string): Promise<void> => {
  const result = await adminStore.resetPassword(token, newPassword)
  if (!result.success) {
    throw { kind: ('kind' in result && result.kind) || 'unknown', message: result.message }
  }
}
</script>
