// stores/pharmacy.js - Updated for path-based routing
import { defineStore } from "pinia";
import { getDatabase, ref as dbRef, get } from "firebase/database";

export const usePharmacyStore = defineStore("pharmacy", {
  state: () => ({
    currentPharmacy: null,
    pharmacyData: null,
    products: [],
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
        localStorage.setItem('currentPharmacyId', pharmacyId);
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
          return;
        }

        this.pharmacyData = infoSnapshot.val();
        
        // Update pharmacySlug from pharmacy data if available
        if (this.pharmacyData.subdomain) {
          this.pharmacySlug = this.pharmacyData.subdomain;
          
          // Store in session/localStorage for persistence
          if (process.client) {
            localStorage.setItem('currentPharmacySlug', this.pharmacySlug);
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
    
    async fetchProducts() {
      if (!this.currentPharmacy) return [];
      
      try {
        const db = getDatabase();
        const productsSnapshot = await get(
          dbRef(db, `pharmacies/${this.currentPharmacy}/products`)
        );
        
        const productsData = productsSnapshot.val();
        
        if (productsData && typeof productsData === 'object') {
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
    
    setPharmacySlug(slug) {
      this.pharmacySlug = slug;
      
      // Store in session/localStorage for persistence
      if (process.client) {
        localStorage.setItem('currentPharmacySlug', slug);
      }
    },
    
    // Get pharmacy ID from the slug (path segment)
    async getPharmacyIdFromSlug(slug) {
      if (!slug) return null;
      
      try {
        const db = getDatabase();
        const pharmacyIdSnapshot = await get(dbRef(db, `subdomains/${slug}`));
        
        if (pharmacyIdSnapshot.exists()) {
          return pharmacyIdSnapshot.val();
        }
        
        return null;
      } catch (error) {
        console.error("Error getting pharmacy ID from slug:", error);
        return null;
      }
    },
    
    // Restore pharmacy context from localStorage if needed
    restoreFromStorage() {
      if (!process.client) return;
      
      const storedPharmacyId = localStorage.getItem('currentPharmacyId');
      const storedPharmacySlug = localStorage.getItem('currentPharmacySlug');
      
      if (storedPharmacyId && !this.currentPharmacy) {
        this.currentPharmacy = storedPharmacyId;
        this.fetchPharmacyData();
      }
      
      if (storedPharmacySlug && !this.pharmacySlug) {
        this.pharmacySlug = storedPharmacySlug;
      }
    },
    
    // Clear pharmacy data (for logout or switching)
    clearPharmacyData() {
      this.currentPharmacy = null;
      this.pharmacyData = null;
      this.products = [];
      this.pharmacySlug = null;
      
      if (process.client) {
        localStorage.removeItem('currentPharmacyId');
        localStorage.removeItem('currentPharmacySlug');
        sessionStorage.removeItem('currentPharmacyId');
        sessionStorage.removeItem('currentPharmacySlug');
      }
    }
  },
  
  getters: {
    hasProducts: (state) => Array.isArray(state.products) && state.products.length > 0,
    isNotFound: (state) => state.notFound,
    pathPrefix: (state) => {
      if (state.pharmacySlug) {
        return `/${state.pharmacySlug}`;
      }
      return '';
    },
    // Generate path with pharmacy slug prefixed
    getPharmacyPath: (state) => (path) => {
      if (state.pharmacySlug) {
        // Ensure path starts with / if not empty
        const normalizedPath = path && !path.startsWith('/') ? `/${path}` : path;
        return `/${state.pharmacySlug}${normalizedPath || ''}`;
      }
      return path || '/';
    }
  },
});