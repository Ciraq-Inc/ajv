<template>
  <div class="order-requests-page">
    <!-- Header -->
    <div v-if="!selectedRequest" class="page-header">
      <div>
        <h1 class="page-title">
          {{ selectedRequest ? `Fulfillment Workspace: ${selectedRequest.request_number}` : 'Order Requests' }}
        </h1>
        <p class="page-subtitle">
          {{ selectedRequest
            ? 'Work through sourcing, allocation, customer decisions, and logistics without the modal constraint.'
            : 'Manage customer order requests, process items, and coordinate fulfillment' }}
        </p>
      </div>
      <div class="header-actions">
        <template v-if="selectedRequest">
          <button @click="selectedRequest = null" class="btn-secondary" :disabled="loading">
            <span>Back to Requests</span>
          </button>
          <button @click="loadFulfillment({ silent: false, refreshLists: false })" class="btn-secondary" :disabled="loading || !canRunFulfillment(selectedRequest.status)">
            <ArrowPathIcon class="icon-sm" :class="{ 'animate-spin': loading }" />
            <span>Refresh Workspace</span>
          </button>
        </template>
        <template v-else>
          <button @click="fetchStats" class="btn-secondary" :disabled="loading">
            <ChartBarIcon class="icon-sm" />
            <span>Stats</span>
          </button>
          <button @click="fetchRequests" class="btn-secondary" :disabled="loading">
            <ArrowPathIcon class="icon-sm" :class="{ 'animate-spin': loading }" />
            <span>Refresh</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="!selectedRequest && stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <ClipboardDocumentListIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending || 0 }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon processing">
          <Cog6ToothIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.processing || 0 }}</div>
          <div class="stat-label">In Progress</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <CheckCircleIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed || 0 }}</div>
          <div class="stat-label">Fulfilled</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <CubeIcon class="icon-md" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="!selectedRequest" class="filters-bar">
      <div class="status-tabs-bar" role="tablist" aria-label="Order request status filters">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          class="status-tab-pill"
          :class="{ active: statusFilter === tab.value }"
          @click="setStatusFilter(tab.value)"
        >
          <span>{{ tab.label }}</span>
          <span class="status-tab-count">{{ tab.count }}</span>
        </button>
      </div>
      <div class="search-group">
        <input v-model="searchQuery" type="text" class="form-control search-input"
          placeholder="Search by request #, customer name..." @keyup.enter="fetchRequests" />
        <button @click="fetchRequests" class="btn-primary btn-sm">Search</button>
      </div>
      <select v-model="statusFilter" class="form-control filter-select">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="confirming_with_pharm">Confirming With Pharm</option>
        <option value="awaiting_customer">Awaiting Customer</option>
        <option value="confirmed_in_pharm">Confirmed In Pharm</option>
        <option value="paid">Paid</option>
        <option value="completed_group">Delivered / Picked Up</option>
        <option value="more">More</option>
        <option value="logistics_pending">Logistics Pending</option>
        <option value="driver_unavailable">Driver Unavailable</option>
        <option value="ready_for_pickup">Ready For Pickup</option>
        <option value="picked_up">Picked Up</option>
        <option value="out_for_delivery">Out For Delivery</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
        <option value="returned">Returned</option>
      </select>
    </div>

    <!-- Requests Table -->
    <div v-if="!selectedRequest" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Request #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Status</th>
            <th>Fee</th>
            <th>Fulfillment</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="state-cell">
              <StateMessage
                state="loading"
                heading="Fetching requests..."
                message="Hang tight, we're loading your orders."
              />
            </td>
          </tr>
          <tr v-else-if="requestsError">
            <td colspan="8" class="state-cell">
              <StateMessage
                state="error"
                heading="Couldn't load requests"
                message="Something went wrong on our end. Check your connection and try again."
                action-label="Try Again"
                @action="fetchRequests"
              />
            </td>
          </tr>
          <tr v-else-if="filteredRequests.length === 0">
            <td colspan="8" class="state-cell">
              <StateMessage
                state="empty"
                :heading="searchQuery ? 'No matching requests' : 'Nothing here yet'"
                :message="searchQuery ? 'Try a different search term or clear the filter.' : 'New order requests will appear here once customers submit them.'"
              />
            </td>
          </tr>
          <tr v-for="req in filteredRequests" :key="req.id" class="table-row">
            <td class="request-number">{{ req.request_number }}</td>
            <td>
              <div class="customer-info">
                <span class="customer-name">{{ req.customer_name || 'N/A' }}</span>
                <span class="customer-phone">{{ req.customer_phone || '' }}</span>
              </div>
            </td>
            <td>
              <span class="item-count">{{ formatRequestItemsLabel(req) }}</span>
            </td>
            <td>
              <span class="status-badge" :class="req.status">{{ formatStatus(req.status) }}</span>
            </td>
            <td>GHS {{ parseFloat(req.request_fee || 0).toFixed(2) }}</td>
            <td>
              <span v-if="req.fulfillment_type" class="fulfillment-badge" :class="req.fulfillment_type">
                {{ req.fulfillment_type }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="date-cell">{{ formatDate(req.created_at) }}</td>
            <td>
              <div class="action-btns">
                <button @click="viewRequest(req)" class="btn-icon-text" title="Open Fulfillment Workspace">
                  <EyeIcon class="icon-sm" /> <span>Open</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Fulfillment Workspace — split-pane drawer -->
    <div v-if="selectedRequest" class="fw-backdrop" @click="selectedRequest = null"></div>
    <div v-if="selectedRequest" class="fw-drawer">

      <!-- ── Header ─────────────────────────────────────────── -->
      <div class="fw-header">
        <div class="fw-header-top">
          <div class="fw-header-identity">
            <h3 class="fw-req-num">#{{ selectedRequest.request_number }}</h3>
            <span class="status-badge" :class="selectedRequest.status">{{ formatStatus(selectedRequest.status) }}</span>
          </div>
          <div class="fw-header-meta">
            <span v-if="selectedRequest.customer_name" class="fw-meta-chip">{{ selectedRequest.customer_name }}</span>
            <span v-if="selectedRequest.customer_phone" class="fw-meta-chip">{{ selectedRequest.customer_phone }}</span>
            <span class="fw-meta-chip">{{ selectedRequest.fulfillment_type || 'delivery' }}</span>
            <span class="fw-meta-chip">{{ selectedRequest.items?.length || 0 }} items</span>
            <span class="fw-meta-chip">GHS {{ parseFloat(selectedRequest.request_fee || 0).toFixed(2) }} hold</span>
          </div>
          <div class="fw-header-actions">
            <button
              @click="loadFulfillment({ silent: false, refreshLists: false })"
              class="fw-icon-btn"
              :disabled="loading || !canRunFulfillment(selectedRequest.status)"
              title="Refresh sourcing data"
            >
              <ArrowPathIcon class="icon-sm" :class="{ 'animate-spin': loading }" />
            </button>
            <button @click="selectedRequest = null" class="fw-icon-btn fw-close-btn" title="Close">
              <XMarkIcon class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── Body — split pane ──────────────────────────────── -->
      <div class="fw-body">

        <!-- Next Step Guide Banner -->
        <div
          v-if="nextStepGuide && !isBannerDismissed"
          class="fw-next-step"
          :class="`fw-next-step--${nextStepGuide.color}`"
        >
          <div class="fw-ns-left">
            <div class="fw-ns-icon-wrap">
              <component :is="nextStepGuide.icon" class="fw-ns-icon" aria-hidden="true" />
            </div>
            <div class="fw-ns-content">
              <strong class="fw-ns-heading">{{ nextStepGuide.heading }}</strong>
              <span class="fw-ns-message">{{ nextStepGuide.message }}</span>
            </div>
          </div>
          <div class="fw-ns-actions">
            <button
              v-if="nextStepGuide.action"
              type="button"
              class="fw-ns-cta"
              :disabled="loading"
              @click="handleBannerAction"
            >
              <span v-if="nextStepGuide.action === 'run-sourcing' && loading">Running...</span>
              <span v-else-if="nextStepGuide.action === 'run-sourcing'">Run Sourcing</span>
              <span v-else-if="nextStepGuide.action === 'send-action-needed'">Send to Customer</span>
              <span v-else-if="nextStepGuide.action === 'calculate-totals'">Calculate Totals</span>
            </button>
            <button
              type="button"
              class="fw-ns-dismiss"
              :aria-label="`Dismiss step hint`"
              @click="dismissedStepKey = nextStepGuide.key"
            >
              <XMarkIcon class="icon-xs" />
            </button>
          </div>
        </div>

        <!-- LEFT: Items pane -->
        <div class="fw-split-pane">
        <div class="fw-items">
          <div class="fw-pane-header">
            <h4 class="fw-pane-title">
              Items
              <span class="fw-count-badge">{{ selectedRequest.items?.length || 0 }}</span>
            </h4>
            <div class="fw-pane-header-right">
              <span class="fw-avail-summary">{{ requestItemAvailabilitySummary.available }} available · {{ requestItemAvailabilitySummary.unavailable }} unavailable</span>
              <button
                class="btn-decision btn-sm"
                :disabled="loading || !canTriggerActionNeeded"
                @click="requestCustomerDecision('action_needed')"
              >
                Send Action Needed
              </button>
            </div>
          </div>

          <!-- Add item -->
          <div class="fw-add-item">
            <div class="fw-add-item-field">
              <input
                v-model="adminNewItem.product_search"
                type="text"
                class="form-control form-control-sm"
                :placeholder="hasPrescriptionAttachments ? 'Add from prescription...' : 'Add item...'"
                @input="onAdminProductInput(adminNewItem)"
                @focus="adminNewItem.showProductDropdown = true"
                @blur="closeAdminProductDropdown(adminNewItem)"
                @keyup.enter.prevent="saveAdminNewItem"
              />
              <div v-if="adminNewItem.showProductDropdown" class="product-search-dropdown">
                <div v-if="adminNewItem.product_search_loading" class="dropdown-empty">Searching...</div>
                <template v-else>
                  <button
                    v-for="(result, resultIndex) in adminNewItem.productSearchResults"
                    :key="`admin-new-item-result-${resultIndex}`"
                    type="button"
                    class="product-search-result"
                    @mousedown.prevent="selectAdminProduct(adminNewItem, result)"
                  >
                    <span class="product-search-name">{{ getProductSearchLabel(result) }}</span>
                    <span v-if="getProductResultMeta(result)" class="product-search-meta">{{ getProductResultMeta(result) }}</span>
                  </button>
                  <div
                    v-if="adminNewItem.productSearchResults.length === 0 && String(adminNewItem.product_search || '').trim().length >= 2"
                    class="dropdown-empty"
                  >
                    No matching products. You can still add the typed item.
                  </div>
                </template>
              </div>
            </div>
            <input
              v-model.number="adminNewItem.quantity"
              type="number"
              min="1"
              step="1"
              class="form-control form-control-sm fw-qty-input"
              placeholder="Qty"
              @keyup.enter.prevent="saveAdminNewItem"
            />
            <button @click="saveAdminNewItem" class="btn-secondary btn-sm" :disabled="loading || !canAddAdminItem">Add</button>
            <button v-if="canResetAdminNewItem" @click="resetAdminNewItem" class="btn-secondary btn-sm" :disabled="loading">Clear</button>
          </div>

          <!-- Empty state -->
          <div v-if="!selectedRequest.items?.length" class="fw-items-empty">
            <StateMessage
              state="empty"
              heading="No items yet"
              message="Add the first item above to kick off sourcing. If there's a prescription attached, type the items from it."
            />
          </div>

          <!-- Item cards -->
          <div v-else class="fw-item-list">
            <div
              v-for="(item, index) in selectedRequest.items"
              :key="item.id"
              class="fw-item-card"
              :class="{ 'fw-item-unavailable': isItemUnavailable(item) }"
            >
              <!-- Card header -->
              <div class="fw-ic-header">
                <span class="fw-ic-num">{{ index + 1 }}</span>
                <div class="fw-ic-name-block">
                  <template v-if="item.editingProduct">
                    <div class="item-product-edit">
                      <input
                        v-model="item.product_search"
                        type="text"
                        class="form-control form-control-sm item-product-input"
                        placeholder="Search product..."
                        @input="onAdminProductInput(item)"
                        @focus="item.showProductDropdown = true"
                        @blur="closeAdminProductDropdown(item)"
                      />
                      <div v-if="item.showProductDropdown" class="product-search-dropdown">
                        <div v-if="item.product_search_loading" class="dropdown-empty">Searching...</div>
                        <template v-else>
                          <button
                            v-for="(result, resultIndex) in item.productSearchResults"
                            :key="`item-${item.id}-result-${resultIndex}`"
                            type="button"
                            class="product-search-result"
                            @mousedown.prevent="selectAdminProduct(item, result)"
                          >
                            <span class="product-search-name">{{ getProductSearchLabel(result) }}</span>
                            <span v-if="getProductResultMeta(result)" class="product-search-meta">{{ getProductResultMeta(result) }}</span>
                          </button>
                          <div v-if="item.productSearchResults.length === 0" class="dropdown-empty">No matching products</div>
                        </template>
                      </div>
                      <div class="item-product-edit-actions">
                        <button @click="saveItemProduct(item)" class="btn-secondary btn-sm" :disabled="loading">Save</button>
                        <button @click="cancelEditItemProduct(item)" class="btn-secondary btn-sm" :disabled="loading">Cancel</button>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <span class="fw-ic-name">{{ item.product_name }}</span>
                  </template>
                </div>
                <span class="fw-ic-qty">× {{ getRequestedQuantity(item) }}</span>
                <span class="status-badge sm" :class="itemStatusClass(item)">{{ formatItemStatus(item) }}</span>
              </div>

              <!-- Pricing row -->
              <div class="fw-ic-pricing">
                <template v-if="item.editing">
                  <label class="fw-ic-price-label">Base Quote</label>
                  <input
                    v-model.number="item.edit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control form-control-sm fw-price-input"
                    placeholder="0.00"
                  />
                  <button @click="saveItemPrice(item)" class="btn-primary btn-sm" :disabled="loading">Save</button>
                  <button @click="item.editing = false" class="btn-secondary btn-sm" :disabled="loading">Cancel</button>
                </template>
                <template v-else>
                  <div class="fw-ic-price-pair">
                    <div class="fw-ic-price-field">
                      <span class="fw-ic-price-label">Base</span>
                      <span v-if="item.unit_price" class="fw-ic-price-val">GHS {{ parseFloat(item.unit_price).toFixed(2) }}</span>
                      <span v-else class="fw-ic-price-empty">—</span>
                    </div>
                    <div class="fw-ic-price-field">
                      <span class="fw-ic-price-label">Customer</span>
                      <span v-if="item.marked_up_price" class="fw-ic-price-val accent">GHS {{ parseFloat(item.marked_up_price).toFixed(2) }}</span>
                      <span v-else class="fw-ic-price-empty">—</span>
                    </div>
                  </div>
                  <button @click="startEditItem(item)" class="fw-ic-inline-edit" :disabled="loading" type="button">
                    <PencilSquareIcon class="icon-xs" /> Edit Price
                  </button>
                </template>
              </div>

              <!-- Actions row -->
              <div class="fw-ic-actions">
                <button @click="startEditItemProduct(item)" class="fw-ic-action-btn" :disabled="loading">
                  <PencilSquareIcon class="icon-xs" /> Edit Product
                </button>
                <button @click="openAlternativeModal(item)" class="fw-ic-action-btn" :disabled="loading">Set alternative</button>
                <button
                  v-if="(item.sourcing_status || item.item_status) !== 'unavailable' && item.item_status !== 'not_available'"
                  @click="markItemUnavailable(item)"
                  class="fw-ic-action-btn danger"
                  :disabled="loading"
                >
                  Mark as unavailable
                </button>
              </div>

              <!-- Assign source -->
              <!-- Source allocation — display only -->
              <div class="fw-ic-alloc-display">
                <template v-if="item.allocation_pharmacy_id && getAllocationPharmacy(item)">
                  <div class="fw-ic-source-info">
                    <span class="fw-ic-source-label">Source</span>
                    <strong class="fw-ic-source-name">{{ getAllocationPharmacy(item)?.name }}</strong>
                    <span v-if="getAllocationPharmacy(item)?.distance_km != null" class="fw-ic-source-dist">{{ Number(getAllocationPharmacy(item).distance_km).toFixed(1) }} km</span>
                    <span class="fw-ic-source-qty">Qty {{ item.allocation_quantity || getRequestedQuantity(item) }}</span>
                  </div>
                  <div class="fw-ic-source-picker">
                    <button type="button" class="fw-ic-source-cta" :disabled="loading" @click="toggleSourcingDropdown(item)">
                      Change source
                      <ChevronRightIcon class="icon-xs" />
                    </button>
                    <div v-if="item.showSourcingDropdown" class="fw-sourcing-dropdown">
                      <div v-if="!getSourcingOptions(item, true).length" class="fw-sourcing-dropdown-empty">
                        No other nearby sources found
                      </div>
                      <button
                        v-for="option in getSourcingOptions(item, true)"
                        :key="option.pharmacyId"
                        type="button"
                        class="fw-sourcing-dropdown-option"
                        @mousedown.prevent="selectSourcingOption(item, option)"
                      >
                        <span class="fw-sdo-name">{{ option.name }}</span>
                        <span class="fw-sdo-meta">
                          <span class="fw-sdo-dist">{{ option.distanceKm }} km</span>
                          <span class="fw-sdo-qty">Qty {{ option.availableQuantity }}</span>
                          <span v-if="option.unitPrice" class="fw-sdo-price">GH&#8373;{{ option.unitPrice.toFixed(2) }}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="fw-ic-source-picker fw-ic-source-picker--full">
                    <button type="button" class="fw-ic-source-cta fw-ic-source-cta--empty" :disabled="loading" @click="toggleSourcingDropdown(item)">
                      Select from nearby sources
                      <ChevronRightIcon class="icon-xs" />
                    </button>
                    <div v-if="item.showSourcingDropdown" class="fw-sourcing-dropdown fw-sourcing-dropdown--full">
                      <div v-if="!getSourcingOptions(item, false).length" class="fw-sourcing-dropdown-empty">
                        No nearby sources found for this item
                      </div>
                      <button
                        v-for="option in getSourcingOptions(item, false)"
                        :key="option.pharmacyId"
                        type="button"
                        class="fw-sourcing-dropdown-option"
                        @mousedown.prevent="selectSourcingOption(item, option)"
                      >
                        <span class="fw-sdo-name">{{ option.name }}</span>
                        <span class="fw-sdo-meta">
                          <span class="fw-sdo-dist">{{ option.distanceKm }} km</span>
                          <span class="fw-sdo-qty">Qty {{ option.availableQuantity }}</span>
                          <span v-if="option.unitPrice" class="fw-sdo-price">GH&#8373;{{ option.unitPrice.toFixed(2) }}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Photos -->
              <div v-if="item.item_images?.length" class="fw-ic-photos">
                <div class="item-photo-strip" :class="{ 'item-photo-strip--clamped': shouldShowPhotoToggle(item) && !isPhotoStripExpanded(item) }">
                  <a
                    v-for="(imageUrl, imageIndex) in item.item_images"
                    :key="`${item.id}-photo-${imageIndex}`"
                    :href="imageUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="item-photo-link"
                  >
                    <img :src="imageUrl" :alt="`${item.product_name} photo ${imageIndex + 1}`" class="item-photo-thumb" />
                  </a>
                </div>
                <button
                  v-if="shouldShowPhotoToggle(item)"
                  type="button"
                  class="fw-ic-photos-toggle"
                  @click="toggleItemPhotos(item)"
                >
                  {{ isPhotoStripExpanded(item) ? 'Show less photos' : `Show all ${item.item_images.length} photos` }}
                </button>
              </div>

              <!-- Substitute suggestion -->
              <div v-if="isItemUnavailable(item) && getItemSubstituteDetails(item)" class="item-substitute">
                <span class="item-substitute-label">Suggested alternative</span>
                <strong class="item-substitute-name">{{ getItemSubstituteDetails(item).name }}</strong>
                <span v-if="getItemSubstituteDetails(item).note" class="item-substitute-note">{{ getItemSubstituteDetails(item).note }}</span>
                <span v-if="getItemSubstituteDetails(item).price !== null" class="item-substitute-price">GHS {{ Number(getItemSubstituteDetails(item).price).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Sourcing pane -->
        <div class="fw-sourcing">

          <!-- Paid breakdown -->
          <div v-if="latestPaymentSnapshot" class="fw-sourcing-card">
            <div class="fw-sourcing-card-head">
              <h5>Paid Breakdown</h5>
              <span class="status-badge paid">Wallet Paid</span>
            </div>
            <div class="paid-breakdown-summary">
              <span><strong>Total:</strong> {{ formatCurrency(latestPaymentSnapshot?.summary?.total_paid) }}</span>
              <span><strong>Items:</strong> {{ paidSnapshotItems.length }}</span>
              <span><strong>Sources:</strong> {{ latestPaymentSnapshot?.summary?.source_pharmacy_count || 0 }}</span>
              <span><strong>Paid:</strong> {{ formatDateTime(latestPaymentSnapshot?.payment?.paid_at || latestPaymentSnapshot?.captured_at) }}</span>
            </div>
            <div class="paid-breakdown-list">
              <div v-for="entry in paidSnapshotItems" :key="`paid-${entry.item_id}`" class="paid-breakdown-item">
                <div class="paid-breakdown-item-top">
                  <strong>{{ entry.product_name }}</strong>
                  <span>{{ formatCurrency(entry.line_total) }}</span>
                </div>
                <div class="paid-breakdown-item-meta">
                  Qty {{ entry.quantity }} | Unit {{ formatCurrency(entry.unit_price) }}
                  <template v-if="entry.distance_km !== null && entry.distance_km !== undefined">
                    | {{ Number(entry.distance_km).toFixed(1) }} km
                  </template>
                </div>
                <div v-if="entry.substitute_applied && entry.original_product_name" class="paid-breakdown-note">
                  Sub for: {{ entry.original_product_name }}
                </div>
              </div>
            </div>
            <div v-if="paidSnapshotExcludedItems.length" class="paid-breakdown-excluded">
              <h5>Not Paid</h5>
              <ul>
                <li v-for="entry in paidSnapshotExcludedItems" :key="`excl-${entry.item_id}`">
                  {{ entry.product_name }} ({{ formatExcludedReason(entry.reason) }})
                </li>
              </ul>
            </div>
          </div>

          <!-- Customer feedback -->
          <div v-if="selectedRequest.feedback" class="fw-sourcing-card">
            <div class="fw-sourcing-card-head">
              <h5>Customer Feedback</h5>
              <span class="status-badge delivered">Submitted</span>
            </div>
            <div class="customer-feedback-card">
              <div class="customer-feedback-summary">
                <strong>{{ formatRatingStars(selectedRequest.feedback.rating) }}</strong>
                <span>{{ selectedRequest.feedback.rating }}/5</span>
                <span v-if="selectedRequest.feedback.created_at">{{ formatDateTime(selectedRequest.feedback.created_at) }}</span>
              </div>
              <p v-if="selectedRequest.feedback.comment" class="customer-feedback-comment">{{ selectedRequest.feedback.comment }}</p>
              <p v-else class="customer-feedback-comment muted">No written note.</p>
            </div>
          </div>

          <!-- Prescription attachments -->
          <div v-if="selectedRequest.prescription_image_url" class="fw-sourcing-card">
            <div class="fw-sourcing-card-head">
              <h5>Attachments</h5>
            </div>
            <div class="prescription-preview-grid">
              <div
                v-for="(imageUrl, index) in (selectedRequest.prescription_images?.length ? selectedRequest.prescription_images : [selectedRequest.prescription_image_url])"
                :key="`${selectedRequest.id}-prescription-${index}`"
                class="prescription-preview"
              >
                <a :href="imageUrl" target="_blank" rel="noopener noreferrer" class="prescription-link">
                  <img :src="imageUrl" :alt="`Prescription ${index + 1}`" class="prescription-image" />
                </a>
                <a :href="imageUrl" target="_blank" rel="noopener noreferrer" class="btn-secondary prescription-open-btn">
                  Open Image {{ index + 1 }}
                </a>
              </div>
            </div>
          </div>

          <!-- Sourcing cards -->
          <div class="fw-sourcing-card fw-sourcing-card--main">
            <div class="fw-sourcing-card-head">
              <h5>Nearby Sources</h5>
              <span v-if="canTriggerActionNeeded" class="workspace-inline-status">Customer action pending</span>
            </div>
            <FulfillmentPharmacyManager
              :request="selectedRequest"
              :pharmacies="nearbyPharmacies"
              :candidate-plans="candidatePlans"
              :allocation-summary="allocationSummary"
              :loading="loading"
              :sourcing-error="sourcingError"
              :sourcing-loading="sourcingLoading"
              @contact="contactPharmacy"
              @use-plan="applyCandidatePlanNow"
              @retry="loadFulfillment({ silent: false, refreshLists: false })"
            />
          </div>

          <!-- Admin notes -->
          <div class="fw-sourcing-card">
            <div class="fw-sourcing-card-head">
              <h5>Admin Notes</h5>
              <button @click="saveNotes" class="btn-secondary btn-sm" :disabled="loading">Save</button>
            </div>
            <textarea v-model="adminNotes" class="form-control notes-textarea" rows="3" placeholder="Internal notes..."></textarea>
          </div>
        </div>
        </div><!-- end fw-split-pane -->
      </div>

      <!-- ── Footer ─────────────────────────────────────────── -->
      <div class="fw-footer">
        <div class="fw-footer-status">
          <span class="fw-footer-label">Status</span>
          <span class="status-badge" :class="selectedRequest.status">{{ formatStatus(selectedRequest.status) }}</span>

          <!-- Two-tier status picker -->
          <div class="fw-status-picker" :class="{ 'fw-status-picker--advanced-open': showAdvancedStatuses }">
            <!-- Suggested pills -->
            <div class="fw-status-suggested">
              <button
                v-for="s in suggestedStatuses"
                :key="s.value"
                type="button"
                class="fw-status-pill"
                :class="{ 'fw-status-pill--selected': selectedStatus === s.value }"
                @click="selectedStatus = selectedStatus === s.value ? '' : s.value"
              >
                {{ s.label }}
              </button>
              <button
                v-if="advancedStatuses.length"
                type="button"
                class="fw-status-pill fw-status-pill--more"
                :class="{ 'fw-status-pill--more-open': showAdvancedStatuses }"
                @click="showAdvancedStatuses = !showAdvancedStatuses"
                title="Show more status options"
              >
                More
                <ChevronDownIcon class="icon-xs" :class="{ 'rotate-180': showAdvancedStatuses }" />
              </button>
            </div>

            <!-- Advanced override options -->
            <div v-if="showAdvancedStatuses && advancedStatuses.length" class="fw-status-advanced">
              <span class="fw-status-advanced-label">Override (use carefully)</span>
              <div class="fw-status-advanced-pills">
                <button
                  v-for="s in advancedStatuses"
                  :key="s.value"
                  type="button"
                  class="fw-status-pill fw-status-pill--override"
                  :class="{ 'fw-status-pill--selected': selectedStatus === s.value }"
                  @click="selectedStatus = selectedStatus === s.value ? '' : s.value"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="fw-footer-update">
            <div v-if="isAdvancedStatus" class="fw-override-warning">
              <ExclamationCircleIcon class="icon-xs" />
              Override move — confirm this is correct
            </div>
            <button
              @click="updateStatus"
              class="btn-primary btn-sm"
              :class="{ 'btn-override': isAdvancedStatus }"
              :disabled="!selectedStatus || loading"
            >
              {{ loading ? 'Updating...' : 'Update' }}
            </button>
          </div>
        </div>
        <button @click="calculateTotals" class="btn-secondary btn-sm" :disabled="loading">Calculate Totals</button>
      </div>

        <div v-if="alternativeModal.open" class="workspace-nested-overlay" @click.self="closeAlternativeModal">
          <div class="workspace-nested-modal">
            <div class="workspace-nested-head">
              <div>
                <span class="workspace-nested-label">Alternative</span>
                <h4>Prepare an alternative for customer review</h4>
              </div>
              <button type="button" class="modal-close" @click="closeAlternativeModal">
                <XMarkIcon class="close-svg" />
              </button>
            </div>

            <div class="workspace-nested-content">
              <div v-if="alternativeModal.item" class="alternative-context-card">
                <div class="alternative-context-head">
                  <div>
                    <span class="alternative-context-label">Original request</span>
                    <strong>{{ alternativeModal.item.product_name }}</strong>
                  </div>
                  <span class="alternative-context-qty">Qty {{ getRequestedQuantity(alternativeModal.item) }}</span>
                </div>
                <div class="alternative-compact-preview">
                  <div class="alternative-preview-line">
                    <span class="alternative-compare-label">Current</span>
                    <span class="alternative-preview-text">
                      {{ alternativeModal.item.product_name }}
                      <template v-if="Number(alternativeModal.item.marked_up_price || alternativeModal.item.unit_price || 0) > 0">
                        • {{ formatCurrency(alternativeModal.item.marked_up_price || alternativeModal.item.unit_price) }}
                      </template>
                    </span>
                  </div>
                  <div class="alternative-preview-line replacement">
                    <span class="alternative-compare-label">Alternative</span>
                    <span class="alternative-preview-text">
                      {{ alternativePreviewName }}
                      <template v-if="alternativeModal.price !== '' && alternativeModal.price !== null && alternativeModal.price !== undefined">
                        • {{ formatCurrency(alternativeModal.price) }}
                      </template>
                    </span>
                  </div>
                </div>
                <div class="alternative-context-summary">
                  <span v-if="alternativePriceDifference !== null" class="alternative-summary-chip">
                    Price difference: {{ formatSignedCurrency(alternativePriceDifference) }}
                  </span>
                  <span v-if="selectedAlternativeDistance" class="alternative-summary-chip">
                    {{ selectedAlternativeDistance }}
                  </span>
                  <span v-if="hasExistingAlternative" class="alternative-summary-chip alt-existing">
                    Existing alternative will be updated
                  </span>
                </div>
              </div>

              <div class="workspace-nested-body">
                <div class="nested-flat-form">
                  <div class="nested-field">
                    <label>Source Pharmacy</label>
                    <select v-model.number="alternativeModal.pharmacy_id" class="form-control">
                      <option value="">Choose pharmacy</option>
                      <option
                        v-for="pharm in nearbyPharmacies"
                        :key="`alternative-${alternativeModal.item?.id || 'item'}-${pharm.id}`"
                        :value="pharm.id"
                      >
                        {{ pharm.name }} ({{ formatDistance(pharm.distance_km) }})
                      </option>
                    </select>
                  </div>
                  <div class="nested-field">
                    <label>Quantity</label>
                    <input
                      v-model.number="alternativeModal.allocated_quantity"
                      type="number"
                      min="1"
                      step="1"
                      class="form-control"
                      placeholder="Qty"
                    />
                  </div>
                  <div class="nested-field nested-field-wide">
                    <label>Alternative Product</label>
                    <div class="item-product-edit alternative-product-edit">
                          <input
                        v-model="alternativeModal.name"
                        type="text"
                        class="form-control"
                        placeholder="Search product..."
                        @input="onAlternativeProductInput"
                        @focus="alternativeModal.showProductDropdown = true"
                        @blur="closeAlternativeProductDropdown"
                      />
                      <div
                        v-if="alternativeModal.showProductDropdown"
                        class="product-search-dropdown"
                      >
                        <div v-if="alternativeModal.product_search_loading" class="dropdown-empty">
                          Searching...
                        </div>
                        <template v-else>
                          <button
                            v-for="(result, resultIndex) in alternativeModal.productSearchResults"
                            :key="`alternative-result-${resultIndex}`"
                            type="button"
                            class="product-search-result"
                            @mousedown.prevent="selectAlternativeProduct(result)"
                          >
                            <span class="product-search-name">{{ getProductSearchLabel(result) }}</span>
                            <span v-if="getProductResultMeta(result)" class="product-search-meta">
                              {{ getProductResultMeta(result) }}
                            </span>
                          </button>
                          <div v-if="alternativeModal.productSearchResults.length === 0" class="dropdown-empty">
                            No matching products
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div class="nested-field">
                    <label>Customer Price</label>
                    <input
                      v-model.number="alternativeModal.price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="form-control"
                      placeholder="Price"
                    />
                  </div>
                  <div class="nested-field">
                    <label>Note <span class="nested-field-optional">optional</span></label>
                    <input
                      v-model="alternativeModal.note"
                      type="text"
                      class="form-control"
                      placeholder="Brand, form, or strength"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="workspace-nested-actions">
              <p v-if="!canSaveAlternative" class="alt-save-hint">{{ alternativeSaveHint }}</p>
              <div class="nested-actions-btns">
                <button type="button" class="btn-secondary" @click="closeAlternativeModal" :disabled="loading">
                  Cancel
                </button>
                <button type="button" class="btn-primary" @click="saveAlternativeForItem" :disabled="loading || !canSaveAlternative">
                  {{ hasExistingAlternative ? 'Update Alternative' : 'Save Alternative' }}
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>

    <!-- Toast -->
    <div v-if="message" class="message-toast" :class="{ 'message-error': message.type === 'error' }">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useAdminStore } from '~/stores/admin'
import FulfillmentPharmacyManager from '~/components/admin/FulfillmentPharmacyManager.vue'
import StateMessage from '~/components/StateMessage.vue'
import {
  ChartBarIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  CubeIcon,
  XMarkIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckIcon,
  BoltIcon,
  PhoneIcon,
  TruckIcon,
  SparklesIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const adminStore = useAdminStore()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase

// Shared with layout sidebar badge
const pendingCount = useState('ol-pending-count', () => 0)

// State
const loading = ref(false)
const requests = ref([])
const stats = ref(null)
const searchQuery = ref('')
const statusFilter = ref('pending')
const selectedRequest = ref(null)
const selectedStatus = ref('')
const adminNotes = ref('')
const nearbyPharmacies = ref([])
const candidatePlans = ref([])
const fulfillmentPlans = ref([])
const allocationSummary = ref(null)
const pharmacyQueue = ref([])
const nextRecommendedPharmacy = ref(null)
const logisticsAssessment = ref(null)
const message = ref(null)
const requestsError = ref(false)
const sourcingError = ref(false)
const sourcingLoading = ref(false)
const dismissedStepKey = ref('')
const showAdvancedStatuses = ref(false)
const expandedItemPhotoIds = ref(new Set())
const REQUEST_POLL_MS = 5000
let requestPollTimer = null
const createAdminNewItemDraft = () => ({
  product_id: null,
  product_search: '',
  quantity: 1,
  requested_quantity: 1,
  productSearchResults: [],
  showProductDropdown: false,
  product_search_loading: false,
  productSearchDebounceHandle: null
})
const adminNewItem = reactive(createAdminNewItemDraft())
const alternativeModal = ref({
  open: false,
  item: null,
  pharmacy_id: '',
  allocated_quantity: 1,
  name: '',
  productSearchResults: [],
  showProductDropdown: false,
  product_search_loading: false,
  note: '',
  price: ''
})

const STATUS_TAB_CONFIG = [
  { value: 'pending', label: 'Pending', statuses: ['pending'] },
  { value: 'confirming_with_pharm', label: 'Confirming With Pharm', statuses: ['confirming_with_pharm'] },
  { value: 'awaiting_customer', label: 'Awaiting Customer', statuses: ['awaiting_customer'] },
  { value: 'confirmed_in_pharm', label: 'Confirmed', statuses: ['confirmed_in_pharm'] },
  { value: 'paid', label: 'Paid', statuses: ['paid'] },
  { value: 'more', label: 'More', statuses: ['logistics_pending', 'driver_unavailable', 'ready_for_pickup', 'out_for_delivery', 'returned'] },
  { value: 'completed_group', label: 'Delivered / Picked Up', statuses: ['delivered', 'picked_up'] },
  { value: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] }
]

const normalizeRequestStatus = (value) => String(value || '').trim().toLowerCase()

const matchesStatusFilter = (request, filterValue = statusFilter.value) => {
  if (!filterValue) return true

  const status = normalizeRequestStatus(request?.status)
  const tabConfig = STATUS_TAB_CONFIG.find((tab) => tab.value === filterValue)
  if (tabConfig) return tabConfig.statuses.includes(status)

  return status === normalizeRequestStatus(filterValue)
}

const filteredRequests = computed(() => requests.value.filter((request) => matchesStatusFilter(request)))

const statusTabs = computed(() => STATUS_TAB_CONFIG.map((tab) => ({
  ...tab,
  count: requests.value.filter((request) => tab.statuses.includes(normalizeRequestStatus(request?.status))).length
})))

const selectedAlternativePharmacy = computed(() => {
  const pharmacyId = Number(alternativeModal.value.pharmacy_id || 0)
  if (!pharmacyId) return null
  return nearbyPharmacies.value.find((pharm) => Number(pharm.id) === pharmacyId) || null
})

const selectedAlternativePharmacyName = computed(() => selectedAlternativePharmacy.value?.name || '')

const selectedAlternativeDistance = computed(() => {
  if (!selectedAlternativePharmacy.value?.distance_km && selectedAlternativePharmacy.value?.distance_km !== 0) return ''
  return `${formatDistance(selectedAlternativePharmacy.value.distance_km)} away`
})

const alternativePreviewName = computed(() => {
  const typed = String(alternativeModal.value.name || '').trim()
  return typed || 'Alternative name not set yet'
})

const alternativePriceDifference = computed(() => {
  if (!alternativeModal.value.item) return null
  const altPriceRaw = alternativeModal.value.price
  if (altPriceRaw === '' || altPriceRaw === null || altPriceRaw === undefined) return null
  const altPrice = Number(altPriceRaw)
  if (!Number.isFinite(altPrice)) return null

  const originalPrice = Number(
    alternativeModal.value.item?.marked_up_price
    || alternativeModal.value.item?.unit_price
    || 0
  )

  return altPrice - originalPrice
})

const hasExistingAlternative = computed(() => Boolean(getLatestSubstituteAllocation(alternativeModal.value.item)))

const canSaveAlternative = computed(() => {
  return Boolean(
    alternativeModal.value.item
    && Number(alternativeModal.value.pharmacy_id || 0) > 0
    && Number(alternativeModal.value.allocated_quantity || 0) > 0
    && String(alternativeModal.value.name || '').trim()
    && Number(alternativeModal.value.price || 0) > 0
  )
})

const alternativeSaveHint = computed(() => {
  const missing = []
  if (!String(alternativeModal.value.name || '').trim()) missing.push('alternative name')
  if (!(Number(alternativeModal.value.price || 0) > 0)) missing.push('customer price')
  if (!(Number(alternativeModal.value.pharmacy_id || 0) > 0)) missing.push('source pharmacy')
  if (!(Number(alternativeModal.value.allocated_quantity || 0) > 0)) missing.push('quantity')
  if (missing.length === 0) return ''
  return `Enter ${missing.slice(0, 2).join(' and ')} to continue`
})

const getRequestedQuantity = (item) => {
  const legacyQuantity = Number(item?.quantity || 0)
  const normalizedQuantity = Number(item?.requested_quantity || 0)
  const effectiveQuantity = Math.max(legacyQuantity, normalizedQuantity)
  return effectiveQuantity > 0 ? effectiveQuantity : 1
}

const getAllocationPharmacy = (item) => {
  const pharmacyId = Number(item?.allocation_pharmacy_id || 0)
  if (!pharmacyId) return null

  // 1. Live nearby list (has distance, coverage, etc.)
  const nearby = nearbyPharmacies.value?.find((p) => Number(p.id) === pharmacyId)
  if (nearby) return nearby

  // 2. Allocation records returned by getById (pharmacy_name from DB JOIN)
  if (Array.isArray(item.allocations)) {
    const activeAlloc = item.allocations
      .filter((a) => ['proposed', 'confirmed'].includes(String(a?.status || '')))
      .sort((a, b) => {
        const tA = a?.created_at ? new Date(a.created_at).getTime() : 0
        const tB = b?.created_at ? new Date(b.created_at).getTime() : 0
        return tB - tA
      })
      .find((a) => Number(a?.pharmacy_id) === pharmacyId)
    if (activeAlloc?.pharmacy_name) {
      return { id: pharmacyId, name: activeAlloc.pharmacy_name, distance_km: null }
    }
  }

  // 3. Item's source pharmacy name (from item row JOIN on source_pharmacy_id)
  if (item.pharmacy_name) {
    return { id: pharmacyId, name: item.pharmacy_name, distance_km: null }
  }

  return null
}

const hasQuantitySplit = computed(() => {
  return fulfillmentPlans.value.some((plan) =>
    (plan.items || []).some((item) => Number(item.allocated_quantity || 0) > 0 && Number(item.allocated_quantity || 0) < getRequestedQuantity(item))
  )
})

const customerReadySummary = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  const readyItems = items.filter((item) => {
    const status = item.sourcing_status || item.item_status || ''
    const hasCustomerPrice = Number(item.marked_up_price || 0) > 0
    return hasCustomerPrice || ['available', 'ready_to_order', 'ordered', 'allocated', 'partially_allocated'].includes(status)
  })

  const sourcePharmacyIds = new Set()
  readyItems.forEach((item) => {
    // Use the current authoritative source for this item (one pharmacy per item)
    const effectivePharmacyId = Number(item.allocation_pharmacy_id || item.source_pharmacy_id || 0)
    if (effectivePharmacyId > 0) {
      sourcePharmacyIds.add(effectivePharmacyId)
      return
    }

    // Fallback: check existing allocations from server if no direct assignment
    if (Array.isArray(item.allocations)) {
      const activeAlloc = item.allocations
        .filter((a) => ['proposed', 'confirmed'].includes(String(a?.status || '').toLowerCase()))
        .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))[0]
      if (activeAlloc?.pharmacy_id) {
        sourcePharmacyIds.add(Number(activeAlloc.pharmacy_id))
      }
    }
  })

  return {
    requestedItems: items.length,
    readyItems: readyItems.length,
    missingItems: Math.max(items.length - readyItems.length, 0),
    sourcePharmacyCount: sourcePharmacyIds.size,
    isSplitSource: sourcePharmacyIds.size > 1
  }
})

