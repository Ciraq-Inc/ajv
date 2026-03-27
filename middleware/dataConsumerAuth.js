// Data Consumer Authentication Middleware
// Protects /dataconsumer/* routes and ensures valid data_consumer session

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return;

  const adminStore = useAdminStore();

  // Try to restore session from localStorage
  const sessionRestored = await adminStore.restoreSession();

  // If no valid session, redirect to login
  if (!sessionRestored && !adminStore.isAuthenticated) {
    if (process.client) {
      localStorage.setItem('adminIntendedRoute', to.fullPath);
    }
    return navigateTo('/admin/login');
  }

  // Check if token is still valid
  if (adminStore.isAuthenticated) {
    const isValid = await adminStore.verifyToken();
    
    if (!isValid) {
      // Token expired or invalid, logout and redirect
      adminStore.logout();
      
      if (process.client) {
        localStorage.setItem('adminIntendedRoute', to.fullPath);
      }
      
      return navigateTo('/admin/login');
    }
  }

  // CRITICAL: Only data_consumer role allowed on /dataconsumer/* routes
  if (adminStore.getRole !== 'data_consumer') {
    console.warn('Access denied. This portal is for data consumers only.');
    return navigateTo('/admin/login?error=access-denied');
  }
});
