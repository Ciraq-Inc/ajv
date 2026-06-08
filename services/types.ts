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
