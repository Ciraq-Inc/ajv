// stores/company.ts — Company User Authentication Store (JS → TS migration)
//
// Pinia store for the company-portal auth domain. Holds reactive auth
// state (user, company, token, OTP/loading/error flags), the
// company-domain resolver, header builder, and per-action side effects
// (token persistence, error surfacing). All HTTP details live in
// `services/companyAuth/companyAuthService.ts`; this store passes
// `useApi()` and a header provider to the factory and delegates each
// call. Phone-number formatting stays in the store (it predates the
// service refactor and existing callers pass raw user input).

import { defineStore } from 'pinia';
import { createCompanyAuthService } from '~/services/companyAuth/companyAuthService';
import type { CompanyUserProfile, Company } from '~/services/types';

// ---------------------------------------------------------------------------
// Local domain types
// ---------------------------------------------------------------------------

export interface CompanyState {
  user: CompanyUserProfile | null;
  company: (Company & { theme_preset?: string; theme_color?: string | null; domain?: string }) | null;
  companyAuthToken: string | null;
  phoneStatus: string | null;
  phoneVerifying: string | null;
  otpSent: boolean;
  isLoading: boolean;
  error: string | null;
  authInitialized: boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCompanyStore = defineStore('company', {
  state: (): CompanyState => ({
    user: null,
    company: null,
    companyAuthToken: null,
    phoneStatus: null,
    phoneVerifying: null,
    otpSent: false,
    isLoading: false,
    error: null,
    authInitialized: false,
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.user && !!state.companyAuthToken,
    currentUser: (state): CompanyUserProfile | null => state.user,
    currentCompany: (state): CompanyState['company'] => state.company,
    userRole: (state): string | null => state.user?.role ?? null,
    userName: (state): string | null =>
      (state.user as (CompanyUserProfile & { name?: string }) | null)?.name ?? null,
    userPhone: (state): string | null => state.user?.phone ?? null,
  },

  actions: {
    formatPhoneNumber(phone: string): string {
      if (!phone) return '';
      let digits = phone.replace(/\D/g, '');
      if (digits.startsWith('0')) {
        digits = '233' + digits.slice(1);
      }
      if (!digits.startsWith('233')) {
        digits = '233' + digits;
      }
      return digits;
    },

    getCompanyDomain(): string | null {
      if (typeof window === 'undefined') return null;

      const pathname = window.location.pathname;
      const match = pathname.match(/\/([^/]+)\/services/);
      if (match?.[1]) {
        return match[1];
      }

      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        return parts[0] ?? null;
      }

      return null;
    },

    getApiHeaders(): Record<string, string> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const companyDomain = this.getCompanyDomain();
      if (companyDomain) {
        headers['x-company-domain'] = companyDomain;
      }

      if (this.companyAuthToken) {
        headers['Authorization'] = `Bearer ${this.companyAuthToken}`;
      }

      return headers;
    },

    // Service factory accessor. Defined as an action (not a getter)
    // so `useApi()` is resolved at call time inside the Nuxt request context.
    _companyAuthService() {
      return createCompanyAuthService(useApi(), () => this.getApiHeaders());
    },

    async checkPhoneStatus(phone: string): Promise<{ status?: string; registered?: boolean }> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().checkPhone({ phone: formattedPhone });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to check phone status');
        }

        this.phoneStatus = (data.data as { status?: string }).status ?? null;
        this.phoneVerifying = formattedPhone;

        return data.data as { status?: string; registered?: boolean };
      } catch (error: unknown) {
        console.error('Error checking phone status:', error);
        this.error = error instanceof Error ? error.message : 'Failed to check phone number';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendOTP(phone: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().sendOtp({ phone: formattedPhone });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to send OTP');
        }

        this.otpSent = true;
        this.phoneVerifying = formattedPhone;

        return data.data;
      } catch (error: unknown) {
        console.error('Error sending OTP:', error);
        this.error = error instanceof Error ? error.message : 'Failed to send verification code';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async setupPassword(phone: string, otp: string, password: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().setupPassword({
          phone: formattedPhone,
          otp,
          password,
        });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to setup password');
        }

        const payload = (data.data as unknown) as {
          user?: CompanyUserProfile;
          company?: CompanyState['company'];
          token?: string;
          refresh_token?: string | null;
        } | null;
        this.user = payload?.user ?? null;
        this.company = payload?.company ?? null;
        this.companyAuthToken = payload?.token ?? null;

        if (process.client && payload?.refresh_token) {
          const domain = this.getCompanyDomain();
          const storageKey = domain ? `company_${domain}` : 'company';
          localStorage.setItem(`${storageKey}_refresh_token`, payload.refresh_token);
        }
        this.persistAuthData();
        this.authInitialized = true;
        this.phoneVerifying = null;
        this.otpSent = false;

        return data.data;
      } catch (error: unknown) {
        console.error('Error setting up password:', error);
        this.error = error instanceof Error ? error.message : 'Failed to setup password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async login(phone: string, password: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().login({
          phone: formattedPhone,
          password,
        });

        if (!data.success) {
          throw new Error(data.message ?? 'Login failed');
        }

        const payload = data.data as {
          user?: CompanyUserProfile;
          company?: CompanyState['company'];
          token?: string;
          refresh_token?: string | null;
        };
        this.user = payload.user ?? null;
        this.company = payload.company ?? null;
        this.companyAuthToken = payload.token ?? null;

        if (process.client && payload.refresh_token) {
          const domain = this.getCompanyDomain();
          const storageKey = domain ? `company_${domain}` : 'company';
          localStorage.setItem(`${storageKey}_refresh_token`, payload.refresh_token);
        }
        this.persistAuthData();
        this.authInitialized = true;
        this.phoneVerifying = null;

        return data.data;
      } catch (error: unknown) {
        console.error('Error logging in:', error);
        this.error = error instanceof Error ? error.message : 'Login failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async recruiterSignup(payload: Record<string, unknown>): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(String(payload['phone'] ?? ''));
        const data = await this._companyAuthService().recruiterSignup({
          ...payload,
          phone: formattedPhone,
        });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to create recruiter account');
        }

        const result = data.data as {
          user?: CompanyUserProfile;
          company?: CompanyState['company'] & { domain?: string; domain_name?: string };
          token?: string;
          refresh_token?: string | null;
        };
        this.user = result.user ?? null;
        this.company = result.company ?? null;
        this.companyAuthToken = result.token ?? null;
        this.authInitialized = true;

        const signupDomain = result.company?.domain ?? result.company?.domain_name ?? null;
        if (process.client && result.refresh_token) {
          const storageKey = signupDomain ? `company_${signupDomain}` : 'company';
          localStorage.setItem(`${storageKey}_refresh_token`, result.refresh_token);
        }
        this.persistAuthData(signupDomain);

        return data.data;
      } catch (error: unknown) {
        console.error('Error creating recruiter account:', error);
        this.error = error instanceof Error ? error.message : 'Failed to create recruiter account';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getProfile(): Promise<CompanyUserProfile> {
      if (!this.isLoggedIn || !this.companyAuthToken) {
        throw new Error('User must be logged in');
      }

      try {
        const data = await this._companyAuthService().getProfile();

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to fetch profile');
        }

        this.user = data.data;

        return data.data;
      } catch (error: unknown) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<unknown> {
      if (!this.isLoggedIn || !this.companyAuthToken) {
        throw new Error('User must be logged in');
      }

      this.isLoading = true;
      try {
        const data = await this._companyAuthService().changePassword({
          currentPassword,
          newPassword,
        });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to change password');
        }

        return data;
      } catch (error: unknown) {
        console.error('Error changing password:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async requestPasswordReset(phone: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().requestPasswordReset({
          phone: formattedPhone,
        });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to request password reset');
        }

        this.phoneVerifying = formattedPhone;
        this.otpSent = true;

        return data;
      } catch (error: unknown) {
        console.error('Error requesting password reset:', error);
        this.error = error instanceof Error ? error.message : 'Failed to request password reset';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async resetPassword(phone: string, otp: string, newPassword: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().resetPassword({
          phone: formattedPhone,
          otp,
          newPassword,
        });

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to reset password');
        }

        this.phoneVerifying = null;
        this.otpSent = false;

        return data;
      } catch (error: unknown) {
        console.error('Error resetting password:', error);
        this.error = error instanceof Error ? error.message : 'Failed to reset password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    persistAuthData(domainOverride: string | null = null): void {
      if (typeof window === 'undefined') return;

      try {
        const companyDomain = domainOverride ?? this.getCompanyDomain();
        const storageKey = companyDomain ? `company_${companyDomain}` : 'company';

        localStorage.setItem(`${storageKey}_user`, JSON.stringify(this.user));
        localStorage.setItem(`${storageKey}_company`, JSON.stringify(this.company));
        localStorage.setItem(`${storageKey}_token`, this.companyAuthToken ?? '');
      } catch (error) {
        console.error('Error persisting auth data:', error);
      }
    },

    async checkAuthState(): Promise<CompanyUserProfile | null> {
      if (typeof window === 'undefined') return null;

      this.isLoading = true;
      try {
        if (this.authInitialized && this.user && this.companyAuthToken) {
          this.isLoading = false;
          return this.user;
        }

        const companyDomain = this.getCompanyDomain();
        const storageKey = companyDomain ? `company_${companyDomain}` : 'company';

        const savedUser = localStorage.getItem(`${storageKey}_user`);
        const savedToken = localStorage.getItem(`${storageKey}_token`);
        const savedCompany = localStorage.getItem(`${storageKey}_company`);

        if (savedUser && savedToken) {
          this.user = JSON.parse(savedUser) as CompanyUserProfile;
          this.companyAuthToken = savedToken;
          if (savedCompany) {
            this.company = JSON.parse(savedCompany) as CompanyState['company'];
          }
          this.authInitialized = true;
        } else {
          this.clearAuthState();
        }

        this.isLoading = false;
        return this.user;
      } catch (error: unknown) {
        const err = error as { status?: number } | null;
        if (err && (err.status === 401 || err.status === 403)) {
          this.clearAuthState();
          this.isLoading = false;
          return null;
        }
        console.warn('Error checking company auth state (transient), keeping session:', error);
        this.isLoading = false;
        return this.user;
      }
    },

    clearAuthState(): void {
      this.user = null;
      this.company = null;
      this.companyAuthToken = null;
      this.phoneVerifying = null;
      this.otpSent = false;
      this.phoneStatus = null;

      if (typeof window !== 'undefined') {
        const companyDomain = this.getCompanyDomain();
        const storageKey = companyDomain ? `company_${companyDomain}` : 'company';

        localStorage.removeItem(`${storageKey}_user`);
        localStorage.removeItem(`${storageKey}_company`);
        localStorage.removeItem(`${storageKey}_token`);
        localStorage.removeItem(`${storageKey}_refresh_token`);
      }
    },

    async logout(): Promise<void> {
      this.isLoading = true;
      try {
        this.clearAuthState();
      } catch (error: unknown) {
        console.error('Error logging out:', error);
        this.error = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Legacy public helper retained for the many pharmacy-portal pages and
    // access-management components that still call
    // `companyStore.makeAuthRequest(...)`. Migrating those call sites onto
    // per-domain services is tracked as a follow-up.
    async makeAuthRequest(url: string, options: Record<string, unknown> = {}): Promise<unknown> {
      return this._companyAuthService().request(url, options);
    },

    async fetchTheme(): Promise<void> {
      if (!this.company?.id) return;
      try {
        const data = await this._companyAuthService().getStoreSettings(this.company.id);
        if (data && data.success && data.data && this.company) {
          const newPreset = data.data.theme_preset ?? this.company.theme_preset;
          const newColor = (data.data as { theme_color?: string | null }).theme_color ?? this.company.theme_color;
          this.company = {
            ...this.company,
            ...(newPreset !== undefined ? { theme_preset: newPreset } : {}),
            ...(newColor !== undefined ? { theme_color: newColor } : {}),
          };
          this.persistAuthData();
        }
      } catch {
        // best-effort; keep defaults
      }
    },
  },
});
