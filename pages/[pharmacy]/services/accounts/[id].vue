<template>
  <div class="min-h-full bg-transparent">
    <UiDialog v-model:open="successModalOpen" data-print-hide>
      <UiDialogContent class="!flex !flex-col !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[420px]">
        <div class="px-6 py-7 text-center sm:px-8">
          <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircleIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <UiDialogTitle class="mt-4 text-base font-semibold text-slate-950">{{ successModal?.title }}</UiDialogTitle>
          <p v-if="successModal?.amount" class="mt-1.5 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(successModal.amount) }}</p>
          <UiDialogDescription class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{{ successModal?.message }}</UiDialogDescription>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950" @click="dismissSuccessModal">Close</button>
          <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800" @click="focusLedgerFromSuccess">View ledger</button>
        </div>
      </UiDialogContent>
    </UiDialog>

    <UiDialog v-model:open="confirmationModalOpen" data-print-hide>
      <UiDialogContent class="!flex !flex-col !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[420px]">
        <div class="px-6 py-6 sm:px-7">
          <div class="flex items-start gap-3.5">
            <span v-if="confirmationTone === 'danger'" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
            </span>
            <span v-else-if="!confirmationModal?.amount" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <QuestionMarkCircleIcon class="h-5 w-5" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <UiDialogTitle class="text-base font-semibold text-slate-950">{{ confirmationModal?.title }}</UiDialogTitle>
              <p v-if="confirmationModal?.amount" class="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(confirmationModal.amount) }}</p>
              <UiDialogDescription class="mt-1.5 text-sm leading-6 text-slate-500">{{ confirmationModal?.message }}</UiDialogDescription>
            </div>
          </div>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" :disabled="isConfirming" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 disabled:opacity-60" @click="cancelConfirmation">Cancel</button>
          <button type="button" :disabled="isConfirming" class="inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60" :class="confirmationTone === 'danger' ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-600' : 'bg-slate-950 hover:bg-slate-800 focus-visible:ring-slate-950'" @click="confirmPendingAction">{{ isConfirming ? 'Working…' : (confirmationModal?.confirmLabel || 'Confirm') }}</button>
        </div>
      </UiDialogContent>
    </UiDialog>
    <div v-if="isLoading" class="mx-auto max-w-[1220px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8" aria-label="Loading account">
      <div class="space-y-4">
        <div class="h-5 w-24 animate-pulse rounded bg-slate-200" />
        <div class="h-20 w-2/3 animate-pulse rounded-xl bg-white" />
        <div class="h-28 animate-pulse rounded-xl bg-white" />
        <div class="h-[420px] animate-pulse rounded-xl bg-white" />
      </div>
    </div>

    <div v-else-if="error" class="mx-auto max-w-[1220px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section class="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 class="mt-4 text-base font-semibold text-slate-950">We could not load this account</h1>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{{ error }}</p>
        <div class="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" class="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" @click="loadCurrentAccount">Try again</button>
          <NuxtLink :to="accountsPath" class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">Back to accounts</NuxtLink>
        </div>
      </section>
    </div>

    <div v-else-if="account" data-ledger-print-root class="mx-auto max-w-[1220px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
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

      <header data-print-hide class="mb-4 flex flex-col gap-5 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="min-w-0">
          <NuxtLink :to="accountsPath" class="inline-flex min-h-8 items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
            <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
            Accounts
          </NuxtLink>
          <div class="mt-3 flex items-start gap-3 sm:gap-3.5">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
              <component :is="accountIcon(account.type)" class="h-5 w-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 class="truncate text-2xl font-semibold tracking-tight text-slate-950">{{ account.name }}</h1>
                <span class="inline-flex items-center text-sm text-slate-400">{{ accountTypeLabels[account.type] }}</span>
              </div>
              <p class="mt-0.5 truncate text-sm text-slate-500">{{ accountSubtitle(account) }}</p>
            </div>
          </div>
        </div>
        <div v-if="isLoanAccount" class="flex w-full gap-2 sm:w-auto">
          <button type="button" class="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 sm:flex-none" @click="openLoanModal('repaid')"><ArrowUpIcon class="h-4 w-4" aria-hidden="true" />Make repayment</button>
          <button type="button" class="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 sm:flex-none" @click="openLoanModal('received')"><ArrowDownIcon class="h-4 w-4" aria-hidden="true" />Receive loan</button>
        </div>
        <div v-else class="flex w-full gap-2 sm:w-auto">
          <button type="button" class="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 sm:flex-none" @click="openMoneyOutModal">
            <ArrowUpIcon class="h-4 w-4" aria-hidden="true" />
            Debit
          </button>
          <button type="button" class="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 sm:flex-none" @click="openMoneyInModal">
            <ArrowDownIcon class="h-4 w-4" aria-hidden="true" />
            Credit
          </button>
        </div>
      </header>

      <section data-print-hide class="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="grid gap-4 px-5 py-4 sm:grid-cols-[1.2fr_1fr_1fr] sm:gap-0 sm:px-6">
          <div class="sm:border-r sm:border-slate-100 sm:pr-6">
            <p class="text-xs text-slate-400">{{ isLoanAccount ? 'Outstanding loan' : 'Current balance' }}</p>
            <p class="mt-1 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{{ formatMoney(account.currentBalance) }}</p>
            <p class="mt-1.5 text-xs text-slate-400">Last activity {{ formatDate(account.lastMovementAt) }}</p>
          </div>
          <div class="flex items-center sm:px-6">
            <div><p class="text-xs text-slate-400">{{ isLoanAccount ? 'Received' : 'Money in' }}</p><p class="mt-1 text-base font-semibold tabular-nums text-emerald-700">+{{ formatMoney(account.moneyIn) }}</p></div>
          </div>
          <div class="flex items-center sm:border-l sm:border-slate-100 sm:pl-6">
            <div><p class="text-xs text-slate-400">{{ isLoanAccount ? 'Repaid' : 'Money out' }}</p><p class="mt-1 text-base font-semibold tabular-nums text-slate-700">&minus;{{ formatMoney(account.moneyOut) }}</p></div>
          </div>
        </div>
      </section>

      <section
        v-if="actionalCheques.length || isLoadingCheques"
        data-print-hide
        class="mb-4 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm"
        aria-label="Cheques awaiting clearance"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/70 px-5 py-3.5">
          <div>
            <h2 class="text-sm font-semibold text-slate-950">Cheques awaiting clearance</h2>
            <p class="mt-0.5 text-xs text-slate-600">Received cheques are not part of the balance until they clear.</p>
          </div>
          <span class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{{ actionalCheques.length }} pending</span>
        </div>
        <p v-if="chequeError" class="border-b border-rose-100 bg-rose-50 px-5 py-2 text-sm text-rose-700">{{ chequeError }}</p>
        <div v-if="isLoadingCheques" class="space-y-2 px-5 py-4">
          <div v-for="item in 2" :key="item" class="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="cheque in actionalCheques" :key="cheque.id" class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-950">Cheque {{ cheque.chequeNumber }}</p>
              <p class="mt-0.5 truncate text-xs text-slate-500">
                {{ [cheque.bankName, cheque.drawerName].filter(Boolean).join(' · ') || 'No bank details' }}
                <template v-if="cheque.expectedClearanceDate"> · expected {{ cheque.expectedClearanceDate }}</template>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="mr-1 text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(cheque.amount) }}</span>
              <button type="button" :disabled="isSaving" class="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60" @click="requestChequeAction('deposit', cheque.id)">Deposit</button>
              <button type="button" :disabled="isSaving" class="inline-flex min-h-9 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60" @click="requestChequeAction('clear', cheque.id)">Mark cleared</button>
              <button type="button" :disabled="isSaving" class="inline-flex min-h-9 items-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60" @click="requestChequeAction('bounce', cheque.id)">Bounce</button>
            </div>
          </li>
        </ul>
      </section>

      <section data-ledger-print-section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div data-print-hide class="border-b border-slate-200 px-4 py-4 sm:px-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-slate-950">Ledger</h2>
                <span v-if="account.pendingReview > 0" class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{{ account.pendingReview }} pending review</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" :disabled="isRefreshing" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60" aria-label="Refresh ledger" title="Refresh ledger" :aria-busy="isRefreshing" @click="refreshCurrentAccount">
                <ArrowPathIcon class="h-4 w-4" :class="isRefreshing ? 'animate-spin' : ''" aria-hidden="true" />
              </button>
              <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" aria-label="Print ledger" title="Print ledger" @click="printLedger">
                <PrinterIcon class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p v-if="refreshError" role="status" class="mt-2 text-xs font-medium text-rose-700">
            {{ refreshError }}
            <button type="button" class="ml-1 underline underline-offset-2" @click="refreshCurrentAccount">Try again</button>
          </p>

          <div class="mt-3 space-y-3">
            <div class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_190px_auto]">
              <div class="relative min-w-0">
                <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <UiInput v-model="ledgerSearch" aria-label="Search ledger" placeholder="Search references, sources, or methods" class="h-10 rounded-lg border-slate-200 pl-9 text-sm focus-visible:ring-slate-950" />
              </div>
              <UiSelect v-model="ledgerDatePreset" @update:model-value="applyLedgerDatePreset">
                <UiSelectTrigger aria-label="Ledger period" class="h-10 rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700 focus:ring-slate-950"><UiSelectValue placeholder="This month" /></UiSelectTrigger>
                <UiSelectContent :body-lock="false">
                  <UiSelectItem v-for="option in ledgerPeriodOptions" :key="option.value" :value="option.value">{{ option.label }}</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                :class="ledgerMoreFiltersOpen || ledgerAdvancedFilterCount ? 'border-slate-300 bg-slate-100 text-slate-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                :aria-expanded="ledgerMoreFiltersOpen"
                aria-controls="ledger-advanced-filters"
                @click="ledgerMoreFiltersOpen = !ledgerMoreFiltersOpen"
              >
                <FunnelIcon class="h-4 w-4" aria-hidden="true" />
                Filters<span v-if="ledgerAdvancedFilterCount"> ({{ ledgerAdvancedFilterCount }})</span>
              </button>
            </div>

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

            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <p v-if="ledgerDateRangeInvalid" class="font-medium text-rose-600">The from date cannot be after the to date.</p>
              <p v-else class="text-slate-500">{{ ledgerViewSummary }}</p>
            </div>
          </div>
        </div>

        <div v-if="isLoadingLedger" data-print-hide class="space-y-3 px-6 py-8" aria-label="Loading ledger">
          <div v-for="item in 5" :key="item" class="flex items-center gap-4">
            <div class="h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div class="h-4 flex-1 animate-pulse rounded bg-slate-100" />
            <div class="h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div v-else-if="ledger.length === 0" data-print-hide class="px-6 py-16 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><DocumentTextIcon class="h-6 w-6" aria-hidden="true" /></div>
          <h3 class="mt-5 text-base font-semibold text-slate-950">No ledger entries yet</h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Use Credit for sales and other receipts, or Debit for payments, withdrawals, and charges.</p>
          <div class="mt-5 flex justify-center gap-2"><button type="button" class="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700" @click="openMoneyOutModal">Record debit</button><button type="button" class="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white" @click="openMoneyInModal">Record credit</button></div>
        </div>

        <div v-else-if="visibleLedger.length === 0" data-print-hide class="px-6 py-14 text-center">
          <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"><MagnifyingGlassIcon class="h-5 w-5" aria-hidden="true" /></div>
          <h3 class="mt-4 text-base font-semibold text-slate-950">No matching entries</h3>
          <p class="mt-2 text-sm text-slate-600">Clear the active filters to see the full ledger.</p>
          <button type="button" class="mt-4 text-sm font-semibold text-slate-950 underline underline-offset-4" @click="clearLedgerFilters">Clear filters</button>
        </div>

        <template v-else>
          <div data-ledger-print-table class="hidden w-full overflow-hidden md:block">
            <table class="w-full table-fixed border-collapse">
              <colgroup>
                <col class="w-[12%]" />
                <col class="w-[18%]" />
                <col class="w-[16%]" />
                <col class="w-[24%]" />
                <col class="w-[10%]" />
                <col class="w-[10%]" />
                <col class="w-[10%]" />
              </colgroup>
              <thead>
                <tr class="border-b border-slate-200">
                  <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Date</th>
                  <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Reference</th>
                  <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Recorded by</th>
                  <th scope="col" class="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Source</th>
                  <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">{{ isLoanAccount ? 'Received (GH₵)' : 'Money in (GH₵)' }}</th>
                  <th scope="col" class="px-4 py-2.5 text-right text-xs font-medium text-slate-400">{{ isLoanAccount ? 'Repaid (GH₵)' : 'Money out (GH₵)' }}</th>
                  <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">{{ isLoanAccount ? 'Outstanding (GH₵)' : 'Balance (GH₵)' }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="entry in visibleLedger" :key="entry.id" class="cursor-pointer transition-colors hover:bg-slate-50 active:bg-slate-100 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-700" tabindex="0" @click="openLedgerEntry(entry)" @keydown.enter="openLedgerEntry(entry)" @keydown.space.prevent="openLedgerEntry(entry)">
                  <td class="min-w-0 whitespace-nowrap px-5 py-3 align-middle text-sm text-slate-500">{{ ledgerTableDate(entry) }}</td>
                   <td class="min-w-0 px-4 py-3 align-middle"><p class="w-full min-w-0 max-w-full truncate text-sm font-medium text-slate-800" :title="entry.reference || ledgerEntrySummary(entry)">{{ ledgerReferenceDisplay(entry) }}</p></td>
                  <td class="min-w-0 px-4 py-3 align-middle"><p class="w-full min-w-0 max-w-full truncate text-sm text-slate-500" :title="recordedByLabel(entry)">{{ recordedByLabel(entry) }}</p><p v-if="entry.status !== 'posted'" class="w-full min-w-0 max-w-full truncate mt-0.5 text-xs text-slate-400">{{ statusLabel(entry.status) }}</p></td>
                  <td class="min-w-0 px-4 py-3 align-middle"><p class="w-full min-w-0 max-w-full truncate text-sm text-slate-500" :title="ledgerSourceLabel(entry)">{{ ledgerSourceLabel(entry) }}</p><p v-if="ledgerSourceDetail(entry)" class="w-full min-w-0 max-w-full truncate mt-0.5 text-xs text-slate-400">{{ ledgerSourceDetail(entry) }}</p></td>
                  <td class="whitespace-nowrap px-4 py-3 text-right align-middle text-sm tabular-nums text-emerald-700">{{ entry.moneyIn ? `+${formatLedgerAmount(entry.moneyIn)}` : '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-right align-middle text-sm tabular-nums text-slate-600">{{ entry.moneyOut ? `−${formatLedgerAmount(entry.moneyOut)}` : '—' }}</td>
                  <td class="whitespace-nowrap px-5 py-3 text-right align-middle text-sm font-semibold tabular-nums text-slate-950">{{ formatLedgerAmount(entry.runningBalance) }}</td>
                </tr>
              </tbody>
            </table>
            <p class="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">Balance is the account total after each entry, not a filtered-period balance.</p>
          </div>

          <div data-print-hide class="divide-y divide-slate-200 md:hidden">
            <button v-for="entry in visibleLedger" :key="`mobile-ledger-${entry.id}`" type="button" class="block w-full px-4 py-4 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-700" @click="openLedgerEntry(entry)">
              <div class="flex items-start justify-between gap-4">
                 <div class="min-w-0"><p class="text-xs tabular-nums text-slate-500">{{ ledgerTableDate(entry) }}</p><p class="mt-1 truncate text-sm font-medium text-slate-800" :title="entry.reference || ledgerEntrySummary(entry)">{{ ledgerReferenceDisplay(entry) }}</p><p class="mt-1 truncate text-xs text-slate-500">{{ ledgerSourceLabel(entry) }}<template v-if="ledgerSourceDetail(entry)"> · {{ ledgerSourceDetail(entry) }}</template></p><p class="mt-1 truncate text-xs text-slate-500"><span class="font-medium text-slate-700">Recorded by:</span> {{ recordedByLabel(entry) }}<span v-if="entry.status !== 'posted'"> · {{ statusLabel(entry.status) }}</span></p></div><ChevronRightIcon class="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /></div>
              <div class="mt-4 grid grid-cols-3 border-t border-slate-100 pt-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{{ isLoanAccount ? 'Received (GH₵)' : 'Money in (GH₵)' }}</p><p class="mt-1 text-sm tabular-nums text-emerald-700">{{ entry.moneyIn ? `+${formatLedgerAmount(entry.moneyIn)}` : '—' }}</p></div><div><p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{{ isLoanAccount ? 'Repaid (GH₵)' : 'Money out (GH₵)' }}</p><p class="mt-1 text-sm tabular-nums text-slate-600">{{ entry.moneyOut ? `−${formatLedgerAmount(entry.moneyOut)}` : '—' }}</p></div><div class="text-right"><p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{{ isLoanAccount ? 'Outstanding (GH₵)' : 'Balance (GH₵)' }}</p><p class="mt-1 text-sm font-semibold tabular-nums text-slate-950">{{ formatLedgerAmount(entry.runningBalance) }}</p></div></div>
            </button>
            <p class="px-4 py-3 text-xs text-slate-500">Balance is the account total after each entry, not a filtered-period balance.</p>
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
                    <span v-if="entry.status !== 'posted'" class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusBadgeClass(entry.status)">{{ statusLabel(entry.status) }}</span>
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

    <div v-else class="mx-auto max-w-[1220px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><ExclamationTriangleIcon class="h-6 w-6" aria-hidden="true" /></div>
        <h1 class="mt-5 text-base font-semibold text-slate-950">Account not found</h1>
        <p class="mt-2 text-sm text-slate-600">The account may have been removed or the link is incorrect.</p>
        <NuxtLink :to="accountsPath" class="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Back to accounts</NuxtLink>
      </section>
    </div>
  </div>

  <UiDialog v-model:open="ledgerDetailOpen" data-print-hide>
    <UiDialogContent class="!flex !max-h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] !max-w-[500px] !flex-col !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 sm:!max-w-[500px]">
      <div v-if="selectedLedgerEntry" class="flex min-h-0 w-full min-w-0 flex-col">
        <header class="shrink-0 border-b border-slate-200 px-6 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <UiDialogTitle class="truncate text-base font-semibold text-slate-950">{{ ledgerEntrySummary(selectedLedgerEntry) }}</UiDialogTitle>
              <UiDialogDescription class="mt-0.5 truncate text-xs text-slate-500">{{ formatDate(selectedLedgerEntry.date) }} · {{ ledgerSourceLabel(selectedLedgerEntry) }}</UiDialogDescription>
            </div>
            <span class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusBadgeClass(selectedLedgerEntry.status)">{{ statusLabel(selectedLedgerEntry.status) }}</span>
          </div>
        </header>

        <div class="box-border min-h-0 w-full min-w-0 flex-1 overscroll-contain overflow-x-hidden overflow-y-auto px-6 py-5">
          <div class="flex items-baseline justify-between gap-6">
            <span class="text-sm text-slate-500">{{ isLoanAccount ? (selectedLedgerEntry.moneyIn ? 'Loan received' : 'Repayment recorded') : (selectedLedgerEntry.moneyIn ? 'Credit' : 'Debit') }}</span>
            <span class="text-2xl font-semibold tabular-nums" :class="selectedLedgerEntry.moneyIn ? 'text-emerald-700' : 'text-slate-950'">{{ selectedLedgerEntry.moneyIn ? '+' : '−' }}{{ formatMoney(selectedLedgerEntry.moneyIn || selectedLedgerEntry.moneyOut) }}</span>
          </div>
          <div class="mt-2 flex items-baseline justify-between gap-6 border-t border-slate-200 pt-2.5">
            <span class="text-sm font-medium text-slate-900">Balance after entry</span>
            <span class="text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(selectedLedgerEntry.runningBalance) }}</span>
          </div>

          <dl class="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
            <div class="flex items-baseline justify-between gap-6">
              <dt class="text-slate-500">Reference</dt>
              <dd class="text-right font-medium" :class="selectedLedgerEntry.reference ? 'text-slate-800' : 'text-slate-400'">{{ selectedLedgerEntry.reference || 'None' }}</dd>
            </div>
            <div v-if="ledgerPaymentMethodDisplay(selectedLedgerEntry)" class="flex items-baseline justify-between gap-6">
              <dt class="text-slate-500">Payment method</dt>
              <dd class="text-right font-medium text-slate-800">{{ ledgerPaymentMethodDisplay(selectedLedgerEntry) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-6">
              <dt class="text-slate-500">Recorded by</dt>
              <dd class="text-right font-medium text-slate-800">{{ recordedByLabel(selectedLedgerEntry) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-6">
              <dt class="text-slate-500">Entry source</dt>
              <dd class="text-right font-medium text-slate-800">{{ ledgerSourceLabel(selectedLedgerEntry) }}<template v-if="ledgerSourceDetail(selectedLedgerEntry)"><span class="font-normal text-slate-400"> · {{ ledgerSourceDetail(selectedLedgerEntry) }}</span></template></dd>
            </div>
          </dl>

          <div v-if="ledgerDescription(selectedLedgerEntry)" class="mt-4 border-t border-slate-100 pt-4">
            <p class="text-xs text-slate-400">Description</p>
            <p class="mt-1 text-sm leading-6 text-slate-700">{{ ledgerDescription(selectedLedgerEntry) }}</p>
          </div>

          <div v-if="selectedLedgerEntry.metadata?.context" class="mt-4 border-t border-slate-100 pt-4">
            <p class="text-xs text-slate-400">Context</p>
            <p class="mt-1 text-sm leading-6 text-slate-700">{{ selectedLedgerEntry.metadata.context }}</p>
          </div>

          <div v-if="selectedLedgerEntry.paymentContext?.fields?.length" class="mt-4 border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Payment details</p>
            <dl class="mt-3 space-y-2.5 text-sm">
              <div v-for="field in selectedLedgerEntry.paymentContext?.fields || []" :key="field.key" class="flex items-baseline justify-between gap-6">
                <dt class="text-slate-500">{{ field.label }}</dt>
                <dd class="max-w-[62%] truncate text-right font-medium text-slate-800" :title="field.value">{{ field.value }}</dd>
              </div>
            </dl>
          </div>

          <div v-if="ledgerAdditionalDetails(selectedLedgerEntry).length" class="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
            <div v-for="detail in ledgerAdditionalDetails(selectedLedgerEntry)" :key="detail.key" class="flex items-baseline justify-between gap-6">
              <dt class="text-slate-500">{{ detail.label }}</dt>
              <dd class="text-right font-medium text-slate-800">{{ detail.value }}</dd>
            </div>
          </div>

          <div v-if="selectedLedgerEntry.sourceLinks?.length" class="mt-4 border-t border-slate-100 pt-4">
            <p class="text-xs text-slate-400">Linked records</p>
            <div class="mt-2 space-y-2">
              <div v-for="link in selectedLedgerEntry.sourceLinks" :key="`${link.sourceType}-${link.sourceKey}`" class="flex items-baseline justify-between gap-6 text-sm">
                <span class="min-w-0"><span class="font-medium text-slate-800">{{ link.sourceKey }}</span><span class="ml-2 text-xs text-slate-400">{{ link.sourceType.replace('_', ' ') }}</span></span>
                <span class="shrink-0 font-medium tabular-nums text-slate-700">{{ formatMoney(link.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <footer class="box-border flex w-full min-w-0 max-w-full shrink-0 items-center justify-between gap-3 overflow-hidden border-t border-slate-200 bg-white px-6 py-3.5">
          <button
            v-if="selectedLedgerEntry.status === 'posted'"
            type="button"
            :disabled="isReversing"
            class="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            @click="requestReverseSelectedEntry"
          >
            <ArrowPathIcon v-if="isReversing" class="h-4 w-4 animate-spin" aria-hidden="true" />
            {{ isReversing ? 'Reversing…' : 'Reverse' }}
          </button>
          <p v-if="reversalError" class="min-w-0 flex-1 truncate text-xs font-medium text-rose-600">{{ reversalError }}</p>
          <button type="button" class="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="ledgerDetailOpen = false">Close</button>
        </footer>
      </div>
    </UiDialogContent>
  </UiDialog>

  <UiDialog v-model:open="moneyInModalOpen" data-print-hide>
    <UiDialogContent class="!flex !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] h-[min(680px,calc(100vh-2rem))] min-h-0 min-w-0 !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[820px]">
      <div class="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div class="shrink-0 border-b border-slate-200 px-6 py-3">
          <UiDialogTitle class="truncate text-base font-semibold text-slate-950">Credit {{ account?.name }}</UiDialogTitle>
          <UiDialogDescription class="mt-0.5 text-xs text-slate-500">Record money received into this account.</UiDialogDescription>
        </div>
        <div class="box-border flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-6 py-2">
          <div v-if="usesPaymentGuide" class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
            <section class="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div class="flex items-baseline justify-between gap-3">
                <h3 class="text-sm font-semibold text-slate-950">Credit details</h3>
                <span class="text-[11px] text-slate-500">Amount and optional details</span>
              </div>
              <div class="mt-2 grid gap-2 sm:grid-cols-[minmax(0,190px)_minmax(0,1fr)_minmax(0,1fr)]">
                <div class="space-y-1.5">
                  <UiLabel for="money-in-amount" class="text-xs font-medium text-slate-700">Total amount received</UiLabel>
                  <UiInput id="money-in-amount" v-model="moneyInForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" :aria-invalid="isMoneyInFieldInvalid('amount')" class="h-9 border-slate-200 text-sm font-semibold tabular-nums focus-visible:ring-slate-950" @blur="touchMoneyInField('amount')" />
                  <p v-if="isMoneyInFieldInvalid('amount')" class="text-xs text-rose-600">{{ moneyInErrors.amount }}</p>
                </div>
                <div class="space-y-1.5">
                  <UiLabel for="money-in-reference" class="text-xs font-medium text-slate-600">Reference <span class="font-normal text-slate-400">(optional)</span></UiLabel>
                  <UiInput id="money-in-reference" v-model="moneyInForm.reference" placeholder="Deposit slip, batch, or note" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" />
                </div>
                <div class="space-y-1.5">
                  <UiLabel for="money-in-note" class="text-xs font-medium text-slate-600">Recipient <span class="font-normal text-slate-400">(optional)</span></UiLabel>
                  <UiInput id="money-in-note" v-model="moneyInForm.description" placeholder="Customer, payer, or source of funds" class="h-9 border-slate-200 text-sm focus-visible:ring-slate-950" />
                </div>
              </div>
            </section>

            <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2">
                <div>
                  <h3 class="text-sm font-semibold text-slate-950">How was this paid?</h3>
                  <p class="mt-0.5 text-xs text-slate-500">Select every method included in this credit.</p>
                </div>
                <div class="flex items-center gap-2">
                  <UiInput v-model="guideFromDate" type="date" aria-label="Guide from date" class="h-9 w-[138px] border-slate-200 bg-white text-xs focus-visible:ring-slate-950" />
                  <span class="text-xs text-slate-400">to</span>
                  <UiInput v-model="guideToDate" type="date" aria-label="Guide to date" class="h-9 w-[138px] border-slate-200 bg-white text-xs focus-visible:ring-slate-950" />
                </div>
              </div>
              <div ref="moneyInScrollRegion" class="min-h-0 flex-1 overscroll-contain overflow-y-auto">
                <div v-if="creditGuideError" class="px-4 py-3 text-sm text-rose-700">{{ creditGuideError }}</div>
                <div v-else-if="isLoadingCandidates" class="divide-y divide-slate-100"><div v-for="item in 8" :key="item" class="h-16 animate-pulse bg-slate-50" /></div>
                <div v-else-if="creditGuideMethods.length" class="divide-y divide-slate-100">
                  <div v-for="item in creditGuideMethods" :key="item.id" class="px-4 py-2.5">
                    <div class="flex items-start gap-3">
                      <input :id="paymentMethodInputId(item.id)" type="checkbox" :checked="isPaymentMethodSelected(item.id)" class="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-950 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" @change="togglePaymentMethod(item.id, $event)">
                      <label :for="paymentMethodInputId(item.id)" class="min-w-0 flex-1 cursor-pointer">
                        <span class="block truncate text-sm font-semibold text-slate-900">{{ item.label }}</span>
                        <span class="mt-0.5 block text-xs text-slate-500">So far: <span class="font-semibold text-slate-700">{{ formatMoney(item.amount) }}</span> across {{ item.entries }} {{ item.entries === 1 ? 'payment' : 'payments' }}</span>
                      </label>
                      <span v-if="isPaymentMethodSelected(item.id)" class="shrink-0 text-xs font-semibold text-slate-700">Selected</span>
                    </div>
                  </div>
                </div>
                <div v-else class="px-4 py-4 text-sm text-slate-500">No payment methods are available yet.</div>
              </div>
              <div class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-1.5">
                <p class="text-xs font-medium text-slate-500">{{ selectedPaymentMethodCount }} {{ selectedPaymentMethodCount === 1 ? 'payment method' : 'payment methods' }} selected · recorded as one credit</p>
              </div>
            </section>
          </div>
          <div v-else ref="moneyInScrollRegion" class="min-h-0 flex-1 space-y-5 overflow-y-auto">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5">
                <UiLabel for="money-in-source" class="text-xs font-medium text-slate-600">Credit source</UiLabel>
                <UiSelect v-model="moneyInForm.source">
                  <UiSelectTrigger id="money-in-source" class="h-10 rounded-lg border-slate-200 bg-white text-sm focus:ring-slate-950">
                    <UiSelectValue />
                  </UiSelectTrigger>
                <UiSelectContent :body-lock="false">
                    <UiSelectItem v-for="option in moneyInSourceOptions" :key="option.value" :value="option.value">{{ option.label }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div v-if="supportsSyncedCredits" class="space-y-1.5">
                <UiLabel for="money-in-sync-date" class="text-xs font-medium text-slate-600">{{ moneyInForm.source === 'sales' ? 'Sales date' : (moneyInForm.source === 'cheque' ? 'Cheque date' : 'Payment date') }}</UiLabel>
                <UiInput id="money-in-sync-date" v-model="moneyInSyncDate" type="date" class="h-10 rounded-lg border-slate-200 bg-white text-sm focus-visible:ring-slate-950" />
              </div>
            </div>

            <div v-if="supportsSyncedCredits" class="space-y-4 [overflow-anchor:none]">
              <div v-if="moneyInGroupingOptions.length" class="space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs font-medium text-slate-400">{{ moneyInForm.source === 'sales' ? 'Group sales by' : 'Group payments by' }}</p>
                  <span class="text-xs text-slate-400">Choose one view</span>
                </div>
                <div role="tablist" :aria-label="moneyInForm.source === 'sales' ? 'Group sales by' : 'Group payments by'" class="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                  v-for="option in moneyInGroupingOptions"
                  :key="option.value"
                  type="button"
                  role="tab"
                  :aria-selected="moneyInCandidateGroupBy === option.value"
                  :aria-pressed="moneyInCandidateGroupBy === option.value"
                  class="min-h-10 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-1"
                  :class="moneyInCandidateGroupBy === option.value ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'"
                  @click="changeMoneyInCandidateGroup(option.value)"
                >
                  {{ option.label }}
                </button>
                </div>
              </div>

              <div ref="moneyInCandidatesPanel" class="min-h-[220px]" :style="{ minHeight: `${moneyInCandidatePanelHeight}px` }">
              <div v-if="creditCandidatesError" class="flex min-h-[220px] items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <div class="flex items-start gap-2 text-sm text-rose-700">
                  <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{{ creditCandidatesError }}</span>
                </div>
              </div>
              <div v-else-if="isLoadingCandidates" class="flex min-h-[220px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
                  <span class="text-sm text-slate-600">Loading...</span>
                </div>
              </div>
              <div v-else-if="moneyInCandidateGroupBy === 'total'" class="flex min-h-[220px] flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p class="text-xs font-medium text-slate-400">Available to post</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{{ formatMoney(creditCandidates?.summary.availableAmount ?? creditCandidates?.summary.totalAmount ?? 0) }}</p>
                <div v-if="selectedCreditCandidate?.paymentBreakdown?.length" class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span v-for="breakdown in selectedCreditCandidate.paymentBreakdown" :key="breakdown.method" class="inline-flex items-center gap-1">
                    <span class="font-semibold text-slate-800">{{ paymentMethodLabel(breakdown.method) }}</span>
                    <span class="tabular-nums">{{ formatMoney(breakdown.amount) }}</span>
                  </span>
                </div>
                <p v-if="selectedCreditCandidate && candidateContext(selectedCreditCandidate)" class="mt-1 text-xs text-slate-500">{{ candidateContext(selectedCreditCandidate) }}</p>
              </div>
              <div v-else class="min-h-[220px] rounded-xl border border-slate-200 bg-white">
                <div v-if="creditCandidates?.candidates.length" class="divide-y divide-slate-100">
                  <button
                    v-for="candidate in creditCandidates.candidates"
                    :key="candidate.id"
                    type="button"
                    class="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden px-4 py-3 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    :class="selectedCreditCandidateId === candidate.id ? 'bg-slate-50' : ''"
                    @click="applyCreditCandidate(candidate.id)"
                  >
                    <span class="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        class="flex h-4 w-4 items-center justify-center rounded-full border-2"
                        :class="selectedCreditCandidateId === candidate.id ? 'border-slate-950' : 'border-slate-300'"
                      >
                        <span v-if="selectedCreditCandidateId === candidate.id" class="h-2 w-2 rounded-full bg-slate-950" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-slate-950">{{ candidate.label }}</span>
                        <span v-if="candidate.paymentBreakdown?.length" class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-4 text-slate-500">
                          <span v-for="breakdown in candidate.paymentBreakdown" :key="breakdown.method" class="inline-flex items-center gap-1 whitespace-nowrap">
                            <span class="font-medium text-slate-700">{{ paymentMethodLabel(breakdown.method) }}</span>
                            <span class="tabular-nums">{{ formatMoney(breakdown.amount) }}</span>
                          </span>
                        </span>
                        <span v-if="candidateContext(candidate)" class="mt-0.5 block break-words text-xs leading-4 text-slate-500">{{ candidateContext(candidate) }}</span>
                      </span>
                    </span>
                    <span class="shrink-0 text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(candidate.amount) }}</span>
                  </button>
                </div>
                <div v-else class="px-4 py-8 text-center">
                  <p class="text-sm text-slate-500">No {{ candidateGroupLabel.toLowerCase() }} found for this date.</p>
                </div>
              </div>
              </div>
            </div>

            <p v-if="isMoneyInFieldInvalid('candidate')" class="text-xs text-rose-600">Select a synced source before posting this credit.</p>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5">
                <UiLabel for="money-in-amount" class="text-xs font-medium text-slate-600">Amount</UiLabel>
                <UiInput id="money-in-amount" v-model="moneyInForm.amount" type="number" min="0.01" step="0.01" :max="supportsSyncedCredits ? selectedCreditCandidate?.amount : undefined" placeholder="0.00" :aria-invalid="isMoneyInFieldInvalid('amount')" class="h-10 rounded-lg border-slate-200 text-sm font-semibold tabular-nums focus-visible:ring-slate-950" @blur="touchMoneyInField('amount')" />
                <p v-if="isMoneyInFieldInvalid('amount')" class="text-xs text-rose-600">{{ moneyInErrors.amount }}</p>
                <p v-else-if="supportsSyncedCredits && selectedCreditCandidate" class="text-xs text-slate-500">Up to {{ formatMoney(selectedCreditCandidate.amount) }} from this synced selection.</p>
              </div>
              <div class="space-y-1.5">
                <UiLabel for="money-in-reference" class="text-xs font-medium text-slate-600">{{ selectedMoneyInSource.referenceLabel }}</UiLabel>
                <UiInput id="money-in-reference" v-model="moneyInForm.reference" :placeholder="selectedMoneyInSource.referencePlaceholder" :aria-invalid="isMoneyInFieldInvalid('reference')" class="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchMoneyInField('reference')" />
                <p v-if="isMoneyInFieldInvalid('reference')" class="text-xs text-rose-600">{{ moneyInErrors.reference }}</p>
              </div>
              <div class="space-y-1.5 sm:col-span-2">
                <UiLabel for="money-in-note" class="text-xs font-medium text-slate-600">Recipient <span v-if="!isMoneyInFieldInvalid('description')" class="font-normal text-slate-400">(optional)</span></UiLabel>
                <UiInput id="money-in-note" v-model="moneyInForm.description" :placeholder="selectedMoneyInSource.descriptionPlaceholder" :aria-invalid="isMoneyInFieldInvalid('description')" class="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchMoneyInField('description')" />
                <p v-if="isMoneyInFieldInvalid('description')" class="text-xs text-rose-600">{{ moneyInErrors.description }}</p>
              </div>
              <div class="space-y-1.5 sm:col-span-2">
                <UiLabel for="money-in-context" class="text-xs font-medium text-slate-600">{{ selectedMoneyInSource.contextLabel }} <span class="font-normal text-slate-400">(optional)</span></UiLabel>
                <UiInput id="money-in-context" v-model="moneyInForm.context" :placeholder="selectedMoneyInSource.contextPlaceholder" class="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" />
              </div>
            </div>
          </div>
        </div>
        <div v-if="moneyInError" class="shrink-0 border-t border-rose-200 bg-rose-50 px-6 py-1.5 text-xs text-rose-700">{{ moneyInError }}</div>
        <div class="flex w-full min-w-0 shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-1.5">
          <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="closeMoneyInModal">Cancel</button>
          <button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!canSubmitMoneyIn || isSaving || isLoadingCandidates" @click="submitMoneyIn">
            {{ isSaving ? 'Posting...' : (usesPaymentGuide ? 'Add money' : `Post ${selectedMoneyInSource.label.toLowerCase()}`) }}
          </button>
        </div>
      </div>
    </UiDialogContent>
  </UiDialog>

  <UiDialog v-model:open="moneyOutModalOpen" data-print-hide>
    <UiDialogContent class="!flex !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] h-[min(600px,calc(100vh-2rem))] min-h-0 min-w-0 !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[640px]">
      <div class="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <div class="border-b border-slate-200 px-6 py-4">
          <UiDialogTitle class="truncate text-base font-semibold text-slate-950">Debit {{ account?.name }}</UiDialogTitle>
          <UiDialogDescription class="mt-0.5 text-xs text-slate-500">Record money paid or withdrawn from this account.</UiDialogDescription>
        </div>
        <div class="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5"><div class="space-y-5"><div class="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-end"><div class="space-y-1.5"><UiLabel for="money-out-source" class="text-xs font-medium text-slate-600">Debit reason</UiLabel><UiSelect v-model="moneyOutForm.source"><UiSelectTrigger id="money-out-source" class="h-10 rounded-lg border-slate-200 bg-white text-sm focus:ring-slate-950"><UiSelectValue /></UiSelectTrigger><UiSelectContent><UiSelectItem v-for="option in moneyOutSourceOptions" :key="option.value" :value="option.value">{{ option.label }}</UiSelectItem></UiSelectContent></UiSelect></div><p class="text-sm leading-5 text-slate-600">{{ selectedMoneyOutSource.descriptionPlaceholder }}</p></div><div v-if="isSupplierPayment" class="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><div class="space-y-1.5"><UiLabel for="supplier-payable" class="text-xs font-medium text-slate-600">Synced payable</UiLabel><UiSelect v-model="selectedPayableId"><UiSelectTrigger id="supplier-payable" class="h-10 rounded-lg border-slate-200 bg-white text-sm focus:ring-slate-950"><UiSelectValue placeholder="Select an outstanding supplier invoice" /></UiSelectTrigger><UiSelectContent><UiSelectItem v-for="payable in payables" :key="payable.id" :value="payable.id">{{ payable.supplierName || 'Supplier' }} · {{ payable.supplierInvoiceNo || payable.invoiceId }} · {{ formatPayableAmount(payable.balancePesewas) }}</UiSelectItem></UiSelectContent></UiSelect><p v-if="payablesError" class="text-xs text-rose-600">{{ payablesError }}</p><p v-else-if="!payables.length" class="text-xs text-slate-500">No current outstanding payables have been synced yet.</p><p v-else-if="selectedPayable" class="text-xs text-slate-600">{{ selectedPayable.source === 'warehouse' ? 'Warehouse' : 'Store' }} invoice · {{ formatPayableAmount(selectedPayable.balancePesewas) }} remaining</p><p v-if="isMoneyOutFieldInvalid('payable')" class="text-xs text-rose-600">{{ moneyOutErrors.payable }}</p></div></div><div class="grid gap-4 sm:grid-cols-2"><div class="space-y-1.5"><UiLabel for="money-out-amount" class="text-xs font-medium text-slate-600">Amount</UiLabel><UiInput id="money-out-amount" v-model="moneyOutForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" :aria-invalid="isMoneyOutFieldInvalid('amount')" class="h-10 rounded-lg border-slate-200 text-sm font-semibold tabular-nums focus-visible:ring-slate-950" @blur="touchMoneyOutField('amount')" /><p v-if="isMoneyOutFieldInvalid('amount')" class="text-xs text-rose-600">{{ moneyOutErrors.amount }}</p><p v-if="isMoneyOutFieldInvalid('balance')" class="text-xs text-rose-600">{{ moneyOutErrors.balance }}</p><p v-if="isMoneyOutFieldInvalid('payableBalance')" class="text-xs text-rose-600">{{ moneyOutErrors.payableBalance }}</p></div><div class="space-y-1.5"><UiLabel for="money-out-reference" class="text-xs font-medium text-slate-600">{{ selectedMoneyOutSource.referenceLabel }} <span class="font-normal text-slate-400">(optional)</span></UiLabel><UiInput id="money-out-reference" v-model="moneyOutForm.reference" :placeholder="selectedMoneyOutSource.referencePlaceholder" class="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div><div class="space-y-1.5 sm:col-span-2"><UiLabel for="money-out-note" class="text-xs font-medium text-slate-600">{{ selectedMoneyOutSource.descriptionLabel }}</UiLabel><UiInput id="money-out-note" v-model="moneyOutForm.description" :placeholder="selectedMoneyOutSource.descriptionPlaceholder" :aria-invalid="isMoneyOutFieldInvalid('description')" class="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchMoneyOutField('description')" /><p v-if="isMoneyOutFieldInvalid('description')" class="text-xs text-rose-600">{{ moneyOutErrors.description }}</p></div><div class="space-y-1.5 sm:col-span-2"><UiLabel for="money-out-context" class="text-xs font-medium text-slate-600">{{ selectedMoneyOutSource.contextLabel }} <span class="font-normal text-slate-400">(optional)</span></UiLabel><UiInput id="money-out-context" v-model="moneyOutForm.context" :placeholder="selectedMoneyOutSource.contextPlaceholder" class="h-10 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div></div><div class="flex items-baseline justify-between gap-6 border-t border-slate-100 pt-3 text-sm"><span class="text-slate-500">This will reduce the balance to</span><span class="font-semibold tabular-nums text-slate-950">{{ formatMoney(Number(account?.currentBalance || 0) - Number(moneyOutForm.amount || 0)) }}</span></div></div></div>
        <div v-if="moneyOutError" class="shrink-0 border-t border-rose-200 bg-rose-50 px-6 py-2.5 text-xs text-rose-700">{{ moneyOutError }}</div>
        <div class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5"><button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="closeMoneyOutModal">Cancel</button><button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!canSubmitMoneyOut || isSaving" @click="submitMoneyOut">{{ isSaving ? 'Recording...' : 'Post debit' }}</button></div>
      </div>
    </UiDialogContent>
  </UiDialog>

  <UiDialog v-model:open="loanModalOpen" data-print-hide>
    <UiDialogContent class="!flex !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] h-[min(600px,calc(100vh-2rem))] min-h-0 min-w-0 !gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 box-border sm:!max-w-[560px]">
      <template v-if="account">
        <div class="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <div class="border-b border-slate-200 px-6 py-4"><UiDialogTitle class="truncate text-base font-semibold text-slate-950">{{ loanDirection === 'received' ? 'Receive loan' : 'Make repayment' }}</UiDialogTitle><UiDialogDescription class="mt-0.5 text-xs text-slate-500">{{ loanDirection === 'received' ? 'Record money borrowed from this lender.' : 'Record money paid back to this lender.' }}</UiDialogDescription></div>
          <div class="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5"><div class="space-y-5"><p class="text-sm leading-6 text-slate-500">Records only on <span class="font-medium text-slate-900">{{ account.name }}</span>'s loan ledger — no other account balance changes.</p><div class="grid gap-4 sm:grid-cols-2"><div class="space-y-1.5"><UiLabel for="loan-amount" class="text-xs font-medium text-slate-600">Amount</UiLabel><UiInput id="loan-amount" v-model="loanForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00" class="h-10 border-slate-200 text-sm font-semibold tabular-nums focus-visible:ring-slate-950" /><p v-if="loanFieldError()" class="text-xs text-rose-600">{{ loanFieldError() }}</p></div><div class="space-y-1.5"><UiLabel for="loan-reference" class="text-xs font-medium text-slate-600">Reference <span class="font-normal text-slate-400">(optional)</span></UiLabel><UiInput id="loan-reference" v-model="loanForm.reference" placeholder="Agreement or receipt number" class="h-10 border-slate-200 text-sm focus-visible:ring-slate-950" /></div></div><div class="space-y-1.5"><UiLabel for="loan-description" class="text-xs font-medium text-slate-600">Recipient <span class="font-normal text-slate-400">(optional)</span></UiLabel><UiInput id="loan-description" v-model="loanForm.description" :placeholder="loanDirection === 'received' ? 'Lender or person providing the loan' : 'Lender or person receiving repayment'" class="h-10 border-slate-200 text-sm focus-visible:ring-slate-950" /></div><div v-if="loanError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{{ loanError }}</div></div></div>
          <div class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5"><button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950" @click="loanModalOpen = false">Cancel</button><button type="button" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isSaving" @click="submitLoanMovement">{{ isSaving ? 'Recording...' : (loanDirection === 'received' ? 'Record loan received' : 'Record repayment') }}</button></div>
        </div>
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
  CheckCircleIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  QuestionMarkCircleIcon,
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
const togglePaymentMethod = (methodId: string, event: Event) => {
  const checked = (event.target as HTMLInputElement | null)?.checked === true
  paymentAllocationSelected.value = { ...paymentAllocationSelected.value, [methodId]: checked }
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

const accountIcon = (type: AccountType) => ({ cash: BanknotesIcon, bank: BuildingLibraryIcon, mobile_money: DevicePhoneMobileIcon, pos: CreditCardIcon, petty_cash: WalletIcon, loan: BanknotesIcon }[type])
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
const statusBadgeClass = (status: string) => {
  if (status === 'pending') return 'border border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'reversed') return 'border border-rose-200 bg-rose-50 text-rose-700'
  return 'border border-slate-200 bg-slate-100 text-slate-700'
}
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
      })
    : (supportsSyncedCredits.value && selectedCreditCandidate.value?.metadata
      ? buildMovementMetadata(moneyInForm.value.context, moneyInForm.value.source, 'in', selectedCreditCandidate.value.metadata)
      : buildMovementMetadata(moneyInForm.value.context, moneyInForm.value.source, 'in'))
  const postingKey = selectedCreditCandidate.value
    ? `accounts-${accountId.value}-${selectedCreditCandidate.value.id}-${movementAmount.toFixed(2)}`
    : `accounts-${accountId.value}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  try {
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
    message: `Will be added to ${accountName}${allocationSummary ? ` via ${allocationSummary}` : ''}.`,
    confirmLabel: 'Post credit',
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
