<template>
    <div class="order-requests">
        <!-- Sub-tabs -->
        <div class="sub-tabs">
            <button @click="subTab = 'new'" class="sub-tab" :class="{ active: subTab === 'new' }">
                <PlusCircleIcon class="tab-svg" />
                <span>New Request</span>
            </button>
            <button @click="subTab = 'list'; fetchMyRequests()" class="sub-tab" :class="{ active: subTab === 'list' }">
                <ClipDocList class="tab-svg" />
                <span>My Requests</span>
                <span v-if="myRequests.length" class="badge">{{ myRequests.length }}</span>
            </button>
        </div>

        <!-- ====== NEW REQUEST FORM ====== -->
        <div v-if="subTab === 'new'" class="form-section">
            <div class="request-shell-head">
                <div>
                    <p class="shell-eyebrow">Create Request</p>
                    <h2 class="shell-title">Tell us what you need</h2>
                    <p class="shell-copy">Build a request in a few steps, choose delivery or pickup, then submit it for sourcing.</p>
                </div>
                <div class="shell-stats">
                    <div class="shell-pill">
                        <span>Items</span>
                        <strong>{{ validItems.length }}</strong>
                    </div>
                    <div class="shell-pill muted">
                        <span>Step</span>
                        <strong>{{ currentStep + 1 }}/3</strong>
                    </div>
                </div>
            </div>

            <!-- Step Indicator -->
            <div class="step-bar">
                <div v-for="(step, i) in ['Items', 'Fulfillment', 'Review']" :key="i" class="step-item"
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
                        <div class="input-wrap relative clickable-input-wrap" @click="$event.currentTarget.querySelector('input')?.focus()">
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

            <!-- STEP 1: Fulfillment -->
            <div v-if="currentStep === 1" class="step-content">
                <h3 class="step-title">How should we fulfill this request?</h3>
                <p class="step-desc">Choose delivery or pickup before submitting.</p>

                <div class="fulfillment-section">
                    <div class="fulfillment-grid">
                        <button @click="fulfillmentType = 'delivery'" type="button" class="fulfillment-btn"
                            :class="{ selected: fulfillmentType === 'delivery' }">
                            <TruckIcon class="ful-svg" />
                            <strong>Delivery</strong>
                            <span>Bring it to me</span>
                        </button>
                        <button @click="fulfillmentType = 'pickup'" type="button" class="fulfillment-btn"
                            :class="{ selected: fulfillmentType === 'pickup' }">
                            <BuildingStorefrontIcon class="ful-svg" />
                            <strong>Pickup</strong>
                            <span>I will collect it</span>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label>{{ fulfillmentType === 'delivery' ? 'Delivery Address' : 'Pickup Notes (optional)' }}</label>
                    <textarea v-model="deliveryAddress" rows="2"
                        :placeholder="fulfillmentType === 'delivery'
                            ? 'e.g. Room 12, Kofi Mensah Hostel, University of Ghana, Legon'
                            : 'e.g. preferred pickup area or landmark'"
                        class="form-textarea"></textarea>
                    <p v-if="fulfillmentType === 'delivery'" class="field-hint">Required for delivery requests.</p>
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
                        <div class="review-row"><span>Location</span><span>{{ customerLat ? 'Set' : 'Not set' }}</span></div>
                        <div class="review-row"><span>Fulfillment</span><span>{{ fulfillmentType ? formatStatus(fulfillmentType) : 'Not selected' }}</span></div>
                        <div class="review-row" v-if="fulfillmentType === 'delivery'">
                            <span>Address</span><span class="review-addr">{{ deliveryAddress || 'Not provided' }}</span>
                        </div>
                    </div>
                </div>

                <div class="fee-notice priority-note">
                    <InformationCircleIcon class="info-svg" />
                    <div>
                        <strong>Priority Search requires a GHS {{ requestFee.toFixed(2) }} commitment</strong>
                        <span>We only charge the hold when you send the request. If no pharmacy responds within {{ requestRefundMinutes }} minutes, the hold returns to your wallet automatically.</span>
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
                <button v-else @click="openPriorityGate" :disabled="!canSubmit || isSubmitting" class="nav-submit">
                    <template v-if="isSubmitting">
                        <ArrowPathIcon class="nav-svg spin" /> Submitting...
                    </template>
                    <template v-else>
                        <PaperAirplaneIconSolid class="nav-svg" /> Review Priority Search
                    </template>
                </button>
            </div>
        </div>

        <!-- ====== REQUESTS LIST ====== -->
        <div v-if="subTab === 'list'" class="list-section">
            <div class="request-shell-head compact">
                <div>
                    <p class="shell-eyebrow">Request History</p>
                    <h2 class="shell-title">My Requests</h2>
                    <p class="shell-copy">Track sourcing, payment, pickup, and delivery updates in one place.</p>
                </div>
                <div class="shell-stats">
                    <div class="shell-pill">
                        <span>Total</span>
                        <strong>{{ myRequests.length }}</strong>
                    </div>
                </div>
            </div>

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

            <div v-else>
                <div class="request-list-tabs">
                    <button
                        class="request-list-tab"
                        :class="{ active: requestListTab === 'active' }"
                        @click="requestListTab = 'active'"
                    >
                        <span>Active</span>
                        <span class="request-list-count">{{ activeRequests.length }}</span>
                    </button>
                    <button
                        class="request-list-tab"
                        :class="{ active: requestListTab === 'completed' }"
                        @click="requestListTab = 'completed'"
                    >
                        <span>Completed</span>
                        <span class="request-list-count">{{ completedRequests.length }}</span>
                    </button>
                </div>

                <div v-if="filteredRequests.length === 0" class="empty-state compact-empty">
                    <ClipDocList class="empty-svg" />
                    <p class="empty-title">No {{ requestListTab }} requests</p>
                    <p class="empty-desc">
                        {{ requestListTab === 'active'
                            ? 'Requests that still need attention will appear here.'
                            : 'Finished, delivered, cancelled, or returned requests will appear here.' }}
                    </p>
                </div>

                <div v-else class="requests-list">
                <div v-for="req in filteredRequests" :key="req.id" class="request-card" @click="viewDetail(req)">
                    <div class="request-header">
                        <div>
                            <span class="request-num">#{{ req.request_number }}</span>
                            <span class="request-date">{{ formatDate(req.created_at) }}</span>
                        </div>
                        <span class="status-badge" :class="getCustomerStatus(req.status)">{{ formatStatus(req.status) }}</span>
                    </div>
                    <div class="request-card-copy">
                        <p>{{ req.item_count || 0 }} item<span v-if="(req.item_count || 0) !== 1">s</span> in this request</p>
                        <ChevronRightIcon class="request-arrow" />
                    </div>
                    <div class="request-meta">
                        <span>
                            <CubeIcon class="meta-svg" /> {{ req.item_count || '—' }} items
                        </span>
                        <span v-if="getRequestTotal(req) !== null">
                            <CurrencyDollarIcon class="meta-svg" /> Total: GHS {{ formatMoney(getRequestTotal(req)) }}
                        </span>
                        <span v-if="req.request_fee">
                            <CurrencyDollarIcon class="meta-svg" /> Fee: GHS {{
                                parseFloat(req.request_fee).toFixed(2) }}
                        </span>
                        <span v-if="req.fulfillment_type">
                            <TruckIcon class="meta-svg" /> {{ req.fulfillment_type
                            }}
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" :class="getCustomerStatus(req.status)"
                            :style="{ width: statusProgress(getCustomerStatus(req.status)) + '%' }">
                        </div>
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
                        <span class="status-badge" :class="getCustomerStatus(selectedRequest.status)">{{
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

                    <div v-if="canPayRequest(selectedRequest)" class="payment-action">
                        <button @click="payForRequest(selectedRequest.id)" class="pay-request-btn" :disabled="payingRequest">
                            <ArrowPathIcon v-if="payingRequest" class="pay-svg spin" />
                            <CurrencyDollarIcon v-else class="pay-svg" />
                            <span>{{ payingRequest ? 'Processing payment...' : `Pay GHS ${formatMoney(getPayableAmount(selectedRequest))}` }}</span>
                        </button>
                        <p class="payment-note">Payment is deducted from your wallet balance.</p>
                    </div>

                    <div v-if="canCancelRequest(selectedRequest)" class="cancel-action">
                        <button
                            @click="cancelRequest(selectedRequest.id)"
                            class="cancel-request-btn"
                            :disabled="cancelingRequest || payingRequest"
                        >
                            <ArrowPathIcon v-if="cancelingRequest" class="pay-svg spin" />
                            <XMarkIcon v-else class="pay-svg" />
                            <span>{{ cancelingRequest ? 'Cancelling request...' : 'Cancel Request' }}</span>
                        </button>
                        <p class="payment-note">This only works while the request is still pending.</p>
                    </div>

                    <!-- Address / Notes -->
                    <div v-if="selectedRequest.customer_address || selectedRequest.delivery_address" class="detail-info">
                        <MapPinIcon class="detail-svg" /> {{ selectedRequest.customer_address || selectedRequest.delivery_address }}
                    </div>
                    <div v-if="selectedRequest.admin_notes" class="detail-info">
                        <ChatBubbleLeftIcon class="detail-svg" /> {{ selectedRequest.admin_notes }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Priority Gate Modal -->
        <div v-if="showPriorityModal" class="modal-overlay" @click.self="showPriorityModal = false">
            <div class="modal-content priority-modal">
                <div class="modal-header">
                    <div>
                        <h3>Activate Priority Search</h3>
                        <span class="status-badge confirming_with_pharm">GHS {{ requestFee.toFixed(2) }} commitment</span>
                    </div>
                    <button @click="showPriorityModal = false" class="modal-close">
                        <XMarkIcon class="close-svg" />
                    </button>
                </div>

                <div class="modal-body">
                    <div class="priority-hero">
                        <p class="priority-kicker">Why this hold exists</p>
                        <p class="priority-copy">
                            Your request reaches the front of the queue because it is backed by a small commitment. That tells nearby pharmacies to check stock immediately instead of treating it like a casual enquiry.
                        </p>
                    </div>

                    <div class="priority-points">
                        <div class="priority-point">
                            <strong>If you buy</strong>
                            <span>The same GHS {{ requestFee.toFixed(2) }} is credited back after you complete payment for the request.</span>
                        </div>
                        <div class="priority-point">
                            <strong>If you do not continue</strong>
                            <span>The GHS {{ requestFee.toFixed(2) }} covers the pharmacist's time spent checking their shelves and confirming availability.</span>
                        </div>
                        <div class="priority-point muted">
                            <strong>No response protection</strong>
                            <span>If no pharmacy responds within {{ requestRefundMinutes }} minutes, the hold is refunded automatically to your MedsGH wallet.</span>
                        </div>
                    </div>

                    <div v-if="submitShortfall > 0" class="priority-shortfall">
                        <strong>You need GHS {{ submitShortfall.toFixed(2) }} more in your wallet.</strong>
                        <span>Top up first, then return here and send the request.</span>
                    </div>

                    <div class="priority-actions">
                        <button @click="showPriorityModal = false" class="nav-back priority-back">
                            Not Yet
                        </button>
                        <button v-if="submitShortfall > 0" @click="openWalletTab" class="nav-next priority-topup">
                            Top Up Wallet
                        </button>
                        <button @click="confirmPriorityAndSubmit" :disabled="isSubmitting" class="nav-submit priority-submit">
                            <template v-if="isSubmitting">
                                <ArrowPathIcon class="nav-svg spin" /> Sending...
                            </template>
                            <template v-else>
                                Pay GHS {{ requestFee.toFixed(2) }} &amp; Send Request
                            </template>
                        </button>
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
                <p>Your Priority Search is active. If no pharmacy responds within {{ requestRefundMinutes }} minutes, the hold is refunded automatically.</p>
                <p v-if="submittedNumber" class="success-num">Request #<strong>{{ submittedNumber }}</strong></p>
                <button @click="showSuccess = false; subTab = 'list'; fetchMyRequests()" class="nav-submit"
                    style="width:100%">View My Requests</button>
            </div>
        </div>

        <div v-if="showReimbursementModal" class="modal-overlay" @click.self="showReimbursementModal = false">
            <div class="success-modal reimbursement-modal">
                <div class="success-icon reimbursement-icon">
                    <CheckBadgeIcon class="success-svg" />
                </div>
                <h3>Your GHS {{ reimbursementSummary.feeCreditAmount.toFixed(2) }} deposit is back.</h3>
                <p>
                    The priority hold for request <strong>#{{ reimbursementSummary.requestNumber }}</strong> has been returned to your wallet after payment.
                </p>
                <div class="reimbursement-summary">
                    <div><span>Order total</span><strong>GHS {{ reimbursementSummary.amountPaid.toFixed(2) }}</strong></div>
                    <div><span>Deposit returned</span><strong>GHS {{ reimbursementSummary.feeCreditAmount.toFixed(2) }}</strong></div>
                    <div class="net"><span>Net spend</span><strong>GHS {{ reimbursementSummary.effectiveAmountPaid.toFixed(2) }}</strong></div>
                </div>
                <button @click="closeReimbursementModal" class="nav-submit" style="width:100%">Continue</button>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
    defaultSubTab: { type: String, default: 'new' },
    initialRequestId: { type: [String, Number], default: null }
})

const userStore = useUserStore()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const subTab = ref(props.defaultSubTab)
const currentStep = ref(0)
const isSubmitting = ref(false)
const loadingRequests = ref(false)
const gettingLocation = ref(false)
const payingRequest = ref(false)
const cancelingRequest = ref(false)
const toast = ref(null)
const showSuccess = ref(false)
const showPriorityModal = ref(false)
const showReimbursementModal = ref(false)
const submittedNumber = ref('')
const requestFee = ref(5)
const requestRefundMinutes = ref(30)
const submitShortfall = ref(0)
const reimbursementSummary = ref({
    requestNumber: '',
    amountPaid: 0,
    feeCreditAmount: 0,
    effectiveAmountPaid: 0
})



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
const fulfillmentType = ref('')
const deliveryAddress = ref('')
const customerNotes = ref('')

const myRequests = ref([])
const selectedRequest = ref(null)
const requestListTab = ref('active')
const POLL_INTERVAL_MS = 15000
let pollTimer = null
const payableStatuses = new Set(['confirmed_in_pharm', 'awaiting_customer', 'items_sourced', 'confirmed'])

const validItems = computed(() => requestItems.value.filter(i => i.product_name.trim()))
const canProceed = computed(() => {
    if (currentStep.value === 0) return validItems.value.length > 0 && customerLat.value
    if (currentStep.value === 1) {
        if (!fulfillmentType.value) return false
        if (fulfillmentType.value === 'delivery') return !!deliveryAddress.value.trim()
        return true
    }
    return true
})
const canSubmit = computed(() => {
    if (!(validItems.value.length > 0 && customerLat.value && fulfillmentType.value)) return false
    if (fulfillmentType.value === 'delivery') return !!deliveryAddress.value.trim()
    return true
})

const locationLabel = computed(() => {
    if (customerLat.value) return '📍 Location Set'
    if (gettingLocation.value) return 'Getting location...'
    return 'Use My Current Location'
})
const locationSublabel = computed(() => {
    if (customerLat.value) return `${customerLat.value.toFixed(4)}, ${customerLng.value.toFixed(4)}`
    return 'We need this to find nearby pharmacies'
})

const isCompletedRequest = (request) => {
    const status = getCustomerStatus(request?.status)
    return ['completed', 'cancelled', 'returned'].includes(status)
}

const activeRequests = computed(() => myRequests.value.filter(req => !isCompletedRequest(req)))
const completedRequests = computed(() => myRequests.value.filter(req => isCompletedRequest(req)))
const filteredRequests = computed(() => (
    requestListTab.value === 'completed' ? completedRequests.value : activeRequests.value
))

const getLocation = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        showToast('Location access requires HTTPS on staging. Use a secure URL to continue.', 'error')
        return
    }
    gettingLocation.value = true
    navigator.geolocation.getCurrentPosition(
        (pos) => { customerLat.value = pos.coords.latitude; customerLng.value = pos.coords.longitude; gettingLocation.value = false; showToast('Location set!') },
        (error) => {
            gettingLocation.value = false
            if (error?.code === error.PERMISSION_DENIED) return showToast('Location permission was denied. Allow location access and try again.', 'error')
            if (error?.code === error.POSITION_UNAVAILABLE) return showToast('Your location is unavailable right now. Check GPS and try again.', 'error')
            if (error?.code === error.TIMEOUT) return showToast('Location request timed out. Try again.', 'error')
            showToast('Could not get your location right now. Try again.', 'error')
        },
        { enableHighAccuracy: true, timeout: 15000 }
    )
}

