<template>
  <div class="order-requests-page">
    <!-- Header -->
    <div v-if="!selectedRequest" class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;">
      <div>
        <h1 class="page-title" style="font-size: 1.5rem; font-weight: 600; color: #111827; letter-spacing: -0.025em; margin: 0;">Order Requests</h1>
        <p class="page-subtitle" style="font-size: 0.875rem; color: #6b7280; margin: 0.25rem 0 0 0;">Manage customer order requests, process items, and coordinate fulfillment</p>
      </div>
      <div class="header-actions" style="display: flex; gap: 0.5rem;">
        <button @click="fetchStats" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.8rem; font-weight: 500; color: #374151;">
          <ChartBarIcon class="icon-sm" style="width: 1rem; height: 1rem;" />
          <span>Stats</span>
        </button>
        <button @click="fetchRequests" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.8rem; font-weight: 500; color: #374151;">
          <ArrowPathIcon class="icon-sm" :class="{ 'animate-spin': loading }" style="width: 1rem; height: 1rem;" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="!selectedRequest && stats" class="stats-bar" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e5e7eb; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); width: 100%;">
      <div class="stat-card" style="background: #fff; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;">
        <span style="font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></div> Pending
        </span>
        <strong style="font-size: 2rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums; line-height: 1;">{{ stats.pending || 0 }}</strong>
      </div>
      <div class="stat-card" style="background: #fff; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;">
        <span style="font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;"></div> In Progress
        </span>
        <strong style="font-size: 2rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums; line-height: 1;">{{ stats.processing || 0 }}</strong>
      </div>
      <div class="stat-card" style="background: #fff; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;">
        <span style="font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div> Fulfilled
        </span>
        <strong style="font-size: 2rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums; line-height: 1;">{{ stats.completed || 0 }}</strong>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;">
        <span style="font-size: 0.7rem; font-weight: 700; color: #6b21a8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.4rem;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #9333ea;"></div> Total Requests
        </span>
        <strong style="font-size: 2rem; font-weight: 600; color: #4c1d95; font-variant-numeric: tabular-nums; line-height: 1;">{{ stats.total || 0 }}</strong>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="!selectedRequest" class="filters-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; gap: 1rem;">
      <div class="status-tabs-bar" role="tablist" aria-label="Order request status filters" style="display: flex; flex-wrap: nowrap; align-items: center; gap: 0.4rem; padding: 0.35rem; padding-left: 0.8rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.02); overflow-x: auto; white-space: nowrap; max-width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.35rem; color: #6b7280; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 0.2rem; flex-shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filter by Status
        </div>
        <div style="width: 1px; height: 1.5rem; background: #e5e7eb; margin-right: 0.2rem; flex-shrink: 0;"></div>
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          class="status-tab-pill"
          :class="{ active: statusFilter === tab.value }"
          @click="setStatusFilter(tab.value)"
          :style="statusFilter === tab.value ? 'background: linear-gradient(135deg, #4F217A, #381659); box-shadow: 0 2px 6px rgba(79, 33, 122, 0.25); color: #fff; font-weight: 600; border: 1px solid transparent; flex-shrink: 0;' : 'color: #4b5563; font-weight: 500; background: #f9fafb; border: 1px solid #f3f4f6; flex-shrink: 0;'"
          style="display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1.1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;"
          onmouseover="if(this.className.indexOf('active') === -1) { this.style.background = '#f3f4f6'; this.style.color = '#111827'; this.style.borderColor = '#e5e7eb'; }"
          onmouseout="if(this.className.indexOf('active') === -1) { this.style.background = '#f9fafb'; this.style.color = '#4b5563'; this.style.borderColor = '#f3f4f6'; }"
        >
          <span>{{ tab.label }}</span>
          <span class="status-tab-count" style="display: inline-flex; align-items: center; justify-content: center; padding: 0 0.5rem; font-size: 0.65rem; font-weight: 700; border-radius: 999px; height: 1.25rem;" :style="statusFilter === tab.value ? 'background: rgba(255,255,255,0.2); color: #fff;' : 'background: #e5e7eb; color: #374151;'">{{ tab.count }}</span>
        </button>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center; flex: 1 1 auto; justify-content: flex-end; min-width: 300px;">
        <!-- Status Changer on the Far Right -->
        <div style="position: relative; display: flex; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding-left: 0.75rem; overflow: hidden; transition: all 0.2s ease;" onmouseover="this.style.borderColor='#d1d5db'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'">
          <div style="color: #6b7280; display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
             Change Status:
          </div>
          <select v-model="statusFilter" class="form-control" style="padding: 0.55rem 0.75rem; font-size: 0.85rem; font-weight: 600; border: none; background: transparent; color: #4F217A; cursor: pointer; outline: none; transition: all 0.2s ease; min-width: 160px; -webkit-appearance: none; appearance: none;">
            <option value="">-- Select Status --</option>
            <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
              {{ tab.label }}
            </option>
            <optgroup label="Other statuses">
              <option v-for="option in statusSelectorOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </optgroup>
          </select>
          <div style="position: absolute; right: 0.75rem; pointer-events: none; color: #4F217A; display: flex; align-items: center;">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        <!-- Search Group -->
        <div class="search-group" style="display: flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;" onmouseover="this.style.borderColor='#d1d5db'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'">
          <div style="padding-left: 0.75rem; color: #9ca3af; display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input v-model="searchQuery" type="text" class="form-control search-input"
            placeholder="Search records by ID, Name or phone..." @keyup.enter="fetchRequests" style="border: none; padding: 0.55rem 0.6rem; font-size: 0.85rem; min-width: 250px; outline: none; box-shadow: none; background: transparent; color: #374151;" />
          <button v-if="searchQuery" @click="searchQuery = ''; fetchRequests()" style="background: none; border: none; padding: 0.5rem; color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#9ca3af'" title="Clear search">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <button @click="fetchRequests" class="btn-primary btn-sm" style="padding: 0.55rem 1.2rem; font-size: 0.85rem; font-weight: 600; background: #f3f4f6; border: none; border-left: 1px solid #e5e7eb; color: #4b5563; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.3rem;" onmouseover="this.style.background='#e5e7eb'; this.style.color='#111827'" onmouseout="this.style.background='#f3f4f6'; this.style.color='#4b5563'">
            Search
          </button>
        </div>
        
        <!-- Refresh Button -->
        <button @click="fetchRequests" style="display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; width: 2.6rem; height: 2.6rem; color: #6b7280; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;" onmouseover="this.style.background='#f9fafb'; this.style.color='#111827'; this.style.transform='rotate(15deg)'" onmouseout="this.style.background='#fff'; this.style.color='#6b7280'; this.style.transform='rotate(0deg)'" title="Refresh records">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
      </div>
    </div>

    <!-- Requests Table -->
    <div v-if="!selectedRequest" class="table-container" style="border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow-x: auto; box-shadow: 0 1px 2px rgba(0,0,0,0.02)">
      <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; white-space: nowrap;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Request #</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Customer</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: center;">Items</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Status</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: right;">Fee</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Fulfillment</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Created</th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="loading-cell" style="padding: 3rem; text-align: center; color: #6b7280; font-size: 0.85rem;">Loading requests...</td>
          </tr>
          <tr v-else-if="filteredRequests.length === 0">
            <td colspan="8" class="empty-cell" style="padding: 3rem; text-align: center; color: #6b7280; font-size: 0.85rem;">No requests found</td>
          </tr>
          <tr
            v-for="req in filteredRequests"
            :key="req.id"
            class="table-row table-row-openable"
            :class="{ 'table-row-opening': openingRequestId === req.id }"
            tabindex="0"
            role="button"
            @click="handleProcessRequest(req)"
            @keydown.enter.prevent="handleProcessRequest(req)"
            @keydown.space.prevent="handleProcessRequest(req)"
            style="border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background-color 0.15s ease;"
            onmouseover="this.style.backgroundColor='#f9fafb'"
            onmouseout="this.style.backgroundColor='transparent'"
          >
            <td class="request-number" style="padding: 0.875rem 1.25rem; font-weight: 600; color: #111827; font-size: 0.85rem;">{{ req.request_number }}</td>
            <td style="padding: 0.875rem 1.25rem;">
              <div class="customer-info" style="display: flex; flex-direction: column; gap: 0.2rem;">
                <span class="customer-name" style="font-weight: 500; color: #111827; font-size: 0.85rem;">{{ req.customer_name || 'N/A' }}</span>
                <span v-if="getCustomerWhatsAppUrl(req.customer_phone)" class="customer-phone customer-phone--whatsapp">
                  <a
                    :href="getCustomerWhatsAppUrl(req.customer_phone)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="customer-phone-link"
                    @click.stop
                    style="color: #10b981; font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem;"
                  >
                    <i class="ri-whatsapp-line customer-whatsapp-icon" aria-hidden="true"></i>
                    <span>{{ req.customer_phone || '' }}</span>
                  </a>
                </span>
                <span v-else class="customer-phone" style="color: #6b7280; font-size: 0.75rem;">{{ req.customer_phone || '' }}</span>
              </div>
            </td>
            <td style="padding: 0.875rem 1.25rem; text-align: center;">
              <span class="item-count" style="display: inline-flex; align-items: center; justify-content: center; height: 1.5rem; min-width: 1.5rem; padding: 0 0.4rem; background: #f3f4f6; color: #374151; border-radius: 999px; font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums;">{{ formatRequestItemsLabel(req) }}</span>
            </td>
            <td style="padding: 0.875rem 1.25rem;">
              <span class="status-badge" :class="req.status" 
                :style="req.status === 'pending' ? 'background: #fffbeb; color: #d97706; border: 1px solid #fcd34d;' : req.status === 'processing' ? 'background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;' : req.status === 'completed' ? 'background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;' : req.status === 'composed' ? 'background: #f5f3ff; color: #9333ea; border: 1px solid #d8b4fe;' : 'background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;'"
                style="font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; white-space: nowrap; text-transform: uppercase;">{{ formatStatus(req.status) }}</span>
            </td>
            <td style="padding: 0.875rem 1.25rem; text-align: right; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">
              GHS {{ parseFloat(req.request_fee || 0).toFixed(2) }}
            </td>
            <td style="padding: 0.875rem 1.25rem;">
              <span v-if="req.fulfillment_type" class="fulfillment-badge" :class="req.fulfillment_type" 
                :style="req.fulfillment_type === 'delivery' ? 'background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4;' : req.fulfillment_type === 'pickup' ? 'background: #fefce8; color: #0f766e; border: 1px solid #fef08a;' : 'background: #fff; color: #6b7280; border: 1px solid #e5e7eb;'"
                style="font-size: 0.7rem; font-weight: 600; text-transform: capitalize; padding: 0.15rem 0.4rem; border-radius: 4px;">
                {{ req.fulfillment_type }}
              </span>
              <span v-else class="text-muted" style="color: #9ca3af;">-</span>
            </td>
            <td class="date-cell" style="padding: 0.875rem 1.25rem; color: #6b7280; font-size: 0.8rem;">{{ formatDateTime(req.created_at) }}</td>
            <td style="padding: 0.875rem 1.25rem; text-align: right;">
              <div class="action-btns" style="display: flex; justify-content: flex-end;">
                <button
                  type="button"
                  @click.stop="handleProcessRequest(req)"
                  class="btn-icon-text"
                  :disabled="openingRequestId === req.id"
                  :title="statusFilter === 'composed' ? 'Open composed summary' : 'Open request workspace'"
                  style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; border-radius: 6px; background: #faf5ff; border: 1px solid #e9d5ff; color: #6b21a8; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.15s;"
                  onmouseover="this.style.background='#f3e8ff'"
                  onmouseout="this.style.background='#faf5ff'"
                >
                  <template v-if="openingRequestId === req.id">
                    <span class="inline-loader-spinner" aria-hidden="true" style="border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; width: 12px; height: 12px; inline-block; animation: spin 1s linear infinite;"></span>
                    <span>Opening...</span>
                  </template>
                  <template v-else>
                    <EyeIcon class="icon-sm" style="width: 0.85rem; height: 0.85rem; color: #a855f7;" />
                    <span>Process</span>
                  </template>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Fulfillment Workspace -->
    <section v-if="selectedRequest" class="modal-overlay">
      <div class="modal-content modal-lg modal-elevated modal-content--workspace">
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-title-wrap">
              <div class="modal-title-row">
                <h3>Order Request <span class="modal-req-num">#{{ selectedRequest.request_number }}</span></h3>
                <span class="status-badge" :class="selectedRequest.status">{{ formatStatus(selectedRequest.status) }}</span>
              </div>
            </div>
          </div>
          <div class="modal-header-actions">
            <button @click="refreshSelectedRequestDetails()" class="btn-secondary btn-sm" :disabled="loading">
              <ArrowPathIcon class="icon-sm" :class="{ 'animate-spin': loading }" />
              <span>Refresh</span>
            </button>
            <button @click="selectedRequest = null" class="btn-secondary btn-sm" :disabled="loading">
              Back to Requests
            </button>
          </div>
        </div>
        <div class="modal-body" style="padding: 0; background: #f3f4f6; border-radius: 0 0 22px 22px; display: flex; flex-direction: column; gap: 0;">
          <template v-if="isPaidRequest">
            <section class="section-card section-card--customer workspace-main-card paid-request-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Paid Products</h4>
                  <p class="workspace-panel-subcopy">This request is paid, so only the captured products are shown.</p>
                </div>
                <span class="status-badge paid">Paid</span>
              </div>

              <div v-if="latestPaymentSnapshot" class="paid-breakdown-summary">
                <span><strong>Total Paid:</strong> {{ formatCurrency(latestPaymentSnapshot?.summary?.total_paid) }}</span>
                <span><strong>Items:</strong> {{ paidSnapshotItems.length }}</span>
                <span><strong>Sources:</strong> {{ latestPaymentSnapshot?.summary?.source_pharmacy_count || 0 }}</span>
                <span><strong>Paid At:</strong> {{ formatDateTime(latestPaymentSnapshot?.payment?.paid_at || latestPaymentSnapshot?.captured_at) }}</span>
              </div>

              <div v-if="paidSnapshotItems.length" class="paid-breakdown-list">
                <div v-for="entry in paidSnapshotItems" :key="`paid-${entry.item_id}`" class="paid-breakdown-item">
                  <div class="paid-breakdown-item-top">
                    <strong>{{ entry.product_name }}</strong>
                    <span>{{ formatCurrency(entry.line_total) }}</span>
                  </div>
                  <div class="paid-breakdown-item-meta">
                    Qty {{ entry.quantity }} | Unit {{ formatCurrency(entry.unit_price) }}
                    <template v-if="entry.distance_km !== null && entry.distance_km !== undefined">
                      | {{ Number(entry.distance_km).toFixed(1) }} km away
                    </template>
                  </div>
                  <div v-if="entry.substitute_applied && entry.original_product_name" class="paid-breakdown-note">
                    Substitute approved for: {{ entry.original_product_name }}
                  </div>
                </div>
              </div>

              <div v-else class="items-empty-state">
                <strong>No paid products found.</strong>
                <p>The payment snapshot is missing or incomplete for this request.</p>
              </div>

              <div v-if="paidSnapshotExcludedItems.length" class="paid-breakdown-excluded">
                <h5>Not Paid</h5>
                <ul>
                  <li v-for="entry in paidSnapshotExcludedItems" :key="`excluded-${entry.item_id}`">
                    {{ entry.product_name }} ({{ formatExcludedReason(entry.reason) }})
                  </li>
                </ul>
              </div>
            </section>
          </template>

          <template v-else>
          <section class="workspace-overview-card" style="margin: 0; border: none; border-bottom: 1px solid #e5e7eb; border-radius: 0; background: #fff; padding: 1.5rem; box-shadow: none;">
            <div class="workspace-overview-head">
              <div class="workspace-overview-headline">
                <span class="workspace-overview-label">Order Overview</span>
                <h4>Composition Workspace</h4>
              </div>
              <span class="workspace-overview-badge">Live Board</span>
            </div>
            <div class="workspace-overview-grid">
              <div class="workspace-overview-item">
                <span class="workspace-overview-key">Customer</span>
                <strong>{{ selectedRequest.customer_name || 'Unknown Customer' }}</strong>
              </div>
              <div class="workspace-overview-item">
                <span class="workspace-overview-key">Phone</span>
                <strong v-if="getCustomerWhatsAppUrl(selectedRequest.customer_phone)" class="workspace-overview-phone">
                  <a
                    :href="getCustomerWhatsAppUrl(selectedRequest.customer_phone)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="workspace-overview-phone-link"
                  >
                    <i class="ri-whatsapp-line workspace-whatsapp-icon" aria-hidden="true"></i>
                    <span>{{ selectedRequest.customer_phone || '-' }}</span>
                  </a>
                </strong>
                <strong v-else>{{ selectedRequest.customer_phone || '-' }}</strong>
              </div>
              <div class="workspace-overview-item">
                <span class="workspace-overview-key">Mode</span>
                <strong>{{ selectedRequest.fulfillment_type || '-' }}</strong>
              </div>
              <div class="workspace-overview-item">
                <span class="workspace-overview-key">Hold</span>
                <strong>GHS {{ parseFloat(selectedRequest.request_fee || 0).toFixed(2) }}</strong>
              </div>
              <div class="workspace-overview-item">
                <span class="workspace-overview-key">Items</span>
                <strong>{{ getCustomerRequestItemCount(selectedRequest) }}</strong>
              </div>
              <div class="workspace-overview-item">
                <span class="workspace-overview-key">Opened</span>
                <strong>{{ formatDateTime(selectedRequest.created_at) }}</strong>
              </div>
            </div>
          </section>

          <div class="workspace-shell" style="flex: 1; border-radius: 0; display: flex; flex-direction: column; padding: 0.5rem; background: #f3f4f6; gap: 0.5rem;">
          <section v-if="latestPaymentSnapshot" class="section-card section-card--customer workspace-main-card">
            <div class="section-head">
              <h4 class="section-title">Paid Breakdown</h4>
              <span class="status-badge paid">Wallet Paid</span>
            </div>
            <div class="paid-breakdown-summary">
              <span><strong>Total Paid:</strong> {{ formatCurrency(latestPaymentSnapshot?.summary?.total_paid) }}</span>
              <span><strong>Items:</strong> {{ paidSnapshotItems.length }}</span>
              <span><strong>Sources:</strong> {{ latestPaymentSnapshot?.summary?.source_pharmacy_count || 0 }}</span>
              <span><strong>Paid At:</strong> {{ formatDateTime(latestPaymentSnapshot?.payment?.paid_at || latestPaymentSnapshot?.captured_at) }}</span>
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
                    | {{ Number(entry.distance_km).toFixed(1) }} km away
                  </template>
                </div>
                <div v-if="entry.substitute_applied && entry.original_product_name" class="paid-breakdown-note">
                  Substitute approved for: {{ entry.original_product_name }}
                </div>
              </div>
            </div>

            <div v-if="paidSnapshotExcludedItems.length" class="paid-breakdown-excluded">
              <h5>Not Paid</h5>
              <ul>
                <li v-for="entry in paidSnapshotExcludedItems" :key="`excluded-${entry.item_id}`">
                  {{ entry.product_name }} ({{ formatExcludedReason(entry.reason) }})
                </li>
              </ul>
            </div>
          </section>

          <section v-if="selectedRequest.feedback" class="section-card section-card--customer workspace-main-card">
            <div class="section-head">
              <h4 class="section-title">Customer Feedback</h4>
              <span class="status-badge delivered">Submitted</span>
            </div>
            <div class="customer-feedback-card">
              <div class="customer-feedback-summary">
                <strong>{{ formatRatingStars(selectedRequest.feedback.rating) }}</strong>
                <span>{{ selectedRequest.feedback.rating }}/5</span>
                <span v-if="selectedRequest.feedback.created_at">{{ formatDateTime(selectedRequest.feedback.created_at) }}</span>
              </div>
              <p v-if="selectedRequest.feedback.comment" class="customer-feedback-comment">
                {{ selectedRequest.feedback.comment }}
              </p>
              <p v-else class="customer-feedback-comment muted">
                Customer left a rating without a written note.
              </p>
            </div>
          </section>

          <!-- Items -->
            <section class="items-section workspace-main-card section-emphasis">
              <div class="section-head" style="border-bottom: 2px solid #e5e7eb; padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
                <div class="items-head-copy">
                  <div class="items-title-row">
                    <h4 class="section-title text-[#4F217A]">Workspace Board</h4>
                    <span class="items-count-badge">{{ getCustomerRequestItemCount(selectedRequest) }} item{{ getCustomerRequestItemCount(selectedRequest) !== 1 ? 's' : '' }}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col xl:flex-row gap-4 mb-6">
                <!-- Left: Quick Add -->
                <div v-if="showTopQuickAdd" class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm w-full xl:max-w-[400px] flex-none z-20">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-[#4F217A]"></div>
                      <span class="text-xs font-bold text-gray-900 uppercase tracking-widest">Quick Add Line</span>
                    </div>
                    <span class="text-[10px] font-semibold text-gray-400 truncate ml-2">{{ itemsIntakeSummary }}</span>
                  </div>
                    
                  <div class="flex flex-col gap-2.5">
                    <div class="relative">
                      <input
                        v-model="adminNewItem.product_search"
                        type="text"
                        class="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 transition-all font-bold"
                        placeholder="Search to add item..."
                        @input="onAdminProductInput(adminNewItem)"
                        @focus="adminNewItem.showProductDropdown = true"
                        @blur="closeAdminProductDropdown(adminNewItem)"
                        @keyup.enter.prevent="saveAdminNewItem"
                      />
                      <div class="absolute right-3 top-[9px] text-gray-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                      </div>
                      <div
                        v-if="adminNewItem.showProductDropdown"
                        class="absolute z-50 top-[calc(100%+0.5rem)] left-0 w-[500px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto"
                      >
                        <div v-if="adminNewItem.product_search_loading" class="p-4 text-sm text-gray-500 text-center font-medium">
                          Searching...
                        </div>
                        <template v-else>
                          <div
                            v-if="adminNewItem.productSearchResults.length > 0"
                            class="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky top-0"
                          >
                            <span>Product / Pharmacy</span>
                            <span class="text-right">Stock</span>
                            <span class="text-right">Price</span>
                          </div>
                          <button
                            v-for="(result, resultIndex) in adminNewItem.productSearchResults"
                            :key="`admin-new-item-result-${resultIndex}`"
                            type="button"
                            class="w-full text-left grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-[#4F217A]/5 border-b last:border-0 border-gray-100 transition-colors cursor-pointer"
                            @mousedown.prevent="selectAdminProduct(adminNewItem, result)"
                          >
                            <div class="flex flex-col overflow-hidden pr-2">
                              <span class="text-sm font-bold text-gray-900 truncate">{{ getProductSearchLabel(result) }}</span>
                              <span class="text-xs font-semibold text-gray-500 truncate flex items-center gap-1.5">
                                {{ String(result?.company_name || '-').trim() || '-' }}
                                <span class="text-[10px] text-gray-400">• {{ Number.isFinite(Number(result.distance_km)) ? formatDistance(result.distance_km) : '-' }}</span>
                              </span>
                            </div>
                            <span class="text-xs font-bold text-right" :class="Number(result.available_quantity) > 0 ? 'text-emerald-600' : 'text-gray-400'">{{ Number(result.available_quantity || 0) > 0 ? `${Number(result.available_quantity)} left` : '-' }}</span>
                            <span class="text-sm font-black text-gray-900 text-right">{{ Number(result.price || 0) > 0 ? `GHS ${Number(result.price).toFixed(2)}` : '-' }}</span>
                          </button>
                          <div
                            v-if="adminNewItem.productSearchResults.length === 0 && String(adminNewItem.product_search || '').trim().length >= 2"
                            class="p-4 text-sm text-gray-500 text-center font-medium"
                          >
                            No matching products. You can still add the typed item.
                          </div>
                        </template>
                      </div>
                      <div
                        v-if="adminNewItem.selected_source_summary"
                        class="mt-2 flex items-center flex-wrap gap-2 px-3 py-2 bg-purple-50 border border-[#4F217A]/20 rounded-xl text-xs"
                      >
                        <div class="flex flex-col min-w-0 flex-1">
                          <span class="font-bold text-[#4F217A] truncate">
                            {{ adminNewItem.selected_source_summary.name }}
                          </span>
                          <span v-if="adminNewItem.selected_source_summary.distance" class="text-purple-600 font-semibold text-[10px]">
                            {{ adminNewItem.selected_source_summary.distance }} away
                          </span>
                        </div>
                        <span v-if="adminNewItem.selected_source_summary.price" class="px-2 py-1 bg-white rounded-lg font-black text-gray-900 shadow-sm">
                          GHS {{ adminNewItem.selected_source_summary.price }}
                        </span>
                        <button
                          type="button"
                          class="ml-1 text-purple-400 hover:text-[#4F217A] transition-colors p-1 bg-white rounded-md shadow-sm border border-purple-100"
                          @click="clearAdminSelectedProduct"
                          :disabled="loading"
                          title="Clear selection"
                        >
                          <XMarkIcon class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <select
                        v-model="adminNewItem.requested_unit"
                        class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 transition-all cursor-pointer"
                        style="height: 32px;"
                      >
                        <option value="">Unit...</option>
                        <option v-for="option in medicineUnitOptions" :key="`admin-unit-${option}`" :value="option">
                          {{ option }}
                        </option>
                      </select>

                      <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-[32px] shrink-0">
                        <button
                          type="button"
                          class="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors disabled:opacity-50"
                          @click="decrementAdminNewItemQty"
                          :disabled="Number(adminNewItem.quantity || 1) <= 1"
                        >
                          -
                        </button>
                        <input
                          v-model.number="adminNewItem.quantity"
                          type="number"
                          min="1"
                          step="1"
                          class="w-8 h-full text-center text-[11px] font-black text-gray-900 border-x border-gray-200 bg-white focus:outline-none appearance-none m-0 p-0"
                          placeholder="1"
                          @keyup.enter.prevent="saveAdminNewItem"
                        />
                        <button
                          type="button"
                          class="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors"
                          @click="incrementAdminNewItemQty"
                        >
                          +
                        </button>
                      </div>

                      <button
                        @click="saveAdminNewItem"
                        class="px-4 py-0 bg-[#4F217A] bg-opacity-10 text-[#4F217A] rounded-xl text-[11px] font-black transition-all hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 h-[32px] flex items-center justify-center"
                        :disabled="loading || !canAddAdminItem"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Right: Admin Notes & Composition Queue -->
                <div class="flex flex-col sm:flex-row gap-4 w-full flex-1 min-w-0 z-10">
                  <!-- Notes -->
                  <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>Admin Notes</span>
                      <button @click="saveNotes" class="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-bold transition-colors" :disabled="loading">Save</button>
                    </div>
                    <textarea v-model="adminNotes" class="w-full text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 resize-none flex-1 min-h-[60px]" placeholder="Internal notes for this request..."></textarea>
                  </div>

                  <!-- Queue -->
                  <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex-[1.2] flex flex-col justify-between min-w-[280px]">
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <span class="text-[10px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Composition Queue</span>
                        <button @click="markRequestComposed" class="text-[10px] bg-[#4F217A] hover:bg-[#381659] text-white px-2.5 py-1 rounded-md font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!canMarkRequestComposed">
                          Mark Composed
                        </button>
                      </div>
                      <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold whitespace-nowrap">Total: {{ composedCoverageSummary.total }}</span>
                        <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold whitespace-nowrap">Composed: {{ composedCoverageSummary.covered }}</span>
                        <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold whitespace-nowrap">Pending: {{ composedCoverageSummary.uncovered }}</span>
                      </div>
                      <p class="text-[10px] text-gray-400 mb-2 truncate leading-tight" :title="composedStatusHint">{{ composedStatusHint }}</p>
                    </div>
                    
                    <div class="flex items-center gap-2 pt-2.5 border-t border-gray-100 mt-auto">
                      <span class="status-badge sm shrink-0" :class="selectedRequest.status">{{ formatStatus(selectedRequest.status) }}</span>
                      <select v-model="selectedStatus" class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300">
                        <option value="">Change status...</option>
                        <option value="composed">Composed</option>
                        <option value="confirming_with_pharm">Confirming With Pharm</option>
                        <option value="confirmed_in_pharm">Confirmed In Pharm</option>
                        <option value="paid">Paid</option>
                        <option value="ready_for_pickup">Ready For Pickup</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="out_for_delivery">Out For Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="returned">Returned</option>
                      </select>
                      <button @click="updateStatus" class="shrink-0 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm px-2.5 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50" :disabled="!selectedStatus || loading">
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!requestItems.length && !prescriptionAttachmentUrls.length" class="items-empty-state">
                <strong>No items added yet.</strong>
                <p>
                  {{ hasPrescriptionAttachments
                    ? 'Add the interpreted items here so the team can begin composing the request.'
                    : 'Add the first item here to begin composing this request.' }}
                </p>
              </div>
              <div v-else class="workspace-board-grid">
                  <aside class="request-items-pane request-items-pane--board">
                    <section v-if="prescriptionAttachmentUrls.length" class="prescription-reference-card">
                      <div class="request-items-pane-head prescription-reference-head">
                        <div>
                          <h5>Prescription</h5>
                          <p>Pick an image, search the medicine, then save the pharmacy choice on the right.</p>
                        </div>
                        <span class="request-items-pane-count">{{ prescriptionAttachmentUrls.length }}</span>
                      </div>

                      <div class="prescription-reference-list">
                        <div
                          v-for="(imageUrl, index) in prescriptionAttachmentUrls"
                          :key="`${selectedRequest.id}-prescription-inline-${index}`"
                          role="button"
                          tabindex="0"
                          class="prescription-reference-item request-item-row"
                          :class="{ active: activePrescriptionImageIndex === index }"
                          @click="selectPrescriptionImage(index)"
                          @keydown.enter.prevent="selectPrescriptionImage(index)"
                          @keydown.space.prevent="selectPrescriptionImage(index)"
                        >
                          <span class="request-item-row-index">{{ index + 1 }}</span>
                          <img
                            :src="imageUrl"
                            :alt="`Attached prescription ${index + 1}`"
                            class="prescription-reference-image"
                          />
                          <div class="prescription-reference-copy">
                            <strong>Image {{ index + 1 }}</strong>
                            <span>{{ activePrescriptionImageIndex === index ? 'Active reference' : 'Use as reference' }}</span>
                          </div>
                          <button
                            type="button"
                            class="prescription-reference-open"
                            @click.stop="openPrescriptionPreview(imageUrl, index)"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </section>

                    <template v-if="!hasPrescriptionAttachments">
                      <div class="request-items-pane-head">
                        <div>
                          <h5>Request Items</h5>
                        </div>
                        <div class="request-items-pane-actions">
                          <span class="request-items-pane-count">{{ requestItems.length }}</span>
                        </div>
                      </div>
                      <div v-if="requestItems.length" class="request-items-list request-items-list--workspace">
                        <div
                          v-for="(item, index) in requestItems"
                          :key="item.id"
                          role="button"
                          tabindex="0"
                          class="request-item-row request-item-row--deletable"
                          :class="{ active: activeRequestItem?.id === item.id }"
                          @click="selectRequestItem(item)"
                          @keydown.enter.prevent="selectRequestItem(item)"
                          @keydown.space.prevent="selectRequestItem(item)"
                        >
                          <span class="request-item-row-index">{{ index + 1 }}</span>
                          <div class="request-item-row-main">
                            <strong>{{ item.product_name }}</strong>
                            <div class="request-item-row-meta">
                              <span>Qty {{ getRequestedQuantity(item) }}</span>
                              <span v-if="item.requested_unit">{{ item.requested_unit }}</span>
                              <span class="status-badge sm" :class="itemStatusClass(item)">
                                {{ formatItemStatus(item) }}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            class="selection-preview-close request-item-row-clear"
                            @click.stop="deleteRequestItem(item)"
                            :disabled="loading"
                            title="Delete request item"
                            aria-label="Delete request item"
                          >
                            <XMarkIcon class="icon-xs" />
                          </button>
                        </div>
                      </div>
                      <div v-else class="request-items-empty-list">
                        No request items yet. Use the quick add bar above to create the first request line.
                      </div>
                    </template>
                  </aside>

                  <template v-if="hasPrescriptionAttachments">
                    <section class="workspace-search-card">
                      <div class="workspace-panel-head">
                        <div>
                          <h5>Pharmacy Search</h5>
                          <p class="workspace-panel-subcopy">
                            Searching from prescription image {{ activePrescriptionImageIndex + 1 }}.
                          </p>
                        </div>
                      </div>

                      <div class="simple-search-block">
                        <label class="simple-field-label">Search pharmacy inventory</label>
                        <input
                          v-model="adminNewItem.product_search"
                          type="text"
                          class="form-control composer-search-input"
                          :placeholder="`Search item from image ${activePrescriptionImageIndex + 1}`"
                          @input="onAdminProductInput(adminNewItem)"
                        />
                      </div>

                      <div v-if="adminNewItem.product_search_loading || String(adminNewItem.product_search || '').trim().length >= 2" class="simple-search-results">
                        <div class="simple-search-results-head">
                          <span>Choice</span>
                          <span>Product</span>
                          <span>Pharmacy</span>
                          <span>Distance</span>
                          <span>Stock</span>
                          <span>Price</span>
                        </div>
                        <div v-if="adminNewItem.product_search_loading" class="dropdown-empty">
                          Searching...
                        </div>
                        <template v-else>
                          <button
                            v-for="(result, resultIndex) in adminNewItem.productSearchResults"
                            :key="`prescription-image-${activePrescriptionImageIndex}-result-${resultIndex}`"
                            type="button"
                            class="simple-search-result-row"
                            @click="selectAdminProduct(adminNewItem, result)"
                          >
                            <span class="search-choice-index">{{ resultIndex + 1 }}</span>
                            <span>{{ getProductSearchLabel(result) }}</span>
                            <span>{{ result.company_name || '-' }}</span>
                            <span>{{ Number.isFinite(Number(result.distance_km)) ? formatDistance(result.distance_km) : '-' }}</span>
                            <span>{{ Number(result.available_quantity || 0) > 0 ? Number(result.available_quantity) : '-' }}</span>
                            <span>{{ Number(result.price || 0) > 0 ? `GHS ${Number(result.price).toFixed(2)}` : '-' }}</span>
                          </button>
                          <div v-if="adminNewItem.productSearchResults.length === 0" class="dropdown-empty workspace-search-empty">
                            No nearby matches found.
                          </div>
                        </template>
                      </div>
                      <div v-else class="workspace-search-placeholder">
                        Select the prescription image on the left, then search for the medicine here.
                      </div>
                    </section>

                    <section class="workspace-selection-card workspace-selection-card--prescription">
                      <div class="simple-composer-head">
                        <div>
                          <span class="pane-eyebrow">Admin selections</span>
                          <h5>Image {{ activePrescriptionImageIndex + 1 }} choices</h5>
                        </div>
                      </div>

                      <section class="saved-selection-list-shell">
                        <div class="saved-selection-list-head">
                          <div>
                            <span class="pane-eyebrow">Saved Selections</span>
                            <p>Linked pharmacy products for this prescription request.</p>
                          </div>
                          <span class="request-items-pane-count">{{ persistedSelectionItems.length }}</span>
                        </div>

                        <div v-if="persistedSelectionItems.length" class="saved-selection-list">
                          <div
                            v-for="(item, savedIndex) in persistedSelectionItems"
                            :key="`prescription-saved-selection-${item.id}`"
                            class="request-item-row saved-selection-row request-item-row--deletable"
                          >
                            <span class="request-item-row-index">{{ savedIndex + 1 }}</span>
                            <div class="request-item-row-main">
                              <strong>{{ getPersistedItemSourceSummary(item)?.productName || 'Saved pharmacy product' }}</strong>
                              <div class="request-item-row-meta">
                                <span>{{ getPersistedItemSourceSummary(item)?.name || 'Selected pharmacy' }}</span>
                                <span>Qty {{ getRequestedQuantity(item) }}</span>
                                <span v-if="item.requested_unit">{{ item.requested_unit }}</span>
                                <span v-if="getPersistedItemSourceSummary(item)?.distance">{{ getPersistedItemSourceSummary(item).distance }}</span>
                                <span
                                  v-if="getPersistedItemSourceSummary(item)?.price"
                                  class="selection-preview-chip selection-preview-chip--price"
                                >
                                  GHS {{ getPersistedItemSourceSummary(item).price }}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              class="selection-preview-close saved-selection-row-clear"
                              @click.stop="clearSavedSelection(item)"
                              :disabled="loading"
                              title="Clear saved selection"
                              aria-label="Clear saved selection"
                            >
                              <XMarkIcon class="icon-xs" />
                            </button>
                          </div>
                        </div>

                        <div v-else class="saved-selection-empty">
                          No saved pharmacy selections yet. Search from the active prescription image, pick the best pharmacy option, then save it here.
                        </div>

                        <div v-if="persistedSelectionItems.length" class="saved-selection-total">
                          <span>Total of listed items</span>
                          <strong>{{ formatCurrency(savedSelectionsTotal) }}</strong>
                        </div>
                      </section>

                      <div v-if="adminNewItem.selected_source_summary" class="selection-compare-grid">
                        <article class="selection-compare-card selection-compare-card--draft">
                          <div class="selection-card-topline">
                            <span class="selection-card-label">Choice to save</span>
                            <div class="selection-card-topline-actions">
                              <span class="selection-link-badge selection-link-badge--draft">Pending</span>
                              <button
                                type="button"
                                class="selection-preview-close"
                                @click="clearAdminSelectedProduct"
                                :disabled="loading"
                                title="Clear selected product"
                                aria-label="Clear selected product"
                              >
                                <XMarkIcon class="icon-xs" />
                              </button>
                            </div>
                          </div>
                          <div class="selection-card-product-line">
                            <strong>{{ adminNewItem.selected_source_summary.productName || 'Pending pharmacy product' }}</strong>
                            <span class="selection-card-pharmacy">{{ adminNewItem.selected_source_summary.name || 'Selected pharmacy' }}</span>
                          </div>
                          <div class="selection-preview-chip-row">
                            <span class="selection-preview-chip">Image {{ activePrescriptionImageIndex + 1 }}</span>
                            <span v-if="adminNewItem.selected_source_summary.distance" class="selection-preview-chip">
                              {{ adminNewItem.selected_source_summary.distance }}
                            </span>
                          </div>
                          <div class="selection-card-inline-editor">
                            <div class="selection-mini-grid selection-mini-grid--compact">
                              <label class="selection-mini-field">
                                <span>Unit</span>
                                <select
                                  v-model="adminNewItem.requested_unit"
                                  class="form-control selection-mini-input"
                                >
                                  <option value="">Unit</option>
                                  <option v-for="option in medicineUnitOptions" :key="`prescription-unit-${option}`" :value="option">
                                    {{ option }}
                                  </option>
                                </select>
                              </label>
                              <label class="selection-mini-field">
                                <span>Qty</span>
                                <div class="items-qty-stepper items-qty-stepper--tight">
                                  <button
                                    type="button"
                                    class="items-qty-btn"
                                    @click="decrementAdminNewItemQty"
                                    :disabled="Number(adminNewItem.quantity || 1) <= 1"
                                  >
                                    -
                                  </button>
                                  <input
                                    v-model.number="adminNewItem.quantity"
                                    type="number"
                                    min="1"
                                    step="1"
                                    class="form-control selection-mini-input selection-mini-input--qty"
                                  />
                                  <button
                                    type="button"
                                    class="items-qty-btn"
                                    @click="incrementAdminNewItemQty"
                                  >
                                    +
                                  </button>
                                </div>
                              </label>
                            </div>
                            <div class="selection-card-footer">
                              <label class="selection-mini-field selection-mini-field--price">
                                <span>Customer Price</span>
                                <div class="selection-mini-price">
                                  <span>GHS</span>
                                  <input
                                    v-model.number="adminNewItem.selected_source_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    class="form-control selection-mini-input selection-mini-input--price"
                                    placeholder="0.00"
                                  />
                                </div>
                              </label>
                              <button
                                type="button"
                                class="selection-card-save"
                                :disabled="loading || !canSavePrescriptionAdminSelection"
                                @click="saveAdminNewItem"
                              >
                                Save choice
                              </button>
                            </div>
                          </div>
                        </article>
                      </div>
                    </section>
                  </template>

                  <template v-else-if="activeRequestItem">
                    <section class="workspace-search-card">
                      <div class="workspace-panel-head">
                        <div>
                          <h5>Pharmacy Search</h5>
                        </div>
                      </div>

                      <div class="simple-search-block">
                        <label class="simple-field-label">Search pharmacy inventory</label>
                        <input
                          v-model="activeRequestItem.product_search"
                          type="text"
                          class="form-control composer-search-input"
                          :placeholder="`Search inventory for ${activeRequestItem.product_name}`"
                          @input="onAdminProductInput(activeRequestItem)"
                        />
                      </div>

                      <div v-if="activeRequestItem.product_search_loading || String(activeRequestItem.product_search || '').trim().length >= 2" class="simple-search-results">
                        <div class="simple-search-results-head">
                          <span>Choice</span>
                          <span>Product</span>
                          <span>Pharmacy</span>
                          <span>Distance</span>
                          <span>Stock</span>
                          <span>Price</span>
                        </div>
                        <div v-if="activeRequestItem.product_search_loading" class="dropdown-empty">
                          Searching...
                        </div>
                        <template v-else>
                          <button
                            v-for="(result, resultIndex) in activeRequestItem.productSearchResults"
                            :key="`composer-item-${activeRequestItem.id}-result-${resultIndex}`"
                            type="button"
                            class="simple-search-result-row"
                            @click="selectAdminProduct(activeRequestItem, result)"
                          >
                            <span class="search-choice-index">{{ resultIndex + 1 }}</span>
                            <span>{{ getProductSearchLabel(result) }}</span>
                            <span>{{ result.company_name || '-' }}</span>
                            <span>{{ Number.isFinite(Number(result.distance_km)) ? formatDistance(result.distance_km) : '-' }}</span>
                            <span>{{ Number(result.available_quantity || 0) > 0 ? Number(result.available_quantity) : '-' }}</span>
                            <span>{{ Number(result.price || 0) > 0 ? `GHS ${Number(result.price).toFixed(2)}` : '-' }}</span>
                          </button>
                          <div v-if="activeRequestItem.productSearchResults.length === 0" class="dropdown-empty workspace-search-empty">
                            No nearby matches found.
                          </div>
                        </template>
                      </div>
                      <div v-else class="workspace-search-placeholder">
                        Start typing to search nearby pharmacies for this item.
                      </div>
                    </section>

                    <section class="workspace-selection-card">
                      <div class="simple-composer-head">
                        <div>
                          <div>
                            <h5>{{ getAdminSelectedItemTitle(activeRequestItem) }}</h5>
                          </div>
                        </div>
                      </div>

                      <div class="simple-item-reference">
                        <span>Requested qty: {{ getRequestedQuantity(activeRequestItem) }}</span>
                        <span v-if="activeRequestItem.requested_unit">Requested unit: {{ activeRequestItem.requested_unit }}</span>
                        <span class="status-badge sm" :class="itemStatusClass(activeRequestItem)">
                          {{ formatItemStatus(activeRequestItem) }}
                        </span>
                      </div>

                      <section class="saved-selection-list-shell">
                        <div class="saved-selection-list-head">
                          <div>
                            <span class="pane-eyebrow">Saved Selections</span>
                            <p>Linked pharmacy products for this request.</p>
                          </div>
                          <span class="request-items-pane-count">{{ persistedSelectionItems.length }}</span>
                        </div>

                        <div v-if="persistedSelectionItems.length" class="saved-selection-list">
                          <div
                            v-for="(item, savedIndex) in persistedSelectionItems"
                            :key="`saved-selection-${item.id}`"
                            class="request-item-row saved-selection-row request-item-row--deletable"
                            :class="{ active: activeRequestItem?.id === item.id }"
                            @click="selectRequestItem(item)"
                          >
                            <span class="request-item-row-index">{{ savedIndex + 1 }}</span>
                            <div class="request-item-row-main">
                              <strong>{{ getPersistedItemSourceSummary(item)?.productName || 'Saved pharmacy product' }}</strong>
                              <div class="request-item-row-meta">
                                <span>{{ getPersistedItemSourceSummary(item)?.name || 'Selected pharmacy' }}</span>
                                <span>Qty {{ getRequestedQuantity(item) }}</span>
                                <span v-if="item.requested_unit">{{ item.requested_unit }}</span>
                                <span v-if="getPersistedItemSourceSummary(item)?.distance">{{ getPersistedItemSourceSummary(item).distance }}</span>
                                <span
                                  v-if="getPersistedItemSourceSummary(item)?.price"
                                  class="selection-preview-chip selection-preview-chip--price"
                                >
                                  GHS {{ getPersistedItemSourceSummary(item).price }}
                                </span>
                              </div>
                              <div v-if="activeRequestItem?.id === item.id" class="mt-3 pt-3 border-t border-slate-200/70 pb-1 flex flex-col gap-3">
                                <!-- Row 1: Unit and Qty -->
                                <div class="flex items-end gap-3 w-full">
                                  <!-- Unit -->
                                  <label class="flex flex-col gap-1 flex-1 m-0">
                                    <span class="text-[9px] font-black tracking-widest text-[#4F217A]/60 uppercase leading-none">Unit</span>
                                    <select
                                      v-model="item.requested_unit"
                                      @change="autoUpdateAllocation(item)"
                                      class="form-control border border-[#4F217A]/20 bg-white text-[11px] font-bold text-gray-900 rounded px-1 !py-0 !h-7 tracking-wide w-full"
                                    >
                                      <option value="">...</option>
                                      <option v-for="option in medicineUnitOptions" :key="`saved-unit-${item.id}-${option}`" :value="option">
                                        {{ option }}
                                      </option>
                                    </select>
                                  </label>

                                  <!-- Qty -->
                                  <label class="flex flex-col gap-1 w-[55px] shrink-0 m-0">
                                    <span class="text-[9px] font-black tracking-widest text-[#4F217A]/60 uppercase leading-none">Qty</span>
                                    <input
                                      v-model.number="item.allocation_quantity"
                                      @blur="autoUpdateAllocation(item)"
                                      type="number"
                                      min="1"
                                      class="form-control border border-[#4F217A]/20 bg-white text-[12px] font-black text-center text-gray-900 rounded px-1 !py-0 !h-7 tracking-wide w-full"
                                      placeholder="1"
                                    />
                                  </label>
                                </div>

                                <!-- Row 2: Price and Save -->
                                <div class="flex items-end gap-3 w-full">
                                  <!-- Price -->
                                  <label class="flex flex-col gap-1 flex-1 m-0">
                                    <span class="text-[9px] font-black tracking-widest text-[#4F217A]/60 uppercase leading-none">Cust Price</span>
                                    <div class="relative flex items-center !h-7 w-full border border-[#4F217A]/20 rounded bg-white overflow-hidden focus-within:ring-1 focus-within:ring-[#4F217A]">
                                      <span class="absolute left-2 text-[9px] font-black text-[#4F217A]/40 pointer-events-none mt-px">GHS</span>
                                      <input
                                        v-model.number="item.edit_price"
                                        @blur="autoUpdateAllocation(item)"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        class="block w-full border-none pl-[34px] pr-2 !py-0 h-full text-[12px] font-black text-gray-900 focus:ring-0 focus:outline-none bg-transparent"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </label>

                                  <!-- Save -->
                                  <button
                                    type="button"
                                    class="w-[75px] shrink-0 !h-7 rounded bg-[#4F217A]/10 text-[#4F217A] font-black text-[10px] uppercase tracking-wider hover:bg-[#4F217A]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-[#4F217A]/5 mb-0"
                                    :disabled="loading || !canSaveItemSelection(item)"
                                    @click.stop="saveItemPrice(item)"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              class="selection-preview-close saved-selection-row-clear"
                              @click.stop="clearSavedSelection(item)"
                              :disabled="loading"
                              title="Clear saved selection"
                              aria-label="Clear saved selection"
                            >
                              <XMarkIcon class="icon-xs" />
                            </button>
                          </div>
                        </div>

                        <div v-else class="saved-selection-empty">
                          No saved pharmacy selections yet. Pick a pharmacy choice in the middle panel and save it here.
                        </div>

                        <div v-if="persistedSelectionItems.length" class="saved-selection-total">
                          <span>Total of listed items</span>
                          <strong>{{ formatCurrency(savedSelectionsTotal) }}</strong>
                        </div>
                      </section>

                    </section>
                  </template>
                  <div v-else-if="prescriptionAttachmentUrls.length" class="simple-composer-empty workspace-board-empty">
                    <span class="pane-eyebrow">Composition Workspace</span>
                    <h5>Add the first request item</h5>
                    <p>Use the quick add bar above to create the first line, then the full workspace will open here for the rest of the prescription.</p>
                  </div>
                  <div v-else class="simple-composer-empty workspace-board-empty">
                    <span class="pane-eyebrow">Composition Workspace</span>
                    <h5>Select a request item</h5>
                    <p>Use the item list on the left as your reference, then search and compose the selected item across the middle and right panels.</p>
                  </div>
                </div>
          </section>
          </div>

          </template>
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
                <div class="nested-form-sections">
                  <section class="nested-form-panel nested-form-panel--source">
                    <div class="nested-form-panel-head">
                      <span class="nested-panel-label">Source</span>
                      <p>Choose where this alternative is coming from.</p>
                    </div>
                    <div class="nested-field-grid compact">
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
                    </div>
                  </section>

                  <section class="nested-form-panel">
                    <div class="nested-form-panel-head">
                      <span class="nested-panel-label">Customer-facing details</span>
                    </div>
                    <div class="nested-field-grid">
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
                      <div class="nested-field nested-field-wide">
                        <label>Note</label>
                        <input
                          v-model="alternativeModal.note"
                          type="text"
                          class="form-control"
                          placeholder="Optional note about brand, form, or strength"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div class="workspace-nested-actions">
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
    </section>

    <div v-if="prescriptionPreview.open" class="workspace-nested-overlay" @click.self="closePrescriptionPreview">
      <div class="workspace-nested-modal image-preview-modal">
        <div class="workspace-nested-head image-preview-head">
          <div>
            <span class="workspace-nested-label">Prescription</span>
            <h4>Attached Image {{ prescriptionPreview.index + 1 }}</h4>
            <p>Review the prescription here, then continue composing without leaving the workspace.</p>
          </div>
          <button type="button" class="modal-close" @click="closePrescriptionPreview">
            <XMarkIcon class="close-svg" />
          </button>
        </div>

        <div class="image-preview-body">
          <img
            :src="prescriptionPreview.url"
            :alt="`Prescription preview ${prescriptionPreview.index + 1}`"
            class="image-preview-full"
          />
        </div>
      </div>
    </div>

    <div v-if="composedSummaryRequest" class="workspace-nested-overlay" @click.self="closeComposedSummary">
      <div class="workspace-nested-modal composed-summary-modal">
        <div class="workspace-nested-head">
          <div>
            <span class="workspace-nested-label">Composed Summary</span>
            <h4>{{ composedSummaryRequest.request_number }} | {{ composedSummaryRequest.customer_name || 'Unknown Customer' }}</h4>
          </div>
          <button type="button" class="modal-close" @click="closeComposedSummary">
            <XMarkIcon class="close-svg" />
          </button>
        </div>

        <div class="workspace-nested-content composed-summary-content" style="padding: 0;">
          <div class="composed-summary-hero" style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #fdfdfd; display: flex; flex-direction: column; gap: 1rem;">
            <div class="composed-summary-stats" style="display: flex; gap: 2rem; align-items: baseline; padding-bottom: 0.5rem;">
              <span class="composed-stat-item" style="display: flex; align-items: baseline; gap: 0.5rem;">
                <span style="font-size: 0.65rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Status</span>
                <strong style="font-size: 1rem; font-weight: 600; color: #111827;">{{ formatStatus(composedSummaryRequest.status) }}</strong>
              </span>
              <div style="width: 1px; height: 1rem; background: #e5e7eb; align-self: center;"></div>
              <span class="composed-stat-item" style="display: flex; align-items: baseline; gap: 0.5rem;">
                <span style="font-size: 0.65rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Items</span>
                <strong style="font-size: 1rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">{{ composedSummaryRequest.items?.length || 0 }}</strong>
              </span>
              <div style="width: 1px; height: 1rem; background: #e5e7eb; align-self: center;"></div>
              <span class="composed-stat-item" style="display: flex; align-items: baseline; gap: 0.5rem;">
                <span style="font-size: 0.65rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Sources</span>
                <strong style="font-size: 1rem; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">{{ composedPharmacySummary.length }}</strong>
              </span>
            </div>

            <div class="composed-request-status-bar" style="display: flex; gap: 1rem; align-items: center; border-radius: 6px; border: 1px solid #dbeafe; background: #eff6ff; padding: 1rem;">
              <div class="composed-request-status-copy" style="flex: 1;">
                <strong style="font-size: 0.875rem; color: #1e40af;">Master Status Update</strong>
                <p style="margin: 0; font-size: 0.75rem; color: #3b82f6;">Advance the overall request status once all lines are confirmed or fulfilled.</p>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <select v-model="composedSummaryStatus" class="form-control composed-request-status-select" style="min-width: 200px; background: #fff; border-color: #bfdbfe;">
                  <option value="">Change request status...</option>
                  <option value="composed">Composed</option>
                  <option value="confirming_with_pharm">Confirming With Pharm</option>
                  <option value="confirmed_in_pharm">Confirmed In Pharm</option>
                  <option value="paid">Paid</option>
                  <option value="ready_for_pickup">Ready For Pickup</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="out_for_delivery">Out For Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="loading || !composedSummaryStatus"
                  @click="updateComposedRequestStatus"
                >
                  Update Request
                </button>
              </div>
            </div>
          </div>

          <div v-if="composedPharmacySummary.length" class="composed-pharmacy-summary" style="padding: 1.5rem; background: #f9fafb;">
            <div
              v-for="group in composedPharmacySummary"
              :key="group.pharmacyId || group.name"
              class="composed-pharmacy-card"
              style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"
            >
              <div class="composed-pharmacy-head" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f3f4f6; background: #fcfcfc;">
                <div class="composed-pharmacy-identity">
                  <span class="composed-section-kicker" style="font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase;">Assigned Pharmacy</span>
                  <div class="composed-info-row" style="margin-top: 0.25rem;">
                    <strong style="font-size: 1.1rem; color: #111827;">{{ group.name || 'Unknown pharmacy' }}</strong>
                  </div>
                  <div class="composed-info-row" style="margin-top: 0.15rem;">
                    <span style="font-size: 0.85rem; color: #6b7280;">{{ group.phone || 'No phone on file' }}</span>
                  </div>
                  <div class="composed-pharmacy-meta" style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <span class="composed-meta-chip" style="font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px;">{{ group.items.length }} item{{ group.items.length !== 1 ? 's' : '' }}</span>
                    <span v-if="group.distanceKm !== null && group.distanceKm !== undefined" class="composed-meta-chip" style="font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px;">{{ formatDistance(group.distanceKm) }} away</span>
                    <span class="composed-meta-chip composed-meta-chip--value" style="font-size: 0.75rem; background: #ecfdf5; color: #047857; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 600;">GHS {{ Number(group.totalValue || 0).toFixed(2) }}</span>
                    <span v-if="getComposedSummaryGroupStatus(group)" :style="getComposedSummaryGroupStatus(group) === 'confirmed' ? 'font-size: 0.75rem; background: #dcfce7; color: #166534; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 700;' : 'font-size: 0.75rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 700;'">{{ getComposedSummaryGroupStatus(group).replace('_', ' ') }}</span>
                  </div>
                </div>
                <div class="composed-pharmacy-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem;">
                  <a
                    v-if="group.whatsappUrl"
                    :href="group.whatsappUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-whatsapp composed-whatsapp-btn"
                    style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border-radius: 6px; background: #10b981; color: #fff; font-size: 0.8rem; font-weight: 500; text-decoration: none;"
                  >
                    <i class="ri-whatsapp-line"></i>
                    <span>Contact</span>
                  </a>
                  <span v-else class="composed-whatsapp-missing" style="font-size: 0.75rem; color: #9ca3af; font-style: italic;">No WhatsApp</span>
                  <div class="composed-status-actions" style="display: flex; gap: 0.4rem; align-items: center;">
                    <select
                      v-model="composedGroupActions[group.pharmacyId || group.name]"
                      class="form-control form-control-sm composed-status-select"
                      style="min-width: 140px;"
                    >
                      <option value="">Status...</option>
                      <option value="contacted">Contacted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="timed_out">Timed Out</option>
                    </select>
                    <button
                      type="button"
                      class="btn-secondary btn-sm"
                      :disabled="loading || !composedGroupActions[group.pharmacyId || group.name]"
                      @click="updateComposedPharmacyStatus(group)"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
              <div class="composed-item-list" style="padding: 0;">
                <table class="financial-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left;">
                  <thead>
                    <tr style="background: #f9fafb; border-bottom: 1px solid #f3f4f6;">
                      <th style="padding: 0.75rem 1.5rem; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em;">Product</th>
                      <th style="padding: 0.75rem 1.5rem; text-align: right; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; width: 80px;">Qty</th>
                      <th style="padding: 0.75rem 1.5rem; text-align: right; color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; width: 120px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in group.items" :key="`composed-${group.pharmacyId || group.name}-${entry.id}`" style="border-bottom: 1px solid #f3f4f6;">
                      <td style="padding: 1rem 1.5rem; color: #111827; font-weight: 500;">{{ entry.productName }}</td>
                      <td style="padding: 1rem 1.5rem; text-align: right; color: #6b7280;">{{ entry.quantity }}</td>
                      <td style="padding: 1rem 1.5rem; text-align: right; color: #111827; font-weight: 600; font-variant-numeric: tabular-nums;">{{ entry.price != null ? `GHS ${Number(entry.price).toFixed(2)}` : '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div v-else class="selection-summary-empty">
            No composed pharmacy selections are saved on this request yet.
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
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useAdminStore } from '~/stores/admin'
import { phoneUtils } from '~/utils/phone'
import {
  ChartBarIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  CubeIcon,
  XMarkIcon,
  EyeIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

const adminStore = useAdminStore()
const config = useRuntimeConfig()
const apiBaseUrl = config.public.apiBase

// State
const loading = ref(false)
const requests = ref([])
const stats = ref(null)
const searchQuery = ref('')
const statusFilter = ref('pending')
const selectedRequest = ref(null)
const selectedStatus = ref('')
const composedSummaryRequest = ref(null)
const composedSummaryStatus = ref('')
const composedGroupActions = ref({})
const openingRequestId = ref(null)
const activeRequestItemId = ref(null)
const activePrescriptionImageIndex = ref(0)
const adminNotes = ref('')
const nearbyPharmacies = ref([])
const candidatePlans = ref([])
const fulfillmentPlans = ref([])
const allocationSummary = ref(null)
const pharmacyQueue = ref([])
const nextRecommendedPharmacy = ref(null)
const logisticsAssessment = ref(null)
const message = ref(null)
const REQUEST_POLL_MS = 5000
let requestPollTimer = null
const medicineUnitOptions = [
  'tab',
  'capsule',
  'bottle',
  'suppository',
  'tube',
  'vial',
  'ampoule',
  'sachet',
  'pack',
  'other'
]
const createAdminNewItemDraft = () => ({
  product_id: null,
  product_search: '',
  requested_unit: '',
  quantity: 1,
  requested_quantity: 1,
  selected_source_pharmacy_id: null,
  selected_source_product_id: null,
  selected_source_distance_km: null,
  selected_source_summary: null,
  selected_source_price: null,
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
const prescriptionPreview = ref({
  open: false,
  url: '',
  index: 0
})

const STATUS_TAB_CONFIG = [
  { value: 'pending', label: 'Pending', statuses: ['pending'] },
  { value: 'confirming_with_pharm', label: 'Confirming', statuses: ['confirming_with_pharm'] },
  { value: 'composed', label: 'Composed', statuses: ['composed'] },
  { value: 'confirmed_in_pharm', label: 'Confirmed', statuses: ['confirmed_in_pharm'] },
  { value: 'paid', label: 'Paid', statuses: ['paid'] },
  { value: 'out_for_delivery', label: 'Out for Delivery', statuses: ['out_for_delivery'] },
  { value: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] }
]

const STATUS_SELECTOR_OPTIONS = [
  { value: 'ready_for_pickup', label: 'Ready For Pickup' },
  { value: 'awaiting_customer', label: 'Awaiting Customer' },
  { value: 'logistics_pending', label: 'Logistics Pending' },
  { value: 'driver_unavailable', label: 'Driver Unavailable' },
  { value: 'ready_for_pickup', label: 'Ready For Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'out_for_delivery', label: 'Out For Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' }
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

const statusSelectorOptions = computed(() => STATUS_SELECTOR_OPTIONS.map((option) => ({
  ...option,
  count: requests.value.filter((request) => normalizeRequestStatus(request?.status) === option.value).length
})))

const requestItems = computed(() => getCustomerRequestItems(selectedRequest.value))

const activeRequestItem = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  const activeId = Number(activeRequestItemId.value || 0)
  if (activeId > 0) {
    const matching = items.find((item) => Number(item?.id || 0) === activeId)
    if (matching) return matching
  }
  return items[0] || null
})

const persistedSelectionItems = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  return items.filter((item) => isSavedSelectionItem(item))
})

const savedSelectionsTotal = computed(() => persistedSelectionItems.value.reduce((sum, item) => {
  const lineTotal = Number(item?.line_total || 0)
  if (Number.isFinite(lineTotal) && lineTotal > 0) {
    return sum + lineTotal
  }

  const quantity = Number(getRequestedQuantity(item) || 0)
  const unitPrice = Number(item?.marked_up_price || item?.unit_price || 0)
  if (!Number.isFinite(quantity) || quantity <= 0) return sum
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return sum
  return sum + (quantity * unitPrice)
}, 0))

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

const getCustomerWhatsAppUrl = (phone) => {
  const digits = phoneUtils.formatWhatsApp(phone)
  return digits ? `https://wa.me/${digits}` : ''
}

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

const getRequestedQuantity = (item) => {
  const legacyQuantity = Number(item?.quantity || 0)
  const normalizedQuantity = Number(item?.requested_quantity || 0)
  const effectiveQuantity = Math.max(legacyQuantity, normalizedQuantity)
  return effectiveQuantity > 0 ? effectiveQuantity : 1
}

const decrementAdminNewItemQty = () => {
  adminNewItem.quantity = Math.max(1, Number(adminNewItem.quantity || 1) - 1)
}

const incrementAdminNewItemQty = () => {
  adminNewItem.quantity = Math.max(1, Number(adminNewItem.quantity || 1) + 1)
}

const syncActiveRequestItem = (items = []) => {
  const normalizedItems = Array.isArray(items) ? items : []
  const requestSideItems = normalizedItems.filter((item) => !isSavedSelectionItem(item))
  const itemPool = requestSideItems.length > 0 ? requestSideItems : normalizedItems
  if (!itemPool.length) {
    activeRequestItemId.value = null
    return
  }

  const activeId = Number(activeRequestItemId.value || 0)
  if (activeId > 0 && itemPool.some((item) => Number(item?.id || 0) === activeId)) {
    return
  }

  activeRequestItemId.value = Number(itemPool[0]?.id || 0) || null
}

const selectRequestItem = (item) => {
  const itemId = Number(item?.id || 0)
  if (itemId <= 0) return
  activeRequestItemId.value = itemId
}

const selectPrescriptionImage = (index) => {
  const nextIndex = Number(index || 0)
  if (nextIndex < 0 || nextIndex >= prescriptionAttachmentUrls.value.length) return
  activePrescriptionImageIndex.value = nextIndex
  resetAdminNewItem()
}

const getPrescriptionTargetItem = () => {
  const items = requestItems.value
  if (!items.length) return null
  const targetIndex = Math.min(Math.max(Number(activePrescriptionImageIndex.value || 0), 0), items.length - 1)
  return items[targetIndex] || null
}

const advanceToNextRequestItem = (currentItemId) => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  if (!items.length) return false

  const currentIndex = items.findIndex((item) => Number(item?.id || 0) === Number(currentItemId || 0))
  if (currentIndex < 0) return false

  const nextItem = items[currentIndex + 1] || null
  if (!nextItem) return false

  selectRequestItem(nextItem)
  return true
}

