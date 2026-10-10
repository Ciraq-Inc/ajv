<template>
  <NuxtPage v-if="isChildRoute" />

  <div v-else class="ab">
    <header class="ab-head">
      <h1>Accounts</h1>
      <div class="ab-actions">
        <p v-if="refreshError" role="status" class="ab-inline-error">
          {{ refreshError }}
          <button type="button" @click="refreshAccounts">Try again</button>
        </p>
        <button type="button" class="ab-btn ab-btn-quiet ab-btn-icon" :disabled="isRefreshing" :aria-busy="isRefreshing" aria-label="Refresh" title="Refresh" @click="refreshAccounts">
          <ArrowPathIcon class="ab-ico" :class="{ 'ab-spin': isRefreshing }" aria-hidden="true" />
        </button>
        <button type="button" class="ab-btn ab-btn-primary" @click="openCreateModal">
          <PlusIcon class="ab-ico" aria-hidden="true" />
          <span>New account</span>
        </button>
      </div>
    </header>

    <nav class="ab-tabs" aria-label="Accounts workspace">
      <NuxtLink :to="listPath" class="is-active" aria-current="page">Accounts</NuxtLink>
      <NuxtLink :to="payablesPath">Payables</NuxtLink>
    </nav>

    <!-- loading -->
    <div v-if="isLoading" class="ab-skel" aria-busy="true" aria-label="Loading accounts">
      <div class="ab-skel-strip" />
      <div class="ab-skel-list">
        <div v-for="n in 4" :key="n" class="ab-skel-row"><span /><span /><span /><span /></div>
      </div>
    </div>

    <!-- session -->
    <section v-else-if="sessionExpired" class="ab-panel">
      <ExclamationTriangleIcon class="ab-panel-ico" aria-hidden="true" />
      <h2>Session expired</h2>
      <p>Sign in again to continue.</p>
      <button type="button" class="ab-btn ab-btn-primary" @click="goToLogin">Sign in again</button>
    </section>

    <!-- load error -->
    <section v-else-if="error" class="ab-panel" role="alert">
      <ExclamationTriangleIcon class="ab-panel-ico is-err" aria-hidden="true" />
      <h2>Could not load accounts</h2>
      <p>{{ error }}</p>
      <button type="button" class="ab-btn ab-btn-primary" @click="loadAccounts()">Try again</button>
    </section>

    <template v-else>
      <!-- empty -->
      <section v-if="accounts.length === 0" class="ab-panel">
        <WalletIcon class="ab-panel-ico" aria-hidden="true" />
        <h2>No accounts yet</h2>
        <p>Add your first account.</p>
        <button type="button" class="ab-btn ab-btn-primary" @click="openCreateModal">
          <PlusIcon class="ab-ico" aria-hidden="true" />
          <span>Create account</span>
        </button>
      </section>

      <template v-else>
        <!-- summary -->
        <dl class="ab-summary" aria-label="Summary">
          <div class="is-lead">
            <dt>Available funds</dt>
            <dd class="ab-lead">
              <small>GH₵</small>{{ fundsParts.neg ? '−' : '' }}{{ fundsParts.int }}<span>{{ fundsParts.dec }}</span>
            </dd>
            <dd v-if="pendingReview > 0" class="ab-sub"><i aria-hidden="true" />{{ pendingReview }} to review</dd>
          </div>
          <div>
            <dt>Money in</dt>
            <dd class="ab-val">{{ formatMoney(totalIn) }}</dd>
          </div>
          <div>
            <dt>Money out</dt>
            <dd class="ab-val">{{ formatMoney(totalOut) }}</dd>
          </div>
          <div>
            <dt>Owed on loans</dt>
            <dd class="ab-val" :class="{ 'is-zero': owed === 0 }">{{ formatMoney(owed) }}</dd>
          </div>
        </dl>

        <!-- toolbar -->
        <div class="ab-tools">
          <div class="ab-filters" role="group" aria-label="Filter by account type">
            <button type="button" :class="{ 'is-on': typeFilter === 'all' }" :aria-pressed="typeFilter === 'all'" @click="typeFilter = 'all'">
              All <em>{{ accounts.length }}</em>
            </button>
            <button
              v-for="t in presentTypes"
              :key="t"
              type="button"
              :class="{ 'is-on': typeFilter === t }"
              :aria-pressed="typeFilter === t"
              @click="typeFilter = typeFilter === t ? 'all' : t"
            >
              {{ TYPE_META[t].label }} <em>{{ typeCounts[t] }}</em>
            </button>
          </div>
          <div class="ab-tools-right">
            <label class="ab-search">
              <MagnifyingGlassIcon class="ab-ico" aria-hidden="true" />
              <input ref="searchInput" v-model="searchQuery" type="search" placeholder="Search" aria-label="Search accounts" autocomplete="off" @keydown.esc="searchQuery = ''">
              <kbd v-if="!searchQuery" aria-hidden="true">/</kbd>
            </label>
            <label class="ab-sortsel">
              <span class="ab-sr">Sort by</span>
              <select v-model="sortBy" aria-label="Sort accounts">
                <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </label>
          </div>
        </div>

        <!-- no match -->
        <section v-if="!assets.length && !loans.length" class="ab-panel ab-panel-flat">
          <MagnifyingGlassIcon class="ab-panel-ico" aria-hidden="true" />
          <h2>No matches</h2>
          <button type="button" class="ab-link" @click="clearFilters">Clear filters</button>
        </section>

        <!-- list -->
        <div v-else class="ab-list">
          <div class="ab-colhead" aria-hidden="true">
            <span>Account</span><span>Type</span><span class="r">Balance</span><span class="r">Money in</span><span class="r">Money out</span><span>Last activity</span><span />
          </div>

          <NuxtLink
            v-for="account in assets"
            :key="account.id"
            :to="accountPath(account.id)"
            class="ab-row"
            :aria-label="`Open ${account.name}, balance ${formatMoney(account.currentBalance)}`"
          >
            <span class="ab-id">
              <span class="ab-glyph"><component :is="TYPE_META[account.type].icon" aria-hidden="true" /></span>
              <span class="ab-name"><b>{{ account.name }}</b><i>{{ accountSubtitle(account) }}</i></span>
            </span>
            <span class="ab-type">{{ TYPE_META[account.type].label }}</span>
            <span class="ab-bal">
              <b><small>GH₵</small>{{ parts(account.currentBalance).neg ? '−' : '' }}{{ parts(account.currentBalance).int }}<span>{{ parts(account.currentBalance).dec }}</span></b>
            </span>
            <span class="ab-num" :class="{ 'is-zero': !account.moneyIn }">{{ formatMoney(account.moneyIn) }}</span>
            <span class="ab-num" :class="{ 'is-zero': !account.moneyOut }">{{ formatMoney(account.moneyOut) }}</span>
            <span class="ab-when" :title="account.lastMovementAt ? exactTime(account.lastMovementAt) : undefined">
              <b :class="{ 'is-none': !account.lastMovementAt }">{{ relativeTime(account.lastMovementAt) }}</b>
            </span>
            <ChevronRightIcon class="ab-go" aria-hidden="true" />
            <span class="ab-mline">{{ TYPE_META[account.type].label }} · {{ relativeTime(account.lastMovementAt) }}</span>
          </NuxtLink>

          <template v-if="loans.length">
            <div v-if="assets.length" class="ab-sect">
              <span>Loans</span>
              <b>{{ formatMoney(loansTotal) }}</b>
            </div>
            <NuxtLink
              v-for="account in loans"
              :key="account.id"
              :to="accountPath(account.id)"
              class="ab-row"
              :aria-label="`Open ${account.name}, owed ${formatMoney(account.currentBalance)}`"
            >
              <span class="ab-id">
                <span class="ab-glyph"><component :is="TYPE_META[account.type].icon" aria-hidden="true" /></span>
                <span class="ab-name"><b>{{ account.name }}</b><i>{{ accountSubtitle(account) }}</i></span>
              </span>
              <span class="ab-type">{{ TYPE_META[account.type].label }}</span>
              <span class="ab-bal">
                <b><small>GH₵</small>{{ parts(account.currentBalance).neg ? '−' : '' }}{{ parts(account.currentBalance).int }}<span>{{ parts(account.currentBalance).dec }}</span></b>
              </span>
              <span class="ab-num" :class="{ 'is-zero': !account.moneyIn }">{{ formatMoney(account.moneyIn) }}</span>
              <span class="ab-num" :class="{ 'is-zero': !account.moneyOut }">{{ formatMoney(account.moneyOut) }}</span>
              <span class="ab-when" :title="account.lastMovementAt ? exactTime(account.lastMovementAt) : undefined">
                <b :class="{ 'is-none': !account.lastMovementAt }">{{ relativeTime(account.lastMovementAt) }}</b>
                </span>
              <ChevronRightIcon class="ab-go" aria-hidden="true" />
              <span class="ab-mline">{{ TYPE_META[account.type].label }} · {{ relativeTime(account.lastMovementAt) }}</span>
            </NuxtLink>
          </template>
        </div>
      </template>
    </template>

    <!-- create -->
    <UiDialog v-model:open="createModalOpen">
      <UiDialogContent class="!flex !h-[min(680px,calc(100vh-2rem))] !w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] !flex-col !gap-0 overflow-hidden rounded-2xl !border-0 !p-0 shadow-2xl sm:!max-w-[940px]">
        <div class="ab-dlg">
          <aside class="ab-types">
            <p class="ab-types-title">Account type</p>
            <div class="ab-types-list" role="radiogroup" aria-label="Account type">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                type="button"
                role="radio"
                class="ab-typeopt"
                :class="{ 'is-on': createForm.type === opt.value }"
                :aria-checked="createForm.type === opt.value"
                :tabindex="createForm.type === opt.value ? 0 : -1"
                @click="selectType(opt.value)"
                @keydown.down.prevent="stepType(1)"
                @keydown.right.prevent="stepType(1)"
                @keydown.up.prevent="stepType(-1)"
                @keydown.left.prevent="stepType(-1)"
              >
                <span class="ab-glyph"><component :is="TYPE_META[opt.value].icon" aria-hidden="true" /></span>
                <span class="ab-typeopt-text"><b>{{ opt.label }}</b></span>
              </button>
            </div>
          </aside>

          <section class="ab-form">
            <header class="ab-form-head">
              <UiDialogTitle class="ab-form-title">New {{ TYPE_META[createForm.type].label.toLowerCase() }} account</UiDialogTitle>
              <UiDialogDescription class="ab-sr">Enter the account details.</UiDialogDescription>
            </header>

            <div class="ab-form-body">
              <div class="ab-grid">
                <div class="ab-field ab-span-2">
                  <label for="account-name">Account name <i aria-hidden="true">*</i></label>
                  <input id="account-name" v-model="createForm.name" class="ab-input" :class="{ 'is-bad': isCreateFieldInvalid('name') }" :aria-invalid="isCreateFieldInvalid('name')" placeholder="e.g. Main Cash Till" autocomplete="off" @blur="touchCreateField('name')">
                  <p v-if="isCreateFieldInvalid('name')" class="ab-err">{{ formErrors.name }}</p>
                </div>

                <div v-if="createForm.type !== 'loan'" class="ab-field ab-span-2">
                  <label for="opening-balance">Opening balance</label>
                  <div class="ab-money" :class="{ 'is-bad': isCreateFieldInvalid('openingBalance') }">
                    <span>GH₵</span>
                    <input id="opening-balance" v-model="createForm.openingBalance" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" :aria-invalid="isCreateFieldInvalid('openingBalance')" @blur="touchCreateField('openingBalance')">
                  </div>
                  <p v-if="isCreateFieldInvalid('openingBalance')" class="ab-err">{{ formErrors.openingBalance }}</p>
                </div>
                <p v-else class="ab-note ab-span-2">Loan accounts start at zero.</p>
              </div>

              <div class="ab-rule" />

              <div class="ab-grid">
                <div v-for="field in activeFields" :key="field.key" class="ab-field" :class="{ 'ab-span-2': field.span === 2 }">
                  <label :for="`f-${field.key}`">{{ field.label }} <i v-if="field.required" aria-hidden="true">*</i></label>
                  <input
                    :id="`f-${field.key}`"
                    v-model="createForm[field.key]"
                    class="ab-input"
                    :class="{ 'is-bad': isCreateFieldInvalid(field.key), 'is-mono': field.mono }"
                    :type="field.type || 'text'"
                    :placeholder="field.placeholder"
                    :aria-invalid="isCreateFieldInvalid(field.key)"
                    autocomplete="off"
                    @blur="touchCreateField(field.key)"
                  >
                  <p v-if="isCreateFieldInvalid(field.key)" class="ab-err">{{ formErrors[field.key] }}</p>
                </div>
              </div>
            </div>

            <div v-if="formError" class="ab-form-error" role="alert">
              <ExclamationTriangleIcon aria-hidden="true" />
              <p>{{ formError }}</p>
            </div>

            <footer class="ab-form-foot">
              <button type="button" class="ab-btn ab-btn-quiet" @click="closeCreateModal">Cancel</button>
              <button type="button" class="ab-btn ab-btn-primary" :disabled="isSaving" @click="submitAccount">
                {{ isSaving ? 'Creating…' : 'Create account' }}
              </button>
            </footer>
          </section>
        </div>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import {
  ArrowPathIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ScaleIcon,
  WalletIcon,
} from '@heroicons/vue/24/outline'
import type { AccountSummary, AccountType } from '~/services/types'
import { ApiError } from '~/composables/useApi'
import { useAccountsWorkbench } from '~/composables/useAccountsWorkbench'
import { isSessionError } from '~/utils/accountsSession'

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
  pageTransition: false,
  scrollToTop: false,
})

