// services/storeSettings/storeSettingsService.js
//
// Store-settings domain service. Owns all HTTP for the company-portal
// "Shopfront Customization" page: the `/api/companies/:id/store-settings`
// GET + PUT, the `/api/companies/:id/ads` CRUD endpoints, and the
// `/api/companies/:id/shop-assets/*` multipart uploads (logo, banner,
// ad image).
//
// Factory shape mirrors `services/companyAuth/companyAuthService.js`:
// callers pass the `useApi()` wrapper and a `getHeaders` provider so
// the per-request company auth header (and any future scoping headers)
// is recomputed at call time. The service is a thin HTTP pipe; the
// caller (the page, for now) keeps envelope handling (`success`/`data`
// destructuring and `throw` on `!data.success`) identical to the
// legacy inline implementation. `useApi` already throws on non-2xx.
//
// FormData uploads route through `useApi` post the fix in
// composables/useApi.js — when `options.body instanceof FormData`,
// `useApi` skips the default `application/json` Content-Type so the
// browser can set the correct multipart boundary.

export const createStoreSettingsService = (api, getHeaders = () => ({})) => {
  const withHeaders = (options = {}) => ({
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  return {
    /**
     * Fetch the authenticated company's full store-settings payload
     * (branding, theme, hide_prices, etc.).
     * GET /api/companies/:companyId/store-settings
     */
    getSettings(companyId) {
      return api.get(`/api/companies/${companyId}/store-settings`, withHeaders());
    },

    /**
     * Update store-settings (branding/theme/hide_prices). Caller is
     * responsible for shaping `payload` to the legacy contract.
     * PUT /api/companies/:companyId/store-settings
     */
    updateSettings(companyId, payload) {
      return api.put(
        `/api/companies/${companyId}/store-settings`,
        payload,
        withHeaders()
      );
    },

    /**
     * List the company's promotional ads.
     * GET /api/companies/:companyId/ads
     */
    listAds(companyId) {
      return api.get(`/api/companies/${companyId}/ads`, withHeaders());
    },

    /**
     * Create a new ad on the company storefront.
     * POST /api/companies/:companyId/ads
     */
    createAd(companyId, payload) {
      return api.post(`/api/companies/${companyId}/ads`, payload, withHeaders());
    },

    /**
     * Update an existing ad.
     * PUT /api/companies/:companyId/ads/:adId
     */
    updateAd(companyId, adId, payload) {
      return api.put(
        `/api/companies/${companyId}/ads/${adId}`,
        payload,
        withHeaders()
      );
    },

    /**
     * Delete an ad.
     * DELETE /api/companies/:companyId/ads/:adId
     */
    deleteAd(companyId, adId) {
      return api.delete(`/api/companies/${companyId}/ads/${adId}`, withHeaders());
    },

    /**
     * Upload a shop asset (logo, banner, or ad image) via multipart
     * form. `endpointSuffix` is the path tail under the company's
     * shop-assets namespace, e.g. `/shop-assets/logo`,
     * `/shop-assets/banner`, `/shop-assets/ad-image`. The legacy code
     * inlined this `FormData` construction at three call sites; the
     * service consolidates it into one helper. Returns the raw
     * envelope so callers retain identical `data.success` / `data.data.url`
     * handling.
     *
     * NB: relies on the useApi FormData fix — `Content-Type` must NOT
     * be forced to `application/json` here so the browser can emit
     * the correct multipart boundary.
     * POST /api/companies/:companyId<endpointSuffix>
     */
    uploadShopAsset(companyId, endpointSuffix, file) {
      const formData = new FormData();
      formData.append('image', file);
      // Route through useApi.request so auth + base URL handling stays
      // in one place. We pass the raw FormData via `body`; useApi's
      // FormData branch omits the JSON Content-Type default.
      return api.request(
        `/api/companies/${companyId}${endpointSuffix}`,
        withHeaders({
          method: 'POST',
          body: formData,
        })
      );
    },
  };
};