const getAllocationPharmacy = (item) => {
  if (!item?.allocation_pharmacy_id) return null
  return nearbyPharmacies.value?.find((p) => p.id === item.allocation_pharmacy_id) || null
}

const getPersistedItemSourceSummary = (item) => {
  const pharmacyName = String(item?.pharmacy_name || '').trim()
  const sourcePharmacyId = Number(item?.source_pharmacy_id || 0)
  const sourceProductId = Number(item?.source_product_id || 0)
  const distanceValue = item?.source_distance_km ?? getAllocationPharmacy(item)?.distance_km ?? null
  const unitPrice = Number(item?.marked_up_price || item?.unit_price || 0)
  const productName = String(item?.source_product_name || '').trim()
  if (!pharmacyName && sourcePharmacyId <= 0 && sourceProductId <= 0 && unitPrice <= 0 && !productName) return null

  return {
    pharmacyId: sourcePharmacyId || null,
    name: pharmacyName || (sourcePharmacyId > 0 ? `Pharmacy ${sourcePharmacyId}` : 'Selected source'),
    productName: productName || null,
    distance: distanceValue !== null && distanceValue !== undefined && Number.isFinite(Number(distanceValue))
      ? formatDistance(distanceValue)
      : null,
    price: unitPrice > 0 ? unitPrice.toFixed(2) : null
  }
}

