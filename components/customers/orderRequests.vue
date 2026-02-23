<template>
    <div class="order-requests">
        <!-- Sub-tabs -->
        <div class="sub-tabs">
            <button @click="subTab = 'new'" class="sub-tab" :class="{ active: subTab === 'new' }">
                <PlusCircleIcon class="tab-svg" /> New Request
            </button>
            <button @click="subTab = 'list'; fetchMyRequests()" class="sub-tab" :class="{ active: subTab === 'list' }">
                <ClipDocList class="tab-svg" /> My Requests
                <span v-if="myRequests.length" class="badge">{{ myRequests.length }}</span>
            </button>
        </div>

        <!-- ====== NEW REQUEST FORM ====== -->
        <div v-if="subTab === 'new'" class="form-section">
            <!-- Step Indicator -->
            <div class="step-bar">
                <div v-for="(step, i) in ['Items', 'Delivery', 'Review']" :key="i" class="step-item"
                    :class="{ active: currentStep === i, done: currentStep > i }">
                    <div class="step-dot">
                        <CheckIcon v-if="currentStep > i" class="step-svg" />
                        <span v-else>{{ i + 1 }}</span>
                    </div>
                    <span class="step-label">{{ step }}</span>
                    <div v-if="i < 2" class="step-line" :class="{ filled: currentStep > i }"></div>
                </div>
            </div>

            <!-- STEP 0: Items -->
            <div v-if="currentStep === 0" class="step-content">
                <h3 class="step-title">What do you need?</h3>
                <p class="step-desc">Add each medicine or product you'd like us to find.</p>

                <!-- Location Prompt -->
                <button @click="getLocation" :disabled="gettingLocation" class="location-btn mb-4"
                    :class="{ set: customerLat }">
                    <div class="location-icon-wrap" :class="{ set: customerLat }">
                        <MapPinIconSolid v-if="customerLat" class="loc-svg" />
                        <ArrowPathIcon v-else-if="gettingLocation" class="loc-svg spin" />
                        <MapPinIcon v-else class="loc-svg" />
                    </div>
                    <div class="location-text">
                        <strong>{{ locationLabel }}</strong>
                        <span>{{ locationSublabel }}</span>
                    </div>
                    <CheckCircleIconSolid v-if="customerLat" class="location-check-svg" />
                </button>

                <div class="items-list">
                    <div v-for="(item, index) in requestItems" :key="index" class="item-row">
                        <span class="item-num">{{ index + 1 }}</span>
                        <div class="input-wrap relative">
                            <input v-model="item.product_name" type="text" placeholder="e.g. Paracetamol 500mg"
                                class="item-input" @input="onProductInput(item)" @focus="onProductInput(item)"
                                @blur="closeDropdown(item)" />

                            <!-- Search Dropdown -->
                            <div v-if="item.showDropdown && (item.searchResults.length || item.loading)"
                                class="search-dropdown">
                                <div v-if="item.loading" class="search-item loading">
                                    <ArrowPathIcon class="spin w-4 h-4 mr-2" /> Searching...
                                </div>
                                <template v-else>
                                    <div v-for="(res, idx) in item.searchResults" :key="res.id || idx"
                                        @mousedown.prevent="selectProduct(item, res)" class="search-item">
                                        <div class="font-medium text-gray-900">{{ res.product_description }}</div>
                                        <div class="text-xs text-gray-500">
                                            {{ [res.strength, res.unit].filter(Boolean).join(' • ') }}
                                        </div>
                                        <div v-if="res.available_at" class="text-xs text-green-600 mt-1 font-medium">
                                            In stock nearby
                                            <!-- • From GHS {{ Number(res.min_price).toFixed(2) }} -->
                                        </div>
                                    </div>
                                    <div v-if="item.searchResults.length === 0 && item.product_name.length > 2"
                                        class="search-item no-results">
                                        No matches found. Using custom entry.
                                    </div>
                                </template>
                            </div>
                        </div>
                        <input v-model.number="item.quantity" type="number" min="1" placeholder="Qty"
                            class="qty-input" />
                        <button v-if="requestItems.length > 1" @click="requestItems.splice(index, 1)" class="remove-btn"
                            title="Remove">
                            <XMarkIcon class="rm-svg" />
                        </button>
                    </div>
                </div>

                <button @click="addItem" class="add-item-btn">
                    <PlusIcon class="add-svg" /> Add Another Item
                </button>

                <!-- Prescription -->
                <div class="prescription-box">
                    <CameraIcon class="prescription-svg" />
                    <div class="prescription-text">
                        <strong>Have a prescription?</strong>
                        <span>Upload a photo and we'll process the items for you</span>
                    </div>
                    <label class="upload-label">
                        <ArrowUpTrayIcon class="upload-svg" />
                        {{ prescriptionFile ? prescriptionFile.name : 'Choose Photo' }}
                        <input type="file" accept="image/*" @change="prescriptionFile = $event.target.files[0] || null"
                            class="hidden-input" />
                    </label>
                </div>
            </div>

            <!-- STEP 1: Delivery -->
            <div v-if="currentStep === 1" class="step-content">
                <h3 class="step-title">Delivery Details</h3>
                <p class="step-desc">Tell us where to deliver your order.</p>

                <div class="form-group">
                    <label>Delivery Address</label>
                    <textarea v-model="deliveryAddress" rows="2"
                        placeholder="e.g. Room 12, Kofi Mensah Hostel, University of Ghana, Legon"
                        class="form-textarea"></textarea>
                </div>

                <div class="form-group">
                    <label>Notes <span class="optional">(optional)</span></label>
                    <textarea v-model="customerNotes" rows="2" placeholder="e.g. brand preference, dosage form..."
                        class="form-textarea"></textarea>
                </div>
            </div>

            <!-- STEP 2: Review -->
            <div v-if="currentStep === 2" class="step-content">
                <h3 class="step-title">Review Your Request</h3>
                <p class="step-desc">Confirm everything looks good before submitting.</p>

                <div class="review-box">
                    <div class="review-section">
                        <span class="review-label">Items ({{ validItems.length }})</span>
                        <div v-for="(item, i) in validItems" :key="i" class="review-item">
                            <span>{{ item.product_name }}</span>
                            <span class="review-qty">× {{ item.quantity }}</span>
                        </div>
                    </div>
                    <div v-if="prescriptionFile" class="review-attach">
                        <PaperClipIcon class="attach-svg" /> {{ prescriptionFile.name }}
                    </div>
                    <div class="review-meta">
                        <div class="review-row"><span>📍 Location</span><span>{{ customerLat ? 'Set' : 'Not set'
                                }}</span></div>
                        <div class="review-row"><span>🏠 Address</span><span class="review-addr">{{ deliveryAddress ||
                            'Not provided' }}</span></div>
                    </div>
                </div>

                <div class="fee-notice">
                    <InformationCircleIcon class="info-svg" />
                    <div>
                        <strong>A small request fee may be deducted from your wallet</strong>
                        <span>Prices will be shared with you before any payment is taken</span>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <div class="step-nav">
                <button v-if="currentStep > 0" @click="currentStep--" class="nav-back">
                    <ChevronLeftIcon class="nav-svg" /> Back
                </button>
                <div v-else></div>

                <button v-if="currentStep < 2" @click="currentStep++" :disabled="!canProceed" class="nav-next">
                    Continue
                    <ChevronRightIcon class="nav-svg" />
                </button>
                <button v-else @click="submitRequest" :disabled="!canSubmit || isSubmitting" class="nav-submit">
                    <template v-if="isSubmitting">
                        <ArrowPathIcon class="nav-svg spin" /> Submitting...
                    </template>
                    <template v-else>
                        <PaperAirplaneIconSolid class="nav-svg" /> Submit Request
                    </template>
                </button>
            </div>
        </div>

        <!-- ====== REQUESTS LIST ====== -->
        <div v-if="subTab === 'list'" class="list-section">
            <div v-if="loadingRequests" class="loading-state">
                <ArrowPathIcon class="load-svg spin" /> Loading requests...
            </div>

            <div v-else-if="myRequests.length === 0" class="empty-state">
                <ClipDocList class="empty-svg" />
                <p class="empty-title">No requests yet</p>
                <p class="empty-desc">Submit your first order request to get started</p>
                <button @click="subTab = 'new'" class="nav-next">
                    <PlusIcon class="add-svg" /> New Request
                </button>
            </div>

            <div v-else class="requests-list">
                <div v-for="req in myRequests" :key="req.id" class="request-card" @click="viewDetail(req)">
                    <div class="request-header">
                        <div>
                            <span class="request-num">#{{ req.request_number }}</span>
                            <span class="request-date">{{ formatDate(req.created_at) }}</span>
                        </div>
                        <span class="status-badge" :class="req.status">{{ formatStatus(req.status) }}</span>
                    </div>
                    <div class="request-meta">
                        <span>
                            <CubeIcon class="meta-svg" /> {{ req.item_count || '—' }} items
                        </span>
                        <span v-if="req.request_fee">
                            <CurrencyDollarIcon class="meta-svg" /> GHS {{
                                parseFloat(req.request_fee).toFixed(2) }}
                        </span>
                        <span v-if="req.fulfillment_type">
                            <TruckIcon class="meta-svg" /> {{ req.fulfillment_type
                            }}
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" :class="req.status"
                            :style="{ width: statusProgress(req.status) + '%' }">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ====== REQUEST DETAIL MODAL ====== -->
        <div v-if="selectedRequest" class="modal-overlay" @click.self="selectedRequest = null">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h3>Request #{{ selectedRequest.request_number }}</h3>
                        <span class="status-badge" :class="selectedRequest.status">{{
                            formatStatus(selectedRequest.status)
                            }}</span>
                    </div>
                    <button @click="selectedRequest = null" class="modal-close">
                        <XMarkIcon class="close-svg" />
                    </button>
                </div>

                <div class="modal-body">
                    <!-- Items -->
                    <div class="detail-section">
                        <span class="detail-label">Items</span>
                        <div v-for="item in selectedRequest.items" :key="item.id" class="detail-item">
                            <div>
                                <strong>{{ item.product_name }}</strong>
                                <span class="item-qty">Qty: {{ item.quantity }}</span>
                            </div>
                            <div class="item-price-info">
                                <span v-if="item.marked_up_price" class="item-price">GHS {{
                                    parseFloat(item.marked_up_price).toFixed(2) }}</span>
                                <span v-else class="price-pending">Price pending</span>
                                <span class="status-badge sm" :class="item.item_status || 'pending'">{{ item.item_status
                                    ||
                                    'pending' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Totals -->
                    <div v-if="selectedRequest.estimated_total" class="totals-box">
                        <div class="total-row"><span>Items total</span><span>GHS {{
                            parseFloat(selectedRequest.items_total ||
                                0).toFixed(2) }}</span></div>
                        <div v-if="selectedRequest.delivery_fee" class="total-row"><span>Delivery fee</span><span>GHS {{
                            parseFloat(selectedRequest.delivery_fee).toFixed(2) }}</span></div>
                        <div class="total-row grand"><span>Estimated Total</span><span>GHS {{
                            parseFloat(selectedRequest.estimated_total).toFixed(2) }}</span></div>
                    </div>

                    <!-- Fulfillment Choice -->
                    <div v-if="selectedRequest.status === 'awaiting_customer' || selectedRequest.status === 'items_sourced'"
                        class="fulfillment-section">
                        <span class="detail-label">Choose Fulfillment</span>
                        <div class="fulfillment-grid">
                            <button @click="chooseFulfillment(selectedRequest.id, 'delivery')" class="fulfillment-btn"
                                :class="{ selected: selectedRequest.fulfillment_type === 'delivery' }">
                                <TruckIcon class="ful-svg" />
                                <strong>Delivery</strong>
                                <span>To your door</span>
                            </button>
                            <button @click="chooseFulfillment(selectedRequest.id, 'pickup')" class="fulfillment-btn"
                                :class="{ selected: selectedRequest.fulfillment_type === 'pickup' }">
                                <BuildingStorefrontIcon class="ful-svg" />
                                <strong>Pickup</strong>
                                <span>From pharmacy</span>
                            </button>
                        </div>
                    </div>

                    <!-- Address / Notes -->
                    <div v-if="selectedRequest.delivery_address" class="detail-info">
                        <MapPinIcon class="detail-svg" /> {{ selectedRequest.delivery_address }}
                    </div>
                    <div v-if="selectedRequest.admin_notes" class="detail-info">
                        <ChatBubbleLeftIcon class="detail-svg" /> {{ selectedRequest.admin_notes }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Success Modal -->
        <div v-if="showSuccess" class="modal-overlay" @click.self="showSuccess = false">
            <div class="success-modal">
                <div class="success-icon">
                    <CheckBadgeIcon class="success-svg" />
                </div>
                <h3>Request Submitted! 🎉</h3>
                <p>We'll find the best prices from nearby pharmacies and get back to you shortly.</p>
                <p v-if="submittedNumber" class="success-num">Request #<strong>{{ submittedNumber }}</strong></p>
                <button @click="showSuccess = false; subTab = 'list'; fetchMyRequests()" class="nav-submit"
                    style="width:100%">View My Requests</button>
            </div>
        </div>

        <!-- Toast -->
        <div v-if="toast" class="toast" :class="toast.type">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="toast-svg" />
            {{ toast.text }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import {
    PlusCircleIcon, ClipboardDocumentListIcon as ClipDocList, CheckIcon, PlusIcon, XMarkIcon,
    CameraIcon, ArrowUpTrayIcon, MapPinIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon,
    PaperClipIcon, InformationCircleIcon, CubeIcon, CurrencyDollarIcon, TruckIcon,
    BuildingStorefrontIcon, ChatBubbleLeftIcon, CheckBadgeIcon,
    ExclamationTriangleIcon as ExcTriIcon, CheckCircleIcon
} from '@heroicons/vue/24/outline'
import { MapPinIcon as MapPinIconSolid, CheckCircleIcon as CheckCircleIconSolid, PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/vue/24/solid'

const props = defineProps({
    defaultSubTab: { type: String, default: 'new' }
})

const userStore = useUserStore()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const subTab = ref(props.defaultSubTab)
const currentStep = ref(0)
const isSubmitting = ref(false)
const loadingRequests = ref(false)
const gettingLocation = ref(false)
const toast = ref(null)
const showSuccess = ref(false)
const submittedNumber = ref('')



const newItem = () => ({
    product_name: '',
    quantity: 1,
    searchResults: [],
    loading: false,
    showDropdown: false
})

const requestItems = ref([newItem()])
const prescriptionFile = ref(null)
const customerLat = ref(null)
const customerLng = ref(null)
const deliveryAddress = ref('')
const customerNotes = ref('')

const myRequests = ref([])
const selectedRequest = ref(null)

const validItems = computed(() => requestItems.value.filter(i => i.product_name.trim()))
const canProceed = computed(() => {
    if (currentStep.value === 0) return validItems.value.length > 0 && customerLat.value
    if (currentStep.value === 1) return !!deliveryAddress.value.trim()
    return true
})
const canSubmit = computed(() => validItems.value.length > 0 && customerLat.value && deliveryAddress.value.trim())

const locationLabel = computed(() => {
    if (customerLat.value) return '📍 Location Set'
    if (gettingLocation.value) return 'Getting location...'
    return 'Use My Current Location'
})
const locationSublabel = computed(() => {
    if (customerLat.value) return `${customerLat.value.toFixed(4)}, ${customerLng.value.toFixed(4)}`
    return 'We need this to find nearby pharmacies'
})

const getLocation = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
    gettingLocation.value = true
    navigator.geolocation.getCurrentPosition(
        (pos) => { customerLat.value = pos.coords.latitude; customerLng.value = pos.coords.longitude; gettingLocation.value = false; showToast('Location set!') },
        () => { gettingLocation.value = false; showToast('Could not get location. Please enable GPS.', 'error') },
        { enableHighAccuracy: true, timeout: 15000 }
    )
}

const apiCall = async (method, url, data = null) => {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userStore.customerAuthToken}` } }
    if (data) opts.body = JSON.stringify(data)
    const res = await fetch(`${apiBase}${url}`, opts)
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || `Error ${res.status}`)
    return json
}

const fetchMyRequests = async () => {
    loadingRequests.value = true
    try {
        const res = await apiCall('GET', '/api/order-requests/customer')
        myRequests.value = res.data || []
    } catch (e) { showToast('Failed to load requests', 'error') }
    finally { loadingRequests.value = false }
}

const viewDetail = async (req) => {
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${req.id}`)
        selectedRequest.value = res.data
    } catch (e) { showToast('Failed to load request', 'error') }
}

const submitRequest = async () => {
    if (!canSubmit.value) return
    isSubmitting.value = true
    try {
        const payload = {
            items: validItems.value.map(i => ({ product_name: i.product_name.trim(), quantity: i.quantity || 1 })),
            customer_latitude: customerLat.value,
            customer_longitude: customerLng.value,
            delivery_address: deliveryAddress.value.trim(),
            customer_notes: customerNotes.value.trim(),
        }
        const res = await apiCall('POST', '/api/order-requests/customer', payload)
        submittedNumber.value = res.data?.request_number || ''
        showSuccess.value = true
        requestItems.value = [newItem()]
        prescriptionFile.value = null
        deliveryAddress.value = ''
        customerNotes.value = ''
        currentStep.value = 0
    } catch (e) { showToast(e.message || 'Failed to submit', 'error') }
    finally { isSubmitting.value = false }
}

const chooseFulfillment = async (id, type) => {
    try {
        await apiCall('PUT', `/api/order-requests/customer/${id}/fulfillment`, { fulfillment_type: type })
        selectedRequest.value.fulfillment_type = type
        showToast(`${type === 'delivery' ? 'Delivery' : 'Pickup'} selected!`)
    } catch (e) { showToast(e.message || 'Failed to update', 'error') }
}

// Search Logic
let debounceTimer = null
const onProductInput = (item) => {
    item.showDropdown = true
    if (!item.product_name || item.product_name.length < 2) {
        item.searchResults = []
        return
    }

    // Debounce
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => searchProducts(item), 300)
}

