// Admin Authentication Middleware
// Protects admin routes and ensures valid admin session

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return;

  const adminStore = useAdminStore();

  // Try to restore session from localStorage
  const sessionRestored = await adminStore.restoreSession();

  // If no valid session, redirect to login
  if (!sessionRestored && !adminStore.isAuthenticated) {
    // Store the intended destination
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

  // Check role-based access if route requires specific role
  if (to.meta.requiredRole) {
    const hasRequiredRole = adminStore.hasRole(to.meta.requiredRole);
    
    if (!hasRequiredRole) {
      // Insufficient permissions
      console.warn(`Access denied. Required role: ${to.meta.requiredRole}`);
      return navigateTo('/admin/unauthorized');
    }
  }
});