const route = useRoute()
const router = useRouter()
const pharmacy = computed(() => String(route.params.pharmacy || 'company'))
const listPath = computed(() => `/${pharmacy.value}/services/accounts`)
const payablesPath = computed(() => `${listPath.value}/payables`)
const accountPath = (id: string): string => `${listPath.value}/${id}`
// This page owns the list and renders account detail / payables inside its slot.
const isChildRoute = computed(() => route.path.replace(/\/+$/, '') !== listPath.value)

const {
  accounts,
  createAccount,
  error,
  formatMoney,
  isLoading,
  isRefreshing,
  isSaving,
  loadAccounts,
  pendingReview,
  sessionExpired,
} = useAccountsWorkbench()

/* ───────────── account types ───────────── */
const TYPE_ORDER: AccountType[] = ['cash', 'bank', 'mobile_money', 'pos', 'petty_cash', 'loan']
const TYPE_META: Record<AccountType, { label: string; icon: Component }> = {
  cash: { label: 'Cash', icon: BanknotesIcon },
  bank: { label: 'Bank', icon: BuildingLibraryIcon },
  mobile_money: { label: 'Mobile money', icon: DevicePhoneMobileIcon },
  pos: { label: 'POS', icon: CreditCardIcon },
  petty_cash: { label: 'Petty cash', icon: WalletIcon },
  loan: { label: 'Loan', icon: ScaleIcon },
}
const typeOptions = TYPE_ORDER.map((value) => ({ value, label: TYPE_META[value].label }))

