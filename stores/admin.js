// Admin Store - Manages admin authentication state
//
// Refactored to use services/admin/adminService.js. The store stays the
// orchestrator: loading flag, error surfacing, token persistence to
// localStorage, 401 -> logout side effect, and response-envelope
// (`{ success, data, message }`) handling. All HTTP details live in the
// service. Public method names + return shapes are preserved 1:1.
//
// The legacy `makeAuthRequest(endpoint, options)` action is kept because
// ~9 components/pages outside this PR's scope still call it directly.
// Its body now delegates to the service's generic `request` and the
// 401-side-effect (call `this.logout()` + friendly error) is preserved
// here. Migrating those external callers onto per-domain services so
// `makeAuthRequest` can be removed is tracked as a follow-up.
import { defineStore } from 'pinia';
import { createAdminService } from '~/services/admin/adminService';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    admin: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    // Get admin details
    getAdmin: (state) => state.admin,

    // Check if admin is authenticated
    isAdminAuthenticated: (state) => state.isAuthenticated,

    // Get admin role
    getRole: (state) => state.admin?.role || null,

    // Keep legacy "admin" role equivalent to super_admin privileges
    isSuperAdmin: (state) => ['super_admin', 'admin'].includes(state.admin?.role),

    // Get dashboard route based on role
    getDashboardRoute: (state) => {
      if (state.admin?.role === 'data_consumer') {
        return '/dataconsumer/dashboard'
      }
      return '/admin/data'
    },

    // Check if admin has at least a certain role level
    hasRole: (state) => (requiredRole) => {
      const roleHierarchy = {
        'data_consumer': 0, // NEW: read-only data buyer
        'business_analyst': 1,
        'order_processor': 2,
        'support_agent': 3,
        'auditor': 4,
        'manager': 5,
        'admin': 6,
        'super_admin': 6,
      };

      const adminLevel = roleHierarchy[state.admin?.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      return adminLevel >= requiredLevel;
    },
  },

  actions: {
    _adminService() {
      return createAdminService(useApi());
    },

    // Login admin.
    //
    // Returns one of three shapes:
    //   { success: true }                               — fully authenticated
    //   { success: false, mfaRequired: true,
    //     mfaMethod: 'sms'|'totp',
    //     challengeId, phoneHint? }                     — MFA step needed
    //   { success: false, message }                     — bad credentials
    async login(username, password) {
      this.isLoading = true;

      try {
        const data = await this._adminService().login({ username, password });

        // MFA challenge: backend returns 202 with success:false + mfa_required:true.
        // useApi passes 2xx through; we detect the challenge here and surface it
        // to the page so it can show the appropriate MFA input.
        if (data.mfa_required) {
          return {
            success: false,
            mfaRequired: true,
            mfaMethod: data.mfa_method || 'sms',
            challengeId: data.challenge_id,
            phoneHint: data.phone_hint || null,
          };
        }

        if (data.success) {
          // Store token and admin data
          this.token = data.data.token;
          this.admin = data.data.admin;
          this.isAuthenticated = true;

          // Save to localStorage
          if (process.client) {
            localStorage.setItem('adminToken', data.data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
          }

          return { success: true, message: data.message };
        } else {
          return { success: false, message: data.message };
        }
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
      } finally {
        this.isLoading = false;
      }
    },

    // Verify an MFA code during the login challenge.
    //
    // For TOTP: POST /api/auth/mfa/totp/verify with { challenge_id, code }.
    // For SMS:  delegate to the existing companyAuth MFA verify path (handled
    //           by the store action the SMS flow already calls).
    //
    // On success sets the session identical to a direct login.
    async verifyMfaTotp({ challengeId, code }) {
      this.isLoading = true;
      try {
        const data = await this._adminService().verifyMfaTotp({ challengeId, code });

        if (data.success) {
          this.token = data.data.token;
          this.admin = data.data.admin;
          this.isAuthenticated = true;

          if (process.client) {
            localStorage.setItem('adminToken', data.data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
          }

          return { success: true, message: data.message };
        } else {
          return { success: false, message: data.message || 'Verification failed.' };
        }
      } catch (error) {
        console.error('TOTP verify error:', error);
        return { success: false, message: error.message || 'Verification failed. Please try again.' };
      } finally {
        this.isLoading = false;
      }
    },

    // Logout admin
    logout() {
      this.token = null;
      this.admin = null;
      this.isAuthenticated = false;

      // Clear localStorage
      if (process.client) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    },

    // Restore session from localStorage
    async restoreSession() {
      if (process.client) {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminUser');

        if (token && adminData) {
          try {
            this.token = token;
            this.admin = JSON.parse(adminData);

            // Verify token is still valid
            const isValid = await this.verifyToken();

            if (isValid) {
              this.isAuthenticated = true;
              return true;
            } else {
              this.logout();
              return false;
            }
          } catch (error) {
            console.error('Session restoration error:', error);
            this.logout();
            return false;
          }
        }
      }
      return false;
    },

    // Verify token with server
    async verifyToken() {
      if (!this.token) return false;

      try {
        const data = await this._adminService().getProfile();

        if (data.success) {
          // Update admin data with fresh data from server
          this.admin = data.data;
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('Token verification error:', error);
        return false;
      }
    },

    // Make authenticated API request (legacy public helper; kept for
    // external callers across components/pages — see file-top note).
    async makeAuthRequest(endpoint, options = {}) {
      if (!this.token) {
        throw new Error('No authentication token available');
      }

      try {
        return await this._adminService().request(endpoint, options);
      } catch (error) {
        // Preserve legacy 401 side effect: clear session and surface a
        // friendly message. `useApi` attaches `status` to the thrown
        // Error.
        if (error && error.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Auth request error:', error);
        throw error;
      }
    },

    // Get all admins (super_admin only)
    async getAllAdmins() {
      try {
        return await this._adminService().listAdmins();
      } catch (error) {
        if (error && error.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error fetching admins:', error);
        throw error;
      }
    },

    // Create new admin (super_admin only)
    async createAdmin(adminData) {
      try {
        return await this._adminService().createAdmin(adminData);
      } catch (error) {
        if (error && error.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error creating admin:', error);
        throw error;
      }
    },

    // Update admin (super_admin only)
    async updateAdmin(adminId, adminData) {
      try {
        return await this._adminService().updateAdmin(adminId, adminData);
      } catch (error) {
        if (error && error.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error updating admin:', error);
        throw error;
      }
    },

    // Delete admin (super_admin only)
    async deleteAdmin(adminId) {
      try {
        return await this._adminService().deleteAdmin(adminId);
      } catch (error) {
        if (error && error.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        console.error('Error deleting admin:', error);
        throw error;
      }
    },

    // Request password reset
    async requestPasswordReset(identifier) {
      try {
        const data = await this._adminService().requestPasswordReset({ identifier });

        if (data.success) {
          return { success: true, message: data.message };
        } else {
          return { success: false, message: data.message };
        }
      } catch (error) {
        console.error('Password reset request error:', error);
        return { success: false, message: 'Failed to send reset instructions. Please try again.' };
      }
    },

    // Reset password with token
    async resetPassword(token, newPassword) {
      try {
        const data = await this._adminService().resetPassword({ token, newPassword });

        if (data.success) {
          return { success: true, message: data.message };
        } else {
          return { success: false, message: data.message };
        }
      } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, message: 'Failed to reset password. Please try again.' };
      }
    },
  },
});
