// middleware/subdomain.js
import { getDatabase, ref as dbRef, get } from "firebase/database";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { hostname, isLocalhost } = useHostname();
  const pharmacyStore = usePharmacyStore();
  const cartStore = useCartStore();
  
  let subdomain;
  let pharmacyId;
  
  // Handle localhost differently for development
  if (isLocalhost) {
    // For local development, get pharmacy from query parameter
    pharmacyId = to.query.pharmacy || "5270468805366809";
  } else {
    // For production, extract subdomain from hostname
    const hostParts = hostname.split(".");
    
    // If we have a subdomain (e.g., "city-pharmacy.medsgh.com")
    if (hostParts.length > 2 && hostParts[0] !== "www") {
      subdomain = hostParts[0];
      
      // Look up the pharmacy ID directly from the subdomains collection
      try {
        const db = getDatabase();
        const subdomainRef = dbRef(db, `subdomains/${subdomain}`);
        const snapshot = await get(subdomainRef);
        
        if (snapshot.exists()) {
          pharmacyId = snapshot.val();
        } else {
          console.error(`No pharmacy found for subdomain: ${subdomain}`);
          
          // Fallback to default pharmacy
          pharmacyId = '5270468805366809';
        }
      } catch (error) {
        console.error("Error resolving pharmacy from subdomain:", error);
        // Fallback to default pharmacy
        pharmacyId = '5270468805366809';
      }
    } else {
      // Main domain - use default pharmacy
      pharmacyId = '5270468805366809';
    }
  }
  
  // Skip if no pharmacy ID
  if (!pharmacyId) {
    return;
  }
  
  // Set the current pharmacy
  pharmacyStore.setCurrentPharmacy(pharmacyId);
  
  // Update cart store
  if (cartStore.setActivePharmacy) {
    cartStore.setActivePharmacy(pharmacyId);
  }
});