/* ───────────── formatting ───────────── */
const numberFormat = new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const parts = (value: number | null | undefined) => {
  const n = Number(value ?? 0)
  const text = numberFormat.format(Math.abs(n))
  const dot = text.lastIndexOf('.')
  return { neg: n < 0, int: text.slice(0, dot), dec: text.slice(dot) }
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31557600], ['month', 2629800], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
]
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const relativeTime = (iso: string | null | undefined): string => {
  if (!iso) return 'No activity yet'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diff = (t - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'Just now'
  const [unit, secs] = UNITS.find(([, s]) => abs >= s) ?? UNITS[UNITS.length - 1]!
  return relativeFormat.format(Math.round(diff / secs), unit)
}
const exactTime = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/* ───────────── summary ───────────── */
// Loans are money owed, so they are kept out of "available funds" and shown
// separately instead of being added to it.
const assetAccounts = computed(() => accounts.value.filter((a) => a.type !== 'loan'))
const loanAccounts = computed(() => accounts.value.filter((a) => a.type === 'loan'))
const sum = (list: AccountSummary[], pick: (a: AccountSummary) => number) => list.reduce((t, a) => t + Number(pick(a) || 0), 0)
const availableFunds = computed(() => sum(assetAccounts.value, (a) => a.currentBalance))
const owed = computed(() => sum(loanAccounts.value, (a) => a.currentBalance))
const totalIn = computed(() => sum(assetAccounts.value, (a) => a.moneyIn))
const totalOut = computed(() => sum(assetAccounts.value, (a) => a.moneyOut))
const fundsParts = computed(() => parts(availableFunds.value))

/* ───────────── filter, sort ───────────── */
const searchQuery = ref('')
const typeFilter = ref<'all' | AccountType>('all')
const sortBy = ref<'balance' | 'recent' | 'name'>('balance')
const sortOptions = [
  { value: 'balance' as const, label: 'Balance' },
  { value: 'recent' as const, label: 'Recent' },
  { value: 'name' as const, label: 'Name' },
]
const searchInput = ref<HTMLInputElement | null>(null)

const presentTypes = computed(() => TYPE_ORDER.filter((t) => accounts.value.some((a) => a.type === t)))
const typeCounts = computed(() => {
  const counts = {} as Record<AccountType, number>
  for (const t of TYPE_ORDER) counts[t] = accounts.value.filter((a) => a.type === t).length
  return counts
})

const accountSubtitle = (account: AccountSummary): string => {
  const m = account.metadata || {}
  if (account.type === 'bank') return [m.bankName, m.accountNumber].filter(Boolean).join(' · ') || account.branch || 'Bank account'
  if (account.type === 'mobile_money') return [m.provider, m.accountNumber].filter(Boolean).join(' · ') || account.branch || 'Mobile money wallet'
  if (account.type === 'pos') return [m.provider, m.terminalId].filter(Boolean).join(' · ') || account.branch || 'POS settlement'
  if (account.type === 'loan') return m.lenderName || 'Loan account'
  return [m.location, m.custodian].filter(Boolean).join(' · ') || account.branch || TYPE_META[account.type].label
}

const compare = (a: AccountSummary, b: AccountSummary): number => {
  if (sortBy.value === 'name') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  if (sortBy.value === 'recent') {
    const ta = a.lastMovementAt ? new Date(a.lastMovementAt).getTime() : 0
    const tb = b.lastMovementAt ? new Date(b.lastMovementAt).getTime() : 0
    return tb - ta
  }
  return Number(b.currentBalance) - Number(a.currentBalance)
}

const matching = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return accounts.value.filter((a) => {
    if (typeFilter.value !== 'all' && a.type !== typeFilter.value) return false
    if (!query) return true
    const hay = [a.name, a.type, TYPE_META[a.type].label, a.branch, accountSubtitle(a), ...Object.values(a.metadata || {})].join(' ').toLowerCase()
    return hay.includes(query)
  })
})
const assets = computed(() => matching.value.filter((a) => a.type !== 'loan').sort(compare))
const loans = computed(() => matching.value.filter((a) => a.type === 'loan').sort(compare))
const loansTotal = computed(() => sum(loans.value, (a) => a.currentBalance))
const clearFilters = () => { searchQuery.value = ''; typeFilter.value = 'all' }

