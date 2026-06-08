// Admin Authentication Middleware
// Protects admin routes and ensures valid admin session

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return;

  const adminStore = useAdminStore();

  // If not already authenticated in memory, try to restore from localStorage.
  // restoreSession() already calls verifyToken() internally, so we do NOT call
  // verifyToken() again afterwards — that would be a redundant backend hit on
  // every navigation.
  if (!adminStore.isAuthenticated) {
    const sessionRestored = await adminStore.restoreSession();

    if (!sessionRestored) {
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
      console.warn(`Access denied. Required role: ${to.meta.requiredRole}`);
      return navigateTo('/admin/unauthorized');
    }
  }

  // Reject data_consumer from admin portal
  if (adminStore.getRole === 'data_consumer') {
    console.warn('Data consumer cannot access admin portal');
    return navigateTo(adminStore.getDashboardRoute);
  }
});
