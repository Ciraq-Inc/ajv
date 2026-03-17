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
            <div class="step-content">
                <h3 class="step-title">What do you need?</h3>
                <p class="step-desc">Add your items or send clear prescription photos, confirm your location, choose delivery or pickup, and send the request from this page.</p>
                <div v-if="!canSearchProducts" class="search-lock-card">
                    <div class="search-lock-copy">
                        <strong>Top up your wallet to start a Priority Search.</strong>
                        <span>You need at least GHS {{ requestFee.toFixed(2) }} in your wallet before product search becomes available. Current wallet balance: GHS {{ walletBalance.toFixed(2) }}.</span>
                    </div>
                    <button type="button" class="location-help-btn" @click="openWalletTab">
                        Top Up Wallet
                    </button>
                </div>

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
                <div class="location-help-card" :class="{ error: !!locationIssue }">
                    <p class="location-help-copy">
                        {{ locationIssue ? locationIssue.message : 'Helps find pharmacies near you for faster delivery or pickup.' }}
                    </p>
                    <div v-if="homeLocationAvailable && locationMode !== 'current-request' && !locationIssue" class="location-help-actions">
                        <button type="button" class="location-help-btn" @click="getLocation">
                            Use Different Location For This Request
                        </button>
                    </div>
                    <div v-if="homeLocationAvailable && locationMode === 'current-request'" class="location-help-actions">
                        <button type="button" class="location-help-btn secondary" @click="restoreSavedHomeLocation">
                            Use Saved Home Address
                        </button>
                        <button type="button" class="location-help-btn" @click="getLocation">
                            Refresh Request Location
                        </button>
                    </div>
                    <div v-if="locationIssue" class="location-help-actions">
                        <button type="button" class="location-help-btn" @click="getLocation">Try Again</button>
                        <button type="button" class="location-help-btn secondary" @click="openLocationSettings">
                            Open Settings
                        </button>
                    </div>
                    <p v-if="locationIssue" class="location-help-note">{{ locationIssue.instructions }}</p>
                </div>

                <div class="items-list">
                    <div v-for="(item, index) in requestItems" :key="index" class="item-row">
                        <span class="item-num">{{ index + 1 }}</span>
                        <div class="item-main">
                            <div class="item-search-shell" :class="{ locked: !canSearchProducts }">
                                <div class="item-search-head">
                                    <strong>Search for a medicine</strong>
                                    <span>Type a name, brand, or strength. You can still enter it manually.</span>
                                </div>
                                <div class="input-wrap relative clickable-input-wrap" @click="$event.currentTarget.querySelector('input')?.focus()">
                                    <MagnifyingGlassIcon class="item-search-icon" />
                                    <input v-model="item.product_name" type="text" placeholder="Search medicine name, brand, or strength"
                                        :disabled="!canSearchProducts"
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
                                                    {{ [res.strength, res.unit].filter(Boolean).join(' - ') }}
                                                </div>
                                                <div v-if="res.available_at" class="text-xs text-green-600 mt-1 font-medium">
                                                    In stock nearby
                                                </div>
                                            </div>
                                            <div v-if="item.searchResults.length === 0 && item.product_name.length > 2"
                                                class="search-item no-results">
                                                No matches found. Using custom entry.
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                            <div class="item-upload-row">
                                <label class="item-upload-btn">
                                    <CameraIcon class="upload-svg" />
                                    <span>{{ item.imageFiles.length ? `Add photos (${item.imageFiles.length})` : 'Add item photo' }}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        class="hidden-input"
                                        @change="onItemImagesSelected($event, item)"
                                    />
                                </label>
                                <span v-if="item.imageFiles.length" class="item-upload-note">Attached only to this product.</span>
                            </div>
                            <div v-if="item.imageFiles.length" class="item-image-grid">
                                <div v-for="(image, imageIndex) in item.imageFiles" :key="image.id" class="item-image-card">
                                    <img :src="image.previewUrl" :alt="`${item.product_name || 'Requested item'} photo ${imageIndex + 1}`" class="item-image-preview" />
                                    <div class="item-image-actions">
                                        <label class="preview-action-btn">
                                            Replace
                                            <input
                                                type="file"
                                                accept="image/*"
                                                class="hidden-input"
                                                @change="replaceItemImage($event, item, imageIndex)"
                                            />
                                        </label>
                                        <button type="button" class="preview-action-btn danger" @click="removeItemImage(item, imageIndex)">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="qty-picker">
                            <span class="qty-label">Qty</span>
                            <div class="qty-controls">
                                <button type="button" class="qty-btn" @click="decrementQty(item)" :disabled="Number(item.quantity || 1) <= 1">
                                    <MinusSmallIcon class="qty-svg" />
                                </button>
                                <input v-model.number="item.quantity" type="number" min="1" placeholder="1"
                                    class="qty-input" />
                                <button type="button" class="qty-btn" @click="incrementQty(item)">
                                    <PlusSmallIcon class="qty-svg" />
                                </button>
                            </div>
                        </div>
                        <button v-if="requestItems.length > 1" @click="removeRequestItem(index)" class="remove-btn"
                            title="Remove">
                            <XMarkIcon class="rm-svg" />
                        </button>
                    </div>
                </div>

                <button @click="addItem" class="add-item-btn" :disabled="!canSearchProducts">
                    <PlusIcon class="add-svg" /> Add Another Item
                </button>

                <!-- Prescription -->
                <div class="prescription-box">
                    <CameraIcon class="prescription-svg" />
                    <div class="prescription-text">
                        <strong>Have a prescription?</strong>
                        <span>Add clear photos of each page. Front and back pages can be uploaded together.</span>
                    </div>
                    <label class="upload-label">
                        <ArrowUpTrayIcon class="upload-svg" />
                        {{ prescriptionFiles.length ? `Add More Photos (${prescriptionFiles.length})` : 'Choose Photos' }}
                        <input
                            ref="prescriptionPicker"
                            type="file"
                            accept="image/*"
                            multiple
                            @change="onPrescriptionFilesSelected"
                            class="hidden-input"
                        />
                    </label>
                    <input
                        ref="prescriptionReplacePicker"
                        type="file"
                        accept="image/*"
                        class="hidden-input"
                        @change="onReplacePrescriptionFile"
                    />
                    <div v-if="prescriptionFiles.length" class="prescription-preview-grid">
                        <div v-for="(image, index) in prescriptionFiles" :key="image.id" class="prescription-preview-card">
                            <img :src="image.previewUrl" :alt="image.file.name" class="prescription-preview-image" />
                            <div class="prescription-preview-copy">
                                <strong>Page {{ index + 1 }}</strong>
                                <span>{{ image.file.name }}</span>
                            </div>
                            <div class="prescription-preview-actions">
                                <button type="button" class="preview-action-btn" @click="queuePrescriptionReplace(index)">Retake</button>
                                <button type="button" class="preview-action-btn danger" @click="removePrescriptionFile(index)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="isUploading" class="upload-progress-card">
                        <div class="upload-progress-head">
                            <strong>Uploading prescription photos</strong>
                            <span>{{ Math.round(uploadProgress) }}%</span>
                        </div>
                        <div class="upload-progress-track">
                            <span class="upload-progress-fill" :style="{ width: `${uploadProgress}%` }"></span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="request-builder-grid">
                <section class="builder-card">
                    <div class="builder-card-head">
                        <div>
                            <h4 class="builder-title">How should we fulfill this request?</h4>
                            <p class="builder-copy">Choose delivery or pickup before sending the request.</p>
                        </div>
                    </div>

                    <div class="fulfillment-section">
                        <div class="fulfillment-grid">
                            <button @click="selectFulfillment('delivery')" type="button" class="fulfillment-btn"
                                :class="{ selected: fulfillmentType === 'delivery' }">
                                <TruckIcon class="ful-svg" />
                                <strong>Delivery</strong>
                                <span>Bring it to me</span>
                            </button>
                            <button @click="selectFulfillment('pickup')" type="button" class="fulfillment-btn"
                                :class="{ selected: fulfillmentType === 'pickup' }">
                                <BuildingStorefrontIcon class="ful-svg" />
                                <strong>Pickup</strong>
                                <span>I will collect it</span>
                            </button>
                        </div>
                    </div>

                    <div class="form-group" v-if="fulfillmentType === 'delivery'">
                        <label>Delivery Address</label>
                        <textarea v-model="deliveryAddress" rows="2"
                            placeholder="e.g. Room 12, Kofi Mensah Hostel, University of Ghana, Legon"
                            class="form-textarea"></textarea>
                        <p class="field-hint">Required for delivery requests.</p>
                    </div>

                    <div class="form-group">
                        <label>Notes <span class="optional">(optional)</span></label>
                        <textarea v-model="customerNotes" rows="2" placeholder="e.g. brand preference, dosage form..."
                            class="form-textarea"></textarea>
                    </div>
                </section>

            <section class="builder-card review-card">
                <div class="builder-card-head">
                    <div>
                        <h4 class="builder-title">Ready to send</h4>
                        <p class="builder-copy">This is the summary pharmacies will receive when you submit the request.</p>
                    </div>
                </div>

                <div class="review-box">
                    <div class="review-section">
                        <span class="review-label">{{ validItems.length ? `Items (${validItems.length})` : 'Prescription review' }}</span>
                        <template v-if="validItems.length">
                            <div v-for="(item, i) in validItems" :key="i" class="review-item">
                                <span>{{ item.product_name }}</span>
                                <span class="review-qty">&times; {{ item.quantity }}</span>
                            </div>
                        </template>
                        <p v-else-if="prescriptionFiles.length" class="review-prescription-only">
                            No typed items yet. Nearby pharmacies will review the prescription images you attached.
                        </p>
                    </div>
                    <div v-if="prescriptionFiles.length" class="review-attach">
                        <PaperClipIcon class="attach-svg" /> {{ prescriptionFiles.length }} prescription image<span v-if="prescriptionFiles.length !== 1">s</span> attached
                    </div>
                    <div class="review-meta">
                        <div class="review-row"><span>Location</span><span class="review-addr">{{ reviewLocationLabel }}</span></div>
                        <div class="review-row"><span>Fulfillment</span><span>{{ fulfillmentType ? formatStatus(fulfillmentType) : 'Not selected' }}</span></div>
                        <div class="review-row" v-if="fulfillmentType === 'delivery'">
                            <span>Address</span><span class="review-addr">{{ compactAddress(deliveryAddress) || 'Not provided' }}</span>
                        </div>
                    </div>
                </div>

                <div class="fee-notice priority-note">
                    <InformationCircleIcon class="info-svg" />
                    <div>
                        <strong>Priority Search includes a GHS {{ requestFee.toFixed(2) }} charge</strong>
                        <span>The charge is deducted when you send the request. Keep at least GHS {{ requestFee.toFixed(2) }} in your wallet before you start searching.</span>
                    </div>
                </div>
            </section>
        </div>

        <div class="request-submit-bar">
            <div class="request-submit-copy">
                <strong>Send this request when everything looks right.</strong>
                <span>Nearby pharmacies will see it immediately after the Priority Search charge is applied.</span>
            </div>
            <button @click="openPriorityGate" :disabled="!canSubmit || isSubmitting" class="nav-submit request-submit-btn">
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
                        <span class="status-badge" :class="getRequestStatus(req)">{{ formatStatus(getRequestStatus(req)) }}</span>
                    </div>
                    <div class="request-card-copy">
                        <p>{{ getRequestCardSummary(req) }}</p>
                        <ChevronRightIcon class="request-arrow" />
                    </div>
                    <div v-if="shouldShowPrescriptionPreview(req)" class="request-prescription-preview">
                        <a
                            :href="req.prescription_images[0]"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="request-prescription-thumb-link"
                            @click.stop
                        >
                            <img :src="req.prescription_images[0]" alt="Prescription preview" class="request-prescription-thumb" />
                        </a>
                        <div class="request-prescription-copy">
                            <strong>Prescription</strong>
                            <span>{{ getPrescriptionImageCount(req) }} image<span v-if="getPrescriptionImageCount(req) !== 1">s</span></span>
                        </div>
                    </div>
                    <div class="request-meta">
                        <span>
                            <CubeIcon class="meta-svg" /> {{ getRequestContentCount(req) }}
                        </span>
                        <span v-if="getRequestTotal(req) !== null">
                            <CurrencyDollarIcon class="meta-svg" /> Total: GHS {{ formatMoney(getRequestTotal(req)) }}
                        </span>
                        <span v-if="req.request_fee">
                            <CurrencyDollarIcon class="meta-svg" /> Hold: GHS {{
                                parseFloat(req.request_fee).toFixed(2) }}
                        </span>
                        <span v-if="req.fulfillment_type">
                            <TruckIcon class="meta-svg" /> {{ req.fulfillment_type
                            }}
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" :class="getRequestStatus(req)"
                            :style="{ width: statusProgress(getRequestStatus(req)) + '%' }">
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
                        <span class="status-badge" :class="getRequestStatus(selectedRequest)">{{
                            formatStatus(getRequestStatus(selectedRequest))
                            }}</span>
                    </div>
                    <button @click="selectedRequest = null" class="modal-close">
                        <XMarkIcon class="close-svg" />
                    </button>
                </div>

                <div class="modal-body">
                    <div v-if="selectedRequest.prescription_images?.length" class="detail-section">
                        <span class="detail-label">Prescription Images</span>
                        <div class="detail-prescription-grid">
                            <a
                                v-for="(imageUrl, imageIndex) in selectedRequest.prescription_images"
                                :key="`prescription-${imageIndex}`"
                                :href="imageUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="detail-prescription-link"
                            >
                                <img :src="imageUrl" :alt="`Prescription image ${imageIndex + 1}`" class="detail-prescription-image" />
                            </a>
                        </div>
                    </div>

                    <!-- Items -->
                    <div v-if="selectedRequest.items?.length" class="detail-section">
                        <span class="detail-label">Items</span>
                        <div v-for="item in selectedRequest.items" :key="item.id" class="detail-item">
                            <div>
                                <strong>{{ item.product_name }}</strong>
                                <span class="item-qty">Qty: {{ item.quantity }}</span>
                                <div v-if="item.item_images?.length" class="detail-item-images">
                                    <a
                                        v-for="(imageUrl, imageIndex) in item.item_images"
                                        :key="`${item.id}-img-${imageIndex}`"
                                        :href="imageUrl"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="detail-item-image-link"
                                    >
                                        <img :src="imageUrl" :alt="`${item.product_name} photo ${imageIndex + 1}`" class="detail-item-image" />
                                    </a>
                                </div>
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

                    <div v-if="canLeaveFeedback(selectedRequest)" class="feedback-card">
                        <div class="feedback-head">
                            <div>
                                <span class="detail-label">Your Feedback</span>
                                <p class="feedback-copy">How did this request feel from start to finish?</p>
                            </div>
                            <span v-if="selectedRequest.feedback?.created_at" class="feedback-date">
                                {{ formatDate(selectedRequest.feedback.created_at) }}
                            </span>
                        </div>

                        <div class="feedback-stars" role="radiogroup" aria-label="Rate this request">
                            <button
                                v-for="star in 5"
                                :key="`feedback-star-${star}`"
                                type="button"
                                class="feedback-star-btn"
                                :class="{ active: star <= feedbackForm.rating }"
                                @click="feedbackForm.rating = star"
                            >
                                <StarIcon class="feedback-star-icon" />
                                <span class="sr-only">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                            </button>
                        </div>

                        <textarea
                            v-model="feedbackForm.comment"
                            rows="3"
                            maxlength="1000"
                            class="form-textarea feedback-textarea"
                            placeholder="Optional: tell us what worked well or what felt difficult."
                        ></textarea>

                        <div class="feedback-actions">
                            <span v-if="selectedRequest.feedback?.rating" class="feedback-saved-note">
                                Saved rating: {{ selectedRequest.feedback.rating }}/5
                            </span>
                            <button
                                type="button"
                                class="nav-submit feedback-submit-btn"
                                :disabled="savingFeedback"
                                @click="submitFeedback"
                            >
                                <ArrowPathIcon v-if="savingFeedback" class="nav-svg spin" />
                                <span>{{ savingFeedback ? 'Saving...' : (selectedRequest.feedback ? 'Update Feedback' : 'Submit Feedback') }}</span>
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedRequest.pending_decisions?.length" class="decision-panel">
                        <span class="detail-label">Customer Decision</span>
                        <div v-for="decision in selectedRequest.pending_decisions" :key="decision.id" class="decision-card">
                            <span class="decision-eyebrow" :class="getDecisionVariantClass(decision)">{{ getDecisionEyebrow(decision) }}</span>
                            <div class="decision-copy">
                                <strong>{{ decision.title }}</strong>
                                <p>{{ decision.message }}</p>
                            </div>
                            <p v-if="getDecisionConciseSummary(decision)" class="decision-flow-headline">
                                {{ getDecisionConciseSummary(decision) }}
                            </p>

                            <div v-if="getDecisionItems(decision).length" class="decision-item-list">
                                <div
                                    v-for="decisionItem in getDecisionItems(decision)"
                                    :key="`${decision.id}-${decisionItem.item_id}`"
                                    class="decision-item-row"
                                >
                                    <div class="decision-item-copy">
                                        <strong>{{ decisionItem.product_name }}</strong>
                                        <span class="decision-item-meta">Qty: {{ decisionItem.quantity }}</span>
                                        <span v-if="shouldShowDecisionItemPrice(decisionItem)" class="decision-item-meta">
                                            GHS {{ formatMoney(decisionItem.unit_price) }} each
                                        </span>
                                        <span v-if="getDecisionItemRouteText(decision, decisionItem)" class="decision-item-meta source">
                                            {{ getDecisionItemRouteText(decision, decisionItem) }}
                                        </span>
                                        <span v-if="decisionItem.status === 'unavailable'" class="decision-item-meta unavailable">
                                            Unavailable right now
                                        </span>
                                        <div v-if="decisionItem.substitute_option" class="decision-substitute">
                                            <span class="decision-item-meta substitute-label">Suggested alternative</span>
                                            <strong>{{ decisionItem.substitute_option.name }}</strong>
                                            <span v-if="decisionItem.substitute_option.marked_up_price !== null" class="decision-item-meta">
                                                GHS {{ formatMoney(decisionItem.substitute_option.marked_up_price) }} each
                                            </span>
                                            <span v-if="getDecisionSubstituteRouteText(decision, decisionItem)" class="decision-item-meta source">
                                                {{ getDecisionSubstituteRouteText(decision, decisionItem) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="decision-item-actions">
                                        <button
                                            v-for="choice in getDecisionItemChoices(decisionItem)"
                                            :key="`${decision.id}-${decisionItem.item_id}-${choice.value}`"
                                            type="button"
                                            class="decision-item-btn"
                                            :class="{ active: getDecisionChoice(decision, decisionItem) === choice.value }"
                                            @click="setDecisionChoice(decision, decisionItem, choice.value)"
                                        >
                                            {{ choice.label }}
                                        </button>
                                    </div>
                                </div>
                                <div class="decision-preview-total">
                                    <span>Updated total</span>
                                    <strong>GHS {{ formatMoney(getDecisionPreviewTotal(decision)) }}</strong>
                                </div>
                            </div>
                            <div class="decision-actions">
                                <button
                                    class="decision-btn secondary"
                                    :disabled="respondingDecisionId === decision.id"
                                    @click="respondToDecision(decision, 'declined')"
                                >
                                    {{ getDecisionDeclineLabel(decision) }}
                                </button>
                                <button
                                    class="decision-btn primary"
                                    :disabled="respondingDecisionId === decision.id"
                                    @click="respondToDecision(decision, 'approved')"
                                >
                                    {{ respondingDecisionId === decision.id ? 'Saving...' : getDecisionApproveLabel(decision) }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="canPayRequest(selectedRequest)" class="payment-action">
                        <div class="payment-method-grid">
                            <button
                                @click="payForRequest(selectedRequest.id, 'wallet')"
                                class="pay-request-btn"
                                :disabled="payingRequest"
                            >
                                <ArrowPathIcon v-if="payingRequest && payingMethod === 'wallet'" class="pay-svg spin" />
                                <CurrencyDollarIcon v-else class="pay-svg" />
                                <span>{{ payingRequest && payingMethod === 'wallet' ? 'Processing wallet payment...' : `Pay with Wallet` }}</span>
                            </button>
                            <button
                                @click="payForRequest(selectedRequest.id, 'paystack')"
                                class="pay-request-btn secondary-pay-btn"
                                :disabled="payingRequest"
                            >
                                <ArrowPathIcon v-if="payingRequest && payingMethod === 'paystack'" class="pay-svg spin" />
                                <i v-else class="ri-bank-card-line pay-svg"></i>
                                <span>{{ payingRequest && payingMethod === 'paystack' ? 'Redirecting to Paystack...' : 'Pay with Paystack' }}</span>
                            </button>
                        </div>
                        <p class="payment-note">Choose wallet or Paystack. Direct Paystack payments are also recorded in your wallet history.</p>
                        <div
                            v-if="paymentShortfall.requestId === selectedRequest.id && paymentShortfall.amount > 0"
                            class="payment-shortfall"
                        >
                            <div class="payment-shortfall-head">
                                <div class="payment-shortfall-icon">
                                    <ExcTriIcon class="payment-shortfall-svg" />
                                </div>
                                <div class="payment-shortfall-copy">
                                    <strong>Add funds to continue</strong>
                                    <span>Your wallet balance is below the amount needed for this payment.</span>
                                </div>
                                <div class="payment-shortfall-amount">
                                    GHS {{ paymentShortfall.amount.toFixed(2) }}
                                </div>
                            </div>
                            <div class="payment-shortfall-actions">
                                <span class="payment-shortfall-note">Top up this amount to complete the payment from your wallet.</span>
                                <button @click="openWalletTab" class="priority-topup payment-topup-btn">
                                    Top Up Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="isPaymentPendingRequest(selectedRequest)" class="payment-action payment-action--pending">
                        <p class="payment-note">Payment will appear here once item pricing is confirmed for this request.</p>
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
                        <MapPinIcon class="detail-svg" /> {{ compactAddress(selectedRequest.customer_address || selectedRequest.delivery_address) }}
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
                        <span class="status-badge confirming_with_pharm">GHS {{ requestFee.toFixed(2) }} charge</span>
                    </div>
                    <button @click="showPriorityModal = false" class="modal-close">
                        <XMarkIcon class="close-svg" />
                    </button>
                </div>

                <div class="modal-body">
                    <div class="priority-hero">
                        <p class="priority-kicker">Why this charge exists</p>
                        <p class="priority-copy">
                            Your request reaches the front of the queue because it is backed by a GHS {{ requestFee.toFixed(2) }} Priority Search charge. That tells nearby pharmacies to check stock immediately instead of treating it like a casual enquiry.
                        </p>
                    </div>

                    <div class="priority-points">
                        <div class="priority-point">
                            <strong>Before you search</strong>
                            <span>Your wallet must have at least GHS {{ requestFee.toFixed(2) }} available before product search becomes available.</span>
                        </div>
                        <div class="priority-point">
                            <strong>When you send the request</strong>
                            <span>The GHS {{ requestFee.toFixed(2) }} covers the pharmacist's time spent checking shelves and confirming availability for you.</span>
                        </div>
                    </div>

                    <div v-if="submitShortfall > 0" class="priority-shortfall">
                        <strong>You need GHS {{ submitShortfall.toFixed(2) }} more in your wallet.</strong>
                        <span>Top up first, then come back to pay the Priority Search charge and send the request.</span>
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
                                Charge GHS {{ requestFee.toFixed(2) }} &amp; Send Request
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
                <h3>Request Submitted</h3>
                <p>Your Priority Search charge has been applied and nearby pharmacies can now review your request.</p>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import imageCompression from 'browser-image-compression'
import { useUserStore } from '~/stores/user'
import { formatCompactAddress } from '~/utils/addressFormat'
import {
    PlusCircleIcon, ClipboardDocumentListIcon as ClipDocList, CheckIcon, PlusIcon, XMarkIcon,
    CameraIcon, ArrowUpTrayIcon, MapPinIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon,
    PaperClipIcon, InformationCircleIcon, CubeIcon, CurrencyDollarIcon, TruckIcon, StarIcon,
    BuildingStorefrontIcon, ChatBubbleLeftIcon, CheckBadgeIcon, MagnifyingGlassIcon,
    MinusSmallIcon, PlusSmallIcon,
    ExclamationTriangleIcon as ExcTriIcon, CheckCircleIcon
} from '@heroicons/vue/24/outline'
import { MapPinIcon as MapPinIconSolid, CheckCircleIcon as CheckCircleIconSolid, PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/vue/24/solid'

const props = defineProps({
    defaultSubTab: { type: String, default: 'new' },
    initialRequestId: { type: [String, Number], default: null }
})

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const subTab = ref(props.defaultSubTab)
const isSubmitting = ref(false)
const loadingRequests = ref(false)
const gettingLocation = ref(false)
const payingRequest = ref(false)
const payingMethod = ref('')
const cancelingRequest = ref(false)
const toast = ref(null)
const showSuccess = ref(false)
const showPriorityModal = ref(false)
const submittedNumber = ref('')
const requestFee = ref(5)
const requestRefundMinutes = ref(30)
const walletBalance = ref(0)
const submitShortfall = ref(0)
const paymentShortfall = ref({
    requestId: null,
    amount: 0
})

const newItem = () => ({
    product_name: '',
    quantity: 1,
    searchResults: [],
    loading: false,
    showDropdown: false,
    imageFiles: []
})

const requestItems = ref([newItem()])
const prescriptionPicker = ref(null)
const prescriptionReplacePicker = ref(null)
const prescriptionFiles = ref([])
const prescriptionReplaceIndex = ref(null)
const customerLat = ref(null)
const customerLng = ref(null)
const savedHomeLocation = ref(null)
const locationMode = ref('none')
const fulfillmentType = ref('')
const customerAddress = ref('')
const deliveryAddress = ref('')
const customerNotes = ref('')
const locationIssue = ref(null)
const uploadProgress = ref(0)

const myRequests = ref([])
const selectedRequest = ref(null)
const requestListTab = ref('active')
const respondingDecisionId = ref(null)
const decisionSelections = ref({})
const savingFeedback = ref(false)
const feedbackForm = ref({
    rating: 0,
    comment: ''
})
const POLL_INTERVAL_MS = 15000
let pollTimer = null
const payableStatuses = new Set(['confirmed_in_pharm', 'awaiting_customer', 'items_sourced', 'confirmed'])

const validItems = computed(() => requestItems.value.filter(i => i.product_name.trim()))
const hasPrescriptionFiles = computed(() => prescriptionFiles.value.length > 0)
const hasItemImageFiles = computed(() => requestItems.value.some((item) => Array.isArray(item.imageFiles) && item.imageFiles.length > 0))
const hasMultipartUploads = computed(() => hasPrescriptionFiles.value || hasItemImageFiles.value)
const isUploading = computed(() => isSubmitting.value && uploadProgress.value > 0)
const homeLocationAvailable = computed(() => !!(savedHomeLocation.value?.latitude && savedHomeLocation.value?.longitude))
const canSearchProducts = computed(() => Number(walletBalance.value || 0) >= Number(requestFee.value || 5))
const canSubmit = computed(() => {
    const hasRequestContent = validItems.value.length > 0 || prescriptionFiles.value.length > 0
    if (!(hasRequestContent && customerLat.value && fulfillmentType.value)) return false
    if (fulfillmentType.value === 'delivery') return !!deliveryAddress.value.trim()
    return true
})

const locationLabel = computed(() => {
    if (locationMode.value === 'home' && homeLocationAvailable.value) return 'Home location ready'
    if (locationMode.value === 'current-request' && customerLat.value) return 'Request location updated'
    if (customerLat.value) return 'Location set'
    if (gettingLocation.value) return 'Getting location...'
    if (homeLocationAvailable.value) return 'Use current location for this request'
    return 'Use My Current Location'
})
const locationSublabel = computed(() => {
    if (locationMode.value === 'home' && savedHomeLocation.value?.address) {
        return formatCompactAddress(savedHomeLocation.value.address, { primaryCount: 3, fallback: savedHomeLocation.value.address })
    }
    if (locationMode.value === 'current-request' && customerAddress.value) {
        return formatCompactAddress(customerAddress.value, { primaryCount: 3, fallback: customerAddress.value })
    }
    if (customerLat.value) return `${customerLat.value.toFixed(4)}, ${customerLng.value.toFixed(4)}`
    return 'We need this to find nearby pharmacies'
})

const compactAddress = (value) => formatCompactAddress(value, { primaryCount: 3, fallback: value || '' })

const reviewLocationLabel = computed(() => {
    if (customerAddress.value) {
        return compactAddress(customerAddress.value)
    }
    if (customerLat.value) return 'Location set'
    return 'Not set'
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

const buildLocationIssue = (message, instructions) => ({ message, instructions })

const applySavedHomeLocation = (homeLocation, { force = false } = {}) => {
    if (!homeLocation?.latitude || !homeLocation?.longitude) return
    if (!force && (customerLat.value || customerLng.value || locationMode.value === 'current-request')) return

    customerLat.value = Number(homeLocation.latitude)
    customerLng.value = Number(homeLocation.longitude)
    customerAddress.value = homeLocation.address || ''
    if (fulfillmentType.value === 'delivery' && (!deliveryAddress.value.trim() || force || locationMode.value !== 'current-request')) {
        deliveryAddress.value = homeLocation.address || ''
    }
    locationMode.value = 'home'
}

const loadSavedHomeLocation = async () => {
    try {
        const profile = await userStore.getProfile()
        const address = profile?.home_address || profile?.address || ''
        const latitude = profile?.home_latitude ?? profile?.latitude ?? null
        const longitude = profile?.home_longitude ?? profile?.longitude ?? null

        if (latitude && longitude) {
            savedHomeLocation.value = {
                address,
                latitude: Number(latitude),
                longitude: Number(longitude)
            }
            applySavedHomeLocation(savedHomeLocation.value)
        } else {
            savedHomeLocation.value = null
        }
    } catch (error) {
        savedHomeLocation.value = null
    }
}

const restoreSavedHomeLocation = () => {
    if (!savedHomeLocation.value) return
    applySavedHomeLocation(savedHomeLocation.value, { force: true })
    locationIssue.value = null
    showToast('Saved home location restored')
}

const selectFulfillment = (type) => {
    fulfillmentType.value = type
    if (type === 'delivery' && !deliveryAddress.value.trim()) {
        deliveryAddress.value = customerAddress.value || ''
    }
}

const isFeedbackEligibleStatus = (status) => ['picked_up', 'delivered', 'completed'].includes(getCustomerStatus(status))

const canLeaveFeedback = (request) => isFeedbackEligibleStatus(request?.status)

const syncFeedbackForm = () => {
    const feedback = selectedRequest.value?.feedback || null
    feedbackForm.value = {
        rating: Number(feedback?.rating || 0),
        comment: feedback?.comment || ''
    }
}

const getPlatformLocationSettingsLink = () => {
    if (typeof window === 'undefined') return null
    const ua = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) return 'app-settings:'
    if (/android/.test(ua)) return 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end'
    return null
}

const openLocationSettings = () => {
    const deepLink = getPlatformLocationSettingsLink()
    if (deepLink) {
        window.location.href = deepLink
        return
    }
    showToast('Open your browser site settings and allow location access for this page.', 'info')
}

const createPrescriptionPreview = (file) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file)
})

const compressRequestImage = async (file) => {
    const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true
    }

    try {
        const compressedFile = await imageCompression(file, options)
        return new File(
            [compressedFile],
            compressedFile.name || file.name,
            {
                type: compressedFile.type || file.type,
                lastModified: Date.now()
            }
        )
    } catch (error) {
        console.error('Failed to compress request image:', error)
        return file
    }
}

const buildItemPayload = (item) => ({
    product_name: item.product_name.trim(),
    quantity: item.quantity || 1
})

const resetPickerInput = (pickerRef) => {
    if (pickerRef?.value) pickerRef.value.value = ''
}

const revokePrescriptionPreview = (image) => {
    if (image?.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
    }
}

const appendPrescriptionFiles = async (files = []) => {
    const accepted = Array.from(files).slice(0, Math.max(0, 6 - prescriptionFiles.value.length))
    if (!accepted.length) return
    const compressedFiles = await Promise.all(accepted.map(compressRequestImage))
    const nextFiles = compressedFiles.map(createPrescriptionPreview)
    prescriptionFiles.value = [...prescriptionFiles.value, ...nextFiles]
}

const onPrescriptionFilesSelected = async (event) => {
    await appendPrescriptionFiles(event.target.files || [])
    resetPickerInput(prescriptionPicker)
}

const queuePrescriptionReplace = (index) => {
    prescriptionReplaceIndex.value = index
    prescriptionReplacePicker.value?.click()
}

const onReplacePrescriptionFile = async (event) => {
    const replacement = event.target.files?.[0]
    const index = prescriptionReplaceIndex.value
    if (!replacement || index === null || !prescriptionFiles.value[index]) {
        resetPickerInput(prescriptionReplacePicker)
        prescriptionReplaceIndex.value = null
        return
    }

    const compressedReplacement = await compressRequestImage(replacement)
    revokePrescriptionPreview(prescriptionFiles.value[index])
    prescriptionFiles.value.splice(index, 1, createPrescriptionPreview(compressedReplacement))
    resetPickerInput(prescriptionReplacePicker)
    prescriptionReplaceIndex.value = null
}

const removePrescriptionFile = (index) => {
    const current = prescriptionFiles.value[index]
    revokePrescriptionPreview(current)
    prescriptionFiles.value.splice(index, 1)
}

const appendItemImages = async (item, files = []) => {
    const accepted = Array.from(files).slice(0, Math.max(0, 6 - (item.imageFiles?.length || 0)))
    if (!accepted.length) return
    const compressedFiles = await Promise.all(accepted.map(compressRequestImage))
    const nextFiles = compressedFiles.map(createPrescriptionPreview)
    item.imageFiles = [...(item.imageFiles || []), ...nextFiles]
}

const onItemImagesSelected = async (event, item) => {
    await appendItemImages(item, event.target.files || [])
    resetPickerInput({ value: event.target })
}

const replaceItemImage = async (event, item, imageIndex) => {
    const replacement = event.target.files?.[0]
    if (!replacement || !item?.imageFiles?.[imageIndex]) {
        resetPickerInput({ value: event.target })
        return
    }

    const compressedReplacement = await compressRequestImage(replacement)
    revokePrescriptionPreview(item.imageFiles[imageIndex])
    item.imageFiles.splice(imageIndex, 1, createPrescriptionPreview(compressedReplacement))
    resetPickerInput({ value: event.target })
}

const removeItemImage = (item, imageIndex) => {
    const current = item?.imageFiles?.[imageIndex]
    if (!current) return
    revokePrescriptionPreview(current)
    item.imageFiles.splice(imageIndex, 1)
}

const cleanupItemImages = (item) => {
    ;(item?.imageFiles || []).forEach(revokePrescriptionPreview)
}

const removeRequestItem = (index) => {
    const item = requestItems.value[index]
    cleanupItemImages(item)
    requestItems.value.splice(index, 1)
}

const reverseGeocodeLocation = async (lat, lng) => {
    const res = await apiCall('GET', `/api/auth/customer/reverse-geocode?lat=${lat}&lng=${lng}`)
    return res.data || null
}

const getLocation = () => {
    if (!navigator.geolocation) {
        locationIssue.value = buildLocationIssue(
            'Location is not available in this browser.',
            'Try a modern browser on your phone, then allow location access and try again.'
        )
        return showToast('Geolocation not supported', 'error')
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        locationIssue.value = buildLocationIssue(
            'Location needs a secure page before it can work here.',
            'Open the secure site, then allow location access for your browser and try again.'
        )
        showToast('Location access requires HTTPS on staging. Use a secure URL to continue.', 'error')
        return
    }
    gettingLocation.value = true
    locationIssue.value = null
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            customerLat.value = pos.coords.latitude
            customerLng.value = pos.coords.longitude
            locationMode.value = 'current-request'
            try {
                const locationData = await reverseGeocodeLocation(customerLat.value, customerLng.value)
                if (locationData?.address) {
                    customerAddress.value = locationData.address
                    if (fulfillmentType.value === 'delivery') {
                        deliveryAddress.value = locationData.address
                    }
                }
            } catch (error) {
                console.error('Reverse geocode failed:', error)
            } finally {
                gettingLocation.value = false
                locationIssue.value = null
                showToast('Location set!')
            }
        },
        (error) => {
            gettingLocation.value = false
            if (error?.code === error.PERMISSION_DENIED) {
                locationIssue.value = buildLocationIssue(
                    'Location permission is off for this page.',
                    'Turn on GPS, then allow location access in your browser settings for this site.'
                )
                return showToast('Location permission was denied. Allow location access and try again.', 'error')
            }
            if (error?.code === error.POSITION_UNAVAILABLE) {
                locationIssue.value = buildLocationIssue(
                    'We could not read your location just now.',
                    'Check that GPS is on, move to a clearer signal area, then try again.'
                )
                return showToast('Your location is unavailable right now. Check GPS and try again.', 'error')
            }
            if (error?.code === error.TIMEOUT) {
                locationIssue.value = buildLocationIssue(
                    'Location is taking too long to load.',
                    'Check that GPS is on and try again. If it keeps failing, open browser settings and re-enable location access.'
                )
                return showToast('Location request timed out. Try again.', 'error')
            }
            locationIssue.value = buildLocationIssue(
                'We could not get your location right now.',
                'Check GPS and browser location permission, then try again.'
            )
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
        syncDecisionSelections()
        syncFeedbackForm()
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
        syncDecisionSelections()
        syncFeedbackForm()
    } catch (e) {
        if (!silent) showToast('Failed to load request', 'error')
    }
}