const requestItemAvailabilitySummary = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  const unavailable = items.filter((item) => {
    const status = item.sourcing_status || item.item_status || ''
    return status === 'unavailable' || item.item_status === 'not_available'
  }).length

  return {
    total: items.length,
    unavailable,
    available: Math.max(items.length - unavailable, 0)
  }
})

const hasPrescriptionAttachments = computed(() => {
  if (!selectedRequest.value) return false
  return Boolean(
    selectedRequest.value.prescription_image_url
    || (Array.isArray(selectedRequest.value.prescription_images) && selectedRequest.value.prescription_images.length)
  )
})

const itemsIntakeSummary = computed(() => {
  if (!selectedRequest.value) return 'Add an item to the request.'

  if (hasPrescriptionAttachments.value) {
    return 'Type the prescription items here. Nearby sourcing will use the request location already on file.'
  }

  return 'Add a missing request item without leaving the workspace.'
})

const canAddAdminItem = computed(() => {
  const productName = String(adminNewItem.product_search || '').trim()
  const hasSelectedProduct = Number(adminNewItem.product_id || 0) > 0
  const quantity = Number(adminNewItem.quantity || 0)
  return (productName.length >= 1 || hasSelectedProduct) && Number.isFinite(quantity) && quantity > 0
})

const canResetAdminNewItem = computed(() => {
  return String(adminNewItem.product_search || '').trim().length > 0
    || Number(adminNewItem.quantity || 1) !== 1
})

