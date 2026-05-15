// stores/user.js - Master Account Authentication System
import { defineStore } from 'pinia';
import { createOrdersService } from '~/services/orders/ordersService';
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService';

export const useUserStore = defineStore('user', {
  state: () => ({
    masterCustomer: null,
    selectedCompany: null,
    companies: [],
    customerAuthToken: null,
    phoneStatus: null,
    phoneVerifying: null,
    otpSent: false,
    isLoading: false,
    error: null,
    authInitialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.masterCustomer && !!state.customerAuthToken,
    currentUser: (state) => state.masterCustomer,
    userPhoneNumber: (state) => state.masterCustomer?.phone || null,
    currentCompany: (state) => state.selectedCompany,
    hasMultipleCompanies: (state) => state.companies.length > 1,
    companyCount: (state) => state.companies.length,
    totalOrders: (state) => state.masterCustomer?.total_orders || 0,
    totalSpent: (state) => state.masterCustomer?.total_spent || 0,
    linkedCompanies: (state) => state.companies.length || 0,
  },

  actions: {
    applyCustomerAuthPayload(payload) {
      this.masterCustomer = payload?.master_customer || null;
      this.companies = payload?.companies || [];
      this.selectedCompany = payload?.selected_company || this.companies[0] || null;
      this.customerAuthToken = payload?.token || null;
      this.persistAuthData();
      this.authInitialized = true;
      this.phoneVerifying = null;
      this.otpSent = false;
    },

    applyProfileData(profile) {
      if (!profile) return;
      this.masterCustomer = {
        ...(this.masterCustomer || {}),
        ...profile,
        address: profile.home_address ?? profile.address ?? this.masterCustomer?.address ?? null,
        latitude: profile.home_latitude ?? profile.latitude ?? this.masterCustomer?.latitude ?? null,
        longitude: profile.home_longitude ?? profile.longitude ?? this.masterCustomer?.longitude ?? null
      };
      this.persistAuthData();
    },

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

    async checkPhoneStatus(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().checkPhone({ phone: formattedPhone });
        if (!data.success) throw new Error(data.message || 'Failed to check phone status');
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

    async sendSetupOTP(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().sendSetupOtp({ phone: formattedPhone });
        if (!data.success) throw new Error(data.message || 'Failed to send OTP');
        this.otpSent = true;
        this.phoneVerifying = formattedPhone;
        return data.data;
      } catch (error) {
        console.error('Error sending setup OTP:', error);
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
        const data = await this._customerAuthService().setupPassword({
          phone: formattedPhone,
          otp,
          password,
        });
        if (!data.success) throw new Error(data.message || 'Failed to setup password');
        this.applyCustomerAuthPayload(data.data);

        console.log('Password setup successful! User logged in:', this.masterCustomer);

        // Load user stats after setup
        await this.loadUserStats();

        return data.data;
      } catch (error) {
        console.error('Error setting up password:', error);
        this.error = error.message || 'Failed to setup password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async register(registrationData) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(registrationData.phone);
        const data = await this._customerAuthService().register({
          companyId: registrationData.company_id || undefined,
          fname: registrationData.fname,
          lname: registrationData.lname,
          phone: formattedPhone,
          password: registrationData.password,
          email: registrationData.email,
          otp: registrationData.otp,
        });
        if (!data.success) throw new Error(data.message || 'Registration failed');
        this.applyCustomerAuthPayload(data.data);

        console.log('Registration successful! User logged in:', this.masterCustomer);

        // Load user stats after registration
        await this.loadUserStats();

        return data.data;
      } catch (error) {
        console.error('Error registering customer:', error);
        this.error = error.message || 'Registration failed';
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
        const data = await this._customerAuthService().login({
          phone: formattedPhone,
          password,
        });
        if (!data.success) throw new Error(data.message || 'Login failed');
        this.applyCustomerAuthPayload(data.data);

        // Load user stats after login
        await this.loadUserStats();

        return data.data;
      } catch (error) {
        console.error('Error logging in:', error);
        this.error = error.message || 'Login failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getMyCompanies() {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().myCompanies();
        if (!data.success) throw new Error(data.message || 'Failed to fetch companies');
        this.companies = data.data || [];
        return this.companies;
      } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async triggerCustomerLinking() {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().triggerLinking();
        if (!data.success) throw new Error(data.message || 'Failed to trigger linking');

        // Update companies list from response
        if (data.data?.companies) {
          this.companies = data.data.companies;
          this.persistAuthData();
        }

        return data;
      } catch (error) {
        console.error('Error triggering customer linking:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async switchCompany(companyId) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().switchCompany({ companyId });
        if (!data.success) throw new Error(data.message || 'Failed to switch company');
        this.applyCustomerAuthPayload(data.data);
        return this.selectedCompany;
      } catch (error) {
        console.error('Error switching company:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getProfile() {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const data = await this._customerAuthService().getProfile();
        if (!data.success) throw new Error(data.message || 'Failed to fetch profile');
        this.applyProfileData(data.data);
        return data.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },

    async updateProfile(profileData) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().updateProfile(profileData);
        if (!data.success) throw new Error(data.message || 'Failed to update profile');
        this.applyProfileData(data.data);
        return data.data;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async changePassword(currentPassword, newPassword) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().changePassword({
          currentPassword,
          newPassword,
        });
        if (!data.success) throw new Error(data.message || 'Failed to change password');
        return data;
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendResetOTP(phone) {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().sendResetOtp({ phone: formattedPhone });
        if (!data.success) throw new Error(data.message || 'Failed to send reset code');
        this.otpSent = true;
        this.phoneVerifying = formattedPhone;
        return data.data;
      } catch (error) {
        console.error('Error sending reset OTP:', error);
        this.error = error.message || 'Failed to send reset code';
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
        const data = await this._customerAuthService().resetPassword({
          phone: formattedPhone,
          otp,
          newPassword,
        });
        if (!data.success) throw new Error(data.message || 'Failed to reset password');

        this.phoneVerifying = null;
        this.otpSent = false;

        return data.data;
      } catch (error) {
        console.error('Error resetting password:', error);
        this.error = error.message || 'Failed to reset password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // ---------------------------------------------------------------------
    // Orders domain (refactored to use services/orders/ordersService).
    // The store stays the orchestrator: loading flag, auth guard, error
    // surfacing, and envelope (`{ success, data, message }`) handling. All
    // HTTP details live in the service. Public method names + return
    // shapes are preserved 1:1 — consumers do not change.
    // ---------------------------------------------------------------------
    _ordersService() {
      return createOrdersService(useApi());
    },

    // ---------------------------------------------------------------------
    // Customer auth domain (refactored to use
    // services/customerAuth/customerAuthService). Pure HTTP lives in the
    // service; the store keeps loading/error state, auth-guard checks,
    // envelope (`{ success, data, message }`) handling, phone-number
    // formatting, and crucially `applyCustomerAuthPayload` /
    // `applyProfileData` / `persistAuthData` — token persistence stays
    // inside the store so the service has zero coupling to Pinia or
    // localStorage. `useApi` reads the token back out of localStorage
    // when sending authenticated requests.
    // ---------------------------------------------------------------------
    _customerAuthService() {
      return createCustomerAuthService(useApi());
    },

    async processDirectOrder(cartItems, pharmacyId) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in to place an order');
      this.isLoading = true;
      try {
        const items = cartItems.map((item) => ({
          product_id: item.id,
          qty: item.quantity || 1,
          discount: item.discount || 0,
          tax_amount: item.tax || 0,
          notes: item.notes || ''
        }));
        const data = await this._ordersService().create({
          companyId: pharmacyId,
          items,
          notes: `Order from pharmacy ${pharmacyId}`,
        });
        if (!data.success) {
          const error = new Error(data.message || 'Failed to create order');
          error.errorCode = data.error_code;
          throw error;
        }
        return { success: true, orderId: data.data.order_id, orderData: data.data };
      } catch (error) {
        console.error('Error processing order:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getOrderHistory(filters = {}) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const pharmacyStore = usePharmacyStore();
        const data = await this._ordersService().listForPharmacy({
          companyId: pharmacyStore.currentPharmacy || undefined,
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
        });
        if (!data.success) throw new Error(data.message || 'Failed to fetch orders');
        return data.data || [];
      } catch (error) {
        console.error('Error fetching order history:', error);
        throw error;
      }
    },

    async getAllOrders(filters = {}) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const data = await this._ordersService().listAll({
          status: filters.status,
          limit: filters.limit,
          offset: filters.offset,
        });
        if (!data.success) throw new Error(data.message || 'Failed to fetch all orders');
        return data.data || [];
      } catch (error) {
        console.error('Error fetching all orders:', error);
        throw error;
      }
    },

    async getOrderDetails(orderId, companyId = null) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const pharmacyStore = usePharmacyStore();
        // Use provided companyId or fallback to current pharmacy
        const company_id = companyId || pharmacyStore.currentPharmacy;
        const data = await this._ordersService().getById(orderId, { companyId: company_id || undefined });
        if (!data.success) throw new Error(data.message || 'Failed to fetch order details');
        return data.data;
      } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
      }
    },

    async cancelOrder(orderId, companyId = null) {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const pharmacyStore = usePharmacyStore();
        // Use provided companyId or fallback to current pharmacy
        const company_id = companyId || pharmacyStore.currentPharmacy;
        const data = await this._ordersService().cancel(orderId, { companyId: company_id });
        if (!data.success) throw new Error(data.message || 'Failed to cancel order');
        return data;
      } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    persistAuthData() {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem('masterCustomer', JSON.stringify(this.masterCustomer));
        localStorage.setItem('selectedCompany', JSON.stringify(this.selectedCompany));
        localStorage.setItem('companies', JSON.stringify(this.companies));
        localStorage.setItem('customerAuthToken', this.customerAuthToken);
      } catch (error) {
        console.error('Error persisting auth data:', error);
      }
    },

    async checkAuthState() {
      if (typeof window === 'undefined') return;
      this.isLoading = true;
      try {
        if (this.authInitialized && this.masterCustomer && this.customerAuthToken) {
          this.isLoading = false;
          return this.masterCustomer;
        }
        const savedMasterCustomer = localStorage.getItem('masterCustomer');
        const savedToken = localStorage.getItem('customerAuthToken');
        const savedCompanies = localStorage.getItem('companies');
        const savedSelectedCompany = localStorage.getItem('selectedCompany');
        if (savedMasterCustomer && savedToken) {
          this.masterCustomer = JSON.parse(savedMasterCustomer);
          this.customerAuthToken = savedToken;
          if (savedCompanies) this.companies = JSON.parse(savedCompanies);
          if (savedSelectedCompany) this.selectedCompany = JSON.parse(savedSelectedCompany);
          this.authInitialized = true;

          try {
            // Validate the stored token before treating the session as active.
            await this.getProfile();

            // Load fresh stats when restoring from storage
            await this.loadUserStats();
          } catch (error) {
            console.error('Stored customer session is no longer valid:', error);
            this.clearAuthState();
            this.isLoading = false;
            return null;
          }
        } else {
          this.clearAuthState();
        }
        this.isLoading = false;
        return this.masterCustomer;
      } catch (error) {
        console.error('Error checking auth state:', error);
        this.clearAuthState();
        this.isLoading = false;
        return null;
      }
    },

    clearAuthState() {
      this.masterCustomer = null;
      this.selectedCompany = null;
      this.companies = [];
      this.customerAuthToken = null;
      this.phoneVerifying = null;
      this.otpSent = false;
      this.phoneStatus = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('masterCustomer');
        localStorage.removeItem('selectedCompany');
        localStorage.removeItem('companies');
        localStorage.removeItem('customerAuthToken');
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

    async loadUserStats() {
      if (!this.isLoggedIn || !this.customerAuthToken) {
        console.log('Cannot load stats: User not logged in');
        return;
      }

      try {
        console.log('Loading user stats...');

        // Try to fetch orders using both endpoints
        let orders = [];

        try {
          // First try getAllOrders
          orders = await this.getAllOrders({ limit: 100 });
          console.log('Fetched from getAllOrders:', orders?.length || 0, 'orders');
        } catch (error) {
          console.log('getAllOrders failed, trying getOrderHistory:', error.message);
          // If that fails, try getOrderHistory
          try {
            orders = await this.getOrderHistory({ limit: 100 });
            console.log('Fetched from getOrderHistory:', orders?.length || 0, 'orders');
          } catch (error2) {
            console.error('Both order endpoints failed:', error2.message);
          }
        }

        if (Array.isArray(orders) && orders.length > 0) {
          // Calculate total orders
          const totalOrders = orders.length;

          // Calculate total spent by summing all order amounts
          const totalSpent = orders.reduce((sum, order) => {
            const amount = parseFloat(order.total_amount || order.amount || order.totalAmount || order.total || 0);
            console.log('Order amount:', amount, 'from order ID:', order.id || order.order_id);
            return sum + amount;
          }, 0);

          console.log('Calculated stats - Orders:', totalOrders, 'Total Spent:', totalSpent);

          // Update masterCustomer with calculated stats
          if (this.masterCustomer) {
            this.masterCustomer.total_orders = totalOrders;
            this.masterCustomer.total_spent = totalSpent;
            this.persistAuthData();
            console.log('Stats updated and persisted');
          }
        } else {
          console.log('No orders found, setting stats to 0');
          // Set to 0 if no orders
          if (this.masterCustomer) {
            this.masterCustomer.total_orders = 0;
            this.masterCustomer.total_spent = 0;
            this.persistAuthData();
          }
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
        console.error('Error details:', error.message);
        // Set to 0 on error
        if (this.masterCustomer) {
          this.masterCustomer.total_orders = 0;
          this.masterCustomer.total_spent = 0;
        }
      }
    },
  },
});