const getDraftItemSourceSummary = (item) => {
  if (item?.selected_source_summary && (item.selected_source_summary.pharmacyId || item.selected_source_summary.name)) {
    return item.selected_source_summary
  }
  return null
}

const getAdminSelectedItemTitle = (item) => {
  const draftName = String(getDraftItemSourceSummary(item)?.productName || '').trim()
  if (draftName) return draftName

  const savedName = String(getPersistedItemSourceSummary(item)?.productName || '').trim()
  if (savedName) return savedName

  return 'No pharmacy product selected'
}

const hasPersistedItemSource = (item) => Boolean(getPersistedItemSourceSummary(item))

const hasDraftItemSource = (item) => Boolean(getDraftItemSourceSummary(item))

const getSelectedSourceDraftLabel = (item) => String(
  getDraftItemSourceSummary(item)?.productName
  || getPersistedItemSourceSummary(item)?.productName
  || item?.product_name
  || ''
).trim().toLowerCase()

const canSaveItemSelection = (item) => {
  const pharmacyId = Number(item?.allocation_pharmacy_id || 0)
  const price = Number(item?.edit_price || item?.unit_price || 0)
  return pharmacyId > 0 && Number.isFinite(price) && price > 0 && !item?.selection_dirty
}

const clearItemSelection = (item) => {
  const persistedPharmacyId = Number(item?.source_pharmacy_id || getActiveAllocationPharmacyId(item) || 0)
  const persistedPrice = Number(item?.marked_up_price || item?.unit_price || 0)
  const persistedProductName = String(item?.source_product_name || item?.product_name || '').trim()
  item.allocation_pharmacy_id = persistedPharmacyId > 0 ? persistedPharmacyId : ''
  item.allocation_quantity = getRequestedQuantity(item)
  item.allocation_type = 'exact'
  item.allocation_status = 'confirmed'
  item.product_search = persistedProductName
  item.product_id = null
  item.edit_price = Number.isFinite(persistedPrice) && persistedPrice > 0 ? Number(persistedPrice.toFixed(2)) : ''
  item.allocation_unit_price = ''
  item.selected_source_product_id = Number(item?.source_product_id || 0) || null
  item.selected_source_distance_km = item?.source_distance_km == null ? null : Number(item.source_distance_km)
  item.selected_source_summary = null
  item.selection_dirty = false
  item.showProductDropdown = false
  item.productSearchResults = []
}

