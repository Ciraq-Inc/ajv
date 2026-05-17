// stores/admin.ts — Admin Authentication Store (JS → TS migration)
//
// Manages the admin (back-office) session. Holds the token, admin profile,
// and authentication state. All HTTP delegates to the service layer via
// factory accessors. Public method names and return shapes are preserved
// 1:1 — no caller changes needed.
//
// The legacy `makeAuthRequest(endpoint, options)` action is kept because
// ~9 components/pages outside this PR's scope still call it directly.
// Migrating those callers onto per-domain services is tracked as a
// follow-up.

import { defineStore } from 'pinia';
import { createAdminService } from '~/services/admin/adminService';
import { createWebAuthnService } from '~/services/admin/webAuthnService';
import { createWebAuthnRegistrationService } from '~/services/admin/webAuthnRegistrationService';
import type { AdminProfile } from '~/services/types';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type AdminRole =
  | 'data_consumer'
  | 'business_analyst'
  | 'order_processor'
  | 'support_agent'
  | 'auditor'
  | 'manager'
  | 'admin'
  | 'super_admin';

const ROLE_HIERARCHY: Record<string, number> = {
  data_consumer: 0,
  business_analyst: 1,
  order_processor: 2,
  support_agent: 3,
  auditor: 4,
  manager: 5,
  admin: 6,
  super_admin: 6,
};

export interface AdminState {
  admin: AdminProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Successful full-auth result. */
export interface LoginSuccess {
  success: true;
  message?: string | undefined;
}

/** MFA challenge — caller must show the appropriate input. */
export interface LoginMfaChallenge {
  success: false;
  mfaRequired: true;
  mfaMethod: 'sms' | 'totp' | 'webauthn' | string;
  challengeId: string;
  phoneHint: string | null;
}

/** Bad credentials / server error. */
export interface LoginFailure {
  success: false;
  mfaRequired?: false;
  message: string;
}

export type LoginResult = LoginSuccess | LoginMfaChallenge | LoginFailure;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    admin: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    getAdmin: (state): AdminProfile | null => state.admin,

    isAdminAuthenticated: (state): boolean => state.isAuthenticated,

    getRole: (state): string | null => state.admin?.role ?? null,

    isSuperAdmin: (state): boolean =>
      state.admin?.role != null &&
      ['super_admin', 'admin'].includes(state.admin.role),

    getDashboardRoute: (state): string => {
      if (state.admin?.role === 'data_consumer') {
        return '/dataconsumer/dashboard';
      }
      return '/admin/data';
    },