const refreshSelectedRequest = async () => {
    if (!selectedRequest.value?.id) return
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${selectedRequest.value.id}`)
        selectedRequest.value = res.data
        syncDecisionSelections()
        syncFeedbackForm()
    } catch (e) { }
}

const submitFeedback = async () => {
    if (!selectedRequest.value?.id || savingFeedback.value) return
    const rating = Number(feedbackForm.value.rating || 0)
    if (rating < 1 || rating > 5) {
        showToast('Choose a star rating before saving feedback.', 'error')
        return
    }

    savingFeedback.value = true
    try {
        const res = await apiCall('POST', `/api/order-requests/customer/${selectedRequest.value.id}/feedback`, {
            rating,
            comment: feedbackForm.value.comment?.trim() || ''
        })

        selectedRequest.value = {
            ...selectedRequest.value,
            feedback: res.data
        }
        syncFeedbackForm()
        showToast(res.message || 'Thanks for sharing your feedback')
        selectedRequest.value = null
    } catch (e) {
        showToast(e.message || 'Failed to save feedback', 'error')
    } finally {
        savingFeedback.value = false
    }
}

const fetchWalletBalance = async () => {
    try {
        const res = await apiCall('GET', '/api/wallet')
        walletBalance.value = Number(res.data?.balance || 0)
    } catch (e) {
        walletBalance.value = 0
    }
}

const submitMultipartRequest = (formData) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/api/order-requests/customer`)
    xhr.setRequestHeader('Authorization', `Bearer ${userStore.customerAuthToken}`)

    xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        uploadProgress.value = (event.loaded / event.total) * 100
    }

    xhr.onload = () => {
        try {
            const json = JSON.parse(xhr.responseText || '{}')
            if (xhr.status >= 200 && xhr.status < 300 && json.success) {
                resolve(json)
                return
            }
            const err = new Error(json.message || `Error ${xhr.status}`)
            err.status = xhr.status
            err.data = json.data
            reject(err)
        } catch (_error) {
            reject(new Error('Failed to parse upload response'))
        }
    }

    xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
    xhr.send(formData)
})

