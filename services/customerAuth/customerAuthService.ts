// services/customerAuth/customerAuthService.ts
//
// Customer auth domain service. All HTTP for the master-customer auth
// flows on `/api/auth/customer/*` lives here. Public API: a single
// factory that takes an `api` (the useApi wrapper) and returns a plain
// object of async functions.
//
// IMPORTANT: This service is pure HTTP. It does NOT persist tokens,
// mutate Pinia state, or call `applyCustomerAuthPayload`. Those
// side-effects belong to the store.

import type {
  ApiInstance,
  ApiEnvelope,
  CustomerProfile,
  LinkedCompany,
  LocationSuggestion,
  ReverseGeocodeResult,
} from '../types';

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

export interface RegisterParams {
  companyId?: number | string | null;
  fname: string;
  lname: string;
  phone: string;
  password: string;
  email?: string;
  otp?: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface SwitchCompanyParams {
  companyId: number | string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface SendResetOtpParams {
  phone: string;
}

export interface ResetPasswordParams {
  phone: string;
  otp: string;
  newPassword: string;
}

export interface AutocompleteLocationParams {
  q?: string;
  limit?: number | string;
}

export interface ReverseGeocodeParams {
  lat?: number | string;
  lng?: number | string;
}

export interface AuthPayload {
  token: string;
  customer: CustomerProfile;
  companies?: LinkedCompany[];
}

export const createCustomerAuthService = (api: ApiInstance) => ({
  /**
   * Check whether a phone number is already registered / verified.
   * POST /api/auth/customer/check-phone
   */
  checkPhone({ phone }: CheckPhoneParams): Promise<ApiEnvelope<{ registered: boolean }>> {
    return api.post('/api/auth/customer/check-phone', { phone });
  },

  /**
   * Send a one-time password to a phone number for account setup.
   * POST /api/auth/customer/send-otp
   */
  sendSetupOtp({ phone }: SendOtpParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/auth/customer/send-otp', { phone });
  },

  /**
   * Complete password setup after OTP verification.
   * POST /api/auth/customer/setup-password
   */
  setupPassword({ phone, otp, password }: SetupPasswordParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/auth/customer/setup-password', {
      phone,
      otp,
      password,
    });
  },

  /**
   * Register a new master customer (optionally linked to a company).
   * POST /api/auth/customer/register
   */
  register({ companyId, fname, lname, phone, password, email, otp }: RegisterParams): Promise<ApiEnvelope<AuthPayload>> {
    const body: Record<string, unknown> = { fname, lname, phone, password, email, otp };
    if (companyId !== undefined && companyId !== null) {
      body['company_id'] = companyId;
    }
    return api.post('/api/auth/customer/register', body);
  },

  /**
   * Log in with phone + password.
   * POST /api/auth/customer/login
   */
  login({ phone, password }: LoginParams): Promise<ApiEnvelope<AuthPayload>> {
    return api.post('/api/auth/customer/login', { phone, password });
  },

  /**
   * Fetch the linked companies for the authenticated master customer.
   * GET /api/auth/customer/my-companies
   */
  myCompanies(): Promise<ApiEnvelope<LinkedCompany[]>> {
    return api.get('/api/auth/customer/my-companies');
  },

  /**
   * Trigger server-side linking sweep across companies for this
   * customer. Returns updated companies list in `data.companies`.
   * POST /api/auth/customer/trigger-linking
   */
  triggerLinking(): Promise<ApiEnvelope<{ companies: LinkedCompany[] }>> {
    return api.post('/api/auth/customer/trigger-linking', {});
  },

  /**
   * Switch the active company context server-side. Returns a fresh
   * auth payload with a re-scoped token.
   * POST /api/auth/customer/switch-company
   */
  switchCompany({ companyId }: SwitchCompanyParams): Promise<ApiEnvelope<AuthPayload>> {
    return api.post('/api/auth/customer/switch-company', {
      company_id: companyId,
    });
  },

  /**
   * Fetch the authenticated customer's profile.
   * GET /api/auth/customer/profile
   */
  getProfile(): Promise<ApiEnvelope<CustomerProfile>> {
    return api.get('/api/auth/customer/profile');
  },

  /**
   * Update the authenticated customer's profile. `profileData` is
   * passed through as-is — the server owns the schema.
   * PUT /api/auth/customer/profile
   */
  updateProfile(profileData: Partial<CustomerProfile> & Record<string, unknown>): Promise<ApiEnvelope<CustomerProfile>> {
    return api.put('/api/auth/customer/profile', profileData);
  },

  /**
   * Change the authenticated customer's password.
   * POST /api/auth/customer/change-password
   */
  changePassword({ currentPassword, newPassword }: ChangePasswordParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/auth/customer/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Send a password-reset OTP to the given phone number.
   * POST /api/auth/customer/forgot-password
   */
  sendResetOtp({ phone }: SendResetOtpParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/auth/customer/forgot-password', { phone });
  },

  /**
   * Reset password using OTP delivered to phone.
   * POST /api/auth/customer/reset-password
   */
  resetPassword({ phone, otp, newPassword }: ResetPasswordParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/auth/customer/reset-password', {
      phone,
      otp,
      new_password: newPassword,
    });
  },

  /**
   * Autocomplete address suggestions for the saved-location flow.
   * GET /api/auth/customer/autocomplete-location?q=&limit=
   */
  autocompleteLocation({ q, limit }: AutocompleteLocationParams = {}): Promise<ApiEnvelope<LocationSuggestion[]>> {
    const params: Record<string, string | number> = {};
    if (q !== undefined && q !== null) params['q'] = q;
    if (limit !== undefined && limit !== null) params['limit'] = limit;
    return api.get('/api/auth/customer/autocomplete-location', { params });
  },

  /**
   * Reverse-geocode GPS coordinates into a human-readable address.
   * GET /api/auth/customer/reverse-geocode?lat=&lng=
   */
  reverseGeocode({ lat, lng }: ReverseGeocodeParams = {}): Promise<ApiEnvelope<ReverseGeocodeResult>> {
    const params: Record<string, string | number> = {};
    if (lat !== undefined && lat !== null) params['lat'] = lat;
    if (lng !== undefined && lng !== null) params['lng'] = lng;
    return api.get('/api/auth/customer/reverse-geocode', { params });
  },

  applyForProfessional(payload: ProfessionalApplicationPayload): Promise<ApiEnvelope<{ status: string }>> {
    return api.post('/api/professionals/customer/apply', payload);
  },

  getMyProfessionalApplication(): Promise<ApiEnvelope<ProfessionalProfile | null>> {
    return api.get('/api/professionals/customer/application');
  },
});

export interface ProfessionalApplicationPayload {
  profession_type: 'doctor' | 'pharmacist' | 'nurse' | 'other';
  license_number: string;
  license_body?: string | null;
}

export interface ProfessionalProfile {
  id?: number;
  profession_type?: string | null;
  license_number?: string | null;
  license_body?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}
