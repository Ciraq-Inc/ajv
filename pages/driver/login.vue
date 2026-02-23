<template>
    <div class="max-w-md mx-auto mt-10">
        <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-6 text-center">Driver Login</h2>

            <form @submit.prevent="handleLogin" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Username</label>
                    <input v-model="username" type="text"
                        class="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                        required />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">Password</label>
                    <input v-model="password" type="password"
                        class="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
                        required />
                </div>

                <div v-if="error" class="text-red-400 text-sm text-center">
                    {{ error }}
                </div>

                <button type="submit"
                    class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition"
                    :disabled="loading">
                    {{ loading ? 'Logging in...' : 'Login' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { useApi } from '~~/composables/useApi';
definePageMeta({
    layout: 'driver'
})


const router = useRouter()
const config = useRuntimeConfig()
const api = useApi()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
    loading.value = true
    error.value = ''

    try {
        // Assuming backend is at localhost:3000 or proxied via Nuxt config
        // Adjust API URL as needed. Does Nuxt proxy /api?
        // Usually standard Nuxt setup calls local API

        // Hardcoding URL for now if needed, or using relative if proxied
        const response = await api.post('/api/driver/login', {
            username: username.value,
            password: password.value
        })

        const data = await response.json()

        if (data.success) {
            localStorage.setItem('driver_token', data.token)
            localStorage.setItem('driver_info', JSON.stringify(data.driver))
            router.push('/driver')
        } else {
            error.value = data.message || 'Login failed'
        }
    } catch (e) {
        error.value = 'An error occurred. check connection.'
        console.error(e)
    } finally {
        loading.value = false
    }
}
</script>
