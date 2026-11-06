// middleware/companyAuth.js
import { canOpenServicePage, defaultServicePage, serviceSlugOf } from '~/utils/companyAccess'
import { safeInternalPath } from '~/utils/safeInternalPath'

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
    const redirectTarget = safeInternalPath(typeof to.query?.redirect === 'string' ? to.query.redirect : null)
    if (redirectTarget) {
      return navigateTo(redirectTarget)
    }
    // Recruiters land on the hiring board, everyone else on orders
    const defaultDashboard = `/${companyDomain}/services/${defaultServicePage(companyStore.userRole)}`
    return navigateTo(defaultDashboard)
  }

  // A role that may not open this page goes to its own landing page instead
  if (companyStore.isLoggedIn) {
    const slug = serviceSlugOf(to.path)
    if (slug && !canOpenServicePage(companyStore.userRole, slug)) {
      const companyDomain = to.path.match(/\/([^\/]+)\/services/)?.[1]
      return navigateTo(`/${companyDomain}/services/${defaultServicePage(companyStore.userRole)}`)
    }
  }
})