/* ───────────── refresh + routing ───────────── */
const refreshError = ref('')
const hasLoaded = ref(false)

const loadInitial = async () => {
  await loadAccounts()
  hasLoaded.value = !error.value
}
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
const goToLogin = () => {
  void router.push({ path: `/${pharmacy.value}/services/login`, query: { redirect: route.fullPath } })
}

// Whenever the user lands back on the list from account detail OR payables,
// refresh it. Both can change balances (postings, supplier payments).
watch(() => route.path, (path, previous) => {
  if (!previous || isChildRoute.value) return
  if (previous.replace(/\/+$/, '') === listPath.value) return
  if (hasLoaded.value) void refreshAccounts()
  else void loadInitial()
})

/* ───────────── create account ───────────── */
type FormKey =
  | 'name' | 'openingBalance' | 'accountNumber' | 'bankName' | 'relationshipManager' | 'accountContact'
  | 'provider' | 'accountHolderName' | 'terminalId' | 'location' | 'custodian' | 'lenderName'
  | 'loanReference' | 'dueDate' | 'purpose'
type FieldDef = { key: FormKey; label: string; placeholder?: string; required?: boolean; span?: 2; type?: string; mono?: boolean }

const CASHLIKE: FieldDef[] = [
  { key: 'location', label: 'Location', placeholder: 'e.g. Main branch till', required: true },
  { key: 'custodian', label: 'Custodian', placeholder: 'e.g. Store manager' },
  { key: 'accountContact', label: 'Account contact', placeholder: 'e.g. 024 123 4567', span: 2 },
]
// One definition drives the fields, validation and payload for each account type.
const FIELDS: Record<AccountType, FieldDef[]> = {
  cash: CASHLIKE,
  petty_cash: CASHLIKE,
  bank: [
    { key: 'bankName', label: 'Name of bank', placeholder: 'e.g. Ecobank', required: true },
    { key: 'accountNumber', label: 'Account number', placeholder: 'e.g. 0123456789', required: true, mono: true },
    { key: 'relationshipManager', label: 'Relationship manager', placeholder: 'e.g. Akosua Mensah' },
    { key: 'accountContact', label: 'Account contact', placeholder: 'e.g. 024 123 4567', required: true },
  ],
  mobile_money: [
    { key: 'provider', label: 'Provider', placeholder: 'e.g. MTN Mobile Money', required: true },
    { key: 'accountNumber', label: 'Wallet number', placeholder: 'e.g. 024 123 4567', required: true, mono: true },
    { key: 'accountHolderName', label: 'Account holder name', placeholder: 'e.g. Fiina Pharmacy' },
    { key: 'accountContact', label: 'Account contact', placeholder: 'e.g. 024 123 4567' },
  ],
  pos: [
    { key: 'terminalId', label: 'Terminal ID', placeholder: 'e.g. POS-001', required: true, mono: true },
    { key: 'provider', label: 'Provider or bank', placeholder: 'e.g. CalBank POS', required: true },
    { key: 'accountContact', label: 'Account contact', placeholder: 'e.g. 024 123 4567', span: 2 },
  ],
  loan: [
    { key: 'lenderName', label: 'Lender', placeholder: 'Person or organisation that provided the loan', required: true, span: 2 },
    { key: 'loanReference', label: 'Loan reference', placeholder: 'Agreement or facility number' },
    { key: 'dueDate', label: 'Repayment due date', type: 'date' },
    { key: 'purpose', label: 'Purpose', placeholder: 'What this loan is for', span: 2 },
  ],
}

