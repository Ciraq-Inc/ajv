// File: middleware/admin.js
// This middleware checks if the user is logged in and has admin permissions

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server side
  if (process.server) return;
  
  const userStore = useUserStore();
  const pharmacyStore = usePharmacyStore();
  
  // Check authentication
  await userStore.checkAuthState();
  
  // If not logged in, redirect to login page
  if (!userStore.isLoggedIn) {
    return navigateTo('/login');
  }
  
  // Check if user is admin for the current pharmacy
  // This depends on your admin rights implementation
  const isAdmin = await userStore.checkAdminRights();
  
  if (!isAdmin) {
    // If no pharmacy context exists, try to restore it
    if (!pharmacyStore.currentPharmacy) {
      await pharmacyStore.restoreFromStorage();
    }
    
    // Redirect to pharmacy home if user is not an admin
    if (pharmacyStore.pharmacySlug) {
      return navigateTo(`/${pharmacyStore.pharmacySlug}`);
    } else {
      return navigateTo('/');
    }
  }
});