const apiCall = async (method, url, data = null) => {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userStore.customerAuthToken}` } }
    if (data) opts.body = JSON.stringify(data)
    const res = await fetch(`${apiBase}${url}`, opts)
    const json = await res.json()
    if (!res.ok || !json.success) {
        const err = new Error(json.message || `Error ${res.status}`)
        err.status = res.status
        err.data = json.data
        throw err
    }
    return json
}

const fetchRequestSettings = async () => {
    try {
        const res = await apiCall('GET', '/api/order-requests/customer/settings')
        requestFee.value = Number(res.data?.request_submission_fee || 5)
        requestRefundMinutes.value = Number(res.data?.request_no_response_refund_minutes || 30)
    } catch (e) {
        requestFee.value = 5
        requestRefundMinutes.value = 30
    }
}

const fetchMyRequests = async ({ silent = false } = {}) => {
    if (!silent) loadingRequests.value = true
    try {
        const res = await apiCall('GET', '/api/order-requests/customer')
        const nextRequests = res.data || []
        myRequests.value = nextRequests

        // Keep open modal status/details in sync when admin updates a request.
        if (selectedRequest.value?.id) {
            const refreshed = nextRequests.find(r => r.id === selectedRequest.value.id)
            if (refreshed) {
                selectedRequest.value = { ...selectedRequest.value, ...refreshed }
            }
        }
    } catch (e) {
        if (!silent) showToast('Failed to load requests', 'error')
    }
    finally { if (!silent) loadingRequests.value = false }
}

const viewDetail = async (req) => {
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${req.id}`)
        selectedRequest.value = res.data
    } catch (e) { showToast('Failed to load request', 'error') }
}