const canTriggerActionNeeded = computed(() => {
  if (!selectedRequest.value) return false
  return customerReadySummary.value.missingItems > 0
    || customerReadySummary.value.isSplitSource
    || Number(allocationSummary.value?.substitute_proposals || 0) > 0
    || hasQuantitySplit.value
})

const canSendPartialAvailabilityDecision = computed(() => {
  if (!selectedRequest.value) return false
  return customerReadySummary.value.missingItems > 0
})

const canSendSplitFulfillmentDecision = computed(() => {
  if (!selectedRequest.value) return false
  return customerReadySummary.value.missingItems === 0
    && customerReadySummary.value.readyItems === customerReadySummary.value.requestedItems
    && customerReadySummary.value.isSplitSource
})

const actionNeededSummaryText = computed(() => {
  if (!selectedRequest.value) {
    return 'Open a request workspace to prepare the customer approval link.'
  }

  const reasons = []

  if (customerReadySummary.value.missingItems > 0) {
    reasons.push('items unavailable')
  }

  if (customerReadySummary.value.isSplitSource) {
    reasons.push('a split order')
  }

  if (Number(allocationSummary.value?.substitute_proposals || 0) > 0) {
    reasons.push('alternatives ready')
  }

  if (hasQuantitySplit.value) {
    reasons.push('split quantities')
  }

  if (!reasons.length) {
    return 'No customer action is needed right now.'
  }

  return 'Notify customer about changes.'
})

const buildFallbackPaymentSnapshotFromRequest = (request) => {
  const paidStatuses = new Set(['paid', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered'])
  const status = String(request?.status || '').toLowerCase()
  if (!paidStatuses.has(status)) return null

  const items = Array.isArray(request?.items) ? request.items : []
  const selectedItems = items
    .filter((item) => {
      const unavailable = ['not_available', 'unavailable'].includes(String(item?.item_status || item?.sourcing_status || '').toLowerCase())
      const unitPrice = Number(item?.marked_up_price || item?.unit_price || 0)
      const lineTotal = Number(item?.line_total || 0)
      return !unavailable && (unitPrice > 0 || lineTotal > 0)
    })
    .map((item) => {
      const quantity = Number(item?.quantity || item?.requested_quantity || 1) || 1
      const unitPrice = Number(item?.marked_up_price || item?.unit_price || 0)
      const lineTotal = Number(item?.line_total || (unitPrice * quantity) || 0)
      return {
        item_id: Number(item?.id || 0),
        product_name: item?.product_name || 'Item',
        substitute_applied: false,
        quantity,
        unit_price: Number(unitPrice.toFixed(2)),
        line_total: Number(lineTotal.toFixed(2)),
        source_pharmacy_id: Number(item?.source_pharmacy_id || 0) || null,
        distance_km: null
      }
    })

  if (!selectedItems.length) return null

  const excludedItems = items
    .filter((item) => !selectedItems.some((entry) => Number(entry.item_id) === Number(item?.id || 0)))
    .map((item) => ({
      item_id: Number(item?.id || 0),
      product_name: item?.product_name || 'Item',
      reason: ['not_available', 'unavailable'].includes(String(item?.item_status || item?.sourcing_status || '').toLowerCase())
        ? 'unavailable'
        : 'not_included'
    }))

  const itemsSubtotal = selectedItems.reduce((sum, item) => sum + Number(item?.line_total || 0), 0)
  const deliveryFee = Number(request?.delivery_fee || 0)
  const totalPaid = Number((itemsSubtotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0)).toFixed(2))
  const sourceCount = new Set(
    selectedItems
      .map((item) => Number(item?.source_pharmacy_id || 0))
      .filter((pharmacyId) => pharmacyId > 0)
  ).size

  return {
    version: 1,
    captured_at: request?.updated_at || request?.created_at || null,
    selected_items: selectedItems,
    excluded_items: excludedItems,
    summary: {
      total_paid: totalPaid,
      source_pharmacy_count: sourceCount
    },
    payment: {
      method: 'wallet',
      amount_paid: totalPaid,
      paid_at: request?.updated_at || request?.created_at || null
    }
  }
}

const latestPaymentSnapshot = computed(() => {
  const decisions = Array.isArray(selectedRequest.value?.customer_decisions)
    ? selectedRequest.value.customer_decisions
    : []

  const paidDecision = decisions.find((decision) => {
    const status = String(decision?.status || '').toLowerCase()
    return status === 'approved' && decision?.payload?.payment_snapshot
  })

  const decisionSnapshot = paidDecision?.payload?.payment_snapshot || null
  if (decisionSnapshot) return decisionSnapshot
  return buildFallbackPaymentSnapshotFromRequest(selectedRequest.value)
})

const paidSnapshotItems = computed(() => {
  const items = latestPaymentSnapshot.value?.selected_items
  return Array.isArray(items) ? items : []
})

const paidSnapshotExcludedItems = computed(() => {
  const items = latestPaymentSnapshot.value?.excluded_items
  return Array.isArray(items) ? items : []
})

// API helper
const apiCall = async (method, url, data = null) => {
  const fullUrl = `${apiBaseUrl}${url}`
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminStore.token}`
    }
  }
  if (data) opts.body = JSON.stringify(data)
  const response = await fetch(fullUrl, opts)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

// Fetch
const fetchRequests = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true
  if (!silent) requestsError.value = false
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    const qs = params.toString()
    const res = await apiCall('GET', `/api/order-requests/admin${qs ? `?${qs}` : ''}`)
    requests.value = res.data || []
  } catch (e) {
    if (!silent) {
      requestsError.value = true
      showMessage('Failed to load requests', 'error')
    }
  } finally {
    if (!silent) loading.value = false
  }
}

const fetchStats = async ({ silent = false } = {}) => {
  try {
    const res = await apiCall('GET', '/api/order-requests/admin/stats')
    const raw = res.data || {}
    stats.value = {
      ...raw,
      pending: Number(raw.pending ?? raw.pending_count ?? 0),
      processing: Number(raw.processing ?? raw.processing_count ?? 0),
      completed: Number(raw.completed ?? raw.completed_count ?? 0),
      total: Number(raw.total ?? raw.total_requests ?? 0)
    }
    pendingCount.value = stats.value.pending
  } catch (e) {
    if (!silent) showMessage('Failed to load stats', 'error')
  }
}

const setStatusFilter = (value) => {
  statusFilter.value = value
}

const formatRequestItemsLabel = (request) => {
  const itemCount = Number(request?.item_count || 0)
  if (itemCount > 0) return itemCount
  if (request?.has_prescription) return 'Prescription attached'
  return '-'
}

const getActiveAllocationPharmacyId = (item) => {
  const allocations = Array.isArray(item?.allocations) ? item.allocations : []
  const active = allocations
    .filter((allocation) => ['proposed', 'confirmed'].includes(String(allocation?.status || '').toLowerCase()))
    .sort((a, b) => {
      const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })

  if (!active.length) return 0
  const preferredExact = active.find((allocation) => String(allocation?.allocation_type || '').toLowerCase() === 'exact')
  return Number(preferredExact?.pharmacy_id || active[0]?.pharmacy_id || 0)
}

const getDefaultAllocationPharmacyId = (item) => {
  const existingSelection = Number(item?.allocation_pharmacy_id || 0)
  if (existingSelection > 0) return existingSelection

  const sourcePharmacyId = Number(item?.source_pharmacy_id || 0)
  if (sourcePharmacyId > 0) return sourcePharmacyId

  const activeAllocationPharmacyId = getActiveAllocationPharmacyId(item)
  if (activeAllocationPharmacyId > 0) return activeAllocationPharmacyId

  return ''
}

const hydrateItemUiState = (items = []) => {
  for (const item of items) {
    if (item.editing === undefined) item.editing = false
    if (item.edit_price === undefined) item.edit_price = item.unit_price || 0
    if (item.editingProduct === undefined) item.editingProduct = false
    if (item.product_search === undefined) item.product_search = item.product_name || ''
    if (!Array.isArray(item.productSearchResults)) item.productSearchResults = []
    if (item.showProductDropdown === undefined) item.showProductDropdown = false
    if (item.product_search_loading === undefined) item.product_search_loading = false
    if (item.allocation_pharmacy_id === undefined || item.allocation_pharmacy_id === null || item.allocation_pharmacy_id === '') {
      item.allocation_pharmacy_id = getDefaultAllocationPharmacyId(item)
    }
    if (item.allocation_quantity === undefined) item.allocation_quantity = getRequestedQuantity(item)
    if (item.allocation_type === undefined) item.allocation_type = 'exact'
    if (item.allocation_status === undefined) item.allocation_status = 'confirmed'
    if (item.allocation_unit_price === undefined) item.allocation_unit_price = ''
    if (item.substitute_name === undefined) item.substitute_name = ''
    if (item.substitute_note === undefined) item.substitute_note = ''
    if (Array.isArray(item.allocations)) {
      for (const allocation of item.allocations) {
        hydrateAllocationUiState(allocation)
      }
    }
  }
}

const resetAdminNewItem = () => {
  if (adminNewItem.productSearchDebounceHandle) {
    clearTimeout(adminNewItem.productSearchDebounceHandle)
  }
  Object.assign(adminNewItem, createAdminNewItemDraft())
}

const hydrateAllocationUiState = (allocation) => {
  if (!allocation) return
  if (allocation.editing === undefined) allocation.editing = false
  if (allocation.edit_allocated_quantity === undefined) allocation.edit_allocated_quantity = Number(allocation.allocated_quantity || 1)
  if (allocation.edit_allocation_type === undefined) allocation.edit_allocation_type = allocation.allocation_type || 'exact'
  if (allocation.edit_status === undefined) allocation.edit_status = allocation.status || 'confirmed'
  if (allocation.edit_substitute_name === undefined) allocation.edit_substitute_name = allocation.substitute_name || ''
  if (allocation.edit_substitute_note === undefined) allocation.edit_substitute_note = allocation.substitute_note || ''
}

const openAlternativeModal = (item) => {
  if (!item) return
  const existingAlternative = getLatestSubstituteAllocation(item)
  const existingDetails = getItemSubstituteDetails(item)

  alternativeModal.value = {
    open: true,
    item,
    pharmacy_id: Number(existingAlternative?.pharmacy_id || item?.allocation_pharmacy_id || item?.source_pharmacy_id || getDefaultAllocationPharmacyId(item) || 0) || '',
    allocated_quantity: Number(existingAlternative?.allocated_quantity || getRequestedQuantity(item) || 1),
    name: String(existingAlternative?.substitute_name || existingDetails?.name || '').trim(),
    productSearchResults: [],
    showProductDropdown: false,
    product_search_loading: false,
    note: String(existingAlternative?.substitute_note || existingDetails?.note || '').trim(),
    price: existingAlternative?.unit_price ?? existingDetails?.price ?? ''
  }
}

const closeAlternativeModal = () => {
  alternativeModal.value = {
    open: false,
    item: null,
    pharmacy_id: '',
    allocated_quantity: 1,
    name: '',
    productSearchResults: [],
    showProductDropdown: false,
    product_search_loading: false,
    note: '',
    price: ''
  }
}

const viewRequest = async (req) => {
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${req.id}`)
    selectedRequest.value = res.data
    selectedStatus.value = ''
    showAdvancedStatuses.value = false
    dismissedStepKey.value = ''
    expandedItemPhotoIds.value = new Set()
    adminNotes.value = res.data.admin_notes || ''
    nearbyPharmacies.value = res.data.nearby_pharmacies || []
    candidatePlans.value = []
    fulfillmentPlans.value = []
    allocationSummary.value = null
    pharmacyQueue.value = []
    nextRecommendedPharmacy.value = null
    logisticsAssessment.value = null
    resetAdminNewItem()

    hydrateItemUiState(selectedRequest.value.items || [])
    const viewedStatus = selectedRequest.value.status
    if (canRunFulfillment(viewedStatus)) {
      loadFulfillment({ silent: true, refreshLists: false })
    } else {
      fetchFulfillmentPlans({ silent: true })
    }
  } catch (e) {
    showMessage('Failed to load request details', 'error')
  }
}

