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
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/${companyDomain}/services/login?redirect=${redirect}`)
  }

  // If logged in and on login page, redirect to dashboard
  if (companyStore.isLoggedIn && to.path.includes('/login')) {
    const companyDomain = to.path.match(/\/([^\/]+)\/services/)?.[1]
    const redirectTarget = typeof to.query?.redirect === 'string' ? to.query.redirect : ''
    if (redirectTarget) {
      return navigateTo(decodeURIComponent(redirectTarget))
    }
    // Route recruiters to rigel-boards, others to sms-campaigns
    const defaultDashboard = companyStore.userRole === 'third_party_poster' 
      ? `/${companyDomain}/services/rigel-boards`
      : `/${companyDomain}/services/sms-campaigns`
    return navigateTo(defaultDashboard)
  }
})
