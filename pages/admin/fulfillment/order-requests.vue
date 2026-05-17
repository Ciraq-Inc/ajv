<template>
  <div class="order-requests-page">
    <!-- Compact header bar: title + stats + actions in one row -->
    <div v-if="!selectedRequest" style="display: flex; align-items: center; gap: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem; flex-wrap: wrap;">
      <h1 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; white-space: nowrap;">Order Requests</h1>

      <!-- Inline stat pills -->
      <div v-if="stats" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #92400e;">
          <span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> {{ stats.pending || 0 }} Pending
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #1d4ed8;">
          <span style="width:7px;height:7px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> {{ stats.processing || 0 }} In Progress
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #15803d;">
          <span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;"></span> {{ stats.completed || 0 }} Fulfilled
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: #6d28d9;">
          <span style="width:7px;height:7px;border-radius:50%;background:#9333ea;display:inline-block;"></span> {{ stats.total || 0 }} Total
        </span>
      </div>

      <!-- Actions pushed to the right -->
      <div style="display: flex; gap: 0.5rem; margin-left: auto;">
        <button @click="fetchStats" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: #374151; cursor:pointer;">
          <ChartBarIcon style="width: 0.9rem; height: 0.9rem;" />
          <span>Stats</span>
        </button>
        <button @click="fetchRequests" class="btn-secondary" :disabled="loading" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: #374151; cursor:pointer;">
          <ArrowPathIcon :class="{ 'animate-spin': loading }" style="width: 0.9rem; height: 0.9rem;" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="!selectedRequest" class="filters-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; gap: 1rem;">
      <div class="status-tabs-bar" role="tablist" aria-label="Order request status filters" style="display: flex; flex-wrap: nowrap; align-items: center; gap: 0.4rem; padding: 0.35rem; padding-left: 0.8rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.02); overflow-x: auto; white-space: nowrap; max-width: 100%;">
       
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
          <span v-if="tab.value === 'pending' && expiringSoonCount > 0" style="display: inline-flex; align-items: center; justify-content: center; padding: 0 0.4rem; font-size: 0.6rem; font-weight: 700; border-radius: 999px; height: 1.1rem; background: #ef4444; color: #fff;" title="Requests closing soon">{{ expiringSoonCount }}</span>
        </button>

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
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center; flex: 1 1 auto; justify-content: flex-end; min-width: 300px;">
      

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
            <th @click="toggleSort('request_number')" style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; user-select: none; white-space: nowrap;">
              Request # <span style="opacity: 0.5;">{{ sortKey === 'request_number' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Customer</th>
            <th @click="toggleSort('items')" style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: center; cursor: pointer; user-select: none; white-space: nowrap;">
              Items <span style="opacity: 0.5;">{{ sortKey === 'items' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th @click="toggleSort('status')" style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; user-select: none; white-space: nowrap;">
              Stage <span style="opacity: 0.5;">{{ sortKey === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; white-space: nowrap;">Next Stage</th>
            <th @click="toggleSort('cost')" style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: right; cursor: pointer; user-select: none; white-space: nowrap;">
              Cost <span style="opacity: 0.5;">{{ sortKey === 'cost' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none;">Fulfillment</th>
            <th @click="toggleSort('updated_at')" style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; cursor: pointer; user-select: none; white-space: nowrap;">
              Updated <span style="opacity: 0.5;">{{ sortKey === 'updated_at' ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th style="padding: 0.75rem 1.25rem; font-size: 0.7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border: none; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="loading-cell" style="padding: 3rem; text-align: center; color: #6b7280; font-size: 0.85rem;">Loading requests...</td>
          </tr>
          <tr v-else-if="filteredRequests.length === 0">
            <td colspan="9" class="empty-cell" style="padding: 3rem; text-align: center; color: #6b7280; font-size: 0.85rem;">No requests found</td>
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
            :style="`border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background-color 0.15s ease; ${rowUrgencyStyle(req)}`"
            onmouseover="this.style.backgroundColor='#f9fafb'"
            onmouseout="this.style.backgroundColor=''"
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
            <td style="padding: 0.875rem 1.25rem;">
              <span v-if="getNextStageLabel(req)" style="font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; white-space: nowrap; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;">→ {{ getNextStageLabel(req) }}</span>
              <span v-else style="color: #9ca3af; font-size: 0.8rem;">—</span>
            </td>
            <td style="padding: 0.875rem 1.25rem; text-align: right; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums;">
              <template v-if="getRequestComposedCost(req) !== null">
                GHS {{ getRequestComposedCost(req)!.toFixed(2) }}
              </template>
              <span v-else style="color: #9ca3af; font-weight: 400;">—</span>
            </td>
            <td style="padding: 0.875rem 1.25rem;">
              <span v-if="req.fulfillment_type" class="fulfillment-badge" :class="req.fulfillment_type" 
                :style="req.fulfillment_type === 'delivery' ? 'background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4;' : req.fulfillment_type === 'pickup' ? 'background: #fefce8; color: #0f766e; border: 1px solid #fef08a;' : 'background: #fff; color: #6b7280; border: 1px solid #e5e7eb;'"
                style="font-size: 0.7rem; font-weight: 600; text-transform: capitalize; padding: 0.15rem 0.4rem; border-radius: 4px;">
                {{ req.fulfillment_type }}
              </span>
              <span v-else class="text-muted" style="color: #9ca3af;">-</span>
            </td>
            <td class="date-cell" style="padding: 0.875rem 1.25rem; color: #6b7280; font-size: 0.8rem;">{{ formatDateTime(req.updated_at || req.created_at) }}</td>
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
                    <span class="inline-loader-spinner" aria-hidden="true" style="border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; width: 12px; height: 12px; display: inline-block; animation: spin 1s linear infinite;"></span>
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
            <div class="header-status-override">
              <button @click="showStatusOverride = !showStatusOverride" class="btn-secondary btn-sm" :class="{ 'header-status-override-btn--active': showStatusOverride }" :disabled="loading" type="button">
                Override status
              </button>
              <div v-if="showStatusOverride" class="header-status-override-popover">
                <select v-model="selectedStatus" class="header-status-override-select">
                  <option value="">Change status…</option>
                  <option value="pending">Pending</option>
                  <option value="composing">Composing</option>
                  <option value="composed">Composed</option>
                  <option value="sourcing">Sourcing</option>
                  <option value="enquiry_sent">Enquiry Sent</option>
                  <option value="partially_available">Partially Available</option>
                  <option value="confirming_with_pharm">Confirming With Pharm</option>
                  <option value="awaiting_input">Awaiting Input</option>
                  <option value="awaiting_customer">Awaiting Customer</option>
                  <option value="payment_pending">Payment Pending</option>
                  <option value="confirmed_in_pharm">Confirmed In Pharm</option>
                  <option value="items_sourced">Items Sourced</option>
                  <option value="paid">Paid</option>
                  <option value="preparing">Preparing</option>
                  <option value="driver_assigned">Driver Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out For Delivery</option>
                  <option value="ready_for_pickup">Ready For Pickup</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                  <option value="expired">Expired</option>
                </select>
                <button @click="updateStatus" class="header-status-override-apply" :disabled="!selectedStatus || loading" type="button">Apply</button>
              </div>
            </div>
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
          <section class="workspace-overview-card" style="margin: 0; border: none; border-bottom: 1px solid #e5e7eb; border-radius: 0; background: #fff; padding: 1.5rem; box-shadow: none;">
            <div class="workspace-overview-head">
              <div class="workspace-overview-headline">
                <span class="workspace-overview-label">Order Overview</span>
                <h4>{{ { compose: 'Composition Workspace', source: 'Pharmacy Outreach', decision: 'Customer Decision', payment: 'Payment Pending', fulfillment: 'Fulfillment', transit: 'In Transit', pickup: 'Ready for Pickup', done: 'Order Complete', terminal: 'Order Closed' }[workspaceMode] || 'Order Workspace' }}</h4>
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
                <strong>GHS {{ parseFloat(String(selectedRequest.request_fee || 0)).toFixed(2) }}</strong>
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

          <!-- Pipeline status bar -->
          <div v-if="currentPipelineStageIndex >= 0" class="pipeline-bar">
            <template v-for="(stage, idx) in PIPELINE_STAGES" :key="stage.label">
              <div
                class="pipeline-step"
                :class="{
                  'pipeline-step--done': idx < currentPipelineStageIndex,
                  'pipeline-step--active': idx === currentPipelineStageIndex,
                  'pipeline-step--future': idx > currentPipelineStageIndex
                }"
              >
                <div class="pipeline-step-dot">
                  <svg v-if="idx < currentPipelineStageIndex" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="pipeline-step-label">{{ stage.label }}</span>
              </div>
              <div v-if="idx < PIPELINE_STAGES.length - 1" class="pipeline-step-connector" :class="{ 'pipeline-step-connector--done': idx < currentPipelineStageIndex }"></div>
            </template>
          </div>
          <div v-else-if="selectedRequest && ['cancelled', 'returned', 'expired'].includes(selectedRequest.status)" class="pipeline-bar pipeline-bar--exit">
            <span class="pipeline-exit-pill">{{ formatStatus(selectedRequest.status) }}</span>
          </div>

          <div class="workspace-shell" style="flex: 1; border-radius: 0; display: flex; flex-direction: column; padding: 0.5rem; background: #f3f4f6; gap: 0.5rem;">

          <!-- compose mode: item editor + pharmacy coverage -->
          <template v-if="workspaceMode === 'compose'">
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
              <div v-if="!requestItems.length && !prescriptionAttachmentUrls.length" class="items-empty-state">
                <strong>No items added yet.</strong>
                <p>
                  Add the first item here to begin composing this request.
                </p>
              </div>
              <template v-else>
                <div v-if="isComposeLocked" class="compose-cta-banner compose-cta-banner--full">
                  <div class="compose-cta-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </div>
                  <div class="compose-cta-copy">
                    <strong>Ready to work this order?</strong>
                    <span>Claim it to start adding &amp; resolving items.</span>
                  </div>
                  <button @click="applyNextStep()" class="compose-cta-btn" :disabled="loading">
                    Start Composing &rarr;
                  </button>
                </div>
                <div class="workspace-board-grid" :class="{ 'workspace-board-grid--locked': isComposeLocked }">
                  <aside class="request-items-pane request-items-pane--board">
                    <section v-if="prescriptionAttachmentUrls.length" class="prescription-reference-card">
                      <div class="request-items-pane-head prescription-reference-head">
                        <div>
                          <h5>Prescription</h5>
                          <p>Use each image as reference, then type the medicine names into the Add form below.</p>
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

                      <div class="request-items-pane-head">
                        <div>
                          <h5>Request Items</h5>
                        </div>
                        <div class="request-items-pane-actions">
                          <span class="request-items-pane-count">{{ requestItems.length }}</span>
                          <span v-if="requestItems.length" class="text-[9px] font-bold px-1.5 py-0.5 rounded" :style="{ background: allItemsResolved ? '#ecfdf5' : '#fffbeb', color: allItemsResolved ? '#059669' : '#d97706' }">
                            {{ resolvedItemCount }}/{{ requestItems.length }} resolved
                          </span>
                        </div>
                      </div>
                      <div v-if="requestItems.length" class="request-items-list request-items-list--workspace">
                        <div
                          v-for="(item, index) in requestItems"
                          :key="item.id"
                          class="request-item-row request-item-row--deletable"
                          :class="{ active: activeRequestItem?.id === item.id }"
                        >
                          <span class="request-item-row-index">{{ index + 1 }}</span>
                          <div class="request-item-row-main" style="flex: 1; min-width: 0;">
                            <!-- Resolving mode for this item -->
                            <template v-if="resolvingItemId === item.id">
                              <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                                <div style="display: flex; align-items: center; gap: 4px;">
                                  <input
                                    :value="masterSearchQuery"
                                    @input="resolveSearchMode === 'master' ? onMasterSearchInput(($event.target as HTMLInputElement).value) : onPharmResolveInput(($event.target as HTMLInputElement).value)"
                                    type="text"
                                    class="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 transition-all font-bold"
                                    :placeholder="resolveSearchMode === 'master' ? 'Search master catalog...' : 'Search pharmacy stock...'"
                                    autofocus
                                  />
                                  <button @click="cancelResolving" class="shrink-0 text-gray-400 hover:text-gray-600 p-0.5" title="Cancel">
                                    <XMarkIcon class="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <!-- Mode toggle -->
                                <div style="display: flex; gap: 4px;">
                                  <button
                                    type="button"
                                    class="resolve-mode-tab"
                                    :class="{ active: resolveSearchMode === 'pharmacy' }"
                                    @click="setResolveMode('pharmacy')"
                                  >Pharmacy stock</button>
                                  <button
                                    type="button"
                                    class="resolve-mode-tab"
                                    :class="{ active: resolveSearchMode === 'master' }"
                                    @click="setResolveMode('master')"
                                  >Master catalog</button>
                                </div>
                                <!-- Master catalog results -->
                                <template v-if="resolveSearchMode === 'master'">
                                  <div v-if="masterSearchLoading" class="text-[10px] text-gray-400 px-1">Searching...</div>
                                  <div v-else-if="masterSearchResults.length" class="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                                    <button
                                      v-for="(mp, mpIdx) in masterSearchResults"
                                      :key="mp.id ?? mpIdx"
                                      type="button"
                                      class="w-full text-left px-3 py-2 hover:bg-[#4F217A]/5 border-b last:border-0 border-gray-100 transition-colors cursor-pointer"
                                      @click="resolveItemToMaster(item, mp)"
                                    >
                                      <span class="text-xs font-bold text-gray-900 block truncate">{{ mp.product_description }}</span>
                                      <span class="text-[10px] text-gray-500">
                                        <template v-if="mp.strength">{{ mp.strength }}</template>
                                        <template v-if="mp.strength && mp.unit"> · </template>
                                        <template v-if="mp.unit">{{ mp.unit }}</template>
                                      </span>
                                    </button>
                                  </div>
                                  <div v-else-if="masterSearchQuery.length >= 2 && !masterSearchLoading" class="text-[10px] text-gray-400 px-1">
                                    No master products found
                                  </div>
                                </template>
                                <!-- Pharmacy stock results -->
                                <template v-else>
                                  <div v-if="pharmResolveLoading" class="text-[10px] text-gray-400 px-1">Searching...</div>
                                  <div v-else-if="pharmResolveResults.length" class="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                                    <button
                                      v-for="(pp, ppIdx) in pharmResolveResults"
                                      :key="pp.id ?? ppIdx"
                                      type="button"
                                      class="w-full text-left px-3 py-2 hover:bg-[#4F217A]/5 border-b last:border-0 border-gray-100 transition-colors cursor-pointer"
                                      @click="resolveItemToPharmProduct(item, pp)"
                                    >
                                      <span class="text-xs font-bold text-gray-900 block truncate">{{ pp.product_description || pp.brand_name }}</span>
                                      <span class="text-[10px] text-gray-500">
                                        {{ pp.pharmacy_name }}
                                        <template v-if="pp.distance_km !== null"> · {{ Number(pp.distance_km).toFixed(1) }} km</template>
                                        <template v-if="(pp.price ?? 0) > 0"> · GH₵{{ Number(pp.price).toFixed(2) }}</template>
                                        <template v-if="(pp.available_quantity ?? 0) > 0"> · {{ pp.available_quantity }} in stock</template>
                                      </span>
                                    </button>
                                  </div>
                                  <div v-else-if="masterSearchQuery.length >= 2 && !pharmResolveLoading" class="text-[10px] text-gray-400 px-1">
                                    No pharmacy stock found
                                  </div>
                                </template>
                              </div>
                            </template>
                            <!-- Normal display -->
                            <template v-else>
                              <div class="flex items-center gap-2 min-w-0">
                                <strong class="truncate">{{ item.product_name }}</strong>
                                <template v-if="item.master_product_id || item.source_pharmacy_id || item.resolution_status === 'resolved'">
                                  <button
                                    type="button"
                                    class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    :class="isComposeLocked ? 'cursor-default' : 'hover:bg-emerald-100 cursor-pointer'"
                                    @click.stop="!isComposeLocked && startResolvingItem(item)"
                                    :title="isComposeLocked ? 'Start Composing to edit' : 'Change resolution'"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Resolved
                                  </button>
                                </template>
                                <template v-else>
                                  <button
                                    type="button"
                                    class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors cursor-pointer border-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    @click.stop="startResolvingItem(item)"
                                    :disabled="isComposeLocked"
                                    :title="isComposeLocked ? 'Start Composing to edit' : 'Resolve to master product'"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    Resolve
                                  </button>
                                </template>
                              </div>
                              <div class="request-item-row-meta">
                                <span>Qty {{ getRequestedQuantity(item) }}</span>
                                <span v-if="item.requested_unit">{{ item.requested_unit }}</span>
                              </div>
                              <div v-if="item.source_pharmacy_id" class="text-[9px] text-purple-600 font-semibold mt-0.5">
                                → {{ item.pharmacy_name || `Pharmacy #${item.source_pharmacy_id}` }}
                              </div>
                            </template>
                          </div>
                          <button
                            type="button"
                            class="selection-preview-close request-item-row-clear"
                            @click.stop="deleteRequestItem(item)"
                            :disabled="loading || isComposeLocked"
                            :title="isComposeLocked ? 'Start Composing to edit' : 'Delete request item'"
                            aria-label="Delete request item"
                          >
                            <XMarkIcon class="icon-xs" />
                          </button>
                        </div>
                      </div>
                      <div v-else class="request-items-empty-list">
                        No request items yet. Add the first line below.
                      </div>

                      <div class="pane-quick-add">
                        <div class="pane-quick-add-head">
                          <div class="w-1.5 h-1.5 rounded-full bg-[#4F217A] shrink-0"></div>
                          <span>Add to request</span>
                        </div>
                        <div v-if="isComposeLocked" class="pane-quick-add-lock">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-gray-400 shrink-0">
                            <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                          </svg>
                          <span>Click <strong>Start Composing →</strong> above to edit this request.</span>
                        </div>
                        <div v-else class="pane-quick-add-body">
                          <div class="relative">
                            <input
                              v-model="adminNewItem.product_search"
                              type="text"
                              class="w-full pl-3 pr-9 py-0 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 transition-all font-bold h-[32px]"
                              placeholder="Type product name to add..."
                              @keyup.enter.prevent="saveAdminNewItem"
                            />
                          </div>
                          <div class="flex items-center gap-2">
                            <select
                              v-model="adminNewItem.requested_unit"
                              class="flex-1 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 transition-all cursor-pointer h-[32px]"
                            >
                              <option value="">Unit...</option>
                              <option v-for="option in medicineUnitOptions" :key="`pane-unit-${option}`" :value="option">{{ option }}</option>
                            </select>
                            <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-[32px] shrink-0">
                              <button type="button" class="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors disabled:opacity-50" @click="decrementAdminNewItemQty" :disabled="Number(adminNewItem.quantity || 1) <= 1">-</button>
                              <input v-model.number="adminNewItem.quantity" type="number" min="1" step="1" class="w-8 h-full text-center text-[11px] font-black text-gray-900 border-x border-gray-200 bg-white focus:outline-none appearance-none m-0 p-0" placeholder="1" @keyup.enter.prevent="saveAdminNewItem" />
                              <button type="button" class="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors" @click="incrementAdminNewItemQty">+</button>
                            </div>
                            <button @click="saveAdminNewItem" class="px-3 bg-[#4F217A] bg-opacity-10 text-[#4F217A] rounded-xl text-[11px] font-black transition-all hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 h-[32px] flex items-center justify-center" :disabled="loading || !canAddAdminItem">
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                  </aside>

                  <template v-if="requestItems.length && !isComposeLocked">
                    <section class="workspace-composer-card">
                        <div class="composer-meta-strip">
                          <div class="composer-meta-notes">
                            <button class="composer-meta-label composer-meta-label--toggle" @click="showAdminNotes = !showAdminNotes" type="button">
                              <div class="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></div>
                              <span>Admin Notes</span>
                              <span v-if="!showAdminNotes && adminNotes" class="composer-notes-preview">{{ adminNotes.slice(0, 40) }}{{ adminNotes.length > 40 ? '…' : '' }}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 ml-auto transition-transform" :class="showAdminNotes ? 'rotate-180' : ''">
                                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd" />
                              </svg>
                            </button>
                            <template v-if="showAdminNotes">
                              <textarea v-model="adminNotes" class="composer-meta-textarea" placeholder="Internal notes..."></textarea>
                              <button @click="saveNotes" class="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-bold transition-colors self-end" :disabled="loading">Save</button>
                            </template>
                          </div>
                          <div class="composer-meta-queue">
                            <div class="composer-meta-label">
                              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                              <span>Queue</span>
                              <div class="flex items-center gap-1.5 ml-auto">
                                <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">{{ composedCoverageSummary.total }}</span>
                                <span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">{{ composedCoverageSummary.covered }} done</span>
                                <span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold">{{ composedCoverageSummary.uncovered }} left</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Full-width action row -->
                        <div class="composer-action-strip">
                          <div v-if="autoAdvanceSuggestion" class="status-nudge-banner">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 shrink-0 text-amber-600">
                              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                            </svg>
                            <span class="flex-1 text-[10px] text-amber-800 font-semibold">{{ autoAdvanceSuggestion.message }}</span>
                            <button @click="applyNextStep(autoAdvanceSuggestion.status)" class="shrink-0 text-xs font-black px-4 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50" :disabled="loading">{{ autoAdvanceSuggestion.label }}</button>
                          </div>
                          <div class="status-action-row">
                            <span class="status-badge sm shrink-0" :class="selectedRequest.status">{{ formatStatus(selectedRequest.status) }}</span>
                            <button v-if="nextStepAction && !(autoAdvanceSuggestion && autoAdvanceSuggestion.status === nextStepAction.status)" @click="applyNextStep()" class="next-step-btn" :disabled="loading || !!nextStepAction.disabled">{{ nextStepAction.label }} →</button>
                            <button @click="showStatusOverride = !showStatusOverride" class="override-toggle-btn" :class="{ active: showStatusOverride }">override</button>
                          </div>
                          <div v-if="showStatusOverride" class="status-override-row">
                            <select v-model="selectedStatus" class="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300">
                              <option value="">Change status...</option>
                              <option value="pending">Pending</option>
                              <option value="composing">Composing</option>
                              <option value="composed">Composed</option>
                              <option value="sourcing">Sourcing</option>
                              <option value="enquiry_sent">Enquiry Sent</option>
                              <option value="partially_available">Partially Available</option>
                              <option value="confirming_with_pharm">Confirming With Pharm</option>
                              <option value="awaiting_input">Awaiting Input</option>
                              <option value="awaiting_customer">Awaiting Customer</option>
                              <option value="payment_pending">Payment Pending</option>
                              <option value="confirmed_in_pharm">Confirmed In Pharm</option>
                              <option value="items_sourced">Items Sourced</option>
                              <option value="paid">Paid</option>
                              <option value="preparing">Preparing</option>
                              <option value="driver_assigned">Driver Assigned</option>
                              <option value="in_transit">In Transit</option>
                              <option value="out_for_delivery">Out For Delivery</option>
                              <option value="ready_for_pickup">Ready For Pickup</option>
                              <option value="picked_up">Picked Up</option>
                              <option value="delivered">Delivered</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="returned">Returned</option>
                              <option value="expired">Expired</option>
                            </select>
                            <button @click="updateStatus" class="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm px-2 py-1 rounded-lg font-bold transition-colors disabled:opacity-50 shrink-0" :disabled="!selectedStatus || loading">Apply</button>
                          </div>
                        </div>

                      <div class="workspace-composer-divider"></div>

                      <!-- Coverage Matrix Panel -->
                      <div class="coverage-matrix-panel">
                        <div class="coverage-matrix-head">
                          <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-[#4F217A] shrink-0"></div>
                            <span class="text-xs font-bold text-gray-700">Pharmacy Coverage</span>
                            <span v-if="pharmacyCoverage?.data?.pharmacies" class="text-[9px] font-bold text-gray-400">{{ pharmacyCoverage.data.pharmacies.length }} nearby</span>
                          </div>
                          <button
                            @click="fetchPharmacyCoverage"
                            class="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-bold transition-colors"
                            :disabled="coverageLoading"
                          >
                            {{ coverageLoading ? 'Loading...' : 'Refresh' }}
                          </button>
                        </div>

                        <!-- Resolve prompt -->
                        <div v-if="!allItemsResolved" class="coverage-resolve-prompt">
                          <div class="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-amber-600 shrink-0">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <span class="text-xs text-amber-800 font-semibold">
                              Identify all items before starting sourcing.
                              <strong>{{ resolvedItemCount }}/{{ requestItems.length }}</strong> identified.
                            </span>
                          </div>
                        </div>

                        <!-- Loading state -->
                        <div v-if="coverageLoading" class="coverage-loading">
                          <div class="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                            <svg class="animate-spin w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            <span class="text-xs font-semibold">Searching nearby pharmacies...</span>
                          </div>
                        </div>

                        <!-- No results -->
                        <div v-else-if="pharmacyCoverage && (!pharmacyCoverage.data?.pharmacies || pharmacyCoverage.data.pharmacies.length === 0)" class="coverage-empty">
                          <div class="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                            <span class="text-xs font-semibold">No nearby pharmacies have matching products.</span>
                            <span class="text-[10px]">Try resolving more items or expanding the search radius.</span>
                          </div>
                        </div>

                        <!-- Pharmacy cards -->
                        <div v-else-if="pharmacyCoverage?.data?.pharmacies" class="coverage-pharmacy-list">
                          <div
                            v-for="(pharmacy, pIdx) in pharmacyCoverage.data.pharmacies"
                            :key="`coverage-pharm-${pharmacy.pharmacy_id}`"
                            class="coverage-pharmacy-card"
                          >
                            <!-- Pharmacy header -->
                            <div class="coverage-pharmacy-header">
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="text-[10px] font-black text-gray-400 shrink-0">#{{ pIdx + 1 }}</span>
                                  <strong class="text-sm font-bold text-gray-900 truncate">{{ pharmacy.pharmacy_name }}</strong>
                                </div>
                                <div class="flex items-center gap-2 mt-0.5">
                                  <span class="text-[10px] text-gray-500 font-semibold" title="Straight-line distance (approximate)">
                                    {{ Number.isFinite(Number(pharmacy.distance_km)) ? `~${Number(pharmacy.distance_km).toFixed(1)} km` : '-' }}
                                  </span>
                                  <span v-if="pharmacy.location" class="text-[10px] text-gray-400">{{ pharmacy.location }}</span>
                                </div>
                              </div>
                              </div>

                            <!-- Coverage bar -->
                            <div class="coverage-bar-row">
                              <div class="coverage-bar-track">
                                <div
                                  class="coverage-bar-fill"
                                  :style="{
                                    width: `${(pharmacy.total_items ?? 0) > 0 ? ((pharmacy.coverage_score ?? 0) / (pharmacy.total_items ?? 1)) * 100 : 0}%`,
                                    background: getCoverageColor(pharmacy.coverage_score ?? 0, pharmacy.total_items ?? 0)
                                  }"
                                ></div>
                              </div>
                              <span class="text-[10px] font-black shrink-0" :style="{ color: getCoverageColor(pharmacy.coverage_score ?? 0, pharmacy.total_items ?? 0) }">
                                {{ pharmacy.coverage_score }}/{{ pharmacy.total_items }}
                              </span>
                            </div>

                            <!-- Covered items -->
                            <div v-if="pharmacy.covered && pharmacy.covered.length" class="coverage-items-section">
                              <div
                                v-for="ci in pharmacy.covered"
                                :key="`covered-${pharmacy.pharmacy_id}-${ci.item_id}`"
                                class="coverage-item-group"
                              >
                                <!-- Item name row -->
                                <div class="coverage-item-row coverage-item-row--covered">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-emerald-500 shrink-0">
                                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                                  </svg>
                                  <span class="text-xs text-gray-800 font-semibold truncate flex-1">{{ ci.product_name }}</span>
                                </div>
                                <!-- Masterlist match sub-row -->
                                <div v-if="ci.master_match" class="coverage-item-match-row">
                                  <span class="coverage-match-badge coverage-match-badge--master">Masterlist</span>
                                  <span class="text-[10px] text-gray-700 font-medium truncate flex-1">{{ ci.master_match.matched_product_name }}</span>
                                  <span v-if="ci.master_match.price" class="text-[10px] font-bold text-gray-900 shrink-0">
                                    GHS {{ Number(ci.master_match.price).toFixed(2) }}
                                  </span>
                                  <span class="text-[9px] font-bold px-1 py-0.5 rounded shrink-0" :class="Number(ci.master_match.stock) > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                                    {{ ci.master_match.stock }} left
                                  </span>
                                </div>
                                <!-- Fuzzy match sub-row -->
                                <div v-if="ci.fuzzy_match" class="coverage-item-match-row">
                                  <span class="coverage-match-badge coverage-match-badge--fuzzy">Fuzzy</span>
                                  <span class="text-[10px] text-gray-700 font-medium truncate flex-1">{{ ci.fuzzy_match.matched_product_name }}</span>
                                  <span v-if="ci.fuzzy_match.price" class="text-[10px] font-bold text-gray-900 shrink-0">
                                    GHS {{ Number(ci.fuzzy_match.price).toFixed(2) }}
                                  </span>
                                  <span class="text-[9px] font-bold px-1 py-0.5 rounded shrink-0" :class="Number(ci.fuzzy_match.stock) > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                                    {{ ci.fuzzy_match.stock }} left
                                  </span>
                                </div>
                              </div>
                            </div>

                            <!-- Uncovered items -->
                            <div v-if="pharmacy.uncovered && pharmacy.uncovered.length" class="coverage-items-section">
                              <template
                                v-for="ui in pharmacy.uncovered"
                                :key="`uncovered-${pharmacy.pharmacy_id}-${ui.item_id}`"
                              >
                                <div class="coverage-item-row coverage-item-row--uncovered">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-gray-300 shrink-0">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                  </svg>
                                  <span class="text-xs text-gray-400 font-medium truncate flex-1">{{ ui.product_name }}</span>
                                  <button
                                    v-if="coverageSubSearch.pharmacyId === pharmacy.pharmacy_id && coverageSubSearch.itemId === ui.item_id"
                                    type="button"
                                    class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 shrink-0 transition-colors"
                                    @click="closeCoverageSubSearch"
                                  >cancel</button>
                                  <button
                                    v-else
                                    type="button"
                                    class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 hover:bg-violet-100 shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    :disabled="isComposeLocked"
                                    @click="startCoverageSubSearch(pharmacy, ui)"
                                  >find substitute</button>
                                </div>
                                <!-- Inline substitute search panel -->
                                <div
                                  v-if="coverageSubSearch.pharmacyId === pharmacy.pharmacy_id && coverageSubSearch.itemId === ui.item_id"
                                  class="coverage-sub-search-panel"
                                >
                                  <input
                                    :value="coverageSubSearch.query"
                                    @input="onCoverageSubSearchInput(($event.target as HTMLInputElement).value)"
                                    type="text"
                                    class="w-full px-2 py-1 bg-white border border-violet-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
                                    :placeholder="`Search ${pharmacy.pharmacy_name} catalog...`"
                                    autofocus
                                  />
                                  <div v-if="coverageSubSearch.loading" class="text-[10px] text-gray-400 px-1 py-1">Searching...</div>
                                  <div v-else-if="coverageSubSearch.results.length" class="coverage-sub-search-results">
                                    <button
                                      v-for="(sp, spIdx) in coverageSubSearch.results"
                                      :key="sp.id ?? spIdx"
                                      type="button"
                                      class="coverage-sub-search-result"
                                      @click="selectCoverageSubstitute(pharmacy, ui, sp)"
                                    >
                                      <span class="text-xs font-bold text-gray-900 block truncate">{{ sp.product_description || sp.brand_name }}</span>
                                      <span class="text-[10px] text-gray-500">
                                        GH₵{{ Number(sp.price || 0).toFixed(2) }} · {{ sp.available_quantity || 0 }} in stock
                                        <template v-if="sp.distance_km !== null"> · {{ Number(sp.distance_km).toFixed(2) }} km</template>
                                      </span>
                                    </button>
                                  </div>
                                  <div v-else-if="coverageSubSearch.query.length >= 2 && !coverageSubSearch.loading" class="text-[10px] text-gray-400 px-1 py-1">
                                    No products found in this pharmacy's catalog.
                                  </div>
                                </div>
                              </template>
                            </div>
                          </div>
                        </div>
                      </div>

                    </section>
                  </template>
                  <div v-else-if="!isComposeLocked" class="simple-composer-empty workspace-board-empty">
                    <span class="pane-eyebrow">Composition Workspace</span>
                    <h5>Add items to get started</h5>
                    <p>Use the quick add bar on the left to create request items, then resolve each to a master product to see pharmacy coverage.</p>
                  </div>
                </div>
              </template>
          </section>
          </template>

          <!-- source mode: pharmacy outreach board -->
          <template v-else-if="workspaceMode === 'source'">
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Pharmacy Outreach</h4>
                  <p class="workspace-panel-subcopy">Contact nearby pharmacies to source this request.</p>
                </div>
                <div class="section-head-actions">
                  <button type="button" class="btn-ghost btn-sm" :disabled="loading" @click="sendBackToCompose">↩ Back to Compose</button>
                  <span class="status-badge sourcing">{{ formatStatus(selectedRequest?.status) }}</span>
                </div>
              </div>

              <!-- Sourcing mode banners -->
              <template v-if="pharmacyQueue?.length">
                <!-- Single mode: goal statement -->
                <div v-if="sourcingMode === 'single'" class="sourcing-goal-banner">
                  <span>Looking for <strong>one pharmacy</strong> to supply all {{ (selectedRequest?.items || []).length }} item{{ (selectedRequest?.items || []).length !== 1 ? 's' : '' }}</span>
                  <span v-if="fullMatchQueue.length > 0" class="sourcing-goal-count">{{ fullMatchQueue.length }} full match{{ fullMatchQueue.length !== 1 ? 'es' : '' }}</span>
                  <span v-else class="sourcing-goal-count sourcing-goal-count--warn">No single-pharmacy full match found</span>
                </div>
                <!-- Escalation prompt -->
                <div v-if="escalationReady && sourcingMode === 'single'" class="sourcing-escalation-card">
                  <div class="sourcing-escalation-copy">
                    <strong>No single-pharmacy match confirmed</strong>
                    <span>All full-match pharmacies have been contacted but none confirmed. Consider splitting the order.</span>
                  </div>
                  <div class="sourcing-escalation-actions">
                    <button type="button" class="sourcing-esc-btn sourcing-esc-btn--keep">Keep trying</button>
                    <button type="button" class="sourcing-esc-btn sourcing-esc-btn--split" @click="sourcingMode = 'split'">Switch to split sourcing →</button>
                  </div>
                </div>
                <!-- Split mode header -->
                <div v-if="sourcingMode === 'split'" class="sourcing-split-header">
                  <div class="sourcing-split-header-left">
                    <span class="sourcing-split-badge">Split mode</span>
                    <span>Sourcing items across multiple pharmacies</span>
                  </div>
                  <button type="button" class="sourcing-split-back" @click="sourcingMode = 'single'">← Back to single-source</button>
                </div>
                <!-- All items covered banner -->
                <div v-if="sourcingMode === 'split' && allItemsCovered" class="sourcing-covered-banner">
                  ✅ All items sourced — ready to finalize fulfillment
                </div>
                <!-- Item coverage tracker (split mode only) -->
                <div v-if="sourcingMode === 'split'" class="sourcing-item-tracker">
                  <div
                    v-for="item in (selectedRequest?.items || [])"
                    :key="item.id"
                    class="tracker-item-row"
                    :class="Number(item.sourced_quantity || 0) >= Number(item.requested_quantity || item.quantity || 1) ? 'tracker-item-row--covered' : 'tracker-item-row--pending'"
                  >
                    <div class="tracker-item-info">
                      <span class="tracker-item-name">{{ item.product_name }}</span>
                      <span class="tracker-item-qty">×{{ item.requested_quantity || item.quantity }}</span>
                    </div>
                    <div class="tracker-item-allocs">
                      <template v-for="plan in fulfillmentPlans" :key="plan.plan_key">
                        <template v-for="pi in (plan.items || [])" :key="pi.item_id">
                          <span
                            v-if="pi.item_id === item.id && (pi.allocated_quantity ?? 0) > 0"
                            class="tracker-alloc-chip"
                          >{{ plan.pharmacies?.[0]?.pharmacy_name }} ×{{ pi.allocated_quantity }}</span>
                        </template>
                      </template>
                      <span
                        v-if="Number(item.sourced_quantity || 0) < Number(item.requested_quantity || item.quantity || 1)"
                        class="tracker-remaining-badge"
                      >{{ Number(item.requested_quantity || item.quantity || 1) - Number(item.sourced_quantity || 0) }} still needed</span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Summary bar -->
              <div v-if="pharmacyQueue?.length" class="outreach-summary-bar">
                <span>
                  <strong>{{ pharmacyQueue.filter(p => p.is_confirmed).length }}</strong> confirmed
                  &nbsp;·&nbsp;
                  <strong>{{ pharmacyQueue.filter(p => p.queue_state === 'awaiting_response').length }}</strong> awaiting
                  &nbsp;·&nbsp;
                  <strong>{{ pharmacyQueue.filter(p => p.queue_state === 'not_contacted').length }}</strong> not contacted
                </span>
                <span v-if="nextRecommendedPharmacy" class="outreach-next-chip">
                  Next: {{ nextRecommendedPharmacy.pharmacy_name }}
                </span>
              </div>

              <div v-if="pharmacyQueue?.length" class="pharmacy-outreach-list">
                <!-- Full coverage pharmacies -->
                <template v-if="fullMatchQueue.length > 0">
                  <div class="outreach-section-head">
                    <span class="outreach-section-label outreach-section-label--full">Full coverage</span>
                    <span class="outreach-section-note">These pharmacies have all items in stock</span>
                  </div>
                  <div
                    v-for="(pharm, fmIdx) in fullMatchQueue"
                    :key="pharm.pharmacy_id ?? fmIdx"
                    class="pharmacy-outreach-row"
                    :class="{ 'pharmacy-outreach-row--next': nextRecommendedPharmacy?.pharmacy_id === pharm.pharmacy_id }"
                  >
                    <div class="pharmacy-outreach-info">
                      <strong>{{ pharm.pharmacy_name }}</strong>
                      <span class="muted" title="Straight-line distance (approximate)">~{{ Number(pharm.distance_km).toFixed(1) }} km</span>
                      <span class="outreach-queue-chip" :class="'outreach-queue-chip--' + pharm.queue_state">{{ ({ not_contacted: 'Not contacted', awaiting_response: 'Awaiting response', full: 'Available ✓', partial: 'Partial', declined: 'Unavailable', unknown: 'Unknown' } as Record<string, string>)[pharm.queue_state ?? ''] || pharm.queue_state }}</span>
                      <span class="outreach-coverage-chip outreach-coverage-chip--full">Full match</span>
                      <span v-if="pharm.pharmacy_id && pharmacyLedgerMap[pharm.pharmacy_id]" class="outreach-orders-chip" :class="{ 'outreach-orders-chip--low': (pharmacyLedgerMap[pharm.pharmacy_id!]?.request_count || 0) === 0 }">
                        {{ pharmacyLedgerMap[pharm.pharmacy_id!]?.request_count || 0 }} orders
                        <template v-if="pharmacyLedgerMap[pharm.pharmacy_id!]?.last_transaction_at"> · last {{ formatRelativeTime(pharmacyLedgerMap[pharm.pharmacy_id!]!.last_transaction_at) }}</template>
                      </span>
                      <span v-else-if="Object.keys(pharmacyLedgerMap).length > 0" class="outreach-orders-chip outreach-orders-chip--low">0 orders</span>
                    </div>
                    <div class="pharmacy-outreach-actions">
                      <a v-if="pharm.phone" :href="pharm.whatsapp_url || `https://wa.me/${phoneUtils.formatWhatsApp(pharm.phone)}`" target="_blank" class="outreach-btn outreach-btn--wa" :title="`WhatsApp ${pharm.pharmacy_name}`" @click="recordPharmacyContactAction(pharm, 'contacted', { showSuccess: false })"><span>WhatsApp</span></a>
                      <a v-if="pharm.phone" :href="`tel:${pharm.phone}`" class="outreach-btn outreach-btn--call" :title="`Call ${pharm.pharmacy_name}`" @click="recordPharmacyContactAction(pharm, 'contacted', { showSuccess: false })"><span>Call</span></a>
                      <template v-if="!pharm.phone">
                        <template v-if="pharmacyPhoneEdit[pharm.pharmacy_id!]?.editing">
                          <input
                            v-model="pharmacyPhoneEdit[pharm.pharmacy_id!]!.value"
                            type="tel"
                            class="outreach-phone-input"
                            placeholder="e.g. 0241234567"
                            :disabled="pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ?? false"
                            @keydown.enter="savePharmacyPhone(pharm)"
                            @keydown.esc="cancelPharmacyPhoneEdit(pharm.pharmacy_id!)"
                          />
                          <button type="button" class="outreach-btn outreach-btn--confirm" :disabled="(pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ?? false) || !pharmacyPhoneEdit[pharm.pharmacy_id!]?.value" @click="savePharmacyPhone(pharm)">{{ pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ? 'Saving…' : 'Save' }}</button>
                          <button type="button" class="outreach-btn outreach-btn--cancel" :disabled="pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ?? false" @click="cancelPharmacyPhoneEdit(pharm.pharmacy_id!)">✕</button>
                        </template>
                        <button v-else type="button" class="outreach-btn outreach-btn--add-phone" @click="startPharmacyPhoneEdit(pharm.pharmacy_id!)">+ Add phone</button>
                      </template>
                      <template v-if="pharm.queue_state !== 'not_contacted'">
                        <button type="button" class="outreach-btn outreach-btn--confirm" :class="{ active: pharm.queue_state === 'full' }" @click="openResponseModal(pharm, 'full')">Available ✓</button>
                        <button type="button" class="outreach-btn outreach-btn--partial" :class="{ active: pharm.queue_state === 'partial' }" @click="openResponseModal(pharm, 'partial')">Partial</button>
                        <button type="button" class="outreach-btn outreach-btn--decline" :class="{ active: pharm.queue_state === 'declined' }" @click="recordPharmacyContactAction(pharm, 'declined', { showSuccess: true })">Unavailable ✗</button>
                      </template>
                      <button v-if="pharm.queue_state === 'full'" type="button" class="outreach-btn outreach-btn--route" :disabled="loading" @click="routePharmacyAction(pharm)">Route here</button>
                    </div>
                  </div>
                </template>

                <!-- Partial coverage pharmacies -->
                <template v-if="partialMatchQueue.length > 0">
                  <div class="outreach-section-head" :class="{ 'outreach-section-head--spaced': fullMatchQueue.length > 0 }">
                    <span class="outreach-section-label outreach-section-label--partial">Partial coverage</span>
                    <span class="outreach-section-note">These pharmacies have some but not all items</span>
                  </div>
                  <div
                    v-for="(pharm, pmIdx) in partialMatchQueue"
                    :key="pharm.pharmacy_id ?? pmIdx"
                    class="pharmacy-outreach-row"
                    :class="{ 'pharmacy-outreach-row--next': nextRecommendedPharmacy?.pharmacy_id === pharm.pharmacy_id }"
                  >
                    <div class="pharmacy-outreach-info">
                      <strong>{{ pharm.pharmacy_name }}</strong>
                      <span class="muted" title="Straight-line distance (approximate)">~{{ Number(pharm.distance_km).toFixed(1) }} km</span>
                      <span class="outreach-queue-chip" :class="'outreach-queue-chip--' + pharm.queue_state">{{ ({ not_contacted: 'Not contacted', awaiting_response: 'Awaiting response', full: 'Available ✓', partial: 'Partial', declined: 'Unavailable', unknown: 'Unknown' } as Record<string, string>)[pharm.queue_state ?? ''] || pharm.queue_state }}</span>
                      <span v-if="pharm.matched_item_count ?? 0 > 0" class="outreach-coverage-chip">{{ pharm.matched_item_count }} item{{ pharm.matched_item_count !== 1 ? 's' : '' }}</span>
                      <span v-if="pharm.pharmacy_id && pharmacyLedgerMap[pharm.pharmacy_id]" class="outreach-orders-chip" :class="{ 'outreach-orders-chip--low': (pharmacyLedgerMap[pharm.pharmacy_id!]?.request_count || 0) === 0 }">
                        {{ pharmacyLedgerMap[pharm.pharmacy_id!]?.request_count || 0 }} orders
                        <template v-if="pharmacyLedgerMap[pharm.pharmacy_id!]?.last_transaction_at"> · last {{ formatRelativeTime(pharmacyLedgerMap[pharm.pharmacy_id!]!.last_transaction_at) }}</template>
                      </span>
                      <span v-else-if="Object.keys(pharmacyLedgerMap).length > 0" class="outreach-orders-chip outreach-orders-chip--low">0 orders</span>
                    </div>
                    <div class="pharmacy-outreach-actions">
                      <a v-if="pharm.phone" :href="pharm.whatsapp_url || `https://wa.me/${phoneUtils.formatWhatsApp(pharm.phone)}`" target="_blank" class="outreach-btn outreach-btn--wa" :title="`WhatsApp ${pharm.pharmacy_name}`" @click="recordPharmacyContactAction(pharm, 'contacted', { showSuccess: false })"><span>WhatsApp</span></a>
                      <a v-if="pharm.phone" :href="`tel:${pharm.phone}`" class="outreach-btn outreach-btn--call" :title="`Call ${pharm.pharmacy_name}`" @click="recordPharmacyContactAction(pharm, 'contacted', { showSuccess: false })"><span>Call</span></a>
                      <template v-if="!pharm.phone">
                        <template v-if="pharmacyPhoneEdit[pharm.pharmacy_id!]?.editing">
                          <input
                            v-model="pharmacyPhoneEdit[pharm.pharmacy_id!]!.value"
                            type="tel"
                            class="outreach-phone-input"
                            placeholder="e.g. 0241234567"
                            :disabled="pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ?? false"
                            @keydown.enter="savePharmacyPhone(pharm)"
                            @keydown.esc="cancelPharmacyPhoneEdit(pharm.pharmacy_id!)"
                          />
                          <button type="button" class="outreach-btn outreach-btn--confirm" :disabled="(pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ?? false) || !pharmacyPhoneEdit[pharm.pharmacy_id!]?.value" @click="savePharmacyPhone(pharm)">{{ pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ? 'Saving…' : 'Save' }}</button>
                          <button type="button" class="outreach-btn outreach-btn--cancel" :disabled="pharmacyPhoneEdit[pharm.pharmacy_id!]?.saving ?? false" @click="cancelPharmacyPhoneEdit(pharm.pharmacy_id!)">✕</button>
                        </template>
                        <button v-else type="button" class="outreach-btn outreach-btn--add-phone" @click="startPharmacyPhoneEdit(pharm.pharmacy_id!)">+ Add phone</button>
                      </template>
                      <template v-if="pharm.queue_state !== 'not_contacted'">
                        <button type="button" class="outreach-btn outreach-btn--confirm" :class="{ active: pharm.queue_state === 'full' }" @click="openResponseModal(pharm, 'full')">Available ✓</button>
                        <button type="button" class="outreach-btn outreach-btn--partial" :class="{ active: pharm.queue_state === 'partial' }" @click="openResponseModal(pharm, 'partial')">Partial</button>
                        <button type="button" class="outreach-btn outreach-btn--decline" :class="{ active: pharm.queue_state === 'declined' }" @click="recordPharmacyContactAction(pharm, 'declined', { showSuccess: true })">Unavailable ✗</button>
                      </template>
                    </div>
                  </div>
                </template>
              </div>

              <div v-else class="items-empty-state">
                <strong>No pharmacy data loaded.</strong>
                <p>Run the fulfillment process to discover nearby pharmacies.</p>
                <div v-if="fulfillmentProcessLoading" class="fulfillment-loading-state">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" class="fulfillment-sparkle">
                    <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
                  </svg>
                  <span class="fulfillment-loading-label">loading</span>
                </div>
                <button v-else type="button" class="btn-secondary" style="margin-top: 0.75rem" @click="runFulfillmentManually">Run fulfillment process</button>
              </div>
            </section>
          </template>

          <!-- decision mode: awaiting customer input -->
          <template v-else-if="workspaceMode === 'decision'">
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Awaiting Customer Decision</h4>
                  <p class="workspace-panel-subcopy">Decisions have been sent to the customer. Once resolved, the request advances.</p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;">
                  <a
                    v-if="selectedRequest?.customer_phone"
                    :href="`tel:${selectedRequest.customer_phone}`"
                    class="btn-call-nudge"
                    :title="`Call ${selectedRequest.customer_phone}`"
                  >
                    <i class="ri-phone-line"></i>
                    {{ selectedRequest.customer_phone }}
                  </a>
                  <a
                    v-if="customerDecisionWhatsAppUrl"
                    :href="customerDecisionWhatsAppUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-whatsapp-nudge"
                    title="Send WhatsApp reminder to customer"
                  >
                    <i class="ri-whatsapp-line"></i>
                    WhatsApp
                  </a>
                  <span class="status-badge awaiting_input">{{ formatStatus(selectedRequest?.status) }}</span>
                </div>
              </div>

              <div v-if="selectedRequest?.customer_decisions?.length" class="decisions-list">
                <div v-for="(dec, decIdx) in selectedRequest.customer_decisions" :key="dec.id ?? decIdx" class="decision-card" :class="'decision-card--' + dec.status">

                  <!-- Decision header -->
                  <div class="decision-card-header">
                    <div class="decision-card-header-left">
                      <span v-if="dec.payload?.summary?.decision_context" class="decision-context-chip" :class="'decision-context-chip--' + dec.payload.summary.decision_context">
                        {{ { partial_availability: 'Partial availability', split_fulfillment: 'Split sourcing', substitute_approval: 'Substitute offer', mixed_availability: 'Multiple issues' }[dec.payload.summary.decision_context] || dec.payload.summary.decision_context }}
                      </span>
                      <span v-else-if="dec.decision_type" class="decision-context-chip">{{ dec.decision_type.replace(/_/g, ' ') }}</span>
                      <span class="status-badge" :class="dec.status">{{ dec.status }}</span>
                    </div>
                    <div class="decision-card-header-right">
                      <span
                        v-if="dec.status === 'pending' && dec.customer_notified_at && formatWaitingTime(dec.customer_notified_at)"
                        class="decision-meta-chip decision-meta-chip--waiting"
                        :class="{
                          'decision-meta-chip--waiting-warn': (Date.now() - new Date(dec.customer_notified_at).getTime()) > 4 * 60 * 60 * 1000,
                          'decision-meta-chip--waiting-critical': (Date.now() - new Date(dec.customer_notified_at).getTime()) > 12 * 60 * 60 * 1000
                        }"
                        :title="`Customer notified ${formatRelativeTime(dec.customer_notified_at)}`"
                      >
                        Waiting {{ formatWaitingTime(dec.customer_notified_at) }}
                      </span>
                      <span v-if="dec.expires_at" class="decision-meta-chip" :class="new Date(dec.expires_at) < new Date() ? 'decision-meta-chip--expired' : ''">
                        {{ new Date(dec.expires_at) < new Date() ? 'Expired' : 'Expires ' + formatRelativeTime(dec.expires_at) }}
                      </span>
                    </div>
                  </div>

                  <!-- Customer-facing message -->
                  <div v-if="dec.title || dec.message" class="decision-message-block">
                    <p v-if="dec.title" class="decision-message-title">{{ dec.title }}</p>
                    <p v-if="dec.message" class="decision-message-body">{{ dec.message }}</p>
                  </div>

                  <!-- Summary stats -->
                  <div v-if="dec.payload?.summary" class="decision-summary-bar">
                    <span class="decision-stat">
                      <span class="decision-stat-label">Requested</span>
                      <span class="decision-stat-value">{{ dec.payload.summary.requested_items }}</span>
                    </span>
                    <span class="decision-stat decision-stat--ok">
                      <span class="decision-stat-label">Available</span>
                      <span class="decision-stat-value">{{ dec.payload.summary.available_items }}</span>
                    </span>
                    <span v-if="(dec.payload.summary.missing_items ?? 0) > 0" class="decision-stat decision-stat--warn">
                      <span class="decision-stat-label">Missing</span>
                      <span class="decision-stat-value">{{ dec.payload.summary.missing_items }}</span>
                    </span>
                    <span v-if="(dec.payload.summary.substitute_proposals ?? 0) > 0" class="decision-stat decision-stat--sub">
                      <span class="decision-stat-label">Substitutes</span>
                      <span class="decision-stat-value">{{ dec.payload.summary.substitute_proposals }}</span>
                    </span>
                    <span v-if="dec.payload.summary.is_split_source" class="decision-stat decision-stat--split">
                      <span class="decision-stat-label">Pharmacies</span>
                      <span class="decision-stat-value">{{ dec.payload.summary.source_pharmacy_count }}</span>
                    </span>
                    <span v-if="decisionOrderValue(dec) !== null" class="decision-stat decision-stat--value">
                      <span class="decision-stat-label">Order value</span>
                      <span class="decision-stat-value">GHS {{ decisionOrderValue(dec)!.toFixed(2) }}</span>
                    </span>
                  </div>

                  <!-- Decision items table -->
                  <div v-if="dec.payload?.decision_items?.length" class="decision-items-table">
                    <div class="decision-items-head">
                      <span>Item</span><span>Status</span><span>Source</span><span>Notes</span>
                    </div>
                    <div v-for="(ditem, diIdx) in dec.payload.decision_items" :key="ditem.item_id ?? ditem.item_name ?? diIdx" class="decision-items-row">
                      <span class="decision-item-name">{{ ditem.product_name || ditem.item_name || ditem.item_id }}</span>
                      <span class="decision-item-status-chip" :class="'decision-item-status--' + (ditem.status || 'unknown')">
                        {{ ({ available: '✓ Available', not_available: '✗ Unavailable', substitute_available: '~ Substitute', partially_available: '⊙ Partial', enquiring: '? Checking' } as Record<string, string>)[ditem.status ?? ''] || ditem.status }}
                      </span>
                      <span class="decision-item-source muted">{{ ditem.source_pharmacy_name || (ditem.source_pharmacy_id ? `Pharmacy ${ditem.source_pharmacy_id}` : '—') }}</span>
                      <span class="decision-item-note muted">
                        <template v-if="ditem.substitute_name">Alt: {{ ditem.substitute_name }}<template v-if="ditem.substitute_note"> — {{ ditem.substitute_note }}</template></template>
                        <template v-else-if="ditem.substitute_option?.name">Alt: {{ ditem.substitute_option.name }}</template>
                      </span>
                    </div>
                  </div>

                  <!-- Admin override actions (only for pending decisions) -->
                  <div v-if="dec.status === 'pending'" class="decision-admin-actions">
                    <p v-if="decisionDeclineConsequence(dec)" class="decision-decline-consequence">{{ decisionDeclineConsequence(dec) }}</p>
                    <p class="decision-admin-note">Customer hasn't responded yet. You can resolve on their behalf:</p>
                    <div class="decision-admin-btns">
                      <button
                        type="button"
                        class="btn-sm btn-renotify"
                        :disabled="!!decisionNotifyingId || loading"
                        @click="renotifyDecision(dec.id!)"
                        :title="`Re-send SMS to ${selectedRequest?.customer_phone || 'customer'}`"
                      >
                        <span v-if="decisionNotifyingId === dec.id">Sending…</span>
                        <span v-else>Re-send SMS</span>
                      </button>
                      <button type="button" class="btn-sm btn-success" :disabled="loading" @click="resolveDecisionAsAdmin(dec.id!, 'approved')">Approve for customer</button>
                      <button type="button" class="btn-sm btn-danger-outline" :disabled="loading" @click="resolveDecisionAsAdmin(dec.id!, 'declined')">Decline</button>
                    </div>
                  </div>

                </div>
              </div>

              <div v-else class="items-empty-state">
                <strong>No decisions found.</strong>
                <p>Customer decisions will appear here once created.</p>
              </div>
            </section>
          </template>

          <!-- payment mode: order details + bill + fulfillment plan -->
          <template v-else-if="workspaceMode === 'payment'">

            <!-- Order & customer info -->
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Awaiting Payment</h4>
                  <p class="workspace-panel-subcopy">
                    Order confirmed — pending payment for {{ formatRelativeTime(selectedRequest?.updated_at) }}.
                  </p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                  <a
                    v-if="customerPaymentWhatsAppUrl"
                    :href="customerPaymentWhatsAppUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-whatsapp-nudge"
                    title="Send WhatsApp payment reminder to customer"
                  >
                    <i class="ri-whatsapp-line"></i>
                    WhatsApp Customer
                  </a>
                  <span class="status-badge payment_pending">{{ formatStatus(selectedRequest?.status) }}</span>
                </div>
              </div>
              <div class="workspace-overview-grid">
                <div class="workspace-overview-item">
                  <span class="workspace-overview-key">Order #</span>
                  <strong>{{ selectedRequest?.request_number || selectedRequest?.id }}</strong>
                </div>
                <div class="workspace-overview-item">
                  <span class="workspace-overview-key">Placed</span>
                  <strong>{{ formatDateTime(selectedRequest?.created_at) }}</strong>
                </div>
                <div class="workspace-overview-item">
                  <span class="workspace-overview-key">Pending Since</span>
                  <strong :title="formatDateTime(selectedRequest?.updated_at)">{{ formatRelativeTime(selectedRequest?.updated_at) }}</strong>
                </div>
                <div class="workspace-overview-item">
                  <span class="workspace-overview-key">Fulfillment</span>
                  <strong>{{ selectedRequest?.fulfillment_type || '-' }}</strong>
                </div>
                <div class="workspace-overview-item">
                  <span class="workspace-overview-key">Customer</span>
                  <strong>{{ selectedRequest?.customer_name || '-' }}</strong>
                </div>
                <div class="workspace-overview-item">
                  <span class="workspace-overview-key">Phone</span>
                  <strong>{{ selectedRequest?.customer_phone || '-' }}</strong>
                </div>
              </div>
              <div v-if="selectedRequest?.customer_address" class="workspace-overview-grid" style="margin-top: 0.5rem;">
                <div class="workspace-overview-item" style="grid-column: 1 / -1;">
                  <span class="workspace-overview-key">Delivery Address</span>
                  <strong>{{ selectedRequest.customer_address }}</strong>
                </div>
              </div>
              <div v-if="selectedRequest?.customer_notes" class="workspace-overview-grid" style="margin-top: 0.5rem;">
                <div class="workspace-overview-item" style="grid-column: 1 / -1;">
                  <span class="workspace-overview-key">Customer Notes</span>
                  <span>{{ selectedRequest.customer_notes }}</span>
                </div>
              </div>
            </section>

            <!-- Bill breakdown -->
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <h4 class="section-title">Order Bill</h4>
              </div>
              <div v-if="paymentModeItems.length" class="paid-breakdown-list">
                <div v-for="entry in paymentModeItems" :key="`pay-${entry.item_id}`" class="paid-breakdown-item">
                  <div class="paid-breakdown-item-top">
                    <strong>{{ entry.product_name }}</strong>
                    <span>{{ formatCurrency(entry.line_total) }}</span>
                  </div>
                  <div class="paid-breakdown-item-meta">
                    {{ entry.quantity }} × {{ formatCurrency(entry.unit_price) }}
                    <template v-if="entry.pharmacy_name"> · {{ entry.pharmacy_name }}</template>
                  </div>
                </div>
              </div>
              <div v-else class="items-empty-state">
                <strong>No priced items found.</strong>
                <p>Run the fulfillment process to generate item pricing.</p>
              </div>
              <div v-if="paidSnapshotExcludedItems.length" class="paid-breakdown-excluded">
                <h5>Not Included</h5>
                <ul>
                  <li v-for="entry in paidSnapshotExcludedItems" :key="`pay-excl-${entry.item_id}`">
                    {{ entry.product_name }} ({{ formatExcludedReason(entry.reason) }})
                  </li>
                </ul>
              </div>
              <div v-if="paymentModeItems.length" class="payment-cost-totals">
                <div class="payment-cost-row">
                  <span>Items Subtotal</span>
                  <span>{{ formatCurrency(paymentModeSubtotal) }}</span>
                </div>
                <div v-if="selectedRequest?.fulfillment_type === 'delivery'" class="payment-cost-row">
                  <span>Delivery Fee</span>
                  <span>{{ formatCurrency(selectedRequest?.delivery_fee) }}</span>
                </div>
                <div class="payment-cost-row payment-cost-row--total">
                  <strong>Total</strong>
                  <strong>{{ formatCurrency(paymentModeTotal) }}</strong>
                </div>
              </div>
            </section>

            <!-- Fulfillment plan -->
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <h4 class="section-title">Fulfillment Plan</h4>
              </div>
              <div v-if="pharmacyQueue?.length" class="pharmacy-queue-list">
                <div v-for="(plan, pqIdx) in pharmacyQueue" :key="plan.pharmacy_id ?? plan.pharmacy_name ?? pqIdx" class="pharmacy-queue-row">
                  <div class="pharmacy-queue-info">
                    <strong>{{ plan.pharmacy_name }}</strong>
                    <span v-if="plan.subtotal !== undefined">{{ formatCurrency(plan.subtotal) }}</span>
                    <span v-if="plan.distance_km !== undefined" style="color: #6b7280; font-size: 0.8rem;">{{ formatDistance(plan.distance_km) }}</span>
                  </div>
                  <div v-if="plan.coverage_items?.length" class="pharmacy-queue-items">
                    <span v-for="(item, ciIdx) in plan.coverage_items" :key="item.item_id ?? item.product_name ?? ciIdx" class="queue-item-chip">{{ item.product_name }} ×{{ item.matched_quantity }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="items-empty-state">
                <strong>Fulfillment plan not available.</strong>
                <p>Run the fulfillment process to see which pharmacies are fulfilling this order.</p>
              </div>
            </section>

          </template>

          <!-- fulfillment mode: preparing order -->
          <template v-else-if="workspaceMode === 'fulfillment'">
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
                <div v-for="entry in paidSnapshotItems" :key="`fulfil-${entry.item_id}`" class="paid-breakdown-item">
                  <div class="paid-breakdown-item-top">
                    <strong>{{ entry.product_name }}</strong>
                    <span>{{ formatCurrency(entry.line_total) }}</span>
                  </div>
                  <div class="paid-breakdown-item-meta">
                    Qty {{ entry.quantity }} | Unit {{ formatCurrency(entry.unit_price) }}
                  </div>
                </div>
              </div>
            </section>
            <section v-else class="section-card workspace-main-card">
              <div class="section-head">
                <h4 class="section-title">Fulfillment</h4>
                <span class="status-badge preparing">{{ formatStatus(selectedRequest?.status) }}</span>
              </div>
              <p class="workspace-panel-subcopy">Order is being prepared at the pharmacy. Payment snapshot not available yet.</p>
            </section>

            <!-- Deliveries section -->
            <section class="section-card workspace-main-card deliveries-section">
              <div class="section-head">
                <h4 class="section-title">Deliveries</h4>
                <button v-if="!loadingDeliveries && requestDeliveries.length === 0" class="btn btn-sm btn-primary" @click="initiateDeliveries">
                  Initiate Deliveries
                </button>
                <button v-else class="btn btn-sm btn-ghost" @click="fetchRequestDeliveries(selectedRequest.id)">
                  Refresh
                </button>
              </div>
              <div v-if="loadingDeliveries" class="items-empty-state"><p>Loading deliveries…</p></div>
              <div v-else-if="!requestDeliveries.length" class="items-empty-state">
                <p>No delivery records yet. Click "Initiate Deliveries" to create them.</p>
              </div>
              <div v-else class="delivery-cards">
                <div v-for="(d, dIdx) in requestDeliveries" :key="d.id ?? d.pickup_pharmacy_id ?? dIdx" class="delivery-card">
                  <div class="delivery-card-head">
                    <strong>{{ d.pharmacy_name || `Pharmacy #${d.pickup_pharmacy_id}` }}</strong>
                    <span class="delivery-status-chip" :class="`delivery-status-chip--${d.delivery_status}`">{{ d.delivery_status }}</span>
                  </div>
                  <div class="delivery-meta">
                    <span v-if="d.distance_km" :title="d.distance_method === 'haversine' ? 'Estimated distance (straight-line × 1.3)' : 'Driving distance (ORS)'">{{ d.distance_method === 'haversine' ? '~' : '' }}{{ Number(d.distance_km).toFixed(1) }} km<template v-if="d.duration_minutes"> · {{ Math.round(d.duration_minutes) }} min</template></span>
                    <span v-if="d.delivery_fee">GHS {{ Number(d.delivery_fee).toFixed(2) }} gross</span>
                    <span v-if="d.net_delivery_fee !== undefined">/ GHS {{ Number(d.net_delivery_fee).toFixed(2) }} net</span>
                    <span v-if="d.driver_name">Rider: {{ d.driver_name }}</span>
                  </div>
                  <div v-if="!['picking_up','picked_up','in_transit','delivered','failed','cancelled'].includes(d.delivery_status ?? '')" class="delivery-card-actions">
                    <a
                      v-if="d.pharmacy_whatsapp_number"
                      :href="buildPharmacyWhatsAppUrl(d)"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-sm"
                      style="background:#25d366;color:#fff;border:none;"
                    >WhatsApp Pharmacy</a>
                    <span v-else style="font-size:0.72rem;color:#9ca3af;">No WhatsApp on file</span>
                    <button
                      v-if="d.delivery_status === 'open'"
                      class="btn btn-sm btn-primary"
                      @click="openAssignToPharmacy(d)"
                    >Assign to Pharmacy</button>
                    <button
                      v-if="d.delivery_status !== 'assigned'"
                      class="btn btn-sm btn-outline"
                      @click="openForceAssign(d)"
                    >Force Assign Rider</button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Assign-to-pharmacy modal -->
            <div v-if="assignPharmacyModal" class="modal-backdrop" @click.self="closeAssignToPharmacy">
              <div class="modal-box">
                <h4 class="modal-title">Assign to Pharmacy</h4>
                <p class="modal-subtitle">Delivery #{{ assignPharmacyModal.delivery.id }} · {{ assignPharmacyModal.delivery.pharmacy_name }}</p>
                <p style="font-size:0.8rem;color:#6b7280;margin-top:0.5rem;">The pharmacy will assign one of their own riders.</p>
                <div class="modal-actions">
                  <button class="btn btn-ghost" @click="closeAssignToPharmacy">Cancel</button>
                  <button class="btn btn-primary" @click="submitAssignToPharmacy" :disabled="assigningPharmacy">
                    {{ assigningPharmacy ? 'Assigning...' : 'Confirm' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Force-assign modal -->
            <div v-if="forceAssignModal" class="modal-backdrop" @click.self="closeForceAssign">
              <div class="modal-box">
                <h4 class="modal-title">Force Assign Rider</h4>
                <p class="modal-subtitle">Delivery #{{ forceAssignModal.delivery.id }} · {{ forceAssignModal.delivery.pharmacy_name }}</p>
                <label class="form-label">Rider ID</label>
                <input v-model="forceAssignModal.driverId" type="number" class="form-input" placeholder="Enter driver ID" />
                <div class="modal-actions">
                  <button class="btn btn-ghost" @click="closeForceAssign">Cancel</button>
                  <button class="btn btn-primary" @click="submitForceAssign">Assign</button>
                </div>
              </div>
            </div>

            <section v-if="logisticsAssessment" class="section-card workspace-main-card">
              <div class="section-head">
                <h4 class="section-title">Logistics</h4>
              </div>
              <div class="logistics-summary">
                <span><strong>Mode:</strong> {{ logisticsAssessment.mode || '—' }}</span>
                <span v-if="logisticsAssessment.estimated_delivery_minutes"><strong>ETA:</strong> {{ logisticsAssessment.estimated_delivery_minutes }} min</span>
                <span v-if="logisticsAssessment.notes" class="muted">{{ logisticsAssessment.notes }}</span>
              </div>
            </section>
          </template>

          <!-- transit mode: in transit / out for delivery -->
          <template v-else-if="workspaceMode === 'transit'">
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">In Transit</h4>
                  <p class="workspace-panel-subcopy">Order is on its way to the customer.</p>
                </div>
                <span class="status-badge in_transit">{{ formatStatus(selectedRequest?.status) }}</span>
              </div>
              <div v-if="logisticsAssessment" class="logistics-summary">
                <span><strong>Mode:</strong> {{ logisticsAssessment.mode || '—' }}</span>
                <span v-if="logisticsAssessment.estimated_delivery_minutes"><strong>ETA:</strong> {{ logisticsAssessment.estimated_delivery_minutes }} min</span>
                <span v-if="logisticsAssessment.driver_name"><strong>Driver:</strong> {{ logisticsAssessment.driver_name }}</span>
                <span v-if="logisticsAssessment.notes" class="muted">{{ logisticsAssessment.notes }}</span>
              </div>
              <div v-else class="items-empty-state">
                <p>Transit details not available.</p>
              </div>
            </section>
            <section class="section-card workspace-main-card deliveries-section">
              <div class="section-head">
                <h4 class="section-title">Deliveries</h4>
                <button class="btn btn-sm btn-ghost" @click="fetchRequestDeliveries(selectedRequest.id)">Refresh</button>
              </div>
              <div v-if="loadingDeliveries" class="items-empty-state"><p>Loading…</p></div>
              <div v-else-if="!requestDeliveries.length" class="items-empty-state"><p>No delivery records found.</p></div>
              <div v-else class="delivery-cards">
                <div v-for="d in requestDeliveries" :key="`transit-d-${d.id}`" class="delivery-card">
                  <div class="delivery-card-head">
                    <strong>{{ d.pharmacy_name || `Pharmacy #${d.pickup_pharmacy_id}` }}</strong>
                    <span class="delivery-status-chip" :class="`delivery-status-chip--${d.delivery_status}`">{{ d.delivery_status }}</span>
                  </div>
                  <div class="delivery-meta">
                    <span v-if="d.driver_name">Rider: {{ d.driver_name }}</span>
                    <span v-if="d.delivery_fee">GHS {{ Number(d.delivery_fee).toFixed(2) }} gross</span>
                    <span v-if="d.net_delivery_fee !== undefined">/ GHS {{ Number(d.net_delivery_fee).toFixed(2) }} net</span>
                    <span v-if="d.distance_km" :title="d.distance_method === 'haversine' ? 'Estimated distance (straight-line × 1.3)' : 'Driving distance (ORS)'">{{ d.distance_method === 'haversine' ? '~' : '' }}{{ Number(d.distance_km).toFixed(1) }} km<template v-if="d.duration_minutes"> · {{ Math.round(d.duration_minutes) }} min</template></span>
                  </div>
                  <div v-if="!['picking_up','picked_up','in_transit','delivered','failed','cancelled'].includes(d.delivery_status ?? '')" class="delivery-card-actions">
                    <a
                      v-if="d.pharmacy_whatsapp_number"
                      :href="buildPharmacyWhatsAppUrl(d)"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-sm"
                      style="background:#25d366;color:#fff;border:none;"
                    >WhatsApp Pharmacy</a>
                    <button
                      v-if="d.delivery_status === 'open'"
                      class="btn btn-sm btn-primary"
                      @click="openAssignToPharmacy(d)"
                    >Assign to Pharmacy</button>
                    <button
                      v-if="d.delivery_status !== 'assigned'"
                      class="btn btn-sm btn-outline"
                      @click="openForceAssign(d)"
                    >Force Assign Rider</button>
                  </div>
                </div>
              </div>
            </section>
          </template>

          <!-- pickup mode: ready for pickup -->
          <template v-else-if="workspaceMode === 'pickup'">
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Ready for Pickup</h4>
                  <p class="workspace-panel-subcopy">Order is ready at the pharmacy for customer pickup.</p>
                </div>
                <span class="status-badge ready_for_pickup">{{ formatStatus(selectedRequest?.status) }}</span>
              </div>
              <div v-if="pharmacyQueue?.length" class="pharmacy-queue-list">
                <div v-for="plan in pharmacyQueue" :key="`pickup-${plan.pharmacy_id}`" class="pharmacy-queue-row">
                  <strong>{{ plan.pharmacy_name }}</strong>
                  <span v-if="plan.pharmacy_address" class="muted">{{ plan.pharmacy_address }}</span>
                </div>
              </div>
              <div v-else class="items-empty-state">
                <p>Pickup pharmacy details not available.</p>
              </div>
            </section>
          </template>

          <!-- done mode: completed orders with paid breakdown + feedback -->
          <template v-else-if="workspaceMode === 'done'">
            <section class="section-card section-card--customer workspace-main-card paid-request-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Completed Order</h4>
                  <p class="workspace-panel-subcopy">This order has been fulfilled and closed.</p>
                </div>
                <span class="status-badge paid">{{ formatStatus(selectedRequest?.status) }}</span>
              </div>
              <div v-if="latestPaymentSnapshot" class="paid-breakdown-summary">
                <span><strong>Total Paid:</strong> {{ formatCurrency(latestPaymentSnapshot?.summary?.total_paid) }}</span>
                <span><strong>Items:</strong> {{ paidSnapshotItems.length }}</span>
                <span><strong>Sources:</strong> {{ latestPaymentSnapshot?.summary?.source_pharmacy_count || 0 }}</span>
                <span><strong>Paid At:</strong> {{ formatDateTime(latestPaymentSnapshot?.payment?.paid_at || latestPaymentSnapshot?.captured_at) }}</span>
              </div>
              <div v-if="paidSnapshotItems.length" class="paid-breakdown-list">
                <div v-for="entry in paidSnapshotItems" :key="`done-${entry.item_id}`" class="paid-breakdown-item">
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
                  <li v-for="entry in paidSnapshotExcludedItems" :key="`done-excl-${entry.item_id}`">
                    {{ entry.product_name }} ({{ formatExcludedReason(entry.reason) }})
                  </li>
                </ul>
              </div>
            </section>
            <section v-if="selectedRequest?.feedback" class="section-card section-card--customer workspace-main-card">
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
          </template>

          <!-- terminal mode: cancelled / returned / expired -->
          <template v-else>
            <section class="section-card workspace-main-card">
              <div class="section-head">
                <div>
                  <h4 class="section-title">Order Closed</h4>
                  <p class="workspace-panel-subcopy">This request has been closed and is no longer active.</p>
                </div>
                <span class="status-badge cancelled">{{ formatStatus(selectedRequest?.status) }}</span>
              </div>
              <div v-if="selectedRequest?.notes || selectedRequest?.cancellation_reason" class="terminal-notes">
                <p v-if="selectedRequest.cancellation_reason"><strong>Reason:</strong> {{ selectedRequest.cancellation_reason }}</p>
                <p v-if="selectedRequest.notes" class="muted">{{ selectedRequest.notes }}</p>
              </div>
              <div v-else class="items-empty-state">
                <p>No additional details available for this closed order.</p>
              </div>
            </section>
          </template>

          </div>

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

    <!-- Response Modal: per-item availability, quantity, price capture -->
    <div v-if="responseModal.open" class="workspace-nested-overlay" @click.self="closeResponseModal">
      <div class="workspace-nested-modal response-capture-modal">
        <div class="workspace-nested-head">
          <div>
            <span class="workspace-nested-label">Pharmacy Response</span>
            <h4>
              {{ responseModal.pharmacy?.pharmacy_name }}
              <span class="response-mode-badge" :class="'response-mode-badge--' + responseModal.mode">
                {{ responseModal.mode === 'full' ? 'Full availability' : 'Partial availability' }}
              </span>
            </h4>
            <p v-if="responseModal.pharmacy?.pharmacy_id && pharmacyLedgerMap[responseModal.pharmacy.pharmacy_id]" class="response-modal-pharmacy-summary">
              <template v-if="pharmacyLedgerMap[responseModal.pharmacy.pharmacy_id]!.request_count ?? 0 > 0">
                {{ pharmacyLedgerMap[responseModal.pharmacy.pharmacy_id]!.request_count }} order{{ pharmacyLedgerMap[responseModal.pharmacy.pharmacy_id]!.request_count !== 1 ? 's' : '' }} fulfilled
                <template v-if="pharmacyLedgerMap[responseModal.pharmacy.pharmacy_id]!.last_transaction_at"> · last {{ formatRelativeTime(pharmacyLedgerMap[responseModal.pharmacy.pharmacy_id]!.last_transaction_at) }}</template>
              </template>
              <template v-else>No orders fulfilled yet</template>
            </p>
          </div>
          <button type="button" class="modal-close" @click="closeResponseModal">
            <XMarkIcon class="close-svg" />
          </button>
        </div>

        <div class="workspace-nested-content">
          <div class="response-modal-summary">
            <span class="response-modal-summary-count">
              {{ responseModal.items.filter(i => i.available).length }} of {{ responseModal.items.length }} items available
            </span>
            <span v-if="responseModal.mode === 'partial'" class="response-modal-summary-hint">
              Check each item the pharmacy has in stock
            </span>
            <span v-if="sourcingMode === 'split'" class="response-modal-split-note">
              Split mode — showing {{ responseModal.items.length }} unsourced item{{ responseModal.items.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="response-items-list">
            <div
              v-for="(item, idx) in responseModal.items"
              :key="item.item_id ?? idx"
              class="response-item-row"
              :class="{ 'response-item-row--available': item.available, 'response-item-row--unavailable': !item.available }"
            >
              <!-- Availability toggle -->
              <label class="response-item-checkbox">
                <input type="checkbox" v-model="item.available" />
                <span class="response-item-name">{{ item.product_name }}</span>
                <span class="response-item-req">
                  ×{{ item.requested_quantity }}<template v-if="item.requested_unit"> {{ item.requested_unit }}</template>
                </span>
              </label>

              <!-- Detail fields — only shown when available -->
              <div v-if="item.available" class="response-item-fields">
                <div class="response-field-group">
                  <label>Qty available</label>
                  <input
                    v-model.number="item.available_quantity"
                    type="number"
                    min="1"
                    :max="item.requested_quantity ?? ''"
                    step="1"
                    class="form-control response-qty-input"
                    placeholder="Qty"
                  />
                </div>
                <div class="response-field-group">
                  <label>Unit price (GHS)</label>
                  <div class="response-price-row">
                    <input
                      v-model="item.unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control response-price-input"
                      :class="{ 'response-price-input--catalog': item.is_price_from_catalog }"
                      placeholder="e.g. 12.50"
                      @input="item.is_price_from_catalog = false"
                    />
                    <label class="response-substitute-inline">
                      <input type="checkbox" v-model="item.showSubstitute" @change="if (!item.showSubstitute) { item.allocation_type = 'exact'; item.substitute_name = ''; item.substitute_note = '' }" />
                      Substitute?
                    </label>
                  </div>
                  <div v-if="item.catalog_price != null" class="response-price-hint">
                    <span class="response-price-hint-label">Catalog: GHS {{ Number(item.catalog_price).toFixed(2) }}</span>
                    <span v-if="item.catalog_synced_at" class="response-price-hint-sync">· synced {{ formatRelativeTime(item.catalog_synced_at) }}</span>
                  </div>
                </div>
                <template v-if="item.showSubstitute">
                  <div class="response-field-group response-field-wide" style="grid-column: 1 / -1;">
                    <label>Substitute product name</label>
                    <input
                      v-model="item.substitute_name"
                      type="text"
                      class="form-control"
                      placeholder="e.g. Panadol Extra 500mg"
                      @input="item.allocation_type = item.substitute_name ? 'substitute' : 'exact'"
                    />
                  </div>
                  <div class="response-field-group response-field-wide" style="grid-column: 1 / -1;">
                    <label>Substitute note</label>
                    <input
                      v-model="item.substitute_note"
                      type="text"
                      class="form-control"
                      placeholder="e.g. Same strength, different brand"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="response-note-field">
            <label>Response note (optional)</label>
            <textarea
              v-model="responseModal.note"
              class="form-control"
              rows="2"
              placeholder="e.g. Stock arrives Thursday, only has capsules"
            />
          </div>
        </div>

        <div class="workspace-nested-actions">
          <button type="button" class="btn-secondary" @click="closeResponseModal" :disabled="responseModal.submitting">
            Cancel
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="submitResponseModal"
            :disabled="responseModal.submitting || responseModal.items.filter(i => i.available).length === 0"
          >
            {{ responseModal.submitting ? 'Saving…' : 'Submit Response' }}
          </button>
        </div>
      </div>
    </div>

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

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '~/stores/admin'
import { phoneUtils } from '~/utils/phone'
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'
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

// ---------------------------------------------------------------------------
// Local type definitions — these reflect the actual API response shapes used
// on this page. The service layer exposes a minimal OrderRequest; the full
// shape is only needed here.
// ---------------------------------------------------------------------------

interface Allocation {
  id?: number
  pharmacy_id?: number
  allocated_quantity?: number
  allocation_type?: string
  status?: string
  unit_price?: number | null
  substitute_name?: string | null
  substitute_note?: string | null
  created_at?: string
  updated_at?: string
  // UI-hydrated fields
  editing?: boolean
  edit_allocated_quantity?: number
  edit_allocation_type?: string
  edit_status?: string
  edit_substitute_name?: string
  edit_substitute_note?: string
  [key: string]: unknown
}

interface RequestItem {
  id: number
  product_name?: string | null
  quantity?: number
  requested_quantity?: number
  requested_unit?: string | null
  source_pharmacy_id?: number | null
  source_product_id?: number | null
  source_product_name?: string | null
  source_distance_km?: number | null
  source_type?: string | null
  unit_price?: number | null
  marked_up_price?: number | null
  line_total?: number | null
  item_status?: string | null
  sourcing_status?: string | null
  resolution_status?: string | null
  master_product_id?: number | null
  master_product_description?: string | null
  master_product_strength?: string | null
  master_product_unit?: string | null
  pharmacy_name?: string | null
  pharmacy_phone?: string | null
  allocations?: Allocation[]
  allocation_pharmacy_id?: number | string
  allocation_quantity?: number
  allocation_type?: string
  allocation_status?: string
  allocation_unit_price?: number | string
  sourced_quantity?: number
  substitute_name?: string
  substitute_note?: string
  // UI-hydrated fields
  editing?: boolean
  edit_price?: number | string
  product_search?: string
  productSearchResults?: ProductSearchResult[]
  showProductDropdown?: boolean
  product_search_loading?: boolean
  selected_source_product_id?: number | null
  selected_source_distance_km?: number | null
  selected_source_summary?: SourceSummary | null
  selection_dirty?: boolean
  showSourcingDropdown?: boolean
  productSearchDebounceHandle?: ReturnType<typeof setTimeout> | null
  [key: string]: unknown
}

interface SourceSummary {
  pharmacyId?: number | null
  name?: string
  productName?: string | null
  distance?: string | null
  price?: string | null
}

interface CoverageItem {
  item_id?: number
  product_name?: string
  matched_product_id?: number | null
  available_quantity?: number
  matched_quantity?: number
  unit_price?: number | null
  catalog_synced_at?: string | null
  fuzzy_match?: { matched_product_name?: string; price?: number; stock?: number } | null
  master_match?: { matched_product_name?: string; price?: number; stock?: number } | null
  [key: string]: unknown
}

interface UncoveredItem {
  item_id?: number
  product_name?: string
  [key: string]: unknown
}

interface PharmacyQueueEntry {
  id?: number
  pharmacy_id?: number
  name?: string
  pharmacy_name?: string
  distance_km?: number
  phone?: string | null
  whatsapp_url?: string | null
  contacted_at?: string | null
  responded_at?: string | null
  pharmacy_status?: string | null
  response_status?: string | null
  response_note?: string | null
  queue_state?: string | null
  is_confirmed?: boolean
  fully_covers_request?: boolean
  coverage_items?: CoverageItem[]
  covered?: CoverageItem[]
  uncovered?: UncoveredItem[]
  coverage_score?: number
  matched_item_count?: number
  fully_covered_item_count?: number
  matched_quantity_total?: number
  exact_match_count?: number
  substitute_count?: number
  missing_item_count?: number
  company_id?: number
  subtotal?: number
  total_items?: number
  [key: string]: unknown
}

interface PaymentSnapshotItem {
  item_id?: number; product_name?: string; original_product_name?: string | null
  substitute_applied?: boolean; quantity?: number; unit_price?: number; line_total?: number
  source_pharmacy_id?: number | null; distance_km?: number | null; pharmacy_name?: string | null
  [key: string]: unknown
}
interface PaymentSnapshotExcludedItem {
  item_id?: number; product_name?: string; reason?: string; [key: string]: unknown
}
interface PaymentSnapshot {
  version?: number; captured_at?: string | null
  selected_items?: PaymentSnapshotItem[]; excluded_items?: PaymentSnapshotExcludedItem[]
  summary?: { total_paid?: number; source_pharmacy_count?: number; [key: string]: unknown }
  payment?: { method?: string; amount_paid?: number; paid_at?: string | null; [key: string]: unknown }
  [key: string]: unknown
}
interface CustomerDecision {
  id?: number
  status?: string
  decision_type?: string
  created_at?: string
  customer_notified_at?: string | null
  expires_at?: string | null
  payload?: {
    payment_snapshot?: PaymentSnapshot | null
    decision_items?: DecisionItem[]
    summary?: {
      decision_context?: string; requested_items?: number; available_items?: number
      missing_items?: number; substitute_proposals?: number; is_split_source?: boolean
      source_pharmacy_count?: number; [key: string]: unknown
    }
    [key: string]: unknown
  }
  whatsapp_url?: string | null
  [key: string]: unknown
}

interface DecisionItem {
  item_id?: number; item_name?: string; product_name?: string; status?: string
  unit_price?: number | null; quantity?: number; source_pharmacy_id?: number | null
  source_pharmacy_name?: string | null; substitute_name?: string | null
  substitute_note?: string | null
  substitute_option?: { marked_up_price?: number; name?: string; [key: string]: unknown } | null
  [key: string]: unknown
}

interface RequestFeedback {
  rating?: number | null
  reason?: string | null
  comment?: string | null
  created_at?: string | null
  [key: string]: unknown
}

interface RichOrderRequest {
  id: number
  request_number?: string
  customer_id?: number
  customer_name?: string | null
  customer_phone?: string | null
  customer_address?: string | null
  customer_latitude?: number | null
  customer_longitude?: number | null
  customer_lat?: number | null
  customer_lng?: number | null
  latitude?: number | null
  longitude?: number | null
  lat?: number | null
  lng?: number | null
  delivery_latitude?: number | null
  delivery_longitude?: number | null
  delivery_lat?: number | null
  delivery_lng?: number | null
  status: string
  created_at: string
  updated_at?: string
  expires_at?: string | null
  items?: RequestItem[]
  fulfillment_type?: string | null
  delivery_fee?: number | null
  request_fee?: number | string | null
  computed_cost?: number | null
  item_count?: number
  has_prescription?: boolean
  prescription_image_url?: string | null
  prescription_images?: string[]
  nearby_pharmacies?: PharmacyQueueEntry[]
  pharmacy_queue?: PharmacyQueueEntry[]
  customer_decisions?: CustomerDecision[]
  feedback?: RequestFeedback | null
  admin_notes?: string | null
  sourcing_radius_km?: number | null
  [key: string]: unknown
}

interface OrderStats {
  pending: number
  processing: number
  completed: number
  total: number
  [key: string]: unknown
}

interface Delivery {
  id?: number; status?: string; delivery_status?: string
  pharmacy_name?: string | null; pharmacy_whatsapp_number?: string | null
  pharmacy_domain?: string | null; pickup_pharmacy_id?: number | null
  net_delivery_fee?: number | null; delivery_fee?: number | null
  distance_km?: number | null; distance_method?: string | null
  duration_minutes?: number | null; driver_name?: string | null; driver_id?: number | null
  [key: string]: unknown
}

interface PharmacyCoverageData {
  pharmacies?: PharmacyQueueEntry[]
  data?: { pharmacies?: PharmacyQueueEntry[]; [key: string]: unknown }
  [key: string]: unknown
}

interface ProductSearchResult {
  id?: number
  product_description?: string | null
  product_name?: string | null
  brand_name?: string | null
  master_name?: string | null
  strength?: string | null
  unit?: string | null
  price?: number | null
  min_price?: number | null
  max_price?: number | null
  available_quantity?: number | null
  distance_km?: number | null
  company_name?: string | null
  pharmacy_id?: number | null
  company_id?: number | null
  pharmacy_name?: string | null
  uniqid?: number | null
  [key: string]: unknown
}

interface LedgerEntry {
  pharmacy_id?: number
  request_count?: number
  last_transaction_at?: string | null
  [key: string]: unknown
}

interface PhoneEditState {
  editing: boolean
  value: string
  saving: boolean
}

interface AllocationSummary {
  [key: string]: unknown
}

interface LogisticsAssessment {
  [key: string]: unknown
}

interface NextRecommendedPharmacy {
  pharmacy_id?: number
  pharmacy_name?: string
  [key: string]: unknown
}

interface FulfillmentPlanItem {
  item_id?: number
  product_name?: string
  matched_quantity?: number
  available_quantity?: number
  unit_price?: number | null
  source_pharmacy_id?: number | null
  likely_match_type?: string
  allocated_quantity?: number
  allocations?: Array<{ pharmacy_id?: number; matched_quantity?: number; available_quantity?: number; unit_price?: number | null; distance_km?: number }>
  [key: string]: unknown
}

interface FulfillmentPlan {
  label?: string
  pharmacies?: Array<{ pharmacy_id?: number; pharmacy_name?: string; [key: string]: unknown }>
  items?: FulfillmentPlanItem[]
  [key: string]: unknown
}

// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  { label: 'Pending',         statuses: ['pending'],                                                                                      nextStatus: 'composing',       nextLabel: 'Start Composing'      },
  { label: 'Composing',       statuses: ['composing', 'composed'],                                                                        nextStatus: 'sourcing',        nextLabel: 'Start Sourcing'       },
  { label: 'Sourcing',        statuses: ['sourcing', 'confirming_with_pharm', 'processing', 'enquiry_sent'],                              nextStatus: 'awaiting_input',  nextLabel: 'Send to Customer'     },
  { label: 'Awaiting Input',  statuses: ['awaiting_input', 'awaiting_customer'],                                                          nextStatus: 'payment_pending', nextLabel: 'Mark Payment Pending' },
  { label: 'Payment Pending', statuses: ['payment_pending', 'awaiting_method_selection', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'], nextStatus: 'paid',            nextLabel: 'Mark as Paid'         },
  { label: 'Paid',            statuses: ['paid', 'preparing', 'logistics_pending', 'driver_unavailable'],                                 nextStatus: null,              nextLabel: null                   },
  { label: 'In Transit',      statuses: ['in_transit', 'driver_assigned', 'out_for_delivery', 'ready_for_pickup', 'ready_to_order'],      nextStatus: null,              nextLabel: null                   },
  { label: 'Done',            statuses: ['delivered', 'picked_up', 'completed'],                                                          nextStatus: null,              nextLabel: null                   },
]

const adminStore = useAdminStore()
const orderRequestsService = createOrderRequestsService(useApi())

// State
const loading = ref(false)
const requests = ref<RichOrderRequest[]>([])
const stats = ref<OrderStats | null>(null)
const searchQuery = ref('')
const statusFilter = ref('')
const selectedRequest = ref<RichOrderRequest | null>(null)
const selectedStatus = ref('')
const composedSummaryRequest = ref<RichOrderRequest | null>(null)
const composedSummaryStatus = ref('')
const composedGroupActions = ref<Record<string | number, string>>({})
const openingRequestId = ref<number | null>(null)
const activeRequestItemId = ref<number | null>(null)
const activePrescriptionImageIndex = ref(0)
const adminNotes = ref('')
const nearbyPharmacies = ref<PharmacyQueueEntry[]>([])
const candidatePlans = ref<FulfillmentPlan[]>([])
const fulfillmentPlans = ref<FulfillmentPlan[]>([])
const fulfillmentProcessLoading = ref(false)
const allocationSummary = ref<AllocationSummary | null>(null)
const pharmacyQueue = ref<PharmacyQueueEntry[]>([])
const nextRecommendedPharmacy = ref<NextRecommendedPharmacy | null>(null)
const logisticsAssessment = ref<LogisticsAssessment | null>(null)
const pharmacyLedgerMap = ref<Record<number, LedgerEntry>>({}) // keyed by pharmacy_id
const pharmacyPhoneEdit = ref<Record<number, PhoneEditState>>({}) // keyed by pharmacy_id
const message = ref<{ text: string; type: string } | null>(null)

// --- Delivery management state ---
const requestDeliveries = ref<Delivery[]>([])
const loadingDeliveries = ref(false)
const forceAssignModal = ref<{ delivery: Delivery; driverId: string | number } | null>(null)
const assignPharmacyModal = ref<{ delivery: Delivery } | null>(null)
const assigningPharmacy = ref(false)

// --- Coverage matrix state ---
const pharmacyCoverage = ref<PharmacyCoverageData | null>(null)
const coverageLoading = ref(false)
const masterSearchResults = ref<ProductSearchResult[]>([])
const masterSearchLoading = ref(false)
const masterSearchQuery = ref('')
const resolvingItemId = ref<number | null>(null)
let masterSearchDebounce: ReturnType<typeof setTimeout> | null = null
const showStatusOverride = ref(false)
const showAdminNotes = ref(false)
const resolveSearchMode = ref('pharmacy') // 'master' | 'pharmacy'
const pharmResolveResults = ref<ProductSearchResult[]>([])
const pharmResolveLoading = ref(false)
let pharmResolveDebounce: ReturnType<typeof setTimeout> | null = null

// --- Coverage substitute search state ---
const coverageSubSearch = ref<{ pharmacyId: number | null; companyId?: number | null; itemId: number | null; query: string; results: ProductSearchResult[]; loading: boolean }>({ pharmacyId: null, itemId: null, query: '', results: [], loading: false })
let coverageSubDebounce: ReturnType<typeof setTimeout> | null = null
// --- End coverage substitute search state ---

const isItemResolved = (item: RequestItem) =>
  item.resolution_status === 'resolved' || Boolean(item.master_product_id) || Boolean(item.source_pharmacy_id)
const resolvedItemCount = computed(() => {
  const items = requestItems.value || []
  return items.filter(isItemResolved).length
})
const allItemsResolved = computed(() => {
  const items = requestItems.value || []
  return items.length > 0 && items.every(isItemResolved)
})
// Write actions are locked until admin clicks "Start Composing" (status moves off 'pending')
const isComposeLocked = computed(() => selectedRequest.value?.status === 'pending')
// --- End coverage matrix state ---

const REQUEST_POLL_MS = 5000
let requestPollTimer: number | null = null
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
const createAdminNewItemDraft = (): {
  product_id: string | null; product_search: string; requested_unit: string
  quantity: number; requested_quantity: number
  selected_source_pharmacy_id: number | null; selected_source_product_id: number | null
  selected_source_distance_km: number | null; selected_source_summary: SourceSummary | null
  selected_source_price: number | null; productSearchResults: ProductSearchResult[]
  showProductDropdown: boolean; product_search_loading: boolean
  productSearchDebounceHandle: ReturnType<typeof setTimeout> | null
} => ({
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
const alternativeModal = ref<{
  open: boolean; item: RequestItem | null; pharmacy_id: string
  allocated_quantity: number; name: string; productSearchResults: ProductSearchResult[]
  showProductDropdown: boolean; product_search_loading: boolean; note: string; price: string
  productSearchDebounceHandle?: ReturnType<typeof setTimeout> | null
}>({
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
interface ResponseModalItem {
  id?: number; item_id?: number; product_name?: string | null; available: boolean
  requested_quantity?: number; requested_unit?: string | null
  available_quantity?: number; unit_price?: number | string | null
  is_price_from_catalog?: boolean; showSubstitute?: boolean
  allocation_type?: string; substitute_name?: string; substitute_note?: string
  catalog_price?: number | null; catalog_synced_at?: string | null
  [key: string]: unknown
}
const responseModal = ref<{
  open: boolean; pharmacy: PharmacyQueueEntry | null; mode: string
  submitting: boolean; note: string; items: ResponseModalItem[]
}>({
  open: false,
  pharmacy: null,
  mode: 'full',
  submitting: false,
  note: '',
  items: []
})
const sourcingMode = ref('single') // 'single' | 'split'
const prescriptionPreview = ref({
  open: false,
  url: '',
  index: 0
})

const STATUS_TAB_CONFIG = [
  { value: '', label: 'All', statuses: [] },
  { value: 'pending', label: 'New Requests', statuses: ['pending'] },
  { value: 'composing', label: 'Composing', statuses: ['composing', 'composed'] },
  { value: 'sourcing', label: 'Sourcing', statuses: ['sourcing', 'confirming_with_pharm'] },
  { value: 'awaiting_input', label: 'Awaiting Customer', statuses: ['awaiting_input', 'awaiting_customer'] },
  { value: 'payment_pending', label: 'Payment Pending', statuses: ['payment_pending', 'confirmed_in_pharm', 'items_sourced', 'confirmed'] },
  { value: 'paid', label: 'Paid', statuses: ['paid'] },
  { value: 'in_transit', label: 'In Transit', statuses: ['in_transit', 'out_for_delivery', 'driver_assigned'] }
]

const STATUS_SELECTOR_OPTIONS = [
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready_for_pickup', label: 'Ready For Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  // Legacy statuses available for manual override
  { value: 'logistics_pending', label: 'Logistics Pending (legacy)' },
  { value: 'driver_unavailable', label: 'Driver Unavailable (legacy)' }
]

const normalizeRequestStatus = (value: unknown) => String(value || '').trim().toLowerCase()

const matchesStatusFilter = (request: RichOrderRequest, filterValue = statusFilter.value) => {
  if (!filterValue) return true

  const status = normalizeRequestStatus(request?.status)
  const tabConfig = STATUS_TAB_CONFIG.find((tab) => tab.value === filterValue)
  if (tabConfig) return tabConfig.statuses.includes(status)

  return status === normalizeRequestStatus(filterValue)
}

const sortKey = ref('updated_at')
const sortDir = ref('desc')

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
}

const getNextStageLabel = (req: RichOrderRequest | null | undefined) => {
  const status = normalizeRequestStatus(req?.status)
  if (!status) return null
  const idx = PIPELINE_STAGES.findIndex(s => s.statuses.includes(status))
  if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return null
  const isPickup = String(req?.fulfillment_type || '').toLowerCase().includes('pickup')
  if (idx === 5) return isPickup ? 'Ready for Pickup' : 'In Transit'
  if (idx === 6) return isPickup ? 'Picked Up' : 'Delivered'
  return PIPELINE_STAGES[idx + 1]?.label ?? null
}

const getRequestComposedCost = (req: RichOrderRequest | null | undefined) => {
  const precomputed = Number(req?.computed_cost ?? null)
  if (Number.isFinite(precomputed) && precomputed > 0) return precomputed
  const items = Array.isArray(req?.items) ? req.items : []
  const sourcedItems = items.filter((item) => isSavedSelectionItem(item))
  if (!sourcedItems.length) return null
  return sourcedItems.reduce((sum: number, item: RequestItem) => {
    const lineTotal = Number(item?.line_total || 0)
    if (Number.isFinite(lineTotal) && lineTotal > 0) return sum + lineTotal
    const qty = Number(item?.quantity || 1)
    const price = Number(item?.marked_up_price || item?.unit_price || 0)
    return sum + (qty * price)
  }, 0)
}

const filteredRequests = computed(() => {
  const filtered = requests.value.filter((request) => matchesStatusFilter(request))
  // Pending tab: sort by expires_at ascending so most urgent appear first
  if (statusFilter.value === 'pending') {
    return [...filtered].sort((a, b) => {
      if (!a.expires_at && !b.expires_at) return 0
      if (!a.expires_at) return 1
      if (!b.expires_at) return -1
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    })
  }
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    if (key === 'updated_at') {
      const aTime = new Date(a?.updated_at || a?.created_at || 0).getTime()
      const bTime = new Date(b?.updated_at || b?.created_at || 0).getTime()
      return (aTime - bTime) * dir
    }
    if (key === 'request_number') {
      return String(a?.request_number || '').localeCompare(String(b?.request_number || '')) * dir
    }
    if (key === 'status') {
      return String(a?.status || '').localeCompare(String(b?.status || '')) * dir
    }
    if (key === 'items') {
      const aCount = Array.isArray(a?.items) ? a.items.length : 0
      const bCount = Array.isArray(b?.items) ? b.items.length : 0
      return (aCount - bCount) * dir
    }
    if (key === 'cost') {
      const aCost = getRequestComposedCost(a) ?? -1
      const bCost = getRequestComposedCost(b) ?? -1
      return (aCost - bCost) * dir
    }
    return 0
  })
})

const EXPIRY_WARN_MS = 20 * 60 * 1000
const EXPIRY_CRITICAL_MS = 10 * 60 * 1000

const expiringSoonCount = computed(() =>
  requests.value.filter(r =>
    r.status === 'pending' &&
    r.expires_at &&
    new Date(r.expires_at).getTime() - Date.now() > 0 &&
    new Date(r.expires_at).getTime() - Date.now() < EXPIRY_WARN_MS
  ).length
)

const rowUrgencyStyle = (req: RichOrderRequest) => {
  if (req.status !== 'pending' || !req.expires_at) return ''
  const remaining = new Date(req.expires_at).getTime() - Date.now()
  if (remaining <= 0) return ''
  if (remaining < EXPIRY_CRITICAL_MS) return 'background: #fff1f2 !important; border-left: 3px solid #f87171;'
  if (remaining < EXPIRY_WARN_MS) return 'background: #fffbeb !important; border-left: 3px solid #fbbf24;'
  return ''
}

const statusTabs = computed(() => STATUS_TAB_CONFIG.map((tab) => ({
  ...tab,
  count: tab.value
    ? requests.value.filter((request: RichOrderRequest) => tab.statuses.includes(normalizeRequestStatus(request?.status))).length
    : requests.value.length
})))

const statusSelectorOptions = computed(() => STATUS_SELECTOR_OPTIONS.map((option) => ({
  ...option,
  count: requests.value.filter((request: RichOrderRequest) => normalizeRequestStatus(request?.status) === option.value).length
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
  return items.filter((item: RequestItem) => isSavedSelectionItem(item))
})

const savedSelectionsTotal = computed(() => persistedSelectionItems.value.reduce((sum: number, item: RequestItem) => {
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

const getCustomerWhatsAppUrl = (phone: string | null | undefined) => {
  const digits = phoneUtils.formatWhatsApp(phone)
  return digits ? `https://wa.me/${digits}` : ''
}

const buildCustomerOrderLink = (id: number | string | null | undefined) => {
  if (!id) return ''
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/customer?tab=requests&requestId=${encodeURIComponent(id)}`
}

const customerDecisionWhatsAppUrl = computed(() => {
  const phone = selectedRequest.value?.customer_phone
  const digits = phoneUtils.formatWhatsApp(phone)
  if (!digits) return ''
  const name = String(selectedRequest.value?.customer_name || '').trim() || 'there'
  const num = String(selectedRequest.value?.request_number || '').trim()
  const link = buildCustomerOrderLink(selectedRequest.value?.id)
  const text = `Hi ${name}, your MedsGH request${num ? ` ${num}` : ''} needs your attention — we've found options for your medications. Please review and confirm here:\n${link}\n- MedsGH Team`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
})

const customerPaymentWhatsAppUrl = computed(() => {
  const phone = selectedRequest.value?.customer_phone
  const digits = phoneUtils.formatWhatsApp(phone)
  if (!digits) return ''
  const name = String(selectedRequest.value?.customer_name || '').trim() || 'there'
  const num = String(selectedRequest.value?.request_number || '').trim()
  const total = paymentModeTotal.value
  const totalStr = total > 0 ? ` GHS ${total.toFixed(2)}` : ''
  const link = buildCustomerOrderLink(selectedRequest.value?.id)
  const text = `Hi ${name}, your MedsGH order${num ? ` ${num}` : ''} is confirmed and awaiting payment.${totalStr ? ` Total:${totalStr}.` : ''} Please complete your payment here:\n${link}\n- MedsGH Team`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
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

const getRequestedQuantity = (item: RequestItem | null | undefined) => {
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

const syncActiveRequestItem = (items: RequestItem[] = []) => {
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

const selectRequestItem = (item: RequestItem) => {
  const itemId = Number(item?.id || 0)
  if (itemId <= 0) return
  activeRequestItemId.value = itemId
}

const selectPrescriptionImage = (index: number) => {
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

const advanceToNextRequestItem = (currentItemId: number | null | undefined) => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  if (!items.length) return false

  const currentIndex = items.findIndex((item) => Number(item?.id || 0) === Number(currentItemId || 0))
  if (currentIndex < 0) return false

  const nextItem = items[currentIndex + 1] || null
  if (!nextItem) return false

  selectRequestItem(nextItem)
  return true
}

const getAllocationPharmacy = (item: RequestItem | null | undefined) => {
  if (!item?.allocation_pharmacy_id) return null
  return nearbyPharmacies.value?.find((p) => p.id === item.allocation_pharmacy_id) || null
}

const getPersistedItemSourceSummary = (item: RequestItem | null | undefined) => {
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

const getDraftItemSourceSummary = (item: RequestItem | null | undefined) => {
  if (item?.selected_source_summary && (item.selected_source_summary.pharmacyId || item.selected_source_summary.name)) {
    return item.selected_source_summary
  }
  return null
}

const getAdminSelectedItemTitle = (item: RequestItem | null | undefined) => {
  const draftName = String(getDraftItemSourceSummary(item)?.productName || '').trim()
  if (draftName) return draftName

  const savedName = String(getPersistedItemSourceSummary(item)?.productName || '').trim()
  if (savedName) return savedName

  return 'No pharmacy product selected'
}

const hasPersistedItemSource = (item: RequestItem | null | undefined) => Boolean(getPersistedItemSourceSummary(item))

const hasDraftItemSource = (item: RequestItem | null | undefined) => Boolean(getDraftItemSourceSummary(item))

const getSelectedSourceDraftLabel = (item: RequestItem | null | undefined) => String(
  getDraftItemSourceSummary(item)?.productName
  || getPersistedItemSourceSummary(item)?.productName
  || item?.product_name
  || ''
).trim().toLowerCase()

const canSaveItemSelection = (item: RequestItem | null | undefined) => {
  const pharmacyId = Number(item?.allocation_pharmacy_id || 0)
  const price = Number(item?.edit_price || item?.unit_price || 0)
  return pharmacyId > 0 && Number.isFinite(price) && price > 0 && !item?.selection_dirty
}

const clearItemSelection = (item: RequestItem) => {
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

const getSourcingOptions = (item: RequestItem, excludeCurrent = false) => {
  const itemId = Number(item?.id || 0)
  if (!itemId) return []
  const sourceList = Array.isArray(pharmacyQueue.value) && pharmacyQueue.value.length > 0 ? pharmacyQueue.value : []
  const excludeId = excludeCurrent ? Number(item?.allocation_pharmacy_id || 0) : 0
  return sourceList
    .map((pharmacy: PharmacyQueueEntry) => {
      const pharmacyId = Number(pharmacy?.id || pharmacy?.pharmacy_id || 0)
      if (excludeId > 0 && pharmacyId === excludeId) return null
      const coverage = Array.isArray(pharmacy?.coverage_items)
        ? pharmacy.coverage_items.find((entry: CoverageItem) => Number(entry?.item_id || 0) === itemId)
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
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => {
      if (b.matchedQuantity !== a.matchedQuantity) return b.matchedQuantity - a.matchedQuantity
      if (b.availableQuantity !== a.availableQuantity) return b.availableQuantity - a.availableQuantity
      return a.distanceKm - b.distanceKm
    })
}

const getRecommendedSourcingOption = (item: RequestItem) => {
  const recommendedPharmacyId = Number(nextRecommendedPharmacy.value?.pharmacy_id || 0)
  if (recommendedPharmacyId <= 0) return null

  return getSourcingOptions(item, false).find((option) => Number(option.pharmacyId || 0) === recommendedPharmacyId) || null
}

const toggleSourcingDropdown = (item: RequestItem) => {
  const next = !item.showSourcingDropdown
  const allItems = selectedRequest.value?.items || []
  for (const otherItem of allItems) {
    otherItem.showSourcingDropdown = false
  }
  item.showSourcingDropdown = next
}

const selectSourcingOption = (item: RequestItem, option: { pharmacyId: number; name: string; distanceKm?: number; unitPrice?: number | null; matchedQuantity?: number; availableQuantity?: number }, options: { silent?: boolean; successMessage?: string | null } = {}) => {
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
  return fulfillmentPlans.value.some((plan: FulfillmentPlan) =>
    (plan.items || []).some((item: FulfillmentPlanItem) => Number(item.allocated_quantity || 0) > 0 && Number((item as unknown as RequestItem).allocation_quantity || 0) < getRequestedQuantity(item as unknown as RequestItem))
  )
})

const customerReadySummary = computed(() => {
  const items = Array.isArray(selectedRequest.value?.items) ? selectedRequest.value.items : []
  const readyItems = items.filter((item: RequestItem) => {
    const status = item.sourcing_status || item.item_status || ''
    const hasCustomerPrice = Number(item.marked_up_price || 0) > 0
    return hasCustomerPrice || ['available', 'ready_to_order', 'ordered', 'allocated', 'partially_allocated'].includes(status)
  })

  const sourcePharmacyIds = new Set<number>()
  readyItems.forEach((item: RequestItem) => {
    if (item.source_pharmacy_id) {
      sourcePharmacyIds.add(Number(item.source_pharmacy_id))
    }

    if (Array.isArray(item.allocations)) {
      item.allocations.forEach((allocation: Allocation) => {
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
  const unavailable = items.filter((item: RequestItem) => {
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
  return urls.filter((url): url is string => typeof url === 'string' && !!url.trim())
})

const activePrescriptionImageUrl = computed(() => {
  return prescriptionAttachmentUrls.value[activePrescriptionImageIndex.value] || ''
})

const showTopQuickAdd = computed(() => {
  return true
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
  return canAddAdminItem.value
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

const buildComposedPharmacyWhatsAppUrl = (request: RichOrderRequest | null | undefined, group: { phone?: string; name?: string; items?: Array<{ productName: string; quantity?: number; price?: number | null }> }) => {
  const digits = phoneUtils.formatWhatsApp(group?.phone || '')
  if (!digits) return ''

  const requestNumber = String(request?.request_number || '').trim()
  const customerName = String(request?.customer_name || '').trim()
  const lines = (group?.items || []).map((entry: { productName: string; quantity?: number; price?: number | null }) => {
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

const buildComposedPharmacySummary = (request: RichOrderRequest | null | undefined) => {
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

interface ComposedSummaryGroup {
  pharmacyId?: number | null
  name?: string | null
  phone?: string
  distanceKm?: number | null
  items?: Array<{ id?: number; productName: string; quantity?: number; price?: number | null }>
  totalValue?: number
  whatsappUrl?: string
}

const composedPharmacySummary = computed(() => buildComposedPharmacySummary(composedSummaryRequest.value))

const getComposedSummaryGroupKey = (group: ComposedSummaryGroup | null | undefined): string | number => group?.pharmacyId || group?.name || ''

const getComposedSummaryQueueEntries = () => {
  const request = composedSummaryRequest.value
  const queue = Array.isArray(request?.nearby_pharmacies) && request.nearby_pharmacies.length
    ? request.nearby_pharmacies
    : (Array.isArray(request?.pharmacy_queue) ? request.pharmacy_queue : [])
  return Array.isArray(queue) ? queue : []
}

const getComposedSummaryPharmacyEntry = (group: ComposedSummaryGroup | null | undefined) => {
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

const getComposedSummaryGroupStatus = (group: ComposedSummaryGroup | null | undefined) => {
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
  const nextActions: Record<string | number, string> = {}
  for (const group of composedPharmacySummary.value || []) {
    const key = getComposedSummaryGroupKey(group as ComposedSummaryGroup)
    if (!key) continue
    nextActions[key] = getComposedSummaryGroupStatus(group as ComposedSummaryGroup)
  }
  composedGroupActions.value = nextActions
}

const applyLocalComposedSummaryPharmacyAction = (group: ComposedSummaryGroup | null | undefined, action: string) => {
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

const isComposedSummaryGroupConfirmed = (group: ComposedSummaryGroup | null | undefined) => {
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
  if (!['pending', 'composing', 'sourcing', 'processing', 'composed', 'confirming_with_pharm'].includes(currentStatus)) return false
  return hasComposableItems.value && allItemsResolved.value
})

const composedStatusHint = computed(() => {
  if (!selectedRequest.value) return 'Open a request to prepare a composed order.'
  if (!hasComposableItems.value) return 'Add or confirm at least one request item first.'
  if (!allItemsResolved.value) {
    const unresolved = (requestItems.value || []).filter(i => !isItemResolved(i)).length
    return `${unresolved} item(s) still need to be identified before sourcing can begin.`
  }
  return 'All items identified — ready to start sourcing.'
})

const currentPipelineStageIndex = computed(() => {
  const status = selectedRequest.value?.status
  if (!status) return -1
  return PIPELINE_STAGES.findIndex(s => s.statuses.includes(status))
})

const nextStepAction = computed(() => {
  const idx = currentPipelineStageIndex.value
  if (idx < 0 || idx === 7) return null
  const ftype = String(selectedRequest.value?.fulfillment_type || '').toLowerCase()
  const isPickup = ftype.includes('pickup')
  if (idx === 1) return { label: 'Start Sourcing', status: 'sourcing', disabled: !canMarkRequestComposed.value }
  if (idx === 5) return isPickup ? { label: 'Ready for Pickup', status: 'ready_for_pickup' } : { label: 'In Transit', status: 'in_transit' }
  if (idx === 6) return isPickup ? { label: 'Mark Picked Up', status: 'picked_up' } : { label: 'Mark Delivered', status: 'delivered' }
  const stage = PIPELINE_STAGES[idx]
  if (!stage) return null
  return stage.nextStatus ? { label: stage.nextLabel, status: stage.nextStatus } : null
})

const autoAdvanceSuggestion = computed(() => {
  if (!selectedRequest.value) return null
  const status = selectedRequest.value.status
  const items = requestItems.value || []
  if (status === 'pending' && items.length > 0 && items.every(i => i.source_pharmacy_id)) {
    return { message: 'All items routed — ready to start composing?', status: 'composing', label: 'Start Composing' }
  }
  if (['composing', 'sourcing', 'confirming_with_pharm'].includes(status) && canMarkRequestComposed.value) {
    return { message: 'All items identified — ready to start sourcing?', status: 'sourcing', label: 'Start Sourcing' }
  }
  return null
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

const buildFallbackPaymentSnapshotFromRequest = (request: RichOrderRequest | null | undefined) => {
  const paidStatuses = new Set(['paid', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit', 'driver_assigned', 'out_for_delivery', 'delivered'])
  const status = String(request?.status || '').toLowerCase()
  if (!paidStatuses.has(status)) return null

  const items = Array.isArray(request?.items) ? request.items : []
  const selectedItems = items
    .filter((item: RequestItem) => {
      const unavailable = ['not_available', 'unavailable'].includes(String(item?.item_status || item?.sourcing_status || '').toLowerCase())
      const unitPrice = Number(item?.marked_up_price || item?.unit_price || 0)
      const lineTotal = Number(item?.line_total || 0)
      return !unavailable && (unitPrice > 0 || lineTotal > 0)
    })
    .map((item: RequestItem) => {
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
      } as PaymentSnapshotItem
    })

  if (!selectedItems.length) return null

  const excludedItems = items
    .filter((item: RequestItem) => !selectedItems.some((entry) => Number(entry.item_id) === Number(item?.id || 0)))
    .map((item: RequestItem) => ({
      item_id: Number(item?.id || 0),
      product_name: item?.product_name || 'Item',
      reason: ['not_available', 'unavailable'].includes(String(item?.item_status || item?.sourcing_status || '').toLowerCase())
        ? 'unavailable'
        : 'not_included'
    }))

  const itemsSubtotal = selectedItems.reduce((sum: number, item) => sum + Number(item?.line_total || 0), 0)
  const deliveryFee = request?.fulfillment_type === 'delivery' ? Number(request?.delivery_fee || 0) : 0
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

const paymentModeItems = computed(() => {
  if (paidSnapshotItems.value.length) return paidSnapshotItems.value
  return (selectedRequest.value?.items || [])
    .filter((i: RequestItem) => Number(i?.marked_up_price || i?.unit_price || 0) > 0 || Number(i?.line_total || 0) > 0)
    .map((i: RequestItem): PaymentSnapshotItem => ({
      item_id: i.id,
      product_name: i.product_name || 'Item',
      quantity: Number(i.quantity || i.requested_quantity || 1),
      unit_price: Number(i.marked_up_price || i.unit_price || 0),
      line_total: Number(i.line_total || (Number(i.marked_up_price || i.unit_price || 0) * Number(i.quantity || i.requested_quantity || 1))),
      pharmacy_name: i.pharmacy_name ?? null,
    }))
})
const paymentModeSubtotal = computed(() =>
  paymentModeItems.value.reduce((s, i) => s + Number(i.line_total || 0), 0)
)
const paymentModeTotal = computed(() => {
  const fee = selectedRequest.value?.fulfillment_type === 'delivery'
    ? Number(selectedRequest.value?.delivery_fee || 0)
    : 0
  return Number((paymentModeSubtotal.value + fee).toFixed(2))
})

const isPaidRequest = computed(() => normalizeRequestStatus(selectedRequest.value?.status) === 'paid')

const workspaceMode = computed(() => {
  const status = normalizeRequestStatus(selectedRequest.value?.status)
  if (!status) return 'compose'
  if (['pending', 'composing'].includes(status)) return 'compose'
  if (['sourcing', 'confirming_with_pharm', 'processing', 'enquiry_sent', 'partially_available'].includes(status)) return 'source'
  if (['awaiting_input', 'awaiting_customer'].includes(status)) return 'decision'
  if (['payment_pending', 'awaiting_method_selection', 'confirmed_in_pharm', 'ordered', 'confirmed', 'items_sourced'].includes(status)) return 'payment'
  if (['paid', 'preparing'].includes(status)) return 'fulfillment'
  if (['driver_assigned', 'in_transit', 'out_for_delivery'].includes(status)) return 'transit'
  if (['ready_for_pickup'].includes(status)) return 'pickup'
  if (['delivered', 'picked_up', 'completed'].includes(status)) return 'done'
  if (['cancelled', 'returned', 'expired'].includes(status)) return 'terminal'
  return 'compose'
})

const fullMatchQueue = computed(() => pharmacyQueue.value.filter((p: PharmacyQueueEntry) => p.fully_covers_request))
const partialMatchQueue = computed(() => pharmacyQueue.value.filter((p: PharmacyQueueEntry) => !p.fully_covers_request))
const escalationReady = computed(() => {
  const full = fullMatchQueue.value
  if (!full.length) return false
  return full.every((p: PharmacyQueueEntry) => p.queue_state !== 'not_contacted') && full.every((p: PharmacyQueueEntry) => !p.is_confirmed)
})
const allItemsCovered = computed(() => {
  const items = selectedRequest.value?.items || []
  return items.length > 0 && items.every((i: RequestItem) =>
    Number(i.sourced_quantity || 0) >= Number(i.requested_quantity || i.quantity || 1)
  )
})

// Typed error helper — safely extracts .message from unknown catch values
const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))

// API helper — delegates to useApi so auth headers and base URL are
// injected centrally. The call signature is preserved so all 70+ callers
// inside this page remain unchanged.
const _api = useApi()
const apiCall = async (method: string, url: string, data: unknown = null): Promise<{ data: unknown; message?: string; success?: boolean; [key: string]: unknown }> => {
  const opts: Record<string, unknown> = { method }
  if (data !== null) opts['body'] = JSON.stringify(data)
  return _api.request(url, opts) as Promise<{ data: unknown; message?: string; success?: boolean; [key: string]: unknown }>
}

// Fetch
const fetchRequests = async (optsOrEvt?: { silent?: boolean } | Event) => {
  const silent = optsOrEvt instanceof Event ? false : (optsOrEvt?.silent ?? false)
  if (!silent) loading.value = true
  try {
    const res = await orderRequestsService.listAdmin({ search: searchQuery.value })
    requests.value = (res.data as RichOrderRequest[] | null) || []
  } catch (e) {
    if (!silent) showMessage('Failed to load requests', 'error')
  } finally {
    if (!silent) loading.value = false
  }
}

const fetchStats = async (optsOrEvt?: { silent?: boolean } | Event) => {
  const silent = optsOrEvt instanceof Event ? false : (optsOrEvt?.silent ?? false)
  try {
    const res = await orderRequestsService.getAdminStats()
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

const setStatusFilter = (value: string) => {
  statusFilter.value = value
}

const formatRequestItemsLabel = (request: RichOrderRequest | null | undefined) => {
  const itemCount = Number(request?.item_count || getCustomerRequestItems(request).length || 0)
  if (itemCount > 0) return itemCount
  if (request?.has_prescription) return 'Rx'
  return '-'
}

const isSavedSelectionItem = (item: RequestItem | null | undefined) => Boolean(
  Number(item?.source_pharmacy_id || 0) > 0
  || Number(item?.source_product_id || 0) > 0
  || Number(item?.unit_price || 0) > 0
  || Number(item?.marked_up_price || 0) > 0
)

const getCustomerRequestItems = (request: RichOrderRequest | null | undefined) => {
  if (!request) return []
  return Array.isArray(request?.items) ? request.items : []
}

const getCustomerRequestItemCount = (request: RichOrderRequest | null | undefined) => {
  return getCustomerRequestItems(request).length
}

const getActiveAllocationPharmacyId = (item: RequestItem | null | undefined) => {
  const allocations = Array.isArray(item?.allocations) ? item.allocations : []
  const active = allocations
    .filter((allocation: Allocation) => ['proposed', 'confirmed'].includes(String(allocation?.status || '').toLowerCase()))
    .sort((a: Allocation, b: Allocation) => {
      const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0
      if (timeA !== timeB) return timeB - timeA
      return Number(b?.id || 0) - Number(a?.id || 0)
    })

  if (!active.length) return 0
  const preferredExact = active.find((allocation) => String(allocation?.allocation_type || '').toLowerCase() === 'exact')
  return Number(preferredExact?.pharmacy_id || active[0]?.pharmacy_id || 0)
}

const getDefaultAllocationPharmacyId = (item: RequestItem | null | undefined) => {
  const existingSelection = Number(item?.allocation_pharmacy_id || 0)
  if (existingSelection > 0) return existingSelection

  const sourcePharmacyId = Number(item?.source_pharmacy_id || 0)
  if (sourcePharmacyId > 0) return sourcePharmacyId

  const activeAllocationPharmacyId = getActiveAllocationPharmacyId(item)
  if (activeAllocationPharmacyId > 0) return activeAllocationPharmacyId

  return ''
}

const hydrateItemUiState = (items: RequestItem[] = []) => {
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

const hydrateAllocationUiState = (allocation: Allocation | null | undefined) => {
  if (!allocation) return
  if (allocation.editing === undefined) allocation.editing = false
  if (allocation.edit_allocated_quantity === undefined) allocation.edit_allocated_quantity = Number(allocation.allocated_quantity || 1)
  if (allocation.edit_allocation_type === undefined) allocation.edit_allocation_type = allocation.allocation_type || 'exact'
  if (allocation.edit_status === undefined) allocation.edit_status = allocation.status || 'confirmed'
  if (allocation.edit_substitute_name === undefined) allocation.edit_substitute_name = allocation.substitute_name || ''
  if (allocation.edit_substitute_note === undefined) allocation.edit_substitute_note = allocation.substitute_note || ''
}

const openAlternativeModal = (item: RequestItem | null | undefined) => {
  if (!item) return
  const existingAlternative = getLatestSubstituteAllocation(item)
  const existingDetails = getItemSubstituteDetails(item)

  const _altPharmacyIdNum = Number(existingAlternative?.pharmacy_id || item?.allocation_pharmacy_id || item?.source_pharmacy_id || getDefaultAllocationPharmacyId(item) || 0)
  alternativeModal.value = {
    open: true,
    item,
    pharmacy_id: _altPharmacyIdNum > 0 ? String(_altPharmacyIdNum) : '',
    allocated_quantity: Number(existingAlternative?.allocated_quantity || getRequestedQuantity(item) || 1),
    name: String(existingAlternative?.substitute_name || existingDetails?.name || '').trim(),
    productSearchResults: [],
    showProductDropdown: false,
    product_search_loading: false,
    note: String(existingAlternative?.substitute_note || existingDetails?.note || '').trim(),
    price: String(existingAlternative?.unit_price ?? existingDetails?.price ?? '')
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

const openPrescriptionPreview = (url: string | null | undefined, index = 0) => {
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

const viewRequest = async (req: { id: number | string }) => {
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${req.id}`)
    const reqData = res.data as RichOrderRequest
    selectedRequest.value = reqData
    selectedStatus.value = reqData.status || ''
    adminNotes.value = (reqData.admin_notes as string | undefined) || ''
    nearbyPharmacies.value = (reqData.nearby_pharmacies || []) as PharmacyQueueEntry[]
    candidatePlans.value = []
    fulfillmentPlans.value = []
    allocationSummary.value = null
    pharmacyQueue.value = []
    nextRecommendedPharmacy.value = null
    logisticsAssessment.value = null
    activePrescriptionImageIndex.value = 0
    resetAdminNewItem()

    hydrateItemUiState(selectedRequest.value.items || [])

    // Load mode-appropriate extra data
    const mode = workspaceMode.value
    if (mode === 'compose') {
      fetchPharmacyCoverage()
    } else if (['source', 'fulfillment', 'transit', 'pickup'].includes(mode)) {
      loadFulfillment({ silent: true })
    }
    if (['fulfillment', 'transit', 'done'].includes(mode)) {
      fetchRequestDeliveries(req.id)
    } else {
      requestDeliveries.value = []
    }
  } catch (e) {
    showMessage('Failed to load request details', 'error')
  }
}

// ============================
// DELIVERY MANAGEMENT
// ============================

const fetchRequestDeliveries = async (requestId: number | string | null | undefined) => {
  if (!requestId) return
  loadingDeliveries.value = true
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${requestId}/deliveries`)
    requestDeliveries.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    requestDeliveries.value = []
  } finally {
    loadingDeliveries.value = false
  }
}

const initiateDeliveries = async () => {
  if (!selectedRequest.value?.id) return
  loadingDeliveries.value = true
  try {
    const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/initiate-deliveries`)
    requestDeliveries.value = Array.isArray(res.data) ? res.data : []
    showMessage(res.message || 'Deliveries initiated', 'success')
  } catch (e) {
    showMessage(errMsg(e) || 'Failed to initiate deliveries', 'error')
  } finally {
    loadingDeliveries.value = false
  }
}

const openAssignToPharmacy = (delivery: Delivery) => {
  assignPharmacyModal.value = { delivery }
}
const closeAssignToPharmacy = () => {
  assignPharmacyModal.value = null
}
const submitAssignToPharmacy = async () => {
  const modal = assignPharmacyModal.value
  if (!modal) return
  assigningPharmacy.value = true
  try {
    await apiCall('POST', `/api/deliveries/${modal.delivery.id}/assign-pharmacy`, {
      pharmacy_id: modal.delivery.pickup_pharmacy_id
    })
    showMessage('Delivery assigned to pharmacy', 'success')
    assignPharmacyModal.value = null
    fetchRequestDeliveries(selectedRequest.value?.id)
  } catch (e) {
    showMessage(errMsg(e) || 'Assign to pharmacy failed', 'error')
  } finally {
    assigningPharmacy.value = false
  }
}

const buildPharmacyWhatsAppUrl = (delivery: Delivery) => {
  if (!delivery.pharmacy_whatsapp_number) return '#'
  const phone = phoneUtils.formatWhatsApp(delivery.pharmacy_whatsapp_number)
  const req = selectedRequest.value
  if (!req) return `https://wa.me/${phone}`

  const pharmacyItems = (paidSnapshotItems.value || []).filter(
    (item) => item.source_pharmacy_id === delivery.pickup_pharmacy_id
  )
  const itemLines = pharmacyItems.length
    ? pharmacyItems.map((i) => `• ${i.product_name} × ${i.quantity} — GHS ${Number(i.line_total || 0).toFixed(2)}`).join('\n')
    : '(items on record)'
  const pharmacyTotal = pharmacyItems.reduce((sum, i) => sum + Number(i.line_total || 0), 0)
  const netFee = Number(delivery.net_delivery_fee ?? delivery.delivery_fee ?? 0).toFixed(2)
  const deliveriesLink = delivery.pharmacy_domain
    ? `${window.location.origin}/${delivery.pharmacy_domain}/services/deliveries`
    : `${window.location.origin}/services/deliveries`

  const message =
    `Hi ${delivery.pharmacy_name},\n\n` +
    `Payment confirmed for Order *${req.request_number}* ✓\n\n` +
    `Your items to prepare:\n${itemLines}\n` +
    `Drug earnings: GHS ${pharmacyTotal.toFixed(2)}\n\n` +
    `Delivery to: ${req.customer_address || 'customer location'}\n` +
    `Delivery earnings (net): GHS ${netFee}\n\n` +
    `Accept delivery & assign your rider here:\n${deliveriesLink}\n\n` +
    `Reply YES to confirm you will handle delivery.`

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

const openForceAssign = (delivery: Delivery) => {
  forceAssignModal.value = { delivery, driverId: '' }
}

const closeForceAssign = () => {
  forceAssignModal.value = null
}

const submitForceAssign = async () => {
  const modal = forceAssignModal.value
  if (!modal || !modal.driverId) return showMessage('Please enter a rider ID', 'error')
  try {
    await apiCall('POST', `/api/deliveries/${modal.delivery.id}/force-assign`, {
      driver_id: Number(modal.driverId)
    })
    showMessage('Rider force-assigned', 'success')
    forceAssignModal.value = null
    fetchRequestDeliveries(selectedRequest.value?.id)
  } catch (e) {
    showMessage(errMsg(e) || 'Force assign failed', 'error')
  }
}

// ============================
// PHARMACY COVERAGE MATRIX
// ============================
const fetchPharmacyCoverage = async () => {
  const reqId = selectedRequest.value?.id
  if (!reqId) return
  coverageLoading.value = true
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${reqId}/pharmacy-coverage`)
    pharmacyCoverage.value = (res as PharmacyCoverageData) || null
  } catch (e) {
    pharmacyCoverage.value = null
  } finally {
    coverageLoading.value = false
  }
}

const searchMasterProductsForResolve = async (query: string) => {
  const q = String(query || '').trim()
  if (q.length < 2) {
    masterSearchResults.value = []
    return
  }
  masterSearchLoading.value = true
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/master-products/search?q=${encodeURIComponent(q)}&limit=10`)
    const mdata = (res?.data ?? {}) as { products?: ProductSearchResult[] }
    masterSearchResults.value = Array.isArray(mdata.products) ? mdata.products : []
  } catch (e) {
    masterSearchResults.value = []
  } finally {
    masterSearchLoading.value = false
  }
}

const onMasterSearchInput = (query: string) => {
  masterSearchQuery.value = query
  if (masterSearchDebounce) clearTimeout(masterSearchDebounce)
  if (String(query || '').trim().length < 2) {
    masterSearchResults.value = []
    return
  }
  masterSearchDebounce = setTimeout(() => {
    searchMasterProductsForResolve(query)
  }, 300)
}

const searchPharmResolve = async (query: string) => {
  const q = String(query || '').trim()
  if (q.length < 2) { pharmResolveResults.value = []; return }
  pharmResolveLoading.value = true
  try {
    pharmResolveResults.value = await searchPharmacyProductsForResolve(q)
  } catch {
    pharmResolveResults.value = []
  } finally {
    pharmResolveLoading.value = false
  }
}

const onPharmResolveInput = (query: string) => {
  masterSearchQuery.value = query
  clearTimeout(pharmResolveDebounce ?? undefined)
  if (String(query || '').trim().length < 2) { pharmResolveResults.value = []; return }
  pharmResolveDebounce = setTimeout(() => searchPharmResolve(query), 300)
}

const setResolveMode = (mode: string) => {
  resolveSearchMode.value = mode
  masterSearchResults.value = []
  pharmResolveResults.value = []
  if (masterSearchQuery.value.length >= 2) {
    if (mode === 'master') searchMasterProductsForResolve(masterSearchQuery.value)
    else searchPharmResolve(masterSearchQuery.value)
  }
}

const startResolvingItem = (item: RequestItem) => {
  resolvingItemId.value = item.id
  masterSearchQuery.value = item.product_name || ''
  masterSearchResults.value = []
  pharmResolveResults.value = []
  resolveSearchMode.value = 'pharmacy'
  searchPharmResolve(item.product_name ?? '')
}

const cancelResolving = () => {
  resolvingItemId.value = null
  masterSearchQuery.value = ''
  masterSearchResults.value = []
  pharmResolveResults.value = []
  resolveSearchMode.value = 'pharmacy'
}

// --- Pharmacy stock resolution (no master catalog needed) ---
const resolveItemToPharmProduct = async (item: RequestItem, pharmProduct: ProductSearchResult) => {
  if (!item?.id || !pharmProduct?.id) return
  try {
    const payload: {
      product_name: string | null | undefined; resolution_status: string
      source_pharmacy_id: number | null; source_product_id: number | null; master_product_id?: number | null
    } = {
      product_name: pharmProduct.product_description || pharmProduct.brand_name || pharmProduct.product_name,
      resolution_status: 'resolved',
      source_pharmacy_id: pharmProduct.pharmacy_id || pharmProduct.company_id || null,
      source_product_id: pharmProduct.id || null,
    }
    if (pharmProduct.uniqid) payload.master_product_id = pharmProduct.uniqid
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, payload)
    if (selectedRequest.value?.items) {
      const localItem = selectedRequest.value.items.find(i => i.id === item.id)
      if (localItem) {
        localItem.product_name = payload.product_name ?? null
        localItem.resolution_status = 'resolved'
        localItem.source_pharmacy_id = payload.source_pharmacy_id
        localItem.source_product_id = payload.source_product_id
        localItem.pharmacy_name = pharmProduct.pharmacy_name || null
        if (payload.master_product_id) localItem.master_product_id = payload.master_product_id
      }
    }
    resolvingItemId.value = null
    masterSearchQuery.value = ''
    masterSearchResults.value = []
    fetchPharmacyCoverage()
  } catch (e) {
    showMessage('Failed to resolve item to pharmacy product', 'error')
  }
}

// --- Coverage substitute search (per-pharmacy catalog search for uncovered items) ---
const searchPharmacyProductsForResolve = async (query: string, companyId: number | null = null) => {
  const trimmed = String(query || '').trim()
  if (trimmed.length < 2) return []
  const coords = getRequestSearchCoordinates()
  const params = new URLSearchParams()
  params.append('q', trimmed)
  params.append('limit', '10')
  if (coords.hasCoords) {
    params.append('lat', String(coords.lat))
    params.append('lng', String(coords.lng))
  }
  if (companyId) params.append('company_id', String(companyId))
  const res = await apiCall('GET', `/api/order-requests/admin/pharmacy-products/search?${params.toString()}`)
  const pdata = (res?.data ?? {}) as { products?: ProductSearchResult[] }
  return Array.isArray(pdata.products) ? pdata.products : []
}

const simplifyCoverageSearchQuery = (productName: string | null | undefined) => {
  if (!productName) return ''
  return String(productName)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+\s*(ml|mg|mcg|iu|g|kg|l|mm|cm)\b/gi, ' ')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 3)
    .join(' ')
    .trim()
}

const startCoverageSubSearch = (pharmacy: PharmacyQueueEntry, uncoveredItem: UncoveredItem) => {
  const simplified = simplifyCoverageSearchQuery(uncoveredItem.product_name)
  coverageSubSearch.value = {
    pharmacyId: pharmacy.pharmacy_id ?? null,
    companyId: pharmacy.company_id ?? pharmacy.pharmacy_id ?? null,
    itemId: uncoveredItem.item_id ?? null,
    query: simplified || uncoveredItem.product_name || '',
    results: [],
    loading: false
  }
  // Pre-search with simplified product name
  const searchTerm = simplified || uncoveredItem.product_name
  if (searchTerm) searchCoverageSubstitute(searchTerm, pharmacy)
}

const closeCoverageSubSearch = () => {
  clearTimeout(coverageSubDebounce ?? undefined)
  coverageSubSearch.value = { pharmacyId: null, companyId: null, itemId: null, query: '', results: [], loading: false }
}

const searchCoverageSubstitute = async (query: string, pharmacy: PharmacyQueueEntry | null = null) => {
  const companyId = pharmacy?.company_id || pharmacy?.pharmacy_id || coverageSubSearch.value.companyId
  coverageSubSearch.value.loading = true
  try {
    coverageSubSearch.value.results = await searchPharmacyProductsForResolve(query, companyId)
  } catch {
    coverageSubSearch.value.results = []
  } finally {
    coverageSubSearch.value.loading = false
  }
}

const onCoverageSubSearchInput = (query: string) => {
  coverageSubSearch.value.query = query
  clearTimeout(coverageSubDebounce ?? undefined)
  coverageSubDebounce = setTimeout(() => searchCoverageSubstitute(query), 300)
}

const selectCoverageSubstitute = async (pharmacy: PharmacyQueueEntry, uncoveredItem: UncoveredItem, selectedProduct: ProductSearchResult) => {
  // Move uncovered item to covered with Fuzzy badge (local state)
  const covered = pharmacy.covered || (pharmacy.covered = [])
  covered.push({
    ...(uncoveredItem.item_id !== undefined ? { item_id: uncoveredItem.item_id } : {}),
    ...(uncoveredItem.product_name !== undefined ? { product_name: uncoveredItem.product_name } : {}),
    matched_product_id: selectedProduct.id ?? null,
    fuzzy_match: {
      matched_product_name: (selectedProduct.product_description || selectedProduct.brand_name || selectedProduct.product_name) ?? '',
      price: selectedProduct.price ?? 0,
      stock: selectedProduct.available_quantity ?? 0
    }
  } as CoverageItem)
  pharmacy.uncovered = (pharmacy.uncovered || []).filter((u: UncoveredItem) => u.item_id !== uncoveredItem.item_id)
  pharmacy.coverage_score = (pharmacy.coverage_score || 0) + 1
  closeCoverageSubSearch()

  // Persist selection via route-pharmacy API
  const reqId = selectedRequest.value?.id
  if (reqId && pharmacy.pharmacy_id && uncoveredItem.item_id) {
    try {
      await apiCall('POST', `/api/order-requests/admin/${reqId}/route-pharmacy`, {
        pharmacy_id: pharmacy.pharmacy_id,
        items: [{
          item_id: uncoveredItem.item_id,
          matched_product_id: selectedProduct.id || null,
          distance_km: pharmacy.distance_km || null
        }]
      })
    } catch (e) {
      showMessage('Substitute selected locally but failed to save to server', 'error')
    }
  }
}
// --- End coverage substitute search ---

const resolveItemToMaster = async (item: RequestItem, masterProduct: ProductSearchResult) => {
  if (!item?.id || !masterProduct?.id) return
  try {
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      master_product_id: masterProduct.id,
      product_name: masterProduct.product_description,
      resolution_status: 'resolved'
    })
    // Update local state
    if (selectedRequest.value?.items) {
      const localItem = selectedRequest.value.items.find(i => i.id === item.id)
      if (localItem) {
        localItem.master_product_id = masterProduct.id ?? null
        localItem.master_product_description = masterProduct.product_description ?? null
        localItem.master_product_strength = masterProduct.strength ?? null
        localItem.master_product_unit = masterProduct.unit ?? null
        localItem.product_name = masterProduct.product_description ?? null
        localItem.resolution_status = 'resolved'
      }
    }
    resolvingItemId.value = null
    masterSearchQuery.value = ''
    masterSearchResults.value = []
    // Refresh coverage
    fetchPharmacyCoverage()
  } catch (e) {
    showMessage('Failed to resolve item', 'error')
  }
}

const unresolveItem = async (item: RequestItem) => {
  if (!item?.id) return
  try {
    await apiCall('PUT', `/api/order-requests/admin/items/${item.id}`, {
      master_product_id: null,
      resolution_status: 'unresolved'
    })
    if (selectedRequest.value?.items) {
      const localItem = selectedRequest.value.items.find(i => i.id === item.id)
      if (localItem) {
        localItem.master_product_id = null
        localItem.master_product_description = null
        localItem.master_product_strength = null
        localItem.master_product_unit = null
        localItem.resolution_status = 'unresolved'
      }
    }
    fetchPharmacyCoverage()
  } catch (e) {
    showMessage('Failed to unresolve item', 'error')
  }
}

const routePharmacyAction = async (pharmacy: PharmacyQueueEntry) => {
  const reqId = selectedRequest.value?.id
  if (!reqId || !pharmacy?.pharmacy_id) return
  const coveredItems = (pharmacy.covered || []).map(c => ({
    item_id: c.item_id,
    matched_product_id: c.matched_product_id,
    distance_km: pharmacy.distance_km
  }))
  if (coveredItems.length === 0) return

  const confirmed = window.confirm(
    `Route ${coveredItems.length} item(s) to ${pharmacy.pharmacy_name}?\n\nThis will update the source pharmacy for these items.`
  )
  if (!confirmed) return

  try {
    await apiCall('POST', `/api/order-requests/admin/${reqId}/route-pharmacy`, {
      pharmacy_id: pharmacy.pharmacy_id,
      items: coveredItems
    })
    showMessage(`Routed ${coveredItems.length} item(s) to ${pharmacy.pharmacy_name}`, 'success')
    // Refresh request data + coverage
    await refreshSelectedRequestDetails()
    fetchPharmacyCoverage()
  } catch (e) {
    showMessage('Failed to route items', 'error')
  }
}

const getPharmacyWhatsAppUrl = (phone: string | null | undefined) => {
  if (!phone) return null
  const digits = phoneUtils.formatWhatsApp(phone)
  if (digits.length < 10) return null
  return `https://wa.me/${digits}`
}

const getCoverageColor = (score: number, total: number) => {
  if (total === 0) return '#9ca3af'
  const ratio = score / total
  if (ratio >= 1) return '#10b981'
  if (ratio >= 0.5) return '#f59e0b'
  return '#ef4444'
}

const openComposedSummary = async (req: { id: number | string } | null | undefined) => {
  if (!req?.id) return
  try {
    const res = await apiCall('GET', `/api/order-requests/admin/${req.id}`)
    composedSummaryRequest.value = res.data as RichOrderRequest
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

const isComposedTabActive = computed(() => statusFilter.value === 'composing')

const handleProcessRequest = async (req: RichOrderRequest) => {
  const requestId = Number(req?.id || 0)
  if (requestId <= 0 || openingRequestId.value === requestId) return

  openingRequestId.value = requestId
  try {
    await viewRequest(req)
  } finally {
    openingRequestId.value = null
  }
}

const canRunFulfillment = (status: string) => {
  const allowed = new Set([
    'pending',
    'composing',
    'sourcing',
    'awaiting_input',
    // Legacy values kept to support older records.
    'composed',
    'confirming_with_pharm',
    'confirmed_in_pharm',
    'processing',
    'items_sourced',
    'awaiting_customer',
    'confirmed'
  ])
  return allowed.has(status)
}

const syncPharmacyCoverageFromQueue = (queue: PharmacyQueueEntry[] = []) => {
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
  }) as PharmacyQueueEntry[]
}

const PHARMACY_CONTACT_ACTIONS = Object.freeze({
  contacted: {
    payload: {
      status: 'contacted',
      response_status: 'pending',
      is_confirmed: false
    },
    successMessage: (pharm: { name?: string | null }) => `${pharm.name} marked as contacted`,
    errorMessage: 'Failed to log pharmacy contact'
  },
  confirmed: {
    payload: {
      status: 'confirmed',
      response_status: 'full',
      is_confirmed: true
    },
    successMessage: (pharm: { name?: string | null }) => `Confirmed ${pharm.name} will fulfill this order`,
    errorMessage: 'Failed to confirm pharmacy'
  },
  declined: {
    payload: {
      status: 'declined',
      response_status: 'declined',
      is_confirmed: false
    },
    successMessage: (pharm: { name?: string | null }) => `${pharm.name} marked unavailable`,
    errorMessage: 'Failed to mark pharmacy unavailable'
  },
  partial: {
    payload: {
      status: 'confirmed',
      response_status: 'partial',
      is_confirmed: false
    },
    successMessage: (pharm: { name?: string | null }) => `${pharm.name} marked as partially available`,
    errorMessage: 'Failed to mark pharmacy partial'
  },
  timed_out: {
    payload: {
      status: 'timed_out',
      response_status: 'timeout',
      is_confirmed: false
    },
    successMessage: (pharm: { name?: string | null }) => `${pharm.name} marked as timed out`,
    errorMessage: 'Failed to mark pharmacy timeout'
  }
})

const applyLocalPharmacyContactState = (pharm: PharmacyQueueEntry | null | undefined, action: string) => {
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

  if (action === 'partial') {
    pharm.contacted_at = pharm.contacted_at || new Date().toISOString()
    pharm.responded_at = new Date().toISOString()
    pharm.pharmacy_status = 'confirmed'
    pharm.response_status = 'partial'
    pharm.queue_state = 'partial'
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

const maybePromoteRequestToConfirming = (action: string) => {
  if (!selectedRequest.value) return

  const currentStatus = normalizeRequestStatus(selectedRequest.value.status)
  if (!['contacted', 'confirmed'].includes(action)) return
  if (!['pending', 'processing'].includes(currentStatus)) return

  selectedRequest.value.status = 'composing'
  selectedStatus.value = 'composing'
}

const maybePromoteSummaryRequestToConfirming = (action: string) => {
  if (!composedSummaryRequest.value) return

  const currentStatus = normalizeRequestStatus(composedSummaryRequest.value.status)
  if (!['contacted', 'confirmed'].includes(action)) return
  if (!['pending', 'processing'].includes(currentStatus)) return

  composedSummaryRequest.value.status = 'composing'
}

const recordPharmacyContactAction = async (pharm: PharmacyQueueEntry | null | undefined, action: string, options: { showSuccess?: boolean; note?: string } = {}) => {
  if (!selectedRequest.value || !pharm) return false

  const { showSuccess = true, note = '' } = options
  const actionConfig = (PHARMACY_CONTACT_ACTIONS as Record<string, typeof PHARMACY_CONTACT_ACTIONS[keyof typeof PHARMACY_CONTACT_ACTIONS] | undefined>)[action]
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
      showMessage(errMsg(e) || actionConfig.errorMessage, 'error')
    }
    return false
  }
}

const loadPharmacyLedger = async () => {
  try {
    const res = await apiCall('GET', '/api/order-requests/admin/pharmacy-ledger?limit=100')
    const ledgerData = (res.data ?? {}) as { pharmacies?: LedgerEntry[] }
    const pharmacies = ledgerData.pharmacies || []
    const map: Record<number, LedgerEntry> = {}
    for (const entry of pharmacies) {
      if (entry.pharmacy_id) map[Number(entry.pharmacy_id)] = entry
    }
    pharmacyLedgerMap.value = map
  } catch {
    // Non-critical — ledger is supplementary info, silently ignore failures
  }
}

const startPharmacyPhoneEdit = (pharmId: number) => {
  pharmacyPhoneEdit.value = {
    ...pharmacyPhoneEdit.value,
    [pharmId]: { editing: true, value: '', saving: false }
  }
}

const cancelPharmacyPhoneEdit = (pharmId: number) => {
  const updated = { ...pharmacyPhoneEdit.value }
  delete updated[pharmId]
  pharmacyPhoneEdit.value = updated
}

const savePharmacyPhone = async (pharm: PharmacyQueueEntry) => {
  const pharmId = pharm.pharmacy_id
  if (!pharmId) return
  const editState = pharmacyPhoneEdit.value[pharmId]
  if (!editState) return
  const phone = String(editState.value || '').trim()
  if (!phone) return
  pharmacyPhoneEdit.value = { ...pharmacyPhoneEdit.value, [pharmId]: { ...editState, saving: true } }
  try {
    await apiCall('PATCH', `/api/order-requests/admin/pharmacies/${pharmId}/phone`, { whatsapp_number: phone })
    // Update phone on all matching entries in pharmacyQueue
    pharmacyQueue.value = pharmacyQueue.value.map(p =>
      Number(p.pharmacy_id) === Number(pharmId) ? { ...p, phone } : p
    )
    cancelPharmacyPhoneEdit(pharmId)
    showMessage(`Phone saved for ${pharm.pharmacy_name}`, 'success')
  } catch (e) {
    pharmacyPhoneEdit.value = { ...pharmacyPhoneEdit.value, [pharmId]: { ...editState, saving: false } }
    showMessage(errMsg(e) || 'Failed to save phone number', 'error')
  }
}

const openResponseModal = async (pharm: PharmacyQueueEntry, mode: string) => {
  // Refresh the cached pharmacy_queue so coverage prices reflect the current
  // products table, not a stale snapshot from the last "Run fulfillment process".
  // Best-effort: if it fails we still open the modal with whatever's cached.
  try {
    await loadFulfillment({ silent: true, refreshLists: false })
  } catch {}
  // Re-resolve the pharmacy from the refreshed queue (the original `pharm`
  // reference points to the pre-refresh queue entry).
  const freshPharm = (pharmacyQueue.value || []).find(
    (p) => Number(p?.pharmacy_id) === Number(pharm?.pharmacy_id)
  ) || pharm

  const allItems = selectedRequest.value?.items || []
  // Build lookup of existing active allocations for this pharmacy
  const existingAllocsByItemId = new Map()
  for (const item of allItems) {
    const activeAlloc = (item.allocations || []).find(
      a => Number(a.pharmacy_id) === Number(freshPharm.pharmacy_id) &&
           ['confirmed', 'proposed'].includes(a.status ?? '')
    )
    if (activeAlloc) existingAllocsByItemId.set(item.id, activeAlloc)
  }
  // In split mode, only show items still needing sourcing
  const sourceItems = sourcingMode.value === 'split'
    ? allItems.filter(i => Number(i.sourced_quantity || 0) < Number(i.requested_quantity || i.quantity || 1))
    : allItems
  const items = sourceItems.map((item) => {
    const existingAlloc = existingAllocsByItemId.get(item.id)
    const coverageItem = (freshPharm.coverage_items || []).find(ci => Number(ci?.item_id || 0) === Number(item.id))
    const fullRequestedQty = Number(item.requested_quantity || item.quantity || 1)
    const remainingQty = sourcingMode.value === 'split'
      ? Math.max(fullRequestedQty - Number(item.sourced_quantity || 0), 1)
      : fullRequestedQty
    const defaultQty = existingAlloc ? Number(existingAlloc.allocated_quantity) : remainingQty
    const catalogPrice = coverageItem?.unit_price != null && Number(coverageItem.unit_price) > 0
      ? Number(coverageItem.unit_price)
      : null
    const prefillPrice = existingAlloc?.unit_price != null
      ? String(existingAlloc.unit_price)
      : (catalogPrice != null ? String(catalogPrice) : null)
    return {
      item_id: item.id,
      product_name: item.product_name ?? null,
      requested_quantity: remainingQty,
      requested_unit: item.requested_unit || '',
      available: existingAlloc ? true : (mode === 'full'),
      available_quantity: defaultQty,
      unit_price: prefillPrice,
      catalog_price: catalogPrice,
      catalog_synced_at: coverageItem?.catalog_synced_at || null,
      is_price_from_catalog: existingAlloc?.unit_price == null && catalogPrice != null,
      allocation_type: existingAlloc?.allocation_type || 'exact',
      substitute_name: existingAlloc?.substitute_name || '',
      substitute_note: existingAlloc?.substitute_note || '',
      showSubstitute: existingAlloc?.allocation_type === 'substitute'
    }
  })
  responseModal.value = {
    open: true,
    pharmacy: freshPharm,
    mode,
    submitting: false,
    note: '',
    items
  }
}

const closeResponseModal = () => {
  responseModal.value.open = false
}

const submitResponseModal = async () => {
  const modal = responseModal.value
  if (!modal.pharmacy || !selectedRequest.value) return

  const availableItems = modal.items.filter((i) => i.available)
  if (availableItems.length === 0) {
    showMessage('Mark at least one item as available', 'error')
    return
  }

  modal.submitting = true
  try {
    const action = modal.mode === 'full' ? 'confirmed' : 'partial'
    const ok = await recordPharmacyContactAction(modal.pharmacy, action, {
      showSuccess: false,
      note: modal.note
    })
    if (!ok) return

    for (const item of availableItems) {
      const payload = {
        pharmacy_id: modal.pharmacy.pharmacy_id,
        allocated_quantity: item.available_quantity || item.requested_quantity,
        allocation_type: item.allocation_type || 'exact',
        substitute_name: item.allocation_type === 'substitute' ? (item.substitute_name || null) : null,
        substitute_note: item.allocation_type === 'substitute' ? (item.substitute_note || null) : null,
        unit_price: item.unit_price !== null && item.unit_price !== '' ? Number(item.unit_price) : undefined
      }
      await apiCall('POST', `/api/order-requests/admin/items/${item.item_id}/allocations`, payload)
    }

    showMessage(
      modal.mode === 'full'
        ? `${modal.pharmacy.pharmacy_name} confirmed for all items`
        : `${modal.pharmacy.pharmacy_name} recorded as partial — ${availableItems.length} of ${modal.items.length} items`,
      'success'
    )
    closeResponseModal()
    await fetchFulfillmentPlans({ silent: true })
    // Refresh request items so allocations are current for next modal open
    try {
      const freshReq = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value?.id}`)
      const freshData = freshReq?.data as RichOrderRequest | null | undefined
      if (freshData?.items) {
        selectedRequest.value = { ...selectedRequest.value, ...freshData } as RichOrderRequest
        hydrateItemUiState(selectedRequest.value.items || [])
      }
    } catch { /* non-critical */ }
  } catch (e) {
    showMessage(errMsg(e) || 'Failed to submit pharmacy response', 'error')
  } finally {
    modal.submitting = false
  }
}

const recordComposedPharmacyContactAction = async (group: { pharmacyId?: number | null; name?: string | null; phone?: string | null }, action: string) => {
  if (!composedSummaryRequest.value || !group?.pharmacyId) return false

  const actionConfig = (PHARMACY_CONTACT_ACTIONS as Record<string, typeof PHARMACY_CONTACT_ACTIONS[keyof typeof PHARMACY_CONTACT_ACTIONS] | undefined>)[action]
  if (!actionConfig) {
    showMessage('Unknown pharmacy contact action', 'error')
    return false
  }

  try {
    await apiCall('POST', `/api/order-requests/admin/${composedSummaryRequest.value.id}/contact/${group.pharmacyId}`, {
      ...actionConfig.payload,
      response_note: null
    })
    applyLocalComposedSummaryPharmacyAction(group as ComposedSummaryGroup, action)
    syncComposedSummaryGroupActions()
    maybePromoteSummaryRequestToConfirming(action)
    await fetchRequests({ silent: true })
    await fetchStats({ silent: true })
    showMessage(actionConfig.successMessage({ name: group.name ?? null }), 'success')

    if (action === 'confirmed') {
      if (isComposedSummaryFullyConfirmed()) {
        closeComposedSummary()
      }
      return true
    }
    return true
  } catch (e) {
    showMessage(errMsg(e) || actionConfig.errorMessage, 'error')
    return false
  }
}

const updateComposedPharmacyStatus = async (group: { pharmacyId?: number | null; name?: string | null }) => {
  const groupKey = group?.pharmacyId ?? group?.name ?? ''
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
    showMessage(errMsg(e) || 'Failed to update request status', 'error')
  } finally {
    loading.value = false
  }
}

const loadFulfillment = async (options: { silent?: boolean; refreshLists?: boolean } = {}) => {
  const { silent = false, refreshLists = true } = options
  if (!selectedRequest.value || !canRunFulfillment(selectedRequest.value.status)) return
  loading.value = true
  try {
    const res = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
      const d = res.data as { request?: RichOrderRequest; status?: string; nearby_pharmacies?: PharmacyQueueEntry[]; candidate_plans?: FulfillmentPlan[]; fulfillment_plans?: FulfillmentPlan[]; allocation_summary?: AllocationSummary; pharmacy_queue?: PharmacyQueueEntry[]; next_recommended_pharmacy?: NextRecommendedPharmacy; logistics_assessment?: LogisticsAssessment }
      const fullRequest = d.request || selectedRequest.value
      selectedRequest.value = { ...fullRequest, status: d.status || fullRequest.status }
      selectedStatus.value = selectedRequest.value.status || ''
      adminNotes.value = (selectedRequest.value.admin_notes as string | undefined) || ''
      nearbyPharmacies.value = d.nearby_pharmacies || []
      candidatePlans.value = d.candidate_plans || []
      fulfillmentPlans.value = d.fulfillment_plans || []
      allocationSummary.value = d.allocation_summary || null
      pharmacyQueue.value = d.pharmacy_queue || []
      nextRecommendedPharmacy.value = d.next_recommended_pharmacy || null
      logisticsAssessment.value = d.logistics_assessment || null
      syncPharmacyCoverageFromQueue(pharmacyQueue.value)
      hydrateItemUiState(selectedRequest.value.items || [])
      loadPharmacyLedger()
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

const runFulfillmentManually = async () => {
  fulfillmentProcessLoading.value = true
  try {
    await loadFulfillment({ silent: false })
  } finally {
    fulfillmentProcessLoading.value = false
  }
}

const autoRanFulfillmentForRequestId = ref<number | null>(null)
watch(
  () => ({
    id: selectedRequest.value?.id || null,
    mode: workspaceMode.value,
    queueEmpty: !(pharmacyQueue.value?.length),
    busy: loading.value || fulfillmentProcessLoading.value,
  }),
  (curr) => {
    if (!curr.id || curr.mode !== 'source' || !curr.queueEmpty || curr.busy) return
    if (autoRanFulfillmentForRequestId.value === curr.id) return
    autoRanFulfillmentForRequestId.value = curr.id
    runFulfillmentManually()
  },
  { immediate: true }
)

const contactPharmacy = async (payload: PharmacyQueueEntry & { pharmacy?: PharmacyQueueEntry; note?: string }) => {
  if (!selectedRequest.value) return
  const pharm = payload?.pharmacy || payload
  const note = String(payload?.note || '').trim()
  if (!pharm) return

  // Open WhatsApp immediately
  window.open(pharm.whatsapp_url ?? undefined, '_blank')

  await recordPharmacyContactAction(pharm, 'contacted', { showSuccess: false, note })
}

const handlePharmacyContactStatus = async ({ pharmacy, action, note }: { pharmacy?: PharmacyQueueEntry; action?: string; note?: string } = {}) => {
  const opts: { showSuccess?: boolean; note?: string } = {}
  if (note !== undefined) opts.note = note
  await recordPharmacyContactAction(pharmacy, action ?? '', opts)
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
      admin_notes: adminNotes.value,
      ...(showStatusOverride.value ? { force: true } : {})
    })
    selectedRequest.value.status = newStatus
    selectedStatus.value = ''
    showStatusOverride.value = false

    // Only load fulfillment context when explicitly entering the sourcing phase.
    if (['composing', 'sourcing', 'confirming_with_pharm', 'processing'].includes(newStatus) && canRunFulfillment(newStatus)) {
      const procRes = await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/process`)
      nearbyPharmacies.value = ((procRes.data as { nearby_pharmacies?: PharmacyQueueEntry[] })?.nearby_pharmacies) || []
    }

    await fetchRequests()
    await fetchStats()
    showMessage(statusRes?.message || 'Status updated and fulfillment data refreshed', 'success')

    if (['payment_pending', 'confirmed_in_pharm'].includes(newStatus)) {
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
    if ((e as { code?: string }).code === 'BACKWARDS_TRANSITION') {
      showMessage('This would move backwards. Use "Override" to force it.', 'error')
    } else {
      showMessage(errMsg(e) || 'Failed to update status', 'error')
    }
  } finally {
    loading.value = false
  }
}

const markRequestComposed = async () => {
  if (!selectedRequest.value || !canMarkRequestComposed.value) return
  loading.value = true
  try {
    const statusRes = await apiCall('PUT', `/api/order-requests/admin/${selectedRequest.value.id}/status`, {
      status: 'sourcing',
      admin_notes: adminNotes.value
    })
    selectedRequest.value.status = 'sourcing'
    selectedStatus.value = ''
    await fetchRequests()
    await fetchStats()
    showMessage(statusRes?.message || 'Request moved to Sourcing', 'success')
  } catch (e) {
    showMessage(errMsg(e) || 'Failed to mark request composed', 'error')
  } finally {
    loading.value = false
  }
}

const applyNextStep = async (statusOverride?: string | null) => {
  const targetStatus = statusOverride || nextStepAction.value?.status
  if (!targetStatus || !selectedRequest.value) return
  // Advancing to awaiting_input must create a decision record (not just a status bump)
  if (targetStatus === 'awaiting_input') {
    return requestCustomerDecision('action_needed')
  }
  selectedStatus.value = targetStatus
  await updateStatus()
}

const sendBackToCompose = async () => {
  if (!selectedRequest.value) return
  const ok = window.confirm('Send this request back to Compose? Existing allocations will be preserved.')
  if (!ok) return
  selectedStatus.value = 'composing'
  await updateStatus()
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
    const totals = res.data as { subtotal?: number; available_items?: unknown[]; unavailable_items?: unknown[] }
    showMessage(`Subtotal: GHS ${totals.subtotal} | ${(totals.available_items || []).length} available, ${(totals.unavailable_items || []).length} unavailable`, 'success')
  } catch (e) {
    showMessage('Failed to calculate totals', 'error')
  }
}

const fetchFulfillmentPlans = async (options: { silent?: boolean } = {}) => {
  const { silent = false } = options
  if (!selectedRequest.value) return
    try {
      const res = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}/fulfillment-plans`)
        const data = (res.data || {}) as { candidate_plans?: FulfillmentPlan[]; plans?: FulfillmentPlan[]; summary?: AllocationSummary; pharmacy_queue?: PharmacyQueueEntry[]; next_recommended_pharmacy?: NextRecommendedPharmacy; logistics_assessment?: LogisticsAssessment }
      candidatePlans.value = data.candidate_plans || []
      fulfillmentPlans.value = data.plans || []
      allocationSummary.value = data.summary || null
      pharmacyQueue.value = data.pharmacy_queue || []
      nextRecommendedPharmacy.value = data.next_recommended_pharmacy || null
      logisticsAssessment.value = data.logistics_assessment || null
      syncPharmacyCoverageFromQueue(pharmacyQueue.value)
      loadPharmacyLedger()
    } catch (e) {
      if (!silent) showMessage('Failed to load fulfillment plans', 'error')
    }
}

const requestCustomerDecision = async (decisionType: string) => {
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
    const decision = (res?.data ?? {}) as { whatsapp_url?: string | null }
    await fetchRequests()
    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    selectedRequest.value = detailRes.data as RichOrderRequest
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
    showMessage(errMsg(e) || 'Failed to create customer decision', 'error')
  } finally {
    loading.value = false
  }
}

const decisionOrderValue = (dec: CustomerDecision) => {
  const items = Array.isArray(dec.payload?.decision_items) ? dec.payload.decision_items : []
  const total = items.reduce((sum, item) => {
    if (['available', 'substitute_available', 'partially_available'].includes(item.status ?? '')) {
      const price = Number(item.unit_price ?? item.substitute_option?.marked_up_price ?? 0)
      const qty = Number(item.quantity || 1)
      return sum + price * qty
    }
    return sum
  }, 0)
  return total > 0 ? total : null
}

const decisionDeclineConsequence = (dec: CustomerDecision) => {
  const items = Array.isArray(dec.payload?.decision_items) ? dec.payload.decision_items : []
  if (!items.length) return null
  const sourceable = items.filter(i => ['available', 'substitute_available', 'partially_available'].includes(i.status ?? '')).length
  const unsourceable = items.filter(i => i.status === 'not_available').length
  const parts = []
  if (sourceable > 0) parts.push(`${sourceable} item${sourceable > 1 ? 's' : ''} return to sourcing`)
  if (unsourceable > 0) parts.push(`${unsourceable} item${unsourceable > 1 ? 's' : ''} cannot be sourced`)
  return parts.length ? `If declined: ${parts.join(', ')}.` : null
}

const formatWaitingTime = (d: string | null | undefined) => {
  if (!d) return null
  const ms = Date.now() - new Date(d).getTime()
  if (ms < 0) return null
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hrs < 24) return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`
  const days = Math.floor(hrs / 24)
  const remHrs = hrs % 24
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`
}

const decisionNotifyingId = ref<number | null>(null)

const renotifyDecision = async (decisionId: number) => {
  if (!selectedRequest.value || decisionNotifyingId.value) return
  decisionNotifyingId.value = decisionId
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/decisions/${decisionId}/notify`)
    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    selectedRequest.value = detailRes.data as RichOrderRequest
    showMessage('Customer notified via SMS', 'success')
  } catch (e) {
    showMessage(errMsg(e) || 'Failed to notify customer', 'error')
  } finally {
    decisionNotifyingId.value = null
  }
}

const resolveDecisionAsAdmin = async (decisionId: number, response: string) => {
  if (!selectedRequest.value) return
  const label = response === 'approved' ? 'approve' : 'decline'
  const ok = window.confirm(`${response === 'approved' ? 'Approve' : 'Decline'} this decision on behalf of the customer?`)
  if (!ok) return
  loading.value = true
  try {
    await apiCall('POST', `/api/order-requests/admin/${selectedRequest.value.id}/decisions/${decisionId}/resolve`, { response })
    await fetchRequests()
    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    selectedRequest.value = detailRes.data as RichOrderRequest
    showMessage(`Decision ${label}d on behalf of customer`, 'success')
  } catch (e) {
    showMessage(errMsg(e) || `Failed to ${label} decision`, 'error')
  } finally {
    loading.value = false
  }
}

const startEditItem = (item: RequestItem) => {
  item.editing = true
  item.edit_price = item.unit_price || 0
}

const getRequestSearchCoordinates = () => {
  const request: RichOrderRequest | null = selectedRequest.value
  const lat = Number(
    request?.customer_latitude
    ?? request?.customer_lat
    ?? request?.latitude
    ?? request?.lat
    ?? request?.delivery_latitude
    ?? request?.delivery_lat
  )
  const lng = Number(
    request?.customer_longitude
    ?? request?.customer_lng
    ?? request?.longitude
    ?? request?.lng
    ?? request?.delivery_longitude
    ?? request?.delivery_lng
  )
  return {
    hasCoords: Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0,
    lat,
    lng
  }
}

const getProductSearchLabel = (result: ProductSearchResult | null | undefined) => {
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

const getProductResultMeta = (result: ProductSearchResult | null | undefined) => {
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

const fetchProductSearchResults = async (query: string | null | undefined, options: { requestedUnit?: string; pharmacySearch?: string } = {}) => {
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
  const resData = res?.data as { products?: ProductSearchResult[] } | null
  return Array.isArray(resData?.products) ? resData!.products! : []
}

const searchAdminProducts = async (item: RequestItem) => {
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

const onAdminProductInput = (item: RequestItem) => {
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

const selectAdminProduct = (item: RequestItem, result: ProductSearchResult) => {
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

const closeAdminProductDropdown = (item: RequestItem) => {
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

const selectAlternativeProduct = (result: ProductSearchResult) => {
  const label = getProductSearchLabel(result)
  if (!label) return
  alternativeModal.value.name = label

  const selectedPharmacyId = Number(result?.company_id || 0)
  if (selectedPharmacyId > 0) {
    alternativeModal.value.pharmacy_id = String(selectedPharmacyId)
  }

  const price = Number(result?.price || 0)
  if (price > 0 && (alternativeModal.value.price === '' || alternativeModal.value.price === null || alternativeModal.value.price === undefined)) {
    alternativeModal.value.price = String(Number(price.toFixed(2)))
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

  loading.value = true
  try {
    const quantity = Number(adminNewItem.quantity || 1)
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

    resetAdminNewItem()

    const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
    const detailData = detailRes.data as RichOrderRequest
    selectedRequest.value = detailData
    selectedStatus.value = detailData.status || ''
    adminNotes.value = (detailData.admin_notes as string | undefined) || ''
    hydrateItemUiState(selectedRequest.value?.items || [])
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
    showMessage(errMsg(e) || 'Failed to add item', 'error')
  } finally {
    loading.value = false
  }
}

const useNextRecommendedPharmacy = (item: RequestItem) => {
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

const fillFullAllocation = (item: RequestItem) => {
  item.allocation_quantity = getRequestedQuantity(item)
}

const isPlanItemMissing = (planItem: FulfillmentPlanItem | null | undefined) => {
  if (!planItem) return true
  const matchedQuantity = Number(planItem.matched_quantity || 0)
  if (matchedQuantity > 0) return false
  const availableQuantity = Number(planItem.available_quantity || 0)
  if (availableQuantity > 0) return false
  const likelyType = String(planItem.likely_match_type || '').toLowerCase()
  return !likelyType || likelyType === 'none'
}

const getPlanAllocationForPharmacy = (planItem: FulfillmentPlanItem | null | undefined, pharmacyId: number | string | null | undefined) => {
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

const applyCandidatePlan = async (input: FulfillmentPlan & { plan?: FulfillmentPlan; pharmacy?: PharmacyQueueEntry }) => {
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
    ? (plan.pharmacies ?? [])
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
          return Number((a as { distance_km?: number }).distance_km || 0) - Number((b as { distance_km?: number }).distance_km || 0)
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
      if (sourcedUnitPrice !== null && Number.isFinite(sourcedUnitPrice) && sourcedUnitPrice > 0) {
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
    showMessage(errMsg(e) || 'Failed to apply plan', 'error')
  } finally {
    loading.value = false
  }
}

interface AllocationSource {
  allocation_type?: string; allocation_pharmacy_id?: number | string
  allocation_quantity?: number; substitute_name?: string; substitute_note?: string
  allocation_unit_price?: number | string | null; edit_price?: number | string | null
  unit_price?: number | null; [key: string]: unknown
}
const buildAllocationPayload = (item: RequestItem, source: AllocationSource = item) => {
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
    ? (source.unit_price === null || source.unit_price === undefined ? null : Number(source.unit_price))
    : Number(source.edit_price)

  if (allocationType === 'substitute' && (allocationUnitPrice === null || !Number.isFinite(allocationUnitPrice) || allocationUnitPrice <= 0)) {
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
      : (exactUnitPrice !== null && Number.isFinite(exactUnitPrice) && exactUnitPrice > 0 ? exactUnitPrice : null),
    status: 'confirmed'
  }
}

const refreshSelectedRequestState = async () => {
  if (!selectedRequest.value) return
  const detailRes = await apiCall('GET', `/api/order-requests/admin/${selectedRequest.value.id}`)
  selectedRequest.value = detailRes.data as RichOrderRequest
  adminNotes.value = (selectedRequest.value?.admin_notes as string | undefined) || ''
  hydrateItemUiState(selectedRequest.value?.items || [])
  nearbyPharmacies.value = []
  candidatePlans.value = []
  fulfillmentPlans.value = []
  allocationSummary.value = null
  pharmacyQueue.value = []
  nextRecommendedPharmacy.value = null
  logisticsAssessment.value = null
  const mode = workspaceMode.value
  if (mode === 'compose') {
    fetchPharmacyCoverage()
  } else if (['source', 'fulfillment', 'transit', 'pickup'].includes(mode)) {
    loadFulfillment({ silent: true })
  }
}

const refreshSelectedRequestDetails = async () => {
  loading.value = true
  try {
    await refreshSelectedRequestState()
    showMessage('Request refreshed', 'success')
  } catch (e) {
    showMessage(errMsg(e) || 'Failed to refresh request', 'error')
  } finally {
    loading.value = false
  }
}

const applyCandidatePlanNow = async (plan: FulfillmentPlan) => {
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
    showMessage(`Applied ${(plan.label ?? '').toLowerCase()} as confirmed allocations`, 'success')
  } catch (e) {
    showMessage(errMsg(e) || 'Failed to apply suggested plan', 'error')
  } finally {
    loading.value = false
  }
}

const createAllocationForItem = async (item: RequestItem, options: { autoAdvance?: boolean } = { autoAdvance: true }) => {
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
    showMessage(errMsg(e) || 'Failed to create allocation', 'error')
  } finally {
    loading.value = false
  }
}

const startAllocationEdit = (allocation: Allocation) => {
  hydrateAllocationUiState(allocation)
  allocation.editing = true
}

const cancelAllocationEdit = (allocation: Allocation) => {
  allocation.editing = false
  allocation.edit_allocated_quantity = Number(allocation.allocated_quantity || 1)
  allocation.edit_allocation_type = allocation.allocation_type || 'exact'
  allocation.edit_status = allocation.status || 'confirmed'
  allocation.edit_substitute_name = allocation.substitute_name || ''
  allocation.edit_substitute_note = allocation.substitute_note || ''
}

const saveAllocation = async (item: RequestItem, allocation: Allocation) => {
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

const saveItemPrice = async (item: RequestItem) => {
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
    showMessage(errMsg(e) || 'Failed to update selection', 'error')
  } finally {
    loading.value = false
  }
}

const clearSavedSelection = async (item: RequestItem) => {
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
    showMessage(errMsg(e) || 'Failed to clear saved selection', 'error')
  } finally {
    loading.value = false
  }
}

const deleteRequestItem = async (item: RequestItem) => {
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
    showMessage(errMsg(e) || 'Failed to delete request item', 'error')
  } finally {
    loading.value = false
  }
}

// Helpers
const STATUS_LABEL_OVERRIDES = {
  awaiting_method_selection: 'Payment Pending',
}
const formatStatus = (status: string | null | undefined) => {
  if (status && STATUS_LABEL_OVERRIDES[status as keyof typeof STATUS_LABEL_OVERRIDES]) return STATUS_LABEL_OVERRIDES[status as keyof typeof STATUS_LABEL_OVERRIDES]
  return (status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
}
const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
const formatDateTime = (d: string | null | undefined) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'
const formatCurrency = (value: number | string | null | undefined) => `GHS ${Number(value || 0).toFixed(2)}`
const formatRelativeTime = (d: string | null | undefined) => {
  if (!d) return null
  const diffMs = Date.now() - new Date(d).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return diffMins <= 1 ? 'just now' : `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}
const formatSignedCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value || 0)
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}GHS ${Math.abs(amount).toFixed(2)}`
}
const formatRatingStars = (rating: number | string | null | undefined) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)))
  return `${'★'.repeat(safeRating)}${'☆'.repeat(Math.max(5 - safeRating, 0))}`
}
const formatExcludedReason = (reason: string | null | undefined) => {
  const key = String(reason || '').toLowerCase()
  if (key === 'removed_by_customer') return 'Removed by customer'
  if (key === 'unavailable') return 'Unavailable'
  return 'Not included'
}
const formatDistance = (km: number | string | null | undefined) => `${Number(km || 0).toFixed(1)} km`
const normalizeItemStatus = (item: RequestItem | null | undefined) => {
  const rawStatus = item?.sourcing_status || item?.item_status || 'pending'
  const hasQuote = Number(item?.unit_price || 0) > 0 || Number(item?.marked_up_price || 0) > 0

  if (rawStatus === 'unavailable' || item?.item_status === 'not_available') return 'unavailable'
  if (hasQuote) return 'confirmed'
  return rawStatus
}
const isItemUnavailable = (item: RequestItem | null | undefined) => normalizeItemStatus(item) === 'unavailable'
const getLatestSubstituteAllocation = (item: RequestItem | null | undefined) => {
  if (!Array.isArray(item?.allocations)) return null

  const substituteAllocations = item.allocations
    .filter((allocation: Allocation) => {
      const type = String(allocation?.allocation_type || '').toLowerCase()
      const status = String(allocation?.status || '').toLowerCase()
      return type === 'substitute' && ['proposed', 'confirmed'].includes(status)
    })
    .sort((a: Allocation, b: Allocation) => {
      const aTime = new Date(a?.updated_at || a?.created_at || 0).getTime()
      const bTime = new Date(b?.updated_at || b?.created_at || 0).getTime()
      return bTime - aTime
    })

  return substituteAllocations[0] || null
}
const getItemSubstituteDetails = (item: RequestItem | null | undefined) => {
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
    showMessage(errMsg(e) || 'Failed to save alternative', 'error')
  } finally {
    loading.value = false
  }
}
const formatItemStatus = (item: RequestItem | null | undefined) => normalizeItemStatus(item)
const itemStatusClass = (item: RequestItem | null | undefined) => normalizeItemStatus(item)
const formatQueueState = (state: string | null | undefined) => (state || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
const formatAllocationTypeLabel = (value: string | null | undefined) => ({ exact: 'Exact', substitute: 'Alternative' } as Record<string, string>)[value ?? ''] ?? 'Exact'
const formatAllocationStatusLabel = (value: string | null | undefined) => ({ proposed: 'Confirmed', confirmed: 'Confirmed', declined: 'Declined', expired: 'Expired' } as Record<string, string>)[value ?? ''] ?? 'Confirmed'
const allocationStatusClass = (value: string | null | undefined) => ({
  confirmed: value === 'confirmed' || value === 'proposed',
  declined: value === 'declined',
  expired: value === 'expired'
})
const createAllocationLabel = (item: RequestItem | null | undefined) => item?.allocation_status === 'confirmed'
  ? 'Add Confirmed Allocation'
  : 'Add Confirmed Allocation'
const queueStateClass = (state: string | null | undefined) => ({
  success: ['full'].includes(state ?? ''),
  current: ['awaiting_response', 'partial'].includes(state ?? ''),
  muted: ['not_contacted', 'pending', 'unknown'].includes(state ?? ''),
  danger: ['declined', 'timeout'].includes(state ?? '')
})
const showMessage = (text: string, type = 'success') => {
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

// Deep-link support: open a specific request when arriving with ?requestId=X
// (used by the admin sidebar's Needs Attention dropdown so admins can jump
// straight to a flagged request from anywhere in the portal).
const route = useRoute()
const router = useRouter()

const openRequestByQueryId = async (rawId: string | string[] | null | undefined) => {
  const id = Number(rawId || 0)
  if (!id) return
  if (Number(selectedRequest.value?.id || 0) === id) return
  try {
    await viewRequest({ id })
  } catch (e) {
    showMessage('Could not open that request', 'error')
  } finally {
    // Clean up the URL so a refresh doesn't re-open the same request.
    router.replace({ query: { ...route.query, requestId: undefined } })
  }
}

watch(() => route.query.requestId, (val) => {
  if (val) openRequestByQueryId(val as string | string[] | null | undefined)
})

onMounted(async () => {
  await fetchRequests()
  fetchStats()
  requestPollTimer = window.setInterval(pollRequestList, REQUEST_POLL_MS)
  if (route.query.requestId) openRequestByQueryId(route.query.requestId as string | string[] | null | undefined)
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
.fulfillment-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 0.75rem;
  padding: 0.5rem 0;
}
.fulfillment-sparkle {
  width: 28px;
  height: 28px;
  color: #5A2468;
  animation: fulfillmentSpin 1s linear infinite;
}
.fulfillment-loading-label {
  font-size: 11px;
  font-weight: 600;
  color: #9B4A88;
  letter-spacing: 0.04em;
}
@keyframes fulfillmentSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
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

.header-status-override {
  position: relative;
}

.header-status-override-btn--active {
  border-color: #4F217A !important;
  color: #4F217A !important;
  background: #f4e8fb !important;
}

.header-status-override-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  min-width: 280px;
}

.header-status-override-select {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.4rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.header-status-override-select:focus {
  outline: none;
  border-color: #cbd5e1;
  box-shadow: 0 0 0 2px rgba(79, 33, 122, 0.18);
}

.header-status-override-apply {
  flex-shrink: 0;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  background: #4F217A;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.header-status-override-apply:hover:not(:disabled) {
  background: #3b1860;
}

.header-status-override-apply:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  grid-template-columns: 2fr 3fr;
  min-height: 500px;
  gap: 0;
}

.request-items-pane {
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.workspace-composer-card {
  background: #fcfcfc;
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

.workspace-nested-head .modal-close {
  flex-shrink: 0;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.workspace-nested-head .modal-close:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #0f172a;
}

.workspace-nested-head .modal-close:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.workspace-nested-head .close-svg {
  width: 18px;
  height: 18px;
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
  grid-template-columns: 2fr 3fr;
  gap: 1rem;
  align-items: start;
}

.workspace-board-grid--locked {
  opacity: 0.45;
  pointer-events: none;
  filter: grayscale(0.4);
  transition: opacity 0.2s, filter 0.2s;
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

.pane-quick-add {
  margin-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
  position: relative;
}

.pane-quick-add-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6b7280;
}

.pane-quick-add-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pane-quick-add-lock {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.6rem;
  font-size: 0.7rem;
  color: #6b7280;
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

.workspace-composer-card {
  border: 1px solid #dbe4ef;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(191, 219, 254, 0.16), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  padding: 1.1rem 1.1rem 1rem;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
  min-width: 0;
}

.workspace-composer-divider {
  border-top: 1px solid #e2e8f0;
  margin: 0.9rem -1.1rem;
}

.composer-meta-strip {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0;
}

.composer-meta-notes,
.composer-meta-queue {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.composer-meta-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6b7280;
}

.composer-meta-label--toggle {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.35rem;
  border-radius: 6px;
  transition: background 0.12s;
}
.composer-meta-label--toggle:hover {
  background: #f3f4f6;
}

.composer-notes-preview {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: #9ca3af;
  font-size: 0.65rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compose-cta-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #c4b5fd;
  border-radius: 12px;
}

.compose-cta-banner--full {
  margin-bottom: 0;
}

.compose-cta-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #4F217A;
  border-radius: 8px;
  color: #fff;
  flex-shrink: 0;
}

.compose-cta-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}
.compose-cta-copy strong {
  font-size: 0.75rem;
  font-weight: 800;
  color: #3b0764;
}
.compose-cta-copy span {
  font-size: 0.68rem;
  color: #6d28d9;
  line-height: 1.4;
}

.compose-cta-btn {
  flex-shrink: 0;
  padding: 0.4rem 0.9rem;
  background: #4F217A;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.compose-cta-btn:hover:not(:disabled) {
  background: #381659;
}
.compose-cta-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.composer-meta-textarea {
  width: 100%;
  font-size: 0.72rem;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.45rem 0.6rem;
  resize: none;
  min-height: 52px;
  line-height: 1.5;
  outline: none;
  transition: background 0.15s, box-shadow 0.15s;
}

.composer-meta-textarea:focus {
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(79, 33, 122, 0.12);
}

.composer-meta-queue-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.composer-action-strip {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid #f3f4f6;
}

.workspace-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.workspace-panel-head h5,
.workspace-composer-card .simple-composer-head h5 {
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

/* ── Mode-specific panels ──────────────────────────────────────────────── */
.pharmacy-outreach-list,
.pharmacy-queue-list,
.decisions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* ---- Decision card ---- */
.decision-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.decision-card--pending { border-left: 3px solid #f59e0b; }
.decision-card--approved { border-left: 3px solid #22c55e; background: #f0fdf4; }
.decision-card--declined { border-left: 3px solid #ef4444; background: #fff5f5; }
.decision-card--expired { border-left: 3px solid #94a3b8; opacity: 0.75; }

.decision-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.decision-card-header-left, .decision-card-header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.decision-context-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: #e2e8f0;
  color: #334155;
  text-transform: capitalize;
}

.decision-meta-chip {
  font-size: 0.72rem;
  color: #64748b;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: #f1f5f9;
}
.decision-meta-chip--expired { color: #ef4444; background: #fee2e2; }
.decision-meta-chip--waiting { color: #0369a1; background: #e0f2fe; font-weight: 600; }
.decision-meta-chip--waiting-warn { color: #92400e; background: #fef3c7; }
.decision-meta-chip--waiting-critical { color: #991b1b; background: #fee2e2; }

.decision-message-block { display: flex; flex-direction: column; gap: 0.2rem; }
.decision-message-title { font-size: 0.88rem; font-weight: 600; color: #1e293b; margin: 0; }
.decision-message-body  { font-size: 0.82rem; color: #475569; margin: 0; }

/* Summary stats */
.decision-summary-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.6rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
}
.decision-stat { display: flex; flex-direction: column; align-items: center; min-width: 3.5rem; }
.decision-stat-label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
.decision-stat-value { font-size: 1rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
.decision-stat--ok   .decision-stat-value { color: #16a34a; }
.decision-stat--warn .decision-stat-value { color: #dc2626; }
.decision-stat--sub  .decision-stat-value { color: #d97706; }
.decision-stat--split .decision-stat-value { color: #2563eb; }
.decision-stat--value .decision-stat-value { color: #0f766e; font-weight: 700; }

/* Decision items table */
.decision-items-table {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  overflow: hidden;
  font-size: 0.81rem;
}
.decision-items-head {
  display: grid;
  grid-template-columns: 1fr 8rem 10rem 1fr;
  gap: 0.5rem;
  padding: 0.35rem 0.65rem;
  background: #f1f5f9;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.decision-items-row {
  display: grid;
  grid-template-columns: 1fr 8rem 10rem 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0.65rem;
  border-top: 1px solid #e2e8f0;
  align-items: center;
}
.decision-items-row:nth-child(even) { background: #f8fafc; }
.decision-item-name { font-weight: 500; color: #1e293b; }
.decision-item-status-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
  white-space: nowrap;
}
.decision-item-status--available        { background: #dcfce7; color: #15803d; }
.decision-item-status--not_available    { background: #fee2e2; color: #dc2626; }
.decision-item-status--substitute_available { background: #fef9c3; color: #b45309; }
.decision-item-status--partially_available  { background: #fff7ed; color: #c2410c; }
.decision-item-note { color: #64748b; font-size: 0.78rem; }

/* Admin override row */
.decision-admin-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #cbd5e1;
}
.decision-decline-consequence { font-size: 0.78rem; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; padding: 0.25rem 0.5rem; margin: 0 0 0.4rem 0; }
.decision-admin-note { font-size: 0.78rem; color: #64748b; margin: 0; }
.decision-admin-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }

/* Small utility buttons */
.btn-sm {
  font-size: 0.78rem;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-success { background: #22c55e; color: #fff; border-color: #16a34a; }
.btn-success:hover:not(:disabled) { background: #16a34a; }
.btn-danger-outline { background: #fff; color: #dc2626; border-color: #fca5a5; }
.btn-danger-outline:hover:not(:disabled) { background: #fee2e2; }
.btn-renotify { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.btn-renotify:hover:not(:disabled) { background: #dcfce7; border-color: #86efac; }

.btn-call-nudge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-call-nudge:hover { background: #e0f2fe; border-color: #7dd3fc; }
.btn-call-nudge i { font-size: 1rem; }

/* Ghost button */
.btn-ghost {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.78rem;
  padding: 0.25rem 0.65rem;
  font-weight: 500;
  transition: background 0.15s;
}
.btn-ghost:hover:not(:disabled) { background: #f1f5f9; }
.btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

/* Section head with actions */
.section-head-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}


.outreach-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.outreach-next-chip {
  background: #0ea5e9;
  color: #fff;
  border-radius: 6px;
  padding: 0.15rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.pharmacy-outreach-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.82rem;
  flex-wrap: wrap;
}

.pharmacy-outreach-row--next {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.pharmacy-queue-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.82rem;
}

.pharmacy-outreach-info,
.pharmacy-queue-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.pharmacy-outreach-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* Queue state chips */
.outreach-queue-chip {
  border-radius: 5px;
  padding: 0.1rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
}
.outreach-queue-chip--not_contacted { background: #f1f5f9; color: #64748b; }
.outreach-queue-chip--awaiting_response { background: #fef9c3; color: #854d0e; }
.outreach-queue-chip--full { background: #dcfce7; color: #166534; }
.outreach-queue-chip--partial { background: #fff7ed; color: #9a3412; }
.outreach-queue-chip--declined { background: #fee2e2; color: #991b1b; }
.outreach-queue-chip--unknown { background: #f1f5f9; color: #94a3b8; }

/* Coverage chip */
.outreach-coverage-chip {
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 5px;
  padding: 0.1rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
}
.outreach-coverage-chip--full {
  background: #dcfce7;
  color: #166534;
}
.outreach-orders-chip {
  background: #f1f5f9;
  color: #475569;
  border-radius: 5px;
  padding: 0.1rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 500;
}
.outreach-orders-chip--low {
  background: #fff7ed;
  color: #92400e;
}
.outreach-phone-input {
  height: 1.75rem;
  padding: 0 0.5rem;
  font-size: 0.78rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 9rem;
  outline: none;
}
.outreach-phone-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
}
.outreach-btn--add-phone {
  background: #f0fdf4;
  color: #166534;
  border-color: #86efac;
}
.outreach-btn--add-phone:hover { background: #dcfce7; }
.outreach-btn--cancel {
  background: #f9fafb;
  color: #6b7280;
  border-color: #e5e7eb;
}
.outreach-btn--cancel:hover { background: #f3f4f6; }

/* Action buttons */
.outreach-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.outreach-btn--wa {
  background: #dcfce7;
  color: #166534;
  border-color: #86efac;
}
.outreach-btn--wa:hover { background: #bbf7d0; }
.outreach-btn--call {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.outreach-btn--call:hover { background: #dbeafe; }
.outreach-btn--confirm {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}
.outreach-btn--confirm:hover, .outreach-btn--confirm.active {
  background: #dcfce7;
  border-color: #4ade80;
}
.outreach-btn--partial {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fed7aa;
}
.outreach-btn--partial:hover, .outreach-btn--partial.active {
  background: #ffedd5;
  border-color: #fb923c;
}
.outreach-btn--decline {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.outreach-btn--decline:hover, .outreach-btn--decline.active {
  background: #fee2e2;
  border-color: #f87171;
}
.outreach-btn--route {
  background: #4F217A;
  color: #fff;
  border-color: #4F217A;
  font-weight: 800;
}
.outreach-btn--route:hover:not(:disabled) {
  background: #381659;
  border-color: #381659;
}
.outreach-btn--route:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sourcing mode: goal banner */
.sourcing-goal-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
.sourcing-goal-count {
  font-size: 0.72rem;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
  border-radius: 5px;
  padding: 0.1rem 0.45rem;
}
.sourcing-goal-count--warn {
  background: #fff7ed;
  color: #9a3412;
}
/* Escalation card */
.sourcing-escalation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.sourcing-escalation-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.sourcing-escalation-copy strong {
  font-size: 0.82rem;
  color: #92400e;
}
.sourcing-escalation-copy span {
  color: #78350f;
  font-size: 0.78rem;
}
.sourcing-escalation-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.sourcing-esc-btn {
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.sourcing-esc-btn--keep { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
.sourcing-esc-btn--keep:hover { background: #e2e8f0; }
.sourcing-esc-btn--split { background: #f59e0b; color: #fff; border-color: #d97706; }
.sourcing-esc-btn--split:hover { background: #d97706; }
/* Split mode header */
.sourcing-split-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
.sourcing-split-header-left { display: flex; align-items: center; gap: 0.5rem; }
.sourcing-split-badge {
  background: #7c3aed;
  color: #fff;
  border-radius: 5px;
  padding: 0.1rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
}
.sourcing-split-back { font-size: 0.75rem; color: #7c3aed; background: none; border: none; cursor: pointer; padding: 0; font-weight: 600; }
.sourcing-split-back:hover { text-decoration: underline; }
/* All covered banner */
.sourcing-covered-banner {
  padding: 0.5rem 0.75rem;
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #166534;
  margin-top: 0.5rem;
}
/* Item coverage tracker */
.sourcing-item-tracker {
  border: 1px solid #e9d5ff;
  border-radius: 8px;
  background: #faf5ff;
  overflow: hidden;
  margin-top: 0.5rem;
}
.tracker-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.8rem;
  border-bottom: 1px solid #ede9fe;
  flex-wrap: wrap;
}
.tracker-item-row:last-child { border-bottom: none; }
.tracker-item-row--covered { background: #f0fdf4; }
.tracker-item-row--pending { background: #faf5ff; }
.tracker-item-info { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
.tracker-item-name { font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tracker-item-qty { font-size: 0.72rem; color: #64748b; white-space: nowrap; }
.tracker-item-allocs { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; justify-content: flex-end; }
.tracker-alloc-chip { background: #dcfce7; color: #166534; border-radius: 5px; padding: 0.1rem 0.45rem; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
.tracker-remaining-badge { background: #fff7ed; color: #9a3412; border-radius: 5px; padding: 0.1rem 0.45rem; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
/* Outreach section headers */
.outreach-section-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0; margin-top: 0.5rem; }
.outreach-section-head--spaced { margin-top: 0.85rem; }
.outreach-section-label { font-size: 0.72rem; font-weight: 700; border-radius: 5px; padding: 0.1rem 0.45rem; }
.outreach-section-label--full { background: #dcfce7; color: #166534; }
.outreach-section-label--partial { background: #fff7ed; color: #9a3412; }
.outreach-section-note { font-size: 0.72rem; color: #94a3b8; }
/* Response modal split note */
.response-modal-split-note {
  font-size: 0.72rem;
  background: #ede9fe;
  color: #6d28d9;
  border-radius: 5px;
  padding: 0.1rem 0.45rem;
  font-weight: 600;
}

/* ============================================================
   PHARMACY RESPONSE MODAL
   ============================================================ */
.response-capture-modal {
  max-width: 640px;
  width: 100%;
}
.response-capture-modal .workspace-nested-content {
  grid-template-columns: 1fr;
  overflow-y: auto;
}
.response-mode-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.55rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  vertical-align: middle;
  letter-spacing: 0.02em;
}
.response-mode-badge--full {
  background: #dcfce7;
  color: #15803d;
}
.response-mode-badge--partial {
  background: #fff7ed;
  color: #c2410c;
}
.response-modal-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.65rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}
.response-modal-summary-count {
  font-weight: 700;
  color: #111827;
}
.response-modal-summary-hint {
  color: #6b7280;
}
.response-modal-pharmacy-summary {
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0.15rem 0 0;
}
.response-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-height: 55vh;
  overflow-y: auto;
}
.response-item-row {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  background: #fff;
  transition: border-color 0.15s, background 0.15s;
}
.response-item-row--available {
  border-color: #86efac;
  background: #f0fdf4;
}
.response-item-row--unavailable {
  background: #fafafa;
  opacity: 0.72;
}
.response-item-checkbox {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.88rem;
}
.response-item-checkbox input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  cursor: pointer;
}
.response-item-name {
  font-weight: 600;
  color: #111827;
  flex: 1;
}
.response-item-req {
  font-size: 0.78rem;
  color: #6b7280;
  white-space: nowrap;
}
.response-item-fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  margin-top: 0.4rem;
  align-items: start;
}
.response-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.response-field-group label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.response-price-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.response-substitute-inline {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  white-space: nowrap;
}
.response-substitute-inline input[type="checkbox"] {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  cursor: pointer;
}
.response-qty-input {
  width: 5.5rem;
}
.response-price-input {
  width: 8rem;
}
.response-price-input--catalog {
  border-color: #a5b4fc;
  background: #f5f3ff;
}
.response-price-hint {
  font-size: 0.68rem;
  color: #6b7280;
  margin-top: 0.15rem;
  line-height: 1.2;
}
.response-price-hint-label {
  color: #4f46e5;
  font-weight: 500;
}
.response-price-hint-sync {
  color: #9ca3af;
}
.response-note-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.response-note-field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
}
.response-note-field .form-control {
  resize: vertical;
  min-height: 3.5rem;
}

.pharmacy-queue-items {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.queue-item-chip {
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  padding: 0.1rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.logistics-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
  font-size: 0.82rem;
}

.terminal-notes {
  margin-top: 0.75rem;
  font-size: 0.84rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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

.workspace-composer-card--starter {
  display: flex;
  flex-direction: column;
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
  margin: 0.9rem 0 0;
}

.simple-search-anchor {
  position: relative;
  margin-bottom: 0;
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
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: auto;
  background: #ffffff;
  max-height: 22rem;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.13), 0 2px 6px rgba(15, 23, 42, 0.06);
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

.workspace-composer-card--prescription .saved-selection-row {
  cursor: default;
}

.workspace-composer-card--prescription .saved-selection-row:hover {
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

/* Coverage Matrix Panel */
.coverage-matrix-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.coverage-matrix-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.coverage-resolve-prompt {
  padding: 0.75rem 1.25rem 0;
}

.coverage-loading,
.coverage-empty {
  padding: 0 1.25rem;
}

.coverage-pharmacy-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  max-height: calc(100vh - 380px);
}

.coverage-pharmacy-card {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s ease;
}

.coverage-pharmacy-card:hover {
  background: #fafbfc;
}

.coverage-pharmacy-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.coverage-bar-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.coverage-bar-track {
  flex: 1;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.coverage-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.coverage-items-section {
  margin-top: 0.5rem;
}

.coverage-item-group {
  padding: 0.25rem 0;
}

.coverage-item-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.1rem 0;
}

.coverage-item-row--covered {
  color: #1f2937;
}

.coverage-item-row--uncovered {
  opacity: 0.6;
}

.coverage-item-match-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0 0.15rem 1.25rem;
}

.coverage-match-badge {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.coverage-match-badge--master {
  background: #f3e8ff;
  color: #7c3aed;
}

.coverage-match-badge--fuzzy {
  background: #e0f2fe;
  color: #0369a1;
}

.coverage-sub-search-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: #faf5ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  margin: 2px 0 4px;
}

.coverage-sub-search-results {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.coverage-sub-search-result {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
  padding: 6px 10px;
  border: 0;
  border-bottom: 1px solid #f3f4f6;
  background: transparent;
  cursor: pointer;
  transition: background 0.12s;
}

.coverage-sub-search-result:last-child {
  border-bottom: 0;
}

.coverage-sub-search-result:hover {
  background: #f5f3ff;
}

.resolve-mode-tab {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.12s;
}

.resolve-mode-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.resolve-mode-tab.active {
  background: #4F217A;
  border-color: #4F217A;
  color: #fff;
}

/* ── Pipeline status bar ──────────────────────────────────────────────────── */
.pipeline-bar {
  display: flex;
  align-items: center;
  padding: 0.65rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  gap: 0;
  overflow-x: auto;
}

.pipeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: fit-content;
}

.pipeline-step-dot {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e7eb;
  background: #fff;
  transition: all 0.2s;
}

.pipeline-step--done .pipeline-step-dot {
  background: #4F217A;
  border-color: #4F217A;
  color: #fff;
}

.pipeline-step--active .pipeline-step-dot {
  background: #fff;
  border-color: #4F217A;
  box-shadow: 0 0 0 3px rgba(79, 33, 122, 0.15);
}

.pipeline-step--future .pipeline-step-dot {
  background: #f9fafb;
  border-color: #d1d5db;
}

.pipeline-step-label {
  font-size: 0.58rem;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.pipeline-step--done .pipeline-step-label { color: #4F217A; }
.pipeline-step--active .pipeline-step-label { color: #4F217A; font-weight: 900; }
.pipeline-step--future .pipeline-step-label { color: #9ca3af; }

.pipeline-step-connector {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  min-width: 1rem;
  max-width: 3.5rem;
  margin-bottom: 1.1rem;
}

.pipeline-step-connector--done {
  background: #4F217A;
}

.pipeline-bar--exit {
  justify-content: flex-start;
  gap: 0.5rem;
}

.pipeline-exit-pill {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

/* ── Status action row (next step + override) ──────────────────────────────── */
.status-nudge-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.65rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 10px;
}

.status-action-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.next-step-btn {
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  background: #4F217A;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  text-align: center;
}
.next-step-btn:hover:not(:disabled) { background: #381659; }
.next-step-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.override-toggle-btn {
  padding: 0;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.12s;
  white-space: nowrap;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}
.override-toggle-btn:hover,
.override-toggle-btn.active {
  color: #4b5563;
}

.status-override-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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

.workspace-composer-card--prescription .selection-editor-panel {
  background:
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.05), transparent 34%),
    #ffffff;
}

.workspace-composer-card--prescription .composer-field .form-control,
.workspace-composer-card--prescription .items-qty-stepper {
  min-height: 2.45rem;
}

.workspace-composer-card--prescription .composer-field .form-control {
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}

.workspace-composer-card--prescription .composer-field--price .form-control {
  min-width: 0;
}

.workspace-composer-card--prescription .items-qty-stepper {
  gap: 0.35rem;
  min-width: 0;
  flex-wrap: nowrap;
}

.workspace-composer-card--prescription .items-qty-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
}

.workspace-composer-card--prescription .allocation-mini {
  min-width: 0;
  width: 3.75rem;
  text-align: center;
}

.workspace-composer-card--prescription .composer-actions {
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

.btn-whatsapp-nudge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-whatsapp-nudge:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.btn-whatsapp-nudge i {
  font-size: 1rem;
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

.payment-cost-totals {
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.payment-cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #374151;
}
.payment-cost-row--total {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  border-top: 1px solid #e5e7eb;
  margin-top: 0.25rem;
  padding-top: 0.5rem;
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

/* ---- Delivery management styles ---- */
.deliveries-section {}

.delivery-cards {
  display: grid;
  gap: 0.6rem;
}

.delivery-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  background: #f9fafb;
}

.delivery-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.delivery-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.delivery-card-actions {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.delivery-status-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  text-transform: capitalize;
  background: #f3f4f6;
  color: #374151;
}
.delivery-status-chip--open { background: #eff6ff; color: #2563eb; }
.delivery-status-chip--rider_proposed { background: #fef9c3; color: #854d0e; }
.delivery-status-chip--assigned { background: #fef9c3; color: #854d0e; }
.delivery-status-chip--picking_up,
.delivery-status-chip--picked_up { background: #f0fdf4; color: #166534; }
.delivery-status-chip--in_transit { background: #e0f2fe; color: #0369a1; }
.delivery-status-chip--delivered { background: #dcfce7; color: #15803d; }
.delivery-status-chip--failed { background: #fee2e2; color: #991b1b; }
.delivery-status-chip--cancelled { background: #f3f4f6; color: #9ca3af; }

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
