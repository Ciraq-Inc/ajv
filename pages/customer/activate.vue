<template>
  <div class="activate-page">
    <div class="activate-card">
      <div class="activate-logo">
        <img src="/brand/rig-wordmark.svg" alt="MedsGH" class="h-10" />
      </div>

      <template v-if="status === 'idle' || status === 'submitting'">
        <h1 class="activate-title">Set your password</h1>
        <p class="activate-sub">Welcome to MedsGH! Create a password to access your account and track your order.</p>

        <form @submit.prevent="submit" class="activate-form">
          <div class="form-field">
            <label for="password">New password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              minlength="8"
              required
              placeholder="At least 8 characters"
              class="form-input"
              :disabled="status === 'submitting'"
            />
          </div>
          <div class="form-field">
            <label for="confirm">Confirm password</label>
            <input
              id="confirm"
              v-model="confirm"
              type="password"
              minlength="8"
              required
              placeholder="Repeat your password"
              class="form-input"
              :disabled="status === 'submitting'"
            />
          </div>
          <p v-if="error" class="activate-error">{{ error }}</p>
          <button type="submit" class="activate-btn" :disabled="status === 'submitting'">
            {{ status === 'submitting' ? 'Activating…' : 'Activate account' }}
          </button>
        </form>
      </template>

      <template v-else-if="status === 'done'">
        <div class="activate-success">
          <p>Your account is ready. You can now log in and track your order.</p>
          <NuxtLink to="/customer" class="activate-btn">Go to my orders</NuxtLink>
        </div>
      </template>

      <template v-else-if="status === 'invalid'">
        <div class="activate-error-block">
          <p>This activation link is invalid or has already been used. Contact us if you need help.</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const { call: apiCall } = useApi()

const token = ref<string>('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const status = ref<'idle' | 'submitting' | 'done' | 'invalid'>('idle')

onMounted(() => {
  const t = String(route.query.token ?? '')
  if (!t) {
    status.value = 'invalid'
    return
  }
  token.value = t
})

const submit = async () => {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }

  status.value = 'submitting'
  try {
    await apiCall('POST', '/api/order-requests/customer/activate', {
      token: token.value,
      password: password.value
    })
    status.value = 'done'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Activation failed. The link may have expired.'
    if (error.value.toLowerCase().includes('invalid') || error.value.toLowerCase().includes('expired')) {
      status.value = 'invalid'
    } else {
      status.value = 'idle'
    }
  }
}
</script>

<style scoped>
.activate-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fc;
  padding: 1.5rem;
}

.activate-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.activate-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.activate-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 0.4rem;
  text-align: center;
}

.activate-sub {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1.5rem;
}

.activate-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  outline: none;
}

.form-input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124,58,237,.15);
}

.activate-btn {
  display: block;
  width: 100%;
  text-align: center;
  background: #4F217A;
  color: #fff;
  font-weight: 700;
  padding: 0.7rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  text-decoration: none;
}

.activate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activate-error {
  color: #dc2626;
  font-size: 0.82rem;
}

.activate-error-block {
  color: #dc2626;
  font-size: 0.9rem;
  text-align: center;
}

.activate-success {
  text-align: center;
}

.activate-success p {
  margin-bottom: 1.25rem;
  color: #374151;
}
</style>