const searchProducts = async (item) => {
    item.loading = true
    try {
        let res;
        if (customerLat.value && customerLng.value) {
            res = await apiCall('GET', `/api/products/nearby-search?lat=${customerLat.value}&lng=${customerLng.value}&search=${encodeURIComponent(item.product_name)}&limit=5`)
        } else {
            res = await apiCall('GET', `/api/master-products?search=${encodeURIComponent(item.product_name)}&limit=5`)
        }
        item.searchResults = res.data || []
    } catch (e) {
        console.error(e) // silent fail
    } finally {
        item.loading = false
    }
}

const selectProduct = (item, res) => {
    let name = res.product_description
    if (res.strength) name += ` ${res.strength}`
    // if(res.unit) name += ` ${res.unit}` // unit might be redundant if user just wants name
    item.product_name = name
    item.showDropdown = false
}

const closeDropdown = (item) => {
    // Delay to allow click event to register
    setTimeout(() => { item.showDropdown = false }, 200)
}

const addItem = () => requestItems.value.push(newItem())

const formatStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const statusProgress = (s) => ({ pending: 15, processing: 35, items_sourced: 55, awaiting_customer: 65, confirmed: 80, completed: 100, cancelled: 100 }[s] || 10)
const showToast = (text, type = 'success') => { toast.value = { text, type }; setTimeout(() => { toast.value = null }, 4000) }

