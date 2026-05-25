// services/ads/adsService.js
//
// Ads domain service. All HTTP for pharmacy advertisement endpoints lives
// here. Public API: a single factory that takes an `api` (the useApi wrapper)
// and returns a plain object of async functions. Pages / stores import the
// factory, hand it `useApi()`, and call the functions.
//
// Why a factory: lets the caller inject `useApi()` once (which itself reads
// runtimeConfig and the auth token) so the service stays framework-agnostic
// and trivially mockable in tests.
//
// Public behavior MUST mirror the legacy in-page fetch calls exactly: same
// paths, same method, same query shape. Response envelope handling
// (`{ success, data, message }`) is performed by the caller, not here.

export const createAdsService = (api) => ({
  /**
   * Fetch the public active ads for a pharmacy (company).
   * This endpoint is public — no auth header needed.
   * GET /api/companies/:companyId/ads/public
   * Returns: { data: Ad[] }
   */
  listPublic(companyId) {
    return api.get(`/api/companies/${companyId}/ads/public`)
  },
})
