<template>
  <NuxtPage v-if="route.params.id || route.path.endsWith('/accounts/payables')" />

  <div v-else class="min-h-full bg-transparent">
    <div class="mx-auto max-w-[1180px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <header class="mb-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-slate-950">Accounts</h1>
            <p class="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-sm text-slate-500">
              <span class="text-base font-semibold tabular-nums text-slate-950">{{ formatMoney(totalBalance) }}</span>
              <span>across {{ accounts.length }} {{ accounts.length === 1 ? 'account' : 'accounts' }}</span>
              <span v-if="pendingReview > 0" class="font-medium text-amber-700">· {{ pendingReview }} pending review</span>
            </p>
            <p v-if="refreshError" role="status" class="mt-2 text-xs font-medium text-rose-700">
              {{ refreshError }}
              <button type="button" class="ml-1 underline underline-offset-2" @click="refreshAccounts">Try again</button>
            </p>
          </div>
          <div class="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              :disabled="isRefreshing"
              :aria-busy="isRefreshing"
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              @click="refreshAccounts"
            >
              <ArrowPathIcon class="h-4 w-4" :class="isRefreshing ? 'animate-spin' : ''" aria-hidden="true" />
              {{ isRefreshing ? 'Refreshing' : 'Refresh' }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              @click="openCreateModal"
            >
              <PlusIcon class="h-4 w-4" aria-hidden="true" />
              New account
            </button>
          </div>
        </div>
        <nav class="-mb-px mt-6 flex gap-1 border-b border-slate-200/80" aria-label="Accounts workspace">
          <button type="button" aria-current="page" class="group relative inline-flex min-h-10 items-center px-1 text-sm font-medium text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
            Accounts
            <span class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-slate-950" aria-hidden="true" />
          </button>
          <button type="button" class="relative inline-flex min-h-10 items-center px-1 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" @click="switchWorkspace(payablesPath)">
            Payables
          </button>
        </nav>
      </header>

      <div class="mb-3 flex justify-end">
        <div class="relative w-full sm:w-64">
          <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <UiInput
            v-model="searchQuery"
            aria-label="Search accounts"
            placeholder="Search accounts"
            class="h-10 rounded-lg border-slate-200 bg-white pl-9 text-sm focus-visible:ring-slate-950"
          />
        </div>
      </div>

      <div v-if="isLoading" class="space-y-3" aria-label="Loading accounts">
        <div v-for="item in 4" :key="item" class="h-20 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>

      <section v-else-if="sessionExpired" class="rounded-xl border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-slate-950">Your session has expired</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Sign in again to continue working with your accounts.</p>
        <button
          type="button"
          class="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          @click="goToLogin"
        >
          Sign in again
        </button>
      </section>

      <section v-else-if="error" class="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ExclamationTriangleIcon class="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-slate-950">We could not load your accounts</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{{ error }}</p>
        <button
          type="button"
          class="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          @click="loadAccounts"
        >
          Try again
        </button>
      </section>

      <template v-else>
        <section v-if="accounts.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm sm:px-12">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <WalletIcon class="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 class="mt-5 text-base font-semibold text-slate-950">No accounts yet</h2>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Create your first account to start recording cash, bank, mobile money, POS, or loan movements.
          </p>
          <button
            type="button"
            class="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            @click="openCreateModal"
          >
            <PlusIcon class="h-4 w-4" aria-hidden="true" />
            Create account
          </button>
        </section>

        <section v-else-if="filteredAccounts.length === 0" class="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <MagnifyingGlassIcon class="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 class="mt-4 text-base font-semibold text-slate-950">No matching accounts</h2>
          <p class="mt-2 text-sm text-slate-600">Try a different account name, type, or bank.</p>
          <button type="button" class="mt-4 text-sm font-semibold text-slate-950 underline underline-offset-4" @click="searchQuery = ''">
            Clear search
          </button>
        </section>

        <section v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="hidden overflow-x-auto sm:block">
            <table class="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Account</th>
                  <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Type</th>
                  <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Balance</th>
                  <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Money in</th>
                  <th scope="col" class="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Money out</th>
                  <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Last activity</th>
                  <th scope="col" class="w-12 px-5 py-2.5"><span class="sr-only">Open account</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="account in filteredAccounts" :key="account.id" role="link" tabindex="0" :aria-label="`Open ${account.name}`" class="group cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950" @mouseenter="prefetchAccountDetails(account.id)" @focus="prefetchAccountDetails(account.id)" @click="openAccountDetails(account.id)" @keydown.enter="openAccountDetails(account.id)" @keydown.space.prevent="openAccountDetails(account.id)">
                  <td class="px-5 py-3.5">
                    <div class="flex min-w-[230px] items-center gap-3">
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
                        <component :is="accountIcon(account.type)" class="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-medium text-slate-950">{{ account.name }}</span>
                        <span class="mt-0.5 block truncate text-xs text-slate-400">{{ accountSubtitle(account) }}</span>
                      </span>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-500">{{ accountTypeLabels[account.type] }}</td>
                  <td class="whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(account.currentBalance) }}</td>
                  <td class="whitespace-nowrap px-5 py-3.5 text-right text-sm tabular-nums text-slate-500">{{ formatMoney(account.moneyIn) }}</td>
                  <td class="whitespace-nowrap px-5 py-3.5 text-right text-sm tabular-nums text-slate-500">{{ formatMoney(account.moneyOut) }}</td>
                  <td class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-400">{{ formatDate(account.lastMovementAt) }}</td>
                  <td class="px-5 py-4 text-right">
                    <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-950" aria-hidden="true">
                      <ChevronRightIcon class="h-4 w-4" aria-hidden="true" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="divide-y divide-slate-100 sm:hidden">
            <NuxtLink
              v-for="account in filteredAccounts"
              :key="account.id"
              :to="accountPath(account.id)"
              class="flex min-h-[92px] items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
                <component :is="accountIcon(account.type)" class="h-4 w-4" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center justify-between gap-3">
                  <span class="truncate text-sm font-medium text-slate-950">{{ account.name }}</span>
                  <span class="shrink-0 text-sm font-semibold tabular-nums text-slate-950">{{ formatMoney(account.currentBalance) }}</span>
                </span>
                <span class="mt-1 block truncate text-xs text-slate-500">{{ accountTypeLabels[account.type] }} / {{ accountSubtitle(account) }}</span>
                <span class="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>In {{ formatMoney(account.moneyIn) }} / Out {{ formatMoney(account.moneyOut) }}</span>
                  <span>{{ formatDate(account.lastMovementAt) }}</span>
                </span>
              </span>
              <ChevronRightIcon class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </NuxtLink>
          </div>
        </section>
      </template>
    </div>

    <UiDialog v-model:open="createModalOpen">
      <UiDialogContent class="!flex !h-[min(600px,calc(100vh-2rem))] !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] !flex-col !gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:!max-w-[900px]">
        <div class="shrink-0 border-b border-slate-200 px-5 py-4 sm:px-6">
          <UiDialogTitle class="text-base font-semibold text-slate-950">Create account</UiDialogTitle>
          <UiDialogDescription class="mt-1 text-sm leading-5 text-slate-600">
            Add the account details your team needs to identify and reconcile it.
          </UiDialogDescription>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div class="space-y-5">
            <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
              <div class="space-y-1.5">
                <UiLabel for="account-name" class="text-sm font-medium text-slate-800">Account name</UiLabel>
                <UiInput id="account-name" v-model="createForm.name" placeholder="e.g. Main Cash Till" :aria-invalid="isCreateFieldInvalid('name')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('name')" />
                <p v-if="isCreateFieldInvalid('name')" class="text-xs text-rose-600">{{ formErrors.name }}</p>
              </div>
              <div class="space-y-1.5">
                <UiLabel for="account-type" class="text-sm font-medium text-slate-800">Account type</UiLabel>
                <UiSelect v-model="createForm.type">
                  <UiSelectTrigger id="account-type" class="h-11 rounded-lg border-slate-200 text-sm focus:ring-slate-950">
                    <UiSelectValue placeholder="Choose type" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem v-for="typeOption in typeOptions" :key="typeOption.value" :value="typeOption.value">{{ typeOption.label }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
            </div>

            <div v-if="createForm.type !== 'loan'" class="space-y-1.5">
              <UiLabel for="opening-balance" class="text-sm font-medium text-slate-800">Opening balance <span class="font-normal text-slate-500">(optional)</span></UiLabel>
              <UiInput id="opening-balance" v-model="createForm.openingBalance" type="number" min="0" step="0.01" placeholder="0.00" :aria-invalid="isCreateFieldInvalid('openingBalance')" class="h-11 rounded-lg border-slate-200 text-sm tabular-nums focus-visible:ring-slate-950" @blur="touchCreateField('openingBalance')" />
              <p v-if="isCreateFieldInvalid('openingBalance')" class="text-xs text-rose-600">{{ formErrors.openingBalance }}</p>
            </div>

            <div class="border-t border-slate-200 pt-5">
              <div class="mb-4">
                <h2 class="text-sm font-semibold text-slate-950">Account details</h2>
                <p class="mt-1 text-xs leading-5 text-slate-500">These fields change based on the account type.</p>
              </div>

              <div v-if="createForm.type === 'loan'" class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5 sm:col-span-2"><UiLabel for="loan-lender" class="text-sm font-medium text-slate-800">Lender</UiLabel><UiInput id="loan-lender" v-model="createForm.lenderName" placeholder="Person or organisation that provided the loan" :aria-invalid="isCreateFieldInvalid('lenderName')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('lenderName')" /><p v-if="isCreateFieldInvalid('lenderName')" class="text-xs text-rose-600">{{ formErrors.lenderName }}</p></div>
                <div class="space-y-1.5"><UiLabel for="loan-reference" class="text-sm font-medium text-slate-800">Loan reference <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="loan-reference" v-model="createForm.loanReference" placeholder="Agreement or facility number" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
                <div class="space-y-1.5"><UiLabel for="loan-due-date" class="text-sm font-medium text-slate-800">Repayment due date <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="loan-due-date" v-model="createForm.dueDate" type="date" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
                <div class="space-y-1.5 sm:col-span-2"><UiLabel for="loan-purpose" class="text-sm font-medium text-slate-800">Purpose <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="loan-purpose" v-model="createForm.purpose" placeholder="What this loan is for" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /><p class="mt-1 text-xs text-slate-500">Start with a zero balance. Record the amount when the money is received.</p></div>
              </div>
              <div v-else-if="createForm.type === 'bank'" class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5"><UiLabel for="account-number" class="text-sm font-medium text-slate-800">Account number</UiLabel><UiInput id="account-number" v-model="createForm.accountNumber" placeholder="e.g. 0123456789" :aria-invalid="isCreateFieldInvalid('accountNumber')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('accountNumber')" /><p v-if="isCreateFieldInvalid('accountNumber')" class="text-xs text-rose-600">{{ formErrors.accountNumber }}</p></div>
                <div class="space-y-1.5"><UiLabel for="bank-name" class="text-sm font-medium text-slate-800">Name of bank</UiLabel><UiInput id="bank-name" v-model="createForm.bankName" placeholder="e.g. Ecobank" :aria-invalid="isCreateFieldInvalid('bankName')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('bankName')" /><p v-if="isCreateFieldInvalid('bankName')" class="text-xs text-rose-600">{{ formErrors.bankName }}</p></div>
                <div class="space-y-1.5"><UiLabel for="relationship-manager" class="text-sm font-medium text-slate-800">Relationship manager <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="relationship-manager" v-model="createForm.relationshipManager" placeholder="e.g. Akosua Mensah" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
                <div class="space-y-1.5"><UiLabel for="account-contact" class="text-sm font-medium text-slate-800">Account contact</UiLabel><UiInput id="account-contact" v-model="createForm.accountContact" placeholder="e.g. 024 123 4567" :aria-invalid="isCreateFieldInvalid('accountContact')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('accountContact')" /><p v-if="isCreateFieldInvalid('accountContact')" class="text-xs text-rose-600">{{ formErrors.accountContact }}</p></div>
              </div>

              <div v-else-if="createForm.type === 'mobile_money'" class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5"><UiLabel for="wallet-number" class="text-sm font-medium text-slate-800">Wallet number</UiLabel><UiInput id="wallet-number" v-model="createForm.accountNumber" placeholder="e.g. 024 123 4567" :aria-invalid="isCreateFieldInvalid('accountNumber')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('accountNumber')" /><p v-if="isCreateFieldInvalid('accountNumber')" class="text-xs text-rose-600">{{ formErrors.accountNumber }}</p></div>
                <div class="space-y-1.5"><UiLabel for="mobile-provider" class="text-sm font-medium text-slate-800">Provider</UiLabel><UiInput id="mobile-provider" v-model="createForm.provider" placeholder="e.g. MTN Mobile Money" :aria-invalid="isCreateFieldInvalid('provider')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('provider')" /><p v-if="isCreateFieldInvalid('provider')" class="text-xs text-rose-600">{{ formErrors.provider }}</p></div>
                <div class="space-y-1.5"><UiLabel for="account-holder" class="text-sm font-medium text-slate-800">Account holder name <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="account-holder" v-model="createForm.accountHolderName" placeholder="e.g. Fiina Pharmacy" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
                <div class="space-y-1.5"><UiLabel for="mobile-contact" class="text-sm font-medium text-slate-800">Account contact <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="mobile-contact" v-model="createForm.accountContact" placeholder="e.g. 024 123 4567" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
              </div>

              <div v-else-if="createForm.type === 'pos'" class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5"><UiLabel for="terminal-id" class="text-sm font-medium text-slate-800">Terminal ID</UiLabel><UiInput id="terminal-id" v-model="createForm.terminalId" placeholder="e.g. POS-001" :aria-invalid="isCreateFieldInvalid('terminalId')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('terminalId')" /><p v-if="isCreateFieldInvalid('terminalId')" class="text-xs text-rose-600">{{ formErrors.terminalId }}</p></div>
                <div class="space-y-1.5"><UiLabel for="pos-provider" class="text-sm font-medium text-slate-800">Provider or bank</UiLabel><UiInput id="pos-provider" v-model="createForm.provider" placeholder="e.g. CalBank POS" :aria-invalid="isCreateFieldInvalid('provider')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('provider')" /><p v-if="isCreateFieldInvalid('provider')" class="text-xs text-rose-600">{{ formErrors.provider }}</p></div>
                <div class="space-y-1.5 sm:col-span-2"><UiLabel for="pos-contact" class="text-sm font-medium text-slate-800">Account contact <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="pos-contact" v-model="createForm.accountContact" placeholder="e.g. 024 123 4567" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
              </div>

              <div v-else class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5"><UiLabel for="cash-location" class="text-sm font-medium text-slate-800">Location</UiLabel><UiInput id="cash-location" v-model="createForm.location" placeholder="e.g. Main branch till" :aria-invalid="isCreateFieldInvalid('location')" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" @blur="touchCreateField('location')" /><p v-if="isCreateFieldInvalid('location')" class="text-xs text-rose-600">{{ formErrors.location }}</p></div>
                <div class="space-y-1.5"><UiLabel for="cash-custodian" class="text-sm font-medium text-slate-800">Custodian <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="cash-custodian" v-model="createForm.custodian" placeholder="e.g. Store manager" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
                <div class="space-y-1.5 sm:col-span-2"><UiLabel for="cash-contact" class="text-sm font-medium text-slate-800">Account contact <span class="font-normal text-slate-500">(optional)</span></UiLabel><UiInput id="cash-contact" v-model="createForm.accountContact" placeholder="e.g. 024 123 4567" class="h-11 rounded-lg border-slate-200 text-sm focus-visible:ring-slate-950" /></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="formError" class="mx-5 mb-3 shrink-0 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-6">
          <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{{ formError }}</p>
        </div>

        <div class="shrink-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" class="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" @click="closeCreateModal">Cancel</button>
          <button type="button" class="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="isSaving" @click="submitAccount">
            {{ isSaving ? 'Creating...' : 'Create account' }}
          </button>
        </div>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WalletIcon,
} from '@heroicons/vue/24/outline'
import type { AccountSummary, AccountType } from '~/services/types'
import { ApiError } from '~/composables/useApi'
import { useAccountsWorkbench } from '~/composables/useAccountsWorkbench'
import { isSessionError, sessionExpiredMessage } from '~/utils/accountsSession'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
  pageTransition: false,
  scrollToTop: false,
})

