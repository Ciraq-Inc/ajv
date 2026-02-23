<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Active Deliveries</h2>
            <button @click="refresh" class="text-sm bg-gray-700 px-3 py-1 rounded">Refresh</button>
        </div>

        <div v-if="loading" class="text-center py-8 text-gray-400">
            Loading...
        </div>

        <div v-else-if="deliveries.length === 0" class="text-center py-8 text-gray-500 bg-gray-800 rounded-lg">
            No active deliveries needed.
        </div>

        <div v-else class="space-y-4">
            <div v-for="delivery in deliveries" :key="delivery.id"
                class="bg-gray-800 p-4 rounded-lg shadow cursor-pointer hover:bg-gray-750 border-l-4"
                :class="getStatusColor(delivery.delivery_status)" @click="openDelivery(delivery.id)">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-mono text-gray-400">#{{ delivery.id }}</span>
                    <span class="text-sm px-2 py-0.5 rounded uppercase font-bold text-black"
                        :class="getStatusBadge(delivery.delivery_status)">
                        {{ delivery.delivery_status.replace('_', ' ') }}
                    </span>
                </div>

                <div class="mb-2">
                    <div class="text-sm text-gray-400 mb-1">Pickup From</div>
                    <div class="font-medium text-white">{{ delivery.pharmacy_name }}</div>
                </div>

                <!-- Arrow -->
                <div class="text-center text-gray-500 my-1">↓</div>

                <div>
                    <!-- We don't have customer name easily in getAllDeliveries unless joined. 
                Using request_number or generic 'Customer' for list view. 
                Detail view will fetch full info. -->
                    <div class="text-sm text-gray-400 mb-1">Deliver To</div>
                    <div class="font-medium text-white">Customer (Req #{{ delivery.request_number }})</div>
                    <div class="text-xs text-gray-400 mt-1 truncate">{{ delivery.delivery_address }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'driver',
    middleware: 'driver-auth' // Need to create this middleware or check in onMounted
})

import { useApi } from '~~/composables/useApi';

const api = useApi();


const router = useRouter()
const deliveries = ref([])
const loading = ref(true)

const fetchDeliveries = async () => {
    loading.value = true
    try {
        const token = localStorage.getItem('driver_token')
        if (!token) {
            router.push('/driver/login')
            return
        }

        const response = await api.get('/api/driver/deliveries', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()

        if (data.success) {
            deliveries.value = data.data
        } else {
            console.error('Failed to fetch deliveries')
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const refresh = () => fetchDeliveries()

const openDelivery = (id) => {
    router.push(`/driver/delivery/${id}`)
}

const getStatusColor = (status) => {
    switch (status) {
        case 'assigned': return 'border-blue-500'
        case 'picking_up': return 'border-yellow-500'
        case 'picked_up': return 'border-purple-500'
        case 'in_transit': return 'border-green-500'
        default: return 'border-gray-500'
    }
}

const getStatusBadge = (status) => {
    switch (status) {
        case 'assigned': return 'bg-blue-400'
        case 'picking_up': return 'bg-yellow-400'
        case 'picked_up': return 'bg-purple-400'
        case 'in_transit': return 'bg-green-400'
        default: return 'bg-gray-400'
    }
}

onMounted(() => {
    fetchDeliveries()
})
</script>
