<template>
  <div class="min-h-full bg-transparent">
    <div class="mx-auto max-w-[1180px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <header class="mb-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-slate-950">Payables</h1>
            <p class="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm text-slate-500">
              <span class="text-base font-semibold tabular-nums text-slate-950">{{ formatPesewas(outstandingAmount) }}</span>
              <span>outstanding</span>
              <span v-if="overdueAmount > 0" class="font-medium text-rose-700">· {{ formatPesewas(overdueAmount) }} overdue</span>
              <span v-if="dueThisWeekAmount > 0" class="text-slate-400">· {{ formatPesewas(dueThisWeekAmount) }} due this week</span>
            </p>
          </div>
          <div ref="syncBellRef" class="flex items-center gap-2 self-start" @keydown.esc="syncPanelOpen = false">
            <button v-if="showSyncBadge" type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" :class="pendingSyncNeedsActionCount ? 'border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-600/30 hover:bg-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'" title="Open payments waiting for RigelOS sync" @click="goToPendingPayments">
              <ExclamationTriangleIcon v-if="pendingSyncNeedsActionCount" class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span v-else class="sync-wait h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{{ pendingSyncNeedsActionCount ? `${pendingSyncNeedsActionCount} payment${pendingSyncNeedsActionCount === 1 ? '' : 's'} awaiting RigelOS sync` : `${pendingSyncCount} confirming in RigelOS` }}</span>
            </button>
            <div class="relative">
              <button type="button" class="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" :class="syncQueueState === 'action' ? 'text-slate-700' : ''" :aria-label="pendingSyncCount ? `${pendingSyncCount} payment${pendingSyncCount === 1 ? '' : 's'} awaiting a RigelOS update` : 'Payment sync status'" :aria-expanded="syncPanelOpen" aria-controls="payable-sync-panel" @click="toggleSyncPanel">
                <BellIcon class="h-5 w-5" aria-hidden="true" />
                <span v-if="pendingSyncCount" class="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold leading-none text-white shadow-sm" :class="syncQueueState === 'action' ? 'bg-rose-600' : 'bg-emerald-500'">{{ pendingSyncCount > 99 ? '99+' : pendingSyncCount }}</span>
              </button>
              <Transition name="sync-pop">
                <div v-if="syncPanelOpen" id="payable-sync-panel" class="absolute right-0 top-full z-30 mt-2 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg shadow-slate-950/10" role="region" aria-label="RigelOS payment sync status">
                  <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3.5">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold text-slate-950">RigelOS sync queue</p>
                        <span v-if="pendingSyncCount" class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" :class="pendingSyncNeedsActionCount ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'">{{ pendingSyncNeedsActionCount ? 'Action needed' : 'Confirming' }}</span>
                      </div>
                      <p class="mt-0.5 text-xs leading-5 text-slate-500">{{ pendingSyncNeedsActionCount ? 'Run Sync Inventory in RigelOS to apply these payments.' : 'These payments are with RigelOS — the next invoice sync confirms them.' }}</p>
                    </div>
                    <button type="button" class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" aria-label="Close sync status" @click="syncPanelOpen = false">
                      <XMarkIcon class="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div v-if="isLoadingPendingPayables && !pendingSyncItems.length" class="px-4 py-5 text-sm text-slate-500">Checking payment sync status…</div>
                  <div v-else-if="pendingSyncCount" class="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    <div v-for="payable in pendingSyncItems" :key="payable.id" class="flex items-start gap-2.5 px-4 py-3">
                      <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" :class="pendingPaymentNeedsSync(payable) ? 'bg-amber-500' : 'bg-emerald-500'" aria-hidden="true" />
                      <div class="min-w-0 flex-1">
                        <div class="flex items-start justify-between gap-3">
                          <p class="min-w-0 truncate text-sm font-medium text-slate-900">{{ payable.supplierName || 'Unnamed supplier' }}</p>
                          <p class="shrink-0 text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(pendingPaymentAmount(payable)) }}</p>
                        </div>
                        <p class="mt-0.5 truncate text-xs text-slate-500">{{ payable.supplierInvoiceNo || payable.invoiceId }} · {{ pendingPaymentTime(payable) }}</p>
                        <p class="mt-1 text-[11px] font-semibold uppercase tracking-wide" :class="pendingPaymentNeedsSync(payable) ? 'text-amber-700' : 'text-emerald-600'">{{ pendingPaymentStatus(payable) }}</p>
                      </div>
                    </div>
                    <p v-if="pendingSyncCount > pendingSyncItems.length" class="px-4 py-2.5 text-xs text-slate-500">Showing the first {{ pendingSyncItems.length }} of {{ pendingSyncCount }} waiting payments.</p>
                  </div>
                  <div v-else class="px-4 py-5 text-sm text-slate-600">No payments are waiting for RigelOS right now.</div>
                  <div v-if="pendingSyncCount" class="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                    <div class="flex items-baseline justify-between gap-3">
                      <span class="text-xs font-medium text-slate-500">Total waiting</span>
                      <span class="text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(pendingSyncTotalPesewas / 100) }}</span>
                    </div>
                    <button type="button" class="mt-2.5 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="goToPendingPayments">Review queued payments</button>
                  </div>
                </div>
              </Transition>
            </div>
            <button type="button" class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" :disabled="isRefreshing" @click="refresh">
              <ArrowPathIcon class="h-4 w-4" :class="isRefreshing ? 'animate-spin' : ''" aria-hidden="true" />
              {{ isRefreshing ? 'Refreshing' : 'Refresh' }}
            </button>
          </div>
        </div>
        <nav class="-mb-px mt-6 flex gap-1 border-b border-slate-200/80" aria-label="Accounts workspace">
          <button type="button" class="inline-flex min-h-10 items-center px-1 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="switchWorkspace(accountsPath)">Accounts</button>
          <button type="button" aria-current="page" class="relative inline-flex min-h-10 items-center px-1 text-sm font-medium text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
            Payables
            <span class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-slate-950" aria-hidden="true" />
          </button>
        </nav>
      </header>

      <section class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-4 pt-4 sm:px-6">
          <div class="space-y-4">
            <div class="flex flex-col gap-3">
              <div class="min-w-0 pb-0" role="tablist" aria-label="Payable status">
                <div class="-mb-px flex flex-wrap gap-x-2 gap-y-1">
                  <button v-for="tab in tabs" :key="tab.value" type="button" role="tab" :aria-selected="activeTab === tab.value" class="group relative inline-flex shrink-0 items-center gap-2 px-2.5 pb-3 pt-1 text-sm font-medium transition first:pl-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" :class="activeTab === tab.value ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'" @click="setActiveTab(tab.value)">
                    <span v-if="tab.value === 'awaiting' && tab.count > 0" class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                    <span class="whitespace-nowrap">{{ tab.label }}</span>
                    <span v-if="tab.count !== null" class="text-xs tabular-nums" :class="activeTab === tab.value ? 'font-semibold text-slate-900' : 'text-slate-400'">{{ tab.count }}</span>
                  </button>
                </div>
              </div>
              <div v-if="activeTab !== 'reports'" class="flex w-full min-w-0 flex-col gap-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div class="relative w-full min-w-0 sm:w-56 sm:shrink-0">
                  <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <UiInput v-model="searchQuery" :aria-label="activeTab === 'ledger' ? 'Search payment ledger' : 'Search supplier invoices'" :placeholder="activeTab === 'ledger' ? 'Search supplier, invoice or account' : 'Search supplier or invoice'" class="h-10 border-slate-200 pl-9 text-sm focus-visible:ring-slate-950" />
                </div>
                <div class="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
                  <div class="sm:w-44">
                    <UiSelect v-model="supplierFilter">
                      <UiSelectTrigger class="h-10 w-full border-slate-200 text-sm transition-colors focus:ring-slate-950" :class="supplierFilter !== 'all' ? 'border-slate-300 bg-slate-50/70 font-medium text-slate-900' : 'text-slate-600'">
                        <span class="flex min-w-0 items-center gap-2">
                          <BuildingOffice2Icon class="h-4 w-4 shrink-0" :class="supplierFilter !== 'all' ? 'text-slate-500' : 'text-slate-400'" aria-hidden="true" />
                          <UiSelectValue placeholder="All suppliers" class="truncate capitalize" />
                        </span>
                      </UiSelectTrigger>
                      <UiSelectContent class="max-h-72">
                        <UiSelectItem value="all">All suppliers</UiSelectItem>
                        <UiSelectItem v-for="supplier in payableSuppliers" :key="supplierOptionValue(supplier)" :value="supplierOptionValue(supplier)" class="capitalize">
                          <span class="truncate">{{ supplier.supplierName }}</span>
                        </UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                  </div>
                  <div class="sm:w-28">
                    <UiSelect v-model="sourceFilter">
                      <UiSelectTrigger class="h-10 w-full border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue /></UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem value="all">All sources</UiSelectItem>
                        <UiSelectItem value="store">Store</UiSelectItem>
                        <UiSelectItem value="warehouse">Warehouse</UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                  </div>
                </div>
                <div class="flex h-10 w-full items-center rounded-lg border border-slate-200 bg-white transition-colors focus-within:ring-2 focus-within:ring-slate-950 sm:w-auto sm:shrink-0" :class="dateFrom || dateTo ? 'border-slate-300 bg-slate-50/70' : ''">
                  <UiDatePicker v-model="dateFrom" aria-label="From date" placeholder="From date" class="h-9 flex-1 rounded-lg border-0 bg-transparent px-2.5 text-xs hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-[136px] sm:flex-none" />
                  <span class="h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />
                  <UiDatePicker v-model="dateTo" aria-label="To date" placeholder="To date" class="h-9 flex-1 rounded-lg border-0 bg-transparent px-2.5 text-xs hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-[136px] sm:flex-none" />
                  <button v-if="dateFrom || dateTo" type="button" aria-label="Clear dates" class="mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="dateFrom = ''; dateTo = ''">
                    <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <button v-if="activeTab !== 'ledger'" type="button" :aria-pressed="attentionOnly" class="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-slate-950 sm:ml-auto" :class="attentionOnly ? 'bg-rose-50' : ''" @click="attentionOnly = !attentionOnly">
                  <ExclamationTriangleIcon class="h-4 w-4" aria-hidden="true" />Attention
                  <span v-if="attentionCount" class="rounded-full bg-rose-100 px-1.5 py-0.5 text-[11px]">{{ attentionCount }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ INVOICES ============ -->
        <div v-if="activeTab !== 'ledger' && activeTab !== 'reports'" class="relative min-h-[480px]" :aria-busy="isRefreshing">
          <div v-if="isRefreshing && !payables.length" class="space-y-2 p-5" aria-label="Loading payables">
            <div v-for="item in 6" :key="item" class="flex items-center gap-4">
              <div class="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
              <div class="flex-1 space-y-2"><div class="h-3 w-1/4 animate-pulse rounded bg-slate-100" /><div class="h-3 w-1/3 animate-pulse rounded bg-slate-50" /></div>
              <div class="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div v-else-if="loadError" class="p-10 text-center">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><ExclamationTriangleIcon class="h-6 w-6" aria-hidden="true" /></span>
            <h2 class="mt-4 text-base font-semibold text-slate-950">We could not load payables</h2>
            <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">{{ loadError }}</p>
            <button type="button" class="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="refresh">Try again</button>
          </div>
          <div v-else-if="!filteredPayables.length" class="min-h-[480px] px-6 py-14 text-center">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><DocumentTextIcon class="h-6 w-6" aria-hidden="true" /></span>
            <h2 class="mt-4 text-base font-semibold text-slate-950">{{ attentionOnly ? 'No invoices need attention' : hasActiveFilters ? 'No invoices match these filters' : 'No payables in this view' }}</h2>
            <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{{ attentionOnly ? 'Delayed snapshots and payment mismatches will appear here.' : hasActiveFilters ? 'Try a different search, widen the date range, or clear the filters.' : 'Synced supplier invoices will appear here when available.' }}</p>
            <button v-if="hasActiveFilters" type="button" class="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="clearFilters">Clear filters</button>
          </div>
          <div v-else>
            <div v-if="activeTab === 'to_pay' && selectedBatchIds.size" class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p class="text-sm text-slate-700"><span class="font-semibold text-slate-950">{{ selectedBatchIds.size }} invoice{{ selectedBatchIds.size === 1 ? '' : 's' }}</span> selected <span class="text-slate-500">· {{ formatMoney(selectedBatchTotal) }} total</span></p>
              <div class="flex items-center gap-2">
                <button type="button" class="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="clearBatchSelection">Clear</button>
                <button type="button" class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="selectedBatchIds.size < 2" @click="openBatchPayment">
                  <BanknotesIcon class="h-4 w-4" aria-hidden="true" />Settle selected
                </button>
              </div>
            </div>
            <div v-if="activeTab === 'to_pay' && supplierFilter === 'all' && !selectedBatchSupplier" class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs text-slate-500">
              <span class="font-semibold text-slate-700">Batch payment</span>
              <span>Choose a supplier above, or select an invoice to start a batch.</span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-[900px] w-full border-collapse">
                <colgroup>
                  <col v-if="activeTab === 'to_pay'" class="w-[44px]" />
                  <col class="w-[14%]" /><col class="w-[19%]" /><col class="w-[25%]" /><col class="w-[13%]" /><col class="w-[13%]" /><col class="w-[13%]" />
                  <col v-if="activeTab === 'to_pay'" class="w-[86px]" />
                </colgroup>
                <thead>
                  <tr class="border-b border-slate-200">
                    <th v-if="activeTab === 'to_pay'" scope="col" class="w-12 px-3 py-2.5 text-left">
                      <span class="relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-within:bg-slate-100">
                        <input type="checkbox" class="peer absolute inset-0 z-10 h-8 w-8 cursor-pointer opacity-0 disabled:cursor-not-allowed" :checked="allVisibleBatchSelected" :indeterminate="someVisibleBatchSelected" :disabled="batchSelectAllCandidates.length === 0" :title="batchSelectAllCandidates.length ? 'Select all visible invoices from this supplier' : 'Choose a supplier above, or select an invoice first'" :aria-label="batchSelectAllCandidates.length ? 'Select all visible invoices from this supplier' : 'Choose a supplier above, or select an invoice first'" @change="toggleAllVisibleBatch" />
                        <span class="pointer-events-none flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border bg-white text-white shadow-sm transition-all peer-checked:border-slate-950 peer-checked:bg-slate-950 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-950 peer-focus-visible:ring-offset-2 peer-disabled:border-slate-200 peer-disabled:bg-slate-100 peer-disabled:opacity-50" :class="someVisibleBatchSelected ? 'border-slate-950 bg-slate-950' : 'border-slate-300'" aria-hidden="true">
                          <CheckIcon v-if="allVisibleBatchSelected" class="h-3 w-3 stroke-[3]" />
                          <span v-else-if="someVisibleBatchSelected" class="h-0.5 w-2.5 rounded-full bg-white" />
                        </span>
                      </span>
                    </th>
                    <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Date</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Invoice</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Supplier</th>
                    <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Amount</th>
                    <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Paid</th>
                    <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Balance</th>
                    <th v-if="activeTab === 'to_pay'" scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400"><span class="sr-only">Pay invoice</span></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="payable in filteredPayables" :key="payable.id" tabindex="0" :aria-label="`Open invoice ${payable.supplierInvoiceNo || payable.invoiceId} from ${payable.supplierName || 'unnamed supplier'}`" :aria-selected="selectedBatchIds.has(payable.id)" class="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950" :class="selectedBatchIds.has(payable.id) ? 'bg-slate-50/80' : ''" @click="openPayable(payable.id)" @keydown.enter="openPayable(payable.id)" @keydown.space.prevent="openPayable(payable.id)">
                    <td v-if="activeTab === 'to_pay'" class="w-12 px-3 py-3.5 align-middle" @click.stop>
                      <span class="relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-within:bg-slate-100">
                        <input type="checkbox" class="peer absolute inset-0 z-10 h-8 w-8 cursor-pointer opacity-0 disabled:cursor-not-allowed" :checked="selectedBatchIds.has(payable.id)" :disabled="!canSelectForBatch(payable)" :title="selectedBatchSupplier && selectedBatchSupplier !== payableSupplierKey(payable) ? 'Selecting this invoice starts a new supplier batch' : 'Include in batch payment'" :aria-label="`Select ${payable.supplierInvoiceNo || payable.invoiceId} for batch payment`" @change="toggleBatchSelection(payable)" />
                        <span class="pointer-events-none flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-slate-300 bg-white text-white shadow-sm transition-all peer-checked:border-slate-950 peer-checked:bg-slate-950 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-950 peer-focus-visible:ring-offset-2 peer-disabled:border-slate-200 peer-disabled:bg-slate-100 peer-disabled:opacity-50" aria-hidden="true">
                          <CheckIcon v-if="selectedBatchIds.has(payable.id)" class="h-3 w-3 stroke-[3]" />
                        </span>
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-5 py-3 align-middle text-sm tabular-nums text-slate-500">{{ payableDate(payable) }}</td>
                    <td class="max-w-[210px] truncate px-4 py-3 align-middle text-sm text-slate-500" :title="payable.supplierInvoiceNo || payable.invoiceId">
                      {{ payable.supplierInvoiceNo || payable.invoiceId }}
                    </td>
                    <td class="max-w-[260px] truncate px-4 py-3 align-middle text-sm font-medium text-slate-900">{{ payable.supplierName || 'Unnamed supplier' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-right align-middle text-sm tabular-nums text-slate-500">{{ formatTableAmount(payable.invoiceAmountPesewas) }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-right align-middle text-sm tabular-nums text-emerald-700">{{ formatTableAmount(payable.amountPaidPesewas) }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-right align-middle text-sm font-semibold tabular-nums text-slate-950">{{ formatTableAmount(payable.balancePesewas) }}</td>
                    <td v-if="activeTab === 'to_pay'" class="px-4 py-3 text-right align-middle"><button v-if="canPay(payable)" type="button" class="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click.stop="openPaymentFor(payable.id)">Pay</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="divide-y divide-slate-100 md:hidden">
              <div v-for="payable in filteredPayables" :key="payable.id" role="button" tabindex="0" class="block w-full cursor-pointer px-4 py-4 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950" :class="selectedBatchIds.has(payable.id) ? 'bg-slate-50/80' : ''" @click="openPayable(payable.id)" @keydown.enter="openPayable(payable.id)" @keydown.space.prevent="openPayable(payable.id)">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 items-start gap-3">
                    <span v-if="activeTab === 'to_pay'" class="relative mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-within:bg-slate-100">
                      <input type="checkbox" class="peer absolute inset-0 z-10 h-8 w-8 cursor-pointer opacity-0 disabled:cursor-not-allowed" :checked="selectedBatchIds.has(payable.id)" :disabled="!canSelectForBatch(payable)" :title="selectedBatchSupplier && selectedBatchSupplier !== payableSupplierKey(payable) ? 'Selecting this invoice starts a new supplier batch' : 'Include in batch payment'" :aria-label="`Select ${payable.supplierInvoiceNo || payable.invoiceId} for batch payment`" @click.stop @change="toggleBatchSelection(payable)" />
                      <span class="pointer-events-none flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-slate-300 bg-white text-white shadow-sm transition-all peer-checked:border-slate-950 peer-checked:bg-slate-950 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-950 peer-focus-visible:ring-offset-2 peer-disabled:border-slate-200 peer-disabled:bg-slate-100 peer-disabled:opacity-50" aria-hidden="true">
                        <CheckIcon v-if="selectedBatchIds.has(payable.id)" class="h-3 w-3 stroke-[3]" />
                      </span>
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-slate-900">{{ payable.supplierName || 'Unnamed supplier' }}</p>
                      <p class="mt-0.5 truncate text-xs text-slate-500">{{ payable.supplierInvoiceNo || payable.invoiceId }} · {{ payableDate(payable) }}</p>
                    </div>
                  </div>
                  <p class="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-950">{{ formatTableAmount(payable.balancePesewas) }}</p>
                </div>
                <div class="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div><p class="text-slate-500">Amount</p><p class="mt-1 font-medium tabular-nums text-slate-800">{{ formatTableAmount(payable.invoiceAmountPesewas) }}</p></div>
                  <div><p class="text-slate-500">Paid</p><p class="mt-1 font-medium tabular-nums text-slate-800">{{ formatTableAmount(payable.amountPaidPesewas) }}</p></div>
                  <div><p class="text-slate-500">Balance</p><p class="mt-1 font-semibold tabular-nums text-slate-950">{{ formatTableAmount(payable.balancePesewas) }}</p></div>
                </div>
                <button v-if="activeTab === 'to_pay' && canPay(payable)" type="button" class="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click.stop="openPaymentFor(payable.id)">Record payment</button>
              </div>
            </div>
            <p class="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">Select an invoice to view its payment trail. For batch settlement, choose a supplier first or select an invoice, then use the header checkbox.</p>
          </div>
          <div v-if="isRefreshing && payables.length" class="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/55 pt-5"><span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"><ArrowPathIcon class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Loading page</span></div>
        </div>



        <!-- ============ LEDGER ============ -->
        <PayablesReportsPanel v-else-if="activeTab === 'reports'" />
        <div v-else-if="activeTab === 'ledger'" class="relative min-h-[480px]" :aria-busy="isRefreshing">
          <div v-if="isRefreshing && !payableLedgerEntries.length" class="space-y-2 p-5" aria-label="Loading payment ledger">
            <div v-for="item in 6" :key="item" class="flex items-center gap-4">
              <div class="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
              <div class="flex-1 space-y-2"><div class="h-3 w-1/4 animate-pulse rounded bg-slate-100" /><div class="h-3 w-1/3 animate-pulse rounded bg-slate-50" /></div>
              <div class="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div v-else-if="loadError" class="p-10 text-center">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><ExclamationTriangleIcon class="h-6 w-6" aria-hidden="true" /></span>
            <h2 class="mt-4 text-base font-semibold text-slate-950">We could not load the payment ledger</h2>
            <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">{{ loadError }}</p>
            <button type="button" class="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="refresh">Try again</button>
          </div>
          <div v-else-if="!payableLedgerEntries.length" class="min-h-[480px] px-6 py-14 text-center">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><BanknotesIcon class="h-6 w-6" aria-hidden="true" /></span>
            <h2 class="mt-4 text-base font-semibold text-slate-950">No supplier payments yet</h2>
            <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Payments posted against supplier invoices will appear here with the account used and the invoice they settled.</p>
          </div>
          <div v-else>
            <div class="flex flex-col gap-1 border-b border-slate-100 px-5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:px-6">
              <h2 class="text-sm font-semibold text-slate-950">Supplier payment ledger</h2>
              <p class="text-xs text-slate-400">Balance is the invoice balance after that payment · <span class="font-semibold tabular-nums text-slate-700">{{ formatMoney(payableLedgerSummary.totalPaid) }}</span> paid in this view</p>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-[900px] w-full border-collapse">
                <colgroup><col class="w-[13%]" /><col class="w-[18%]" /><col class="w-[21%]" /><col class="w-[16%]" /><col class="w-[14%]" /><col class="w-[9%]" /><col class="w-[9%]" /></colgroup>
                <thead>
                  <tr class="border-b border-slate-200">
                    <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Date</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Invoice</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Supplier</th>
                    <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Paid from</th>
                    <th scope="col" class="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-slate-400" title="Staff member who recorded the payment">Recorded by</th>
                    <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Payment</th>
                    <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="entry in payableLedgerEntries" :key="entry.id" tabindex="0" class="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950" :aria-label="`Open payment details for ${entry.supplierInvoiceNo || entry.invoiceId || 'supplier invoice'}`" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
                    <td class="whitespace-nowrap px-5 py-3 text-sm tabular-nums text-slate-500">{{ payableLedgerDate(entry.date) }}</td>
                    <td class="max-w-[220px] truncate px-4 py-3 text-sm text-slate-500" :title="entry.supplierInvoiceNo || entry.invoiceId || entry.reference">{{ entry.supplierInvoiceNo || entry.invoiceId || entry.reference }}</td>
                    <td class="max-w-[260px] truncate px-4 py-3 text-sm font-medium text-slate-900">{{ entry.supplierName || 'Supplier payment' }}</td>
                    <td class="max-w-[190px] truncate px-4 py-3 text-sm text-slate-500" :title="entry.accountName || entry.paymentMethod || 'Payment method'">{{ entry.accountName || entry.paymentMethod || 'Payment method' }}</td>
                    <td class="max-w-[170px] truncate px-4 py-3 text-sm text-slate-500" :title="entry.enteredBy || 'Not recorded'">{{ entry.enteredBy || 'Not recorded' }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(entry.paidAmount) }}</td>
                    <td class="whitespace-nowrap px-5 py-3 text-right text-sm tabular-nums text-slate-500">{{ formatMoney(entry.balance) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="divide-y divide-slate-100 md:hidden">
              <div v-for="entry in payableLedgerEntries" :key="`mobile-ledger-${entry.id}`" tabindex="0" class="cursor-pointer px-4 py-4 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-800">{{ entry.supplierName || 'Supplier payment' }}</p>
                    <p class="mt-0.5 truncate text-xs text-slate-500">{{ entry.supplierInvoiceNo || entry.invoiceId || entry.reference }} · {{ payableLedgerDate(entry.date) }}</p>
                  </div>
                  <p class="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(entry.paidAmount) }}</p>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div><p class="text-slate-500">Paid from</p><p class="mt-1 truncate font-medium text-slate-800">{{ entry.accountName || entry.paymentMethod || 'Payment method' }}</p></div>
                  <div class="text-right"><p class="text-slate-500">Balance</p><p class="mt-1 font-semibold tabular-nums text-slate-950">{{ formatMoney(entry.balance) }}</p></div>
                  <div class="col-span-2 border-t border-slate-100 pt-2"><p class="text-slate-500">Recorded by</p><p class="mt-1 truncate font-medium text-slate-800">{{ entry.enteredBy || 'Not recorded' }}</p></div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="isRefreshing && payableLedgerEntries.length" class="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/55 pt-5">
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"><ArrowPathIcon class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Loading ledger</span>
          </div>
        </div>



        <!-- Pagination -->
        <div class="min-h-[64px] border-t border-slate-200">
          <div v-if="activePagination.total > 0" class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p class="text-xs text-slate-500">Showing <span class="font-semibold tabular-nums text-slate-700">{{ pageStart }}–{{ pageEnd }}</span> of <span class="font-semibold tabular-nums text-slate-700">{{ activePagination.total }}</span> {{ activeTab === 'ledger' ? 'payments' : 'invoices' }}</p>
            <div class="flex items-center gap-1.5">
              <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40" :disabled="currentPage <= 1 || isRefreshing" aria-label="Previous page" @click="goToPage(currentPage - 1)">Previous</button>
              <span class="min-w-[92px] rounded-lg px-3 py-1.5 text-center text-xs font-medium tabular-nums text-slate-500">Page {{ currentPage }} of {{ totalPages }}</span>
              <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!activePagination.hasNext || isRefreshing" aria-label="Next page" @click="goToPage(currentPage + 1)">Next</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ============ DETAIL DIALOG ============ -->
    <UiDialog v-model:open="detailOpen">
      <UiDialogContent v-if="detailOpen && selectedPayable" class="!flex !max-h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] !max-w-[500px] !flex-col !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 sm:!max-w-[500px]">
        <template v-if="selectedPayable">
          <div class="flex min-h-0 w-full flex-col">
            <header class="border-b border-slate-200 px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <UiDialogTitle class="truncate text-base font-semibold text-slate-950">{{ selectedPayable.supplierName || 'Supplier invoice' }}</UiDialogTitle>
                  <UiDialogDescription class="mt-0.5 truncate text-xs text-slate-500">Invoice {{ selectedPayable.supplierInvoiceNo || selectedPayable.invoiceId }}</UiDialogDescription>
                </div>
                <span class="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold" :class="statusStyle(selectedPayable)">{{ statusLabel(selectedPayable) }}</span>
              </div>
            </header>

            <div class="overflow-y-auto px-6 py-5">
              <div class="space-y-2 text-sm">
                <div class="flex items-baseline justify-between gap-6">
                  <span class="text-slate-500">Invoice total</span>
                  <span class="font-medium tabular-nums text-slate-700">{{ formatPesewas(selectedPayable.invoiceAmountPesewas) }}</span>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <span class="text-slate-500">Paid to date</span>
                  <span class="font-medium tabular-nums text-emerald-700">&minus;{{ formatPesewas(selectedPayable.amountPaidPesewas) }}</span>
                </div>
                <div class="flex items-baseline justify-between gap-6 border-t border-slate-200 pt-2.5">
                  <span class="font-medium text-slate-900">{{ lifecycle(selectedPayable) === 'to_pay' ? 'Balance owing' : 'Balance' }}</span>
                  <span class="text-xl font-semibold tabular-nums text-slate-950">{{ formatPesewas(selectedPayable.balancePesewas) }}</span>
                </div>
              </div>

              <dl class="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Invoice date</dt>
                  <dd class="font-medium text-slate-800">{{ payableDate(selectedPayable) }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Due date</dt>
                  <dd class="font-medium" :class="detailOverdue ? 'text-rose-700' : selectedPayable.dueDate ? 'text-slate-800' : 'text-slate-400'">
                    {{ selectedPayable.dueDate ? payableLedgerDate(selectedPayable.dueDate) : '' }}<template v-if="detailOverdue"> · overdue</template><template v-else-if="!selectedPayable.dueDate">Not provided</template>
                  </dd>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Source</dt>
                  <dd class="font-medium text-slate-800">{{ selectedPayable.source === 'warehouse' ? 'Warehouse' : 'Store' }}</dd>
                </div>
              </dl>

              <div v-if="lifecycle(selectedPayable) !== 'to_pay'" class="mt-4 rounded-lg px-3.5 py-3" :class="payableStatusSummary(selectedPayable).className">
                <p class="text-sm font-semibold">{{ payableStatusSummary(selectedPayable).title }}</p>
                <p class="mt-0.5 text-xs leading-5 opacity-85">{{ payableStatusSummary(selectedPayable).description }}</p>
              </div>
            </div>

            <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
              <button type="button" class="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="detailOpen = false">Close</button>
              <button v-if="canPay(selectedPayable)" type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="openPayment">
                <BanknotesIcon class="mr-1.5 h-4 w-4" aria-hidden="true" />Pay
              </button>
            </footer>
          </div>
        </template>
      </UiDialogContent>
    </UiDialog>



    <!-- ============ LEDGER PAYMENT DETAIL DIALOG ============ -->
    <UiDialog v-model:open="ledgerDetailOpen">
      <UiDialogContent v-if="ledgerDetailOpen && selectedLedgerEntry" class="!flex !max-h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] !max-w-[560px] !flex-col !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 sm:!max-w-[560px]">
        <template v-if="selectedLedgerEntry">
          <div class="flex min-h-0 w-full flex-col">
            <header class="border-b border-slate-200 px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <UiDialogTitle class="truncate text-base font-semibold text-slate-950">{{ selectedLedgerEntry.supplierName || 'Supplier payment' }}</UiDialogTitle>
                  <UiDialogDescription class="mt-0.5 truncate text-xs text-slate-500">{{ selectedLedgerEntry.supplierInvoiceNo || selectedLedgerEntry.invoiceId || selectedLedgerEntry.reference }}</UiDialogDescription>
                </div>
                <p class="shrink-0 text-xl font-semibold tabular-nums text-slate-950">{{ formatMoney(selectedLedgerEntry.paidAmount) }}</p>
              </div>
            </header>

            <div class="overflow-y-auto px-6 py-5">
              <dl class="space-y-3 text-sm">
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Paid from</dt>
                  <dd class="text-right font-medium text-slate-800">{{ ledgerFundingLabel(selectedLedgerEntry) }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Payment method</dt>
                  <dd class="text-right font-medium text-slate-800">{{ ledgerMethodLabel(selectedLedgerEntry) }}</dd>
                </div>
                <div v-if="ledgerSubtypeLabel(selectedLedgerEntry)" class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Type</dt>
                  <dd class="text-right font-medium text-slate-800">{{ ledgerSubtypeLabel(selectedLedgerEntry) }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Invoice balance after</dt>
                  <dd class="font-semibold tabular-nums text-slate-950">{{ formatMoney(selectedLedgerEntry.balance) }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Paid on</dt>
                  <dd class="font-medium text-slate-800">{{ payableLedgerDate(selectedLedgerEntry.date) }}</dd>
                </div>
              </dl>

              <div v-if="selectedLedgerEntry.paymentContext?.fields?.length" class="mt-5 border-t border-slate-100 pt-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment details</p>
                <dl class="mt-3 space-y-2.5 text-sm">
                  <div v-for="field in selectedLedgerEntry.paymentContext?.fields || []" :key="field.key" class="flex items-baseline justify-between gap-6">
                    <dt class="text-slate-500">{{ field.label }}</dt>
                    <dd class="max-w-[62%] truncate text-right font-medium text-slate-800" :title="field.value">{{ field.value }}</dd>
                  </div>
                </dl>
              </div>

              <dl class="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Reference</dt>
                  <dd class="max-w-[62%] truncate text-right font-medium text-slate-800" :title="selectedLedgerEntry.reference">{{ selectedLedgerEntry.reference || 'Not provided' }}</dd>
                </div>
                <div v-if="selectedLedgerEntry.description" class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Note</dt>
                  <dd class="max-w-[62%] truncate text-right font-medium text-slate-800" :title="selectedLedgerEntry.description">{{ selectedLedgerEntry.description }}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Recorded by</dt>
                  <dd class="font-medium text-slate-800">{{ selectedLedgerEntry.enteredBy || 'Not recorded' }}</dd>
                </div>
                <div v-if="selectedLedgerEntry.batchId" class="flex items-baseline justify-between gap-6">
                  <dt class="text-slate-500">Batch</dt>
                  <dd class="max-w-[62%] truncate text-right font-medium text-slate-800" :title="selectedLedgerEntry.batchId">{{ selectedLedgerEntry.batchId }}</dd>
                </div>
              </dl>

              <div class="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p class="text-sm font-medium text-slate-800">{{ ledgerSyncLabel(selectedLedgerEntry) }}</p>
                <p class="mt-0.5 text-xs leading-5 text-slate-500">This payment remains linked to the supplier invoice and its Accounts record.</p>
              </div>
            </div>

            <footer class="flex shrink-0 justify-end border-t border-slate-200 bg-white px-6 py-3.5">
              <button type="button" class="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="ledgerDetailOpen = false">Close</button>
            </footer>
          </div>
        </template>
      </UiDialogContent>
    </UiDialog>


    <!-- ============ PAYMENT DIALOG ============ -->
    <UiDialog v-model:open="paymentOpen">
      <UiDialogContent v-if="paymentOpen && selectedPayable" class="!flex !max-h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] !max-w-[560px] !flex-col !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[560px]">
        <template v-if="selectedPayable">
          <div class="flex min-h-0 w-full flex-col">
            <header class="border-b border-slate-200 px-6 py-4">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <UiDialogTitle class="truncate text-base font-semibold text-slate-950">Pay {{ selectedPayable.supplierName || 'supplier' }}</UiDialogTitle>
                  <UiDialogDescription class="mt-0.5 truncate text-xs text-slate-500">{{ selectedPayable.supplierInvoiceNo || selectedPayable.invoiceId }} · {{ formatPesewas(selectedPayable.balancePesewas) }} outstanding</UiDialogDescription>
                </div>
                <p class="shrink-0 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(Number(paymentAmount) || 0) }}</p>
              </div>
            </header>

            <div class="overflow-y-auto px-6 py-5">
              <div class="flex items-center justify-between gap-3">
                <div class="inline-flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Payment source">
                  <button type="button" class="rounded-md px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" :class="paymentMode === 'account' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="setPaymentMode('account')">From account</button>
                  <button type="button" class="rounded-md px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" :class="paymentMode === 'method' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="setPaymentMode('method')">Method only</button>
                </div>
                <button type="button" class="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="paymentAmount = (amount(selectedPayable) / 100).toFixed(2)">Full balance</button>
              </div>

              <div class="mt-4 grid items-start gap-4 sm:grid-cols-[1fr_150px]">
                <div>
                  <label v-if="paymentMode === 'account'" for="payable-account" class="mb-1.5 block text-xs font-medium text-slate-600">From account</label>
                  <label v-else for="payable-method" class="mb-1.5 block text-xs font-medium text-slate-600">Payment method</label>
                  <UiSelect v-if="paymentMode === 'account'" v-model="paymentAccountId">
                    <UiSelectTrigger id="payable-account" class="h-10 border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue placeholder="Choose account" /></UiSelectTrigger>
                    <UiSelectContent>
                      <UiSelectItem v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }} · {{ formatMoney(account.currentBalance) }}</UiSelectItem>
                    </UiSelectContent>
                  </UiSelect>
                  <UiSelect v-else v-model="paymentMethod">
                    <UiSelectTrigger id="payable-method" class="h-10 border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue placeholder="Choose method" /></UiSelectTrigger>
                    <UiSelectContent>
                      <UiSelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">{{ method.name }}</UiSelectItem>
                    </UiSelectContent>
                  </UiSelect>
                  <p v-if="paymentAttempted && paymentErrorFor('account')" class="mt-1 text-xs text-rose-600">{{ paymentErrorFor('account') }}</p>
                  <p v-else-if="paymentAttempted && paymentMode === 'method' && paymentErrorFor('method')" class="mt-1 text-xs text-rose-600">{{ paymentErrorFor('method') }}</p>
                  <p v-else-if="paymentMode === 'account' && balanceAfterPayment !== null && balanceAfterPayment >= 0" class="mt-1 text-xs text-slate-500">Balance after: <span class="font-medium tabular-nums" :class="balanceAfterPayment < 0 ? 'text-rose-600' : 'text-slate-700'">{{ formatMoney(balanceAfterPayment) }}</span></p>
                </div>
                <div>
                  <label for="payable-amount" class="mb-1.5 block text-xs font-medium text-slate-600">Amount</label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true">GH₵</span>
                    <UiInput id="payable-amount" v-model="paymentAmount" inputmode="decimal" autocomplete="off" class="h-10 border-slate-200 pl-9 text-right text-sm font-medium tabular-nums focus-visible:ring-slate-950" placeholder="0.00" />
                  </div>
                  <p v-if="paymentErrorFor('amount')" class="mt-1 text-xs text-rose-600">{{ paymentErrorFor('amount') }}</p>
                </div>
              </div>

              <div v-if="paymentMode === 'account'" class="mt-4 flex items-center justify-between gap-3 border-y border-slate-100 py-2.5">
                <div class="min-w-0">
                  <p class="text-xs font-medium text-slate-600">How was the supplier paid? <span class="font-normal text-slate-400">Optional</span></p>
                  <p class="mt-0.5 truncate text-[11px] text-slate-400">Adds an audit detail without changing the account source.</p>
                </div>
                <UiSelect v-model="paymentMethod">
                  <UiSelectTrigger id="payable-account-method" class="h-9 w-[170px] shrink-0 border-slate-200 text-xs focus:ring-slate-950"><UiSelectValue placeholder="Add method" /></UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">{{ method.name }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>

              <p v-if="paymentMode === 'method'" class="mt-3 text-xs text-slate-500">Records the payment without changing an Accounts balance.</p>
              <p v-if="!syncedPaymentMethods.length" class="mt-3 text-xs text-slate-400">Payment methods are loaded from RigelOS after sync. Credit Payment remains available for customer-credit settlements.</p>

              <button v-if="!paymentDetailsOpen" type="button" class="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="paymentDetailsOpen = true">{{ paymentDetailsLabel }}</button>
              <div v-else class="mt-4 border-t border-slate-100 pt-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-medium text-slate-600">{{ selectedPaymentMethod ? `${selectedPaymentMethod.name} details` : 'Payment details' }}</p>
                  <button type="button" class="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="paymentDetailsOpen = false">Hide</button>
                </div>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <div v-if="paymentMethodSubtypes.length" class="sm:col-span-2">
                    <label for="payable-method-subtype" class="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
                    <UiSelect v-model="paymentMethodSubtypeId">
                      <UiSelectTrigger id="payable-method-subtype" class="h-9 border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue placeholder="Choose type" /></UiSelectTrigger>
                      <UiSelectContent>
                        <UiSelectItem v-for="subtype in paymentMethodSubtypes" :key="subtype.id" :value="subtype.id">{{ subtype.name }}</UiSelectItem>
                      </UiSelectContent>
                    </UiSelect>
                    <p v-if="paymentAttempted && !paymentMethodSubtypeId" class="mt-1 text-xs text-rose-600">Choose a type for this payment method.</p>
                  </div>
                  <div v-for="field in currentPaymentDetailFields" :key="field.key">
                    <label :for="`payable-detail-${field.key}`" class="mb-1.5 block text-xs font-medium text-slate-600">{{ field.label }} <span v-if="field.required" class="font-normal text-slate-400">Required</span></label>
                    <UiInput :id="`payable-detail-${field.key}`" v-model="paymentDetailValues[field.key]" :type="field.type" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" :placeholder="field.placeholder" />
                    <p v-if="paymentAttempted && field.required && !String(paymentDetailValues[field.key] || '').trim()" class="mt-1 text-xs text-rose-600">{{ field.label }} is required.</p>
                  </div>
                  <div :class="currentPaymentDetailFields.length ? '' : 'sm:col-span-2'">
                    <label for="payable-notes" class="mb-1.5 block text-xs font-medium text-slate-600">Note <span class="font-normal text-slate-400">Optional</span></label>
                    <UiInput id="payable-notes" v-model="paymentNotes" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" placeholder="Optional note" />
                  </div>
                </div>
              </div>
            </div>

            <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
              <button type="button" class="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="paymentOpen = false">Cancel</button>
              <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isSaving" @click="submitPayment">{{ isSaving ? 'Posting...' : 'Post payment' }}</button>
            </footer>
          </div>
          <div v-if="paymentSubmitError" class="border-t border-rose-200 bg-rose-50 px-6 py-2.5 text-xs text-rose-700">{{ paymentSubmitError }}</div>
        </template>
      </UiDialogContent>
    </UiDialog>



    <!-- ============ BATCH PAYMENT DIALOG ============ -->
    <UiDialog v-model:open="batchOpen">
      <UiDialogContent v-if="batchOpen" class="!flex !h-[min(640px,calc(100vh-2rem))] !w-[calc(100vw-2rem)] !max-w-[820px] !flex-col !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 sm:!max-w-[820px]">
        <div class="flex min-h-0 flex-1 flex-col">
          <header class="shrink-0 border-b border-slate-200 px-6 py-4">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <UiDialogTitle class="truncate text-base font-semibold text-slate-950">Pay {{ selectedBatchSupplierName || 'supplier' }}</UiDialogTitle>
                <UiDialogDescription class="mt-0.5 text-xs text-slate-500">{{ selectedBatchPayables.length }} invoice{{ selectedBatchPayables.length === 1 ? '' : 's' }} · applied to the oldest due first</UiDialogDescription>
              </div>
              <p class="shrink-0 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(batchAmountValue) }}</p>
            </div>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="border-b border-slate-200 px-6 pt-5">
              <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
                <div>
                  <label for="batch-account" class="mb-1.5 block text-xs font-medium text-slate-600">From account</label>
                  <UiSelect v-model="batchAccountId">
                    <UiSelectTrigger id="batch-account" class="h-10 border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue placeholder="Choose account" /></UiSelectTrigger>
                    <UiSelectContent>
                      <UiSelectItem v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }} · {{ formatMoney(account.currentBalance) }}</UiSelectItem>
                    </UiSelectContent>
                  </UiSelect>
                  <p v-if="batchAttempted && !batchAccountId" class="mt-1 text-xs text-rose-600">Choose an account</p>
                  <p v-else-if="selectedBatchAccount && batchAccountId" class="mt-1 text-xs text-slate-500">Balance after: <span class="font-medium tabular-nums" :class="selectedBatchAccountAfter !== null && selectedBatchAccountAfter < 0 ? 'text-rose-600' : 'text-slate-700'">{{ formatMoney(selectedBatchAccountAfter || 0) }}</span></p>
                </div>
                <div>
                  <div class="mb-1.5 flex items-center justify-between">
                    <label for="batch-amount" class="text-xs font-medium text-slate-600">Amount</label>
                    <button type="button" class="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="batchAmount = selectedBatchTotal.toFixed(2)">Full total</button>
                  </div>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true">GH₵</span>
                    <UiInput id="batch-amount" v-model="batchAmount" type="number" min="0.01" step="0.01" inputmode="decimal" autocomplete="off" class="h-10 border-slate-200 pl-9 text-right text-sm font-medium tabular-nums focus-visible:ring-slate-950" placeholder="0.00" />
                  </div>
                  <p v-if="batchAmountError" class="mt-1 text-xs text-rose-600">{{ batchAmountError }}</p>
                </div>
                <button type="button" class="mb-0.5 inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" :aria-expanded="batchDetailsOpen" @click.stop.prevent="toggleBatchDetails">
                  <span>{{ batchDetailsOpen ? 'Hide details' : 'Add details' }}</span>
                </button>
              </div>
              <div v-if="batchDetailsOpen" class="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <label for="batch-method" class="mb-1.5 block text-xs font-medium text-slate-600">Payment method <span class="font-normal text-slate-400">Optional</span></label>
                  <UiSelect v-model="batchPaymentMethod">
                    <UiSelectTrigger id="batch-method" class="h-9 border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue placeholder="Add method" /></UiSelectTrigger>
                    <UiSelectContent>
                      <UiSelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">{{ method.name }}</UiSelectItem>
                    </UiSelectContent>
                  </UiSelect>
                </div>
                <div v-if="batchPaymentMethodSubtypes.length">
                  <label for="batch-method-subtype" class="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
                  <UiSelect v-model="batchPaymentMethodSubtypeId">
                    <UiSelectTrigger id="batch-method-subtype" class="h-9 border-slate-200 text-sm focus:ring-slate-950"><UiSelectValue placeholder="Choose type" /></UiSelectTrigger>
                    <UiSelectContent>
                      <UiSelectItem v-for="subtype in batchPaymentMethodSubtypes" :key="subtype.id" :value="subtype.id">{{ subtype.name }}</UiSelectItem>
                    </UiSelectContent>
                  </UiSelect>
                </div>
                <div v-for="field in currentBatchPaymentDetailFields" :key="field.key">
                  <label :for="`batch-detail-${field.key}`" class="mb-1.5 block text-xs font-medium text-slate-600">{{ field.label }} <span v-if="field.required" class="font-normal text-slate-400">Required</span></label>
                  <UiInput :id="`batch-detail-${field.key}`" v-model="batchPaymentDetailValues[field.key]" :type="field.type" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" :placeholder="field.placeholder" />
                  <p v-if="batchAttempted && field.required && !String(batchPaymentDetailValues[field.key] || '').trim()" class="mt-1 text-xs text-rose-600">{{ field.label }} is required.</p>
                </div>
                <div>
                  <label for="batch-reference" class="mb-1.5 block text-xs font-medium text-slate-600">Reference</label>
                  <UiInput id="batch-reference" v-model="batchReference" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" placeholder="Optional" />
                </div>
                <div>
                  <label for="batch-description" class="mb-1.5 block text-xs font-medium text-slate-600">Note</label>
                  <UiInput id="batch-description" v-model="batchDescription" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" placeholder="Optional" />
                </div>
              </div>
              <p v-if="batchUnappliedPesewas > 0" class="mt-3 text-xs font-medium text-amber-700">{{ formatMoney(batchUnappliedPesewas / 100) }} will remain unapplied.</p>
            </div>

            <table class="w-full table-fixed">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="w-[34%] px-6 py-2.5 text-left text-xs font-medium text-slate-400">Invoice</th>
                  <th class="w-[16%] px-4 py-2.5 text-right text-xs font-medium text-slate-400">Due</th>
                  <th class="w-[18%] px-4 py-2.5 text-right text-xs font-medium text-slate-400">Balance</th>
                  <th class="w-[16%] px-4 py-2.5 text-right text-xs font-medium text-slate-400">Applied</th>
                  <th class="w-[16%] px-6 py-2.5 pl-4 text-right text-xs font-medium text-slate-400">Remaining</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="row in batchAllocationRows" :key="row.payable.id">
                  <td class="min-w-0 truncate px-6 py-3 text-sm font-medium text-slate-900" :title="row.payable.supplierInvoiceNo || row.payable.invoiceId">{{ row.payable.supplierInvoiceNo || row.payable.invoiceId }}</td>
                  <td class="px-4 py-3 text-right text-sm tabular-nums" :class="row.payable.dueDate ? 'text-slate-500' : 'text-slate-300'">{{ row.payable.dueDate ? payableLedgerDate(row.payable.dueDate) : '—' }}</td>
                  <td class="px-4 py-3 text-right text-sm tabular-nums text-slate-500">{{ formatMoney(row.balancePesewas / 100) }}</td>
                  <td class="px-4 py-3 text-right text-sm font-medium tabular-nums text-slate-900">{{ formatMoney(row.allocationPesewas / 100) }}</td>
                  <td class="px-6 py-3 pl-4 text-right">
                    <span v-if="!row.afterPesewas" class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckIcon class="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />Settled</span>
                    <span v-else class="text-sm tabular-nums text-slate-600">{{ formatMoney(row.afterPesewas / 100) }}</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200">
                  <td class="px-6 py-3 text-xs font-medium text-slate-400">Total</td>
                  <td class="px-4 py-3"></td>
                  <td class="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-800">{{ formatMoney(selectedBatchTotalPesewas / 100) }}</td>
                  <td class="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(batchAllocatedTotalPesewas / 100) }}</td>
                  <td class="px-6 py-3 pl-4 text-right text-sm font-semibold tabular-nums text-slate-800">{{ formatMoney(Math.max(0, selectedBatchTotalPesewas - batchAllocatedTotalPesewas) / 100) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-if="batchSubmitError" class="shrink-0 border-t border-rose-200 bg-rose-50 px-6 py-2.5 text-xs text-rose-700">{{ batchSubmitError }}</div>
          <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
            <button type="button" class="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="batchOpen = false">Cancel</button>
            <div class="flex items-center gap-4">
              <p v-if="selectedBatchAccount && batchAccountId" class="text-xs text-slate-500">{{ selectedBatchAccount.name }} · <span class="font-medium tabular-nums" :class="selectedBatchAccountAfter !== null && selectedBatchAccountAfter < 0 ? 'text-rose-600' : 'text-slate-700'">{{ formatMoney(selectedBatchAccountAfter || 0) }}</span> after</p>
              <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isSaving" @click="submitBatchPayment">{{ isSaving ? 'Posting...' : 'Post payment' }}</button>
            </div>
          </footer>
        </div>
      </UiDialogContent>
    </UiDialog>
    <!-- ============ CONFIRM DIALOG ============ -->
    <UiDialog v-model:open="confirmOpen" data-print-hide>
      <UiDialogContent v-if="confirmOpen && confirmDetails" :close-disabled="isConfirming" class="!flex !flex-col !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[420px]">
        <div class="px-6 py-6 sm:px-7">
          <div class="flex items-start gap-3.5">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <QuestionMarkCircleIcon class="h-5 w-5" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <UiDialogTitle class="text-base font-semibold text-slate-950">{{ confirmDetails?.title }}</UiDialogTitle>
              <p v-if="confirmDetails?.amount" class="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(confirmDetails.amount) }}</p>
              <UiDialogDescription class="mt-1.5 text-sm leading-6 text-slate-500">{{ confirmDetails?.message }}</UiDialogDescription>
            </div>
          </div>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" :disabled="isConfirming" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 disabled:opacity-60" @click="cancelConfirm">Cancel</button>
          <button type="button" :disabled="isConfirming" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60" @click="runConfirm">{{ isConfirming ? 'Posting…' : (confirmDetails?.confirmLabel || 'Confirm') }}</button>
        </div>
      </UiDialogContent>
    </UiDialog>

    <!-- ============ SUCCESS DIALOG ============ -->
    <UiDialog v-model:open="successOpen" data-print-hide>
      <UiDialogContent v-if="successOpen && successDetails" class="!flex !flex-col !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[420px]">
        <div class="px-6 py-7 text-center sm:px-8">
          <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircleIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <UiDialogTitle class="mt-4 text-base font-semibold text-slate-950">{{ successDetails?.title }}</UiDialogTitle>
          <p v-if="successDetails?.amount" class="mt-1.5 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(successDetails.amount) }}</p>
          <UiDialogDescription class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{{ successDetails?.message }}</UiDialogDescription>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950" @click="dismissSuccess">Close</button>
          <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800" @click="viewLedgerFromSuccess">View ledger</button>
        </div>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowPathIcon, BanknotesIcon, BellIcon, BuildingOffice2Icon, CheckCircleIcon, CheckIcon, DocumentTextIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
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
const statusStyle = (payable: PayableSummary) => ({ attention: 'border-rose-200 bg-rose-50 text-rose-700', to_pay: 'border-slate-200 bg-slate-50 text-slate-700', awaiting: 'border-amber-200 bg-amber-50 text-amber-800', settled: 'border-emerald-200 bg-emerald-50 text-emerald-700' }[lifecycle(payable)])
const attentionMessage = (payable: PayableSummary) => {
  if (payable.paymentActionStatus === 'failed') return 'Rigel OS could not apply this recorded payment. Do not record it again; refresh after the issue has been resolved or contact support with this invoice number.'
  if (payable.syncStatus === 'needs_reconciliation' || payable.paymentConfirmationStatus === 'needs_reconciliation') return 'This invoice is waiting for a newer Rigel OS snapshot to reconcile the mismatch. Do not record another payment; it will become available again automatically once the confirmed snapshot arrives.'
  return ''
}
const canPay = (payable: PayableSummary) => lifecycle(payable) === 'to_pay' && amount(payable) > 0
const payableStatusSummary = (payable: PayableSummary) => {
  const state = lifecycle(payable)
  if (state === 'settled') return { title: 'Paid in full', description: 'This invoice has no balance remaining.', className: 'border-emerald-200 bg-emerald-50 text-emerald-900' }
  if (state === 'awaiting') return { title: 'Payment recorded', description: 'This payment has been recorded from your account. It will move to Settled when RigelOS updates the invoice.', className: 'border-amber-200 bg-amber-50 text-amber-900' }
  if (state === 'attention') return { title: 'Needs attention', description: attentionMessage(payable) || 'This invoice needs review before another payment can be recorded.', className: 'border-rose-200 bg-rose-50 text-rose-900' }
  return { title: 'Ready to pay', description: `${formatPesewas(payable.balancePesewas)} is outstanding. Choose the account you want to pay from.`, className: 'border-slate-200 bg-slate-50 text-slate-800' }
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

<style scoped>
.sync-pop-enter-active,
.sync-pop-leave-active {
  transition: opacity 150ms ease, transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}
.sync-pop-enter-from,
.sync-pop-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-4px);
}

.sync-wait {
  animation: sync-wait-pulse 2.2s ease-in-out infinite;
}
@keyframes sync-wait-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sync-pop-enter-active,
  .sync-pop-leave-active {
    transition-duration: 1ms;
  }

  .sync-wait {
    animation: none;
  }
}
</style>
