// Admin Store - Manages admin authentication state
import { defineStore } from 'pinia';

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
    
    // Check if admin has super_admin role
    isSuperAdmin: (state) => state.admin?.role === 'super_admin',
    
    // Check if admin has at least a certain role level
    hasRole: (state) => (requiredRole) => {
      const roleHierarchy = {
        'business_analyst': 1,
        'support_agent': 2,
        'auditor': 3,
        'super_admin': 4,
      };
      
      const adminLevel = roleHierarchy[state.admin?.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;
      
      return adminLevel >= requiredLevel;
    },
  },

  actions: {
    // Login admin
    async login(username, password) {
      this.isLoading = true;
      
      try {
        const config = useRuntimeConfig();
        const baseURL = config.public.apiBase;
        
        const response = await fetch(`${baseURL}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

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
        const config = useRuntimeConfig();
        const baseURL = config.public.apiBase || 'http://localhost:3000';
        
        const response = await fetch(`${baseURL}/api/admin/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });

        const data = await response.json();

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

    // Make authenticated API request
    async makeAuthRequest(endpoint, options = {}) {
      if (!this.token) {
        throw new Error('No authentication token available');
      }

      const config = useRuntimeConfig();
      const baseURL = config.public.apiBase || 'http://localhost:3000';

      try {
        const response = await fetch(`${baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }

        return data;
      } catch (error) {
        console.error('Auth request error:', error);
        throw error;
      }
    },

    // Get all admins (super_admin only)
    async getAllAdmins() {
      try {
        const data = await this.makeAuthRequest('/api/admin/admins');
        return data;
      } catch (error) {
        console.error('Error fetching admins:', error);
        throw error;
      }
    },

    // Create new admin (super_admin only)
    async createAdmin(adminData) {
      try {
        const data = await this.makeAuthRequest('/api/admin/admins', {
          method: 'POST',
          body: JSON.stringify(adminData),
        });
        return data;
      } catch (error) {
        console.error('Error creating admin:', error);
        throw error;
      }
    },

    // Update admin (super_admin only)
    async updateAdmin(adminId, adminData) {
      try {
        const data = await this.makeAuthRequest(`/api/admin/admins/${adminId}`, {
          method: 'PUT',
          body: JSON.stringify(adminData),
        });
        return data;
      } catch (error) {
        console.error('Error updating admin:', error);
        throw error;
      }
    },

    // Delete admin (super_admin only)
    async deleteAdmin(adminId) {
      try {
        const data = await this.makeAuthRequest(`/api/admin/admins/${adminId}`, {
          method: 'DELETE',
        });
        return data;
      } catch (error) {
        console.error('Error deleting admin:', error);
        throw error;
      }
    },
  },
});
