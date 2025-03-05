// stores/pharmacy.js
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
  }),

  actions: {
    setCurrentPharmacy(pharmacyId) {
      this.currentPharmacy = pharmacyId;
      this.fetchPharmacyData();
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

        // Fetch pharmacy products
        const productsSnapshot = await get(
          dbRef(db, `pharmacies/${this.currentPharmacy}/products`)
        );
        
        // Fix: Properly handle null products from Firebase
        const productsData = productsSnapshot.val();
        
        // Safely convert Firebase data to array
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
          console.log("No products found for this pharmacy:", this.currentPharmacy);
          this.products = [];
        }
        
        // Debug output
        console.log(`Loaded ${this.products.length} products for ${this.currentPharmacy}`);
        if (this.products.length > 0) {
          console.log("Sample product:", this.products[0]);
        }
        
      } catch (error) {
        console.error("Error fetching pharmacy data:", error);
        this.error = error.message;
        this.products = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    // Add a method that can be called explicitly from components
    async fetchProducts() {
      if (!this.currentPharmacy) return;
      
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
    
    // Add a method to get the pharmacy's subdomain
    getPharmacySubdomain() {
      if (this.pharmacyData && this.pharmacyData.subdomain) {
        return this.pharmacyData.subdomain;
      }
      
      // Fallback - if the subdomain isn't set yet
      if (this.pharmacyData && this.pharmacyData.name) {
        return this.pharmacyData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      
      return null;
    }
  },
  
  getters: {
    hasProducts: (state) => Array.isArray(state.products) && state.products.length > 0,
    isNotFound: (state) => state.notFound,
    subdomain: (state) => {
      if (state.pharmacyData && state.pharmacyData.subdomain) {
        return state.pharmacyData.subdomain;
      }
      return null;
    }
  },
});