onMounted(() => {
    if (props.defaultSubTab === 'list') fetchMyRequests()
})

defineExpose({ fetchMyRequests })
</script>

<style scoped>
.order-requests {
    padding: 0;
}

/* Heroicon SVG sizing */
.tab-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
}

.step-svg {
    width: 16px;
    height: 16px;
}

.rm-svg {
    width: 16px;
    height: 16px;
}

.add-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.prescription-svg {
    width: 24px;
    height: 24px;
    color: #3b82f6;
    margin-top: 2px;
    flex-shrink: 0;
}

.upload-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.loc-svg {
    width: 22px;
    height: 22px;
}

.location-check-svg {
    width: 24px;
    height: 24px;
    color: #22c55e;
    flex-shrink: 0;
}

.attach-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.info-svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.nav-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.load-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
}

.empty-svg {
    width: 2rem;
    height: 2rem;
    color: #d1d5db;
    margin: 0 auto;
}

.meta-svg {
    width: 14px;
    height: 14px;
    display: inline;
    vertical-align: middle;
}

.close-svg {
    width: 20px;
    height: 20px;
}

.ful-svg {
    width: 24px;
    height: 24px;
}

.detail-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
    flex-shrink: 0;
}

.success-svg {
    width: 32px;
    height: 32px;
}