const canRunFulfillment = (status) => {
  const allowed = new Set([
    'pending',
    'confirming_with_pharm',
    'confirmed_in_pharm',
    // Legacy values kept to support older records.
    'processing',
    'items_sourced',
    'awaiting_customer',
    'confirmed'
  ])
  return allowed.has(status)
}

const syncPharmacyCoverageFromQueue = (queue = []) => {
  if (!Array.isArray(queue) || !queue.length || !Array.isArray(nearbyPharmacies.value) || !nearbyPharmacies.value.length) {
    return
  }

  const queueById = new Map(queue.map((entry) => [Number(entry.pharmacy_id), entry]))

  nearbyPharmacies.value = nearbyPharmacies.value.map((pharmacy) => {
    const coverage = queueById.get(Number(pharmacy.id))
    if (!coverage) return pharmacy

    return {
      ...pharmacy,
      matched_item_count: coverage.matched_item_count ?? pharmacy.matched_item_count ?? 0,
      fully_covered_item_count: coverage.fully_covered_item_count ?? pharmacy.fully_covered_item_count ?? 0,
      matched_quantity_total: coverage.matched_quantity_total ?? pharmacy.matched_quantity_total ?? 0,
      exact_match_count: coverage.exact_match_count ?? pharmacy.exact_match_count ?? 0,
      substitute_count: coverage.substitute_count ?? pharmacy.substitute_count ?? 0,
      missing_item_count: coverage.missing_item_count ?? pharmacy.missing_item_count ?? 0,
      fully_covers_request: coverage.fully_covers_request ?? pharmacy.fully_covers_request ?? false
    }
  })
}

const loadFulfillment = async (options = {}) => {
  const { silent = false, refreshLists = true } = options
  if (!selectedRequest.value || !canRunFulfillment(selectedRequest.value.status)) return
  loading.value = true
  sourcingLoading.value = true
  sourcingError.value = false
  try {
    const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    const fullRequest = detailRes?.data || selectedRequest.value

    selectedRequest.value = { ...fullRequest, status: res.data.status || fullRequest.status }
    selectedStatus.value = selectedRequest.value.status || ''
    adminNotes.value = selectedRequest.value.admin_notes || ''
    nearbyPharmacies.value = res.data.nearby_pharmacies || []
    candidatePlans.value = res.data.candidate_plans || []
    fulfillmentPlans.value = res.data.fulfillment_plans || []
    allocationSummary.value = res.data.allocation_summary || null
    pharmacyQueue.value = res.data.pharmacy_queue || []
    nextRecommendedPharmacy.value = res.data.next_recommended_pharmacy || null
    logisticsAssessment.value = res.data.logistics_assessment || null
    syncPharmacyCoverageFromQueue(pharmacyQueue.value)
    hydrateItemUiState(selectedRequest.value.items || [])
    if (refreshLists) {
      await fetchRequests()
      await fetchStats()
    }
    if (!silent) showMessage('Fulfillment details refreshed', 'success')
  } catch (e) {
    sourcingError.value = true
    if (!silent) showMessage('Failed to load fulfillment details', 'error')
  } finally {
    loading.value = false
    sourcingLoading.value = false
  }
}

const contactPharmacy = async (pharm) => {
  if (!selectedRequest.value) return

  // Open WhatsApp immediately
  window.open(pharm.whatsapp_url, '_blank')

  // Log contact in background
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`)
    pharm.contacted_at = new Date().toISOString()
    await fetchFulfillmentPlans({ silent: true })
  } catch (e) {
    console.error('Failed to log contact', e)
  }
}

const confirmPharmacy = async (pharm) => {
  if (!selectedRequest.value) return
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`, {
      status: 'confirmed',
      is_confirmed: true
    })
    nearbyPharmacies.value.forEach(p => {
      p.is_confirmed = false
      if (p.pharmacy_status === 'confirmed') p.pharmacy_status = 'contacted'
    })
    pharm.is_confirmed = true
    pharm.pharmacy_status = 'confirmed'
    await fetchFulfillmentPlans({ silent: true })
    showMessage(`Confirmed ${pharm.name} will fulfill this order`, 'success')
  } catch (e) {
    showMessage('Failed to confirm pharmacy', 'error')
  }
}

const markOutOfStock = async (pharm) => {
  if (!selectedRequest.value) return
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`, {
      status: 'out_of_stock',
      is_confirmed: false
    })
    pharm.pharmacy_status = 'out_of_stock'
    pharm.is_confirmed = false
    await fetchFulfillmentPlans({ silent: true })
    showMessage(`${pharm.name} marked as out of stock`, 'success')
  } catch (e) {
    showMessage('Failed to update pharmacy status', 'error')
  }
}

const updateStatus = async () => {
  if (!selectedRequest.value || !selectedStatus.value) return
  loading.value = true
  try {
    const newStatus = selectedStatus.value

    if (newStatus === 'confirmed_in_pharm' && Array.isArray(selectedRequest.value.items)) {
      const quoteCandidates = selectedRequest.value.items.filter((item) => {
        const normalizedStatus = String(item?.item_status || item?.sourcing_status || '').toLowerCase()
        if (['not_available', 'unavailable'].includes(normalizedStatus)) return false
        const quotePrice = Number(item?.edit_price || item?.unit_price || item?.marked_up_price || 0)
        return Number.isFinite(quotePrice) && quotePrice > 0
      })

      for (const item of quoteCandidates) {
        const quotePrice = Number(item.edit_price || item.unit_price || item.marked_up_price || 0)
        await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
          unit_price: quotePrice,
          item_status: 'available'
        })
        item.unit_price = quotePrice
        item.marked_up_price = quotePrice
        item.line_total = Number((quotePrice * Number(item.quantity || 0)).toFixed(2))
        item.item_status = 'available'
        item.sourcing_status = 'allocated'
      }
    }

    const statusRes = await apiCall('PUT', `/api/order-requests/admin/${selectedRequest.value.id}/status`, {
      status: newStatus,
      admin_notes: adminNotes.value
    })
    selectedRequest.value.status = newStatus
    selectedStatus.value = ''
    showAdvancedStatuses.value = false

    // Only load fulfillment context when explicitly entering the confirming phase.
    if ((newStatus === 'confirming_with_pharm' || newStatus === 'processing') && canRunFulfillment(newStatus)) {
      const procRes = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
      nearbyPharmacies.value = procRes.data.nearby_pharmacies || []
    }

    await fetchRequests()
    await fetchStats()
    showMessage(statusRes?.message || 'Status updated and fulfillment data refreshed', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to update status', 'error')
  } finally {
    loading.value = false
  }
}

const saveNotes = async () => {
  if (!selectedRequest.value) return
  loading.value = true
  try {
    await apiCall('PUT', `/api/order-requests/admin/${selectedRequest.value.id}/notes`, {
      admin_notes: adminNotes.value
    })
    selectedRequest.value.admin_notes = adminNotes.value
    showMessage('Admin notes saved successfully', 'success')
  } catch (e) {
    showMessage('Failed to save notes', 'error')
  } finally {
    loading.value = false
  }
}

const calculateTotals = async () => {
  if (!selectedRequest.value) return
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}/totals`)
    showMessage(`Subtotal: GHS ${res.data.subtotal} | ${res.data.available_items.length} available, ${res.data.unavailable_items.length} unavailable`, 'success')
  } catch (e) {
    showMessage('Failed to calculate totals', 'error')
  }
}

const fetchFulfillmentPlans = async (options = {}) => {
  const { silent = false } = options
  if (!selectedRequest.value) return
    try {
      const res = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}/fulfillment-plans`)
        const data = res.data || {}
      candidatePlans.value = data.candidate_plans || []
      fulfillmentPlans.value = data.plans || []
      allocationSummary.value = data.summary || null
      pharmacyQueue.value = data.pharmacy_queue || []
      nextRecommendedPharmacy.value = data.next_recommended_pharmacy || null
      logisticsAssessment.value = data.logistics_assessment || null
      // Bootstrap nearbyPharmacies from queue when not yet populated
      // (e.g. non-active statuses where loadFulfillment never runs)
      if (!nearbyPharmacies.value.length && pharmacyQueue.value.length) {
        nearbyPharmacies.value = pharmacyQueue.value.map((entry) => ({
          id: Number(entry.pharmacy_id),
          name: entry.pharmacy_name,
          distance_km: entry.distance_km,
          matched_item_count: entry.matched_item_count,
          fully_covered_item_count: entry.fully_covered_item_count,
          matched_quantity_total: entry.matched_quantity_total,
          exact_match_count: entry.exact_match_count,
          substitute_count: entry.substitute_count,
          missing_item_count: entry.missing_item_count,
          coverage_items: entry.coverage_items || []
        }))
      }
      syncPharmacyCoverageFromQueue(pharmacyQueue.value)
    } catch (e) {
      if (!silent) showMessage('Failed to load fulfillment plans', 'error')
    }
}

const requestCustomerDecision = async (decisionType) => {
  if (!selectedRequest.value) return

  if (decisionType === 'action_needed' && !canTriggerActionNeeded.value) {
    showMessage('Action needed is only available when there are missing items, split sourcing, or substitute options', 'info')
    return
  }

  if (decisionType === 'partial_availability' && !canSendPartialAvailabilityDecision.value) {
    showMessage('Partial availability only applies when one or more items are unavailable', 'info')
    return
  }

  if (decisionType === 'split_fulfillment' && !canSendSplitFulfillmentDecision.value) {
    showMessage('Split fulfillment only applies when all confirmed items are sourced from multiple pharmacies', 'info')
    return
  }

  loading.value = true
  try {
    const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/decisions`, {
      decision_type: decisionType
    })
    const decision = res?.data || {}
    await fetchRequests()
    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    selectedRequest.value = detailRes.data
    await fetchFulfillmentPlans({ silent: true })

    if (decision.whatsapp_url && typeof window !== 'undefined') {
      window.open(decision.whatsapp_url, '_blank', 'noopener,noreferrer')
    }

    const successMessage = decisionType === 'action_needed'
      ? 'Action needed decision prepared'
      : decisionType === 'partial_availability'
      ? 'Partial availability decision prepared'
      : decisionType === 'split_fulfillment'
        ? 'Split fulfillment decision prepared'
        : 'Customer decision request sent'
    showMessage(successMessage, 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to create customer decision', 'error')
  } finally {
    loading.value = false
  }
}

const startEditItem = (item) => {
  item.editing = true
  item.edit_price = item.unit_price || 0
}

const isPhotoStripExpanded = (item) => {
  const itemId = Number(item?.id || 0)
  if (!itemId) return false
  return expandedItemPhotoIds.value.has(itemId)
}

const shouldShowPhotoToggle = (item) => Array.isArray(item?.item_images) && item.item_images.length > 4

const toggleItemPhotos = (item) => {
  const itemId = Number(item?.id || 0)
  if (!itemId) return

  const next = new Set(expandedItemPhotoIds.value)
  if (next.has(itemId)) {
    next.delete(itemId)
  } else {
    next.add(itemId)
  }
  expandedItemPhotoIds.value = next
}

const getSourcingOptions = (item, excludeCurrent = false) => {
  const itemId = Number(item?.id || 0)
  if (!itemId) return []

  const sourceList = Array.isArray(pharmacyQueue.value) && pharmacyQueue.value.length > 0
    ? pharmacyQueue.value
    : []

  const excludeId = excludeCurrent ? Number(item?.allocation_pharmacy_id || 0) : 0

  return sourceList
    .map((pharmacy) => {
      const pharmacyId = Number(pharmacy?.id || pharmacy?.pharmacy_id || 0)
      if (excludeId > 0 && pharmacyId === excludeId) return null

      const coverage = Array.isArray(pharmacy?.coverage_items)
        ? pharmacy.coverage_items.find((entry) => Number(entry?.item_id || 0) === itemId)
        : null

      const availableQuantity = Number(coverage?.available_quantity || 0)
      const matchedQuantity = Number(coverage?.matched_quantity || 0)
      if (availableQuantity === 0 && matchedQuantity === 0) return null

      return {
        pharmacyId,
        name: String(pharmacy.name || pharmacy.pharmacy_name || `Pharmacy ${pharmacyId}`).trim(),
        distanceKm: Number(Number(pharmacy.distance_km || 0).toFixed(1)),
        matchedQuantity,
        availableQuantity,
        unitPrice: coverage?.unit_price != null ? Number(coverage.unit_price) : null
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.matchedQuantity !== a.matchedQuantity) return b.matchedQuantity - a.matchedQuantity
      if (b.availableQuantity !== a.availableQuantity) return b.availableQuantity - a.availableQuantity
      return a.distanceKm - b.distanceKm
    })
}

const toggleSourcingDropdown = (item) => {
  const next = !item.showSourcingDropdown
  const allItems = selectedRequest.value?.items || []
  for (const otherItem of allItems) {
    otherItem.showSourcingDropdown = false
  }
  item.showSourcingDropdown = next
}

const selectSourcingOption = async (item, option) => {
  item.showSourcingDropdown = false
  const name = String(item.product_name || 'this item').trim()
  const previousSourceId = Number(item.allocation_pharmacy_id || item.source_pharmacy_id || 0)
  const isChangingSource = previousSourceId > 0 && previousSourceId !== Number(option.pharmacyId || 0)

  item.allocation_pharmacy_id = option.pharmacyId
  item.allocation_quantity = Number(item.allocation_quantity || 0) > 0
    ? Number(item.allocation_quantity || 0)
    : getRequestedQuantity(item)
  item.allocation_type = 'exact'
  item.allocation_status = 'confirmed'

  if (Number.isFinite(option.unitPrice) && Number(option.unitPrice) > 0) {
    const normalizedUnitPrice = Number(Number(option.unitPrice).toFixed(2))
    item.edit_price = normalizedUnitPrice
    item.unit_price = normalizedUnitPrice
    item.marked_up_price = normalizedUnitPrice
    item.line_total = Number((normalizedUnitPrice * Number(getRequestedQuantity(item) || 0)).toFixed(2))
    if (item.editing === undefined) item.editing = false
  }

  loading.value = true
  try {
    const payload = buildAllocationPayload(item)
    await apiCall('POST', `/api/order-requests/admin/items/${item.id}/allocations`, payload)
    await refreshSelectedRequestState()

    if (isChangingSource) {
      showMessage(`Changed source to ${option.name} for ${name}`, 'success')
    } else {
      showMessage(`Selected ${option.name} for ${name}`, 'success')
    }
  } catch (e) {
    showMessage(e.message || 'Failed to save source selection', 'error')
  } finally {
    loading.value = false
  }
}

const startEditItemProduct = (item) => {
  item.editingProduct = true
  item.product_search = item.product_name || ''
  item.productSearchResults = []
  item.showProductDropdown = false
}

const cancelEditItemProduct = (item) => {
  item.editingProduct = false
  item.product_search = item.product_name || ''
  item.productSearchResults = []
  item.showProductDropdown = false
  item.product_search_loading = false
  if (item.productSearchDebounceHandle) {
    clearTimeout(item.productSearchDebounceHandle)
    item.productSearchDebounceHandle = null
  }
}

