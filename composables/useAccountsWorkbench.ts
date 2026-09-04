import { computed, ref } from 'vue'
import { createAccountsService } from '~/services/accounts/accountsService'
import type {
  AccountCheque,
  AccountSummary,
  AccountType,
  CreditCandidateResponse,
  CreditGuide,
  CreditCandidateFilters,
  CreateAccountPayload,
  LedgerEntry,
  LoanMovementPayload,
  MoneyInPayload,
  MoneyOutPayload,
  PayableMethodPaymentPayload,
  PayablePaymentBatchPayload,
  PayablePaymentBatchResult,
  PayableCounts,
  PayableLedgerEntry,
  PayableLedgerPage,
  PayableLedgerPagination,
  PayablePagination,
  PayableSummaryTotals,
  PayableSupplierOption,
  PayablesPage,
  PayableSummary,
  PaymentMethodSummary,
  ReceiveChequePayload,
} from '~/services/types'
import { isSessionError, sessionExpiredMessage } from '~/utils/accountsSession'

const accountTypeLabels: Record<AccountType, string> = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_money: 'Mobile money',
  pos: 'POS settlement',
  petty_cash: 'Petty cash',
  loan: 'Loan account',
}

const sourceLabels: Record<string, string> = {
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

const messageFromError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong. Try again.'

export const useAccountsWorkbench = () => {
  const service = createAccountsService(useApi())
  const accounts = ref<AccountSummary[]>([])
  const currentAccount = ref<AccountSummary | null>(null)
  const ledgerEntries = ref<LedgerEntry[]>([])
  const creditCandidates = ref<CreditCandidateResponse | null>(null)
  const creditGuide = ref<CreditGuide | null>(null)
  const payables = ref<PayableSummary[]>([])
  const pendingPayables = ref<PayableSummary[]>([])
  const pendingPayableCount = ref(0)
  const pendingPayableTotalPesewas = ref(0)
  const isLoadingPendingPayables = ref(false)
  const payablesPagination = ref<PayablePagination>({ limit: 50, offset: 0, total: 0, hasNext: false })
  const payableCounts = ref<PayableCounts>({ toPay: 0, awaiting: 0, settled: 0, attention: 0 })
  const payableSummary = ref<PayableSummaryTotals>({
    outstandingPesewas: 0,
    awaitingPesewas: 0,
    awaitingCount: 0,
    overduePesewas: 0,
    dueThisWeekPesewas: 0,
  })
  const payableSuppliers = ref<PayableSupplierOption[]>([])
  const payableLedgerEntries = ref<PayableLedgerEntry[]>([])
  const payableLedgerPagination = ref<PayableLedgerPagination>({ limit: 50, offset: 0, total: 0, hasNext: false })
  const payableLedgerSummary = ref({ totalPaid: 0 })
  const paymentMethods = ref<PaymentMethodSummary[]>([])
  const isLoading = ref(false)
  const isLoadingLedger = ref(false)
  // Background refreshes keep the current workspace visible while fresh
  // balances arrive. The initial load still uses isLoading so the page can
  // render its full skeleton once.
  const isRefreshing = ref(false)
  const isSaving = ref(false)
  const isLoadingCandidates = ref(false)
  const error = ref('')
  const sessionExpired = ref(false)
  let creditCandidateRequestId = 0
  let payableRequestId = 0
  let pendingPayableRequestId = 0
  let payableLedgerRequestId = 0
  let accountRequestId = 0

  const formatMoney = (value: number | null | undefined): string =>
    new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0))

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return 'Not recorded'
    return new Date(value).toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalBalance = computed(() =>
    accounts.value.reduce((total, account) => total + account.currentBalance, 0),
  )
  const pendingReview = computed(() =>
    accounts.value.reduce((total, account) => total + account.pendingReview, 0),
  )

  type LoadOptions = { background?: boolean }

  const loadAccounts = async ({ background = false }: LoadOptions = {}) => {
    if (background) isRefreshing.value = true
    else {
      isLoading.value = true
      error.value = ''
      sessionExpired.value = false
    }
    try {
      const response = await service.listAccounts()
      if (!response.success) {
        throw new Error(response.message || 'Could not load accounts.')
      }
      accounts.value = response.data ?? []
    } catch (err) {
      if (background) throw err
      sessionExpired.value = isSessionError(err)
      error.value = sessionExpired.value ? sessionExpiredMessage : messageFromError(err)
      accounts.value = []
    } finally {
      if (background) isRefreshing.value = false
      else isLoading.value = false
    }
  }

  const loadAccount = async (accountId: string, { background = false }: LoadOptions = {}) => {
    const requestId = ++accountRequestId
    if (background) isRefreshing.value = true
    else {
      isLoading.value = true
      isLoadingLedger.value = true
      error.value = ''
    }
    try {
      const accountRequest = service.getAccount(accountId)
      const ledgerRequest = service.listLedger(accountId)
      const accountResponse = await accountRequest
      if (!accountResponse.success) throw new Error(accountResponse.message || 'Could not load this account.')
      if (requestId !== accountRequestId) return
      currentAccount.value = accountResponse.data ?? null
      // Let the account page open as soon as the account is available. The
      // ledger keeps loading in its own section rather than holding up the
      // entire workspace.
      if (!background) isLoading.value = false

      const ledgerResponse = await ledgerRequest
      if (!ledgerResponse.success) throw new Error(ledgerResponse.message || 'Could not load this ledger.')
      if (requestId !== accountRequestId) return
      ledgerEntries.value = ledgerResponse.data ?? []
    } catch (err) {
      if (requestId !== accountRequestId) return
      if (background) throw err
      sessionExpired.value = isSessionError(err)
      error.value = sessionExpired.value ? sessionExpiredMessage : messageFromError(err)
      currentAccount.value = null
      ledgerEntries.value = []
    } finally {
      if (requestId !== accountRequestId) return
      isLoadingLedger.value = false
      if (background) isRefreshing.value = false
      else isLoading.value = false
    }
  }

  const createAccount = async (payload: CreateAccountPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.createAccount(payload)
      if (response.data) accounts.value = [response.data, ...accounts.value]
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const loadCreditCandidates = async (
    source: 'sales' | 'credit_payment' | 'cheque',
    date: string,
    filters: CreditCandidateFilters = {},
  ) => {
    const requestId = ++creditCandidateRequestId
    isLoadingCandidates.value = true
    try {
      const response = await service.listCreditCandidates(source, date, filters)
      if (requestId !== creditCandidateRequestId) return undefined
      creditCandidates.value = response.data ?? null
      return response.data
    } catch (err) {
      if (requestId !== creditCandidateRequestId) return undefined
      creditCandidates.value = null
      throw err
    } finally {
      if (requestId === creditCandidateRequestId) isLoadingCandidates.value = false
    }
  }

  const loadCreditGuide = async (from: string, to: string) => {
    isLoadingCandidates.value = true
    try {
      const response = await service.listCreditGuide(from, to)
      creditGuide.value = response.data ?? null
      return response.data
    } catch (err) {
      creditGuide.value = null
      throw err
    } finally {
      isLoadingCandidates.value = false
    }
  }

  const loadPayables = async (options: {
    includeSettled?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
    source?: 'store' | 'warehouse';
    lifecycle?: 'to_pay' | 'awaiting' | 'settled';
    attentionOnly?: boolean;
    supplier?: string;
    dateField?: 'invoice' | 'due' | 'synced';
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    const requestId = ++payableRequestId
    try {
      const response = await service.listPayables(options)
      if (requestId !== payableRequestId) return payables.value
      const page = response.data as PayablesPage | undefined
      payables.value = page?.items ?? []
      payablesPagination.value = page?.pagination ?? { limit: options.limit ?? 50, offset: options.offset ?? 0, total: 0, hasNext: false }
      payableCounts.value = page?.counts ?? { toPay: 0, awaiting: 0, settled: 0, attention: 0 }
      payableSummary.value = page?.summary ?? {
        outstandingPesewas: 0,
        awaitingPesewas: 0,
        awaitingCount: 0,
        overduePesewas: 0,
        dueThisWeekPesewas: 0,
      }
      return payables.value
    } catch (err) {
      if (requestId !== payableRequestId) return payables.value
      payables.value = []
      payablesPagination.value = { limit: options.limit ?? 50, offset: options.offset ?? 0, total: 0, hasNext: false }
      payableCounts.value = { toPay: 0, awaiting: 0, settled: 0, attention: 0 }
      payableSummary.value = { outstandingPesewas: 0, awaitingPesewas: 0, awaitingCount: 0, overduePesewas: 0, dueThisWeekPesewas: 0 }
      throw err
    }
  }

  // This preview is intentionally separate from the active table request. A
  // user can be looking at Settled or Ledger while still needing to know that
  // a payment is waiting for RigelOS, and replacing the table rows here would
  // make the workspace jump to a different view.
  const loadPendingPayables = async () => {
    const requestId = ++pendingPayableRequestId
    isLoadingPendingPayables.value = true
    try {
      const response = await service.listPayables({
        includeSettled: true,
        lifecycle: 'awaiting',
        limit: 100,
        offset: 0,
      })
      if (requestId !== pendingPayableRequestId) return pendingPayables.value
      const page = response.data as PayablesPage | undefined
      const items = page?.items ?? []
      pendingPayables.value = items
      pendingPayableCount.value = Number(page?.pagination?.total ?? items.length)
      const itemPaymentTotalPesewas = items.reduce((total, item) => {
        const actionAmount = Number(item.paymentActionAmountPesewas || 0)
        const locallyRecorded = Math.max(0, Number(item.amountPaidPesewas || 0) - Number(item.lastConfirmedPaidPesewas || 0))
        return total + (actionAmount > 0 ? actionAmount : locallyRecorded)
      }, 0)
      const reportedPaymentTotalPesewas = Number(page?.summary?.pendingActionPesewas || 0)
      pendingPayableTotalPesewas.value = reportedPaymentTotalPesewas > 0
        ? reportedPaymentTotalPesewas
        : itemPaymentTotalPesewas
      return pendingPayables.value
    } catch {
      // Keep the last known reminder visible if this background check fails.
      // Clearing it on a transient network error would falsely tell the user
      // that RigelOS has already received the payment.
      return pendingPayables.value
    } finally {
      if (requestId === pendingPayableRequestId) isLoadingPendingPayables.value = false
    }
  }

  const loadPayableSuppliers = async () => {
    const response = await service.listPayableSuppliers()
    payableSuppliers.value = response.data ?? []
    return payableSuppliers.value
  }

  const loadPayableLedger = async (options: {
    limit?: number;
    offset?: number;
    search?: string;
    source?: 'store' | 'warehouse';
    supplier?: string;
    dateField?: 'payment';
    dateFrom?: string;
    dateTo?: string;
  } = {}) => {
    const requestId = ++payableLedgerRequestId
    try {
      const response = await service.listPayableLedger(options)
      if (requestId !== payableLedgerRequestId) return payableLedgerEntries.value
      const page = response.data as PayableLedgerPage | undefined
      payableLedgerEntries.value = page?.items ?? []
      payableLedgerPagination.value = page?.pagination ?? { limit: options.limit ?? 50, offset: options.offset ?? 0, total: 0, hasNext: false }
      payableLedgerSummary.value = page?.summary ?? { totalPaid: 0 }
      return payableLedgerEntries.value
    } catch (err) {
      if (requestId !== payableLedgerRequestId) return payableLedgerEntries.value
      payableLedgerEntries.value = []
      payableLedgerPagination.value = { limit: options.limit ?? 50, offset: options.offset ?? 0, total: 0, hasNext: false }
      payableLedgerSummary.value = { totalPaid: 0 }
      throw err
    }
  }

  const postMoneyIn = async (payload: MoneyInPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.postMoneyIn(payload)
      await loadAccount(String(payload.accountId))
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const postMoneyOut = async (payload: MoneyOutPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.postMoneyOut(payload)
      await loadAccount(String(payload.accountId))
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const postPayableMethodPayment = async (payload: PayableMethodPaymentPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.postPayableMethodPayment(payload)
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const postPayablePaymentBatch = async (payload: PayablePaymentBatchPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.postPayablePaymentBatch(payload)
      return response.data as PayablePaymentBatchResult | undefined
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const response = await service.listPaymentMethods()
      paymentMethods.value = response.data ?? []
      return paymentMethods.value
    } catch (err) {
      paymentMethods.value = []
      throw err
    }
  }

  const postLoanReceived = async (payload: LoanMovementPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.postLoanReceived(payload)
      await Promise.all([loadAccount(String(payload.loanAccountId)), loadAccounts()])
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const postLoanRepayment = async (payload: LoanMovementPayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.postLoanRepayment(payload)
      await Promise.all([loadAccount(String(payload.loanAccountId)), loadAccounts()])
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const cheques = ref<AccountCheque[]>([])
  const isLoadingCheques = ref(false)

  const loadCheques = async (accountIdParam?: string | number, status?: string) => {
    const target = String(accountIdParam || currentAccount.value?.id || '')
    if (!target) return []
    isLoadingCheques.value = true
    try {
      const response = await service.listCheques(target, status)
      cheques.value = response.data ?? []
      return cheques.value
    } catch (err) {
      error.value = messageFromError(err)
      cheques.value = []
      return []
    } finally {
      isLoadingCheques.value = false
    }
  }

  const receiveCheque = async (payload: ReceiveChequePayload) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.receiveCheque(payload)
      await loadAccount(String(payload.accountId))
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const applyChequeAction = async (
    action: 'clear' | 'deposit' | 'bounce' | 'cancel',
    chequeId: string | number,
  ) => {
    isSaving.value = true
    error.value = ''
    try {
      if (action === 'clear') await service.clearCheque(chequeId)
      else if (action === 'deposit') await service.depositCheque(chequeId)
      else if (action === 'bounce') await service.bounceCheque(chequeId)
      else await service.cancelCheque(chequeId)
      if (currentAccount.value) await loadAccount(currentAccount.value.id)
      return true
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const reverseLedgerEntry = async (accountIdParam: string | number, entryId: string | number) => {
    isSaving.value = true
    error.value = ''
    try {
      const response = await service.reverseLedgerEntry(accountIdParam, entryId)
      await loadAccount(String(accountIdParam))
      return response.data
    } catch (err) {
      error.value = messageFromError(err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  return {
    accountTypeLabels,
    accounts,
    cheques,
    creditCandidates,
    creditGuide,
    createAccount,
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
    sessionExpired,
    ledgerEntries,
    loadAccount,
    loadAccounts,
    loadCheques,
    loadPayableLedger,
    loadPayableSuppliers,
    loadCreditCandidates,
    loadCreditGuide,
    loadPayables,
    loadPendingPayables,
    pendingReview,
    payables,
    pendingPayables,
    pendingPayableCount,
    pendingPayableTotalPesewas,
    isLoadingPendingPayables,
    payablesPagination,
    payableCounts,
    payableLedgerEntries,
    payableLedgerPagination,
    payableLedgerSummary,
    paymentMethods,
    payableSummary,
    payableSuppliers,
    postMoneyIn,
    postMoneyOut,
    postPayableMethodPayment,
    postPayablePaymentBatch,
    loadPaymentMethods,
    postLoanReceived,
    postLoanRepayment,
    receiveCheque,
    chequeAction: applyChequeAction,
    reverseLedgerEntry,
    sourceLabels,
    totalBalance,
  }
}