.toast-svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

/* Sub-tabs */
.sub-tabs {
    display: flex;
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 1.5rem;
    padding: 0 1.5rem;
}

.sub-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: #6b7280;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: -2px;
}

.sub-tab:hover {
    color: #667eea;
}

.sub-tab.active {
    color: #667eea;
    border-bottom-color: #667eea;
}

.badge {
    background: #667eea;
    color: white;
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    margin-left: 0.25rem;
}

/* Step bar */
.step-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    margin: -0.5rem -0.5rem 1.5rem -0.5rem;
    border-radius: 8px;
}

.step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.3s;
}

.step-item.active .step-dot,
.step-item.done .step-dot {
    background: white;
    color: #667eea;
    transform: scale(1.1);
}

.step-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
}

.step-item.active .step-label {
    color: white;
}

.step-line {
    width: 40px;
    height: 2px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1px;
}

.step-line.filled {
    background: rgba(255, 255, 255, 0.8);
}

/* Step content */
.form-section,
.list-section {
    padding: 0 1.5rem 1.5rem;
}

.step-content {
    animation: fadeIn 0.2s ease;
}

.step-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem;
}

.step-desc {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1.25rem;
}

/* Items list */
.items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.item-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.625rem 0.75rem;
}

.item-num {
    width: 28px;
    height: 28px;
    background: #e0e7ff;
    color: #4f46e5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.item-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    color: #111827;
    outline: none;
    font-weight: 500;
}

