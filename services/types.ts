/**
 * services/types.ts
 *
 * Single source of truth for types shared across all service files.
 *
 * Conventions:
 *  - `ApiEnvelope<T>` mirrors the backend's standard `{ success, data, message }`
 *    wrapper.  Services return `Promise<ApiEnvelope<T>>`; callers (stores/pages)
 *    branch on `result.success` / read `result.data`.
 *  - Domain interfaces only list fields actually used by service call-sites or
 *    documented in JSDoc comments on the legacy JS.  Unknown extra fields from
 *    the server are acceptable because the envelope data is `T` — strict callers
 *    should narrow further.
 *  - `ApiInstance` is derived from `useApi` return type so the factory parameter
 *    is always in sync with the composable without manual duplication.
 */

// ---------------------------------------------------------------------------
// Core envelope + API instance
// ---------------------------------------------------------------------------

/** Standard backend response envelope. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * The object returned by `useApi()`.  Services receive this as their `api`
 * parameter.  Explicitly re-exported from the composable so both services and
 * pages always reference the same interface without duplication.
 */
export type { ApiInstance } from '~/composables/useApi';

// ---------------------------------------------------------------------------
// Auth / identity
// ---------------------------------------------------------------------------

export interface AdminProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface MfaTotpVerifyBody {
  challenge_id: string;
  code?: string;
  recovery_code?: string;
}