const submitRequest = async () => {
    if (!canSubmit.value) return
    isSubmitting.value = true
    uploadProgress.value = 0
    try {
        const payload = {
            items: validItems.value.map(buildItemPayload),
            customer_latitude: customerLat.value,
            customer_longitude: customerLng.value,
            fulfillment_type: fulfillmentType.value,
            delivery_address: deliveryAddress.value.trim(),
            customer_address: (customerAddress.value || deliveryAddress.value).trim(),
            customer_notes: customerNotes.value.trim(),
        }
        let res
        if (hasMultipartUploads.value) {
            const formData = new FormData()
            formData.append('items', JSON.stringify(payload.items))
            formData.append('customer_latitude', String(payload.customer_latitude))
            formData.append('customer_longitude', String(payload.customer_longitude))
            formData.append('fulfillment_type', payload.fulfillment_type)
            formData.append('delivery_address', payload.delivery_address)
            formData.append('customer_address', payload.customer_address)
            formData.append('customer_notes', payload.customer_notes)
            prescriptionFiles.value.forEach((image) => formData.append('prescription_images', image.file))
            validItems.value.forEach((item, index) => {
                item.imageFiles.forEach((image) => formData.append(`item_images_${index}`, image.file))
            })
            res = await submitMultipartRequest(formData)
        } else {
            res = await apiCall('POST', '/api/order-requests/customer', payload)
        }
        submittedNumber.value = res.data?.request_number || ''
        submitShortfall.value = 0
        showPriorityModal.value = false
        showSuccess.value = true
        requestItems.value.forEach(cleanupItemImages)
        requestItems.value = [newItem()]
        prescriptionFiles.value.forEach(revokePrescriptionPreview)
        prescriptionFiles.value = []
        resetPickerInput(prescriptionPicker)
        resetPickerInput(prescriptionReplacePicker)
        fulfillmentType.value = ''
        customerAddress.value = ''
        deliveryAddress.value = ''
        customerNotes.value = ''
        customerLat.value = null
        customerLng.value = null
        locationMode.value = 'none'
        applySavedHomeLocation(savedHomeLocation.value, { force: true })
    } catch (e) {
        if (e.status === 402) {
            submitShortfall.value = Number(e.data?.shortfall || e.data?.required_fee || requestFee.value)
            showToast(`Insufficient wallet balance for the GHS ${requestFee.value.toFixed(2)} Priority Search charge. Top up and try again.`, 'error')
        } else {
            showToast(e.message || 'Failed to submit', 'error')
        }
    }
    finally {
        uploadProgress.value = 0
        isSubmitting.value = false
    }
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
    if (!canSearchProducts.value) {
        item.showDropdown = false
        item.searchResults = []
        return
    }
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
        item.searchResults = []
        if (e.status === 402) {
            walletBalance.value = Number(e.data?.wallet_balance || 0)
            showToast(`You need at least GHS ${requestFee.value.toFixed(2)} in your wallet before Priority Search is available.`, 'error')
        } else {
            console.error(e)
        }
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
const decrementQty = (item) => {
    const current = Number(item?.quantity || 1)
    item.quantity = Math.max(1, current - 1)
}
const incrementQty = (item) => {
    const current = Number(item?.quantity || 1)
    item.quantity = Math.max(1, current + 1)
}

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
const getPrescriptionImageCount = (req) => Array.isArray(req?.prescription_images) ? req.prescription_images.length : 0
const shouldShowPrescriptionPreview = (req) => (Number(req?.item_count || 0) === 0) && getPrescriptionImageCount(req) > 0
const getRequestCardSummary = (req) => {
    if (shouldShowPrescriptionPreview(req)) {
        return 'Prescription attached'
    }

    const itemCount = Number(req?.item_count || 0)
    return itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : '-'
}
const getRequestContentCount = (req) => {
    if (shouldShowPrescriptionPreview(req)) {
        return `${getPrescriptionImageCount(req)} image${getPrescriptionImageCount(req) !== 1 ? 's' : ''}`
    }

    const itemCount = Number(req?.item_count || 0)
    if (itemCount > 0) return `${itemCount} item${itemCount === 1 ? '' : 's'}`
    return '-'
    return `${itemCount || '—'} item${itemCount === 1 ? '' : 's'}`
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
const getRequestStatus = (req) => {
    const rawStatus = getCustomerStatus(req?.status || '')
    if (payableStatuses.has(rawStatus) && getPayableAmount(req) <= 0) {
        return 'confirming_with_pharm'
    }
    return rawStatus
}
const canPayRequest = (req) => {
    if (!req) return false
    if (!payableStatuses.has(req.status)) return false
    return getPayableAmount(req) > 0
}
const isPaymentPendingRequest = (req) => {
    if (!req) return false
    return payableStatuses.has(req.status) && getPayableAmount(req) <= 0
}
const canCancelRequest = (req) => !!req && req.status === 'pending'
const clearRequestPaymentQuery = async (requestId = null) => {
    const nextQuery = { ...route.query, tab: 'requests' }
    delete nextQuery.reference
    delete nextQuery.trxref
    delete nextQuery.requestPayment
    if (requestId) nextQuery.requestId = String(requestId)
    await router.replace({ query: nextQuery })
}
const payForRequest = async (id, method = 'wallet') => {
    if (!id || payingRequest.value) return
    payingRequest.value = true
    payingMethod.value = method
    try {
        paymentShortfall.value = { requestId: null, amount: 0 }

        if (method === 'paystack') {
            const res = await apiCall('POST', `/api/order-requests/customer/${id}/pay/paystack/initialize`)
            if (!res.data?.authorization_url) {
                throw new Error('Paystack checkout could not be started')
            }
            window.location.assign(res.data.authorization_url)
            return
        }

        const res = await apiCall('POST', `/api/order-requests/customer/${id}/pay`)
        await fetchMyRequests({ silent: true })
        if (selectedRequest.value?.id === id) {
            await refreshSelectedRequest()
        }
        showToast(res.message || 'Payment completed successfully')
    } catch (e) {
        if (method === 'wallet' && e.status === 402 && e.data) {
            const shortfall = Number(e.data.shortfall || 0)
            paymentShortfall.value = {
                requestId: id,
                amount: shortfall > 0 ? shortfall : Number(getPayableAmount(selectedRequest.value) || 0)
            }
            showToast(`Insufficient wallet balance. Top up GHS ${shortfall.toFixed(2)} to continue.`, 'error')
        } else {
            showToast(e.message || `Failed to start ${method === 'paystack' ? 'Paystack' : 'wallet'} payment`, 'error')
        }
    } finally {
        payingRequest.value = false
        payingMethod.value = ''
    }
}

const verifyReturnedPaystackRequestPayment = async () => {
    const paymentMarker = String(route.query.requestPayment || '').trim().toLowerCase()
    const reference = String(route.query.reference || route.query.trxref || '').trim()
    const requestId = normalizeRequestId(route.query.requestId || props.initialRequestId)

    if (paymentMarker !== 'paystack' || !reference || !requestId || payingRequest.value) return

    payingRequest.value = true
    payingMethod.value = 'paystack'
    try {
        const res = await apiCall('POST', `/api/order-requests/customer/${requestId}/pay/paystack/verify`, {
            reference
        })
        await fetchWalletBalance()
        await fetchMyRequests({ silent: true })
        await openRequestById(requestId, { silent: true })
        showToast(res.message || 'Payment completed successfully')
    } catch (e) {
        await fetchWalletBalance()
        await fetchMyRequests({ silent: true })
        await openRequestById(requestId, { silent: true })
        showToast(e.message || 'Failed to verify Paystack payment', 'error')
    } finally {
        await clearRequestPaymentQuery(requestId)
        payingRequest.value = false
        payingMethod.value = ''
    }
}

const respondToDecision = async (decision, response) => {
    if (!selectedRequest.value?.id || !decision?.id || respondingDecisionId.value) return

    respondingDecisionId.value = decision.id
    try {
        const res = await apiCall('POST', `/api/order-requests/customer/${selectedRequest.value.id}/decisions/${decision.id}/respond`, {
            response,
            selected_items: response === 'approved' ? (decisionSelections.value[decision.id] || {}) : {}
        })
        showToast(res.message || (response === 'approved' ? 'Decision approved' : 'Decision declined'))
        await fetchMyRequests({ silent: true })
        await refreshSelectedRequest()
    } catch (e) {
        showToast(e.message || 'Failed to respond to request decision', 'error')
    } finally {
        respondingDecisionId.value = null
    }
}

const getDecisionContext = (decision) => {
    return decision?.payload?.summary?.decision_context || null
}

const getDecisionItems = (decision) => {
    return Array.isArray(decision?.payload?.decision_items) ? decision.payload.decision_items : []
}

const syncDecisionSelections = () => {
    const pendingDecisions = Array.isArray(selectedRequest.value?.pending_decisions) ? selectedRequest.value.pending_decisions : []
    const nextState = {}

    pendingDecisions.forEach((decision) => {
        const existing = decisionSelections.value[decision.id] || {}
        const itemSelections = {}
        getDecisionItems(decision).forEach((item) => {
            const itemId = String(item.item_id)
            itemSelections[itemId] = existing[itemId] || item.default_choice || 'keep'
        })
        nextState[decision.id] = itemSelections
    })

    decisionSelections.value = nextState
}

const getDecisionItemChoices = (item) => {
    if (item?.status === 'substitute_available' && item?.substitute_option) {
        return [
            { value: 'substitute', label: 'Use Alternative' },
            { value: 'remove', label: 'Remove Item' }
        ]
    }

    if (item?.status === 'unavailable') {
        return [
            { value: 'remove', label: 'Remove Item' }
        ]
    }

    return [
        { value: 'keep', label: 'Keep Item' },
        { value: 'remove', label: 'Remove Item' }
    ]
}

const getDecisionChoice = (decision, item) => {
    return decisionSelections.value?.[decision?.id]?.[String(item?.item_id)] || item?.default_choice || 'keep'
}

const setDecisionChoice = (decision, item, choice) => {
    if (!decision?.id || !item?.item_id) return
    if (!decisionSelections.value[decision.id]) {
        decisionSelections.value[decision.id] = {}
    }
    decisionSelections.value[decision.id][String(item.item_id)] = choice
}

const getDecisionPreviewTotal = (decision) => {
    return getDecisionItems(decision).reduce((sum, item) => {
        const choice = getDecisionChoice(decision, item)
        const quantity = Number(item.quantity || 0)

        if (choice === 'remove') return sum

        if (choice === 'substitute' && item.substitute_option?.marked_up_price != null) {
            return sum + (Number(item.substitute_option.marked_up_price) * quantity)
        }

        if (item.unit_price != null) {
            return sum + (Number(item.unit_price) * quantity)
        }

        return sum
    }, 0)
}

const getDecisionDistanceText = (item) => {
    if (!item) return ''
    const primaryDistance = Number(item.distance_km)
    if (Number.isFinite(primaryDistance) && primaryDistance > 0) {
        return `${primaryDistance.toFixed(1)} km away`
    }

    const distances = Array.isArray(item.source_distances_km)
        ? item.source_distances_km
            .map((distance) => Number(distance))
            .filter((distance) => Number.isFinite(distance) && distance > 0)
        : []

    if (distances.length) {
        const nearest = [...new Set(distances.map((distance) => Number(distance.toFixed(1))))].sort((a, b) => a - b)[0]
        return `${nearest.toFixed(1)} km away`
    }

    return ''
}

const getPrimaryDecisionSourceId = (item) => {
    const directId = Number(item?.source_pharmacy_id || 0)
    if (Number.isInteger(directId) && directId > 0) return directId

    if (Array.isArray(item?.source_pharmacy_ids)) {
        const fallback = item.source_pharmacy_ids
            .map((id) => Number(id))
            .find((id) => Number.isInteger(id) && id > 0)
        if (fallback) return fallback
    }

    return null
}

const getDecisionSourceMap = (decision) => {
    const items = getDecisionItems(decision)
    const orderedSourceIds = []
    const sourceSet = new Set()
    const pushSourceId = (value) => {
        const id = Number(value || 0)
        if (!Number.isInteger(id) || id <= 0) return
        if (sourceSet.has(id)) return
        sourceSet.add(id)
        orderedSourceIds.push(id)
    }

    // 1) Prioritize primary sources used by visible direct-available item rows.
    items.forEach((item) => {
        if (!isDecisionItemDirectlyAvailable(item)) return
        pushSourceId(getPrimaryDecisionSourceId(item))
    })

    // 2) Then include remaining fallback/substitute sources.
    items.forEach((item) => {
        pushSourceId(getPrimaryDecisionSourceId(item))
        const substituteId = Number(item?.substitute_option?.source_pharmacy_id || 0)
        pushSourceId(substituteId)
    })

    const map = new Map()
    orderedSourceIds.forEach((id, index) => {
        map.set(id, `Source ${index + 1}`)
    })
    return map
}

const getDecisionSourceSummary = (decision) => {
    const summaryCount = Number(decision?.payload?.summary?.source_pharmacy_count || 0)
    const map = getDecisionSourceMap(decision)
    const count = summaryCount > 0 ? summaryCount : map.size
    return {
        count,
        isSplit: count > 1
    }
}

const getDecisionHumanSummary = (decision) => {
    const items = getDecisionItems(decision)
    if (!items.length) return []

    const sourceSummary = getDecisionSourceSummary(decision)
    const decisionContext = getDecisionContext(decision)
    const availableCount = items.filter((item) => item?.status === 'available').length
    const substituteCount = items.filter((item) => item?.status === 'substitute_available').length
    const unavailableCount = items.filter((item) => item?.status === 'unavailable').length
    const lines = []
    const shouldIncludeSourceCountForAvailable = sourceSummary.count > 0
        && ['partial_availability', 'mixed_availability'].includes(decisionContext)

    if (availableCount > 0 && (sourceSummary.count > 1 || shouldIncludeSourceCountForAvailable)) {
        lines.push(
            `${availableCount} item${availableCount > 1 ? 's are' : ' is'} currently available from ${sourceSummary.count} nearby pharmac${sourceSummary.count === 1 ? 'y' : 'ies'}.`
        )
    } else if (availableCount > 0) {
        lines.push(`${availableCount} item${availableCount > 1 ? 's are' : ' is'} currently available.`)
    }

    if (substituteCount > 0) {
        lines.push(`${substituteCount} item${substituteCount > 1 ? 's have' : ' has'} alternative option${substituteCount > 1 ? 's' : ''} for you to review.`)
    }

    if (unavailableCount > 0) {
        lines.push(`${unavailableCount} item${unavailableCount > 1 ? 's are' : ' is'} currently unavailable.`)
    }

    if (!lines.length) {
        lines.push('Please review each item and confirm how you want to proceed.')
    }

    return lines
}

const getDecisionConciseSummary = (decision) => {
    const items = getDecisionItems(decision)
    if (!items.length) return ''

    const total = items.length
    const available = items.filter((item) => isDecisionItemDirectlyAvailable(item)).length
    const withSubstitute = items.filter((item) => item?.status === 'substitute_available' && item?.substitute_option).length
    const unavailable = items.filter((item) => item?.status === 'unavailable').length
    const sourceSummary = getDecisionSourceSummary(decision)

    const parts = []
    if (available > 0) {
        const sourcePart = sourceSummary.count > 1
            ? `from ${sourceSummary.count} nearby pharmacies`
            : 'from 1 nearby pharmacy'
        parts.push(`${available}/${total} item${total > 1 ? 's' : ''} available ${sourcePart}`)
    }
    if (withSubstitute > 0) {
        parts.push(`${withSubstitute} item${withSubstitute > 1 ? 's have' : ' has'} alternative options`)
    }
    if (unavailable > 0) {
        parts.push(`${unavailable} item${unavailable > 1 ? 's are' : ' is'} unavailable`)
    }

    if (!parts.length) return 'Please review the items below and choose how you want to continue.'
    return `${parts.join('. ')}.`
}

const isDecisionItemDirectlyAvailable = (item = {}) => {
    const status = String(item?.status || '').toLowerCase()
    if (status === 'unavailable' || status === 'substitute_available') return false
    if (item?.unit_price != null) return true
    return ['available', 'ready_to_order', 'ordered', 'allocated', 'partially_allocated'].includes(status)
}

const shouldShowDecisionItemPrice = (item = {}) => {
    return isDecisionItemDirectlyAvailable(item) && item?.unit_price != null
}

const getDecisionFlowHeadline = (decision) => {
    const items = getDecisionItems(decision)
    if (!items.length) return ''

    const available = items.filter((item) => isDecisionItemDirectlyAvailable(item)).length
    const withSubstitute = items.filter((item) => item?.status === 'substitute_available' && item?.substitute_option).length
    const unavailable = items.filter((item) => item?.status === 'unavailable').length
    const total = items.length
    const sourceSummary = getDecisionSourceSummary(decision)

    if (sourceSummary.count > 1 && withSubstitute > 0) {
        return `${available}/${total} items are available from ${sourceSummary.count} nearby pharmacies, and ${withSubstitute} item${withSubstitute > 1 ? 's have' : ' has'} alternative options to review.`
    }

    if (sourceSummary.count > 1 && unavailable > 0) {
        return `${available}/${total} items are available from ${sourceSummary.count} nearby pharmacies, and ${unavailable} item${unavailable > 1 ? 's are' : ' is'} not available right now.`
    }

    if (sourceSummary.count > 1) {
        return `Your request can be completed from ${sourceSummary.count} nearby pharmacies. Review each item below and confirm how you want to continue.`
    }

    if (withSubstitute > 0) {
        return `${available}/${total} items are available now. ${withSubstitute} item${withSubstitute > 1 ? 's have' : ' has'} an alternative for you to review.`
    }

    if (unavailable > 0) {
        return `${available}/${total} items are available now. ${unavailable} item${unavailable > 1 ? 's are' : ' is'} not available right now.`
    }

    return ''
}

const getDecisionItemSourceLabel = (decision, item) => {
    const map = getDecisionSourceMap(decision)
    const primaryId = getPrimaryDecisionSourceId(item)
    return primaryId ? (map.get(primaryId) || '') : ''
}

const getDecisionItemRouteText = (decision, item) => {
    if (!item || !isDecisionItemDirectlyAvailable(item)) return ''
    const sourceText = getDecisionItemSourceLabel(decision, item) || 'Nearby source'
    const distanceText = getDecisionDistanceText(item)
    if (sourceText && distanceText) return `${sourceText} - ${distanceText}`
    return sourceText || distanceText || ''
}

const getDecisionSubstituteSourceLabel = (decision, item) => {
    const substituteId = Number(item?.substitute_option?.source_pharmacy_id || 0)
    if (!Number.isInteger(substituteId) || substituteId <= 0) return ''
    const map = getDecisionSourceMap(decision)
    const label = map.get(substituteId)
    return label ? `${label} (alternative)` : ''
}

const getDecisionSubstituteRouteText = (decision, item) => {
    if (!item?.substitute_option) return ''
    const sourceText = getDecisionSubstituteSourceLabel(decision, item) || 'Nearby source (alternative)'
    const distance = Number(item.substitute_option.distance_km)
    const distanceText = Number.isFinite(distance) && distance > 0
        ? `${distance.toFixed(1)} km away`
        : ''
    if (sourceText && distanceText) return `${sourceText} - ${distanceText}`
    return sourceText || distanceText || ''
}

const getDecisionVariantClass = (decision) => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'warning'
    if (context === 'partial_availability') return 'warning'
    if (context === 'split_fulfillment') return 'info'
    if (decision?.decision_type === 'substitute_approval') return 'success'
    if (decision?.decision_type === 'quantity_split') return 'info'
    return 'neutral'
}

const getDecisionEyebrow = (decision) => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'Action Needed'
    if (context === 'partial_availability') return 'Partial Availability'
    if (context === 'split_fulfillment') return 'Split Fulfillment'
    if (decision?.decision_type === 'substitute_approval') return 'Alternative Approval'
    if (decision?.decision_type === 'quantity_split') return 'Quantity Split'
    return 'Customer Decision'
}