.item-input::placeholder {
    color: #9ca3af;
}

.input-wrap {
    flex: 1;
}

.search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 50;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
}

.search-item {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
}

.search-item:last-child {
    border-bottom: none;
}

.search-item:hover {
    background-color: #f9fafb;
}

.search-item.loading {
    display: flex;
    align-items: center;
    color: #6b7280;
    font-size: 0.875rem;
}

.search-item.no-results {
    color: #6b7280;
    font-size: 0.875rem;
    font-style: italic;
    cursor: default;
}

.qty-input {
    width: 56px;
    text-align: center;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
}

.qty-input:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
}

.remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1.1rem;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.remove-btn:hover {
    opacity: 1;
}

.add-item-btn {
    width: 100%;
    padding: 0.625rem;
    border: 2px dashed #d1d5db;
    border-radius: 10px;
    background: none;
    color: #6b7280;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.add-item-btn:hover {
    border-color: #667eea;
    color: #667eea;
}

/* Prescription */
.prescription-box {
    margin-top: 1.25rem;
    padding: 1rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.prescription-icon {
    font-size: 1.5rem;
    color: #3b82f6;
    margin-top: 0.125rem;
}

.prescription-text {
    flex: 1;
}

.prescription-text strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
    margin-bottom: 0.125rem;
}

