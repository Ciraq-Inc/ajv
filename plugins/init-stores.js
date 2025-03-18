// plugins/init-stores.js
import { usePharmacyStore } from "~/stores/pharmacy";
import { useCartStore } from "~/stores/cart";

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (process.client) {
    nuxtApp.hook("app:created", () => {
      const pharmacyStore = usePharmacyStore();
      const cartStore = useCartStore();

      // Initialize pharmacy store
      pharmacyStore.restoreFromStorage();

      // Initialize cart store
      cartStore.restoreFromStorage();

      // Sync store data if needed
      if (pharmacyStore.currentPharmacy && cartStore.activePharmacy) {
        // If pharmacy IDs don't match but they should, fix it
        if (pharmacyStore.currentPharmacy !== cartStore.activePharmacy) {
          console.warn(
            "Pharmacy store and cart store have different pharmacies, syncing..."
          );
          cartStore.setActivePharmacy(
            pharmacyStore.currentPharmacy,
            pharmacyStore.pharmacySlug
          );
        }

        // If slugs don't match but they should, fix it
        if (
          pharmacyStore.pharmacySlug &&
          pharmacyStore.pharmacySlug !== cartStore.activePharmacySlug
        ) {
          cartStore.setPharmacySlug(pharmacyStore.pharmacySlug);
        }
      }
    });
  }
});