const defaultCreateForm = () => ({
  name: '', type: 'cash' as AccountType, openingBalance: '', accountNumber: '', bankName: '', relationshipManager: '',
  accountContact: '', provider: '', accountHolderName: '', terminalId: '', location: '', custodian: '',
  lenderName: '', loanReference: '', dueDate: '', purpose: '',
})
const createModalOpen = ref(false)
const formError = ref('')
const createFormTouched = ref<Record<string, boolean>>({})
const createForm = ref(defaultCreateForm())
const activeFields = computed(() => FIELDS[createForm.value.type])

const formErrors = computed(() => {
  const errors: Record<string, string> = {}
  errors.name = createForm.value.name.trim() ? '' : 'Required.'
  if (createForm.value.type !== 'loan') {
    const amount = Number(createForm.value.openingBalance || 0)
    errors.openingBalance = Number.isFinite(amount) && amount >= 0 ? '' : 'Must be 0 or more.'
  }
  for (const field of activeFields.value) {
    if (field.required) errors[field.key] = String(createForm.value[field.key] ?? '').trim() ? '' : 'Required.'
  }
  return errors
})
const canSubmitAccount = computed(() => Object.values(formErrors.value).every((m) => !m))
const isCreateFieldInvalid = (field: string): boolean => Boolean(createFormTouched.value[field] && formErrors.value[field])
const touchCreateField = (field: string): void => { createFormTouched.value[field] = true }

const selectType = (type: AccountType) => {
  if (createForm.value.type === type) return
  createForm.value.type = type
  createFormTouched.value = {}
  formError.value = ''
  if (type === 'loan') createForm.value.openingBalance = ''
}
const stepType = async (dir: 1 | -1) => {
  const i = TYPE_ORDER.indexOf(createForm.value.type)
  selectType(TYPE_ORDER[(i + dir + TYPE_ORDER.length) % TYPE_ORDER.length]!)
  await nextTick()
  document.querySelector<HTMLElement>('.ab-typeopt.is-on')?.focus()
}

const resetCreateForm = () => {
  formError.value = ''
  createFormTouched.value = {}
  createForm.value = defaultCreateForm()
}
const openCreateModal = () => { resetCreateForm(); createModalOpen.value = true }
const closeCreateModal = () => { createModalOpen.value = false }
watch(createModalOpen, (open) => { if (!open) resetCreateForm() })

// Only fields that belong to the selected type are sent, so values typed under a
// previously selected type can never leak into the payload.
const buildAccountMetadata = () => {
  const out: Record<string, string> = {}
  for (const field of activeFields.value) {
    const value = String(createForm.value[field.key] ?? '').trim()
    if (value) out[field.key] = value
  }
  return out
}
const accountBranchFallback = (): string => {
  const f = createForm.value
  if (f.type === 'bank') return f.bankName.trim()
  if (f.type === 'mobile_money' || f.type === 'pos') return f.provider.trim()
  if (f.type === 'loan') return f.lenderName.trim()
  return f.location.trim()
}