const getDecisionApproveLabel = (decision) => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'Apply My Choices'
    if (context === 'partial_availability') return 'Continue with Available Items'
    if (context === 'split_fulfillment') return 'Continue with Split Order'
    if (decision?.decision_type === 'substitute_approval') return 'Approve Alternatives'
    if (decision?.decision_type === 'quantity_split') return 'Approve Split'
    return 'Approve'
}

const getDecisionDeclineLabel = (decision) => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'Cancel Request'
    if (context === 'partial_availability') return 'Cancel Request'
    if (context === 'split_fulfillment') return 'Cancel Request'
    if (decision?.decision_type === 'substitute_approval') return 'Reject Alternatives'
    if (decision?.decision_type === 'quantity_split') return 'Reject Split'
    return 'Decline'
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
    logistics_pending: 75,
    driver_unavailable: 75,
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
    await loadSavedHomeLocation()
    await fetchRequestSettings()
    await fetchWalletBalance()
    if (props.defaultSubTab === 'list' || props.initialRequestId) {
        subTab.value = 'list'
        await fetchMyRequests()
        await openRequestById(props.initialRequestId, { silent: true })
    }
    await verifyReturnedPaystackRequestPayment()

    pollTimer = setInterval(async () => {
        if (subTab.value !== 'list') return
        await fetchMyRequests({ silent: true })
        await refreshSelectedRequest()
    }, POLL_INTERVAL_MS)
})

