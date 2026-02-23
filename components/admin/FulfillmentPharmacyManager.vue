<template>
    <div class="fulfillment-manager bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <h4 class="text-lg font-bold text-gray-800 m-0">Order Fulfillment Manager</h4>
            <button @click="copyFullRequest" class="btn-copy-all">
                <ClipboardDocumentIcon class="icon-sm" /> Copy Full Request Info
            </button>
        </div>

        <div class="p-4">
            <div v-if="!pharmacies || pharmacies.length === 0" class="text-center py-8 text-gray-500">
                <div class="flex justify-center mb-2">
                    <BuildingOfficeIcon class="icon-lg text-gray-300" />
                </div>
                <p>No pharmacies found nearby. Enter processing mode to find pharmacies.</p>
            </div>

            <div v-else class="pharmacy-list space-y-4">
                <div v-for="pharm in pharmacies" :key="pharm.id"
                    class="pharmacy-item flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl transition-all duration-200"
                    :class="getPharmacyItemClass(pharm)">

                    <div class="flex-1 mb-4 md:mb-0">
                        <div class="flex items-center gap-2 mb-1">
                            <strong class="text-gray-900 text-lg">{{ pharm.name }}</strong>
                            <span class="distance-tag">{{ pharm.distance_km?.toFixed(1) }} km</span>
                            <span v-if="pharm.is_confirmed" class="confirmed-tag">CONFIRMED</span>
                        </div>

                        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span class="flex items-center gap-1">
                                <MapPinIcon class="icon-xs opacity-70" /> {{ pharm.location || 'No location' }}
                            </span>
                            <span v-if="pharm.tel1" class="flex items-center gap-1">
                                <PhoneIcon class="icon-xs opacity-70" /> {{ pharm.tel1 }}
                            </span>
                        </div>

                        <div v-if="pharm.contacted_at"
                            class="mt-2 text-xs flex items-center gap-1 font-medium text-emerald-600">
                            <CheckIcon class="icon-xs" /> Contacted {{ formatDate(pharm.contacted_at) }}
                        </div>
                    </div>

                    <div class="actions-group flex flex-wrap items-center gap-2">
                        <!-- Copy Text for this pharmacy -->
                        <button @click="copyRequestText(pharm)" class="btn-icon-action"
                            title="Copy text for this pharmacy">
                            <DocumentTextIcon class="icon-sm" />
                        </button>

                        <!-- WhatsApp -->
                        <button v-if="pharm.whatsapp_url" @click="$emit('contact', pharm)" class="btn-whatsapp-sm">
                            <ChatBubbleLeftRightIcon class="icon-sm" /> WhatsApp
                        </button>

                        <!-- Status Actions -->
                        <div class="flex items-center gap-1 ml-2 border-l pl-3">
                            <button @click="$emit('confirm', pharm)" :disabled="isConfirmedElsewhere(pharm)"
                                class="btn-status btn-confirm" :class="{ 'active': pharm.is_confirmed }">
                                {{ pharm.is_confirmed ? 'Confirmed' : 'Confirm' }}
                            </button>
                            <button @click="$emit('out-of-stock', pharm)" class="btn-status btn-cancel"
                                :class="{ 'active': pharm.pharmacy_status === 'out_of_stock' }">
                                {{ pharm.pharmacy_status === 'out_of_stock' ? 'No Stock' : 'Out of Stock' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notification Toast (Internal) -->
        <div v-if="toast" class="internal-toast" :class="toast.type">
            {{ toast.text }}
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import {
    ClipboardDocumentIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    PhoneIcon,
    CheckIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    request: {
        type: Object,
        required: true
    },
    pharmacies: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['contact', 'confirm', 'out-of-stock'])

const toast = ref(null)

const showToast = (text, type = 'success') => {
    toast.value = { text, type }
    setTimeout(() => { toast.value = null }, 3000)
}

const formatDate = (d) => {
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const getPharmacyItemClass = (pharm) => {
    if (pharm.is_confirmed) return 'border-emerald-500 bg-emerald-50 shadow-sm'
    if (pharm.pharmacy_status === 'out_of_stock') return 'border-gray-200 bg-gray-50 opacity-60'
    return 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md'
}

const isConfirmedElsewhere = (pharm) => {
    if (pharm.is_confirmed) return false
    return props.pharmacies.some(p => p.is_confirmed)
}

const formatRequestDetails = () => {
    const items = props.request.items.map(item => `- ${item.product_name} x${item.quantity}`).join('\n')
    return `*Order Request #${props.request.request_number}*\n\n*Items:*\n${items}\n\n*Delivery Address:*\n${props.request.delivery_address || 'Not set'}\n\n*Customer Notes:*\n${props.request.customer_notes || 'None'}`
}

const copyRequestText = (pharm) => {
    const text = formatRequestDetails()
    navigator.clipboard.writeText(text)
    showToast(`Copied items for ${pharm.name}`, 'success')
}

const copyFullRequest = () => {
    const text = formatRequestDetails()
    navigator.clipboard.writeText(text)
    showToast('Full request info copied to clipboard', 'success')
}
</script>

<style scoped>
.fulfillment-manager {
    margin-top: 1.5rem;
}

.icon-xs {
    width: 14px;
    height: 14px;
}

.icon-sm {
    width: 18px;
    height: 18px;
}

.icon-lg {
    width: 48px;
    height: 48px;
}

.distance-tag {
    background: #f3f4f6;
    color: #4b5563;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
}

.confirmed-tag {
    background: #d1fae5;
    color: #065f46;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
}

.btn-copy-all {
    background: white;
    border: 1px solid #d1d5db;
    padding: 0.5rem 0.875rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-copy-all:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-whatsapp-sm {
    background: #25d366;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s;
}

.btn-whatsapp-sm:hover {
    background: #128c7e;
    transform: translateY(-1px);
}

.btn-icon-action {
    background: white;
    border: 1px solid #e5e7eb;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;
}

.btn-icon-action:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.btn-status {
    padding: 0.5rem 0.875rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-confirm {
    background: white;
    border: 1px solid #10b981;
    color: #10b981;
}

.btn-confirm:hover:not(:disabled) {
    background: #10b981;
    color: white;
}

.btn-confirm.active {
    background: #10b981;
    color: white;
}

.btn-cancel {
    background: white;
    border: 1px solid #ef4444;
    color: #ef4444;
}

.btn-cancel:hover:not(:disabled) {
    background: #ef4444;
    color: white;
}

.btn-cancel.active {
    background: #ef4444;
    color: white;
}

.btn-status:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    filter: grayscale(1);
}

.internal-toast {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10;
    animation: slideIn 0.3s ease-out;
}

.internal-toast.success {
    background: #10b981;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