const getSourcingOptions = (item, excludeCurrent = false) => {
  const itemId = Number(item?.id || 0)
  if (!itemId) return []
  const sourceList = Array.isArray(pharmacyQueue.value) && pharmacyQueue.value.length > 0 ? pharmacyQueue.value : []
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

const getRecommendedSourcingOption = (item) => {
  const recommendedPharmacyId = Number(nextRecommendedPharmacy.value?.pharmacy_id || 0)
  if (recommendedPharmacyId <= 0) return null

  return getSourcingOptions(item, false).find((option) => Number(option.pharmacyId || 0) === recommendedPharmacyId) || null
}

const toggleSourcingDropdown = (item) => {
  const next = !item.showSourcingDropdown
  const allItems = selectedRequest.value?.items || []
  for (const otherItem of allItems) {
    otherItem.showSourcingDropdown = false
  }
  item.showSourcingDropdown = next
}

const selectSourcingOption = (item, option, options = {}) => {
  const { silent = false, successMessage = null } = options
  item.showSourcingDropdown = false
  const name = String(item.product_name || 'this item').trim()
  const isChangingSource = Number(item.allocation_pharmacy_id || 0) > 0
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
  if (silent) return
  if (successMessage) {
    showMessage(successMessage, 'success')
    return
  }
  if (isChangingSource) {
    showMessage(`Changed source to ${option.name} for ${name}`, 'success')
  } else {
    showMessage(`Selected ${option.name} for ${name} — click Save Allocation to confirm`, 'success')
  }
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
    if (item.source_pharmacy_id) {
      sourcePharmacyIds.add(Number(item.source_pharmacy_id))
    }

    if (Array.isArray(item.allocations)) {
      item.allocations.forEach((allocation) => {
        if (allocation?.pharmacy_id) {
          sourcePharmacyIds.add(Number(allocation.pharmacy_id))
        }
      })
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

const prescriptionAttachmentUrls = computed(() => {
  if (!selectedRequest.value) return []
  const urls = Array.isArray(selectedRequest.value.prescription_images) && selectedRequest.value.prescription_images.length
    ? selectedRequest.value.prescription_images
    : [selectedRequest.value.prescription_image_url].filter(Boolean)
  return urls.filter((url) => typeof url === 'string' && url.trim())
})

const activePrescriptionImageUrl = computed(() => {
  return prescriptionAttachmentUrls.value[activePrescriptionImageIndex.value] || ''
})

const showTopQuickAdd = computed(() => {
  return !hasPrescriptionAttachments.value
})

const itemsIntakeSummary = computed(() => {
  if (!selectedRequest.value) return 'Add an item to the request.'
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
    || String(adminNewItem.requested_unit || '').trim().length > 0
    || Boolean(adminNewItem.selected_source_summary)
})

const canSavePrescriptionAdminSelection = computed(() => {
  if (!hasPrescriptionAttachments.value) return canAddAdminItem.value
  const price = Number(adminNewItem.selected_source_price || 0)
  return Boolean(
    canAddAdminItem.value
    && adminNewItem.selected_source_summary
    && Number(adminNewItem.selected_source_pharmacy_id || 0) > 0
    && Number.isFinite(price)
    && price > 0
  )
})

const hasComposableItems = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  return items.length > 0
})

const composedCoverageSummary = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  const composedItems = items.filter((item) => {
    const hasSourcePharmacy = Number(item?.source_pharmacy_id || 0) > 0
    const hasSavedPrice = Number(item?.unit_price || item?.marked_up_price || 0) > 0
    const hasAllocation = Array.isArray(item?.allocations)
      ? item.allocations.some((allocation) => ['proposed', 'confirmed'].includes(String(allocation?.status || '').toLowerCase()))
      : false
    return hasSourcePharmacy || hasSavedPrice || hasAllocation
  })

  const itemPool = composedItems.length > 0 ? composedItems : items

  const coveredItems = itemPool.filter((item) => {
    const activeAllocations = Array.isArray(item?.allocations)
      ? item.allocations.filter((allocation) => ['proposed', 'confirmed'].includes(String(allocation?.status || '').toLowerCase()))
      : []
    if (activeAllocations.length > 0) return true

    const hasSourcePharmacy = Number(item?.source_pharmacy_id || 0) > 0
    const hasSavedPrice = Number(item?.unit_price || item?.marked_up_price || 0) > 0
    return hasSourcePharmacy || hasSavedPrice
  }).length

  return {
    total: itemPool.length,
    covered: coveredItems,
    uncovered: Math.max(itemPool.length - coveredItems, 0)
  }
})

