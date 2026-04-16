<template>
    <div v-if="loading" class="text-center py-8 text-gray-400">
        Loading delivery details...
    </div>

    <div v-else-if="!delivery" class="text-center py-8 text-red-500">
        Delivery not found.
    </div>

    <div v-else class="space-y-6">
        <!-- Back Button -->
        <button @click="router.back()" class="text-blue-400 hover:text-blue-300 flex items-center mb-4">
            ← Back
        </button>

        <!-- Header Status -->
        <div class="bg-gray-800 p-4 rounded-lg shadow border-l-4" :class="getStatusColor(delivery.delivery_status)">
            <div class="flex justify-between items-center mb-2">
                <h2 class="text-lg font-bold">Delivery #{{ delivery.id }}</h2>
                <span class="text-sm px-2 py-0.5 rounded uppercase font-bold text-black"
                    :class="getStatusBadge(delivery.delivery_status)">
                    {{ delivery.delivery_status.replace('_', ' ') }}
                </span>
            </div>
            <div v-if="delivery.distance_km" class="text-sm text-gray-400">
                Distance: {{ delivery.distance_km }} km • Fee: GH₵{{ delivery.delivery_fee }}
            </div>
        </div>

        <!-- PICKUP SECTION -->
        <div class="bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-sm font-bold text-gray-500 uppercase mb-3">1. Pickup From</h3>

            <div class="font-bold text-lg mb-1">{{ delivery.pharmacy_name }}</div>
            <div class="text-gray-400 mb-2">{{ delivery.pickup_address || 'Address not available' }}</div>

            <div class="flex space-x-2">
                <a v-if="delivery.pickup_address"
                    :href="`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.pickup_address)}`"
                    target="_blank"
                    class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-center flex items-center justify-center space-x-2">
                    <span>📍 Navigate</span>
                </a>
                <a v-if="delivery.pharmacy_phone" :href="`tel:${delivery.pharmacy_phone}`"
                    class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center">
                    📞
                </a>
            </div>

            <!-- Action: Confirm Pickup -->
            <button v-if="delivery.delivery_status === 'assigned' || delivery.delivery_status === 'picking_up'"
                @click="updateStatus('picked_up')"
                class="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded text-lg shadow-lg"
                :disabled="updating">
                {{ updating ? 'Updating...' : '📦 Confirm Pickup' }}
            </button>
        </div>

        <!-- DROPOFF SECTION -->
        <div class="bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-sm font-bold text-gray-500 uppercase mb-3">2. Dropoff To</h3>

            <div class="font-bold text-lg mb-1">Customer (Req #{{ delivery.request_number }})</div>
            <div class="text-gray-400 mb-2">{{ delivery.delivery_address }}</div>

            <div class="flex space-x-2">
                <a :href="`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.delivery_address)}`"
                    target="_blank"
                    class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-center flex items-center justify-center space-x-2">
                    <span>📍 Navigate</span>
                </a>
                <!-- Ensure we have customer phone if available -->
                <!-- Assuming frontend doesn't have it unless joined. Backend should return it. -->
            </div>

            <!-- Action: Start Delivery -->
            <button v-if="delivery.delivery_status === 'picked_up'" @click="updateStatus('in_transit')"
                class="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded text-lg shadow-lg"
                :disabled="updating">
                {{ updating ? 'Updating...' : '🚚 Start Transit' }}
            </button>

            <!-- Action: Complete Delivery -->
            <button v-if="delivery.delivery_status === 'in_transit'" @click="updateStatus('delivered')"
                class="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded text-lg shadow-lg"
                :disabled="updating">
                {{ updating ? 'Updating...' : '✅ Complete Delivery' }}
            </button>
        </div>

    </div>
</template>

<script setup>
definePageMeta({
    layout: 'driver',
    middleware: 'driverAuth'
})

const route = useRoute()
const router = useRouter()
const delivery = ref(null)
const loading = ref(true)
const updating = ref(false)

const startRefresh = () => {
    // optional poll
}

const fetchDelivery = async () => {
    loading.value = true
    try {
        const token = localStorage.getItem('driver_token')
        if (!token) return router.push('/driver/login')

        const response = await fetch(`http://localhost:3000/api/driver/deliveries/${route.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()

        if (data.success) {
            delivery.value = data.data
        } else {
            console.error('Failed to fetch delivery')
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const updateStatus = async (newStatus) => {
    if (!confirm(`Mark as ${newStatus.replace('_', ' ')}?`)) return

    updating.value = true
    try {
        const token = localStorage.getItem('driver_token')
        const response = await fetch(`http://localhost:3000/api/driver/deliveries/${delivery.value.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        })

        const data = await response.json()
        if (data.success) {
            // Refresh local state
            delivery.value.delivery_status = newStatus
        } else {
            alert(data.message || 'Failed to update')
        }
    } catch (e) {
        alert('Error updating status')
    } finally {
        updating.value = false
    }
}

const getStatusColor = (status) => {
    // reusing from index
    switch (status) {
        case 'assigned': return 'border-blue-500'
        case 'picking_up': return 'border-yellow-500'
        case 'picked_up': return 'border-purple-500'
        case 'in_transit': return 'border-green-500'
        case 'delivered': return 'border-gray-500 border-opacity-50'
        default: return 'border-gray-500'
    }
}

const getStatusBadge = (status) => {
    switch (status) {
        case 'assigned': return 'bg-blue-400'
        case 'picking_up': return 'bg-yellow-400'
        case 'picked_up': return 'bg-purple-400'
        case 'in_transit': return 'bg-green-400'
        case 'delivered': return 'bg-gray-400'
        default: return 'bg-gray-400'
    }
}

onMounted(() => {
    fetchDelivery()
})
</script>