.prescription-text span {
    font-size: 0.8rem;
    color: #6b7280;
}

.upload-label {
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #3b82f6;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
}

.hidden-input {
    display: none;
}

/* Location */
.location-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    margin-bottom: 1rem;
}

.location-btn.set {
    border-color: #86efac;
    background: #f0fdf4;
}

.location-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #6b7280;
    flex-shrink: 0;
}

.location-icon-wrap.set {
    background: #dcfce7;
    color: #16a34a;
}

.location-text {
    flex: 1;
}

.location-text strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
}

.location-text span {
    font-size: 0.75rem;
    color: #6b7280;
}

.location-check {
    color: #22c55e;
    font-size: 1.5rem;
}

/* Form */
.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.375rem;
}

.optional {
    color: #9ca3af;
    font-weight: 400;
}

.form-textarea {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 0.875rem;
    resize: none;
    transition: all 0.2s;
}

.form-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Review */
.review-box {
    background: #f9fafb;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
}

.review-section {
    margin-bottom: 0.75rem;
}

.review-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.review-item {
    display: flex;
    justify-content: space-between;
    padding: 0.375rem 0;
    font-size: 0.875rem;
    color: #374151;
}

.review-qty {
    color: #9ca3af;
}

.review-attach {
    font-size: 0.8rem;
    color: #3b82f6;
    margin-bottom: 0.75rem;
}

.review-meta {
    border-top: 1px solid #e5e7eb;
    padding-top: 0.75rem;
}

.review-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    padding: 0.25rem 0;
}

.review-row span:first-child {
    color: #6b7280;
}

.review-addr {
    text-align: right;
    max-width: 60%;
    color: #374151;
}

.fee-notice {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #eef2ff;
    border-radius: 10px;
    align-items: flex-start;
}

.fee-notice i {
    color: #667eea;
    font-size: 1.25rem;
    margin-top: 0.125rem;
}

.fee-notice strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
}

.fee-notice span {
    font-size: 0.8rem;
    color: #6b7280;
}

/* Nav buttons */
.step-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid #e5e7eb;
}

.nav-back {
    background: none;
    border: none;
    color: #6b7280;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.nav-back:hover {
    color: #111827;
}

.nav-next {
    padding: 0.625rem 1.5rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: all 0.2s;
}

.nav-next:hover:not(:disabled) {
    background: #5a6fd6;
}