watch(
    subTab,
    async (nextTab) => {
        if (nextTab === 'new') {
            await fetchWalletBalance()
        }
    }
)

watch(
    () => props.initialRequestId,
    async (nextId, prevId) => {
        if (!nextId || nextId === prevId) return
        subTab.value = 'list'
        await fetchMyRequests({ silent: true })
        await openRequestById(nextId, { silent: true })
    }
)

watch(
    () => `${route.query.requestPayment || ''}|${route.query.reference || route.query.trxref || ''}|${route.query.requestId || ''}`,
    async () => {
        await verifyReturnedPaystackRequestPayment()
    }
)

onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
    prescriptionFiles.value.forEach(revokePrescriptionPreview)
    requestItems.value.forEach(cleanupItemImages)
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

.search-lock-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    border: 1px solid #fde68a;
    background: linear-gradient(180deg, #fffbeb, #fef3c7);
}

.search-lock-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.search-lock-copy strong {
    font-size: 0.88rem;
    color: #92400e;
}

.search-lock-copy span {
    font-size: 0.79rem;
    line-height: 1.5;
    color: #b45309;
}

.request-builder-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
    gap: 1rem;
    margin-top: 1.25rem;
    align-items: start;
}

.builder-card {
    padding: 1.1rem;
    border-radius: 16px;
    border: 1px solid #dbe4f0;
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.builder-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.builder-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
}

