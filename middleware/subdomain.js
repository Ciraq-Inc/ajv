// middleware/subdomain.js
export default defineNuxtRouteMiddleware((to, from) => {
  const { hostname, isLocalhost } = useHostname();

  let pharmacyId;

  // Handle localhost differently for development
  if (isLocalhost) {
    // For local development, get pharmacy from query parameter
    pharmacyId = to.query.pharmacy || "arzthena-jv-pharmacy";
  } else {
    // For production, extract from hostname
    const hostParts = hostname.split(".");

    // If we have a subdomain (e.g., "lesson-pharmacy.medsgh.com")
    if (hostParts.length > 2 && hostParts[0] !== "www") {
      pharmacyId = hostParts[0];
    } else {
      pharmacyId = 'arzthena-jv-pharmacy'
    }
  }

  // Skip for the main domain or if no pharmacy ID
  if (!pharmacyId) {
    return;
  }

  // Set up the stores
  const pharmacyStore = usePharmacyStore();

  // Set the current pharmacy
  pharmacyStore.setCurrentPharmacy(pharmacyId);

   const cartStore = useCartStore()
  if (cartStore.setActivePharmacy) {
    cartStore.setActivePharmacy(pharmacyId)
  }
});
