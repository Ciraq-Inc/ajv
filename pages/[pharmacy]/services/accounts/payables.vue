<template>
  <div class="pb">
    <header class="pb-head">
      <h1>Payables</h1>
      <div ref="syncBellRef" class="pb-head-actions" @keydown.esc="syncPanelOpen = false">
        <button v-if="showSyncBadge" type="button" class="pb-pill" :class="{ 'is-action': pendingSyncNeedsActionCount }" title="Open payments waiting for RigelOS sync" @click="goToPendingPayments">
          <span class="pb-dot" :class="{ 'is-wait': !pendingSyncNeedsActionCount }" aria-hidden="true" />
          <span>{{ pendingSyncNeedsActionCount ? `${pendingSyncNeedsActionCount} awaiting RigelOS sync` : `${pendingSyncCount} confirming in RigelOS` }}</span>
        </button>
        <div class="pb-pop-wrap">
          <button type="button" class="pb-btn pb-btn-quiet pb-btn-icon" :aria-label="pendingSyncCount ? `${pendingSyncCount} payment${pendingSyncCount === 1 ? '' : 's'} awaiting a RigelOS update` : 'Payment sync status'" :aria-expanded="syncPanelOpen" aria-controls="payable-sync-panel" @click="toggleSyncPanel">
            <BellIcon class="pb-ico" aria-hidden="true" />
            <span v-if="pendingSyncCount" class="pb-badge" :class="{ 'is-action': syncQueueState === 'action' }">{{ pendingSyncCount > 99 ? '99+' : pendingSyncCount }}</span>
          </button>
          <Transition name="sync-pop">
            <div v-if="syncPanelOpen" id="payable-sync-panel" class="pb-pop" role="region" aria-label="RigelOS payment sync status">
              <div class="pb-pop-head">
                <div>
                  <p class="pb-pop-title">RigelOS sync queue</p>
                  <p class="pb-pop-sub">{{ pendingSyncNeedsActionCount ? 'Run Sync Inventory in RigelOS to apply these payments.' : 'These payments are with RigelOS. The next invoice sync confirms them.' }}</p>
                </div>
                <button type="button" class="pb-x" aria-label="Close sync status" @click="syncPanelOpen = false"><XMarkIcon class="pb-ico" aria-hidden="true" /></button>
              </div>
              <p v-if="isLoadingPendingPayables && !pendingSyncItems.length" class="pb-pop-msg">Checking payment sync status…</p>
              <div v-else-if="pendingSyncCount" class="pb-pop-list">
                <div v-for="payable in pendingSyncItems" :key="payable.id" class="pb-pop-row">
                  <span class="pb-dot" :class="pendingPaymentNeedsSync(payable) ? 'is-action' : 'is-wait'" aria-hidden="true" />
                  <div class="pb-pop-row-main">
                    <div class="pb-pop-row-top">
                      <span class="pb-trunc">{{ payable.supplierName || 'Unnamed supplier' }}</span>
                      <strong>{{ formatMoney(pendingPaymentAmount(payable)) }}</strong>
                    </div>
                    <p class="pb-pop-row-sub">{{ payable.supplierInvoiceNo || payable.invoiceId }} · {{ pendingPaymentTime(payable) }}</p>
                    <p class="pb-pop-row-state" :class="{ 'is-action': pendingPaymentNeedsSync(payable) }">{{ pendingPaymentStatus(payable) }}</p>
                  </div>
                </div>
                <p v-if="pendingSyncCount > pendingSyncItems.length" class="pb-pop-msg">Showing the first {{ pendingSyncItems.length }} of {{ pendingSyncCount }} waiting payments.</p>
              </div>
              <p v-else class="pb-pop-msg">No payments are waiting for RigelOS right now.</p>
              <div v-if="pendingSyncCount" class="pb-pop-foot">
                <div><span>Total waiting</span><strong>{{ formatMoney(pendingSyncTotalPesewas / 100) }}</strong></div>
                <button type="button" class="pb-btn pb-btn-primary pb-btn-block" @click="goToPendingPayments">Review queued payments</button>
              </div>
            </div>
          </Transition>
        </div>
        <button type="button" class="pb-btn pb-btn-quiet pb-btn-icon" :disabled="isRefreshing" aria-label="Refresh payables" title="Refresh" @click="refresh">
          <ArrowPathIcon class="pb-ico" :class="{ 'pb-spin': isRefreshing }" aria-hidden="true" />
        </button>
      </div>
    </header>

    <nav class="pb-ws" aria-label="Accounts workspace">
      <button type="button" @click="switchWorkspace(accountsPath)">Accounts</button>
      <button type="button" aria-current="page" class="is-on">Payables</button>
    </nav>

    <dl class="pb-summary">
      <div class="pb-cell pb-cell-lead">
        <dt>Outstanding</dt>
        <dd>{{ formatPesewas(outstandingAmount) }}</dd>
      </div>
      <div class="pb-cell">
        <dt>Overdue</dt>
        <dd :class="{ 'is-bad': overdueAmount > 0, 'is-none': overdueAmount <= 0 }">{{ overdueAmount > 0 ? formatPesewas(overdueAmount) : '—' }}</dd>
      </div>
      <div class="pb-cell">
        <dt>Due this week</dt>
        <dd :class="{ 'is-none': dueThisWeekAmount <= 0 }">{{ dueThisWeekAmount > 0 ? formatPesewas(dueThisWeekAmount) : '—' }}</dd>
      </div>
    </dl>

    <section class="pb-card">
      <div class="pb-tabs" role="tablist" aria-label="Payable status">
        <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="activeTab === tab.value" class="pb-tab" :class="{ 'is-on': activeTab === tab.value }" @click="setActiveTab(tab.value)">
          <span v-if="tab.value === 'awaiting' && tab.count > 0" class="pb-dot is-action" aria-hidden="true" />
          {{ tab.label }}
          <span v-if="tab.count !== null" class="pb-count">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="activeTab !== 'reports'" class="pb-toolbar">
        <label class="pb-search">
          <MagnifyingGlassIcon class="pb-ico" aria-hidden="true" />
          <UiInput v-model="searchQuery" :aria-label="activeTab === 'ledger' ? 'Search payment ledger' : 'Search supplier invoices'" :placeholder="activeTab === 'ledger' ? 'Search supplier, invoice or account' : 'Search supplier or invoice'" class="pb-search-in" />
        </label>
        <UiSelect v-model="supplierFilter">
          <UiSelectTrigger class="pb-in pb-sel pb-w-supplier" :class="{ 'is-set': supplierFilter !== 'all' }" aria-label="Supplier">
            <UiSelectValue placeholder="All suppliers" class="pb-trunc" />
          </UiSelectTrigger>
          <UiSelectContent class="max-h-72">
            <UiSelectItem value="all">All suppliers</UiSelectItem>
            <UiSelectItem v-for="supplier in payableSuppliers" :key="supplierOptionValue(supplier)" :value="supplierOptionValue(supplier)" class="capitalize">
              <span class="truncate">{{ supplier.supplierName }}</span>
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
        <UiSelect v-model="sourceFilter">
          <UiSelectTrigger class="pb-in pb-sel pb-w-source" :class="{ 'is-set': sourceFilter !== 'all' }" aria-label="Source"><UiSelectValue /></UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="all">All sources</UiSelectItem>
            <UiSelectItem value="store">Store</UiSelectItem>
            <UiSelectItem value="warehouse">Warehouse</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
        <div class="pb-range" :class="{ 'is-set': dateFrom || dateTo }">
          <UiDatePicker v-model="dateFrom" aria-label="From date" placeholder="From date" class="pb-date h-9 w-[150px] shrink-0 max-sm:w-auto max-sm:flex-1 rounded-lg border-0 bg-transparent px-2.5 text-xs shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
          <span class="pb-range-sep" aria-hidden="true" />
          <UiDatePicker v-model="dateTo" aria-label="To date" placeholder="To date" class="pb-date h-9 w-[150px] shrink-0 max-sm:w-auto max-sm:flex-1 rounded-lg border-0 bg-transparent px-2.5 text-xs shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
          <button v-if="dateFrom || dateTo" type="button" aria-label="Clear dates" class="pb-x" @click="dateFrom = ''; dateTo = ''"><XMarkIcon class="pb-ico" aria-hidden="true" /></button>
        </div>
        <button v-if="activeTab !== 'ledger'" type="button" :aria-pressed="attentionOnly" class="pb-attn" :class="{ 'is-on': attentionOnly }" @click="attentionOnly = !attentionOnly">
          <ExclamationTriangleIcon class="pb-ico" aria-hidden="true" />Attention
          <span v-if="attentionCount" class="pb-count pb-count-bad">{{ attentionCount }}</span>
        </button>
      </div>

      <!-- ============ INVOICES ============ -->
      <div v-if="activeTab !== 'ledger' && activeTab !== 'reports'" class="pb-body" :aria-busy="isRefreshing">
        <div v-if="isRefreshing && !payables.length" class="pb-skel" aria-label="Loading payables">
          <span v-for="item in 6" :key="item" />
        </div>
        <div v-else-if="loadError" class="pb-state">
          <h2>Payables could not be loaded</h2>
          <p>{{ loadError }}</p>
          <button type="button" class="pb-btn pb-btn-primary" @click="refresh">Try again</button>
        </div>
        <div v-else-if="!filteredPayables.length" class="pb-state">
          <h2>{{ attentionOnly ? 'No invoices need attention' : hasActiveFilters ? 'No invoices match these filters' : 'No payables in this view' }}</h2>
          <p>{{ attentionOnly ? 'Delayed snapshots and payment mismatches will appear here.' : hasActiveFilters ? 'Try a different search, widen the date range, or clear the filters.' : 'Synced supplier invoices will appear here.' }}</p>
          <button v-if="hasActiveFilters" type="button" class="pb-btn pb-btn-quiet" @click="clearFilters">Clear filters</button>
        </div>
        <div v-else>
          <div v-if="activeTab === 'to_pay' && selectedBatchIds.size" class="pb-bar">
            <p><strong>{{ selectedBatchIds.size }} selected</strong> · {{ formatMoney(selectedBatchTotal) }}</p>
            <div>
              <button type="button" class="pb-btn pb-btn-quiet pb-btn-sm" @click="clearBatchSelection">Clear</button>
              <button type="button" class="pb-btn pb-btn-primary pb-btn-sm" :disabled="selectedBatchIds.size < 2" @click="openBatchPayment"><BanknotesIcon class="pb-ico" aria-hidden="true" />Settle selected</button>
            </div>
          </div>
          <div class="pb-scroll">
            <table class="pb-table">
              <colgroup>
                <col v-if="activeTab === 'to_pay'" style="width: 44px" />
                <col style="width: 12%" /><col style="width: 20%" /><col style="width: 26%" /><col style="width: 13%" /><col style="width: 13%" /><col style="width: 13%" />
                <col v-if="activeTab === 'to_pay'" style="width: 84px" />
              </colgroup>
              <thead>
                <tr>
                  <th v-if="activeTab === 'to_pay'" scope="col" class="pb-c-check">
                    <input type="checkbox" class="pb-check" :checked="allVisibleBatchSelected" :indeterminate="someVisibleBatchSelected" :disabled="batchSelectAllCandidates.length === 0" :title="batchSelectAllCandidates.length ? 'Select all visible invoices from this supplier' : 'Choose a supplier above, or select an invoice first'" :aria-label="batchSelectAllCandidates.length ? 'Select all visible invoices from this supplier' : 'Choose a supplier above, or select an invoice first'" @change="toggleAllVisibleBatch" />
                  </th>
                  <th scope="col">Date</th>
                  <th scope="col">Invoice</th>
                  <th scope="col">Supplier</th>
                  <th scope="col" class="pb-r">Amount</th>
                  <th scope="col" class="pb-r">Paid</th>
                  <th scope="col" class="pb-r">Balance</th>
                  <th v-if="activeTab === 'to_pay'" scope="col"><span class="pb-sr">Pay invoice</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payable in filteredPayables" :key="payable.id" tabindex="0" :aria-label="`Open invoice ${payable.supplierInvoiceNo || payable.invoiceId} from ${payable.supplierName || 'unnamed supplier'}`" :aria-selected="selectedBatchIds.has(payable.id)" :class="{ 'is-sel': selectedBatchIds.has(payable.id) }" @click="openPayable(payable.id)" @keydown.enter="openPayable(payable.id)" @keydown.space.prevent="openPayable(payable.id)">
                  <td v-if="activeTab === 'to_pay'" class="pb-c-check" @click.stop>
                    <input type="checkbox" class="pb-check" :checked="selectedBatchIds.has(payable.id)" :disabled="!canSelectForBatch(payable)" :title="selectedBatchSupplier && selectedBatchSupplier !== payableSupplierKey(payable) ? 'Selecting this invoice starts a new supplier batch' : 'Include in batch payment'" :aria-label="`Select ${payable.supplierInvoiceNo || payable.invoiceId} for batch payment`" @change="toggleBatchSelection(payable)" />
                  </td>
                  <td class="pb-mute pb-nowrap">{{ payableDate(payable) }}</td>
                  <td class="pb-mute pb-cut" :title="payable.supplierInvoiceNo || payable.invoiceId">{{ payable.supplierInvoiceNo || payable.invoiceId }}</td>
                  <td class="pb-strong pb-cut" :title="payable.supplierName || 'Unnamed supplier'">{{ payable.supplierName || 'Unnamed supplier' }}</td>
                  <td class="pb-r pb-mute pb-num">{{ formatTableAmount(payable.invoiceAmountPesewas) }}</td>
                  <td class="pb-r pb-mute pb-num">{{ Number(payable.amountPaidPesewas) ? formatTableAmount(payable.amountPaidPesewas) : '—' }}</td>
                  <td class="pb-r pb-bal pb-num">{{ formatTableAmount(payable.balancePesewas) }}</td>
                  <td v-if="activeTab === 'to_pay'" class="pb-r"><button v-if="canPay(payable)" type="button" class="pb-btn pb-btn-quiet pb-btn-sm" @click.stop="openPaymentFor(payable.id)">Pay</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pb-list">
            <div v-for="payable in filteredPayables" :key="payable.id" role="button" tabindex="0" class="pb-item" :class="{ 'is-sel': selectedBatchIds.has(payable.id) }" @click="openPayable(payable.id)" @keydown.enter="openPayable(payable.id)" @keydown.space.prevent="openPayable(payable.id)">
              <div class="pb-item-top">
                <input v-if="activeTab === 'to_pay'" type="checkbox" class="pb-check" :checked="selectedBatchIds.has(payable.id)" :disabled="!canSelectForBatch(payable)" :aria-label="`Select ${payable.supplierInvoiceNo || payable.invoiceId} for batch payment`" @click.stop @change="toggleBatchSelection(payable)" />
                <div class="pb-item-main">
                  <p class="pb-strong pb-trunc">{{ payable.supplierName || 'Unnamed supplier' }}</p>
                  <p class="pb-mute pb-trunc">{{ payable.supplierInvoiceNo || payable.invoiceId }} · {{ payableDate(payable) }}</p>
                </div>
                <strong class="pb-num">{{ formatTableAmount(payable.balancePesewas) }}</strong>
              </div>
              <div class="pb-item-sub">
                <span>Amount <b>{{ formatTableAmount(payable.invoiceAmountPesewas) }}</b></span>
                <span>Paid <b>{{ Number(payable.amountPaidPesewas) ? formatTableAmount(payable.amountPaidPesewas) : '—' }}</b></span>
                <button v-if="activeTab === 'to_pay' && canPay(payable)" type="button" class="pb-btn pb-btn-quiet pb-btn-sm" @click.stop="openPaymentFor(payable.id)">Pay</button>
              </div>
            </div>
          </div>
          <p v-if="activeTab === 'to_pay'" class="pb-foot">To settle several invoices at once, choose a supplier, then tick the invoices to include.</p>
        </div>
        <div v-if="isRefreshing && payables.length" class="pb-busy"><span><ArrowPathIcon class="pb-ico pb-spin" aria-hidden="true" />Loading</span></div>
      </div>

      <!-- ============ REPORTS ============ -->
      <PayablesReportsPanel v-else-if="activeTab === 'reports'" />

      <!-- ============ LEDGER ============ -->
      <div v-else-if="activeTab === 'ledger'" class="pb-body" :aria-busy="isRefreshing">
        <div v-if="isRefreshing && !payableLedgerEntries.length" class="pb-skel" aria-label="Loading payment ledger">
          <span v-for="item in 6" :key="item" />
        </div>
        <div v-else-if="loadError" class="pb-state">
          <h2>The payment ledger could not be loaded</h2>
          <p>{{ loadError }}</p>
          <button type="button" class="pb-btn pb-btn-primary" @click="refresh">Try again</button>
        </div>
        <div v-else-if="!payableLedgerEntries.length" class="pb-state">
          <h2>No supplier payments yet</h2>
          <p>Payments posted against supplier invoices appear here with the account used.</p>
        </div>
        <div v-else>
          <div class="pb-sub">
            <span>Balance is the invoice balance after that payment.</span>
            <span><strong>{{ formatMoney(payableLedgerSummary.totalPaid) }}</strong> paid in this view</span>
          </div>
          <div class="pb-scroll">
            <table class="pb-table">
              <colgroup><col style="width: 12%" /><col style="width: 18%" /><col style="width: 22%" /><col style="width: 16%" /><col style="width: 14%" /><col style="width: 9%" /><col style="width: 9%" /></colgroup>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Invoice</th>
                  <th scope="col">Supplier</th>
                  <th scope="col">Paid from</th>
                  <th scope="col" title="Staff member who recorded the payment">Recorded by</th>
                  <th scope="col" class="pb-r">Payment</th>
                  <th scope="col" class="pb-r">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in payableLedgerEntries" :key="entry.id" tabindex="0" :aria-label="`Open payment details for ${entry.supplierInvoiceNo || entry.invoiceId || 'supplier invoice'}`" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
                  <td class="pb-mute pb-nowrap">{{ payableLedgerDate(entry.date) }}</td>
                  <td class="pb-mute pb-cut" :title="entry.supplierInvoiceNo || entry.invoiceId || entry.reference">{{ entry.supplierInvoiceNo || entry.invoiceId || entry.reference }}</td>
                  <td class="pb-strong pb-cut" :title="entry.supplierName || 'Supplier payment'">{{ entry.supplierName || 'Supplier payment' }}</td>
                  <td class="pb-mute pb-cut" :title="entry.accountName || entry.paymentMethod || 'Payment method'">{{ entry.accountName || entry.paymentMethod || 'Payment method' }}</td>
                  <td class="pb-mute pb-cut" :title="entry.enteredBy || 'Not recorded'">{{ entry.enteredBy || 'Not recorded' }}</td>
                  <td class="pb-r pb-bal pb-num">{{ formatMoney(entry.paidAmount) }}</td>
                  <td class="pb-r pb-mute pb-num">{{ formatMoney(entry.balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pb-list">
            <div v-for="entry in payableLedgerEntries" :key="`mobile-ledger-${entry.id}`" role="button" tabindex="0" class="pb-item" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
              <div class="pb-item-top">
                <div class="pb-item-main">
                  <p class="pb-strong pb-trunc">{{ entry.supplierName || 'Supplier payment' }}</p>
                  <p class="pb-mute pb-trunc">{{ entry.supplierInvoiceNo || entry.invoiceId || entry.reference }} · {{ payableLedgerDate(entry.date) }}</p>
                </div>
                <strong class="pb-num">{{ formatMoney(entry.paidAmount) }}</strong>
              </div>
              <div class="pb-item-sub">
                <span>From <b>{{ entry.accountName || entry.paymentMethod || 'Payment method' }}</b></span>
                <span>Balance <b>{{ formatMoney(entry.balance) }}</b></span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isRefreshing && payableLedgerEntries.length" class="pb-busy"><span><ArrowPathIcon class="pb-ico pb-spin" aria-hidden="true" />Loading</span></div>
      </div>

      <!-- Pagination -->
      <div v-if="activeTab !== 'reports' && activePagination.total > 0" class="pb-pager">
        <p>{{ pageStart }}–{{ pageEnd }} of {{ activePagination.total }} {{ activeTab === 'ledger' ? 'payments' : 'invoices' }}</p>
        <div>
          <button type="button" class="pb-btn pb-btn-quiet pb-btn-sm" :disabled="currentPage <= 1 || isRefreshing" aria-label="Previous page" @click="goToPage(currentPage - 1)">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button type="button" class="pb-btn pb-btn-quiet pb-btn-sm" :disabled="!activePagination.hasNext || isRefreshing" aria-label="Next page" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </section>

    <!-- ============ DETAIL DIALOG ============ -->
    <UiDialog v-model:open="detailOpen">
      <UiDialogContent v-if="detailOpen && selectedPayable" class="pb-dlg pb-dlg-md !flex !flex-col !gap-0 !p-0 !border-0">
        <header class="pb-dlg-head">
          <div class="pb-dlg-headrow">
            <div class="pb-minw">
              <UiDialogTitle class="pb-dlg-title">{{ selectedPayable.supplierName || 'Supplier invoice' }}</UiDialogTitle>
              <UiDialogDescription class="pb-dlg-sub">Invoice {{ selectedPayable.supplierInvoiceNo || selectedPayable.invoiceId }}</UiDialogDescription>
            </div>
            <span class="pb-tag" :class="statusStyle(selectedPayable)"><i aria-hidden="true" />{{ statusLabel(selectedPayable) }}</span>
          </div>
        </header>
        <div class="pb-dlg-body pb-dlg-scroll">
          <dl class="pb-kv">
            <div><dt>Invoice total</dt><dd>{{ formatPesewas(selectedPayable.invoiceAmountPesewas) }}</dd></div>
            <div><dt>Paid to date</dt><dd>{{ Number(selectedPayable.amountPaidPesewas) ? `−${formatPesewas(selectedPayable.amountPaidPesewas)}` : '—' }}</dd></div>
            <div class="pb-kv-total"><dt>{{ lifecycle(selectedPayable) === 'to_pay' ? 'Balance owing' : 'Balance' }}</dt><dd>{{ formatPesewas(selectedPayable.balancePesewas) }}</dd></div>
          </dl>
          <dl class="pb-kv pb-kv-soft">
            <div><dt>Invoice date</dt><dd>{{ payableDate(selectedPayable) }}</dd></div>
            <div>
              <dt>Due date</dt>
              <dd :class="{ 'is-bad': detailOverdue, 'is-none': !selectedPayable.dueDate }">
                {{ selectedPayable.dueDate ? payableLedgerDate(selectedPayable.dueDate) : '' }}<template v-if="detailOverdue"> · overdue</template><template v-else-if="!selectedPayable.dueDate">Not provided</template>
              </dd>
            </div>
            <div><dt>Source</dt><dd>{{ selectedPayable.source === 'warehouse' ? 'Warehouse' : 'Store' }}</dd></div>
          </dl>
          <div v-if="lifecycle(selectedPayable) !== 'to_pay'" class="pb-note" :class="payableStatusSummary(selectedPayable).className">
            <p>{{ payableStatusSummary(selectedPayable).title }}</p>
            <span>{{ payableStatusSummary(selectedPayable).description }}</span>
          </div>
        </div>
        <footer class="pb-dlg-foot">
          <span class="pb-dlg-meta" />
          <div class="pb-dlg-actions">
            <button type="button" class="pb-btn pb-btn-quiet" @click="detailOpen = false">Close</button>
            <button v-if="canPay(selectedPayable)" type="button" class="pb-btn pb-btn-primary" @click="openPayment"><BanknotesIcon class="pb-ico" aria-hidden="true" />Pay</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>

    <!-- ============ LEDGER PAYMENT DETAIL DIALOG ============ -->
    <UiDialog v-model:open="ledgerDetailOpen">
      <UiDialogContent v-if="ledgerDetailOpen && selectedLedgerEntry" class="pb-dlg pb-dlg-md !flex !flex-col !gap-0 !p-0 !border-0">
        <header class="pb-dlg-head">
          <div class="pb-dlg-headrow">
            <div class="pb-minw">
              <UiDialogTitle class="pb-dlg-title">{{ selectedLedgerEntry.supplierName || 'Supplier payment' }}</UiDialogTitle>
              <UiDialogDescription class="pb-dlg-sub">{{ selectedLedgerEntry.supplierInvoiceNo || selectedLedgerEntry.invoiceId || selectedLedgerEntry.reference }}</UiDialogDescription>
            </div>
            <p class="pb-dlg-amt">{{ formatMoney(selectedLedgerEntry.paidAmount) }}</p>
          </div>
        </header>
        <div class="pb-dlg-body pb-dlg-scroll">
          <dl class="pb-kv">
            <div><dt>Paid from</dt><dd>{{ ledgerFundingLabel(selectedLedgerEntry) }}</dd></div>
            <div><dt>Payment method</dt><dd>{{ ledgerMethodLabel(selectedLedgerEntry) }}</dd></div>
            <div v-if="ledgerSubtypeLabel(selectedLedgerEntry)"><dt>Type</dt><dd>{{ ledgerSubtypeLabel(selectedLedgerEntry) }}</dd></div>
            <div><dt>Invoice balance after</dt><dd class="is-strong">{{ formatMoney(selectedLedgerEntry.balance) }}</dd></div>
            <div><dt>Paid on</dt><dd>{{ payableLedgerDate(selectedLedgerEntry.date) }}</dd></div>
          </dl>
          <div v-if="selectedLedgerEntry.paymentContext?.fields?.length">
            <p class="pb-kv-head">Payment details</p>
            <dl class="pb-kv pb-kv-soft">
              <div v-for="field in selectedLedgerEntry.paymentContext?.fields || []" :key="field.key"><dt>{{ field.label }}</dt><dd class="pb-cut" :title="field.value">{{ field.value }}</dd></div>
            </dl>
          </div>
          <dl class="pb-kv pb-kv-soft">
            <div><dt>Reference</dt><dd class="pb-cut" :class="{ 'is-none': !selectedLedgerEntry.reference }" :title="selectedLedgerEntry.reference">{{ selectedLedgerEntry.reference || 'Not provided' }}</dd></div>
            <div v-if="selectedLedgerEntry.description"><dt>Note</dt><dd class="pb-cut" :title="selectedLedgerEntry.description">{{ selectedLedgerEntry.description }}</dd></div>
            <div><dt>Recorded by</dt><dd>{{ selectedLedgerEntry.enteredBy || 'Not recorded' }}</dd></div>
            <div v-if="selectedLedgerEntry.batchId"><dt>Batch</dt><dd class="pb-cut" :title="selectedLedgerEntry.batchId">{{ selectedLedgerEntry.batchId }}</dd></div>
          </dl>
          <div class="pb-note">
            <p>{{ ledgerSyncLabel(selectedLedgerEntry) }}</p>
            <span>This payment stays linked to the supplier invoice and its Accounts record.</span>
          </div>
        </div>
        <footer class="pb-dlg-foot">
          <span class="pb-dlg-meta" />
          <div class="pb-dlg-actions"><button type="button" class="pb-btn pb-btn-quiet" @click="ledgerDetailOpen = false">Close</button></div>
        </footer>
      </UiDialogContent>
    </UiDialog>

    <!-- ============ PAYMENT DIALOG ============ -->
    <UiDialog v-model:open="paymentOpen">
      <UiDialogContent v-if="paymentOpen && selectedPayable" class="pb-dlg pb-dlg-md !flex !flex-col !gap-0 !p-0 !border-0">
        <header class="pb-dlg-head">
          <div class="pb-dlg-headrow">
            <div class="pb-minw">
              <UiDialogTitle class="pb-dlg-title">Pay {{ selectedPayable.supplierName || 'supplier' }}</UiDialogTitle>
              <UiDialogDescription class="pb-dlg-sub">{{ selectedPayable.supplierInvoiceNo || selectedPayable.invoiceId }} · {{ formatPesewas(selectedPayable.balancePesewas) }} outstanding</UiDialogDescription>
            </div>
            <p class="pb-dlg-amt">{{ formatMoney(Number(paymentAmount) || 0) }}</p>
          </div>
        </header>
        <div class="pb-dlg-body pb-dlg-scroll">
          <div class="pb-row-between">
            <div class="pb-seg" role="group" aria-label="Payment source">
              <button type="button" class="pb-seg-btn" :class="{ 'is-on': paymentMode === 'account' }" @click="setPaymentMode('account')">From account</button>
              <button type="button" class="pb-seg-btn" :class="{ 'is-on': paymentMode === 'method' }" @click="setPaymentMode('method')">Method only</button>
            </div>
            <button type="button" class="pb-link" @click="paymentAmount = (amount(selectedPayable) / 100).toFixed(2)">Full balance</button>
          </div>

          <div class="pb-grid pb-grid-pay">
            <div class="pb-field">
              <label v-if="paymentMode === 'account'" for="payable-account" class="pb-lbl">From account</label>
              <label v-else for="payable-method" class="pb-lbl">Payment method</label>
              <UiSelect v-if="paymentMode === 'account'" v-model="paymentAccountId">
                <UiSelectTrigger id="payable-account" class="pb-in pb-sel"><UiSelectValue placeholder="Choose account" /></UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }} · {{ formatMoney(account.currentBalance) }}</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <UiSelect v-else v-model="paymentMethod">
                <UiSelectTrigger id="payable-method" class="pb-in pb-sel"><UiSelectValue placeholder="Choose method" /></UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">{{ method.name }}</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <p v-if="paymentAttempted && paymentErrorFor('account')" class="pb-err">{{ paymentErrorFor('account') }}</p>
              <p v-else-if="paymentAttempted && paymentMode === 'method' && paymentErrorFor('method')" class="pb-err">{{ paymentErrorFor('method') }}</p>
              <p v-else-if="paymentMode === 'account' && balanceAfterPayment !== null && balanceAfterPayment >= 0" class="pb-hint">Balance after <b>{{ formatMoney(balanceAfterPayment) }}</b></p>
            </div>
            <div class="pb-field">
              <label for="payable-amount" class="pb-lbl">Amount</label>
              <div class="pb-prefix">
                <span aria-hidden="true">GH₵</span>
                <UiInput id="payable-amount" v-model="paymentAmount" inputmode="decimal" autocomplete="off" class="pb-in pb-in-num" placeholder="0.00" />
              </div>
              <p v-if="paymentErrorFor('amount')" class="pb-err">{{ paymentErrorFor('amount') }}</p>
            </div>
          </div>

          <div v-if="paymentMode === 'account'" class="pb-optrow">
            <div class="pb-minw">
              <p class="pb-lbl">How was the supplier paid? <span class="pb-opt-tag">optional</span></p>
              <p class="pb-hint">Adds an audit detail without changing the account source.</p>
            </div>
            <UiSelect v-model="paymentMethod">
              <UiSelectTrigger id="payable-account-method" class="pb-in pb-sel pb-w-method"><UiSelectValue placeholder="Add method" /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">{{ method.name }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <p v-if="paymentMode === 'method'" class="pb-hint">Records the payment without changing an Accounts balance.</p>
          <p v-if="!syncedPaymentMethods.length" class="pb-hint">Payment methods load from RigelOS after sync. Credit Payment stays available for customer-credit settlements.</p>

          <button v-if="!paymentDetailsOpen" type="button" class="pb-btn pb-btn-quiet pb-btn-sm pb-self-start" @click="paymentDetailsOpen = true">{{ paymentDetailsLabel }}</button>
          <div v-else class="pb-details">
            <div class="pb-row-between">
              <p class="pb-lbl">{{ selectedPaymentMethod ? `${selectedPaymentMethod.name} details` : 'Payment details' }}</p>
              <button type="button" class="pb-link" @click="paymentDetailsOpen = false">Hide</button>
            </div>
            <div class="pb-grid pb-grid-2">
              <div v-if="paymentMethodSubtypes.length" class="pb-field pb-span2">
                <label for="payable-method-subtype" class="pb-lbl">Type</label>
                <UiSelect v-model="paymentMethodSubtypeId">
                  <UiSelectTrigger id="payable-method-subtype" class="pb-in pb-sel"><UiSelectValue placeholder="Choose type" /></UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="subtype in paymentMethodSubtypes" :key="subtype.id" :value="subtype.id">{{ subtype.name }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <p v-if="paymentAttempted && !paymentMethodSubtypeId" class="pb-err">Choose a type for this payment method.</p>
              </div>
              <div v-for="field in currentPaymentDetailFields" :key="field.key" class="pb-field">
                <label :for="`payable-detail-${field.key}`" class="pb-lbl">{{ field.label }} <span v-if="field.required" class="pb-opt-tag">required</span></label>
                <UiInput :id="`payable-detail-${field.key}`" v-model="paymentDetailValues[field.key]" :type="field.type" class="pb-in" :placeholder="field.placeholder" />
                <p v-if="paymentAttempted && field.required && !String(paymentDetailValues[field.key] || '').trim()" class="pb-err">{{ field.label }} is required.</p>
              </div>
              <div class="pb-field" :class="{ 'pb-span2': !currentPaymentDetailFields.length }">
                <label for="payable-notes" class="pb-lbl">Note <span class="pb-opt-tag">optional</span></label>
                <UiInput id="payable-notes" v-model="paymentNotes" class="pb-in" placeholder="Optional note" />
              </div>
            </div>
          </div>
        </div>
        <p v-if="paymentSubmitError" class="pb-dlg-error" role="alert">{{ paymentSubmitError }}</p>
        <footer class="pb-dlg-foot">
          <span class="pb-dlg-meta" />
          <div class="pb-dlg-actions">
            <button type="button" class="pb-btn pb-btn-quiet" @click="paymentOpen = false">Cancel</button>
            <button type="button" class="pb-btn pb-btn-primary" :disabled="isSaving" @click="submitPayment">{{ isSaving ? 'Posting…' : 'Post payment' }}</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>

    <!-- ============ BATCH PAYMENT DIALOG ============ -->
    <UiDialog v-model:open="batchOpen">
      <UiDialogContent v-if="batchOpen" class="pb-dlg pb-dlg-lg pb-dlg-tall !flex !flex-col !gap-0 !p-0 !border-0">
        <header class="pb-dlg-head">
          <div class="pb-dlg-headrow">
            <div class="pb-minw">
              <UiDialogTitle class="pb-dlg-title">Pay {{ selectedBatchSupplierName || 'supplier' }}</UiDialogTitle>
              <UiDialogDescription class="pb-dlg-sub">{{ selectedBatchPayables.length }} invoice{{ selectedBatchPayables.length === 1 ? '' : 's' }} · applied to the oldest due first</UiDialogDescription>
            </div>
            <p class="pb-dlg-amt">{{ formatMoney(batchAmountValue) }}</p>
          </div>
        </header>

        <div class="pb-dlg-scroll pb-batch-scroll">
          <div class="pb-dlg-body pb-batch-form">
            <div class="pb-grid pb-grid-batch">
              <div class="pb-field">
                <label for="batch-account" class="pb-lbl">From account</label>
                <UiSelect v-model="batchAccountId">
                  <UiSelectTrigger id="batch-account" class="pb-in pb-sel"><UiSelectValue placeholder="Choose account" /></UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }} · {{ formatMoney(account.currentBalance) }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <p v-if="batchAttempted && !batchAccountId" class="pb-err">Choose an account</p>
              </div>
              <div class="pb-field">
                <div class="pb-row-between">
                  <label for="batch-amount" class="pb-lbl">Amount</label>
                  <button type="button" class="pb-link" @click="batchAmount = selectedBatchTotal.toFixed(2)">Full total</button>
                </div>
                <div class="pb-prefix">
                  <span aria-hidden="true">GH₵</span>
                  <UiInput id="batch-amount" v-model="batchAmount" type="number" min="0.01" step="0.01" inputmode="decimal" autocomplete="off" class="pb-in pb-in-num" placeholder="0.00" />
                </div>
                <p v-if="batchAmountError" class="pb-err">{{ batchAmountError }}</p>
              </div>
              <button type="button" class="pb-btn pb-btn-quiet pb-self-end" :aria-expanded="batchDetailsOpen" @click.stop.prevent="toggleBatchDetails">{{ batchDetailsOpen ? 'Hide details' : 'Add details' }}</button>
            </div>
            <div v-if="batchDetailsOpen" class="pb-grid pb-grid-2 pb-details">
              <div class="pb-field">
                <label for="batch-method" class="pb-lbl">Payment method <span class="pb-opt-tag">optional</span></label>
                <UiSelect v-model="batchPaymentMethod">
                  <UiSelectTrigger id="batch-method" class="pb-in pb-sel"><UiSelectValue placeholder="Add method" /></UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">{{ method.name }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div v-if="batchPaymentMethodSubtypes.length" class="pb-field">
                <label for="batch-method-subtype" class="pb-lbl">Type</label>
                <UiSelect v-model="batchPaymentMethodSubtypeId">
                  <UiSelectTrigger id="batch-method-subtype" class="pb-in pb-sel"><UiSelectValue placeholder="Choose type" /></UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="subtype in batchPaymentMethodSubtypes" :key="subtype.id" :value="subtype.id">{{ subtype.name }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div v-for="field in currentBatchPaymentDetailFields" :key="field.key" class="pb-field">
                <label :for="`batch-detail-${field.key}`" class="pb-lbl">{{ field.label }} <span v-if="field.required" class="pb-opt-tag">required</span></label>
                <UiInput :id="`batch-detail-${field.key}`" v-model="batchPaymentDetailValues[field.key]" :type="field.type" class="pb-in" :placeholder="field.placeholder" />
                <p v-if="batchAttempted && field.required && !String(batchPaymentDetailValues[field.key] || '').trim()" class="pb-err">{{ field.label }} is required.</p>
              </div>
              <div class="pb-field">
                <label for="batch-reference" class="pb-lbl">Reference <span class="pb-opt-tag">optional</span></label>
                <UiInput id="batch-reference" v-model="batchReference" class="pb-in" placeholder="Optional" />
              </div>
              <div class="pb-field">
                <label for="batch-description" class="pb-lbl">Note <span class="pb-opt-tag">optional</span></label>
                <UiInput id="batch-description" v-model="batchDescription" class="pb-in" placeholder="Optional" />
              </div>
            </div>
            <p v-if="batchUnappliedPesewas > 0" class="pb-warn">{{ formatMoney(batchUnappliedPesewas / 100) }} will remain unapplied.</p>
          </div>

          <table class="pb-btable">
            <thead>
              <tr>
                <th style="width: 34%">Invoice</th>
                <th class="pb-r" style="width: 16%">Due</th>
                <th class="pb-r" style="width: 18%">Balance</th>
                <th class="pb-r" style="width: 16%">Applied</th>
                <th class="pb-r" style="width: 16%">Remaining</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in batchAllocationRows" :key="row.payable.id">
                <td class="pb-strong pb-cut" :title="row.payable.supplierInvoiceNo || row.payable.invoiceId">{{ row.payable.supplierInvoiceNo || row.payable.invoiceId }}</td>
                <td class="pb-r pb-mute pb-num">{{ row.payable.dueDate ? payableLedgerDate(row.payable.dueDate) : '—' }}</td>
                <td class="pb-r pb-mute pb-num">{{ formatMoney(row.balancePesewas / 100) }}</td>
                <td class="pb-r pb-bal pb-num">{{ formatMoney(row.allocationPesewas / 100) }}</td>
                <td class="pb-r pb-num">
                  <span v-if="!row.afterPesewas" class="pb-settled"><CheckIcon class="pb-ico" aria-hidden="true" />Settled</span>
                  <span v-else class="pb-mute">{{ formatMoney(row.afterPesewas / 100) }}</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td />
                <td class="pb-r pb-num">{{ formatMoney(selectedBatchTotalPesewas / 100) }}</td>
                <td class="pb-r pb-num pb-bal">{{ formatMoney(batchAllocatedTotalPesewas / 100) }}</td>
                <td class="pb-r pb-num">{{ formatMoney(Math.max(0, selectedBatchTotalPesewas - batchAllocatedTotalPesewas) / 100) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p v-if="batchSubmitError" class="pb-dlg-error" role="alert">{{ batchSubmitError }}</p>
        <footer class="pb-dlg-foot">
          <span class="pb-dlg-meta"><template v-if="selectedBatchAccount && batchAccountId">{{ selectedBatchAccount.name }} balance after <b :class="{ 'is-neg': selectedBatchAccountAfter !== null && selectedBatchAccountAfter < 0 }">{{ formatMoney(selectedBatchAccountAfter || 0) }}</b></template></span>
          <div class="pb-dlg-actions">
            <button type="button" class="pb-btn pb-btn-quiet" @click="batchOpen = false">Cancel</button>
            <button type="button" class="pb-btn pb-btn-primary" :disabled="isSaving" @click="submitBatchPayment">{{ isSaving ? 'Posting…' : 'Post payment' }}</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>

    <!-- ============ CONFIRM DIALOG ============ -->
    <UiDialog v-model:open="confirmOpen" data-print-hide>
      <UiDialogContent v-if="confirmOpen && confirmDetails" :close-disabled="isConfirming" class="pb-dlg pb-dlg-sm !flex !flex-col !gap-0 !p-0 !border-0">
        <div class="pb-dlg-body pb-center">
          <UiDialogTitle class="pb-dlg-title">{{ confirmDetails?.title }}</UiDialogTitle>
          <p v-if="confirmDetails?.amount" class="pb-big">{{ formatMoney(confirmDetails.amount) }}</p>
          <UiDialogDescription class="pb-dlg-sub pb-wrap">{{ confirmDetails?.message }}</UiDialogDescription>
        </div>
        <footer class="pb-dlg-foot">
          <span class="pb-dlg-meta" />
          <div class="pb-dlg-actions">
            <button type="button" :disabled="isConfirming" class="pb-btn pb-btn-quiet" @click="cancelConfirm">Cancel</button>
            <button type="button" :disabled="isConfirming" class="pb-btn pb-btn-primary" @click="runConfirm">{{ isConfirming ? 'Posting…' : (confirmDetails?.confirmLabel || 'Confirm') }}</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>

    <!-- ============ SUCCESS DIALOG ============ -->
    <UiDialog v-model:open="successOpen" data-print-hide>
      <UiDialogContent v-if="successOpen && successDetails" class="pb-dlg pb-dlg-sm !flex !flex-col !gap-0 !p-0 !border-0">
        <div class="pb-dlg-body pb-center">
          <span class="pb-tick" aria-hidden="true"><CheckIcon class="pb-ico" /></span>
          <UiDialogTitle class="pb-dlg-title">{{ successDetails?.title }}</UiDialogTitle>
          <p v-if="successDetails?.amount" class="pb-big">{{ formatMoney(successDetails.amount) }}</p>
          <UiDialogDescription class="pb-dlg-sub pb-wrap">{{ successDetails?.message }}</UiDialogDescription>
        </div>
        <footer class="pb-dlg-foot">
          <span class="pb-dlg-meta" />
          <div class="pb-dlg-actions">
            <button type="button" class="pb-btn pb-btn-quiet" @click="dismissSuccess">Close</button>
            <button type="button" class="pb-btn pb-btn-primary" @click="viewLedgerFromSuccess">View ledger</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowPathIcon, BanknotesIcon, BellIcon, CheckIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { PayableLedgerEntry, PayablePaymentContextInput, PayablePaymentMethod, PayableSummary, PaymentMethodSubtype, PaymentMethodSummary } from '~/services/types'
import { useAccountsWorkbench } from '~/composables/useAccountsWorkbench'
import { payableAmount, payableLifecycle, type PayableTab } from '~/utils/payables'
import { paymentDetailFields, type PaymentDetailDefinition } from '~/utils/payablePaymentDetails'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
  pageTransition: false,
  scrollToTop: false,
})

const route = useRoute()
const router = useRouter()
const pharmacy = computed(() => String(route.params.pharmacy || ''))
const accountsPath = computed(() => `/${pharmacy.value}/services/accounts`)
const reportsPath = computed(() => `/${pharmacy.value}/services/accounts/payables/reports`)
const { accounts, formatMoney, isSaving, loadAccounts, loadPayableLedger, loadPayableSuppliers, loadPayables, loadPendingPayables, payables, pendingPayables, pendingPayableCount, pendingPayableTotalPesewas, isLoadingPendingPayables, payableCounts, payableSummary, payableSuppliers, payableLedgerEntries, payableLedgerPagination, payableLedgerSummary, payablesPagination, postMoneyOut, postPayableMethodPayment, postPayablePaymentBatch, paymentMethods: syncedPaymentMethods, loadPaymentMethods } = useAccountsWorkbench()

const activeTab = ref<PayableTab>('to_pay')
const searchQuery = ref('')
const supplierFilter = ref('all')
const sourceFilter = ref<'all' | 'store' | 'warehouse'>('all')
const attentionOnly = ref(false)
const dateField = ref<'invoice' | 'due' | 'synced' | 'payment'>('invoice')
const dateFrom = ref('')
const dateTo = ref('')
const pageSize = 50
const currentPage = ref(1)
const isRefreshing = ref(false)
const syncPanelOpen = ref(false)
const syncBellRef = ref<HTMLElement | null>(null)
const handleSyncClickOutside = (event: PointerEvent) => {
  if (syncPanelOpen.value && syncBellRef.value && !syncBellRef.value.contains(event.target as Node)) syncPanelOpen.value = false
}
let pageRequestId = 0
let syncReminderTimer: ReturnType<typeof setInterval> | undefined
const loadError = ref('')
const selectedPayableId = ref('')
const detailOpen = ref(false)
const selectedLedgerEntry = ref<PayableLedgerEntry | null>(null)
const ledgerDetailOpen = ref(false)
const paymentOpen = ref(false)
const paymentMode = ref<'account' | 'method'>('account')
const paymentMethod = ref<PayablePaymentMethod>('')
const paymentAccountId = ref('')
const paymentAmount = ref('')
const paymentNotes = ref('')
const paymentSubmitError = ref('')
const paymentAttempted = ref(false)
const paymentDetailsOpen = ref(false)
const paymentMethodId = ref('')
const paymentMethodSubtypeId = ref('')
const paymentDetailValues = ref<Record<string, string>>({})
type PayableConfirmation = { title: string, message: string, confirmLabel: string, amount?: number }
const confirmOpen = ref(false)
const confirmDetails = ref<PayableConfirmation | null>(null)
type PayableSuccess = { title: string, message: string, amount?: number }
const pendingConfirmAction = ref<(() => Promise<PayableSuccess | false>) | null>(null)
const confirmOrigin = ref<'payment' | 'batch' | null>(null)
const isConfirming = ref(false)
const successOpen = ref(false)
const successDetails = ref<PayableSuccess | null>(null)
const showSuccess = (details: PayableSuccess) => {
  successDetails.value = details
  successOpen.value = true
}
const dismissSuccess = () => {
  successOpen.value = false
  successDetails.value = null
}
const viewLedgerFromSuccess = () => {
  dismissSuccess()
  setActiveTab('ledger')
}
// One UUID per payment intent: minted when the dialog opens, resent
// unchanged on every submit so a retry after a network error cannot
// queue two payments for one click-through.
const paymentIdempotencyKey = ref('')
const batchOpen = ref(false)
const batchAccountId = ref('')
const batchAmount = ref<string | number>('')
const batchPaymentMethod = ref('')
const batchReference = ref('')
const batchDescription = ref('')
const batchSubmitError = ref('')
const batchAttempted = ref(false)
const batchDetailsOpen = ref(false)
const batchPaymentMethodId = ref('')
const batchPaymentMethodSubtypeId = ref('')
const batchPaymentDetailValues = ref<Record<string, string>>({})
const batchIdempotencyKey = ref('')
const selectedBatchIds = ref<Set<string>>(new Set())

const switchWorkspace = async (path: string) => {
  if (route.path === path) return
  const scrollContainer = document.querySelector<HTMLElement>('.page-content')
  const scrollTop = scrollContainer?.scrollTop ?? 0
  await router.push(path)
  await nextTick()
  if (!scrollContainer) return
  scrollContainer.scrollTop = scrollTop
  window.requestAnimationFrame(() => { scrollContainer.scrollTop = scrollTop })
}

const lifecycle = payableLifecycle
const amount = payableAmount
const toPay = computed(() => payableCounts.value.toPay)
const attentionCount = computed(() => payableCounts.value.attention)
const pendingSyncCount = computed(() => pendingPayableCount.value)
const pendingSyncTotalPesewas = computed(() => pendingPayableTotalPesewas.value)
const pendingSyncItems = computed(() => pendingPayables.value)
const pendingSyncNeedsActionCount = computed(() => pendingSyncItems.value.filter((payable) => ['pending', 'leased'].includes(payable.paymentActionStatus || '')).length)
const syncQueueState = computed<'idle' | 'action' | 'confirming'>(() => {
  if (!pendingSyncCount.value) return 'idle'
  return pendingSyncNeedsActionCount.value ? 'action' : 'confirming'
})
const showSyncBadge = computed(() => pendingSyncCount.value > 0)
const tabs = computed(() => [
  { value: 'to_pay' as const, label: 'To pay', count: toPay.value },
  { value: 'awaiting' as const, label: 'Awaiting sync', count: payableCounts.value.awaiting },
  { value: 'settled' as const, label: 'Settled', count: payableCounts.value.settled },
  { value: 'ledger' as const, label: 'Ledger', count: payableLedgerPagination.value.total },
  { value: 'reports' as const, label: 'Reports', count: null as number | null },
])
const activePagination = computed(() => activeTab.value === 'ledger' ? payableLedgerPagination.value : payablesPagination.value)
const filteredPayables = computed(() => payables.value)
const supplierOptionValue = (supplier: { supplierId: string; supplierName: string }) => supplier.supplierId || supplier.supplierName
const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim()) || supplierFilter.value !== 'all' || sourceFilter.value !== 'all' || Boolean(dateFrom.value) || Boolean(dateTo.value) || attentionOnly.value)
const outstandingAmount = computed(() => payableSummary.value.outstandingPesewas)
const overdueAmount = computed(() => payableSummary.value.overduePesewas)
const dueThisWeekAmount = computed(() => payableSummary.value.dueThisWeekPesewas)
const payablesTotalPages = computed(() => Math.max(1, Math.ceil(payablesPagination.value.total / pageSize)))
const ledgerTotalPages = computed(() => Math.max(1, Math.ceil(payableLedgerPagination.value.total / pageSize)))
const totalPages = computed(() => activeTab.value === 'ledger' ? ledgerTotalPages.value : payablesTotalPages.value)
const pageStart = computed(() => activePagination.value.total ? ((currentPage.value - 1) * pageSize) + 1 : 0)
let paymentHandoffToken = 0
const pageEnd = computed(() => activePagination.value.total ? Math.min(currentPage.value * pageSize, activePagination.value.total) : 0)
const selectedPayable = computed(() => payables.value.find((payable) => payable.id === selectedPayableId.value) || null)
const activeAccounts = computed(() => accounts.value.filter((account) => account.status === 'active' && account.type !== 'loan'))
const selectedBatchTotalPesewas = computed(() => [...selectedBatchIds.value].reduce((sum, id) => {
  const payable = payables.value.find((item) => item.id === id)
  return sum + (payable ? amount(payable) : 0)
}, 0))
const selectedBatchTotal = computed(() => selectedBatchTotalPesewas.value / 100)
const selectedBatchPayables = computed(() => filteredPayables.value.filter((payable) => selectedBatchIds.value.has(payable.id)))
const selectedBatchSupplier = computed(() => {
  const payable = payables.value.find((item) => selectedBatchIds.value.has(item.id))
  return payable ? payableSupplierKey(payable) : ''
})
const selectedBatchSupplierName = computed(() => {
  const payable = payables.value.find((item) => selectedBatchIds.value.has(item.id))
  return payable?.supplierName || ''
})
const selectedBatchAccount = computed(() => activeAccounts.value.find((account) => account.id === batchAccountId.value) || null)
const batchAmountPesewas = computed(() => {
  const numeric = Number(batchAmount.value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return Math.round(numeric * 100)
})
const batchAmountValue = computed(() => batchAmountPesewas.value / 100)
const batchAllocationDate = (payable: PayableSummary) => {
  const value = payable.dueDate || payable.invoiceDate
  if (!value) return Number.POSITIVE_INFINITY
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}
const batchAllocationRows = computed(() => {
  let remaining = batchAmountPesewas.value
  const orderedPayables = [...selectedBatchPayables.value].sort((left, right) => {
    const dateDifference = batchAllocationDate(left) - batchAllocationDate(right)
    return dateDifference || String(left.id).localeCompare(String(right.id), undefined, { numeric: true })
  })
  return orderedPayables.map((payable) => {
    const balancePesewas = amount(payable)
    const allocationPesewas = Math.min(balancePesewas, Math.max(remaining, 0))
    remaining -= allocationPesewas
    return { payable, balancePesewas, allocationPesewas, afterPesewas: balancePesewas - allocationPesewas }
  })
})
const batchAllocatedTotalPesewas = computed(() => batchAllocationRows.value.reduce((sum, row) => sum + row.allocationPesewas, 0))
const batchUnappliedPesewas = computed(() => Math.max(0, selectedBatchTotalPesewas.value - batchAllocatedTotalPesewas.value))
const batchAmountError = computed(() => {
  if (!String(batchAmount.value ?? '').trim()) return 'Enter the amount to distribute.'
  if (!batchAmountPesewas.value) return 'Enter an amount greater than GH₵0.00.'
  if (batchAmountPesewas.value > selectedBatchTotalPesewas.value) return `Amount cannot exceed ${formatMoney(selectedBatchTotal.value)}.`
  const account = selectedBatchAccount.value
  if (account && batchAmountPesewas.value > Math.round(Number(account.currentBalance) * 100)) return 'Amount exceeds this account balance.'
  return ''
})
const selectedBatchAccountAfter = computed(() => {
  const account = selectedBatchAccount.value
  return account ? Number(account.currentBalance) - batchAmountValue.value : null
})
const payableSupplierKey = (payable: PayableSummary) => String(payable.supplierId || payable.supplierName || '').trim().toLowerCase()
const canSelectForBatch = (payable: PayableSummary) => {
  return activeTab.value === 'to_pay' && canPay(payable)
}
const visibleBatchCandidates = computed(() => filteredPayables.value.filter(canSelectForBatch))
const batchSelectAllCandidates = computed(() => {
  // Batch settlement is supplier-scoped. The supplier filter takes priority;
  // otherwise the first selected invoice establishes the batch supplier.
  const supplierScope = supplierFilter.value !== 'all'
    ? supplierFilter.value.trim().toLowerCase()
    : selectedBatchSupplier.value
  if (!supplierScope) return []
  return visibleBatchCandidates.value.filter((item) => payableSupplierKey(item) === supplierScope)
})
const allVisibleBatchSelected = computed(() => batchSelectAllCandidates.value.length > 0 && batchSelectAllCandidates.value.every((item) => selectedBatchIds.value.has(item.id)))
const someVisibleBatchSelected = computed(() => batchSelectAllCandidates.value.some((item) => selectedBatchIds.value.has(item.id)) && !allVisibleBatchSelected.value)
type PaymentMethodOption = PaymentMethodSummary & { value: PayablePaymentMethod; label: string }
// RigelOS owns the payment-method catalogue. Credit Payment is the one local
// audit label because it represents a customer-credit settlement, not a
// payment method returned by the RigelOS endpoint.
const creditPaymentOption: PaymentMethodOption = {
  id: '',
  name: 'Credit Payment',
  description: '',
  value: 'credit_payment',
  methodKey: 'credit_payment',
  hasSubtypes: false,
  isActive: true,
  isSystem: true,
  subtypes: [],
  label: 'Credit Payment',
}
const selectablePaymentMethods = computed<PaymentMethodOption[]>(() => {
  const options = syncedPaymentMethods.value
    .filter((method) => method.isActive)
    .map((method) => ({
        ...method,
        value: method.id || method.methodKey,
        label: method.name,
        subtypes: method.subtypes || [],
      }))
  if (!options.some((method) => method.methodKey === creditPaymentOption.methodKey)) options.push(creditPaymentOption)
  return options
})
const paymentMethods = selectablePaymentMethods
const selectedPaymentMethod = computed<PaymentMethodOption | null>(() => (
  paymentMethods.value.find((method) => method.value === paymentMethod.value) || null
))
const selectedPaymentSubtype = computed<PaymentMethodSubtype | null>(() => (
  selectedPaymentMethod.value?.subtypes?.find((subtype) => subtype.id === paymentMethodSubtypeId.value) || null
))
const paymentMethodSubtypes = computed(() => (
  selectedPaymentMethod.value?.subtypes?.filter((subtype) => subtype.isActive) || []
))
const currentPaymentDetailFields = computed<PaymentDetailDefinition[]>(() => paymentDetailFields(selectedPaymentMethod.value, selectedPaymentSubtype.value))
const selectedBatchPaymentMethod = computed<PaymentMethodOption | null>(() => (
  paymentMethods.value.find((method) => method.value === batchPaymentMethod.value) || null
))
const selectedBatchPaymentSubtype = computed<PaymentMethodSubtype | null>(() => (
  selectedBatchPaymentMethod.value?.subtypes?.find((subtype) => subtype.id === batchPaymentMethodSubtypeId.value) || null
))
const batchPaymentMethodSubtypes = computed(() => (
  selectedBatchPaymentMethod.value?.subtypes?.filter((subtype) => subtype.isActive) || []
))
const currentBatchPaymentDetailFields = computed<PaymentDetailDefinition[]>(() => paymentDetailFields(selectedBatchPaymentMethod.value, selectedBatchPaymentSubtype.value))
const cleanDetailValues = (values: Record<string, string>) => Object.entries(values).reduce<Record<string, string>>((result, [key, value]) => {
  const safeValue = String(value || '').trim()
  if (safeValue) result[key] = safeValue
  return result
}, {})
const paymentContextInput = computed<PayablePaymentContextInput | undefined>(() => {
  const method = selectedPaymentMethod.value
  if (!method) return undefined
  return {
    methodId: method.id || undefined,
    methodKey: method.methodKey,
    methodName: method.name,
    subtypeId: selectedPaymentSubtype.value?.id || undefined,
    subtypeName: selectedPaymentSubtype.value?.name || undefined,
    details: cleanDetailValues(paymentDetailValues.value),
  }
})
const batchPaymentContextInput = computed<PayablePaymentContextInput | undefined>(() => {
  const method = selectedBatchPaymentMethod.value
  if (!method) return undefined
  return {
    methodId: method.id || undefined,
    methodKey: method.methodKey,
    methodName: method.name,
    subtypeId: selectedBatchPaymentSubtype.value?.id || undefined,
    subtypeName: selectedBatchPaymentSubtype.value?.name || undefined,
    details: cleanDetailValues(batchPaymentDetailValues.value),
  }
})
const paymentDetailsLabel = computed(() => selectedPaymentMethod.value ? `Add ${selectedPaymentMethod.value.name} details` : 'Add details')
const batchPaymentDetailsLabel = computed(() => selectedBatchPaymentMethod.value ? `Add ${selectedBatchPaymentMethod.value.name} details` : 'Add details')
const detailValidationMessage = (fields: PaymentDetailDefinition[], values: Record<string, string>) => {
  const missing = fields.find((field) => field.required && !String(values[field.key] || '').trim())
  return missing ? `${missing.label} is required.` : ''
}
const setActiveTab = (tab: PayableTab) => {
  if (tab === 'ledger') attentionOnly.value = false
  if (tab !== 'to_pay') clearBatchSelection()
  if (tab === 'ledger') dateField.value = 'payment'
  else if (dateField.value === 'payment') dateField.value = 'invoice'
  activeTab.value = tab
}
const toggleBatchSelection = (payable: PayableSummary) => {
  const next = new Set(selectedBatchIds.value)
  if (next.has(payable.id)) next.delete(payable.id)
  else if (canSelectForBatch(payable)) {
    // Keep the UI open and predictable: clicking another supplier starts a
    // fresh batch instead of rendering the other rows as blocked.
    if (selectedBatchSupplier.value && payableSupplierKey(payable) !== selectedBatchSupplier.value) next.clear()
    next.add(payable.id)
  }
  selectedBatchIds.value = next
}
const toggleAllVisibleBatch = () => {
  const next = new Set(selectedBatchIds.value)
  if (!batchSelectAllCandidates.value.length) return
  if (allVisibleBatchSelected.value) batchSelectAllCandidates.value.forEach((item) => next.delete(item.id))
  else batchSelectAllCandidates.value.forEach((item) => next.add(item.id))
  selectedBatchIds.value = next
}
const clearBatchSelection = () => { selectedBatchIds.value = new Set() }
const clearFilters = () => {
  searchQuery.value = ''
  supplierFilter.value = 'all'
  sourceFilter.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
  attentionOnly.value = false
}

const formatPesewas = (value: number) => formatMoney(Number(value || 0) / 100)
const formatTableAmount = (value: number) => (Number(value || 0) / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const payableLedgerDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const payableDate = (payable: PayableSummary) => {
  const value = payable.invoiceDate || payable.sourceUpdatedAt || payable.dueDate || payable.lastSnapshotAt
  return value ? String(value).slice(0, 10) : '—'
}
const pendingPaymentAmount = (payable: PayableSummary) => {
  const actionAmount = Number(payable.paymentActionAmountPesewas || 0)
  if (actionAmount > 0) return actionAmount / 100
  const locallyRecorded = Math.max(0, Number(payable.amountPaidPesewas || 0) - Number(payable.lastConfirmedPaidPesewas || 0))
  return locallyRecorded / 100
}
const pendingPaymentNeedsSync = (payable: PayableSummary) => ['pending', 'leased'].includes(payable.paymentActionStatus || '')
const pendingPaymentStatus = (payable: PayableSummary) => {
  if (pendingPaymentNeedsSync(payable)) return 'Needs Sync Inventory'
  if (payable.paymentActionStatus === 'acknowledged' || payable.paymentConfirmationStatus === 'acknowledged') return 'Confirming'
  return 'Awaiting confirmation'
}
const pendingPaymentTime = (payable: PayableSummary) => {
  const value = payable.paymentActionCreatedAt || payable.sourceUpdatedAt || payable.lastSnapshotAt
  if (!value) return 'time not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'time not recorded'
  return date.toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
const toggleSyncPanel = () => {
  syncPanelOpen.value = !syncPanelOpen.value
  if (syncPanelOpen.value) void loadPendingPayables()
}
const goToPendingPayments = () => {
  syncPanelOpen.value = false
  attentionOnly.value = false
  setActiveTab('awaiting')
}
const statusLabel = (payable: PayableSummary) => ({ attention: 'Needs attention', to_pay: 'Ready to pay', awaiting: 'Awaiting sync', settled: 'Settled' }[lifecycle(payable)])
const detailOverdue = computed(() => {
  const payable = selectedPayable.value
  if (!payable || !payable.dueDate || lifecycle(payable) !== 'to_pay') return false
  return new Date(payable.dueDate).getTime() < Date.now()
})
const statusStyle = (payable: PayableSummary) => `pb-tag-${lifecycle(payable)}`
const attentionMessage = (payable: PayableSummary) => {
  if (payable.paymentActionStatus === 'failed') return 'Rigel OS could not apply this recorded payment. Do not record it again; refresh after the issue has been resolved or contact support with this invoice number.'
  if (payable.syncStatus === 'needs_reconciliation' || payable.paymentConfirmationStatus === 'needs_reconciliation') return 'This invoice is waiting for a newer Rigel OS snapshot to reconcile the mismatch. Do not record another payment; it will become available again automatically once the confirmed snapshot arrives.'
  return ''
}
const canPay = (payable: PayableSummary) => lifecycle(payable) === 'to_pay' && amount(payable) > 0
const payableStatusSummary = (payable: PayableSummary) => {
  const state = lifecycle(payable)
  if (state === 'settled') return { title: 'Paid in full', description: 'This invoice has no balance remaining.', className: '' }
  if (state === 'awaiting') return { title: 'Payment recorded', description: 'This payment has been recorded from your account. It will move to Settled when RigelOS updates the invoice.', className: 'is-wait' }
  if (state === 'attention') return { title: 'Needs attention', description: attentionMessage(payable) || 'This invoice needs review before another payment can be recorded.', className: 'is-bad' }
  return { title: 'Ready to pay', description: `${formatPesewas(payable.balancePesewas)} is outstanding. Choose the account you want to pay from.`, className: '' }
}
const openLedgerEntry = (entry: PayableLedgerEntry) => {
  selectedLedgerEntry.value = entry
  ledgerDetailOpen.value = true
}
const ledgerMethodLabel = (entry: PayableLedgerEntry) => entry.paymentContext?.methodName || entry.paymentMethod || 'Not specified'
const ledgerSubtypeLabel = (entry: PayableLedgerEntry) => entry.paymentContext?.subtypeName || ''
const ledgerFundingLabel = (entry: PayableLedgerEntry) => entry.accountId ? (entry.accountName || 'Account') : 'Payment method only'
const ledgerSyncLabel = (entry: PayableLedgerEntry) => {
  if (entry.paymentActionStatus === 'corroborated' || entry.paymentConfirmationStatus === 'corroborated') return 'Confirmed by RigelOS'
  if (entry.paymentActionStatus === 'acknowledged' || entry.paymentConfirmationStatus === 'acknowledged') return 'Payment recorded · awaiting invoice confirmation'
  if (entry.paymentActionStatus === 'failed') return 'Payment needs attention'
  return 'Payment recorded'
}

const paymentAccount = computed(() => activeAccounts.value.find((account) => account.id === paymentAccountId.value) || null)
const balanceAfterPayment = computed(() => {
  if (paymentMode.value !== 'account' || !paymentAccount.value) return null
  const value = Number(paymentAmount.value)
  if (!Number.isFinite(value)) return null
  return Number(paymentAccount.value.currentBalance) - value
})

const payablesRequestOptions = () => ({
  includeSettled: true,
  limit: pageSize,
  offset: (currentPage.value - 1) * pageSize,
  search: searchQuery.value.trim() || undefined,
  supplier: supplierFilter.value === 'all' ? undefined : supplierFilter.value,
  source: sourceFilter.value === 'all' ? undefined : sourceFilter.value,
  lifecycle: attentionOnly.value || activeTab.value === 'ledger' ? undefined : activeTab.value,
  attentionOnly: attentionOnly.value,
  dateField: dateField.value === 'payment' ? 'invoice' : dateField.value,
  dateFrom: dateFrom.value || undefined,
  dateTo: dateTo.value || undefined,
})
const loadPayablesPage = async (withAccounts = false) => {
  const requestId = ++pageRequestId
  isRefreshing.value = true
  loadError.value = ''
  try {
    const payableRequest = loadPayables(payablesRequestOptions())
    if (withAccounts) await Promise.all([payableRequest, loadAccounts()])
    else await payableRequest
    if (requestId !== pageRequestId) return
    if (!payablesPagination.value.total) currentPage.value = 1
    else if (currentPage.value > payablesTotalPages.value) {
      currentPage.value = payablesTotalPages.value
      await loadPayables(payablesRequestOptions())
    }
  } catch (error) {
    if (requestId === pageRequestId) {
      loadError.value = error instanceof Error ? error.message : 'Could not load payables. Try again.'
    }
  } finally {
    if (requestId === pageRequestId) isRefreshing.value = false
  }
}
const loadPayableLedgerPage = async (withAccounts = false) => {
  const requestId = ++pageRequestId
  isRefreshing.value = true
  loadError.value = ''
  const options = {
    limit: pageSize,
    offset: (currentPage.value - 1) * pageSize,
    search: searchQuery.value.trim() || undefined,
    supplier: supplierFilter.value === 'all' ? undefined : supplierFilter.value,
    source: sourceFilter.value === 'all' ? undefined : sourceFilter.value,
    dateField: 'payment' as const,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
  }
  try {
    const ledgerRequest = loadPayableLedger(options)
    if (withAccounts) await Promise.all([ledgerRequest, loadAccounts()])
    else await ledgerRequest
    if (requestId !== pageRequestId) return
    if (!payableLedgerPagination.value.total) currentPage.value = 1
    else if (currentPage.value > ledgerTotalPages.value) {
      currentPage.value = ledgerTotalPages.value
      await loadPayableLedger({ ...options, offset: (currentPage.value - 1) * pageSize })
    }
  } catch (error) {
    if (requestId === pageRequestId) loadError.value = error instanceof Error ? error.message : 'Could not load the payment ledger. Try again.'
  } finally {
    if (requestId === pageRequestId) isRefreshing.value = false
  }
}
const loadActivePage = (withAccounts = false) => activeTab.value === 'ledger' ? loadPayableLedgerPage(withAccounts) : loadPayablesPage(withAccounts)
const refreshLedgerCount = () => loadPayableLedger({ limit: 1, offset: 0 }).catch(() => undefined)
const refresh = () => {
  void loadPendingPayables()
  void loadPayableSuppliers().catch(() => undefined)
  if (activeTab.value === 'ledger') return loadPayableLedgerPage(true)
  void refreshLedgerCount()
  return loadPayablesPage(true)
}
const refreshSyncReminder = () => { void loadPendingPayables() }
const goToPage = (page: number) => {
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  if (nextPage === currentPage.value) return
  clearBatchSelection()
  currentPage.value = nextPage
  void loadActivePage()
}
let filterTimer: ReturnType<typeof setTimeout> | undefined
watch([activeTab, attentionOnly, supplierFilter, sourceFilter, searchQuery, dateField, dateFrom, dateTo], () => {
  currentPage.value = 1
  clearBatchSelection()
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    filterTimer = undefined
    void loadActivePage()
  }, 250)
})
const openPayable = (id: string) => { selectedPayableId.value = id; detailOpen.value = true }
const setPaymentMode = (mode: 'account' | 'method') => {
  paymentMode.value = mode
  if (mode === 'method' && !paymentMethod.value) paymentMethod.value = paymentMethods.value[0]?.value || ''
  if (mode === 'account' && !paymentMethod.value) {
    paymentDetailsOpen.value = false
  }
  if (mode === 'method' && currentPaymentDetailFields.value.length) {
    paymentDetailsOpen.value = true
  }
}
const openPaymentFor = (id: string) => { selectedPayableId.value = id; openPayment() }
const openPayment = () => {
  if (!selectedPayable.value) return
  const fromDetail = detailOpen.value
  const handoffToken = ++paymentHandoffToken
  paymentSubmitError.value = ''
  paymentAttempted.value = false
  paymentDetailsOpen.value = false
  paymentMode.value = 'account'
  paymentMethod.value = ''
  paymentAccountId.value = activeAccounts.value[0]?.id || ''
  paymentMethodId.value = ''
  paymentMethodSubtypeId.value = ''
  paymentDetailValues.value = {}
  paymentAmount.value = (amount(selectedPayable.value) / 100).toFixed(2)
  paymentNotes.value = ''
  paymentIdempotencyKey.value = crypto.randomUUID()
  const open = () => {
    if (handoffToken === paymentHandoffToken && selectedPayable.value) paymentOpen.value = true
  }
  if (!fromDetail) { open(); return }
  detailOpen.value = false
  void nextTick(open)
}
const paymentErrorFor = (field: 'account' | 'method' | 'amount' | 'details') => {
  const payable = selectedPayable.value
  if (field === 'account') return paymentMode.value === 'account' && !paymentAccountId.value ? 'Choose the account that funded this payment.' : ''
  if (field === 'method') return paymentMode.value === 'method' && !paymentMethod.value ? 'Choose a payment method.' : ''
  if (field === 'details') {
    if (paymentMethodSubtypes.value.length && !paymentMethodSubtypeId.value) return 'Choose a type for this payment method.'
    return detailValidationMessage(currentPaymentDetailFields.value, paymentDetailValues.value)
  }
  const value = Number(paymentAmount.value)
  if (!Number.isFinite(value) || value <= 0) return 'Enter a payment amount greater than 0.'
  if (payable && value > amount(payable) / 100) return `Amount cannot exceed ${formatPesewas(amount(payable))}.`
  const account = activeAccounts.value.find((item) => item.id === paymentAccountId.value)
  if (paymentMode.value === 'account' && account && value > Number(account.currentBalance)) return 'Amount exceeds this account balance.'
  return ''
}
const executePayment = async (): Promise<PayableSuccess | false> => {
  const payable = selectedPayable.value
  if (!payable) return false
  const description = `Supplier payment to ${payable.supplierName || 'supplier'}${paymentNotes.value.trim() ? `: ${paymentNotes.value.trim()}` : ''}`
  try {
    if (paymentMode.value === 'account') {
      await postMoneyOut({ accountId: paymentAccountId.value, source: 'supplier_payment', amount: Number(paymentAmount.value), description, reference: payable.supplierInvoiceNo || payable.invoiceId, payableId: payable.id, postingKey: paymentIdempotencyKey.value, paymentContext: paymentContextInput.value, metadata: { recordedFrom: 'payables_workbench', workflow: 'payable_settlement', payableId: payable.id, invoiceId: payable.invoiceId, orderId: payable.orderId, supplierName: payable.supplierName } })
    } else {
      await postPayableMethodPayment({ payableId: payable.id, paymentMethod: paymentMethod.value, paymentContext: paymentContextInput.value, amount: Number(paymentAmount.value), description, reference: payable.supplierInvoiceNo || payable.invoiceId, idempotencyKey: paymentIdempotencyKey.value })
    }
    // Close the payment dialog before refreshing the active tab. A successful
    // payment can move this invoice out of To pay, which would otherwise leave
    // the dialog's built-in close button mounted over an empty shell.
    paymentOpen.value = false
    await nextTick()
    await refresh()
    return {
      title: 'Payment recorded',
      message: `${payable.supplierName || 'Supplier'} · ${payable.supplierInvoiceNo || payable.invoiceId}`,
      amount: Number(paymentAmount.value),
    }
  } catch (error) {
    paymentSubmitError.value = error instanceof Error ? error.message : 'Could not post this payment. Try again.'
    return false
  }
}
const submitPayment = () => {
  if (!selectedPayable.value) return
  paymentAttempted.value = true
  const accountError = paymentErrorFor('account')
  const methodError = paymentErrorFor('method')
  const amountError = paymentErrorFor('amount')
  const detailsError = paymentMethod.value ? paymentErrorFor('details') : ''
  if (accountError || methodError || amountError || detailsError) {
    if (detailsError) paymentDetailsOpen.value = true
    return
  }
  paymentSubmitError.value = ''
  const payable = selectedPayable.value
  openConfirm('payment', {
    title: 'Record this payment?',
    message: `${payable.supplierName || 'Supplier'} · ${payable.supplierInvoiceNo || payable.invoiceId}${paymentMode.value === 'account' ? '' : ' · recorded by method only'}`,
    confirmLabel: 'Post payment',
    amount: Number(paymentAmount.value),
  }, executePayment)
}
const openBatchPayment = () => {
  if (selectedBatchIds.value.size < 2) return
  batchSubmitError.value = ''
  batchAttempted.value = false
  batchDetailsOpen.value = false
  batchAccountId.value = ''
  batchAmount.value = selectedBatchTotal.value.toFixed(2)
  batchPaymentMethod.value = ''
  batchPaymentMethodId.value = ''
  batchPaymentMethodSubtypeId.value = ''
  batchPaymentDetailValues.value = {}
  batchIdempotencyKey.value = crypto.randomUUID()
  batchReference.value = ''
  batchDescription.value = ''
  batchOpen.value = true
}
const executeBatchPayment = async (): Promise<PayableSuccess | false> => {
  const supplierName = selectedBatchSupplierName.value
  const count = selectedBatchPayables.value.length
  const amount = batchAmountValue.value
  try {
    await postPayablePaymentBatch({
      payableIds: [...selectedBatchIds.value],
      accountId: batchAccountId.value,
      amount: batchAmountValue.value,
      allocations: batchAllocationRows.value.map((row) => ({ payableId: row.payable.id, amount: row.allocationPesewas / 100 })),
      paymentMethod: batchPaymentMethod.value || undefined,
      paymentContext: batchPaymentContextInput.value,
      reference: batchReference.value.trim() || undefined,
      description: batchDescription.value.trim() || undefined,
      idempotencyKey: batchIdempotencyKey.value,
    })
    batchOpen.value = false
    clearBatchSelection()
    await refresh()
    return {
      title: 'Batch payment posted',
      message: `${count} ${supplierName || 'supplier'} invoice${count === 1 ? '' : 's'} settled.`,
      amount,
    }
  } catch (error) {
    batchSubmitError.value = error instanceof Error ? error.message : 'Could not post this batch payment. Try again.'
    return false
  }
}
const submitBatchPayment = () => {
  batchAttempted.value = true
  if (batchAmountError.value) {
    batchSubmitError.value = batchAmountError.value
    return
  }
  if (batchPaymentMethod.value) {
    const detailsError = batchPaymentMethodSubtypes.value.length && !batchPaymentMethodSubtypeId.value
      ? 'Choose a type for this payment method.'
      : detailValidationMessage(currentBatchPaymentDetailFields.value, batchPaymentDetailValues.value)
    if (detailsError) {
      batchDetailsOpen.value = true
      batchSubmitError.value = detailsError
      return
    }
  }
  if (!batchAccountId.value) {
    batchSubmitError.value = 'Choose the account that will fund this batch payment.'
    return
  }
  batchSubmitError.value = ''
  openConfirm('batch', {
    title: 'Post this batch payment?',
    message: `${selectedBatchPayables.length} ${selectedBatchSupplierName || 'supplier'} invoice${selectedBatchPayables.length === 1 ? '' : 's'} · applied to the oldest due first`,
    confirmLabel: 'Post payment',
    amount: batchAmountValue.value,
  }, executeBatchPayment)
}
let confirmHandoffToken = 0
const reopenConfirmOrigin = async (origin: 'payment' | 'batch' | null, handoffToken: number) => {
  if (!origin) return
  await nextTick()
  if (handoffToken !== confirmHandoffToken) return
  if (origin === 'payment' && selectedPayable.value) paymentOpen.value = true
  else if (origin === 'batch' && selectedBatchIds.value.size >= 2) batchOpen.value = true
}
const openConfirm = (origin: 'payment' | 'batch', details: PayableConfirmation, action: () => Promise<PayableSuccess | false>) => {
  const handoffToken = ++confirmHandoffToken
  confirmOrigin.value = origin
  confirmDetails.value = details
  pendingConfirmAction.value = action
  if (origin === 'payment') paymentOpen.value = false
  else batchOpen.value = false
  void nextTick(() => {
    if (handoffToken === confirmHandoffToken && confirmOrigin.value === origin) confirmOpen.value = true
  })
}
const cancelConfirm = () => {
  if (isConfirming.value) return
  const origin = confirmOrigin.value
  const handoffToken = ++confirmHandoffToken
  confirmOpen.value = false
  confirmDetails.value = null
  pendingConfirmAction.value = null
  confirmOrigin.value = null
  void reopenConfirmOrigin(origin, handoffToken)
}
const runConfirm = async () => {
  const action = pendingConfirmAction.value
  if (!action || isConfirming.value) return
  isConfirming.value = true
  try {
    let result: PayableSuccess | false = false
    try {
      result = await action()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not post this payment. Try again.'
      if (confirmOrigin.value === 'payment') paymentSubmitError.value = message
      else if (confirmOrigin.value === 'batch') batchSubmitError.value = message
    }
    const origin = confirmOrigin.value
    const handoffToken = ++confirmHandoffToken
    confirmOpen.value = false
    confirmDetails.value = null
    pendingConfirmAction.value = null
    confirmOrigin.value = null
    if (result) {
      await nextTick()
      if (handoffToken === confirmHandoffToken) showSuccess(result)
    } else {
      await reopenConfirmOrigin(origin, handoffToken)
    }
  } finally {
    isConfirming.value = false
  }
}
const toggleBatchDetails = () => {
  batchDetailsOpen.value = !batchDetailsOpen.value
}

// Choosing (or clearing) an account intentionally drives the funding mode:
// an account selection always means "debit this account", and clearing it
// intentionally switches back to the direct-payment path.
watch(paymentAccountId, () => {
  if (paymentAccountId.value) paymentMode.value = 'account'
})
watch(paymentMethod, (next, previous) => {
  if (next === previous) return
  paymentMethodId.value = selectedPaymentMethod.value?.id || ''
  paymentMethodSubtypeId.value = ''
  paymentDetailValues.value = {}
  if (next && (currentPaymentDetailFields.value.length || paymentMethodSubtypes.value.length)) paymentDetailsOpen.value = true
})
watch(paymentMethodSubtypeId, (next, previous) => {
  if (next === previous) return
  paymentDetailValues.value = {}
})
watch(batchPaymentMethod, (next, previous) => {
  if (next === previous) return
  batchPaymentMethodId.value = selectedBatchPaymentMethod.value?.id || ''
  batchPaymentMethodSubtypeId.value = ''
  batchPaymentDetailValues.value = {}
  if (next && (currentBatchPaymentDetailFields.value.length || batchPaymentMethodSubtypes.value.length)) batchDetailsOpen.value = true
})
watch(batchPaymentMethodSubtypeId, (next, previous) => {
  if (next === previous) return
  batchPaymentDetailValues.value = {}
})
watch(selectedPayable, (next) => {
  if (!next) {
    if (paymentOpen.value) paymentOpen.value = false
    if (detailOpen.value) detailOpen.value = false
  }
})
watch(confirmOpen, (open, wasOpen) => {
  if (open || !wasOpen) return
  // The built-in dialog close icon and Escape key can close the root without
  // going through cancelConfirm. Restore the form in that case, but never
  // interrupt an in-flight post.
  if (isConfirming.value) {
    void nextTick(() => { if (!confirmOpen.value) confirmOpen.value = true })
    return
  }
  const origin = confirmOrigin.value
  if (!origin) return
  const handoffToken = ++confirmHandoffToken
  confirmDetails.value = null
  pendingConfirmAction.value = null
  confirmOrigin.value = null
  void reopenConfirmOrigin(origin, handoffToken)
})
watch([batchAmount, batchAccountId], () => {
  if (batchSubmitError.value) batchSubmitError.value = ''
})
watch(successOpen, (open) => {
  if (!open) successDetails.value = null
})
onMounted(() => {
  syncReminderTimer = setInterval(refreshSyncReminder, 60000)
  window.addEventListener('focus', refreshSyncReminder)
  document.addEventListener('pointerdown', handleSyncClickOutside)
  void Promise.all([refresh(), loadPaymentMethods().catch(() => undefined)])
})
onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer)
  if (syncReminderTimer) clearInterval(syncReminderTimer)
  document.removeEventListener('pointerdown', handleSyncClickOutside)
  window.removeEventListener('focus', refreshSyncReminder)
})
</script>