.builder-copy {
    margin: 0.35rem 0 0;
    font-size: 0.82rem;
    line-height: 1.55;
    color: #64748b;
}

.review-card {
    position: sticky;
    top: 1rem;
    background:
        linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.98));
}

.request-submit-bar {
    margin-top: 1rem;
    padding: 1rem 1.1rem;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid #cbd5e1;
    background: linear-gradient(135deg, #0f172a, #1e293b 58%, #334155);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.14);
}

.request-submit-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.request-submit-copy strong {
    color: #f8fafc;
    font-size: 0.95rem;
    font-weight: 700;
}

.request-submit-copy span {
    color: rgba(226, 232, 240, 0.86);
    font-size: 0.8rem;
    line-height: 1.5;
}

.request-submit-btn {
    flex-shrink: 0;
    min-width: 220px;
    white-space: nowrap;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
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
    align-items: flex-start;
    gap: 0.5rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 0.625rem 0.75rem;
}

.item-main {
    flex: 1;
    min-width: 0;
}

.item-search-shell {
    background: #ffffff;
    border: 1px solid #dbe4f0;
    border-radius: 14px;
    padding: 0.75rem 0.85rem;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.item-search-shell.locked {
    background: #f8fafc;
    border-color: #e2e8f0;
}

.item-search-head {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin-bottom: 0.45rem;
}

.item-search-head strong {
    font-size: 0.8rem;
    color: #1e293b;
    letter-spacing: 0.02em;
}

.item-search-head span {
    font-size: 0.73rem;
    color: #64748b;
    line-height: 1.35;
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
    font-size: 0.95rem;
    color: #111827;
    outline: none;
    font-weight: 600;
}

.item-input::placeholder {
    color: #94a3b8;
}

.input-wrap {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #dbe4f0;
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
}

.item-upload-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.55rem;
}

.item-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px dashed #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
}

