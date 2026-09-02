import type {
  AccountCheque,
  AccountSummary,
  ApiEnvelope,
  ApiInstance,
  CreditCandidateResponse,
  CreditGuide,
  CreditCandidateFilters,
  CreateAccountPayload,
  LedgerEntry,
  MoneyInPayload,
  LoanMovementPayload,
  MoneyOutPayload,
  PayableMethodPaymentPayload,
  PayablePaymentBatchPayload,
  PayablePaymentBatchResult,
  PayablePaymentsPage,
  PayablesPage,
  PayableSupplierOption,
  PaymentMethodSummary,
  ReceiveChequePayload,
  TransferPayload,
} from '../types'

export const createAccountsService = (api: ApiInstance) => ({
  listAccounts(): Promise<ApiEnvelope<AccountSummary[]>> {
    return api.get('/api/accounts')
  },

  getAccount(accountId: string | number): Promise<ApiEnvelope<AccountSummary>> {
    return api.get(`/api/accounts/${accountId}`)
  },

  createAccount(payload: CreateAccountPayload): Promise<ApiEnvelope<AccountSummary>> {
    return api.post('/api/accounts', {
      name: payload.name,
      type: payload.type,
      branch: payload.branch,
      opening_balance: payload.openingBalance,
      metadata: payload.metadata,
    })
  },

  listLedger(accountId: string | number): Promise<ApiEnvelope<LedgerEntry[]>> {
    return api.get(`/api/accounts/${accountId}/ledger`)
  },

  listPayables(options: {
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
  } = {}): Promise<ApiEnvelope<PayablesPage>> {
    return api.get('/api/accounts/payables', {
      params: {
        includeSettled: options.includeSettled ? 'true' : undefined,
        limit: options.limit,
        offset: options.offset,
        search: options.search?.trim() || undefined,
        source: options.source,
        lifecycle: options.lifecycle,
        attentionOnly: options.attentionOnly ? 'true' : undefined,
        supplier: options.supplier?.trim() || undefined,
        dateField: options.dateField,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
      },
    })
  },

  listPayablePayments(options: {
    method?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<ApiEnvelope<PayablePaymentsPage>> {
    return api.get('/api/accounts/payables/payments', {
      params: {
        method: options.method || undefined,
        dateFrom: options.dateFrom || undefined,
        dateTo: options.dateTo || undefined,
      },
    })
  },

  listPayableSuppliers(): Promise<ApiEnvelope<PayableSupplierOption[]>> {
    return api.get('/api/accounts/payables/suppliers')
  },

  listPayableLedger(options: {
    limit?: number;
    offset?: number;
    search?: string;
    source?: 'store' | 'warehouse';
    supplier?: string;
    dateField?: 'payment';
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<ApiEnvelope<PayableLedgerPage>> {
    return api.get('/api/accounts/payables/ledger', {
      params: {
        limit: options.limit,
        offset: options.offset,
        search: options.search?.trim() || undefined,
        source: options.source,
        supplier: options.supplier?.trim() || undefined,
        dateField: options.dateField,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
      },
    })
  },

  listCreditCandidates(
    source: 'sales' | 'credit_payment' | 'cheque',
    date: string,
    filters: CreditCandidateFilters = {},
  ): Promise<ApiEnvelope<CreditCandidateResponse>> {
    return api.get('/api/accounts/credit-candidates', {
      params: {
        source,
        date,
        ...filters,
      },
    })
  },

  listCreditGuide(from: string, to: string): Promise<ApiEnvelope<CreditGuide>> {
    return api.get('/api/accounts/credit-guide', { params: { from, to } })
  },

  postMoneyIn(payload: MoneyInPayload): Promise<ApiEnvelope<LedgerEntry>> {
    return api.post(`/api/accounts/${payload.accountId}/money-in`, {
      source: payload.source,
      amount: payload.amount,
      recipient: payload.recipient ?? payload.description,
      // Keep sending the legacy key for older backend deployments and API clients.
      description: payload.description ?? payload.recipient,
      reference: payload.reference,
      metadata: payload.metadata,
      sourceLinks: payload.sourceLinks,
      paymentAllocations: payload.paymentAllocations,
      postingKey: payload.postingKey,
    })
  },

  postMoneyOut(payload: MoneyOutPayload): Promise<ApiEnvelope<LedgerEntry>> {
    return api.post(`/api/accounts/${payload.accountId}/money-out`, {
      source: payload.source,
      amount: payload.amount,
      recipient: payload.recipient ?? payload.description,
      description: payload.description ?? payload.recipient,
      reference: payload.reference,
      metadata: payload.metadata,
      payment_context: payload.paymentContext,
      postingKey: payload.postingKey,
      payable_id: payload.payableId,
    })
  },

  postPayableMethodPayment(payload: PayableMethodPaymentPayload): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/accounts/payables/payment', {
      payable_id: payload.payableId,
      payment_method: payload.paymentMethod,
      amount: payload.amount,
      recipient: payload.description,
      description: payload.description,
      reference: payload.reference,
      idempotency_key: payload.idempotencyKey,
      payment_context: payload.paymentContext,
    })
  },

  postPayablePaymentBatch(payload: PayablePaymentBatchPayload): Promise<ApiEnvelope<PayablePaymentBatchResult>> {
    return api.post('/api/accounts/payables/payment-batch', {
      payable_ids: payload.payableIds,
      account_id: payload.accountId,
      amount: payload.amount,
      allocations: payload.allocations,
      payment_method: payload.paymentMethod,
      reference: payload.reference,
      description: payload.description,
      idempotency_key: payload.idempotencyKey,
      payment_context: payload.paymentContext,
    })
  },

  listPaymentMethods(): Promise<ApiEnvelope<PaymentMethodSummary[]>> {
    return api.get('/api/accounts/payment-methods')
  },

  postLoanReceived(payload: LoanMovementPayload): Promise<ApiEnvelope<LedgerEntry>> {
    return api.post(`/api/accounts/${payload.loanAccountId}/loan-received`, {
      amount: payload.amount,
      recipient: payload.recipient ?? payload.description,
      description: payload.description ?? payload.recipient,
      reference: payload.reference,
      postingKey: payload.postingKey,
    })
  },

  postLoanRepayment(payload: LoanMovementPayload): Promise<ApiEnvelope<LedgerEntry>> {
    return api.post(`/api/accounts/${payload.loanAccountId}/loan-repayment`, {
      amount: payload.amount,
      recipient: payload.recipient ?? payload.description,
      description: payload.description ?? payload.recipient,
      reference: payload.reference,
      postingKey: payload.postingKey,
    })
  },

  transfer(payload: TransferPayload): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/accounts/transfer', {
      source_account_id: payload.sourceAccountId,
      destination_account_id: payload.destinationAccountId,
      amount: payload.amount,
      recipient: payload.recipient ?? payload.description,
      description: payload.description ?? payload.recipient,
      reference: payload.reference,
      postingKey: payload.postingKey,
    })
  },

  receiveCheque(payload: ReceiveChequePayload): Promise<ApiEnvelope<LedgerEntry>> {
    return api.post(`/api/accounts/${payload.accountId}/cheques`, {
      amount: payload.amount,
      chequeNumber: payload.chequeNumber,
      drawerName: payload.drawerName,
      bankName: payload.bankName,
      receivedDate: payload.receivedDate,
      expectedClearanceDate: payload.expectedClearanceDate,
      reference: payload.reference,
      recipient: payload.recipient,
      metadata: payload.metadata,
      sourceLinks: payload.sourceLinks,
      postingKey: payload.postingKey,
    })
  },

  listCheques(accountId: string | number, status?: string | string[]): Promise<ApiEnvelope<AccountCheque[]>> {
    return api.get(`/api/accounts/${accountId}/cheques`, {
      params: { status: Array.isArray(status) ? status.join(',') : status || undefined },
    })
  },

  clearCheque(chequeId: string | number, clearedDate?: string): Promise<ApiEnvelope<AccountCheque>> {
    return api.post(`/api/accounts/cheques/${chequeId}/clear`, { clearedDate })
  },

  depositCheque(chequeId: string | number): Promise<ApiEnvelope<AccountCheque>> {
    return api.post(`/api/accounts/cheques/${chequeId}/deposit`)
  },

  bounceCheque(chequeId: string | number, bouncedDate?: string): Promise<ApiEnvelope<AccountCheque>> {
    return api.post(`/api/accounts/cheques/${chequeId}/bounce`, { bouncedDate })
  },

  cancelCheque(chequeId: string | number): Promise<ApiEnvelope<AccountCheque>> {
    return api.post(`/api/accounts/cheques/${chequeId}/cancel`)
  },

  reverseLedgerEntry(accountId: string | number, entryId: string | number): Promise<ApiEnvelope<LedgerEntry>> {
    return api.post(`/api/accounts/${accountId}/ledger/${entryId}/reverse`)
  },
})
