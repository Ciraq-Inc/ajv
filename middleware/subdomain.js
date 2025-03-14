// middleware/subdomain.js - Updated for new database structure
import { getDatabase, ref as dbRef, get } from "firebase/database";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { hostname, isLocalhost } = useHostname();
  const pharmacyStore = usePharmacyStore();
  const cartStore = useCartStore();

  const DEFAULT_PHARMACY_ID = '5270468805366809';
  
  let subdomain;
  let pharmacyId;
  
  try {
    // Handle localhost differently for development
    if (isLocalhost) {
      // For local development, get pharmacy from query parameter
      if (to.query.subdomain) {
        subdomain = to.query.subdomain;
        console.log(`Development mode: Testing subdomain ${subdomain}`);
        
        // Look up the pharmacy ID in the new subdomains collection
        const db = getDatabase();
        const pharmacyIdSnapshot = await get(dbRef(db, `subdomains/${subdomain}`));
        
        if (pharmacyIdSnapshot.exists()) {
          pharmacyId = pharmacyIdSnapshot.val();
          console.log(`Found pharmacy ID ${pharmacyId} for subdomain: ${subdomain}`);
        } else {
          console.warn(`Dev mode: No pharmacy found for test subdomain: ${subdomain}`);
          pharmacyId = to.query.pharmacy || DEFAULT_PHARMACY_ID;
        }
      } else {
        pharmacyId = to.query.pharmacy || DEFAULT_PHARMACY_ID;
      }
      console.log(`Development mode: Using pharmacy ID ${pharmacyId}`);
    } else {
      // For production, extract subdomain from hostname
      const hostParts = hostname.split(".");
      
      // If we have a subdomain (e.g., "city-pharmacy.medsgh.com")
      if (hostParts.length > 2 && hostParts[0] !== "www") {
        subdomain = hostParts[0];
        console.log(`Detected subdomain: ${subdomain}`);
        
        // Look up the pharmacy ID in the new subdomains collection
        const db = getDatabase();
        const pharmacyIdSnapshot = await get(dbRef(db, `subdomains/${subdomain}`));
        
        if (pharmacyIdSnapshot.exists()) {
          pharmacyId = pharmacyIdSnapshot.val();
          console.log(`Found pharmacy ID ${pharmacyId} for subdomain: ${subdomain}`);
        } else {
          console.warn(`No pharmacy found for subdomain: ${subdomain}`);
          return navigateTo('/error/pharmacy-not-found');
        }
      } else {
        // Main domain - use default pharmacy
        console.log(`Main domain or www subdomain - using default pharmacy`);
        pharmacyId = DEFAULT_PHARMACY_ID;
      }
    }
    
    // Skip if no pharmacy ID is resolved
    if (!pharmacyId) {
      console.error("No pharmacy ID could be resolved");
      return navigateTo('/error/pharmacy-not-found');
    }
    
    // Set the current pharmacy in the store
    await pharmacyStore.setCurrentPharmacy(pharmacyId);
    
    // Update cart store
    if (cartStore.setActivePharmacy) {
      await cartStore.setActivePharmacy(pharmacyId);
    }
    
    // Add pharmacy ID to the context for components to use
    if (to.meta) {
      to.meta.pharmacyId = pharmacyId;
      to.meta.subdomain = subdomain;
    }
  } catch (error) {
    console.error("Error in subdomain middleware:", error);
    
    // Set fallback pharmacy
    pharmacyId = DEFAULT_PHARMACY_ID;
    await pharmacyStore.setCurrentPharmacy(pharmacyId);
    
    return navigateTo('/error/system-error');
  }
});