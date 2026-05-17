// services/companyAuth/companyAuthService.ts
//
// Company auth domain service. All HTTP for the company-portal auth
// flows on `/api/company-auth/*` plus the authenticated
// company-store-settings GET (used by the company-theme bootstrap)
// lives here. Public API: a factory that takes an `api` (the useApi
// wrapper) and a `getHeaders` provider (so callers can inject the
// `x-company-domain` header that `useApi` does not own) and returns a
// plain object of async functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the company token) so the service stays
// framework-agnostic and trivially mockable in tests. The `getHeaders`
// callback is invoked per request so the `x-company-domain` header
// reflects the *current* URL at call time.
//
// IMPORTANT: This service is pure HTTP. It does NOT persist tokens,
// mutate Pinia state, or perform phone-number normalization.

import type { ApiInstance, ApiEnvelope, CompanyUserProfile, LinkedCompany, StoreSettings, Company } from '../types';

export interface CheckPhoneParams {
  phone: string;
}

export interface SendOtpParams {
  phone: string;
}

export interface SetupPasswordParams {
  phone: string;
  otp: string;
  password: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface RequestPasswordResetParams {
  phone: string;
}

export interface ResetPasswordParams {
  phone: string;
  otp: string;
  newPassword: string;
}

/** Extra headers injected per-request (e.g. `x-company-domain`). */
export type HeadersProvider = () => Record<string, string>;

/**
 * Options accepted by api.get/post/put/delete and api.request.
 * Uses a plain Record for headers so our merge is type-safe under
 * exactOptionalPropertyTypes (RequestInit.headers is HeadersInit which
 * includes [string,string][] — not assignable to Record<string,string>).
 */
interface ApiOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  method?: string;
  body?: BodyInit | null;
  [key: string]: unknown;
}

export const createCompanyAuthService = (api: ApiInstance, getHeaders: HeadersProvider = () => ({})) => {
  const withHeaders = (options: ApiOptions = {}): ApiOptions => ({
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers ?? {}),
    },
  });

  return {
    /**
     * Check whether a phone number is already registered for the
     * current company.
     * POST /api/company-auth/check-phone
     */
    checkPhone({ phone }: CheckPhoneParams): Promise<ApiEnvelope<{ registered: boolean }>> {
      return api.post('/api/company-auth/check-phone', { phone }, withHeaders());
    },

    /**
     * Send a one-time password to a phone number for account setup.
     * POST /api/company-auth/send-otp
     */
    sendOtp({ phone }: SendOtpParams): Promise<ApiEnvelope<null>> {
      return api.post('/api/company-auth/send-otp', { phone }, withHeaders());
    },

    /**
     * Complete password setup after OTP verification.
     * POST /api/company-auth/setup-password
     */
    setupPassword({ phone, otp, password }: SetupPasswordParams): Promise<ApiEnvelope<null>> {
      return api.post(
        '/api/company-auth/setup-password',
        { phone, otp, password },
        withHeaders()
      );
    },

    /**
     * Log in with phone + password (company portal).
     * POST /api/company-auth/login
     */
    login({ phone, password }: LoginParams): Promise<ApiEnvelope<{ token: string; user: CompanyUserProfile }>> {
      return api.post('/api/company-auth/login', { phone, password }, withHeaders());
    },

    /**
     * Register a recruiter + create the backing company in one shot.
     * Public endpoint — `getHeaders()` returns no Authorization token
     * pre-signup, so we still hit it with `withHeaders()` for
     * `x-company-domain` (when present).
     * POST /api/company-auth/recruiter-signup
     */
    recruiterSignup(payload: Record<string, unknown>): Promise<ApiEnvelope<{ token: string; company: Company }>> {
      return api.post('/api/company-auth/recruiter-signup', payload, withHeaders());
    },

    /**
     * Fetch the authenticated company user's profile.
     * GET /api/company-auth/profile
     */
    getProfile(): Promise<ApiEnvelope<CompanyUserProfile>> {
      return api.get('/api/company-auth/profile', withHeaders());
    },

    /**
     * Change the authenticated company user's password.
     * POST /api/company-auth/change-password
     */
    changePassword({ currentPassword, newPassword }: ChangePasswordParams): Promise<ApiEnvelope<null>> {
      return api.post(
        '/api/company-auth/change-password',
        { current_password: currentPassword, new_password: newPassword },
        withHeaders()
      );
    },

    /**
     * Send a password-reset OTP to the given phone number.
     * POST /api/company-auth/request-password-reset
     */
    requestPasswordReset({ phone }: RequestPasswordResetParams): Promise<ApiEnvelope<null>> {
      return api.post(
        '/api/company-auth/request-password-reset',
        { phone },
        withHeaders()
      );
    },

    /**
     * Reset password using OTP delivered to phone.
     * POST /api/company-auth/reset-password
     */
    resetPassword({ phone, otp, newPassword }: ResetPasswordParams): Promise<ApiEnvelope<null>> {
      return api.post(
        '/api/company-auth/reset-password',
        { phone, otp, new_password: newPassword },
        withHeaders()
      );
    },

    /**
     * Fetch a company's public store-settings (theme preset / color).
     * Used by the company-portal theme bootstrap.
     * GET /api/companies/:companyId/store-settings
     */
    getStoreSettings(companyId: number | string): Promise<ApiEnvelope<StoreSettings>> {
      return api.get(`/api/companies/${companyId}/store-settings`, withHeaders());
    },

    /**
     * List all companies (public — no auth required). Used by
     * PharmacySelection and the admin CompanyStoreSettings component.
     * GET /api/companies
     */
    listCompanies(): Promise<ApiEnvelope<Company[]>> {
      return api.get('/api/companies');
    },

    /**
     * Generic authenticated request used by the legacy
     * `companyStore.makeAuthRequest(url, options)` helper. Thin
     * passthrough to `useApi`. Tracked as a follow-up to migrate those
     * callers onto per-domain services so this generic helper can be
     * deleted entirely.
     */
    request(endpoint: string, options: ApiOptions = {}): Promise<unknown> {
      return api.request(endpoint, withHeaders(options));
    },
  };
};
