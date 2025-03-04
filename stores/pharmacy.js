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
          dbRef(db, `${this.currentPharmacy}/info`)
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
          dbRef(db, `${this.currentPharmacy}/products`)
        );
        const productsData = productsSnapshot.val();

        if (productsData) {
          this.products = Object.entries(productsData).map(([id, data]) => ({
            id,
            ...data,
          }));
        } else {
          this.products = [];
        }
      } catch (error) {
        console.error("Error fetching pharmacy data:", error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },
  },
  getters: {
    hasProducts: (state) => state.products.length > 0,
    isNotFound: (state) => state.notFound,
  },
});
