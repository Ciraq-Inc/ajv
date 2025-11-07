// plugins/pharmacy-init.js
import { usePharmacyStore } from "~/stores/pharmacy";
import { useCartStore } from "~/stores/cart";
import { useAdminStore } from "~/stores/admin";
import { useUserStore } from "~/stores/user";

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (!process.client) return;
  
  const route = useRoute();
  
  nuxtApp.hook("app:created", async () => {
    const pharmacyStore = usePharmacyStore();
    const cartStore = useCartStore();
    const adminStore = useAdminStore();
    const userStore = useUserStore();
    
    // Initialize user store (customer authentication)
    await userStore.checkAuthState();
    
    // Initialize admin store session if on admin pages
    if (route.path.startsWith('/admin')) {
      await adminStore.restoreSession();
    }
    
    // Check if we have a pharmacy in the URL
    const pharmacySlug = route.params.pharmacy;
    
    if (pharmacySlug) {
      console.log(`Initializing pharmacy from URL slug: ${pharmacySlug}`);
      
      // Initialize directly from the URL parameter
      if (pharmacySlug !== pharmacyStore.pharmacySlug || !pharmacyStore.currentPharmacy) {
        const success = await pharmacyStore.initializeFromSlug(pharmacySlug);
        
        if (success && pharmacyStore.currentPharmacy) {
          // Also update cart context
          cartStore.setActivePharmacy(pharmacyStore.currentPharmacy, pharmacySlug);
        }
      }
    } else {
      // No pharmacy in URL, restore from storage
      pharmacyStore.restoreFromStorage();
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
        if (pharmacyStore.pharmacySlug && pharmacyStore.pharmacySlug !== cartStore.activePharmacySlug) {
          cartStore.setPharmacySlug(pharmacyStore.pharmacySlug);
        }
      }
    }
  });
});