const getRequestSearchCoordinates = () => {
  const request = selectedRequest.value || {}
  const lat = Number(
    request.customer_latitude
    ?? request.customer_lat
    ?? request.latitude
    ?? request.lat
    ?? request.delivery_latitude
    ?? request.delivery_lat
  )
  const lng = Number(
    request.customer_longitude
    ?? request.customer_lng
    ?? request.longitude
    ?? request.lng
    ?? request.delivery_longitude
    ?? request.delivery_lng
  )
  return {
    hasCoords: Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0,
    lat,
    lng
  }
}

const getProductSearchLabel = (result) => {
  const baseName = String(
    result?.product_description
    || result?.master_name
    || result?.product_name
    || result?.name
    || result?.brand_name
    || ''
  ).trim()
  const strength = String(result?.strength || '').trim()
  if (!baseName && !strength) return ''
  if (strength && !baseName.toLowerCase().includes(strength.toLowerCase())) {
    return `${baseName} ${strength}`.trim()
  }
  return baseName
}

const getProductResultMeta = (result) => {
  const parts = []
  const availableAt = Number(result?.available_at || 0)
  if (availableAt > 0) {
    parts.push(`${availableAt} ${availableAt === 1 ? 'pharmacy' : 'pharmacies'}`)
  }
  const minPrice = Number(result?.min_price || 0)
  const maxPrice = Number(result?.max_price || 0)
  if (minPrice > 0 || maxPrice > 0) {
    if (maxPrice > minPrice && minPrice > 0) {
      parts.push(`GHS ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`)
    } else {
      const price = maxPrice > 0 ? maxPrice : minPrice
      if (price > 0) parts.push(`GHS ${price.toFixed(2)}`)
    }
  }
  if (!parts.length && result?.strength) {
    parts.push(String(result.strength))
  }
  return parts.join(' • ')
}

const getProductResultPrice = (result) => {
  const direct = [
    Number(result?.selling_price || 0),
    Number(result?.unit_price || 0),
    Number(result?.price || 0),
    Number(result?.cost_price || 0)
  ].find((value) => Number.isFinite(value) && value > 0)

  if (direct) return direct

  const minPrice = Number(result?.min_price || 0)
  const maxPrice = Number(result?.max_price || 0)
  if (Number.isFinite(minPrice) && minPrice > 0) return minPrice
  if (Number.isFinite(maxPrice) && maxPrice > 0) return maxPrice
  return null
}

const fetchProductSearchResults = async (query) => {
  const trimmedQuery = String(query || '').trim()
  if (trimmedQuery.length < 2) return []

  const coords = getRequestSearchCoordinates()
  let res
  if (coords.hasCoords) {
    res = await apiCall('GET', `/api/products/nearby-search?lat=${coords.lat}&lng=${coords.lng}&search=${encodeURIComponent(trimmedQuery)}&limit=8`)
    const results = Array.isArray(res?.data) ? res.data : []
    return results.filter((product) => !(product?.is_active === false || product?.is_active === 0 || product?.is_active === '0'))
  } else {
    res = await apiCall('GET', `/api/master-products?search=${encodeURIComponent(trimmedQuery)}&limit=8`)
    return Array.isArray(res?.data) ? res.data : []
  }
}

const searchAdminProducts = async (item) => {
  const query = String(item.product_search || '').trim()
  if (query.length < 2) {
    item.productSearchResults = []
    return
  }

  item.product_search_loading = true
  try {
    item.productSearchResults = await fetchProductSearchResults(query)
  } catch (e) {
    item.productSearchResults = []
  } finally {
    item.product_search_loading = false
  }
}

const onAdminProductInput = (item) => {
  item.showProductDropdown = true
  item.product_id = null
  if (!item.product_search || item.product_search.trim().length < 2) {
    item.productSearchResults = []
    return
  }
  if (item.productSearchDebounceHandle) {
    clearTimeout(item.productSearchDebounceHandle)
  }
  item.productSearchDebounceHandle = setTimeout(() => {
    searchAdminProducts(item)
  }, 300)
}

const selectAdminProduct = (item, result) => {
  const label = getProductSearchLabel(result)
  if (!label) return
  item.product_search = label
  item.product_id = Number(result?.product_id || result?.id || 0) || null
  item.showProductDropdown = false
  item.productSearchResults = []
}

const closeAdminProductDropdown = (item) => {
  setTimeout(() => {
    item.showProductDropdown = false
  }, 160)
}

const searchAlternativeProducts = async () => {
  const query = String(alternativeModal.value.name || '').trim()
  if (query.length < 2) {
    alternativeModal.value.productSearchResults = []
    return
  }

  alternativeModal.value.product_search_loading = true
  try {
    alternativeModal.value.productSearchResults = await fetchProductSearchResults(query)
  } catch (e) {
    alternativeModal.value.productSearchResults = []
  } finally {
    alternativeModal.value.product_search_loading = false
  }
}

const onAlternativeProductInput = () => {
  alternativeModal.value.showProductDropdown = true
  if (!alternativeModal.value.name || alternativeModal.value.name.trim().length < 2) {
    alternativeModal.value.productSearchResults = []
    return
  }
  if (alternativeModal.value.productSearchDebounceHandle) {
    clearTimeout(alternativeModal.value.productSearchDebounceHandle)
  }
  alternativeModal.value.productSearchDebounceHandle = setTimeout(() => {
    searchAlternativeProducts()
  }, 300)
}

const selectAlternativeProduct = (result) => {
  const label = getProductSearchLabel(result)
  if (!label) return
  alternativeModal.value.name = label

  // Prefill source pharmacy from the search result
  const resultPharmacies = Array.isArray(result?.pharmacies) ? result.pharmacies : []
  if (resultPharmacies.length) {
    const nearbyIds = new Set((nearbyPharmacies.value || []).map((p) => Number(p.id)))
    const matched = resultPharmacies.find((p) => nearbyIds.has(Number(p.id))) || resultPharmacies[0]
    if (matched && Number(matched.id) > 0) {
      alternativeModal.value.pharmacy_id = Number(matched.id)
    }
  }

  const selectedPrice = getProductResultPrice(result)
  if (Number.isFinite(selectedPrice) && selectedPrice > 0) {
    alternativeModal.value.price = Number(selectedPrice.toFixed(2))
  }
  alternativeModal.value.showProductDropdown = false
  alternativeModal.value.productSearchResults = []
}

const closeAlternativeProductDropdown = () => {
  setTimeout(() => {
    alternativeModal.value.showProductDropdown = false
  }, 160)
}

const saveItemProduct = async (item) => {
  const productName = String(item.product_search || '').trim()
  if (productName.length < 2) {
    showMessage('Please choose a valid product name', 'error')
    return
  }
  try {
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      product_name: productName
    })
    item.product_name = productName
    item.editingProduct = false
    item.productSearchResults = []
    item.showProductDropdown = false
    await fetchFulfillmentPlans({ silent: true })
    showMessage('Item product updated', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to update item product', 'error')
  }
}

const saveAdminNewItem = async () => {
  if (!selectedRequest.value || !canAddAdminItem.value) return

  loading.value = true
  try {
    const productName = String(adminNewItem.product_search || '').trim()
    const quantity = Number(adminNewItem.quantity || 1)

    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/items`, {
      product_id: adminNewItem.product_id || null,
      product_name: productName,
      quantity,
      requested_quantity: quantity,
      source_type: hasPrescriptionAttachments.value ? 'prescription' : 'admin'
    })

    resetAdminNewItem()

    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    selectedRequest.value = detailRes.data
    selectedStatus.value = detailRes.data.status || ''
    adminNotes.value = detailRes.data.admin_notes || ''
    hydrateItemUiState(selectedRequest.value.items || [])

    if (canRunFulfillment(selectedRequest.value.status)) {
      await loadFulfillment({ silent: true, refreshLists: false })
    } else {
      await fetchFulfillmentPlans({ silent: true })
    }

    await fetchRequests({ silent: true })
    await fetchStats({ silent: true })
    showMessage('Item added to request', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to add item', 'error')
  } finally {
    loading.value = false
  }
}

const useNextRecommendedPharmacy = (item) => {
  if (!nextRecommendedPharmacy.value) return
  item.allocation_pharmacy_id = nextRecommendedPharmacy.value.pharmacy_id
}

const fillFullAllocation = (item) => {
  item.allocation_quantity = getRequestedQuantity(item)
}

const isPlanItemMissing = (planItem) => {
  if (!planItem) return true
  const matchedQuantity = Number(planItem.matched_quantity || 0)
  if (matchedQuantity > 0) return false
  const availableQuantity = Number(planItem.available_quantity || 0)
  if (availableQuantity > 0) return false
  const likelyType = String(planItem.likely_match_type || '').toLowerCase()
  return !likelyType || likelyType === 'none'
}

const getPlanAllocationForPharmacy = (planItem, pharmacyId) => {
  const normalizedPharmacyId = Number(pharmacyId || 0)
  if (!planItem || normalizedPharmacyId <= 0) return null

  const matchingAllocations = Array.isArray(planItem.allocations)
    ? planItem.allocations.filter((entry) =>
      Number(entry?.pharmacy_id || 0) === normalizedPharmacyId && Number(entry?.matched_quantity || 0) > 0
    )
    : []

  if (matchingAllocations.length) {
    return matchingAllocations.slice().sort((a, b) => {
      if (Number(b.matched_quantity || 0) !== Number(a.matched_quantity || 0)) {
        return Number(b.matched_quantity || 0) - Number(a.matched_quantity || 0)
      }
      return Number(a.distance_km || 0) - Number(b.distance_km || 0)
    })[0]
  }

  if (Number(planItem?.source_pharmacy_id || 0) === normalizedPharmacyId && Number(planItem?.matched_quantity || 0) > 0) {
    return {
      pharmacy_id: normalizedPharmacyId,
      matched_quantity: Number(planItem.matched_quantity || 0),
      unit_price: planItem.unit_price
    }
  }

  return null
}

const applyCandidatePlan = async (input) => {
  const plan = input?.plan || input
  const selectedPharmacy = input?.pharmacy || null
  const selectedPharmacyId = Number(selectedPharmacy?.id || selectedPharmacy?.pharmacy_id || 0)
  const hasPlanPharmacies = Array.isArray(plan?.pharmacies) && plan.pharmacies.length > 0

  if (!selectedRequest.value || !Array.isArray(selectedRequest.value.items) || (!hasPlanPharmacies && selectedPharmacyId <= 0)) {
    return
  }

  loading.value = true
  const items = selectedRequest.value.items
  const effectivePlanPharmacies = hasPlanPharmacies
    ? plan.pharmacies
    : [{ pharmacy_id: selectedPharmacyId, pharmacy_name: selectedPharmacy?.name || `Pharmacy ${selectedPharmacyId}` }]
  const planPharmacyIds = new Set(effectivePlanPharmacies.map((entry) => Number(entry?.pharmacy_id || 0)).filter((id) => id > 0))
  const defaultPharmacyId = Number(effectivePlanPharmacies[0]?.pharmacy_id || 0) || ''
  const fallbackPlanItems = (selectedPharmacy?.coverage_items || []).map((entry) => ({
    item_id: Number(entry?.item_id || 0),
    matched_quantity: Number(entry?.matched_quantity || 0),
    available_quantity: Number(entry?.available_quantity || 0),
    unit_price: entry?.unit_price != null ? Number(entry.unit_price) : null,
    source_pharmacy_id: selectedPharmacyId,
    allocations: Number(entry?.matched_quantity || 0) > 0
      ? [{
        pharmacy_id: selectedPharmacyId,
        matched_quantity: Number(entry?.matched_quantity || 0),
        available_quantity: Number(entry?.available_quantity || 0),
        unit_price: entry?.unit_price != null ? Number(entry.unit_price) : null
      }]
      : []
  }))
  const planItemsById = new Map((hasPlanPharmacies ? (plan.items || []) : fallbackPlanItems).map((entry) => [Number(entry?.item_id || 0), entry]))
  const unmatchedItems = []
  let coveredItems = 0

  try {
    items.forEach((item) => {
      const planItem = planItemsById.get(Number(item.id))
      const pharmacyAllocation = selectedPharmacyId > 0
        ? getPlanAllocationForPharmacy(planItem, selectedPharmacyId)
        : null
      const missingFromPlan = selectedPharmacyId > 0
        ? !pharmacyAllocation
        : isPlanItemMissing(planItem)

      if (missingFromPlan) {
        item.allocation_pharmacy_id = ''
        item.allocation_quantity = getRequestedQuantity(item)
        item.allocation_type = 'exact'
        item.allocation_status = 'confirmed'
        item.allocation_unit_price = ''
        item.substitute_name = ''
        item.substitute_note = ''
        unmatchedItems.push(item)
        return
      }

      coveredItems += 1
      const itemPlanAllocations = selectedPharmacyId > 0
        ? (pharmacyAllocation ? [pharmacyAllocation] : [])
        : (Array.isArray(planItem?.allocations)
          ? planItem.allocations.filter((entry) => Number(entry?.matched_quantity || 0) > 0)
          : [])
      const preferredAllocation = selectedPharmacyId > 0
        ? pharmacyAllocation
        : itemPlanAllocations.slice().sort((a, b) => {
          if (Number(b.matched_quantity || 0) !== Number(a.matched_quantity || 0)) {
            return Number(b.matched_quantity || 0) - Number(a.matched_quantity || 0)
          }
          return Number(a.distance_km || 0) - Number(b.distance_km || 0)
        })[0] || null
      const explicitPharmacyId = Number(
        preferredAllocation?.pharmacy_id
        || planItem?.source_pharmacy_id
        || 0
      )
      const currentItemSelection = Number(item.allocation_pharmacy_id || item.source_pharmacy_id || 0)
      if (explicitPharmacyId > 0) {
        item.allocation_pharmacy_id = explicitPharmacyId
      } else if (planPharmacyIds.has(currentItemSelection)) {
        item.allocation_pharmacy_id = currentItemSelection
      } else {
        item.allocation_pharmacy_id = defaultPharmacyId
      }

      const matchedQuantity = Number(
        preferredAllocation?.matched_quantity
        || planItem?.matched_quantity
        || 0
      )
      const sourcedUnitPrice = preferredAllocation?.unit_price !== undefined && preferredAllocation?.unit_price !== null
        ? Number(preferredAllocation.unit_price)
        : (planItem?.unit_price !== undefined && planItem?.unit_price !== null
          ? Number(planItem.unit_price)
          : null)
      item.allocation_quantity = matchedQuantity > 0
        ? Math.min(getRequestedQuantity(item), Math.max(1, Math.floor(matchedQuantity)))
        : getRequestedQuantity(item)
      item.allocation_type = 'exact'
      item.allocation_status = 'confirmed'
      item.allocation_unit_price = ''
      item.substitute_name = ''
      item.substitute_note = ''
      if (Number.isFinite(sourcedUnitPrice) && sourcedUnitPrice > 0) {
        const normalizedUnitPrice = Number(sourcedUnitPrice.toFixed(2))
        item.edit_price = normalizedUnitPrice
        item.unit_price = normalizedUnitPrice
        item.marked_up_price = normalizedUnitPrice
        item.line_total = Number((normalizedUnitPrice * Number(getRequestedQuantity(item) || 0)).toFixed(2))
        if (item.editing === undefined) item.editing = false
      }
    })

    if (unmatchedItems.length > 0) {
      const sourceLabel = selectedPharmacy?.name || plan.label || 'selected source'
      showMessage(`Prefilled ${coveredItems} matched item(s) from ${sourceLabel}; ${unmatchedItems.length} left unchanged`, 'success')
    } else {
      const sourceLabel = selectedPharmacy?.name || String(plan.label || 'selected source').toLowerCase()
      showMessage(`Prefilled confirmed allocation controls from ${sourceLabel}`, 'success')
    }
  } catch (e) {
    showMessage(e.message || 'Failed to apply plan', 'error')
  } finally {
    loading.value = false
  }
}

const buildAllocationPayload = (item, source = item) => {
  const allocationType = source.allocation_type || 'exact'
  const pharmacyId = Number(source.allocation_pharmacy_id || 0)
  const quantity = Number(source.allocation_quantity || 0)
  if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
    throw new Error('Choose a pharmacy before creating an allocation')
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Allocation quantity must be greater than 0')
  }

  if (allocationType === 'substitute' && !String(source.substitute_name || '').trim()) {
    throw new Error('Alternative name is required before saving')
  }

  const allocationUnitPrice = source.allocation_unit_price === '' || source.allocation_unit_price === null || source.allocation_unit_price === undefined
    ? null
    : Number(source.allocation_unit_price)

  if (allocationType === 'substitute' && (!Number.isFinite(allocationUnitPrice) || allocationUnitPrice <= 0)) {
    throw new Error('Alternative price must be greater than 0')
  }

  return {
    pharmacy_id: pharmacyId,
    allocated_quantity: quantity,
    allocation_type: allocationType,
    substitute_name: allocationType === 'substitute' ? String(source.substitute_name || '').trim() : null,
    substitute_note: allocationType === 'substitute' ? String(source.substitute_note || '').trim() : null,
    unit_price: allocationType === 'substitute' ? allocationUnitPrice : null,
    status: 'confirmed'
  }
}

const refreshSelectedRequestState = async () => {
  if (!selectedRequest.value) return
  const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
  selectedRequest.value = detailRes.data
  adminNotes.value = selectedRequest.value.admin_notes || ''
  hydrateItemUiState(selectedRequest.value.items || [])
  await fetchFulfillmentPlans({ silent: true })
}

const applyCandidatePlanNow = async (input) => {
  if (!selectedRequest.value) return

  const rawPlan = input?.plan || input
  const pharmacy = input?.pharmacy || null
  const planLabel = rawPlan?.label || pharmacy?.name || 'selected plan'

  await applyCandidatePlan(input)

  loading.value = true
  try {
    for (const item of selectedRequest.value.items || []) {
      if (item.item_status === 'not_available' || item.sourcing_status === 'unavailable') {
        continue
      }
      if (!Number(item.allocation_pharmacy_id || 0)) {
        continue
      }

      const payload = buildAllocationPayload(item)
      await apiCall('POST', `/api/order-requests/admin/items/${item.id}/allocations`, payload)
      
      // Save the unit price that was already extracted and set by applyCandidatePlan
      const unitPrice = item.unit_price ? Number(item.unit_price) : null
      if (Number.isFinite(unitPrice) && unitPrice > 0) {
        await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
          unit_price: unitPrice,
          item_status: 'available'
        })
      }
    }

    await refreshSelectedRequestState()
    showMessage(`Applied ${planLabel.toLowerCase()} as confirmed allocations`, 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to apply suggested plan', 'error')
  } finally {
    loading.value = false
  }
}

const createAllocationForItem = async (item) => {
  if (!selectedRequest.value) return

  loading.value = true
  try {
    const payload = buildAllocationPayload(item)
    await apiCall('POST', `/api/order-requests/admin/items/${item.id}/allocations`, payload)

    await refreshSelectedRequestState()
    showMessage(`${formatAllocationStatusLabel(payload.status)} allocation saved`, 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to create allocation', 'error')
  } finally {
    loading.value = false
  }
}

const startAllocationEdit = (allocation) => {
  hydrateAllocationUiState(allocation)
  allocation.editing = true
}

const cancelAllocationEdit = (allocation) => {
  allocation.editing = false
  allocation.edit_allocated_quantity = Number(allocation.allocated_quantity || 1)
  allocation.edit_allocation_type = allocation.allocation_type || 'exact'
  allocation.edit_status = allocation.status || 'confirmed'
  allocation.edit_substitute_name = allocation.substitute_name || ''
  allocation.edit_substitute_note = allocation.substitute_note || ''
}

const saveAllocation = async (item, allocation) => {
  const quantity = Number(allocation.edit_allocated_quantity || 0)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    showMessage('Allocation quantity must be greater than 0', 'error')
    return
  }

  if (allocation.edit_allocation_type === 'substitute' && !String(allocation.edit_substitute_name || '').trim()) {
    showMessage('Substitute name is required for substitute allocations', 'error')
    return
  }

  loading.value = true
  try {
    await apiCall('PUT', `/api/order-requests/admin/allocations/${allocation.id}`, {
      allocated_quantity: quantity,
      allocation_type: allocation.edit_allocation_type || 'exact',
      status: allocation.edit_status || 'confirmed',
      substitute_name: allocation.edit_allocation_type === 'substitute' ? String(allocation.edit_substitute_name || '').trim() : null,
      substitute_note: allocation.edit_allocation_type === 'substitute' ? String(allocation.edit_substitute_note || '').trim() : null,
    })

    await refreshSelectedRequestState()
    showMessage(`${formatAllocationStatusLabel(allocation.edit_status)} allocation updated for ${item.product_name}`, 'success')
  } catch (e) {
    showMessage('Failed to update allocation', 'error')
  } finally {
    loading.value = false
  }
}

const saveItemPrice = async (item) => {
  try {
    const res = await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      unit_price: item.edit_price,
      item_status: 'available'
    })
    const pricing = res.data || {}
    item.unit_price = item.edit_price
    if (pricing.markedUpPrice !== undefined && pricing.markedUpPrice !== null) {
      item.marked_up_price = pricing.markedUpPrice
    }
    if (item.marked_up_price !== undefined && item.marked_up_price !== null) {
      item.line_total = Number(item.marked_up_price) * Number(item.quantity || 0)
    }
    item.item_status = 'available'
    item.sourcing_status = 'allocated'
    item.editing = false
    showMessage('Item price updated', 'success')
  } catch (e) {
    showMessage('Failed to update item price', 'error')
  }
}

const markItemUnavailable = async (item) => {
  try {
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      item_status: 'not_available'
    })
    item.unit_price = null
    item.marked_up_price = null
    item.line_total = null
    item.item_status = 'not_available'
    item.sourcing_status = 'unavailable'
    item.editing = false
    showMessage('Item marked unavailable', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to mark item unavailable', 'error')
  }
}

// Helpers
const formatStatus = (status) => (status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
const formatCurrency = (value) => `GHS ${Number(value || 0).toFixed(2)}`
const formatSignedCurrency = (value) => {
  const amount = Number(value || 0)
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}GHS ${Math.abs(amount).toFixed(2)}`
}
const formatRatingStars = (rating) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)))
  return `${'★'.repeat(safeRating)}${'☆'.repeat(Math.max(5 - safeRating, 0))}`
}
const formatExcludedReason = (reason) => {
  const key = String(reason || '').toLowerCase()
  if (key === 'removed_by_customer') return 'Removed by customer'
  if (key === 'unavailable') return 'Unavailable'
  return 'Not included'
}
const formatDistance = (km) => `${Number(km || 0).toFixed(1)} km`
const normalizeItemStatus = (item) => {
  const rawStatus = item?.sourcing_status || item?.item_status || 'pending'
  const hasQuote = Number(item?.unit_price || 0) > 0 || Number(item?.marked_up_price || 0) > 0

  if (rawStatus === 'unavailable' || item?.item_status === 'not_available') return 'unavailable'
  if (hasQuote) return 'confirmed'
  return rawStatus
}
const isItemUnavailable = (item) => normalizeItemStatus(item) === 'unavailable'
const getLatestSubstituteAllocation = (item) => {
  if (!Array.isArray(item?.allocations)) return null

  const substituteAllocations = item.allocations
    .filter((allocation) => {
      const type = String(allocation?.allocation_type || '').toLowerCase()
      const status = String(allocation?.status || '').toLowerCase()
      return type === 'substitute' && ['proposed', 'confirmed'].includes(status)
    })
    .sort((a, b) => {
      const aTime = new Date(a?.updated_at || a?.created_at || 0).getTime()
      const bTime = new Date(b?.updated_at || b?.created_at || 0).getTime()
      return bTime - aTime
    })

  return substituteAllocations[0] || null
}
const getItemSubstituteDetails = (item) => {
  const allocation = getLatestSubstituteAllocation(item)
  if (allocation) {
    const name = String(allocation.substitute_name || '').trim() || String(item?.substitute_name || '').trim()
    if (!name) return null
    const price = allocation.unit_price === null || allocation.unit_price === undefined
      ? null
      : Number(allocation.unit_price)
    return {
      name,
      note: String(allocation.substitute_note || '').trim() || null,
      price: Number.isFinite(price) ? price : null
    }
  }

  const name = String(item?.substitute_name || '').trim()
  if (!name) return null
  const rawPrice = item?.allocation_unit_price
  const price = rawPrice === null || rawPrice === undefined || rawPrice === ''
    ? null
    : Number(rawPrice)

  return {
    name,
    note: String(item?.substitute_note || '').trim() || null,
    price: Number.isFinite(price) ? price : null
  }
}