const buildComposedPharmacyWhatsAppUrl = (request, group) => {
  const digits = phoneUtils.formatWhatsApp(group?.phone || '')
  if (!digits) return ''

  const requestNumber = String(request?.request_number || '').trim()
  const customerName = String(request?.customer_name || '').trim()
  const lines = (group?.items || []).map((entry) => {
    const qtyPart = entry.quantity ? `Qty ${entry.quantity}` : null
    const pricePart = entry.price != null ? `GHS ${Number(entry.price).toFixed(2)}` : null
    return `- ${entry.productName}${qtyPart ? ` (${qtyPart}${pricePart ? `, ${pricePart}` : ''})` : ''}`
  })

  const text = [
    `Hello ${group?.name || 'Pharmacy'},`,
    requestNumber ? `Please confirm availability for ${requestNumber}${customerName ? ` for ${customerName}` : ''}.` : 'Please confirm availability for this request.',
    '',
    ...lines
  ].join('\n')

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

const buildComposedPharmacySummary = (request) => {
  const items = Array.isArray(request?.items) ? request.items : []
  const grouped = new Map()

  for (const item of items) {
    const pharmacyId = Number(item?.source_pharmacy_id || 0)
    const summary = getPersistedItemSourceSummary(item)
    const phone = String(item?.pharmacy_phone || '').trim()
    const distanceValue = item?.source_distance_km == null ? null : Number(item.source_distance_km)
    const priceValue = Number(item?.marked_up_price || item?.unit_price || 0)

    if (pharmacyId <= 0 && !summary?.name) continue

    const groupKey = pharmacyId > 0 ? `pharmacy-${pharmacyId}` : `name-${summary?.name || 'unknown'}`
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        pharmacyId: pharmacyId || null,
        name: summary?.name || item?.pharmacy_name || 'Selected pharmacy',
        phone,
        distanceKm: Number.isFinite(distanceValue) ? distanceValue : null,
        items: [],
        totalValue: 0
      })
    }

    const group = grouped.get(groupKey)
    const quantity = Number(getRequestedQuantity(item) || 0)
    const lineTotal = Number(item?.line_total || (priceValue > 0 ? priceValue * quantity : 0))
    group.items.push({
      id: item.id,
      productName: summary?.productName || item?.source_product_name || item?.product_name || 'Item',
      quantity,
      price: priceValue > 0 ? Number(priceValue.toFixed(2)) : null,
      distanceKm: Number.isFinite(distanceValue) ? distanceValue : group.distanceKm
    })
    group.totalValue += Number.isFinite(lineTotal) ? lineTotal : 0
    if (group.distanceKm == null && Number.isFinite(distanceValue)) {
      group.distanceKm = distanceValue
    }
    if (!group.phone && phone) {
      group.phone = phone
    }
  }

  return Array.from(grouped.values()).map((group) => ({
    ...group,
    totalValue: Number(group.totalValue.toFixed(2)),
    whatsappUrl: buildComposedPharmacyWhatsAppUrl(request, group)
  }))
}

const composedPharmacySummary = computed(() => buildComposedPharmacySummary(composedSummaryRequest.value))

const getComposedSummaryGroupKey = (group) => group?.pharmacyId || group?.name || ''

const getComposedSummaryQueueEntries = () => {
  const request = composedSummaryRequest.value
  const queue = Array.isArray(request?.nearby_pharmacies) && request.nearby_pharmacies.length
    ? request.nearby_pharmacies
    : (Array.isArray(request?.pharmacy_queue) ? request.pharmacy_queue : [])
  return Array.isArray(queue) ? queue : []
}

const getComposedSummaryPharmacyEntry = (group) => {
  const queue = getComposedSummaryQueueEntries()
  if (!queue.length) return null

  const targetPharmacyId = Number(group?.pharmacyId || 0)
  const targetName = String(group?.name || '').trim().toLowerCase()

  return queue.find((entry) => {
    const entryPharmacyId = Number(entry?.id || entry?.pharmacy_id || entry?.source_pharmacy_id || 0)
    if (targetPharmacyId > 0 && entryPharmacyId > 0 && entryPharmacyId === targetPharmacyId) {
      return true
    }

    const entryName = String(entry?.pharmacy_name || entry?.name || '').trim().toLowerCase()
    return Boolean(targetName && entryName && entryName === targetName)
  }) || null
}

const getComposedSummaryGroupStatus = (group) => {
  const groupKey = getComposedSummaryGroupKey(group)
  const localAction = groupKey ? composedGroupActions.value[groupKey] : ''
  if (localAction === 'confirmed') return 'confirmed'
  if (localAction === 'contacted') return 'contacted'
  if (localAction === 'declined') return 'declined'
  if (localAction === 'timed_out') return 'timed_out'

  const entry = getComposedSummaryPharmacyEntry(group)
  if (!entry) return ''

  const status = String(entry?.response_status || entry?.pharmacy_status || entry?.queue_state || '').trim().toLowerCase()
  if (entry?.is_confirmed === true || ['full', 'confirmed', 'confirmed_in_pharm'].includes(status)) return 'confirmed'
  if (status === 'contacted' || status === 'awaiting_response') return 'contacted'
  if (status === 'declined' || status === 'unavailable') return 'declined'
  if (status === 'timeout' || status === 'timed_out') return 'timed_out'
  return ''
}

const syncComposedSummaryGroupActions = () => {
  const nextActions = {}
  for (const group of composedPharmacySummary.value || []) {
    const key = getComposedSummaryGroupKey(group)
    if (!key) continue
    nextActions[key] = getComposedSummaryGroupStatus(group)
  }
  composedGroupActions.value = nextActions
}

const applyLocalComposedSummaryPharmacyAction = (group, action) => {
  if (!composedSummaryRequest.value || !group) return false

  const queueEntries = getComposedSummaryQueueEntries()
  const targetPharmacyId = Number(group?.pharmacyId || 0)
  const targetName = String(group?.name || '').trim().toLowerCase()

  const entry = queueEntries.find((candidate) => {
    const entryPharmacyId = Number(candidate?.id || candidate?.pharmacy_id || candidate?.source_pharmacy_id || 0)
    if (targetPharmacyId > 0 && entryPharmacyId > 0 && entryPharmacyId === targetPharmacyId) return true
    const entryName = String(candidate?.pharmacy_name || candidate?.name || '').trim().toLowerCase()
    return Boolean(targetName && entryName && entryName === targetName)
  })

  if (!entry) return false

  if (action === 'confirmed') {
    entry.response_status = 'full'
    entry.pharmacy_status = 'confirmed'
    entry.queue_state = 'full'
    entry.is_confirmed = true
    entry.responded_at = entry.responded_at || new Date().toISOString()
    return true
  }

  if (action === 'contacted') {
    entry.response_status = 'pending'
    entry.pharmacy_status = 'contacted'
    entry.queue_state = 'awaiting_response'
    entry.is_confirmed = false
    entry.contacted_at = entry.contacted_at || new Date().toISOString()
    return true
  }

  if (action === 'declined') {
    entry.response_status = 'declined'
    entry.pharmacy_status = 'declined'
    entry.queue_state = 'declined'
    entry.is_confirmed = false
    entry.responded_at = entry.responded_at || new Date().toISOString()
    return true
  }

  if (action === 'timed_out') {
    entry.response_status = 'timeout'
    entry.pharmacy_status = 'timed_out'
    entry.queue_state = 'timed_out'
    entry.is_confirmed = false
    entry.responded_at = entry.responded_at || new Date().toISOString()
    return true
  }

  return false
}

const isComposedSummaryGroupConfirmed = (group) => {
  return getComposedSummaryGroupStatus(group) === 'confirmed'
}

const isComposedSummaryFullyConfirmed = () => {
  const groups = Array.isArray(composedPharmacySummary.value) ? composedPharmacySummary.value : []
  if (!groups.length) return false
  return groups.every((group) => isComposedSummaryGroupConfirmed(group))
}

const canMarkRequestComposed = computed(() => {
  if (!selectedRequest.value || loading.value) return false
  const currentStatus = normalizeRequestStatus(selectedRequest.value.status)
  if (!['pending', 'processing', 'composed', 'confirming_with_pharm'].includes(currentStatus)) return false
  return hasComposableItems.value && composedCoverageSummary.value.covered > 0
})

const composedStatusHint = computed(() => {
  if (!selectedRequest.value) return 'Open a request to prepare a composed order.'
  if (!hasComposableItems.value) return 'Add or confirm at least one request item first.'
  if (composedCoverageSummary.value.covered <= 0) return 'Select at least one pharmacy-backed item before marking this request composed.'
  if (composedCoverageSummary.value.uncovered > 0) {
    return `${composedCoverageSummary.value.covered} item(s) composed, ${composedCoverageSummary.value.uncovered} still need sourcing.`
  }
  return 'All request items have sourcing details and are ready for the composed queue.'
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

const isPaidRequest = computed(() => normalizeRequestStatus(selectedRequest.value?.status) === 'paid')

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
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    const qs = params.toString()
    const res = await apiCall('GET', `/api/order-requests/admin${qs ? `?${qs}` : ''}`)
    requests.value = res.data || []
  } catch (e) {
    if (!silent) showMessage('Failed to load requests', 'error')
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
  } catch (e) {
    if (!silent) showMessage('Failed to load stats', 'error')
  }
}

const setStatusFilter = (value) => {
  statusFilter.value = value
}

const formatRequestItemsLabel = (request) => {
  if (request?.has_prescription) {
    const prescriptionUrls = Array.isArray(request?.prescription_images) && request.prescription_images.length
      ? request.prescription_images
      : [request?.prescription_image_url].filter(Boolean)
    if (prescriptionUrls.length > 0) return prescriptionUrls.length
  }

  const itemCount = Number(request?.item_count || getCustomerRequestItems(request).length || 0)
  if (itemCount > 0) return itemCount
  if (request?.has_prescription) return 'Prescription attached'
  return '-'
}

const isSavedSelectionItem = (item) => Boolean(
  Number(item?.source_pharmacy_id || 0) > 0
  || Number(item?.source_product_id || 0) > 0
  || Number(item?.unit_price || 0) > 0
  || Number(item?.marked_up_price || 0) > 0
)

const getCustomerRequestItems = (request) => {
  if (!request) return []

  if (request?.has_prescription) {
    return Array.isArray(request?.customer_items) && request.customer_items.length
      ? request.customer_items
      : []
  }

  return Array.isArray(request?.items) ? request.items : []
}

const getCustomerRequestItemCount = (request) => {
  if (request?.has_prescription) {
    const prescriptionUrls = Array.isArray(request?.prescription_images) && request.prescription_images.length
      ? request.prescription_images
      : [request?.prescription_image_url].filter(Boolean)
    return prescriptionUrls.length
  }

  return getCustomerRequestItems(request).length
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
    if (item.edit_price === undefined) item.edit_price = item.marked_up_price || item.unit_price || 0
    if (item.product_search === undefined) {
      item.product_search = item.source_product_name || item.product_name || ''
    }
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
    if (item.selected_source_product_id === undefined) item.selected_source_product_id = Number(item.source_product_id || 0) || null
    if (item.selected_source_distance_km === undefined) {
      item.selected_source_distance_km = item.source_distance_km == null ? null : Number(item.source_distance_km)
    }
    if (item.selected_source_summary === undefined) item.selected_source_summary = null
    if (item.selection_dirty === undefined) item.selection_dirty = false
    if (item.substitute_name === undefined) item.substitute_name = ''
    if (item.substitute_note === undefined) item.substitute_note = ''
    if (Array.isArray(item.allocations)) {
      for (const allocation of item.allocations) {
        hydrateAllocationUiState(allocation)
      }
    }
  }
  syncActiveRequestItem(items)
}

const resetAdminNewItem = () => {
  if (adminNewItem.productSearchDebounceHandle) {
    clearTimeout(adminNewItem.productSearchDebounceHandle)
  }
  Object.assign(adminNewItem, createAdminNewItemDraft())
}

const clearAdminSelectedProduct = () => {
  if (adminNewItem.productSearchDebounceHandle) {
    clearTimeout(adminNewItem.productSearchDebounceHandle)
  }
  adminNewItem.product_id = null
  adminNewItem.product_search = ''
  adminNewItem.selected_source_pharmacy_id = null
  adminNewItem.selected_source_product_id = null
  adminNewItem.selected_source_distance_km = null
  adminNewItem.selected_source_summary = null
  adminNewItem.selected_source_price = null
  adminNewItem.productSearchResults = []
  adminNewItem.showProductDropdown = false
  adminNewItem.product_search_loading = false
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

const openPrescriptionPreview = (url, index = 0) => {
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl) return
  prescriptionPreview.value = {
    open: true,
    url: normalizedUrl,
    index: Number(index || 0)
  }
}

const closePrescriptionPreview = () => {
  prescriptionPreview.value = {
    open: false,
    url: '',
    index: 0
  }
}

const viewRequest = async (req) => {
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${req.id}`)
    selectedRequest.value = res.data
    selectedStatus.value = res.data.status || ''
    adminNotes.value = res.data.admin_notes || ''
    nearbyPharmacies.value = res.data.nearby_pharmacies || []
    candidatePlans.value = []
    fulfillmentPlans.value = []
    allocationSummary.value = null
    pharmacyQueue.value = []
    nextRecommendedPharmacy.value = null
    logisticsAssessment.value = null
    activePrescriptionImageIndex.value = 0
    resetAdminNewItem()

    hydrateItemUiState(selectedRequest.value.items || [])
  } catch (e) {
    showMessage('Failed to load request details', 'error')
  }
}

const openComposedSummary = async (req) => {
  if (!req?.id) return
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${req.id}`)
    composedSummaryRequest.value = res.data
    composedSummaryStatus.value = ''
    syncComposedSummaryGroupActions()
  } catch (e) {
    showMessage('Failed to load composed summary', 'error')
  }
}

const closeComposedSummary = () => {
  composedSummaryRequest.value = null
  composedSummaryStatus.value = ''
  composedGroupActions.value = {}
}

const isComposedTabActive = computed(() => statusFilter.value === 'composed')

const handleProcessRequest = async (req) => {
  const requestId = Number(req?.id || 0)
  if (requestId <= 0 || openingRequestId.value === requestId) return

  openingRequestId.value = requestId
  try {
    if (isComposedTabActive.value) {
      await openComposedSummary(req)
      return
    }
    await viewRequest(req)
  } finally {
    openingRequestId.value = null
  }
}

