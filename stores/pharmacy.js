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
        localStorage.setItem("currentPharmacyId", pharmacyId);
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
            localStorage.setItem("currentPharmacySlug", this.pharmacySlug);
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

        if (productsData && typeof productsData === "object") {
          try {
            // Map products data to array with ids
            const productsArray = Object.entries(productsData).map(
              ([id, data]) => ({
                id,
                ...data,
              })
            );

            // Sort products alphabetically by name
            this.products = productsArray.sort((a, b) => {
              const nameA = (a.name || "").toLowerCase();
              const nameB = (b.name || "").toLowerCase();

              // Check if names start with a number
              const aStartsWithNumber = /^\d/.test(nameA);
              const bStartsWithNumber = /^\d/.test(nameB);

              // If one starts with a number and the other with a letter
              if (aStartsWithNumber && !bStartsWithNumber) {
                return 1; // a goes after b (numbers last)
              } else if (!aStartsWithNumber && bStartsWithNumber) {
                return -1; // a goes before b (letters first)
              }

              // If both are the same type (both letters or both numbers), use standard alphabetical sorting
              return nameA.localeCompare(nameB, undefined, { numeric: true });
            });
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
        localStorage.setItem("currentPharmacySlug", slug);
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
          localStorage.setItem("currentPharmacyId", pharmacyId);
          localStorage.setItem("currentPharmacySlug", slug);
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

    // Restore pharmacy context from localStorage if needed
    restoreFromStorage() {
      if (!process.client) return;

      const storedPharmacyId = localStorage.getItem("currentPharmacyId");
      const storedPharmacySlug = localStorage.getItem("currentPharmacySlug");

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
        localStorage.removeItem("currentPharmacyId");
        localStorage.removeItem("currentPharmacySlug");
        sessionStorage.removeItem("currentPharmacyId");
        sessionStorage.removeItem("currentPharmacySlug");
      }
    },
  },

  getters: {
    hasProducts: (state) =>
      Array.isArray(state.products) && state.products.length > 0,
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