const submitAccount = async () => {
  if (isSaving.value) return
  if (!canSubmitAccount.value) {
    createFormTouched.value = Object.fromEntries(Object.keys(formErrors.value).filter((k) => formErrors.value[k]).map((k) => [k, true]))
    return
  }
  formError.value = ''
  try {
    await createAccount({
      name: createForm.value.name.trim(),
      type: createForm.value.type,
      branch: accountBranchFallback(),
      openingBalance: createForm.value.type === 'loan' ? 0 : Number(createForm.value.openingBalance || 0),
      metadata: buildAccountMetadata(),
    })
    closeCreateModal()
  } catch (err) {
    if (err instanceof ApiError && err.body && typeof err.body === 'object' && 'fields' in err.body) {
      const fields = (err.body as { fields?: Record<string, string> }).fields || {}
      createFormTouched.value = { ...createFormTouched.value, ...Object.fromEntries(Object.keys(fields).map((f) => [f, true])) }
    }
    formError.value = err instanceof Error ? err.message : 'Could not create account. Try again.'
  }
}

/* ───────────── "/" focuses search ───────────── */
const onKey = (event: KeyboardEvent) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || createModalOpen.value || isChildRoute.value) return
  const el = document.activeElement as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
  if (!searchInput.value) return
  event.preventDefault()
  searchInput.value.focus()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (!isChildRoute.value) void loadInitial()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.ab, .ab-dlg {
  --ink: #14161c;
  --ink-2: #3b3f4a;
  --mute: #6a6f7d;
  --faint: #9a9fac;
  --line: #e4e6eb;
  --line-2: #d3d6dd;
  --wash: #f6f7f9;
  --mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
.ab { max-width: 1180px; margin: 0 auto; }
.ab *, .ab-dlg * { box-sizing: border-box; }
.ab-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ab-ico { width: 16px; height: 16px; flex: none; }
.ab-spin { animation: ab-rot 0.9s linear infinite; }
@keyframes ab-rot { to { transform: rotate(360deg); } }
.ab-num, .ab-bal b, .ab-lead, .ab-val, .ab-sect b { font-variant-numeric: tabular-nums; }

/* ── header ── */
.ab-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.ab-head h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.ab-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ab-inline-error { margin: 0 6px 0 0; font-size: 12px; font-weight: 500; color: #b42318; }
.ab-inline-error button { margin-left: 6px; text-decoration: underline; text-underline-offset: 2px; }
.ab-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13.5px; font-weight: 500; line-height: 1; cursor: pointer; border: 1px solid transparent; transition: background 0.12s, border-color 0.12s; }
.ab-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.ab-btn:disabled { opacity: 0.6; cursor: wait; }
.ab-btn-icon { width: 36px; padding: 0; }
.ab-btn-quiet { background: #fff; color: var(--ink); border-color: var(--line-2); }
.ab-btn-quiet:hover:not(:disabled) { background: var(--wash); }
.ab-btn-primary { background: var(--ink); color: #fff; }
.ab-btn-primary:hover:not(:disabled) { background: #2a2d37; }
.ab-tabs { display: flex; gap: 22px; margin: 14px 0 20px; border-bottom: 1px solid var(--line); }
.ab-tabs a { position: relative; padding: 0 1px 11px; font-size: 14px; font-weight: 500; color: var(--mute); text-decoration: none; }
.ab-tabs a:hover { color: var(--ink); }
.ab-tabs a.is-active { color: var(--ink); }
.ab-tabs a.is-active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ink); }
.ab-tabs a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 4px; }

/* ── summary ── */
.ab-summary { margin: 0; display: grid; grid-template-columns: 1.35fr 1fr 1fr 1fr; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
.ab-summary > div { padding: 16px 22px 15px; border-left: 1px solid var(--line); min-width: 0; }
.ab-summary > div:first-child { border-left: 0; }
.ab-summary dt { font-size: 12.5px; color: var(--mute); }
.ab-summary dd { margin: 0; }
.ab-lead { margin-top: 6px !important; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.ab-lead small { font-size: 14px; font-weight: 500; color: var(--mute); margin-right: 4px; letter-spacing: 0; }
.ab-lead span { font-size: 18px; color: var(--faint); font-weight: 500; }
.ab-val { margin-top: 6px !important; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25; }
.ab-val.is-zero { color: var(--faint); }
.ab-sub { margin-top: 4px !important; font-size: 12px; color: var(--mute); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ab-sub b { font-weight: 400; color: var(--faint); }
.ab-sub i { width: 6px; height: 6px; border-radius: 50%; background: #d9922b; }

/* ── toolbar ── */
.ab-tools { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 18px 0 10px; flex-wrap: wrap; }
.ab-filters { display: flex; gap: 2px; flex-wrap: wrap; }
.ab-filters button { height: 30px; padding: 0 11px; border-radius: 7px; font-size: 13px; font-weight: 500; color: var(--mute); cursor: pointer; transition: background 0.12s, color 0.12s; }
.ab-filters button em { margin-left: 4px; font-style: normal; font-size: 12px; color: var(--faint); font-variant-numeric: tabular-nums; }
.ab-filters button:hover { background: rgba(20, 22, 28, 0.05); color: var(--ink); }
.ab-filters button.is-on { background: rgba(20, 22, 28, 0.08); color: var(--ink); }
.ab-filters button:focus-visible, .ab-sortsel select:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
.ab-tools-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ab-search { position: relative; display: flex; align-items: center; width: 230px; }
.ab-search .ab-ico { position: absolute; left: 11px; color: var(--faint); pointer-events: none; }
.ab-search input { width: 100%; height: 34px; padding: 0 30px 0 33px; border-radius: 8px; border: 1px solid var(--line-2); background: #fff; font-size: 13px; color: var(--ink); outline: none; }
.ab-search input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.08); }
.ab-search kbd { position: absolute; right: 9px; font: 500 11px var(--mono); color: var(--faint); border: 1px solid var(--line); border-radius: 5px; padding: 1px 6px; background: var(--wash); }
.ab-sortsel select { height: 34px; padding: 0 28px 0 11px; border-radius: 8px; border: 1px solid var(--line-2); background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236a6f7d'%3E%3Cpath d='M5.8 7.5 10 11.7l4.2-4.2 1.3 1.3L10 14.3 4.5 8.8z'/%3E%3C/svg%3E") no-repeat right 8px center / 14px; font-size: 13px; color: var(--ink); appearance: none; cursor: pointer; }

/* ── list ── */
.ab-list { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.ab-colhead, .ab-row { display: grid; grid-template-columns: minmax(230px, 2.1fr) 104px minmax(130px, 1.1fr) minmax(112px, 1fr) minmax(112px, 1fr) minmax(120px, 1.1fr) 18px; gap: 18px; align-items: center; padding-left: 20px; padding-right: 18px; }
.ab-colhead { padding-top: 11px; padding-bottom: 10px; font-size: 12px; font-weight: 500; color: var(--mute); border-bottom: 1px solid var(--line); background: #fff; }
.ab-colhead .r { text-align: right; }
.ab-row { padding-top: 13px; padding-bottom: 13px; border-top: 1px solid var(--line); color: inherit; text-decoration: none; outline: none; transition: background 0.12s; }
.ab-colhead + .ab-row { border-top: 0; }
.ab-row:hover, .ab-row:focus-visible { background: var(--wash); }
.ab-row:focus-visible { box-shadow: inset 0 0 0 2px var(--ink); }
.ab-id { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ab-glyph { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 8px; background: var(--wash); border: 1px solid var(--line); color: var(--ink-2); }
.ab-glyph svg { width: 17px; height: 17px; }
.ab-name { display: grid; gap: 3px; min-width: 0; }
.ab-name b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ab-name i { font: 400 12px var(--mono); font-style: normal; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ab-type { font-size: 13px; color: var(--ink-2); }
.ab-bal { text-align: right; }
.ab-bal b { font-size: 14.5px; font-weight: 600; }
.ab-bal b small { font-size: 12px; font-weight: 500; color: var(--mute); margin-right: 3px; }
.ab-bal b span { color: var(--faint); font-weight: 500; }
.ab-bal i { font-style: normal; font-size: 11.5px; color: var(--mute); }
.ab-num { text-align: right; font-size: 13.5px; color: var(--ink-2); }
.ab-num.is-zero { color: var(--faint); }
.ab-when { min-width: 0; }
.ab-when b { font-size: 13px; font-weight: 500; }
.ab-when b.is-none { color: var(--faint); }
.ab-when i { font-style: normal; font-size: 12px; color: var(--mute); }
.ab-go { width: 16px; height: 16px; color: var(--faint); transition: transform 0.15s, color 0.15s; }
.ab-row:hover .ab-go, .ab-row:focus-visible .ab-go { transform: translateX(2px); color: var(--ink); }
.ab-mline { display: none; }
.ab-sect { display: flex; justify-content: space-between; align-items: center; padding: 8px 20px; background: var(--wash); border-top: 1px solid var(--line); font-size: 12px; font-weight: 600; color: var(--mute); }
.ab-sect b { margin-left: 6px; font-weight: 600; color: var(--ink-2); }

/* ── states ── */
.ab-panel { text-align: center; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 52px 24px; }
.ab-panel-flat { padding: 40px 24px; }
.ab-panel-ico { width: 26px; height: 26px; margin: 0 auto; color: var(--mute); }
.ab-panel-ico.is-err { color: #b42318; }
.ab-panel h2 { margin: 14px 0 4px; font-size: 16px; font-weight: 600; }
.ab-panel p { margin: 0 auto 18px; max-width: 400px; font-size: 13.5px; line-height: 1.6; color: var(--mute); }
.ab-link { font-size: 13px; font-weight: 500; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
.ab-skel-strip { height: 92px; border-radius: 12px; }
.ab-skel-strip, .ab-skel-row span { background: linear-gradient(100deg, #eceef2 30%, #f5f6f8 50%, #eceef2 70%); background-size: 220% 100%; animation: ab-shimmer 1.4s linear infinite; }
.ab-skel-list { margin-top: 18px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 6px 0; }
.ab-skel-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 24px; padding: 16px 20px; }
.ab-skel-row span { height: 14px; border-radius: 5px; }
@keyframes ab-shimmer { to { background-position: -120% 0; } }

/* ── create dialog ── */
.ab-dlg { display: grid; grid-template-columns: 270px minmax(0, 1fr); flex: 1 1 auto; min-height: 0; height: 100%; }
.ab-types { background: var(--wash); border-right: 1px solid var(--line); padding: 24px 16px; overflow-y: auto; }
.ab-types-title { margin: 0 8px 12px; font-size: 12px; font-weight: 600; color: var(--mute); }
.ab-types-list { display: grid; gap: 4px; }
.ab-typeopt { display: flex; align-items: center; gap: 11px; padding: 9px 10px; border-radius: 10px; text-align: left; cursor: pointer; border: 1px solid transparent; transition: background 0.12s; }
.ab-typeopt:hover { background: rgba(20, 22, 28, 0.04); }
.ab-typeopt:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
.ab-typeopt.is-on { background: #fff; border-color: var(--ink); }
.ab-typeopt-text { display: grid; gap: 2px; min-width: 0; }
.ab-typeopt-text b { font-size: 13.5px; font-weight: 600; }
.ab-typeopt-text i { font-style: normal; font-size: 12px; line-height: 1.35; color: var(--mute); }
.ab-form { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: #fff; }
.ab-form-head { padding: 24px 28px 4px; }
.ab-form-title { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
.ab-form-desc { margin: 4px 0 0; font-size: 13px; color: var(--mute); }
.ab-form-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 28px 20px; }
.ab-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ab-span-2 { grid-column: 1 / -1; }
.ab-field label { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: var(--ink); }
.ab-field label i { font-style: normal; color: var(--faint); }
.ab-input, .ab-money { width: 100%; height: 40px; border-radius: 8px; border: 1px solid var(--line-2); background: #fff; font-size: 14px; color: var(--ink); padding: 0 12px; outline: none; transition: border-color 0.12s, box-shadow 0.12s; }
.ab-input.is-mono { font-family: var(--mono); font-size: 13px; }
.ab-input:focus, .ab-money:focus-within { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 22, 28, 0.08); }
.ab-input.is-bad, .ab-money.is-bad { border-color: #b42318; box-shadow: 0 0 0 3px rgba(180, 35, 24, 0.1); }
.ab-input::placeholder, .ab-money input::placeholder { color: var(--faint); }
.ab-money { display: flex; align-items: center; gap: 8px; }
.ab-money span { font-size: 13px; color: var(--mute); }
.ab-money input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; font-size: 14px; font-variant-numeric: tabular-nums; color: var(--ink); }
.ab-err { margin: 5px 0 0; font-size: 12px; color: #b42318; }
.ab-note { margin: 0; padding: 10px 12px; border-radius: 8px; background: var(--wash); color: var(--ink-2); font-size: 13px; line-height: 1.5; border: 1px solid var(--line); }
.ab-rule { height: 1px; margin: 20px 0 16px; background: var(--line); }
.ab-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0 16px; }
.ab-divider::before, .ab-divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.ab-divider span { font-size: 12px; font-weight: 600; color: var(--mute); }
.ab-form-error { display: flex; gap: 9px; align-items: flex-start; margin: 0 28px 12px; padding: 10px 12px; border-radius: 8px; background: #fef3f2; border: 1px solid #fecdca; color: #912018; font-size: 13px; }
.ab-form-error svg { width: 16px; height: 16px; flex: none; margin-top: 1px; }
.ab-form-error p { margin: 0; }
.ab-form-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 28px; border-top: 1px solid var(--line); background: var(--wash); }

/* ── responsive ── */
@media (max-width: 1100px) {
  .ab-colhead, .ab-row { grid-template-columns: minmax(210px, 2fr) minmax(130px, 1.1fr) minmax(108px, 1fr) minmax(108px, 1fr) minmax(110px, 1fr) 18px; }
  .ab-colhead span:nth-child(2), .ab-type { display: none; }
}
@media (max-width: 860px) {
  .ab-summary { grid-template-columns: 1fr 1fr; }
  .ab-summary > div:nth-child(3) { border-left: 0; }
  .ab-summary > div:nth-child(n + 3) { border-top: 1px solid var(--line); }
  .ab-colhead { display: none; }
  .ab-row { grid-template-columns: minmax(0, 1fr) auto; gap: 8px 14px; padding: 14px 16px; }
  .ab-num, .ab-when, .ab-go, .ab-type { display: none; }
  .ab-bal { grid-column: 2; grid-row: 1; }
  .ab-mline { display: block; grid-column: 1 / -1; padding-left: 46px; font-size: 12px; line-height: 1.4; color: var(--mute); font-variant-numeric: tabular-nums; }
  .ab-sect { padding: 8px 16px; }
  .ab-search { width: 100%; }
  .ab-tools-right { width: 100%; }
  .ab-sortsel { flex: none; }
  .ab-search { flex: 1; }
  .ab-dlg { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
  .ab-types { border-right: 0; border-bottom: 1px solid var(--line); padding: 12px; }
  .ab-types-title { display: none; }
  .ab-types-list { display: flex; overflow-x: auto; gap: 6px; }
  .ab-typeopt { flex: none; }
  .ab-typeopt-text i { display: none; }
  .ab-form-head, .ab-form-body, .ab-form-foot { padding-left: 18px; padding-right: 18px; }
  .ab-form-error { margin-left: 18px; margin-right: 18px; }
  .ab-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .ab *, .ab *::before, .ab *::after { animation: none !important; transition: none !important; }
}
</style>
