<template>
  <div class="min-h-full bg-transparent">
    <UiDialog v-model:open="successModalOpen" data-print-hide>
      <UiDialogContent class="ad-dlg ad-dlg-sm !flex !flex-col !gap-0 !p-0 !border-0">
        <div class="ad-dlg-body ad-center">
          <span class="ad-tick" aria-hidden="true"><CheckIcon class="ad-ico" /></span>
          <UiDialogTitle class="ad-dlg-title">{{ successModal?.title }}</UiDialogTitle>
          <p v-if="successModal?.amount" class="ad-big">{{ formatMoney(successModal.amount) }}</p>
          <UiDialogDescription class="ad-dlg-sub ad-wrap">{{ successModal?.message }}</UiDialogDescription>
        </div>
        <footer class="ad-dlg-foot">
          <span class="ad-dlg-meta" />
          <div class="ad-dlg-actions">
            <button type="button" class="ad-btn ad-btn-quiet" @click="dismissSuccessModal">Close</button>
            <button type="button" class="ad-btn ad-btn-primary" @click="focusLedgerFromSuccess">View ledger</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>

    <UiDialog v-model:open="confirmationModalOpen" data-print-hide>
      <UiDialogContent class="ad-dlg ad-dlg-sm !flex !flex-col !gap-0 !p-0 !border-0">
        <div class="ad-dlg-body ad-center">
          <span v-if="confirmationTone === 'danger'" class="ad-tick is-danger" aria-hidden="true"><ExclamationTriangleIcon class="ad-ico" /></span>
          <UiDialogTitle class="ad-dlg-title">{{ confirmationModal?.title }}</UiDialogTitle>
          <p v-if="confirmationModal?.amount" class="ad-big">{{ formatMoney(confirmationModal.amount) }}</p>
          <UiDialogDescription class="ad-dlg-sub ad-wrap">{{ confirmationModal?.message }}</UiDialogDescription>
        </div>
        <footer class="ad-dlg-foot">
          <span class="ad-dlg-meta" />
          <div class="ad-dlg-actions">
            <button type="button" :disabled="isConfirming" class="ad-btn ad-btn-quiet" @click="cancelConfirmation">Cancel</button>
            <button type="button" :disabled="isConfirming" class="ad-btn" :class="confirmationTone === 'danger' ? 'ad-btn-danger-fill' : 'ad-btn-primary'" @click="confirmPendingAction">{{ isConfirming ? 'Working…' : (confirmationModal?.confirmLabel || 'Confirm') }}</button>
          </div>
        </footer>
      </UiDialogContent>
    </UiDialog>
    <div v-if="isLoading" class="ad" aria-busy="true" aria-label="Loading account">
      <div class="ad-skel ad-skel-head" />
      <div class="ad-skel ad-skel-strip" />
      <div class="ad-skel ad-skel-card" />
    </div>

    <div v-else-if="error" class="ad">
      <section class="ad-panel" role="alert">
        <ExclamationTriangleIcon class="ad-panel-ico is-err" aria-hidden="true" />
        <h1>Could not load account</h1>
        <p>{{ error }}</p>
        <div class="ad-panel-actions">
          <button type="button" class="ad-btn ad-btn-quiet" @click="loadCurrentAccount">Try again</button>
          <NuxtLink :to="accountsPath" class="ad-btn ad-btn-primary">Back to accounts</NuxtLink>
        </div>
      </section>
    </div>

    <div v-else-if="account" data-ledger-print-root class="ad">
      <div data-ledger-print-document class="hidden">
        <div class="print-document__masthead">
          <div>
            <p class="print-document__eyebrow">MedsGH / Accounts</p>
            <h1 class="print-document__title">Account ledger</h1>
            <p class="print-document__account-name">{{ account.name }}</p>
          </div>
          <div class="print-document__meta">
            <div><span>Generated</span><strong>{{ printGeneratedAt }}</strong></div>
            <div><span>Scope</span><strong>{{ ledgerPrintScope }}</strong></div>
          </div>
        </div>

        <div class="print-document__account-details">
          <div><span>Account type</span><strong>{{ accountTypeLabels[account.type] }}</strong></div>
          <div><span>Branch</span><strong>{{ account.branch || '-' }}</strong></div>
          <div><span>Account number</span><strong>{{ account.metadata?.accountNumber || '-' }}</strong></div>
          <div><span>Statement period</span><strong>{{ ledgerPrintPeriod }}</strong></div>
        </div>

        <div class="print-document__summary">
          <div><span>Opening balance</span><strong>{{ formatMoney(account.openingBalance) }}</strong></div>
          <div><span>Current balance</span><strong>{{ formatMoney(account.currentBalance) }}</strong></div>
          <div><span>Money in</span><strong>{{ formatMoney(printTotals.moneyIn) }}</strong></div>
          <div><span>Money out</span><strong>{{ formatMoney(printTotals.moneyOut) }}</strong></div>
        </div>

        <div class="print-document__section-heading">
          <div>
            <h2>Ledger entries</h2>
            <p>{{ isLoanAccount ? 'Loans received and repayments recorded against this loan.' : 'Credits and debits recorded against this account.' }}</p>
          </div>
          <strong>{{ visibleLedger.length }} {{ visibleLedger.length === 1 ? 'entry' : 'entries' }}</strong>
        </div>

        <table v-if="visibleLedger.length" class="print-document__table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Recorded by</th>
              <th>Source</th>
              <th>Status</th>
              <th class="is-amount">{{ isLoanAccount ? 'Received (GH₵)' : 'Money in (GH₵)' }}</th>
              <th class="is-amount">{{ isLoanAccount ? 'Repaid (GH₵)' : 'Money out (GH₵)' }}</th>
              <th class="is-amount">{{ isLoanAccount ? 'Outstanding (GH₵)' : 'Balance (GH₵)' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in visibleLedger" :key="`print-${entry.id}`">
              <td>{{ formatDate(entry.date) }}</td>
              <td>{{ ledgerReferenceLabel(entry) }}</td>
              <td>{{ recordedByLabel(entry) }}</td>
              <td>{{ ledgerSourceLabel(entry) }}<span v-if="ledgerSourceDetail(entry)">{{ ledgerSourceDetail(entry) }}</span></td>
              <td>{{ statusLabel(entry.status) }}</td>
              <td class="is-amount">{{ entry.moneyIn ? formatLedgerAmount(entry.moneyIn) : '-' }}</td>
              <td class="is-amount">{{ entry.moneyOut ? formatLedgerAmount(entry.moneyOut) : '-' }}</td>
              <td class="is-amount">{{ formatLedgerAmount(entry.runningBalance) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="print-document__empty">No ledger entries match the selected view.</p>

        <div class="print-document__footer">
          <span>Prepared from the account ledger</span>
          <span>{{ account.status === 'active' ? 'Active account' : 'Inactive account' }}</span>
        </div>
      </div>

      <header data-print-hide class="ad-head">
        <nav class="ad-crumb" aria-label="Breadcrumb">
          <NuxtLink :to="accountsPath">Accounts</NuxtLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{{ account.name }}</span>
        </nav>
        <div class="ad-titlebar">
          <div class="ad-id">
            <span class="ad-glyph"><component :is="accountIcon(account.type)" aria-hidden="true" /></span>
            <div class="ad-name">
              <h1>{{ account.name }}<span class="ad-tag">{{ accountTypeLabels[account.type] }}</span></h1>
              <p>{{ accountSubtitle(account) }}</p>
            </div>
          </div>
          <div v-if="isLoanAccount" class="ad-actions">
            <button type="button" class="ad-btn ad-btn-quiet" @click="openLoanModal('repaid')"><ArrowUpIcon class="ad-ico" aria-hidden="true" />Repay</button>
            <button type="button" class="ad-btn ad-btn-primary" @click="openLoanModal('received')"><ArrowDownIcon class="ad-ico" aria-hidden="true" />Receive loan</button>
          </div>
          <div v-else class="ad-actions">
            <button type="button" class="ad-btn ad-btn-quiet" @click="openMoneyOutModal"><ArrowUpIcon class="ad-ico" aria-hidden="true" />Debit</button>
            <button type="button" class="ad-btn ad-btn-primary" @click="openMoneyInModal"><ArrowDownIcon class="ad-ico" aria-hidden="true" />Credit</button>
          </div>
        </div>
      </header>

      <dl data-print-hide class="ad-summary" aria-label="Summary">
        <div>
          <dt>{{ isLoanAccount ? 'Outstanding' : 'Balance' }}</dt>
          <dd class="ad-lead"><small>GH₵</small>{{ splitMoney(account.currentBalance).neg ? '−' : '' }}{{ splitMoney(account.currentBalance).int }}<span>{{ splitMoney(account.currentBalance).dec }}</span></dd>
        </div>
        <div>
          <dt>{{ isLoanAccount ? 'Received' : 'Money in' }}</dt>
          <dd class="ad-val">{{ formatMoney(account.moneyIn) }}</dd>
        </div>
        <div>
          <dt>{{ isLoanAccount ? 'Repaid' : 'Money out' }}</dt>
          <dd class="ad-val">{{ formatMoney(account.moneyOut) }}</dd>
        </div>
        <div>
          <dt>Last activity</dt>
          <dd class="ad-val" :class="{ 'is-none': !account.lastMovementAt }" :title="account.lastMovementAt ? formatDate(account.lastMovementAt) : undefined">{{ relativeWhen(account.lastMovementAt) }}</dd>
        </div>
      </dl>

      <section v-if="actionalCheques.length || isLoadingCheques" data-print-hide class="ad-card ad-cheques" aria-label="Pending cheques">
        <header class="ad-chead">
          <h2>Pending cheques</h2>
          <span class="ad-count">{{ actionalCheques.length }}</span>
        </header>
        <p v-if="chequeError" class="ad-card-err">{{ chequeError }}</p>
        <div v-if="isLoadingCheques" class="ad-chq-skel"><span class="ad-skel" /><span class="ad-skel" /></div>
        <ul v-else class="ad-chq-list">
          <li v-for="cheque in actionalCheques" :key="cheque.id">
            <div class="ad-chq-main">
              <b>Cheque {{ cheque.chequeNumber }}</b>
              <i>{{ [cheque.bankName, cheque.drawerName].filter(Boolean).join(' · ') || 'No bank details' }}<template v-if="cheque.expectedClearanceDate"> · due {{ cheque.expectedClearanceDate }}</template></i>
            </div>
            <span class="ad-chq-amt">{{ formatMoney(cheque.amount) }}</span>
            <div class="ad-chq-actions">
              <button type="button" :disabled="isSaving" class="ad-btn ad-btn-quiet ad-btn-sm" @click="requestChequeAction('deposit', cheque.id)">Deposit</button>
              <button type="button" :disabled="isSaving" class="ad-btn ad-btn-quiet ad-btn-sm" @click="requestChequeAction('clear', cheque.id)">Clear</button>
              <button type="button" :disabled="isSaving" class="ad-btn ad-btn-danger ad-btn-sm" @click="requestChequeAction('bounce', cheque.id)">Bounce</button>
            </div>
          </li>
        </ul>
      </section>

      <section data-ledger-print-section class="ad-card ad-ledger">
        <div data-print-hide class="ad-lhead">
          <div class="ad-ltitle">
            <h2>Ledger</h2>
            <span class="ad-count" aria-label="Entries shown">{{ visibleLedger.length }}</span>
            <span v-if="account.pendingReview > 0" class="ad-pend"><i aria-hidden="true" />{{ account.pendingReview }} to review</span>
          </div>
          <div class="ad-licons">
            <button type="button" :disabled="isRefreshing" class="ad-icon" aria-label="Refresh ledger" title="Refresh ledger" :aria-busy="isRefreshing" @click="refreshCurrentAccount">
              <ArrowPathIcon class="ad-ico" :class="{ 'ad-spin': isRefreshing }" aria-hidden="true" />
            </button>
            <button type="button" class="ad-icon" aria-label="Print ledger" title="Print ledger" @click="printLedger">
              <PrinterIcon class="ad-ico" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p v-if="refreshError" data-print-hide role="status" class="ad-inline-err">
          {{ refreshError }}
          <button type="button" @click="refreshCurrentAccount">Try again</button>
        </p>

        <div data-print-hide class="ad-ltools">
          <div class="ad-lrow">
            <label class="ad-search">
              <MagnifyingGlassIcon class="ad-ico" aria-hidden="true" />
              <input v-model="ledgerSearch" type="search" placeholder="Search" aria-label="Search ledger" autocomplete="off">
            </label>
            <UiSelect v-model="ledgerDatePreset" @update:model-value="applyLedgerDatePreset">
              <UiSelectTrigger aria-label="Ledger period" class="h-9 w-[150px] rounded-lg border-slate-200 bg-white text-[13px] font-medium text-slate-700 focus:ring-slate-950"><UiSelectValue placeholder="All time" /></UiSelectTrigger>
              <UiSelectContent :body-lock="false">
                <UiSelectItem v-for="option in ledgerPeriodOptions" :key="option.value" :value="option.value">{{ option.label }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
            <button type="button" class="ad-filterbtn" :class="{ 'is-on': ledgerMoreFiltersOpen || ledgerAdvancedFilterCount }" :aria-expanded="ledgerMoreFiltersOpen" aria-controls="ledger-advanced-filters" @click="ledgerMoreFiltersOpen = !ledgerMoreFiltersOpen">
              <FunnelIcon class="ad-ico" aria-hidden="true" />
              Filters<span v-if="ledgerAdvancedFilterCount">{{ ledgerAdvancedFilterCount }}</span>
            </button>
          </div>
          <div class="ad-extra space-y-3">
            <div v-if="ledgerDatePreset === 'custom'" class="flex flex-wrap items-center gap-2">
              <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span>From</span>
                <UiDatePicker v-model="ledgerFromDate" aria-label="Ledger from date" class="h-9 w-[148px] text-sm" @update:model-value="ledgerDatePreset = 'custom'" />
              </label>
              <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span>To</span>
                <UiDatePicker v-model="ledgerToDate" aria-label="Ledger to date" class="h-9 w-[148px] text-sm" @update:model-value="ledgerDatePreset = 'custom'" />
              </label>
            </div>

            <div v-if="ledgerMoreFiltersOpen" id="ledger-advanced-filters" class="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              <div class="space-y-1">
                <span class="text-xs font-medium text-slate-600">Movement</span>
                <UiSelect v-model="ledgerDirection">
                  <UiSelectTrigger aria-label="Ledger movement filter" class="h-9 rounded-lg border-slate-200 bg-white text-sm focus:ring-slate-950"><UiSelectValue placeholder="All movements" /></UiSelectTrigger>
                  <UiSelectContent :body-lock="false">
                    <UiSelectItem value="all">All movements</UiSelectItem>
                    <UiSelectItem value="in">{{ isLoanAccount ? 'Loan received' : 'Money in' }}</UiSelectItem>
                    <UiSelectItem value="out">{{ isLoanAccount ? 'Repayments' : 'Money out' }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div class="space-y-1">
                <span class="text-xs font-medium text-slate-600">Payment method</span>
                <UiSelect v-model="ledgerMethod">
                  <UiSelectTrigger aria-label="Ledger payment method filter" class="h-9 rounded-lg border-slate-200 bg-white text-sm focus:ring-slate-950"><UiSelectValue placeholder="All methods" /></UiSelectTrigger>
                  <UiSelectContent :body-lock="false">
                    <UiSelectItem value="all">All methods</UiSelectItem>
                    <UiSelectItem v-for="method in ledgerPaymentMethodOptions" :key="method" :value="method">{{ paymentMethodLabel(method) }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div class="space-y-1">
                <span class="text-xs font-medium text-slate-600">Status</span>
                <UiSelect v-model="ledgerStatus">
                  <UiSelectTrigger aria-label="Ledger status filter" class="h-9 rounded-lg border-slate-200 bg-white text-sm focus:ring-slate-950"><UiSelectValue placeholder="All statuses" /></UiSelectTrigger>
                  <UiSelectContent :body-lock="false">
                    <UiSelectItem value="all">All statuses</UiSelectItem>
                    <UiSelectItem v-for="status in ledgerStatusOptions" :key="status" :value="status">{{ statusLabel(status) }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
            </div>

            <div v-if="ledgerActiveFilterChips.length" class="flex flex-wrap items-center gap-2">
              <button
                v-for="chip in ledgerActiveFilterChips"
                :key="chip.key"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                @click="chip.clear()"
              >
                <span>{{ chip.label }}</span>
                <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
                <span class="sr-only">Remove {{ chip.label }}</span>
              </button>
              <button type="button" class="text-xs font-semibold text-slate-700 underline underline-offset-4 transition hover:text-slate-950" @click="clearLedgerFilters">Clear all</button>
            </div>

          </div>
          <p v-if="ledgerDateRangeInvalid" class="ad-inline-err">The from date cannot be after the to date.</p>
        </div>

        <div v-if="isLoadingLedger" data-print-hide class="ad-lskel" aria-label="Loading ledger">
          <div v-for="item in 5" :key="item"><span class="ad-skel" /><span class="ad-skel" /><span class="ad-skel" /></div>
        </div>
        <div v-else-if="ledger.length === 0" data-print-hide class="ad-lempty">
          <DocumentTextIcon class="ad-panel-ico" aria-hidden="true" />
          <h3>No entries yet</h3>
          <div class="ad-panel-actions">
            <button type="button" class="ad-btn ad-btn-quiet" @click="openMoneyOutModal">Record debit</button>
            <button type="button" class="ad-btn ad-btn-primary" @click="openMoneyInModal">Record credit</button>
          </div>
        </div>
        <div v-else-if="visibleLedger.length === 0" data-print-hide class="ad-lempty">
          <MagnifyingGlassIcon class="ad-panel-ico" aria-hidden="true" />
          <h3>No matches</h3>
          <button type="button" class="ad-link" @click="clearLedgerFilters">Clear filters</button>
        </div>

        <template v-else>
          <div data-ledger-print-table class="ad-tablewrap">
            <table class="ad-table">
              <colgroup>
                <col style="width: 11%"><col style="width: 29%"><col style="width: 15%"><col style="width: 15%"><col style="width: 10%"><col style="width: 10%"><col style="width: 10%">
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Recorded by</th>
                  <th scope="col">Source</th>
                  <th scope="col" class="r">{{ isLoanAccount ? 'Received' : 'Money in' }}</th>
                  <th scope="col" class="r">{{ isLoanAccount ? 'Repaid' : 'Money out' }}</th>
                  <th scope="col" class="r">{{ isLoanAccount ? 'Outstanding' : 'Balance' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in visibleLedger" :key="entry.id" tabindex="0" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
                  <td class="ad-dim">{{ shortDate(entry.date) }}</td>
                  <td><b class="ad-cut ad-ref" :title="entry.reference || ledgerEntrySummary(entry)">{{ ledgerReferenceLabel(entry) }}</b></td>
                  <td>
                    <span class="ad-cut ad-dim" :title="recordedByLabel(entry)">{{ recordedByLabel(entry) }}</span>
                    <em v-if="entry.status !== 'posted'" class="ad-status" :class="`is-${entry.status}`">{{ statusLabel(entry.status) }}</em>
                  </td>
                  <td>
                    <span class="ad-cut" :title="ledgerSourceLabel(entry)">{{ ledgerSourceLabel(entry) }}</span>
                    <small v-if="ledgerSourceDetail(entry)" class="ad-cut ad-dim">{{ ledgerSourceDetail(entry) }}</small>
                  </td>
                  <td class="r ad-amt" :class="{ 'is-none': !entry.moneyIn }">{{ entry.moneyIn ? `+${formatLedgerAmount(entry.moneyIn)}` : '—' }}</td>
                  <td class="r ad-amt" :class="{ 'is-none': !entry.moneyOut }">{{ entry.moneyOut ? `−${formatLedgerAmount(entry.moneyOut)}` : '—' }}</td>
                  <td class="r ad-amt ad-bal">{{ formatLedgerAmount(entry.runningBalance) }}</td>
                </tr>
              </tbody>
            </table>
            <p class="ad-foot">Balance is the running account total.</p>
          </div>

          <div data-print-hide class="ad-mlist">
            <button v-for="entry in visibleLedger" :key="`mobile-ledger-${entry.id}`" type="button" class="ad-mrow" @click="openLedgerEntry(entry)">
              <span class="ad-mtop">
                <b class="ad-cut" :title="entry.reference || ledgerEntrySummary(entry)">{{ ledgerReferenceLabel(entry) }}</b>
                <span class="ad-amt">{{ entry.moneyIn ? `+${formatLedgerAmount(entry.moneyIn)}` : `−${formatLedgerAmount(entry.moneyOut)}` }}</span>
              </span>
              <span class="ad-msub">
                <span class="ad-cut">{{ ledgerSourceLabel(entry) }} · {{ shortDate(entry.date) }}<template v-if="entry.status !== 'posted'"> · {{ statusLabel(entry.status) }}</template></span>
                <span class="ad-amt">{{ formatLedgerAmount(entry.runningBalance) }}</span>
              </span>
            </button>
            <p class="ad-foot">Balance is the running account total.</p>
          </div>

          <div data-ledger-print-table class="hidden">
            <table class="w-full table-fixed">
              <colgroup>
                <col class="w-[35%]" />
                <col class="w-[22%]" />
                <col class="w-[17%]" />
                <col class="w-[13%]" />
                <col class="w-[13%]" />
              </colgroup>
              <thead class="border-b border-slate-200 bg-slate-50/90">
                <tr>
                  <th scope="col" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Recorded by</th>
                  <th scope="col" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Source</th>
                  <th scope="col" class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{{ isLoanAccount ? 'Received (GH₵)' : 'Money in (GH₵)' }}</th>
                  <th scope="col" class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{{ isLoanAccount ? 'Repaid (GH₵)' : 'Money out (GH₵)' }}</th>
                  <th scope="col" class="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{{ isLoanAccount ? 'Outstanding (GH₵)' : 'Balance (GH₵)' }}</th>
                </tr>
              </thead>
              <tbody v-for="group in ledgerDateGroups" :key="group.date" class="border-b border-slate-200 last:border-b-0">
                <tr class="bg-slate-50/60">
                  <th colspan="5" scope="rowgroup" class="px-5 py-2.5 text-left">
                    <span class="text-xs font-semibold text-slate-800">{{ ledgerDateGroupLabel(group.date) }}</span>
                    <span v-if="group.date" class="ml-2 text-xs text-slate-500">{{ ledgerDateGroupDate(group.date) }}</span>
                    <span class="ml-2 text-[11px] font-medium text-slate-400">{{ group.entries.length }} {{ group.entries.length === 1 ? 'entry' : 'entries' }}</span>
                  </th>
                </tr>
                <tr v-for="entry in group.entries" :key="entry.id" class="group cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950" tabindex="0" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
                  <td class="px-4 py-3.5 align-middle">
                    <span class="block truncate text-sm text-slate-700">{{ recordedByLabel(entry) }}</span>
                    <span v-if="entry.status !== 'posted'" class="ad-tag ad-tag-row" :class="statusBadgeClass(entry.status)"><i aria-hidden="true" />{{ statusLabel(entry.status) }}</span>
                  </td>
                  <td class="px-4 py-3.5 align-middle">
                     <span class="inline-flex max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{{ ledgerSourceLabel(entry) }}</span>
                    <span v-if="ledgerSourceDetail(entry)" class="mt-1 block truncate text-xs text-slate-500">{{ ledgerSourceDetail(entry) }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-right align-middle text-sm font-semibold tabular-nums text-emerald-700">
                    <span>{{ entry.moneyIn ? formatLedgerAmount(entry.moneyIn) : '—' }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-right align-middle text-sm font-semibold tabular-nums text-amber-700">
                    <span>{{ entry.moneyOut ? formatLedgerAmount(entry.moneyOut) : '—' }}</span>
                  </td>
                  <td class="px-5 py-3.5 text-right align-middle text-sm font-semibold tabular-nums text-slate-950">
                    <span>{{ formatLedgerAmount(entry.runningBalance) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">Balance is the account total after each entry, not a filtered-period balance.</p>
          </div>

          <div data-print-hide class="hidden">
            <section v-for="group in ledgerDateGroups" :key="`mobile-${group.date}`" class="border-b border-slate-200 last:border-b-0">
              <div class="flex items-baseline gap-2 bg-slate-50/60 px-4 py-2.5">
                <h3 class="text-xs font-semibold text-slate-800">{{ ledgerDateGroupLabel(group.date) }}</h3>
                <span v-if="group.date" class="text-xs text-slate-500">{{ ledgerDateGroupDate(group.date) }}</span>
              </div>
              <button v-for="entry in group.entries" :key="entry.id" type="button" class="flex w-full items-start gap-3 border-t border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none" @click="openLedgerEntry(entry)">
                <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="entry.moneyIn ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"><ArrowDownIcon v-if="entry.moneyIn" class="h-4 w-4" aria-hidden="true" /><ArrowUpIcon v-else class="h-4 w-4" aria-hidden="true" /></span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-start justify-between gap-3">
                    <span class="min-w-0" :title="entry.reference || ledgerEntrySummary(entry)">
                      <span class="block truncate text-sm font-semibold text-slate-950">{{ ledgerReferenceDisplay(entry) }}</span>
                    </span>
                  <span class="shrink-0 text-sm font-semibold tabular-nums" :class="entry.moneyIn ? 'text-emerald-700' : 'text-amber-700'">{{ formatLedgerAmount(entry.moneyIn || entry.moneyOut) }}</span>
                  </span>
                  <span class="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                     <span class="min-w-0 truncate">{{ ledgerSourceLabel(entry) }}<template v-if="ledgerSourceDetail(entry)"> · {{ ledgerSourceDetail(entry) }}</template></span>
                    <span class="shrink-0 font-medium tabular-nums text-slate-700">Bal. {{ formatLedgerAmount(entry.runningBalance) }}</span>
                  </span>
                  <span class="mt-1 block truncate text-xs text-slate-500"><span class="font-medium text-slate-700">Recorded by:</span> {{ recordedByLabel(entry) }}<span v-if="entry.status !== 'posted'"> · {{ statusLabel(entry.status) }}</span></span>
                </span>
                <ChevronRightIcon class="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            </section>
            <p class="px-4 py-3 text-xs text-slate-500">Balance is the account total after each entry, not a filtered-period balance.</p>
          </div>
        </template>
      </section>
    </div>

    <div v-else class="ad">
      <section class="ad-panel">
        <ExclamationTriangleIcon class="ad-panel-ico" aria-hidden="true" />
        <h1>Account not found</h1>
        <p>It may have been removed.</p>
        <NuxtLink :to="accountsPath" class="ad-btn ad-btn-primary">Back to accounts</NuxtLink>
      </section>
    </div>
  </div>

  <UiDialog v-model:open="ledgerDetailOpen" data-print-hide>
    <UiDialogContent class="ad-dlg ad-dlg-narrow !flex !flex-col !gap-0 !p-0 !border-0">
      <template v-if="selectedLedgerEntry">
        <header class="ad-dlg-head">
          <div class="ad-dlg-headrow">
            <div class="ad-minw">
              <UiDialogTitle class="ad-dlg-title">{{ ledgerEntrySummary(selectedLedgerEntry) }}</UiDialogTitle>
              <UiDialogDescription class="ad-dlg-sub">{{ formatDate(selectedLedgerEntry.date) }} · {{ ledgerSourceLabel(selectedLedgerEntry) }}</UiDialogDescription>
            </div>
            <span class="ad-tag" :class="statusBadgeClass(selectedLedgerEntry.status)"><i aria-hidden="true" />{{ statusLabel(selectedLedgerEntry.status) }}</span>
          </div>
        </header>

        <div class="ad-dlg-body ad-dlg-scroll">
          <dl class="ad-kv">
            <div class="ad-kv-amount">
              <dt>{{ isLoanAccount ? (selectedLedgerEntry.moneyIn ? 'Loan received' : 'Repayment recorded') : (selectedLedgerEntry.moneyIn ? 'Credit' : 'Debit') }}</dt>
              <dd>{{ selectedLedgerEntry.moneyIn ? '+' : '−' }}{{ formatMoney(selectedLedgerEntry.moneyIn || selectedLedgerEntry.moneyOut) }}</dd>
            </div>
            <div class="ad-kv-total">
              <dt>Balance after entry</dt>
              <dd>{{ formatMoney(selectedLedgerEntry.runningBalance) }}</dd>
            </div>
          </dl>

          <dl class="ad-kv ad-kv-soft">
            <div><dt>Reference</dt><dd :class="{ 'is-none': !selectedLedgerEntry.reference }">{{ selectedLedgerEntry.reference || 'None' }}</dd></div>
            <div v-if="ledgerPaymentMethodDisplay(selectedLedgerEntry)"><dt>Payment method</dt><dd>{{ ledgerPaymentMethodDisplay(selectedLedgerEntry) }}</dd></div>
            <div><dt>Recorded by</dt><dd>{{ recordedByLabel(selectedLedgerEntry) }}</dd></div>
            <div><dt>Entry source</dt><dd>{{ ledgerSourceLabel(selectedLedgerEntry) }}<template v-if="ledgerSourceDetail(selectedLedgerEntry)"><span class="ad-kv-sub"> · {{ ledgerSourceDetail(selectedLedgerEntry) }}</span></template></dd></div>
          </dl>

          <div v-if="ledgerDescription(selectedLedgerEntry)" class="ad-block">
            <p class="ad-kv-head">Description</p>
            <p>{{ ledgerDescription(selectedLedgerEntry) }}</p>
          </div>

          <div v-if="selectedLedgerEntry.metadata?.context" class="ad-block">
            <p class="ad-kv-head">Context</p>
            <p>{{ selectedLedgerEntry.metadata.context }}</p>
          </div>

          <div v-if="selectedLedgerEntry.paymentContext?.fields?.length" class="ad-block">
            <p class="ad-kv-head">Payment details</p>
            <dl class="ad-kv">
              <div v-for="field in selectedLedgerEntry.paymentContext?.fields || []" :key="field.key"><dt>{{ field.label }}</dt><dd class="ad-cut" :title="field.value">{{ field.value }}</dd></div>
            </dl>
          </div>

          <dl v-if="ledgerAdditionalDetails(selectedLedgerEntry).length" class="ad-kv ad-kv-soft">
            <div v-for="detail in ledgerAdditionalDetails(selectedLedgerEntry)" :key="detail.key"><dt>{{ detail.label }}</dt><dd>{{ detail.value }}</dd></div>
          </dl>

          <div v-if="selectedLedgerEntry.sourceLinks?.length" class="ad-block">
            <p class="ad-kv-head">Linked records</p>
            <ul class="ad-links">
              <li v-for="link in selectedLedgerEntry.sourceLinks" :key="`${link.sourceType}-${link.sourceKey}`">
                <span><b>{{ link.sourceKey }}</b><i>{{ link.sourceType.replace('_', ' ') }}</i></span>
                <strong>{{ formatMoney(link.amount) }}</strong>
              </li>
            </ul>
          </div>
        </div>

        <p v-if="reversalError" class="ad-dlg-error" role="alert">{{ reversalError }}</p>
        <footer class="ad-dlg-foot">
          <button v-if="selectedLedgerEntry.status === 'posted'" type="button" :disabled="isReversing" class="ad-btn ad-btn-danger" @click="requestReverseSelectedEntry">
            <ArrowPathIcon v-if="isReversing" class="ad-ico ad-spin" aria-hidden="true" />
            {{ isReversing ? 'Reversing…' : 'Reverse' }}
          </button>
          <span v-else class="ad-dlg-meta" />
          <div class="ad-dlg-actions"><button type="button" class="ad-btn ad-btn-quiet" @click="ledgerDetailOpen = false">Close</button></div>
        </footer>
      </template>
    </UiDialogContent>
  </UiDialog>

  <UiDialog v-model:open="moneyInModalOpen" data-print-hide>
    <UiDialogContent class="ad-dlg ad-dlg-wide !flex !flex-col !gap-0 !p-0 !border-0">
      <header class="ad-dlg-head">
        <UiDialogTitle class="ad-dlg-title">Credit</UiDialogTitle>
        <UiDialogDescription class="ad-dlg-sub">{{ account?.name }} · Balance {{ formatMoney(Number(account?.currentBalance || 0)) }}</UiDialogDescription>
      </header>

      <div v-if="usesPaymentGuide" class="ad-dlg-body ad-dlg-fill">
        <div class="ad-grid ad-grid-3">
          <div class="ad-field">
            <UiLabel for="money-in-amount" class="ad-lbl">Amount received</UiLabel>
            <UiInput id="money-in-amount" v-model="moneyInForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" :aria-invalid="isMoneyInFieldInvalid('amount')" class="ad-in ad-in-num" @blur="touchMoneyInField('amount')" />
            <p v-if="isMoneyInFieldInvalid('amount')" class="ad-err">{{ moneyInErrors.amount }}</p>
          </div>
          <div class="ad-field">
            <UiLabel for="money-in-reference" class="ad-lbl">Reference <span class="ad-opt-tag">optional</span></UiLabel>
            <UiInput id="money-in-reference" v-model="moneyInForm.reference" placeholder="Deposit slip, batch or note" class="ad-in" />
          </div>
          <div class="ad-field">
            <UiLabel for="money-in-note" class="ad-lbl">Recipient <span class="ad-opt-tag">optional</span></UiLabel>
            <UiInput id="money-in-note" v-model="moneyInForm.description" placeholder="Customer, payer or source" class="ad-in" />
          </div>
        </div>

        <section v-if="isChequeSelected" class="ad-chq-panel" aria-label="Cheque details">
          <div class="ad-grid ad-grid-3">
            <div class="ad-field">
              <UiLabel for="money-in-cheque-number" class="ad-lbl">Cheque number</UiLabel>
              <UiInput id="money-in-cheque-number" v-model="chequeForm.number" placeholder="e.g. 000184" :aria-invalid="isMoneyInFieldInvalid('chequeNumber')" class="ad-in" @blur="touchMoneyInField('chequeNumber')" />
              <p v-if="isMoneyInFieldInvalid('chequeNumber')" class="ad-err">{{ moneyInErrors.chequeNumber }}</p>
            </div>
            <div class="ad-field">
              <UiLabel for="money-in-cheque-due" class="ad-lbl">Cheque due date</UiLabel>
              <UiInput id="money-in-cheque-due" v-model="chequeForm.dueDate" type="date" :aria-invalid="isMoneyInFieldInvalid('chequeDueDate')" class="ad-in" @blur="touchMoneyInField('chequeDueDate')" />
              <p v-if="isMoneyInFieldInvalid('chequeDueDate')" class="ad-err">{{ moneyInErrors.chequeDueDate }}</p>
            </div>
            <div class="ad-field">
              <UiLabel for="money-in-cheque-bank" class="ad-lbl">Bank <span class="ad-opt-tag">optional</span></UiLabel>
              <UiInput id="money-in-cheque-bank" v-model="chequeForm.bank" placeholder="Issuing bank" class="ad-in" />
            </div>
          </div>
          <p class="ad-chq-note" :class="{ 'is-future': isPostDatedCheque }">
            <template v-if="isPostDatedCheque">Post-dated cheque. It stays pending and the amount reflects on the account balance on {{ formatDate(chequeForm.dueDate) }}.</template>
            <template v-else>Due today or earlier, so the amount reflects on the account balance straight away.</template>
          </p>
        </section>

        <section class="ad-pick">
          <div class="ad-pick-head">
            <div>
              <h3>How was this paid?</h3>
              <p>{{ isChequeSelected ? 'Cheques are credited on their own, because they reflect on their due date.' : 'Select every method included in this credit.' }}</p>
            </div>
            <div class="ad-range">
              <UiInput v-model="guideFromDate" type="date" aria-label="Guide from date" class="ad-in ad-in-sm" />
              <span>to</span>
              <UiInput v-model="guideToDate" type="date" aria-label="Guide to date" class="ad-in ad-in-sm" />
            </div>
          </div>
          <div ref="moneyInScrollRegion" class="ad-pick-list">
            <p v-if="creditGuideError" class="ad-pick-msg ad-pick-msg-err">{{ creditGuideError }}</p>
            <div v-else-if="isLoadingCandidates" class="ad-pick-skel"><span v-for="item in 5" :key="item" /></div>
            <template v-else-if="creditGuideMethods.length">
              <div v-for="item in creditGuideMethods" :key="item.id" class="ad-opt" :class="{ 'is-on': isPaymentMethodSelected(item.id) }">
                <input :id="paymentMethodInputId(item.id)" type="checkbox" :checked="isPaymentMethodSelected(item.id)" class="ad-check" @change="togglePaymentMethod(item.id, $event)">
                <label :for="paymentMethodInputId(item.id)">
                  <span class="ad-opt-name">{{ item.label }}</span>
                  <span class="ad-opt-meta">{{ formatMoney(item.amount) }} so far · {{ item.entries }} {{ item.entries === 1 ? 'payment' : 'payments' }}</span>
                </label>
              </div>
            </template>
            <p v-else class="ad-pick-msg">No payment methods are available yet.</p>
          </div>
        </section>
      </div>

      <div v-else ref="moneyInScrollRegion" class="ad-dlg-body ad-dlg-scroll">
        <div class="ad-grid ad-grid-2">
          <div class="ad-field">
            <UiLabel for="money-in-source" class="ad-lbl">Credit source</UiLabel>
            <UiSelect v-model="moneyInForm.source">
              <UiSelectTrigger id="money-in-source" class="ad-in ad-sel">
                <UiSelectValue />
              </UiSelectTrigger>
              <UiSelectContent :body-lock="false">
                <UiSelectItem v-for="option in moneyInSourceOptions" :key="option.value" :value="option.value">{{ option.label }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
          <div v-if="supportsSyncedCredits" class="ad-field">
            <UiLabel for="money-in-sync-date" class="ad-lbl">{{ moneyInForm.source === 'sales' ? 'Sales date' : (moneyInForm.source === 'cheque' ? 'Cheque date' : 'Payment date') }}</UiLabel>
            <UiInput id="money-in-sync-date" v-model="moneyInSyncDate" type="date" class="ad-in" />
          </div>
        </div>

        <div v-if="supportsSyncedCredits" class="ad-synced">
          <div v-if="moneyInGroupingOptions.length" class="ad-field">
            <span class="ad-lbl">{{ moneyInForm.source === 'sales' ? 'Group sales by' : 'Group payments by' }}</span>
            <div role="tablist" :aria-label="moneyInForm.source === 'sales' ? 'Group sales by' : 'Group payments by'" class="ad-seg">
              <button
                v-for="option in moneyInGroupingOptions"
                :key="option.value"
                type="button"
                role="tab"
                :aria-selected="moneyInCandidateGroupBy === option.value"
                :aria-pressed="moneyInCandidateGroupBy === option.value"
                class="ad-seg-btn"
                :class="{ 'is-on': moneyInCandidateGroupBy === option.value }"
                @click="changeMoneyInCandidateGroup(option.value)"
              >{{ option.label }}</button>
            </div>
          </div>

          <div ref="moneyInCandidatesPanel" class="ad-cand-panel" :style="{ minHeight: `${moneyInCandidatePanelHeight}px` }">
            <div v-if="creditCandidatesError" class="ad-cand-state ad-cand-state-err">
              <ExclamationTriangleIcon class="ad-ico" aria-hidden="true" />
              <span>{{ creditCandidatesError }}</span>
            </div>
            <div v-else-if="isLoadingCandidates" class="ad-cand-state">
              <span class="ad-spin-dot" aria-hidden="true" />
              <span>Loading…</span>
            </div>
            <div v-else-if="moneyInCandidateGroupBy === 'total'" class="ad-cand-total">
              <span class="ad-lbl">Available to post</span>
              <strong>{{ formatMoney(creditCandidates?.summary.availableAmount ?? creditCandidates?.summary.totalAmount ?? 0) }}</strong>
              <div v-if="selectedCreditCandidate?.paymentBreakdown?.length" class="ad-crumbs">
                <span v-for="breakdown in selectedCreditCandidate.paymentBreakdown" :key="breakdown.method"><b>{{ paymentMethodLabel(breakdown.method) }}</b> {{ formatMoney(breakdown.amount) }}</span>
              </div>
              <p v-if="selectedCreditCandidate && candidateContext(selectedCreditCandidate)">{{ candidateContext(selectedCreditCandidate) }}</p>
            </div>
            <div v-else class="ad-cand-list">
              <template v-if="creditCandidates?.candidates.length">
                <button
                  v-for="candidate in creditCandidates.candidates"
                  :key="candidate.id"
                  type="button"
                  class="ad-cand"
                  :class="{ 'is-on': selectedCreditCandidateId === candidate.id }"
                  @click="applyCreditCandidate(candidate.id)"
                >
                  <span class="ad-radio" aria-hidden="true"><i v-if="selectedCreditCandidateId === candidate.id" /></span>
                  <span class="ad-cand-main">
                    <span class="ad-opt-name">{{ candidate.label }}</span>
                    <span v-if="candidate.paymentBreakdown?.length" class="ad-crumbs">
                      <span v-for="breakdown in candidate.paymentBreakdown" :key="breakdown.method"><b>{{ paymentMethodLabel(breakdown.method) }}</b> {{ formatMoney(breakdown.amount) }}</span>
                    </span>
                    <span v-if="candidateContext(candidate)" class="ad-opt-meta">{{ candidateContext(candidate) }}</span>
                  </span>
                  <span class="ad-cand-amt">{{ formatMoney(candidate.amount) }}</span>
                </button>
              </template>
              <p v-else class="ad-pick-msg">No {{ candidateGroupLabel.toLowerCase() }} found for this date.</p>
            </div>
          </div>
        </div>

        <p v-if="isMoneyInFieldInvalid('candidate')" class="ad-err">Select a synced source before posting this credit.</p>

        <div class="ad-grid ad-grid-2">
          <div class="ad-field">
            <UiLabel for="money-in-amount" class="ad-lbl">Amount</UiLabel>
            <UiInput id="money-in-amount" v-model="moneyInForm.amount" type="number" min="0.01" step="0.01" :max="supportsSyncedCredits ? selectedCreditCandidate?.amount : undefined" placeholder="0.00" :aria-invalid="isMoneyInFieldInvalid('amount')" class="ad-in ad-in-num" @blur="touchMoneyInField('amount')" />
            <p v-if="isMoneyInFieldInvalid('amount')" class="ad-err">{{ moneyInErrors.amount }}</p>
            <p v-else-if="supportsSyncedCredits && selectedCreditCandidate" class="ad-hint">Up to {{ formatMoney(selectedCreditCandidate.amount) }} from this selection.</p>
          </div>
          <div class="ad-field">
            <UiLabel for="money-in-reference" class="ad-lbl">{{ selectedMoneyInSource.referenceLabel }}</UiLabel>
            <UiInput id="money-in-reference" v-model="moneyInForm.reference" :placeholder="selectedMoneyInSource.referencePlaceholder" :aria-invalid="isMoneyInFieldInvalid('reference')" class="ad-in" @blur="touchMoneyInField('reference')" />
            <p v-if="isMoneyInFieldInvalid('reference')" class="ad-err">{{ moneyInErrors.reference }}</p>
          </div>
          <div class="ad-field ad-span2">
            <UiLabel for="money-in-note" class="ad-lbl">Recipient <span v-if="!isMoneyInFieldInvalid('description')" class="ad-opt-tag">optional</span></UiLabel>
            <UiInput id="money-in-note" v-model="moneyInForm.description" :placeholder="selectedMoneyInSource.descriptionPlaceholder" :aria-invalid="isMoneyInFieldInvalid('description')" class="ad-in" @blur="touchMoneyInField('description')" />
            <p v-if="isMoneyInFieldInvalid('description')" class="ad-err">{{ moneyInErrors.description }}</p>
          </div>
          <div class="ad-field ad-span2">
            <UiLabel for="money-in-context" class="ad-lbl">{{ selectedMoneyInSource.contextLabel }} <span class="ad-opt-tag">optional</span></UiLabel>
            <UiInput id="money-in-context" v-model="moneyInForm.context" :placeholder="selectedMoneyInSource.contextPlaceholder" class="ad-in" />
          </div>
        </div>
      </div>

      <p v-if="moneyInError" class="ad-dlg-error" role="alert">{{ moneyInError }}</p>
      <footer class="ad-dlg-foot">
        <span class="ad-dlg-meta"><template v-if="usesPaymentGuide">{{ selectedPaymentMethodCount }} {{ selectedPaymentMethodCount === 1 ? 'method' : 'methods' }} selected</template></span>
        <div class="ad-dlg-actions">
          <button type="button" class="ad-btn ad-btn-quiet" @click="closeMoneyInModal">Cancel</button>
          <button type="button" class="ad-btn ad-btn-primary" :disabled="!canSubmitMoneyIn || isSaving || isLoadingCandidates" @click="submitMoneyIn">
            {{ isSaving ? 'Posting…' : (usesPaymentGuide ? 'Add money' : `Post ${selectedMoneyInSource.label.toLowerCase()}`) }}
          </button>
        </div>
      </footer>
    </UiDialogContent>
  </UiDialog>

  <UiDialog v-model:open="moneyOutModalOpen" data-print-hide>
    <UiDialogContent class="ad-dlg ad-dlg-narrow !flex !flex-col !gap-0 !p-0 !border-0">
      <header class="ad-dlg-head">
        <UiDialogTitle class="ad-dlg-title">Debit</UiDialogTitle>
        <UiDialogDescription class="ad-dlg-sub">{{ account?.name }} · Balance {{ formatMoney(Number(account?.currentBalance || 0)) }}</UiDialogDescription>
      </header>

      <div class="ad-dlg-body ad-dlg-scroll">
        <div class="ad-grid ad-grid-2">
          <div class="ad-field ad-span2">
            <UiLabel for="money-out-source" class="ad-lbl">Debit reason</UiLabel>
            <UiSelect v-model="moneyOutForm.source">
              <UiSelectTrigger id="money-out-source" class="ad-in ad-sel">
                <UiSelectValue />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="option in moneyOutSourceOptions" :key="option.value" :value="option.value">{{ option.label }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <div v-if="isSupplierPayment" class="ad-field ad-span2">
            <UiLabel for="supplier-payable" class="ad-lbl">Supplier invoice</UiLabel>
            <UiSelect v-model="selectedPayableId">
              <UiSelectTrigger id="supplier-payable" class="ad-in ad-sel">
                <UiSelectValue placeholder="Select an outstanding invoice" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="payable in payables" :key="payable.id" :value="payable.id">{{ payable.supplierName || 'Supplier' }} · {{ payable.supplierInvoiceNo || payable.invoiceId }} · {{ formatPayableAmount(payable.balancePesewas) }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
            <p v-if="payablesError" class="ad-err">{{ payablesError }}</p>
            <p v-else-if="!payables.length" class="ad-hint">No outstanding payables have been synced yet.</p>
            <p v-else-if="selectedPayable" class="ad-hint">{{ selectedPayable.source === 'warehouse' ? 'Warehouse' : 'Store' }} invoice · {{ formatPayableAmount(selectedPayable.balancePesewas) }} remaining</p>
            <p v-if="isMoneyOutFieldInvalid('payable')" class="ad-err">{{ moneyOutErrors.payable }}</p>
          </div>

          <div class="ad-field">
            <UiLabel for="money-out-amount" class="ad-lbl">Amount</UiLabel>
            <UiInput id="money-out-amount" v-model="moneyOutForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" :aria-invalid="isMoneyOutFieldInvalid('amount')" class="ad-in ad-in-num" @blur="touchMoneyOutField('amount')" />
            <p v-if="isMoneyOutFieldInvalid('amount')" class="ad-err">{{ moneyOutErrors.amount }}</p>
            <p v-if="isMoneyOutFieldInvalid('balance')" class="ad-err">{{ moneyOutErrors.balance }}</p>
            <p v-if="isMoneyOutFieldInvalid('payableBalance')" class="ad-err">{{ moneyOutErrors.payableBalance }}</p>
          </div>
          <div class="ad-field">
            <UiLabel for="money-out-reference" class="ad-lbl">{{ selectedMoneyOutSource.referenceLabel }} <span class="ad-opt-tag">optional</span></UiLabel>
            <UiInput id="money-out-reference" v-model="moneyOutForm.reference" :placeholder="selectedMoneyOutSource.referencePlaceholder" class="ad-in" />
          </div>
          <div class="ad-field ad-span2">
            <UiLabel for="money-out-note" class="ad-lbl">{{ selectedMoneyOutSource.descriptionLabel }}</UiLabel>
            <UiInput id="money-out-note" v-model="moneyOutForm.description" :placeholder="selectedMoneyOutSource.descriptionPlaceholder" :aria-invalid="isMoneyOutFieldInvalid('description')" class="ad-in" @blur="touchMoneyOutField('description')" />
            <p v-if="isMoneyOutFieldInvalid('description')" class="ad-err">{{ moneyOutErrors.description }}</p>
          </div>
          <div class="ad-field ad-span2">
            <UiLabel for="money-out-context" class="ad-lbl">{{ selectedMoneyOutSource.contextLabel }} <span class="ad-opt-tag">optional</span></UiLabel>
            <UiInput id="money-out-context" v-model="moneyOutForm.context" :placeholder="selectedMoneyOutSource.contextPlaceholder" class="ad-in" />
          </div>
        </div>
      </div>

      <p v-if="moneyOutError" class="ad-dlg-error" role="alert">{{ moneyOutError }}</p>
      <footer class="ad-dlg-foot">
        <span class="ad-dlg-meta">Balance after <b :class="{ 'is-neg': Number(account?.currentBalance || 0) - Number(moneyOutForm.amount || 0) < 0 }">{{ formatMoney(Number(account?.currentBalance || 0) - Number(moneyOutForm.amount || 0)) }}</b></span>
        <div class="ad-dlg-actions">
          <button type="button" class="ad-btn ad-btn-quiet" @click="closeMoneyOutModal">Cancel</button>
          <button type="button" class="ad-btn ad-btn-primary" :disabled="!canSubmitMoneyOut || isSaving" @click="submitMoneyOut">{{ isSaving ? 'Recording…' : 'Post debit' }}</button>
        </div>
      </footer>
    </UiDialogContent>
  </UiDialog>

  <UiDialog v-model:open="loanModalOpen" data-print-hide>
    <UiDialogContent class="ad-dlg ad-dlg-narrow !flex !flex-col !gap-0 !p-0 !border-0">
      <template v-if="account">
        <header class="ad-dlg-head">
          <UiDialogTitle class="ad-dlg-title">{{ loanDirection === 'received' ? 'Receive loan' : 'Make repayment' }}</UiDialogTitle>
          <UiDialogDescription class="ad-dlg-sub">{{ account.name }} · {{ loanDirection === 'received' ? 'Money borrowed from this lender' : 'Money paid back to this lender' }}</UiDialogDescription>
        </header>

        <div class="ad-dlg-body ad-dlg-scroll">
          <div class="ad-grid ad-grid-2">
            <div class="ad-field">
              <UiLabel for="loan-amount" class="ad-lbl">Amount</UiLabel>
              <UiInput id="loan-amount" v-model="loanForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" class="ad-in ad-in-num" />
              <p v-if="loanFieldError()" class="ad-err">{{ loanFieldError() }}</p>
            </div>
            <div class="ad-field">
              <UiLabel for="loan-reference" class="ad-lbl">Reference <span class="ad-opt-tag">optional</span></UiLabel>
              <UiInput id="loan-reference" v-model="loanForm.reference" placeholder="Agreement or receipt number" class="ad-in" />
            </div>
            <div class="ad-field ad-span2">
              <UiLabel for="loan-description" class="ad-lbl">Recipient <span class="ad-opt-tag">optional</span></UiLabel>
              <UiInput id="loan-description" v-model="loanForm.description" :placeholder="loanDirection === 'received' ? 'Lender or person providing the loan' : 'Lender or person receiving repayment'" class="ad-in" />
            </div>
          </div>
          <p class="ad-hint">Recorded on this loan ledger only. No other account balance changes.</p>
        </div>

        <p v-if="loanError" class="ad-dlg-error" role="alert">{{ loanError }}</p>
        <footer class="ad-dlg-foot">
          <span class="ad-dlg-meta" />
          <div class="ad-dlg-actions">
            <button type="button" class="ad-btn ad-btn-quiet" @click="loanModalOpen = false">Cancel</button>
            <button type="button" class="ad-btn ad-btn-primary" :disabled="isSaving" @click="submitLoanMovement">{{ isSaving ? 'Recording…' : (loanDirection === 'received' ? 'Record loan received' : 'Record repayment') }}</button>
          </div>
        </footer>
      </template>
    </UiDialogContent>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  ScaleIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import type { AccountSummary, AccountType, CreditCandidate, LedgerEntry, MoneyInSource, MoneyOutSource, PaymentAllocation } from '~/services/types'
import { useAccountsWorkbench } from '~/composables/useAccountsWorkbench'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
})

const route = useRoute()
const companyStore = useCompanyStore()
const pharmacy = computed(() => String(route.params.pharmacy || 'company'))
const accountsPath = computed(() => `/${pharmacy.value}/services/accounts`)

const {
  accountTypeLabels,
  cheques,
  chequeAction,
  creditCandidates,
  creditGuide,
  currentAccount,
  error,
  formatDate,
  formatMoney,
  isLoading,
  isLoadingLedger,
  isRefreshing,
  isLoadingCheques,
  isLoadingCandidates,
  isSaving,
  ledgerEntries,
  loadAccount,
  loadAccounts,
  loadCheques,
  loadCreditCandidates,
  loadCreditGuide,
  loadPayables,
  payables,
  postMoneyIn,
  receiveCheque,
  postMoneyOut,
  postLoanReceived,
  postLoanRepayment,
  reverseLedgerEntry,
  sourceLabels,
} = useAccountsWorkbench()

const accountId = computed(() => String(route.params.id || ''))
const account = computed(() => currentAccount.value)
const ledger = computed(() => ledgerEntries.value)
const isLoanAccount = computed(() => account.value?.type === 'loan')

const moneyInModalOpen = ref(false)
const moneyOutModalOpen = ref(false)
const loanModalOpen = ref(false)
const loanDirection = ref<'received' | 'repaid'>('received')
const loanForm = ref({ amount: '', reference: '', description: '' })
const loanError = ref('')
const refreshError = ref('')
type AccountSuccessModal = { title: string, message: string, amount?: number }
const successModalOpen = ref(false)
const successModal = ref<AccountSuccessModal | null>(null)
type AccountConfirmation = { title: string, message: string, confirmLabel: string, tone?: 'default' | 'danger', amount?: number }
const confirmationTone = computed(() => confirmationModal.value?.tone ?? 'default')
type PendingConfirmation = { kind: 'reverse' | 'cheque' | 'post', action?: 'bounce' | 'cancel', chequeId?: string }
type ConfirmationOrigin = 'moneyIn' | 'moneyOut' | 'loan' | 'ledger' | null
const confirmationModalOpen = ref(false)
const confirmationModal = ref<AccountConfirmation | null>(null)
const pendingConfirmation = ref<PendingConfirmation | null>(null)
const pendingConfirmationAction = ref<(() => Promise<boolean>) | null>(null)
const confirmationOrigin = ref<ConfirmationOrigin>(null)
const isConfirming = ref(false)
const ledgerDetailOpen = ref(false)
const selectedLedgerEntry = ref<LedgerEntry | null>(null)
const isReversing = ref(false)
const reversalError = ref('')
const chequeError = ref('')
const moneyInError = ref('')
const moneyOutError = ref('')
const preserveMoneyInOnClose = ref(false)
const preserveMoneyOutOnClose = ref(false)
const MODAL_TRANSITION_MS = 200
let confirmationHandoffToken = 0
let successHandoffToken = 0
const payablesError = ref('')
const moneyInTouched = ref<Record<string, boolean>>({})
const moneyOutTouched = ref<Record<string, boolean>>({})
const creditCandidatesError = ref('')
const creditGuideError = ref('')
const creditCandidateRequestId = ref(0)
const selectedCreditCandidateId = ref('')
const selectedPayableId = ref('')
const ledgerSearch = ref('')
const ledgerDirection = ref<'all' | 'in' | 'out'>('all')
const ledgerDatePreset = ref<'month' | 'last_30_days' | 'all_time' | 'custom'>('all_time')
const ledgerDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const ledgerFromDate = ref('')
const ledgerToDate = ref('')
const ledgerMethod = ref('all')
const ledgerStatus = ref('all')
const ledgerStatusOptions = ['posted', 'pending', 'reversed'] as const
const ledgerMoreFiltersOpen = ref(false)
const ledgerPeriodOptions = [
  { value: 'month' as const, label: 'This month' },
  { value: 'last_30_days' as const, label: '30 days' },
  { value: 'all_time' as const, label: 'All time' },
  { value: 'custom' as const, label: 'Custom' },
]
const printTimestamp = () => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
const printGeneratedAt = ref('')
const todayIsoDate = () => new Date().toISOString().slice(0, 10)
const moneyInSyncDate = ref(todayIsoDate())
const guideFromDate = ref(todayIsoDate())
const guideToDate = ref(todayIsoDate())
const usesPaymentGuide = computed(() => true)
const creditGuideMethods = computed(() => {
  const settledCreditPayments = creditGuide.value?.settledCreditPayments
  return (creditGuide.value?.methods || []).map((item) => ({
    ...item,
    // Credit Payment is backed by RigelOS's settled-credit feed, not by the
    // sales payment-method totals. Keep this explicit so a synced method
    // named "Credit" cannot show the wrong amount in the guide.
    ...(item.methodKey === 'credit_payment' && settledCreditPayments
      ? {
          amount: Number(settledCreditPayments.amount || 0),
          entries: Number(settledCreditPayments.entries || 0),
          lastSyncedAt: settledCreditPayments.lastSyncedAt || item.lastSyncedAt,
        }
      : {}),
    label: item.methodKey === 'credit_payment' ? 'Settled Credit' : (item.name || paymentMethodLabel(item.method)),
  }))
})
const paymentAllocationSelected = ref<Record<string, boolean>>({})
const selectedPaymentMethodCount = computed(() => Object.values(paymentAllocationSelected.value).filter(Boolean).length)
const paymentAllocationTotal = computed(() => Math.max(Number(moneyInForm.value.amount) || 0, 0))
const paymentMethodInputId = (methodId: string) => `credit-method-${String(methodId).replace(/[^a-zA-Z0-9_-]/g, '-')}`
const isPaymentMethodSelected = (methodId: string) => Boolean(paymentAllocationSelected.value[methodId])
const isChequeMethod = (method: { methodKey?: string, method?: string }) => String(method.methodKey || method.method || '').toLowerCase() === 'cheque'
const isChequeSelected = computed(() => creditGuideMethods.value.some((method) => isChequeMethod(method) && isPaymentMethodSelected(method.id)))
const chequeForm = ref({ number: '', bank: '', dueDate: '' })
const isPostDatedCheque = computed(() => isChequeSelected.value && Boolean(chequeForm.value.dueDate) && chequeForm.value.dueDate > todayIsoDate())
const togglePaymentMethod = (methodId: string, event: Event) => {
  const checked = (event.target as HTMLInputElement | null)?.checked === true
  const toggled = creditGuideMethods.value.find((method) => method.id === methodId)
  const next = { ...paymentAllocationSelected.value, [methodId]: checked }
  if (checked && toggled) {
    // A cheque reflects on its due date, so it is credited on its own rather
    // than mixed with methods that post immediately.
    const toggledIsCheque = isChequeMethod(toggled)
    creditGuideMethods.value.forEach((method) => {
      if (method.id !== methodId && isChequeMethod(method) !== toggledIsCheque) next[method.id] = false
    })
    if (toggledIsCheque && !chequeForm.value.dueDate) chequeForm.value.dueDate = todayIsoDate()
  }
  paymentAllocationSelected.value = next
}
const paymentAllocationPayload = computed<PaymentAllocation[]>(() => creditGuideMethods.value
  .filter((method) => isPaymentMethodSelected(method.id))
  .map((method) => ({
    methodId: method.id,
    methodKey: method.methodKey || method.method,
    methodName: method.name || method.label,
  })))
const moneyInCandidateGroupBy = ref<'total' | 'cashier' | 'shift' | 'cheque'>('total')
const moneyInScrollRegion = ref<HTMLElement | null>(null)
const moneyInCandidatesPanel = ref<HTMLElement | null>(null)
const moneyInCandidatePanelHeight = ref(220)

const moneyInForm = ref({ source: 'manual' as MoneyInSource, amount: '', description: '', reference: '', context: '' })
const moneyOutForm = ref({ source: 'expense' as MoneyOutSource, amount: '', description: '', reference: '', context: '' })

const moneyInSourceOptions = [
  { value: 'sales' as MoneyInSource, label: 'Sales', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Customer, payer, or sales source', referenceLabel: 'Sales reference', referencePlaceholder: 'Sales batch or shift', contextLabel: 'Context', contextPlaceholder: 'Optional sales context' },
  { value: 'credit_payment' as MoneyInSource, label: 'Settled Credit', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Customer or payer name', referenceLabel: 'Payment reference', referencePlaceholder: 'Receipt or customer account', contextLabel: 'Payer context', contextPlaceholder: 'Optional payer context' },
  { value: 'cheque' as MoneyInSource, label: 'Cheque', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Drawer, customer, or payer name', referenceLabel: 'Cheque number', referencePlaceholder: 'e.g. CHQ-000184', contextLabel: 'Cheque context', contextPlaceholder: 'Optional cheque context' },
  { value: 'manual' as MoneyInSource, label: 'Manual credit', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Person or source providing the funds', referenceLabel: 'Reference', referencePlaceholder: 'Deposit slip or note', contextLabel: 'Context', contextPlaceholder: 'Optional credit context' },
]

const supportsSyncedCredits = computed(() => ['sales', 'credit_payment', 'cheque'].includes(moneyInForm.value.source))
const moneyInGroupingOptions = computed(() => moneyInForm.value.source === 'sales'
  ? [
      { value: 'total' as const, label: 'Total' },
      { value: 'cashier' as const, label: 'Cashier' },
      { value: 'shift' as const, label: 'Shift' },
    ]
  : moneyInForm.value.source === 'credit_payment'
    ? [
        { value: 'total' as const, label: 'Total' },
        { value: 'cashier' as const, label: 'Payments' },
      ]
    : [])
const moneyOutSourceOptions = [
  { value: 'expense' as MoneyOutSource, label: 'Expense', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Supplier, service provider, or payee', referenceLabel: 'Reference', referencePlaceholder: 'Invoice or voucher number', contextLabel: 'Context', contextPlaceholder: 'e.g. ECG monthly bill' },
  { value: 'withdrawal' as MoneyOutSource, label: 'Withdrawal', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Person who received the cash', referenceLabel: 'Reference', referencePlaceholder: 'Voucher number', contextLabel: 'Context', contextPlaceholder: 'Optional withdrawal context' },
  { value: 'supplier_payment' as MoneyOutSource, label: 'Supplier payment', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Supplier name', referenceLabel: 'Invoice', referencePlaceholder: 'Supplier invoice number', contextLabel: 'Supplier', contextPlaceholder: 'Supplier name' },
  { value: 'transfer' as MoneyOutSource, label: 'Transfer', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Destination account or recipient', referenceLabel: 'Reference', referencePlaceholder: 'Target account or note', contextLabel: 'Destination', contextPlaceholder: 'Target account name' },
  { value: 'charges' as MoneyOutSource, label: 'Charges', descriptionLabel: 'Recipient', descriptionPlaceholder: 'Bank or service provider', referenceLabel: 'Reference', referencePlaceholder: 'Statement line or fee code', contextLabel: 'Context', contextPlaceholder: 'e.g. E-levy deduction' },
]

const selectedMoneyInSource = computed(() => moneyInSourceOptions.find((option) => option.value === moneyInForm.value.source) || moneyInSourceOptions[0])
const selectedCreditCandidate = computed(() => creditCandidates.value?.candidates.find((candidate) => candidate.id === selectedCreditCandidateId.value) || null)
const candidateGroupLabel = computed(() => moneyInCandidateGroupBy.value === 'shift'
  ? 'shifts'
  : (moneyInCandidateGroupBy.value === 'cheque'
    ? 'cheques'
    : (moneyInForm.value.source === 'sales' ? 'cashiers' : 'payments')))
const selectedMoneyOutSource = computed(() => moneyOutSourceOptions.find((option) => option.value === moneyOutForm.value.source) || moneyOutSourceOptions[0])
const isSupplierPayment = computed(() => moneyOutForm.value.source === 'supplier_payment')
const selectedPayable = computed(() => payables.value.find((payable) => payable.id === selectedPayableId.value) || null)
const canShowLedgerPaymentMethod = (entry: LedgerEntry) => Boolean(entry.moneyIn) && ['sales', 'credit_payment', 'cheque', 'manual'].includes(entry.source)
const ledgerMethodValues = (entry: LedgerEntry) => {
  if (!canShowLedgerPaymentMethod(entry)) return []
  const allocationMethods = (entry.paymentAllocations || [])
    .map((allocation) => String(allocation.methodKey || allocation.methodName || '').trim().toLowerCase().replace(/[\s-]+/g, '_'))
    .filter(Boolean)
  // `method` was historically populated with the account type (for example
  // `bank`) rather than the way the movement was paid.  Payment methods now
  // come from allocations or movement metadata, so never expose the legacy
  // account identity as a payment-method filter.
  const metadataMethod = String(entry.metadata?.paymentMethod || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return [...new Set([...allocationMethods, metadataMethod].filter(Boolean))]
}
const ledgerPaymentMethodOptions = computed(() => {
  const methods = new Set<string>()
  ledger.value.forEach((entry) => ledgerMethodValues(entry).forEach((method) => methods.add(method)))
  return [...methods].sort()
})

const visibleLedger = computed(() => {
  const query = ledgerSearch.value.trim().toLowerCase()
  return ledger.value.filter((entry) => {
    const entryDate = entry.date?.slice(0, 10) || ''
    const directionMatches = ledgerDirection.value === 'all' || (ledgerDirection.value === 'in' ? Boolean(entry.moneyIn) : Boolean(entry.moneyOut))
    const dateMatches = (!ledgerFromDate.value || entryDate >= ledgerFromDate.value) && (!ledgerToDate.value || entryDate <= ledgerToDate.value)
    const methodMatches = ledgerMethod.value === 'all' || ledgerMethodValues(entry).includes(ledgerMethod.value)
    const statusMatches = ledgerStatus.value === 'all' || entry.status === ledgerStatus.value
    if (!directionMatches || !dateMatches || !methodMatches || !statusMatches) return false
    if (!query) return true
    return [entry.reference, entry.enteredBy, ...ledgerMethodValues(entry), ledgerSourceLabel(entry), entry.metadata?.context, statusLabel(entry.status)].filter(Boolean).join(' ').toLowerCase().includes(query)
  })
})
const ledgerDateGroups = computed(() => {
  const groups: Array<{ date: string, entries: LedgerEntry[] }> = []
  visibleLedger.value.forEach((entry) => {
    const date = entry.date?.slice(0, 10) || ''
    const currentGroup = groups[groups.length - 1]
    if (!currentGroup || currentGroup.date !== date) {
      groups.push({ date, entries: [entry] })
      return
    }
    currentGroup.entries.push(entry)
  })
  return groups
})
const ledgerDateRangeInvalid = computed(() => Boolean(ledgerFromDate.value && ledgerToDate.value && ledgerFromDate.value > ledgerToDate.value))
const ledgerAdvancedFilterCount = computed(() => [ledgerDirection.value !== 'all', ledgerMethod.value !== 'all', ledgerStatus.value !== 'all'].filter(Boolean).length)
const ledgerFilterCount = computed(() => [ledgerSearch.value.trim(), ledgerDirection.value !== 'all', ledgerDatePreset.value !== 'all_time', ledgerMethod.value !== 'all', ledgerStatus.value !== 'all'].filter(Boolean).length)
const ledgerActiveFilterChips = computed(() => {
  const chips: Array<{ key: string; label: string; clear: () => void }> = []
  if (ledgerSearch.value.trim()) {
    chips.push({ key: 'search', label: `Search: ${ledgerSearch.value.trim()}`, clear: () => { ledgerSearch.value = '' } })
  }
  if (ledgerDirection.value !== 'all') {
    chips.push({
      key: 'direction',
      label: ledgerDirection.value === 'in' ? 'Money in' : 'Money out',
      clear: () => { ledgerDirection.value = 'all' },
    })
  }
  if (ledgerMethod.value !== 'all') {
    chips.push({
      key: 'method',
      label: `Method: ${paymentMethodLabel(ledgerMethod.value)}`,
      clear: () => { ledgerMethod.value = 'all' },
    })
  }
  if (ledgerStatus.value !== 'all') {
    chips.push({
      key: 'status',
      label: `Status: ${statusLabel(ledgerStatus.value)}`,
      clear: () => { ledgerStatus.value = 'all' },
    })
  }
  return chips
})
const printTotals = computed(() => visibleLedger.value.reduce((totals, entry) => ({
  moneyIn: totals.moneyIn + Number(entry.moneyIn || 0),
  moneyOut: totals.moneyOut + Number(entry.moneyOut || 0),
}), { moneyIn: 0, moneyOut: 0 }))
const ledgerPrintPeriod = computed(() => {
  const dates = visibleLedger.value.map((entry) => entry.date).filter(Boolean).sort()
  if (!dates.length) return 'No entries'
  const first = formatDate(dates[0])
  const last = formatDate(dates[dates.length - 1])
  return first === last ? first : `${first} - ${last}`
})
const ledgerPrintScope = computed(() => ledgerFilterCount.value ? 'Filtered view' : 'Full ledger')
const ledgerViewSummary = computed(() => {
  const count = visibleLedger.value.length
  const period = ledgerDatePreset.value === 'custom'
    ? 'Custom range'
    : (ledgerPeriodOptions.find((option) => option.value === ledgerDatePreset.value)?.label || 'All time')
  return `${count} ${count === 1 ? 'entry' : 'entries'} shown · ${period}`
})

const paymentAllocationErrorMessage = computed(() => {
  if (!usesPaymentGuide.value) return ''
  if (!selectedPaymentMethodCount.value) return 'Select at least one payment method.'
  if (paymentAllocationTotal.value <= 0) return 'Enter a credit amount greater than 0.'
  return ''
})
const moneyInErrors = computed(() => {
  const amount = usesPaymentGuide.value ? paymentAllocationTotal.value : Number(moneyInForm.value.amount)
  const selectedAmount = Number(selectedCreditCandidate.value?.amount ?? 0)
  const exceedsSyncedAmount = !usesPaymentGuide.value && supportsSyncedCredits.value && selectedCreditCandidate.value && amount > selectedAmount + 0.005
  return {
    amount: !Number.isFinite(amount) || amount <= 0
      ? (usesPaymentGuide.value ? paymentAllocationErrorMessage.value : 'Amount must be greater than 0.')
      : (exceedsSyncedAmount ? `Amount cannot exceed ${formatMoney(selectedAmount)} for this synced selection.` : ''),
    paymentAllocations: usesPaymentGuide.value ? paymentAllocationErrorMessage.value : '',
    chequeNumber: isChequeSelected.value && !chequeForm.value.number.trim() ? 'Cheque number is required.' : '',
    chequeDueDate: isChequeSelected.value && !chequeForm.value.dueDate ? 'Choose the cheque due date.' : '',
    description: usesPaymentGuide.value || moneyInForm.value.description.trim() ? '' : 'Recipient is required.',
    reference: moneyInForm.value.source === 'cheque' && !moneyInForm.value.reference.trim() ? 'Cheque number is required.' : '',
    candidate: supportsSyncedCredits.value && !selectedCreditCandidate.value?.sourceLinks?.length ? 'A synced source is required.' : '',
  }
})

const moneyOutErrors = computed(() => {
  const amount = Number(moneyOutForm.value.amount)
  const payableBalance = Number(selectedPayable.value?.balancePesewas ?? 0) / 100
  return {
    amount: Number.isFinite(amount) && amount > 0 ? '' : 'Amount must be greater than 0.',
    balance: Number.isFinite(amount) && amount <= Number(account.value?.currentBalance || 0) ? '' : 'Amount cannot exceed the current account balance.',
    description: moneyOutForm.value.description.trim() ? '' : 'Recipient is required.',
    payable: !isSupplierPayment.value || selectedPayable.value ? '' : 'Select the synced supplier invoice to pay.',
    payableBalance: !isSupplierPayment.value || !selectedPayable.value || amount <= payableBalance ? '' : `Amount cannot exceed ${formatMoney(payableBalance)} remaining on this invoice.`,
  }
})

const isMoneyInFieldInvalid = (field: string): boolean => Boolean(moneyInTouched.value[field] && moneyInErrors.value[field as keyof typeof moneyInErrors.value])
const isMoneyOutFieldInvalid = (field: string): boolean => Boolean(moneyOutTouched.value[field] && moneyOutErrors.value[field as keyof typeof moneyOutErrors.value])
const touchMoneyInField = (field: string): void => { moneyInTouched.value[field] = true }
const touchMoneyOutField = (field: string): void => { moneyOutTouched.value[field] = true }
const canSubmitMoneyIn = computed(() => Object.values(moneyInErrors.value).every((message) => !message))
const canSubmitMoneyOut = computed(() => Object.values(moneyOutErrors.value).every((message) => !message))

const accountIcon = (type: AccountType) => ({ cash: BanknotesIcon, bank: BuildingLibraryIcon, mobile_money: DevicePhoneMobileIcon, pos: CreditCardIcon, petty_cash: WalletIcon, loan: ScaleIcon }[type])

const plainMoney = new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const splitMoney = (value: number | null | undefined) => {
  const n = Number(value ?? 0)
  const text = plainMoney.format(Math.abs(n))
  const dot = text.lastIndexOf('.')
  return { neg: n < 0, int: text.slice(0, dot), dec: text.slice(dot) }
}
const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31557600], ['month', 2629800], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const relativeWhen = (iso: string | null | undefined): string => {
  if (!iso) return 'No activity yet'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diff = (t - Date.now()) / 1000
  if (Math.abs(diff) < 60) return 'Just now'
  const [unit, secs] = relativeUnits.find(([, size]) => Math.abs(diff) >= size) ?? relativeUnits[relativeUnits.length - 1]!
  return relativeFormat.format(Math.round(diff / secs), unit)
}
const shortDate = (iso: string | null | undefined): string => {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}
const accountSubtitle = (item: AccountSummary) => {
  const metadata = item.metadata || {}
  if (item.type === 'bank') return [metadata.bankName, metadata.accountNumber].filter(Boolean).join(' / ') || item.branch || 'Bank account'
  if (item.type === 'mobile_money') return [metadata.provider, metadata.accountNumber].filter(Boolean).join(' / ') || item.branch || 'Mobile money wallet'
  if (item.type === 'pos') return [metadata.provider, metadata.terminalId].filter(Boolean).join(' / ') || item.branch || 'POS settlement'
  if (item.type === 'loan') return [metadata.lenderName, metadata.loanReference].filter(Boolean).join(' / ') || 'Loan account'
  return [metadata.location, metadata.custodian].filter(Boolean).join(' / ') || item.branch || accountTypeLabels[item.type]
}
const sourceLabel = (source: string) => sourceLabels[source] || source.replace(/_/g, ' ')
const ledgerPaymentAllocations = (entry: LedgerEntry) => entry.paymentAllocations || []
const ledgerDescription = (entry: LedgerEntry) => String(entry.description || entry.recipient || '').replace(/\s+/g, ' ').trim()
const ledgerSourceLabel = (entry: LedgerEntry) => {
  const allocations = ledgerPaymentAllocations(entry)
  if (allocations.length) return allocations.map((allocation) => allocation.methodName).join(' · ')
  return entry.metadata?.creditSourceLabel || sourceLabel(entry.source)
}
const ledgerRecipient = (entry: LedgerEntry) => String(entry.recipient || entry.description || '').replace(/\s+/g, ' ').trim()
const ledgerMethodValue = (entry: LedgerEntry) => ledgerMethodValues(entry)[0] || ''
const ledgerPaymentMethodDisplay = (entry: LedgerEntry) => {
  if (entry.paymentContext?.methodName) {
    return [entry.paymentContext.methodName, entry.paymentContext.subtypeName].filter(Boolean).join(' · ')
  }
  if (!canShowLedgerPaymentMethod(entry)) return ''
  const allocations = ledgerPaymentAllocations(entry)
  if (allocations.length) return allocations.map((allocation) => allocation.methodName).join(' · ')
  const method = ledgerMethodValue(entry)
  return method ? paymentMethodLabel(method) : ''
}
const ledgerSourceDetail = (entry: LedgerEntry) => {
  const allocations = ledgerPaymentAllocations(entry)
  if (!canShowLedgerPaymentMethod(entry)) return ''
  if (allocations.some((allocation) => Number(allocation.amount) > 0)) {
    return allocations.map((allocation) => `${allocation.methodName} ${formatLedgerAmount(allocation.amount)}`).join(' · ')
  }
  if (allocations.length) return ''
  if (entry.metadata?.paymentMethodSummary) return entry.metadata.paymentMethodSummary
  const method = ledgerMethodValue(entry)
  if (!method) return ''
  const detail = paymentMethodLabel(method)
  return detail.toLowerCase() === ledgerSourceLabel(entry).trim().toLowerCase() ? '' : detail
}
const ledgerMetadataLabels: Record<string, string> = {
  cashierName: 'Cashier',
  shiftName: 'Shift',
  branchName: 'Branch',
  customerName: 'Customer',
  supplierName: 'Supplier',
  lenderName: 'Lender',
  bankName: 'Bank',
  drawerName: 'Drawer',
  chequeNumber: 'Cheque number',
  receivedDate: 'Received date',
  expectedClearanceDate: 'Expected clearance',
  invoiceId: 'Invoice',
  supplierInvoiceNo: 'Supplier invoice',
  orderId: 'Order',
  settlementId: 'Settlement',
  tel: 'Phone',
  paymentReferences: 'Payment references',
  paymentMethodSummary: 'Payment breakdown',
  saleCount: 'Sales included',
  allocationCount: 'Payment allocations',
}
const ledgerAdditionalDetails = (entry: LedgerEntry) => Object.entries(entry.metadata || {})
  .filter(([key, value]) => (
    (Boolean(ledgerMetadataLabels[key]) && String(value || '').trim() && key !== 'paymentMethodSummary')
    || (key === 'paymentMethodSummary' && String(value || '').trim() && ledgerPaymentAllocations(entry).length === 0)
  ))
  .map(([key, value]) => ({ key, label: ledgerMetadataLabels[key] || key, value: String(value).trim() }))
const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
const statusBadgeClass = (status: string) => `ad-tag-${status}`
const recordedByLabel = (entry: LedgerEntry) => {
  const value = entry.enteredBy?.trim()
  return value === 'company_user' ? (companyStore.userName || 'Company user') : (value || 'Not recorded')
}
const paymentMethodLabel = (method: string) => method.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
const formatPayableAmount = (pesewas: number) => formatMoney(Number(pesewas || 0) / 100)
const formatLedgerAmount = (value: number | null | undefined) => new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value || 0))
const ledgerTableDate = (entry: LedgerEntry) => entry.date?.slice(0, 10) || '—'
const ledgerDateGroupLabel = (value: string) => {
  if (!value) return 'Undated entries'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date)
}
const ledgerDateGroupDate = (value: string) => {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}
const shortDateFromText = (value: string) => {
  const match = value.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (!match) return ''
  const date = new Date(`${match[0]}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? match[0]
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}
const shortenLedgerText = (value: string, maxLength = 58) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const words = normalized.slice(0, maxLength - 1).trimEnd().split(' ')
  words.pop()
  return `${words.join(' ')}...`
}
const ledgerEntrySummary = (entry: LedgerEntry) => {
  const description = ledgerRecipient(entry) || ledgerSourceLabel(entry)
  const date = shortDateFromText(description)
  if (entry.source === 'sales' && date) {
    const descriptionMethod = description.match(/^(.+?)\s+sales collection\s+for\b/i)?.[1]
    const method = descriptionMethod || entry.metadata?.paymentMethod
    return `${method ? paymentMethodLabel(method) : 'Sales'} sales · ${date}`
  }
  if (entry.source === 'credit_payment' && date) return `Credit payment · ${date}`
  if (entry.source === 'cheque' && date) return `Cheque receipt · ${date}`
  return shortenLedgerText(description)
}
const ledgerReferenceLabel = (entry: LedgerEntry) => {
  const reference = String(entry.reference || '').replace(/\s+/g, ' ').trim()
  return reference || 'No reference'
}
const ledgerReferenceDisplay = (entry: LedgerEntry) => {
  const reference = ledgerReferenceLabel(entry)
  if (reference.length <= 26) return reference
  const head = reference.slice(0, 15).trimEnd()
  const tail = reference.slice(-9).trimStart()
  return `${head}…${tail}`
}
const applyLedgerDatePreset = (preset: 'month' | 'last_30_days' | 'all_time' | 'custom') => {
  ledgerDatePreset.value = preset
  if (preset === 'custom') return
  if (preset === 'all_time') {
    ledgerFromDate.value = ''
    ledgerToDate.value = ''
    return
  }
  const today = new Date()
  ledgerToDate.value = ledgerDateValue(today)
  if (preset === 'month') {
    ledgerFromDate.value = ledgerDateValue(new Date(today.getFullYear(), today.getMonth(), 1))
    return
  }
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 29)
  ledgerFromDate.value = ledgerDateValue(startDate)
}
const candidateContext = (candidate: CreditCandidate) => {
  const contextParts = (candidate.context || '').split(' - ').map((part) => part.trim()).filter(Boolean)
  const isCreditPayment = candidate.metadata?.syncSource === 'settled_credit_headers'
  const displayContextParts = isCreditPayment
    ? contextParts.filter((part) => !/^shift(?:\s|:)/i.test(part))
    : contextParts
  const cashier = displayContextParts.find((part) => part.toLowerCase().startsWith('cashier:'))
  const shift = displayContextParts.find((part) => part.toLowerCase().startsWith('shift:'))
  const visibleParts = cashier || shift
    ? [cashier, shift].filter(Boolean)
    : displayContextParts.filter((part) => !part.toLowerCase().startsWith('payment:') && !part.toLowerCase().startsWith('branch:'))
  return visibleParts
    .filter((part) => !candidate.label || !part?.toLowerCase().endsWith(`: ${candidate.label.toLowerCase()}`))
    .join(' · ')
}

const clearLedgerFilters = () => {
  ledgerSearch.value = ''
  ledgerDirection.value = 'all'
  applyLedgerDatePreset('all_time')
  ledgerMethod.value = 'all'
  ledgerStatus.value = 'all'
  ledgerMoreFiltersOpen.value = false
}
const waitForModalExit = () => new Promise<void>((resolve) => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    resolve()
    return
  }
  setTimeout(resolve, MODAL_TRANSITION_MS)
})
const dismissSuccessModal = () => {
  successHandoffToken += 1
  successModalOpen.value = false
  successModal.value = null
}
const showSuccessModal = (title: string, message: string, amount?: number) => {
  const handoffToken = ++successHandoffToken
  const hadOpenDialog = confirmationModalOpen.value || moneyInModalOpen.value || moneyOutModalOpen.value || loanModalOpen.value || ledgerDetailOpen.value
  if (confirmationModalOpen.value) finishConfirmation(false)
  moneyInModalOpen.value = false
  moneyOutModalOpen.value = false
  loanModalOpen.value = false
  ledgerDetailOpen.value = false
  successModal.value = { title, message, amount }
  void nextTick(async () => {
    if (hadOpenDialog) await waitForModalExit()
    if (handoffToken === successHandoffToken) successModalOpen.value = true
  })
}
const focusLedgerFromSuccess = () => {
  dismissSuccessModal()
  if (typeof document === 'undefined') return
  document.querySelector('[data-ledger-print-section]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const printLedger = () => {
  if (typeof window === 'undefined') return
  printGeneratedAt.value = printTimestamp()
  void nextTick(() => window.print())
}
const openLedgerEntry = (entry: LedgerEntry) => { selectedLedgerEntry.value = entry; ledgerDetailOpen.value = true }

// --- Cheque lifecycle + reversal (spec §7 / §6) ---
const actionalCheques = computed(() => cheques.value.filter((c) => c.status === 'received' || c.status === 'deposited'))

const onChequeAction = async (action: 'clear' | 'deposit' | 'bounce' | 'cancel', chequeId: string): Promise<boolean> => {
  chequeError.value = ''
  const cheque = cheques.value.find((item) => item.id === chequeId)
  try {
    await chequeAction(action, chequeId)
    await loadCheques(accountId.value)
    const actionLabel = action === 'clear' ? 'Cheque cleared' : action === 'deposit' ? 'Cheque deposited' : action === 'bounce' ? 'Cheque bounced' : 'Cheque cancelled'
    showSuccessModal(actionLabel, cheque ? `${formatMoney(cheque.amount)} cheque updated.` : 'The cheque was updated.', cheque?.amount)
    return true
  } catch (err) {
    chequeError.value = err instanceof Error ? err.message : 'The cheque action failed. Try again.'
    return false
  }
}

const onReverseSelectedEntry = async (): Promise<boolean> => {
  const entry = selectedLedgerEntry.value
  if (!entry || !account.value || entry.status !== 'posted') return false
  isReversing.value = true
  reversalError.value = ''
  const reversedAmount = Number(entry.moneyIn || entry.moneyOut || 0)
  try {
    await reverseLedgerEntry(account.value.id, entry.id)
    selectedLedgerEntry.value = null
    ledgerDetailOpen.value = false
    showSuccessModal('Entry reversed', `Reversed from ${account.value.name}.`, reversedAmount)
    return true
  } catch (err) {
    reversalError.value = err instanceof Error ? err.message : 'Could not reverse this entry. Try again.'
    return false
  } finally {
    isReversing.value = false
  }
}

const reopenConfirmationOrigin = (origin: ConfirmationOrigin) => {
  if (!origin) return
  void nextTick(async () => {
    await waitForModalExit()
    if (origin === 'moneyIn') moneyInModalOpen.value = true
    if (origin === 'moneyOut') moneyOutModalOpen.value = true
    if (origin === 'loan') loanModalOpen.value = true
    if (origin === 'ledger') ledgerDetailOpen.value = true
  })
}

const finishConfirmation = (reopenOrigin: boolean) => {
  confirmationHandoffToken += 1
  const origin = confirmationOrigin.value
  confirmationModalOpen.value = false
  confirmationModal.value = null
  pendingConfirmation.value = null
  pendingConfirmationAction.value = null
  confirmationOrigin.value = null
  if (reopenOrigin) reopenConfirmationOrigin(origin)
}

const openConfirmation = (details: AccountConfirmation, action: () => Promise<boolean>, kind: PendingConfirmation['kind'] = 'post', origin: ConfirmationOrigin = null) => {
  const handoffToken = ++confirmationHandoffToken
  confirmationModal.value = details
  pendingConfirmation.value = { kind }
  pendingConfirmationAction.value = action
  confirmationOrigin.value = origin
  if (moneyInModalOpen.value) {
    preserveMoneyInOnClose.value = true
    moneyInModalOpen.value = false
  }
  if (moneyOutModalOpen.value) {
    preserveMoneyOutOnClose.value = true
    moneyOutModalOpen.value = false
  }
  if (loanModalOpen.value) loanModalOpen.value = false
  if (ledgerDetailOpen.value) ledgerDetailOpen.value = false
  void nextTick(async () => {
    await waitForModalExit()
    if (handoffToken === confirmationHandoffToken) confirmationModalOpen.value = true
  })
}

const requestReverseSelectedEntry = () => {
  const entry = selectedLedgerEntry.value
  if (!entry || !account.value || entry.status !== 'posted') return
  openConfirmation({
    title: 'Reverse this ledger entry?',
    message: `A reversal record will be added to ${account.value.name} and the balance restored.`,
    confirmLabel: 'Reverse entry',
    tone: 'danger',
    amount: Number(entry.moneyIn || entry.moneyOut || 0),
  }, onReverseSelectedEntry, 'reverse', 'ledger')
}

const requestChequeAction = (action: 'clear' | 'deposit' | 'bounce' | 'cancel', chequeId: string) => {
  if (action !== 'bounce' && action !== 'cancel') {
    void onChequeAction(action, chequeId)
    return
  }
  const cheque = cheques.value.find((item) => item.id === chequeId)
  openConfirmation({
    title: action === 'bounce' ? 'Bounce this cheque?' : 'Cancel this cheque?',
    message: `The cheque will be marked as ${action === 'bounce' ? 'bounced' : 'cancelled'} and excluded from the balance.`,
    confirmLabel: action === 'bounce' ? 'Bounce cheque' : 'Cancel cheque',
    tone: 'danger',
    amount: cheque?.amount,
  }, () => onChequeAction(action, chequeId), 'cheque')
}

const cancelConfirmation = () => {
  if (isConfirming.value) return
  finishConfirmation(true)
}

const confirmPendingAction = async () => {
  const pendingAction = pendingConfirmationAction.value
  if (!pendingAction || !pendingConfirmation.value || isConfirming.value) return
  const origin = confirmationOrigin.value
  isConfirming.value = true
  confirmationModalOpen.value = false
  confirmationModal.value = null
  pendingConfirmation.value = null
  pendingConfirmationAction.value = null
  confirmationOrigin.value = null
  await nextTick()
  await waitForModalExit()
  let succeeded = false
  try {
    succeeded = await pendingAction()
  } catch {
    succeeded = false
  } finally {
    isConfirming.value = false
  }
  if (!succeeded) reopenConfirmationOrigin(origin)
}

const clearMoneyInEntryDetails = () => {
  moneyInForm.value.amount = ''
  moneyInForm.value.reference = ''
  moneyInForm.value.description = ''
  moneyInForm.value.context = ''
  moneyInTouched.value.amount = false
  moneyInTouched.value.reference = false
  moneyInTouched.value.description = false
  moneyInTouched.value.candidate = false
}
const resetMoneyInForm = () => {
  moneyInError.value = ''
  moneyInTouched.value = {}
  creditCandidatesError.value = ''
  selectedCreditCandidateId.value = ''
  moneyInSyncDate.value = todayIsoDate()
  moneyInCandidateGroupBy.value = 'total'
  moneyInCandidatePanelHeight.value = 220
  moneyInForm.value = { source: 'manual', amount: '', description: '', reference: '', context: '' }
  guideFromDate.value = todayIsoDate()
  guideToDate.value = todayIsoDate()
  paymentAllocationSelected.value = {}
  chequeForm.value = { number: '', bank: '', dueDate: '' }
  creditGuideError.value = ''
}
const resetMoneyOutForm = () => {
  moneyOutError.value = ''
  payablesError.value = ''
  moneyOutTouched.value = {}
  selectedPayableId.value = ''
  moneyOutForm.value = { source: 'expense', amount: '', description: '', reference: '', context: '' }
}
const touchMoneyInRequiredFields = () => {
  touchMoneyInField('amount'); touchMoneyInField('description')
  if (moneyInForm.value.source === 'cheque') touchMoneyInField('reference')
  if (isChequeSelected.value) { touchMoneyInField('chequeNumber'); touchMoneyInField('chequeDueDate') }
  if (supportsSyncedCredits.value) touchMoneyInField('candidate')
}
const touchMoneyOutRequiredFields = () => { touchMoneyOutField('amount'); touchMoneyOutField('balance'); touchMoneyOutField('description'); if (isSupplierPayment.value) touchMoneyOutField('payable') }

const openMoneyInModal = () => { resetMoneyInForm(); moneyInModalOpen.value = true }
const openMoneyOutModal = () => { resetMoneyOutForm(); moneyOutModalOpen.value = true }
const openLoanModal = (direction: 'received' | 'repaid') => {
  loanDirection.value = direction
  loanError.value = ''
  loanForm.value = { amount: '', reference: '', description: '' }
  loanModalOpen.value = true
}
const loanFieldError = () => {
  const amount = Number(loanForm.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount greater than 0.'
  if (loanDirection.value === 'repaid' && amount > Number(account.value?.currentBalance || 0)) return `Repayment cannot exceed ${formatMoney(account.value?.currentBalance || 0)} outstanding.`
  return ''
}
const executeLoanMovement = async (): Promise<boolean> => {
  if (!account.value) return false
  const amount = Number(loanForm.value.amount)
  const accountName = account.value.name
  const payload = { loanAccountId: account.value.id, amount, reference: loanForm.value.reference.trim(), recipient: loanForm.value.description.trim() }
  const post = loanDirection.value === 'received' ? postLoanReceived : postLoanRepayment
  try {
    await post(payload)
    loanModalOpen.value = false
    showSuccessModal(loanDirection.value === 'received' ? 'Loan received' : 'Loan repayment recorded', `Recorded on ${accountName}.`, amount)
    return true
  } catch (err) {
    loanError.value = err instanceof Error ? err.message : 'Could not record this loan movement. Try again.'
    return false
  }
}
const submitLoanMovement = () => {
  if (!account.value || loanFieldError()) return
  loanError.value = ''
  const amount = Number(loanForm.value.amount)
  const accountName = account.value.name
  const direction = loanDirection.value
  openConfirmation({
    title: direction === 'received' ? 'Record this loan?' : 'Record this repayment?',
    message: `Will be recorded on ${accountName}'s loan ledger.`,
    confirmLabel: direction === 'received' ? 'Record loan' : 'Record repayment',
    amount,
  }, executeLoanMovement, 'post', 'loan')
}
const closeMoneyInModal = () => { moneyInModalOpen.value = false; resetMoneyInForm() }
const closeMoneyOutModal = () => { moneyOutModalOpen.value = false; resetMoneyOutForm() }

const buildMovementMetadata = (context: string, source: string, direction: 'in' | 'out', extraMetadata: Record<string, string> = {}) => ({ recordedFrom: 'accounts_workbench', workflow: source === 'sales' || source === 'credit_payment' || source === 'cheque' ? 'synced' : 'manual', source, direction, ...extraMetadata, ...(context.trim() ? { context: context.trim() } : {}) })

const applyCreditCandidate = (candidateId: string) => {
  selectedCreditCandidateId.value = candidateId
  const candidate = creditCandidates.value?.candidates.find((item) => item.id === candidateId)
  if (!candidate) return
  moneyInForm.value.amount = String(candidate.amount)
  moneyInForm.value.reference = candidate.reference
  moneyInForm.value.description = candidate.description
  moneyInForm.value.context = candidate.context || ''
}

const sourceLinksForAmount = (candidate: NonNullable<typeof selectedCreditCandidate.value>, amount: number) => {
  let remainingCents = Math.round(amount * 100)
  return (candidate.sourceLinks || []).flatMap((link) => {
    if (remainingCents <= 0) return []
    const availableCents = Math.round(link.amount * 100)
    const allocatedCents = Math.min(availableCents, remainingCents)
    remainingCents -= allocatedCents
    return allocatedCents > 0 ? [{ ...link, amount: allocatedCents / 100 }] : []
  })
}

const restoreMoneyInScroll = (scrollTop: number) => {
  void nextTick(() => {
    if (!moneyInScrollRegion.value) return
    moneyInScrollRegion.value.scrollTop = scrollTop
    window.requestAnimationFrame(() => {
      if (moneyInScrollRegion.value) moneyInScrollRegion.value.scrollTop = scrollTop
    })
  })
}

const measureMoneyInCandidatePanel = () => {
  void nextTick(() => {
    const panelHeight = moneyInCandidatesPanel.value?.scrollHeight ?? 220
    moneyInCandidatePanelHeight.value = Math.max(moneyInCandidatePanelHeight.value, panelHeight)
  })
}

const changeMoneyInCandidateGroup = (group: 'total' | 'cashier' | 'shift') => {
  if (group === moneyInCandidateGroupBy.value) return
  const scrollTop = moneyInScrollRegion.value?.scrollTop ?? 0
  moneyInCandidateGroupBy.value = group
  restoreMoneyInScroll(scrollTop)
}

const refreshCreditCandidates = async () => {
  if (!moneyInModalOpen.value || !supportsSyncedCredits.value || !moneyInSyncDate.value) return
  const requestId = ++creditCandidateRequestId.value
  const scrollTop = moneyInScrollRegion.value?.scrollTop ?? 0
  creditCandidatesError.value = ''
  try {
    const groupBy = moneyInCandidateGroupBy.value
    const response = await loadCreditCandidates(moneyInForm.value.source as 'sales' | 'credit_payment' | 'cheque', moneyInSyncDate.value, { groupBy })
    if (requestId !== creditCandidateRequestId.value || !response) return
    selectedCreditCandidateId.value = ''
    clearMoneyInEntryDetails()
    if (moneyInCandidateGroupBy.value === 'total') {
      const candidate = creditCandidates.value?.candidates[0]
      if (candidate) applyCreditCandidate(candidate.id)
    }
    measureMoneyInCandidatePanel()
    restoreMoneyInScroll(scrollTop)
  } catch (err) {
    if (requestId !== creditCandidateRequestId.value) return
    selectedCreditCandidateId.value = ''
    clearMoneyInEntryDetails()
    creditCandidatesError.value = err instanceof Error ? err.message : 'Could not load synced credit entries.'
    measureMoneyInCandidatePanel()
    restoreMoneyInScroll(scrollTop)
  }
}

const executeMoneyIn = async (): Promise<boolean> => {
  const movementAmount = usesPaymentGuide.value ? paymentAllocationTotal.value : Number(moneyInForm.value.amount)
  const accountName = account.value?.name || 'account'
  const allocationSummary = paymentAllocationPayload.value.map((allocation) => allocation.methodName).join(' · ')
  const description = moneyInForm.value.description.trim() || (allocationSummary ? `Credit received via ${allocationSummary}` : `${selectedMoneyInSource.value.label} credit`)
  const sourceLinks = supportsSyncedCredits.value && selectedCreditCandidate.value
    ? sourceLinksForAmount(selectedCreditCandidate.value, movementAmount)
    : undefined
  const metadata = usesPaymentGuide.value
    ? buildMovementMetadata('', 'manual', 'in', {
        guideFromDate: guideFromDate.value,
        guideToDate: guideToDate.value,
        paymentMethod: paymentAllocationPayload.value.length === 1 ? paymentAllocationPayload.value[0].methodKey : 'mixed',
        paymentMethodSummary: allocationSummary,
        ...(isChequeSelected.value && chequeForm.value.number.trim()
          ? { chequeNumber: chequeForm.value.number.trim(), ...(chequeForm.value.bank.trim() ? { bankName: chequeForm.value.bank.trim() } : {}) }
          : {}),
      })
    : (supportsSyncedCredits.value && selectedCreditCandidate.value?.metadata
      ? buildMovementMetadata(moneyInForm.value.context, moneyInForm.value.source, 'in', selectedCreditCandidate.value.metadata)
      : buildMovementMetadata(moneyInForm.value.context, moneyInForm.value.source, 'in'))
  const postingKey = selectedCreditCandidate.value
    ? `accounts-${accountId.value}-${selectedCreditCandidate.value.id}-${movementAmount.toFixed(2)}`
    : `accounts-${accountId.value}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  try {
    if (isPostDatedCheque.value) {
      // Post-dated cheque: recorded as pending; the backend clears it so the
      // amount reflects on the balance on its due date.
      const dueDate = chequeForm.value.dueDate
      await receiveCheque({
        accountId: accountId.value,
        amount: movementAmount,
        chequeNumber: chequeForm.value.number.trim(),
        drawerName: moneyInForm.value.description.trim() || undefined,
        bankName: chequeForm.value.bank.trim() || undefined,
        receivedDate: todayIsoDate(),
        expectedClearanceDate: dueDate,
        reference: moneyInForm.value.reference.trim() || undefined,
        recipient: moneyInForm.value.description.trim() || undefined,
        metadata: { ...metadata, paymentMethod: 'cheque', paymentMethodSummary: 'Cheque' },
        postingKey,
      })
      await loadCheques(accountId.value)
      closeMoneyInModal()
      showSuccessModal('Post-dated cheque recorded', `${formatMoney(movementAmount)} will reflect on ${accountName} on ${formatDate(dueDate)}.`, movementAmount)
      return true
    }
    await postMoneyIn({ accountId: accountId.value, source: usesPaymentGuide.value ? 'manual' : moneyInForm.value.source, amount: movementAmount, recipient: description, reference: moneyInForm.value.reference.trim(), sourceLinks, paymentAllocations: usesPaymentGuide.value ? paymentAllocationPayload.value : undefined, postingKey, metadata })
    closeMoneyInModal()
    showSuccessModal('Credit posted', `Added to ${accountName}.`, movementAmount)
    return true
  } catch (err) {
    moneyInError.value = err instanceof Error ? err.message : 'Could not post money in. Try again.'
    return false
  }
}
const submitMoneyIn = () => {
  if (!canSubmitMoneyIn.value) { touchMoneyInRequiredFields(); return }
  moneyInError.value = ''
  const movementAmount = usesPaymentGuide.value ? paymentAllocationTotal.value : Number(moneyInForm.value.amount)
  const accountName = account.value?.name || 'account'
  const allocationSummary = paymentAllocationPayload.value.map((allocation) => allocation.methodName).join(' · ')
  openConfirmation({
    title: 'Post this credit?',
    message: isPostDatedCheque.value
      ? `Cheque ${chequeForm.value.number.trim()} stays pending. It will be added to ${accountName} on ${formatDate(chequeForm.value.dueDate)}.`
      : `Will be added to ${accountName}${allocationSummary ? ` via ${allocationSummary}` : ''}.`,
    confirmLabel: isPostDatedCheque.value ? 'Record cheque' : 'Post credit',
    amount: movementAmount,
  }, executeMoneyIn, 'post', 'moneyIn')
}
const executeMoneyOut = async (): Promise<boolean> => {
  const amount = Number(moneyOutForm.value.amount)
  const source = moneyOutForm.value.source
  const accountName = account.value?.name || 'account'
  const payableName = selectedPayable.value?.supplierName || ''
  try {
    await postMoneyOut({ accountId: accountId.value, source, amount, recipient: moneyOutForm.value.description.trim(), reference: moneyOutForm.value.reference.trim(), payableId: selectedPayable.value?.id, metadata: buildMovementMetadata(moneyOutForm.value.context, source, 'out', selectedPayable.value ? { payableId: selectedPayable.value.id, invoiceId: selectedPayable.value.invoiceId, orderId: selectedPayable.value.orderId, supplierName: selectedPayable.value.supplierName } : {}) })
    closeMoneyOutModal()
    showSuccessModal(source === 'supplier_payment' ? 'Payment recorded' : 'Debit posted', `Paid from ${accountName}${payableName ? ` to ${payableName}` : ''}.`, amount)
    return true
  } catch (err) {
    moneyOutError.value = err instanceof Error ? err.message : 'Could not post money out. Try again.'
    return false
  }
}
const submitMoneyOut = () => {
  if (!canSubmitMoneyOut.value) { touchMoneyOutRequiredFields(); return }
  moneyOutError.value = ''
  const amount = Number(moneyOutForm.value.amount)
  const source = moneyOutForm.value.source
  const accountName = account.value?.name || 'account'
  const payableName = selectedPayable.value?.supplierName || ''
  openConfirmation({
    title: source === 'supplier_payment' ? 'Record this payment?' : 'Post this debit?',
    message: `Will be paid from ${accountName}${payableName ? ` to ${payableName}` : ''}.`,
    confirmLabel: source === 'supplier_payment' ? 'Record payment' : 'Post debit',
    amount,
  }, executeMoneyOut, 'post', 'moneyOut')
}

watch(moneyInModalOpen, (isOpen) => {
  if (isOpen || !preserveMoneyInOnClose.value) {
    if (!isOpen) resetMoneyInForm()
    return
  }
  preserveMoneyInOnClose.value = false
})
watch(moneyOutModalOpen, (isOpen) => {
  if (isOpen || !preserveMoneyOutOnClose.value) {
    if (!isOpen) resetMoneyOutForm()
    return
  }
  preserveMoneyOutOnClose.value = false
})
watch(confirmationModalOpen, (isOpen) => { if (!isOpen && !isConfirming.value && pendingConfirmation.value) finishConfirmation(true) })
watch([moneyInModalOpen, guideFromDate, guideToDate], ([isOpen, from, to]) => {
  if (!isOpen || !usesPaymentGuide.value || !from || !to || from > to) return
  creditGuideError.value = ''
  void loadCreditGuide(from, to).catch((err) => { creditGuideError.value = err instanceof Error ? err.message : 'Could not load the synced payment guide.' })
}, { immediate: true })
watch([moneyInModalOpen, () => moneyInForm.value.source, moneyInSyncDate, moneyInCandidateGroupBy], ([isOpen, source]) => {
  if (!isOpen) return
  if (source === 'cheque' && moneyInCandidateGroupBy.value !== 'cheque') {
    moneyInCandidateGroupBy.value = 'cheque'
    return
  }
  if (source !== 'cheque' && moneyInCandidateGroupBy.value === 'cheque') {
    moneyInCandidateGroupBy.value = 'total'
    return
  }
  if (source === 'credit_payment' && moneyInCandidateGroupBy.value === 'shift') {
    moneyInCandidateGroupBy.value = 'total'
    return
  }
  if (source === 'sales' || source === 'credit_payment' || source === 'cheque') { void refreshCreditCandidates(); return }
  creditCandidateRequestId.value += 1
  selectedCreditCandidateId.value = ''; creditCandidatesError.value = ''; clearMoneyInEntryDetails()
})
watch([moneyOutModalOpen, () => moneyOutForm.value.source], ([isOpen, source]) => {
  if (!isOpen || source !== 'supplier_payment') return
  payablesError.value = ''
  void loadPayables().catch((err) => { payablesError.value = err instanceof Error ? err.message : 'Could not load synced payables.' })
})
watch(selectedPayable, (payable) => {
  if (!payable || !isSupplierPayment.value) return
  moneyOutForm.value.amount = (Number(payable.balancePesewas) / 100).toFixed(2)
  moneyOutForm.value.reference = payable.supplierInvoiceNo || payable.invoiceId
  moneyOutForm.value.description = `Supplier payment to ${payable.supplierName || 'supplier'}`
  moneyOutForm.value.context = `${payable.source === 'warehouse' ? 'Warehouse' : 'Store'} invoice ${payable.supplierInvoiceNo || payable.invoiceId}`
  moneyOutTouched.value.payable = false
})

const loadCurrentAccount = (id = accountId.value) => {
  if (!id) return
  void loadAccount(id)
  void loadCheques(id)
}
const refreshCurrentAccount = async () => {
  if (!accountId.value || isRefreshing.value) return
  refreshError.value = ''
  try {
    await Promise.all([
      loadAccount(accountId.value, { background: true }),
      loadCheques(accountId.value),
    ])
  } catch (err) {
    refreshError.value = err instanceof Error ? err.message : 'Could not refresh this account.'
  }
}
watch(accountId, (id, previousId) => { if (id && id !== previousId) loadCurrentAccount(id) })
onMounted(() => { printGeneratedAt.value = printTimestamp(); loadCurrentAccount(); void loadAccounts() })
</script>

<style>
/* Credit / debit / loan dialogs: the dialog root is teleported and gets no scope id, so its rules are global (the rest are scoped in the block below). */
.ad-dlg {
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
.ad-dlg-sm { max-width: min(420px, calc(100vw - 2rem)) !important; }
.ad-dlg-narrow { max-width: min(540px, calc(100vw - 2rem)) !important; }
.ad-dlg-wide { max-width: min(760px, calc(100vw - 2rem)) !important; }
.ad-dlg-wide:has(.ad-dlg-fill) { height: min(640px, calc(100vh - 2rem)); }

@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  body * {
    visibility: hidden !important;
  }

  [data-ledger-print-document],
  [data-ledger-print-document] * {
    visibility: visible !important;
  }

  [data-ledger-print-document] {
    display: block !important;
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 8mm 10mm !important;
    box-sizing: border-box !important;
    background: #fff !important;
    color: #0f172a !important;
    font-family: Arial, Helvetica, sans-serif !important;
  }

  .print-document__masthead {
    display: flex !important;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 16px;
  }

  .print-document__eyebrow {
    margin: 0;
    color: #64748b;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .print-document__title {
    margin: 6px 0 0;
    color: #0f172a;
    font-size: 22pt;
    font-weight: 700;
    line-height: 1.1;
  }

  .print-document__account-name {
    margin: 7px 0 0;
    color: #334155;
    font-size: 13pt;
    font-weight: 600;
  }

  .print-document__meta {
    min-width: 150px;
    color: #64748b;
    font-size: 9pt;
    text-align: right;
  }

  .print-document__meta div + div {
    margin-top: 8px;
  }

  .print-document__meta span,
  .print-document__account-details span,
  .print-document__summary span {
    display: block;
    color: #64748b;
    font-size: 8.5pt;
  }

  .print-document__meta strong {
    display: block;
    margin-top: 2px;
    color: #0f172a;
    font-size: 9pt;
  }

  .print-document__account-details,
  .print-document__summary {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    border-bottom: 1px solid #cbd5e1;
    padding: 14px 0;
  }

  .print-document__account-details strong,
  .print-document__summary strong {
    display: block;
    margin-top: 3px;
    color: #0f172a;
    font-size: 9.5pt;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .print-document__summary {
    border-bottom: 0;
    gap: 0;
    margin-top: 2px;
    padding: 16px 0 20px;
  }

  .print-document__summary > div {
    border-left: 1px solid #cbd5e1;
    padding-left: 14px;
  }

  .print-document__summary > div:first-child {
    border-left: 0;
    padding-left: 0;
  }

  .print-document__summary strong {
    font-size: 13pt;
  }

  .print-document__section-heading {
    display: flex !important;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
  }

  .print-document__section-heading h2 {
    margin: 0;
    color: #0f172a;
    font-size: 12pt;
    font-weight: 700;
  }

  .print-document__section-heading p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 8.5pt;
  }

  .print-document__section-heading > strong {
    color: #475569;
    font-size: 9pt;
    white-space: nowrap;
  }

  .print-document__table {
    width: 100% !important;
    margin-top: 8px;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 8.5pt;
  }

  .print-document__table th,
  .print-document__table td {
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 6px;
    vertical-align: top;
    text-align: left;
  }

  .print-document__table th {
    background: #f1f5f9;
    color: #475569;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-document__table thead {
    display: table-header-group;
  }

  .print-document__table tbody {
    display: table-row-group;
  }

  .print-document__table th:nth-child(1),
  .print-document__table td:nth-child(1) {
    width: 9%;
  }

  .print-document__table th:nth-child(2),
  .print-document__table td:nth-child(2) {
    width: 17%;
  }

  .print-document__table th:nth-child(3),
  .print-document__table td:nth-child(3) {
    width: 18%;
  }

  .print-document__table th:nth-child(4),
  .print-document__table td:nth-child(4) {
    width: 13%;
  }

  .print-document__table th:nth-child(5),
  .print-document__table td:nth-child(5) {
    width: 10%;
  }

  .print-document__table th:nth-child(6),
  .print-document__table td:nth-child(6) {
    width: 9%;
  }

  .print-document__table th:nth-child(n + 7),
  .print-document__table td:nth-child(n + 7) {
    width: 8%;
  }

  .print-document__table td strong,
  .print-document__table td span {
    display: block;
  }

  .print-document__table td strong {
    color: #0f172a;
    font-weight: 600;
  }

  .print-document__table td span {
    margin-top: 3px;
    color: #64748b;
    font-size: 8pt;
    overflow-wrap: anywhere;
  }

  .print-document__table .is-amount {
    text-align: right;
    white-space: nowrap;
  }

  .print-document__empty {
    border: 1px solid #cbd5e1;
    margin: 12px 0 0;
    padding: 18px;
    color: #64748b;
    font-size: 9pt;
    text-align: center;
  }

  .print-document__footer {
    display: flex !important;
    justify-content: space-between;
    gap: 16px;
    border-top: 1px solid #cbd5e1;
    margin-top: 18px;
    padding-top: 8px;
    color: #64748b;
    font-size: 8pt;
  }

  .print-document__table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

</style>

<style scoped>
/* Account detail. Same quiet language as the accounts list: neutral ink, hairlines, no decoration.
   Note: .ad must not set position/transform/overflow, the print document positions itself against the page. */
.ad {
  --ink: #14161c;
  --ink-2: #3b3f4a;
  --mute: #6a6f7d;
  --faint: #9a9fac;
  --line: #e4e6eb;
  --line-2: #d3d6dd;
  --wash: #f6f7f9;
  --mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
  max-width: 1180px;
  margin: 0 auto;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
.ad *, .ad *::before, .ad *::after { box-sizing: border-box; }
.ad-ico { width: 16px; height: 16px; flex: none; }
.ad-spin { animation: ad-rot 0.9s linear infinite; }
@keyframes ad-rot { to { transform: rotate(360deg); } }

/* header */
.ad-head { margin-bottom: 18px; }
.ad-crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--mute); }
.ad-crumb a { color: var(--mute); text-decoration: none; }
.ad-crumb a:hover { color: var(--ink); }
.ad-crumb a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 3px; }
.ad-crumb span[aria-hidden] { color: var(--faint); }
.ad-crumb span[aria-current] { color: var(--ink-2); max-width: 40ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-titlebar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
.ad-id { display: flex; align-items: center; gap: 14px; min-width: 0; }
.ad-glyph { width: 42px; height: 42px; flex: none; display: grid; place-items: center; border-radius: 10px; background: var(--wash); border: 1px solid var(--line); color: var(--ink-2); }
.ad-glyph svg { width: 20px; height: 20px; }
.ad-name { min-width: 0; }
.ad-name h1 { margin: 0; display: flex; align-items: baseline; gap: 10px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.ad-tag { font-size: 13px; font-weight: 500; color: var(--mute); letter-spacing: 0; }
.ad-name p { margin: 3px 0 0; font: 400 12.5px var(--mono); color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-actions { display: flex; gap: 8px; }

/* buttons */
.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13.5px; font-weight: 500; line-height: 1; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background 0.12s, border-color 0.12s; }
.ad-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.ad-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.ad-btn-quiet { background: #fff; color: var(--ink); border-color: var(--line-2); }
.ad-btn-quiet:hover:not(:disabled) { background: var(--wash); }
.ad-btn-primary { background: var(--ink); color: #fff; }
.ad-btn-primary:hover:not(:disabled) { background: #2a2d37; }
.ad-btn-danger { background: #fff; color: #b42318; border-color: var(--line-2); }
.ad-btn-danger:hover:not(:disabled) { background: #fef3f2; border-color: #fecdca; }
.ad-btn-sm { height: 30px; padding: 0 11px; font-size: 12.5px; }
.ad-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; border: 1px solid var(--line-2); background: #fff; color: var(--ink-2); cursor: pointer; }
.ad-icon:hover:not(:disabled) { background: var(--wash); color: var(--ink); }
.ad-icon:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.ad-icon:disabled { opacity: 0.6; cursor: wait; }
.ad-link { font-size: 13px; font-weight: 500; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }

/* summary */
.ad-summary { margin: 0 0 16px; display: grid; grid-template-columns: 1.35fr 1fr 1fr 1fr; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.ad-summary > div { padding: 16px 22px 15px; border-left: 1px solid var(--line); min-width: 0; }
.ad-summary > div:first-child { border-left: 0; }
.ad-summary dt { font-size: 12.5px; color: var(--mute); }
.ad-summary dd { margin: 6px 0 0; }
.ad-lead { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.ad-lead small { font-size: 14px; font-weight: 500; color: var(--mute); margin-right: 4px; letter-spacing: 0; }
.ad-lead span { font-size: 18px; color: var(--faint); font-weight: 500; }
.ad-val { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; font-variant-numeric: tabular-nums; }
.ad-val.is-none { color: var(--faint); font-weight: 500; }

/* cards */
.ad-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; margin-bottom: 16px; }
.ad-count { font-size: 12px; font-weight: 500; color: var(--mute); background: rgba(20, 22, 28, 0.06); border-radius: 99px; padding: 1px 8px; font-variant-numeric: tabular-nums; }
.ad-pend { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mute); }
.ad-pend i { width: 6px; height: 6px; border-radius: 50%; background: #d9922b; }
.ad-chead { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--line); }
.ad-chead h2 { margin: 0; font-size: 14px; font-weight: 600; }
.ad-card-err { margin: 0; padding: 8px 18px; font-size: 12.5px; color: #b42318; background: #fef3f2; border-bottom: 1px solid #fecdca; }
.ad-chq-list { list-style: none; margin: 0; padding: 0; }
.ad-chq-list li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 16px; align-items: center; padding: 12px 18px; }
.ad-chq-list li + li { border-top: 1px solid var(--line); }
.ad-chq-main { display: grid; gap: 2px; min-width: 0; }
.ad-chq-main b { font-size: 13.5px; font-weight: 600; }
.ad-chq-main i { font-style: normal; font-size: 12px; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ad-chq-amt { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ad-chq-actions { display: flex; gap: 6px; }
.ad-chq-skel { display: grid; gap: 8px; padding: 14px 18px; }
.ad-chq-skel span { height: 14px; border-radius: 5px; }

/* ledger */
.ad-lhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px 10px; }
.ad-ltitle { display: flex; align-items: center; gap: 10px; }
.ad-ltitle h2 { margin: 0; font-size: 15px; font-weight: 600; }
.ad-licons { display: flex; gap: 6px; }
.ad-inline-err { margin: 0; padding: 0 18px 8px; font-size: 12.5px; color: #b42318; }
.ad-inline-err button { margin-left: 6px; text-decoration: underline; text-underline-offset: 2px; }
.ad-ltools { padding: 0 18px 14px; }
.ad-lrow { display: flex; gap: 8px; flex-wrap: wrap; }
.ad-search { position: relative; display: flex; align-items: center; flex: 1 1 220px; min-width: 0; }
.ad-search .ad-ico { position: absolute; left: 11px; color: var(--faint); pointer-events: none; }
.ad-search input { width: 100%; height: 36px; padding: 0 12px 0 33px; border-radius: 8px; border: 1px solid var(--line-2); background: #fff; font-size: 13px; color: var(--ink); outline: none; }
.ad-search input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.08); }
.ad-filterbtn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 13px; border-radius: 8px; border: 1px solid var(--line-2); background: #fff; font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; }
.ad-filterbtn:hover { background: var(--wash); }
.ad-filterbtn.is-on { background: rgba(20, 22, 28, 0.06); }
.ad-filterbtn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.ad-filterbtn span { font-size: 11.5px; background: var(--ink); color: #fff; border-radius: 99px; padding: 0 6px; line-height: 17px; }
.ad-extra { margin-top: 12px; }
.ad-extra:empty { display: none; }
.ad-lskel { padding: 6px 18px 16px; display: grid; gap: 14px; }
.ad-lskel > div { display: grid; grid-template-columns: 90px 1fr 120px; gap: 20px; }
.ad-lskel span { height: 14px; border-radius: 5px; }
.ad-lempty { text-align: center; padding: 44px 18px 48px; border-top: 1px solid var(--line); }
.ad-lempty h3 { margin: 12px 0 10px; font-size: 15px; font-weight: 600; }

.ad-tablewrap { border-top: 1px solid var(--line); }
.ad-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
.ad-table thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 500; color: var(--mute); border-bottom: 1px solid var(--line); white-space: nowrap; }
.ad-table th:first-child, .ad-table td:first-child { padding-left: 18px; }
.ad-table th:last-child, .ad-table td:last-child { padding-right: 18px; }
.ad-table .r { text-align: right; }
.ad-table tbody tr { cursor: pointer; transition: background 0.1s; outline: none; }
.ad-table tbody tr + tr td { border-top: 1px solid var(--line); }
.ad-table tbody tr:hover, .ad-table tbody tr:focus-visible { background: var(--wash); }
.ad-table tbody tr:focus-visible { box-shadow: inset 0 0 0 2px var(--ink); }
.ad-table td { padding: 12px 14px; vertical-align: middle; font-size: 13.5px; min-width: 0; }
.ad-cut { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-ref { font-weight: 600; }
.ad-dim { color: var(--mute); }
td small.ad-cut { margin-top: 2px; font-size: 12px; }
.ad-amt { white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--ink); }
.ad-amt.is-none { color: var(--faint); }
.ad-bal { font-weight: 600; }
.ad-status { display: inline-block; margin-top: 3px; font-style: normal; font-size: 11.5px; padding: 0 7px; border-radius: 99px; line-height: 18px; border: 1px solid var(--line-2); color: var(--mute); }
.ad-status.is-reversed { color: #b42318; border-color: #fecdca; background: #fef3f2; }
.ad-foot { margin: 0; padding: 10px 18px; font-size: 12px; color: var(--mute); border-top: 1px solid var(--line); }
.ad-mlist { display: none; border-top: 1px solid var(--line); }
.ad-mrow { display: grid; gap: 4px; width: 100%; padding: 13px 16px; text-align: left; border-top: 1px solid var(--line); background: #fff; cursor: pointer; }
.ad-mrow:first-child { border-top: 0; }
.ad-mrow:hover, .ad-mrow:focus-visible { background: var(--wash); outline: none; }
.ad-mtop, .ad-msub { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; min-width: 0; }
.ad-mtop b { font-size: 14px; font-weight: 600; min-width: 0; }
.ad-mtop .ad-amt { font-size: 14px; font-weight: 600; }
.ad-msub { font-size: 12px; color: var(--mute); }
.ad-msub .ad-cut { min-width: 0; }

/* states */
.ad-panel { text-align: center; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 52px 24px; }
.ad-panel-ico { width: 26px; height: 26px; margin: 0 auto; color: var(--mute); }
.ad-panel-ico.is-err { color: #b42318; }
.ad-panel h1 { margin: 14px 0 4px; font-size: 16px; font-weight: 600; }
.ad-panel p { margin: 0 auto 18px; max-width: 400px; font-size: 13.5px; line-height: 1.6; color: var(--mute); }
.ad-panel-actions { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
.ad-skel { display: block; background: linear-gradient(100deg, #eceef2 30%, #f5f6f8 50%, #eceef2 70%); background-size: 220% 100%; animation: ad-shimmer 1.4s linear infinite; }
.ad-skel-head { height: 64px; width: 55%; border-radius: 10px; margin-bottom: 18px; }
.ad-skel-strip { height: 92px; border-radius: 12px; margin-bottom: 16px; }
.ad-skel-card { height: 340px; border-radius: 12px; }
@keyframes ad-shimmer { to { background-position: -120% 0; } }

/* responsive */
@media (max-width: 1100px) {
  .ad-table { table-layout: auto; }
  .ad-table thead th:nth-child(3), .ad-table tbody td:nth-child(3) { display: none; }
}
@media (max-width: 860px) {
  .ad-summary { grid-template-columns: 1fr 1fr; }
  .ad-summary > div:nth-child(3) { border-left: 0; }
  .ad-summary > div:nth-child(n + 3) { border-top: 1px solid var(--line); }
  .ad-chq-list li { grid-template-columns: minmax(0, 1fr) auto; }
  .ad-chq-actions { grid-column: 1 / -1; }
}
@media (max-width: 767px) {
  .ad-tablewrap { display: none; }
  .ad-mlist { display: block; }
  .ad-actions { width: 100%; }
  .ad-actions .ad-btn { flex: 1; }
  .ad-search { flex-basis: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .ad *, .ad *::before, .ad *::after { animation: none !important; transition: none !important; }
}

/* Entry / credit / debit / loan dialogs. Teleported, so the variables are redeclared here instead of inherited from .ad. */
.ad-dlg *, .ad-dlg *::before, .ad-dlg *::after { box-sizing: border-box; }
.ad-dlg .ad-ico { width: 16px; height: 16px; flex: none; }

.ad-dlg-head { flex: none; padding: 20px 56px 16px 24px; border-bottom: 1px solid var(--line); }
.ad-dlg-title { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); line-height: 1.3; }
.ad-dlg-sub { margin-top: 3px; font-size: 13px; color: var(--mute); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ad-dlg-body { padding: 20px 24px; min-width: 0; }
.ad-dlg-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 16px; }
.ad-dlg-fill { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }

.ad-grid { display: grid; gap: 14px 14px; }
.ad-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ad-grid-3 { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1fr); }
.ad-span2 { grid-column: 1 / -1; }
.ad-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ad-lbl { font-size: 12.5px; font-weight: 500; color: var(--ink-2); line-height: 1.2; }
.ad-opt-tag { margin-left: 4px; font-weight: 400; color: var(--faint); }
.ad-hint { font-size: 12px; color: var(--mute); line-height: 1.4; }
.ad-err { font-size: 12px; color: #b42318; line-height: 1.4; }

.ad-in { height: 38px; width: 100%; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 8px; background: #fff; font-size: 14px; color: var(--ink); box-shadow: none; transition: border-color 0.12s, box-shadow 0.12s; }
.ad-in::placeholder { color: var(--faint); }
.ad-in:hover { border-color: #b9bdc7; }
.ad-in:focus, .ad-in:focus-visible { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.1); }
.ad-in[aria-invalid='true'] { border-color: #d92d20; }
.ad-in-num { font-variant-numeric: tabular-nums; font-weight: 600; }
.ad-in-sm { height: 32px; width: 128px; padding: 0 8px; font-size: 12.5px; }
.ad-sel { display: flex; align-items: center; justify-content: space-between; text-align: left; }

.ad-dlg-error { flex: none; margin: 0; padding: 10px 24px; border-top: 1px solid #fecdca; background: #fef3f2; color: #b42318; font-size: 13px; }
.ad-dlg-foot { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 24px; border-top: 1px solid var(--line); background: #fff; }
.ad-dlg-meta { font-size: 13px; color: var(--mute); display: inline-flex; align-items: baseline; gap: 8px; }
.ad-dlg-meta b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.ad-dlg-meta b.is-neg { color: #b42318; }
.ad-dlg-actions { display: flex; gap: 8px; margin-left: auto; }

/* credit: payment method picker */
.ad-pick { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.ad-pick-head { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 14px; border-bottom: 1px solid var(--line); background: var(--wash); }
.ad-pick-head h3 { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.ad-pick-head p { margin-top: 2px; font-size: 12px; color: var(--mute); }
.ad-range { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--faint); }
.ad-pick-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.ad-chq-panel { flex: none; margin-bottom: 14px; padding: 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--wash); }
.ad-chq-note { margin-top: 10px; font-size: 12.5px; color: var(--mute); }
.ad-chq-note.is-future { color: #1d4ed8; }
.ad-pick-msg { padding: 18px 14px; font-size: 13px; color: var(--mute); }
.ad-pick-msg-err { color: #b42318; }
.ad-pick-skel span { display: block; height: 54px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, #f6f7f9, #fff, #f6f7f9); background-size: 200% 100%; animation: ad-shimmer 1.4s linear infinite; }
@keyframes ad-shimmer { to { background-position: -200% 0; } }
.ad-opt { display: flex; align-items: flex-start; gap: 12px; padding: 11px 14px; border-bottom: 1px solid var(--line); transition: background 0.1s; }
.ad-opt:last-child { border-bottom: 0; }
.ad-opt:hover { background: var(--wash); }
.ad-opt.is-on { background: var(--wash); }
.ad-opt label { flex: 1; min-width: 0; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
.ad-opt-name { display: block; font-size: 13.5px; font-weight: 500; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-opt-meta { display: block; font-size: 12px; color: var(--mute); font-variant-numeric: tabular-nums; }
.ad-check { margin-top: 2px; width: 16px; height: 16px; flex: none; accent-color: var(--ink); cursor: pointer; }
.ad-check:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

/* credit: synced sources */
.ad-synced { display: flex; flex-direction: column; gap: 14px; overflow-anchor: none; }
.ad-seg { display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 3px; border-radius: 9px; background: #eceef2; }
.ad-seg-btn { height: 30px; padding: 0 14px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--mute); background: transparent; border: 0; cursor: pointer; transition: background 0.12s, color 0.12s; }
.ad-seg-btn:hover { color: var(--ink); }
.ad-seg-btn.is-on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(20, 22, 28, 0.12); }
.ad-seg-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
.ad-cand-panel { min-height: 180px; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.ad-cand-state { min-height: 180px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 13px; color: var(--mute); }
.ad-cand-state-err { color: #b42318; }
.ad-spin-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--line-2); border-top-color: var(--ink); animation: ad-rot 0.9s linear infinite; }
.ad-cand-total { min-height: 180px; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 16px 18px; background: var(--wash); }
.ad-cand-total strong { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ink); }
.ad-cand-total p { font-size: 12px; color: var(--mute); }
.ad-crumbs { display: flex; flex-wrap: wrap; gap: 2px 14px; font-size: 12px; color: var(--mute); font-variant-numeric: tabular-nums; }
.ad-crumbs b { font-weight: 500; color: var(--ink-2); }
.ad-cand-list { max-height: 260px; overflow-y: auto; }
.ad-cand { display: flex; width: 100%; align-items: center; gap: 12px; padding: 11px 14px; text-align: left; background: #fff; border: 0; border-bottom: 1px solid var(--line); cursor: pointer; transition: background 0.1s; }
.ad-cand:last-child { border-bottom: 0; }
.ad-cand:hover, .ad-cand.is-on { background: var(--wash); }
.ad-cand:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px; }
.ad-cand-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ad-cand-amt { flex: none; font-size: 13.5px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink); }
.ad-radio { width: 16px; height: 16px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1.5px solid var(--line-2); background: #fff; }
.ad-cand.is-on .ad-radio { border-color: var(--ink); }
.ad-radio i { width: 8px; height: 8px; border-radius: 50%; background: var(--ink); }

@media (max-width: 600px) {
  .ad-grid-2, .ad-grid-3 { grid-template-columns: minmax(0, 1fr); }
  .ad-dlg-head, .ad-dlg-body, .ad-dlg-foot, .ad-dlg-error { padding-left: 18px; padding-right: 18px; }
  .ad-dlg-head { padding-right: 48px; }
  .ad-dlg-foot { flex-direction: column-reverse; align-items: stretch; }
  .ad-dlg-actions { margin-left: 0; }
  .ad-dlg-actions .ad-btn { flex: 1; }
  .ad-dlg-meta { justify-content: center; }
  .ad-range { width: 100%; }
  .ad-in-sm { flex: 1; width: auto; }
}

/* entry detail, confirm and success */
.ad-minw { min-width: 0; }
.ad-dlg-headrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ad-center { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 26px 24px 22px; }
.ad-wrap { white-space: normal; line-height: 1.5; margin-top: 8px; }
.ad-big { margin-top: 8px; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ad-tick { width: 36px; height: 36px; margin-bottom: 14px; display: grid; place-items: center; border-radius: 50%; background: var(--ink); color: #fff; }
.ad-tick .ad-ico { width: 18px; height: 18px; stroke-width: 2.5; }
.ad-tick.is-danger { background: #fef3f2; color: #b42318; box-shadow: inset 0 0 0 1px #fecdca; }
.ad-btn-danger-fill { background: #b42318; color: #fff; }
.ad-btn-danger-fill:hover:not(:disabled) { background: #912018; }
.ad-tag { flex: none; display: inline-flex; align-items: center; gap: 7px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--line-2); font-size: 12px; font-weight: 500; color: var(--ink-2); background: #fff; }
.ad-tag-row { height: 20px; padding: 0 8px; gap: 6px; margin-top: 4px; font-size: 11px; }
.ad-tag i { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); }
.ad-tag-pending i { background: #d97706; }
.ad-tag-posted i { background: var(--ink-2); }
.ad-tag-reversed { color: #b42318; border-color: #fecdca; }
.ad-tag-reversed i { background: #d92d20; }
.ad-kv { display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; }
.ad-kv > div { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; min-width: 0; }
.ad-kv dt { color: var(--mute); flex: none; }
.ad-kv dd { min-width: 0; text-align: right; font-weight: 500; color: var(--ink); }
.ad-kv dd.is-none { color: var(--faint); font-weight: 400; }
.ad-kv-sub { font-weight: 400; color: var(--faint); }
.ad-kv-amount dd { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ad-kv-total { padding-top: 12px; border-top: 1px solid var(--line); }
.ad-kv-total dt { color: var(--ink); font-weight: 500; }
.ad-kv-total dd { font-weight: 600; font-variant-numeric: tabular-nums; }
.ad-kv-soft { padding-top: 16px; border-top: 1px solid var(--line); }
.ad-kv-head { margin-bottom: 8px; font-size: 12px; font-weight: 500; color: var(--mute); }
.ad-block { padding-top: 16px; border-top: 1px solid var(--line); }
.ad-block > p:not(.ad-kv-head) { font-size: 13.5px; line-height: 1.55; color: var(--ink-2); }
.ad-cut { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-links { display: flex; flex-direction: column; gap: 8px; list-style: none; padding: 0; margin: 0; }
.ad-links li { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; font-size: 13.5px; }
.ad-links b { font-weight: 500; }
.ad-links i { margin-left: 8px; font-style: normal; font-size: 12px; color: var(--faint); text-transform: capitalize; }
.ad-links strong { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--ink-2); }
</style>