.item-upload-note {
    font-size: 0.75rem;
    color: #64748b;
}

.item-image-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.65rem;
}

.item-image-card {
    width: 92px;
    border: 1px solid #dbe4f0;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
}

.item-image-preview {
    width: 100%;
    height: 72px;
    object-fit: cover;
    display: block;
}

.item-image-actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.4rem;
}

.clickable-input-wrap {
    cursor: text;
    min-height: 3rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.item-search-icon {
    width: 1rem;
    height: 1rem;
    color: #64748b;
    flex-shrink: 0;
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

.qty-picker {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 118px;
}

.qty-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
}

.qty-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem;
    background: #ffffff;
    border: 1px solid #dbe4f0;
    border-radius: 12px;
}

.qty-btn {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 10px;
    background: #eef2ff;
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
    background: #e0e7ff;
    transform: translateY(-1px);
}

.qty-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.qty-svg {
    width: 1rem;
    height: 1rem;
}

.qty-input {
    width: 42px;
    text-align: center;
    border: none;
    background: transparent;
    padding: 0.25rem 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    -moz-appearance: textfield;
}

.qty-input:focus {
    outline: none;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
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
    flex-wrap: wrap;
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

.prescription-preview-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
}

.prescription-preview-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #dbeafe;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.prescription-preview-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    background: #dbeafe;
}

.prescription-preview-copy {
    padding: 0.75rem 0.75rem 0.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.prescription-preview-copy strong {
    font-size: 0.8rem;
    color: #0f172a;
}

.prescription-preview-copy span {
    font-size: 0.72rem;
    color: #64748b;
    word-break: break-word;
}

.prescription-preview-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.75rem 0.75rem;
}

.preview-action-btn {
    flex: 1;
    border: 1px solid #bfdbfe;
    background: #ffffff;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 0.45rem 0.7rem;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
}

.preview-action-btn.danger {
    border-color: #fecaca;
    color: #b91c1c;
}

.upload-progress-card {
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    padding: 0.85rem 1rem;
}

.upload-progress-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8rem;
    color: #1e3a8a;
    margin-bottom: 0.55rem;
}

.upload-progress-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #dbeafe;
    overflow: hidden;
}

.upload-progress-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2563eb, #0ea5e9);
    transition: width 0.2s ease;
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

.location-help-card {
    margin: -0.25rem 0 1rem;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
}

.location-help-card.error {
    background: #fff7ed;
    border-color: #fed7aa;
}

.location-help-copy {
    margin: 0;
    font-size: 0.8rem;
    color: #1e3a8a;
}

.location-help-card.error .location-help-copy {
    color: #9a3412;
}

.location-help-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.7rem;
}

.location-help-btn {
    border: none;
    background: #2563eb;
    color: white;
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
}

.location-help-btn.secondary {
    background: white;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
}

.location-help-note {
    margin: 0.7rem 0 0;
    font-size: 0.75rem;
    color: #7c2d12;
    line-height: 1.5;
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
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.375rem 0;
    font-size: 0.875rem;
    color: #374151;
}

.review-qty {
    color: #9ca3af;
}

.review-item-images {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
}

