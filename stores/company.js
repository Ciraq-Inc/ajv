// stores/company.js - Company User Authentication System
//
// Pinia store for the company-portal auth domain. Holds reactive auth
// state (user, company, token, OTP/loading/error flags), the
// company-domain resolver, header builder, and per-action side
// effects (token persistence, error surfacing). All HTTP details for
// `/api/company-auth/*` and the company-store-settings GET live in
// `services/companyAuth/companyAuthService.js`; this store passes
// `useApi()` and a header provider to the factory and delegates each
// call. Phone-number formatting stays in the store (it predates the
// service refactor and existing callers pass raw user input).
import { defineStore } from 'pinia';
import { createCompanyAuthService } from '~/services/companyAuth/companyAuthService';

export const useCompanyStore = defineStore('company', {
  state: () => ({
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
    isLoggedIn: (state) => !!state.user && !!state.companyAuthToken,
    currentUser: (state) => state.user,
    currentCompany: (state) => state.company,
    userRole: (state) => state.user?.role || null,
    userName: (state) => state.user?.name || null,
    userPhone: (state) => state.user?.phone || null,
  },

  actions: {
    formatPhoneNumber(phone) {
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

    getCompanyDomain() {
      // Extract company domain from URL path or subdomain
      if (typeof window === 'undefined') return null;

      const pathname = window.location.pathname;
      const match = pathname.match(/\/([^\/]+)\/services/);
      if (match && match[1]) {
        return match[1];
      }

      // Fallback to subdomain
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        return parts[0];
      }

      return null;
    },

    getApiHeaders() {
      const headers = {
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
    // so `useApi()` is resolved at call time inside the Nuxt request
    // context. The header provider is bound to `this` so each call
    // recomputes `getApiHeaders()` against the current URL + token —
    // same recompute-per-call behavior the legacy raw fetches had.
    _companyAuthService() {
      return createCompanyAuthService(useApi(), () => this.getApiHeaders());
    },

    async checkPhoneStatus(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().checkPhone({ phone: formattedPhone });

        if (!data.success) {
          throw new Error(data.message || 'Failed to check phone status');
        }

        this.phoneStatus = data.data.status;
        this.phoneVerifying = formattedPhone;

        return data.data;
      } catch (error) {
        console.error('Error checking phone status:', error);
        this.error = error.message || 'Failed to check phone number';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendOTP(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().sendOtp({ phone: formattedPhone });

        if (!data.success) {
          throw new Error(data.message || 'Failed to send OTP');
        }

        this.otpSent = true;
        this.phoneVerifying = formattedPhone;

        return data.data;
      } catch (error) {
        console.error('Error sending OTP:', error);
        this.error = error.message || 'Failed to send verification code';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async setupPassword(phone, otp, password) {
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
          throw new Error(data.message || 'Failed to setup password');
        }

        this.user = data.data.user;
        this.company = data.data.company;
        this.companyAuthToken = data.data.token;

        this.persistAuthData();
        this.authInitialized = true;
        this.phoneVerifying = null;
        this.otpSent = false;

        return data.data;
      } catch (error) {
        console.error('Error setting up password:', error);
        this.error = error.message || 'Failed to setup password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async login(phone, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().login({
          phone: formattedPhone,
          password,
        });

        if (!data.success) {
          throw new Error(data.message || 'Login failed');
        }

        this.user = data.data.user;
        this.company = data.data.company;
        this.companyAuthToken = data.data.token;

        this.persistAuthData();
        this.authInitialized = true;
        this.phoneVerifying = null;

        return data.data;
      } catch (error) {
        console.error('Error logging in:', error);
        this.error = error.message || 'Login failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async recruiterSignup(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(payload.phone);
        const data = await this._companyAuthService().recruiterSignup({
          ...payload,
          phone: formattedPhone,
        });

        if (!data.success) {
          throw new Error(data.message || 'Failed to create recruiter account');
        }

        this.user = data.data.user;
        this.company = data.data.company;
        this.companyAuthToken = data.data.token;
        this.authInitialized = true;

        this.persistAuthData(data.data.company?.domain || data.data.company?.domain_name || null);

        return data.data;
      } catch (error) {
        console.error('Error creating recruiter account:', error);
        this.error = error.message || 'Failed to create recruiter account';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getProfile() {
      if (!this.isLoggedIn || !this.companyAuthToken) {
        throw new Error('User must be logged in');
      }

      try {
        const data = await this._companyAuthService().getProfile();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch profile');
        }

        this.user = data.data;

        return data.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },

    async changePassword(currentPassword, newPassword) {
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
          throw new Error(data.message || 'Failed to change password');
        }

        return data;
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async requestPasswordReset(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._companyAuthService().requestPasswordReset({
          phone: formattedPhone,
        });

        if (!data.success) {
          throw new Error(data.message || 'Failed to request password reset');
        }

        this.phoneVerifying = formattedPhone;
        this.otpSent = true;

        return data;
      } catch (error) {
        console.error('Error requesting password reset:', error);
        this.error = error.message || 'Failed to request password reset';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async resetPassword(phone, otp, newPassword) {
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
          throw new Error(data.message || 'Failed to reset password');
        }

        this.phoneVerifying = null;
        this.otpSent = false;

        return data;
      } catch (error) {
        console.error('Error resetting password:', error);
        this.error = error.message || 'Failed to reset password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    persistAuthData(domainOverride = null) {
      if (typeof window === 'undefined') return;

      try {
        const companyDomain = domainOverride || this.getCompanyDomain();
        const storageKey = companyDomain ? `company_${companyDomain}` : 'company';

        localStorage.setItem(`${storageKey}_user`, JSON.stringify(this.user));
        localStorage.setItem(`${storageKey}_company`, JSON.stringify(this.company));
        localStorage.setItem(`${storageKey}_token`, this.companyAuthToken);
      } catch (error) {
        console.error('Error persisting auth data:', error);
      }
    },

    async checkAuthState() {
      if (typeof window === 'undefined') return;

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
          this.user = JSON.parse(savedUser);
          this.companyAuthToken = savedToken;
          if (savedCompany) {
            this.company = JSON.parse(savedCompany);
          }
          this.authInitialized = true;
        } else {
          this.clearAuthState();
        }

        this.isLoading = false;
        return this.user;
      } catch (error) {
        console.error('Error checking auth state:', error);
        this.clearAuthState();
        this.isLoading = false;
        return null;
      }
    },

    clearAuthState() {
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
      }
    },

    async logout() {
      this.isLoading = true;
      try {
        this.clearAuthState();
        return true;
      } catch (error) {
        console.error('Error logging out:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Legacy public helper retained for the many pharmacy-portal pages
    // and access-management components that still call
    // `companyStore.makeAuthRequest(...)`. Delegates to the service
    // `request` passthrough; the company-scoped headers (auth +
    // x-company-domain) are injected by the service factory. Returns
    // the parsed envelope on success exactly like the legacy
    // implementation. `useApi` throws on non-2xx so callers wrapping
    // in try/catch land in their catch — same as before. Migration
    // of these call sites onto per-domain services is tracked as a
    // follow-up.
    async makeAuthRequest(url, options = {}) {
      return this._companyAuthService().request(url, options);
    },

    async fetchTheme() {
      if (!this.company?.id) return;
      try {
        const data = await this._companyAuthService().getStoreSettings(this.company.id);
        if (data && data.success && data.data && this.company) {
          this.company = {
            ...this.company,
            theme_preset: data.data.theme_preset || this.company.theme_preset,
            theme_color: data.data.theme_color || this.company.theme_color,
          };
          this.persistAuthData();
        }
      } catch {
        // keep defaults — fetchTheme is best-effort; legacy swallowed
        // non-ok responses the same way (via `if (!res.ok) return`).
      }
    },
  },
});