<style>
/* Payables dialogs: the dialog root is teleported and gets no scope id, so its rules are global. Everything else is scoped below. */
.pb-dlg {
  --ink: #14161c;
  --ink-2: #3b3f4a;
  --mute: #6a6f7d;
  --faint: #9a9fac;
  --line: #e4e6eb;
  --line-2: #d3d6dd;
  --wash: #f6f7f9;
  width: calc(100vw - 2rem) !important;
  max-width: calc(100vw - 2rem) !important;
  max-height: calc(100vh - 2rem);
  min-height: 0;
  border-radius: 14px !important;
  background: #fff;
  color: var(--ink);
  overflow: hidden;
  box-shadow: 0 24px 60px -12px rgba(20, 22, 28, 0.28), 0 0 0 1px rgba(20, 22, 28, 0.06) !important;
  -webkit-font-smoothing: antialiased;
}
.pb-dlg-sm { max-width: min(420px, calc(100vw - 2rem)) !important; }
.pb-dlg-md { max-width: min(540px, calc(100vw - 2rem)) !important; }
.pb-dlg-lg { max-width: min(800px, calc(100vw - 2rem)) !important; }
</style>

<style scoped>
.pb {
  --ink: #14161c;
  --ink-2: #3b3f4a;
  --mute: #6a6f7d;
  --faint: #9a9fac;
  --line: #e4e6eb;
  --line-2: #d3d6dd;
  --wash: #f6f7f9;
  max-width: 1180px;
  margin: 0 auto;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
.pb *, .pb *::before, .pb *::after { box-sizing: border-box; }
.pb-ico { width: 16px; height: 16px; flex: none; }
.pb-spin { animation: pb-rot 0.9s linear infinite; }
@keyframes pb-rot { to { transform: rotate(360deg); } }
.pb-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.pb-r { text-align: right; }
.pb-num { font-variant-numeric: tabular-nums; }
.pb-trunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.pb-minw { min-width: 0; }
.pb-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); flex: none; }
.pb-dot.is-action { background: #d97706; }
.pb-dot.is-wait { background: var(--ink-2); animation: pb-pulse 2.2s ease-in-out infinite; }
@keyframes pb-pulse { 50% { opacity: 0.3; } }

/* buttons */
.pb-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13.5px; font-weight: 500; line-height: 1; cursor: pointer; border: 1px solid transparent; text-decoration: none; white-space: nowrap; transition: background 0.12s, border-color 0.12s; }
.pb-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.pb-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.pb-btn-quiet { background: #fff; color: var(--ink); border-color: var(--line-2); }
.pb-btn-quiet:hover:not(:disabled) { background: var(--wash); }
.pb-btn-primary { background: var(--ink); color: #fff; }
.pb-btn-primary:hover:not(:disabled) { background: #2a2d37; }
.pb-btn-sm { height: 30px; padding: 0 11px; font-size: 12.5px; }
.pb-btn-icon { width: 36px; padding: 0; }
.pb-btn-block { width: 100%; }
.pb-self-start { align-self: flex-start; }
.pb-self-end { align-self: end; height: 38px; }
.pb-x { display: grid; place-items: center; width: 26px; height: 26px; flex: none; border-radius: 6px; border: 0; background: transparent; color: var(--faint); cursor: pointer; }
.pb-x:hover { background: var(--wash); color: var(--ink); }
.pb-x:focus-visible { outline: 2px solid var(--ink); }
.pb-link { font-size: 12px; font-weight: 500; color: var(--mute); background: none; border: 0; padding: 0; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.pb-link:hover { color: var(--ink); }
.pb-link:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 2px; }

/* header */
.pb-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.pb-head h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
.pb-head-actions { display: flex; align-items: center; gap: 8px; }
.pb-pill { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line-2); background: #fff; color: var(--ink-2); font-size: 12.5px; font-weight: 500; cursor: pointer; transition: background 0.12s; }
.pb-pill:hover { background: var(--wash); }
.pb-pill.is-action { border-color: #f3d9a4; background: #fffaf0; color: #7a4a06; }
.pb-pill:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.pb-pop-wrap { position: relative; }
.pb-badge { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; display: grid; place-items: center; border-radius: 999px; border: 2px solid #fff; background: var(--ink-2); color: #fff; font-size: 10px; font-weight: 600; line-height: 1; }
.pb-badge.is-action { background: #d97706; }
.pb-pop { position: absolute; right: 0; top: calc(100% + 8px); z-index: 30; width: min(380px, calc(100vw - 2rem)); background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 16px 40px -10px rgba(20, 22, 28, 0.22); overflow: hidden; }
.pb-pop-head { display: flex; justify-content: space-between; gap: 12px; padding: 14px 14px 12px 16px; border-bottom: 1px solid var(--line); }
.pb-pop-title { font-size: 13.5px; font-weight: 600; }
.pb-pop-sub { margin-top: 3px; font-size: 12px; line-height: 1.45; color: var(--mute); }
.pb-pop-msg { padding: 16px; font-size: 13px; color: var(--mute); }
.pb-pop-list { max-height: 280px; overflow-y: auto; }
.pb-pop-row { display: flex; gap: 10px; padding: 11px 16px; border-bottom: 1px solid var(--line); }
.pb-pop-row:last-child { border-bottom: 0; }
.pb-pop-row .pb-dot { margin-top: 6px; }
.pb-pop-row-main { flex: 1; min-width: 0; }
.pb-pop-row-top { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; font-weight: 500; }
.pb-pop-row-top strong { font-weight: 600; font-variant-numeric: tabular-nums; flex: none; }
.pb-pop-row-sub { margin-top: 2px; font-size: 12px; color: var(--mute); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-pop-row-state { margin-top: 3px; font-size: 11.5px; color: var(--mute); }
.pb-pop-row-state.is-action { color: #92580a; }
.pb-pop-foot { padding: 12px 16px 14px; border-top: 1px solid var(--line); background: var(--wash); display: flex; flex-direction: column; gap: 10px; }
.pb-pop-foot > div { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--mute); }
.pb-pop-foot strong { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }

/* workspace tabs */
.pb-ws { display: flex; gap: 22px; margin-top: 16px; border-bottom: 1px solid var(--line); }
.pb-ws button { position: relative; height: 40px; padding: 0; font-size: 14px; font-weight: 500; color: var(--mute); background: none; border: 0; cursor: pointer; }
.pb-ws button:hover { color: var(--ink); }
.pb-ws button.is-on { color: var(--ink); }
.pb-ws button.is-on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ink); border-radius: 2px; }
.pb-ws button:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 3px; }

/* summary strip */
.pb-summary { display: grid; grid-template-columns: 1.4fr 1fr 1fr; margin: 18px 0 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.pb-cell { padding: 14px 18px; min-width: 0; }
.pb-cell + .pb-cell { border-left: 1px solid var(--line); }
.pb-cell dt { font-size: 12.5px; color: var(--mute); }
.pb-cell dd { margin-top: 6px; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
.pb-cell-lead dd { font-size: 26px; letter-spacing: -0.02em; }
.pb-cell dd.is-bad { color: #b42318; }
.pb-cell dd.is-none { color: var(--faint); font-weight: 500; }

/* card */
.pb-card { position: relative; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.pb-tabs { display: flex; flex-wrap: wrap; gap: 4px 22px; padding: 0 18px; border-bottom: 1px solid var(--line); }
.pb-tab { position: relative; display: inline-flex; align-items: center; gap: 7px; height: 44px; padding: 0; font-size: 13.5px; font-weight: 500; color: var(--mute); background: none; border: 0; cursor: pointer; }
.pb-tab:hover { color: var(--ink); }
.pb-tab.is-on { color: var(--ink); }
.pb-tab.is-on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ink); border-radius: 2px; }
.pb-tab:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px; border-radius: 4px; }
.pb-count { font-size: 12px; font-weight: 500; color: var(--faint); font-variant-numeric: tabular-nums; }
.pb-tab.is-on .pb-count { color: var(--ink-2); }
.pb-count-bad { color: #b42318 !important; }

/* toolbar */
.pb-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid var(--line); }
.pb-search { position: relative; flex: 1 1 220px; min-width: 0; max-width: 320px; display: block; }
.pb-search .pb-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--faint); pointer-events: none; }
.pb-in { height: 36px; width: 100%; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 8px; background: #fff; font-size: 13.5px; color: var(--ink); box-shadow: none; transition: border-color 0.12s, box-shadow 0.12s; }
.pb-in::placeholder { color: var(--faint); }
.pb-in:hover { border-color: #b9bdc7; }
.pb-in:focus, .pb-in:focus-visible { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.1); }
.pb-search-in { height: 36px; width: 100%; padding: 0 12px 0 34px; border: 1px solid var(--line-2); border-radius: 8px; background: #fff; font-size: 13.5px; box-shadow: none; }
.pb-search-in:focus, .pb-search-in:focus-visible { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.1); }
.pb-sel { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; }
.pb-sel.is-set { background: var(--wash); border-color: #b9bdc7; font-weight: 500; }
.pb-w-supplier { width: 176px; }
.pb-w-source { width: 128px; }
.pb-w-method { width: 170px; flex: none; }
.pb-range { display: flex; align-items: center; height: 36px; border: 1px solid var(--line-2); border-radius: 8px; background: #fff; padding-right: 4px; }
.pb-range.is-set { background: var(--wash); border-color: #b9bdc7; }
.pb-range:focus-within { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.1); }
.pb-date { flex: none; }
.pb-range-sep { width: 1px; height: 18px; background: var(--line); }
.pb-attn { display: inline-flex; align-items: center; gap: 6px; height: 36px; margin-left: auto; padding: 0 12px; border-radius: 8px; border: 1px solid transparent; background: none; font-size: 13px; font-weight: 500; color: #b42318; cursor: pointer; }
.pb-attn:hover { background: #fef3f2; }
.pb-attn.is-on { background: #fef3f2; border-color: #fecdca; }
.pb-attn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

/* body, states */
.pb-body { position: relative; min-height: 360px; }
.pb-skel span { display: block; height: 52px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, #f6f7f9, #fff, #f6f7f9); background-size: 200% 100%; animation: pb-shimmer 1.4s linear infinite; }
@keyframes pb-shimmer { to { background-position: -200% 0; } }
.pb-state { min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 32px 20px; text-align: center; }
.pb-state h2 { font-size: 15px; font-weight: 600; }
.pb-state p { max-width: 380px; font-size: 13.5px; line-height: 1.5; color: var(--mute); }
.pb-state .pb-btn { margin-top: 8px; }
.pb-busy { position: absolute; inset: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: center; padding-top: 18px; background: rgba(255, 255, 255, 0.6); pointer-events: none; }
.pb-busy span { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font-size: 12.5px; color: var(--mute); }
.pb-sub { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 11px 18px; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--mute); }
.pb-sub strong { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.pb-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 18px; border-bottom: 1px solid var(--line); background: var(--wash); font-size: 13px; color: var(--mute); }
.pb-bar strong { color: var(--ink); font-weight: 600; }
.pb-bar > div { display: flex; gap: 8px; }
.pb-foot { padding: 12px 18px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--faint); }

/* table */
.pb-scroll { overflow-x: auto; }
.pb-table { width: 100%; min-width: 880px; border-collapse: collapse; table-layout: fixed; }
.pb-table thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 500; color: var(--mute); border-bottom: 1px solid var(--line); white-space: nowrap; }
.pb-table thead th.pb-r { text-align: right; }
.pb-table th:first-child, .pb-table td:first-child { padding-left: 18px; }
.pb-table th:last-child, .pb-table td:last-child { padding-right: 18px; }
.pb-table tbody td { padding: 13px 14px; font-size: 13.5px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.pb-table tbody tr:last-child td { border-bottom: 0; }
.pb-table tbody tr { cursor: pointer; transition: background 0.1s; }
.pb-table tbody tr:hover, .pb-table tbody tr.is-sel { background: var(--wash); }
.pb-table tbody tr:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px; }
.pb-table td.pb-r { text-align: right; }
.pb-c-check { padding-left: 18px !important; padding-right: 0 !important; }
.pb-mute { color: var(--mute); }
.pb-strong { font-weight: 500; color: var(--ink); }
.pb-bal { font-weight: 600; color: var(--ink); }
.pb-nowrap { white-space: nowrap; }
.pb-cut { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-check { width: 16px; height: 16px; accent-color: var(--ink); cursor: pointer; vertical-align: middle; }
.pb-check:disabled { cursor: not-allowed; opacity: 0.4; }
.pb-check:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

/* mobile list */
.pb-list { display: none; }
.pb-item { padding: 13px 16px; border-bottom: 1px solid var(--line); cursor: pointer; }
.pb-item:last-child { border-bottom: 0; }
.pb-item:hover, .pb-item.is-sel { background: var(--wash); }
.pb-item:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px; }
.pb-item-top { display: flex; align-items: center; gap: 12px; }
.pb-item-main { flex: 1; min-width: 0; }
.pb-item-main p { font-size: 13.5px; }
.pb-item-main p + p { margin-top: 2px; font-size: 12.5px; }
.pb-item-top strong { font-size: 14px; font-weight: 600; }
.pb-item-sub { display: flex; align-items: center; gap: 16px; margin-top: 10px; font-size: 12px; color: var(--mute); }
.pb-item-sub b { margin-left: 4px; font-weight: 500; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.pb-item-sub .pb-btn { margin-left: auto; }

/* pager */
.pb-pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 18px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--mute); }
.pb-pager > div { display: flex; align-items: center; gap: 10px; }
.pb-pager span { font-variant-numeric: tabular-nums; }

/* dialogs (scoped part) */
.pb-dlg *, .pb-dlg *::before, .pb-dlg *::after { box-sizing: border-box; }
.pb-dlg-head { flex: none; padding: 20px 56px 16px 24px; border-bottom: 1px solid var(--line); }
.pb-dlg-headrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.pb-dlg-title { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-dlg-sub { margin-top: 3px; font-size: 13px; color: var(--mute); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pb-dlg-sub.pb-wrap { white-space: normal; line-height: 1.5; margin-top: 8px; }
.pb-dlg-amt { flex: none; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ink); }
.pb-dlg-body { padding: 20px 24px; min-width: 0; }
.pb-dlg-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 18px; }
.pb-center { text-align: center; padding: 26px 24px 22px; display: flex; flex-direction: column; align-items: center; }
.pb-big { margin-top: 8px; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.pb-tick { width: 36px; height: 36px; margin-bottom: 14px; display: grid; place-items: center; border-radius: 50%; background: var(--ink); color: #fff; }
.pb-tick .pb-ico { width: 18px; height: 18px; stroke-width: 2.5; }
.pb-dlg-error { flex: none; margin: 0; padding: 10px 24px; border-top: 1px solid #fecdca; background: #fef3f2; color: #b42318; font-size: 13px; }
.pb-dlg-foot { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 24px; border-top: 1px solid var(--line); background: #fff; }
.pb-dlg-meta { font-size: 13px; color: var(--mute); display: inline-flex; align-items: baseline; gap: 6px; }
.pb-dlg-meta b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.pb-dlg-meta b.is-neg { color: #b42318; }
.pb-dlg-actions { display: flex; gap: 8px; margin-left: auto; }

.pb-tag { flex: none; display: inline-flex; align-items: center; gap: 7px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--line-2); font-size: 12px; font-weight: 500; color: var(--ink-2); background: #fff; }
.pb-tag i { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); }
.pb-tag-attention { color: #b42318; border-color: #fecdca; }
.pb-tag-attention i { background: #d92d20; }
.pb-tag-awaiting i { background: #d97706; }
.pb-tag-to_pay i { background: var(--ink-2); }
.pb-tag-settled i { background: var(--faint); }

.pb-kv { display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; }
.pb-kv > div { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; min-width: 0; }
.pb-kv dt { color: var(--mute); flex: none; }
.pb-kv dd { min-width: 0; text-align: right; font-weight: 500; color: var(--ink); }
.pb-kv dd.is-strong { font-weight: 600; font-variant-numeric: tabular-nums; }
.pb-kv dd.is-bad { color: #b42318; }
.pb-kv dd.is-none { color: var(--faint); font-weight: 400; }
.pb-kv-total { padding-top: 12px; border-top: 1px solid var(--line); }
.pb-kv-total dt { color: var(--ink); font-weight: 500; }
.pb-kv-total dd { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.pb-kv-soft { padding-top: 16px; border-top: 1px solid var(--line); }
.pb-kv-head { margin-bottom: 10px; font-size: 12px; font-weight: 500; color: var(--mute); }
.pb-note { padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--wash); }
.pb-note p { font-size: 13.5px; font-weight: 500; color: var(--ink); }
.pb-note span { display: block; margin-top: 3px; font-size: 12.5px; line-height: 1.5; color: var(--mute); }
.pb-note.is-bad { border-color: #fecdca; background: #fef3f2; }
.pb-note.is-bad p { color: #912018; }
.pb-note.is-wait { border-color: #f3d9a4; background: #fffaf0; }

.pb-grid { display: grid; gap: 14px; }
.pb-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pb-grid-pay { grid-template-columns: minmax(0, 1fr) 160px; align-items: start; }
.pb-grid-batch { grid-template-columns: minmax(0, 1fr) 220px auto; align-items: start; }
.pb-span2 { grid-column: 1 / -1; }
.pb-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pb-lbl { font-size: 12.5px; font-weight: 500; color: var(--ink-2); line-height: 1.2; }
.pb-opt-tag { margin-left: 4px; font-weight: 400; color: var(--faint); }
.pb-hint { font-size: 12px; line-height: 1.45; color: var(--mute); }
.pb-hint b { font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.pb-err { font-size: 12px; line-height: 1.4; color: #b42318; }
.pb-warn { font-size: 12.5px; color: #92580a; }
.pb-in-num { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; padding-left: 44px; }
.pb-prefix { position: relative; }
.pb-prefix > span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--faint); pointer-events: none; z-index: 1; }
.pb-row-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pb-optrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.pb-details { padding-top: 16px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 12px; }
.pb-details.pb-grid { display: grid; }

.pb-seg { display: inline-grid; grid-auto-flow: column; gap: 2px; padding: 3px; border-radius: 9px; background: #eceef2; }
.pb-seg-btn { height: 28px; padding: 0 12px; border-radius: 7px; border: 0; background: transparent; font-size: 12.5px; font-weight: 500; color: var(--mute); cursor: pointer; }
.pb-seg-btn:hover { color: var(--ink); }
.pb-seg-btn.is-on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(20, 22, 28, 0.12); }
.pb-seg-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }

.pb-batch-scroll { gap: 0; }
.pb-batch-form { display: flex; flex-direction: column; gap: 14px; border-bottom: 1px solid var(--line); }
.pb-btable { width: 100%; table-layout: fixed; border-collapse: collapse; }
.pb-btable thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 500; color: var(--mute); border-bottom: 1px solid var(--line); }
.pb-btable thead th.pb-r { text-align: right; }
.pb-btable tbody td { padding: 11px 14px; font-size: 13.5px; border-bottom: 1px solid var(--line); }
.pb-btable td.pb-r { text-align: right; }
.pb-btable tfoot td { padding: 12px 14px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
.pb-btable tfoot td:first-child { font-weight: 500; color: var(--mute); }
.pb-btable th:first-child, .pb-btable td:first-child { padding-left: 24px; }
.pb-btable th:last-child, .pb-btable td:last-child { padding-right: 24px; }
.pb-settled { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 500; color: var(--ink); }
.pb-settled .pb-ico { width: 14px; height: 14px; stroke-width: 2.5; }

.sync-pop-enter-active, .sync-pop-leave-active { transition: opacity 150ms ease, transform 150ms cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top right; }
.sync-pop-enter-from, .sync-pop-leave-to { opacity: 0; transform: scale(0.97) translateY(-4px); }

@media (max-width: 767px) {
  .pb-table { display: none; }
  .pb-scroll { overflow: visible; }
  .pb-list { display: block; }
}
@media (max-width: 640px) {
  .pb-summary { grid-template-columns: 1fr 1fr; }
  .pb-cell-lead { grid-column: 1 / -1; border-bottom: 1px solid var(--line); }
  .pb-cell:nth-child(3) { border-left: 1px solid var(--line); }
  .pb-cell:nth-child(2) { border-left: 0; }
  .pb-toolbar { padding: 12px 14px; }
  .pb-search { max-width: none; flex-basis: 100%; }
  .pb-w-supplier, .pb-w-source { flex: 1; width: auto; min-width: 0; }
  .pb-range { width: 100%; }
  .pb-attn { margin-left: 0; }
  .pb-tabs { padding: 0 14px; gap: 4px 18px; }
  .pb-grid-2, .pb-grid-pay, .pb-grid-batch { grid-template-columns: minmax(0, 1fr); }
  .pb-dlg-head, .pb-dlg-body, .pb-dlg-foot, .pb-dlg-error { padding-left: 18px; padding-right: 18px; }
  .pb-dlg-head { padding-right: 48px; }
  .pb-dlg-foot { flex-direction: column-reverse; align-items: stretch; }
  .pb-dlg-actions { margin-left: 0; }
  .pb-dlg-actions .pb-btn { flex: 1; }
  .pb-dlg-meta { justify-content: center; }
  .pb-optrow { flex-direction: column; align-items: stretch; }
  .pb-w-method { width: 100%; }
  .pb-btable th:first-child, .pb-btable td:first-child { padding-left: 14px; }
  .pb-btable th:last-child, .pb-btable td:last-child { padding-right: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .pb *, .pb *::before, .pb *::after { animation: none !important; transition: none !important; }
}
</style>