const normalizeRequestId = (value) => {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : null
}

const openRequestById = async (requestId, options = {}) => {
    const { silent = false } = options
    const id = normalizeRequestId(requestId)
    if (!id) return
    try {
        if (subTab.value !== 'list') subTab.value = 'list'
        const res = await apiCall('GET', `/api/order-requests/customer/${id}`)
        selectedRequest.value = res.data
    } catch (e) {
        if (!silent) showToast('Failed to load request', 'error')
    }
}

const refreshSelectedRequest = async () => {
    if (!selectedRequest.value?.id) return
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${selectedRequest.value.id}`)
        selectedRequest.value = res.data
    } catch (e) { }
}

const submitRequest = async () => {
    if (!canSubmit.value) return
    isSubmitting.value = true
    try {
        const payload = {
            items: validItems.value.map(i => ({ product_name: i.product_name.trim(), quantity: i.quantity || 1 })),
            customer_latitude: customerLat.value,
            customer_longitude: customerLng.value,
            fulfillment_type: fulfillmentType.value,
            delivery_address: deliveryAddress.value.trim(),
            customer_address: deliveryAddress.value.trim(),
            customer_notes: customerNotes.value.trim(),
        }
        let res
        if (prescriptionFile.value) {
            const formData = new FormData()
            formData.append('items', JSON.stringify(payload.items))
            formData.append('customer_latitude', String(payload.customer_latitude))
            formData.append('customer_longitude', String(payload.customer_longitude))
            formData.append('fulfillment_type', payload.fulfillment_type)
            formData.append('delivery_address', payload.delivery_address)
            formData.append('customer_address', payload.customer_address)
            formData.append('customer_notes', payload.customer_notes)
            formData.append('prescription_image', prescriptionFile.value)

            const response = await fetch(`${apiBase}/api/order-requests/customer`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userStore.customerAuthToken}` },
                body: formData
            })
            const json = await response.json()
            if (!response.ok || !json.success) {
                const err = new Error(json.message || `Error ${response.status}`)
                err.status = response.status
                err.data = json.data
                throw err
            }
            res = json
        } else {
            res = await apiCall('POST', '/api/order-requests/customer', payload)
        }
        submittedNumber.value = res.data?.request_number || ''
        submitShortfall.value = 0
        showPriorityModal.value = false
        showSuccess.value = true
        requestItems.value = [newItem()]
        prescriptionFile.value = null
        fulfillmentType.value = ''
        deliveryAddress.value = ''
        customerNotes.value = ''
        currentStep.value = 0
    } catch (e) {
        if (e.status === 402) {
            submitShortfall.value = Number(e.data?.shortfall || e.data?.required_fee || requestFee.value)
            showToast(`Insufficient wallet balance for the GHS ${requestFee.value.toFixed(2)} priority hold. Top up and try again.`, 'error')
        } else {
            showToast(e.message || 'Failed to submit', 'error')
        }
    }
    finally { isSubmitting.value = false }
}