const route = useRoute()
const router = useRouter()
const pharmacy = computed(() => String(route.params.pharmacy || 'company'))

const {
  accountTypeLabels,
  accounts,
  createAccount,
  error,
  formatDate,
  formatMoney,
  isLoading,
  isRefreshing,
  isSaving,
  loadAccounts,
  pendingReview,
  sessionExpired,
} = useAccountsWorkbench()

const createModalOpen = ref(false)
const formError = ref('')
const searchQuery = ref('')
const refreshError = ref('')
const createFormTouched = ref<Record<string, boolean>>({})
const defaultCreateForm = () => ({
  name: '',
  type: 'cash' as AccountType,
  openingBalance: '',
  accountNumber: '',
  bankName: '',
  relationshipManager: '',
  accountContact: '',
  provider: '',
  accountHolderName: '',
  terminalId: '',
  location: '',
  custodian: '',
  lenderName: '',
  loanReference: '',
  dueDate: '',
  purpose: '',
})

const createForm = ref(defaultCreateForm())

const typeOptions = [
  { value: 'cash' as AccountType, label: 'Cash' },
  { value: 'bank' as AccountType, label: 'Bank' },
  { value: 'mobile_money' as AccountType, label: 'Mobile money' },
  { value: 'pos' as AccountType, label: 'POS' },
  { value: 'petty_cash' as AccountType, label: 'Petty cash' },
  { value: 'loan' as AccountType, label: 'Loan account' },
]