    hasRole:
      (state) =>
      (requiredRole: string): boolean => {
        const adminLevel = ROLE_HIERARCHY[state.admin?.role ?? ''] ?? 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
        return adminLevel >= requiredLevel;
      },
  },

  actions: {
    // -------------------------------------------------------------------
    // Service factory accessors
    // -------------------------------------------------------------------

    _adminService() {
      return createAdminService(useApi());
    },

    _webAuthnService() {
      return createWebAuthnService(useApi());
    },

    _webAuthnRegistrationService() {
      return createWebAuthnRegistrationService(useApi());
    },

    // -------------------------------------------------------------------
    // Auth
    // -------------------------------------------------------------------

    /**
     * Login admin.
     *
     * Returns one of three shapes:
     *   { success: true }                               — fully authenticated
     *   { success: false, mfaRequired: true, … }        — MFA step needed
     *   { success: false, message }                     — bad credentials
     */
    async login(username: string, password: string): Promise<LoginResult> {
      this.isLoading = true;

      try {
        const data = await this._adminService().login({ username, password });

        // MFA challenge: backend returns 202 with mfa_required:true.
        const raw = data as typeof data & {
          mfa_required?: boolean;
          mfa_method?: string;
          challenge_id?: string;
          phone_hint?: string | null;
        };

        if (raw.mfa_required) {
          return {
            success: false,
            mfaRequired: true,
            mfaMethod: raw.mfa_method ?? 'sms',
            challengeId: raw.challenge_id ?? '',
            phoneHint: raw.phone_hint ?? null,
          };
        }

        if (data.success) {
          const payload = data.data as { token: string; admin?: AdminProfile };
          this.token = payload.token;
          this.admin = payload.admin ?? null;
          this.isAuthenticated = true;

          if (process.client) {
            localStorage.setItem('adminToken', payload.token);
            localStorage.setItem('adminUser', JSON.stringify(payload.admin));
          }

          return { success: true as const, ...(data.message !== undefined ? { message: data.message } : {}) };
        } else {
          return { success: false as const, message: data.message ?? 'Login failed.' };
        }
      } catch (error: unknown) {
        console.error('Login error:', error);
        return { success: false as const, message: 'Login failed. Please try again.' };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Verify a TOTP code during the admin login MFA challenge.
     * On success sets the session identical to a direct login.
     */
    async verifyMfaTotp({
      challengeId,
      code,
    }: {
      challengeId: string;
      code?: string;
    }): Promise<LoginSuccess | LoginFailure> {
      this.isLoading = true;
      try {
        const totpParams: import('~/services/admin/adminService').MfaTotpVerifyParams = { challengeId };
        if (code !== undefined) totpParams.code = code;
        const data = await this._adminService().verifyMfaTotp(totpParams);

        if (data.success) {
          const payload = data.data as { token: string; admin?: AdminProfile };
          this.token = payload.token;
          this.admin = payload.admin ?? null;
          this.isAuthenticated = true;

          if (process.client) {
            localStorage.setItem('adminToken', payload.token);
            localStorage.setItem('adminUser', JSON.stringify(payload.admin));
          }

          return { success: true as const, ...(data.message !== undefined ? { message: data.message } : {}) };
        } else {
          return {
            success: false as const,
            message: data.message ?? 'Verification failed.',
          };
        }
      } catch (error: unknown) {
        console.error('TOTP verify error:', error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Verification failed. Please try again.',
        };
      } finally {
        this.isLoading = false;
      }
    },

    logout(): void {
      this.token = null;
      this.admin = null;
      this.isAuthenticated = false;

      if (process.client) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    },

    async restoreSession(): Promise<boolean> {
      if (process.client) {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminUser');

        if (token && adminData) {
          try {
            this.token = token;
            this.admin = JSON.parse(adminData) as AdminProfile;

            const isValid = await this.verifyToken();

            if (isValid) {
              this.isAuthenticated = true;
              return true;
            } else {
              this.logout();
              return false;
            }
          } catch (error: unknown) {
            console.error('Session restoration error:', error);
            this.logout();
            return false;
          }
        }
      }
      return false;
    },

    async verifyToken(): Promise<boolean> {
      if (!this.token) return false;

      try {
        const data = await this._adminService().getProfile();

        if (data.success) {
          this.admin = data.data;
          return true;
        } else {
          return false;
        }
      } catch (error: unknown) {
        console.error('Token verification error:', error);
        return false;
      }
    },

    // Legacy public helper retained for external callers — see file-top note.
    async makeAuthRequest(endpoint: string, options: Record<string, unknown> = {}): Promise<unknown> {
      if (!this.token) {
        throw new Error('No authentication token available');
      }

      try {
        return await this._adminService().request(endpoint, options);
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Auth request error:', error);
        throw error;
      }
    },

    async getAllAdmins(): Promise<unknown> {
      try {
        return await this._adminService().listAdmins();
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error fetching admins:', error);
        throw error;
      }
    },

    async createAdmin(adminData: Record<string, unknown>): Promise<unknown> {
      try {
        return await this._adminService().createAdmin({
          username: String(adminData['username'] ?? ''),
          password: String(adminData['password'] ?? ''),
          role: String(adminData['role'] ?? ''),
          ...adminData,
        });
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error creating admin:', error);
        throw error;
      }
    },

    async updateAdmin(adminId: number | string, adminData: Record<string, unknown>): Promise<unknown> {
      try {
        return await this._adminService().updateAdmin(adminId, adminData);
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error updating admin:', error);
        throw error;
      }
    },

    async deleteAdmin(adminId: number | string): Promise<unknown> {
      try {
        return await this._adminService().deleteAdmin(adminId);
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error deleting admin:', error);
        throw error;
      }
    },

    async requestPasswordReset(identifier: string): Promise<LoginSuccess | LoginFailure> {
      try {
        const data = await this._adminService().requestPasswordReset({ identifier });

        if (data.success) {
          return { success: true as const, ...(data.message !== undefined ? { message: data.message } : {}) };
        } else {
          return { success: false as const, message: data.message ?? 'Failed to send reset instructions.' };
        }
      } catch (error: unknown) {
        console.error('Password reset request error:', error);
        return { success: false as const, message: 'Failed to send reset instructions. Please try again.' };
      }
    },

    async resetPassword(token: string, newPassword: string): Promise<LoginSuccess | LoginFailure> {
      try {
        const data = await this._adminService().resetPassword({ token, newPassword });

        if (data.success) {
          return { success: true as const, ...(data.message !== undefined ? { message: data.message } : {}) };
        } else {
          return { success: false as const, message: data.message ?? 'Failed to reset password.' };
        }
      } catch (error: unknown) {
        console.error('Password reset error:', error);
        return { success: false as const, message: 'Failed to reset password. Please try again.' };
      }
    },

    // -------------------------------------------------------------------
    // WebAuthn login completion
    // -------------------------------------------------------------------

    async getWebAuthnAuthOptions(username: string): Promise<unknown> {
      try {
        return await this._webAuthnService().getAuthenticationOptions(username);
      } catch (error: unknown) {
        console.error('WebAuthn options error:', error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'Failed to get passkey options.',
        };
      }
    },

    async verifyWebAuthnAuth(
      challengeId: string,
      assertionResponse: unknown,
    ): Promise<LoginSuccess | LoginFailure> {
      this.isLoading = true;
      try {
        const data = await this._webAuthnService().verifyAuthentication(
          challengeId,
          assertionResponse,
        );

        if (data.success) {
          const payload = data.data as {
            token?: string;
            user?: AdminProfile | Record<string, unknown>;
          };

          this.token = payload.token ?? null;
          this.admin = (payload.user as AdminProfile | null) ?? null;
          this.isAuthenticated = true;

          if (process.client) {
            localStorage.setItem('adminToken', payload.token ?? '');
            localStorage.setItem('adminUser', JSON.stringify(payload.user));
          }

          return { success: true };
        } else {
          return {
            success: false,
            message: data.message ?? 'Passkey verification failed.',
          };
        }
      } catch (error: unknown) {
        console.error('WebAuthn verify error:', error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Passkey verification failed. Please try again.',
        };
      } finally {
        this.isLoading = false;
      }
    },

    // -------------------------------------------------------------------
    // WebAuthn credential management
    // -------------------------------------------------------------------

    async listWebAuthnCredentials(): Promise<unknown> {
      try {
        return await this._webAuthnRegistrationService().listCredentials();
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('List WebAuthn credentials error:', error);
        throw error;
      }
    },

    async getWebAuthnRegistrationOptions(): Promise<unknown> {
      try {
        return await this._webAuthnRegistrationService().getRegistrationOptions();
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('WebAuthn registration options error:', error);
        throw error;
      }
    },

    async verifyWebAuthnRegistration(
      challengeId: string,
      attestationResponse: unknown,
      friendlyName: string,
    ): Promise<unknown> {
      try {
        return await this._webAuthnRegistrationService().verifyRegistration(
          challengeId,
          attestationResponse,
          friendlyName,
        );
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('WebAuthn registration verify error:', error);
        throw error;
      }
    },

    async deleteWebAuthnCredential(id: number | string): Promise<unknown> {
      try {
        return await this._webAuthnRegistrationService().deleteCredential(id);
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && err.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Delete WebAuthn credential error:', error);
        throw error;
      }
    },
  },
});