const openPriorityGate = () => {
    if (!canSubmit.value || isSubmitting.value) return
    submitShortfall.value = 0
    showPriorityModal.value = true
}

const confirmPriorityAndSubmit = async () => {
    await submitRequest()
}

const openWalletTab = async () => {
    await navigateTo({ path: '/customer', query: { tab: 'wallet' } })
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

const getCustomerStatus = (s) => {
    if (s === 'picked_up' || s === 'delivered') return 'completed'
    return s || ''
}
const formatStatus = (s) => getCustomerStatus(s).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const formatMoney = (v) => Number(v || 0).toFixed(2)
const getRequestTotal = (req) => {
    const estimated = Number(req?.estimated_total)
    if (Number.isFinite(estimated) && estimated > 0) return estimated
    const itemsTotal = Number(req?.items_total)
    if (Number.isFinite(itemsTotal) && itemsTotal > 0) return itemsTotal
    return null
}
const getPayableAmount = (req) => {
    if (!req) return 0
    const estimated = Number(req.estimated_total)
    if (Number.isFinite(estimated) && estimated > 0) return estimated
    const itemsTotal = Number(req.items_total || 0)
    const deliveryFee = Number(req.delivery_fee || 0)
    const amount = itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)
    return Number.isFinite(amount) && amount > 0 ? amount : 0
}
const canPayRequest = (req) => {
    if (!req) return false
    if (!payableStatuses.has(req.status)) return false
    return getPayableAmount(req) > 0
}
const canCancelRequest = (req) => !!req && req.status === 'pending'
const payForRequest = async (id) => {
    if (!id || payingRequest.value) return
    payingRequest.value = true
    try {
        const res = await apiCall('POST', `/api/order-requests/customer/${id}/pay`)
        await fetchMyRequests({ silent: true })
        if (selectedRequest.value?.id === id) {
            await refreshSelectedRequest()
        }
        if (res.data?.fee_credited) {
            reimbursementSummary.value = {
                requestNumber: res.data.request_number || selectedRequest.value?.request_number || '',
                amountPaid: Number(res.data.amount_paid || 0),
                feeCreditAmount: Number(res.data.fee_credit_amount || requestFee.value),
                effectiveAmountPaid: Number(res.data.effective_amount_paid || res.data.amount_paid || 0)
            }
            showReimbursementModal.value = true
        } else {
            showToast(res.message || 'Payment completed successfully')
        }
    } catch (e) {
        if (e.status === 402 && e.data) {
            const shortfall = Number(e.data.shortfall || 0)
            showToast(`Insufficient wallet balance. Top up GHS ${shortfall.toFixed(2)} to continue.`, 'error')
        } else {
            showToast(e.message || 'Failed to initialize payment', 'error')
        }
    } finally {
        payingRequest.value = false
    }
}