const filteredAccounts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return accounts.value

  return accounts.value.filter((account) => {
    const haystack = [
      account.name,
      account.type,
      accountTypeLabels[account.type],
      account.branch,
      accountSubtitle(account),
    ].join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

const totalBalance = computed(() => accounts.value.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0))

const formErrors = computed(() => {
  const amount = Number(createForm.value.openingBalance || 0)
  const errors: Record<string, string> = {
    name: createForm.value.name.trim() ? '' : 'Account name is required.',
    openingBalance: Number.isFinite(amount) && amount >= 0 ? '' : 'Must be 0 or more.',
  }

  if (createForm.value.type === 'bank') {
    errors.accountNumber = createForm.value.accountNumber.trim() ? '' : 'Account number is required.'
    errors.bankName = createForm.value.bankName.trim() ? '' : 'Bank name is required.'
    errors.accountContact = createForm.value.accountContact.trim() ? '' : 'Account contact is required.'
  } else if (createForm.value.type === 'mobile_money') {
    errors.accountNumber = createForm.value.accountNumber.trim() ? '' : 'Wallet number is required.'
    errors.provider = createForm.value.provider.trim() ? '' : 'Provider is required.'
  } else if (createForm.value.type === 'pos') {
    errors.terminalId = createForm.value.terminalId.trim() ? '' : 'Terminal ID is required.'
    errors.provider = createForm.value.provider.trim() ? '' : 'Provider or bank is required.'
  } else if (createForm.value.type === 'loan') {
    errors.lenderName = createForm.value.lenderName.trim() ? '' : 'Lender name is required.'
  } else {
    errors.location = createForm.value.location.trim() ? '' : 'Location is required.'
  }

  return errors
})

const canSubmitAccount = computed(() => Object.values(formErrors.value).every((message) => !message))
const isCreateFieldInvalid = (field: string): boolean => Boolean(createFormTouched.value[field] && formErrors.value[field])
const touchCreateField = (field: string): void => {
  createFormTouched.value[field] = true
}

const accountPath = (id: string): string => `/${pharmacy.value}/services/accounts/${id}`
const payablesPath = computed(() => `/${pharmacy.value}/services/accounts/payables`)

const refreshAccounts = async () => {
  refreshError.value = ''
  try {
    await loadAccounts({ background: true })
  } catch (err) {
    if (isSessionError(err)) {
      await loadAccounts()
      return
    }
    refreshError.value = err instanceof Error ? err.message : 'Could not refresh accounts.'
  }
}

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

const goToLogin = () => {
  void router.push({
    path: `/${pharmacy.value}/services/login`,
    query: { redirect: route.fullPath },
  })
}

const openAccountDetails = (id: string) => {
  void router.push(accountPath(id))
}

const prefetchedAccountPaths = new Set<string>()
const prefetchAccountDetails = (id: string) => {
  const path = accountPath(id)
  if (prefetchedAccountPaths.has(path)) return
  prefetchedAccountPaths.add(path)
  void prefetchComponents(path)
}

const accountIcon = (type: AccountType) => {
  const map = {
    cash: BanknotesIcon,
    bank: BuildingLibraryIcon,
    mobile_money: DevicePhoneMobileIcon,
    pos: CreditCardIcon,
    petty_cash: WalletIcon,
    loan: BanknotesIcon,
  }
  return map[type]
}

const accountSubtitle = (account: AccountSummary) => {
  const metadata = account.metadata || {}
  if (account.type === 'bank') return [metadata.bankName, metadata.accountNumber].filter(Boolean).join(' / ') || account.branch || 'Bank account'
  if (account.type === 'mobile_money') return [metadata.provider, metadata.accountNumber].filter(Boolean).join(' / ') || account.branch || 'Mobile money wallet'
  if (account.type === 'pos') return [metadata.provider, metadata.terminalId].filter(Boolean).join(' / ') || account.branch || 'POS settlement'
  if (account.type === 'loan') return metadata.lenderName || 'Loan account'
  return [metadata.location, metadata.custodian].filter(Boolean).join(' / ') || account.branch || accountTypeLabels[account.type]
}

const resetCreateForm = () => {
  formError.value = ''
  createFormTouched.value = {}
  createForm.value = defaultCreateForm()
}

const openCreateModal = () => {
  resetCreateForm()
  createModalOpen.value = true
}

const closeCreateModal = () => {
  createModalOpen.value = false
  resetCreateForm()
}

const buildAccountMetadata = () => {
  const metadata: Record<string, string> = { accountContact: createForm.value.accountContact.trim() }

  if (createForm.value.type === 'bank') {
    metadata.accountNumber = createForm.value.accountNumber.trim()
    metadata.bankName = createForm.value.bankName.trim()
    metadata.relationshipManager = createForm.value.relationshipManager.trim()
  } else if (createForm.value.type === 'mobile_money') {
    metadata.accountNumber = createForm.value.accountNumber.trim()
    metadata.provider = createForm.value.provider.trim()
    metadata.accountHolderName = createForm.value.accountHolderName.trim()
  } else if (createForm.value.type === 'pos') {
    metadata.terminalId = createForm.value.terminalId.trim()
    metadata.provider = createForm.value.provider.trim()
  } else if (createForm.value.type === 'loan') {
    metadata.lenderName = createForm.value.lenderName.trim()
    metadata.loanReference = createForm.value.loanReference.trim()
    metadata.dueDate = createForm.value.dueDate.trim()
    metadata.purpose = createForm.value.purpose.trim()
  } else {
    metadata.location = createForm.value.location.trim()
    metadata.custodian = createForm.value.custodian.trim()
  }

  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value))
}

