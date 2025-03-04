// middleware/subdomain.js
export default defineNuxtRouteMiddleware((to, from) => {
  const host = process.server ? useRequestHeaders().host : window.location.host;
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  let pharmacyId;

  // Handle localhost differently for development
  if (isLocalhost) {
    // For local development, get pharmacy from query parameter
    // e.g. localhost:3000?pharmacy=lesson-pharmacy
    pharmacyId = to.query.pharmacy || null;
  } else {
    // For production, extract from hostname
    const hostParts = host.split(".");
    // If we have a subdomain (e.g., "lesson-pharmacy.medsgh.com")
    if (hostParts.length > 2 && hostParts[0] !== "www") {
      pharmacyId = hostParts[0];
    }
  }

  // Skip for the main domain or if no pharmacy ID
  if (!pharmacyId) {
    return;
  }

  // Set up the stores
  const pharmacyStore = usePharmacyStore();
  const cartStore = useCartStore();

  // Set the current pharmacy
  pharmacyStore.setCurrentPharmacy(pharmacyId);

  // Set the cart's active pharmacy
  cartStore.setActivePharmacy(pharmacyId);
});
