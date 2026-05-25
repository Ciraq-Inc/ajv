// stores/user.ts — Master Account Authentication Store (JS → TS migration)
//
// Manages the customer (end-user) auth session across all pharmacies.
// Holds master-customer profile, linked companies, the active company,
// and the customer auth token. All HTTP delegates to the service layer.
// Phone normalization, localStorage persistence, and applyCustomerAuthPayload
// all live here — the service has zero coupling to Pinia or localStorage.
//
// Task 2 — Cursor pagination:
// `getOrderHistory` and `getAllOrders` now accept an optional `cursor`
// parameter that is passed through to the service.  Both cursor and
// legacy offset-based shapes are handled; `nextCursor` tracks the
// continuation token for order lists.

import { defineStore } from 'pinia';
import { createOrdersService } from '~/services/orders/ordersService';
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService';
import { usePharmacyStore } from '~/stores/pharmacy';
import type { CustomerProfile, LinkedCompany, Order, LocationSuggestion, ReverseGeocodeResult } from '~/services/types';

// ---------------------------------------------------------------------------
// Local domain types
// ---------------------------------------------------------------------------

export interface MasterCustomer extends Omit<CustomerProfile, 'id'> {
  id: number | string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  home_address?: string | null;
  home_latitude?: number | string | null;
  home_longitude?: number | string | null;
  total_orders?: number;
  total_spent?: number;
  [key: string]: unknown;
}

export interface UserState {
  masterCustomer: MasterCustomer | null;
  selectedCompany: LinkedCompany | null;
  companies: LinkedCompany[];
  customerAuthToken: string | null;
  phoneStatus: string | null;
  phoneVerifying: string | null;
  otpSent: boolean;
  isLoading: boolean;
  error: string | null;
  authInitialized: boolean;
  /** Continuation cursor from the last paginated order fetch. */
  nextCursor: string | null;
  /** Accumulated order list — appended on cursor loads, replaced on fresh loads. */
  orders: Order[];
}

// ---------------------------------------------------------------------------
// Cursor-pagination response shape (Task 2)
// ---------------------------------------------------------------------------

interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
}

function isCursorPage<T>(value: unknown): value is CursorPage<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    Array.isArray((value as Record<string, unknown>)['items'])
  );
}

// ---------------------------------------------------------------------------
// Auth payload shapes returned by customer auth endpoints
// ---------------------------------------------------------------------------

