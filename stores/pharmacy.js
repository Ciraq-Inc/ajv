// store/pharmacy.js

import { defineStore } from "pinia";
import { otpService } from "~/utils/otpService";

export const usePharmacyStore = defineStore("pharmacy", {
  state: () => ({
    currentPharmacy: null,
    pharmacyData: null,
    products: [],
    customers: [],
    isLoading: false,
    error: null,
    notFound: false,
    pharmacySlug: null,
  }),

  actions: {
    async setCurrentPharmacy(pharmacyId) {
      this.currentPharmacy = pharmacyId;

      // Store in session/localStorage for persistence
      if (process.client) {
        try {
          localStorage.setItem("currentPharmacyId", pharmacyId);
        } catch (error) {
          console.error("Failed to save pharmacy ID to localStorage:", error);
        }
      }

      await this.fetchPharmacyData();
    },

    async fetchPharmacyData() {
      if (!this.currentPharmacy) return;

      this.isLoading = true;
      this.error = null;
      this.notFound = false;

      try {
        const config = useRuntimeConfig();
        const baseURL = config.public.apiBase;

        // Fetch pharmacy info via API
        const response = await fetch(`${baseURL}/api/companies/${this.currentPharmacy}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            this.notFound = true;
            this.pharmacyData = null;
            this.products = [];
            this.customers = [];
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch pharmacy data');
        }

        this.pharmacyData = {
          id: data.data.id,
          uiid: data.data.uiid,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.tel1 || data.data.tel2,
          tel1: data.data.tel1,
          tel2: data.data.tel2,
          whatsapp_number: data.data.whatsapp_number,
          address: data.data.address1,
          address1: data.data.address1,
          address2: data.data.address2,
          location: data.data.location,
          companytype: data.data.companytype,
          domain_name: data.data.domain_name,
          logo: data.data.logo,
          shop_banner: data.data.shop_banner,
          subdomain: data.data.domain_name, // Use domain_name as subdomain
        };

        // Update pharmacySlug from pharmacy data if available
        if (this.pharmacyData.domain_name) {
          this.pharmacySlug = this.pharmacyData.domain_name;

          // Store in session/localStorage for persistence
          if (process.client) {
            try {
              localStorage.setItem("currentPharmacySlug", this.pharmacySlug);
            } catch (error) {
              console.error("Failed to save pharmacy slug to localStorage:", error);
            }
          }
        }

        // Fetch pharmacy products
        await this.fetchProducts();
      } catch (error) {
        console.error("Error fetching pharmacy data:", error);
        this.error = error.message;
        this.products = [];
      } finally {
        this.isLoading = false;
      }
    },

    // fetch products
    async fetchProducts() {
      if (!this.currentPharmacy) return [];

      try {
        const config = useRuntimeConfig();
        const baseURL = config.public.apiBase;

        // Fetch products via API
        const response = await fetch(`${baseURL}/api/products?company_id=${this.currentPharmacy}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch products');
        }

        // Map API response to expected format
        this.products = (data.data || []).map(product => ({
          id: product.id,
          barcode: product.barcode,
          brandName: product.brand_name,
          masterName: product.master_name,
          dosage: product.dosage,
          strength: product.strength,
          unit: product.unit,
          buyUnit: product.buy_unit,
          sellUnit: product.sell_unit,
          costPrice: product.cost_price,
          sellingPrice: product.selling_price,
          markup: product.markup,
          discount: product.discount,
          stockQty: product.stock_qty,
          reorder: product.reorder,
          shelves: product.shelves,
          productExpiry: product.product_expiry,
          hasMultiExpiryDate: product.has_multi_expiry_date,
          hasTax: product.has_tax,
          multi: product.multi,
          supplier: product.supplier,
          supplierId: product.supplier_id,
          selectedProdClass: product.selected_prod_class,
          isActive: product.is_active,
          inStock: product.stock_qty > 0,
          quantity: product.stock_qty,
        }));

        return this.products;
      } catch (error) {
        console.error("Error fetching products:", error);
        this.products = [];
        throw error;
      }
    },

    // fetch customers - Keep for backward compatibility but note: customers should use auth API
    async fetchCustomers() {
      if (!this.currentPharmacy) return [];

      try {
        // For now, customers list is not exposed via public API
        // Customer authentication happens via /api/auth/customer endpoints
        // This method is kept for backward compatibility with existing code
        console.warn('fetchCustomers: Customer data should be managed via authentication API');
        this.customers = [];
        return this.customers;
      } catch (error) {
        console.error("Error fetching customers:", error);
        this.customers = [];
        throw error;
      }
    },

    // New method to set customers data (useful when loaded from another service)
    setCustomers(customersData) {
      this.customers = customersData;
    },

    setPharmacySlug(slug) {
      this.pharmacySlug = slug;

      // Store in session/localStorage for persistence
      if (process.client) {
        try {
          localStorage.setItem("currentPharmacySlug", slug);
        } catch (error) {
          console.error("Failed to save pharmacy slug to localStorage:", error);
        }
      }
    },

    async getPharmacyIdFromSlug(slug) {
      if (!slug) {
        console.log("No slug provided");
        return null;
      }

      console.log(`Looking up pharmacy ID for slug: '${slug}'`);

      try {
        const config = useRuntimeConfig();
        const baseURL = config.public.apiBase;

        // Fetch pharmacy by domain name
        const response = await fetch(`${baseURL}/api/companies/domain/${encodeURIComponent(slug)}`);

        if (!response.ok) {
          if (response.status === 404) {
            console.log(`No pharmacy found for slug: '${slug}'`);
            return null;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          console.log(`Found pharmacy ID: ${data.data.id} for slug: ${slug}`);
          return data.data.id.toString();
        }

        console.log(`No pharmacy ID found for slug: '${slug}'`);
        return null;
      } catch (error) {
        console.error("Error getting pharmacy ID from slug:", error);
        return null;
      }
    },

    async initializeFromSlug(slug) {
      if (!slug) return false;

      this.isLoading = true;
      this.error = null;
      this.notFound = false;

      try {
        // Get pharmacy ID from slug
        const pharmacyId = await this.getPharmacyIdFromSlug(slug);

        if (!pharmacyId) {
          this.notFound = true;
          return false;
        }

        // Set pharmacy context
        this.currentPharmacy = pharmacyId;
        this.pharmacySlug = slug;

        // Store in local storage
        if (process.client) {
          try {
            localStorage.setItem("currentPharmacyId", pharmacyId);
            localStorage.setItem("currentPharmacySlug", slug);
          } catch (error) {
            console.error("Failed to save pharmacy data to localStorage:", error);
          }
        }

        // Fetch pharmacy data
        await this.fetchPharmacyData();

        return true;
      } catch (error) {
        console.error("Error initializing pharmacy from slug:", error);
        this.error = error.message;
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // Find a customer by phone number (with flexible matching)
    findCustomerByPhone(phone) {
      console.log(`Finding customer with phone: ${phone}`);

      // Note: With the new REST API architecture, customer lookup
      // should happen server-side during authentication
      console.warn('findCustomerByPhone: This method is deprecated. Use authentication API instead.');

      if (!this.customers || !Array.isArray(this.customers) || this.customers.length === 0) {
        console.log("No customers loaded in store");
        return null;
      }
      
      if (!phone) {
        console.error("No phone number provided to find customer");
        return null;
      }

      // Format the input phone number for consistent comparison
      const formattedInputPhone = otpService.formatPhoneNumber(phone);

      // First try to find an exact match
      const exactMatch = this.customers.find(customer => 
        customer.phone === formattedInputPhone
      );

      if (exactMatch) {
        console.log(`Found exact phone match: ${exactMatch.id}`);
        return exactMatch;
      }
      
      console.warn(`No customer found with phone number: ${formattedInputPhone}`);
      return null;
    },

// Helper method to ensure customers are loaded
    async ensureCustomersLoaded() {
      // With REST API, customers are managed via authentication endpoints
      // This method is kept for backward compatibility
      console.warn('ensureCustomersLoaded: Customer management now handled via authentication API');
      return;
    },


    // Restore pharmacy context from localStorage if needed
    async restoreFromStorage() {
      if (!process.client) return;

      try {
        const storedPharmacyId = localStorage.getItem("currentPharmacyId");
        const storedPharmacySlug = localStorage.getItem("currentPharmacySlug");

        if (storedPharmacyId && !this.currentPharmacy) {
          this.currentPharmacy = storedPharmacyId;
          await this.fetchPharmacyData();
        }

        if (storedPharmacySlug && !this.pharmacySlug) {
          this.pharmacySlug = storedPharmacySlug;
        }
      } catch (error) {
        console.error("Error restoring pharmacy data from storage:", error);
      }
    },

    // Clear pharmacy data (for logout / switching)
    clearPharmacyData() {
      this.currentPharmacy = null;
      this.pharmacyData = null;
      this.products = [];
      this.customers = [];
      this.pharmacySlug = null;

      if (process.client) {
        try {
          localStorage.removeItem("currentPharmacyId");
          localStorage.removeItem("currentPharmacySlug");
          sessionStorage.removeItem("currentPharmacyId");
          sessionStorage.removeItem("currentPharmacySlug");
        } catch (error) {
          console.error("Failed to clear pharmacy data from storage:", error);
        }
      }
    },
  },

  getters: {
    hasProducts: (state) =>
      Array.isArray(state.products) && state.products.length > 0,
    inStockProducts: (state) =>
      state.products.filter(product => product.quantity > 0 || product.inStock === true),
    hasCustomers: (state) =>
      Array.isArray(state.customers) && state.customers.length > 0,
    isNotFound: (state) => state.notFound,
    pathPrefix: (state) => {
      if (state.pharmacySlug) {
        return `/${state.pharmacySlug}`;
      }
      return "";
    },
    
    // Generate path with pharmacy slug prefixed
    getPharmacyPath: (state) => (path) => {
      if (state.pharmacySlug) {
        // Ensure path starts with / if not empty
        const normalizedPath =
          path && !path.startsWith("/") ? `/${path}` : path;
        return `/${state.pharmacySlug}${normalizedPath || ""}`;
      }
      return path || "/";
    },
  },
});