const accountBranchFallback = () => {
  if (createForm.value.type === 'bank') return createForm.value.bankName.trim()
  if (createForm.value.type === 'mobile_money' || createForm.value.type === 'pos') return createForm.value.provider.trim()
  if (createForm.value.type === 'loan') return createForm.value.lenderName.trim()
  return createForm.value.location.trim()
}

const submitAccount = () => {
  if (!canSubmitAccount.value) {
    createFormTouched.value = Object.fromEntries(
      Object.keys(formErrors.value).filter((field) => formErrors.value[field]).map((field) => [field, true]),
    )
    return
  }

  formError.value = ''
  void createAccount({
    name: createForm.value.name.trim(),
    type: createForm.value.type,
    branch: accountBranchFallback(),
    openingBalance: Number(createForm.value.openingBalance || 0),
    metadata: buildAccountMetadata(),
  }).then(() => {
    closeCreateModal()
  }).catch((err) => {
    if (err instanceof ApiError && err.body && typeof err.body === 'object' && 'fields' in err.body) {
      const fields = (err.body as { fields?: Record<string, string> }).fields || {}
      createFormTouched.value = { ...createFormTouched.value, ...Object.fromEntries(Object.keys(fields).map((field) => [field, true])) }
    }
    formError.value = err instanceof Error ? err.message : 'Could not create account. Try again.'
  })
}

watch(createModalOpen, (isOpen) => {
  if (!isOpen) resetCreateForm()
})

// The accounts page owns the list while the detail view is rendered inside
// its NuxtPage slot. Refresh the list when a user returns from a detail route
// so a newly posted credit/debit is reflected immediately.
watch(() => route.params.id, (id, previousId) => {
  if (!id && previousId) void refreshAccounts()
})

onMounted(() => {
  void loadAccounts()
})
</script>