export interface CustomerProfile {
  id: number;
  fname: string;
  lname: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface CompanyUserProfile {
  id: number;
  phone: string;
  company_id: number;
  role: string;
  created_at: string;
}

export interface LinkedCompany {
  id: number;
  name: string;
  domain_name: string;
}

// ---------------------------------------------------------------------------
// Company / pharmacy
// ---------------------------------------------------------------------------

export interface Company {
  id: number;
  name: string;
  domain_name: string;
  tel1?: string;
  tel2?: string;
  uiid?: string;
  whatsapp_number?: string;
  sender_id?: string;
  logo?: string;
  shop_banner?: string;
}

export interface StoreSettings {
  id: number;
  company_id: number;
  theme_preset?: string;
  primary_color?: string;
  hide_prices?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  brand_name: string;
  unit?: string;
  sell_unit?: string;
  selling_price: number;
  stock_qty: number;
  is_active?: boolean;
  imageUrl?: string;
  company_id: number;
}

/** A drug classification carried by a company's stocked products (master_products link). */
export interface ProductClassification {
  id: number;
  name: string;
  product_count: number;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  company_id: number;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Order requests
// ---------------------------------------------------------------------------

export interface OrderRequest {
  id: number;
  customer_id: number;
  status: string;
  created_at: string;
}

export interface OrderRequestStats {
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  // Alternative field names sent by some API versions
  pending_count?: number;
  processing?: number;
  processing_count?: number;
  completed?: number;
  completed_count?: number;
  total_requests?: number;
  [key: string]: unknown;
}

export interface PharmacyLedgerEntry {
  pharmacy_id: number;
  date: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export type AccountType = 'cash' | 'bank' | 'mobile_money' | 'pos' | 'petty_cash' | 'loan';
export type MoneyInSource = 'sales' | 'credit_payment' | 'cheque' | 'manual';
export type MoneyOutSource = 'expense' | 'withdrawal' | 'supplier_payment' | 'transfer' | 'charges';
export type LoanMovementSource = 'loan_received' | 'loan_repayment';
export type LedgerSource = MoneyInSource | MoneyOutSource | LoanMovementSource | 'reversal';
export type LedgerDirection = 'in' | 'out';

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  branch: string;
  status: 'active' | 'inactive';
  openingBalance: number;
  currentBalance: number;
  moneyIn: number;
  moneyOut: number;
  lastMovementAt: string;
  pendingReview: number;
  description: string;
  metadata?: Record<string, string>;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  date: string;
  reference: string;
  /** Business-facing ledger label; legacy API responses may only provide description. */
  recipient: string;
  /** @deprecated Use recipient for new ledger workflows. */
  description: string;
  source: LedgerSource;
  direction: LedgerDirection;
  method: string;
  moneyIn: number;
  moneyOut: number;
  runningBalance: number;
  enteredBy: string;
  status: 'posted' | 'pending' | 'reversed';
  sourceLinks?: AccountSourceLink[];
  paymentAllocations?: PaymentAllocation[];
  metadata?: Record<string, string>;
  paymentContext?: PayablePaymentContext | null;
}

export interface PaymentAllocation {
  methodId: string;
  methodKey: string;
  methodName: string;
  /** Optional: mixed credits record the selected methods without forcing a split. */
  amount?: number;
}

export interface PayableLedgerEntry {
  id: string;
  accountId: string;
  accountName: string;
  accountType: string;
  paymentMethod?: string;
  batchId?: string;
  date: string;
  reference: string;
  description: string;
  invoiceId: string;
  supplierInvoiceNo: string;
  supplierName: string;
  payableId: string;
  payableSource: 'store' | 'warehouse' | '';
  amount: number;
  invoiceAmount: number;
  paidAmount: number;
  balanceBefore: number;
  balance: number;
  runningBalance: number;
  status: 'posted' | 'pending' | 'reversed';
  paymentActionStatus: 'pending' | 'leased' | 'acknowledged' | 'corroborated' | 'failed' | 'cancelled' | '';
  paymentConfirmationStatus: 'unconfirmed' | 'acknowledged' | 'corroborated' | 'needs_reconciliation' | '';
  payableBalancePesewas: number;
  enteredBy: string;
  paymentContext?: PayablePaymentContext | null;
}

export interface PayableLedgerPagination {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
}

export interface PayableLedgerPage {
  items: PayableLedgerEntry[];
  pagination: PayableLedgerPagination;
  summary: { totalPaid: number };
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  branch: string;
  openingBalance: number;
  metadata?: Record<string, string>;
}

export interface MoneyInPayload {
  accountId: string | number;
  source: MoneyInSource;
  amount: number;
  recipient?: string;
  /** @deprecated Use recipient for new ledger workflows. */
  description?: string;
  reference?: string;
  metadata?: Record<string, string>;
  sourceLinks?: AccountSourceLink[];
  paymentAllocations?: PaymentAllocation[];
  postingKey?: string;
}

export interface MoneyOutPayload {
  accountId: string | number;
  source: MoneyOutSource;
  amount: number;
  recipient?: string;
  /** @deprecated Use recipient for new ledger workflows. */
  description?: string;
  reference?: string;
  metadata?: Record<string, string>;
  paymentContext?: PayablePaymentContextInput;
  payableId?: string;
  postingKey?: string;
}

export type PayablePaymentMethod = 'cash' | 'mobile_money' | 'pos' | 'credit_payment' | 'cheque' | 'other' | (string & {});

export interface PaymentMethodSubtype {
  id: string;
  methodId: string;
  name: string;
  description: string;
  field1: string;
  field2: string;
  field3: string;
  allowField1: boolean;
  allowField2: boolean;
  allowField3: boolean;
  isActive: boolean;
}

export interface PaymentDetailField {
  key: string;
  label: string;
  value: string;
}

export interface PayablePaymentContext {
  methodId: string;
  methodKey: string;
  methodName: string;
  subtypeId: string;
  subtypeName: string;
  fields: PaymentDetailField[];
}

export interface PayablePaymentContextInput {
  methodId?: string;
  methodKey: string;
  methodName?: string;
  subtypeId?: string;
  subtypeName?: string;
  details?: Record<string, string>;
}

export interface PayableMethodPaymentPayload {
  payableId: string | number;
  paymentMethod: PayablePaymentMethod;
  paymentContext?: PayablePaymentContextInput;
  amount: number;
  description?: string;
  reference?: string;
  /** Browser-minted UUID for the payment intent; resent unchanged on retries. */
  idempotencyKey?: string;
}

export interface CreditGuideMethod {
  id: string;
  name: string;
  description: string;
  value: string;
  methodKey: string;
  hasSubtypes: boolean;
  isActive: boolean;
  isSystem: boolean;
  subtypes: Array<{
    id: string;
    methodId: string;
    name: string;
    description: string;
    field1: string;
    field2: string;
    field3: string;
    allowField1: boolean;
    allowField2: boolean;
    allowField3: boolean;
    isActive: boolean;
  }>;
  method: string;
  amount: number;
  entries: number;
  lastSyncedAt: string;
}

export interface PayablePaymentBatchPayload {
  payableIds: Array<string | number>;
  accountId: string | number;
  amount: number;
  allocations: Array<{
    payableId: string | number;
    amount: number;
  }>;
  paymentMethod?: PayablePaymentMethod;
  paymentContext?: PayablePaymentContextInput;
  reference?: string;
  description?: string;
  idempotencyKey?: string;
}

export interface PayablePaymentBatchResult {
  batchId: string;
  supplierId: string;
  supplierName: string;
  accountId: string;
  paymentMethod: string;
  paymentContext?: PayablePaymentContext | null;
  totalAmount: number;
  invoiceCount: number;
  reference: string;
  description: string;
  status: string;
  idempotentReplay?: boolean;
  payments?: unknown[];
}

export interface PaymentMethodSummary {
  id: string;
  name: string;
  description: string;
  value: string;
  methodKey: string;
  hasSubtypes: boolean;
  isActive: boolean;
  isSystem: boolean;
  lastSyncedAt?: string | null;
  subtypes: PaymentMethodSubtype[];
}

export interface CreditGuide {
  fromDate: string;
  toDate: string;
  totalAmount: number;
  lastSyncedAt: string;
  paymentMethodsConfigured?: boolean;
  /** Settled customer-credit repayments from RigelOS for the selected dates. */
  settledCreditPayments?: {
    amount: number;
    entries: number;
    lastSyncedAt: string;
  };
  methods: CreditGuideMethod[];
}

export interface LoanMovementPayload {
  loanAccountId: string | number;
  amount: number;
  recipient?: string;
  /** @deprecated Use recipient for new ledger workflows. */
  description?: string;
  reference?: string;
  /** Browser-minted id for the loan movement; resent unchanged on retries. */
  postingKey?: string;
}

export interface TransferPayload {
  sourceAccountId: string | number;
  destinationAccountId: string | number;
  amount: number;
  recipient?: string;
  /** @deprecated Use recipient for new ledger workflows. */
  description?: string;
  reference?: string;
  postingKey?: string;
}

export type ChequeStatus = 'received' | 'deposited' | 'cleared' | 'bounced' | 'cancelled';

export interface AccountCheque {
  id: string;
  accountId: string;
  ledgerEntryId: string;
  chequeNumber: string;
  drawerName: string;
  bankName: string;
  amount: number;
  receivedDate: string;
  expectedClearanceDate: string;
  status: ChequeStatus;
  clearedDate: string;
  bouncedDate: string;
  reference: string;
}

export interface ReceiveChequePayload {
  accountId: string | number;
  amount: number;
  chequeNumber: string;
  recipient?: string;
  drawerName?: string;
  bankName?: string;
  receivedDate?: string;
  expectedClearanceDate?: string;
  reference?: string;
  metadata?: Record<string, string>;
  sourceLinks?: AccountSourceLink[];
  postingKey?: string;
}

export interface PayableSummary {
  id: string;
  source: 'store' | 'warehouse';
  invoiceId: string;
  orderId: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNo: string;
  invoiceAmountPesewas: number;
  amountPaidPesewas: number;
  balancePesewas: number;
  lastConfirmedPaidPesewas: number;
  paymentMethod: string;
  paymentStatus: string;
  invoiceDate?: string | null;
  syncStatus: 'current' | 'needs_reconciliation';
  paymentConfirmationStatus: 'unconfirmed' | 'acknowledged' | 'corroborated' | 'needs_reconciliation';
  paymentActionStatus?: 'pending' | 'leased' | 'acknowledged' | 'corroborated' | 'failed' | 'cancelled' | '';
  paymentActionAmountPesewas?: number;
  paymentActionCreatedAt?: string | null;
  lifecycle: 'to_pay' | 'awaiting' | 'settled' | 'attention';
  reconciliationReason: string;
  recordedBy: string;
  sourceUpdatedAt?: string | null;
  lastSnapshotAt?: string | null;
  dueDate?: string | null;
}

export interface PayableSupplierOption {
  supplierId: string;
  supplierName: string;
  invoiceCount: number;
  openInvoiceCount: number;
  outstandingPesewas: number;
}

export interface PayablePagination {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
}

export interface PayableCounts {
  toPay: number;
  awaiting: number;
  settled: number;
  attention: number;
}

export interface PayableSummaryTotals {
  outstandingPesewas: number;
  awaitingPesewas: number;
  awaitingCount: number;
  pendingActionPesewas?: number;
  overduePesewas: number;
  dueThisWeekPesewas: number;
}

export interface PayablesPage {
  items: PayableSummary[];
  pagination: PayablePagination;
  counts: PayableCounts;
  summary: PayableSummaryTotals;
}

export interface PayablePaymentDetailField {
  key: string;
  label: string;
  value: string;
}

export interface PayablePaymentEntry {
  id: string;
  payableId: string;
  supplierName: string | null;
  supplierInvoiceNo: string | null;
  dueDate: string | null;
  paymentMethod: string;
  paymentMethodName: string;
  amount: number;
  amountPesewas: number;
  postedAt: string;
  enteredBy: string | null;
  reference: string | null;
  fields: PayablePaymentDetailField[];
  details: Record<string, string>;
}

export interface PayablePaymentsPage {
  payments: PayablePaymentEntry[];
}

export interface CreditCandidate {
  id: string;
  label: string;
  amount: number;
  sourceAmount?: number;
  alreadyPosted?: number;
  availableAmount?: number;
  reference: string;
  description: string;
  context?: string;
  secondary?: string;
  paymentMethod?: string;
  cashierId?: string;
  cashierName?: string;
  shiftId?: string;
  shiftName?: string;
  branchId?: string;
  branchName?: string;
  chequeNumber?: string;
  bankName?: string;
  drawerName?: string;
  paymentBreakdown?: Array<{ method: string; amount: number }>;
  saleIds?: string[];
  sourceKeys?: string[];
  sourceLinks?: AccountSourceLink[];
  metadata?: Record<string, string>;
}

export interface AccountSourceLink {
  sourceType: 'sale_payment' | 'credit_payment';
  sourceKey: string;
  sourceId?: string;
  amount: number;
}

export interface CreditCandidateFilters {
  branchId?: string;
  cashierId?: string;
  shiftId?: string;
  paymentMethod?: string;
  groupBy?: 'total' | 'cashier' | 'shift' | 'cheque';
}

export interface CreditCandidateResponse {
  source: 'sales' | 'credit_payment' | 'cheque';
  date: string;
  groupBy?: 'total' | 'cashier' | 'shift' | 'cheque';
  filters?: CreditCandidateFilters;
  summary: {
    totalAmount: number;
    totalEntries: number;
    sourceAmount?: number;
    alreadyPosted?: number;
    availableAmount?: number;
    totalAllocations?: number;
  };
  candidates: CreditCandidate[];
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export interface WalletBalance {
  balance: number;
  currency?: string;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  created_at: string;
}

export interface TopUpInitiate {
  authorization_url: string;
  reference: string;
}

export interface TopUpVerify {
  balance: number;
  balance_after: number;
}

// ---------------------------------------------------------------------------
// Ads
// ---------------------------------------------------------------------------

export interface Ad {
  id: number;
  company_id: number;
  title?: string;
  image_url?: string;
  link?: string;
  is_active?: boolean;
  type?: string;
  headline?: string;
  body?: string;
  start_date?: string | null;
  end_date?: string | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Analytics / reports
// ---------------------------------------------------------------------------

export interface CompositeStockValue {
  total_value: number;
  companies: Array<{ company_id: number; stock_value: number }>;
}

export interface TopProduct {
  product_id: number;
  brand_name: string;
  metric_value: number;
}

export interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'expired';
  product_id: number;
  brand_name: string;
  company_id: number;
}

export interface PharmacyTransactionSummary {
  company_id: number;
  company_name: string;
  total_sales: number;
}

export interface QuarterlySummary {
  year: number;
  quarters: Array<{ quarter: number; total: number }>;
}

// ---------------------------------------------------------------------------
// Fee schedules
// ---------------------------------------------------------------------------

export interface FeeTier {
  id: number;
  from_km: number;
  fee_ghs: number;
  label?: string | null;
}

export interface FeeSchedule {
  id: number;
  name: string;
  top_tier_per_km: number;
  max_billable_km: number;
  notes?: string;
  status: 'draft' | 'active' | 'superseded';
  tiers?: FeeTier[];
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export interface Job {
  id: number;
  title: string;
  description?: string;
  company_id: number;
  is_active?: boolean;
  created_at: string;
  status?: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  expiresAt?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  requireResume?: boolean;
  requireCv?: boolean;
  requireCertificates?: boolean;
  companyName?: string;
  companyDomain?: string;
  companyLogo?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface JobSeeker {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  status: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Master products
// ---------------------------------------------------------------------------

export interface MasterProductUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export interface PlatformSetting {
  setting_key: string;
  setting_value: string;
  id?: number;
}

export interface PlatformSettingUpdate {
  key: string;
  value: string;
}

// ---------------------------------------------------------------------------
// SMS credits / billing / campaign
// ---------------------------------------------------------------------------

export interface SmsBalance {
  /** Total / legacy balance field */
  balance: number;
  /** Remaining SMS unit credits */
  sms_balance?: number;
  /** Remaining money balance (GHS) */
  money_balance?: number;
  /** Liquid (unreserved) balance */
  available_balance?: number;
  /** Reserved credits not yet billed */
  reserved_credits?: number;
  credits?: number;
}

export interface SmsTransaction {
  id: number;
  transaction_type: string;
  amount: number;
  created_at: string;
  description?: string | null;
  sms_count?: number | null;
  balance_after?: number | null;
  money_balance_after?: number | null;
  [key: string]: unknown;
}

export interface SmsUsageSummaryRow {
  company_id: number;
  company_name: string;
  message_count: number;
  total_cost: number;
  avg_cost_per_message: number;
  last_activity_at: string;
}

export interface SmsUsageSummary {
  summary: {
    companies_with_activity: number;
    total_messages: number;
    total_cost: number;
  };
  data: SmsUsageSummaryRow[];
  filters?: Record<string, unknown>;
}

export interface SmsStatistics {
  total_sent: number;
  total_failed: number;
  total_cost: number;
}

export interface SmsOverview {
  balance: number;
  total_sent: number;
  total_cost: number;
}

export interface SmsCompanyOverview {
  company_id: number;
  company_name: string;
  balance: number;
}

export interface SmsCampaign {
  id: number;
  name?: string;
  status: string;
  message?: string;
  created_at: string;
  archived_at?: string | null;
  total_recipients?: number | null;
  messages_sent?: number | null;
  messages_failed?: number | null;
  sms_provider?: string | null;
  [key: string]: unknown;
}

export interface SmsCampaignStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface SmsCampaignRecipient {
  id: number;
  phone: string;
  status: string;
}

export interface SmsCampaignLog {
  id: number;
  log_type: string;
  message: string;
  created_at: string;
}

export interface BillingHealth {
  status: string;
  issues: number;
  company_id?: number;
  company_name?: string;
  money_balance?: number | string | null;
  sms_balance?: number | null;
  available_balance?: number | null;
  total_sms_sent?: number | null;
  total_sms_loaded?: number | null;
  unbilled_sent_count?: number | null;
  [key: string]: unknown;
}

export interface BillingIssue {
  id: number;
  company_id: number;
  status: string;
  issue_type: string;
  detected_at?: string | null;
  company_name?: string | null;
  description?: string | null;
  severity?: string | null;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  id: number;
  company_id: number;
  action: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Pharmacy reports
// ---------------------------------------------------------------------------

export interface PharmacyReportStatus {
  canRequestReport: boolean;
  months: Array<{ month: string; status: string }>;
}

export interface PharmacyReportData {
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// SMS settings
// ---------------------------------------------------------------------------

export interface SmsSettings {
  id: number;
  rate: number;
  provider: string;
}

export interface SmsGlobalSettingsUpdate {
  rate?: number;
  provider?: string;
}

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

export interface LocationSuggestion {
  description: string;
  place_id?: string;
}

export interface ReverseGeocodeResult {
  address: string;
  lat: number;
  lng: number;
}