.review-prescription-only {
    margin-top: 0.5rem;
    font-size: 0.88rem;
    line-height: 1.5;
    color: #4b5563;
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

.request-prescription-preview {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.8rem 0.9rem;
    margin-bottom: 0.65rem;
    border-radius: 14px;
    background: linear-gradient(180deg, #eff6ff, #f8fbff);
    border: 1px solid #dbeafe;
}

.request-prescription-thumb-link {
    display: inline-flex;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #bfdbfe;
    background: #ffffff;
}

.request-prescription-thumb {
    width: 64px;
    height: 64px;
    object-fit: cover;
    display: block;
}

.request-prescription-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.request-prescription-copy strong {
    font-size: 0.82rem;
    color: #1e3a8a;
}

.request-prescription-copy span {
    font-size: 0.76rem;
    line-height: 1.45;
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

.progress-fill.logistics_pending {
    background: #3b82f6;
}

.progress-fill.driver_unavailable {
    background: #ef4444;
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

.status-badge.logistics_pending {
    background: #dbeafe;
    color: #1d4ed8;
}

.status-badge.driver_unavailable {
    background: #fee2e2;
    color: #991b1b;
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

.detail-prescription-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.detail-prescription-link {
    display: inline-flex;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #dbe4f0;
    background: #ffffff;
}

.detail-prescription-image {
    width: 118px;
    height: 118px;
    object-fit: cover;
    display: block;
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

.detail-item-images {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.55rem;
}

.detail-item-image-link {
    display: inline-flex;
}

.detail-item-image {
    width: 58px;
    height: 58px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid #dbe4f0;
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

.decision-panel {
    margin-bottom: 1rem;
    padding: 0.95rem 1rem;
    border-radius: 12px;
    border: 1px solid #fcd34d;
    background: #fffdf4;
}

.decision-card {
    display: grid;
    gap: 0.75rem;
    padding: 0.8rem 0;
    border-top: 1px solid rgba(251, 191, 36, 0.25);
}

.decision-card:first-of-type {
    border-top: none;
    padding-top: 0;
}

.decision-eyebrow {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 0.28rem 0.55rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.decision-eyebrow.warning {
    background: #fef3c7;
    color: #92400e;
}

.decision-eyebrow.info {
    background: #dbeafe;
    color: #1d4ed8;
}

.decision-eyebrow.success {
    background: #dcfce7;
    color: #166534;
}

.decision-eyebrow.neutral {
    background: #e2e8f0;
    color: #334155;
}

.decision-copy strong {
    display: block;
    font-size: 0.9rem;
    color: #111827;
    margin-bottom: 0.25rem;
}

.decision-copy p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.55;
    color: #475569;
}

.decision-human-summary {
    display: grid;
    gap: 0.3rem;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    border: 1px solid #dbeafe;
    background: #f8fbff;
}

.decision-human-summary p {
    margin: 0;
    font-size: 0.78rem;
    color: #1e3a8a;
    line-height: 1.45;
}

.decision-flow-headline {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.55;
    color: #1f2937;
    font-weight: 600;
}

.decision-split-note {
    margin-top: 0.05rem;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e3a8a;
    font-size: 0.78rem;
    font-weight: 500;
}

.decision-item-list {
    display: grid;
    gap: 0.8rem;
}

.decision-item-row {
    display: grid;
    gap: 0.7rem;
    padding: 0.85rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.9);
}

.decision-item-copy {
    display: grid;
    gap: 0.2rem;
}

.decision-item-copy strong {
    font-size: 0.88rem;
    color: #0f172a;
}

.decision-item-meta {
    font-size: 0.78rem;
    color: #475569;
}

.decision-item-meta.unavailable {
    color: #b45309;
    font-weight: 700;
}

.decision-item-meta.source {
    color: #0f766e;
    font-weight: 700;
}

.decision-substitute {
    margin-top: 0.3rem;
    padding-top: 0.45rem;
    border-top: 1px dashed rgba(148, 163, 184, 0.5);
    display: grid;
    gap: 0.15rem;
}

.decision-item-meta.substitute-label {
    font-weight: 800;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.68rem;
}

.decision-item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.decision-item-btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #475569;
    border-radius: 999px;
    padding: 0.45rem 0.75rem;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
}

.decision-item-btn.active {
    border-color: #0f766e;
    background: #0f766e;
    color: #ffffff;
}

.decision-preview-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 0.9rem;
    border-radius: 12px;
    background: #ecfeff;
    border: 1px solid #a5f3fc;
    color: #0f172a;
    font-size: 0.82rem;
}

.decision-actions {
    display: flex;
    gap: 0.65rem;
}

.decision-btn {
    flex: 1;
    border-radius: 10px;
    padding: 0.7rem 0.9rem;
    font-weight: 700;
    font-size: 0.82rem;
    border: 1px solid transparent;
    cursor: pointer;
}

.decision-btn.primary {
    background: #0f766e;
    color: #ffffff;
}

.decision-btn.secondary {
    background: #ffffff;
    color: #475569;
    border-color: #cbd5e1;
}

.decision-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.feedback-card {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #dbe4f0;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.feedback-head {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
    margin-bottom: 0.85rem;
}

.feedback-copy {
    margin: 0.3rem 0 0;
    color: #526173;
    font-size: 0.92rem;
}

.feedback-date {
    color: #7a8699;
    font-size: 0.8rem;
    white-space: nowrap;
}

.feedback-stars {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 0.85rem;
}

.feedback-star-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;
    border: 1px solid #d7e0ec;
    background: #fff;
    color: #b7c2d0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.feedback-star-btn.active {
    background: #fff4d6;
    border-color: #f1c65d;
    color: #d99000;
}

.feedback-star-icon {
    width: 1.2rem;
    height: 1.2rem;
}

.feedback-textarea {
    margin-bottom: 0.85rem;
}

.feedback-actions {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
}

.feedback-saved-note {
    color: #526173;
    font-size: 0.9rem;
}

.feedback-submit-btn {
    width: auto;
    min-width: 12rem;
}

.payment-action {
    margin-bottom: 1rem;
}

.payment-method-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
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

.secondary-pay-btn {
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}

.pay-request-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(2, 132, 199, 0.25);
}

.secondary-pay-btn:hover:not(:disabled) {
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
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

.payment-shortfall {
    margin-top: 0.875rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid #f3d7a3;
    background: linear-gradient(180deg, #fffaf0, #fff7e8);
    display: grid;
    gap: 0.9rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.payment-shortfall-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.85rem;
    align-items: start;
}

.payment-shortfall-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #f2d6a4;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.payment-shortfall-svg {
    width: 18px;
    height: 18px;
    color: #b45309;
}

.payment-shortfall-copy {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
}

.payment-shortfall strong {
    font-size: 0.92rem;
    color: #78350f;
}

.payment-shortfall span {
    font-size: 0.8rem;
    line-height: 1.5;
    color: #92400e;
}

.payment-shortfall-amount {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    padding: 0.55rem 0.8rem;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #f2d6a4;
    color: #92400e;
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
}

.payment-shortfall-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    padding-top: 0.15rem;
    border-top: 1px solid rgba(180, 83, 9, 0.12);
}

.payment-shortfall-note {
    max-width: 24rem;
}

.payment-topup-btn {
    width: fit-content;
    min-height: 40px;
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: #b45309;
    color: #fff;
    border: none;
    font-size: 0.82rem;
    font-weight: 800;
    box-shadow: 0 10px 20px rgba(180, 83, 9, 0.16);
}

.payment-topup-btn:hover {
    background: #9a3412;
}

@media (max-width: 640px) {
    .payment-method-grid {
        grid-template-columns: 1fr;
    }

    .payment-shortfall-head {
        grid-template-columns: auto 1fr;
    }

    .payment-shortfall-amount {
        grid-column: 1 / -1;
        justify-self: start;
    }

    .payment-shortfall-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .payment-topup-btn {
        width: 100%;
        justify-content: center;
    }
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
    .requests-list {
        gap: 0.45rem;
    }

    .request-shell-head {
        flex-direction: column;
        align-items: stretch;
        gap: 0.7rem;
    }

    .shell-title {
        font-size: 1.12rem;
    }

    .shell-stats {
        width: 100%;
    }

    .shell-pill {
        flex: 1;
        padding: 0.58rem 0.68rem;
    }

    .request-builder-grid {
        grid-template-columns: 1fr;
    }

    .step-desc {
        margin-bottom: 0.8rem;
    }

    .search-lock-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .search-lock-card .location-help-btn {
        width: 100%;
        justify-content: center;
    }

    .location-btn {
        align-items: flex-start;
        padding: 0.88rem;
    }

    .location-help-card {
        padding: 0.78rem 0.82rem;
    }

    .location-help-actions {
        flex-direction: column;
    }

    .location-help-btn {
        width: 100%;
        text-align: center;
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
        grid-template-columns: 28px minmax(0, 1fr) auto;
        grid-template-areas:
            "num main remove"
            "qty qty qty";
        gap: 0.6rem 0.5rem;
        padding: 0.68rem;
    }

    .item-num {
        grid-area: num;
    }

    .item-main {
        grid-area: main;
    }

    .qty-picker {
        grid-area: qty;
        min-width: 0;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0.55rem 0.65rem;
        border: 1px solid #dbe4f0;
        border-radius: 12px;
        background: #ffffff;
    }

    .qty-label {
        text-align: left;
        margin-right: 0.75rem;
    }

    .qty-controls {
        justify-content: flex-end;
        margin-left: auto;
    }

    .remove-btn {
        grid-area: remove;
        justify-self: end;
        align-self: start;
    }

    .add-item-btn,
    .upload-label {
        width: 100%;
        justify-content: center;
    }

    .prescription-box {
        padding: 0.88rem;
        gap: 0.6rem;
    }

    .prescription-text {
        width: 100%;
    }

    .prescription-preview-grid {
        grid-template-columns: 1fr;
    }

    .prescription-preview-actions {
        flex-direction: column;
    }

    .form-textarea {
        font-size: 0.95rem;
    }

    .review-box {
        padding: 0.88rem;
    }

    .review-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
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
        max-width: none;
        text-align: left;
    }

    .toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
    }

    .nav-next,
    .nav-submit {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .builder-card {
        padding: 0.88rem;
    }

    .builder-card-head {
        margin-bottom: 0.75rem;
    }

    .review-card {
        position: static;
    }

    .request-submit-bar {
        flex-direction: column;
        align-items: stretch;
        padding: 0.85rem 0.9rem;
        border-radius: 13px;
    }

    .request-submit-btn {
        width: 100%;
        min-width: 0;
        justify-content: center;
    }

    .form-section,
    .list-section {
        padding: 0.88rem;
        border-radius: 13px;
    }

    .sub-tabs {
        padding: 0.24rem;
    }

    .request-list-tabs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.35rem;
        padding: 0.24rem;
    }

    .request-list-tab {
        min-width: 0;
        padding: 0.58rem 0.62rem;
        font-size: 0.76rem;
    }

    .request-list-count {
        min-width: 1.5rem;
        height: 1.5rem;
        font-size: 0.68rem;
    }

    .request-card {
        padding: 0.64rem 0.7rem;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    }

    .request-header {
        gap: 0.45rem;
        margin-bottom: 0.25rem;
    }

    .request-header > div {
        min-width: 0;
    }

    .request-num {
        font-size: 0.86rem;
        display: block;
        line-height: 1.25;
    }

    .request-date {
        display: block;
        margin-left: 0;
        margin-top: 0.1rem;
        font-size: 0.69rem;
    }

    .request-card-copy {
        gap: 0.35rem;
        margin-bottom: 0.3rem;
    }

    .request-card-copy {
        align-items: flex-start;
        flex-direction: row;
    }

    .request-card-copy p {
        font-size: 0.73rem;
        line-height: 1.35;
        min-width: 0;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .request-arrow {
        flex-shrink: 0;
        width: 0.9rem;
        height: 0.9rem;
        margin-top: 0.1rem;
    }

    .request-prescription-preview {
        gap: 0.35rem;
        padding: 0.38rem 0.48rem;
        border-radius: 999px;
        margin-bottom: 0.35rem;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
    }

    .request-prescription-thumb-link {
        display: none;
    }

    .request-prescription-copy strong {
        font-size: 0.69rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #475569;
    }

    .request-prescription-copy span {
        font-size: 0.69rem;
        line-height: 1.2;
    }

    .request-meta {
        gap: 0.32rem;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: stretch;
        margin-bottom: 0;
    }

    .request-meta span:first-child {
        display: none;
    }

    .request-meta span {
        width: auto;
        justify-content: flex-start;
        min-width: 0;
        padding: 0.24rem 0.4rem;
        font-size: 0.68rem;
        line-height: 1.2;
        border-radius: 10px;
        background: #f8fafc;
    }

    .status-badge {
        font-size: 0.61rem;
        padding: 0.18rem 0.46rem;
        letter-spacing: 0.02em;
    }

    .progress-bar {
        display: none;
    }
}

@media (max-width: 420px) {
    .sub-tab {
        padding: 0.72rem 0.78rem;
        font-size: 0.79rem;
    }

    .step-title {
        font-size: 1.1rem;
    }

    .item-search-shell {
        padding: 0.7rem 0.75rem;
    }

    .input-wrap {
        padding: 0.7rem 0.75rem;
    }

    .qty-picker {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .qty-label {
        margin-right: 0;
    }

    .qty-controls {
        width: 100%;
        justify-content: space-between;
        margin-left: 0;
    }

    .request-submit-copy strong {
        font-size: 0.9rem;
    }

    .request-submit-copy span {
        font-size: 0.78rem;
    }

    .request-list-tab {
        padding: 0.56rem 0.54rem;
        font-size: 0.73rem;
    }

    .request-card {
        padding: 0.62rem 0.66rem;
    }

    .request-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .request-card-copy {
        align-items: flex-start;
    }

    .request-meta {
        grid-template-columns: 1fr;
    }

    .request-prescription-preview {
        align-items: flex-start;
        border-radius: 12px;
    }
}
</style>


