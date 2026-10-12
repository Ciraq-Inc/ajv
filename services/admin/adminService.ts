// services/admin/adminService.ts
//
// Admin domain service. All HTTP for admin auth, profile, password reset,
// and admin-user CRUD lives here. Public API: a single factory that takes
// an `api` (the useApi wrapper) and returns a plain object of async
// functions. Stores import the factory, hand it `useApi()`, and call the
// functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself
// reads runtimeConfig and the auth token) so the service stays
// framework-agnostic and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-store fetch calls exactly:
// same paths, same method, same body shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller (the store).

import type {
  ApiInstance,
  ApiEnvelope,
  AdminProfile,
} from '../types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface PasswordResetRequestParams {
  identifier: string;
}

export interface PasswordResetParams {
  token: string;
  newPassword: string;
}

export interface AdminCreateData {
  username: string;
  password: string;
  role: string;
  email?: string;
  [key: string]: unknown;
}

export interface AdminUpdateData {
  username?: string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

export interface MfaTotpVerifyParams {
  challengeId: string;
  code?: string;
  recoveryCode?: string;
}

export const createAdminService = (api: ApiInstance) => ({
  /**
   * Admin login with username + password.
   * POST /api/admin/login (public, no auth header)
   */
  login({ username, password }: LoginParams): Promise<ApiEnvelope<{ token: string; mfa_method?: string; challenge_id?: string }>> {
    return api.post('/api/admin/login', { username, password });
  },

  /**
   * Fetch the current admin profile. Used by the store's token-verify
   * path on session restore.
   * GET /api/admin/profile (auth required)
   */
  getProfile(): Promise<ApiEnvelope<AdminProfile>> {
    return api.get('/api/admin/profile');
  },

  /**
   * Request a password-reset email/SMS for the given identifier
   * (username, email, or phone — server decides).
   * POST /api/admin/forgot-password (public)
   */
  requestPasswordReset({ identifier }: PasswordResetRequestParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/admin/forgot-password', { identifier });
  },

  /**
   * Submit a new password using a previously-issued reset token.
   * POST /api/admin/reset-password (public)
   */
  resetPassword({ token, newPassword }: PasswordResetParams): Promise<ApiEnvelope<null>> {
    return api.post('/api/admin/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  /**
   * List all admin accounts (super_admin only).
   * GET /api/admin/admins
   */
  listAdmins(): Promise<ApiEnvelope<AdminProfile[]>> {
    return api.get('/api/admin/admins');
  },

  /**
   * Create a new admin account (super_admin only).
   * POST /api/admin/admins
   */
  createAdmin(adminData: AdminCreateData): Promise<ApiEnvelope<AdminProfile>> {
    return api.post('/api/admin/admins', adminData);
  },

  /**
   * Update an existing admin (super_admin only).
   * PUT /api/admin/admins/:id
   */
  updateAdmin(adminId: number | string, adminData: AdminUpdateData): Promise<ApiEnvelope<AdminProfile>> {
    return api.put(`/api/admin/admins/${adminId}`, adminData);
  },

  /**
   * Delete an admin (super_admin only).
   * DELETE /api/admin/admins/:id
   */
  deleteAdmin(adminId: number | string): Promise<ApiEnvelope<null>> {
    return api.delete(`/api/admin/admins/${adminId}`);
  },

  /**
   * Verify a TOTP code issued during the admin login MFA challenge.
   * The challenge_id is returned in the 202 body from the login endpoint
   * when `mfa_method === 'totp'`. The `code` is the 6-digit TOTP value
   * (or a recovery code in `recovery_code`).
   * POST /api/auth/mfa/totp/verify
   */
  verifyMfaTotp({ challengeId, code, recoveryCode }: MfaTotpVerifyParams): Promise<ApiEnvelope<{ token: string }>> {
    const body: { challenge_id: string; code?: string; recovery_code?: string } = {
      challenge_id: challengeId,
    };
    if (recoveryCode) {
      body.recovery_code = recoveryCode;
    } else if (code) {
      body.code = code;
    }
    return api.post('/api/auth/mfa/totp/verify', body);
  },

  /**
   * Verify the SMS code sent during the admin login MFA challenge.
   * POST /api/auth/mfa/verify
   */
  verifyMfaSms({ challengeId, code }: { challengeId: string; code: string }): Promise<ApiEnvelope<unknown>> {
    return api.post('/api/auth/mfa/verify', { challenge_id: challengeId, code });
  },

  /**
   * List all customer signups (admin-only).
   * GET /api/admin/signups
   * Returns the raw envelope `{ success, data, message }` — callers read
   * `result.data` for the signup array. Auth header is injected by
   * `useApi` (admin-token fallback for `/api/admin/*` endpoints).
   */
  listSignups(): Promise<ApiEnvelope<unknown[]>> {
    return api.get('/api/admin/signups');
  },

  /**
   * Search customers by name or phone fragment.
   * GET /api/admin/customers?q=<query>
   */
  searchCustomers(q: string): Promise<ApiEnvelope<Array<{ id: string; name: string | null; phone: string; is_active: boolean; phone_verified: boolean }>>> {
    return api.get('/api/admin/customers', { params: { q } });
  },

  /**
   * Create a new customer account.
   * POST /api/admin/customers
   * Returns `{ success, data: { id, name, phone }, message }`.
   * On 409 conflict the server returns `{ success: false, customer_id: X, message }`;
   * the caller must check `result.success` and read `result.customer_id` for that case.
   */
  createCustomer(data: { name: string; phone: string; address?: string }): Promise<ApiEnvelope<{ id: number; name: string; phone: string }> & { customer_id?: number }> {
    return api.post('/api/admin/customers', data) as Promise<ApiEnvelope<{ id: number; name: string; phone: string }> & { customer_id?: number }>;
  },

  /**
   * Place a first order on behalf of a customer.
   * POST /api/admin/order-requests/on-behalf
   */
  placeOrderOnBehalf(data: {
    customer_id: number;
    items: Array<{ name: string; quantity: number; unit?: string }>;
    address?: string;
    notes?: string;
  }): Promise<ApiEnvelope<{ request_number: string }>> {
    return api.post('/api/admin/order-requests/on-behalf', data);
  },
});
