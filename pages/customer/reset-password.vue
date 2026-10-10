<template>
  <EmailResetPassword :submit="submit" sign-in-href="/" request-new-href="/" />
</template>

<script setup lang="ts">
import EmailResetPassword from '~/components/auth/EmailResetPassword.vue'
import { useUserStore } from '~/stores/user'

definePageMeta({ layout: false })
useHead({
  title: 'Reset your password',
  meta: [
    { name: 'robots', content: 'noindex' },
    { name: 'referrer', content: 'no-referrer' },
  ],
})

const userStore = useUserStore()

const submit = (token: string, newPassword: string) => userStore.resetPasswordWithEmailToken(token, newPassword)
</script>