const closeReimbursementModal = async () => {
    showReimbursementModal.value = false
    showToast('Payment completed and your priority deposit has been returned.')
    await fetchMyRequests({ silent: true })
    if (selectedRequest.value?.id) {
        await refreshSelectedRequest()
    }
}
const cancelRequest = async (id) => {
    if (!id || cancelingRequest.value) return
    const confirmed = window.confirm('Cancel this pending request?')
    if (!confirmed) return

    cancelingRequest.value = true
    try {
        const res = await apiCall('PUT', `/api/order-requests/customer/${id}/cancel`)
        showToast(res.message || 'Request cancelled')
        await fetchMyRequests({ silent: true })
        if (selectedRequest.value?.id === id) {
            await refreshSelectedRequest()
        }
    } catch (e) {
        showToast(e.message || 'Failed to cancel request', 'error')
    } finally {
        cancelingRequest.value = false
    }
}
const statusProgress = (s) => ({
    pending: 10,
    confirming_with_pharm: 25,
    confirmed_in_pharm: 40,
    paid: 70,
    ready_for_pickup: 80,
    picked_up: 100,
    out_for_delivery: 85,
    delivered: 100,
    returned: 100,
    cancelled: 100,
    // Legacy values
    processing: 25,
    items_sourced: 40,
    awaiting_customer: 55,
    confirmed: 70,
    completed: 100
}[s] || 10)
const showToast = (text, type = 'success') => { toast.value = { text, type }; setTimeout(() => { toast.value = null }, 4000) }

