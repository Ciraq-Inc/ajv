// stores/pharmacy.js - Updated with subdomain handling
import { defineStore } from "pinia";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { subdomainService } from "@/services/subdomain";

export const usePharmacyStore = defineStore("pharmacy", {
  state: () => ({
    currentPharmacy: null,
    pharmacyData: null,
    products: [],
    isLoading: false,
    error: null,
    notFound: false,
    subdomain: null,
  }),

  actions: {
    setCurrentPharmacy(pharmacyId) {
      this.currentPharmacy = pharmacyId;
      this.fetchPharmacyData();
      this.fetchSubdomain();
    },
    
    async fetchSubdomain() {
      if (!this.currentPharmacy) return;
      
      try {
        const subdomain = await subdomainService.getSubdomainFromPharmacyId(this.currentPharmacy);
        this.subdomain = subdomain;
      } catch (error) {
        console.error("Error fetching subdomain:", error);
      }
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
        
        // Update subdomain from pharmacy data
        if (this.pharmacyData.subdomain) {
          this.subdomain = this.pharmacyData.subdomain;
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
    
    async setSubdomain(newSubdomain) {
      if (!this.currentPharmacy) return false;
      
      try {
        await subdomainService.setSubdomain(this.currentPharmacy, newSubdomain);
        this.subdomain = newSubdomain;
        if (this.pharmacyData) {
          this.pharmacyData.subdomain = newSubdomain;
        }
        return true;
      } catch (error) {
        throw error;
      }
    },
    
    // Fetch pharmacy by subdomain
    async fetchPharmacyBySubdomain(subdomain) {
      this.isLoading = true;
      this.error = null;
      this.notFound = false;
      
      try {
        const pharmacyId = await subdomainService.getPharmacyIdFromSubdomain(subdomain);
        
        if (!pharmacyId) {
          this.notFound = true;
          this.isLoading = false;
          return false;
        }
        
        this.currentPharmacy = pharmacyId;
        this.subdomain = subdomain;
        
        await this.fetchPharmacyData();
        return true;
      } catch (error) {
        console.error("Error fetching pharmacy by subdomain:", error);
        this.error = error.message;
        return false;
      } finally {
        this.isLoading = false;
      }
    }
  },
  
  getters: {
    hasProducts: (state) => Array.isArray(state.products) && state.products.length > 0,
    isNotFound: (state) => state.notFound,
    subdomainUrl: (state) => {
      if (state.subdomain) {
        return `https://${state.subdomain}.medsgh.com`;
      }
      return null;
    }
  },
});