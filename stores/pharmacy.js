// store/pharmacy.js

import { defineStore } from "pinia";
import { getDatabase, ref as dbRef, get } from "firebase/database";
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
        const db = getDatabase();

        // Fetch pharmacy info
        const infoSnapshot = await get(
          dbRef(db, `pharmacies/${this.currentPharmacy}/info`)
        );

        if (!infoSnapshot.exists()) {
          this.notFound = true;
          this.isLoading = false;
          this.pharmacyData = null;
          this.products = [];
          this.customers = [];
          return;
        }

        this.pharmacyData = infoSnapshot.val();

        // Update pharmacySlug from pharmacy data if available
        if (this.pharmacyData.subdomain) {
          this.pharmacySlug = this.pharmacyData.subdomain;

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
        const db = getDatabase();
        const productsSnapshot = await get(
          dbRef(db, `pharmacies/${this.currentPharmacy}/products`)
        );

        const productsData = productsSnapshot.val();

        if (productsData && typeof productsData === "object") {
          try {
            this.products = Object.entries(productsData).map(([id, data]) => ({
              id,
              ...data,
            }));
          } catch (error) {
            console.error("Error processing products data:", error);
            this.products = [];
          }
        } else {
          this.products = [];
        }

        return this.products;
      } catch (error) {
        console.error("Error fetching products:", error);
        this.products = [];
        throw error;
      }
    },

    // fetch customers
    async fetchCustomers() {
      if (!this.currentPharmacy) return [];

      try {
        const db = getDatabase();
        const customersSnapshot = await get(
          dbRef(db, `pharmacies/${this.currentPharmacy}/customers`)
        );

        const customersData = customersSnapshot.val();

        if (customersData && typeof customersData === "object") {
          try {
            this.customers = Object.entries(customersData).map(([id, data]) => ({
              id,
              ...data,
            }));
          } catch (error) {
            console.error("Error processing customers data:", error);
            this.customers = [];
          }
        } else {
          this.customers = [];
        }

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
        const db = getDatabase();
        console.log("Database reference obtained");

        const subdomainsRef = dbRef(db, "subdomains");
        const subdomainsSnapshot = await get(subdomainsRef);

        if (!subdomainsSnapshot.exists()) {
          console.log("No subdomains found in database");
          return null;
        }

        const subdomains = subdomainsSnapshot.val();
        console.log("Subdomains data retrieved:", subdomains);

        // Search for the matching slug
        for (const [id, value] of Object.entries(subdomains)) {
          if (value === slug) {
            console.log(`Found pharmacy ID: ${id} for slug: ${slug}`);
            return id;
          }
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
      )

       if (exactMatch) {
        console.log(`Found exact phone match: ${exactMatch.id}`);
        return exactMatch;
      }
      
      // If no exact match, try using otpService's compare method
      const customer = this.customers.find(customer => {
        if (!customer.phone) return false;
        
        const isMatch = otpService.comparePhoneNumbers(customer.phone, formattedInputPhone);
        console.log(`Comparing: ${customer.phone} with ${formattedInputPhone}: ${isMatch ? 'MATCH' : 'no match'}`);
        
        return isMatch;
      });

      if (customer) {
        console.log(`Found customer using flexible matching: ${customer.id}`);
        return customer;
      }
      
      // If still no match, log available phone numbers for debugging
      console.warn(`No customer found with phone number: ${formattedInputPhone}`);
      console.log("Available customer phones:", 
        this.customers
          .filter(c => c.phone) 
          .map(c => ({id: c.id, phone: c.phone}))
          .slice(0, 5) // Show just the first 5 for debugging
      );
      
      return null;
    },

// Helper method to ensure customers are loaded
    async ensureCustomersLoaded() {
      if (!this.customers || this.customers.length === 0) {
        console.log("No customers loaded, fetching from database...");
        await this.fetchCustomers();
        console.log(`Loaded ${this.customers.length} customers`);
      }
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