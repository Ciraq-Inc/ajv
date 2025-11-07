// middleware/companyAuth.js
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip on server side
  if (process.server) return

  const companyStore = useCompanyStore()

  // Check if user is already authenticated
  await companyStore.checkAuthState()

  // If not logged in and not on login page, redirect to login
  if (!companyStore.isLoggedIn && !to.path.includes('/login')) {
    const companyDomain = to.path.match(/\/([^\/]+)\/services/)?.[1]
    return navigateTo(`/${companyDomain}/services/login`)
  }

  // If logged in and on login page, redirect to dashboard
  if (companyStore.isLoggedIn && to.path.includes('/login')) {
    const companyDomain = to.path.match(/\/([^\/]+)\/services/)?.[1]
    return navigateTo(`/${companyDomain}/services/sms-campaigns`)
  }
})