const saveAlternativeForItem = async () => {
  const item = alternativeModal.value.item
  if (!item) return

  loading.value = true
  try {
    const payload = buildAllocationPayload(item, {
      allocation_type: 'substitute',
      allocation_pharmacy_id: alternativeModal.value.pharmacy_id,
      allocation_quantity: alternativeModal.value.allocated_quantity,
      substitute_name: alternativeModal.value.name,
      substitute_note: alternativeModal.value.note,
      allocation_unit_price: alternativeModal.value.price
    })

    await apiCall('POST', `/api/order-requests/admin/items/${item.id}/allocations`, payload)
    await refreshSelectedRequestState()
    closeAlternativeModal()
    showMessage('Alternative saved', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to save alternative', 'error')
  } finally {
    loading.value = false
  }
}
const formatItemStatus = (item) => normalizeItemStatus(item)
const itemStatusClass = (item) => normalizeItemStatus(item)
const formatQueueState = (state) => (state || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatAllocationTypeLabel = (value) => ({
  exact: 'Exact',
  substitute: 'Alternative'
}[value] || 'Exact')
const formatAllocationStatusLabel = (value) => ({
  proposed: 'Confirmed',
  confirmed: 'Confirmed',
  declined: 'Declined',
  expired: 'Expired'
}[value] || 'Confirmed')
const allocationStatusClass = (value) => ({
  confirmed: value === 'confirmed' || value === 'proposed',
  declined: value === 'declined',
  expired: value === 'expired'
})
const createAllocationLabel = (item) => item?.allocation_status === 'confirmed'
  ? 'Add Confirmed Allocation'
  : 'Add Confirmed Allocation'
const queueStateClass = (state) => ({
  success: ['full'].includes(state),
  current: ['awaiting_response', 'partial'].includes(state),
  muted: ['not_contacted', 'pending', 'unknown'].includes(state),
  danger: ['declined', 'timeout'].includes(state)
})
// Self-directed next-step guide
const allItemsHaveSource = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  if (!items.length) return false
  return items.every((item) => {
    const status = item.sourcing_status || item.item_status || ''
    if (['unavailable', 'not_available'].includes(status)) return true // marked unavailable counts as resolved
    return Boolean(item.allocation_pharmacy_id || item.source_pharmacy_id)
  })
})

const nextStepGuide = computed(() => {
  const req = selectedRequest.value
  if (!req) return null

  const status = String(req.status || '').toLowerCase()
  const completedStatuses = new Set(['delivered', 'picked_up', 'cancelled', 'returned'])

  if (completedStatuses.has(status)) {
    return {
      key: 'done',
      color: 'done',
      icon: CheckCircleIcon,
      heading: 'Order complete',
      message: 'This order has been fulfilled. You can close the workspace.',
      action: null
    }
  }

  if (status === 'out_for_delivery') {
    return {
      key: 'out_for_delivery',
      color: 'info',
      icon: TruckIcon,
      heading: "Step 6: Order is on its way!",
      message: 'The driver is heading to the customer. Update the status once delivered.',
      action: null
    }
  }

  if (status === 'ready_for_pickup') {
    return {
      key: 'ready_for_pickup',
      color: 'info',
      icon: SparklesIcon,
      heading: "Step 5: Ready for pickup",
      message: "The order is ready. Update the status once the customer picks it up.",
      action: null
    }
  }

  if (status === 'paid') {
    return {
      key: 'paid',
      color: 'success',
      icon: TruckIcon,
      heading: "Step 5: Payment received — arrange logistics",
      message: "The customer has paid. Assign a driver or mark as ready for pickup using the status dropdown below.",
      action: null
    }
  }

  if (status === 'confirmed_in_pharm') {
    return {
      key: 'confirmed_in_pharm',
      color: 'info',
      icon: ClockIcon,
      heading: "Step 4: Calculate totals & await payment",
      message: "Items are confirmed at the pharmacy. Click 'Calculate Totals' below so the customer can see the final price and pay.",
      action: 'calculate-totals'
    }
  }

  if (canTriggerActionNeeded.value) {
    return {
      key: 'action_needed',
      color: 'warning',
      icon: BoltIcon,
      heading: "Step 3: Let the customer decide",
      message: actionNeededSummaryText.value + " Send them a decision link so they can approve or adjust their order.",
      action: 'send-action-needed'
    }
  }

  if (status === 'confirming_with_pharm') {
    if (!allItemsHaveSource.value) {
      return {
        key: 'assign_sources',
        color: 'warning',
        icon: ClipboardDocumentListIcon,
        heading: "Step 2: Assign a source to each item",
        message: "Use the nearby pharmacies on the right — click 'Source from Here' to assign sources, or select manually per item.",
        action: null
      }
    }
    return {
      key: 'confirm_pharm',
      color: 'warning',
      icon: PhoneIcon,
      heading: "Step 2: Confirm with the pharmacy",
      message: "All items have a source. Contact the pharmacy via WhatsApp or call to confirm availability, then update the status below.",
      action: null
    }
  }

  // pending or no pharmacies loaded yet
  if (!nearbyPharmacies.value.length) {
    return {
      key: 'run_sourcing',
      color: 'info',
      icon: ArrowPathIcon,
      heading: "Step 1: Run sourcing",
      message: "Kick off sourcing to find nearby pharmacies that have these items in stock.",
      action: 'run-sourcing'
    }
  }

  return {
    key: 'sources_found',
    color: 'info',
    icon: ArrowPathIcon,
    heading: "Step 1: Review nearby sources",
    message: `Found ${nearbyPharmacies.value.length} nearby source${nearbyPharmacies.value.length !== 1 ? 's' : ''}. Review the sourcing panel on the right to assign items, then update the status to 'Confirming With Pharm'.`,
    action: null
  }
})

const isBannerDismissed = computed(() => {
  const key = nextStepGuide.value?.key
  return key ? dismissedStepKey.value === key : false
})

// Two-tier status transitions
const ALL_STATUS_LABELS = {
  confirming_with_pharm: 'Confirming With Pharm',
  confirmed_in_pharm: 'Confirmed In Pharm',
  paid: 'Paid',
  ready_for_pickup: 'Ready For Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out For Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned'
}

const STATUS_TRANSITIONS = {
  pending: {
    suggested: ['confirming_with_pharm'],
    advanced: ['cancelled']
  },
  confirming_with_pharm: {
    suggested: ['confirmed_in_pharm'],
    advanced: ['cancelled', 'pending']
  },
  confirmed_in_pharm: {
    suggested: ['paid', 'ready_for_pickup'],
    advanced: ['confirming_with_pharm', 'cancelled']
  },
  paid: {
    suggested: ['out_for_delivery', 'ready_for_pickup'],
    advanced: ['confirmed_in_pharm', 'cancelled']
  },
  ready_for_pickup: {
    suggested: ['picked_up'],
    advanced: ['out_for_delivery', 'cancelled', 'returned']
  },
  out_for_delivery: {
    suggested: ['delivered'],
    advanced: ['ready_for_pickup', 'cancelled', 'returned']
  },
  delivered: {
    suggested: [],
    advanced: ['returned', 'cancelled']
  },
  picked_up: {
    suggested: [],
    advanced: ['returned', 'cancelled']
  },
  cancelled: {
    suggested: ['pending'],
    advanced: ['returned']
  },
  returned: {
    suggested: [],
    advanced: ['cancelled']
  }
}

const suggestedStatuses = computed(() => {
  const status = String(selectedRequest.value?.status || '').toLowerCase()
  const transitions = STATUS_TRANSITIONS[status] || STATUS_TRANSITIONS['pending']
  return transitions.suggested.map((value) => ({ value, label: ALL_STATUS_LABELS[value] || value }))
})

const advancedStatuses = computed(() => {
  const status = String(selectedRequest.value?.status || '').toLowerCase()
  const transitions = STATUS_TRANSITIONS[status] || STATUS_TRANSITIONS['pending']
  return transitions.advanced.map((value) => ({ value, label: ALL_STATUS_LABELS[value] || value }))
})

const isAdvancedStatus = computed(() => {
  if (!selectedStatus.value) return false
  return advancedStatuses.value.some((s) => s.value === selectedStatus.value)
})

const handleBannerAction = () => {
  const action = nextStepGuide.value?.action
  if (action === 'run-sourcing') loadFulfillment({ silent: false, refreshLists: false })
  if (action === 'send-action-needed') requestCustomerDecision('action_needed')
  if (action === 'calculate-totals') calculateTotals()
}

const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 4000)
}

const pollRequestList = async () => {
  if (loading.value || selectedRequest.value) return
  if (typeof document !== 'undefined' && document.hidden) return

  await Promise.allSettled([
    fetchRequests({ silent: true }),
    fetchStats({ silent: true })
  ])
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && selectedRequest.value) {
    if (alternativeModal.value.open) {
      closeAlternativeModal()
    } else {
      selectedRequest.value = null
    }
  }
}

onMounted(() => {
  fetchRequests()
  fetchStats()
  requestPollTimer = window.setInterval(pollRequestList, REQUEST_POLL_MS)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (requestPollTimer) {
    clearInterval(requestPollTimer)
    requestPollTimer = null
  }
  window.removeEventListener('keydown', handleKeydown)
})

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'onlineorders',
})
</script>

<style scoped>
.order-requests-page {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  border-left: 4px solid #667eea;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.2rem 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #4F217A;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(79, 33, 122, 0.12);
  transform: translateY(-3px);
  border-color: #dfd3ea;
}

.stat-card:has(.stat-icon.pending),
.stat-card:has(.stat-icon.processing),
.stat-card:has(.stat-icon.completed),
.stat-card:has(.stat-icon.total) {
  border-left-color: transparent;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f4ecfb;
  color: #5e3a86;
  font-size: 1.5rem;
}

.stat-icon.pending {
  background: #f4ecfb;
  color: #5e3a86;
}

.stat-icon.processing {
  background: #f4ecfb;
  color: #5e3a86;
}

.stat-icon.completed {
  background: #f4ecfb;
  color: #5e3a86;
}

.stat-icon.total {
  background: #f4ecfb;
  color: #5e3a86;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
  color: #4F217A;
  line-height: 1;
  letter-spacing: -0.04em;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-label {
  font-size: 0.65rem;
  color: #5d4679;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 800;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.status-tabs-bar {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding-bottom: 0.15rem;
}

.status-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  border: 1px solid #dfd3ea;
  background: #f8f9fb;
  color: #5d4679;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-tab-pill:hover {
  transform: translateY(-1px);
  border-color: #d8b4fe;
  color: #4F217A;
  background: #f4ecfb;
}

.status-tab-pill.active {
  background: #f4ecfb;
  border-color: #d8b4fe;
  color: #4F217A;
  box-shadow: 0 6px 20px rgba(79, 33, 122, 0.15);
  font-weight: 800;
}

