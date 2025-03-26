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
  
  // Always restore from storage first to ensure we have the latest state
  pharmacyStore.restoreFromStorage();
  cartStore.restoreFromStorage();
  
  console.log('Pharmacy middleware running:', {
    pharmacyParam,
    currentPharmacy: pharmacyStore.currentPharmacy,
    pharmacySlug: pharmacyStore.pharmacySlug,
    cartPharmacy: cartStore.activePharmacy,
    cartSlug: cartStore.activePharmacySlug
  });
  
  if (pharmacyParam) {
    console.log(`Accessing pharmacy route with slug: ${pharmacyParam}`);

    // If pharmacy is already loaded and matches the URL param, continue
    if (pharmacyStore.pharmacySlug === pharmacyParam && pharmacyStore.currentPharmacy) {
      console.log('Pharmacy already loaded correctly, continuing');
      
      // Make sure we have pharmacy data loaded
      if (!pharmacyStore.pharmacyData) {
        await pharmacyStore.fetchPharmacyData();
      }
      
      // Ensure cart is in sync with current pharmacy context
      cartStore.validatePharmacyContext();
      
      return;
    }

    try {
      console.log('Looking up pharmacy ID for slug:', pharmacyParam);
      // Looking up the pharmacy ID from the slug
      const pharmacyId = await pharmacyStore.getPharmacyIdFromSlug(pharmacyParam);
      console.log('Lookup result:', pharmacyId);
      
      if (!pharmacyId) {
        // Pharmacy not found, redirect to 404 or pharmacy selection
        console.error(`Pharmacy with slug '${pharmacyParam}' not found`);
        return navigateTo({
          path: '/',
          query: { error: 'pharmacy-not-found' }
        });
      }

      // Set the pharmacy context
      console.log('Setting pharmacy context:', pharmacyId, pharmacyParam);
      await pharmacyStore.setCurrentPharmacy(pharmacyId);
      pharmacyStore.setPharmacySlug(pharmacyParam);
      
      // Set the cart pharmacy context - this will prompt for confirmation if needed
      const cartContextSet = cartStore.setActivePharmacy(pharmacyId, pharmacyParam);
      
      // If user canceled pharmacy switch, go back to previous page
      if (!cartContextSet) {
        console.log('User canceled pharmacy switch due to cart items');
        return navigateTo(from.fullPath);
      }
      
      console.log('Pharmacy context set successfully');
    } catch (error) {
      console.error('Error while processing pharmacy route:', error);
      return navigateTo({
        path: '/',
        query: { error: 'pharmacy-error' }
      });
    }
    
    // Pharmacy is now set correctly, continue
    return;
  }
  
  // If pharmacy is selected but not in URL, redirect to pharmacy route
  if (pharmacyStore.currentPharmacy && pharmacyStore.pharmacySlug) {
    console.log('Redirecting to pharmacy route', pharmacyStore.pharmacySlug);
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
    console.log('No pharmacy selected, redirecting to homepage with redirect param');
    return navigateTo({
      path: '/',
      query: { redirect: to.fullPath }
    });
  }
  
  // On homepage with no pharmacy - this is fine, we'll show pharmacy selection
  console.log('On homepage with no pharmacy selected');
  return;
});