.nav-next:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.nav-submit {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.nav-submit:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.nav-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Requests list */
.requests-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.request-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
}

.request-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.request-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.request-num {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
}

.request-date {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 0.5rem;
}

.request-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
}

.request-meta i {
    margin-right: 0.125rem;
}

/* Progress bar */
.progress-bar {
    height: 3px;
    background: #f3f4f6;
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s;
}

.progress-fill.pending {
    background: #f59e0b;
}

.progress-fill.processing {
    background: #3b82f6;
}

.progress-fill.items_sourced {
    background: #8b5cf6;
}

.progress-fill.awaiting_customer {
    background: #f97316;
}

.progress-fill.confirmed {
    background: #06b6d4;
}

.progress-fill.completed {
    background: #22c55e;
}

.progress-fill.cancelled {
    background: #ef4444;
}

/* Status badge */
.status-badge {
    padding: 0.2rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.status-badge.sm {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
}

.status-badge.pending {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.processing {
    background: #dbeafe;
    color: #1e40af;
}

.status-badge.items_sourced,
.status-badge.sourced {
    background: #ede9fe;
    color: #5b21b6;
}

.status-badge.awaiting_customer {
    background: #ffedd5;
    color: #9a3412;
}

.status-badge.confirmed {
    background: #cffafe;
    color: #155e75;
}

.status-badge.completed {
    background: #dcfce7;
    color: #166534;
}

.status-badge.cancelled {
    background: #fee2e2;
    color: #991b1b;
}

.status-badge.unavailable {
    background: #fee2e2;
    color: #991b1b;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.modal-header h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.375rem 0;
}

.modal-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    color: #9ca3af;
    padding: 0.25rem;
}

.modal-close:hover {
    color: #374151;
}

.modal-body {
    padding: 1.5rem;
}

.detail-section {
    margin-bottom: 1.25rem;
}

.detail-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 0.5rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.75rem;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 0.375rem;
}

.detail-item strong {
    font-size: 0.875rem;
    color: #111827;
}

.item-qty {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 0.5rem;
}

.item-price-info {
    text-align: right;
}

.item-price {
    font-weight: 700;
    font-size: 0.875rem;
    color: #111827;
    display: block;
}

.price-pending {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
    display: block;
}

.totals-box {
    background: #eef2ff;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.25rem;
}

.total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    padding: 0.25rem 0;
}

.total-row.grand {
    font-weight: 700;
    font-size: 1rem;
    border-top: 1px solid #c7d2fe;
    padding-top: 0.5rem;
    margin-top: 0.375rem;
    color: #4f46e5;
}

.fulfillment-section {
    margin-bottom: 1.25rem;
}

.fulfillment-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.fulfillment-btn {
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
}

.fulfillment-btn i {
    font-size: 1.5rem;
    color: #667eea;
    display: block;
    margin-bottom: 0.375rem;
}

.fulfillment-btn strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
}

.fulfillment-btn span {
    font-size: 0.75rem;
    color: #6b7280;
}

.fulfillment-btn.selected {
    border-color: #667eea;
    background: #eef2ff;
}

.fulfillment-btn:hover {
    border-color: #a5b4fc;
}

.detail-info {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
}

.detail-info i {
    color: #9ca3af;
    margin-top: 0.125rem;
}

/* Success modal */
.success-modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 380px;
    padding: 2rem;
    text-align: center;
}

.success-icon {
    width: 64px;
    height: 64px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
}

.success-icon i {
    font-size: 2rem;
    color: #16a34a;
}

.success-modal h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}

.success-modal p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 0.5rem;
}

.success-num {
    color: #374151;
    margin-bottom: 1.25rem !important;
}

.success-num strong {
    color: #4f46e5;
}

/* States */
.loading-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
}

.empty-icon {
    font-size: 2.5rem;
    color: #d1d5db;
}

.empty-title {
    font-weight: 600;
    color: #374151;
    margin: 0.5rem 0 0.25rem;
}

.empty-desc {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1rem;
}

/* Toast */
.toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    z-index: 2000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideUp 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
    background: #10b981;
}

.toast.error {
    background: #ef4444;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 640px) {
    .step-label {
        display: none;
    }

    .step-line {
        width: 24px;
    }

    .form-section,
    .list-section {
        padding: 0 1rem 1rem;
    }

    .sub-tabs {
        padding: 0 1rem;
    }
}
</style>
