// Whether the customer's refresh token is kept only in the API's HttpOnly
// cookie (NUXT_PUBLIC_COOKIE_REFRESH=true) instead of in localStorage. Needs the
// app and the API on the same site (e.g. medsgh.com and api.medsgh.com),
// because the cookie is SameSite=Strict.
export function cookieRefreshEnabled(): boolean {
  try {
    const flag = useRuntimeConfig().public['cookieRefresh'] as unknown
    return flag === true || flag === 'true'
  } catch {
    return false
  }
}