.status-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.42rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbeafe;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 800;
}

.status-tab-pill.active .status-tab-count {
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.search-group {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  min-width: 250px;
}

.search-input {
  flex: 1;
}

.filter-select {
  width: 200px;
}

.form-control {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control-sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
}

.prescription-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.prescription-preview {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.prescription-link {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.prescription-image {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  background: #f8fafc;
}

.prescription-open-btn {
  width: fit-content;
  text-decoration: none;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #4F217A;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 33, 122, 0.28);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #fff;
  color: #5d4679;
  border: 1px solid #dfd3ea;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
}

.btn-secondary:hover:not(:disabled) {
  background: #f4ecfb;
  border-color: #d8b4fe;
  color: #4F217A;
  box-shadow: 0 4px 12px rgba(79, 33, 122, 0.08);
  transform: translateY(-1px);
}

.btn-secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-icon-text {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-text:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.btn-icon-text.sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

.icon-md {
  width: 24px;
  height: 24px;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  font-size: 0.7rem;
  font-weight: 800;
  color: #5d4679;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 2px solid #e9edf4;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #374151;
  vertical-align: middle;
}

.table-row:nth-child(even) td {
  background: #fafafa;
}

.table-row:hover td {
  background: #faf5ff !important;
  cursor: pointer;
}

.table-row:hover {
  box-shadow: inset 0 0 12px rgba(79, 33, 122, 0.06);
}

.loading-cell,
.empty-cell,
.state-cell {
  text-align: center;
  padding: 1.5rem !important;
  color: #9ca3af;
}

.request-number {
  font-weight: 800;
  color: #4F217A;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.9rem;
  letter-spacing: -0.02em;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 500;
}

.customer-phone {
  font-size: 0.75rem;
  color: #9ca3af;
}

.date-cell {
  font-size: 0.8rem;
  color: #6b7280;
}

.text-muted {
  color: #9ca3af;
}

.action-btns {
  display: flex;
  gap: 0.25rem;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-badge.sm {
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
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
  background: #ecfeff;
  color: #155e75;
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

.status-badge.items_sourced {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.awaiting_customer {
  background: #fce7f3;
  color: #9d174d;
}

.status-badge.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.available {
  background: #dcfce7;
  color: #166534;
}

.status-badge.unavailable {
  background: #fee2e2;
  color: #991b1b;
}

.fulfillment-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.fulfillment-badge.delivery {
  background: #dbeafe;
  color: #1e40af;
}

.fulfillment-badge.pickup {
  background: #fef3c7;
  color: #92400e;
}

/* Workspace */
.modal-overlay {
  margin-top: 0;
}

.modal-content {
  background:
    linear-gradient(180deg, #f7faff 0%, #f8fafc 22%, #ffffff 100%);
  border-radius: 16px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
}

.modal-elevated {
  border: 1px solid #e2e8f0;
}

.modal-lg {
  max-width: 100%;
}

/* Header */
.modal-header {
  padding: 1rem 1.5rem;
  border-top: 4px solid #1e3a8a;
  border-bottom: 1px solid #e9edf4;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 30%),
    linear-gradient(90deg, #ffffff 0%, #f6f9ff 58%, #eef4ff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.modal-req-num {
  color: #2563eb;
}

.modal-title-wrap {
  min-width: 0;
}

.modal-subtitle {
  margin: 0.2rem 0 0;
  color: #6b7280;
  font-size: 0.8rem;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: grid;
  gap: 0.875rem;
}

/* Top strip replacing the banner */
.workspace-topstrip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe4ef;
  border-left: 4px solid #cbd5e1;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.workspace-topstrip-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.workspace-inline-status {
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #dbe4ee;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.workspace-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #d6e0f0;
  border-radius: 999px;
  font-size: 0.8rem;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
}

.ws-chip-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #64748b;
}

.workspace-stat-chip strong {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.8rem;
}

/* Workspace layout */
.workspace-shell {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  min-height: 32rem;
}

.workspace-main-card {
  width: 100%;
}

/* Sections */
.section-card {
  border: 1px solid #e9edf4;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-emphasis {
  border-left: 3px solid #cbd5e1;
  border-color: #e2e8f0;
  border-left-color: #cbd5e1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-head {
  margin-bottom: 0.85rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-card--items {
  border-left: 4px solid #cbd5e1;
}

.section-card--sourcing {
  border-left: 4px solid #cbd5e1;
}

.section-card--customer {
  border-left: 4px solid #cbd5e1;
}

.section-card--overview {
  border-left: 4px solid #cbd5e1;
}

.section-card--notes {
  border-left: 4px solid #cbd5e1;
}

.section-card--items .section-head,
.section-card--sourcing .section-head,
.section-card--customer .section-head,
.section-card--overview .section-head,
.section-card--notes .section-head {
  margin: -1.1rem -1.25rem 1rem;
  padding: 1rem 1.25rem 0.9rem;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  border-radius: 12px 12px 0 0;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.65);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-bottom-color: #dbe4ef;
}

.section-title {
  margin: 0;
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Footer */
.modal-footer {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid #e9edf4;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  background: linear-gradient(to right, #f8fafc, #ffffff);
  flex-wrap: wrap;
}

.footer-status-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.footer-status-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.footer-status-select {
  min-width: 210px;
  font-weight: 600;
  color: #374151;
  background: #ffffff;
}

.modal-footer .btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* Request Details Card */
.request-details-card .section-head {
  margin: -1.1rem -1.25rem 1rem;
}

.rd-body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: start;
}

.rd-customer {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1.1rem;
  background: linear-gradient(135deg, #eff0ff, #f0f9ff);
  border: 1px solid #dde3f8;
  border-radius: 12px;
  min-width: 220px;
}

.rd-customer-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.35);
}

.rd-customer-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.rd-customer-name {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rd-customer-phone {
  font-size: 0.8rem;
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
}

.rd-customer-phone.muted {
  color: #9ca3af;
}

.rd-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.6rem;
}

.rd-meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.8rem;
  background: #f8fafc;
  border: 1px solid #e9edf4;
  border-radius: 10px;
}

.rd-meta-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.rd-meta-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.rd-meta-value.fee {
  color: #15803d;
  font-size: 1.05rem;
}

.rd-meta-value.mono {
  font-family: monospace;
  color: #667eea;
  font-size: 0.9rem;
}

.rd-address {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 0.85rem;
  padding: 0.65rem 0.9rem;
  background: #f8fafc;
  border: 1px solid #e9edf4;
  border-radius: 10px;
  border-left: 3px solid #94a3b8;
}

.rd-address-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
}

.rd-address-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
}

.summary-chip--green {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.summary-chip--green strong {
  color: #15803d;
}

.summary-chip--amber {
  background: #ede9fe;
  border-color: #c4b5fd;
  color: #6d28d9;
}

.summary-chip--amber strong {
  color: #7c3aed;
}

.summary-chip--red {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #4338ca;
}

.summary-chip--red strong {
  color: #3730a3;
  font-size: 1.1em;
}

.missing-alert {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-left: 4px solid #8b5cf6;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #5b21b6;
  margin-bottom: 0.5rem;
}

.missing-alert-icon {
  font-size: 1rem;
  color: #7c3aed;
  flex-shrink: 0;
}

.allocation-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.summary-chip {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: background 0.12s;
}

.summary-chip strong {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.summary-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  font-weight: 700;
}

/* Fulfillment Plans sub-sections */
.fp-sub-head {
  margin-bottom: 0.6rem;
}

.fp-sub-label {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4f46e5;
  margin-bottom: 0.2rem;
}

.fp-sub-copy {
  margin: 0.15rem 0 0;
  font-size: 0.76rem;
  color: #6b7280;
  line-height: 1.45;
}

.fp-sub-block {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-top: 0.75rem;
}

/* Plan list */
.plan-list {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  margin-bottom: 0.5rem;
}

.plan-section {
  margin-bottom: 0.25rem;
}

.plan-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.9rem 0.95rem;
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.08), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.plan-card:hover {
  box-shadow: 0 18px 28px rgba(15, 23, 42, 0.08);
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.plan-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.plan-head-main {
  display: flex;
  gap: 0.55rem;
  min-width: 0;
  flex: 1;
}

.plan-rank-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 58px;
  border-radius: 16px;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
  color: #334155;
  border: 1px solid #bfdbfe;
  flex-shrink: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.plan-rank-label {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.plan-rank-circle strong {
  font-size: 1.05rem;
  font-weight: 800;
  color: #1d4ed8;
  line-height: 1;
}

.plan-identity {
  flex: 1;
  min-width: 0;
}

.plan-title-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.22rem;
}

.plan-title {
  margin: 0;
  font-size: 0.92rem;
  color: #0f172a;
  font-weight: 800;
}

.plan-summary-copy {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #475569;
}

.plan-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  margin-bottom: 0.75rem;
}

.plan-metric {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.3rem 0.56rem;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
  font-size: 0.7rem;
  font-weight: 700;
}

.plan-metric strong {
  color: #111827;
  font-weight: 800;
}

.plan-metric.primary {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.plan-metric.danger {
  background: #fff5f5;
  color: #9f1239;
  border-color: #fecdd3;
}

.plan-metric.warn {
  background: #fffbeb;
  color: #a16207;
  border-color: #fde68a;
}

.plan-metric.muted {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
}

.plan-pharmacies {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0;
}

.plan-pharmacy-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.5rem 0.65rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #e5e7eb;
}

.ppc-left,
.ppc-right {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.ppc-right {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ppc-source-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 66px;
  height: 24px;
  padding: 0 0.55rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #dbe4ee;
  font-size: 0.63rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ppc-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.ppc-meta {
  font-size: 0.69rem;
  color: #64748b;
  font-weight: 700;
}

.ppc-meta.subtle {
  color: #94a3b8;
}

.btn-use-plan {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.34rem 0.76rem;
  background: #1d4ed8;
  color: #ffffff;
  border: 1px solid #1d4ed8;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.btn-use-plan:hover:not(:disabled) {
  background: #1e40af;
  border-color: #1e40af;
}

.plan-pill.soft {
  background: #f8fafc;
  color: #475569;
  border-color: #dbe4ee;
}

@media (max-width: 720px) {
  .plan-head {
    flex-direction: column;
  }

  .btn-use-plan {
    width: 100%;
  }

  .plan-pharmacy-chip {
    flex-direction: column;
    align-items: flex-start;
  }

  .ppc-left,
  .ppc-right {
    width: 100%;
    justify-content: space-between;
  }
}

.btn-use-plan:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.plan-items {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.plan-item-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid #eef2f7;
  padding-top: 0.35rem;
  font-size: 0.82rem;
}

.plan-item-name {
  color: #111827;
  font-weight: 600;
  font-size: 0.84rem;
}

.item-price-cell {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.item-price-cell.accent {
  color: #16a34a;
}

.item-price-cell.muted {
  color: #374151;
  font-weight: 600;
}

.price-currency {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-right: 0.1rem;
}

.price-empty {
  color: #d1d5db;
  font-size: 0.85rem;
}

.item-row-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: #667eea;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
  letter-spacing: 0;
}

.item-product-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.item-product-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-photo-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.4rem;
}

.item-photo-link {
  display: inline-flex;
}

.item-photo-thumb {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #dbe4f0;
  background: #fff;
}

.item-name-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.item-product-edit {
  position: relative;
  min-width: 220px;
  max-width: 360px;
}

.items-intake-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  margin-bottom: 0.9rem;
}

.items-intake-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.items-intake-label {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.items-intake-copy {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

.items-intake-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px auto;
  gap: 0.75rem;
  align-items: start;
}

.items-intake-search {
  min-width: 0;
  max-width: none;
}

.items-intake-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-empty-state {
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  padding: 1rem 1.05rem;
  background: #f8fafc;
  margin-bottom: 0.9rem;
}

.items-empty-state strong {
  display: block;
  color: #0f172a;
  margin-bottom: 0.28rem;
}

.items-empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

.alternative-product-edit {
  min-width: 100%;
  max-width: none;
}

.item-product-input {
  width: 100%;
}

.item-product-edit-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.product-search-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  background: #ffffff;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.1);
  max-height: 220px;
  overflow-y: auto;
  z-index: 30;
}

.product-search-result {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.55rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  cursor: pointer;
}

.product-search-result:hover {
  background: #f8fafc;
}

.product-search-name {
  font-size: 0.81rem;
  font-weight: 600;
  color: #0f172a;
}

.product-search-meta {
  font-size: 0.72rem;
  color: #64748b;
}

.dropdown-empty {
  padding: 0.55rem 0.7rem;
  font-size: 0.74rem;
  color: #64748b;
}

.item-substitute {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.55rem;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.item-substitute-label {
  font-size: 0.66rem;
  font-weight: 700;
  color: #9a3412;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.item-substitute-name {
  font-size: 0.78rem;
  color: #7c2d12;
}

.item-substitute-note {
  font-size: 0.74rem;
  color: #92400e;
}

.item-substitute-price {
  font-size: 0.74rem;
  font-weight: 700;
  color: #b45309;
}

.workspace-nested-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
  z-index: 1200;
}

.workspace-nested-modal {
  width: min(940px, 100%);
  max-height: min(84vh, 760px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbeafe;
  border-radius: 22px;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.workspace-nested-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.3rem 1.4rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  flex-shrink: 0;
}

.workspace-nested-head h4 {
  margin: 0.2rem 0 0.25rem;
  font-size: 1.1rem;
  color: #0f172a;
}

.workspace-nested-head p {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

.workspace-nested-label {
  display: inline-flex;
  padding: 0.24rem 0.55rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.workspace-nested-content {
  display: grid;
  grid-template-columns: minmax(240px, 290px) minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem 1.4rem 0.45rem;
  min-height: 0;
  overflow: hidden;
}

.workspace-nested-body {
  padding: 0;
  overflow-y: auto;
  min-height: 0;
}

.alternative-context-card {
  margin: 0;
  padding: 0.85rem 0.95rem 0.9rem;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.98) 48%),
    #f8fbff;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  align-self: start;
}

.alternative-context-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.alternative-context-head strong {
  display: block;
  font-size: 0.92rem;
  color: #0f172a;
  margin-top: 0.14rem;
}

.alternative-context-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.alternative-context-qty {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.62rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #dbeafe;
  color: #1e3a8a;
  font-size: 0.74rem;
  font-weight: 800;
}

.alternative-compact-preview {
  display: grid;
  gap: 0.45rem;
}

.alternative-preview-line {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.52rem 0.65rem;
  border-radius: 12px;
  border: 1px solid #dbe4ee;
  background: rgba(255, 255, 255, 0.82);
}

.alternative-preview-line.replacement {
  border-color: #bfdbfe;
  background: linear-gradient(90deg, #ffffff 0%, #f8fbff 100%);
}

.alternative-compare-label {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.alternative-preview-text {
  min-width: 0;
  font-size: 0.8rem;
  color: #334155;
  font-weight: 600;
  line-height: 1.35;
}

.alternative-context-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.alternative-summary-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.62rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #dbeafe;
  color: #1e40af;
  font-size: 0.73rem;
  font-weight: 700;
}

.alternative-summary-chip.alt-existing {
  color: #0f766e;
  border-color: #99f6e4;
  background: #f0fdfa;
}

.nested-form-sections {
  display: none;
}

.nested-form-panel {
  display: none;
}

.nested-flat-form {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 0.85rem;
}

.nested-field-optional {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: none;
  letter-spacing: 0;
  margin-left: 0.3rem;
}

.nested-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.nested-field-grid.compact {
  grid-template-columns: 1.35fr 0.65fr;
}

.nested-field {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}

.nested-field-wide {
  grid-column: 1 / -1;
}

.nested-field label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
}

.workspace-nested-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.4rem 1.4rem;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.3) 0%, #ffffff 100%);
  flex-shrink: 0;
}

.alt-save-hint {
  flex: 1;
  margin: 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

.nested-actions-btns {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 760px) {
  .workspace-nested-content,
  .nested-form-sections,
    .nested-flat-form,
  .alternative-context-head,
  .nested-field-grid,
  .nested-field-grid.compact {
    grid-template-columns: 1fr;
    display: grid;
  }

  .alternative-context-head {
    display: flex;
    flex-direction: column;
  }

  .workspace-nested-overlay {
    align-items: flex-start;
    padding: 0.9rem;
  }

  .workspace-nested-modal {
    width: 100%;
    max-height: calc(100vh - 1.8rem);
    border-radius: 18px;
  }

  .workspace-nested-head,
  .workspace-nested-content,
  .workspace-nested-body,
  .workspace-nested-actions,
  .alternative-context-card {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .alternative-context-card {
    margin: 0;
  }

  .workspace-nested-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .alt-save-hint {
    width: 100%;
    order: -1;
  }

  .nested-actions-btns {
    flex-direction: row-reverse;
    width: 100%;
  }

  .nested-actions-btns .btn-secondary,
  .nested-actions-btns .btn-primary {
    flex: 1;
  }
}

.plan-item-qty {
  color: #4b5563;
  font-weight: 600;
}

.plan-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.plan-pill.current {
  background: #f8fafc;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.plan-pill.success {
  background: #dcfce7;
  color: #166534;
}

.plan-pill.warning {
  background: #ede9fe;
  color: #6d28d9;
}

.plan-pill.muted {
  background: #f3f4f6;
  color: #4b5563;
}

.plan-pill.danger {
  background: #eef2ff;
  color: #4338ca;
}

/* Customer Decision block */
.decision-block {
  background: #f5f3ff;
  border-color: #ddd6fe;
  border-left: 4px solid #8b5cf6;
}

.decision-head {
  margin-bottom: 0.65rem;
}

.decision-label {
  color: #6d28d9;
}

.decision-copy {
  color: #5b21b6;
}

/* Next recommended pharmacy banner */
.next-pharmacy-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}

.next-pharmacy-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #2563eb;
}

.next-pharmacy-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e3a8a;
}

.next-pharmacy-meta {
  font-size: 0.78rem;
  color: #3b82f6;
  font-weight: 500;
}

/* queue-block--action kept for any legacy usage */
.queue-block--action {
  background: #f5f3ff;
  border-color: #ddd6fe;
  border-left: 4px solid #8b5cf6;
}

.queue-block-head {
  margin-bottom: 0.65rem;
}

.queue-block-hint {
  font-size: 0.76rem;
  color: #5b21b6;
  margin: 0.15rem 0 0;
}

.queue-block--action .queue-title {
  color: #6d28d9;
}

.btn-decision {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  background: #ffffff;
  color: #6d28d9;
  border: 1px solid #c4b5fd;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.16s;
}

.btn-decision:hover:not(:disabled) {
  background: #ede9fe;
  border-color: #8b5cf6;
  color: #5b21b6;
}

.btn-decision:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.queue-block {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  background: #fafbfe;
}

.queue-title {
  margin: 0 0 0.35rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: #111827;
}

.queue-list {
  display: grid;
  gap: 0.45rem;
}

.decision-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.decision-state {
  margin: 0;
  color: #4b5563;
  font-size: 0.92rem;
  line-height: 1.5;
}

.decision-state--idle {
  color: #6b7280;
}

.queue-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: #ffffff;
}

