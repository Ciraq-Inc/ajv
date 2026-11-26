<template>
  <div class="min-h-screen bg-[#f9fafb] text-[#111827]">
    <div class="max-w-7xl mx-auto px-5 py-6 space-y-6">
      <!-- Breadcrumb + Header -->
      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div class="text-xs text-[#6b7280] mb-1">
            Rigel Portal / Operations / <span class="text-[#111827] font-medium">Pharmacy Accounts</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-[#111827]">Pharmacy Accounts</h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-lg border border-[#e5e7eb] bg-white p-0.5 text-xs shadow-sm" role="group" aria-label="Date range">
            <button
              v-for="opt in rangeOptions"
              :key="opt.value"
              type="button"
              class="px-2.5 py-1 rounded-md transition"
              :class="range === opt.value ? 'bg-[#4f46e5] text-white font-medium' : 'text-[#6b7280] hover:text-[#111827]'"
              @click="selectRange(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6] shadow-sm transition disabled:opacity-50"
            :disabled="!detail || isLoadingOverview"
            @click="exportActiveTabCsv"
          >
            Export
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#4f46e5] text-white hover:bg-[#4338ca] shadow-sm transition disabled:opacity-60"
            :disabled="isLoadingOverview || isLoadingDetail"
            @click="refreshAll"
          >
            {{ isLoadingOverview || isLoadingDetail ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- Error Banner -->
      <div v-if="errorMessage" role="alert" class="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-xs text-[#991b1b] flex items-center justify-between gap-3">
        <span>{{ errorMessage }}</span>
        <button type="button" class="font-semibold underline" @click="refreshAll">Try again</button>
      </div>

      <!-- Unified Summary Strip -->
      <section class="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#e5e7eb] rounded-xl shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-[#e5e7eb]" aria-label="Platform summary">
        <div class="p-4 sm:px-5">
          <div class="text-xs text-[#6b7280] font-medium">Active pharmacies</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-bold tabular-nums text-[#111827]">{{ summary.active_pharmacies }}</span>
            <span class="text-xs text-[#6b7280]">of {{ summary.total_pharmacies }}</span>
          </div>
        </div>
        <div class="p-4 sm:px-5">
          <div class="text-xs text-[#6b7280] font-medium">Accounts created</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-bold tabular-nums text-[#111827]">{{ summary.accounts_created }}</span>
            <span class="text-xs text-[#6b7280]">{{ accountType === 'all' ? 'across all types' : accountTypeLabel(accountType) }}</span>
          </div>
        </div>
        <div class="p-4 sm:px-5">
          <div class="text-xs text-[#6b7280] font-medium">Ledger postings</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-bold tabular-nums text-[#111827]">{{ summary.ledger_postings.toLocaleString() }}</span>
            <span class="text-xs text-[#6b7280]">{{ rangeLabel }}</span>
          </div>
        </div>
        <div class="p-4 sm:px-5">
          <div class="text-xs text-[#6b7280] font-medium">Tracked available funds</div>
          <div class="mt-1 text-xl font-bold tabular-nums text-[#111827]">{{ formatGhs(summary.tracked_available_funds) }}</div>
        </div>
      </section>

      <!-- Main Master-Detail Workspace -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- Left: Pharmacy Directory -->
        <aside class="lg:col-span-4 bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <div class="p-3 border-b border-[#e5e7eb] bg-[#f9fafb]/60 flex items-center gap-2">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Filter pharmacies..."
              aria-label="Filter pharmacies"
              class="w-full text-xs px-3 py-1.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#4f46e5]"
            />
            <select
              v-model="accountType"
              aria-label="Filter by account type"
              class="text-xs rounded-lg border border-[#d1d5db] bg-white px-2 py-1.5 text-[#374151] shrink-0 focus:outline-none focus:border-[#4f46e5]"
              @change="onTypeFilterChange"
            >
              <option value="all">All types</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="mobile_money">MoMo</option>
              <option value="pos">POS</option>
              <option value="petty_cash">Petty</option>
              <option value="loan">Loan</option>
            </select>
          </div>

          <div v-if="isLoadingOverview && pharmacies.length === 0" class="p-6 text-center text-xs text-[#6b7280]">
            Loading pharmacies...
          </div>
          <div v-else-if="filteredPharmacies.length === 0" class="p-8 text-center text-xs text-[#6b7280]">
            No pharmacies match your filter.
          </div>
          <div v-else class="divide-y divide-[#f3f4f6] max-h-[560px] overflow-y-auto">
            <button
              v-for="pharmacy in filteredPharmacies"
              :key="pharmacy.company_id"
              type="button"
              class="w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition"
              :class="selectedCompanyId === pharmacy.company_id ? 'bg-[#eef2ff] border-l-2 border-[#4f46e5]' : 'hover:bg-[#f9fafb]'"
              @click="selectPharmacy(pharmacy.company_id)"
            >
              <div class="min-w-0">
                <div
                  class="text-xs truncate"
                  :class="selectedCompanyId === pharmacy.company_id ? 'text-[#4f46e5] font-semibold' : 'text-[#111827] font-medium'"
                >
                  {{ pharmacy.name }}
                </div>
                <div class="text-xs text-[#6b7280] truncate mt-0.5">
                  {{ pharmacy.location || 'No location' }} · {{ formatRelative(pharmacy.last_activity_at) }}
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-xs font-semibold tabular-nums text-[#111827]">{{ formatGhs(pharmacy.available_funds) }}</div>
                <div class="text-xs text-[#6b7280]">
                  {{ pharmacy.account_count }} {{ pharmacy.account_count === 1 ? 'acct' : 'accts' }}
                </div>
              </div>
            </button>
          </div>
        </aside>

        <!-- Right: Selected Pharmacy Detail -->
        <div class="lg:col-span-8 bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <div v-if="isLoadingDetail && !detail" class="p-10 text-center text-xs text-[#6b7280]">
            Loading pharmacy accounts...
          </div>

          <div v-else-if="!detail" class="p-10 text-center text-xs text-[#6b7280]">
            Select a pharmacy from the list to inspect its accounts and ledger activity.
          </div>

          <template v-else>
            <!-- Detail Header -->
            <div class="px-5 py-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-[#111827]">{{ detail.pharmacy.name }}</h2>
                <p class="text-xs text-[#6b7280] mt-0.5">
                  {{ detail.pharmacy.location || 'No location' }} · Last activity {{ formatRelative(detail.pharmacy.last_activity_at) }}
                </p>
              </div>
              <div class="flex items-center gap-6 text-xs">
                <div>
                  <span class="text-[#6b7280]">Available</span>
                  <div class="font-bold tabular-nums text-[#111827]">{{ formatGhs(detail.pharmacy.available_funds) }}</div>
                </div>
                <div>
                  <span class="text-[#6b7280]">Loans</span>
                  <div class="font-bold tabular-nums" :class="detail.pharmacy.loans_owed === 0 ? 'text-[#9ca3af]' : 'text-[#111827]'">
                    {{ formatGhs(detail.pharmacy.loans_owed) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="px-5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#f9fafb]/40">
              <div class="flex items-center gap-6 text-xs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="activeTab === 'accounts'"
                  class="py-3 border-b-2 transition"
                  :class="activeTab === 'accounts' ? 'font-semibold border-[#4f46e5] text-[#4f46e5]' : 'font-medium border-transparent text-[#6b7280] hover:text-[#111827]'"
                  @click="activeTab = 'accounts'"
                >
                  Accounts <span class="ml-1 text-[#6b7280] font-normal">{{ detail.accounts.length }}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="activeTab === 'ledger'"
                  class="py-3 border-b-2 transition"
                  :class="activeTab === 'ledger' ? 'font-semibold border-[#4f46e5] text-[#4f46e5]' : 'font-medium border-transparent text-[#6b7280] hover:text-[#111827]'"
                  @click="activeTab = 'ledger'"
                >
                  Ledger Activity <span class="ml-1 text-[#6b7280] font-normal">{{ detail.ledger_pagination.total }}</span>
                </button>
              </div>
              <span class="text-xs text-[#6b7280]">Read-only</span>
            </div>

            <!-- Accounts Table -->
            <div v-if="activeTab === 'accounts'" class="overflow-x-auto">
              <div v-if="detail.accounts.length === 0" class="p-8 text-center text-xs text-[#6b7280]">
                No accounts found for this filter.
              </div>
              <table v-else class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-[#e5e7eb] text-[#6b7280] bg-[#f9fafb]">
                    <th class="py-2.5 px-5 font-semibold">Account</th>
                    <th class="py-2.5 px-3 font-semibold">Type</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Balance</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Money in</th>
                    <th class="py-2.5 px-3 font-semibold text-right">Money out</th>
                    <th class="py-2.5 px-5 font-semibold text-right">Updated</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#f3f4f6]">
                  <tr v-for="account in detail.accounts" :key="account.id" class="hover:bg-[#f9fafb]">
                    <td class="py-3 px-5 font-medium text-[#111827]">{{ account.name }}</td>
                    <td class="py-3 px-3 text-[#6b7280]">{{ accountTypeLabel(account.type) }}</td>
                    <td class="py-3 px-3 text-right font-semibold tabular-nums text-[#111827]">{{ formatGhs(account.current_balance) }}</td>
                    <td class="py-3 px-3 text-right tabular-nums text-[#6b7280]">{{ formatGhs(account.money_in) }}</td>
                    <td class="py-3 px-3 text-right tabular-nums text-[#6b7280]">{{ formatGhs(account.money_out) }}</td>
                    <td class="py-3 px-5 text-right text-[#6b7280]">{{ formatRelative(account.last_movement_at || account.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Ledger Activity Table -->
            <div v-else class="overflow-x-auto">
              <div v-if="detail.ledger.length === 0" class="p-8 text-center text-xs text-[#6b7280]">
                No ledger postings in this period.
              </div>
              <table v-else class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-[#e5e7eb] text-[#6b7280] bg-[#f9fafb]">
                    <th class="py-2.5 px-5 font-semibold">Date</th>
                    <th class="py-2.5 px-3 font-semibold">Account</th>
                    <th class="py-2.5 px-3 font-semibold">Source</th>
                    <th class="py-2.5 px-3 font-semibold">Recorded by</th>
                    <th class="py-2.5 px-5 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#f3f4f6]">
                  <tr v-for="entry in detail.ledger" :key="entry.id" class="hover:bg-[#f9fafb]">
                    <td class="py-3 px-5 text-[#6b7280] whitespace-nowrap">{{ formatDateTime(entry.posted_at) }}</td>
                    <td class="py-3 px-3 font-medium text-[#111827]">{{ entry.account_name }}</td>
                    <td class="py-3 px-3 text-[#6b7280]">{{ formatSource(entry.source) }}</td>
                    <td class="py-3 px-3 text-[#6b7280]">{{ entry.entered_by || '—' }}</td>
                    <td
                      class="py-3 px-5 text-right font-semibold tabular-nums"
                      :class="entry.direction === 'in' ? 'text-[#059669]' : 'text-[#111827]'"
                    >
                      {{ entry.direction === 'in' ? '+' : '−' }}{{ formatGhs(entry.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createAdminPharmacyAccountsService,
  type AdminAccountTypeFilter,
  type AdminAccountsRange,
  type AdminAccountsSummary,
  type AdminPharmacyAccountListItem,
  type AdminPharmacyAccountsDetailData,
} from '~/services/admin/pharmacyAccountsService'
import { useAdminGuarded } from '~/composables/useAdminGuarded'
import { downloadCsv, toCsv } from '~/utils/csv'
import { formatGhs } from '~/utils/money'

definePageMeta({
  requiredRole: 'auditor',
  middleware: ['admin-auth'],
  layout: 'admin-layout',
})

const service = useAdminGuarded(createAdminPharmacyAccountsService(useApi()))

const rangeOptions: Array<{ value: AdminAccountsRange; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
]

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_money: 'MoMo',
  pos: 'POS',
  petty_cash: 'Petty cash',
  loan: 'Loan',
}

const SOURCE_LABELS: Record<string, string> = {
  sales: 'Sales',
  credit_payment: 'Credit payment',
  cheque: 'Cheque',
  manual: 'Manual entry',
  expense: 'Expense',
  withdrawal: 'Withdrawal',
  supplier_payment: 'Supplier payment',
  transfer: 'Transfer',
  charges: 'Charges',
  loan_received: 'Loan received',
  loan_repayment: 'Loan repayment',
  reversal: 'Reversal',
}

const range = ref<AdminAccountsRange>('30d')
const accountType = ref<AdminAccountTypeFilter>('all')
const searchQuery = ref('')
const activeTab = ref<'accounts' | 'ledger'>('accounts')

const summary = ref<AdminAccountsSummary>({
  total_pharmacies: 0,
  active_pharmacies: 0,
  accounts_created: 0,
  ledger_postings: 0,
  tracked_available_funds: 0,
})
const pharmacies = ref<AdminPharmacyAccountListItem[]>([])
const selectedCompanyId = ref<number | null>(null)
const detail = ref<AdminPharmacyAccountsDetailData | null>(null)

const isLoadingOverview = ref(false)
const isLoadingDetail = ref(false)
const errorMessage = ref('')

let overviewSeq = 0
let detailSeq = 0

const rangeLabel = computed(() => {
  if (range.value === '7d') return 'last 7 days'
  if (range.value === '30d') return 'last 30 days'
  if (range.value === '90d') return 'last 90 days'
  return 'all time'
})

const filteredPharmacies = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return pharmacies.value
  return pharmacies.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q)
      || (p.location || '').toLowerCase().includes(q),
  )
})

const accountTypeLabel = (type: string): string => ACCOUNT_TYPE_LABELS[type] || type
const formatSource = (source: string): string => SOURCE_LABELS[source] || source

const formatRelative = (iso: string | null | undefined): string => {
  if (!iso) return 'No activity'
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return '—'
  const diffMins = Math.floor((Date.now() - ts) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short' }).format(new Date(ts))
}

const formatDateTime = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const loadDetail = async (companyId: number): Promise<void> => {
  const seq = ++detailSeq
  isLoadingDetail.value = true
  try {
    const res = await service.getPharmacyDetail(companyId, {
      range: range.value,
      accountType: accountType.value,
      limit: 50,
      offset: 0,
    })
    if (seq !== detailSeq) return
    detail.value = res.data ?? null
  } catch (err) {
    if (seq !== detailSeq) return
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load pharmacy details.'
  } finally {
    if (seq === detailSeq) isLoadingDetail.value = false
  }
}

const loadOverview = async (): Promise<void> => {
  const seq = ++overviewSeq
  isLoadingOverview.value = true
  errorMessage.value = ''
  try {
    const res = await service.getOverview({
      range: range.value,
      accountType: accountType.value,
    })
    if (seq !== overviewSeq) return
    const data = res.data
    if (data) {
      summary.value = data.summary
      pharmacies.value = data.pharmacies
      const stillPresent = data.pharmacies.some((p) => p.company_id === selectedCompanyId.value)
      const nextId = stillPresent ? selectedCompanyId.value : (data.pharmacies[0]?.company_id ?? null)
      selectedCompanyId.value = nextId
      if (nextId !== null) {
        await loadDetail(nextId)
      } else {
        detail.value = null
      }
    }
  } catch (err) {
    if (seq !== overviewSeq) return
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load pharmacy accounts.'
  } finally {
    if (seq === overviewSeq) isLoadingOverview.value = false
  }
}

const selectPharmacy = async (companyId: number): Promise<void> => {
  selectedCompanyId.value = companyId
  await loadDetail(companyId)
}

const selectRange = async (nextRange: AdminAccountsRange): Promise<void> => {
  range.value = nextRange
  await loadOverview()
}

const onTypeFilterChange = async (): Promise<void> => {
  await loadOverview()
}

const refreshAll = async (): Promise<void> => {
  await loadOverview()
}

const exportActiveTabCsv = (): void => {
  if (!detail.value) return
  const slug = detail.value.pharmacy.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  if (activeTab.value === 'accounts') {
    const csv = toCsv(detail.value.accounts, [
      { key: 'name', header: 'Account' },
      { key: 'type', header: 'Type' },
      { key: 'current_balance', header: 'Balance (GHS)' },
      { key: 'money_in', header: 'Money In (GHS)' },
      { key: 'money_out', header: 'Money Out (GHS)' },
      { key: 'last_movement_at', header: 'Last Activity' },
    ])
    downloadCsv(`pharmacy-accounts-${slug}.csv`, csv)
    return
  }

  const csv = toCsv(detail.value.ledger, [
    { key: 'posted_at', header: 'Date' },
    { key: 'account_name', header: 'Account' },
    { key: 'source', header: 'Source' },
    { key: 'direction', header: 'Direction' },
    { key: 'amount', header: 'Amount (GHS)' },
    { key: 'entered_by', header: 'Recorded By' },
    { key: 'reference', header: 'Reference' },
  ])
  downloadCsv(`pharmacy-accounts-ledger-${slug}.csv`, csv)
}

onMounted(() => {
  void loadOverview()
})
</script>
