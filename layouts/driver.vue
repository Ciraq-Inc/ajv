<template>
    <div class="min-h-screen bg-gray-900 text-white font-sans">
        <!-- Header -->
        <header class="bg-gray-800 p-4 flex justify-between items-center shadow-md">
            <h1 class="text-xl font-bold text-blue-400">Driver Portal</h1>
            <button v-if="isAuthenticated" @click="logout" class="text-sm bg-red-600 px-3 py-1 rounded">
                Logout
            </button>
        </header>

        <!-- Content -->
        <main class="p-4">
            <slot />
        </main>
    </div>
</template>

<script setup>
const router = useRouter()
// Simple auth check state (to be replaced with Pinia or similar if available)
const isAuthenticated = ref(false)

onMounted(() => {
    if (process.client) {
        const token = localStorage.getItem('driver_token')
        isAuthenticated.value = !!token
    }
})

const logout = () => {
    if (process.client) {
        localStorage.removeItem('driver_token')
        localStorage.removeItem('driver_info')
        router.push('/driver/login')
    }
}
</script>