onMounted(async () => {
    await fetchRequestSettings()
    if (props.defaultSubTab === 'list' || props.initialRequestId) {
        subTab.value = 'list'
        await fetchMyRequests()
        await openRequestById(props.initialRequestId, { silent: true })
    }

    pollTimer = setInterval(async () => {
        if (subTab.value !== 'list') return
        await fetchMyRequests({ silent: true })
        await refreshSelectedRequest()
    }, POLL_INTERVAL_MS)
})

watch(
    () => props.initialRequestId,
    async (nextId, prevId) => {
        if (!nextId || nextId === prevId) return
        subTab.value = 'list'
        await fetchMyRequests({ silent: true })
        await openRequestById(nextId, { silent: true })
    }
)

onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
})

defineExpose({ fetchMyRequests })
</script>

<style scoped>
.order-requests {
    padding: 0;
    width: 100%;
    max-width: 980px;
    margin: 0 auto;
    overflow-x: clip;
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

.request-arrow {
    width: 18px;
    height: 18px;
    color: #94a3b8;
    flex-shrink: 0;
}

/* Sub-tabs */
.sub-tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
    padding: 0.35rem;
    background: linear-gradient(180deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

.sub-tabs::-webkit-scrollbar {
    display: none;
}

.sub-tab {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    background: transparent;
    border: none;
    color: #6b7280;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    border-radius: 0.8rem;
}

.sub-tab:hover {
    color: #2563eb;
}

.sub-tab.active {
    color: #0f172a;
    background: #ffffff;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.07);
}

.badge {
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.18rem 0.45rem;
    border-radius: 9999px;
    margin-left: 0.1rem;
}

/* Shell header */
.request-shell-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.15rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.request-shell-head.compact {
    margin-bottom: 1rem;
}

.shell-eyebrow {
    margin: 0 0 0.3rem;
    font-size: 0.68rem;
    font-weight: 800;
    color: #2563eb;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.shell-title {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.15;
    font-weight: 800;
    color: #0f172a;
}

.shell-copy {
    margin: 0.4rem 0 0;
    font-size: 0.88rem;
    line-height: 1.5;
    color: #64748b;
    max-width: 34rem;
}

.shell-stats {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.shell-pill {
    min-width: 5.25rem;
    padding: 0.8rem 0.9rem;
    border-radius: 1rem;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border: 1px solid #bfdbfe;
    color: #1e3a8a;
}

.shell-pill.muted {
    background: linear-gradient(135deg, #f8fafc, #eef2ff);
    border-color: #dbe4ee;
    color: #334155;
}

.shell-pill span {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.8;
}

.shell-pill strong {
    display: block;
    font-size: 1.05rem;
    font-weight: 800;
}

/* Step bar */
.step-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #0f766e, #2563eb);
    margin: 0 0 1.25rem 0;
    border-radius: 14px;
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.14);
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
    padding: 1.25rem 1.5rem 1.5rem;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
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

.clickable-input-wrap {
    cursor: text;
    min-height: 2.25rem;
    display: flex;
    align-items: center;
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

.field-hint {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: #6b7280;
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

.priority-note {
    background: linear-gradient(135deg, #eef2ff, #e0f2fe);
    border: 1px solid #c7d2fe;
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
.request-list-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 0.35rem;
    margin-bottom: 0.9rem;
    border-radius: 0.95rem;
    background: linear-gradient(180deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
}

.request-list-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.7rem 0.85rem;
    border: none;
    border-radius: 0.8rem;
    background: transparent;
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.request-list-tab.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.request-list-count {
    min-width: 1.7rem;
    height: 1.7rem;
    padding: 0 0.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: #e2e8f0;
    color: #334155;
    font-size: 0.72rem;
    font-weight: 800;
}

.request-list-tab.active .request-list-count {
    background: #dbeafe;
    color: #1d4ed8;
}

.compact-empty {
    padding: 1.5rem 1rem;
    border-radius: 1rem;
    margin-bottom: 0.25rem;
}

.requests-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.request-card {
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem 1.1rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.request-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
}

.request-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.request-card-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.65rem;
}

.request-card-copy p {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 600;
    color: #475569;
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
    flex-wrap: wrap;
    gap: 0.75rem;
    row-gap: 0.35rem;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
}

.request-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    padding: 0.3rem 0.55rem;
    border-radius: 9999px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
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

.progress-fill.confirming_with_pharm {
    background: #3b82f6;
}

.progress-fill.confirmed_in_pharm {
    background: #22c55e;
}

.progress-fill.paid {
    background: #0ea5e9;
}

.progress-fill.ready_for_pickup {
    background: #f97316;
}

.progress-fill.picked_up {
    background: #22c55e;
}

.progress-fill.out_for_delivery {
    background: #6366f1;
}

.progress-fill.delivered {
    background: #22c55e;
}

.progress-fill.returned {
    background: #ef4444;
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

.status-badge.confirming_with_pharm {
    background: #dbeafe;
    color: #1e40af;
}

.status-badge.confirmed_in_pharm {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
}

.status-badge.paid {
    background: #e0f2fe;
    color: #0c4a6e;
}

.status-badge.ready_for_pickup {
    background: #ffedd5;
    color: #9a3412;
}

.status-badge.picked_up {
    background: #dcfce7;
    color: #166534;
}

.status-badge.out_for_delivery {
    background: #e0e7ff;
    color: #3730a3;
}

.status-badge.delivered {
    background: #dcfce7;
    color: #166534;
}

.status-badge.returned {
    background: #fee2e2;
    color: #991b1b;
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
    padding: 0.75rem;
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 720px;
    max-height: calc(100dvh - 1.5rem);
    overflow: hidden;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
}

.priority-modal {
    max-width: 640px;
}

.modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 2;
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
    padding: 1rem 1.25rem 1.25rem;
    overflow-y: auto;
}

.reimbursement-modal {
    max-width: 520px;
}

.reimbursement-icon {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
}

.reimbursement-summary {
    margin: 1rem 0 1.15rem;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: grid;
    gap: 0.55rem;
}

.reimbursement-summary div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.84rem;
    color: #475569;
}

.reimbursement-summary strong {
    color: #0f172a;
}

.reimbursement-summary .net {
    padding-top: 0.55rem;
    border-top: 1px solid #dbe4ee;
    font-weight: 700;
}

.priority-hero {
    padding: 1rem;
    border-radius: 14px;
    background: linear-gradient(135deg, #0f172a, #1d4ed8 60%, #0891b2);
    color: #ffffff;
    margin-bottom: 1rem;
}

.priority-kicker {
    margin: 0 0 0.45rem 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #bfdbfe;
}

.priority-copy {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.65;
    color: #e0f2fe;
}

.priority-points {
    display: grid;
    gap: 0.8rem;
}

.priority-point {
    display: grid;
    gap: 0.25rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
}

.priority-point strong {
    font-size: 0.9rem;
    color: #111827;
}

.priority-point span {
    font-size: 0.83rem;
    line-height: 1.6;
    color: #475569;
}

.priority-point.muted {
    background: #f8fafc;
    border-style: dashed;
}

.priority-shortfall {
    margin-top: 0.9rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    background: #fff7ed;
    border: 1px solid #fdba74;
    display: grid;
    gap: 0.2rem;
}

.priority-shortfall strong {
    font-size: 0.88rem;
    color: #9a3412;
}

.priority-shortfall span {
    font-size: 0.8rem;
    line-height: 1.55;
    color: #9a3412;
}

.priority-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
}

.priority-back {
    padding: 0.8rem 1rem;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
}

.priority-submit {
    min-width: 220px;
}

.priority-topup {
    padding-inline: 1rem;
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

.payment-action {
    margin-bottom: 1rem;
}

.pay-request-btn {
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.pay-request-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(2, 132, 199, 0.25);
}

.pay-request-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.pay-svg {
    width: 16px;
    height: 16px;
}

.payment-note {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: #6b7280;
}

.cancel-action {
    margin-bottom: 1rem;
}

.cancel-request-btn {
    width: 100%;
    border: 1px solid #fca5a5;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    background: #fff1f2;
    color: #b91c1c;
    font-weight: 700;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.cancel-request-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(185, 28, 28, 0.12);
}

.cancel-request-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
    .request-shell-head {
        flex-direction: column;
        align-items: stretch;
    }

    .shell-title {
        font-size: 1.2rem;
    }

    .shell-stats {
        width: 100%;
    }

    .shell-pill {
        flex: 1;
    }

    .step-label {
        display: none;
    }

    .step-bar {
        padding: 0.9rem 0.75rem;
    }

    .step-line {
        width: 24px;
    }

    .fulfillment-grid {
        grid-template-columns: 1fr;
    }

    .fulfillment-btn {
        text-align: left;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .fulfillment-btn strong,
    .fulfillment-btn span {
        display: block;
    }

    .item-row {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        gap: 0.5rem;
    }

    .qty-input {
        width: 64px;
    }

    .remove-btn {
        justify-self: end;
    }

    .modal-overlay {
        align-items: flex-end;
        padding: 0;
    }

    .modal-content {
        max-width: none;
        width: 100%;
        max-height: 92dvh;
        border-radius: 16px 16px 0 0;
    }

    .modal-header,
    .modal-body {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .review-addr {
        max-width: 68%;
    }

    .toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
    }

    .step-nav {
        gap: 0.5rem;
    }

    .nav-next,
    .nav-submit {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .form-section,
    .list-section {
        padding: 1rem;
        border-radius: 14px;
    }

    .sub-tabs {
        padding: 0.3rem;
    }

    .request-list-tabs {
        flex-direction: column;
    }

    .request-card-copy {
        align-items: flex-start;
        flex-direction: column;
    }

    .request-meta {
        gap: 0.5rem;
        flex-direction: column;
        align-items: stretch;
    }

    .request-meta span {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