interface CustomerAuthPayload {
  master_customer?: MasterCustomer | null;
  companies?: LinkedCompany[];
  selected_company?: LinkedCompany | null;
  token?: string | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
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
    nextCursor: null,
    orders: [],
  }),

  getters: {
    isLoggedIn: (state): boolean =>
      !!state.masterCustomer && !!state.customerAuthToken,

    currentUser: (state): MasterCustomer | null => state.masterCustomer,

    userPhoneNumber: (state): string | null =>
      state.masterCustomer?.phone ?? null,

    currentCompany: (state): LinkedCompany | null => state.selectedCompany,

    hasMultipleCompanies: (state): boolean => state.companies.length > 1,

    companyCount: (state): number => state.companies.length,

    totalOrders: (state): number => state.masterCustomer?.total_orders ?? 0,

    totalSpent: (state): number => state.masterCustomer?.total_spent ?? 0,

    linkedCompanies: (state): number => state.companies.length,
  },

  actions: {
    // -------------------------------------------------------------------
    // Service factory accessors
    // -------------------------------------------------------------------
    _ordersService() {
      return createOrdersService(useApi());
    },

    _customerAuthService() {
      return createCustomerAuthService(useApi());
    },

    // -------------------------------------------------------------------
    // Auth payload helpers
    // -------------------------------------------------------------------

    applyCustomerAuthPayload(payload: CustomerAuthPayload | null): void {
      this.masterCustomer = payload?.master_customer ?? null;
      this.companies = payload?.companies ?? [];
      this.selectedCompany = payload?.selected_company ?? this.companies[0] ?? null;
      this.customerAuthToken = payload?.token ?? null;
      this.persistAuthData();
      this.authInitialized = true;
      this.phoneVerifying = null;
      this.otpSent = false;
    },

    applyProfileData(profile: Partial<MasterCustomer> | null): void {
      if (!profile) return;
      this.masterCustomer = {
        ...(this.masterCustomer ?? ({} as MasterCustomer)),
        ...profile,
        address:
          profile.home_address ??
          profile.address ??
          this.masterCustomer?.address ??
          null,
        latitude:
          profile.home_latitude ??
          profile.latitude ??
          this.masterCustomer?.latitude ??
          null,
        longitude:
          profile.home_longitude ??
          profile.longitude ??
          this.masterCustomer?.longitude ??
          null,
      };
      this.persistAuthData();
    },

    // -------------------------------------------------------------------
    // Phone normalisation
    // -------------------------------------------------------------------

    formatPhoneNumber(phone: string): string {
      if (!phone) return '';
      const trimmed = phone.trim();
      // E.164 input (from country-picker-aware Login.vue) — pass through
      if (trimmed.startsWith('+')) return trimmed;
      // Legacy Ghana national format fallback
      let digits = trimmed.replace(/\D/g, '');
      if (digits.startsWith('0')) digits = '233' + digits.slice(1);
      if (!digits.startsWith('233')) digits = '233' + digits;
      return '+' + digits;
    },

    // -------------------------------------------------------------------
    // Auth flows
    // -------------------------------------------------------------------

    async checkPhoneStatus(phone: string): Promise<{ status?: string; registered?: boolean }> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().checkPhone({ phone: formattedPhone });
        if (!data.success) throw new Error(data.message ?? 'Failed to check phone status');
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

    async sendSetupOTP(phone: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().sendSetupOtp({ phone: formattedPhone });
        if (!data.success) throw new Error(data.message ?? 'Failed to send OTP');
        this.otpSent = true;
        this.phoneVerifying = formattedPhone;
        return data.data;
      } catch (error: unknown) {
        console.error('Error sending setup OTP:', error);
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
        const data = await this._customerAuthService().setupPassword({
          phone: formattedPhone,
          otp,
          password,
        });
        if (!data.success) throw new Error(data.message ?? 'Failed to setup password');
        this.applyCustomerAuthPayload((data.data as unknown) as CustomerAuthPayload);

        console.log('Password setup successful! User logged in:', this.masterCustomer);

        await this.loadUserStats();

        return data.data;
      } catch (error: unknown) {
        console.error('Error setting up password:', error);
        this.error = error instanceof Error ? error.message : 'Failed to setup password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async register(registrationData: {
      phone: string;
      fname: string;
      lname: string;
      password: string;
      company_id?: number | string;
      email?: string;
      otp?: string;
    }): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(registrationData.phone);
        const data = await this._customerAuthService().register({
          companyId: registrationData.company_id ?? null,
          fname: registrationData.fname,
          lname: registrationData.lname,
          phone: formattedPhone,
          password: registrationData.password,
          ...(registrationData.email !== undefined ? { email: registrationData.email } : {}),
          ...(registrationData.otp !== undefined ? { otp: registrationData.otp } : {}),
        });
        if (!data.success) throw new Error(data.message ?? 'Registration failed');
        this.applyCustomerAuthPayload(data.data as CustomerAuthPayload);

        console.log('Registration successful! User logged in:', this.masterCustomer);

        await this.loadUserStats();

        return data.data;
      } catch (error: unknown) {
        console.error('Error registering customer:', error);
        this.error = error instanceof Error ? error.message : 'Registration failed';
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
        const data = await this._customerAuthService().login({
          phone: formattedPhone,
          password,
        });
        if (!data.success) throw new Error(data.message ?? 'Login failed');
        this.applyCustomerAuthPayload(data.data as CustomerAuthPayload);

        await this.loadUserStats();

        return data.data;
      } catch (error: unknown) {
        console.error('Error logging in:', error);
        this.error = error instanceof Error ? error.message : 'Login failed';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getMyCompanies(): Promise<LinkedCompany[]> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().myCompanies();
        if (!data.success) throw new Error(data.message ?? 'Failed to fetch companies');
        this.companies = data.data ?? [];
        return this.companies;
      } catch (error: unknown) {
        console.error('Error fetching companies:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async triggerCustomerLinking(): Promise<unknown> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().triggerLinking();
        if (!data.success) throw new Error(data.message ?? 'Failed to trigger linking');

        if (data.data?.companies) {
          this.companies = data.data.companies;
          this.persistAuthData();
        }

        return data;
      } catch (error: unknown) {
        console.error('Error triggering customer linking:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async switchCompany(companyId: number | string): Promise<LinkedCompany | null> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().switchCompany({ companyId });
        if (!data.success) throw new Error(data.message ?? 'Failed to switch company');
        this.applyCustomerAuthPayload(data.data as CustomerAuthPayload);
        return this.selectedCompany;
      } catch (error: unknown) {
        console.error('Error switching company:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async getProfile(): Promise<CustomerProfile> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const data = await this._customerAuthService().getProfile();
        if (!data.success) throw new Error(data.message ?? 'Failed to fetch profile');
        this.applyProfileData(data.data as Partial<MasterCustomer>);
        return data.data;
      } catch (error: unknown) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },

    async updateProfile(profileData: Record<string, unknown>): Promise<CustomerProfile> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().updateProfile(
          profileData as Partial<CustomerProfile> & Record<string, unknown>,
        );
        if (!data.success) throw new Error(data.message ?? 'Failed to update profile');
        this.applyProfileData(data.data as Partial<MasterCustomer>);
        return data.data;
      } catch (error: unknown) {
        console.error('Error updating profile:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<unknown> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const data = await this._customerAuthService().changePassword({
          currentPassword,
          newPassword,
        });
        if (!data.success) throw new Error(data.message ?? 'Failed to change password');
        return data;
      } catch (error: unknown) {
        console.error('Error changing password:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async sendResetOTP(phone: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().sendResetOtp({ phone: formattedPhone });
        if (!data.success) throw new Error(data.message ?? 'Failed to send reset code');
        this.otpSent = true;
        this.phoneVerifying = formattedPhone;
        return data.data;
      } catch (error: unknown) {
        console.error('Error sending reset OTP:', error);
        this.error = error instanceof Error ? error.message : 'Failed to send reset code';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async autocompleteLocation(query: string): Promise<LocationSuggestion[]> {
      const trimmed = String(query || '').trim();
      if (trimmed.length < 3) return [];
      const data = await this._customerAuthService().autocompleteLocation({
        q: trimmed,
        limit: 5,
      });
      if (!data.success) throw new Error(data.message ?? 'Failed to load address suggestions');
      return Array.isArray(data.data) ? data.data : [];
    },

    async reverseGeocodeHomeLocation(lat: number, lng: number): Promise<ReverseGeocodeResult> {
      const data = await this._customerAuthService().reverseGeocode({ lat, lng });
      if (!data.success) throw new Error(data.message ?? 'Failed to look up your address');
      return data.data;
    },

    async resetPassword(phone: string, otp: string, newPassword: string): Promise<unknown> {
      this.isLoading = true;
      this.error = null;
      try {
        const formattedPhone = this.formatPhoneNumber(phone);
        const data = await this._customerAuthService().resetPassword({
          phone: formattedPhone,
          otp,
          newPassword,
        });
        if (!data.success) throw new Error(data.message ?? 'Failed to reset password');

        this.phoneVerifying = null;
        this.otpSent = false;

        return data.data;
      } catch (error: unknown) {
        console.error('Error resetting password:', error);
        this.error = error instanceof Error ? error.message : 'Failed to reset password';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // -------------------------------------------------------------------
    // Orders domain
    // -------------------------------------------------------------------

    async processDirectOrder(
      cartItems: Array<{ id: number | string; quantity?: number; discount?: number; tax?: number; notes?: string }>,
      pharmacyId: number | string,
    ): Promise<{ success: true; orderId: number | string; orderData: unknown }> {
      if (!this.isLoggedIn || !this.customerAuthToken) {
        throw new Error('User must be logged in to place an order');
      }
      this.isLoading = true;
      try {
        // The API body uses `qty` (not `quantity`) and includes discount/tax_amount/notes
        // which are not in the shared OrderItem type (that type reflects the response shape).
        // We cast to bypass the interface mismatch here — the service passes the body through.
        const items = cartItems.map((item) => ({
          product_id: item.id as number,
          qty: item.quantity ?? 1,
          discount: item.discount ?? 0,
          tax_amount: item.tax ?? 0,
          notes: item.notes ?? '',
        })) as unknown as import('~/services/orders/ordersService').CreateOrderParams['items'];
        const data = await this._ordersService().create({
          companyId: pharmacyId,
          items,
          notes: `Order from pharmacy ${pharmacyId}`,
        });
        if (!data.success) {
          const error = Object.assign(
            new Error(data.message ?? 'Failed to create order'),
            { errorCode: (data as { error_code?: string }).error_code },
          );
          throw error;
        }
        const orderData = data.data as { order_id?: number | string };
        return { success: true, orderId: orderData.order_id ?? 0, orderData: data.data };
      } catch (error: unknown) {
        console.error('Error processing order:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Order history scoped to a pharmacy.
     *
     * Task 2: when `cursor` is supplied the service passes it to the
     * backend which may return `{ items, next_cursor }`. Both shapes
     * are normalised to an `Order[]` return value; `this.nextCursor`
     * tracks continuation for the caller.
     *
     * Append vs replace: when `cursor` is present the new items are
     * appended to `this.orders`; otherwise the list is replaced.
     */
    async getOrderHistory(filters: {
      status?: string;
      limit?: number;
      offset?: number;
      cursor?: string;
    } = {}): Promise<Order[]> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const pharmacyStore = usePharmacyStore();
        const listParams: import('~/services/orders/ordersService').ListForPharmacyParams = {};
        if (pharmacyStore.currentPharmacy != null) listParams.companyId = pharmacyStore.currentPharmacy;
        if (filters.status !== undefined) listParams.status = filters.status;
        if (filters.limit !== undefined) listParams.limit = filters.limit;
        if (filters.offset !== undefined) listParams.offset = filters.offset;
        if (filters.cursor !== undefined) listParams.cursor = filters.cursor;
        const data = await this._ordersService().listForPharmacy(listParams);
        if (!data.success) throw new Error(data.message ?? 'Failed to fetch orders');

        let newItems: Order[];
        if (isCursorPage<Order>(data.data)) {
          this.nextCursor = data.data.next_cursor;
          newItems = data.data.items;
        } else {
          this.nextCursor = null;
          newItems = (data.data as Order[] | null) ?? [];
        }

        if (filters.cursor !== undefined) {
          this.orders = [...this.orders, ...newItems];
        } else {
          this.orders = newItems;
        }

        return newItems;
      } catch (error: unknown) {
        console.error('Error fetching order history:', error);
        throw error;
      }
    },

    /**
     * All orders across pharmacies for the master customer.
     *
     * Task 2: cursor pagination support mirrors getOrderHistory above.
     *
     * Append vs replace: when `cursor` is present the new items are
     * appended to `this.orders`; otherwise the list is replaced.
     */
    async getAllOrders(filters: {
      status?: string;
      limit?: number;
      offset?: number;
      cursor?: string;
    } = {}): Promise<Order[]> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const allParams: import('~/services/orders/ordersService').ListAllParams = {};
        if (filters.status !== undefined) allParams.status = filters.status;
        if (filters.limit !== undefined) allParams.limit = filters.limit;
        if (filters.offset !== undefined) allParams.offset = filters.offset;
        if (filters.cursor !== undefined) allParams.cursor = filters.cursor;
        const data = await this._ordersService().listAll(allParams);
        if (!data.success) throw new Error(data.message ?? 'Failed to fetch all orders');

        let newItems: Order[];
        if (isCursorPage<Order>(data.data)) {
          this.nextCursor = data.data.next_cursor;
          newItems = data.data.items;
        } else {
          this.nextCursor = null;
          newItems = (data.data as Order[] | null) ?? [];
        }

        if (filters.cursor !== undefined) {
          this.orders = [...this.orders, ...newItems];
        } else {
          this.orders = newItems;
        }

        return newItems;
      } catch (error: unknown) {
        console.error('Error fetching all orders:', error);
        throw error;
      }
    },

    async getOrderDetails(
      orderId: number | string,
      companyId: number | string | null = null,
    ): Promise<Order> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      try {
        const pharmacyStore = usePharmacyStore();
        const company_id = companyId ?? pharmacyStore.currentPharmacy;
        const getByIdParams: import('~/services/orders/ordersService').GetByIdParams = {};
        if (company_id != null) getByIdParams.companyId = company_id;
        const data = await this._ordersService().getById(orderId, getByIdParams);
        if (!data.success) throw new Error(data.message ?? 'Failed to fetch order details');
        return data.data;
      } catch (error: unknown) {
        console.error('Error fetching order details:', error);
        throw error;
      }
    },

    async cancelOrder(
      orderId: number | string,
      companyId: number | string | null = null,
    ): Promise<unknown> {
      if (!this.isLoggedIn || !this.customerAuthToken) throw new Error('User must be logged in');
      this.isLoading = true;
      try {
        const pharmacyStore = usePharmacyStore();
        const company_id = companyId ?? pharmacyStore.currentPharmacy;
        const cancelParams: import('~/services/orders/ordersService').CancelParams = {};
        if (company_id != null) cancelParams.companyId = company_id;
        const data = await this._ordersService().cancel(orderId, cancelParams);
        if (!data.success) throw new Error(data.message ?? 'Failed to cancel order');
        return data;
      } catch (error: unknown) {
        console.error('Error cancelling order:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // -------------------------------------------------------------------
    // Persistence
    // -------------------------------------------------------------------

    persistAuthData(): void {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem('masterCustomer', JSON.stringify(this.masterCustomer));
        localStorage.setItem('selectedCompany', JSON.stringify(this.selectedCompany));
        localStorage.setItem('companies', JSON.stringify(this.companies));
        localStorage.setItem('customerAuthToken', this.customerAuthToken ?? '');
      } catch (error) {
        console.error('Error persisting auth data:', error);
      }
    },

    async checkAuthState(): Promise<MasterCustomer | null> {
      if (typeof window === 'undefined') return null;
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
          this.masterCustomer = JSON.parse(savedMasterCustomer) as MasterCustomer;
          this.customerAuthToken = savedToken;
          if (savedCompanies) this.companies = JSON.parse(savedCompanies) as LinkedCompany[];
          if (savedSelectedCompany) this.selectedCompany = JSON.parse(savedSelectedCompany) as LinkedCompany;
          this.authInitialized = true;

          try {
            await this.getProfile();
            await this.loadUserStats();
          } catch (error: unknown) {
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
      } catch (error: unknown) {
        console.error('Error checking auth state:', error);
        this.clearAuthState();
        this.isLoading = false;
        return null;
      }
    },

    clearAuthState(): void {
      this.masterCustomer = null;
      this.selectedCompany = null;
      this.companies = [];
      this.customerAuthToken = null;
      this.phoneVerifying = null;
      this.otpSent = false;
      this.phoneStatus = null;
      this.nextCursor = null;
      this.orders = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('masterCustomer');
        localStorage.removeItem('selectedCompany');
        localStorage.removeItem('companies');
        localStorage.removeItem('customerAuthToken');
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

    async loadUserStats(): Promise<void> {
      if (!this.isLoggedIn || !this.customerAuthToken) {
        console.log('Cannot load stats: User not logged in');
        return;
      }

      try {
        console.log('Loading user stats...');

        let orders: Order[] = [];

        try {
          orders = await this.getAllOrders({ limit: 100 });
          console.log('Fetched from getAllOrders:', orders?.length ?? 0, 'orders');
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.log('getAllOrders failed, trying getOrderHistory:', msg);
          try {
            orders = await this.getOrderHistory({ limit: 100 });
            console.log('Fetched from getOrderHistory:', orders?.length ?? 0, 'orders');
          } catch (error2: unknown) {
            const msg2 = error2 instanceof Error ? error2.message : String(error2);
            console.error('Both order endpoints failed:', msg2);
          }
        }

        if (Array.isArray(orders) && orders.length > 0) {
          const totalOrders = orders.length;

          const totalSpent = orders.reduce((sum, order) => {
            const raw = (order as unknown) as Record<string, unknown>;
            const amount = parseFloat(
              String(raw['total_amount'] ?? raw['amount'] ?? raw['totalAmount'] ?? raw['total'] ?? 0),
            );
            console.log('Order amount:', amount, 'from order ID:', order.id);
            return sum + amount;
          }, 0);

          console.log('Calculated stats - Orders:', totalOrders, 'Total Spent:', totalSpent);

          if (this.masterCustomer) {
            this.masterCustomer.total_orders = totalOrders;
            this.masterCustomer.total_spent = totalSpent;
            this.persistAuthData();
            console.log('Stats updated and persisted');
          }
        } else {
          console.log('No orders found, setting stats to 0');
          if (this.masterCustomer) {
            this.masterCustomer.total_orders = 0;
            this.masterCustomer.total_spent = 0;
            this.persistAuthData();
          }
        }
      } catch (error: unknown) {
        console.error('Error loading user stats:', error);
        if (this.masterCustomer) {
          this.masterCustomer.total_orders = 0;
          this.masterCustomer.total_spent = 0;
        }
      }
    },
  },
});