.queue-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #111827;
}

.queue-meta {
  font-size: 0.74rem;
  color: #6b7280;
}

/* Allocation builder row */
.allocation-builder-row td {
  background: #f4f7ff;
  border-top: 1px dashed #c7d7fc;
  border-bottom: 3px solid #e2e8f0;
  padding: 0.65rem 0.9rem;
}

.alloc-builder-inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-alloc-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  background: linear-gradient(135deg, #4f46e5, #6d28d9);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.16s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-alloc-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.btn-alloc-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.allocation-empty-note {
  padding-top: 0.15rem;
}

.allocation-builder {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding: 0.4rem 0;
}

.allocation-control {
  min-width: 140px;
}

.allocation-mini {
  min-width: 92px;
}

.allocation-history {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.45rem;
}

.allocation-history-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.allocation-history-text {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 500;
}

.allocation-history-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.72rem;
  font-weight: 600;
}

.allocation-history-chip.confirmed {
  background: #dcfce7;
  color: #166534;
}

.allocation-history-chip.declined,
.allocation-history-chip.expired {
  background: #fee2e2;
  color: #991b1b;
}

/* Items Table */
.items-section {
  margin-bottom: 1.5rem;
}

.items-count-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
  background: #eef2ff;
  color: #4338ca;
  border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
}

.items-head-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.items-title-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
}

.items-head-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.45rem;
    justify-content: flex-start;
}

.items-decision-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
}

.items-head-meta {
    margin: 0;
    display: flex;
    gap: 0.75rem;
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 600;
}

.item-pricing-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
}

.notes-textarea {
  width: 100%;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
}

.items-section-note {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.items-section-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0 0.75rem 0;
}

.items-decision-state {
  margin: 0;
  font-size: 0.82rem;
  max-width: 300px;
  text-align: right;
}

.pricing-note {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.items-table-wrap {
  max-height: 540px;
  overflow: auto;
  border-radius: 8px;
}

.items-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  font-size: 0.68rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e9edf4;
}

.items-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.items-table tbody tr:nth-child(4n+1) td,
.items-table tbody tr:nth-child(4n+2) td {
  /* removed: caused uneven coloring between item groups */
}

.items-table td {
  padding: 0.6rem 0.75rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.84rem;
  vertical-align: middle;
}

/* Pharmacies */
.pharmacies-section {
  margin-bottom: 1.5rem;
}

.pharmacies-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #111827;
}

.pharmacy-cards {
  display: grid;
  gap: 0.75rem;
}

.pharmacy-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.pharmacy-info {
  display: flex;
  flex-direction: column;
}

.pharmacy-distance {
  font-size: 0.8rem;
  color: #6b7280;
}

.btn-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #25D366;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-whatsapp:hover {
  background: #1da855;
  transform: translateY(-1px);
}

/* Notes */
.notes-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.paid-breakdown-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-bottom: 0.9rem;
  color: #374151;
  font-size: 0.86rem;
}

.paid-breakdown-list {
  display: grid;
  gap: 0.55rem;
}

.paid-breakdown-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  background: #f9fafb;
}

.paid-breakdown-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
}

.paid-breakdown-item-meta {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.paid-breakdown-note {
  margin-top: 0.3rem;
  font-size: 0.78rem;
  color: #92400e;
}

.paid-breakdown-excluded {
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.paid-breakdown-excluded h5 {
  margin: 0 0 0.4rem 0;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #6b7280;
}

.paid-breakdown-excluded ul {
  margin: 0;
  padding-left: 1rem;
  color: #374151;
  font-size: 0.82rem;
}

.customer-feedback-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  background: #fafcff;
}

.customer-feedback-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  align-items: center;
  color: #374151;
  font-size: 0.85rem;
}

.customer-feedback-comment {
  margin: 0.75rem 0 0;
  color: #111827;
  line-height: 1.55;
}

.customer-feedback-comment.muted {
  color: #6b7280;
}

@media (max-width: 960px) {
  .plan-list {
    grid-template-columns: 1fr;
  }

  .rd-body {
    grid-template-columns: 1fr;
  }

  .rd-customer {
    min-width: unset;
  }
}

@media (max-width: 620px) {
  .status-tabs-bar {
    gap: 0.45rem;
  }

  .status-tab-pill {
    width: 100%;
    justify-content: space-between;
  }

  .search-group {
    width: 100%;
    min-width: 100%;
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .workspace-nested-overlay {
    padding: 0.9rem;
  }

  .nested-field-grid {
    grid-template-columns: 1fr;
  }

  .workspace-nested-actions {
    flex-direction: column-reverse;
  }

  .plan-head {
    flex-direction: column;
    align-items: stretch;
  }

  .plan-head-main {
    width: 100%;
  }

  .btn-use-plan {
    width: 100%;
  }

  .plan-pharmacy-chip {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.08rem;
  }

  .section-card--items .section-head {
    align-items: flex-start;
    gap: 0.8rem;
  }

  .items-head-actions {
    width: 100%;
    align-items: flex-start;
  }

  .items-decision-actions {
    width: 100%;
    align-items: flex-start;
  }

  .items-decision-state {
    max-width: none;
    text-align: left;
  }

  .workspace-topstrip {
    flex-direction: column;
    align-items: flex-start;
  }

  .items-intake-grid {
    grid-template-columns: 1fr;
  }

  .items-intake-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .rd-meta-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Toast */
.message-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  z-index: 2000;
  animation: slideUp 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-toast.message-error {
  background: #ef4444;
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

/* ────────────────────────────────────────────────────────
   Fulfillment Workspace — Split-Pane Drawer
──────────────────────────────────────────────────────── */

.fw-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
}

.fw-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 82vw;
  max-width: 1320px;
  height: 100vh;
  background: #f8f9fb;
  display: flex;
  flex-direction: column;
  z-index: 1001;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

/* Header */
.fw-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.fw-header-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
}
.fw-header-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.fw-req-num {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.fw-header-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.fw-meta-chip {
  font-size: 0.72rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  white-space: nowrap;
}
.fw-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.fw-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}
.fw-icon-btn:hover:not(:disabled) { background: #f3f4f6; }
.fw-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fw-close-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

/* Body */
.fw-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
}

/* Next Step Guide Banner */
.fw-next-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1.25rem;
  border-bottom: 1px solid transparent;
  flex-shrink: 0;
}

.fw-next-step--info {
  background: #eff6ff;
  border-bottom-color: #bfdbfe;
}

.fw-next-step--warning {
  background: #fffbeb;
  border-bottom-color: #fde68a;
}

.fw-next-step--success {
  background: #f0fdf4;
  border-bottom-color: #bbf7d0;
}

.fw-next-step--done {
  background: #f8f9fb;
  border-bottom-color: #e5e7eb;
}

.fw-ns-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.fw-ns-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.fw-ns-icon {
  width: 18px;
  height: 18px;
  color: #374151;
}

.fw-next-step--info .fw-ns-icon { color: #1d4ed8; }
.fw-next-step--warning .fw-ns-icon { color: #b45309; }
.fw-next-step--success .fw-ns-icon { color: #15803d; }

.fw-ns-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.fw-ns-heading {
  font-size: 0.825rem;
  font-weight: 800;
  color: #111827;
  white-space: nowrap;
}

.fw-ns-message {
  font-size: 0.775rem;
  color: #4b5563;
  line-height: 1.4;
}

.fw-ns-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.fw-ns-cta {
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: #4F217A;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.fw-ns-cta:hover:not(:disabled) {
  background: #3d1860;
  box-shadow: 0 4px 12px rgba(79, 33, 122, 0.25);
}

.fw-ns-cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.fw-next-step--warning .fw-ns-cta {
  background: #b45309;
}

.fw-next-step--warning .fw-ns-cta:hover:not(:disabled) {
  background: #92400e;
}

.fw-next-step--success .fw-ns-cta {
  background: #15803d;
}

.fw-ns-dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.fw-ns-dismiss:hover {
  background: rgba(0, 0, 0, 0.07);
  color: #374151;
}

/* The split-pane row sits beneath the banner */
.fw-split-pane {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Split pane container (sits below banner) */
.fw-split-pane {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Items pane (left) */
.fw-items {
  width: 55%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  border-right: 1px solid #e5e7eb;
  gap: 0.75rem;
}
.fw-pane-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-shrink: 0;
}
.fw-pane-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.fw-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #520094;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
}
.fw-pane-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.fw-avail-summary {
  font-size: 0.72rem;
  color: #6b7280;
}

/* Add item row */
.fw-add-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex-shrink: 0;
  position: relative;
}
.fw-add-item-field {
  position: relative;
  flex: 1;
  min-width: 0;
}
.fw-qty-input {
  width: 70px !important;
  flex-shrink: 0 !important;
}
.fw-price-input {
  width: 110px !important;
}
.fw-items-empty {
  padding: 1.5rem;
  background: #fff;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
}

/* Item cards */
.fw-item-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.fw-item-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  transition: border-color 0.15s;
}
.fw-item-card:hover { border-color: #d8b4fe; }
.fw-item-unavailable { border-color: #fee2e2; opacity: 0.8; }
.fw-ic-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.fw-ic-num {
  font-size: 0.72rem;
  font-weight: 700;
  color: #9ca3af;
  min-width: 16px;
  flex-shrink: 0;
}
.fw-ic-name-block {
  flex: 1;
  min-width: 0;
}
.fw-ic-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.fw-ic-qty {
  font-size: 0.78rem;
  color: #6b7280;
  flex-shrink: 0;
}
.fw-ic-pricing {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
}
.fw-ic-price-pair { display: flex; gap: 1.25rem; }
.fw-ic-price-field { display: flex; flex-direction: column; gap: 0.125rem; }
.fw-ic-price-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}
.fw-ic-price-val {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}
.fw-ic-price-val.accent { color: #520094; }
.fw-ic-price-empty { font-size: 0.85rem; color: #d1d5db; }
.fw-ic-inline-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4F217A;
  border: 1px solid #dfd3ea;
  background: #fff;
  border-radius: 999px;
  padding: 0.28rem 0.65rem;
  white-space: nowrap;
}
.fw-ic-inline-edit:hover:not(:disabled) {
  background: #f4ecfb;
}
.fw-ic-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  scrollbar-width: thin;
}
.fw-ic-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
  flex: 0 0 auto;
}
.fw-ic-action-btn:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
.fw-ic-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fw-ic-action-btn.danger { color: #dc2626; border-color: #fecaca; }
.fw-ic-action-btn.danger:hover:not(:disabled) { background: #fee2e2; }
.fw-ic-alloc-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  background: #f4ecfb;
  border: 1px solid #dfd3ea;
  border-radius: 8px;
  font-size: 0.85rem;
}
.fw-ic-source-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}
.fw-ic-source-label {
  font-size: 0.7rem;
  color: #5d4679;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.fw-ic-source-name {
  color: #4F217A;
  font-weight: 700;
}
.fw-ic-source-dist {
  font-size: 0.72rem;
  color: #9ca3af;
}
.fw-ic-source-qty {
  color: #6b21a8;
  font-size: 0.8rem;
  margin-left: auto;
}
.fw-ic-source-empty {
  width: 100%;
}
.fw-ic-source-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #d8b4fe;
  border-radius: 999px;
  background: #fff;
  color: #4F217A;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  transition: all 0.16s;
}
.fw-ic-source-cta:hover:not(:disabled) {
  border-color: #c084fc;
  background: #faf5ff;
}
.fw-ic-source-cta--empty {
  width: 100%;
  justify-content: center;
  color: #5b21b6;
  background: #fdf4ff;
}
.fw-ic-source-picker {
  position: relative;
}
.fw-ic-source-picker--full {
  width: 100%;
}
.fw-sourcing-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 240px;
  background: #fff;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(79, 33, 122, 0.13);
  z-index: 120;
  overflow: hidden;
}
.fw-sourcing-dropdown--full {
  left: 0;
  right: 0;
  min-width: unset;
}
.fw-sourcing-dropdown-empty {
  padding: 0.65rem 0.9rem;
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
}
.fw-sourcing-dropdown-option {
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.9rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid #f3e8ff;
  cursor: pointer;
  transition: background 0.13s;
}
.fw-sourcing-dropdown-option:last-child {
  border-bottom: none;
}
.fw-sourcing-dropdown-option:hover {
  background: #faf5ff;
}
.fw-sdo-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #4F217A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fw-sdo-meta {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.15rem;
}
.fw-sdo-dist {
  font-size: 0.72rem;
  color: #9ca3af;
}
.fw-sdo-qty {
  font-size: 0.72rem;
  color: #7c3aed;
  font-weight: 600;
}
.fw-sdo-price {
  font-size: 0.72rem;
  color: #059669;
  font-weight: 700;
  margin-left: auto;
}
.fw-ic-photos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.fw-ic-photos .item-photo-strip {
  margin-top: 0;
}
.fw-ic-photos .item-photo-strip--clamped {
  max-height: 54px;
  overflow: hidden;
}
.fw-ic-photos-toggle {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #4F217A;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
}
.fw-ic-photos-toggle:hover {
  text-decoration: underline;
}

/* Sourcing pane (right) */
.fw-sourcing {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  gap: 0.875rem;
}
.fw-sourcing-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  flex-shrink: 0;
}
.fw-sourcing-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.fw-sourcing-card-head h5 {
  font-size: 0.78rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Footer */
.fw-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.fw-footer-status {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  flex-wrap: wrap;
  flex: 1;
}
.fw-footer-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
  line-height: 32px;
}

/* Two-tier status picker */
.fw-status-picker {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.fw-status-suggested {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.fw-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid #dfd3ea;
  background: #f8f9fb;
  color: #374151;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
  line-height: 1.4;
}

.fw-status-pill:hover {
  border-color: #c4b5fd;
  background: #f4ecfb;
  color: #4F217A;
}

.fw-status-pill--selected {
  background: #4F217A;
  border-color: #4F217A;
  color: #fff;
  box-shadow: 0 3px 10px rgba(79, 33, 122, 0.25);
}

.fw-status-pill--selected:hover {
  background: #3d1860;
  border-color: #3d1860;
  color: #fff;
}

.fw-status-pill--more {
  color: #6b7280;
  border-style: dashed;
  border-color: #d1d5db;
  background: transparent;
}

.fw-status-pill--more:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
  color: #374151;
}

.fw-status-pill--more-open {
  border-style: solid;
  border-color: #9ca3af;
  background: #f3f4f6;
  color: #374151;
}

.fw-status-pill--more .icon-xs {
  transition: transform 0.18s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Advanced override section */
.fw-status-advanced {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.fw-status-advanced-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fw-status-advanced-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.fw-status-pill--override {
  border-color: #fcd34d;
  background: #fffdef;
  color: #92400e;
}

.fw-status-pill--override:hover {
  border-color: #f59e0b;
  background: #fef3c7;
  color: #78350f;
}

.fw-status-pill--override.fw-status-pill--selected {
  background: #b45309;
  border-color: #b45309;
  color: #fff;
  box-shadow: 0 3px 10px rgba(180, 83, 9, 0.25);
}

/* Footer update section */
.fw-footer-update {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  flex-shrink: 0;
}

.fw-override-warning {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #b45309;
}

.btn-override {
  background: #b45309 !important;
}

.btn-override:hover:not(:disabled) {
  background: #92400e !important;
  box-shadow: 0 8px 24px rgba(180, 83, 9, 0.28) !important;
}

/* Mobile */
@media (max-width: 768px) {
  .fw-drawer { width: 100vw; }
  .fw-body { overflow-y: auto; }
  .fw-split-pane { flex-direction: column; overflow-y: visible; }
  .fw-items { width: 100%; border-right: none; border-bottom: 1px solid #e5e7eb; overflow-y: visible; }
  .fw-sourcing { overflow-y: visible; }
  .fw-ic-pricing {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  .fw-ic-price-pair {
    justify-content: space-between;
    width: 100%;
  }
  .fw-ic-inline-edit {
    align-self: flex-start;
  }
  .fw-ic-actions {
    -webkit-overflow-scrolling: touch;
  }
  .fw-next-step { flex-direction: column; align-items: flex-start; }
  .fw-ns-actions { width: 100%; justify-content: flex-end; }
  .fw-footer { flex-direction: column; align-items: stretch; }
  .fw-footer-status { flex-direction: column; }
  .fw-footer-update { align-items: flex-start; }
}
</style>