const canRunFulfillment = (status) => {
  const allowed = new Set([
    'pending',
    'composed',
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
      contacted_at: coverage.contacted_at ?? pharmacy.contacted_at ?? null,
      responded_at: coverage.responded_at ?? pharmacy.responded_at ?? null,
      pharmacy_status: coverage.contact_status ?? pharmacy.pharmacy_status ?? null,
      response_status: coverage.response_status ?? pharmacy.response_status ?? null,
      response_note: coverage.response_note ?? pharmacy.response_note ?? null,
      is_confirmed: coverage.is_confirmed ?? pharmacy.is_confirmed ?? false,
      queue_state: coverage.queue_state ?? pharmacy.queue_state ?? null,
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

const PHARMACY_CONTACT_ACTIONS = Object.freeze({
  contacted: {
    payload: {
      status: 'contacted',
      response_status: 'pending',
      is_confirmed: false
    },
    successMessage: (pharm) => `${pharm.name} marked as contacted`,
    errorMessage: 'Failed to log pharmacy contact'
  },
  confirmed: {
    payload: {
      status: 'confirmed',
      response_status: 'full',
      is_confirmed: true
    },
    successMessage: (pharm) => `Confirmed ${pharm.name} will fulfill this order`,
    errorMessage: 'Failed to confirm pharmacy'
  },
  declined: {
    payload: {
      status: 'declined',
      response_status: 'declined',
      is_confirmed: false
    },
    successMessage: (pharm) => `${pharm.name} marked unavailable`,
    errorMessage: 'Failed to mark pharmacy unavailable'
  },
  timed_out: {
    payload: {
      status: 'timed_out',
      response_status: 'timeout',
      is_confirmed: false
    },
    successMessage: (pharm) => `${pharm.name} marked as timed out`,
    errorMessage: 'Failed to mark pharmacy timeout'
  }
})

const applyLocalPharmacyContactState = (pharm, action) => {
  if (!pharm) return

  if (action === 'contacted') {
    pharm.contacted_at = new Date().toISOString()
    pharm.pharmacy_status = 'contacted'
    pharm.response_status = 'pending'
    pharm.queue_state = 'awaiting_response'
    pharm.is_confirmed = false
    return
  }

  if (action === 'confirmed') {
    nearbyPharmacies.value.forEach((entry) => {
      entry.is_confirmed = false
      if (entry !== pharm && entry.pharmacy_status === 'confirmed') {
        entry.pharmacy_status = 'contacted'
        entry.response_status = 'pending'
        entry.queue_state = 'awaiting_response'
      }
    })
    pharm.contacted_at = pharm.contacted_at || new Date().toISOString()
    pharm.responded_at = new Date().toISOString()
    pharm.pharmacy_status = 'confirmed'
    pharm.response_status = 'full'
    pharm.queue_state = 'full'
    pharm.is_confirmed = true
    return
  }

  if (action === 'declined') {
    pharm.contacted_at = pharm.contacted_at || new Date().toISOString()
    pharm.responded_at = new Date().toISOString()
    pharm.pharmacy_status = 'declined'
    pharm.response_status = 'declined'
    pharm.queue_state = 'declined'
    pharm.is_confirmed = false
    return
  }

  if (action === 'timed_out') {
    pharm.contacted_at = pharm.contacted_at || new Date().toISOString()
    pharm.responded_at = new Date().toISOString()
    pharm.pharmacy_status = 'timed_out'
    pharm.response_status = 'timeout'
    pharm.queue_state = 'timeout'
    pharm.is_confirmed = false
  }
}

const maybePromoteRequestToConfirming = (action) => {
  if (!selectedRequest.value) return

  const currentStatus = normalizeRequestStatus(selectedRequest.value.status)
  if (!['contacted', 'confirmed'].includes(action)) return
  if (!['pending', 'processing'].includes(currentStatus)) return

  selectedRequest.value.status = 'confirming_with_pharm'
  selectedStatus.value = 'confirming_with_pharm'
}

const maybePromoteSummaryRequestToConfirming = (action) => {
  if (!composedSummaryRequest.value) return

  const currentStatus = normalizeRequestStatus(composedSummaryRequest.value.status)
  if (!['contacted', 'confirmed'].includes(action)) return
  if (!['pending', 'processing'].includes(currentStatus)) return

  composedSummaryRequest.value.status = 'confirming_with_pharm'
}

const recordPharmacyContactAction = async (pharm, action, options = {}) => {
  if (!selectedRequest.value || !pharm) return false

  const { showSuccess = true, note = '' } = options
  const actionConfig = PHARMACY_CONTACT_ACTIONS[action]
  if (!actionConfig) {
    showMessage('Unknown pharmacy contact action', 'error')
    return false
  }

  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/contact/${pharm.id}`, {
      ...actionConfig.payload,
      response_note: String(note || '').trim() || null
    })
    applyLocalPharmacyContactState(pharm, action)
    pharm.response_note = String(note || '').trim() || null
    maybePromoteRequestToConfirming(action)
    await fetchFulfillmentPlans({ silent: true })
    if (showSuccess) {
      showMessage(actionConfig.successMessage(pharm), 'success')
    }
    return true
  } catch (e) {
    if (showSuccess) {
      showMessage(e.message || actionConfig.errorMessage, 'error')
    }
    return false
  }
}

const recordComposedPharmacyContactAction = async (group, action) => {
  if (!composedSummaryRequest.value || !group?.pharmacyId) return false

  const actionConfig = PHARMACY_CONTACT_ACTIONS[action]
  if (!actionConfig) {
    showMessage('Unknown pharmacy contact action', 'error')
    return false
  }

  try {
    await apiCall('POST', `/api/order-requests/admin/${composedSummaryRequest.value.id}/contact/${group.pharmacyId}`, {
      ...actionConfig.payload,
      response_note: null
    })
    applyLocalComposedSummaryPharmacyAction(group, action)
    syncComposedSummaryGroupActions()
    maybePromoteSummaryRequestToConfirming(action)
    await fetchRequests({ silent: true })
    await fetchStats({ silent: true })
    showMessage(actionConfig.successMessage({ name: group.name }), 'success')

    if (action === 'confirmed') {
      if (isComposedSummaryFullyConfirmed()) {
        closeComposedSummary()
      }
      return true
    }
    return true
  } catch (e) {
    showMessage(e.message || actionConfig.errorMessage, 'error')
    return false
  }
}

const updateComposedPharmacyStatus = async (group) => {
  const groupKey = group?.pharmacyId || group?.name
  const action = composedGroupActions.value[groupKey]
  if (!action) return
  loading.value = true
  try {
    await recordComposedPharmacyContactAction(group, action)
  } finally {
    loading.value = false
  }
}

const updateComposedRequestStatus = async () => {
  if (!composedSummaryRequest.value || !composedSummaryStatus.value) return
  loading.value = true
  try {
    const nextStatus = String(composedSummaryStatus.value || '').trim()
    await apiCall('PUT', `/api/order-requests/admin/${composedSummaryRequest.value.id}/status`, {
      status: nextStatus
    })
    if (selectedRequest.value?.id === composedSummaryRequest.value.id) {
      selectedRequest.value.status = nextStatus
    }
    await openComposedSummary({ id: composedSummaryRequest.value.id })
    await fetchRequests({ silent: true })
    await fetchStats({ silent: true })
    showMessage('Request status updated', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to update request status', 'error')
  } finally {
    loading.value = false
  }
}

const loadFulfillment = async (options = {}) => {
  const { silent = false, refreshLists = true } = options
  if (!selectedRequest.value || !canRunFulfillment(selectedRequest.value.status)) return
  loading.value = true
  try {
    const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
      const fullRequest = res.data.request || selectedRequest.value
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
    if (!silent) showMessage('Failed to load fulfillment details', 'error')
  } finally {
    loading.value = false
  }
}

const contactPharmacy = async (payload) => {
  if (!selectedRequest.value) return
  const pharm = payload?.pharmacy || payload
  const note = String(payload?.note || '').trim()
  if (!pharm) return

  // Open WhatsApp immediately
  window.open(pharm.whatsapp_url, '_blank')

  await recordPharmacyContactAction(pharm, 'contacted', { showSuccess: false, note })
}

const handlePharmacyContactStatus = async ({ pharmacy, action, note } = {}) => {
  await recordPharmacyContactAction(pharmacy, action, { note })
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

    // Only load fulfillment context when explicitly entering the confirming phase.
    if ((newStatus === 'confirming_with_pharm' || newStatus === 'processing') && canRunFulfillment(newStatus)) {
      const procRes = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
      nearbyPharmacies.value = procRes.data.nearby_pharmacies || []
    }

    await fetchRequests()
    await fetchStats()
    showMessage(statusRes?.message || 'Status updated and fulfillment data refreshed', 'success')

    if (newStatus === 'confirmed_in_pharm') {
      selectedRequest.value = null
      selectedStatus.value = ''
      adminNotes.value = ''
      nearbyPharmacies.value = []
      candidatePlans.value = []
      fulfillmentPlans.value = []
      allocationSummary.value = null
      pharmacyQueue.value = []
      nextRecommendedPharmacy.value = null
      logisticsAssessment.value = null
    }
  } catch (e) {
    showMessage(e.message || 'Failed to update status', 'error')
  } finally {
    loading.value = false
  }
}

const markRequestComposed = async () => {
  if (!selectedRequest.value || !canMarkRequestComposed.value) return
  loading.value = true
  try {
    const statusRes = await apiCall('PUT', `/api/order-requests/admin/${selectedRequest.value.id}/status`, {
      status: 'composed',
      admin_notes: adminNotes.value
    })
    selectedRequest.value.status = 'composed'
    selectedStatus.value = ''
    await fetchRequests()
    await fetchStats()
    showMessage(statusRes?.message || 'Request moved to Composed Orders', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to mark request composed', 'error')
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
      syncPharmacyCoverageFromQueue(pharmacyQueue.value)
    } catch (e) {
      if (!silent) showMessage('Failed to load fulfillment plans', 'error')
    }
}

const requestCustomerDecision = async (decisionType) => {
  if (!selectedRequest.value) return

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

    const successMessage = decisionType === 'partial_availability'
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
  const companyName = String(result?.company_name || '').trim()
  if (companyName) {
    parts.push(companyName)
  }
  const distanceKm = Number(result?.distance_km)
  if (Number.isFinite(distanceKm) && distanceKm >= 0) {
    parts.push(`${distanceKm.toFixed(1)} km`)
  }
  const unit = String(result?.unit || '').trim()
  if (unit) {
    parts.push(unit)
  }
  const availableQuantity = Number(result?.available_quantity)
  if (Number.isFinite(availableQuantity) && availableQuantity > 0) {
    parts.push(`${availableQuantity} in stock`)
  }
  const minPrice = Number(result?.min_price || 0)
  const maxPrice = Number(result?.max_price || 0)
  const directPrice = Number(result?.price || 0)
  if (directPrice > 0) {
    parts.push(`GHS ${directPrice.toFixed(2)}`)
  } else if (minPrice > 0 || maxPrice > 0) {
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

const fetchProductSearchResults = async (query, options = {}) => {
  const trimmedQuery = String(query || '').trim()
  if (trimmedQuery.length < 2) return []

  const coords = getRequestSearchCoordinates()
  const params = new URLSearchParams()
  params.append('search', trimmedQuery)
  params.append('limit', '8')

  const requestedUnit = String(options?.requestedUnit || '').trim()
  if (requestedUnit) {
    params.append('requestedUnit', requestedUnit)
  }

  const pharmacySearch = String(options?.pharmacySearch || '').trim()
  if (pharmacySearch) {
    params.append('pharmacySearch', pharmacySearch)
  }

  if (coords.hasCoords) {
    params.append('latitude', String(coords.lat))
    params.append('longitude', String(coords.lng))
    params.append('radiusKm', String(Number(selectedRequest.value?.sourcing_radius_km || 10) || 10))
  }

  const res = await apiCall('GET', `/api/inventory-analytics/search-products?${params.toString()}`)
  return Array.isArray(res?.data?.products) ? res.data.products : []
}

const searchAdminProducts = async (item) => {
  const query = String(item.product_search || '').trim()
  if (query.length < 2) {
    item.productSearchResults = []
    return
  }

  item.product_search_loading = true
  try {
    item.productSearchResults = await fetchProductSearchResults(query, {
      requestedUnit: item?.requested_unit || ''
    })
  } catch (e) {
    item.productSearchResults = []
  } finally {
    item.product_search_loading = false
  }
}

const onAdminProductInput = (item) => {
  item.showProductDropdown = true
  item.product_id = null
  const typedQuery = String(item.product_search || '').trim().toLowerCase()
  const selectedLabel = getSelectedSourceDraftLabel(item)
  item.selection_dirty = Boolean(typedQuery) && typedQuery !== selectedLabel
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
  const productIdentity = String(result?.product_id || '').trim()
  item.product_id = productIdentity || null
  item.selected_source_product_id = Number(result?.id || 0) || null
  item.selected_source_pharmacy_id = Number(result?.company_id || 0) || null
  item.selected_source_distance_km = Number.isFinite(Number(result?.distance_km)) ? Number(result.distance_km) : null
  if (
    Object.prototype.hasOwnProperty.call(item, 'requested_unit')
    && !Object.prototype.hasOwnProperty.call(item, 'allocation_pharmacy_id')
    && !String(item.requested_unit || '').trim()
  ) {
    item.requested_unit = String(result?.unit || '').trim().toLowerCase()
  }
  const selectedPharmacyId = Number(result?.company_id || 0)
  const selectedPrice = Number(result?.price || 0)
  item.selected_source_summary = {
    pharmacyId: selectedPharmacyId > 0 ? selectedPharmacyId : null,
    productName: label,
    name: String(result?.company_name || '').trim() || (selectedPharmacyId > 0 ? `Pharmacy ${selectedPharmacyId}` : 'Selected source'),
    distance: Number.isFinite(Number(result?.distance_km)) ? formatDistance(result.distance_km) : null,
    price: selectedPrice > 0 ? selectedPrice.toFixed(2) : null
  }
  item.selected_source_price = selectedPrice > 0 ? Number(selectedPrice.toFixed(2)) : null
  if (selectedPharmacyId > 0 && Object.prototype.hasOwnProperty.call(item, 'allocation_pharmacy_id')) {
    item.allocation_pharmacy_id = selectedPharmacyId
    item.allocation_quantity = getRequestedQuantity(item)
    item.allocation_type = 'exact'
    item.allocation_status = 'confirmed'
    item.allocation_unit_price = ''
  }
  if (selectedPrice > 0 && Object.prototype.hasOwnProperty.call(item, 'edit_price')) {
    const normalizedPrice = Number(selectedPrice.toFixed(2))
    item.edit_price = normalizedPrice
  }
  item.selection_dirty = false
  item.showProductDropdown = false
  item.productSearchResults = []
  
  // Automatically save allocation upon clicking chosen medication
  if (item === activeRequestItem.value) {
    createAllocationForItem(item, { autoAdvance: false })
  }
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
    alternativeModal.value.productSearchResults = await fetchProductSearchResults(query, {
      requestedUnit: alternativeModal.value.item?.requested_unit || ''
    })
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

  const selectedPharmacyId = Number(result?.company_id || 0)
  if (selectedPharmacyId > 0) {
    alternativeModal.value.pharmacy_id = selectedPharmacyId
  }

  const price = Number(result?.price || 0)
  if (price > 0 && (alternativeModal.value.price === '' || alternativeModal.value.price === null || alternativeModal.value.price === undefined)) {
    alternativeModal.value.price = Number(price.toFixed(2))
  }

  alternativeModal.value.showProductDropdown = false
  alternativeModal.value.productSearchResults = []
}

const closeAlternativeProductDropdown = () => {
  setTimeout(() => {
    alternativeModal.value.showProductDropdown = false
  }, 160)
}

const saveAdminNewItem = async () => {
  if (!selectedRequest.value || !canAddAdminItem.value) return
  if (hasPrescriptionAttachments.value && !canSavePrescriptionAdminSelection.value) {
    showMessage('Choose a pharmacy product with a price before saving this prescription selection', 'error')
    return
  }

  loading.value = true
  try {
    const quantity = Number(adminNewItem.quantity || 1)

    if (hasPrescriptionAttachments.value) {
      const selectedPrice = Number(adminNewItem.selected_source_price || 0)
      if (!Number.isFinite(selectedPrice) || selectedPrice <= 0) {
        throw new Error('Choose a pharmacy product with a valid price before saving')
      }

      const productName = String(adminNewItem.product_search || '').trim()
      await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/items`, {
        product_id: adminNewItem.product_id || null,
        product_name: productName,
        requested_unit: String(adminNewItem.requested_unit || '').trim().toLowerCase() || null,
        quantity,
        requested_quantity: quantity,
        source_type: 'prescription',
        source_pharmacy_id: adminNewItem.selected_source_pharmacy_id || null,
        source_product_id: adminNewItem.selected_source_product_id || null,
        source_distance_km: adminNewItem.selected_source_distance_km || null,
        notes: {
          prescription_image_index: Number(activePrescriptionImageIndex.value || 0) + 1,
          prescription_image_url: activePrescriptionImageUrl.value || null
        },
        unit_price: selectedPrice,
        marked_up_price: selectedPrice,
        line_total: Number((selectedPrice * quantity).toFixed(2))
      })
    } else {
      const productName = String(adminNewItem.product_search || '').trim()
      await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/items`, {
        product_id: adminNewItem.product_id || null,
        product_name: productName,
        requested_unit: String(adminNewItem.requested_unit || '').trim().toLowerCase() || null,
        quantity,
        requested_quantity: quantity,
        source_type: 'admin',
        notes: null
      })
    }

    resetAdminNewItem()

    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    selectedRequest.value = detailRes.data
    selectedStatus.value = detailRes.data.status || ''
    adminNotes.value = detailRes.data.admin_notes || ''
    hydrateItemUiState(selectedRequest.value.items || [])
    nearbyPharmacies.value = []
    candidatePlans.value = []
    fulfillmentPlans.value = []
    allocationSummary.value = null
    pharmacyQueue.value = []
    nextRecommendedPharmacy.value = null
    logisticsAssessment.value = null

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
  const option = getRecommendedSourcingOption(item)
  if (!option) {
    showMessage('The next follow-up source does not cover this item', 'info')
    return
  }

  selectSourcingOption(
    item,
    option,
    {
      successMessage: `Prefilled ${option.name} for ${item.product_name} - click Save Allocation to confirm`
    }
  )
}

const prefillNextRecommendedSource = () => {
  if (!selectedRequest.value || !Array.isArray(selectedRequest.value.items) || !nextRecommendedPharmacy.value) return

  let updatedCount = 0
  for (const item of selectedRequest.value.items) {
    const option = getRecommendedSourcingOption(item)
    if (!option) continue

    const currentSelection = Number(item.allocation_pharmacy_id || item.source_pharmacy_id || 0)
    const currentStatus = String(item.sourcing_status || item.item_status || '').toLowerCase()
    const shouldSkip =
      currentSelection === Number(option.pharmacyId || 0)
      && ['allocated', 'available', 'confirmed', 'ready_to_order', 'ordered'].includes(currentStatus)

    if (shouldSkip) continue

    selectSourcingOption(item, option, { silent: true })
    updatedCount += 1
  }

  if (updatedCount === 0) {
    showMessage('No pending items matched the next follow-up source', 'info')
    return
  }

  const label = nextRecommendedPharmacy.value.pharmacy_name || `Pharmacy ${nextRecommendedPharmacy.value.pharmacy_id}`
  showMessage(`Prefilled ${label} for ${updatedCount} item${updatedCount === 1 ? '' : 's'} - save allocations to confirm`, 'success')
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
  const exactUnitPrice = source.edit_price === '' || source.edit_price === null || source.edit_price === undefined
    ? (source.unit_price === '' || source.unit_price === null || source.unit_price === undefined ? null : Number(source.unit_price))
    : Number(source.edit_price)

  if (allocationType === 'substitute' && (!Number.isFinite(allocationUnitPrice) || allocationUnitPrice <= 0)) {
    throw new Error('Alternative price must be greater than 0')
  }

  return {
    pharmacy_id: pharmacyId,
    allocated_quantity: quantity,
    allocation_type: allocationType,
    substitute_name: allocationType === 'substitute' ? String(source.substitute_name || '').trim() : null,
    substitute_note: allocationType === 'substitute' ? String(source.substitute_note || '').trim() : null,
    unit_price: allocationType === 'substitute'
      ? allocationUnitPrice
      : (Number.isFinite(exactUnitPrice) && exactUnitPrice > 0 ? exactUnitPrice : null),
    status: 'confirmed'
  }
}

const refreshSelectedRequestState = async () => {
  if (!selectedRequest.value) return
  const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
  selectedRequest.value = detailRes.data
  adminNotes.value = selectedRequest.value.admin_notes || ''
  hydrateItemUiState(selectedRequest.value.items || [])
  nearbyPharmacies.value = []
  candidatePlans.value = []
  fulfillmentPlans.value = []
  allocationSummary.value = null
  pharmacyQueue.value = []
  nextRecommendedPharmacy.value = null
  logisticsAssessment.value = null
}

const refreshSelectedRequestDetails = async () => {
  loading.value = true
  try {
    await refreshSelectedRequestState()
    showMessage('Request refreshed', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to refresh request', 'error')
  } finally {
    loading.value = false
  }
}

const applyCandidatePlanNow = async (plan) => {
  if (!selectedRequest.value) return

  await applyCandidatePlan(plan)

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
    }

    await refreshSelectedRequestState()
    showMessage(`Applied ${plan.label.toLowerCase()} as confirmed allocations`, 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to apply suggested plan', 'error')
  } finally {
    loading.value = false
  }
}

const createAllocationForItem = async (item, options = { autoAdvance: true }) => {
  if (!selectedRequest.value) return

  if (item?.selection_dirty) {
    showMessage('Pick one of the numbered pharmacy choices before saving this selection', 'error')
    return
  }

  loading.value = true
  try {
    if (
      Number(item?.allocation_pharmacy_id || 0) > 0
      || Number(item?.selected_source_product_id || 0) > 0
      || item?.selected_source_distance_km !== null
    ) {
      await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
        source_pharmacy_id: Number(item?.allocation_pharmacy_id || 0) || null,
        source_product_id: Number(item?.selected_source_product_id || 0) || null,
        source_distance_km: item?.selected_source_distance_km ?? null
      })
    }

    const payload = buildAllocationPayload(item)
    await apiCall('POST', `/api/order-requests/admin/items/${item.id}/allocations`, payload)

    item.showProductDropdown = false
    item.productSearchResults = []

    await refreshSelectedRequestState()
    
    if (options.autoAdvance) {
      advanceToNextRequestItem(item.id)
    }
    
    showMessage('Selection saved', 'success')
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
  const sourcePharmacyId = Number(item?.allocation_pharmacy_id || item?.source_pharmacy_id || 0)
  const sourceProductId = Number(item?.selected_source_product_id || item?.source_product_id || 0)
  const sourceDistanceKm = item?.selected_source_distance_km ?? item?.source_distance_km ?? null
  const requestedUnit = String(item?.requested_unit || '').trim().toLowerCase()
  const quantity = Number(item?.allocation_quantity || item?.requested_quantity || item?.quantity || 1)
  const unitPrice = item?.edit_price === '' || item?.edit_price === null || item?.edit_price === undefined
    ? Number(item?.unit_price || item?.marked_up_price || 0)
    : Number(item.edit_price)

  if (!Number.isInteger(sourcePharmacyId) || sourcePharmacyId <= 0) {
    showMessage('Choose a pharmacy selection before saving', 'error')
    return
  }

  if (!Number.isInteger(sourceProductId) || sourceProductId <= 0) {
    showMessage('Choose a saved pharmacy product before saving', 'error')
    return
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    showMessage('Quantity must be greater than 0', 'error')
    return
  }

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    showMessage('Customer price must be a valid amount', 'error')
    return
  }

  loading.value = true
  try {
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      source_pharmacy_id: sourcePharmacyId,
      source_product_id: sourceProductId,
      source_distance_km: sourceDistanceKm,
      requested_unit: requestedUnit,
      quantity,
      requested_quantity: quantity,
      unit_price: unitPrice,
      item_status: 'available'
    })

    await refreshSelectedRequestState()
    showMessage('Selection updated', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to update selection', 'error')
  } finally {
    loading.value = false
  }
}

const clearSavedSelection = async (item) => {
  if (!item?.id) return

  loading.value = true
  try {
    const isPrescriptionSelection = String(item?.source_type || '').trim().toLowerCase() === 'prescription'

    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      clear_selection: true,
      remove_saved_selection: isPrescriptionSelection
    })

    await refreshSelectedRequestState()
    showMessage('Saved selection cleared', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to clear saved selection', 'error')
  } finally {
    loading.value = false
  }
}

const deleteRequestItem = async (item) => {
  if (!item?.id) return

  const confirmed = window.confirm(`Delete "${item.product_name}" from this request?`)
  if (!confirmed) return

  loading.value = true
  try {
    await apiCall('DELETE', `/api/order-requests/admin/items/${item.id}`)
    await refreshSelectedRequestState()
    await fetchRequests({ silent: true })
    await fetchStats({ silent: true })
    showMessage('Request item deleted', 'success')
  } catch (e) {
    showMessage(e.message || 'Failed to delete request item', 'error')
  } finally {
    loading.value = false
  }
}

// Helpers
const formatStatus = (status) => (status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'
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

onMounted(() => {
  fetchRequests()
  fetchStats()
  requestPollTimer = window.setInterval(pollRequestList, REQUEST_POLL_MS)
})

onUnmounted(() => {
  if (requestPollTimer) {
    clearInterval(requestPollTimer)
    requestPollTimer = null
  }
})

definePageMeta({
  middleware: ['admin-auth'],
  layout: 'admin-layout',
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
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid transparent;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card:has(.stat-icon.pending) {
  border-left-color: #f59e0b;
}

.stat-card:has(.stat-icon.processing) {
  border-left-color: #3b82f6;
}

.stat-card:has(.stat-icon.completed) {
  border-left-color: #10b981;
}

.stat-card:has(.stat-icon.total) {
  border-left-color: #8b5cf6;
}

.stat-icon {
  font-size: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.pending {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.processing {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.completed {
  background: #dcfce7;
  color: #059669;
}

.stat-icon.total {
  background: #f3e8ff;
  color: #7c3aed;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  align-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid #e6ebf5;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.status-tabs-bar {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  padding-bottom: 0.15rem;
}

.status-tabs-label {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 0.5rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 36px;
  padding: 0.45rem 0.78rem;
  border-radius: 999px;
  border: 1px solid #dbe4ee;
  background: #f8fafc;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.status-tab-pill:hover {
  transform: translateY(-1px);
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.status-tab-pill.active {
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #93c5fd;
  color: #1d4ed8;
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.12);
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
  min-width: 260px;
}

.search-input {
  flex: 1;
}

.filter-select {
  width: 220px;
  background: #ffffff;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  font-size: 0.875rem;
  letter-spacing: 0.01em;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.45);
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
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  font-size: 0.875rem;
}

.btn-secondary:hover:not(:disabled) {
  background: #f5f7fa;
  border-color: #9ca3af;
  color: #1f2937;
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
  font-weight: 700;
  color: #6b7280;
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

.table-row-openable {
  outline: none;
}

.table-row-openable:hover td,
.table-row-openable:focus-visible td {
  background: #f0f4ff !important;
  cursor: pointer;
}

.table-row-opening td {
  background: #eef4ff !important;
  box-shadow: inset 0 1px 0 rgba(99, 102, 241, 0.08), inset 0 -1px 0 rgba(99, 102, 241, 0.08);
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 2rem !important;
  color: #9ca3af;
}

.request-number {
  font-weight: 700;
  color: #667eea;
  font-family: monospace;
  font-size: 0.875rem;
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

.customer-phone--whatsapp {
  display: inline-flex;
}

.customer-phone-link,
.workspace-overview-phone-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: inherit;
  text-decoration: none;
}

.customer-phone-link:hover,
.workspace-overview-phone-link:hover {
  color: #128c7e;
}

.workspace-overview-phone {
  display: inline-flex;
}

.customer-whatsapp-icon,
.workspace-whatsapp-icon {
  font-size: 0.95rem;
  line-height: 1;
  color: #25D366;
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
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.inline-loader-spinner {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 9999px;
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-top-color: #4f46e5;
  animation: inlineLoaderSpin 0.7s linear infinite;
}

@keyframes inlineLoaderSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

.status-badge.composed {
  background: #ede9fe;
  color: #6d28d9;
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

.modal-content--workspace {
  position: relative;
  border-radius: 22px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
}

.modal-elevated {
  border: 1px solid #e2e8f0;
}

.modal-lg {
  max-width: 100%;
}

/* Header */
.modal-header {
  padding: 1.15rem 1.5rem;
  border-top: 4px solid #1e3a8a;
  border-bottom: 1px solid #e9edf4;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 32%),
    linear-gradient(90deg, #ffffff 0%, #f6f9ff 55%, #edf4ff 100%);
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

.modal-header h3 {
  font-size: 1.08rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-body {
  padding: 1rem 1.2rem 1.15rem;
  display: grid;
  gap: 0.75rem;
}

.workspace-overview-card {
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  padding: 0.72rem 0.8rem;
  background:
    radial-gradient(circle at top right, rgba(147, 197, 253, 0.14), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
}

.workspace-overview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.55rem;
}

.workspace-overview-headline {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 0.7rem;
}

.workspace-overview-head h4 {
  margin: 0;
  font-size: 0.9rem;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.workspace-overview-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.24rem 0.55rem;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.workspace-overview-label,
.workspace-overview-key {
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.workspace-overview-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem 0.55rem;
}

.workspace-overview-item {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
}

.workspace-overview-item strong {
  color: #0f172a;
  font-size: 0.82rem;
  line-height: 1.25;
  word-break: break-word;
}

/* Workspace layout */
.workspace-shell {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 40rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.workspace-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.workspace-main-card {
  width: 100%;
}

/* Sections */
.section-card {
  padding: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.section-emphasis {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: none;
  padding: 0;
}

.section-head {
  padding: 1rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fdfdfd;
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

/* Three Pane Grid Setup */
.workspace-board-grid {
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  min-height: 500px;
  gap: 0;
}

.request-items-pane {
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.workspace-search-card {
  border-right: 1px solid #e5e7eb;
  background: #fcfcfc;
  display: flex;
  flex-direction: column;
}

.workspace-selection-card {
  background: #ffffff;
  display: flex;
  flex-direction: column;
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
  margin: -0.9rem -1rem 0.8rem;
  padding: 0.88rem 1.05rem 0.78rem;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  border-radius: 16px 16px 0 0;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.65);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-bottom-color: #dbe4ef;
}

.section-title {
  margin: 0;
  font-size: 0.8rem;
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

.workspace-topstrip--hero {
  padding: 0.95rem 1rem;
  border-left-color: #93c5fd;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #f8fbff 52%, #eef5ff 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.item-product-hint {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.items-intake-card--compact {
  padding: 0.72rem 0.82rem;
  border-radius: 16px;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.1), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.items-intake-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  margin-bottom: 0.5rem;
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
  margin: 0;
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.35;
}

.items-intake-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 120px auto;
  gap: 0.55rem;
  align-items: center;
}

.items-intake-search {
  min-width: 0;
  max-width: none;
}

.items-intake-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  white-space: nowrap;
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

.items-unit-select {
  min-width: 0;
}

.items-qty-stepper {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px;
  gap: 0.35rem;
  align-items: center;
}

.items-qty-btn {
  height: 34px;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #ffffff;
  color: #334155;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.items-qty-btn:hover:not(:disabled) {
  border-color: #c7d2fe;
  background: #f8fbff;
  color: #4338ca;
}

.items-qty-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.allocation-mini {
  text-align: center;
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

.product-search-result--table {
  display: grid;
  grid-template-columns: 34px minmax(0, 1.3fr) minmax(0, 1fr) 90px 120px 100px;
  gap: 0.5rem;
  align-items: center;
}

.product-search-choice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.simple-search-results-head--compact {
  display: grid;
  grid-template-columns: 34px minmax(0, 1.3fr) minmax(0, 1fr) 90px 120px 100px;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.7rem;
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

.selection-preview-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.selection-preview-strip--add {
  margin-top: 0.55rem;
  margin-bottom: 0.15rem;
}

.selection-preview-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.selection-preview-close:hover:not(:disabled) {
  border-color: #fda4af;
  background: #fff1f2;
  color: #be123c;
  transform: translateY(-1px);
}

.selection-preview-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.composed-summary-modal {
  width: min(1040px, 100%);
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

.composed-summary-content {
  grid-template-columns: 1fr;
  gap: 1rem;
  padding-bottom: 1.2rem;
  overflow-y: auto;
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
  display: grid;
  gap: 0.9rem;
  grid-template-columns: minmax(250px, 0.78fr) minmax(0, 1.22fr);
}

.nested-form-panel {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  padding: 0.95rem 1rem 1rem;
}

.nested-form-panel--source {
  height: fit-content;
}

.nested-form-panel-head {
  margin-bottom: 0.9rem;
}

.nested-form-panel-head p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

.nested-panel-label {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.52rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.4rem 1.4rem;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.3) 0%, #ffffff 100%);
  flex-shrink: 0;
}

@media (max-width: 760px) {
  .workspace-nested-content,
  .nested-form-sections,
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
    flex-direction: column-reverse;
  }

  .workspace-nested-actions .btn-secondary,
  .workspace-nested-actions .btn-primary {
    width: 100%;
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

.allocation-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: #f4ecfb;
  border: 1px solid #dfd3ea;
  border-radius: 8px;
  font-size: 0.85rem;
}
.allocation-display-label {
  font-size: 0.7rem;
  color: #5d4679;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.allocation-display strong {
  color: #4F217A;
  font-weight: 700;
}
.allocation-display-qty {
  color: #6b21a8;
  font-size: 0.8rem;
  margin-left: auto;
}
.allocation-reassign-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
}
.allocation-reassign-copy {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  font-size: 0.8rem;
  color: #1e3a8a;
}
.allocation-reassign-meta {
  font-size: 0.74rem;
  color: #475569;
}
.allocation-empty {
  color: #9ca3af;
  justify-content: center;
}
.alloc-source-picker {
  position: relative;
  margin-top: 0.35rem;
}
.alloc-source-picker--has-source {
  margin-top: 0.4rem;
}
.alloc-source-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid #d8b4fe;
  border-radius: 999px;
  background: #fdf4ff;
  color: #5b21b6;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.28rem 0.65rem;
  cursor: pointer;
  transition: all 0.14s;
}
.alloc-source-btn:hover:not(:disabled) {
  border-color: #c084fc;
  background: #f5e8ff;
}
.alloc-source-btn--empty {
  width: 100%;
  justify-content: center;
}
.alloc-source-chevron {
  font-size: 1rem;
  line-height: 1;
  color: #a855f7;
}
.alloc-sourcing-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(79, 33, 122, 0.13);
  z-index: 120;
  overflow: hidden;
}
.alloc-sourcing-dropdown-empty {
  padding: 0.65rem 0.9rem;
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
}
.alloc-sourcing-dropdown-option {
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
.alloc-sourcing-dropdown-option:last-child {
  border-bottom: none;
}
.alloc-sourcing-dropdown-option:hover {
  background: #faf5ff;
}
.alloc-sdo-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #4F217A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.alloc-sdo-meta {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.15rem;
}
.alloc-sdo-dist {
  font-size: 0.72rem;
  color: #9ca3af;
}
.alloc-sdo-qty {
  font-size: 0.72rem;
  color: #7c3aed;
  font-weight: 600;
}
.alloc-sdo-price {
  font-size: 0.72rem;
  color: #059669;
  font-weight: 700;
  margin-left: auto;
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
    font-size: 0.68rem;
    font-weight: 700;
}

.items-head-copy {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
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

.items-decision-state {
  margin: 0;
  font-size: 0.76rem;
  max-width: 260px;
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

.items-composer-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1.15rem;
  align-items: start;
}

.items-composer-layout--workspace {
  align-items: stretch;
}

.workspace-board-grid {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr) minmax(320px, 380px);
  gap: 1rem;
  align-items: start;
}

.pane-eyebrow {
  display: inline-block;
  margin-bottom: 0.2rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c3aed;
}

.request-items-pane,
.item-composer-pane {
  min-width: 0;
}

.request-items-pane {
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(147, 197, 253, 0.12), transparent 32%),
    linear-gradient(180deg, #fcfdff 0%, #f6f9fe 100%);
  padding: 1rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 10px 24px rgba(15, 23, 42, 0.05);
  position: sticky;
  top: 0.75rem;
}

.prescription-reference-card {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.prescription-reference-head {
  margin-bottom: 0;
}

.prescription-reference-head p {
  margin: 0.2rem 0 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: #64748b;
}

.prescription-reference-list {
  display: grid;
  gap: 0.5rem;
}

.prescription-reference-item {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 0.7rem;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  font: inherit;
  transition: border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}

.prescription-reference-item.request-item-row {
  grid-template-columns: 28px 54px minmax(0, 1fr) auto;
  gap: 0.65rem;
  padding: 0.68rem 0.7rem;
}

.prescription-reference-item:hover {
  border-color: #c7d2fe;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.08);
}

.prescription-reference-image {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #dbe4ef;
  background: #f8fafc;
}

.prescription-reference-copy {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.prescription-reference-copy strong {
  font-size: 0.82rem;
  color: #111827;
  line-height: 1.3;
}

.prescription-reference-copy span {
  font-size: 0.72rem;
  color: #64748b;
}

.prescription-reference-open {
  align-self: center;
  border: none;
  border-radius: 999px;
  padding: 0.28rem 0.62rem;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.image-preview-modal {
  width: min(920px, 100%);
  max-height: min(88vh, 920px);
}

.image-preview-head {
  padding-bottom: 0.9rem;
}

.image-preview-body {
  padding: 0.9rem 1.2rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: auto;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.12), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.image-preview-full {
  display: block;
  max-width: 100%;
  max-height: min(72vh, 780px);
  width: auto;
  height: auto;
  border-radius: 18px;
  border: 1px solid #dbe4ef;
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
}

.request-items-pane-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.request-items-pane-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.request-items-pane-head h5,
.composer-card-head h5 {
  margin: 0;
  font-size: 0.92rem;
  color: #111827;
}

.request-items-pane-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  min-width: 30px;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
}

.request-items-list {
  display: grid;
  gap: 0.35rem;
}

.request-items-list--workspace {
  max-height: 34rem;
  overflow: auto;
  padding-right: 0.15rem;
}

.request-items-empty-list {
  border: 1px dashed #d6def5;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfcff 0%, #f8fbff 100%);
  padding: 0.95rem 1rem;
  font-size: 0.78rem;
  line-height: 1.55;
  color: #64748b;
}

.request-items-empty-list--reference {
  background: linear-gradient(180deg, #fdfcff 0%, #f6f3ff 100%);
  border-color: #d9ccff;
  color: #5b5b6f;
}

.request-item-row {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
  padding: 1rem 1.25rem;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.request-item-row--deletable {
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
}

.request-item-row:hover {
  background: #f9fafb;
}

.request-item-row.active {
  background: #eff6ff;
  border-left: 3px solid #4f46e5;
  padding-left: calc(1.25rem - 3px);
  position: relative;
  z-index: 1;
}

.request-item-row-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 800;
}

.request-item-row-main {
  min-width: 0;
  display: grid;
  gap: 0.28rem;
}

.request-item-row-main strong,
.simple-composer-head h5 {
  font-size: 0.88rem;
  color: #111827;
  line-height: 1.35;
  margin: 0;
}

.request-item-row-meta,
.simple-item-reference,
.simple-selection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.7rem;
  color: #64748b;
  font-size: 0.72rem;
}

.item-composer-pane {
  display: grid;
  gap: 0.9rem;
}

.workspace-search-card,
.workspace-selection-card {
  border: 1px solid #dbe4ef;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.16), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  padding: 1.1rem 1.1rem 1rem;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
  min-width: 0;
  overflow: hidden;
}

.workspace-selection-card--wide {
  grid-column: 2 / 4;
}

.workspace-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.workspace-panel-head h5,
.workspace-selection-card .simple-composer-head h5 {
  margin: 0;
  font-size: 0.92rem;
  color: #0f172a;
}

.workspace-panel-subcopy {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
}

.starter-workspace-copy {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  line-height: 1.55;
  color: #64748b;
}

.starter-workspace-form {
  display: grid;
  gap: 0.75rem;
}

.workspace-search-card--starter {
  display: flex;
  flex-direction: column;
  grid-column: 2 / 4;
  min-height: 20rem;
}

.starter-workspace-search {
  min-width: 0;
  max-width: none;
}

.starter-workspace-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.7rem;
}

.starter-control-group {
  display: grid;
  gap: 0.32rem;
}

.starter-control-group--qty {
  min-width: 142px;
}

.starter-control-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.starter-unit-select {
  min-width: 150px;
}

.starter-qty-stepper {
  min-width: 136px;
}

.starter-workspace-actions {
  margin-left: auto;
}

.starter-workspace-note {
  margin-top: auto;
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem 0.95rem;
  border: 1px dashed #d6def5;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfcff 0%, #f4f7ff 100%);
}

.starter-workspace-note-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.starter-workspace-note p {
  margin: 0;
  color: #5b6476;
  font-size: 0.8rem;
  line-height: 1.55;
}

.simple-composer-panel {
  border: 1px solid #dbe4ef;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.16), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  padding: 1.1rem 1.1rem 1rem;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
}

.simple-composer-empty {
  display: flex;
  min-height: 18rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  border: 1px dashed #d6def5;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfcff 0%, #f4f7ff 100%);
  padding: 1.5rem;
  color: #5b6476;
}

.simple-composer-empty h5 {
  margin: 0;
  font-size: 1.15rem;
  color: #111827;
}

.simple-composer-empty p {
  margin: 0;
  max-width: 32rem;
  line-height: 1.6;
}

.workspace-board-empty {
  grid-column: 2 / 4;
  min-height: 22rem;
}

.simple-composer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.simple-inline-edit {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 0.9rem;
}

.composer-inline-actions,
.composer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.simple-search-block {
  display: grid;
  gap: 0.45rem;
  margin: 0.9rem 0;
}

.workspace-search-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 13rem;
  border: 1px dashed #dbe4ef;
  border-radius: 14px;
  background: #f8fbff;
  color: #64748b;
  text-align: center;
  padding: 1rem;
}

.workspace-search-empty {
  min-height: 9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-field-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.composer-search-input {
  min-height: 44px;
  font-size: 0.9rem;
}

.simple-search-results {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: auto;
  background: #ffffff;
  max-height: 24rem;
}

.simple-search-results-head,
.simple-search-result-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1.65fr) minmax(0, 1.15fr) minmax(72px, 0.7fr) minmax(56px, 0.55fr) minmax(76px, 0.7fr);
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.simple-search-results-head {
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  position: sticky;
  top: 0;
  z-index: 1;
}

.simple-search-result-row {
  width: 100%;
  text-align: left;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #ffffff;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 0.875rem;
  color: #111827;
}

.simple-search-results-head > span,
.simple-search-result-row > span {
  min-width: 0;
}

.simple-search-results-head > span:nth-child(4),
.simple-search-results-head > span:nth-child(5),
.simple-search-results-head > span:nth-child(6),
.simple-search-result-row > span:nth-child(4),
.simple-search-result-row > span:nth-child(5),
.simple-search-result-row > span:nth-child(6) {
  justify-self: end;
  text-align: right;
}

.simple-search-result-row > span:nth-child(2),
.simple-search-result-row > span:nth-child(3) {
  overflow-wrap: anywhere;
}

.search-choice-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  border: 1px solid #c7d2fe;
  color: #4338ca;
  font-size: 0.78rem;
  font-weight: 800;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.simple-search-result-row:last-child {
  border-bottom: none;
}

.simple-search-result-row:hover {
  background: #f9fafb;
}

.simple-selection-block {
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #f8fafc 100%);
}

.simple-selection-line {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  align-items: center;
}

.simple-selection-line strong {
  color: #111827;
  font-size: 0.9rem;
}

.selection-compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.saved-selection-list-shell {
  display: grid;
  gap: 0.7rem;
  margin-top: 0.9rem;
  padding: 0.8rem 0.85rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.saved-selection-list-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.saved-selection-list-head p {
  margin: 0.18rem 0 0;
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.45;
}

.saved-selection-list {
  display: grid;
  gap: 0.45rem;
  max-height: none;
  overflow: visible;
  padding-right: 0;
}

.saved-selection-row {
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
}

.saved-selection-row-clear {
  margin-left: 0.25rem;
  flex-shrink: 0;
}

.workspace-selection-card--prescription .saved-selection-row {
  cursor: default;
}

.workspace-selection-card--prescription .saved-selection-row:hover {
  transform: none;
  border-color: #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
  box-shadow: none;
}

.saved-selection-empty {
  border: 1px dashed #d6def5;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfcff 0%, #f8fbff 100%);
  padding: 0.8rem 0.85rem;
  font-size: 0.74rem;
  line-height: 1.5;
  color: #64748b;
}

.saved-selection-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.78rem 0.9rem;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.saved-selection-total strong {
  color: #0f172a;
  font-size: 0.96rem;
  letter-spacing: -0.02em;
}

.selection-compare-card {
  display: grid;
  gap: 0.45rem;
  padding: 0.95rem 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.selection-compare-card strong {
  margin: 0;
  font-size: 1rem;
  line-height: 1.35;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.selection-card-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
}

.selection-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.55rem;
  font-size: 0.75rem;
  color: #64748b;
}

.selection-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}

.selection-card-topline-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.selection-link-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selection-link-badge--draft {
  background: #ecfeff;
  color: #0f766e;
}

.selection-card-pharmacy {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.selection-card-product-line {
  display: grid;
  gap: 0.15rem;
}

.selection-card-inline-editor {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.2rem;
  padding-top: 0.55rem;
  border-top: 1px solid #e2e8f0;
}

.selection-mini-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px minmax(0, 1.3fr);
  gap: 0.55rem;
  align-items: end;
  margin-top: 0.15rem;
}

.selection-mini-grid--compact {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  margin-top: 0;
}

.selection-mini-field {
  display: grid;
  gap: 0.28rem;
  min-width: 0;
}

.selection-mini-field > span {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.selection-mini-input {
  min-height: 2.45rem;
  padding: 0.4rem 0.65rem;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 700;
}

.selection-mini-input--qty {
  text-align: center;
}

.selection-mini-field--price {
  min-width: 0;
  flex: 1 1 100%;
}

.selection-mini-price {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.18rem 0.5rem 0.18rem 0.55rem;
  border: 1px solid #dbe4ef;
  border-radius: 12px;
  background: #f8fafc;
}

.selection-mini-price > span {
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
}

.selection-mini-input--price {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0.25rem 0.2rem;
  min-height: 1.7rem;
}

.selection-card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.7rem;
  margin-top: 0.1rem;
}

.selection-card-footer .selection-mini-field--price {
  flex: 1 1 12rem;
}

.selection-card-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.1rem;
  padding: 0.52rem 1rem;
  border: 1px solid #6d28d9;
  border-radius: 10px;
  background: linear-gradient(135deg, #6d28d9, #4f46e5);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.16);
  flex-shrink: 0;
}

.selection-card-save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.selection-preview-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.15rem;
}

.selection-preview-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.8rem;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;
}

.selection-preview-chip--price {
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  border-color: #c7d2fe;
  color: #4338ca;
}

.selection-compare-card--selected {
  border-color: #c7d2fe;
  background:
    radial-gradient(circle at top right, rgba(129, 140, 248, 0.16), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
  box-shadow: 0 14px 26px rgba(99, 102, 241, 0.08);
}

.selection-compare-card--draft {
  border-color: #99f6e4;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.16), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f6fffd 100%);
  box-shadow: 0 14px 24px rgba(20, 184, 166, 0.08);
}

.selection-compare-card--empty {
  border-style: dashed;
  background: linear-gradient(180deg, #fbfcff 0%, #f8fafc 100%);
}

.selection-compare-card--empty p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: #64748b;
}

.selection-editor-panel {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.85rem;
  padding: 0.8rem 0.85rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
}

.selection-editor-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
}

.selection-editor-hint {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 500;
  line-height: 1.45;
}

.selection-guard-rail {
  margin-top: 0.9rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  color: #475569;
  font-size: 0.78rem;
  line-height: 1.55;
  font-weight: 600;
}

.composer-controls-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 0.45rem 0 0.35rem;
}

.composer-controls-grid--prescription {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.composer-field {
  display: grid;
  gap: 0.3rem;
}

.composer-field label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.composer-field--unit {
  grid-column: 1 / -1;
}

.composer-field--quantity,
.composer-field--price {
  min-width: 0;
}

.workspace-selection-card--prescription .selection-editor-panel {
  background:
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.05), transparent 34%),
    #ffffff;
}

.workspace-selection-card--prescription .composer-field .form-control,
.workspace-selection-card--prescription .items-qty-stepper {
  min-height: 2.45rem;
}

.workspace-selection-card--prescription .composer-field .form-control {
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}

.workspace-selection-card--prescription .composer-field--price .form-control {
  min-width: 0;
}

.workspace-selection-card--prescription .items-qty-stepper {
  gap: 0.35rem;
  min-width: 0;
  flex-wrap: nowrap;
}

.workspace-selection-card--prescription .items-qty-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
}

.workspace-selection-card--prescription .allocation-mini {
  min-width: 0;
  width: 3.75rem;
  text-align: center;
}

.workspace-selection-card--prescription .composer-actions {
  margin-top: 0.1rem;
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

.workspace-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
  gap: 1rem;
}

.queue-card {
  display: grid;
  gap: 0.9rem;
}

.queue-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.queue-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 0.65rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.74rem;
  font-weight: 700;
}

.queue-status-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
}

.queue-totals-btn {
  width: 100%;
  justify-content: center;
}

.paid-breakdown-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-bottom: 0.9rem;
  color: #374151;
  font-size: 0.86rem;
}

.composed-summary-hero {
  display: grid;
  gap: 0.9rem;
}

.composed-summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.composed-stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.78rem;
  border: 1px solid #dbe4ef;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #334155;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.composed-stat-label,
.composed-section-kicker {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6366f1;
}

.composed-stat-chip strong {
  color: #0f172a;
  font-size: 0.86rem;
}

.composed-pharmacy-summary {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

.composed-request-status-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px) auto;
  gap: 0.65rem;
  align-items: center;
  margin: 0;
  padding: 0.95rem 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  background:
    radial-gradient(circle at top right, rgba(147, 197, 253, 0.09), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.composed-request-status-copy {
  display: grid;
  gap: 0.2rem;
}

.composed-request-status-copy p {
  margin: 0;
  font-size: 0.84rem;
  color: #64748b;
  line-height: 1.5;
}

.composed-request-status-select {
  min-width: 220px;
}

.composed-pharmacy-card {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.12), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  padding: 1rem;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
}

.composed-pharmacy-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.composed-pharmacy-identity {
  display: grid;
  gap: 0.45rem;
}

.composed-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.75rem;
  align-items: center;
  color: #334155;
  font-size: 0.88rem;
}

.composed-info-row strong {
  color: #111827;
  font-size: 0.98rem;
}

.composed-info-label {
  min-width: 68px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7c3aed;
}

.composed-pharmacy-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.55rem;
}

.composed-pharmacy-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.75rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #64748b;
}

.composed-meta-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 700;
}

.composed-meta-chip--value {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #166534;
}

.composed-whatsapp-btn {
  min-width: fit-content;
}

.composed-whatsapp-missing {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 0.75rem;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.composed-status-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.composed-status-select {
  min-width: 150px;
}

.composed-item-list {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
}

.composed-item-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 90px 90px;
  gap: 0.75rem;
  align-items: center;
  padding: 0.68rem 0.72rem;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #fdfefe 100%);
  border: 1px solid #e6edf5;
  font-size: 0.82rem;
  color: #334155;
}

.composed-item-name {
  font-weight: 700;
  color: #111827;
}

.composed-item-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 0.6rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 700;
}

.composed-item-pill--price {
  background: #eff6ff;
  color: #1d4ed8;
}

.composition-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.composition-recommendation {
  margin: 0 0 0.6rem;
  font-size: 0.82rem;
  color: #475569;
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
  .workspace-overview-grid,
  .workspace-board-grid,
  .workspace-bottom-grid {
    grid-template-columns: 1fr;
  }

  .items-composer-layout {
    grid-template-columns: 1fr;
  }

  .request-items-pane {
    position: static;
  }

  .workspace-board-empty {
    grid-column: auto;
  }

  .simple-composer-head,
  .simple-selection-line,
  .selection-card-topline,
  .selection-editor-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .simple-search-results-head,
  .simple-search-result-row {
    grid-template-columns: 54px minmax(120px, 1.4fr) minmax(110px, 1fr) 72px 58px 72px;
  }

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
  .filters-bar {
    padding: 0.75rem 0.8rem;
    gap: 0.65rem;
  }

  .status-tabs-bar {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.35rem;
    scrollbar-width: none;
  }

  .status-tabs-bar::-webkit-scrollbar {
    display: none;
  }

  .status-tab-pill {
    width: auto;
    flex: 0 0 auto;
    white-space: nowrap;
    min-height: 34px;
    padding-inline: 0.7rem;
  }

  .workspace-overview-head,
  .queue-status-row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .composer-controls-grid {
    grid-template-columns: 1fr;
  }

  .composer-actions,
  .composer-inline-actions {
    flex-direction: column;
  }

  .composer-actions > *,
  .composer-inline-actions > * {
    width: 100%;
    justify-content: center;
  }

  .simple-search-results-head,
  .simple-search-result-row {
    grid-template-columns: 44px minmax(0, 1fr) minmax(74px, auto);
  }

  .simple-search-results-head span:nth-child(3),
  .simple-search-results-head span:nth-child(4),
  .simple-search-results-head span:nth-child(5),
  .simple-search-result-row span:nth-child(3),
  .simple-search-result-row span:nth-child(4),
  .simple-search-result-row span:nth-child(5) {
    display: none;
  }

  .composed-pharmacy-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .composed-request-status-bar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .composed-request-status-select {
    min-width: 0;
    width: 100%;
  }

  .composed-pharmacy-actions,
  .composed-status-actions {
    width: 100%;
    align-items: stretch;
    justify-content: flex-start;
  }

  .composed-status-select {
    min-width: 0;
    width: 100%;
  }

  .composed-item-row {
    grid-template-columns: 1fr;
  }

  .status-tabs-bar {
    gap: 0.45rem;
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

  .starter-workspace-controls {
    align-items: stretch;
  }

  .starter-control-group,
  .starter-control-group--qty,
  .starter-unit-select,
  .starter-qty-stepper,
  .starter-workspace-actions {
    width: 100%;
    min-width: 0;
  }

  .starter-workspace-actions {
    margin-left: 0;
    justify-content: flex-start;
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
</style>
