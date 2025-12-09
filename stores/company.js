// stores/company.js - Company User Authentication System
import { defineStore } from 'pinia';

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

    async checkPhoneStatus(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const formattedPhone = this.formatPhoneNumber(phone);
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/check-phone`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ phone: formattedPhone })
        });

        const data = await response.json();
        
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
        const config = useRuntimeConfig();
        const formattedPhone = this.formatPhoneNumber(phone);
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/send-otp`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ phone: formattedPhone })
        });

        const data = await response.json();
        
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
        const config = useRuntimeConfig();
        const formattedPhone = this.formatPhoneNumber(phone);
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/setup-password`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ 
            phone: formattedPhone, 
            otp, 
            password 
          })
        });

        const data = await response.json();
        
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
        const config = useRuntimeConfig();
        const formattedPhone = this.formatPhoneNumber(phone);
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/login`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ 
            phone: formattedPhone, 
            password 
          })
        });

        const data = await response.json();
        
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

    async getProfile() {
      if (!this.isLoggedIn || !this.companyAuthToken) {
        throw new Error('User must be logged in');
      }

      try {
        const config = useRuntimeConfig();
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/profile`, {
          headers: this.getApiHeaders()
        });

        const data = await response.json();
        
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
        const config = useRuntimeConfig();
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/change-password`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ 
            current_password: currentPassword, 
            new_password: newPassword 
          })
        });

        const data = await response.json();
        
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
        const config = useRuntimeConfig();
        const formattedPhone = this.formatPhoneNumber(phone);
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/request-password-reset`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ phone: formattedPhone })
        });

        const data = await response.json();
        
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
        const config = useRuntimeConfig();
        const formattedPhone = this.formatPhoneNumber(phone);
        
        const response = await fetch(`${config.public.apiBase}/api/company-auth/reset-password`, {
          method: 'POST',
          headers: this.getApiHeaders(),
          body: JSON.stringify({ 
            phone: formattedPhone, 
            otp, 
            new_password: newPassword 
          })
        });

        const data = await response.json();
        
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

    persistAuthData() {
      if (typeof window === 'undefined') return;
      
      try {
        const companyDomain = this.getCompanyDomain();
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

    async makeAuthRequest(url, options = {}) {
      const config = useRuntimeConfig();
      const headers = this.getApiHeaders();
      
      const response = await fetch(`${config.public.apiBase}${url}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    },
  },
});
