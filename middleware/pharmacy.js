// middleware/pharmacy.js
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip for system paths
  const systemPaths = ['/login', '/register', '/forgot-password', '/404', '/500'];
  if (systemPaths.includes(to.path)) {
    return;
  }
  
  // Get the pharmacy store and cart store
  const pharmacyStore = usePharmacyStore();
  const cartStore = useCartStore();
  
  // Check if we're in a pharmacy-specific route
  const pharmacyParam = to.params.pharmacy;
  
  // Restore from storage first (if needed)
  if (!pharmacyStore.currentPharmacy) {
    pharmacyStore.restoreFromStorage();
  }
  
  if (!cartStore.activePharmacy) {
    cartStore.restoreFromStorage();
  }
  
  if (pharmacyParam) {
    // We're in a pharmacy route, set the context
    // Check if it matches current pharmacy slug
    if (pharmacyStore.pharmacySlug !== pharmacyParam) {
      // We need to look up the pharmacy ID from the slug
      const pharmacyId = await pharmacyStore.getPharmacyIdFromSlug(pharmacyParam);
      
      if (!pharmacyId) {
        // Pharmacy not found, redirect to 404 or pharmacy selection
        console.error(`Pharmacy with slug '${pharmacyParam}' not found`);
        return navigateTo({
          path: '/',
          query: { error: 'pharmacy-not-found' }
        });
      }
      
      // Set the pharmacy context
      await pharmacyStore.setCurrentPharmacy(pharmacyId);
      
      // Set the cart pharmacy context
      cartStore.setActivePharmacy(pharmacyId, pharmacyParam);
    }
    
    // Pharmacy is already set correctly, continue
    return;
  }
  
  // Not a pharmacy-specific route, but not a system path
  
  // If pharmacy is selected, redirect to pharmacy route
  if (pharmacyStore.currentPharmacy && pharmacyStore.pharmacySlug) {
    // If we're on the homepage, redirect to pharmacy home
    if (to.path === '/') {
      return navigateTo(`/${pharmacyStore.pharmacySlug}`);
    }
    
    // Otherwise redirect to the same path but with pharmacy prefix
    return navigateTo(pharmacyStore.getPharmacyPath(to.path));
  }
  
  // No pharmacy selected but we're not on the homepage
  // Redirect to homepage with the intended destination as a query param
  if (to.path !== '/') {
    return navigateTo({
      path: '/',
      query: { redirect: to.fullPath }
    });
  }
  
  // On homepage with no pharmacy - this is fine, we'll show pharmacy selection
  return;
});